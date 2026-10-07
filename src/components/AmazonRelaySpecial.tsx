"use client";

import React from "react";
import { Zap, ShieldCheck, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";

export default function AmazonRelaySpecial() {
  return (
    <section id="amazon-relay" className="py-24 bg-[#0a1128] text-white relative overflow-hidden border-b border-slate-800">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Core Value */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider">
              <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
              Specialized Amazon Logistics Desk
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
              Amazon Relay Middle-Mile &amp;{" "}
              <span className="text-orange-500">Block Optimization</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Amazon Relay requires speed, algorithmic precision, and strict performance metrics. 
              Our dedicated Relay dispatch desk monitors load boards 24/7, secures lucrative spot contracts, 
              books high-dollar dedicated blocks, and protects your carrier score.
            </p>

            {/* Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-slate-200">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">24/7 Spot &amp; PAT Booking</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Automated Post-A-Truck matches and immediate spot captures.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Dedicated Block Booking</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Secure multi-week recurring blocks with predictable gross revenue.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Amazon ROC Escalation</h4>
                  <p className="text-xs text-slate-400 mt-0.5">We file and recover detention, disruption, and TONU payments directly.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Score Protection</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Maintain top on-time percentages to unlock premium tiered access.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <a
                href="#contact-us"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-xl hover:shadow-orange-600/30 transition-all"
              >
                <span>Dispatch My Amazon Relay Trucks</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right Column: Live Amazon Relay Simulated Dashboard Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#0f172a] border-2 border-slate-700/80 p-6 sm:p-8 shadow-2xl space-y-5 relative">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-500 flex items-center justify-center font-black">
                    AR
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Amazon Relay Portal Desk</h3>
                    <p className="text-xs text-slate-400">Live Carrier Performance</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Score: 99.8%
                </span>
              </div>

              {/* Sample Dispatched Amazon Blocks */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0a1128] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-400 font-bold uppercase">Dedicated 3-Day Block</span>
                    <span className="text-emerald-400 font-black text-sm">$3,850.00 Gross</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-200 font-semibold">
                    <span>ORD9 (Chicago, IL)</span>
                    <span className="text-slate-500">➜</span>
                    <span>CMH1 (Columbus, OH)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Tractor Trailer • 53&apos; Dry Van</span>
                    <span className="text-white font-bold">$3.45 / mi</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0a1128] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400 font-bold uppercase">Middle-Mile Round Trip</span>
                    <span className="text-emerald-400 font-black text-sm">$2,420.00 Gross</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-200 font-semibold">
                    <span>DFW7 (Dallas, TX)</span>
                    <span className="text-slate-500">➜</span>
                    <span>SAT1 (San Antonio, TX)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Box Truck (26ft Liftgate)</span>
                    <span className="text-white font-bold">$3.10 / mi</span>
                  </div>
                </div>
              </div>

              {/* ROC Claim Guarantee Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/30 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>100% ROC Delay &amp; Detention Recovery Assistance</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
