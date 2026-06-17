/**
 * KanjiStrokeAnimation — animated stroke-order display for a single kanji.
 *
 * Fetches the KanjiVG SVG from /kanji-svg/{code}.svg, parses out the individual
 * stroke paths, and renders them into a React-controlled SVG so we can:
 *   - animate strokes one at a time (stroke-dasharray + stroke-dashoffset)
 *   - highlight the currently-drawing stroke in red
 *   - overlay the numbered stroke order (toggle)
 *   - show "all strokes" static mode
 *
 * KanjiVG dataset is © Ulrich Apel et al., CC BY-SA 3.0
 *   https://kanjivg.tagaini.net/
 *
 * Props:
 *   code       hex codepoint of the kanji, e.g. "06728" for 木
 *   size       pixel size of the rendered SVG (default 220)
 *   autoplay   start animating immediately on mount
 *   tokens     palette overrides {ink, accent, soft, grid}
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_TOKENS = {
  ink:    '#1c1917',
  accent: '#dc2626',
  soft:   '#9ca3af',
  grid:   '#e5e7eb',
};

const STROKE_MS = 700;          // duration of a single stroke draw
const STROKE_GAP_MS = 250;      // pause between strokes

const KanjiStrokeAnimation = ({
  code, size = 220, autoplay = false, tokens = DEFAULT_TOKENS,
}) => {
  const { t } = useTranslation();
  const [strokes, setStrokes]   = useState([]);   // array of d="..." path strings
  const [numbers, setNumbers]   = useState([]);   // [{num,x,y}, …]
  const [played, setPlayed]     = useState(0);    // how many strokes are fully visible
  const [animating, setAnimating] = useState(-1); // -1 = none; idx of currently animating
  const [playing, setPlaying]   = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const timerRef = useRef(null);

  // ── Load the SVG and extract path data + number annotations
  useEffect(() => {
    let alive = true;
    setStrokes([]); setNumbers([]); setPlayed(0); setAnimating(-1); setPlaying(false);
    if (!code) return;
    fetch(`/kanji-svg/${code}.svg`)
      .then((r) => r.text())
      .then((text) => {
        if (!alive) return;
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const pathEls   = doc.querySelectorAll('path[id^="kvg:"]');
        const numberEls = doc.querySelectorAll('g[id^="kvg:StrokeNumbers"] text');
        const paths = Array.from(pathEls).map((p) => p.getAttribute('d')).filter(Boolean);
        const nums  = Array.from(numberEls).map((el, i) => {
          const m = (el.getAttribute('transform') || '').match(/[-\d.]+/g) || [];
          return { num: el.textContent || String(i + 1),
                   x:   parseFloat(m[4]) || 0,
                   y:   parseFloat(m[5]) || 0 };
        });
        setStrokes(paths);
        setNumbers(nums);
        setPlayed(paths.length);       // default: show all strokes
        if (autoplay) {
          setPlayed(0); setAnimating(0); setPlaying(true);
        }
      })
      .catch(() => { if (alive) setStrokes([]); });
    return () => { alive = false; };
  }, [code, autoplay]);

  // ── Sequencer: drives `animating` and `played` while playing
  useEffect(() => {
    if (!playing || animating < 0 || animating >= strokes.length) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    // Step 1: the current stroke draws over STROKE_MS — promote to "played" when done
    timerRef.current = setTimeout(() => {
      setPlayed(animating + 1);
      timerRef.current = setTimeout(() => {
        if (animating + 1 >= strokes.length) {
          setAnimating(-1); setPlaying(false);
        } else {
          setAnimating(animating + 1);
        }
      }, STROKE_GAP_MS);
    }, STROKE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, animating, strokes.length]);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handlePlay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlayed(0); setAnimating(0); setPlaying(true);
  }, []);

  const handleShowAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false); setAnimating(-1); setPlayed(strokes.length);
  }, [strokes.length]);

  if (strokes.length === 0) {
    return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.soft, fontSize: 11 }}>…</div>;
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <svg viewBox="0 0 109 109" width={size} height={size}
           style={{ display: 'block', background: '#fff' }}>
        {/* Grid guide lines (very subtle) */}
        <line x1="0"    y1="54.5" x2="109" y2="54.5" stroke={tokens.grid} strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="54.5" y1="0"    x2="54.5" y2="109" stroke={tokens.grid} strokeWidth="0.5" strokeDasharray="2,2" />

        {/* Faint trace of all strokes (visible while playing for orientation) */}
        {playing && strokes.map((d, i) => i >= played && i !== animating && (
          <path key={`ghost-${i}`} d={d}
            fill="none" stroke={tokens.soft} strokeOpacity="0.18" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Strokes already drawn (full ink) */}
        {strokes.map((d, i) => i < played && (
          <path key={`done-${i}`} d={d}
            fill="none" stroke={tokens.ink} strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Currently animating stroke (red, dasharray animation) */}
        {animating >= 0 && animating < strokes.length && (
          <path key={`active-${code}-${animating}`} d={strokes[animating]}
            fill="none" stroke={tokens.accent} strokeWidth="3.4"
            strokeLinecap="round" strokeLinejoin="round"
            style={{
              strokeDasharray: '500',
              strokeDashoffset: '500',
              animation: `kanji-draw-${code} ${STROKE_MS}ms linear forwards`,
            }} />
        )}

        {/* Stroke number overlay */}
        {showNumbers && numbers.map((n, i) => (
          <text key={`num-${i}`} x={n.x} y={n.y} fontSize="7" fontWeight="700"
                fill={tokens.accent} fontFamily="monospace">{n.num}</text>
        ))}
      </svg>

      {/* Per-code keyframes — scoped name avoids collision when several animations run */}
      <style>{`@keyframes kanji-draw-${code} { to { stroke-dashoffset: 0; } }`}</style>

      {/* Controls */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handlePlay} disabled={playing} style={{
          background: playing ? '#e5e7eb' : tokens.accent, color: playing ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
          cursor: playing ? 'default' : 'pointer',
        }}>{playing ? t('japaneseSenseiModule.kanjiStrokes.playing') : t('japaneseSenseiModule.kanjiStrokes.play')}</button>
        <button onClick={handleShowAll} style={{
          background: '#fff', color: tokens.ink, border: `1px solid ${tokens.grid}`,
          borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>{t('japaneseSenseiModule.kanjiStrokes.showAll')}</button>
        <label style={{ fontSize: 11, color: tokens.ink, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showNumbers} onChange={(e) => setShowNumbers(e.target.checked)} style={{ accentColor: tokens.accent }} />
          {t('japaneseSenseiModule.kanjiStrokes.numbers')}
        </label>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: tokens.soft, fontFamily: 'monospace' }}>
          {playing
            ? t('japaneseSenseiModule.kanjiStrokes.stroke') + ' ' + t('japaneseSenseiModule.kanjiStrokes.of', { n: Math.max(1, animating + 1), total: strokes.length })
            : `${strokes.length} ${strokes.length === 1 ? 'stroke' : 'strokes'}`}
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 9, color: tokens.soft, fontStyle: 'italic' }}>
        {t('japaneseSenseiModule.kanjiStrokes.credit')}
      </div>
    </div>
  );
};

export default KanjiStrokeAnimation;
