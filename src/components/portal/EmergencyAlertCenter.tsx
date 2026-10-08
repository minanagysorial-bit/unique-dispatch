"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Phone,
  MessageSquare,
  Flame,
  ShieldAlert,
  ChevronRight,
  X,
  Radio,
  ExternalLink,
  Truck,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { Load } from "@/lib/portal-types";
import { playEmergencySiren, playUrgentAlert, isAudioEnabled, setAudioEnabled } from "@/lib/audio-alerts";

interface EmergencyAlertCenterProps {
  criticalLoads: Load[];
  onSelectLoad?: (load: Load) => void;
  onOpenEscalation?: (load: Load) => void;
  onOpenMessage?: (load: Load) => void;
}

export default function EmergencyAlertCenter({
  criticalLoads,
  onSelectLoad,
  onOpenEscalation,
  onOpenMessage,
}: EmergencyAlertCenterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLoadIndex, setActiveLoadIndex] = useState(0);
  const [hasAcknowledgedCurrent, setHasAcknowledgedCurrent] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);

  const count = criticalLoads.length;
  const currentLoad = criticalLoads[activeLoadIndex] || criticalLoads[0];

  // Auto-open modal once if a new critical load emerges and not acknowledged yet
  useEffect(() => {
    if (count > 0 && !hasAcknowledgedCurrent) {
      setIsModalOpen(true);
      playUrgentAlert();
    }
  }, [count, hasAcknowledgedCurrent]);

  const handleToggleSiren = () => {
    if (!isSirenActive) {
      playEmergencySiren();
      setIsSirenActive(true);
      setTimeout(() => setIsSirenActive(false), 2000);
    }
  };

  if (count === 0) return null;

  return (
    <>
      {/* 1. TOP EDGE AMBIENT EMERGENCY STROBE BAR */}
      <aside aria-label="Active emergency broadcast" className="sticky top-0 z-50 bg-red-600 text-white px-4 py-2 shadow-lg shadow-red-600/30 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black tracking-wide">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-white animate-ping absolute opacity-90" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 relative" />
          </div>
          <span className="uppercase flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-yellow-300" />
            <span>EMERGENCY DISPATCH ALERT:</span>
          </span>
          <span className="font-medium text-red-100 hidden md:inline">
            {count} {count === 1 ? "tour requires" : "tours require"} immediate dispatcher action &amp; carrier ROC ticket!
          </span>
          <span className="font-bold bg-white text-red-700 px-2 py-0.5 rounded-md text-xs">
            {count} CRITICAL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSiren}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition-all"
            title="Sound emergency siren"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sound Siren</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-red-50 text-red-700 text-xs font-black uppercase tracking-wider shadow-sm transition-all"
          >
            <span>Open Emergency Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* 2. FLOATING BOUNCING ALERT BEACON ORB (Bottom-Right Corner) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        
        {/* Pulsing Helper Pill */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950/95 text-white border-2 border-red-500/80 shadow-2xl shadow-red-500/40 backdrop-blur-md animate-pulse text-left hover:scale-105 transition-all group"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <div>
            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span>LIVE INCIDENT BROADCAST</span>
            </div>
            <div className="text-xs font-black text-white group-hover:text-red-300">
              {count} Critical {count === 1 ? "Breakdown" : "Alerts"} Active
            </div>
          </div>
        </button>

        {/* Big Bouncing Animated Emergency Orb */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative group p-4 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white shadow-2xl shadow-red-600/70 border-4 border-white animate-bounce focus:outline-none focus:ring-4 focus:ring-red-500/50 hover:scale-110 transition-transform"
          title="Open Critical Incident Center"
        >
          {/* Animated Glow Rings */}
          <span className="absolute -inset-1 rounded-full bg-red-500 opacity-75 blur-md animate-ping" />
          <span className="absolute -inset-2 rounded-full bg-red-600 opacity-40 blur-lg animate-pulse" />

          {/* Large Ringing Bell Icon */}
          <div className="relative flex items-center justify-center">
            <BellRing className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-[wiggle_1s_ease-in-out_infinite]" />
          </div>

          {/* Glowing Badge Counter */}
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black text-xs border-2 border-slate-950 shadow-md">
            {count}
          </span>
        </button>

      </div>

      {/* 3. FULL-SCREEN EMERGENCY ALERT MODAL OVERLAY */}
      {isModalOpen && currentLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          
          <div className="w-full max-w-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40 rounded-3xl border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] overflow-hidden flex flex-col max-h-[92vh] text-white">
            
            {/* Flashing Top Emergency Header */}
            <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-6 py-4 flex items-center justify-between border-b border-red-500/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-yellow-300">
                      HIGH PRIORITY INCIDENT ESCALATION
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white font-bold text-[10px]">
                      {activeLoadIndex + 1} of {count}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Critical Tour Breakdown / Delay Detected
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSiren}
                  className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-yellow-300 transition-colors"
                  title="Test Emergency Siren Tone"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setHasAcknowledgedCurrent(true);
                  }}
                  className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* VRID & Equipment & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Load / VRID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black font-mono text-white">{currentLoad.vrid}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs">
                      {currentLoad.equipment}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-black text-xs uppercase tracking-wider">
                      {currentLoad.status}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carrier / MC</span>
                  <p className="text-sm font-black text-white">{currentLoad.carrierName || "Unique Fleet"}</p>
                  <p className="text-xs text-slate-400 font-mono">{currentLoad.carrierMcDot || "MC-ACTIVE"}</p>
                </div>
              </div>

              {/* High-Visibility Incident Warning Box */}
              <div className="p-4 rounded-2xl bg-red-950/60 border-2 border-red-500/60 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Reported Incident Reason &amp; Operational Impact:</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-red-100 leading-snug">
                  {currentLoad.alertReason || currentLoad.notes || "Urgent delay or mechanical breakdown reported on active transit leg."}
                </p>
              </div>

              {/* Route & Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Route Leg */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>Route Transit</span>
                  </span>
                  
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Origin Shipper:</p>
                      <p className="font-black text-white text-sm">
                        {currentLoad.originCity}, {currentLoad.originState}
                        {currentLoad.originFacilityCode && ` (${currentLoad.originFacilityCode})`}
                      </p>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Destination Receiver:</p>
                      <p className="font-black text-white text-sm">
                        {currentLoad.destCity}, {currentLoad.destState}
                        {currentLoad.destFacilityCode && ` (${currentLoad.destFacilityCode})`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Driver & Dispatcher */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Driver In Cab</span>
                    </span>
                    <p className="font-black text-white text-base mt-1">{currentLoad.driverName || "Driver Unassigned"}</p>
                    <p className="text-xs font-mono text-slate-300 font-bold">{currentLoad.driverPhone || "No Phone on Record"}</p>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`tel:${currentLoad.driverPhone}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors shadow"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>
                    {onOpenMessage && (
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          onOpenMessage(currentLoad);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                        <span>Template</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Incident Navigation if Multiple Incidents */}
              {count > 1 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <span className="font-bold text-slate-300">
                    Switching between {count} urgent incidents:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {criticalLoads.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveLoadIndex(idx)}
                        className={`px-3 py-1 rounded-lg font-black transition-all ${
                          activeLoadIndex === idx
                            ? "bg-red-600 text-white shadow"
                            : "bg-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setHasAcknowledgedCurrent(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
              >
                Acknowledge &amp; Minimize Alarm
              </button>

              <div className="flex items-center gap-2">
                {onOpenEscalation && (
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      onOpenEscalation(currentLoad);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  >
                    <Flame className="w-4 h-4" />
                    <span>File ROC Claim / Escalate</span>
                  </button>
                )}
                {onSelectLoad && (
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      onSelectLoad(currentLoad);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
                  >
                    <span>Inspect Load Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </>
  );
}
