"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface LiveCountdownTimerProps {
  targetTimeIso: string;
  label: "Pickup" | "Delivery";
  status?: string;
}

export default function LiveCountdownTimer({
  targetTimeIso,
  label,
  status,
}: LiveCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
    totalSeconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    totalSeconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetTimeIso).getTime();
      const now = Date.now();
      const diffMs = target - now;

      const isPast = diffMs < 0;
      const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);

      const hours = Math.floor(absDiffSec / 3600);
      const minutes = Math.floor((absDiffSec % 3600) / 60);
      const seconds = absDiffSec % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isPast,
        totalSeconds: Math.floor(diffMs / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTimeIso]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (status === "delivered") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Delivered</span>
      </div>
    );
  }

  // Determine urgency color
  // 1. If past -> Red / Alert
  // 2. If <= 30 mins -> Amber / Urgent
  // 3. Else -> Normal / Active
  let containerStyles = "bg-slate-900 text-white border-slate-700";
  let pulse = false;

  if (timeLeft.isPast) {
    containerStyles = "bg-red-950/90 text-red-200 border-red-500 animate-pulse";
    pulse = true;
  } else if (timeLeft.totalSeconds <= 1800) {
    // Under 30 mins
    containerStyles = "bg-amber-950/90 text-amber-200 border-amber-500 animate-pulse";
    pulse = true;
  } else if (timeLeft.totalSeconds <= 12600) {
    // Under 3.5 hours
    containerStyles = "bg-blue-950/80 text-blue-200 border-blue-600";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold shadow-sm transition-colors ${containerStyles}`}
      title={`Target: ${new Date(targetTimeIso).toLocaleTimeString()}`}
    >
      {timeLeft.isPast ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
      )}

      <span className="text-[10px] uppercase font-sans font-extrabold tracking-wider text-slate-300">
        {timeLeft.isPast ? "OVERDUE" : `TO ${label.toUpperCase()}`}:
      </span>

      <span className="tracking-widest">
        {timeLeft.isPast ? "+" : ""}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}
