(() => {
    const cache = new Map(), API = "https://sponsor.ajay.app/api";
    let markStart = null;

    const getId = () => (window.location.pathname.match(/episode\/([a-zA-Z0-9]+)/) || [])[1];

    const getSegs = async id => {
        if (cache.has(id)) return cache.get(id);
        try {
            const res = await fetch(`${API}/skipSegments?videoID=${id}&service=Spotify`);
            if (!res.ok) return [];
            const data = await res.json();
            cache.set(id, data);
            return data;
        } catch { return []; }
    };

    const submitSeg = async (id, start, end) => {
        try {
            await fetch(`${API}/submitSegment`, {
                method: "POST",
                headers: { "Content-Type":"application/json" },
                body: JSON.stringify({ videoID:id, segment:[start,end], category:"sponsor", service:"Spotify" })
            });
            alert("Segment submitted successfully.");
        } catch { alert("Submission failed."); }
    };

    const attachSB = async audio => {
        if (audio.__sb) return;
        const id = getId();
        if (!id) return;
        const segs = await getSegs(id);
        if (segs.length) {
            audio.addEventListener("timeupdate", () => {
                const t = audio.currentTime;
                for (const s of segs) {
                    const [start,end] = s.segment;
                    if (t >= start && t < end) { audio.currentTime = end; break; }
                }
            });
        }
        audio.__sb = true;
    };

    const addUI = audio => {
        if (document.getElementById("sb-mark-btn")) return;
        const btn = document.createElement("button");
        Object.assign(btn.style, { position:"fixed", bottom:"20px", right:"20px", zIndex:9999, padding:"10px", background:"#1DB954", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer" });
        btn.id = "sb-mark-btn";
        btn.textContent = "Mark Sponsor";
        btn.onclick = async () => {
            const id = getId();
            if (!id) return;
            if (markStart===null) { markStart = audio.currentTime; btn.textContent="Mark End"; }
            else { const end = audio.currentTime; const start = markStart; markStart=null; btn.textContent="Mark Sponsor"; if (end>start) await submitSeg(id,start,end); }
        };
        document.body.appendChild(btn);
    };

    const scan = () => { const audio = document.querySelector("audio"); if (!audio) return; attachSB(audio); addUI(audio); };

    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
    scan();
})();
