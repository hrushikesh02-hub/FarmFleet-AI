import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "Frequently Asked Questions — FarmFleet AI" }] }),
  component: FaqPage,
});

const FAQS = [
  {
    q: "What is FarmFleet AI?",
    a: "FarmFleet AI is an AI-powered agricultural technology prototype that enables farmers to rent farm machinery, hire skilled agricultural labour, and receive AI-driven crop guidance.",
  },
  {
    q: "Is FarmFleet AI a commercial platform?",
    a: "No. FarmFleet AI is currently presented as a hackathon prototype developed for evaluation, demonstration, and educational purposes.",
  },
  {
    q: "How does equipment rental work?",
    a: "Farmers browse listed machinery, select booking dates, choose a payment method (Razorpay TEST MODE or Cash on Delivery), and submit a booking request to the equipment owner.",
  },
  {
    q: "How do labour requests work?",
    a: "Farmers view nearby registered labour workers by skill and daily rate, send work requests with specific dates, and track job acceptance and completion status.",
  },
  {
    q: "How does Razorpay payment work in FarmFleet AI?",
    a: "Razorpay is integrated strictly in TEST MODE. You can simulate online payments using Razorpay's test credentials without real financial charges.",
  },
  {
    q: "What is Cash on Delivery (COD)?",
    a: "COD allows farmers to book equipment or labour services and confirm cash payment directly with the provider upon service fulfillment.",
  },
  {
    q: "Can I leave reviews for owners and labour workers?",
    a: "Yes. Once an equipment rental or labour job status is marked as 'completed', the farmer can submit a 5-star rating and review.",
  },
  {
    q: "What AI features are available?",
    a: "FarmFleet AI provides personalized crop calendars, weather insights, field suitability reports, and agronomic recommendations generated via Google Gemini models.",
  },
  {
    q: "Can I completely rely on AI recommendations?",
    a: "AI recommendations are generated for demonstration purposes. Farmers should supplement AI suggestions with local agricultural expert guidance.",
  },
];

function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-10">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <HelpCircle className="h-3.5 w-3.5" />
            Everything You Need to Know
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Find clear answers to common questions about FarmFleet AI equipment, labour, payments, and AI capabilities.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow shadow-sm hover:shadow-md"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-base focus:outline-none"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border/60 bg-muted/30"
                    >
                      <div className="p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </AppShell>
  );
}
