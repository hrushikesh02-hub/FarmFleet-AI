import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

function getProtectedLink(target: string) {
  if (typeof window === "undefined") return target;
  const hasToken = Boolean(
    localStorage.getItem("farmerToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt")
  );
  return hasToken ? target : `/login-renter?redirect=${encodeURIComponent(target)}`;
}

export function Footer() {
  const [homeDest, setHomeDest] = useState("/");

  useEffect(() => {
    if (localStorage.getItem("ownerToken")) setHomeDest("/owner/dashboard");
    else if (localStorage.getItem("labourToken")) setHomeDest("/labour/dashboard");
    else if (localStorage.getItem("renterToken") || localStorage.getItem("token") || localStorage.getItem("farmerToken")) setHomeDest("/renter/dashboard");
  }, []);

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        
        {/* Main Grid */}
        <div className="grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-4">
            <Link to={homeDest} className="inline-flex items-center gap-3 transition-transform hover:scale-[1.02]">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#45B649" />
                <path d="M24 30V21" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M24 21C19 21 17 18 17 14C21 14 24 16 24 21Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
                <path d="M24 21C29 21 31 18 31 14C27 14 24 16 24 21Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
                <path d="M18 33H30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              <span className="text-2xl font-extrabold tracking-tight inline-flex items-center gap-1">
                <span className="text-foreground">Farm</span>
                <span className="text-primary">Fleet</span>
                <span className="ml-1 text-primary font-black">AI</span>
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              AI-powered farming assistance, equipment rental and agricultural labour services for smarter, more accessible farming.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Hackathon Prototype
              </span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to={getProtectedLink("/renter/search")} className="transition hover:text-primary">Find Equipment</Link></li>
              <li><Link to={getProtectedLink("/renter/labours")} className="transition hover:text-primary">Labour Services</Link></li>
              <li><Link to={getProtectedLink("/renter/ai/generate")} className="transition hover:text-primary">AI Farming</Link></li>
              <li><Link to="/faq" className="transition hover:text-primary">How It Works</Link></li>
            </ul>
          </div>

          {/* Farmers */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              Farmers
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to={getProtectedLink("/renter/dashboard")} className="transition hover:text-primary">Renter Dashboard</Link></li>
              <li><Link to={getProtectedLink("/renter/bookings")} className="transition hover:text-primary">My Bookings</Link></li>
              <li><Link to="/farmer-guide" className="transition hover:text-primary">Farmer Guide</Link></li>
              <li><Link to="/help" className="transition hover:text-primary">Help Center</Link></li>
            </ul>
          </div>

          {/* Owners */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              Owners
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/owner/dashboard" className="transition hover:text-primary">Owner Dashboard</Link></li>
              <li><Link to="/owner/equipment" className="transition hover:text-primary">My Equipment</Link></li>
              <li><Link to="/owner/bookings" className="transition hover:text-primary">Rental Requests</Link></li>
              <li><Link to="/owner-guide" className="transition hover:text-primary">Owner Guide</Link></li>
            </ul>
          </div>

          {/* Labourers */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              Labourers
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/labour/dashboard" className="transition hover:text-primary">Labour Dashboard</Link></li>
              <li><Link to="/labour/requests" className="transition hover:text-primary">Work Requests</Link></li>
              <li><Link to="/labour/earnings" className="transition hover:text-primary">My Earnings</Link></li>
              <li><Link to="/labour-guide" className="transition hover:text-primary">Labour Guide</Link></li>
            </ul>
          </div>

          {/* Resources & Company */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="transition hover:text-primary">About FarmFleet AI</Link></li>
              <li><Link to="/ai-guide" className="transition hover:text-primary">AI Guide</Link></li>
              <li><Link to="/careers" className="transition hover:text-primary">Careers</Link></li>
              <li><Link to="/contact" className="transition hover:text-primary">Contact</Link></li>
            </ul>
          </div>

        </div>

        {/* Legal Links Bar */}
        <div className="pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 FarmFleet AI. Hackathon Prototype.</p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy-policy" className="hover:text-primary transition">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-primary transition">Refund Policy</Link>
            <Link to="/payment-policy" className="hover:text-primary transition">Payment Policy</Link>
            <Link to="/cookie-policy" className="hover:text-primary transition">Cookie Policy</Link>
            <Link to="/disclaimer" className="hover:text-primary transition">Prototype Disclaimer</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}