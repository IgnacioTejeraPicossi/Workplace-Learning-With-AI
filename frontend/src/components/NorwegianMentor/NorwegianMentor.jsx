/**
 * Norsk Mester AI — V1
 * ====================
 * Advanced-Norwegian perfection tool for a Spanish speaker who also knows
 * English. NOT a beginner alphabet course — a nuance/pitch-accent/word-order
 * coach.
 *
 * 9 tabs: Dashboard · Uttale & Tonelag · Grammatikk · Småord · Vocabulary SRS
 *         · Germanic Bridge · Conversation · Writing · Kultur
 *
 * Visual: Norwegian-flag red + navy on cool white. Icon 🇳🇴.
 * Backend: /api/norwegian/*
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNorwegianTTS } from './useNorwegianTTS';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => (lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en');

// ─── Design tokens (Norwegian flag red + navy) ────────────────────────────────
const C = {
  bg:           'linear-gradient(160deg,#fdf2f4 0%,#fefefe 50%,#eef2fb 100%)',
  card:         '#ffffff',
  border:       '#e2e8f0',
  ink:          '#0f172a',
  inkSoft:      '#475569',
  accent:       '#ba0c2f',   // Norwegian flag red
  accentLight:  '#fdf2f4',
  accentBorder: '#f4c2cc',
  navy:         '#00205b',   // Norwegian flag blue
  navyLight:    '#eef2fb',
  navyBorder:   '#bcccea',
  gold:         '#b45309',
  goldLight:    '#fffbeb',
  goldBorder:   '#fde68a',
  green:        '#15803d',
  greenLight:   '#f0fdf4',
  greenBorder:  '#86efac',
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
const SectionLabel = ({ index, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    <span style={{ color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
      {String(index).padStart(2, '0')} · {label.toUpperCase()}
    </span>
    <div style={{ flex: 1, height: 1, background: C.border }} />
  </div>
);

const Card = ({ children, accent = C.border, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`,
                borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>{children}</div>
);

const Stat = ({ label, value, max, color = C.accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px' }}>
    <p style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>
      {value ?? '—'}{max != null && <span style={{ fontSize: 13, color: C.inkSoft, marginLeft: 4 }}>/ {max}</span>}
    </p>
  </div>
);

const Button = ({ children, onClick, primary = false, disabled = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#e5e7eb' : primary ? `linear-gradient(135deg,${C.accent},#8a0922)` : C.card,
    color: disabled ? '#9ca3af' : primary ? '#fff' : C.ink, border: primary ? 'none' : `1px solid ${C.border}`,
    borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: primary ? '0 2px 8px rgba(186,12,47,0.25)' : '0 1px 2px rgba(0,0,0,0.04)', fontFamily: 'inherit', ...style,
  }}>{children}</button>
);

const Chip = ({ children, color = C.accent, light = C.accentLight, border = C.accentBorder, style = {} }) => (
  <span style={{ background: light, color, border: `1px solid ${border}`, borderRadius: 999, padding: '2px 9px',
                 fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', ...style }}>{children}</span>
);

const SpeakBtn = ({ text, tts, style = {} }) => (
  <button onClick={() => tts.speak(text)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, padding: 2, ...style }}>🔊</button>
);

const loadingP = (msg) => <p style={{ textAlign: 'center', color: C.inkSoft, padding: 40 }}>{msg}</p>;

const NoVoiceHint = ({ tts, t }) => (
  tts.supported && !tts.noVoice && tts.voices.length > 0 ? (
    <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderLeft: `4px solid ${C.gold}`,
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#78350f' }}>
      ⚠ {t('norwegianMentorModule.pronunciation.noVoice')}
    </div>
  ) : null
);

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TabDashboard = ({ onJump }) => {
  const { t } = useTranslation();
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/overview`).then(r => r.json()).then(d => { setOv(d); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return loadingP(t('norwegianMentorModule.dashboard.loading'));
  if (!ov) return loadingP(t('norwegianMentorModule.common.error'));
  const { stats, todays_mission: mission, level, cefr_target, streak_days } = ov;
  const missionTarget = { tonelag: 'pronunciation', grammatikk: 'grammar', smaord: 'smaord', srs: 'vocabulary', conversation: 'conversation' };
  const missionEmoji = { tonelag: '🎵', grammatikk: '📐', smaord: '💬', srs: '📚', conversation: '🗣' };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('norwegianMentorModule.tabs.dashboard')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.dashboard.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('norwegianMentorModule.dashboard.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: C.accentLight, border: `1px solid ${C.accentBorder}`, borderTop: `3px solid ${C.accent}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('norwegianMentorModule.dashboard.level')}</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#7f1d1d' }}>{level}</p>
        </div>
        <div style={{ background: C.navyLight, border: `1px solid ${C.navyBorder}`, borderTop: `3px solid ${C.navy}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.navy, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('norwegianMentorModule.dashboard.target')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#001344', fontFamily: 'monospace' }}>{cefr_target}</p>
        </div>
        <div style={{ background: '#f5f5f4', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.ink}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('norwegianMentorModule.dashboard.streak')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: C.ink, fontFamily: 'monospace' }}>🔥 {streak_days} <span style={{ fontSize: 12, color: C.inkSoft }}>{t('norwegianMentorModule.dashboard.days')}</span></p>
        </div>
      </div>
      <SectionLabel index={2} label="STATS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('norwegianMentorModule.dashboard.tonemes')} value={stats.tonemes_total} color={C.accent} />
        <Stat label={t('norwegianMentorModule.dashboard.grammar')} value={stats.grammar_total} color={C.navy} />
        <Stat label={t('norwegianMentorModule.dashboard.smaord')} value={stats.smaord_total} color="#7c3aed" />
        <Stat label={t('norwegianMentorModule.dashboard.vocabKnown')} value={stats.vocab_known} max={stats.vocab_total} color={C.green} />
        <Stat label={t('norwegianMentorModule.dashboard.bridge')} value={stats.bridge_total} color={C.gold} />
      </div>
      <SectionLabel index={3} label={t('norwegianMentorModule.dashboard.todaysMission')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {mission.map((m, i) => (
          <Card key={i} accent={['#ba0c2f', '#00205b', '#7c3aed', '#15803d', '#b45309'][i % 5]}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div onClick={() => onJump?.(missionTarget[m.type])} style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{t(`norwegianMentorModule.dashboard.missionLabels.${m.type}`)}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: C.ink, fontFamily: 'monospace' }}>{m.count}</p>
            </div>
            <span style={{ fontSize: 22 }}>{missionEmoji[m.type] || '·'}</span>
          </Card>
        ))}
      </div>
      <Button primary onClick={() => onJump?.('pronunciation')}>{t('norwegianMentorModule.dashboard.continue')} →</Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Uttale & Tonelag
// ═══════════════════════════════════════════════════════════════════════════════
const TabPronunciation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [data, setData] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/pronunciation`).then(r => r.json()).then(setData); }, []);
  if (!data) return loadingP(t('norwegianMentorModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('norwegianMentorModule.tabs.pronunciation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.pronunciation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('norwegianMentorModule.pronunciation.subtitle')}</p>
      <NoVoiceHint tts={tts} t={t} />

      {/* Tonelag hero */}
      <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder, marginBottom: 20 }}>
        <h3 style={{ color: C.accent, fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>🎵 {t('norwegianMentorModule.pronunciation.tonelagTitle')}</h3>
        <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.65 }}>{data.tonelag_intro[lang] || data.tonelag_intro.en}</p>
      </Card>

      <h3 style={{ color: C.accent, fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>{t('norwegianMentorModule.pronunciation.tonemesTitle')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 24 }}>
        {data.tonemes.map((tn, i) => (
          <Card key={i} accent={C.accent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{tn.pair}</span>
              <SpeakBtn text={tn.pair} tts={tts} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Chip color={C.navy} light={C.navyLight} border={C.navyBorder}>T1</Chip>
                <span style={{ fontSize: 12, color: C.ink }}>{tn.t1}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Chip color={C.accent}>T2</Chip>
                <span style={{ fontSize: 12, color: C.ink }}>{tn.t2}</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>{tn.note[lang] || tn.note.en}</p>
          </Card>
        ))}
      </div>

      <h3 style={{ color: C.navy, fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>{t('norwegianMentorModule.pronunciation.soundsTitle')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {data.sounds.map((s, i) => (
          <Card key={i} accent={C.navy}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: 'monospace' }}>{s.sound}</span>
              {s.ipa && <Chip color={C.inkSoft} light="#f1f5f9" border={C.border} style={{ fontFamily: 'monospace' }}>/{s.ipa}/</Chip>}
              <SpeakBtn text={(s.example || '').split(' ')[0].replace(/[(),]/g, '')} tts={tts} style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ fontSize: 12, color: C.ink, fontStyle: 'italic', margin: '0 0 6px' }}>{s.example}</p>
            <p style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>{s.tip[lang] || s.tip.en}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Grammatikk
// ═══════════════════════════════════════════════════════════════════════════════
const TabGrammar = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [points, setPoints] = useState([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/grammar/path`).then(r => r.json()).then(d => setPoints(d.items || [])); }, []);
  if (points.length === 0) return loadingP(t('norwegianMentorModule.common.loading'));
  const cur = points[idx];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('norwegianMentorModule.tabs.grammar')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.grammar.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14 }}>{t('norwegianMentorModule.grammar.subtitle')}</p>
      <p style={{ fontSize: 11, color: C.inkSoft, fontFamily: 'monospace', marginBottom: 14 }}>{t('norwegianMentorModule.grammar.of', { n: idx + 1, total: points.length })}</p>
      <Card accent={C.accent} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: C.accent, margin: 0 }}>{cur.title}</p>
          <Chip color={cur.level === 'advanced' ? C.accent : C.navy} light={cur.level === 'advanced' ? C.accentLight : C.navyLight} border={cur.level === 'advanced' ? C.accentBorder : C.navyBorder}>{t(`norwegianMentorModule.grammar.levels.${cur.level}`, { defaultValue: cur.level })}</Chip>
        </div>
        <p style={{ fontSize: 13, color: C.ink, fontFamily: 'monospace', padding: '8px 10px', background: C.navyLight, borderRadius: 6 }}>{cur.pattern}</p>
      </Card>
      <Card accent={C.navy} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{t('norwegianMentorModule.grammar.explanation')}</p>
        <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.65, margin: 0 }}>{cur.explanation[lang] || cur.explanation.en}</p>
      </Card>
      <Card accent={C.gold} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t('norwegianMentorModule.grammar.examples')}</p>
        {cur.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: i < cur.examples.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>{ex.no}</p>
              {ex.gloss && <p style={{ fontSize: 11, color: C.inkSoft, fontStyle: 'italic', margin: '2px 0 0' }}>{ex.gloss}</p>}
            </div>
            <SpeakBtn text={ex.no} tts={tts} />
          </div>
        ))}
      </Card>
      <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder, marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>⚠ {t('norwegianMentorModule.grammar.commonMistake')}</p>
        <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>{cur.commonMistake[lang] || cur.commonMistake.en}</p>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← {t('norwegianMentorModule.grammar.prev')}</Button>
        <Button primary onClick={() => setIdx(Math.min(points.length - 1, idx + 1))} disabled={idx === points.length - 1}>{t('norwegianMentorModule.grammar.next')} →</Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Småord
// ═══════════════════════════════════════════════════════════════════════════════
const TabSmaord = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [items, setItems] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/smaord`).then(r => r.json()).then(d => setItems(d.items || [])); }, []);
  if (!items) return loadingP(t('norwegianMentorModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('norwegianMentorModule.tabs.smaord')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.smaord.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('norwegianMentorModule.smaord.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {items.map((s, i) => (
          <Card key={i} accent="#7c3aed">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#6b21a8' }}>{s.word}</span>
              <SpeakBtn text={s.word} tts={tts} />
            </div>
            <p style={{ fontSize: 13, color: C.ink, margin: '0 0 6px' }}>{s.meaning[lang] || s.meaning.en}</p>
            <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>{s.example}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Vocabulary SRS
// ═══════════════════════════════════════════════════════════════════════════════
const TabVocabulary = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const loadDue = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/norwegian/srs/due?limit=20`).then(r => r.json()).then(d => {
      setCards(d.items || []); setIdx(0); setRevealed(false); setLoading(false); setDone((d.items || []).length === 0);
    });
  }, []);
  useEffect(() => { loadDue(); }, [loadDue]);
  const grade = async (g) => {
    const cur = cards[idx]; if (!cur) return;
    await fetch(`${API_BASE}/api/norwegian/srs/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vocab_id: cur.id, grade: g }) });
    if (idx + 1 < cards.length) { setIdx(idx + 1); setRevealed(false); } else setDone(true);
  };
  if (loading) return loadingP(t('norwegianMentorModule.common.loading'));
  if (done || cards.length === 0) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <SectionLabel index={5} label={t('norwegianMentorModule.tabs.vocabulary')} />
        <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder, marginTop: 12 }}>
          <p style={{ fontSize: 18, color: C.accent, margin: 0, fontWeight: 700 }}>🎉 {t('norwegianMentorModule.vocabulary.endOfSession')}</p>
        </Card>
        <Button onClick={loadDue} style={{ marginTop: 18 }}>{t('norwegianMentorModule.common.retry')}</Button>
      </div>
    );
  }
  const cur = cards[idx];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('norwegianMentorModule.tabs.vocabulary')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.vocabulary.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('norwegianMentorModule.vocabulary.subtitle')}</p>
      <p style={{ fontSize: 11, color: C.inkSoft, fontFamily: 'monospace', marginBottom: 10 }}>
        {idx + 1} / {cards.length} · {cur.is_new ? <Chip color={C.accent}>{t('norwegianMentorModule.vocabulary.newCard')}</Chip> : <span>{t('norwegianMentorModule.vocabulary.stage')} {cur.stage}</span>}
      </p>
      <Card accent={C.navy} style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 18 }}>
        <p style={{ fontSize: 34, fontWeight: 800, color: C.navy, margin: 0 }}>{cur.word}</p>
        <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: '4px 0 0' }}>{cur.pos} · {cur.level}</p>
        <SpeakBtn text={cur.word} tts={tts} style={{ marginTop: 8, fontSize: 22 }} />
        {revealed && (<>
          <p style={{ fontSize: 17, color: C.green, marginTop: 12, fontWeight: 600 }}>{cur.meaning[lang] || cur.meaning.en}</p>
          <p style={{ fontSize: 13, color: C.ink, fontStyle: 'italic', marginTop: 8 }}>{cur.example}</p>
        </>)}
      </Card>
      {!revealed ? (
        <Button primary onClick={() => setRevealed(true)} style={{ width: '100%' }}>{t('norwegianMentorModule.vocabulary.showAnswer')}</Button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <Button onClick={() => grade('again')} style={{ background: C.accentLight, color: C.accent, border: `1px solid ${C.accentBorder}` }}>{t('norwegianMentorModule.vocabulary.again')}</Button>
          <Button onClick={() => grade('good')} style={{ background: C.navyLight, color: C.navy, border: `1px solid ${C.navyBorder}` }}>{t('norwegianMentorModule.vocabulary.good')}</Button>
          <Button onClick={() => grade('easy')} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>{t('norwegianMentorModule.vocabulary.easy')}</Button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Germanic Bridge
// ═══════════════════════════════════════════════════════════════════════════════
const TabBridge = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [data, setData] = useState(null);
  const [view, setView] = useState('false');
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/bridge`).then(r => r.json()).then(setData); }, []);
  if (!data) return loadingP(t('norwegianMentorModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={6} label={t('norwegianMentorModule.tabs.bridge')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.bridge.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('norwegianMentorModule.bridge.subtitle')}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <Button primary={view === 'false'} onClick={() => setView('false')}>{t('norwegianMentorModule.bridge.tabFalse')}</Button>
        <Button primary={view === 'cognates'} onClick={() => setView('cognates')}>{t('norwegianMentorModule.bridge.tabCognates')}</Button>
      </div>
      {view === 'false' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {data.false_friends.map((f, i) => (
            <Card key={i} accent={C.accent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 19, fontWeight: 900, color: C.accent }}>{f.no}</span>
                <SpeakBtn text={f.no} tts={tts} />
                {f.en_looks && f.en_looks !== '(none)' && <span style={{ marginLeft: 'auto' }}><Chip color={C.gold} light={C.goldLight} border={C.goldBorder}>≈ EN “{f.en_looks}”</Chip></span>}
              </div>
              <p style={{ fontSize: 13, color: C.ink, margin: '0 0 6px' }}><strong style={{ color: C.green }}>{f.no}</strong> = {f.actual[lang] || f.actual.en}</p>
              <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{f.example}</p>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {data.cognates.map((c, i) => (
            <Card key={i} accent={C.green}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{c.no}</span>
                <span style={{ color: C.inkSoft }}>≈</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{c.en}</span>
                <SpeakBtn text={c.no} tts={tts} style={{ marginLeft: 'auto' }} />
              </div>
              <p style={{ fontSize: 11, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{c.note[lang] || c.note.en}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conversation
// ═══════════════════════════════════════════════════════════════════════════════
const TabConversation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState('smalltalk');
  const [difficulty, setDifficulty] = useState('b2');
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [last, setLast] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/conversation/scenarios?lang=${lang}`).then(r => r.json()).then(d => setScenarios(d.scenarios || [])); }, [lang]);
  const start = async () => {
    setStarted(true); setHistory([]);
    const r = await fetch(`${API_BASE}/api/norwegian/conversation/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, difficulty, history: [], lang }) });
    const d = await r.json(); setLast(d); setHistory([{ role: 'assistant', content: d.reply }]);
  };
  const send = async () => {
    if (!input.trim()) return;
    const newHist = [...history, { role: 'user', content: input }];
    setHistory(newHist); setInput(''); setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/norwegian/conversation/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, difficulty, history: newHist, user_text: input, lang }) });
      const d = await r.json(); setLast(d); setHistory([...newHist, { role: 'assistant', content: d.reply }]);
    } catch (e) { /* noop */ }
    setSending(false);
  };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={7} label={t('norwegianMentorModule.tabs.conversation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.conversation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('norwegianMentorModule.conversation.subtitle')}</p>
      {!started ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <label style={sublabel}>{t('norwegianMentorModule.conversation.scenario')}</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={selectStyle}>{scenarios.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </div>
          <div>
            <label style={sublabel}>{t('norwegianMentorModule.conversation.difficulty')}</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
              <option value="b1">B1</option>
              <option value="b2">B2</option>
              <option value="c1">C1</option>
            </select>
          </div>
          <Button primary onClick={start}>{t('norwegianMentorModule.conversation.startBtn')}</Button>
        </div>
      ) : (<>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, maxHeight: 380, overflowY: 'auto', marginBottom: 14 }}>
          {history.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ background: msg.role === 'user' ? C.navy : C.accentLight, color: msg.role === 'user' ? '#fff' : C.ink, border: msg.role === 'user' ? 'none' : `1px solid ${C.accentBorder}`, borderRadius: 14, padding: '8px 12px', maxWidth: '75%', fontSize: 14 }}>{msg.content}</div>
            </div>
          ))}
          {last && (
            <Card accent={C.accent} style={{ marginTop: 10, background: C.accentLight, borderColor: C.accentBorder }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                {last.translation && <span style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic' }}>{last.translation}</span>}
                <SpeakBtn text={last.reply} tts={tts} style={{ marginLeft: 'auto' }} />
              </div>
              {last.correction && (<div style={{ marginBottom: 6 }}>
                <span style={miniLabel(C.accent)}>✎ {t('norwegianMentorModule.conversation.correction')}</span>
                <p style={{ fontSize: 12, color: '#7f1d1d', margin: '2px 0 0', fontStyle: 'italic' }}>{last.correction}</p>
              </div>)}
              {last.upgrade && (<div style={{ marginBottom: 6 }}>
                <span style={miniLabel(C.green)}>▲ {t('norwegianMentorModule.conversation.upgrade')}</span>
                <p style={{ fontSize: 13, color: C.green, margin: '2px 0 0', fontWeight: 600 }}>{last.upgrade}</p>
              </div>)}
              {last.tip && (<div>
                <span style={miniLabel(C.gold)}>💡 {t('norwegianMentorModule.conversation.tip')}</span>
                <p style={{ fontSize: 12, color: '#92400e', margin: '2px 0 0', fontStyle: 'italic' }}>{last.tip}</p>
              </div>)}
            </Card>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={t('norwegianMentorModule.conversation.yourReply')} style={{ flex: 1, padding: '12px 14px', fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 10 }} />
          <Button primary onClick={send} disabled={sending}>{sending ? t('norwegianMentorModule.conversation.sending') : t('norwegianMentorModule.conversation.send')}</Button>
        </div>
        <Button onClick={() => { setStarted(false); setHistory([]); setLast(null); }} style={{ marginTop: 10 }}>{t('norwegianMentorModule.conversation.newConversation')}</Button>
      </>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Writing & Style
// ═══════════════════════════════════════════════════════════════════════════════
const TabWriting = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const [text, setText] = useState('');
  const [register, setRegister] = useState('neutral');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/norwegian/writing/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, register, lang }) });
      setResult(await r.json());
    } catch (e) { setResult({ error: 'network' }); }
    setLoading(false);
  };
  const typeColor = { word_order: C.accent, gender: '#7c3aed', definite_form: C.navy, verb: C.gold, preposition: '#0891b2', word_choice: C.gold, naturalness: C.green };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={8} label={t('norwegianMentorModule.tabs.writing')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.writing.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('norwegianMentorModule.writing.subtitle')}</p>
      <Card accent={C.accent} style={{ marginBottom: 16 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder={t('norwegianMentorModule.writing.placeholder')}
                  style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: C.inkSoft }}>{t('norwegianMentorModule.writing.register')}:</label>
          <select value={register} onChange={e => setRegister(e.target.value)} style={{ ...selectStyle, width: 'auto', padding: '6px 10px' }}>
            <option value="formal">{t('norwegianMentorModule.writing.registers.formal')}</option>
            <option value="neutral">{t('norwegianMentorModule.writing.registers.neutral')}</option>
            <option value="informal">{t('norwegianMentorModule.writing.registers.informal')}</option>
          </select>
          <Button primary onClick={analyze} disabled={loading || !text.trim()} style={{ marginLeft: 'auto' }}>{loading ? t('norwegianMentorModule.writing.analyzing') : `✍ ${t('norwegianMentorModule.writing.analyzeBtn')}`}</Button>
        </div>
      </Card>
      {result && result.error && <Card accent={C.accent} style={{ background: C.accentLight }}><p style={{ color: C.accent, margin: 0 }}>{t('norwegianMentorModule.common.error')}</p></Card>}
      {result && !result.error && (<>
        <Card accent={C.navy} style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip color={C.navy} light={C.navyLight} border={C.navyBorder}>CEFR: {result.cefr_estimate}</Chip>
          {result.is_mock && <Chip color={C.gold} light={C.goldLight} border={C.goldBorder}>MOCK</Chip>}
          <span style={{ fontSize: 13, color: C.inkSoft, flex: 1 }}>{result.summary}</span>
        </Card>
        {result.corrected && (
          <Card accent={C.green} style={{ marginBottom: 14, background: C.greenLight, borderColor: C.greenBorder }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>✓ {t('norwegianMentorModule.writing.corrected')}</p>
            <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>{result.corrected}</p>
          </Card>
        )}
        {result.issues && result.issues.length > 0 && (
          <Card accent={C.accent} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>⚠ {t('norwegianMentorModule.writing.issues')}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {result.issues.map((iss, i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#fafbff', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: C.accent, textDecoration: 'line-through' }}>{iss.original}</span>
                    <span style={{ color: C.inkSoft }}>→</span>
                    <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{iss.fix}</span>
                    <Chip color={typeColor[iss.type] || C.inkSoft} light="#f1f5f9" border={C.border} style={{ marginLeft: 'auto' }}>{t(`norwegianMentorModule.writing.types.${iss.type}`, { defaultValue: iss.type })}</Chip>
                  </div>
                  {iss.note && <p style={{ fontSize: 12, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{iss.note}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}
        {result.upgrades && result.upgrades.length > 0 && (
          <Card accent="#7c3aed">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>▲ {t('norwegianMentorModule.writing.upgrades')}</p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {result.upgrades.map((u, i) => <li key={i} style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{u}</li>)}
            </ul>
          </Card>
        )}
      </>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Kultur
// ═══════════════════════════════════════════════════════════════════════════════
const TabCulture = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useNorwegianTTS();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/norwegian/culture`).then(r => r.json()).then(d => { setNotes(d.items || []); if ((d.items || []).length) setActiveId(d.items[0].id); }); }, []);
  if (notes.length === 0) return loadingP(t('norwegianMentorModule.common.loading'));
  const cur = notes.find(n => n.id === activeId);
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={9} label={t('norwegianMentorModule.tabs.culture')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('norwegianMentorModule.culture.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('norwegianMentorModule.culture.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => {
            const isActive = n.id === activeId;
            return (
              <button key={n.id} onClick={() => setActiveId(n.id)} style={{
                background: isActive ? C.accentLight : C.card, border: `1px solid ${isActive ? C.accentBorder : C.border}`,
                borderLeft: `4px solid ${C.accent}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 22 }}>{n.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: 0 }}>{n.title.no}</p>
                  <p style={{ fontSize: 11, color: C.accent, fontWeight: 700, margin: '2px 0 0' }}>{n.title[lang] || n.title.en}</p>
                </div>
              </button>
            );
          })}
        </div>
        {cur && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 34 }}>{cur.emoji}</span>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: C.ink, margin: 0 }}>{cur.title.no}</p>
                  <p style={{ fontSize: 12, color: C.accent, margin: '2px 0 0' }}>{cur.title[lang] || cur.title.en}</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.65, margin: 0 }}>{cur.summary[lang] || cur.summary.en}</p>
            </Card>
            {cur.phrases && cur.phrases.length > 0 && (
              <Card accent={C.navy}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>🗣 {t('norwegianMentorModule.culture.phrases')}</p>
                {cur.phrases.map((ph, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{ph.no}</span>
                    <SpeakBtn text={ph.no} tts={tts} />
                    <span style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', marginLeft: 'auto' }}>{ph.en}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── shared styles ────────────────────────────────────────────────────────────
const selectStyle = { width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, color: C.ink, fontFamily: 'inherit' };
const sublabel = { display: 'block', fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 };
const miniLabel = (color) => ({ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em' });

// ═══════════════════════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════════════════════
const NorwegianMentor = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard',     label: t('norwegianMentorModule.tabs.dashboard'),     icon: '📋' },
    { id: 'pronunciation', label: t('norwegianMentorModule.tabs.pronunciation'), icon: '🎵' },
    { id: 'grammar',       label: t('norwegianMentorModule.tabs.grammar'),       icon: '📐' },
    { id: 'smaord',        label: t('norwegianMentorModule.tabs.smaord'),        icon: '💬' },
    { id: 'vocabulary',    label: t('norwegianMentorModule.tabs.vocabulary'),    icon: '📚' },
    { id: 'bridge',        label: t('norwegianMentorModule.tabs.bridge'),        icon: '🌉' },
    { id: 'conversation',  label: t('norwegianMentorModule.tabs.conversation'),  icon: '🗣' },
    { id: 'writing',       label: t('norwegianMentorModule.tabs.writing'),       icon: '✍' },
    { id: 'culture',       label: t('norwegianMentorModule.tabs.culture'),       icon: '🏔' },
  ];
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <TabDashboard onJump={setActiveTab} />;
      case 'pronunciation': return <TabPronunciation />;
      case 'grammar':       return <TabGrammar />;
      case 'smaord':        return <TabSmaord />;
      case 'vocabulary':    return <TabVocabulary />;
      case 'bridge':        return <TabBridge />;
      case 'conversation':  return <TabConversation />;
      case 'writing':       return <TabWriting />;
      case 'culture':       return <TabCulture />;
      default:              return <TabDashboard onJump={setActiveTab} />;
    }
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: 'inherit' }}>
      <div style={{ background: C.card, borderBottom: `2px solid ${C.border}`, padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('norwegianMentorModule.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('norwegianMentorModule.languageAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: '0 4px 14px rgba(186,12,47,0.25)' }}>🇳🇴</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1.15 }}>{t('norwegianMentorModule.title')}</h1>
            <p style={{ color: C.inkSoft, fontSize: 13, margin: '4px 0 0' }}>{t('norwegianMentorModule.tagline')}</p>
          </div>
        </div>
      </div>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
              color: isActive ? C.accent : C.inkSoft, fontWeight: isActive ? 800 : 600, padding: '14px 16px', fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 15 }}>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{renderContent()}</div>
    </div>
  );
};

export default NorwegianMentor;
