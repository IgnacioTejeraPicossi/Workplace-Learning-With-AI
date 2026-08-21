/**
 * Shared leaf presentational atoms for the Homo-vs-AI workshop page.
 * Extracted from HomoSapiensVsAI.jsx (P5 decomposition) - no behaviour change.
 */
import React from 'react';

export function SectionHeader({ num, title, lead }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: 2 }}>
        {num} · SECTION
      </div>
      <h3 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      {lead && (
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, maxWidth: 860 }}>
          {lead}
        </div>
      )}
    </div>
  );
}
