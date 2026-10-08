"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  Truck,
  Sun,
  Moon,
  Clock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Sparkles,
  Layers,
} from "lucide-react";
import { User, UserRole, ShiftType, ShiftDefinition } from "@/lib/portal-types";

interface UserManagementModalProps {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  onUserDeleted?: () => void;
}

export default function UserManagementModal({
  users,
  isOpen,
  onClose,
  onUserCreated,
  onUserDeleted,
}: UserManagementModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [role, setRole] = useState<UserRole>("dispatcher");

  // Shift selection
  const [shiftSelectionType, setShiftSelectionType] = useState<"preset" | "custom">("preset");
  const [presetShift, setPresetShift] = useState<string>("morning");
  const [customStartTime, setCustomStartTime] = useState("08:00");
  const [customEndTime, setCustomEndTime] = useState("17:00");
  const [customTimezone, setCustomTimezone] = useState("EST");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Revealed passwords map: { [userId]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion confirmation state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate random password helper
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let generated = "UD-";
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyCredentials = async (user: User) => {
    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "https://uniquedispatch.com/portal/login";
    const pass = user.rawPassword || "Contact Admin";
    const shift = user.shiftTimeRange || `${user.assignedShift || "Standard"} Shift`;

    const credentialsText = `🏢 Unique Dispatch Operations Portal Login Credentials
------------------------------------------------
👤 Name: ${user.name}
📧 Email: ${user.email}
🔑 Password: ${pass}
🏷️ Role: ${user.role.toUpperCase()}
🕒 Shift Hours: ${shift}
🌐 Portal Login URL: ${loginUrl}
------------------------------------------------
Please keep your credentials confidential and do not share your access token.`;

    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopiedId(user.id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopySinglePassword = async (user: User) => {
    const pass = user.rawPassword || "Contact Admin";
    try {
      await navigator.clipboard.writeText(pass);
      setCopiedId(`pwd-${user.id}`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setDeletingUserId(null);
        if (onUserDeleted) onUserDeleted();
        onUserCreated();
      } else {
        setError(data.error || "Failed to delete user account");
      }
    } catch (e) {
      setError("Network error while attempting to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    let finalShift = presetShift;
    let startTime = "06:00";
    let endTime = "14:00";
    let shiftRange = "06:00 AM - 02:00 PM EST";

    if (role === "super_admin") {
      finalShift = "governance";
      shiftRange = "24/7 Super Admin Access";
    } else if (shiftSelectionType === "preset") {
      if (presetShift === "morning") {
        startTime = "06:00";
        endTime = "14:00";
        shiftRange = "06:00 AM - 02:00 PM EST";
      } else if (presetShift === "afternoon") {
        startTime = "14:00";
        endTime = "22:00";
        shiftRange = "02:00 PM - 10:00 PM EST";
      } else if (presetShift === "night") {
        startTime = "22:00";
        endTime = "06:00";
        shiftRange = "10:00 PM - 06:00 AM EST";
      }
    } else {
      finalShift = "custom";
      startTime = customStartTime;
      endTime = customEndTime;
      shiftRange = `${customStartTime} - ${customEndTime} ${customTimezone}`;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || "+1 (332) 244-5532",
          role,
          assignedShift: finalShift,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          shiftTimeRange: shiftRange,
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setSuccessMsg(`✓ Account for ${data.user?.name || "User"} created successfully!`);
        setTimeout(() => setSuccessMsg(""), 4000);
        onUserCreated();
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0a1128] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                Team &amp; Account Governance
              </h3>
              <p className="text-xs text-slate-400">
                Create accounts, view/distribute plain credentials, configure custom shifts &amp; delete accounts
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs">
          
          {/* Notifications */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* New User Creation Form */}
          <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h4 className="font-black text-sm text-slate-950 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-600" />
                <span>Create New User &amp; Assign Shift Hours</span>
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider">
                Instant Provisioning
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Vance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Corporate Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. david@uniquedispatch.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Direct Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (332) 244-5532"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-bold text-xs"
                >
                  <option value="dispatcher">Dispatcher (Trip Ops Board &amp; Milestones)</option>
                  <option value="super_admin">Super Admin (Full Platform Governance)</option>
                </select>
              </div>
            </div>

            {/* Password Creation / Generator */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-600" />
                  <span>Assigned Password</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong Password</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPasswordInput ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === "super_admin" ? "UniqueAdmin2026! (Default)" : "Dispatch2026! (Or auto-generated)"}
                  className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono text-xs bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                  title={showPasswordInput ? "Hide password" : "Show password"}
                >
                  {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                You will be able to view and copy this password anytime from the accounts table to send to the staff member.
              </p>
            </div>

            {/* Shift Assignment (Preset or Custom Hours) */}
            {role === "dispatcher" && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Operational Shift &amp; Working Hours</span>
                  </label>

                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShiftSelectionType("preset")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        shiftSelectionType === "preset"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setShiftSelectionType("custom")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        shiftSelectionType === "custom"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Custom Hours
                    </button>
                  </div>
                </div>

                {shiftSelectionType === "preset" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPresetShift("morning")}
                      className={`p-2.5 rounded-xl font-bold border text-left flex flex-col gap-1 transition-all ${
                        presetShift === "morning"
                          ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Sun className="w-4 h-4" />
                          <span className="font-black text-xs">Morning</span>
                        </div>
                        {presetShift === "morning" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono font-medium">06:00 - 14:00 EST</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetShift("afternoon")}
                      className={`p-2.5 rounded-xl font-bold border text-left flex flex-col gap-1 transition-all ${
                        presetShift === "afternoon"
                          ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-700">
                          <Clock className="w-4 h-4" />
                          <span className="font-black text-xs">Afternoon</span>
                        </div>
                        {presetShift === "afternoon" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono font-medium">14:00 - 22:00 EST</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPresetShift("night")}
                      className={`p-2.5 rounded-xl font-bold border text-left flex flex-col gap-1 transition-all ${
                        presetShift === "night"
                          ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-700">
                          <Moon className="w-4 h-4" />
                          <span className="font-black text-xs">Night</span>
                        </div>
                        {presetShift === "night" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono font-medium">22:00 - 06:00 EST</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Start Time *</label>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">End Time *</label>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Timezone</label>
                      <select
                        value={customTimezone}
                        onChange={(e) => setCustomTimezone(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                        <option value="EST">EST (Eastern)</option>
                        <option value="CST">CST (Central)</option>
                        <option value="MST">MST (Mountain)</option>
                        <option value="PST">PST (Pacific)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? "Creating User..." : "Provision Account"}</span>
              </button>
            </div>
          </form>

          {/* Active Accounts & Credentials Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-700" />
                <span>Active Accounts &amp; Credentials List ({users.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Click credentials button to send login info to dispatchers
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              {users.map((u) => {
                const isPasswordRevealed = revealedPasswords[u.id];
                const rawPass = u.rawPassword || (u.role === "super_admin" ? "UniqueAdmin2026!" : "Dispatch2026!");
                const isCopied = copiedId === u.id;
                const isPwdCopied = copiedId === `pwd-${u.id}`;

                return (
                  <div
                    key={u.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className="w-10 h-10 rounded-xl bg-[#0a1128] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-950 text-sm">{u.name}</p>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              u.role === "super_admin"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {u.role.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs font-mono">{u.email}</p>
                        {u.phone && <p className="text-slate-400 text-[11px]">{u.phone}</p>}
                      </div>
                    </div>

                    {/* Shift Badge */}
                    <div className="flex items-center gap-1.5 min-w-[160px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                        <Clock className="w-3 h-3 text-orange-600" />
                        <span>{u.shiftTimeRange || `${u.assignedShift || "Day"} Shift`}</span>
                      </span>
                    </div>

                    {/* Password Display & Reveal */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Password</span>
                        <span className="font-mono font-bold text-slate-900 text-xs select-all">
                          {isPasswordRevealed ? rawPass : "••••••••••••"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(u.id)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                        title={isPasswordRevealed ? "Hide Password" : "Show Password"}
                      >
                        {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-orange-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySinglePassword(u)}
                        className={`p-1 rounded-lg transition-colors ${
                          isPwdCopied
                            ? "bg-emerald-100 text-emerald-700"
                            : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                        }`}
                        title="Copy Password"
                      >
                        {isPwdCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Action Buttons: Copy Full Credentials & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isCopied
                            ? "bg-emerald-600 text-white border-emerald-700 shadow"
                            : "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200"
                        }`}
                        title="Copy formatted credentials to send to user"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-orange-600" />
                            <span>Copy Login Info</span>
                          </>
                        )}
                      </button>

                      {/* Delete Account Button */}
                      <button
                        type="button"
                        onClick={() => setDeletingUserId(u.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-950">Delete Account Permanently?</h4>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete account{" "}
                <strong className="text-slate-900">
                  {users.find((u) => u.id === deletingUserId)?.name}
                </strong>{" "}
                ({users.find((u) => u.id === deletingUserId)?.email})?
              </p>
              <p className="text-[11px] text-red-600 font-bold mt-1">
                Any active trips will be safely reassigned. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteUser(deletingUserId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
