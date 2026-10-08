/**
 * Unique Dispatch - Amazon Relay Passive Content Ingestion Script
 * Runs safely on https://relay.amazon.com/ to read active, scheduled, and future tour schedules.
 * High-performance non-blocking scanner with debounced DOM inspection and API interception.
 */

(function () {
  "use strict";

  console.log("🚚 [Unique Dispatch] Relay Content Script Active");

  // In-memory pool of captured tours (from API interception & DOM scanning)
  const capturedToursMap = new Map();
  let isSyncing = false;
  let debounceScanTimer = null;

  // 1. Inject Main-World API Interceptor
  function injectMainWorldInterceptor() {
    try {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("content/relay-interceptor.js");
      script.onload = function () {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      console.warn("[Unique Dispatch] Interceptor injection notice:", e);
    }
  }

  injectMainWorldInterceptor();

  // 2. Listen for messages from Main-World API Interceptor
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "UD_RELAY_RAW_API_TOURS" && Array.isArray(event.data.tours)) {
      console.log(`🚚 [Unique Dispatch] Received ${event.data.tours.length} tours from API Interceptor`);
      let added = false;

      event.data.tours.forEach((tour) => {
        if (tour && tour.vrid) {
          capturedToursMap.set(tour.vrid, tour);
          added = true;
        }
      });

      if (added) {
        updateFloatingPillUI();
        dispatchToursToBackground(Array.from(capturedToursMap.values()), false);
      }
    }
  });

  // 3. Helper: Parse Real Dates from Amazon Relay Text (Today, Tomorrow, Specific Dates)
  function parseDateFromText(text, isDelivery = false) {
    const now = new Date();
    let targetDate = new Date(now);

    const lower = text.toLowerCase();

    // Check for "Tomorrow"
    if (lower.includes("tomorrow") || lower.includes("in 1 day") || lower.includes("in 24 hours")) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lower.includes("in 2 days") || lower.includes("in 48 hours")) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else {
      // Check for Month + Day pattern (e.g. "Oct 9", "Oct 10", "10/09")
      const monthMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\b/i);
      const numericDateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);

      if (monthMatch) {
        const months = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const monthNum = months[monthMatch[1].toLowerCase().slice(0, 3)];
        const dayNum = parseInt(monthMatch[2], 10);
        if (monthNum !== undefined && !isNaN(dayNum)) {
          targetDate.setMonth(monthNum, dayNum);
          if (targetDate.getTime() < now.getTime() - 7 * 24 * 3600 * 1000) {
            targetDate.setFullYear(targetDate.getFullYear() + 1);
          }
        }
      } else if (numericDateMatch) {
        const m = parseInt(numericDateMatch[1], 10) - 1;
        const d = parseInt(numericDateMatch[2], 10);
        if (!isNaN(m) && !isNaN(d)) {
          targetDate.setMonth(m, d);
        }
      }
    }

    // Check for specific clock time (e.g. "08:30 AM", "14:30", "2:00 PM")
    const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)?\b/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridian = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

      if (meridian === "PM" && hours < 12) hours += 12;
      if (meridian === "AM" && hours === 12) hours = 0;

      targetDate.setHours(hours, minutes, 0, 0);
    } else {
      if (isDelivery) {
        targetDate.setHours(targetDate.getHours() + 16);
      } else {
        targetDate.setHours(targetDate.getHours() + 2);
      }
    }

    return targetDate.toISOString();
  }

  // 4. Exact Trip ID Extractor
  function extractExactTripIdFromNode(node, cardText) {
    if (!node) return null;

    // 1. Check anchor links
    if (node.querySelector) {
      const linkEl = node.querySelector('a[href*="/tours/"], a[href*="/trips/"], a[href*="/loads/"], a[href*="/work-opportunities/"], a[href*="/execution/"]');
      if (linkEl && linkEl.href) {
        const match = linkEl.href.match(/\/(?:tours|trips|loads|work-opportunities|execution)\/(?:details\/)?([A-Za-z0-9\-_]+)/i);
        if (match && match[1] && match[1].length >= 3 && !match[1].toLowerCase().includes("search") && !match[1].toLowerCase().includes("history")) {
          return match[1].trim();
        }
      }

      // Check specific data-testid or attributes
      const idEl = node.querySelector(
        '[data-testid*="tour-id"], [data-testid*="trip-id"], [data-testid*="vrid"], [data-testid*="load-id"], [class*="tourId"], [class*="tripId"], [class*="tour-id"], [class*="trip-id"], [class*="tripNumber"], [class*="tourNumber"]'
      );
      if (idEl) {
        const textVal = (idEl.textContent || "").trim();
        const cleaned = textVal.replace(/^(?:Trip\s*(?:ID|#)?|Tour\s*(?:ID|#)?|Load\s*(?:ID|#)?|VRID\s*[:#\-]?)[\s:#\-]*/i, "").trim();
        if (cleaned && cleaned.length >= 3) {
          return cleaned;
        }
      }
    }

    // 2. Look for labeled text pattern (e.g. "Trip ID: 11A8B9C", "Tour #102948", "Tour ID 11A8B9C", "VRID: 9482710")
    const labeledMatch = cardText.match(/(?:Trip\s*(?:ID|#)?|Tour\s*(?:ID|#)?|Load\s*(?:ID|#)?|VRID\s*[:#\-]?)[\s:#\-]+([A-Za-z0-9\-_]{3,24})/i);
    if (labeledMatch && labeledMatch[1]) {
      return labeledMatch[1].trim();
    }

    // 3. Check data attribute on node
    if (node.getAttribute) {
      const dataId = node.getAttribute("data-tour-id") || node.getAttribute("data-trip-id") || node.getAttribute("data-id");
      if (dataId && dataId.length >= 3) {
        return dataId.trim();
      }
    }

    // 4. Token Match in Header/Row: If card contains facility code, extract standalone alphanumeric token at the beginning
    const leadingToken = cardText.match(/^\s*#?([A-Z0-9]{4,16})\b/i);
    if (leadingToken && leadingToken[1]) {
      const cand = leadingToken[1].trim().toUpperCase();
      const forbidden = ["AMAZON", "RELAY", "REEFER", "FLATBED", "DELIVERY", "CARRIER", "PICKUP", "UPCOMING", "TRANSIT", "STATUS", "DRYVAN", "WEIGHT", "EXPEDITED", "SCHEDULED", "BOOKED", "ASSIGNED", "ACTIVE"];
      if (!forbidden.includes(cand)) {
        return leadingToken[1].trim();
      }
    }

    return null;
  }

  // 5. Targeted Fast DOM Tour Scanner (Zero layout thrashing)
  function scanDomForTours() {
    const foundTours = [];
    const seenIds = new Set();

    // Target specific tour containers only
    const candidateNodes = Array.from(
      document.querySelectorAll(
        'table tbody tr, div[role="row"], [data-testid*="tour"], [data-testid*="trip"], [data-testid*="work-opportunity"], [class*="TourCard"], [class*="TripCard"], [class*="tour-card"], [class*="trip-card"], [class*="WorkOpportunityCard"], [class*="ExecutionCard"]'
      )
    );

    for (let i = 0; i < candidateNodes.length; i++) {
      const node = candidateNodes[i];
      try {
        const text = (node.textContent || "").trim();
        if (!text || text.length < 15 || text.length > 2500) continue;

        // Check facility codes
        const facilityMatches = text.match(/\b([A-Z]{3}[0-9]|[A-Z]{4})\b/g) || [];
        const cleanFacilities = facilityMatches.filter((f) => {
          const upper = f.toUpperCase();
          const forbidden = ["POST", "TRIP", "TOUR", "LOAD", "TYPE", "RATE", "TIME", "STOP", "CITY", "DEST", "FROM", "AUTO", "VIEW", "INFO", "COST", "FEES", "PAID", "DAYS", "EDIT", "DATE", "USER", "MORE", "SHOW", "HIDE"];
          return !forbidden.includes(upper);
        });

        const hasRate = /\$[0-9]/.test(text);
        const hasTime = /\b\d{1,2}:\d{2}\b|today|tomorrow|scheduled/i.test(text);

        if (cleanFacilities.length === 0 && !hasRate && !hasTime) continue;

        // Extract Real Trip ID
        let tripId = extractExactTripIdFromNode(node, text);

        if (!tripId) {
          const anyTokenMatch = text.match(/\b([A-Z0-9]{2,4}-[A-Z0-9]{4,12}|[A-Z0-9]{6,16}|\b\d{6,12}\b)\b/);
          if (anyTokenMatch && anyTokenMatch[1]) {
            const cand = anyTokenMatch[1].trim().toUpperCase();
            const forbidden = ["AMAZON", "RELAY", "REEFER", "FLATBED", "DELIVERY", "CARRIER", "PICKUP", "UPCOMING", "TRANSIT", "STATUS", "DRYVAN", "WEIGHT", "EXPEDITED", "SCHEDULED", "BOOKED", "ASSIGNED", "ACTIVE"];
            if (!forbidden.includes(cand) && !cleanFacilities.includes(cand)) {
              tripId = anyTokenMatch[1].trim();
            }
          }
        }

        if (!tripId || seenIds.has(tripId)) continue;

        // Extract Cities / States
        const cityStateMatches = Array.from(text.matchAll(/([A-Za-z\s]{3,20}),\s*([A-Z]{2})\b/g));

        let originCity = "Amazon Origin";
        let originState = "US";
        let originFacility = undefined;

        let destCity = "Amazon Destination";
        let destState = "US";
        let destFacility = undefined;

        if (cleanFacilities.length >= 2) {
          originFacility = cleanFacilities[0];
          destFacility = cleanFacilities[cleanFacilities.length - 1];
        } else if (cleanFacilities.length === 1) {
          originFacility = cleanFacilities[0];
        }

        if (cityStateMatches.length >= 2) {
          originCity = cityStateMatches[0][1].trim();
          originState = cityStateMatches[0][2].trim();
          destCity = cityStateMatches[cityStateMatches.length - 1][1].trim();
          destState = cityStateMatches[cityStateMatches.length - 1][2].trim();
        } else if (cityStateMatches.length === 1) {
          originCity = cityStateMatches[0][1].trim();
          originState = cityStateMatches[0][2].trim();
          destCity = destFacility || "Amazon Destination";
        } else if (originFacility) {
          originCity = originFacility;
          destCity = destFacility || "Destination Facility";
        }

        // Rate
        const rateMatch = text.match(/\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]{3,5}\b)/);
        let rateUSD = 0;
        if (rateMatch) {
          rateUSD = parseFloat(rateMatch[1].replace(/,/g, ""));
        }

        // Weight
        const weightMatch = text.match(/([0-9,]+)\s*(?:lbs|lb|k\s*lbs)/i);
        const weightLbs = weightMatch ? parseInt(weightMatch[1].replace(/,/g, ""), 10) : 38000;

        // Equipment
        let equipment = "Dry Van (53')";
        if (/reefer/i.test(text)) equipment = "Reefer (53')";
        else if (/flatbed/i.test(text)) equipment = "Flatbed";
        else if (/power\s*only/i.test(text)) equipment = "Power Only";
        else if (/box\s*truck|26(?:ft|'|\s*ft)/i.test(text)) equipment = "26ft Box Truck";
        else if (/step\s*deck/i.test(text)) equipment = "Step Deck";

        // Status
        let status = "upcoming";
        if (/in\s*transit|en\s*route|on\s*road/i.test(text)) status = "in_transit";
        else if (/delivered|completed/i.test(text)) status = "delivered";
        else if (/delayed|at\s*risk/i.test(text)) status = "delayed";
        else if (/cancelled/i.test(text)) status = "cancelled";

        const pickupTime = parseDateFromText(text, false);
        const deliveryTime = parseDateFromText(text, true);

        // Build structured stops list from clean facilities if available
        const stopsList = [];
        if (cleanFacilities.length >= 2) {
          cleanFacilities.forEach((fac, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === cleanFacilities.length - 1;
            const stopCity = isFirst ? originCity : isLast ? destCity : fac;
            const stopState = isFirst ? originState : isLast ? destState : "US";
            stopsList.push({
              sequenceNumber: idx + 1,
              type: isFirst ? "pickup" : isLast ? "delivery" : "intermediate",
              activity: isFirst ? "pickup" : isLast ? "delivery" : "drop_hook",
              facilityCode: fac,
              city: stopCity,
              state: stopState,
              appointmentTime: isFirst ? pickupTime : isLast ? deliveryTime : new Date(new Date(pickupTime).getTime() + idx * 3 * 3600000).toISOString(),
              status: isFirst && status === "in_transit" ? "completed" : status === "delivered" ? "completed" : "pending",
            });
          });
        }

        seenIds.add(tripId);
        const tourObj = {
          vrid: tripId,
          source: "amazon_relay",
          equipment,
          rateUSD,
          weightLbs,
          originCity,
          originState,
          originFacilityCode: originFacility,
          pickupTime,
          destCity,
          destState,
          destFacilityCode: destFacility,
          deliveryTime,
          stops: stopsList.length > 0 ? stopsList : undefined,
          totalStopsCount: stopsList.length > 0 ? stopsList.length : 2,
          status,
          driverName: "Assigned Driver",
          driverPhone: "+1 (555) 000-0000",
          tractorNumber: "UD-AMZ",
          trailerNumber: "TR-5300",
          carrierName: "Unique Dispatch Fleet",
          carrierMcDot: "MC-ACTIVE",
          notes: `Extracted from Amazon Relay on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        };

        foundTours.push(tourObj);
        capturedToursMap.set(tripId, tourObj);
      } catch (err) {}
    }

    return foundTours;
  }

  // 6. Floating UI Status & Inspector Pill
  function injectFloatingPill() {
    if (document.getElementById("ud-relay-sync-pill")) return;

    const pill = document.createElement("div");
    pill.id = "ud-relay-sync-pill";
    pill.innerHTML = `
      <div id="ud-pill-card" style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999999;
        display: flex;
        flex-direction: column;
        background: #0a1128;
        color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.6), 0 0 0 1px rgba(234,88,12,0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        max-width: 340px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding: 10px 14px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="ud-pill-dot" style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
            <span style="font-weight:900; color:#fb923c; letter-spacing:0.5px;">UNIQUE DISPATCH</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span id="ud-pill-count" style="background:#1e293b; color:#94a3b8; padding:2px 7px; border-radius:9999px; font-weight:800; font-size:10px;">0 Tours</span>
            <button id="ud-pill-sync-btn" style="
              background: #ea580c;
              border: none;
              color: #ffffff;
              padding: 5px 10px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(234,88,12,0.4);
            ">⚡ SYNC NOW</button>
          </div>
        </div>

        <div id="ud-pill-drawer" style="display:none; border-top: 1px solid #1e293b; padding: 10px 14px; max-height: 240px; overflow-y: auto;">
          <div style="font-weight:800; color:#cbd5e1; margin-bottom:6px; display:flex; justify-content:space-between;">
            <span>Detected Screen Tours:</span>
            <span id="ud-pill-drawer-status" style="color:#10b981;">Live Capture</span>
          </div>
          <div id="ud-pill-drawer-list" style="display:flex; flex-direction:column; gap:6px;">
            <div style="color:#64748b; font-size:10px;">No tours captured yet. Browse tours or click Sync Now.</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(pill);

    const pillCard = document.getElementById("ud-pill-card");
    const drawer = document.getElementById("ud-pill-drawer");
    const syncBtn = document.getElementById("ud-pill-sync-btn");

    pillCard.addEventListener("click", (e) => {
      if (e.target === syncBtn || syncBtn.contains(e.target)) return;
      if (drawer.style.display === "none") {
        drawer.style.display = "block";
        updateDrawerList();
      } else {
        drawer.style.display = "none";
      }
    });

    syncBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      extractAndSyncAll(true);
    });
  }

  function updateFloatingPillUI() {
    const countEl = document.getElementById("ud-pill-count");
    const dotEl = document.getElementById("ud-pill-dot");
    const count = capturedToursMap.size;

    if (countEl) {
      countEl.innerText = `${count} ${count === 1 ? "Tour" : "Tours"}`;
      countEl.style.color = count > 0 ? "#38bdf8" : "#94a3b8";
      countEl.style.background = count > 0 ? "rgba(56, 189, 248, 0.15)" : "#1e293b";
    }

    if (dotEl) {
      dotEl.style.background = count > 0 ? "#10b981" : "#f59e0b";
      dotEl.style.boxShadow = count > 0 ? "0 0 8px #10b981" : "0 0 8px #f59e0b";
    }

    updateDrawerList();
  }

  function updateDrawerList() {
    const listEl = document.getElementById("ud-pill-drawer-list");
    if (!listEl) return;

    const tours = Array.from(capturedToursMap.values());
    if (tours.length === 0) {
      listEl.innerHTML = `<div style="color:#64748b; font-size:10px;">No active tours on this screen. Open Amazon Relay Tours/Trips.</div>`;
      return;
    }

    listEl.innerHTML = tours
      .map((t) => {
        const pDate = new Date(t.pickupTime);
        const isTomorrow = pDate.getDate() === new Date(Date.now() + 24 * 3600 * 1000).getDate();
        const dateTag = isTomorrow ? "Tomorrow" : `${pDate.getMonth() + 1}/${pDate.getDate()}`;

        return `
        <div style="background:#0f172a; padding:6px 10px; border-radius:8px; border:1px solid #1e293b; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:monospace; font-weight:900; color:#fb923c;">${t.vrid}</span>
            <span style="color:#34d399; font-weight:800;">${t.rateUSD > 0 ? `$${t.rateUSD.toLocaleString()}` : "Rate TBD"}</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:9px;">
            <span>${t.originFacilityCode || t.originCity} ➔ ${t.destFacilityCode || t.destCity}</span>
            <span style="color:#38bdf8; font-weight:700;">📅 ${dateTag}</span>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 7. Extraction & Dispatch
  function extractAndSyncAll(isManual = false) {
    if (isSyncing) return;
    isSyncing = true;

    // Fast non-blocking DOM scan
    scanDomForTours();
    updateFloatingPillUI();

    const allTours = Array.from(capturedToursMap.values());

    if (allTours.length === 0) {
      isSyncing = false;
      if (isManual) {
        showToast("ℹ️ No active Relay tours found on screen. Open https://relay.amazon.com/tours");
      }
      return;
    }

    dispatchToursToBackground(allTours, isManual);
  }

  function dispatchToursToBackground(tours, isManual) {
    try {
      chrome.runtime.sendMessage(
        {
          type: "RELAY_TOURS_DETECTED",
          payload: tours,
        },
        (response) => {
          const err = chrome.runtime.lastError;
          isSyncing = false;
          if (!err && response && response.success) {
            if (isManual) {
              showToast(`✓ Synced ${tours.length} exact Relay tours to Unique Dispatch!`);
            }
          } else if (isManual) {
            showToast(`⚠️ Sync notice: ${response?.error || "Check portal connection."}`);
          }
        }
      );
    } catch (e) {
      isSyncing = false;
    }
  }

  // Toast
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.innerText = msg;
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000000;
      background: #0a1128;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border: 1px solid #ea580c;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease";
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  // 8. Message Listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_NOW") {
      extractAndSyncAll(true);
      sendResponse({ status: "done", count: capturedToursMap.size, tours: Array.from(capturedToursMap.values()) });
      return false;
    } else if (request.type === "GET_DETECTED_TOURS") {
      scanDomForTours();
      sendResponse({ count: capturedToursMap.size, tours: Array.from(capturedToursMap.values()) });
      return false;
    }
  });

  // 9. Startup & Debounced Observers
  setTimeout(() => {
    injectFloatingPill();
    extractAndSyncAll(false);
  }, 1000);

  // Debounced MutationObserver (ignores floating pill and prevents thread locks)
  const observer = new MutationObserver((mutations) => {
    const isOurPill = mutations.every(
      (m) => m.target && (m.target.id?.includes?.("ud-") || m.target.closest?.("#ud-relay-sync-pill"))
    );
    if (isOurPill) return;

    if (debounceScanTimer) clearTimeout(debounceScanTimer);
    debounceScanTimer = setTimeout(() => {
      scanDomForTours();
      updateFloatingPillUI();
    }, 1500);
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Periodic check every 30 seconds
  setInterval(() => {
    extractAndSyncAll(false);
  }, 30000);
})();
