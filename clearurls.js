(function () {
    const CLEAR_URLS_JSON_URL =
        "https://raw.githubusercontent.com/ClearURLs/Rules/master/data.min.json";

    let rules = [];

    async function loadRules() {
        try {
            const res = await fetch(CLEAR_URLS_JSON_URL);
            const data = await res.json();

            rules = [];

            for (const [name, provider] of Object.entries(data.providers)) {
                rules.push({
                    name,
                    urlPattern: new RegExp(provider.urlPattern, "i"),
                    rules: provider.rules?.map(r => new RegExp(r, "i")),
                    rawRules: provider.rawRules?.map(r => new RegExp(r, "i")),
                    exceptions: provider.exceptions?.map(r => new RegExp(r, "i")),
                });
            }

            console.log("[ClearURLs] Rules loaded:", rules.length);
        } catch (err) {
            console.error("[ClearURLs] Failed to load rules", err);
        }
    }

    function cleanUrl(match) {
        let url;

        try {
            url = new URL(match);
        } catch {
            return match;
        }

        if (!url.searchParams || ![...url.searchParams].length)
            return match;

        rules.forEach(({ urlPattern, exceptions, rawRules, rules }) => {
            if (!urlPattern.test(url.href)) return;
            if (exceptions?.some(ex => ex.test(url.href))) return;

            const toDelete = [];

            if (rules) {
                url.searchParams.forEach((_, param) => {
                    if (rules.some(rule => rule.test(param))) {
                        toDelete.push(param);
                    }
                });
            }

            toDelete.forEach(param => url.searchParams.delete(param));

            let cleaned = url.href;
            rawRules?.forEach(rawRule => {
                cleaned = cleaned.replace(rawRule, "");
            });

            url = new URL(cleaned);
        });

        return url.toString();
    }

    function cleanText(text) {
        return text.replace(
            /(https?:\/\/[^\s<]+[^<.,:;"'>)\]\s])/g,
            match => cleanUrl(match)
        );
    }

    function hookSend() {
        // Hook form submits
        document.addEventListener("submit", e => {
            const textarea = e.target.querySelector("textarea, [contenteditable='true']");
            if (!textarea) return;

            if (textarea.value !== undefined) {
                textarea.value = cleanText(textarea.value);
            } else {
                textarea.innerText = cleanText(textarea.innerText);
            }
        });

        // Optional: live cleanup on paste
        document.addEventListener("paste", e => {
            const target = e.target;
            if (!target.matches("textarea, [contenteditable='true']")) return;

            setTimeout(() => {
                if (target.value !== undefined) {
                    target.value = cleanText(target.value);
                } else {
                    target.innerText = cleanText(target.innerText);
                }
            }, 0);
        });
    }

    // Optional: clean rendered messages too
    function cleanRenderedMessages() {
        document.querySelectorAll(".message").forEach(msg => {
            if (msg.dataset.clearurlsProcessed) return;

            msg.innerHTML = msg.innerHTML.replace(
                /(https?:\/\/[^\s<]+[^<.,:;"'>)\]\s])/g,
                match => cleanUrl(match)
            );

            msg.dataset.clearurlsProcessed = "true";
        });
    }

    const observer = new MutationObserver(cleanRenderedMessages);

    async function init() {
        await loadRules();
        hookSend();
        observer.observe(document.body, { childList: true, subtree: true });
        cleanRenderedMessages();
    }

    init();
})();
