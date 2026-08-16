import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Star,
  ChevronRight,
  Menu,
  X,
  Leaf,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Globe,
  HardHat,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmFleet AI — India's Smart Farming Platform" },
      {
        name: "description",
        content:
          "Rent verified farm equipment instantly. Tractors, harvesters and machinery — booked in minutes across India.",
      },
    ],
  }),
  component: Landing,
});

/* ─── CONTENT (multilingual translation binder) ─── */
const getContent = (t: (key: string) => string) => ({
  nav: {
    howItWorks: t("landing.nav.howItWorks"),
    equipment: t("landing.nav.equipment"),
    forOwners: t("landing.nav.forOwners"),
    reviews: t("landing.nav.reviews"),
    faq: t("landing.nav.faq"),
    owner: t("landing.nav.owner"),
    renter: t("landing.nav.renter"),
    labour: t("landing.nav.labour"),
    continueAs: t("landing.nav.continueAs"),
  },
  hero: {
    badge: t("landing.hero.badge"),
    headline1: t("landing.hero.headline1"),
    headline2: t("landing.hero.headline2"),
    sub: t("landing.hero.sub"),
    ownerCard: t("landing.hero.ownerCard"),
    ownerSub: t("landing.hero.ownerSub"),
    renterCard: t("landing.hero.renterCard"),
    renterSub: t("landing.hero.renterSub"),
    labourCard: t("landing.hero.labourCard"),
    labourSub: t("landing.hero.labourSub"),
  },
  howItWorks: {
    label: t("landing.howItWorks.label"),
    title: t("landing.howItWorks.title"),
    stepLabel: t("landing.howItWorks.stepLabel"),
    steps: [
      {
        n: "01",
        title: t("landing.howItWorks.step1Title"),
        desc: t("landing.howItWorks.step1Desc"),
      },
      {
        n: "02",
        title: t("landing.howItWorks.step2Title"),
        desc: t("landing.howItWorks.step2Desc"),
      },
      {
        n: "03",
        title: t("landing.howItWorks.step3Title"),
        desc: t("landing.howItWorks.step3Desc"),
      },
    ],
  },
  browse: {
    label: t("landing.browse.label"),
    title: t("landing.browse.title"),
    sub: t("landing.browse.sub"),
    browseCta: t("landing.browse.browseCta"),
    tractor: t("landing.browse.tractor"),
    harvester: t("landing.browse.harvester"),
    seeder: t("landing.browse.seeder"),
    rotavator: t("landing.browse.rotavator"),
    sprayer: t("landing.browse.sprayer"),
  },
  forOwners: {
    label: t("landing.forOwners.label"),
    title: t("landing.forOwners.title"),
    sub: t("landing.forOwners.sub"),
    features: [
      t("landing.forOwners.feature1"),
      t("landing.forOwners.feature2"),
      t("landing.forOwners.feature3"),
      t("landing.forOwners.feature4"),
      t("landing.forOwners.feature5"),
    ],
    cta: t("landing.forOwners.cta"),
  },
  reviews: {
    label: t("landing.reviews.label"),
    title: t("landing.reviews.title"),
    loading: t("landing.reviews.loading"),
    empty: t("landing.reviews.empty"),
  },
  faq: {
    label: t("landing.faq.label"),
    title: t("landing.faq.title"),
    faqs: [
      { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
      { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
      { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
      { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
      { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
    ],
  },
  footer: {
    tagline: t("landing.footer.tagline"),
    platform: t("landing.footer.platform"),
    resources: t("landing.footer.resources"),
    company: t("landing.footer.company"),
    legal: t("landing.footer.legal"),
    copyright: t("landing.footer.copyright"),
    operational: t("landing.footer.operational"),
  },
});

type Content = ReturnType<typeof getContent>;

/* ─── CSS Injection ─── */
function StyleLoader() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --white: #FFFFFF;
        --off-white: #F8FAF7;
        --light-green: #EAF7EE;
        --green-50: #F0FBF2;
        --green-100: #D6F5DC;
        --green-200: #AEEAB9;
        --green-300: #78D68A;
        --green-400: #4DC166;
        --green-500: #2D9C3E;
        --green-600: #248033;
        --green-700: #1F6B2A;
        --green-800: #174F1F;
        --green-900: #123524;
        --accent: #F4B400;
        --accent-light: #FEF3C7;
        --ink: #0D1F10;
        --ink-700: #2A3D2D;
        --ink-500: #4A6350;
        --ink-300: #8AA690;
        --ink-200: #B8CCB9;
        --ink-100: #E2EDE3;
        --radius-sm: 10px;
        --radius-md: 16px;
        --radius-lg: 24px;
        --radius-xl: 32px;
        --shadow-sm: 0 1px 3px rgba(13,31,16,0.06), 0 1px 2px rgba(13,31,16,0.04);
        --shadow-md: 0 4px 16px rgba(13,31,16,0.08), 0 2px 6px rgba(13,31,16,0.04);
        --shadow-lg: 0 12px 40px rgba(13,31,16,0.10), 0 4px 12px rgba(13,31,16,0.06);
        --shadow-xl: 0 24px 64px rgba(13,31,16,0.12), 0 8px 24px rgba(13,31,16,0.08);
        --shadow-green: 0 8px 32px rgba(45,156,62,0.18);
      }
      *, *::before, *::after { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        background: var(--off-white);
        color: var(--ink);
        margin: 0;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
      section { padding: 100px 24px; }
      .sec-inner { max-width: 1200px; margin: 0 auto; }
      .sec-label {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--green-600);
        background: var(--green-50);
        border: 1px solid var(--green-200);
        padding: 5px 14px;
        border-radius: 100px;
        margin-bottom: 20px;
      }
      .sec-title {
        font-size: clamp(2rem, 4vw, 3.2rem);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: -0.025em;
        color: var(--ink);
        margin: 0 0 16px;
      }
      .sec-sub {
        font-size: 17px;
        color: var(--ink-500);
        line-height: 1.65;
        max-width: 520px;
        margin: 0;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 13px 26px;
        background: var(--green-600);
        color: white;
        border-radius: 100px;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: -0.01em;
        cursor: pointer;
        text-decoration: none;
        border: none;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(45,156,62,0.28);
      }
      .btn-primary:hover {
        background: var(--green-700);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(45,156,62,0.36);
      }
      .btn-ghost {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: transparent;
        color: var(--green-700);
        border-radius: 100px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        border: 1.5px solid var(--green-300);
        transition: all 0.2s;
      }
      .btn-ghost:hover {
        background: var(--light-green);
        border-color: var(--green-500);
      }
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes marquee-rev {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
      .marquee-track {
        display: flex;
        gap: 16px;
        animation: marquee 40s linear infinite;
        will-change: transform;
      }
      .marquee-track-rev {
        display: flex;
        gap: 16px;
        animation: marquee-rev 44s linear infinite;
        will-change: transform;
      }
      .marquee-wrap:hover .marquee-track,
      .marquee-wrap:hover .marquee-track-rev {
        animation-play-state: paused;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes float2 {
        0%, 100% { transform: translateY(-6px); }
        50% { transform: translateY(6px); }
      }
      .float { animation: float 4s ease-in-out infinite; }
      .float2 { animation: float2 5s ease-in-out infinite; }
      section[id] { scroll-margin-top: 76px; }

      /* ── Desktop nav links ── */
      .nav-links { display: flex; }
      .nav-desktop-actions { display: flex; }
      .mobile-menu-btn { display: none !important; }

      /* ── How It Works grid ── */
      .hiw-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        position: relative;
      }
      .hiw-connector {
        display: block;
        position: absolute;
        top: 52px;
        left: calc(16.6% + 28px);
        right: calc(16.6% + 28px);
        height: 1px;
        background: linear-gradient(90deg, var(--green-200), var(--green-400), var(--accent));
        opacity: 0.6;
      }

      /* ── Browse grid ── */
      .browse-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 20px;
      }

      /* ── For Owners grid ── */
      .for-owners-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: center;
      }

      /* ── Hero grid ── */
      .hero-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 64px;
        align-items: center;
      }
      .hero-visual {
        display: block;
        position: relative;
        height: 520px;
      }

      /* ── Footer grid ── */
      .footer-grid {
        display: grid;
        grid-template-columns: 2fr repeat(4, 1fr);
        gap: 48px;
        margin-bottom: 60px;
      }

      /* ── Tablet: 768px–1023px ── */
      @media (max-width: 1023px) {
        .nav-links { display: none; }
        .nav-desktop-actions .nav-owner-btn,
        .nav-desktop-actions .nav-renter-btn,
        .nav-desktop-actions .nav-labour-btn { display: none; }
        .mobile-menu-btn { display: flex !important; }

        .hero-grid {
          grid-template-columns: 1fr;
          gap: 40px;
        }
        .hero-visual {
          height: 340px;
        }

        .hiw-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .hiw-connector { display: none; }

        .browse-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .for-owners-grid {
          grid-template-columns: 1fr;
          gap: 48px;
        }

        .footer-grid {
          grid-template-columns: 1fr 1fr;
          gap: 36px;
        }

        section { padding: 72px 24px; }
      }

      /* ── Between tablet sizes: show 2 cols for HIW ── */
      @media (min-width: 768px) and (max-width: 1023px) {
        .hiw-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* ── Mobile: up to 767px ── */
      @media (max-width: 767px) {
        section { padding: 60px 20px; }

        .sec-title { font-size: clamp(1.75rem, 7vw, 2.4rem); }
        .sec-sub { font-size: 15px; }

        .hiw-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .hiw-connector { display: none; }

        .browse-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .for-owners-grid {
          grid-template-columns: 1fr;
          gap: 40px;
        }

        .hero-grid {
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .hero-visual {
          height: 260px;
        }

        .footer-grid {
          grid-template-columns: 1fr;
          gap: 32px;
        }

        .nav-links { display: none; }
        .nav-desktop-actions .nav-owner-btn,
        .nav-desktop-actions .nav-renter-btn,
        .nav-desktop-actions .nav-labour-btn { display: none; }
        .mobile-menu-btn { display: flex !important; }
      }

      /* ── Very small: single col browse on tiny screens ── */
      @media (max-width: 400px) {
        .browse-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .marquee-track, .marquee-track-rev { animation: none; }
        .float, .float2 { animation: none; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return null;
}

/* ─── DATA ─── */
const CATEGORIES = [
  {
    label: "Tractor",
    image: "https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?q=80&w=1073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Harvester",
    image: "https://images.unsplash.com/photo-1565647952915-9644fcd446a4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Seeder",
    image: "https://images.unsplash.com/photo-1707680946878-d02775437174?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Rotavator",
    image: "https://plus.unsplash.com/premium_photo-1664301163726-78773dc77bfd?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    label: "Sprayer",
    image: "https://images.unsplash.com/photo-1690986375486-460dc48dd499?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const REVIEWS_ROW1 = [
  {
    name: "Rajesh Patil",
    role: "Sugarcane Farmer · Sangamner",
    text: "Booked a harvester in under ten minutes. Arrived on time, worked flawlessly. FarmFleet has changed how I plan every season.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=11",
  },
  {
    name: "Sunita Deshpande",
    role: "Equipment Owner · Latur",
    text: "Listing took five minutes. Within a week I had multiple confirmed bookings. The platform gives me complete control over my schedule.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=44",
  },
  {
    name: "Kiran Kulkarni",
    role: "Onion Farmer · Nashik",
    text: "Transparent pricing, verified machines. I compared three listings, picked the best one, and confirmed in minutes. No phone calls needed.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=52",
  },
  {
    name: "Vikram Shinde",
    role: "Wheat Farmer · Pune",
    text: "The calendar feature let me plan equipment for the entire season in advance. No last-minute scrambles. Completely stress-free.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=33",
  },
  {
    name: "Anita More",
    role: "Soybean Farmer · Aurangabad",
    text: "I was sceptical at first. After my first booking, I told ten other farmers in my village. Every one of them is now on FarmFleet.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=47",
  },
];

const REVIEWS_ROW2 = [
  {
    name: "Suresh Jadhav",
    role: "Tractor Owner · Solapur",
    text: "My tractor used to sit idle for six months. Now it earns during the off-season. The booking dashboard is incredibly easy to use.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=15",
  },
  {
    name: "Priya Kamble",
    role: "Cotton Farmer · Akola",
    text: "The support team responded in Marathi. That level of care for regional farmers tells you everything about this platform.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=56",
  },
  {
    name: "Mahesh Bhosale",
    role: "Rice Farmer · Kolhapur",
    text: "Equipment condition was exactly as described. Photos, service log, owner ratings — every detail was accurate. I trust FarmFleet.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=22",
  },
  {
    name: "Rekha Nawale",
    role: "Vegetable Grower · Satara",
    text: "Searched, compared, booked and received confirmation — all within fifteen minutes. This is how farm services should work.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=60",
  },
  {
    name: "Dilip Gaikwad",
    role: "Equipment Owner · Nanded",
    text: "I set my own pricing and availability. FarmFleet handles everything else. It genuinely feels like a professional business partnership.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=37",
  },
];

const FAQS = [
  {
    q: "How do I know the equipment is in good condition?",
    a: "Every piece of equipment on FarmFleet is verified before listing. Each machine has a service log, condition photos, and a verified owner profile with ratings from previous renters.",
  },
  {
    q: "What happens if an owner cancels my confirmed booking?",
    a: "You receive a full refund immediately, plus a booking credit for your next rental. Our team will also assist you in finding an alternate machine nearby.",
  },
  {
    q: "How does payment work?",
    a: "Pay securely via UPI, card, or net banking. Funds are held by FarmFleet and released to the owner only after you confirm the equipment arrived in good condition.",
  },
  {
    q: "Can I list my own equipment for rental?",
    a: "Yes. Listing is free and takes under five minutes. After verification, your equipment goes live. You control pricing, availability, and which requests to accept.",
  },
  {
    q: "Is there a minimum rental period?",
    a: "Most equipment is available for daily rental. Some owners set a minimum of two or three days. You will see the minimum period clearly on each listing before booking.",
  },
];

/* ─── LANGUAGE SWITCHER (dummy UI only — no translation logic) ─── */
function LangSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<"en" | "hi" | "mr">("en");
  const opts: { code: "en" | "hi" | "mr"; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "hi", label: "हि" },
    { code: "mr", label: "म" },
  ];
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 100,
          border: "1.5px solid var(--ink-100)",
          background: "white",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ink-700)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <Globe size={13} />
        {opts.find((o) => o.code === selected)?.label}
        <ChevronDown size={12} style={{ opacity: 0.5 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "white",
              border: "1px solid var(--ink-100)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              minWidth: 120,
              zIndex: 200,
            }}
          >
            {[
              { code: "en" as const, label: "English" },
              { code: "hi" as const, label: "हिन्दी" },
              { code: "mr" as const, label: "मराठी" },
            ].map((o) => (
              <button
                key={o.code}
                onClick={() => { setSelected(o.code); setOpen(false); }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: selected === o.code ? "var(--light-green)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: selected === o.code ? 600 : 400,
                  color: selected === o.code ? "var(--green-700)" : "var(--ink-700)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (selected !== o.code) e.currentTarget.style.background = "var(--off-white)"; }}
                onMouseLeave={(e) => { if (selected !== o.code) e.currentTarget.style.background = "transparent"; }}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── NAVBAR ─── */
function Navbar({ t }: { t: Content }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileRoleOpen, setMobileRoleOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const roleOptions = [
    { label: t.nav.owner, path: "/login-owner" },
    { label: t.nav.renter, path: "/login-renter" },
    { label: t.nav.labour, path: "/login-labour" },
  ];

  const navLinks = [
    { label: t.nav.howItWorks, id: "how-it-works" },
    { label: t.nav.equipment, id: "browse" },
    { label: t.nav.forOwners, id: "for-owners" },
    { label: t.nav.reviews, id: "reviews" },
    { label: t.nav.faq, id: "faq" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 24px",
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(13,31,16,0.07)"
            : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 20px rgba(13,31,16,0.06)" : "none",
          transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
              <circle cx="21" cy="21" r="21" fill="#39B54A" />
              <path d="M21 26V18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M21 18C17 18 15 15.5 15 12.5C18.5 12.5 21 14.5 21 18Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
              <path d="M21 18C25 18 27 15.5 27 12.5C23.5 12.5 21 14.5 21 18Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
              <path d="M16 29H26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, letterSpacing: "-0.04em", color: "#111827" }}>
              Farm<span style={{ color: "#39B54A" }}>Fleet</span>
              <span style={{ color: "#39B54A", marginLeft: 6 }}>AI</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="nav-links" style={{ alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  padding: "7px 14px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ink-500)",
                  background: "none",
                  border: "none",
                  borderRadius: 100,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.background = "var(--off-white)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--ink-500)";
                  e.currentTarget.style.background = "none";
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="nav-desktop-actions" style={{ alignItems: "center", gap: 10, flexShrink: 0 }}>
            <LanguageSwitcher variant="compact" />
            <div ref={roleMenuRef} className="nav-role-menu" style={{ position: "relative" }}>
              <button
                className="btn-primary nav-role-btn"
                onClick={() => setRoleMenuOpen((o) => !o)}
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {t.nav.continueAs}
                <ChevronDown
                  size={15}
                  style={{
                    transform: roleMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </button>
              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      minWidth: 200,
                      background: "white",
                      borderRadius: 14,
                      border: "1px solid var(--ink-100)",
                      boxShadow: "0 12px 32px rgba(13,31,16,0.12)",
                      padding: 6,
                      zIndex: 150,
                    }}
                  >
                    {roleOptions.map((opt) => (
                      <Link
                        key={opt.path}
                        to={opt.path}
                        onClick={() => setRoleMenuOpen(false)}
                        style={{
                          display: "block",
                          padding: "10px 14px",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ink-700)",
                          textDecoration: "none",
                          transition: "background 0.15s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--off-white)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, alignItems: "center", justifyContent: "center" }}
            >
              <Menu size={22} color="var(--ink)" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(13,31,16,0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: "80%",
                maxWidth: 340,
                background: "white",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <span style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>Farm<span style={{ color: "#39B54A" }}>Fleet</span> <span style={{ color: "#39B54A", marginLeft: 4 }}>AI</span></span>
                <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={22} color="var(--ink-500)" />
                </button>
              </div>
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{
                    padding: "13px 16px",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--ink-700)",
                    background: "none",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                >
                  {item.label}
                </button>
              ))}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 16 }}>
                <LanguageSwitcher variant="compact" />
                <button
                  className="btn-primary"
                  onClick={() => setMobileRoleOpen((o) => !o)}
                  style={{
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                  }}
                >
                  {t.nav.continueAs}
                  <ChevronDown
                    size={15}
                    style={{
                      transform: mobileRoleOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {mobileRoleOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {roleOptions.map((opt) => (
                        <Link
                          key={opt.path}
                          to={opt.path}
                          className="btn-ghost"
                          onClick={() => {
                            setMobileRoleOpen(false);
                            setMobileOpen(false);
                          }}
                          style={{ justifyContent: "center" }}
                        >
                          {opt.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── HERO ─── */
function Hero({ t }: { t: Content }) {
  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        paddingTop: 72,
        background: "var(--white)",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle green grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(45,156,62,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,156,62,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        }}
      />
      {/* Green glow top-right */}
      <div style={{
        position: "absolute",
        top: -120,
        right: -80,
        width: 640,
        height: 640,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,156,62,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="sec-inner" style={{ position: "relative", padding: "80px 24px 60px", width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <div className="hero-grid">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sec-label"
              style={{ marginBottom: 28 }}
            >
              <Leaf size={11} />
              {t.hero.badge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                margin: "0 0 20px",
              }}
            >
              {t.hero.headline1}
              <br />
              <span style={{
                background: "linear-gradient(135deg, var(--green-600) 0%, var(--green-400) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {t.hero.headline2}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="sec-sub"
              style={{ marginBottom: 44 }}
            >
              {t.hero.sub}
            </motion.p>

            {/* CTA Cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
              style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}
            >
              {/* Owner card */}
              <Link to="/login-owner" style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(13,31,16,0.13)" }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    borderRadius: 18,
                    border: "1.5px solid var(--green-200)",
                    background: "var(--green-50)",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--green-400)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--green-200)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--green-700)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Settings size={20} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                        {t.hero.ownerCard}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>
                        {t.hero.ownerSub}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} color="var(--green-600)" style={{ flexShrink: 0 }} />
                </motion.div>
              </Link>

              {/* Renter card */}
              <Link to="/login-renter" style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(45,156,62,0.18)" }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    borderRadius: 18,
                    border: "1.5px solid var(--green-500)",
                    background: "var(--green-700)",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-green)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Search size={20} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
                        {t.hero.renterCard}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                        {t.hero.renterSub}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />
                </motion.div>
              </Link>

              {/* Labour card */}
              <Link to="/login-labour" style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(13,31,16,0.13)" }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    borderRadius: 18,
                    border: "1.5px solid var(--green-200)",
                    background: "var(--green-50)",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--green-400)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--green-200)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <HardHat size={20} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                        {t.hero.labourCard}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>
                        {t.hero.labourSub}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} color="var(--green-600)" style={{ flexShrink: 0 }} />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT — visual composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hero-visual"
          >
            {/* Main image */}
            <div style={{
              position: "absolute",
              top: 40,
              left: 32,
              right: 0,
              bottom: 0,
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: "var(--shadow-xl)",
            }}>
              <img
                src="https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80"
                alt="Farmer"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 40%, rgba(18,53,36,0.4) 100%)",
              }} />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks({ t }: { t: Content }) {
  const icons = [Search, Calendar, CheckCircle2];
  return (
    <section id="how-it-works" style={{ background: "var(--off-white)" }}>
      <div className="sec-inner">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <div className="sec-label" style={{ margin: "0 auto 20px" }}>
            {t.howItWorks.label}
          </div>
          <h2 className="sec-title">{t.howItWorks.title}</h2>
        </motion.div>

        <div className="hiw-grid">
          {/* connector — only visible on desktop via CSS */}
          <div className="hiw-connector" />

          {t.howItWorks.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                style={{
                  background: "white",
                  borderRadius: 24,
                  padding: "40px 32px",
                  boxShadow: "var(--shadow-md)",
                  border: "1px solid var(--ink-100)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* large step number background */}
                <div style={{
                  position: "absolute",
                  top: -12,
                  right: -8,
                  fontSize: 100,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "var(--green-100)",
                  letterSpacing: "-0.05em",
                  userSelect: "none",
                  pointerEvents: "none",
                }}>
                  {step.n}
                </div>

                <div style={{
                  width: 52, height: 52,
                  borderRadius: 14,
                  background: i === 2 ? "var(--green-700)" : "var(--light-green)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 24,
                  boxShadow: i === 2 ? "var(--shadow-green)" : "none",
                }}>
                  <Icon size={22} color={i === 2 ? "white" : "var(--green-600)"} />
                </div>

                <div style={{
                  display: "inline-block",
                  background: "var(--green-50)",
                  color: "var(--green-700)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "3px 10px",
                  borderRadius: 100,
                  marginBottom: 12,
                  border: "1px solid var(--green-200)",
                }}>
                  STEP {step.n}
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 10, letterSpacing: "-0.015em" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── BROWSE BY TYPE ─── */
function Browse({ t }: { t: Content }) {
  const categories = [
    { label: t.browse.tractor, image: CATEGORIES[0].image },
    { label: t.browse.harvester, image: CATEGORIES[1].image },
    { label: t.browse.seeder, image: CATEGORIES[2].image },
    { label: t.browse.rotavator, image: CATEGORIES[3].image },
    { label: t.browse.sprayer, image: CATEGORIES[4].image },
  ];

  return (
    <section id="browse" style={{ background: "white" }}>
      <div className="sec-inner">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div className="sec-label" style={{ margin: "0 auto 20px" }}>
            {t.browse.label}
          </div>
          <h2 className="sec-title">{t.browse.title}</h2>
          <p className="sec-sub" style={{ margin: "0 auto" }}>{t.browse.sub}</p>
        </motion.div>

        <div className="browse-grid">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <Link
                to="/login-renter"
                style={{
                  textDecoration: "none",
                }}
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "var(--shadow-md)",
                    cursor: "pointer",
                    position: "relative",
                    aspectRatio: "3/4",
                  }}
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                      display: "block",
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(18,53,36,0.85) 0%, rgba(18,53,36,0.1) 55%, transparent 100%)",
                  }} />
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 16px",
                  }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "white",
                      letterSpacing: "-0.01em",
                    }}>
                      {cat.label}
                    </div>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "var(--green-300)",
                      fontWeight: 600,
                      marginTop: 4,
                    }}>
                      {t.browse.browseCta} <ArrowRight size={10} />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FOR OWNERS ─── */
function ForOwners({ t }: { t: Content }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Listings", "Requests", "Calendar"];

  const mockListings = [
    { name: "Mahindra 575 DI", type: "Tractor", status: "Active", requests: 3 },
    { name: "Fieldking Rotavator", type: "Rotavator", status: "Active", requests: 1 },
    { name: "Precision Seeder", type: "Seeder", status: "Inactive", requests: 0 },
  ];

  return (
    <section id="for-owners" style={{ background: "var(--off-white)" }}>
      <div className="sec-inner">
        <div className="for-owners-grid">

          {/* LEFT — Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              background: "white",
              borderRadius: 24,
              border: "1px solid var(--ink-100)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
            }}>
              {/* Title bar */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--ink-100)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div style={{
                  flex: 1,
                  background: "var(--off-white)",
                  borderRadius: 6,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "var(--ink-300)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                  farmfleet.in/owner/dashboard
                </div>
              </div>

              {/* Dashboard content */}
              <div style={{ padding: 20 }}>
                {/* Tab bar */}
                <div style={{
                  display: "flex",
                  gap: 4,
                  marginBottom: 20,
                  background: "var(--off-white)",
                  borderRadius: 10,
                  padding: 4,
                }}>
                  {tabs.map((tab, i) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(i)}
                      style={{
                        flex: 1,
                        padding: "7px 12px",
                        borderRadius: 7,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: activeTab === i ? "white" : "transparent",
                        color: activeTab === i ? "var(--ink)" : "var(--ink-300)",
                        boxShadow: activeTab === i ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Listings */}
                {activeTab === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {mockListings.map((item, i) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid var(--ink-100)",
                          background: "var(--off-white)",
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-300)" }}>{item.type}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {item.requests > 0 && (
                            <div style={{
                              padding: "3px 8px",
                              borderRadius: 100,
                              background: "var(--accent-light)",
                              color: "#92400e",
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}>
                              {item.requests} req
                            </div>
                          )}
                          <div style={{
                            padding: "3px 9px",
                            borderRadius: 100,
                            background: item.status === "Active" ? "var(--green-50)" : "var(--off-white)",
                            color: item.status === "Active" ? "var(--green-700)" : "var(--ink-300)",
                            fontSize: 11,
                            fontWeight: 600,
                            border: `1px solid ${item.status === "Active" ? "var(--green-200)" : "var(--ink-100)"}`,
                            whiteSpace: "nowrap",
                          }}>
                            {item.status}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div style={{
                      padding: "11px 14px",
                      borderRadius: 12,
                      border: "1.5px dashed var(--green-200)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--green-600)",
                      cursor: "pointer",
                    }}>
                      + Add new equipment
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { farmer: "Rajesh P.", equip: "Mahindra 575", dates: "Dec 12–14", status: "Pending" },
                      { farmer: "Sunita D.", equip: "Rotavator", dates: "Dec 18–20", status: "Confirmed" },
                    ].map((req, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 12,
                          border: "1px solid var(--ink-100)",
                          background: "var(--off-white)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{req.farmer}</div>
                          <div style={{
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: req.status === "Confirmed" ? "var(--green-50)" : "var(--accent-light)",
                            color: req.status === "Confirmed" ? "var(--green-700)" : "#92400e",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {req.status}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{req.equip} · {req.dates}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {activeTab === 2 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                      <div key={idx} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--ink-300)", paddingBottom: 4 }}>{d}</div>
                    ))}
                    {Array.from({ length: 28 }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          aspectRatio: "1",
                          borderRadius: 6,
                          background: [3, 4, 10, 11, 17].includes(i) ? "var(--green-600)" : [6, 7, 13, 14, 20, 21, 27].includes(i) ? "var(--off-white)" : "var(--green-50)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 600,
                          color: [3, 4, 10, 11, 17].includes(i) ? "white" : "var(--ink-500)",
                        }}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="sec-label">{t.forOwners.label}</div>
            <h2 className="sec-title">{t.forOwners.title}</h2>
            <p className="sec-sub" style={{ marginBottom: 36 }}>{t.forOwners.sub}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {t.forOwners.features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--green-50)",
                    border: "1.5px solid var(--green-300)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CheckCircle2 size={12} color="var(--green-600)" />
                  </div>
                  <span style={{ fontSize: 15, color: "var(--ink-700)", fontWeight: 500 }}>{feat}</span>
                </motion.div>
              ))}
            </div>

            <Link to="/login-owner" className="btn-primary" style={{ gap: 10 }}>
              {t.forOwners.cta} <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── REVIEWS ─── */
interface Review {
  id: string;
  name: string;
  avatar?: string;
  equipment: string;
  rating: number;
  text: string;
  date: string;
}

function AvatarFallback({ name }: { name: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "var(--green-600)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function Reviews({ t }: { t: Content }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    fetch(`${API_BASE}/api/reviews/public`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list: Review[] = Array.isArray(data) ? data : (data?.reviews ?? []);
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const half = Math.ceil(reviews.length / 2);
  const row1 = reviews.slice(0, half);
  const row2 = reviews.slice(half);
  const rows = [
    [...row1, ...row1],
    [...row2, ...row2],
  ];

  return (
    <section
      id="reviews"
      style={{ background: "white", overflow: "hidden", paddingLeft: 0, paddingRight: 0 }}
    >
      <div style={{ textAlign: "center", marginBottom: 56, padding: "0 24px" }}>
        <div className="sec-label" style={{ margin: "0 auto 20px" }}>
          {t.reviews.label}
        </div>
        <h2 className="sec-title">{t.reviews.title}</h2>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            padding: "48px 24px",
            color: "var(--ink-300)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ animation: "spin 0.9s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ fontSize: 14 }}>{t.reviews.loading}</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "56px 24px",
            color: "var(--ink-300)",
            fontSize: 15,
          }}
        >
          {t.reviews.empty}
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div
          className="marquee-wrap"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {rows.map((row, ri) =>
            row.length === 0 ? null : (
              <div key={ri} style={{ overflow: "hidden" }}>
                <div className={ri === 0 ? "marquee-track" : "marquee-track-rev"}>
                  {row.map((review, i) => (
                    <div
                      key={`${review.id}-${i}`}
                      style={{
                        flexShrink: 0,
                        width: 300,
                        background: ri === 0 ? "var(--off-white)" : "white",
                        borderRadius: 20,
                        padding: "24px 24px",
                        border: "1px solid var(--ink-100)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            style={{
                              fill: s <= review.rating ? "var(--accent)" : "var(--ink-200)",
                              color: s <= review.rating ? "var(--accent)" : "var(--ink-200)",
                            }}
                          />
                        ))}
                      </div>

                      <p
                        style={{
                          fontSize: 14,
                          color: "var(--ink-700)",
                          lineHeight: 1.65,
                          margin: "0 0 16px",
                          fontStyle: "italic",
                        }}
                      >
                        "{review.text}"
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {review.avatar ? (
                          <img
                            src={review.avatar}
                            alt={review.name}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "var(--green-600)",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {review.name?.trim()?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                            {review.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-300)" }}>
                            {review.equipment}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ({ t }: { t: Content }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ background: "var(--off-white)" }}>
      <div className="sec-inner" style={{ maxWidth: 780 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div className="sec-label" style={{ margin: "0 auto 20px" }}>{t.faq.label}</div>
          <h2 className="sec-title">{t.faq.title}</h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {t.faq.faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              style={{
                borderRadius: 16,
                border: `1px solid ${open === i ? "var(--green-300)" : "var(--ink-100)"}`,
                background: "white",
                boxShadow: open === i ? "var(--shadow-md)" : "var(--shadow-sm)",
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                  gap: 16,
                  lineHeight: 1.4,
                }}
              >
                {faq.q}
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0, color: "var(--green-600)" }}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <p style={{
                      padding: "16px 24px 22px",
                      fontSize: 14,
                      color: "var(--ink-500)",
                      lineHeight: 1.7,
                      margin: 0,
                      borderTop: "1px solid var(--green-100)",
                    }}>
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getProtectedFooterLink(target: string) {
  if (typeof window === "undefined") return target;
  const hasToken = Boolean(
    localStorage.getItem("farmerToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt")
  );
  return hasToken ? target : "/login-renter";
}

/* ─── FOOTER ─── */
function Footer({ t }: { t: Content }) {
  const cols = [
    {
      title: t.footer.platform,
      links: [
        { label: "Search Equipment", href: getProtectedFooterLink("/renter/search") },
        { label: "How It Works", href: "#how-it-works" },
        { label: "List Equipment", href: "/login-owner" },
        { label: "Pricing", href: "/payment-policy" },
      ],
    },
    {
      title: t.footer.resources,
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Farmer Guide", href: "/farmer-guide" },
        { label: "Owner Guide", href: "/owner-guide" },
        { label: "Labour Guide", href: "/labour-guide" },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Service", href: "/terms-of-service" },
        { label: "Cookie Policy", href: "/cookie-policy" },
        { label: "Refund Policy", href: "/refund-policy" },
      ],
    },
  ];

  return (
    <footer style={{
      background: "var(--green-900)",
      color: "rgba(255,255,255,0.55)",
      padding: "72px 24px 36px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="sec-inner" style={{ padding: 0 }}>
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill="rgba(255,255,255,0.1)" />
                <path d="M7 20C7 20 9.5 14 16 14C22.5 14 25 20 25 20" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 20C12 17 14 14 16 14C18 14 20 17 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 14V10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="9" r="1.5" fill="#F4B400" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: 18, color: "white", letterSpacing: "-0.02em" }}>FarmFleet <span style={{ color: "#39B54A", marginLeft: 4 }}>AI</span></span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 260, marginBottom: 24 }}>
              {t.footer.tagline}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {["X", "in", "fb"].map((s) => (
                <div key={s} style={{
                  width: 34, height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
              }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.href}
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12,
          color: "rgba(255,255,255,0.3)",
        }}>
          <div>{t.footer.copyright}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-400)" }} />
            {t.footer.operational}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT ─── */
function Landing() {
  const { t } = useTranslation();
  const content = getContent(t);

  return (
    <>
      <StyleLoader />
      <div style={{ minHeight: "100vh", background: "var(--off-white)", overflowX: "hidden" }}>
        <Navbar t={content} />
        <Hero t={content} />
        <HowItWorks t={content} />
        <Browse t={content} />
        <ForOwners t={content} />
        <Reviews t={content} />
        <FAQ t={content} />
        <Footer t={content} />
      </div>
    </>
  );
}