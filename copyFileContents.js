<script type="module">
window.KrynetCopyFile = {
  MAX_COPY_SIZE: 500_000, // 500KB

  isTextFile(f) {
    return f.type?.startsWith("text/") || /\.(txt|md|json|js|ts|html|css|log)$/i.test(f.name);
  },

  createButton(file) {
    if (!this.isTextFile(file)) return null;

    const btn = document.createElement("div");
    btn.className = "kr-copy-btn";
    btn.setAttribute("role","button");

    let copied = false;
    const update = () => {
      btn.innerHTML = copied ? "✔" : (file.size > this.MAX_COPY_SIZE ? "🚫" : "📋");
      btn.title = file.size > this.MAX_COPY_SIZE ? "File too large to copy" : "Copy File Contents";
    };
    update();

    btn.onclick = async () => {
      if (copied || file.size > this.MAX_COPY_SIZE) return;
      try {
        // Sciter + web compatible
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(file.content);
        } else if (window.clipboardData) {
          // IE/legacy fallback
          window.clipboardData.setData("Text", file.content);
        }
        copied = true; update();
        this.toast("Copied file contents!");
        setTimeout(() => { copied = false; update(); }, 2000);
      } catch {
        this.toast("Failed to copy.");
      }
    };

    return btn;
  },

  toast(msg) {
    const t = document.createElement("div");
    t.className = "kr-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.classList.add("fade");
      setTimeout(() => t.remove(), 300);
    }, 2000);
  }
};
</script>
