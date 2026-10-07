"use client";

import React from "react";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export default function Logo({ variant = "dark", size = "md" }: LogoProps) {
  const isLight = variant === "light";

  const sizeClasses = {
    sm: { icon: "w-8 h-8", text: "text-lg", sub: "text-[9px]" },
    md: { icon: "w-10 h-10", text: "text-xl", sub: "text-[10px]" },
    lg: { icon: "w-12 h-12", text: "text-2xl", sub: "text-xs" },
  }[size];

  return (
    <div className="flex items-center gap-3 select-none group">
      {/* Sleek Geometric Modern Logistics Icon */}
      <div className={`relative ${sizeClasses.icon} rounded-xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-0.5 shadow-md group-hover:shadow-orange-500/20 group-hover:scale-105 transition-all duration-300`}>
        <div className="w-full h-full bg-[#0a1128] rounded-[10px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle Orange Glow Accent in Corner */}
          <div className="absolute top-0 right-0 w-4 h-4 bg-orange-500/30 blur-[4px] rounded-full"></div>
          
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 transform group-hover:rotate-[-2deg] transition-transform"
          >
            {/* Dynamic Speed Lines */}
            <path
              d="M6 14H18"
              stroke="#EA580C"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M4 20H14"
              stroke="#EA580C"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M8 26H16"
              stroke="#EA580C"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Stylized Modern Truck / Wing Silhouette */}
            <path
              d="M16 11L26 11C27.5 11 28.8 12.1 29.1 13.5L31.5 22.5C31.8 23.4 32.7 24 33.7 24H35C35.6 24 36 24.4 36 25V28C36 28.6 35.6 29 35 29H16V11Z"
              fill="#FFFFFF"
            />
            {/* Front Windshield / Aerodynamic slope */}
            <path
              d="M26 14H28.2L30.1 20H26V14Z"
              fill="#0A1128"
            />
            {/* Truck Wheels with Orange Center */}
            <circle cx="20" cy="29" r="3" fill="#EA580C" />
            <circle cx="20" cy="29" r="1.5" fill="#FFFFFF" />
            <circle cx="31" cy="29" r="3" fill="#EA580C" />
            <circle cx="31" cy="29" r="1.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center tracking-tight">
          <span className={`font-black ${sizeClasses.text} ${isLight ? "text-white" : "text-[#0f172a]"}`}>
            UNIQUE
          </span>
          <span className={`font-black ${sizeClasses.text} text-orange-600 ml-1.5`}>
            DISPATCH
          </span>
        </div>
        <span className={`font-bold uppercase tracking-widest mt-0.5 ${sizeClasses.sub} ${isLight ? "text-slate-400" : "text-slate-500"}`}>
          US Freight &amp; Amazon Relay
        </span>
      </div>
    </div>
  );
}
