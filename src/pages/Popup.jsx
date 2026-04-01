import { useEffect, useState } from "react";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { saveIPRecord, getLastCapturedIP } from "../storage/storageService";
import { getCurrentTimestamp } from "../utils/timeUtils";
import "./Popup.css";

export default function Popup() {
  const [result, setResult] = useState("Loading...");

  useEffect(() => {
    getLastCapturedIP((record) => {
      if (record) {
        setResult(
          `IPv4: ${record.ip}\nIPv6: ${record.ipv6 || "Not available"}\nDNS: ${record.dns || "Not available"}\nCaptured: ${record.timestamp}`
        );
      } else {
        setResult("No capture yet.");
      }
    });
  }, []);

  const handleCapture = async () => {
    setResult("Capturing...");
    const [r, l, u] = await Promise.allSettled([
      getPublicIPv4(),
      getPublicIPv6(),
      getDNSServers(),
    ]);
    const ip = r.status === "fulfilled" ? r.value : null;
    const ipv6 = l.status === "fulfilled" ? l.value : null;
    const dns = u.status === "fulfilled" ? u.value : null;
    const timestamp = getCurrentTimestamp();
    const record = { ip, ipv6, dns, timestamp };
    saveIPRecord(record);
    setResult(
      `IPv4: ${ip || "Not available"}\nIPv6: ${ipv6 || "Not available"}\nDNS: ${dns || "Not available"}\nCaptured: ${timestamp}`
    );
  };

  return (
    <div className="container">
      <h1>AmiLeaked</h1>
      <button onClick={handleCapture}>Capture</button>
      <div className="result">
        {result.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}