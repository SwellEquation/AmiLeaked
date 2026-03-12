import { getPublicIPv4 } from "../services/ipService.js";
import { saveIPRecord } from "../storage/storageService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

const captureBtn = document.getElementById("captureBtn");
const resultDiv = document.getElementById("result");

captureBtn.addEventListener("click", async () => {
    resultDiv.textContent = "Capturing...";
    try {
        const ip = await getPublicIPv4();
        const timestamp = getCurrentTimestamp();
        const record = {
            ip: ip,
            timestamp: timestamp
        };
        await saveIPRecord(record);
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