import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Gauge,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CircleDot,
  Leaf,
  XCircle,
  Filter,
  Info,
  CloudRain,
  Cloud,
  Sun,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/renter/ai/calendar")({
  head: () => ({ meta: [{ title: "Crop Calendar — FarmFleet AI" }] }),
  component: CropCalendarPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — identical pattern to weather/reports pages
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("farmerToken") ?? "";
  return { Authorization: `Bearer ${token}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — shaped to the existing backend itinerary contract
// ─────────────────────────────────────────────────────────────────────────────

interface ItineraryLocation {
  state?: string;
  district?: string;
  city?: string;
}

interface WeatherDecision {
  safe?: boolean;
  severity?: string; // "low" | "medium" | "high" | "critical"
  weatherCondition?: string;
  reason?: string;
  recommendation?: string;
  delayDays?: number;
  warnings?: string[];
}

interface TimelineActivity {
  week?: number | string;
  weekNumber?: number | string;
  title?: string;
  description?: string;
  status?: string; // "Scheduled" | "Completed" | "Delayed"
  originalDate?: string;
  currentDate?: string;
  formattedDate?: string;
  delayed?: boolean;
  delayDays?: number;
  delayReason?: string;
  weatherDecision?: WeatherDecision;
}

interface ItineraryRecord {
  _id: string;
  crop?: string;
  cropName?: string;
  location?: ItineraryLocation;
  timeline?: TimelineActivity[];
  status?: string;
  createdAt?: string;
}

interface ItinerariesApiResponse {
  success?: boolean;
  itineraries?: ItineraryRecord[];
  data?: ItineraryRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API — reuses the existing /api/ai/my-itineraries endpoint only
// ─────────────────────────────────────────────────────────────────────────────

async function fetchItineraries(): Promise<ItineraryRecord[]> {
  console.log("[Crop Calendar] Loading itineraries");
  const { data } = await axios.get<ItinerariesApiResponse>(
    `${API_BASE_URL}/api/ai/my-itineraries`,
    { headers: authHeaders() }
  );
  console.log("[Crop Calendar] Itineraries response:", data);
  return data.itineraries ?? data.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}

function safe(v: unknown, fb = "N/A"): string {
  return has(v) ? String(v) : fb;
}

function parseDateSafe(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function fmtFullDate(v?: string): string | null {
  const d = parseDateSafe(v);
  if (!d) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtShortDate(v?: string): string | null {
  const d = parseDateSafe(v);
  if (!d) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function fmtWeekdayDate(v?: string): string | null {
  const d = parseDateSafe(v);
  if (!d) return null;
  const weekday = d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
  const day = d.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  return `${weekday} ${day} ${month}`;
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// ITINERARY / ACTIVITY NORMALIZATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function resolveCropLabel(it?: ItineraryRecord | null): string {
  return it?.crop ?? it?.cropName ?? "";
}

function resolveLocationLabel(it?: ItineraryRecord | null): string {
  const loc = it?.location;
  if (!loc) return "";
  return [loc.district, loc.state].filter(Boolean).join(", ");
}

// Derive a short "stage" label from an activity's full title, e.g.
// "Land Preparation & Ridge Formation" -> "Land Preparation".
function resolveStageLabel(title?: string): string {
  if (!title) return "";
  const segment = title.split(/[&\-(]/)[0]?.trim();
  return segment || title;
}

function resolveWeekLabel(activity: TimelineActivity): string | null {
  const week = activity.weekNumber ?? activity.week;
  if (!has(week)) return null;
  return typeof week === "number" || /^\d+$/.test(String(week)) ? `Week ${week}` : String(week);
}

// Prefer the real (parseable) date fields for computation; fall back to a
// preformatted string only for display.
function resolveActivityDateObj(activity: TimelineActivity): Date | null {
  return (
    parseDateSafe(activity.currentDate) ??
    parseDateSafe(activity.originalDate) ??
    parseDateSafe(activity.formattedDate)
  );
}

function resolveActivityDateLabel(activity: TimelineActivity): string | null {
  return (
    activity.formattedDate ??
    fmtFullDate(activity.currentDate ?? activity.originalDate) ??
    null
  );
}

function isCompletedActivity(a: TimelineActivity): boolean {
  return (a.status ?? "").toLowerCase() === "completed";
}

function isDelayedActivity(a: TimelineActivity): boolean {
  return (
    a.delayed === true ||
    (a.delayDays ?? 0) > 0 ||
    (a.status ?? "").toLowerCase() === "delayed"
  );
}

function isWeatherAffected(a: TimelineActivity): boolean {
  if (!a.weatherDecision) return false;
  const severity = (a.weatherDecision.severity ?? "").toLowerCase();
  return (
    a.weatherDecision.safe === false ||
    isDelayedActivity(a) ||
    severity === "high" ||
    severity === "critical" ||
    severity === "medium"
  );
}

function sortByActivityDate(a: TimelineActivity, b: TimelineActivity): number {
  const da = resolveActivityDateObj(a);
  const db = resolveActivityDateObj(b);
  if (da && db) return da.getTime() - db.getTime();
  if (da && !db) return -1;
  if (!da && db) return 1;
  const wa = Number(a.weekNumber ?? a.week ?? 0) || 0;
  const wb = Number(b.weekNumber ?? b.week ?? 0) || 0;
  return wa - wb;
}

interface ProgressStats {
  total: number;
  completed: number;
  delayed: number;
  upcoming: number;
  percent: number;
}

function computeProgress(timeline: TimelineActivity[]): ProgressStats {
  const total = timeline.length;
  const completed = timeline.filter(isCompletedActivity).length;
  const delayed = timeline.filter(a => isDelayedActivity(a) && !isCompletedActivity(a)).length;
  const upcoming = Math.max(total - completed - delayed, 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, delayed, upcoming, percent };
}

function daysRemainingLabel(activity: TimelineActivity): string | null {
  const d = resolveActivityDateObj(activity);
  if (isDelayedActivity(activity) && has(activity.delayDays)) {
    return `Delayed by ${activity.delayDays} day${activity.delayDays === 1 ? "" : "s"}`;
  }
  if (!d) return null;
  if (isCompletedActivity(activity)) return "Completed";
  const diffDays = Math.round(
    (startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Starts today";
  if (diffDays === 1) return "Starts tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`;
  return `In ${diffDays} days`;
}

