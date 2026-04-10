import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';

const ITEMSERVERAI_DEFAULT_URL = 'http://192.168.50.142:1234';
const ITEMSERVERAI_OLD_URL = 'http://192.168.50.214:1234';

const APIConfig = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [apiProvider, setApiProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [itemaiUrl, setItemaiUrl] = useState('http://localhost:1234');
  const [itemserveraiUrl, setItemserveraiUrl] = useState(ITEMSERVERAI_DEFAULT_URL);
  const [status, setStatus] = useState('');

  const providerTitle = () => {
    if (apiProvider === 'itemai') return t('apiConfigModule.providerItemai');
    if (apiProvider === 'itemserverai') return t('apiConfigModule.providerItemserverai');
    if (apiProvider === 'openai') return t('apiConfigModule.providerOpenai');
    return t('apiConfigModule.providerOpenrouter');
  };

  const providerDescription = () => {
    if (apiProvider === 'itemai') return t('apiConfigModule.descItemai');
    if (apiProvider === 'itemserverai') return t('apiConfigModule.descItemserverai');
    if (apiProvider === 'openai') return t('apiConfigModule.descOpenai');
    return t('apiConfigModule.descOpenrouter');
  };

  const step4Fallback = () => {
    if (apiProvider === 'itemai') return t('apiConfigModule.step4Itemai');
    if (apiProvider === 'itemserverai') return t('apiConfigModule.step4Itemserverai');
    if (apiProvider === 'openrouter') return t('apiConfigModule.step4Openrouter');
    return t('apiConfigModule.step4Openai');
  };

  useEffect(() => {
    const savedProvider = localStorage.getItem('apiProvider') || 'openai';
    const savedOpenaiKey = localStorage.getItem('openaiKey') || '';
    const savedOpenrouterKey = localStorage.getItem('openrouterKey') || '';
    const savedItemaiUrl = localStorage.getItem('itemaiUrl') || 'http://localhost:1234';
    let savedItemserveraiUrl = localStorage.getItem('itemserveraiUrl') || ITEMSERVERAI_DEFAULT_URL;
    if (savedItemserveraiUrl === ITEMSERVERAI_OLD_URL || savedItemserveraiUrl.replace(/\/$/, '') === ITEMSERVERAI_OLD_URL) {
      savedItemserveraiUrl = ITEMSERVERAI_DEFAULT_URL;
      localStorage.setItem('itemserveraiUrl', ITEMSERVERAI_DEFAULT_URL);
    }

    setApiProvider(savedProvider);
    setOpenaiKey(savedOpenaiKey);
    setOpenrouterKey(savedOpenrouterKey);
    setItemaiUrl(savedItemaiUrl);
    setItemserveraiUrl(savedItemserveraiUrl);

    if (savedProvider === 'itemai' || savedProvider === 'itemserverai') {
      const url = savedProvider === 'itemserverai' ? savedItemserveraiUrl : savedItemaiUrl;
      fetch('/api/test-itemai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ local_url: url })
      })
        .then(response => response.json())
        .then(result => {
          if (result.success && result.model_used) {
            localStorage.setItem('itemaiCurrentModel', result.model_used);
            window.dispatchEvent(new Event('itemaiModelChanged'));
          }
        })
        .catch(error => {
          console.log('Could not auto-fetch model on load:', error);
        });
    }
  }, []);

  const handleProviderChange = async (provider) => {
    setApiProvider(provider);
    localStorage.setItem('apiProvider', provider);
    window.dispatchEvent(new Event('apiProviderChanged'));
    setStatus(t('apiConfigModule.statusSwitched', { provider: provider.toUpperCase() }));

    if (provider === 'itemserverai' || provider === 'itemai') {
      try {
        const url = provider === 'itemserverai' ? itemserveraiUrl : itemaiUrl;
        const response = await fetch('/api/test-itemai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ local_url: url })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.model_used) {
            localStorage.setItem('itemaiCurrentModel', result.model_used);
            window.dispatchEvent(new Event('itemaiModelChanged'));
            setStatus(t('apiConfigModule.statusSwitchedModel', { provider: provider.toUpperCase(), model: result.model_used }));
          }
        }
      } catch (error) {
        console.log('Could not auto-fetch model:', error);
      }
    }

    setTimeout(() => setStatus(''), 5000);
  };

  const handleSaveKeys = async () => {
    let normalizedItemserveraiUrl = itemserveraiUrl;
    if (itemserveraiUrl && itemserveraiUrl.startsWith('https://192.168.')) {
      normalizedItemserveraiUrl = itemserveraiUrl.replace('https://', 'http://');
      setItemserveraiUrl(normalizedItemserveraiUrl);
    }

    localStorage.setItem('openaiKey', openaiKey);
    localStorage.setItem('openrouterKey', openrouterKey);
    localStorage.setItem('itemaiUrl', itemaiUrl);
    localStorage.setItem('itemserveraiUrl', normalizedItemserveraiUrl);

    try {
      const response = await fetch('/api/save-api-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: apiProvider,
          openaiKey: openaiKey,
          openrouterKey: openrouterKey,
          itemaiUrl: itemaiUrl,
          itemserveraiUrl: normalizedItemserveraiUrl
        })
      });

      const result = await response.json();
      if (result.success) {
        setStatus(t('apiConfigModule.statusSaveOk'));
      } else {
        setStatus(t('apiConfigModule.statusSaveServerFail', { detail: result.message || 'Unknown error' }));
      }
    } catch (error) {
      setStatus(t('apiConfigModule.statusSaveServerFail', { detail: error.message }));
    }

    setTimeout(() => setStatus(''), 5000);
  };

  const handleTestAPI = async () => {
    setStatus(t('apiConfigModule.statusTesting'));
    try {
      let response;

      if (apiProvider === 'itemai') {
        response = await fetch('/api/test-itemai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ local_url: itemaiUrl })
        });
      } else if (apiProvider === 'itemserverai') {
        response = await fetch('/api/test-itemai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ local_url: itemserveraiUrl })
        });
      } else {
        response = await fetch('/api/test-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: apiProvider,
            openaiKey: apiProvider === 'openai' ? openaiKey : '',
            openrouterKey: apiProvider === 'openrouter' ? openrouterKey : ''
          })
        });
      }

      let result = null;
      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      if (response.ok && result?.success) {
        setStatus(t('apiConfigModule.statusTestOk', { message: result.message }));
        if ((apiProvider === 'itemai' || apiProvider === 'itemserverai') && result.model_used) {
          localStorage.setItem('itemaiCurrentModel', result.model_used);
          window.dispatchEvent(new Event('itemaiModelChanged'));
        }
      } else {
        const errorMessage =
          result?.error ||
          result?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        setStatus(t('apiConfigModule.statusTestFail', { detail: errorMessage }));
      }
    } catch (error) {
      setStatus(t('apiConfigModule.statusTestFail', { detail: error.message || 'Network error.' }));
    }
    setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, marginBottom: 8 }}>🔧 {t('apiConfigModule.pageTitle')}</h1>
          <p style={{ color: colors.textSecondary, fontSize: '1.1em' }}>
            {t('apiConfigModule.pageSubtitle')}
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: colors.text, marginBottom: 16 }}>{t('apiConfigModule.selectProvider')}</h2>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleProviderChange('itemai')}
              style={{
                background: apiProvider === 'itemai' ? '#e3f2fd' : 'transparent',
                color: apiProvider === 'itemai' ? '#1565c0' : colors.text,
                border: `2px solid ${apiProvider === 'itemai' ? '#1976d2' : colors.border}`,
                padding: '16px 24px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 500,
                flex: '1',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
            >
              {t('apiConfigModule.providerItemai')}
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange('itemserverai')}
              style={{
                background: apiProvider === 'itemserverai' ? '#e3f2fd' : 'transparent',
                color: apiProvider === 'itemserverai' ? '#1565c0' : colors.text,
                border: `2px solid ${apiProvider === 'itemserverai' ? '#1976d2' : colors.border}`,
                padding: '16px 24px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 500,
                flex: '1',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
            >
              {t('apiConfigModule.providerItemserverai')}
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange('openrouter')}
              style={{
                background: apiProvider === 'openrouter' ? '#e3f2fd' : 'transparent',
                color: apiProvider === 'openrouter' ? '#1565c0' : colors.text,
                border: `2px solid ${apiProvider === 'openrouter' ? '#1976d2' : colors.border}`,
                padding: '16px 24px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 500,
                flex: 1,
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
            >
              {t('apiConfigModule.providerOpenrouter')}
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange('openai')}
              style={{
                background: apiProvider === 'openai' ? '#e3f2fd' : 'transparent',
                color: apiProvider === 'openai' ? '#1565c0' : colors.text,
                border: `2px solid ${apiProvider === 'openai' ? '#1976d2' : colors.border}`,
                padding: '16px 24px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 500,
                flex: 1,
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
            >
              {t('apiConfigModule.providerOpenai')}
            </button>
          </div>

          <div style={{
            background: colors.primaryLight,
            padding: '20px',
            borderRadius: 12,
            border: `1px solid ${colors.primary}`
          }}>
            <h3 style={{ color: colors.primary, marginBottom: 12 }}>
              {providerTitle()}
            </h3>
            <p style={{ color: colors.text, lineHeight: 1.6 }}>
              {providerDescription()}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: colors.text, marginBottom: 16 }}>{t('apiConfigModule.sectionConfig')}</h2>

          {apiProvider === 'itemai' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: colors.text, fontWeight: '500' }}>
                {t('apiConfigModule.labelItemaiUrl')}
              </label>
              <input
                type="text"
                value={itemaiUrl}
                onChange={(e) => setItemaiUrl(e.target.value)}
                placeholder="http://localhost:1234"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: '1em',
                  background: colors.background,
                  color: colors.text
                }}
              />
              <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginTop: 4 }}>
                {t('apiConfigModule.hintItemaiUrl')}
              </p>
            </div>
          )}

          {apiProvider === 'itemserverai' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: colors.text, fontWeight: '500' }}>
                {t('apiConfigModule.labelItemserveraiUrl')}
              </label>
              <input
                type="text"
                value={itemserveraiUrl}
                onChange={(e) => setItemserveraiUrl(e.target.value)}
                placeholder="http://192.168.50.142:1234"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: '1em',
                  background: colors.background,
                  color: colors.text
                }}
              />
              <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginTop: 4 }}>
                {t('apiConfigModule.hintItemserveraiUrl')}
              </p>
            </div>
          )}

          {apiProvider === 'openai' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: colors.text, fontWeight: '500' }}>
                {t('apiConfigModule.labelOpenaiKey')}
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: '1em',
                  background: colors.background,
                  color: colors.text
                }}
              />
              <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginTop: 4 }}>
                {t('apiConfigModule.hintOpenaiKeyBefore')}{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>{t('apiConfigModule.hintOpenaiLink')}</a>
              </p>
            </div>
          )}

          {apiProvider === 'openrouter' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: colors.text, fontWeight: '500' }}>
                {t('apiConfigModule.labelOpenrouterKey')}
              </label>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: '1em',
                  background: colors.background,
                  color: colors.text
                }}
              />
              <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginTop: 4 }}>
                {t('apiConfigModule.hintOpenrouterBefore')}{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>{t('apiConfigModule.hintOpenrouterLink')}</a>
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <button
              type="button"
              onClick={handleSaveKeys}
              style={{
                background: colors.primary,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: '1em',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t('apiConfigModule.saveKeys')}
            </button>

            <button
              type="button"
              onClick={handleTestAPI}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: '1em',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t('apiConfigModule.testApi')}
            </button>
          </div>
        </div>

        {status && (
          <div style={{
            background: status.includes('✅') ? '#d4edda' : status.includes('❌') ? '#f8d7da' : colors.primaryLight,
            color: status.includes('✅') ? '#155724' : status.includes('❌') ? '#721c24' : colors.primary,
            padding: '16px',
            borderRadius: 8,
            border: `1px solid ${status.includes('✅') ? '#c3e6cb' : status.includes('❌') ? '#f5c6cb' : colors.primary}`,
            marginBottom: 20
          }}>
            {status}
          </div>
        )}

        <div style={{
          background: colors.background,
          padding: '24px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          marginTop: 32
        }}>
          <h3 style={{ color: colors.text, marginBottom: 16 }}>{t('apiConfigModule.howToTitle')}</h3>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>{t('apiConfigModule.step1Title')}</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              {t('apiConfigModule.step1Body')}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>{t('apiConfigModule.step2Title')}</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              {t('apiConfigModule.step2Body')}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>{t('apiConfigModule.step3Title')}</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              {t('apiConfigModule.step3Body')}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>{t('apiConfigModule.step4Title')}</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              {step4Fallback()}
            </p>
          </div>
        </div>

        <div style={{
          background: colors.background,
          padding: '24px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          marginTop: 20
        }}>
          <h3 style={{ color: colors.text, marginBottom: 16 }}>{t('apiConfigModule.comparisonTitle')}</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20
          }}>
            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('apiConfigModule.compareItemaiTitle')}</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li>{t('apiConfigModule.compareItemai1')}</li>
                <li>{t('apiConfigModule.compareItemai2')}</li>
                <li>{t('apiConfigModule.compareItemai3')}</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('apiConfigModule.compareItemserveraiTitle')}</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li>{t('apiConfigModule.compareItemserverai1')}</li>
                <li>{t('apiConfigModule.compareItemserverai2')}</li>
                <li>{t('apiConfigModule.compareItemserverai3')}</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('apiConfigModule.compareOpenrouterTitle')}</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li>{t('apiConfigModule.compareOpenrouter1')}</li>
                <li>{t('apiConfigModule.compareOpenrouter2')}</li>
                <li>{t('apiConfigModule.compareOpenrouter3')}</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('apiConfigModule.compareOpenaiTitle')}</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li>{t('apiConfigModule.compareOpenai1')}</li>
                <li>{t('apiConfigModule.compareOpenai2')}</li>
                <li>{t('apiConfigModule.compareOpenai3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIConfig;
