import { memo, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Sprout,
  MapPin,
  ChevronRight,
  IndianRupee,
  CloudRain,
  Download,
  Printer,
  Share2,
  Sparkles,
  CheckCircle2,
  Droplets,
  AlertTriangle,
  Wrench,
  Users,
  Lightbulb,
  Layers,
  ArrowLeft,
  Search,
  Leaf,
  ShieldAlert,
  ChevronDown,
  CalendarDays,
  FileText,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/renter/ai/report/$id")({
  head: () => ({ meta: [{ title: "Smart Farming Guide — FarmFleet AI" }] }),
  component: AIReportPage,
});

/* ============================================================================
 * CONFIG — backend URL is read from the environment, never hardcoded here.
 * ==========================================================================
 */

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ??
  "http://localhost:5000";

/* ============================================================================
 * TYPES — mirrors the MongoDB CropItinerary shape returned by the backend
 * itinerary API. Where the backend is known to expose the same value in
 * more than one place (see services/pdf/pdfService.js — e.g.
 * `aiSummary.cropDuration` vs. top-level `cropDuration`, or `weather` vs.
 * `lastWeatherCheck`), both are typed and read defensively. No field is
 * ever invented — only real, already-documented field names are read.
 * ==========================================================================
 */

interface Location {
  state?: string;
  district?: string;
}

interface TimelineEntry {
  week?: number | string;
  title?: string;
  description?: string;
  status?: string;
  originalDate?: string;
  currentDate?: string;
  scheduledDate?: string;
  equipment?: string | string[];
  labour?: string | string[];
}

interface FertilizerEntry {
  stage?: string;
  fertilizer?: string;
  quantity?: string;
  time?: string;
}

interface IrrigationEntry {
  stage?: string;
  frequency?: string;
  waterRequirement?: string;
}

interface PestEntry {
  problem?: string;
  solution?: string;
}

interface EquipmentEntry {
  name?: string;
  purpose?: string;
  estimatedRent?: string;
}

interface LabourEntry {
  activity?: string;
  workers?: number | string;
  workersRequired?: number | string;
  days?: number | string;
  estimatedDays?: number | string;
}

interface SeedRecommendation {
  variety?: string;
  quantity?: string;
  cost?: string | number;
}

interface WeatherSnapshot {
  temperature?: number | string;
  humidity?: number | string;
  condition?: string;
  recommendation?: string;
  lastUpdated?: string;
  checkedAt?: string;
}

interface TodayTask {
  activity?: string;
  status?: string;
  recommendation?: string;
  scheduledDate?: string;
}

interface AiSummary {
  cropDuration?: string;
  expectedYield?: string;
  estimatedCost?: string | number;
  estimatedIncome?: string | number;
  estimatedProfit?: string | number;
  bestSowingSeason?: string;
}

interface PdfMeta {
  generated?: boolean;
  generatedAt?: string;
  version?: number;
}

interface CropItinerary {
  _id: string;
  crop: string;
  status?: string;
  location?: Location;
  soilType?: string;
  landArea?: string | number;
  waterSource?: string;
  budget?: string | number;
  season?: string;
  bestSeason?: string;
  cropDuration?: string;
  expectedYield?: string;
  estimatedTotalCost?: string | number;
  estimatedIncome?: string | number;
  estimatedProfit?: string | number;
  aiSummary?: AiSummary;
  seedRecommendation?: SeedRecommendation;
  landPreparation?: string | string[];
  timeline?: TimelineEntry[];
  fertilizerSchedule?: FertilizerEntry[];
  irrigationSchedule?: IrrigationEntry[];
  weedManagement?: string[];
  pestAndDiseaseManagement?: PestEntry[];
  equipmentRequired?: EquipmentEntry[];
  labourRequirement?: LabourEntry[];
  precautions?: string[];
  tips?: string[];
  weather?: WeatherSnapshot;
  lastWeatherCheck?: WeatherSnapshot | string | null;
  todayTask?: TodayTask;
  pdf?: PdfMeta;
  createdAt?: string;
  updatedAt?: string;
}

interface ItineraryApiResponse {
  success?: boolean;
  itinerary?: CropItinerary;
  data?: CropItinerary;
  message?: string;
}

async function fetchItinerary(id: string): Promise<CropItinerary> {
  const { data } = await axios.get<ItineraryApiResponse | CropItinerary>(
    `${API_BASE_URL}/api/ai/itinerary/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("farmerToken") ?? ""}`,
      },
    }
  );
  const response = data as ItineraryApiResponse;
  return (response.itinerary ?? response.data ?? (data as CropItinerary)) as CropItinerary;
}

