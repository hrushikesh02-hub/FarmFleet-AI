import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CreditCard, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/payment-policy")({
  head: () => ({ meta: [{ title: "Payment Policy — FarmFleet AI" }] }),
  component: PaymentPolicyPage,
});

function PaymentPolicyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CreditCard className="h-3.5 w-3.5" />
            Hackathon Payment Policy
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Payment <span className="text-primary">Policy</span>
          </h1>
          <p className="text-xs text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Supported Prototype Payment Methods</h2>
            
            <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-2">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                1. Razorpay Online Payment (TEST MODE)
              </h3>
              <p className="text-xs">
                Supports simulated UPI, credit card, debit card, and net banking payments using Razorpay's sandbox environment. No real funds are moved.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-2">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                2. Cash on Delivery (COD)
              </h3>
              <p className="text-xs">
                Allows farmers to book equipment or labour services with cash payment settled upon equipment pickup or labour job arrival.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">Payment Workflow</h2>
            <p>
              Renter initiates booking → Chooses Razorpay Test or Cash on Delivery → Order created → Owner/Labour receives booking → Status updates to Paid or Cash Received upon fulfillment.
            </p>
          </section>
        </div>

      </div>
    </AppShell>
  );
}
