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
  KeyRound,
  Settings,
  TrendingUp,
  BookOpen,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export const Route = createFileRoute("/renter/profile")({
  head: () => ({ meta: [{ title: "Profile — FarmFleet" }] }),
  component: RenterProfile,
});

/* ─── Types ─────────────────────────────────────────────────────── */

interface Farmer {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  bio?: string;
  photoUrl?: string;
  profileImage?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BookingStats {
  total: number;
  active: number;
  completed: number;
}

interface EditVals {
  fullName: string;
  email: string;
  mobile: string;
  village: string;
  district: string;
  state: string;
  bio: string;
}

interface PwdVals {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API = `${API_BASE_URL}/api/farmer`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("jwt") || localStorage.getItem("farmerToken")}` },
});

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
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-medium border ${type === "success"
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

/* ─── Modal ─────────────────────────────────────────────────────── */
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
function EditProfileDrawer({ farmer, open, onClose, onSaved }: { farmer: Farmer; open: boolean; onClose: () => void; onSaved: (f: Farmer) => void }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditVals>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      reset({
        fullName: farmer.fullName,
        email: farmer.email,
        mobile: farmer.mobile,
        village: farmer.village,
        district: farmer.district,
        state: farmer.state,
        bio: farmer.bio ?? "",
      });
    }
  }, [open, farmer, reset]);

  const onSubmit = async (data: EditVals) => {
    try {
      setLoading(true);
      const res = await axios.put(`${API}/profile`, data, authHeader());
      // support both response shapes
      const updated: Farmer = res.data.farmer ?? res.data;
      onSaved(updated);
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
        <Field label="About You">
          <textarea
            {...register("bio")}
            rows={4}
            placeholder="Tell equipment owners about yourself and your farming needs..."
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
function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PwdVals>();

  const [loading, setLoading] = useState(false);

  const [show, setShow] = useState({
    cur: false,
    nw: false,
    cf: false,
  });

  const newPwd = watch("newPassword");
  const currentPwd = watch("currentPassword");

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: PwdVals) => {
    try {
      if (data.currentPassword === data.newPassword) {
        alert(
          "New password must be different from current password"
        );
        return;
      }

      setLoading(true);

      const res = await axios.put(
        `${API}/change-password`,
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        authHeader()
      );

      alert(
        res.data.message ||
        "Password updated successfully"
      );

      reset();

      onClose();

      onSuccess();
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
        "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  const PwdField = ({
    label,
    reg,
    err,
    showKey,
  }: any) => (
    <Field label={label} error={err}>
      <div className="relative">
        <InputEl
          {...reg}
          type={
            show[showKey as keyof typeof show]
              ? "text"
              : "password"
          }
          placeholder="••••••••"
          className="pr-11"
        />

        <button
          type="button"
          onClick={() =>
            setShow((s) => ({
              ...s,
              [showKey]:
                !s[
                showKey as keyof typeof show
                ],
            }))
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show[
            showKey as keyof typeof show
          ] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <PwdField
          label="Current Password"
          reg={register(
            "currentPassword",
            {
              required:
                "Current password is required",
            }
          )}
          err={
            errors.currentPassword?.message
          }
          showKey="cur"
        />

        <PwdField
          label="New Password"
          reg={register("newPassword", {
            required:
              "New password is required",
            minLength: {
              value: 6,
              message:
                "Password must be at least 6 characters",
            },
            validate: (value) =>
              value !== currentPwd ||
              "New password must be different",
          })}
          err={errors.newPassword?.message}
          showKey="nw"
        />

        <PwdField
          label="Confirm New Password"
          reg={register(
            "confirmPassword",
            {
              required:
                "Please confirm your password",
              validate: (
                value: string
              ) =>
                value === newPwd ||
                "Passwords do not match",
            }
          )}
          err={
            errors.confirmPassword?.message
          }
          showKey="cf"
        />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-elevated transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API}/delete-account`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "farmerToken"
            )}`,
          },
        }
      );

      localStorage.removeItem("farmerToken");
      localStorage.removeItem("farmer");

      alert("Account deleted successfully");

      window.location.href = "/login-renter";
    } catch (error) {
      console.error(error);

      alert("Failed to delete account");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Account">
      <div className="space-y-5">
        <div className="flex gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
            <p className="text-sm text-red-700 mt-1">Your account, all rental history, and all data will be permanently removed from FarmFleet.</p>
          </div>
        </div>
        <Field label="Type DELETE to confirm">
          <InputEl value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" className="font-mono tracking-widest" />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition">Cancel</button>
          <button
            onClick={handleDeleteAccount}
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

/* ─── Photo Uploader ────────────────────────────────────────────── */
function PhotoUploader({ farmer, onUpdated }: { farmer: Farmer; onUpdated: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const photoUrl = farmer.photoUrl || farmer.profileImage;

  const handleFile = async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    try {
      setUploading(true);
      setProgress(0);
      const res = await axios.post(`${API}/upload-photo`, formData, {
        ...authHeader(),
        headers: { ...authHeader().headers, "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
      });
      onUpdated(res.data.photoUrl ?? res.data.imageUrl);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    try {
      await axios.put(`${API}/profile`, { photoUrl: "", profileImage: "" }, authHeader());
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
        {photoUrl ? (
          <img src={photoUrl} alt={farmer.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-600 to-lime-500">
            <span className="text-4xl font-bold text-white">
              {farmer.fullName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "FF"}
            </span>
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
          {photoUrl && (
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

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-lg"
      >
        <CheckCircle2 className="h-4 w-4 text-white" />
      </motion.div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

/* ─── Booking Stat Tile ─────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, accent, delay }: { icon: React.ElementType; label: string; value: number; accent: string; delay: number }) {
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
          className={`w-full text-left px-4 py-3 rounded-xl border transition ${i18n.language.startsWith(l.code)
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
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted/50" />)}
      </div>
    </div>
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
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${variant === "warn" ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
        }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${variant === "warn" ? "text-amber-700" : ""}`}>{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor === "green" ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"
          }`}>
          {badge}
        </span>
      )}
      {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />}
    </div>
  );

  return onClick ? <button className="w-full text-left" onClick={onClick}>{inner}</button> : <div>{inner}</div>;
}

