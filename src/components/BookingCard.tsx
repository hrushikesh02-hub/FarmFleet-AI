import { useTranslation } from "react-i18next";
import { Calendar, MapPin, IndianRupee } from "lucide-react";
import type { Booking } from "@/lib/dummy-data";

const statusStyle: Record<Booking["status"], string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  accepted: "bg-success/15 text-success border-success/30",
  upcoming: "bg-info/15 text-info border-info/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

interface Props {
  b: Booking;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function BookingCard({ b, showActions, onAccept, onReject }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-4 flex flex-col sm:flex-row gap-4">
      <img src={b.equipmentImage} alt={b.equipmentName} className="h-32 sm:h-24 sm:w-32 w-full object-cover rounded-xl bg-muted" loading="lazy" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold truncate">{b.equipmentName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{b.renterName}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle[b.status]} capitalize`}>
            {t(`owner.${b.status}`, { defaultValue: b.status })}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {b.date}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {b.location}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><IndianRupee className="h-3.5 w-3.5" /> {b.price.toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{b.slot} · {b.acres} acres</p>
        {showActions && b.status === "pending" && (
          <div className="mt-3 flex gap-2">
            <button onClick={onAccept} className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-soft hover:shadow-elevated transition">
              {t("owner.accept")}
            </button>
            <button onClick={onReject} className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition">
              {t("owner.reject")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
