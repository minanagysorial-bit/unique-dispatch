import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarketStatsTicker from "@/components/MarketStatsTicker";
import WhyChooseUs from "@/components/WhyChooseUs";
import Services from "@/components/Services";
import AmazonRelaySpecial from "@/components/AmazonRelaySpecial";
import EquipmentSection from "@/components/EquipmentSection";
import RateCalculator from "@/components/RateCalculator";
import HowItWorks from "@/components/HowItWorks";
import CarrierReviews from "@/components/CarrierReviews";
import FAQSection from "@/components/FAQSection";
import LeadershipSection from "@/components/LeadershipSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 overflow-x-hidden">
      {/* Top Bar & Main Navigation Header */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero: "For Owner Operators and Truckers - Freight Dispatch Service" */}
        <Hero />

        {/* 2. Live Spot Market Ticker */}
        <MarketStatsTicker />

        {/* 3. Why Choose Us: "WE ADD VALUE TO YOUR BUSINESS" */}
        <WhyChooseUs />

        {/* 4. Our Services: "OUR AWESOME SERVICES" */}
        <Services />

        {/* 5. Specialized Amazon Relay Middle-Mile & Block Desk */}
        <AmazonRelaySpecial />

        {/* 6. Equipment Grid: "TRUCKS & TRAILERS WE DISPATCH" */}
        <EquipmentSection />

        {/* 7. Revenue & Rate Calculator */}
        <RateCalculator />

        {/* 8. How It Works: 4-Step 24h Onboarding */}
        <HowItWorks />

        {/* 9. Verified Carrier Reviews & Success Stories */}
        <CarrierReviews />

        {/* 10. Frequently Asked Questions */}
        <FAQSection />

        {/* 11. Executive Leadership & Verified Ownership (Payoneer Verification) */}
        <LeadershipSection />

        {/* 12. Contact Us & Registered Physical Office with Map */}
        <ContactSection />
      </main>

      {/* Corporate Deep Navy Footer */}
      <Footer />
    </div>
  );
}
