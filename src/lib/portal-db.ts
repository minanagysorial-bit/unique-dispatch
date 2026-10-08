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

// Initial Empty Data Structures (Populated 100% via Live Amazon Relay Sync or Dispatcher Action)
const SEED_LOADS: Load[] = [];
const SEED_INCIDENTS: IncidentReport[] = [];
const SEED_MESSAGES: MessageLog[] = [];
const SEED_HANDOVERS: ShiftHandover[] = [];
const SEED_AUDIT_LOGS: AuditLog[] = [];

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
  lastSyncAt: null,
  lastSyncSource: null,
  totalSyncedCount: 0,
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
    const hasSyncedRecently = Boolean(
      syncMeta.lastSyncAt &&
      Date.now() - new Date(syncMeta.lastSyncAt).getTime() < 1000 * 60 * 60
    );
    return {
      status: hasSyncedRecently ? "online" : (syncMeta.lastSyncAt ? "idle" : "waiting_for_extension"),
      lastSyncAt: syncMeta.lastSyncAt,
      lastSyncSource: syncMeta.lastSyncSource || null,
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
    sort?: "screen" | "pickup" | "rate" | "status" | string;
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

    const sort = filters?.sort || "screen";

    return result.sort((a, b) => {
      if (a.isCriticalAlert && !b.isCriticalAlert) return -1;
      if (!a.isCriticalAlert && b.isCriticalAlert) return 1;

      if (sort === "screen") {
        if (a.screenIndex !== undefined && b.screenIndex !== undefined) {
          return a.screenIndex - b.screenIndex;
        }
        if (a.screenIndex !== undefined) return -1;
        if (b.screenIndex !== undefined) return 1;
        return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
      } else if (sort === "rate") {
        return (b.rateUSD || 0) - (a.rateUSD || 0);
      } else if (sort === "status") {
        return a.status.localeCompare(b.status);
      } else {
        // "pickup"
        return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
      }
    });
  },

  getLoadById: (id: string): Load | undefined => loads.find((l) => l.id === id || l.vrid === id),

  createLoad: (loadData: Omit<Load, "id" | "createdAt" | "updatedAt">, actor?: { id: string; name: string; role: any }): Load => {
    const synthesizedStops =
      Array.isArray(loadData.stops) && loadData.stops.length > 0
        ? loadData.stops
        : [
            {
              sequenceNumber: 1,
              type: "pickup" as const,
              activity: "pickup",
              facilityCode: loadData.originFacilityCode,
              address: loadData.originAddress,
              city: loadData.originCity,
              state: loadData.originState,
              appointmentTime: loadData.pickupTime,
              status:
                loadData.status === "en_route_pickup"
                  ? ("en_route" as const)
                  : loadData.status === "at_pickup"
                  ? ("arrived" as const)
                  : loadData.status === "in_transit" ||
                    loadData.status === "at_delivery" ||
                    loadData.status === "delivered"
                  ? ("completed" as const)
                  : ("pending" as const),
            },
            {
              sequenceNumber: 2,
              type: "delivery" as const,
              activity: "delivery",
              facilityCode: loadData.destFacilityCode,
              address: loadData.destAddress,
              city: loadData.destCity,
              state: loadData.destState,
              appointmentTime: loadData.deliveryTime,
              status:
                loadData.status === "delivered"
                  ? ("completed" as const)
                  : loadData.status === "at_delivery"
                  ? ("arrived" as const)
                  : loadData.status === "in_transit"
                  ? ("en_route" as const)
                  : ("pending" as const),
            },
          ];

    const newLoad: Load = {
      ...loadData,
      stops: synthesizedStops,
      totalStopsCount: loadData.totalStopsCount || synthesizedStops.length,
      id: `load-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    loads.push(newLoad);

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

  clearAllLoads: (actor?: { id: string; name: string; role: any }): { deletedCount: number } => {
    const deletedCount = loads.length;
    loads.length = 0;
    syncMeta = {
      lastSyncAt: null,
      lastSyncSource: null,
      totalSyncedCount: 0,
    };
    if (actor) {
      portalDb.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "ALL_LOADS_CLEARED",
        targetType: "load",
        details: `Purged all ${deletedCount} loads from dispatch operations board.`,
      });
    }
    persist();
    return { deletedCount };
  },

  // Batch Sync (Chrome Extension & CSV Import)
  syncBatchLoads: (payload: BatchSyncPayload, actorName = "Amazon Relay Sync"): { synced: number; added: number; updated: number; removed?: number } => {
    let added = 0;
    let updated = 0;
    let removed = 0;

    // If replace_all mode requested, remove older relay loads not in this active payload
    if (payload.mode === "replace_all") {
      const incomingVrids = new Set(payload.loads.map((l) => l.vrid));
      for (let i = loads.length - 1; i >= 0; i--) {
        if (loads[i].source === "amazon_relay" && !incomingVrids.has(loads[i].vrid)) {
          loads.splice(i, 1);
          removed++;
        }
      }
    }

    payload.loads.forEach((item, index) => {
      const screenIndex = item.screenIndex !== undefined ? item.screenIndex : index;
      const existing = loads.find((l) => l.vrid === item.vrid);
      if (existing) {
        portalDb.updateLoad(existing.id, {
          ...item,
          screenIndex,
          stops: item.stops && item.stops.length > 0 ? item.stops : existing.stops,
          distanceMiles: item.distanceMiles || existing.distanceMiles,
          totalStopsCount: item.totalStopsCount || item.stops?.length || existing.totalStopsCount,
          updatedAt: new Date().toISOString(),
        });
        updated++;
      } else {
        const defaultDispatcher = users.find((u) => u.role === "dispatcher") || users[0];
        portalDb.createLoad({
          vrid: item.vrid,
          source: item.source || "amazon_relay",
          equipment: item.equipment || "Dry Van (53')",
          rateUSD: typeof item.rateUSD === "number" ? item.rateUSD : 0,
          weightLbs: item.weightLbs || 36000,
          distanceMiles: item.distanceMiles,
          totalStopsCount: item.totalStopsCount || item.stops?.length,
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
          stops: item.stops,
          driverName: item.driverName || "Assigned Driver",
          driverPhone: item.driverPhone || "+1 (555) 000-0000",
          tractorNumber: item.tractorNumber || "UD-AMZ",
          trailerNumber: item.trailerNumber || "TR-5300",
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
          screenIndex,
          notes: item.notes || `Ingested via ${payload.source} on ${new Date().toLocaleTimeString()}`,
        });
        added++;
      }
    });

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
      details: `Batch ingestion completed via ${payload.source}: ${added} loads created, ${updated} loads updated${removed > 0 ? `, ${removed} phantom loads pruned` : ""}.`,
    });

    persist();
    return { synced: added + updated, added, updated, removed };
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
      const pickupCompliance = pickupEligible.length > 0 ? Math.round((pickupSentCount / pickupEligible.length) * 100) : (assigned.length > 0 ? 100 : 0);

      const deliveryEligible = assigned.filter((l) => new Date(l.deliveryTime).getTime() <= Date.now() + 30 * 60 * 1000);
      const deliverySentCount = deliveryEligible.filter((l) => l.deliveryCheckinSent).length;
      const deliveryCompliance = deliveryEligible.length > 0 ? Math.round((deliverySentCount / deliveryEligible.length) * 100) : (assigned.length > 0 ? 100 : 0);

      const totalCompliance = assigned.length > 0 ? Math.round((pickupCompliance + deliveryCompliance) / 2) : 0;

      return {
        dispatcherId: d.id,
        dispatcherName: d.name,
        assignedShift: d.assignedShift || "morning",
        totalLoadsHandled: assigned.length,
        onTimeMessageCompliancePct: totalCompliance,
        avgIncidentResponseMinutes: sentMsgs.length > 0 ? 4.8 : 0,
        pickupCheckinCompliancePct: pickupCompliance,
        deliveryCheckinCompliancePct: deliveryCompliance,
        incidentsResolved: incidents.filter((i) => i.reportedById === d.id && i.status === "resolved").length,
        activeLoadsCurrent: assigned.filter((l) => l.status !== "delivered" && l.status !== "cancelled").length,
      };
    });
  },
};
