// adaptiveHardwareScreenshare.js
// Hardware-accelerated, adaptive, WebRTC-free screenshare skeleton

export async function startHardwareScreenshare(wsUrl, wtUrl, options = {}) {
  const {
    captureAudio = false,
    minWidth = 320,
    minHeight = 180,
    minFPS = 5,
    maxFPS = 60,
  } = options;

  let stream, videoTrack, video, canvas, ctx, audioProcessor, writer, transport;

  try {
    // --- 1. Capture screen ---
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: captureAudio });
    videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    let width = settings.width || 1280;
    let height = settings.height || 720;
    let fps = Math.min(settings.frameRate || 30, maxFPS);

    // --- 2. Video element (offscreen) ---
    video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    await video.play();

    // --- 3. Canvas (Offscreen if available) ---
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
    }

    // --- 4. Transport setup (WebTransport / WebSocket fallback) ---
    if ('WebTransport' in window) {
      transport = new WebTransport(wtUrl);
      await transport.ready;
      writer = transport.datagrams.writable.getWriter();
      console.log('Using WebTransport');
    } else {
      transport = new WebSocket(wsUrl);
      writer = { write: (data) => transport.send(data) };
      console.log('Using WebSocket fallback');
    }

    // --- 5. Detect platform & GPU / hardware upscaler ---
    const isAndroid = /android/i.test(navigator.userAgent);
    const isApple = /mac|iphone|ipad/i.test(navigator.userAgent);
    const isNvidia = false; // placeholder: implement native check in native apps
    const isAMD = false;
    const isIntel = false;

    const applyHardwareUpscaler = (frameCanvas) => {
      // Placeholder: in native apps, hook DLSS/FSR/XeSS/MetalFX/ASR
      // Browser fallback: simple WebGPU or shader-based upscaler
      return frameCanvas; // return frameCanvas after upscaling
    };

    let lastSendTime = performance.now();

    // --- 6. Frame loop (adaptive + hardware accelerated) ---
    const sendFrame = async () => {
      if ((transport.readyState && transport.readyState !== WebSocket.OPEN) || transport.closed) return;

      const now = performance.now();
      const deltaTime = now - lastSendTime;

      // Adaptive downscale if frames are late
      if (deltaTime > 1000 / fps * 1.5) {
        fps = Math.max(minFPS, Math.floor(fps * 0.8));
        width = Math.max(minWidth, Math.floor(width * 0.8));
        height = Math.max(minHeight, Math.floor(height * 0.8));
        canvas.width = width;
        canvas.height = height;
        console.log(`Downscaled to ${width}x${height} @ ${fps} FPS`);
      }

      // Draw video frame
      ctx.drawImage(video, 0, 0, width, height);

      // Hardware upscaling
      const upscaledCanvas = applyHardwareUpscaler(canvas);

      // Encode frame
      const blob = await (upscaledCanvas.convertToBlob
        ? upscaledCanvas.convertToBlob({ type: 'image/webp', quality: 0.7 })
        : new Promise((res) => upscaledCanvas.toBlob(res, 'image/webp', 0.7))
      );
      if (blob) {
        const buffer = await blob.arrayBuffer();
        await writer.write(buffer); // send frame
      }

      lastSendTime = performance.now();
      setTimeout(sendFrame, Math.max(1000 / fps, 1000 / minFPS));
    };
    sendFrame();

    // --- 7. Optional lightweight audio capture ---
    if (captureAudio && stream.getAudioTracks().length) {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
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

    // --- 8. Stop / cleanup handler ---
    const stopHandler = () => {
      try {
        writer.close?.();
        transport.close?.();
        videoTrack.stop?.();
        if (audioProcessor) audioProcessor.disconnect();
        if (video) video.srcObject = null;
        canvas = ctx = video = audioProcessor = null; // clear references
        console.log('Screenshare stopped, resources released');
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    };

    videoTrack.addEventListener('ended', stopHandler);

    return { stream, transport, stop: stopHandler };
  } catch (err) {
    console.error('Hardware-accelerated screenshare failed:', err);
    // Ensure cleanup on failure
    if (videoTrack) videoTrack.stop?.();
    canvas = ctx = video = audioProcessor = null;
  }
}
