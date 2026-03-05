(() => {

    const API = "https://sponsor.ajay.app/api";
    const cache = new Map();
    let markStart = null;

    /* -------------------------
       EXTRACT SPOTIFY EPISODE ID
    ------------------------- */

    function getSpotifyID(embed) {

        const iframe = embed.querySelector("iframe");
        if (!iframe) return null;

        try {
            const url = new URL(iframe.src);

            const match =
                url.pathname.match(/episode\/([a-zA-Z0-9]+)/) ||
                url.pathname.match(/embed\/episode\/([a-zA-Z0-9]+)/);

            return match ? match[1] : null;

        } catch {
            return null;
        }
    }

    /* -------------------------
       FETCH SEGMENTS
    ------------------------- */

    async function getSegments(id) {

        if (cache.has(id)) return cache.get(id);

        try {

            const res = await fetch(
                `${API}/skipSegments?videoID=${id}&service=Spotify`
            );

            if (!res.ok) return [];

            const data = await res.json();
            cache.set(id, data);

            return data;

        } catch {
            return [];
        }

    }

    /* -------------------------
       ATTACH SKIP LOGIC
    ------------------------- */

    async function attachSB(embed) {

        if (embed.__sb) return;

        const id = getSpotifyID(embed);
        if (!id) return;

        const audio = embed.querySelector("audio, video");
        if (!audio) return;

        const segments = await getSegments(id);

        if (!segments.length) {
            embed.__sb = true;
            return;
        }

        audio.addEventListener("timeupdate", () => {

            const t = audio.currentTime;

            for (const s of segments) {

                const [start,end] = s.segment;

                if (t >= start && t < end) {
                    audio.currentTime = end;
                    break;
                }

            }

        });

        embed.__sb = true;

    }

    /* -------------------------
       OPTIONAL SUBMIT UI
    ------------------------- */

    function addUI(embed, audio, id) {

        if (embed.querySelector(".sb-mark")) return;

        const btn = document.createElement("button");

        btn.className = "sb-mark";
        btn.textContent = "Mark Sponsor";

        Object.assign(btn.style,{
            position:"absolute",
            bottom:"10px",
            right:"10px",
            zIndex:999,
            padding:"6px 10px",
            background:"#1DB954",
            color:"#fff",
            border:"none",
            borderRadius:"6px",
            cursor:"pointer",
            fontSize:"12px"
        });

        btn.onclick = async () => {

            if (markStart === null) {

                markStart = audio.currentTime;
                btn.textContent = "Mark End";

            } else {

                const start = markStart;
                const end = audio.currentTime;

                markStart = null;
                btn.textContent = "Mark Sponsor";

                if (end > start) {

                    await fetch(`${API}/submitSegment`,{
                        method:"POST",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            videoID:id,
                            segment:[start,end],
                            category:"sponsor",
                            service:"Spotify"
                        })
                    });

                }

            }

        };

        embed.style.position ||= "relative";
        embed.appendChild(btn);

    }

    /* -------------------------
       SCAN KRYNET EMBEDS
    ------------------------- */

    function scan() {

        const embeds = document.querySelectorAll(
            ".krynet-embed, .embed, [data-embed]"
        );

        for (const embed of embeds) {

            if (embed.__sb) continue;

            const id = getSpotifyID(embed);
            if (!id) continue;

            const audio = embed.querySelector("audio,video");
            if (!audio) continue;

            attachSB(embed);
            addUI(embed,audio,id);

        }

    }

    /* -------------------------
       WATCH FOR NEW EMBEDS
    ------------------------- */

    new MutationObserver(scan).observe(document.body,{
        childList:true,
        subtree:true
    });

    scan();

})();
