import { BackgroundIPService } from "./services/backgroundIPService.js";

let backgroundIPService;

chrome.runtime.onStartup.addListener(() => {
    initializeBackgroundCapture();
});

chrome.runtime.onInstalled.addListener((details) => {
    initializeBackgroundCapture();
});

function initializeBackgroundCapture() {
    if (!backgroundIPService) {
        backgroundIPService = new BackgroundIPService();
        backgroundIPService.startCapture();
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_CURRENT_IP") {
        sendResponse({
            ip: backgroundIPService ? backgroundIPService.ipAddress : null,
            timestamp: new Date().toLocaleString()
        });
    }
});

initializeBackgroundCapture();
