import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TEMPLATES, STOP_BLOCK, TASK_TYPES } from './_templates';

/**
 * Interactive: pick a task type -> generated Builder / Judge / Manager scaffolds
 * + a shared hard stop condition, each copyable. Fully client-side (no backend),
 * so it works offline. Templates are English technical artifacts; UI is i18n'd.
 */
function CopyBlock({ label, text, t }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — select-all fallback note
      setCopied(false);
    }
  };
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
      }}>
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{label}</span>
        <button
          onClick={copy}
          style={{
            padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
            border: '1px solid #0d9488',
            backgroundColor: copied ? '#0d9488' : 'white',
            color: copied ? 'white' : '#0d9488',
            fontSize: 12, fontWeight: 600,
          }}
        >
          {copied ? t('selfCorrectingLoop.builder.copied') : `📋 ${t('selfCorrectingLoop.builder.copy')}`}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: '14px 16px', backgroundColor: '#0f172a', color: '#e2e8f0',
        fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.55,
        whiteSpace: 'pre-wrap', overflowX: 'auto',
      }}>{text}</pre>
    </div>
  );
}

export default function LoopBuilder() {
  const { t } = useTranslation();
  const [taskType, setTaskType] = useState('writing');
  const tpl = TEMPLATES[taskType];

  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 940 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          ⚙️ {t('selfCorrectingLoop.builder.title')}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15, lineHeight: 1.6 }}>
          {t('selfCorrectingLoop.builder.lead')}
        </p>
      </div>

      {/* Task type selector */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          {t('selfCorrectingLoop.builder.taskTypeLabel')}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TASK_TYPES.map(tt => (
            <button
              key={tt}
              onClick={() => setTaskType(tt)}
              style={{
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${taskType === tt ? '#0d9488' : '#cbd5e1'}`,
                backgroundColor: taskType === tt ? '#0d9488' : 'white',
                color: taskType === tt ? 'white' : '#475569',
                fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s ease',
              }}
            >
              {t(`selfCorrectingLoop.builder.types.${tt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Generated scaffolds */}
      <div style={{ display: 'grid', gap: 12 }}>
        <CopyBlock label={`🔨 ${t('selfCorrectingLoop.builder.builderLabel')}`} text={tpl.builder} t={t} />
        <CopyBlock label={`⚖️ ${t('selfCorrectingLoop.builder.judgeLabel')}`} text={tpl.judge} t={t} />
        <CopyBlock label={`🧭 ${t('selfCorrectingLoop.builder.managerLabel')}`} text={tpl.manager} t={t} />
        <CopyBlock label={`🛑 ${t('selfCorrectingLoop.builder.stopLabel')}`} text={STOP_BLOCK} t={t} />
      </div>

      <div style={{
        padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 8, fontSize: 12.5, color: '#92400e', lineHeight: 1.6,
      }}>
        {t('selfCorrectingLoop.builder.disclaimer')}
      </div>

      {/* Where to start */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          🚀 {t('selfCorrectingLoop.builder.checklistTitle')}
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: 13.5, lineHeight: 1.9 }}>
          {['c1', 'c2', 'c3', 'c4', 'c5'].map(k => (
            <li key={k}>{t(`selfCorrectingLoop.builder.${k}`)}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
