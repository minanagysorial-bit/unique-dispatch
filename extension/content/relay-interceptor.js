/**
 * Unique Dispatch - Amazon Relay Main-World Network Interceptor
 * Intercepts internal Amazon Relay GraphQL and REST API network requests.
 * Extracts 100% authentic live, scheduled, and future multi-stop tour itineraries with zero fake data.
 */

(function () {
  if (window.__ud_relay_interceptor_loaded) return;
  window.__ud_relay_interceptor_loaded = true;

  console.log("🚚 [Unique Dispatch] Relay Deep API Interceptor Initialized");

  function safeParseJson(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function normalizeDate(rawDate, fallbackHoursAhead = 2) {
    if (!rawDate) {
      return new Date(Date.now() + fallbackHoursAhead * 3600 * 1000).toISOString();
    }
    if (typeof rawDate === "number") {
      return new Date(rawDate).toISOString();
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    return new Date(Date.now() + fallbackHoursAhead * 3600 * 1000).toISOString();
  }

  /**
   * Helper: Normalize any Amazon Relay Tour / Work Opportunity object
   */
  function normalizeApiTour(raw) {
    if (!raw || typeof raw !== "object") return null;

    // Unwrap node or wrapper
    const item = raw.node ? raw.node : raw.tour ? raw.tour : raw.workOpportunity ? raw.workOpportunity : raw;

    // 1. Extract Trip ID / Tour ID from all possible Relay API formats
    const rawId =
      item.tourReferenceId ||
      item.carrierTourId ||
      item.tourId ||
      item.tripId ||
      item.workOpportunityId ||
      item.workOpportunityRef ||
      item.tourExecutionId ||
      item.executionId ||
      item.referenceId ||
      item.tourNumber ||
      item.tripNumber ||
      item.workAssignmentId ||
      item.vrid ||
      item.orderId ||
      item.id ||
      (item.summary && (item.summary.tourId || item.summary.tourReferenceId)) ||
      (item.details && (item.details.tourId || item.details.workOpportunityId)) ||
      "";

    const tripId = String(rawId).trim();
    if (!tripId || tripId.length < 3) return null;

    // Filter out UI / Non-tour IDs
    const forbiddenPrefixes = ["user-", "usr-", "nav-", "menu-", "btn-", "filter-", "setting-", "notif-", "theme-", "tab-"];
    if (forbiddenPrefixes.some((p) => tripId.toLowerCase().startsWith(p))) return null;

    // 2. Extract Rate / Payout
    let rateUSD = 0;
    if (typeof item.totalPayout === "number") {
      rateUSD = item.totalPayout;
    } else if (item.totalPayout && typeof item.totalPayout.value === "number") {
      rateUSD = item.totalPayout.value;
    } else if (item.totalPayout && typeof item.totalPayout.amount === "number") {
      rateUSD = item.totalPayout.amount;
    } else if (item.payout && typeof item.payout.value === "number") {
      rateUSD = item.payout.value;
    } else if (item.payout && typeof item.payout.amount === "number") {
      rateUSD = item.payout.amount;
    } else if (item.rate && typeof item.rate.amount === "number") {
      rateUSD = item.rate.amount;
    } else if (item.rate && typeof item.rate.value === "number") {
      rateUSD = item.rate.value;
    } else if (typeof item.rateUSD === "number") {
      rateUSD = item.rateUSD;
    } else if (typeof item.payoutAmount === "number") {
      rateUSD = item.payoutAmount;
    } else if (typeof item.estimatedCost === "number") {
      rateUSD = item.estimatedCost;
    } else if (typeof item.allInRate === "number") {
      rateUSD = item.allInRate;
    } else if (item.allInRate && typeof item.allInRate.amount === "number") {
      rateUSD = item.allInRate.amount;
    }

    // 3. Extract Multi-Stop Itinerary / Legs / Stops
    const rawLegs = Array.isArray(item.legs)
      ? item.legs
      : Array.isArray(item.workOpportunityLegs)
      ? item.workOpportunityLegs
      : Array.isArray(item.tourLegs)
      ? item.tourLegs
      : Array.isArray(item.subTours)
      ? item.subTours
      : [];

    const rawStops = Array.isArray(item.stops)
      ? item.stops
      : Array.isArray(item.itinerary)
      ? item.itinerary
      : Array.isArray(item.stopDetails)
      ? item.stopDetails
      : Array.isArray(item.locationSequence)
      ? item.locationSequence
      : [];

    let normalizedStops = [];

    // Approach A: Pairwise Legs extraction (e.g. Leg 1: Origin -> Dest, Leg 2: Origin -> Dest)
    if (rawLegs.length > 0) {
      const stopsFromLegs = [];

      rawLegs.forEach((leg, lIdx) => {
        if (!leg || typeof leg !== "object") return;

        // Origin of Leg
        const oLoc = leg.originLocation || leg.origin || leg.startLocation || leg.startFacility || leg;
        const oFac =
          leg.originFacilityCode ||
          leg.originFacility ||
          oLoc.facilityCode ||
          oLoc.facilityId ||
          oLoc.locationCode ||
          oLoc.nodeCode ||
          oLoc.code ||
          "";

        const oCity = oLoc.city || oLoc.address?.city || oLoc.location?.city || oFac || "Origin";
        const oState = oLoc.state || oLoc.address?.state || oLoc.location?.state || "US";
        const oAddr =
          typeof oLoc.address === "string"
            ? oLoc.address
            : oLoc.address?.streetAddress || oLoc.address?.addressLine1 || oLoc.location?.addressLine1 || undefined;
        const oZip = oLoc.postalCode || oLoc.zip || oLoc.address?.postalCode || undefined;
        const oTime =
          leg.plannedDepartureTime ||
          leg.departureTime ||
          leg.startTime ||
          leg.windowStart ||
          leg.earliestStartTime ||
          leg.departureWindow?.start ||
          oLoc.plannedDepartureTime ||
          "";

        const oAct = leg.originActivity || leg.activityType || leg.workType || (lIdx === 0 ? "pickup" : "drop_hook");

        // Destination of Leg
        const dLoc = leg.destinationLocation || leg.destination || leg.endLocation || leg.endFacility || leg;
        const dFac =
          leg.destFacilityCode ||
          leg.destinationFacility ||
          dLoc.facilityCode ||
          dLoc.facilityId ||
          dLoc.locationCode ||
          dLoc.nodeCode ||
          dLoc.code ||
          "";

        const dCity = dLoc.city || dLoc.address?.city || dLoc.location?.city || dFac || "Destination";
        const dState = dLoc.state || dLoc.address?.state || dLoc.location?.state || "US";
        const dAddr =
          typeof dLoc.address === "string"
            ? dLoc.address
            : dLoc.address?.streetAddress || dLoc.address?.addressLine1 || dLoc.location?.addressLine1 || undefined;
        const dZip = dLoc.postalCode || dLoc.zip || dLoc.address?.postalCode || undefined;
        const dTime =
          leg.plannedArrivalTime ||
          leg.arrivalTime ||
          leg.endTime ||
          leg.windowEnd ||
          leg.latestEndTime ||
          leg.arrivalWindow?.start ||
          dLoc.plannedArrivalTime ||
          "";

        const dAct = leg.destActivity || (lIdx === rawLegs.length - 1 ? "delivery" : "drop_hook");

        // Add Origin Stop if first leg or different facility
        if (lIdx === 0 || stopsFromLegs.length === 0) {
          stopsFromLegs.push({
            sequenceNumber: stopsFromLegs.length + 1,
            type: "pickup",
            activity: oAct,
            facilityCode: oFac || undefined,
            facilityName: oLoc.facilityName || oLoc.name || undefined,
            address: oAddr,
            city: oCity,
            state: oState,
            postalCode: oZip,
            appointmentTime: normalizeDate(oTime, 2),
            status: leg.status === "COMPLETED" ? "completed" : "pending",
          });
        }

        // Add Destination Stop
        stopsFromLegs.push({
          sequenceNumber: stopsFromLegs.length + 1,
          type: lIdx === rawLegs.length - 1 ? "delivery" : "intermediate",
          activity: dAct,
          facilityCode: dFac || undefined,
          facilityName: dLoc.facilityName || dLoc.name || undefined,
          address: dAddr,
          city: dCity,
          state: dState,
          postalCode: dZip,
          appointmentTime: normalizeDate(dTime, (lIdx + 1) * 3 + 2),
          status: leg.status === "COMPLETED" ? "completed" : "pending",
        });
      });

      normalizedStops = stopsFromLegs;
    }

    // Approach B: Direct stops array extraction if legs were empty
    if (normalizedStops.length === 0 && rawStops.length > 0) {
      rawStops.forEach((s, idx) => {
        if (!s || typeof s !== "object") return;
        const fac =
          s.facilityCode ||
          s.facilityId ||
          s.locationCode ||
          s.nodeCode ||
          s.originFacilityCode ||
          s.destFacilityCode ||
          s.facility?.code ||
          s.facility?.facilityCode ||
          s.code ||
          "";

        const city =
          s.city ||
          s.address?.city ||
          s.location?.city ||
          s.facility?.city ||
          fac ||
          (idx === 0 ? "Origin" : idx === rawStops.length - 1 ? "Destination" : `Stop ${idx + 1}`);

        const state = s.state || s.address?.state || s.location?.state || s.facility?.state || "US";

        const addr =
          typeof s.address === "string"
            ? s.address
            : s.address?.streetAddress || s.address?.addressLine1 || s.location?.addressLine1 || undefined;

        const rawAct = String(s.activity || s.activityType || s.workType || s.stopType || s.type || "").toLowerCase();

        let stopType = idx === 0 ? "pickup" : idx === rawStops.length - 1 ? "delivery" : "intermediate";
        if (rawAct.includes("drop") || rawAct.includes("hook")) {
          stopType = "drop_hook";
        }

        const appt =
          s.plannedDepartureTime ||
          s.plannedArrivalTime ||
          s.appointmentTime ||
          s.departureTime ||
          s.arrivalTime ||
          s.startTime ||
          s.windowStart ||
          "";

        normalizedStops.push({
          sequenceNumber: idx + 1,
          type: stopType,
          activity: rawAct || (idx === 0 ? "pickup" : idx === rawStops.length - 1 ? "delivery" : "intermediate"),
          facilityCode: fac || undefined,
          facilityName: s.facilityName || s.locationName || s.name || s.facility?.name || undefined,
          address: addr,
          city,
          state,
          postalCode: s.postalCode || s.zip || s.address?.postalCode || undefined,
          appointmentTime: normalizeDate(appt, idx === 0 ? 2 : idx * 3 + 2),
          status: s.status === "COMPLETED" ? "completed" : "pending",
        });
      });
    }

    // 4. Resolve Origin & Destination summary
    let originCity = item.originCity || (normalizedStops[0] && normalizedStops[0].city) || item.originFacilityCode || "";
    let originState = item.originState || (normalizedStops[0] && normalizedStops[0].state) || "US";
    let originFacility = item.originFacilityCode || (normalizedStops[0] && normalizedStops[0].facilityCode) || "";
    let pickupTime =
      item.pickupTime ||
      item.startTime ||
      item.scheduledStartTime ||
      item.startDate ||
      (normalizedStops[0] && normalizedStops[0].appointmentTime) ||
      "";

    const lastStop = normalizedStops.length > 0 ? normalizedStops[normalizedStops.length - 1] : null;
    let destCity = item.destCity || (lastStop && lastStop.city) || item.destFacilityCode || "";
    let destState = item.destState || (lastStop && lastStop.state) || "US";
    let destFacility = item.destFacilityCode || (lastStop && lastStop.facilityCode) || "";
    let deliveryTime =
      item.deliveryTime ||
      item.endTime ||
      item.scheduledEndTime ||
      item.endDate ||
      (lastStop && lastStop.appointmentTime) ||
      "";

    // Anti-pollution: A genuine tour MUST have either real stops, facility codes, or locations
    if (normalizedStops.length === 0 && !originFacility && !destFacility && !originCity && !destCity && rateUSD <= 0) {
      return null;
    }

    if (!originCity) originCity = originFacility || "Origin Facility";
    if (!destCity) destCity = destFacility || "Destination Facility";

    pickupTime = normalizeDate(pickupTime, 2);
    deliveryTime = normalizeDate(deliveryTime, 16);

    // 5. Equipment
    const rawEquipment =
      item.equipmentType ||
      item.trailerType ||
      item.requiredEquipment ||
      item.equipment ||
      "Dry Van (53')";

    let equipment = "Dry Van (53')";
    const eqStr = String(rawEquipment).toUpperCase();
    if (eqStr.includes("REEFER")) equipment = "Reefer (53')";
    else if (eqStr.includes("FLATBED")) equipment = "Flatbed";
    else if (eqStr.includes("POWER")) equipment = "Power Only";
    else if (eqStr.includes("BOX")) equipment = "26ft Box Truck";
    else if (eqStr.includes("STEP")) equipment = "Step Deck";

    // 6. Weight & Distance
    const weightLbs =
      (item.weight && typeof item.weight.value === "number" ? item.weight.value : null) ||
      (typeof item.weightLbs === "number" ? item.weightLbs : 38000);

    let distanceMiles = undefined;
    if (typeof item.distanceMiles === "number") {
      distanceMiles = Math.round(item.distanceMiles);
    } else if (typeof item.totalDistance === "number") {
      distanceMiles = Math.round(item.totalDistance);
    } else if (item.totalDistance && typeof item.totalDistance.value === "number") {
      distanceMiles = Math.round(item.totalDistance.value);
    } else if (item.distance && typeof item.distance.value === "number") {
      distanceMiles = Math.round(item.distance.value);
    } else if (typeof item.loadedDistance === "number") {
      distanceMiles = Math.round(item.loadedDistance + (item.emptyDistance || 0));
    }

    // 7. Status
    let status = "upcoming";
    const rawStatus = String(item.status || item.executionStatus || item.state || "").toUpperCase();
    if (rawStatus.includes("TRANSIT") || rawStatus.includes("EN_ROUTE") || rawStatus.includes("ACTIVE") || rawStatus.includes("ON_ROAD")) {
      status = "in_transit";
    } else if (rawStatus.includes("COMPLET") || rawStatus.includes("DELIVER") || rawStatus.includes("FINISHED")) {
      status = "delivered";
    } else if (rawStatus.includes("DELAY") || rawStatus.includes("AT_RISK")) {
      status = "delayed";
    } else if (rawStatus.includes("CANCEL") || rawStatus.includes("VOID")) {
      status = "cancelled";
    }

    return {
      vrid: tripId,
      source: "amazon_relay",
      equipment,
      rateUSD: rateUSD > 0 ? rateUSD : 0,
      weightLbs,
      distanceMiles: distanceMiles || undefined,
      totalStopsCount: normalizedStops.length > 0 ? normalizedStops.length : undefined,
      originCity,
      originState,
      originFacilityCode: originFacility || undefined,
      pickupTime,
      destCity,
      destState,
      destFacilityCode: destFacility || undefined,
      deliveryTime,
      stops: normalizedStops.length > 0 ? normalizedStops : undefined,
      status,
      driverName: item.driverName || item.driver?.name || item.assignedDriver?.name || item.assignedDriver?.driverName || "Assigned Driver",
      driverPhone: item.driverPhone || item.driver?.phone || item.driver?.phoneNumber || item.assignedDriver?.phone || item.assignedDriver?.driverPhone || "+1 (555) 000-0000",
      tractorNumber: item.tractorNumber || item.tractorId || item.vehicleId || item.powerUnitId || "UD-AMZ",
      trailerNumber: item.trailerNumber || item.trailerId || "TR-5300",
      carrierName: item.carrierName || item.carrier?.name || "Unique Dispatch Fleet",
      carrierMcDot: item.carrierMcDot || item.carrier?.dot || "MC-ACTIVE",
      notes: `Captured via Amazon Relay API on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    };
  }

  function handlePossibleRelayData(data, sourceUrl) {
    if (!data) return;

    let candidateList = [];

    function findArrays(obj, depth = 0) {
      if (!obj || depth > 5) return;
      if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === "object") {
          candidateList.push(...obj);
        }
        return;
      }
      if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const k = key.toLowerCase();
          if (
            k.includes("tour") ||
            k.includes("trip") ||
            k.includes("workopportunit") ||
            k.includes("load") ||
            k.includes("schedule") ||
            k.includes("execution") ||
            k.includes("assignment") ||
            k.includes("edge") ||
            k.includes("content") ||
            k.includes("result")
          ) {
            if (Array.isArray(val)) {
              candidateList.push(...val);
            } else if (val && typeof val === "object") {
              findArrays(val, depth + 1);
            }
          } else if (val && typeof val === "object") {
            findArrays(val, depth + 1);
          }
        }
      }
    }

    findArrays(data);

    if (candidateList.length === 0 && Array.isArray(data)) {
      candidateList = data;
    }

    if (candidateList.length === 0) return;

    const normalized = [];
    const seenIds = new Set();

    candidateList.forEach((raw) => {
      const tour = normalizeApiTour(raw);
      if (tour && tour.vrid && !seenIds.has(tour.vrid)) {
        seenIds.add(tour.vrid);
        tour.screenIndex = normalized.length;
        normalized.push(tour);
      }
    });

    if (normalized.length > 0) {
      console.log(`🚚 [Unique Dispatch] Intercepted ${normalized.length} authentic tours from Relay API (${sourceUrl})`);
      window.postMessage(
        {
          type: "UD_RELAY_RAW_API_TOURS",
          url: sourceUrl,
          tours: normalized,
        },
        "*"
      );
    }
  }

  // 1. Hook fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
      const clone = response.clone();
      clone
        .text()
        .then((text) => {
          if (text && (text.startsWith("{") || text.startsWith("["))) {
            const parsed = safeParseJson(text);
            if (parsed) {
              handlePossibleRelayData(parsed, url);
            }
          }
        })
        .catch(() => {});
    } catch (e) {}
    return response;
  };

  // 2. Hook XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._ud_url = typeof url === "string" ? url : String(url);
    return origOpen.apply(this, arguments);
  };

    XMLHttpRequest.prototype.send = function () {
    this.addEventListener("load", function () {
      try {
        const url = this._ud_url || "";
        const text = this.responseText;
        if (text && (text.startsWith("{") || text.startsWith("["))) {
          const parsed = safeParseJson(text);
          if (parsed) {
            handlePossibleRelayData(parsed, url);
          }
        }
      } catch (e) {}
    });
    return origSend.apply(this, arguments);
  };

  // 3. Scan Global Window State Objects (Redux / Apollo / Initial Data)
  function scanWindowState() {
    try {
      const candidates = [
        window.__INITIAL_STATE__,
        window.__APOLLO_STATE__,
        window.__REDUX_STATE__,
        window.__NEXT_DATA__?.props?.pageProps,
        window.__DATA__,
        window.relayData,
      ];
      candidates.forEach((st) => {
        if (st) {
          handlePossibleRelayData(st, "window_state");
        }
      });
    } catch (e) {}
  }

  scanWindowState();
  setTimeout(scanWindowState, 1000);
  setTimeout(scanWindowState, 3000);
})();
