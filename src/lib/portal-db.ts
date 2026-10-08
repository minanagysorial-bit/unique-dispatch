import fs from "fs";
import path from "path";
import {
  User,
  Load,
  IncidentReport,
  MessageLog,
  ShiftHandover,
  AuditLog,
  DispatcherKpi,
  ShiftType,
  ShiftDefinition,
  LoadStatus,
  MilestoneType,
  IncidentCategory,
  IncidentSeverity,
  BatchSyncPayload,
} from "./portal-types";

// Seed Shift Definitions (Customizable Time Ranges)
const SEED_SHIFTS: ShiftDefinition[] = [
  {
    id: "shift-morning",
    name: "Morning Shift",
    startTime: "06:00",
    endTime: "14:00",
    timezone: "EST",
    color: "amber",
    description: "Early morning carrier check-ins, load assignments & pre-trip validations.",
  },
  {
    id: "shift-afternoon",
    name: "Afternoon Shift",
    startTime: "14:00",
    endTime: "22:00",
    timezone: "EST",
    color: "blue",
    description: "Peak transit tracking, broker ETA adjustments & delivery check-ins.",
  },
  {
    id: "shift-night",
    name: "Night Shift",
    startTime: "22:00",
    endTime: "06:00",
    timezone: "EST",
    color: "indigo",
    description: "Overnight long-haul monitoring, breakdown support & ROC escalation.",
  },
];

