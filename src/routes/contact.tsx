import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { motion } from "framer-motion";
import { Mail, Send, Sparkles, CheckCircle2, MessageSquare } from "lucide-react";

import api from "@/lib/api/api";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us — FarmFleet AI" }] }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/contact", form);
      if (res.data && res.data.success) {
        setSubmitted(true);
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setError(res.data?.message || "Failed to send message. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Unable to send message at this time. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Hackathon Feedback & Support
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Contact <span className="text-primary">FarmFleet AI</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Have questions about the prototype or feedback for our team? Send us a message.
          </p>
        </div>

        {/* Contact Container */}
        <div className="grid md:grid-cols-5 gap-8 bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xl">
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Prototype Information</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                FarmFleet AI is a hackathon demonstration project created for evaluation and testing purposes.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Prototype Contact Email</p>
                  <p className="text-xs">support@farmfleet.ai (Demonstration)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Response Time</p>
                  <p className="text-xs">Monitored during evaluation windows</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/60 border border-border text-xs text-muted-foreground">
              💡 <strong>Note:</strong> No commercial transactions or official corporate entities are active on this demonstration build.
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <h3 className="font-bold text-xl">Thank You for Your Feedback!</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Your demonstration inquiry has been recorded successfully.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-4 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold">
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Hackathon Feedback / General Question"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your inquiry..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" /> {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </AppShell>
  );
}
