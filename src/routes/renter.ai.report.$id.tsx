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
  CalendarDays,
  FileText,
  Thermometer,
  Wind,
  Clock,
  Tractor,
  Sun,
  ArrowDown,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/renter/ai/report/$id")({
  head: () => ({ meta: [{ title: "Smart Farming Guide — FarmFleet AI" }] }),
  component: AIReportPage,
});

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

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
interface WeatherSnapshot {
  temperature?: number | string;
  temp?: number | string;
  humidity?: number | string;
  condition?: string;
  weather?: string;
  description?: string;
  windSpeed?: number | string;
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
  bestSowingSeason?: string;
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
  aiSummary?: AiSummary;
  seedRecommendation?: { variety?: string; quantity?: string };
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
  createdAt?: string;
}
interface ItineraryApiResponse {
  success?: boolean;
  itinerary?: CropItinerary;
  data?: CropItinerary;
}

async function fetchItinerary(id: string): Promise<CropItinerary> {
  const { data } = await axios.get<ItineraryApiResponse | CropItinerary>(
    `${API_BASE_URL}/api/ai/itinerary/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("farmerToken") || localStorage.getItem("token") || ""}`,
      },
    }
  );
  const r = data as ItineraryApiResponse;
  return (r.itinerary ?? r.data ?? (data as CropItinerary)) as CropItinerary;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}
function safe(v: unknown, fb = "Not available"): string {
  return has(v) ? String(v) : fb;
}
function safeCount(v: unknown): string {
  if (!has(v)) return "Not Available";
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (Number.isFinite(n) && n === 0) return "Not Available";
  return String(v);
}
function fmtDate(v?: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}
function listVal(v?: string | string[]): string | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.filter(Boolean).join(", ") || null;
  return v || null;
}
function getWhen(e: TimelineEntry): string {
  const date = fmtDate(e.currentDate ?? e.originalDate ?? e.scheduledDate);
  const week = has(e.week) ? `Week ${e.week}` : null;
  if (date && week) return `${week} · ${date}`;
  if (date) return date;
  if (week) return week;
  return "";
}
function getWeather(it: CropItinerary): WeatherSnapshot | null {
  if (it.weather && Object.keys(it.weather).length > 0) return it.weather;
  if (it.lastWeatherCheck && typeof it.lastWeatherCheck === "object")
    return it.lastWeatherCheck as WeatherSnapshot;
  return null;
}
function getCropDuration(it: CropItinerary) {
  return it.aiSummary?.cropDuration ?? it.cropDuration;
}
function getBestSeason(it: CropItinerary) {
  return it.season ?? it.bestSeason ?? it.aiSummary?.bestSowingSeason;
}
function getLandPrepItems(it: CropItinerary): string[] {
  const v = it.landPreparation;
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim())
    return v.split(/\r?\n|•/).map(l => l.trim()).filter(Boolean);
  return [];
}
function getLabourWorkers(e: LabourEntry) { return e.workers ?? e.workersRequired; }
function getLabourDays(e: LabourEntry) { return e.days ?? e.estimatedDays; }

// Stage emojis
const EMOJIS: [string, string][] = [
  ["land preparation", "🌱"], ["soil", "🌱"],
  ["sow", "🌾"], ["plant", "🌾"],
  ["germination", "🌿"],
  ["irrigat", "💧"], ["water", "💧"],
  ["fertili", "🌿"],
  ["pest", "🛡️"], ["disease", "🛡️"],
  ["harvest", "🌾"],
  ["weed", "✂️"], ["prune", "✂️"],
  ["spray", "💊"],
];
function stageEmoji(title?: string): string {
  if (!title) return "📋";
  const lower = title.toLowerCase();
  for (const [k, e] of EMOJIS) if (lower.includes(k)) return e;
  return "📋";
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
  }, [msg]);
  return { msg, show: (m: string) => setMsg(m) };
}
function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-elevated">
      <Sparkles className="h-4 w-4 text-primary" />
      {msg}
    </div>
  );
}

// ─── Print styles ─────────────────────────────────────────────────────────────

