import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  IndianRupee,
  TrendingUp,
  CalendarDays,
  Briefcase,
  Clock3,
  Activity,
  RefreshCw,
  AlertTriangle,
  BarChart2,
  ClipboardList,
  MapPin,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/labour/earnings")({
  head: () => ({ meta: [{ title: "Earnings — FarmFleet AI" }] }),
  component: LabourEarnings,
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface MonthlyLabourEarning {
  month: string;
  earnings: number;
  completedJobs: number;
}

interface LabourEarningsData {
  todayEarnings: number;
  thisMonth: number;
  totalEarnings: number;
  completedJobs: number;
  pendingJobs: number;
  averageDailyIncome: number;
}

interface RecentRequest {
  _id: string;
  totalAmount: number;
  status: "pending" | "accepted" | "completed" | "rejected" | string;
  farmer?: {
    fullName?: string;
    profileImage?: string;
    village?: string;
  };
  equipment?: {
    name?: string;
  };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = "http://localhost:5000/api/labour";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// ─── Status badge config (shared FarmFleet styling) ────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/15", text: "text-amber-600" },
  accepted: { label: "Accepted", bg: "bg-blue-500/15", text: "text-blue-600" },
  completed: { label: "Completed", bg: "bg-green-500/15", text: "text-green-600" },
  rejected: { label: "Rejected", bg: "bg-red-500/15", text: "text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
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

// ─── Skeleton card ────────────────────────────────────────────────────────────

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
      </div>
    </div>
  );
}

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

// ─── Recent Requests skeleton (4 rows, same card shell) ────────────────────────

function SkeletonRequestsCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="p-5 pb-0 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-3 w-36 rounded bg-muted" />
        </div>
      </div>
      <div className="p-5 pt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-12 rounded bg-muted ml-auto" />
              <div className="h-4 w-16 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertTriangle className="h-10 w-10 text-destructive/60" />
      <p className="font-semibold">Failed to load earnings</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Something went wrong while fetching your earnings data.
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
        Earnings data will appear here once you have completed jobs.
      </p>
    </motion.div>
  );
}

// ─── Empty requests state ──────────────────────────────────────────────────────

function EmptyRequestsState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-48 gap-3 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
        <ClipboardList className="h-8 w-8 text-primary/50" />
      </div>
      <p className="text-sm font-semibold">No Requests Yet</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Labour requests will appear here once farmers start sending you work requests.
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
  action,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  delay: number;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: `${accent}20`, color: accent }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
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

// ─── Recent Request row ─────────────────────────────────────────────────────

