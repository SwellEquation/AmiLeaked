import { useEffect, useState } from "react";
import { getPublicIPv4 } from "../services/ipService";
import { saveIPRecord, getLastCapturedIP } from "../storage/storageService";
import { getCurrentTimestamp } from "../utils/timeUtils";
import "./Popup.css";

export default function Popup() {
  const [result, setResult] = useState("Loading...");

  useEffect(() => {
    getLastCapturedIP((record) => {
      if (record) {
        setResult(
          `Last Captured IPv4: ${record.ip}\nTimestamp: ${record.timestamp}`
        );
      } else {
        setResult("No IPv4 captured yet.");
      }
    });
  }, []);

  const handleCapture = async () => {
    setResult("Capturing...");

    try {
      const ip = await getPublicIPv4();
      const timestamp = getCurrentTimestamp();

      const record = { ip, timestamp };
      saveIPRecord(record);

      setResult(`IPv4: ${ip}\nCaptured: ${timestamp}`);
    } catch (error) {
      console.error(error);
      setResult("Error capturing IP.");
    }
  };

  return (
    <div className="container">
      <h1>AmiLeaked</h1>

      <button onClick={handleCapture}>
        Capture IPv4 Address
      </button>

      <div className="result">
        {result.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
