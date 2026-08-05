import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import {
  Sparkles,
  Sprout,
  FileText,
  CloudRain,
  IndianRupee,
  Calendar,
  ChevronRight,
  ArrowRight,
  Thermometer,
  Droplets,
  Umbrella,
  Cloud,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/renter/ai/")({
  head: () => ({ meta: [{ title: "FarmFleet AI — Dashboard" }] }),
  component: AIDashboard,
});

/* ─── Types ─────────────────────────────────────────────────────── */

interface AIReportPlaceholder {
  crop: string;
}

interface FarmingTip {
  icon: React.ElementType;
  title: string;
  description: string;
}

/* ─── Section Header ─────────────────────────────────────────────── */
/* Mirrors the SectionHeader pattern used across the renter dashboard. */

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {action}
    </div>
  );
}

/* ─── AI Quick Action Card ────────────────────────────────────────── */
/* Same rounded / hover-lift / arrow language as the renter dashboard's
   Quick Actions, kept local to this route per the brief. */

function AIQuickActionCard({
  to,
  icon: Icon,
  label,
  description,
  featured = false,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-4 rounded-2xl border ${
        featured ? "border-primary/30" : "border-border"
      } bg-card p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-200`}
    >
      {featured && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wide">
          AI Powered
        </span>
      )}
      <div
        className={`h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 ${
          featured ? "shadow-md" : "shadow-sm"
        }`}
      >
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors duration-200">
          {description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
    </Link>
  );
}

/* ─── Recent Report Placeholder Card ─────────────────────────────── */
/* No API / no dummy table — a clean empty-state card per report slot. */

function ReportPlaceholderCard({ report, index }: { report: AIReportPlaceholder; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-xl bg-light flex items-center justify-center flex-shrink-0">
          <Sprout className="h-5 w-5 text-primary" />
        </div>
        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
          No Data
        </span>
      </div>

      <div>
        <p className="font-display font-semibold text-sm">{report.crop}</p>
        <p className="text-xs text-muted-foreground mt-1">No AI reports generated yet.</p>
      </div>

      <button
        disabled
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-xs font-semibold px-3 py-2 cursor-not-allowed opacity-60"
      >
        View Report
      </button>
    </motion.div>
  );
}

/* ─── Weather Metric ─────────────────────────────────────────────── */

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-white/60 border border-border/60 px-3 py-4 text-center">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-lg font-display font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── Farming Tip Card ────────────────────────────────────────────── */

function TipCard({ tip, index }: { tip: FarmingTip; index: number }) {
  const Icon = tip.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-200"
    >
      <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <p className="font-display font-semibold text-sm leading-snug">{tip.title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.description}</p>
      </div>
    </motion.div>
  );
}

/* ─── Main AI Dashboard ───────────────────────────────────────────── */

function AIDashboard() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Placeholder slots only — no API call, no dummy data table.
  const recentReports: AIReportPlaceholder[] = [
    { crop: "Cotton" },
    { crop: "Wheat" },
    { crop: "Sugarcane" },
  ];

  const farmingTips: FarmingTip[] = [
    {
      icon: Sprout,
      title: "Prepare soil before sowing",
      description: "Plough and level your field ahead of time for stronger, more even germination.",
    },
    {
      icon: Umbrella,
      title: "Monitor rainfall before irrigation",
      description: "Check upcoming rainfall so you don't over-water or waste an irrigation cycle.",
    },
    {
      icon: Eye,
      title: "Inspect crops every week",
      description: "Regular field walks help you catch pests and disease early, before they spread.",
    },
  ];

  return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">

        {/* ── Page Header ───────────────────────────────────────── */}
        {/* <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="text-sm text-muted-foreground font-medium">{today}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1 flex items-center gap-2.5">
            <span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </span>
            FarmFleet AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate intelligent farming plans powered by AI and weather insights.
          </p>
        </motion.div> */}

        {/* ── Statistics ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <StatCard
            title="Active Crop Plans"
            value={0}
            icon={Sprout}
            tone="primary"
            index={0}
          />
          <StatCard
            title="Generated Reports"
            value={0}
            icon={FileText}
            tone="secondary"
            index={1}
          />
          <StatCard
            title="Weather Alerts"
            value={0}
            icon={CloudRain}
            tone="warning"
            index={2}
          />
          <StatCard
            title="Expected Profit"
            value="₹0"
            icon={IndianRupee}
            tone="info"
            index={3}
          />
        </motion.div>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <SectionHeader title="Quick Actions" />
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <AIQuickActionCard
              to="/renter/ai/generate"
              icon={Sparkles}
              label="Generate Crop Plan"
              description="Create a new AI crop itinerary"
              featured
            />
            <AIQuickActionCard
              to="/renter/ai/reports"
              icon={FileText}
              label="My Reports"
              description="View previously generated reports"
            />
            <AIQuickActionCard
              to="/renter/ai/weather"
              icon={CloudRain}
              label="Weather Insights"
              description="View weather analysis"
            />
            <AIQuickActionCard
              to="/renter/ai/calendar"
              icon={Calendar}
              label="Crop Calendar"
              description="View farming schedule"
            />
          </div>
        </motion.div>

        {/* ── Recent AI Reports ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <SectionHeader
            title="Recent AI Reports"
            action={
              <Link
                to="/renter/ai/reports"
                className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all duration-200"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentReports.map((report, i) => (
              <ReportPlaceholderCard key={report.crop} report={report} index={i} />
            ))}
          </div>
        </motion.div>

        {/* ── Weather Overview ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <SectionHeader title="Weather Overview" />
          <div className="rounded-2xl border border-border bg-gradient-to-br from-light to-card p-5 sm:p-6 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <p className="font-display font-semibold text-sm">Current Conditions</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
                Awaiting Data
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <WeatherMetric icon={Thermometer} label="Temperature" value="—" />
              <WeatherMetric icon={Droplets} label="Humidity" value="—" />
              <WeatherMetric icon={Umbrella} label="Rain Probability" value="—" />
              <WeatherMetric icon={Cloud} label="Status" value="—" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Live weather insights will appear here once you generate your first AI crop plan.
            </p>
          </div>
        </motion.div>

        {/* ── AI Farming Tips ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <SectionHeader title="AI Farming Tips" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {farmingTips.map((tip, i) => (
              <TipCard key={tip.title} tip={tip} index={i} />
            ))}
          </div>
        </motion.div>

        <div className="h-4" />
      </section>
  );
}