function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #farmguide, #farmguide * { visibility: visible; }
        #farmguide { position: absolute; inset: 0; width: 100%; }
        .no-print { display: none !important; }
        section { break-inside: avoid; }
        table { break-inside: avoid; }
        tr { break-inside: avoid; }
        @page { size: A4; margin: 14mm; }
      }
    `}</style>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

/** Section with icon label */
function Sec({
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

/** Responsive simple table */
function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
}) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-card">
      <table className="w-full min-w-[480px] text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-primary text-primary-foreground">
            {columns.map(c => (
              <th key={c} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Green-tick / warning checklist */
function Checklist({
  items,
  warning,
}: {
  items: string[];
  warning?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          {warning ? (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          )}
          <p className="text-sm leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Loading / Error / Empty ──────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 space-y-8 animate-pulse">
      <div className="h-20 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i=><div key={i} className="h-24 rounded-2xl bg-muted"/>)}
      </div>
      {[1,2,3,4,5].map(i=>(
        <div key={i} className="space-y-3">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
        <Leaf className="h-10 w-10 text-muted-foreground opacity-40" />
      </div>
      <h1 className="mt-6 font-display text-xl font-bold">Guide not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This report may have been removed or the link is no longer valid.
      </p>
      <Link to="/renter/ai" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
        <ArrowLeft className="h-4 w-4" /> Back to AI Dashboard
      </Link>
    </div>
  );
}

function Err({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mt-6 font-display text-xl font-bold">Couldn't load this guide</h1>
      <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
          <FileText className="h-4 w-4" /> Retry
        </button>
        <Link to="/renter/ai" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────

const Header = memo(function Header({
  it,
  onPdf,
  onPrint,
  onBack,
}: {
  it: CropItinerary;
  onPdf: () => void;
  onPrint: () => void;
  onBack: () => void;
}) {
  const district = it.location?.district;
  const state = it.location?.state;
  const place = [district, state].filter(Boolean).join(", ");
  const generated = fmtDate(it.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Identity */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Sprout className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{it.crop} Farming Guide</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {place && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {place}
                </span>
              )}
              {generated && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  Generated {generated}
                </span>
              )}
              {it.status && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {it.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            onClick={onPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ─── SECTION 1: Farm Information ──────────────────────────────────────────────

const FarmInfo = memo(function FarmInfo({ it }: { it: CropItinerary }) {
  const fields = [
    { icon: Sprout, label: "Crop", value: it.crop },
    { icon: MapPin, label: "State", value: it.location?.state },
    { icon: MapPin, label: "District", value: it.location?.district },
    {
      icon: Layers,
      label: "Land Area",
      value: has(it.landArea) ? `${it.landArea} Acres` : undefined,
    },
    { icon: Layers, label: "Soil Type", value: it.soilType },
    { icon: Droplets, label: "Water Source", value: it.waterSource },
    {
      icon: IndianRupee,
      label: "Budget",
      value: has(it.budget)
        ? `₹${Number(it.budget).toLocaleString("en-IN")}`
        : undefined,
    },
    { icon: Clock, label: "Crop Duration", value: getCropDuration(it) },
    { icon: Sun, label: "Best Season", value: getBestSeason(it) },
    { icon: Leaf, label: "Seed Variety", value: it.seedRecommendation?.variety },
    { icon: Leaf, label: "Seed Quantity", value: it.seedRecommendation?.quantity },
  ].filter(f => has(f.value));

  if (!fields.length) return null;

  return (
    <Sec title="Farm Information" icon={Layers}>
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {fields.map(({ icon: Icon, label, value }, i) => (
            <div
              key={label}
              className={`flex items-center gap-4 p-5 ${
                i > 0 && i % 3 === 0 ? "sm:border-t border-border" : ""
              } ${i >= 3 ? "border-t border-border" : ""}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-semibold truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
});

// ─── SECTION 2: What Should I Do? (Task Cards) ───────────────────────────────

