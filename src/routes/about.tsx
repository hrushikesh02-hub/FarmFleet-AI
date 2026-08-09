import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { motion } from "framer-motion";
import { Tractor, Users, Cpu, ShieldCheck, Sparkles, CheckCircle2, CloudSun, CreditCard } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Us — FarmFleet AI" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Hackathon Prototype
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            About <span className="text-primary">FarmFleet AI</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            FarmFleet AI is an AI-powered agricultural technology prototype designed to demonstrate smart access to farm equipment, agricultural labour, and AI-assisted farming insights.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl">
              <Tractor className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">Equipment Rental</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Enables farmers to rent tractors, harvesters, and implements directly from local equipment owners with transparent daily rates and flexible scheduling.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xl">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">Agricultural Labour</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connects farm operators with skilled agricultural workers for sowing, harvesting, and field maintenance with rating systems and direct booking.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">AI-Powered Farming</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Generates personalized crop itineraries, weather forecasts, and field recommendations using Gemini AI models tailored to Indian farming conditions.
            </p>
          </motion.div>
        </div>

        {/* Vision & Problem */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-accent/40 p-8 sm:p-10 space-y-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">The Problem We Address</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Smallholder farmers often lack access to expensive modern machinery and reliable seasonal labour. Meanwhile, equipment owners experience underutilized assets during off-seasons.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  High capital cost of modern agricultural machinery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Seasonal labour scarcity during critical harvest periods
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Lack of accessible, localized agronomic decision tools
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">Our Vision</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To democratize farm mechanization, digitalize labour workflows, and bring generative AI guidance to every farm field across India.
              </p>
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                FarmFleet AI is presented as a hackathon prototype for demonstration, evaluation, and educational testing.
              </div>
            </div>
          </div>
        </div>

        {/* Prototype Capabilities Grid */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-center">Prototype Feature Capabilities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl border border-border bg-card">
              <ShieldCheck className="h-5 w-5 text-emerald-500 mb-2" />
              <p className="font-bold mb-1">Dual Payment Gateway</p>
              <p className="text-muted-foreground text-xs">Supports Razorpay TEST MODE and Cash on Delivery payment options.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <CloudSun className="h-5 w-5 text-blue-500 mb-2" />
              <p className="font-bold mb-1">Live Weather & AI Reports</p>
              <p className="text-muted-foreground text-xs">Real-time weather monitoring combined with Gemini crop plan generation.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <CreditCard className="h-5 w-5 text-purple-500 mb-2" />
              <p className="font-bold mb-1">Multi-Role Authentication</p>
              <p className="text-muted-foreground text-xs">Tailored dashboards for Farmers/Renters, Equipment Owners, and Labour Providers.</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <Sparkles className="h-5 w-5 text-amber-500 mb-2" />
              <p className="font-bold mb-1">Verified Ratings & Reviews</p>
              <p className="text-muted-foreground text-xs">Transparent star ratings for equipment and labour service quality.</p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
