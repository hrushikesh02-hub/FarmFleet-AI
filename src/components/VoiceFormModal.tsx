import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { parseFarmerVoice, type ParsedFarmerVoice } from "@/lib/voiceParser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ParsedFarmerVoice) => void;
}

const DEMO_PRESETS = [
  {
    title: "🌾 Wheat in Ahmednagar",
    subtitle: "3 Acres, Black Soil, Canal, ₹60,000",
    text: "I want to grow Wheat in Ahmednagar with 3 acres land on Black Soil with Canal water and budget 60000",
  },
  {
    title: "🎋 Sugarcane in Pune",
    subtitle: "5 Acres, Black Soil, Drip, ₹1.5 Lakh",
    text: "Sugarcane crop in Pune district, 5 acres farm, black soil, drip irrigation with 1.5 lakh budget",
  },
  {
    title: "🥔 Potato in Nashik",
    subtitle: "2 Acres, Red Soil, Borewell, ₹40,000",
    text: "Potato farming in Nashik, 2 acres land, red soil, borewell water source, budget 40 thousand",
  },
  {
    title: "🍅 Tomato in Solapur",
    subtitle: "4 Acres, Alluvial Soil, River, ₹80,000",
    text: "Tomato in Solapur, 4 acres land, alluvial soil, river water, budget 80000 rupees",
  },
];

export function VoiceFormModal({ isOpen, onClose, onApply }: Props) {
  const [currentText, setCurrentText] = useState("");
  const [parsed, setParsed] = useState<ParsedFarmerVoice | null>(null);

  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
    errorMsg,
  } = useVoiceRecognition({
    lang: "en-IN",
    onResult: (text, isFinal) => {
      setCurrentText(text);
      if (isFinal) {
        const res = parseFarmerVoice(text);
        setParsed(res);
      }
    },
  });

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentText("");
      setParsed(null);
      const timer = setTimeout(() => {
        startListening();
      }, 350);
      return () => {
        clearTimeout(timer);
        stopListening();
      };
    } else {
      stopListening();
    }
  }, [isOpen, startListening, stopListening]);

  const handleApplyPreset = (presetText: string) => {
    stopListening();
    setCurrentText(presetText);
    const res = parseFarmerVoice(presetText);
    setParsed(res);
  };

  const handleConfirm = () => {
    if (parsed) {
      stopListening();
      onApply(parsed);
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasEntities = parsed && parsed.matchedEntities.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl rounded-3xl border border-border bg-card shadow-elevated overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/70 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-soft">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base leading-none">Voice Assistant</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Speak your farm requirements naturally</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Mic Waveform & Listening State */}
            <div className="flex flex-col items-center text-center py-3">
              <div className="relative">
                {/* Glowing Pulse Rings */}
                {isListening && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -inset-4 rounded-full bg-primary/20"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="absolute -inset-8 rounded-full bg-primary/10"
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`relative h-20 w-20 rounded-full flex items-center justify-center shadow-elevated transition-all duration-300 ${isListening
                      ? "bg-gradient-primary text-primary-foreground scale-105"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {isListening ? (
                    <Mic className="h-8 w-8 animate-pulse" />
                  ) : (
                    <MicOff className="h-8 w-8" />
                  )}
                </button>
              </div>

              <p className="mt-4 font-display font-bold text-sm">
                {isListening ? (
                  <span className="inline-flex items-center gap-1.5 text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    Listening… Speak now
                  </span>
                ) : (
                  <span className="text-muted-foreground">Tap microphone to speak</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Try: <em>"Wheat in Ahmednagar, 4 acres, black soil, 50 thousand budget"</em>
              </p>
            </div>

            {/* Live Transcript Display */}
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 min-h-[72px] flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Transcript
              </span>
              <p className="text-sm text-foreground font-medium italic">
                {currentText || interimTranscript ? (
                  `"${currentText || interimTranscript}"`
                ) : (
                  <span className="text-muted-foreground/60 not-italic">
                    Spoken farm details will appear here in real-time…
                  </span>
                )}
              </p>
            </div>

            {/* Extracted Entity Badges */}
            {hasEntities && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Detected Farm Details ({parsed.matchedEntities.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">Ready to autofill</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsed.matchedEntities.map((e) => (
                    <span
                      key={e.key}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <strong>{e.label}:</strong> {e.value}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Stage Demo Chips / Safety Net */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>1-Click Demo Voice Chips (Stage Safety Net):</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p.text)}
                    className="flex flex-col text-left p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/60 transition group cursor-pointer"
                  >
                    <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      {p.title}
                      <Play className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">{p.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!hasEntities}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold shadow-soft hover:shadow-elevated transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Apply to Crop Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
