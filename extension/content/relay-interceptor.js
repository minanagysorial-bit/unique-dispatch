/**
 * Unique Dispatch - Amazon Relay Main-World Network Interceptor
 * Runs in the webpage context to passively intercept Amazon Relay's internal JSON API requests.
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

  function normalizeApiTour(item) {
    if (!item || typeof item !== "object") return null;

    // 1. Extract Trip ID / Tour ID / Work Opportunity ID
    const rawId =
      item.tourId ||
      item.tripId ||
      item.workOpportunityId ||
      item.loadId ||
      item.tourExecutionId ||
      item.vrid ||
      item.id ||
      item.tripNumber ||
      item.tourNumber ||
      "";

    const tripId = String(rawId).trim();
    if (!tripId || tripId.length < 3) return null;

    // 2. Extract Rate / Payout
    let rateUSD = 0;
    if (typeof item.totalPayout === "number") {
      rateUSD = item.totalPayout;
    } else if (item.payout && typeof item.payout.value === "number") {
      rateUSD = item.payout.value;
    } else if (item.rate && typeof item.rate.amount === "number") {
      rateUSD = item.rate.amount;
    } else if (typeof item.rateUSD === "number") {
      rateUSD = item.rateUSD;
    } else if (typeof item.payoutAmount === "number") {
      rateUSD = item.payoutAmount;
    }

    // 3. Extract Stops / Legs
    const stops = Array.isArray(item.stops)
      ? item.stops
      : Array.isArray(item.legs)
      ? item.legs
      : Array.isArray(item.workOpportunityLegs)
      ? item.workOpportunityLegs
      : [];

    let originFacility = item.originFacilityCode || item.originFacility || "";
    let originCity = item.originCity || "";
    let originState = item.originState || "US";
    let pickupTime = item.pickupTime || item.startTime || "";

    let destFacility = item.destFacilityCode || item.destinationFacility || "";
    let destCity = item.destCity || "";
    let destState = item.destState || "US";
    let deliveryTime = item.deliveryTime || item.endTime || "";

    if (stops.length > 0) {
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];

      originFacility =
        firstStop.facilityCode ||
        firstStop.facilityId ||
        firstStop.originFacilityCode ||
        firstStop.locationCode ||
        originFacility;

      originCity =
        firstStop.city ||
        firstStop.address?.city ||
        firstStop.location?.city ||
        originCity ||
        originFacility ||
        "ORIGIN";

      originState =
        firstStop.state ||
        firstStop.address?.state ||
        firstStop.location?.state ||
        originState;

      pickupTime =
        firstStop.plannedDepartureTime ||
        firstStop.plannedArrivalTime ||
        firstStop.departureEarliest ||
        firstStop.arrivalEarliest ||
        firstStop.windowStart ||
        pickupTime;

      destFacility =
        lastStop.facilityCode ||
        lastStop.facilityId ||
        lastStop.destFacilityCode ||
        lastStop.locationCode ||
        destFacility;

      destCity =
        lastStop.city ||
        lastStop.address?.city ||
        lastStop.location?.city ||
        destCity ||
        destFacility ||
        "DEST";

      destState =
        lastStop.state ||
        lastStop.address?.state ||
        lastStop.location?.state ||
        destState;

      deliveryTime =
        lastStop.plannedArrivalTime ||
        lastStop.plannedDepartureTime ||
        lastStop.arrivalLatest ||
        lastStop.departureLatest ||
        lastStop.windowEnd ||
        deliveryTime;
    }

    // Default timestamps if missing from API
    const now = Date.now();
    if (!pickupTime) pickupTime = new Date(now + 2 * 3600 * 1000).toISOString();
    if (!deliveryTime) deliveryTime = new Date(now + 16 * 3600 * 1000).toISOString();

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
    const rawStatus = String(item.status || item.executionStatus || "").toUpperCase();
    if (rawStatus.includes("TRANSIT") || rawStatus.includes("EN_ROUTE") || rawStatus.includes("ACTIVE")) {
      status = "in_transit";
    } else if (rawStatus.includes("COMPLET") || rawStatus.includes("DELIVER")) {
      status = "delivered";
    } else if (rawStatus.includes("DELAY")) {
      status = "delayed";
    } else if (rawStatus.includes("CANCEL")) {
      status = "cancelled";
    }

    return {
      vrid: tripId,
      source: "amazon_relay",
      equipment,
      rateUSD: rateUSD > 0 ? rateUSD : 0,
      weightLbs,
      originCity: originCity || originFacility || "Amazon Origin",
      originState,
      originFacilityCode: originFacility || undefined,
      pickupTime,
      destCity: destCity || destFacility || "Amazon Destination",
      destState,
      destFacilityCode: destFacility || undefined,
      deliveryTime,
      status,
      driverName: item.driverName || item.assignedDriver?.name || "Assigned Driver",
      driverPhone: item.driverPhone || item.assignedDriver?.phone || "+1 (555) 000-0000",
      tractorNumber: item.tractorNumber || item.vehicleId || "UD-TBD",
      trailerNumber: item.trailerNumber || "TR-TBD",
      carrierName: item.carrierName || "Unique Dispatch Fleet",
      carrierMcDot: item.carrierMcDot || "MC-ACTIVE",
      notes: `Captured via Amazon Relay API Interceptor at ${new Date().toLocaleTimeString()}`,
    };
  }

  function handlePossibleRelayData(data, sourceUrl) {
    if (!data) return;

    let candidateList = [];

    if (Array.isArray(data)) {
      candidateList = data;
    } else if (typeof data === "object") {
      if (Array.isArray(data.tours)) candidateList = data.tours;
      else if (Array.isArray(data.trips)) candidateList = data.trips;
      else if (Array.isArray(data.workOpportunities)) candidateList = data.workOpportunities;
      else if (Array.isArray(data.loads)) candidateList = data.loads;
      else if (Array.isArray(data.items)) candidateList = data.items;
      else if (Array.isArray(data.content)) candidateList = data.content;
      else if (data.data && typeof data.data === "object") {
        // GraphQL response
        for (const k of Object.keys(data.data)) {
          const val = data.data[k];
          if (Array.isArray(val)) {
            candidateList = val;
            break;
          } else if (val && typeof val === "object") {
            if (Array.isArray(val.tours || val.trips || val.workOpportunities || val.items || val.edges)) {
              candidateList = val.tours || val.trips || val.workOpportunities || val.items || val.edges;
              break;
            }
          }
        }
      }
    }

    if (candidateList.length === 0) return;

    const normalized = [];
    const seenIds = new Set();

    candidateList.forEach((raw) => {
      // If edges format (GraphQL)
      const item = raw.node ? raw.node : raw;
      const tour = normalizeApiTour(item);
      if (tour && tour.vrid && !seenIds.has(tour.vrid)) {
        seenIds.add(tour.vrid);
        normalized.push(tour);
      }
    });

    if (normalized.length > 0) {
      console.log(`🚚 [Unique Dispatch] Intercepted ${normalized.length} active tours from Relay API (${sourceUrl})`);
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
      if (
        url.includes("relay.amazon.com") ||
        url.includes("/api/") ||
        url.includes("graphql") ||
        url.includes("tour") ||
        url.includes("trip") ||
        url.includes("work-opportunities") ||
        url.includes("loadboard")
      ) {
        const clone = response.clone();
        clone
          .text()
          .then((text) => {
            const parsed = safeParseJson(text);
            if (parsed) {
              handlePossibleRelayData(parsed, url);
            }
          })
          .catch(() => {});
      }
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
        if (
          url.includes("relay.amazon.com") ||
          url.includes("/api/") ||
          url.includes("graphql") ||
          url.includes("tour") ||
          url.includes("trip") ||
          url.includes("work-opportunities") ||
          url.includes("loadboard")
        ) {
          const text = this.responseText;
          if (text && (text.startsWith("{") || text.startsWith("["))) {
            const parsed = safeParseJson(text);
            if (parsed) {
              handlePossibleRelayData(parsed, url);
            }
          }
        }
      } catch (e) {}
    });
    return origSend.apply(this, arguments);
  };
})();
