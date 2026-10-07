export const COMPANY_INFO = {
  name: "Unique Dispatch",
  brandName: "Unique Dispatch",
  tagline: "For Owner Operators and Truckers — Freight Dispatch Service",
  shortDesc: "Unique Dispatch arranges professional dispatch services for owner-operators and truckers who are tired of wasting their time and energy on cheap freight.",
  
  // Leadership & Owner Profile (Payoneer Verification Critical)
  founder: {
    name: "Marven Awad",
    title: "Founder & Managing Director",
    role: "Director of US Freight Operations & Carrier Relations",
    bio: "Marven Awad is the Founder and Managing Director of Unique Dispatch. With over 5 years of specialized experience in North American freight markets, spot-market rate negotiation, and Amazon Relay Middle-Mile logistics, Marven oversees all carrier accounts to guarantee top gross revenue, zero forced dispatch, and effortless paperwork turnaround.",
    email: "marvengerges2008@gmail.com",
    workEmail: "uniquedispatchh@gmail.com",
    phoneUS: "+1 (332) 244-5532",
    phoneSupport: "+20 1223306831",
    location: "Alexandria, Egypt / Global Operations",
    experience: "5+ Years in North American Freight Logistics",
  },

  // Contact Info
  contacts: {
    phoneUS: "+1 (332) 244-5532",
    phoneUSDisplay: "+1 (332) 244-5532",
    phoneSupport: "+20 1223306831",
    phoneSupportDisplay: "+20 1223306831",
    emailPrimary: "uniquedispatchh@gmail.com",
    emailSecondary: "marvengerges2008@gmail.com",
    whatsappUrl: "https://wa.me/201223306831",
    workingHours: "24/7 Live US Dispatch Desk",
    responseTime: "Under 15 Minutes",
  },

  // Registered Business Physical Address (Payoneer Verification Critical)
  address: {
    street: "Khaled Ibn El-Walid St., off El-Geish St. - Miami",
    district: "Awal El-Montazah",
    city: "Alexandria",
    state: "Alexandria Governorate",
    postalCode: "21614",
    country: "Egypt",
    fullFormatted: "Khaled Ibn El-Walid St., off El-Geish St. - Miami, Awal El-Montazah, Alexandria 21614, Egypt",
    googleMapsSearch: "https://www.google.com/maps/search/?api=1&query=Khaled+Ibn+El-Walid+St+Miami+Alexandria+Egypt+21614",
    embedMapUrl: "https://maps.google.com/maps?q=Khaled%20Ibn%20El-Walid%20St,%20Miami,%20Alexandria%2021614,%20Egypt&t=&z=15&ie=UTF8&iwloc=&output=embed",
  },

  stats: [
    { label: "On-Time Dispatch Rate", value: "99.4%" },
    { label: "Average Rate Per Mile", value: "$2.85+" },
    { label: "Weekly Average Gross", value: "$8,500+" },
    { label: "Forced Dispatch", value: "0%" },
  ],
};

