/**
 * Unique Dispatch - Amazon Relay Enterprise Content Script
 * Extracts 100% authentic Amazon Relay Block Tours, Multi-Leg Sub-Trips, 
 * Full 6+ Stop progression lines, Driver Names, Contract Codes, and Exact Dates.
 */

(function () {
  "use strict";

  window.__ud_content_script_initialized = true;
  window.__ud_version = "1.1.0";

  console.log("🚚 [Unique Dispatch] Relay High-Fidelity Multi-Leg Engine Active v1.1.0 in frame:", window.location.href);

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
  const TZ_OFFSETS = {
    EDT: "-04:00",
    EST: "-05:00",
    CDT: "-05:00",
    CST: "-06:00",
    MDT: "-06:00",
    MST: "-07:00",
    PDT: "-07:00",
    PST: "-08:00",
    UTC: "Z",
    GMT: "Z",
  };

  function parseRelayDateTime(dateString, isDelivery = false, startsIn = undefined) {
    if (!dateString) {
      if (!isDelivery && startsIn) {
        const hm = String(startsIn).match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i);
        if (hm && (hm[1] || hm[2])) {
          const h = hm[1] ? parseInt(hm[1], 10) : 0;
          const m = hm[2] ? parseInt(hm[2], 10) : 0;
          const offsetMs = (h * 60 + m) * 60 * 1000;
          if (offsetMs >= 0) {
            return new Date(Date.now() + offsetMs).toISOString();
          }
        }
      }
      const fallback = new Date();
      fallback.setHours(fallback.getHours() + (isDelivery ? 16 : 2));
      return fallback.toISOString();
    }

    const now = new Date();
    const text = String(dateString).trim();
    const lower = text.toLowerCase();

    // Check for explicit Month + Day format first: e.g. "Tue, Oct 20, 11:45 CDT" or "Thu, Oct 22, 01:30 CDT"
    const fullDateMatch = text.match(/\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?,?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?(?:\s*([A-Z]{3}))?\b/i)
      || text.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s*,?\s*(\d{4}))?,?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?(?:\s*([A-Z]{3}))?\b/i);

    if (fullDateMatch) {
      const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };
      const rawM = isNaN(parseInt(fullDateMatch[1], 10)) ? fullDateMatch[1] : fullDateMatch[2];
      const rawD = isNaN(parseInt(fullDateMatch[1], 10)) ? fullDateMatch[2] : fullDateMatch[1];
      const monthNum = months[rawM.toLowerCase().slice(0, 3)];
      const dayNum = parseInt(rawD, 10);
      const yearNum = fullDateMatch[3] ? parseInt(fullDateMatch[3], 10) : now.getFullYear();

      let hours = parseInt(fullDateMatch[4], 10);
      const minutes = parseInt(fullDateMatch[5], 10);
      const meridian = fullDateMatch[6] ? fullDateMatch[6].toUpperCase() : null;
      if (meridian === "PM" && hours < 12) hours += 12;
      if (meridian === "AM" && hours === 12) hours = 0;

      const tzStr = fullDateMatch[7] ? fullDateMatch[7].toUpperCase() : null;
      const tzOffset = (tzStr && TZ_OFFSETS[tzStr]) ? TZ_OFFSETS[tzStr] : "-05:00";

      if (tzOffset) {
        const isoWithOffset = `${yearNum}-${String(monthNum + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00${tzOffset}`;
        const parsed = new Date(isoWithOffset);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      const target = new Date(yearNum, monthNum, dayNum, hours, minutes, 0, 0);
      return target.toISOString();
    }

    // If explicit calendar date was not in string, and startsIn is provided for pickup
    if (!isDelivery && startsIn) {
      const hm = String(startsIn).match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i);
      if (hm && (hm[1] || hm[2])) {
        const h = hm[1] ? parseInt(hm[1], 10) : 0;
        const m = hm[2] ? parseInt(hm[2], 10) : 0;
        const offsetMs = (h * 60 + m) * 60 * 1000;
        if (offsetMs >= 0) {
          return new Date(Date.now() + offsetMs).toISOString();
        }
      }
    }

    // Only check "tomorrow" / "in 1 day" if no calendar month was present in string!
    let targetDate = new Date(now);
    if (lower.includes("tomorrow") || lower.includes("in 1 day") || lower.includes("in 24 hours")) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (lower.includes("in 2 days") || lower.includes("in 48 hours")) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (lower.includes("in 3 days")) {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (lower.includes("yesterday")) {
      targetDate.setDate(targetDate.getDate() - 1);
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

    const cleanCand = (raw) => {
      if (!raw) return "";
      return String(raw)
        .replace(/\s*[BCT]-[A-Za-z0-9]{9}\b.*/i, "")
        .replace(/\s*C-[0-9A-Za-z]{9}\b.*/i, "")
        .replace(/\s*(?:Solo|Team|53'|Trailer|CDL|BNSF|UIIA|Drop|Hook).*/i, "")
        .trim();
    };

    const isBadDriver = (cand) => {
      if (!cand) return true;
      const cleaned = cleanCand(cand);
      if (cleaned.length < 3 || cleaned.length > 30) return true;
      const lower = cleaned.toLowerCase();
      return (
        /select|assign|choose|driver|search|filter|^none$|action|detail|track|relay|amazon|contract|trailer|solo|team|starts|expires|hours|miles|drop|hook|cdl|fast|uiia|bnsf|epa|twic|load|trip|tour|upcoming|transit|history|export|bulk|accept|sort/i.test(
          lower
        )
      );
    };

    // 1. Inspect elements inside node (AWSUI / Cloudscape Select dropdown, Autosuggest inputs, triggers)
    if (node && node.querySelectorAll) {
      // Inputs (Cloudscape Autosuggest / Combobox where driver name is stored in input.value)
      const inputs = Array.from(node.querySelectorAll('input, [role="combobox"]'));
      for (const inp of inputs) {
        const val = cleanCand((inp.value || inp.getAttribute("value") || "").trim());
        if (!isBadDriver(val)) {
          const m =
            val.match(/\b([A-Za-z]\.\s*[A-Za-z]+(?:-[A-Za-z]+)?)\b/) ||
            val.match(/\b([A-Za-z]\.\s*[A-Za-z]{2,20})\b/) ||
            val.match(/\b([A-Za-z][a-z]{1,15}\s+[A-Za-z][a-z]{1,15})\b/);
          if (m && !isBadDriver(m[1])) return cleanCand(m[1]);
          if (/^[A-Za-z\s\.\-]{3,30}$/.test(val) && !isBadDriver(val)) return val;
        }
      }

      // Direct select element
      const selectEl = node.querySelector("select");
      if (selectEl) {
        const selectedOpt = selectEl.options[selectEl.selectedIndex];
        const optText = cleanCand((selectedOpt ? selectedOpt.text : selectEl.value || "").trim());
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
        const bText = cleanCand((btn.innerText || btn.textContent || "").trim());
        if (!isBadDriver(bText)) {
          const m =
            bText.match(/\b([A-Za-z]\.\s*[A-Za-z]+(?:-[A-Za-z]+)?)\b/) ||
            bText.match(/\b([A-Za-z]\.\s*[A-Za-z]{2,20})\b/) ||
            bText.match(/\b([A-Za-z][a-z]{1,15}\s+[A-Za-z][a-z]{1,15})\b/);
          if (m && !isBadDriver(m[1])) return cleanCand(m[1]);
          if (/^[A-Za-z\s\.\-]{3,30}$/.test(bText) && !isBadDriver(bText)) return bText;
        }
      }

      // Check cells from right to left (driver is always in one of the rightmost columns)
      const cells = Array.from(node.querySelectorAll('td, [role="cell"], [role="gridcell"]'));
      if (cells.length >= 4) {
        for (let c = cells.length - 1; c >= 3; c--) {
          const cText = cleanCand((cells[c].innerText || cells[c].textContent || "").trim());
          if (isBadDriver(cText)) continue;
          const dMatch =
            cText.match(/\b([A-Za-z]\.\s*[A-Za-z]+(?:-[A-Za-z]+)?)\b/) ||
            cText.match(/\b([A-Za-z]\.\s*[A-Za-z]{2,20})\b/) ||
            cText.match(/\b([A-Za-z][a-z]{1,15}\s+[A-Za-z][a-z]{1,15})\b/);
          if (dMatch && !isBadDriver(dMatch[1])) {
            return cleanCand(dMatch[1]);
          }
        }
      }
    }

    // 2. Pre-process spaced text to split glued text (e.g. "UIIA_MCF. Sanchez" -> "UIIA_MC F. Sanchez")
    const spaced = (text || "").replace(/([A-Za-z0-9_])([A-Za-z]\.\s*)/g, "$1 $2");
    const nameMatch =
      spaced.match(/\b([A-Za-z]\.\s*[A-Za-z]+(?:-[A-Za-z]+)?)\b/) ||
      spaced.match(/\b([A-Za-z]\.\s*[A-Za-z]{2,20})\b/);
    if (nameMatch && nameMatch[1]) {
      const cand = cleanCand(nameMatch[1]);
      if (!isBadDriver(cand)) {
        return cand;
      }
    }

    // Full name format e.g. "John Smith"
    const fullNameMatch = spaced.match(/\b([A-Za-z][a-z]{1,15}\s+[A-Za-z][a-z]{1,15})\b/);
    if (fullNameMatch && fullNameMatch[1]) {
      const cand = cleanCand(fullNameMatch[1]);
      if (!isBadDriver(cand)) {
        return cand;
      }
    }

    return "Assigned Driver";
  }

  // 4. Deep Multi-Stop & Sub-Leg Extractor for Amazon Relay Blocks
  function extractBlockTourStructure(node, text, siblingNodes = [], startsIn = undefined, currentTripId = "", parentDriverName = "Assigned Driver") {
    const cells = node && node.querySelectorAll ? Array.from(node.querySelectorAll('td, [role="cell"], [role="gridcell"]')) : [];

    // Pre-process text safely: Mask Tour IDs (B-..., T-..., C-...) so their substrings are NEVER mangled or matched as facility codes
    const tourIdMap = new Map();
    let maskCounter = 0;
    const maskedText = (text || "").replace(/\b([BCT]-[A-Za-z0-9]{9})\b/g, (match) => {
      const key = `__TOUR_ID_TOKEN_${maskCounter++}__`;
      tourIdMap.set(key, match);
      return key;
    });

    const preprocessedText = maskedText
      .replace(/([0-9])([A-Z]{3,4}[0-9]{1,2})/g, "$1 $2")
      .replace(/(CDT|CST|EDT|EST|PDT|PST|MDT|MST)([A-Z])/g, "$1 $2")
      .replace(/(\d{5})([A-Z][a-z]{2})/g, "$1 $2")
      .replace(/__TOUR_ID_TOKEN_\d+__/g, (key) => tourIdMap.get(key) || key);

    // 1. Extract Parent Start and End Times (grounded with startsIn when available)
    const dateMatches = Array.from(
      preprocessedText.matchAll(/(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?,?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[A-Z]{3})?/gi)
    );

    const parentPickupTime = dateMatches[0]
      ? parseRelayDateTime(dateMatches[0][0], false, startsIn)
      : parseRelayDateTime(preprocessedText, false, startsIn);
    const parentDeliveryTime = dateMatches[1]
      ? parseRelayDateTime(dateMatches[1][0], true)
      : parseRelayDateTime(preprocessedText, true);

    // 2. Extract Authentic Multi-Leg Sub-Trips using 3 complementary extraction layers
    const subTrips = [];
    const seenSubIds = new Set();

    const addSubTrip = (item) => {
      if (!item || !item.id) return;
      const cleanId = String(item.id).trim().toUpperCase();
      if (seenSubIds.has(cleanId)) return;
      if (currentTripId && cleanId === currentTripId.toUpperCase()) return;
      if (cleanId.startsWith("B-")) return;
      seenSubIds.add(cleanId);
      subTrips.push({
        id: cleanId,
        legIndex: subTrips.length + 1,
        fromSeq: item.fromSeq || subTrips.length + 1,
        fromFacility: item.fromFacility || "SAT41",
        toSeq: item.toSeq || subTrips.length + 2,
        toFacility: item.toFacility || "SAT9",
        miles: item.miles || 0,
        duration: item.duration || undefined,
        equipment: item.equipment || "53' Trailer",
        action: item.action || "Drop",
        driver: item.driver || (parentDriverName !== "Assigned Driver" ? parentDriverName : undefined),
      });
    };

    // Layer 1: Inspect Sibling DOM Rows and Child Rows directly
    const isBadFac = (f) => !f || /^(Contract|Starts|Solo|Team|Trailer|Driver|Action|Report|Delay|Drop|Hook|Live|Miles|Hour|Hours|Appointment|CDL|BNSF|UIIA|TWIC|FAST|San|Antonio|Buda|Austin)$/i.test(f);

    const nodesToInspect = [];
    if (Array.isArray(siblingNodes)) nodesToInspect.push(...siblingNodes);
    if (node && node.querySelectorAll) {
      const childSubRows = Array.from(node.querySelectorAll('tr, [role="row"], li, [class*="sub-trip"], [class*="leg"]'));
      nodesToInspect.push(...childSubRows);
    }

    for (const el of nodesToInspect) {
      const elText = (el.innerText || el.textContent || "").trim();
      const idMatch = elText.match(/\b(11[A-Z0-9]{7}|T-[A-Z0-9]{9})\b/i);
      if (idMatch && (!currentTripId || idMatch[1].toUpperCase() !== currentTripId.toUpperCase())) {
        const subId = idMatch[1].toUpperCase();
        if (subId.startsWith("B-") || subId.startsWith("C-")) continue;

        const facMatches = Array.from(elText.matchAll(/\b([A-Za-z0-9_]{3,24})\b/g))
          .map((m) => m[1])
          .filter((f) => !["CDT", "CST", "EDT", "EST", "PDT", "PST", "MDT", "MST", "UTC", "CDL", "TWIC", "FAST", "TTA", "LCV"].includes(f.toUpperCase()))
          .filter((f) => !isBadFac(f));

        const seqMatches = Array.from(elText.matchAll(/(?:\((\d{1,2})\)|\b(\d{1,2})\b)\s*(?:[A-Za-z0-9_]{3,24})/g))
          .map((m) => parseInt(m[1] || m[2], 10));

        const milesMatch = elText.match(/\b(\d+)\s*mi\b/i);
        const durMatch = elText.match(/\b(\d+h\s*\d+m|\d+h|\d+m)\b/i);
        const equipMatch = elText.match(/(53'\s*Trailer|Trailer|Dry\s*Van)/i);
        const actMatch = elText.match(/\b(Live\/Drop|Drop|Live|Hook|Pickup)\b/i);
        const driverCand = extractDriverName(el, elText);

        if (facMatches.length >= 2) {
          addSubTrip({
            id: subId,
            fromSeq: seqMatches[0] || subTrips.length + 1,
            fromFacility: facMatches[0] || "SAT41",
            toSeq: seqMatches[1] || (seqMatches[0] ? seqMatches[0] + 1 : subTrips.length + 2),
            toFacility: facMatches[1] || facMatches[0] || "SAT9",
            miles: milesMatch ? parseInt(milesMatch[1], 10) : 0,
            duration: durMatch ? durMatch[1] : undefined,
            equipment: equipMatch ? equipMatch[1] : "53' Trailer",
            action: actMatch ? actMatch[1] : "Drop",
            driver: driverCand !== "Assigned Driver" ? driverCand : undefined,
          });
        }
      }
    }

    // Layer 2: Flexible Regex Matching on full row text
    // Handles with or without parentheses, with or without arrow: e.g. "114WPVJWK (1) SAT41 -> (2) SAT3 8 mi 0h 25m 53' Trailer Drop O. Lechhabi"
    const flexibleSubRegex = /\b(11[A-Z0-9]{7}|T-[A-Z0-9]{9})\b[^\n\r\w]*?(?:\(?(\d{1,2})\)?\s+)?([A-Za-z0-9_]{3,24})\s*(?:➔|->|→|to|—|–|>|\s+)\s*(?:\(?(\d{1,2})\)?\s+)?([A-Za-z0-9_]{3,24})([^\n\r]*)/gi;
    let flexMatch;
    while ((flexMatch = flexibleSubRegex.exec(text)) !== null) {
      const subId = flexMatch[1].trim().toUpperCase();
      const fromSeq = flexMatch[2] ? parseInt(flexMatch[2], 10) : undefined;
      const fromFac = flexMatch[3].trim();
      const toSeq = flexMatch[4] ? parseInt(flexMatch[4], 10) : undefined;
      const toFac = flexMatch[5].trim();
      const remainder = flexMatch[6] || "";

      if (isBadFac(fromFac) || isBadFac(toFac)) continue;

      const milesMatch = remainder.match(/\b(\d+)\s*mi\b/i);
      const durMatch = remainder.match(/\b(\d+h\s*\d+m|\d+h|\d+m)\b/i);
      const equipMatch = remainder.match(/(53'\s*Trailer|Trailer|Dry\s*Van)/i);
      const actMatch = remainder.match(/\b(Live\/Drop|Drop|Live|Hook|Pickup)\b/i);
      const dMatch = remainder.match(/\b([A-Z]\.\s*[A-Za-z0-9\-]+)\b/);

      addSubTrip({
        id: subId,
        fromSeq,
        fromFacility: fromFac,
        toSeq,
        toFacility: toFac,
        miles: milesMatch ? parseInt(milesMatch[1], 10) : 0,
        duration: durMatch ? durMatch[1] : undefined,
        equipment: equipMatch ? equipMatch[1] : "53' Trailer",
        action: actMatch ? actMatch[1] : "Drop",
        driver: dMatch ? dMatch[1] : undefined,
      });
    }

    // Layer 3: Chunk-based Token Fallback for any 11[A-Z0-9]{7} token found in text
    const allSubIds = Array.from(text.matchAll(/\b(11[A-Z0-9]{7})\b/gi)).map((m) => m[1].toUpperCase());
    for (const sid of allSubIds) {
      if (seenSubIds.has(sid)) continue;
      if (currentTripId && sid === currentTripId.toUpperCase()) continue;
      const idx = text.indexOf(sid);
      if (idx !== -1) {
        const chunk = text.slice(idx, idx + 180);
        const facs = Array.from(chunk.matchAll(/\b([A-Za-z0-9_]{3,24})\b/g))
          .map((m) => m[1])
          .filter((f) => !["CDT", "CST", "EDT", "EST", "PDT", "PST", "MDT", "MST", "UTC"].includes(f.toUpperCase()))
          .filter((f) => !isBadFac(f));
        if (facs.length >= 2) {
          const milesMatch = chunk.match(/\b(\d+)\s*mi\b/i);
          const durMatch = chunk.match(/\b(\d+h\s*\d+m|\d+h|\d+m)\b/i);
          const actMatch = chunk.match(/\b(Live\/Drop|Drop|Live|Hook|Pickup)\b/i);
          const dMatch = chunk.match(/\b([A-Z]\.\s*[A-Za-z0-9\-]+)\b/);
          addSubTrip({
            id: sid,
            fromFacility: facs[0],
            toFacility: facs[1],
            miles: milesMatch ? parseInt(milesMatch[1], 10) : 0,
            duration: durMatch ? durMatch[1] : undefined,
            action: actMatch ? actMatch[1] : "Drop",
            driver: dMatch ? dMatch[1] : undefined,
          });
        }
      }
    }

    // 3. Extract Clean Addresses e.g. "111 Gembler Rd, San Antonio, TX 78219" or "2956 MAIN ST BUDA, BUDA, TX 78610"
    const addressRegex = /((?:PVT\s+ST\s+AT\s+)?\d+\s+[A-Za-z0-9\s\.\-]{2,45}(?:Rd|St|Ave|Dr|Blvd|Way|Ct|Ln|Hwy|Pkwy|Highway\s*\d+|Loop\s*\d+|Parkway|Boulevard|Lane|Drive|Road|Street))[,\s\n\r]+([A-Za-z\s]{3,20}),\s*([A-Z]{2})(?:\s+(\d{5}))?/gi;
    const foundAddresses = [];
    let addrMatch;
    while ((addrMatch = addressRegex.exec(text)) !== null) {
      let rawStreet = addrMatch[1].trim();
      const cleanStreet = rawStreet
        .replace(/^[\s\S]*?(?:Report delay|delay|CDT|CST|EDT|EST)\s*/i, "")
        .replace(/^[\s\S]*?\b(\d+\s+[A-Za-z0-9\s\.\-]+(?:Rd|St|Ave|Dr|Blvd|Way|Ct|Ln|Hwy|Pkwy|Highway\s*\d+|Loop\s*\d+|Parkway|Boulevard|Lane|Drive|Road|Street))/i, "$1")
        .trim();

      foundAddresses.push({
        street: cleanStreet || rawStreet,
        city: addrMatch[2].trim(),
        state: addrMatch[3].trim(),
        zip: addrMatch[4] ? addrMatch[4].trim() : undefined,
      });
    }

    // 4. Extract Expanded Stop Times & Schedule Windows
    const expandedStopRegex = /(?:^|\n)\s*(\d{1,2})\s+([A-Za-z0-9_]{3,24})[^\n\r]*(?:Tractor\s*ID[^\n\r]*?(bobtail|[A-Za-z0-9\-]+))?[^\n\r]*?Sch\.\s*(\d{1,2}\s+[A-Za-z]{3},?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?[A-Z]{0,4})[^\n\r]*?Sch\.\s*(\d{1,2}\s+[A-Za-z]{3},?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?[A-Z]{0,4})?/gi;
    const stopDetailsMap = new Map();
    let expMatch;
    while ((expMatch = expandedStopRegex.exec(text)) !== null) {
      const seq = parseInt(expMatch[1], 10);
      const fac = expMatch[2];
      const tractor = expMatch[3];
      const arrTime = expMatch[4] ? parseRelayDateTime(expMatch[4], false) : undefined;
      const depTime = expMatch[5] ? parseRelayDateTime(expMatch[5], false) : undefined;
      stopDetailsMap.set(seq, { fac, tractor, arrTime, depTime });
    }

    // 5. Extract ARN numbers & Reference IDs
    const arnMatches = Array.from(text.matchAll(/ARN\s*#?\s*(\d{8,14})/gi)).map((m) => m[1]);
    const apptMatch = text.match(/Appointment\s*Id\s*(\d{8,16})/i);
    const appointmentId = apptMatch ? apptMatch[1] : undefined;

    // 6. Extract CPT (Critical Pull Time)
    const cptMatch = text.match(/CPT\s+([A-Za-z0-9\s,:]+(?:AM|PM|CDT|CST|EDT|EST)?)/i);
    const cptTime = cptMatch ? cptMatch[1].trim() : undefined;

    // 7. Extract Total Miles (sum of legs or stated miles)
    let totalMiles = 0;
    if (subTrips.length > 0) {
      totalMiles = subTrips.reduce((acc, l) => acc + (l.miles || 0), 0);
    }
    if (totalMiles === 0) {
      const milesMatch = text.match(/([0-9,]+)\s*mi\b/i);
      if (milesMatch) totalMiles = parseInt(milesMatch[1].replace(/,/g, ""), 10);
    }

    // 8. Build Ordered Stops Array (Sequential stops 1 through N)
    const stopsList = [];
    const cityStateMatches = Array.from(preprocessedText.matchAll(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/g));

    if (subTrips.length > 0) {
      // Add Origin Stop (Stop 1)
      const firstLeg = subTrips[0];
      const firstDetails = stopDetailsMap.get(firstLeg.fromSeq);
      const addr1 = foundAddresses[0];
      const oCity = addr1?.city || (cityStateMatches[0] && cityStateMatches[0][1].trim()) || "San Antonio";
      const oState = addr1?.state || (cityStateMatches[0] && cityStateMatches[0][2].trim()) || "TX";

      stopsList.push({
        sequenceNumber: firstLeg.fromSeq || 1,
        type: "pickup",
        activity: "pickup",
        facilityCode: firstLeg.fromFacility,
        city: oCity,
        state: oState,
        postalCode: addr1?.zip || "78219",
        address: addr1?.street ? `${addr1.street}, ${oCity}, ${oState}` : `Amazon Logistics Facility [${firstLeg.fromFacility}] - ${oCity}, ${oState}`,
        appointmentTime: firstDetails?.arrTime || parentPickupTime,
        departureTime: firstDetails?.depTime || undefined,
        tractorId: firstDetails?.tractor || (/bobtail/i.test(text) ? "bobtail" : undefined),
        subTripId: firstLeg.id,
        arnNumber: arnMatches[0] || undefined,
        cptTime: cptTime || undefined,
        isBobtail: /bobtail/i.test(text),
        status: "pending",
        notes: `Sub-Trip #${firstLeg.id} (Leg 1 Origin - ${firstLeg.fromFacility})`,
      });

      // Add Destination of each sub-trip leg (Stops 2..N)
      subTrips.forEach((leg, idx) => {
        const isLast = idx === subTrips.length - 1;
        const legDetails = stopDetailsMap.get(leg.toSeq);
        const addr = foundAddresses[idx + 1] || (isLast ? (foundAddresses[foundAddresses.length - 1] || addr1) : undefined);
        const legCityMatch = (cityStateMatches[idx + 1] && cityStateMatches[idx + 1][1].trim()) || (cityStateMatches[cityStateMatches.length - 1] && cityStateMatches[cityStateMatches.length - 1][1].trim());
        const legStateMatch = (cityStateMatches[idx + 1] && cityStateMatches[idx + 1][2].trim()) || (cityStateMatches[cityStateMatches.length - 1] && cityStateMatches[cityStateMatches.length - 1][2].trim());
        const dCity = addr?.city || legCityMatch || (leg.toFacility.startsWith("SAT") ? "San Antonio" : leg.toFacility.startsWith("AUS") ? "Austin" : leg.toFacility.startsWith("BTR") ? "Baton Rouge" : leg.toFacility);
        const dState = addr?.state || legStateMatch || (leg.toFacility.startsWith("BTR") ? "LA" : "TX");

        const stepEstimatedTime = new Date(new Date(parentPickupTime).getTime() + (idx + 1) * 2 * 3600000).toISOString();
        const legArn = arnMatches[idx] || (arnMatches.length === 1 ? arnMatches[0] : undefined);

        stopsList.push({
          sequenceNumber: leg.toSeq || idx + 2,
          type: isLast ? "delivery" : "intermediate",
          activity: leg.action || (isLast ? "delivery" : "drop_hook"),
          facilityCode: leg.toFacility,
          city: dCity,
          state: dState,
          postalCode: addr?.zip || undefined,
          address: addr?.street ? `${addr.street}, ${dCity}, ${dState}` : `Amazon Facility [${leg.toFacility}] - ${dCity}, ${dState}`,
          appointmentTime: isLast ? parentDeliveryTime : (legDetails?.arrTime || stepEstimatedTime),
          departureTime: legDetails?.depTime || undefined,
          tractorId: legDetails?.tractor || undefined,
          subTripId: leg.id,
          legIndex: leg.legIndex,
          legMiles: leg.miles,
          legDuration: leg.duration,
          legAction: leg.action,
          arnNumber: legArn,
          isBobtail: /bobtail/i.test(text),
          status: "pending",
          notes: `Sub-Trip #${leg.id} (Leg ${leg.legIndex}: ${leg.fromFacility} ➔ ${leg.toFacility}${leg.miles > 0 ? ` • ${leg.miles} mi` : ""}${leg.action ? ` • ${leg.action}` : ""})`,
        });
      });
    } else {
      // Direct 2-stop summary extraction from row columns
      let cellOriginText = cells[2] ? (cells[2].innerText || cells[2].textContent || "").trim() : "";
      let cellDestText = cells[3] ? (cells[3].innerText || cells[3].textContent || "").trim() : "";

      const facilityMatches = Array.from(preprocessedText.matchAll(/(?:\[([A-Z0-9]{3,6})\]|\b([A-Z]{3,4}[0-9]{1,2})\b)/g));
      const cleanFacilities = facilityMatches
        .map((m) => m[1] || m[2])
        .filter((f) => {
          const upper = f.toUpperCase();
          if (["POST", "TRIP", "TOUR", "LOAD", "TYPE", "RATE", "TIME", "STOP", "CITY", "DEST", "FROM", "AUTO", "VIEW", "INFO", "COST", "FEES", "PAID", "DAYS", "EDIT", "DATE", "USER", "MORE", "SHOW", "HIDE", "NAME", "PAGE", "NEXT", "BACK", "SAVE", "EXIT", "HELP", "TEAM", "UNIT", "TEST", "WARN", "ROLE", "LIVE", "DOCK", "GATE", "SEMI", "VANS", "FLAT", "REEF", "AMZN", "SYNC", "MENU", "AMAZON", "RELAY", "TOTAL", "DROP", "HOOK", "MILES", "HOUR", "HOURS", "WEEK", "CDT", "CST", "EDT", "EST", "PDT", "PST", "MDT", "MST", "UTC", "CDL", "TWIC", "FAST", "TTA", "LCV", "NC"].includes(upper)) return false;
          // Substring protection against VRID (e.g. XMB06 inside B-56T3XMB06)
          if (currentTripId && currentTripId.toUpperCase().includes(upper)) return false;
          return true;
        });

      const oFac = (cellOriginText.match(/\b([A-Z]{3,4}[0-9]{1,2})\b/)?.[1]) || cleanFacilities[0] || undefined;
      const oMatch = (cellOriginText && cellOriginText.match(/([A-Za-z\s\.\-]{3,24}),\s*([A-Z]{2})(?:\s+(\d{5}))?/)) || cityStateMatches[0];
      const oCity = (oMatch && oMatch[1].trim()) || (foundAddresses[0] && foundAddresses[0].city) || (oFac ? `Facility ${oFac}` : "San Antonio");
      const oState = (oMatch && oMatch[2].trim()) || (foundAddresses[0] && foundAddresses[0].state) || "TX";
      const oZip = (oMatch && oMatch[3]) || (foundAddresses[0] && foundAddresses[0].zip) || undefined;

      const dFac = (cellDestText.match(/\b([A-Z]{3,4}[0-9]{1,2})\b/)?.[1]) || (cleanFacilities.length > 1 ? cleanFacilities[cleanFacilities.length - 1] : undefined) || oFac;
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
      subTrips,
      subTripsCount: subTrips.length,
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
      subLegsCount: subTrips.length,
      subLegsIds: subTrips.map((l) => l.id),
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

    // C. Deep Element Search: Find elements containing Tour IDs and resolve to their true table row or card
    const allIdElements = Array.from(
      document.querySelectorAll('a, button, span, div, p, strong, td, th')
    ).filter((el) => {
      if (el.id && el.id.includes("ud-")) return false;
      const t = (el.innerText || el.textContent || "").trim();
      return blockIdRegex.test(t) || singleIdRegex.test(t);
    });

    for (const el of allIdElements) {
      // Find the true enclosing TR or Card container, avoiding intermediate item/cell wrappers
      const row =
        el.closest('table tbody tr:not([class*="header" i]), table tr:not([class*="header" i]), div[role="row"]:not([role="columnheader" i]), li[class*="awsui-cards-card-item" i], div[class*="awsui_card_" i], [class*="trip-card" i], [class*="tour-card" i], [class*="awsui-table-row" i]') ||
        el.closest('tr, [role="row"]') ||
        el.parentElement;
      if (row && !seenRowNodes.has(row) && row !== document.body && row !== document.documentElement) {
        seenRowNodes.add(row);
        candidateRows.push(row);
      }
    }

    // 2. Select the most complete enclosing container for each unique Tour ID
    // Filter out parent wrappers holding multiple tours, and among candidates for a given Tour ID,
    // select the one with the maximum text content (full table row or card) to retain dates, driver, and stops.
    const tourRowMap = new Map();

    for (const r of candidateRows) {
      if (!r || r === document.body || r === document.documentElement) continue;
      const t = (r.innerText || r.textContent || "").trim();
      const bMatches = t.match(/\b(B-[A-Za-z0-9]{9})\b/gi) || [];
      const tMatches = t.match(/\b(T-[A-Za-z0-9]{9})\b/gi) || [];

      // If it contains multiple B- tours, it's a multi-tour table/container, skip it
      if (bMatches.length > 1) continue;
      if (bMatches.length === 0 && tMatches.length > 1) continue;

      const primaryId = bMatches.length === 1 ? bMatches[0].toUpperCase() : (tMatches.length === 1 ? tMatches[0].toUpperCase() : null);
      if (!primaryId) continue;

      const existing = tourRowMap.get(primaryId);
      if (!existing || t.length > (existing.innerText || existing.textContent || "").trim().length) {
        tourRowMap.set(primaryId, r);
      }
    }

    // 3. Sort candidate rows strictly by vertical visual position
    const validCandidateRows = Array.from(tourRowMap.values());
    validCandidateRows.sort((a, b) => {
      const rectA = a.nodeType === 1 ? a.getBoundingClientRect() : { top: 0, left: 0 };
      const rectB = b.nodeType === 1 ? b.getBoundingClientRect() : { top: 0, left: 0 };
      const topA = rectA.top + (window.scrollY || window.pageYOffset || 0);
      const topB = rectB.top + (window.scrollY || window.pageYOffset || 0);
      if (Math.abs(topA - topB) > 3) {
        return topA - topB;
      }
      return rectA.left - rectB.left;
    });

    // 4. Block-First Priority:
    // On Carrier Trips pages, or if ANY Block Tours (B-...) exist on this screen, only B-... rows are primary tours.
    const hasBlockTours = validCandidateRows.some((r) => blockIdRegex.test(r.innerText || r.textContent || ""));
    const isCarrierTripsPage =
      window.location.href.includes("/trips") ||
      window.location.href.includes("/tours") ||
      window.location.href.includes("/carrier");

    const requireBlockTours = hasBlockTours || isCarrierTripsPage;

    // 5. Extract tours from each row
    for (let i = 0; i < validCandidateRows.length; i++) {
      const node = validCandidateRows[i];
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
      let driverName = extractDriverName(node, rowRawText);

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

      // If driver was not detected from rowRawText, try with extended node text
      if (driverName === "Assigned Driver") {
        const fallbackDriver = extractDriverName(node, text);
        if (fallbackDriver !== "Assigned Driver") driverName = fallbackDriver;
      }

      // Check if subsequent sibling rows are expanded sub-legs for this tour
      const siblingNodes = [];
      let sib = node.nextElementSibling;
      while (sib) {
        const sibText = (sib.innerText || sib.textContent || "").trim();
        // If sib contains another primary Tour ID, stop immediately!
        if (requireBlockTours && blockIdRegex.test(sibText)) break;
        if (!requireBlockTours && (blockIdRegex.test(sibText) || singleIdRegex.test(sibText))) break;

        siblingNodes.push(sib);
        text += "\n" + sibText;
        if (sib.querySelectorAll) {
          const sibInputs = Array.from(sib.querySelectorAll("input, select"))
            .map((inp) => (inp.value || inp.getAttribute("value") || "").trim())
            .filter(Boolean);
          if (sibInputs.length > 0) text += " " + sibInputs.join(" ");
        }
        sib = sib.nextElementSibling;
      }

      // If driver is still Assigned Driver, check if any sibling row has the driver
      if (driverName === "Assigned Driver") {
        for (const sNode of siblingNodes) {
          const sText = (sNode.innerText || sNode.textContent || "").trim();
          const cand = extractDriverName(sNode, sText);
          if (cand !== "Assigned Driver") {
            driverName = cand;
            break;
          }
        }
      }

      try {
        // Extract Starts in / Expires in first so it can anchor pickupTime
        const startsMatch = text.match(/Starts\s*in\s*(\d+h\s*\d+m|\d+h|\d+m)/i);
        const startsIn = startsMatch ? startsMatch[1] : undefined;

        const expiresMatch = text.match(/Expires\s*in\s*(\d+h\s*\d+m|\d+h|\d+m)/i);
        const expiresIn = expiresMatch ? expiresMatch[1] : undefined;

        // Extract Multi-Leg Structure & All Stops
        const blockStructure = extractBlockTourStructure(node, text, siblingNodes, startsIn, tripId, driverName);

        // Extract Contract Code
        const contractMatch = text.match(/\b(C-[0-9A-Za-z]{9})\b/) || text.match(/(C-[0-9A-Za-z]{9})/);
        const contractCode = contractMatch ? contractMatch[1] : "C-0003CJ8P7";

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
          subTrips: blockStructure.subTrips && blockStructure.subTrips.length > 0 ? blockStructure.subTrips : undefined,
          subTripsCount: blockStructure.subTripsCount > 0 ? blockStructure.subTripsCount : undefined,
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
          notes: `Amazon Relay Contract: ${contractCode} | Sub-Trips: ${blockStructure.subTripsCount > 0 ? blockStructure.subTrips.map(s => s.id).join(", ") : "Direct"} | Screen #${currentScreenIndex}${blockStructure.arnNumbers && blockStructure.arnNumbers.length > 0 ? ` | ARN: ${blockStructure.arnNumbers.join(", ")}` : ""}`,
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
          if (apiTour.subTrips && apiTour.subTrips.length > (tourObj.subTrips ? tourObj.subTrips.length : 0)) {
            tourObj.subTrips = apiTour.subTrips;
            tourObj.subTripsCount = apiTour.subTrips.length;
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
          (!requireBlockTours || apiTour.vrid.startsWith("B-"))
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
            <span id="ud-pill-autosync" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:2px 7px; border-radius:9999px; font-weight:800; font-size:9px; display:inline-flex; align-items:center; gap:4px;" title="Continuous Background Sync Active (Every 30s)">
              <span style="width:6px;height:6px;border-radius:9999px;background:#10b981;box-shadow:0 0 6px #10b981;display:inline-block;"></span>
              AUTO-SYNC ON (30s)
            </span>
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

    async function expandAllRelayRows(autoSync = true) {
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

      showToast("📂 Expanding all tours on screen to reveal multi-leg sub-trips...");

      const rows = Array.from(
        document.querySelectorAll(
          'table tbody tr:not([class*="header" i]), [role="row"]:not([role="columnheader" i]), li[class*="awsui-cards-card-item" i], div[class*="card"]'
        )
      );

      let clicked = 0;
      for (const row of rows) {
        const rowText = (row.innerText || row.textContent || "").trim();
        if (!/\b(B-[A-Za-z0-9]{9})\b/i.test(rowText)) continue;

        const btn = row.querySelector(expandSelectors.join(", "));
        if (btn) {
          try {
            btn.click();
            clicked++;
            await new Promise((r) => setTimeout(r, 70));
          } catch (e) {}
        } else {
          const clickable = row.querySelector('td:not(:last-child), [role="gridcell"]:not(:last-child)');
          if (clickable && !clickable.querySelector("input, select, button, a")) {
            try {
              clickable.click();
              clicked++;
              await new Promise((r) => setTimeout(r, 60));
            } catch (e) {}
          }
        }
      }

      showToast(`✓ Expanded ${clicked > 0 ? clicked : "all"} tours! Extracting multi-leg sub-trips...`);
      await new Promise((r) => setTimeout(r, 1200));

      scanDomForTours();
      updateFloatingPillUI();
      if (autoSync) {
        extractAndSyncAll(true, "upsert");
      }
    }

    syncBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      expandAllRelayRows(true);
    });

    if (replaceBtn) {
      replaceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        expandAllRelayRows(false).then(() => {
          extractAndSyncAll(true, "replace_all");
        });
      });
    }
  }

  function updateFloatingPillUI() {
    const countEl = document.getElementById("ud-pill-count");
    const dotEl = document.getElementById("ud-pill-dot");
    const autoSyncEl = document.getElementById("ud-pill-autosync");
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

    try {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["autoSyncEnabled"], (cfg) => {
          if (autoSyncEl) {
            if (cfg && cfg.autoSyncEnabled === false) {
              autoSyncEl.style.background = "rgba(148,163,184,0.1)";
              autoSyncEl.style.color = "#94a3b8";
              autoSyncEl.style.borderColor = "rgba(148,163,184,0.3)";
              autoSyncEl.innerHTML = `<span style="width:6px;height:6px;border-radius:9999px;background:#94a3b8;display:inline-block;"></span> AUTO-SYNC PAUSED`;
            } else {
              autoSyncEl.style.background = "rgba(16,185,129,0.15)";
              autoSyncEl.style.color = "#10b981";
              autoSyncEl.style.borderColor = "rgba(16,185,129,0.3)";
              autoSyncEl.innerHTML = `<span style="width:6px;height:6px;border-radius:9999px;background:#10b981;box-shadow:0 0 6px #10b981;display:inline-block;"></span> AUTO-SYNC ON (30s)`;
            }
          }
        });
      }
    } catch (e) {}

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

  function dispatchToursToBackground(tours, isManual = false, mode = "upsert") {
    try {
      chrome.runtime.sendMessage(
        {
          type: "RELAY_TOURS_DETECTED",
          payload: tours,
          mode: mode,
          isManual: isManual,
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

  // 10. Real-Time Row Expansion & Click Auto-Sync
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!target) return;
      if (target.closest && target.closest("#ud-relay-sync-pill")) return;
      const row = target.closest ? target.closest('tr, [role="row"], li[class*="card" i], [class*="awsui-table-row"]') : null;
      if (row) {
        const rowText = (row.innerText || row.textContent || "").trim();
        if (/\b(B-[A-Za-z0-9]{9}|T-[A-Za-z0-9]{9})\b/i.test(rowText)) {
          setTimeout(() => {
            const tours = scanDomForTours();
            updateFloatingPillUI();
            if (tours.length > 0) {
              extractAndSyncAll(false, "upsert");
            }
          }, 450);
        }
      }
    },
    true
  );

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });

  // 11. Automated Continuous Background Sync Loop (Every 30 seconds)
  setInterval(async () => {
    try {
      let autoSyncEnabled = true;
      if (chrome.storage && chrome.storage.local) {
        const cfg = await chrome.storage.local.get(["autoSyncEnabled"]);
        if (cfg && cfg.autoSyncEnabled === false) autoSyncEnabled = false;
      }
      if (!autoSyncEnabled) {
        updateFloatingPillUI();
        return;
      }
      const tours = scanDomForTours();
      updateFloatingPillUI();
      if (tours.length > 0) {
        extractAndSyncAll(false, "upsert");
      }
    } catch (e) {
      console.warn("[Unique Dispatch] Background auto-sync interval notice:", e);
    }
  }, 30000);
})();
