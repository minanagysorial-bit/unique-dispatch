"use client";

import React from "react";
import {
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Users,
  Award,
  Zap,
} from "lucide-react";
import { DispatcherKpi } from "@/lib/portal-types";

interface AdminKpiCardsProps {
  overview: {
    totalLoads: number;
    activeLoads: number;
    deliveredLoads: number;
    criticalLoads: number;
    openIncidents: number;
    avgCompliancePct: number;
    onTimeDeliveryRate: string;
  };
  dispatcherKpis: DispatcherKpi[];
}

export default function AdminKpiCards({
  overview,
  dispatcherKpis,
}: AdminKpiCardsProps) {
  const statCards = [
    {
      title: "Message Compliance Rate",
      value: `${overview.avgCompliancePct}%`,
      subtitle: "3.5h Pickup & 30m Delivery on-time milestones",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      accent: "bg-emerald-600",
    },
    {
      title: "Active Fleet In-Transit",
      value: `${overview.activeLoads} Loads`,
      subtitle: `${overview.deliveredLoads} delivered today across all 48 states`,
      icon: Truck,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      accent: "bg-blue-600",
    },
    {
      title: "Avg Incident Response",
      value: "4.8 Mins",
      subtitle: "Broker detention & ROC delay turnaround",
      icon: Clock,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      accent: "bg-purple-600",
    },
    {
      title: "Critical Watch / Incidents",
      value: `${overview.openIncidents + overview.criticalLoads}`,
      subtitle: `${overview.openIncidents} open tickets requiring review`,
      icon: ShieldAlert,
      color:
        overview.openIncidents > 0
          ? "text-red-600 bg-red-50 border-red-200 animate-pulse"
          : "text-slate-600 bg-slate-50 border-slate-200",
      accent: overview.openIncidents > 0 ? "bg-red-600" : "bg-slate-600",
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-white border shadow-sm space-y-3 relative overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${card.accent}`} />
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-black text-slate-950 tracking-tight">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatcher Scorecards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Dispatcher Performance &amp; Compliance Scorecards
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">Live 24-Hour Evaluation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Dispatcher</th>
                <th className="px-5 py-3">Assigned Shift</th>
                <th className="px-5 py-3">Active Loads</th>
                <th className="px-5 py-3">3.5h Pickup %</th>
                <th className="px-5 py-3">30m Delivery %</th>
                <th className="px-5 py-3">Overall Compliance</th>
                <th className="px-5 py-3">Avg Response</th>
                <th className="px-5 py-3">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {dispatcherKpis.map((d) => (
                <tr key={d.dispatcherId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-[11px]">
                        {d.dispatcherName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{d.dispatcherName}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      d.assignedShift === "morning"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-indigo-100 text-indigo-900 border border-indigo-300"
                    }`}>
                      {d.assignedShift} Shift
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-900">
                    {d.activeLoadsCurrent} Loads
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-emerald-700 font-bold">{d.pickupCheckinCompliancePct}%</span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-blue-700 font-bold">{d.deliveryCheckinCompliancePct}%</span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${d.onTimeMessageCompliancePct}%` }}
                        />
                      </div>
                      <span className="font-black text-slate-900">{d.onTimeMessageCompliancePct}%</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {d.avgIncidentResponseMinutes} mins
                  </td>

                  <td className="px-5 py-4 text-emerald-700 font-bold">
                    {d.incidentsResolved} Tickets
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
