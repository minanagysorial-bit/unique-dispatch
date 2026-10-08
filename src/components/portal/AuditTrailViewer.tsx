"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  UserCheck,
  Tag,
} from "lucide-react";
import { AuditLog } from "@/lib/portal-types";

interface AuditTrailViewerProps {
  logs: AuditLog[];
}

export default function AuditTrailViewer({ logs }: AuditTrailViewerProps) {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.targetId && log.targetId.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = filterAction === "all" || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("INCIDENT")) return "bg-red-100 text-red-800 border-red-300";
    if (action.includes("MILESTONE")) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (action.includes("SHIFT")) return "bg-purple-100 text-purple-800 border-purple-300";
    if (action.includes("SYNC")) return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-slate-100 text-slate-800 border-slate-300";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Enterprise Audit Trail &amp; System Logs
            </h3>
            <p className="text-xs text-slate-500">Immutable chronological record of all load actions, contact logs &amp; handovers</p>
          </div>
        </div>

        {/* Search & Filter Inputs */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Load ID, Driver, Dispatcher..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Event Actions</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Timestamp (EST)</th>
              <th className="px-5 py-3">Actor / Operator</th>
              <th className="px-5 py-3">Action Event</th>
              <th className="px-5 py-3">Target</th>
              <th className="px-5 py-3">Log Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">
                  No audit logs matching your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900">{log.actorName}</strong>
                      <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                    {log.targetId ? log.targetId : log.targetType}
                  </td>

                  <td className="px-5 py-3.5 text-slate-800 max-w-lg">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
