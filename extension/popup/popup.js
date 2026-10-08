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
    // Upgrade http to https for remote domains
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

  // Persist cleaned URL back to storage immediately if needed
  if (config.portalUrl !== cleanPortalUrl) {
    await chrome.storage.local.set({ portalUrl: cleanPortalUrl });
  }

  if (config.lastSyncRecord && config.lastSyncRecord.lastSyncedAt) {
    const d = new Date(config.lastSyncRecord.lastSyncedAt);
    lastSyncTimeEl.innerText = `${d.toLocaleTimeString()} (${config.lastSyncRecord.totalLoads || 0} loads)`;
  }

  // Test Connectivity
  function checkConnectivity() {
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
          const err = chrome.runtime.lastError;
          if (!err && res && res.success && res.data && (res.data.status === 200 || res.data.ok)) {
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

  // Render detected tours preview
  function renderDetectedTours(tours) {
    const listEl = document.getElementById("detected-tours-list");
    const countBadge = document.getElementById("detected-count-badge");
    if (!listEl || !countBadge) return;

    if (!Array.isArray(tours) || tours.length === 0) {
      countBadge.innerText = "0 Captured";
      countBadge.style.color = "#94a3b8";
      listEl.innerHTML = `<div style="color:#64748b; font-style:italic;">No active tours captured on the Relay screen.</div>`;
      return;
    }

    countBadge.innerText = `${tours.length} Captured`;
    countBadge.style.color = "#38bdf8";

    listEl.innerHTML = tours
      .map((t) => {
        const pDate = new Date(t.pickupTime);
        const isTomorrow = pDate.getDate() === new Date(Date.now() + 24 * 3600 * 1000).getDate();
        const dateTag = isTomorrow ? "Tomorrow" : `${pDate.getMonth() + 1}/${pDate.getDate()}`;

        return `
        <div style="background:#050914; padding:6px 8px; border-radius:6px; border:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-family:monospace; font-weight:800; color:#fb923c;">${t.vrid}</div>
            <div style="font-size:9px; color:#94a3b8;">${t.originFacilityCode || t.originCity} ➔ ${t.destFacilityCode || t.destCity}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:#34d399; font-weight:800;">${t.rateUSD > 0 ? `$${t.rateUSD.toLocaleString()}` : "TBD"}</div>
            <div style="font-size:8px; color:#38bdf8; font-weight:700;">📅 ${dateTag}</div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Poll detected tours from active Amazon Relay tab with safe lastError handling
  async function fetchActiveRelayTours() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id && tab.url && tab.url.includes("relay.amazon.com")) {
        chrome.tabs.sendMessage(tab.id, { type: "GET_DETECTED_TOURS" }, (res) => {
          const err = chrome.runtime.lastError; // Read and suppress unhandled connection error
          if (!err && res && Array.isArray(res.tours)) {
            renderDetectedTours(res.tours);
          }
        });
      }
    } catch (e) {}
  }

  fetchActiveRelayTours();

  // Manual Sync Now with safe script injection and lastError checks
  btnSyncNow.addEventListener("click", async () => {
    btnSyncNow.disabled = true;
    btnSyncNow.innerText = "Extracting...";

    try {
      let targetTab = null;

      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url && activeTab.url.includes("relay.amazon.com")) {
          targetTab = activeTab;
        }
      } catch (tabErr) {}

      if (!targetTab) {
        try {
          const relayTabs = await chrome.tabs.query({ url: ["https://relay.amazon.com/*", "https://*.relay.amazon.com/*"] });
          if (relayTabs && relayTabs.length > 0) {
            targetTab = relayTabs[0];
          }
        } catch (tabErr2) {}
      }

      if (!targetTab) {
        showAlert("⚠️ No open Amazon Relay tab found. Please open https://relay.amazon.com/tours first.", false);
        btnSyncNow.disabled = false;
        btnSyncNow.innerText = "⚡ Sync Active Relay Screen";
        return;
      }

      // Send message with lastError safety
      chrome.tabs.sendMessage(targetTab.id, { type: "EXTRACT_NOW" }, async (res) => {
        const lastErr = chrome.runtime.lastError;
        const hasError = Boolean(lastErr) || !res;

        if (hasError) {
          if (chrome.scripting && typeof chrome.scripting.executeScript === "function") {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                files: ["content/content-script.js"],
              });
              setTimeout(() => {
                chrome.tabs.sendMessage(targetTab.id, { type: "EXTRACT_NOW" }, (res2) => {
                  const subErr = chrome.runtime.lastError;
                  if (!subErr && res2 && Array.isArray(res2.tours)) {
                    renderDetectedTours(res2.tours);
                  }
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
          if (res && Array.isArray(res.tours)) {
            renderDetectedTours(res.tours);
          }
          showAlert(`✓ Synced ${res?.count || 0} tours from Amazon Relay!`);
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
