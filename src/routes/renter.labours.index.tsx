
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Step } from "react-joyride";
import { OnboardingTour } from "@/components/OnboardingTour";
import { AppShell } from "@/components/AppShell";
import { VoiceButton } from "@/components/VoiceButton";
import { EquipmentMap } from "@/components/EquipmentMap";
import { calculateHaversineDistance } from "@/utils/distance";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  Map as MapIcon,
  ChevronDown,
  X,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Tractor,
  Sprout,
  Droplets,
  Package,
  Wrench,
  MapPin,
  User,
  Clock,
  Star,
  BadgeCheck,
  Users,
  Navigation,
} from "lucide-react";

export const Route = createFileRoute("/renter/labours/")({
  head: () => ({
    meta: [{ title: "Find Labour — FarmFleet" }],
  }),
  component: RenterLabours,
});

/* ─── Types ─────────────────────────────────────────────────────── */

interface Labour {
  _id: string;
  fullName: string;
  profileImage: string;
  primarySkill: string;
  experience: number;
  dailyCharges: number;
  village: string;
  district: string;
  state: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  availability: boolean;
  rating: number;
  totalReviews: number;
  mobile: string;
  _distance?: number | null;
}

type SortKey = "highest-rated" | "lowest-charges" | "most-experienced" | "newest" | "distance-low";
type ViewMode = "grid" | "list" | "map";

/* ─── Skill icon map ──────────────────────────────────────────────── */

const SKILL_ICONS: Record<string, React.ReactNode> = {
  "Tractor Operator": <Tractor className="h-4 w-4" />,
  "Harvester Operator": <Sprout className="h-4 w-4" />,
  "Sprayer Operator": <Droplets className="h-4 w-4" />,
  "Loader Operator": <Package className="h-4 w-4" />,
  "Field Worker": <Users className="h-4 w-4" />,
  Mechanic: <Wrench className="h-4 w-4" />,
};

function skillIcon(skill: string) {
  return SKILL_ICONS[skill] ?? <Wrench className="h-4 w-4" />;
}

/* ─── Skeletons — reused exactly from Equipment Discover ─────────── */

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded-lg w-3/4" />
        <div className="h-3 bg-muted rounded-lg w-1/2" />
        <div className="h-3 bg-muted rounded-lg w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-muted rounded-lg w-1/3" />
          <div className="h-8 bg-muted rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

function SkeletonListRow() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 animate-pulse">
      <div className="h-28 w-40 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-muted rounded-lg w-1/2" />
        <div className="h-3 bg-muted rounded-lg w-1/3" />
        <div className="h-3 bg-muted rounded-lg w-2/3" />
        <div className="h-8 bg-muted rounded-xl w-24 mt-auto" />
      </div>
    </div>
  );
}

/* ─── Labour Grid Card ────────────────────────────────────────────── */

