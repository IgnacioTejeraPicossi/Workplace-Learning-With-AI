/**
 * useJapaneseTTS — hook that exposes a robust Japanese text-to-speech speaker.
 *
 * Why it exists: the Web Speech API's `speechSynthesis` has several quirks that
 * make naive use unreliable:
 *
 *   1. `getVoices()` returns [] until the `voiceschanged` event fires (async).
 *      → We listen for that event and refresh state.
 *
 *   2. Setting `utterance.lang = 'ja-JP'` is NOT enough. Without an installed
 *      Japanese voice on the system, Chrome/Edge silently fail or fall back to
 *      a default voice that pronounces the kana as English letters.
 *      → We pick a real Japanese voice explicitly when available.
 *
 *   3. `onerror` is not always fired when no voice matches.
 *      → We watch with a timeout that detects "speak called but speech never
 *      started" (likely missing voice).
 *
 * Returns: { speak, stop, speaking, supported, jaVoice, voices, status }
 *   - status: 'idle' | 'speaking' | 'no-voice' | 'unsupported' | 'error'
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useJapaneseTTS = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices]   = useState([]);
  const [jaVoice, setJaVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus]   = useState(supported ? 'idle' : 'unsupported');
  const timerRef = useRef(null);

  // Load voices (and re-load when the browser fires voiceschanged)
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices() || [];
      setVoices(all);
      const exact   = all.find((v) => v.lang === 'ja-JP');
      const partial = all.find((v) => (v.lang || '').toLowerCase().startsWith('ja'));
      const picked  = exact || partial || null;
      setJaVoice(picked);
      if (!picked && all.length > 0) setStatus('no-voice');
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    // Some browsers don't fire voiceschanged — poll once after a short delay
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
    u.lang  = 'ja-JP';
    u.rate  = opts.rate  ?? 0.85;
    u.pitch = opts.pitch ?? 1.0;
    if (jaVoice) u.voice = jaVoice;
    u.onstart = () => {
      setSpeaking(true);
      setStatus('speaking');
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    u.onend   = () => { setSpeaking(false); setStatus('idle'); };
    u.onerror = () => { setSpeaking(false); setStatus('error'); };
    setSpeaking(true);
    setStatus('speaking');
    window.speechSynthesis.speak(u);
    // Fallback: if onstart never fires within 1.2s, assume the voice is missing
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeaking(false);
        setStatus(jaVoice ? 'error' : 'no-voice');
      }
    }, 1200);
  }, [supported, jaVoice]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, speaking, supported, jaVoice, voices, status };
};
