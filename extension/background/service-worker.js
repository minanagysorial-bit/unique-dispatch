/**
 * Unique Dispatch - Relay Sync Engine Background Service Worker (Manifest V3)
 * Coordinates secure, rate-limited telemetry between Amazon Relay and the Operations Portal.
 */

const DEFAULT_CONFIG = {
  portalUrl: "http://localhost:3000",
  apiKey: "ud_live_sync_8892f038c1a9",
  currentShift: "morning",
  autoSyncEnabled: true,
  syncIntervalMinutes: 1,
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
  const toSave = { ...DEFAULT_CONFIG, ...existing };
  await chrome.storage.local.set(toSave);

  // Setup periodic sync alarm
  chrome.alarms.create("periodic_relay_sync", {
    periodInMinutes: toSave.syncIntervalMinutes || 1,
  });

  console.log("🚚 [Unique Dispatch Engine] Service Worker Initialized");
});

// Alarm trigger for periodic refresh check
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "periodic_relay_sync") {
    const config = await chrome.storage.local.get(["autoSyncEnabled"]);
    if (config.autoSyncEnabled !== false) {
      triggerContentSyncOnActiveTab();
    }
  }
});

// Last synced payload hash to prevent duplicate network spam
let lastPayloadHash = "";

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

// Message Dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RELAY_TOURS_DETECTED") {
    handleRelayToursSync(message.payload)
      .then((res) => sendResponse({ success: true, result: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.type === "TEST_CONNECTION") {
    testPortalConnection(message.portalUrl, message.apiKey)
      .then((res) => sendResponse({ success: true, data: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "TRIGGER_MANUAL_SYNC") {
    triggerContentSyncOnActiveTab()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/**
 * Handle and dispatch Relay tour payload to Unique Dispatch portal
 */
async function handleRelayToursSync(loads) {
  if (!Array.isArray(loads) || loads.length === 0) {
    return { synced: 0, message: "No active tours detected" };
  }

  const config = await chrome.storage.local.get([
    "portalUrl",
    "apiKey",
    "currentShift",
  ]);

  const portalUrl = (config.portalUrl || DEFAULT_CONFIG.portalUrl).replace(/\/$/, "");
  const apiKey = config.apiKey || DEFAULT_CONFIG.apiKey;
  const currentShift = config.currentShift || "morning";

  // Check if payload actually changed
  const currentHash = simpleHash(JSON.stringify(loads.map((l) => `${l.vrid}-${l.status}-${l.pickupTime}`)));
  if (currentHash === lastPayloadHash) {
    console.log("ℹ️ [Unique Dispatch Engine] Payload unchanged, skipping redundant request.");
    return { synced: loads.length, unchanged: true };
  }

  const endpoint = `${portalUrl}/api/loads/sync`;

  const payload = {
    apiKey: apiKey,
    source: "chrome_extension_amazon_relay",
    shift: currentShift,
    loads: loads,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-unique-dispatch-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Portal API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  lastPayloadHash = currentHash;

  // Save last sync stats
  const syncRecord = {
    lastSyncedAt: new Date().toISOString(),
    totalLoads: loads.length,
    status: "success",
  };
  await chrome.storage.local.set({ lastSyncRecord: syncRecord });

  // Update Extension Badge
  chrome.action.setBadgeText({ text: String(loads.length) });
  chrome.action.setBadgeBackgroundColor({ color: "#ea580c" }); // Orange badge

  console.log("✓ [Unique Dispatch Engine] Synced successfully:", data);
  return data;
}

/**
 * Test connectivity with Portal
 */
async function testPortalConnection(portalUrl, apiKey) {
  const url = (portalUrl || DEFAULT_CONFIG.portalUrl).replace(/\/$/, "");
  const key = apiKey || DEFAULT_CONFIG.apiKey;

  try {
    const res = await fetch(`${url}/api/loads/sync`, {
      method: "GET",
      headers: {
        "x-unique-dispatch-key": key,
      },
    });

    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: 500, ok: false, error: e.message };
  }
}

/**
 * Find active Amazon Relay tab and request extraction
 */
async function triggerContentSyncOnActiveTab() {
  const tabs = await chrome.tabs.query({
    url: ["https://relay.amazon.com/*"],
  });

  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_NOW" }).catch(() => {
        // Tab might not be ready or injected
      });
    }
  }
}
