"use client";

import React from "react";
import {
  UserCheck,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  BadgeCheck,
  ExternalLink,
  MessageSquare,
  Award,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function LeadershipSection() {
  return (
    <section
      id="leadership"
      className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 relative overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            Verified Business Ownership &amp; Governance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Executive Leadership &amp; Ownership
          </h2>
          <p className="text-slate-300 text-base">
            Unique Dispatch is governed by transparent leadership dedicated to carrier profitability, 
            regulatory compliance, and reliable global freight operations.
          </p>
        </div>

        {/* Executive Profile Card (Payoneer Business Verification Compliant) */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl p-6 sm:p-10 backdrop-blur-xl relative overflow-hidden">
          
          {/* Top Verification Ribbon */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-slate-950 font-black text-[11px] uppercase tracking-wider px-6 py-1 rounded-bl-xl shadow-md flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Managing Director
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4 md:pt-0">
            
            {/* Avatar / Executive Badge Column */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-1 shadow-2xl shadow-blue-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center p-3 text-center">
                    {/* Stylized Executive Portrait Monogram */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl font-black text-white mb-1 shadow-inner">
                      MA
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">Marven Awad</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Managing Director</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 rounded-full p-1.5 border-2 border-slate-900 shadow-md">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">{COMPANY_INFO.founder.name}</h3>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  {COMPANY_INFO.founder.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{COMPANY_INFO.name}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>5+ Years Logistics Exp.</span>
              </div>
            </div>

            {/* Executive Bio & Contact Details */}
            <div className="md:col-span-8 space-y-6">
              
              {/* Professional Bio */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Leadership Profile &amp; Freight Background
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {COMPANY_INFO.founder.bio}
                </p>
              </div>

              {/* Verified Direct Contact Grid for Marven Awad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Primary Email */}
                <a
                  href={`mailto:${COMPANY_INFO.founder.email}`}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-start gap-3 group"
                >
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Direct Owner Email</p>
                    <p className="text-xs font-semibold text-white truncate">{COMPANY_INFO.founder.email}</p>
                  </div>
                </a>

                {/* Company Work Email */}
                <a
                  href={`mailto:${COMPANY_INFO.founder.workEmail}`}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 transition-all flex items-start gap-3 group"
                >
                  <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Company Dispatch Email</p>
                    <p className="text-xs font-semibold text-white truncate">{COMPANY_INFO.founder.workEmail}</p>
                  </div>
                </a>

                {/* Direct US Line */}
                <a
                  href={`tel:${COMPANY_INFO.founder.phoneUS.replace(/[^0-9+]/g, "")}`}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-start gap-3 group"
                >
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">US Direct Line</p>
                    <p className="text-xs font-semibold text-white">{COMPANY_INFO.founder.phoneUS}</p>
                  </div>
                </a>

                {/* Support Line / WhatsApp */}
                <a
                  href={`tel:${COMPANY_INFO.founder.phoneSupport.replace(/[^0-9+]/g, "")}`}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/60 transition-all flex items-start gap-3 group"
                >
                  <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Support &amp; WhatsApp</p>
                    <p className="text-xs font-semibold text-white">{COMPANY_INFO.founder.phoneSupport}</p>
                  </div>
                </a>

              </div>

              {/* Registered Physical Address Badge */}
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Registered Physical Address: </span>
                  <span>{COMPANY_INFO.address.fullFormatted}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Compliance & Ownership Guarantee Statement */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full compliance with FMCSA freight dispatch standards &amp; transparent billing.</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Official business entity registered for international merchant operations.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
