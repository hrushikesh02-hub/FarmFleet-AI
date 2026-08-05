import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { LANGUAGES } from "@/i18n";
import {
  Edit2,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  RefreshCw,
  Camera,
  X,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Trash2,
  Shield,
  User,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Globe,
  Settings,
  KeyRound,
  Clock3,
  IndianRupee,
  Star,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export const Route = createFileRoute("/labour/profile")({
  head: () => ({ meta: [{ title: "Profile — FarmFleet" }] }),
  component: LabourProfile,
});

/* ─── Types ─────────────────────────────────────────────────────── */

interface Labour {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  bio?: string;
  profileImage?: string;
  primarySkill?: string;
  experience?: string;
  dailyCharges?: number;
  availability?: "available" | "busy" | "offline" | string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

interface LabourStats {
  completedJobs: number;
  pendingRequests: number;
  totalEarnings: number;
  rating: number;
}

interface EditVals {
  fullName: string;
  email: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  primarySkill: string;
  experience: string;
  dailyCharges: number;
  availability: string;
  bio: string;
}

interface PwdVals {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

const EXPERIENCE_OPTIONS = ["Fresher", "1-3 Years", "3-5 Years", "5+ Years", "10+ Years"];
const AVAILABILITY_OPTIONS = ["available", "busy", "offline"] as const;

const API = "http://localhost:5000/api/labour";
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

/* ─── Availability badge config ─────────────────────────────────── */

const AVAILABILITY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  available: { label: "Available", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  busy: { label: "Busy", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  offline: { label: "Offline", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

function getAvailability(a?: string) {
  return AVAILABILITY_CONFIG[(a ?? "offline").toLowerCase()] ?? AVAILABILITY_CONFIG.offline;
}

/* ─── Toast ─────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.94 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-medium border ${
        type === "success"
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
        {type === "success" ? "✓" : "✕"}
      </span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </motion.div>
  );
}

/* ─── Drawer ────────────────────────────────────────────────────── */
function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative ml-auto h-full w-full max-w-md bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="relative px-6 pt-6 pb-5 border-b border-border shrink-0">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-green-400 to-lime-400" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">FarmFleet</p>
                  <h2 className="font-display text-xl font-bold">{title}</h2>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Modal shell ───────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl"
          >
            <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-3xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-green-400 to-lime-400" />
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Field / Input ─────────────────────────────────────────────── */
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function InputEl({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition ${className ?? ""}`}
      {...props}
    />
  );
}

/* ─── Edit Profile Drawer ───────────────────────────────────────── */
function EditProfileDrawer({ labour, open, onClose, onSaved }: { labour: Labour; open: boolean; onClose: () => void; onSaved: (l: Labour) => void }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditVals>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      reset({
        fullName: labour.fullName,
        email: labour.email,
        mobile: labour.mobile,
        village: labour.village,
        district: labour.district,
        state: labour.state,
        primarySkill: labour.primarySkill ?? "",
        experience: labour.experience ?? "",
        dailyCharges: labour.dailyCharges ?? 0,
        availability: labour.availability ?? "available",
        bio: labour.bio ?? "",
      });
    }
  }, [open, labour, reset]);

  const onSubmit = async (data: EditVals) => {
    try {
      setLoading(true);
      const res = await axios.put(`${API}/profile`, data, authHeader());
      onSaved(res.data.labour);
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" error={errors.fullName?.message}>
            <InputEl {...register("fullName", { required: "Required" })} placeholder="Ramesh Kumar" />
          </Field>
          <Field label="Mobile" error={errors.mobile?.message}>
            <InputEl {...register("mobile", { required: "Required", pattern: { value: /^[6-9]\d{9}$/, message: "Invalid mobile" } })} placeholder="9876543210" />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <InputEl {...register("email", { required: "Required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} type="email" placeholder="you@example.com" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Village / Town" error={errors.village?.message}>
            <InputEl {...register("village", { required: "Required" })} placeholder="Kopargaon" />
          </Field>
          <Field label="District" error={errors.district?.message}>
            <InputEl {...register("district", { required: "Required" })} placeholder="Ahmednagar" />
          </Field>
        </div>
        <Field label="State" error={errors.state?.message}>
          <select
            {...register("state", { required: "Required" })}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary Skill" error={errors.primarySkill?.message}>
            <InputEl {...register("primarySkill", { required: "Required" })} placeholder="Harvesting" />
          </Field>
          <Field label="Experience" error={errors.experience?.message}>
            <select
              {...register("experience", { required: "Required" })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            >
              <option value="">Select experience</option>
              {EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Daily Charges (₹)" error={errors.dailyCharges?.message}>
            <InputEl
              type="number"
              {...register("dailyCharges", { required: "Required", valueAsNumber: true, min: { value: 0, message: "Must be positive" } })}
              placeholder="500"
            />
          </Field>
          <Field label="Availability" error={errors.availability?.message}>
            <select
              {...register("availability", { required: "Required" })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition capitalize"
            >
              {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a} className="capitalize">{a}</option>)}
            </select>
          </Field>
        </div>

        <Field label="About You">
          <textarea
            {...register("bio")}
            rows={4}
            placeholder="Tell farmers about your skills and experience..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
          />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition">Cancel</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-elevated transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

/* ─── Change Password Modal ─────────────────────────────────────── */
function ChangePasswordModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PwdVals>();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ cur: false, nw: false, cf: false });
  const newPwd = watch("newPassword");

  const onSubmit = async (data: PwdVals) => {
    try {
      setLoading(true);
      await axios.put(`${API}/change-password`, { currentPassword: data.currentPassword, newPassword: data.newPassword }, authHeader());
      reset();
      onClose();
      onSuccess();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const PwdField = ({ label, reg, err, showKey }: any) => (
    <Field label={label} error={err}>
      <div className="relative">
        <InputEl {...reg} type={show[showKey as keyof typeof show] ? "text" : "password"} placeholder="••••••••" className="pr-11" />
        <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey as keyof typeof show] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show[showKey as keyof typeof show] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );

  return (
    <Modal open={open} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PwdField label="Current Password" reg={register("currentPassword", { required: "Required" })} err={errors.currentPassword?.message} showKey="cur" />
        <PwdField label="New Password" reg={register("newPassword", { required: "Required", minLength: { value: 6, message: "Min 6 characters" } })} err={errors.newPassword?.message} showKey="nw" />
        <PwdField label="Confirm New Password" reg={register("confirmPassword", { required: "Required", validate: (v: string) => v === newPwd || "Passwords don't match" })} err={errors.confirmPassword?.message} showKey="cf" />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-elevated transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Delete Account Modal ──────────────────────────────────────── */
function DeleteAccountModal({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const res = await axios.delete(
        "http://localhost:5000/api/labour/delete-account",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("labour");

        onDeleted();
        onClose();
      }
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
        "Failed to delete account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Account">
      <div className="space-y-5">
        <div className="flex gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
            <p className="text-sm text-red-700 mt-1">Your account, all job requests, and all data will be permanently removed from FarmFleet.</p>
          </div>
        </div>
        <Field label="Type DELETE to confirm">
          <InputEl value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" className="font-mono tracking-widest" />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition">Cancel</button>
          <button
            onClick={handleDelete}
            disabled={confirm !== "DELETE" || loading}
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : "Permanently Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Photo Upload ──────────────────────────────────────────────── */
function PhotoUploader({ labour, onUpdated }: { labour: Labour; onUpdated: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    try {
      setUploading(true);
      setProgress(0);
      const res = await axios.post(`${API}/upload-photo`, formData, {
        ...authHeader(),
        headers: { ...authHeader().headers, "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
      });
      onUpdated(res.data.imageUrl);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    try {
      await axios.put(`${API}/profile`, { profileImage: "" }, authHeader());
      onUpdated("");
    } catch {
      alert("Failed to remove photo");
    }
  };

  return (
    <div className="relative group shrink-0">
      <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-green-400 to-lime-300 opacity-60 blur-sm" />
      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-green-500 to-lime-400" />

      <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-green-100 to-lime-50">
        {labour.profileImage ? (
          <img src={labour.profileImage} alt={labour.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-600 to-lime-500">
            <span className="text-4xl font-bold text-white">{labour.fullName?.charAt(0) ?? "L"}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <span className="text-xs text-white mt-1 font-semibold">{progress}%</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/40 transition"
            title="Upload photo"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
          {labour.profileImage && (
            <button
              onClick={handleRemove}
              className="h-8 w-8 rounded-full bg-red-500/60 backdrop-blur-sm border border-red-300/40 flex items-center justify-center hover:bg-red-500/80 transition"
              title="Remove photo"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

/* ─── Labour Overview Stat Tile ─────────────────────────────────── */
function StatTile({ icon: Icon, label, value, accent, delay }: { icon: React.ElementType; label: string; value: string | number; accent: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 28 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card group cursor-default p-5"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-green-50/60 to-transparent" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
          <motion.p
            className="text-4xl font-bold tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.12, type: "spring", stiffness: 400 }}
          >
            {value}
          </motion.p>
        </div>
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${accent.replace("bg-gradient-to-r", "bg-gradient-to-br")} shadow-md`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-primary/15 group-hover:bg-primary/25 transition-colors"
            style={{ height: `${4 + Math.sin((i + delay * 5) * 1.5) * 3 + 3}px` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Language Switcher ─────────────────────────────────────────── */
function LanguageSection() {
  const { i18n } = useTranslation();
  return (
    <div className="space-y-2">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition ${
            i18n.language.startsWith(l.code)
              ? "border-primary bg-accent text-primary"
              : "border-border hover:border-primary/40"
          }`}
        >
          <span className="font-semibold">{l.native}</span>
          <span className="text-xs text-muted-foreground ml-2">({l.label})</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Profile Skeleton ──────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <div className="rounded-3xl border border-border overflow-hidden">
        <div className="h-56 animate-pulse bg-gradient-to-br from-green-200 to-lime-100" />
        <div className="p-8 space-y-4">
          <div className="flex gap-6">
            <div className="h-36 w-36 rounded-full animate-pulse bg-green-100 -mt-20 shrink-0" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-7 w-56 rounded-lg animate-pulse bg-muted" />
              <div className="h-4 w-40 rounded-lg animate-pulse bg-muted/60" />
              <div className="h-4 w-64 rounded-lg animate-pulse bg-muted/40" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted/50" />)}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
function LabourProfile() {
  const nav = useNavigate();

  const [labour, setLabour] = useState<Labour | null>(null);
  const [stats, setStats] = useState<LabourStats>({ completedJobs: 0, pendingRequests: 0, totalEarnings: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, statsRes] = await Promise.allSettled([
        axios.get(`${API}/profile`, authHeader()),
        axios.get(`${API}/dashboard-stats`, authHeader()),
      ]);
      if (profileRes.status === "fulfilled") setLabour(profileRes.value.data.labour);
      else throw new Error((profileRes.reason as any)?.response?.data?.message || "Failed to load profile");
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = () => {
    localStorage.clear();
    nav({ to: "/" });
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  if (loading) return <AppShell><ProfileSkeleton /></AppShell>;

  if (error || !labour) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="font-display text-2xl font-bold">Could not load profile</h2>
          <p className="text-muted-foreground">{error ?? "Please try again."}</p>
          <button onClick={fetchProfile} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const availability = getAvailability(labour.availability);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">

        {/* ══════════════════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl shadow-2xl"
        >
          {/* Hero Banner */}
          <div className="relative h-52 sm:h-64 bg-gradient-to-br from-green-900 via-green-700 to-lime-500 overflow-hidden">
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-green-400/30 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute -bottom-8 right-20 h-48 w-48 rounded-full bg-lime-300/20 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-6 right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            />

            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.4) 39px, rgba(255,255,255,0.4) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.4) 39px, rgba(255,255,255,0.4) 40px)"
              }}
            />

            {/* Decorative field-worker silhouette */}
            <svg viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-6 bottom-3 h-24 w-48 sm:h-32 sm:w-64 opacity-15" aria-hidden>
              <circle cx="150" cy="22" r="12" fill="white" />
              <rect x="140" y="36" width="20" height="34" rx="6" fill="white" />
              <rect x="128" y="42" width="14" height="28" rx="6" fill="white" />
              <rect x="158" y="42" width="14" height="28" rx="6" fill="white" />
              <rect x="136" y="68" width="10" height="26" rx="4" fill="white" />
              <rect x="154" y="68" width="10" height="26" rx="4" fill="white" />
              <rect x="4" y="70" width="90" height="6" rx="3" fill="white" />
              <rect x="14" y="52" width="6" height="24" rx="2" fill="white" />
              <rect x="34" y="46" width="6" height="30" rx="2" fill="white" />
              <rect x="54" y="58" width="6" height="18" rx="2" fill="white" />
              <rect x="74" y="42" width="6" height="34" rx="2" fill="white" />
            </svg>

            {/* Floating glass badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute top-5 left-5 sm:top-6 sm:left-8 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1.5"
            >
              <div className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">FarmFleet Labour</span>
            </motion.div>
          </div>

          {/* Profile body */}
          <div className="relative bg-card px-6 sm:px-8 pb-8">
            <div className="-mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end gap-5">

              {/* Photo with overlap */}
              <div className="relative shrink-0">
                <PhotoUploader labour={labour} onUpdated={(url) => setLabour({ ...labour, profileImage: url })} />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </motion.div>
              </div>

              {/* Identity */}
              <div className="flex-1 pb-1 pt-4 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{labour.fullName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 border border-green-200 px-3 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Verified Labour
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary capitalize">
                    <Briefcase className="h-3 w-3" /> Farm Labour
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full ${availability.bg} px-3 py-0.5 text-xs font-semibold ${availability.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                    {availability.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary/70" />{labour.village}, {labour.district}, {labour.state}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary/70" />{labour.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary/70" />+91 {labour.mobile}</span>
                </div>

                <p className="text-sm text-muted-foreground italic leading-relaxed max-w-xl">
                  {labour.bio || <span className="not-italic opacity-60">No bio added yet — click Edit Profile to introduce yourself to farmers.</span>}
                </p>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => setEditOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:shadow-elevated transition self-start sm:self-end"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION 2 — LABOUR OVERVIEW TILES
        ══════════════════════════════════════════════════ */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-lime-400" />
            <h2 className="font-display text-lg font-bold">Labour Overview</h2>
            <span className="text-xs text-muted-foreground font-medium">Live data from your jobs</span>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile icon={Briefcase} label="Completed Jobs" value={stats.completedJobs} accent="bg-gradient-to-r from-green-600 to-green-500" delay={0.22} />
            <StatTile icon={Clock3} label="Pending Requests" value={stats.pendingRequests} accent="bg-gradient-to-r from-amber-600 to-amber-500" delay={0.28} />
            <StatTile icon={IndianRupee} label="Total Earnings" value={`₹${(stats.totalEarnings ?? 0).toLocaleString("en-IN")}`} accent="bg-gradient-to-r from-emerald-600 to-emerald-500" delay={0.34} />
            <StatTile icon={Star} label="Rating" value={(stats.rating ?? 0).toFixed(1)} accent="bg-gradient-to-r from-teal-600 to-teal-500" delay={0.40} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            SECTION 3 — INFORMATION HUB (split layout)
        ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-lime-400" />
            <h2 className="font-display text-lg font-bold">Labour Information</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-5">
            {/* Left: Personal details */}
            <div className="md:col-span-3 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="relative px-6 py-4 border-b border-border bg-gradient-to-r from-green-50/60 to-transparent">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Personal Details</h3>
                </div>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { label: "Full Name", value: labour.fullName, icon: User },
                  { label: "Mobile", value: `+91 ${labour.mobile}`, icon: Phone },
                  { label: "Email", value: labour.email, icon: Mail },
                  { label: "Village / Town", value: labour.village, icon: MapPin },
                  { label: "District", value: labour.district, icon: MapPin },
                  { label: "State", value: labour.state, icon: MapPin },
                  { label: "Primary Skill", value: labour.primarySkill, icon: Briefcase },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="group">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3 w-3 text-primary/60" />
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                    </div>
                    <p className="font-semibold text-sm">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: About + Professional Info + Timeline */}
            <div className="md:col-span-2 flex flex-col gap-5">
              {/* About */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="relative px-6 py-4 border-b border-border bg-gradient-to-r from-green-50/60 to-transparent">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">About Labour</h3>
                    </div>
                    <button onClick={() => setEditOpen(true)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {labour.bio || <span className="italic">No bio added. Edit your profile to introduce yourself to farmers.</span>}
                  </p>
                </div>
              </div>

              {/* Professional Information */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="relative px-6 py-4 border-b border-border bg-gradient-to-r from-green-50/60 to-transparent">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Professional Information</h3>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Briefcase className="h-3 w-3 text-primary/60" />
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Primary Skill</p>
                    </div>
                    <p className="font-semibold text-sm">{labour.primarySkill || "—"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock3 className="h-3 w-3 text-primary/60" />
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Experience</p>
                    </div>
                    <p className="font-semibold text-sm">{labour.experience || "—"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <IndianRupee className="h-3 w-3 text-primary/60" />
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Daily Charges</p>
                    </div>
                    <p className="font-semibold text-sm">₹{(labour.dailyCharges ?? 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="h-3 w-3 text-primary/60" />
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Availability</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full ${availability.bg} px-2.5 py-0.5 text-xs font-semibold ${availability.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                      {availability.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="relative px-6 py-4 border-b border-border bg-gradient-to-r from-green-50/60 to-transparent">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Account Timeline</h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Member Since</p>
                      <p className="text-sm font-semibold">{fmt(labour.createdAt)}</p>
                    </div>
                  </div>
                  <div className="ml-4 pl-3 border-l-2 border-dashed border-border" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-lime-100 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-3.5 w-3.5 text-lime-700" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Last Updated</p>
                      <p className="text-sm font-semibold">{fmt(labour.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION 4+5 — MANAGEMENT + SETTINGS
        ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-lime-400" />
            <h2 className="font-display text-lg font-bold">Account Management</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Profile Settings */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="relative px-5 py-4 border-b border-border">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-lime-400" />
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profile</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                <ManagementRow icon={Edit2} label="Edit Profile" desc="Name, email, location" onClick={() => setEditOpen(true)} />
                <ManagementRow icon={Camera} label="Change Photo" desc="Upload or remove photo" onClick={() => setEditOpen(true)} />
                <ManagementRow icon={Globe} label="Language" desc="Interface language" badge="Multi" />
              </div>
              <div className="px-5 py-3 bg-muted/30 border-t border-border">
                <LanguageSection />
              </div>
            </div>

            {/* Security Settings */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="relative px-5 py-4 border-b border-border">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-lime-400" />
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                <ManagementRow icon={KeyRound} label="Change Password" desc="Update your password" onClick={() => setPwdOpen(true)} />
                <ManagementRow icon={Shield} label="Account Status" desc="Active & verified" badge="Active" badgeColor="green" />
              </div>
            </div>

            {/* Account Settings */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="relative px-5 py-4 border-b border-border">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-lime-400" />
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                <ManagementRow icon={LogOut} label="Sign Out" desc="Log out of FarmFleet" onClick={handleLogout} variant="warn" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION 6 — DANGER ZONE
        ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <div className="relative rounded-2xl border border-red-200 bg-red-50/40 overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-red-200/60 pointer-events-none" style={{ margin: "4px" }} />

            <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-700">Danger Zone</p>
                  </div>
                  <h3 className="font-display font-bold text-base text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-700/80 mt-0.5 max-w-md">
                    Permanently delete your FarmFleet account and all associated job history. This action is irreversible.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition shadow-sm hover:shadow-md"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── Drawers / Modals ─────────────────────────────────── */}
      <EditProfileDrawer
        labour={labour}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => { setLabour(updated); showToast("Profile updated successfully"); }}
      />
      <ChangePasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={() => showToast("Password changed successfully")}
      />
      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => { showToast("Account deleted"); setTimeout(() => nav({ to: "/" }), 500); }}
      />

      {/* ── Toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}

/* ─── Management Row ────────────────────────────────────────────── */
function ManagementRow({
  icon: Icon, label, desc, onClick, variant, badge, badgeColor,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  onClick?: () => void;
  variant?: "warn";
  badge?: string;
  badgeColor?: "green" | "gray";
}) {
  const inner = (
    <div className={`flex items-center gap-3 px-5 py-4 group ${onClick ? "cursor-pointer" : ""} ${variant === "warn" ? "hover:bg-amber-50/60" : onClick ? "hover:bg-muted/40" : ""} transition`}>
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
        variant === "warn" ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${variant === "warn" ? "text-amber-700" : ""}`}>{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          badgeColor === "green" ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"
        }`}>
          {badge}
        </span>
      )}
      {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />}
    </div>
  );

  return onClick ? <button className="w-full text-left" onClick={onClick}>{inner}</button> : <div>{inner}</div>;
}