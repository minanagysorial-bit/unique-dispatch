"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  CheckCircle2,
  Info,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both your corporate email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setError(data.error || "Invalid corporate credentials or unauthorized account.");
      }
    } catch (err) {
      setError("Secure gateway connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      
      {/* Dynamic Background Security Mesh */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Login Box */}
        <div className="bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
          
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block focus:outline-none mb-1">
              <Logo variant="light" size="md" />
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-orange-400">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Enterprise Operations Gateway</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sign In to Portal
            </h1>
            <p className="text-xs text-slate-400">
              Role permissions are securely authenticated from your verified profile.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@uniquedispatch.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none text-xs transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Encrypted Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none text-xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 hover:shadow-orange-900/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Security Protocols Footnote */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>PBKDF2-SHA512 Salted • HMAC Session • Rate Limited</span>
          </div>

          <div className="text-center pt-1">
            <Link href="/" className="text-xs text-slate-400 hover:text-orange-400 transition-colors font-medium">
              ← Return to Public Website
            </Link>
          </div>

        </div>

        {/* Authorized Access Guide Toggle */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-3.5">
          <button
            type="button"
            onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-orange-400" />
              <span>Authorized System Accounts (For Verification)</span>
            </div>
            <span className="text-[10px] text-orange-400 underline">
              {showCredentialsHelp ? "Hide" : "View"}
            </span>
          </button>

          {showCredentialsHelp && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-[11px] animate-in fade-in">
              <div
                onClick={() => handleFillCredentials("admin@uniquedispatch.com", "UniqueAdmin2026!")}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-orange-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-orange-400">Super Admin</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-300 font-bold">Full Access</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">admin@uniquedispatch.com</p>
                  <p className="text-[10px] text-slate-500 font-mono">Password: UniqueAdmin2026!</p>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-orange-400 font-bold">Use →</span>
              </div>

              <div
                onClick={() => handleFillCredentials("dispatcher@uniquedispatch.com", "Dispatch2026!")}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-blue-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-blue-400">Dispatcher (Alex Reed)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 font-bold">Day Shift</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">dispatcher@uniquedispatch.com</p>
                  <p className="text-[10px] text-slate-500 font-mono">Password: Dispatch2026!</p>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-blue-400 font-bold">Use →</span>
              </div>

              <p className="text-[9px] text-slate-500 text-center pt-1">
                Clicking an account fills the email &amp; cryptographic password for instant verification.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
