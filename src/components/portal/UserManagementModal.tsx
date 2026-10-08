"use client";

import React, { useState } from "react";
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  Truck,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { User, UserRole, ShiftType } from "@/lib/portal-types";

interface UserManagementModalProps {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function UserManagementModal({
  users,
  isOpen,
  onClose,
  onUserCreated,
}: UserManagementModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("dispatcher");
  const [assignedShift, setAssignedShift] = useState<ShiftType>("morning");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          assignedShift,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setName("");
        setEmail("");
        setPhone("");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">User &amp; Dispatcher Management</h3>
              <p className="text-xs text-slate-400">Invite, configure credentials &amp; assign operations shifts</p>
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs">
          
          {/* New User Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-orange-600" />
              <span>Add New Team Member / Dispatcher</span>
            </h4>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Miller"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Corporate Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@uniquedispatch.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Direct Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (332) 244-5532"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Role Access</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-bold"
                >
                  <option value="dispatcher">Dispatcher (Operations Board)</option>
                  <option value="super_admin">Super Admin (Full Governance)</option>
                </select>
              </div>
            </div>

            {role === "dispatcher" && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Assigned Shift</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignedShift("morning")}
                    className={`p-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 ${
                      assignedShift === "morning"
                        ? "bg-amber-500 text-white border-amber-600 shadow"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Morning Shift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignedShift("night")}
                    className={`p-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 ${
                      assignedShift === "night"
                        ? "bg-indigo-900 text-white border-indigo-950 shadow"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Night Shift</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider shadow transition-all"
              >
                {isSubmitting ? "Creating User..." : "Create Account"}
              </button>
            </div>
          </form>

          {/* Existing Team Members List */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Active Team ({users.length})</h4>
            <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
              {users.map((u) => (
                <div key={u.id} className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-slate-500 text-[11px]">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      u.role === "super_admin"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {u.role.replace("_", " ")}
                    </span>
                    {u.assignedShift && (
                      <span className="text-[10px] font-bold text-slate-500">
                        {u.assignedShift} shift
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
