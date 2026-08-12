import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import hi from "./hi.json";
import mr from "./mr.json";
import gu from "./gu.json";
import ta from "./ta.json";
import te from "./te.json";
import kn from "./kn.json";
import pa from "./pa.json";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
] as const;

export type SupportedLanguage = typeof LANGUAGES[number]["code"];
const SUPPORTED_CODES = LANGUAGES.map((l) => l.code);

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        mr: { translation: mr },
        gu: { translation: gu },
        ta: { translation: ta },
        te: { translation: te },
        kn: { translation: kn },
        pa: { translation: pa },
      },
      lng: "en",
      fallbackLng: "en",
      supportedLngs: SUPPORTED_CODES,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

// After hydration on the client, apply any persisted language preference.
if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem("farmfleet_lang");
    if (saved && SUPPORTED_CODES.includes(saved as any) && saved !== i18n.language) {
      setTimeout(() => i18n.changeLanguage(saved), 0);
    }
  } catch {
    /* ignore */
  }
}

// Function to change language and persist to localStorage
export const changeAppLanguage = (langCode: string) => {
  if (SUPPORTED_CODES.includes(langCode as any)) {
    i18n.changeLanguage(langCode);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("farmfleet_lang", langCode);
      } catch {
        /* ignore */
      }
    }
  }
};

// Map i18n language codes to BCP 47 speech recognition locales
export const getSpeechLocale = (langCode?: string): string => {
  const current = langCode || i18n.language || "en";
  if (current.startsWith("hi")) return "hi-IN";
  if (current.startsWith("mr")) return "mr-IN";
  if (current.startsWith("gu")) return "gu-IN";
  if (current.startsWith("ta")) return "ta-IN";
  if (current.startsWith("te")) return "te-IN";
  if (current.startsWith("kn")) return "kn-IN";
  if (current.startsWith("pa")) return "pa-IN";
  return "en-IN";
};

// Format dates in a locale-sensitive manner
export const formatLocaleDate = (date: Date | string | number, langCode?: string): string => {
  const locale = getSpeechLocale(langCode);
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default i18n;
