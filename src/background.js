import { BackgroundIPService } from "./services/backgroundIPService.js";

let backgroundIPService;

chrome.runtime.onStartup.addListener(() => {
    initializeBackgroundScanner();
});

chrome.runtime.onInstalled.addListener(() => {
    initializeBackgroundScanner();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "backgroundIPCapture" && backgroundIPService) {
        backgroundIPService.captureAll();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
        return;
    }

    const enabledChange = changes.backgroundScanEnabled;
    const intervalChange = changes.backgroundScanIntervalMinutes;

    if (enabledChange || intervalChange) {
        const enabled = enabledChange ? enabledChange.newValue : undefined;
        const interval = intervalChange ? intervalChange.newValue : undefined;
        updateBackgroundScanner(enabled, interval);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_CURRENT_IP") {
        sendResponse({
            ip: backgroundIPService ? backgroundIPService.ipAddress : null,
            timestamp: new Date().toLocaleString(),
        });
        return true;
    }

    if (request.type === "UPDATE_BACKGROUND_SCAN") {
        updateBackgroundScanner(request.enabled, request.intervalMinutes);
        sendResponse({ success: true });
        return true;
    }
});

async function initializeBackgroundScanner() {
    const storageResult = await new Promise((resolve) => {
        chrome.storage.local.get(
            ["backgroundScanEnabled", "backgroundScanIntervalMinutes"],
            resolve
        );
    });

    const enabled = storageResult.backgroundScanEnabled;
    const interval = storageResult.backgroundScanIntervalMinutes || 1;

    updateBackgroundScanner(enabled, interval);
}

function updateBackgroundScanner(enabled, intervalMinutes) {
    chrome.storage.local.get(
        ["backgroundScanEnabled", "backgroundScanIntervalMinutes"],
        (stored) => {
            const currentEnabled = typeof enabled === "boolean" ? enabled : Boolean(stored.backgroundScanEnabled);
            const currentInterval =
                typeof intervalMinutes === "number" && intervalMinutes > 0
                    ? intervalMinutes
                    : stored.backgroundScanIntervalMinutes || 1;

            if (currentEnabled) {
                if (!backgroundIPService) {
                    backgroundIPService = new BackgroundIPService(currentInterval);
                } else {
                    backgroundIPService.setIntervalMinutes(currentInterval);
                }
                backgroundIPService.startCapture();
            } else {
                if (backgroundIPService) {
                    backgroundIPService.stopCapture();
                    backgroundIPService = null;
                }
            }
        }
    );
}

initializeBackgroundScanner();
