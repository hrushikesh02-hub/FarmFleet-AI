import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Star,
  TrendingUp,
  ThumbsUp,
  Award,
  MessageSquare,
  Heart,
  Shield,
  Clock,
  BarChart2,
  Sparkles,
  Zap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/owner/review")({
  head: () => ({ meta: [{ title: "Reviews — FarmFleet" }] }),
  component: Reviews,
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Review {
  id: number;
  name: string;
  avatar: string;
  avatarColor: string;
  equipment: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  tag: string;
}

interface RatingDistribution {
  stars: number;
  count: number;
  color: string;
}

interface MonthlyReview {
  month: string;
  count: number;
  avg: number;
}

interface FeedbackCategory {
  label: string;
  pct: number;
  color: string;
  icon: string;
  trend: number;
}

interface ReviewsResponse {
  success: boolean;
  averageRating: number;
  totalReviews: number;
  fiveStarReviews: number;
  satisfactionScore: number;
  ratingDistribution: RatingDistribution[];
  monthlyReviews: MonthlyReview[];
  feedbackCategories: FeedbackCategory[];
  reviews: Review[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = "http://localhost:5000/api/reviews";

const FILTER_TABS = ["All", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"];

const TAG_COLORS: Record<string, string> = {
  "Equipment Quality": "#22c55e",
  Service:             "#3b82f6",
  Efficiency:          "#a855f7",
  Value:               "#f59e0b",
  Pricing:             "#f97316",
  Communication:       "#6366f1",
};

// Map icon string from API to actual Lucide component
const ICON_MAP: Record<string, React.ElementType> = {
  Shield,
  ThumbsUp,
  Clock,
  Zap,
  MessageSquare,
  Star,
  Award,
  BarChart2,
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

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
      if (start >= to) { setVal(to); clearInterval(timer); }
      else { setVal(parseFloat(start.toFixed(decimals))); }
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

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{ width: size, height: size }}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}
        />
      ))}
    </div>
  );
}

// ─── Stat Card — identical to Earnings.tsx ────────────────────────────────────

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
        <AnimCounter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  );
}

// ─── Skeleton Stat Cards ──────────────────────────────────────────────────────

function SkeletonStatCards() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
          </div>
          <div className="mt-4 h-7 w-24 rounded bg-muted" />
          <div className="mt-2 h-3 w-32 rounded bg-muted" />
        </div>
      ))}
    </>
  );
}

// ─── Skeleton Chart Card ──────────────────────────────────────────────────────

function SkeletonChartCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-muted" />
            <div className="h-2.5 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-14 rounded bg-muted" />
              <div className="flex-1 h-2 rounded-full bg-muted" />
              <div className="h-3 w-6 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted h-14" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Review Card ─────────────────────────────────────────────────────

function SkeletonReviewCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-muted" />
            <div className="h-2.5 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-2.5 w-14 rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
        <div className="h-3 w-4/6 rounded bg-muted" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 w-24 rounded-full bg-muted" />
        <div className="h-3.5 w-3.5 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertTriangle className="h-10 w-10 text-destructive/60" />
      <p className="font-semibold">Failed to load reviews</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Something went wrong while fetching your reviews data.
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

// ─── Rating Distribution ──────────────────────────────────────────────────────

