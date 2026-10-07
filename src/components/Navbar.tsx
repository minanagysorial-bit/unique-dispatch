"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Mail, Clock, Menu, X, ArrowRight, MessageSquare, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
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
    { name: "About Us", href: "#about" },
    { name: "Our Services", href: "#services" },
    { name: "Amazon Relay", href: "#amazon-relay" },
    { name: "Equipment", href: "#equipment" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Leadership", href: "#leadership" },
    { name: "Contact Us", href: "#contact-us" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Header Bar (Deep Navy Corporate) */}
      <div className="bg-[#0a1128] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Left Contacts */}
          <div className="flex flex-wrap items-center space-x-4 sm:space-x-6">
            <a
              href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`}
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-orange-500" />
              <span>{COMPANY_INFO.contacts.emailPrimary}</span>
            </a>

            <a
              href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors font-medium text-white"
            >
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>{COMPANY_INFO.contacts.phoneUSDisplay}</span>
            </a>

            <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Opening Hours: 24/7 Live US Dispatch</span>
            </div>
          </div>

          {/* Right Direct WhatsApp & Verification Badge */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Entity
            </span>
            <a
              href={COMPANY_INFO.contacts.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-0.5 rounded font-bold transition-colors shadow-sm"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp Direct</span>
            </a>
          </div>

        </div>
      </div>

      {/* Main Navigation Header */}
      <div
        className={`px-4 lg:px-8 bg-white transition-all duration-300 ${
          isScrolled ? "shadow-md py-3" : "shadow-sm py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* SVG Logo */}
          <Link href="#home">
            <Logo variant="dark" size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action CTA Button */}
          <div className="hidden sm:flex items-center">
            <a
              href="#contact-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Get A Quote</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-800 hover:text-orange-600 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-6 py-6 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-bold text-slate-800 hover:text-orange-600 hover:bg-slate-50 rounded-md transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="flex items-center justify-center gap-2 bg-[#0f172a] text-white py-3 rounded-md text-sm font-bold shadow"
              >
                <Phone className="w-4 h-4 text-orange-400" />
                Call: {COMPANY_INFO.contacts.phoneUSDisplay}
              </a>
              <a
                href="#contact-us"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-md text-sm font-bold shadow"
              >
                <span>Get A Quote</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
