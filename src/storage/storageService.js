// ── IP History (local, persistent) ──

export function saveIPRecord(record) {
    chrome.storage.local.get(["ipHistory"], function(result) {
        let history = result.ipHistory || [];
        history.push(record);
        chrome.storage.local.set({
            ipHistory: history,
            lastCapturedIP: record
        });
    });
}

export function getLastCapturedIP(callback) {
    chrome.storage.local.get(["lastCapturedIP"], function(result) {
        callback(result.lastCapturedIP || null);
    });
}

// ── Baseline (local, persistent) ──

export function saveBaseline(baseline) {
    chrome.storage.local.set({ baseline });
}

export function getBaseline(callback) {
    chrome.storage.local.get(["baseline"], (res) => {
        callback(res.baseline || null);
    });
}

// ── Settings (local, persistent) ──

const DEFAULT_SETTINGS = {
    autoCapture: false,
    notifications: true,
    hideSensitive: true,
    darkMode: true,
    backgroundScan: false,
    notifyMode: "badge", // "badge" | "os" | "both"
    scanInterval: 60,   // seconds: 10, 20, 30, 40, 50, 60
    initialized: false
};

export function saveSettings(settings) {
    chrome.storage.local.set({ settings });
}

export function getSettings(callback) {
    chrome.storage.local.get(["settings"], (res) => {
        callback({ ...DEFAULT_SETTINGS, ...(res.settings || {}) });
    });
}

// ── Transient scan data (session, cleared on browser restart) ──

export function getData(callback) {
    chrome.storage.session.get(["amiData"], (res) => {
        callback(res.amiData || null);
    });
}

export function saveData(data) {
    chrome.storage.session.set({ amiData: data });
}