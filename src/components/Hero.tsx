"use client";

import React from "react";
import { ArrowRight, Phone, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[92vh] pt-36 pb-24 md:pt-48 md:pb-32 bg-[#070d1e] flex items-center overflow-hidden"
    >
      {/* Self-Hosted HD Video: Semi-Truck driving through scenic nature & highway */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=2000&q=80"
          className="w-full h-full object-cover object-center scale-105"
        >
          <source src="/hero_truck.mp4" type="video/mp4" />
          <source
            src="https://uniquedispatcher.com/wp-content/uploads/2022/11/video_new.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Cinematic Dark Navy Gradient Overlay for Crystal Clear Typography */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070d1e]/95 via-[#0a1128]/85 to-[#070d1e]/75 backdrop-blur-[1px]"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Left Content with Animated Reveal */}
          <div className="lg:col-span-8 space-y-6 text-left animate-fade-in-up">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2">
              <span className="text-orange-400 font-extrabold text-xs sm:text-sm tracking-widest uppercase border-b-2 border-orange-500 pb-1">
                For Owner Operators and Truckers
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Freight Dispatch Service <br />
              <span className="text-orange-500">&amp; Amazon Relay</span> Management
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-200 max-w-2xl leading-relaxed font-normal">
              Unique Dispatch arranges professional dispatch services for owner-operators and truckers 
              who are tired of wasting their time and energy on cheap freight.
            </p>

            {/* Core Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>100% No Forced Dispatch — You Choose Lanes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Aggressive Spot Rate &amp; Surcharge Negotiation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Amazon Relay Middle-Mile &amp; Block Booking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                <span>Complete Factoring &amp; Packet Paperwork Support</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#contact-us"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-xl hover:shadow-orange-600/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span>Request A Callback</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="#services"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/20 backdrop-blur-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <span>Our Services</span>
              </a>
            </div>

          </div>

          {/* Right Direct Dispatch Call & Trust Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-white p-7 sm:p-8 shadow-2xl space-y-6 text-slate-800 border-t-4 border-orange-600 animate-float">
              
              <div>
                <span className="text-xs font-black text-orange-600 uppercase tracking-widest block mb-1">
                  24/7 Live Desk
                </span>
                <h2 className="text-2xl font-black text-[#0f172a]">Direct Dispatch Desk</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connect directly with our senior dispatchers right now.
                </p>
              </div>

              {/* Direct Call Box */}
              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4 hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
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
                  Verified Profile ➜
                </a>
              </div>

              {/* Instant Onboarding Button */}
              <a
                href="#contact-us"
                className="block text-center py-3.5 rounded-md bg-[#0f172a] hover:bg-orange-600 text-white font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Start 24H Onboarding
              </a>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
