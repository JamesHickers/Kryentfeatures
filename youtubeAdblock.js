(function () {

    /* ----------------------------------
       FRONTEND DETECTION
    ---------------------------------- */

    const host = location.hostname;

    const FRONTEND = {
        youtube: /(youtube\.com|youtube-nocookie\.com)/i.test(host),
        invidious: /(invidio\.us|invidious)/i.test(host),
        piped: /(piped)/i.test(host),
        embed: location.pathname.includes("/embed/")
    };

    if (!Object.values(FRONTEND).some(Boolean)) return;


    /* ----------------------------------
       GENERIC OBJECT REWRITE ENGINE
    ---------------------------------- */

    function deepOverride(obj, prop, value) {
        if (!obj || typeof obj !== "object") return;

        for (const key in obj) {
            if (key === prop) {
                obj[key] = value;
            } else if (typeof obj[key] === "object") {
                deepOverride(obj[key], prop, value);
            }
        }
    }


    /* ----------------------------------
       NETWORK INTERCEPTION
    ---------------------------------- */

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {

        const res = await originalFetch.apply(this, args);

        try {
            const clone = res.clone();
            const type = clone.headers.get("content-type") || "";

            if (type.includes("json")) {
                const data = await clone.json();

                deepOverride(data, "adPlacements", []);
                deepOverride(data, "playerAds", []);
                deepOverride(data, "adBreakHeartbeatParams", null);
                deepOverride(data, "adSlots", []);

                return new Response(JSON.stringify(data), {
                    status: res.status,
                    statusText: res.statusText,
                    headers: res.headers
                });
            }
        } catch {}

        return res;
    };


    /* ----------------------------------
       JSON PARSE INTERCEPT
    ---------------------------------- */

    const nativeParse = JSON.parse;

    JSON.parse = function (...args) {
        const parsed = nativeParse.apply(this, args);

        deepOverride(parsed, "adPlacements", []);
        deepOverride(parsed, "playerAds", []);
        deepOverride(parsed, "adBreakHeartbeatParams", null);
        deepOverride(parsed, "adSlots", []);

        return parsed;
    };


    /* ----------------------------------
       URL TRACKING CLEANER
    ---------------------------------- */

    function cleanURL() {
        const url = new URL(location.href);
        let modified = false;

        for (const key of [...url.searchParams.keys()]) {
            if (
                key.startsWith("utm_") ||
                key === "si" ||
                key === "feature" ||
                key === "pp"
            ) {
                url.searchParams.delete(key);
                modified = true;
            }
        }

        if (modified) {
            history.replaceState(null, "", url.toString());
        }
    }

    cleanURL();


    /* ----------------------------------
       COSMETIC FILTER ENGINE
       (AdGuard compatible)
    ---------------------------------- */

    const baseFilters = [
        ".ytp-ad-overlay-container",
        ".ytp-ad-module",
        ".ytd-display-ad-renderer",
        ".ytd-promoted-video-renderer",
        ".video-ads",
        ".ytp-ad-player-overlay",
        "[class*='promoted']",
        "[class*='sponsor']",
        "[class*='ad-container']",
        ".sponsor",
        ".promoted",
        ".ad"
    ];

    const style = document.createElement("style");
    style.textContent = baseFilters.map(f => `${f}{display:none!important}`).join("\n");
    document.documentElement.appendChild(style);


    /* ----------------------------------
       AUTO SKIP ENGINE
    ---------------------------------- */

    function autoSkip() {

        const video = document.querySelector("video");

        if (!video) return;

        const adShowing =
            document.querySelector(".ad-showing") ||
            document.querySelector(".ytp-ad-player-overlay");

        if (adShowing && video.duration) {
            video.currentTime = video.duration;
        }

        const skipButton =
            document.querySelector(".ytp-ad-skip-button") ||
            document.querySelector(".ytp-skip-ad-button");

        skipButton?.click();
    }


    new MutationObserver(autoSkip).observe(document.documentElement, {
        childList: true,
        subtree: true
    });


    /* ----------------------------------
       EMBED SUPPORT
    ---------------------------------- */

    function patchEmbeds() {

        const iframes = document.querySelectorAll("iframe");

        for (const iframe of iframes) {

            try {

                const src = iframe.src || "";

                if (
                    src.includes("youtube") ||
                    src.includes("piped") ||
                    src.includes("invidious")
                ) {

                    const url = new URL(src);

                    url.searchParams.set("autoplay", "1");
                    url.searchParams.set("modestbranding", "1");
                    url.searchParams.set("rel", "0");

                    iframe.src = url.toString();
                }

            } catch {}

        }

    }

    patchEmbeds();

    new MutationObserver(patchEmbeds).observe(document.body, {
        childList: true,
        subtree: true
    });


    /* ----------------------------------
       OPTIONAL: ADGUARD FILTER LOADER
    ---------------------------------- */

    async function loadAdGuardFilters() {

        try {

            const lists = [
                "https://filters.adtidy.org/extension/ublock/filters/2.txt",
                "https://filters.adtidy.org/extension/ublock/filters/14.txt"
            ];

            for (const list of lists) {

                const res = await fetch(list);
                const text = await res.text();

                const selectors = text
                    .split("\n")
                    .filter(l => l.includes("##"))
                    .map(l => l.split("##")[1])
                    .filter(Boolean);

                const style = document.createElement("style");
                style.textContent = selectors
                    .map(s => `${s}{display:none!important}`)
                    .join("\n");

                document.head.appendChild(style);
            }

        } catch {}

    }

    // toggle upgrade
    const ENABLE_ADGUARD_UPGRADE = true;

    if (ENABLE_ADGUARD_UPGRADE) {
        loadAdGuardFilters();
    }

})();
