import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Deals = () => {
  const { t, i18n } = useTranslation();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setDeals([
          {
            nameKey: 'acmeRenewal',
            amount: 120000,
            stageKey: 'proposal',
            riskKey: 'high',
            nextKey: 'execReview',
          },
          {
            nameKey: 'betaExpansion',
            amount: 45000,
            stageKey: 'qualification',
            riskKey: 'medium',
            nextKey: 'pricing',
          },
          {
            nameKey: 'gammaPoc',
            amount: 15000,
            stageKey: 'poc',
            riskKey: 'low',
            nextKey: 'successCriteria',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  };

  const loc = i18n.language === 'no' ? 'nb-NO' : 'en-US';

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>💼</span>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{t('salesAssistantModule.dealsTitle')}</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>{t('salesAssistantModule.dealsLoading')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thDeal')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thAmount')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thStage')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thRisk')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thNextStep')}</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{t(`salesAssistantModule.dealName.${d.nameKey}`)}</td>
                    <td style={{ padding: '12px' }}>
                      {new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.amount)}
                    </td>
                    <td style={{ padding: '12px' }}>{t(`salesAssistantModule.stage.${d.stageKey}`)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 8,
                        background: d.riskKey === 'high' ? '#fee2e2' : d.riskKey === 'medium' ? '#fef3c7' : '#dcfce7',
                        color: d.riskKey === 'high' ? '#991b1b' : d.riskKey === 'medium' ? '#92400e' : '#166534',
                      }}>{t(`salesAssistantModule.riskLevel.${d.riskKey}`)}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{t(`salesAssistantModule.dealNext.${d.nextKey}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deals;
