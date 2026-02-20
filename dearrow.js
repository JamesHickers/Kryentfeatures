(function () {
    const embedUrlRe = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
    const licenseKey = "FR3Lo-e986a"; // your Dearrow license

    async function process(embed) {
        if (embed.__dearrow) return;

        const iframe = embed.querySelector("iframe");
        if (!iframe) return;

        const match = embedUrlRe.exec(iframe.src);
        if (!match) return;

        const id = match[1];
        let data;
        try {
            const res = await fetch(`https://sponsor.ajay.app/api/branding?videoID=${id}&license=${licenseKey}`);
            if (!res.ok) return;
            data = await res.json();
        } catch { return; }

        const titleEl = embed.querySelector(".embed-title");
        const thumbEl = embed.querySelector(".embed-thumbnail");
        if (!titleEl && !thumbEl) return;

        const orig = { title: titleEl?.textContent, thumb: thumbEl?.src };
        const newTitle = data.titles?.[0]?.votes >= 0 ? data.titles[0].title.replace(/(^|\s)>(\S)/g,"$1$2") : null;
        const newThumb = data.thumbnails?.[0]?.votes >= 0 && !data.thumbnails[0].original
            ? `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${id}&time=${data.thumbnails[0].timestamp}&license=${licenseKey}`
            : null;

        if (!newTitle && !newThumb) return;

        const btn = document.createElement("button");
        btn.className = "vc-dearrow-on";
        btn.innerHTML = "...SVG HERE...";
        btn.onclick = () => {
            if (btn.className === "vc-dearrow-on") {
                if (titleEl && newTitle) titleEl.textContent = orig.title;
                if (thumbEl && newThumb) thumbEl.src = orig.thumb;
                btn.className = "vc-dearrow-off";
            } else {
                if (titleEl && newTitle) titleEl.textContent = newTitle;
                if (thumbEl && newThumb) thumbEl.src = newThumb;
                btn.className = "vc-dearrow-on";
            }
        };

        embed.style.position = embed.style.position || "relative";
        embed.appendChild(btn);

        if (titleEl && newTitle) titleEl.textContent = newTitle;
        if (thumbEl && newThumb) thumbEl.src = newThumb;

        embed.__dearrow = true;
    }

    // Run once over all embeds
    const embeds = document.querySelectorAll(".youtube-embed");
    for (let i = 0; i < embeds.length; i++) process(embeds[i]);
})();
