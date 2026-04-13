import { getPublicIPv4, getPublicIPv6, getDNSServers } from "./ipService.js";
import { getWebRTCIPs } from "./webrtcService.js";
import { saveIPRecord, getBaseline, getSettings, saveData } from "../storage/storageService.js";
import { alertLeaks, clearAlerts } from "./notificationService.js";
import { getCurrentTimestamp } from "../utils/timeUtils.js";

function detectLeaks(baseline, current) {
    const leaks = [];

    if (baseline.ip && current.ip && baseline.ip === current.ip) {
        leaks.push("IPv4 leak");
    }

    if (baseline.ipv6 && current.ipv6 && baseline.ipv6 === current.ipv6) {
        leaks.push("IPv6 leak");
    }

    if (baseline.dns?.[0] && current.dns?.[0] && baseline.dns[0] === current.dns[0]) {
        leaks.push("DNS leak");
    }

    if (baseline.webrtc?.publicIP && current.webrtc?.publicIP &&
        baseline.webrtc.publicIP === current.webrtc.publicIP) {
        leaks.push("WebRTC leak");
    }

    return leaks;
}

class BackgroundIPService {
    constructor() {
        this.ipAddress = null;
        this.ipv6Address = null;
        this.dnsServers = null;
        this.webrtcIPs = null;
        this.intervalId = null;
        this.lastLeaks = [];
        this.intervalSeconds = 60;
        this.nextScanTime = null;
    }

    startCapture(intervalSeconds) {
        if (intervalSeconds) this.intervalSeconds = intervalSeconds;
        this._scheduleNext();
    }

    _scheduleNext() {
        clearInterval(this.intervalId);
        this.nextScanTime = Date.now() + this.intervalSeconds * 1000;
        this.intervalId = setInterval(() => {
            this.captureAll();
            this.nextScanTime = Date.now() + this.intervalSeconds * 1000;
        }, this.intervalSeconds * 1000);
    }

    setInterval(seconds) {
        this.intervalSeconds = seconds;
        if (this.intervalId) {
            this._scheduleNext();
        }
    }

    getNextScanTime() {
        return this.nextScanTime;
    }

    async captureAll() {
        try {
            const [ipv4, ipv6, dns, webrtc] = await Promise.all([
                getPublicIPv4(),
                getPublicIPv6(),
                getDNSServers(),
                getWebRTCIPs(),
            ]);

            this.ipAddress = ipv4;
            this.ipv6Address = ipv6;
            this.dnsServers = dns;
            this.webrtcIPs = webrtc;
            const timestamp = getCurrentTimestamp();

            const record = {
                ip: ipv4,
                ipv6: ipv6,
                dns: dns,
                webrtc: webrtc,
                timestamp: timestamp
            };

            saveIPRecord(record);
            saveData({ current: record });

            // Compare against baseline
            getBaseline((baseline) => {
                if (!baseline) return;

                const leaks = detectLeaks(baseline, record);
                this.lastLeaks = leaks;

                if (leaks.length > 0) {
                    getSettings((settings) => {
                        if (settings.notifications) {
                            alertLeaks(leaks);
                        }
                    });
                } else {
                    clearAlerts();
                }
            });

            console.log(`Captured IPv4: ${ipv4} | IPv6: ${ipv6} | DNS: ${dns} | WebRTC: ${webrtc?.publicIP}`);
        } catch (error) {
            console.error("Error capturing network info:", error);
        }
    }

    stopCapture() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    getLastLeaks() {
        return this.lastLeaks;
    }
}

export { BackgroundIPService };