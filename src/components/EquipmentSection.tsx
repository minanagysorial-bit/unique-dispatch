"use client";

import React from "react";
import { Truck, Snowflake, Layers, Box, Zap, ArrowUpRight } from "lucide-react";
import { EQUIPMENT_TYPES } from "@/lib/constants";

export default function EquipmentSection() {
  const iconMap = {
    Truck: Truck,
    Snowflake: Snowflake,
    Layers: Layers,
    Box: Box,
    Zap: Zap,
  };

  return (
    <section id="equipment" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/10 blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            Fleet Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Equipment Types We Dispatch Nationwide
          </h2>
          <p className="text-slate-300 text-base">
            From heavy-duty Class 8 tractors to 26ft expedited box trucks, we have dedicated lane specialists for each equipment category.
          </p>
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EQUIPMENT_TYPES.map((item, idx) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Truck;

            return (
              <div
                key={idx}
                className={`relative rounded-2xl p-6 bg-slate-900/80 border transition-all duration-300 hover:-translate-y-1 ${
                  item.popular
                    ? "border-slate-700 hover:border-emerald-500/50 shadow-xl shadow-emerald-500/5"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  {item.popular && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      High Demand
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>

                {/* Metrics */}
                <div className="space-y-2 py-3 my-2 border-y border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target Rate / Mile:</span>
                    <span className="font-bold text-emerald-400">{item.rateAvg}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Est. Weekly Gross:</span>
                    <span className="font-bold text-white">{item.weeklyGross}</span>
                  </div>
                </div>

                {/* Ideal Freight Description */}
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  <strong className="text-slate-200">Ideal For: </strong>
                  {item.idealFor}
                </p>

                {/* Quick Link */}
                <div className="mt-5 pt-3">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Dispatch your {item.name.split(" ")[0]}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
