import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Leaf,
  Sparkles,
  Brain,
  CloudRain,
  Tractor,
  Check,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/renter/ai/processing")({
  validateSearch: (search: Record<string, unknown>): { itineraryId: string } => ({
    itineraryId: typeof search.itineraryId === "string" ? search.itineraryId : "",
  }),
  head: () => ({ meta: [{ title: "Generating Your Crop Plan — FarmFleet AI" }] }),
  component: AIProcessing,
});

/* ============================================================================
 * CONFIG — backend URL is read from the environment, never hardcoded here.
 * ==========================================================================
 */

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ??
  "http://localhost:5000";

const POLL_INTERVAL_MS = 2500;
const STEP_INTERVAL_MS = 550;
const MESSAGE_INTERVAL_MS = 3200;

/* ============================================================================
 * PROCESSING STEPS & REASSURANCE COPY
 * Purely illustrative — this page never shows real cultivation data.
 * ==========================================================================
 */

const PROCESSING_STEPS = [
  "Understanding crop",
  "Analysing soil type",
  "Checking district conditions",
  "Fetching live weather",
  "Selecting suitable seed variety",
  "Planning land preparation",
  "Calculating fertilizer schedule",
  "Calculating irrigation schedule",
  "Estimating labour requirement",
  "Selecting equipment",
  "Estimating cultivation cost",
  "Predicting yield",
  "Calculating expected profit",
  "Creating farming timeline",
  "Preparing PDF",
];

const REASSURANCE_MESSAGES = [
  "We're creating a plan specifically for your farm.",
  "We're using live weather forecasts for better recommendations.",
  "This usually takes less than 10 seconds.",
];

const SATELLITES = [
  { id: "leaf", icon: Leaf, position: "top-0 left-1/2 -translate-x-1/2" },
  { id: "cloud", icon: CloudRain, position: "right-0 top-1/2 -translate-y-1/2" },
  { id: "tractor", icon: Tractor, position: "bottom-0 left-1/2 -translate-x-1/2" },
  { id: "sparkles", icon: Sparkles, position: "left-0 top-1/2 -translate-y-1/2" },
];

/* ============================================================================
 * BACKEND POLLING
 * ==========================================================================
 */

type GenerationStatus = "processing" | "ready" | "failed";

interface AIReportStatusResponse {
  status?: string;
  success?: boolean;
  message?: string;
  itinerary?: { _id?: string; status?: string };
  report?: unknown;
  pdfPath?: string;
}

// Points at the report/status endpoint — adjust the path here if the
// backend exposes generation status under a different route.
async function fetchReportStatus(itineraryId: string): Promise<AIReportStatusResponse> {
  const { data } = await axios.get<AIReportStatusResponse>(
    `${API_BASE_URL}/api/ai/itinerary/${itineraryId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("farmerToken") || localStorage.getItem("token") || ""}`,
      },
    }
  );

  return data;
}

function deriveStatus(data: AIReportStatusResponse | undefined): GenerationStatus {
  if (!data) return "processing";
  const rawStatus = String(data.status ?? data.itinerary?.status ?? "").toLowerCase();
  if (["failed", "error"].includes(rawStatus)) return "failed";
  if (["completed", "ready", "done", "success"].includes(rawStatus)) return "ready";
  if (data.report || data.pdfPath || data.itinerary?._id) return "ready";
  return "processing";
}

/* ============================================================================
 * CENTERED CARD SHELL
 * The parent layout already provides AppShell — this page only renders
 * its own centered card.
 * ==========================================================================
 */

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[700px] rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-card text-center"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ============================================================================
 * AI VISUAL — a pulsing core with four floating satellite icons.
 * Framer Motion only, no Lottie.
 * ==========================================================================
 */

