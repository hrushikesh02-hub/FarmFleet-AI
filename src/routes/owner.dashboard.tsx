import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { TopEquipmentCard } from "../components/TopEquipmentCard";
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
} from "recharts";
import {
  IndianRupee,
  Tractor,
  CalendarClock,
  Activity,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  BarChart2,
  Wrench,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/owner/dashboard")({
  head: () => ({ meta: [{ title: "Owner Dashboard — FarmFleet AI" }] }),
  component: OwnerDashboard,
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface MonthlyEarning {
  month: string;
  earnings: number;
}

interface EquipmentUsage {
  name: string;
  hours: number;
}

interface DashboardActivity {
  id?: string;
  text: string;
  time: string;
}

interface DashboardData {
  success: boolean;
  ownerName: string;
  totalEarnings: number;
  equipmentCount: number;
  activeRentals: number;
  upcomingJobs: number;
  utilization: number;
  trustRating: number;
  maintenanceDue: number;
  monthlyEarnings: MonthlyEarning[];
  equipmentUsage: EquipmentUsage[];
  activities: DashboardActivity[];
  topEquipment?: any;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API = `${API_BASE}/api/owner`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
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
      {Array.from({ length: 5 }).map((_, i) => (
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
        Data will appear here once you have completed bookings.
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

// ─── Main component ───────────────────────────────────────────────────────────

function OwnerDashboard() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(`${API}/dashboard`, {
        headers: authHeaders(),
      });
      setDashboard(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hasMonthlyData = useMemo(
    () => (dashboard?.monthlyEarnings?.length ?? 0) > 0,
    [dashboard]
  );

  const hasEquipmentData = useMemo(
    () => (dashboard?.equipmentUsage?.length ?? 0) > 0,
    [dashboard]
  );

  const hasActivities = useMemo(
    () => (dashboard?.activities?.length ?? 0) > 0,
    [dashboard]
  );

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
              Owner Dashboard
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
              {loading || !dashboard
                ? t("owner.dashboard")
                : t("owner.welcome", { name: dashboard.ownerName })}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Business overview and performance insights
            </p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <AnimatePresence>
            {loading ? (
              <SkeletonStatCards />
            ) : error ? null : (
              <>
                <StatCard
                  icon={<IndianRupee className="h-5 w-5" />}
                  label={t("owner.totalEarnings")}
                  value={dashboard?.totalEarnings ?? 0}
                  accent="#22c55e"
                  delay={0.05}
                  prefix="₹"
                />
                <StatCard
                  icon={<Tractor className="h-5 w-5" />}
                  label={t("owner.equipmentCount")}
                  value={dashboard?.equipmentCount ?? 0}
                  accent="#3b82f6"
                  delay={0.1}
                />
                <StatCard
                  icon={<Activity className="h-5 w-5" />}
                  label={t("owner.activeRentals")}
                  value={dashboard?.activeRentals ?? 0}
                  accent="#a855f7"
                  delay={0.15}
                />
                <StatCard
                  icon={<CalendarClock className="h-5 w-5" />}
                  label={t("owner.upcomingJobs")}
                  value={dashboard?.upcomingJobs ?? 0}
                  accent="#f59e0b"
                  delay={0.2}
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label={t("owner.utilization")}
                  value={dashboard?.utilization ?? 0}
                  accent="#6366f1"
                  delay={0.25}
                  suffix="%"
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
            {/* Monthly Earnings + Weather */}
            <div className="grid lg:grid-cols-3 gap-4">
              <ChartCard
                title={t("owner.monthlyEarnings")}
                subtitle="Revenue earned per month"
                icon={<Activity className="h-4 w-4" />}
                accent="#22c55e"
                delay={0.3}
                className="lg:col-span-2"
              >
                {hasMonthlyData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={dashboard.monthlyEarnings}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="dashEarnGrad" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#dashEarnGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: "#22c55e" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState label="No monthly earnings data yet" />
                )}
              </ChartCard>

              {/* Top Performing Equipment */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.35, duration: 0.4 }}
>
  <TopEquipmentCard
    equipment={dashboard?.topEquipment ?? null}
  />
</motion.div>
            </div>

            {/* Equipment Usage + Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-4">
              <ChartCard
                title={t("owner.equipmentUsage")}
                subtitle="Hours used per machine"
                icon={<Tractor className="h-4 w-4" />}
                accent="#3b82f6"
                delay={0.4}
                className="lg:col-span-2"
              >
                {hasEquipmentData ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={dashboard.equipmentUsage}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        interval={0}
                        angle={-12}
                        textAnchor="end"
                        height={52}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip suffix=" hrs" />} />
                      <Bar
                        dataKey="hours"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState label="No equipment usage data yet" />
                )}
              </ChartCard>

              {/* Recent Activity */}
              <ChartCard
                title={t("owner.recentActivity")}
                subtitle="Latest booking events"
                icon={<Activity className="h-4 w-4" />}
                accent="#a855f7"
                delay={0.45}
              >
                {hasActivities ? (
                  <ul className="space-y-3 max-h-[240px] overflow-auto pr-1">
                    {dashboard.activities.map((a, i) => (
                      <motion.li
                        key={a.id ?? i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.05, duration: 0.3 }}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium leading-snug">{a.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChartState label="No recent activity" />
                )}
              </ChartCard>
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
              <SkeletonChartCard />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-4 animate-pulse h-20"
                />
              ))}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}