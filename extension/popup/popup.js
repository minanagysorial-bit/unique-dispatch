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

  /**
   * Helper: Normalize user-entered Portal URL to prevent CORS preflight redirect errors
   */
  function normalizePortalUrl(rawUrl) {
    let url = (rawUrl || "https://uniquedispatch.com").trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes("localhost") || url.startsWith("127.0.0.1")) {
        url = `http://${url}`;
      } else {
        url = `https://${url}`;
      }
    }
    // If user typed http:// for a remote domain (e.g. http://uniquedispatch.com), upgrade to https:// to prevent preflight redirect
    if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
      url = url.replace(/^http:\/\//i, "https://");
    }
    return url.replace(/\/$/, "");
  }

  // Load stored configuration & sanitize immediately
  const config = await chrome.storage.local.get([
    "portalUrl",
    "apiKey",
    "currentShift",
    "autoSyncEnabled",
    "lastSyncRecord",
  ]);

  const cleanPortalUrl = normalizePortalUrl(config.portalUrl || "https://uniquedispatch.com");
  portalUrlInput.value = cleanPortalUrl;
  apiKeyInput.value = config.apiKey || "ud_live_sync_8892f038c1a9";
  shiftSelect.value = config.currentShift || "morning";
  autoSyncToggle.checked = config.autoSyncEnabled !== false;

  // Persist cleaned URL back to storage immediately if it had http://
  if (config.portalUrl !== cleanPortalUrl) {
    await chrome.storage.local.set({ portalUrl: cleanPortalUrl });
  }

  if (config.lastSyncRecord && config.lastSyncRecord.lastSyncedAt) {
    const d = new Date(config.lastSyncRecord.lastSyncedAt);
    lastSyncTimeEl.innerText = `${d.toLocaleTimeString()} (${config.lastSyncRecord.totalLoads || 0} loads)`;
  }

  // Test Connectivity
  async function checkConnectivity() {
    statusBadge.className = "badge badge-checking";
    statusText.innerText = "Checking...";

    const cleanUrl = normalizePortalUrl(portalUrlInput.value);

    try {
      chrome.runtime.sendMessage(
        {
          type: "TEST_CONNECTION",
          portalUrl: cleanUrl,
          apiKey: apiKeyInput.value.trim(),
        },
        (res) => {
          if (res && res.success && res.data && (res.data.status === 200 || res.data.ok)) {
            statusBadge.className = "badge badge-connected";
            statusText.innerText = "Connected 🟢";
          } else {
            statusBadge.className = "badge badge-disconnected";
            statusText.innerText = "Offline 🔴";
          }
        }
      );
    } catch (e) {
      statusBadge.className = "badge badge-disconnected";
      statusText.innerText = "Offline 🔴";
    }
  }

  checkConnectivity();

  function showAlert(msg, isSuccess = true) {
    alertBox.innerText = msg;
    alertBox.className = `alert-box ${isSuccess ? "alert-success" : "alert-error"}`;
    setTimeout(() => {
      alertBox.className = "alert-box hidden";
    }, 4500);
  }

  // Save Settings
  btnSave.addEventListener("click", async () => {
    const portalUrl = normalizePortalUrl(portalUrlInput.value);
    const apiKey = apiKeyInput.value.trim();
    const currentShift = shiftSelect.value;
    const autoSyncEnabled = autoSyncToggle.checked;

    portalUrlInput.value = portalUrl;

    await chrome.storage.local.set({
      portalUrl,
      apiKey,
      currentShift,
      autoSyncEnabled,
    });

    showAlert("✓ Configuration saved & normalized successfully!");
    checkConnectivity();
  });

  // Manual Sync Now
  btnSyncNow.addEventListener("click", async () => {
    btnSyncNow.disabled = true;
    btnSyncNow.innerText = "Extracting...";

    try {
      // 1. First check if current tab or open tab is Amazon Relay
      let targetTab = null;

      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url && activeTab.url.includes("relay.amazon.com")) {
          targetTab = activeTab;
        }
      } catch (tabErr) {
        console.warn("Active tab query notice:", tabErr);
      }

      if (!targetTab) {
        try {
          const relayTabs = await chrome.tabs.query({ url: ["https://relay.amazon.com/*", "https://*.relay.amazon.com/*"] });
          if (relayTabs && relayTabs.length > 0) {
            targetTab = relayTabs[0];
          }
        } catch (tabErr2) {
          console.warn("Relay tabs query notice:", tabErr2);
        }
      }

      if (!targetTab) {
        showAlert("⚠️ No open Amazon Relay tab found. Please open https://relay.amazon.com/tours first.", false);
        btnSyncNow.disabled = false;
        btnSyncNow.innerText = "⚡ Sync Active Relay Screen";
        return;
      }

      // 2. Send message to content script
      chrome.tabs.sendMessage(targetTab.id, { type: "EXTRACT_NOW" }, async (res) => {
        const hasError = chrome.runtime.lastError || !res;

        if (hasError) {
          // Attempt script injection if chrome.scripting is supported
          if (chrome.scripting && typeof chrome.scripting.executeScript === "function") {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                files: ["content/content-script.js"],
              });
              setTimeout(() => {
                chrome.tabs.sendMessage(targetTab.id, { type: "EXTRACT_NOW" }, () => {
                  showAlert("✓ Sync attached & extracted from Amazon Relay!");
                });
              }, 400);
            } catch (injErr) {
              showAlert("⚠️ Please refresh (F5) the Amazon Relay tab once to attach sync.", false);
            }
          } else {
            showAlert("⚠️ Please refresh (F5) the Amazon Relay tab once to attach sync.", false);
          }
        } else {
          showAlert("✓ Extracted tours from Amazon Relay tab!");
        }

        btnSyncNow.disabled = false;
        btnSyncNow.innerText = "⚡ Sync Active Relay Screen";

        setTimeout(async () => {
          const updated = await chrome.storage.local.get(["lastSyncRecord"]);
          if (updated.lastSyncRecord && updated.lastSyncRecord.lastSyncedAt) {
            const d = new Date(updated.lastSyncRecord.lastSyncedAt);
            lastSyncTimeEl.innerText = `${d.toLocaleTimeString()} (${updated.lastSyncRecord.totalLoads || 0} loads)`;
          }
        }, 1200);
      });
    } catch (e) {
      btnSyncNow.disabled = false;
      btnSyncNow.innerText = "⚡ Sync Active Relay Screen";
      showAlert("⚠️ Please refresh (F5) the Amazon Relay tab once.", false);
    }
  });
});
