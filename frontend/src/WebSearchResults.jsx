import React from 'react';

const WebSearchResults = ({ topic, results, onClose, isLoading }) => {
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
          <div>Buscando "{topic}"...</div>
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
          <h3>🔍 Resultados para "{topic}"</h3>
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
          No se encontraron resultados
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
        <h3>🔍 Resultados para "{topic}"</h3>
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
      
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Se encontraron {results.length} resultados
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map((result, index) => (
          <div key={index} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '15px',
            background: '#fafafa'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#007bff', textDecoration: 'none' }}
              >
                {result.title}
              </a>
            </h4>
            <p style={{ 
              margin: '0 0 10px 0', 
              fontSize: '14px', 
              color: '#555',
              lineHeight: '1.4'
            }}>
              {result.snippet}
            </p>
            <div style={{ fontSize: '12px', color: '#888' }}>
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
