import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Sparkles, CloudSun, Calendar, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/ai-guide")({
  head: () => ({ meta: [{ title: "AI Guide — FarmFleet AI" }] }),
  component: AiGuidePage,
});

function AiGuidePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Google Gemini
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            AI Farming <span className="text-primary">Guide</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Learn how FarmFleet AI utilizes generative AI to create personalized crop plans and weather insights.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">AI Crop Calendar Generator</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Enter your crop type, soil condition, and farm acreage. The AI generates a customized timeline from seed selection to harvesting.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <CloudSun className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Real-Time Weather Insights</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Monitors local rainfall, temperature, and humidity patterns to advise optimal days for spraying, irrigation, and field operations.
            </p>
          </div>
        </div>

        {/* Disclaimer Warning Box */}
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <h4 className="font-bold text-base">Important AI Disclaimer</h4>
            <p className="leading-relaxed">
              AI-generated information is provided for demonstration and educational purposes as part of this hackathon prototype. Recommendations should not be treated as professional agricultural advice. Farmers should verify critical decisions with local agronomic authorities.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/renter/ai/generate" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition">
            Generate AI Crop Plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
