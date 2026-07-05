/**
 * Spanish Teacher AI — V1
 * =======================
 * Teaches Spanish to non-native learners, with the project owner (a native
 * Spanish speaker) as the model — the ideal home for the Voicebox cloned
 * voice (a native Spanish clone IS a correct pronunciation model).
 *
 * 9 tabs: Panel · Pronunciación · Gramática · Conjugación · Vocabulario SRS
 *         · Falsos Amigos · Conversación · Escritura · Cultura
 *
 * Visual: Spanish-flag red + gold on warm cream. Icon 🇪🇸.
 * Backend: /api/spanish/*
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpanishTTS } from './useSpanishTTS';
import { useVoiceEngine } from '../shared/useVoiceEngine';
import VoiceSelector from '../shared/VoiceSelector';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => (lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en');

const VoiceCtx = createContext(null);
const useVoice = () => useContext(VoiceCtx);

// ─── Design tokens (Spanish flag red + gold) ──────────────────────────────────
const C = {
  bg:           'linear-gradient(160deg,#fdf3f2 0%,#fffef8 50%,#fdf9ec 100%)',
  card:         '#ffffff',
  border:       '#e7e2d8',
  ink:          '#1c1917',
  inkSoft:      '#57534e',
  accent:       '#aa151b',   // Spanish flag red
  accentLight:  '#fdf2f2',
  accentBorder: '#f4c4c4',
  gold:         '#c8890b',   // Spanish flag gold (darkened for contrast)
  goldLight:    '#fdf8ea',
  goldBorder:   '#f0d896',
  green:        '#15803d',
  greenLight:   '#f0fdf4',
  greenBorder:  '#86efac',
  navy:         '#1e3a8a',
  navyLight:    '#eff2fb',
  navyBorder:   '#bcccea',
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
    <p style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{value ?? '—'}{max != null && <span style={{ fontSize: 13, color: C.inkSoft, marginLeft: 4 }}>/ {max}</span>}</p>
  </div>
);
const Button = ({ children, onClick, primary = false, disabled = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#e5e7eb' : primary ? `linear-gradient(135deg,${C.accent},#7f1013)` : C.card,
    color: disabled ? '#9ca3af' : primary ? '#fff' : C.ink, border: primary ? 'none' : `1px solid ${C.border}`,
    borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: primary ? '0 2px 8px rgba(170,21,27,0.25)' : '0 1px 2px rgba(0,0,0,0.04)', fontFamily: 'inherit', ...style,
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

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TabDashboard = ({ onJump }) => {
  const { t } = useTranslation();
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/overview`).then(r => r.json()).then(d => { setOv(d); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return loadingP(t('spanishTeacherModule.dashboard.loading'));
  if (!ov) return loadingP(t('spanishTeacherModule.common.error'));
  const { stats, todays_mission: mission, level, cefr_target, streak_days } = ov;
  const missionTarget = { pronunciacion: 'pronunciation', gramatica: 'grammar', conjugacion: 'conjugation', srs: 'vocabulary', conversacion: 'conversation' };
  const missionEmoji = { pronunciacion: '🗣', gramatica: '📐', conjugacion: '🔤', srs: '📚', conversacion: '💬' };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('spanishTeacherModule.tabs.dashboard')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.dashboard.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('spanishTeacherModule.dashboard.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: C.accentLight, border: `1px solid ${C.accentBorder}`, borderTop: `3px solid ${C.accent}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('spanishTeacherModule.dashboard.level')}</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#7f1d1d' }}>{level}</p>
        </div>
        <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderTop: `3px solid ${C.gold}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.gold, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('spanishTeacherModule.dashboard.target')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#78350f', fontFamily: 'monospace' }}>{cefr_target}</p>
        </div>
        <div style={{ background: '#f5f5f4', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.ink}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: C.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('spanishTeacherModule.dashboard.streak')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: C.ink, fontFamily: 'monospace' }}>🔥 {streak_days} <span style={{ fontSize: 12, color: C.inkSoft }}>{t('spanishTeacherModule.dashboard.days')}</span></p>
        </div>
      </div>
      <SectionLabel index={2} label="STATS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('spanishTeacherModule.dashboard.sounds')} value={stats.sounds_total} color={C.accent} />
        <Stat label={t('spanishTeacherModule.dashboard.grammar')} value={stats.grammar_total} color={C.gold} />
        <Stat label={t('spanishTeacherModule.dashboard.conjugation')} value={stats.conjugation_total} color={C.navy} />
        <Stat label={t('spanishTeacherModule.dashboard.vocabKnown')} value={stats.vocab_known} max={stats.vocab_total} color={C.green} />
        <Stat label={t('spanishTeacherModule.dashboard.falseFriends')} value={stats.false_friends_total} color="#7c3aed" />
      </div>
      <SectionLabel index={3} label={t('spanishTeacherModule.dashboard.todaysMission')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {mission.map((m, i) => (
          <Card key={i} accent={['#aa151b', '#c8890b', '#1e3a8a', '#15803d', '#7c3aed'][i % 5]}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div onClick={() => onJump?.(missionTarget[m.type])} style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{t(`spanishTeacherModule.dashboard.missionLabels.${m.type}`)}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: C.ink, fontFamily: 'monospace' }}>{m.count}</p>
            </div>
            <span style={{ fontSize: 22 }}>{missionEmoji[m.type] || '·'}</span>
          </Card>
        ))}
      </div>
      <Button primary onClick={() => onJump?.('pronunciation')}>{t('spanishTeacherModule.dashboard.continue')} →</Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Pronunciación
// ═══════════════════════════════════════════════════════════════════════════════
const TabPronunciation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [items, setItems] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/pronunciation`).then(r => r.json()).then(d => setItems(d.items || [])); }, []);
  if (!items) return loadingP(t('spanishTeacherModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('spanishTeacherModule.tabs.pronunciation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.pronunciation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('spanishTeacherModule.pronunciation.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {items.map((s, i) => (
          <Card key={i} accent={C.accent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: C.accent }}>{s.sound}</span>
              {s.ipa && <Chip color={C.inkSoft} light="#f1f5f9" border={C.border} style={{ fontFamily: 'monospace' }}>/{s.ipa}/</Chip>}
              <SpeakBtn text={(s.example || '').split('·').pop().split(',')[0].trim()} tts={tts} style={{ marginLeft: 'auto' }} />
            </div>
            <p style={{ fontSize: 13, color: C.ink, fontStyle: 'italic', margin: '0 0 6px' }}>{s.example}</p>
            <p style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>{s.tip[lang] || s.tip.en}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Gramática
// ═══════════════════════════════════════════════════════════════════════════════
const TabGrammar = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [points, setPoints] = useState([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/grammar/path`).then(r => r.json()).then(d => setPoints(d.items || [])); }, []);
  if (points.length === 0) return loadingP(t('spanishTeacherModule.common.loading'));
  const cur = points[idx];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('spanishTeacherModule.tabs.grammar')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.grammar.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14 }}>{t('spanishTeacherModule.grammar.subtitle')}</p>
      <p style={{ fontSize: 11, color: C.inkSoft, fontFamily: 'monospace', marginBottom: 14 }}>{t('spanishTeacherModule.grammar.of', { n: idx + 1, total: points.length })}</p>
      <Card accent={C.accent} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 19, fontWeight: 900, color: C.accent, margin: 0 }}>{cur.title}</p>
          <Chip color={cur.level === 'advanced' ? C.accent : C.gold} light={cur.level === 'advanced' ? C.accentLight : C.goldLight} border={cur.level === 'advanced' ? C.accentBorder : C.goldBorder}>{t(`spanishTeacherModule.grammar.levels.${cur.level}`, { defaultValue: cur.level })}</Chip>
        </div>
        <p style={{ fontSize: 13, color: C.ink, fontFamily: 'monospace', padding: '8px 10px', background: C.goldLight, borderRadius: 6 }}>{cur.pattern}</p>
      </Card>
      <Card accent={C.gold} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{t('spanishTeacherModule.grammar.explanation')}</p>
        <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.65, margin: 0 }}>{cur.explanation[lang] || cur.explanation.en}</p>
      </Card>
      <Card accent={C.navy} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>{t('spanishTeacherModule.grammar.examples')}</p>
        {cur.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: i < cur.examples.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.accent, margin: 0 }}>{ex.es}</p>
              {ex.gloss && <p style={{ fontSize: 11, color: C.inkSoft, fontStyle: 'italic', margin: '2px 0 0' }}>{ex.gloss}</p>}
            </div>
            <SpeakBtn text={ex.es} tts={tts} />
          </div>
        ))}
      </Card>
      <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder, marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>⚠ {t('spanishTeacherModule.grammar.commonMistake')}</p>
        <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>{cur.commonMistake[lang] || cur.commonMistake.en}</p>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← {t('spanishTeacherModule.grammar.prev')}</Button>
        <Button primary onClick={() => setIdx(Math.min(points.length - 1, idx + 1))} disabled={idx === points.length - 1}>{t('spanishTeacherModule.grammar.next')} →</Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conjugación
// ═══════════════════════════════════════════════════════════════════════════════
const TENSES = ['presente', 'pretérito', 'imperfecto', 'futuro', 'subjuntivo'];
const TabConjugation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [data, setData] = useState(null);
  const [vi, setVi] = useState(0);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/conjugation`).then(r => r.json()).then(setData); }, []);
  if (!data) return loadingP(t('spanishTeacherModule.common.loading'));
  const verb = data.verbs[vi];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('spanishTeacherModule.tabs.conjugation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.conjugation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('spanishTeacherModule.conjugation.subtitle')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {data.verbs.map((v, i) => (
          <button key={v.verb} onClick={() => setVi(i)} style={{
            background: i === vi ? C.accent : C.card, color: i === vi ? '#fff' : C.ink,
            border: `1px solid ${i === vi ? C.accent : C.border}`, borderRadius: 8, padding: '6px 12px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{v.verb}</button>
        ))}
      </div>
      <Card accent={C.accent} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>{verb.verb}</span>
          <SpeakBtn text={verb.verb} tts={tts} />
          <span style={{ fontSize: 13, color: C.inkSoft, fontStyle: 'italic' }}>{verb.type[lang] || verb.type.en}</span>
        </div>
      </Card>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}></th>
              {TENSES.map(tn => <th key={tn} style={thStyle}>{t(`spanishTeacherModule.conjugation.tenses.${tn}`, { defaultValue: tn })}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.persons.map((person, pi) => (
              <tr key={person} style={{ background: pi % 2 ? '#fdfcfa' : '#fff' }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: C.navy, textAlign: 'left', whiteSpace: 'nowrap' }}>{person}</td>
                {TENSES.map(tn => (
                  <td key={tn} style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {verb.tenses[tn][pi]}
                      <button onClick={() => tts.speak(`${person} ${verb.tenses[tn][pi]}`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.5, padding: 0 }}>🔊</button>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const thStyle = { padding: '8px 10px', fontSize: 11, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${C.accentBorder}`, textAlign: 'center' };
const tdStyle = { padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${C.border}`, color: C.ink };

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Vocabulario SRS
// ═══════════════════════════════════════════════════════════════════════════════
const TabVocabulary = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const loadDue = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/spanish/srs/due?limit=20`).then(r => r.json()).then(d => {
      setCards(d.items || []); setIdx(0); setRevealed(false); setLoading(false); setDone((d.items || []).length === 0);
    });
  }, []);
  useEffect(() => { loadDue(); }, [loadDue]);
  const grade = async (g) => {
    const cur = cards[idx]; if (!cur) return;
    await fetch(`${API_BASE}/api/spanish/srs/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vocab_id: cur.id, grade: g }) });
    if (idx + 1 < cards.length) { setIdx(idx + 1); setRevealed(false); } else setDone(true);
  };
  if (loading) return loadingP(t('spanishTeacherModule.common.loading'));
  if (done || cards.length === 0) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <SectionLabel index={5} label={t('spanishTeacherModule.tabs.vocabulary')} />
        <Card accent={C.accent} style={{ background: C.accentLight, borderColor: C.accentBorder, marginTop: 12 }}>
          <p style={{ fontSize: 18, color: C.accent, margin: 0, fontWeight: 700 }}>🎉 {t('spanishTeacherModule.vocabulary.endOfSession')}</p>
        </Card>
        <Button onClick={loadDue} style={{ marginTop: 18 }}>{t('spanishTeacherModule.common.retry')}</Button>
      </div>
    );
  }
  const cur = cards[idx];
  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('spanishTeacherModule.tabs.vocabulary')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.vocabulary.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('spanishTeacherModule.vocabulary.subtitle')}</p>
      <p style={{ fontSize: 11, color: C.inkSoft, fontFamily: 'monospace', marginBottom: 10 }}>
        {idx + 1} / {cards.length} · {cur.is_new ? <Chip color={C.accent}>{t('spanishTeacherModule.vocabulary.newCard')}</Chip> : <span>{t('spanishTeacherModule.vocabulary.stage')} {cur.stage}</span>}
      </p>
      <Card accent={C.accent} style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 18 }}>
        <p style={{ fontSize: 34, fontWeight: 800, color: C.accent, margin: 0 }}>{cur.word}</p>
        <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: '4px 0 0' }}>{cur.pos} · {cur.level}</p>
        <SpeakBtn text={cur.word} tts={tts} style={{ marginTop: 8, fontSize: 22 }} />
        {revealed && (<>
          <p style={{ fontSize: 17, color: C.green, marginTop: 12, fontWeight: 600 }}>{cur.meaning[lang === 'es' ? 'en' : lang] || cur.meaning.en}</p>
          <p style={{ fontSize: 13, color: C.ink, fontStyle: 'italic', marginTop: 8 }}>{cur.example}</p>
        </>)}
      </Card>
      {!revealed ? (
        <Button primary onClick={() => setRevealed(true)} style={{ width: '100%' }}>{t('spanishTeacherModule.vocabulary.showAnswer')}</Button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <Button onClick={() => grade('again')} style={{ background: C.accentLight, color: C.accent, border: `1px solid ${C.accentBorder}` }}>{t('spanishTeacherModule.vocabulary.again')}</Button>
          <Button onClick={() => grade('good')} style={{ background: C.goldLight, color: C.gold, border: `1px solid ${C.goldBorder}` }}>{t('spanishTeacherModule.vocabulary.good')}</Button>
          <Button onClick={() => grade('easy')} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>{t('spanishTeacherModule.vocabulary.easy')}</Button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Falsos Amigos
// ═══════════════════════════════════════════════════════════════════════════════
const TabFalseFriends = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [items, setItems] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/false-friends`).then(r => r.json()).then(d => setItems(d.items || [])); }, []);
  if (!items) return loadingP(t('spanishTeacherModule.common.loading'));
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={6} label={t('spanishTeacherModule.tabs.falseFriends')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.falseFriends.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('spanishTeacherModule.falseFriends.subtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {items.map((f, i) => (
          <Card key={i} accent={C.accent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 19, fontWeight: 900, color: C.accent }}>{f.es}</span>
              <SpeakBtn text={f.es} tts={tts} />
              <span style={{ marginLeft: 'auto' }}><Chip color={C.gold} light={C.goldLight} border={C.goldBorder}>≠ EN “{f.en_trap}”</Chip></span>
            </div>
            <p style={{ fontSize: 13, color: C.ink, margin: '0 0 6px' }}><strong style={{ color: C.green }}>{f.es}</strong> = {f.actual[lang === 'es' ? 'en' : lang] || f.actual.en}</p>
            <p style={{ fontSize: 12, color: C.accent, margin: '0 0 8px', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: (f.correct || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            <p style={{ fontSize: 12, color: C.inkSoft, fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{f.example}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conversación
// ═══════════════════════════════════════════════════════════════════════════════
const TabConversation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState('presentarse');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [last, setLast] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/conversation/scenarios?lang=${lang}`).then(r => r.json()).then(d => setScenarios(d.scenarios || [])); }, [lang]);
  const start = async () => {
    setStarted(true); setHistory([]);
    const r = await fetch(`${API_BASE}/api/spanish/conversation/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, difficulty, history: [], lang }) });
    const d = await r.json(); setLast(d); setHistory([{ role: 'assistant', content: d.reply }]);
  };
  const send = async () => {
    if (!input.trim()) return;
    const newHist = [...history, { role: 'user', content: input }];
    setHistory(newHist); setInput(''); setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/spanish/conversation/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, difficulty, history: newHist, user_text: input, lang }) });
      const d = await r.json(); setLast(d); setHistory([...newHist, { role: 'assistant', content: d.reply }]);
    } catch (e) { /* noop */ }
    setSending(false);
  };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={7} label={t('spanishTeacherModule.tabs.conversation')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.conversation.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('spanishTeacherModule.conversation.subtitle')}</p>
      {!started ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <label style={sublabel}>{t('spanishTeacherModule.conversation.scenario')}</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={selectStyle}>{scenarios.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          </div>
          <div>
            <label style={sublabel}>{t('spanishTeacherModule.conversation.difficulty')}</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
              <option value="beginner">{t('spanishTeacherModule.conversation.beginner')}</option>
              <option value="intermediate">{t('spanishTeacherModule.conversation.intermediate')}</option>
              <option value="advanced">{t('spanishTeacherModule.conversation.advanced')}</option>
            </select>
          </div>
          <Button primary onClick={start}>{t('spanishTeacherModule.conversation.startBtn')}</Button>
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
                <span style={miniLabel(C.accent)}>✎ {t('spanishTeacherModule.conversation.correction')}</span>
                <p style={{ fontSize: 12, color: '#7f1d1d', margin: '2px 0 0', fontStyle: 'italic' }}>{last.correction}</p>
              </div>)}
              {last.upgrade && (<div style={{ marginBottom: 6 }}>
                <span style={miniLabel(C.green)}>▲ {t('spanishTeacherModule.conversation.upgrade')}</span>
                <p style={{ fontSize: 13, color: C.green, margin: '2px 0 0', fontWeight: 600 }}>{last.upgrade}</p>
              </div>)}
              {last.tip && (<div>
                <span style={miniLabel(C.gold)}>💡 {t('spanishTeacherModule.conversation.tip')}</span>
                <p style={{ fontSize: 12, color: '#92400e', margin: '2px 0 0', fontStyle: 'italic' }}>{last.tip}</p>
              </div>)}
            </Card>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={t('spanishTeacherModule.conversation.yourReply')} style={{ flex: 1, padding: '12px 14px', fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 10 }} />
          <Button primary onClick={send} disabled={sending}>{sending ? t('spanishTeacherModule.conversation.sending') : t('spanishTeacherModule.conversation.send')}</Button>
        </div>
        <Button onClick={() => { setStarted(false); setHistory([]); setLast(null); }} style={{ marginTop: 10 }}>{t('spanishTeacherModule.conversation.newConversation')}</Button>
      </>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Escritura
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
      const r = await fetch(`${API_BASE}/api/spanish/writing/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, register, lang }) });
      setResult(await r.json());
    } catch (e) { setResult({ error: 'network' }); }
    setLoading(false);
  };
  const typeColor = { ser_estar: C.accent, por_para: C.gold, gender: '#7c3aed', verb: C.navy, subjunctive: '#0891b2', accent: '#db2777', word_choice: C.gold, naturalness: C.green };
  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={8} label={t('spanishTeacherModule.tabs.writing')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.writing.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('spanishTeacherModule.writing.subtitle')}</p>
      <Card accent={C.accent} style={{ marginBottom: 16 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder={t('spanishTeacherModule.writing.placeholder')}
                  style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: C.inkSoft }}>{t('spanishTeacherModule.writing.register')}:</label>
          <select value={register} onChange={e => setRegister(e.target.value)} style={{ ...selectStyle, width: 'auto', padding: '6px 10px' }}>
            <option value="formal">{t('spanishTeacherModule.writing.registers.formal')}</option>
            <option value="neutral">{t('spanishTeacherModule.writing.registers.neutral')}</option>
            <option value="informal">{t('spanishTeacherModule.writing.registers.informal')}</option>
          </select>
          <Button primary onClick={analyze} disabled={loading || !text.trim()} style={{ marginLeft: 'auto' }}>{loading ? t('spanishTeacherModule.writing.analyzing') : `✍ ${t('spanishTeacherModule.writing.analyzeBtn')}`}</Button>
        </div>
      </Card>
      {result && result.error && <Card accent={C.accent} style={{ background: C.accentLight }}><p style={{ color: C.accent, margin: 0 }}>{t('spanishTeacherModule.common.error')}</p></Card>}
      {result && !result.error && (<>
        <Card accent={C.navy} style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip color={C.navy} light={C.navyLight} border={C.navyBorder}>CEFR: {result.cefr_estimate}</Chip>
          {result.is_mock && <Chip color={C.gold} light={C.goldLight} border={C.goldBorder}>MOCK</Chip>}
          <span style={{ fontSize: 13, color: C.inkSoft, flex: 1 }}>{result.summary}</span>
        </Card>
        {result.corrected && (
          <Card accent={C.green} style={{ marginBottom: 14, background: C.greenLight, borderColor: C.greenBorder }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>✓ {t('spanishTeacherModule.writing.corrected')}</p>
            <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>{result.corrected}</p>
          </Card>
        )}
        {result.issues && result.issues.length > 0 && (
          <Card accent={C.accent} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>⚠ {t('spanishTeacherModule.writing.issues')}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {result.issues.map((iss, i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#fdfcfa', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: C.accent, textDecoration: 'line-through' }}>{iss.original}</span>
                    <span style={{ color: C.inkSoft }}>→</span>
                    <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{iss.fix}</span>
                    <Chip color={typeColor[iss.type] || C.inkSoft} light="#f1f5f9" border={C.border} style={{ marginLeft: 'auto' }}>{t(`spanishTeacherModule.writing.types.${iss.type}`, { defaultValue: iss.type })}</Chip>
                  </div>
                  {iss.note && <p style={{ fontSize: 12, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{iss.note}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}
        {result.upgrades && result.upgrades.length > 0 && (
          <Card accent="#7c3aed">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>▲ {t('spanishTeacherModule.writing.upgrades')}</p>
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
// Tab: Cultura
// ═══════════════════════════════════════════════════════════════════════════════
const TabCulture = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useVoice();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  useEffect(() => { fetch(`${API_BASE}/api/spanish/culture`).then(r => r.json()).then(d => { setNotes(d.items || []); if ((d.items || []).length) setActiveId(d.items[0].id); }); }, []);
  if (notes.length === 0) return loadingP(t('spanishTeacherModule.common.loading'));
  const cur = notes.find(n => n.id === activeId);
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={9} label={t('spanishTeacherModule.tabs.culture')} />
      <h2 style={{ color: C.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('spanishTeacherModule.culture.title')}</h2>
      <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('spanishTeacherModule.culture.subtitle')}</p>
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
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: 0 }}>{n.title.es}</p>
                  <p style={{ fontSize: 11, color: C.accent, fontWeight: 700, margin: '2px 0 0' }}>{n.title[lang === 'es' ? 'en' : lang] || n.title.en}</p>
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
                  <p style={{ fontSize: 22, fontWeight: 900, color: C.ink, margin: 0 }}>{cur.title.es}</p>
                  <p style={{ fontSize: 12, color: C.accent, margin: '2px 0 0' }}>{cur.title[lang === 'es' ? 'en' : lang] || cur.title.en}</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.65, margin: 0 }}>{cur.summary[lang === 'es' ? 'en' : lang] || cur.summary.en}</p>
            </Card>
            {cur.phrases && cur.phrases.length > 0 && (
              <Card accent={C.gold}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>🗣 {t('spanishTeacherModule.culture.phrases')}</p>
                {cur.phrases.map((ph, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{ph.es}</span>
                    <SpeakBtn text={ph.es} tts={tts} />
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

const selectStyle = { width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, color: C.ink, fontFamily: 'inherit' };
const sublabel = { display: 'block', fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 };
const miniLabel = (color) => ({ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em' });

// ═══════════════════════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════════════════════
const SpanishTeacher = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const browserTts = useSpanishTTS();
  const voice = useVoiceEngine(browserTts, 'es');
  const tabs = [
    { id: 'dashboard',    label: t('spanishTeacherModule.tabs.dashboard'),    icon: '📋' },
    { id: 'pronunciation',label: t('spanishTeacherModule.tabs.pronunciation'),icon: '🗣' },
    { id: 'grammar',      label: t('spanishTeacherModule.tabs.grammar'),      icon: '📐' },
    { id: 'conjugation',  label: t('spanishTeacherModule.tabs.conjugation'),  icon: '🔤' },
    { id: 'vocabulary',   label: t('spanishTeacherModule.tabs.vocabulary'),   icon: '📚' },
    { id: 'falseFriends', label: t('spanishTeacherModule.tabs.falseFriends'), icon: '⚠' },
    { id: 'conversation', label: t('spanishTeacherModule.tabs.conversation'), icon: '💬' },
    { id: 'writing',      label: t('spanishTeacherModule.tabs.writing'),      icon: '✍' },
    { id: 'culture',      label: t('spanishTeacherModule.tabs.culture'),      icon: '🎭' },
  ];
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <TabDashboard onJump={setActiveTab} />;
      case 'pronunciation': return <TabPronunciation />;
      case 'grammar':       return <TabGrammar />;
      case 'conjugation':   return <TabConjugation />;
      case 'vocabulary':    return <TabVocabulary />;
      case 'falseFriends':  return <TabFalseFriends />;
      case 'conversation':  return <TabConversation />;
      case 'writing':       return <TabWriting />;
      case 'culture':       return <TabCulture />;
      default:              return <TabDashboard onJump={setActiveTab} />;
    }
  };
  return (
    <VoiceCtx.Provider value={voice}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: 'inherit' }}>
      <div style={{ background: C.card, borderBottom: `2px solid ${C.border}`, padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: C.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('spanishTeacherModule.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('spanishTeacherModule.languageAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: C.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${C.accent},${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: '0 4px 14px rgba(170,21,27,0.25)' }}>🇪🇸</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1.15 }}>{t('spanishTeacherModule.title')}</h1>
            <p style={{ color: C.inkSoft, fontSize: 13, margin: '4px 0 0' }}>{t('spanishTeacherModule.tagline')}</p>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <VoiceSelector voice={voice} accent={C.accent} nativeClone />
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
    </VoiceCtx.Provider>
  );
};

export default SpanishTeacher;
