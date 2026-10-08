"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Truck,
  ArrowRightLeft,
  Upload,
  LogOut,
  Clock,
  Sun,
  Moon,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  FileText,
  Volume2,
  VolumeX,
} from "lucide-react";
import Logo from "@/components/Logo";
import { User, ShiftType } from "@/lib/portal-types";
import { isAudioEnabled, setAudioEnabled, playMilestoneChime } from "@/lib/audio-alerts";

interface PortalNavbarProps {
  currentUser: User | null;
  currentShift: ShiftType;
  onShiftChange: (shift: ShiftType) => void;
  onOpenHandoverModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenNewLoadModal?: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenGuideModal?: () => void;
}

export default function PortalNavbar({
  currentUser,
  currentShift,
  onShiftChange,
  onOpenHandoverModal,
  onOpenImportModal,
  onOpenNewLoadModal,
  onOpenTemplatesModal,
  onOpenGuideModal,
}: PortalNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [estTime, setEstTime] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [audioActive, setAudioActive] = useState(true);

  useEffect(() => {
    setAudioActive(isAudioEnabled());
  }, []);

  const handleToggleAudio = () => {
    const next = !audioActive;
    setAudioActive(next);
    setAudioEnabled(next);
    if (next) {
      playMilestoneChime();
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setEstTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/New_York",
          hour12: true,
        }) + " EST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/portal/login");
    } catch (e) {
      console.error(e);
      router.push("/portal/login");
    }
  };

  const isSuperAdmin = currentUser?.role === "super_admin";

  const navItems = [
    {
      name: "Operations Board",
      href: "/portal/dispatcher",
      icon: Truck,
      roles: ["dispatcher", "super_admin"],
    },
    {
      name: "Super Admin Hub",
      href: "/portal/admin",
      icon: LayoutDashboard,
      roles: ["super_admin"],
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a1128] text-white border-b border-slate-800 shadow-lg">
      
      {/* Top Status Bar */}
      <div className="bg-[#050914] px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-400 border-b border-slate-900 flex flex-wrap items-center justify-between gap-2 font-mono">
        
        {/* Live EST Clock & Desk Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>{estTime || "00:00:00 EST"}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>24/7 Dispatch Core Online</span>
          </div>
        </div>

        {/* Shift Selector */}
        <div className="flex items-center gap-2 font-sans">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Shift:</span>
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => onShiftChange("morning")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
                currentShift === "morning"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Morning Shift (06:00 - 14:00 EST)"
            >
              <Sun className="w-3 h-3" />
              <span>Day (06-14)</span>
            </button>

            <button
              onClick={() => onShiftChange("afternoon")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
                currentShift === "afternoon"
                  ? "bg-blue-500 text-white font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Afternoon Shift (14:00 - 22:00 EST)"
            >
              <Clock className="w-3 h-3" />
              <span>Aft (14-22)</span>
            </button>

            <button
              onClick={() => onShiftChange("night")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
                currentShift === "night"
                  ? "bg-indigo-600 text-white font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Night Shift (22:00 - 06:00 EST)"
            >
              <Moon className="w-3 h-3" />
              <span>Night (22-06)</span>
            </button>

            <button
              onClick={() => onShiftChange("all")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
                currentShift === "all"
                  ? "bg-slate-700 text-white font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="View all loads across all shifts"
            >
              <span>All</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Portal Title */}
        <div className="flex items-center gap-4">
          <Link href="/portal/dispatcher" className="focus:outline-none">
            <Logo variant="light" size="sm" />
          </Link>

          <div className="hidden md:block h-6 w-px bg-slate-800" />

          <div className="hidden md:flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600/20 text-orange-400 text-xs font-bold border border-orange-500/30 uppercase tracking-wider">
              Ops Portal v2.0
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            if (!item.roles.includes(currentUser?.role || "dispatcher")) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right User & Actions Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Audio Alert Chime Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow ${
              audioActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title={audioActive ? "Sound Alerts Active (Click to Mute)" : "Sound Alerts Muted (Click to Unmute)"}
          >
            {audioActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Alerts On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xl:inline">Muted</span>
              </>
            )}
          </button>

          {/* Quick Actions (Templates, Handover & Import) */}
          {onOpenTemplatesModal && (
            <button
              onClick={onOpenTemplatesModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-bold border border-orange-500/40 transition-colors shadow"
              title="Message Templates Manager"
            >
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span>Templates</span>
            </button>
          )}

          {onOpenGuideModal && (
            <button
              onClick={onOpenGuideModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow"
              title="Amazon Relay Sync Engine Setup Guide"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Sync Engine</span>
            </button>
          )}

          {onOpenHandoverModal && (
            <button
              onClick={onOpenHandoverModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow"
              title="Initiate Shift Handover"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-orange-400" />
              <span>Shift Handover</span>
            </button>
          )}

          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors shadow"
              title="Import CSV/JSON Tours or Sync Amazon Relay"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync / Import</span>
            </button>
          )}

          {/* User Profile / Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                {currentUser?.name.substring(0, 2).toUpperCase() || "UD"}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-black text-white">{currentUser?.name || "Dispatcher"}</p>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  {currentUser?.role === "super_admin" ? "Super Admin" : "Dispatcher"}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-2 space-y-1 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-bold text-white">{currentUser?.name}</p>
                  <p className="text-slate-400 text-[11px] truncate">{currentUser?.email}</p>
                </div>

                <Link
                  href="/portal/dispatcher"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Truck className="w-4 h-4 text-orange-400" />
                  <span>Operations Board</span>
                </Link>

                {onOpenTemplatesModal && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenTemplatesModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                  >
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span>Message Templates Manager</span>
                  </button>
                )}

                {isSuperAdmin && (
                  <Link
                    href="/portal/admin"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Super Admin Hub</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </header>
  );
}
