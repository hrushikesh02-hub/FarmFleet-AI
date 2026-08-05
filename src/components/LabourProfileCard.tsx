import { motion } from "framer-motion";
import { Star, MapPin, IndianRupee, BadgeCheck } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LabourProfileData {
  id?: string;
  fullName: string;
  profileImage?: string | null;
  primarySkill: string;
  experience: string | number;
  dailyCharges: number;
  availability: "available" | "busy" | "offline" | string;
  rating: number;
  totalReviews: number;
}

interface LabourProfileCardProps {
  labour: LabourProfileData | null;
  delay?: number;
}

// ─── Availability badge config ─────────────────────────────────────────────

const AVAILABILITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  available: {
    label: "Available",
    bg: "bg-green-500/15",
    text: "text-green-600",
    dot: "bg-green-500",
  },
  busy: {
    label: "Busy",
    bg: "bg-yellow-500/15",
    text: "text-yellow-600",
    dot: "bg-yellow-500",
  },
  offline: {
    label: "Offline",
    bg: "bg-gray-500/15",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
};

function getAvailabilityConfig(availability: string) {
  return (
    AVAILABILITY_CONFIG[availability?.toLowerCase()] ??
    AVAILABILITY_CONFIG.offline
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LabourProfileCard({ labour, delay = 0.35 }: LabourProfileCardProps) {
  const availability = getAvailabilityConfig(labour?.availability ?? "offline");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card h-full flex flex-col"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-3xl"
        style={{ background: "#3b82f6" }}
      />

      {/* Header */}
      <div className="p-5 pb-0 flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "#3b82f620", color: "#3b82f6" }}
        >
          <BadgeCheck className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">Labour Profile</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Your public profile summary
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 pt-4 flex flex-col flex-1">
        {!labour ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Profile unavailable</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                  {labour.profileImage ? (
                    <img
                      src={labour.profileImage}
                      alt={labour.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-display font-semibold text-muted-foreground">
                      {labour.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card ${availability.dot}`}
                />
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sm truncate">
                  {labour.fullName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {labour.primarySkill}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${availability.bg} ${availability.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                {availability.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">Experience</p>
                <p className="font-display font-semibold text-sm mt-0.5">
                  {labour.experience}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  Daily Charges
                </p>
                <p className="font-display font-semibold text-sm mt-0.5">
                  ₹{labour.dailyCharges?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/60 mt-4">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-display font-semibold text-sm">
                  {labour.rating?.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {labour.totalReviews} review{labour.totalReviews === 1 ? "" : "s"}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}