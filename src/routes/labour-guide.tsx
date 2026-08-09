import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Users, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/labour-guide")({
  head: () => ({ meta: [{ title: "Labour Guide — FarmFleet AI" }] }),
  component: LabourGuidePage,
});

const LABOUR_WORKFLOW_STEPS = [
  "Register or Log In as a Labour Provider",
  "Set up your profile with primary skill, experience, daily charges, and village location",
  "Toggle your live Availability status (Available, Busy, Offline)",
  "Receive email alerts and view incoming work requests under 'Work Requests'",
  "Accept or Reject requests based on your schedule",
  "View farmer details, work dates, and farm location",
  "Mark job as Completed upon finishing field operations",
  "Track your total earnings and review ratings from farmers",
];

function LabourGuidePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        <div className="text-center space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Labour Provider <span className="text-primary">Guide</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Discover how agricultural workers can register profiles, manage work requests, and track earnings.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Labour Worker Workflow</h2>
              <p className="text-xs text-muted-foreground">How to receive and complete agricultural work requests</p>
            </div>
          </div>

          <div className="space-y-3">
            {LABOUR_WORKFLOW_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm">
                <span className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-medium leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/labour/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition">
            Go to Labour Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
