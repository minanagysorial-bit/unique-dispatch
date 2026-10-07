"use client";

import React from "react";
import { ArrowRight, FileCheck, FileSignature, Settings, Truck } from "lucide-react";
import { ONBOARDING_STEPS } from "@/lib/constants";

export default function HowItWorks() {
  const stepIcons = [FileCheck, FileSignature, Settings, Truck];

  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-orange-600 font-extrabold text-sm uppercase tracking-widest">
            Easy 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            HOW <span className="text-orange-600">ONBOARDING WORKS</span>
          </h2>
          <p className="text-slate-600 text-base">
            Get your truck dispatched and booking top-paying loads in less than 24 hours.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ONBOARDING_STEPS.map((item: { step: string; title: string; description: string }, idx: number) => {
            const Icon = stepIcons[idx] || Truck;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-black text-slate-300 group-hover:text-orange-600 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#0f172a] mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-orange-600">
                  <span>Fast 24H Turnaround</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
