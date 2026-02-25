/**
 * Client-side inactivity kicker (1m30s)
 * Disconnects user automatically after inactivity
 */

class InactivityKicker {
  constructor(disconnectCallback, timeoutMs = 90_000) {
    this.timeoutMs = timeoutMs;
    this.disconnectCallback = disconnectCallback;
    this.lastActive = Date.now();
    this.init();
  }

  init() {
    // Update activity on keyboard/mouse events
    ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => this.resetTimer(), { passive: true });
    });

    // Update activity on microphone usage
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(2048, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          // Consider user active if any audio above threshold
          const max = Math.max(...input.map(Math.abs));
          if (max > 0.001) this.resetTimer();
        };
      }).catch(console.error);
    }

    // Periodic check
    this.interval = setInterval(() => {
      if (Date.now() - this.lastActive > this.timeoutMs) {
        this.disconnect();
      }
    }, 1000);
  }

  resetTimer() {
    this.lastActive = Date.now();
  }

  disconnect() {
    clearInterval(this.interval);
    console.log('User inactive for 1m30s, disconnecting from VC');
    if (this.disconnectCallback) this.disconnectCallback();
  }
}
