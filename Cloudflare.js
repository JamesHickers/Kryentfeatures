// Cloudflare.js - full anti-bot + hCaptcha wrapping
(function() {
  const HCAPTCHA_SITEKEY = "YOUR_HCAPTCHA_SITE_KEY";
  const VERIFY_ENDPOINT = "/verify-hcaptcha"; // Python backend
  const MAX_REQUESTS = 10;
  const WINDOW_MS = 10000; // 10 seconds

  const requestQueue = [];

  function throttleRequest() {
    const now = Date.now();
    while (requestQueue.length && now - requestQueue[0] > WINDOW_MS) requestQueue.shift();
    if (requestQueue.length >= MAX_REQUESTS) return false;
    requestQueue.push(now);
    return true;
  }

  function loadHCaptcha(callback) {
    if (window.hcaptcha) return callback();
    const script = document.createElement("script");
    script.src = "https://hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  }

  async function verifyAction() {
    if (!throttleRequest()) throw new Error("Client-side throttle triggered");

    return new Promise((resolve, reject) => {
      loadHCaptcha(() => {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-1000px";
        document.body.appendChild(container);

        const widgetId = hcaptcha.render(container, {
          sitekey: HCAPTCHA_SITEKEY,
          size: "invisible",
          callback: async (token) => {
            try {
              const res = await fetch(VERIFY_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
              });
              const data = await res.json();
              if (data.success) resolve(true);
              else reject(new Error("hCaptcha failed"));
            } catch (err) { reject(err); }
            finally { document.body.removeChild(container); }
          }
        });

        hcaptcha.execute(widgetId);
      });
    });
  }

  function wrapElements() {
    document.querySelectorAll("button, input[type=submit], form").forEach(el => {
      if (el.dataset.hcaptchaWrapped) return;
      el.dataset.hcaptchaWrapped = "true";

      el.addEventListener("click", async e => {
        if (el.tagName === "FORM") e.preventDefault();
        try {
          await verifyAction();
          if (el.tagName === "FORM") el.submit();
        } catch (err) {
          console.warn("Action blocked by hCaptcha:", err.message);
        }
      });
    });
  }

  // Observe DOM changes to wrap dynamically added elements
  const observer = new MutationObserver(wrapElements);
  observer.observe(document.body, { childList: true, subtree: true });

  wrapElements();
  console.log("Cloudflare.js loaded: hCaptcha + auto-wrap + throttling active.");
})();
