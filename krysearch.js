(function(){
  const BASE = "https://krynet-llc.github.io/KrySearch/UI/index.html";
  const DEFAULT_ENGINE = "default";

  const params = new URLSearchParams(window.location.search);
  const url = params.get("url");
  const q = params.get("q");
  const engine = params.get("engine") || DEFAULT_ENGINE;

  // Build the proper redirect URL
  let redirectUrl = null;

  if (url) {
    redirectUrl = `${BASE}?url=${encodeURIComponent(url)}&engine=${encodeURIComponent(engine)}`;
  } else if (q) {
    redirectUrl = /^https?:\/\//i.test(q)
      ? `${BASE}?url=${encodeURIComponent(q)}&engine=${encodeURIComponent(engine)}`
      : `${BASE}?q=${encodeURIComponent(q)}&engine=${encodeURIComponent(engine)}`;
  }

  // Only redirect if it's truly different
  if (redirectUrl && window.location.href !== redirectUrl) {
    window.location.replace(redirectUrl);
  }
})();
