"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  AlertCircle,
  KeyRound,
  Zap,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@uniquedispatch.com");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (roleEmail: string) => {
    setEmail(roleEmail);
    handleLogin(null as any, roleEmail);
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block focus:outline-none mb-2">
            <Logo variant="light" size="md" />
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Operations Management Portal
          </h1>
          <p className="text-xs text-slate-400">
            Secure Role-Based Access for Dispatchers &amp; Management
          </p>
        </div>

        {/* Quick Demo Role Switcher */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span>1-Click Role Login:</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("admin@uniquedispatch.com")}
              className="p-2.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Marven Awad</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("dispatcher@uniquedispatch.com")}
              className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                <Truck className="w-3.5 h-3.5" />
                <span>Dispatcher</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Alex Reed (Day)</p>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 uppercase tracking-wider">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@uniquedispatch.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 uppercase tracking-wider">Password</label>
              <span className="text-[10px] text-orange-400">Default: any text for demo</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Dispatch Operations"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <Link href="/" className="text-xs text-slate-400 hover:text-orange-400 transition-colors">
            ← Return to Public Website
          </Link>
        </div>

      </div>

    </div>
  );
}
