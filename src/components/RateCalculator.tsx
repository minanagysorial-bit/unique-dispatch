"use client";

import React, { useState } from "react";
import { Calculator, DollarSign, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";

export default function RateCalculator() {
  const [truckType, setTruckType] = useState<"dryvan" | "reefer" | "flatbed" | "boxtruck" | "poweronly">("dryvan");
  const [truckCount, setTruckCount] = useState<number>(1);
  const [weeklyMiles, setWeeklyMiles] = useState<number>(2600);
  const [planType, setPlanType] = useState<"percent" | "flat">("percent");

  // Equipment RPM presets
  const rpmRates = {
    dryvan: 2.75,
    reefer: 3.25,
    flatbed: 3.40,
    boxtruck: 2.45,
    poweronly: 2.65,
  };

  const currentRpm = rpmRates[truckType];
  const weeklyGrossPerTruck = weeklyMiles * currentRpm;
  const totalWeeklyGross = weeklyGrossPerTruck * truckCount;
  
  // Calculate dispatch fee
  const dispatchFee = planType === "percent" 
    ? totalWeeklyGross * 0.06 
    : 299 * truckCount;

  const netCarrierTakeHome = totalWeeklyGross - dispatchFee;
  const monthlyGross = totalWeeklyGross * 4.33;
  const annualGross = totalWeeklyGross * 52;

  return (
    <section id="calculator" className="py-24 bg-slate-900/80 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <Calculator className="w-3.5 h-3.5" />
            Revenue Potential
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Interactive Carrier Earnings Calculator
          </h2>
          <p className="text-slate-300 text-base">
            See how much more you can gross weekly with our strategic rate negotiation and zero deadhead lane planning.
          </p>
        </div>

        {/* Calculator Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-slate-950/90 rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
            
            {/* 1. Equipment Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Select Equipment Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "dryvan", name: "Dry Van 53'", rate: "$2.75/mi" },
                  { id: "reefer", name: "Reefer 53'", rate: "$3.25/mi" },
                  { id: "flatbed", name: "Flatbed", rate: "$3.40/mi" },
                  { id: "boxtruck", name: "26ft Box Truck", rate: "$2.45/mi" },
                  { id: "poweronly", name: "Power Only", rate: "$2.65/mi" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTruckType(item.id as typeof truckType)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      truckType === item.id
                        ? "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{item.name}</p>
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">{item.rate}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Number of Trucks */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>2. Number of Trucks in Fleet</span>
                <span className="text-white font-extrabold text-sm">{truckCount} {truckCount === 1 ? "Truck" : "Trucks"}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={truckCount}
                onChange={(e) => setTruckCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 Truck (Owner-Op)</span>
                <span>5 Trucks</span>
                <span>10 Trucks (Fleet)</span>
              </div>
            </div>

            {/* 3. Weekly Miles Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>3. Average Weekly Miles Per Truck</span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  {weeklyMiles.toLocaleString()} Miles / week
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="4000"
                step="100"
                value={weeklyMiles}
                onChange={(e) => setWeeklyMiles(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1,500 mi (Regional)</span>
                <span>2,600 mi (Standard OTR)</span>
                <span>4,000 mi (Team / High Mile)</span>
              </div>
            </div>

            {/* 4. Plan Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                4. Preferred Dispatch Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlanType("percent")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    planType === "percent"
                      ? "bg-emerald-500/10 border-emerald-500 text-white shadow-lg"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold text-white">6% Percentage Plan</p>
                  <p className="text-[11px] text-emerald-400">Pay as you earn</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType("flat")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    planType === "flat"
                      ? "bg-emerald-500/10 border-emerald-500 text-white shadow-lg"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="text-xs font-bold text-white">$299 / Week Flat Fee</p>
                  <p className="text-[11px] text-emerald-400">Fixed rate per truck</p>
                </button>
              </div>
            </div>

          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/30 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Projected Revenue
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  @ ${currentRpm.toFixed(2)} Avg RPM
                </span>
              </div>

              {/* Major Number: Weekly Gross */}
              <div className="space-y-1 mb-6">
                <p className="text-xs text-slate-400 font-medium">Estimated Weekly Carrier Gross</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ${Math.round(totalWeeklyGross).toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Net Take-Home: ${Math.round(netCarrierTakeHome).toLocaleString()} / week
                </p>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-3 py-4 border-y border-slate-800/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dispatch Fee ({planType === "percent" ? "6%" : `$299/truck`}):</span>
                  <span className="text-slate-200 font-bold">
                    ${Math.round(dispatchFee).toLocaleString()} / wk
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Projected Gross:</span>
                  <span className="text-slate-200 font-bold">
                    ${Math.round(monthlyGross).toLocaleString()} / mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Annual Gross Run-Rate:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    ${Math.round(annualGross).toLocaleString()} / yr
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="space-y-2 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No forced dispatch — approve every single load</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full factoring submission & paperwork included</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <a
                href="#contact"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all"
              >
                <span>Lock In This Target Rate</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
