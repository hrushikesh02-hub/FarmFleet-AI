import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sprout,
  MapPin,
  Layers,
  Wallet,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Check,
  Wheat,
  Sparkles,
  AlertCircle,
  Loader2,
  IndianRupee,
  Droplets,
  RefreshCw,
  Pencil,
  Mic,
} from "lucide-react";
import { VoiceFormModal } from "@/components/VoiceFormModal";
import type { ParsedFarmerVoice } from "@/lib/voiceParser";
import { toast } from "sonner";

export const Route = createFileRoute("/renter/ai/generate")({
  head: () => ({ meta: [{ title: "Generate Crop Plan — FarmFleet AI" }] }),
  component: GenerateCropPlan,
});

/* ============================================================================
 * CONFIG — backend URL is read from the environment, never hardcoded here.
 * Falls back to the local API host used elsewhere in development.
 * ==========================================================================
 */

const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ??
  "http://localhost:5000";

/* ============================================================================
 * STATIC OPTIONS
 * ==========================================================================
 */

interface CropOption {
  name: string;
  icon: React.ElementType;
}

// Popular crops first, exactly as specified.
const CROPS: CropOption[] = [
  { name: "Sugarcane", icon: Sprout },
  { name: "Cotton", icon: Sprout },
  { name: "Rice", icon: Wheat },
  { name: "Wheat", icon: Wheat },
  { name: "Maize", icon: Wheat },
  { name: "Soybean", icon: Sprout },
  { name: "Groundnut", icon: Sprout },
  { name: "Tomato", icon: Sprout },
  { name: "Onion", icon: Sprout },
  { name: "Potato", icon: Sprout },
  { name: "Banana", icon: Sprout },
  { name: "Mango", icon: Sprout },
];

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

const SOIL_TYPES = ["Black Soil", "Red Soil", "Alluvial Soil", "Laterite Soil", "Clay Soil", "Sandy Soil"];

const WATER_SOURCES = ["Borewell", "Canal", "River", "Rainfed", "Drip Irrigation", "Sprinkler"];

const MIN_BUDGET = 10000;
const MAX_BUDGET = 2000000;
const BUDGET_STEP = 5000;
const DEFAULT_BUDGET = 100000;

/* ============================================================================
 * VALIDATION SCHEMA
 * The shape mirrors the backend payload field-for-field — do not rename.
 * ==========================================================================
 */

const cropPlanSchema = z.object({
  crop: z.string().min(1, "Please select a crop"),
  state: z.string().min(1, "Please select a state"),
  district: z.string().min(1, "Please enter your district"),
  soilType: z.string().min(1, "Please select a soil type"),
  landArea: z.coerce
    .number()
    .positive("Enter a valid land area, greater than 0 acres")
    .max(10000, "That land area looks too large — please check the value"),
  waterSource: z.string().min(1, "Please select a water source"),
  budget: z.coerce
    .number()
    .min(MIN_BUDGET, `Budget must be at least ₹${MIN_BUDGET.toLocaleString("en-IN")}`)
    .max(MAX_BUDGET, `Budget must be under ₹${MAX_BUDGET.toLocaleString("en-IN")}`),
});

type CropPlanFormValues = z.infer<typeof cropPlanSchema>;

/* ============================================================================
 * BACKEND PAYLOAD — exact field names required by promptBuilder.js / AI service.
 * ==========================================================================
 */

interface CropItineraryPayload {
  crop: string;
  state: string;
  district: string;
  soilType: string;
  landArea: string;
  waterSource: string;
  budget: string;
  language?: string;
  save?: boolean;
}

interface CropItineraryResponse {
  success?: boolean;
  itineraryId?: string;
  _id?: string;
  itinerary?: { _id?: string };
}

