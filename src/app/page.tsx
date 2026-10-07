import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Services from "@/components/Services";
import EquipmentSection from "@/components/EquipmentSection";
import RateCalculator from "@/components/RateCalculator";
import Pricing from "@/components/Pricing";
import HowItWorks from "@/components/HowItWorks";
import FAQSection from "@/components/FAQSection";
import LeadershipSection from "@/components/LeadershipSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 overflow-x-hidden">
      {/* Top Bar & Main Navigation Header */}
      <Navbar />

      {/* Main Content Sections in exact alignment with uniquedispatcher.com */}
      <main className="flex-1">
        {/* 1. Hero: "For Owner Operators and Truckers - Freight Dispatch Service" */}
        <Hero />

        {/* 2. Why Choose Us: "WE ADD VALUE TO YOUR BUSINESS" */}
        <WhyChooseUs />

        {/* 3. Our Services: "OUR AWESOME SERVICES" */}
        <Services />

        {/* 4. Equipment Grid: "TRUCKS & TRAILERS WE DISPATCH" */}
        <EquipmentSection />

        {/* 5. Revenue & Rate Calculator */}
        <RateCalculator />

        {/* 6. Pricing & Plans: 6% vs $299 Flat Fee */}
        <Pricing />

        {/* 7. How It Works: 4-Step Onboarding */}
        <HowItWorks />

        {/* 8. Frequently Asked Questions */}
        <FAQSection />

        {/* 9. Executive Leadership & Verified Ownership (Payoneer Verification) */}
        <LeadershipSection />

        {/* 10. Contact & Physical Registered Office with Map */}
        <ContactSection />
      </main>

      {/* Corporate Deep Navy Footer */}
      <Footer />
    </div>
  );
}