/* ============================================================================
 * SMALL HELPERS
 * ==========================================================================
 */

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function safe(value: unknown, fallback = "Not available"): string {
  return hasValue(value) ? String(value) : fallback;
}

/** Numbers such as labour "Workers" / "Days" read as "Not Available" when
 * the backend returns 0 or null, since 0 is ambiguous for a farmer reading
 * a plan (per spec: 0/null must never render as a bare "0"). */
function safeCount(value: unknown): string {
  if (!hasValue(value)) return "Not Available";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isFinite(num) && num === 0) return "Not Available";
  return String(value);
}

/** Consistent "02 August 2026" formatting used across every dated section. */
function formatDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = parsed.toLocaleDateString("en-IN", { month: "long" });
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatCurrency(value: unknown): string | null {
  if (!hasValue(value)) return null;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(num)) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

/* ============================================================================
 * FIELD RESOLUTION — reads each value from wherever the backend actually
 * placed it, without renaming or fabricating anything.
 * ==========================================================================
 */

function getWeather(itinerary: CropItinerary): WeatherSnapshot | null {
  if (itinerary.weather && Object.keys(itinerary.weather).length > 0) return itinerary.weather;
  if (itinerary.lastWeatherCheck && typeof itinerary.lastWeatherCheck === "object") {
    return itinerary.lastWeatherCheck as WeatherSnapshot;
  }
  return null;
}

function getWeatherLastUpdated(weather: WeatherSnapshot | null) {
  if (!weather) return undefined;
  return weather.lastUpdated ?? weather.checkedAt;
}

function getCropDuration(itinerary: CropItinerary) {
  return itinerary.aiSummary?.cropDuration ?? itinerary.cropDuration;
}

function getExpectedYield(itinerary: CropItinerary) {
  return itinerary.aiSummary?.expectedYield ?? itinerary.expectedYield;
}

function getEstimatedCost(itinerary: CropItinerary) {
  return itinerary.aiSummary?.estimatedCost ?? itinerary.estimatedTotalCost;
}

function getEstimatedIncome(itinerary: CropItinerary) {
  return itinerary.aiSummary?.estimatedIncome ?? itinerary.estimatedIncome;
}

function getEstimatedProfit(itinerary: CropItinerary) {
  return itinerary.aiSummary?.estimatedProfit ?? itinerary.estimatedProfit;
}

function getBestSeason(itinerary: CropItinerary) {
  return itinerary.season ?? itinerary.bestSeason ?? itinerary.aiSummary?.bestSowingSeason;
}

function getLabourWorkers(entry: LabourEntry) {
  return entry.workers ?? entry.workersRequired;
}

function getLabourDays(entry: LabourEntry) {
  return entry.days ?? entry.estimatedDays;
}

function getLandPreparationItems(itinerary: CropItinerary): string[] {
  const value = itinerary.landPreparation;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\r?\n|•/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

/** Prefers an actual backend date over a week number, and only shows both
 * together when the backend has genuinely provided both — never mixes
 * "Week 1" with an invented date, and never invents a date from a week. */
function getTimelineWhen(entry: TimelineEntry): string {
  const date = formatDate(entry.currentDate ?? entry.originalDate ?? entry.scheduledDate);
  const week = hasValue(entry.week) ? `Week ${entry.week}` : null;
  if (date && week) return `${week} · ${date}`;
  if (date) return date;
  if (week) return week;
  return "Not available";
}

function listValue(value?: string | string[]): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || null;
  return value;
}

function timelineHasEquipmentColumn(timeline: TimelineEntry[]) {
  return timeline.some((entry) => hasValue(listValue(entry.equipment)));
}

function timelineHasLabourColumn(timeline: TimelineEntry[]) {
  return timeline.some((entry) => hasValue(listValue(entry.labour)));
}

/* ============================================================================
 * TOAST — lightweight, local feedback for async actions.
 * ==========================================================================
 */

function useInlineToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [message]);
  return { message, trigger: (msg: string) => setMessage(msg) };
}

function InlineToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-elevated"
    >
      <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
      {message}
    </motion.div>
  );
}

/* ============================================================================
 * PRINT STYLES — only the report prints; navbar, footer, buttons, and
 * floating elements are hidden, and tables avoid splitting mid-row.
 * ==========================================================================
 */

