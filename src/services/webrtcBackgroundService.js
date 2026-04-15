import { getWebRTCIPs } from "./webrtcService.js";

let ensureOffscreenPromise = null;

async function ensureOffscreenDocument() {
  if (!chrome?.offscreen?.createDocument) {
    return false;
  }

  // If already created in this service worker lifetime, reuse it.
  if (ensureOffscreenPromise) return ensureOffscreenPromise;

  ensureOffscreenPromise = (async () => {
    const url = chrome.runtime.getURL("src/offscreen.html");

    // If it already exists, this will throw; treat that as "ok".
    try {
      await chrome.offscreen.createDocument({
        url,
        reasons: ["WEB_RTC"],
        justification: "Collect WebRTC ICE candidates for leak detection."
      });
    } catch (e) {
      const msg = e?.message || String(e);
      if (!/Only a single offscreen document/i.test(msg)) {
        console.warn("AmiLeaked: offscreen createDocument failed:", msg);
        return false;
      }
    }

    return true;
  })();

  return ensureOffscreenPromise;
}

export async function getWebRTCIPsForBackgroundScan() {
  // If WebRTC is available in this context (e.g. Firefox background page),
  // just use the existing implementation.
  if (typeof RTCPeerConnection !== "undefined") {
    return await getWebRTCIPs();
  }

  const offscreenOk = await ensureOffscreenDocument();
  if (!offscreenOk) return null;

  return await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_WEBRTC_IPS" }, (res) => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.warn("AmiLeaked: offscreen WebRTC message failed:", err.message);
        resolve(null);
        return;
      }
      resolve(res?.ok ? res.webrtc : null);
    });
  });
}

