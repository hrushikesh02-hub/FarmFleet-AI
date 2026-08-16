import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api/api";
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
  AlertTriangle,
  RefreshCw,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/renter/ai/")({
  head: () => ({ meta: [{ title: "FarmFleet AI — Dashboard" }] }),
  component: AIDashboard,
});

/* ─── Backend Types ───────────────────────────────────────────────
   Mirrors the actual GET /api/ai/my-itineraries response. Optional
   fields are genuinely optional — never assume they exist. */

interface ItineraryLocation {
  state?: string;
  district?: string;
}

interface WeatherData {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  rain?: number;
  feelsLike?: number;
  condition?: string;
  description?: string;
  [key: string]: unknown;
}

interface WeatherDecision {
  safe?: boolean;
  delayDays?: number;
  severity?: string;
  weatherCondition?: string;
  reason?: string;
  warnings?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}

interface TimelineActivity {
  weatherDecision?: WeatherDecision;
  [key: string]: unknown;
}

interface CropItinerary {
  _id: string;
  farmer?: string;
  crop: string;
  location?: ItineraryLocation;
  bestSeason?: string;
  cropDuration?: string;
  budget?: string | number;
  estimatedTotalCost?: string | number;
  landArea?: string | number;
  soilType?: string;
  seedRecommendation?: unknown;
  landPreparation?: unknown;
  fertilizerSchedule?: unknown;
  irrigationSchedule?: unknown;
  weedManagement?: unknown;
  pestAndDiseaseManagement?: unknown;
  equipmentRequired?: unknown;
  labourRequirement?: unknown;
  precautions?: unknown;
  tips?: unknown;
  timeline?: TimelineActivity[];
  weather?: WeatherData;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastWeatherCheck?: string;
  waterSource?: string;
}

interface MyItinerariesResponse {
  success: boolean;
  count: number;
  itineraries: CropItinerary[];
}

interface FarmingTip {
  icon: React.ElementType;
  title: string;
  description: string;
}

type LoadState = "loading" | "success" | "error";

/* ─── Data Helpers ─────────────────────────────────────────────── */

