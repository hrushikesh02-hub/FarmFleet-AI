import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Tractor, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/owner-guide")({
  head: () => ({ meta: [{ title: "Owner Guide — FarmFleet AI" }] }),
  component: OwnerGuidePage,
});

const OWNER_STEPS = [
  "Register or Log In as an Equipment Owner",
  "Navigate to 'List Equipment' on the Owner Dashboard",
  "Fill in machine details (Category, Brand, Model, Daily Charges, Location)",
  "Upload clear equipment photos",
  "Receive incoming booking requests with farmer details and dates",
  "Accept or Reject requests based on machine availability",
  "For Cash on Delivery bookings, mark cash payment as received upon pickup/delivery",
  "Build owner reputation through verified renter ratings",
];

function OwnerGuidePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        <div className="text-center space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Equipment Owner <span className="text-primary">Guide</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Monetize your machinery by listing tractors, harvesters, and tools for local farmers on FarmFleet AI.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Machinery Owner Workflow</h2>
              <p className="text-xs text-muted-foreground">How to list equipment and manage rental requests</p>
            </div>
          </div>

          <div className="space-y-3">
            {OWNER_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm">
                <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-medium leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/owner/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition">
            Go to Owner Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
