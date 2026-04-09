export function saveIPRecord(record) {
    chrome.storage.local.get(["ipHistory"], function (result) {
        let history = result.ipHistory || [];
        history.push(record);
        chrome.storage.local.set({
            ipHistory: history,
            lastCapturedIP: record,
        });
    });
}

export function getLastCapturedIP(callback) {
    chrome.storage.local.get(["lastCapturedIP"], function (result) {
        callback(result.lastCapturedIP || null);
    });
}

export function saveBackgroundScanSettings(settings) {
    chrome.storage.local.set(settings);
}

export function getBackgroundScanSettings(callback) {
    chrome.storage.local.get(
        ["backgroundScanEnabled", "backgroundScanIntervalMinutes"],
        (result) => {
            callback({
                enabled: Boolean(result.backgroundScanEnabled),
                intervalMinutes: result.backgroundScanIntervalMinutes || 1,
            });
        }
    );
}
export function getData(callback) {
    chrome.storage.session.get(["amiData"], (res) => {
        callback(res.amiData || null);
    });
}

export function saveData(data) {
    chrome.storage.session.set({ amiData: data });
}
