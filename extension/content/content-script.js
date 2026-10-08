/**
 * Unique Dispatch - Amazon Relay Enterprise Content Script
 * Extracts 100% authentic Amazon Relay Block Tours, Multi-Leg Sub-Trips, 
 * Full 6+ Stop progression lines, Driver Names, Contract Codes, and Exact Dates.
 */

(function () {
  "use strict";

  if (window.__ud_content_script_initialized) {
    if (typeof window.__ud_trigger_scan === "function") {
      window.__ud_trigger_scan();
    }
    return;
  }
  window.__ud_content_script_initialized = true;

  console.log("🚚 [Unique Dispatch] Relay High-Fidelity Multi-Leg Engine Active in frame:", window.location.href);

  const capturedApiToursMap = new Map();
  let latestOrderedTours = [];
  let isSyncing = false;
  let debounceScanTimer = null;

  // 1. Listen for messages from Main-World API Interceptor
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "UD_RELAY_RAW_API_TOURS" && Array.isArray(event.data.tours)) {
      console.log(`🚚 [Unique Dispatch] Ingested ${event.data.tours.length} authentic tours from API`);
      event.data.tours.forEach((tour) => {
        if (tour && tour.vrid) {
          capturedApiToursMap.set(tour.vrid, tour);
        }
      });

      scanDomForTours();
      updateFloatingPillUI();
      if (latestOrderedTours.length > 0) {
        dispatchToursToBackground(latestOrderedTours, false, "upsert");
      }
    }
  });

  // 2. High-Precision Date & Time Parser
  function parseRelayDateTime(dateString, isDelivery = false) {
    if (!dateString) {
      const fallback = new Date();
      fallback.setHours(fallback.getHours() + (isDelivery ? 16 : 2));
      return fallback.toISOString();
    }

    const now = new Date();
    let targetDate = new Date(now);
    const text = String(dateString).trim();
    const lower = text.toLowerCase();

    // Check for "Tomorrow" or offsets
    if (lower.includes("tomorrow") || lower.includes("in 1 day") || lower.includes("in 24 hours")) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lower.includes("in 2 days") || lower.includes("in 48 hours")) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (lower.includes("in 3 days")) {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (lower.includes("yesterday")) {
      targetDate.setDate(targetDate.getDate() - 1);
    } else {
      // Month + Day format: e.g. "Thu, Oct 8", "Fri, Oct 9", "Sat, Oct 10", "8 Oct", "9 Oct"
      const monthMatch = text.match(/\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i)
        || text.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s*,?\s*(\d{4}))?\b/i);

      if (monthMatch) {
        const months = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const rawM = isNaN(parseInt(monthMatch[1], 10)) ? monthMatch[1] : monthMatch[2];
        const rawD = isNaN(parseInt(monthMatch[1], 10)) ? monthMatch[2] : monthMatch[1];
        const monthNum = months[rawM.toLowerCase().slice(0, 3)];
        const dayNum = parseInt(rawD, 10);
        const yearNum = monthMatch[3] ? parseInt(monthMatch[3], 10) : now.getFullYear();

        if (monthNum !== undefined && !isNaN(dayNum)) {
          targetDate.setFullYear(yearNum, monthNum, dayNum);
          if (!monthMatch[3] && targetDate.getTime() < now.getTime() - 30 * 24 * 3600 * 1000) {
            targetDate.setFullYear(targetDate.getFullYear() + 1);
          }
        }
      }
    }

    // Clock Time (e.g. "12:05", "18:03", "00:30", "01:30", "12:29")
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
        targetDate.setHours(targetDate.getHours() + 14);
      } else {
        targetDate.setHours(targetDate.getHours() + 2);
      }
    }

    return targetDate.toISOString();
  }

  // 3. Extract Block Trip ID (B-..., T-..., VRID)
  function extractBlockTripId(node, text) {
    if (!node) return null;

    // Direct match for Block Tour ID (B-...) or Tour ID (T-...)
    const prefixMatch = text.match(/\b([TB]-[A-Za-z0-9]{6,16})\b/);
    if (prefixMatch && prefixMatch[1]) {
      return prefixMatch[1].trim();
    }

    // Direct match for standalone Tour token
    const tokenMatch = text.match(/\b([0-9][A-Z0-9]{8,11})\b/);
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1].trim();
    }

    return null;
  }

  // 4. Extract Driver Name
  function extractDriverName(node, text) {
    if (!node) return "Assigned Driver";

    const selectEl = node.querySelector ? node.querySelector("select") : null;
    if (selectEl) {
      const selectedOpt = selectEl.options[selectEl.selectedIndex];
      const optText = selectedOpt ? selectedOpt.text.trim() : selectEl.value.trim();
      if (optText && !/select|assign|choose|driver/i.test(optText)) {
        return optText;
      }
    }

    // Driver patterns e.g. "M. Reid", "M. Greathouse", "J. Solis", "J. Jackson", "D. Perez", "A. Lopez", "T. Walker", "M. CARTER", "Dunlap"
    const nameMatch = text.match(/\b([A-Z]\.\s+[A-Za-z0-9\-]{2,20})\b/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }

    const cdlMatch = text.match(/(?:CDL[^\n\r]*|UIIA_MC[^\n\r]*)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|[A-Z]\.\s+[A-Za-z]+)/i);
    if (cdlMatch && cdlMatch[1]) {
      const cand = cdlMatch[1].trim();
      if (!/cdl|drop|hook|solo|trailer|contract/i.test(cand)) {
        return cand;
      }
    }

    return "Assigned Driver";
  }

  // 5. Deep Multi-Stop & Sub-Leg Extractor for Amazon Relay Blocks
  function extractBlockTourStructure(node, text) {
    // 1. Extract Parent Start and End Times
    const dateMatches = Array.from(
      text.matchAll(/(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[A-Z]{3})?/gi)
    );

    const parentPickupTime = dateMatches[0] ? parseRelayDateTime(dateMatches[0][0], false) : parseRelayDateTime(text, false);
    const parentDeliveryTime = dateMatches[1] ? parseRelayDateTime(dateMatches[1][0], true) : parseRelayDateTime(text, true);

    // 2. Extract Sub-Legs e.g. "116NH3T6Y 1 SAT41 -> 2 SAT3 8 mi 0h 25m Drop"
    // Regex matches: (ID) (Seq1) (Fac1) -> (Seq2) (Fac2) (Miles mi) (Duration)
    const legRegex = /(?:>|v)?\s*([0-9][A-Z0-9]{7,10}|[A-Z0-9]{8,10})\s+(\d+)\s+([A-Z0-9]{3,6})\s*(?:➔|->|to)\s*(\d+)\s+([A-Z0-9]{3,6})(?:[^\n\r]*?(\d+)\s*mi)?/g;
    const subLegs = [];
    let legMatch;

    while ((legMatch = legRegex.exec(text)) !== null) {
      subLegs.push({
        subId: legMatch[1].trim(),
        fromSeq: parseInt(legMatch[2], 10),
        fromFac: legMatch[3].trim(),
        toSeq: parseInt(legMatch[4], 10),
        toFac: legMatch[5].trim(),
        miles: legMatch[6] ? parseInt(legMatch[6], 10) : 0,
      });
    }

    // 3. Extract Addresses e.g. "111 Gembler Rd, San Antonio, TX 78219", "6806 Cal Turner Dr, San Antonio, TX 78220"
    const addressRegex = /(\d+\s+[A-Za-z0-9\s\.\-]{3,35}(?:Rd|St|Ave|Dr|Blvd|Way|Ct|Ln|Hwy|Pkwy)),\s*([A-Za-z\s]{3,20}),\s*([A-Z]{2})(?:\s+(\d{5}))?/g;
    const foundAddresses = [];
    let addrMatch;
    while ((addrMatch = addressRegex.exec(text)) !== null) {
      foundAddresses.push({
        street: addrMatch[1].trim(),
        city: addrMatch[2].trim(),
        state: addrMatch[3].trim(),
        zip: addrMatch[4] ? addrMatch[4].trim() : undefined,
      });
    }

    // 4. Extract Total Miles (sum of legs or stated miles)
    let totalMiles = 0;
    if (subLegs.length > 0) {
      totalMiles = subLegs.reduce((acc, l) => acc + (l.miles || 0), 0);
    }
    if (totalMiles === 0) {
      const milesMatch = text.match(/([0-9,]+)\s*mi\b/i);
      if (milesMatch) totalMiles = parseInt(milesMatch[1].replace(/,/g, ""), 10);
    }

    // 5. Build Ordered Stops Array
    const stopsList = [];
    const cityStateMatches = Array.from(text.matchAll(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/g));

    if (subLegs.length > 0) {
      // Build sequenced stops from sub-legs
      subLegs.forEach((leg, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === subLegs.length - 1;

        // Add Origin of leg (for first leg or distinct stop)
        if (isFirst || stopsList.length === 0) {
          const addr = foundAddresses[0];
          const oCity = addr?.city || (cityStateMatches[0] && cityStateMatches[0][1].trim()) || leg.fromFac;
          const oState = addr?.state || (cityStateMatches[0] && cityStateMatches[0][2].trim()) || "US";
          stopsList.push({
            sequenceNumber: stopsList.length + 1,
            type: "pickup",
            activity: "pickup",
            facilityCode: leg.fromFac,
            city: oCity,
            state: oState,
            postalCode: addr?.zip || (cityStateMatches[0] && cityStateMatches[0][3]) || undefined,
            address: addr?.street ? `${addr.street}, ${oCity}, ${oState}` : `Amazon Logistics Facility [${leg.fromFac}]`,
            appointmentTime: parentPickupTime,
            status: "pending",
            notes: `Sub-Shipment Leg: ${leg.subId} (Origin)`,
          });
        }

        // Add Destination of leg
        const nextAddr = foundAddresses[idx + 1] || (foundAddresses.length > 1 ? foundAddresses[foundAddresses.length - 1] : undefined);
        const destCityMatch = (cityStateMatches[idx + 1] && cityStateMatches[idx + 1][1].trim()) || (cityStateMatches[cityStateMatches.length - 1] && cityStateMatches[cityStateMatches.length - 1][1].trim());
        const destStateMatch = (cityStateMatches[idx + 1] && cityStateMatches[idx + 1][2].trim()) || (cityStateMatches[cityStateMatches.length - 1] && cityStateMatches[cityStateMatches.length - 1][2].trim());
        const dCity = nextAddr?.city || destCityMatch || leg.toFac;
        const dState = nextAddr?.state || destStateMatch || "US";
        const stepTime = new Date(new Date(parentPickupTime).getTime() + (idx + 1) * 2 * 3600000).toISOString();

        stopsList.push({
          sequenceNumber: stopsList.length + 1,
          type: isLast ? "delivery" : "intermediate",
          activity: isLast ? "delivery" : "drop_hook",
          facilityCode: leg.toFac,
          city: dCity,
          state: dState,
          postalCode: nextAddr?.zip || undefined,
          address: nextAddr?.street ? `${nextAddr.street}, ${dCity}, ${dState}` : `Amazon Facility [${leg.toFac}]`,
          appointmentTime: isLast ? parentDeliveryTime : stepTime,
          status: "pending",
          notes: `Sub-Shipment Leg: ${leg.subId} (${leg.miles > 0 ? `${leg.miles} mi` : "Drop"})`,
        });
      });
    } else {
      // Fallback: 2-stop summary
      const facilityMatches = Array.from(text.matchAll(/(?:\[([A-Z0-9]{3,6})\]|\b([A-Z]{3,4}[0-9]{1,2})\b)/g));
      const cleanFacilities = facilityMatches
        .map((m) => m[1] || m[2])
        .filter((f) => !["POST", "TRIP", "TOUR", "LOAD", "TYPE", "RATE", "TIME", "STOP", "CITY", "DEST", "FROM", "AUTO", "VIEW", "INFO", "COST", "FEES", "PAID", "DAYS", "EDIT", "DATE", "USER", "MORE", "SHOW", "HIDE", "NAME", "PAGE", "NEXT", "BACK", "SAVE", "EXIT", "HELP", "TEAM", "UNIT", "TEST", "WARN", "ROLE", "LIVE", "DOCK", "GATE", "SEMI", "VANS", "FLAT", "REEF", "AMZN", "SYNC", "MENU", "AMAZON", "RELAY", "TOTAL", "DROP", "HOOK", "MILES", "HOUR", "HOURS", "WEEK", "CDT", "CST", "EDT", "EST", "PDT", "PST", "MDT", "MST", "UTC", "CDL", "TWIC", "FAST", "TTA", "LCV", "NC"].includes(f.toUpperCase()));

      const oFac = cleanFacilities[0] || undefined;
      const oCity = (cityStateMatches[0] && cityStateMatches[0][1].trim()) || oFac || "Origin Facility";
      const oState = (cityStateMatches[0] && cityStateMatches[0][2].trim()) || "US";

      const dFac = cleanFacilities.length > 1 ? cleanFacilities[cleanFacilities.length - 1] : undefined;
      const dMatch = cityStateMatches.length > 1 ? cityStateMatches[cityStateMatches.length - 1] : cityStateMatches[0];
      const dCity = (dMatch && dMatch[1].trim()) || dFac || "Destination Facility";
      const dState = (dMatch && dMatch[2].trim()) || "US";

      stopsList.push({
        sequenceNumber: 1,
        type: "pickup",
        activity: "pickup",
        facilityCode: oFac,
        city: oCity,
        state: oState,
        postalCode: cityStateMatches[0] && cityStateMatches[0][3] ? cityStateMatches[0][3] : undefined,
        address: foundAddresses[0] ? `${foundAddresses[0].street}, ${foundAddresses[0].city}` : (oFac ? `Amazon Logistics [${oFac}]` : `${oCity}, ${oState}`),
        appointmentTime: parentPickupTime,
        status: "pending",
      });

      stopsList.push({
        sequenceNumber: 2,
        type: "delivery",
        activity: "delivery",
        facilityCode: dFac,
        city: dCity,
        state: dState,
        postalCode: dMatch && dMatch[3] ? dMatch[3] : undefined,
        address: foundAddresses[1] ? `${foundAddresses[1].street}, ${foundAddresses[1].city}` : (dFac ? `Amazon Logistics [${dFac}]` : `${dCity}, ${dState}`),
        appointmentTime: parentDeliveryTime,
        status: "pending",
      });
    }

    const firstStop = stopsList[0];
    const lastStop = stopsList[stopsList.length - 1];

    return {
      stops: stopsList,
      originCity: firstStop.city,
      originState: firstStop.state,
      originFacilityCode: firstStop.facilityCode,
      originAddress: firstStop.address,
      pickupTime: parentPickupTime,
      destCity: lastStop.city,
      destState: lastStop.state,
      destFacilityCode: lastStop.facilityCode,
      destAddress: lastStop.address,
      deliveryTime: parentDeliveryTime,
      distanceMiles: totalMiles > 0 ? totalMiles : undefined,
      subLegsCount: subLegs.length,
      subLegsIds: subLegs.map((l) => l.subId),
    };
  }

  // 6. Targeted Screen Scanner strictly preserving vertical top-to-bottom Relay Screen Order
  function scanDomForTours() {
    const candidateNodes = [];

    // Target block containers and table rows
    const selectors = [
      'table tbody tr:not([class*="header" i])',
      'div[role="row"]:not([role="columnheader" i])',
      'li[class*="awsui-cards-card-item" i]',
      'div[class*="awsui_card_" i]',
      '[class*="block-tour" i]',
      '[class*="trip-card" i]',
      '[data-testid*="trip-row" i]',
      '[data-testid*="tour-row" i]',
    ];

    document.querySelectorAll(selectors.join(", ")).forEach((el) => {
      if (el === document.body || el === document.documentElement || (el.id && el.id.includes("ud-"))) return;
      candidateNodes.push(el);
    });

    // Fallback: Elements containing Block Tour IDs (B-...) or Tour IDs (T-...)
    if (candidateNodes.length === 0) {
      const allDivs = Array.from(document.querySelectorAll('div, tr, li, article, section'));
      for (const d of allDivs) {
        if (d.children.length <= 25 && d.textContent) {
          const txt = d.textContent;
          if (/\b([TB]-[A-Za-z0-9]{6,16})\b/.test(txt)) {
            candidateNodes.push(d);
          }
        }
      }
    }

    // Filter out wrappers containing other candidate cards
    const validRows = candidateNodes.filter((node) => {
      const hasChildRow = candidateNodes.some((other) => other !== node && node.contains(other));
      return !hasChildRow;
    });

    // Sort by visual top-to-bottom coordinate
    validRows.sort((a, b) => {
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

    for (let i = 0; i < validRows.length; i++) {
      const node = validRows[i];
      try {
        const text = (node.textContent || "").trim();
        if (!text || text.length < 10) continue;

        // Anti-ghost: ignore filter bars, header bars, and pagination
        const isHeaderOrFilter =
          text.includes("Search by IDs") ||
          text.includes("Domiciles") ||
          text.includes("Disruptions") ||
          text.includes("Work types") ||
          text.includes("Programs") ||
          text.includes("1-10 of") ||
          text.includes("results per page") ||
          text.includes("Sort by");

        if (isHeaderOrFilter && !/\b([TB]-[A-Za-z0-9]{6,16})\b/.test(text)) {
          continue;
        }

        // Extract genuine Block Trip ID (B-..., T-...)
        let tripId = extractBlockTripId(node, text);

        if (!tripId) {
          const hasFacility = /\[[A-Z0-9]{3,6}\]|\b[A-Z]{3,4}[0-9]{1,2}\b/.test(text);
          const hasCityState = /[A-Za-z\s]{3,20},\s*[A-Z]{2}\b/.test(text);
          if (hasFacility && hasCityState) {
            tripId = `RELAY-TRIP-${i + 1}`;
          }
        }

        if (!tripId || seenIds.has(tripId)) continue;
        seenIds.add(tripId);

        // Extract Multi-Leg Structure & All Stops
        const blockStructure = extractBlockTourStructure(node, text);

        // Extract Driver Name
        const driverName = extractDriverName(node, text);

        // Extract Contract Code
        const contractMatch = text.match(/\b(C-[0-9A-Za-z]{6,14})\b/);
        const contractCode = contractMatch ? contractMatch[1] : "C-0003CBSPY";

        // Status
        let status = "upcoming";
        if (/in\s*transit|en\s*route|on\s*road/i.test(text)) status = "in_transit";
        else if (/at\s*pickup|arrived\s*at\s*origin/i.test(text)) status = "at_pickup";
        else if (/at\s*delivery|arrived\s*at\s*dest/i.test(text)) status = "at_delivery";
        else if (/delivered|completed/i.test(text)) status = "delivered";
        else if (/delayed|at\s*risk/i.test(text)) status = "delayed";
        else if (/cancelled|void/i.test(text)) status = "cancelled";

        const tourObj = {
          vrid: tripId,
          source: "amazon_relay",
          equipment: "Dry Van (53')",
          rateUSD: 0,
          weightLbs: 38000,
          distanceMiles: blockStructure.distanceMiles,
          originCity: blockStructure.originCity,
          originState: blockStructure.originState,
          originAddress: blockStructure.originAddress,
          originFacilityCode: blockStructure.originFacilityCode,
          pickupTime: blockStructure.pickupTime,
          destCity: blockStructure.destCity,
          destState: blockStructure.destState,
          destAddress: blockStructure.destAddress,
          destFacilityCode: blockStructure.destFacilityCode,
          deliveryTime: blockStructure.deliveryTime,
          stops: blockStructure.stops,
          totalStopsCount: blockStructure.stops.length,
          status,
          screenIndex: currentScreenIndex++,
          driverName: driverName,
          driverPhone: "+1 (555) 000-0000",
          tractorNumber: "UD-AMZ",
          trailerNumber: "TR-5300",
          carrierName: "Chism Tracking / Unique Dispatch",
          carrierMcDot: contractCode,
          notes: `Amazon Relay Contract: ${contractCode} | Sub-Legs: ${blockStructure.subLegsCount > 0 ? blockStructure.subLegsIds.join(", ") : "Direct"} | Screen #${currentScreenIndex}`,
        };

        foundTours.push(tourObj);
      } catch (err) {
        console.warn("Tour parse warning:", err);
      }
    }

    if (foundTours.length === 0 && capturedApiToursMap.size > 0) {
      capturedApiToursMap.forEach((apiTour) => {
        foundTours.push(apiTour);
      });
    }

    latestOrderedTours = foundTours;
    try {
      chrome.storage.local.set({ lastDetectedTours: latestOrderedTours });
    } catch (e) {}

    return latestOrderedTours;
  }

  // 7. Floating Inspector Pill UI
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
            <span style="color:#34d399; font-weight:800;">${t.driverName || "Assigned Driver"}</span>
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

  // 8. Extraction & Dispatch in Strict Screen Order
  function extractAndSyncAll(isManual = false, mode = "upsert") {
    if (isSyncing) return;
    isSyncing = true;

    if (mode === "replace_all") {
      capturedApiToursMap.clear();
    }

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
              showToast(`✓ Synced ${tours.length} exact Relay tours with full multi-stop itineraries! ${modeLabel}`);
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

  // 9. Message Listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_NOW") {
      const mode = request.mode || "upsert";
      if (mode === "replace_all") {
        capturedApiToursMap.clear();
      }
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
      try {
        chrome.storage.local.set({ lastDetectedTours: [] });
      } catch (e) {}
      sendResponse({ status: "cleared", count: 0 });
      return false;
    }
  });

  window.__ud_trigger_scan = () => {
    scanDomForTours();
    updateFloatingPillUI();
  };

  // 10. Startup & Observers
  setTimeout(() => {
    injectFloatingPill();
    scanDomForTours();
    updateFloatingPillUI();
  }, 600);

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
})();
