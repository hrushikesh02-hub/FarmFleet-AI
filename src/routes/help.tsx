import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Search, Tractor, Users, CreditCard, Sparkles, Star, LifeBuoy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Center — FarmFleet AI" }] }),
  component: HelpPage,
});

const HELP_CATEGORIES = [
  {
    title: "Getting Started",
    icon: LifeBuoy,
    color: "text-emerald-600 bg-emerald-500/10",
    description: "Learn how to create an account, log in as a farmer, owner, or labour worker, and set up your profile.",
  },
  {
    title: "Equipment Booking",
    icon: Tractor,
    color: "text-blue-600 bg-blue-500/10",
    description: "Browse nearby tractors, harvesters, and tools. Check dates, submit booking requests, and communicate with owners.",
  },
  {
    title: "Labour Hiring",
    icon: Users,
    color: "text-amber-600 bg-amber-500/10",
    description: "Find skilled farm workers for sowing, weeding, and harvesting. Hire by daily rate and track request acceptance.",
  },
  {
    title: "Payments & COD",
    icon: CreditCard,
    color: "text-purple-600 bg-purple-500/10",
    description: "Understand Razorpay TEST MODE online payments and Cash on Delivery options for equipment and labour.",
  },
  {
    title: "AI Farming Tools",
    icon: Sparkles,
    color: "text-emerald-600 bg-emerald-500/10",
    description: "Generate tailored crop itineraries, weather forecasts, and agronomic field insights using Google Gemini AI.",
  },
  {
    title: "Ratings & Reviews",
    icon: Star,
    color: "text-yellow-600 bg-yellow-500/10",
    description: "Leave star ratings and feedback for completed equipment rentals and labour service jobs.",
  },
];

function HelpPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            How can we <span className="text-primary">help you?</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Search our guides or browse categories to learn more about FarmFleet AI prototype features.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HELP_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className={`h-11 w-11 rounded-xl ${cat.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{cat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links Banner */}
        <div className="rounded-3xl border border-border bg-muted/40 p-8 sm:p-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-xl mb-1">Need Detailed Role Guides?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Read step-by-step walkthroughs for Farmers, Equipment Owners, and Labourers.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/farmer-guide" className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:border-primary/40 transition">
              Farmer Guide
            </Link>
            <Link to="/owner-guide" className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:border-primary/40 transition">
              Owner Guide
            </Link>
            <Link to="/labour-guide" className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:border-primary/40 transition">
              Labour Guide
            </Link>
            <Link to="/ai-guide" className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-soft">
              AI Guide
            </Link>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
