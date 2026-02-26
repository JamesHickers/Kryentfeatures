(function () {
    // --- 1️⃣ OS Detection & Version Parsing ---
    function parseOS() {
        const ua = navigator.userAgent;
        let os = "Other";
        let version = null;
        let isRecommended = false;
        let recommendation = "";

        if (/Windows NT (\d+\.\d+)/.test(ua)) {
            version = parseFloat(ua.match(/Windows NT (\d+\.\d+)/)[1]);
            os = "Windows";
            isRecommended = false;
            recommendation = "Windows is allowed, but for maximum privacy and performance we recommend using Linux via WSL (`wsl --install`) with Krynet.";
        } else if (/Mac OS X (\d+[_\.]\d+)/.test(ua)) {
            version = parseFloat(ua.match(/Mac OS X (\d+[_\.]\d+)/)[1].replace("_", "."));
            os = "macOS";
            isRecommended = true;
        } else if (/Linux/.test(ua)) {
            os = "Linux";
            isRecommended = true;
        } else if (/Android (\d+)/.test(ua)) {
            version = parseInt(ua.match(/Android (\d+)/)[1], 10);
            os = "Android";
            isRecommended = true;
        } else if (/iPhone|iPad|iPod.*OS (\d+)/.test(ua)) {
            version = parseInt(ua.match(/OS (\d+)/)[1], 10);
            os = "iOS";
            isRecommended = true;
        }
        return { os, version, isRecommended, recommendation };
    }

    // --- 2️⃣ Browser Detection & Version Parsing ---
    function parseBrowser() {
        const ua = navigator.userAgent;
        let name = "Other", version = null;
        if (/Firefox\/(\d+)/.test(ua)) {
            name = "Firefox"; version = parseInt(ua.match(/Firefox\/(\d+)/)[1], 10);
        } else if (/Edg\/(\d+)/.test(ua)) {
            name = "Edge"; version = parseInt(ua.match(/Edg\/(\d+)/)[1], 10);
        } else if (/OPR\/(\d+)/.test(ua)) {
            name = "Opera"; version = parseInt(ua.match(/OPR\/(\d+)/)[1], 10);
        } else if (/Chrome\/(\d+)/.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) {
            name = "Chrome"; version = parseInt(ua.match(/Chrome\/(\d+)/)[1], 10);
        } else if (/Chromium\/(\d+)/.test(ua)) {
            name = "Chromium"; version = parseInt(ua.match(/Chromium\/(\d+)/)[1], 10);
        } else if (/Version\/(\d+).*Safari/.test(ua)) {
            name = "Safari"; version = parseInt(ua.match(/Version\/(\d+).*Safari/)[1], 10);
        }
        const chromiumBased = ["Chrome", "Chromium", "Edge", "Opera"].includes(name);
        return { name, version, chromiumBased };
    }

    const osInfo = parseOS();
    const browserInfo = parseBrowser();

    // Advisory overlay triggers for Windows or Chromium-based browsers
    if (osInfo.isRecommended && !browserInfo.chromiumBased) return;

    // --- 3️⃣ Overlay Creation ---
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0"; overlay.style.left = "0"; overlay.style.right = "0"; overlay.style.bottom = "0";
    overlay.style.background = "rgba(0,0,0,0.85)";
    overlay.style.zIndex = "999998"; overlay.style.pointerEvents = "all";

    const supportedBrowsers = [
        { name: "Firefox", engine: "Gecko", tooltip: "Open-source, privacy-focused, strong performance." },
        { name: "Pale Moon", engine: "Goanna", tooltip: "Goanna engine, lightweight, privacy-focused." },
        { name: "Basilisk", engine: "Goanna", tooltip: "Legacy Goanna engine, privacy controls." },
        { name: "Safari", engine: "WebKit", tooltip: "WebKit engine, security updates, privacy features." },
        { name: "Epiphany", engine: "WebKit", tooltip: "Lightweight WebKit browser, minimal telemetry." },
        { name: "Midori", engine: "WebKit", tooltip: "WebKit engine, small footprint, privacy-friendly." }
    ];

    const browserHTML = supportedBrowsers.map(b => `
        <div style="display:inline-block; text-align:center; margin:8px; position:relative;">
            <div style="font-size:32px;">🏆</div>
            <div>${b.name} (${b.engine})</div>
            <div class="tooltip">${b.tooltip}</div>
        </div>
    `).join("");

    const banner = document.createElement("div");
    banner.id = "krynet-banner";
    banner.innerHTML = `
        <div style="color:#1f8b4c; font-size:20px; font-weight:700; margin-bottom:12px;">Krynet Privacy Advisory</div>
        <div style="color:#e6e6e6; font-size:14px; line-height:1.6; max-width:900px; margin:0 auto;">
            <strong>It looks like you’re using something that doesn’t meet our recommended standards for privacy and performance.</strong>
            ${!osInfo.isRecommended ? `<br><br><strong>OS:</strong> ${osInfo.os} ${osInfo.version || ""}<br>${osInfo.recommendation}` : ""}
            ${browserInfo.chromiumBased ? `<br><strong>Browser:</strong> ${browserInfo.name} ${browserInfo.version || ""} — Chromium-based browsers are allowed but not recommended for privacy.` : ""}
            <br><br>
            <strong>Recommended Browsers / Engines:</strong>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:16px;">${browserHTML}</div>
            <br>
            <strong>Privacy Resources:</strong> <a href="https://github.com/LibreWar/librealt" target="_blank" style="color:#1f8b4c;">LibreAlt</a>, <a href="https://github.com/VaporwareXE/Vaporware-XE-Lite" target="_blank" style="color:#1f8b4c;">Vaporware-XE-Lite</a>
        </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        body { overflow:hidden !important; margin-top:500px !important; }
        .tooltip { display:none; position:absolute; background:rgba(0,0,0,0.9); color:#fff; padding:4px 8px; border-radius:6px; font-size:12px; white-space:nowrap; }
        div[style*="🏆"]:hover + .tooltip { display:block; }
    `;

    document.head.appendChild(style);
    document.body.prepend(overlay);
    document.body.prepend(banner);
})();
