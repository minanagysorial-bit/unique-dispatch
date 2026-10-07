"use client";

import React from "react";
import { Check, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";
import { PRICING_PLANS } from "@/lib/constants";

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-orange-600 font-extrabold text-sm uppercase tracking-widest">
            Affordable &amp; Honest
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            TRANSPARENT <span className="text-orange-600">PRICING PLANS</span>
          </h2>
          <p className="text-slate-600 text-base">
            No contracts. No forced dispatch. No hidden fees. Cancel anytime with zero penalty.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {PRICING_PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-8 transition-all flex flex-col justify-between ${
                plan.isPopular
                  ? "bg-[#0f172a] text-white shadow-2xl border-2 border-orange-500 scale-100 lg:scale-[1.02]"
                  : "bg-slate-50 text-slate-800 border border-slate-200 shadow-sm"
              }`}
            >
              <div>
                {/* Popular Pill */}
                {plan.isPopular && (
                  <span className="inline-block px-3 py-1 rounded bg-orange-600 text-white text-xs font-black uppercase tracking-wider mb-4">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h3 className={`text-2xl font-black ${plan.isPopular ? "text-white" : "text-[#0f172a]"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${plan.isPopular ? "text-orange-400" : "text-orange-600"}`}>
                    {plan.subtitle}
                  </p>
                </div>

                {/* Price Display */}
                <div className={`mb-6 pb-6 border-b ${plan.isPopular ? "border-slate-800" : "border-slate-200"}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className={`text-sm font-semibold ${plan.isPopular ? "text-slate-400" : "text-slate-500"}`}>
                      {plan.priceDetail}
                    </span>
                  </div>
                  <p className={`text-xs mt-3 leading-relaxed ${plan.isPopular ? "text-slate-300" : "text-slate-600"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <p className={`text-xs font-black uppercase tracking-wider ${plan.isPopular ? "text-slate-400" : "text-slate-500"}`}>
                    What&apos;s Included:
                  </p>
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.isPopular ? "bg-orange-600/30 text-orange-400" : "bg-emerald-100 text-emerald-600"
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className={plan.isPopular ? "text-slate-200" : "text-slate-700 font-medium"}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href="#contact-us"
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-md font-bold text-sm transition-all shadow-md ${
                    plan.isPopular
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-[#0f172a] hover:bg-[#1e293b] text-white"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
