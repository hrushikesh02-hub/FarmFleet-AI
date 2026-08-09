import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({ meta: [{ title: "Prototype Disclaimer — FarmFleet AI" }] }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Official Hackathon Prototype Disclaimer
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Prototype <span className="text-primary">Disclaimer</span>
          </h1>
          <p className="text-xs text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Hackathon Demonstration Notice</h2>
            <p>
              FarmFleet AI is an AI-powered agricultural technology prototype created for demonstration, evaluation, and educational testing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Demonstrated Capabilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Farm equipment rental workflow & owner machinery listing</li>
              <li>Agricultural labour discovery & request management</li>
              <li>Google Gemini AI crop planning, weather insights & agronomic reports</li>
              <li>Razorpay TEST MODE payment integration & Cash on Delivery workflows</li>
              <li>Star ratings & user feedback systems</li>
            </ul>
          </section>

          <section className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
            <h3 className="font-bold text-sm">Key Evaluation Notes:</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Some equipment, labour, or user profiles are demonstration test records.</li>
              <li>Razorpay is configured strictly in TEST MODE. No real money is transferred.</li>
              <li>AI-generated recommendations should be supplemented with local agronomic advice.</li>
              <li>Commercial production deployment requires additional security, verification, and legal infrastructure.</li>
            </ul>
          </section>
        </div>

      </div>
    </AppShell>
  );
}
