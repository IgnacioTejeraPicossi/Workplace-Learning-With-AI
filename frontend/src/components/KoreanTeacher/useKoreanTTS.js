/**
 * useKoreanTTS — same robustness pattern as useChineseTTS / useJapaneseTTS,
 * retargeted at ko-KR.
 *
 * Picks any installed Korean voice (lang starts with "ko"). On Windows that's
 * typically Microsoft Heami. If none is installed the hook still returns
 * supported=true but koVoice=null, and the UI shows guidance.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useKoreanTTS = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const [koVoice, setKoVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      setVoices(all);
      const exact   = all.find((v) => v.lang === 'ko-KR');
      const partial = all.find((v) => (v.lang || '').toLowerCase().startsWith('ko'));
      const picked  = exact || partial || null;
      setKoVoice(picked);
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
    u.lang  = 'ko-KR';
    u.rate  = opts.rate  ?? 0.85;
    u.pitch = opts.pitch ?? 1.0;
    if (koVoice) u.voice = koVoice;
    u.onstart = () => { setSpeaking(true); setStatus('speaking');
                        if (timerRef.current) clearTimeout(timerRef.current); };
    u.onend   = () => { setSpeaking(false); setStatus('idle'); };
    u.onerror = () => { setSpeaking(false); setStatus('error'); };
    setSpeaking(true); setStatus('speaking');
    window.speechSynthesis.speak(u);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeaking(false);
        setStatus(koVoice ? 'error' : 'no-voice');
      }
    }, 1200);
  }, [supported, koVoice]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, speaking, supported, koVoice, voices, status };
};
