import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSettings, saveSettings } from "../storage/storageService";
import "./Settings.css";

export default function Settings() {

  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings((s) => setSettings(s));
  }, []);

  const toggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
    setSettings(updated);
  };

  const setNotifyMode = (mode) => {
    const updated = { ...settings, notifyMode: mode };
    saveSettings(updated);
    setSettings(updated);
  };

  const recaptureBaseline = () => {
    navigate("/setup");
  };

  if (!settings) return <div className="container dark">Loading…</div>;

  return (
    <div className="container dark">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate("/")}>←</button>
        <h1>Settings</h1>
      </div>

      {/* General */}
      <div className="card">
        <h3>General</h3>

        <label>
          Auto capture on startup
          <input type="checkbox" checked={settings.autoCapture}
            onChange={() => toggle("autoCapture")} />
        </label>

        <label>
          Hide sensitive info
          <input type="checkbox" checked={settings.hideSensitive}
            onChange={() => toggle("hideSensitive")} />
        </label>

        <label>
          Dark mode
          <input type="checkbox" checked={settings.darkMode}
            onChange={() => toggle("darkMode")} />
        </label>
      </div>

      {/* Notifications */}
      <div className="card">
        <h3>Leak Notifications</h3>

        <label>
          Enable notifications
          <input type="checkbox" checked={settings.notifications}
            onChange={() => toggle("notifications")} />
        </label>

        {settings.notifications && (
          <div className="notify-modes">
            {[
              { value: "badge", label: "Badge only" },
              { value: "os", label: "OS notifications only" },
              { value: "both", label: "Badge + OS notifications" }
            ].map(opt => (
              <label key={opt.value} className="radio-label">
                <span>{opt.label}</span>
                <input
                  type="radio"
                  name="notifyMode"
                  checked={settings.notifyMode === opt.value}
                  onChange={() => setNotifyMode(opt.value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Baseline */}
      <div className="card">
        <h3>Baseline</h3>
        <p className="card-desc">
          Re-capture your real IP fingerprint. Make sure your VPN is disconnected before proceeding.
        </p>
        <button className="recapture-btn" onClick={recaptureBaseline}>
          Re-capture Baseline
        </button>
      </div>
    </div>
  );
}
