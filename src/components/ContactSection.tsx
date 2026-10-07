"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building,
  ShieldCheck,
  MessageSquare,
  Truck,
  ExternalLink,
} from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    mcDotNumber: "",
    truckType: "Dry Van (53')",
    phone: "",
    email: "",
    truckCount: "1",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate reliable form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section id="contact" className="py-24 bg-slate-900/90 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <Phone className="w-3.5 h-3.5" />
            Direct Contact &amp; Registered Office
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Get Dispatched Or Visit Our Office
          </h2>
          <p className="text-slate-300 text-base">
            Reach out directly to our dispatch desk or submit your carrier details below to get booked today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Direct Info Cards & Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Primary Direct Lines Card */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-6 space-y-5 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Phone className="w-4 h-4 text-emerald-400" />
                Direct Telephone Lines
              </h3>

              <div className="space-y-3">
                <a
                  href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">US Direct Dispatch Line</p>
                      <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {COMPANY_INFO.contacts.phoneUSDisplay}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Toll-Free / US
                  </span>
                </a>

                <a
                  href={`tel:${COMPANY_INFO.contacts.phoneSupport.replace(/[^0-9+]/g, "")}`}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Support &amp; Operations Line</p>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {COMPANY_INFO.contacts.phoneSupportDisplay}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                    Direct
                  </span>
                </a>

                <a
                  href={COMPANY_INFO.contacts.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 hover:border-emerald-500 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-300 font-semibold">WhatsApp 24/7 Live Chat</p>
                      <p className="text-sm font-bold text-white">{COMPANY_INFO.contacts.phoneSupportDisplay}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                    Chat Now <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </div>
            </div>

            {/* Email Contact Card */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Mail className="w-4 h-4 text-blue-400" />
                Official Email Addresses
              </h3>

              <div className="space-y-3">
                <a
                  href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center gap-3"
                >
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Primary Dispatch</p>
                    <p className="text-xs font-semibold text-white truncate">{COMPANY_INFO.contacts.emailPrimary}</p>
                  </div>
                </a>

                <a
                  href={`mailto:${COMPANY_INFO.contacts.emailSecondary}`}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center gap-3"
                >
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Executive / Owner Contact</p>
                    <p className="text-xs font-semibold text-white truncate">{COMPANY_INFO.contacts.emailSecondary}</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Registered Physical Address & Map Card */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  Registered Physical Office
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Alexandria, Egypt
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-sm">{COMPANY_INFO.name}</p>
                <p>{COMPANY_INFO.address.street}</p>
                <p>District: {COMPANY_INFO.address.district}</p>
                <p>
                  City &amp; Region: {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state}
                </p>
                <p>Postal / ZIP Code: <span className="font-mono font-bold text-emerald-400">{COMPANY_INFO.address.postalCode}</span></p>
                <p>Country: {COMPANY_INFO.address.country}</p>
              </div>

              {/* Embedded Google Map */}
              <div className="rounded-xl overflow-hidden border border-slate-800 h-48 w-full relative">
                <iframe
                  title="Unique Dispatch Registered Office Location"
                  src={COMPANY_INFO.address.embedMapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="filter grayscale contrast-125 opacity-85 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                ></iframe>
              </div>

              <a
                href={COMPANY_INFO.address.googleMapsSearch}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

          {/* Right Column: Interactive Carrier Contact Form */}
          <div className="lg:col-span-7 bg-slate-950/90 rounded-3xl border-2 border-slate-800 p-6 sm:p-10 shadow-2xl relative">
            <div className="mb-8 pb-4 border-b border-slate-800">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Carrier Onboarding &amp; Quote Request</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Fill out the details below. Your assigned dispatcher will contact you within 15 minutes.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 px-6 text-center space-y-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-white">Application Received!</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Thank you, <strong className="text-white">{formData.fullName || "Carrier"}</strong>. 
                  Managing Director <strong className="text-white">Marven Awad</strong> and our senior dispatch desk have received your information. 
                  We will call you at <strong className="text-emerald-400">{formData.phone || "your number"}</strong> shortly.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-all"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Company / Carrier Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Freight LLC"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      MC or USDOT Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MC# 1234567 or DOT# 3456789"
                      value={formData.mcDotNumber}
                      onChange={(e) => setFormData({ ...formData, mcDotNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Equipment / Truck Type *
                    </label>
                    <select
                      value={formData.truckType}
                      onChange={(e) => setFormData({ ...formData, truckType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="Dry Van (53')">Dry Van (53&apos;)</option>
                      <option value="Reefer (53')">Reefer (53&apos;)</option>
                      <option value="Flatbed / Stepdeck">Flatbed / Stepdeck</option>
                      <option value="26ft Box Truck">26ft Box Truck</option>
                      <option value="Power Only">Power Only</option>
                      <option value="Amazon Relay Specialist">Amazon Relay Dedicated</option>
                      <option value="Other">Other Equipment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. carrier@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Lanes, Preferred States or Specific Inquiries
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g., Looking for Midwest to Southeast reefers, or need Amazon Relay block booking assistance..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processing Dispatch Application...
                      </span>
                    ) : (
                      <>
                        <span>Submit Carrier Application</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400 pt-2">
                  🔒 We respect your privacy. No spam. 100% confidential freight dispatch inquiry.
                </p>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
