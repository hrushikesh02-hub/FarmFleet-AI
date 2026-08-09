import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain,
  Cloud,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sprout,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Info,
  CalendarDays,
  Leaf,
  Loader2,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  Eye,
  Gauge,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/renter/ai/weather")({
  head: () => ({ meta: [{ title: "Weather Insights — FarmFleet AI" }] }),
  component: WeatherInsightsPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — identical pattern to reports page
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("farmerToken") || localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${token}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — shaped to the observed backend contracts
// ─────────────────────────────────────────────────────────────────────────────

interface ItineraryLocation {
  state?: string;
  district?: string;
  city?: string;
}

interface ItinerarySummary {
  _id: string;
  crop?: string;
  cropName?: string;
  location?: ItineraryLocation;
  status?: string;
  createdAt?: string;
}

interface ItinerariesApiResponse {
  success?: boolean;
  itineraries?: ItinerarySummary[];
  data?: ItinerarySummary[];
}

// Some backends wrap the forecast array in an object instead of returning
// it directly (e.g. `{ data: [...] }` or `{ forecast: [...] }`). Support both
// shapes without assuming either one is guaranteed.
type ForecastPayload =
  | ForecastEntry[]
  | { data?: ForecastEntry[] | null; forecast?: ForecastEntry[] | null };

// Weather data as returned inside POST /api/weather/check/:id
interface WeatherData {
  temperature?: number | string;
  feelsLike?: number | string;
  humidity?: number | string;
  windSpeed?: number | string;
  rain?: number | string;
  condition?: string;
  description?: string;
  city?: string;
  country?: string;
  fetchedAt?: string;
  lastUpdated?: string;
  weatherAvailable?: boolean;
  // The forecast can sometimes be nested inside the weather object itself
  // rather than living beside it.
  forecast?: ForecastPayload;
}

interface WeatherDecision {
  safe?: boolean;
  severity?: string;          // "low" | "medium" | "high" | "critical"
  weatherCondition?: string;
  reason?: string;
  recommendation?: string;
  delayDays?: number;
  action?: string;
  warnings?: string[];
  recommendations?: string[];
}

interface TimelineActivity {
  week?: number | string;
  title?: string;
  description?: string;
  status?: string;
  originalDate?: string;
  currentDate?: string;
  formattedDate?: string;
  scheduledDate?: string;
  delayed?: boolean;
  delayDays?: number;
  delayReason?: string;
  weatherDecision?: WeatherDecision;
}

interface ForecastEntry {
  date?: string;
  formattedDate?: string;
  temperature?: number | string;
  humidity?: number | string;
  condition?: string;
  description?: string;
  rain?: number | string;
  windSpeed?: number | string;
}

// Shared shape for the fields that can appear either directly under
// `itinerary` or one level deeper, under `itinerary.itinerary`.
interface ItineraryWeatherDetail {
  crop?: string;
  cropName?: string;
  location?: ItineraryLocation;
  timeline?: TimelineActivity[];
  weather?: WeatherData;
  forecast?: ForecastPayload;
  weatherAvailable?: boolean;
}

interface WeatherCheckResponse {
  success?: boolean;
  itinerary?: ItineraryWeatherDetail & {
    _id?: string;
    // The backend sometimes nests the actual itinerary/weather payload
    // one level deeper, under `itinerary.itinerary`.
    itinerary?: ItineraryWeatherDetail;
  };
  weather?: WeatherData;
  forecast?: ForecastPayload;
  timeline?: TimelineActivity[];
  message?: string;
}

interface AlertItem {
  _id?: string;
  activity?: string;
  title?: string;
  severity?: string;
  message?: string;
  reason?: string;
  recommendation?: string;
  weatherCondition?: string;
  date?: string;
  createdAt?: string;
  status?: string;
}

