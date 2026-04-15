import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSettings, saveSettings } from "../storage/storageService";
import "./Settings.css";

export default function Settings() {

  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const showNotificationModes = false;

  useEffect(() => {
    getSettings((s) => {
      // Migrate legacy modes now that the UI is badge-only.
      if (s?.notifications && s.notifyMode !== "badge") {
        const updated = { ...s, notifyMode: "badge" };
        saveSettings(updated);
        setSettings(updated);
        return;
      }
      setSettings(s);
    });
  }, []);

  const toggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
    setSettings(updated);
  };

  const toggleBadgeNotifications = () => {
    const enabled = !settings.notifications;
    const updated = {
      ...settings,
      notifications: enabled,
      notifyMode: "badge"
    };
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

  const themeClass = settings.darkMode ? "dark" : "light";

  return (
    <div className={`container ${themeClass}`}>
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate("/")}>←</button>
        <h1>Settings</h1>
      </div>

      {/* Notifications */}
      <div className="card">
        <h3>Leak Notifications</h3>

        <label>
          Enable badge notifications
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={toggleBadgeNotifications}
          />
        </label>

        {showNotificationModes && settings.notifications && (
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
