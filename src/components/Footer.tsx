"use client";

import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, ChevronRight, ShieldCheck, BadgeCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { COMPANY_INFO } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#070d1e] text-slate-400 text-xs border-t border-slate-800">
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <a 
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
              className="inline-block cursor-pointer focus:outline-none"
              title="Refresh Page"
            >
              <Logo variant="light" size="md" />
            </a>

            <p className="text-xs text-slate-300 leading-relaxed pr-4 mt-3">
              Unique Dispatch arranges professional freight dispatch services for owner-operators and truckers 
              who are tired of wasting their time and energy on cheap freight. Top spot rate negotiation, 
              Amazon Relay middle-mile management, and 24/7 dedicated dispatch.
            </p>

            {/* Owner badge */}
            <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                <BadgeCheck className="w-4 h-4" />
                <span>Executive Leadership &amp; Governance</span>
              </div>
              <p>
                Founder &amp; Managing Director: <strong className="text-white">{COMPANY_INFO.founder.name}</strong>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#home" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> Home
                </Link>
              </li>
              <li>
                <Link href="#about" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> About Us
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> Our Services
                </Link>
              </li>
              <li>
                <Link href="#amazon-relay" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> Amazon Relay
                </Link>
              </li>
              <li>
                <Link href="#equipment" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> Equipment
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> How It Works
                </Link>
              </li>
              <li>
                <Link href="#leadership" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> Leadership
                </Link>
              </li>
              <li>
                <Link href="#contact-us" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-orange-500" /> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services List */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Freight Solutions</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Amazon Relay Spot &amp; Blocks</li>
              <li>• Dry Van 53&apos; Full Truckload</li>
              <li>• Reefer 53&apos; Cold Chain Freight</li>
              <li>• Flatbed &amp; Heavy Machinery</li>
              <li>• 26ft Box Truck &amp; Liftgate</li>
              <li>• Power Only &amp; Trailer Reposition</li>
              <li>• Carrier Packets &amp; Factoring NOA</li>
              <li>• Detention &amp; Layover Claims</li>
            </ul>
          </div>

          {/* Contact & Registered Head Office */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              Registered Head Office
            </h4>

            <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed space-y-1">
              <p className="font-bold text-white">{COMPANY_INFO.name}</p>
              <p>{COMPANY_INFO.address.street}</p>
              <p>{COMPANY_INFO.address.district}</p>
              <p>{COMPANY_INFO.address.city}, {COMPANY_INFO.address.state}</p>
              <p>Postal Code: <strong className="text-orange-400">{COMPANY_INFO.address.postalCode}</strong></p>
              <p>{COMPANY_INFO.address.country}</p>
            </div>

            <div className="space-y-1.5 pt-1 text-slate-300">
              <p>
                <strong className="text-white">US Line: </strong>
                <a href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`} className="text-orange-400 hover:underline font-bold">
                  {COMPANY_INFO.contacts.phoneUSDisplay}
                </a>
              </p>
              <p>
                <strong className="text-white">Support: </strong>
                <a href={`tel:${COMPANY_INFO.contacts.phoneSupport.replace(/[^0-9+]/g, "")}`} className="text-orange-400 hover:underline">
                  {COMPANY_INFO.contacts.phoneSupportDisplay}
                </a>
              </p>
              <p>
                <strong className="text-white">Email: </strong>
                <a href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`} className="text-orange-400 hover:underline">
                  {COMPANY_INFO.contacts.emailPrimary}
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-[#0b132b] py-3.5 px-4 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Verified Business Entity:</strong> Unique Dispatch is registered in Alexandria, Egypt, providing third-party freight coordination, Amazon Relay dispatch, and logistics support services worldwide.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-slate-300 font-semibold">
            <span>Verified Freight Entity</span>
            <span>•</span>
            <span>FMCSA Non-Forced Dispatch Standard</span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#050914] py-6 px-4 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-slate-400">
            &copy; 2026 Unique Dispatch. All rights reserved. Registered Address: Khaled Ibn El-Walid St., off El-Geish St. - Miami, Alexandria 21614, Egypt.
          </p>
          <div className="flex items-center justify-center space-x-4 text-slate-400">
            <a href="#leadership" className="hover:text-white transition-colors">
              Owner Profile
            </a>
            <span>•</span>
            <a href="#contact-us" className="hover:text-white transition-colors">
              Office Location
            </a>
            <span>•</span>
            <a href="#about" className="hover:text-white transition-colors">
              Why Choose Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
