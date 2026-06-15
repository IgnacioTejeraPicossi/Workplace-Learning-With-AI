/**
 * Japanese Sensei AI — Functional V1
 * ===================================
 * 5 tabs: Dashboard · Kana Trainer · Kanji Dojo · Conversation Sensei · Vocabulary SRS
 * Design: light washi cream background with sumi-red accents — sits next to the
 *         existing agents without breaking the colour palette.
 *
 * Backend: /api/japanese/*
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en';

// ─── Design tokens (washi / sumi palette) ─────────────────────────────────────
const COLORS = {
  bg:        'linear-gradient(160deg,#fef8f0 0%,#fefefe 50%,#fff5f5 100%)',
  card:      '#ffffff',
  border:    '#e5e7eb',
  ink:       '#1c1917',          // sumi
  inkSoft:   '#57534e',
  accent:    '#dc2626',          // sumi-red
  accentLight:'#fef2f2',
  accentBorder:'#fecaca',
  gold:      '#a16207',
  goldLight: '#fef3c7',
  goldBorder:'#fde68a',
  cream:     '#fef8f0',
};

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
              : primary ? `linear-gradient(135deg,${COLORS.accent},#b91c1c)`
                        : COLORS.card,
    color: disabled ? '#9ca3af' : primary ? '#ffffff' : COLORS.ink,
    border: primary ? 'none' : `1px solid ${COLORS.border}`,
    borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: primary ? '0 2px 8px rgba(220,38,38,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
    fontFamily: 'inherit', transition: 'transform 0.06s',
    ...style,
  }}>{children}</button>
);

const Chip = ({ children, color = COLORS.accent, light = COLORS.accentLight, border = COLORS.accentBorder }) => (
  <span style={{
    background: light, color, border: `1px solid ${border}`, borderRadius: 999,
    padding: '2px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    display: 'inline-flex', alignItems: 'center',
  }}>{children}</span>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Dashboard (Overview + Progress fused)
// ═══════════════════════════════════════════════════════════════════════════════
const TabDashboard = ({ onJump }) => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/japanese/overview`)
      .then((r) => r.json())
      .then((d) => { setOverview(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 64, textAlign: 'center', color: COLORS.inkSoft }}>{t('japaneseSenseiModule.dashboard.loading')}</div>;
  if (!overview) return <div style={{ padding: 64, textAlign: 'center', color: COLORS.accent }}>{t('japaneseSenseiModule.common.error')}</div>;

  const { stats, todays_mission: mission, level, jlpt_target, streak_days } = overview;
  const missionTarget = { kana: 'kana', kanji: 'kanji', srs: 'vocabulary', conv: 'conversation' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('japaneseSenseiModule.tabs.dashboard')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('japaneseSenseiModule.dashboard.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('japaneseSenseiModule.dashboard.subtitle')}</p>

      {/* Level + JLPT + Streak band */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`,
                       borderTop: `3px solid ${COLORS.accent}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('japaneseSenseiModule.dashboard.level')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#7f1d1d', fontFamily: 'inherit' }}>{level}</p>
        </div>
        <div style={{ background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`,
                       borderTop: `3px solid ${COLORS.gold}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.gold, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('japaneseSenseiModule.dashboard.jlpt')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#78350f', fontFamily: 'monospace' }}>{jlpt_target}</p>
        </div>
        <div style={{ background: '#f5f5f4', border: `1px solid ${COLORS.border}`,
                       borderTop: `3px solid ${COLORS.ink}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('japaneseSenseiModule.dashboard.streak')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, fontFamily: 'monospace' }}>
            🔥 {streak_days} <span style={{ fontSize: 12, color: COLORS.inkSoft }}>{t('japaneseSenseiModule.dashboard.days')}</span>
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <SectionLabel index={2} label="STATS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('japaneseSenseiModule.dashboard.kanaKnown')}  value={stats.kana_known}  max={stats.kana_total}  color={COLORS.accent} />
        <Stat label={t('japaneseSenseiModule.dashboard.kanjiKnown')} value={stats.kanji_known} max={stats.kanji_total} color="#7c3aed" />
        <Stat label={t('japaneseSenseiModule.dashboard.vocabKnown')} value={stats.vocab_known} max={stats.vocab_total} color="#059669" />
        <Stat label={t('japaneseSenseiModule.dashboard.srsDue')}     value={stats.srs_due_today} color={COLORS.gold} />
        <Stat label={t('japaneseSenseiModule.dashboard.newToday')}   value={stats.srs_new_today} color="#2563eb" />
      </div>

      {/* Today's mission */}
      <SectionLabel index={3} label={t('japaneseSenseiModule.dashboard.todaysMission')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {mission.map((m, i) => (
          <Card key={i} accent={['#dc2626','#7c3aed','#059669','#2563eb'][i % 4]}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div onClick={() => onJump?.(missionTarget[m.type])} style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {t(`japaneseSenseiModule.dashboard.missionLabels.${m.type}`)}
              </p>
              <p style={{ fontSize: 18, fontWeight: 900, color: COLORS.ink, fontFamily: 'monospace' }}>{m.count}</p>
            </div>
            <span style={{ fontSize: 22 }}>{ {kana:'あ', kanji:'漢', srs:'📚', conv:'💬'}[m.type] }</span>
          </Card>
        ))}
      </div>

      <Button primary onClick={() => onJump?.('kana')}>{t('japaneseSenseiModule.dashboard.continue')} →</Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Kana Trainer
// ═══════════════════════════════════════════════════════════════════════════════
const TabKana = () => {
  const { t } = useTranslation();
  const [kanaType, setKanaType] = useState('hiragana');
  const [mode, setMode]         = useState('recognize');
  const [deck, setDeck]         = useState([]);
  const [active, setActive]     = useState(false);
  const [current, setCurrent]   = useState(null);
  const [options, setOptions]   = useState([]);
  const [answered, setAnswered] = useState(null);
  const [score, setScore]       = useState({ correct: 0, total: 0 });
  const [loading, setLoading]   = useState(false);

  const loadDeck = useCallback((type) => {
    setLoading(true);
    fetch(`${API_BASE}/api/japanese/kana/deck?type=${type}`)
      .then((r) => r.json())
      .then((d) => { setDeck(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadDeck(kanaType); }, [kanaType, loadDeck]);

  const pickQuestion = useCallback(() => {
    if (deck.length === 0) return;
    const idx = Math.floor(Math.random() * deck.length);
    const card = deck[idx];
    const distractors = [];
    const pool = deck.filter((_, i) => i !== idx);
    while (distractors.length < 3 && pool.length > 0) {
      const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!distractors.find((d) => d.romaji === p.romaji)) distractors.push(p);
    }
    const opts = [...distractors, card].sort(() => Math.random() - 0.5);
    setCurrent(card);
    setOptions(opts);
    setAnswered(null);
  }, [deck]);

  const start = () => {
    setScore({ correct: 0, total: 0 });
    setActive(true);
    pickQuestion();
  };

  const answer = async (opt) => {
    if (answered) return;
    const correct = mode === 'recognize' ? opt.romaji === current.romaji : opt.char === current.char;
    setAnswered({ correct, picked: opt });
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    try {
      await fetch(`${API_BASE}/api/japanese/kana/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ char: current.char, correct }),
      });
    } catch {}
  };

  useEffect(() => { if (active && deck.length > 0 && !current) pickQuestion(); }, [active, deck, current, pickQuestion]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 880, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('japaneseSenseiModule.tabs.kana')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('japaneseSenseiModule.kana.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('japaneseSenseiModule.kana.subtitle')}</p>

      {/* Config */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14,
                     padding: '18px 22px', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kana.pickType')}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {['hiragana', 'katakana', 'all'].map((k) => (
              <button key={k} onClick={() => { setKanaType(k); setActive(false); setCurrent(null); }} style={{
                background: kanaType === k ? COLORS.accent : COLORS.card,
                color: kanaType === k ? '#fff' : COLORS.ink,
                border: `1px solid ${kanaType === k ? COLORS.accent : COLORS.border}`,
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>{t(`japaneseSenseiModule.kana.${k === 'all' ? 'mixed' : k}`)}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kana.mode')}</p>
          <select value={mode} onChange={(e) => { setMode(e.target.value); setActive(false); setCurrent(null); }}
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8,
                           padding: '7px 10px', fontSize: 12, cursor: 'pointer', color: COLORS.ink }}>
            <option value="recognize">{t('japaneseSenseiModule.kana.modeRecognize')}</option>
            <option value="recall">{t('japaneseSenseiModule.kana.modeRecall')}</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {active && (
            <span style={{ fontSize: 13, color: COLORS.ink }}>
              <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginRight: 6, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kana.score')}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, color: COLORS.accent }}>{score.correct}/{score.total}</span>
            </span>
          )}
          <Button primary={!active} onClick={active ? () => { setActive(false); setCurrent(null); } : start}>
            {active ? t('japaneseSenseiModule.kana.endSession') : t('japaneseSenseiModule.kana.startBtn')}
          </Button>
        </div>
      </div>

      {/* Quiz */}
      {loading && <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('japaneseSenseiModule.kana.loading')}</p>}
      {!loading && active && current && (
        <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: '40px 24px' }}>
          <p style={{ color: COLORS.inkSoft, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 18, textTransform: 'uppercase' }}>
            {mode === 'recognize' ? t('japaneseSenseiModule.kana.question') : `${t('japaneseSenseiModule.kana.questionRecall')} "${current.romaji}"?`}
          </p>
          {mode === 'recognize' && (
            <p style={{ fontSize: 110, fontWeight: 900, color: COLORS.ink, lineHeight: 1, marginBottom: 24, fontFamily: '"Yu Mincho","Noto Serif JP",serif' }}>{current.char}</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, maxWidth: 560, margin: '0 auto' }}>
            {options.map((opt, i) => {
              const isPicked = answered?.picked === opt;
              const isCorrect = mode === 'recognize' ? opt.romaji === current.romaji : opt.char === current.char;
              const showState = answered && (isPicked || isCorrect);
              const stateColor = showState ? (isCorrect ? '#059669' : COLORS.accent) : COLORS.border;
              const stateBg    = showState ? (isCorrect ? '#ecfdf5' : COLORS.accentLight) : COLORS.card;
              return (
                <button key={i} onClick={() => answer(opt)} disabled={!!answered} style={{
                  background: stateBg, color: COLORS.ink,
                  border: `2px solid ${stateColor}`, borderRadius: 10, padding: '14px 8px',
                  fontSize: mode === 'recognize' ? 18 : 36, fontWeight: 800,
                  cursor: answered ? 'default' : 'pointer',
                  fontFamily: mode === 'recall' ? '"Yu Mincho","Noto Serif JP",serif' : 'monospace',
                }}>{mode === 'recognize' ? opt.romaji : opt.char}</button>
              );
            })}
          </div>
          {answered && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: answered.correct ? '#059669' : COLORS.accent, marginBottom: 14 }}>
                {answered.correct ? t('japaneseSenseiModule.kana.correct') : `${t('japaneseSenseiModule.kana.wrong')} ${mode === 'recognize' ? current.romaji : current.char}`}
              </p>
              <Button primary onClick={pickQuestion}>{t('japaneseSenseiModule.kana.next')} →</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Kanji Dojo
// ═══════════════════════════════════════════════════════════════════════════════
const TabKanji = () => {
  const { t } = useTranslation();
  const [deck, setDeck]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/japanese/kanji/deck`)
      .then((r) => r.json())
      .then((d) => { setDeck(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const mark = async (status) => {
    if (!current) return;
    try {
      await fetch(`${API_BASE}/api/japanese/kanji/mark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ char: current.char, status }),
      });
    } catch {}
    setSelectedIdx((i) => Math.min(deck.length - 1, i + 1));
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('japaneseSenseiModule.kanji.loading')}</p>;
  const current = deck[selectedIdx];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('japaneseSenseiModule.tabs.kanji')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('japaneseSenseiModule.kanji.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('japaneseSenseiModule.kanji.subtitle')}</p>

      {/* Kanji strip selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {deck.map((k, i) => (
          <button key={k.char} onClick={() => setSelectedIdx(i)} style={{
            background: i === selectedIdx ? COLORS.accent : COLORS.card,
            color: i === selectedIdx ? '#fff' : COLORS.ink,
            border: `2px solid ${i === selectedIdx ? COLORS.accent : COLORS.border}`,
            borderRadius: 10, width: 56, height: 56, fontSize: 28,
            cursor: 'pointer', fontFamily: '"Yu Mincho","Noto Serif JP",serif', fontWeight: 800,
          }}>{k.char}</button>
        ))}
      </div>

      {current && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
          {/* Big character + strokes + JLPT */}
          <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: 28 }}>
            <p style={{ fontSize: 180, lineHeight: 1, color: COLORS.ink, fontFamily: '"Yu Mincho","Noto Serif JP",serif', fontWeight: 800 }}>{current.char}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <Chip color={COLORS.gold} light={COLORS.goldLight} border={COLORS.goldBorder}>{current.jlpt}</Chip>
              <Chip>{t('japaneseSenseiModule.kanji.strokes')}: {current.strokes}</Chip>
            </div>
          </Card>
          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card accent="#7c3aed">
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kanji.meaning')}</p>
              <p style={{ color: COLORS.ink, fontSize: 18, fontWeight: 800 }}>{current.meaning}</p>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card accent={COLORS.accent}>
                <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kanji.onyomi')}</p>
                <p style={{ color: COLORS.ink, fontSize: 16, fontFamily: '"Yu Mincho","Noto Serif JP",serif' }}>{current.onyomi.join(' · ')}</p>
              </Card>
              <Card accent="#059669">
                <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kanji.kunyomi')}</p>
                <p style={{ color: COLORS.ink, fontSize: 16, fontFamily: '"Yu Mincho","Noto Serif JP",serif' }}>{current.kunyomi.join(' · ')}</p>
              </Card>
            </div>
            <Card accent={COLORS.gold}>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kanji.exampleWords')}</p>
              {current.words.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 0', borderBottom: i < current.words.length - 1 ? `1px dashed ${COLORS.border}` : 'none' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, fontFamily: '"Yu Mincho","Noto Serif JP",serif', minWidth: 70 }}>{w.word}</span>
                  <span style={{ fontSize: 13, color: COLORS.inkSoft, fontFamily: '"Yu Mincho","Noto Serif JP",serif' }}>{w.kana}</span>
                  <span style={{ fontSize: 13, color: COLORS.ink, marginLeft: 'auto' }}>{w.meaning}</span>
                </div>
              ))}
            </Card>
            <Card accent="#2563eb">
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.kanji.exampleSentence')}</p>
              <p style={{ fontSize: 18, color: COLORS.ink, fontFamily: '"Yu Mincho","Noto Serif JP",serif', marginBottom: 4 }}>{current.sentence.jp}</p>
              <p style={{ fontSize: 13, color: COLORS.inkSoft, fontFamily: '"Yu Mincho","Noto Serif JP",serif', marginBottom: 6 }}>{current.sentence.kana}</p>
              <p style={{ fontSize: 13, color: COLORS.ink, fontStyle: 'italic' }}>{current.sentence.en}</p>
            </Card>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => mark('learning')}>{t('japaneseSenseiModule.kanji.markLearning')}</Button>
              <Button onClick={() => mark('review')} style={{ background: COLORS.goldLight, borderColor: COLORS.goldBorder, color: '#78350f' }}>{t('japaneseSenseiModule.kanji.markReview')}</Button>
              <Button primary onClick={() => mark('known')}>{t('japaneseSenseiModule.kanji.markKnown')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conversation Sensei (LLM-backed)
// ═══════════════════════════════════════════════════════════════════════════════
const TabConversation = () => {
  const { t, i18n } = useTranslation();
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario]   = useState('intro');
  const [difficulty, setDifficulty] = useState('beginner');
  const [started, setStarted]     = useState(false);
  const [history, setHistory]     = useState([]);
  const [userText, setUserText]   = useState('');
  const [sending, setSending]     = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/japanese/conversation/scenarios?lang=${toLang(i18n.language)}`)
      .then((r) => r.json())
      .then((d) => setScenarios(d.scenarios || []))
      .catch(() => {});
  }, [i18n.language]);

  const sendTurn = async (text) => {
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/japanese/conversation/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario, difficulty,
          history: history.map((h) => ({ role: h.role, content: h.role === 'assistant' ? h.payload.jp : h.content })),
          user_text: text, lang: toLang(i18n.language),
        }),
      });
      const data = await res.json();
      setHistory((h) => {
        const next = [...h];
        if (text) next.push({ role: 'user', content: text });
        next.push({ role: 'assistant', payload: data });
        return next;
      });
    } catch (e) {
      setHistory((h) => [...h, { role: 'system', content: t('japaneseSenseiModule.common.error') }]);
    } finally { setSending(false); }
  };

  const startConversation = async () => {
    setStarted(true);
    setHistory([]);
    await sendTurn(null);
  };

  const send = async () => {
    if (!userText.trim() || sending) return;
    const text = userText.trim();
    setUserText('');
    await sendTurn(text);
  };

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }); }, [history]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 880, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('japaneseSenseiModule.tabs.conversation')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('japaneseSenseiModule.conversation.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('japaneseSenseiModule.conversation.subtitle')}</p>

      {!started ? (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.conversation.scenario')}</p>
              <select value={scenario} onChange={(e) => setScenario(e.target.value)}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`,
                               borderRadius: 8, padding: '9px 12px', fontSize: 13, color: COLORS.ink }}>
                {scenarios.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('japaneseSenseiModule.conversation.difficulty')}</p>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`,
                               borderRadius: 8, padding: '9px 12px', fontSize: 13, color: COLORS.ink }}>
                <option value="beginner">{t('japaneseSenseiModule.conversation.beginner')}</option>
                <option value="intermediate">{t('japaneseSenseiModule.conversation.intermediate')}</option>
                <option value="advanced">{t('japaneseSenseiModule.conversation.advanced')}</option>
              </select>
            </div>
          </div>
          <Button primary onClick={startConversation}>💬 {t('japaneseSenseiModule.conversation.startBtn')}</Button>
        </div>
      ) : (
        <>
          <button onClick={() => { setStarted(false); setHistory([]); }} style={{
            background: 'transparent', border: 'none', color: COLORS.accent, fontSize: 12,
            cursor: 'pointer', marginBottom: 12, fontWeight: 600,
          }}>{t('japaneseSenseiModule.conversation.newConversation')}</button>

          <div ref={scrollRef} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14,
            padding: '18px 22px', maxHeight: 480, overflowY: 'auto', marginBottom: 14,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {history.map((turn, i) => {
              if (turn.role === 'user') return (
                <div key={i} style={{ alignSelf: 'flex-end', background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`,
                                       borderRadius: 12, padding: '10px 14px', maxWidth: '75%', fontSize: 14, color: COLORS.ink,
                                       fontFamily: '"Yu Mincho","Noto Serif JP",serif' }}>{turn.content}</div>
              );
              if (turn.role === 'system') return (
                <div key={i} style={{ alignSelf: 'center', color: COLORS.inkSoft, fontSize: 12 }}>{turn.content}</div>
              );
              const p = turn.payload;
              return (
                <div key={i} style={{ alignSelf: 'flex-start', background: '#fef8f0', border: `1px solid ${COLORS.border}`,
                                       borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 12, padding: '12px 14px', maxWidth: '85%' }}>
                  <p style={{ fontSize: 18, color: COLORS.ink, fontFamily: '"Yu Mincho","Noto Serif JP",serif', fontWeight: 700, marginBottom: 4 }}>{p.jp}</p>
                  {p.kana && p.kana !== p.jp && (
                    <p style={{ fontSize: 12, color: COLORS.inkSoft, fontFamily: '"Yu Mincho","Noto Serif JP",serif', marginBottom: 4 }}><strong style={{ color: COLORS.accent, fontSize: 9, letterSpacing: '0.1em' }}>{t('japaneseSenseiModule.conversation.kanaLabel')}:</strong> {p.kana}</p>
                  )}
                  {p.romaji && (
                    <p style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: 'italic', marginBottom: 4 }}>{p.romaji}</p>
                  )}
                  {p.translation && (
                    <p style={{ fontSize: 12, color: COLORS.ink, marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${COLORS.border}` }}>{p.translation}</p>
                  )}
                  {p.hint && (
                    <p style={{ fontSize: 11, color: COLORS.gold, marginTop: 6, fontStyle: 'italic' }}>💡 {p.hint}</p>
                  )}
                  {p.correction && (
                    <p style={{ fontSize: 11, color: '#2563eb', marginTop: 6, fontStyle: 'italic' }}>✎ {p.correction}</p>
                  )}
                  {p.is_mock && (
                    <p style={{ fontSize: 9, color: COLORS.gold, marginTop: 8, letterSpacing: '0.08em' }}>{t('japaneseSenseiModule.conversation.noLLM')}</p>
                  )}
                </div>
              );
            })}
            {sending && <div style={{ alignSelf: 'flex-start', color: COLORS.inkSoft, fontSize: 12 }}>{t('japaneseSenseiModule.conversation.sending')}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={userText} onChange={(e) => setUserText(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                   placeholder={t('japaneseSenseiModule.conversation.yourReply')}
                   style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                            padding: '11px 14px', fontSize: 14, color: COLORS.ink, outline: 'none' }} />
            <Button primary disabled={sending || !userText.trim()} onClick={send}>
              {sending ? t('japaneseSenseiModule.conversation.sending') : t('japaneseSenseiModule.conversation.send')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Vocabulary SRS
// ═══════════════════════════════════════════════════════════════════════════════
const TabVocabulary = () => {
  const { t } = useTranslation();
  const [queue, setQueue]     = useState([]);
  const [idx, setIdx]         = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone]       = useState(false);

  const load = useCallback(() => {
    setLoading(true); setDone(false); setIdx(0); setRevealed(false);
    fetch(`${API_BASE}/api/japanese/srs/due?limit=20`)
      .then((r) => r.json())
      .then((d) => { setQueue(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const grade = async (g) => {
    const item = queue[idx];
    if (!item) return;
    try {
      await fetch(`${API_BASE}/api/japanese/srs/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocab_id: item.id, grade: g }),
      });
    } catch {}
    setRevealed(false);
    if (idx >= queue.length - 1) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('japaneseSenseiModule.vocabulary.loading')}</p>;

  const item = queue[idx];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('japaneseSenseiModule.tabs.vocabulary')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('japaneseSenseiModule.vocabulary.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('japaneseSenseiModule.vocabulary.subtitle')}</p>

      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: COLORS.inkSoft, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('japaneseSenseiModule.vocabulary.due')}: <span style={{ color: COLORS.accent, fontFamily: 'monospace', fontWeight: 900 }}>{Math.max(0, queue.length - idx)}</span>
        </span>
        <span style={{ color: COLORS.inkSoft, fontSize: 11, fontFamily: 'monospace' }}>{idx + 1} / {queue.length}</span>
      </div>

      {done || !item ? (
        <Card accent="#059669" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎉</p>
          <p style={{ fontSize: 15, color: COLORS.ink, marginBottom: 18, fontWeight: 700 }}>
            {queue.length === 0 ? t('japaneseSenseiModule.vocabulary.noDue') : t('japaneseSenseiModule.vocabulary.endOfSession')}
          </p>
          <Button primary onClick={load}>{t('japaneseSenseiModule.kana.tryAgain')}</Button>
        </Card>
      ) : (
        <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: '36px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {item.is_new && <Chip color="#2563eb" light="#eff6ff" border="#bfdbfe">{t('japaneseSenseiModule.vocabulary.newCard')}</Chip>}
            <Chip>{item.level}</Chip>
            <Chip color={COLORS.gold} light={COLORS.goldLight} border={COLORS.goldBorder}>{t('japaneseSenseiModule.vocabulary.stage')} {item.stage ?? 0}</Chip>
          </div>
          <p style={{ fontSize: 56, fontWeight: 900, color: COLORS.ink, fontFamily: '"Yu Mincho","Noto Serif JP",serif', marginBottom: 8, lineHeight: 1.1 }}>{item.word}</p>
          <p style={{ fontSize: 16, color: COLORS.inkSoft, fontFamily: '"Yu Mincho","Noto Serif JP",serif', marginBottom: 8 }}>{item.kana}</p>
          <p style={{ fontSize: 12, color: COLORS.inkSoft, fontStyle: 'italic', marginBottom: 18 }}>{item.romaji}</p>

          {!revealed ? (
            <Button primary onClick={() => setRevealed(true)}>{t('japaneseSenseiModule.vocabulary.showAnswer')}</Button>
          ) : (
            <>
              <p style={{ fontSize: 22, color: COLORS.ink, fontWeight: 700, marginBottom: 6 }}>{item.meaning}</p>
              {item.tags?.length > 0 && (
                <p style={{ fontSize: 10, color: COLORS.inkSoft, letterSpacing: '0.06em', marginBottom: 20 }}>
                  {t('japaneseSenseiModule.vocabulary.tags')}: {item.tags.join(' · ')}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <Button onClick={() => grade('again')} style={{ background: COLORS.accentLight, borderColor: COLORS.accentBorder, color: COLORS.accent }}>
                  ✗ {t('japaneseSenseiModule.vocabulary.again')}
                </Button>
                <Button onClick={() => grade('good')} primary>
                  {t('japaneseSenseiModule.vocabulary.good')}
                </Button>
                <Button onClick={() => grade('easy')} style={{ background: '#ecfdf5', borderColor: '#bbf7d0', color: '#059669' }}>
                  ✓✓ {t('japaneseSenseiModule.vocabulary.easy')}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════════════════════
const JapaneseSensei = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard',    label: t('japaneseSenseiModule.tabs.dashboard'),    icon: '📋' },
    { id: 'kana',         label: t('japaneseSenseiModule.tabs.kana'),         icon: 'あ' },
    { id: 'kanji',        label: t('japaneseSenseiModule.tabs.kanji'),        icon: '漢' },
    { id: 'conversation', label: t('japaneseSenseiModule.tabs.conversation'), icon: '💬' },
    { id: 'vocabulary',   label: t('japaneseSenseiModule.tabs.vocabulary'),   icon: '📚' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <TabDashboard onJump={(id) => setActiveTab(id)} />;
      case 'kana':         return <TabKana />;
      case 'kanji':        return <TabKanji />;
      case 'conversation': return <TabConversation />;
      case 'vocabulary':   return <TabVocabulary />;
      default:             return <TabDashboard onJump={(id) => setActiveTab(id)} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.bg, fontFamily: 'inherit' }}>
      {/* Hero */}
      <div style={{ background: COLORS.card, borderBottom: `2px solid ${COLORS.border}`, padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: COLORS.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('japaneseSenseiModule.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('japaneseSenseiModule.futureAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg,${COLORS.accent},#7f1d1d)`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0,
                         boxShadow: '0 4px 14px rgba(220,38,38,0.25)', color: '#fff', fontFamily: '"Yu Mincho","Noto Serif JP",serif', fontWeight: 800 }}>侍</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink, margin: 0, lineHeight: 1.15 }}>{t('japaneseSenseiModule.title')}</h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 13, margin: '4px 0 0' }}>{t('japaneseSenseiModule.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '0 32px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              color: isActive ? COLORS.accent : COLORS.inkSoft, fontWeight: isActive ? 800 : 600,
              padding: '14px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 15, fontFamily: tab.icon.length === 1 && tab.icon.charCodeAt(0) > 12000 ? '"Yu Mincho","Noto Serif JP",serif' : 'inherit' }}>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>{renderContent()}</div>
    </div>
  );
};

export default JapaneseSensei;