const TaskCards = memo(function TaskCards({ it }: { it: CropItinerary }) {
  const timeline = it.timeline ?? [];
  if (!timeline.length) return null;

  return (
    <Sec title="What Should I Do?" icon={CheckCircle2}>
      <div className="space-y-3">
        {timeline.map((entry, i) => {
          const when = getWhen(entry);
          const descLines = entry.description
            ? entry.description.split(/\.\s+|•|\n/).map(l => l.trim()).filter(Boolean)
            : [];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
              className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center gap-3 bg-primary/5 border-b border-border/60 px-5 py-3">
                <span className="text-xl">{stageEmoji(entry.title)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-base leading-tight">
                    {safe(entry.title, "Task")}
                  </p>
                  {when && (
                    <p className="text-xs text-primary font-semibold mt-0.5">{when}</p>
                  )}
                </div>
                {entry.status && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2.5 py-0.5">
                    {entry.status}
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="px-5 py-4">
                {descLines.length > 1 ? (
                  <ul className="space-y-1.5">
                    {descLines.map((line, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : entry.description ? (
                  <p className="text-sm text-foreground leading-relaxed">{entry.description}</p>
                ) : null}

                {/* Equipment / Labour tags */}
                {(listVal(entry.equipment) || listVal(entry.labour)) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listVal(entry.equipment) && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 text-xs text-muted-foreground">
                        <Wrench className="h-3 w-3 text-primary" />
                        {listVal(entry.equipment)}
                      </span>
                    )}
                    {listVal(entry.labour) && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3 text-primary" />
                        {listVal(entry.labour)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Sec>
  );
});

// ─── SECTION 3: Farming Timeline (vertical roadmap) ──────────────────────────

const FarmingTimeline = memo(function FarmingTimeline({ it }: { it: CropItinerary }) {
  const timeline = it.timeline ?? [];
  if (!timeline.length) return null;

  return (
    <Sec title="Farming Timeline" icon={CalendarDays}>
      <div className="relative pl-10 space-y-0">
        {/* Vertical connector line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border rounded-full" />

        {timeline.map((entry, i) => (
          <div key={i} className="relative">
            {/* Node */}
            <div className="absolute -left-6 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-card border-2 border-primary/40 text-base shadow-sm">
              {stageEmoji(entry.title)}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card mb-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="font-semibold text-sm">{safe(entry.title, "Task")}</p>
                {getWhen(entry) && (
                  <span className="text-[11px] font-medium text-primary shrink-0">
                    {getWhen(entry)}
                  </span>
                )}
              </div>
              {entry.description && (
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {entry.description}
                </p>
              )}
            </div>

            {/* Arrow between stages */}
            {i < timeline.length - 1 && (
              <div className="flex justify-start pl-0 mb-2">
                <ArrowDown className="h-4 w-4 text-primary/30 ml-[-6px]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Sec>
  );
});

// ─── SECTION 4: Important Dates (week / date milestones) ─────────────────────

const ImportantDates = memo(function ImportantDates({ it }: { it: CropItinerary }) {
  const timeline = it.timeline ?? [];
  if (!timeline.length) return null;

  return (
    <Sec title="Important Dates" icon={CalendarDays}>
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {timeline.map((entry, i) => {
            const when = getWhen(entry);
            if (!when && !entry.title) return null;
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-xl shrink-0">{stageEmoji(entry.title)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{safe(entry.title, "Task")}</p>
                  {when && (
                    <p className="text-xs text-primary font-medium mt-0.5">{when}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sec>
  );
});

// ─── SECTION 5: Irrigation Guide ─────────────────────────────────────────────

const IrrigationGuide = memo(function IrrigationGuide({ it }: { it: CropItinerary }) {
  const rows = it.irrigationSchedule ?? [];
  if (!rows.length) return null;

  return (
    <Sec title="Irrigation Guide" icon={Droplets}>
      <SimpleTable
        columns={["Stage", "When to Water", "Water Requirement"]}
        rows={rows.map(r => [
          <span className="font-medium">{safe(r.stage)}</span>,
          safe(r.frequency),
          safe(r.waterRequirement),
        ])}
      />
    </Sec>
  );
});

// ─── SECTION 6: Fertilizer Guide ─────────────────────────────────────────────

const FertilizerGuide = memo(function FertilizerGuide({ it }: { it: CropItinerary }) {
  const rows = it.fertilizerSchedule ?? [];
  if (!rows.length) return null;

  return (
    <Sec title="Fertilizer Guide" icon={Sprout}>
      <SimpleTable
        columns={["Stage", "Fertilizer", "Quantity", "Time"]}
        rows={rows.map(r => [
          <span className="font-medium">{safe(r.stage)}</span>,
          safe(r.fertilizer),
          safe(r.quantity),
          safe(r.time),
        ])}
      />
    </Sec>
  );
});

// ─── SECTION 7: Equipment Needed ─────────────────────────────────────────────

const EquipmentNeeded = memo(function EquipmentNeeded({ it }: { it: CropItinerary }) {
  const items = it.equipmentRequired ?? [];
  if (!items.length) return null;

  return (
    <Sec title="Equipment Needed" icon={Wrench}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Tractor className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm leading-snug">{safe(item.name, "Equipment")}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3">
              {safe(item.purpose)}
            </p>
            {has(item.estimatedRent) && (
              <p className="text-sm font-semibold text-primary mb-3">
                Est. Rent: {item.estimatedRent}
              </p>
            )}
            <Link
              to="/renter/search"
              className="no-print inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              <Search className="h-3.5 w-3.5" />
              Rent Equipment
            </Link>
          </motion.div>
        ))}
      </div>
    </Sec>
  );
});

// ─── SECTION 8: Labour Requirement ───────────────────────────────────────────

const LabourReq = memo(function LabourReq({ it }: { it: CropItinerary }) {
  const rows = it.labourRequirement ?? [];
  if (!rows.length) return null;

  return (
    <Sec title="Labour Requirement" icon={Users}>
      <SimpleTable
        columns={["Activity", "Workers Needed", "Days Required"]}
        rows={rows.map(r => [
          <span className="font-medium">{safe(r.activity, "Activity")}</span>,
          safeCount(getLabourWorkers(r)),
          safeCount(getLabourDays(r)),
        ])}
      />
    </Sec>
  );
});

// ─── SECTION 9: Weed Management ──────────────────────────────────────────────

const WeedMgmt = memo(function WeedMgmt({ it }: { it: CropItinerary }) {
  const items = it.weedManagement ?? [];
  if (!items.length) return null;
  return (
    <Sec title="Weed Management" icon={CheckCircle2}>
      <Checklist items={items} />
    </Sec>
  );
});

// ─── SECTION 10: Pest & Disease ───────────────────────────────────────────────

const PestDisease = memo(function PestDisease({ it }: { it: CropItinerary }) {
  const items = it.pestAndDiseaseManagement ?? [];
  if (!items.length) return null;

  return (
    <Sec title="Pest & Disease" icon={ShieldAlert}>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 shadow-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm font-bold text-destructive">{safe(item.problem, "Issue")}</p>
            </div>
            <div className="border-t border-destructive/15 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Solution
              </p>
              <p className="text-sm leading-relaxed">{safe(item.solution)}</p>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
});

// ─── SECTION 11: Precautions ─────────────────────────────────────────────────

const Precautions = memo(function Precautions({ it }: { it: CropItinerary }) {
  const items = it.precautions ?? [];
  if (!items.length) return null;
  return (
    <Sec title="Precautions" icon={AlertTriangle}>
      <Checklist items={items} warning />
    </Sec>
  );
});

// ─── SECTION 12: Expert Tips ─────────────────────────────────────────────────

const ExpertTips = memo(function ExpertTips({ it }: { it: CropItinerary }) {
  const items = it.tips ?? [];
  if (!items.length) return null;
  return (
    <Sec title="Expert Tips" icon={Lightbulb}>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
});

// ─── SECTION 13: Weather ─────────────────────────────────────────────────────

const Weather = memo(function Weather({ it }: { it: CropItinerary }) {
  const rawW = getWeather(it) || {};
  const district = it.location?.district || it.location?.state || "Local District";

  const temp = rawW.temperature ?? rawW.temp ?? 28;
  const humidity = rawW.humidity ?? 65;
  const condition = rawW.condition || rawW.weather || rawW.description || "Clear / Normal";
  const windSpeed = rawW.windSpeed ?? 12;
  const recommendation = rawW.recommendation || "Favourable weather conditions for current farming activities.";

  return (
    <Sec title="Weather" icon={CloudRain}>
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="bg-primary/5 px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Live Weather — {district}
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2.5 py-0.5">
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="flex items-center gap-3 p-4">
            <Thermometer className="h-5 w-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Temperature</p>
              <p className="text-sm font-bold">{temp}°C</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border-t sm:border-t-0">
            <Droplets className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Humidity</p>
              <p className="text-sm font-bold">{humidity}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border-t sm:border-t-0">
            <Wind className="h-5 w-5 text-sky-500 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Condition</p>
              <p className="text-sm font-bold capitalize">{condition}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 space-y-1.5 bg-muted/20">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-primary">Recommendation: </span>
            {recommendation}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <Clock className="h-3 w-3" />
            Weather forecast updated continuously for {district}
          </p>
        </div>
      </div>
    </Sec>
  );
});

// ─── LAND PREPARATION (internal — shown as checklist if present) ──────────────

const LandPrep = memo(function LandPrep({ it }: { it: CropItinerary }) {
  const items = getLandPrepItems(it);
  if (!items.length) return null;
  return (
    <Sec title="Land Preparation" icon={Layers}>
      <Checklist items={items} />
    </Sec>
  );
});

// ─── TODAY'S FOCUS (if backend provides it) ───────────────────────────────────

const TodaysFocus = memo(function TodaysFocus({ it }: { it: CropItinerary }) {
  const task = it.todayTask;
  if (!task || (!task.activity && !task.recommendation)) return null;

  return (
    <Sec title="Today's Focus" icon={CheckCircle2}>
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm text-xl">
            📌
          </div>
          <div className="space-y-3 flex-1">
            {task.activity && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Current Activity
                </p>
                <p className="text-base font-bold mt-0.5">{task.activity}</p>
              </div>
            )}
            {task.recommendation && (
              <p className="text-sm leading-relaxed">{task.recommendation}</p>
            )}
            {task.scheduledDate && fmtDate(task.scheduledDate) && (
              <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {fmtDate(task.scheduledDate)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Sec>
  );
});

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function AIReportPage() {
  const { id } = Route.useParams();
  const { msg, show } = useToast();

  const { data: it, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ai-itinerary", id],
    queryFn: () => fetchItinerary(id),
    enabled: Boolean(id),
    retry: 1,
  });

  const isNotFound = useMemo(
    () => axios.isAxiosError(error) && error.response?.status === 404,
    [error]
  );

  const handlePrint = () => window.print();
  const handleBack = () => window.history.back();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "FarmFleet Farming Guide", url }); return; }
      catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); show("Link copied!"); }
    catch { show("Unable to share"); }
  };

  const handlePdf = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/ai/itinerary/${id}/pdf`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${localStorage.getItem("farmerToken") || localStorage.getItem("token") || ""}` },
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `FarmFleet_Guide_${it?._id ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          show(json.message || "Could not download PDF. Please try again.");
          return;
        } catch {
          /* fallback */
        }
      }
      show("Could not download PDF. Please try again.");
    }
  };

  if (isLoading) return <Skeleton />;
  if (isNotFound) return <Empty />;
  if (isError || !it) return <Err onRetry={() => refetch()} />;

  return (
    <>
      <PrintStyles />

      <div
        id="farmguide"
        className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 space-y-10"
      >
        {/* Breadcrumb */}
        <nav className="no-print flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link to="/renter/ai" className="hover:text-primary transition-colors">
            AI Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{it.crop} Guide</span>
        </nav>

        {/* Header */}
        <Header it={it} onPdf={handlePdf} onPrint={handlePrint} onBack={handleBack} />

        {/* Section 1: Farm Info */}
        <FarmInfo it={it} />

        {/* Today's focus (if backend provides) */}
        <TodaysFocus it={it} />

        {/* Section 2: What Should I Do */}
        <TaskCards it={it} />

        {/* Section 3: Farming Timeline */}
        <FarmingTimeline it={it} />

        {/* Section 4: Important Dates */}
        <ImportantDates it={it} />

        {/* Section 5: Irrigation */}
        <IrrigationGuide it={it} />

        {/* Section 6: Fertilizer */}
        <FertilizerGuide it={it} />

        {/* Section 7: Equipment */}
        <EquipmentNeeded it={it} />

        {/* Section 8: Labour */}
        <LabourReq it={it} />

        {/* Land Prep checklist (if backend provides) */}
        <LandPrep it={it} />

        {/* Section 9: Weed Management */}
        <WeedMgmt it={it} />

        {/* Section 10: Pest & Disease */}
        <PestDisease it={it} />

        {/* Section 11: Precautions */}
        <Precautions it={it} />

        {/* Section 12: Expert Tips */}
        <ExpertTips it={it} />

        {/* Section 13: Weather */}
        <Weather it={it} />

        <div className="h-8" />
      </div>

      <Toast msg={msg} />
    </>
  );
}