"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import PortalNavbar from "@/components/portal/PortalNavbar";
import LoadOperationsCard from "@/components/portal/LoadOperationsCard";
import LoadGridCard from "@/components/portal/LoadGridCard";
import ShiftHandoverModal from "@/components/portal/ShiftHandoverModal";
import CsvImportModal from "@/components/portal/CsvImportModal";
import ChromeExtensionGuide from "@/components/portal/ChromeExtensionGuide";
import TemplateEditorModal from "@/components/portal/TemplateEditorModal";
import EmergencyAlertCenter from "@/components/portal/EmergencyAlertCenter";
import IssueEscalationModal from "@/components/portal/IssueEscalationModal";
import MilestoneMessageModal from "@/components/portal/MilestoneMessageModal";
import {
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sun,
  Moon,
  ArrowRightLeft,
  Upload,
  Layers,
  Sparkles,
  LayoutGrid,
  List,
  Columns3,
  FileText,
  Zap,
  Activity,
  Package,
  BellRing,
} from "lucide-react";
import { Load, User, ShiftType, EquipmentType, MilestoneType } from "@/lib/portal-types";
import { playMilestoneChime, playUrgentAlert, playEmergencySiren } from "@/lib/audio-alerts";

type ViewMode = "grid" | "list" | "kanban";
type ActionFilterType = "all" | "critical" | "needs_pickup_3_5h" | "needs_delivery_30m" | "amazon_relay" | "dat_spot";

interface SyncHealth {
  status: string;
  lastSyncAt: string | null;
  lastSyncSource: string;
  totalActiveLoads: number;
  activeRelayLoads: number;
}

