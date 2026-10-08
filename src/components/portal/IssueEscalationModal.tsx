"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Send,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { Load, IncidentCategory, IncidentSeverity } from "@/lib/portal-types";

interface IssueEscalationModalProps {
  load: Load;
  isOpen: boolean;
  onClose: () => void;
  onEscalatedSuccess: (updatedLoad: Load) => void;
}

export default function IssueEscalationModal({
  load,
  isOpen,
  onClose,
  onEscalatedSuccess,
}: IssueEscalationModalProps) {
  const [category, setCategory] = useState<IncidentCategory>("breakdown");
  const [severity, setSeverity] = useState<IncidentSeverity>("high");
  const [location, setLocation] = useState(
    `${load.originCity}, ${load.originState} / en route to ${load.destCity}`
  );
  const [description, setDescription] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [detentionHours, setDetentionHours] = useState("");
  const [claimAmountUSD, setClaimAmountUSD] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories: { id: IncidentCategory; label: string; icon: string }[] = [
    { id: "breakdown", label: "Tractor / Trailer Breakdown", icon: "🛠️" },
    { id: "detention", label: "Shipper / Receiver Detention", icon: "⏳" },
    { id: "layover", label: "Layover / Overnight Delay", icon: "🏨" },
    { id: "roc_delay", label: "Amazon ROC Disruption Claim", icon: "📦" },
    { id: "facility_delay", label: "Facility Gate / Door Hold", icon: "🚪" },
    { id: "weather", label: "Severe Weather / Road Closure", icon: "❄️" },
    { id: "driver_emergency", label: "Driver Illness / Emergency", icon: "🚨" },
    { id: "refused_load", label: "Rejected / Damaged Freight", icon: "❌" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/loads/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadId: load.id,
          category,
          severity,
          description,
          location,
          actionsTaken,
          detentionHours: detentionHours ? Number(detentionHours) : undefined,
          claimAmountUSD: claimAmountUSD ? Number(claimAmountUSD) : undefined,
        }),
      });

      if (res.ok) {
        // Fetch updated load
        const loadRes = await fetch(`/api/loads/${load.id}`);
        const loadData = await loadRes.json();
        if (loadData.load) {
          onEscalatedSuccess(loadData.load);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-red-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Report Incident &amp; Escalate Load</h3>
              <p className="text-xs text-red-300">
                Load: <strong>{load.vrid}</strong> | Driver: {load.driverName} ({load.driverPhone})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-sm">
          
          {/* Incident Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Incident Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex flex-col gap-1 ${
                    category === c.id
                      ? "bg-red-50 border-red-500 text-red-900 shadow-sm ring-2 ring-red-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Severity Level &amp; Super Admin Alert
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["low", "medium", "high", "critical"] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider border transition-colors ${
                    severity === sev
                      ? sev === "critical"
                        ? "bg-red-600 text-white border-red-600 shadow-md animate-pulse"
                        : sev === "high"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>Exact Location / Mile Marker</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. I-20 East, Exit 94 (Jackson, MS)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>Detention (Hrs)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={detentionHours}
                  onChange={(e) => setDetentionHours(e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Claim ($ USD)</span>
                </label>
                <input
                  type="number"
                  value={claimAmountUSD}
                  onChange={(e) => setClaimAmountUSD(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Detailed Issue Summary <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the breakdown, delay, ROC ticket number, or reason for disruption..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Actions Taken */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Immediate Dispatcher Actions Taken &amp; Next Steps
            </label>
            <textarea
              rows={2}
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="e.g. Dispatched roadside service, notified receiver of adjusted ETA, submitted Amazon ROC delay ticket..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting..." : "Escalate & Trigger Admin Alert"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
