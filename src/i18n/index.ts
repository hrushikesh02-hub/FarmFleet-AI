import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import hi from "./hi.json";
import mr from "./mr.json";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        mr: { translation: mr },
      },
      lng: "en",
      fallbackLng: "en",
      supportedLngs: ["en", "hi", "mr"],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

// After hydration on the client, apply any persisted language preference.
if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem("farmfleet_lang");
    if (saved && ["en", "hi", "mr"].includes(saved) && saved !== i18n.language) {
      // Defer to next tick so SSR-rendered markup matches first paint.
      setTimeout(() => i18n.changeLanguage(saved), 0);
    }
  } catch {
    /* ignore */
  }
}

export default i18n;
