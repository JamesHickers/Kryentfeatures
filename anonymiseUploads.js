(() => {
    // Config
    const settings = {
        anonymiseByDefault: true,
        method: "random", // "random", "consistent", "timestamp"
        randomLength: 7,
        consistentName: "file",
    };

    const ANONYMISE_SYMBOL = Symbol("anonymiseUpload");

    // Helper to generate filename
    function generateFilename(original, method) {
        const ext = original.includes(".") ? original.slice(original.lastIndexOf(".")) : "";

        switch (method) {
            case "random":
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                return Array.from({ length: settings.randomLength }, () =>
                    chars[Math.floor(Math.random() * chars.length)]
                ).join("") + ext;
            case "consistent":
                return settings.consistentName + ext;
            case "timestamp":
                return Date.now() + ext;
            default:
                return original;
        }
    }

    // Patch uploads (example: intercept form/file inputs)
    function anonymiseUpload(file) {
        if (file[ANONYMISE_SYMBOL] === false) return;
        file.name = generateFilename(file.name, settings.method);
    }

    // Example integration: intercept file input changes
    document.addEventListener("change", (e) => {
        if (e.target && e.target.type === "file") {
            for (const file of e.target.files) {
                anonymiseUpload(file);
            }
        }
    });

    // Toggle button for frontend (if Krynet uses a component-based system)
    function createToggleButton(fileInput) {
        const btn = document.createElement("button");
        btn.textContent = "Toggle Anonymise";
        btn.style.marginLeft = "0.5rem";
        btn.onclick = () => {
            for (const file of fileInput.files) {
                file[ANONYMISE_SYMBOL] = !file[ANONYMISE_SYMBOL];
            }
        };
        fileInput.parentNode.insertBefore(btn, fileInput.nextSibling);
    }

    // Auto-attach to file inputs
    const observer = new MutationObserver(() => {
        document.querySelectorAll('input[type="file"]:not([data-anonymise])').forEach(input => {
            input.dataset.anonymise = "true";
            createToggleButton(input);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
