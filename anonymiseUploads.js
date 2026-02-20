(() => {
    const settings = { anonymiseByDefault: true, method: "random", randomLength: 7, consistentName: "file" };
    const ANON = Symbol("anonUpload");

    const genName = (orig, method) => {
        const ext = orig.includes(".") ? orig.slice(orig.lastIndexOf(".")) : "";
        if (method === "random") {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            return Array.from({ length: settings.randomLength }, () => chars[Math.floor(Math.random()*chars.length)]).join("") + ext;
        }
        if (method === "consistent") return settings.consistentName + ext;
        if (method === "timestamp") return Date.now() + ext;
        return orig;
    };

    const anonymise = file => {
        if (file[ANON] === false) return;
        file.name = genName(file.name, settings.method);
    };

    document.addEventListener("change", e => {
        if (e.target?.type === "file") for (const f of e.target.files) anonymise(f);
    });

    const toggleBtn = input => {
        const btn = document.createElement("button");
        btn.textContent = "Toggle Anonymise";
        btn.style.marginLeft = "0.5rem";
        btn.onclick = () => { for (const f of input.files) f[ANON] = !f[ANON]; };
        input.parentNode.insertBefore(btn, input.nextSibling);
    };

    new MutationObserver(() => {
        document.querySelectorAll('input[type="file"]:not([data-anon])').forEach(input => {
            input.dataset.anon = "true";
            toggleBtn(input);
        });
    }).observe(document.body, { childList: true, subtree: true });
})();
