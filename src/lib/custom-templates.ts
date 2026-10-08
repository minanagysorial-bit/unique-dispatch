import { Load } from "./portal-types";
import { formatDateDisplay, formatTimeDisplay } from "./message-templates";

export interface CustomTemplate {
  id: string;
  name: string;
  milestoneKey?: string;
  category: "pre_trip" | "pickup" | "in_transit" | "delivery" | "paperwork" | "custom";
  description: string;
  templateText: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATES_STORAGE_KEY = "unique_dispatch_custom_templates_v1";

export const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    id: "tpl-pickup-3-5h",
    name: "3.5H Pre-Pickup Check-In (قبل التحميل بـ 3.5 ساعات)",
    milestoneKey: "pickup_checkin_3_5h",
    category: "pre_trip",
    description: "فحص جاهزية السائق والتأكد من انطلاقه في الطريق قبل ميعاد التحميل",
    templateText: `🚨 UNIQUE DISPATCH 3.5H CHECK-IN
Hey {driverName}, checking in for Load #{vrid}.
📍 Origin: {originFacility} ({originCity}, {originState})
⏰ Scheduled Pickup: {pickupDate} @ {pickupTime}
🚛 Tractor: {tractorNumber} | Trailer: {trailerNumber}

Are you rolling and on-track for on-time arrival? Please reply with your current location and confirmed ETA.`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-at-pickup",
    name: "At-Pickup / Door Check-In (الوصول لموقع التحميل)",
    milestoneKey: "at_pickup_verify",
    category: "pickup",
    description: "تأكيد وصول السائق للشيبر وطلب رقم الباب Dock/Door",
    templateText: `📍 UNIQUE DISPATCH - ARRIVED PICKUP
Hey {driverName}, confirming arrival at {originFacility} ({originCity}, {originState}) for Load #{vrid}.

Please reply with your Dock/Door # once assigned. If loading takes more than 1.5 hours, message us immediately so we start your detention clock with the broker.`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-in-transit",
    name: "In-Transit Mid-Route Update (متابعة السائق في الطريق)",
    milestoneKey: "in_transit_checkin",
    category: "in_transit",
    description: "متابعة خط سير الرحلة والتأكد من عدم وجود تأخير أو عطل",
    templateText: `🛣️ UNIQUE DISPATCH - IN-TRANSIT UPDATE
Hey {driverName}, tracking update for Load #{vrid}.
🎯 Destination: {destFacility} ({destCity}, {destState})
⏰ Scheduled Delivery: {deliveryDate} @ {deliveryTime}

Please reply with your current city/mile marker and estimated delivery time. Drive safe!`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-delivery-30m",
    name: "30-Min Pre-Delivery Alert (قبل الوصول للتسليم بـ 30 دقيقة)",
    milestoneKey: "delivery_checkin_30m",
    category: "delivery",
    description: "تنبيه قرب الوصول وتجهيز أوراق الـ BOL وتأكيد التوقيع والختم",
    templateText: `📦 UNIQUE DISPATCH 30M DELIVERY ALERT
Hey {driverName}, you are ~30 mins from delivery at {destFacility} ({destCity}, {destState}) for Load #{vrid}.

⚠️ IMPORTANT REMINDER:
1. Ensure receiver stamps & signs BOL with legible date & time.
2. Note any seal discrepancy immediately.
3. Take a clear photo of signed BOL right after unloading.`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-at-delivery",
    name: "At-Delivery Verification (الوصول لموقع التسليم)",
    milestoneKey: "at_delivery_verify",
    category: "delivery",
    description: "تأكيد وصول السائق للريسيفر ورقم رصيف التنزيل",
    templateText: `🏁 UNIQUE DISPATCH - AT RECEIVER
Hey {driverName}, confirming arrival at receiver {destFacility} ({destCity}, {destState}) for Load #{vrid}.

Let us know your dock number. Remember to get the signed BOL before pulling away from the dock!`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-pod-bol",
    name: "BOL / POD Paperwork Collection (طلب بوليصة الشحن الموقعة)",
    milestoneKey: "pod_bol_collection",
    category: "paperwork",
    description: "طلب صورة بوليصة الشحن (BOL) الموقعة فوراً لرفعها لشركة الفاكتورينج",
    templateText: `📑 UNIQUE DISPATCH - BOL / POD COLLECTION
Hey {driverName}, congrats on completing Load #{vrid}!

Please send the clear photo/scan of the signed BOL/POD now so we can submit for same-day factoring funding and book your next load. Thank you!`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tpl-detention-alert",
    name: "Detention Pay Notice (تنبيه وقت الانتظار والـ Detention)",
    category: "custom",
    description: "تنبيه السائق بتوثيق وقت الانتظار للمطالبة بفلوس الـ Detention",
    templateText: `⏳ UNIQUE DISPATCH - DETENTION TRACKING
Hey {driverName}, we have recorded your arrival at {originFacility}.

If loading takes more than 2 hours, please take a photo of your signed in-time stamp on the BOL so we can claim your detention pay from the broker.`,
    isDefault: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const TEMPLATE_VARIABLES = [
  { tag: "{driverName}", label: "اسم السائق (Driver Name)", example: "John Doe" },
  { tag: "{driverPhone}", label: "رقم السائق (Driver Phone)", example: "+1 (555) 019-2834" },
  { tag: "{vrid}", label: "رقم الشحنة (VRID / Load #)", example: "VRID-9482710" },
  { tag: "{originCity}", label: "مدينة التحميل (Origin City)", example: "Staten Island" },
  { tag: "{originState}", label: "ولاية التحميل (Origin State)", example: "NY" },
  { tag: "{originFacility}", label: "كود منشأة التحميل (Origin Facility)", example: "JFK8" },
  { tag: "{pickupDate}", label: "تاريخ التحميل (Pickup Date)", example: "Oct 8" },
  { tag: "{pickupTime}", label: "وقت التحميل (Pickup Time)", example: "02:30 PM EST" },
  { tag: "{destCity}", label: "مدينة التسليم (Dest City)", example: "Joliet" },
  { tag: "{destState}", label: "ولاية التسليم (Dest State)", example: "IL" },
  { tag: "{destFacility}", label: "كود منشأة التسليم (Dest Facility)", example: "MDW2" },
  { tag: "{deliveryDate}", label: "تاريخ التسليم (Delivery Date)", example: "Oct 9" },
  { tag: "{deliveryTime}", label: "وقت التسليم (Delivery Time)", example: "08:00 AM EST" },
  { tag: "{equipment}", label: "نوع المعدة (Equipment)", example: "Dry Van (53')" },
  { tag: "{tractorNumber}", label: "رقم الجرار (Tractor #)", example: "UD-104" },
  { tag: "{trailerNumber}", label: "رقم المقطورة (Trailer #)", example: "TR-5389" },
  { tag: "{carrierName}", label: "اسم الشركة الناقلة (Carrier)", example: "Apex Logistics" },
  { tag: "{rateUSD}", label: "سعر النولون (Rate USD)", example: "$3,450" },
  { tag: "{dispatcherName}", label: "اسم الدسباتشر (Dispatcher)", example: "Alex Reed" },
];

/**
 * Loads templates from localStorage with fallback to DEFAULT_TEMPLATES
 */
export function getSavedTemplates(): CustomTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_TEMPLATES;
  } catch (e) {
    console.error("Failed to load custom templates from localStorage:", e);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Saves templates to localStorage
 */
export function saveTemplates(templates: CustomTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("Failed to save templates to localStorage:", e);
  }
}

