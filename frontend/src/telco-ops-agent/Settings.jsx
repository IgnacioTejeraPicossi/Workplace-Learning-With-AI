import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
};

const SectionPanel = ({ icon, title, children }) => (
  <div style={cardStyle}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      paddingBottom: '14px',
      borderBottom: '1px solid #e2e8f0',
    }}>
      <span style={{
        fontSize: '20px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
        padding: '8px',
        borderRadius: '10px',
      }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const FieldGroup = ({ label, hint, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>{hint}</p>}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#0f172a',
  background: '#f8fafc',
  outline: 'none',
  boxSizing: 'border-box',
};

const Settings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    maxAutoValue: 50,
    confidenceThreshold: 0.7,
    riskThreshold: 70,
    requiredApprovalRoles: ['ops-supervisor'],
    tmfBaseUrl: 'https://tmf.example.com',
    tmfAuthToken: '',
    appointBaseUrl: 'https://appointments.example.com',
    appointToken: '',
    commsProvider: 'm365',
    commsApiKey: '',
    crmBaseUrl: 'https://crm.example.com',
    crmBearerToken: '',
    graphUserId: 'me',
    graphBearerToken: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      console.log('Loading settings...');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFeedback({ type: 'success', message: t('telcoOpsAgentModule.settingsSaved') });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFeedback({ type: 'error', message: t('telcoOpsAgentModule.settingsSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));
  const setArr = (field, value) => setSettings((prev) => ({ ...prev, [field]: value.split(',').map((s) => s.trim()).filter(Boolean) }));

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>

        {/* Hero banner */}
        <div style={{
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          background: 'linear-gradient(90deg, #0891b2 0%, #4f46e5 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '40px' }}>⚙️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t('telcoOpsAgentModule.settingsTitle')}</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{t('telcoOpsAgentModule.settingsSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '10px 22px',
              background: saving ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '10px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? `⏳ ${t('telcoOpsAgentModule.saving')}` : `💾 ${t('telcoOpsAgentModule.saveSettings')}`}
          </button>
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: feedback.type === 'success'
              ? 'linear-gradient(90deg, #dcfce7 0%, #d1fae5 100%)'
              : 'linear-gradient(90deg, #fee2e2 0%, #ffe4e6 100%)',
            border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span>{feedback.type === 'success' ? '✅' : '❌'}</span>
            {feedback.message}
          </div>
        )}

        {/* Policy Guardrails */}
        <SectionPanel icon="🛡️" title={t('telcoOpsAgentModule.policySection')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FieldGroup label={t('telcoOpsAgentModule.labelMaxAuto')} hint={t('telcoOpsAgentModule.hintMaxAuto')}>
              <input type="number" value={settings.maxAutoValue}
                onChange={(e) => set('maxAutoValue', parseFloat(e.target.value))}
                style={inputStyle} min="0" step="0.1" />
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelConfidence')} hint={t('telcoOpsAgentModule.hintConfidence')}>
              <input type="number" value={settings.confidenceThreshold}
                onChange={(e) => set('confidenceThreshold', parseFloat(e.target.value))}
                style={inputStyle} min="0" max="1" step="0.1" />
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelRisk')} hint={t('telcoOpsAgentModule.hintRisk')}>
              <input type="number" value={settings.riskThreshold}
                onChange={(e) => set('riskThreshold', parseFloat(e.target.value))}
                style={inputStyle} min="0" max="100" step="1" />
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelApprovalRoles')} hint={t('telcoOpsAgentModule.hintApprovalRoles')}>
              <input type="text" value={settings.requiredApprovalRoles.join(', ')}
                onChange={(e) => setArr('requiredApprovalRoles', e.target.value)}
                style={inputStyle} placeholder="ops-supervisor, manager" />
            </FieldGroup>
          </div>
        </SectionPanel>

        {/* TMF Integration */}
        <SectionPanel icon="📦" title={t('telcoOpsAgentModule.tmfSection')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FieldGroup label={t('telcoOpsAgentModule.labelTmfBaseUrl')}>
              <input type="url" value={settings.tmfBaseUrl}
                onChange={(e) => set('tmfBaseUrl', e.target.value)}
                style={inputStyle} placeholder="https://tmf.example.com" />
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelTmfAuthToken')}>
              <input type="password" value={settings.tmfAuthToken}
                onChange={(e) => set('tmfAuthToken', e.target.value)}
                style={inputStyle} placeholder={t('telcoOpsAgentModule.placeholderBearer')} />
            </FieldGroup>
          </div>
        </SectionPanel>

        {/* Appointment Integration */}
        <SectionPanel icon="📅" title={t('telcoOpsAgentModule.appointSection')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FieldGroup label={t('telcoOpsAgentModule.labelAppointBaseUrl')}>
              <input type="url" value={settings.appointBaseUrl}
                onChange={(e) => set('appointBaseUrl', e.target.value)}
                style={inputStyle} placeholder="https://appointments.example.com" />
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelAppointToken')}>
              <input type="password" value={settings.appointToken}
                onChange={(e) => set('appointToken', e.target.value)}
                style={inputStyle} placeholder={t('telcoOpsAgentModule.placeholderApiToken')} />
            </FieldGroup>
          </div>
        </SectionPanel>

        {/* Communications Integration */}
        <SectionPanel icon="📧" title={t('telcoOpsAgentModule.commSection')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FieldGroup label={t('telcoOpsAgentModule.labelCommProvider')}>
              <select value={settings.commsProvider}
                onChange={(e) => set('commsProvider', e.target.value)}
                style={inputStyle}>
                <option value="m365">{t('telcoOpsAgentModule.providerM365')}</option>
                <option value="sendgrid">{t('telcoOpsAgentModule.providerSendgrid')}</option>
                <option value="sms">{t('telcoOpsAgentModule.providerSms')}</option>
              </select>
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelCommApiKey')}>
              <input type="password" value={settings.commsApiKey}
                onChange={(e) => set('commsApiKey', e.target.value)}
                style={inputStyle} placeholder={t('telcoOpsAgentModule.placeholderApiKey')} />
            </FieldGroup>
            {settings.commsProvider === 'm365' && (
              <>
                <FieldGroup label={t('telcoOpsAgentModule.labelGraphUserId')}>
                  <input type="text" value={settings.graphUserId}
                    onChange={(e) => set('graphUserId', e.target.value)}
                    style={inputStyle} placeholder="me" />
                </FieldGroup>
                <FieldGroup label={t('telcoOpsAgentModule.labelGraphBearer')}>
                  <input type="password" value={settings.graphBearerToken}
                    onChange={(e) => set('graphBearerToken', e.target.value)}
                    style={inputStyle} placeholder={t('telcoOpsAgentModule.placeholderBearer')} />
                </FieldGroup>
              </>
            )}
          </div>
        </SectionPanel>

        {/* CRM Integration */}
        <SectionPanel icon="🎫" title={t('telcoOpsAgentModule.crmSection')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FieldGroup label={t('telcoOpsAgentModule.labelCrmBaseUrl')}>
              <input type="url" value={settings.crmBaseUrl}
                onChange={(e) => set('crmBaseUrl', e.target.value)}
                style={inputStyle} placeholder="https://crm.example.com" />
            </FieldGroup>
            <FieldGroup label={t('telcoOpsAgentModule.labelCrmBearer')}>
              <input type="password" value={settings.crmBearerToken}
                onChange={(e) => set('crmBearerToken', e.target.value)}
                style={inputStyle} placeholder={t('telcoOpsAgentModule.placeholderBearer')} />
            </FieldGroup>
          </div>
        </SectionPanel>

        {/* Save footer banner */}
        <div style={{
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          background: 'linear-gradient(90deg, #16a34a 0%, #0891b2 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700 }}>💾 {t('telcoOpsAgentModule.saveSettings')}</h3>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>{t('telcoOpsAgentModule.settingsSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '10px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? `⏳ ${t('telcoOpsAgentModule.saving')}` : `💾 ${t('telcoOpsAgentModule.saveSettings')}`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