export const SERVICES = [
  {
    id: "amazon-relay",
    title: "Amazon Relay Management",
    tagline: "Middle-Mile & Block Specialist",
    description: "End-to-end management of your Amazon Relay carrier operations. We secure high-paying spot loads, Post-A-Truck matching, dedicated blocks, check-in support, and resolve ROC delay claims.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    features: [
      "24/7 Amazon Relay load board booking",
      "Short & long-term block booking execution",
      "Automated check-in & gate pass coordination",
      "ROC delay & disruption compensation claims",
    ],
  },
  {
    id: "dry-van",
    title: "Dry Van (53') Dispatch",
    tagline: "High Volume & Consistent Gross",
    description: "Nationwide high-volume lanes with trusted top-paying freight brokers. We eliminate empty miles and keep your trailers loaded in the best markets.",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80",
    features: [
      "Consistent cross-country and regional lanes",
      "Average $2.60 - $3.20+ per mile",
      "No cheap broker freight — top rate negotiation",
      "Detention & layover collection support",
    ],
  },
  {
    id: "reefer",
    title: "Reefer (53') Dispatch",
    tagline: "Premium Temperature Controlled",
    description: "Specialized cold-chain dispatching for produce, meat, frozen foods, and pharmaceuticals with top-tier spot rates across the United States.",
    image: "https://images.unsplash.com/photo-1586191582056-a602c3497d41?auto=format&fit=crop&w=800&q=80",
    features: [
      "Highest paying spot market loads ($3.00 - $4.00+/mi)",
      "Continuous reefer temperature monitoring",
      "Immediate lumper fee reimbursement handling",
      "Round-trip dedicated produce lane planning",
    ],
  },
  {
    id: "flatbed",
    title: "Flatbed & Step Deck Dispatch",
    tagline: "Machinery & Heavy Haul",
    description: "Tailored load booking for open-deck equipment, oversized machinery, steel, and building materials with verified certified shippers.",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80",
    features: [
      "High gross rates ($3.20 - $4.50+/mi)",
      "Tarp fees & extra stop charges collected",
      "Oversized permit and route assistance",
      "Direct construction & industrial contracts",
    ],
  },
  {
    id: "box-truck",
    title: "26ft Box Truck Dispatch",
    tagline: "Expedited & Liftgate Freight",
    description: "Dedicated dispatch for 26ft straight trucks, dock-high and liftgate loads, palletized LTL, and Amazon Relay middle-mile operations.",
    image: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=800&q=80",
    features: [
      "High rate-per-mile regional expedited loads",
      "Amazon Relay box truck loads & short-hauls",
      "Liftgate and inside delivery fee collection",
      "Low deadhead city-to-city routing",
    ],
  },
  {
    id: "back-office",
    title: "Back-Office & Paperwork Support",
    tagline: "Zero Administrative Headaches",
    description: "We complete carrier setup packets, request COIs, audit Rate Confirmations, and submit Invoices/BOLs to your factoring company for same-day funding.",
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
    features: [
      "Instant broker setup packet completion",
      "Factoring company submission & NOA processing",
      "Detention & layover tracking with time-stamped proof",
      "Transparent weekly dispatch earnings statement",
    ],
  },
];

export const EQUIPMENT_TYPES = [
  {
    name: "Dry Van (53')",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80",
    rateAvg: "$2.60 - $3.20 / mi",
    weeklyGross: "$7,500 - $9,500+",
  },
  {
    name: "Step Deck",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80",
    rateAvg: "$3.20 - $4.20 / mi",
    weeklyGross: "$9,500 - $13,000+",
  },
  {
    name: "Reefer (53')",
    image: "https://images.unsplash.com/photo-1586191582056-a602c3497d41?auto=format&fit=crop&w=600&q=80",
    rateAvg: "$2.90 - $3.90 / mi",
    weeklyGross: "$8,500 - $11,500+",
  },
  {
    name: "Flatbed",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80",
    rateAvg: "$3.00 - $4.10 / mi",
    weeklyGross: "$9,000 - $12,500+",
  },
  {
    name: "Power Only",
    image: "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=600&q=80",
    rateAvg: "$2.40 - $3.10 / mi",
    weeklyGross: "$6,500 - $8,800+",
  },
  {
    name: "26ft Box Truck",
    image: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=600&q=80",
    rateAvg: "$2.20 - $2.90 / mi",
    weeklyGross: "$5,000 - $7,500+",
  },
];

