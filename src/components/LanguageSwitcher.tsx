import { useTranslation } from "react-i18next";
import { LANGUAGES, changeAppLanguage } from "@/i18n";
import { Globe, Check } from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  variant?: "default" | "compact" | "ghost";
}

export function LanguageSwitcher({ variant = "default" }: Props) {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language.split("-")[0]) ?? LANGUAGES[0];

  const handleLanguageChange = (langCode: string) => {
    changeAppLanguage(langCode);

    // Best-effort background sync for logged-in users
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("farmerToken") ||
        localStorage.getItem("ownerToken") ||
        localStorage.getItem("labourToken");
      const userType = localStorage.getItem("userType") || (localStorage.getItem("farmerToken") ? "farmer" : localStorage.getItem("ownerToken") ? "owner" : localStorage.getItem("labourToken") ? "labour" : null);

      if (token && userType) {
        const endpoint =
          userType === "owner"
            ? "/api/owner/profile"
            : userType === "labour"
            ? "/api/labour/profile"
            : "/api/farmer/profile";
        
        axios
          .put(
            `http://localhost:5000${endpoint}`,
            { preferredLanguage: langCode },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch(() => {
            /* ignore background sync failures silently */
          });
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.selectLanguage")}
        className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-3 py-1.5 text-sm font-medium hover:bg-accent transition cursor-pointer ${
          variant === "compact" ? "px-2 py-1" : ""
        } ${variant === "ghost" ? "border-0 bg-transparent" : ""}`}
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">{current.native}</span>
        <span className="sm:hidden">{current.code.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleLanguageChange(l.code)}
            className="flex items-center justify-between gap-3 py-2.5 cursor-pointer"
          >
            <span className="font-medium">{l.native}</span>
            {current.code === l.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
