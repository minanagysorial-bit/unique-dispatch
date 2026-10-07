"use client";

import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { EQUIPMENT_TYPES } from "@/lib/constants";

export default function EquipmentSection() {
  return (
    <section id="equipment" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-orange-600 font-extrabold text-sm uppercase tracking-widest">
            Equipment &amp; Fleets
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            TRUCKS &amp; TRAILERS <span className="text-orange-600">WE DISPATCH</span>
          </h2>
          <p className="text-slate-600 text-base">
            We book dedicated and spot loads across North America for all primary equipment categories.
          </p>
        </div>

        {/* Equipment 3-Column Image-Box Grid without prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EQUIPMENT_TYPES.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1.5"
            >
              {/* Image Box */}
              <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{item.name}</h3>
                    <p className="text-xs text-orange-400 font-bold">{item.category}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded text-white border border-white/30 uppercase tracking-wider">
                    Full Support
                  </span>
                </div>
              </div>

              {/* Bottom Card Info & Action */}
              <div className="p-5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item.specialty}</span>
                </div>
                <a
                  href="#contact-us"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-wider shrink-0 ml-2"
                >
                  <span>Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
