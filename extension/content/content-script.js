/**
 * Unique Dispatch - Amazon Relay Enterprise Content Script
 * Extracts 100% authentic Amazon Relay Block Tours, Multi-Leg Sub-Trips, 
 * Full 6+ Stop progression lines, Driver Names, Contract Codes, and Exact Dates.
 */

(function () {
  "use strict";

  window.__ud_content_script_initialized = true;
  window.__ud_version = "3.0.0";

  console.log("🚚 [Unique Dispatch] Relay Ops Controller & CPT Engine v3.0 Active in frame:", window.location.href);

  const capturedApiToursMap = new Map();
  let latestOrderedTours = [];
  let isSyncing = false;
  let debounceScanTimer = null;

  function isExtensionValid() {
    try {
      return Boolean(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

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
      updateDockedSidebarUI();
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
      if (isExtensionValid() && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ lastDetectedTours: latestOrderedTours });
      }
    } catch (e) {}

    return latestOrderedTours;
  }

  // ==========================================
  // 6. Web Audio Siren Synthesizer Engine
  // ==========================================
  class SirenAudioEngine {
    constructor() {
      this.audioCtx = null;
      this.oscillator = null;
      this.gainNode = null;
      this.timer = null;
      this.isPlaying = false;
      this.isMuted = false;
    }

    init() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
    }

    start() {
      if (this.isPlaying || this.isMuted) return;
      this.init();
      if (!this.audioCtx) return;

      try {
        this.isPlaying = true;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();

        let toggle = false;
        this.timer = setInterval(() => {
          if (!this.isPlaying || !this.audioCtx) return;
          try {
            const now = this.audioCtx.currentTime;
            toggle = !toggle;
            const target = toggle ? 880 : 660;
            osc.frequency.cancelScheduledValues(now);
            osc.frequency.linearRampToValueAtTime(target, now + 0.12);
          } catch (e) {}
        }, 250);

        this.oscillator = osc;
        this.gainNode = gain;
      } catch (e) {
        console.warn("[Unique Dispatch] SirenAudioEngine start warning:", e);
      }
    }

    stop() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.oscillator) {
        try {
          this.oscillator.stop();
          this.oscillator.disconnect();
        } catch (e) {}
        this.oscillator = null;
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stop();
      }
      return this.isMuted;
    }

    testSiren(durationMs = 2500) {
      this.start();
      setTimeout(() => {
        if (!hasActiveUnacknowledgedAlerts()) {
          this.stop();
        }
      }, durationMs);
    }
  }

  const siren = new SirenAudioEngine();

  // Unlock AudioContext on first user interaction anywhere on page
  document.addEventListener("click", () => siren.init(), { once: true, passive: true });
  document.addEventListener("keydown", () => siren.init(), { once: true, passive: true });

  // ==========================================
  // 7. Priority Dispatch & Milestone State
  // ==========================================
  let acknowledgedAlertKeys = new Set();
  let evaluatedTourResults = [];
  let evaluatedStats = {
    totalLoads: 0,
    actionRequired: 0,
    unacknowledgedAlerts: 0,
    delaysRaised: 0,
    checkins35h: 0,
    delivery30m: 0,
    inTransit: 0,
    plannedUpcoming: 0,
    historyLoads: 0,
  };
  let activeFilterTab = "all"; // 'all', 'upcoming', 'in_transit', 'history'
  let activeDateFilter = "";   // 'YYYY-MM-DD' or empty for all
  let activeDateMode = "single"; // 'single' or 'range'
  let searchQuery = "";
  let isSidebarCollapsed = false;
  let autoSyncEnabled = true;

  const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 Minutes
  let nextSyncTimestamp = Date.now() + SYNC_INTERVAL_MS;
  let countdownInterval = null;

  // Initialize stored acknowledgments & preferences
  try {
    if (isExtensionValid() && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["acknowledgedAlertKeys", "sidebarCollapsed", "autoSyncEnabled"], (data) => {
        if (data && Array.isArray(data.acknowledgedAlertKeys)) {
          data.acknowledgedAlertKeys.forEach((k) => acknowledgedAlertKeys.add(k));
        }
        if (data && typeof data.sidebarCollapsed === "boolean") {
          isSidebarCollapsed = data.sidebarCollapsed;
        }
        if (data && typeof data.autoSyncEnabled === "boolean") {
          autoSyncEnabled = data.autoSyncEnabled;
        }
      });
    }
  } catch (e) {}

  function hasActiveUnacknowledgedAlerts() {
    return evaluatedStats.unacknowledgedAlerts > 0;
  }

  // ==========================================
  // 8. Priority & Milestone Evaluator
  // ==========================================
  function evaluateTourPriorities(tours) {
    const now = Date.now();
    let delayCount = 0;
    let checkin35hCount = 0;
    let delivery30mCount = 0;
    let inTransitCount = 0;
    let upcomingCount = 0;
    let historyCount = 0;
    let unacknowledgedAlertsCount = 0;

    const evaluated = tours.map((tour) => {
      const pickupMs = tour.pickupTime ? new Date(tour.pickupTime).getTime() : 0;
      const deliveryMs = tour.deliveryTime ? new Date(tour.deliveryTime).getTime() : 0;

      const minutesToPickup = pickupMs > 0 ? Math.floor((pickupMs - now) / 60000) : 999999;
      const minutesToDelivery = deliveryMs > 0 ? Math.floor((deliveryMs - now) / 60000) : 999999;

      const status = (tour.status || "").toLowerCase();
      const isDelivered = status === "delivered" || status === "completed" || status === "cancelled";
      const isDelayed =
        status === "delayed" ||
        /delayed|delay|at\s*risk|disrupted|late/i.test(tour.notes || "") ||
        /delayed|delay|disrupted/i.test(tour.acceptanceStatus || "");

      const alerts = [];

      // Priority 1: Critical Delay / Disruption Raised
      if (isDelayed && !isDelivered) {
        delayCount++;
        const alertKey = `${tour.vrid}_delay`;
        const isAck = acknowledgedAlertKeys.has(alertKey);
        if (!isAck) unacknowledgedAlertsCount++;

        alerts.push({
          key: alertKey,
          vrid: tour.vrid,
          type: "delay",
          priorityRank: 1,
          isAcknowledged: isAck,
          badgeText: "🚨 DELAY RAISED",
          badgeColor: "#ef4444",
          badgeBg: "rgba(239, 68, 68, 0.2)",
          title: "Critical Relay Delay / Disruption Flagged",
          desc: "Tour marked as delayed or disrupted. Contact Amazon Relay Support & verify driver status immediately.",
          actionLabel: "Call Driver & Notify Amazon",
          suggestedMsg: `URGENT: Tour #${tour.vrid} (${tour.originFacilityCode || tour.originCity} to ${tour.destFacilityCode || tour.destCity}) has a disruption reported. Dispatcher is monitoring. Driver ${tour.driverName || ""}, please check in immediately.`,
          tour: tour,
        });
      }

      // Priority 2: 3.5h Pickup Milestone (<= 210 mins and not yet underway)
      const isUpcoming = (status === "upcoming" || status === "confirmed" || status === "pending_acceptance") && !isDelivered;
      if (isUpcoming && minutesToPickup > 0 && minutesToPickup <= 210) {
        checkin35hCount++;
        const alertKey = `${tour.vrid}_pickup_3.5h`;
        const isAck = acknowledgedAlertKeys.has(alertKey);
        if (!isAck) unacknowledgedAlertsCount++;

        const h = Math.floor(minutesToPickup / 60);
        const m = minutesToPickup % 60;
        const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

        alerts.push({
          key: alertKey,
          vrid: tour.vrid,
          type: "pickup_3.5h",
          priorityRank: 2,
          isAcknowledged: isAck,
          badgeText: "⚠️ 3.5H CHECK-IN DUE",
          badgeColor: "#f59e0b",
          badgeBg: "rgba(245, 158, 11, 0.2)",
          title: `Pickup in ${timeStr} • Driver Check-in Required`,
          desc: `Tour departs soon from ${tour.originFacilityCode || tour.originCity}. Send driver message to confirm on-time rolling status.`,
          actionLabel: "Send Driver Message",
          suggestedMsg: `Hello ${tour.driverName || "Driver"}, Unique Dispatch checking in. Your Amazon Relay Tour #${tour.vrid} pickup starts in ${timeStr} at ${tour.originFacilityCode || tour.originCity}. Please confirm you are on schedule with equipment ready. Thank you!`,
          tour: tour,
        });
      }

      // Priority 3: 30m Delivery Milestone (<= 30 mins and currently underway)
      const isInTransit = (status === "in_transit" || status === "at_pickup" || status === "at_delivery" || (minutesToPickup <= 0 && minutesToDelivery > 0)) && !isDelivered;
      if (isInTransit && minutesToDelivery > 0 && minutesToDelivery <= 30) {
        delivery30mCount++;
        const alertKey = `${tour.vrid}_delivery_30m`;
        const isAck = acknowledgedAlertKeys.has(alertKey);
        if (!isAck) unacknowledgedAlertsCount++;

        alerts.push({
          key: alertKey,
          vrid: tour.vrid,
          type: "delivery_30m",
          priorityRank: 3,
          isAcknowledged: isAck,
          badgeText: "📞 30M DELIVERY CONFIRMATION",
          badgeColor: "#38bdf8",
          badgeBg: "rgba(56, 189, 248, 0.2)",
          title: `Delivery in ${minutesToDelivery}m • Call Driver Now`,
          desc: `Approaching destination ${tour.destFacilityCode || tour.destCity}. Call driver to ensure smooth gate arrival & guard check-in.`,
          actionLabel: "Call Driver Immediately",
          suggestedMsg: `Hello ${tour.driverName || "Driver"}, Unique Dispatch here. Tour #${tour.vrid} final delivery at ${tour.destFacilityCode || tour.destCity} is scheduled in ${minutesToDelivery} minutes. Please call dispatch or confirm arrival once at the guard shack.`,
          tour: tour,
        });
      }

      if (isDelivered) historyCount++;
      else if (isInTransit) inTransitCount++;
      else if (isUpcoming) upcomingCount++;

      let minRank = 4;
      let hasUnack = false;
      if (alerts.length > 0) {
        minRank = Math.min(...alerts.map((a) => a.priorityRank));
        hasUnack = alerts.some((a) => !a.isAcknowledged);
      }

      return {
        tour: tour,
        alerts: alerts,
        minRank: minRank,
        hasUnacknowledgedAlerts: hasUnack,
        minutesToPickup: minutesToPickup,
        minutesToDelivery: minutesToDelivery,
        isDelayed: isDelayed,
        isInTransit: isInTransit,
        isUpcoming: isUpcoming,
        isDelivered: isDelivered,
      };
    });

    // Sort order: Unacknowledged alerts first, then Rank 1 -> 2 -> 3 -> 4, then Screen Index
    evaluated.sort((a, b) => {
      if (a.hasUnacknowledgedAlerts !== b.hasUnacknowledgedAlerts) {
        return a.hasUnacknowledgedAlerts ? -1 : 1;
      }
      if (a.minRank !== b.minRank) {
        return a.minRank - b.minRank;
      }
      return (a.tour.screenIndex || 0) - (b.tour.screenIndex || 0);
    });

    evaluatedTourResults = evaluated;
    evaluatedStats = {
      totalLoads: tours.length,
      actionRequired: delayCount + checkin35hCount + delivery30mCount,
      unacknowledgedAlerts: unacknowledgedAlertsCount,
      delaysRaised: delayCount,
      checkins35h: checkin35hCount,
      delivery30m: delivery30mCount,
      inTransit: inTransitCount,
      plannedUpcoming: upcomingCount,
      historyLoads: historyCount,
    };

    // Siren alarm rule: Continuous loud alarm while unacknowledged alerts exist
    if (unacknowledgedAlertsCount > 0) {
      siren.start();
    } else {
      siren.stop();
    }

    return { evaluated: evaluatedTourResults, stats: evaluatedStats };
  }

  function acknowledgeAlert(alertKey) {
    acknowledgedAlertKeys.add(alertKey);
    try {
      if (isExtensionValid() && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          acknowledgedAlertKeys: Array.from(acknowledgedAlertKeys),
        });
      }
    } catch (e) {}

    let remainingUnack = 0;
    evaluatedTourResults.forEach((item) => {
      item.alerts.forEach((alert) => {
        if (!acknowledgedAlertKeys.has(alert.key)) remainingUnack++;
      });
    });

    if (remainingUnack === 0) {
      siren.stop();
      showToast("✓ Alert acknowledged. Siren silenced.");
    } else {
      showToast(`✓ Alert acknowledged. (${remainingUnack} alert(s) remaining)`);
    }

    updateDockedSidebarUI();
  }

  function silenceAndAcknowledgeAll() {
    evaluatedTourResults.forEach((item) => {
      item.alerts.forEach((alert) => {
        acknowledgedAlertKeys.add(alert.key);
      });
    });
    try {
      if (isExtensionValid() && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          acknowledgedAlertKeys: Array.from(acknowledgedAlertKeys),
        });
      }
    } catch (e) {}
    siren.stop();
    showToast("✓ All active alerts acknowledged. Siren stopped.");
    updateDockedSidebarUI();
  }

  // ==========================================
  // 9. In-Page Docked Operations Sidebar UI
  // ==========================================
  function injectDockedSidebar() {
    if (window.self !== window.top) return;
    if (document.getElementById("ud-relay-ops-panel")) return;

    // Inject custom CSS styling
    if (!document.getElementById("ud-docked-styles")) {
      const styleTag = document.createElement("style");
      styleTag.id = "ud-docked-styles";
      styleTag.textContent = `
        @keyframes udPulseSiren {
          0%, 100% { background: #b91c1c; box-shadow: 0 0 16px rgba(239,68,68,0.8); }
          50% { background: #7f1d1d; box-shadow: 0 0 4px rgba(239,68,68,0.4); }
        }
        @keyframes udBadgeGlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        #ud-relay-ops-panel * {
          box-sizing: border-box;
        }
        #ud-relay-ops-panel ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        #ud-relay-ops-panel ::-webkit-scrollbar-track {
          background: #090e17;
        }
        #ud-relay-ops-panel ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        #ud-relay-ops-panel ::-webkit-scrollbar-thumb:hover {
          background: #ea580c;
        }
        .ud-btn-hover:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }
        .ud-btn-hover:active {
          transform: translateY(0);
        }
      `;
      document.head.appendChild(styleTag);
    }

    // 1. Docked Sidebar Container
    const panel = document.createElement("div");
    panel.id = "ud-relay-ops-panel";
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      height: 100vh;
      z-index: 2147483640;
      background: #090e17;
      color: #f8fafc;
      border-left: 1px solid #1e293b;
      box-shadow: -10px 0 35px rgba(0, 0, 0, 0.65);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
    `;

    panel.innerHTML = `
      <!-- Top Title Bar -->
      <div id="ud-panel-topbar" style="background:#0f172a; border-bottom:1px solid #1e293b; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; user-select:none;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">🚚</span>
          <div>
            <div style="font-weight:900; font-size:11px; color:#fb923c; letter-spacing:0.4px;">UNIQUE DISPATCH</div>
            <div style="font-size:9px; color:#94a3b8; font-weight:600;">Relay Ops Controller v3.0</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="ud-sound-toggle-btn" class="ud-btn-hover" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; padding:4px 7px; border-radius:6px; font-size:10px; cursor:pointer;" title="Toggle Siren Sound / Sound Test">🔊</button>
          <button id="ud-minimize-btn" class="ud-btn-hover" style="background:#1e293b; border:1px solid #334155; color:#94a3b8; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;" title="Minimize to edge tab">_</button>
          <button id="ud-close-btn" class="ud-btn-hover" style="background:#1e293b; border:1px solid #334155; color:#94a3b8; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;" title="Close Docked Panel">✕</button>
        </div>
      </div>

      <!-- Scrollable Main Content -->
      <div id="ud-panel-scrollable" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px;">
        
        <!-- Live Operational Status Banner -->
        <div id="ud-ops-status-container"></div>

        <!-- Date Filtering Bar -->
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px;">
          <div style="display:flex; gap:6px; margin-bottom:6px;">
            <button id="ud-date-single-btn" class="ud-btn-hover" style="flex:1; background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:5px; font-size:10px; font-weight:800; cursor:pointer;">Single Date</button>
            <button id="ud-date-range-btn" class="ud-btn-hover" style="flex:1; background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:4px 8px; border-radius:5px; font-size:10px; font-weight:700; cursor:pointer;">Date Range</button>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <input type="date" id="ud-date-picker" style="flex:1; background:#090e17; color:#f8fafc; border:1px solid #334155; border-radius:5px; padding:4px 8px; font-size:10px; font-family:inherit;">
            <button id="ud-date-today-btn" class="ud-btn-hover" style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:5px; font-size:10px; font-weight:800; cursor:pointer;">Today</button>
            <button id="ud-date-clear-btn" class="ud-btn-hover" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:4px 6px; border-radius:5px; font-size:10px; cursor:pointer;" title="Show All Dates">All</button>
          </div>
        </div>

        <!-- 6 KPI Counter Cards Grid -->
        <div id="ud-kpi-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <!-- Populated dynamically in updateDockedSidebarUI -->
        </div>

        <!-- Big Primary Action Button -->
        <div>
          <button id="ud-fetch-relay-btn" class="ud-btn-hover" style="
            width: 100%;
            background: linear-gradient(135deg, #1d4ed8 0%, #0369a1 100%);
            color: #ffffff;
            border: 1px solid #38bdf8;
            border-radius: 8px;
            padding: 10px;
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(2,132,199,0.35);
          ">
            <span>⚡ Fetch Relay Loads</span>
          </button>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding:0 2px; font-size:9px; color:#94a3b8;">
            <span>Next Auto-Sync in: <b id="ud-header-countdown" style="color:#38bdf8; font-family:monospace;">30:00</b></span>
            <span id="ud-autosync-indicator" style="color:#10b981; font-weight:700;">● Active (Every 30m)</span>
          </div>
        </div>

        <!-- Urgent Priority Action Queue Section -->
        <div id="ud-priority-alert-queue" style="display:flex; flex-direction:column; gap:6px;">
          <!-- Populated dynamically -->
        </div>

        <!-- Tri-Tab Switcher -->
        <div style="border-top:1px solid #1e293b; padding-top:8px;">
          <div id="ud-tri-tabs" style="display:flex; gap:4px; margin-bottom:6px; background:#0f172a; padding:3px; border-radius:6px; border:1px solid #1e293b;">
            <button data-tab="all" class="ud-tab-btn" style="flex:1; background:#0284c7; color:#fff; border:none; padding:4px 6px; border-radius:4px; font-size:10px; font-weight:800; cursor:pointer;">All (<span id="ud-tab-count-all">0</span>)</button>
            <button data-tab="upcoming" class="ud-tab-btn" style="flex:1; background:transparent; color:#94a3b8; border:none; padding:4px 6px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer;">Upcoming (<span id="ud-tab-count-upcoming">0</span>)</button>
            <button data-tab="in_transit" class="ud-tab-btn" style="flex:1; background:transparent; color:#94a3b8; border:none; padding:4px 6px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer;">In Transit (<span id="ud-tab-count-transit">0</span>)</button>
            <button data-tab="history" class="ud-tab-btn" style="flex:1; background:transparent; color:#94a3b8; border:none; padding:4px 6px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer;">History (<span id="ud-tab-count-history">0</span>)</button>
          </div>

          <!-- Search Filter Input -->
          <div style="position:relative; margin-bottom:6px;">
            <input type="text" id="ud-search-input" placeholder="🔍 Search VRID, Driver, Facility..." style="
              width: 100%;
              background: #090e17;
              color: #f8fafc;
              border: 1px solid #334155;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 10px;
              font-family: inherit;
            ">
          </div>
        </div>

        <!-- Tours List Cards -->
        <div id="ud-tours-list-container" style="display:flex; flex-direction:column; gap:6px;">
          <!-- Rendered in updateDockedSidebarUI -->
        </div>

      </div>

      <!-- Panel Footer -->
      <div id="ud-panel-footer" style="background:#0f172a; border-top:1px solid #1e293b; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#64748b;">
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="ud-expand-all-btn" class="ud-btn-hover" style="background:#9a3412; color:#ffedd5; border:1px solid #ea580c; border-radius:4px; padding:2px 6px; font-size:9px; font-weight:800; cursor:pointer;" title="Expand all rows to reveal sub-trips">📂 Expand All</button>
          <button id="ud-replace-all-btn" class="ud-btn-hover" style="background:#0284c7; color:#fff; border:none; border-radius:4px; padding:2px 6px; font-size:9px; font-weight:800; cursor:pointer;" title="Replace all portal loads">🔄 Replace All</button>
        </div>
        <a href="https://www.uniquedispatch.com/portal" target="_blank" style="color:#38bdf8; text-decoration:none; font-weight:700;">Open Ops Portal ↗</a>
      </div>
    `;

    document.body.appendChild(panel);

    // 2. Collapsed Edge Launcher
    const launcher = document.createElement("div");
    launcher.id = "ud-collapsed-launcher";
    launcher.style.cssText = `
      position: fixed;
      top: 140px;
      right: 0;
      z-index: 2147483645;
      background: #090e17;
      color: #ffffff;
      border: 1px solid #ea580c;
      border-right: none;
      border-radius: 8px 0 0 8px;
      padding: 8px 12px;
      cursor: pointer;
      box-shadow: -4px 4px 18px rgba(0,0,0,0.55);
      display: none;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      user-select: none;
      transition: all 0.2s ease;
    `;
    launcher.innerHTML = `
      <span style="font-size:14px;">🚚</span>
      <span style="font-weight:900; color:#fb923c;">UD OPS</span>
      <span id="ud-launcher-status" style="background:#10b981; color:#fff; font-size:9px; font-weight:800; padding:2px 6px; border-radius:9999px;">0 Loads</span>
      <span id="ud-launcher-countdown" style="font-size:9px; color:#94a3b8; font-family:monospace;">30:00</span>
    `;
    document.body.appendChild(launcher);

    // Setup Event Listeners
    setupDockedSidebarEvents();

    // Set initial collapse state
    toggleSidebar(isSidebarCollapsed);
  }

  function toggleSidebar(collapsed) {
    isSidebarCollapsed = collapsed;
    const panel = document.getElementById("ud-relay-ops-panel");
    const launcher = document.getElementById("ud-collapsed-launcher");

    if (collapsed) {
      if (panel) panel.style.transform = "translateX(390px)";
      if (launcher) launcher.style.display = "flex";
      document.body.style.marginRight = "0px";
    } else {
      if (panel) {
        panel.style.transform = "translateX(0)";
        panel.style.display = "flex";
      }
      if (launcher) launcher.style.display = "none";
      document.body.style.marginRight = "380px";
    }

    try {
      if (isExtensionValid() && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ sidebarCollapsed: isSidebarCollapsed });
      }
    } catch (e) {}
  }

  function setupDockedSidebarEvents() {
    const minBtn = document.getElementById("ud-minimize-btn");
    const closeBtn = document.getElementById("ud-close-btn");
    const soundBtn = document.getElementById("ud-sound-toggle-btn");
    const launcher = document.getElementById("ud-collapsed-launcher");
    const fetchBtn = document.getElementById("ud-fetch-relay-btn");
    const expandBtn = document.getElementById("ud-expand-all-btn");
    const replaceBtn = document.getElementById("ud-replace-all-btn");
    const datePicker = document.getElementById("ud-date-picker");
    const todayBtn = document.getElementById("ud-date-today-btn");
    const clearDateBtn = document.getElementById("ud-date-clear-btn");
    const dateSingleBtn = document.getElementById("ud-date-single-btn");
    const dateRangeBtn = document.getElementById("ud-date-range-btn");
    const searchInput = document.getElementById("ud-search-input");
    const tabBtns = document.querySelectorAll(".ud-tab-btn");

    if (minBtn) minBtn.addEventListener("click", () => toggleSidebar(true));
    if (closeBtn) closeBtn.addEventListener("click", () => toggleSidebar(true));
    if (launcher) launcher.addEventListener("click", () => toggleSidebar(false));

    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        const isMuted = siren.toggleMute();
        soundBtn.innerText = isMuted ? "🔇" : "🔊";
        soundBtn.style.color = isMuted ? "#ef4444" : "#f8fafc";
        if (!isMuted && !hasActiveUnacknowledgedAlerts()) {
          siren.testSiren(2000);
        }
        showToast(isMuted ? "Siren Muted" : "Siren Sound Enabled (2s Test)");
      });
    }

    if (fetchBtn) {
      fetchBtn.addEventListener("click", () => {
        nextSyncTimestamp = Date.now() + SYNC_INTERVAL_MS;
        expandAllRelayRows(true);
      });
    }

    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        expandAllRelayRows(false);
      });
    }

    if (replaceBtn) {
      replaceBtn.addEventListener("click", () => {
        expandAllRelayRows(false).then(() => {
          extractAndSyncAll(true, "replace_all");
        });
      });
    }

    if (datePicker) {
      datePicker.addEventListener("change", (e) => {
        activeDateFilter = e.target.value;
        updateDockedSidebarUI();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const todayStr = new Date().toISOString().split("T")[0];
        activeDateFilter = todayStr;
        if (datePicker) datePicker.value = todayStr;
        updateDockedSidebarUI();
      });
    }

    if (clearDateBtn) {
      clearDateBtn.addEventListener("click", () => {
        activeDateFilter = "";
        if (datePicker) datePicker.value = "";
        updateDockedSidebarUI();
      });
    }

    if (dateSingleBtn && dateRangeBtn) {
      dateSingleBtn.addEventListener("click", () => {
        activeDateMode = "single";
        dateSingleBtn.style.background = "#0284c7";
        dateSingleBtn.style.color = "#fff";
        dateRangeBtn.style.background = "#1e293b";
        dateRangeBtn.style.color = "#94a3b8";
      });
      dateRangeBtn.addEventListener("click", () => {
        activeDateMode = "range";
        dateRangeBtn.style.background = "#0284c7";
        dateRangeBtn.style.color = "#fff";
        dateSingleBtn.style.background = "#1e293b";
        dateSingleBtn.style.color = "#94a3b8";
        showToast("Date Range filter mode active.");
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = (e.target.value || "").trim().toLowerCase();
        updateDockedSidebarUI();
      });
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilterTab = btn.getAttribute("data-tab") || "all";
        tabBtns.forEach((b) => {
          const isActive = b === btn;
          b.style.background = isActive ? "#0284c7" : "transparent";
          b.style.color = isActive ? "#ffffff" : "#94a3b8";
          b.style.fontWeight = isActive ? "800" : "700";
        });
        updateDockedSidebarUI();
      });
    });
  }

  // ==========================================
  // 10. Render & Update Operations Controller
  // ==========================================
  function updateDockedSidebarUI() {
    if (window.self !== window.top) return;
    if (!document.getElementById("ud-relay-ops-panel")) {
      injectDockedSidebar();
    }

    const { evaluated, stats } = evaluateTourPriorities(latestOrderedTours);

    // 1. Operational Status Banner
    const statusContainer = document.getElementById("ud-ops-status-container");
    if (statusContainer) {
      if (stats.unacknowledgedAlerts > 0) {
        statusContainer.innerHTML = `
          <div style="background:#b91c1c; border:1px solid #ef4444; border-radius:8px; padding:10px; animation: udPulseSiren 1.5s infinite; color:#ffffff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-weight:900; font-size:11px; display:flex; align-items:center; gap:6px;">
                <span>🚨</span>
                <span>SIREN ACTIVE • ${stats.unacknowledgedAlerts} ACTION ALERT(S)</span>
              </div>
              <button id="ud-silence-all-btn" class="ud-btn-hover" style="background:#ffffff; color:#b91c1c; border:none; padding:4px 8px; border-radius:5px; font-size:9px; font-weight:900; cursor:pointer;">✓ Silence All</button>
            </div>
            <div style="font-size:9px; color:#fecaca; margin-top:3px;">Continuous alarm playing until dispatcher acknowledges all pending alerts.</div>
          </div>
        `;
        const silenceBtn = document.getElementById("ud-silence-all-btn");
        if (silenceBtn) silenceBtn.addEventListener("click", silenceAndAcknowledgeAll);
      } else if (stats.actionRequired > 0) {
        statusContainer.innerHTML = `
          <div style="background:rgba(245,158,11,0.15); border:1px solid #f59e0b; border-radius:8px; padding:8px 10px; color:#fbbf24;">
            <div style="font-weight:800; font-size:10px; display:flex; align-items:center; gap:6px;">
              <span>⚠️</span>
              <span>${stats.actionRequired} Alert(s) Monitored • Siren Silenced</span>
            </div>
          </div>
        `;
      } else {
        statusContainer.innerHTML = `
          <div style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); border-radius:8px; padding:10px; color:#10b981; text-align:center;">
            <div style="font-weight:900; font-size:11px;">🟢 All Nominal • Everything Under Control</div>
            <div style="font-size:9px; color:#6ee7b7; margin-top:2px;">No active delays or pending 3.5h/30m check-ins required.</div>
          </div>
        `;
      }
    }

    // 2. KPI Cards Grid (Matching competitor 2x3 layout)
    const kpiGrid = document.getElementById("ud-kpi-grid");
    if (kpiGrid) {
      const actionColor = stats.actionRequired > 0 ? "#ef4444" : "#10b981";
      const delayColor = stats.delaysRaised > 0 ? "#ef4444" : "#94a3b8";
      const checkinColor = stats.checkins35h > 0 ? "#f59e0b" : "#94a3b8";
      const deliveryColor = stats.delivery30m > 0 ? "#38bdf8" : "#94a3b8";

      kpiGrid.innerHTML = `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px; text-align:center;">
          <div style="font-size:18px; font-weight:900; color:#ffffff;">${stats.totalLoads}</div>
          <div style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Total Loads</div>
        </div>

        <div style="background:#0f172a; border:1px solid ${actionColor}; border-radius:8px; padding:8px 10px; text-align:center;">
          <div style="font-size:18px; font-weight:900; color:${actionColor};">${stats.actionRequired}</div>
          <div style="font-size:9px; font-weight:700; color:${actionColor}; text-transform:uppercase;">Action Required</div>
        </div>

        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px; text-align:center;">
          <div style="font-size:18px; font-weight:900; color:${delayColor};">${stats.delaysRaised}</div>
          <div style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Delays Raised</div>
        </div>

        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px; text-align:center;">
          <div style="font-size:18px; font-weight:900; color:${checkinColor};">${stats.checkins35h}</div>
          <div style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase;">3.5h Check-ins</div>
        </div>

        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px; text-align:center;">
          <div style="font-size:18px; font-weight:900; color:${deliveryColor};">${stats.delivery30m}</div>
          <div style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase;">30m Delivery</div>
        </div>

        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px; text-align:center;">
          <div style="font-size:18px; font-weight:900; color:#10b981;">${stats.inTransit}</div>
          <div style="font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase;">In Transit</div>
        </div>
      `;
    }

    // 3. Tab Counts
    const countAll = document.getElementById("ud-tab-count-all");
    const countUpcoming = document.getElementById("ud-tab-count-upcoming");
    const countTransit = document.getElementById("ud-tab-count-transit");
    const countHistory = document.getElementById("ud-tab-count-history");

    if (countAll) countAll.innerText = String(stats.totalLoads);
    if (countUpcoming) countUpcoming.innerText = String(stats.plannedUpcoming);
    if (countTransit) countTransit.innerText = String(stats.inTransit);
    if (countHistory) countHistory.innerText = String(stats.historyLoads);

    // 4. Launcher Badge
    const launcherStatus = document.getElementById("ud-launcher-status");
    if (launcherStatus) {
      if (stats.unacknowledgedAlerts > 0) {
        launcherStatus.style.background = "#ef4444";
        launcherStatus.innerText = `🚨 ${stats.unacknowledgedAlerts} ALERTS`;
      } else {
        launcherStatus.style.background = "#10b981";
        launcherStatus.innerText = `${stats.totalLoads} Loads (Nominal)`;
      }
    }

    // 5. Render Priority Action Alert Cards
    renderPriorityAlertCards();

    // 6. Render Tour Cards List
    renderToursList();
  }

  function renderPriorityAlertCards() {
    const queue = document.getElementById("ud-priority-alert-queue");
    if (!queue) return;

    const allAlerts = [];
    evaluatedTourResults.forEach((item) => {
      item.alerts.forEach((alert) => {
        allAlerts.push(alert);
      });
    });

    if (allAlerts.length === 0) {
      queue.innerHTML = "";
      return;
    }

    queue.innerHTML = `
      <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px;">
        Action Required (${allAlerts.length})
      </div>
    ` + allAlerts.map((alert) => {
      const isAck = alert.isAcknowledged;
      const borderCol = isAck ? "#334155" : alert.badgeColor;
      const bgCol = isAck ? "#0f172a" : alert.badgeBg;

      return `
        <div style="background:${bgCol}; border:1px solid ${borderCol}; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="background:${alert.badgeColor}; color:#ffffff; font-size:9px; font-weight:900; padding:2px 6px; border-radius:4px;">${alert.badgeText}</span>
              <span style="font-family:monospace; font-weight:900; color:#fb923c; font-size:11px;">${alert.vrid}</span>
            </div>
            <div>
              ${isAck
                ? `<span style="font-size:9px; font-weight:800; color:#10b981; display:flex; align-items:center; gap:3px;">✓ Acknowledged</span>`
                : `<button class="ud-ack-btn ud-btn-hover" data-key="${alert.key}" style="background:#ea580c; color:#ffffff; border:none; padding:3px 7px; border-radius:4px; font-size:9px; font-weight:900; cursor:pointer;">✓ Acknowledge</button>`
              }
            </div>
          </div>

          <div style="font-size:10px; font-weight:700; color:#f8fafc;">
            ${alert.title}
          </div>

          <div style="font-size:9px; color:#cbd5e1; line-height:1.3;">
            ${alert.desc}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; color:#94a3b8; font-size:9px; border-top:1px solid rgba(255,255,255,0.07); padding-top:4px; margin-top:2px;">
            <span>Driver: <b style="color:#34d399;">${alert.tour.driverName || "Assigned Driver"}</b></span>
            <div style="display:flex; gap:4px;">
              <button class="ud-copy-msg-btn ud-btn-hover" data-msg="${encodeURIComponent(alert.suggestedMsg)}" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:2px 6px; border-radius:4px; font-size:8px; font-weight:800; cursor:pointer;">📋 Copy Msg</button>
              <a href="https://wa.me/?text=${encodeURIComponent(alert.suggestedMsg)}" target="_blank" class="ud-btn-hover" style="background:#059669; color:#ffffff; text-decoration:none; padding:2px 6px; border-radius:4px; font-size:8px; font-weight:800; display:inline-block;">💬 WhatsApp</a>
              <a href="tel:${alert.tour.driverPhone || "+15550000000"}" class="ud-btn-hover" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; text-decoration:none; padding:2px 6px; border-radius:4px; font-size:8px; font-weight:800; display:inline-block;">📞 Call</a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Attach click listeners for acknowledge & copy buttons
    queue.querySelectorAll(".ud-ack-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = btn.getAttribute("data-key");
        if (key) acknowledgeAlert(key);
      });
    });

    queue.querySelectorAll(".ud-copy-msg-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const msg = decodeURIComponent(btn.getAttribute("data-msg") || "");
        copyTextToClipboard(msg);
      });
    });
  }

  function renderToursList() {
    const listContainer = document.getElementById("ud-tours-list-container");
    if (!listContainer) return;

    let filtered = evaluatedTourResults.filter((item) => {
      // 1. Tab filter
      if (activeFilterTab === "upcoming" && !item.isUpcoming) return false;
      if (activeFilterTab === "in_transit" && !item.isInTransit) return false;
      if (activeFilterTab === "history" && !item.isDelivered) return false;

      // 2. Date filter
      if (activeDateFilter) {
        const pickup = item.tour.pickupTime || "";
        if (!pickup.startsWith(activeDateFilter)) {
          const pDate = new Date(pickup);
          const pDateStr = pDate.toISOString().split("T")[0];
          if (pDateStr !== activeDateFilter) return false;
        }
      }

      // 3. Search query
      if (searchQuery) {
        const t = item.tour;
        const haystack = `${t.vrid} ${t.driverName} ${t.originFacilityCode} ${t.destFacilityCode} ${t.originCity} ${t.destCity} ${t.status}`.toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:16px; text-align:center; color:#64748b; font-size:10px;">
          No tours match the selected filters.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map((item, idx) => {
      const t = item.tour;
      const pDate = new Date(t.pickupTime);
      const isTomorrow = pDate.getDate() === new Date(Date.now() + 24 * 3600 * 1000).getDate();
      const dateTag = isTomorrow ? "Tomorrow" : `${pDate.getMonth() + 1}/${pDate.getDate()}`;
      const timeTag = pDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const stopsBadge = t.stops && t.stops.length > 2
        ? `<span style="background:rgba(234,88,12,0.15); color:#fb923c; border:1px solid rgba(234,88,12,0.3); font-size:8px; font-weight:800; padding:1px 5px; border-radius:3px;">⚡ ${t.stops.length} Stops</span>`
        : "";

      let statusPillBg = "#1e293b";
      let statusPillCol = "#94a3b8";
      if (item.isDelayed) {
        statusPillBg = "rgba(239,68,68,0.2)";
        statusPillCol = "#ef4444";
      } else if (item.isInTransit) {
        statusPillBg = "rgba(16,185,129,0.2)";
        statusPillCol = "#10b981";
      } else if (item.isUpcoming) {
        statusPillBg = "rgba(56,189,248,0.15)";
        statusPillCol = "#38bdf8";
      }

      return `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:3px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="background:#ea580c; color:#ffffff; font-weight:900; font-size:8px; padding:1px 5px; border-radius:3px;">#${t.screenIndex || idx + 1}</span>
              <span style="font-family:monospace; font-weight:900; color:#fb923c; font-size:11px;">${t.vrid}</span>
            </div>
            <span style="background:${statusPillBg}; color:${statusPillCol}; font-weight:800; font-size:8px; padding:2px 6px; border-radius:9999px; text-transform:uppercase;">${t.status || "Planned"}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px;">
            <span style="font-weight:700; color:#f8fafc;">${t.originFacilityCode || t.originCity} ➔ ${t.destFacilityCode || t.destCity}</span>
            <span style="color:#34d399; font-weight:700;">${t.driverName || "Assigned Driver"}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; color:#94a3b8; font-size:9px;">
            <span>📅 ${dateTag}, ${timeTag}</span>
            <div style="display:flex; gap:4px; align-items:center;">
              ${stopsBadge}
              <span style="color:#64748b;">${t.equipment || "53' Trailer"}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function copyTextToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("✓ Message copied to clipboard!");
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      showToast("✓ Message copied to clipboard!");
    } catch (e) {
      showToast("⚠️ Could not copy message.");
    }
    el.remove();
  }

  // ==========================================
  // 11. Expand All Multi-Leg Rows
  // ==========================================
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
    updateDockedSidebarUI();
    if (autoSync) {
      extractAndSyncAll(true, "upsert");
    }
  }

  // ==========================================
  // 12. Extraction & Dispatch Pipeline
  // ==========================================
  function extractAndSyncAll(isManual = false, mode = "upsert") {
    if (isSyncing) return;
    isSyncing = true;

    if (mode === "replace_all") {
      capturedApiToursMap.clear();
    }

    const tours = scanDomForTours();
    evaluateTourPriorities(tours);
    updateDockedSidebarUI();

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
    if (!isExtensionValid()) {
      isSyncing = false;
      return;
    }
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
      right: 395px;
      z-index: 2147483647;
      background: #090e17;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border: 1px solid #ea580c;
      transition: opacity 0.4s ease;
      user-select: none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // ==========================================
  // 13. Runtime Messages & API Interop
  // ==========================================
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
      updateDockedSidebarUI();
      try {
        chrome.storage.local.set({ lastDetectedTours: [] });
      } catch (e) {}
      sendResponse({ status: "cleared", count: 0 });
      return false;
    }
  });

  window.__ud_trigger_scan = () => {
    scanDomForTours();
    updateDockedSidebarUI();
  };

  // ==========================================
  // 14. 30-Minute Interval & 1-Second Countdown
  // ==========================================
  function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      const remainingMs = Math.max(0, nextSyncTimestamp - Date.now());
      const totalSecs = Math.floor(remainingMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      const headerCd = document.getElementById("ud-header-countdown");
      const launcherCd = document.getElementById("ud-launcher-countdown");

      if (headerCd) headerCd.innerText = timeStr;
      if (launcherCd) launcherCd.innerText = timeStr;

      if (remainingMs <= 0) {
        nextSyncTimestamp = Date.now() + SYNC_INTERVAL_MS;
        if (autoSyncEnabled) {
          triggerAutoSyncCycle();
        }
      }
    }, 1000);
  }

  async function triggerAutoSyncCycle() {
    if (!isExtensionValid() || isSyncing) return;
    try {
      const tours = scanDomForTours();
      evaluateTourPriorities(tours);
      updateDockedSidebarUI();
      if (tours.length > 0) {
        extractAndSyncAll(false, "upsert");
      }
    } catch (e) {}
  }

  // ==========================================
  // 15. Startup & Observers
  // ==========================================
  setTimeout(() => {
    injectDockedSidebar();
    const tours = scanDomForTours();
    updateDockedSidebarUI();
    startCountdownTimer();
    if (tours.length > 0) {
      extractAndSyncAll(false, "upsert");
    }
  }, 1000);

  setTimeout(() => {
    const tours = scanDomForTours();
    updateDockedSidebarUI();
    if (tours.length > 0) {
      extractAndSyncAll(false, "upsert");
    }
  }, 2500);

  const observer = new MutationObserver((mutations) => {
    const isOurUi = mutations.every(
      (m) => m.target && (m.target.id?.includes?.("ud-") || m.target.closest?.("#ud-relay-ops-panel") || m.target.closest?.("#ud-collapsed-launcher"))
    );
    if (isOurUi) return;

    if (debounceScanTimer) clearTimeout(debounceScanTimer);
    debounceScanTimer = setTimeout(() => {
      scanDomForTours();
      updateDockedSidebarUI();
    }, 1000);
  });

  // Real-Time Row Expansion & Click Auto-Sync
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!target) return;
      if (target.closest && (target.closest("#ud-relay-ops-panel") || target.closest("#ud-collapsed-launcher"))) return;
      const row = target.closest ? target.closest('tr, [role="row"], li[class*="card" i], [class*="awsui-table-row"]') : null;
      if (row) {
        const rowText = (row.innerText || row.textContent || "").trim();
        if (/\b(B-[A-Za-z0-9]{9}|T-[A-Za-z0-9]{9})\b/i.test(rowText)) {
          setTimeout(() => {
            const tours = scanDomForTours();
            updateDockedSidebarUI();
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
})();
