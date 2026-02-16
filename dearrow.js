(function () {
    const embedUrlRe = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
    const cache = new Map();

    async function getDearrowData(videoId) {
        if (cache.has(videoId)) return cache.get(videoId);

        try {
            const res = await fetch(`https://sponsor.ajay.app/api/branding?videoID=${videoId}`);
            if (!res.ok) return null;

            const data = await res.json();
            cache.set(videoId, data);
            return data;
        } catch {
            return null;
        }
    }

    async function processEmbed(embedElement) {
        if (embedElement.dataset.dearrowProcessed) return;

        const iframe = embedElement.querySelector("iframe");
        if (!iframe) return;

        const match = embedUrlRe.exec(iframe.src);
        if (!match) return;

        const videoId = match[1];
        const data = await getDearrowData(videoId);
        if (!data) return;

        const { titles, thumbnails } = data;

        const hasTitle = titles?.[0]?.votes >= 0;
        const hasThumb = thumbnails?.[0]?.votes >= 0 && !thumbnails?.[0]?.original;

        if (!hasTitle && !hasThumb) return;

        const titleElement = embedElement.querySelector(".embed-title");
        const thumbnailElement = embedElement.querySelector(".embed-thumbnail");

        const original = {
            title: titleElement?.textContent,
            thumb: thumbnailElement?.src
        };

        const replacement = {
            title: hasTitle
                ? titles[0].title.replace(/(^|\s)>(\S)/g, "$1$2")
                : null,
            thumb: hasThumb
                ? `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${videoId}&time=${thumbnails[0].timestamp}`
                : null
        };

        let enabled = true;

        function apply() {
            if (replacement.title && titleElement)
                titleElement.textContent = replacement.title;

            if (replacement.thumb && thumbnailElement)
                thumbnailElement.src = replacement.thumb;

            button.className = "vc-dearrow-toggle-on";
            enabled = true;
        }

        function restore() {
            if (original.title && titleElement)
                titleElement.textContent = original.title;

            if (original.thumb && thumbnailElement)
                thumbnailElement.src = original.thumb;

            button.className = "vc-dearrow-toggle-off";
            enabled = false;
        }

        const button = document.createElement("button");
        button.className = "vc-dearrow-toggle-on";
        button.setAttribute("aria-label", "Toggle Dearrow");

        button.innerHTML = `...SVG HERE...`; // paste your SVG

        button.onclick = () => {
            enabled ? restore() : apply();
        };

        embedElement.style.position = "relative";
        embedElement.appendChild(button);

        apply();
        embedElement.dataset.dearrowProcessed = "true";
    }

    function scan() {
        document.querySelectorAll(".youtube-embed").forEach(processEmbed);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    scan();
})();
