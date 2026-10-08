"use client";

import React, { useState } from "react";
import {
  X,
  ArrowRightLeft,
  Sun,
  Moon,
  Clock,
  CheckSquare,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import { ShiftType, Load } from "@/lib/portal-types";

interface ShiftHandoverModalProps {
  currentShift: ShiftType;
  loads: Load[];
  isOpen: boolean;
  onClose: () => void;
  onHandoverComplete: () => void;
}

export default function ShiftHandoverModal({
  currentShift,
  loads,
  isOpen,
  onClose,
  onHandoverComplete,
}: ShiftHandoverModalProps) {
  const incomingShift: ShiftType = currentShift === "morning" ? "night" : "morning";

  const [toShift, setToShift] = useState<ShiftType>(incomingShift);
  const [generalNotes, setGeneralNotes] = useState("");
  const [watchItems, setWatchItems] = useState<string[]>([
    "Verify pickup check-in for overnight Amazon Relay block bookings",
    "Monitor active breakdown/detention tickets with brokers",
  ]);
  const [newItemText, setNewItemText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeLoadsCount = loads.filter(
    (l) => l.currentShift === currentShift && l.status !== "delivered"
  ).length;

  const criticalLoadsCount = loads.filter(
    (l) =>
      l.currentShift === currentShift &&
      (l.isCriticalAlert || l.hasActiveIncident || l.status === "critical_alert" || l.status === "delayed")
  ).length;

  const handleAddWatchItem = () => {
    if (!newItemText.trim()) return;
    setWatchItems([...watchItems, newItemText.trim()]);
    setNewItemText("");
  };

  const handleRemoveWatchItem = (index: number) => {
    setWatchItems(watchItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/shifts/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromShift: currentShift,
          toShift,
          watchItems,
          generalNotes: generalNotes || "Shift handover completed successfully.",
        }),
      });

      if (res.ok) {
        onHandoverComplete();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0a1128] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Shift Handover &amp; Load Transfer</h3>
              <p className="text-xs text-slate-400">
                Transfer active operations from{" "}
                <strong className="text-orange-400 uppercase">{currentShift} SHIFT</strong> to{" "}
                <strong className="text-emerald-400 uppercase">{toShift} SHIFT</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-sm">
          
          {/* Shift Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Loads Transferring</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{activeLoadsCount} Loads</p>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Critical / Action Items</span>
              </p>
              <p className="text-2xl font-black text-red-700 mt-1">{criticalLoadsCount} Watch Items</p>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Handover To Incoming Shift:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setToShift("morning")}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-colors ${
                  toShift === "morning"
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Morning (06-14)</span>
              </button>

              <button
                type="button"
                onClick={() => setToShift("afternoon")}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-colors ${
                  toShift === "afternoon"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Afternoon (14-22)</span>
              </button>

              <button
                type="button"
                onClick={() => setToShift("night")}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-colors ${
                  toShift === "night"
                    ? "bg-indigo-900 text-white border-indigo-950 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night (22-06)</span>
              </button>
            </div>
          </div>

          {/* Watch Items List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
              <span>Priority Watch Items for Incoming Dispatcher</span>
            </label>

            <div className="space-y-2">
              {watchItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWatchItem(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Watch Item Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddWatchItem();
                  }
                }}
                placeholder="Add urgent note (e.g. Call Marcus Holloway at 20:00 for MDW2 gate pass)..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddWatchItem}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* General Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              General Shift Summary &amp; Handoff Notes
            </label>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Summary of completed deliveries, weather disruptions, broker communications, or fuel card notes..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Transferring..." : "Complete Shift Handover"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
