"use client";

import React, { useState } from "react";
import {
  MapPin,
  Truck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  UserCheck,
  Copy,
  Check,
  Navigation,
} from "lucide-react";
import { Load, MilestoneType, LoadStatus } from "@/lib/portal-types";
import LiveCountdownTimer from "./LiveCountdownTimer";
import MilestoneMessageModal from "./MilestoneMessageModal";
import IssueEscalationModal from "./IssueEscalationModal";

interface LoadOperationsCardProps {
  load: Load;
  onLoadUpdated: (updatedLoad: Load) => void;
  onViewDetails?: (load: Load) => void;
}

export default function LoadOperationsCard({
  load,
  onLoadUpdated,
  onViewDetails,
}: LoadOperationsCardProps) {
  const [activeMilestone, setActiveMilestone] = useState<MilestoneType | null>(null);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isSubTripsOpen, setIsSubTripsOpen] = useState(false);
  const [copiedVrid, setCopiedVrid] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Stop count
  const stopsCount = load.stops?.length || load.totalStopsCount || 2;

  // Time calculations for milestone alerts
  const pickupTimeMs = new Date(load.pickupTime).getTime();
  const deliveryTimeMs = new Date(load.deliveryTime).getTime();
  const nowMs = Date.now();

  const diffPickupHours = (pickupTimeMs - nowMs) / (3600 * 1000);
  const diffDeliveryMins = (deliveryTimeMs - nowMs) / (60 * 1000);

  // Smart alert conditions
  const is3_5hPickupAlert =
    !load.pickupCheckinSent &&
    diffPickupHours <= 3.5 &&
    diffPickupHours >= -4 &&
    load.status !== "delivered" &&
    load.status !== "cancelled";

  const is30mDeliveryAlert =
    !load.deliveryCheckinSent &&
    diffDeliveryMins <= 30 &&
    diffDeliveryMins >= -60 &&
    load.status !== "delivered" &&
    load.status !== "cancelled";

  // Status Colors
  const isCritical =
    load.isCriticalAlert ||
    load.hasActiveIncident ||
    load.status === "critical_alert" ||
    load.status === "delayed";

  const isDelivered = load.status === "delivered";

  let cardBorder = "border-slate-200 hover:border-slate-300";
  let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";

  if (isCritical) {
    cardBorder = "border-red-500 shadow-md ring-1 ring-red-500/20";
    statusBadge = "bg-red-600 text-white border-red-700 animate-pulse";
  } else if (isDelivered) {
    cardBorder = "border-slate-200 opacity-80 bg-slate-50/50";
    statusBadge = "bg-slate-200 text-slate-700 border-slate-300";
  } else if (load.status === "in_transit") {
    statusBadge = "bg-blue-600 text-white border-blue-700";
  } else if (load.status === "at_pickup" || load.status === "at_delivery") {
    statusBadge = "bg-purple-600 text-white border-purple-700";
  }

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

  const [isTogglingMessage, setIsTogglingMessage] = useState(false);

  const isMsgSent = Boolean(load.dispatcherMessageSent || load.pickupCheckinSent);
  const msgSentTime = load.dispatcherMessageSentAt || load.pickupCheckinSentAt;
  const msgSentTimeFormatted = msgSentTime
    ? new Date(msgSentTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  const handleToggleMessageSent = async () => {
    setIsTogglingMessage(true);
    try {
      const willBeSent = !isMsgSent;
      const nowIso = willBeSent ? new Date().toISOString() : undefined;
      const res = await fetch(`/api/loads/${load.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatcherMessageSent: willBeSent,
          dispatcherMessageSentAt: nowIso,
          pickupCheckinSent: willBeSent,
          pickupCheckinSentAt: nowIso,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onLoadUpdated(data.load);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingMessage(false);
    }
  };

  const handleTogglePickupCheckin = async (forceState?: boolean) => {
    setIsTogglingMessage(true);
    try {
      const willBeSent = forceState !== undefined ? forceState : !load.pickupCheckinSent;
      const nowIso = willBeSent ? new Date().toISOString() : undefined;
      const res = await fetch(`/api/loads/${load.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCheckinSent: willBeSent,
          pickupCheckinSentAt: nowIso,
          dispatcherMessageSent: willBeSent,
          dispatcherMessageSentAt: nowIso,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onLoadUpdated(data.load);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingMessage(false);
    }
  };

  const handleToggleDeliveryCheckin = async (forceState?: boolean) => {
    setIsTogglingMessage(true);
    try {
      const willBeSent = forceState !== undefined ? forceState : !load.deliveryCheckinSent;
      const nowIso = willBeSent ? new Date().toISOString() : undefined;
      const res = await fetch(`/api/loads/${load.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryCheckinSent: willBeSent,
          deliveryCheckinSentAt: nowIso,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onLoadUpdated(data.load);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingMessage(false);
    }
  };

  const cleanPhone = load.driverPhone.replace(/[^0-9]/g, "");

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${cardBorder}`}
    >
      {/* 1. Critical Alert Banner (if delayed or breakdown reported) */}
      {isCritical && (
        <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold gap-2 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="uppercase tracking-wide font-black">CRITICAL ACTION REQUIRED:</span>
            <span className="font-medium text-red-100 line-clamp-1">{load.alertReason || "Active Incident Reported"}</span>
          </div>
          <button
            onClick={() => setIsEscalateOpen(true)}
            className="px-2.5 py-1 rounded bg-red-950 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors"
          >
            Manage Issue
          </button>
        </div>
      )}

      {/* 2. Automated Smart Milestone Alert Banners */}
      {is3_5hPickupAlert && !isCritical && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-bold gap-2 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-950 shrink-0 animate-spin" />
            <span>
              <strong>3.5-Hour Pre-Trip Milestone:</strong> Driver check-in required before pickup!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTogglingMessage}
              onClick={() => handleTogglePickupCheckin(true)}
              className="px-3 py-1 rounded bg-slate-950 text-white hover:bg-slate-800 text-[11px] font-black uppercase tracking-wider shrink-0 transition-all shadow flex items-center gap-1.5 cursor-pointer"
              title="Click when you have messaged the driver - dismisses this alert immediately and stamps your name"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>✓ تأكيد الإرسال (Mark Sent)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMilestone("pickup_checkin_3_5h")}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold tracking-wider shrink-0 shadow-xs cursor-pointer"
            >
              Templates
            </button>
          </div>
        </div>
      )}

      {is30mDeliveryAlert && !isCritical && (
        <div className="bg-blue-600 text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs font-bold gap-2 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span>
              <strong>30-Minute Delivery Alert:</strong> Approaching destination — send BOL reminder!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTogglingMessage}
              onClick={() => handleToggleDeliveryCheckin(true)}
              className="px-3 py-1 rounded bg-white text-blue-950 hover:bg-blue-50 text-[11px] font-black uppercase tracking-wider shrink-0 transition-all shadow flex items-center gap-1.5 cursor-pointer"
              title="Click when you have messaged the driver - dismisses this alert immediately and stamps your name"
            >
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span>✓ تأكيد الإرسال (Mark Sent)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMilestone("delivery_checkin_30m")}
              className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold tracking-wider shrink-0 shadow-xs cursor-pointer"
            >
              Templates
            </button>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        
        {/* Left VRID & Equipment */}
        <div className="flex flex-wrap items-center gap-2">
          {load.screenIndex !== undefined && (
            <span
              className="px-2 py-1 rounded-lg bg-orange-600 text-white text-xs font-black shadow-xs"
              title="Position on Amazon Relay screen"
            >
              #{load.screenIndex + 1}
            </span>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a1128] text-white border border-slate-700 shadow-xs">
            <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider bg-orange-950/80 px-1.5 py-0.5 rounded border border-orange-600/40">
              TRIP ID
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-white tracking-wide select-all">
              {load.vrid}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(load.vrid);
              setCopiedVrid(true);
              setTimeout(() => setCopiedVrid(false), 2000);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition-colors border border-slate-200"
            title="Copy Trip VRID"
          >
            {copiedVrid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold">
            {load.equipment}
          </span>

          {load.source === "amazon_relay" && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase">
              Amazon Relay
            </span>
          )}

          {stopsCount > 2 && (
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-black uppercase">
              ⚡ {stopsCount} Stops Route
            </span>
          )}

          {load.driverMode && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-black uppercase">
              👤 {load.driverMode}
            </span>
          )}

          {load.arnNumbers && load.arnNumbers.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(load.arnNumbers![0]);
              }}
              className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-mono font-bold hover:bg-orange-100 cursor-pointer"
              title="Click to copy ARN"
            >
              ARN #{load.arnNumbers[0]}
            </span>
          )}

          {load.cptTime && (
            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
              ⚠️ CPT: {load.cptTime}
            </span>
          )}

          {load.rateUSD > 0 ? (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ${load.rateUSD.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Amazon Contract
            </span>
          )}
        </div>

        {/* Right Live Countdown Timer */}
        <div className="flex items-center gap-2">
          <LiveCountdownTimer
            targetTimeIso={load.status === "upcoming" || load.status === "en_route_pickup" ? load.pickupTime : load.deliveryTime}
            label={load.status === "upcoming" || load.status === "en_route_pickup" ? "Pickup" : "Delivery"}
            status={load.status}
          />
        </div>

      </div>

      {/* Route & Driver Details */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Route Line: Origin -> Destination (Clickable to open visual multi-stop journey) */}
        <div
          onClick={() => onViewDetails?.(load)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 rounded-2xl hover:bg-orange-50/30 transition-all cursor-pointer border border-transparent hover:border-orange-200 group"
          title="Click to view complete multi-stop journey timeline"
        >
          
          {/* Origin */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:border-slate-200 transition-all">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 font-bold text-xs">
              PU
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Origin Pickup</span>
                <span className="text-xs font-bold text-slate-900">
                  {(() => {
                    const d = new Date(load.pickupTime);
                    const now = new Date();
                    const isToday = d.toDateString() === now.toDateString();
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const isTom = d.toDateString() === tomorrow.toDateString();
                    const tStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                    if (isToday) return `Today • ${tStr}`;
                    if (isTom) return `Tomorrow • ${tStr}`;
                    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${tStr}`;
                  })()}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 truncate">
                {load.originFacilityCode ? `${load.originFacilityCode} - ` : ""}
                {load.originCity}, {load.originState}
              </p>
              {load.originAddress && (
                <p className="text-[11px] text-slate-500 truncate">{load.originAddress}</p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:border-slate-200 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
              DEL
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Destination Drop</span>
                <span className="text-xs font-bold text-slate-900">
                  {(() => {
                    const d = new Date(load.deliveryTime);
                    const now = new Date();
                    const isToday = d.toDateString() === now.toDateString();
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const isTom = d.toDateString() === tomorrow.toDateString();
                    const tStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                    if (isToday) return `Today • ${tStr}`;
                    if (isTom) return `Tomorrow • ${tStr}`;
                    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${tStr}`;
                  })()}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 truncate">
                {load.destFacilityCode ? `${load.destFacilityCode} - ` : ""}
                {load.destCity}, {load.destState}
              </p>
              {load.destAddress && (
                <p className="text-[11px] text-slate-500 truncate">{load.destAddress}</p>
              )}
            </div>
          </div>

        </div>

        {/* Interactive Sub-Trips Breakdown Accordion */}
        {((load.subTrips && load.subTrips.length > 0) || (load.stops && load.stops.length > 2)) && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsSubTripsOpen(!isSubTripsOpen)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="font-black text-slate-900">
                  ⚡ {load.subTrips?.length || (load.stops ? load.stops.length - 1 : 0)} Sub-Trips Breakdown
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ({load.stops?.length || (load.subTrips ? load.subTrips.length + 1 : 0)} Total Stops)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-600 font-black text-[11px]">
                <span>{isSubTripsOpen ? "Hide Breakdown" : "View All Sub-Trips"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSubTripsOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isSubTripsOpen && (
              <div className="p-3 border-t border-slate-200 bg-white space-y-2 max-h-72 overflow-y-auto">
                {load.subTrips && load.subTrips.length > 0 ? (
                  load.subTrips.map((leg, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-orange-50/40 hover:border-orange-200 transition-all flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-orange-600 text-white font-black text-[10px] flex items-center justify-center">
                          {leg.legIndex || lIdx + 1}
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {leg.id}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <span className="text-orange-600">[{leg.fromFacility}]</span>
                          <span>➔</span>
                          <span className="text-blue-600">[{leg.toFacility}]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {Boolean(leg.miles && leg.miles > 0) && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {leg.miles} mi
                          </span>
                        )}
                        {leg.duration && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                            {leg.duration}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          leg.action?.toLowerCase().includes("drop")
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-purple-100 text-purple-800 border border-purple-200"
                        }`}>
                          {leg.action || "Drop"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  load.stops?.map((stop, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800">Stop #{stop.sequenceNumber}: [{stop.facilityCode || stop.city}]</span>
                      <span className="text-slate-500">{stop.appointmentTime ? new Date(stop.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pending"}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Driver & Equipment Bar */}
        <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-orange-400" />
            <span>
              Driver: <strong className="text-white">{load.driverName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span>
              Tractor: <strong className="text-white">{load.tractorNumber}</strong>
            </span>
            <span>•</span>
            <span>
              Trailer: <strong className="text-white">{load.trailerNumber}</strong>
            </span>
          </div>

          {/* Direct Communication Action Links */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              title={`Call ${load.driverName}`}
            >
              <Phone className="w-3 h-3 text-orange-400" />
              <span>{load.driverPhone}</span>
            </a>

            <a
              href={`https://wa.me/${cleanPhone.startsWith("1") ? cleanPhone : "1" + cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              title="WhatsApp Driver"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              disabled={isTogglingMessage}
              onClick={handleToggleMessageSent}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isMsgSent
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
              }`}
              title={
                isMsgSent
                  ? `Message marked as sent${msgSentTimeFormatted ? ` at ${msgSentTimeFormatted}` : ""}. Click to toggle.`
                  : "Click when you have sent a message to the driver"
              }
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMsgSent ? "text-white" : "text-emerald-400"}`} />
              <span>
                {isTogglingMessage
                  ? "Saving..."
                  : isMsgSent
                  ? `Msg Sent${msgSentTimeFormatted ? ` (${msgSentTimeFormatted})` : ""}`
                  : "Mark Sent"}
              </span>
            </button>
          </div>

        </div>

        {/* Operational Milestones Verification Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          
          {/* 3.5h Checkin Checkbox & Accountability */}
          <div
            className={`p-2.5 rounded-xl border text-left text-[11px] flex items-center justify-between gap-2 transition-all ${
              load.pickupCheckinSent
                ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-bold">
                <button
                  type="button"
                  disabled={isTogglingMessage}
                  onClick={() => handleTogglePickupCheckin()}
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all border cursor-pointer ${
                    load.pickupCheckinSent
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                      : "bg-white border-slate-400 hover:border-emerald-500 hover:bg-emerald-50"
                  }`}
                  title={
                    load.pickupCheckinSent
                      ? `تم الإرسال بواسطة ${load.pickupCheckinBy || load.dispatcherMessageSentBy || "Alex Reed"}. اضغط للإلغاء.`
                      : "اضغط لتسجيل إرسال الرسالة للسائق قبل الرحلة بـ 3.5 ساعة"
                  }
                >
                  {load.pickupCheckinSent ? <Check className="w-3 h-3 text-white stroke-[3]" /> : null}
                </button>
                <span className="truncate">3.5h Pickup Check</span>
              </div>

              {load.pickupCheckinSent ? (
                <p className="text-[10px] text-emerald-700 font-semibold truncate mt-1">
                  تم الإرسال بواسطة {load.pickupCheckinBy || load.dispatcherMessageSentBy || "Alex Reed"}
                  {load.pickupCheckinSentAt ? ` (${new Date(load.pickupCheckinSentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })})` : ""}
                </p>
              ) : (
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Check-in Required</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveMilestone("pickup_checkin_3_5h")}
              className="p-1 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-800 transition-colors cursor-pointer shrink-0"
              title="Open message templates"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>

          {/* At Pickup */}
          <button
            type="button"
            onClick={() => setActiveMilestone("at_pickup_verify")}
            className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 text-left text-[11px] font-bold flex items-center justify-between"
          >
            <span>At Pickup / Dock</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* 30m Delivery Checkbox & Accountability */}
          <div
            className={`p-2.5 rounded-xl border text-left text-[11px] flex items-center justify-between gap-2 transition-all ${
              load.deliveryCheckinSent
                ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-bold">
                <button
                  type="button"
                  disabled={isTogglingMessage}
                  onClick={() => handleToggleDeliveryCheckin()}
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all border cursor-pointer ${
                    load.deliveryCheckinSent
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                      : "bg-white border-slate-400 hover:border-emerald-500 hover:bg-emerald-50"
                  }`}
                  title={
                    load.deliveryCheckinSent
                      ? `تم الإرسال بواسطة ${load.deliveryCheckinBy || "Alex Reed"}. اضغط للإلغاء.`
                      : "اضغط لتسجيل إرسال تنبيه التسليم"
                  }
                >
                  {load.deliveryCheckinSent ? <Check className="w-3 h-3 text-white stroke-[3]" /> : null}
                </button>
                <span className="truncate">30m Delivery Alert</span>
              </div>

              {load.deliveryCheckinSent ? (
                <p className="text-[10px] text-emerald-700 font-semibold truncate mt-1">
                  تم الإرسال بواسطة {load.deliveryCheckinBy || "Alex Reed"}
                  {load.deliveryCheckinSentAt ? ` (${new Date(load.deliveryCheckinSentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })})` : ""}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 font-medium truncate mt-1">
                  Delivery reminder
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveMilestone("delivery_checkin_30m")}
              className="p-1 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-800 transition-colors cursor-pointer shrink-0"
              title="Open message templates"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>

          {/* BOL / POD */}
          <button
            type="button"
            onClick={() => setActiveMilestone("pod_bol_collection")}
            className="p-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 text-left text-[11px] font-bold flex items-center justify-between"
          >
            <span>BOL / POD Collection</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

        </div>

      </div>

      {/* Card Footer: Status Update & Incident Escalation */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status:</span>
          <select
            value={load.status}
            disabled={isUpdatingStatus}
            onChange={(e) => handleStatusChange(e.target.value as LoadStatus)}
            className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider border focus:outline-none cursor-pointer ${statusBadge}`}
          >
            <option value="upcoming">Upcoming</option>
            <option value="en_route_pickup">En Route Pickup</option>
            <option value="at_pickup">At Pickup / Dock</option>
            <option value="in_transit">In Transit</option>
            <option value="at_delivery">At Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
            <option value="critical_alert">Critical Alert</option>
          </select>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Dispatcher 1-Click Message Sent Button */}
          <button
            type="button"
            disabled={isTogglingMessage}
            onClick={handleToggleMessageSent}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-xs ${
              isMsgSent
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-emerald-600/20"
                : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300"
            }`}
            title={
              isMsgSent
                ? `Message recorded as sent${msgSentTimeFormatted ? ` at ${msgSentTimeFormatted}` : ""}. Click to toggle.`
                : "Click to record that you have sent a dispatch message to the driver"
            }
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isMsgSent ? "text-white" : "text-emerald-600"}`} />
            <span>
              {isTogglingMessage
                ? "Saving..."
                : isMsgSent
                ? `✓ Msg Sent${msgSentTimeFormatted ? ` (${msgSentTimeFormatted})` : ""}`
                : "✉️ Mark Msg Sent"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onViewDetails?.(load)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a1128] hover:bg-slate-800 text-orange-400 font-bold text-xs border border-slate-700 transition-colors shadow-xs"
            title="Open full multi-stop journey stepper and itinerary details"
          >
            <Navigation className="w-3.5 h-3.5 text-orange-400" />
            <span>View Stops ({stopsCount})</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const { getSavedTemplates, renderTemplateWithLoad } = await import("@/lib/custom-templates");
                const templates = getSavedTemplates();
                const targetKey = is30mDeliveryAlert
                  ? "delivery_checkin_30m"
                  : is3_5hPickupAlert
                  ? "pickup_checkin_3_5h"
                  : "pickup_checkin_3_5h";
                const matched = templates.find((t) => t.milestoneKey === targetKey) || templates[0];
                if (matched) {
                  const txt = renderTemplateWithLoad(matched.templateText, load);
                  await navigator.clipboard.writeText(txt);

                  // Auto-record message as sent
                  const nowIso = new Date().toISOString();
                  const res = await fetch(`/api/loads/${load.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      dispatcherMessageSent: true,
                      dispatcherMessageSentAt: nowIso,
                      pickupCheckinSent: true,
                      pickupCheckinSentAt: nowIso,
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    onLoadUpdated(data.load);
                  }
                  alert("✓ Load milestone message copied & marked as Sent!");
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs border border-orange-200 transition-colors"
            title="Copy milestone message to clipboard immediately"
          >
            <Send className="w-3.5 h-3.5 text-orange-600" />
            <span>Copy Msg</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEscalateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>Report Issue</span>
          </button>
        </div>

      </div>

      {/* Milestone Message Modal */}
      {activeMilestone && (
        <MilestoneMessageModal
          load={load}
          milestone={activeMilestone}
          isOpen={!!activeMilestone}
          onClose={() => setActiveMilestone(null)}
          onLoggedSuccess={onLoadUpdated}
        />
      )}

      {/* Issue Escalation Modal */}
      {isEscalateOpen && (
        <IssueEscalationModal
          load={load}
          isOpen={isEscalateOpen}
          onClose={() => setIsEscalateOpen(false)}
          onEscalatedSuccess={onLoadUpdated}
        />
      )}

    </div>
  );
}
