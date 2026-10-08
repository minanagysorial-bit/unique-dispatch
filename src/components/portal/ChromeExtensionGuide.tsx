"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Key,
  Folder,
  Puzzle,
  Zap,
} from "lucide-react";
import { DEFAULT_API_KEY } from "@/lib/auth-constants";

interface ChromeExtensionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function ChromeExtensionGuide({
  isOpen,
  onClose,
}: ChromeExtensionGuideProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const portalUrl = typeof window !== "undefined" ? window.location.origin : "https://uniquedispatch.com";
  const extensionFolderPath = "extension";

  const copyKey = () => {
    navigator.clipboard.writeText(DEFAULT_API_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0a1128] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                Amazon Relay Sync Engine (Chrome Extension Manifest V3)
              </h3>
              <p className="text-xs text-slate-400">
                100% Anti-Ban Client-Side Ingestion from relay.amazon.com/tours
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs">
          
          {/* Security Architecture Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Zero-Scrape Human Ingestion Architecture (Anti-Ban Guarantee)</span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-900">
              The <strong>Unique Dispatch Sync Engine</strong> operates strictly as a passive listener on the dispatcher&apos;s authenticated browser session. It does NOT generate synthetic bot clicks, does NOT spam Amazon endpoints, and does NOT trigger PerimeterX / AWS WAF security checks.
            </p>
          </div>

          {/* Quick Credentials & Connection Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-600" />
                  <span>Enterprise Sync Key</span>
                </span>
                <button
                  onClick={copyKey}
                  className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                </button>
              </div>
              <p className="font-mono font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 text-xs select-all">
                {DEFAULT_API_KEY}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-orange-600" />
                  <span>Portal Webhook URL</span>
                </span>
                <button
                  onClick={copyUrl}
                  className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>
              <p className="font-mono font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200 text-xs select-all truncate">
                {portalUrl}
              </p>
            </div>
          </div>

          {/* 3-Step Installation Guide */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-slate-950 flex items-center gap-2">
              <Folder className="w-4 h-4 text-orange-600" />
              <span>3-Step Quick Installation Guide</span>
            </h4>

            <div className="space-y-2.5">
              
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    Open Extensions in Chrome, Edge, or Brave
                  </p>
                </div>
                <p className="text-slate-600 pl-8 text-xs">
                  Type <code className="bg-slate-100 text-orange-700 px-1.5 py-0.5 rounded font-mono font-bold">chrome://extensions</code> in your browser address bar and turn <strong>ON</strong> the <strong className="text-slate-900">&quot;Developer mode&quot;</strong> toggle in the top-right corner.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    Click &quot;Load unpacked&quot; and Select the <code className="text-orange-600 font-mono">{extensionFolderPath}</code> Folder
                  </p>
                </div>
                <p className="text-slate-600 pl-8 text-xs">
                  Click the <strong>&quot;Load unpacked&quot;</strong> button in the top-left corner, navigate to your Unique Dispatch project directory, and select the <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">{extensionFolderPath}</code> folder.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    Open Amazon Relay &amp; Enjoy Continuous Automated Sync!
                  </p>
                </div>
                <p className="text-slate-600 pl-8 text-xs">
                  Log into <a href="https://relay.amazon.com/tours" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold hover:underline">https://relay.amazon.com/tours</a>. A green floating pill <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-bold">UD Sync: Active 🟢</code> will appear in the bottom-right corner, automatically sending your tour schedules to the operations board every 60 seconds!
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
