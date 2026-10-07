import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import EquipmentSection from "@/components/EquipmentSection";
import RateCalculator from "@/components/RateCalculator";
import Pricing from "@/components/Pricing";
import LeadershipSection from "@/components/LeadershipSection";
import HowItWorks from "@/components/HowItWorks";
import WhyChooseUs from "@/components/WhyChooseUs";
import ContactSection from "@/components/ContactSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Global Navigation Bar */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Core Services Section */}
        <Services />

        {/* Fleet & Equipment Supported */}
        <EquipmentSection />

        {/* Interactive Earnings & Rate Calculator */}
        <RateCalculator />

        {/* Transparent Pricing Plans */}
        <Pricing />

        {/* Leadership & Executive Ownership (Payoneer Verification Critical) */}
        <LeadershipSection />

        {/* How It Works & 4-Step Onboarding */}
        <HowItWorks />

        {/* Why Choose Us Benefits */}
        <WhyChooseUs />

        {/* Frequently Asked Questions */}
        <FAQSection />

        {/* Contact Form & Registered Physical Office with Map */}
        <ContactSection />
      </main>

      {/* Global Footer with Compliance & Address declarations */}
      <Footer />
    </div>
  );
}
