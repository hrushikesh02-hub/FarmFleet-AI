import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid gap-10 md:grid-cols-4">
        
        {/* Brand Section */}
        <div className="md:col-span-2">
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

          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {t("landing.footerTagline")}
          </p>

          <div className="mt-6 flex gap-3">
            {[Facebook, Twitter, Instagram].map((Icon, index) => (
              <a
                key={index}
                href="#"
                aria-label="Social Link"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition hover:bg-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Product Links */}
        <div>
          <h4 className="mb-3 text-sm font-semibold font-display">
            {t("landing.footerProduct")}
          </h4>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                to="/renter/search"
                className="transition hover:text-primary"
              >
                {t("nav.search")}
              </Link>
            </li>

            <li>
              <Link
                to="/availability"
                className="transition hover:text-primary"
              >
                {t("nav.availability")}
              </Link>
            </li>

            <li>
              <Link
                to="/owner/dashboard"
                className="transition hover:text-primary"
              >
                {t("auth.owner")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="mb-3 text-sm font-semibold font-display">
            {t("landing.footerCompany")}
          </h4>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="transition hover:text-primary">
                About
              </a>
            </li>

            <li>
              <a href="#" className="transition hover:text-primary">
                Careers
              </a>
            </li>

            <li>
              <a href="#" className="transition hover:text-primary">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {t("landing.footerCopyright")}
      </div>
    </footer>
  );
}