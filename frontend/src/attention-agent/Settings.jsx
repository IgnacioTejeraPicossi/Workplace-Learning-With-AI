import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  accentButtonStyle,
  attentionCardStyle,
  heroButtonStyle,
} from './sharedUi';

const fieldLabel = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const Settings = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    mustHave: [],
    muteTerms: [],
    teams: [],
    priorityBoostJson: {},
    quietHours: '22:00-08:00',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/preferences');
      const data = await response.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/agents/attention/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        window.alert(t('personalAttentionAgentModule.prefsSaved'));
      } else {
        window.alert(t('personalAttentionAgentModule.prefsSaveFailed'));
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      window.alert(t('personalAttentionAgentModule.prefsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const addMustHave = () => {
    const term = window.prompt(t('personalAttentionAgentModule.promptMustHave'));
    if (term && !preferences.mustHave.includes(term)) {
      setPreferences({
        ...preferences,
        mustHave: [...preferences.mustHave, term],
      });
    }
  };

  const removeMustHave = (index) => {
    setPreferences({
      ...preferences,
      mustHave: preferences.mustHave.filter((_, i) => i !== index),
    });
  };

  const addMuteTerm = () => {
    const term = window.prompt(t('personalAttentionAgentModule.promptMute'));
    if (term && !preferences.muteTerms.includes(term)) {
      setPreferences({
        ...preferences,
        muteTerms: [...preferences.muteTerms, term],
      });
    }
  };

  const removeMuteTerm = (index) => {
    setPreferences({
      ...preferences,
      muteTerms: preferences.muteTerms.filter((_, i) => i !== index),
    });
  };

  const addTeam = () => {
    const team = window.prompt(t('personalAttentionAgentModule.promptTeam'));
    if (team && !preferences.teams.includes(team)) {
      setPreferences({
        ...preferences,
        teams: [...preferences.teams, team],
      });
    }
  };

  const removeTeam = (index) => {
    setPreferences({
      ...preferences,
      teams: preferences.teams.filter((_, i) => i !== index),
    });
  };

  const saveBtn = (
    <button type="button" onClick={savePreferences} disabled={saving} style={heroButtonStyle(saving)}>
      {saving ? t('personalAttentionAgentModule.saving') : t('personalAttentionAgentModule.saveSettings')}
    </button>
  );

  const pillRow = (bg, border) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 14px',
    background: bg,
    borderRadius: '10px',
    border: `1px solid ${border}`,
    marginBottom: '8px',
  });

  return (
    <AttentionPage>
      <AttentionHero
        icon="⚙️"
        title={t('personalAttentionAgentModule.settingsPageTitle')}
        subtitle={t('personalAttentionAgentModule.settingsPageSubtitle')}
        trailing={saveBtn}
      />

      {loading ? (
        <div style={{ ...attentionCardStyle, textAlign: 'center', padding: '48px', color: '#64748b' }}>
          {t('personalAttentionAgentModule.loadingSettings')}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={attentionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{t('personalAttentionAgentModule.mustHaveTitle')}</h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{t('personalAttentionAgentModule.mustHaveDesc')}</p>
              <div>
                {preferences.mustHave.map((term, index) => (
                  <div key={`must-${index}`} style={pillRow('#ecfdf5', '#bbf7d0')}>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{term}</span>
                    <button
                      type="button"
                      onClick={() => removeMustHave(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b91c1c',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {t('personalAttentionAgentModule.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMustHave}
                  style={{
                    marginTop: '8px',
                    background: '#dcfce7',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {t('personalAttentionAgentModule.addMustHave')}
                </button>
              </div>
            </div>

            <div style={attentionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔇</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{t('personalAttentionAgentModule.muteTitle')}</h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{t('personalAttentionAgentModule.muteDesc')}</p>
              <div>
                {preferences.muteTerms.map((term, index) => (
                  <div key={`mute-${index}`} style={pillRow('#fef2f2', '#fecaca')}>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{term}</span>
                    <button
                      type="button"
                      onClick={() => removeMuteTerm(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b91c1c',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {t('personalAttentionAgentModule.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMuteTerm}
                  style={{
                    marginTop: '8px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {t('personalAttentionAgentModule.addMute')}
                </button>
              </div>
            </div>
          </div>

          <div style={attentionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>👥</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{t('personalAttentionAgentModule.teamsTitle')}</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{t('personalAttentionAgentModule.teamsDesc')}</p>
            <div style={{ display: 'grid', gap: '8px', maxWidth: '640px' }}>
              {preferences.teams.map((team, index) => (
                <div key={`team-${index}`} style={pillRow('#eff6ff', '#dbeafe')}>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{team}</span>
                  <button
                    type="button"
                    onClick={() => removeTeam(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b91c1c',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {t('personalAttentionAgentModule.remove')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTeam}
                style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  width: 'fit-content',
                }}
              >
                {t('personalAttentionAgentModule.addTeam')}
              </button>
            </div>
          </div>

          <div style={attentionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🌙</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{t('personalAttentionAgentModule.quietHoursTitle')}</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>{t('personalAttentionAgentModule.quietHoursDesc')}</p>
            <div style={{ maxWidth: '320px' }}>
              <input
                type="text"
                value={preferences.quietHours}
                onChange={(e) => setPreferences({ ...preferences, quietHours: e.target.value })}
                placeholder="22:00-08:00"
                style={inputStyle}
              />
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>{t('personalAttentionAgentModule.quietHoursFormat')}</p>
            </div>
          </div>

          <div style={attentionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>🔌</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                {t('personalAttentionAgentModule.integrationSettings')}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div
                style={{
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {t('personalAttentionAgentModule.slackIntegration')}
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>{t('personalAttentionAgentModule.botToken')}</label>
                    <input type="password" placeholder="xoxb-..." style={{ ...inputStyle, background: 'white' }} />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t('personalAttentionAgentModule.defaultChannel')}</label>
                    <input type="text" placeholder="#cto-brief" style={{ ...inputStyle, background: 'white' }} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {t('personalAttentionAgentModule.teamsIntegration')}
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={fieldLabel}>{t('personalAttentionAgentModule.webhookUrl')}</label>
                    <input
                      type="url"
                      placeholder="https://outlook.office.com/webhook/..."
                      style={{ ...inputStyle, background: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>{t('personalAttentionAgentModule.graphToken')}</label>
                    <input type="password" placeholder="Bearer token" style={{ ...inputStyle, background: 'white' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={savePreferences} disabled={saving} style={accentButtonStyle('blue')}>
              {saving ? t('personalAttentionAgentModule.saving') : t('personalAttentionAgentModule.saveSettings')}
            </button>
          </div>
        </>
      )}
    </AttentionPage>
  );
};

export default Settings;
