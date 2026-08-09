import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Tractor, Users, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/farmer-guide")({
  head: () => ({ meta: [{ title: "Farmer Guide — FarmFleet AI" }] }),
  component: FarmerGuidePage,
});

const EQUIPMENT_STEPS = [
  "Create a Farmer Account or Log In",
  "Navigate to 'Find Equipment' or search by category and village location",
  "Open Equipment details to inspect specs, daily rates, and photos",
  "Select start and end booking dates",
  "Choose payment method: Razorpay TEST MODE (Online) or Cash on Delivery",
  "Submit booking request to the equipment owner",
  "Track approval status under 'My Bookings'",
  "Upon rental completion, submit a rating and review",
];

const LABOUR_STEPS = [
  "Navigate to 'Labour Services'",
  "Browse available workers filtered by primary skill and daily charges",
  "Select desired work dates and farm location",
  "Submit labour request",
  "Labour receives email notification and accepts the request",
  "Upon work completion, payment status updates and farmer can leave a review",
];

function FarmerGuidePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        <div className="text-center space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Farmer & Renter <span className="text-primary">Guide</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Learn how to discover machinery, hire skilled farm labour, and manage bookings on FarmFleet AI.
          </p>
        </div>

        {/* Equipment Workflow */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Equipment Booking Workflow</h2>
              <p className="text-xs text-muted-foreground">Step-by-step process for renting farm machinery</p>
            </div>
          </div>

          <div className="space-y-3">
            {EQUIPMENT_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm">
                <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-medium leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Labour Workflow */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Labour Request Workflow</h2>
              <p className="text-xs text-muted-foreground">Step-by-step process for hiring agricultural workers</p>
            </div>
          </div>

          <div className="space-y-3">
            {LABOUR_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm">
                <span className="h-6 w-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-medium leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/renter/search" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition">
            Explore Available Equipment <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
