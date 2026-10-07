"use client";

import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Truck, DollarSign, FileCheck, Layers } from "lucide-react";
import { SERVICES } from "@/lib/constants";

export default function Services() {
  return (
    <section id="services" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching uniquedispatcher.com */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-orange-600 font-extrabold text-sm uppercase tracking-widest">
            THE RIGHT CHOICE AT THE RIGHT TIME!
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            OUR AWESOME <span className="text-orange-600">SERVICES</span>
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto">
            From single owner-operators to expanding fleets, we deliver specialized freight dispatching 
            tailored to your exact equipment and preferred lanes.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              {/* Featured Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-orange-600 text-white px-2.5 py-1 rounded">
                    {service.tagline}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0f172a] mb-2 group-hover:text-orange-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {service.description}
                  </p>

                  {/* Feature Checkpoints */}
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a
                    href="#contact-us"
                    className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <span>Get Dispatched On This Service</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carrier Value Guarantee Banner */}
        <div className="mt-16 rounded-2xl bg-[#0f172a] p-8 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <h4 className="text-2xl font-black">
              Never Settle For Cheap Freight Again
            </h4>
            <p className="text-sm text-slate-300 max-w-2xl">
              Our dispatchers negotiate market ceilings, calculate your break-even operating costs, 
              and ensure every mile driven maximizes your weekly take-home pay.
            </p>
          </div>
          <a
            href="#contact-us"
            className="px-8 py-4 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-lg whitespace-nowrap transition-all shrink-0"
          >
            Get Free Lane Consultation
          </a>
        </div>

      </div>
    </section>
  );
}
