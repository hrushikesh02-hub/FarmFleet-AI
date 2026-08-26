import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { VoiceButton } from "@/components/VoiceButton";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  ChevronDown,
  X,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Tractor,
  Sprout,
  Zap,
  Droplets,
  Package,
  Wrench,
  MapPin,
  User,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/renter/search")({
  head: () => ({ meta: [{ title: "Discover Equipment — FarmFleet" }] }),
  component: RenterSearch,
});

/* ─── Types ─────────────────────────────────────────────────────── */

interface Owner {
  fullName: string;
  village: string;
  district: string;
  state: string;
}

interface Equipment {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  pricePerDay: number;
  location: string;
  image: string;
  operatorIncluded: boolean;
  owner: Owner;
}

type SortKey = "relevance" | "price-low" | "price-high";
type ViewMode = "grid" | "list";

/* ─── Equipment type icon map ────────────────────────────────────── */

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Tractor: <Tractor className="h-4 w-4" />,
  Harvester: <Sprout className="h-4 w-4" />,
  Thresher: <Zap className="h-4 w-4" />,
  Sprayer: <Droplets className="h-4 w-4" />,
  Seeder: <Package className="h-4 w-4" />,
  Rotavator: <Wrench className="h-4 w-4" />,
};

function typeIcon(type: string) {
  return TYPE_ICONS[type] ?? <Wrench className="h-4 w-4" />;
}

/* ─── Skeletons ──────────────────────────────────────────────────── */

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

/* ─── Equipment Grid Card ────────────────────────────────────────── */

