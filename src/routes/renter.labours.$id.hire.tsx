// src/routes/renter.labours.$id.hire.tsx
//
// Labour Hiring Wizard — the Labour equivalent of the Equipment Booking page.
// Same UI language, spacing, typography, stepper, sticky sidebar, and motion
// timings as the Equipment Booking wizard. Talks only to the existing Labour
// backend (GET /api/labour/public/:id, POST /api/labour-request/check-availability,
// POST /api/labour-request).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { loadRazorpayScript } from "@/lib/razorpay";
import {
  Calendar,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Clock,
  Check,
  XCircle,
  Home,
  Landmark,
  Navigation,
  User,
  Briefcase,
  Sprout as CropIcon,
  Ruler,
  FileText,
  CalendarClock,
  ArrowRight,
  ArrowLeft,
  Shield,
  BadgeCheck,
  Star,
  Info,
  CreditCard,
  Banknote,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Labour {
  _id: string;
  fullName: string;
  profileImage?: string;
  primarySkill: string;
  experience: number;
  dailyCharges: number;
  availability: boolean;
  rating?: number;
  totalReviews?: number;
}

interface FarmLocation {
  village: string;
  taluka: string;
  district: string;
  state: string;
  landmark: string;
  address: string;
}

interface WorkDetails {
  workType: string;
  cropType: string;
  acres: string;
  estimatedDays: string;
  description: string;
}

type WizardStep =
  | "dates"
  | "availability"
  | "location"
  | "work"
  | "review"
  | "confirm"
  | "success";

type AvailabilityStatus = "idle" | "checking" | "available" | "booked" | "error";

// API response shapes we may receive when fetching a labour profile.
interface LabourFetchResponse {
  success?: boolean;
  labour?: Labour;
  data?: Labour;
  _id?: string;
  [key: string]: unknown;
}

// API response shapes we may receive from the availability check.
interface AvailabilityCheckResponse {
  available?: boolean;
  status?: string;
  message?: string;
}

// API response shapes we may receive after submitting a labour request.
interface SubmitRequestResponse {
  request?: { _id?: string };
  data?: { _id?: string };
  _id?: string;
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/renter/labours/$id/hire")({
  head: () => ({ meta: [{ title: "Hire Labour — FarmFleet" }] }),
  component: LabourHiringWizard,
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
// SHARED PRIMITIVES (identical tokens to Equipment Booking)
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = "#22c55e";
const ACCENT_DARK = "#16a34a";
const GRADIENT = `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`;

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

function FieldLabel({
  children,
  required,
  optional,
}: {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {children}{" "}
      {required && <span className="text-red-400">*</span>}
      {optional && (
        <span className="normal-case text-muted-foreground font-normal">(optional)</span>
      )}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP INDICATOR — premium animated stepper
// ─────────────────────────────────────────────────────────────────────────────

const STEPPER_STEPS: { key: WizardStep; label: string }[] = [
  { key: "dates", label: "Dates" },
  { key: "availability", label: "Availability" },
  { key: "location", label: "Location" },
  { key: "work", label: "Work Details" },
  { key: "review", label: "Review" },
  { key: "confirm", label: "Confirm" },
];

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const activeIdx = STEPPER_STEPS.findIndex((s) => s.key === currentStep);
  if (activeIdx === -1) return null;

  return (
    <div className="flex items-center justify-center gap-0 flex-wrap px-4 py-4 border-b border-border/50 bg-muted/20">
      {STEPPER_STEPS.map((step, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  backgroundColor: isDone || isActive ? ACCENT : "transparent",
                  borderColor: isDone || isActive ? ACCENT : "#e5e7eb",
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
            {i < STEPPER_STEPS.length - 1 && (
              <div
                className="mx-1.5 mb-4 h-0.5 w-5 sm:w-8 rounded transition-all duration-300"
                style={{ backgroundColor: isDone ? ACCENT : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP CARD TRANSITION WRAPPER (matches Equipment Booking slide timings)
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({ step, children }: { step: WizardStep; children: React.ReactNode }) {
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
// STICKY SUMMARY SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="h-px bg-border" />
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function SummarySidebar({
  labour,
  availabilityStatus,
  estimatedDays,
  estimatedCost,
}: {
  labour: Labour;
  availabilityStatus: AvailabilityStatus;
  estimatedDays: number;
  estimatedCost: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="lg:sticky lg:top-6 relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-3xl"
        style={{ background: ACCENT }}
      />
      <div className="p-5 space-y-5">
        {/* Labour identity */}
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 border border-border shadow-card">
            {labour.profileImage ? (
              <img src={labour.profileImage} alt={labour.fullName} className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-lg font-bold text-white"
                style={{ background: GRADIENT }}
              >
                {labour.fullName?.[0]?.toUpperCase() ?? <User className="h-6 w-6" />}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-base truncate">{labour.fullName}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Briefcase className="h-3 w-3" />
              {labour.primarySkill}
            </p>
            {!!labour.totalReviews && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {labour.rating?.toFixed(1)} ({labour.totalReviews})
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Key facts */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Experience
            </span>
            <span className="font-semibold">{labour.experience} Years</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Daily Charges</span>
            <span className="font-semibold">₹{labour.dailyCharges.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Availability</span>
            <AvailabilityPill status={availabilityStatus} baseAvailable={labour.availability} />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Estimate */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Estimated Days
            </span>
            <span className="font-semibold">{estimatedDays > 0 ? estimatedDays : "—"}</span>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}30` }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Estimated Cost
            </p>
            <motion.p
              key={estimatedCost}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold font-display mt-0.5"
              style={{ color: ACCENT_DARK }}
            >
              {estimatedCost > 0 ? `₹${estimatedCost.toLocaleString("en-IN")}` : "—"}
            </motion.p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Daily Charges × Estimated Days</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AvailabilityPill({
  status,
  baseAvailable,
}: {
  status: AvailabilityStatus;
  baseAvailable: boolean;
}) {
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Available
      </span>
    );
  }
  if (status === "booked" || status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
        <XCircle className="h-3 w-3" /> Unavailable
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        baseAvailable ? "text-emerald-600" : "text-muted-foreground"
      }`}
    >
      {baseAvailable ? "Available" : "Unknown"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE (premium, retry + back)
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-3"
    >
      <AlertCircle className="h-10 w-10 text-destructive/60" />
      <p className="font-semibold">Something went wrong</p>
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
          to="/renter/labours"
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/20 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function LabourHiringWizard() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [labour, setLabour] = useState<Labour | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<WizardStep>("dates");

  // Step 1 — Working Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateErrors, setDateErrors] = useState<{ start?: string; end?: string }>({});

  // Step 2 — Availability
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  // Step 3 — Farm Location
  const [farmLocation, setFarmLocation] = useState<FarmLocation>({
    village: "",
    taluka: "",
    district: "",
    state: "",
    landmark: "",
    address: "",
  });

  // Step 4 — Work Details
  const [workDetails, setWorkDetails] = useState<WorkDetails>({
    workType: "",
    cropType: "",
    acres: "",
    estimatedDays: "",
    description: "",
  });

  // Payment options
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [paymentPaid, setPaymentPaid] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState("");

  // Step 6 — Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // ── Fetch labour details ──────────────────────────────────────────────────
  const fetchLabour = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await axios.get<LabourFetchResponse | Labour>(
        `${API_BASE}/api/labour/public/${id}`
      );
      // Backend may respond with the labour object directly, wrapped as
      // { success, labour } or wrapped as { data: labour } — support all three.
      const payload = data as LabourFetchResponse;
      const labourData = payload?.labour ?? payload?.data ?? (data as Labour);

      if (!labourData?._id) {
        throw new Error("Labour not found.");
      }
      setLabour(labourData);
    } catch (err: unknown) {
      setLoadError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to load labour profile.")
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLabour();
  }, [fetchLabour]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(
      1,
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000)
    );
  }, [startDate, endDate]);

  const estimatedDaysForCost = useMemo(() => {
    const parsed = Number(workDetails.estimatedDays);
    if (parsed > 0) return parsed;
    return totalDays;
  }, [workDetails.estimatedDays, totalDays]);

  const estimatedCost = useMemo(
    () => (labour ? estimatedDaysForCost * labour.dailyCharges : 0),
    [estimatedDaysForCost, labour]
  );

  const datesValid = Boolean(startDate) && Boolean(endDate) && endDate >= startDate;

  const locationComplete = Boolean(
    farmLocation.village.trim() &&
      farmLocation.taluka.trim() &&
      farmLocation.district.trim() &&
      farmLocation.state.trim() &&
      farmLocation.address.trim()
  );

  const workComplete = Boolean(
    workDetails.workType.trim() &&
      workDetails.cropType.trim() &&
      workDetails.acres.trim() &&
      workDetails.estimatedDays.trim() &&
      workDetails.description.trim()
  );

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const validateDates = useCallback(() => {
    const errs: { start?: string; end?: string } = {};
    if (!startDate) errs.start = "Start date is required.";
    if (!endDate) errs.end = "End date is required.";
    if (startDate && endDate && endDate < startDate) {
      errs.end = "End date cannot be before start date.";
    }
    setDateErrors(errs);
    return Object.keys(errs).length === 0;
  }, [startDate, endDate]);

  // ── Step 2 — availability check ──────────────────────────────────────────
  const checkAvailability = useCallback(async () => {
    if (!labour) return;
    setStep("availability");
    setAvailabilityStatus("checking");
    setAvailabilityMessage(null);
    try {
      const { data } = await axios.post<AvailabilityCheckResponse>(
        `${API_BASE}/api/labour-request/check-availability`,
        { labourId: labour._id, startDate, endDate },
        { headers: authHeaders() }
      );
      const isAvailable = data?.available === true || data?.status === "available";
      if (isAvailable) {
        setAvailabilityStatus("available");
      } else {
        setAvailabilityStatus("booked");
        setAvailabilityMessage(data?.message ?? "Already booked for selected dates");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message;
        if (status === 409) {
          // Already booked / conflicting request for these dates.
          setAvailabilityStatus("booked");
          setAvailabilityMessage(serverMessage ?? "Already booked for selected dates");
        } else if (status === 400) {
          // Validation error (e.g. malformed dates).
          setAvailabilityStatus("error");
          setAvailabilityMessage(
            serverMessage ?? "Please check your selected dates and try again."
          );
        } else if (status === 401) {
          setAvailabilityStatus("error");
          setAvailabilityMessage("Your session has expired. Please log in again.");
        } else {
          setAvailabilityStatus("error");
          setAvailabilityMessage(serverMessage ?? "Could not check availability.");
        }
      } else {
        setAvailabilityStatus("error");
        setAvailabilityMessage("Could not check availability.");
      }
    }
  }, [labour, startDate, endDate]);

  // ── Step 6 — submit request ──────────────────────────────────────────────
  const submitRequest = useCallback(async () => {
    if (!labour) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await axios.post<SubmitRequestResponse>(
        `${API_BASE}/api/labour-request`,
        {
          labourId: labour._id,
          startDate,
          endDate,
          village: farmLocation.village,
          taluka: farmLocation.taluka,
          district: farmLocation.district,
          state: farmLocation.state,
          address: farmLocation.address,
          landmark: farmLocation.landmark,
          workType: workDetails.workType,
          cropType: workDetails.cropType,
          acres: workDetails.acres,
          estimatedDays: workDetails.estimatedDays,
          description: workDetails.description,
        },
        { headers: authHeaders() }
      );

      const rId = data?.request?._id ?? data?.data?._id ?? data?._id ?? "";
      setRequestId(rId);

      if (!rId) {
        throw new Error("Labour request ID not returned.");
      }

      if (paymentMethod === "online") {
        // Create payment order
        const orderRes = await axios.post(
          `${API_BASE}/api/payment/create-order`,
          {
            transactionType: "labour_request",
            transactionId: rId,
          },
          { headers: authHeaders() }
        );

        const { orderId, amount, currency, keyId } = orderRes.data;

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          setSubmitError("Razorpay SDK failed to load. Please check internet connection.");
          setSubmitting(false);
          return;
        }

        const options = {
          key: keyId,
          amount: amount, // backend source of truth in paise
          currency: currency || "INR",
          name: "FarmFleet",
          description: `Labour Hiring Payment - ${labour.fullName}`,
          order_id: orderId,
          handler: async function (response: any) {
            try {
              setSubmitting(true);
              const verifyRes = await axios.post(
                `${API_BASE}/api/payment/verify`,
                {
                  transactionType: "labour_request",
                  transactionId: rId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                },
                { headers: authHeaders() }
              );

              if (verifyRes.data.success) {
                setPaymentPaid(true);
                setPaymentStatusText("Paid Online via Razorpay (TEST MODE)");
                setStep("success");
              } else {
                setSubmitError("Payment verification failed.");
              }
            } catch (err: unknown) {
              setSubmitError(
                axios.isAxiosError(err)
                  ? (err.response?.data?.message ?? "Payment verification failed.")
                  : "Payment verification failed."
              );
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setPaymentPaid(false);
              setPaymentStatusText("Pending (Online payment pending)");
              setStep("success");
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
        setPaymentStatusText("Cash Payment (Pay after work completion)");
        setStep("success");
        setSubmitting(false);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message;
        if (status === 409) {
          setSubmitError(
            serverMessage ?? "You already have a pending request for this labour on these dates."
          );
        } else if (status === 400) {
          setSubmitError(serverMessage ?? "Please check your request details and try again.");
        } else if (status === 401) {
          setSubmitError("Your session has expired. Please log in again.");
        } else {
          setSubmitError(serverMessage ?? "Request failed. Please try again.");
        }
      } else {
        setSubmitError("Request failed. Please try again.");
      }
      setSubmitting(false);
    }
  }, [labour, startDate, endDate, farmLocation, workDetails, paymentMethod]);

  // ── Full-page error ───────────────────────────────────────────────────────
  if (!loading && loadError) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <ErrorState message={loadError} onRetry={fetchLabour} />
        </section>
      </AppShell>
    );
  }

  const showSidebar = step !== "success";

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center gap-4">
            {step !== "success" && (
              <Link
                to="/renter/labours/$id"
                params={{ id }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Labour Details</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            <div className="flex-1 min-w-0">
              {!loading && labour && (
                <p className="text-xs text-muted-foreground truncate">{labour.fullName}</p>
              )}
            </div>
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: GRADIENT }}
            >
              <Briefcase className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {step !== "success" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Hire This Labour
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Submit your work request in a few quick steps.
              </p>
            </motion.div>
          )}

          {/* ── Desktop: wizard | sticky sidebar · Mobile: stacked ─────── */}
          <div
            className={`grid grid-cols-1 gap-6 lg:gap-8 items-start ${
              showSidebar ? "lg:grid-cols-[1fr_340px]" : ""
            }`}
          >
            {/* Wizard column */}
            <div className="min-w-0">
              {step !== "success" && (
                <div className="mb-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                  <StepIndicator currentStep={step} />
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <AnimatePresence mode="wait">
                  {/* Loading skeleton for wizard */}
                  {loading && (
                    <motion.div
                      key="wizard-skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 space-y-6 animate-pulse"
                    >
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-3.5 w-64" />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step: Working Dates ─────────────────────────────── */}
                  {!loading && labour && step === "dates" && (
                    <StepCard step="dates">
                      <div className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${ACCENT}15`, color: ACCENT_DARK }}
                          >
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="font-display font-bold text-xl tracking-tight">
                              Select Working Dates
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Choose when you need this labour
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <FieldLabel required>Start Date</FieldLabel>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="date"
                                min={today}
                                value={startDate}
                                onChange={(e) => {
                                  setStartDate(e.target.value);
                                  if (endDate && e.target.value > endDate) setEndDate("");
                                  setDateErrors({});
                                  setAvailabilityStatus("idle");
                                }}
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                              />
                            </div>
                            {dateErrors.start && (
                              <p className="text-xs text-red-500 mt-1.5">{dateErrors.start}</p>
                            )}
                          </div>
                          <div>
                            <FieldLabel required>End Date</FieldLabel>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="date"
                                min={startDate || today}
                                value={endDate}
                                disabled={!startDate}
                                onChange={(e) => {
                                  setEndDate(e.target.value);
                                  setDateErrors({});
                                  setAvailabilityStatus("idle");
                                }}
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition disabled:opacity-50"
                              />
                            </div>
                            {dateErrors.end && (
                              <p className="text-xs text-red-500 mt-1.5">{dateErrors.end}</p>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {totalDays > 0 && datesValid && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div
                                className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
                                style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}30` }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                                    style={{ background: `${ACCENT}20`, color: ACCENT_DARK }}
                                  >
                                    <Clock className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Duration</p>
                                    <p className="font-bold text-sm">
                                      {totalDays} day{totalDays > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex justify-end gap-3 pt-2">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={!datesValid}
                            onClick={() => {
                              if (validateDates()) checkAvailability();
                            }}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                            style={{ background: GRADIENT }}
                          >
                            Next
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </StepCard>
                  )}

                  {/* ── Step: Availability ──────────────────────────────── */}
                  {!loading && labour && step === "availability" && (
                    <StepCard step="availability">
                      <div className="p-6 space-y-6">
                        <div>
                          <h2 className="font-display font-bold text-xl tracking-tight">
                            Checking Availability
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Verifying labour availability for your selected dates
                          </p>
                        </div>

                        {availabilityStatus === "checking" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-5 py-10"
                          >
                            <div className="relative">
                              <div
                                className="h-16 w-16 rounded-full flex items-center justify-center"
                                style={{ background: `${ACCENT}15` }}
                              >
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                              </div>
                              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">Checking availability…</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Contacting {labour.fullName}'s schedule
                              </p>
                            </div>
                            <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: ACCENT }}
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "linear" }}
                              />
                            </div>
                          </motion.div>
                        )}

                        {availabilityStatus === "available" && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 260 }}
                            className="relative overflow-hidden rounded-2xl p-6"
                            style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}4d` }}
                          >
                            <div
                              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                              style={{ background: ACCENT }}
                            />
                            <div className="flex items-start gap-4">
                              <div
                                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: ACCENT }}
                              >
                                <CheckCircle2 className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-lg" style={{ color: ACCENT_DARK }}>
                                  ✓ Labour Available
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {labour.fullName} is available for your selected dates.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {(availabilityStatus === "booked" || availabilityStatus === "error") && (
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
                                <p className="font-bold text-red-600 dark:text-red-400 text-lg">
                                  {availabilityStatus === "booked"
                                    ? "Already booked for selected dates"
                                    : "Couldn't check availability"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {availabilityMessage ?? "Please choose different dates to continue."}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {availabilityStatus !== "checking" && (
                          <div className="flex justify-between gap-3 pt-2">
                            <button
                              onClick={() => {
                                setAvailabilityStatus("idle");
                                setStep("dates");
                              }}
                              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
                            >
                              <ArrowLeft className="h-4 w-4" /> Change Dates
                            </button>
                            {availabilityStatus === "available" && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setStep("location")}
                                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all"
                                style={{ background: GRADIENT }}
                              >
                                Next
                                <ArrowRight className="h-4 w-4" />
                              </motion.button>
                            )}
                            {availabilityStatus === "error" && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={checkAvailability}
                                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all"
                                style={{ background: GRADIENT }}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>
                    </StepCard>
                  )}

                  {/* ── Step: Farm Location ─────────────────────────────── */}
                  {!loading && labour && step === "location" && (
                    <StepCard step="location">
                      <div className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${ACCENT}15`, color: ACCENT_DARK }}
                          >
                            <Navigation className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="font-display font-bold text-xl tracking-tight">
                              Farm Location
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tell the labour where the work will be performed
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 dark:bg-blue-500/8 dark:border-blue-400/20 p-3 flex items-start gap-2.5">
                          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            This information is only shared with the labour after your request is accepted.
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <FieldLabel required>Full Address</FieldLabel>
                            <div className="relative">
                              <Home className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <textarea
                                rows={2}
                                placeholder="Plot no., street / road name"
                                value={farmLocation.address}
                                onChange={(e) =>
                                  setFarmLocation((f) => ({ ...f, address: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                              />
                            </div>
                          </div>
                          {[
                            { key: "village" as const, label: "Village", placeholder: "Village name" },
                            { key: "taluka" as const, label: "Taluka", placeholder: "Taluka / Sub-district" },
                            { key: "district" as const, label: "District", placeholder: "District" },
                            { key: "state" as const, label: "State", placeholder: "State" },
                          ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                              <FieldLabel required>{label}</FieldLabel>
                              <input
                                type="text"
                                placeholder={placeholder}
                                value={farmLocation[key]}
                                onChange={(e) =>
                                  setFarmLocation((f) => ({ ...f, [key]: e.target.value }))
                                }
                                className="w-full px-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                              />
                            </div>
                          ))}
                          <div className="sm:col-span-2">
                            <FieldLabel optional>Landmark</FieldLabel>
                            <div className="relative">
                              <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Nearby landmark for easy navigation"
                                value={farmLocation.landmark}
                                onChange={(e) =>
                                  setFarmLocation((f) => ({ ...f, landmark: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between gap-3 pt-2">
                          <button
                            onClick={() => setStep("availability")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
                          >
                            <ArrowLeft className="h-4 w-4" /> Back
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={!locationComplete}
                            onClick={() => setStep("work")}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: GRADIENT }}
                          >
                            Next
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </StepCard>
                  )}

                  {/* ── Step: Work Details ──────────────────────────────── */}
                  {!loading && labour && step === "work" && (
                    <StepCard step="work">
                      <div className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${ACCENT}15`, color: ACCENT_DARK }}
                          >
                            <Briefcase className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="font-display font-bold text-xl tracking-tight">
                              Work Details
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Describe the work you need done
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <FieldLabel required>Work Type</FieldLabel>
                            <div className="relative">
                              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <select
                                value={workDetails.workType}
                                onChange={(e) =>
                                  setWorkDetails((w) => ({ ...w, workType: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition appearance-none"
                              >
                                <option value="">Select work type</option>
                                <option value="Ploughing">Ploughing</option>
                                <option value="Sowing">Sowing</option>
                                <option value="Weeding">Weeding</option>
                                <option value="Spraying">Spraying</option>
                                <option value="Harvesting">Harvesting</option>
                                <option value="Loading / Unloading">Loading / Unloading</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              Choose the primary task for this job.
                            </p>
                          </div>
                          <div>
                            <FieldLabel required>Crop Type</FieldLabel>
                            <div className="relative">
                              <CropIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="text"
                                placeholder="e.g. Wheat, Sugarcane, Cotton"
                                value={workDetails.cropType}
                                onChange={(e) =>
                                  setWorkDetails((w) => ({ ...w, cropType: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                              />
                            </div>
                          </div>
                          <div>
                            <FieldLabel required>Total Acres</FieldLabel>
                            <div className="relative">
                              <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="number"
                                min={0}
                                placeholder="e.g. 5"
                                value={workDetails.acres}
                                onChange={(e) =>
                                  setWorkDetails((w) => ({ ...w, acres: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                              />
                            </div>
                          </div>
                          <div>
                            <FieldLabel required>Estimated Working Days</FieldLabel>
                            <div className="relative">
                              <CalendarClock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="number"
                                min={0}
                                placeholder="e.g. 3"
                                value={workDetails.estimatedDays}
                                onChange={(e) =>
                                  setWorkDetails((w) => ({ ...w, estimatedDays: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              Used to calculate your estimated cost.
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <FieldLabel required>Description</FieldLabel>
                            <div className="relative">
                              <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <textarea
                                rows={3}
                                placeholder="Describe the work you need done in detail"
                                value={workDetails.description}
                                onChange={(e) =>
                                  setWorkDetails((w) => ({ ...w, description: e.target.value }))
                                }
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between gap-3 pt-2">
                          <button
                            onClick={() => setStep("location")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
                          >
                            <ArrowLeft className="h-4 w-4" /> Back
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={!workComplete}
                            onClick={() => setStep("review")}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: GRADIENT }}
                          >
                            Review Request
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </StepCard>
                  )}

                  {/* ── Step: Review ────────────────────────────────────── */}
                  {!loading && labour && step === "review" && (
                    <StepCard step="review">
                      <div className="p-6 space-y-5">
                        <div>
                          <h2 className="font-display font-bold text-xl tracking-tight">
                            Review Request
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Review everything before confirming
                          </p>
                        </div>

                        {/* Labour */}
                        <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 border border-border">
                            {labour.profileImage ? (
                              <img
                                src={labour.profileImage}
                                alt={labour.fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className="h-full w-full flex items-center justify-center text-lg font-bold text-white"
                                style={{ background: GRADIENT }}
                              >
                                {labour.fullName?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-primary">
                              {labour.primarySkill}
                            </p>
                            <p className="font-semibold font-display text-base mt-0.5 truncate">
                              {labour.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {labour.experience} Years Experience · ₹
                              {labour.dailyCharges.toLocaleString("en-IN")}/day
                            </p>
                          </div>
                        </div>

                        {/* Dates + cost */}
                        <div
                          className="rounded-2xl p-4 space-y-3"
                          style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}30` }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ACCENT_DARK }}>
                            Working Dates
                          </p>
                          {[
                            {
                              label: "Start Date",
                              value: new Date(startDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }),
                            },
                            {
                              label: "End Date",
                              value: new Date(endDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }),
                            },
                            { label: "Estimated Working Days", value: `${workDetails.estimatedDays} day(s)` },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-semibold">{value}</span>
                            </div>
                          ))}
                          <div className="h-px" style={{ background: `${ACCENT}30` }} />
                          <div className="flex justify-between text-base font-bold">
                            <span>Estimated Cost</span>
                            <motion.span key={estimatedCost} style={{ color: ACCENT_DARK }}>
                              ₹{estimatedCost.toLocaleString("en-IN")}
                            </motion.span>
                          </div>
                        </div>

                        {/* Farm location */}
                        <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Farm Location
                          </p>
                          <p className="text-sm">{farmLocation.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {[farmLocation.village, farmLocation.taluka, farmLocation.district, farmLocation.state]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          {farmLocation.landmark && (
                            <p className="text-xs text-muted-foreground">Near: {farmLocation.landmark}</p>
                          )}
                        </div>

                        {/* Work details */}
                        <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Work Details
                          </p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Work Type</span>
                            <span className="font-semibold">{workDetails.workType}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Crop Type</span>
                            <span className="font-semibold">{workDetails.cropType}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Acres</span>
                            <span className="font-semibold">{workDetails.acres}</span>
                          </div>
                          <p className="text-sm text-muted-foreground pt-1 border-t border-border mt-2">
                            {workDetails.description}
                          </p>
                        </div>

                        <div className="flex justify-between gap-3 pt-2">
                          <button
                            onClick={() => setStep("work")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition"
                          >
                            <ArrowLeft className="h-4 w-4" /> Back
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setStep("confirm")}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-card hover:shadow-elevated transition-all"
                            style={{ background: GRADIENT }}
                          >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </StepCard>
                  )}

                  {/* ── Step: Confirmation ──────────────────────────────── */}
                  {!loading && labour && step === "confirm" && (
                    <StepCard step="confirm">
                      <div className="p-6 space-y-6">
                        <div>
                          <h2 className="font-display font-bold text-xl tracking-tight">Select Payment Method & Confirm</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Choose how you wish to pay for this labour request
                          </p>
                        </div>

                        {/* Payment method selection */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Pay Online */}
                          <div
                            onClick={() => setPaymentMethod("online")}
                            className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${
                              paymentMethod === "online"
                                ? "border-primary bg-primary/5 shadow-card"
                                : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CreditCard className="h-4 w-4" />
                              </div>
                              {paymentMethod === "online" && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-sm mt-2">Pay Online</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Razorpay TEST MODE — UPI, Cards, NetBanking
                            </p>
                            <div className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                              Instant Checkout
                            </div>
                          </div>

                          {/* Cash on Delivery */}
                          <div
                            onClick={() => setPaymentMethod("cash")}
                            className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${
                              paymentMethod === "cash"
                                ? "border-primary bg-primary/5 shadow-card"
                                : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                <Banknote className="h-4 w-4" />
                              </div>
                              {paymentMethod === "cash" && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-sm mt-2">Cash Payment</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Pay in cash directly to the labour after work completion
                            </p>
                            <div className="mt-2 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                              Pay After Work
                            </div>
                          </div>
                        </div>

                        <div
                          className="relative overflow-hidden rounded-2xl p-5 space-y-4"
                          style={{ background: `linear-gradient(135deg, ${ACCENT}10, ${ACCENT_DARK}08)`, border: `1px solid ${ACCENT}30` }}
                        >
                          <div
                            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl"
                            style={{ background: ACCENT }}
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: ACCENT, color: "white" }}
                            >
                              <Shield className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-base leading-tight" style={{ color: ACCENT_DARK }}>
                                FarmFleet Verified Request
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {paymentMethod === "online" ? "Online test payment via Razorpay" : "Cash payment after work completion"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {submitError && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl p-4"
                            >
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              {submitError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex justify-between gap-3 pt-2">
                          <button
                            onClick={() => setStep("review")}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition disabled:opacity-50"
                          >
                            <ArrowLeft className="h-4 w-4" /> Back
                          </button>
                          <motion.button
                            whileHover={{ scale: submitting ? 1 : 1.03 }}
                            whileTap={{ scale: submitting ? 1 : 0.97 }}
                            onClick={submitRequest}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-elevated hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: GRADIENT }}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                              </>
                            ) : (
                              <>
                                {paymentMethod === "online" ? "Pay Online & Send Request" : "Send Request"}{" "}
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </StepCard>
                  )}

                  {/* ── Step: Success ───────────────────────────────────── */}
                  {step === "success" && labour && (
                    <StepCard step="success">
                      <div className="flex flex-col items-center text-center px-6 py-14 gap-6">
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="h-24 w-24 rounded-3xl flex items-center justify-center shadow-elevated"
                          style={{ background: GRADIENT }}
                        >
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-xs uppercase tracking-widest font-bold text-primary mb-1">
                            {paymentPaid ? "Payment Verified" : "Request Sent"}
                          </p>
                          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                            {paymentPaid ? "✓ Request & Payment Confirmed!" : "✓ Request Sent Successfully"}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
                            {paymentPaid
                              ? "Your payment via Razorpay TEST MODE was verified successfully. The labour has been notified."
                              : "Your labour request has been sent. Payment will be collected in cash after work completion."}
                          </p>
                        </motion.div>
                        {requestId && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 break-all max-w-xs"
                          >
                            Request ID: {requestId}
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="w-full max-w-sm rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 space-y-2 text-left"
                        >
                          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            Status: <span className="font-semibold text-foreground">{paymentStatusText}</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            The labour will review and respond to your request shortly.
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex flex-col sm:flex-row gap-3 w-full max-w-md flex-wrap justify-center"
                        >
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate({ to: "/renter/bookings" })}
                            className="flex-1 py-3.5 rounded-2xl font-bold text-white shadow-card hover:shadow-elevated transition-all text-sm"
                            style={{ background: GRADIENT }}
                          >
                            View My Requests
                          </motion.button>
                          <button
                            onClick={() => navigate({ to: "/renter/dashboard" })}
                            className="flex-1 py-3.5 rounded-2xl border border-border font-semibold hover:bg-accent transition text-sm"
                          >
                            Back to Dashboard
                          </button>
                          <button
                            onClick={() => navigate({ to: "/renter/labours" })}
                            className="flex-1 py-3.5 rounded-2xl border border-border font-semibold hover:bg-accent transition text-sm"
                          >
                            Find More Labour
                          </button>
                        </motion.div>
                      </div>
                    </StepCard>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sticky sidebar column */}
            {showSidebar && (
              <div>
                {loading || !labour ? (
                  <SidebarSkeleton />
                ) : (
                  <SummarySidebar
                    labour={labour}
                    availabilityStatus={availabilityStatus}
                    estimatedDays={estimatedDaysForCost}
                    estimatedCost={estimatedCost}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}