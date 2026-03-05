import { Reactions } from "./reactions.js";

const style = (e, s) => Object.assign(e.style, s);
const el = t => document.createElement(t);

const urlRegex = /(https?:\/\/[^\s]+)/g;

async function getMime(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.headers.get("content-type") || "";
  } catch {
    return "";
  }
}

async function getMeta(url) {
  try {
    const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    return await r.json();
  } catch {
    return {};
  }
}

async function createMedia(url, mime, meta) {

  const wrap = el("div");

  if (meta.html) {
    wrap.innerHTML = meta.html;
    return wrap;
  }

  if (mime.startsWith("image/")) {

    const img = el("img");
    img.src = url;

    style(img,{
      maxWidth:"400px",
      borderRadius:"6px",
      marginTop:"6px"
    });

    wrap.appendChild(img);
  }

  else if (mime.startsWith("video/")) {

    const v = el("video");
    v.src = url;
    v.controls = true;

    style(v,{
      maxWidth:"400px",
      borderRadius:"6px",
      marginTop:"6px"
    });

    wrap.appendChild(v);
  }

  else if (mime.startsWith("audio/")) {

    const a = el("audio");
    a.src = url;
    a.controls = true;

    style(a,{
      width:"100%",
      marginTop:"6px"
    });

    wrap.appendChild(a);
  }

  else if (mime === "application/pdf") {

    const f = el("iframe");
    f.src = url;

    style(f,{
      width:"100%",
      height:"400px",
      border:"none",
      borderRadius:"6px",
      marginTop:"6px"
    });

    wrap.appendChild(f);
  }

  else {

    const file = el("div");

    file.textContent = url.split("/").pop();

    style(file,{
      background:"#3a3b3c",
      padding:"8px",
      borderRadius:"6px",
      marginTop:"6px",
      fontSize:"13px"
    });

    wrap.appendChild(file);
  }

  return wrap;
}

async function buildEmbed(url) {

  const meta = await getMeta(url);
  const mime = await getMime(url);

  const card = el("div");

  style(card,{
    display:"flex",
    background:"#2f3136",
    borderRadius:"8px",
    maxWidth:"480px",
    marginTop:"6px",
    overflow:"hidden",
    fontFamily:"gg sans, Arial"
  });

  const bar = el("div");

  style(bar,{
    width:"4px",
    background:"#5865F2"
  });

  const body = el("div");

  style(body,{
    padding:"10px",
    flex:"1",
    display:"flex",
    flexDirection:"column",
    gap:"4px"
  });

  card.appendChild(bar);
  card.appendChild(body);

  const title = el("a");

  title.href = url;
  title.target = "_blank";
  title.textContent = meta.title || url;

  style(title,{
    color:"#00aff4",
    fontWeight:"600",
    fontSize:"14px",
    textDecoration:"none"
  });

  body.appendChild(title);

  if(meta.description){

    const desc = el("div");

    desc.textContent = meta.description;

    style(desc,{
      fontSize:"12px",
      color:"#b9bbbe"
    });

    body.appendChild(desc);
  }

  const media = await createMedia(url, mime, meta);

  if(media.childNodes.length) body.appendChild(media);

  if(meta.provider_name){

    const footer = el("div");

    footer.textContent = meta.provider_name;

    style(footer,{
      fontSize:"11px",
      color:"#72767d",
      marginTop:"4px"
    });

    body.appendChild(footer);
  }

  const reactions = el("div");

  style(reactions,{
    marginTop:"6px"
  });

  card.appendChild(reactions);

  new Reactions(reactions);

  return card;
}

function lazyEmbed(container, url){

  const placeholder = el("div");
  container.appendChild(placeholder);

  const obs = new IntersectionObserver(async entries => {

    if(entries[0].isIntersecting){

      obs.disconnect();

      const embed = await buildEmbed(url);

      placeholder.replaceWith(embed);
    }

  },{rootMargin:"200px"});

  obs.observe(placeholder);
}

export const Embed = {

  scanMessages(selector){

    const messages = document.querySelectorAll(selector);

    messages.forEach(msg=>{

      const text = msg.innerText;
      const urls = text.match(urlRegex);

      if(!urls) return;

      urls.forEach(url=>{
        lazyEmbed(msg,url);
      });

    });

  }

};
