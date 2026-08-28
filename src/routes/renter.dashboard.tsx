import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import {
  Search,
  Calendar,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  MapPin,
  User,
  Users,
  ChevronRight,
  Tractor,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const Route = createFileRoute("/renter/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FarmFleet" }] }),
  component: RenterDashboard,
});

/* ─── Types ─────────────────────────────────────────────────────── */

interface Owner {
  fullName: string;
  village?: string;
  district?: string;
  state?: string;
}

interface Equipment {
  _id: string;
  name: string;
  type: string;
  pricePerAcre?: number;
  pricePerDay: number;
  pricePerHour?: number;
  pricingType?: string;
  location: string;
  image: string;
  operatorIncluded: boolean;
  owner: Owner;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const salutation = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  return `${salutation}, ${name}`;
}

/* ─── Skeleton ───────────────────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded-lg w-3/4" />
        <div className="h-3 bg-muted rounded-lg w-1/2" />
        <div className="h-3 bg-muted rounded-lg w-2/3" />
        <div className="h-3 bg-muted rounded-lg w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-muted rounded-lg w-1/3" />
          <div className="h-9 bg-muted rounded-xl w-28" />
        </div>
      </div>
    </div>
  );
}

/* ─── Equipment Card ─────────────────────────────────────────────── */

