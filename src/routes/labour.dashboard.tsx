import type { Step } from "react-joyride";
import { OnboardingTour } from "@/components/OnboardingTour";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { LabourProfileCard, type LabourProfileData } from "../components/LabourProfileCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Briefcase,
  Clock3,
  CheckCircle2,
  BadgeCheck,
  IndianRupee,
  Star,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  BarChart2,
  ClipboardList,
  MapPin,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/labour/dashboard")({
  head: () => ({ meta: [{ title: "Labour Dashboard — FarmFleet AI" }] }),
  component: LabourDashboard,
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface MonthlyEarning {
  month: string;
  earnings: number;
}

interface RecentRequest {
  _id: string;

  farmer?: {
    _id?: string;
    fullName?: string;
    mobile?: string;
    village?: string;
    district?: string;
    profileImage?: string;
  } | null;

  labour?: string;

  booking?: string | null;

  equipment?: {
    _id?: string;
    name?: string;
    image?: string;
  } | null;

  startDate?: string;
  endDate?: string;

  dailyCharges?: number;
  totalAmount?: number;

  status?: "pending" | "accepted" | "completed" | "rejected" | "cancelled" | string;

  createdAt: string;
}

// LabourProfileData fields are treated as optional here since the backend may
// omit them; we normalize before handing off to <LabourProfileCard />.
interface LabourProfile extends Partial<LabourProfileData> {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  rating?: number;
  primarySkill?: string;
  experience?: number | string;
  dailyCharges?: number;
  profileImage?: string;
}

interface DashboardStatistics {
  totalJobs?: number;
  pendingRequests?: number;
  acceptedJobs?: number;
  completedJobs?: number;
  rejectedJobs?: number;
  totalEarnings?: number;
  monthlyEarnings?: MonthlyEarning[];
}

