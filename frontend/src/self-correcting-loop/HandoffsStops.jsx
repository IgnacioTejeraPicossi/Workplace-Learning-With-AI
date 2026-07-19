import React from 'react';
import { useTranslation } from 'react-i18next';
import { STOP_BLOCK } from './_templates';

const HANDOFF_TEMPLATE = `BUILDER OUTPUT
Deliverable: [the actual output]
Confidence: [high / medium / low]
Known uncertainties: [...]
Assumptions made: [...]

JUDGE VERDICT
Verdict: [PASS / FAIL / NEEDS REVISION]
Checked against: [the standard — brief, test suite, source doc]
Specific issues found: [exact problems, not a general impression]

MANAGER ACTION
If PASS: mark complete, deliver.
If FAIL / NEEDS REVISION: return to Builder with the Judge's issues attached,
increment the revision counter.
If revision counter > N: stop, escalate to a human with full history.`;

const codeBox = {
  backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 10,
  padding: '14px 16px', fontFamily: 'monospace', fontSize: 12.5,
  lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowX: 'auto',
};

const card = { backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' };

export default function HandoffsStops() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 940 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          {t('selfCorrectingLoop.handoffs.title')}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15, lineHeight: 1.6 }}>
          {t('selfCorrectingLoop.handoffs.lead')}
        </p>
      </div>

      {/* Three properties */}
      <div style={card}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          {t('selfCorrectingLoop.handoffs.propsTitle')}
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: 13.5, lineHeight: 1.8 }}>
          <li>{t('selfCorrectingLoop.handoffs.prop1')}</li>
          <li>{t('selfCorrectingLoop.handoffs.prop2')}</li>
          <li>{t('selfCorrectingLoop.handoffs.prop3')}</li>
        </ul>
      </div>

      {/* Template */}
      <div style={card}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          {t('selfCorrectingLoop.handoffs.templateTitle')}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 10, lineHeight: 1.55 }}>
          {t('selfCorrectingLoop.handoffs.templateNote')}
        </div>
        <div style={codeBox}>{HANDOFF_TEMPLATE}</div>
      </div>

      {/* Ground truth */}
      <div style={{ ...card, borderLeft: '4px solid #7c3aed' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          🔬 {t('selfCorrectingLoop.handoffs.groundTruthTitle')}
        </div>
        <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, marginBottom: 12 }}>
          {t('selfCorrectingLoop.handoffs.groundTruthLead')}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {['gtCode', 'gtContent', 'gtResearch'].map(k => (
            <div key={k} style={{ padding: '10px 12px', backgroundColor: '#faf5ff', borderRadius: 8, fontSize: 13, color: '#4b5563', lineHeight: 1.55 }}>
              {t(`selfCorrectingLoop.handoffs.${k}`)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
          ⚠️ {t('selfCorrectingLoop.handoffs.gtWarn')}
        </div>
      </div>

      {/* Stop conditions */}
      <div style={{ ...card, borderLeft: '4px solid #dc2626' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          🛑 {t('selfCorrectingLoop.handoffs.stopTitle')}
        </div>
        <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65, marginBottom: 12 }}>
          {t('selfCorrectingLoop.handoffs.stopLead')}
        </div>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: '#475569', fontSize: 13.5, lineHeight: 1.8 }}>
          <li>{t('selfCorrectingLoop.handoffs.stop1')}</li>
          <li>{t('selfCorrectingLoop.handoffs.stop2')}</li>
          <li>{t('selfCorrectingLoop.handoffs.stop3')}</li>
        </ul>
        <div style={codeBox}>{STOP_BLOCK}</div>
        <div style={{ marginTop: 10, fontSize: 12.5, color: '#b91c1c', fontWeight: 600, lineHeight: 1.55 }}>
          {t('selfCorrectingLoop.handoffs.stopWarn')}
        </div>
      </div>
    </div>
  );
}
