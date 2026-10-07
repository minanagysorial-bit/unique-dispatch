import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContactWidget from "@/components/FloatingContactWidget";
import { ShieldCheck, Lock, Mail, Phone, MapPin, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Unique Dispatch - Truck & Freight Dispatching",
  description: "Official Privacy Policy of Unique Dispatch. Learn how we handle carrier data, MC/DOT records, communication consent, and information security.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-20">
        
        {/* Hero Header Banner */}
        <section className="bg-[#0a1128] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Carrier Data Protection &amp; Compliance</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Privacy Policy
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              How Unique Dispatch collects, manages, and protects carrier, driver, and logistics information across our North American dispatch operations.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
              <Link href="/" className="hover:text-orange-400 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="text-white font-semibold">Privacy Policy</span>
              <span>•</span>
              <span>Last Updated: January 2026</span>
            </div>

          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-slate max-w-none space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            {/* 1. Introduction */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-[#0a1128] flex items-center gap-2 m-0">
                <FileText className="w-5 h-5 text-orange-600 shrink-0" />
                1. Introduction &amp; Scope
              </h2>
              <p className="m-0">
                Welcome to <strong>Unique Dispatch</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), directed by <strong>{COMPANY_INFO.founder.name}</strong>. We provide professional third-party independent freight dispatching, rate negotiation, broker packet administration, and logistics coordination services to motor carriers and owner-operators operating throughout the United States and North America.
              </p>
              <p className="m-0">
                This Privacy Policy outlines how we collect, use, disclose, and safeguard your company and personal data when you visit our website, enroll in our carrier dispatch programs, or interact with our 24/7 dispatch desk.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                2. Information We Collect
              </h2>
              <p>
                To successfully represent your motor carrier authority and book freight with licensed freight brokers, we collect specific operational and corporate documentation, including:
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Carrier Identity &amp; Authority Data:</strong> Motor Carrier (MC) Number, USDOT Number, Carrier Legal Name, DBA, and FMCSA Operating Authority Certificate.</li>
                <li><strong>Insurance &amp; Financial Documentation:</strong> Certificate of Insurance (COI) naming Certificate Holders, W-9 Tax Forms, Factoring Notice of Assignment (NOA), and voided checks for direct deposit setups.</li>
                <li><strong>Equipment &amp; Operational Profiles:</strong> Equipment type (Dry Van 53&apos;, Reefer, Flatbed, Step Deck, 26ft Box Truck, Power Only), max weight capacity, trailer dimensions, preferred lanes, and home-time preferences.</li>
                <li><strong>Contact Information:</strong> Owner and driver legal names, cellular telephone numbers, primary email addresses, and emergency contact details.</li>
                <li><strong>Dispatch &amp; Location Updates:</strong> Real-time location check calls, estimated times of arrival (ETA), proof of delivery (POD), and bills of lading (BOL) required for load tracking and payment settlement.</li>
              </ul>
            </div>

            {/* 3. How We Use Your Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                3. How We Use Your Information
              </h2>
              <p>We process collected carrier information strictly to execute freight dispatch services:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Negotiating top spot rates with certified brokers & shippers",
                  "Completing new broker-carrier setup packets on your behalf",
                  "Booking Amazon Relay middle-mile loads & Post-A-Truck lanes",
                  "Submitting BOLs and Rate Confirmations to factoring companies",
                  "Tracking detention, layover, and TONU claims for recovery",
                  "Delivering 24/7 check-in, routing, and emergency roadside coordination",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. SMS & Communication Policy (TCPA / A2P Compliance) */}
            <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
              <h2 className="text-xl font-bold text-orange-950 flex items-center gap-2 m-0">
                <Phone className="w-5 h-5 text-orange-600 shrink-0" />
                4. SMS &amp; Phone Communication Policy (TCPA &amp; A2P 10DLC)
              </h2>
              <p className="text-slate-800 m-0">
                By submitting your contact information or enrolling in Unique Dispatch services, you provide express consent to receive operational communications, SMS text messages, and telephone calls from our dispatch desk regarding available loads, rate offers, check calls, and document requests.
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-slate-800 text-xs sm:text-sm m-0">
                <li><strong>No Spam or Third-Party Marketing:</strong> We will never sell, rent, or share your phone number with external marketers.</li>
                <li><strong>Message Frequency:</strong> Message frequency varies depending on active dispatch status and active load movements.</li>
                <li><strong>Opt-Out:</strong> You may reply <strong>STOP</strong> at any time to cancel SMS communications or request email-only dispatching.</li>
              </ul>
            </div>

            {/* 5. Information Sharing & Third Parties */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                5. Information Sharing &amp; Third-Party Disclosures
              </h2>
              <p>
                We do not sell carrier lists. We disclose your carrier documentation solely to legitimate logistics partners necessary for the transportation of freight:
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Licensed Freight Brokers &amp; Shippers:</strong> To verify your MC authority, execute Broker-Carrier Agreements, and issue legally binding Rate Confirmations.</li>
                <li><strong>Factoring Companies:</strong> To submit completed freight bills, invoices, and rate agreements for same-day carrier funding.</li>
                <li><strong>Legal &amp; Regulatory Authorities:</strong> Where required by applicable law, FMCSA audits, or court orders.</li>
              </ul>
            </div>

            {/* 6. Data Security */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                6. Data Security &amp; Retention
              </h2>
              <p>
                Unique Dispatch implements industry-standard administrative, physical, and technical safeguards to prevent unauthorized access, loss, or misuse of your carrier packets and banking details. We retain operational records only for the period required to fulfill dispatch obligations and comply with tax and legal regulations.
              </p>
            </div>

            {/* 7. Contact Us & Data Controller */}
            <div className="p-6 rounded-2xl bg-[#0a1128] text-white space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
                <Lock className="w-5 h-5 text-orange-400" />
                7. Contact Information &amp; Data Controller
              </h2>
              <p className="text-slate-300 m-0">
                If you have questions regarding this Privacy Policy or wish to review your stored carrier records, please contact our managing director:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-slate-200">
                <div className="space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Entity &amp; Leadership</p>
                  <p className="font-bold text-white">{COMPANY_INFO.name}</p>
                  <p>Director: {COMPANY_INFO.founder.name}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Direct Inquiries</p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <a href={`mailto:${COMPANY_INFO.contacts.emailPrimary}`} className="text-orange-400 hover:underline">
                      {COMPANY_INFO.contacts.emailPrimary}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <a href={`tel:${COMPANY_INFO.contacts.phoneUS.replace(/[^0-9+]/g, "")}`} className="text-orange-400 hover:underline">
                      {COMPANY_INFO.contacts.phoneUSDisplay}
                    </a>
                  </p>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>{COMPANY_INFO.address.fullFormatted}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
      <FloatingContactWidget />
    </div>
  );
}
