import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * VoiceSelector — compact voice-engine picker shown in a language agent's hero.
 *
 * Renders a dropdown of [Browser voice, …Voicebox profiles]. Voicebox options
 * only appear when a local Voicebox instance is reachable. An info line
 * explains the pedagogy: a NATIVE profile is the correct pronunciation model;
 * the user's own CLONED voice is for shadowing / fun, not for learning sounds.
 *
 * Props:
 *   voice       — the object returned by useVoiceEngine
 *   accent      — hex colour to match the host agent's palette
 *   nativeClone — true when the USER is a native speaker of the taught language
 *                 (e.g. the Spanish Teacher). Flips the pedagogical note: here a
 *                 cloned voice IS a valid native model, not a caveat.
 */
export default function VoiceSelector({ voice, accent = '#012169', nativeClone = false }) {
  const { t } = useTranslation();
  const [showNote, setShowNote] = useState(false);
  const { engine, setEngine, voiceboxAvailable, profiles, BROWSER } = voice;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        🔊 {t('voiceEngine.label')}
      </span>
      <select
        value={engine}
        onChange={(e) => setEngine(e.target.value)}
        style={{
          padding: '6px 10px', fontSize: 12, borderRadius: 8,
          border: `1px solid ${accent}44`, background: '#fff', color: '#1e293b',
          fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        <option value={BROWSER}>{t('voiceEngine.browser')}</option>
        {voiceboxAvailable && profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.language ? ` · ${p.language}` : ''} — Voicebox
          </option>
        ))}
      </select>

      {voiceboxAvailable ? (
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#15803d',
          background: '#dcfce7', border: '1px solid #86efac',
          padding: '2px 8px', borderRadius: 999,
        }}>● {t('voiceEngine.running')}</span>
      ) : (
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{t('voiceEngine.notRunning')}</span>
      )}

      {voiceboxAvailable && (
        <button
          onClick={() => setShowNote((s) => !s)}
          title={t('voiceEngine.noteTitle')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: accent, padding: 0 }}
        >ⓘ</button>
      )}

      {showNote && (
        <div style={{
          flexBasis: '100%', marginTop: 4, padding: '8px 12px',
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
          fontSize: 11, color: '#78350f', lineHeight: 1.5,
        }}>
          ℹ️ {nativeClone ? t('voiceEngine.noteNative') : t('voiceEngine.note')}
        </div>
      )}
    </div>
  );
}
