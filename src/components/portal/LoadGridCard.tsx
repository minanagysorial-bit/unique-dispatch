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
        <div className="bg-amber-500 text-slate-950 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span>3.5h Alert: Pre-Trip Check-In Required!</span>
          </div>
          <button
            onClick={() => setActiveMilestone("pickup_checkin_3_5h")}
            className="px-2 py-0.5 rounded bg-slate-950 text-white text-[10px] font-black uppercase shadow"
          >
            Send Now
          </button>
        </div>
      )}

      {is30mDeliveryAlert && !isCritical && (
        <div className="bg-blue-600 text-white px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span>30m Alert: Approaching Delivery (BOL)!</span>
          </div>
          <button
            onClick={() => setActiveMilestone("delivery_checkin_30m")}
            className="px-2 py-0.5 rounded bg-white text-blue-900 text-[10px] font-black uppercase shadow"
          >
            Send Now
          </button>
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

        {/* Equipment & Financials */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-100/70 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Equipment</span>
            <span className="font-bold text-slate-900 truncate block">{load.equipment}</span>
          </div>

          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Rate (Gross)</span>
            <span className="font-black text-emerald-900 text-sm block">${load.rateUSD.toLocaleString()}</span>
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
          </div>

          <div className="flex items-center gap-1.5">
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
          {/* View Details Modal Button */}
          <button
            type="button"
            onClick={() => onViewDetails?.(load)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-[#0a1128] hover:bg-slate-800 text-orange-400 text-[11px] font-black shadow-xs transition-colors border border-slate-700"
            title="Open complete multi-stop journey stepper and details"
          >
            <Navigation className="w-3.5 h-3.5 text-orange-400" />
            <span>View Stops ({stopsCount})</span>
          </button>

          {/* 1-Click Copy Template */}
          <button
            type="button"
            onClick={handleQuickCopyDefault}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-white border border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-800 text-[11px] font-bold shadow-xs transition-colors"
            title="Copy pre-configured milestone template for this tour"
          >
            {copiedQuickMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-orange-600" />}
            <span>{copiedQuickMsg ? "Copied!" : "Copy Msg"}</span>
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
