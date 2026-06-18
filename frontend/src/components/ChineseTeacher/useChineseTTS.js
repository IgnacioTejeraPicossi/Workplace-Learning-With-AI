/**
 * useChineseTTS — same robustness pattern as useJapaneseTTS, retargeted at zh-CN.
 *
 * Picks any installed Chinese voice (lang starts with "zh"). On Windows that's
 * typically Microsoft Huihui (CN) or Tracy (HK/TW). If none is installed the
 * hook still returns supported=true but jaVoice=null, and the UI shows guidance.
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useChineseTTS = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const [zhVoice, setZhVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      setVoices(all);
      const exact   = all.find((v) => v.lang === 'zh-CN');
      const partial = all.find((v) => (v.lang || '').toLowerCase().startsWith('zh'));
      const picked  = exact || partial || null;
      setZhVoice(picked);
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
    u.lang  = 'zh-CN';
    u.rate  = opts.rate  ?? 0.85;
    u.pitch = opts.pitch ?? 1.0;
    if (zhVoice) u.voice = zhVoice;
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
        setStatus(zhVoice ? 'error' : 'no-voice');
      }
    }, 1200);
  }, [supported, zhVoice]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, speaking, supported, zhVoice, voices, status };
};
