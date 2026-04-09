import { useEffect, useState } from "react";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { getData, saveData } from "../storage/storageService";
import "./Popup.css";

export default function Popup() {
  const [result, setResult] = useState("Loading...");
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(1);
  const [statusMessage, setStatusMessage] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // INITIAL LOAD
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
    getData((stored) => {
      if (!stored) {
        const initial = {
          baseline: null,
          current: null,
          settings: {
            autoCapture: false,
            notifications: false,
            hideSensitive: true,
            darkMode: true,
            backgroundScan: false,
            initialized: false
          }
        };
        saveData(initial);
        setData(initial);
      } else {
        setData(stored);
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
  // CAPTURE FUNCTION
  const capture = async (isBaseline = false) => {
    setLoading(true);

    const [ipv4, ipv6, dns] = await Promise.all([
      getPublicIPv4(),
      getPublicIPv6(),
      getDNSServers()
    ]);

    const vector = { ip: ipv4, ipv6, dns };

    const updated = { ...data };

    if (isBaseline) {
      updated.baseline = vector;
      updated.settings.initialized = true;
    } else {
      updated.current = vector;
    }

    saveData(updated);
    setData(updated);
    setLoading(false);
  };

  // LEAK DETECTION
  const checkLeak = () => {
    if (!data?.baseline || !data?.current) return "No data";

    const leaks = [];

    if (data.baseline.ip === data.current.ip) {
      leaks.push("IPv4 leak");
    }

    if (data.baseline.ipv6 && data.baseline.ipv6 === data.current.ipv6) {
      leaks.push("IPv6 leak");
    }

    if (
      data.baseline.dns &&
      data.current.dns &&
      data.baseline.dns[0] === data.current.dns[0]
    ) {
      leaks.push("DNS leak");
    }

    return leaks.length ? `⚠️ ${leaks.join(", ")}` : "✅ No leaks detected";
  };

  // TOGGLE SETTINGS
  const toggleSetting = (key) => {
    const updated = {
      ...data,
      settings: {
        ...data.settings,
        [key]: !data.settings[key]
      }
    };
    saveData(updated);
    setData(updated);
  };

  if (!data) return <div>Loading...</div>;

  const mask = (value) => {
    if (!value) return "N/A";
    if (!data.settings.hideSensitive) return value;
    return "••••••••";
  };

  const themeClass = data.settings.darkMode ? "dark" : "light";

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
    <div className={`container ${themeClass}`}>

      {/* HEADER */}
      <div className="header">
        <h1>AmiLeaked</h1>
        <div className="icons">
          <button onClick={() => toggleSetting("darkMode")}>☀️</button>
          <button onClick={() => capture(true)}>⚙️</button>
        </div>
      </div>

      {/* MAIN BUTTON */}
      <div className="main">
        <button className="power" onClick={() => capture(false)}>
          ⏻
        </button>
        <h2>Start Leak Detection</h2>
      </div>

      {/* QUICK SETTINGS */}
      <div className="card">
        <h3>Quick Settings</h3>

        <label>
          Auto capture on startup
          <input type="checkbox" checked={data.settings.autoCapture}
            onChange={() => toggleSetting("autoCapture")} />
        </label>

        <label>
          Leak notifications
          <input type="checkbox" checked={data.settings.notifications}
            onChange={() => toggleSetting("notifications")} />
        </label>

        <label>
          Hide sensitive info
          <input type="checkbox" checked={data.settings.hideSensitive}
            onChange={() => toggleSetting("hideSensitive")} />
        </label>

        <button onClick={() => toggleSetting("backgroundScan")}>
          {data.settings.backgroundScan ? "Stop Background Detection" : "Start Background Detection"}
        </button>
      </div>

      {/* SCAN DATA */}
      <div className="card">
        <h3>Scan Data</h3>

        {!data.current && <p>No scan data available</p>}

        {data.current && (
          <>
            <p>IPv4: {mask(data.current.ip)}</p>
            <p>IPv6: {mask(data.current.ipv6)}</p>
            <p>DNS: {mask(data.current.dns?.[0])}</p>
            <p>{checkLeak()}</p>
          </>
        )}
      </div>

    </div>
  );
}