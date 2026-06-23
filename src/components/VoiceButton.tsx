import { useState } from "react";
import { Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function VoiceButton({ label, size = "md" }: Props) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);

  const dims = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  }[size];

  const handle = () => {
    setListening(true);
    setTimeout(() => setListening(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label ?? t("voice.tapToSpeak")}
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-elevated transition active:scale-95 ${dims}`}
    >
      <Mic className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
      <AnimatePresence>
        {listening && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/30"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/20"
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
      </AnimatePresence>
    </button>
  );
}
