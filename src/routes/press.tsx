import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Newspaper, Sparkles } from "lucide-react";

export const Route = createFileRoute("/press")({
  head: () => ({ meta: [{ title: "Press & Media — FarmFleet AI" }] }),
  component: PressPage,
});

function PressPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Media & News
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Press & <span className="text-primary">Media Overview</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Media resources and prototype presentation overview for FarmFleet AI.
          </p>
        </div>

        {/* Prototype Notice */}
        <div className="p-6 rounded-3xl border border-border bg-card text-center space-y-2">
          <Newspaper className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-bold text-lg">Hackathon Prototype Notice</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            FarmFleet AI is currently a hackathon prototype. There are no official press releases or media publications at this stage.
          </p>
        </div>

        {/* Project Summary Box */}
        <div className="rounded-3xl border border-border bg-muted/40 p-6 sm:p-8 space-y-4">
          <h3 className="font-bold text-xl">Project Fact Sheet</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li><strong>Project Name:</strong> FarmFleet AI</li>
            <li><strong>Category:</strong> Agricultural Technology / Agritech Prototype</li>
            <li><strong>Key Modules:</strong> Equipment Rental, Agricultural Labour, AI Crop Guidance</li>
            <li><strong>Tech Stack:</strong> Node.js, Express, MongoDB, React, Vite, TypeScript, Gemini AI, Razorpay Test Mode</li>
            <li><strong>Target Audience:</strong> Smallholder Farmers, Machinery Owners, Rural Agricultural Workers</li>
          </ul>
        </div>

      </div>
    </AppShell>
  );
}
