import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from '../_tokens';

/**
 * ObserverPatchSimulator — a toy visualisation of OPH's central claim:
 * public reality emerges from overlap-consensus between observer patches.
 *
 * Not physics. Not consciousness. Just an intuition pump — 8-ish moving
 * circles ("patches"). Each has a 1D scalar state colour-mapped to a hue.
 * When two patches overlap, their states drift toward each other in the
 * overlap zone with strength `k`. Everything else is brownian motion + wall
 * bounces.
 *
 * The metric "public consensus" = 1 - normalised_std(states) — grows toward
 * 1 as patches converge. That convergence WITHOUT any global coordinator
 * is the pedagogical point.
 *
 * Runs on requestAnimationFrame; loop is cancelled when the component
 * unmounts OR when the user pauses.
 */

const CANVAS_W = 720;
const CANVAS_H = 380;

const DEFAULTS = {
  nPatches: 8,
  strength: 0.015,
  radius:   45,
};

// State ∈ [-1, 1] → hue on a warm→cool gradient (red → violet → blue).
const stateColor = (s) => {
  // s in [-1, 1] → hue in [0, 260]
  const hue = ((s + 1) / 2) * 260;
  return `hsl(${hue.toFixed(0)}, 70%, 55%)`;
};

const randRange = (a, b) => a + Math.random() * (b - a);

const makePatches = (n, radius) => {
  const patches = [];
  for (let i = 0; i < n; i++) {
    patches.push({
      x:  randRange(radius + 10, CANVAS_W - radius - 10),
      y:  randRange(radius + 10, CANVAS_H - radius - 10),
      vx: randRange(-0.6, 0.6),
      vy: randRange(-0.6, 0.6),
      r:  radius,
      state: randRange(-1, 1),
    });
  }
  return patches;
};

