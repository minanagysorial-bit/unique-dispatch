"use client";

import React from "react";
import { ArrowRight, FileCheck, FileSignature, Settings, Truck } from "lucide-react";
import { ONBOARDING_STEPS } from "@/lib/constants";

export default function HowItWorks() {
  const stepIcons = [FileCheck, FileSignature, Settings, Truck];

  return (
    <section className="py-24 bg-slate-900/40 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Onboarding Works
          </h2>
          <p className="text-slate-300 text-base">
            Get your truck dispatched and booking top-dollar loads in less than 24 hours.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ONBOARDING_STEPS.map((item, idx) => {
            const Icon = stepIcons[idx] || Truck;

            return (
              <div
                key={idx}
                className="relative rounded-2xl bg-slate-950/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-slate-700 group-hover:text-emerald-400 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-900 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <span>Fast Turnaround</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rapid Start Banner */}
        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all"
          >
            <span>Start Your 24-Hour Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
