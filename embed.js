<script src="https://cdn.jsdelivr.net/npm/@microlink/hover-vanilla@latest/dist/microlink.min.js"></script>
<script type="module">
import { Reactions } from './reactions.js';

window.Embed = {
  init: function(embeds) {
    embeds.forEach(item => {
      const container = document.querySelector(item.selector);
      if(!container) return;

      const sentinel = document.createElement('div');
      container.appendChild(sentinel);

      // Lazy-load trigger
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if(entry.isIntersecting) {
            obs.unobserve(entry.target);
            this.create(item.selector, item.url, item.options || {});
          }
        });
      }, {rootMargin: '200px'}); // trigger slightly before it enters view

      observer.observe(sentinel);
    });
  },

  create: async function(selector, url, options={}) {
    const container = document.querySelector(selector);
    if(!container) return;

    const wrapper = document.createElement('div');
    wrapper.style.maxWidth = options.maxWidth || '640px';
    wrapper.style.width = '100%';
    wrapper.style.background = options.background || '#2f3136';
    wrapper.style.color = options.color || '#fff';
    wrapper.style.borderRadius = '10px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
    wrapper.style.marginBottom = '16px';
    wrapper.style.transition = 'transform 0.2s ease';
    wrapper.style.cursor = 'pointer';

    wrapper.addEventListener('mouseenter', ()=>wrapper.style.transform='scale(1.02)');
    wrapper.addEventListener('mouseleave', ()=>wrapper.style.transform='scale(1)');

    container.appendChild(wrapper);

    const link = document.createElement('a');
    link.href = url;
    link.style.textDecoration = 'none';
    wrapper.appendChild(link);

    // Fetch structured metadata (OG/Twitter)
    const preview = await microlinkVanilla(url, { size: 'large' });

    link.innerHTML = '';

    // Determine best media inline
    let mediaAppended = false;

    if(preview.data.video?.url){
      const videoEl = document.createElement('video');
      videoEl.src = preview.data.video.url;
      videoEl.controls = true;
      videoEl.style.width = '100%';
      videoEl.style.borderRadius = '8px';
      wrapper.appendChild(videoEl);
      mediaAppended = true;
    } 
    else if(preview.data.image?.url){
      const imgEl = document.createElement('img');
      imgEl.src = preview.data.image.url;
      imgEl.style.width = '100%';
      imgEl.style.borderRadius = '8px';
      wrapper.appendChild(imgEl);
      mediaAppended = true;
    } 
    else if(preview.data.audio?.url){
      const audioEl = document.createElement('audio');
      audioEl.src = preview.data.audio.url;
      audioEl.controls = true;
      audioEl.style.width = '100%';
      audioEl.style.borderRadius = '8px';
      wrapper.appendChild(audioEl);
      mediaAppended = true;
    }

    // Fallback based on file extension
    if(!mediaAppended){
      const ext = url.split('.').pop().toLowerCase();
      const videoTypes = ['mp4','webm','mov','mkv'];
      const audioTypes = ['mp3','wav','ogg','flac'];
      const imageTypes = ['jpg','jpeg','png','gif','webp','bmp'];

      if(videoTypes.includes(ext)){
        const videoEl = document.createElement('video');
        videoEl.src = url;
        videoEl.controls = true;
        videoEl.style.width = '100%';
        videoEl.style.borderRadius = '8px';
        wrapper.appendChild(videoEl);
      }
      else if(audioTypes.includes(ext)){
        const audioEl = document.createElement('audio');
        audioEl.src = url;
        audioEl.controls = true;
        audioEl.style.width = '100%';
        audioEl.style.borderRadius = '8px';
        wrapper.appendChild(audioEl);
      }
      else if(imageTypes.includes(ext)){
        const imgEl = document.createElement('img');
        imgEl.src = url;
        imgEl.style.width = '100%';
        imgEl.style.borderRadius = '8px';
        wrapper.appendChild(imgEl);
      }
      else{
        const fileEl = document.createElement('div');
        fileEl.style.padding = '10px';
        fileEl.style.borderRadius = '6px';
        fileEl.style.background = '#3a3b3c';
        fileEl.style.fontWeight = 'bold';
        fileEl.style.textAlign = 'center';
        fileEl.textContent = `File: ${url.split('/').pop()} (${ext})`;
        wrapper.appendChild(fileEl);
      }
    }

    // Title + description
    const titleEl = document.createElement('div');
    titleEl.textContent = preview.data.title || url;
    titleEl.style.fontWeight = 'bold';
    titleEl.style.fontSize = '16px';
    titleEl.style.margin = '6px 0';
    wrapper.appendChild(titleEl);

    if(preview.data.description){
      const descEl = document.createElement('div');
      descEl.textContent = preview.data.description;
      descEl.style.fontSize = '14px';
      descEl.style.color = '#ccc';
      descEl.style.marginBottom = '6px';
      wrapper.appendChild(descEl);
    }

    // Reactions
    const reactionsContainer = document.createElement('div');
    wrapper.appendChild(reactionsContainer);
    new Reactions(reactionsContainer);
  }
};
</script>