function RequestRow({ request, delay }: { request: RecentRequest; delay: number }) {
  const name = request.farmer?.fullName ?? "Unknown Farmer";
  const initials = name.charAt(0)?.toUpperCase() ?? "?";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="flex items-center gap-3 rounded-xl px-2 py-2.5 border-b border-border/60 last:border-0 transition-shadow hover:shadow-md"
    >
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border">
        {request.farmer?.profileImage ? (
          <img
            src={request.farmer.profileImage}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-display font-semibold text-muted-foreground">
            {initials}
          </span>
        )}
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm leading-snug truncate">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {request.farmer?.village ?? "—"}
          <span className="mx-0.5">•</span>
          {request.equipment?.name ?? "—"}
        </p>
      </div>

      {/* Amount + status */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <p className="font-display font-semibold text-sm text-primary flex items-center">
          <IndianRupee className="h-3.5 w-3.5" />
          {(request.totalAmount ?? 0).toLocaleString("en-IN")}
        </p>
        <StatusBadge status={request.status} />
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function LabourEarnings() {
  const [earnings, setEarnings] = useState<LabourEarningsData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyLabourEarning[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [summaryRes, monthlyRes, dashboardRes] = await Promise.all([
        axios.get(`${API}/earnings`, { headers: authHeaders() }),
        axios.get(`${API}/earnings/monthly`, { headers: authHeaders() }),
        axios.get(`${API}/dashboard`, { headers: authHeaders() }),
      ]);
      setEarnings(summaryRes.data);
      setMonthly(monthlyRes.data ?? []);
      setRecentRequests(dashboardRes.data?.dashboard?.recentRequests ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const hasMonthlyData = useMemo(() => monthly.length > 0, [monthly]);

  const latestRequests = useMemo(() => recentRequests.slice(0, 4), [recentRequests]);
  const hasRecentRequests = useMemo(() => latestRequests.length > 0, [latestRequests]);

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
              Earnings
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Track your daily, monthly and lifetime earnings from FarmFleet jobs.
            </p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AnimatePresence>
            {loading ? (
              <SkeletonStatCards />
            ) : error ? null : (
              <>
                <StatCard
                  icon={<IndianRupee className="h-5 w-5" />}
                  label="Today's Earnings"
                  value={earnings?.todayEarnings ?? 0}
                  accent="#22c55e"
                  delay={0.05}
                  prefix="₹"
                />
                <StatCard
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="This Month"
                  value={earnings?.thisMonth ?? 0}
                  accent="#3b82f6"
                  delay={0.1}
                  prefix="₹"
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Total Earnings"
                  value={earnings?.totalEarnings ?? 0}
                  accent="#a855f7"
                  delay={0.15}
                  prefix="₹"
                />
                <StatCard
                  icon={<Briefcase className="h-5 w-5" />}
                  label="Completed Jobs"
                  value={earnings?.completedJobs ?? 0}
                  accent="#f59e0b"
                  delay={0.2}
                />
                <StatCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Pending Jobs"
                  value={earnings?.pendingJobs ?? 0}
                  accent="#eab308"
                  delay={0.25}
                />
                <StatCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Average Daily Income"
                  value={earnings?.averageDailyIncome ?? 0}
                  accent="#14b8a6"
                  delay={0.3}
                  prefix="₹"
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Error state */}
        {error && !loading && <ErrorState onRetry={fetchEarnings} />}

        {/* Charts — only when data is available */}
        {!loading && !error && earnings && (
          <>
            {/* Monthly Earnings + Recent Requests */}
            <div className="grid lg:grid-cols-3 gap-4">
              <ChartCard
                title="Monthly Labour Earnings"
                subtitle="Revenue earned per month"
                icon={<Activity className="h-4 w-4" />}
                accent="#22c55e"
                delay={0.35}
                className="lg:col-span-2"
              >
                {hasMonthlyData ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={monthly}
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
                      <Tooltip
                        content={
                          <CustomTooltip prefix="₹" />
                        }
                      />
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

              <ChartCard
                title="Recent Requests"
                subtitle="Latest work requests received from farmers"
                icon={<ClipboardList className="h-4 w-4" />}
                accent="#a855f7"
                delay={0.4}
                action={
                  <Link
                    to="/labour/requests"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline flex-shrink-0"
                  >
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              >
                {hasRecentRequests ? (
                  <div>
                    {latestRequests.map((r, i) => (
                      <RequestRow key={r._id ?? i} request={r} delay={0.42 + i * 0.06} />
                    ))}
                  </div>
                ) : (
                  <EmptyRequestsState />
                )}
              </ChartCard>
            </div>

            {/* Completed Jobs per Month Bar Chart */}
            <ChartCard
              title="Completed Jobs per Month"
              subtitle="Number of jobs completed per month"
              icon={<BarChart2 className="h-4 w-4" />}
              accent="#f59e0b"
              delay={0.45}
            >
              {hasMonthlyData ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={monthly}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
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
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Bar
                      dataKey="completedJobs"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState label="No booking trend data yet" />
              )}
            </ChartCard>
          </>
        )}

        {/* Skeleton charts while loading */}
        {loading && (
          <>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SkeletonCard />
              </div>
              <SkeletonRequestsCard />
            </div>
            <SkeletonCard />
          </>
        )}
      </section>
    </AppShell>
  );
}