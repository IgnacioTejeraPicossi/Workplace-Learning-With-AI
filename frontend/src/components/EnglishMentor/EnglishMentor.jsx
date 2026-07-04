/**
 * English Mastery AI — V1
 * =======================
 * Advanced-English perfection tool for a Spanish speaker (C1 → C2).
 * NOT a script/alphabet learner — a nuance/collocation/pronunciation coach.
 *
 * 9 tabs: Dashboard · False Friends · Collocations · Phrasal Verbs & Idioms
 *         · Grammar Nuance · Pronunciation Lab · Vocabulary SRS
 *         · Conversation · Writing & Style
 *
 * Visual: British navy + crimson on a cool cream. Icon 🇬🇧.
 * Backend: /api/english/*
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useEnglishTTS } from './useEnglishTTS';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => (lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en');

// ─── Design tokens (British navy + crimson) ───────────────────────────────────
const C = {
  bg:           'linear-gradient(160deg,#f0f4fa 0%,#fefefe 50%,#fdf2f4 100%)',
  card:         '#ffffff',
  border:       '#e2e8f0',
  ink:          '#0f172a',
  inkSoft:      '#475569',
  accent:       '#012169',   // Union Jack navy
  accentLight:  '#eff3fb',
  accentBorder: '#bfd0ec',
  red:          '#c8102e',   // Union Jack red
  redLight:     '#fef2f4',
  redBorder:    '#f4c2cc',
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
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accent}`, borderRadius: 12,
    padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style,
  }}>{children}</div>
);

const Stat = ({ label, value, max, color = C.accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`,
                borderTop: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px' }}>
    <p style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                marginBottom: 6, textTransform: 'uppercase' }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>
      {value ?? '—'}
      {max != null && <span style={{ fontSize: 13, color: C.inkSoft, marginLeft: 4 }}>/ {max}</span>}
    </p>
  </div>
);

const Button = ({ children, onClick, primary = false, disabled = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#e5e7eb' : primary ? `linear-gradient(135deg,${C.accent},#001344)` : C.card,
    color: disabled ? '#9ca3af' : primary ? '#fff' : C.ink,
    border: primary ? 'none' : `1px solid ${C.border}`,
    borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: primary ? '0 2px 8px rgba(1,33,105,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
    fontFamily: 'inherit', ...style,
  }}>{children}</button>
);

const Chip = ({ children, color = C.accent, light = C.accentLight, border = C.accentBorder, style = {} }) => (
  <span style={{ background: light, color, border: `1px solid ${border}`, borderRadius: 999,
                 padding: '2px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                 display: 'inline-flex', alignItems: 'center', ...style }}>{children}</span>
);

const SpeakBtn = ({ text, tts, accent = 'gb', style = {} }) => (
  <button onClick={() => tts.speak(text, { accent })} title={accent === 'us' ? 'US' : 'UK'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, padding: 2, ...style }}>
    🔊
  </button>
);

const loadingP = (msg) => <p style={{ textAlign: 'center', color: C.inkSoft, padding: 40 }}>{msg}</p>;

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TabDashboard = ({ onJump }) => {
  const { t } = useTranslation();
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_BASE}/api/english/overview`).then(r => r.json())
      .then(d => { setOv(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  if (loading) return loadingP(t('englishMentorModule.dashboard.loading'));
  if (!ov) return loadingP(t('englishMentorModule.common.error'));
  const { stats, todays_mission: mission, level, cefr_target, streak_days } = ov;
  const missionTarget = { falseFriends: 'falseFriends', collocations: 'collocations', phrasalVerbs: 'phrasalVerbs', srs: 'vocabulary', conversation: 'conversation' };
  const missionEmoji = { falseFriends: '⚠', collocations: '🔗', phrasalVerbs: '🧩', srs: '📚', conversation: '💬' };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('englishMentorModule.tabs.dashboard')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.dashboard.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('englishMentorModule.dashboard.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: C.accentLight, border: `1px solid ${C.accentBorder}`, borderTop: `3px solid ${C.accent}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('englishMentorModule.dashboard.level')}</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#001344' }}>{level}</p>
        </div>
        <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderTop: `3px solid ${C.red}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.red, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('englishMentorModule.dashboard.target')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#7f1d1d', fontFamily: 'monospace' }}>{cefr_target}</p>
        </div>
        <div style={{ background: '#f5f5f4', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.ink}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('englishMentorModule.dashboard.streak')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: C.ink, fontFamily: 'monospace' }}>🔥 {streak_days} <span style={{ fontSize: 12, color: C.inkSoft }}>{t('englishMentorModule.dashboard.days')}</span></p>
        </div>
      </div>
      <SectionLabel index={2} label="STATS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('englishMentorModule.dashboard.falseFriends')} value={stats.false_friends_total} color={C.red} />
        <Stat label={t('englishMentorModule.dashboard.collocations')} value={stats.collocations_total} color="#7c3aed" />
        <Stat label={t('englishMentorModule.dashboard.phrasalVerbs')} value={stats.phrasal_verbs_total} color={C.accent} />
        <Stat label={t('englishMentorModule.dashboard.vocabKnown')} value={stats.vocab_known} max={stats.vocab_total} color={C.green} />
        <Stat label={t('englishMentorModule.dashboard.srsDue')} value={stats.srs_due_today} color={C.gold} />
      </div>
      <SectionLabel index={3} label={t('englishMentorModule.dashboard.todaysMission')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {mission.map((m, i) => (
          <Card key={i} accent={['#c8102e', '#7c3aed', '#012169', '#15803d', '#b45309'][i % 5]}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div onClick={() => onJump?.(missionTarget[m.type])} style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{t(`englishMentorModule.dashboard.missionLabels.${m.type}`)}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: C.ink, fontFamily: 'monospace' }}>{m.count}</p>
            </div>
            <span style={{ fontSize: 22 }}>{missionEmoji[m.type] || '·'}</span>
          </Card>
        ))}
      </div>
      <Button primary onClick={() => onJump?.('falseFriends')}>{t('englishMentorModule.dashboard.continue')} →</Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: False Friends
// ═══════════════════════════════════════════════════════════════════════════════
const TabFalseFriends = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useEnglishTTS();
  const [items, setItems] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/english/false-friends`).then(r => r.json()).then(d => setItems(d.items || [])); }, []);
  if (!items) return loadingP(t('englishMentorModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('englishMentorModule.tabs.falseFriends')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.falseFriends.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('englishMentorModule.falseFriends.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {items.map((f, i) => (
          <Card key={i} accent={C.red}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>{f.en}</span>
              <SpeakBtn text={f.en} tts={tts} />
              <span style={{ marginLeft: 'auto' }}>
                <Chip color={C.red} light={C.redLight} border={C.redBorder}>≠ {f.es_trap}</Chip>
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.ink, margin: '0 0 6px' }}>
              <strong style={{ color: C.green }}>{f.en}</strong> = {f.actual[lang] || f.actual.en}
            </p>
            <p style={{ fontSize: 12, color: C.red, margin: '0 0 8px', lineHeight: 1.5 }}
               dangerouslySetInnerHTML={{ __html: (f.correct || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{f.example}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Collocations
// ═══════════════════════════════════════════════════════════════════════════════
const TabCollocations = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useEnglishTTS();
  const [items, setItems] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/english/collocations`).then(r => r.json()).then(d => setItems(d.items || [])); }, []);
  if (!items) return loadingP(t('englishMentorModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('englishMentorModule.tabs.collocations')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.collocations.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('englishMentorModule.collocations.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {items.map((co, i) => (
          <Card key={i} accent="#7c3aed">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.green }}>✓ {co.right}</span>
              <SpeakBtn text={co.right} tts={tts} />
            </div>
            <p style={{ fontSize: 13, color: C.red, margin: '0 0 8px', textDecoration: 'line-through', opacity: 0.75 }}>✗ {co.wrong}</p>
            <p style={{ fontSize: 12, color: C.inkSoft, margin: '0 0 6px', lineHeight: 1.5 }}>{co.note[lang] || co.note.en}</p>
            <p style={{ fontSize: 12, color: C.ink, fontStyle: 'italic', margin: 0 }}>{co.example}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Phrasal Verbs & Idioms
// ═══════════════════════════════════════════════════════════════════════════════
const TabPhrasalVerbs = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useEnglishTTS();
  const [view, setView] = useState('phrasal');
  const [pv, setPv] = useState(null);
  const [idioms, setIdioms] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/english/phrasal-verbs`).then(r => r.json()).then(d => setPv(d.items || []));
    fetch(`${API_BASE}/api/english/idioms`).then(r => r.json()).then(d => setIdioms(d.items || []));
  }, []);
  const regColor = { formal: C.accent, neutral: C.inkSoft, informal: C.gold };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('englishMentorModule.tabs.phrasalVerbs')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.phrasalVerbs.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('englishMentorModule.phrasalVerbs.subtitle')}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <Button primary={view === 'phrasal'} onClick={() => setView('phrasal')}>{t('englishMentorModule.phrasalVerbs.tabPhrasal')}</Button>
        <Button primary={view === 'idioms'} onClick={() => setView('idioms')}>{t('englishMentorModule.phrasalVerbs.tabIdioms')}</Button>
      </div>
      {view === 'phrasal' ? (
        !pv ? loadingP(t('englishMentorModule.common.loading')) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {pv.map((p, i) => (
              <Card key={i} accent={C.accent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: C.accent }}>{p.pv}</span>
                  <SpeakBtn text={p.pv} tts={tts} />
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    <Chip color={regColor[p.register]} light="#f1f5f9" border={C.border}>{t(`englishMentorModule.phrasalVerbs.register.${p.register}`)}</Chip>
                    {p.sep && <Chip color={C.green} light={C.greenLight} border={C.greenBorder}>{t('englishMentorModule.phrasalVerbs.separable')}</Chip>}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: C.ink, margin: '0 0 6px' }}>{p.meaning[lang] || p.meaning.en}</p>
                <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: 0 }}>{p.example}</p>
              </Card>
            ))}
          </div>
        )
      ) : (
        !idioms ? loadingP(t('englishMentorModule.common.loading')) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {idioms.map((id, i) => (
              <Card key={i} accent={C.gold}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>“{id.idiom}”</span>
                  <SpeakBtn text={id.idiom} tts={tts} />
                </div>
                <p style={{ fontSize: 13, color: C.ink, margin: '0 0 4px' }}>{id.meaning[lang] || id.meaning.en}</p>
                <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: 0 }}>{id.example}</p>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Grammar Nuance
// ═══════════════════════════════════════════════════════════════════════════════
const TabGrammar = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useEnglishTTS();
  const [points, setPoints] = useState([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => { fetch(`${API_BASE}/api/english/grammar/path`).then(r => r.json()).then(d => setPoints(d.items || [])); }, []);
  if (points.length === 0) return loadingP(t('englishMentorModule.common.loading'));
  const cur = points[idx];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('englishMentorModule.tabs.grammar')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.grammar.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14 }}>{t('englishMentorModule.grammar.subtitle')}</p>
      <p style={{ fontSize: 11, color: C.inkSoft, fontFamily: 'monospace', marginBottom: 14 }}>{t('englishMentorModule.grammar.of', { n: idx + 1, total: points.length })}</p>
      <Card accent={C.accent} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <p style={{ fontSize: 19, fontWeight: 900, color: C.accent, margin: 0 }}>{cur.title}</p>
          <Chip color={cur.level === 'C2' ? C.red : C.accent} light={cur.level === 'C2' ? C.redLight : C.accentLight} border={cur.level === 'C2' ? C.redBorder : C.accentBorder}>{cur.level}</Chip>
        </div>
        <p style={{ fontSize: 13, color: C.ink, fontFamily: 'monospace', padding: '8px 10px', background: C.accentLight, borderRadius: 6 }}>{cur.pattern}</p>
      </Card>
      <Card accent={C.red} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{t('englishMentorModule.grammar.explanation')}</p>
        <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.65, margin: 0 }}>{cur.explanation[lang] || cur.explanation.en}</p>
      </Card>
      <Card accent={C.gold} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t('englishMentorModule.grammar.examples')}</p>
        {cur.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: i < cur.examples.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.ink, margin: 0 }}>{ex.en}</p>
              {ex.note && <p style={{ fontSize: 11, color: C.inkSoft, fontStyle: 'italic', margin: '2px 0 0' }}>{ex.note}</p>}
            </div>
            <SpeakBtn text={ex.en} tts={tts} />
          </div>
        ))}
      </Card>
      <Card accent={C.red} style={{ background: C.redLight, borderColor: C.redBorder, marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>⚠ {t('englishMentorModule.grammar.commonMistake')}</p>
        <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>{cur.commonMistake[lang] || cur.commonMistake.en}</p>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← {t('englishMentorModule.grammar.prev')}</Button>
        <Button primary onClick={() => setIdx(Math.min(points.length - 1, idx + 1))} disabled={idx === points.length - 1}>{t('englishMentorModule.grammar.next')} →</Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Pronunciation Lab
// ═══════════════════════════════════════════════════════════════════════════════
const TabPronunciation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useEnglishTTS();
  const [pairs, setPairs] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/english/pronunciation/pairs`).then(r => r.json()).then(d => setPairs(d.items || [])); }, []);
  if (!pairs) return loadingP(t('englishMentorModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={6} label={t('englishMentorModule.tabs.pronunciation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.pronunciation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('englishMentorModule.pronunciation.subtitle')}</p>
      {tts.supported && !tts.enVoice && tts.voices.length > 0 && (
        <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderLeft: `4px solid ${C.gold}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#78350f' }}>
          ⚠ {t('englishMentorModule.pronunciation.noVoice')}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {pairs.map((p, i) => (
          <Card key={i} accent={C.accent}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: '0.06em', margin: '0 0 10px', fontFamily: 'monospace' }}>{p.group}</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120, background: C.accentLight, border: `1px solid ${C.accentBorder}`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{p.a}</span>
                  <SpeakBtn text={p.a} tts={tts} accent="gb" style={{ fontSize: 13 }} />
                  <SpeakBtn text={p.a} tts={tts} accent="us" style={{ fontSize: 11, opacity: 0.7 }} />
                </div>
                {p.ipa_a && <span style={{ fontSize: 12, color: C.inkSoft, fontFamily: 'monospace' }}>/{p.ipa_a}/</span>}
              </div>
              {p.b && p.b !== '—' && (
                <div style={{ flex: 1, minWidth: 120, background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{p.b}</span>
                    {!/[()—]/.test(p.b) && <SpeakBtn text={p.b.split(' ')[0]} tts={tts} accent="gb" style={{ fontSize: 13 }} />}
                  </div>
                  {p.ipa_b && p.ipa_b !== '—' && <span style={{ fontSize: 12, color: C.inkSoft, fontFamily: 'monospace' }}>/{p.ipa_b}/</span>}
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>{p.tip[lang] || p.tip.en}</p>
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
  const tts = useEnglishTTS();
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const loadDue = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/english/srs/due?limit=20`).then(r => r.json()).then(d => {
      setCards(d.items || []); setIdx(0); setRevealed(false); setLoading(false);
      setDone((d.items || []).length === 0);
    });
  }, []);
  useEffect(() => { loadDue(); }, [loadDue]);
  const grade = async (g) => {
    const cur = cards[idx]; if (!cur) return;
    await fetch(`${API_BASE}/api/english/srs/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vocab_id: cur.id, grade: g }) });
    if (idx + 1 < cards.length) { setIdx(idx + 1); setRevealed(false); } else setDone(true);
  };
  if (loading) return loadingP(t('englishMentorModule.common.loading'));
  if (done || cards.length === 0) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <SectionLabel index={7} label={t('englishMentorModule.tabs.vocabulary')} />
        <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder, marginTop: 12 }}>
          <p style={{ fontSize: 18, color: C.accent, margin: 0, fontWeight: 700 }}>🎉 {t('englishMentorModule.vocabulary.endOfSession')}</p>
        </Card>
        <Button onClick={loadDue} style={{ marginTop: 18 }}>{t('englishMentorModule.common.retry')}</Button>
      </div>
    );
  }
  const cur = cards[idx];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionLabel index={7} label={t('englishMentorModule.tabs.vocabulary')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.vocabulary.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('englishMentorModule.vocabulary.subtitle')}</p>
      <p style={{ fontSize: 11, color: C.inkSoft, fontFamily: 'monospace', marginBottom: 10 }}>
        {idx + 1} / {cards.length} · {cur.is_new ? <Chip color={C.red} light={C.redLight} border={C.redBorder}>{t('englishMentorModule.vocabulary.newCard')}</Chip> : <span>{t('englishMentorModule.vocabulary.stage')} {cur.stage}</span>}
      </p>
      <Card accent={C.accent} style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 18 }}>
        <p style={{ fontSize: 36, fontWeight: 800, color: C.accent, margin: 0 }}>{cur.word}</p>
        <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: '4px 0 0' }}>{cur.pos} · {cur.level}</p>
        <SpeakBtn text={cur.word} tts={tts} style={{ marginTop: 8, fontSize: 22 }} />
        {revealed && (<>
          <p style={{ fontSize: 17, color: C.green, marginTop: 12, fontWeight: 600 }}>{cur.meaning[lang] || cur.meaning.en}</p>
          <p style={{ fontSize: 13, color: C.ink, fontStyle: 'italic', marginTop: 8 }}>{cur.example}</p>
        </>)}
      </Card>
      {!revealed ? (
        <Button primary onClick={() => setRevealed(true)} style={{ width: '100%' }}>{t('englishMentorModule.vocabulary.showAnswer')}</Button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <Button onClick={() => grade('again')} style={{ background: C.redLight, color: C.red, border: `1px solid ${C.redBorder}` }}>{t('englishMentorModule.vocabulary.again')}</Button>
          <Button onClick={() => grade('good')} style={{ background: C.accentLight, color: C.accent, border: `1px solid ${C.accentBorder}` }}>{t('englishMentorModule.vocabulary.good')}</Button>
          <Button onClick={() => grade('easy')} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>{t('englishMentorModule.vocabulary.easy')}</Button>
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
  const tts = useEnglishTTS();
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState('smalltalk');
  const [difficulty, setDifficulty] = useState('c1');
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [last, setLast] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/english/conversation/scenarios?lang=${lang}`).then(r => r.json()).then(d => setScenarios(d.scenarios || [])); }, [lang]);
  const start = async () => {
    setStarted(true); setHistory([]);
    const r = await fetch(`${API_BASE}/api/english/conversation/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, difficulty, history: [], lang }) });
    const d = await r.json(); setLast(d); setHistory([{ role: 'assistant', content: d.reply }]);
  };
  const send = async () => {
    if (!input.trim()) return;
    const newHist = [...history, { role: 'user', content: input }];
    setHistory(newHist); setInput(''); setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/english/conversation/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, difficulty, history: newHist, user_text: input, lang }) });
      const d = await r.json(); setLast(d); setHistory([...newHist, { role: 'assistant', content: d.reply }]);
    } catch (e) { /* noop */ }
    setSending(false);
  };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={8} label={t('englishMentorModule.tabs.conversation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.conversation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('englishMentorModule.conversation.subtitle')}</p>
      {!started ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <label style={sublabel}>{t('englishMentorModule.conversation.scenario')}</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={selectStyle}>{scenarios.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </div>
          <div>
            <label style={sublabel}>{t('englishMentorModule.conversation.difficulty')}</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
              <option value="c1">C1</option>
              <option value="c2">C2</option>
            </select>
          </div>
          <Button primary onClick={start}>{t('englishMentorModule.conversation.startBtn')}</Button>
        </div>
      ) : (<>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, maxHeight: 380, overflowY: 'auto', marginBottom: 14 }}>
          {history.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ background: msg.role === 'user' ? C.accent : C.accentLight, color: msg.role === 'user' ? '#fff' : C.ink, border: msg.role === 'user' ? 'none' : `1px solid ${C.accentBorder}`, borderRadius: 14, padding: '8px 12px', maxWidth: '75%', fontSize: 14 }}>{msg.content}</div>
            </div>
          ))}
          {last && (
            <Card accent={C.accent} style={{ marginTop: 10, background: C.accentLight, borderColor: C.accentBorder }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <Chip color={C.accent}>{t(`englishMentorModule.conversation.registerLabel.${last.register}`, { defaultValue: last.register })}</Chip>
                <SpeakBtn text={last.reply} tts={tts} style={{ marginLeft: 'auto' }} />
              </div>
              {last.correction && (<div style={{ marginBottom: 6 }}>
                <span style={miniLabel(C.red)}>✎ {t('englishMentorModule.conversation.correction')}</span>
                <p style={{ fontSize: 12, color: '#7f1d1d', margin: '2px 0 0', fontStyle: 'italic' }}>{last.correction}</p>
              </div>)}
              {last.upgrade && (<div style={{ marginBottom: 6 }}>
                <span style={miniLabel(C.green)}>▲ {t('englishMentorModule.conversation.upgrade')}</span>
                <p style={{ fontSize: 13, color: C.green, margin: '2px 0 0', fontWeight: 600 }}>{last.upgrade}</p>
              </div>)}
              {last.tip && (<div>
                <span style={miniLabel(C.gold)}>💡 {t('englishMentorModule.conversation.tip')}</span>
                <p style={{ fontSize: 12, color: '#92400e', margin: '2px 0 0', fontStyle: 'italic' }}>{last.tip}</p>
              </div>)}
            </Card>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={t('englishMentorModule.conversation.yourReply')} style={{ flex: 1, padding: '12px 14px', fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 10 }} />
          <Button primary onClick={send} disabled={sending}>{sending ? t('englishMentorModule.conversation.sending') : t('englishMentorModule.conversation.send')}</Button>
        </div>
        <Button onClick={() => { setStarted(false); setHistory([]); setLast(null); }} style={{ marginTop: 10 }}>{t('englishMentorModule.conversation.newConversation')}</Button>
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
      const r = await fetch(`${API_BASE}/api/english/writing/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, register, lang }) });
      setResult(await r.json());
    } catch (e) { setResult({ error: 'network' }); }
    setLoading(false);
  };
  const typeColor = { grammar: C.red, collocation: '#7c3aed', register: C.accent, word_choice: C.gold, naturalness: C.green };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={9} label={t('englishMentorModule.tabs.writing')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('englishMentorModule.writing.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('englishMentorModule.writing.subtitle')}</p>
      <Card accent={C.accent} style={{ marginBottom: 16 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder={t('englishMentorModule.writing.placeholder')}
                  style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: C.inkSoft }}>{t('englishMentorModule.writing.register')}:</label>
          <select value={register} onChange={e => setRegister(e.target.value)} style={{ ...selectStyle, width: 'auto', padding: '6px 10px' }}>
            <option value="formal">{t('englishMentorModule.phrasalVerbs.register.formal')}</option>
            <option value="neutral">{t('englishMentorModule.phrasalVerbs.register.neutral')}</option>
            <option value="informal">{t('englishMentorModule.phrasalVerbs.register.informal')}</option>
          </select>
          <Button primary onClick={analyze} disabled={loading || !text.trim()} style={{ marginLeft: 'auto' }}>{loading ? t('englishMentorModule.writing.analyzing') : `✍ ${t('englishMentorModule.writing.analyzeBtn')}`}</Button>
        </div>
      </Card>
      {result && result.error && <Card accent={C.red} style={{ background: C.redLight }}><p style={{ color: C.red, margin: 0 }}>{t('englishMentorModule.common.error')}</p></Card>}
      {result && !result.error && (<>
        <Card accent={C.accent} style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip color={C.accent}>CEFR: {result.cefr_estimate}</Chip>
          {result.is_mock && <Chip color={C.gold} light={C.goldLight} border={C.goldBorder}>MOCK</Chip>}
          <span style={{ fontSize: 13, color: C.inkSoft, flex: 1 }}>{result.summary}</span>
        </Card>
        {result.corrected && (
          <Card accent={C.green} style={{ marginBottom: 14, background: C.greenLight, borderColor: C.greenBorder }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>✓ {t('englishMentorModule.writing.corrected')}</p>
            <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>{result.corrected}</p>
          </Card>
        )}
        {result.issues && result.issues.length > 0 && (
          <Card accent={C.red} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>⚠ {t('englishMentorModule.writing.issues')}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {result.issues.map((iss, i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#fafbff', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: C.red, textDecoration: 'line-through' }}>{iss.original}</span>
                    <span style={{ color: C.inkSoft }}>→</span>
                    <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{iss.fix}</span>
                    <Chip color={typeColor[iss.type] || C.inkSoft} light="#f1f5f9" border={C.border} style={{ marginLeft: 'auto' }}>{t(`englishMentorModule.writing.types.${iss.type}`, { defaultValue: iss.type })}</Chip>
                  </div>
                  {iss.note && <p style={{ fontSize: 12, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{iss.note}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}
        {result.upgrades && result.upgrades.length > 0 && (
          <Card accent="#7c3aed">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>▲ {t('englishMentorModule.writing.upgrades')}</p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {result.upgrades.map((u, i) => <li key={i} style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{u}</li>)}
            </ul>
          </Card>
        )}
      </>)}
    </div>
  );
};

// ─── shared input styles ──────────────────────────────────────────────────────
const selectStyle = { width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, color: C.ink, fontFamily: 'inherit' };
const sublabel = { display: 'block', fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 };
const miniLabel = (color) => ({ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em' });

// ═══════════════════════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════════════════════
const EnglishMentor = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard',     label: t('englishMentorModule.tabs.dashboard'),     icon: '📋' },
    { id: 'falseFriends',  label: t('englishMentorModule.tabs.falseFriends'),  icon: '⚠' },
    { id: 'collocations',  label: t('englishMentorModule.tabs.collocations'),  icon: '🔗' },
    { id: 'phrasalVerbs',  label: t('englishMentorModule.tabs.phrasalVerbs'),  icon: '🧩' },
    { id: 'grammar',       label: t('englishMentorModule.tabs.grammar'),       icon: '📐' },
    { id: 'pronunciation', label: t('englishMentorModule.tabs.pronunciation'), icon: '🗣' },
    { id: 'vocabulary',    label: t('englishMentorModule.tabs.vocabulary'),    icon: '📚' },
    { id: 'conversation',  label: t('englishMentorModule.tabs.conversation'),  icon: '💬' },
    { id: 'writing',       label: t('englishMentorModule.tabs.writing'),       icon: '✍' },
  ];
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <TabDashboard onJump={setActiveTab} />;
      case 'falseFriends':  return <TabFalseFriends />;
      case 'collocations':  return <TabCollocations />;
      case 'phrasalVerbs':  return <TabPhrasalVerbs />;
      case 'grammar':       return <TabGrammar />;
      case 'pronunciation': return <TabPronunciation />;
      case 'vocabulary':    return <TabVocabulary />;
      case 'conversation':  return <TabConversation />;
      case 'writing':       return <TabWriting />;
      default:              return <TabDashboard onJump={setActiveTab} />;
    }
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: 'inherit' }}>
      <div style={{ background: C.card, borderBottom: `2px solid ${C.border}`, padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('englishMentorModule.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('englishMentorModule.languageAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.red})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: '0 4px 14px rgba(1,33,105,0.25)' }}>🇬🇧</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1.15 }}>{t('englishMentorModule.title')}</h1>
            <p style={{ color: C.inkSoft, fontSize: 13, margin: '4px 0 0' }}>{t('englishMentorModule.tagline')}</p>
          </div>
        </div>
      </div>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
              color: isActive ? C.accent : C.inkSoft, fontWeight: isActive ? 800 : 600,
              padding: '14px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', whiteSpace: 'nowrap',
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

export default EnglishMentor;
