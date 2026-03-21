(async () => {
  // ===== LOAD LIBSODIUM =====
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/libsodium-wrappers/dist/libsodium-wrappers.min.js";
  document.head.appendChild(s);
  await new Promise(r => s.onload = r);
  await sodium.ready;

  // ===== CONNECT (KRYNET API) =====
  const conn = await KrynetAPI.connect();

  // ===== EPHEMERAL KEY EXCHANGE =====
  const kp = sodium.crypto_kx_keypair();
  let sharedKey = null;
  conn.send({ t: "k", k: Array.from(kp.publicKey) });
  conn.onMessage((msg) => {
    if (msg.t === "k") {
      const other = new Uint8Array(msg.k);
      const shared = sodium.crypto_scalarmult(kp.privateKey, other);
      sharedKey = sodium.crypto_generichash(32, shared);
    }
  });

  // ===== CAMERA =====
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const track = stream.getVideoTracks()[0];

  const videoEl = document.createElement("video");
  videoEl.srcObject = stream;
  videoEl.autoplay = true;
  videoEl.muted = true;
  videoEl.playsInline = true;
  document.body.appendChild(videoEl);

  // ===== CANVAS / DECODER =====
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  const decoder = new VideoDecoder({
    output: (frame) => {
      // Auto adjust canvas size to frame
      if (canvas.width !== frame.codedWidth || canvas.height !== frame.codedHeight) {
        canvas.width = frame.codedWidth;
        canvas.height = frame.codedHeight;
      }
      ctx.drawImage(frame, 0, 0);
      frame.close();
    },
    error: console.error
  });
  decoder.configure({ codec: "vp8" });

  // ===== ENCODER =====
  let targetBitrate = 300_000;
  const encoder = new VideoEncoder({
    output: handleEncodedChunk,
    error: console.error
  });

  function configureEncoder(width, height, bitrate = targetBitrate) {
    encoder.configure({ codec: "vp8", width, height, bitrate, framerate: 24 });
  }

  // Initial resolution detection
  const trackSettings = track.getSettings();
  configureEncoder(trackSettings.width || 640, trackSettings.height || 480);

  // ===== ENCODED CHUNK HANDLER =====
  function handleEncodedChunk(chunk) {
    if (!sharedKey) return;

    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);

    const nonce = sodium.randombytes_buf(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
    const encrypted = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(data, null, null, nonce, sharedKey);

    conn.send({
      t: "v",
      n: Array.from(nonce),
      d: Array.from(encrypted),
      ts: chunk.timestamp,
      ft: chunk.type
    });
  }

  // ===== RECEIVE VIDEO =====
  conn.onMessage((msg) => {
    if (msg.t !== "v" || !sharedKey) return;
    try {
      const decrypted = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
        null,
        new Uint8Array(msg.d),
        null,
        new Uint8Array(msg.n),
        sharedKey
      );
      decoder.decode(new EncodedVideoChunk({
        type: msg.ft,
        timestamp: msg.ts,
        data: decrypted
      }));
    } catch (e) {
      console.error("decrypt fail", e);
    }
  });

  // ===== ADAPTIVE BITRATE & CPU-AWARE ENCODING =====
  let lastFrameTime = performance.now();
  const FRAME_INTERVAL = 40; // ~25FPS
  async function adaptivePump() {
    const processor = new MediaStreamTrackProcessor({ track });
    const reader = processor.readable.getReader();

    while (true) {
      const { value: frame } = await reader.read();
      const now = performance.now();

      // Throttle FPS
      if (now - lastFrameTime >= FRAME_INTERVAL) {
        encoder.encode(frame);
        lastFrameTime = now;
      }

      // Adaptive bitrate (simple heuristic)
      const cpuLoad = navigator.hardwareConcurrency ? 1 / navigator.hardwareConcurrency : 0.5;
      if (cpuLoad > 0.75) targetBitrate = Math.max(100_000, targetBitrate * 0.8);
      else targetBitrate = Math.min(800_000, targetBitrate * 1.05);
      configureEncoder(frame.codedWidth, frame.codedHeight, targetBitrate);

      frame.close();
    }
  }

  adaptivePump();

  // ===== CAMERA ON/OFF CONTROL =====
  let cameraOn = true;
  window.toggleCamera = () => {
    cameraOn = !cameraOn;
    track.enabled = cameraOn;
    conn.send({ t: "cam", state: cameraOn });
  };

})();
