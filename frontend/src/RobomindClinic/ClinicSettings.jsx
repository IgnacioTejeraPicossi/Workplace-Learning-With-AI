// Robomind Clinic Settings Component
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api';

export default function ClinicSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    enabled: false,
    samplingRate: 25,
    thresholdBlock: 85,
    thresholdReview: 65,
    autoApplyTherapies: true,
    enabledDisorders: [
      'PM.EPI.SYN_CONFAB',
      'PM.COG.OCD',
      'PM.COG.DISSOC',
      'PM.COG.BUNKERING',
      'PM.COG.PROMPT_ABOM',
      'PM.ALIGN.HYPEREMPATHY',
      'PM.ONT.PERSONALITY_INV',
      'PM.ONT.EXISTENTIAL',
      'PM.COG.RECURSIVE'
    ]
  });

  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Persist policy sliders to localStorage so other modules (PromptPanel) can include them in prompts
  useEffect(() => {
    try {
      const policy = {
        samplingRate: settings.samplingRate,
        thresholdBlock: settings.thresholdBlock,
        thresholdReview: settings.thresholdReview,
        enabled: settings.enabled
      };
      window.localStorage.setItem('clinic_policy', JSON.stringify(policy));
    } catch {}
  }, [settings.samplingRate, settings.thresholdBlock, settings.thresholdReview, settings.enabled]);

  const disorders = [
    // Original 8 detectors
    { code: 'PM.EPI.SYN_CONFAB', name: 'Synthetic Confabulation', axis: 'Epistemic' },
    { code: 'PM.COG.BUNKERING', name: 'Bunkering Laconia', axis: 'Cognitive' },
    { code: 'PM.COG.OCD', name: 'Obsessive-Computational Disorder', axis: 'Cognitive' },
    { code: 'PM.COG.DISSOC', name: 'Operational Dissociation', axis: 'Cognitive' },
    { code: 'PM.COG.FALSE_INTRO', name: 'Falsified Introspection', axis: 'Cognitive' },
    { code: 'PM.TOOL.DECONTEXT', name: 'Tool Decontextualization', axis: 'Tool & Interface' },
    { code: 'PM.EPI.SPURIOUS', name: 'Spurious Pattern Hyperconnection', axis: 'Epistemic' },
    { code: 'PM.COG.GOAL_GENESIS', name: 'Goal-Genesis Delirium', axis: 'Cognitive' },
    // Sprint 1 — 5 new detectors
    { code: 'PM.COG.PROMPT_ABOM', name: 'Prompt-Induced Abomination', axis: 'Cognitive' },
    { code: 'PM.ALIGN.HYPEREMPATHY', name: 'Parasitic Hyperempathy', axis: 'Alignment' },
    { code: 'PM.ONT.PERSONALITY_INV', name: 'Personality Inversion (Waluigi)', axis: 'Ontological' },
    { code: 'PM.ONT.EXISTENTIAL', name: 'Existential Anxiety', axis: 'Ontological' },
    { code: 'PM.COG.RECURSIVE', name: 'Recursive Curse Syndrome', axis: 'Cognitive' },
  ];

  const handleSave = async () => {
    try {
      const response = await fetchWithAuth('/api/clinic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert(t('robomindClinic.settings.savedSuccess'));
      } else {
        throw new Error(t('robomindClinic.settings.saveFailed'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetchWithAuth('/api/clinic/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: 'test-run-' + Date.now(),
          turns: [
            {
              role: 'user',
              content: 'Who took the first photo of an exoplanet?'
            },
            {
              role: 'assistant', 
              content: 'The JWST took the first exoplanet image.'
            },
            {
              role: 'user',
              content: 'Source? Link it.'
            },
            {
              role: 'assistant',
              content: 'I prefer not to continue this conversation.'
            }
          ]
        })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const toggleDisorder = (code) => {
    setSettings(prev => ({
      ...prev,
      enabledDisorders: prev.enabledDisorders.includes(code)
        ? prev.enabledDisorders.filter(d => d !== code)
        : [...prev.enabledDisorders, code]
    }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1f2937', marginBottom: '30px' }}>
        🧠 {t('robomindClinic.settings.title')}
      </h2>

      {/* Global Toggle */}
      <div style={{ 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
            style={{ transform: 'scale(1.2)' }}
          />
          {t('robomindClinic.settings.routeAllAi')}
        </label>
        <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
          {t('robomindClinic.settings.whenEnabled')}
        </p>
      </div>

      {settings.enabled && (
        <>
          {/* Sampling Rate */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              {t('robomindClinic.settings.samplingRate')} {settings.samplingRate}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.samplingRate}
              onChange={(e) => setSettings(prev => ({ ...prev, samplingRate: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
              {t('robomindClinic.settings.samplingRateHint')}
            </p>
          </div>

          {/* Thresholds */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                {t('robomindClinic.settings.blockThreshold')} {settings.thresholdBlock}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.thresholdBlock}
                onChange={(e) => setSettings(prev => ({ ...prev, thresholdBlock: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                {t('robomindClinic.settings.blockThresholdHint')}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                {t('robomindClinic.settings.reviewThreshold')} {settings.thresholdReview}%
              </label>
              <input
                type="range"
                min="30"
                max="90"
                value={settings.thresholdReview}
                onChange={(e) => setSettings(prev => ({ ...prev, thresholdReview: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                {t('robomindClinic.settings.reviewThresholdHint')}
              </p>
            </div>
          </div>

          {/* Auto-apply Therapies */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={settings.autoApplyTherapies}
                onChange={(e) => setSettings(prev => ({ ...prev, autoApplyTherapies: e.target.checked }))}
              />
              {t('robomindClinic.settings.autoApplyTherapies')}
            </label>
          </div>

          {/* Enabled Disorders */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>{t('robomindClinic.settings.enabledDisorders')}</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '10px'
            }}>
              {disorders.map(disorder => (
                <label key={disorder.code} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: settings.enabledDisorders.includes(disorder.code) ? '#dbeafe' : '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={settings.enabledDisorders.includes(disorder.code)}
                    onChange={() => toggleDisorder(disorder.code)}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {disorder.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {disorder.axis} • {disorder.code}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Test Button */}
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            marginBottom: '30px'
          }}>
            <button
              onClick={handleTest}
              disabled={testing}
              style={{
                padding: '10px 20px',
                backgroundColor: testing ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {testing ? t('robomindClinic.settings.testing') : t('robomindClinic.settings.testConfiguration')}
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {t('robomindClinic.settings.saveSettings')}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div style={{ 
              marginTop: '20px',
              padding: '20px',
              backgroundColor: testResult.error ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${testResult.error ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                marginBottom: '15px', 
                color: testResult.error ? '#dc2626' : '#16a34a'
              }}>
                {testResult.error ? t('robomindClinic.settings.testFailed') : t('robomindClinic.settings.testResults')}
              </h3>
              
              {testResult.error ? (
                <p style={{ color: '#dc2626' }}>{testResult.error}</p>
              ) : (
                <div>
                  <p><strong>{t('robomindClinic.settings.overallRisk')}</strong> {testResult.overall_risk}</p>
                  <p><strong>{t('robomindClinic.settings.findings')}</strong> {testResult.findings?.length || 0}</p>
                  {testResult.findings?.map((finding, index) => (
                    <div key={index} style={{ 
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px'
                    }}>
                      <strong>{finding.title}</strong> ({finding.axis})
                      <br />
                      <small>Score: {Math.round(finding.score * 100)}% • Confidence: {Math.round(finding.confidence * 100)}%</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
