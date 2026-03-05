export async function startMonitorAdaptiveScreenshare(wsUrl, wtUrl, options = {}) {
  const {
    captureAudio = true,
    videoQuality = 0.9,
    useSpatialAudio = false,
  } = options;

  let stream, videoTrack, video, canvas, ctx, writer, transport, audioProcessor;
  let width, height, maxFPS, minFPS, fps;

  try {
    // --- 1. Detect monitor resolution and FPS ---
    width = window.screen.width;
    height = window.screen.height;

    // Measure approximate monitor refresh rate
    minFPS = 5; // safe fallback
    maxFPS = 60; // fallback if measurement fails
    const sampleFrames = 60;
    let frameTimes = [];
    let lastTime = performance.now();

    await new Promise((res) => {
      let count = 0;
      function measure() {
        const now = performance.now();
        frameTimes.push(now - lastTime);
        lastTime = now;
        count++;
        if (count < sampleFrames) requestAnimationFrame(measure);
        else res();
      }
      requestAnimationFrame(measure);
    });

    const avgFrame = frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length;
    maxFPS = Math.round(1000 / avgFrame);
    fps = maxFPS; // start at max

    // --- 2. Capture screen ---
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: captureAudio });
    videoTrack = stream.getVideoTracks()[0];

    // --- 3. Video element ---
    video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    await video.play();

    // --- 4. Canvas ---
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    // --- 5. WebTransport / WebSocket ---
    if ('WebTransport' in window) {
      transport = new WebTransport(wtUrl);
      await transport.ready;
      writer = transport.datagrams.writable.getWriter();
    } else {
      transport = new WebSocket(wsUrl);
      writer = { write: (data) => transport.send(data) };
    }

    // --- 6. Lightweight GPU upscale shader (WebGPU) ---
    if (!navigator.gpu) throw new Error('WebGPU not supported');
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'premultiplied' });

    // --- 7. Adaptive frame loop ---
    let lastSend = performance.now();
    const sendFrame = async () => {
      if ((transport.readyState && transport.readyState !== WebSocket.OPEN) || transport.closed) return;
      const now = performance.now();
      const delta = now - lastSend;

      // Simple network-adaptive downscale
      if (delta > 1000 / fps * 1.5) fps = Math.max(minFPS, Math.floor(fps * 0.85));

      ctx.drawImage(video, 0, 0, width, height);

      // Encode
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: videoQuality });
      const buffer = await blob.arrayBuffer();
      await writer.write(buffer);

      lastSend = performance.now();
      setTimeout(sendFrame, Math.max(1000 / fps, 1000 / minFPS));
    };
    sendFrame();

    // --- 8. Audio ---
    if (captureAudio && stream.getAudioTracks().length) {
      const audioCtx = new AudioContext({ sampleRate: 48000 });
      const source = audioCtx.createMediaStreamSource(stream);

      if (useSpatialAudio) {
        const panner = audioCtx.createPanner();
        panner.panningModel = 'HRTF';
        source.connect(panner).connect(audioCtx.destination);
      } else {
        source.connect(audioCtx.destination);
      }

      audioProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
      source.connect(audioProcessor);
      audioProcessor.connect(audioCtx.destination);

      audioProcessor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const buf = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) buf[i] = input[i] * 0x7fff;
        writer.write(buf.buffer).catch(() => {});
      };
    }

    // --- 9. Stop / cleanup ---
    const stop = () => {
      try {
        writer.close?.();
        transport.close?.();
        videoTrack.stop?.();
        if (audioProcessor) audioProcessor.disconnect();
        video.srcObject = null;
        canvas = ctx = video = audioProcessor = null;
      } catch (err) { console.error('Cleanup error:', err); }
      console.log('Monitor-adaptive screenshare stopped');
    };
    videoTrack.addEventListener('ended', stop);
    return { stream, transport, stop };

  } catch (err) {
    console.error('Monitor-adaptive screenshare failed:', err);
    if (videoTrack) videoTrack.stop?.();
    canvas = ctx = video = audioProcessor = null;
  }
}
