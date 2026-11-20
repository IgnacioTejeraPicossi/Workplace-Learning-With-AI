// Threat Library Component
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ThreatLibrary() {
  const { t } = useTranslation();
  const [threats, setThreats] = useState([]);
  const [controls, setControls] = useState([]);
  const [topAttacks, setTopAttacks] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreatData();
  }, []);

  const loadThreatData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const [threatsResponse, controlsResponse, attacksResponse] = await Promise.all([
        fetch(`${API_BASE}/api/cyber/threats`),
        fetch(`${API_BASE}/api/cyber/controls`),
        fetch(`${API_BASE}/api/cyber/top-attacks`)
      ]);

      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        setThreats(threatsData);
      }

      if (controlsResponse.ok) {
        const controlsData = await controlsResponse.json();
        setControls(controlsData);
      }

      if (attacksResponse.ok) {
        const attacksData = await attacksResponse.json();
        setTopAttacks(attacksData);
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

  const getThreatName = (threat) =>
    t(`cyber.threatData.${threat.id}.name`, { defaultValue: threat.name });

  const getThreatDescription = (threat) =>
    t(`cyber.threatData.${threat.id}.description`, { defaultValue: threat.description });

  const getControlTitle = (control) => {
    const safeKey = control.id.replace(/[:.]/g, '_');
    return t(`cyber.controlTitles.${safeKey}`, { defaultValue: control.title });
  };

  const getCIAImpactColor = (impact) => {
    if (impact >= 8) return '#dc2626'; // red
    if (impact >= 6) return '#ea580c'; // orange
    if (impact >= 4) return '#d97706'; // amber
    return '#16a34a'; // green
  };

  const getAttackClassMeta = (cls) => {
    switch (cls) {
      case 'social': return { icon: '🎭', color: '#7c3aed', label: t('cyber.topAttacks.class.social', { defaultValue: 'Social' }) };
      case 'malware': return { icon: '🦠', color: '#dc2626', label: t('cyber.topAttacks.class.malware', { defaultValue: 'Malware' }) };
      case 'network': return { icon: '🌐', color: '#2563eb', label: t('cyber.topAttacks.class.network', { defaultValue: 'Network' }) };
      case 'web': return { icon: '🕸️', color: '#ea580c', label: t('cyber.topAttacks.class.web', { defaultValue: 'Web' }) };
      case 'software': return { icon: '🧩', color: '#0891b2', label: t('cyber.topAttacks.class.software', { defaultValue: 'Software' }) };
      default: return { icon: '⚠️', color: '#6b7280', label: cls };
    }
  };

  const getSeverityMeta = (sev) => {
    switch (sev) {
      case 'CRITICAL': return { color: '#fff', bg: '#dc2626' };
      case 'HIGH': return { color: '#fff', bg: '#ea580c' };
      case 'MEDIUM': return { color: '#78350f', bg: '#fde68a' };
      case 'LOW': return { color: '#fff', bg: '#16a34a' };
      default: return { color: '#374151', bg: '#e5e7eb' };
    }
  };

  // Localized attack content: use the no/es i18n override when present, else fall
  // back to the backend English (the source of truth). Attack names are kept
  // as-is (international technical terms).
  const getAttackOneLiner = (atk) =>
    t(`cyber.topAttacks.data.${atk.id}.one_liner`, { defaultValue: atk.one_liner });
  const getAttackFlow = (atk) => {
    const v = t(`cyber.topAttacks.data.${atk.id}.how_it_works`, { returnObjects: true, defaultValue: atk.how_it_works });
    return Array.isArray(v) ? v : (atk.how_it_works || []);
  };
  const getAttackDefenses = (atk) => {
    const v = t(`cyber.topAttacks.data.${atk.id}.defenses`, { returnObjects: true, defaultValue: atk.defenses });
    return Array.isArray(v) ? v : (atk.defenses || []);
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

      {/* Top Cyber Attacks (curated, dated reference) */}
      {topAttacks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                ⚔️ {t('cyber.topAttacks.title', { defaultValue: 'Top Cyber Attacks' })}
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#fff', background: '#111827', borderRadius: '999px', padding: '0.1rem 0.6rem', verticalAlign: 'middle' }}>
                  {topAttacks[0].year}
                </span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0.25rem 0 0' }}>
                {t('cyber.topAttacks.subtitle', { defaultValue: 'How the most common attacks work — and how to defend against them.' })}
              </p>
            </div>
            {topAttacks[0].source?.url && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right', maxWidth: '280px' }}>
                {t('cyber.topAttacks.sourceLabel', { defaultValue: 'Source' })}:{' '}
                <a href={topAttacks[0].source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  {topAttacks[0].source.name}
                </a>
                {topAttacks[0].source.infographic && (
                  <div style={{ marginTop: '0.15rem' }}>
                    {t('cyber.topAttacks.infographicCredit', { defaultValue: 'Infographic by {{name}}', name: topAttacks[0].source.infographic })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {topAttacks.map((atk) => {
              const cm = getAttackClassMeta(atk.attack_class);
              const sm = getSeverityMeta(atk.severity);
              const flow = getAttackFlow(atk);
              const oneLiner = getAttackOneLiner(atk);
              return (
                <div
                  key={atk.id}
                  onClick={() => setSelectedAttack(atk)}
                  style={{
                    backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    border: selectedAttack?.id === atk.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                      {atk.rank}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', margin: 0, flex: 1 }}>{atk.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cm.color, background: cm.color + '1a', border: `1px solid ${cm.color}40`, borderRadius: '999px', padding: '0.1rem 0.5rem' }}>
                      {cm.icon} {cm.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sm.color, background: sm.bg, borderRadius: '999px', padding: '0.1rem 0.5rem' }}>
                      {atk.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.4, margin: '0 0 0.75rem' }}>{oneLiner}</p>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {flow.map((step, i) => (
                      <React.Fragment key={i}>
                        <span title={step} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.1rem 0.4rem' }}>
                          {i + 1}
                        </span>
                        {i < flow.length - 1 && <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>→</span>}
                      </React.Fragment>
                    ))}
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.25rem' }}>
                      {t('cyber.topAttacks.viewFlow', { defaultValue: 'View flow' })} →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                {getThreatName(threat)}
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.4' }}>
              {getThreatDescription(threat)}
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
                {getCategoryIcon(selectedThreat.category)} {getThreatName(selectedThreat)}
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
                {getThreatDescription(selectedThreat)}
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
                      <div style={{ fontWeight: '500', color: '#374151' }}>{getControlTitle(control)}</div>
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

      {/* Top Attack Details Modal */}
      {selectedAttack && (() => {
        const cm = getAttackClassMeta(selectedAttack.attack_class);
        const sm = getSeverityMeta(selectedAttack.severity);
        const flow = getAttackFlow(selectedAttack);
        const defenses = getAttackDefenses(selectedAttack);
        const oneLiner = getAttackOneLiner(selectedAttack);
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', maxWidth: '640px', width: '100%', maxHeight: '85vh', overflowY: 'auto', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#111827', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>{selectedAttack.rank}</span>
                    {selectedAttack.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cm.color, background: cm.color + '1a', border: `1px solid ${cm.color}40`, borderRadius: '999px', padding: '0.15rem 0.6rem' }}>{cm.icon} {cm.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sm.color, background: sm.bg, borderRadius: '999px', padding: '0.15rem 0.6rem' }}>{selectedAttack.severity}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedAttack(null)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
              </div>

              <p style={{ color: '#374151', lineHeight: 1.5, marginBottom: '1.5rem' }}>{oneLiner}</p>

              {/* How it works */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                  {t('cyber.topAttacks.howItWorks', { defaultValue: 'How it works' })}
                </h3>
                {flow.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <span style={{ width: '1.6rem', height: '1.6rem', borderRadius: '50%', background: cm.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.45, paddingTop: '0.1rem' }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* Defenses */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  🛡️ {t('cyber.topAttacks.defenses', { defaultValue: 'Defenses' })}
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {defenses.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>

              {/* CIA impact */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  {t('cyber.threatLibrary.ciaImpactAssessment')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {Object.entries(selectedAttack.cia_impact).map(([key, value]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: getCIAImpactColor(value), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '600', margin: '0 auto 0.5rem' }}>{value}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        {key === 'C' ? t('cyber.threatLibrary.confidentiality') : key === 'I' ? t('cyber.threatLibrary.integrityLabel') : t('cyber.threatLibrary.availability')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related threats cross-link */}
              {selectedAttack.related_threats && selectedAttack.related_threats.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    {t('cyber.topAttacks.relatedThreats', { defaultValue: 'Related threats' })}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedAttack.related_threats.map((tid) => {
                      const th = threats.find(x => x.id === tid);
                      return (
                        <button
                          key={tid}
                          onClick={() => { setSelectedAttack(null); if (th) setSelectedThreat(th); }}
                          style={{ padding: '0.35rem 0.6rem', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, cursor: th ? 'pointer' : 'default' }}
                        >
                          {th ? `${getCategoryIcon(th.category)} ${getThreatName(th)}` : tid}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source + honest-reference note */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', fontSize: '0.72rem', color: '#9ca3af', lineHeight: 1.5 }}>
                {selectedAttack.source?.url && (
                  <span>
                    {t('cyber.topAttacks.sourceLabel', { defaultValue: 'Source' })}:{' '}
                    <a href={selectedAttack.source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>{selectedAttack.source.name}</a>
                    {selectedAttack.source.infographic && ` · ${t('cyber.topAttacks.infographicCredit', { defaultValue: 'Infographic by {{name}}', name: selectedAttack.source.infographic })}`}
                    {'. '}
                  </span>
                )}
                {t('cyber.topAttacks.disclaimer', { defaultValue: 'Educational reference, paraphrased from public knowledge; not reproduced from the original artwork.' })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
