import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { getTypeIcon, getTypeColor, isDemoResource } from './resourceHelpers';

/**
 * Babel Library — "Advanced Search" tab (extracted from BabelLibrary.jsx, Fase 3).
 * Its filter state (query/type/topic/author/sort) is used only here, so it is
 * owned locally. The parent passes the aggregated `allResources`, the `topics`
 * list and the two label helpers (which depend on i18n + known author keys).
 */
export default function AdvancedSearchTab({ allResources, topics, typeLabel, authorLabel }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [advSearchQuery, setAdvSearchQuery] = useState('');
  const [advSearchType, setAdvSearchType] = useState('all');
  const [advSearchTopic, setAdvSearchTopic] = useState('all');
  const [advSearchAuthor, setAdvSearchAuthor] = useState('all');
  const [advSortBy, setAdvSortBy] = useState('newest');
  const [advSearchExecuted, setAdvSearchExecuted] = useState(false);

  // Compute unique authors from allResources
  const uniqueAuthors = ['all', ...Array.from(new Set(allResources.map(r => r.author)))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return a.localeCompare(b);
  });

  // Advanced search filtering
  const advResults = allResources.filter(resource => {
    const q = advSearchQuery.toLowerCase();
    const matchesQuery = !q ||
      resource.title.toLowerCase().includes(q) ||
      resource.author.toLowerCase().includes(q) ||
      resource.description.toLowerCase().includes(q) ||
      (resource.topic && resource.topic.toLowerCase().includes(q));
    const matchesType = advSearchType === 'all' || resource.type === advSearchType;
    const matchesTopic = advSearchTopic === 'all' || resource.topic === advSearchTopic;
    const matchesAuthor = advSearchAuthor === 'all' || resource.author === advSearchAuthor;
    return matchesQuery && matchesType && matchesTopic && matchesAuthor;
  });

  // Sort
  const sortedResults = [...advResults].sort((a, b) => {
    switch (advSortBy) {
      case 'newest':
        return (b.addedDate || '').localeCompare(a.addedDate || '');
      case 'oldest':
        return (a.addedDate || '').localeCompare(b.addedDate || '');
      case 'alpha':
        return a.title.localeCompare(b.title);
      case 'alpha-desc':
        return b.title.localeCompare(a.title);
      case 'author':
        return a.author.localeCompare(b.author);
      default:
        return 0;
    }
  });

  const handleAdvSearch = () => setAdvSearchExecuted(true);
  const handleAdvClear = () => {
    setAdvSearchQuery('');
    setAdvSearchType('all');
    setAdvSearchTopic('all');
    setAdvSearchAuthor('all');
    setAdvSortBy('newest');
    setAdvSearchExecuted(false);
  };

  const selectStyle = {
    padding: '10px 14px',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: '0.9em',
    background: colors.background,
    color: colors.text,
    minWidth: 160,
    flex: 1
  };

  return (
    <div>
      <h2 style={{ color: colors.text, marginBottom: 20 }}>{t('babelLibraryModule.advancedSearch.title')}</h2>

      {/* Search Features Info (collapsible) */}
      <details style={{
        background: colors.primaryLight,
        padding: '16px 20px',
        borderRadius: 10,
        border: `1px solid ${colors.primary}`,
        marginBottom: 20,
        cursor: 'pointer'
      }}>
        <summary style={{ color: colors.primary, fontWeight: 'bold', fontSize: '1em' }}>
          {t('babelLibraryModule.advancedSearch.featuresTitle')}
        </summary>
        <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px', marginTop: 12 }}>
          <li>{t('babelLibraryModule.advancedSearch.li1')}</li>
          <li>{t('babelLibraryModule.advancedSearch.li2')}</li>
          <li>{t('babelLibraryModule.advancedSearch.li3')}</li>
          <li>{t('babelLibraryModule.advancedSearch.li4')}</li>
          <li>{t('babelLibraryModule.advancedSearch.li5')}</li>
        </ul>
      </details>

      {/* Search Form */}
      <div style={{
        background: colors.background,
        padding: '24px',
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        marginBottom: 20
      }}>
        {/* Full-text search input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: '0.9em', color: colors.text }}>
            🔍 {t('babelLibraryModule.advancedSearch.queryLabel')}
          </label>
          <input
            type="text"
            value={advSearchQuery}
            onChange={(e) => { setAdvSearchQuery(e.target.value); setAdvSearchExecuted(true); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdvSearch()}
            placeholder={t('babelLibraryModule.advancedSearch.queryPlaceholder')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: '1em',
              background: colors.sidebarBackground || colors.background,
              color: colors.text,
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
              📁 {t('babelLibraryModule.advancedSearch.filterType')}
            </label>
            <select value={advSearchType} onChange={(e) => { setAdvSearchType(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
              <option value="all">{t('babelLibraryModule.catalog.allTypes')}</option>
              {['book', 'video', 'article', 'course', 'simulation', 'analysis'].map(type => (
                <option key={type} value={type}>{getTypeIcon(type)} {typeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
              🏷️ {t('babelLibraryModule.advancedSearch.filterTopic')}
            </label>
            <select value={advSearchTopic} onChange={(e) => { setAdvSearchTopic(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic === 'all' ? t('babelLibraryModule.catalog.allTopics') : topic}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
              👤 {t('babelLibraryModule.advancedSearch.filterAuthor')}
            </label>
            <select value={advSearchAuthor} onChange={(e) => { setAdvSearchAuthor(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
              {uniqueAuthors.map(author => (
                <option key={author} value={author}>
                  {author === 'all' ? t('babelLibraryModule.advancedSearch.allAuthors') : authorLabel(author)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
              📊 {t('babelLibraryModule.advancedSearch.sortLabel')}
            </label>
            <select value={advSortBy} onChange={(e) => { setAdvSortBy(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
              <option value="newest">{t('babelLibraryModule.advancedSearch.sortNewest')}</option>
              <option value="oldest">{t('babelLibraryModule.advancedSearch.sortOldest')}</option>
              <option value="alpha">{t('babelLibraryModule.advancedSearch.sortAlpha')}</option>
              <option value="alpha-desc">{t('babelLibraryModule.advancedSearch.sortAlphaDesc')}</option>
              <option value="author">{t('babelLibraryModule.advancedSearch.sortAuthor')}</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleAdvSearch}
            style={{
              padding: '10px 24px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.95em'
            }}
          >
            🔍 {t('babelLibraryModule.advancedSearch.searchBtn')}
          </button>
          <button
            onClick={handleAdvClear}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.95em'
            }}
          >
            ✕ {t('babelLibraryModule.advancedSearch.clearBtn')}
          </button>
          {advSearchExecuted && (
            <span style={{ color: colors.textSecondary, fontSize: '0.9em' }}>
              {t('babelLibraryModule.advancedSearch.resultCount', { count: sortedResults.length, total: allResources.length })}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {advSearchExecuted && (
        <div>
          {/* Active filters summary */}
          {(advSearchQuery || advSearchType !== 'all' || advSearchTopic !== 'all' || advSearchAuthor !== 'all') && (
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <span style={{ color: colors.textSecondary, fontSize: '0.9em' }}>{t('babelLibraryModule.catalog.activeFilters')}</span>
              {advSearchQuery && (
                <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                  🔍 "{advSearchQuery}"
                </span>
              )}
              {advSearchType !== 'all' && (
                <span style={{ background: getTypeColor(advSearchType), color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                  {getTypeIcon(advSearchType)} {typeLabel(advSearchType)}
                </span>
              )}
              {advSearchTopic !== 'all' && (
                <span style={{ background: colors.primaryLight, color: colors.primary, padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                  🏷️ {advSearchTopic}
                </span>
              )}
              {advSearchAuthor !== 'all' && (
                <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                  👤 {authorLabel(advSearchAuthor)}
                </span>
              )}
            </div>
          )}

          {sortedResults.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: colors.textSecondary
            }}>
              <div style={{ fontSize: '3em', marginBottom: 12 }}>📭</div>
              <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('babelLibraryModule.catalog.emptyTitle')}</p>
              <p>{t('babelLibraryModule.catalog.emptyHint')}</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 16
            }}>
              {sortedResults.map((resource, index) => {
                // Highlight matching text
                const highlightMatch = (text) => {
                  if (!advSearchQuery || !text) return text;
                  const q = advSearchQuery.toLowerCase();
                  const idx = text.toLowerCase().indexOf(q);
                  if (idx === -1) return text;
                  return (
                    <span>
                      {text.slice(0, idx)}
                      <mark style={{ background: '#fff176', padding: '0 2px', borderRadius: 2 }}>
                        {text.slice(idx, idx + advSearchQuery.length)}
                      </mark>
                      {text.slice(idx + advSearchQuery.length)}
                    </span>
                  );
                };

                return (
                  <div key={`adv-${resource.id || index}`} style={{
                    background: colors.background,
                    padding: 20,
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '1em', color: colors.text, flex: 1 }}>
                        {highlightMatch(resource.title)}
                      </h3>
                      <span style={{
                        background: getTypeColor(resource.type),
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: '0.75em',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        marginLeft: 8
                      }}>
                        {getTypeIcon(resource.type)} {typeLabel(resource.type)}
                      </span>
                    </div>
                    {isDemoResource(resource) && (
                      <span style={{
                        display: 'inline-block', alignSelf: 'flex-start',
                        background: '#9ca3af', color: 'white', padding: '2px 8px',
                        borderRadius: '10px', fontSize: '0.72em', fontWeight: 'bold'
                      }}>
                        {t('babelLibraryModule.sampleBadge')}
                      </span>
                    )}
                    <div style={{ fontSize: '0.85em', color: colors.textSecondary }}>
                      👤 {highlightMatch(authorLabel(resource.author))}
                    </div>
                    <div style={{ fontSize: '0.85em', color: colors.textSecondary }}>
                      🏷️ {highlightMatch(resource.topic)}
                    </div>
                    <p style={{ fontSize: '0.9em', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                      {highlightMatch(resource.description)}
                    </p>
                    {resource.addedDate && (
                      <div style={{ fontSize: '0.8em', color: colors.textSecondary, marginTop: 'auto' }}>
                        📅 {t('babelLibraryModule.catalog.addedPrefix', { date: resource.addedDate })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
