(function () {
    const host = location.hostname;

    const isYouTube =
        host.includes("youtube.com") ||
        host.includes("youtube-nocookie.com");

    const isInvidious =
        host.includes("invidio.us") ||
        host.includes("invidious");

    const isPiped =
        host.includes("piped.video") ||
        host.includes("piped");

    if (!isYouTube && !isInvidious && !isPiped) {
        return; // Fail silently on everything else
    }

    /* -------------------------
       YOUTUBE LOGIC
    ------------------------- */

    if (isYouTube) {
        // Remove ad metadata
        const overrideObject = (obj, prop, value) => {
            if (!obj || typeof obj !== "object") return;
            for (const key in obj) {
                if (key === prop) {
                    obj[key] = value;
                } else if (typeof obj[key] === "object") {
                    overrideObject(obj[key], prop, value);
                }
            }
        };

        const nativeParse = JSON.parse;
        JSON.parse = function (...args) {
            const result = nativeParse.apply(this, args);
            overrideObject(result, "adPlacements", []);
            overrideObject(result, "playerAds", []);
            return result;
        };

        Response.prototype.json = new Proxy(Response.prototype.json, {
            async apply(target, thisArg, args) {
                const result = await Reflect.apply(target, thisArg, args);
                overrideObject(result, "adPlacements", []);
                overrideObject(result, "playerAds", []);
                return result;
            }
        });

        // Hide ad elements
        const style = document.createElement("style");
        style.textContent = `
            .ytp-ad-overlay-container,
            .ytp-ad-module,
            .ytd-display-ad-renderer,
            .ytd-promoted-video-renderer {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        // Auto skip
        const autoSkip = () => {
            if (document.querySelector(".ad-showing")) {
                const video = document.querySelector("video");
                if (video && video.duration) {
                    video.currentTime = video.duration;
                    const skipBtn = document.querySelector(".ytp-ad-skip-button");
                    skipBtn?.click();
                }
            }
        };

        new MutationObserver(autoSkip).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    /* -------------------------
       INVIDIOUS + PIPED LOGIC
    ------------------------- */

    if (isInvidious || isPiped) {
        // Strip tracking params
        const url = new URL(location.href);
        let modified = false;

        url.searchParams.forEach((_, key) => {
            if (key.startsWith("utm_") || key === "si") {
                url.searchParams.delete(key);
                modified = true;
            }
        });

        if (modified) {
            history.replaceState(null, "", url.toString());
        }

        // Remove possible sponsor banners or promoted elements
        const style = document.createElement("style");
        style.textContent = `
            .sponsor,
            .promoted,
            .ad,
            [class*="promo"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
})();
