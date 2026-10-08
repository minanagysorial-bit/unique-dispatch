"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  UserCheck,
  Check,
  Search,
} from "lucide-react";
import { IncidentReport, IncidentStatus } from "@/lib/portal-types";

interface IncidentFeedTableProps {
  incidents: IncidentReport[];
  onIncidentUpdated: () => void;
}

export default function IncidentFeedTable({
  incidents,
  onIncidentUpdated,
}: IncidentFeedTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [targetStatus, setTargetStatus] = useState<IncidentStatus>("resolved");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = incidents.filter((i) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "open") return i.status === "open" || i.status === "under_investigation";
    return i.status === filterStatus;
  });

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/${resolvingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          resolutionNotes: resolutionNotes || "Reviewed and closed by Super Admin",
        }),
      });

      if (res.ok) {
        setResolvingId(null);
        setResolutionNotes("");
        onIncidentUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "breakdown":
        return "bg-red-100 text-red-800 border-red-300";
      case "detention":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "roc_delay":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-red-600 text-white animate-pulse";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-amber-500 text-slate-950";
      default:
        return "bg-slate-200 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      
      {/* Header & Filter Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Incident Management &amp; Escalation Center
            </h3>
            <p className="text-xs text-slate-500">Live operational disruptions, breakdown tickets &amp; broker detention claims</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterStatus === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilterStatus("open")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterStatus === "open" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Open / Active ({incidents.filter((i) => i.status === "open" || i.status === "under_investigation").length})
          </button>
          <button
            onClick={() => setFilterStatus("resolved")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterStatus === "resolved" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resolved ({incidents.filter((i) => i.status === "resolved" || i.status === "claim_filed").length})
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="divide-y divide-slate-100 p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-sm text-slate-700">All Clear: No Active Incidents Reported</p>
            <p className="text-xs">All active loads are moving smoothly on schedule.</p>
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-xl border transition-all ${
                inc.status === "open" || inc.status === "under_investigation"
                  ? "bg-red-50/40 border-red-200"
                  : "bg-slate-50/50 border-slate-200 opacity-90"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                {/* Left Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded bg-slate-900 text-white">
                    {inc.loadVrid}
                  </span>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryBadge(inc.category)}`}>
                    {inc.category.replace("_", " ")}
                  </span>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity}
                  </span>

                  <span className="text-xs text-slate-500">
                    Reported by <strong className="text-slate-800">{inc.reportedBy}</strong> ({new Date(inc.reportedAt).toLocaleTimeString()})
                  </span>
                </div>

                {/* Right Status */}
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    inc.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : inc.status === "claim_filed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {inc.status.replace("_", " ")}
                  </span>
                </div>

              </div>

              {/* Description & Location */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-800">
                <p className="font-semibold text-slate-900 leading-relaxed">{inc.description}</p>
                {inc.location && (
                  <p className="text-slate-600">
                    📍 Location: <strong className="text-slate-800">{inc.location}</strong>
                  </p>
                )}
                {inc.actionsTaken && (
                  <p className="text-slate-600">
                    🛠️ Actions Taken: <span className="text-slate-800">{inc.actionsTaken}</span>
                  </p>
                )}
                {inc.claimAmountUSD && (
                  <p className="text-emerald-700 font-bold">
                    💵 Claim / Recovery Amount: ${inc.claimAmountUSD.toLocaleString()} USD
                  </p>
                )}
                {inc.resolutionNotes && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 mt-2">
                    <strong>Resolution Notes:</strong> {inc.resolutionNotes} (by {inc.resolvedBy})
                  </div>
                )}
              </div>

              {/* Resolution Action Trigger */}
              {inc.status !== "resolved" && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => {
                      setResolvingId(inc.id);
                      setResolutionNotes(inc.resolutionNotes || "");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolve / Update Status</span>
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Resolve Incident Drawer Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-black text-slate-900 text-base">Resolve Incident &amp; Log Settlement</h4>
              <button onClick={() => setResolvingId(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Set New Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["resolved", "claim_filed", "under_investigation"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`p-2 rounded-lg font-bold uppercase tracking-wider border transition-colors ${
                        targetStatus === st
                          ? "bg-emerald-600 text-white border-emerald-600 shadow"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Super Admin Resolution Notes</label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Service completed, replacement driver assigned, or Amazon ROC detention voucher received..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setResolvingId(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save Resolution"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