function RatingDistribution({ data }: { data: RatingDistribution[] }) {
  const total = data.reduce((s, r) => s + r.count, 0);
  return (
    <div className="space-y-3">
      {data.map((r, i) => (
        <motion.div
          key={r.stars}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-1 w-16 flex-shrink-0">
            <span className="text-xs font-semibold tabular-nums">{r.stars}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </div>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: total > 0 ? `${(r.count / total) * 100}%` : "0%" }}
              transition={{ delay: 0.5 + i * 0.07, duration: 0.7, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: r.color }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums w-8 text-right text-muted-foreground">
            {r.count}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Satisfaction Ring ────────────────────────────────────────────────────────

function SatisfactionRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, [score]);

  const size = 180;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const dash = animated ? pct * circ : 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#satGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-4xl font-bold tracking-tight"
          style={{ color: "#22c55e" }}
        >
          {score}%
        </motion.p>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Satisfaction</p>
      </div>
    </div>
  );
}

// ─── Review Trend Panel ───────────────────────────────────────────────────────

function ReviewTrendPanel({ data }: { data: MonthlyReview[] }) {
  const max = Math.max(...data.map((m) => m.count), 1);
  const W = 260;
  const H = 80;
  const pad = 8;

  const pts = data.map((m, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    y: H - pad - ((m.count / max) * (H - pad * 2)),
    ...m,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `M ${pts[0]?.x ?? 0},${H - pad}`,
    ...pts.map((p) => `L ${p.x},${p.y}`),
    `L ${pts[pts.length - 1]?.x ?? 0},${H - pad}`,
    "Z",
  ].join(" ");

  const thisMonth = data[data.length - 1]?.count ?? 0;
  const lastMonth = data[data.length - 2]?.count ?? 0;
  const growthPct =
    lastMonth > 0
      ? `${thisMonth >= lastMonth ? "+" : ""}${Math.round(((thisMonth - lastMonth) / lastMonth) * 100)}%`
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-10 blur-3xl bg-blue-500" />
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
          <BarChart2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Review Volume Trend</h3>
          <p className="text-[11px] text-muted-foreground">Monthly reviews received</p>
        </div>
      </div>

      {data.length > 0 ? (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#sparkFill)" />
            <polyline
              points={polyline}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#3b82f6" />
            ))}
          </svg>
          <div className="flex justify-between mt-1 px-1">
            {data.map((m) => (
              <span key={m.month} className="text-[10px] text-muted-foreground">
                {m.month}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "This Month", val: String(thisMonth), color: "#3b82f6" },
              { label: "Last Month",  val: String(lastMonth),  color: "#a855f7" },
              { label: "Growth",      val: growthPct,           color: "#22c55e" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/50 border border-border p-2.5 text-center">
                <p className="text-base font-bold" style={{ color: item.color }}>{item.val}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
          <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No trend data available yet</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, delay }: { review: Review; delay: number }) {
  const tagColor = TAG_COLORS[review.tag] ?? "#6366f1";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card cursor-default"
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-70"
        style={{ background: `linear-gradient(90deg, ${tagColor}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 h-28 w-28 rounded-full opacity-10 blur-2xl"
        style={{ background: tagColor }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0"
            style={{ background: review.avatarColor }}
          >
            {review.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{review.name}</p>
              {review.verified && (
                <div className="h-3.5 w-3.5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{review.equipment}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <StarRating rating={review.rating} size={12} />
          <p className="text-[10px] text-muted-foreground mt-1">{review.date}</p>
        </div>
      </div>
      <p className="mt-3.5 text-sm text-muted-foreground leading-relaxed line-clamp-3">
        "{review.comment}"
      </p>
      <div className="mt-3.5 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          style={{ background: `${tagColor}15`, color: tagColor }}
        >
          <div className="h-1 w-1 rounded-full" style={{ background: tagColor }} />
          {review.tag}
        </span>
        <Heart className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-rose-400 transition-colors cursor-pointer" />
      </div>
    </motion.div>
  );
}

// ─── Feedback Category Card ───────────────────────────────────────────────────

function FeedbackCategoryCard({
  cat,
  delay,
}: {
  cat: FeedbackCategory;
  delay: number;
}) {
  const Icon = ICON_MAP[cat.icon] ?? Shield;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card cursor-default"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-15 blur-xl"
        style={{ background: cat.color }}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: `${cat.color}20`, color: cat.color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div
          className="flex items-center gap-0.5 text-[11px] font-semibold"
          style={{ color: cat.trend > 0 ? "#22c55e" : "#ef4444" }}
        >
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ transform: cat.trend < 0 ? "rotate(180deg)" : undefined }}
          >
            <path d="M5 2L9 7H1L5 2Z" fill="currentColor" />
          </svg>
          {Math.abs(cat.trend)}%
        </div>
      </div>
      <p className="text-2xl font-bold font-display tracking-tight" style={{ color: cat.color }}>
        {cat.pct}%
      </p>
      <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {cat.label}
      </p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cat.pct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: cat.color }}
        />
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Reviews() {
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get<ReviewsResponse>(`${API}/owner`, {
        headers: authHeaders(),
      });
      setReviewsData(data);
    } catch {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = useMemo(() => {
    const all = reviewsData?.reviews ?? [];
    if (activeFilter === "All") return all;
    const star = parseInt(activeFilter[0]);
    return all.filter((r) => r.rating === star);
  }, [reviewsData, activeFilter]);

  // Derived stats for the distribution summary row
  const fiveStarRate = useMemo(() => {
    const total = reviewsData?.totalReviews ?? 0;
    const five = reviewsData?.fiveStarReviews ?? 0;
    if (!total) return "0%";
    return `${Math.round((five / total) * 100)}%`;
  }, [reviewsData]);

  // Satisfaction sentiment breakdown derived from satisfactionScore
  const sentimentRows = useMemo(() => {
    const score = reviewsData?.satisfactionScore ?? 0;
    const total = reviewsData?.totalReviews ?? 0;
    const positivePct = score;
    const negativePct = Math.max(0, Math.round((100 - score) * 0.3));
    const neutralPct = Math.max(0, 100 - positivePct - negativePct);
    return [
      { label: "Positive Reviews", pct: positivePct, color: "#22c55e", count: Math.round((positivePct / 100) * total) },
      { label: "Neutral Reviews",  pct: neutralPct,  color: "#f59e0b", count: Math.round((neutralPct / 100) * total)  },
      { label: "Negative Reviews", pct: negativePct, color: "#ef4444", count: Math.round((negativePct / 100) * total) },
    ];
  }, [reviewsData]);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">

        {/* ── Page Header ── */}
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
              Reviews & Reputation
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Monitor farmer feedback, satisfaction, and service quality across all equipment.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">⭐ Rated Equipment Owner</span>
          </motion.div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {loading ? (
              <SkeletonStatCards />
            ) : error ? null : (
              <>
                <StatCard
                  icon={<Star className="h-5 w-5" />}
                  label="Average Rating"
                  value={reviewsData?.averageRating ?? 0}
                  accent="#22c55e"
                  delay={0.05}
                  suffix=" / 5"
                  decimals={1}
                />
                <StatCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="Total Reviews"
                  value={reviewsData?.totalReviews ?? 0}
                  accent="#3b82f6"
                  delay={0.1}
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Farmer Satisfaction"
                  value={reviewsData?.satisfactionScore ?? 0}
                  accent="#a855f7"
                  delay={0.15}
                  suffix="%"
                />
                <StatCard
                  icon={<Award className="h-5 w-5" />}
                  label="5-Star Reviews"
                  value={reviewsData?.fiveStarReviews ?? 0}
                  accent="#f59e0b"
                  delay={0.2}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ── Error State ── */}
        {error && !loading && <ErrorState onRetry={fetchReviews} />}

        {/* ── Data Sections — only when loaded ── */}
        {!loading && !error && reviewsData && (
          <>
            {/* ── Reputation Analytics ── */}
            <div className="grid lg:grid-cols-2 gap-4">

              {/* Rating Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full opacity-10 blur-3xl bg-amber-400" />
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-500">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Rating Distribution</h3>
                    <p className="text-[11px] text-muted-foreground">Breakdown by star rating</p>
                  </div>
                </div>
                <RatingDistribution data={reviewsData.ratingDistribution ?? []} />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { label: "5★ Rate",   val: fiveStarRate,                                           color: "#22c55e" },
                    { label: "Avg Stars", val: (reviewsData.averageRating ?? 0).toFixed(1),            color: "#f59e0b" },
                    { label: "Reviews",   val: (reviewsData.totalReviews ?? 0).toLocaleString("en-IN"), color: "#3b82f6" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted/50 border border-border p-2.5 text-center">
                      <p className="text-base font-bold" style={{ color: item.color }}>{item.val}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Review Volume Trend */}
              <ReviewTrendPanel data={reviewsData.monthlyReviews ?? []} />
            </div>

            {/* ── Satisfaction Score ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-10 blur-3xl bg-green-500" />
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/20 text-green-500">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Farmer Satisfaction Score</h3>
                  <p className="text-[11px] text-muted-foreground">Based on all verified reviews</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <SatisfactionRing score={reviewsData.satisfactionScore ?? 0} />
                  <p className="text-xs text-muted-foreground mt-2 font-medium">Farmer Satisfaction Score</p>
                </div>
                <div className="hidden sm:block w-px h-48 bg-border" />
                <div className="flex-1 w-full space-y-4">
                  {sentimentRows.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.count.toLocaleString("en-IN")} reviews
                          </span>
                          <span className="text-sm font-bold" style={{ color: item.color }}>{item.pct}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: item.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { label: "Top Owner",      color: "#22c55e" },
                      { label: "Fast Responder", color: "#3b82f6" },
                      { label: "Highly Trusted", color: "#a855f7" },
                    ].map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                        style={{ borderColor: `${b.color}40`, color: b.color, background: `${b.color}10` }}
                      >
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Feedback Categories ── */}
            {(reviewsData.feedbackCategories?.length ?? 0) > 0 && (
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="h-5 w-1 rounded-full bg-indigo-500" />
                  <div>
                    <h2 className="font-semibold text-base tracking-tight">Top Feedback Categories</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">What farmers praise most about your service</p>
                  </div>
                </motion.div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {reviewsData.feedbackCategories.map((cat, i) => (
                    <FeedbackCategoryCard key={cat.label} cat={cat} delay={0.55 + i * 0.06} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Featured Reviews ── */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-5 w-1 rounded-full bg-purple-500" />
                  <div>
                    <h2 className="font-semibold text-base tracking-tight">Featured Reviews</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""} shown
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        activeFilter === tab
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </motion.div>
              </div>

              <AnimatePresence mode="wait">
                {filteredReviews.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col items-center justify-center py-20 gap-4 text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border">
                      <MessageSquare className="h-9 w-9 text-primary/40" />
                    </div>
                    <p className="text-lg font-semibold">No Reviews Yet</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Complete bookings to start receiving farmer feedback and build your reputation.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredReviews.map((review, i) => (
                      <ReviewCard key={review.id} review={review} delay={i * 0.05} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ── Skeleton charts while loading ── */}
        {loading && (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              <SkeletonChartCard />
              <SkeletonChartCard />
            </div>
            <SkeletonChartCard />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse h-28" />
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonReviewCard key={i} />
              ))}
            </div>
          </>
        )}

      </section>
    </AppShell>
  );
}