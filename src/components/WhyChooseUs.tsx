"use client";

import React from "react";
import {
  ShieldCheck,
  UserCheck,
  TrendingUp,
  FileCheck,
  Zap,
  DollarSign,
  Award,
} from "lucide-react";
import { WHY_CHOOSE_US } from "@/lib/constants";

export default function WhyChooseUs() {
  const iconMap = {
    ShieldCheck,
    UserCheck,
    TrendingUp,
    FileCheck,
    Zap,
    DollarSign,
  };

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <Award className="w-3.5 h-3.5" />
            The Unique Dispatch Advantage
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why Successful Carriers Partner With Us
          </h2>
          <p className="text-slate-300 text-base">
            We don&apos;t just book loads — we treat your truck like our own, ensuring high profitability and peace of mind on every mile.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CHOOSE_US.map((item, idx) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || ShieldCheck;

            return (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
