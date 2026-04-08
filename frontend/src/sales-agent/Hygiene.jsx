import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Hygiene = () => {
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setIssues([
          {
            account: 'ACME Corp',
            missingKeys: ['closeDate', 'nextActivity', 'amount'],
            score: 85,
            owner: 'sales@company.com',
            stageKey: 'qualification',
          },
          {
            account: 'Beta Corp',
            missingKeys: ['nextActivity'],
            score: 25,
            owner: 'sales@company.com',
            stageKey: 'proposal',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const riskTierLabel = (score) => {
    if (score > 70) return t('salesAssistantModule.riskHigh');
    if (score > 40) return t('salesAssistantModule.riskMedium');
    return t('salesAssistantModule.riskLow');
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🧹</span>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{t('salesAssistantModule.hygieneTitle')}</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>{t('salesAssistantModule.hygieneLoading')}</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {issues.map((it, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: '#fff7ed', border: '1px solid #ffedd5' }}>
                <div style={{ fontWeight: 700, color: '#9a3412' }}>{it.account}</div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 6 }}>
                  {t('salesAssistantModule.hygieneMissing')}:{' '}
                  {it.missingKeys.map((k) => t(`salesAssistantModule.missingField.${k}`)).join(', ')}
                </div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 4 }}>
                  {t('salesAssistantModule.hygieneScore')}: {it.score}% ({riskTierLabel(it.score)})
                </div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 4 }}>
                  {t('salesAssistantModule.hygieneOwner')}: {it.owner}
                </div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 4 }}>
                  {t('salesAssistantModule.hygieneStage')}: {t(`salesAssistantModule.stage.${it.stageKey}`)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hygiene;
