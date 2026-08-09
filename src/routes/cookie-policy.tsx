import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Cookie } from "lucide-react";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({ meta: [{ title: "Cookie Policy — FarmFleet AI" }] }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Cookie className="h-3.5 w-3.5" />
            Hackathon Cookie & Storage Policy
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Cookie <span className="text-primary">Policy</span>
          </h1>
          <p className="text-xs text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">Client-Side Storage Usage</h2>
            <p>
              FarmFleet AI uses browser `localStorage` to maintain authentication session tokens (e.g., `farmerToken`, `ownerToken`, `labourToken`) and user interface preferences (such as selected language).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">No Advertising Cookies</h2>
            <p>
              The prototype does not employ third-party tracking, profiling, or advertising cookies.
            </p>
          </section>
        </div>

      </div>
    </AppShell>
  );
}
