<script src="https://cdn.jsdelivr.net/npm/@microlink/hover-vanilla@latest/dist/microlink.min.js"></script>
<script type="module">
import { Reactions } from './reactions.js';

window.Embed = {
  init: function(embeds){
    embeds.forEach(item=>{
      const container = document.querySelector(item.selector);
      if(!container) return;

      const sentinel = document.createElement('div');
      container.appendChild(sentinel);

      const observer = new IntersectionObserver((entries, obs)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            obs.unobserve(entry.target);
            this.create(item.selector, item.url, item.options||{});
          }
        });
      }, { rootMargin: '200px' });

      observer.observe(sentinel);
    });
  },

  create: async function(selector, url, options={}){
    const container = document.querySelector(selector);
    if(!container) return;

    const wrapper = document.createElement('div');
    wrapper.style.display='flex';
    wrapper.style.flexDirection='row';
    wrapper.style.background=options.background||'#2f3136';
    wrapper.style.borderRadius='8px';
    wrapper.style.boxShadow='0 2px 12px rgba(0,0,0,0.4)';
    wrapper.style.maxWidth=options.maxWidth||'480px';
    wrapper.style.width='100%';
    wrapper.style.cursor='pointer';
    wrapper.style.transition='transform 0.2s ease';
    wrapper.style.fontFamily='Arial, sans-serif';
    wrapper.addEventListener('mouseenter',()=>wrapper.style.transform='scale(1.02)');
    wrapper.addEventListener('mouseleave',()=>wrapper.style.transform='scale(1)');
    container.appendChild(wrapper);

    const sidebar = document.createElement('div');
    sidebar.style.width='4px';
    sidebar.style.background=options.color||'#5865F2';
    sidebar.style.borderRadius='4px 0 0 4px';
    wrapper.appendChild(sidebar);

    const content = document.createElement('div');
    content.style.display='flex';
    content.style.flexDirection='column';
    content.style.padding='8px 12px';
    content.style.flex='1';
    wrapper.appendChild(content);

    let preview;
    try{
      preview = await microlinkVanilla(url, { size:'large' });
    }catch(e){
      console.warn('Microlink failed', e);
      preview = { data:{ title:url } };
    }

    const ext = url.split('.').pop()?.toLowerCase();
    const videoTypes = ['mp4','webm','mov','mkv'];
    const audioTypes = ['mp3','wav','ogg','flac'];
    const imageTypes = ['jpg','jpeg','png','gif','webp','bmp'];
    const docTypes = ['pdf','txt','csv','doc','docx','xlsx','ppt','pptx'];

    let mediaAppended = false;

    // -----------------
    // Inline video/audio/GIF playback
    // -----------------
    if(url.match(/youtube\.com\/watch|youtu\.be/)){
      const iframe = document.createElement('iframe');
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.width='100%';
      iframe.height='270px';
      iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.border='none';
      content.appendChild(iframe);
      mediaAppended = true;
    } else if(url.match(/vimeo\.com/)){
      const vidId = url.split('/').pop();
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vimeo.com/video/${vidId}`;
      iframe.width='100%';
      iframe.height='270px';
      iframe.allow='autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.border='none';
      content.appendChild(iframe);
      mediaAppended = true;
    } else if(videoTypes.includes(ext)){
      const video=document.createElement('video');
      video.src=url;
      video.controls=true;
      video.style.width='100%';
      video.style.borderTop='1px solid #23272a';
      content.appendChild(video);
      mediaAppended=true;
    } else if(audioTypes.includes(ext)){
      const audio=document.createElement('audio');
      audio.src=url;
      audio.controls=true;
      audio.style.width='100%';
      audio.style.borderTop='1px solid #23272a';
      content.appendChild(audio);
      mediaAppended=true;
    } else if(imageTypes.includes(ext)){
      const img=document.createElement('img');
      img.src=url;
      img.style.width='100%';
      img.style.borderTop='1px solid #23272a';
      img.style.borderRadius='0 0 8px 8px';
      if(ext==='gif') {
        img.autoplay=true; // autoplay GIFs
        img.loop=true; // loop GIFs
      }
      content.appendChild(img);
      mediaAppended=true;
    } else if(docTypes.includes(ext)){
      const fileDiv=document.createElement('div');
      fileDiv.style.padding='10px';
      fileDiv.style.borderRadius='6px';
      fileDiv.style.background='#3a3b3c';
      fileDiv.style.fontWeight='bold';
      fileDiv.style.textAlign='center';
      fileDiv.textContent=`File: ${url.split('/').pop()} (${ext})`;
      content.appendChild(fileDiv);
      mediaAppended=true;
    } else if(preview.data.video?.url){
      const video = document.createElement('video');
      video.src=preview.data.video.url;
      video.controls=true;
      video.style.width='100%';
      video.style.borderTop='1px solid #23272a';
      content.appendChild(video);
      mediaAppended=true;
    } else if(preview.data.audio?.url){
      const audio=document.createElement('audio');
      audio.src=preview.data.audio.url;
      audio.controls=true;
      audio.style.width='100%';
      audio.style.borderTop='1px solid #23272a';
      content.appendChild(audio);
      mediaAppended=true;
    } else if(preview.data.image?.url){
      const img=document.createElement('img');
      img.src=preview.data.image.url;
      img.style.width='100%';
      img.style.borderTop='1px solid #23272a';
      img.style.borderRadius='0 0 8px 8px';
      if(preview.data.image.url.endsWith('.gif')){
        img.autoplay=true;
        img.loop=true;
      }
      content.appendChild(img);
      mediaAppended=true;
    }

    // -----------------
    // Title
    // -----------------
    if(preview.data.title){
      const titleEl=document.createElement('a');
      titleEl.href=url;
      titleEl.target='_blank';
      titleEl.textContent=preview.data.title;
      titleEl.style.fontWeight='600';
      titleEl.style.fontSize='14px';
      titleEl.style.color='#00aff4';
      titleEl.style.textDecoration='none';
      titleEl.style.marginBottom='4px';
      content.appendChild(titleEl);
    }

    // -----------------
    // Description
    // -----------------
    if(preview.data.description){
      const descEl=document.createElement('div');
      descEl.textContent=preview.data.description;
      descEl.style.fontSize='12px';
      descEl.style.color='#b9bbbe';
      descEl.style.marginBottom='4px';
      content.appendChild(descEl);
    }

    // -----------------
    // Inline fields
    // -----------------
    const fields = preview.data.fields || [];
    if(fields.length){
      const fieldsContainer=document.createElement('div');
      fieldsContainer.style.display='flex';
      fieldsContainer.style.flexWrap='wrap';
      fieldsContainer.style.gap='8px';
      fieldsContainer.style.marginBottom='4px';
      fields.forEach(f=>{
        const field=document.createElement('div');
        field.style.flex=f.inline?'1 1 45%':'1 1 100%';
        field.style.display='flex';
        field.style.flexDirection='column';
        field.style.marginBottom='4px';
        const nameEl=document.createElement('div');
        nameEl.textContent=f.name;
        nameEl.style.fontSize='11px';
        nameEl.style.fontWeight='600';
        nameEl.style.color='#72767d';
        field.appendChild(nameEl);
        const valueEl=document.createElement('div');
        valueEl.textContent=f.value;
        valueEl.style.fontSize='12px';
        valueEl.style.color='#dcddde';
        field.appendChild(valueEl);
        fieldsContainer.appendChild(field);
      });
      content.appendChild(fieldsContainer);
    }

    // -----------------
    // Footer
    // -----------------
    if(preview.data.siteName || preview.data.date){
      const footer=document.createElement('div');
      footer.textContent=[preview.data.siteName, preview.data.date].filter(Boolean).join(' • ');
      footer.style.fontSize='11px';
      footer.style.color='#72767d';
      content.appendChild(footer);
    }

    // -----------------
    // Thumbnail
    // -----------------
    if(preview.data.image?.url && options.showThumbnail){
      const thumb=document.createElement('img');
      thumb.src=preview.data.image.url;
      thumb.style.width='80px';
      thumb.style.height='80px';
      thumb.style.objectFit='cover';
      thumb.style.marginLeft='8px';
      thumb.style.borderRadius='4px';
      wrapper.appendChild(thumb);
    }

    // -----------------
    // Reactions
    // -----------------
    const reactionsContainer=document.createElement('div');
    reactionsContainer.style.marginTop='6px';
    reactionsContainer.style.padding='2px 0';
    wrapper.appendChild(reactionsContainer);
    new Reactions(reactionsContainer);
  }
};
  </script>
