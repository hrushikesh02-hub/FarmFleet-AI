import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CalendarDays,
  IndianRupee,
  Tractor,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  BadgeCheck,
  RefreshCw,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Package,
  TrendingUp,
  X,
} from "lucide-react";

export const Route = createFileRoute("/owner/bookings")({
  head: () => ({ meta: [{ title: "Bookings — FarmFleet AI" }] }),
  component: OwnerBookings,
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  renter: {
    _id: string;
    fullName: string;
    mobile: string;
    email: string;
    village: string;
    district: string;
    state: string;
  };
  equipment: {
    _id: string;
    name: string;
    image: string;
    location: string;
    pricePerHour: number;
    pricePerDay: number;
    equipmentType?: string;
  };
  farmAddress?: {
    address?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    landmark?: string;
  };
  totalAmount: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string;
}

type FilterStatus = Booking["status"] | "all";

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API = `${API_BASE}/api/booking`;

function authHeaders() {
  const token = localStorage.getItem("ownerToken") ?? localStorage.getItem("token") ?? "";
  return { Authorization: `Bearer ${token}` };
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimCounter({
  to,
  prefix = "",
}: {
  to: number;
  prefix?: string;
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
    </>
  );
}

// ─── Stat card — matches Equipment page exactly ───────────────────────────────

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

// ─── Skeleton card — matches Equipment page ───────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[16/7] bg-muted" />
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

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Booking["status"],
  { label: string; bg: string; text: string; dot: string; Icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-500/15",
    text: "text-amber-600",
    dot: "bg-amber-500",
    Icon: Clock,
  },
  accepted: {
    label: "Accepted",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/15",
    text: "text-red-600",
    dot: "bg-red-500",
    Icon: XCircle,
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-500/15",
    text: "text-blue-600",
    dot: "bg-blue-500",
    Icon: BadgeCheck,
  },
};

function StatusBadge({ status }: { status: Booking["status"] }) {
  const { label, bg, text, dot } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10 ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  index,
  onAccept,
  onReject,
  onComplete,
  onMarkCashReceived,
  actionLoading,
}: {
  booking: Booking;
  index: number;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
  onMarkCashReceived?: (id: string) => void;
  actionLoading: string | null;
}) {
  const { equipment, renter, status, totalAmount, createdAt, _id } = booking;
  const isLoading = actionLoading === _id;

  const imageSrc = equipment.image?.startsWith("http")
    ? equipment.image
    : equipment.image
    ? `${API_BASE}${equipment.image}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-shadow duration-300"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image section */}
        <div className="relative sm:w-48 h-44 sm:h-auto flex-shrink-0 overflow-hidden bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={equipment.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30">
              <Tractor className="h-12 w-12 text-green-400/60" />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status badge over image */}
          <div className="absolute top-3 left-3">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base truncate">{equipment.name}</h3>
              {equipment.equipmentType && (
                <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">
                  {equipment.equipmentType}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">
              <IndianRupee className="h-3.5 w-3.5" />
              {totalAmount.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {/* Renter info */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Renter Details
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="font-semibold truncate">{renter?.fullName || "Unknown Farmer"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>{renter.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate max-w-[200px]">{renter.email}</span>
              </div>
            </div>

            {/* Booking info */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Booking Details
              </p>
              {/* Farm address — where equipment will be used */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">Farm Location</p>
                  {booking.farmAddress?.village ? (
                    <span className="truncate">
                      {[
                        booking.farmAddress.village,
                        booking.farmAddress.taluka,
                        booking.farmAddress.district,
                        booking.farmAddress.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                  {booking.farmAddress?.address && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{booking.farmAddress.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>
                  {new Date(createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {status !== "rejected" && status !== "completed" && (
            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border">
              {status === "pending" && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAccept(_id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Accept
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReject(_id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-600 border border-red-200 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </motion.button>
                </>
              )}
              {status === "accepted" && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onComplete(_id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-600 border border-blue-200 hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-800"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <BadgeCheck className="h-3.5 w-3.5" />
                    )}
                    Mark as Completed
                  </motion.button>
                  {onMarkCashReceived && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onMarkCashReceived(_id)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <IndianRupee className="h-3.5 w-3.5" />
                      )}
                      Confirm Cash Received
                    </motion.button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg mb-6">
        <Package className="h-14 w-14 text-primary/60" />
      </div>
      <h3 className="font-display text-xl font-bold">
        {filtered ? "No matching bookings" : "No bookings yet"}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {filtered
          ? "Try adjusting your search or filter to find what you're looking for."
          : "Once renters book your equipment, their requests will appear here."}
      </p>
    </motion.div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertTriangle className="h-10 w-10 text-destructive/60" />
      <p className="font-semibold">Failed to load bookings</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Something went wrong while fetching your bookings.
      </p>
      <button
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function OwnerBookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [q, setQ] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(`${API}/owner`, {
        headers: authHeaders(),
      });
      setBookings(Array.isArray(data) ? data : data.bookings ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleAction(
    id: string,
    action: "accept" | "reject" | "complete"
  ) {
    setActionLoading(id);
    try {
      await axios.put(`${API}/${action}/${id}`, {}, { headers: authHeaders() });
      await fetchBookings();
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const accepted = bookings.filter((b) => b.status === "accepted").length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const revenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    return { total, pending, accepted, completed, revenue };
  }, [bookings]);

  // ── Filter + search ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = filter === "all" || b.status === filter;
      const matchQ =
        !lower ||
        b.equipment?.name?.toLowerCase().includes(lower) ||
        b.renter?.fullName?.toLowerCase().includes(lower) ||
        b.renter?.mobile?.includes(lower);
      return matchStatus && matchQ;
    });
  }, [bookings, filter, q]);

  const tabs: { v: FilterStatus; label: string }[] = [
    { v: "all", label: t("common.viewAll") },
    { v: "pending", label: t("owner.pending") },
    { v: "accepted", label: t("owner.accepted") },
    { v: "rejected", label: t("owner.rejected") },
    { v: "completed", label: t("owner.completed") },
  ];

  async function handleMarkCashReceived(id: string) {
    setActionLoading(id);
    try {
      await axios.post(
        `${API_BASE}/api/payment/cash/mark-received/equipment`,
        { transactionId: id },
        { headers: authHeaders() }
      );
      await fetchBookings();
    } catch (err) {
      console.error("Failed to mark cash received:", err);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">

        {/* Header — matches Equipment page */}
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
              {t("nav.bookings")}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              {t("owner.manageBookings")}
            </p>
          </div>
        </motion.div>

        {/* Stats row — identical to Equipment page StatCard */}
        {!loading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Total Bookings"
              value={stats.total}
              accent="#6366f1"
              delay={0.05}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Pending"
              value={stats.pending}
              accent="#f59e0b"
              delay={0.1}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Accepted"
              value={stats.accepted}
              accent="#22c55e"
              delay={0.15}
            />
            <StatCard
              icon={<BadgeCheck className="h-5 w-5" />}
              label="Completed"
              value={stats.completed}
              accent="#3b82f6"
              delay={0.2}
            />
            <StatCard
              icon={<IndianRupee className="h-5 w-5" />}
              label="Revenue Generated"
              value={stats.revenue}
              accent="#8b5cf6"
              delay={0.25}
              prefix="₹"
            />
          </div>
        )}

        {/* Search + filter tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary transition-colors shadow-card">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by equipment, renter name or mobile…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <AnimatePresence>
              {q && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQ("")}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent transition text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((tb) => (
              <button
                key={tb.v}
                onClick={() => setFilter(tb.v)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === tb.v
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <ErrorState onRetry={fetchBookings} />
          ) : filtered.length === 0 ? (
            <EmptyState filtered={q !== "" || filter !== "all"} />
          ) : (
            <AnimatePresence>
              {filtered.map((b, i) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  index={i}
                  actionLoading={actionLoading}
                  onAccept={(id) => handleAction(id, "accept")}
                  onReject={(id) => handleAction(id, "reject")}
                  onComplete={(id) => handleAction(id, "complete")}
                  onMarkCashReceived={handleMarkCashReceived}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </AppShell>
  );
}