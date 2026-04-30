// Threat Library Component
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ThreatLibrary() {
  const { t } = useTranslation();
  const [threats, setThreats] = useState([]);
  const [controls, setControls] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreatData();
  }, []);

  const loadThreatData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const [threatsResponse, controlsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/cyber/threats`),
        fetch(`${API_BASE}/api/cyber/controls`)
      ]);

      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        setThreats(threatsData);
      }

      if (controlsResponse.ok) {
        const controlsData = await controlsResponse.json();
        setControls(controlsData);
      }
    } catch (error) {
      console.error('Error loading threat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'social_engineering': return '🎭';
      case 'malware': return '🦠';
      case 'vulnerability': return '🔓';
      case 'insider_threat': return '👤';
      case 'supply_chain': return '🔗';
      case 'cloud_misconfig': return '☁️';
      default: return '⚠️';
    }
  };

  const getCIAImpactColor = (impact) => {
    if (impact >= 8) return '#dc2626'; // red
    if (impact >= 6) return '#ea580c'; // orange
    if (impact >= 4) return '#d97706'; // amber
    return '#16a34a'; // green
  };

  const filteredThreats = filterCategory === 'all' 
    ? threats 
    : threats.filter(threat => threat.category === filterCategory);

  const categories = ['all', ...new Set(threats.map(t => t.category))];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>{t('cyber.threatLibrary.loading')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          🛡️ {t('cyber.threatLibrary.title')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          {t('cyber.threatLibrary.subtitle')}
        </p>
      </div>

      {/* CIA Triad Overview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          {t('cyber.threatLibrary.ciaTriadFramework')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
            <h3 style={{ fontWeight: '600', color: '#92400e' }}>{t('cyber.threatLibrary.confidentiality')}</h3>
            <p style={{ fontSize: '0.875rem', color: '#a16207' }}>{t('cyber.threatLibrary.confidentialityDesc')}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontWeight: '600', color: '#1e40af' }}>{t('cyber.threatLibrary.integrityLabel')}</h3>
            <p style={{ fontSize: '0.875rem', color: '#1d4ed8' }}>{t('cyber.threatLibrary.integrityDesc')}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <h3 style={{ fontWeight: '600', color: '#166534' }}>{t('cyber.threatLibrary.availability')}</h3>
            <p style={{ fontSize: '0.875rem', color: '#15803d' }}>{t('cyber.threatLibrary.availabilityDesc')}</p>
          </div>
        </div>
      </div>

      {/* Filter and Threat Grid */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Category Filter */}
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            {t('cyber.threatLibrary.filterByCategory')}
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">{t('cyber.common.allCategories')}</option>
            {categories.slice(1).map(category => (
              <option key={category} value={category}>
                {getCategoryIcon(category)} {category.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Threats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {filteredThreats.map((threat) => (
          <div
            key={threat.id}
            onClick={() => setSelectedThreat(threat)}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              border: selectedThreat?.id === threat.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                {getCategoryIcon(threat.category)}
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {threat.name}
              </h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.4' }}>
              {threat.description}
            </p>

            {/* CIA Impact Indicators */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                {t('cyber.threatLibrary.ciaImpact')}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Object.entries(threat.cia_impact).map(([key, value]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: getCIAImpactColor(value),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                      {key.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {threat.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {threat.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.125rem 0.375rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '0.25rem',
                      fontSize: '0.625rem',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {threat.tags.length > 3 && (
                  <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                    {t('cyber.threatLibrary.moreTag', { count: threat.tags.length - 3 })}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Threat Details Modal */}
      {selectedThreat && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            margin: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {getCategoryIcon(selectedThreat.category)} {selectedThreat.name}
              </h2>
              <button
                onClick={() => setSelectedThreat(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                {t('cyber.common.description')}
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
                {selectedThreat.description}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                {t('cyber.threatLibrary.ciaImpactAssessment')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {Object.entries(selectedThreat.cia_impact).map(([key, value]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: getCIAImpactColor(value),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      margin: '0 auto 0.5rem'
                    }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      {key === 'C' ? t('cyber.threatLibrary.confidentiality') : key === 'I' ? t('cyber.threatLibrary.integrityLabel') : t('cyber.threatLibrary.availability')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                {t('cyber.threatLibrary.recommendedControls')}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedThreat.controls.map((controlId) => {
                  const control = controls.find(c => c.id === controlId);
                  return control ? (
                    <div
                      key={controlId}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <div style={{ fontWeight: '500', color: '#374151' }}>{control.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{control.framework}</div>
                    </div>
                  ) : (
                    <div
                      key={controlId}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      {controlId}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedThreat.tags.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  {t('cyber.threatLibrary.tags')}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {selectedThreat.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
