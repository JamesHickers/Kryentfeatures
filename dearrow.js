<script>
(function () {
    const embedUrlRe = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;

    async function processEmbed(embedElement) {
        if (embedElement.dataset.dearrowProcessed) return;

        const iframe = embedElement.querySelector("iframe");
        if (!iframe) return;

        const match = embedUrlRe.exec(iframe.src);
        if (!match) return;

        const videoId = match[1];

        try {
            const res = await fetch(`https://sponsor.ajay.app/api/branding?videoID=${videoId}`);
            if (!res.ok) return;

            const { titles, thumbnails } = await res.json();

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

            function applyDearrow() {
                if (replacement.title && titleElement)
                    titleElement.textContent = replacement.title;

                if (replacement.thumb && thumbnailElement)
                    thumbnailElement.src = replacement.thumb;

                button.className = "vc-dearrow-toggle-on";
                enabled = true;
            }

            function restoreOriginal() {
                if (original.title && titleElement)
                    titleElement.textContent = original.title;

                if (original.thumb && thumbnailElement)
                    thumbnailElement.src = original.thumb;

                button.className = "vc-dearrow-toggle-off";
                enabled = false;
            }

            // Create button
            const button = document.createElement("button");
            button.className = "vc-dearrow-toggle-on";
            button.setAttribute("aria-label", "Toggle Dearrow");

            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg"
                     width="24" height="24"
                     viewBox="0 0 36 36"
                     class="vc-dearrow-icon">
                    <path fill="#1213BD"
                        d="M36 18.302c0 4.981-2.46 9.198-5.655 12.462s-7.323 5.152-12.199 5.152s-9.764-1.112-12.959-4.376S0 23.283 0 18.302s2.574-9.38 5.769-12.644S13.271 0 18.146 0s9.394 2.178 12.589 5.442C33.931 8.706 36 13.322 36 18.302z"/>
                    <path fill="#88c9f9"
                        d="m30.394 18.41c0 3.468-1.143 6.865-3.416 9.137-2.273 2.272-5.67 2.928-9.137 2.928-3.468 0-6.373-1.147-8.647-3.419-2.273-2.272-3.587-5.178-3.587-8.647 0-3.468 0.942-6.746 3.214-9.019 2.272-2.273 5.55-3.951 9.019-3.951 3.468 0 6.492 1.932 8.766 4.204 2.273 2.272 3.788 5.297 3.788 8.766z"/>
                    <path fill="#0a62a5"
                        d="m23.958 17.818c0 3.153-2.644 5.808-5.798 5.808-3.153 0-5.599-2.654-5.599-5.808 0-3.153 2.446-5.721 5.599-5.721 3.153 0 5.798 2.567 5.798 5.721z"/>
                </svg>
            `;

            button.onclick = () => {
                enabled ? restoreOriginal() : applyDearrow();
            };

            // IMPORTANT: container must be relative
            embedElement.style.position = "relative";
            embedElement.appendChild(button);

            applyDearrow();

            embedElement.dataset.dearrowProcessed = "true";

        } catch (err) {
            console.error("Dearrow failed:", err);
        }
    }

    function scan() {
        document.querySelectorAll(".youtube-embed").forEach(processEmbed);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    scan();
})();
</script>
