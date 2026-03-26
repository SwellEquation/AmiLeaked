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