// Seed Users with high-grade PBKDF2 cryptographic password hashes and rawPassword for Super Admin distribution
const SEED_USERS: User[] = [
  {
    id: "usr-admin-01",
    name: "Marven Awad",
    email: "admin@uniquedispatch.com",
    passwordHash: "a841a939a0b4c890d234bf460b14b14f:91391129a1e3a83a511f05ef99cee84ea711b2f283cc8c9358a86018fd35c3a1c4fedc4769344b9f72113f29928f3ad9773e3e0ad6cb4cda369772eb35c359aa",
    rawPassword: "UniqueAdmin2026!",
    role: "super_admin",
    phone: "+1 (332) 244-5532",
    shiftTimeRange: "24/7 Governance",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-admin-02",
    name: "Marven Awad",
    email: "uniquedispatchh@gmail.com",
    passwordHash: "a841a939a0b4c890d234bf460b14b14f:91391129a1e3a83a511f05ef99cee84ea711b2f283cc8c9358a86018fd35c3a1c4fedc4769344b9f72113f29928f3ad9773e3e0ad6cb4cda369772eb35c359aa",
    rawPassword: "UniqueAdmin2026!",
    role: "super_admin",
    phone: "+1 (332) 244-5532",
    shiftTimeRange: "24/7 Governance",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-admin-03",
    name: "Marven Awad",
    email: "marvengerges2008@gmail.com",
    passwordHash: "a841a939a0b4c890d234bf460b14b14f:91391129a1e3a83a511f05ef99cee84ea711b2f283cc8c9358a86018fd35c3a1c4fedc4769344b9f72113f29928f3ad9773e3e0ad6cb4cda369772eb35c359aa",
    rawPassword: "UniqueAdmin2026!",
    role: "super_admin",
    phone: "+1 (332) 244-5532",
    shiftTimeRange: "24/7 Governance",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-disp-01",
    name: "Alex Reed",
    email: "dispatcher@uniquedispatch.com",
    passwordHash: "20c9ff94222d0c5b6513b7694c14db4b:273ca94bfe3114ef795d3d13be2d66fb74b07edb9e3ad37a7378ca516acffe60958bd20b480dbacd595a2255defa491ccc35be300fdeed4a45910db1d64db169",
    rawPassword: "Dispatch2026!",
    role: "dispatcher",
    assignedShift: "morning",
    shiftStartTime: "06:00",
    shiftEndTime: "14:00",
    shiftTimeRange: "06:00 AM - 02:00 PM EST",
    phone: "+1 (332) 244-5533",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "usr-disp-02",
    name: "Samir Vance",
    email: "nightops@uniquedispatch.com",
    passwordHash: "20c9ff94222d0c5b6513b7694c14db4b:273ca94bfe3114ef795d3d13be2d66fb74b07edb9e3ad37a7378ca516acffe60958bd20b480dbacd595a2255defa491ccc35be300fdeed4a45910db1d64db169",
    rawPassword: "Dispatch2026!",
    role: "dispatcher",
    assignedShift: "night",
    shiftStartTime: "22:00",
    shiftEndTime: "06:00",
    shiftTimeRange: "10:00 PM - 06:00 AM EST",
    phone: "+1 (332) 244-5534",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "usr-disp-03",
    name: "Elena Rostova",
    email: "elena@uniquedispatch.com",
    passwordHash: "20c9ff94222d0c5b6513b7694c14db4b:273ca94bfe3114ef795d3d13be2d66fb74b07edb9e3ad37a7378ca516acffe60958bd20b480dbacd595a2255defa491ccc35be300fdeed4a45910db1d64db169",
    rawPassword: "Dispatch2026!",
    role: "dispatcher",
    assignedShift: "afternoon",
    shiftStartTime: "14:00",
    shiftEndTime: "22:00",
    shiftTimeRange: "02:00 PM - 10:00 PM EST",
    phone: "+1 (332) 244-5535",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];

// Helper to generate dynamic timestamps relative to now
const nowMs = Date.now();
const hours = (h: number) => new Date(nowMs + h * 3600 * 1000).toISOString();
const mins = (m: number) => new Date(nowMs + m * 60 * 1000).toISOString();

// Seed Loads
const SEED_LOADS: Load[] = [
  {
    id: "load-001",
    vrid: "VRID-9482710",
    source: "amazon_relay",
    equipment: "Dry Van (53')",
    rateUSD: 3450.0,
    weightLbs: 38500,
    originCity: "Staten Island",
    originState: "NY",
    originAddress: "546 Gulf Ave",
    originFacilityCode: "JFK8",
    pickupTime: hours(2.2), // In 2.2 hours (Triggers 3.5h Checkin Alert!)
    destCity: "Joliet",
    destState: "IL",
    destAddress: "250 Emerald Dr",
    destFacilityCode: "MDW2",
    deliveryTime: hours(21),
    driverName: "Marcus Holloway",
    driverPhone: "+1 (312) 555-0192",
    tractorNumber: "UD-104",
    trailerNumber: "TR-5389",
    carrierName: "Apex Logistics LLC",
    carrierMcDot: "MC-1092834",
    status: "en_route_pickup",
    currentShift: "morning",
    assignedDispatcherId: "usr-disp-01",
    assignedDispatcherName: "Alex Reed",
    pickupCheckinSent: false, // Pending action!
    deliveryCheckinSent: false,
    isCriticalAlert: false,
    hasActiveIncident: false,
    incidentCount: 0,
    notes: "Amazon Relay dedicated block tour. High spot rate $3.82/mile. Driver confirmed pre-trip inspection.",
    createdAt: hours(-4),
    updatedAt: hours(-1),
  },
  {
    id: "load-002",
    vrid: "VRID-4182905",
    source: "amazon_relay",
    equipment: "Reefer (53')",
    rateUSD: 4200.0,
    weightLbs: 41200,
    originCity: "Fort Worth",
    originState: "TX",
    originAddress: "15201 Heritage Pkwy",
    originFacilityCode: "DFW7",
    pickupTime: hours(-3),
    destCity: "Atlanta",
    destState: "GA",
    destAddress: "2255 Highway 155",
    destFacilityCode: "ATL8",
    deliveryTime: hours(7.5),
    driverName: "Dave Kowalski",
    driverPhone: "+1 (214) 555-0841",
    tractorNumber: "UD-209",
    trailerNumber: "RF-8821",
    carrierName: "Kowalski Express",
    carrierMcDot: "MC-992140",
    status: "critical_alert",
    currentShift: "morning",
    assignedDispatcherId: "usr-disp-01",
    assignedDispatcherName: "Alex Reed",
    pickupCheckinSent: true,
    pickupCheckinSentAt: hours(-4.5),
    deliveryCheckinSent: false,
    isCriticalAlert: true,
    alertReason: "Tractor alternator failure I-20 East near Jackson, MS. Service truck dispatched. ETA delay 2.5 hours.",
    hasActiveIncident: true,
    incidentCount: 1,
    notes: "CRITICAL: Receiver notified of mechanical delay. ROC ticket #99401 submitted to prevent carrier score defect.",
    createdAt: hours(-8),
    updatedAt: mins(-15),
  },
  {
    id: "load-003",
    vrid: "VRID-7729104",
    source: "amazon_relay",
    equipment: "26ft Box Truck",
    rateUSD: 1850.0,
    weightLbs: 9400,
    originCity: "Charlotte",
    originState: "NC",
    originAddress: "8000 Tuckaseegee Rd",
    originFacilityCode: "CLT4",
    pickupTime: hours(-4),
    destCity: "Raleigh",
    destState: "NC",
    destAddress: "1201 Garner Station Blvd",
    destFacilityCode: "RDU1",
    deliveryTime: mins(25), // In 25 minutes (Triggers 30-min Delivery Alert!)
    driverName: "Tyrone Washington",
    driverPhone: "+1 (704) 555-0372",
    tractorNumber: "UD-BX12",
    trailerNumber: "LIFT-26",
    carrierName: "Queen City Haulers",
    carrierMcDot: "MC-120491",
    status: "in_transit",
    currentShift: "morning",
    assignedDispatcherId: "usr-disp-01",
    assignedDispatcherName: "Alex Reed",
    pickupCheckinSent: true,
    pickupCheckinSentAt: hours(-5),
    deliveryCheckinSent: false, // Pending delivery alert!
    isCriticalAlert: false,
    hasActiveIncident: false,
    incidentCount: 0,
    notes: "Expedited liftgate commercial route. Driver 14 miles out on I-40 East. Ready for BOL upload upon drop.",
    createdAt: hours(-6),
    updatedAt: mins(-5),
  },
  {
    id: "load-004",
    vrid: "VRID-3391820",
    source: "dat_power",
    equipment: "Flatbed",
    rateUSD: 2900.0,
    weightLbs: 45000,
    originCity: "Indianapolis",
    originState: "IN",
    originAddress: "4200 S Harding St",
    originFacilityCode: "IND-STEEL",
    pickupTime: mins(50), // Pickup in 50 mins
    destCity: "Nashville",
    destState: "TN",
    destAddress: "1400 Visco Dr",
    destFacilityCode: "BNA-IND",
    deliveryTime: hours(8),
    driverName: "Raul Gomez",
    driverPhone: "+1 (317) 555-0619",
    tractorNumber: "UD-FB07",
    trailerNumber: "FB-4890",
    carrierName: "Gomez Heavy Haul",
    carrierMcDot: "MC-883912",
    status: "at_pickup",
    currentShift: "morning",
    assignedDispatcherId: "usr-disp-03",
    assignedDispatcherName: "Elena Rostova",
    pickupCheckinSent: true,
    pickupCheckinSentAt: hours(-2),
    deliveryCheckinSent: false,
    isCriticalAlert: false,
    hasActiveIncident: false,
    incidentCount: 0,
    notes: "Tarp fee $150 approved on RateCon. Driver on scale at shipper. Detention clock armed after 2 hours.",
    createdAt: hours(-5),
    updatedAt: mins(-10),
  },
  {
    id: "load-005",
    vrid: "VRID-5510293",
    source: "amazon_relay",
    equipment: "Power Only",
    rateUSD: 2450.0,
    weightLbs: 0,
    originCity: "Seattle",
    originState: "WA",
    originAddress: "20526 59th Pl S",
    originFacilityCode: "SEA8",
    pickupTime: hours(-2),
    destCity: "Tracy",
    destState: "CA",
    destAddress: "25425 S Lammers Rd",
    destFacilityCode: "OAK4",
    deliveryTime: hours(14),
    driverName: "Boris Petrov",
    driverPhone: "+1 (206) 555-0914",
    tractorNumber: "UD-311",
    trailerNumber: "AMZ-PO-941",
    carrierName: "Cascadia Freight",
    carrierMcDot: "MC-773190",
    status: "in_transit",
    currentShift: "morning",
    assignedDispatcherId: "usr-disp-01",
    assignedDispatcherName: "Alex Reed",
    pickupCheckinSent: true,
    pickupCheckinSentAt: hours(-3.5),
    deliveryCheckinSent: false,
    isCriticalAlert: false,
    hasActiveIncident: false,
    incidentCount: 0,
    notes: "Amazon equipment repositioning. Trailer sealed at SEA8. Smooth run on I-5 South.",
    createdAt: hours(-7),
    updatedAt: hours(-1),
  },
  {
    id: "load-006",
    vrid: "VRID-6102941",
    source: "amazon_relay",
    equipment: "Dry Van (53')",
    rateUSD: 3100.0,
    weightLbs: 37000,
    originCity: "Orlando",
    originState: "FL",
    originAddress: "12340 Boggy Creek Rd",
    originFacilityCode: "MCO1",
    pickupTime: hours(6.5), // Night shift load
    destCity: "Richmond",
    destState: "VA",
    destAddress: "5000 Eport Dr",
    destFacilityCode: "RIC2",
    deliveryTime: hours(22),
    driverName: "Carlos Ramirez",
    driverPhone: "+1 (407) 555-0482",
    tractorNumber: "UD-118",
    trailerNumber: "TR-6612",
    carrierName: "Sunshine Express",
    carrierMcDot: "MC-654921",
    status: "upcoming",
    currentShift: "night",
    assignedDispatcherId: "usr-disp-02",
    assignedDispatcherName: "Samir Vance",
    pickupCheckinSent: false,
    deliveryCheckinSent: false,
    isCriticalAlert: false,
    hasActiveIncident: false,
    incidentCount: 0,
    notes: "Night dispatch assignment. 3.5h Checkin required at 19:30 EST.",
    createdAt: hours(-2),
    updatedAt: hours(-2),
  },
  {
    id: "load-007",
    vrid: "VRID-8819203",
    source: "truckstop",
    equipment: "Step Deck",
    rateUSD: 4800.0,
    weightLbs: 44000,
    originCity: "Houston",
    originState: "TX",
    originAddress: "9200 Clinton Dr",
    originFacilityCode: "HOU-PORT",
    pickupTime: hours(-18),
    destCity: "Cleveland",
    destState: "OH",
    destAddress: "3200 E 55th St",
    destFacilityCode: "CLE-IND",
    deliveryTime: hours(-2),
    driverName: "Dmitri Volkov",
    driverPhone: "+1 (713) 555-0992",
    tractorNumber: "UD-SD01",
    trailerNumber: "SD-5510",
    carrierName: "Volkov Heavy Transport",
    carrierMcDot: "MC-841920",
    status: "delivered",
    currentShift: "morning",
    assignedDispatcherId: "usr-disp-01",
    assignedDispatcherName: "Alex Reed",
    pickupCheckinSent: true,
    pickupCheckinSentAt: hours(-20),
    deliveryCheckinSent: true,
    deliveryCheckinSentAt: hours(-3),
    isCriticalAlert: false,
    hasActiveIncident: false,
    incidentCount: 0,
    notes: "Completed delivery. BOL stamped and verified. Sent to factoring for funding.",
    createdAt: hours(-24),
    updatedAt: hours(-2),
  },
];

// Seed Incidents
const SEED_INCIDENTS: IncidentReport[] = [
  {
    id: "inc-001",
    loadId: "load-002",
    loadVrid: "VRID-4182905",
    reportedBy: "Alex Reed",
    reportedById: "usr-disp-01",
    category: "breakdown",
    severity: "critical",
    status: "under_investigation",
    location: "I-20 East, Exit 94 (Jackson, MS)",
    description: "Tractor alternator failed while in transit. Driver pulled safely onto shoulder. Service mechanic dispatched.",
    actionsTaken: "Contacted TA Roadside Repair. Notified Amazon ROC Desk of ETA adjustment to avoid defect. Carrier insurance notified.",
    detentionHours: 2.5,
    claimAmountUSD: 450.0,
    reportedAt: mins(-45),
  },
  {
    id: "inc-002",
    loadId: "load-004",
    loadVrid: "VRID-3391820",
    reportedBy: "Elena Rostova",
    reportedById: "usr-disp-03",
    category: "detention",
    severity: "medium",
    status: "open",
    location: "Shipper IND-STEEL (Indianapolis, IN)",
    description: "Shipper crane down for 1.5 hours. Driver waiting in staging bay.",
    actionsTaken: "Armed detention clock with broker. Sent time-stamped in-gate ticket to broker dispatch desk.",
    detentionHours: 1.5,
    claimAmountUSD: 112.5,
    reportedAt: mins(-30),
  },
];

// Seed Message Logs
const SEED_MESSAGES: MessageLog[] = [
  {
    id: "msg-001",
    loadId: "load-002",
    dispatcherId: "usr-disp-01",
    dispatcherName: "Alex Reed",
    driverName: "Dave Kowalski",
    driverPhone: "+1 (214) 555-0841",
    milestone: "pickup_checkin_3_5h",
    messageContent: "🚨 UNIQUE DISPATCH 3.5H CHECK-IN: Hey Dave, checking in for Load #VRID-4182905...",
    channel: "sms",
    status: "acknowledged",
    sentAt: hours(-4.5),
    responseTimeMin: 4,
  },
  {
    id: "msg-002",
    loadId: "load-003",
    dispatcherId: "usr-disp-01",
    dispatcherName: "Alex Reed",
    driverName: "Tyrone Washington",
    driverPhone: "+1 (704) 555-0372",
    milestone: "pickup_checkin_3_5h",
    messageContent: "🚨 UNIQUE DISPATCH 3.5H CHECK-IN: Hey Tyrone, checking in for Load #VRID-7729104...",
    channel: "whatsapp",
    status: "acknowledged",
    sentAt: hours(-5),
    responseTimeMin: 6,
  },
  {
    id: "msg-003",
    loadId: "load-007",
    dispatcherId: "usr-disp-01",
    dispatcherName: "Alex Reed",
    driverName: "Dmitri Volkov",
    driverPhone: "+1 (713) 555-0992",
    milestone: "delivery_checkin_30m",
    messageContent: "📦 UNIQUE DISPATCH 30M DELIVERY ALERT: Hey Dmitri, you are ~30 mins from delivery...",
    channel: "sms",
    status: "acknowledged",
    sentAt: hours(-3),
    responseTimeMin: 2,
  },
];

// Seed Shift Handovers
const SEED_HANDOVERS: ShiftHandover[] = [
  {
    id: "sho-001",
    fromDispatcherId: "usr-disp-02",
    fromDispatcherName: "Samir Vance",
    fromShift: "night",
    toShift: "morning",
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0],
    activeLoadsCount: 6,
    criticalLoadsCount: 0,
    watchItems: [
      "VRID-9482710 JFK8 pickup requires check at 08:00 EST",
      "All overnight Amazon Relay blocks completed on time with zero ROC defects",
    ],
    generalNotes: "Smooth overnight shift. Fuel card limits verified for Cascadia Freight.",
    submittedAt: hours(-7),
    acknowledgedBy: "Alex Reed",
    acknowledgedAt: hours(-6.8),
  },
];

