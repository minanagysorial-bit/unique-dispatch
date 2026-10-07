"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  PhoneCall,
  DollarSign,
  Truck,
  ArrowRight,
  CheckCircle2,
  Zap,
  MapPin,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-950 flex items-center"
    >
      {/* Dynamic Background Glows and Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-200 tracking-wide">
                Premier US Freight & Amazon Relay Dispatching
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Reliable Truck Dispatching &{" "}
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Amazon Relay
              </span>{" "}
              Management
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              We maximize your weekly gross revenue with aggressive rate-per-mile negotiation, 
              24/7 dedicated dispatchers, and complete end-to-end paperwork management. 
              Zero forced dispatch — you drive, we handle the rest.
            </p>

            {/* Value Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-sm text-slate-300 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Top Spot Rates & Amazon Relay Blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% No Forced Dispatch Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Factoring Setup & Detention Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct Access to Dedicated Dispatcher</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-98 transition-all"
              >
                <span>Get Dispatched Now</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>View Pricing Plans</span>
              </a>
            </div>

            {/* Rapid Direct Call Banner */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs text-slate-400">
              <span>Ready to book loads today?</span>
              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call {COMPANY_INFO.contacts.phoneUSDisplay}
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Dispatch Operations Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Glow effect */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-20 blur-xl"></div>

              {/* Operations Live Card */}
              <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 p-6 backdrop-blur-xl shadow-2xl space-y-5">
                
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Live Dispatch Console</h2>
                      <p className="text-[11px] text-slate-400">Active Load Matching & Rate Desk</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live
                  </span>
                </div>

                {/* Sample Live Loads Dispatched */}
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Zap className="w-3.5 h-3.5" /> Amazon Relay Spot
                      </span>
                      <span className="text-emerald-400 text-sm font-extrabold">$3.42 / mi</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white font-medium">
                      <span>Chicago, IL (ORD9)</span>
                      <span className="text-slate-500">➜</span>
                      <span>Columbus, OH (CMH1)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span>354 mi • Dry Van 53&apos;</span>
                      <span className="text-slate-200 font-semibold">Gross: $1,210.00</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span className="text-blue-400 flex items-center gap-1 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" /> Dedicated Spot Haul
                      </span>
                      <span className="text-emerald-400 text-sm font-extrabold">$3.18 / mi</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white font-medium">
                      <span>Dallas, TX</span>
                      <span className="text-slate-500">➜</span>
                      <span>Atlanta, GA</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span>782 mi • Reefer 53&apos;</span>
                      <span className="text-slate-200 font-semibold">Gross: $2,486.00</span>
                    </div>
                  </div>
                </div>

                {/* Performance Summary Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-2 text-center">
                    <span className="block text-xs font-extrabold text-emerald-400">99.4%</span>
                    <span className="block text-[10px] text-slate-400">On-Time</span>
                  </div>
                  <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-2 text-center">
                    <span className="block text-xs font-extrabold text-blue-400">$8,500+</span>
                    <span className="block text-[10px] text-slate-400">Avg Weekly</span>
                  </div>
                  <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-2 text-center">
                    <span className="block text-xs font-extrabold text-indigo-400">0%</span>
                    <span className="block text-[10px] text-slate-400">Forced</span>
                  </div>
                </div>

                {/* Direct Dispatcher Contact Assurance */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">
                      MA
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{COMPANY_INFO.founder.name}</p>
                      <p className="text-[10px] text-slate-400">{COMPANY_INFO.founder.title}</p>
                    </div>
                  </div>
                  <a
                    href="#leadership"
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    Verified Owner ➜
                  </a>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Bottom Trust Stat Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">24/7/365</p>
              <p className="text-xs text-slate-400">Live US Dispatch Support</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">$2.85+ / mi</p>
              <p className="text-xs text-slate-400">Target Rate Per Mile</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">100% Freedom</p>
              <p className="text-xs text-slate-400">Zero Forced Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">0% Hidden Fees</p>
              <p className="text-xs text-slate-400">Transparent Weekly Invoicing</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
