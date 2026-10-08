"use client";

import React, { useState, useEffect } from "react";
import PortalNavbar from "@/components/portal/PortalNavbar";
import AdminKpiCards from "@/components/portal/AdminKpiCards";
import IncidentFeedTable from "@/components/portal/IncidentFeedTable";
import AuditTrailViewer from "@/components/portal/AuditTrailViewer";
import UserManagementModal from "@/components/portal/UserManagementModal";
import ChromeExtensionGuide from "@/components/portal/ChromeExtensionGuide";
import TemplateEditorModal from "@/components/portal/TemplateEditorModal";
import TeamManagementPanel from "@/components/portal/TeamManagementPanel";
import EmergencyAlertCenter from "@/components/portal/EmergencyAlertCenter";
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Users,
  Award,
  RefreshCw,
  Layers,
  UserPlus,
  ShieldCheck,
  Key,
} from "lucide-react";
import { User, DispatcherKpi, IncidentReport, AuditLog, ShiftType, Load } from "@/lib/portal-types";

export default function SuperAdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<ShiftType>("morning");
  const [activeTab, setActiveTab] = useState<"kpi" | "incidents" | "audit" | "team">("kpi");
  const [loading, setLoading] = useState(true);
  const [criticalLoads, setCriticalLoads] = useState<Load[]>([]);

  // Data States
  const [kpiOverview, setKpiOverview] = useState({
    totalLoads: 0,
    activeLoads: 0,
    deliveredLoads: 0,
    criticalLoads: 0,
    openIncidents: 0,
    avgCompliancePct: 98,
    onTimeDeliveryRate: "99.4%",
  });
  const [dispatcherKpis, setDispatcherKpis] = useState<DispatcherKpi[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch user session
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
      } else {
        setCurrentUser({
          id: "usr-admin-01",
          name: "Marven Awad",
          email: "admin@uniquedispatch.com",
          role: "super_admin",
          phone: "+1 (332) 244-5532",
          isActive: true,
          createdAt: "2026-01-01",
        });
      }

      // 2. Fetch KPIs
      const kpiRes = await fetch("/api/admin/kpis");
      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpiOverview(kpiData.overview);
        setDispatcherKpis(kpiData.dispatcherKpis || []);
      }

      // 3. Fetch Incidents
      const incRes = await fetch("/api/incidents");
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(incData.incidents || []);
      }

      // 4. Fetch Audit Logs
      const auditRes = await fetch("/api/audit");
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.auditLogs || []);
      }

      // 5. Fetch Users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      // 6. Fetch Critical Loads for Emergency Alert Center
      const loadsRes = await fetch("/api/loads?critical=true");
      if (loadsRes.ok) {
        const loadsData = await loadsRes.json();
        setCriticalLoads(loadsData.loads || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col relative">
      
      {/* Live Emergency Alert System (Top Ambient Strobe Bar, Bouncing Beacon Orb & Full-Screen Center Overlay) */}
      <EmergencyAlertCenter
        criticalLoads={criticalLoads}
        onSelectLoad={(load) => {
          window.location.href = `/portal/dispatcher`;
        }}
      />

      {/* Top Navbar */}
      <PortalNavbar
        currentUser={currentUser}
        currentShift={currentShift}
        onShiftChange={(s) => setCurrentShift(s)}
        onRefresh={fetchDashboardData}
        onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Dashboard Title & Admin Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Super Admin Governance Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Audited &amp; Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Oversee dispatcher message compliance, live incidents, audit trails, and user permissions
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors shadow-xs"
              title="Message Templates Manager"
            >
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Manage Team</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Relay Sync Key</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors shadow-xs active:scale-95"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4 text-orange-600" />
              <span>Refresh Data</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("kpi")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "kpi"
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Award className="w-4 h-4 text-orange-400" />
            <span>Dispatcher KPIs &amp; Performance</span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "team"
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Team &amp; Passwords Management ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "incidents"
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Incident Center ({incidents.filter((i) => i.status !== "resolved").length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Enterprise Audit Trail</span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Loading Governance Dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "kpi" && (
              <AdminKpiCards
                overview={kpiOverview}
                dispatcherKpis={dispatcherKpis}
              />
            )}

            {activeTab === "team" && (
              <TeamManagementPanel
                users={users}
                onDataChanged={fetchDashboardData}
                onOpenUserModal={() => setIsUserModalOpen(true)}
              />
            )}

            {activeTab === "incidents" && (
              <IncidentFeedTable
                incidents={incidents}
                onIncidentUpdated={fetchDashboardData}
              />
            )}

            {activeTab === "audit" && (
              <AuditTrailViewer logs={auditLogs} />
            )}
          </div>
        )}

      </main>

      {/* User Management Modal */}
      {isUserModalOpen && (
        <UserManagementModal
          users={users}
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onUserCreated={fetchDashboardData}
          onUserDeleted={fetchDashboardData}
        />
      )}

      {/* Chrome Extension Guide */}
      {isGuideOpen && (
        <ChromeExtensionGuide
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          onImportComplete={fetchDashboardData}
        />
      )}

      {/* Message Templates Manager Modal */}
      {isTemplatesOpen && (
        <TemplateEditorModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
        />
      )}

    </div>
  );
}
