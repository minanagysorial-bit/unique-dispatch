"use client";

import React from "react";
import { ShieldCheck, Mail, Phone, MapPin, Building2, Award, BadgeCheck } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function LeadershipSection() {
  return (
    <section id="leadership" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider">
            <BadgeCheck className="w-4 h-4 text-orange-600" />
            Verified Business Ownership &amp; Management
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            EXECUTIVE <span className="text-orange-600">LEADERSHIP &amp; OWNERSHIP</span>
          </h2>
          <p className="text-slate-600 text-base">
            Unique Dispatch is governed by authentic management dedicated to carrier profitability, 
            transparent accounting, and verified global business operations.
          </p>
        </div>

        {/* Executive Profile Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-10 relative overflow-hidden">
          
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-600"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2">
            
            {/* Avatar / Monogram Badge Column */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-36 h-36 rounded-2xl bg-[#0f172a] text-white flex flex-col items-center justify-center p-3 shadow-md border-2 border-orange-500">
                  <div className="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-black mb-1">
                    MA
                  </div>
                  <span className="text-xs font-black tracking-tight">{COMPANY_INFO.founder.name}</span>
                  <span className="text-[10px] text-orange-400 font-bold">{COMPANY_INFO.founder.title}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-1.5 border-2 border-white shadow">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-[#0f172a]">{COMPANY_INFO.founder.name}</h3>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                  {COMPANY_INFO.founder.title}
                </p>
                <p className="text-xs text-slate-500 font-medium">{COMPANY_INFO.name}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200">
                <Award className="w-3.5 h-3.5 text-orange-600" />
                <span>5+ Years Logistics Experience</span>
              </div>
            </div>

            {/* Bio & Direct Verified Contacts */}
            <div className="md:col-span-8 space-y-5">
              
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Founder Background &amp; Operations Focus
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {COMPANY_INFO.founder.bio}
                </p>
              </div>

              {/* Direct Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Direct Owner Email */}
                <a
                  href={`mailto:${COMPANY_INFO.founder.email}`}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 transition-colors flex items-start gap-3 group"
                >
                  <Mail className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Direct Owner Email</p>
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600">{COMPANY_INFO.founder.email}</p>
                  </div>
                </a>

                {/* Company Work Email */}
                <a
                  href={`mailto:${COMPANY_INFO.founder.workEmail}`}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 transition-colors flex items-start gap-3 group"
                >
                  <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Company Dispatch Email</p>
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600">{COMPANY_INFO.founder.workEmail}</p>
                  </div>
                </a>

                {/* Direct US Line */}
                <a
                  href={`tel:${COMPANY_INFO.founder.phoneUS.replace(/[^0-9+]/g, "")}`}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 transition-colors flex items-start gap-3 group"
                >
                  <Phone className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">US Direct Line</p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">{COMPANY_INFO.founder.phoneUS}</p>
                  </div>
                </a>

                {/* Support Line */}
                <a
                  href={`tel:${COMPANY_INFO.founder.phoneSupport.replace(/[^0-9+]/g, "")}`}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 transition-colors flex items-start gap-3 group"
                >
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Support / WhatsApp</p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">{COMPANY_INFO.founder.phoneSupport}</p>
                  </div>
                </a>

              </div>

              {/* Registered Physical Address Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-[#0f172a]">Registered Physical Address: </span>
                  <span>{COMPANY_INFO.address.fullFormatted}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Legal Compliance Guarantee Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full compliance with FMCSA freight standards &amp; non-forced dispatch.</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Registered commercial entity for North American freight logistics and global operations.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
