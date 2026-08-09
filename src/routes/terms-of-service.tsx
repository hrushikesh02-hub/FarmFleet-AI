import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({ meta: [{ title: "Terms of Service — FarmFleet AI" }] }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <FileText className="h-3.5 w-3.5" />
            Hackathon Terms of Service
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Terms of <span className="text-primary">Service</span>
          </h1>
          <p className="text-xs text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using FarmFleet AI, you acknowledge that this software is a hackathon prototype developed for evaluation, demonstration, and testing purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. User Responsibilities</h2>
            <p>Users agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the prototype in good faith for testing equipment rentals, labour hiring, and AI features.</li>
              <li>Refrain from submitting malicious content, fake identities, or offensive reviews.</li>
              <li>Acknowledge that online payments are processed strictly through Razorpay TEST MODE.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. Prototype Limitations & Disclaimers</h2>
            <p>
              FarmFleet AI is provided "AS IS" without commercial warranties. Equipment availability, labour responses, and AI recommendations are subject to prototype test conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. Limitation of Liability</h2>
            <p>
              The creators and developers of FarmFleet AI shall not be liable for any direct or indirect damages resulting from prototype usage or reliance on demonstration information.
            </p>
          </section>
        </div>

      </div>
    </AppShell>
  );
}
