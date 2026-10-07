"use client";

import React from "react";
import { Check, Shield, Zap, DollarSign, HelpCircle, ArrowRight } from "lucide-react";
import { PRICING_PLANS, COMPANY_INFO } from "@/lib/constants";

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase">
            <DollarSign className="w-3.5 h-3.5" />
            Simple & Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            No Contracts. No Hidden Fees. Just Results.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Choose the model that fits your cash flow best. Cancel anytime with zero penalty.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {PRICING_PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl p-8 transition-all flex flex-col justify-between ${
                plan.isPopular
                  ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-100 lg:scale-[1.02]"
                  : "bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl"
              }`}
            >
              {/* Popular Pill */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Plan Title & Subtitle */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-1">
                    {plan.subtitle}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tight">{plan.price}</span>
                    <span className="text-sm text-slate-400 font-medium">{plan.priceDetail}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">{plan.description}</p>
                </div>

                {/* Included Features List */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What&apos;s Included in this Plan:
                  </p>
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <a
                  href="#contact"
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-98 ${
                    plan.isPopular
                      ? "bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white shadow-emerald-500/25"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Mini-Table */}
        <div className="mt-16 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 sm:p-8 max-w-5xl mx-auto">
          <h4 className="text-lg font-bold text-white mb-6 text-center">
            Standard Carrier Guarantees on All Accounts
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-emerald-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2">
                <Shield className="w-4 h-4" /> 100% Non-Forced
              </div>
              <p className="text-xs text-slate-400">
                You maintain total veto power over every single load, customer, and routing choice.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-blue-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2">
                <Zap className="w-4 h-4" /> Amazon ROC Assistance
              </div>
              <p className="text-xs text-slate-400">
                Direct escalation for delayed check-ins, app glitches, and detention claims on Amazon Relay.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-teal-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2">
                <DollarSign className="w-4 h-4" /> Same-Day Factoring Setup
              </div>
              <p className="text-xs text-slate-400">
                We submit Rate-Cons and BOLs instantly so you get paid the same day by your factoring company.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
