# AmiLeaked

**AmiLeaked** is a browser extension that detects network leaks while you're connected to a VPN. It captures your real network fingerprint as a baseline, then continuously monitors for IPv4, IPv6, DNS, and WebRTC leaks that could expose your true identity.

## How It Works

1. **Baseline Capture** — On first setup, you disconnect your VPN and AmiLeaked records your real IP fingerprint (IPv4, IPv6, DNS resolver, WebRTC IPs).
2. **On-Demand Scan** — With your VPN active, press the power button to run a full scan. If any current values match your baseline, a leak is flagged.
3. **Background Detection** — Optionally runs scans every 60 seconds in the background and alerts you immediately if a leak is detected.

## Features

- **Multi-vector leak detection**: Checks IPv4, IPv6, DNS, and WebRTC simultaneously
- **Background monitoring**: Periodic scans with configurable notifications (badge icon, OS notifications, or both)
- **WebRTC leak detection**: Uses STUN servers to discover public and local IPs exposed via `RTCPeerConnection`
- **DNS leak detection**: Queries Google DNS to identify your resolver IP
- **Dual IPv4 sources**: Primary fetch via [ipify](https://api.ipify.org), automatic fallback to [AWS checkip](https://checkip.amazonaws.com)
- **First-time setup wizard**: Guided baseline capture with confirmation steps
- **Re-capture baseline**: Update your fingerprint anytime from the Settings page
- **Dark / Light theme**: Toggle between themes
- **Hide sensitive info**: Mask IP address information in the popup UI
- **Cross-browser support**: Manifest V3 (Chrome) and Manifest V2 (Firefox) via `vite-plugin-web-extension`

## Tech Stack

- **React 18** + **React Router**: Popup UI and page navigation
- **Vite** + **vite-plugin-web-extension**: Build tooling with hot reload
- **Chrome Extension APIs**: `chrome.storage`, `chrome.notifications`, `chrome.action`
- **WebRTC**: `RTCPeerConnection` for local/public IP discovery

## Project Structure

```
src/
├── background.js                # Service worker / background script entry
├── manifest.json                # Extension manifest (Chrome + Firefox templates)
├── popup.html / popup.jsx       # Extension popup entry point
├── pages/
│   ├── Popup.jsx                # Main scan UI with leak detection
│   ├── Settings.jsx             # Settings page (theme, notifications, baseline)
│   └── Setup.jsx                # First-time baseline capture wizard
├── services/
│   ├── ipService.js             # Public IPv4/IPv6 and DNS resolver fetching
│   ├── webrtcService.js         # WebRTC IP discovery via STUN
│   ├── backgroundIPService.js   # Periodic background scan service
│   └── notificationService.js   # Badge and OS notification alerts
├── storage/
│   └── storageService.js        # chrome.storage abstraction (baseline, settings, history)
├── content_scripts/
│   └── content.js               # Content script (injected into pages)
└── utils/
    └── timeUtils.js             # Timestamp utilities
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or yarn

### Install & Build

```bash
npm install
npm run build
```

### Development

```bash
npm run dev
```

### Load in Chrome

1. Navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the dist folder

### Load in Firefox

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** and select manifest.json

## Usage

1. **Setup**: Disconnect your VPN, open the extension, and complete the baseline capture.
2. **Scan**: Reconnect your VPN, then press the power button to check for leaks.
3. **Background mode**: Enable background detection for continuous monitoring with notifications.

## License

This project is licensed under the GNU General Public License v3.0.
