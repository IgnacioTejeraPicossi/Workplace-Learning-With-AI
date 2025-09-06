import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    hmac_secret: '',
    n8n_base_url: 'http://localhost:5678',
    lm_studio_url: 'http://localhost:1234',
    timeout: 60,
    auto_refresh: true,
    refresh_interval: 5
  });

  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load settings from localStorage
    const saved = localStorage.getItem('agentops_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  };

  const saveSettings = () => {
    localStorage.setItem('agentops_settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings({
        hmac_secret: '',
        n8n_base_url: 'http://localhost:5678',
        lm_studio_url: 'http://localhost:1234',
        timeout: 60,
        auto_refresh: true,
        refresh_interval: 5
      });
    }
  };

  const testConnection = async (type) => {
    setTesting(prev => ({ ...prev, [type]: true }));
    
    try {
      let url;
      switch (type) {
        case 'n8n':
          url = settings.n8n_base_url;
          break;
        case 'lm_studio':
          url = settings.lm_studio_url + '/v1/models';
          break;
        case 'backend':
          url = '/api/agentops/flows';
          break;
        default:
          throw new Error('Unknown connection type');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const success = response.ok;
      setTestResults(prev => ({
        ...prev,
        [type]: {
          success,
          status: response.status,
          message: success ? 'Connection successful' : `HTTP ${response.status}: ${response.statusText}`
        }
      }));

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [type]: {
          success: false,
          status: 'Error',
          message: error.message
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  const generateHmacSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSettings(prev => ({ ...prev, hmac_secret: result }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          ⚙️ Settings
        </h2>
        <p style={{ color: '#6b7280' }}>
          Configure API settings, HMAC secrets, connection parameters, and system preferences.
        </p>
      </div>

      {/* API Configuration */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          API Configuration
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                n8n Base URL
              </label>
              <input
                type="url"
                value={settings.n8n_base_url}
                onChange={(e) => setSettings(prev => ({ ...prev, n8n_base_url: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
                placeholder="http://localhost:5678"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                LM Studio URL
              </label>
              <input
                type="url"
                value={settings.lm_studio_url}
                onChange={(e) => setSettings(prev => ({ ...prev, lm_studio_url: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
                placeholder="http://localhost:1234"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Request Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) || 60 }))}
              min="10"
              max="300"
              style={{
                width: '200px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          Security Settings
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              HMAC Secret
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="password"
                value={settings.hmac_secret}
                onChange={(e) => setSettings(prev => ({ ...prev, hmac_secret: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
                placeholder="Enter HMAC secret for n8n callbacks"
              />
              <button
                onClick={generateHmacSecret}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                🎲 Generate
              </button>
              <button
                onClick={() => copyToClipboard(settings.hmac_secret)}
                disabled={!settings.hmac_secret}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: settings.hmac_secret ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: settings.hmac_secret ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                📋 Copy
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              This secret must match the one configured in your n8n workflows
            </div>
          </div>
        </div>
      </div>

      {/* UI Preferences */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          UI Preferences
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              checked={settings.auto_refresh}
              onChange={(e) => setSettings(prev => ({ ...prev, auto_refresh: e.target.checked }))}
              style={{ transform: 'scale(1.2)' }}
            />
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Auto-refresh runs data
            </label>
          </div>

          {settings.auto_refresh && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={settings.refresh_interval}
                onChange={(e) => setSettings(prev => ({ ...prev, refresh_interval: parseInt(e.target.value) || 5 }))}
                min="5"
                max="60"
                style={{
                  width: '200px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Connection Tests */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          Connection Tests
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { key: 'backend', label: 'Backend API', description: 'Test connection to AgentOps backend' },
            { key: 'n8n', label: 'n8n Instance', description: 'Test connection to n8n workflow engine' },
            { key: 'lm_studio', label: 'LM Studio', description: 'Test connection to LM Studio API' }
          ].map(({ key, label, description }) => (
            <div key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{description}</div>
                {testResults[key] && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: testResults[key].success ? '#059669' : '#dc2626',
                    marginTop: '0.25rem'
                  }}>
                    {testResults[key].success ? '✅' : '❌'} {testResults[key].message}
                  </div>
                )}
              </div>
              <button
                onClick={() => testConnection(key)}
                disabled={testing[key]}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: testing[key] ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: testing[key] ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {testing[key] ? '⏳ Testing...' : '🔍 Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={resetSettings}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          🔄 Reset to Defaults
        </button>
        
        <button
          onClick={saveSettings}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}
