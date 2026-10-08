"use client";

import React, { useState } from "react";
import {
  X,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  Key,
  ExternalLink,
  Code,
  Terminal,
} from "lucide-react";
import { DEFAULT_API_KEY } from "@/lib/auth-utils";

interface ChromeExtensionGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChromeExtensionGuide({
  isOpen,
  onClose,
}: ChromeExtensionGuideProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const extensionScript = `// ==UserScript==
// @name         Unique Dispatch - Amazon Relay Sync Extension
// @namespace    https://uniquedispatcher.com/
// @version      1.0
// @description  Safely export active Amazon Relay tours directly to Unique Dispatch Operations Board
// @match        https://relay.amazon.com/tours/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
  'use strict';

  const SYNC_ENDPOINT = "https://uniquedispatcher.com/api/loads/sync"; // Or http://localhost:3000/api/loads/sync
  const API_KEY = "${DEFAULT_API_KEY}";

  // Extract active tours from DOM without scraping bans
  function extractActiveTours() {
    const tourCards = document.querySelectorAll('[data-testid="tour-card"], .tour-item-row');
    const loads = [];

    tourCards.forEach(card => {
      try {
        const vrid = card.querySelector('[data-testid="vrid"], .vrid-text')?.innerText?.trim();
        const origin = card.querySelector('.origin-city')?.innerText?.trim() || "New York, NY";
        const dest = card.querySelector('.dest-city')?.innerText?.trim() || "Chicago, IL";
        const rate = parseFloat(card.querySelector('.payout-amount')?.innerText?.replace(/[^0-9.]/g, '') || "3200");

        if (vrid) {
          loads.push({
            vrid,
            source: "amazon_relay",
            originCity: origin.split(",")[0]?.trim() || origin,
            originState: origin.split(",")[1]?.trim() || "NY",
            destCity: dest.split(",")[0]?.trim() || dest,
            destState: dest.split(",")[1]?.trim() || "IL",
            pickupTime: new Date(Date.now() + 2.5 * 3600 * 1000).toISOString(),
            deliveryTime: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
            rateUSD: rate,
            equipment: "Dry Van (53')",
            driverName: "Amazon Relay Assigned",
            driverPhone: "+1 (555) 019-2834",
            tractorNumber: "UD-RELAY",
            trailerNumber: "TR-5388"
          });
        }
      } catch (e) { console.error("Extract tour error", e); }
    });

    if (loads.length > 0) {
      fetch(SYNC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-unique-dispatch-key": API_KEY
        },
        body: JSON.stringify({
          source: "chrome_extension_amazon_relay",
          loads: loads
        })
      }).then(r => r.json()).then(res => {
        alert("✅ Unique Dispatch: Synced " + loads.length + " Amazon Relay tours!");
      }).catch(err => alert("Sync failed: " + err.message));
    }
  }

  // Add 1-Click Sync Button to Relay Header
  const btn = document.createElement("button");
  btn.innerText = "⚡ Sync to Unique Dispatch";
  btn.style = "position:fixed;top:10px;right:220px;z-index:99999;background:#ea580c;color:white;padding:8px 16px;border-radius:8px;font-weight:bold;border:none;cursor:pointer;";
  btn.onclick = extractActiveTours;
  document.body.appendChild(btn);
})();`;

  const copyKey = () => {
    navigator.clipboard.writeText(DEFAULT_API_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(extensionScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Amazon Relay Client-Side Ingestion Architecture</h3>
              <p className="text-xs text-slate-400">Safe, authenticated data synchronization without bot detection or IP blocks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs">
          
          {/* Security Architecture Card */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Anti-Ban / Zero-Scrape Architecture</span>
            </div>
            <p className="text-xs leading-relaxed">
              To prevent Amazon Relay account suspensions caused by unauthorized headless crawlers or cloud scraping IPs, Unique Dispatch ingests load data <strong>from the dispatcher&apos;s active browser session</strong> via a lightweight extension / bookmarklet.
            </p>
          </div>

          {/* API Key Box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" />
              <span>Dedicated Sync API Key</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={DEFAULT_API_KEY}
                className="flex-1 px-3.5 py-2 font-mono text-xs rounded-xl bg-slate-900 text-amber-300 border border-slate-700 select-all"
              />
              <button
                type="button"
                onClick={copyKey}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
              </button>
            </div>
          </div>

          {/* Script Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-orange-600" />
                <span>Tampermonkey / Chrome Extension Content Script</span>
              </label>

              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied Script!" : "Copy Script"}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={10}
              value={extensionScript}
              className="w-full p-3.5 font-mono text-[11px] rounded-xl bg-slate-900 text-slate-200 border border-slate-700 focus:outline-none leading-relaxed select-all"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