type ActivityFilter = "all" | "scheduled" | "completed" | "delayed" | "weather";
type ViewMode = "timeline" | "month" | "week";

function applyFilter(timeline: TimelineActivity[], filter: ActivityFilter): TimelineActivity[] {
  switch (filter) {
    case "completed":
      return timeline.filter(isCompletedActivity);
    case "delayed":
      return timeline.filter(a => isDelayedActivity(a) && !isCompletedActivity(a));
    case "weather":
      return timeline.filter(isWeatherAffected);
    case "scheduled":
      return timeline.filter(a => !isCompletedActivity(a) && !isDelayedActivity(a));
    default:
      return timeline;
  }
}

// Severity → visual style (shared with the Weather Insights page conventions)
function severityStyle(sev?: string): { text: string; cls: string; dotCls: string } {
  switch ((sev ?? "").toLowerCase()) {
    case "critical":
    case "high":
      return {
        text: "High Risk",
        cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
        dotCls: "bg-red-500",
      };
    case "medium":
      return {
        text: "Medium Risk",
        cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
        dotCls: "bg-amber-500",
      };
    case "low":
      return {
        text: "Low Risk",
        cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30",
        dotCls: "bg-green-500",
      };
    default:
      return {
        text: safe(sev, "Unknown"),
        cls: "bg-muted text-muted-foreground border-border",
        dotCls: "bg-muted-foreground",
      };
  }
}

function statusStyle(activity: TimelineActivity): { text: string; cls: string } {
  if (isCompletedActivity(activity)) {
    return {
      text: "Completed",
      cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30",
    };
  }
  if (isDelayedActivity(activity)) {
    return {
      text: "Delayed",
      cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
    };
  }
  return {
    text: safe(activity.status, "Scheduled"),
    cls: "bg-primary/10 text-primary border-primary/20",
  };
}

