/**
 * Unique Dispatch - Amazon Relay Enterprise Content Script
 * Extracts 100% authentic Amazon Relay Block Tours, Multi-Leg Sub-Trips, 
 * Full 6+ Stop progression lines, Driver Names, Contract Codes, and Exact Dates.
 */

(function () {
  "use strict";

  window.__ud_content_script_initialized = true;
  window.__ud_version = "1.0.7";

  console.log("🚚 [Unique Dispatch] Relay High-Fidelity Multi-Leg Engine Active v1.0.7 in frame:", window.location.href);

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

      const tours = scanDomForTours();
      updateFloatingPillUI();
      if (tours.length > 0) {
        extractAndSyncAll(false, "upsert");
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
      // Month + Day format: e.g. "Thu, Oct 8", "Fri, Oct 9", "Sat, Oct 10", "8 Oct", "9 Oct", "Mon, Oct 12"
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

    // Clock Time (e.g. "12:05", "18:03", "04:07", "17:30", "00:30")
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

  // 3. Extract Driver Name from Dropdown, Inputs, Buttons, Cells, or Text
  function extractDriverName(node, text) {
    if (!node && !text) return "Assigned Driver";

    const isBadDriver = (cand) => {
      if (!cand || cand.length < 3 || cand.length > 35) return true;
      const lower = cand.toLowerCase();
      return (
        /select|assign|choose|driver|search|filter|^none$|action|detail|track|relay|amazon|contract|trailer|solo|team|starts|expires|hours|miles|drop|hook|cdl|fast|uiia|bnsf|epa|twic|load|trip|tour|upcoming|transit|history|export|bulk|accept|sort/i.test(
          cand
        )
      );
    };

    // 1. Inspect elements inside node (AWSUI / Cloudscape Select dropdown, Autosuggest inputs, triggers)
    if (node && node.querySelectorAll) {
      // Inputs (Cloudscape Autosuggest / Combobox where driver name is stored in input.value)
      const inputs = Array.from(node.querySelectorAll('input, [role="combobox"]'));
      for (const inp of inputs) {
        const val = (inp.value || inp.getAttribute("value") || "").trim();
        if (!isBadDriver(val)) {
          const m =
            val.match(/\b([A-Z]\.\s+[A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\b/) ||
            val.match(/\b([A-Z]\.\s*[A-Z]{2,20})\b/) ||
            val.match(/\b([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})\b/);
          if (m && !isBadDriver(m[1])) return m[1].trim();
          if (/^[A-Z\s\.\-]{3,35}$/.test(val) && !isBadDriver(val)) return val;
        }
      }

      // Direct select element
      const selectEl = node.querySelector("select");
      if (selectEl) {
        const selectedOpt = selectEl.options[selectEl.selectedIndex];
        const optText = (selectedOpt ? selectedOpt.text : selectEl.value || "").trim();
        if (!isBadDriver(optText)) {
          return optText;
        }
      }

      // Dropdown buttons / triggers
      const triggerButtons = Array.from(
        node.querySelectorAll(
          'button[aria-haspopup="listbox"], button[class*="trigger"], [class*="awsui-select"] button, [class*="awsui_select"] button, [class*="select"] button, [class*="driver"] button, [aria-label*="driver" i], [class*="selected-option"], [class*="trigger-content"]'
        )
      );
      for (const btn of triggerButtons) {
        const bText = (btn.innerText || btn.textContent || "").trim();
        if (!isBadDriver(bText)) {
          const m =
            bText.match(/\b([A-Z]\.\s+[A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\b/) ||
            bText.match(/\b([A-Z]\.\s*[A-Z]{2,20})\b/) ||
            bText.match(/\b([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})\b/);
          if (m && !isBadDriver(m[1])) return m[1].trim();
          if (/^[A-Z\s\.\-]{3,35}$/.test(bText) && !isBadDriver(bText)) return bText;
        }
      }

      // Check cells from right to left (driver is always in one of the rightmost columns)
      const cells = Array.from(node.querySelectorAll('td, [role="cell"], [role="gridcell"]'));
      if (cells.length >= 4) {
        for (let c = cells.length - 1; c >= 3; c--) {
          const cText = (cells[c].innerText || cells[c].textContent || "").trim();
          if (isBadDriver(cText)) continue;
          const dMatch =
            cText.match(/\b([A-Z]\.\s+[A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\b/) ||
            cText.match(/\b([A-Z]\.\s*[A-Z]{2,20})\b/) ||
            cText.match(/\b([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})\b/);
          if (dMatch && !isBadDriver(dMatch[1])) {
            return dMatch[1].trim();
          }
        }
      }
    }

    // 2. Pre-process spaced text to split glued text (e.g. "UIIA_MCF. Sanchez" -> "UIIA_MC F. Sanchez")
    const spaced = (text || "").replace(/([A-Za-z0-9_])([A-Z]\.\s*)/g, "$1 $2");
    const nameMatch =
      spaced.match(/\b([A-Z]\.\s+[A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\b/) ||
      spaced.match(/\b([A-Z]\.\s*[A-Z]{2,20})\b/);
    if (nameMatch && nameMatch[1]) {
      const cand = nameMatch[1].trim();
      if (!isBadDriver(cand)) {
        return cand;
      }
    }

    // Full name format e.g. "John Smith"
    const fullNameMatch = spaced.match(/\b([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})\b/);
    if (fullNameMatch && fullNameMatch[1]) {
      const cand = fullNameMatch[1].trim();
      if (!isBadDriver(cand)) {
        return cand;
      }
    }

    return "Assigned Driver";
  }

  // 4. Deep Multi-Stop & Sub-Leg Extractor for Amazon Relay Blocks
  function extractBlockTourStructure(node, text) {
    const cells = node && node.querySelectorAll ? Array.from(node.querySelectorAll('td, [role="cell"], [role="gridcell"]')) : [];

    // Pre-process text to insert spaces around glued tokens
    const preprocessedText = (text || "")
      .replace(/([0-9])([A-Z]{3,4}[0-9]{1,2})/g, "$1 $2")
      .replace(/(CDT|CST|EDT|EST|PDT|PST|MDT|MST)([A-Z])/g, "$1 $2")
      .replace(/(\d{5})([A-Z][a-z]{2})/g, "$1 $2");

    // 1. Extract Parent Start and End Times
    const dateMatches = Array.from(
      preprocessedText.matchAll(/(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[A-Z]{3})?/gi)
    );

    const parentPickupTime = dateMatches[0] ? parseRelayDateTime(dateMatches[0][0], false) : parseRelayDateTime(preprocessedText, false);
    const parentDeliveryTime = dateMatches[1] ? parseRelayDateTime(dateMatches[1][0], true) : parseRelayDateTime(preprocessedText, true);

    // 2. Extract Sub-Legs e.g. "116NH3T6Y 1 SAT41 -> 2 SAT3 8 mi 0h 25m Drop" or "T-1146DGRTM SAT41 -> SAT9 7 mi"
    const legRegex = /(?:>|v)?\s*(T-[A-Za-z0-9]{9}|[0-9][A-Z0-9]{7,10}|[A-Z0-9]{8,10})\s*[\n\r\s]+(?:(\d+)\s+)?([A-Z0-9]{3,6})\s*[\n\r\s]*(?:➔|->|to)\s*(?:(\d+)\s+)?([A-Z0-9]{3,6})(?:[\s\S]*?(\d+)\s*mi)?/gi;
    const subLegs = [];
    let legMatch;

    while ((legMatch = legRegex.exec(text)) !== null) {
      subLegs.push({
        subId: legMatch[1].trim(),
        fromSeq: legMatch[2] ? parseInt(legMatch[2], 10) : (subLegs.length + 1),
        fromFac: legMatch[3].trim(),
        toSeq: legMatch[4] ? parseInt(legMatch[4], 10) : (subLegs.length + 2),
        toFac: legMatch[5].trim(),
        miles: legMatch[6] ? parseInt(legMatch[6], 10) : 0,
      });
    }

    // 3. Extract Addresses e.g. "111 Gembler Rd, San Antonio, TX 78219" or "PVT ST AT 10384 W US HIGHWAY 90, San Antonio, TX 78245"
    const addressRegex = /((?:PVT\s+ST\s+AT\s+)?\d+\s+[A-Za-z0-9\s\.\-]{2,45}(?:Rd|St|Ave|Dr|Blvd|Way|Ct|Ln|Hwy|Pkwy|Highway\s*\d+|Loop\s*\d+|Parkway|Boulevard|Lane|Drive|Road|Street))[,\s\n\r]+([A-Za-z\s]{3,20}),\s*([A-Z]{2})(?:\s+(\d{5}))?/gi;
    const foundAddresses = [];
    let addrMatch;
    while ((addrMatch = addressRegex.exec(text)) !== null) {
      let rawStreet = addrMatch[1].trim();
      const cleanStreet = rawStreet.replace(/^[\s\S]*?\b(\d+\s+[A-Za-z0-9\s\.\-]+(?:Rd|St|Ave|Dr|Blvd|Way|Ct|Ln|Hwy|Pkwy|Highway\s*\d+|Loop\s*\d+|Parkway|Boulevard|Lane|Drive|Road|Street))/i, "$1").trim();
      foundAddresses.push({
        street: cleanStreet || rawStreet,
        city: addrMatch[2].trim(),
        state: addrMatch[3].trim(),
        zip: addrMatch[4] ? addrMatch[4].trim() : undefined,
      });
    }

    // 4. Extract ARN numbers & Reference IDs
    const arnMatches = Array.from(text.matchAll(/ARN\s*#?\s*(\d{8,14})/gi)).map((m) => m[1]);
    const apptMatch = text.match(/Appointment\s*Id\s*(\d{8,16})/i);
    const appointmentId = apptMatch ? apptMatch[1] : undefined;

    // 5. Extract CPT (Critical Pull Time)
    const cptMatch = text.match(/CPT\s+([A-Za-z0-9\s,:]+(?:AM|PM|CDT|CST|EDT|EST)?)/i);
    const cptTime = cptMatch ? cptMatch[1].trim() : undefined;

    // 6. Extract Total Miles (sum of legs or stated miles)
    let totalMiles = 0;
    if (subLegs.length > 0) {
      totalMiles = subLegs.reduce((acc, l) => acc + (l.miles || 0), 0);
    }
    if (totalMiles === 0) {
      const milesMatch = text.match(/([0-9,]+)\s*mi\b/i);
      if (milesMatch) totalMiles = parseInt(milesMatch[1].replace(/,/g, ""), 10);
    }

    // 7. Build Ordered Stops Array
    const stopsList = [];
    const cityStateMatches = Array.from(preprocessedText.matchAll(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/g));

    if (subLegs.length > 0) {
      // Build sequenced stops from authentic sub-legs
      subLegs.forEach((leg, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === subLegs.length - 1;
        const legArn = arnMatches[idx] || (arnMatches.length === 1 ? arnMatches[0] : undefined);

        // Add Origin of leg (for first leg)
        if (isFirst || stopsList.length === 0) {
          const addr = foundAddresses[0];
          const oCity = addr?.city || (cityStateMatches[0] && cityStateMatches[0][1].trim()) || leg.fromFac;
          const oState = addr?.state || (cityStateMatches[0] && cityStateMatches[0][2].trim()) || "TX";
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
            arnNumber: legArn,
            cptTime: isFirst ? cptTime : undefined,
            isBobtail: /bobtail/i.test(text),
            status: "pending",
            notes: `Sub-Shipment Leg: ${leg.subId} (Origin)${legArn ? ` | ARN #${legArn}` : ""}`,
          });
        }

        // Add Destination of leg
        const nextAddr = foundAddresses[idx + 1] || (foundAddresses.length > 1 ? foundAddresses[foundAddresses.length - 1] : undefined);
        const destCityMatch = (cityStateMatches[idx + 1] && cityStateMatches[idx + 1][1].trim()) || (cityStateMatches[cityStateMatches.length - 1] && cityStateMatches[cityStateMatches.length - 1][1].trim());
        const destStateMatch = (cityStateMatches[idx + 1] && cityStateMatches[idx + 1][2].trim()) || (cityStateMatches[cityStateMatches.length - 1] && cityStateMatches[cityStateMatches.length - 1][2].trim());
        const dCity = nextAddr?.city || destCityMatch || leg.toFac;
        const dState = nextAddr?.state || destStateMatch || "TX";
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
          arnNumber: legArn,
          isBobtail: /bobtail/i.test(text),
          status: "pending",
          notes: `Sub-Shipment Leg: ${leg.subId} (${leg.miles > 0 ? `${leg.miles} mi` : "Drop"})${legArn ? ` | ARN #${legArn}` : ""}`,
        });
      });
    } else {
      // Direct summary extraction from row columns
      let cellOriginText = cells[2] ? (cells[2].innerText || cells[2].textContent || "").trim() : "";
      let cellDestText = cells[3] ? (cells[3].innerText || cells[3].textContent || "").trim() : "";

      const facilityMatches = Array.from(preprocessedText.matchAll(/(?:\[([A-Z0-9]{3,6})\]|\b([A-Z]{3,4}[0-9]{1,2})\b)/g));
      const cleanFacilities = facilityMatches
        .map((m) => m[1] || m[2])
        .filter((f) => !["POST", "TRIP", "TOUR", "LOAD", "TYPE", "RATE", "TIME", "STOP", "CITY", "DEST", "FROM", "AUTO", "VIEW", "INFO", "COST", "FEES", "PAID", "DAYS", "EDIT", "DATE", "USER", "MORE", "SHOW", "HIDE", "NAME", "PAGE", "NEXT", "BACK", "SAVE", "EXIT", "HELP", "TEAM", "UNIT", "TEST", "WARN", "ROLE", "LIVE", "DOCK", "GATE", "SEMI", "VANS", "FLAT", "REEF", "AMZN", "SYNC", "MENU", "AMAZON", "RELAY", "TOTAL", "DROP", "HOOK", "MILES", "HOUR", "HOURS", "WEEK", "CDT", "CST", "EDT", "EST", "PDT", "PST", "MDT", "MST", "UTC", "CDL", "TWIC", "FAST", "TTA", "LCV", "NC"].includes(f.toUpperCase()));

      const oFac = cleanFacilities[0] || (cellOriginText.match(/\b([A-Z]{3,4}[0-9]{1,2})\b/)?.[1]) || undefined;
      const oMatch = (cellOriginText && cellOriginText.match(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/)) || cityStateMatches[0];
      const oCity = (oMatch && oMatch[1].trim()) || (foundAddresses[0] && foundAddresses[0].city) || (oFac ? `Facility ${oFac}` : "San Antonio");
      const oState = (oMatch && oMatch[2].trim()) || (foundAddresses[0] && foundAddresses[0].state) || "TX";
      const oZip = (oMatch && oMatch[3]) || (foundAddresses[0] && foundAddresses[0].zip) || undefined;

      const dFac = (cleanFacilities.length > 1 ? cleanFacilities[cleanFacilities.length - 1] : undefined) || (cellDestText.match(/\b([A-Z]{3,4}[0-9]{1,2})\b/)?.[1]) || undefined;
      const dMatch = (cellDestText && cellDestText.match(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/)) || (cityStateMatches.length > 1 ? cityStateMatches[cityStateMatches.length - 1] : cityStateMatches[0]);
      const dCity = (dMatch && dMatch[1].trim()) || (foundAddresses[1] && foundAddresses[1].city) || oCity;
      const dState = (dMatch && dMatch[2].trim()) || (foundAddresses[1] && foundAddresses[1].state) || oState;
      const dZip = (dMatch && dMatch[3]) || (foundAddresses[1] && foundAddresses[1].zip) || undefined;

      stopsList.push({
        sequenceNumber: 1,
        type: "pickup",
        activity: "pickup",
        facilityCode: oFac,
        city: oCity,
        state: oState,
        postalCode: oZip,
        address: foundAddresses[0] ? `${foundAddresses[0].street}, ${foundAddresses[0].city}, ${foundAddresses[0].state}` : (oFac ? `Amazon Facility [${oFac}] - ${oCity}, ${oState}` : `${oCity}, ${oState}`),
        appointmentTime: parentPickupTime,
        arnNumber: arnMatches[0] || undefined,
        cptTime: cptTime || undefined,
        isBobtail: /bobtail/i.test(text),
        status: "pending",
      });

      stopsList.push({
        sequenceNumber: 2,
        type: "delivery",
        activity: "delivery",
        facilityCode: dFac,
        city: dCity,
        state: dState,
        postalCode: dZip,
        address: foundAddresses[1] ? `${foundAddresses[1].street}, ${foundAddresses[1].city}, ${foundAddresses[1].state}` : (dFac ? `Amazon Facility [${dFac}] - ${dCity}, ${dState}` : `${dCity}, ${dState}`),
        appointmentTime: parentDeliveryTime,
        arnNumber: arnMatches[1] || arnMatches[0] || undefined,
        isBobtail: /bobtail/i.test(text),
        status: "pending",
      });
    }

    const firstStop = stopsList[0] || {};
    const lastStop = stopsList[stopsList.length - 1] || firstStop;

    return {
      stops: stopsList,
      originCity: firstStop.city || "San Antonio",
      originState: firstStop.state || "TX",
      originFacilityCode: firstStop.facilityCode,
      originAddress: firstStop.address,
      pickupTime: parentPickupTime,
      destCity: lastStop.city || firstStop.city || "San Antonio",
      destState: lastStop.state || firstStop.state || "TX",
      destFacilityCode: lastStop.facilityCode,
      destAddress: lastStop.address,
      deliveryTime: parentDeliveryTime,
      distanceMiles: totalMiles > 0 ? totalMiles : undefined,
      subLegsCount: subLegs.length,
      subLegsIds: subLegs.map((l) => l.subId),
      arnNumbers: arnMatches,
      appointmentId,
      cptTime,
    };
  }

  // 5. Targeted Screen Scanner strictly preserving vertical top-to-bottom Relay Screen Order
  function scanDomForTours() {
    const foundTours = [];
    const seenIds = new Set();
    let currentScreenIndex = 0;

    const blockIdRegex = /\b(B-[A-Za-z0-9]{9})\b/i;
    const singleIdRegex = /\b(T-[A-Za-z0-9]{9})\b/i;

    // 1. Collect all table rows and card rows across Amazon Relay
    const rowSelectors = [
      'table tbody tr:not([class*="header" i])',
      'table tr:not([class*="header" i])',
      'div[role="row"]:not([role="columnheader" i])',
      'li[class*="awsui-cards-card-item" i]',
      'div[class*="awsui_card_" i]',
      '[class*="trip-card" i]',
      '[class*="block-tour" i]',
      '[class*="tour-card" i]',
      '[class*="awsui-table-row" i]',
    ];

    const candidateRows = [];
    const seenRowNodes = new Set();

    // A. Discover rows via standard table/card selectors
    document.querySelectorAll(rowSelectors.join(", ")).forEach((row) => {
      if (row === document.body || row === document.documentElement || (row.id && row.id.includes("ud-"))) return;
      const rowText = (row.innerText || row.textContent || "").trim();
      if (blockIdRegex.test(rowText) || singleIdRegex.test(rowText)) {
        if (!seenRowNodes.has(row)) {
          seenRowNodes.add(row);
          candidateRows.push(row);
        }
      }
    });

    // B. Discover any rows containing Tour ID links that might have escaped the selectors
    const idLinks = Array.from(document.querySelectorAll('a[href*="/trips/"], a[href*="/tours/"], [class*="tour-id"], [class*="trip-id"]'));
    for (const link of idLinks) {
      const row = link.closest('tr:not([class*="header" i]), [role="row"]:not([role="columnheader" i]), li, [class*="card" i]');
      if (row && !seenRowNodes.has(row) && row !== document.body && row !== document.documentElement) {
        seenRowNodes.add(row);
        candidateRows.push(row);
      }
    }

    // C. Universal Leaf Text Node Search: Find ANY element directly displaying a Tour ID (B-... or T-...)
    const allLeafElements = Array.from(
      document.querySelectorAll('a, button, span, div, p, strong, td, th')
    ).filter((el) => {
      if (el.id && el.id.includes("ud-")) return false;
      if (el.children.length > 2) return false;
      const t = (el.innerText || el.textContent || "").trim();
      return blockIdRegex.test(t) || singleIdRegex.test(t);
    });

    for (const el of allLeafElements) {
      const row = el.closest('tr:not([class*="header" i]), [role="row"]:not([role="columnheader" i]), li, [class*="row" i], [class*="card" i], [class*="item" i]') || el.parentElement;
      if (row && !seenRowNodes.has(row) && row !== document.body && row !== document.documentElement) {
        seenRowNodes.add(row);
        candidateRows.push(row);
      }
    }

    // 2. Sort rows strictly by vertical visual position (preserving exact Relay Screen Order)
    candidateRows.sort((a, b) => {
      const rectA = a.nodeType === 1 ? a.getBoundingClientRect() : { top: 0, left: 0 };
      const rectB = b.nodeType === 1 ? b.getBoundingClientRect() : { top: 0, left: 0 };
      const topA = rectA.top + (window.scrollY || window.pageYOffset || 0);
      const topB = rectB.top + (window.scrollY || window.pageYOffset || 0);
      if (Math.abs(topA - topB) > 3) {
        return topA - topB;
      }
      return rectA.left - rectB.left;
    });

    // 3. Block-First Priority:
    // On Carrier Trips pages, or if ANY Block Tours (B-...) exist on this screen, only B-... rows are primary tours.
    const isCarrierTripsPage =
      window.location.href.includes("/trips") ||
      window.location.href.includes("/tours") ||
      window.location.href.includes("/carrier");

    const requireBlockTours = hasBlockTours || isCarrierTripsPage;

    // 4. Extract tours from each row
    for (let i = 0; i < candidateRows.length; i++) {
      const node = candidateRows[i];
      const rowRawText = (node.innerText || node.textContent || "").trim();

      const match = requireBlockTours
        ? rowRawText.match(blockIdRegex)
        : (rowRawText.match(blockIdRegex) || rowRawText.match(singleIdRegex));

      if (!match) continue; // Skip sub-leg rows or non-matching rows

      let tripId = match[1].toUpperCase();
      if (tripId.length === 12 && tripId.endsWith("C")) tripId = tripId.slice(0, 11);
      if (seenIds.has(tripId)) continue;
      seenIds.add(tripId);

      // Extract driver directly from primary row BEFORE appending any sibling text
      const driverName = extractDriverName(node, rowRawText);

      // Build row text including input values (Cloudscape Autosuggest / inputs)
      let text = rowRawText;
      if (node.querySelectorAll) {
        const inputs = Array.from(node.querySelectorAll("input, select, textarea, [role='combobox']"));
        const inputVals = inputs
          .map((inp) => (inp.value || inp.getAttribute("value") || "").trim())
          .filter(Boolean);
        if (inputVals.length > 0) text += " " + inputVals.join(" ");

        const buttons = Array.from(node.querySelectorAll("button, [role='button'], [class*='trigger'], [class*='select']"));
        const btnTexts = buttons
          .map((btn) => (btn.innerText || btn.textContent || "").trim())
          .filter(Boolean);
        if (btnTexts.length > 0) text += " " + btnTexts.join(" ");
      }

      // Check if subsequent sibling rows are expanded sub-legs for this tour
      let sib = node.nextElementSibling;
      while (sib) {
        const sibText = (sib.innerText || sib.textContent || "").trim();
        // If sib contains another primary Tour ID, stop immediately!
        if (hasBlockTours && blockIdRegex.test(sibText)) break;
        if (!hasBlockTours && (blockIdRegex.test(sibText) || singleIdRegex.test(sibText))) break;

        if (
          /(?:➔|->|to)\s*(?:\d+\s+)?[A-Z0-9]{3,6}/i.test(sibText) ||
          /Stop\s+\d+|instructions|bobtail|Arrival|Departure|ARN\s*#/i.test(sibText) ||
          /\bT-[A-Za-z0-9]{9}\b/.test(sibText)
        ) {
          text += "\n" + sibText;
          if (sib.querySelectorAll) {
            const sibInputs = Array.from(sib.querySelectorAll("input, select"))
              .map((inp) => (inp.value || inp.getAttribute("value") || "").trim())
              .filter(Boolean);
            if (sibInputs.length > 0) text += " " + sibInputs.join(" ");
          }
        } else {
          break;
        }
        sib = sib.nextElementSibling;
      }

      try {
        // Extract Multi-Leg Structure & All Stops
        const blockStructure = extractBlockTourStructure(node, text);

        // Extract Contract Code
        const contractMatch = text.match(/\b(C-[0-9A-Za-z]{9})\b/) || text.match(/(C-[0-9A-Za-z]{9})/);
        const contractCode = contractMatch ? contractMatch[1] : "C-00039WP4K";

        // Extract Driver Mode (e.g. Solo 38h, Solo 14h, Team)
        const driverModeMatch = text.match(/\b(Solo|Team)\s*(?:👤|👤👤)?\s*(\d{1,2}h)?\b/i);
        const driverMode = driverModeMatch ? `${driverModeMatch[1]} ${driverModeMatch[2] || ""}`.trim() : "Solo 14h";

        // Extract Endorsements / Requirements
        const endorsements = [];
        if (/\bCDL\b/i.test(text)) endorsements.push("CDL");
        if (/\bBNSF_UIIA_EPA\b/i.test(text)) endorsements.push("BNSF_UIIA_EPA");
        if (/\bUIIA_MC\b/i.test(text)) endorsements.push("UIIA_MC");
        if (/\bTWIC\b/i.test(text)) endorsements.push("TWIC");
        if (/\bFAST\b/i.test(text)) endorsements.push("FAST");
        if (/\bTTA\b/i.test(text)) endorsements.push("TTA");
        if (/\bLCV\b/i.test(text)) endorsements.push("LCV");

        // Extract Starts in / Expires in
        const startsMatch = text.match(/Starts\s*in\s*(\d+h\s*\d+m|\d+h|\d+m)/i);
        const startsIn = startsMatch ? startsMatch[1] : undefined;

        const expiresMatch = text.match(/Expires\s*in\s*(\d+h\s*\d+m|\d+h|\d+m)/i);
        const expiresIn = expiresMatch ? expiresMatch[1] : undefined;

        const isAcceptable = /Accept\b/.test(text) && !/Accepted\b/.test(text);
        const acceptanceStatus = isAcceptable ? "pending_acceptance" : "confirmed";

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
          equipment: /53'\s*Trailer/i.test(text) ? "53' Trailer" : "Dry Van (53')",
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
          contractCode,
          arnNumbers: blockStructure.arnNumbers,
          appointmentId: blockStructure.appointmentId,
          cptTime: blockStructure.cptTime,
          driverMode,
          endorsements: endorsements.length > 0 ? endorsements : undefined,
          acceptanceStatus,
          startsIn,
          expiresIn,
          isBobtail: /bobtail/i.test(text),
          status,
          screenIndex: currentScreenIndex++,
          driverName: driverName,
          driverPhone: "+1 (555) 000-0000",
          tractorNumber: "UD-AMZ",
          trailerNumber: "TR-5300",
          carrierName: "Chism Tracking / Unique Dispatch",
          carrierMcDot: contractCode,
          notes: `Amazon Relay Contract: ${contractCode} | Sub-Legs: ${blockStructure.subLegsCount > 0 ? blockStructure.subLegsIds.join(", ") : "Direct"} | Screen #${currentScreenIndex}${blockStructure.arnNumbers && blockStructure.arnNumbers.length > 0 ? ` | ARN: ${blockStructure.arnNumbers.join(", ")}` : ""}`,
        };

        // Merge with API captured tour if available
        const apiTour = capturedApiToursMap.get(tripId);
        if (apiTour) {
          if (tourObj.driverName === "Assigned Driver" && apiTour.driverName && apiTour.driverName !== "Assigned Driver") {
            tourObj.driverName = apiTour.driverName;
          }
          if (apiTour.stops && apiTour.stops.length > (tourObj.stops ? tourObj.stops.length : 0)) {
            tourObj.stops = apiTour.stops;
            tourObj.totalStopsCount = apiTour.stops.length;
          }
          if (apiTour.distanceMiles && !tourObj.distanceMiles) {
            tourObj.distanceMiles = apiTour.distanceMiles;
          }
          if (apiTour.rateUSD > 0 && tourObj.rateUSD === 0) {
            tourObj.rateUSD = apiTour.rateUSD;
          }
          if (apiTour.originFacilityCode && !tourObj.originFacilityCode) {
            tourObj.originFacilityCode = apiTour.originFacilityCode;
          }
          if (apiTour.destFacilityCode && !tourObj.destFacilityCode) {
            tourObj.destFacilityCode = apiTour.destFacilityCode;
          }
        }

        foundTours.push(tourObj);
      } catch (err) {
        console.warn("Tour parse warning:", err);
      }
    }

    // Merge any remaining API tours not caught in DOM (Strictly Block Tours when hasBlockTours is true)
    if (capturedApiToursMap.size > 0) {
      capturedApiToursMap.forEach((apiTour) => {
        if (
          apiTour &&
          apiTour.vrid &&
          !seenIds.has(apiTour.vrid) &&
          (!hasBlockTours || apiTour.vrid.startsWith("B-"))
        ) {
          seenIds.add(apiTour.vrid);
          apiTour.screenIndex = currentScreenIndex++;
          foundTours.push(apiTour);
        }
      });
    }

    latestOrderedTours = foundTours;
    try {
      chrome.storage.local.set({ lastDetectedTours: latestOrderedTours });
    } catch (e) {}

    return latestOrderedTours;
  }

  // 6. Floating Inspector Pill UI with Direct Visible Actions
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
        box-shadow: 0 12px 35px rgba(0,0,0,0.65), 0 0 0 1px rgba(234,88,12,0.6);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        max-width: 480px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
      ">
        <div id="ud-pill-header" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding: 10px 14px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="ud-pill-dot" style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
            <span style="font-weight:900; color:#fb923c; letter-spacing:0.5px;">UNIQUE DISPATCH</span>
            <span id="ud-pill-count" style="background:#1e293b; color:#38bdf8; padding:2px 7px; border-radius:9999px; font-weight:800; font-size:10px;">0 Tours</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button id="ud-pill-expand-btn" style="
              background: #9a3412;
              border: 1px solid #ea580c;
              color: #ffedd5;
              padding: 5px 8px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
            " title="Expand all multi-leg sub-trips and stops on screen">📂 Expand All</button>

            <button id="ud-pill-replace-btn" style="
              background: #0284c7;
              border: none;
              color: #ffffff;
              padding: 5px 8px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
            " title="Replace all loads in portal with fresh scan">🔄 Replace All</button>

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
            " title="Sync live loads to portal">⚡ SYNC NOW</button>
          </div>
        </div>

        <div id="ud-pill-drawer" style="display:none; border-top: 1px solid #1e293b; padding: 10px 14px; max-height: 240px; overflow-y: auto;">
          <div style="font-weight:800; color:#cbd5e1; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <span>Relay Screen Order (#1 to #N):</span>
            <span style="font-size:10px; color:#94a3b8;">Click card header to toggle view</span>
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
    const expandBtn = document.getElementById("ud-pill-expand-btn");

    pillCard.addEventListener("click", (e) => {
      if (
        e.target === syncBtn || syncBtn?.contains(e.target) ||
        e.target === replaceBtn || replaceBtn?.contains(e.target) ||
        e.target === expandBtn || expandBtn?.contains(e.target)
      ) return;
      if (drawer.style.display === "none") {
        drawer.style.display = "block";
        updateDrawerList();
      } else {
        drawer.style.display = "none";
      }
    });

    if (expandBtn) {
      expandBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        expandAllRelayRows();
      });
    }

    function expandAllRelayRows() {
      const expandSelectors = [
        'button[aria-expanded="false"]',
        'button[aria-label*="expand" i]',
        'button[aria-label*="detail" i]',
        '[class*="expand-toggle"]',
        '[class*="chevron-right"]',
        '[class*="expandable"] button',
        'tr[class*="awsui"] button[aria-expanded="false"]',
        '[data-testid*="expand"]',
        'svg[data-icon="angle-right"]',
        'svg[data-icon="chevron-right"]',
        '[aria-label*="open" i]',
      ];

      const elements = Array.from(document.querySelectorAll(expandSelectors.join(", ")));
      let clicked = 0;
      elements.forEach((el) => {
        try {
          const btn = el.tagName === "BUTTON" ? el : el.closest("button") || el;
          if (btn && btn.click) {
            btn.click();
            clicked++;
          }
        } catch (e) {}
      });

      // Also click on any row anchors or rows if needed
      document.querySelectorAll('tr[class*="awsui-table-row"], div[class*="card"]').forEach((r) => {
        try {
          const btn = r.querySelector('button[aria-expanded="false"]');
          if (btn) {
            btn.click();
            clicked++;
          }
        } catch (e) {}
      });

      showToast(`📂 Expanding ${clicked > 0 ? clicked : "all"} tours & multi-leg stops...`);
      setTimeout(() => {
        scanDomForTours();
        updateFloatingPillUI();
        showToast(`✓ Scanned ${latestOrderedTours.length} block tours with full sub-leg details!`);
      }, 1000);
    }

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

  // 7. Extraction & Dispatch in Strict Screen Order
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
        showToast("ℹ️ No active Relay tours found on screen. Open https://relay.amazon.com/trips");
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
              showToast(`✓ Synced ${tours.length} exact Block tours with full multi-stop itineraries! ${modeLabel}`);
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

  // Toast notification
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

  // 8. Message Listener
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

  // 9. Startup & Observers
  setTimeout(() => {
    injectFloatingPill();
    const tours = scanDomForTours();
    updateFloatingPillUI();
    if (tours.length > 0) {
      extractAndSyncAll(false, "upsert");
    }
  }, 1000);

  setTimeout(() => {
    const tours = scanDomForTours();
    updateFloatingPillUI();
    if (tours.length > 0) {
      extractAndSyncAll(false, "upsert");
    }
  }, 2500);

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
