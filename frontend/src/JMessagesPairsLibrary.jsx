import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';

export default function JMessagesPairsLibrary() {
  const { colors } = useTheme();
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPair, setSelectedPair] = useState(null);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'overlay'
  const [query, setQuery] = useState('');

  const loadPairs = async () => {
    try {
      setLoading(true);
      const resp = await fetchWithAuth('/api/j-messages/list');
      const data = await resp.json();
      if (data.success) {
        // Only show items that have both original and analyzed content
        const pairsData = (data.items || []).filter(item => 
          item.raw_text && item.body_html && item.j_id
        ).map(item => ({
          id: item.id,
          j_id: item.j_id,
          title: item.title,
          status: item.status,
          created_at: item.created_at,
          original: item.raw_text,
          analyzed: item.body_html,
          metadata: {
            valid_from: item.valid_from,
            valid_to: item.valid_to,
            categories: item.categories,
            toc: item.toc,
            summary: item.summary
          }
        }));
        setPairs(pairsData);
      } else {
        setError('Failed to load pairs');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPairs();
  }, []);

  const filtered = pairs.filter((p) => {
    const searchText = `${p.j_id || ''} ${p.title || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const renderSideBySide = (pair) => (
    <div style={{ display: 'flex', gap: 16, height: '600px' }}>
      {/* Original Document */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: colors.primaryLight, 
          padding: 12,
          borderBottom: `1px solid ${colors.border}`,
          fontWeight: 600,
          color: colors.primary
        }}>
          📄 Original Document
        </div>
        <div style={{ 
          flex: 1, 
          padding: 16, 
          overflow: 'auto',
          background: colors.background,
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6
        }}>
          {pair.original}
        </div>
      </div>

      {/* Analyzed Document */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: '#d1fae5', 
          padding: 12,
          borderBottom: `1px solid ${colors.border}`,
          fontWeight: 600,
          color: '#065f46'
        }}>
          ✨ Analyzed Document (AI Generated)
        </div>
        <div style={{ 
          flex: 1, 
          padding: 16, 
          overflow: 'auto',
          background: colors.background
        }}>
          <div dangerouslySetInnerHTML={{ __html: pair.analyzed }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: colors.text, margin: 0, marginBottom: 8 }}>
          📚 J-messages pairs Library
        </h1>
        <p style={{ color: colors.textSecondary, margin: 0, fontSize: 14 }}>
          Compare original documents with AI-analyzed versions side by side. 
          This data will be used to improve future analysis prompts.
        </p>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 16,
          flex: '1 1 200px'
        }}>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Total Pairs
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: colors.primary }}>
            {pairs.length}
          </div>
        </div>
        <div style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 16,
          flex: '1 1 200px'
        }}>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Selected for Review
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#22c55e' }}>
            {selectedPair ? 1 : 0}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by ID, title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: '8px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            background: colors.cardBackground,
            color: colors.text
          }}
        />
        <button
          onClick={loadPairs}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <div style={{ color: colors.textSecondary }}>Loading pairs...</div>}
      {error && <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {/* Pairs List */}
      {!selectedPair ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((pair) => (
            <div
              key={pair.id}
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': { borderColor: colors.primary }
              }}
              onClick={() => setSelectedPair(pair)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: colors.primary, marginBottom: 4 }}>
                    {pair.title}
                  </div>
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>
                    {pair.j_id} • {pair.status} • {new Date(pair.created_at).toLocaleDateString('no-NO')}
                  </div>
                  {pair.metadata.categories && pair.metadata.categories.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {pair.metadata.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: colors.primaryLight,
                            color: colors.primary,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ 
                  color: colors.primary,
                  fontSize: 20
                }}>
                  →
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: 48, 
              color: colors.textSecondary 
            }}>
              {query ? 'No pairs found matching your search' : 'No document pairs available yet'}
            </div>
          )}
        </div>
      ) : (
        /* Pair Comparison View */
        <div>
          {/* Back button and metadata */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setSelectedPair(null)}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                color: colors.text,
                marginBottom: 12
              }}
            >
              ← Back to list
            </button>
            <div style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <h2 style={{ margin: 0, marginBottom: 8, color: colors.primary }}>
                {selectedPair.title}
              </h2>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
                {selectedPair.j_id} • {selectedPair.status}
              </div>
              {selectedPair.metadata.summary && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  background: colors.primaryLight,
                  borderRadius: 6,
                  fontSize: 13,
                  color: colors.text
                }}>
                  <strong>Summary:</strong> {selectedPair.metadata.summary}
                </div>
              )}
            </div>
          </div>

          {/* Side by side comparison */}
          {renderSideBySide(selectedPair)}

          {/* Future improvement notes */}
          <div style={{
            marginTop: 16,
            padding: 16,
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: 8,
            fontSize: 13
          }}>
            <strong>💡 AI Training Note:</strong> This comparison will be used to improve 
            future document analysis. The system will learn from the differences between 
            original and analyzed content to enhance prompt engineering.
          </div>
        </div>
      )}
    </div>
  );
}

