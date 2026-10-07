"use client";

import React from "react";
import {
  Zap,
  Truck,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SERVICES } from "@/lib/constants";

export default function Services() {
  const serviceIcons = {
    "amazon-relay": Zap,
    "truck-dispatch": Truck,
    "rate-negotiation": TrendingUp,
    "back-office": FileCheck2,
    "compliance-safety": ShieldCheck,
  };

  return (
    <section id="services" className="relative py-24 bg-slate-900/60 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Full-Spectrum Freight Dispatch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered To Maximize Your{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Revenue Per Mile
            </span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Whether you run a single dry van, a fleet of reefers, or specialize in Amazon Relay middle-mile operations, 
            we provide the strategic freight intelligence, load booking power, and back-office execution you need.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, idx) => {
            const IconComponent = serviceIcons[service.id as keyof typeof serviceIcons] || Truck;
            const isAmazonRelay = service.id === "amazon-relay";

            return (
              <div
                key={service.id}
                className={`relative rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between ${
                  isAmazonRelay
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 lg:col-span-1"
                    : "bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-lg"
                }`}
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isAmazonRelay
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isAmazonRelay
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {service.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">{service.description}</p>

                  {/* Bullet Points */}
                  <div className="space-y-2.5 mb-6">
                    {service.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlight Quote / Bottom Hook */}
                <div className="pt-4 border-t border-slate-800/80">
                  <p className="text-xs font-semibold text-emerald-400/90 italic mb-4">
                    &ldquo;{service.highlight}&rdquo;
                  </p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                  >
                    <span>Request This Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carrier Value Guarantee Banner */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/40 border border-slate-700/80 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <h4 className="text-xl font-bold text-white">
                Never haul below your cost-per-mile threshold again
              </h4>
              <p className="text-sm text-slate-300 max-w-2xl">
                We calculate your break-even operating costs and ensure every single dispatched mile contributes profit to your business.
              </p>
            </div>
            <a
              href="#contact"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all"
            >
              Get Free Lane Assessment
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