async function generateCropItinerary(payload: CropItineraryPayload): Promise<CropItineraryResponse> {
  const { data } = await axios.post<CropItineraryResponse>(
    `${API_BASE_URL}/api/ai/crop-itinerary`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("farmerToken") || localStorage.getItem("token") || ""}`,
      },
    }
  );
  return data;
}

/* ============================================================================
 * STEP CONFIG
 * ==========================================================================
 */

const STEPS = [
  { id: 1, label: "Crop", icon: Sprout, fields: ["crop"] as const },
  { id: 2, label: "Location", icon: MapPin, fields: ["state", "district"] as const },
  { id: 3, label: "Farm Details", icon: Layers, fields: ["soilType", "landArea", "waterSource"] as const },
  { id: 4, label: "Budget", icon: Wallet, fields: ["budget"] as const },
  { id: 5, label: "Review", icon: ClipboardCheck, fields: [] as const },
];

const TOTAL_STEPS = STEPS.length;

/* ============================================================================
 * SMALL HELPERS
 * ==========================================================================
 */

function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ============================================================================
 * FORM FIELD WRAPPER
 * ==========================================================================
 */

function FormField({
  label,
  htmlFor,
  error,
  helper,
  required = true,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      ) : helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

/* ============================================================================
 * NATIVE SELECT (styled) — used for State / Soil Type / Water Source
 * ==========================================================================
 */

function StyledSelect({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ============================================================================
 * SEARCHABLE CROP SELECT
 * ==========================================================================
 */

function CropSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = useMemo(
    () => CROPS.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Search or select a crop"}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search crops..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">No crops found</li>
              )}
              {filtered.map((crop) => {
                const Icon = crop.icon;
                const selected = value === crop.name;
                return (
                  <li key={crop.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(crop.name);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                        selected ? "bg-primary/5 font-semibold text-primary" : "text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                      {crop.name}
                      {selected && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
 * STEP INDICATOR
 * ==========================================================================
 */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const Icon = step.icon;

        return (
          <div key={step.id} className={`flex items-center ${index === STEPS.length - 1 ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.08 : 1,
                }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 sm:h-10 sm:w-10 ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </motion.div>
              <span
                className={`hidden text-[11px] font-semibold sm:block ${
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index !== STEPS.length - 1 && (
              <div className="mx-1.5 h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-3">
                <motion.div
                  initial={false}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  className="h-full bg-primary"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * ERROR CARD
 * ==========================================================================
 */

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
        <AlertCircle className="h-4.5 w-4.5 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Couldn't generate your crop plan</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </motion.div>
  );
}

/* ============================================================================
 * REVIEW SUMMARY CARD
 * ==========================================================================
 */

function SummaryCard({
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ElementType;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <p className="font-display text-sm font-semibold">{title}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all duration-150"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-foreground">{value || "—"}</p>
    </div>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ==========================================================================
 */

function GenerateCropPlan() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const {
    control,
    register,
    trigger,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CropPlanFormValues>({
    resolver: zodResolver(cropPlanSchema) as Resolver<CropPlanFormValues>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      crop: "",
      state: "",
      district: "",
      soilType: "",
      landArea: undefined,
      waterSource: "",
      budget: DEFAULT_BUDGET,
    },
  });

  const values = watch();

  const mutation = useMutation({
    mutationFn: generateCropItinerary,
    onSuccess: (data) => {
      const itineraryId = data.itineraryId ?? data._id ?? data.itinerary?._id ?? "";
      if (data.itinerary) {
        try {
          sessionStorage.setItem("temp_itinerary_" + itineraryId, JSON.stringify(data.itinerary));
        } catch (e) {
          console.warn("Could not cache temporary itinerary in sessionStorage:", e);
        }
      }
      navigate({
        to: "/renter/ai/processing",
        search: { itineraryId },
      });
    },
  });

  const goNext = async () => {
    const fields = STEPS[currentStep - 1].fields as unknown as (keyof CropPlanFormValues)[];
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (valid) setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleVoiceApply = (data: ParsedFarmerVoice) => {
    let filled = 0;
    if (data.crop) {
      const match = CROPS.find((c) => c.name.toLowerCase() === data.crop!.toLowerCase());
      if (match) {
        setValue("crop", match.name, { shouldValidate: true });
        filled++;
      }
    }
    if (data.state) {
      const match = STATES.find((s) => s.toLowerCase() === data.state!.toLowerCase());
      if (match) {
        setValue("state", match, { shouldValidate: true });
        filled++;
      }
    }
    if (data.district) {
      setValue("district", data.district, { shouldValidate: true });
      filled++;
    }
    if (data.soilType) {
      const match = SOIL_TYPES.find((s) => s.toLowerCase() === data.soilType!.toLowerCase());
      if (match) {
        setValue("soilType", match, { shouldValidate: true });
        filled++;
      }
    }
    if (data.waterSource) {
      const match = WATER_SOURCES.find((w) => w.toLowerCase() === data.waterSource!.toLowerCase());
      if (match) {
        setValue("waterSource", match, { shouldValidate: true });
        filled++;
      }
    }
    if (data.landArea && data.landArea > 0) {
      setValue("landArea", data.landArea, { shouldValidate: true });
      filled++;
    }
    if (data.budget && data.budget >= MIN_BUDGET) {
      setValue("budget", data.budget, { shouldValidate: true });
      filled++;
    }
    if (filled > 0) {
      toast.success(`✅ Auto-filled ${filled} field${filled > 1 ? "s" : ""} from voice input!`);
      // Jump to last step that has data, or review step
      setCurrentStep(Math.min(TOTAL_STEPS, 4));
    }
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const onSubmit = (data: CropPlanFormValues) => {
    const payload: CropItineraryPayload = {
      crop: data.crop,
      state: data.state,
      district: data.district,
      soilType: data.soilType,
      landArea: String(data.landArea),
      waterSource: data.waterSource,
      budget: String(data.budget),
      language: i18n.language,
      save: false,
    };
    mutation.mutate(payload);
  };

  const isSubmitting = mutation.isPending;

  return (
      <section className="mx-auto max-w-[1000px] px-4 sm:px-6 py-8 space-y-6">

        {/* ── Breadcrumb ────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Link to="/renter/ai" className="hover:text-primary transition-colors">
            AI Crop Planner
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Generate Crop Plan</span>
        </motion.nav>

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-sm">
                <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
              </span>
              Generate AI Crop Plan
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Provide your farm details and FarmFleet AI will create a personalized crop itinerary using
              AI, weather forecasts and agricultural recommendations.
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setVoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-soft hover:shadow-elevated transition-all cursor-pointer shrink-0"
          >
            <Mic className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Speak with AI Assistant</span>
            <span className="sm:hidden">Voice</span>
          </motion.button>
        </motion.div>

        {/* Voice Assistant Modal */}
        <VoiceFormModal
          isOpen={voiceModalOpen}
          onClose={() => setVoiceModalOpen(false)}
          onApply={handleVoiceApply}
        />

        {/* ── Wizard Card ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-card"
        >
          {/* Step indicator */}
          <div className="mb-8">
            <StepIndicator currentStep={currentStep} />
          </div>

          {/* Submission error */}
          <AnimatePresence>
            {mutation.isError && (
              <div className="mb-6">
                <ErrorCard
                  message={
                    axios.isAxiosError(mutation.error)
                      ? mutation.error.response?.data?.message ??
                        "Something went wrong while generating your plan. Please try again."
                      : "Something went wrong while generating your plan. Please try again."
                  }
                  onRetry={() => {
                    if (mutation.variables) mutation.mutate(mutation.variables);
                  }}
                />
              </div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)}>
            <fieldset disabled={isSubmitting} className="space-y-6">
              <AnimatePresence mode="wait">
                {/* ── STEP 1: CROP ──────────────────────────────── */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <h2 className="font-display text-lg font-bold mb-1">Crop Selection</h2>
                    <p className="text-xs text-muted-foreground mb-5">
                      Choose the crop you're planning to grow this season.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6 items-start">
                      <Controller
                        control={control}
                        name="crop"
                        render={({ field }) => (
                          <FormField label="Crop" htmlFor="crop" error={errors.crop?.message}>
                            <CropSelect value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                          </FormField>
                        )}
                      />

                      <div className="flex h-32 sm:h-full items-center justify-center rounded-2xl border border-dashed border-border bg-light/50">
                        {values.crop ? (
                          (() => {
                            const selected = CROPS.find((c) => c.name === values.crop);
                            const Icon = selected?.icon ?? Sprout;
                            return (
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-sm">
                                  <Icon className="h-7 w-7 text-primary-foreground" />
                                </div>
                                <p className="text-sm font-semibold">{values.crop}</p>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Sprout className="h-8 w-8 opacity-30" />
                            <p className="text-xs">Your crop preview appears here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: LOCATION ──────────────────────────── */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <h2 className="font-display text-lg font-bold mb-1">Location</h2>
                    <p className="text-xs text-muted-foreground mb-5">
                      Tell us where your farm is located.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <Controller
                        control={control}
                        name="state"
                        render={({ field }) => (
                          <FormField label="State" htmlFor="state" error={errors.state?.message}>
                            <StyledSelect
                              id="state"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={STATES}
                              placeholder="Select your state"
                              disabled={isSubmitting}
                            />
                          </FormField>
                        )}
                      />

                      <FormField
                        label="District"
                        htmlFor="district"
                        error={errors.district?.message}
                        helper={
                          !values.state
                            ? "Select your state first"
                            : "District selection will be available soon — please type your district name."
                        }
                      >
                        <input
                          id="district"
                          type="text"
                          placeholder={values.state ? "e.g. Nashik" : "Select a state first"}
                          disabled={isSubmitting || !values.state}
                          {...register("district")}
                          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormField>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: FARM DETAILS ──────────────────────── */}
                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <h2 className="font-display text-lg font-bold mb-1">Farm Details</h2>
                    <p className="text-xs text-muted-foreground mb-5">
                      Help our AI understand your farm's growing conditions.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <Controller
                        control={control}
                        name="soilType"
                        render={({ field }) => (
                          <FormField label="Soil Type" htmlFor="soilType" error={errors.soilType?.message}>
                            <StyledSelect
                              id="soilType"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={SOIL_TYPES}
                              placeholder="Select soil type"
                              disabled={isSubmitting}
                            />
                          </FormField>
                        )}
                      />

                      <FormField
                        label="Land Area"
                        htmlFor="landArea"
                        error={errors.landArea?.message}
                        helper="Enter your land area in acres"
                      >
                        <div className="relative">
                          <input
                            id="landArea"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.1"
                            placeholder="e.g. 2.5"
                            disabled={isSubmitting}
                            {...register("landArea")}
                            className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-16 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                            Acres
                          </span>
                        </div>
                      </FormField>

                      <Controller
                        control={control}
                        name="waterSource"
                        render={({ field }) => (
                          <FormField
                            label="Water Source"
                            htmlFor="waterSource"
                            error={errors.waterSource?.message}
                          >
                            <StyledSelect
                              id="waterSource"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              options={WATER_SOURCES}
                              placeholder="Select water source"
                              disabled={isSubmitting}
                            />
                          </FormField>
                        )}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 4: BUDGET ─────────────────────────────── */}
                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <h2 className="font-display text-lg font-bold mb-1">Budget</h2>
                    <p className="text-xs text-muted-foreground mb-5">
                      Set your estimated budget for this crop cycle, in Indian Rupees.
                    </p>

                    <Controller
                      control={control}
                      name="budget"
                      render={({ field }) => (
                        <FormField label="Estimated Budget" htmlFor="budget" error={errors.budget?.message}>
                          <div className="rounded-2xl border border-border bg-light/50 p-5 sm:p-6">
                            <div className="flex items-center justify-center gap-2 mb-6">
                              <IndianRupee className="h-6 w-6 text-primary" />
                              <span className="font-display text-3xl font-bold text-foreground">
                                {formatINR(field.value || 0).replace("₹", "")}
                              </span>
                            </div>

                            <input
                              id="budget"
                              type="range"
                              min={MIN_BUDGET}
                              max={MAX_BUDGET}
                              step={BUDGET_STEP}
                              value={field.value || DEFAULT_BUDGET}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={isSubmitting}
                              className="w-full accent-primary cursor-pointer disabled:cursor-not-allowed"
                            />

                            <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground font-medium">
                              <span>{formatINR(MIN_BUDGET)}</span>
                              <span>{formatINR(MAX_BUDGET)}</span>
                            </div>

                            <div className="mt-5">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={MIN_BUDGET}
                                max={MAX_BUDGET}
                                step={BUDGET_STEP}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </FormField>
                      )}
                    />
                  </motion.div>
                )}

                {/* ── STEP 5: REVIEW ─────────────────────────────── */}
                {currentStep === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="space-y-4"
                  >
                    <h2 className="font-display text-lg font-bold mb-1">Review Your Details</h2>
                    <p className="text-xs text-muted-foreground mb-5">
                      Confirm everything looks right before generating your AI crop plan.
                    </p>

                    <SummaryCard icon={Sprout} title="Crop" onEdit={() => setCurrentStep(1)}>
                      <SummaryRow label="Selected Crop" value={values.crop} />
                    </SummaryCard>

                    <SummaryCard icon={MapPin} title="Location" onEdit={() => setCurrentStep(2)}>
                      <SummaryRow label="State" value={values.state} />
                      <SummaryRow label="District" value={values.district} />
                    </SummaryCard>

                    <SummaryCard icon={Layers} title="Farm Details" onEdit={() => setCurrentStep(3)}>
                      <SummaryRow label="Soil Type" value={values.soilType} />
                      <SummaryRow
                        label="Land Area"
                        value={values.landArea ? `${values.landArea} Acres` : ""}
                      />
                      <SummaryRow label="Water Source" value={values.waterSource} />
                    </SummaryCard>

                    <SummaryCard icon={Wallet} title="Budget" onEdit={() => setCurrentStep(4)}>
                      <SummaryRow
                        label="Estimated Budget"
                        value={values.budget ? formatINR(values.budget) : ""}
                      />
                    </SummaryCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Navigation ─────────────────────────────────── */}
              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating AI Crop Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate AI Crop Plan
                      </>
                    )}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </motion.div>

        {/* ── Helper footnote ───────────────────────────────────── */}
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Droplets className="h-3.5 w-3.5" />
          Your plan will be refined using live weather forecasts once generated.
        </p>

        <div className="h-4" />
      </section>
  );
}