export const PRICING_PLANS = [
  {
    name: "Percentage Plan",
    subtitle: "Pay As You Earn",
    price: "6%",
    priceDetail: "of gross load revenue",
    description: "The most flexible plan for owner-operators. You only pay when you make money.",
    badge: "Most Popular",
    isPopular: true,
    features: [
      "100% No Forced Dispatch — you approve every load",
      "Dedicated senior dispatcher assigned to you",
      "Amazon Relay, DAT One & Truckstop load booking",
      "Aggressive rate negotiation & broker credit check",
      "All broker setup packets & paperwork completed",
      "Factoring invoicing & detention/layover billing",
      "24/7 live driver support & route planning",
      "Cancel anytime — zero lock-in contracts",
    ],
    ctaText: "Start With 6% Plan",
  },
  {
    name: "Weekly Flat Fee",
    subtitle: "Predictable Fleet Cost",
    price: "$299",
    priceDetail: "per truck / week",
    description: "Fixed predictable weekly dispatch cost regardless of how high your gross revenue is.",
    badge: "Best Value for Fleets",
    isPopular: false,
    features: [
      "Fixed predictable weekly fee (no percentage taken)",
      "High volume lane booking & round-trip optimization",
      "Dedicated senior dispatcher with 24/7 direct cell access",
      "Amazon Relay block management & spot booking",
      "Complete back-office & billing administration",
      "Direct broker negotiations & rate confirmation auditing",
      "Detention, layover & TONU claim processing",
      "Multi-truck fleet discount available for 3+ trucks",
    ],
    ctaText: "Start With Flat Fee Plan",
  },
];

export const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Quick Documentation",
    description: "Send us your MC/DOT authority, Certificate of Insurance (COI), W-9, and Factoring NOA.",
  },
  {
    step: "02",
    title: "Sign Dispatch Agreement",
    description: "Review and sign our transparent, non-exclusive carrier dispatch agreement. Zero lock-ins.",
  },
  {
    step: "03",
    title: "Set Preferences & Lanes",
    description: "Tell your dedicated dispatcher your target RPM, preferred driving regions, and schedule.",
  },
  {
    step: "04",
    title: "Start Rolling & Earning",
    description: "We source top loads, negotiate highest rates, book upon approval, and manage paperwork.",
  },
];

export const WHY_CHOOSE_POINTS = [
  "You Choose the Locations you Desire to Move (100% No Forced Dispatch)",
  "We Deal Hard For Efficient Delivering Rates & Maximum Revenue Per Mile",
  "Our experienced dispatchers focus on booking loads ahead with destinations while negotiating the best rates for active day bookings",
  "We also take care of your documentation segment while ensuring quick availability of documents such as filling Carrier Packets and Factoring submissions to contribute to your success.",
];

export const FAQS = [
  {
    question: "Do you have forced dispatch?",
    answer: "No, never! Unique Dispatch operates on a strict 100% NO FORCED DISPATCH policy. You have complete authority to accept or decline any load, lane, or rate presented to you.",
  },
  {
    question: "Do you specialize in Amazon Relay dispatching?",
    answer: "Yes, Amazon Relay operations are one of our core specialties. We handle middle-mile spot booking, Post-A-Truck (PAT), short/long-term block bookings, check-in support, and ROC delay dispute handling.",
  },
  {
    question: "What documents do I need to start?",
    answer: "You only need 4 standard carrier documents: 1) Active MC/DOT Authority Certificate, 2) Certificate of Insurance (COI), 3) Signed W-9 Form, and 4) Factoring Notice of Assignment (NOA).",
  },
  {
    question: "Who is the business owner and how can I verify your company?",
    answer: "Unique Dispatch is founded and directed by Marven Awad. Our registered physical office is located at Khaled Ibn El-Walid St., off El-Geish St. - Miami, Awal El-Montazah, Alexandria 21614, Egypt. You can contact Marven Awad directly at +1 (332) 244-5532 or marvengerges2008@gmail.com / uniquedispatchh@gmail.com.",
  },
  {
    question: "How do dispatch payments work?",
    answer: "We send you a transparent weekly invoice based on completed loads. For percentage plans (6%), fees are calculated strictly on gross dispatched revenue. For flat plans, it's $299/truck weekly. We accept Wire, ACH, and Payoneer.",
  },
];
