import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { Globe, Check } from "lucide-react";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.selectLanguage")}
        className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-3 py-1.5 text-sm font-medium hover:bg-accent transition ${
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
            onClick={() => {
              i18n.changeLanguage(l.code);
              try { window.localStorage.setItem("farmfleet_lang", l.code); } catch { /* ignore */ }
            }}
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