// Seed Audit Logs
const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-001",
    timestamp: mins(-45),
    actorId: "usr-disp-01",
    actorName: "Alex Reed",
    actorRole: "dispatcher",
    action: "INCIDENT_REPORTED",
    targetType: "incident",
    targetId: "inc-001",
    details: "Reported tractor breakdown for load VRID-4182905 near Jackson, MS. Flagged as CRITICAL_ALERT.",
  },
  {
    id: "aud-002",
    timestamp: mins(-15),
    actorId: "usr-admin-01",
    actorName: "Marven Awad",
    actorRole: "super_admin",
    action: "LOAD_STATUS_UPDATED",
    targetType: "load",
    targetId: "load-002",
    details: "Super Admin reviewed breakdown incident. Amazon ROC waiver ticket submitted.",
  },
  {
    id: "aud-003",
    timestamp: hours(-5),
    actorId: "usr-disp-01",
    actorName: "Alex Reed",
    actorRole: "dispatcher",
    action: "MILESTONE_MESSAGE_SENT",
    targetType: "message",
    targetId: "msg-002",
    details: "Sent 3.5h Pre-Trip Checkin to driver Tyrone Washington for VRID-7729104.",
  },
];

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "portal-storage.json");

export interface SyncMeta {
  lastSyncAt: string | null;
  lastSyncSource: string | null;
  totalSyncedCount: number;
}

