import { useEffect, useState } from "react";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { saveIPRecord, getLastCapturedIP } from "../storage/storageService";
import { getCurrentTimestamp } from "../utils/timeUtils";
import "./Popup.css";

export default function Popup() {
  const [result, setResult] = useState("Loading...");
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(1);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    chrome.storage.local.get(
      ["backgroundScanEnabled", "backgroundScanIntervalMinutes", "lastCapturedIP"],
      (stored) => {
        setBackgroundEnabled(Boolean(stored.backgroundScanEnabled));
        setIntervalMinutes(stored.backgroundScanIntervalMinutes || 1);

        if (stored.lastCapturedIP) {
          const record = stored.lastCapturedIP;
          setResult(
            `IPv4: ${record.ip}\nIPv6: ${record.ipv6 || "Not available"}\nDNS: ${record.dns || "Not available"}\nCaptured: ${record.timestamp}`
          );
        } else {
          setResult("No capture yet.");
        }
      }
    );
  }, []);

  const sendBackgroundUpdate = (enabled, interval) => {
    chrome.runtime.sendMessage(
      {
        type: "UPDATE_BACKGROUND_SCAN",
        enabled,
        intervalMinutes: interval,
      },
      () => {
        setStatusMessage(enabled ? "Background scan enabled" : "Background scan disabled");
      }
    );
  };

  const handleToggle = (event) => {
    const enabled = event.target.checked;
    setBackgroundEnabled(enabled);
    chrome.storage.local.set(
      {
        backgroundScanEnabled: enabled,
        backgroundScanIntervalMinutes: intervalMinutes,
      },
      () => {
        sendBackgroundUpdate(enabled, intervalMinutes);
      }
    );
  };

  const handleIntervalChange = (event) => {
    const nextInterval = Math.max(1, Number(event.target.value) || 1);
    setIntervalMinutes(nextInterval);
    chrome.storage.local.set({ backgroundScanIntervalMinutes: nextInterval }, () => {
      if (backgroundEnabled) {
        sendBackgroundUpdate(true, nextInterval);
      }
    });
  };

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

      <div className="quick-settings">
        <label>
          <input
            type="checkbox"
            checked={backgroundEnabled}
            onChange={handleToggle}
          />
          Background scan
        </label>

        <div className="interval-control">
          <label>
            Interval (minutes)
            <input
              type="number"
              min="1"
              value={intervalMinutes}
              onChange={handleIntervalChange}
              disabled={!backgroundEnabled}
            />
          </label>
        </div>
      </div>

      <button onClick={handleCapture}>Capture now</button>
      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <div className="result">
        {result.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}