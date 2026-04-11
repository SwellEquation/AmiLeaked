import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { getWebRTCIPs } from "../services/webrtcService";
import { getBaseline, getSettings, saveSettings, getData, saveData } from "../storage/storageService";
import { clearAlerts } from "../services/notificationService";
import "./Popup.css";

export default function Home() {

  const navigate = useNavigate();
  const [baseline, setBaseline] = useState(null);
  const [current, setCurrent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // INITIAL LOAD
  useEffect(() => {
    getBaseline((b) => setBaseline(b));
    getSettings((s) => setSettings(s));
    getData((stored) => {
      if (stored?.current) setCurrent(stored.current);
    });
    clearAlerts();
  }, []);

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

  // TOGGLE BACKGROUND SCAN
  const toggleBackgroundScan = () => {
    const updated = { ...settings, backgroundScan: !settings.backgroundScan };
    saveSettings(updated);
    setSettings(updated);

    chrome.runtime.sendMessage({
      type: updated.backgroundScan ? "START_BACKGROUND_SCAN" : "STOP_BACKGROUND_SCAN"
    });
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
        <button onClick={toggleBackgroundScan}>
          {settings.backgroundScan ? "Stop Background Detection" : "Start Background Detection"}
        </button>
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