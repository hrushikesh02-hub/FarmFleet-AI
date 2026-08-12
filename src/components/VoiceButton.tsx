import { useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { getSpeechLocale } from "@/i18n";
import { toast } from "sonner";

interface Props {
  label?: string;
  size?: "sm" | "md" | "lg";
  onSpeechResult?: (text: string) => void;
}

export function VoiceButton({ label, size = "md", onSpeechResult }: Props) {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const dims = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  }[size];

  const handleSpeech = () => {
    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setListening(true);
      toast.info(t("voice.listening"));
      setTimeout(() => {
        setListening(false);
        toast.info(t("voice.voiceHelpDesc"));
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLocale(i18n.language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        toast.info(`${t("voice.listening")} (${recognition.lang})`);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && onSpeechResult) {
          onSpeechResult(transcript);
        }
        toast.success(`"${transcript}"`);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition launch failed:", err);
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSpeech}
      aria-label={label ?? t("voice.tapToSpeak")}
      title={label ?? t("voice.tapToSpeak")}
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-elevated transition active:scale-95 cursor-pointer ${dims}`}
    >
      {listening ? (
        <MicOff className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
      ) : (
        <Mic className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
      )}
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
