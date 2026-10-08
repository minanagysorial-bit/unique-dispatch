"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
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
  Plus,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { User, ShiftDefinition, UserRole } from "@/lib/portal-types";

interface TeamManagementPanelProps {
  users: User[];
  onDataChanged: () => void;
  onOpenUserModal: () => void;
}

export default function TeamManagementPanel({
  users,
  onDataChanged,
  onOpenUserModal,
}: TeamManagementPanelProps) {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "super_admin" | "dispatcher">("all");

  // Passwords reveal & copy state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion modal state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // New Shift Inline Modal / Form
  const [isNewShiftOpen, setIsNewShiftOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("08:00");
  const [newShiftEnd, setNewShiftEnd] = useState("16:30");
  const [newShiftTz, setNewShiftTz] = useState("EST");
  const [newShiftColor, setNewShiftColor] = useState("amber");
  const [isCreatingShift, setIsCreatingShift] = useState(false);

  const fetchShifts = async () => {
    try {
      const res = await fetch("/api/shifts");
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

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
    setDeleteError("");
    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setDeletingUserId(null);
        onDataChanged();
      } else {
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch (e) {
      setDeleteError("Network error while deleting account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName || !newShiftStart || !newShiftEnd) return;

    setIsCreatingShift(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newShiftName,
          startTime: newShiftStart,
          endTime: newShiftEnd,
          timezone: newShiftTz,
          color: newShiftColor,
        }),
      });

      if (res.ok) {
        setNewShiftName("");
        setIsNewShiftOpen(false);
        fetchShifts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingShift(false);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const res = await fetch(`/api/shifts?id=${shiftId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchShifts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalAdmins = users.filter((u) => u.role === "super_admin").length;
  const totalDispatchers = users.filter((u) => u.role === "dispatcher").length;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-3xl font-black text-slate-950 mt-1">{users.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Super Admins</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{totalAdmins}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Dispatchers</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{totalDispatchers}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured Shifts</p>
            <p className="text-3xl font-black text-indigo-600 mt-1">{shifts.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Accounts & Credentials Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0a1128] text-white flex items-center justify-center font-black shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 tracking-tight">
                Staff Accounts &amp; Access Credentials
              </h3>
              <p className="text-xs text-slate-500">
                View plaintext passwords, copy login credentials, configure working hours &amp; manage access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenUserModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>

        {/* Search & Role Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by dispatcher name, email or phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  roleFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Roles ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter("dispatcher")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  roleFilter === "dispatcher" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dispatchers ({totalDispatchers})
              </button>
              <button
                onClick={() => setRoleFilter("super_admin")}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  roleFilter === "super_admin" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Super Admins ({totalAdmins})
              </button>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-900 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User / Staff</th>
                <th className="py-3.5 px-4">Role Access</th>
                <th className="py-3.5 px-4">Shift &amp; Working Hours</th>
                <th className="py-3.5 px-4">Password (Plaintext)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-bold">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPasswordRevealed = revealedPasswords[u.id];
                  const rawPass = u.rawPassword || (u.role === "super_admin" ? "UniqueAdmin2026!" : "Dispatch2026!");
                  const isCopied = copiedId === u.id;
                  const isPwdCopied = copiedId === `pwd-${u.id}`;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0a1128] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-950 text-xs sm:text-sm">{u.name}</p>
                            <p className="text-slate-500 text-[11px] font-mono">{u.email}</p>
                            {u.phone && <p className="text-slate-400 text-[10px]">{u.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            u.role === "super_admin"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>

                      {/* Shift Schedule */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-orange-600" />
                          <span>{u.shiftTimeRange || `${u.assignedShift || "Standard"} Shift`}</span>
                        </div>
                      </td>

                      {/* Password Field */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                          <span className="font-mono font-bold text-slate-900 text-xs min-w-[90px] select-all">
                            {isPasswordRevealed ? rawPass : "••••••••••"}
                          </span>

                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                            title={isPasswordRevealed ? "Hide Password" : "Show Password"}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-orange-600" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopySinglePassword(u)}
                            className={`p-1 rounded transition-colors ${
                              isPwdCopied
                                ? "bg-emerald-100 text-emerald-700"
                                : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                            }`}
                            title="Copy Password"
                          >
                            {isPwdCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(u)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isCopied
                                ? "bg-emerald-600 text-white border-emerald-700 shadow"
                                : "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200"
                            }`}
                            title="Copy formatted credentials to send to user via email/WhatsApp"
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

                          <button
                            type="button"
                            onClick={() => setDeletingUserId(u.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Shift Schedules Configuration Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 tracking-tight">
                Configured Operational Shift Schedules
              </h3>
              <p className="text-xs text-slate-500">
                Define and customize working hours from start time to end time across all timezones
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNewShiftOpen(!isNewShiftOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Add New Shift Window</span>
          </button>
        </div>

        {/* Add Shift Inline Form */}
        {isNewShiftOpen && (
          <form
            onSubmit={handleCreateShift}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in"
          >
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Define New Shift Time Window</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Shift Name *</label>
                <input
                  required
                  type="text"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder="e.g. Swing Shift / Weekend Ops"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Start Time *</label>
                <input
                  required
                  type="time"
                  value={newShiftStart}
                  onChange={(e) => setNewShiftStart(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">End Time *</label>
                <input
                  required
                  type="time"
                  value={newShiftEnd}
                  onChange={(e) => setNewShiftEnd(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Timezone</label>
                <select
                  value={newShiftTz}
                  onChange={(e) => setNewShiftTz(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-bold"
                >
                  <option value="EST">EST (Eastern)</option>
                  <option value="CST">CST (Central)</option>
                  <option value="MST">MST (Mountain)</option>
                  <option value="PST">PST (Pacific)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsNewShiftOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingShift}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow"
              >
                {isCreatingShift ? "Saving..." : "Save Shift"}
              </button>
            </div>
          </form>
        )}

        {/* Shifts Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-orange-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xs sm:text-sm">{s.name}</p>
                  <p className="text-slate-600 text-xs font-mono font-bold">
                    {s.startTime} - {s.endTime} {s.timezone || "EST"}
                  </p>
                  {s.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>
                  )}
                </div>
              </div>

              {!["shift-morning", "shift-afternoon", "shift-night"].includes(s.id) && (
                <button
                  type="button"
                  onClick={() => handleDeleteShift(s.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove shift schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* Delete User Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
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
                Any active trips assigned to this dispatcher will be reassigned automatically.
              </p>
              {deleteError && (
                <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg font-bold mt-2">
                  {deleteError}
                </p>
              )}
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
