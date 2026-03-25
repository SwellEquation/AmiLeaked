/**
 * Service Worker for AmiLeaked Extension
 * 
 * Runs in the background and handles:
 * - Periodic IP capture using BackgroundIPService
 * - Message handling from popup and content scripts
 * - Extension lifecycle management
 */

import { BackgroundIPService } from "./backgroundIPService.js";

let backgroundIPService;

// Initialize service worker when extension starts
chrome.runtime.onStartup.addListener(() => {
    console.log("[Service Worker] Extension started, initializing background IP service");
    initializeBackgroundCapture();
});

// Also initialize on install/update
chrome.runtime.onInstalled.addListener((details) => {
    console.log("[Service Worker] Extension installed/updated:", details.reason);
    initializeBackgroundCapture();
});

// Initialize background IP capture
function initializeBackgroundCapture() {
    if (!backgroundIPService) {
        backgroundIPService = new BackgroundIPService();
        backgroundIPService.startCapture();
        console.log("[Service Worker] Background IP capture initialized");
    }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_CURRENT_IP") {
        sendResponse({
            ip: backgroundIPService ? backgroundIPService.ipAddress : null,
            timestamp: new Date().toLocaleString()
        });
    }
});

// Ensure service starts on first load
initializeBackgroundCapture();

console.log("[Service Worker] AmiLeaked background service worker loaded");
