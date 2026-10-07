"use client";

import React from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Building,
  Heart,
  ExternalLink,
  ChevronRight,
  Truck,
  BadgeCheck,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      {/* Upper Footer Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    UD
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white tracking-tight">Unique</span>
                  <span className="text-lg font-black text-emerald-400 tracking-tight">Dispatch</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  US Freight &amp; Amazon Relay
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pr-4">
              Unique Dispatch is a premier freight dispatching agency specialized in US Dry Van, Reefer, Flatbed, 
              and Amazon Relay middle-mile optimization. Dedicated to maximizing carrier revenue with 100% transparency 
              and zero forced dispatch.
            </p>

            {/* Ownership & Verification Badge */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <BadgeCheck className="w-4 h-4" />
                <span>Executive Leadership</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Owner &amp; Managing Director: <strong className="text-white">{COMPANY_INFO.founder.name}</strong>
              </p>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#home" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Home
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Services
                </Link>
              </li>
              <li>
                <Link href="#equipment" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Fleet Supported
                </Link>
              </li>
              <li>
                <Link href="#calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Rate Calculator
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Pricing &amp; Plans
                </Link>
              </li>
              <li>
                <Link href="#leadership" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Leadership Profile
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Contact &amp; Office
                </Link>
              </li>
            </ul>
          </div>

          {/* Freight Services */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Dispatch Solutions</h4>
            <ul className="space-y-2">
              <li className="text-slate-300">Amazon Relay Load Booking</li>
              <li className="text-slate-300">Amazon Relay Block Booking</li>
              <li className="text-slate-300">Dry Van 53&apos; Nationwide Lanes</li>
              <li className="text-slate-300">Reefer 53&apos; Temperature Controlled</li>
              <li className="text-slate-300">Flatbed &amp; Step Deck Machinery</li>
              <li className="text-slate-300">26ft Box Truck &amp; Liftgate</li>
              <li className="text-slate-300">Factoring Setup &amp; Invoicing</li>
              <li className="text-slate-300">Detention &amp; Layover Collection</li>
            </ul>
          </div>

          {/* Explicit Physical Address & Direct Line (PAYONEER VERIFICATION CRITICAL) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Registered Head Office
            </h4>
            
            <div className="space-y-2 text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <p className="font-bold text-white">{COMPANY_INFO.name}</p>
              <p>{COMPANY_INFO.address.street}</p>
              <p>{COMPANY_INFO.address.district}</p>
              <p>
                {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state}
              </p>
              <p>Postal Code: <strong className="text-emerald-400">{COMPANY_INFO.address.postalCode}</strong></p>
              <p>{COMPANY_INFO.address.country}</p>
            </div>

            <div className="space-y-1.5 pt-2">
              <p className="text-slate-300">
                <strong className="text-white">US Direct Line: </strong> 
                <a href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`} className="text-emerald-400 hover:underline">
                  {COMPANY_INFO.contacts.phoneUSDisplay}
                </a>
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Support &amp; WhatsApp: </strong> 
                <a href={`tel:${COMPANY_INFO.contacts.phoneSupport.replace(/[^0-9+]/g, "")}`} className="text-emerald-400 hover:underline">
                  {COMPANY_INFO.contacts.phoneSupportDisplay}
                </a>
              </p>
              <p className="text-slate-300">
                <strong className="text-white">Email: </strong> 
                <a href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`} className="text-blue-400 hover:underline">
                  {COMPANY_INFO.contacts.emailPrimary}
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Compliance Notice Banner */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-center md:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Verified Business Entity:</strong> Unique Dispatch is registered in Alexandria, Egypt, providing third-party logistics coordination, Amazon Relay dispatch, and freight support services worldwide.
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-slate-300">
            <span>Payoneer Verified Merchant</span>
            <span>•</span>
            <span>FMCSA Non-Forced Dispatch Standard</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-slate-950 py-6 px-4 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-slate-300">
            &copy; 2026 Unique Dispatch. All rights reserved. Registered Address: Khaled Ibn El-Walid St., off El-Geish St. - Miami, Alexandria 21614, Egypt.
          </p>
          <div className="flex items-center space-x-4 text-slate-300">
            <a href="#leadership" className="hover:text-white transition-colors">
              Owner Profile
            </a>
            <span>•</span>
            <a href="#contact" className="hover:text-white transition-colors">
              Office Location
            </a>
            <span>•</span>
            <a href="#pricing" className="hover:text-white transition-colors">
              Terms &amp; Rates
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
