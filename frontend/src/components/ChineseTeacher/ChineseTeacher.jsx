/**
 * Maestro Chino IA — V1+ Functional
 * ==================================
 * 8 tabs: Dashboard · Pinyin & Tones · Hanzi Dojo · Radicals · Vocabulary SRS
 *         · Grammar · Conversation · Kanji-Hanzi Bridge
 *
 * Visual: cream gradient bg with imperial red (#c81d2e) + imperial gold (#b45309)
 *         accents. Hero with 🐉 dragon. Diferentiated from the Japanese washi
 *         palette while staying coherent (light, readable, cards).
 *
 * Backend: /api/chinese/*
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChineseTTS } from './useChineseTTS';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en';

// ─── Design tokens (Chinese imperial palette) ─────────────────────────────────
const COLORS = {
  bg:        'linear-gradient(160deg,#fffaf0 0%,#fffefe 50%,#fff5f0 100%)',
  card:      '#ffffff',
  border:    '#e5e7eb',
  ink:       '#18181b',
  inkSoft:   '#52525b',
  accent:    '#c81d2e',          // imperial Chinese red
  accentLight:'#fef2f2',
  accentBorder:'#fecaca',
  gold:      '#b45309',          // imperial gold
  goldLight: '#fffbeb',
  goldBorder:'#fde68a',
  jade:      '#0d9488',          // jade green for Japanese cards in Bridge
  jadeLight: '#f0fdfa',
  jadeBorder:'#99f6e4',
};

const CHINESE_FONT = '"Noto Serif SC","Songti SC","SimSun",serif';

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
              : primary ? `linear-gradient(135deg,${COLORS.accent},#8b0a14)`
                        : COLORS.card,
    color: disabled ? '#9ca3af' : primary ? '#ffffff' : COLORS.ink,
    border: primary ? 'none' : `1px solid ${COLORS.border}`,
    borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: primary ? '0 2px 8px rgba(200,29,46,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
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

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TabDashboard = ({ onJump }) => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/overview`)
      .then((r) => r.json())
      .then((d) => { setOverview(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 64, textAlign: 'center', color: COLORS.inkSoft }}>{t('chineseTeacherModule.dashboard.loading')}</div>;
  if (!overview) return <div style={{ padding: 64, textAlign: 'center', color: COLORS.accent }}>{t('chineseTeacherModule.common.error')}</div>;

  const { stats, todays_mission: mission, level, hsk_target, streak_days } = overview;
  const missionTarget = { pinyin: 'pinyin', tones: 'pinyin', hanzi: 'hanzi', srs: 'vocabulary', conv: 'conversation' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('chineseTeacherModule.tabs.dashboard')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.dashboard.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('chineseTeacherModule.dashboard.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`,
                       borderTop: `3px solid ${COLORS.accent}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('chineseTeacherModule.dashboard.level')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#7f1d1d' }}>{level}</p>
        </div>
        <div style={{ background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`,
                       borderTop: `3px solid ${COLORS.gold}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.gold, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('chineseTeacherModule.dashboard.hsk')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#78350f', fontFamily: 'monospace' }}>{hsk_target}</p>
        </div>
        <div style={{ background: '#f5f5f4', border: `1px solid ${COLORS.border}`,
                       borderTop: `3px solid ${COLORS.ink}`, borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ color: COLORS.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('chineseTeacherModule.dashboard.streak')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, fontFamily: 'monospace' }}>
            🔥 {streak_days} <span style={{ fontSize: 12, color: COLORS.inkSoft }}>{t('chineseTeacherModule.dashboard.days')}</span>
          </p>
        </div>
      </div>

      <SectionLabel index={2} label="STATS" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('chineseTeacherModule.dashboard.pinyinTotal')}   value={stats.pinyin_total} color={COLORS.accent} />
        <Stat label={t('chineseTeacherModule.dashboard.hanziKnown')}    value={stats.hanzi_known} max={stats.hanzi_total} color="#7c3aed" />
        <Stat label={t('chineseTeacherModule.dashboard.radicalsTotal')} value={stats.radicals_total} color={COLORS.gold} />
        <Stat label={t('chineseTeacherModule.dashboard.vocabKnown')}    value={stats.vocab_known} max={stats.vocab_total} color="#059669" />
        <Stat label={t('chineseTeacherModule.dashboard.srsDue')}        value={stats.srs_due_today} color="#2563eb" />
      </div>

      <SectionLabel index={3} label={t('chineseTeacherModule.dashboard.todaysMission')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {mission.map((m, i) => (
          <Card key={i} accent={['#c81d2e','#b45309','#7c3aed','#059669','#2563eb'][i % 5]}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <div onClick={() => onJump?.(missionTarget[m.type])} style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {t(`chineseTeacherModule.dashboard.missionLabels.${m.type}`)}
              </p>
              <p style={{ fontSize: 18, fontWeight: 900, color: COLORS.ink, fontFamily: 'monospace' }}>{m.count}</p>
            </div>
            <span style={{ fontSize: 22 }}>{ {pinyin:'拼', tones:'声', hanzi:'汉', srs:'📚', conv:'💬'}[m.type] || '·' }</span>
          </Card>
        ))}
      </div>

      <Button primary onClick={() => onJump?.('pinyin')}>{t('chineseTeacherModule.dashboard.continue')} →</Button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Pinyin & Tones
// ═══════════════════════════════════════════════════════════════════════════════
const TabPinyin = () => {
  const { t } = useTranslation();
  const [deck, setDeck] = useState(null);
  const tts = useChineseTTS();

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/pinyin/deck`)
      .then((r) => r.json()).then(setDeck);
  }, []);

  if (!deck) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('chineseTeacherModule.pinyin.loading')}</p>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('chineseTeacherModule.tabs.pinyin')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.pinyin.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 22 }}>{t('chineseTeacherModule.pinyin.subtitle')}</p>

      {tts.supported && !tts.zhVoice && tts.voices.length > 0 && (
        <div style={{ background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`, borderLeft: `4px solid ${COLORS.gold}`,
                       borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#78350f' }}>
          ⚠ {t('chineseTeacherModule.pinyin.noJaVoice')}
        </div>
      )}
      {tts.zhVoice && (
        <div style={{ marginBottom: 14, fontSize: 11, color: COLORS.inkSoft }}>
          🔊 <span style={{ fontFamily: 'monospace', color: COLORS.ink }}>{tts.zhVoice.name}</span> <span style={{ color: COLORS.gold }}>({tts.zhVoice.lang})</span>
        </div>
      )}

      {/* Tones — the heart of Mandarin */}
      <Card accent={COLORS.accent} style={{ marginBottom: 16 }}>
        <p style={{ color: COLORS.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>{t('chineseTeacherModule.pinyin.tones')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {deck.tones.map((tone) => (
            <div key={tone.num} style={{ background: '#fef8f5', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 30, fontWeight: 900, color: COLORS.accent, fontFamily: CHINESE_FONT, marginBottom: 4 }}>{tone.mark}</p>
              <p style={{ fontSize: 10, color: COLORS.inkSoft, marginBottom: 6 }}>{tone.name}</p>
              <p style={{ fontSize: 13, color: COLORS.ink, fontFamily: 'monospace' }}>{tone.example}</p>
              <p style={{ fontSize: 10, color: COLORS.inkSoft, fontStyle: 'italic', marginBottom: 8 }}>{tone.meaning}</p>
              <Button onClick={() => tts.speak(tone.example)} style={{ padding: '4px 10px', fontSize: 11 }}>{t('chineseTeacherModule.pinyin.listen')}</Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Initials + Finals + Syllables grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card accent="#7c3aed">
          <p style={{ color: '#5b21b6', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>{t('chineseTeacherModule.pinyin.initials')} ({deck.initials.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {deck.initials.map((it) => (
              <button key={it.char} onClick={() => tts.speak(it.char + 'a')} style={{
                background: '#f5f3ff', border: `1px solid #ddd6fe`, borderRadius: 6, padding: '5px 10px',
                fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#5b21b6', cursor: 'pointer',
              }}>{it.char}</button>
            ))}
          </div>
        </Card>
        <Card accent="#059669">
          <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>{t('chineseTeacherModule.pinyin.finals')} ({deck.finals.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {deck.finals.map((it) => (
              <button key={it.char} onClick={() => tts.speak('m' + it.char)} style={{
                background: '#ecfdf5', border: `1px solid #a7f3d0`, borderRadius: 6, padding: '5px 10px',
                fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#065f46', cursor: 'pointer',
              }}>{it.char}</button>
            ))}
          </div>
        </Card>
      </div>

      <Card accent={COLORS.gold}>
        <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>{t('chineseTeacherModule.pinyin.syllables')} ({deck.syllables.length})</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {deck.syllables.map((s, i) => (
            <button key={i} onClick={() => tts.speak(s.syllable)} style={{
              background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 6, padding: '5px 10px',
              fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#92400e', cursor: 'pointer',
            }}>{s.syllable}</button>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Hanzi Dojo
// ═══════════════════════════════════════════════════════════════════════════════
const TabHanzi = () => {
  const { t, i18n } = useTranslation();
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showTrad, setShowTrad] = useState(false);
  const tts = useChineseTTS();

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/hanzi/deck`)
      .then((r) => r.json())
      .then((d) => { setDeck(d.items || []); setLoading(false); });
  }, []);

  const mark = async (status) => {
    const current = deck[selectedIdx];
    if (!current) return;
    try {
      await fetch(`${API_BASE}/api/chinese/hanzi/mark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ char: current.char, status }),
      });
    } catch {}
    setSelectedIdx((i) => Math.min(deck.length - 1, i + 1));
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('chineseTeacherModule.hanzi.loading')}</p>;
  const current = deck[selectedIdx];
  const lang = toLang(i18n.language);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('chineseTeacherModule.tabs.hanzi')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.hanzi.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 22 }}>{t('chineseTeacherModule.hanzi.subtitle')}</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {deck.map((k, i) => (
          <button key={k.char} onClick={() => setSelectedIdx(i)} style={{
            background: i === selectedIdx ? COLORS.accent : COLORS.card,
            color: i === selectedIdx ? '#fff' : COLORS.ink,
            border: `2px solid ${i === selectedIdx ? COLORS.accent : COLORS.border}`,
            borderRadius: 8, width: 44, height: 44, fontSize: 22,
            cursor: 'pointer', fontFamily: CHINESE_FONT, fontWeight: 800,
          }}>{k.char}</button>
        ))}
      </div>

      {current && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
          <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: 28 }}>
            <p style={{ fontSize: 170, lineHeight: 1, color: COLORS.ink, fontFamily: CHINESE_FONT, fontWeight: 800 }}>{showTrad ? current.trad : current.char}</p>
            {current.trad !== current.char && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 11, color: COLORS.inkSoft, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={showTrad} onChange={(e) => setShowTrad(e.target.checked)} style={{ accentColor: COLORS.accent }} />
                  {t('chineseTeacherModule.hanzi.showTrad')} ({current.trad})
                </label>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Chip color={COLORS.gold} light={COLORS.goldLight} border={COLORS.goldBorder}>HSK{current.hsk}</Chip>
              <Chip>{t('chineseTeacherModule.hanzi.strokes')}: {current.strokes}</Chip>
              <Chip color="#7c3aed" light="#f5f3ff" border="#ddd6fe">{t('chineseTeacherModule.hanzi.tone')} {current.tone}</Chip>
            </div>
            <div style={{ marginTop: 14 }}>
              <Button onClick={() => tts.speak(current.char)}>{t('chineseTeacherModule.pinyin.listen')}</Button>
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card accent="#7c3aed">
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{t('chineseTeacherModule.hanzi.pinyin')}</p>
              <p style={{ color: COLORS.accent, fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>{current.pinyin}</p>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase', marginTop: 10 }}>{t('chineseTeacherModule.hanzi.meaning')}</p>
              <p style={{ color: COLORS.ink, fontSize: 16, fontWeight: 600 }}>{current.meaning[lang] || current.meaning.en}</p>
            </Card>
            <Card accent={COLORS.gold}>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('chineseTeacherModule.hanzi.radicals')}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {current.radicals.map((r, i) => (
                  <span key={i} style={{ background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 8, padding: '6px 12px', fontSize: 22, fontFamily: CHINESE_FONT, color: '#92400e', fontWeight: 700 }}>{r}</span>
                ))}
              </div>
            </Card>
            <Card accent="#059669">
              <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('chineseTeacherModule.hanzi.exampleWords')}</p>
              {current.words.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 0', borderBottom: i < current.words.length - 1 ? `1px dashed ${COLORS.border}` : 'none' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, fontFamily: CHINESE_FONT, minWidth: 80 }}>{w.w}</span>
                  <span style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'monospace' }}>{w.p}</span>
                  <span style={{ fontSize: 12, color: COLORS.ink, marginLeft: 'auto' }}>{w.m}</span>
                </div>
              ))}
            </Card>
            <Card accent="#2563eb">
              <p style={{ color: '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('chineseTeacherModule.hanzi.exampleSentence')}</p>
              <p style={{ fontSize: 18, color: COLORS.ink, fontFamily: CHINESE_FONT, marginBottom: 4 }}>{current.sentence.hz}</p>
              <p style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'monospace', marginBottom: 6 }}>{current.sentence.py}</p>
              <p style={{ fontSize: 13, color: COLORS.ink, fontStyle: 'italic' }}>{current.sentence[lang] || current.sentence.en}</p>
              <div style={{ marginTop: 10 }}>
                <Button onClick={() => tts.speak(current.sentence.hz)}>{t('chineseTeacherModule.pinyin.listen')}</Button>
              </div>
            </Card>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => mark('learning')}>{t('chineseTeacherModule.hanzi.markLearning')}</Button>
              <Button onClick={() => mark('review')} style={{ background: COLORS.goldLight, borderColor: COLORS.goldBorder, color: '#78350f' }}>{t('chineseTeacherModule.hanzi.markReview')}</Button>
              <Button primary onClick={() => mark('known')}>{t('chineseTeacherModule.hanzi.markKnown')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Radicals
// ═══════════════════════════════════════════════════════════════════════════════
const TabRadicals = () => {
  const { t } = useTranslation();
  const [radicals, setRadicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const tts = useChineseTTS();

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/radicals`)
      .then((r) => r.json())
      .then((d) => { setRadicals(d.items || []); setLoading(false); });
  }, []);

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('chineseTeacherModule.radicals.loading')}</p>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('chineseTeacherModule.tabs.radicals')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.radicals.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 22 }}>{t('chineseTeacherModule.radicals.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {radicals.map((r) => (
          <Card key={r.radical} accent={COLORS.gold}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <span style={{ fontSize: 46, fontFamily: CHINESE_FONT, color: COLORS.accent, fontWeight: 800, lineHeight: 1 }}>{r.radical}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.ink }}>{r.name}</p>
                <p style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'monospace' }}>{r.pinyin}</p>
              </div>
              <button onClick={() => tts.speak(r.pinyin)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}>🔊</button>
            </div>
            <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('chineseTeacherModule.radicals.examples')}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {r.examples.map((e, i) => (
                <span key={i} style={{ fontSize: 20, fontFamily: CHINESE_FONT, color: COLORS.ink,
                                        background: '#fef8f5', border: `1px solid ${COLORS.border}`,
                                        borderRadius: 6, padding: '4px 8px', fontWeight: 700 }}>{e}</span>
              ))}
            </div>
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
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const tts = useChineseTTS();

  const load = useCallback(() => {
    setLoading(true); setDone(false); setIdx(0); setRevealed(false);
    fetch(`${API_BASE}/api/chinese/srs/due?limit=20`)
      .then((r) => r.json())
      .then((d) => { setQueue(d.items || []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const grade = async (g) => {
    const item = queue[idx];
    if (!item) return;
    try {
      await fetch(`${API_BASE}/api/chinese/srs/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocab_id: item.id, grade: g }),
      });
    } catch {}
    setRevealed(false);
    if (idx >= queue.length - 1) setDone(true);
    else setIdx((i) => i + 1);
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('chineseTeacherModule.vocabulary.loading')}</p>;

  const item = queue[idx];
  const lang = toLang(i18n.language);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('chineseTeacherModule.tabs.vocabulary')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.vocabulary.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('chineseTeacherModule.vocabulary.subtitle')}</p>

      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: COLORS.inkSoft, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('chineseTeacherModule.vocabulary.due')}: <span style={{ color: COLORS.accent, fontFamily: 'monospace', fontWeight: 900 }}>{Math.max(0, queue.length - idx)}</span>
        </span>
        <span style={{ color: COLORS.inkSoft, fontSize: 11, fontFamily: 'monospace' }}>{idx + 1} / {queue.length}</span>
      </div>

      {done || !item ? (
        <Card accent="#059669" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎉</p>
          <p style={{ fontSize: 15, color: COLORS.ink, marginBottom: 18, fontWeight: 700 }}>
            {queue.length === 0 ? t('chineseTeacherModule.vocabulary.noDue') : t('chineseTeacherModule.vocabulary.endOfSession')}
          </p>
          <Button primary onClick={load}>↻</Button>
        </Card>
      ) : (
        <Card accent={COLORS.accent} style={{ textAlign: 'center', padding: '36px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {item.is_new && <Chip color="#2563eb" light="#eff6ff" border="#bfdbfe">{t('chineseTeacherModule.vocabulary.newCard')}</Chip>}
            <Chip>{item.level}</Chip>
            <Chip color={COLORS.gold} light={COLORS.goldLight} border={COLORS.goldBorder}>{t('chineseTeacherModule.vocabulary.stage')} {item.stage ?? 0}</Chip>
          </div>
          <p style={{ fontSize: 56, fontWeight: 900, color: COLORS.ink, fontFamily: CHINESE_FONT, marginBottom: 8, lineHeight: 1.1 }}>{item.word}</p>
          <p style={{ fontSize: 16, color: COLORS.accent, fontFamily: 'monospace', marginBottom: 16 }}>{item.pinyin}</p>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => tts.speak(item.word)}>🔊</Button>
          </div>

          {!revealed ? (
            <Button primary onClick={() => setRevealed(true)}>{t('chineseTeacherModule.vocabulary.showAnswer')}</Button>
          ) : (
            <>
              <p style={{ fontSize: 22, color: COLORS.ink, fontWeight: 700, marginBottom: 6 }}>{item.meaning[lang] || item.meaning.en}</p>
              {item.tags?.length > 0 && (
                <p style={{ fontSize: 10, color: COLORS.inkSoft, letterSpacing: '0.06em', marginBottom: 20 }}>
                  {t('chineseTeacherModule.vocabulary.tags')}: {item.tags.join(' · ')}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <Button onClick={() => grade('again')} style={{ background: COLORS.accentLight, borderColor: COLORS.accentBorder, color: COLORS.accent }}>
                  ✗ {t('chineseTeacherModule.vocabulary.again')}
                </Button>
                <Button onClick={() => grade('good')} primary>{t('chineseTeacherModule.vocabulary.good')}</Button>
                <Button onClick={() => grade('easy')} style={{ background: '#ecfdf5', borderColor: '#bbf7d0', color: '#059669' }}>
                  ✓✓ {t('chineseTeacherModule.vocabulary.easy')}
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
// Tab: Grammar
// ═══════════════════════════════════════════════════════════════════════════════
const TabGrammar = () => {
  const { t, i18n } = useTranslation();
  const [points, setPoints] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizIdx, setQuizIdx] = useState(0);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/grammar/path?hsk=HSK1`)
      .then((r) => r.json())
      .then((d) => { setPoints(d.items || []); setLoading(false); });
  }, []);

  const lang = toLang(i18n.language);
  const cur = points[idx];
  const quiz = cur?.quiz?.[quizIdx];

  const goNext = () => { setPicked(null); setQuizIdx(0); setIdx((i) => (i + 1) % points.length); };
  const nextQuiz = () => { setPicked(null); setQuizIdx((q) => Math.min(q + 1, (cur.quiz?.length || 1) - 1)); };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('chineseTeacherModule.grammar.loading')}</p>;
  if (!cur) return null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 880, margin: '0 auto' }}>
      <SectionLabel index={6} label={t('chineseTeacherModule.tabs.grammar')} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: 0 }}>{t('chineseTeacherModule.grammar.title')}</h2>
        <span style={{ color: COLORS.inkSoft, fontSize: 11, fontFamily: 'monospace' }}>{t('chineseTeacherModule.grammar.of', { n: idx + 1, total: points.length })}</span>
      </div>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 22 }}>{t('chineseTeacherModule.grammar.subtitle')}</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {points.map((p, i) => (
          <button key={p.id} onClick={() => { setIdx(i); setQuizIdx(0); setPicked(null); }} style={{
            background: i === idx ? COLORS.accent : COLORS.card,
            color: i === idx ? '#fff' : COLORS.ink,
            border: `1px solid ${i === idx ? COLORS.accent : COLORS.border}`,
            borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>{p.id.toUpperCase()}</button>
        ))}
      </div>

      <Card accent={COLORS.accent} style={{ marginBottom: 14 }}>
        <h3 style={{ color: COLORS.ink, fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 10, fontFamily: CHINESE_FONT }}>{cur.title}</h3>
        <div style={{ background: '#fef8f5', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: COLORS.ink, marginBottom: 10 }}>
          {cur.pattern}
        </div>
        <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>{t('chineseTeacherModule.grammar.explanation')}</p>
        <p style={{ color: COLORS.ink, fontSize: 13, lineHeight: 1.6 }}>{cur.explanation[lang] || cur.explanation.en}</p>
      </Card>

      <Card accent="#2563eb" style={{ marginBottom: 14 }}>
        <p style={{ color: '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('chineseTeacherModule.grammar.examples')}</p>
        {cur.examples.map((ex, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < cur.examples.length - 1 ? `1px dashed ${COLORS.border}` : 'none' }}>
            <p style={{ fontSize: 16, color: COLORS.ink, fontFamily: CHINESE_FONT, fontWeight: 700 }}>{ex.hz}</p>
            <p style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'monospace', marginTop: 2 }}>{ex.py}</p>
            <p style={{ fontSize: 12, color: COLORS.ink, marginTop: 4, fontStyle: 'italic' }}>{ex[lang] || ex.en}</p>
          </div>
        ))}
      </Card>

      <Card accent={COLORS.gold} style={{ marginBottom: 14 }}>
        <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>⚠ {t('chineseTeacherModule.grammar.commonMistake')}</p>
        <p style={{ color: COLORS.ink, fontSize: 12, lineHeight: 1.55 }}>{cur.commonMistake[lang] || cur.commonMistake.en}</p>
      </Card>

      {quiz && (
        <Card accent="#059669">
          <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>📝 {t('chineseTeacherModule.grammar.miniQuiz')}</p>
          <p style={{ fontSize: 20, color: COLORS.ink, fontFamily: CHINESE_FONT, textAlign: 'center', marginBottom: 14 }}>{quiz.prompt}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {quiz.options.map((opt) => {
              const isPicked = picked === opt;
              const isCorrect = opt === quiz.answer;
              const showState = picked && (isPicked || isCorrect);
              const c = showState ? (isCorrect ? '#059669' : COLORS.accent) : COLORS.border;
              const bg = showState ? (isCorrect ? '#ecfdf5' : COLORS.accentLight) : COLORS.card;
              return (
                <button key={opt} onClick={() => picked || setPicked(opt)} disabled={!!picked} style={{
                  background: bg, color: COLORS.ink, border: `2px solid ${c}`,
                  borderRadius: 8, padding: '12px 6px', fontSize: 18, fontWeight: 800,
                  cursor: picked ? 'default' : 'pointer', fontFamily: CHINESE_FONT,
                }}>{opt}</button>
              );
            })}
          </div>
          {picked && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <p style={{ fontWeight: 700, color: picked === quiz.answer ? '#059669' : COLORS.accent, marginBottom: 10 }}>
                {picked === quiz.answer ? t('chineseTeacherModule.grammar.correct') : `${t('chineseTeacherModule.grammar.wrong')} "${quiz.answer}"`}
              </p>
              {quizIdx < (cur.quiz.length - 1)
                ? <Button primary onClick={nextQuiz}>→</Button>
                : <Button primary onClick={goNext}>{t('chineseTeacherModule.grammar.next')} →</Button>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Conversation
// ═══════════════════════════════════════════════════════════════════════════════
const TabConversation = () => {
  const { t, i18n } = useTranslation();
  const [scenarios, setScenarios] = useState([]);
  const [scenario, setScenario] = useState('intro');
  const [difficulty, setDifficulty] = useState('beginner');
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [userText, setUserText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const tts = useChineseTTS();

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/conversation/scenarios?lang=${toLang(i18n.language)}`)
      .then((r) => r.json())
      .then((d) => setScenarios(d.scenarios || []));
  }, [i18n.language]);

  const sendTurn = async (text) => {
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/chinese/conversation/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario, difficulty,
          history: history.map((h) => ({ role: h.role, content: h.role === 'assistant' ? h.payload.hz : h.content })),
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
    } catch {
      setHistory((h) => [...h, { role: 'system', content: t('chineseTeacherModule.common.error') }]);
    } finally { setSending(false); }
  };

  const startConversation = async () => {
    setStarted(true); setHistory([]); await sendTurn(null);
  };

  const send = async () => {
    if (!userText.trim() || sending) return;
    const text = userText.trim(); setUserText(''); await sendTurn(text);
  };

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }); }, [history]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 880, margin: '0 auto' }}>
      <SectionLabel index={7} label={t('chineseTeacherModule.tabs.conversation')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.conversation.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>{t('chineseTeacherModule.conversation.subtitle')}</p>

      {!started ? (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('chineseTeacherModule.conversation.scenario')}</p>
              <select value={scenario} onChange={(e) => setScenario(e.target.value)}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`,
                               borderRadius: 8, padding: '9px 12px', fontSize: 13, color: COLORS.ink }}>
                {scenarios.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <p style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('chineseTeacherModule.conversation.difficulty')}</p>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                      style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`,
                               borderRadius: 8, padding: '9px 12px', fontSize: 13, color: COLORS.ink }}>
                <option value="beginner">{t('chineseTeacherModule.conversation.beginner')}</option>
                <option value="intermediate">{t('chineseTeacherModule.conversation.intermediate')}</option>
                <option value="advanced">{t('chineseTeacherModule.conversation.advanced')}</option>
              </select>
            </div>
          </div>
          <Button primary onClick={startConversation}>💬 {t('chineseTeacherModule.conversation.startBtn')}</Button>
        </div>
      ) : (
        <>
          <button onClick={() => { setStarted(false); setHistory([]); }} style={{
            background: 'transparent', border: 'none', color: COLORS.accent, fontSize: 12,
            cursor: 'pointer', marginBottom: 12, fontWeight: 600,
          }}>{t('chineseTeacherModule.conversation.newConversation')}</button>

          <div ref={scrollRef} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14,
            padding: '18px 22px', maxHeight: 480, overflowY: 'auto', marginBottom: 14,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {history.map((turn, i) => {
              if (turn.role === 'user') return (
                <div key={i} style={{ alignSelf: 'flex-end', background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`,
                                       borderRadius: 12, padding: '10px 14px', maxWidth: '75%', fontSize: 14, color: COLORS.ink,
                                       fontFamily: CHINESE_FONT }}>{turn.content}</div>
              );
              if (turn.role === 'system') return (
                <div key={i} style={{ alignSelf: 'center', color: COLORS.inkSoft, fontSize: 12 }}>{turn.content}</div>
              );
              const p = turn.payload;
              return (
                <div key={i} style={{ alignSelf: 'flex-start', background: '#fef8f5', border: `1px solid ${COLORS.border}`,
                                       borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 12, padding: '12px 14px', maxWidth: '85%' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <p style={{ fontSize: 18, color: COLORS.ink, fontFamily: CHINESE_FONT, fontWeight: 700, marginBottom: 4 }}>{p.hz}</p>
                    <button onClick={() => tts.speak(p.hz)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>🔊</button>
                  </div>
                  {p.py && <p style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'monospace', marginBottom: 4 }}><strong style={{ fontSize: 9, letterSpacing: '0.1em' }}>{t('chineseTeacherModule.conversation.pinyinLabel')}:</strong> {p.py}</p>}
                  {p.translation && <p style={{ fontSize: 12, color: COLORS.ink, marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${COLORS.border}` }}>{p.translation}</p>}
                  {p.hint && <p style={{ fontSize: 11, color: COLORS.gold, marginTop: 6, fontStyle: 'italic' }}>💡 {p.hint}</p>}
                  {p.correction && <p style={{ fontSize: 11, color: '#2563eb', marginTop: 6, fontStyle: 'italic' }}>✎ {p.correction}</p>}
                  {p.is_mock && <p style={{ fontSize: 9, color: COLORS.gold, marginTop: 8, letterSpacing: '0.08em' }}>{t('chineseTeacherModule.conversation.noLLM')}</p>}
                </div>
              );
            })}
            {sending && <div style={{ alignSelf: 'flex-start', color: COLORS.inkSoft, fontSize: 12 }}>{t('chineseTeacherModule.conversation.sending')}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={userText} onChange={(e) => setUserText(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                   placeholder={t('chineseTeacherModule.conversation.yourReply')}
                   style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                            padding: '11px 14px', fontSize: 14, color: COLORS.ink, outline: 'none' }} />
            <Button primary disabled={sending || !userText.trim()} onClick={send}>
              {sending ? t('chineseTeacherModule.conversation.sending') : t('chineseTeacherModule.conversation.send')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Tab: Kanji-Hanzi Bridge — THE DIFFERENTIATOR
// ═══════════════════════════════════════════════════════════════════════════════
const TabBridge = () => {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const tts = useChineseTTS();

  useEffect(() => {
    fetch(`${API_BASE}/api/chinese/bridge`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.items || []); setLoading(false); });
  }, []);

  const lang = toLang(i18n.language);
  if (loading) return <p style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>{t('chineseTeacherModule.bridge.loading')}</p>;

  const visible = entries.filter((e) => filter === 'all' || e.source === filter);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={8} label={t('chineseTeacherModule.tabs.bridge')} />
      <h2 style={{ color: COLORS.ink, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('chineseTeacherModule.bridge.title')}</h2>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 18 }}>{t('chineseTeacherModule.bridge.subtitle')}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {['all', 'curated', 'auto'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? COLORS.accent : COLORS.card,
            color: filter === f ? '#fff' : COLORS.ink,
            border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`,
            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{t(`chineseTeacherModule.bridge.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: COLORS.inkSoft, fontSize: 11, alignSelf: 'center' }}>{visible.length} / {entries.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {visible.map((e) => (
          <div key={e.hanzi} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14,
            padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <Chip color={e.relation === 'identical' ? '#059669' : COLORS.gold}
                    light={e.relation === 'identical' ? '#ecfdf5' : COLORS.goldLight}
                    border={e.relation === 'identical' ? '#a7f3d0' : COLORS.goldBorder}>
                {t(`chineseTeacherModule.bridge.relations.${e.relation}`, { defaultValue: e.relation })}
              </Chip>
              <Chip color={e.source === 'curated' ? '#7c3aed' : '#0891b2'}
                    light={e.source === 'curated' ? '#f5f3ff' : '#ecfeff'}
                    border={e.source === 'curated' ? '#ddd6fe' : '#a5f3fc'}>
                {t(`chineseTeacherModule.bridge.${e.source}`, { defaultValue: e.source })}
              </Chip>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
              {/* Chinese simplified */}
              <div style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accentBorder}`,
                             borderTop: `3px solid ${COLORS.accent}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ color: COLORS.accent, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('chineseTeacherModule.bridge.chinese')}</p>
                <p style={{ fontSize: 60, color: COLORS.ink, fontFamily: CHINESE_FONT, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{e.hanzi}</p>
                <p style={{ color: COLORS.accent, fontSize: 14, fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>{e.zh_pinyin}</p>
                <p style={{ color: COLORS.ink, fontSize: 12 }}>{e.zh_meaning}</p>
                <button onClick={() => tts.speak(e.hanzi)} style={{ marginTop: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>🔊</button>
              </div>
              {/* Traditional */}
              <div style={{ background: COLORS.goldLight, border: `1px solid ${COLORS.goldBorder}`,
                             borderTop: `3px solid ${COLORS.gold}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ color: COLORS.gold, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('chineseTeacherModule.bridge.traditional')}</p>
                <p style={{ fontSize: 60, color: COLORS.ink, fontFamily: CHINESE_FONT, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{e.trad}</p>
                {e.trad === e.hanzi && (
                  <p style={{ color: COLORS.inkSoft, fontSize: 10, fontStyle: 'italic' }}>same as simplified</p>
                )}
              </div>
              {/* Japanese */}
              <div style={{ background: COLORS.jadeLight, border: `1px solid ${COLORS.jadeBorder}`,
                             borderTop: `3px solid ${COLORS.jade}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ color: COLORS.jade, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('chineseTeacherModule.bridge.japanese')}</p>
                <p style={{ fontSize: 60, color: COLORS.ink, fontFamily: CHINESE_FONT, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{e.ja}</p>
                {e.ja_on?.length > 0 && (
                  <p style={{ color: COLORS.jade, fontSize: 11, fontFamily: CHINESE_FONT, marginBottom: 2 }}><strong style={{ fontSize: 9 }}>{t('chineseTeacherModule.bridge.onyomi')}</strong> {e.ja_on.join(' · ')}</p>
                )}
                {e.ja_kun?.length > 0 && (
                  <p style={{ color: COLORS.jade, fontSize: 11, fontFamily: CHINESE_FONT, marginBottom: 4 }}><strong style={{ fontSize: 9 }}>{t('chineseTeacherModule.bridge.kunyomi')}</strong> {e.ja_kun.join(' · ')}</p>
                )}
                <p style={{ color: COLORS.ink, fontSize: 12 }}>{e.ja_meaning}</p>
              </div>
            </div>

            {e.note && (
              <div style={{ background: '#fefaf0', border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.gold}`, borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ color: COLORS.gold, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>💡 {t('chineseTeacherModule.bridge.note')}</p>
                <p style={{ color: COLORS.ink, fontSize: 12, lineHeight: 1.55, fontStyle: 'italic' }}>{e.note[lang] || e.note.en}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════════════════════
const ChineseTeacher = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard',    label: t('chineseTeacherModule.tabs.dashboard'),    icon: '📋' },
    { id: 'pinyin',       label: t('chineseTeacherModule.tabs.pinyin'),       icon: '拼' },
    { id: 'hanzi',        label: t('chineseTeacherModule.tabs.hanzi'),        icon: '汉' },
    { id: 'radicals',     label: t('chineseTeacherModule.tabs.radicals'),     icon: '⼚' },
    { id: 'vocabulary',   label: t('chineseTeacherModule.tabs.vocabulary'),   icon: '📚' },
    { id: 'grammar',      label: t('chineseTeacherModule.tabs.grammar'),      icon: '📐' },
    { id: 'conversation', label: t('chineseTeacherModule.tabs.conversation'), icon: '💬' },
    { id: 'bridge',       label: t('chineseTeacherModule.tabs.bridge'),       icon: '🌉' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <TabDashboard onJump={(id) => setActiveTab(id)} />;
      case 'pinyin':       return <TabPinyin />;
      case 'hanzi':        return <TabHanzi />;
      case 'radicals':     return <TabRadicals />;
      case 'vocabulary':   return <TabVocabulary />;
      case 'grammar':      return <TabGrammar />;
      case 'conversation': return <TabConversation />;
      case 'bridge':       return <TabBridge />;
      default:             return <TabDashboard onJump={(id) => setActiveTab(id)} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.bg, fontFamily: 'inherit' }}>
      {/* Hero */}
      <div style={{ background: COLORS.card, borderBottom: `2px solid ${COLORS.border}`, padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: COLORS.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('chineseTeacherModule.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('chineseTeacherModule.futureAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: COLORS.inkSoft, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16,
                         background: `linear-gradient(135deg,${COLORS.accent},#8b0a14)`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0,
                         boxShadow: '0 4px 14px rgba(200,29,46,0.25)', color: '#fff' }}>🐉</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink, margin: 0, lineHeight: 1.15 }}>{t('chineseTeacherModule.title')}</h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 12, margin: '4px 0 0', fontFamily: CHINESE_FONT }}>{t('chineseTeacherModule.subtitle')}</p>
            <p style={{ color: COLORS.inkSoft, fontSize: 13, margin: '4px 0 0' }}>{t('chineseTeacherModule.tagline')}</p>
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
              <span style={{ fontSize: 15, fontFamily: tab.icon.length === 1 && tab.icon.charCodeAt(0) > 12000 ? CHINESE_FONT : 'inherit' }}>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>{renderContent()}</div>
    </div>
  );
};

export default ChineseTeacher;