function weatherIcon(condition?: string, cls = "h-5 w-5") {
  const c = (condition ?? "").toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return <CloudLightning className={cls} />;
  if (c.includes("snow")) return <CloudSnow className={cls} />;
  if (c.includes("heavy rain") || c.includes("rain")) return <CloudRain className={cls} />;
  if (c.includes("drizzle")) return <CloudDrizzle className={cls} />;
  if (c.includes("cloud")) return <Cloud className={cls} />;
  if (c.includes("clear") || c.includes("sun")) return <Sun className={cls} />;
  return <Cloud className={cls} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ activity }: { activity: TimelineActivity }) {
  const s = statusStyle(activity);
  return <Badge className={s.cls}>{s.text}</Badge>;
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!has(severity)) return null;
  const s = severityStyle(severity);
  return (
    <Badge className={s.cls}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dotCls}`} />
      {s.text}
    </Badge>
  );
}

function SafeBadge({ safe: isSafe }: { safe?: boolean }) {
  if (isSafe === undefined) return null;
  return isSafe ? (
    <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30">
      <ShieldCheck className="h-3 w-3" /> Safe
    </Badge>
  ) : (
    <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30">
      <ShieldAlert className="h-3 w-3" /> Unsafe
    </Badge>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-primary"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function Skele({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skele className="h-28 rounded-2xl" />
      <Skele className="h-40 rounded-2xl" />
      <Skele className="h-14 rounded-2xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <Skele key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  badge,
  subtitle,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground ml-12">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITINERARY SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

const ItinerarySelector = memo(function ItinerarySelector({
  itineraries,
  selectedId,
  onSelect,
  loading,
}: {
  itineraries: ItineraryRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (!itineraries.length) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
        Crop Plan
      </label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={e => onSelect(e.target.value)}
          disabled={loading}
          aria-label="Select crop itinerary"
          className="appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer disabled:opacity-50 min-w-[200px]"
        >
          {itineraries.map(it => (
            <option key={it._id} value={it._id}>
              {resolveCropLabel(it) || "Crop Plan"}
              {it.location?.district ? ` — ${it.location.district}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CROP OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