function EquipmentCard({ e, index }: { e: Equipment; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link
        to="/renter/equipment/$id"
        params={{ id: e._id }}
        className="group flex flex-col rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated hover:-translate-y-1.5 transition-all duration-250 overflow-hidden h-full"
      >
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden flex-shrink-0">
          {e.image ? (
            <img
              src={e.image}
              alt={e.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-400"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Tractor className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          )}
          {e.operatorIncluded && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold backdrop-blur-sm shadow-sm">
              Operator Included
            </span>
          )}
          {/* Type badge */}
          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
            {e.type}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <p className="font-display font-semibold text-base leading-snug line-clamp-1">
            {e.name}
          </p>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{e.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{e.owner?.fullName ?? "—"}</span>
            </div>
          </div>

          {/* Price row */}
          <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-bold text-foreground">
                ₹{e.pricePerAcre ? e.pricePerAcre.toLocaleString("en-IN") : e.pricePerDay.toLocaleString("en-IN")}
                <span className="text-xs text-muted-foreground font-normal">{e.pricePerAcre ? "/acre" : "/day"}</span>
              </span>
              {e.pricePerAcre && e.pricePerDay ? (
                <span className="text-xs text-muted-foreground">₹{e.pricePerDay.toLocaleString("en-IN")}/day</span>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold group-hover:opacity-90 transition-opacity">
              View Details
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Equipment Grid ─────────────────────────────────────────────── */

function EquipmentGrid({
  loading,
  error,
  items,
  onRetry,
  skeletonCount = 4,
}: {
  loading: boolean;
  error: string | null;
  items: Equipment[];
  onRetry: () => void;
  skeletonCount?: number;
}) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center rounded-2xl border border-dashed border-border">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive opacity-70" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Couldn't load equipment</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl border border-dashed border-border">
        <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center">
          <Tractor className="h-8 w-8 text-muted-foreground opacity-30" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">No equipment available yet</p>
          <p className="text-xs text-muted-foreground opacity-70 mt-1">
            Check back once owners add their equipment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((e, i) => (
        <EquipmentCard key={e._id} e={e} index={i} />
      ))}
    </div>
  );
}

import type { Step } from "react-joyride";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useMemo } from "react";

/* ─── Quick Action Card ──────────────────────────────────────────── */

function QuickAction({
  to,
  icon: Icon,
  label,
  description,
  featured = false,
  tourId,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  featured?: boolean;
  tourId?: string;
}) {
  return (
    <Link
      to={to}
      data-tour={tourId}
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

/* ─── Main Dashboard ─────────────────────────────────────────────── */

function RenterDashboard() {
  const { t } = useTranslation();

  const [farmerName, setFarmerName] = useState<string>("Farmer");

  useEffect(() => {
    try {
      const farmer = JSON.parse(localStorage.getItem("farmer") || "{}");
      if (farmer.fullName) {
        setFarmerName(farmer.fullName);
      }
    } catch {
      // ignore
    }
  }, []);

  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/equipment/all`);
      if (res.data.success) {
        setAllEquipment(res.data.equipments ?? []);
      } else {
        setError("Failed to load equipment. Please try again.");
      }
    } catch {
      setError("Could not connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const recommended = allEquipment.slice(0, 4);
  const nearby = allEquipment.slice(4, 8);

  const tourSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="renter-welcome"]',
        title: t("tour.renterDashboard.welcomeTitle"),
        content: t("tour.renterDashboard.welcomeContent"),
        placement: "bottom",
      },
      {
        target: '[data-tour="renter-ai-planner"]',
        title: t("tour.renterDashboard.aiPlannerTitle"),
        content: t("tour.renterDashboard.aiPlannerContent"),
        placement: "bottom",
      },
      {
        target: '[data-tour="renter-search-equipment"]',
        title: t("tour.renterDashboard.searchEquipmentTitle"),
        content: t("tour.renterDashboard.searchEquipmentContent"),
        placement: "bottom",
      },
      {
        target: '[data-tour="renter-find-labour"]',
        title: t("tour.renterDashboard.findLabourTitle"),
        content: t("tour.renterDashboard.findLabourContent"),
        placement: "bottom",
      },
      {
        target: '[data-tour="renter-my-bookings"]',
        title: t("tour.renterDashboard.myBookingsTitle"),
        content: t("tour.renterDashboard.myBookingsContent"),
        placement: "bottom",
      },
      {
        target: '[data-tour="renter-recommended"]',
        title: t("tour.renterDashboard.recommendedTitle"),
        content: t("tour.renterDashboard.recommendedContent"),
        placement: "top",
      },
    ],
    [t]
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">

        {/* ── Welcome ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          data-tour="renter-welcome"
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-sm text-muted-foreground font-medium">{today}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
              {getGreeting(farmerName)} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready to manage your farm operations today?
            </p>
          </div>
          <OnboardingTour
            tourKey="farmfleet_tour_seen_renter"
            steps={tourSteps}
          />
        </motion.div>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"
        >
          <QuickAction
            to="/renter/ai"
            icon={Sparkles}
            label="AI Crop Planner"
            description="Generate AI-powered crop itineraries, farming schedules, weather insights and personalized cultivation plans."
            featured
            tourId="renter-ai-planner"
          />
          <QuickAction
            to="/renter/search"
            icon={Search}
            label={t("renter.findEquipment")}
            description="Search available machinery near you"
            tourId="renter-search-equipment"
          />
          <QuickAction
            to="/renter/labours"
            icon={Users}
            label={t("renter.findLabour")}
            description="Browse verified farm labour near you"
            tourId="renter-find-labour"
          />
          <QuickAction
            to="/renter/bookings"
            icon={Calendar}
            label={t("renter.myBookings")}
            description="Track and manage your bookings"
            tourId="renter-my-bookings"
          />
        </motion.div>

        {/* ── Recommended For You ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          data-tour="renter-recommended"
        >
          <SectionHeader
            title={t("renter.recommended")}
            action={
              <Link
                to="/renter/search"
                className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all duration-200"
              >
                {t("common.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <EquipmentGrid
            loading={loading}
            error={error}
            items={recommended}
            onRetry={fetchEquipment}
            skeletonCount={4}
          />
        </motion.div>

        {/* ── Nearby Equipment ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <SectionHeader
            title={t("renter.nearby")}
            action={
              <Link
                to="/renter/search"
                className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all duration-200"
              >
                {t("common.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <EquipmentGrid
            loading={loading}
            error={error}
            items={nearby}
            onRetry={fetchEquipment}
            skeletonCount={4}
          />
        </motion.div>

        <div className="h-4" />
      </section>
    </AppShell>
  );
}