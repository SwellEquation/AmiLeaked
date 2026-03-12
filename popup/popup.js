import { getPublicIPv4 } from "../services/ipService.js";
import { saveIPRecord, getLastCapturedIP } from "../storage/storageService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

const captureBtn = document.getElementById("captureBtn");
const resultDiv = document.getElementById("result");

// Load stored IP when popup opens
document.addEventListener("DOMContentLoaded", function () {
    getLastCapturedIP(function(record) {
        if (record) {
            resultDiv.innerHTML =
            `
            <b>Last Captured IPv4:</b> ${record.ip}<br>
            <b>Timestamp:</b> ${record.timestamp}
            `;
        } else {
            resultDiv.textContent = "No IPv4 captured yet.";
        }
    });
});


// Capture button
captureBtn.addEventListener("click", async function () {
    resultDiv.textContent = "Capturing...";
    try {
        const ip = await getPublicIPv4();
        const timestamp = getCurrentTimestamp();
        const record = {
            ip: ip,
            timestamp: timestamp
        };
        saveIPRecord(record);
        resultDiv.innerHTML =
        `
        <b>IPv4:</b> ${ip}<br>
        <b>Captured:</b> ${timestamp}
        `;
    } catch (error) {
        resultDiv.textContent = "Error capturing IP.";
        console.error(error);
    }
});