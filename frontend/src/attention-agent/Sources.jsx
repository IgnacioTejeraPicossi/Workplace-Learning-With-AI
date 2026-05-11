import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  AttentionSectionHeader,
  accentButtonStyle,
  attentionCardStyle,
  attentionPanelStyle,
  heroButtonStyle,
} from './sharedUi';

const inputStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' };

const Sources = () => {
  const { t } = useTranslation();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    type: 'slack',
    urlOrId: '',
    authRef: '',
    pullIntervalMin: 15,
    active: true,
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    try {
      const response = await fetch('/agents/attention/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });

      if (response.ok) {
        setNewSource({
          type: 'slack',
          urlOrId: '',
          authRef: '',
          pullIntervalMin: 15,
          active: true,
        });
        setShowAddForm(false);
        loadSources();
      }
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const toggleSource = async (sourceId, active) => {
    try {
      const response = await fetch(`/agents/attention/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });

      if (response.ok) {
        loadSources();
      }
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  const deleteSource = async (sourceId) => {
    if (!window.confirm(t('personalAttentionAgentModule.confirmDeleteSource'))) return;

    try {
      const response = await fetch(`/agents/attention/sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadSources();
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const getSourceIcon = (type) => {
    const icons = {
      slack: '💬',
      teams: '💬',
      webex: '📹',
      sharepoint: '📄',
      rss: '📡',
      workplace: '👥',
      workvivo: '🏢',
    };
    return icons[type] || '📡';
  };

  const typeLabel = (type) => t(`personalAttentionAgentModule.sourceTypes.${type}`, { defaultValue: type });

  const addBtn = (
    <button type="button" onClick={() => setShowAddForm(true)} style={heroButtonStyle(false)}>
      + {t('personalAttentionAgentModule.addSource')}
    </button>
  );

  return (
    <AttentionPage>
      <AttentionHero
        icon="📡"
        title={t('personalAttentionAgentModule.sourcesPageTitle')}
        subtitle={t('personalAttentionAgentModule.sourcesPageSubtitle')}
        trailing={addBtn}
      />

      {showAddForm && (
        <div style={attentionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>➕</span>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('personalAttentionAgentModule.addNewSource')}</h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>{t('personalAttentionAgentModule.sourceType')}</label>
              <select
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                style={{ ...inputStyle, background: 'white' }}
              >
                <option value="slack">{t('personalAttentionAgentModule.sourceTypes.slack')}</option>
                <option value="teams">{t('personalAttentionAgentModule.sourceTypes.teams')}</option>
                <option value="webex">{t('personalAttentionAgentModule.sourceTypes.webex')}</option>
                <option value="sharepoint">{t('personalAttentionAgentModule.sourceTypes.sharepoint')}</option>
                <option value="rss">{t('personalAttentionAgentModule.sourceTypes.rss')}</option>
                <option value="workplace">{t('personalAttentionAgentModule.sourceTypes.workplace')}</option>
                <option value="workvivo">{t('personalAttentionAgentModule.sourceTypes.workvivo')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('personalAttentionAgentModule.urlOrId')}</label>
              <input
                type="text"
                value={newSource.urlOrId}
                onChange={(e) => setNewSource({ ...newSource, urlOrId: e.target.value })}
                placeholder={t('personalAttentionAgentModule.urlOrIdPlaceholder')}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('personalAttentionAgentModule.authReference')}</label>
              <input
                type="text"
                value={newSource.authRef}
                onChange={(e) => setNewSource({ ...newSource, authRef: e.target.value })}
                placeholder={t('personalAttentionAgentModule.authRefPlaceholder')}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('personalAttentionAgentModule.pullIntervalMin')}</label>
              <input
                type="number"
                value={newSource.pullIntervalMin}
                onChange={(e) => setNewSource({ ...newSource, pullIntervalMin: parseInt(e.target.value, 10) })}
                min="5"
                max="60"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button type="button" onClick={addSource} style={accentButtonStyle('green')}>
              {t('personalAttentionAgentModule.addSource')}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={accentButtonStyle('gray')}>
              {t('personalAttentionAgentModule.cancel')}
            </button>
          </div>
        </div>
      )}

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="📋" title={t('personalAttentionAgentModule.activeSources')} />

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>{t('personalAttentionAgentModule.loadingSources')}</div>
        ) : sources.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b' }}>{t('personalAttentionAgentModule.noSourcesConfigured')}</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                marginTop: '16px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('personalAttentionAgentModule.addFirstSource')}
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'grid', gap: '12px' }}>
            {sources.map((source) => (
              <div
                key={source._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  padding: '16px 18px',
                  background: '#eff6ff',
                  borderRadius: '12px',
                  border: '1px solid #dbeafe',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                  <div style={{ fontSize: '28px' }}>{getSourceIcon(source.type)}</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                      {t('personalAttentionAgentModule.sourceRow', { type: typeLabel(source.type) })}
                    </h4>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569', wordBreak: 'break-all' }}>{source.urlOrId}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: source.active ? '#dcfce7' : '#fee2e2',
                          color: source.active ? '#166534' : '#991b1b',
                        }}
                      >
                        {source.active ? t('personalAttentionAgentModule.statusActive') : t('personalAttentionAgentModule.statusInactive')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {t('personalAttentionAgentModule.pullEvery', { minutes: source.pullIntervalMin })}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => toggleSource(source._id, !source.active)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: source.active ? '#fee2e2' : '#dcfce7',
                      color: source.active ? '#991b1b' : '#166534',
                    }}
                  >
                    {source.active ? t('personalAttentionAgentModule.deactivate') : t('personalAttentionAgentModule.activate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSource(source._id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: '#fef2f2',
                      color: '#b91c1c',
                    }}
                  >
                    {t('personalAttentionAgentModule.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AttentionPage>
  );
};

export default Sources;
