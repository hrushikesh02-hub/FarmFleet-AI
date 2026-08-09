import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CreditCard, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({ meta: [{ title: "Refund Policy — FarmFleet AI" }] }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CreditCard className="h-3.5 w-3.5" />
            Hackathon Refund & Payment Terms
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Refund <span className="text-primary">Policy</span>
          </h1>
          <p className="text-xs text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Razorpay Test Mode Transactions</h2>
            <p>
              All online payment transactions initiated on FarmFleet AI are executed strictly through Razorpay TEST MODE. No real bank accounts or credit cards are charged. Consequently, test transactions do not involve real currency transfers or monetary refunds.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Cash on Delivery (COD) Bookings</h2>
            <p>
              For Cash on Delivery bookings, payments are settled directly between the renter and the equipment owner or labour provider upon service delivery. Cancellation rules are handled in-person or via request cancellation prior to service execution.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. Commercial Production Notice</h2>
            <p>
              Full commercial refund policies, automated escrow releases, and dispute resolution workflows will be implemented prior to production commercial deployment.
            </p>
          </section>
        </div>

      </div>
    </AppShell>
  );
}
