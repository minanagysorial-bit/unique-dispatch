document.addEventListener("DOMContentLoaded", async () => {
  const portalUrlInput = document.getElementById("portal-url");
  const apiKeyInput = document.getElementById("api-key");
  const shiftSelect = document.getElementById("shift-select");
  const autoSyncToggle = document.getElementById("auto-sync-toggle");
  const statusBadge = document.getElementById("status-badge");
  const statusText = document.getElementById("status-text");
  const lastSyncTimeEl = document.getElementById("last-sync-time");
  const alertBox = document.getElementById("alert-box");

  const btnSave = document.getElementById("btn-save");
  const btnSyncNow = document.getElementById("btn-sync-now");

  // Load stored configuration
  const config = await chrome.storage.local.get([
    "portalUrl",
    "apiKey",
    "currentShift",
    "autoSyncEnabled",
    "lastSyncRecord",
  ]);

  portalUrlInput.value = config.portalUrl || "http://localhost:3000";
  apiKeyInput.value = config.apiKey || "ud_live_sync_8892f038c1a9";
  shiftSelect.value = config.currentShift || "morning";
  autoSyncToggle.checked = config.autoSyncEnabled !== false;

  if (config.lastSyncRecord && config.lastSyncRecord.lastSyncedAt) {
    const d = new Date(config.lastSyncRecord.lastSyncedAt);
    lastSyncTimeEl.innerText = `${d.toLocaleTimeString()} (${config.lastSyncRecord.totalLoads || 0} loads)`;
  }

  // Test Connectivity
  async function checkConnectivity() {
    statusBadge.className = "badge badge-checking";
    statusText.innerText = "Checking...";

    try {
      chrome.runtime.sendMessage(
        {
          type: "TEST_CONNECTION",
          portalUrl: portalUrlInput.value.trim(),
          apiKey: apiKeyInput.value.trim(),
        },
        (res) => {
          if (res && res.success && res.data && (res.data.status === 200 || res.data.status === 401 || res.data.ok)) {
            statusBadge.className = "badge badge-connected";
            statusText.innerText = "Connected";
          } else {
            statusBadge.className = "badge badge-disconnected";
            statusText.innerText = "Offline";
          }
        }
      );
    } catch (e) {
      statusBadge.className = "badge badge-disconnected";
      statusText.innerText = "Offline";
    }
  }

  checkConnectivity();

  function showAlert(msg, isSuccess = true) {
    alertBox.innerText = msg;
    alertBox.className = `alert-box ${isSuccess ? "alert-success" : "alert-error"}`;
    setTimeout(() => {
      alertBox.className = "alert-box hidden";
    }, 3500);
  }

  // Save Settings
  btnSave.addEventListener("click", async () => {
    const portalUrl = portalUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const currentShift = shiftSelect.value;
    const autoSyncEnabled = autoSyncToggle.checked;

    await chrome.storage.local.set({
      portalUrl,
      apiKey,
      currentShift,
      autoSyncEnabled,
    });

    showAlert("✓ Configuration saved successfully!");
    checkConnectivity();
  });

  // Manual Sync Now
  btnSyncNow.addEventListener("click", async () => {
    btnSyncNow.disabled = true;
    btnSyncNow.innerText = "Extracting...";

    try {
      // 1. First check if current tab is Amazon Relay
      let targetTab = null;
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url && activeTab.url.includes("relay.amazon.com")) {
        targetTab = activeTab;
      } else {
        // 2. Otherwise find any open Amazon Relay tab
        const relayTabs = await chrome.tabs.query({ url: ["https://relay.amazon.com/*", "https://*.relay.amazon.com/*"] });
        if (relayTabs && relayTabs.length > 0) {
          targetTab = relayTabs[0];
        }
      }

      if (!targetTab) {
        showAlert("⚠️ No open Amazon Relay tab found. Please open https://relay.amazon.com/tours first.", false);
        btnSyncNow.disabled = false;
        btnSyncNow.innerText = "⚡ Sync Active Relay Screen";
        return;
      }

      chrome.tabs.sendMessage(targetTab.id, { type: "EXTRACT_NOW" }, (res) => {
        btnSyncNow.disabled = false;
        btnSyncNow.innerText = "⚡ Sync Active Relay Screen";
        showAlert("✓ Extracted tours from Amazon Relay tab!");
        
        setTimeout(async () => {
          const updated = await chrome.storage.local.get(["lastSyncRecord"]);
          if (updated.lastSyncRecord && updated.lastSyncRecord.lastSyncedAt) {
            const d = new Date(updated.lastSyncRecord.lastSyncedAt);
            lastSyncTimeEl.innerText = `${d.toLocaleTimeString()} (${updated.lastSyncRecord.totalLoads || 0} loads)`;
          }
        }, 1500);
      });
    } catch (e) {
      btnSyncNow.disabled = false;
      btnSyncNow.innerText = "⚡ Sync Active Relay Screen";
      showAlert("Sync error: " + e.message, false);
    }
  });
});
