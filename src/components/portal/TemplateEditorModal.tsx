"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  Eye,
  Layers,
  Copy,
  Info,
  Tag,
} from "lucide-react";
import {
  CustomTemplate,
  DEFAULT_TEMPLATES,
  TEMPLATE_VARIABLES,
  getSavedTemplates,
  saveTemplates,
  renderTemplateWithLoad,
} from "@/lib/custom-templates";
import { Load } from "@/lib/portal-types";

// Mock load for live preview
const PREVIEW_SAMPLE_LOAD: Load = {
  id: "preview-load",
  vrid: "VRID-9482710",
  source: "amazon_relay",
  equipment: "Dry Van (53')",
  rateUSD: 3450,
  weightLbs: 38500,
  originCity: "Staten Island",
  originState: "NY",
  originFacilityCode: "JFK8",
  pickupTime: new Date(Date.now() + 2.5 * 3600 * 1000).toISOString(),
  destCity: "Joliet",
  destState: "IL",
  destFacilityCode: "MDW2",
  deliveryTime: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
  driverName: "Marcus Holloway",
  driverPhone: "+1 (312) 555-0192",
  tractorNumber: "UD-104",
  trailerNumber: "TR-5389",
  carrierName: "Apex Logistics LLC",
  carrierMcDot: "MC-1092834",
  status: "upcoming",
  currentShift: "morning",
  assignedDispatcherId: "usr-disp-01",
  assignedDispatcherName: "Alex Reed",
  pickupCheckinSent: false,
  deliveryCheckinSent: false,
  isCriticalAlert: false,
  hasActiveIncident: false,
  incidentCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesUpdated?: (templates: CustomTemplate[]) => void;
  initialTemplateId?: string;
}

