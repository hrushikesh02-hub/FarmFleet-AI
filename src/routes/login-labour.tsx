import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import axios from "axios";

import {
  Sprout,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  HardHat,
  Wrench,
  Clock,
  IndianRupee,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/login-labour")({
  component: LabourAuthPage,
});

/* ─── Types ────────────────────────────────────────────────────── */

interface SignInVals {
  email: string;
  password: string;
  remember?: boolean;
}

interface SignUpVals {
  fullName: string;
  mobile: string;
  email: string;
  village: string;
  district: string;
  state: string;
  primarySkill: string;
  experience: string;
  dailyCharges: string;
  password: string;
  confirmPassword: string;
}

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/* ─── Constants ─────────────────────────────────────────────────── */

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const PRIMARY_SKILLS = [
  "Tractor Operator",
  "Harvester Operator",
  "Rotavator Operator",
  "Sprayer Operator",
  "Excavator Operator",
  "Loader Operator",
  "Irrigation Pump Operator",
];

const EXPERIENCE_LEVELS = [
  "Fresher",
  "1–3 Years",
  "3–5 Years",
  "5–10 Years",
  "10+ Years",
];

/* ─── Toast System ──────────────────────────────────────────────── */

let toastIdCounter = 0;

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const icons: Record<ToastType, React.ReactNode> = {
            success: <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />,
            error: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
            info: <Info className="h-4 w-4 text-primary shrink-0" />,
          };
          const borders: Record<ToastType, string> = {
            success: "border-emerald-200",
            error: "border-destructive/30",
            info: "border-primary/30",
          };
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-card shadow-elevated px-4 py-3 min-w-[280px] max-w-sm ${borders[toast.type]}`}
            >
              {icons[toast.type]}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => onRemove(toast.id)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

/* ─── Reusable input wrapper ────────────────────────────────────── */

function InputWrap({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused?: boolean;
}) {
  return (
    <div
      className={`flex items-center rounded-xl border bg-card px-4 transition-all duration-200 ${
        focused
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Password input ────────────────────────────────────────────── */

function PasswordInput({
  id,
  placeholder,
  register: reg,
  error,
}: {
  id: string;
  placeholder: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <InputWrap focused={focused}>
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          {...reg}
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 ml-3 py-3.5 bg-transparent outline-none text-base"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors ml-1"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </InputWrap>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}

/* ─── OTP Modal ─────────────────────────────────────────────────── */

function OtpModal({
  email,
  onVerify,
  onResend,
  onClose,
  otpLoading,
}: {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onClose: () => void;
  otpLoading: boolean;
}) {
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleResend = async () => {
    setResendLoading(true);
    await onResend();
    setResendLoading(false);
    setResendTimer(30);
    setOtp("");
  };

  const otpFocused = document.activeElement === inputRef.current;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-elevated p-6"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>

        {/* Title */}
        <h2 className="font-display text-xl font-bold leading-tight">
          Verify Email Address
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We've sent a 6-digit verification code to:
          <br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>

        {/* OTP Input */}
        <div className="mt-5">
          <label className="text-sm font-medium">Verification Code</label>
          <div className="mt-2">
            <div
              className={`flex items-center justify-center rounded-xl border bg-card px-4 transition-all duration-200 ${
                otpFocused
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full py-4 bg-transparent outline-none text-2xl font-bold tracking-[0.35em] text-center"
              />
            </div>
          </div>
        </div>

        {/* Verify Button */}
        <button
          type="button"
          disabled={otpLoading || otp.length !== 6}
          onClick={() => onVerify(otp)}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-elevated transition-all duration-200 disabled:opacity-50"
        >
          {otpLoading ? "Verifying..." : "Verify OTP"}
          {!otpLoading && <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Resend */}
        <div className="mt-4 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend OTP in{" "}
              <span className="font-semibold text-foreground tabular-nums">{resendTimer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-primary font-semibold hover:underline disabled:opacity-50 transition-colors"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sign In Form ──────────────────────────────────────────────── */

function SignInForm({ onSuccess, addToast }: { onSuccess: () => void; addToast: (type: ToastType, message: string) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInVals>({
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (data: SignInVals) => {
    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/labour/login",
        {
          email: data.email,
          password: data.password,
        }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("labourToken", response.data.token);

        if (response.data.labour) {
          localStorage.setItem(
            "labour",
            JSON.stringify(response.data.labour)
          );
        }

        addToast("success", "Login successful! Redirecting…");
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      addToast("error", error?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleLogin)}
      className="space-y-5"
    >
      {/* Email */}
      <div>
        <label htmlFor="signin-email" className="text-sm font-medium">
          Email Address
        </label>

        <div className="mt-2">
          <InputWrap focused={emailFocused}>
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className="flex-1 ml-3 py-3.5 bg-transparent outline-none text-base"
            />
          </InputWrap>

          {errors.email && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="signin-password"
            className="text-sm font-medium"
          >
            Password
          </label>

          <button
            type="button"
            className="text-xs text-primary font-medium hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <PasswordInput
          id="signin-password"
          placeholder="Enter your password"
          register={register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Minimum 6 characters",
            },
          })}
          error={errors.password?.message}
        />
      </div>

      {/* Remember Me */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          {...register("remember")}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        Remember me for 30 days
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-elevated transition-all duration-200 disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Sign In"}
        <ChevronRight className="h-4 w-4" />
      </button>
    </form>
  );
}

/* ─── Create Account Form ───────────────────────────────────────── */

function CreateAccountForm({ onSuccess, addToast }: { onSuccess: () => void; addToast: (type: ToastType, message: string) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpVals>();

  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [signupData, setSignupData] = useState<SignUpVals | null>(null);

  const [focuses, setFocuses] = useState<Record<string, boolean>>({});
  const focus = (name: string, val: boolean) =>
    setFocuses((prev) => ({ ...prev, [name]: val }));

  const pwd = watch("password");

  const handleSignup = async (data: SignUpVals) => {
    try {
      setLoading(true);
      setSignupData(data);

      await axios.post(
        "http://localhost:5000/api/labour/send-otp",
        { email: data.email }
      );

      setShowOtpModal(true);
      addToast("success", "OTP sent successfully");
    } catch (error: any) {
      console.error(error);
      addToast("error", error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!signupData) return;
    try {
      setOtpLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/labour/verify-otp",
        {
          fullName: signupData.fullName,
          mobile: signupData.mobile,
          email: signupData.email,
          village: signupData.village,
          district: signupData.district,
          state: signupData.state,
          primarySkill: signupData.primarySkill,
          experience: signupData.experience,
          dailyCharges: signupData.dailyCharges,
          password: signupData.password,
          otp,
        }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("labourToken", response.data.token);
        localStorage.setItem("labour", JSON.stringify(response.data.labour));

        addToast("success", "Account created successfully!");
        setShowOtpModal(false);
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      addToast("error", error?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!signupData) return;
    try {
      await axios.post(
        "http://localhost:5000/api/labour/send-otp",
        { email: signupData.email }
      );
      addToast("success", "OTP resent successfully");
    } catch (error: any) {
      console.error(error);
      addToast("error", error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <div className="mt-2">
            <InputWrap focused={focuses.fullName}>
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                {...register("fullName", { required: "Full name is required" })}
                type="text"
                placeholder="Ramesh Kumar"
                onFocus={() => focus("fullName", true)}
                onBlur={() => focus("fullName", false)}
                className="flex-1 ml-3 py-3.5 bg-transparent outline-none text-base"
              />
            </InputWrap>
            {errors.fullName && <p className="text-xs text-destructive mt-1.5">{errors.fullName.message}</p>}
          </div>
        </div>

        {/* Mobile */}
        <div>
          <label className="text-sm font-medium">Mobile Number</label>
          <div className="mt-2">
            <InputWrap focused={focuses.mobile}>
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">+91</span>
              <input
                {...register("mobile", {
                  required: "Mobile number is required",
                  pattern: { value: /^[6-9]\d{9}$/, message: "10-digit Indian mobile only" },
                })}
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                maxLength={10}
                onFocus={() => focus("mobile", true)}
                onBlur={() => focus("mobile", false)}
                className="flex-1 ml-2 py-3.5 bg-transparent outline-none text-base"
              />
            </InputWrap>
            {errors.mobile && <p className="text-xs text-destructive mt-1.5">{errors.mobile.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium">Email Address</label>
          <div className="mt-2">
            <InputWrap focused={focuses.email}>
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                })}
                type="email"
                placeholder="you@example.com"
                onFocus={() => focus("email", true)}
                onBlur={() => focus("email", false)}
                className="flex-1 ml-3 py-3.5 bg-transparent outline-none text-base"
              />
            </InputWrap>
            {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>}
          </div>
        </div>

        {/* Village */}
        <div>
          <label className="text-sm font-medium">Village / Town</label>
          <div className="mt-2">
            <InputWrap focused={focuses.village}>
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                {...register("village", { required: "Village / town is required" })}
                type="text"
                placeholder="Kopargaon"
                onFocus={() => focus("village", true)}
                onBlur={() => focus("village", false)}
                className="flex-1 ml-3 py-3.5 bg-transparent outline-none text-base"
              />
            </InputWrap>
            {errors.village && <p className="text-xs text-destructive mt-1.5">{errors.village.message}</p>}
          </div>
        </div>

        {/* District + State in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">District</label>
            <div className="mt-2">
              <InputWrap focused={focuses.district}>
                <input
                  {...register("district", { required: "Required" })}
                  type="text"
                  placeholder="Ahmednagar"
                  onFocus={() => focus("district", true)}
                  onBlur={() => focus("district", false)}
                  className="flex-1 py-3.5 bg-transparent outline-none text-base w-full"
                />
              </InputWrap>
              {errors.district && <p className="text-xs text-destructive mt-1.5">{errors.district.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">State</label>
            <div className="mt-2">
              <div
                className={`flex items-center rounded-xl border bg-card px-4 transition-all duration-200 ${
                  focuses.state ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <select
                  {...register("state", { required: "Required" })}
                  onFocus={() => focus("state", true)}
                  onBlur={() => focus("state", false)}
                  className="flex-1 py-3.5 bg-transparent outline-none text-base cursor-pointer"
                >
                  <option value="">Select</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {errors.state && <p className="text-xs text-destructive mt-1.5">{errors.state.message}</p>}
            </div>
          </div>
        </div>

        {/* Primary Skill + Years of Experience in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Primary Skill</label>
            <div className="mt-2">
              <div
                className={`flex items-center rounded-xl border bg-card px-4 transition-all duration-200 ${
                  focuses.primarySkill ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
                <select
                  {...register("primarySkill", { required: "Required" })}
                  onFocus={() => focus("primarySkill", true)}
                  onBlur={() => focus("primarySkill", false)}
                  className="flex-1 ml-2 py-3.5 bg-transparent outline-none text-base cursor-pointer"
                >
                  <option value="">Select</option>
                  {PRIMARY_SKILLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {errors.primarySkill && <p className="text-xs text-destructive mt-1.5">{errors.primarySkill.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Years of Experience</label>
            <div className="mt-2">
              <div
                className={`flex items-center rounded-xl border bg-card px-4 transition-all duration-200 ${
                  focuses.experience ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <select
                  {...register("experience", { required: "Required" })}
                  onFocus={() => focus("experience", true)}
                  onBlur={() => focus("experience", false)}
                  className="flex-1 ml-2 py-3.5 bg-transparent outline-none text-base cursor-pointer"
                >
                  <option value="">Select</option>
                  {EXPERIENCE_LEVELS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              {errors.experience && <p className="text-xs text-destructive mt-1.5">{errors.experience.message}</p>}
            </div>
          </div>
        </div>

        {/* Daily Charges */}
        <div>
          <label className="text-sm font-medium">Daily Charges (₹ per day)</label>
          <div className="mt-2">
            <InputWrap focused={focuses.dailyCharges}>
              <IndianRupee className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                {...register("dailyCharges", {
                  required: "Daily charges are required",
                  pattern: { value: /^[0-9]+$/, message: "Enter a valid amount" },
                })}
                type="text"
                inputMode="numeric"
                placeholder="600"
                onFocus={() => focus("dailyCharges", true)}
                onBlur={() => focus("dailyCharges", false)}
                className="flex-1 ml-3 py-3.5 bg-transparent outline-none text-base"
              />
              <span className="ml-2 text-sm text-muted-foreground shrink-0">/ day</span>
            </InputWrap>
            {errors.dailyCharges && <p className="text-xs text-destructive mt-1.5">{errors.dailyCharges.message}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-medium">Password</label>
          <div className="mt-2">
            <PasswordInput
              id="signup-password"
              placeholder="Min. 6 characters"
              register={register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
              error={errors.password?.message}
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium">Confirm Password</label>
          <div className="mt-2">
            <PasswordInput
              id="signup-confirm"
              placeholder="Repeat your password"
              register={register("confirmPassword", {
                required: "Please confirm your password",
                validate: (v: string) => v === pwd || "Passwords do not match",
              })}
              error={errors.confirmPassword?.message}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-elevated transition-all duration-200 mt-2 disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Create Account"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </form>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && signupData && (
          <OtpModal
            email={signupData.email}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onClose={() => setShowOtpModal(false)}
            otpLoading={otpLoading}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Tab Switcher ──────────────────────────────────────────────── */

type Tab = "signin" | "signup";

function TabSwitcher({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="relative flex bg-muted/60 rounded-xl p-1 mt-6">
      <motion.div
        className="absolute inset-y-1 rounded-lg bg-card shadow-sm border border-border/60"
        layoutId="labour-tab-pill"
        style={{ width: "calc(50% - 4px)" }}
        animate={{ x: active === "signin" ? 4 : "calc(100% + 4px)" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      />
      {(["signin", "signup"] as Tab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
            active === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          {tab === "signin" ? "Sign In" : "Create Account"}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function LabourAuthPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("signin");
  const { toasts, addToast, removeToast } = useToast();

  const getRedirectTarget = () => {
    if (typeof window === "undefined") return "/labour/dashboard";
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    return redirect && redirect.startsWith("/") ? redirect : "/labour/dashboard";
  };

  const handleSignIn = () => nav({ to: getRedirectTarget() });
  const handleSignUp = () => nav({ to: getRedirectTarget() });

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Left: fixed hero panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] shrink-0 sticky top-0 h-dvh relative bg-gradient-hero overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-10 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-secondary blur-3xl" />
        </div>

        <div className="relative h-full w-full flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 w-fit">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-lg">FarmFleet</span>
          </Link>

          {/* Hero content */}
          <div>
            {/* Animated HardHat icon (replaces tractor illustration) */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="h-16 w-20 mb-6 flex items-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <HardHat className="h-7 w-7 text-white/90" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="font-display text-4xl font-bold leading-tight"
            >
              Find Farm Work.
              <br />
              Earn Every Season.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-4 text-white/85 max-w-md leading-relaxed"
            >
              Join FarmFleet as a verified agricultural labour or equipment operator. Receive job requests from farmers, manage your work schedule, and grow your income.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {["Verified Farmers", "Flexible Work Schedule", "Secure Payments"].map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium text-white/90 border border-white/20"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                  {feat}
                </span>
              ))}
            </motion.div>
          </div>

          <p className="text-sm text-white/70">Trusted by 10,000+ farmers across India</p>
        </div>
      </div>

      {/* ── Right: scrollable auth panel ──────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-y-auto scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--border)) transparent",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 pt-6 sm:pt-8 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Centered form content */}
        <div className="flex-1 flex items-start justify-center px-6 sm:px-10 py-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {/* Badge */}
            <span className="inline-block px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold">
              Labour
            </span>

            {/* Headline */}
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold leading-tight">
              Welcome, Labour
            </h1>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Sign in to manage your jobs or create an account to start accepting farm work requests.
            </p>

            {/* Tab switcher */}
            <TabSwitcher active={tab} onChange={setTab} />

            {/* Animated form area */}
            <div className="mt-6 relative">
              <AnimatePresence mode="wait" initial={false}>
                {tab === "signin" ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 18 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    <SignInForm onSuccess={handleSignIn} addToast={addToast} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    <CreateAccountForm onSuccess={handleSignUp} addToast={addToast} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer link */}
            <p className="mt-8 text-sm text-center text-muted-foreground">
              {tab === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}