import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Tractor, User, Sprout } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [role, setRole] = useState<"owner" | "renter" | null>(null);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="flex items-center justify-between p-5">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
        <LanguageSwitcher />
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-soft mb-4">
              <Sprout className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{t("auth.registerTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("auth.registerSubtitle")}</p>
          </div>
          <p className="mt-10 text-sm font-medium text-center mb-4">{t("auth.iAm")}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setRole("owner"); nav({ to: "/login-owner" }); }}
              className={`group rounded-2xl border-2 p-6 text-left transition ${role === "owner" ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"}`}
            >
              <Tractor className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-display font-semibold text-lg">{t("auth.owner")}</h3>
              <p className="text-sm text-muted-foreground mt-1">List your equipment and earn from idle machines.</p>
            </button>
            <button
              onClick={() => { setRole("renter"); nav({ to: "/login-renter" }); }}
              className={`group rounded-2xl border-2 p-6 text-left transition ${role === "renter" ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"}`}
            >
              <User className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-display font-semibold text-lg">{t("auth.renter")}</h3>
              <p className="text-sm text-muted-foreground mt-1">Find the right tractor or tool for your field.</p>
            </button>
          </div>
          <p className="mt-8 text-sm text-center text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link to="/login-renter" className="text-primary font-semibold">{t("auth.loginInstead")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