interface PersistedStorage {
  users: User[];
  shifts: ShiftDefinition[];
  loads: Load[];
  incidents: IncidentReport[];
  messages: MessageLog[];
  handovers: ShiftHandover[];
  auditLogs: AuditLog[];
  syncMeta?: SyncMeta;
}

let syncMeta: SyncMeta = {
  lastSyncAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  lastSyncSource: "chrome_extension_amazon_relay",
  totalSyncedCount: 6,
};

function loadStorage(): PersistedStorage {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read portal-storage.json, falling back to seed data:", err);
  }

  // Initial seed
  const initial: PersistedStorage = {
    users: SEED_USERS,
    shifts: SEED_SHIFTS,
    loads: SEED_LOADS,
    incidents: SEED_INCIDENTS,
    messages: SEED_MESSAGES,
    handovers: SEED_HANDOVERS,
    auditLogs: SEED_AUDIT_LOGS,
    syncMeta,
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initial, null, 2), "utf-8");
  } catch (e) {
    // ignore
  }

  return initial;
}

const initialData = loadStorage();
let users: User[] = initialData.users || [...SEED_USERS];
let shifts: ShiftDefinition[] = initialData.shifts || [...SEED_SHIFTS];
let loads: Load[] = initialData.loads || [...SEED_LOADS];
let incidents: IncidentReport[] = initialData.incidents || [...SEED_INCIDENTS];
let messages: MessageLog[] = initialData.messages || [...SEED_MESSAGES];
let handovers: ShiftHandover[] = initialData.handovers || [...SEED_HANDOVERS];
let auditLogs: AuditLog[] = initialData.auditLogs || [...SEED_AUDIT_LOGS];
if (initialData.syncMeta) syncMeta = initialData.syncMeta;

