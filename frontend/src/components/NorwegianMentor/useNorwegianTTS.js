/**
 * useNorwegianTTS — same robustness pattern as the other language TTS hooks,
 * targeting nb-NO (Bokmål). Falls back to any 'no*' voice. On Windows the
 * Norwegian voice (e.g. Microsoft Jon/Finn) may need installing like the
 * Japanese one did; if absent the hook returns supported=true, noVoice=null
 * and status 'no-voice' so the UI can prompt an install.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useNorwegianTTS = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const [noVoice, setNoVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      setVoices(all);
      const exact = all.find((v) => v.lang === 'nb-NO' || v.lang === 'nn-NO');
      const partial = all.find((v) => (v.lang || '').toLowerCase().startsWith('nb')
                                    || (v.lang || '').toLowerCase().startsWith('nn')
                                    || (v.lang || '').toLowerCase().startsWith('no'));
      const picked = exact || partial || null;
      setNoVoice(picked);
      if (!picked && all.length > 0) setStatus('no-voice');
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
    u.lang = 'nb-NO';
    u.rate = opts.rate ?? 0.9;
    u.pitch = opts.pitch ?? 1.0;
    if (noVoice) u.voice = noVoice;
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
        setStatus(noVoice ? 'error' : 'no-voice');
      }
    }, 1200);
  }, [supported, noVoice]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, speaking, supported, noVoice, voices, status };
};
