/**
 * useEnglishTTS — same robustness pattern as the CJK TTS hooks, targeting
 * English. Prefers en-GB, falls back to any en-* voice. English voices ship
 * by default on Windows/macOS so a null voice is unlikely, but the hook still
 * degrades gracefully (status 'no-voice') if none is present.
 *
 * accent: 'gb' | 'us' — lets the Pronunciation Lab switch between British and
 * American models when both are installed.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useEnglishTTS = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const [enVoiceGb, setEnVoiceGb] = useState(null);
  const [enVoiceUs, setEnVoiceUs] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      setVoices(all);
      const gb = all.find((v) => v.lang === 'en-GB')
              || all.find((v) => (v.lang || '').toLowerCase().startsWith('en-gb'));
      const us = all.find((v) => v.lang === 'en-US')
              || all.find((v) => (v.lang || '').toLowerCase().startsWith('en-us'));
      const anyEn = all.find((v) => (v.lang || '').toLowerCase().startsWith('en'));
      setEnVoiceGb(gb || anyEn || null);
      setEnVoiceUs(us || anyEn || null);
      if (!gb && !us && !anyEn && all.length > 0) setStatus('no-voice');
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
    const accent = opts.accent === 'us' ? 'us' : 'gb';
    const voice = accent === 'us' ? enVoiceUs : enVoiceGb;
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = accent === 'us' ? 'en-US' : 'en-GB';
    u.rate = opts.rate ?? 0.92;
    u.pitch = opts.pitch ?? 1.0;
    if (voice) u.voice = voice;
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
        setStatus((voice) ? 'error' : 'no-voice');
      }
    }, 1200);
  }, [supported, enVoiceGb, enVoiceUs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const anyVoice = enVoiceGb || enVoiceUs;
  return { speak, stop, speaking, supported, enVoice: anyVoice, voices, status };
};
