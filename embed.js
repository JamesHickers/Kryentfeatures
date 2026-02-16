<script src="https://cdn.jsdelivr.net/npm/@microlink/hover-vanilla@latest/dist/microlink.min.js"></script>
<script type="module">
import { Reactions } from './reactions.js'; // your existing Discord-style reactions module

window.Embed = {
  /**
   * Create a rich site embed in Krynet UI.
   * @param {string} selector - container selector
   * @param {string} url - URL to embed
   * @param {object} options - customization options
   */
  create: async function(selector, url, options = {}) {
    const container = document.querySelector(selector);
    if (!container) return console.error('Embed container not found');

    // Wrapper card
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

    wrapper.addEventListener('mouseenter', () => wrapper.style.transform = 'scale(1.02)');
    wrapper.addEventListener('mouseleave', () => wrapper.style.transform = 'scale(1)');

    container.appendChild(wrapper);

    // Anchor for Microlink
    const link = document.createElement('a');
    link.href = url;
    link.style.textDecoration = 'none';
    wrapper.appendChild(link);

    // Initialize Microlink preview
    microlinkHover(link, {
      overlay: false,
      size: 'large',
      borderRadius: 10,
      backgroundColor: wrapper.style.background,
      textColor: wrapper.style.color,
      ...options
    });

    // Wait a tick for the card to render (so we can inject video)
    await new Promise(r => setTimeout(r, 300));

    // Detect if URL points to .mp4 directly
    if(url.match(/\.mp4$/i)) {
      // Remove Microlink default text
      link.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.src = url;
      videoEl.controls = true;
      videoEl.style.width = '100%';
      videoEl.style.borderRadius = '8px';
      wrapper.appendChild(videoEl);
    }

    // Inject reactions below the card
    const reactionsContainer = document.createElement('div');
    wrapper.appendChild(reactionsContainer);

    // Initialize your Discord-style reactions
    new Reactions(reactionsContainer);
  }
};
</script>
