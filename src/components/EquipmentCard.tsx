import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Star, CheckCircle2, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { Equipment } from "@/lib/dummy-data";

const avlMap: Record<Equipment["availability"], { color: string; key: string }> = {
  available: { color: "bg-success text-success-foreground", key: "common.available" },
  few: { color: "bg-warning text-warning-foreground", key: "common.fewLeft" },
  busy: { color: "bg-orange-500 text-white", key: "common.busy" },
  full: { color: "bg-destructive text-destructive-foreground", key: "common.fullyBooked" },
};

export function EquipmentCard({ e, index = 0 }: { e: Equipment; index?: number }) {
  const { t } = useTranslation();
  const [fav, setFav] = useState(false);
  const avl = avlMap[e.availability];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="group relative rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition overflow-hidden"
    >
      <Link to="/renter/equipment/$id" params={{ id: e.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={e.image || "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60"}
            alt={e.name}
            loading="lazy"
            onError={(ev) => {
              ev.currentTarget.onerror = null;
              ev.currentTarget.src = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=60";
            }}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
          />
          <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${avl.color}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />
            {t(avl.key)}
          </span>
          <button
            type="button"
            onClick={(ev) => { ev.preventDefault(); setFav((f) => !f); }}
            aria-label="Favorite"
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/95 backdrop-blur flex items-center justify-center hover:scale-110 transition"
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-base truncate">{e.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{e.type}</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {e.rating}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.distanceKm} {t("common.km")}</span>
            <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {e.ownerName.split(" ")[0]}</span>
            {e.ownerVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          </div>
          <div className="flex items-end justify-between pt-1 border-t border-border">
            <div>
              <span className="text-lg font-bold text-foreground">₹{e.pricePerHour}</span>
              <span className="text-xs text-muted-foreground">{t("common.perHour")}</span>
            </div>
            <span className="text-xs font-medium text-primary group-hover:underline">{t("common.bookNow")} →</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