function AIOrb() {
  return (
    <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
      {/* Soft pulsing rings */}
      <motion.span
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-3 rounded-full bg-primary/10"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />

      {/* Core */}
      <motion.div
        className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-elevated"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Brain className="h-8 w-8 text-primary-foreground" />
      </motion.div>

      {/* Satellite icons */}
      {SATELLITES.map((satellite, i) => {
        const Icon = satellite.icon;
        return (
          <motion.div
            key={satellite.id}
            className={`absolute flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card shadow-card ${satellite.position}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { delay: 0.2 + i * 0.15, duration: 0.4 },
              scale: { delay: 0.2 + i * 0.15, duration: 0.4 },
              y: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
            }}
          >
            <Icon className="h-4 w-4 text-primary" />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * STEP ROW
 * ==========================================================================
 */

type StepState = "done" | "active" | "pending";

function StepRow({ label, state }: { label: string; state: StepState }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
        state === "active" ? "bg-primary/5" : ""
      }`}
    >
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
          state === "done"
            ? "border-primary bg-primary text-primary-foreground"
            : state === "active"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground"
        }`}
      >
        {state === "done" ? (
          <Check className="h-3.5 w-3.5" />
        ) : state === "active" ? (
          <motion.span
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
        )}
      </span>
      <span
        className={`text-left text-sm transition-colors duration-300 ${
          state === "done"
            ? "font-medium text-foreground"
            : state === "active"
            ? "font-semibold text-foreground"
            : "font-medium text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ============================================================================
 * ERROR STATE
 * ==========================================================================
 */

function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
        <Link
          to="/renter/ai"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
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

function AIProcessing() {
  const { itineraryId } = Route.useSearch();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  const reportQuery = useQuery({
    queryKey: ["ai-report-status", itineraryId],
    queryFn: () => fetchReportStatus(itineraryId),
    enabled: Boolean(itineraryId),
    refetchInterval: (query) =>
      deriveStatus(query.state.data as AIReportStatusResponse | undefined) === "processing"
        ? POLL_INTERVAL_MS
        : false,
    retry: 1,
  });

  const status: GenerationStatus = itineraryId ? deriveStatus(reportQuery.data) : "failed";
  const hasFailed = status === "failed" || reportQuery.isError;

  // Advance the illustrative step list on its own timer, independent of the
  // real backend timing, and hold on the final step until the plan is ready.
  useEffect(() => {
    if (hasFailed || !itineraryId) return;
    if (stepIndex >= PROCESSING_STEPS.length - 1) return;
    const timer = setTimeout(() => setStepIndex((i) => i + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [stepIndex, hasFailed, itineraryId]);

  // Cross-fade the reassurance message every few seconds.
  useEffect(() => {
    if (hasFailed || !itineraryId) return;
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % REASSURANCE_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasFailed, itineraryId]);

  // Keep the active step scrolled into view within the list.
  useEffect(() => {
    stepRefs.current[stepIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [stepIndex]);

  // Once the backend reports the plan is ready, briefly show 100% and then
  // move the farmer straight to their report — no button required.
  useEffect(() => {
    if (status !== "ready") return;
    const reportId = reportQuery.data?.itinerary?._id || itineraryId;
    const timeout = setTimeout(() => {
      navigate({ to: "/renter/ai/report/$id", params: { id: reportId } });
    }, 700);
    return () => clearTimeout(timeout);
  }, [status, reportQuery.data, itineraryId, navigate]);

  const progress =
    status === "ready" ? 100 : Math.min(((stepIndex + 1) / PROCESSING_STEPS.length) * 96, 96);

  // No id was passed in — nothing to poll for.
  if (!itineraryId) {
    return (
      <CenteredCard>
        <ErrorState
          title="We couldn't find your crop plan request"
          message="This page was opened without a valid request. Please start a new AI crop plan from the dashboard."
        />
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      {hasFailed ? (
        <ErrorState
          title="We couldn't generate your crop plan"
          message={
            axios.isAxiosError(reportQuery.error)
              ? reportQuery.error.response?.data?.message ??
                "Something went wrong while creating your plan. Please try again."
              : "Something went wrong while creating your plan. Please try again."
          }
          onRetry={() => reportQuery.refetch()}
        />
      ) : (
        <>
          <AIOrb />

          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Creating Your Smart Crop Plan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            FarmFleet AI is analysing your farm details and preparing a personalized cultivation
            roadmap.
          </p>

          {/* Progress bar */}
          <div className="mt-7">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs font-semibold text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>

          {/* Processing steps */}
          <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto rounded-xl border border-border/60 bg-light/30 p-2 text-left">
            {PROCESSING_STEPS.map((label, i) => (
              <div key={label} ref={(el) => { stepRefs.current[i] = el; }}>
                <StepRow
                  label={label}
                  state={i < stepIndex ? "done" : i === stepIndex ? "active" : "pending"}
                />
              </div>
            ))}
          </div>

          {/* Reassurance message */}
          <div className="mt-6 flex min-h-[3rem] items-center justify-center rounded-xl bg-light/60 px-4 py-3">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-medium text-primary"
              >
                {REASSURANCE_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </>
      )}
    </CenteredCard>
  );
}