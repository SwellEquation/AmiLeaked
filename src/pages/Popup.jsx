import { useEffect, useState } from "react";
import { getPublicIPv4, getIPGeoInfo } from "../services/ipService";
import { saveIPRecord, getLastCapturedIP } from "../storage/storageService";
import { getCurrentTimestamp } from "../utils/timeUtils";
import { getBrowserFingerprint } from "../utils/fingerprintUtils";
import { evaluateVPNLikelihood } from "../utils/vpnUtils";
import "./Popup.css";

export default function Popup() {
  const [result, setResult] = useState("Loading...");

  useEffect(() => {
    getLastCapturedIP((record) => {
      if (record) {
        const vpnStatus = record.vpnLikely ? "🟡 LIKELY VPN" : "✅ No VPN likely";
        setResult(
          `IP: ${record.ip}
Time: ${record.timestamp}
Browser TZ: ${record.browserFingerprint?.timezone || 'N/A'}
IP TZ: ${record.ipGeo?.ipTimezone || 'N/A'}
Status: ${vpnStatus}`
        );
      } else {
        setResult("No capture yet. Click button to check.");
      }
    });
  }, []);

  const handleCapture = async () => {
    setResult("Checking VPN status...");
    try {
      const ip = await getPublicIPv4();
      const ipGeo = await getIPGeoInfo(ip);
      const browserFp = getBrowserFingerprint();
      const vpnInfo = evaluateVPNLikelihood(browserFp, ipGeo);

      const record = {
        ip,
        timestamp: getCurrentTimestamp(),
        browserFingerprint: browserFp,
        ipGeo,
        vpnLikely: vpnInfo.vpnLikely,
        vpnConfidence: vpnInfo.confidence,
        vpnMismatches: vpnInfo.mismatches,
      };
      saveIPRecord(record);

      const status = vpnInfo.vpnLikely ? "🟡 LIKELY VPN" : "✅ No VPN likely";
      setResult(
        `IP: ${ip}
Browser TZ: ${browserFp.timezone}
IP TZ: ${ipGeo.ipTimezone}
Status: ${status}
Reasons: ${vpnInfo.mismatches.join(", ") || "None"}`
      );
    } catch (error) {
      console.error(error);
      setResult("Error checking VPN status.");
    }
  };

  return (
    <div className="container">
      <h1>AmiLeaked</h1>
      <button onClick={handleCapture}>Check IP & VPN Status</button>
      <pre className="result">{result}</pre>
    </div>
  );
}
