(async () => {

  // === LOAD LIBSODIUM ===
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/libsodium-wrappers/dist/libsodium-wrappers.min.js";
  document.head.appendChild(s);
  await new Promise(r => s.onload = r);
  await sodium.ready;

  // === CONNECT (KRYNET PROXY ENDPOINT) ===
  const ws = new WebSocket("wss://krynet-api.example/ws");

  // === EPHEMERAL KEYS ===
  const kp = sodium.crypto_kx_keypair();
  let videoKey = null;

  // === SEND PUBLIC KEY ===
  ws.onopen = () => {
    ws.send(JSON.stringify({
      t: "k",
      k: Array.from(kp.publicKey)
    }));
  };

  // === RECEIVE ===
  ws.onmessage = async (msg) => {
    const d = JSON.parse(msg.data);

    // --- KEY EXCHANGE ---
    if (d.t === "k") {
      const other = new Uint8Array(d.k);

      const shared = sodium.crypto_scalarmult(
        kp.privateKey,
        other
      );

      const root = sodium.crypto_generichash(32, shared);
      videoKey = sodium.crypto_generichash(32, root, "video");

      return;
    }

    if (!videoKey) return;

    // --- DECRYPT FRAME ---
    const dec = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
      null,
      new Uint8Array(d.d),
      null,
      new Uint8Array(d.n),
      videoKey
    );

    decoder.decode(new EncodedVideoChunk({
      type: d.f,
      timestamp: d.t,
      data: dec
    }));
  };

  // === CAMERA ===
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });

  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  document.body.appendChild(video);

  // === ENCODER ===
  const encoder = new VideoEncoder({
    output: (chunk) => {
      if (!videoKey || ws.readyState !== 1) return;

      const buf = new Uint8Array(chunk.byteLength);
      chunk.copyTo(buf);

      const nonce = sodium.randombytes_buf(12);

      const enc = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
        buf,
        null,
        null,
        nonce,
        videoKey
      );

      ws.send(JSON.stringify({
        n: Array.from(nonce),
        d: Array.from(enc),
        t: chunk.timestamp,
        f: chunk.type
      }));
    },
    error: console.error
  });

  encoder.configure({
    codec: "vp8",
    width: 640,
    height: 480,
    bitrate: 350000,
    framerate: 24
  });

  // === DECODER ===
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

  // === FRAME LOOP (LOW LEAKAGE STYLE) ===
  const track = stream.getVideoTracks()[0];
  const processor = new MediaStreamTrackProcessor({ track });
  const reader = processor.readable.getReader();

  while (true) {
    const { value: frame } = await reader.read();

    encoder.encode(frame);
    frame.close();
  }

})();
