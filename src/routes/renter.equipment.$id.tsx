// src/routes/renter/equipment/$id.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  Phone,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Clock,
  Tractor,
  MessageSquare,
  BadgeCheck,
  IndianRupee,
  Shield,
  Users,
  BarChart2,
  Info,
  Check,
  XCircle,
  Home,
  Landmark,
  Navigation,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Owner {
  _id: string;
  fullName: string;
  village?: string;
  district?: string;
  state?: string;
  profileImage?: string;
  phone?: string;
  mobile?: string;
  averageRating?: number;
  totalReviews?: number;
  totalEquipment?: number;
  isVerified?: boolean;
}

interface Equipment {
  _id: string;
  name: string;
  type: string;
  location: string;
  pricePerHour: number;
  pricePerDay: number;
  operatorIncluded: boolean;
  images?: string[];
  image?: string;
  description?: string;
  isAvailable?: boolean;
  availability?: boolean;
  specifications?: Record<string, string>;
  totalBookings?: number;
  owner: Owner;
}

interface Review {
  _id: string;
  renterName?: string;
  renter?: { fullName?: string; profileImage?: string };
  renterImage?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface BookingResponse {
  success: boolean;
  booking?: { _id: string };
  message?: string;
}

interface FarmLocation {
  address: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  landmark: string;
}

type BookingStep =
  | "dates"
  | "availability"
  | "location"
  | "summary"
  | "payment"
  | "confirm"
  | "success";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/renter/equipment/$id")({
  head: () => ({ meta: [{ title: "Equipment Details — FarmFleet" }] }),
  component: EquipmentDetails,
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

function authHeaders() {
  const token =
    localStorage.getItem("farmerToken") ?? localStorage.getItem("token") ?? "";
  return { Authorization: `Bearer ${token}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

function SkeletonReview() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="h-3.5 w-full rounded bg-muted" />
      <div className="h-3.5 w-3/4 rounded bg-muted" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAR ROW
// ─────────────────────────────────────────────────────────────────────────────

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${
            n <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
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
      <div className="p-5 pb-0 flex items-center gap-3">
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
      <div className="p-5 pt-4">{children}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-3"
    >
      <AlertCircle className="h-10 w-10 text-destructive/60" />
      <p className="font-semibold">Failed to load equipment</p>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
        <Link
          to="/renter/search"
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/20 transition"
        >
          ← Marketplace
        </Link>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-10 gap-3 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
        <Icon className="h-8 w-8 text-primary/50" />
      </div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: { key: BookingStep; label: string }[] = [
  { key: "dates", label: "Dates" },
  { key: "availability", label: "Availability" },
  { key: "location", label: "Location" },
  { key: "summary", label: "Summary" },
  { key: "payment", label: "Payment" },
  { key: "confirm", label: "Confirm" },
];

function StepIndicator({ currentStep }: { currentStep: BookingStep }) {
  const activeIdx = STEPS.findIndex((s) => s.key === currentStep);
  if (activeIdx === -1) return null;

  return (
    <div className="flex items-center justify-center gap-0 flex-wrap px-4 py-4 border-b border-border/50 bg-muted/20">
      {STEPS.map((step, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  backgroundColor: isDone ? "#22c55e" : isActive ? "#22c55e" : "transparent",
                  borderColor: isDone || isActive ? "#22c55e" : "#e5e7eb",
                  scale: isActive ? 1.15 : 1,
                }}
                transition={{ duration: 0.25 }}
                className="h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={{ color: isDone || isActive ? "#fff" : "#9ca3af" }}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </motion.div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider transition-colors hidden sm:block ${
                  isActive ? "text-primary" : isDone ? "text-primary/60" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-1.5 mb-4 h-0.5 w-5 sm:w-8 rounded transition-all duration-300"
                style={{ backgroundColor: isDone ? "#22c55e" : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING WIZARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function BookingWizardCard({
  children,
  step,
}: {
  children: React.ReactNode;
  step: BookingStep | "success";
}) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPMENT GALLERY (Amazon/Flipkart style)
// ─────────────────────────────────────────────────────────────────────────────

function EquipmentGallery({
  images,
  name,
  activeImg,
  setActiveImg,
}: {
  images: string[];
  name?: string;
  activeImg: number;
  setActiveImg: (i: number) => void;
}) {
  const prevImg = useCallback(
    () => setActiveImg((activeImg - 1 + images.length) % images.length),
    [activeImg, images.length, setActiveImg]
  );
  const nextImg = useCallback(
    () => setActiveImg((activeImg + 1) % images.length),
    [activeImg, images.length, setActiveImg]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        style={{ height: "clamp(250px, 45vw, 480px)", maxHeight: 500 }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImg}
            src={images[activeImg] ?? "/placeholder-equipment.jpg"}
            alt={name}
            className="h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          />
        </AnimatePresence>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            {activeImg + 1} / {images.length}
          </div>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-card hover:bg-card transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImg}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-card hover:bg-card transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveImg(i)}
              className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeImg === i
                  ? "border-primary shadow-card"
                  : "border-transparent opacity-55 hover:opacity-85 hover:border-border"
              }`}
              style={{ width: 64, height: 56 }}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
              {activeImg === i && (
                <motion.div
                  layoutId="thumb-active"
                  className="absolute inset-0 bg-primary/10"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO PANEL (right column of above-fold layout)
// ─────────────────────────────────────────────────────────────────────────────

function InfoPanel({
  equipment,
  reviews,
  avgRating,
  onBook,
  fav,
  setFav,
}: {
  equipment: Equipment;
  reviews: Review[];
  avgRating: number;
  onBook: () => void;
  fav: boolean;
  setFav: (v: boolean) => void;
}) {
  const isAvailable = equipment.isAvailable ?? equipment.availability ?? true;
  const ownerContact = equipment.owner?.phone ?? equipment.owner?.mobile;

  return (
    <div className="flex flex-col gap-5">
      {/* Type badge */}
      <div>
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          {equipment.type}
        </span>
      </div>

      {/* Name */}
      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
        {equipment.name}
      </h1>

      {/* Rating row */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <StarRow rating={avgRating} size="md" />
          <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-display text-[#16a34a]">
            ₹{equipment.pricePerDay.toLocaleString("en-IN")}
          </span>
          <span className="text-sm text-muted-foreground font-medium">/day</span>
        </div>
        {equipment.pricePerHour > 0 && (
          <div className="flex items-baseline gap-1 text-muted-foreground">
            <span className="text-base font-semibold">
              ₹{equipment.pricePerHour.toLocaleString("en-IN")}
            </span>
            <span className="text-xs">/hour</span>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Key info pills */}
      <div className="flex flex-col gap-2.5">
        {/* Availability */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
              isAvailable ? "bg-green-100 dark:bg-green-500/15" : "bg-red-100 dark:bg-red-500/15"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isAvailable ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Status
            </p>
            <p
              className={`text-sm font-semibold ${
                isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {isAvailable ? "Available for Booking" : "Currently Unavailable"}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Location
            </p>
            <p className="text-sm font-semibold">{equipment.location}</p>
          </div>
        </div>

        {/* Operator */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15 shrink-0">
            <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Operator
            </p>
            <p className="text-sm font-semibold">
              {equipment.operatorIncluded ? "Included with equipment" : "Not included"}
            </p>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-border">
            {equipment.owner?.profileImage ? (
              <img
                src={equipment.owner.profileImage}
                alt={equipment.owner.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                {equipment.owner?.fullName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Owner
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold">{equipment.owner?.fullName}</p>
              {equipment.owner?.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Shield, text: "No Advance Payment" },
          { icon: BadgeCheck, text: "Verified Owner" },
          { icon: Clock, text: "Quick Response" },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 border border-border/60 px-2 py-2.5 text-center"
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
              {text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA + actions */}
      <div className="flex flex-col gap-2.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBook}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base shadow-elevated hover:shadow-lg transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
        >
          <Zap className="h-5 w-5" />
          Book This Equipment
        </motion.button>

        <div className="flex gap-2">
          {ownerContact && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href={`tel:${ownerContact}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
            >
              <Phone className="h-4 w-4 text-primary" />
              Call Owner
            </motion.a>
          )}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setFav(!fav)}
            className="h-11 w-11 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent transition shadow-card"
          >
            <Heart
              className={`h-4 w-4 ${fav ? "fill-red-400 text-red-400" : "text-muted-foreground"}`}
            />
          </motion.button>
          <button className="h-11 w-11 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent transition shadow-card">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON INFO PANEL
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonInfoPanel() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-9 w-32" />
      <div className="h-px bg-border" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-px bg-border" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON GALLERY
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonGallery() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <Skeleton className="w-full rounded-2xl" style={{ height: "clamp(250px, 45vw, 480px)", maxHeight: 500 } as React.CSSProperties} />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="shrink-0 rounded-xl" style={{ width: 64, height: 56 } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────

function BookingWorkspace({
  equipment,
  onBack,
}: {
  equipment: Equipment;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  const [bookingStep, setBookingStep] = useState<BookingStep>("dates");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);
  const [farmLocation, setFarmLocation] = useState<FarmLocation>({
    address: "",
    village: "",
    taluka: "",
    district: "",
    state: "",
    landmark: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(
      1,
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
      )
    );
  }, [startDate, endDate]);

  const totalAmount = useMemo(
    () => (totalDays > 0 ? totalDays * equipment.pricePerDay : 0),
    [totalDays, equipment.pricePerDay]
  );

  const images = useMemo<string[]>(() => {
    if (equipment.images?.length) return equipment.images;
    if (equipment.image) return [equipment.image];
    return [];
  }, [equipment]);

  const locationComplete =
    farmLocation.address.trim() &&
    farmLocation.village.trim() &&
    farmLocation.taluka.trim() &&
    farmLocation.district.trim() &&
    farmLocation.state.trim();

  const checkAvailability = useCallback(async () => {
    if (!startDate || !endDate) return;
    setAvailabilityLoading(true);
    setAvailabilityResult(null);
    setBookingStep("availability");
    try {
      const { data } = await axios.post(
        "/api/booking/check-availability",
        { equipmentId: equipment._id, startDate, endDate },
        { headers: authHeaders() }
      );
      const available =
        data?.available === true ||
        data?.isAvailable === true ||
        data?.success === true;
      setAvailabilityResult({ available, message: data?.message });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? "Could not check availability.")
        : "Could not check availability.";
      setAvailabilityResult({ available: false, message: msg });
    } finally {
      setAvailabilityLoading(false);
    }
  }, [equipment._id, startDate, endDate]);

  const handleBook = useCallback(async () => {
    if (!startDate || !endDate) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const { data } = await axios.post<BookingResponse>(
        "/api/booking/create",
        { equipmentId: equipment._id, startDate, endDate },
        { headers: authHeaders() }
      );
      setBookingId(data.booking?._id ?? "");
      setBookingStep("success");
    } catch (err: unknown) {
      setBookingError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Booking failed. Please try again.")
          : "Booking failed. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }, [equipment._id, startDate, endDate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Workspace header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3 flex items-center gap-4">
          {bookingStep !== "success" && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Equipment Details</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{equipment.name}</p>
          </div>
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            <Tractor className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Workspace title (not shown on success) */}
        {bookingStep !== "success" && (
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Book This Equipment
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Submit your booking request and connect with the equipment owner.
            </p>
          </div>
        )}

        {/* Step indicator */}
        {bookingStep !== "success" && (
          <div className="mb-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <StepIndicator currentStep={bookingStep} />
          </div>
        )}

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── Step: Dates ─────────────────────────────────────────── */}
            {bookingStep === "dates" && (
              <BookingWizardCard step="dates">
                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#22c55e15", color: "#16a34a" }}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl tracking-tight">Select Your Dates</h2>
                      <p className="text-sm text-muted-foreground mt-1">Choose when you need the equipment</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Start Date <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="date"
                          min={today}
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (endDate && e.target.value > endDate) setEndDate("");
                            setAvailabilityResult(null);
                          }}
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        End Date <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="date"
                          min={startDate || today}
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setAvailabilityResult(null);
                          }}
                          disabled={!startDate}
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {totalDays > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl border border-[#22c55e]/25 bg-[#22c55e]/5 p-4 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#22c55e20", color: "#16a34a" }}>
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Duration</p>
                              <p className="font-bold text-sm">{totalDays} day{totalDays > 1 ? "s" : ""}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium">Estimated Total</p>
                            <p className="font-bold text-base text-[#16a34a]">₹{totalAmount.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-end gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!startDate || !endDate}
                      onClick={checkAvailability}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      Check Availability
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </BookingWizardCard>
            )}

            {/* ── Step: Availability ──────────────────────────────────── */}
            {bookingStep === "availability" && (
              <BookingWizardCard step="availability">
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl tracking-tight">Checking Availability</h2>
                    <p className="text-sm text-muted-foreground mt-1">Verifying equipment availability for your selected dates</p>
                  </div>

                  <AnimatePresence>
                    {availabilityLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 py-10">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "#22c55e15" }}>
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                          </div>
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">Checking availability…</p>
                          <p className="text-xs text-muted-foreground mt-1">Contacting the equipment owner's calendar</p>
                        </div>
                        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: "#22c55e" }}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "linear" }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {!availabilityLoading && availabilityResult?.available === true && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 260 }}
                        className="relative overflow-hidden rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/8 p-6"
                      >
                        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl bg-[#22c55e]" />
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#22c55e" }}>
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#16a34a] text-lg">✓ Equipment Available</p>
                            <p className="text-sm text-muted-foreground mt-1">{equipment.name} is available for your dates</p>
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {[
                                { label: "Duration", value: `${totalDays} day${totalDays > 1 ? "s" : ""}` },
                                { label: "Per Day", value: `₹${equipment.pricePerDay.toLocaleString("en-IN")}` },
                                { label: "Est. Total", value: `₹${totalAmount.toLocaleString("en-IN")}`, accent: true },
                              ].map(({ label, value, accent }) => (
                                <div key={label} className="rounded-xl bg-white/60 dark:bg-card/60 border border-[#22c55e]/20 px-3 py-2.5 col-span-1 last:col-span-2 sm:last:col-span-1">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                                  <p className={`font-bold text-sm mt-0.5 ${accent ? "text-[#16a34a]" : ""}`}>{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {!availabilityLoading && availabilityResult?.available === false && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-red-300/40 bg-red-50 dark:bg-red-500/10 p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-red-500">
                            <XCircle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-red-600 dark:text-red-400 text-lg">✕ Equipment Already Booked</p>
                            <p className="text-sm text-muted-foreground mt-1">{availabilityResult.message ?? "This equipment is not available for the selected dates."}</p>
                            <p className="text-xs text-muted-foreground mt-2">Please go back and choose different dates to continue.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!availabilityLoading && (
                    <div className="flex justify-between gap-3 pt-2">
                      <button
                        onClick={() => { setAvailabilityResult(null); setBookingStep("dates"); }}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
                      >
                        <ArrowLeft className="h-4 w-4" /> Change Dates
                      </button>
                      {availabilityResult?.available && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setBookingStep("location")}
                          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all"
                          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </BookingWizardCard>
            )}

            {/* ── Step: Location ──────────────────────────────────────── */}
            {bookingStep === "location" && (
              <BookingWizardCard step="location">
                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#22c55e15", color: "#16a34a" }}>
                      <Navigation className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl tracking-tight">Farm Location</h2>
                      <p className="text-sm text-muted-foreground mt-1">Tell the equipment owner where the work will be performed</p>
                    </div>
                  </div>

                  {/* Info card */}
                  <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 dark:bg-blue-500/8 dark:border-blue-400/20 p-3 flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your farm location helps the equipment owner plan the journey. This information is only shared with the owner after booking approval.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Farm Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Home className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <textarea
                          rows={2}
                          placeholder="Plot no., Street / Road name"
                          value={farmLocation.address}
                          onChange={(e) => setFarmLocation((f) => ({ ...f, address: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                        />
                      </div>
                    </div>
                    {[
                      { key: "village", label: "Village", placeholder: "Village name" },
                      { key: "taluka", label: "Taluka", placeholder: "Taluka / Sub-district" },
                      { key: "district", label: "District", placeholder: "District" },
                      { key: "state", label: "State", placeholder: "State" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          {label} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={farmLocation[key as keyof FarmLocation]}
                          onChange={(e) => setFarmLocation((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Landmark <span className="normal-case text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Nearby landmark for easy navigation"
                          value={farmLocation.landmark}
                          onChange={(e) => setFarmLocation((f) => ({ ...f, landmark: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between gap-3 pt-2">
                    <button
                      onClick={() => setBookingStep("availability")}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={!locationComplete}
                      onClick={() => setBookingStep("summary")}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      Review Summary
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </BookingWizardCard>
            )}

            {/* ── Step: Summary ───────────────────────────────────────── */}
            {bookingStep === "summary" && (
              <BookingWizardCard step="summary">
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="font-display font-bold text-xl tracking-tight">Booking Summary</h2>
                    <p className="text-sm text-muted-foreground mt-1">Review everything before confirming</p>
                  </div>

                  {/* Equipment */}
                  <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-border">
                      <img src={images[0] ?? "/placeholder-equipment.jpg"} alt={equipment.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-primary">{equipment.type}</p>
                      <p className="font-semibold font-display text-base mt-0.5 truncate">{equipment.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{equipment.location}
                      </p>
                    </div>
                  </div>

                  {/* Booking details */}
                  <div className="rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#16a34a]">Booking Details</p>
                    {[
                      { label: "Start Date", value: new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                      { label: "End Date", value: new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                      { label: "Total Days", value: `${totalDays} day${totalDays > 1 ? "s" : ""}` },
                      { label: "Price Per Day", value: `₹${equipment.pricePerDay.toLocaleString("en-IN")}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                    <div className="h-px bg-[#22c55e]/20" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Estimated Total</span>
                      <span className="text-[#16a34a]">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Farm location */}
                  <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Farm Location</p>
                    <p className="text-sm">{farmLocation.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {[farmLocation.village, farmLocation.taluka, farmLocation.district, farmLocation.state].filter(Boolean).join(", ")}
                    </p>
                    {farmLocation.landmark && (
                      <p className="text-xs text-muted-foreground">Near: {farmLocation.landmark}</p>
                    )}
                  </div>

                  {/* Owner + operator */}
                  <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-border">
                      {equipment.owner?.profileImage ? (
                        <img src={equipment.owner.profileImage} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                          {equipment.owner?.fullName?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{equipment.owner?.fullName}</p>
                      <p className="text-xs text-muted-foreground">Owner</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${equipment.operatorIncluded ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400" : "bg-muted border-border text-muted-foreground"}`}>
                      {equipment.operatorIncluded ? "Operator Included" : "No Operator"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 pt-2">
                    <button onClick={() => setBookingStep("location")} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setBookingStep("payment")} className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                      Payment Info <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </BookingWizardCard>
            )}

            {/* ── Step: Payment ───────────────────────────────────────── */}
            {bookingStep === "payment" && (
              <BookingWizardCard step="payment">
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl tracking-tight">Payment Information</h2>
                    <p className="text-sm text-muted-foreground mt-1">How payment works on FarmFleet</p>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl p-6 space-y-5" style={{ background: "linear-gradient(135deg, #22c55e10, #16a34a08)", border: "1px solid #22c55e30" }}>
                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl bg-[#22c55e]" />
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#22c55e", color: "white" }}>
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-[#16a34a] text-lg leading-tight">Payment after service</p>
                        <p className="text-xs text-muted-foreground mt-0.5">No advance payment required</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed border-t border-[#22c55e]/20 pt-5">
                      Payment will be collected only after the work is completed. You will be contacted by the owner once the booking is approved.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { icon: CheckCircle2, text: "No Advance Payment" },
                        { icon: Clock, text: "Pay After Service Completion" },
                        { icon: BadgeCheck, text: "Owner Approval Required" },
                        { icon: Shield, text: "Secure FarmFleet Booking" },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2.5 rounded-xl border border-[#22c55e]/20 bg-white/50 dark:bg-card/50 px-3.5 py-3">
                          <Icon className="h-4 w-4 text-[#16a34a] shrink-0" />
                          <span className="text-xs font-semibold">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 pt-2">
                    <button onClick={() => setBookingStep("summary")} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setBookingStep("confirm")} className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                      Proceed to Confirm <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </BookingWizardCard>
            )}

            {/* ── Step: Confirm ───────────────────────────────────────── */}
            {bookingStep === "confirm" && (
              <BookingWizardCard step="confirm">
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-xl tracking-tight">Submit Booking Request</h2>
                    <p className="text-sm text-muted-foreground mt-1">Everything looks good — submit your request to the owner</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Equipment</span>
                      <span className="font-semibold truncate max-w-[180px]">{equipment.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dates</span>
                      <span className="font-semibold">
                        {new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" – "}
                        {new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold">{totalDays} day{totalDays > 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Est. Total</span>
                      <span className="text-[#16a34a]">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {bookingError && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl p-4">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {bookingError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between gap-3 pt-2">
                    <button onClick={() => setBookingStep("payment")} disabled={bookingLoading} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition disabled:opacity-50">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <motion.button
                      whileHover={{ scale: bookingLoading ? 1 : 1.03 }}
                      whileTap={{ scale: bookingLoading ? 1 : 0.97 }}
                      onClick={handleBook}
                      disabled={bookingLoading}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-elevated hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      {bookingLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Submitting request…</>
                      ) : (
                        <>Submit Booking Request <ArrowRight className="h-4 w-4" /></>
                      )}
                    </motion.button>
                  </div>
                </div>
              </BookingWizardCard>
            )}

            {/* ── Step: Success ───────────────────────────────────────── */}
            {bookingStep === "success" && (
              <BookingWizardCard step="success">
                <div className="flex flex-col items-center text-center px-6 py-14 gap-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="h-24 w-24 rounded-3xl flex items-center justify-center shadow-elevated"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-xs uppercase tracking-widest font-bold text-primary mb-1">Request Sent</p>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">✓ Booking Request Sent</h2>
                    <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
                      Your booking request has been submitted successfully.
                    </p>
                  </motion.div>
                  {bookingId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 break-all max-w-xs">
                      Booking ID: {bookingId}
                    </motion.div>
                  )}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full max-w-sm rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 space-y-2 text-left">
                    {[
                      "The equipment owner will review and respond to your request.",
                      "Payment is only required after work completion.",
                      "You will be notified once your booking is approved.",
                    ].map((msg) => (
                      <div key={msg} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        {msg}
                      </div>
                    ))}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate({ to: "/renter/bookings" })} className="flex-1 py-3.5 rounded-2xl font-bold text-white shadow-card hover:shadow-elevated transition-all text-sm" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                      View My Bookings
                    </motion.button>
                    <button onClick={() => navigate({ to: "/renter/search" })} className="flex-1 py-3.5 rounded-2xl border border-border font-semibold hover:bg-accent transition text-sm">
                      Continue Browsing
                    </button>
                  </motion.div>
                </div>
              </BookingWizardCard>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function EquipmentDetails() {
  const { id } = Route.useParams();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [activeImg, setActiveImg] = useState(0);
  const [fav, setFav] = useState(false);

  // View state: "details" | "booking"
  const [showBookingWorkspace, setShowBookingWorkspace] = useState(false);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{ success: boolean; equipment: Equipment }>(
        `/api/equipment/${id}`
      );
      setEquipment(data.equipment);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to load equipment.")
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const { data } = await axios.get(`/api/reviews/equipment/${id}`);
      const list: Review[] = Array.isArray(data) ? data : (data?.reviews ?? []);
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEquipment();
    fetchReviews();
    setActiveImg(0);
  }, [fetchEquipment, fetchReviews]);

  const images = useMemo<string[]>(() => {
    if (!equipment) return [];
    if (equipment.images?.length) return equipment.images;
    if (equipment.image) return [equipment.image];
    return [];
  }, [equipment]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const reviewerName = (r: Review) =>
    r.renterName ?? r.renter?.fullName ?? "Anonymous";
  const reviewerAvatar = (r: Review) =>
    r.renterImage ?? r.renter?.profileImage;

  // ─── Full-page error ────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <ErrorState message={error} onRetry={fetchEquipment} />
        </section>
      </AppShell>
    );
  }

  // ─── Booking workspace (full-page transition) ───────────────────────────────
  if (showBookingWorkspace && equipment) {
    return (
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key="booking-workspace"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookingWorkspace
              equipment={equipment}
              onBack={() => setShowBookingWorkspace(false)}
            />
          </motion.div>
        </AnimatePresence>
      </AppShell>
    );
  }

  // ─── Equipment details view ─────────────────────────────────────────────────
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key="details-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.3 }}
        >
          <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8 overflow-x-hidden">

            {/* ── Breadcrumb ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <Link
                to="/renter/search"
                className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-primary hover:opacity-80 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Marketplace
              </Link>
              {!loading && (
                <div className="text-xs text-muted-foreground">
                  <span className="text-muted-foreground/60">Equipment</span>
                  <span className="mx-1.5">/</span>
                  <span className="font-medium truncate max-w-[160px] inline-block align-middle">
                    {equipment?.name}
                  </span>
                </div>
              )}
            </motion.div>

            {/* ── ABOVE THE FOLD: Gallery + Info Panel ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-6 lg:gap-10 items-start">

              {/* Gallery — left column */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {loading ? (
                  <SkeletonGallery />
                ) : (
                  <EquipmentGallery
                    images={images}
                    name={equipment?.name}
                    activeImg={activeImg}
                    setActiveImg={setActiveImg}
                  />
                )}
              </motion.div>

              {/* Info panel — right column */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                className="lg:sticky lg:top-6"
              >
                {loading || !equipment ? (
                  <SkeletonInfoPanel />
                ) : (
                  <InfoPanel
                    equipment={equipment}
                    reviews={reviews}
                    avgRating={avgRating}
                    onBook={() => setShowBookingWorkspace(true)}
                    fav={fav}
                    setFav={setFav}
                  />
                )}
              </motion.div>
            </div>

            {/* ── BELOW THE FOLD: Details sections ──────────────────────── */}
            <div className="space-y-5 pt-2">

              {/* About */}
              {(loading || equipment?.description) && (
                <SectionCard
                  title="About This Equipment"
                  subtitle="Full description and details"
                  icon={<Info className="h-4 w-4" />}
                  accent="#3b82f6"
                  delay={0.3}
                >
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {equipment?.description}
                    </p>
                  )}
                </SectionCard>
              )}

              {/* Specifications */}
              {!loading &&
                equipment?.specifications &&
                Object.keys(equipment.specifications).length > 0 && (
                  <SectionCard
                    title="Specifications"
                    subtitle="Technical details"
                    icon={<BarChart2 className="h-4 w-4" />}
                    accent="#a855f7"
                    delay={0.33}
                  >
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(equipment.specifications).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm"
                        >
                          <span className="text-muted-foreground capitalize">{key}</span>
                          <span className="font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

              {/* Owner profile */}
              <SectionCard
                title="Owner Profile"
                subtitle="Meet the equipment owner"
                icon={<Users className="h-4 w-4" />}
                accent="#22c55e"
                delay={0.36}
              >
                {loading ? (
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="h-16 w-16 rounded-2xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-36 rounded bg-muted" />
                      <div className="h-3.5 w-48 rounded bg-muted" />
                    </div>
                  </div>
                ) : equipment?.owner ? (
                  <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 border border-border shadow-card">
                      {equipment.owner.profileImage ? (
                        <img src={equipment.owner.profileImage} alt={equipment.owner.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                          {equipment.owner.fullName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold font-display text-base">{equipment.owner.fullName}</p>
                        {equipment.owner.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        {[equipment.owner.village, equipment.owner.district, equipment.owner.state].filter(Boolean).join(", ") || "Location not specified"}
                      </p>
                      {(equipment.owner.averageRating !== undefined || equipment.owner.totalReviews !== undefined) && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {equipment.owner.averageRating !== undefined && (
                            <><StarRow rating={equipment.owner.averageRating} size="sm" /><span className="text-xs font-semibold">{equipment.owner.averageRating.toFixed(1)}</span></>
                          )}
                          {equipment.owner.totalReviews !== undefined && (
                            <span className="text-xs text-muted-foreground">({equipment.owner.totalReviews} review{equipment.owner.totalReviews !== 1 ? "s" : ""})</span>
                          )}
                          {equipment.owner.totalEquipment !== undefined && (
                            <span className="text-xs text-muted-foreground">· {equipment.owner.totalEquipment} equipment listed</span>
                          )}
                        </div>
                      )}
                    </div>
                    {(equipment.owner.phone ?? equipment.owner.mobile) && (
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        href={`tel:${equipment.owner.phone ?? equipment.owner.mobile}`}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-card hover:shadow-elevated transition-all duration-200"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                      >
                        <Phone className="h-4 w-4" />
                        Call Owner
                      </motion.a>
                    )}
                  </div>
                ) : null}
              </SectionCard>

              {/* Reviews */}
              <SectionCard
                title="Renter Reviews"
                subtitle={
                  reviews.length > 0
                    ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""} · ${avgRating.toFixed(1)} avg`
                    : "What renters say"
                }
                icon={<Star className="h-4 w-4" />}
                accent="#f59e0b"
                delay={0.4}
              >
                {reviewsLoading ? (
                  <div className="space-y-4">
                    <SkeletonReview />
                    <SkeletonReview />
                  </div>
                ) : reviews.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    label="No reviews yet"
                    description="No reviews available yet. Be the first renter to review this equipment after completing a booking."
                  />
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r, idx) => (
                      <motion.div
                        key={r._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 hover:shadow-card transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-border">
                              {reviewerAvatar(r) ? (
                                <img src={reviewerAvatar(r)} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                  {reviewerName(r)[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{reviewerName(r)}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <StarRow rating={r.rating} />
                        </div>
                        {r.comment && (
                          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{r.comment}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </SectionCard>

            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}