export async function saveIPRecord(record) {
    return new Promise((resolve) => {
        chrome.storage.local.get(["ipHistory"], (result) => {
            let history = result.ipHistory || [];
            history.push(record);
            chrome.storage.local.set({ ipHistory: history }, () => {
                resolve();
            });
        });
    });
}