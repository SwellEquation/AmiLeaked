import { BackgroundIPService } from "./backgroundIPService.js";
import { getSettings } from "../storage/storageService.js";

let backgroundIPService = null;

chrome.runtime.onStartup.addListener(() => {
    initializeBackgroundCapture();
});

chrome.runtime.onInstalled.addListener((details) => {
    initializeBackgroundCapture();
});

function initializeBackgroundCapture() {
    getSettings((settings) => {
        if (settings.backgroundScan) {
            startService();
        }
    });
}

function startService() {
    if (!backgroundIPService) {
        backgroundIPService = new BackgroundIPService();
    }
    backgroundIPService.startCapture();
}

function stopService() {
    if (backgroundIPService) {
        backgroundIPService.stopCapture();
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "GET_CURRENT_IP":
            sendResponse({
                ip: backgroundIPService ? backgroundIPService.ipAddress : null,
                timestamp: new Date().toLocaleString()
            });
            break;

        case "START_BACKGROUND_SCAN":
            startService();
            sendResponse({ ok: true });
            break;

        case "STOP_BACKGROUND_SCAN":
            stopService();
            sendResponse({ ok: true });
            break;

        case "GET_LEAK_STATUS":
            sendResponse({
                leaks: backgroundIPService ? backgroundIPService.getLastLeaks() : []
            });
            break;
    }
    return true;
});
