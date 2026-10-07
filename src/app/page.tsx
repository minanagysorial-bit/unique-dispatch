import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Services from "@/components/Services";
import AmazonRelaySpecial from "@/components/AmazonRelaySpecial";
import EquipmentSection from "@/components/EquipmentSection";
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
        {/* 1. Hero: Video Background with Scenic Semi-Truck Driving Through Green Landscape */}
        <Hero />

        {/* 2. Why Choose Us: "WE ADD VALUE TO YOUR BUSINESS" */}
        <WhyChooseUs />

        {/* 3. Our Services: "OUR AWESOME SERVICES" */}
        <Services />

        {/* 4. Specialized Amazon Relay Middle-Mile & Dedicated Block Desk */}
        <AmazonRelaySpecial />

        {/* 5. Equipment Showcase: "TRUCKS & TRAILERS WE DISPATCH" */}
        <EquipmentSection />

        {/* 6. How It Works: Simple 4-Step 24H Onboarding */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        {/* 7. Verified Carrier Reviews & Success Stories */}
        <CarrierReviews />

        {/* 8. Frequently Asked Questions */}
        <FAQSection />

        {/* 9. Executive Leadership & Verified Ownership (Payoneer Verification Compliance) */}
        <LeadershipSection />

        {/* 10. Contact Us & Registered Physical Office with Map */}
        <ContactSection />
      </main>

      {/* Corporate Deep Navy Footer */}
      <Footer />
    </div>
  );
}
