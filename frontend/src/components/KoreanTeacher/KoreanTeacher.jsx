/**
 * Maestro Coreano IA — V1 Functional
 * ===================================
 * 8 tabs: Dashboard · Hangul · Syllable Builder · Batchim · Vocabulary SRS
 *         · Grammar · Conversation · CJK Bridge
 *
 * Visual: Taegeuk palette — imperial blue (#003478) + flag red (#c8102e)
 *         + white cards on a cool gradient. Hero icon 한.
 *
 * Backend: /api/korean/*
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useKoreanTTS } from './useKoreanTTS';
import { useSpeechCapture } from '../hologram/useSpeechCapture';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en';

// ─── Design tokens (Korean Taegeuk palette) ───────────────────────────────────
const COLORS = {
  bg:           'linear-gradient(160deg,#f0f7ff 0%,#fefefe 50%,#fff5f5 100%)',
  card:         '#ffffff',
  border:       '#e2e8f0',
  ink:          '#0f172a',
  inkSoft:      '#475569',
  accent:       '#003478',          // Taegeuk imperial blue
  accentLight:  '#eff6ff',
  accentBorder: '#bfdbfe',
  red:          '#c8102e',          // Taegeuk flag red
  redLight:     '#fef2f2',
  redBorder:    '#fecaca',
  gold:         '#b45309',
  goldLight:    '#fffbeb',
  goldBorder:   '#fde68a',
  jade:         '#0d9488',          // jade for Japanese cells in CJK Bridge
  jadeLight:    '#f0fdfa',
  jadeBorder:   '#99f6e4',
};

const KOREAN_FONT = '"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif';

// ─── Atoms ────────────────────────────────────────────────────────────────────
const SectionLabel = ({ index, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    <span style={{ color: COLORS.accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
      {String(index).padStart(2, '0')} · {label.toUpperCase()}
    </span>
    <div style={{ flex: 1, height: 1, background: COLORS.border }} />
  </div>
);

const Card = ({ children, accent = COLORS.border, style = {} }) => (
  <div style={{
    background: COLORS.card, border: `1px solid ${COLORS.border}`,
    borderLeft: `4px solid ${accent}`, borderRadius: 12,
    padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style,
  }}>{children}</div>
);

const Stat = ({ label, value, max, color = COLORS.accent }) => (
  <div style={{
    background: COLORS.card, border: `1px solid ${COLORS.border}`,
    borderTop: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px',
  }}>
    <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>
      {value ?? '—'}
      {max != null && <span style={{ fontSize: 13, color: COLORS.inkSoft, marginLeft: 4 }}>/ {max}</span>}
    </p>
  </div>
);

const Button = ({ children, onClick, primary = false, disabled = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#e5e7eb'
              : primary ? `linear-gradient(135deg,${COLORS.accent},#001f4d)`
                        : COLORS.card,
    color: disabled ? '#9ca3af' : primary ? '#ffffff' : COLORS.ink,
    border: primary ? 'none' : `1px solid ${COLORS.border}`,
    borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: primary ? '0 2px 8px rgba(0,52,120,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
    fontFamily: 'inherit',
    ...style,
  }}>{children}</button>
);

const Chip = ({ children, color = COLORS.accent, light = COLORS.accentLight, border = COLORS.accentBorder, style = {} }) => (
  <span style={{
    background: light, color, border: `1px solid ${border}`, borderRadius: 999,
    padding: '2px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    display: 'inline-flex', alignItems: 'center', ...style,
  }}>{children}</span>
);

const SpeakBtn = ({ text, tts, style = {} }) => (
  <button onClick={() => tts.speak(text)} style={{
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 15, padding: 2, ...style,
  }}>🔊</button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TabDashboard = ({ onJump }) => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/overview`)
      .then((r) => r.json())
      .then((d) => { setOverview(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 64, textAlign: 'center', color: COLORS.inkSoft }}>{t('koreanTeacherModule.dashboard.loading')}</div>;
  if (!overview) return <div style={{ padding: 64, textAlign: 'center', color: COLORS.red }}>{t('koreanTeacherModule.common.error')}</div>;

  const { stats, todays_mission: mission, level, topik_target, streak_days } = overview;
  const missionTarget = { jamo: 'hangul', syllable: 'syllable', batchim: 'batchim', srs: 'vocabulary', conv: 'conversation' };
  const missionEmoji = { jamo: '한', syllable: '글', batchim: '받', srs: '📚', conv: '💬' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('koreanTeacherModule.tabs.dashboard')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.dashboard.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('koreanTeacherModule.dashboard.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`,
                       borderTop: `3px solid ${COLORS.accent}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('koreanTeacherModule.dashboard.level')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#001f4d' }}>{level}</p>
        </div>
        <div style={{ background: COLORS.redLight, border: `1px solid ${COLORS.redBorder}`,
                       borderTop: `3px solid ${COLORS.red}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.red, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('koreanTeacherModule.dashboard.topik')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#7f1d1d', fontFamily: 'monospace' }}>{topik_target}</p>
        </div>
        <div style={{ background: '#f5f5f4', border: `1px solid ${COLORS.border}`,
                       borderTop: `3px solid ${COLORS.ink}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('koreanTeacherModule.dashboard.streak')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, fontFamily: 'monospace' }}>
            🔥 {streak_days} <span style={{ fontSize: 12, color: COLORS.inkSoft }}>{t('koreanTeacherModule.dashboard.days')}</span>
          </p>
        </div>
      </div>

      <SectionLabel index={2} label="STATS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('koreanTeacherModule.dashboard.jamoKnown')}       value={stats.jamo_known}  max={stats.jamo_total} color={COLORS.accent} />
        <Stat label={t('koreanTeacherModule.dashboard.consonants')}      value={stats.consonants_total} color="#7c3aed" />
        <Stat label={t('koreanTeacherModule.dashboard.vowels')}          value={stats.vowels_total} color={COLORS.gold} />
        <Stat label={t('koreanTeacherModule.dashboard.vocabKnown')}      value={stats.vocab_known} max={stats.vocab_total} color="#059669" />
        <Stat label={t('koreanTeacherModule.dashboard.cjkBridgeTotal')}  value={stats.cjk_bridge_total} color={COLORS.red} />
      </div>

      <SectionLabel index={3} label={t('koreanTeacherModule.dashboard.todaysMission')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {mission.map((m, i) => (
          <Card key={i} accent={['#003478','#c8102e','#7c3aed','#059669','#b45309'][i % 5]}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div onClick={() => onJump?.(missionTarget[m.type])} style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {t(`koreanTeacherModule.dashboard.missionLabels.${m.type}`)}
              </p>
              <p style={{ fontSize: 18, fontWeight: 900, color: COLORS.ink, fontFamily: 'monospace' }}>{m.count}</p>
            </div>
            <span style={{ fontSize: 22, fontFamily: KOREAN_FONT }}>{missionEmoji[m.type] || '·'}</span>
          </Card>
        ))}
      </div>

      <Button primary onClick={() => onJump?.('hangul')}>{t('koreanTeacherModule.dashboard.continue')} →</Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Hangul Trainer
// ═══════════════════════════════════════════════════════════════════════════════
const TabHangul = () => {
  const { t } = useTranslation();
  const [deck, setDeck] = useState(null);
  const tts = useKoreanTTS();

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/hangul/deck`).then((r) => r.json()).then(setDeck);
  }, []);

  if (!deck) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.hangul.loading')}</p>;

  const renderRow = (item, isVowel = false) => (
    <div key={item.jamo} style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 32, fontFamily: KOREAN_FONT, color: COLORS.accent, fontWeight: 700, minWidth: 48 }}>
        {item.jamo}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: 0, fontFamily: KOREAN_FONT }}>{item.name}</p>
        <p style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: 'monospace', margin: '2px 0 0' }}>{item.romaji}</p>
      </div>
      <div style={{ minWidth: 120, fontSize: 11, color: COLORS.inkSoft }}>
        {isVowel ? item.sound : <>
          <span style={{ color: COLORS.accent, fontWeight: 700 }}>{item.sound_initial}</span>
          {item.sound_final && <span style={{ marginLeft: 8 }}>· {item.sound_final}</span>}
        </>}
      </div>
      <SpeakBtn text={item.name} tts={tts} />
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('koreanTeacherModule.tabs.hangul')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.hangul.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('koreanTeacherModule.hangul.subtitle')}</p>

      {tts.supported && !tts.koVoice && tts.voices.length > 0 && (
        <div style={{ background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`, borderLeft: `4px solid ${COLORS.gold}`,
                       borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#78350f' }}>
          ⚠ {t('koreanTeacherModule.hangul.noKoVoice')}
        </div>
      )}

      <Card accent={COLORS.red} style={{ background: COLORS.redLight, borderColor: COLORS.redBorder, marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>👑 {t('koreanTeacherModule.hangul.kingSejong')}</p>
      </Card>

      <h3 style={{ color: COLORS.accent, fontSize: 15, fontWeight: 800, margin: '0 0 8px' }}>{t('koreanTeacherModule.hangul.consonants')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 20 }}>
        {deck.consonants.map((c) => renderRow(c, false))}
      </div>

      <h3 style={{ color: COLORS.accent, fontSize: 15, fontWeight: 800, margin: '0 0 8px' }}>{t('koreanTeacherModule.hangul.doubleConsonants')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 20 }}>
        {deck.double_consonants.map((c) => renderRow(c, false))}
      </div>

      <h3 style={{ color: COLORS.red, fontSize: 15, fontWeight: 800, margin: '0 0 8px' }}>{t('koreanTeacherModule.hangul.vowels')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 20 }}>
        {deck.vowels.map((v) => renderRow(v, true))}
      </div>

      <h3 style={{ color: COLORS.red, fontSize: 15, fontWeight: 800, margin: '0 0 8px' }}>{t('koreanTeacherModule.hangul.compoundVowels')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {deck.compound_vowels.map((v) => renderRow(v, true))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Syllable Builder
// ═══════════════════════════════════════════════════════════════════════════════
const TabSyllable = () => {
  const { t } = useTranslation();
  const tts = useKoreanTTS();
  const [deck, setDeck] = useState(null);
  const [seeds, setSeeds] = useState([]);
  const [initial, setInitial] = useState('ㅎ');
  const [medial, setMedial]   = useState('ㅏ');
  const [final, setFinal]     = useState('ㄴ');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/hangul/deck`).then((r) => r.json()).then(setDeck);
    fetch(`${API_BASE}/api/korean/syllable/seeds`).then((r) => r.json()).then((d) => setSeeds(d.items || []));
  }, []);

  const build = useCallback(async () => {
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/korean/syllable/build`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial, medial, final }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.detail || t('koreanTeacherModule.syllable.invalidJamo')); setResult(null); return; }
      setResult(d);
    } catch (e) {
      setError(String(e));
    }
  }, [initial, medial, final, t]);

  useEffect(() => { if (deck) build(); }, [deck, build]);

  if (!deck) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.syllable.loading')}</p>;

  const initialOptions = [...deck.consonants, ...deck.double_consonants].map((c) => c.jamo);
  const medialOptions  = [...deck.vowels, ...deck.compound_vowels].map((v) => v.jamo);
  const finalOptions   = ['', ...deck.consonants.map((c) => c.jamo), ...deck.double_consonants.map((c) => c.jamo)];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('koreanTeacherModule.tabs.syllable')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.syllable.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 16 }}>{t('koreanTeacherModule.syllable.subtitle')}</p>

      <Card accent={COLORS.accent} style={{ background: COLORS.accentLight, borderColor: COLORS.accentBorder, marginBottom: 18 }}>
        <p style={{ fontSize: 13, color: '#001f4d', margin: 0, lineHeight: 1.6 }}>📐 {t('koreanTeacherModule.syllable.explanation')}</p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: 14, marginBottom: 18, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6, letterSpacing: '0.06em' }}>{t('koreanTeacherModule.syllable.initialLabel')}</label>
          <select value={initial} onChange={(e) => setInitial(e.target.value)} style={selectStyle}>
            {initialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.red, marginBottom: 6, letterSpacing: '0.06em' }}>{t('koreanTeacherModule.syllable.medialLabel')}</label>
          <select value={medial} onChange={(e) => setMedial(e.target.value)} style={selectStyle}>
            {medialOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.ink, marginBottom: 6, letterSpacing: '0.06em' }}>{t('koreanTeacherModule.syllable.finalLabel')}</label>
          <select value={final} onChange={(e) => setFinal(e.target.value)} style={selectStyle}>
            <option value="">{t('koreanTeacherModule.syllable.noneOption')}</option>
            {finalOptions.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Button primary onClick={build}>{t('koreanTeacherModule.syllable.buildBtn')}</Button>
      </div>

      {error && <Card accent={COLORS.red} style={{ background: COLORS.redLight, borderColor: COLORS.redBorder, marginBottom: 18 }}>
        <p style={{ color: '#7f1d1d', fontSize: 13, margin: 0 }}>⚠ {error}</p>
      </Card>}

      {result && (
        <Card accent={COLORS.accent} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
            {t('koreanTeacherModule.syllable.resultTitle')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 140, height: 140, borderRadius: 18,
              background: `linear-gradient(135deg,${COLORS.accentLight},${COLORS.redLight})`,
              border: `2px solid ${COLORS.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 84, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.accent,
              boxShadow: '0 4px 16px rgba(0,52,120,0.12)',
            }}>{result.block}</div>
            <div>
              <div style={{ fontSize: 28, fontFamily: 'monospace', color: COLORS.ink, fontWeight: 800 }}>
                {initial || '·'} <span style={{ color: COLORS.inkSoft, fontSize: 18 }}>+</span> {medial || '·'} {final && <><span style={{ color: COLORS.inkSoft, fontSize: 18 }}>+</span> {final}</>}
              </div>
              <div style={{ fontSize: 18, color: COLORS.red, fontFamily: 'monospace', marginTop: 6 }}>{result.romanization}</div>
              <div style={{ marginTop: 8 }}>
                <Chip color={result.has_batchim ? COLORS.red : COLORS.inkSoft} light={result.has_batchim ? COLORS.redLight : '#f1f5f9'} border={result.has_batchim ? COLORS.redBorder : COLORS.border}>
                  {result.has_batchim ? t('koreanTeacherModule.syllable.hasBatchim') : t('koreanTeacherModule.syllable.noBatchim')}
                </Chip>
              </div>
              <Button onClick={() => tts.speak(result.block)} style={{ marginTop: 12 }}>{t('koreanTeacherModule.syllable.listen')}</Button>
            </div>
          </div>
        </Card>
      )}

      <h3 style={{ color: COLORS.accent, fontSize: 14, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.syllable.seedTitle')}</h3>
      <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: '0 0 12px' }}>{t('koreanTeacherModule.syllable.seedSubtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
        {seeds.map((s, i) => (
          <button key={i} onClick={() => { setInitial(s.initial); setMedial(s.medial); setFinal(s.final); }} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: '10px 8px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 28, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.accent }}>{s.block}</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: COLORS.inkSoft }}>{s.romanization}</span>
            <span style={{ fontSize: 10, color: COLORS.ink }}>{s.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const selectStyle = {
  width: '100%', padding: '10px 12px', fontSize: 18, fontFamily: KOREAN_FONT,
  border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.card,
  color: COLORS.ink, fontWeight: 700,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Batchim & Pronunciation
// ═══════════════════════════════════════════════════════════════════════════════
const TabBatchim = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [deck, setDeck] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/batchim/deck`).then((r) => r.json()).then(setDeck);
  }, []);

  if (!deck) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.batchim.loading')}</p>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('koreanTeacherModule.tabs.batchim')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.batchim.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('koreanTeacherModule.batchim.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
        {deck.groups.map((g) => (
          <Card key={g.sound} accent={COLORS.accent}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 46, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.accent }}>{g.sound}</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: COLORS.accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{t('koreanTeacherModule.batchim.groupLabel')}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: '2px 0 0' }}>{g.name}</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.6, margin: '0 0 8px' }}>{g.explanation[lang] || g.explanation.en}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {g.jamo_set.map((j) => (
                <span key={j} style={{
                  background: COLORS.accentLight, color: COLORS.accent, border: `1px solid ${COLORS.accentBorder}`,
                  borderRadius: 6, padding: '2px 8px', fontSize: 14, fontFamily: KOREAN_FONT, fontWeight: 700,
                }}>{j}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {g.examples.map((ex, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.ink, minWidth: 50 }}>{ex.hangul}</span>
                  <span style={{ fontFamily: 'monospace', color: COLORS.red }}>{ex.rom}</span>
                  <span style={{ color: COLORS.inkSoft, fontSize: 11, marginLeft: 'auto' }}>{ex.mean}</span>
                  <SpeakBtn text={ex.hangul} tts={tts} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel index={5} label={t('koreanTeacherModule.batchim.soundChangesTitle')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {deck.sound_changes.map((sc) => (
          <Card key={sc.id} accent={COLORS.red}>
            <p style={{ fontSize: 13, fontWeight: 800, color: COLORS.red, margin: '0 0 6px', fontFamily: KOREAN_FONT }}>{sc.title[lang] || sc.title.en}</p>
            <p style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.55, margin: '0 0 10px' }}>{sc.rule[lang] || sc.rule.en}</p>
            {sc.examples.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontFamily: KOREAN_FONT, fontWeight: 700 }}>{ex.written}</span>
                <span style={{ color: COLORS.inkSoft }}>→</span>
                <span style={{ fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.red }}>{ex.spoken}</span>
                <span style={{ fontFamily: 'monospace', color: COLORS.inkSoft, marginLeft: 4 }}>{ex.rom}</span>
                <SpeakBtn text={ex.written} tts={tts} style={{ marginLeft: 'auto' }} />
              </div>
            ))}
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
  const tts = useKoreanTTS();
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const loadDue = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/korean/srs/due?limit=20`)
      .then((r) => r.json())
      .then((d) => { setCards(d.items || []); setIdx(0); setRevealed(false); setLoading(false);
                     setDone((d.items || []).length === 0); });
  }, []);

  useEffect(() => { loadDue(); }, [loadDue]);

  const grade = async (g) => {
    const cur = cards[idx];
    if (!cur) return;
    await fetch(`${API_BASE}/api/korean/srs/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vocab_id: cur.id, grade: g }),
    });
    if (idx + 1 < cards.length) { setIdx(idx + 1); setRevealed(false); }
    else { setDone(true); }
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.vocabulary.loading')}</p>;

  if (done || cards.length === 0) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <SectionLabel index={5} label={t('koreanTeacherModule.tabs.vocabulary')} />
        <Card accent={COLORS.accent} style={{ background: COLORS.accentLight, borderColor: COLORS.accentBorder, marginTop: 12 }}>
          <p style={{ fontSize: 18, color: COLORS.accent, margin: 0, fontWeight: 700 }}>
            🎉 {t('koreanTeacherModule.vocabulary.endOfSession')}
          </p>
        </Card>
        <Button onClick={loadDue} style={{ marginTop: 18 }}>{t('koreanTeacherModule.common.retry')}</Button>
      </div>
    );
  }

  const cur = cards[idx];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('koreanTeacherModule.tabs.vocabulary')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.vocabulary.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('koreanTeacherModule.vocabulary.subtitle')}</p>

      <p style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: 'monospace', marginBottom: 10 }}>
        {idx + 1} / {cards.length} · {cur.is_new ? <Chip color={COLORS.red} light={COLORS.redLight} border={COLORS.redBorder}>{t('koreanTeacherModule.vocabulary.newCard')}</Chip> :
          <span>{t('koreanTeacherModule.vocabulary.stage')} {cur.stage}</span>}
      </p>

      <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 18 }}>
        <p style={{ fontSize: 56, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.accent, margin: 0, lineHeight: 1.1 }}>{cur.hangul}</p>
        <SpeakBtn text={cur.hangul} tts={tts} style={{ marginTop: 8, fontSize: 22 }} />
        {revealed && (
          <>
            <p style={{ fontSize: 18, color: COLORS.red, fontFamily: 'monospace', marginTop: 12 }}>{cur.romanization}</p>
            <p style={{ fontSize: 16, color: COLORS.ink, marginTop: 6 }}>{cur.meaning[lang] || cur.meaning.en}</p>
            {cur.hanja && (
              <p style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>
                {t('koreanTeacherModule.vocabulary.hanjaLabel')}: <span style={{ fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.gold }}>{cur.hanja}</span>
              </p>
            )}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              {(cur.tags || []).map((tag) => (
                <Chip key={tag} color={COLORS.inkSoft} light="#f1f5f9" border={COLORS.border}>{tag}</Chip>
              ))}
            </div>
          </>
        )}
      </Card>

      {!revealed ? (
        <Button primary onClick={() => setRevealed(true)} style={{ width: '100%' }}>{t('koreanTeacherModule.vocabulary.showAnswer')}</Button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <Button onClick={() => grade('again')} style={{ background: COLORS.redLight, color: COLORS.red, border: `1px solid ${COLORS.redBorder}` }}>{t('koreanTeacherModule.vocabulary.again')}</Button>
          <Button onClick={() => grade('good')}  style={{ background: COLORS.accentLight, color: COLORS.accent, border: `1px solid ${COLORS.accentBorder}` }}>{t('koreanTeacherModule.vocabulary.good')}</Button>
          <Button onClick={() => grade('easy')}  style={{ background: '#dcfce7', color: '#15803d', border: `1px solid #86efac` }}>{t('koreanTeacherModule.vocabulary.easy')}</Button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Grammar
// ═══════════════════════════════════════════════════════════════════════════════
const TabGrammar = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [points, setPoints] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/grammar/path?topik=TOPIK1`)
      .then((r) => r.json()).then((d) => setPoints(d.items || []));
  }, []);

  if (points.length === 0) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.grammar.loading')}</p>;

  const cur = points[idx];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={6} label={t('koreanTeacherModule.tabs.grammar')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.grammar.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 14 }}>{t('koreanTeacherModule.grammar.subtitle')}</p>

      <p style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: 'monospace', marginBottom: 14 }}>
        {t('koreanTeacherModule.grammar.of', { n: idx + 1, total: points.length })}
      </p>

      <Card accent={COLORS.accent} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 20, fontWeight: 900, color: COLORS.accent, margin: '0 0 4px', fontFamily: KOREAN_FONT }}>{cur.title}</p>
        <Chip color={COLORS.red} light={COLORS.redLight} border={COLORS.redBorder}>{cur.topik}</Chip>
        <p style={{ fontSize: 13, color: COLORS.ink, fontFamily: 'monospace', marginTop: 10, padding: '8px 10px',
                     background: COLORS.accentLight, borderRadius: 6 }}>{cur.pattern}</p>
      </Card>

      <Card accent={COLORS.red} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
          {t('koreanTeacherModule.grammar.explanation')}
        </p>
        <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.65, margin: 0 }}>{cur.explanation[lang] || cur.explanation.en}</p>
      </Card>

      <Card accent={COLORS.gold} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {t('koreanTeacherModule.grammar.examples')}
        </p>
        {cur.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: i < cur.examples.length - 1 ? `1px dashed ${COLORS.border}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.ink, margin: 0 }}>{ex.hangul}</p>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: COLORS.red, margin: '2px 0' }}>{ex.rom}</p>
              <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: 0 }}>{ex[lang] || ex.en}</p>
            </div>
            <SpeakBtn text={ex.hangul} tts={tts} />
          </div>
        ))}
      </Card>

      <Card accent={COLORS.red} style={{ background: COLORS.redLight, borderColor: COLORS.redBorder, marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          ⚠ {t('koreanTeacherModule.grammar.commonMistake')}
        </p>
        <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>{cur.commonMistake[lang] || cur.commonMistake.en}</p>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← {t('koreanTeacherModule.grammar.prev')}</Button>
        <Button primary onClick={() => setIdx(Math.min(points.length - 1, idx + 1))} disabled={idx === points.length - 1}>
          {t('koreanTeacherModule.grammar.next')} →
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conversation
// ═══════════════════════════════════════════════════════════════════════════════
const TabConversation = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState('intro');
  const [difficulty, setDifficulty] = useState('beginner');
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastReply, setLastReply] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/conversation/scenarios?lang=${lang}`)
      .then((r) => r.json()).then((d) => setScenarios(d.scenarios || []));
  }, [lang]);

  const start = async () => {
    setStarted(true);
    setHistory([]);
    const r = await fetch(`${API_BASE}/api/korean/conversation/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, difficulty, history: [], lang }),
    });
    const d = await r.json();
    setLastReply(d);
    setHistory([{ role: 'assistant', content: d.hangul }]);
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newHist = [...history, userMsg];
    setHistory(newHist);
    setInput('');
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/korean/conversation/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, difficulty, history: newHist, user_text: input, lang }),
      });
      const d = await r.json();
      setLastReply(d);
      setHistory([...newHist, { role: 'assistant', content: d.hangul }]);
    } catch (e) { /* noop */ }
    setSending(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 920, margin: '0 auto' }}>
      <SectionLabel index={7} label={t('koreanTeacherModule.tabs.conversation')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.conversation.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('koreanTeacherModule.conversation.subtitle')}</p>

      {!started ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6 }}>{t('koreanTeacherModule.conversation.scenario')}</label>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)} style={{ ...selectStyle, fontSize: 13, fontFamily: 'inherit' }}>
              {scenarios.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6 }}>{t('koreanTeacherModule.conversation.difficulty')}</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ ...selectStyle, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="beginner">{t('koreanTeacherModule.conversation.beginner')}</option>
              <option value="intermediate">{t('koreanTeacherModule.conversation.intermediate')}</option>
              <option value="advanced">{t('koreanTeacherModule.conversation.advanced')}</option>
            </select>
          </div>
          <Button primary onClick={start}>{t('koreanTeacherModule.conversation.startBtn')}</Button>
        </div>
      ) : (
        <>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
                         padding: 14, maxHeight: 380, overflowY: 'auto', marginBottom: 14 }}>
            {history.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8,
              }}>
                <div style={{
                  background: msg.role === 'user' ? COLORS.accent : COLORS.redLight,
                  color: msg.role === 'user' ? '#fff' : COLORS.ink,
                  border: msg.role === 'user' ? 'none' : `1px solid ${COLORS.redBorder}`,
                  borderRadius: 14, padding: '8px 12px', maxWidth: '75%',
                  fontFamily: KOREAN_FONT, fontSize: 15, fontWeight: 600,
                }}>{msg.content}</div>
              </div>
            ))}
            {lastReply && (
              <Card accent={COLORS.red} style={{ marginTop: 10, background: COLORS.redLight, borderColor: COLORS.redBorder }}>
                <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                  {t('koreanTeacherModule.conversation.romanizationLabel')}
                </div>
                <p style={{ fontSize: 13, fontFamily: 'monospace', color: COLORS.ink, margin: '0 0 6px' }}>{lastReply.romanization}</p>
                {lastReply.translation && <>
                  <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                    {t('koreanTeacherModule.conversation.translationLabel')}
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.ink, margin: '0 0 6px' }}>{lastReply.translation}</p>
                </>}
                {lastReply.hint && <>
                  <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                    💡 {t('koreanTeacherModule.conversation.hintLabel')}
                  </div>
                  <p style={{ fontSize: 12, color: '#92400e', margin: '0 0 6px', fontStyle: 'italic' }}>{lastReply.hint}</p>
                </>}
                {lastReply.correction && <>
                  <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                    ✎ {t('koreanTeacherModule.conversation.correctionLabel')}
                  </div>
                  <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0, fontStyle: 'italic' }}>{lastReply.correction}</p>
                </>}
                <Button onClick={() => tts.speak(lastReply.hangul)} style={{ marginTop: 8 }}>{t('koreanTeacherModule.conversation.listen')}</Button>
              </Card>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && send()}
                   placeholder={t('koreanTeacherModule.conversation.yourReply')}
                   style={{ flex: 1, padding: '12px 14px', fontSize: 14, border: `1px solid ${COLORS.border}`,
                            borderRadius: 10, fontFamily: KOREAN_FONT }} />
            <Button primary onClick={send} disabled={sending}>
              {sending ? t('koreanTeacherModule.conversation.sending') : t('koreanTeacherModule.conversation.send')}
            </Button>
          </div>

          <Button onClick={() => { setStarted(false); setHistory([]); setLastReply(null); }} style={{ marginTop: 10 }}>
            {t('koreanTeacherModule.conversation.newConversation')}
          </Button>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conversation Audio — hands-free SPOKEN conversation
