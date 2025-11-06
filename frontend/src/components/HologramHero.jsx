import React, { useMemo, useRef } from 'react';

export default function HologramHero({ title = "Future Module", subtitle = "Click to explore prototypes", onClick }) {
  const cardRef = useRef(null);

  const styles = useMemo(() => ({
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 24,
    },
    card: {
      position: 'relative',
      width: 'min(680px, 92vw)',
      height: 260,
      borderRadius: 20,
      padding: 24,
      cursor: 'pointer',
      background: 'rgba(10, 20, 40, 0.35)',
      border: '1px solid rgba(90, 200, 255, 0.35)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25), inset 0 0 60px rgba(90,200,255,0.08)',
      backdropFilter: 'blur(8px) saturate(120%)',
      WebkitBackdropFilter: 'blur(8px) saturate(120%)',
      overflow: 'hidden',
      transformStyle: 'preserve-3d',
      transform: 'perspective(1200px) translateZ(0)',
      transition: 'transform 0.15s ease-out, box-shadow 0.2s ease-out',
    },
    heading: {
      position: 'relative',
      zIndex: 3,
      color: '#e8f7ff',
      margin: 0,
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: 0.2,
      textShadow: '0 0 18px rgba(90,200,255,0.45)',
    },
    sub: {
      position: 'relative',
      zIndex: 3,
      color: 'rgba(200,240,255,0.8)',
      marginTop: 8,
      fontSize: 14,
    },
    cta: {
      position: 'relative',
      zIndex: 3,
      display: 'inline-block',
      marginTop: 16,
      padding: '10px 16px',
      borderRadius: 10,
      border: '1px solid rgba(90,200,255,0.6)',
      color: '#b9ecff',
      background: 'linear-gradient(180deg, rgba(12,40,60,0.3), rgba(12,40,60,0.1))',
      boxShadow: '0 0 24px rgba(90,200,255,0.25)',
      fontWeight: 600,
    },
    glowCore: {
      position: 'absolute',
      right: -40,
      bottom: -60,
      width: 320,
      height: 320,
      borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(120,220,255,0.8), rgba(120,220,255,0.25), transparent 70%)',
      filter: 'blur(6px) saturate(140%)',
      zIndex: 1,
      transform: 'translateZ(40px)',
    },
    scanlines: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'linear-gradient(rgba(120,220,255,0.08) 1px, transparent 1px)',
      backgroundSize: '100% 3px',
      animation: 'holo-scan 6s linear infinite',
      maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 90%)',
      zIndex: 2,
      pointerEvents: 'none',
      transform: 'translateZ(20px)',
    },
    edge: {
      position: 'absolute',
      inset: 0,
      borderRadius: 20,
      boxShadow: 'inset 0 0 0 1px rgba(120,220,255,0.35), 0 0 60px rgba(120,220,255,0.15)',
      mixBlendMode: 'screen',
      zIndex: 2,
      pointerEvents: 'none',
    },
    grid: {
      position: 'absolute',
      left: -80,
      bottom: -40,
      width: 520,
      height: 220,
      backgroundImage: 'linear-gradient(transparent, rgba(120,220,255,0.18)), repeating-linear-gradient(90deg, rgba(120,220,255,0.12) 0 1px, transparent 1px 18px), repeating-linear-gradient(0deg, rgba(120,220,255,0.12) 0 1px, transparent 1px 18px)',
      transform: 'skewX(-12deg) rotateX(60deg) translateZ(30px)',
      filter: 'blur(0.4px)',
      borderRadius: 12,
      zIndex: 1,
      pointerEvents: 'none',
    },
    keyframes: `@keyframes holo-scan { from { background-position-y: 0; } to { background-position-y: 100%; } }`,
  }), []);

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${px * 10}deg) rotateX(${-py * 8}deg) translateZ(0)`;
    el.style.boxShadow = `0 ${8 + py * 8}px ${30 + Math.abs(px) * 20}px rgba(0,0,0,0.3), inset 0 0 80px rgba(90,200,255,${0.14 + Math.abs(px) * 0.1})`;
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(1200px) translateZ(0)';
    el.style.boxShadow = styles.card.boxShadow;
  };

  return (
    <div style={styles.wrapper}>
      {/* keyframes injection */}
      <style>{styles.keyframes}</style>
      <div
        ref={cardRef}
        style={styles.card}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onClick}
        title="Open Future Module"
      >
        <h3 style={styles.heading}>{title}</h3>
        <div style={styles.sub}>{subtitle}</div>
        <div style={styles.cta}>Enter →</div>

        {/* holographic layers */}
        <div style={styles.scanlines} />
        <div style={styles.edge} />
        <div style={styles.grid} />
        <div style={styles.glowCore} />
      </div>
    </div>
  );
}


