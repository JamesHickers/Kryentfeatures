(async () => {
  // ------------------------
  // LOAD LIBRARIES
  // ------------------------
  const [FingerprintJS, platform] = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@4.4.1/dist/fp.min.js'),
    import('https://cdn.jsdelivr.net/npm/platform@1.3.6/platform.js')
  ]);

  const fpInstance = await FingerprintJS.load();
  let fingerprint = (await fpInstance.get()).visitorId;

  // ------------------------
  // ENVIRONMENT DETECTION
  // ------------------------
  function getEnv() {
    const os = platform.os?.family || 'Unknown';
    const browser = platform.name || 'Unknown';
    const engine = platform.layout || 'Unknown';
    const device = /Mobile|Tablet/i.test(platform.product) ? 'Mobile' : 'Desktop';

    const privacySignals = {
      doNotTrack: navigator.doNotTrack === '1',
      globalPrivacyControl: navigator.globalPrivacyControl === true,
      cookies: navigator.cookieEnabled,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      colorDepth: screen.colorDepth || 0,
      screenSize: { width: screen.width, height: screen.height },
      plugins: navigator.plugins?.length || 0
    };

    const adblock = (() => {
      const bait = document.createElement('div');
      bait.className = 'ads ad adsbox doubleclick ad-placement';
      bait.style.height = '1px';
      document.body.appendChild(bait);
      const result = bait.offsetHeight === 0;
      bait.remove();
      return result;
    })();

    const webRTCLeak = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);

    const canvasEntropy = (() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '16px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('KrynetFP', 2, 15);
        return canvas.toDataURL().length;
      } catch { return null; }
    })();

    const webglFingerprint = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return null;
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debug) return null;
        return {
          vendor: gl.getParameter(debug.UNMASKED_VENDOR_WEBGL),
          renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        };
      } catch { return null; }
    })();

    const torLikely = screen.width === 1000 && screen.height === 1000 && navigator.hardwareConcurrency <= 2;
    const proxyHint = navigator.connection?.rtt > 400;

    // ------------------------
    // PRIVACY & SECURITY SCORING
    // ------------------------
    let privacyScore = 50;
    let securityScore = 50;

    if (/Linux/i.test(os)) { privacyScore += 35; securityScore += 30; }
    if (/macOS/i.test(os)) { privacyScore += 15; securityScore += 20; }
    if (/Windows/i.test(os)) { privacyScore -= 10; securityScore += 10; }
    if (/Android|iOS/i.test(os)) { privacyScore += 10; securityScore += 15; }

    if (engine === 'Gecko') { privacyScore += 30; securityScore += 20; }
    if (engine === 'WebKit') { privacyScore += 20; securityScore += 20; }
    if (engine === 'Blink') { privacyScore -= 40; securityScore += 20; }

    switch (browser) {
      case 'Tor Browser': privacyScore += 70; securityScore += 40; break;
      case 'LibreWolf': privacyScore += 55; securityScore += 30; break;
      case 'Mull': privacyScore += 55; securityScore += 30; break;
      case 'Firefox': privacyScore += 35; securityScore += 25; break;
      case 'Brave': privacyScore += 25; securityScore += 25; break;
      case 'Safari': privacyScore += 20; securityScore += 30; break;
      default: privacyScore -= 50; securityScore += 10; break;
    }

    if (privacySignals.doNotTrack) privacyScore += 5;
    if (privacySignals.globalPrivacyControl) privacyScore += 5;
    if (adblock) privacyScore += 10;
    if (torLikely) privacyScore += 30;

    if (fingerprint) privacyScore -= 5;
    if (canvasEntropy) privacyScore -= 5;
    if (webglFingerprint) privacyScore -= 5;

    return {
      os, browser, engine, device,
      privacySignals, adblock, webRTCLeak, proxyHint,
      torLikely, fingerprint, canvasEntropy, webglFingerprint,
      privacyScore, securityScore
    };
  }

  // ------------------------
  // OVERLAY & RECOMMENDATION
  // ------------------------
  let advisoryOverlay = null;
  function showOverlay(env) {
    if (!advisoryOverlay) {
      advisoryOverlay = document.createElement('div');
      Object.assign(advisoryOverlay.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0a0a', color: 'white', zIndex: 999999,
        padding: '40px', fontFamily: 'system-ui', overflow: 'auto'
      });
      document.body.appendChild(advisoryOverlay);
    }

    const maxScore = 100;
    const privacyPercent = Math.min(env.privacyScore, maxScore);
    const securityPercent = Math.min(env.securityScore, maxScore);

    // Recommended setups with info bubbles
    const recommended = [
      { name: "Linux + Firefox", icon: "https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png", info: "Open-source OS with Gecko-based Firefox: strong privacy and control." },
      { name: "LibreWolf", icon: "https://upload.wikimedia.org/wikipedia/commons/0/08/Firefox_LibreWolf_Logo.svg", info: "Privacy-focused Firefox fork, no telemetry, hardened security." },
      { name: "Tor Browser", icon: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Tor_Browser_Logo.svg", info: "Gecko-based with Tor network integration for maximum anonymity." }
    ];

    advisoryOverlay.innerHTML = `
      <h1>Krynet Browser Advisory</h1>
      <h2>Detected Environment</h2>
      <ul>
        <li>OS: ${env.os}</li>
        <li>Browser: ${env.browser}</li>
        <li>Engine: ${env.engine}</li>
        <li>Device: ${env.device}</li>
        <li>Adblock: ${env.adblock}</li>
        <li>WebRTC Leak Risk: ${env.webRTCLeak}</li>
        <li>Tor Likely: ${env.torLikely}</li>
      </ul>

      <h2>Privacy & Security Scores</h2>
      <div style="display:flex;gap:10px;">
        <div style="flex:1">
          <div style="background:#333;width:100%;height:20px;border-radius:10px">
            <div style="background:#4CAF50;width:${privacyPercent}%;height:20px;border-radius:10px"></div>
          </div>
          <div style="text-align:center">Privacy Score: ${env.privacyScore}</div>
        </div>
        <div style="flex:1">
          <div style="background:#333;width:100%;height:20px;border-radius:10px">
            <div style="background:#2196F3;width:${securityPercent}%;height:20px;border-radius:10px"></div>
          </div>
          <div style="text-align:center">Security Score: ${env.securityScore}</div>
        </div>
      </div>

      <h2>Recommended Privacy-Friendly Browsers</h2>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        ${recommended.map(r => `
          <div style="text-align:center;position:relative;">
            <img src="${r.icon}" width="60" style="cursor:pointer;">
            <div style="position:absolute;bottom:70px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:6px 10px;border-radius:6px;white-space:nowrap;opacity:0;transition:opacity 0.3s;pointer-events:none;" class="info-bubble">${r.info}</div>
            <div>${r.name}</div>
          </div>`).join('')}
      </div>

      <p style="color:orange;margin-top:20px;">
        ${env.engine === 'Gecko' ? '✅ Gecko engine detected. Full Krynet privacy enabled.' 
        : '⚠️ You are not using a Gecko-based browser. For maximum privacy, consider one of the recommended setups above.'}
      </p>
    `;

    // Add hover tooltips
    const bubbles = advisoryOverlay.querySelectorAll('.info-bubble');
    advisoryOverlay.querySelectorAll('img').forEach((img, i) => {
      img.addEventListener('mouseenter', () => bubbles[i].style.opacity = '1');
      img.addEventListener('mouseleave', () => bubbles[i].style.opacity = '0');
    });
  }

  // ------------------------
  // REAL-TIME MONITOR
  // ------------------------
  let lastEnv = getEnv();
  showOverlay(lastEnv);
  console.log("Krynet Audit Initial:", lastEnv);

  setInterval(async () => {
    const newFPResult = await fpInstance.get();
    fingerprint = newFPResult.visitorId;
    const env = getEnv();

    const scoreChanged = env.privacyScore !== lastEnv.privacyScore || env.securityScore !== lastEnv.securityScore;
    const fpChanged = env.fingerprint !== lastEnv.fingerprint;

    if (scoreChanged || fpChanged) {
      showOverlay(env);
      console.log("Krynet Audit Updated:", env);
      lastEnv = env;
    }
  }, 5000);
})();