function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #ai-report-printable, #ai-report-printable * { visibility: visible; }
        #ai-report-printable { position: absolute; inset: 0; width: 100%; }
        .no-print { display: none !important; }
        section { break-inside: avoid; }
        table { break-inside: avoid; }
        tr { break-inside: avoid; }
        @page { size: A4; margin: 14mm; }
      }
    `}</style>
  );
}

/* ============================================================================
 * BREADCRUMB
 * ==========================================================================
 */

const Breadcrumb = memo(function Breadcrumb({ crop }: { crop: string }) {
  return (
    <nav className="no-print flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Link to="/renter/ai" className="hover:text-primary transition-colors">
        AI Dashboard
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground">{crop} Farming Guide</span>
    </nav>
  );
});

/* ============================================================================
 * HEADER — compact: crop, location, generated date, status + actions.
 * ==========================================================================
 */

const ReportHeader = memo(function ReportHeader({
  itinerary,
  onDownloadPdf,
  onPrint,
  onShare,
}: {
  itinerary: CropItinerary;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onShare: () => void;
}) {
  const district = safe(itinerary.location?.district, "");
  const state = safe(itinerary.location?.state, "");
  const place = [district, state].filter((p) => p && p !== "Not available").join(", ");
  const generated = formatDate(itinerary.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">{itinerary.crop}</span>
          </div>
          {place && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {place}
            </div>
          )}
          {generated && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
              Generated {generated}
            </div>
          )}
          {itinerary.status && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {itinerary.status}
            </span>
          )}
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-semibold hover:bg-muted transition"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-semibold hover:bg-muted transition"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <Link
            to="/renter/ai/generate"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-semibold hover:bg-muted transition"
          >
            <Sparkles className="h-4 w-4" />
            Generate New Plan
          </Link>
          <Link
            to="/renter/ai"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-semibold hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

/* ============================================================================
 * SECTION WRAPPER
 * ==========================================================================
 */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}

/** Shared scroll wrapper: horizontal scroll on mobile, vertical scroll with
 * a sticky header once a table grows past a comfortable height on desktop. */
function ScrollableTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border shadow-card overflow-auto max-h-[30rem]">
      <table className="w-full min-w-[560px] text-left text-sm border-collapse">{children}</table>
    </div>
  );
}

function TableHeadRow({ columns }: { columns: string[] }) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="bg-gradient-primary text-primary-foreground">
        {columns.map((col) => (
          <th key={col} className="px-4 py-3 font-semibold whitespace-nowrap">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/* ============================================================================
 * FARM INFORMATION
 * ==========================================================================
 */

const FarmInformationSection = memo(function FarmInformationSection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const fields: { label: string; value: string }[] = [
    { label: "Crop", value: safe(itinerary.crop) },
    { label: "State", value: safe(itinerary.location?.state) },
    { label: "District", value: safe(itinerary.location?.district) },
    { label: "Soil Type", value: safe(itinerary.soilType) },
    {
      label: "Land Area",
      value: hasValue(itinerary.landArea) ? `${itinerary.landArea} Acres` : "Not available",
    },
    { label: "Water Source", value: safe(itinerary.waterSource) },
    { label: "Budget", value: formatCurrency(itinerary.budget) ?? "Not available" },
    { label: "Crop Duration", value: safe(getCropDuration(itinerary)) },
    { label: "Best Season", value: safe(getBestSeason(itinerary)) },
    { label: "Seed Variety", value: safe(itinerary.seedRecommendation?.variety) },
  ].filter((field) => field.value !== "Not available");

  return (
    <Section title="Farm Information" icon={Layers}>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No farm information available.</p>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-5">
          {fields.map((field) => (
            <SummaryItem key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
      )}
    </Section>
  );
});

/* ============================================================================
 * FINANCIAL SUMMARY
 * ==========================================================================
 */

const FinancialSummarySection = memo(function FinancialSummarySection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const cost = formatCurrency(getEstimatedCost(itinerary));
  const income = formatCurrency(getEstimatedIncome(itinerary));
  const profit = formatCurrency(getEstimatedProfit(itinerary));
  const yieldValue = getExpectedYield(itinerary);

  if (!cost && !income && !profit && !hasValue(yieldValue)) return null;

  return (
    <Section title="Financial Summary" icon={IndianRupee}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cost && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card text-center h-full flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Total Cost</p>
            <p className="mt-2 font-display text-xl font-bold">{cost}</p>
          </div>
        )}
        {income && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card text-center h-full flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Income</p>
            <p className="mt-2 font-display text-xl font-bold">{income}</p>
          </div>
        )}
        {profit && (
          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-5 shadow-card text-center h-full flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Estimated Profit</p>
            <p className="mt-2 font-display text-xl font-bold text-primary">{profit}</p>
          </div>
        )}
        {hasValue(yieldValue) && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card text-center h-full flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected Yield</p>
            <p className="mt-2 font-display text-xl font-bold">{safe(yieldValue)}</p>
          </div>
        )}
      </div>
    </Section>
  );
});

/* ============================================================================
 * FARMING CALENDAR — the most important section. A scannable table, not
 * a wall of AI text: Week/Date, Task, Description, and (only when the
 * backend actually provides them per-activity) Equipment and Labour.
 * ==========================================================================
 */

const FarmingCalendarSection = memo(function FarmingCalendarSection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const timeline = itinerary.timeline ?? [];
  const showEquipment = timelineHasEquipmentColumn(timeline);
  const showLabour = timelineHasLabourColumn(timeline);

  const columns = [
    "Week / Date",
    "Task",
    "Description",
    ...(showEquipment ? ["Equipment"] : []),
    ...(showLabour ? ["Labour"] : []),
  ];

  return (
    <Section title="Farming Calendar" icon={CalendarDays}>
      {timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground">No farming calendar is available for this plan.</p>
      ) : (
        <ScrollableTable>
          <TableHeadRow columns={columns} />
          <tbody>
            {timeline.map((entry, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                <td className="px-4 py-3 font-semibold whitespace-nowrap align-top">{getTimelineWhen(entry)}</td>
                <td className="px-4 py-3 font-medium align-top">{safe(entry.title, "Untitled Task")}</td>
                <td className="px-4 py-3 text-muted-foreground align-top">{safe(entry.description, "—")}</td>
                {showEquipment && (
                  <td className="px-4 py-3 align-top">{listValue(entry.equipment) ?? "—"}</td>
                )}
                {showLabour && <td className="px-4 py-3 align-top">{listValue(entry.labour) ?? "—"}</td>}
              </tr>
            ))}
          </tbody>
        </ScrollableTable>
      )}
    </Section>
  );
});

/* ============================================================================
 * TODAY'S RECOMMENDATION — shown only when the backend returns enough data
 * ==========================================================================
 */

const TodaysRecommendationSection = memo(function TodaysRecommendationSection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const task = itinerary.todayTask;
  if (!task || (!task.activity && !task.recommendation)) return null;

  return (
    <Section title="Today's Recommendation" icon={Info}>
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6 space-y-3">
        {task.activity && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Current Activity
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{task.activity}</p>
          </div>
        )}
        {task.recommendation && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Recommendation
            </p>
            <p className="mt-0.5 text-sm text-foreground">{task.recommendation}</p>
          </div>
        )}
      </div>
    </Section>
  );
});

/* ============================================================================
 * IRRIGATION SCHEDULE
 * ==========================================================================
 */

const IrrigationSection = memo(function IrrigationSection({ itinerary }: { itinerary: CropItinerary }) {
  const rows = itinerary.irrigationSchedule ?? [];

  return (
    <Section title="Irrigation Schedule" icon={Droplets}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No irrigation schedule available.</p>
      ) : (
        <ScrollableTable>
          <TableHeadRow columns={["Stage", "When to Water", "Water Requirement"]} />
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                <td className="px-4 py-3 font-medium">{safe(row.stage)}</td>
                <td className="px-4 py-3">{safe(row.frequency)}</td>
                <td className="px-4 py-3">{safe(row.waterRequirement)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollableTable>
      )}
    </Section>
  );
});

/* ============================================================================
 * FERTILIZER SCHEDULE
 * ==========================================================================
 */

const FertilizerSection = memo(function FertilizerSection({ itinerary }: { itinerary: CropItinerary }) {
  const rows = itinerary.fertilizerSchedule ?? [];

  return (
    <Section title="Fertilizer Schedule" icon={Sprout}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fertilizer schedule available.</p>
      ) : (
        <ScrollableTable>
          <TableHeadRow columns={["Stage", "Fertilizer", "Quantity", "Time"]} />
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                <td className="px-4 py-3 font-medium">{safe(row.stage)}</td>
                <td className="px-4 py-3">{safe(row.fertilizer)}</td>
                <td className="px-4 py-3">{safe(row.quantity)}</td>
                <td className="px-4 py-3">{safe(row.time)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollableTable>
      )}
    </Section>
  );
});

/* ============================================================================
 * EQUIPMENT REQUIREMENT
 * ==========================================================================
 */

const EquipmentSection = memo(function EquipmentSection({ itinerary }: { itinerary: CropItinerary }) {
  const items = itinerary.equipmentRequired ?? [];

  return (
    <Section title="Equipment Requirement" icon={Wrench}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No equipment recommendations available.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {items.map((item, i) => (
            <div key={i} className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <p className="font-display text-sm font-semibold">{safe(item.name, "Equipment")}</p>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{safe(item.purpose)}</p>
              <p className="text-xs font-semibold text-primary mt-1.5">
                Estimated Rent: {safe(item.estimatedRent)}
              </p>
              <Link
                to="/renter/search"
                className="no-print mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                <Search className="h-3.5 w-3.5" />
                Rent Equipment
              </Link>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
});

/* ============================================================================
 * LABOUR REQUIREMENT
 * ==========================================================================
 */

const LabourSection = memo(function LabourSection({ itinerary }: { itinerary: CropItinerary }) {
  const rows = itinerary.labourRequirement ?? [];

  return (
    <Section title="Labour Requirement" icon={Users}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No labour requirements are available.</p>
      ) : (
        <ScrollableTable>
          <TableHeadRow columns={["Activity", "Workers", "Days Required"]} />
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                <td className="px-4 py-3 font-medium">{safe(row.activity, "Activity")}</td>
                <td className="px-4 py-3">{safeCount(getLabourWorkers(row))}</td>
                <td className="px-4 py-3">{safeCount(getLabourDays(row))}</td>
              </tr>
            ))}
          </tbody>
        </ScrollableTable>
      )}
    </Section>
  );
});

/* ============================================================================
 * PEST & DISEASE — expandable cards, problem + solution only.
 * ==========================================================================
 */

const PestManagementSection = memo(function PestManagementSection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const items = itinerary.pestAndDiseaseManagement ?? [];

  return (
    <Section title="Pest & Disease" icon={ShieldAlert}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pest or disease guidance is available.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-destructive/25 bg-destructive/5 p-4 shadow-card"
              open={i === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wide text-destructive">
                    {safe(item.problem, "Issue")}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-destructive flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-foreground">{safe(item.solution)}</p>
            </details>
          ))}
        </div>
      )}
    </Section>
  );
});

/* ============================================================================
 * CHECKLIST SECTIONS — Weed Management, Land Preparation, Precautions, Tips
 * ==========================================================================
 */

function Checklist({
  items,
  icon: Icon,
  tone,
}: {
  items: string[];
  icon: React.ElementType;
  tone: "primary" | "warning" | "success";
}) {
  const toneClasses = tone === "warning" ? "text-amber-600" : "text-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${toneClasses}`} />
          <p className="text-sm text-foreground">{item}</p>
        </div>
      ))}
    </div>
  );
}

