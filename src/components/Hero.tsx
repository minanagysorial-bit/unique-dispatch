"use client";

import React from "react";
import { ArrowRight, Phone, ShieldCheck, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[90vh] pt-36 pb-20 md:pt-48 md:pb-28 bg-[#0b132b] flex items-center overflow-hidden"
    >
      {/* Real High-Resolution American Logistics Highway Backdrop with Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=2000&q=80')",
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#070d1e] via-[#0b132b]/95 to-[#0b132b]/70"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Left Content */}
          <div className="lg:col-span-8 space-y-6 text-left">
            
            {/* Tagline matching uniquedispatcher.com */}
            <div className="inline-block">
              <span className="text-orange-400 font-extrabold text-sm sm:text-base tracking-widest uppercase border-b-2 border-orange-500 pb-1">
                For Owner Operators and Truckers
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Freight Dispatch Service <br />
              <span className="text-orange-500">&amp; Amazon Relay</span> Management
            </h1>

            {/* Subtitle matching uniquedispatcher.com */}
            <p className="text-base sm:text-xl text-slate-200 max-w-2xl leading-relaxed font-normal">
              Unique Dispatch arranges professional dispatch services for owner-operators and truckers 
              who are tired of wasting their time and energy on cheap freight.
            </p>

            {/* Value Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>100% No Forced Dispatch — You Choose Lanes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Aggressive Spot Rate &amp; Fuel Surcharge Negotiation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Amazon Relay Middle-Mile &amp; Block Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Complete Factoring &amp; Packet Paperwork Support</span>
              </div>
            </div>

            {/* CTA Buttons matching uniquedispatcher.com */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#contact-us"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base shadow-xl hover:shadow-orange-600/30 transition-all"
              >
                <span>Request A Callback</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="#services"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/20 backdrop-blur-sm transition-all"
              >
                <span>Our Services</span>
              </a>
            </div>

          </div>

          {/* Right Direct Call & Trust Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-white p-7 shadow-2xl space-y-6 text-slate-800 border-t-4 border-orange-600">
              
              <div>
                <span className="text-xs font-black text-orange-600 uppercase tracking-widest block mb-1">
                  Ready To Roll?
                </span>
                <h2 className="text-2xl font-black text-[#0f172a]">Direct Dispatch Desk</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Speak directly with our senior dispatchers right now.
                </p>
              </div>

              {/* Direct Call Box */}
              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4 hover:border-orange-500 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">US Direct Line</p>
                  <p className="text-lg font-black text-[#0f172a] group-hover:text-orange-600 transition-colors">
                    {COMPANY_INFO.contacts.phoneUSDisplay}
                  </p>
                </div>
              </a>

              {/* Verified Owner Card Link */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{COMPANY_INFO.founder.name}</p>
                  <p className="text-[11px] text-slate-500">{COMPANY_INFO.founder.title}</p>
                </div>
                <a
                  href="#leadership"
                  className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                >
                  View Profile ➜
                </a>
              </div>

              {/* Quick Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between font-semibold">
                  <span>Average Rate Per Mile:</span>
                  <span className="text-emerald-600 font-bold">$2.85+ / mi</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Weekly Avg Gross / Semi:</span>
                  <span className="text-[#0f172a] font-bold">$8,500+</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Hidden Fees:</span>
                  <span className="text-orange-600 font-bold">0% None</span>
                </div>
              </div>

              <a
                href="#contact-us"
                className="block text-center py-3.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-sm transition-colors shadow"
              >
                Start Onboarding Today
              </a>

            </div>
          </div>

        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base">24/7 Support</p>
              <p className="text-xs text-slate-400">Live US Dispatch Desk</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base">Top Gross</p>
              <p className="text-xs text-slate-400">Aggressive Negotiation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base">No Forced Dispatch</p>
              <p className="text-xs text-slate-400">You Control Your Routes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base">Dedicated Agent</p>
              <p className="text-xs text-slate-400">Single Point of Contact</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
