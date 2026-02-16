(function () {
    const segmentCache = new Map();

    // Categories we want to skip
    const SKIP_CATEGORIES = new Set([
        "sponsor",
        "selfpromo",
        "interaction"
    ]);

    async function getSegments(videoId) {
        if (segmentCache.has(videoId)) return segmentCache.get(videoId);

        try {
            const res = await fetch(
                `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`
            );
            if (!res.ok) return [];

            const data = await res.json();

            // Filter only desired categories
            const filtered = data.filter(segment =>
                SKIP_CATEGORIES.has(segment.category)
            );

            segmentCache.set(videoId, filtered);
            return filtered;

        } catch {
            return [];
        }
    }

    function extractVideoId(url) {
        try {
            const u = new URL(url);

            // /watch?v=VIDEOID
            if (u.searchParams.get("v"))
                return u.searchParams.get("v");

            // /watch/VIDEOID
            const parts = u.pathname.split("/");
            const possibleId = parts.pop() || parts.pop();
            if (possibleId && possibleId.length === 11)
                return possibleId;

        } catch {}

        return null;
    }

    async function attachSponsorBlock(video) {
        if (video.dataset.sbAttached) return;

        const videoId = extractVideoId(window.location.href);
        if (!videoId) return;

        const segments = await getSegments(videoId);
        if (!segments.length) return;

        video.addEventListener("timeupdate", () => {
            const current = video.currentTime;

            for (const segment of segments) {
                const [start, end] = segment.segment;

                if (current >= start && current < end) {
                    video.currentTime = end;
                    break;
                }
            }
        });

        video.dataset.sbAttached = "true";
    }

    function scan() {
        document.querySelectorAll("video").forEach(attachSponsorBlock);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    scan();
})();
