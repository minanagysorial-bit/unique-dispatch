import type { Metadata } from "next";
import "./globals.css";
import { COMPANY_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Unique Dispatch | US Truck Dispatching & Amazon Relay Management",
  description:
    "Unique Dispatch offers premier US freight dispatching, Amazon Relay management, top rate-per-mile negotiation, and 24/7 dedicated dispatch for owner-operators and fleets. Directed by Marven Awad.",
  keywords: [
    "Unique Dispatch",
    "Truck Dispatching",
    "Amazon Relay Dispatcher",
    "US Freight Dispatch",
    "Dry Van Dispatch",
    "Reefer Dispatch",
    "Flatbed Dispatch",
    "Box Truck Dispatch",
    "Marven Awad",
    "Alexandria Egypt Dispatch",
  ],
  authors: [{ name: "Marven Awad", url: "https://uniquedispatcher.com" }],
  creator: "Marven Awad",
  publisher: "Unique Dispatch",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    title: "Unique Dispatch | Reliable US Truck Dispatching & Amazon Relay Management",
    description:
      "Maximize your gross revenue per mile with 24/7 dedicated dispatchers, top rate negotiations, and 100% no forced dispatch. Verified Leadership: Marven Awad.",
    url: "https://uniquedispatcher.com",
    siteName: "Unique Dispatch",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unique Dispatch | US Truck Dispatching & Amazon Relay Management",
    description:
      "Premier truck dispatching and Amazon Relay operations management. Dedicated dispatchers, zero forced dispatch.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LogisticsService",
    name: COMPANY_INFO.name,
    description:
      "Professional US truck dispatching, spot rate negotiation, and Amazon Relay middle-mile operations management.",
    url: "https://uniquedispatcher.com",
    telephone: COMPANY_INFO.contacts.phoneUS,
    email: COMPANY_INFO.contacts.emailPrimary,
    founder: {
      "@type": "Person",
      name: COMPANY_INFO.founder.name,
      jobTitle: COMPANY_INFO.founder.title,
      email: COMPANY_INFO.founder.email,
      telephone: COMPANY_INFO.founder.phoneUS,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY_INFO.address.street,
      addressLocality: COMPANY_INFO.address.city,
      addressRegion: COMPANY_INFO.address.state,
      postalCode: COMPANY_INFO.address.postalCode,
      addressCountry: COMPANY_INFO.address.country,
    },
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
      "Box Truck Dispatch",
      "Factoring & Invoicing Assistance",
    ],
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
