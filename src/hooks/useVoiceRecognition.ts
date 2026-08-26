import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

// How many ms of silence before we truly stop listening.
// Browser SpeechRecognition times out after ~2s of silence by default.
// We auto-restart within this budget to give the user time to think and continue.
const SILENCE_BUDGET_MS = 7000; // 5 extra seconds on top of ~2s browser default

export function useVoiceRecognition({
  lang = "en-IN",
  continuous = false,
  onResult,
  onError,
}: VoiceRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);     // true while we want mic to stay alive
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(0);  // timestamp of last speech activity

  // Use refs for callbacks to avoid recreation of startListening and infinite loops
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    setErrorMsg(null);
    setTranscript("");
    setInterimTranscript("");
    shouldRestartRef.current = true;
    lastActivityRef.current = Date.now();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMsg("Voice input is not supported in this browser. Please use Chrome or Edge.");
      if (onErrorRef.current) onErrorRef.current("SpeechRecognition not supported");
      return;
    }

    function spawnRecognition() {
      if (!shouldRestartRef.current) return;

      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch { /* ignore */ }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;     // keep mic open until we explicitly stop
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          clearSilenceTimer();
        };

        recognition.onresult = (event: any) => {
          lastActivityRef.current = Date.now(); // user spoke — reset silence countdown
          clearSilenceTimer();

          let finalStr = "";
          let interimStr = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalStr += event.results[i][0].transcript;
            } else {
              interimStr += event.results[i][0].transcript;
            }
          }

          if (interimStr) {
            setInterimTranscript(interimStr);
            if (onResultRef.current) onResultRef.current(interimStr, false);
          }

          if (finalStr) {
            setTranscript(finalStr);
            setInterimTranscript("");
            if (onResultRef.current) onResultRef.current(finalStr, true);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            // Browser detected silence — check if we're still within our 7s budget
            const elapsed = Date.now() - lastActivityRef.current;
            if (shouldRestartRef.current && elapsed < SILENCE_BUDGET_MS) {
              // Still within budget — will auto-restart on onend
              return;
            }
          }
          if (event.error !== "no-speech") {
            setErrorMsg(
              event.error === "not-allowed"
                ? "Microphone permission denied"
                : `Speech error: ${event.error}`
            );
            if (onErrorRef.current) onErrorRef.current(event.error);
          }
          setIsListening(false);
          shouldRestartRef.current = false;
        };

        recognition.onend = () => {
          // Browser ended the session — if we still have budget, auto-restart
          const elapsed = Date.now() - lastActivityRef.current;
          if (shouldRestartRef.current && elapsed < SILENCE_BUDGET_MS) {
            // Auto-restart after a tiny gap so browser doesn't reject rapid restarts
            silenceTimerRef.current = setTimeout(() => {
              if (shouldRestartRef.current) {
                spawnRecognition();
              } else {
                setIsListening(false);
              }
            }, 250);
          } else {
            // Budget exhausted — truly stop
            shouldRestartRef.current = false;
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
        shouldRestartRef.current = false;
        setErrorMsg(err.message || "Failed to start microphone");
        if (onErrorRef.current) onErrorRef.current(err.message);
      }
    }

    spawnRecognition();
  }, [lang, clearSilenceTimer]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    errorMsg,
    startListening,
    stopListening,
    toggleListening,
    setTranscript,
  };
}
