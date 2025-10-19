import React from 'react';

export default function ScoreGauge({ value, size = 180 }) {
  const angle = Math.max(0, Math.min(180, (value / 100) * 180));
  const radius = size / 2;
  const stroke = 12;
  const endX = stroke + (size - 2 * stroke) * (value / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
        <path d={`M ${stroke} ${radius} A ${radius - stroke} ${radius - stroke} 0 0 1 ${size - stroke} ${radius}`} fill="none" strokeWidth={stroke} stroke="#e5e7eb" />
        <path d={`M ${stroke} ${radius} A ${radius - stroke} ${radius - stroke} 0 ${angle > 90 ? 1 : 0} 1 ${endX} ${radius}`} fill="none" strokeWidth={stroke} stroke="#3b82f6" strokeLinecap="round" />
      </svg>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>{Math.round(value)}%</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>Estimated AGI Level</div>
    </div>
  );
}