const LandPreparationSection = memo(function LandPreparationSection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const items = getLandPreparationItems(itinerary);
  return (
    <Section title="Land Preparation" icon={Layers}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No land preparation guidance is available.</p>
      ) : (
        <Checklist items={items} icon={CheckCircle2} tone="primary" />
      )}
    </Section>
  );
});

const WeedManagementSection = memo(function WeedManagementSection({
  itinerary,
}: {
  itinerary: CropItinerary;
}) {
  const items = itinerary.weedManagement ?? [];
  return (
    <Section title="Weed Management" icon={CheckCircle2}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No weed management guidance is available.</p>
      ) : (
        <Checklist items={items} icon={CheckCircle2} tone="primary" />
      )}
    </Section>
  );
});

const PrecautionsSection = memo(function PrecautionsSection({ itinerary }: { itinerary: CropItinerary }) {
  const items = itinerary.precautions ?? [];
  return (
    <Section title="Precautions" icon={AlertTriangle}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No specific precautions were flagged.</p>
      ) : (
        <Checklist items={items} icon={AlertTriangle} tone="warning" />
      )}
    </Section>
  );
});

const TipsSection = memo(function TipsSection({ itinerary }: { itinerary: CropItinerary }) {
  const items = itinerary.tips ?? [];
  return (
    <Section title="AI Tips" icon={Lightbulb}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expert tips are available yet.</p>
      ) : (
        <Checklist items={items} icon={CheckCircle2} tone="success" />
      )}
    </Section>
  );
});