interface AlertsApiResponse {
  success?: boolean;
  count?: number;
  alerts?: AlertItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchItineraries(): Promise<ItinerarySummary[]> {
  const { data } = await axios.get<ItinerariesApiResponse>(
    `${API_BASE_URL}/api/ai/my-itineraries`,
    { headers: authHeaders() }
  );
  return data.itineraries ?? data.data ?? [];
}

async function checkItineraryWeather(itineraryId: string): Promise<WeatherCheckResponse> {
  console.log("[Weather Insights] Checking weather for itinerary:", itineraryId);
  const { data } = await axios.post<WeatherCheckResponse>(
    `${API_BASE_URL}/api/weather/check/${itineraryId}`,
    {},
    { headers: authHeaders() }
  );
  console.log("[Weather Insights] Weather response:", data);
  return data;
}

async function fetchAlerts(): Promise<AlertsApiResponse> {
  console.log("[Weather Insights] Loading alerts");
  const { data } = await axios.get<AlertsApiResponse>(
    `${API_BASE_URL}/api/weather/alerts`,
    { headers: authHeaders() }
  );
  console.log("[Weather Insights] Alerts response:", data);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "" && v !== undefined;
}

function safe(v: unknown, fb = "N/A"): string {
  return has(v) ? String(v) : fb;
}

function fmtDate(v?: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v; // return as-is if already formatted
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(v?: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Resolve weather data from any position the backend places it.
// The backend may nest the payload under `itinerary.itinerary.weather`,
// under `itinerary.weather`, or directly under `weather`.
function resolveWeather(resp: WeatherCheckResponse): WeatherData | null {
  const weather =
    resp.itinerary?.itinerary?.weather ??
    resp.itinerary?.weather ??
    resp.weather;

  if (!weather || typeof weather !== "object" || !Object.keys(weather).length) {
    return null;
  }

  return weather;
}

// Some backends wrap the forecast array in `{ data: [...] }` or
// `{ forecast: [...] }` instead of returning it directly. Normalize either
// shape into a plain array.
function extractForecastArray(payload?: ForecastPayload | null): ForecastEntry[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.forecast)) return payload.forecast;
  return [];
}

// Forecast data has been observed nested under the itinerary, under the
// nested itinerary.itinerary, directly on the response, and even inside the
// weather object itself. Check every known location and use the first one
// that actually contains entries.
function resolveForecast(resp: WeatherCheckResponse): ForecastEntry[] {
  const candidates: Array<ForecastPayload | undefined | null> = [
    resp.itinerary?.itinerary?.forecast,
    resp.itinerary?.itinerary?.weather?.forecast,
    resp.itinerary?.forecast,
    resp.itinerary?.weather?.forecast,
    resp.forecast,
    resp.weather?.forecast,
  ];

  for (const candidate of candidates) {
    const arr = extractForecastArray(candidate);
    if (arr.length > 0) return arr;
  }

  return [];
}

function resolveTimeline(resp: WeatherCheckResponse): TimelineActivity[] {
  return (
    resp.itinerary?.itinerary?.timeline ??
    resp.itinerary?.timeline ??
    resp.timeline ??
    []
  );
}

function resolveCropLabel(resp: WeatherCheckResponse): string {
  return (
    resp.itinerary?.itinerary?.crop ??
    resp.itinerary?.itinerary?.cropName ??
    resp.itinerary?.crop ??
    resp.itinerary?.cropName ??
    ""
  );
}

function resolveLocation(resp: WeatherCheckResponse): string {
  const location =
    resp.itinerary?.itinerary?.location ??
    resp.itinerary?.location;

  if (!location) return "";

  return [location.district, location.state]
    .filter(Boolean)
    .join(", ");
}

// Severity → visual style
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

function DelayBadge({ days }: { days?: number }) {
  if (!days || days <= 0) return null;
  return (
    <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
      <Clock className="h-3 w-3" />
      Delayed {days}d
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function Skele({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

function WeatherSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Skele className="h-7 w-48" />
        <Skele className="h-16 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skele key={i} className="h-16" />)}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skele key={i} className="h-48 rounded-2xl" />)}
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
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {badge}
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
  itineraries: ItinerarySummary[];
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
          className="appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer disabled:opacity-50 min-w-[180px]"
        >
          {itineraries.map(it => (
            <option key={it._id} value={it._id}>
              {it.crop ?? it.cropName ?? "Crop Plan"}
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
// WEATHER SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────

const WeatherSummaryCard = memo(function WeatherSummaryCard({
  weather,
  crop,
  location,
}: {
  weather: WeatherData;
  crop: string;
  location: string;
}) {
  const condition = weather.condition ?? weather.description;
  const lastUpdated =
    fmtDate(weather.fetchedAt ?? weather.lastUpdated) ?? null;
  const lastTime =
    fmtTime(weather.fetchedAt ?? weather.lastUpdated) ?? null;

  const statRows = [
    {
      icon: Droplets,
      label: "Humidity",
      value: has(weather.humidity) ? `${weather.humidity}%` : "N/A",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      icon: Wind,
      label: "Wind",
      value: has(weather.windSpeed) ? `${weather.windSpeed} km/h` : "N/A",
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-500/10",
    },
    {
      icon: CloudRain,
      label: "Rain",
      value: has(weather.rain) ? `${weather.rain} mm` : "0 mm",
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      icon: Thermometer,
      label: "Feels Like",
      value: has(weather.feelsLike) ? `${weather.feelsLike}°C` : "N/A",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
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
        {/* Location + crop */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            {has(weather.city) ? `${weather.city}` : ""}
            {location ? (has(weather.city) ? `, ${location}` : location) : ""}
          </div>
          {crop && (
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold">{crop}</span>
            </div>
          )}
        </div>

        {/* Temperature + condition */}
        <div className="flex items-start gap-4">
          <div>
            <p className="font-display text-5xl font-bold leading-none tracking-tight">
              {has(weather.temperature) ? `${weather.temperature}°` : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {safe(condition, "No condition data")}
            </p>
          </div>
          <div className="text-primary mt-1">
            {weatherIcon(condition, "h-12 w-12")}
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-t border-border">
        {statRows.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-4">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-sm font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Last updated */}
      {(lastUpdated || lastTime) && (
        <div className="border-t border-border px-6 py-2.5 flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            Last updated:{" "}
            {[lastUpdated, lastTime].filter(Boolean).join(", ")}
          </p>
        </div>
      )}
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER SAFETY SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

const WeatherSafetySummary = memo(function WeatherSafetySummary({
  timeline,
}: {
  timeline: TimelineActivity[];
}) {
  const withDecision = timeline.filter(a => a.weatherDecision);
  if (!withDecision.length) return null;

  const safe = withDecision.filter(a => a.weatherDecision?.safe === true).length;
  const unsafe = withDecision.filter(a => a.weatherDecision?.safe === false).length;
  const delayed = withDecision.filter(
    a => a.delayed === true || (a.weatherDecision?.delayDays ?? 0) > 0
  ).length;
  const high = withDecision.filter(
    a => ["high", "critical"].includes((a.weatherDecision?.severity ?? "").toLowerCase())
  ).length;
  const medium = withDecision.filter(
    a => (a.weatherDecision?.severity ?? "").toLowerCase() === "medium"
  ).length;
  const low = withDecision.filter(
    a => (a.weatherDecision?.severity ?? "").toLowerCase() === "low"
  ).length;

  const stats = [
    { label: "Safe Activities", value: safe, color: "text-green-600", bg: "bg-green-50 dark:bg-green-500/10", icon: ShieldCheck },
    { label: "At Risk", value: unsafe, color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", icon: ShieldAlert },
    { label: "Delayed", value: delayed, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Clock },
    { label: "High Risk", value: high, color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", icon: AlertTriangle },
    { label: "Medium Risk", value: medium, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: AlertTriangle },
    { label: "Low Risk", value: low, color: "text-green-600", bg: "bg-green-50 dark:bg-green-500/10", icon: Info },
  ];

  return (
    <Section title="Today's Farming Conditions" icon={Gauge}>
      <div className="rounded-2xl border border-border bg-card shadow-card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={`rounded-xl border border-border ${bg} p-3 text-center`}>
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY WEATHER CARD
// ─────────────────────────────────────────────────────────────────────────────

const ActivityCard = memo(function ActivityCard({
  activity,
  index,
}: {
  activity: TimelineActivity;
  index: number;
}) {
  const decision = activity.weatherDecision;
  const displayDate =
    activity.formattedDate ??
    fmtDate(activity.currentDate ?? activity.originalDate ?? activity.scheduledDate) ??
    (has(activity.week) ? `Week ${activity.week}` : null);

  const hasDecision = !!decision;
  const isDelayed = activity.delayed === true || (activity.delayReason ?? decision?.delayDays ?? 0);
  const cardBorder = !hasDecision
    ? "border-border"
    : decision?.safe
      ? "border-green-200/60 dark:border-green-500/30"
      : "border-red-200/60 dark:border-red-500/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: Math.min(index * 0.04, 0.25), duration: 0.25 }}
      className={`rounded-2xl border bg-card shadow-card overflow-hidden ${cardBorder}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug">{safe(activity.title, "Activity")}</p>
          {displayDate && (
            <p className="flex items-center gap-1.5 text-xs text-primary font-medium mt-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {displayDate}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {activity.status && (
            <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
              {activity.status}
            </Badge>
          )}
          {hasDecision && <SafeBadge safe={decision?.safe} />}
          {hasDecision && <SeverityBadge severity={decision?.severity} />}
          {hasDecision && <DelayBadge days={decision?.delayDays} />}
        </div>
      </div>

      {/* Body */}
      {hasDecision && (
        <div className="px-5 py-4 space-y-3">
          {/* Weather condition */}
          {has(decision?.weatherCondition) && (
            <div className="flex items-center gap-2">
              <div className="text-primary">
                {weatherIcon(decision?.weatherCondition, "h-4 w-4")}
              </div>
              <span className="text-sm font-medium">{decision?.weatherCondition}</span>
            </div>
          )}

          {/* Reason */}
          {has(decision?.reason) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Reason
              </p>
              <p className="text-sm text-foreground leading-relaxed">{decision?.reason}</p>
            </div>
          )}

          {/* Delay reason from activity level */}
          {!has(decision?.reason) && has(activity.delayReason) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Reason
              </p>
              <p className="text-sm text-foreground leading-relaxed">{activity.delayReason}</p>
            </div>
          )}

          {/* Recommendation */}
          {has(decision?.recommendation) && (
            <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-0.5">
                Recommendation
              </p>
              <p className="text-sm leading-relaxed">{decision?.recommendation}</p>
            </div>
          )}

          {/* Extra warnings */}
          {decision?.warnings && decision.warnings.length > 0 && (
            <div className="space-y-1">
              {decision.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FORECAST SECTION
// ─────────────────────────────────────────────────────────────────────────────

const ForecastSection = memo(function ForecastSection({
  forecast,
}: {
  forecast: ForecastEntry[];
}) {
  if (!forecast.length) return null;

  return (
    <Section title="Weather Forecast" icon={CalendarDays}>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {forecast.map((entry, i) => {
            const label =
              entry.formattedDate ??
              fmtDate(entry.date) ??
              `Day ${i + 1}`;
            const condition = entry.condition ?? entry.description;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card shadow-card p-4 flex flex-col items-center gap-2 min-w-[100px]"
              >
                <p className="text-[11px] font-semibold text-muted-foreground text-center">
                  {label}
                </p>
                <div className="text-primary">{weatherIcon(condition, "h-7 w-7")}</div>
                {has(condition) && (
                  <p className="text-[10px] font-medium text-center text-foreground">
                    {condition}
                  </p>
                )}
                {has(entry.temperature) && (
                  <p className="font-display text-lg font-bold">{entry.temperature}°</p>
                )}
                <div className="w-full space-y-1 mt-1">
                  {has(entry.humidity) && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Humidity</span>
                      <span className="font-medium">{entry.humidity}%</span>
                    </div>
                  )}
                  {has(entry.rain) && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Rain</span>
                      <span className="font-medium">{entry.rain} mm</span>
                    </div>
                  )}
                  {has(entry.windSpeed) && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Wind</span>
                      <span className="font-medium">{entry.windSpeed} km/h</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FORECAST UNAVAILABLE
// ─────────────────────────────────────────────────────────────────────────────

function ForecastUnavailable() {
  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 dark:bg-amber-500/8 dark:border-amber-400/20 p-5 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">
          Forecast Unavailable
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
          Weather forecast data could not be retrieved. Review weather conditions before proceeding with farming activities.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const AlertsSection = memo(function AlertsSection({
  data,
}: {
  data: AlertsApiResponse | null;
}) {
  const alerts = data?.alerts ?? [];
  const count = data?.count ?? alerts.length;

  return (
    <Section
      title="Weather Alerts"
      icon={ShieldAlert}
      badge={
        count > 0 ? (
          <span className="ml-1 rounded-full bg-red-100 dark:bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
            {count}
          </span>
        ) : undefined
      }
    >
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-card p-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-500/10">
            <ShieldCheck className="h-7 w-7 text-green-500" />
          </div>
          <div>
            <p className="font-semibold">No weather alerts</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              No active weather alerts require your attention right now.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const sev = severityStyle(alert.severity);
            return (
              <motion.div
                key={alert._id ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-5 shadow-card ${sev.cls}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="font-bold text-sm">
                      {alert.activity ?? alert.title ?? "Weather Alert"}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {alert.severity && <SeverityBadge severity={alert.severity} />}
                    {alert.weatherCondition && (
                      <Badge className="bg-muted text-muted-foreground border-border">
                        {weatherIcon(alert.weatherCondition, "h-3 w-3")}
                        {alert.weatherCondition}
                      </Badge>
                    )}
                  </div>
                </div>
                {has(alert.message ?? alert.reason) && (
                  <p className="text-sm leading-relaxed mb-2">
                    {alert.message ?? alert.reason}
                  </p>
                )}
                {has(alert.recommendation) && (
                  <p className="text-xs font-medium border-t border-current/20 pt-2 mt-2">
                    <span className="font-bold">Recommendation: </span>
                    {alert.recommendation}
                  </p>
                )}
                {(alert.date ?? alert.createdAt) && (
                  <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmtDate(alert.date ?? alert.createdAt)}
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
          Generate an AI crop plan first to see weather insights for your farm.
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

function WeatherError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
      <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function WeatherInsightsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");
  // Track whether a manual refresh is in flight
  const refreshing = useRef(false);

  // ── 1. Load farmer's itineraries ─────────────────────────────────────────
  const {
    data: itineraries = [],
    isLoading: loadingItineraries,
    isError: itinerariesError,
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
    console.log("[Weather Insights] Selected itinerary:", sorted[0]._id);
  }, [itineraries, selectedId]);

  // ── 2. Weather check for selected itinerary ───────────────────────────────
  const {
    data: weatherData,
    isLoading: loadingWeather,
    isError: weatherError,
    error: weatherRawError,
    refetch: refetchWeather,
  } = useQuery({
    queryKey: ["weather-check", selectedId],
    queryFn: () => checkItineraryWeather(selectedId),
    enabled: !!selectedId,
    retry: 1,
    staleTime: 30_000,
  });

  // ── 3. Alerts ─────────────────────────────────────────────────────────────
  const {
    data: alertsData,
    isLoading: loadingAlerts,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ["weather-alerts"],
    queryFn: fetchAlerts,
    retry: 1,
    staleTime: 60_000,
  });

  // ── Refresh handler ───────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !selectedId) return;
    setIsRefreshing(true);
    try {
      await Promise.all([refetchWeather(), refetchAlerts()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, selectedId, refetchWeather, refetchAlerts]);

  // ── Derived display values ────────────────────────────────────────────────
  const weather = weatherData ? resolveWeather(weatherData) : null;
  const forecast = weatherData ? resolveForecast(weatherData) : [];
  const timeline = weatherData ? resolveTimeline(weatherData) : [];
  const crop = weatherData ? resolveCropLabel(weatherData) : "";
  const location = weatherData ? resolveLocation(weatherData) : "";
  const activitiesWithDecision = timeline.filter(a => a.weatherDecision);

  // Debug: log the resolved values once per weather response so it's easy
  // to confirm which shape the backend returned and what got parsed out of it.
  useEffect(() => {
    if (!weatherData) return;
    console.log("[Weather Insights] Full weather API response:", weatherData);
    console.log("[Weather Insights] Resolved weather:", weather);
    console.log("[Weather Insights] Resolved forecast:", forecast);
    console.log("[Weather Insights] Forecast count:", forecast.length);
    console.log("[Weather Insights] Resolved timeline:", timeline);
  }, [weatherData]);

  // Friendly error message (never expose raw errors)
  const weatherErrorMsg = useMemo(() => {
    if (!weatherError) return null;
    if (axios.isAxiosError(weatherRawError)) {
      const status = weatherRawError.response?.status;
      if (status === 401 || status === 403) return "Session expired. Please log in again.";
      if (status === 404) return "Itinerary not found. Please select another crop plan.";
    }
    return "Unable to fetch weather information right now. Please try again.";
  }, [weatherError, weatherRawError]);

  const isLoading = loadingItineraries || (!!selectedId && loadingWeather);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Link to="/renter/ai" className="hover:text-primary transition-colors">
          AI Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Weather Insights</span>
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
            Weather Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-lg">
            Weather conditions and activity-specific recommendations for your farming schedule.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* Itinerary selector */}
          {!loadingItineraries && itineraries.length > 0 && (
            <ItinerarySelector
              itineraries={itineraries}
              selectedId={selectedId}
              onSelect={id => {
                setSelectedId(id);
                console.log("[Weather Insights] Selected itinerary:", id);
              }}
              loading={loadingWeather}
            />
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !selectedId}
            aria-label="Refresh weather"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing…" : "Refresh Weather"}
          </button>
        </div>
      </motion.div>

      {/* No itineraries */}
      {!loadingItineraries && (itinerariesError || !itineraries.length) && <NoItineraries />}

      {/* Loading */}
      {isLoading && <WeatherSkeleton />}

      {/* Weather error */}
      {!loadingWeather && weatherError && weatherErrorMsg && (
        <WeatherError message={weatherErrorMsg} onRetry={() => refetchWeather()} />
      )}

      {/* Main content */}
      <AnimatePresence>
        {!isLoading && !weatherError && weatherData && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Weather summary */}
            {weather ? (
              <Section title="Current Weather" icon={CloudRain}>
                <WeatherSummaryCard weather={weather} crop={crop} location={location} />
              </Section>
            ) : (
              <Section title="Current Weather" icon={CloudRain}>
                <ForecastUnavailable />
              </Section>
            )}

            {/* Safety summary */}
            {activitiesWithDecision.length > 0 && (
              <WeatherSafetySummary timeline={timeline} />
            )}

            {/* Activity weather analysis */}
            {timeline.length > 0 && (
              <Section
                title="Farming Activity Weather Analysis"
                icon={Sprout}
                badge={
                  <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {timeline.length} activities
                  </span>
                }
              >
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timeline.map((activity, i) => (
                    <ActivityCard key={i} activity={activity} index={i} />
                  ))}
                </div>
              </Section>
            )}

            {/* Forecast */}
            {/* {forecast.length > 0 ? (
              <ForecastSection forecast={forecast} />
            ) : (
              <Section title="Weather Forecast" icon={CalendarDays}>
                <ForecastUnavailable />
              </Section>
            )} */}

            {/* Alerts */}
            {!loadingAlerts && (
              <AlertsSection data={alertsData ?? null} />
            )}
            {loadingAlerts && (
              <Section title="Weather Alerts" icon={ShieldAlert}>
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading alerts…
                </div>
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}