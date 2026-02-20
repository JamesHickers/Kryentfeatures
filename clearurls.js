(function () {
    const RULES_URL = "https://raw.githubusercontent.com/ClearURLs/Rules/master/data.min.json";
    let rules = [];

    async function loadRules() {
        try {
            const data = await (await fetch(RULES_URL)).json();
            rules = Object.entries(data.providers).map(([name, p]) => ({
                name,
                urlPattern: new RegExp(p.urlPattern, "i"),
                rules: p.rules?.map(r => new RegExp(r, "i")),
                rawRules: p.rawRules?.map(r => new RegExp(r, "i")),
                exceptions: p.exceptions?.map(r => new RegExp(r, "i")),
            }));
            console.log("[ClearURLs] Rules loaded:", rules.length);
        } catch (e) {
            console.error("[ClearURLs] Failed to load rules", e);
        }
    }

    function cleanUrl(href) {
        let url;
        try { url = new URL(href); } catch { return href; }
        if (!url.searchParams || !url.searchParams.toString()) return href;

        rules.forEach(r => {
            if (!r.urlPattern.test(url.href)) return;
            if (r.exceptions?.some(ex => ex.test(url.href))) return;

            if (r.rules) {
                [...url.searchParams].forEach(([param]) => {
                    if (r.rules.some(rx => rx.test(param))) url.searchParams.delete(param);
                });
            }

            if (r.rawRules) {
                let s = url.href;
                r.rawRules.forEach(rx => s = s.replace(rx, ""));
                try { url = new URL(s); } catch {}
            }
        });

        return url.toString();
    }

    const URL_RE = /(https?:\/\/[^\s<]+[^<.,:;"'>)\]\s])/g;
    function cleanText(text) { return text.replace(URL_RE, cleanUrl); }

    function hookSend() {
        document.addEventListener("submit", e => {
            const target = e.target.querySelector("textarea, [contenteditable='true']");
            if (!target) return;
            if ("value" in target) target.value = cleanText(target.value);
            else target.innerText = cleanText(target.innerText);
        });

        document.addEventListener("paste", e => {
            const t = e.target;
            if (!t.matches("textarea, [contenteditable='true']")) return;
            setTimeout(() => {
                if ("value" in t) t.value = cleanText(t.value);
                else t.innerText = cleanText(t.innerText);
            }, 0);
        });
    }

    function cleanRendered() {
        document.querySelectorAll(".message").forEach(msg => {
            if (msg.__clearurls) return;
            msg.innerHTML = msg.innerHTML.replace(URL_RE, cleanUrl);
            msg.__clearurls = true; // Sciter-friendly flag
        });
    }

    async function init() {
        await loadRules();
        hookSend();
        cleanRendered();
        if (window.MutationObserver) {
            new MutationObserver(cleanRendered).observe(document.body, { childList:true, subtree:true });
        }
    }

    init();
})();
