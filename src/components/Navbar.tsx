"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Mail, Clock, Menu, X, Shield, ChevronRight, MessageSquare } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Fleet & Equipment", href: "#equipment" },
    { name: "Rate Calculator", href: "#calculator" },
    { name: "Pricing", href: "#pricing" },
    { name: "Leadership & Ownership", href: "#leadership" },
    { name: "Contact & Office", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Bar for Rapid Contact & Payoneer/Broker Verification Visibility */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 text-xs text-slate-300 py-1.5 px-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Live US Dispatch Active
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Response Time: Under 15 Mins
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5 text-slate-300">
            <a
              href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-white">{COMPANY_INFO.contacts.phoneUSDisplay}</span>
              <span className="hidden sm:inline text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">US Line</span>
            </a>
            <span className="text-slate-700">|</span>
            <a
              href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`}
              className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{COMPANY_INFO.contacts.emailPrimary}</span>
            </a>
            <a
              href={COMPANY_INFO.contacts.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-medium text-[11px]"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div
        className={`px-4 lg:px-8 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-900/95 backdrop-blur-md shadow-xl border-b border-slate-800/80 py-3"
            : "bg-slate-900/80 backdrop-blur-sm py-4 border-b border-slate-800/40"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="#home" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
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
                US Freight & Amazon Relay
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-xs xl:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href="#contact"
              className="relative group overflow-hidden rounded-lg p-px font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-400 transition-all duration-300 group-hover:opacity-90"></span>
              <span className="relative flex items-center gap-2 rounded-[7px] bg-slate-950 px-4 py-2 text-white transition-all duration-200 group-hover:bg-transparent">
                <span>Get Dispatched Now</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-lg border border-slate-700/60 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/98 border-b border-slate-800 px-6 py-6 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-emerald-400 hover:bg-slate-800/60 rounded-lg transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold border border-slate-700"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                Call US Dispatch: {COMPANY_INFO.contacts.phoneUSDisplay}
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20"
              >
                <span>Get Dispatched Now</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
