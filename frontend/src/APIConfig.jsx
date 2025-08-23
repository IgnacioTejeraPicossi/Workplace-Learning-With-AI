import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const APIConfig = () => {
  const { colors } = useTheme();
  const [apiProvider, setApiProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [itemaiUrl, setItemaiUrl] = useState('http://localhost:1234');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load current configuration from localStorage
    const savedProvider = localStorage.getItem('apiProvider') || 'openai';
    const savedOpenaiKey = localStorage.getItem('openaiKey') || '';
    const savedOpenrouterKey = localStorage.getItem('openrouterKey') || '';
    const savedItemaiUrl = localStorage.getItem('itemaiUrl') || 'http://localhost:1234';
    
    setApiProvider(savedProvider);
    setOpenaiKey(savedOpenaiKey);
    setOpenrouterKey(savedOpenrouterKey);
    setItemaiUrl(savedItemaiUrl);
  }, []);

  const handleProviderChange = (provider) => {
    setApiProvider(provider);
    localStorage.setItem('apiProvider', provider);
    setStatus(`Switched to ${provider.toUpperCase()} API`);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleSaveKeys = () => {
    localStorage.setItem('openaiKey', openaiKey);
    localStorage.setItem('openrouterKey', openrouterKey);
    localStorage.setItem('itemaiUrl', itemaiUrl);
    setStatus('API configuration saved successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleTestAPI = async () => {
    setStatus('Testing API connection...');
    try {
      let response;
      
      if (apiProvider === 'itemai') {
        // Test ItemAI API
        response = await fetch('/api/test-itemai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            local_url: itemaiUrl
          })
        });
      } else {
        // Test OpenAI or OpenRouter
        response = await fetch('/api/test-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: apiProvider,
            openaiKey: apiProvider === 'openai' ? openaiKey : '',
            openrouterKey: apiProvider === 'openrouter' ? openrouterKey : ''
          })
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        setStatus(`✅ API test successful: ${result.message}`);
      } else {
        setStatus('❌ API test failed. Check your configuration and try again.');
      }
    } catch (error) {
      setStatus('❌ API test failed. Network error.');
    }
    setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, marginBottom: 8 }}>🔧 API Configuration</h1>
          <p style={{ color: colors.textSecondary, fontSize: '1.1em' }}>
            Configure and switch between OpenAI and OpenRouter APIs
          </p>
        </div>

        {/* API Provider Selection */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: colors.text, marginBottom: 16 }}>Select API Provider</h2>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                         <button
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
               🏠 ItemAI API
             </button>
            
                         <button
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
               🚀 OpenAI API
             </button>
            
                         <button
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
               🌐 OpenRouter API
             </button>
          </div>

          <div style={{
            background: colors.primaryLight,
            padding: '20px',
            borderRadius: 12,
            border: `1px solid ${colors.primary}`
          }}>
            <h3 style={{ color: colors.primary, marginBottom: 12 }}>
              {apiProvider === 'itemai' ? '🏠 ItemAI API' : 
               apiProvider === 'openai' ? '🚀 OpenAI API' : '🌐 OpenRouter API'}
            </h3>
            <p style={{ color: colors.text, lineHeight: 1.6 }}>
              {apiProvider === 'itemai' 
                ? 'Local AI powered by LM Studio - 100% free, 100% private, runs on your own computer with downloaded models.'
                : apiProvider === 'openai' 
                ? 'Direct access to OpenAI models (GPT-3.5, GPT-4, etc.) with full control and reliability.'
                : 'Access to multiple AI providers through OpenRouter, often more cost-effective with access to Claude, Gemini, and other models.'
              }
            </p>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: colors.text, marginBottom: 16 }}>API Configuration</h2>

          {apiProvider === 'itemai' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: colors.text,
                fontWeight: '500'
              }}>
                ItemAI Local URL
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
              <p style={{ 
                color: colors.textSecondary, 
                fontSize: '0.9em', 
                marginTop: 4 
              }}>
                Local URL where LM Studio is running (default: http://localhost:1234)
              </p>
            </div>
          )}

          {apiProvider === 'openai' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: colors.text,
                fontWeight: '500'
              }}>
                OpenAI API Key
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
              <p style={{ 
                color: colors.textSecondary, 
                fontSize: '0.9em', 
                marginTop: 4 
              }}>
                Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>OpenAI Platform</a>
              </p>
            </div>
          )}

          {apiProvider === 'openrouter' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: colors.text,
                fontWeight: '500'
              }}>
                OpenRouter API Key
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
              <p style={{ 
                color: colors.textSecondary, 
                fontSize: '0.9em', 
                marginTop: 4 
              }}>
                Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>OpenRouter</a>
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <button
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
              💾 Save Keys
            </button>
            
            <button
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
              🧪 Test API
            </button>
          </div>
        </div>

        {/* Status Messages */}
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

        {/* Usage Instructions */}
        <div style={{
          background: colors.background,
          padding: '24px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          marginTop: 32
        }}>
          <h3 style={{ color: colors.text, marginBottom: 16 }}>📖 How to Use</h3>
          
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>1. Select API Provider</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              Choose between OpenAI (direct access) or OpenRouter (multiple providers, often cheaper).
            </p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>2. Configure API Keys</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              Enter your API keys for the selected provider. Keys are stored locally in your browser.
            </p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>3. Test Connection</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              Use the "Test API" button to verify your configuration works correctly.
            </p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: colors.primary, marginBottom: 8 }}>4. Intelligent Fallback System</h4>
            <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
              {apiProvider === 'itemai' 
                ? 'If ItemAI API fails, the system automatically falls back to OpenRouter, then OpenAI for maximum reliability.'
                : apiProvider === 'openrouter'
                ? 'If OpenRouter fails, the system automatically falls back to OpenAI for reliability.'
                : 'OpenAI provides direct access with fallback to mock responses if needed.'
              }
            </p>
          </div>
        </div>

        {/* Benefits Comparison */}
        <div style={{
          background: colors.background,
          padding: '24px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          marginTop: 20
        }}>
          <h3 style={{ color: colors.text, marginBottom: 16 }}>⚖️ API Comparison</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 20 
          }}>
            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>🏠 ItemAI API</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li><strong>Pros:</strong> 100% free, 100% private, no rate limits</li>
                <li><strong>Cons:</strong> Requires local setup, model quality varies</li>
                <li><strong>Best for:</strong> Privacy, cost savings, local development</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>🚀 OpenAI</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li><strong>Pros:</strong> Direct access, reliable, latest models</li>
                <li><strong>Cons:</strong> Higher costs, potential rate limits</li>
                <li><strong>Best for:</strong> Production use, reliability</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: colors.primary, marginBottom: 12 }}>🌐 OpenRouter</h4>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px' }}>
                <li><strong>Pros:</strong> Lower costs, multiple providers, Claude/Gemini access</li>
                <li><strong>Cons:</strong> Additional dependency, potential latency</li>
                <li><strong>Best for:</strong> Cost optimization, model variety</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIConfig;
