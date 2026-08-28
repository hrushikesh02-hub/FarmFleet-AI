import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Step } from "react-joyride";
import { OnboardingTour } from "@/components/OnboardingTour";
import { AppShell } from "@/components/AppShell";
import {
  Plus, Edit2, Trash2, MapPin, X, Upload, CheckCircle2,
  AlertTriangle, Tractor, Loader2, IndianRupee, Calendar,
  CloudUpload, ChevronRight, Package, Zap, Wrench, TrendingUp,
  UserCheck, BadgeCheck, Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import axios from "axios";
import api from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Equipment {
  _id: string;
  name: string;
  type: string;
  pricePerAcre: number;

  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  operatorIncluded: boolean;
  image?: string;
  status: string;
  createdAt?: string;
}

interface EquipmentFormData {
  name: string;
  type: string;
  pricePerAcre: string;

  location: string;
  operatorIncluded: boolean;
}

// ─── API layer ─────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem("ownerToken") ?? localStorage.getItem("token") ?? "";
  console.log("OWNER EQUIPMENT REQUEST");
  console.log("Owner token exists:", !!token);
  return { Authorization: `Bearer ${token}` };
}

const equipmentApi = {
  list: () =>
    api.get("/equipment/owner", {
      headers: authHeaders(),
    }),

  add: (fd: FormData) =>
    api.post("/equipment/add", fd, {
      headers: authHeaders(),
    }),

  update: (id: string, fd: FormData) =>
    api.put(`/equipment/${id}`, fd, {
      headers: authHeaders(),
    }),

  remove: (id: string) =>
    api.delete(`/equipment/${id}`, {
      headers: authHeaders(),
    }),
};

// ─── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/owner/equipment")({
  head: () => ({ meta: [{ title: "My Equipment — FarmFleet" }] }),
  component: OwnerEquipment,
});

// ─── Animated counter ──────────────────────────────────────────────────────────

