// krysearch.js
(function(){
  const BASE="https://krynet-llc.github.io/KrySearch/UI/index.html";
  const NO_PARAM="https://krynet.ai";
  const DEFAULT_ENGINE="default"; // fallback engine

  const params=new URLSearchParams(window.location.search);
  const url=params.get("url");
  const q=params.get("q");
  const engine=params.get("engine")||DEFAULT_ENGINE;

  if(url){
    if(!params.get("engine")){
      window.location.replace(`${BASE}?url=${encodeURIComponent(url)}&engine=${encodeURIComponent(engine)}`);
    }
    return;
  }

  if(q){
    const redirectUrl=/^https?:\/\//i.test(q)
      ? `${BASE}?url=${encodeURIComponent(q)}&engine=${encodeURIComponent(engine)}`
      : `${BASE}?q=${encodeURIComponent(q)}&engine=${encodeURIComponent(engine)}`;
    if(window.location.href!==redirectUrl) window.location.replace(redirectUrl);
    return;
  }

  window.location.replace(NO_PARAM);
})();
