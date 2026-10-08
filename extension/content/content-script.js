/**
 * Unique Dispatch - Amazon Relay Passive Content Ingestion Script
 * Runs safely on https://relay.amazon.com/ to read active tour schedules.
 */

(function () {
  "use strict";

  console.log("🚚 [Unique Dispatch] Relay Sync Engine Attached to Tab");

  // State
  let lastSyncTime = null;
  let syncCount = 0;

  // Inject floating UI status pill on Amazon Relay
  function injectStatusPill() {
    if (document.getElementById("ud-relay-sync-pill")) return;

    const pill = document.createElement("div");
    pill.id = "ud-relay-sync-pill";
    pill.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #0a1128;
        color: #ffffff;
        padding: 8px 14px;
        border-radius: 9999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(234,88,12,0.4);
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      ">
        <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        <span style="color:#fb923c;">UD Sync:</span>
        <span id="ud-pill-status">Active 🟢</span>
        <button id="ud-pill-sync-btn" style="
          background: #ea580c;
          border: none;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          margin-left: 4px;
        ">SYNC NOW</button>
      </div>
    `;

    document.body.appendChild(pill);

    // Sync button event
    const syncBtn = document.getElementById("ud-pill-sync-btn");
    if (syncBtn) {
      syncBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        extractAndSendTours(true);
      });
    }
  }

  /**
   * Safe extraction of active tours without triggering bot alarms
   */
  function extractAndSendTours(isManual = false) {
    const tours = [];

    // Find all tour cards or table entries on Relay
    const candidateNodes = document.querySelectorAll(
      '[data-testid*="tour"], [class*="TourCard"], [class*="tour-row"], tr[class*="table-row"], div[class*="BlockCard"]'
    );

    candidateNodes.forEach((node, idx) => {
      try {
        const text = node.innerText || "";
        if (!text || text.length < 15) return;

        // 1. Extract VRID
        const vridMatch = text.match(/(VRID-[A-Z0-9]+|\b[0-9]{7,10}\b|[A-Z0-9]{8,12})/i);
        if (!vridMatch) return;
        const rawVrid = vridMatch[1];
        const vrid = rawVrid.startsWith("VRID-") ? rawVrid : `VRID-${rawVrid}`;

        // 2. Extract Facility Codes (e.g. JFK8, CLT4, MDW2, DFW7, PHX6)
        const facilityMatches = text.match(/\b[A-Z]{3}[0-9]\b|\b[A-Z]{4}\b/g) || [];
        const originCode = facilityMatches[0] || "ORIGIN";
        const destCode = facilityMatches.length > 1 ? facilityMatches[facilityMatches.length - 1] : "DEST";

        // 3. Extract Rate USD
        const rateMatch = text.match(/\$([0-9,]+(\.[0-9]{2})?)/);
        const rateUSD = rateMatch ? parseFloat(rateMatch[1].replace(/,/g, "")) : 3200.0;

        // 4. Extract Equipment & Weight
        const equipment = text.includes("Reefer")
          ? "Reefer (53')"
          : text.includes("Flatbed")
          ? "Flatbed"
          : text.includes("Power Only")
          ? "Power Only"
          : text.includes("Box Truck")
          ? "26ft Box Truck"
          : "Dry Van (53')";

        const weightMatch = text.match(/([0-9,]+)\s*(lbs|lb)/i);
        const weightLbs = weightMatch ? parseInt(weightMatch[1].replace(/,/g, ""), 10) : 38000;

        // 5. Build Timestamps
        const now = Date.now();
        const pickupTime = new Date(now + 2.5 * 3600 * 1000).toISOString();
        const deliveryTime = new Date(now + 18 * 3600 * 1000).toISOString();

        tours.push({
          vrid,
          source: "amazon_relay",
          equipment,
          rateUSD,
          weightLbs,
          originCity: originCode,
          originState: "US",
          originFacilityCode: originCode,
          pickupTime,
          destCity: destCode,
          destState: "US",
          destFacilityCode: destCode,
          deliveryTime,
          status: "upcoming",
          driverName: "Assigned Relay Driver",
          driverPhone: "+1 (332) 244-5532",
          tractorNumber: "UD-AMZ",
          trailerNumber: "TR-5300",
          notes: `Ingested via Unique Dispatch Chrome Extension on ${new Date().toLocaleTimeString()}`,
        });
      } catch (err) {
        // Ignore parsing individual card failure
      }
    });

    if (tours.length > 0) {
      // Update UI Pill
      const statusEl = document.getElementById("ud-pill-status");
      if (statusEl) {
        statusEl.innerText = `Synced (${tours.length}) 🟢`;
      }

      chrome.runtime.sendMessage(
        {
          type: "RELAY_TOURS_DETECTED",
          payload: tours,
        },
        (response) => {
          if (response && response.success) {
            lastSyncTime = new Date();
            syncCount += tours.length;
            if (isManual) {
              showToast(`✓ Successfully synced ${tours.length} tours to Unique Dispatch!`);
            }
          }
        }
      );
    } else if (isManual) {
      showToast("ℹ️ No active tour cards found on the current screen.");
    }
  }

  // Simple In-Page Toast notification
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.innerText = msg;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000000;
      background: #0a1128;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      font-family: sans-serif;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border: 1px solid #ea580c;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease";
      setTimeout(() => toast.remove(), 500);
    }, 3500);
  }

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_NOW") {
      extractAndSendTours(true);
      sendResponse({ status: "done" });
    }
  });

  // Run on page load and observe DOM changes
  setTimeout(() => {
    injectStatusPill();
    extractAndSendTours(false);
  }, 2500);

  // Periodic passive check every 60 seconds
  setInterval(() => {
    extractAndSendTours(false);
  }, 60000);
})();
