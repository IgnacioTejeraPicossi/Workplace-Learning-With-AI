import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    defaultOwner: 'sales@company.com',
    defaultChannel: '#sales',
    hygieneThreshold: 70,
  });

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    alert(t('salesAssistantModule.settingsSavedMock'));
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{t('salesAssistantModule.settingsTitle')}</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label={t('salesAssistantModule.fieldDefaultOwner')}>
            <input value={form.defaultOwner} onChange={(e) => update('defaultOwner', e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t('salesAssistantModule.fieldSlackChannel')}>
            <input value={form.defaultChannel} onChange={(e) => update('defaultChannel', e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t('salesAssistantModule.fieldHygieneThreshold')}>
            <input type="number" value={form.hygieneThreshold} onChange={(e) => update('hygieneThreshold', Number(e.target.value))} style={inputStyle} />
          </Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={save} style={{ background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            {t('salesAssistantModule.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '10px 12px',
};

export default Settings;
