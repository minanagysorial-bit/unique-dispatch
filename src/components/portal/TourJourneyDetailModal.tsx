"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Truck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Clock,
  DollarSign,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Send,
  Navigation,
  CheckCircle2,
  Box,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Load, TourStop, MilestoneType, LoadStatus } from "@/lib/portal-types";
import LiveCountdownTimer from "./LiveCountdownTimer";
import MilestoneMessageModal from "./MilestoneMessageModal";
import IssueEscalationModal from "./IssueEscalationModal";
import { buildWhatsAppLink } from "@/lib/custom-templates";

interface TourJourneyDetailModalProps {
  load: Load | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadUpdated: (updatedLoad: Load) => void;
}

export default function TourJourneyDetailModal({
  load,
  isOpen,
  onClose,
  onLoadUpdated,
}: TourJourneyDetailModalProps) {
  const [copiedVrid, setCopiedVrid] = useState(false);
  const [copiedPacket, setCopiedPacket] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneType | null>(null);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !load) return null;

  // Prepare Stops Itinerary (Fall back to 2 synthesized stops if empty)
  const stops: TourStop[] =
    Array.isArray(load.stops) && load.stops.length > 0
      ? load.stops
      : [
          {
            sequenceNumber: 1,
            type: "pickup",
            activity: "pickup",
            facilityCode: load.originFacilityCode,
            city: load.originCity,
            state: load.originState,
            address: load.originAddress,
            appointmentTime: load.pickupTime,
            status:
              load.status === "en_route_pickup"
                ? "en_route"
                : load.status === "at_pickup"
                ? "arrived"
                : load.status === "in_transit" ||
                  load.status === "at_delivery" ||
                  load.status === "delivered"
                ? "completed"
                : "pending",
          },
          {
            sequenceNumber: 2,
            type: "delivery",
            activity: "delivery",
            facilityCode: load.destFacilityCode,
            city: load.destCity,
            state: load.destState,
            address: load.destAddress,
            appointmentTime: load.deliveryTime,
            status:
              load.status === "delivered"
                ? "completed"
                : load.status === "at_delivery"
                ? "arrived"
                : load.status === "in_transit"
                ? "en_route"
                : "pending",
          },
        ];

  // Calculations
  const totalMiles = load.distanceMiles || 0;
  const ratePerMile = totalMiles > 0 ? (load.rateUSD / totalMiles).toFixed(2) : null;
  const cleanPhone = load.driverPhone.replace(/[^0-9]/g, "");

  const isCritical =
    load.isCriticalAlert ||
    load.hasActiveIncident ||
    load.status === "critical_alert" ||
    load.status === "delayed";

  // Format Date & Time with relative tags (Today / Tomorrow / Specific Date)
  const formatStopDateTime = (isoDate?: string) => {
    if (!isoDate) return "Time Pending";
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "Time Pending";

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTom = d.toDateString() === tomorrow.toDateString();

    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return `Today • ${timeStr} EST`;
    if (isTom) return `Tomorrow • ${timeStr} EST`;

    const monthDayStr = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${monthDayStr} • ${timeStr} EST`;
  };

  // Helper for stop activity badge
  const getActivityBadge = (activity?: string, type?: string, seqNum?: number) => {
    const act = (activity || type || "").toLowerCase();
    if (act.includes("pickup") || seqNum === 1) {
      return {
        label: "Origin Pickup",
        bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
        nodeBg: "bg-emerald-500 ring-4 ring-emerald-100 text-white",
        lineColor: "border-emerald-500",
      };
    }
    if (act.includes("drop") || act.includes("hook") || act.includes("intermediate")) {
      return {
        label: act.includes("hook") ? "Hook / Drop Leg" : "Intermediate Stop",
        bg: "bg-amber-100 text-amber-900 border-amber-300",
        nodeBg: "bg-amber-500 ring-4 ring-amber-100 text-slate-950",
        lineColor: "border-amber-400",
      };
    }
    return {
      label: "Final Delivery",
      bg: "bg-blue-100 text-blue-900 border-blue-300",
      nodeBg: "bg-blue-600 ring-4 ring-blue-100 text-white",
      lineColor: "border-blue-500",
    };
  };

  // Helper for stop status badge
  const getStopStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case "arrived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <MapPin className="w-3 h-3 text-purple-600" /> At Facility Dock
          </span>
        );
      case "en_route":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Truck className="w-3 h-3 text-blue-600 animate-pulse" /> En-Route
          </span>
        );
      case "delayed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" /> Scheduled
          </span>
        );
    }
  };

  // 1-Click Complete Driver Route Packet Formatter
  const handleCopyDriverPacket = async () => {
    try {
      const stopsText = stops
        .map((s, idx) => {
          const isPU = idx === 0;
          const isDel = idx === stops.length - 1;
          const stopLabel = isPU
            ? "STOP 1 (ORIGIN PICKUP)"
            : isDel
            ? `STOP ${idx + 1} (FINAL DELIVERY)`
            : `STOP ${idx + 1} (INTERMEDIATE / DROP-HOOK)`;

          return `📍 ${stopLabel}\n• Facility: ${s.facilityCode ? `[${s.facilityCode}] ` : ""}${s.city}, ${s.state}\n• Address: ${s.address || "Amazon Logistics Facility"}\n• Appt Time: ${formatStopDateTime(s.appointmentTime)}\n• Activity: ${s.activity || (isPU ? "Pickup Loaded Trailer" : "Delivery / Drop")}\n`;
        })
        .join("\n");

      const packetText = `🚚 UNIQUE DISPATCH — TRIP ROUTE PACKET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trip ID: ${load.vrid}
Source: Amazon Relay
Equipment: ${load.equipment}
Assigned Driver: ${load.driverName} (${load.driverPhone})
Tractor: ${load.tractorNumber} | Trailer: ${load.trailerNumber}
Gross Rate: $${load.rateUSD.toLocaleString()} | Total Stops: ${stops.length}

${stopsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DRIVER INSTRUCTIONS:
1. Confirm departure 3.5 hours prior to Pickup.
2. Report any gate / dock delay exceeding 15 mins to Dispatch.
3. Upload BOL/POD immediately upon delivery completion.
📞 Dispatch Hotlines: +1 (332) 244-5533 / +1 (332) 244-5534`;

      await navigator.clipboard.writeText(packetText);
      setCopiedPacket(true);
      setTimeout(() => setCopiedPacket(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (newStatus: LoadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/loads/${load.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        onLoadUpdated(data.load);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // WhatsApp link with pre-filled multi-stop overview
  const whatsappMsg = `Hello ${load.driverName}, here are the details for Trip #${load.vrid} (${stops.length} stops):\nFrom: ${load.originFacilityCode || load.originCity} -> To: ${load.destFacilityCode || load.destCity}.\nPlease reply with your confirmation and current ETA.`;
  const whatsappUrl = buildWhatsAppLink(load.driverPhone, whatsappMsg);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header Bar */}
        <div className="bg-[#0a1128] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider bg-orange-950/80 px-1.5 py-0.5 rounded border border-orange-600/40">
                TRIP ID
              </span>
              <span className="font-mono font-black text-base sm:text-lg text-white tracking-wide select-all">
                {load.vrid}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(load.vrid);
                  setCopiedVrid(true);
                  setTimeout(() => setCopiedVrid(false), 2000);
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy Trip VRID"
              >
                {copiedVrid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold uppercase">
              {load.source.replace("_", " ")}
            </span>

            <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold">
              {load.equipment}
            </span>

            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                isCritical
                  ? "bg-red-600 text-white border-red-700 animate-pulse"
                  : load.status === "delivered"
                  ? "bg-slate-200 text-slate-800 border-slate-300"
                  : load.status === "in_transit"
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-emerald-600 text-white border-emerald-700"
              }`}
            >
              {load.status.replace("_", " ")}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Critical Alert Warning if active */}
          {isCritical && (
            <div className="bg-red-600 text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 animate-bounce" />
                <div>
                  <p className="font-black text-xs uppercase tracking-wider">Critical Alert on Trip</p>
                  <p className="text-xs text-red-100 font-medium">{load.alertReason || "Active incident reported. Immediate dispatcher attention required."}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEscalateOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black text-white text-xs font-bold uppercase transition-colors shrink-0"
              >
                Manage Issue
              </button>
            </div>
          )}

          {/* Key Metrics Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Total Stops */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Itinerary Stops
              </span>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-600" />
                <span className="font-black text-slate-900 text-lg sm:text-xl">
                  {stops.length} {stops.length === 1 ? "Stop" : "Stops"}
                </span>
              </div>
            </div>

            {/* Gross Rate */}
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs space-y-0.5 bg-emerald-50/30">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Gross Rate (Payout)
              </span>
              <div className="flex items-center gap-1">
                <span className="font-black text-emerald-800 text-lg sm:text-xl font-mono">
                  ${load.rateUSD.toLocaleString()}
                </span>
                {ratePerMile && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    ${ratePerMile}/mi
                  </span>
                )}
              </div>
            </div>

            {/* Distance */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Trip Distance
              </span>
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="font-black text-slate-900 text-lg sm:text-xl">
                  {totalMiles > 0 ? `${totalMiles.toLocaleString()} mi` : "Direct Route"}
                </span>
              </div>
            </div>

            {/* Weight */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payload Weight
              </span>
              <div className="flex items-center gap-1.5">
                <Box className="w-4 h-4 text-purple-600" />
                <span className="font-black text-slate-900 text-lg sm:text-xl">
                  {load.weightLbs.toLocaleString()} lbs
                </span>
              </div>
            </div>

          </div>

          {/* Section: Visual Multi-Stop Journey Timeline */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    Multi-Stop Journey Progression Line
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Complete chronological stop sequence &amp; arrival time windows
                  </p>
                </div>
              </div>

              {/* 1-Click Copy Driver Packet Button */}
              <button
                type="button"
                onClick={handleCopyDriverPacket}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0a1128] hover:bg-slate-800 text-orange-400 text-xs font-black shadow-xs transition-colors border border-slate-700"
                title="Copy entire formatted route itinerary for driver"
              >
                {copiedPacket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                <span>{copiedPacket ? "Copied Packet!" : "Copy Driver Route Packet"}</span>
              </button>
            </div>

            {/* Continuous Vertical Timeline Stepper */}
            <div className="relative pl-6 sm:pl-8 space-y-8 pt-2">
              
              {stops.map((stop, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === stops.length - 1;
                const badge = getActivityBadge(stop.activity, stop.type, idx + 1);

                return (
                  <div key={idx} className="relative group">
                    
                    {/* Continuous Vertical Line Connecting Nodes */}
                    {!isLast && (
                      <div
                        className={`absolute left-[-17px] sm:left-[-21px] top-6 bottom-[-32px] w-[3px] bg-gradient-to-b from-slate-400 to-slate-300 rounded-full group-hover:from-orange-500 group-hover:to-orange-400 transition-colors`}
                      />
                    )}

                    {/* Step Node Marker Circle */}
                    <div
                      className={`absolute left-[-26px] sm:left-[-30px] top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-transform group-hover:scale-110 ${badge.nodeBg}`}
                    >
                      {idx + 1}
                    </div>

                    {/* Stop Card */}
                    <div className="bg-slate-50/80 group-hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 group-hover:border-slate-300 transition-all space-y-3 shadow-2xs">
                      
                      {/* Top Header of Stop */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          
                          {stop.facilityCode && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-orange-400 font-mono font-black text-xs border border-slate-700">
                              [{stop.facilityCode}]
                            </span>
                          )}
                        </div>

                        <div>
                          {getStopStatusBadge(stop.status)}
                        </div>
                      </div>

                      {/* City, State & Full Address */}
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">
                          {stop.city}, {stop.state} {stop.postalCode ? `(${stop.postalCode})` : ""}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{stop.address || stop.facilityName || "Amazon Logistics Facility"}</span>
                        </p>
                      </div>

                      {/* Scheduled Appointment Window & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs">
                          <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Scheduled Appointment
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatStopDateTime(stop.appointmentTime)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs">
                          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Arrival Window / Dock
                            </span>
                            <span className="font-bold text-slate-700">
                              {stop.arrivalTimeWindowStart
                                ? `${new Date(stop.arrivalTimeWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(stop.arrivalTimeWindowEnd || stop.arrivalTimeWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : "Standard Facility Window"}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Notes / Special Instructions if available */}
                      {stop.notes && (
                        <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200 p-2 rounded-xl flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <span>{stop.notes}</span>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* Section: Driver Contact & Fleet Equipment Bar */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-md space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Assigned Driver &amp; Equipment Unit
                </span>
              </div>
              <span className="text-[11px] font-bold text-orange-400">
                {load.carrierName || "Unique Dispatch Fleet"} ({load.carrierMcDot || "MC-ACTIVE"})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Driver Details & Quick Actions */}
              <div className="space-y-2 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Driver Contact
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-white text-sm sm:text-base">
                      {load.driverName}
                    </h4>
                    <p className="text-xs font-mono text-slate-300">{load.driverPhone}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-orange-400" />
                      <span>Call</span>
                    </a>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow transition-colors"
                      title="Open WhatsApp Chat with Pre-filled Route"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Tractor & Trailer Equipment */}
              <div className="space-y-2 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Vehicle Units
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tractor ID</span>
                    <span className="font-mono font-black text-white text-sm">{load.tractorNumber}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Trailer ID</span>
                    <span className="font-mono font-black text-white text-sm">{load.trailerNumber}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Status Change Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Status:</span>
            <select
              value={load.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as LoadStatus)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none"
            >
              <option value="upcoming">Upcoming</option>
              <option value="en_route_pickup">En Route Pickup</option>
              <option value="at_pickup">At Pickup / Dock</option>
              <option value="in_transit">In Transit</option>
              <option value="at_delivery">At Delivery</option>
              <option value="delayed">Delayed</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* Quick Action Triggers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMilestone("in_transit_checkin")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Milestone Check-in</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEscalateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span>Report Issue</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>

        </div>

      </div>

      {/* Sub-Modals */}
      {activeMilestone && (
        <MilestoneMessageModal
          load={load}
          milestone={activeMilestone}
          isOpen={!!activeMilestone}
          onClose={() => setActiveMilestone(null)}
          onLoggedSuccess={(updated) => {
            onLoadUpdated(updated);
            setActiveMilestone(null);
          }}
        />
      )}

      {isEscalateOpen && (
        <IssueEscalationModal
          load={load}
          isOpen={isEscalateOpen}
          onClose={() => setIsEscalateOpen(false)}
          onEscalatedSuccess={(updated) => {
            onLoadUpdated(updated);
            setIsEscalateOpen(false);
          }}
        />
      )}

    </div>
  );
}