const CropOverviewCard = memo(function CropOverviewCard({
  itinerary,
  progress,
  currentStage,
  nextActivity,
}: {
  itinerary: ItineraryRecord;
  progress: ProgressStats;
  currentStage: string;
  nextActivity: TimelineActivity | null;
}) {
  const crop = resolveCropLabel(itinerary);
  const location = resolveLocationLabel(itinerary);
  const nextLabel = nextActivity ? resolveActivityDateLabel(nextActivity) : null;

  const stats = [
    { label: "Total Activities", value: progress.total, icon: ListChecks, color: "text-primary" },
    { label: "Completed", value: progress.completed, icon: CheckCircle2, color: "text-green-600" },
    { label: "Delayed", value: progress.delayed, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Upcoming", value: progress.upcoming, icon: Clock, color: "text-sky-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
    >
      {/* Top band */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-display text-2xl font-bold">{safe(crop, "Crop Plan")}</h3>
          </div>
          {location && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              {location}
            </div>
          )}
        </div>
        <div className="sm:text-right shrink-0 w-full sm:w-48">
          <p className="text-sm font-semibold mb-1.5">{progress.percent}% Complete</p>
          <ProgressBar percent={progress.percent} />
        </div>
      </div>

      {/* Stage + Next activity */}
      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">
        <div className="px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Current Stage
          </p>
          <p className="text-sm font-bold">
            {safe(currentStage, progress.total > 0 ? "Cultivation Complete" : "Not started")}
          </p>
        </div>
        <div className="px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Next Activity
          </p>
          <p className="text-sm font-bold">
            {nextActivity ? safe(nextActivity.title, "Upcoming Activity") : "All activities complete"}
          </p>
          {nextLabel && <p className="text-xs text-muted-foreground mt-0.5">{nextLabel}</p>}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-t border-border">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className={`font-display text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — NEXT ACTIVITY HERO
// ─────────────────────────────────────────────────────────────────────────────

const NextActivityHero = memo(function NextActivityHero({
  activity,
  onView,
}: {
  activity: TimelineActivity | null;
  onView: () => void;
}) {
  if (!activity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-green-200/60 bg-green-50/60 dark:bg-green-500/8 dark:border-green-400/20 p-6 flex items-center gap-4"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/15">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-green-800 dark:text-green-300">
            All caught up
          </p>
          <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
            Every activity in this crop plan has been marked complete.
          </p>
        </div>
      </motion.div>
    );
  }

  const dateLabel = resolveActivityDateLabel(activity);
  const weekLabel = resolveWeekLabel(activity);
  const remaining = daysRemainingLabel(activity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-card p-6 sm:p-7"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
            Next Up
          </p>
          <h3 className="font-display text-2xl font-bold leading-snug">
            {safe(activity.title, "Upcoming Activity")}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-muted-foreground">
            {dateLabel && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {dateLabel}
              </span>
            )}
            {weekLabel && (
              <span className="flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-primary" />
                {weekLabel}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge activity={activity} />
            {remaining && (
              <Badge className="bg-card text-foreground border-border">
                <Clock className="h-3 w-3" />
                {remaining}
              </Badge>
            )}
          </div>
          {has(activity.description) && (
            <p className="text-sm text-foreground/80 leading-relaxed mt-3 max-w-xl">
              {activity.description}
            </p>
          )}
        </div>

        <button
          onClick={onView}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm shrink-0 self-start sm:self-center"
        >
          View Activity
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CALENDAR CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
];

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "delayed", label: "Delayed" },
  { key: "weather", label: "Weather affected" },
];

const CalendarControls = memo(function CalendarControls({
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  periodOffset,
  onPeriodChange,
  onToday,
  periodLabel,
}: {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  filter: ActivityFilter;
  onFilterChange: (f: ActivityFilter) => void;
  periodOffset: number;
  onPeriodChange: (delta: number) => void;
  onToday: () => void;
  periodLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Period navigation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPeriodChange(-1)}
          aria-label="Previous period"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onToday}
          className={`h-9 px-3.5 rounded-lg border text-xs font-semibold transition ${
            periodOffset === 0
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => onPeriodChange(1)}
          aria-label="Next period"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="hidden sm:inline text-xs font-medium text-muted-foreground ml-2">
          {periodLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode tabs */}
        <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => onViewModeChange(mode.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === mode.key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={filter}
            onChange={e => onFilterChange(e.target.value as ActivityFilter)}
            aria-label="Filter activities"
            className="appearance-none rounded-lg border border-border bg-card pl-8 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
          >
            {FILTERS.map(f => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY CARD (shared by Timeline / Month / Week views)
// ─────────────────────────────────────────────────────────────────────────────

const ActivityCard = memo(function ActivityCard({
  activity,
  domId,
  highlighted,
  index,
}: {
  activity: TimelineActivity;
  domId?: string;
  highlighted?: boolean;
  index: number;
}) {
  const decision = activity.weatherDecision;
  const weekLabel = resolveWeekLabel(activity);
  const dateLabel = resolveActivityDateLabel(activity);
  const delayed = isDelayedActivity(activity) && !isCompletedActivity(activity);

  const cardBorder = delayed
    ? "border-amber-200/60 dark:border-amber-500/30"
    : isCompletedActivity(activity)
    ? "border-green-200/60 dark:border-green-500/30"
    : "border-border";

  return (
    <motion.div
      id={domId}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      className={`scroll-mt-24 rounded-2xl border bg-card shadow-card overflow-hidden transition ${cardBorder} ${
        highlighted ? "ring-2 ring-primary/50" : ""
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {weekLabel && (
              <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                {weekLabel}
              </Badge>
            )}
          </div>
          <p className="font-semibold text-sm leading-snug">{safe(activity.title, "Activity")}</p>
          {dateLabel && (
            <p className="flex items-center gap-1.5 text-xs text-primary font-medium mt-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {dateLabel}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <StatusBadge activity={activity} />
          {decision && <SafeBadge safe={decision.safe} />}
          {decision && <SeverityBadge severity={decision.severity} />}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {has(activity.description) && (
          <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
        )}

        {/* Weather decision block */}
        {decision ? (
          <div className="rounded-xl bg-muted/40 border border-border px-3.5 py-3 space-y-2">
            {has(decision.weatherCondition) && (
              <div className="flex items-center gap-2">
                <div className="text-primary">{weatherIcon(decision.weatherCondition, "h-4 w-4")}</div>
                <span className="text-sm font-medium">{decision.weatherCondition}</span>
              </div>
            )}
            {has(decision.reason) && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                  Reason
                </p>
                <p className="text-sm text-foreground leading-relaxed">{decision.reason}</p>
              </div>
            )}
            {has(decision.recommendation) && (
              <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-0.5">
                  Recommendation
                </p>
                <p className="text-sm leading-relaxed">{decision.recommendation}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Weather analysis not available for this activity.
          </p>
        )}

        {/* Delay block */}
        {delayed && (
          <div className="rounded-xl bg-amber-50/60 dark:bg-amber-500/8 border border-amber-200/60 dark:border-amber-400/20 px-3.5 py-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Delayed
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-amber-800 dark:text-amber-300">
              {activity.originalDate && (
                <span>Original: <strong>{fmtFullDate(activity.originalDate)}</strong></span>
              )}
              {activity.currentDate && (
                <span>Updated: <strong>{fmtFullDate(activity.currentDate)}</strong></span>
              )}
              {has(activity.delayDays) && (
                <span>Delay: <strong>{activity.delayDays} day{activity.delayDays === 1 ? "" : "s"}</strong></span>
              )}
            </div>
            {(activity.delayReason || decision?.reason) && (
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Reason: {activity.delayReason ?? decision?.reason}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — MAIN FARMING TIMELINE (timeline / month / week views)
// ─────────────────────────────────────────────────────────────────────────────

function activityDomId(itineraryId: string, globalIndex: number): string {
  return `activity-${itineraryId}-${globalIndex}`;
}

const TimelineListView = memo(function TimelineListView({
  activities,
  itineraryId,
  indexLookup,
  highlightIndex,
}: {
  activities: TimelineActivity[];
  itineraryId: string;
  indexLookup: Map<TimelineActivity, number>;
  highlightIndex: number | null;
}) {
  if (!activities.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No activities match the current filter.
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-4 sm:pl-6 before:absolute before:left-[7px] sm:before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
      {activities.map((activity, i) => {
        const globalIndex = indexLookup.get(activity) ?? i;
        return (
          <div key={globalIndex} className="relative">
            <span
              className={`absolute -left-4 sm:-left-6 top-6 h-3 w-3 rounded-full border-2 border-card ${
                isCompletedActivity(activity)
                  ? "bg-green-500"
                  : isDelayedActivity(activity)
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
            />
            <ActivityCard
              activity={activity}
              index={i}
              domId={activityDomId(itineraryId, globalIndex)}
              highlighted={highlightIndex === globalIndex}
            />
          </div>
        );
      })}
    </div>
  );
});

const MonthGroupedView = memo(function MonthGroupedView({
  activities,
  itineraryId,
  indexLookup,
  highlightIndex,
}: {
  activities: TimelineActivity[];
  itineraryId: string;
  indexLookup: Map<TimelineActivity, number>;
  highlightIndex: number | null;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, TimelineActivity[]>();
    for (const activity of activities) {
      const d = resolveActivityDateObj(activity);
      const key = d ? fmtMonthYear(d) : "Unscheduled";
      const list = map.get(key) ?? [];
      list.push(activity);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [activities]);

  if (!activities.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No activities match the current filter.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([month, list]) => (
        <div key={month}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
            {month}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((activity, i) => {
              const globalIndex = indexLookup.get(activity) ?? i;
              return (
                <ActivityCard
                  key={globalIndex}
                  activity={activity}
                  index={i}
                  domId={activityDomId(itineraryId, globalIndex)}
                  highlighted={highlightIndex === globalIndex}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

const WeekGroupedView = memo(function WeekGroupedView({
  activities,
  itineraryId,
  indexLookup,
  highlightIndex,
  windowStart,
  windowEnd,
}: {
  activities: TimelineActivity[];
  itineraryId: string;
  indexLookup: Map<TimelineActivity, number>;
  highlightIndex: number | null;
  windowStart: Date;
  windowEnd: Date;
}) {
  const inWindow = useMemo(
    () =>
      activities.filter(a => {
        const d = resolveActivityDateObj(a);
        if (!d) return false;
        return d >= windowStart && d <= windowEnd;
      }),
    [activities, windowStart, windowEnd]
  );

  if (!inWindow.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No farming activities scheduled for this week.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {inWindow.map((activity, i) => {
        const globalIndex = indexLookup.get(activity) ?? i;
        return (
          <ActivityCard
            key={globalIndex}
            activity={activity}
            index={i}
            domId={activityDomId(itineraryId, globalIndex)}
            highlighted={highlightIndex === globalIndex}
          />
        );
      })}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — WEATHER-AWARE SCHEDULING
// ─────────────────────────────────────────────────────────────────────────────

const WeatherAwareSection = memo(function WeatherAwareSection({
  timeline,
}: {
  timeline: TimelineActivity[];
}) {
  const withDecision = timeline.filter(a => a.weatherDecision);
  const affected = timeline.filter(isWeatherAffected);
  const delayed = timeline.filter(a => isDelayedActivity(a) && !isCompletedActivity(a));
  const safeActivities = withDecision.filter(a => a.weatherDecision?.safe === true);

  if (!withDecision.length) return null;

  const metrics = [
    { label: "Weather Checked", value: withDecision.length, icon: Gauge, color: "text-primary" },
    { label: "Activities Affected", value: affected.length, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Activities Delayed", value: delayed.length, icon: Clock, color: "text-amber-600" },
    { label: "Safe Activities", value: safeActivities.length, icon: ShieldCheck, color: "text-green-600" },
  ];

  return (
    <Section
      title="Weather-Aware Schedule"
      icon={ShieldAlert}
      subtitle="Your farming timeline automatically reflects weather conditions."
    >
      <div className="rounded-2xl border border-border bg-card shadow-card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {affected.length > 0 && (
        <div className="space-y-3">
          {affected.map((activity, i) => {
            const d = activity.weatherDecision;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-amber-200/60 dark:border-amber-400/20 bg-amber-50/50 dark:bg-amber-500/8 p-5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <p className="font-bold text-sm">{safe(activity.title, "Activity")}</p>
                  <div className="flex gap-2 flex-wrap">
                    <SeverityBadge severity={d?.severity} />
                    {d?.weatherCondition && (
                      <Badge className="bg-card text-muted-foreground border-border">
                        {weatherIcon(d.weatherCondition, "h-3 w-3")}
                        {d.weatherCondition}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground mb-2">
                  {activity.originalDate && (
                    <span>Original: <strong className="text-foreground">{fmtFullDate(activity.originalDate)}</strong></span>
                  )}
                  {activity.currentDate && (
                    <span>Suggested: <strong className="text-foreground">{fmtFullDate(activity.currentDate)}</strong></span>
                  )}
                </div>
                {has(d?.reason) && (
                  <p className="text-sm text-foreground leading-relaxed mb-1.5">{d?.reason}</p>
                )}
                {has(d?.recommendation) && (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 border-t border-amber-200/60 dark:border-amber-400/20 pt-2 mt-2">
                    Recommendation: {d?.recommendation}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — WEEKLY FARMING PLAN
// ─────────────────────────────────────────────────────────────────────────────

const ThisWeekSection = memo(function ThisWeekSection({
  timeline,
  windowStart,
  windowEnd,
}: {
  timeline: TimelineActivity[];
  windowStart: Date;
  windowEnd: Date;
}) {
  const items = useMemo(() => {
    return timeline
      .filter(a => {
        const d = resolveActivityDateObj(a);
        if (!d) return false;
        return d >= windowStart && d <= windowEnd;
      })
      .sort(sortByActivityDate);
  }, [timeline, windowStart, windowEnd]);

  return (
    <Section title="This Week" icon={CalendarDays}>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No farming activities scheduled for this week.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card divide-y divide-border overflow-hidden">
          {items.map((activity, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-20 shrink-0 text-xs font-bold text-primary">
                {fmtWeekdayDate(activity.currentDate ?? activity.originalDate)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{safe(activity.title, "Activity")}</p>
              </div>
              <StatusBadge activity={activity} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — UPCOMING ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────

const UpcomingSection = memo(function UpcomingSection({
  timeline,
}: {
  timeline: TimelineActivity[];
}) {
  const upcoming = useMemo(() => {
    const today = startOfDay(new Date());
    return timeline
      .filter(a => !isCompletedActivity(a))
      .filter(a => {
        const d = resolveActivityDateObj(a);
        return !d || d >= today;
      })
      .sort(sortByActivityDate)
      .slice(0, 8);
  }, [timeline]);

  return (
    <Section title="Upcoming Activities" icon={ListChecks}>
      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          This crop plan has no upcoming activities.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card divide-y divide-border overflow-hidden">
          {upcoming.map((activity, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-14 shrink-0 text-sm font-bold text-primary">
                {fmtShortDate(activity.currentDate ?? activity.originalDate) ?? "—"}
              </div>
              {resolveWeekLabel(activity) && (
                <Badge className="bg-muted text-muted-foreground border-border text-[10px] shrink-0">
                  {resolveWeekLabel(activity)}
                </Badge>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{safe(activity.title, "Activity")}</p>
              </div>
              <StatusBadge activity={activity} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — CULTIVATION PROGRESS (crop journey)
// ─────────────────────────────────────────────────────────────────────────────

const CultivationJourney = memo(function CultivationJourney({
  timeline,
}: {
  timeline: TimelineActivity[];
}) {
  if (!timeline.length) return null;

  const sorted = [...timeline].sort(sortByActivityDate);
  // First non-completed activity is the "current" stage.
  const currentIndex = sorted.findIndex(a => !isCompletedActivity(a));

  return (
    <Section title="Crop Journey" icon={Leaf}>
      <div className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6">
        <div className="flex flex-col gap-0">
          {sorted.map((activity, i) => {
            const stage = resolveStageLabel(activity.title);
            const completed = isCompletedActivity(activity);
            const delayed = isDelayedActivity(activity) && !completed;
            const isCurrent = i === currentIndex;
            const isLast = i === sorted.length - 1;

            const dotCls = completed
              ? "bg-green-500 border-green-500"
              : isCurrent
              ? "bg-primary border-primary ring-4 ring-primary/20"
              : delayed
              ? "bg-amber-500 border-amber-500"
              : "bg-card border-border";

            const textCls = completed
              ? "text-green-700 dark:text-green-400"
              : isCurrent
              ? "text-primary font-bold"
              : delayed
              ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground";

            return (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 mt-1 ${dotCls}`} />
                  {!isLast && <span className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <p className={`text-sm ${textCls}`}>{safe(stage, activity.title)}</p>
                  {isCurrent && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70 mt-0.5">
                      Current stage
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — DELAY SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

const DelaySummarySection = memo(function DelaySummarySection({
  timeline,
}: {
  timeline: TimelineActivity[];
}) {
  const delayed = timeline.filter(a => isDelayedActivity(a));
  if (!delayed.length) return null;

  const totalDays = delayed.reduce((sum, a) => sum + (a.delayDays ?? 0), 0);
  const mostAffected = [...delayed].sort(
    (a, b) => (b.delayDays ?? 0) - (a.delayDays ?? 0)
  )[0];

  return (
    <Section title="Weather Delays" icon={AlertTriangle}>
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-400/20 bg-amber-50/50 dark:bg-amber-500/8 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-1">
          <div>
            <p className="font-display text-2xl font-bold text-amber-700 dark:text-amber-400">
              {delayed.length}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              activit{delayed.length === 1 ? "y" : "ies"} delayed
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-amber-700 dark:text-amber-400">
              {totalDays}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              total day{totalDays === 1 ? "" : "s"} delayed
            </p>
          </div>
          {mostAffected && (
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 truncate">
                {safe(mostAffected.title, "Activity")}
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">most affected activity</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {delayed.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-amber-200/60 dark:border-amber-400/20 bg-card p-5 flex items-start justify-between gap-4 flex-wrap"
          >
            <div className="min-w-0">
              <p className="font-semibold text-sm">{safe(activity.title, "Activity")}</p>
              {(activity.delayReason ?? activity.weatherDecision?.reason) && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                  Reason: {activity.delayReason ?? activity.weatherDecision?.reason}
                </p>
              )}
            </div>
            {has(activity.delayDays) && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 shrink-0">
                +{activity.delayDays} day{activity.delayDays === 1 ? "" : "s"}
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY / ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────

function NoItineraries() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-20 text-center gap-4"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <Leaf className="h-10 w-10 text-primary/50" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold">No crop plans yet</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          Generate an AI crop plan to start your farming calendar.
        </p>
      </div>
      <Link
        to="/renter/ai/generate"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
      >
        Generate Crop Plan
      </Link>
    </motion.div>
  );
}

function CalendarError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
      <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-sm">Unable to load your crop calendar</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again.</p>
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function CropCalendarPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Load farmer's itineraries ─────────────────────────────────────────────
  const {
    data: itineraries = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ai-reports"],
    queryFn: fetchItineraries,
    retry: 1,
    staleTime: 60_000,
  });

  // Auto-select the most recent itinerary on load
  useEffect(() => {
    if (!itineraries.length || selectedId) return;
    const sorted = [...itineraries].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    setSelectedId(sorted[0]._id);
    console.log("[Crop Calendar] Selected itinerary:", sorted[0]._id);
  }, [itineraries, selectedId]);

  const selectedItinerary = useMemo(
    () => itineraries.find(it => it._id === selectedId) ?? null,
    [itineraries, selectedId]
  );

  const timeline = useMemo(() => selectedItinerary?.timeline ?? [], [selectedItinerary]);
  const sortedTimeline = useMemo(() => [...timeline].sort(sortByActivityDate), [timeline]);

  // Stable index lookup so every view (timeline/month/week) resolves the
  // same DOM id + highlight target for a given activity object.
  const indexLookup = useMemo(() => {
    const map = new Map<TimelineActivity, number>();
    sortedTimeline.forEach((a, i) => map.set(a, i));
    return map;
  }, [sortedTimeline]);

  const progress = useMemo(() => computeProgress(timeline), [timeline]);

  const nextActivity = useMemo(
    () => sortedTimeline.find(a => !isCompletedActivity(a)) ?? null,
    [sortedTimeline]
  );

  const currentStage = useMemo(
    () => (nextActivity ? resolveStageLabel(nextActivity.title) : ""),
    [nextActivity]
  );

  const filteredTimeline = useMemo(
    () => applyFilter(sortedTimeline, filter),
    [sortedTimeline, filter]
  );

  // Rolling 7-day window used by "This Week" + the Week view, shifted by
  // periodOffset (in weeks) via the calendar controls.
  const windowStart = useMemo(
    () => startOfDay(addDays(new Date(), periodOffset * 7)),
    [periodOffset]
  );
  const windowEnd = useMemo(() => addDays(windowStart, 6), [windowStart]);
  const periodLabel = useMemo(
    () => `${fmtShortDate(windowStart.toISOString())} – ${fmtFullDate(windowEnd.toISOString())}`,
    [windowStart, windowEnd]
  );

  const handleViewActivity = useCallback(() => {
    if (!selectedItinerary || !nextActivity) return;
    const idx = indexLookup.get(nextActivity);
    if (idx === undefined) return;
    setHighlightIndex(idx);
    const el = document.getElementById(activityDomId(selectedItinerary._id, idx));
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setHighlightIndex(null), 2000);
  }, [selectedItinerary, nextActivity, indexLookup]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Link to="/renter/ai" className="hover:text-primary transition-colors">
          AI Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Crop Calendar</span>
      </nav>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Crop Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-lg">
            Your complete farming schedule, optimized around crop activities and weather conditions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {!isLoading && itineraries.length > 0 && (
            <ItinerarySelector
              itineraries={itineraries}
              selectedId={selectedId}
              onSelect={id => {
                setSelectedId(id);
                setPeriodOffset(0);
                console.log("[Crop Calendar] Selected itinerary:", id);
              }}
              loading={isRefreshing}
            />
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh schedule"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing…" : "Refresh Schedule"}
          </button>
        </div>
      </motion.div>

      {/* No itineraries */}
      {!isLoading && !isError && itineraries.length === 0 && <NoItineraries />}

      {/* Loading */}
      {isLoading && <CalendarSkeleton />}

      {/* Error */}
      {!isLoading && isError && <CalendarError onRetry={() => refetch()} />}

      {/* Main content */}
      <AnimatePresence>
        {!isLoading && !isError && selectedItinerary && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Section 1 — Crop overview */}
            <CropOverviewCard
              itinerary={selectedItinerary}
              progress={progress}
              currentStage={currentStage}
              nextActivity={nextActivity}
            />

            {/* Section 2 — Next activity hero */}
            <NextActivityHero activity={nextActivity} onView={handleViewActivity} />

            {/* Section 3 — Calendar controls */}
            <CalendarControls
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              filter={filter}
              onFilterChange={setFilter}
              periodOffset={periodOffset}
              onPeriodChange={delta => setPeriodOffset(p => p + delta)}
              onToday={() => setPeriodOffset(0)}
              periodLabel={periodLabel}
            />

            {/* Section 4 — Main farming timeline */}
            <Section
              title="Farming Timeline"
              icon={CalendarDays}
              badge={
                <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {filteredTimeline.length} activities
                </span>
              }
            >
              {viewMode === "timeline" && (
                <TimelineListView
                  activities={filteredTimeline}
                  itineraryId={selectedItinerary._id}
                  indexLookup={indexLookup}
                  highlightIndex={highlightIndex}
                />
              )}
              {viewMode === "month" && (
                <MonthGroupedView
                  activities={filteredTimeline}
                  itineraryId={selectedItinerary._id}
                  indexLookup={indexLookup}
                  highlightIndex={highlightIndex}
                />
              )}
              {viewMode === "week" && (
                <WeekGroupedView
                  activities={filteredTimeline}
                  itineraryId={selectedItinerary._id}
                  indexLookup={indexLookup}
                  highlightIndex={highlightIndex}
                  windowStart={windowStart}
                  windowEnd={windowEnd}
                />
              )}
            </Section>

            {/* Section 5 — Weather-aware scheduling */}
            <WeatherAwareSection timeline={timeline} />

            {/* Section 6 — This week */}
            <ThisWeekSection timeline={timeline} windowStart={windowStart} windowEnd={windowEnd} />

            {/* Section 7 — Upcoming activities */}
            <UpcomingSection timeline={timeline} />

            {/* Section 8 — Cultivation progress */}
            <CultivationJourney timeline={timeline} />

            {/* Section 9 — Delay summary (only if delays exist) */}
            <DelaySummarySection timeline={timeline} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}