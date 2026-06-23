import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EQUIPMENT } from "@/lib/dummy-data";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/renter/booking/$id")({
  head: () => ({ meta: [{ title: "Book — FarmFleet AI" }] }),
  loader: ({ params }) => {
    const e = EQUIPMENT.find((x) => x.id === params.id);
    if (!e) throw notFound();
    return e;
  },
  component: BookingWizard,
});

const SLOTS = ["Morning (6 AM – 11 AM)", "Afternoon (12 PM – 5 PM)", "Evening (3 PM – 8 PM)"];

function BookingWizard() {
  const { t } = useTranslation();
  const e = Route.useLoaderData();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [acres, setAcres] = useState(2);
  const [field, setField] = useState({ name: "", village: "", notes: "" });
  const total = acres * (e.pricePerAcre ?? e.pricePerHour * 4);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{t("booking.step")} {step} {t("booking.of")} 5</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">{t("booking.title")}</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex-1 h-2 rounded-full bg-border overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: s <= step ? "100%" : "0%" }} transition={{ duration: 0.3 }} className="h-full bg-gradient-primary" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-card min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                {step === 1 && (
                  <>
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />{t("booking.chooseDate")}</h2>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-5 w-full p-4 rounded-xl border border-border text-lg outline-none focus:border-primary" />
                    <div className="mt-4">
                      <label className="text-sm font-medium">Field size (acres): {acres}</label>
                      <input type="range" min={0.5} max={20} step={0.5} value={acres} onChange={(e) => setAcres(+e.target.value)} className="w-full mt-2 accent-primary" />
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />{t("booking.chooseSlot")}</h2>
                    <div className="mt-5 space-y-2">
                      {SLOTS.map((s) => (
                        <button key={s} onClick={() => setSlot(s)} className={`w-full p-4 rounded-xl border-2 text-left transition ${slot === s ? "border-primary bg-accent" : "border-border bg-background hover:border-primary/40"}`}>
                          <p className="font-semibold">{s}</p>
                          <p className="text-xs text-muted-foreground mt-1">Estimated ~{acres * 2}h</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />{t("booking.fieldLocation")}</h2>
                    <div className="mt-5 space-y-4">
                      <Input label={t("booking.fieldName")} value={field.name} onChange={(v) => setField({ ...field, name: v })} placeholder="Survey 142 / behind banyan tree" />
                      <Input label={t("booking.village")} value={field.village} onChange={(v) => setField({ ...field, village: v })} placeholder="Wai" />
                      <Input label={t("booking.notes")} value={field.notes} onChange={(v) => setField({ ...field, notes: v })} placeholder="Optional notes for owner" textarea />
                    </div>
                  </>
                )}
                {step === 4 && (
                  <>
                    <h2 className="font-display text-xl font-bold">{t("booking.review")}</h2>
                    <ReviewRow label={t("booking.equipment")} value={e.name} />
                    <ReviewRow label={t("booking.date")} value={date || "—"} />
                    <ReviewRow label={t("booking.slot")} value={slot || "—"} />
                    <ReviewRow label={t("availability.acres")} value={`${acres} acres`} />
                    <ReviewRow label={t("booking.location")} value={`${field.name || "—"}, ${field.village || "—"}`} />
                    {field.notes && <ReviewRow label={t("booking.notes")} value={field.notes} />}
                  </>
                )}
                {step === 5 && (
                  <div className="text-center py-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="mx-auto h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-elevated">
                      <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                    </motion.div>
                    <h2 className="mt-5 font-display text-2xl font-bold">{t("booking.bookingConfirmed")}</h2>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">{t("booking.bookingConfirmedDesc")}</p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                      <Link to="/renter/bookings" className="px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">{t("booking.viewBooking")}</Link>
                      <Link to="/renter/dashboard" className="px-5 py-3 rounded-xl border border-border font-medium">{t("booking.goHome")}</Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {step < 5 && (
              <div className="mt-8 flex items-center justify-between gap-2">
                <button onClick={back} disabled={step === 1} className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-border disabled:opacity-40">
                  <ArrowLeft className="h-4 w-4" /> {t("common.back")}
                </button>
                <button onClick={next} className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft">
                  {step === 4 ? t("booking.confirmBooking") : t("common.next")} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sticky summary */}
          <aside className="lg:sticky lg:top-24 self-start rounded-3xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display font-semibold">{t("booking.summary")}</h3>
            <img src={e.image} alt="" className="mt-3 aspect-video w-full object-cover rounded-xl bg-muted" />
            <p className="mt-3 font-semibold">{e.name}</p>
            <p className="text-xs text-muted-foreground">{e.ownerVillage}</p>
            <div className="mt-4 space-y-2 text-sm">
              <Row label={t("booking.date")} val={date || "—"} />
              <Row label={t("booking.slot")} val={slot ? slot.split(" ")[0] : "—"} />
              <Row label={t("availability.acres")} val={`${acres}`} />
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="font-medium">{t("booking.total")}</span>
              <span className="font-display text-2xl font-bold text-gradient">₹{total.toLocaleString()}</span>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function Row({ label, val }: { label: string; val: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{val}</span></div>;
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 py-3 border-b border-border flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}
function Input({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full p-3 rounded-xl border border-border bg-background outline-none focus:border-primary" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 rounded-xl border border-border bg-background outline-none focus:border-primary" />
      )}
    </label>
  );
}
