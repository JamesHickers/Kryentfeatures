// KrynetBlurNSFW.js
window.KrynetBlurNSFW = {
  settings: { blurAmount: 10, enabled: true },

  apply(messageEl, channel) {
    if (this.settings.enabled && channel?.nsfw) messageEl.classList.add("kr-nsfw-blur");
  },

  setBlur(px) {
    this.settings.blurAmount = px;
    document.documentElement.style.setProperty("--kr-nsfw-blur", px + "px");
  },

  toggle(on) { this.settings.enabled = !!on; }
};

// Initialize default blur
document.documentElement.style.setProperty("--kr-nsfw-blur", "10px");