function formatCurrency(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  const numeric = Number(value.replace(/[₹,\s]/g, ""));
  if (Number.isNaN(numeric)) return value;
  return `₹${numeric.toLocaleString("en-IN")}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLocation(location?: ItineraryLocation): string {
  if (!location) return "Location not specified";
  const parts = [location.district, location.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location not specified";
}

function isActiveStatus(status?: string): boolean {
  return (status ?? "").trim().toLowerCase() === "active";
}

function getActiveItineraries(itineraries: CropItinerary[]): CropItinerary[] {
  return itineraries.filter((item) => isActiveStatus(item.status));
}

function sortByCreatedDesc(itineraries: CropItinerary[]): CropItinerary[] {
  return [...itineraries].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function getRecentItineraries(itineraries: CropItinerary[], limit = 3): CropItinerary[] {
  return sortByCreatedDesc(itineraries).slice(0, limit);
}

function getSelectedItinerary(itineraries: CropItinerary[]): CropItinerary | null {
  if (itineraries.length === 0) return null;
  const sorted = sortByCreatedDesc(itineraries);
  const activeSorted = sorted.filter((item) => isActiveStatus(item.status));
  return activeSorted[0] ?? sorted[0] ?? null;
}

/** An alert only counts when the backend's own weatherDecision data
 *  indicates something needs attention — never invented. */
function isWeatherAlert(decision?: WeatherDecision): boolean {
  if (!decision) return false;
  if (decision.safe === false) return true;
  if (typeof decision.delayDays === "number" && decision.delayDays > 0) return true;
  const severity = (decision.severity ?? "").trim().toLowerCase();
  if (severity && severity !== "low" && severity !== "none") return true;
  if (Array.isArray(decision.warnings) && decision.warnings.length > 0) return true;
  return false;
}

function getWeatherAlertCount(itineraries: CropItinerary[]): number {
  let count = 0;
  for (const itinerary of itineraries) {
    for (const activity of itinerary.timeline ?? []) {
      if (isWeatherAlert(activity.weatherDecision)) count += 1;
    }
  }
  return count;
}

/* ─── Section Header ─────────────────────────────────────────────── */

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
      className={`group relative flex items-center gap-4 rounded-2xl border ${featured ? "border-primary/30" : "border-border"
        } bg-card p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-200`}
    >
      {featured && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wide">
          AI Powered
        </span>
      )}
      <div
        className={`h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 ${featured ? "shadow-md" : "shadow-sm"
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

/* ─── Recent Report Card (real data) ─────────────────────────────── */

function ReportCard({ report, index }: { report: CropItinerary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link
        to="/renter/ai/report/$id"
        params={{ id: report._id }}
        className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-light flex items-center justify-center flex-shrink-0">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          {report.status && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${isActiveStatus(report.status)
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
                }`}
            >
              {report.status}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-display font-semibold text-sm truncate">{report.crop}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {formatLocation(report.location)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Generated</p>
            <p className="font-semibold mt-0.5">{formatDate(report.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estimated Cost</p>
            <p className="font-semibold mt-0.5 truncate">{formatCurrency(report.estimatedTotalCost)}</p>
          </div>
          {report.bestSeason && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Best Season</p>
              <p className="font-semibold mt-0.5 truncate">{report.bestSeason}</p>
            </div>
          )}
        </div>

        <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-semibold px-3 py-2 group-hover:border-primary group-hover:text-primary transition-colors duration-200">
          View Report
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </motion.div>
  );
}

function ReportCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

/* ─── Empty / Error States ────────────────────────────────────────── */

function EmptyReportsState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div className="h-12 w-12 rounded-xl bg-light flex items-center justify-center">
        <Sprout className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="font-display font-semibold">No AI crop plans yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Generate your first AI crop plan to see your farming reports here.
        </p>
      </div>
      <Link
        to="/renter/ai/generate"
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <Sparkles className="h-4 w-4" />
        Generate Crop Plan
      </Link>
    </div>
  );
}

function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/30 bg-card p-10 text-center">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="font-display font-semibold">Unable to load your AI dashboard</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border text-sm font-semibold px-4 py-2.5 hover:border-primary hover:text-primary transition-colors duration-200"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
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

function WeatherMetricSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-white/60 border border-border/60 px-3 py-4">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-3 w-16" />
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
  const [itineraries, setItineraries] = useState<CropItinerary[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

const fetchItineraries = useCallback(async () => {
  setLoadState("loading");

  try {
    const token = localStorage.getItem("token");

    console.log("========== AI DASHBOARD DEBUG ==========");
    console.log("Token exists:", !!token);
    console.log(
      "Token preview:",
      token ? `${token.substring(0, 20)}...` : "NO TOKEN"
    );
    console.log(
      "Request URL:",
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/ai/my-itineraries`
    );

    const response = await api.get<MyItinerariesResponse>(
      "/ai/my-itineraries"
    );

    console.log("AI itinerary response:", response);
    console.log("Response data:", response.data);
    console.log("Itineraries:", response.data?.itineraries);
    console.log("Count:", response.data?.count);

    setItineraries(response.data?.itineraries ?? []);
    setLoadState("success");
  } catch (error: any) {
    console.error("========== AI DASHBOARD ERROR ==========");
    console.error("Full error:", error);
    console.error("Status:", error?.response?.status);
    console.error("Response:", error?.response?.data);
    console.error("Message:", error?.message);
    console.error("Request URL:", error?.config?.url);
    console.error("Request baseURL:", error?.config?.baseURL);
    console.error("========================================");

    setLoadState("error");
  }
}, []);

  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  const activeItineraries = useMemo(() => getActiveItineraries(itineraries), [itineraries]);
  const recentReports = useMemo(() => getRecentItineraries(itineraries, 3), [itineraries]);
  const selectedItinerary = useMemo(() => getSelectedItinerary(itineraries), [itineraries]);
  const weatherAlertCount = useMemo(() => getWeatherAlertCount(itineraries), [itineraries]);

  const isLoading = loadState === "loading";
  const isError = loadState === "error";

  const weather = selectedItinerary?.weather;

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
      {/* ── Statistics ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Active Crop Plans"
              value={activeItineraries.length}
              icon={Sprout}
              tone="primary"
              index={0}
            />
            <StatCard
              title="Generated Reports"
              value={itineraries.length}
              icon={FileText}
              tone="secondary"
              index={1}
            />
            <StatCard
              title="Weather Alerts"
              value={weatherAlertCount}
              icon={CloudRain}
              tone="warning"
              index={2}
            />
            <StatCard
              title="Estimated Cost"
              value={formatCurrency(selectedItinerary?.estimatedTotalCost)}
              icon={IndianRupee}
              tone="info"
              index={3}
            />
          </>
        )}
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
        {isError ? (
          <DashboardErrorState onRetry={fetchItineraries} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <>
                <ReportCardSkeleton index={0} />
                <ReportCardSkeleton index={1} />
                <ReportCardSkeleton index={2} />
              </>
            ) : recentReports.length === 0 ? (
              <EmptyReportsState />
            ) : (
              recentReports.map((report, i) => (
                <ReportCard key={report._id} report={report} index={i} />
              ))
            )}
          </div>
        )}
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
              <p className="font-display font-semibold text-sm">
                {isLoading
                  ? "Current Conditions"
                  : weather
                    ? formatLocation(selectedItinerary?.location) || weather.city || "Current Conditions"
                    : "Current Conditions"}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${!isLoading && weather ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
            >
              {isLoading ? "Loading" : weather ? "Live" : "Awaiting Data"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isLoading ? (
              <>
                <WeatherMetricSkeleton />
                <WeatherMetricSkeleton />
                <WeatherMetricSkeleton />
                <WeatherMetricSkeleton />
              </>
            ) : (
              <>
                <WeatherMetric
                  icon={Thermometer}
                  label="Temperature"
                  value={
                    typeof weather?.temperature === "number" ? `${weather.temperature}°C` : "—"
                  }
                />
                <WeatherMetric
                  icon={Droplets}
                  label="Humidity"
                  value={typeof weather?.humidity === "number" ? `${weather.humidity}%` : "—"}
                />
                <WeatherMetric
                  icon={Umbrella}
                  label="Rain"
                  value={typeof weather?.rain === "number" ? `${weather.rain} mm` : "—"}
                />
                <WeatherMetric
                  icon={Cloud}
                  label="Condition"
                  value={weather?.condition ?? weather?.description ?? "—"}
                />
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {isLoading
              ? "Loading the latest weather insights…"
              : weather
                ? `Last updated: ${formatDateTime(selectedItinerary?.lastWeatherCheck)}`
                : "Live weather insights will appear here once you generate your first AI crop plan."}
          </p>
        </div>
      </motion.div>

      {/* ── Farming Tips ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <SectionHeader title="Farming Best Practices" />
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