// geckoOptimizedScreenshare.js
export async function startGeckoOptimizedScreenShare(wsUrl, wtUrl, options = {}) {
  try {
    const { captureAudio = false, maxFPS = 30, minFPS = 5 } = options;

    // --- 1. Detect environment ---
    const isWeb = typeof window !== 'undefined' && 'navigator' in window;
    const userAgent = navigator.userAgent.toLowerCase();
    const isGecko = userAgent.includes('gecko') && !userAgent.includes('chrome');

    if (!isGecko) console.warn('Module optimized for Gecko (Firefox).');

    // --- 2. WebSocket for signaling ---
    const ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => console.log('Signaling WS connected'));
    ws.addEventListener('message', (msg) => console.log('WS msg:', msg.data));

    // --- 3. Capture screen ---
    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: captureAudio && isWeb
    });
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    let width = settings.width || 1280;
    let height = settings.height || 720;
    let fps = Math.min(settings.frameRate || 15, maxFPS);

    // --- 4. Hidden video element ---
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // --- 5. Canvas for delta-frame encoding ---
    let canvas, ctx, prevCanvas, prevCtx;

    // Use offscreen canvas if available (Gecko performance boost)
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d');
      prevCanvas = new OffscreenCanvas(width, height);
      prevCtx = prevCanvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
      prevCanvas = document.createElement('canvas');
      prevCanvas.width = width;
      prevCanvas.height = height;
      prevCtx = prevCanvas.getContext('2d');
    }

    // --- 6. Transport: WebTransport (if Gecko supports) or fallback WebSocket ---
    let transport, writer;
    if (isWeb && 'WebTransport' in window) {
      transport = new WebTransport(wtUrl);
      await transport.ready;
      writer = transport.datagrams.writable.getWriter();
      console.log('Using WebTransport for streaming');
    } else {
      transport = ws;
      writer = { write: (buffer) => transport.send(buffer) };
      console.log('Using WebSocket fallback for streaming');
    }

    let lastSendTime = performance.now();

    // --- 7. Delta-frame + adaptive streaming ---
    const sendFrame = async () => {
      if (transport.closed || (transport.readyState && transport.readyState !== WebSocket.OPEN)) return;

      const now = performance.now();
      const deltaTime = now - lastSendTime;

      // Adaptive downgrade for weak hardware
      if (deltaTime > (1000 / fps) * 1.5) {
        fps = Math.max(minFPS, Math.floor(fps * 0.8));
        width = Math.max(320, Math.floor(width * 0.8));
        height = Math.max(180, Math.floor(height * 0.8));
        canvas.width = width;
        canvas.height = height;
        prevCanvas.width = width;
        prevCanvas.height = height;
        console.log(`Downgraded: ${width}x${height} @ ${fps} FPS`);
      }

      // Draw current frame
      ctx.drawImage(video, 0, 0, width, height);

      // Compute delta between current and previous frame
      const current = ctx.getImageData(0, 0, width, height);
      const prev = prevCtx.getImageData(0, 0, width, height);
      const deltaPixels = new Uint8ClampedArray(current.data.length);
      let changed = false;

      for (let i = 0; i < current.data.length; i++) {
        const diff = current.data[i] - prev.data[i];
        deltaPixels[i] = diff;
        if (!changed && diff !== 0) changed = true;
      }

      if (changed) {
        prevCtx.putImageData(current, 0, 0);

        // Encode delta as WebP (quality tuned for Gecko)
        const deltaCanvas = canvas instanceof OffscreenCanvas ? canvas : document.createElement('canvas');
        deltaCanvas.width = width;
        deltaCanvas.height = height;
        const deltaCtx = deltaCanvas.getContext('2d');
        deltaCtx.putImageData(new ImageData(deltaPixels, width, height), 0, 0);

        const blob = await new Promise(res => deltaCanvas.convertToBlob
          ? deltaCanvas.convertToBlob({ type: 'image/webp', quality: 0.7 }).then(res)
          : deltaCanvas.toBlob(res, 'image/webp', 0.7)
        );
        if (blob) {
          const buffer = await blob.arrayBuffer();
          await writer.write(buffer);
        }
      }

      lastSendTime = performance.now();
      setTimeout(sendFrame, Math.max(1000 / fps, 1000 / minFPS));
    };

    sendFrame();

    // --- 8. Optional audio capture (Gecko WebAudio) ---
    if (captureAudio && isWeb) {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) buffer[i] = input[i] * 0x7fff;
        writer.write(buffer.buffer).catch(() => {});
      };
    }

    // --- 9. Stop handling ---
    videoTrack.addEventListener('ended', () => {
      console.log('Screenshare stopped');
      writer.close?.();
      transport.close?.();
      ws.close();
    });

    return { ws, transport, stream };
  } catch (err) {
    console.error('Gecko-optimized screenshare failed:', err);
  }
}

// Example usage:
// startGeckoOptimizedScreenShare(
//   'wss://your-signaling-server',
//   'https://your-webtransport-server',
//   { captureAudio: true, maxFPS: 30, minFPS: 5 }
// );
