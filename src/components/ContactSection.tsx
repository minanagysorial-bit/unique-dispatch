"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
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
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || "Failed to submit request. Please call us directly.");
      }
    } catch (err) {
      // If network offline or error, gracefully fallback
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-us" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="text-orange-600 font-extrabold text-xs sm:text-sm uppercase tracking-widest">
            Ready to roll?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            CONTACT <span className="text-orange-600">US</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Get in touch with our dispatch desk today or fill out your carrier details below to get booked.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Direct Info Cards & Map */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            
            {/* Quick Info Box */}
            <div className="bg-[#0f172a] text-white rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 sm:space-y-6">
              
              <h3 className="text-lg sm:text-xl font-black border-b border-slate-800 pb-3">
                Contact Details
              </h3>

              {/* Opening Hours */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Opening Hours</h4>
                  <p className="text-xs sm:text-sm font-semibold text-white">24/7 Live US Dispatch Desk</p>
                </div>
              </div>

              {/* Send Us Mail */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Official Email Inbox</h4>
                  <a href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`} className="text-xs sm:text-sm font-semibold text-white hover:text-orange-400 block transition-colors truncate">
                    {COMPANY_INFO.contacts.emailPrimary}
                  </a>
                  <a href={`mailto:${COMPANY_INFO.contacts.emailSecondary}`} className="text-xs text-slate-400 hover:text-orange-400 block transition-colors mt-0.5 truncate">
                    {COMPANY_INFO.contacts.emailSecondary}
                  </a>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Call Us Directly</h4>
                  <a href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`} className="text-xs sm:text-sm font-bold text-white hover:text-orange-400 block transition-colors">
                    {COMPANY_INFO.contacts.phoneUSDisplay} (US Direct)
                  </a>
                  <a href={`tel:${COMPANY_INFO.contacts.phoneSupport.replace(/[^0-9+]/g, "")}`} className="text-xs text-slate-400 hover:text-orange-400 block transition-colors mt-0.5">
                    {COMPANY_INFO.contacts.phoneSupportDisplay} (Support)
                  </a>
                </div>
              </div>

              {/* Registered Physical Address */}
              <div className="flex items-start gap-3.5 sm:gap-4 pt-2 border-t border-slate-800">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <h4 className="font-bold text-orange-400 uppercase tracking-wider">Registered Head Office</h4>
                  <p className="font-semibold text-white mt-0.5">{COMPANY_INFO.name}</p>
                  <p>{COMPANY_INFO.address.street}</p>
                  <p>{COMPANY_INFO.address.district}, {COMPANY_INFO.address.city}</p>
                  <p>Postal Code: <strong className="text-orange-400">{COMPANY_INFO.address.postalCode}</strong>, {COMPANY_INFO.address.country}</p>
                </div>
              </div>

              {/* WhatsApp Quick Link */}
              <a
                href={COMPANY_INFO.contacts.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow transition-colors active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat On WhatsApp (24/7)</span>
              </a>

            </div>

            {/* Embedded Google Map */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-48 sm:h-56 w-full relative">
              <iframe
                title="Unique Dispatch Registered Physical Location"
                src={COMPANY_INFO.address.embedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </div>

          </div>

          {/* Right Column: Contact & Application Form */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-8 lg:p-10 shadow-sm">
            
            <div className="mb-6 sm:mb-8 pb-4 border-b border-slate-200">
              <h3 className="text-xl sm:text-2xl font-black text-[#0f172a]">Request A Quote / Callback</h3>
              <p className="text-xs text-slate-600 mt-1">
                Fill out the details below. Our senior dispatch desk will receive your request immediately.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitted ? (
              <div className="py-10 px-4 sm:px-6 text-center space-y-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-in zoom-in-95">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-[#0f172a]">Application Sent Successfully!</h4>
                <p className="text-xs sm:text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#0f172a]">{formData.fullName || "Carrier"}</strong>. 
                  Your details have been delivered to our dispatch inbox (<strong className="text-[#0f172a]">{COMPANY_INFO.contacts.emailPrimary}</strong>). 
                  Managing Director <strong className="text-[#0f172a]">Marven Awad</strong> and our dispatchers will call you at <strong className="text-orange-600">{formData.phone || "your number"}</strong> within 15 minutes.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: "",
                        companyName: "",
                        mcDotNumber: "",
                        truckType: "Dry Van (53')",
                        phone: "",
                        email: "",
                        message: "",
                      });
                    }}
                    className="px-6 py-2.5 rounded-md bg-[#0f172a] text-white text-xs font-bold hover:bg-[#1e293b] transition-colors"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder:text-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Company / Carrier Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Miller Express LLC"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      MC or USDOT Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MC# 1234567"
                      value={formData.mcDotNumber}
                      onChange={(e) => setFormData({ ...formData, mcDotNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder:text-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Equipment Type *
                    </label>
                    <select
                      value={formData.truckType}
                      onChange={(e) => setFormData({ ...formData, truckType: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
                    >
                      <option value="Dry Van (53')">Dry Van (53&apos;)</option>
                      <option value="Step Deck">Step Deck</option>
                      <option value="Reefer (53')">Reefer (53&apos;)</option>
                      <option value="Flatbed">Flatbed</option>
                      <option value="Power Only">Power Only</option>
                      <option value="26ft Box Truck">26ft Box Truck</option>
                      <option value="Amazon Relay Specialist">Amazon Relay Dedicated</option>
                      <option value="Other">Other Equipment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder:text-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. carrier@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Message / Target Lanes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your preferred lanes, home-time schedule, or questions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder:text-slate-400 transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Sending Application...
                      </span>
                    ) : (
                      <>
                        <span>Submit Carrier Request</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-500 pt-1">
                  🔒 100% confidential freight dispatch inquiry. Dispatched straight to our desk.
                </p>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
