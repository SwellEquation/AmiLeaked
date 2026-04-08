import { getPublicIPv4, getPublicIPv6, getDNSServers } from "./ipService.js";
import { saveIPRecord } from "../storage/storageService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

class BackgroundIPService {
    constructor(intervalMinutes = 1) {
        this.ipAddress = null;
        this.ipv6Address = null;
        this.dnsServers = null;
        this.intervalMinutes = intervalMinutes;
        this.isScheduled = false;
    }

    setIntervalMinutes(intervalMinutes) {
        this.intervalMinutes = intervalMinutes > 0 ? intervalMinutes : 1;
    }

    startCapture() {
        if (this.isScheduled) {
            chrome.alarms.clear("backgroundIPCapture");
        }

        chrome.alarms.create("backgroundIPCapture", {
            periodInMinutes: this.intervalMinutes,
            delayInMinutes: 0.1,
        });

        this.isScheduled = true;
        this.captureAll();
    }

    async captureAll() {
        try {
            const [ipv4, ipv6, dns] = await Promise.all([
                getPublicIPv4(),
                getPublicIPv6(),
                getDNSServers(),
            ]);

            this.ipAddress = ipv4;
            this.ipv6Address = ipv6;
            this.dnsServers = dns;
            const timestamp = getCurrentTimestamp();

            const record = {
                ip: ipv4,
                ipv6: ipv6,
                dns: dns,
                timestamp: timestamp,
            };

            saveIPRecord(record);
            console.log(
                `Captured IPv4: ${ipv4} | IPv6: ${ipv6} | DNS: ${dns} | Interval: ${this.intervalMinutes}m`
            );
        } catch (error) {
            console.error("Error capturing network info:", error);
        }
    }

    stopCapture() {
        chrome.alarms.clear("backgroundIPCapture");
        this.isScheduled = false;
    }
}

export { BackgroundIPService };