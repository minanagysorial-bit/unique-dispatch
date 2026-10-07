"use client";

import React, { useState } from "react";
import { Calculator, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

export default function RateCalculator() {
  const [truckType, setTruckType] = useState<"dryvan" | "reefer" | "flatbed" | "boxtruck" | "poweronly">("dryvan");
  const [truckCount, setTruckCount] = useState<number>(1);
  const [weeklyMiles, setWeeklyMiles] = useState<number>(2600);
  const [planType, setPlanType] = useState<"percent" | "flat">("percent");

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
  
  const dispatchFee = planType === "percent" 
    ? totalWeeklyGross * 0.06 
    : 299 * truckCount;

  const netCarrierTakeHome = totalWeeklyGross - dispatchFee;
  const monthlyGross = totalWeeklyGross * 4.33;
  const annualGross = totalWeeklyGross * 52;

  return (
    <section id="calculator" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-orange-600 font-extrabold text-sm uppercase tracking-widest">
            Revenue Estimation
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            CARRIER EARNINGS <span className="text-orange-600">CALCULATOR</span>
          </h2>
          <p className="text-slate-600 text-base">
            Calculate your estimated weekly gross and net take-home pay with our top rate negotiation desk.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* 1. Equipment Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
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
                        ? "bg-orange-50 border-orange-500 text-[#0f172a] shadow-sm font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">{item.name}</p>
                    <p className="text-[11px] text-orange-600 font-extrabold mt-0.5">{item.rate}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Number of Trucks */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span>2. Number of Trucks</span>
                <span className="text-orange-600 font-black text-sm">{truckCount} {truckCount === 1 ? "Truck" : "Trucks"}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={truckCount}
                onChange={(e) => setTruckCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>1 Truck (Owner-Op)</span>
                <span>5 Trucks</span>
                <span>10 Trucks (Fleet)</span>
              </div>
            </div>

            {/* 3. Weekly Miles Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span>3. Average Weekly Miles Per Truck</span>
                <span className="text-[#0f172a] font-black text-sm">
                  {weeklyMiles.toLocaleString()} Miles / wk
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="4000"
                step="100"
                value={weeklyMiles}
                onChange={(e) => setWeeklyMiles(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>1,500 mi (Regional)</span>
                <span>2,600 mi (Standard OTR)</span>
                <span>4,000 mi (High Mileage)</span>
              </div>
            </div>

            {/* 4. Plan Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                4. Select Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlanType("percent")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    planType === "percent"
                      ? "bg-orange-50 border-orange-500 text-[#0f172a] font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <p className="text-xs font-black">6% Percentage Plan</p>
                  <p className="text-[11px] text-orange-600 font-semibold">Pay as you haul</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType("flat")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    planType === "flat"
                      ? "bg-orange-50 border-orange-500 text-[#0f172a] font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <p className="text-xs font-black">$299 / Week Flat Fee</p>
                  <p className="text-[11px] text-orange-600 font-semibold">Fixed rate per truck</p>
                </button>
              </div>
            </div>

          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-5 bg-[#0f172a] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Projected Revenue
                </span>
                <span className="text-xs font-black px-2.5 py-1 rounded bg-orange-600 text-white">
                  @ ${currentRpm.toFixed(2)} Avg RPM
                </span>
              </div>

              {/* Major Gross */}
              <div className="space-y-1 mb-6">
                <p className="text-xs text-slate-400 font-medium">Estimated Weekly Carrier Gross</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ${Math.round(totalWeeklyGross).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  Net Take-Home: ${Math.round(netCarrierTakeHome).toLocaleString()} / wk
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-3 py-4 border-y border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Dispatch Fee ({planType === "percent" ? "6%" : "$299/wk"}):</span>
                  <span className="font-bold text-white">${Math.round(dispatchFee).toLocaleString()} / wk</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Monthly Projected Gross:</span>
                  <span className="font-bold text-white">${Math.round(monthlyGross).toLocaleString()} / mo</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Annual Projected Gross:</span>
                  <span className="font-black text-orange-400 text-sm">${Math.round(annualGross).toLocaleString()} / yr</span>
                </div>
              </div>

              <div className="space-y-2 mt-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>100% No Forced Dispatch — you approve loads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Full factoring invoicing &amp; detention included</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="#contact-us"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md transition-all"
              >
                <span>Lock In This Rate Today</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