function AnimCounter({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 40;
    const inc = to / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= to) {
        setVal(to);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start));
      }
    }, 18);
    return () => clearInterval(timer);
  }, [to]);
  return (
    <>
      {prefix}
      {val.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
  delay,
  prefix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  delay: number;
  prefix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${accent}20`, color: accent }}
        >
          {icon}
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-2xl font-bold font-display tracking-tight">
        <AnimCounter to={value} prefix={prefix} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  );
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex gap-3 mt-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-full rounded-lg bg-muted mt-4" />
      </div>
    </div>
  );
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  active: {
    label: "Active",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-amber-500/15",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-400/15",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

function getStatus(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
}

// ─── Equipment card ────────────────────────────────────────────────────────────

function EquipmentCard({
  item,
  index,
  onEdit,
  onDelete,
}: {
  item: Equipment;
  index: number;
  onEdit: (e: Equipment) => void;
  onDelete: (e: Equipment) => void;
}) {
  const status = getStatus(item.status);
  const hasCoords = !!(item.coordinates?.lat && item.coordinates?.lng);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tractor className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status badge */}
        <div
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10 ${status.bg} ${status.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </div>

        {/* Operator badge */}
        {item.operatorIncluded && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-primary/90 text-primary-foreground backdrop-blur-sm">
            <UserCheck className="h-3 w-3" />
            Operator
          </div>
        )}

        {/* Action buttons — appear on hover */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onEdit(item)}
            className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white transition shadow-sm"
            title="Edit equipment"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(item)}
            className="h-8 w-8 rounded-lg bg-red-500/90 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition shadow-sm"
            title="Delete equipment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base truncate">{item.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{item.type}</p>
          </div>
        </div>

        {/* Location */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{item.location}</span>
          {hasCoords && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium text-[10px] flex-shrink-0">
              <Navigation className="h-2.5 w-2.5" />
              Verified
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Per Acre
            </p>
            <p className="font-bold text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">
              ₹{(item.pricePerAcre || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Created date */}
        {item.createdAt && (
          <p className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Listed{" "}
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg mb-6">
        <Tractor className="h-14 w-14 text-primary/60" />
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Plus className="h-4 w-4 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-xl font-bold">No Equipment Added Yet</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        List your farm equipment and start earning rental income from farmers in your area.
      </p>
      <button
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-elevated transition"
      >
        <Plus className="h-4 w-4" /> Add Your First Equipment
      </button>
    </motion.div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-elevated text-sm font-medium ${
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────

function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-elevated scrollbar-hide`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({
  equipment,
  onClose,
  onConfirm,
  loading,
}: {
  equipment: Equipment;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Delete Equipment</h3>
            <p className="text-xs text-muted-foreground">This cannot be undone</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
            {equipment.image ? (
              <img
                src={equipment.image}
                alt={equipment.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Tractor className="h-7 w-7 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">{equipment.name}</p>
            <p className="text-xs text-muted-foreground">
              {equipment.type} · {equipment.location}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Removing <strong>{equipment.name}</strong> will permanently delete its listing and make
          it unavailable to farmers.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent transition"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {loading ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Image dropzone ────────────────────────────────────────────────────────────

function ImageDropzone({
  preview,
  onChange,
}: {
  preview: string | null;
  onChange: (file: File, url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5 MB allowed.");
      return;
    }
    onChange(file, URL.createObjectURL(file));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200
        ${
          dragging
            ? "border-primary bg-primary/8 scale-[1.01]"
            : "border-primary/30 bg-primary/4 hover:bg-primary/8 hover:border-primary/50"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl w-full aspect-[3/2]">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
            <p className="text-white text-sm font-medium">Click to change</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CloudUpload className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">Drop image here or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP · Max 5 MB</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────────────────

const EQUIPMENT_TYPES = [
  "Tractor",
  "Harvester",
  "Plough",
  "Rotavator",
  "Sprayer",
  "Thresher",
  "Seeder",
  "Pump",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 text-xs text-muted-foreground block">{hint}</span>}
    </label>
  );
}

// ─── Step progress ─────────────────────────────────────────────────────────────

function StepProgress({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300
              ${
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
          >
            {i < current ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium hidden sm:block ${
              i === current ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Add / Edit modal ──────────────────────────────────────────────────────────

function EquipmentFormModal({
  onClose,
  onSave,
  editing,
}: {
  onClose: () => void;
  onSave: (item: Equipment) => void;
  editing?: Equipment;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    defaultValues: editing
      ? {
          name: editing.name,
          type: editing.type,
          pricePerAcre: editing.pricePerAcre ? String(editing.pricePerAcre) : "",
          location: editing.location,
          operatorIncluded: editing.operatorIncluded,
        }
      : {
          pricePerAcre: "",
        },
  });


  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(editing?.image ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: EquipmentFormData) => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("type", data.type);
      fd.append("pricePerAcre", data.pricePerAcre || "0");

      fd.append("location", data.location);
      fd.append("operatorIncluded", String(data.operatorIncluded));
      if (file) fd.append("image", file);

      const res = editing
  ? await equipmentApi.update(editing._id, fd)
  : await equipmentApi.add(fd);
      const saved = editing ? res.data.equipment : res.data.equipment;
      onSave(saved);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <Modal onClose={onClose} wide>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="font-display text-2xl font-bold">
            {editing ? "Edit Equipment" : "Add Equipment"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {editing
              ? "Update your equipment listing details."
              : "List your agricultural equipment and start earning."}
          </p>
        </div>

        <StepProgress current={step} steps={["Information", "Photo"]} />

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Field label="Equipment Name">
                  <input
                    {...register("name", { required: true })}
                    className={inputCls}
                    placeholder="e.g. Mahindra 575 DI"
                  />
                  {errors.name && (
                    <span className="text-xs text-destructive mt-1 block">Name is required</span>
                  )}
                </Field>

                <Field label="Equipment Type">
                  <select {...register("type", { required: true })} className={inputCls}>
                    {EQUIPMENT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Price per Acre (₹)" hint="Rate per agricultural acre">
                  <input
                    type="number"
                    min={0}
                    {...register("pricePerAcre", { required: true })}
                    className={inputCls}
                    placeholder="e.g. 800"
                  />
                </Field>

                <Field label="Location" hint="Enter village, taluka or district name">
                  <input
                    {...register("location", { required: true })}
                    className={inputCls}
                    placeholder="e.g. Wai, Satara, Maharashtra"
                  />
                  {errors.location && (
                    <span className="text-xs text-destructive mt-1 block">Location is required</span>
                  )}
                </Field>

                <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-accent transition">
                  <input
                    type="checkbox"
                    {...register("operatorIncluded")}
                    className="h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">Operator included</p>
                    <p className="text-xs text-muted-foreground">
                      A trained operator is available with this equipment
                    </p>
                  </div>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <Field label="Equipment Photo" hint="Good photos get 3× more bookings">
                  <ImageDropzone
                    preview={preview}
                    onChange={(f, url) => {
                      setFile(f);
                      setPreview(url);
                    }}
                  />
                </Field>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {loading ? "Saving…" : editing ? "Save changes" : "Add Equipment"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </Modal>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function OwnerEquipment() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [deleteItem, setDeleteItem] = useState<Equipment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const tourSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="owner-add-equipment"]',
        title: t("tour.ownerEquipment.addTitle"),
        content: t("tour.ownerEquipment.addContent"),
      },
      {
        target: '[data-tour="owner-equipment-card"]',
        title: t("tour.ownerEquipment.gridTitle"),
        content: t("tour.ownerEquipment.gridContent"),
      },
      {
        target: '[data-tour="owner-equipment-status"]',
        title: t("tour.ownerEquipment.availabilityTitle"),
        content: t("tour.ownerEquipment.availabilityContent"),
      },
      {
        target: '[data-tour="owner-equipment-pricing"]',
        title: t("tour.ownerEquipment.actionsTitle"),
        content: t("tour.ownerEquipment.actionsContent"),
      },
    ],
    [t]
  );

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => setToast({ msg, type }),
    []
  );

  // Fetch equipment from backend
  useEffect(() => {
    (async () => {
      try {
        const { data } = await equipmentApi.list();
        setItems(data.equipments || []);
      } catch {
        setFetchError("Failed to load equipment. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(
    (item: Equipment) => {
      setItems((prev) => {
        const idx = prev.findIndex((x) => x._id === item._id);
        return idx >= 0 ? prev.map((x) => (x._id === item._id ? item : x)) : [item, ...prev];
      });
      const isEdit = !!editItem;
      setAddOpen(false);
      setEditItem(null);
      showToast(isEdit ? `${item.name} updated!` : `${item.name} added!`);
    },
    [editItem, showToast]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      await equipmentApi.remove(deleteItem._id);
      setItems((p) => p.filter((x) => x._id !== deleteItem._id));
      showToast(`${deleteItem.name} deleted.`);
      setDeleteItem(null);
    } catch {
      showToast("Could not delete. Please try again.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteItem, showToast]);

  // Stats derived from live backend data
  const total = items.length;
  const active = items.filter((i) => i.status === "active").length;
  const maintenance = items.filter((i) => i.status === "maintenance").length;
  const dailyValue = items.reduce((s, i) => s + (i.pricePerAcre || 0), 0);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-primary">
              Owner Dashboard
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
              My Equipment
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Manage your fleet, track listings, and grow your rental income.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <OnboardingTour
              tourKey="farmfleet_tour_seen_owner_equipment"
              steps={tourSteps}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              data-tour="owner-add-equipment"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-elevated transition"
            >
              <Plus className="h-4 w-4" /> Add Equipment
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div data-tour="owner-equipment-status" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Total Equipment"
            value={total}
            accent="#22c55e"
            delay={0.05}
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Active Listings"
            value={active}
            accent="#3b82f6"
            delay={0.1}
          />
          <StatCard
            icon={<Wrench className="h-5 w-5" />}
            label="Under Maintenance"
            value={maintenance}
            accent="#f59e0b"
            delay={0.15}
          />
          <div data-tour="owner-equipment-pricing">
            <StatCard
              icon={<IndianRupee className="h-5 w-5" />}
              label="Total Daily Value"
              value={dailyValue}
              accent="#8b5cf6"
              delay={0.2}
              prefix="₹"
            />
          </div>
        </div>

        {/* ── Fetch error ─────────────────────────────────────────────────── */}
        {fetchError && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <AlertTriangle className="h-10 w-10 text-destructive/60" />
            <p className="font-semibold">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Equipment grid ──────────────────────────────────────────────── */}
        <div data-tour="owner-equipment-card" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : !fetchError && items.length === 0 ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
            <AnimatePresence>
              {items.map((item, i) => (
                <EquipmentCard
                  key={item._id}
                  item={item}
                  index={i}
                  onEdit={setEditItem}
                  onDelete={setDeleteItem}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* ── Modals ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {addOpen && (
            <EquipmentFormModal onClose={() => setAddOpen(false)} onSave={handleSave} />
          )}
          {editItem && (
            <EquipmentFormModal
              onClose={() => setEditItem(null)}
              onSave={handleSave}
              editing={editItem}
            />
          )}
          {deleteItem && (
            <DeleteModal
              equipment={deleteItem}
              onClose={() => setDeleteItem(null)}
              onConfirm={handleDelete}
              loading={deleteLoading}
            />
          )}
        </AnimatePresence>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.msg}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </section>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </AppShell>
  );
}