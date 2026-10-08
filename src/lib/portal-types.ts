export type UserRole = "super_admin" | "dispatcher";

export type ShiftType = "morning" | "afternoon" | "night" | "custom" | string;

export interface ShiftDefinition {
  id: string;
  name: string;
  startTime: string; // "06:00"
  endTime: string; // "14:00"
  timezone?: string; // "EST"
  color?: string; // "amber" | "blue" | "indigo" | "emerald" | "purple"
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  rawPassword?: string; // Stored for Super Admin credential distribution
  role: UserRole;
  avatar?: string;
  assignedShift?: ShiftType;
  shiftStartTime?: string; // e.g. "06:00"
  shiftEndTime?: string; // e.g. "14:00"
  shiftTimeRange?: string; // e.g. "06:00 AM - 02:00 PM EST"
  isActive: boolean;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export type LoadStatus =
  | "upcoming"
  | "en_route_pickup"
  | "at_pickup"
  | "in_transit"
  | "at_delivery"
  | "delivered"
  | "delayed"
  | "critical_alert"
  | "cancelled";

export type EquipmentType =
  | "Dry Van (53')"
  | "Reefer (53')"
  | "Flatbed"
  | "Step Deck"
  | "26ft Box Truck"
  | "Power Only";

export type MilestoneType =
  | "pickup_checkin_3_5h"
  | "at_pickup_verify"
  | "in_transit_checkin"
  | "delivery_checkin_30m"
  | "at_delivery_verify"
  | "pod_bol_collection";

export interface MessageLog {
  id: string;
  loadId: string;
  dispatcherId: string;
  dispatcherName: string;
  driverName: string;
  driverPhone: string;
  milestone: MilestoneType;
  messageContent: string;
  channel: "sms" | "whatsapp" | "openphone" | "manual";
  status: "sent" | "failed" | "acknowledged";
  sentAt: string;
  responseTimeMin?: number;
}

export type IncidentCategory =
  | "breakdown"
  | "layover"
  | "detention"
  | "weather"
  | "facility_delay"
  | "roc_delay"
  | "driver_emergency"
  | "refused_load";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "open" | "under_investigation" | "resolved" | "claim_filed";

export interface IncidentReport {
  id: string;
  loadId: string;
  loadVrid: string;
  reportedBy: string;
  reportedById: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location?: string;
  description: string;
  actionsTaken?: string;
  detentionHours?: number;
  claimAmountUSD?: number;
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export type StopActivityType =
  | "pickup"
  | "drop_empty"
  | "hook_loaded"
  | "drop_loaded"
  | "hook_empty"
  | "live_load"
  | "live_unload"
  | "delivery"
  | "intermediate"
  | string;

export interface TourStop {
  sequenceNumber: number; // 1, 2, 3...
  type: "pickup" | "delivery" | "intermediate" | "drop_hook";
  activity?: StopActivityType;
  facilityCode?: string; // e.g. JFK8, TEB9, ABE8
  facilityName?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  appointmentTime?: string; // ISO 8601 string
  arrivalTimeWindowStart?: string;
  arrivalTimeWindowEnd?: string;
  status?: "pending" | "en_route" | "arrived" | "completed" | "delayed";
  notes?: string;
}

export interface Load {
  id: string;
  vrid: string; // e.g. VRID-9482710 or AMZ-883921
  source: "amazon_relay" | "dat_power" | "truckstop" | "direct_shipper" | "manual_import";
  equipment: EquipmentType;
  rateUSD: number;
  weightLbs: number;
  distanceMiles?: number;
  totalStopsCount?: number;
  
  // Locations & Schedule
  originCity: string;
  originState: string;
  originAddress?: string;
  originFacilityCode?: string; // e.g. JFK8, MDW2
  pickupTime: string; // ISO 8601 string

  destCity: string;
  destState: string;
  destAddress?: string;
  destFacilityCode?: string; // e.g. CLT4, DFW7
  deliveryTime: string; // ISO 8601 string

  // Full Multi-Stop Itinerary / Journey Route
  stops?: TourStop[];

  // Driver & Vehicle
  driverName: string;
  driverPhone: string;
  tractorNumber: string;
  trailerNumber: string;
  carrierName?: string;
  carrierMcDot?: string;

  // Operational state
  status: LoadStatus;
  currentShift: ShiftType;
  assignedDispatcherId: string;
  assignedDispatcherName: string;
  
  // Milestones timestamps & checks
  pickupCheckinSent: boolean;
  pickupCheckinSentAt?: string;
  deliveryCheckinSent: boolean;
  deliveryCheckinSentAt?: string;
  
  // Urgent flags
  isCriticalAlert: boolean;
  alertReason?: string;
  hasActiveIncident: boolean;
  incidentCount: number;

  // Ordering and visual screen position
  screenIndex?: number;

  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ShiftHandover {
  id: string;
  fromDispatcherId: string;
  fromDispatcherName: string;
  toShift: ShiftType;
  fromShift: ShiftType;
  date: string;
  activeLoadsCount: number;
  criticalLoadsCount: number;
  watchItems: string[];
  generalNotes: string;
  submittedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: "load" | "incident" | "message" | "shift" | "user" | "sync";
  targetId?: string;
  details: string;
  ipAddress?: string;
}

export interface DispatcherKpi {
  dispatcherId: string;
  dispatcherName: string;
  avatar?: string;
  assignedShift: ShiftType;
  totalLoadsHandled: number;
  onTimeMessageCompliancePct: number; // e.g. 98.4%
  avgIncidentResponseMinutes: number; // e.g. 8.2 mins
  pickupCheckinCompliancePct: number;
  deliveryCheckinCompliancePct: number;
  incidentsResolved: number;
  activeLoadsCurrent: number;
}

export interface BatchSyncPayload {
  apiKey: string;
  source: "chrome_extension_amazon_relay" | "csv_import" | "api_integration";
  shift?: ShiftType;
  mode?: "upsert" | "replace_all" | "clear";
  loads: Array<{
    vrid: string;
    source?: "amazon_relay" | "dat_power" | "truckstop" | "direct_shipper" | "manual_import";
    equipment?: EquipmentType;
    rateUSD?: number;
    weightLbs?: number;
    distanceMiles?: number;
    totalStopsCount?: number;
    originCity: string;
    originState: string;
    originAddress?: string;
    originFacilityCode?: string;
    pickupTime: string;
    destCity: string;
    destState: string;
    destAddress?: string;
    destFacilityCode?: string;
    deliveryTime: string;
    stops?: TourStop[];
    driverName?: string;
    driverPhone?: string;
    tractorNumber?: string;
    trailerNumber?: string;
    carrierName?: string;
    carrierMcDot?: string;
    status?: LoadStatus;
    screenIndex?: number;
    notes?: string;
  }>;
}
