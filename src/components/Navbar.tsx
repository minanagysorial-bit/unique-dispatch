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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/";
  };

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
      <div className="bg-[#0a1128] text-slate-300 text-xs py-2 px-3 sm:px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left Contacts */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <a
              href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-1.5 hover:text-orange-400 transition-colors font-bold text-white text-xs"
            >
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>{COMPANY_INFO.contacts.phoneUSDisplay}</span>
            </a>

            <a
              href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`}
              className="hidden sm:flex items-center gap-1.5 hover:text-orange-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-orange-500" />
              <span className="truncate max-w-[180px] md:max-w-none">{COMPANY_INFO.contacts.emailPrimary}</span>
            </a>

            <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>24/7 Live US Dispatch Desk</span>
            </div>
          </div>

          {/* Right Direct WhatsApp Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Entity
            </span>
            <a
              href={COMPANY_INFO.contacts.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 sm:px-3 py-1 rounded font-bold text-[11px] sm:text-xs transition-colors shadow-sm"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp Direct</span>
            </a>
          </div>

        </div>
      </div>

      {/* Main Navigation Header */}
      <div
        className={`px-3 sm:px-6 lg:px-8 bg-white transition-all duration-300 ${
          isScrolled ? "shadow-md py-2.5 sm:py-3" : "shadow-sm py-3 sm:py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* SVG Logo Component with Page Refresh */}
          <a
            href="/"
            onClick={handleLogoClick}
            className="focus:outline-none cursor-pointer group"
            title="Refresh Page"
            aria-label="Unique Dispatch Home & Refresh"
          >
            <Logo variant="dark" size="sm" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors rounded-md"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action CTA Button */}
          <div className="hidden sm:flex items-center">
            <a
              href="#contact-us"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Get A Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-800 hover:text-orange-600 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none active:scale-95 transition-transform"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer with Overlay */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-auto bg-white border-b border-slate-200 px-5 py-6 shadow-2xl animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-base font-bold text-slate-800 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-between border-b border-slate-100"
              >
                <span>{link.name}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2.5">
              <a
                href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                className="flex items-center justify-center gap-2 bg-[#0f172a] text-white py-3 rounded-lg text-sm font-bold shadow active:scale-98 transition-transform"
              >
                <Phone className="w-4 h-4 text-orange-400" />
                Call US Dispatch: {COMPANY_INFO.contacts.phoneUSDisplay}
              </a>
              <a
                href="#contact-us"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-lg text-sm font-black uppercase tracking-wider shadow active:scale-98 transition-transform"
              >
                <span>Request A Callback</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