export default function DispatcherOperationsBoardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<ShiftType>("morning");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [actionFilter, setActionFilter] = useState<ActionFilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [syncHealth, setSyncHealth] = useState<SyncHealth | null>(null);

  const prevCriticalCountRef = useRef<number>(0);
  const prevMilestonesCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Modals
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreateLoadOpen, setIsCreateLoadOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [escalationLoad, setEscalationLoad] = useState<Load | null>(null);
  const [messageLoad, setMessageLoad] = useState<Load | null>(null);
  const [messageMilestone, setMessageMilestone] = useState<MilestoneType>("in_transit_checkin");

  // New Load Form State
  const [newVrid, setNewVrid] = useState("");
  const [newOriginCity, setNewOriginCity] = useState("");
  const [newOriginState, setNewOriginState] = useState("NY");
  const [newOriginCode, setNewOriginCode] = useState("");
  const [newDestCity, setNewDestCity] = useState("");
  const [newDestState, setNewDestState] = useState("IL");
  const [newDestCode, setNewDestCode] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newEquipment, setNewEquipment] = useState<EquipmentType>("Dry Van (53')");
  const [newRate, setNewRate] = useState("3200");
  const [isCreating, setIsCreating] = useState(false);

  // Load preferred view mode from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("unique_dispatch_view_mode") as ViewMode;
      if (savedMode && ["grid", "list", "kanban"].includes(savedMode)) {
        setViewMode(savedMode);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("unique_dispatch_view_mode", mode);
    } catch (e) {
      // ignore
    }
  };

  // Fetch Current User
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.user?.assignedShift) {
          setCurrentShift(data.user.assignedShift);
        }
      } else {
        // Fallback user
        setCurrentUser({
          id: "usr-disp-01",
          name: "Alex Reed",
          email: "dispatcher@uniquedispatch.com",
          role: "dispatcher",
          assignedShift: "morning",
          isActive: true,
          createdAt: "2026-01-01",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Loads
  const fetchLoads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentShift) params.set("shift", currentShift);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (criticalOnly) params.set("critical", "true");

      const res = await fetch(`/api/loads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedLoads: Load[] = data.loads || [];
        setLoads(fetchedLoads);
        if (data.syncHealth) {
          setSyncHealth(data.syncHealth);
        }

        // 1. Live Audio Alert Trigger for newly escalated Critical / Delayed Incidents
        const currentCritical = fetchedLoads.filter(
          (l) => l.isCriticalAlert || l.hasActiveIncident || l.status === "delayed" || l.status === "critical_alert"
        ).length;

        if (!isInitialLoadRef.current && currentCritical > prevCriticalCountRef.current) {
          playUrgentAlert();
        }
        prevCriticalCountRef.current = currentCritical;

        // 2. Milestone Chime Trigger for 3.5h Pickup or 30m Delivery deadlines
        const currentPending3_5h = fetchedLoads.filter((l) => {
          const hoursToPickup = (new Date(l.pickupTime).getTime() - Date.now()) / (3600 * 1000);
          return !l.pickupCheckinSent && hoursToPickup <= 3.5 && hoursToPickup >= -4 && l.status !== "delivered";
        }).length;

        const currentPending30m = fetchedLoads.filter((l) => {
          const minsToDelivery = (new Date(l.deliveryTime).getTime() - Date.now()) / (60 * 1000);
          return !l.deliveryCheckinSent && minsToDelivery <= 30 && minsToDelivery >= -60 && l.status !== "delivered";
        }).length;

        const totalPendingMilestones = currentPending3_5h + currentPending30m;

        if (!isInitialLoadRef.current && totalPendingMilestones > prevMilestonesCountRef.current) {
          playMilestoneChime();
        }
        prevMilestonesCountRef.current = totalPendingMilestones;
        isInitialLoadRef.current = false;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentShift, statusFilter, searchQuery, criticalOnly]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchLoads]);

  // Load Update Handler
  const handleLoadUpdated = (updatedLoad: Load) => {
    setLoads((prev) =>
      prev.map((l) => (l.id === updatedLoad.id ? updatedLoad : l))
    );
  };

  // Create Load Submit Handler
  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vrid: newVrid || `TRIP-${Math.floor(1000000 + Math.random() * 9000000)}`,
          source: "manual_import",
          equipment: newEquipment,
          rateUSD: Number(newRate) || 3000,
          originCity: newOriginCity,
          originState: newOriginState,
          originFacilityCode: newOriginCode || undefined,
          pickupTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          destCity: newDestCity,
          destState: newDestState,
          destFacilityCode: newDestCode || undefined,
          deliveryTime: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          driverName: newDriverName || "John Doe",
          driverPhone: newDriverPhone || "+1 (555) 019-2834",
          tractorNumber: "UD-101",
          trailerNumber: "TR-5300",
          currentShift,
        }),
      });

      if (res.ok) {
        setIsCreateLoadOpen(false);
        setNewVrid("");
        setNewOriginCity("");
        setNewDestCity("");
        setNewDriverName("");
        setNewDriverPhone("");
        fetchLoads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Metrics summary
  const totalActiveLoads = loads.filter((l) => l.status !== "delivered" && l.status !== "cancelled").length;
  const criticalCount = loads.filter((l) => l.isCriticalAlert || l.hasActiveIncident).length;
  const pendingPickup3_5h = loads.filter((l) => {
    const hoursToPickup = (new Date(l.pickupTime).getTime() - Date.now()) / (3600 * 1000);
    return !l.pickupCheckinSent && hoursToPickup <= 3.5 && hoursToPickup >= -4 && l.status !== "delivered";
  }).length;
  const pendingDelivery30m = loads.filter((l) => {
    const minsToDelivery = (new Date(l.deliveryTime).getTime() - Date.now()) / (60 * 1000);
    return !l.deliveryCheckinSent && minsToDelivery <= 30 && minsToDelivery >= -60 && l.status !== "delivered";
  }).length;

  // Filtered loads by Smart Action Pills
  const displayedLoads = loads.filter((l) => {
    if (actionFilter === "critical") {
      return l.isCriticalAlert || l.hasActiveIncident || l.status === "delayed" || l.status === "critical_alert";
    }
    if (actionFilter === "needs_pickup_3_5h") {
      const hoursToPickup = (new Date(l.pickupTime).getTime() - Date.now()) / (3600 * 1000);
      return !l.pickupCheckinSent && hoursToPickup <= 3.5 && hoursToPickup >= -4 && l.status !== "delivered";
    }
    if (actionFilter === "needs_delivery_30m") {
      const minsToDelivery = (new Date(l.deliveryTime).getTime() - Date.now()) / (60 * 1000);
      return !l.deliveryCheckinSent && minsToDelivery <= 30 && minsToDelivery >= -60 && l.status !== "delivered";
    }
    if (actionFilter === "amazon_relay") {
      return l.source === "amazon_relay";
    }
    if (actionFilter === "dat_spot") {
      return l.source !== "amazon_relay";
    }
    return true;
  });

  // Kanban categorized loads based on displayedLoads
  const kanbanUpcoming = displayedLoads.filter(
    (l) => (l.status === "upcoming" || l.status === "en_route_pickup") && !l.isCriticalAlert && !l.hasActiveIncident
  );
  const kanbanActive = displayedLoads.filter(
    (l) => (l.status === "at_pickup" || l.status === "in_transit" || l.status === "at_delivery") && !l.isCriticalAlert && !l.hasActiveIncident
  );
  const kanbanCritical = displayedLoads.filter(
    (l) => l.isCriticalAlert || l.hasActiveIncident || l.status === "delayed" || l.status === "critical_alert"
  );
  const kanbanDelivered = displayedLoads.filter(
    (l) => l.status === "delivered"
  );

  // Critical loads list for Emergency Alert Center
  const criticalLoadsList = loads.filter(
    (l) => l.isCriticalAlert || l.hasActiveIncident || l.status === "delayed" || l.status === "critical_alert"
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col relative">
      
      {/* Live Emergency Alert System (Top Ambient Strobe Bar, Bouncing Beacon Orb & Full-Screen Center Overlay) */}
      <EmergencyAlertCenter
        criticalLoads={criticalLoadsList}
        onSelectLoad={(load) => {
          setActionFilter("critical");
          setSearchQuery(load.vrid);
        }}
        onOpenEscalation={(load) => {
          setEscalationLoad(load);
        }}
        onOpenMessage={(load) => {
          setMessageLoad(load);
          setMessageMilestone("in_transit_checkin");
        }}
      />

      {/* Portal Navbar Header */}
      <PortalNavbar
        currentUser={currentUser}
        currentShift={currentShift}
        onShiftChange={(s) => setCurrentShift(s)}
        onRefresh={fetchLoads}
        onOpenHandoverModal={() => setIsHandoverOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Live Relay Sync Health Status Banner */}
        <div className="bg-[#0b1329] text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {syncHealth?.lastSyncAt ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 relative" />
                </>
              ) : (
                <span className="w-3 h-3 rounded-full bg-slate-500 relative" />
              )}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Amazon Relay Sync Engine
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    syncHealth?.lastSyncAt
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-slate-700/40 text-slate-300 border-slate-600"
                  }`}
                >
                  {syncHealth?.lastSyncAt ? "ONLINE & ACTIVE" : "AWAITING EXTENSION SYNC"}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {syncHealth?.lastSyncAt ? (
                  <>
                    Auto-ingesting live tour updates from Chrome Extension. Last sync:{" "}
                    <span className="font-bold text-white">
                      {Math.max(
                        1,
                        Math.round(
                          (Date.now() - new Date(syncHealth.lastSyncAt).getTime()) /
                            60000
                        )
                      )}
                      m ago
                    </span>
                    {" • "}
                    <span className="text-slate-400 font-medium">
                      Source:{" "}
                      {syncHealth?.lastSyncSource === "chrome_extension_amazon_relay"
                        ? "Chrome Extension (Relay V3)"
                        : "API Sync"}
                    </span>
                    {" • "}
                    <span className="text-orange-400 font-bold">
                      {syncHealth?.activeRelayLoads ??
                        loads.filter((l) => l.source === "amazon_relay").length}{" "}
                      Relay Tours Loaded
                    </span>
                  </>
                ) : (
                  <>
                    No tours loaded yet. Open{" "}
                    <a
                      href="https://relay.amazon.com/tours"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 font-bold hover:underline"
                    >
                      relay.amazon.com/tours
                    </a>{" "}
                    with the Unique Dispatch Extension to stream live tours automatically.
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Extension Setup</span>
            </button>
            <button
              onClick={fetchLoads}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
              title="Force sync check"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Operations Desk Top Banner & Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Active Dispatched Loads */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Dispatched</p>
              <p className="text-2xl font-black text-slate-950 mt-0.5">{totalActiveLoads} Loads</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          {/* Critical Alerts / Breakdowns */}
          <button
            onClick={() => setActionFilter(actionFilter === "critical" ? "all" : "critical")}
            className={`p-4 rounded-2xl border text-left shadow-sm flex items-center justify-between transition-all ${
              criticalCount > 0
                ? "bg-red-50 border-red-300 ring-2 ring-red-500/20 animate-pulse"
                : "bg-white border-slate-200"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Critical Alerts</span>
              </p>
              <p className="text-2xl font-black text-red-700 mt-0.5">{criticalCount} Urgent</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

          {/* Pending 3.5h Pickup Check-ins */}
          <button
            onClick={() => setActionFilter(actionFilter === "needs_pickup_3_5h" ? "all" : "needs_pickup_3_5h")}
            className={`p-4 rounded-2xl border text-left shadow-sm flex items-center justify-between transition-all ${
              pendingPickup3_5h > 0
                ? "bg-amber-50/70 border-amber-300"
                : "bg-white border-slate-200"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">3.5h Pickup Alerts</p>
              <p className="text-2xl font-black text-amber-700 mt-0.5">{pendingPickup3_5h} Pending</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </button>

          {/* Pending 30m Delivery Alerts */}
          <button
            onClick={() => setActionFilter(actionFilter === "needs_delivery_30m" ? "all" : "needs_delivery_30m")}
            className={`p-4 rounded-2xl border text-left shadow-sm flex items-center justify-between transition-all ${
              pendingDelivery30m > 0
                ? "bg-blue-50/70 border-blue-300"
                : "bg-white border-slate-200"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">30m Delivery Alerts</p>
              <p className="text-2xl font-black text-blue-700 mt-0.5">{pendingDelivery30m} Pending</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </button>

        </div>

        {/* Action Controls & Filtering Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search VRID, Driver, Facility (JFK8, DFW7), City..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none"
            >
              <option value="all">All Trip Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="en_route_pickup">En Route Pickup</option>
              <option value="at_pickup">At Pickup / Dock</option>
              <option value="in_transit">In Transit</option>
              <option value="at_delivery">At Delivery</option>
              <option value="delayed">Delayed / Breakdown</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* View Mode Switcher (Grid vs List vs Kanban) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => handleViewModeChange("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Grid Cards Layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid Cards</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Detailed Rows Layout"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detailed List</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Kanban Columns Board"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Open Templates Manager */}
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors shadow-xs"
              title="Message Templates Manager"
            >
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setIsCreateLoadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Load</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              title="Amazon Relay Extension Setup Guide"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Relay Sync</span>
            </button>

            <button
              onClick={fetchLoads}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow border border-slate-700 active:scale-95"
              title="Refresh Live Operations"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              <span>Refresh Board</span>
            </button>
          </div>

        </div>

        {/* Smart Action Quick-Pill Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setActionFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              actionFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>All Active ({totalActiveLoads})</span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter("critical")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              actionFilter === "critical"
                ? "bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-500/20"
                : criticalCount > 0
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Critical &amp; Delays ({criticalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter("needs_pickup_3_5h")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              actionFilter === "needs_pickup_3_5h"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : pendingPickup3_5h > 0
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Needs 3.5h Check-in ({pendingPickup3_5h})</span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter("needs_delivery_30m")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              actionFilter === "needs_delivery_30m"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : pendingDelivery30m > 0
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>Approaching Delivery ({pendingDelivery30m})</span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter("amazon_relay")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              actionFilter === "amazon_relay"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-orange-500" />
            <span>Amazon Relay ({loads.filter((l) => l.source === "amazon_relay").length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActionFilter("dat_spot")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap ${
              actionFilter === "dat_spot"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>DAT &amp; Spot ({loads.filter((l) => l.source !== "amazon_relay").length})</span>
          </button>
        </div>

        {/* Load Display Views */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Loading Live Operations Board...</p>
          </div>
        ) : loads.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-900">No Tours Synced Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your dispatch board is clean and ready. Open <span className="font-bold text-slate-800">relay.amazon.com/tours</span> with the Unique Dispatch Extension enabled to automatically sync live tours, or create a load manually.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsGuideOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Layers className="w-4 h-4 text-orange-400" />
                <span>Open Extension Setup Guide</span>
              </button>
              <button
                onClick={() => setIsCreateLoadOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Manual Load</span>
              </button>
            </div>
          </div>
        ) : displayedLoads.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">No Loads Match Current Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active tours match your selected filter for the {currentShift.toUpperCase()} shift. Clear filters or create a new load.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActionFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setIsCreateLoadOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
              >
                + Create New Load
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* View 1: Grid Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
            {displayedLoads.map((load) => (
              <LoadGridCard
                key={load.id}
                load={load}
                onLoadUpdated={handleLoadUpdated}
              />
            ))}
          </div>
        ) : viewMode === "kanban" ? (
          /* View 2: Kanban Columns Swimlane View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            
            {/* Column 1: Upcoming & Pre-Trip */}
            <div className="space-y-3 bg-slate-200/50 p-3 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Upcoming &amp; Pre-Trip ({kanbanUpcoming.length})</span>
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>
              <div className="space-y-3">
                {kanbanUpcoming.map((l) => (
                  <LoadGridCard key={l.id} load={l} onLoadUpdated={handleLoadUpdated} />
                ))}
                {kanbanUpcoming.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">No upcoming tours</p>
                )}
              </div>
            </div>

            {/* Column 2: Active / In-Transit */}
            <div className="space-y-3 bg-slate-200/50 p-3 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>In Transit ({kanbanActive.length})</span>
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  In Transit
                </span>
              </div>
              <div className="space-y-3">
                {kanbanActive.map((l) => (
                  <LoadGridCard key={l.id} load={l} onLoadUpdated={handleLoadUpdated} />
                ))}
                {kanbanActive.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">No tours in transit</p>
                )}
              </div>
            </div>

            {/* Column 3: Critical & Delayed */}
            <div className="space-y-3 bg-red-50/70 p-3 rounded-3xl border border-red-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Critical &amp; Delayed ({kanbanCritical.length})</span>
                </span>
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Urgent
                </span>
              </div>
              <div className="space-y-3">
                {kanbanCritical.map((l) => (
                  <LoadGridCard key={l.id} load={l} onLoadUpdated={handleLoadUpdated} />
                ))}
                {kanbanCritical.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">No critical alerts</p>
                )}
              </div>
            </div>

            {/* Column 4: Delivered */}
            <div className="space-y-3 bg-slate-200/50 p-3 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivered &amp; BOL ({kanbanDelivered.length})</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Delivered
                </span>
              </div>
              <div className="space-y-3">
                {kanbanDelivered.map((l) => (
                  <LoadGridCard key={l.id} load={l} onLoadUpdated={handleLoadUpdated} />
                ))}
                {kanbanDelivered.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">No delivered tours</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* View 3: Detailed List Rows View */
          <div className="space-y-4 animate-in fade-in duration-200">
            {displayedLoads.map((load) => (
              <LoadOperationsCard
                key={load.id}
                load={load}
                onLoadUpdated={handleLoadUpdated}
              />
            ))}
          </div>
        )}

      </main>

      {/* Message Templates Manager Modal */}
      {isTemplatesOpen && (
        <TemplateEditorModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
        />
      )}

      {/* Shift Handover Modal */}
      {isHandoverOpen && (
        <ShiftHandoverModal
          currentShift={currentShift}
          loads={loads}
          isOpen={isHandoverOpen}
          onClose={() => setIsHandoverOpen(false)}
          onHandoverComplete={fetchLoads}
        />
      )}

      {/* CSV / JSON Import Modal */}
      {isImportOpen && (
        <CsvImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportComplete={fetchLoads}
        />
      )}

      {/* Chrome Extension Guide Modal */}
      {isGuideOpen && (
        <ChromeExtensionGuide
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          onImportComplete={fetchLoads}
        />
      )}

      {/* Create Manual Load Drawer */}
      {isCreateLoadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-black tracking-tight">Create / Dispatch New Load</h3>
              <button onClick={() => setIsCreateLoadOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLoad} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Trip ID / Tour Number *</label>
                  <input
                    required
                    type="text"
                    value={newVrid}
                    onChange={(e) => setNewVrid(e.target.value)}
                    placeholder="e.g. 11A8B9C or 1049281 or VRID-9482710"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Equipment Type</label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value as EquipmentType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Dry Van (53')">Dry Van (53')</option>
                    <option value="Reefer (53')">Reefer (53')</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Step Deck">Step Deck</option>
                    <option value="26ft Box Truck">26ft Box Truck</option>
                    <option value="Power Only">Power Only</option>
                  </select>
                </div>
              </div>

              {/* Origin */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Origin City *</label>
                  <input
                    required
                    type="text"
                    value={newOriginCity}
                    onChange={(e) => setNewOriginCity(e.target.value)}
                    placeholder="e.g. Staten Island"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">State *</label>
                  <input
                    required
                    type="text"
                    value={newOriginState}
                    onChange={(e) => setNewOriginState(e.target.value)}
                    placeholder="NY"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Facility Code</label>
                  <input
                    type="text"
                    value={newOriginCode}
                    onChange={(e) => setNewOriginCode(e.target.value)}
                    placeholder="JFK8"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Dest City *</label>
                  <input
                    required
                    type="text"
                    value={newDestCity}
                    onChange={(e) => setNewDestCity(e.target.value)}
                    placeholder="e.g. Joliet"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">State *</label>
                  <input
                    required
                    type="text"
                    value={newDestState}
                    onChange={(e) => setNewDestState(e.target.value)}
                    placeholder="IL"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Facility Code</label>
                  <input
                    type="text"
                    value={newDestCode}
                    onChange={(e) => setNewDestCode(e.target.value)}
                    placeholder="MDW2"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              {/* Driver & Rate */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Driver Name *</label>
                  <input
                    type="text"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="Marcus Holloway"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Driver Phone *</label>
                  <input
                    type="text"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    placeholder="+1 (312) 555-0192"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rate USD ($)</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="3200"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateLoadOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider shadow"
                >
                  {isCreating ? "Creating..." : "Confirm & Dispatch Load"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Direct Issue Escalation Modal */}
      {escalationLoad && (
        <IssueEscalationModal
          load={escalationLoad}
          isOpen={Boolean(escalationLoad)}
          onClose={() => setEscalationLoad(null)}
          onEscalatedSuccess={(updated) => {
            handleLoadUpdated(updated);
            setEscalationLoad(null);
            fetchLoads();
          }}
        />
      )}

      {/* Direct Milestone / Custom Message Modal */}
      {messageLoad && (
        <MilestoneMessageModal
          load={messageLoad}
          milestone={messageMilestone}
          isOpen={Boolean(messageLoad)}
          onClose={() => setMessageLoad(null)}
          onLoggedSuccess={(updated) => {
            handleLoadUpdated(updated);
            setMessageLoad(null);
            fetchLoads();
          }}
        />
      )}

    </div>
  );
}
