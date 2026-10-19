"use client";

import React, { useState } from "react";
import {
  MapPin,
  Truck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  ChevronRight,
  Navigation,
} from "lucide-react";
import { Load, MilestoneType, LoadStatus } from "@/lib/portal-types";
import LiveCountdownTimer from "./LiveCountdownTimer";
import MilestoneMessageModal from "./MilestoneMessageModal";
import IssueEscalationModal from "./IssueEscalationModal";
import { getSavedTemplates, renderTemplateWithLoad, buildWhatsAppLink } from "@/lib/custom-templates";

interface LoadGridCardProps {
  load: Load;
  onLoadUpdated: (updatedLoad: Load) => void;
  onViewDetails?: (load: Load) => void;
}

export default function LoadGridCard({
  load,
  onLoadUpdated,
  onViewDetails,
}: LoadGridCardProps) {
  const [activeMilestone, setActiveMilestone] = useState<MilestoneType | null>(null);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [copiedQuickMsg, setCopiedQuickMsg] = useState(false);
  const [copiedVrid, setCopiedVrid] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSubTripsOpen, setIsSubTripsOpen] = useState(false);

  // Stop count
  const stopsCount = load.stops?.length || load.totalStopsCount || 2;

  // Time calculations
  const pickupTimeMs = new Date(load.pickupTime).getTime();
  const deliveryTimeMs = new Date(load.deliveryTime).getTime();
  const nowMs = Date.now();

  const diffPickupHours = (pickupTimeMs - nowMs) / (3600 * 1000);
  const diffDeliveryMins = (deliveryTimeMs - nowMs) / (60 * 1000);

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

  const isCritical =
    load.isCriticalAlert ||
    load.hasActiveIncident ||
    load.status === "critical_alert" ||
    load.status === "delayed";

  const isDelivered = load.status === "delivered";

  // Card Borders & Styling
  let cardBorder = "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md";
  let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";

  if (isCritical) {
    cardBorder = "border-red-500 shadow-md ring-2 ring-red-500/20";
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

  const handleToggleMessageSent = () => handleTogglePickupCheckin();

  const handleQuickCopyDefault = async () => {
    try {
      const templates = getSavedTemplates();
      const targetMilestone = is30mDeliveryAlert
        ? "delivery_checkin_30m"
        : is3_5hPickupAlert
        ? "pickup_checkin_3_5h"
        : "pickup_checkin_3_5h";

      const matched = templates.find((t) => t.milestoneKey === targetMilestone) || templates[0];
      if (matched) {
        const text = renderTemplateWithLoad(matched.templateText, load);
        await navigator.clipboard.writeText(text);
        setCopiedQuickMsg(true);
        setTimeout(() => setCopiedQuickMsg(false), 2000);

        // Auto-mark message as sent
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cleanPhone = load.driverPhone.replace(/[^0-9]/g, "");
  const quickWhatsAppUrl = buildWhatsAppLink(
    load.driverPhone,
    `Hey ${load.driverName}, checking in for Load #${load.vrid}. Please reply with your current ETA.`
  );

  return (
    <div className={`bg-white rounded-3xl border flex flex-col justify-between transition-all duration-200 overflow-hidden ${cardBorder}`}>
      
      {/* 1. Critical Alert Banner */}
      {isCritical && (
        <div className="bg-red-600 text-white px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold gap-1 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-black uppercase">CRITICAL ALERT:</span>
            <span className="line-clamp-1 font-normal text-red-100">{load.alertReason || "Incident Reported"}</span>
          </div>
          <button
            onClick={() => setIsEscalateOpen(true)}
            className="px-2 py-0.5 rounded bg-black/40 hover:bg-black text-[10px] uppercase font-bold shrink-0"
          >
            Manage
          </button>
        </div>
      )}

      {/* 2. Automated Smart Milestone Alert Banner */}
      {is3_5hPickupAlert && !isCritical && (
        <div className="bg-amber-500 text-slate-950 px-3.5 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-bold gap-1.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span>3.5h Alert: Pre-Trip Check-In Required!</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isTogglingMessage}
              onClick={() => handleTogglePickupCheckin(true)}
              className="px-2.5 py-0.5 rounded bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-black uppercase shadow flex items-center gap-1 cursor-pointer transition-all"
              title="Click when you have messaged the driver - dismisses this alert immediately and stamps your name"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>✓ تأكيد الإرسال</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMilestone("pickup_checkin_3_5h")}
              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase shadow"
            >
              Templates
            </button>
          </div>
        </div>
      )}

      {is30mDeliveryAlert && !isCritical && (
        <div className="bg-blue-600 text-white px-3.5 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-bold gap-1.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span>30m Alert: Approaching Delivery (BOL)!</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isTogglingMessage}
              onClick={() => handleToggleDeliveryCheckin(true)}
              className="px-2.5 py-0.5 rounded bg-white text-blue-900 hover:bg-blue-50 text-[10px] font-black uppercase shadow flex items-center gap-1 cursor-pointer transition-all"
              title="Click when you have messaged the driver - dismisses this alert immediately and stamps your name"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>✓ تأكيد الإرسال</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMilestone("delivery_checkin_30m")}
              className="px-2 py-0.5 rounded bg-blue-800 hover:bg-blue-900 text-white text-[10px] font-bold uppercase shadow"
            >
              Templates
            </button>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 space-y-3.5 flex-1">
        
        {/* Top Meta Line: Prominent Trip VRID & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {load.screenIndex !== undefined && (
              <span
                className="px-2 py-1 rounded-lg bg-orange-600 text-white text-xs font-black shadow-xs"
                title="Position on Amazon Relay screen"
              >
                #{load.screenIndex + 1}
              </span>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0a1128] text-white border border-slate-700 shadow-xs">
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

            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase border border-slate-200">
              {load.source.replace("_", " ")}
            </span>

            {load.driverMode && (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[10px] font-black border border-slate-700">
                👤 {load.driverMode}
              </span>
            )}

            {load.arnNumbers && load.arnNumbers.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(load.arnNumbers![0]);
                }}
                className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 text-[10px] font-mono font-bold border border-orange-200 cursor-pointer hover:bg-orange-100"
                title="Click to copy ARN"
              >
                ARN #{load.arnNumbers[0]}
              </span>
            )}

            {stopsCount > 2 && (
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black border border-orange-300">
                ⚡ {stopsCount} Stops
              </span>
            )}
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase border tracking-wider ${statusBadge}`}>
            {load.status.replace("_", " ")}
          </span>
        </div>

        {/* CPT Alert Ribbon if present */}
        {load.cptTime && (
          <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded-xl text-[10px] font-black flex items-center justify-between shadow-2xs">
            <span>⚠️ CPT CUTOFF: {load.cptTime}</span>
            <span className="bg-slate-950 text-white px-1.5 py-0.2 rounded text-[9px] uppercase">Mandatory</span>
          </div>
        )}

        {/* Live Countdown Clock Badge */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 text-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {load.status === "en_route_pickup" || load.status === "upcoming" ? "Target Pickup:" : "Target Delivery:"}
          </span>
          <LiveCountdownTimer
            targetTimeIso={load.status === "en_route_pickup" || load.status === "upcoming" ? load.pickupTime : load.deliveryTime}
            label={load.status === "en_route_pickup" || load.status === "upcoming" ? "Pickup" : "Delivery"}
          />
        </div>

        {/* Route Details Box (Clickable to open visual multi-stop journey) */}
        <div
          onClick={() => onViewDetails?.(load)}
          className="p-3 rounded-2xl bg-slate-50 hover:bg-orange-50/40 border border-slate-200/80 hover:border-orange-300 transition-all cursor-pointer group space-y-2 shadow-2xs"
          title="Click to view full multi-stop journey timeline"
        >
          {/* Stops Count Header */}
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 text-[10px]">
            <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              <span>{stopsCount} Stops Route</span>
            </span>
            <span className="text-orange-600 group-hover:text-orange-700 font-bold inline-flex items-center gap-0.5">
              View Route <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          {/* Origin */}
          <div className="flex items-start justify-between text-xs">
            <div className="flex items-start gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">
                  {load.originFacilityCode && <strong className="text-orange-600 font-mono">[{load.originFacilityCode}] </strong>}
                  {load.originCity}, {load.originState}
                </p>
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <span>
                    {(() => {
                      const d = new Date(load.pickupTime);
                      const now = new Date();
                      const isToday = d.toDateString() === now.toDateString();
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const isTom = d.toDateString() === tomorrow.toDateString();
                      const tStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                      if (isToday) return `Today • ${tStr} EST`;
                      if (isTom) return `Tomorrow • ${tStr} EST`;
                      return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${tStr} EST`;
                    })()}
                  </span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Pickup
            </span>
          </div>

          <div className="border-l-2 border-dashed border-slate-300 ml-1 h-2" />

          {/* Destination */}
          <div className="flex items-start justify-between text-xs">
            <div className="flex items-start gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">
                  {load.destFacilityCode && <strong className="text-blue-600 font-mono">[{load.destFacilityCode}] </strong>}
                  {load.destCity}, {load.destState}
                </p>
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <span>
                    {(() => {
                      const d = new Date(load.deliveryTime);
                      const now = new Date();
                      const isToday = d.toDateString() === now.toDateString();
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const isTom = d.toDateString() === tomorrow.toDateString();
                      const tStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                      if (isToday) return `Today • ${tStr} EST`;
                      if (isTom) return `Tomorrow • ${tStr} EST`;
                      return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${tStr} EST`;
                    })()}
                  </span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              Delivery
            </span>
          </div>

        </div>

        {/* Interactive Sub-Trips Breakdown Accordion in Grid Card */}
        {((load.subTrips && load.subTrips.length > 0) || (load.stops && load.stops.length > 2)) && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setIsSubTripsOpen(!isSubTripsOpen)}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
                <span className="font-black text-slate-900 truncate">
                  ⚡ {load.subTrips?.length || (load.stops ? load.stops.length - 1 : 0)} Sub-Trips Breakdown
                </span>
                <span className="text-[10px] text-slate-500 font-normal shrink-0">
                  ({load.stops?.length || (load.subTrips ? load.subTrips.length + 1 : 0)} Stops)
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-600 font-black text-[11px] shrink-0">
                <span>{isSubTripsOpen ? "Hide" : "Show All"}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSubTripsOpen ? "rotate-90" : ""}`} />
              </div>
            </button>

            {isSubTripsOpen && (
              <div className="p-2.5 border-t border-slate-200 bg-white space-y-2 max-h-60 overflow-y-auto">
                {load.subTrips && load.subTrips.length > 0 ? (
                  load.subTrips.map((leg, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50/40 hover:border-orange-200 transition-all flex flex-wrap items-center justify-between gap-1.5 text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-md bg-orange-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                          {leg.legIndex || lIdx + 1}
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {leg.id}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-[11px] text-slate-700 truncate">
                          <span className="text-orange-600">[{leg.fromFacility}]</span>
                          <span>➔</span>
                          <span className="text-blue-600">[{leg.toFacility}]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {Boolean(leg.miles && leg.miles > 0) && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {leg.miles} mi
                          </span>
                        )}
                        {leg.duration && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {leg.duration}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          leg.action?.toLowerCase().includes("drop")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {leg.action || "Drop"}
                        </span>
                        {leg.hasDelay && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[9px] flex items-center gap-0.5" title={leg.delayReason || "Delay reported"}>
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                            <span>Delayed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  load.stops && load.stops.slice(1).map((stop, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center">
                          {sIdx + 2}
                        </span>
                        <span className="font-bold text-slate-900">
                          {stop.facilityCode ? `[${stop.facilityCode}] ` : ""}{stop.city}, {stop.state}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        {stop.activity || stop.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Equipment & Financials */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-100/70 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Equipment</span>
            <span className="font-bold text-slate-900 truncate block">{load.equipment}</span>
          </div>

          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Rate (Gross)</span>
            <span className="font-black text-emerald-900 text-sm block">
              {load.rateUSD > 0 ? `$${load.rateUSD.toLocaleString()}` : "Amazon Contract"}
            </span>
          </div>
        </div>

        {/* Driver Card Info */}
        <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-100 flex items-center gap-1">
              <span>{load.driverName}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {load.driverPhone} • {load.tractorNumber}
            </p>
            {isMsgSent && (
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  تم الإرسال{load.pickupCheckinBy || load.dispatcherMessageSentBy ? ` بواسطة ${load.pickupCheckinBy || load.dispatcherMessageSentBy}` : ""}
                  {msgSentTimeFormatted ? ` (${msgSentTimeFormatted})` : ""}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isTogglingMessage}
              onClick={handleToggleMessageSent}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                isMsgSent
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
              }`}
              title={
                isMsgSent
                  ? `Message marked as sent${load.pickupCheckinBy ? ` by ${load.pickupCheckinBy}` : ""}${msgSentTimeFormatted ? ` at ${msgSentTimeFormatted}` : ""}. Click to toggle.`
                  : "Click when you have sent a message to the driver"
              }
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMsgSent ? "text-white" : "text-emerald-400"}`} />
            </button>
            <a
              href={`tel:${cleanPhone}`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Call Driver"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
            <a
              href={quickWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              title="WhatsApp Driver"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* Card Action Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
        
        <div className="flex items-center gap-1.5">
          {/* Dispatcher 1-Click Message Sent Button */}
          <button
            type="button"
            disabled={isTogglingMessage}
            onClick={handleToggleMessageSent}
            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black shadow-xs transition-all border flex items-center justify-center gap-1 ${
              isMsgSent
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20"
                : "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300"
            }`}
            title={
              isMsgSent
                ? `تم الإرسال${load.pickupCheckinBy || load.dispatcherMessageSentBy ? ` بواسطة ${load.pickupCheckinBy || load.dispatcherMessageSentBy}` : ""}${msgSentTimeFormatted ? ` (${msgSentTimeFormatted})` : ""}. اضغط للتغيير.`
                : "اضغط لتسجيل إرسال الرسالة للسائق"
            }
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isMsgSent ? "text-white" : "text-emerald-600"}`} />
            <span>
              {isTogglingMessage
                ? "..."
                : isMsgSent
                ? `✓ تم الإرسال${load.pickupCheckinBy ? ` (${load.pickupCheckinBy})` : ""}`
                : "Msg Sent"}
            </span>
          </button>

          {/* View Details Modal Button */}
          <button
            type="button"
            onClick={() => onViewDetails?.(load)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-[#0a1128] hover:bg-slate-800 text-orange-400 text-[11px] font-black shadow-xs transition-colors border border-slate-700 cursor-pointer"
            title="Open complete multi-stop journey stepper and details"
          >
            <Navigation className="w-3.5 h-3.5 text-orange-400" />
            <span>
              {load.subTrips && load.subTrips.length > 0
                ? `${load.subTrips.length} Sub-Trips`
                : `Stops (${stopsCount})`}
            </span>
          </button>

          {/* 1-Click Copy Template */}
          <button
            type="button"
            onClick={handleQuickCopyDefault}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white border border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-800 text-[11px] font-bold shadow-xs transition-colors"
            title="Copy pre-configured milestone template for this tour"
          >
            {copiedQuickMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-orange-600" />}
            <span>{copiedQuickMsg ? "Copied" : "Copy"}</span>
          </button>

          {/* Milestone Modal Trigger */}
          <button
            type="button"
            onClick={() => setActiveMilestone(is30mDeliveryAlert ? "delivery_checkin_30m" : "pickup_checkin_3_5h")}
            className="p-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black shadow transition-colors"
            title="Message Templates"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Dropdown & Escalate */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <select
            value={load.status}
            disabled={isUpdatingStatus}
            onChange={(e) => handleStatusChange(e.target.value as LoadStatus)}
            className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 bg-white focus:outline-none"
          >
            <option value="upcoming">Upcoming</option>
            <option value="en_route_pickup">En Route Pickup</option>
            <option value="at_pickup">At Pickup</option>
            <option value="in_transit">In Transit</option>
            <option value="at_delivery">At Delivery</option>
            <option value="delayed">Delayed</option>
            <option value="delivered">Delivered</option>
          </select>

          <button
            type="button"
            onClick={() => setIsEscalateOpen(true)}
            className="px-2 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-[10px] font-bold"
          >
            Report Issue
          </button>
        </div>

      </div>

      {/* Modals */}
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
