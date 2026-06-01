import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

const QUESTIONS = [
  { id: 'q1', icon: '🤖' },
  { id: 'q2', icon: '⏱️' },
  { id: 'q3', icon: '🤝' },
  { id: 'q4', icon: '🎯' },
  { id: 'q5', icon: '🔁' },
];

export default function AiAsObserver() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>🧠 {t('selfSimReality.tabs.aiAsObserver')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.aiAsObserver.intro')}</p>
      </div>

      <div style={panel}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
          ❓ {t('selfSimReality.aiAsObserver.questionsTitle')}
        </h4>
        <div style={{ display: 'grid', gap: 12 }}>
          {QUESTIONS.map(q => {
            const level = t(`selfSimReality.aiAsObserver.questions.${q.id}Level`);
            return (
              <div key={q.id} style={{
                padding: '14px 16px', borderRadius: 10,
                backgroundColor: '#fafafa', border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{q.icon}</span>
                  <strong style={{ fontSize: 14, color: '#1e293b', flex: 1 }}>
                    {t(`selfSimReality.aiAsObserver.questions.${q.id}Title`)}
                  </strong>
                  <EpistemicBadge level={level} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  {t(`selfSimReality.aiAsObserver.questions.${q.id}Body`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Epistemic warning */}
      <div style={{ ...panel, borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>
          ⚠️ {t('selfSimReality.aiAsObserver.warningTitle')}
        </h4>
        <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
          {t('selfSimReality.aiAsObserver.warningBody')}
        </p>
      </div>
    </div>
  );
}
