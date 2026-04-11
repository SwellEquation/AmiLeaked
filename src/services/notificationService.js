import { getSettings } from "../storage/storageService.js";

export function alertLeaks(leaks) {
    getSettings((settings) => {
        const mode = settings.notifyMode || "both";

        if (mode === "badge" || mode === "both") {
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
        }

        if (mode === "os" || mode === "both") {
            chrome.notifications.create("ami-leak-alert", {
                type: "basic",
                iconUrl: chrome.runtime.getURL("icon/128.png"),
                title: "AmiLeaked — Leak Detected",
                message: `⚠️ ${leaks.join(", ")}`,
                priority: 2
            });
        }
    });
}

export function clearAlerts() {
    chrome.action.setBadgeText({ text: "" });
    chrome.notifications.clear("ami-leak-alert");
}
