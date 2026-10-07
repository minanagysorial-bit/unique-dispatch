"use client";

import React from "react";
import { TrendingUp, ShieldCheck, Zap, Award, Activity } from "lucide-react";

export default function MarketStatsTicker() {
  const tickerItems = [
    { label: "Dry Van Spot Average", value: "$2.78 / mi", trend: "+4.2%", icon: TrendingUp },
    { label: "Reefer National Average", value: "$3.35 / mi", trend: "+5.1%", icon: TrendingUp },
    { label: "Amazon Relay ROC Success", value: "99.8%", trend: "Optimal", icon: Zap },
    { label: "On-Time Dispatch Rate", value: "99.4%", trend: "Verified", icon: ShieldCheck },
    { label: "Forced Dispatch Policy", value: "0% Never", trend: "100% Freedom", icon: Award },
    { label: "Average Dispatch Response", value: "< 12 Mins", trend: "24/7 Live", icon: Activity },
  ];

  return (
    <div className="bg-[#0a1128] text-white py-3 border-y border-slate-800 overflow-hidden relative shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 overflow-x-auto no-scrollbar py-1 text-xs">
          {tickerItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 shrink-0 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">{item.label}:</span>
                  <span className="font-bold text-white">{item.value}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                    {item.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
