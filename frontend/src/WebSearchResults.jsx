import React from 'react';
import { useTranslation } from 'react-i18next';

const WebSearchResults = ({ topic, results, onClose, isLoading, answer, isMock }) => {
  const { t } = useTranslation('common');
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '400px',
        height: '100vh',
        background: 'white',
        borderLeft: '2px solid #007bff',
        padding: '20px',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>🔍</div>
          <div>{t('webSearchModule.loadingFor', { topic })}</div>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '400px',
        height: '100vh',
        background: 'white',
        borderLeft: '2px solid #007bff',
        padding: '20px',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>{t('webSearchModule.panelHeading', { topic })}</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {t('webSearchModule.noResults')}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      borderLeft: '2px solid #007bff',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>{t('webSearchModule.panelHeading', { topic })}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>

      {/* AI-synthesized answer grounded in the sources below */}
      {answer && (
        <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <strong style={{ fontSize: '14px', color: '#1f2937' }}>{t('webSearchModule.aiAnswerHeading')}</strong>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>· {t('webSearchModule.groundedNote', { count: results.length })}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{answer}</div>
          {isMock && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>{t('webSearchModule.offlineNote')}</div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
        {t('webSearchModule.sourcesHeading')} · {t('webSearchModule.foundResults', { count: results.length })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map((result, index) => (
          <div key={index} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '15px',
            background: '#fafafa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h4 style={{ margin: '0', fontSize: '16px', flex: 1 }}>
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  {result.title}
                </a>
              </h4>
              {result.similarity_score && (
                <div style={{ 
                  background: '#e8f5e8', 
                  color: '#2d5a2d', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  marginLeft: '10px'
                }}>
                  {(result.similarity_score * 100).toFixed(1)}{t('webSearchModule.match')}
                </div>
              )}
            </div>
            <p style={{ 
              margin: '0 0 10px 0', 
              fontSize: '14px', 
              color: '#555',
              lineHeight: '1.4'
            }}>
              {result.snippet}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#888' }}>
              <div>
                <span style={{ 
                  background: result.source === 'micro_lessons' ? '#e3f2fd' : '#fff3e0', 
                  color: result.source === 'micro_lessons' ? '#1976d2' : '#f57c00',
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  marginRight: '8px'
                }}>
                  {result.source === 'micro_lessons' ? t('webSearchModule.sourceMicroLesson') : t('webSearchModule.sourceVideo')}
                </span>
                {result.rank && (
                  <span style={{ color: '#666' }}>{t('webSearchModule.rankLabel', { rank: result.rank })}</span>
                )}
              </div>
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#007bff' }}
              >
                {result.url}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebSearchResults;
