// src/routes/renter/equipment/$id.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Step } from "react-joyride";
import { OnboardingTour } from "@/components/OnboardingTour";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { loadRazorpayScript } from "@/lib/razorpay";
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
  CreditCard,
  Banknote,
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
  pricePerAcre?: number;
  pricePerDay: number;
  pricePerHour?: number;
  pricingType?: "both" | "daily" | "acres";
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

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} style={style} />;
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
    <div className="w-full border-b border-border/50 bg-muted/20 px-3 sm:px-6 py-3.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1 min-w-0"}`}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <motion.div
                  animate={{
                    backgroundColor: isDone || isActive ? "#22c55e" : "transparent",
                    borderColor: isDone || isActive ? "#22c55e" : "#e5e7eb",
                    scale: isActive ? 1.12 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 flex items-center justify-center text-[11px] sm:text-xs font-bold"
                  style={{ color: isDone || isActive ? "#fff" : "#9ca3af" }}
                >
                  {isDone ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : i + 1}
                </motion.div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors hidden md:block ${
                    isActive ? "text-primary" : isDone ? "text-primary/60" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className="h-0.5 flex-1 mx-1 sm:mx-2 rounded transition-all duration-300 md:-mt-3.5"
                  style={{ backgroundColor: isDone ? "#22c55e" : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="md:hidden mt-2 text-center">
        <span className="text-xs font-semibold text-primary">
          Step {activeIdx + 1} of {STEPS.length}: {STEPS[activeIdx]?.label}
        </span>
      </div>
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
            src={images[activeImg] || "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80"}
            alt={name}
            onError={(ev) => {
              ev.currentTarget.onerror = null;
              ev.currentTarget.src = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=80";
            }}
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
              <img
                src={img || "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60"}
                alt=""
                onError={(ev) => {
                  ev.currentTarget.onerror = null;
                  ev.currentTarget.src = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60";
                }}
                className="h-full w-full object-cover"
              />
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
            ₹{(equipment.pricePerAcre || 0).toLocaleString("en-IN")}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            /acre
          </span>
        </div>
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
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [paymentPaid, setPaymentPaid] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState("");

  const [acres, setAcres] = useState<number>(2);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const totalDays = 1;

  const effectiveAcreRate = useMemo(() => {
    return equipment.pricePerAcre && equipment.pricePerAcre > 0 ? equipment.pricePerAcre : 800;
  }, [equipment.pricePerAcre]);

  const totalAmount = useMemo(() => {
    return (startDate && acres > 0) ? Math.round(acres * effectiveAcreRate) : 0;
  }, [startDate, acres, effectiveAcreRate]);

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
    if (!startDate) return;
    const finalEnd = startDate;
    setAvailabilityLoading(true);
    setAvailabilityResult(null);
    setBookingStep("availability");
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/booking/check-availability`,
        { equipmentId: equipment._id, startDate, endDate: finalEnd },
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
  }, [equipment._id, startDate]);

  const handleBook = useCallback(async () => {
    if (!startDate) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const { data } = await axios.post<BookingResponse>(
        `${API_BASE}/api/booking/create`,
        {
          equipmentId: equipment._id,
          startDate,
          endDate: startDate,
          farmAddress: farmLocation,
          acres: Number(acres) || 1,
        },
        { headers: authHeaders() }
      );

      const bId = data.booking?._id ?? "";
      setBookingId(bId);

      if (!bId) {
        throw new Error("Failed to retrieve booking ID.");
      }

      if (paymentMethod === "online") {
        // Create payment order
        const orderRes = await axios.post(
          `${API_BASE}/api/payment/create-order`,
          {
            transactionType: "equipment_booking",
            transactionId: bId,
          },
          { headers: authHeaders() }
        );

        const { orderId, amount, currency, keyId } = orderRes.data;

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          setBookingError("Razorpay SDK failed to load. Please check internet connection.");
          setBookingLoading(false);
          return;
        }

        const options = {
          key: keyId,
          amount: amount, // backend source of truth in smallest currency unit
          currency: currency || "INR",
          name: "FarmFleet",
          description: `Equipment Rental Payment - ${equipment.name}`,
          order_id: orderId,
          handler: async function (response: any) {
            try {
              setBookingLoading(true);
              const verifyRes = await axios.post(
                `${API_BASE}/api/payment/verify`,
                {
                  transactionType: "equipment_booking",
                  transactionId: bId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                },
                { headers: authHeaders() }
              );

              if (verifyRes.data.success) {
                setPaymentPaid(true);
                setPaymentStatusText("Paid Online via Razorpay (TEST MODE)");
                setBookingStep("success");
              } else {
                setBookingError("Payment verification failed.");
              }
            } catch (err: unknown) {
              setBookingError(
                axios.isAxiosError(err)
                  ? (err.response?.data?.message ?? "Payment verification failed.")
                  : "Payment verification failed."
              );
            } finally {
              setBookingLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setBookingLoading(false);
              setPaymentPaid(false);
              setPaymentStatusText("Pending (Online payment pending)");
              setBookingStep("success");
            },
          },
          theme: {
            color: "#16a34a",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setPaymentPaid(false);
        setPaymentStatusText("Cash on Delivery (Pay after service)");
        setBookingStep("success");
        setBookingLoading(false);
      }
    } catch (err: unknown) {
      setBookingError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Booking failed. Please try again.")
          : "Booking failed. Please try again."
      );
      setBookingLoading(false);
    }
  }, [
    equipment._id,
    equipment.name,
    startDate,
    endDate,
    paymentMethod,
    farmLocation,
    acres,
  ]);

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
                      <h2 className="font-display font-bold text-xl tracking-tight">Select Rental Mode & Details</h2>
                      <p className="text-sm text-muted-foreground mt-1">Choose between agricultural area-based work (Acres) or full daily rentals (Days)</p>
                    </div>
                  </div>

                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-card text-foreground shadow-sm border border-border/80">
                      <Tractor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Acre-based Rental (By Area)</span>
                    </div>

                  {/* Acre-based Rental UI */}
                  <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Scheduled Work Date <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="date"
                            min={today}
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setEndDate(e.target.value); // same day for single-day acre job
                              setAvailabilityResult(null);
                            }}
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                          />
                        </div>
                      </div>

                      {/* Required Area (Acres) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Area (Acres) <span className="text-red-400">*</span>
                          </label>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Rate: ₹{effectiveAcreRate.toLocaleString("en-IN")} / acre
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={0.1}
                            step={0.5}
                            value={acres || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setAcres(isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            placeholder="Enter required area in acres (e.g. 4)"
                            className="w-full px-4 py-3.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                          />
                        </div>

                        {/* Quick Acre Chips */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium mr-1">Quick Select:</span>
                          {[1, 2, 4, 6, 10].map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setAcres(a)}
                              className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition ${
                                acres === a
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border bg-background hover:bg-accent text-foreground"
                              }`}
                            >
                              {a} Acre{a > 1 ? "s" : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  <AnimatePresence>
                    {totalAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl border border-[#22c55e]/25 bg-[#22c55e]/5 p-4 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#22c55e20", color: "#16a34a" }}>
                              <Tractor className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Rental Summary</p>
                                {`${acres} Acre${acres !== 1 ? "s" : ""} • ₹${effectiveAcreRate.toLocaleString("en-IN")}/acre`}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium">Estimated Rental Cost</p>
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
                      disabled={!startDate || (!acres || acres <= 0)}
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
                                { label: "Acres", value: `${acres} Acre${acres !== 1 ? "s" : ""}` },
                                { label: "Per Acre", value: `₹${effectiveAcreRate.toLocaleString("en-IN")}` },
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
                      <img
                        src={images[0] || "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60"}
                        alt={equipment.name}
                        onError={(ev) => {
                          ev.currentTarget.onerror = null;
                          ev.currentTarget.src = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60";
                        }}
                        className="h-full w-full object-cover"
                      />
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
                      { label: "Rental Mode", value: "Acre-based Rental (By Area)" },
                      { label: "Scheduled Date", value: startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "" },
                      { label: "Area (Acres)", value: `${acres} Acre${acres !== 1 ? "s" : ""}` },
                      { label: "Rental Rate", value: `₹${effectiveAcreRate.toLocaleString("en-IN")} / acre` },
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <div key={item!.label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item!.label}</span>
                          <span className="font-semibold">{item!.value}</span>
                        </div>
                      ))}
                    <div className="h-px bg-[#22c55e]/20" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Estimated Rental Cost</span>
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
                    <h2 className="font-display font-bold text-xl tracking-tight">Select Payment Method</h2>
                    <p className="text-sm text-muted-foreground mt-1">Choose how you would like to pay for this booking</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Pay Online */}
                    <div
                      onClick={() => setPaymentMethod("online")}
                      className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 ${
                        paymentMethod === "online"
                          ? "border-primary bg-primary/5 shadow-card"
                          : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        {paymentMethod === "online" && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-base mt-3">Pay Online</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Razorpay TEST MODE — Cards, UPI, NetBanking, Wallets
                      </p>
                      <div className="mt-3 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        Instant Checkout
                      </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div
                      onClick={() => setPaymentMethod("cash")}
                      className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 ${
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/5 shadow-card"
                          : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                          <Banknote className="h-5 w-5" />
                        </div>
                        {paymentMethod === "cash" && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-base mt-3">Cash on Delivery</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pay in cash directly to the equipment owner after service
                      </p>
                      <div className="mt-3 inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        Pay After Work
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      {paymentMethod === "online" ? (
                        <p>
                          <strong>Razorpay TEST MODE:</strong> Clicking submit will open Razorpay's secure test popup. Use test credentials (UPI / Card) to complete payment.
                        </p>
                      ) : (
                        <p>
                          <strong>Cash on Delivery:</strong> No advance payment online. Pay the owner directly when work is finished.
                        </p>
                      )}
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
                    <p className="text-sm text-muted-foreground mt-1">Review your details and complete booking</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Equipment</span>
                      <span className="font-semibold truncate max-w-[180px]">{equipment.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rental Mode</span>
                      <span className="font-semibold">{`Acre-based (${acres} acres)`}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled Date</span>
                      <span className="font-semibold">
                        {startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-semibold flex items-center gap-1.5 text-primary">
                        {paymentMethod === "online" ? (
                          <><CreditCard className="h-3.5 w-3.5" /> Razorpay Online (Test)</>
                        ) : (
                          <><Banknote className="h-3.5 w-3.5 text-amber-600" /> Cash on Delivery</>
                        )}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Estimated Rental Cost</span>
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
                        <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                      ) : (
                        <>{paymentMethod === "online" ? "Pay Online & Book" : "Submit Booking Request"} <ArrowRight className="h-4 w-4" /></>
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
                    <p className="text-xs uppercase tracking-widest font-bold text-primary mb-1">
                      {paymentPaid ? "Payment Verified" : "Request Sent"}
                    </p>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                      {paymentPaid ? "✓ Booking & Payment Confirmed!" : "✓ Booking Request Sent"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
                      {paymentPaid
                        ? "Your payment via Razorpay TEST MODE was verified successfully. The owner has been notified."
                        : "Your booking request has been submitted. Payment will be collected in cash after work completion."}
                    </p>
                  </motion.div>
                  {bookingId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 break-all max-w-xs">
                      Booking ID: {bookingId}
                    </motion.div>
                  )}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full max-w-sm rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 space-y-2 text-left">
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      Status: <span className="font-semibold text-foreground">{paymentStatusText}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      The equipment owner will review and update your booking status.
                    </div>
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
  const { t } = useTranslation();
  const { id } = Route.useParams();

  const tourSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="eq-overview"]',
        title: t("tour.renterEquipmentDetail.overviewTitle"),
        content: t("tour.renterEquipmentDetail.overviewContent"),
      },
      {
        target: '[data-tour="eq-owner-card"]',
        title: t("tour.renterEquipmentDetail.ownerCardTitle"),
        content: t("tour.renterEquipmentDetail.ownerCardContent"),
      },
      {
        target: '[data-tour="eq-location"]',
        title: t("tour.renterEquipmentDetail.locationTitle"),
        content: t("tour.renterEquipmentDetail.locationContent"),
      },
      {
        target: '[data-tour="eq-booking-form"]',
        title: t("tour.renterEquipmentDetail.bookingFormTitle"),
        content: t("tour.renterEquipmentDetail.bookingFormContent"),
      },
    ],
    [t]
  );

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [activeImg, setActiveImg] = useState(0);
  const [fav, setFav] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("farmfleet_favorites") || "[]");
      return saved.includes(id);
    } catch {
      return false;
    }
  });

  const handleToggleFav = (nextFav: boolean) => {
    setFav(nextFav);
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("farmfleet_favorites") || "[]");
      const updated = nextFav ? [...new Set([...saved, id])] : saved.filter((x) => x !== id);
      localStorage.setItem("farmfleet_favorites", JSON.stringify(updated));
    } catch {}
  };

  // View state: "details" | "booking"
  const [showBookingWorkspace, setShowBookingWorkspace] = useState(false);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{ success: boolean; equipment: Equipment }>(
        `${API_BASE}/api/equipment/${id}`
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
      const { data } = await axios.get(`${API_BASE}/api/reviews/equipment/${id}`);
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
              <div className="flex items-center gap-3">
                {!loading && (
                  <div className="text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">Equipment</span>
                    <span className="mx-1.5">/</span>
                    <span className="font-medium truncate max-w-[160px] inline-block align-middle">
                      {equipment?.name}
                    </span>
                  </div>
                )}
                <OnboardingTour
                  tourKey="farmfleet_tour_seen_renter_equipment_detail"
                  steps={tourSteps}
                />
              </div>
            </motion.div>

            {/* ── ABOVE THE FOLD: Gallery + Info Panel ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-6 lg:gap-10 items-start">

              {/* Gallery — left column */}
              <motion.div
                data-tour="eq-overview"
                initial={{ opacity: 0, x: -20 }}
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
                    setFav={handleToggleFav}
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