// ---------------------------------------------------------------------------
// You speak (Web Speech ASR, ko-KR) → the teacher replies (same LLM endpoint as
// the written Conversation tab) → the Korean reply is spoken back automatically
// (useKoreanTTS). Reuses /api/korean/conversation/message; no backend change.
// Mirrors the Conversation Audio tab of English / Japanese / Spanish / Chinese.
// ═══════════════════════════════════════════════════════════════════════════════
const TabConversationAudio = () => {
  const { t, i18n } = useTranslation();
  const tts = useKoreanTTS();
  const asr = useSpeechCapture({ lang: 'ko-KR', interim: true });

  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario]   = useState('intro');
  const [difficulty, setDifficulty] = useState('beginner');
  const [started, setStarted]     = useState(false);
  const [history, setHistory]     = useState([]); // {role:'user',content} | {role:'assistant',payload}
  const [last, setLast]           = useState(null);
  const [sending, setSending]     = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const spokenRef     = useRef(null);
  const transcriptRef = useRef('');
  const sendRef       = useRef(null);
  const wasListening  = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/conversation/scenarios?lang=${toLang(i18n.language)}`)
      .then((r) => r.json()).then((d) => setScenarios(d.scenarios || [])).catch(() => {});
  }, [i18n.language]);

  useEffect(() => { transcriptRef.current = asr.transcript; }, [asr.transcript]);

  useEffect(() => {
    if (autoSpeak && last?.hangul && spokenRef.current !== last.hangul) {
      spokenRef.current = last.hangul;
      tts?.speak?.(last.hangul);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, autoSpeak]);

  const wireHistory = (hist) => hist.map((h) => ({
    role: h.role, content: h.role === 'assistant' ? (h.payload?.hangul || '') : h.content,
  }));

  const start = async () => {
    setStarted(true); setHistory([]); setLast(null); spokenRef.current = null;
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/korean/conversation/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, difficulty, history: [], user_text: null, lang: toLang(i18n.language) }),
      });
      const d = await r.json();
      setLast(d); setHistory([{ role: 'assistant', payload: d }]);
    } catch (e) { /* noop */ }
    setSending(false);
  };

  const sendUserTurn = useCallback(async (text) => {
    if (!text || !text.trim() || sending) return;
    const newHist = [...history, { role: 'user', content: text.trim() }];
    setHistory(newHist); setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/korean/conversation/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, difficulty, history: wireHistory(newHist), user_text: text.trim(), lang: toLang(i18n.language) }),
      });
      const d = await r.json();
      setLast(d); setHistory([...newHist, { role: 'assistant', payload: d }]);
    } catch (e) { /* noop */ }
    setSending(false);
  }, [history, sending, scenario, difficulty, i18n.language]);

  useEffect(() => { sendRef.current = sendUserTurn; });

  useEffect(() => {
    if (wasListening.current && !asr.isListening) {
      const txt = transcriptRef.current;
      if (txt && txt.trim()) { sendRef.current?.(txt); asr.reset(); }
    }
    wasListening.current = asr.isListening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asr.isListening]);

  const toggleMic = () => {
    if (asr.isListening) { asr.stopListening(); return; }
    tts?.stop?.();
    asr.startListening();
  };

  const reset = () => {
    asr.stopListening(); tts?.stop?.();
    setStarted(false); setHistory([]); setLast(null); spokenRef.current = null;
  };

  const bubble = (turn, i) => {
    if (turn.role === 'user') return (
      <div key={i} style={{ alignSelf: 'flex-end', background: COLORS.accent, color: '#fff',
                             borderRadius: 12, padding: '10px 14px', maxWidth: '75%', fontSize: 15, fontWeight: 600, fontFamily: KOREAN_FONT }}>{turn.content}</div>
    );
    const p = turn.payload;
    return (
      <div key={i} style={{ alignSelf: 'flex-start', background: COLORS.redLight, border: `1px solid ${COLORS.redBorder}`,
                             borderLeft: `4px solid ${COLORS.red}`, borderRadius: 12, padding: '12px 14px', maxWidth: '85%' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <p style={{ fontSize: 18, color: COLORS.ink, fontFamily: KOREAN_FONT, fontWeight: 700, margin: 0, flex: 1 }}>{p.hangul}</p>
          <button onClick={() => tts?.speak?.(p.hangul)} title={t('koreanTeacherModule.conversationAudio.replay')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>🔊</button>
        </div>
        {p.romanization && <p style={{ fontSize: 12, color: COLORS.red, fontFamily: 'monospace', margin: '4px 0 0' }}><strong style={{ fontSize: 9, letterSpacing: '0.1em' }}>{t('koreanTeacherModule.conversation.romanizationLabel')}:</strong> {p.romanization}</p>}
        {p.translation && <p style={{ fontSize: 12, color: COLORS.ink, marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${COLORS.border}` }}>{p.translation}</p>}
        {p.hint && <p style={{ fontSize: 11, color: '#92400e', marginTop: 6, fontStyle: 'italic' }}>💡 {p.hint}</p>}
        {p.correction && <p style={{ fontSize: 11, color: '#7f1d1d', marginTop: 6, fontStyle: 'italic' }}>✎ {p.correction}</p>}
        {p.is_mock && <p style={{ fontSize: 9, color: COLORS.gold, marginTop: 8, letterSpacing: '0.08em' }}>{t('koreanTeacherModule.conversation.noLLM', { defaultValue: '' })}</p>}
      </div>
    );
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 880, margin: '0 auto' }}>
      <SectionLabel index={12} label={t('koreanTeacherModule.tabs.conversationAudio')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.conversationAudio.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('koreanTeacherModule.conversationAudio.subtitle')}</p>

      {!asr.isSupported && (
        <Card accent={COLORS.gold} style={{ background: COLORS.goldLight, borderColor: COLORS.goldBorder, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: '#78350f' }}>⚠ {t('koreanTeacherModule.conversationAudio.noAsr')}</p>
        </Card>
      )}
      {tts.status === 'no-voice' && (
        <Card accent={COLORS.gold} style={{ background: COLORS.goldLight, borderColor: COLORS.goldBorder, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: '#78350f' }}>⚠ {t('koreanTeacherModule.conversationAudio.noVoice')}</p>
        </Card>
      )}

      {!started ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, alignItems: 'end', marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6 }}>{t('koreanTeacherModule.conversation.scenario')}</label>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)} style={{ ...selectStyle, fontSize: 13, fontFamily: 'inherit' }}>
              {scenarios.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6 }}>{t('koreanTeacherModule.conversation.difficulty')}</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ ...selectStyle, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="beginner">{t('koreanTeacherModule.conversation.beginner')}</option>
              <option value="intermediate">{t('koreanTeacherModule.conversation.intermediate')}</option>
              <option value="advanced">{t('koreanTeacherModule.conversation.advanced')}</option>
            </select>
          </div>
          <Button primary onClick={start} disabled={sending}>🎙 {t('koreanTeacherModule.conversationAudio.startBtn')}</Button>
        </div>
      ) : (<>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '18px 22px', maxHeight: 420, overflowY: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map(bubble)}
          {sending && <div style={{ alignSelf: 'flex-start', color: COLORS.inkSoft, fontSize: 12 }}>{t('koreanTeacherModule.conversationAudio.thinking')}</div>}
        </div>

        <div style={{ minHeight: 22, marginBottom: 10, fontSize: 13, color: asr.isListening ? COLORS.accent : COLORS.inkSoft, fontStyle: 'italic' }}>
          {asr.isListening ? `🎙 ${asr.transcript || t('koreanTeacherModule.conversationAudio.listening')}` : ''}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={toggleMic} disabled={sending || !asr.isSupported} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: 15, fontWeight: 700,
            borderRadius: 999, border: 'none', cursor: (sending || !asr.isSupported) ? 'not-allowed' : 'pointer',
            background: asr.isListening ? '#dc2626' : COLORS.accent, color: '#fff',
            boxShadow: asr.isListening ? '0 0 0 4px rgba(220,38,38,0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {asr.isListening ? `⏹ ${t('koreanTeacherModule.conversationAudio.stopSpeaking')}` : `🎙 ${t('koreanTeacherModule.conversationAudio.speak')}`}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: COLORS.inkSoft, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />
            {t('koreanTeacherModule.conversationAudio.autoSpeak')}
          </label>
          <Button onClick={reset} style={{ marginLeft: 'auto' }}>{t('koreanTeacherModule.conversation.newConversation')}</Button>
        </div>
      </>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: CJK Bridge
