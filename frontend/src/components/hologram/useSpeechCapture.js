import { useEffect, useRef, useState } from "react";

/**
 * Capture speech from user's microphone via Web Speech API.
 * Returns transcript and listen controls.
 */
export function useSpeechCapture(options = {}) {
  const { lang = "en-US", interim = true } = options;

  const isApiSupported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const [isSupported] = useState(Boolean(isApiSupported));
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  const getRecognition = () => {
    if (!isSupported) return null;
    if (recognitionRef.current) return recognitionRef.current;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = interim;
    rec.continuous = false;

    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };

    rec.onerror = (evt) => {
      setError(evt?.error || "speech-recognition-error");
      setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return rec;
  };

  const startListening = () => {
    if (!isSupported) return;
    const rec = getRecognition();
    if (!rec) return;
    setError(null);
    setTranscript("");
    try {
      rec.start();
      setIsListening(true);
    } catch (e) {
      // start can throw if already started
      // swallow to avoid console noise
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch (_) {}
  };

  const reset = () => {
    setTranscript("");
    setError(null);
  };

  // Keep the recognizer's language in sync when `lang` changes (the recognition
  // object is created once and memoised, so its .lang must be updated here — else
  // e.g. picking Spanish after it was created would keep transcribing as English).
  useEffect(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.lang = lang; } catch (_) {}
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (!rec) return;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch (_) {}
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    reset,
  };
}


