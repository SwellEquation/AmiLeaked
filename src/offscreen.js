import { getWebRTCIPs } from "./services/webrtcService.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === "GET_WEBRTC_IPS") {
    getWebRTCIPs()
      .then((res) => sendResponse({ ok: true, webrtc: res }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || String(err) }));
    return true;
  }
});

