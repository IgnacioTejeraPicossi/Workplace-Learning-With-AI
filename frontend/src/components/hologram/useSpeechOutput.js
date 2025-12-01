import { useState } from "react";

/**
 * Speak text using SpeechSynthesis (browser TTS).
 */
export function useSpeechOutput(options = {}) {
  const { lang = "en-US", voiceName, muted = false } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const resolveVoice = () => {
    if (!supported || !voiceName) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.name === voiceName) || null;
  };

  const speak = (text) => {
    if (!supported || !text || muted) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    const v = resolveVoice();
    if (v) utter.voice = v;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return { supported, isSpeaking, speak, stop };
}


