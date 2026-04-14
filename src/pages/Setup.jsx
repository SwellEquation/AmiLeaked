import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicIPv4, getPublicIPv6, getDNSServers } from "../services/ipService";
import { getWebRTCIPs } from "../services/webrtcService";
import { saveBaseline, saveSettings, getSettings, saveData } from "../storage/storageService";
import "./Setup.css";

export default function Setup({ onComplete }) {

  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = confirm VPN off, 2 = capturing, 3 = done
  const [confirmed, setConfirmed] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [results, setResults] = useState(null);

  const vectors = [
    { key: "ip", label: "IPv4 Address" },
    { key: "ipv6", label: "IPv6 Address" },
    { key: "dns", label: "DNS Resolver" },
    { key: "webrtc", label: "WebRTC" }
  ];

  const captureBaseline = async () => {
    setCapturing(true);
    setStep(2);

    const [ipv4, ipv6, dns, webrtc] = await Promise.all([
      getPublicIPv4(),
      getPublicIPv6(),
      getDNSServers(),
      getWebRTCIPs()
    ]);

    const baseline = { ip: ipv4, ipv6, dns, webrtc };
    saveBaseline(baseline);
    saveData({ current: null });

    getSettings((settings) => {
      saveSettings({ ...settings, initialized: true });
    });

    setResults(baseline);
    setCapturing(false);
    setStep(3);
  };

  const finish = () => {
    if (onComplete) onComplete();
    navigate("/");
  };

  const getStatus = (key) => {
    if (!results) return null;
    switch (key) {
      case "ip": return results.ip ? "✓" : "—";
      case "ipv6": return results.ipv6 ? "✓" : "—";
      case "dns": return results.dns?.[0] ? "✓" : "—";
      case "webrtc": return results.webrtc?.publicIP || results.webrtc?.localIPs?.length ? "✓" : "—";
      default: return null;
    }
  };

  return (
    <div className="container dark">
      <div className="setup-page">
        <h1>AmiLeaked</h1>
        <p className="setup-subtitle">First-Time Setup</p>

        {/* Step 1: Confirm VPN is off */}
        {step === 1 && (
          <div className="setup-section">
            <div className="setup-card">
              <div className="step-badge">Step 1</div>
              <h3>Disconnect Your VPN</h3>
              <p>
                To detect leaks, AmiLeaked needs to capture your <strong>real</strong> network
                fingerprint first, which will serve as a baseline. This baseline will be compared against future captures
                while your VPN is active.
              </p>

              <div className="vector-list">
                <p className="vector-list-title">What will be captured:</p>
                {vectors.map(v => (
                  <div key={v.key} className="vector-item">
                    <span className="vector-dot">●</span>
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>

              <label className="confirm-label">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={() => setConfirmed(!confirmed)}
                />
                <span>I confirm my VPN is disconnected</span>
              </label>

              <button
                className="setup-btn"
                disabled={!confirmed}
                onClick={captureBaseline}
              >
                Capture Baseline
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Capturing */}
        {step === 2 && (
          <div className="setup-section">
            <div className="setup-card">
              <div className="step-badge">Step 2</div>
              <h3>Capturing Baseline…</h3>
              <div className="vector-list capturing">
                {vectors.map(v => (
                  <div key={v.key} className="vector-item">
                    <span className="vector-spinner">⟳</span>
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="setup-section">
            <div className="setup-card">
              <div className="step-badge success">Complete</div>
              <h3>Baseline Captured</h3>
              <div className="vector-list">
                {vectors.map(v => (
                  <div key={v.key} className="vector-item">
                    <span className={`vector-status ${getStatus(v.key) === "✓" ? "ok" : "na"}`}>
                      {getStatus(v.key)}
                    </span>
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>

              <div className="next-step-info">
                <p>✅ Now connect your VPN and return to AmiLeaked to start scanning for leaks.</p>
              </div>

              <button className="setup-btn" onClick={finish}>
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