export default function TemplateEditorModal({
  isOpen,
  onClose,
  onTemplatesUpdated,
  initialTemplateId,
}: TemplateEditorModalProps) {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      const loaded = getSavedTemplates();
      setTemplates(loaded);
      const targetId = initialTemplateId && loaded.some((t) => t.id === initialTemplateId)
        ? initialTemplateId
        : loaded[0]?.id || "";
      selectTemplate(targetId, loaded);
    }
  }, [isOpen, initialTemplateId]);

  if (!isOpen) return null;

  const selectTemplate = (id: string, list = templates) => {
    const found = list.find((t) => t.id === id);
    if (found) {
      setActiveTemplateId(found.id);
      setName(found.name);
      setDescription(found.description || "");
      setTemplateText(found.templateText);
      setSavedSuccess(false);
    }
  };

  const handleInsertVariable = (variableTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setTemplateText((prev) => prev + " " + variableTag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = templateText;

    const newVal = currentVal.substring(0, start) + variableTag + currentVal.substring(end);
    setTemplateText(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableTag.length, start + variableTag.length);
    }, 50);
  };

  const handleSaveTemplate = () => {
    if (!name.trim() || !templateText.trim()) return;

    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return {
          ...t,
          name: name.trim(),
          description: description.trim(),
          templateText: templateText.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTemplates(updated);
    saveTemplates(updated);
    if (onTemplatesUpdated) onTemplatesUpdated(updated);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddNewTemplate = () => {
    const newId = `tpl-custom-${Date.now()}`;
    const newTpl: CustomTemplate = {
      id: newId,
      name: "قالب رسالة مخصص جديد (Custom Template)",
      category: "custom",
      description: "رسالة مخصصة لعمليات الدسباتش والمتابعة مع السائقين",
      templateText: `📢 UNIQUE DISPATCH NOTICE\nHey {driverName}, update for Load #{vrid}.\n\nPlease note: {originCity} -> {destCity}.\nReply to confirm.`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...templates, newTpl];
    setTemplates(updated);
    saveTemplates(updated);
    selectTemplate(newId, updated);
    if (onTemplatesUpdated) onTemplatesUpdated(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;

    if (tpl.isDefault) {
      alert("لا يمكن حذف القوالب الأساسية للنظام، يمكنك فقط تعديل نصها وتثبيته حسب رغبتك.");
      return;
    }

    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    if (updated.length > 0) {
      selectTemplate(updated[0].id, updated);
    }
    if (onTemplatesUpdated) onTemplatesUpdated(updated);
  };

  const handleResetToDefaults = () => {
    if (confirm("هل أنت متأكد من استعادة جميع القوالب إلى النصوص الافتراضية الأصلية؟")) {
      setTemplates(DEFAULT_TEMPLATES);
      saveTemplates(DEFAULT_TEMPLATES);
      selectTemplate(DEFAULT_TEMPLATES[0].id, DEFAULT_TEMPLATES);
      if (onTemplatesUpdated) onTemplatesUpdated(DEFAULT_TEMPLATES);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const activeTemplate = templates.find((t) => t.id === activeTemplateId);
  const previewRendered = renderTemplateWithLoad(templateText, PREVIEW_SAMPLE_LOAD);

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewRendered);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">مدير قوالب الرسائل الجاهزة (Message Templates)</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-600/30 border border-orange-500/40 text-[10px] font-bold text-orange-400">
                  تعديل وتثبيت
                </span>
              </div>
              <p className="text-xs text-slate-400">
                عدّل نصوص الرسائل واثبتها مرة واحدة لتنسخها فوراً، أو أضف قوالب جديدة مخصصة مع المتغيرات الذكية.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: 2 Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          
          {/* Left Column: Template List */}
          <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
            
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-600" />
                <span>القوالب المتاحة ({templates.length})</span>
              </span>

              <button
                type="button"
                onClick={handleAddNewTemplate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ قالب جديد</span>
              </button>
            </div>

            {/* Template List Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-50">
              {templates.map((tpl) => {
                const isSelected = tpl.id === activeTemplateId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-orange-50/80 border-orange-400 shadow-sm ring-1 ring-orange-500/20"
                        : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <p className={`text-xs font-black line-clamp-1 ${isSelected ? "text-orange-950" : "text-slate-900"}`}>
                        {tpl.name}
                      </p>
                      {tpl.isDefault ? (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                          افتراضي
                        </span>
                      ) : (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                          مخصص
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                      {tpl.description || "قالب رسالة جاهز"}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Reset to Defaults Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 text-[11px] font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة القوالب الافتراضية للأصل</span>
              </button>
            </div>

          </div>

          {/* Right Column: Template Editor & Live Preview */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            
            {/* Editor Header Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex-1 min-w-[240px]">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">اسم القالب (Template Name)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: رسالة قبل التحميل بـ 3.5 ساعات"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none mt-1"
                  />
                </div>

                {activeTemplate && !activeTemplate.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(activeTemplate.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold border border-red-200 transition-colors self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف هذا القالب</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">وصف القالب / التوقيت الموصى به</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: يرسل قبل موعد التحميل للتأكد من جاهزية السائق"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none mt-1"
                />
              </div>
            </div>

            {/* Smart Variables Selector Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/60 to-amber-50/60 border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>انقر لإدراج المتغيرات الذكية داخل نص الرسالة (Click to Insert):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  يتم استبدال المتغير تلقائياً ببيانات الشحنة والسائق
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    title={`مثال: ${v.example}`}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-600 hover:text-white border border-orange-200 text-slate-800 text-[11px] font-mono font-bold transition-all shadow-xs flex items-center gap-1 group"
                  >
                    <Tag className="w-3 h-3 text-orange-500 group-hover:text-white" />
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-orange-100 font-sans">
                      ({v.label.split(" ")[0]})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Monospace Editor Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>نص القالب (Template Body)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  استخدم المتغيرات بين أقواس مثل: <code className="text-orange-600 bg-orange-50 px-1 py-0.5 rounded">&#123;driverName&#125;</code>
                </span>
              </label>

              <textarea
                ref={textareaRef}
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                rows={7}
                placeholder="اكتب نص الرسالة هنا مع المتغيرات..."
                className="w-full font-mono text-xs p-4 rounded-2xl bg-slate-900 text-emerald-300 border border-slate-700 leading-relaxed focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {/* Live Preview Box */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>معاينة الرسالة الحية على شحنة تجريبية (Live Dynamic Preview):</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-bold shadow-xs transition-colors"
                >
                  {copiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPreview ? "تم النسخ!" : "نسخ المعاينة"}</span>
                </button>
              </div>

              <div className="font-mono text-xs p-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {previewRendered}
              </div>
            </div>

            {/* Save Action Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {savedSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ وتثبيت القالب بنجاح في النظام! جاهز للاستخدام الدائم.</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  احفظ القالب لتثبيته في النظام لجميع عمليات النسخ والإرسال القادمة.
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>تثبيت وحفظ القالب (Save Template)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
