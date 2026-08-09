import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Briefcase, Sparkles } from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({ meta: [{ title: "Careers — FarmFleet AI" }] }),
  component: CareersPage,
});

const POTENTIAL_DOMAINS = [
  { title: "Full-Stack Development", desc: "Building scalable React, Node.js, and MongoDB microservices for agricultural tools." },
  { title: "AI / Machine Learning", desc: "Integrating Gemini LLMs and computer vision for crop health and yield analysis." },
  { title: "Agricultural Data Science", desc: "Processing spatial weather, soil, and machinery utilization metrics." },
  { title: "UX / Rural Design", desc: "Designing intuitive interfaces accessible to regional farmers in local Indian languages." },
];

function CareersPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Hackathon Collaboration
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Careers & <span className="text-primary">Collaboration</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            FarmFleet AI is currently an active hackathon demonstration project.
          </p>
        </div>

        {/* Prototype Notice */}
        <div className="p-6 rounded-3xl border border-border bg-card text-center space-y-2">
          <Briefcase className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-bold text-lg">No Open Commercial Positions</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            There are currently no official job openings associated with this prototype build.
          </p>
        </div>

        {/* Contribution Domains */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-center">Future Innovation Areas</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {POTENTIAL_DOMAINS.map((domain, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-border bg-card space-y-1">
                <h4 className="font-bold text-base">{domain.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{domain.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
