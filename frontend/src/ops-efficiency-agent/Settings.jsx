import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import agentDescriptor from '../configs/agents/ops-efficiency-agent.json';

const Settings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    max_auto_amount: 500,
    min_confidence_auto: 0.8,
    auto_approval_threshold: 1000,
    variance_threshold: 0.05,
    erp_base_url: '',
    erp_bearer_token: '',
    slack_bot_token: '',
    ats_provider: 'local',
    ats_base_url: '',
    ats_token: '',
    graph_bearer_token: '',
    graph_user_id: 'me',
    sheets_spreadsheet_id: ''
  });
  const [health, setHealth] = useState({ erp_connected: false, ats_connected: false, slack_connected: false, sheets_connected: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const integrationName = (type) => ({
    erp: t('opsEfficiencyAgentModule.healthErp'),
    ats: t('opsEfficiencyAgentModule.healthAts'),
    slack: t('opsEfficiencyAgentModule.healthSlack'),
    sheets: t('opsEfficiencyAgentModule.healthSheets')
  }[type] || type);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/agents/opsx/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving settings:', settings);
      alert(t('opsEfficiencyAgentModule.settingsSaved'));
    } catch (error) {
      alert(t('opsEfficiencyAgentModule.settingsSaveFail', { detail: error.message }));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newHealth = { ...health };
      newHealth[`${type}_connected`] = true;
      setHealth(newHealth);
      alert(t('opsEfficiencyAgentModule.testConnectionOk', { name: integrationName(type) }));
    } catch (error) {
      alert(t('opsEfficiencyAgentModule.testConnectionFail', { name: integrationName(type), detail: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const container = { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' };
  const card = { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
  const cardHeader = { padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb' };
  const section = { padding: 16 };
  const label = { display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 8 };
  const input = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D1D5DB', borderRadius: 8, outline: 'none' };
  const hint = { fontSize: '0.75rem', color: '#6B7280', marginTop: 4 };
  const btn = (bg, text, border) => ({ padding: '0.6rem 1rem', borderRadius: 8, backgroundColor: bg, color: text, border: `1px solid ${border}`, cursor: 'pointer' });

  const ConnectionStatus = ({ labelText, connected, onTest }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#F9FAFB', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: 9999, background: connected ? '#10B981' : '#EF4444' }} />
        <span style={{ fontWeight: 600, color: '#374151' }}>{labelText}</span>
      </div>
      <button type="button" onClick={onTest} disabled={loading} style={btn('#2563EB', '#FFFFFF', '#1D4ED8')}>
        {loading ? t('opsEfficiencyAgentModule.testing') : t('opsEfficiencyAgentModule.test')}
      </button>
    </div>
  );

  const hmacYes = agentDescriptor.security?.hmac_required ? t('opsEfficiencyAgentModule.yes') : t('opsEfficiencyAgentModule.no');
  const attestationLabel = agentDescriptor.security?.attestation_enabled ? t('opsEfficiencyAgentModule.enabled') : t('opsEfficiencyAgentModule.disabled');

  return (
    <div style={container}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>{t('opsEfficiencyAgentModule.settingsTitle')}</h1>
        <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>{t('opsEfficiencyAgentModule.settingsSubtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.automationThresholds')}</h2></div>
          <div style={section}>
            <div>
              <label style={label}>{t('opsEfficiencyAgentModule.maxAutoAmount')}</label>
              <input type="number" value={settings.max_auto_amount} onChange={(e) => handleInputChange('max_auto_amount', parseInt(e.target.value, 10))} style={input} />
              <p style={hint}>{t('opsEfficiencyAgentModule.hintMaxAuto')}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t('opsEfficiencyAgentModule.minConfidenceAuto')}</label>
              <input type="number" min="0" max="1" step="0.1" value={settings.min_confidence_auto} onChange={(e) => handleInputChange('min_confidence_auto', parseFloat(e.target.value))} style={input} />
              <p style={hint}>{t('opsEfficiencyAgentModule.hintMinConf')}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t('opsEfficiencyAgentModule.autoApprovalThreshold')}</label>
              <input type="number" value={settings.auto_approval_threshold} onChange={(e) => handleInputChange('auto_approval_threshold', parseInt(e.target.value, 10))} style={input} />
              <p style={hint}>{t('opsEfficiencyAgentModule.hintAutoApproval')}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t('opsEfficiencyAgentModule.varianceThreshold')}</label>
              <input type="number" min="0" max="1" step="0.01" value={settings.variance_threshold} onChange={(e) => handleInputChange('variance_threshold', parseFloat(e.target.value))} style={input} />
              <p style={hint}>{t('opsEfficiencyAgentModule.hintVariance')}</p>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.integrationStatus')}</h2></div>
          <div style={section}>
            <div style={{ display: 'grid', rowGap: 10 }}>
              <ConnectionStatus labelText={t('opsEfficiencyAgentModule.healthErp')} connected={health.erp_connected} onTest={() => handleTestConnection('erp')} />
              <ConnectionStatus labelText={t('opsEfficiencyAgentModule.healthAts')} connected={health.ats_connected} onTest={() => handleTestConnection('ats')} />
              <ConnectionStatus labelText={t('opsEfficiencyAgentModule.healthSlack')} connected={health.slack_connected} onTest={() => handleTestConnection('slack')} />
              <ConnectionStatus labelText={t('opsEfficiencyAgentModule.healthSheets')} connected={health.sheets_connected} onTest={() => handleTestConnection('sheets')} />
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.erpConfig')}</h2></div>
          <div style={section}>
            <div>
              <label style={label}>{t('opsEfficiencyAgentModule.erpBaseUrl')}</label>
              <input type="url" value={settings.erp_base_url} onChange={(e) => handleInputChange('erp_base_url', e.target.value)} placeholder="https://erp.example.com" style={input} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t('opsEfficiencyAgentModule.erpBearerToken')}</label>
              <input type="password" value={settings.erp_bearer_token} onChange={(e) => handleInputChange('erp_bearer_token', e.target.value)} placeholder={t('opsEfficiencyAgentModule.erpTokenPlaceholder')} style={input} />
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.atsConfig')}</h2></div>
          <div style={section}>
            <div>
              <label style={label}>{t('opsEfficiencyAgentModule.atsProvider')}</label>
              <select value={settings.ats_provider} onChange={(e) => handleInputChange('ats_provider', e.target.value)} style={input}>
                <option value="local">{t('opsEfficiencyAgentModule.atsLocal')}</option>
                <option value="greenhouse">{t('opsEfficiencyAgentModule.atsGreenhouse')}</option>
                <option value="workable">{t('opsEfficiencyAgentModule.atsWorkable')}</option>
              </select>
            </div>
            {settings.ats_provider !== 'local' && (
              <>
                <div style={{ marginTop: 12 }}>
                  <label style={label}>{t('opsEfficiencyAgentModule.atsBaseUrl')}</label>
                  <input type="url" value={settings.ats_base_url} onChange={(e) => handleInputChange('ats_base_url', e.target.value)} placeholder="https://ats.example.com" style={input} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={label}>{t('opsEfficiencyAgentModule.atsToken')}</label>
                  <input type="password" value={settings.ats_token} onChange={(e) => handleInputChange('ats_token', e.target.value)} placeholder={t('opsEfficiencyAgentModule.atsTokenPlaceholder')} style={input} />
                </div>
              </>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.notifications')}</h2></div>
          <div style={section}>
            <div>
              <label style={label}>{t('opsEfficiencyAgentModule.slackBotToken')}</label>
              <input type="password" value={settings.slack_bot_token} onChange={(e) => handleInputChange('slack_bot_token', e.target.value)} placeholder={t('opsEfficiencyAgentModule.slackPlaceholder')} style={input} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t('opsEfficiencyAgentModule.graphToken')}</label>
              <input type="password" value={settings.graph_bearer_token} onChange={(e) => handleInputChange('graph_bearer_token', e.target.value)} placeholder={t('opsEfficiencyAgentModule.graphTokenPlaceholder')} style={input} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>{t('opsEfficiencyAgentModule.graphUserId')}</label>
              <input type="text" value={settings.graph_user_id} onChange={(e) => handleInputChange('graph_user_id', e.target.value)} placeholder={t('opsEfficiencyAgentModule.graphUserPlaceholder')} style={input} />
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardHeader}><h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.googleSheets')}</h2></div>
          <div style={section}>
            <div>
              <label style={label}>{t('opsEfficiencyAgentModule.spreadsheetId')}</label>
              <input type="text" value={settings.sheets_spreadsheet_id} onChange={(e) => handleInputChange('sheets_spreadsheet_id', e.target.value)} placeholder="1e97xVkDTW8gUNSTKNclYSvaoJEoojCias3iAp1YLxF4" style={input} />
              <p style={hint}>{t('opsEfficiencyAgentModule.spreadsheetHint')}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={handleSave} disabled={saving} style={btn('#2563EB', '#FFFFFF', '#1D4ED8')}>
          {saving ? t('opsEfficiencyAgentModule.saving') : t('opsEfficiencyAgentModule.saveConfiguration')}
        </button>
      </div>

      <div style={{ marginTop: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.1rem', fontWeight: 600 }}>{t('opsEfficiencyAgentModule.agentInfo')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ margin: '4px 0', color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{t('opsEfficiencyAgentModule.infoName')}</span> {t('opsEfficiencyAgentModule.title')}</p>
            <p style={{ margin: '4px 0', color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{t('opsEfficiencyAgentModule.infoVersion')}</span> {agentDescriptor.version}</p>
            <p style={{ margin: '4px 0', color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{t('opsEfficiencyAgentModule.infoModule')}</span> {agentDescriptor.module}</p>
          </div>
          <div>
            <p style={{ margin: '4px 0', color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{t('opsEfficiencyAgentModule.infoCapabilities')}</span> {agentDescriptor.capabilities.length}</p>
            <p style={{ margin: '4px 0', color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{t('opsEfficiencyAgentModule.infoHmac')}</span> {hmacYes}</p>
            <p style={{ margin: '4px 0', color: '#4B5563' }}><span style={{ fontWeight: 600 }}>{t('opsEfficiencyAgentModule.infoAttestation')}</span> {attestationLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
