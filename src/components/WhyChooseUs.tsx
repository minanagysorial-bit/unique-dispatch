"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle, Award, Shield, TrendingUp, Phone, ArrowRight } from "lucide-react";
import { WHY_CHOOSE_POINTS, COMPANY_INFO } from "@/lib/constants";

export default function WhyChooseUs() {
  return (
    <section id="about" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Proposition matching uniquedispatcher.com */}
          <div className="lg:col-span-7 space-y-6">
            
            <div>
              <div className="flex items-center gap-2 text-orange-600 font-extrabold text-sm uppercase tracking-widest mb-1">
                <span>Unique Dispatch</span>
                <span>•</span>
                <span>Why Choose Us?</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight leading-tight">
                WE ADD VALUE TO <span className="text-orange-600">YOUR BUSINESS</span>
              </h2>
            </div>

            <p className="text-base text-slate-600 leading-relaxed">
              We understand the daily challenges truckers face on the road. Our mission is to protect your revenue, 
              negotiate every dollar from freight brokers, and eliminate administrative friction so you can focus on safe driving.
            </p>

            {/* Exact Points from uniquedispatcher.com */}
            <div className="space-y-4 pt-2">
              {WHY_CHOOSE_POINTS.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            {/* Dual CTA */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#contact-us"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <span>Request A Callback</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[#0f172a] font-bold text-sm transition-colors border border-slate-200"
              >
                <Phone className="w-4 h-4 text-orange-600" />
                <span>{COMPANY_INFO.contacts.phoneUSDisplay}</span>
              </a>
            </div>

          </div>

          {/* Right Column: High Quality Logistics Road Image */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-100 aspect-[4/5] bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1000&q=80"
                  alt="Unique Dispatch Road Freight"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />

                {/* Overlay Badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-[#0f172a]/95 backdrop-blur-md p-5 rounded-xl border border-white/10 text-white shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xl shrink-0">
                      5+
                    </div>
                    <div>
                      <p className="font-bold text-sm">Years of Proven Freight Logistics</p>
                      <p className="text-xs text-slate-300">Dedicated dispatch &amp; Amazon Relay optimization</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
