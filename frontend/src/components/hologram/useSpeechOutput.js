import { useState } from "react";

/**
 * Strip Markdown so the TTS voice doesn't read punctuation/markup aloud (browsers
 * say "asterisk" for every `*`, "pound" for `#`, etc.). The visible chat keeps its
 * formatting — only the spoken copy is cleaned. Converts `[label](url)` to `label`.
 */
export function stripMarkdownForSpeech(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")            // fenced code blocks
    .replace(/`([^`]*)`/g, "$1")                 // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")       // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")      // links → label
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")           // headings
    .replace(/^\s{0,3}>\s?/gm, "")                // blockquotes
    .replace(/^\s*[-*+•]\s+/gm, "")               // list bullets
    .replace(/(\*\*|__)(.*?)\1/g, "$2")           // bold
    .replace(/(\*|_)(.*?)\1/g, "$2")              // italic
    .replace(/[*_`#>]/g, " ")                     // any leftover markers
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

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
    if (!supported) return null;
    const voices = window.speechSynthesis.getVoices();
    if (voiceName) return voices.find((v) => v.name === voiceName) || null;
    // No explicit voice: pick one that matches the target language, so e.g. an
    // English default voice doesn't end up reading Spanish text. Prefer a local
    // (on-device) voice when several match.
    const base = String(lang || "").slice(0, 2).toLowerCase();
    if (!base) return null;
    const matches = voices.filter((v) => String(v.lang || "").toLowerCase().startsWith(base));
    if (!matches.length) return null;
    return matches.find((v) => v.localService) || matches[0];
  };

  const speak = (text) => {
    if (!supported || !text || muted) return;
    const spoken = stripMarkdownForSpeech(text);   // don't read "asterisk", "pound", etc.
    if (!spoken) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(spoken);
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


