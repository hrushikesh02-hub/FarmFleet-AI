import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  LayoutDashboard,
  Search,
  Star,
  Calendar,
  Heart,
  User,
  IndianRupee,
  ClipboardList,
  LogOut,
  Tractor,
} from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";

interface NavLink {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OWNER_LINKS: NavLink[] = [
  { to: "/owner/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/owner/equipment", labelKey: "nav.equipment", icon: Tractor },
  { to: "/owner/bookings", labelKey: "nav.bookings", icon: ClipboardList },
  { to: "/owner/review", labelKey: "nav.review", icon: Star },
  { to: "/owner/earnings", labelKey: "nav.earnings", icon: IndianRupee },
  { to: "/owner/profile", labelKey: "nav.profile", icon: User },
];

const RENTER_LINKS: NavLink[] = [
  { to: "/renter/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/renter/search", labelKey: "nav.search", icon: Search },
  { to: "/renter/bookings", labelKey: "nav.bookings", icon: ClipboardList },
  { to: "/renter/profile", labelKey: "nav.profile", icon: User },
];

const LABOUR_LINKS: NavLink[] = [
  { to: "/labour/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/labour/requests", labelKey: "nav.requests", icon: ClipboardList },
  { to: "/labour/reviews", labelKey: "nav.review", icon: Star },
  { to: "/labour/earnings", labelKey: "nav.earnings", icon: IndianRupee },
  { to: "/labour/profile", labelKey: "nav.profile", icon: User },
];

export function Navbar() {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const [open, setOpen] = useState(false);

  const isOwner = pathname.startsWith("/owner");
  const isRenter =
    pathname.startsWith("/renter") || pathname === "/availability";
  const isLabour = pathname.startsWith("/labour");

  const isApp = isOwner || isRenter || isLabour;

  const links = isOwner
    ? OWNER_LINKS
    : isRenter
    ? RENTER_LINKS
    : isLabour
    ? LABOUR_LINKS
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#45B649" />

            <path
              d="M24 30V21"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M24 21C19 21 17 18 17 14C21 14 24 16 24 21Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
            />

            <path
              d="M24 21C29 21 31 18 31 14C27 14 24 16 24 21Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
            />

            <path
              d="M18 33H30"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <span
            style={{
              fontSize: "28px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            <span style={{ color: "#111827" }}>Farm</span>
            <span style={{ color: "#45B649" }}>Fleet</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        {isApp && (
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.to;

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {t(l.labelKey)}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {!isApp && (
            <>
              <Link
                to="/login-renter"
                className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium hover:text-primary transition"
              >
                {t("nav.login")}
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-elevated"
              >
                {t("nav.register")}
              </Link>
            </>
          )}

          {isApp && (
            <button
              aria-label="Menu"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border lg:hidden"
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {open && isApp && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-card lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {links.map((l) => {
                const active = pathname === l.to;

                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <l.icon className="h-5 w-5" />
                    {t(l.labelKey)}
                  </Link>
                );
              })}

              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                {t("nav.logout")}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}