/* ============================================================================
 * WEATHER — only real fields are shown; missing individual values are
 * simply omitted rather than padded out with repeated "Not available".
 * ==========================================================================
 */

const WeatherSection = memo(function WeatherSection({ itinerary }: { itinerary: CropItinerary }) {
  const weather = getWeather(itinerary);
  const lastUpdated = formatDate(getWeatherLastUpdated(weather));

  const stats = weather
    ? ([
        hasValue(weather.temperature) && { label: "Temperature", value: `${weather.temperature}°C` },
        hasValue(weather.humidity) && { label: "Humidity", value: `${weather.humidity}%` },
        hasValue(weather.condition) && { label: "Condition", value: String(weather.condition) },
        hasValue(weather.recommendation) && { label: "AI Recommendation", value: String(weather.recommendation) },
        lastUpdated && { label: "Last Updated", value: lastUpdated },
      ].filter(Boolean) as { label: string; value: string }[])
    : [];

  return (
    <Section title="Weather" icon={CloudRain}>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
        {stats.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-5">
            {stats.map((stat) => (
              <SummaryItem key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Weather information currently unavailable.</p>
        )}
      </div>
    </Section>
  );
});

/* ============================================================================
 * SKELETON (loading state)
 * ==========================================================================
 */

function ReportSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 space-y-8 animate-pulse">
      <div className="h-4 w-56 rounded bg-muted" />
      <div className="h-20 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-muted" />
    </div>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ==========================================================================
 */

function EmptyState() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
        <Leaf className="h-10 w-10 text-muted-foreground opacity-40" />
      </div>
      <h1 className="mt-6 font-display text-xl font-bold">Farming guide not found.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This report may have been removed, or the link is no longer valid.
      </p>
      <Link
        to="/renter/ai"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to AI Dashboard
      </Link>
    </div>
  );
}

