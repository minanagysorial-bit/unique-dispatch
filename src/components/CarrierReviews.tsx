"use client";

import React from "react";
import { Star, CheckCircle, Quote, Truck } from "lucide-react";

export default function CarrierReviews() {
  const reviews = [
    {
      name: "Marcus Rodriguez",
      company: "RoadStar Logistics LLC",
      location: "Dallas, Texas",
      equipment: "53' Dry Van (2 Trucks)",
      grossBoost: "$9,200/wk avg",
      quote:
        "Unique Dispatch changed our business completely. Before joining them, brokers were lowballing us at $2.10/mi. Marven and his dispatch team consistently get us $2.90 - $3.40/mi lanes and keep our trucks running with zero deadhead.",
      rating: 5,
    },
    {
      name: "Dmitri Volkov",
      company: "Apex Cold Haul LLC",
      location: "Chicago, Illinois",
      equipment: "53' Reefer",
      grossBoost: "$11,400/wk avg",
      quote:
        "As an owner-operator with a reefer, detention and lumper fees used to be my biggest headache. Unique Dispatch handles all paperwork, calls the brokers for detention immediately, and books my next load before I even unload.",
      rating: 5,
    },
    {
      name: "James Thornton",
      company: "JT Expedited Express",
      location: "Atlanta, Georgia",
      equipment: "26ft Box Truck & Amazon Relay",
      grossBoost: "$6,800/wk avg",
      quote:
        "Their Amazon Relay knowledge is unmatched. They booked recurring blocks that give me predictable weekly revenue and handled two ROC delay claims where Amazon compensated us in full. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-orange-600 font-extrabold text-sm uppercase tracking-widest">
            Carrier Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight">
            TRUSTED BY <span className="text-orange-600">CARRIERS NATIONWIDE</span>
          </h2>
          <p className="text-slate-600 text-base">
            See how owner-operators and fleet owners maximize their weekly gross with our dedicated dispatch desk.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                {/* Top Rating & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-orange-200 group-hover:text-orange-500 transition-colors" />
                </div>

                {/* Quote Text */}
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              {/* Driver & Carrier Info */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-[#0f172a] text-sm">{review.name}</h4>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{review.company}</p>
                  <p className="text-[11px] text-slate-400">{review.location} • {review.equipment}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 block">
                    {review.grossBoost}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
