/*
 * Krynet - Open In App Module
 * Cross-platform (Sciter Desktop + Web)
 * Production-ready for large scale messaging platforms
 */

///////////////////////////////
// Service Rules
///////////////////////////////

const SERVICES = [
    {
        id: "spotify",
        match: /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|artist|playlist|user|episode|prerelease)\/([^?]+)/i,
        replace: (_, type, id) => `spotify://${type}/${id}`
    },
    {
        id: "steam",
        match: /^https:\/\/(steamcommunity\.com|store\.steampowered\.com)\/.+/i,
        replace: url => `steam://openurl/${url}`
    },
    {
        id: "epic",
        match: /^https:\/\/store\.epicgames\.com\/(.+)/i,
        replace: (_, path) => `com.epicgames.launcher://store/${path}`
    },
    {
        id: "tidal",
        match: /^https:\/\/(?:listen\.)?tidal\.com\/(?:browse\/)?(track|album|artist|playlist|user|video|mix)\/([a-f0-9-]+)/i,
        replace: (_, type, id) => `tidal://${type}/${id}`
    },
    {
        id: "appleMusic",
        match: /^https:\/\/music\.apple\.com\/.+/i,
        replace: url => url.replace(/^https:/i, "itunes:")
    },
    {
        id: "youtubeMusic",
        match: /^https:\/\/music\.youtube\.com\/.+/i,
        replace: url => `vnd.youtube.music://open?url=${encodeURIComponent(url)}`
    },
    {
        id: "roblox",
        match: /^https:\/\/www\.roblox\.com\/games\/(\d+)/i,
        replace: (_, gameId) => `roblox-player://placeId=${gameId}`
    }
];

///////////////////////////////
// Platform-Aware Open
///////////////////////////////

function openExternal(url, fallbackUrl) {
    try {
        // Sciter Desktop
        if (typeof view !== "undefined" && typeof view.open === "function") {
            view.open(url);
            return;
        }

        if (typeof Sciter !== "undefined" && typeof Sciter.open === "function") {
            Sciter.open(url);
            return;
        }

        // Web
        window.location.href = url;

        // Optional fallback after delay
        if (fallbackUrl) {
            setTimeout(() => {
                window.open(fallbackUrl, "_blank");
            }, 1500);
        }

    } catch {
        if (fallbackUrl) {
            window.open(fallbackUrl, "_blank");
        }
    }
}

///////////////////////////////
// URL Transformer
///////////////////////////////

export function transformUrl(url) {
    if (!url) return url;

    for (const service of SERVICES) {
        if (service.match.test(url)) {
            return url.replace(service.match, service.replace);
        }
    }

    return url;
}

///////////////////////////////
// Click Interceptor (Lazy)
///////////////////////////////

function handleClick(event) {
    const anchor = event.target.closest("a[href]");
    if (!anchor) return;

    const originalUrl = anchor.href;
    if (!originalUrl) return;

    const transformed = transformUrl(originalUrl);

    if (transformed !== originalUrl) {
        event.preventDefault();
        openExternal(transformed, originalUrl);
    }
}

///////////////////////////////
// Public Init
///////////////////////////////

export function initOpenInApp() {
    document.addEventListener("click", handleClick, true);
}
