// embed.min.js
import { Reactions } from './reactions.js';
import microlinkVanilla from '@microlink/hover-vanilla';

window.Embed = {
  init(embeds){
    embeds.forEach(item=>{
      const c=document.querySelector(item.selector); if(!c) return;
      const s=document.createElement('div'); c.appendChild(s);
      new IntersectionObserver((e,o)=>e.forEach(x=>x.isIntersecting&&(o.unobserve(x.target),this.create(item.selector,item.url,item.options||{})) ),{rootMargin:'200px'}).observe(s);
    });
  },

  create: async function(sel,url,opts={}){
    const c=document.querySelector(sel); if(!c) return;
    const el=x=>document.createElement(x), style=(e,s)=>Object.assign(e.style,s);
    const w=el('div'); style(w,{display:'flex',flexDirection:'row',background:opts.background||'#2f3136',borderRadius:'8px',boxShadow:'0 2px 12px rgba(0,0,0,0.4)',maxWidth:opts.maxWidth||'480px',width:'100%',cursor:'pointer',transition:'transform 0.2s',fontFamily:'Arial,sans-serif'}); w.onmouseenter=()=>w.style.transform='scale(1.02)'; w.onmouseleave=()=>w.style.transform='scale(1)'; c.appendChild(w);
    const sb=el('div'); style(sb,{width:'4px',background:opts.color||'#5865F2',borderRadius:'4px 0 0 4px'}); w.appendChild(sb);
    const ct=el('div'); style(ct,{display:'flex',flexDirection:'column',padding:'8px 12px',flex:'1'}); w.appendChild(ct);

    let p; try{ p=await microlinkVanilla(url,{size:'large'}); }catch{ p={data:{title:url}}; }
    const ext=url.split('.').pop()?.toLowerCase()||'';
    const vid=['mp4','webm','mov','mkv'], aud=['mp3','wav','ogg','flac'], img=['jpg','jpeg','png','gif','webp','bmp'], doc=['pdf','txt','csv','doc','docx','xlsx','ppt','pptx'];

    const append=el=>ct.appendChild(el);

    // Media
    const addIframe=(src,h=270,allow='')=>{ const i=el('iframe'); i.src=src;i.width='100%';i.height=h+'px';i.allow=allow;i.allowFullscreen=true;i.style.border='none'; append(i); };
    if(url.match(/youtube\.com\/watch|youtu\.be/)){ const id=url.includes('v=')?url.split('v=')[1].split('&')[0]:url.split('/').pop(); addIframe(`https://www.youtube.com/embed/${id}`,270,'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'); }
    else if(url.match(/vimeo\.com/)){ addIframe(`https://player.vimeo.com/video/${url.split('/').pop()}`,270,'autoplay; fullscreen; picture-in-picture'); }
    else if(vid.includes(ext)){ const v=el('video'); v.src=url; v.controls=true; style(v,{width:'100%',borderTop:'1px solid #23272a'}); append(v); }
    else if(aud.includes(ext)){ const a=el('audio'); a.src=url;a.controls=true;style(a,{width:'100%',borderTop:'1px solid #23272a'}); append(a); }
    else if(img.includes(ext)){ const i=el('img'); i.src=url; style(i,{width:'100%',borderTop:'1px solid #23272a',borderRadius:'0 0 8px 8px'}); append(i); }
    else if(doc.includes(ext)){ const d=el('div'); d.textContent=`File: ${url.split('/').pop()} (${ext})`; style(d,{padding:'10px',borderRadius:'6px',background:'#3a3b3c',fontWeight:'bold',textAlign:'center'}); append(d); }
    else if(p.data.video?.url){ const v=el('video'); v.src=p.data.video.url; v.controls=true; style(v,{width:'100%',borderTop:'1px solid #23272a'}); append(v); }
    else if(p.data.audio?.url){ const a=el('audio'); a.src=p.data.audio.url; a.controls=true; style(a,{width:'100%',borderTop:'1px solid #23272a'}); append(a); }
    else if(p.data.image?.url){ const i=el('img'); i.src=p.data.image.url; style(i,{width:'100%',borderTop:'1px solid #23272a',borderRadius:'0 0 8px 8px'}); append(i); }

    // Title
    if(p.data.title){ const t=el('a'); t.href=url;t.target='_blank';t.textContent=p.data.title; style(t,{fontWeight:'600',fontSize:'14px',color:'#00aff4',textDecoration:'none',marginBottom:'4px'}); append(t); }

    // Description
    if(p.data.description){ const d=el('div'); d.textContent=p.data.description; style(d,{fontSize:'12px',color:'#b9bbbe',marginBottom:'4px'}); append(d); }

    // Fields
    (p.data.fields||[]).forEach(f=>{ const fd=el('div'); style(fd,{display:'flex',flexDirection:'column',marginBottom:'4px',flex:f.inline?'1 1 45%':'1 1 100%'}); const n=el('div'); n.textContent=f.name; style(n,{fontSize:'11px',fontWeight:'600',color:'#72767d'}); fd.appendChild(n); const v=el('div'); v.textContent=f.value; style(v,{fontSize:'12px',color:'#dcddde'}); fd.appendChild(v); append(fd); });

    // Footer
    if(p.data.siteName || p.data.date){ const ft=el('div'); ft.textContent=[p.data.siteName,p.data.date].filter(Boolean).join(' • '); style(ft,{fontSize:'11px',color:'#72767d'}); append(ft); }

    // Thumbnail
    if(p.data.image?.url && opts.showThumbnail){ const th=el('img'); th.src=p.data.image.url; style(th,{width:'80px',height:'80px',objectFit:'cover',marginLeft:'8px',borderRadius:'4px'}); w.appendChild(th); }

    // Reactions
    const r=el('div'); style(r,{marginTop:'6px',padding:'2px 0'}); w.appendChild(r); new Reactions(r);
  }
};