/**
 * Dynamically replaces all placeholders in a template with actual load properties
 */
export function renderTemplateWithLoad(templateText: string, load: Load, dispatcherName?: string): string {
  const pickupTime = formatTimeDisplay(load.pickupTime);
  const pickupDate = formatDateDisplay(load.pickupTime);
  const deliveryTime = formatTimeDisplay(load.deliveryTime);
  const deliveryDate = formatDateDisplay(load.deliveryTime);

  const originFacility = load.originFacilityCode || load.originCity;
  const destFacility = load.destFacilityCode || load.destCity;

  let result = templateText;

  result = result.replace(/\{driverName\}/g, load.driverName || "Driver");
  result = result.replace(/\{driverPhone\}/g, load.driverPhone || "");
  result = result.replace(/\{vrid\}/g, load.vrid || "");
  result = result.replace(/\{originCity\}/g, load.originCity || "");
  result = result.replace(/\{originState\}/g, load.originState || "");
  result = result.replace(/\{originAddress\}/g, load.originAddress || "");
  result = result.replace(/\{originFacility\}/g, originFacility);
  result = result.replace(/\{pickupTime\}/g, pickupTime);
  result = result.replace(/\{pickupDate\}/g, pickupDate);
  result = result.replace(/\{destCity\}/g, load.destCity || "");
  result = result.replace(/\{destState\}/g, load.destState || "");
  result = result.replace(/\{destAddress\}/g, load.destAddress || "");
  result = result.replace(/\{destFacility\}/g, destFacility);
  result = result.replace(/\{deliveryTime\}/g, deliveryTime);
  result = result.replace(/\{deliveryDate\}/g, deliveryDate);
  result = result.replace(/\{equipment\}/g, load.equipment || "");
  result = result.replace(/\{tractorNumber\}/g, load.tractorNumber || "");
  result = result.replace(/\{trailerNumber\}/g, load.trailerNumber || "");
  result = result.replace(/\{carrierName\}/g, load.carrierName || "Unique Dispatch");
  result = result.replace(/\{carrierMcDot\}/g, load.carrierMcDot || "");
  result = result.replace(/\{rateUSD\}/g, `$${(load.rateUSD || 0).toLocaleString()}`);
  result = result.replace(/\{dispatcherName\}/g, load.assignedDispatcherName || dispatcherName || "Unique Dispatch Ops");

  return result;
}

/**
 * Generates WhatsApp Web deep-link for a rendered message and phone number
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("1") ? cleanPhone : `1${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
