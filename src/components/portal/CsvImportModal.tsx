"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import { EquipmentType, ShiftType } from "@/lib/portal-types";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: CsvImportModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [shift, setShift] = useState<ShiftType>("morning");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const sampleJson = `[
  {
    "vrid": "VRID-9921401",
    "source": "amazon_relay",
    "equipment": "Dry Van (53')",
    "rateUSD": 3850,
    "weightLbs": 39000,
    "originCity": "Baltimore",
    "originState": "MD",
    "originFacilityCode": "BWI2",
    "pickupTime": "${new Date(Date.now() + 3 * 3600 * 1000).toISOString()}",
    "destCity": "Columbus",
    "destState": "OH",
    "destFacilityCode": "CMH1",
    "deliveryTime": "${new Date(Date.now() + 18 * 3600 * 1000).toISOString()}",
    "driverName": "Sergei Orlov",
    "driverPhone": "+1 (410) 555-0812",
    "tractorNumber": "UD-190",
    "trailerNumber": "TR-4491"
  }
]`;

  const handleSampleFill = () => {
    setJsonInput(sampleJson);
    setMessage(null);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      let parsed = [];
      // Support JSON format
      if (jsonInput.trim().startsWith("[")) {
        parsed = JSON.parse(jsonInput);
      } else {
        // Simple CSV parser
        const lines = jsonInput.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/['"]/g, ""));
        
        parsed = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = vals[idx];
          });
          return {
            vrid: row.vrid || row.VRID || `VRID-${Math.floor(1000000 + Math.random() * 9000000)}`,
            originCity: row.originCity || row.OriginCity || "Chicago",
            originState: row.originState || row.OriginState || "IL",
            destCity: row.destCity || row.DestCity || "Dallas",
            destState: row.destState || row.DestState || "TX",
            pickupTime: row.pickupTime || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
            deliveryTime: row.deliveryTime || new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
            driverName: row.driverName || "Assigned Driver",
            driverPhone: row.driverPhone || "+1 (555) 019-2834",
            tractorNumber: row.tractorNumber || "UD-TBD",
            trailerNumber: row.trailerNumber || "TR-TBD",
            rateUSD: Number(row.rateUSD) || 3000,
            equipment: (row.equipment as EquipmentType) || "Dry Van (53')",
          };
        });
      }

      const res = await fetch("/api/loads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift,
          loads: parsed,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Success: Imported ${data.result?.synced || parsed.length} loads into the operations board!`,
        });
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to import loads." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Invalid JSON or CSV format: " + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Structured Load Ingestion (CSV / JSON)</h3>
              <p className="text-xs text-slate-400">Import rate confirmations, Amazon Relay tours, or broker batches</p>
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
        <form onSubmit={handleImportSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          
          {message && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-red-50 border-red-300 text-red-900"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase tracking-wider">Paste JSON or CSV Content</span>
            <button
              type="button"
              onClick={handleSampleFill}
              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insert Sample JSON</span>
            </button>
          </div>

          <textarea
            required
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON array or CSV text here with fields: vrid, originCity, originState, destCity, destState, pickupTime, deliveryTime, driverName, driverPhone..."
            className="w-full p-3.5 font-mono text-xs rounded-xl bg-slate-900 text-emerald-300 border border-slate-700 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Assign to Shift:</span>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
              >
                <option value="morning">Morning Shift</option>
                <option value="night">Night Shift</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !jsonInput.trim()}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Importing..." : "Ingest Loads"}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
