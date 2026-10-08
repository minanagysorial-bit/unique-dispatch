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
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { Load, MilestoneType, LoadStatus } from "@/lib/portal-types";
import LiveCountdownTimer from "./LiveCountdownTimer";
import MilestoneMessageModal from "./MilestoneMessageModal";
import IssueEscalationModal from "./IssueEscalationModal";

interface LoadOperationsCardProps {
  load: Load;
  onLoadUpdated: (updatedLoad: Load) => void;
}

export default function LoadOperationsCard({
  load,
  onLoadUpdated,
}: LoadOperationsCardProps) {
  const [activeMilestone, setActiveMilestone] = useState<MilestoneType | null>(null);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-bold gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-950 shrink-0 animate-spin" />
            <span>
              <strong>3.5-Hour Pre-Trip Milestone:</strong> Driver check-in required before pickup!
            </span>
          </div>
          <button
            onClick={() => setActiveMilestone("pickup_checkin_3_5h")}
            className="px-3 py-1 rounded bg-slate-950 text-white hover:bg-slate-800 text-[11px] font-black uppercase tracking-wider shrink-0 transition-colors shadow"
          >
            Send Check-In Now
          </button>
        </div>
      )}

      {is30mDeliveryAlert && !isCritical && (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span>
              <strong>30-Minute Delivery Alert:</strong> Approaching destination — send BOL reminder!
            </span>
          </div>
          <button
            onClick={() => setActiveMilestone("delivery_checkin_30m")}
            className="px-3 py-1 rounded bg-white text-blue-950 hover:bg-blue-50 text-[11px] font-black uppercase tracking-wider shrink-0 transition-colors shadow"
          >
            Send Delivery Alert
          </button>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        
        {/* Left VRID & Equipment */}
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#0f172a] text-white font-mono font-black text-xs tracking-wider shadow-sm">
            {load.vrid}
          </span>

          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-bold">
            {load.equipment}
          </span>

          {load.source === "amazon_relay" && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase">
              Amazon Relay
            </span>
          )}

          {load.rateUSD && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ${load.rateUSD.toLocaleString()}
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
        
        {/* Route Line: Origin -> Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Origin */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 font-bold text-xs">
              PU
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Origin Pickup</span>
                <span className="text-xs font-bold text-slate-900">
                  {new Date(load.pickupTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
              DEL
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Destination Drop</span>
                <span className="text-xs font-bold text-slate-900">
                  {new Date(load.deliveryTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
          </div>

        </div>

        {/* Operational Milestones Verification Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          
          {/* 3.5h Checkin */}
          <button
            type="button"
            onClick={() => setActiveMilestone("pickup_checkin_3_5h")}
            className={`p-2 rounded-lg border text-left text-[11px] font-bold flex items-center justify-between transition-colors ${
              load.pickupCheckinSent
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>3.5h Pickup Check</span>
            {load.pickupCheckinSent ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>

          {/* At Pickup */}
          <button
            type="button"
            onClick={() => setActiveMilestone("at_pickup_verify")}
            className="p-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 text-left text-[11px] font-bold flex items-center justify-between"
          >
            <span>At Pickup / Dock</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* 30m Delivery */}
          <button
            type="button"
            onClick={() => setActiveMilestone("delivery_checkin_30m")}
            className={`p-2 rounded-lg border text-left text-[11px] font-bold flex items-center justify-between transition-colors ${
              load.deliveryCheckinSent
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>30m Delivery Alert</span>
            {load.deliveryCheckinSent ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </button>

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