/* ─── Main Component ────────────────────────────────────────────── */
function RenterProfile() {
  const nav = useNavigate();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [stats, setStats] = useState<BookingStats>({ total: 0, active: 0, completed: 0 });
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
        axios.get(`${API}/booking-stats`, authHeader()),
      ]);

      if (profileRes.status === "fulfilled") {
        const data = profileRes.value.data;
        // support {farmer:…} or {success:true, farmer:…} or flat object
        setFarmer(data.farmer ?? data);
      } else {
        throw new Error((profileRes.reason as any)?.response?.data?.message || "Failed to load profile");
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data);
      }
      // stats failure is non-fatal; leave defaults
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

  const photoUrl = farmer?.photoUrl || farmer?.profileImage;

  if (loading) return <AppShell><ProfileSkeleton /></AppShell>;

  if (error || !farmer) {
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
            {/* Animated ambient orbs */}
            <motion.div
              animate={{ x: [0, 28, 0], y: [0, -18, 0], scale: [1, 1.14, 1] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-green-400/30 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, -18, 0], y: [0, 14, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
              className="absolute -bottom-8 right-20 h-48 w-48 rounded-full bg-lime-300/20 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute top-6 right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            />

            {/* Field-grid pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.4) 39px, rgba(255,255,255,0.4) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.4) 39px, rgba(255,255,255,0.4) 40px)",
              }}
            />

            {/* Decorative wheat/field SVG */}
            <svg viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-6 bottom-2 h-20 w-44 sm:h-28 sm:w-56 opacity-15" aria-hidden>
              <path d="M10 90 Q20 50 30 20 Q40 50 50 90" stroke="white" strokeWidth="3" fill="none" />
              <ellipse cx="30" cy="16" rx="8" ry="12" fill="white" opacity="0.8" />
              <path d="M50 90 Q60 45 70 15 Q80 45 90 90" stroke="white" strokeWidth="3" fill="none" />
              <ellipse cx="70" cy="11" rx="8" ry="12" fill="white" opacity="0.8" />
              <path d="M90 90 Q100 48 110 18 Q120 48 130 90" stroke="white" strokeWidth="3" fill="none" />
              <ellipse cx="110" cy="14" rx="8" ry="12" fill="white" opacity="0.8" />
              <path d="M130 90 Q140 50 150 22 Q160 50 170 90" stroke="white" strokeWidth="3" fill="none" />
              <ellipse cx="150" cy="18" rx="8" ry="12" fill="white" opacity="0.8" />
              <path d="M170 90 Q180 52 190 24 Q200 52 210 90" stroke="white" strokeWidth="3" fill="none" />
              <ellipse cx="190" cy="20" rx="8" ry="12" fill="white" opacity="0.8" />
            </svg>

            {/* Floating glass badge — role */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute top-5 left-5 sm:top-6 sm:left-8 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1.5"
            >
              <div className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">FarmFleet Farmer</span>
            </motion.div>

            {/* Member since badge */}

          </div>

          {/* Profile body */}
          <div className="relative bg-card px-6 sm:px-8 pb-8">
            <div className="-mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end gap-5">

              {/* Photo */}
              <PhotoUploader
                farmer={farmer}
                onUpdated={(url) => setFarmer({ ...farmer, photoUrl: url, profileImage: url })}
              />

              {/* Identity */}
              <div className="flex-1 pb-1 pt-4 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{farmer.fullName}</h1>
                  {farmer.isVerified !== false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 border border-green-200 px-3 py-0.5 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified Farmer
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary/70" />{[farmer.village, farmer.district, farmer.state].filter(Boolean).join(", ")}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary/70" />{farmer.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary/70" />+91 {farmer.mobile}</span>
                </div>

                <p className="text-sm text-muted-foreground italic leading-relaxed max-w-xl">
                  {farmer.bio || <span className="not-italic opacity-60">No bio added yet — click Edit Profile to introduce yourself to equipment owners.</span>}
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
            SECTION 2 — BOOKING DASHBOARD TILES
        ══════════════════════════════════════════════════ */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-lime-400" />
            <h2 className="font-display text-lg font-bold">Rental Overview</h2>
            <span className="text-xs text-muted-foreground font-medium">Your booking history</span>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            <StatTile icon={BookOpen} label="Total Bookings" value={stats.total} accent="bg-gradient-to-r from-green-600 to-green-500" delay={0.22} />
            <StatTile icon={Activity} label="Active Rentals" value={stats.active} accent="bg-gradient-to-r from-lime-600 to-lime-500" delay={0.28} />
            <StatTile icon={ClipboardCheck} label="Completed" value={stats.completed} accent="bg-gradient-to-r from-emerald-600 to-emerald-500" delay={0.34} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            SECTION 3 — INFORMATION HUB
        ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-lime-400" />
            <h2 className="font-display text-lg font-bold">Farmer Information</h2>
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
                  { label: "Full Name", value: farmer.fullName, icon: User },
                  { label: "Mobile", value: `+91 ${farmer.mobile}`, icon: Phone },
                  { label: "Email", value: farmer.email, icon: Mail },
                  { label: "Village / Town", value: farmer.village, icon: MapPin },
                  { label: "District", value: farmer.district, icon: MapPin },
                  { label: "State", value: farmer.state, icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3 w-3 text-primary/60" />
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                    </div>
                    <p className="font-semibold text-sm">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: About + Timeline */}
            <div className="md:col-span-2 flex flex-col gap-5">
              {/* About */}
              <div className="flex-1 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="relative px-6 py-4 border-b border-border bg-gradient-to-r from-green-50/60 to-transparent">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">About Farmer</h3>
                    </div>
                    <button onClick={() => setEditOpen(true)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {farmer.bio || <span className="italic">No bio added. Edit your profile to introduce yourself to equipment owners.</span>}
                  </p>
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
                      <p className="text-sm font-semibold">{fmt(farmer.createdAt)}</p>
                    </div>
                  </div>
                  <div className="ml-4 pl-3 border-l-2 border-dashed border-border" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-lime-100 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-3.5 w-3.5 text-lime-700" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Last Updated</p>
                      <p className="text-sm font-semibold">{fmt(farmer.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION 4+5 — ACCOUNT MANAGEMENT
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

            {/* Security */}
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

            {/* Account */}
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
                    Permanently delete your FarmFleet account and all associated rental history. This action is irreversible.
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
        farmer={farmer}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => { setFarmer(updated); showToast("Profile updated successfully"); }}
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