function EquipmentGridCard({ e, index }: { e: Equipment; index: number }) {
  const nav = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
      className="group rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="relative h-48 bg-muted overflow-hidden shrink-0">
        {e.image ? (
          <img
            src={e.image}
            alt={e.name}
            loading="lazy"
            onError={(ev) => {
              ev.currentTarget.onerror = null;
              ev.currentTarget.src = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60";
            }}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <span className="text-5xl opacity-20">🚜</span>
          </div>
        )}
        {e.operatorIncluded && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold backdrop-blur-sm shadow-sm">
            <User className="h-3 w-3" />
            Operator Included
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm">
          {typeIcon(e.type)}
          {e.type}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-base leading-tight line-clamp-1">{e.name}</h3>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{e.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{e.owner?.fullName ?? "—"}</span>
          </div>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground">₹{e.pricePerHour}</span>
            <span className="text-xs text-muted-foreground">/hr</span>
            <p className="text-[11px] text-muted-foreground">₹{e.pricePerDay}/day</p>
          </div>
          <button
            onClick={() => nav({ to: "/renter/equipment/$id", params: { id: e._id } })}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-soft hover:shadow-elevated transition-all duration-200"
          >
            Book Now
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Equipment List Card ────────────────────────────────────────── */

function EquipmentListCard({ e, index }: { e: Equipment; index: number }) {
  const nav = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      className="flex flex-col sm:flex-row rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-200 overflow-hidden"
    >
      <div className="relative h-44 sm:h-auto sm:w-44 bg-muted shrink-0 overflow-hidden">
        {e.image ? (
          <img
            src={e.image}
            alt={e.name}
            loading="lazy"
            onError={(ev) => {
              ev.currentTarget.onerror = null;
              ev.currentTarget.src = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60";
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <span className="text-4xl opacity-20">🚜</span>
          </div>
        )}
        {e.operatorIncluded && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold">
            <User className="h-2.5 w-2.5" /> Operator
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-base truncate">{e.name}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[11px] font-medium">
                {typeIcon(e.type)} {e.type}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {e.location}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {e.owner?.fullName ?? "—"}
              </span>
              {e.owner?.district && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 opacity-50" /> {e.owner.district}, {e.owner.state}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-xl leading-tight">
              ₹{e.pricePerHour}<span className="text-xs font-normal text-muted-foreground">/hr</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">₹{e.pricePerDay}/day</p>
          </div>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between flex-wrap gap-2">
          {e.operatorIncluded && (
            <span className="text-xs text-emerald-600 font-semibold">✓ Operator included</span>
          )}
          <button
            onClick={() => nav({ to: "/renter/equipment/$id", params: { id: e._id } })}
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-soft hover:shadow-elevated transition-all duration-200"
          >
            Book Now <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Search Suggestions ─────────────────────────────────────────── */

function SearchSuggestions({
  query,
  equipments,
  onSelect,
  visible,
}: {
  query: string;
  equipments: Equipment[];
  onSelect: (val: string) => void;
  visible: boolean;
}) {
  if (!visible || query.length < 2) return null;

  const suggestions = Array.from(
    new Set(
      equipments
        .flatMap((e) => [e.name, e.type, e.location, e.owner?.fullName])
        .filter((s): s is string => !!s && s.toLowerCase().includes(query.toLowerCase()))
    )
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
          onMouseDown={(ev) => { ev.preventDefault(); onSelect(s); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>
            {s.split(new RegExp(`(${query})`, "gi")).map((part, j) =>
              part.toLowerCase() === query.toLowerCase()
                ? <strong key={j} className="text-primary">{part}</strong>
                : part
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

/* ─── FilterSection — proper component so useState is stable ─────── */
/*
 * BUG FIX: was a JSX variable inside the render function.
 * Every re-render created new component instances → React reset
 * the internal `open` state on every filter interaction.
 * Now it's a named component so React can reconcile it properly.
 */

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

/* ─── RadioRow — onClick on the outer div, no hidden input ──────── */
/*
 * BUG FIX: was using a <label> wrapping a visually-hidden <input>
 * with onChange. The custom span intercepted the click before it
 * reached the input → onChange never fired reliably.
 * Now the entire row is a <button> so the click always registers.
 */

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
          checked ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── CheckRow — same fix as RadioRow ───────────────────────────── */

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
          checked ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── Sidebar Filters — proper component ────────────────────────── */
/*
 * BUG FIX: extracted from an inline JSX variable into a real component
 * so FilterSection instances keep stable identity across renders.
 */

function SidebarFilters({
  allTypes,
  allLocations,
  dataMaxPrice,
  loading,
  type,
  setType,
  maxPrice,
  setMaxPrice,
  locationFilter,
  setLocationFilter,
  operatorOnly,
  setOperatorOnly,
  sort,
  setSort,
  activeFilterCount,
  clearAll,
}: {
  allTypes: string[];
  allLocations: string[];
  dataMaxPrice: number;
  loading: boolean;
  type: string;
  setType: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  locationFilter: string;
  setLocationFilter: (v: string) => void;
  operatorOnly: boolean;
  setOperatorOnly: (v: boolean) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
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

      {/* Equipment Type */}
      <FilterSection title="Equipment Type">
        <div className="space-y-0.5">
          <RadioRow label="All types" checked={type === ""} onChange={() => setType("")} />
          {allTypes.map((t_) => (
            <RadioRow
              key={t_}
              label={
                <span className="inline-flex items-center gap-2">
                  {typeIcon(t_)}
                  {t_}
                </span>
              }
              checked={type === t_}
              onChange={() => setType(t_)}
            />
          ))}
          {!loading && allTypes.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">No types available yet.</p>
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range (₹/hr)">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>₹0</span>
          <span className="font-semibold text-foreground text-sm">≤ ₹{maxPrice}/hr</span>
          <span>₹{dataMaxPrice}</span>
        </div>
        <input
          type="range"
          min={0}
          max={dataMaxPrice}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </FilterSection>

      {/* Location */}
      {allLocations.length > 0 && (
        <FilterSection title="Location">
          <div className="space-y-0.5">
            <RadioRow
              label="All locations"
              checked={locationFilter === ""}
              onChange={() => setLocationFilter("")}
            />
            {allLocations.map((loc) => (
              <RadioRow
                key={loc}
                label={
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {loc}
                  </span>
                }
                checked={locationFilter === loc}
                onChange={() => setLocationFilter(loc)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Additional */}
      <FilterSection title="Additional">
        <div className="space-y-0.5">
          <CheckRow
            label={
              <span className="inline-flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Operator included
              </span>
            }
            checked={operatorOnly}
            onChange={setOperatorOnly}
          />
        </div>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort By" defaultOpen={false}>
        <div className="space-y-0.5">
          {(["relevance", "price-low", "price-high"] as SortKey[]).map((s) => (
            <RadioRow
              key={s}
              label={
                { relevance: "Relevance", "price-low": "Price: Low to High", "price-high": "Price: High to Low" }[s]
              }
              checked={sort === s}
              onChange={() => setSort(s)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */

export default function RenterSearch() {
  const { t } = useTranslation();

  /* Data */
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Filters */
  const [q, setQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [type, setType] = useState("");
  /*
   * BUG FIX: was initialised to 5000. When dataMaxPrice resolved to 5000
   * the comparison maxPrice < dataMaxPrice was always false and clearAll
   * was setting maxPrice to the exact same value, never resetting the slider.
   * We now use Infinity so "no price cap" is the correct default, and sync
   * to dataMaxPrice once data arrives so the slider ceiling is meaningful.
   */
  const [maxPrice, setMaxPrice] = useState(Infinity);
  const [locationFilter, setLocationFilter] = useState("");
  const [operatorOnly, setOperatorOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [view, setView] = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  /* Fetch */
  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/equipment/all`);
      if (res.data.success) {
        const data: Equipment[] = res.data.equipments ?? [];
        setEquipments(data);
        // Sync price ceiling to real data on first load
        if (data.length > 0) {
          setMaxPrice(Math.max(...data.map((e) => e.pricePerHour)));
        }
      } else {
        setError("Failed to load equipment.");
      }
    } catch {
      setError("Could not connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

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
  const allTypes = useMemo(
    () => Array.from(new Set(equipments.map((e) => e.type))).sort(),
    [equipments]
  );
  const dataMaxPrice = useMemo(
    () => (equipments.length ? Math.max(...equipments.map((e) => e.pricePerHour)) : 5000),
    [equipments]
  );
  const allLocations = useMemo(
    () => Array.from(new Set(equipments.map((e) => e.location))).sort(),
    [equipments]
  );

  /* Filtered + sorted results */
  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    const list = equipments.filter((e) => {
      if (
        ql &&
        !(
          e.name.toLowerCase().includes(ql) ||
          e.type.toLowerCase().includes(ql) ||
          e.owner?.fullName?.toLowerCase().includes(ql) ||
          e.location?.toLowerCase().includes(ql) ||
          e.owner?.district?.toLowerCase().includes(ql)
        )
      )
        return false;
      if (type && e.type !== type) return false;
      if (maxPrice !== Infinity && e.pricePerHour > maxPrice) return false;
      if (locationFilter && e.location !== locationFilter) return false;
      if (operatorOnly && !e.operatorIncluded) return false;
      return true;
    });

    if (sort === "price-low") list.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (sort === "price-high") list.sort((a, b) => b.pricePerHour - a.pricePerHour);
    return list;
  }, [equipments, q, type, maxPrice, locationFilter, operatorOnly, sort]);

  const activeFilterCount =
    (type ? 1 : 0) +
    (maxPrice < dataMaxPrice ? 1 : 0) +
    (locationFilter ? 1 : 0) +
    (operatorOnly ? 1 : 0);

  const clearAll = () => {
    setType("");
    setMaxPrice(dataMaxPrice);   // reset to actual ceiling, not a hardcoded number
    setLocationFilter("");
    setOperatorOnly(false);
  };

  /* Shared sidebar props */
  const sidebarProps = {
    allTypes,
    allLocations,
    dataMaxPrice,
    loading,
    type,
    setType,
    maxPrice: maxPrice === Infinity ? dataMaxPrice : maxPrice,
    setMaxPrice,
    locationFilter,
    setLocationFilter,
    operatorOnly,
    setOperatorOnly,
    sort,
    setSort,
    activeFilterCount,
    clearAll,
  };

  return (
    <AppShell>
      {/* ── Sticky search bar ─────────────────────────────────── */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <div ref={searchRef} className="flex-1 relative">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t("renter.searchPlaceholder") || "Search tractors, harvesters, locations…"}
                className="flex-1 bg-transparent outline-none text-sm min-w-0"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => { setQ(""); setShowSuggestions(false); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <VoiceButton size="sm" onSpeechResult={(text) => { setQ(text); setShowSuggestions(false); }} />
            </div>
            <AnimatePresence>
              <SearchSuggestions
                query={q}
                equipments={equipments}
                onSelect={(val) => { setQ(val); setShowSuggestions(false); }}
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
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <Link to="/renter/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Search</span>
          {type && (
            <>
              <span>›</span>
              <span className="text-foreground font-medium">{type}</span>
            </>
          )}
        </nav>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold">
          {type || "All Equipment"}
        </h1>
      </div>

      {/* ── Main layout ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-5 grid lg:grid-cols-[280px_1fr] gap-6">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block self-start">
          <div className="sticky top-[69px] rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 shadow-card">
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
        <div className="min-w-0">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <p className="text-sm">
              {loading ? (
                <span className="text-muted-foreground">Loading equipment…</span>
              ) : (
                <>
                  <span className="font-semibold">{filtered.length}</span>
                  <span className="text-muted-foreground"> equipment available</span>
                  {q && (
                    <span className="text-muted-foreground">
                      {" "}for "<span className="text-foreground font-medium">{q}</span>"
                    </span>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-card text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                {(["grid", "list"] as ViewMode[]).map((v) => {
                  const Icon = v === "grid" ? Grid3x3 : List;
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
              {type && <Pill onClear={() => setType("")}>{type}</Pill>}
              {maxPrice < dataMaxPrice && (
                <Pill onClear={() => setMaxPrice(dataMaxPrice)}>≤ ₹{maxPrice}/hr</Pill>
              )}
              {locationFilter && (
                <Pill onClear={() => setLocationFilter("")}>
                  <MapPin className="h-3 w-3" />
                  {locationFilter}
                </Pill>
              )}
              {operatorOnly && (
                <Pill onClear={() => setOperatorOnly(false)}>
                  <User className="h-3 w-3" />
                  Operator included
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
            <div className={`mt-5 ${view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}`}>
              {Array.from({ length: 6 }).map((_, i) =>
                view === "grid" ? <SkeletonCard key={i} /> : <SkeletonListRow key={i} />
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
                <p className="font-display font-semibold text-lg">Couldn't load equipment</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
              </div>
              <button
                type="button"
                onClick={fetchEquipment}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition text-sm font-semibold shadow-card"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && !error && filtered.length > 0 && (
            <>
              {view === "grid" && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((e, i) => (
                    <EquipmentGridCard key={e._id} e={e} index={i} />
                  ))}
                </div>
              )}
              {view === "list" && (
                <div className="mt-5 space-y-3">
                  {filtered.map((e, i) => (
                    <EquipmentListCard key={e._id} e={e} index={i} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="mt-10 flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                <span className="text-5xl">🚜</span>
              </div>
              <div>
                <p className="font-display font-semibold text-xl">
                  {equipments.length === 0
                    ? "No equipment available yet"
                    : t("renter.noResults") || "No results found"}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                  {equipments.length === 0
                    ? "Equipment added by owners will appear here automatically."
                    : "Try adjusting your search query or clearing all applied filters."}
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

          {/* Map coming soon */}
          {!loading && !error && filtered.length > 0 && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 flex items-center gap-4 shadow-card">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sm">Map View — Coming Soon</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  See all equipment on an interactive map. Available in the next update.
                </p>
              </div>
              <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                <Clock className="h-3 w-3" /> Soon
              </span>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}