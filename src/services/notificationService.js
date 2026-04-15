import { getSettings } from "../storage/storageService.js";

export function alertLeaks(leaks, options = {}) {
    const { fromBackgroundScan = false, settings: settingsOverride } = options;
    if (!fromBackgroundScan || !leaks?.length) return;

    const apply = (settings) => {
        if (!settings?.notifications) return;

        const mode = settings.notifyMode || "both";

        if (mode === "badge" || mode === "both") {
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
        }

        if (mode === "os" || mode === "both") {
            const id = `ami-leak-${Date.now()}`;
            chrome.notifications.create(
                id,
                {
                    type: "basic",
                    title: "AmiLeaked — Leak detected",
                    message: leaks.join(", "),
                    priority: 2
                },
                () => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                        console.error("AmiLeaked: notification failed:", err.message);
                    }
                }
            );
        }
    };

    if (settingsOverride) {
        apply(settingsOverride);
    } else {
        getSettings(apply);
    }
}

export function clearAlerts() {
    chrome.action.setBadgeText({ text: "" });
    if (chrome.notifications?.getAll) {
        chrome.notifications.getAll((ids) => {
            Object.keys(ids || {}).forEach((id) => {
                if (id.startsWith("ami-leak")) {
                    chrome.notifications.clear(id);
                }
            });
        });
    }
}
