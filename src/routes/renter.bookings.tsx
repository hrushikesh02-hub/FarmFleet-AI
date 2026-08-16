import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/renter/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — FarmFleet AI" }] }),
  component: RenterBookings,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type BackendStatus = "pending" | "accepted" | "rejected" | "completed";

interface BookingRecord {
  _id: string;
  equipment: {
    _id: string;
    name: string;
    image?: string;
    location?: string;
    category?: string;
    pricePerDay?: number;
    pricePerHour?: number;
  };
  owner: {
    _id: string;
    fullName: string;
    mobile?: string;
    email?: string;
    village?: string;
    district?: string;
    state?: string;
  };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: BackendStatus;
  createdAt: string;
  notes?: string;
  reviewGiven?: boolean;
  reviewDate?: string;
}

interface LabourRequestRecord {
  _id: string;
  labour: {
    _id: string;
    fullName: string;
    mobile?: string;
    email?: string;
    village?: string;
    district?: string;
    profileImage?: string;
    primarySkill?: string;
    dailyCharges?: number;
    rating?: number;
  };
  equipment?: {
    _id: string;
    name: string;
    image?: string;
  } | null;
  startDate: string;
  endDate: string;
  village: string;
  district: string;
  dailyCharges: number;
  totalAmount: number;
  status: BackendStatus;
  paymentStatus?: string;
  createdAt: string;
  reviewGiven?: boolean;
  reviewDate?: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BackendStatus,
  {
    label: string;
    message: string;
    badge: string;
    dot: string;
    icon: string;
  }
> = {
  pending: {
    label: "Awaiting Approval",
    message: "Your request has been sent. The owner will respond shortly.",
    badge:
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    dot: "bg-amber-400",
    icon: "⏳",
  },
  accepted: {
    label: "Booking Confirmed",
    message: "The owner has approved your request. Equipment is reserved for you.",
    badge:
      "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    dot: "bg-green-500",
    icon: "✅",
  },
  rejected: {
    label: "Booking Rejected",
    message: "The owner has declined this request. Try another listing.",
    badge:
      "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    dot: "bg-red-500",
    icon: "❌",
  },
  completed: {
    label: "Work Completed",
    message: "The owner has marked this booking as completed.",
    badge:
      "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    dot: "bg-emerald-600",
    icon: "🎉",
  },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

function BookingTimeline({ status }: { status: BackendStatus }) {
  const steps = buildTimeline(status);
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                ${
                  step.state === "done"
                    ? "bg-green-500 text-white"
                    : step.state === "rejected"
                      ? "bg-red-500 text-white"
                      : step.state === "active"
                        ? "bg-primary text-white ring-2 ring-primary/20"
                        : "border-2 border-border bg-card text-muted-foreground"
                }`}
            >
              {step.state === "done" ? "✓" : step.state === "rejected" ? "✕" : step.state === "active" ? "●" : "○"}
            </span>
            {i < steps.length - 1 && (
              <span className={`w-px h-4 mt-1 ${step.state === "done" ? "bg-green-300 dark:bg-green-700" : "bg-border"}`} />
            )}
          </div>
          <span
            className={`text-sm pt-0.5 ${
              step.state === "done" || step.state === "active"
                ? "font-medium text-foreground"
                : step.state === "rejected"
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function buildTimeline(status: BackendStatus) {
  if (status === "pending") {
    return [
      { label: "Booking Request Submitted", state: "done" as const },
      { label: "Waiting for Owner Approval", state: "active" as const },
      { label: "Work in Progress", state: "idle" as const },
      { label: "Booking Completed", state: "idle" as const },
    ];
  }
  if (status === "accepted") {
    return [
      { label: "Booking Request Submitted", state: "done" as const },
      { label: "Owner Approved", state: "done" as const },
      { label: "Work in Progress", state: "active" as const },
      { label: "Booking Completed", state: "idle" as const },
    ];
  }
  if (status === "completed") {
    return [
      { label: "Booking Request Submitted", state: "done" as const },
      { label: "Owner Approved", state: "done" as const },
      { label: "Work Performed", state: "done" as const },
      { label: "Booking Completed", state: "done" as const },
    ];
  }
  // rejected
  return [
    { label: "Booking Request Submitted", state: "done" as const },
    { label: "Owner Rejected Request", state: "rejected" as const },
  ];
}

// ─── Info Row helper ──────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
      <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
      <dd className={`text-xs font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

// ─── Section label helper ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
      {children}
    </p>
  );
}

// ─── Star Rating Component ────────────────────────────────────────────────────

function StarRating({
  rating,
  hovered,
  onRate,
  onHover,
  onLeave,
}: {
  rating: number;
  hovered: number;
  onRate: (n: number) => void;
  onHover: (n: number) => void;
  onLeave: () => void;
}) {
  const labels = ["", "1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"];
  const active = hovered || rating;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2" onMouseLeave={onLeave}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => onRate(n)}
            onMouseEnter={() => onHover(n)}
            className="text-4xl sm:text-5xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={labels[n]}
          >
            <motion.span
              animate={{
                scale: n <= active ? 1.05 : 1,
                filter: n <= active ? "brightness(1)" : "brightness(0.4) grayscale(1)",
              }}
              transition={{ duration: 0.15 }}
              className="block"
              style={{ display: "block" }}
            >
              ⭐
            </motion.span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {active > 0 && (
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {labels[active]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookingRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_CHARS = 1000;

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("farmerToken");
      const res = await fetch("/api/reviews/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking._id,
          rating,
          comment,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
        onClick={handleBackdrop}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10">
            {/* Drag handle (mobile) */}
            <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-sm transition"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="mt-2">
              <h2 className="text-xl font-bold">Rate Your Experience</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Share your experience with this equipment and owner.
              </p>
            </div>
            {/* Equipment context */}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                {booking.equipment.image ? (
                  <img src={booking.equipment.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-base">🚜</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{booking.equipment.name}</p>
                <p className="text-[10px] text-muted-foreground">Owner: {booking.owner.fullName}</p>
              </div>
            </div>
          </div>

          {/* Modal body */}
          <div className="px-6 py-5 space-y-6">
            {/* Star rating */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Your Rating
              </p>
              <StarRating
                rating={rating}
                hovered={hovered}
                onRate={setRating}
                onHover={setHovered}
                onLeave={() => setHovered(0)}
              />
            </div>

            {/* Comment */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Your Review
              </p>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_CHARS))}
                  rows={4}
                  placeholder="Tell other farmers about the equipment condition, owner responsiveness, punctuality, and overall service quality."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition leading-relaxed"
                />
                <span
                  className={`absolute bottom-2 right-3 text-[10px] font-mono ${
                    comment.length >= MAX_CHARS ? "text-red-500" : "text-muted-foreground"
                  }`}
                >
                  {comment.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"
              >
                ⚠️ {error}
              </motion.p>
            )}
          </div>

          {/* Modal footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition
                ${
                  rating === 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-sm hover:opacity-90"
                }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                  />
                  Submitting Review...
                </span>
              ) : (
                "Submit Review"
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold shadow-lg flex items-center gap-2 whitespace-nowrap"
    >
      ✅ {message}
    </motion.div>
  );
}

// ─── Review Section (inside expanded booking) ─────────────────────────────────

function ReviewSection({
  booking,
  onOpenModal,
}: {
  booking: BookingRecord;
  onOpenModal: () => void;
}) {
  if (booking.status !== "completed") return null;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  if (booking.reviewGiven) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-5 mb-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-start gap-3"
      >
        <span className="text-xl shrink-0 mt-0.5">✅</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Review Submitted</p>
          {booking.reviewDate && (
            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
              Review submitted on: {fmt(booking.reviewDate)}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-5 mb-5">
      <motion.button
        onClick={onOpenModal}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold text-sm shadow-sm hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        ⭐ Leave Review
      </motion.button>
    </div>
  );
}

// ─── Booking Row ──────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onRefresh,
  onToast,
}: {
  booking: BookingRecord;
  onRefresh: () => void;
  onToast: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const cfg = STATUS_CONFIG[booking.status];

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const nights = Math.max(
    1,
    Math.round(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86_400_000
    )
  );

  const ownerLocation = [booking.owner.village, booking.owner.district, booking.owner.state]
    .filter(Boolean)
    .join(", ");

  const handleReviewSuccess = useCallback(async () => {
    setReviewOpen(false);
    onToast("Review submitted successfully.");
    onRefresh();
  }, [onRefresh, onToast]);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        {/* ── Row header ── */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left px-4 py-4 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={expanded}
        >
          {/* Equipment image */}
          <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
            {booking.equipment.image ? (
              <img
                src={booking.equipment.image}
                alt={booking.equipment.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl">
                🚜
              </div>
            )}
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{booking.equipment.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {booking.equipment.category && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium uppercase tracking-wide">
                    {booking.equipment.category}
                  </span>
                </span>
              )}
              {booking.equipment.location && (
                <span className="ml-1.5">📍 {booking.equipment.location}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {fmt(booking.startDate)} → {fmt(booking.endDate)}
              <span className="ml-1.5 text-muted-foreground/70">({nights}d)</span>
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-medium">
                ₹{booking.totalAmount?.toLocaleString("en-IN")}
                <span className="text-muted-foreground font-normal ml-1">total</span>
              </p>
              {/* Rated badge inline */}
              {booking.status === "completed" && booking.reviewGiven && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700"
                >
                  ⭐ Rated Booking
                </motion.span>
              )}
            </div>
          </div>

          {/* Status badge — desktop */}
          <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              #{booking._id.slice(-8).toUpperCase()}
            </span>
          </div>

          {/* Chevron */}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1 text-muted-foreground shrink-0 text-xs"
          >
            ▾
          </motion.span>
        </button>

        {/* Mobile status */}
        <div className="sm:hidden px-4 pb-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            #{booking._id.slice(-8).toUpperCase()}
          </span>
        </div>

        {/* ── Expandable detail ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">

                {/* Status banner */}
                <div className={`px-5 py-3 flex items-center gap-3 ${
                  booking.status === "accepted" ? "bg-green-50 dark:bg-green-900/10" :
                  booking.status === "rejected" ? "bg-red-50 dark:bg-red-900/10" :
                  booking.status === "completed" ? "bg-emerald-50 dark:bg-emerald-900/10" :
                  "bg-amber-50 dark:bg-amber-900/10"
                }`}>
                  <span className="text-xl">{cfg.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{cfg.message}</p>
                  </div>
                </div>

                {/* Main grid */}
                <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                  {/* Equipment */}
                  <div>
                    <SectionLabel>🚜 Equipment</SectionLabel>
                    <dl>
                      <InfoRow label="Name" value={booking.equipment.name} />
                      {booking.equipment.category && (
                        <InfoRow label="Category" value={booking.equipment.category} />
                      )}
                      {booking.equipment.location && (
                        <InfoRow label="Location" value={booking.equipment.location} />
                      )}
                      {booking.equipment.pricePerDay != null && (
                        <InfoRow
                          label="Rate / Day"
                          value={`₹${booking.equipment.pricePerDay.toLocaleString("en-IN")}`}
                        />
                      )}
                      {booking.equipment.pricePerHour != null && (
                        <InfoRow
                          label="Rate / Hour"
                          value={`₹${booking.equipment.pricePerHour.toLocaleString("en-IN")}`}
                        />
                      )}
                    </dl>
                  </div>

                  {/* Owner */}
                  <div>
                    <SectionLabel>👤 Owner</SectionLabel>
                    <dl>
                      <InfoRow label="Name" value={booking.owner.fullName} />
                      {booking.owner.mobile && (
                        <InfoRow
                          label="Mobile"
                          value={
                            <a
                              href={`tel:${booking.owner.mobile}`}
                              className="text-primary underline underline-offset-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {booking.owner.mobile}
                            </a>
                          }
                        />
                      )}
                      {booking.owner.village && (
                        <InfoRow label="Village" value={booking.owner.village} />
                      )}
                      {booking.owner.district && (
                        <InfoRow label="District" value={booking.owner.district} />
                      )}
                      {booking.owner.state && (
                        <InfoRow label="State" value={booking.owner.state} />
                      )}
                      {ownerLocation === "" && (
                        <InfoRow label="Location" value="—" />
                      )}
                    </dl>
                  </div>

                  {/* Booking details */}
                  <div>
                    <SectionLabel>📋 Booking Details</SectionLabel>
                    <dl>
                      <InfoRow label="Booking ID" value={`#${booking._id.slice(-8).toUpperCase()}`} mono />
                      <InfoRow label="Requested On" value={fmt(booking.createdAt)} />
                      <InfoRow label="Start Date" value={fmt(booking.startDate)} />
                      <InfoRow label="End Date" value={fmt(booking.endDate)} />
                      <InfoRow label="Duration" value={`${nights} day${nights !== 1 ? "s" : ""}`} />
                      {booking.equipment.pricePerDay != null && (
                        <InfoRow
                          label="Price / Day"
                          value={`₹${booking.equipment.pricePerDay.toLocaleString("en-IN")}`}
                        />
                      )}
                      <InfoRow
                        label="Total Amount"
                        value={
                          <span className="text-sm font-bold text-foreground">
                            ₹{booking.totalAmount?.toLocaleString("en-IN") ?? "—"}
                          </span>
                        }
                      />
                    </dl>
                    {booking.notes && (
                      <p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 leading-relaxed">
                        {booking.notes}
                      </p>
                    )}
                  </div>

                  {/* Progress timeline */}
                  <div>
                    <SectionLabel>📌 Progress</SectionLabel>
                    <BookingTimeline status={booking.status} />
                  </div>
                </div>

                {/* Review section — below booking details, only for completed */}
                <ReviewSection
                  booking={booking}
                  onOpenModal={() => setReviewOpen(true)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewOpen && (
          <ReviewModal
            booking={booking}
            onClose={() => setReviewOpen(false)}
            onSuccess={handleReviewSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4 flex items-center gap-4 animate-pulse">
      <div className="h-16 w-16 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-3 w-48 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="hidden sm:block h-7 w-36 rounded-full bg-muted" />
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const FILTERS: { key: BackendStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimCounter({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
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
        setVal(parseFloat(start.toFixed(decimals)));
      }
    }, 18);
    return () => clearInterval(timer);
  }, [to, decimals]);
  return (
    <>
      {prefix}
      {decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString("en-IN")}
      {suffix}
    </>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
  delay,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  delay: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-default"
    >
      {/* Gradient glow blob */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        {/* Icon container */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${accent}20`, color: accent }}
        >
          {icon}
        </div>
        {/* Trend indicator */}
        <svg
          className="h-4 w-4 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      </div>
      {/* Value */}
      <p className="mt-4 text-2xl font-bold tracking-tight">
        <AnimCounter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      {/* Label */}
      <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ bookings }: { bookings: BookingRecord[] }) {
  const totalSpent = bookings
    .filter((b) => b.status === "completed" || b.status === "accepted")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
        }
        label="Total Bookings"
        value={bookings.length}
        accent="#22c55e"
        delay={0.05}
      />
      <StatCard
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }
        label="Confirmed Bookings"
        value={bookings.filter((b) => b.status === "accepted").length}
        accent="#3b82f6"
        delay={0.1}
      />
      <StatCard
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        }
        label="Completed Jobs"
        value={bookings.filter((b) => b.status === "completed").length}
        accent="#a855f7"
        delay={0.15}
      />
      <StatCard
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12M6 8h12M6 13l5.5 8L18 13" />
          </svg>
        }
        label="Amount Committed"
        value={totalSpent}
        accent="#f59e0b"
        delay={0.2}
        prefix="₹"
      />
    </div>
  );
}

// ─── Labour Review Modal ──────────────────────────────────────────────────────

function LabourReviewModal({
  request,
  onClose,
  onSuccess,
}: {
  request: LabourRequestRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("farmerToken") ?? localStorage.getItem("token") ?? "";
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE}/api/labour/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: request._id,
          rating,
          comment,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10">
            <h2 className="text-xl font-bold">Rate Labour Experience</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Share feedback for {request.labour.fullName} on completed work.
            </p>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Your Rating
              </p>
              <StarRating
                rating={rating}
                hovered={hovered}
                onRate={setRating}
                onHover={setHovered}
                onLeave={() => setHovered(0)}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Your Review
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Describe work quality, punctuality, and professionalism..."
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-primary text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Labour Request Card ──────────────────────────────────────────────────────

function LabourRequestCard({
  request,
  onRefresh,
  onToast,
}: {
  request: LabourRequestRecord;
  onRefresh: () => void;
  onToast: (msg: string) => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const cfg = STATUS_CONFIG[request.status];
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const days = Math.max(
    1,
    Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / 86_400_000
    ) + 1
  );

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-5 flex flex-wrap items-start justify-between gap-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
              {request.labour.profileImage ? (
                <img src={request.labour.profileImage} alt="" className="h-full w-full object-cover rounded-xl" />
              ) : (
                request.labour.fullName.charAt(0)
              )}
            </div>
            <div>
              <p className="font-bold text-base">{request.labour.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {request.labour.primarySkill || "Agricultural Labour"} · {request.village}, {request.district}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
            <span>{cfg.icon}</span> {cfg.label}
          </span>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground font-medium">Work Period</p>
            <p className="font-semibold text-foreground mt-0.5">{fmt(request.startDate)} – {fmt(request.endDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Duration</p>
            <p className="font-semibold text-foreground mt-0.5">{days} Working Days</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Daily Rate</p>
            <p className="font-semibold text-foreground mt-0.5">₹{request.dailyCharges} / day</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Total Amount</p>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">₹{request.totalAmount}</p>
          </div>
        </div>

        {request.status === "completed" && (
          <div className="px-5 pb-5">
            {request.reviewGiven ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                ✅ Review Submitted on {request.reviewDate ? fmt(request.reviewDate) : "Completed Work"}
              </div>
            ) : (
              <button
                onClick={() => setReviewOpen(true)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 transition"
              >
                ⭐ Leave Review for Labour
              </button>
            )}
          </div>
        )}
      </motion.div>

      {reviewOpen && (
        <LabourReviewModal
          request={request}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => {
            setReviewOpen(false);
            onToast("Review submitted successfully.");
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function RenterBookings() {
  const navigate = useNavigate();
  const [categoryTab, setCategoryTab] = useState<"equipment" | "labour">("equipment");
  const [filter, setFilter] = useState<BackendStatus | "all">("all");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [labourRequests, setLabourRequests] = useState<LabourRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("farmerToken") ?? localStorage.getItem("token") ?? "";
      const headers = { Authorization: `Bearer ${token}` };

      const [eqRes, labRes] = await Promise.all([
        fetch("/api/booking/farmer", { headers }).catch(() => null),
        fetch("/api/labour-request/farmer", { headers }).catch(() => null),
      ]);

      if (eqRes && eqRes.ok) {
        const eqData = await eqRes.json();
        if (eqData.success) {
          setBookings(Array.isArray(eqData.bookings) ? eqData.bookings : []);
        }
      }

      if (labRes && labRes.ok) {
        const labData = await labRes.json();
        if (labData.success) {
          setLabourRequests(Array.isArray(labData.requests) ? labData.requests : []);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const bookingList = Array.isArray(bookings) ? bookings : [];
  const labourList = Array.isArray(labourRequests) ? labourRequests : [];

  const visibleBookings =
    filter === "all" ? bookingList : bookingList.filter((b) => b.status === filter);

  const visibleLabour =
    filter === "all" ? labourList : labourList.filter((l) => l.status === filter);

  const countFor = (key: BackendStatus | "all") => {
    const list = categoryTab === "equipment" ? bookingList : labourList;
    return key === "all" ? list.length : list.filter((x) => x.status === key).length;
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My Bookings & Requests</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Track equipment reservations and labour hiring requests.
            </p>
          </div>

          {/* Module Switcher Tabs */}
          <div className="flex bg-muted rounded-xl p-1 border border-border">
            <button
              onClick={() => setCategoryTab("equipment")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                categoryTab === "equipment"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🚜 Equipment ({bookingList.length})
            </button>
            <button
              onClick={() => setCategoryTab("labour")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                categoryTab === "labour"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👨‍🌾 Labour ({labourList.length})
            </button>
          </div>
        </div>

        {/* Stats bar — only when data loaded for equipment */}
        {!loading && !error && categoryTab === "equipment" && bookingList.length > 0 && (
          <StatsBar bookings={bookingList} />
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {FILTERS.map(({ key, label }) => {
            const count = countFor(key);
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5
                  ${
                    filter === key
                      ? "bg-gradient-primary text-primary-foreground shadow-soft"
                      : "bg-card border border-border hover:border-primary/40"
                  }`}
              >
                {label}
                {!loading && count > 0 && (
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 font-bold
                      ${filter === key ? "bg-white/20" : "bg-muted text-muted-foreground"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-6 py-8 text-center"
          >
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
              Failed to load bookings
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAllData}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Empty */}
        {!loading && !error && (categoryTab === "equipment" ? visibleBookings.length === 0 : visibleLabour.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card px-6 py-14 text-center"
          >
            <p className="text-3xl mb-3">{categoryTab === "equipment" ? "🚜" : "👨‍🌾"}</p>
            <p className="font-semibold text-lg mb-1">
              {filter === "all"
                ? `No ${categoryTab === "equipment" ? "Equipment Bookings" : "Labour Requests"} Yet`
                : `No ${FILTERS.find((f) => f.key === filter)?.label} ${categoryTab === "equipment" ? "Bookings" : "Requests"}`}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {categoryTab === "equipment"
                ? "Browse available equipment and submit a booking request to get started."
                : "Browse available agricultural workers and hire labour for your farm operations."}
            </p>
            {filter === "all" && (
              <button
                onClick={() => navigate({ to: categoryTab === "equipment" ? "/renter/search" : "/renter/labours" })}
                className="px-6 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition"
              >
                {categoryTab === "equipment" ? "Browse Equipment" : "Find Labour"}
              </button>
            )}
          </motion.div>
        )}

        {/* Equipment list */}
        {!loading && !error && categoryTab === "equipment" && visibleBookings.length > 0 && (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleBookings.map((b) => (
                <BookingRow
                  key={b._id}
                  booking={b}
                  onRefresh={fetchAllData}
                  onToast={setToast}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Labour request list */}
        {!loading && !error && categoryTab === "labour" && visibleLabour.length > 0 && (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleLabour.map((req) => (
                <LabourRequestCard
                  key={req._id}
                  request={req}
                  onRefresh={fetchAllData}
                  onToast={setToast}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Global toast */}
      <AnimatePresence>
        {toast && (
          <Toast key="toast" message={toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}