function LabourGridCard({ l, index }: { l: Labour; index: number }) {
  const nav = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
      className="group rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="relative h-48 bg-gradient-to-br from-muted to-muted/40 overflow-hidden shrink-0 flex items-center justify-center">
        {l.profileImage ? (
          <img
            src={l.profileImage}
            alt={l.fullName}
            loading="lazy"
            className="h-24 w-24 rounded-full object-cover border-4 border-card shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-24 w-24 rounded-full border-4 border-card shadow-sm bg-muted flex items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground opacity-40" />
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold backdrop-blur-sm shadow-sm">
          <BadgeCheck className="h-3 w-3" />
          Verified Labour
        </span>
        <span
          className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm ${
            l.availability ? "bg-emerald-500/90 text-white" : "bg-black/40 text-white"
          }`}
        >
          {l.availability ? "Available" : "Unavailable"}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg leading-tight line-clamp-1">{l.fullName}</h3>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {skillIcon(l.primarySkill)}
            <span className="line-clamp-1">{l.primarySkill}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{l.experience} Years Experience</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {l.location || `${l.village}, ${l.district}`}
              </span>
            </div>
            {l._distance != null && (
              <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                📍 {l._distance.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ₹{l.dailyCharges}
            </span>
            <span className="text-xs text-muted-foreground">/day</span>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {l.rating.toFixed(1)}
              <span className="opacity-70">· {l.totalReviews} Reviews</span>
            </p>
          </div>
  <button
    type="button"
    onClick={() => {
      console.log("Clicked");
      console.log("ID:", l._id);

      try {
        nav({
          to: "/renter/labours/$id",
          params: {
            id: l._id,
          },
        });

        console.log("Navigation called");
      } catch (err) {
        console.error(err);
      }
    }}
    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
  >
    View Profile
  </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Labour List Card ────────────────────────────────────────────── */

function LabourListCard({ l, index }: { l: Labour; index: number }) {
  const nav = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      className="flex flex-col sm:flex-row rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-44 sm:h-auto sm:w-44 bg-gradient-to-br from-muted to-muted/40 shrink-0 overflow-hidden flex items-center justify-center">
        {l.profileImage ? (
          <img
            src={l.profileImage}
            alt={l.fullName}
            loading="lazy"
            className="h-20 w-20 rounded-full object-cover border-4 border-card shadow-sm"
          />
        ) : (
          <div className="h-20 w-20 rounded-full border-4 border-card shadow-sm bg-muted flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
        )}

        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold">
          <BadgeCheck className="h-2.5 w-2.5" />
          Verified
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base truncate">
                {l.fullName}
              </h3>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[11px] font-medium">
                {skillIcon(l.primarySkill)}
                {l.primarySkill}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  l.availability
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {l.availability ? "Available" : "Unavailable"}
              </span>

              {l._distance != null && (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                  📍 {l._distance.toFixed(1)} km away
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {l.experience} Years Experience
              </span>

              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {l.village}, {l.district}
              </span>

              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {l.rating.toFixed(1)} · {l.totalReviews} Reviews
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="font-bold text-xl leading-tight text-emerald-600 dark:text-emerald-400">
              ₹{l.dailyCharges}
              <span className="text-xs font-normal text-muted-foreground">
                /day
              </span>
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-auto pt-3 flex items-center justify-end gap-2 flex-wrap">
          {/* View Profile */}
          <button
            type="button"
            onClick={() =>
              nav({
                to: "/renter/labours/$id",
                params: {
                  id: l._id,
                },
              })
            }
            className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
          >
            View Profile
          </button>

          {/* Hire Labour */}
          <button
            type="button"
            data-tour="labour-book-cta"
            onClick={() =>
              nav({
                to: "/renter/labours/$id/hire",
                params: {
                  id: l._id,
                },
              })
            }
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
          >
            Hire Labour
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Search Suggestions ─────────────────────────────────────────── */

function SearchSuggestions({
  query,
  labours,
  onSelect,
  visible,
}: {
  query: string;
  labours: Labour[];
  onSelect: (val: string) => void;
  visible: boolean;
}) {
  if (!visible || query.length < 2) return null;

  const suggestions = Array.from(
    new Set(
      labours
        .flatMap((l) => [l.fullName, l.primarySkill, l.village, l.district])
        .filter((s): s is string => !!s && s.toLowerCase().includes(query.toLowerCase())),
    ),
  ).slice(0, 6);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-card shadow-elevated overflow-hidden"
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onMouseDown={(ev) => {
            ev.preventDefault();
            onSelect(s);
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            {s.split(new RegExp(`(${query})`, "gi")).map((part, j) =>
              part.toLowerCase() === query.toLowerCase() ? (
                <strong key={j} className="text-primary">
                  {part}
                </strong>
              ) : (
                part
              ),
            )}
          </span>
        </button>
      ))}
    </motion.div>
  );
}

/* ─── Filter Pill ────────────────────────────────────────────────── */

function Pill({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
      {children}
      <button
        onClick={onClear}
        aria-label="Remove filter"
        className="hover:bg-primary/10 rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ─── FilterSection — same stable component pattern as Equipment Discover ─── */

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1 group"
      >
        <span className="text-sm font-display font-bold tracking-tight group-hover:text-primary transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── RadioRow ───────────────────────────────────────────────────── */

function RadioRow({
  label,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-full flex items-center gap-2.5 py-1.5 cursor-pointer group text-left"
    >
      <span
        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? "border-primary" : "border-border group-hover:border-primary/60"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span
        className={`text-sm ${
          checked
            ? "font-semibold text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── CheckRow ───────────────────────────────────────────────────── */

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-2.5 py-1.5 cursor-pointer group text-left"
    >
      <span
        className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? "border-primary bg-primary" : "border-border group-hover:border-primary/60"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M3 8l3.5 3.5L13 5" />
          </svg>
        )}
      </span>
      <span
        className={`text-sm ${
          checked
            ? "font-semibold text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── Sidebar Filters ────────────────────────────────────────────── */

function SidebarFilters({
  allSkills,
  dataMaxCharges,
  loading,
  skill,
  setSkill,
  maxExperience,
  setMaxExperience,
  maxCharges,
  setMaxCharges,
  minRating,
  setMinRating,
  availableOnly,
  setAvailableOnly,
  sort,
  setSort,
  maxDistance,
  setMaxDistance,
  userLocation,
  handleGetLocation,
  locatingUser,
  activeFilterCount,
  clearAll,
}: {
  allSkills: string[];
  dataMaxCharges: number;
  loading: boolean;
  skill: string;
  setSkill: (v: string) => void;
  maxExperience: number;
  setMaxExperience: (v: number) => void;
  maxCharges: number;
  setMaxCharges: (v: number) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  availableOnly: boolean;
  setAvailableOnly: (v: boolean) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  maxDistance: number | null;
  setMaxDistance: (v: number | null) => void;
  userLocation: { lat: number; lng: number } | null;
  handleGetLocation: () => void;
  locatingUser: boolean;
  activeFilterCount: number;
  clearAll: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-base flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
        </h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Near Me / Geolocation trigger */}
      <div className="p-3 rounded-xl bg-accent/50 border border-border/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            Your Location
          </span>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locatingUser}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              userLocation
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {locatingUser ? "Locating..." : userLocation ? "Updated ✓" : "Use GPS"}
          </button>
        </div>

        {userLocation && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
              Filter by Radius:
            </p>
            <div className="grid grid-cols-2 gap-1">
              {[null, 10, 25, 50, 100].map((dist) => (
                <button
                  key={dist ?? "any"}
                  type="button"
                  onClick={() => setMaxDistance(dist)}
                  className={`px-2 py-1 rounded-md text-xs text-center border transition ${
                    maxDistance === dist
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-card border-border hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {dist === null ? "Any distance" : `≤ ${dist} km`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skill */}
      <FilterSection title="Skill">
        <div className="space-y-0.5">
          <RadioRow label="All Skills" checked={skill === ""} onChange={() => setSkill("")} />
          {allSkills.map((s) => (
            <RadioRow
              key={s}
              label={
                <span className="inline-flex items-center gap-2">
                  {skillIcon(s)}
                  {s}
                </span>
              }
              checked={skill === s}
              onChange={() => setSkill(s)}
            />
          ))}
          {!loading && allSkills.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">No skills available yet.</p>
          )}
        </div>
      </FilterSection>

      {/* Experience */}
      <FilterSection title="Experience (Years)">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>0</span>
          <span className="font-semibold text-foreground text-sm">≤ {maxExperience} yrs</span>
          <span>30</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={maxExperience}
          onChange={(e) => setMaxExperience(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </FilterSection>

      {/* Daily Charges */}
      <FilterSection title="Daily Charges (₹/day)">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>₹200</span>
          <span className="font-semibold text-foreground text-sm">≤ ₹{maxCharges}/day</span>
          <span>₹{dataMaxCharges}</span>
        </div>
        <input
          type="range"
          min={200}
          max={dataMaxCharges}
          step={50}
          value={maxCharges}
          onChange={(e) => setMaxCharges(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating">
        <div className="space-y-0.5">
          <RadioRow label="Any rating" checked={minRating === 0} onChange={() => setMinRating(0)} />
          {[4, 3, 2].map((r) => (
            <RadioRow
              key={r}
              label={
                <span className="inline-flex items-center gap-1">{"★".repeat(r)} & above</span>
              }
              checked={minRating === r}
              onChange={() => setMinRating(r)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <div className="space-y-0.5">
          <CheckRow
            label={
              <span className="inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Available Only
              </span>
            }
            checked={availableOnly}
            onChange={setAvailableOnly}
          />
        </div>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort By" defaultOpen={false}>
        <div className="space-y-0.5">
          {(["highest-rated", "lowest-charges", "most-experienced", "newest", "distance-low"] as SortKey[]).map(
            (s) => (
              <RadioRow
                key={s}
                label={
                  {
                    "highest-rated": "Highest Rated",
                    "lowest-charges": "Lowest Charges",
                    "most-experienced": "Most Experienced",
                    newest: "Newest",
                    "distance-low": "Nearest First 📍",
                  }[s]
                }
                checked={sort === s}
                onChange={() => setSort(s)}
              />
            ),
          )}
        </div>
      </FilterSection>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */

function RenterLabours() {
  const { t } = useTranslation();
  const nav = useNavigate();

  /* Data */
  const [labours, setLabours] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* User Location & Distance */
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);

  /* Filters */
  const [q, setQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [skill, setSkill] = useState("");
  const [maxExperience, setMaxExperience] = useState(30);
  const [maxCharges, setMaxCharges] = useState(Infinity);
  const [minRating, setMinRating] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("highest-rated");
  const [view, setView] = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const tourSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="labour-search-input"]',
        title: t("tour.renterLabours.skillFilterTitle"),
        content: t("tour.renterLabours.skillFilterContent"),
      },
      {
        target: '[data-tour="labour-skill-filter"]',
        title: t("tour.renterLabours.chargeFilterTitle"),
        content: t("tour.renterLabours.chargeFilterContent"),
      },
      {
        target: '[data-tour="labour-card"]',
        title: t("tour.renterLabours.profileCardTitle"),
        content: t("tour.renterLabours.profileCardContent"),
      },
      {
        target: '[data-tour="labour-book-cta"]',
        title: t("tour.renterLabours.hireTitle"),
        content: t("tour.renterLabours.hireContent"),
      },
    ],
    [t]
  );

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocatingUser(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Unable to fetch your location. Please check browser permissions.");
        setLocatingUser(false);
      }
    );
  };

  /* Fetch */
  const fetchLabours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await axios.get(`${API_BASE}/api/labour/public`);
      const payload = res.data;
      const data: Labour[] = Array.isArray(payload)
        ? payload
        : (payload?.labours ?? payload?.data ?? []);
      setLabours(data);
      if (data.length > 0) {
        setMaxCharges(Math.max(...data.map((l) => l.dailyCharges)));
      }
    } catch {
      setError("Could not connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabours();
  }, [fetchLabours]);

  /* Close suggestions on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Derived filter options */
  const allSkills = useMemo(
    () => Array.from(new Set(labours.map((l) => l.primarySkill))).sort(),
    [labours],
  );
  const dataMaxCharges = useMemo(
    () => (labours.length ? Math.max(...labours.map((l) => l.dailyCharges)) : 5000),
    [labours],
  );

  /* Filtered + sorted results with Haversine distance */
  const filtered = useMemo(() => {
    const ql = q.toLowerCase();

    const list: Labour[] = labours.map((l) => {
      let dist: number | null = null;
      if (
        userLocation &&
        l.coordinates &&
        !(l.coordinates.lat === 0 && l.coordinates.lng === 0)
      ) {
        dist = calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          l.coordinates.lat,
          l.coordinates.lng
        );
      }
      return { ...l, _distance: dist };
    }).filter((l) => {
      if (
        ql &&
        !(
          l.fullName?.toLowerCase().includes(ql) ||
          l.primarySkill?.toLowerCase().includes(ql) ||
          l.village?.toLowerCase().includes(ql) ||
          l.district?.toLowerCase().includes(ql) ||
          l.location?.toLowerCase().includes(ql)
        )
      )
        return false;
      if (skill && l.primarySkill !== skill) return false;
      if (l.experience > maxExperience) return false;
      if (maxCharges !== Infinity && l.dailyCharges > maxCharges) return false;
      if (minRating && l.rating < minRating) return false;
      if (availableOnly && !l.availability) return false;
      if (maxDistance !== null && l._distance != null && l._distance > maxDistance) return false;
      return true;
    });

    if (sort === "highest-rated") list.sort((a, b) => b.rating - a.rating);
    if (sort === "lowest-charges") list.sort((a, b) => a.dailyCharges - b.dailyCharges);
    if (sort === "most-experienced") list.sort((a, b) => b.experience - a.experience);
    if (sort === "distance-low") list.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
    return list;
  }, [labours, q, skill, maxExperience, maxCharges, minRating, availableOnly, maxDistance, userLocation, sort]);

  const activeFilterCount =
    (skill ? 1 : 0) +
    (maxExperience < 30 ? 1 : 0) +
    (maxCharges < dataMaxCharges ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (availableOnly ? 1 : 0) +
    (maxDistance !== null ? 1 : 0);

  const clearAll = () => {
    setSkill("");
    setMaxExperience(30);
    setMaxCharges(dataMaxCharges);
    setMinRating(0);
    setAvailableOnly(false);
    setMaxDistance(null);
  };

  /* Shared sidebar props */
  const sidebarProps = {
    allSkills,
    dataMaxCharges,
    loading,
    skill,
    setSkill,
    maxExperience,
    setMaxExperience,
    maxCharges: maxCharges === Infinity ? dataMaxCharges : maxCharges,
    setMaxCharges,
    minRating,
    setMinRating,
    availableOnly,
    setAvailableOnly,
    sort,
    setSort,
    maxDistance,
    setMaxDistance,
    userLocation,
    handleGetLocation,
    locatingUser,
    activeFilterCount,
    clearAll,
  };

  return (
    <AppShell>
      {/* ── Sticky search bar ─────────────────────────────────── */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <div ref={searchRef} className="flex-1 relative">
            <div data-tour="labour-search-input" className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search by name, skill, or location…"
                className="flex-1 bg-transparent outline-none text-sm min-w-0"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setShowSuggestions(false);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <VoiceButton
                size="sm"
                onSpeechResult={(text) => {
                  setQ(text);
                  setShowSuggestions(false);
                }}
              />
            </div>
            <AnimatePresence>
              <SearchSuggestions
                query={q}
                labours={labours}
                onSelect={(val) => {
                  setQ(val);
                  setShowSuggestions(false);
                }}
                visible={showSuggestions}
              />
            </AnimatePresence>
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium hover:bg-accent shrink-0 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Breadcrumb + heading ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5">
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link to="/renter/dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <span className="text-foreground font-medium">Find Labour</span>
          {skill && (
            <>
              <span>›</span>
              <span className="text-foreground font-medium">{skill}</span>
            </>
          )}
        </nav>
        <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Find Labour</h1>
            <p className="mt-1 text-sm text-muted-foreground">Browse verified farm labour near you.</p>
          </div>
          <OnboardingTour
            tourKey="farmfleet_tour_seen_renter_labour_search"
            steps={tourSteps}
          />
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-5 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block self-start">
          <div data-tour="labour-skill-filter" className="sticky top-[69px] rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 shadow-card">
            <SidebarFilters {...sidebarProps} />
          </div>
        </aside>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div
                className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-background shadow-elevated flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="font-display font-bold text-lg">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="Close"
                    className="h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <SidebarFilters {...sidebarProps} />
                </div>
                <div className="p-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft"
                  >
                    Show {loading ? "…" : filtered.length} results
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results column ─────────────────────────────────── */}
        <div data-tour="labour-card" className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <p className="text-sm">
              {loading ? (
                <span className="text-muted-foreground">Loading labour…</span>
              ) : (
                <>
                  <span className="font-semibold">{filtered.length}</span>
                  <span className="text-muted-foreground"> labour available</span>
                  {q && (
                    <span className="text-muted-foreground">
                      {" "}
                      for "<span className="text-foreground font-medium">{q}</span>"
                    </span>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locatingUser}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  userLocation
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-card hover:bg-accent text-foreground"
                }`}
              >
                <Navigation className={`h-3.5 w-3.5 ${locatingUser ? "animate-spin" : ""}`} />
                {userLocation ? "Location Active ✓" : "Near Me"}
              </button>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-card text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="highest-rated">Highest Rated</option>
                  <option value="lowest-charges">Lowest Charges</option>
                  <option value="most-experienced">Most Experienced</option>
                  <option value="newest">Newest</option>
                  <option value="distance-low">Nearest First 📍</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                {(["grid", "list", "map"] as ViewMode[]).map((v) => {
                  const Icon = v === "grid" ? Grid3x3 : v === "list" ? List : MapIcon;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      aria-label={v}
                      className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition ${
                        view === v
                          ? "bg-gradient-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {skill && <Pill onClear={() => setSkill("")}>{skill}</Pill>}
              {maxExperience < 30 && (
                <Pill onClear={() => setMaxExperience(30)}>≤ {maxExperience} yrs</Pill>
              )}
              {maxCharges < dataMaxCharges && (
                <Pill onClear={() => setMaxCharges(dataMaxCharges)}>≤ ₹{maxCharges}/day</Pill>
              )}
              {minRating > 0 && <Pill onClear={() => setMinRating(0)}>{minRating}★ & above</Pill>}
              {availableOnly && (
                <Pill onClear={() => setAvailableOnly(false)}>
                  <Clock className="h-3 w-3" />
                  Available Only
                </Pill>
              )}
              {maxDistance !== null && (
                <Pill onClear={() => setMaxDistance(null)}>
                  <Navigation className="h-3 w-3" />
                  ≤ {maxDistance} km away
                </Pill>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-primary hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div
              className={`mt-5 ${view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}`}
            >
              {Array.from({ length: 6 }).map((_, i) =>
                view === "grid" ? <SkeletonCard key={i} /> : <SkeletonListRow key={i} />,
              )}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-10 flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="font-display font-semibold text-lg">Couldn't load labour</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
              </div>
              <button
                type="button"
                onClick={fetchLabours}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition text-sm font-semibold shadow-card"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          )}

          {/* Results: Grid or List */}
          {!loading && !error && filtered.length > 0 && view !== "map" && (
            <>
              {view === "grid" && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((l, i) => (
                    <LabourGridCard key={l._id} l={l} index={i} />
                  ))}
                </div>
              )}
              {view === "list" && (
                <div className="mt-5 space-y-3">
                  {filtered.map((l, i) => (
                    <LabourListCard key={l._id} l={l} index={i} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Results: Map View */}
          {!loading && !error && view === "map" && (
            <div className="mt-5">
              <EquipmentMap
                items={filtered.map((l) => ({
                  id: l._id,
                  name: l.fullName,
                  type: l.primarySkill,
                  price: l.dailyCharges,
                  priceUnit: "/day",
                  location: l.location || `${l.village}, ${l.district}`,
                  coordinates: l.coordinates,
                  distance: l._distance,
                  detailUrl: `/renter/labours/${l._id}`,
                  image: l.profileImage,
                  category: "labour",
                }))}
                userLocation={userLocation}
                height="580px"
              />
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="mt-10 flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                <Users className="h-10 w-10 text-muted-foreground opacity-30" />
              </div>
              <div>
                <p className="font-display font-semibold text-xl">No Labour Found</p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                  {labours.length === 0
                    ? "Verified labour profiles will appear here automatically."
                    : "Try adjusting your search keywords or clearing applied filters."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  clearAll();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-soft hover:shadow-elevated transition"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Filters & Search
              </button>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}