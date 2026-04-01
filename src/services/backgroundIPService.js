import { getPublicIPv4, getPublicIPv6, getDNSServers } from "./ipService.js";
import { saveIPRecord } from "../storage/storageService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

class BackgroundIPService {
    constructor() {
        this.ipAddress = null;
        this.ipv6Address = null;
        this.dnsServers = null;
        this.intervalId = null;
    }

    startCapture() {
        this.intervalId = setInterval(() => {
            this.captureAll();
        }, 60000);
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
            timestamp: timestamp
        };

        saveIPRecord(record);
        console.log(`Captured IPv4: ${ipv4} | IPv6: ${ipv6} | DNS: ${dns}`);
    } catch (error) {
        console.error("Error capturing network info:", error);
    }
}

    stopCapture() {
        clearInterval(this.intervalId);
    }
}

export { BackgroundIPService };