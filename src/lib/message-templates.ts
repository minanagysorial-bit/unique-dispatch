import { Load, MilestoneType } from "./portal-types";

export interface GeneratedTemplate {
  title: string;
  milestone: MilestoneType;
  smsContent: string;
  whatsappUrl: string;
  urgency: "normal" | "warning" | "critical";
  description: string;
}

export function formatTimeDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    }) + " EST";
  } catch (e) {
    return isoString;
  }
}

export function formatDateDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });
  } catch (e) {
    return isoString;
  }
}

export function generateMilestoneTemplate(load: Load, milestone: MilestoneType): GeneratedTemplate {
  const pickupTimeStr = `${formatDateDisplay(load.pickupTime)} @ ${formatTimeDisplay(load.pickupTime)}`;
  const deliveryTimeStr = `${formatDateDisplay(load.deliveryTime)} @ ${formatTimeDisplay(load.deliveryTime)}`;
  const originLoc = load.originFacilityCode 
    ? `${load.originFacilityCode} (${load.originCity}, ${load.originState})`
    : `${load.originCity}, ${load.originState}`;
  const destLoc = load.destFacilityCode
    ? `${load.destFacilityCode} (${load.destCity}, ${load.destState})`
    : `${load.destCity}, ${load.destState}`;

  const cleanPhone = load.driverPhone.replace(/[^0-9]/g, "");

  switch (milestone) {
    case "pickup_checkin_3_5h": {
      const sms = `🚨 UNIQUE DISPATCH 3.5H CHECK-IN\nHey ${load.driverName}, checking in for Load #${load.vrid}.\n📍 Origin: ${originLoc}\n⏰ Scheduled Pickup: ${pickupTimeStr}\n🚛 Tractor: ${load.tractorNumber} | Trailer: ${load.trailerNumber}\n\nAre you rolling and on-track for on-time arrival? Please reply with your current location and confirmed ETA.`;
      
      const whatsapp = `https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}?text=${encodeURIComponent(sms)}`;

      return {
        title: "3.5-Hour Pre-Pickup Check-In",
        milestone: "pickup_checkin_3_5h",
        smsContent: sms,
        whatsappUrl: whatsapp,
        urgency: "warning",
        description: "Mandatory pre-trip milestone to guarantee driver is awake, rolling, and on schedule.",
      };
    }

    case "at_pickup_verify": {
      const sms = `📍 UNIQUE DISPATCH - ARRIVED PICKUP\nHey ${load.driverName}, confirming arrival at ${originLoc} for Load #${load.vrid}.\n\nPlease reply with your Dock/Door # once assigned. If loading takes more than 1.5 hours, message us immediately so we start your detention clock with the broker.`;
      
      const whatsapp = `https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}?text=${encodeURIComponent(sms)}`;

      return {
        title: "At-Pickup / Dock Assignment",
        milestone: "at_pickup_verify",
        smsContent: sms,
        whatsappUrl: whatsapp,
        urgency: "normal",
        description: "Track door check-in time and start detention countdown if delay occurs.",
      };
    }

    case "in_transit_checkin": {
      const sms = `🛣️ UNIQUE DISPATCH - IN-TRANSIT UPDATE\nHey ${load.driverName}, tracking update for Load #${load.vrid}.\n🎯 Destination: ${destLoc}\n⏰ Scheduled Delivery: ${deliveryTimeStr}\n\nPlease reply with your current city/mile marker and estimated delivery time. Drive safe!`;

      const whatsapp = `https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}?text=${encodeURIComponent(sms)}`;

      return {
        title: "In-Transit Mid-Route Check-In",
        milestone: "in_transit_checkin",
        smsContent: sms,
        whatsappUrl: whatsapp,
        urgency: "normal",
        description: "Verify mid-route progress and ensure Hours-of-Service compliance.",
      };
    }

    case "delivery_checkin_30m": {
      const sms = `📦 UNIQUE DISPATCH 30M DELIVERY ALERT\nHey ${load.driverName}, you are ~30 mins from delivery at ${destLoc} for Load #${load.vrid}.\n\n⚠️ IMPORTANT REMINDER:\n1. Ensure the receiver stamps and signs the BOL with legible date & time.\n2. Note any seal discrepancy immediately.\n3. Take a clear photo of the signed BOL and send it right after unloading.`;

      const whatsapp = `https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}?text=${encodeURIComponent(sms)}`;

      return {
        title: "30-Minute Pre-Delivery Alert",
        milestone: "delivery_checkin_30m",
        smsContent: sms,
        whatsappUrl: whatsapp,
        urgency: "warning",
        description: "Delivery preparation, BOL documentation reminder, and receiver instructions.",
      };
    }

    case "at_delivery_verify": {
      const sms = `🏁 UNIQUE DISPATCH - AT RECEIVER\nHey ${load.driverName}, confirming arrival at receiver ${destLoc} for Load #${load.vrid}.\n\nLet us know your dock number. Remember to get the signed BOL before pulling away from the dock!`;

      const whatsapp = `https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}?text=${encodeURIComponent(sms)}`;

      return {
        title: "At-Delivery Verification",
        milestone: "at_delivery_verify",
        smsContent: sms,
        whatsappUrl: whatsapp,
        urgency: "normal",
        description: "Verify arrival at receiver gate and dock.",
      };
    }

    case "pod_bol_collection": {
      const sms = `📑 UNIQUE DISPATCH - BOL / POD COLLECTION\nHey ${load.driverName}, congrats on completing Load #${load.vrid}!\n\nPlease send the clear photo/scan of the signed BOL/POD now so we can submit for same-day factoring funding and book your next load. Thank you!`;

      const whatsapp = `https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}?text=${encodeURIComponent(sms)}`;

      return {
        title: "BOL / POD Paperwork Collection",
        milestone: "pod_bol_collection",
        smsContent: sms,
        whatsappUrl: whatsapp,
        urgency: "normal",
        description: "Collect signed Proof of Delivery (POD) for fast factoring submission.",
      };
    }

    default:
      return {
        title: "Standard Operational Check-in",
        milestone,
        smsContent: `Hey ${load.driverName}, checking in regarding Load #${load.vrid}. Please reply with your status update.`,
        whatsappUrl: `https://wa.me/${cleanPhone}?text=Hello`,
        urgency: "normal",
        description: "General dispatch message",
      };
  }
}
