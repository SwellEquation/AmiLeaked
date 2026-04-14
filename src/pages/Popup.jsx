import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { getWebRTCIPs } from "../services/webrtcService";
import { getBaseline, getSettings, saveSettings, saveData } from "../storage/storageService";
import { clearAlerts } from "../services/notificationService";
import "./Popup.css";

export default function Home() {

  const navigate = useNavigate();
  const [baseline, setBaseline] = useState(null);
  const [current, setCurrent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const nextScanTimeRef = useRef(null);

  // INITIAL LOAD
  useEffect(() => {
    getBaseline((b) => setBaseline(b));
    getSettings((s) => {
      setSettings(s);

      // Only load existing scan data if background scan is actively running
      if (s?.backgroundScan) {
        chrome.runtime.sendMessage({ type: "GET_BACKGROUND_STATUS" }, (res) => {
          if (res?.current?.ip) {
            setCurrent(res.current);
          }
        });
      }
    });
    clearAlerts();
  }, []);

  // Listen for storage changes so background scan results update the UI in real-time
  useEffect(() => {
    const listener = (changes, area) => {
      if (area === "session" && changes.amiData?.newValue?.current) {
        setCurrent(changes.amiData.newValue.current);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Countdown timer for next background scan
  const startCountdown = (nextTime) => {
    nextScanTimeRef.current = nextTime;
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((nextScanTimeRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        // After scan completes, fetch updated next-scan time
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: "GET_NEXT_SCAN" }, (res) => {
            if (res?.nextScanTime) {
              nextScanTimeRef.current = res.nextScanTime;
            }
          });
        }, 2000);
      }
    }, 1000);
  };

  const stopCountdown = () => {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(null);
  };

  // Sync countdown when background scan state changes
  useEffect(() => {
    if (settings?.backgroundScan) {
      chrome.runtime.sendMessage({ type: "GET_NEXT_SCAN" }, (res) => {
        if (res?.nextScanTime) {
          startCountdown(res.nextScanTime);
        }
      });
    } else {
      stopCountdown();
    }
    return () => clearInterval(countdownRef.current);
  }, [settings?.backgroundScan]);

  // Handle scan interval change
  const changeScanInterval = (seconds) => {
    const updated = { ...settings, scanInterval: seconds };
    saveSettings(updated);
    setSettings(updated);

    if (settings.backgroundScan) {
      chrome.runtime.sendMessage({ type: "SET_SCAN_INTERVAL", interval: seconds }, () => {
        chrome.runtime.sendMessage({ type: "GET_NEXT_SCAN" }, (res) => {
          if (res?.nextScanTime) {
            startCountdown(res.nextScanTime);
          }
        });
      });
    }
  };

  // CAPTURE FUNCTION — full on-demand scan
  const capture = async () => {
    setLoading(true);

    const [ipv4, ipv6, dns, webrtc] = await Promise.all([
      getPublicIPv4(),
      getPublicIPv6(),
      getDNSServers(),
      getWebRTCIPs()
    ]);

    const vector = { ip: ipv4, ipv6, dns, webrtc };
    setCurrent(vector);
    saveData({ current: vector });
    setLoading(false);
  };

  // LEAK DETECTION — returns { leaks, clean } per vector
  const checkLeaks = () => {
    if (!baseline || !current) return null;

    const results = [];

    // IPv4
    if (baseline.ip && current.ip) {
      results.push({
        label: "IPv4",
        leaked: baseline.ip === current.ip
      });
    }

    // IPv6
    if (baseline.ipv6 && current.ipv6) {
      results.push({
        label: "IPv6",
        leaked: baseline.ipv6 === current.ipv6
      });
    }

    // DNS
    if (baseline.dns?.[0] && current.dns?.[0]) {
      results.push({
        label: "DNS",
        leaked: baseline.dns[0] === current.dns[0]
      });
    }

    // WebRTC
    if (baseline.webrtc?.publicIP && current.webrtc?.publicIP) {
      results.push({
        label: "WebRTC",
        leaked: baseline.webrtc.publicIP === current.webrtc.publicIP
      });
    }

    return results;
  };

  // TOGGLE SETTING
  const toggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
    setSettings(updated);
  };

  // TOGGLE BACKGROUND SCAN
  const toggleBackgroundScan = () => {
    const updated = { ...settings, backgroundScan: !settings.backgroundScan };
    saveSettings(updated);
    setSettings(updated);

    if (updated.backgroundScan) {
      chrome.runtime.sendMessage({
        type: "START_BACKGROUND_SCAN",
        interval: settings.scanInterval || 60
      });
    } else {
      chrome.runtime.sendMessage({ type: "STOP_BACKGROUND_SCAN" });
    }
  };

  if (!settings) return <div>Loading...</div>;

  const mask = (value) => {
    if (!value) return "N/A";
    if (!settings.hideSensitive) return value;
    return "••••••••";
  };

  const themeClass = settings.darkMode ? "dark" : "light";
  const leakResults = checkLeaks();
  const hasLeaks = leakResults?.some(r => r.leaked);

  return (
    <div className={`container ${themeClass}`}>

      {/* HEADER */}
      <div className="header">
        <h1>AmiLeaked</h1>
        <div className="icons">
          <button onClick={() => navigate("/settings")}>⚙️</button>
        </div>
      </div>

      {/* MAIN BUTTON */}
      <div className="main">
        <button
          className={`power ${loading ? "scanning" : ""} ${leakResults ? (hasLeaks ? "leak" : "clean") : ""}`}
          onClick={capture}
          disabled={loading}
        >
          {loading ? "" : "⏻"}
        </button>
        <h2>
          {loading
            ? "Scanning…"
            : !current
              ? "VPN should be ON before scanning"
              : hasLeaks
                ? "Leaks detected"
                : "No leaks detected"}
        </h2>
      </div>

      {/* BACKGROUND SCAN TOGGLE */}
      <div className="card">
        <h3>Background Detection</h3>
        <button onClick={toggleBackgroundScan}>
          {settings.backgroundScan ? "Stop Background Detection" : "Start Background Detection"}
        </button>

        {settings.backgroundScan && countdown !== null && (
          <p className="countdown">Next scan in {countdown}s</p>
        )}

        <label className="interval-label">
          Scan interval
          <select
            className="interval-select"
            value={settings.scanInterval || 60}
            onChange={(e) => changeScanInterval(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50, 60].map((s) => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
        </label>
      </div>

      {/* QUICK SETTINGS */}
      <div className="card">
        <h3>Quick Settings</h3>

        <label>
          Auto capture on startup
          <input type="checkbox" checked={settings.autoCapture}
            onChange={() => toggleSetting("autoCapture")} />
        </label>

        <label>
          Hide sensitive info
          <input type="checkbox" checked={settings.hideSensitive}
            onChange={() => toggleSetting("hideSensitive")} />
        </label>

        <label>
          Dark mode
          <input type="checkbox" checked={settings.darkMode}
            onChange={() => toggleSetting("darkMode")} />
        </label>
      </div>

      {/* SCAN DATA */}
      <div className="card">
        <h3>Scan Results</h3>

        {!current && <p className="no-data">Press the button above to scan</p>}

        {current && (
          <>
            {/* Overall status */}
            {leakResults && (
              <div className={`status-banner ${hasLeaks ? "leak" : "clean"}`}>
                {hasLeaks ? "⚠️ Leak detected" : "✅ All clear"}
              </div>
            )}

            <div className="vector-row">
              <span className="vector-label">IPv4</span>
              <span className="vector-value">{mask(current.ip)}</span>
              {leakResults && (
                <span className={`vector-badge ${leakResults.find(r => r.label === "IPv4")?.leaked ? "leak" : "clean"}`}>
                  {leakResults.find(r => r.label === "IPv4")?.leaked ? "LEAK" : "OK"}
                </span>
              )}
            </div>

            <div className="vector-row">
              <span className="vector-label">IPv6</span>
              <span className="vector-value">{mask(current.ipv6)}</span>
              {leakResults?.find(r => r.label === "IPv6") && (
                <span className={`vector-badge ${leakResults.find(r => r.label === "IPv6")?.leaked ? "leak" : "clean"}`}>
                  {leakResults.find(r => r.label === "IPv6")?.leaked ? "LEAK" : "OK"}
                </span>
              )}
            </div>

            <div className="vector-row">
              <span className="vector-label">DNS</span>
              <span className="vector-value">{mask(current.dns?.[0])}</span>
              {leakResults?.find(r => r.label === "DNS") && (
                <span className={`vector-badge ${leakResults.find(r => r.label === "DNS")?.leaked ? "leak" : "clean"}`}>
                  {leakResults.find(r => r.label === "DNS")?.leaked ? "LEAK" : "OK"}
                </span>
              )}
            </div>

            <div className="vector-row">
              <span className="vector-label">WebRTC</span>
              <span className="vector-value">{mask(current.webrtc?.publicIP)}</span>
              {leakResults?.find(r => r.label === "WebRTC") && (
                <span className={`vector-badge ${leakResults.find(r => r.label === "WebRTC")?.leaked ? "leak" : "clean"}`}>
                  {leakResults.find(r => r.label === "WebRTC")?.leaked ? "LEAK" : "OK"}
                </span>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}