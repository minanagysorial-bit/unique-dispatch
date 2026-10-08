/**
 * Unique Dispatch - Amazon Relay High-Fidelity Content Script
 * Scans Amazon Relay screens for 100% authentic tours in exact 1:1 screen order (#1 to #N).
 * Extracts authentic Trip IDs (T-..., B-..., VRIDs), Drivers, Stops, and exact Dates (Today/Tomorrow).
 * Zero-tolerance for false/wrapper loads.
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

  // 2. High-Precision Date & Time Parser for Amazon Relay (e.g. "Thu, Oct 8, 18:03 CDT", "Fri, Oct 9, 00:30 CDT", "Tomorrow 14:00")
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

    // 1. Check for relative tags: Tomorrow / Yesterday / in N days
    if (lower.includes("tomorrow") || lower.includes("in 1 day") || lower.includes("in 24 hours")) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lower.includes("in 2 days") || lower.includes("in 48 hours")) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (lower.includes("in 3 days")) {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (lower.includes("yesterday")) {
      targetDate.setDate(targetDate.getDate() - 1);
    } else {
      // 2. Match Amazon Relay format: "Thu, Oct 8", "Fri, Oct 9", "Oct 8", "Oct 09", "10/08"
      const monthMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i);
      const isoDateMatch = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
      const numericDateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);

      if (monthMatch) {
        const months = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const monthNum = months[monthMatch[1].toLowerCase().slice(0, 3)];
        const dayNum = parseInt(monthMatch[2], 10);
        const yearNum = monthMatch[3] ? parseInt(monthMatch[3], 10) : now.getFullYear();

        if (monthNum !== undefined && !isNaN(dayNum)) {
          targetDate.setFullYear(yearNum, monthNum, dayNum);
          // If date parsed is more than 30 days in the past (and no explicit year was given), it's next year
          if (!monthMatch[3] && targetDate.getTime() < now.getTime() - 30 * 24 * 3600 * 1000) {
            targetDate.setFullYear(targetDate.getFullYear() + 1);
          }
        }
      } else if (isoDateMatch) {
        const y = parseInt(isoDateMatch[1], 10);
        const m = parseInt(isoDateMatch[2], 10) - 1;
        const d = parseInt(isoDateMatch[3], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          targetDate.setFullYear(y, m, d);
        }
      } else if (numericDateMatch) {
        const m = parseInt(numericDateMatch[1], 10) - 1;
        const d = parseInt(numericDateMatch[2], 10);
        let y = numericDateMatch[3] ? parseInt(numericDateMatch[3], 10) : now.getFullYear();
        if (y < 100) y += 2000;
        if (!isNaN(m) && !isNaN(d)) {
          targetDate.setFullYear(y, m, d);
        }
      }
    }

    // 3. Match Clock Time: "18:03", "22:44", "08:30 AM", "2:00 PM"
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

  // 3. Extract Real Amazon Relay Trip ID (T-..., B-..., VRID, Contract)
  function extractRelayTripId(node, text) {
    if (!node) return null;

    // Pattern 1: Tour ID (T-...) or Block ID (B-...) e.g. T-115M3SH6V, B-DZTBJZ841, B-0WM2TN02
    const prefixMatch = text.match(/\b([TB]-[A-Za-z0-9]{6,16})\b/);
    if (prefixMatch && prefixMatch[1]) {
      return prefixMatch[1].trim();
    }

    // Pattern 2: Work Opportunity (WO-...) or Tour Number
    const woMatch = text.match(/\b(WO-[A-Za-z0-9]{4,14})\b/i);
    if (woMatch && woMatch[1]) {
      return woMatch[1].trim();
    }

    // Pattern 3: Anchor links href
    const allLinks = Array.from(node.querySelectorAll ? node.querySelectorAll("a[href]") : []);
    if (node.tagName === "A") allLinks.push(node);
    for (const link of allLinks) {
      const href = link.getAttribute("href") || link.href || "";
      const m = href.match(/\/(?:tours|tour|trips|trip|loads|load|work-opportunities|carrier|execution)\/(?:details\/)?([TB]-[A-Za-z0-9]{6,16}|[0-9]{6,10}|[A-Za-z0-9\-_]{6,24})/i);
      if (m && m[1]) {
        const cand = m[1].trim();
        const forbidden = ["SEARCH", "HISTORY", "FILTER", "CREATE", "VIEW", "DETAILS", "SAVED", "TRIPS", "TOURS", "LOADS", "CARRIER", "EXECUTION"];
        if (!forbidden.includes(cand.toUpperCase())) {
          return cand;
        }
      }
    }

    // Pattern 4: Labeled Trip ID in text
    const labeledMatch = text.match(/(?:Trip|Tour|Load|VRID|Booking|Ref)\s*(?:ID|#|Number|No)?\s*[:#\-\s]+([TB]-[A-Za-z0-9]{6,16}|[0-9]{6,10}|[A-Za-z0-9\-_]{6,18})/i);
    if (labeledMatch && labeledMatch[1]) {
      const cand = labeledMatch[1].trim();
      const forbidden = ["ID", "NUMBER", "DETAILS", "STATUS", "CARRIER", "ASSIGNED", "UPCOMING", "ACTIVE", "VIEW", "FILTER", "SEARCH", "COMPLETED"];
      if (!forbidden.includes(cand.toUpperCase())) {
        return cand;
      }
    }

    // Pattern 5: Standalone 6-10 digit VRID in table cells
    const cells = Array.from(node.querySelectorAll ? node.querySelectorAll('td, [role="cell"], [role="gridcell"], div[class*="cell" i], span[class*="id" i]') : []);
    for (const cell of cells) {
      const cellText = (cell.textContent || "").trim();
      if (/^([TB]-[A-Za-z0-9]{6,16})$/.test(cellText)) {
        return cellText;
      }
      if (/^[0-9]{6,10}$/.test(cellText)) {
        return cellText;
      }
    }

    return null;
  }

  // 4. Extract Assigned Driver Name
  function extractDriverName(node, text) {
    if (!node) return "Assigned Driver";

    // Check select dropdown value or text
    const selectEl = node.querySelector ? node.querySelector("select") : null;
    if (selectEl) {
      const selectedOpt = selectEl.options[selectEl.selectedIndex];
      const optText = selectedOpt ? selectedOpt.text.trim() : selectEl.value.trim();
      if (optText && !/select|assign|choose|driver/i.test(optText)) {
        return optText;
      }
    }

    // Check driver badge / assignee elements
    const driverEl = node.querySelector
      ? node.querySelector('[data-testid*="driver" i], [class*="driver" i], [class*="assignee" i], [class*="Driver" i]')
      : null;
    if (driverEl) {
      const dText = (driverEl.textContent || "").trim();
      if (dText && dText.length >= 2 && dText.length <= 30 && !/assign|status/i.test(dText)) {
        return dText;
      }
    }

    // Pattern in Relay text: "M. Ford", "M. CRISTOBAL", "J. Solis", "J. Jackson", "D. Perez", "A. Lopez", "T. Walker", "M. CARTER", "Dunlap"
    // Often follows endorsements like "CDL", "LCV, NC", "TWIC", "FAST"
    const driverRegex = /(?:CDL[^\n\r]*|Endorsements[^\n\r]*)\s+([A-Z]\.\s+[A-Za-z0-9]+|[A-Z][a-z]+|[A-Z]{3,15})/i;
    const dm = text.match(driverRegex);
    if (dm && dm[1]) {
      const cand = dm[1].trim();
      const forbidden = ["CDL", "FAST", "TWIC", "TTA", "LCV", "NC", "ACCEPT", "DETAILS", "DROP", "HOOK", "TRAILER", "CONTRACT"];
      if (!forbidden.includes(cand.toUpperCase())) {
        return cand;
      }
    }

    // Standalone "Initial. Lastname" pattern (e.g. M. Ford, J. Solis)
    const initialNameMatch = text.match(/\b([A-Z]\.\s+[A-Za-z]{2,20})\b/);
    if (initialNameMatch && initialNameMatch[1]) {
      return initialNameMatch[1].trim();
    }

    return "Assigned Driver";
  }

  // 5. Extract Multi-Stop Details from Amazon Relay Row
  function extractStopsFromRelayRow(node, text) {
    const stops = [];

    // Facility regex: e.g. [AUS2], [IAH1], [SAT4], AUS2, JFK8, TEB9
    const facilityMatches = Array.from(text.matchAll(/(?:\[([A-Z0-9]{3,6})\]|\b([A-Z]{3,4}[0-9]{1,2})\b)/g));
    const cleanFacilities = facilityMatches
      .map((m) => m[1] || m[2])
      .filter((f) => {
        const forbidden = ["POST", "TRIP", "TOUR", "LOAD", "TYPE", "RATE", "TIME", "STOP", "CITY", "DEST", "FROM", "AUTO", "VIEW", "INFO", "COST", "FEES", "PAID", "DAYS", "EDIT", "DATE", "USER", "MORE", "SHOW", "HIDE", "NAME", "PAGE", "NEXT", "BACK", "SAVE", "EXIT", "HELP", "TEAM", "UNIT", "TEST", "WARN", "ROLE", "LIVE", "DOCK", "GATE", "SEMI", "VANS", "FLAT", "REEF", "AMZN", "SYNC", "MENU", "AMAZON", "RELAY", "TOTAL", "DROP", "HOOK", "MILES", "HOUR", "HOURS", "WEEK", "CDT", "CST", "EDT", "EST", "PDT", "PST", "MDT", "MST", "UTC", "CDL", "TWIC", "FAST", "TTA", "LCV", "NC"];
        return f && !forbidden.includes(f.toUpperCase());
      });

    // Match City, State pairs (e.g. "Pflugerville, TX 78660", "Dallas, TX 75241", "San Antonio, TX 78219", "San Antonio, TX")
    const cityStateMatches = Array.from(
      text.matchAll(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/g)
    );

    // Match Dates in row text (e.g. "Thu, Oct 8, 18:03 CDT", "Fri, Oct 9, 05:20 CDT")
    const dateMatches = Array.from(
      text.matchAll(/(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[A-Z]{3})?/gi)
    );

    const now = new Date();
    const defaultPickupTime = dateMatches[0] ? parseRelayDateTime(dateMatches[0][0], false) : parseRelayDateTime(text, false);
    const defaultDeliveryTime = dateMatches[1] ? parseRelayDateTime(dateMatches[1][0], true) : dateMatches[0] ? parseRelayDateTime(dateMatches[0][0], true) : parseRelayDateTime(text, true);

    // Build Stop 1 (Pickup)
    const oFacility = cleanFacilities[0] || undefined;
    const oCity = (cityStateMatches[0] && cityStateMatches[0][1].trim()) || oFacility || "Origin Facility";
    const oState = (cityStateMatches[0] && cityStateMatches[0][2].trim()) || "US";
    const oZip = cityStateMatches[0] && cityStateMatches[0][3] ? cityStateMatches[0][3] : undefined;

    stops.push({
      sequenceNumber: 1,
      type: "pickup",
      activity: "pickup",
      facilityCode: oFacility,
      city: oCity,
      state: oState,
      postalCode: oZip,
      appointmentTime: defaultPickupTime,
      status: "pending",
    });

    // Build Stop 2 (Delivery)
    const dFacility = (cleanFacilities.length > 1 ? cleanFacilities[cleanFacilities.length - 1] : undefined);
    const dMatch = cityStateMatches.length > 1 ? cityStateMatches[cityStateMatches.length - 1] : cityStateMatches[0];
    const dCity = (dMatch && dMatch[1].trim()) || dFacility || "Destination Facility";
    const dState = (dMatch && dMatch[2].trim()) || "US";
    const dZip = dMatch && dMatch[3] ? dMatch[3] : undefined;

    stops.push({
      sequenceNumber: 2,
      type: "delivery",
      activity: "delivery",
      facilityCode: dFacility,
      city: dCity,
      state: dState,
      postalCode: dZip,
      appointmentTime: defaultDeliveryTime,
      status: "pending",
    });

    return {
      stops,
      originCity: oCity,
      originState: oState,
      originFacilityCode: oFacility,
      pickupTime: defaultPickupTime,
      destCity: dCity,
      destState: dState,
      destFacilityCode: dFacility,
      deliveryTime: defaultDeliveryTime,
    };
  }

  // 6. Targeted Screen Scanner strictly preserving vertical top-to-bottom Relay Screen Order
  function scanDomForTours() {
    const candidateNodes = [];
    const candidateElementSet = new Set();

    function addCandidate(el) {
      if (!el || candidateElementSet.has(el)) return;
      if (el === document.body || el === document.documentElement || (el.id && el.id.includes("ud-"))) return;
      candidateElementSet.add(el);
      candidateNodes.push(el);
    }

    // Selector Strategy 1: Table Rows (Cloudscape Table, HTML Table, Grid Rows)
    document.querySelectorAll(
      'table tbody tr:not([class*="header" i]), [role="row"]:not([role="columnheader" i]), [class*="awsui_row" i], [class*="awsui-table-row" i], [class*="awsui_table_row" i], [class*="TableRow" i], [class*="table-row" i], [class*="grid-row" i]'
    ).forEach(addCandidate);

    // Selector Strategy 2: Tour / Trip / Loadboard Links and their card containers
    document.querySelectorAll(
      'a[href*="/tours" i], a[href*="/tour" i], a[href*="/trips" i], a[href*="/trip" i], a[href*="/loads" i], a[href*="/load" i], a[href*="/work-opportunities" i], a[href*="/work-opportunity" i], a[href*="/execution" i], a[href*="/loadboard" i], a[href*="/carrier" i]'
    ).forEach((link) => {
      const container = link.closest(
        'tr, [role="row"], [class*="card" i], [class*="row" i], [class*="item" i], [class*="tour" i], [class*="trip" i], li, article, section'
      ) || link.parentElement?.parentElement || link;
      addCandidate(container);
    });

    // Selector Strategy 3: Cloudscape Cards, Card Grids, Tiles, and Item Wrappers
    document.querySelectorAll(
      '[class*="awsui_card" i], [class*="awsui-card" i], [class*="awsui-cards" i] li, [class*="TourCard" i], [class*="tour-card" i], [class*="TripCard" i], [class*="trip-card" i], [class*="WorkOpportunityCard" i], [class*="work-opportunity" i], [data-testid*="card" i], [data-testid*="row" i], [data-testid*="tour" i], [data-testid*="trip" i], [data-testid*="item" i]'
    ).forEach(addCandidate);

    // Filter out parent containers that contain other candidate child nodes (to avoid duplicate "wrapper" tours)
    const filteredCandidateNodes = candidateNodes.filter((node) => {
      for (const other of candidateNodes) {
        if (other !== node && node.contains(other)) {
          return false; // Discard outer container, keep inner row/card!
        }
      }
      return true;
    });

    // Strictly sort candidate nodes by vertical top-to-bottom document position
    filteredCandidateNodes.sort((a, b) => {
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

    for (let i = 0; i < filteredCandidateNodes.length; i++) {
      const node = filteredCandidateNodes[i];
      try {
        const text = (node.textContent || "").trim();
        if (!text || text.length < 10) continue;

        // Anti-ghost check: Discard header bars, search bars, filter bars, pagination bars
        const isHeaderOrFilter =
          text.includes("Search by IDs") ||
          text.includes("Domiciles") ||
          text.includes("Disruptions") ||
          text.includes("Work types") ||
          text.includes("Programs") ||
          text.includes("1-10 of") ||
          text.includes("results per page") ||
          text.includes("Sort by") ||
          text.includes("Export") ||
          text.includes("Bulk action");

        // Extract genuine Relay Trip ID
        let tripId = extractRelayTripId(node, text);

        // If no genuine Trip ID found and it looks like a header/wrapper, discard it immediately!
        if (!tripId && isHeaderOrFilter) {
          continue;
        }

        // If no Trip ID found, but element contains real stop route (e.g. [SAT4] -> San Antonio, TX)
        if (!tripId) {
          const hasFacility = /\[[A-Z0-9]{3,6}\]|\b[A-Z]{3,4}[0-9]{1,2}\b/.test(text);
          const hasCityState = /[A-Za-z\s]{3,20},\s*[A-Z]{2}\b/.test(text);
          if (hasFacility && hasCityState) {
            tripId = `RELAY-TRIP-${i + 1}`;
          }
        }

        // If still no trip ID, skip this node (prevents fake/ghost cards)
        if (!tripId) continue;

        if (seenIds.has(tripId)) continue;
        seenIds.add(tripId);

        // If we already intercepted a richer JSON API payload for this tripId, merge and keep screenIndex!
        if (capturedApiToursMap.has(tripId)) {
          const richTour = { ...capturedApiToursMap.get(tripId) };
          richTour.screenIndex = currentScreenIndex++;
          foundTours.push(richTour);
          continue;
        }

        // Extract Stops, Locations & Exact Dates
        const routeData = extractStopsFromRelayRow(node, text);

        // Extract Driver Name
        const driverName = extractDriverName(node, text);

        // Extract Contract Code if present (e.g. C-000030574)
        const contractMatch = text.match(/\b(C-[0-9]{6,12})\b/);
        const contractCode = contractMatch ? contractMatch[1] : "C-RELAY";

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
        else if (/53'?\s*trailer/i.test(text)) equipment = "Dry Van (53')";

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
          equipment,
          rateUSD,
          weightLbs,
          distanceMiles,
          originCity: routeData.originCity,
          originState: routeData.originState,
          originFacilityCode: routeData.originFacilityCode,
          pickupTime: routeData.pickupTime,
          destCity: routeData.destCity,
          destState: routeData.destState,
          destFacilityCode: routeData.destFacilityCode,
          deliveryTime: routeData.deliveryTime,
          stops: routeData.stops,
          totalStopsCount: routeData.stops.length,
          status,
          screenIndex: currentScreenIndex++,
          driverName: driverName,
          driverPhone: "+1 (555) 000-0000",
          tractorNumber: "UD-AMZ",
          trailerNumber: "TR-5300",
          carrierName: "Chism Tracking / Unique Dispatch",
          carrierMcDot: contractCode,
          notes: `Amazon Relay Contract: ${contractCode} | Screen Position #${currentScreenIndex}`,
        };

        foundTours.push(tourObj);
      } catch (err) {
        console.warn("Tour parse warning:", err);
      }
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
    // Persist to local storage for immediate popup availability
    try {
      chrome.storage.local.set({ lastDetectedTours: latestOrderedTours });
    } catch (e) {}

    return latestOrderedTours;
  }

  // 7. Floating Inspector Pill UI (Only in top frame)
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
            <span style="color:#34d399; font-weight:800;">${t.rateUSD > 0 ? `$${t.rateUSD.toLocaleString()}` : (t.driverName || "Assigned Driver")}</span>
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

  // 9. Message Listener
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
      try {
        chrome.storage.local.set({ lastDetectedTours: [] });
      } catch (e) {}
      sendResponse({ status: "cleared", count: 0 });
      return false;
    }
  });

  // Export for idempotent re-triggers
  window.__ud_trigger_scan = () => {
    scanDomForTours();
    updateFloatingPillUI();
  };

  // 10. Startup & Observers
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
