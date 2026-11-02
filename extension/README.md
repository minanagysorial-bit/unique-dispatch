# Unique Dispatch - Relay Ops Controller & CPT Engine v3.0 (Chrome Extension MV3)

Enterprise-grade, in-page operations companion docked directly inside **Amazon Relay** (`relay.amazon.com/trips`).

---

## 🌟 Key Features in v3.0.0

- **In-Page Docked Operations Sidebar**: Docked seamlessly on the right side of Amazon Relay without obscuring trip cards or tables.
- **Priority Dispatch System**:
  1. **Delays Raised**: Critical delay and disruption detection ranked #1.
  2. **3.5h Pickup Milestone**: Flags tours departing within 3.5 hours for driver check-in.
  3. **30m Delivery Milestone**: Flags tours arriving within 30 minutes for delivery confirmation.
  4. **Nominal Status**: Clean green overview when all loads are under control.
- **Persistent Siren Engine**: Built-in Web Audio alert that sounds continuously until acknowledged by the dispatcher.
- **30-Minute Auto-Sync & Live Countdown**: Synchronizes every 30 minutes with real-time countdown (`29:45`) and manual `⚡ Fetch Relay Loads` button.
- **Tri-Tab Filtering**: View all, upcoming, in-transit, or history tours with search and single/date-range filtering.
- **Full Data Extraction**: Retains multi-leg sub-trips, stops, drivers, equipment, ARN numbers, and rates.

---

## 🚀 Quick 1-Minute Installation Guide

### Step 1: Open Chrome / Edge Extensions Page
1. Open Google Chrome, Microsoft Edge, or Brave Browser.
2. In the URL address bar, type:
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`
   - **Brave**: `brave://extensions`

### Step 2: Enable Developer Mode
- In the top right corner of the Extensions page, turn **ON** the toggle for **"Developer mode"**.

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button in the top left corner.
2. Select the `extension` folder located inside your Unique Dispatch directory:
   `c:\Users\Mina\Desktop\Unique Dispatch\extension`
3. The extension **"Unique Dispatch - Relay Ops Controller & CPT Engine"** is now installed!

---

## ⚙️ Configuration & Activation

1. Click on the extension icon in your browser toolbar (pin it for convenience).
2. Enter your Configuration:
   - **Portal Webhook URL**: `https://www.uniquedispatch.com`
   - **Ingestion Sync Key**: `ud_live_sync_8892f038c1a9` (or custom key from Super Admin Hub)
   - **Assigned Shift**: Select your active operational shift (Morning / Afternoon / Night).
3. Click **"Save Configuration"**.

---

## 🚚 How It Works on Amazon Relay

1. Log into your Amazon Relay Carrier Portal at [https://relay.amazon.com/trips](https://relay.amazon.com/trips) or [https://relay.amazon.com/tours](https://relay.amazon.com/tours).
2. The **Unique Dispatch Operations Controller** sidebar appears docked on the right side.
3. If any tour is delayed or requires a driver message/call, the persistent siren alert will sound until acknowledged.
4. Tours are automatically synced to your Unique Dispatch operations board every 30 minutes.
