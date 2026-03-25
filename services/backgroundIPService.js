import { getPublicIPv4 } from "./ipService.js";
import { saveIPRecord } from "../storage/storageService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

class BackgroundIPService {
    constructor() {
        this.ipAddress = null;
        this.intervalId = null;
    }

    startCapture() {
        console.log("[BackgroundIPService] Starting periodic IP capture (every 60s)");
        this.intervalId = setInterval(() => {
            this.captureIP();
        }, 60000); // Capture IP every minute
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
            
            // Save to storage for persistence
            saveIPRecord(record);
            
            console.log(`[BackgroundIPService] Captured IP Address: ${this.ipAddress} at ${timestamp}`);
        } catch (error) {
            console.error("[BackgroundIPService] Error capturing IP:", error);
        }
    }

    stopCapture() {
        clearInterval(this.intervalId);
        console.log("[BackgroundIPService] Stopped capturing IP Address.");
    }
}

// Export for use in service worker
export { BackgroundIPService };