// ═══════════════════════════════════════════════════════════════════════════════
const TabBridge = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/bridge`).then((r) => r.json()).then((d) => {
      setEntries(d.items || []); setLoading(false);
    });
  }, []);

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.bridge.loading')}</p>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={8} label={t('koreanTeacherModule.tabs.bridge')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.bridge.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 20 }}>{t('koreanTeacherModule.bridge.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
        {entries.map((e) => (
          <Card key={e.concept_id} accent={COLORS.accent}>
            <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: '0 0 8px' }}>
              {e.meaning[lang] || e.meaning.en}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {/* Chinese */}
              <div style={{ background: COLORS.redLight, border: `1px solid ${COLORS.redBorder}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: COLORS.red, fontWeight: 800, letterSpacing: '0.08em', margin: '0 0 4px' }}>{t('koreanTeacherModule.bridge.chinese')}</p>
                <p style={{ fontSize: 28, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.red, margin: 0 }}>{e.chinese.hanzi}</p>
                <p style={{ fontSize: 10, fontFamily: 'monospace', color: COLORS.inkSoft, margin: '2px 0 0' }}>{e.chinese.pinyin}</p>
              </div>
              {/* Japanese */}
              <div style={{ background: COLORS.jadeLight, border: `1px solid ${COLORS.jadeBorder}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: COLORS.jade, fontWeight: 800, letterSpacing: '0.08em', margin: '0 0 4px' }}>{t('koreanTeacherModule.bridge.japanese')}</p>
                <p style={{ fontSize: 28, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.jade, margin: 0 }}>{e.japanese.kanji}</p>
                <p style={{ fontSize: 10, fontFamily: 'monospace', color: COLORS.inkSoft, margin: '2px 0 0' }}>{e.japanese.romaji || (e.japanese.on || []).join(' / ')}</p>
              </div>
              {/* Korean */}
              <div style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center', cursor: 'pointer' }}
                   onClick={() => tts.speak(e.korean.hangul)}>
                <p style={{ fontSize: 9, color: COLORS.accent, fontWeight: 800, letterSpacing: '0.08em', margin: '0 0 4px' }}>{t('koreanTeacherModule.bridge.korean')}</p>
                <p style={{ fontSize: 28, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.accent, margin: 0 }}>{e.korean.hangul}</p>
                <p style={{ fontSize: 10, fontFamily: 'monospace', color: COLORS.inkSoft, margin: '2px 0 0' }}>{e.korean.romanization}</p>
                {e.korean.hanja && <p style={{ fontSize: 10, color: COLORS.gold, margin: '2px 0 0', fontFamily: KOREAN_FONT }}>{e.korean.hanja}</p>}
              </div>
            </div>
            <p style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.55, margin: 0 }}>{e.note[lang] || e.note.en}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Reading Practice (V2)
// ═══════════════════════════════════════════════════════════════════════════════
const TabReading = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [text, setText] = useState(null);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/reading/texts`).then((r) => r.json()).then((d) => {
      setList(d.items || []);
      if ((d.items || []).length > 0) setSelectedId(d.items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setText(null); setRevealed({});
    fetch(`${API_BASE}/api/korean/reading/${selectedId}`).then((r) => r.json()).then(setText);
  }, [selectedId]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={9} label={t('koreanTeacherModule.tabs.reading')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.reading.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('koreanTeacherModule.reading.subtitle')}</p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6, letterSpacing: '0.06em' }}>{t('koreanTeacherModule.reading.pickText')}</label>
        <select value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value)} style={{ ...selectStyle, fontSize: 14, fontFamily: 'inherit' }}>
          {list.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title} — {r.title_translations[lang] || r.title_translations.en}
            </option>
          ))}
        </select>
      </div>

      {!text ? (
        <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.reading.loading')}</p>
      ) : (
        <>
          <Card accent={COLORS.accent} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: COLORS.accent, margin: 0, fontFamily: KOREAN_FONT }}>{text.title}</p>
              <Button onClick={() => tts.speak(text.segments.map((s) => s.hangul).join(' '))}>{t('koreanTeacherModule.reading.readAloud')}</Button>
            </div>
            <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 14px', fontStyle: 'italic' }}>
              {text.title_translations[lang] || text.title_translations.en}
            </p>
            {text.segments.map((seg, i) => (
              <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < text.segments.length - 1 ? `1px dashed ${COLORS.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <p style={{ fontSize: 18, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.ink, margin: 0 }}>{seg.hangul}</p>
                  <SpeakBtn text={seg.hangul} tts={tts} />
                </div>
                <p style={{ fontSize: 12, color: COLORS.red, fontFamily: 'monospace', margin: '2px 0 6px' }}>{seg.rom}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {seg.words.map((w, j) => (
                    <span key={j} style={{
                      background: COLORS.accentLight, color: COLORS.accent, border: `1px solid ${COLORS.accentBorder}`,
                      borderRadius: 6, padding: '2px 8px', fontSize: 11,
                    }}>
                      <span style={{ fontFamily: KOREAN_FONT, fontWeight: 700 }}>{w.w}</span>
                      <span style={{ marginLeft: 4, fontFamily: 'monospace', opacity: 0.85 }}>{w.r}</span>
                      <span style={{ marginLeft: 4, color: COLORS.inkSoft }}>· {w.m}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card accent={COLORS.red} style={{ background: COLORS.redLight, borderColor: COLORS.redBorder, marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              {t('koreanTeacherModule.reading.translation')}
            </p>
            <p style={{ fontSize: 13, color: COLORS.ink, margin: 0, lineHeight: 1.6 }}>{text.translation[lang] || text.translation.en}</p>
          </Card>

          {text.questions && text.questions.length > 0 && (
            <Card accent={COLORS.gold} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                ? {t('koreanTeacherModule.reading.questions')}
              </p>
              {text.questions.map((q, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 13, color: COLORS.ink, margin: '0 0 4px' }}>{q.q[lang] || q.q.en}</p>
                  {revealed[i] ? (
                    <p style={{ fontSize: 13, color: COLORS.gold, fontWeight: 700, margin: 0 }}>→ {q.a[lang] || q.a.en}</p>
                  ) : (
                    <Button onClick={() => setRevealed({ ...revealed, [i]: true })} style={{ fontSize: 11, padding: '4px 12px' }}>{t('koreanTeacherModule.reading.showAnswer')}</Button>
                  )}
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Speaking Lab (V2)
// ═══════════════════════════════════════════════════════════════════════════════
const TabSpeaking = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [phrases, setPhrases] = useState([]);
  const [idx, setIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = React.useRef(null);
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/speaking/phrases`).then((r) => r.json()).then((d) => setPhrases(d.items || []));
  }, []);

  const cur = phrases[idx];

  const startRecord = useCallback(() => {
    if (!SpeechRecognition || !cur) return;
    setTranscript('');
    const rec = new SpeechRecognition();
    rec.lang = 'ko-KR'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const txt = e.results[0]?.[0]?.transcript || '';
      setTranscript(txt);
      fetch(`${API_BASE}/api/korean/speaking/attempt`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase_id: cur.id, transcript: txt }),
      });
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [SpeechRecognition, cur]);

  const stopRecord = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  }, []);

  if (phrases.length === 0) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.common.loading')}</p>;
  if (!cur) return null;

  const norm = (s) => (s || '').replace(/[.,!?。、？！\s]/g, '').toLowerCase();
  const isMatch = transcript && norm(transcript) === norm(cur.hangul);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
      <SectionLabel index={10} label={t('koreanTeacherModule.tabs.speaking')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.speaking.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('koreanTeacherModule.speaking.subtitle')}</p>

      {!SpeechRecognition && (
        <Card accent={COLORS.gold} style={{ background: COLORS.goldLight, borderColor: COLORS.goldBorder, marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#78350f', margin: 0 }}>⚠ {t('koreanTeacherModule.speaking.noSupport')}</p>
        </Card>
      )}

      <p style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: 'monospace', marginBottom: 10 }}>
        {idx + 1} / {phrases.length} · <Chip color={COLORS.red} light={COLORS.redLight} border={COLORS.redBorder}>{cur.tag}</Chip>
      </p>

      <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          {t('koreanTeacherModule.speaking.target')}
        </p>
        <p style={{ fontSize: 32, fontFamily: KOREAN_FONT, fontWeight: 700, color: COLORS.accent, margin: 0, lineHeight: 1.2 }}>{cur.hangul}</p>
        <p style={{ fontSize: 14, color: COLORS.red, fontFamily: 'monospace', margin: '8px 0 4px' }}>{cur.rom}</p>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: 0 }}>{cur.translations[lang] || cur.translations.en}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Button onClick={() => tts.speak(cur.hangul)}>{t('koreanTeacherModule.speaking.listenBtn')}</Button>
          {!listening ? (
            <Button primary onClick={startRecord} disabled={!SpeechRecognition}>{t('koreanTeacherModule.speaking.recordBtn')}</Button>
          ) : (
            <Button onClick={stopRecord} style={{ background: COLORS.red, color: '#fff', border: 'none' }}>{t('koreanTeacherModule.speaking.stopRecordBtn')}</Button>
          )}
        </div>
      </Card>

      <Card accent={isMatch ? '#15803d' : COLORS.inkSoft} style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          {t('koreanTeacherModule.speaking.heard')}
        </p>
        <p style={{ fontSize: 18, fontFamily: KOREAN_FONT, color: COLORS.ink, margin: 0 }}>
          {transcript || <span style={{ color: COLORS.inkSoft, fontStyle: 'italic', fontSize: 13 }}>{t('koreanTeacherModule.speaking.noMatchYet')}</span>}
        </p>
        {transcript && isMatch && (
          <p style={{ color: '#15803d', fontWeight: 700, marginTop: 8, fontSize: 14 }}>{t('koreanTeacherModule.speaking.goodMatch')}</p>
        )}
        {transcript && !isMatch && (
          <Button onClick={startRecord} style={{ marginTop: 8 }}>{t('koreanTeacherModule.speaking.tryAgain')}</Button>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button onClick={() => { setIdx(Math.max(0, idx - 1)); setTranscript(''); }} disabled={idx === 0}>← {t('koreanTeacherModule.grammar.prev')}</Button>
        <Button primary onClick={() => { setIdx(Math.min(phrases.length - 1, idx + 1)); setTranscript(''); }} disabled={idx === phrases.length - 1}>
          {t('koreanTeacherModule.grammar.next')} →
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Culture (V2)
// ═══════════════════════════════════════════════════════════════════════════════
const TabCulture = () => {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const tts = useKoreanTTS();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/korean/culture/notes`).then((r) => r.json()).then((d) => {
      setNotes(d.items || []);
      if ((d.items || []).length > 0) setActiveId(d.items[0].id);
    });
  }, []);

  if (notes.length === 0) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('koreanTeacherModule.culture.loading')}</p>;

  const categoryColors = {
    language:    { c: COLORS.accent, l: COLORS.accentLight, b: COLORS.accentBorder },
    society:     { c: COLORS.ink,    l: '#f5f5f4',           b: COLORS.border },
    festivals:   { c: COLORS.red,    l: COLORS.redLight,     b: COLORS.redBorder },
    food:        { c: '#059669',     l: '#dcfce7',           b: '#86efac' },
    etiquette:   { c: COLORS.gold,   l: COLORS.goldLight,    b: COLORS.goldBorder },
    pop_culture: { c: '#7c3aed',     l: '#f5f3ff',           b: '#ddd6fe' },
  };

  const cur = notes.find((n) => n.id === activeId);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={11} label={t('koreanTeacherModule.tabs.culture')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('koreanTeacherModule.culture.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('koreanTeacherModule.culture.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map((n) => {
            const isActive = n.id === activeId;
            const cat = categoryColors[n.category] || { c: COLORS.accent, l: COLORS.accentLight, b: COLORS.accentBorder };
            return (
              <button key={n.id} onClick={() => setActiveId(n.id)} style={{
                background: isActive ? cat.l : COLORS.card,
                border: `1px solid ${isActive ? cat.b : COLORS.border}`,
                borderLeft: `4px solid ${cat.c}`,
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 22 }}>{n.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.ink, fontFamily: KOREAN_FONT, margin: 0 }}>{n.title.hangul}</p>
                  <p style={{ fontSize: 11, color: cat.c, fontWeight: 700, margin: '2px 0 0' }}>{n.title[lang] || n.title.en}</p>
                </div>
              </button>
            );
          })}
        </div>

        {cur && (() => {
          const cat = categoryColors[cur.category] || { c: COLORS.accent, l: COLORS.accentLight, b: COLORS.accentBorder };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card accent={cat.c} style={{ background: cat.l, borderColor: cat.b }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 38 }}>{cur.emoji}</span>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 900, color: COLORS.ink, fontFamily: KOREAN_FONT, margin: 0, lineHeight: 1.1 }}>{cur.title.hangul}</p>
                    <p style={{ fontSize: 12, color: COLORS.red, fontFamily: 'monospace', margin: '2px 0 0' }}>{cur.title.rom}</p>
                  </div>
                  <button onClick={() => tts.speak(cur.title.hangul)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}>🔊</button>
                  <Chip color={cat.c} light="#ffffff" border={cat.b}>
                    {t(`koreanTeacherModule.culture.categories.${cur.category}`, { defaultValue: cur.category })}
                  </Chip>
                </div>
                <p style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.65 }}>{cur.summary[lang] || cur.summary.en}</p>
              </Card>

              {cur.vocab?.length > 0 && (
                <Card accent="#7c3aed">
                  <p style={{ color: '#5b21b6', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>📚 {t('koreanTeacherModule.culture.vocab')}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 8 }}>
                    {cur.vocab.map((w, i) => (
                      <div key={i} style={{ background: '#faf5ff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ fontSize: 18, color: COLORS.ink, fontFamily: KOREAN_FONT, fontWeight: 700, margin: 0 }}>{w.w}</p>
                        <p style={{ fontSize: 11, color: COLORS.red, fontFamily: 'monospace', margin: '2px 0 0' }}>{w.r}</p>
                        <p style={{ fontSize: 11, color: COLORS.ink, margin: '2px 0 0' }}>{w.m}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {cur.didYouKnow && (
                <Card accent={COLORS.gold} style={{ background: COLORS.goldLight, borderColor: COLORS.goldBorder }}>
                  <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>💡 {t('koreanTeacherModule.culture.didYouKnow')}</p>
                  <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6, fontStyle: 'italic' }}>{cur.didYouKnow[lang] || cur.didYouKnow.en}</p>
                </Card>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════════════════════
const KoreanTeacher = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard',    label: t('koreanTeacherModule.tabs.dashboard'),    icon: '📋' },
    { id: 'hangul',       label: t('koreanTeacherModule.tabs.hangul'),       icon: '한' },
    { id: 'syllable',     label: t('koreanTeacherModule.tabs.syllable'),     icon: '글' },
    { id: 'batchim',      label: t('koreanTeacherModule.tabs.batchim'),      icon: '받' },
    { id: 'vocabulary',   label: t('koreanTeacherModule.tabs.vocabulary'),   icon: '📚' },
    { id: 'grammar',      label: t('koreanTeacherModule.tabs.grammar'),      icon: '📐' },
    { id: 'conversation', label: t('koreanTeacherModule.tabs.conversation'), icon: '💬' },
    { id: 'conversationAudio', label: t('koreanTeacherModule.tabs.conversationAudio'), icon: '🎙' },
    { id: 'reading',      label: t('koreanTeacherModule.tabs.reading'),      icon: '📖' },
    { id: 'speaking',     label: t('koreanTeacherModule.tabs.speaking'),     icon: '🎤' },
    { id: 'culture',      label: t('koreanTeacherModule.tabs.culture'),      icon: '🏯' },
    { id: 'bridge',       label: t('koreanTeacherModule.tabs.bridge'),       icon: '🌉' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <TabDashboard onJump={(id) => setActiveTab(id)} />;
      case 'hangul':       return <TabHangul />;
      case 'syllable':     return <TabSyllable />;
      case 'batchim':      return <TabBatchim />;
      case 'vocabulary':   return <TabVocabulary />;
      case 'grammar':      return <TabGrammar />;
      case 'conversation': return <TabConversation />;
      case 'conversationAudio': return <TabConversationAudio />;
      case 'reading':      return <TabReading />;
      case 'speaking':     return <TabSpeaking />;
      case 'culture':      return <TabCulture />;
      case 'bridge':       return <TabBridge />;
      default:             return <TabDashboard onJump={(id) => setActiveTab(id)} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.bg, fontFamily: 'inherit' }}>
      {/* Hero */}
      <div style={{ background: COLORS.card, borderBottom: `2px solid ${COLORS.border}`, padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: COLORS.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('koreanTeacherModule.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('koreanTeacherModule.futureAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16,
                         background: `linear-gradient(135deg,${COLORS.accent} 50%, ${COLORS.red} 50%)`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                         boxShadow: '0 4px 14px rgba(0,52,120,0.25)', color: '#fff',
                         fontFamily: KOREAN_FONT, fontWeight: 800 }}>한</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink, margin: 0, lineHeight: 1.15 }}>{t('koreanTeacherModule.title')}</h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 12, margin: '4px 0 0', fontFamily: KOREAN_FONT }}>{t('koreanTeacherModule.subtitle')}</p>
            <p style={{ color: COLORS.inkSoft, fontSize: 13, margin: '4px 0 0' }}>{t('koreanTeacherModule.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '0 32px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHangulIcon = tab.icon.length === 1 && tab.icon.charCodeAt(0) > 12000;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              color: isActive ? COLORS.accent : COLORS.inkSoft, fontWeight: isActive ? 800 : 600,
              padding: '14px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 15, fontFamily: isHangulIcon ? KOREAN_FONT : 'inherit', fontWeight: isHangulIcon ? 700 : 'inherit' }}>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>{renderContent()}</div>
    </div>
  );
};

export default KoreanTeacher;
