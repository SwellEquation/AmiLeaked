import { getPublicIPv4 } from "./ipService.js";
import { saveIPRecord } from "../storage/storageService.js";

let backgroundInterval = null;

export async function captureIPInBackground() {
  try {
    const ip = await getPublicIPv4();

    const record = {
      ip: ip,
      timestamp: new Date().toISOString(),
      source: "background_periodic_capture"
    };

    saveIPRecord(record);

    console.log("Background IP captured:", record);

  } catch (error) {
    console.error("Background IP capture failed:", error);
  }
}

export function startBackgroundPeriodicCapture(interval = 60000) {

  if (backgroundInterval) return;

  backgroundInterval = setInterval(() => {
    captureIPInBackground();
  }, interval);

  console.log("Background IP capture started.");
}
