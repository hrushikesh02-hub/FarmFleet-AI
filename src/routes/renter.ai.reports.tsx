import { memo, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  MapPin,
  CalendarDays,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Leaf,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  FileText,
  IndianRupee,
  Clock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/renter/ai/reports")({
  head: () => ({ meta: [{ title: "My Reports — FarmFleet AI" }] }),
  component: MyReportsPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — mirrors the pattern used in renter.ai.report.$id.tsx
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("farmerToken") || localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${token}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — based on the CropItinerary schema already used in the project
// ─────────────────────────────────────────────────────────────────────────────

interface ReportLocation {
  state?: string;
  district?: string;
}

interface AiSummary {
  cropDuration?: string;
  expectedYield?: string;
  estimatedIncome?: string | number;
  estimatedProfit?: string | number;
  bestSowingSeason?: string;
}

interface WeatherSnapshot {
  condition?: string;
  temperature?: number | string;
}

// Lightweight card-level shape — we never need the full itinerary here
interface ReportSummary {
  _id: string;
  crop?: string;
  cropName?: string;       // defensive alias some backends use
  status?: string;
  location?: ReportLocation;
  createdAt?: string;
  updatedAt?: string;
  cropDuration?: string;
  season?: string;
  bestSeason?: string;
  expectedYield?: string;
  estimatedIncome?: string | number;
  estimatedProfit?: string | number;
  estimatedTotalCost?: string | number;
  aiSummary?: AiSummary;
  weather?: WeatherSnapshot;
  lastWeatherCheck?: WeatherSnapshot | string | null;
  timeline?: unknown[];    // only length is used on the card
  seedRecommendation?: { variety?: string; seedQuantity?: string; estimatedCost?: string };
}

interface ReportsApiResponse {
  success?: boolean;
  itineraries?: ReportSummary[];
  reports?: ReportSummary[];
  data?: ReportSummary[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API — consistent with existing project auth pattern
// ─────────────────────────────────────────────────────────────────────────────

async function fetchReports(): Promise<ReportSummary[]> {
  const { data } = await axios.get<ReportsApiResponse | ReportSummary[]>(
    `${API_BASE_URL}/api/ai/my-itineraries`,
    { headers: authHeaders() }
  );
  const r = data as ReportsApiResponse;
  // Backend returns { success, count, itineraries: [...] }
  // Also handle { reports }, { data }, or a bare array for safety
  const list =
    r.itineraries ??
    r.reports ??
    r.data ??
    (Array.isArray(data) ? (data as ReportSummary[]) : []);
  return list;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — mirrors helpers in the existing report page
// ─────────────────────────────────────────────────────────────────────────────

function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}

function safe(v: unknown, fb = "—"): string {
  return has(v) ? String(v) : fb;
}

function fmtDate(v?: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(v?: string | number): string | null {
  if (!has(v)) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (!isFinite(n)) return String(v); // already a string like "₹3,60,000"
  return `₹${n.toLocaleString("en-IN")}`;
}

// Normalise the report into a consistent card-level object
function normalise(r: ReportSummary) {
  return {
    id: r._id,
    // Some backends use cropName; fall back gracefully
    crop: r.crop ?? r.cropName ?? "Crop Plan",
    status: r.status ?? "Draft",
    district: r.location?.district,
    state: r.location?.state,
    createdAt: r.createdAt,
    cropDuration: r.aiSummary?.cropDuration ?? r.cropDuration,
    season: r.aiSummary?.bestSowingSeason ?? r.bestSeason ?? r.season,
    expectedYield: r.aiSummary?.expectedYield ?? r.expectedYield,
    estimatedIncome: r.aiSummary?.estimatedIncome ?? r.estimatedIncome,
    estimatedProfit: r.aiSummary?.estimatedProfit ?? r.estimatedProfit,
    timelineCount: r.timeline?.length ?? 0,
    weatherCondition:
      r.weather?.condition ??
      (typeof r.lastWeatherCheck === "object" && r.lastWeatherCheck !== null
        ? (r.lastWeatherCheck as WeatherSnapshot).condition
        : undefined),
  };
}

type NormalisedReport = ReturnType<typeof normalise>;

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE — same visual convention as the rest of the app
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cls = STATUS_STYLES[key] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SORT & FILTER TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SortOrder = "newest" | "oldest";
type StatusFilter = "all" | "active" | "completed" | "draft" | "archived";

const STATUS_OPTIONS: StatusFilter[] = ["all", "active", "completed", "draft", "archived"];
const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

// ─────────────────────────────────────────────────────────────────────────────
// REPORT CARD
// ─────────────────────────────────────────────────────────────────────────────

const ReportCard = memo(function ReportCard({ report }: { report: NormalisedReport }) {
  const location = [report.district, report.state].filter(Boolean).join(", ");
  const generated = fmtDate(report.createdAt);
  const profit = fmtCurrency(report.estimatedProfit);
  const income = fmtCurrency(report.estimatedIncome);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="flex flex-col rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition-shadow duration-200"
    >
      {/* Card header strip */}
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base truncate">{report.crop}</h3>
            {location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                {location}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {/* Card body */}
      <div className="flex-1 px-5 pb-4 space-y-2.5">
        {/* Date */}
        {generated && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Generated
            </span>
            <span className="font-medium">{generated}</span>
          </div>
        )}

        {/* Duration */}
        {has(report.cropDuration) && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Duration
            </span>
            <span className="font-medium">{report.cropDuration}</span>
          </div>
        )}

        {/* Expected yield */}
        {has(report.expectedYield) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expected Yield</span>
            <span className="font-medium">{report.expectedYield}</span>
          </div>
        )}

        {/* Estimated profit */}
        {profit && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <IndianRupee className="h-3.5 w-3.5 shrink-0" />
              Est. Profit
            </span>
            <span className="font-semibold text-primary">{profit}</span>
          </div>
        )}

        {/* Estimated income (only if profit not available) */}
        {!profit && income && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <IndianRupee className="h-3.5 w-3.5 shrink-0" />
              Est. Income
            </span>
            <span className="font-semibold text-primary">{income}</span>
          </div>
        )}

        {/* Timeline activity count */}
        {report.timelineCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Activities</span>
            <span className="font-medium">{report.timelineCount} planned</span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-5 pb-5">
        <Link
          to="/renter/ai/report/$id"
          params={{ id: report.id }}
          aria-label={`View report for ${report.crop}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          View Report
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARDS
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-3/5 rounded bg-muted" />
      </div>
      <div className="h-9 w-full rounded-xl bg-muted" />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-4"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <Leaf className="h-10 w-10 text-primary/50" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold">No AI reports yet</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Generate your first AI-powered crop plan to get personalised farming recommendations.
        </p>
      </div>
      <Link
        to="/renter/ai/generate"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
      >
        <Sparkles className="h-4 w-4" />
        Generate Crop Plan
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-4"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive/70" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold">Unable to load reports</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          Something went wrong while fetching your reports.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted transition"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NO RESULTS (after filtering)
// ─────────────────────────────────────────────────────────────────────────────

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-16 text-center gap-3"
    >
      <FileText className="h-12 w-12 text-muted-foreground/40" />
      <p className="font-semibold">No reports match your search</p>
      <button
        onClick={onClear}
        className="text-sm text-primary hover:underline"
      >
        Clear filters
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH + FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────

function SearchBar({
  query,
  onQuery,
  status,
  onStatus,
  sort,
  onSort,
  total,
  filtered,
}: {
  query: string;
  onQuery: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  sort: SortOrder;
  onSort: (v: SortOrder) => void;
  total: number;
  filtered: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search input */}
      <div className="relative flex-1 max-w-sm w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by crop or district…"
          value={query}
          onChange={e => onQuery(e.target.value)}
          aria-label="Search reports"
          className="w-full rounded-xl border border-border bg-card pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
        />
        {query && (
          <button
            onClick={() => onQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="relative">
        <select
          value={status}
          onChange={e => onStatus(e.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={sort}
          onChange={e => onSort(e.target.value as SortOrder)}
          aria-label="Sort reports"
          className="appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Count */}
      {(query || status !== "all") && (
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered} of {total}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function MyReportsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");

  const { data: rawReports, isLoading, isError, refetch } = useQuery({
    queryKey: ["ai-reports"],
    queryFn: fetchReports,
    retry: 1,
    staleTime: 60_000,
  });

  // Normalise raw backend data once
  const reports = useMemo<NormalisedReport[]>(
    () => (rawReports ?? []).map(normalise),
    [rawReports]
  );

  // Client-side search + filter + sort
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = reports.filter(r => {
      const matchesQuery =
        !q ||
        r.crop.toLowerCase().includes(q) ||
        (r.district ?? "").toLowerCase().includes(q) ||
        (r.state ?? "").toLowerCase().includes(q);
      const matchesStatus =
        status === "all" || r.status.toLowerCase() === status;
      return matchesQuery && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [reports, query, status, sort]);

  const clearFilters = () => { setQuery(""); setStatus("all"); };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 space-y-7">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Link to="/renter/ai" className="hover:text-primary transition-colors">
          AI Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">My Reports</span>
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
            My Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-lg">
            View and manage your previously generated AI crop plans and farming reports.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/renter/ai/generate" })}
          className="no-print shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          Generate New Report
        </button>
      </motion.div>

      {/* Loading */}
      {isLoading && <SkeletonGrid />}

      {/* Error */}
      {!isLoading && isError && <ErrorState onRetry={() => refetch()} />}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {/* Empty state — no reports at all */}
          {reports.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Search / filter */}
              <SearchBar
                query={query}
                onQuery={setQuery}
                status={status}
                onStatus={setStatus}
                sort={sort}
                onSort={setSort}
                total={reports.length}
                filtered={filtered.length}
              />

              {/* Grid */}
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <NoResults onClear={clearFilters} />
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    {filtered.map((report, i) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.25), duration: 0.25 }}
                      >
                        <ReportCard report={report} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer count */}
              {filtered.length > 0 && (
                <p className="text-center text-xs text-muted-foreground pb-4">
                  Showing {filtered.length} report{filtered.length !== 1 ? "s" : ""}
                  {query || status !== "all" ? ` matching your filters` : ""}
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}