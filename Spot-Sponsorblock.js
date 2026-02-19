(function () {
    const segmentCache = new Map();
    const API_BASE = "https://sponsor.ajay.app/api";

    let markingStart = null;

    async function getSegments(episodeId) {
        if (segmentCache.has(episodeId))
            return segmentCache.get(episodeId);

        try {
            const res = await fetch(
                `${API_BASE}/skipSegments?videoID=${episodeId}&service=Spotify`
            );
            if (!res.ok) return [];

            const data = await res.json();
            segmentCache.set(episodeId, data);
            return data;

        } catch {
            return [];
        }
    }

    async function submitSegment(episodeId, start, end) {
        try {
            await fetch(`${API_BASE}/submitSegment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoID: episodeId,
                    segment: [start, end],
                    category: "sponsor",
                    service: "Spotify"
                })
            });

            alert("Segment submitted successfully.");
        } catch (e) {
            alert("Submission failed.");
        }
    }

    function extractEpisodeId() {
        const match = window.location.pathname.match(/episode\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    async function attachSponsorBlock(audio) {
        if (audio.dataset.sbAttached) return;

        const episodeId = extractEpisodeId();
        if (!episodeId) return;

        const segments = await getSegments(episodeId);
        if (segments.length) {
            audio.addEventListener("timeupdate", () => {
                const current = audio.currentTime;

                for (const segment of segments) {
                    const [start, end] = segment.segment;

                    if (current >= start && current < end) {
                        audio.currentTime = end;
                        break;
                    }
                }
            });
        }

        audio.dataset.sbAttached = "true";
    }

    function addUI(audio) {
        if (document.getElementById("sb-mark-btn")) return;

        const btn = document.createElement("button");
        btn.id = "sb-mark-btn";
        btn.textContent = "Mark Sponsor";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.right = "20px";
        btn.style.zIndex = "9999";
        btn.style.padding = "10px";
        btn.style.background = "#1DB954";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.borderRadius = "8px";
        btn.style.cursor = "pointer";

        btn.onclick = async () => {
            const episodeId = extractEpisodeId();
            if (!episodeId) return;

            if (markingStart === null) {
                markingStart = audio.currentTime;
                btn.textContent = "Mark End";
            } else {
                const end = audio.currentTime;
                const start = markingStart;
                markingStart = null;
                btn.textContent = "Mark Sponsor";

                if (end > start)
                    await submitSegment(episodeId, start, end);
            }
        };

        document.body.appendChild(btn);
    }

    function scan() {
        const audio = document.querySelector("audio");
        if (!audio) return;

        attachSponsorBlock(audio);
        addUI(audio);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    scan();
})();