function persist(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const dataToSave: PersistedStorage = {
      users,
      shifts,
      loads,
      incidents,
      messages,
      handovers,
      auditLogs,
      syncMeta,
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write portal-storage.json to disk:", err);
  }
}

// DB Operations
export const portalDb = {
  // Sync Health
  getSyncHealth: () => {
    const activeLoads = loads.filter((l) => l.status !== "delivered" && l.status !== "cancelled");
    const relayLoads = activeLoads.filter((l) => l.source === "amazon_relay");
    return {
      status: "online",
      lastSyncAt: syncMeta.lastSyncAt,
      lastSyncSource: syncMeta.lastSyncSource || "chrome_extension_amazon_relay",
      totalActiveLoads: activeLoads.length,
      activeRelayLoads: relayLoads.length,
    };
  },

  // Users
  getUsers: (): User[] => [...users],
  getUserById: (id: string): User | undefined => users.find((u) => u.id === id),
  getUserByEmail: (email: string): User | undefined =>
    users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  
  createUser: (userData: Omit<User, "id" | "createdAt">, actor: { id: string; name: string; role: any }): User => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);

    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "USER_CREATED",
      targetType: "user",
      targetId: newUser.id,
      details: `Created new user ${newUser.name} (${newUser.email}) with role '${newUser.role}' and shift '${newUser.shiftTimeRange || newUser.assignedShift || "unassigned"}'.`,
    });

    persist();
    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>, actor: { id: string; name: string; role: any }): User | null => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };

    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "USER_UPDATED",
      targetType: "user",
      targetId: id,
      details: `Updated user ${users[idx].name}: ${Object.keys(updates).join(", ")}.`,
    });

    persist();
    return users[idx];
  },

  deleteUser: (id: string, actor: { id: string; name: string; role: any }): { success: boolean; error?: string } => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return { success: false, error: "User not found" };
    }

    if (actor.id === id) {
      return { success: false, error: "Security restriction: You cannot delete your own active Super Admin session." };
    }

    const removed = users.splice(idx, 1)[0];

    // Reassign any non-delivered loads from deleted user to a remaining dispatcher or admin
    const fallbackDispatcher = users.find((u) => u.role === "dispatcher") || users[0];
    if (fallbackDispatcher) {
      loads.forEach((l) => {
        if (l.assignedDispatcherId === id) {
          l.assignedDispatcherId = fallbackDispatcher.id;
          l.assignedDispatcherName = fallbackDispatcher.name;
        }
      });
    }

    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "USER_DELETED",
      targetType: "user",
      targetId: removed.id,
      details: `Permanently removed user ${removed.name} (${removed.email}, role: ${removed.role}) by Super Admin ${actor.name}.`,
    });

    persist();
    return { success: true };
  },

  // Shifts (Customizable Time Windows)
  getShifts: (): ShiftDefinition[] => [...shifts],
  getShiftById: (id: string): ShiftDefinition | undefined => shifts.find((s) => s.id === id),
  
  createShift: (shiftData: Omit<ShiftDefinition, "id">, actor: { id: string; name: string; role: any }): ShiftDefinition => {
    const newShift: ShiftDefinition = {
      ...shiftData,
      id: `shift-${Date.now()}`,
    };
    shifts.push(newShift);

    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "SHIFT_CREATED",
      targetType: "shift",
      targetId: newShift.id,
      details: `Created new custom shift '${newShift.name}' (${newShift.startTime} - ${newShift.endTime} ${newShift.timezone || "EST"}).`,
    });

    persist();
    return newShift;
  },

  updateShift: (id: string, updates: Partial<ShiftDefinition>, actor: { id: string; name: string; role: any }): ShiftDefinition | null => {
    const idx = shifts.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    shifts[idx] = { ...shifts[idx], ...updates };

    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "SHIFT_UPDATED",
      targetType: "shift",
      targetId: id,
      details: `Updated shift ${shifts[idx].name} schedule to ${shifts[idx].startTime} - ${shifts[idx].endTime}.`,
    });

    persist();
    return shifts[idx];
  },

  deleteShift: (id: string, actor: { id: string; name: string; role: any }): boolean => {
    const idx = shifts.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    const removed = shifts.splice(idx, 1)[0];

    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "SHIFT_DELETED",
      targetType: "shift",
      targetId: removed.id,
      details: `Deleted shift '${removed.name}' (${removed.startTime} - ${removed.endTime}).`,
    });

    persist();
    return true;
  },

  // Loads
  getLoads: (filters?: {
    status?: string;
    shift?: ShiftType | "all";
    dispatcherId?: string;
    search?: string;
    criticalOnly?: boolean;
  }): Load[] => {
    let result = [...loads];

    if (filters?.shift && filters.shift !== "all") {
      result = result.filter((l) => l.currentShift === filters.shift);
    }

    if (filters?.status && filters.status !== "all") {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters?.dispatcherId && filters.dispatcherId !== "all") {
      result = result.filter((l) => l.assignedDispatcherId === filters.dispatcherId);
    }

    if (filters?.criticalOnly) {
      result = result.filter((l) => l.isCriticalAlert || l.hasActiveIncident);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.vrid.toLowerCase().includes(q) ||
          l.driverName.toLowerCase().includes(q) ||
          l.originCity.toLowerCase().includes(q) ||
          l.destCity.toLowerCase().includes(q) ||
          (l.originFacilityCode && l.originFacilityCode.toLowerCase().includes(q)) ||
          (l.destFacilityCode && l.destFacilityCode.toLowerCase().includes(q)) ||
          l.tractorNumber.toLowerCase().includes(q) ||
          l.trailerNumber.toLowerCase().includes(q)
      );
    }

    // Sort: Critical & Alerts first, then by earliest pickup/delivery
    return result.sort((a, b) => {
      if (a.isCriticalAlert && !b.isCriticalAlert) return -1;
      if (!a.isCriticalAlert && b.isCriticalAlert) return 1;
      return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
    });
  },

  getLoadById: (id: string): Load | undefined => loads.find((l) => l.id === id || l.vrid === id),

  createLoad: (loadData: Omit<Load, "id" | "createdAt" | "updatedAt">, actor?: { id: string; name: string; role: any }): Load => {
    const newLoad: Load = {
      ...loadData,
      id: `load-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    loads.unshift(newLoad);

    if (actor) {
      portalDb.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "LOAD_CREATED",
        targetType: "load",
        targetId: newLoad.id,
        details: `Created load ${newLoad.vrid} (${newLoad.originCity} -> ${newLoad.destCity}) assigned to ${newLoad.assignedDispatcherName}.`,
      });
    }

    persist();
    return newLoad;
  },

  updateLoad: (id: string, updates: Partial<Load>, actor?: { id: string; name: string; role: any }): Load | null => {
    const idx = loads.findIndex((l) => l.id === id || l.vrid === id);
    if (idx === -1) return null;

    const prev = loads[idx];
    loads[idx] = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (actor) {
      portalDb.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "LOAD_UPDATED",
        targetType: "load",
        targetId: prev.id,
        details: `Updated load ${prev.vrid}: ${Object.keys(updates).join(", ")}.`,
      });
    }

    persist();
    return loads[idx];
  },

  deleteLoad: (id: string, actor: { id: string; name: string; role: any }): boolean => {
    const idx = loads.findIndex((l) => l.id === id || l.vrid === id);
    if (idx === -1) return false;

    const removed = loads.splice(idx, 1)[0];
    portalDb.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "LOAD_DELETED",
      targetType: "load",
      targetId: removed.id,
      details: `Deleted load ${removed.vrid} (${removed.originCity} -> ${removed.destCity}).`,
    });

    persist();
    return true;
  },

  // Batch Sync (Chrome Extension & CSV Import)
  syncBatchLoads: (payload: BatchSyncPayload, actorName = "Amazon Relay Sync"): { synced: number; added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    for (const item of payload.loads) {
      const existing = loads.find((l) => l.vrid === item.vrid);
      if (existing) {
        portalDb.updateLoad(existing.id, {
          ...item,
          updatedAt: new Date().toISOString(),
        });
        updated++;
      } else {
        const defaultDispatcher = users.find((u) => u.role === "dispatcher") || users[0];
        portalDb.createLoad({
          vrid: item.vrid,
          source: item.source || "amazon_relay",
          equipment: item.equipment || "Dry Van (53')",
          rateUSD: item.rateUSD || 2800.0,
          weightLbs: item.weightLbs || 36000,
          originCity: item.originCity,
          originState: item.originState,
          originAddress: item.originAddress,
          originFacilityCode: item.originFacilityCode,
          pickupTime: item.pickupTime,
          destCity: item.destCity,
          destState: item.destState,
          destAddress: item.destAddress,
          destFacilityCode: item.destFacilityCode,
          deliveryTime: item.deliveryTime,
          driverName: item.driverName || "Assigned Driver",
          driverPhone: item.driverPhone || "+1 (555) 000-0000",
          tractorNumber: item.tractorNumber || "UD-TBD",
          trailerNumber: item.trailerNumber || "TR-TBD",
          carrierName: item.carrierName || "Unique Dispatch Fleet",
          carrierMcDot: item.carrierMcDot || "MC-ACTIVE",
          status: item.status || "upcoming",
          currentShift: payload.shift || "morning",
          assignedDispatcherId: defaultDispatcher.id,
          assignedDispatcherName: defaultDispatcher.name,
          pickupCheckinSent: false,
          deliveryCheckinSent: false,
          isCriticalAlert: false,
          hasActiveIncident: false,
          incidentCount: 0,
          notes: item.notes || `Ingested via ${payload.source} on ${new Date().toLocaleTimeString()}`,
        });
        added++;
      }
    }

    syncMeta = {
      lastSyncAt: new Date().toISOString(),
      lastSyncSource: payload.source,
      totalSyncedCount: (syncMeta.totalSyncedCount || 0) + added + updated,
    };

    portalDb.addAuditLog({
      actorId: "system-sync",
      actorName: actorName,
      actorRole: "super_admin",
      action: "BATCH_SYNC_COMPLETED",
      targetType: "sync",
      details: `Batch ingestion completed via ${payload.source}: ${added} loads created, ${updated} loads updated.`,
    });

    persist();
    return { synced: added + updated, added, updated };
  },

  // Milestone Message Logging
  logMilestoneMessage: (data: {
    loadId: string;
    dispatcherId: string;
    dispatcherName: string;
    milestone: MilestoneType;
    messageContent: string;
    channel?: "sms" | "whatsapp" | "openphone" | "manual";
  }): MessageLog => {
    const load = loads.find((l) => l.id === data.loadId || l.vrid === data.loadId);
    if (!load) throw new Error("Load not found");

    const newLog: MessageLog = {
      id: `msg-${Date.now()}`,
      loadId: load.id,
      dispatcherId: data.dispatcherId,
      dispatcherName: data.dispatcherName,
      driverName: load.driverName,
      driverPhone: load.driverPhone,
      milestone: data.milestone,
      messageContent: data.messageContent,
      channel: data.channel || "sms",
      status: "sent",
      sentAt: new Date().toISOString(),
      responseTimeMin: 1,
    };

    messages.unshift(newLog);

    // Update load flag
    if (data.milestone === "pickup_checkin_3_5h") {
      portalDb.updateLoad(load.id, {
        pickupCheckinSent: true,
        pickupCheckinSentAt: newLog.sentAt,
      });
    } else if (data.milestone === "delivery_checkin_30m") {
      portalDb.updateLoad(load.id, {
        deliveryCheckinSent: true,
        deliveryCheckinSentAt: newLog.sentAt,
      });
    }

    portalDb.addAuditLog({
      actorId: data.dispatcherId,
      actorName: data.dispatcherName,
      actorRole: "dispatcher",
      action: "MILESTONE_MESSAGE_SENT",
      targetType: "message",
      targetId: newLog.id,
      details: `Verified milestone '${data.milestone}' for driver ${load.driverName} on load ${load.vrid}.`,
    });

    persist();
    return newLog;
  },

  getMessageLogs: (loadId?: string): MessageLog[] => {
    if (loadId) return messages.filter((m) => m.loadId === loadId);
    return [...messages];
  },

  // Incidents
  getIncidents: (status?: string): IncidentReport[] => {
    if (status && status !== "all") {
      return incidents.filter((i) => i.status === status);
    }
    return [...incidents];
  },

  reportIncident: (data: {
    loadId: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    description: string;
    location?: string;
    actionsTaken?: string;
    detentionHours?: number;
    claimAmountUSD?: number;
    reportedBy: string;
    reportedById: string;
  }): IncidentReport => {
    const load = loads.find((l) => l.id === data.loadId || l.vrid === data.loadId);
    if (!load) throw new Error("Load not found");

    const newIncident: IncidentReport = {
      id: `inc-${Date.now()}`,
      loadId: load.id,
      loadVrid: load.vrid,
      reportedBy: data.reportedBy,
      reportedById: data.reportedById,
      category: data.category,
      severity: data.severity,
      status: "open",
      location: data.location || `${load.originCity}, ${load.originState}`,
      description: data.description,
      actionsTaken: data.actionsTaken,
      detentionHours: data.detentionHours,
      claimAmountUSD: data.claimAmountUSD,
      reportedAt: new Date().toISOString(),
    };

    incidents.unshift(newIncident);

    // Flag load as critical alert
    portalDb.updateLoad(load.id, {
      isCriticalAlert: true,
      alertReason: `[${data.category.toUpperCase()}] ${data.description}`,
      hasActiveIncident: true,
      incidentCount: (load.incidentCount || 0) + 1,
      status: data.severity === "critical" ? "critical_alert" : "delayed",
    });

    portalDb.addAuditLog({
      actorId: data.reportedById,
      actorName: data.reportedBy,
      actorRole: "dispatcher",
      action: "INCIDENT_REPORTED",
      targetType: "incident",
      targetId: newIncident.id,
      details: `Reported [${data.category.toUpperCase()}] severity=${data.severity} on load ${load.vrid}: ${data.description}`,
    });

    persist();
    return newIncident;
  },

  resolveIncident: (
    id: string,
    data: {
      status: "resolved" | "claim_filed" | "under_investigation";
      resolutionNotes: string;
      resolvedBy: string;
      resolvedById: string;
    }
  ): IncidentReport | null => {
    const idx = incidents.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    incidents[idx] = {
      ...incidents[idx],
      status: data.status,
      resolutionNotes: data.resolutionNotes,
      resolvedBy: data.resolvedBy,
      resolvedAt: data.status === "resolved" ? new Date().toISOString() : undefined,
    };

    // If no more open incidents for this load, clear critical flag
    const loadId = incidents[idx].loadId;
    const remainingOpen = incidents.filter((i) => i.loadId === loadId && (i.status === "open" || i.status === "under_investigation"));
    if (remainingOpen.length === 0) {
      portalDb.updateLoad(loadId, {
        isCriticalAlert: false,
        hasActiveIncident: false,
        status: "in_transit",
      });
    }

    portalDb.addAuditLog({
      actorId: data.resolvedById,
      actorName: data.resolvedBy,
      actorRole: "super_admin",
      action: "INCIDENT_RESOLVED",
      targetType: "incident",
      targetId: id,
      details: `Incident ${id} marked as '${data.status}'. Resolution: ${data.resolutionNotes}`,
    });

    persist();
    return incidents[idx];
  },

  // Shift Handovers
  getShiftHandovers: (): ShiftHandover[] => [...handovers],

  createShiftHandover: (data: {
    fromDispatcherId: string;
    fromDispatcherName: string;
    fromShift: ShiftType;
    toShift: ShiftType;
    watchItems: string[];
    generalNotes: string;
  }): ShiftHandover => {
    const activeShiftLoads = loads.filter((l) => l.currentShift === data.fromShift && l.status !== "delivered");
    const criticalLoads = activeShiftLoads.filter((l) => l.isCriticalAlert || l.hasActiveIncident);

    // Reassign non-delivered loads to the incoming shift
    activeShiftLoads.forEach((load) => {
      portalDb.updateLoad(load.id, {
        currentShift: data.toShift,
      });
    });

    const newHandover: ShiftHandover = {
      id: `sho-${Date.now()}`,
      fromDispatcherId: data.fromDispatcherId,
      fromDispatcherName: data.fromDispatcherName,
      fromShift: data.fromShift,
      toShift: data.toShift,
      date: new Date().toISOString().split("T")[0],
      activeLoadsCount: activeShiftLoads.length,
      criticalLoadsCount: criticalLoads.length,
      watchItems: data.watchItems,
      generalNotes: data.generalNotes,
      submittedAt: new Date().toISOString(),
    };

    handovers.unshift(newHandover);

    portalDb.addAuditLog({
      actorId: data.fromDispatcherId,
      actorName: data.fromDispatcherName,
      actorRole: "dispatcher",
      action: "SHIFT_HANDOVER_SUBMITTED",
      targetType: "shift",
      targetId: newHandover.id,
      details: `Submitted handover from ${data.fromShift.toUpperCase()} to ${data.toShift.toUpperCase()} shift with ${activeShiftLoads.length} active loads transferred.`,
    });

    persist();
    return newHandover;
  },

  // Audit Logs
  getAuditLogs: (limit = 100): AuditLog[] => {
    return auditLogs.slice(0, limit);
  },

  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">): AuditLog => {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    auditLogs.unshift(newLog);
    if (auditLogs.length > 500) auditLogs.pop();
    return newLog;
  },

  // Dispatcher KPI Metrics
  getDispatcherKpis: (): DispatcherKpi[] => {
    const dispatchers = users.filter((u) => u.role === "dispatcher");

    return dispatchers.map((d) => {
      const assigned = loads.filter((l) => l.assignedDispatcherId === d.id);
      const sentMsgs = messages.filter((m) => m.dispatcherId === d.id);
      const onTimeMsgs = sentMsgs.filter((m) => (m.responseTimeMin || 0) <= 5);

      const pickupEligible = assigned.filter((l) => new Date(l.pickupTime).getTime() <= Date.now() + 3.5 * 3600 * 1000);
      const pickupSentCount = pickupEligible.filter((l) => l.pickupCheckinSent).length;
      const pickupCompliance = pickupEligible.length > 0 ? Math.round((pickupSentCount / pickupEligible.length) * 100) : 100;

      const deliveryEligible = assigned.filter((l) => new Date(l.deliveryTime).getTime() <= Date.now() + 30 * 60 * 1000);
      const deliverySentCount = deliveryEligible.filter((l) => l.deliveryCheckinSent).length;
      const deliveryCompliance = deliveryEligible.length > 0 ? Math.round((deliverySentCount / deliveryEligible.length) * 100) : 100;

      const totalCompliance = Math.round((pickupCompliance + deliveryCompliance) / 2);

      return {
        dispatcherId: d.id,
        dispatcherName: d.name,
        assignedShift: d.assignedShift || "morning",
        totalLoadsHandled: assigned.length,
        onTimeMessageCompliancePct: totalCompliance,
        avgIncidentResponseMinutes: 4.8,
        pickupCheckinCompliancePct: pickupCompliance,
        deliveryCheckinCompliancePct: deliveryCompliance,
        incidentsResolved: incidents.filter((i) => i.reportedById === d.id && i.status === "resolved").length,
        activeLoadsCurrent: assigned.filter((l) => l.status !== "delivered" && l.status !== "cancelled").length,
      };
    });
  },
};
