import { BackgroundIPService } from "./services/backgroundIPService.js";
import { getSettings } from "./storage/storageService.js";

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
            startService(settings.scanInterval || 60);
        }
    });
}

function startService(intervalSeconds) {
    if (!backgroundIPService) {
        backgroundIPService = new BackgroundIPService();
    }
    backgroundIPService.startCapture(intervalSeconds);
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
            startService(request.interval || 60);
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

        case "GET_BACKGROUND_STATUS":
            sendResponse({
                leaks: backgroundIPService ? backgroundIPService.getLastLeaks() : [],
                current: backgroundIPService ? {
                    ip: backgroundIPService.ipAddress,
                    ipv6: backgroundIPService.ipv6Address,
                    dns: backgroundIPService.dnsServers,
                    webrtc: backgroundIPService.webrtcIPs
                } : null,
                nextScanTime: backgroundIPService ? backgroundIPService.getNextScanTime() : null
            });
            break;

        case "SET_SCAN_INTERVAL":
            if (backgroundIPService) {
                backgroundIPService.setInterval(request.interval);
            }
            sendResponse({ ok: true });
            break;

        case "GET_NEXT_SCAN":
            sendResponse({
                nextScanTime: backgroundIPService ? backgroundIPService.getNextScanTime() : null
            });
            break;
    }
    return true;
});
