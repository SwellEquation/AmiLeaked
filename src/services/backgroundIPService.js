import { getPublicIPv4 } from "./ipService.js";
import { saveIPRecord } from "../storage/storageService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

class BackgroundIPService {
    constructor() {
        this.ipAddress = null;
        this.intervalId = null;
    }

    startCapture() {
        this.intervalId = setInterval(() => {
            this.captureIP();
        }, 60);
    }

    async captureIP() {
        try {
            const ip = await getPublicIPv4();
            this.ipAddress = ip;
            const timestamp = getCurrentTimestamp();
            
            const record = {
                ip: ip,
                timestamp: timestamp
            };
            
            saveIPRecord(record);
            console.log(`Captured IP: ${this.ipAddress}`);
        } catch (error) {
            console.error("Error capturing IP:", error);
        }
    }

    stopCapture() {
        clearInterval(this.intervalId);
    }
}

export { BackgroundIPService };