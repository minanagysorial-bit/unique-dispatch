import type { Metadata, Viewport } from "next";
import "./globals.css";
import { COMPANY_INFO, FAQS } from "@/lib/constants";

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://uniquedispatcher.com"),
  title: {
    default: "Unique Dispatch | US Freight Dispatch Service & Amazon Relay Management",
    template: "%s | Unique Dispatch",
  },
  description:
    "Unique Dispatch arranges professional freight dispatch services for owner-operators and truckers. Top rate-per-mile negotiation, Amazon Relay middle-mile & block booking, 24/7 dedicated dispatchers, and zero forced dispatch.",
  keywords: [
    "Unique Dispatch",
    "Freight Dispatch Service",
    "Truck Dispatching Service",
    "Amazon Relay Dispatcher",
    "Amazon Relay Middle Mile",
    "Amazon Relay Block Booking",
    "Dry Van Dispatch",
    "Reefer Dispatch",
    "Flatbed Dispatch",
    "26ft Box Truck Dispatch",
    "US Freight Logistics",
    "Owner Operator Dispatch",
    "No Forced Dispatch",
    "Top Rate Per Mile",
  ],
  authors: [{ name: "Unique Dispatch Operations Team", url: "https://uniquedispatch.com" }],
  publisher: "Unique Dispatch",
  formatDetection: {
    email: true,
    address: false,
    telephone: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Unique Dispatch | US Freight Dispatch Service & Amazon Relay Management",
    description:
      "For Owner Operators and Truckers. Professional dispatch services, top rate negotiations, Amazon Relay blocks, and 24/7 dedicated dispatch support.",
    url: "https://uniquedispatch.com",
    siteName: "Unique Dispatch",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "Unique Dispatch - US Freight & Amazon Relay Dispatching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unique Dispatch | Freight Dispatch Service & Amazon Relay",
    description:
      "Professional dispatch services for owner-operators and truckers tired of cheap freight. 24/7 US dispatch desk.",
    images: [
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logisticsSchema = {
    "@context": "https://schema.org",
    "@type": "LogisticsService",
    name: COMPANY_INFO.name,
    alternateName: "Unique Dispatch Logistics",
    description: COMPANY_INFO.shortDesc,
    url: "https://uniquedispatch.com",
    telephone: COMPANY_INFO.contacts.phoneUS,
    email: "uniquedispatchh@gmail.com",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    areaServed: ["United States", "Egypt", "Worldwide"],
    serviceType: [
      "Freight Dispatching",
      "Amazon Relay Management",
      "Dry Van Dispatch",
      "Reefer Dispatch",
      "Flatbed Dispatch",
      "26ft Box Truck Dispatch",
      "Carrier Packet & Factoring Assistance",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(logisticsSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="bg-white text-slate-900 min-h-screen antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
