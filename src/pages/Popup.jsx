import { useEffect, useState } from "react";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { getData, saveData } from "../storage/storageService";
import "./Popup.css";

export default function Popup() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // INITIAL LOAD
  useEffect(() => {
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
    });
  }, []);

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