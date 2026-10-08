/**
 * Unique Dispatch - Amazon Relay Main-World Network Interceptor
 * Runs in the webpage context to passively intercept Amazon Relay's internal JSON API requests.
 * Captures all live, scheduled, and future tour schedules.
 */

(function () {
  if (window.__ud_relay_interceptor_loaded) return;
  window.__ud_relay_interceptor_loaded = true;

  console.log("🚚 [Unique Dispatch] Relay Main-World API Interceptor Initialized");

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

  function normalizeApiTour(item) {
    if (!item || typeof item !== "object") return null;

    // 1. Extract Trip ID / Tour ID / Work Opportunity ID
    const rawId =
      item.tourId ||
      item.tripId ||
      item.workOpportunityId ||
      item.loadId ||
      item.tourExecutionId ||
      item.executionId ||
      item.vrid ||
      item.id ||
      item.tripNumber ||
      item.tourNumber ||
      item.workOpportunityNumber ||
      "";

    const tripId = String(rawId).trim();
    if (!tripId || tripId.length < 3) return null;

    // 2. Extract Rate / Payout
    let rateUSD = 0;
    if (typeof item.totalPayout === "number") {
      rateUSD = item.totalPayout;
    } else if (item.payout && typeof item.payout.value === "number") {
      rateUSD = item.payout.value;
    } else if (item.payout && typeof item.payout.amount === "number") {
      rateUSD = item.payout.amount;
    } else if (item.rate && typeof item.rate.amount === "number") {
      rateUSD = item.rate.amount;
    } else if (typeof item.rateUSD === "number") {
      rateUSD = item.rateUSD;
    } else if (typeof item.payoutAmount === "number") {
      rateUSD = item.payoutAmount;
    } else if (typeof item.estimatedCost === "number") {
      rateUSD = item.estimatedCost;
    }

    // 3. Extract Stops / Legs
    const rawStops = Array.isArray(item.stops)
      ? item.stops
      : Array.isArray(item.legs)
      ? item.legs
      : Array.isArray(item.workOpportunityLegs)
      ? item.workOpportunityLegs
      : Array.isArray(item.tourLegs)
      ? item.tourLegs
      : Array.isArray(item.itinerary)
      ? item.itinerary
      : [];

    let originFacility = item.originFacilityCode || item.originFacility || "";
    let originCity = item.originCity || "";
    let originState = item.originState || "US";
    let pickupTime = item.pickupTime || item.startTime || item.startDate || "";

    let destFacility = item.destFacilityCode || item.destinationFacility || "";
    let destCity = item.destCity || "";
    let destState = item.destState || "US";
    let deliveryTime = item.deliveryTime || item.endTime || item.endDate || "";

    if (rawStops.length > 0) {
      const firstStop = rawStops[0];
      const lastStop = rawStops[rawStops.length - 1];

      originFacility =
        firstStop.facilityCode ||
        firstStop.facilityId ||
        firstStop.originFacilityCode ||
        firstStop.locationCode ||
        firstStop.originCode ||
        originFacility;

      originCity =
        firstStop.city ||
        firstStop.address?.city ||
        firstStop.location?.city ||
        firstStop.originCity ||
        originCity ||
        originFacility ||
        "Amazon Origin";

      originState =
        firstStop.state ||
        firstStop.address?.state ||
        firstStop.location?.state ||
        firstStop.originState ||
        originState;

      pickupTime =
        firstStop.plannedDepartureTime ||
        firstStop.plannedArrivalTime ||
        firstStop.departureEarliest ||
        firstStop.arrivalEarliest ||
        firstStop.windowStart ||
        firstStop.startTime ||
        pickupTime;

      destFacility =
        lastStop.facilityCode ||
        lastStop.facilityId ||
        lastStop.destFacilityCode ||
        lastStop.locationCode ||
        lastStop.destCode ||
        destFacility;

      destCity =
        lastStop.city ||
        lastStop.address?.city ||
        lastStop.location?.city ||
        lastStop.destCity ||
        destCity ||
        destFacility ||
        "Amazon Destination";

      destState =
        lastStop.state ||
        lastStop.address?.state ||
        lastStop.location?.state ||
        lastStop.destState ||
        destState;

      deliveryTime =
        lastStop.plannedArrivalTime ||
        lastStop.plannedDepartureTime ||
        lastStop.arrivalLatest ||
        lastStop.departureLatest ||
        lastStop.windowEnd ||
        lastStop.endTime ||
        deliveryTime;
    }

    pickupTime = normalizeDate(pickupTime, 2);
    deliveryTime = normalizeDate(deliveryTime, 16);

    // Normalize each stop into structured TourStop
    const normalizedStops = [];
    if (rawStops.length > 0) {
      rawStops.forEach((s, idx) => {
        if (!s || typeof s !== "object") return;
        const facCode =
          s.facilityCode ||
          s.facilityId ||
          s.locationCode ||
          s.nodeCode ||
          s.originFacilityCode ||
          s.destFacilityCode ||
          s.facility?.code ||
          s.facility?.facilityCode ||
          "";

        const c =
          s.city ||
          s.address?.city ||
          s.location?.city ||
          s.facility?.city ||
          (idx === 0 ? originCity : idx === rawStops.length - 1 ? destCity : "") ||
          facCode ||
          `Stop ${idx + 1}`;

        const st =
          s.state ||
          s.address?.state ||
          s.location?.state ||
          s.facility?.state ||
          (idx === 0 ? originState : idx === rawStops.length - 1 ? destState : "US");

        const rawActivity = String(
          s.activity || s.activityType || s.workType || s.stopType || s.type || ""
        ).toLowerCase();

        let stopType = idx === 0 ? "pickup" : idx === rawStops.length - 1 ? "delivery" : "intermediate";
        if (rawActivity.includes("drop") || rawActivity.includes("hook")) {
          stopType = "drop_hook";
        } else if (rawActivity.includes("pickup") || rawActivity.includes("load")) {
          stopType = "pickup";
        } else if (rawActivity.includes("delivery") || rawActivity.includes("unload")) {
          stopType = "delivery";
        }

        const rawStopStatus = String(s.status || s.executionStatus || s.stopStatus || "").toUpperCase();
        let stopStatus = "pending";
        if (rawStopStatus.includes("COMPLET") || rawStopStatus.includes("DONE") || rawStopStatus.includes("FINISHED")) {
          stopStatus = "completed";
        } else if (rawStopStatus.includes("ARRIV") || rawStopStatus.includes("DOCK")) {
          stopStatus = "arrived";
        } else if (rawStopStatus.includes("TRANSIT") || rawStopStatus.includes("EN_ROUTE") || rawStopStatus.includes("ACTIVE")) {
          stopStatus = "en_route";
        } else if (rawStopStatus.includes("DELAY") || rawStopStatus.includes("LATE")) {
          stopStatus = "delayed";
        }

        const apptTime =
          s.plannedDepartureTime ||
          s.plannedArrivalTime ||
          s.appointmentTime ||
          s.arrivalTimeWindow?.start ||
          s.windowStart ||
          s.departureEarliest ||
          s.arrivalEarliest ||
          s.startTime ||
          s.plannedTime ||
          "";

        normalizedStops.push({
          sequenceNumber: idx + 1,
          type: stopType,
          activity: rawActivity || (idx === 0 ? "pickup" : idx === rawStops.length - 1 ? "delivery" : "intermediate"),
          facilityCode: facCode || undefined,
          facilityName: s.facilityName || s.locationName || s.name || s.facility?.name || undefined,
          address: typeof s.address === "string" ? s.address : (s.address?.streetAddress || s.address?.addressLine1 || s.location?.addressLine1 || undefined),
          city: c,
          state: st,
          postalCode: s.postalCode || s.zip || s.address?.postalCode || s.address?.zipCode || undefined,
          appointmentTime: normalizeDate(apptTime, idx === 0 ? 2 : idx * 3 + 2),
          arrivalTimeWindowStart: s.arrivalTimeWindow?.start || s.windowStart || undefined,
          arrivalTimeWindowEnd: s.arrivalTimeWindow?.end || s.windowEnd || undefined,
          status: stopStatus,
          notes: s.instructions || s.notes || s.specialInstructions || undefined,
        });
      });
    }

    // Distance in miles
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

    // 4. Equipment
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

    // 5. Weight
    const weightLbs =
      (item.weight && typeof item.weight.value === "number" ? item.weight.value : null) ||
      (typeof item.weightLbs === "number" ? item.weightLbs : 38000);

    // 6. Status
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
      originCity: originCity || originFacility || "Amazon Origin",
      originState,
      originFacilityCode: originFacility || undefined,
      pickupTime,
      destCity: destCity || destFacility || "Amazon Destination",
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
      notes: `Captured via Amazon Relay API Interceptor on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    };
  }

  function handlePossibleRelayData(data, sourceUrl) {
    if (!data) return;

    let candidateList = [];

    function findArrays(obj, depth = 0) {
      if (!obj || depth > 4) return;
      if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === "object") {
          candidateList.push(...obj);
        }
        return;
      }
      if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (
            key.toLowerCase().includes("tour") ||
            key.toLowerCase().includes("trip") ||
            key.toLowerCase().includes("workopportunit") ||
            key.toLowerCase().includes("load") ||
            key.toLowerCase().includes("schedule") ||
            key.toLowerCase().includes("item") ||
            key.toLowerCase().includes("edge") ||
            key.toLowerCase().includes("node") ||
            key.toLowerCase().includes("content") ||
            key.toLowerCase().includes("result")
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
      const item = raw && raw.node ? raw.node : raw;
      const tour = normalizeApiTour(item);
      if (tour && tour.vrid && !seenIds.has(tour.vrid)) {
        seenIds.add(tour.vrid);
        normalized.push(tour);
      }
    });

    if (normalized.length > 0) {
      console.log(`🚚 [Unique Dispatch] Intercepted ${normalized.length} tours from Relay API (${sourceUrl})`);
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
})();
