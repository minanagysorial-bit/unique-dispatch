"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Load, MilestoneType } from "@/lib/portal-types";
import { generateMilestoneTemplate } from "@/lib/message-templates";

interface MilestoneMessageModalProps {
  load: Load;
  milestone: MilestoneType;
  isOpen: boolean;
  onClose: () => void;
  onLoggedSuccess: (updatedLoad: Load) => void;
}

export default function MilestoneMessageModal({
  load,
  milestone,
  isOpen,
  onClose,
  onLoggedSuccess,
}: MilestoneMessageModalProps) {
  const [copied, setCopied] = useState(false);
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "openphone" | "manual">("sms");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const template = generateMilestoneTemplate(load, milestone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.smsContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogMessageSent = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/loads/milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadId: load.id,
          milestone,
          messageContent: template.smsContent,
          channel,
        }),
      });

      if (res.ok) {
        // Fetch updated load
        const loadRes = await fetch(`/api/loads/${load.id}`);
        const loadData = await loadRes.json();
        if (loadData.load) {
          onLoggedSuccess(loadData.load);
        }
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">{template.title}</h3>
              <p className="text-xs text-slate-400">
                Load: <strong className="text-orange-400">{load.vrid}</strong> | Driver: {load.driverName}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-sm">
          
          {/* Driver Quick Badge */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <span>
                Driver Phone: <strong className="text-slate-900">{load.driverPhone}</strong>
              </span>
            </div>
            <div>
              Tractor / Trailer: <strong className="text-slate-900">{load.tractorNumber} / {load.trailerNumber}</strong>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200">
            {template.description}
          </p>

          {/* Template Content Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>Auto-Populated Message Template</span>
              </label>
              
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Template"}</span>
              </button>
            </div>

            <textarea
              readOnly
              value={template.smsContent}
              rows={7}
              className="w-full font-mono text-xs p-3.5 rounded-xl bg-slate-900 text-emerald-300 border border-slate-700 leading-relaxed focus:outline-none select-all"
            />
          </div>

          {/* Communication Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Sent via Channel:</label>
            <div className="grid grid-cols-4 gap-2">
              {(["sms", "whatsapp", "openphone", "manual"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                    channel === ch
                      ? "bg-[#0f172a] text-white border-[#0f172a]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Direct WhatsApp Launch */}
          <a
            href={template.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Launch WhatsApp Web</span>
          </a>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleLogMessageSent}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Logging..." : "Confirm & Log Message Sent"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
