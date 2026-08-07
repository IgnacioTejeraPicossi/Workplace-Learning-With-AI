import { useState } from "react";

/**
 * Speak text using SpeechSynthesis (browser TTS).
 */
export function useSpeechOutput(options = {}) {
  // rate/pitch/volume default to 1 → existing callers are unaffected; Andrés
  // passes disposition-derived values so his voice reflects his simulated state.
  const { lang = "en-US", voiceName, muted = false, rate = 1, pitch = 1, volume = 1 } = options;
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
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
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


