/**
 * HanziStrokeAnimation — animated stroke-order display for a single hanzi.
 *
 * Fetches the hanzi-writer-data JSON from /hanzi-data/{codepoint-hex}.json and renders
 * the same React-controlled SVG approach we used for KanjiVG in the Japanese
 * agent. The data format differs slightly:
 *
 *   { strokes: ["M ... Z", ...],     // SVG path commands per stroke
 *     medians: [[[x,y],...], ...] }   // midpoints (unused here)
 *
 * Hanzi Writer uses a different coordinate system (1024×1024 with Y flipped)
 * than KanjiVG. We render with viewBox "0 -124 1024 1024" and apply a vertical
 * flip transform so strokes appear visually correct.
 *
 * Hanzi Writer data is © Shaunak Kishore et al., MIT licence.
 *   https://github.com/chanind/hanzi-writer-data
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_TOKENS = {
  ink:    '#18181b',
  accent: '#c81d2e',
  soft:   '#9ca3af',
  grid:   '#e5e7eb',
};

const STROKE_MS = 700;
const STROKE_GAP_MS = 250;

const HanziStrokeAnimation = ({ char, size = 220, autoplay = false, tokens = DEFAULT_TOKENS }) => {
  const { t } = useTranslation();
  const [strokes, setStrokes] = useState([]);
  const [played, setPlayed] = useState(0);
  const [animating, setAnimating] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [medians, setMedians] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setStrokes([]); setMedians([]); setPlayed(0); setAnimating(-1); setPlaying(false);
    if (!char) return;
    // Filenames are the character's Unicode code point in lowercase hex (ASCII),
    // e.g. 我 (U+6211) -> "6211.json". This avoids serving CJK-named files over
    // HTTP: browsers always percent-encode non-ASCII path segments and the static
    // dev server 404s on the encoded form. Mirrors the Japanese KanjiVG approach.
    fetch(`/hanzi-data/${char.codePointAt(0).toString(16)}.json`)
      .then((r) => r.ok ? r.json() : Promise.reject('not found'))
      .then((data) => {
        if (!alive) return;
        setStrokes(data.strokes || []);
        setMedians(data.medians || []);
        setPlayed((data.strokes || []).length);   // default: show all
        if (autoplay) {
          setPlayed(0); setAnimating(0); setPlaying(true);
        }
      })
      .catch(() => { if (alive) setStrokes([]); });
    return () => { alive = false; };
  }, [char, autoplay]);

  useEffect(() => {
    if (!playing || animating < 0 || animating >= strokes.length) return;
    if (timerRef.current) clearTimeout(timerRef.current);
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

  // hanzi-writer-data uses 1024×1024 with origin at top-left and Y inverted relative
  // to standard SVG. We mirror the Y axis with the transform "scale(1 -1)" inside a
  // group, then shift content by translate(0, -900) so it sits in viewBox properly.
  const codeForKey = char.charCodeAt(0).toString(16);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg viewBox="0 0 1024 1024" width={size} height={size} style={{ display: 'block', background: '#fff' }}>
        {/* Grid */}
        <line x1="0"   y1="512" x2="1024" y2="512" stroke={tokens.grid} strokeWidth="3" strokeDasharray="12,8" />
        <line x1="512" y1="0"   x2="512"  y2="1024" stroke={tokens.grid} strokeWidth="3" strokeDasharray="12,8" />
        <g transform="translate(0 900) scale(1 -1)">
          {/* Ghost preview of remaining strokes */}
          {playing && strokes.map((d, i) => i >= played && i !== animating && (
            <path key={`ghost-${i}`} d={d} fill={tokens.soft} fillOpacity="0.12" />
          ))}
          {/* Completed strokes */}
          {strokes.map((d, i) => i < played && (
            <path key={`done-${i}`} d={d} fill={tokens.ink} />
          ))}
          {/* Animating stroke — Hanzi Writer paths are FILLED (not stroked) so the
              dasharray trick doesn't apply directly. We use a "reveal" via clip path
              instead: the stroke fills a clip area that grows over time. Simpler:
              just fade-in the current stroke with opacity animation. */}
          {animating >= 0 && animating < strokes.length && (
            <path key={`active-${codeForKey}-${animating}`} d={strokes[animating]}
              fill={tokens.accent}
              style={{ opacity: 0, animation: `hanzi-reveal-${codeForKey} ${STROKE_MS}ms ease-out forwards` }} />
          )}
        </g>
        {/* Stroke number overlay */}
        {showNumbers && medians.map((mid, i) => {
          if (!mid || mid.length === 0) return null;
          // Pick midpoint of median for label position. medians are in the same
          // flipped coordinate system as paths, so we manually invert here.
          const idx = Math.floor(mid.length / 2);
          const [x, y] = mid[idx];
          return (
            <text key={`num-${i}`} x={x} y={900 - y} fontSize="50" fontWeight="700"
                  fill={tokens.accent} fontFamily="monospace">{i + 1}</text>
          );
        })}
      </svg>

      <style>{`@keyframes hanzi-reveal-${codeForKey} { to { opacity: 1; } }`}</style>

      <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handlePlay} disabled={playing} style={{
          background: playing ? '#e5e7eb' : tokens.accent, color: playing ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
          cursor: playing ? 'default' : 'pointer',
        }}>{playing ? t('chineseTeacherModule.hanziStrokes.playing') : t('chineseTeacherModule.hanziStrokes.play')}</button>
        <button onClick={handleShowAll} style={{
          background: '#fff', color: tokens.ink, border: `1px solid ${tokens.grid}`,
          borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>{t('chineseTeacherModule.hanziStrokes.showAll')}</button>
        <label style={{ fontSize: 11, color: tokens.ink, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showNumbers} onChange={(e) => setShowNumbers(e.target.checked)} style={{ accentColor: tokens.accent }} />
          {t('chineseTeacherModule.hanziStrokes.numbers')}
        </label>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: tokens.soft, fontFamily: 'monospace' }}>
          {playing
            ? t('chineseTeacherModule.hanziStrokes.stroke') + ' ' + t('chineseTeacherModule.hanziStrokes.of', { n: Math.max(1, animating + 1), total: strokes.length })
            : `${strokes.length} ${strokes.length === 1 ? 'stroke' : 'strokes'}`}
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 9, color: tokens.soft, fontStyle: 'italic' }}>
        {t('chineseTeacherModule.hanziStrokes.credit')}
      </div>
    </div>
  );
};

export default HanziStrokeAnimation;
