import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// SVG semicircle with stroke-dasharray for exact proportion on any value
export default function ScoreGauge({ value, size = 180 }) {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = size / 2;
  const stroke = 12;
  const r = radius - stroke; // drawable radius
  const cx = size / 2;
  const cy = radius;
  const startX = cx - r;
  const startY = cy;
  const baseRef = useRef(null);
  const valRef = useRef(null);

  useEffect(() => {
    if (!baseRef.current || !valRef.current) return;
    const len = baseRef.current.getTotalLength();
    const shown = (len * clamped) / 100;
    valRef.current.setAttribute('stroke-dasharray', `${shown} ${len}`);
    valRef.current.setAttribute('stroke-dashoffset', '0');
  }, [clamped]);

  const baseD = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
        <path ref={baseRef} d={baseD} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <path ref={valRef} d={baseD} fill="none" stroke="#3b82f6" strokeWidth={stroke} strokeLinecap="round" />
      </svg>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>{Math.round(clamped)}%</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{t('help.agiProgress.estimated', { defaultValue: 'Estimated AGI Level' })}</div>
    </div>
  );
}


