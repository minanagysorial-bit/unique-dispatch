/**
 * Unique Dispatch - Relay Sync Engine Background Service Worker (Manifest V3)
 * Coordinates secure, rate-limited telemetry between Amazon Relay and the Operations Portal.
 */

const DEFAULT_CONFIG = {
  portalUrl: "https://uniquedispatch.com",
  apiKey: "ud_live_sync_8892f038c1a9",
  currentShift: "morning",
  autoSyncEnabled: true,
  syncIntervalMinutes: 1,
};

function normalizePortalUrl(rawUrl) {
  let url = (rawUrl || DEFAULT_CONFIG.portalUrl).trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.includes("localhost") || url.startsWith("127.0.0.1")) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    url = url.replace(/^http:\/\//i, "https://");
  }
  return url.replace(/\/$/, "");
}

// Initialize settings on install or reload
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
  const normalizedUrl = normalizePortalUrl(existing.portalUrl || DEFAULT_CONFIG.portalUrl);
  const toSave = { ...DEFAULT_CONFIG, ...existing, portalUrl: normalizedUrl };
  await chrome.storage.local.set(toSave);

  // Setup periodic sync alarm
  chrome.alarms.create("periodic_relay_sync", {
    periodInMinutes: toSave.syncIntervalMinutes || 1,
  });

  console.log("🚚 [Unique Dispatch Engine] Service Worker Initialized at:", normalizedUrl);
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

// In-memory cache of latest detected tours
let latestCapturedTours = [];

// Message Dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RELAY_TOURS_DETECTED") {
    if (Array.isArray(message.payload) && message.payload.length > 0) {
      latestCapturedTours = message.payload;
      try {
        chrome.storage.local.set({ lastDetectedTours: latestCapturedTours });
      } catch (e) {}
    }
    handleRelayToursSync(message.payload, message.mode || "upsert")
      .then((res) => sendResponse({ success: true, result: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.type === "GET_LATEST_CACHED_TOURS") {
    sendResponse({ count: latestCapturedTours.length, tours: latestCapturedTours });
    return false;
  }

  if (message.type === "CLEAR_ALL_PORTAL_LOADS") {
    latestCapturedTours = [];
    try {
      chrome.storage.local.set({ lastDetectedTours: [] });
    } catch (e) {}
    clearAllPortalLoads()
      .then((res) => sendResponse({ success: true, result: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "TEST_CONNECTION") {
    testPortalConnection(message.portalUrl, message.apiKey)
      .then((res) => sendResponse({ success: true, data: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "TRIGGER_MANUAL_SYNC") {
    triggerContentSyncOnActiveTab(message.mode || "upsert")
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/**
 * Clear all loads on portal
 */
async function clearAllPortalLoads() {
  const config = await chrome.storage.local.get(["portalUrl", "apiKey"]);
  const portalUrl = normalizePortalUrl(config.portalUrl);
  const apiKey = config.apiKey || DEFAULT_CONFIG.apiKey;

  const endpoint = `${portalUrl}/api/loads/sync`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-unique-dispatch-key": apiKey,
    },
    body: JSON.stringify({ apiKey, action: "clear", mode: "clear" }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Portal Clear Error (${res.status}): ${errorText}`);
  }

  lastPayloadHash = "";
  await chrome.storage.local.set({ lastSyncRecord: null });
  chrome.action.setBadgeText({ text: "" });
  return await res.json();
}

/**
 * Handle and dispatch Relay tour payload to Unique Dispatch portal
 */
async function handleRelayToursSync(loads, mode = "upsert") {
  if (!Array.isArray(loads) || loads.length === 0) {
    return { synced: 0, message: "No active tours detected" };
  }

  const config = await chrome.storage.local.get([
    "portalUrl",
    "apiKey",
    "currentShift",
  ]);

  const portalUrl = normalizePortalUrl(config.portalUrl);
  const apiKey = config.apiKey || DEFAULT_CONFIG.apiKey;
  const currentShift = config.currentShift || "morning";

  // Check if payload actually changed (bypass cache check if replace_all mode)
  const currentHash = simpleHash(JSON.stringify(loads.map((l) => `${l.vrid}-${l.status}-${l.pickupTime}`)));
  if (mode !== "replace_all" && currentHash === lastPayloadHash) {
    console.log("ℹ️ [Unique Dispatch Engine] Payload unchanged, skipping redundant request.");
    return { synced: loads.length, unchanged: true };
  }

  const endpoint = `${portalUrl}/api/loads/sync`;

  const payload = {
    apiKey: apiKey,
    source: "chrome_extension_amazon_relay",
    shift: currentShift,
    mode: mode,
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
  const url = normalizePortalUrl(portalUrl);
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
async function triggerContentSyncOnActiveTab(mode = "upsert") {
  try {
    const tabs = await chrome.tabs.query({
      url: ["https://relay.amazon.com/*", "https://*.relay.amazon.com/*", "https://*.amazon.com/*"],
    });

    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_NOW", mode: mode }, () => {
          const err = chrome.runtime.lastError; // Consume error safely
        });
      }
    }
  } catch (e) {
    console.warn("Trigger sync tabs query error:", e);
  }
}