/* ============================================================================
 * ERROR STATE — friendly, never exposes the raw backend error.
 * ==========================================================================
 */

function ReportErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mt-6 font-display text-xl font-bold">Couldn't load this report</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong while fetching your farming guide. Please try again.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition"
        >
          <FileText className="h-4 w-4" />
          Retry
        </button>
        <Link
          to="/renter/ai"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Dashboard
        </Link>
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ==========================================================================
 */

function AIReportPage() {
  const { id } = Route.useParams();
  const { message, trigger } = useInlineToast();

  const {
    data: itinerary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ai-itinerary", id],
    queryFn: () => fetchItinerary(id),
    enabled: Boolean(id),
    retry: 1,
  });

  const isNotFound = useMemo(() => axios.isAxiosError(error) && error.response?.status === 404, [error]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FarmFleet Smart Farming Guide", url: shareUrl });
        return;
      } catch {
        // Share was cancelled or failed — fall back to clipboard below.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      trigger("Report link copied to clipboard");
    } catch {
      trigger("Unable to share this report");
    }
  };

  // Calls the existing backend PDF endpoint directly and downloads the
  // response — the frontend never generates the PDF itself (no
  // html2canvas / jsPDF). Adjust the path below only if it does not match
  // the route already exposed by the PDF controller in this backend.
  const handleDownloadPdf = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/itinerary/${id}/pdf`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${localStorage.getItem("farmerToken") ?? ""}` },
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `FarmFleet_AI_Report_${itinerary?._id ?? id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      trigger("Could not download the PDF. Please try again.");
    }
  };

  if (isLoading) return <ReportSkeleton />;
  if (isNotFound) return <EmptyState />;
  if (isError || !itinerary) return <ReportErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PrintStyles />
      <section id="ai-report-printable" className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 space-y-8">
        <Breadcrumb crop={itinerary.crop} />

        <ReportHeader
          itinerary={itinerary}
          onDownloadPdf={handleDownloadPdf}
          onPrint={handlePrint}
          onShare={handleShare}
        />

        <FarmInformationSection itinerary={itinerary} />
        <FinancialSummarySection itinerary={itinerary} />
        <FarmingCalendarSection itinerary={itinerary} />
        <TodaysRecommendationSection itinerary={itinerary} />
        <IrrigationSection itinerary={itinerary} />
        <FertilizerSection itinerary={itinerary} />
        <EquipmentSection itinerary={itinerary} />
        <LabourSection itinerary={itinerary} />
        <PestManagementSection itinerary={itinerary} />
        <WeedManagementSection itinerary={itinerary} />
        <LandPreparationSection itinerary={itinerary} />
        <PrecautionsSection itinerary={itinerary} />
        <TipsSection itinerary={itinerary} />
        <WeatherSection itinerary={itinerary} />

        <div className="h-4" />
      </section>

      <InlineToast message={message} />
    </>
  );
}