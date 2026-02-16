<script type="module">
window.KrynetBlurNSFW = {

  settings: {
    blurAmount: 10,
    enabled: true
  },

  applyToMessage(messageElement, channel) {
    if (!this.settings.enabled) return;
    if (!channel?.nsfw) return;

    messageElement.classList.add("kr-nsfw-blur");
  },

  setBlurAmount(px) {
    this.settings.blurAmount = px;
    document.documentElement.style.setProperty("--kr-nsfw-blur", `${px}px`);
  },

  toggle(enabled) {
    this.settings.enabled = enabled;
  }

};

// Default CSS variable
document.documentElement.style.setProperty("--kr-nsfw-blur", "10px");
</script>
