"use client";

import React, { useState, useEffect, useCallback } from "react";
import PortalNavbar from "@/components/portal/PortalNavbar";
import LoadOperationsCard from "@/components/portal/LoadOperationsCard";
import LoadGridCard from "@/components/portal/LoadGridCard";
import ShiftHandoverModal from "@/components/portal/ShiftHandoverModal";
import CsvImportModal from "@/components/portal/CsvImportModal";
import ChromeExtensionGuide from "@/components/portal/ChromeExtensionGuide";
import TemplateEditorModal from "@/components/portal/TemplateEditorModal";
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
} from "lucide-react";
import { Load, User, ShiftType, EquipmentType } from "@/lib/portal-types";

type ViewMode = "grid" | "list" | "kanban";

export default function DispatcherOperationsBoardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<ShiftType>("morning");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modals
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreateLoadOpen, setIsCreateLoadOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

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
        setLoads(data.loads || []);
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
          vrid: newVrid || `VRID-${Math.floor(1000000 + Math.random() * 9000000)}`,
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

  // Kanban categorized loads
  const kanbanUpcoming = loads.filter(
    (l) => (l.status === "upcoming" || l.status === "en_route_pickup") && !l.isCriticalAlert && !l.hasActiveIncident
  );
  const kanbanActive = loads.filter(
    (l) => (l.status === "at_pickup" || l.status === "in_transit" || l.status === "at_delivery") && !l.isCriticalAlert && !l.hasActiveIncident
  );
  const kanbanCritical = loads.filter(
    (l) => l.isCriticalAlert || l.hasActiveIncident || l.status === "delayed" || l.status === "critical_alert"
  );
  const kanbanDelivered = loads.filter(
    (l) => l.status === "delivered"
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      
      {/* Portal Navbar Header */}
      <PortalNavbar
        currentUser={currentUser}
        currentShift={currentShift}
        onShiftChange={(s) => setCurrentShift(s)}
        onOpenHandoverModal={() => setIsHandoverOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
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
            onClick={() => setCriticalOnly(!criticalOnly)}
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
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">3.5h Pickup Alerts</p>
              <p className="text-2xl font-black text-amber-700 mt-0.5">{pendingPickup3_5h} Pending</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Pending 30m Delivery Alerts */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">30m Delivery Alerts</p>
              <p className="text-2xl font-black text-blue-700 mt-0.5">{pendingDelivery30m} Pending</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

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
              title="عرض الكروت المتجاورة (Grid Cards)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">كروت جنب بعض</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="عرض القائمة المفصل (Detailed Rows)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">قائمة مفصلة</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="عرض الأعمدة (Kanban Columns)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">أعمدة</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Open Templates Manager */}
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors shadow-xs"
              title="تعديل وتثبيت قوالب الرسائل الجاهزة"
            >
              <FileText className="w-4 h-4 text-orange-600" />
              <span>قوالب الرسائل</span>
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
              className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Refresh Live Operations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Load Display Views */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Loading Live Operations Board...</p>
          </div>
        ) : loads.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">No Loads Found for Current Shift</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active tours match your filters for the {currentShift.toUpperCase()} shift. Ingest tours from Amazon Relay or create one manually.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsCreateLoadOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
              >
                + Create First Load
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Import CSV / Relay Batch
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* View 1: Grid Cards View (كروت كدة جنب بعض) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
            {loads.map((load) => (
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
                  <span>قبل التحميل ({kanbanUpcoming.length})</span>
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
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">لا توجد رحلات قادمة</p>
                )}
              </div>
            </div>

            {/* Column 2: Active / In-Transit */}
            <div className="space-y-3 bg-slate-200/50 p-3 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>في الطريق ({kanbanActive.length})</span>
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
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">لا توجد رحلات في الطريق</p>
                )}
              </div>
            </div>

            {/* Column 3: Critical & Delayed */}
            <div className="space-y-3 bg-red-50/70 p-3 rounded-3xl border border-red-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>أعطال وتأخير ({kanbanCritical.length})</span>
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
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">لا توجد بلاغات أعطال حرجة</p>
                )}
              </div>
            </div>

            {/* Column 4: Delivered */}
            <div className="space-y-3 bg-slate-200/50 p-3 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم التسليم ({kanbanDelivered.length})</span>
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
                  <p className="text-center text-slate-400 text-xs py-8 font-medium">لا توجد رحلات منتهية</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* View 3: Detailed List Rows View */
          <div className="space-y-4 animate-in fade-in duration-200">
            {loads.map((load) => (
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
                  <label className="font-bold text-slate-700">VRID / Load Number *</label>
                  <input
                    required
                    type="text"
                    value={newVrid}
                    onChange={(e) => setNewVrid(e.target.value)}
                    placeholder="e.g. VRID-9482710"
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

    </div>
  );
}
