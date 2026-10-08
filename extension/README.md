# Unique Dispatch - Relay Sync Engine (Chrome Extension Manifest V3)

Enterprise-grade, zero-scrape trip synchronization companion for **Amazon Relay** (`relay.amazon.com/tours`).

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
3. The extension **"Unique Dispatch - Relay Sync Engine"** is now installed!

---

## ⚙️ Configuration & Activation

1. Click on the extension icon in your browser toolbar (pin it for convenience).
2. Enter your Configuration:
   - **Portal Webhook URL**: `http://localhost:3000` (or `https://uniquedispatch.com`)
   - **Ingestion Sync Key**: `ud_live_sync_8892f038c1a9` (or custom key from Super Admin Hub)
   - **Assigned Shift**: Select your active operational shift (Morning / Afternoon / Night).
3. Click **"Save Configuration"**.

---

## 🚚 How It Works on Amazon Relay

1. Log into your Amazon Relay Carrier Portal normally at [https://relay.amazon.com/tours](https://relay.amazon.com/tours).
2. A small status pill will appear in the bottom-right corner: **`UD Sync: Active 🟢`**.
3. Any booked tours, VRIDs, appointment times, and gross rates are automatically synchronized to your Unique Dispatch operations board every 60 seconds.
4. You can also click the **`SYNC NOW`** button anytime to instantly force-sync the active screen.

---

## 🛡️ Anti-Ban Security Architecture

- **Zero-Scrape Human Interaction**: The extension does NOT make unauthorized requests to Amazon APIs, does not perform automated page reloads, and does not simulate bot clicks.
- **Passive Ingestion**: It only reads tour cards that are naturally rendered on the dispatcher's authenticated browser session.
