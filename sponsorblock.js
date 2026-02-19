(function () {
    const SKIP_CATEGORIES = new Set(["sponsor", "selfpromo", "interaction"]);

    async function getSegments(videoId) {
        try {
            const res = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.filter(seg => SKIP_CATEGORIES.has(seg.category));
        } catch {
            return [];
        }
    }

    function extractVideoId(url) {
        try {
            const u = new URL(url);
            const host = u.hostname.toLowerCase();

            if (!(
                host.includes("youtube.com") ||
                host === "youtu.be" ||
                host.includes("invidious") ||
                host.includes("piped")
            )) return null;

            const vParam = u.searchParams.get("v");
            if (vParam?.length === 11) return vParam;

            const parts = u.pathname.split("/").filter(Boolean);
            if (host === "youtu.be" && parts[0]?.length === 11) return parts[0];
            if (parts.includes("watch")) {
                const id = parts[parts.indexOf("watch") + 1];
                if (id?.length === 11) return id;
            }
            if (parts.includes("embed")) {
                const id = parts[parts.indexOf("embed") + 1];
                if (id?.length === 11) return id;
            }
            for (const part of parts.reverse()) if (part.length === 11) return part;
        } catch {}
        return null;
    }

    async function attachSB(video, videoId) {
        if (!videoId || video.dataset.sbAttached) return;
        const segments = await getSegments(videoId);
        if (!segments.length) return;

        video.addEventListener("timeupdate", () => {
            const t = video.currentTime;
            for (const s of segments) {
                const [start, end] = s.segment;
                if (t >= start && t < end) {
                    video.currentTime = end;
                    break;
                }
            }
        });

        video.dataset.sbAttached = "true";
    }

    async function scanVideos(root = document) {
        root.querySelectorAll("video").forEach(video => {
            const videoId = video.dataset.youtubeId || extractVideoId(window.location.href);
            attachSB(video, videoId);
        });

        root.querySelectorAll("iframe").forEach(async iframe => {
            try {
                const videoId = extractVideoId(iframe.src);
                if (!videoId) return;
                let videoInside = null;
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    videoInside = doc.querySelector("video");
                } catch { return; }
                if (videoInside) attachSB(videoInside, videoId);
            } catch {}
        });
    }

    new MutationObserver(() => scanVideos()).observe(document.body, { childList: true, subtree: true });
    scanVideos();
})();