interface DashboardData {
  labour?: LabourProfile;
  statistics?: DashboardStatistics;
  recentRequests?: RecentRequest[];
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API = `${API_BASE}/api/labour`;

function authHeaders() {
  const token = localStorage.getItem("labourToken") ?? localStorage.getItem("token") ?? "";
  return { Authorization: `Bearer ${token}` };
}

/** Resolves an image path against the backend host, or passes through
 * absolute URLs (e.g. Cloudinary) unchanged. Returns null if no path. */
function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

// ─── Animated counter ─────────────────────────────────────────────────────────

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
      {decimals > 0 ? val.toFixed(decimals) : val.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Skeleton stat cards ──────────────────────────────────────────────────────

function SkeletonStatCards() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-5 animate-pulse"
        >
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

// ─── Skeleton chart card ──────────────────────────────────────────────────────

function SkeletonChartCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="p-5 pb-0 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="p-5">
        <div className="h-48 w-full rounded-xl bg-muted" />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertTriangle className="h-10 w-10 text-destructive/60" />
      <p className="font-semibold">Failed to load dashboard</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Something went wrong while fetching your dashboard data.
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

// ─── Empty chart state ────────────────────────────────────────────────────────

function EmptyChartState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-48 gap-3 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
        <BarChart2 className="h-8 w-8 text-primary/50" />
      </div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Data will appear here once you have completed jobs.
      </p>
    </motion.div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  icon,
  accent,
  delay,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-card ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-3xl"
        style={{ background: accent }}
      />
      <div className="p-5 pb-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${accent}20`, color: accent }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 pt-4">{children}</div>
    </motion.div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-elevated px-3 py-2 text-xs">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold">
            {prefix}
            {typeof p.value === "number"
              ? p.value.toLocaleString("en-IN")
              : p.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({
  icon,
  label,
  value,
  bg,
  border,
  iconColor,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  border: string;
  iconColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-2xl ${bg} ${border} border p-4 flex items-center gap-3`}
    >
      <div className={iconColor}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display font-semibold">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-orange-500/15", text: "text-orange-600" },
  accepted: { label: "Accepted", bg: "bg-blue-500/15", text: "text-blue-600" },
  completed: { label: "Completed", bg: "bg-green-500/15", text: "text-green-600" },
  rejected: { label: "Rejected", bg: "bg-red-500/15", text: "text-red-600" },
  cancelled: { label: "Cancelled", bg: "bg-zinc-500/15", text: "text-zinc-500" },
};

function StatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  const s = status?.toLowerCase() ?? "pending";
  const label = t(`status.${s}`, { defaultValue: t(`labour.${s}`, { defaultValue: s }) });
  const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}
    >
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function LabourDashboard() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tourSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="labour-profile"]',
        title: t("tour.labourDashboard.profileTitle"),
        content: t("tour.labourDashboard.profileContent"),
      },
      {
        target: '[data-tour="labour-stats"]',
        title: t("tour.labourDashboard.statsTitle"),
        content: t("tour.labourDashboard.statsContent"),
      },
      {
        target: '[data-tour="labour-earnings-chart"]',
        title: t("tour.labourDashboard.earningsChartTitle"),
        content: t("tour.labourDashboard.earningsChartContent"),
      },
      {
        target: '[data-tour="labour-requests"]',
        title: t("tour.labourDashboard.requestsTitle"),
        content: t("tour.labourDashboard.requestsContent"),
      },
    ],
    [t]
  );

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(`${API}/dashboard`, {
        headers: authHeaders(),
      });

      console.log("Dashboard Response:", data);

      // Backend may nest the payload under `dashboard`, `data`, or return it
      // flat at the top level — support all three shapes without guessing.
      const payload: DashboardData = data?.dashboard ?? data?.data ?? data ?? {};

      setDashboard(payload);
    } catch (err) {
      console.error("Dashboard Error:", err);

      if (axios.isAxiosError(err)) {
        console.error("Backend message:", err.response?.data);
      }

      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hasMonthlyData = useMemo(
    () => (dashboard?.statistics?.monthlyEarnings?.length ?? 0) > 0,
    [dashboard]
  );

  const hasRecentRequests = useMemo(
    () => (dashboard?.recentRequests?.length ?? 0) > 0,
    [dashboard]
  );

  // Normalize the labour profile once so every consumer (stat cards, insight
  // cards, <LabourProfileCard />) gets safe, pre-resolved values.
  const safeLabour = useMemo(() => {
    const l = dashboard?.labour;
    return {
      ...l,
      fullName: l?.fullName ?? "Labour",
      rating: l?.rating ?? 0,
      primarySkill: l?.primarySkill ?? "Not specified",
      experience: l?.experience ?? 0,
      dailyCharges: l?.dailyCharges ?? 0,
      profileImage: getImageUrl(l?.profileImage) ?? undefined,
    } as LabourProfileData & LabourProfile;
  }, [dashboard]);

  const stats = dashboard?.statistics;

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-primary">
              Labour Dashboard
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
              {loading || !dashboard
                ? "Labour Dashboard"
                : `Welcome back, ${safeLabour.fullName}`}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Manage your labour requests, earnings and daily work.
            </p>
          </div>
          <OnboardingTour
            tourKey="farmfleet_tour_seen_labour"
            steps={tourSteps}
          />
        </motion.div>

        {/* Stat Cards */}
        <div data-tour="labour-stats" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AnimatePresence>
            {loading ? (
              <SkeletonStatCards />
            ) : error ? null : (
              <>
                <StatCard
                  icon={<Briefcase className="h-5 w-5" />}
                  label="Total Jobs"
                  value={stats?.totalJobs ?? 0}
                  accent="#22c55e"
                  delay={0.05}
                />
                <StatCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Pending Requests"
                  value={stats?.pendingRequests ?? 0}
                  accent="#f59e0b"
                  delay={0.1}
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Accepted Jobs"
                  value={stats?.acceptedJobs ?? 0}
                  accent="#3b82f6"
                  delay={0.15}
                />
                <StatCard
                  icon={<BadgeCheck className="h-5 w-5" />}
                  label="Completed Jobs"
                  value={stats?.completedJobs ?? 0}
                  accent="#a855f7"
                  delay={0.2}
                />
                <StatCard
                  icon={<IndianRupee className="h-5 w-5" />}
                  label="Total Earnings"
                  value={stats?.totalEarnings ?? 0}
                  accent="#22c55e"
                  delay={0.25}
                  prefix="₹"
                />
                <StatCard
                  icon={<Star className="h-5 w-5" />}
                  label="Rating"
                  value={safeLabour.rating ?? 0}
                  accent="#eab308"
                  delay={0.3}
                  decimals={1}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Error state */}
        {error && !loading && <ErrorState onRetry={fetchDashboard} />}

        {/* Charts + content */}
        {!loading && !error && dashboard && (
          <>
            {/* Earnings Chart + Labour Profile */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div data-tour="labour-earnings-chart" className="lg:col-span-2">
                <ChartCard
                  title="Labour Earnings"
                  subtitle="Revenue earned per month"
                  icon={<IndianRupee className="h-4 w-4" />}
                  accent="#22c55e"
                  delay={0.35}
                >
                  {hasMonthlyData ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={stats?.monthlyEarnings ?? []}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="labourEarnGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="month"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip prefix="₹" />} />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke="#22c55e"
                          strokeWidth={2.5}
                          fill="url(#labourEarnGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: "#22c55e" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState label="No monthly earnings data yet" />
                  )}
                </ChartCard>
              </div>

              {/* Labour Profile */}
              <div data-tour="labour-profile">
                <LabourProfileCard labour={safeLabour} delay={0.4} />
              </div>
            </div>

            {/* Recent Labour Requests + Insights */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div data-tour="labour-requests" className="lg:col-span-2">
                <ChartCard
                  title="Recent Requests"
                  subtitle="Latest job requests"
                  icon={<ClipboardList className="h-4 w-4" />}
                  accent="#a855f7"
                  delay={0.45}
                >
                {hasRecentRequests ? (
                  <ul className="space-y-3 max-h-[280px] overflow-auto pr-1">
                    {(dashboard.recentRequests ?? []).map((r, i) => {
                      const avatarUrl = getImageUrl(r?.farmer?.profileImage);
                      return (
                        <motion.li
                          key={r?._id ?? i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.05, duration: 0.3 }}
                          className="flex items-center gap-3 rounded-xl border border-border p-3"
                        >
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={r?.farmer?.fullName ?? "Farmer"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-display font-semibold text-muted-foreground">
                                {r?.farmer?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm leading-snug truncate">
                              {r?.farmer?.fullName ?? "Unknown Farmer"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {r?.farmer?.village ?? r?.farmer?.district ?? "—"}
                              <span className="mx-1">•</span>
                              <Wrench className="h-3 w-3 flex-shrink-0" />
                              {r?.equipment?.name ?? "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {r?.createdAt
                                ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <p className="font-display font-semibold text-sm">
                              ₹{(r?.totalAmount ?? 0).toLocaleString("en-IN")}
                            </p>
                            <StatusBadge status={r?.status} />
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyChartState label="No recent requests" />
                )}
              </ChartCard>
            </div>

              {/* Statistics / Insights */}
              <div className="grid gap-3 content-start">
                <InsightCard
                  icon={<Briefcase className="h-5 w-5" />}
                  label="Primary Skill"
                  value={safeLabour.primarySkill ?? "Not specified"}
                  bg="bg-green-500/5"
                  border="border-green-500/20"
                  iconColor="text-green-600"
                  delay={0.5}
                />
                <InsightCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Experience"
                  value={String(safeLabour.experience ?? 0)}
                  bg="bg-blue-500/5"
                  border="border-blue-500/20"
                  iconColor="text-blue-600"
                  delay={0.55}
                />
                <InsightCard
                  icon={<IndianRupee className="h-5 w-5" />}
                  label="Daily Charges"
                  value={`₹${(safeLabour.dailyCharges ?? 0).toLocaleString("en-IN")}`}
                  bg="bg-purple-500/5"
                  border="border-purple-500/20"
                  iconColor="text-purple-600"
                  delay={0.6}
                />
              </div>
            </div>
          </>
        )}

        {/* Skeleton charts while loading */}
        {loading && (
          <>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SkeletonChartCard />
              </div>
              <SkeletonChartCard />
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SkeletonChartCard />
              </div>
              <div className="grid gap-3 content-start">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4 animate-pulse h-20"
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}