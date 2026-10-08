"use client";

import React, { useState, useEffect } from "react";
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
  Edit3,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Load, MilestoneType } from "@/lib/portal-types";
import {
  CustomTemplate,
  getSavedTemplates,
  renderTemplateWithLoad,
  buildWhatsAppLink,
} from "@/lib/custom-templates";
import TemplateEditorModal from "./TemplateEditorModal";

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
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "openphone" | "manual">("sms");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Load templates on open and match corresponding milestone
  useEffect(() => {
    if (isOpen) {
      const all = getSavedTemplates();
      setTemplates(all);

      // Find template matching current milestone
      const matched = all.find((t) => t.milestoneKey === milestone) || all[0];
      if (matched) {
        setSelectedTemplateId(matched.id);
      }
    }
  }, [isOpen, milestone]);

  if (!isOpen) return null;

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const renderedMessage = currentTemplate ? renderTemplateWithLoad(currentTemplate.templateText, load) : "";
  const whatsappUrl = buildWhatsAppLink(load.driverPhone, renderedMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderedMessage);
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
          messageContent: renderedMessage,
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

  const handleTemplatesUpdated = (newTemplates: CustomTemplate[]) => {
    setTemplates(newTemplates);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Modal Header */}
          <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">
                  {currentTemplate?.name || "Driver Milestone Dispatch"}
                </h3>
                <p className="text-xs text-slate-400">
                  Load: <strong className="text-orange-400 font-mono">{load.vrid}</strong> | Driver: {load.driverName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                title="Edit and customize this template"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>Edit Template</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-sm">
            
            {/* Driver Quick Badge */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-600" />
                <span>
                  Driver Phone: <strong className="text-slate-900 font-mono">{load.driverPhone}</strong>
                </span>
              </div>
              <div>
                Tractor / Trailer: <strong className="text-slate-900">{load.tractorNumber} / {load.trailerNumber}</strong>
              </div>
            </div>

            {/* Template Selector Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-600" />
                  <span>Select Message Template:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline"
                >
                  + Add / Edit Templates
                </button>
              </div>

              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isDefault ? "(System)" : "(Custom)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            {currentTemplate?.description && (
              <p className="text-xs text-slate-600 bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">
                {currentTemplate.description}
              </p>
            )}

            {/* Rendered Template Content Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Auto-Populated Dispatch Message</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied! ✓" : "Copy Message"}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={renderedMessage}
                rows={7}
                className="w-full font-mono text-xs p-3.5 rounded-xl bg-slate-900 text-emerald-300 border border-slate-700 leading-relaxed focus:outline-none select-all"
              />
            </div>

            {/* Communication Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Audit Trail Channel:</label>
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
              href={whatsappUrl}
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
                <span>{isSubmitting ? "Logging..." : "Confirm & Log Sent"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Embedded Template Editor Modal */}
      {isEditorOpen && (
        <TemplateEditorModal
          isOpen={isEditorOpen}
          initialTemplateId={selectedTemplateId}
          onClose={() => setIsEditorOpen(false)}
          onTemplatesUpdated={handleTemplatesUpdated}
        />
      )}
    </>
  );
}
