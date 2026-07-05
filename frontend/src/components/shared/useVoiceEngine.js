/**
 * useVoiceEngine — unifies the browser Web Speech API with a locally-running
 * Voicebox instance (jamiepine/voicebox) behind a single `speak()` call.
 *
 * Given an already-instantiated browser TTS hook (useEnglishTTS /
 * useNorwegianTTS / …) and a language tag, it:
 *   - health-checks the backend Voicebox proxy on mount (/api/voice/health)
 *   - exposes the list of Voicebox voice profiles (native + cloned)
 *   - holds the selected `engine`: 'browser' or a Voicebox profile id
 *   - routes speak(text, opts):
 *       · 'browser'  → browserTts.speak(text, opts)   (native pronunciation model)
 *       · <profileId>→ POST /api/voice/speak, play the returned audio; if the
 *                       proxy 503s (Voicebox not running) or returns non-audio,
 *                       fall back to the browser voice so nothing ever breaks.
 *
 * The returned object is a SUPERSET of the browser hook (it spreads it), so any
 * component already reading tts.supported / tts.voices / tts.enVoice etc. keeps
 * working — only `speak` and `speaking` are overridden.
 *
 * Pedagogical note lives in the VoiceSelector UI: a NATIVE Voicebox profile is
 * the right pronunciation model; the user's own CLONED voice is for shadowing /
 * motivation, not for learning correct sounds.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const BROWSER = 'browser';

export const useVoiceEngine = (browserTts, language) => {
  const [engine, setEngine] = useState(BROWSER);
  const [voiceboxAvailable, setVoiceboxAvailable] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [vbSpeaking, setVbSpeaking] = useState(false);
  const audioRef = useRef(null);

  // Health-check the Voicebox proxy once on mount. Failure is silent — the UI
  // simply keeps the browser voice.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/voice/health`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setVoiceboxAvailable(!!d.available);
        setProfiles(Array.isArray(d.profiles) ? d.profiles : []);
      })
      .catch(() => { if (!cancelled) setVoiceboxAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  const stopVb = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* ignore */ }
      audioRef.current = null;
    }
    setVbSpeaking(false);
  }, []);

  const speak = useCallback(async (text, opts = {}) => {
    if (!text) return;
    // Browser engine (or Voicebox went away): use the native browser voice.
    if (engine === BROWSER || !voiceboxAvailable) {
      browserTts?.speak?.(text, opts);
      return;
    }
    // Voicebox engine: ask the proxy, play the audio, fall back on any problem.
    stopVb();
    try {
      const res = await fetch(`${API_BASE}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, profile_id: engine, language }),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.startsWith('audio/')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setVbSpeaking(true);
        audio.onended = () => { URL.revokeObjectURL(url); setVbSpeaking(false); audioRef.current = null; };
        audio.onerror = () => { URL.revokeObjectURL(url); setVbSpeaking(false); audioRef.current = null; browserTts?.speak?.(text, opts); };
        await audio.play();
      } else {
        // 503 (Voicebox down) or non-audio JSON → graceful browser fallback.
        setVbSpeaking(false);
        browserTts?.speak?.(text, opts);
      }
    } catch (e) {
      setVbSpeaking(false);
      browserTts?.speak?.(text, opts);
    }
  }, [engine, voiceboxAvailable, browserTts, language, stopVb]);

  const stop = useCallback(() => {
    stopVb();
    browserTts?.stop?.();
  }, [stopVb, browserTts]);

  return {
    ...browserTts,          // passthrough: supported, voices, enVoice/noVoice, status
    speak,                  // override: routes browser vs voicebox
    stop,                   // override: stops both
    speaking: vbSpeaking || browserTts?.speaking || false,
    engine, setEngine,
    voiceboxAvailable, profiles,
    BROWSER,
  };
};
