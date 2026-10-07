import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContactWidget from "@/components/FloatingContactWidget";
import { Scale, CheckCircle2, AlertCircle, Mail, Phone, MapPin, ChevronRight, FileCheck } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Unique Dispatch - Truck Dispatch Services",
  description: "Official Terms of Service and Independent Dispatch Agreement guidelines for Unique Dispatch. Read our 100% No Forced Dispatch policy.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-20">
        
        {/* Hero Header Banner */}
        <section className="bg-[#0a1128] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Independent Dispatch Service Agreement</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Terms of Service
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              Clear, transparent operational standards governing independent carrier dispatch, rate negotiation, and administrative services.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
              <Link href="/" className="hover:text-orange-400 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="text-white font-semibold">Terms of Service</span>
              <span>•</span>
              <span>Effective Date: January 2026</span>
            </div>

          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-slate max-w-none space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            {/* 1. Agreement Overview */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h2 className="text-xl font-bold text-[#0a1128] flex items-center gap-2 m-0">
                <FileCheck className="w-5 h-5 text-orange-600 shrink-0" />
                1. Service Agreement &amp; Relationship
              </h2>
              <p className="m-0">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between <strong>Unique Dispatch</strong>, directed by <strong>{COMPANY_INFO.founder.name}</strong>, and you (&quot;Carrier&quot;, &quot;Owner-Operator&quot;, or &quot;Client&quot;). 
              </p>
              <p className="m-0">
                Unique Dispatch operates as an <strong>Independent Third-Party Truck Dispatcher</strong> acting under the authorization of the Carrier to source, negotiate, and coordinate freight shipments on behalf of the Carrier&apos;;s active USDOT and Motor Carrier (MC) operating authority. Unique Dispatch is not a motor carrier, freight broker, or freight forwarder.
              </p>
            </div>

            {/* 2. Strict 100% No Forced Dispatch Guarantee */}
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2 m-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                2. Strict 100% No Forced Dispatch Guarantee
              </h2>
              <p className="text-slate-800 m-0">
                The Carrier maintains <strong>100% absolute final authority</strong> over all driving decisions, including but not limited to:
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-slate-800 text-xs sm:text-sm m-0">
                <li>Accepting or declining any load, destination, lane, or broker offer without penalty.</li>
                <li>Determining vehicle safety, safe operating conditions, and driver hours-of-service (HOS) limits.</li>
                <li>Choosing preferred driving areas, preferred days on the road, and requested home-time schedules.</li>
              </ul>
            </div>

            {/* 3. Carrier Obligations & Authority */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                3. Carrier Obligations &amp; Compliance
              </h2>
              <p>To receive dispatching services, the Carrier certifies and warrants that:</p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Active Authority:</strong> Carrier holds an active, authorized, and compliant FMCSA/USDOT motor carrier registration in good standing.</li>
                <li><strong>Insurance Requirements:</strong> Carrier maintains continuous commercial auto liability insurance (minimum \$1,000,000 USD) and cargo insurance (minimum \$100,000 USD).</li>
                <li><strong>Safety &amp; Compliance:</strong> Carrier and its employed drivers adhere to all FMCSA safety rules, DOT physical standards, ELD logging requirements, and equipment maintenance codes.</li>
                <li><strong>Timely Information:</strong> Carrier promptly provides accurate updates regarding arrival times, load check calls, delivery confirmations, and delays.</li>
              </ul>
            </div>

            {/* 4. Rates, Rate Confirmations & Direct Broker Payments */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                4. Rates, Rate Confirmations &amp; Freight Payment
              </h2>
              <p>
                All freight Rate Confirmations are legally contracted directly between the licensed freight broker/shipper and the Motor Carrier. 
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-[#0a1128] text-sm">Direct Freight Remittance</h4>
                  <p className="text-xs text-slate-600">
                    Carrier receives 100% of the freight payment directly from the broker or through the Carrier&apos;s chosen Factoring Company via ACH / QuickPay.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-[#0a1128] text-sm">Transparent Invoicing</h4>
                  <p className="text-xs text-slate-600">
                    Unique Dispatch bills the Carrier a transparent dispatch service fee on completed, successfully delivered loads with zero hidden charges.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Non-Exclusivity & Termination */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0a1128] border-b pb-2 border-slate-200">
                5. Non-Exclusivity &amp; Cancellation
              </h2>
              <p>
                Our services are strictly <strong>non-exclusive</strong> with <strong>zero long-term contract lock-ins</strong>. Either party may terminate or pause dispatch services at any time by providing written notice via email or text message, provided that all currently booked loads are delivered and outstanding service invoices are settled.
              </p>
            </div>

            {/* 6. Limitation of Liability */}
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <h2 className="text-xl font-bold text-amber-950 flex items-center gap-2 m-0">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                6. Limitation of Liability
              </h2>
              <p className="text-slate-800 text-xs sm:text-sm m-0">
                Unique Dispatch acts solely in an administrative dispatch coordination capacity. Unique Dispatch is not responsible for cargo damage, theft, road accidents, mechanical breakdowns, broker non-payment, or detention disputes caused by third-party facilities, although our dispatch team actively assists carriers in filing and pursuing detention, layover, and TONU claims.
              </p>
            </div>

            {/* 7. Governing Law & Contact */}
            <div className="p-6 rounded-2xl bg-[#0a1128] text-white space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
                <Scale className="w-5 h-5 text-orange-400" />
                7. Official Inquiries &amp; Notice
              </h2>
              <p className="text-slate-300 m-0">
                For questions regarding dispatch agreements, carrier packets, or service terms, reach out to our management:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-slate-200">
                <div className="space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Managing Entity</p>
                  <p className="font-bold text-white">{COMPANY_INFO.name}</p>
                  <p>Director: {COMPANY_INFO.founder.name}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Direct Contacts</p>
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
