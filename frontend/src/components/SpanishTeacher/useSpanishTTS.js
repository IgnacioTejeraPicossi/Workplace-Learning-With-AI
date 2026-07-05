/**
 * useSpanishTTS — same robustness pattern as the other language TTS hooks,
 * targeting es-ES (with es-MX / any es-* fallback). Spanish voices ship by
 * default on Windows/macOS (Helena, Laura, Pablo, Sabina…), so a null voice is
 * unlikely — but the hook still degrades gracefully to status 'no-voice'.
 *
 * This is the browser fallback; when Voicebox is running, the shared
 * useVoiceEngine routes 🔊 to the (optionally cloned, native) Spanish voice.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useSpanishTTS = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const [esVoice, setEsVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      setVoices(all);
      const es = all.find((v) => v.lang === 'es-ES')
              || all.find((v) => (v.lang || '').toLowerCase().startsWith('es-es'))
              || all.find((v) => (v.lang || '').toLowerCase().startsWith('es'));
      setEsVoice(es || null);
      if (!es && all.length > 0) setStatus('no-voice');
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    const t = setTimeout(load, 300);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      clearTimeout(t);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpeaking(false);
    setStatus((s) => (s === 'speaking' ? 'idle' : s));
  }, [supported]);

  const speak = useCallback((text, opts = {}) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.0;
    if (esVoice) u.voice = esVoice;
    u.onstart = () => { setSpeaking(true); setStatus('speaking');
                        if (timerRef.current) clearTimeout(timerRef.current); };
    u.onend = () => { setSpeaking(false); setStatus('idle'); };
    u.onerror = () => { setSpeaking(false); setStatus('error'); };
    setSpeaking(true); setStatus('speaking');
    window.speechSynthesis.speak(u);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeaking(false);
        setStatus(esVoice ? 'error' : 'no-voice');
      }
    }, 1200);
  }, [supported, esVoice]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, speaking, supported, esVoice, voices, status };
};
