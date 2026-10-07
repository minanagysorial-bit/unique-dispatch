"use client";

import React, { useState, useEffect } from "react";
import { Phone, MessageSquare, ArrowUp, X, Sparkles } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function FloatingContactWidget() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          type="button"
          aria-label="Scroll to top"
          className="pointer-events-auto p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white shadow-lg border border-slate-700/80 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowUp className="w-4 h-4 text-orange-400" />
        </button>
      )}

      {/* Floating Prompt Bubble */}
      {hasPrompted && (
        <div className="pointer-events-auto bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2.5 animate-bounce transition-all duration-300">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="font-semibold text-slate-200">
            24/7 US Dispatch Desk Active
          </span>
          <button
            onClick={() => setHasPrompted(false)}
            aria-label="Close prompt"
            className="text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Action Buttons Stack */}
      <div className="pointer-events-auto flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
        
        {/* Direct US Call Button */}
        <a
          href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
          className="group flex items-center gap-2 bg-[#0a1128] hover:bg-[#0f172a] text-white px-3.5 py-2.5 rounded-full shadow-xl border border-slate-700/80 transition-all duration-300 hover:scale-105 active:scale-95"
          title={`Call US Dispatch Line ${COMPANY_INFO.contacts.phoneUSDisplay}`}
        >
          <div className="w-8 h-8 rounded-full bg-orange-600 group-hover:bg-orange-500 flex items-center justify-center text-white shrink-0 transition-colors shadow-sm">
            <Phone className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Direct US Line</p>
            <p className="text-xs font-black text-white">{COMPANY_INFO.contacts.phoneUSDisplay}</p>
          </div>
        </a>

        {/* WhatsApp Direct Chat Button */}
        <a
          href={COMPANY_INFO.contacts.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-400/40"
          title="Chat with Dispatcher on WhatsApp"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-700 group-hover:bg-emerald-600 flex items-center justify-center text-white shrink-0 transition-colors shadow-sm">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Instant Chat</p>
            <p className="text-xs font-black text-white">WhatsApp 24/7</p>
          </div>
        </a>

      </div>

    </div>
  );
}
