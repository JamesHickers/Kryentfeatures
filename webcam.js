(async () => {

  // ===== LOAD LIBSODIUM =====
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/libsodium-wrappers/dist/libsodium-wrappers.min.js";
  document.head.appendChild(s);
  await new Promise(r => s.onload = r);
  await sodium.ready;

  // ===== CONNECT (KRYNET API REQUIRED) =====
  const conn = await KrynetAPI.connect();

  // ===== KEY EXCHANGE =====
  const kp = sodium.crypto_kx_keypair();
  let sharedKey = null;

  conn.send({
    t: "k",
    k: Array.from(kp.publicKey)
  });

  conn.onMessage((msg) => {
    if (msg.t === "k") {
      const other = new Uint8Array(msg.k);

      const shared = sodium.crypto_scalarmult(
        kp.privateKey,
        other
      );

      sharedKey = sodium.crypto_generichash(32, shared);
    }
  });

  // ===== CAMERA =====
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const track = stream.getVideoTracks()[0];

  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  document.body.appendChild(video);

  // ===== ENCODER =====
  const encoder = new VideoEncoder({
    output: handleEncodedChunk,
    error: console.error
  });

  encoder.configure({
    codec: "vp8",
    width: 640,
    height: 480,
    bitrate: 300000,
    framerate: 24
  });

  // ===== DECODER =====
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  const decoder = new VideoDecoder({
    output: frame => {
      ctx.drawImage(frame, 0, 0);
      frame.close();
    },
    error: console.error
  });

  decoder.configure({ codec: "vp8" });

  // ===== ENCODED CHUNK HANDLER =====
  function handleEncodedChunk(chunk) {
    if (!sharedKey) return;

    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);

    const nonce = sodium.randombytes_buf(
      sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES
    );

    const encrypted = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
      data,
      null,
      null,
      nonce,
      sharedKey
    );

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

      const chunk = new EncodedVideoChunk({
        type: msg.ft,
        timestamp: msg.ts,
        data: decrypted
      });

      decoder.decode(chunk);

    } catch (e) {
      console.error("decrypt fail", e);
    }
  });

  // ===== STREAM PIPELINE (REAL) =====
  const processor = new MediaStreamTrackProcessor({ track });
  const reader = processor.readable.getReader();

  async function pump() {
    while (true) {
      const { value: frame } = await reader.read();

      encoder.encode(frame);
      frame.close();
    }
  }

  pump();

})();