// Standard deviation of state values, normalised so [-1, 1] uniform → 1.
// The consensus metric = 1 - std, clamped to [0, 1].
const consensus = (patches) => {
  const n = patches.length;
  if (n < 2) return 1;
  const mean = patches.reduce((s, p) => s + p.state, 0) / n;
  const variance = patches.reduce((s, p) => s + (p.state - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  // Max possible std for values in [-1, 1] is 1 (half-half at ±1).
  return Math.max(0, Math.min(1, 1 - std));
};

export default function ObserverPatchSimulator() {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const patchesRef = useRef(makePatches(DEFAULTS.nPatches, DEFAULTS.radius));
  const rafRef = useRef(null);

  const [running,  setRunning]  = useState(true);
  const [nPatches, setNPatches] = useState(DEFAULTS.nPatches);
  const [strength, setStrength] = useState(DEFAULTS.strength);
  const [radius,   setRadius]   = useState(DEFAULTS.radius);
  const [consensusPct, setConsensusPct] = useState(0);

  // Rebuild patches whenever N or radius changes.
  const rebuild = useCallback(() => {
    patchesRef.current = makePatches(nPatches, radius);
    setConsensusPct(0);
  }, [nPatches, radius]);

  useEffect(() => { rebuild(); }, [rebuild]);

  // Draw one frame.
  const draw = useCallback((ctx) => {
    const patches = patchesRef.current;

    // Background wash
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Overlap-zone highlights: for each pair that overlaps, draw a soft
    // ellipse in the midpoint tinted with the average state colour. This
    // is what the user should "read" as public reality.
    for (let i = 0; i < patches.length; i++) {
      for (let j = i + 1; j < patches.length; j++) {
        const a = patches[i], b = patches[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d < a.r + b.r) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const avg = (a.state + b.state) / 2;
          ctx.fillStyle = stateColor(avg);
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(mx, my, Math.min(a.r, b.r) * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Patches on top
    for (const p of patches) {
      ctx.fillStyle = stateColor(p.state);
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, []);

  // Physics step.
  const step = useCallback(() => {
    const patches = patchesRef.current;
    // 1. Motion + wall bounce
    for (const p of patches) {
      p.vx += randRange(-0.05, 0.05);
      p.vy += randRange(-0.05, 0.05);
      // Damping to keep speeds sane
      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx;  p.y += p.vy;
      if (p.x < p.r)              { p.x = p.r;              p.vx = -p.vx; }
      if (p.x > CANVAS_W - p.r)   { p.x = CANVAS_W - p.r;   p.vx = -p.vx; }
      if (p.y < p.r)              { p.y = p.r;              p.vy = -p.vy; }
      if (p.y > CANVAS_H - p.r)   { p.y = CANVAS_H - p.r;   p.vy = -p.vy; }
    }
    // 2. Pairwise overlap consensus
    for (let i = 0; i < patches.length; i++) {
      for (let j = i + 1; j < patches.length; j++) {
        const a = patches[i], b = patches[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d < a.r + b.r) {
          const delta = strength * (b.state - a.state);
          a.state += delta;
          b.state -= delta;
          // Clamp to [-1, 1]
          a.state = Math.max(-1, Math.min(1, a.state));
          b.state = Math.max(-1, Math.min(1, b.state));
        }
      }
    }
  }, [strength]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const loop = () => {
      if (running) step();
      draw(ctx);
      // Update the consensus metric every 6 frames (~10Hz) to save re-renders.
      if (frame % 6 === 0) {
        setConsensusPct(consensus(patchesRef.current));
      }
      frame++;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, step, draw]);

  return (
    <div style={panel}>
      <h3 style={panelTitle}>🌀 {t('selfSimReality.playground.sim.title')}</h3>
      <p style={{ ...subtle, margin: '0 0 12px' }}>
        {t('selfSimReality.playground.sim.subtitle')}
      </p>

      {/* Canvas */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </div>

      {/* Consensus metric */}
      <div style={{
        marginTop: 12, padding: '10px 14px',
        background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b21a8', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {t('selfSimReality.playground.sim.consensusLabel')}
        </span>
        <div style={{
          flex: 1, minWidth: 200, height: 10,
          background: 'white', borderRadius: 999, border: '1px solid #ddd6fe',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(consensusPct * 100).toFixed(1)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
            transition: 'width 0.2s',
          }} />
        </div>
        <strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#4c1d95' }}>
          {(consensusPct * 100).toFixed(0)}%
        </strong>
      </div>

      {/* Controls */}
      <div style={{
        marginTop: 14,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12,
      }}>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setRunning(r => !r)}
            style={{
              flex: 1,
              background: running ? '#fbbf24' : '#7c3aed', color: 'white',
              border: 'none', borderRadius: 8, padding: '10px 12px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            {running
              ? `⏸ ${t('selfSimReality.playground.sim.pause')}`
              : `▶ ${t('selfSimReality.playground.sim.play')}`}
          </button>
          <button
            type="button"
            onClick={rebuild}
            style={{
              background: '#e2e8f0', color: '#1e293b',
              border: 'none', borderRadius: 8, padding: '10px 12px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            ↺ {t('selfSimReality.playground.sim.reset')}
          </button>
        </div>

        {/* Sliders */}
        <Slider
          label={t('selfSimReality.playground.sim.sliders.patches')}
          value={nPatches} min={3} max={15} step={1}
          onChange={(v) => setNPatches(v)}
          format={(v) => v}
        />
        <Slider
          label={t('selfSimReality.playground.sim.sliders.strength')}
          value={strength} min={0.001} max={0.05} step={0.001}
          onChange={(v) => setStrength(v)}
          format={(v) => v.toFixed(3)}
        />
        <Slider
          label={t('selfSimReality.playground.sim.sliders.radius')}
          value={radius} min={30} max={70} step={1}
          onChange={(v) => setRadius(v)}
          format={(v) => `${v}px`}
        />
      </div>

      {/* Educational note */}
      <div style={{
        marginTop: 14, padding: '10px 14px',
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
        fontSize: 11, color: '#78350f', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.playground.sim.disclaimer')}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#475569',
        letterSpacing: 0.5, textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{label}</span>
        <span style={{ color: '#6b21a8', fontFamily: 'monospace' }}>{format(value)}</span>
      </span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: '#7c3aed' }}
      />
    </label>
  );
}
