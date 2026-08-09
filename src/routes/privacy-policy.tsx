import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — FarmFleet AI" }] }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Hackathon Privacy Policy
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-xs text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Introduction & Prototype Status</h2>
            <p>
              This Privacy Policy explains how information is collected, used, and handled by FarmFleet AI. FarmFleet AI is currently presented as a hackathon prototype for demonstration, evaluation, and educational testing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Information We Collect</h2>
            <p>During prototype usage, the application may process user-provided information such as:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, mobile number, village, district, and state.</li>
              <li><strong>Equipment & Listing Data:</strong> Machine descriptions, specifications, daily rental pricing, and photos.</li>
              <li><strong>Labour Information:</strong> Skill sets, experience level, daily charges, and work request status.</li>
              <li><strong>Payment Simulation Data:</strong> Razorpay TEST MODE transaction identifiers and Cash on Delivery choices.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. How Information Is Used</h2>
            <p>
              Information is used exclusively to facilitate simulated equipment bookings, labour requests, email notification alerts, and AI crop plan generation within the prototype framework.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. Third-Party Integrations</h2>
            <p>
              The prototype integrates with third-party demonstration APIs including Razorpay (TEST MODE), Google Gemini AI API, and Nodemailer email transport services. No real financial credit card or bank credentials should be submitted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">5. Data Retention & User Rights</h2>
            <p>
              As a demonstration environment, accounts and stored test data may be reset or deleted periodically. Users may request account deletion through the respective profile dashboard tabs.
            </p>
          </section>
        </div>

      </div>
    </AppShell>
  );
}
