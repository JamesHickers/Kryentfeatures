<script type="module">
window.KrynetCopyFile = {

  MAX_COPY_SIZE: 500_000, // 500KB limit (adjust if needed)

  isTextFile(file) {
    return file.type?.startsWith("text/") ||
           /\.(txt|md|json|js|ts|html|css|log)$/i.test(file.name);
  },

  createButton(file) {
    if (!this.isTextFile(file)) return null;

    const button = document.createElement("div");
    button.className = "kr-copy-btn";
    button.setAttribute("role", "button");
    button.title = file.size > this.MAX_COPY_SIZE
      ? "File too large to copy"
      : "Copy File Contents";

    let recentlyCopied = false;

    const updateIcon = () => {
      if (recentlyCopied) {
        button.innerHTML = "✔";
      } else if (file.size > this.MAX_COPY_SIZE) {
        button.innerHTML = "🚫";
      } else {
        button.innerHTML = "📋";
      }
    };

    updateIcon();

    button.addEventListener("click", async () => {
      if (recentlyCopied || file.size > this.MAX_COPY_SIZE) return;

      try {
        await navigator.clipboard.writeText(file.content);

        recentlyCopied = true;
        updateIcon();
        this.toast("Copied file contents!");

        setTimeout(() => {
          recentlyCopied = false;
          updateIcon();
        }, 2000);

      } catch (err) {
        this.toast("Failed to copy.");
      }
    });

    return button;
  },

  toast(message) {
    const toast = document.createElement("div");
    toast.className = "kr-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
};
</script>
