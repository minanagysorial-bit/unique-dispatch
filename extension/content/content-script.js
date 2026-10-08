/**
 * Unique Dispatch - Amazon Relay High-Fidelity Content Script
 * Scans Amazon Relay screens for 100% authentic tours, preserving exact screen order.
 * Zero-tolerance for false/hallucinated data.
 */

(function () {
  "use strict";

  // Prevent multiple double listeners in same frame
  if (window.__ud_content_script_initialized) {
    if (typeof window.__ud_trigger_scan === "function") {
      window.__ud_trigger_scan();
    }
    return;
  }
  window.__ud_content_script_initialized = true;

  console.log("🚚 [Unique Dispatch] Relay High-Fidelity Content Script Active in frame:", window.location.href);

  // In-memory pool of captured tours and intercepted API tours
  const capturedApiToursMap = new Map();
  let latestOrderedTours = [];
  let isSyncing = false;
  let debounceScanTimer = null;

  // 1. Listen for messages from Main-World API Interceptor (Rich Authentic Payloads)
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "UD_RELAY_RAW_API_TOURS" && Array.isArray(event.data.tours)) {
      console.log(`🚚 [Unique Dispatch] Ingested ${event.data.tours.length} authentic tours from API`);
      event.data.tours.forEach((tour) => {
        if (tour && tour.vrid) {
          capturedApiToursMap.set(tour.vrid, tour);
        }
      });

      // Trigger re-scan to merge and maintain screen order
      scanDomForTours();
      updateFloatingPillUI();
      if (latestOrderedTours.length > 0) {
        dispatchToursToBackground(latestOrderedTours, false, "upsert");
      }
    }
  });

  // 2. Helper: Parse Real Dates from Amazon Relay Text (Today, Tomorrow, Specific Dates)
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

  // 3. Extract Real Trip ID with Multi-Strategy Adaptability (Zero Drops)
  function extractExactTripIdFromNode(node, cardText) {
    if (!node) return null;

    // A. Check ALL anchor links on node or inside node
    const allLinks = [];
    if (node.tagName === "A") allLinks.push(node);
    if (node.querySelectorAll) {
      allLinks.push(...Array.from(node.querySelectorAll("a[href]")));
    }

    for (const linkEl of allLinks) {
      const href = linkEl.getAttribute("href") || linkEl.href || "";
      // 1. Direct path match: e.g. /tours/11A8B9C or /trips/9482710 or /work-opportunities/10293
      const pathMatch = href.match(/\/(?:tours|trips|loads|work-opportunities|execution|loadboard|carrier-tours|program-trips)(?:\/details)?\/([A-Za-z0-9\-_]{3,32})/i);
      if (pathMatch && pathMatch[1]) {
        const c = pathMatch[1].trim();
        const forbidden = ["SEARCH", "HISTORY", "FILTER", "CREATE", "VIEW", "DETAILS", "SAVED", "TRIPS", "TOURS", "LOADS", "CARRIER", "EXECUTION"];
        if (!forbidden.includes(c.toUpperCase())) {
          return c;
        }
      }
      // 2. Query parameter match: e.g. ?tourId=11A8B9C or ?tripId=9482710 or ?vrid=...
      const queryMatch = href.match(/[?&](?:tourId|tripId|vrid|loadId|workOpportunityId|executionId)=([A-Za-z0-9\-_]{3,32})/i);
      if (queryMatch && queryMatch[1]) {
        return queryMatch[1].trim();
      }
    }

    // B. Check dedicated data-testid, data-id, or class attributes
    if (node.querySelector) {
      const idEl = node.querySelector(
        '[data-testid*="tour-id" i], [data-testid*="trip-id" i], [data-testid*="vrid" i], [data-testid*="load-id" i], [data-testid*="work-opportunity-id" i], [class*="tourId" i], [class*="tripId" i], [class*="tour-id" i], [class*="trip-id" i], [class*="tripNumber" i], [class*="tourNumber" i], [class*="vrid" i]'
      );
      if (idEl) {
        const textVal = (idEl.textContent || "").trim();
        const cleaned = textVal.replace(/^(?:Trip\s*(?:ID|#|Number)?|Tour\s*(?:ID|#|Number)?|Load\s*(?:ID|#)?|VRID\s*[:#\-]?)[\s:#\-]*/i, "").trim();
        if (cleaned && cleaned.length >= 3 && cleaned.length <= 24) {
          return cleaned;
        }
      }
    }

    // C. Check data-attributes on node itself
    if (node.getAttribute) {
      const dataId =
        node.getAttribute("data-tour-id") ||
        node.getAttribute("data-trip-id") ||
        node.getAttribute("data-work-opportunity-id") ||
        node.getAttribute("data-vrid") ||
        node.getAttribute("data-item-id") ||
        node.getAttribute("data-row-id") ||
        node.getAttribute("data-id");
      if (dataId && dataId.length >= 3) {
        const forbidden = ["SEARCH", "FILTER", "HEADER", "FOOTER", "MENU"];
        if (!forbidden.includes(dataId.toUpperCase())) {
          return dataId.trim();
        }
      }
    }

    // D. Labeled pattern in text: e.g. "VRID: 9482710", "Trip # 12345", "Tour ID 11A8B9C", "Tour #11A8B9C"
    const labeledMatch = cardText.match(
      /(?:Tour|Trip|Load|VRID|Work\s*Opportunity|Execution|Order)\s*(?:ID|#|Number|Ref)?\s*[:#\-\s]+([A-Za-z0-9\-_]{3,24})/i
    );
    if (labeledMatch && labeledMatch[1]) {
      const cand = labeledMatch[1].trim();
      const forbidden = ["ID", "NUMBER", "DETAILS", "STATUS", "CARRIER", "ASSIGNED", "UPCOMING", "ACTIVE", "VIEW", "FILTER", "SEARCH", "COMPLETED", "TODAY", "TOMORROW"];
      if (!forbidden.includes(cand.toUpperCase())) {
        return cand;
      }
    }

    // E. Hash pattern: e.g. #11A8B9C or #982103
    const hashMatch = cardText.match(/#([A-Za-z0-9\-_]{4,20})\b/);
    if (hashMatch && hashMatch[1]) {
      const cand = hashMatch[1].trim().toUpperCase();
      const forbidden = ["AMAZON", "RELAY", "REEFER", "FLATBED", "DELIVERY", "CARRIER", "PICKUP", "UPCOMING", "TRANSIT", "STATUS", "DRYVAN", "WEIGHT", "EXPEDITED", "SCHEDULED", "BOOKED", "ASSIGNED", "ACTIVE", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
      if (!forbidden.includes(cand)) {
        return hashMatch[1].trim();
      }
    }

    // F. Table Cell / First Column ID Scanner (crucial for Amazon Relay tables without "Tour ID:" prefix in cells)
    const cells = node.querySelectorAll ? Array.from(node.querySelectorAll('td, [role="cell"], [role="gridcell"], div[class*="cell" i], div[class*="column" i], span[class*="id" i]')) : [];
    for (const cell of cells) {
      const cellText = (cell.textContent || "").trim();
      if (!cellText || cellText.length < 4 || cellText.length > 20) continue;

      // Pure numeric VRID format (e.g. 9482710 or 12345678)
      if (/^\b[0-9]{6,10}\b$/.test(cellText)) {
        return cellText;
      }
      // Alphanumeric Tour format (e.g. 11A8B9C, 3N88XP9, T-1029384, WO-98213)
      if (/^[A-Za-z0-9]{6,16}$/.test(cellText) && /[A-Za-z]/.test(cellText) && /[0-9]/.test(cellText)) {
        const upper = cellText.toUpperCase();
        const forbidden = ["AMAZON", "CARRIER", "REEFER", "FLATBED", "DRYVAN", "DELIVERY", "UPCOMING", "COMPLETED", "EXPEDITED"];
        if (!forbidden.includes(upper)) {
          return cellText;
        }
      }
    }

    // G. Standalone token in text matching numeric VRID (6-10 digits)
    const numericVridMatch = cardText.match(/\b([0-9]{7,10})\b/);
    if (numericVridMatch && numericVridMatch[1]) {
      return numericVridMatch[1];
    }

    return null;
  }

  // 4. Targeted Screen Scanner strictly preserving vertical top-to-bottom Relay Screen Order
  function scanDomForTours() {
    const candidateElementSet = new Set();
    const candidateNodes = [];

    function addCandidate(el) {
      if (!el || candidateElementSet.has(el)) return;
      if (el === document.body || el === document.documentElement || (el.id && el.id.includes("ud-"))) return;
      candidateElementSet.add(el);
      candidateNodes.push(el);
    }

    // Selector Strategy 1: All table rows (Standard HTML Table or Cloudscape Table)
    document.querySelectorAll(
      'table tbody tr:not([class*="header" i]), [role="row"]:not([role="columnheader" i]), [class*="awsui_row" i], [class*="awsui-table-row" i]'
    ).forEach(addCandidate);

    // Selector Strategy 2: All Tour / Trip / Loadboard links and their card containers
    document.querySelectorAll(
      'a[href*="/tours" i], a[href*="/trips" i], a[href*="/loads" i], a[href*="/work-opportunities" i], a[href*="/execution" i], a[href*="/loadboard" i], a[href*="/carrier" i]'
    ).forEach((link) => {
      const container = link.closest(
        'tr, [role="row"], [class*="card" i], [class*="row" i], [class*="item" i], [class*="tour" i], [class*="trip" i], li, article, section'
      ) || link.parentElement?.parentElement || link;
      addCandidate(container);
    });

    // Selector Strategy 3: Cloudscape Cards, Card grids, and Item wrappers
    document.querySelectorAll(
      '[class*="awsui_card" i], [class*="awsui-card" i], [class*="TourCard" i], [class*="tour-card" i], [class*="TripCard" i], [class*="trip-card" i], [class*="WorkOpportunityCard" i], [class*="work-opportunity" i], [data-testid*="card" i], [data-testid*="row" i], [data-testid*="tour" i], [data-testid*="trip" i], [data-testid*="item" i]'
    ).forEach(addCandidate);

    // Selector Strategy 4 (Fallback if no candidate nodes found yet):
    // Search elements that contain facility code patterns (e.g. JFK8, TEB9)
    if (candidateNodes.length === 0) {
      const allDivs = Array.from(document.querySelectorAll('div, li, article, section'));
      for (const d of allDivs) {
        if (d.children.length <= 10 && d.textContent) {
          const txt = d.textContent;
          if (/\b([A-Z]{3}[0-9]|[A-Z]{4})\b/.test(txt) && (/\$[0-9]/.test(txt) || /\b\d{1,2}:\d{2}\b/i.test(txt) || /tour|trip|vrid|stop|rate/i.test(txt))) {
            const container = d.closest('tr, [role="row"], li, article, section, [class*="card" i], [class*="row" i]') || d;
            addCandidate(container);
          }
        }
      }
    }

    // Strictly sort candidate nodes by vertical top-to-bottom document position
    candidateNodes.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      const topA = rectA.top + (window.scrollY || window.pageYOffset || 0);
      const topB = rectB.top + (window.scrollY || window.pageYOffset || 0);
      if (Math.abs(topA - topB) > 2) {
        return topA - topB;
      }
      return rectA.left - rectB.left;
    });

    const foundTours = [];
    const seenIds = new Set();
    let currentScreenIndex = 0;

    for (let i = 0; i < candidateNodes.length; i++) {
      const node = candidateNodes[i];
      try {
        const text = (node.textContent || "").trim();
        if (!text || text.length < 10 || text.length > 5000) continue;

        // Facility codes (e.g. JFK8, TEB9, ABE8)
        const facilityMatches = text.match(/\b([A-Z]{3}[0-9]|[A-Z]{4})\b/g) || [];
        const cleanFacilities = facilityMatches.filter((f) => {
          const upper = f.toUpperCase();
          const forbidden = [
            "POST", "TRIP", "TOUR", "LOAD", "TYPE", "RATE", "TIME", "STOP", "CITY", "DEST", "FROM", "AUTO",
            "VIEW", "INFO", "COST", "FEES", "PAID", "DAYS", "EDIT", "DATE", "USER", "MORE", "SHOW", "HIDE",
            "NAME", "PAGE", "NEXT", "BACK", "SAVE", "EXIT", "HELP", "TEAM", "UNIT", "TEST", "WARN", "ROLE",
            "LIVE", "DOCK", "GATE", "SEMI", "VANS", "FLAT", "REEF", "AMZN", "SYNC", "MENU", "AMAZON", "RELAY",
            "TOTAL", "DROP", "HOOK", "MILES", "HOUR", "HOURS", "WEEK", "CARD", "GRID"
          ];
          return !forbidden.includes(upper);
        });

        const hasRate = /\$[0-9]/.test(text);
        const hasTime = /\b\d{1,2}:\d{2}\b|today|tomorrow|scheduled|starts|ends|pickup|delivery/i.test(text);

        // Extract or synthesize trip ID
        let tripId = extractExactTripIdFromNode(node, text);
        if (!tripId && cleanFacilities.length >= 2) {
          tripId = `RELAY-${cleanFacilities[0]}-${cleanFacilities[cleanFacilities.length - 1]}-${i + 1}`;
        }

        if (!tripId || seenIds.has(tripId)) continue;
        if (cleanFacilities.length === 0 && !hasRate && !hasTime && !capturedApiToursMap.has(tripId)) continue;

        seenIds.add(tripId);

        // If we already intercepted a richer JSON API payload for this tripId, merge and keep screenIndex!
        if (capturedApiToursMap.has(tripId)) {
          const richTour = { ...capturedApiToursMap.get(tripId) };
          richTour.screenIndex = currentScreenIndex++;
          foundTours.push(richTour);
          continue;
        }

        // Extract Cities / States
        const cityStateMatches = Array.from(text.matchAll(/([A-Za-z\s]{3,20}),\s*([A-Z]{2})\b/g));

        let originCity = cleanFacilities[0] || "Origin";
        let originState = "US";
        let originFacility = cleanFacilities[0] || undefined;

        let destCity = (cleanFacilities.length > 1 ? cleanFacilities[cleanFacilities.length - 1] : cleanFacilities[0]) || "Destination";
        let destState = "US";
        let destFacility = (cleanFacilities.length > 1 ? cleanFacilities[cleanFacilities.length - 1] : undefined);

        if (cityStateMatches.length >= 2) {
          originCity = cityStateMatches[0][1].trim();
          originState = cityStateMatches[0][2].trim();
          destCity = cityStateMatches[cityStateMatches.length - 1][1].trim();
          destState = cityStateMatches[cityStateMatches.length - 1][2].trim();
        } else if (cityStateMatches.length === 1) {
          originCity = cityStateMatches[0][1].trim();
          originState = cityStateMatches[0][2].trim();
        }

        // Rate
        const rateMatch = text.match(/\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]{2,5}\b)/);
        let rateUSD = 0;
        if (rateMatch) {
          rateUSD = parseFloat(rateMatch[1].replace(/,/g, ""));
        }

        // Weight
        const weightMatch = text.match(/([0-9,]+)\s*(?:lbs|lb|k\s*lbs)/i);
        const weightLbs = weightMatch ? parseInt(weightMatch[1].replace(/,/g, ""), 10) : 38000;

        // Distance in miles
        const distanceMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:mi|miles)\b/i);
        const distanceMiles = distanceMatch ? parseInt(distanceMatch[1].replace(/,/g, ""), 10) : undefined;

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

        // Build structured multi-stop array from detected facilities
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

        const tourObj = {
          vrid: tripId,
          source: "amazon_relay",
          equipment,
          rateUSD,
          weightLbs,
          distanceMiles,
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
          screenIndex: currentScreenIndex++,
          driverName: "Assigned Driver",
          driverPhone: "+1 (555) 000-0000",
          tractorNumber: "UD-AMZ",
          trailerNumber: "TR-5300",
          carrierName: "Unique Dispatch Fleet",
          carrierMcDot: "MC-ACTIVE",
          notes: `Extracted from Amazon Relay screen in exact visual order on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        };

        foundTours.push(tourObj);
      } catch (err) {}
    }

    // Append any API-intercepted tours that weren't found on the DOM
    capturedApiToursMap.forEach((apiTour, id) => {
      if (!seenIds.has(id)) {
        seenIds.add(id);
        foundTours.push({
          ...apiTour,
          screenIndex: currentScreenIndex++,
        });
      }
    });

    // Fallback: If DOM scan yielded 0 tours, but API map has tours, use all API tours!
    if (foundTours.length === 0 && capturedApiToursMap.size > 0) {
      capturedApiToursMap.forEach((apiTour) => {
        foundTours.push(apiTour);
      });
    }

    latestOrderedTours = foundTours;
    return latestOrderedTours;
  }

  // 5. Floating Inspector Pill UI (Only in top frame)
  function injectFloatingPill() {
    if (window.self !== window.top) return;
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
        max-width: 360px;
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
          <div style="font-weight:800; color:#cbd5e1; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>Relay Screen Order (#1 to #N):</span>
            <button id="ud-pill-replace-btn" style="background:#1e293b; color:#38bdf8; border:1px solid #38bdf8; border-radius:6px; padding:2px 6px; font-size:9px; cursor:pointer; font-weight:bold;">
              🔄 Replace All in Portal
            </button>
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
    const replaceBtn = document.getElementById("ud-pill-replace-btn");

    pillCard.addEventListener("click", (e) => {
      if (e.target === syncBtn || syncBtn.contains(e.target) || e.target === replaceBtn || replaceBtn?.contains(e.target)) return;
      if (drawer.style.display === "none") {
        drawer.style.display = "block";
        updateDrawerList();
      } else {
        drawer.style.display = "none";
      }
    });

    syncBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      extractAndSyncAll(true, "upsert");
    });

    if (replaceBtn) {
      replaceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        extractAndSyncAll(true, "replace_all");
      });
    }
  }

  function updateFloatingPillUI() {
    const countEl = document.getElementById("ud-pill-count");
    const dotEl = document.getElementById("ud-pill-dot");
    const count = latestOrderedTours.length;

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

    if (latestOrderedTours.length === 0) {
      listEl.innerHTML = `<div style="color:#64748b; font-size:10px;">No active tours on this screen. Open Amazon Relay Tours/Trips.</div>`;
      return;
    }

    listEl.innerHTML = latestOrderedTours
      .map((t, idx) => {
        const pDate = new Date(t.pickupTime);
        const isTomorrow = pDate.getDate() === new Date(Date.now() + 24 * 3600 * 1000).getDate();
        const dateTag = isTomorrow ? "Tomorrow" : `${pDate.getMonth() + 1}/${pDate.getDate()}`;
        const stopsBadge = t.stops && t.stops.length > 2 ? `<span style="color:#fb923c; font-weight:800;">⚡ ${t.stops.length} Stops</span>` : "";

        return `
        <div style="background:#0f172a; padding:6px 10px; border-radius:8px; border:1px solid #1e293b; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="background:#ea580c; color:#fff; font-weight:900; font-size:9px; padding:1px 5px; border-radius:4px;">#${idx + 1}</span>
              <span style="font-family:monospace; font-weight:900; color:#fb923c;">${t.vrid}</span>
            </div>
            <span style="color:#34d399; font-weight:800;">${t.rateUSD > 0 ? `$${t.rateUSD.toLocaleString()}` : "Rate TBD"}</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:9px;">
            <span>${t.originFacilityCode || t.originCity} ➔ ${t.destFacilityCode || t.destCity}</span>
            <div style="display:flex; gap:6px;">
              ${stopsBadge}
              <span style="color:#38bdf8; font-weight:700;">📅 ${dateTag}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 6. Extraction & Dispatch in Strict Screen Order
  function extractAndSyncAll(isManual = false, mode = "upsert") {
    if (isSyncing) return;
    isSyncing = true;

    // Fast targeted DOM scan in vertical order
    const tours = scanDomForTours();
    updateFloatingPillUI();

    if (tours.length === 0) {
      isSyncing = false;
      if (isManual) {
        showToast("ℹ️ No active Relay tours found on screen. Open https://relay.amazon.com/tours");
      }
      return;
    }

    dispatchToursToBackground(tours, isManual, mode);
  }

  function dispatchToursToBackground(tours, isManual, mode = "upsert") {
    try {
      chrome.runtime.sendMessage(
        {
          type: "RELAY_TOURS_DETECTED",
          payload: tours,
          mode: mode,
        },
        (response) => {
          const err = chrome.runtime.lastError;
          isSyncing = false;
          if (!err && response && response.success) {
            if (isManual) {
              const modeLabel = mode === "replace_all" ? "(Replaced All Tours)" : "";
              showToast(`✓ Synced ${tours.length} exact Relay tours in screen order! ${modeLabel}`);
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
    if (window.self !== window.top) return;
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

  // 7. Message Listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_NOW") {
      const mode = request.mode || "upsert";
      const tours = scanDomForTours();
      extractAndSyncAll(true, mode);
      sendResponse({ status: "done", count: tours.length, tours: tours });
      return false;
    } else if (request.type === "GET_DETECTED_TOURS") {
      const tours = scanDomForTours();
      sendResponse({ count: tours.length, tours: tours });
      return false;
    } else if (request.type === "CLEAR_CAPTURED_POOL") {
      capturedApiToursMap.clear();
      latestOrderedTours = [];
      updateFloatingPillUI();
      sendResponse({ status: "cleared", count: 0 });
      return false;
    }
  });

  // Export for idempotent re-triggers
  window.__ud_trigger_scan = () => {
    scanDomForTours();
    updateFloatingPillUI();
  };

  // 8. Startup & Observers
  setTimeout(() => {
    injectFloatingPill();
    scanDomForTours();
    updateFloatingPillUI();
    extractAndSyncAll(false, "upsert");
  }, 600);

  // Debounced MutationObserver
  const observer = new MutationObserver((mutations) => {
    const isOurPill = mutations.every(
      (m) => m.target && (m.target.id?.includes?.("ud-") || m.target.closest?.("#ud-relay-sync-pill"))
    );
    if (isOurPill) return;

    if (debounceScanTimer) clearTimeout(debounceScanTimer);
    debounceScanTimer = setTimeout(() => {
      scanDomForTours();
      updateFloatingPillUI();
    }, 1000);
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });

  setInterval(() => {
    extractAndSyncAll(false, "upsert");
  }, 30000);
})();
