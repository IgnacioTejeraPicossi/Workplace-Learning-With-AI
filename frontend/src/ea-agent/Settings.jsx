import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  AttentionSectionHeader,
  accentButtonStyle,
  attentionCardStyle,
  attentionPanelStyle,
} from './sharedUi';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const Settings = () => {
  const { t } = useTranslation();
  const [watchlist, setWatchlist] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [loadingW, setLoadingW] = useState(true);
  const [loadingF, setLoadingF] = useState(true);
  const [newWatch, setNewWatch] = useState({ term: '', category: 'technology', notify_on: ['deprecation', 'security'], notes: '' });
  const [newFeed, setNewFeed] = useState({ name: '', feed_type: 'rss', url: '', poll_interval_minutes: 60, tags: '' });
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    setLoadingW(true);
    try {
      const res = await fetch(`${API}/api/ea-brain/watchlist`);
      if (res.ok) setWatchlist(await res.json());
    } catch (err) { console.error(err); }
    setLoadingW(false);
  }, []);

  const fetchFeeds = useCallback(async () => {
    setLoadingF(true);
    try {
      const res = await fetch(`${API}/api/ea-brain/feeds`);
      if (res.ok) setFeeds(await res.json());
    } catch (err) { console.error(err); }
    setLoadingF(false);
  }, []);

  useEffect(() => { fetchWatchlist(); fetchFeeds(); }, [fetchWatchlist, fetchFeeds]);

  // Watchlist CRUD
  const addWatchItem = async () => {
    if (!newWatch.term.trim()) return;
    try {
      await fetch(`${API}/api/ea-brain/watchlist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWatch),
      });
      setNewWatch({ term: '', category: 'technology', notify_on: ['deprecation', 'security'], notes: '' });
      setShowAddWatch(false);
      fetchWatchlist();
    } catch (err) { console.error(err); }
  };

  const toggleWatchActive = async (item) => {
    try {
      await fetch(`${API}/api/ea-brain/watchlist/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      fetchWatchlist();
    } catch (err) { console.error(err); }
  };

  const deleteWatch = async (id) => {
    try {
      await fetch(`${API}/api/ea-brain/watchlist/${id}`, { method: 'DELETE' });
      fetchWatchlist();
    } catch (err) { console.error(err); }
  };

  // Feed CRUD
  const addFeed = async () => {
    if (!newFeed.name.trim()) return;
    const payload = { ...newFeed, tags: newFeed.tags.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      await fetch(`${API}/api/ea-brain/feeds`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setNewFeed({ name: '', feed_type: 'rss', url: '', poll_interval_minutes: 60, tags: '' });
      setShowAddFeed(false);
      fetchFeeds();
    } catch (err) { console.error(err); }
  };

  const toggleFeedActive = async (feed) => {
    try {
      await fetch(`${API}/api/ea-brain/feeds/${feed.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !feed.active }),
      });
      fetchFeeds();
    } catch (err) { console.error(err); }
  };

  const deleteFeed = async (id) => {
    try {
      await fetch(`${API}/api/ea-brain/feeds/${id}`, { method: 'DELETE' });
      fetchFeeds();
    } catch (err) { console.error(err); }
  };

  // Integration status check
  const integrations = [
    { name: 'Jira', env: 'REACT_APP_JIRA_BASE_URL', icon: '📋' },
    { name: 'Slack', env: 'REACT_APP_SLACK_BOT_TOKEN', icon: '💬' },
    { name: 'Confluence', env: 'REACT_APP_CONFLUENCE_BASE', icon: '📖' },
    { name: 'Google Sheets', env: 'REACT_APP_GOOGLE_SA_JSON', icon: '📊' },
  ];

  const categoryColor = (c) => ({
    technology: 'bg-blue-100 text-blue-700', vendor: 'bg-purple-100 text-purple-700',
    security: 'bg-red-100 text-red-700', compliance: 'bg-green-100 text-green-700',
  }[c] || 'bg-gray-100 text-gray-700');

  const feedTypeIcon = (ft) => ({
    rss: '📡', api: '🔌', confluence: '📖', jira: '📋', github: '🐙', cve: '🔒', manual: '✏️',
  }[ft] || '📄');

  return (
    <AttentionPage>
      <AttentionHero
        icon="⚙️"
        title={t('eaSecondBrainModule.settingsTitle')}
        subtitle={t('eaSecondBrainModule.settingsSubtitle')}
      />

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="🔌" title={t('eaSecondBrainModule.integrationStatus')} />
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {integrations.map((int, i) => {
            const configured = !!process.env[int.env];
            return (
              <div key={i} className={`p-4 rounded-lg border text-center ${configured ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-2xl">{int.icon}</span>
                <p className="font-medium text-sm mt-1">{int.name}</p>
                <p className={`text-xs mt-1 ${configured ? 'text-green-600' : 'text-gray-400'}`}>
                  {configured ? t('eaSecondBrainModule.configured') : t('eaSecondBrainModule.notConfigured')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={attentionPanelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>👁️</span>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>{t('eaSecondBrainModule.watchlistTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddWatch(!showAddWatch)}
            style={{ ...accentButtonStyle('blue'), fontSize: '13px', padding: '8px 14px' }}
          >
            + {t('eaSecondBrainModule.addWatchItem')}
          </button>
        </div>

        {showAddWatch && (
          <div className="px-6 py-4 bg-blue-50 border-b space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={newWatch.term} onChange={e => setNewWatch(w => ({...w, term: e.target.value}))}
                placeholder={t('eaSecondBrainModule.watchTermPlaceholder')} className="px-3 py-2 border rounded-lg" />
              <select value={newWatch.category} onChange={e => setNewWatch(w => ({...w, category: e.target.value}))}
                className="px-3 py-2 border rounded-lg">
                {['technology', 'vendor', 'security', 'compliance'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={newWatch.notes} onChange={e => setNewWatch(w => ({...w, notes: e.target.value}))}
                placeholder={t('eaSecondBrainModule.watchNotesPlaceholder')} className="px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button onClick={addWatchItem} disabled={!newWatch.term.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {t('eaSecondBrainModule.add')}
              </button>
              <button onClick={() => setShowAddWatch(false)}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                {t('eaSecondBrainModule.cancel')}
              </button>
            </div>
          </div>
        )}

        <div className="p-4 space-y-2">
          {loadingW ? (
            <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
          ) : watchlist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('eaSecondBrainModule.noWatchItems')}</p>
          ) : (
            watchlist.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-white transition-colors">
                <button onClick={() => toggleWatchActive(item)} className="text-lg">
                  {item.active ? '✅' : '⬜'}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{item.term}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${categoryColor(item.category)}`}>{item.category}</span>
                  </div>
                  {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                  {item.notify_on?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.notify_on.map((n, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteWatch(item.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={attentionPanelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📡</span>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>{t('eaSecondBrainModule.sourceFeedsTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddFeed(!showAddFeed)}
            style={{ ...accentButtonStyle('blue'), fontSize: '13px', padding: '8px 14px' }}
          >
            + {t('eaSecondBrainModule.addFeed')}
          </button>
        </div>

        {showAddFeed && (
          <div className="px-6 py-4 bg-blue-50 border-b space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input value={newFeed.name} onChange={e => setNewFeed(f => ({...f, name: e.target.value}))}
                placeholder={t('eaSecondBrainModule.feedNamePlaceholder')} className="px-3 py-2 border rounded-lg" />
              <select value={newFeed.feed_type} onChange={e => setNewFeed(f => ({...f, feed_type: e.target.value}))}
                className="px-3 py-2 border rounded-lg">
                {['rss', 'api', 'confluence', 'jira', 'github', 'cve', 'manual'].map(ft => <option key={ft} value={ft}>{ft}</option>)}
              </select>
              <input value={newFeed.url} onChange={e => setNewFeed(f => ({...f, url: e.target.value}))}
                placeholder="URL" className="px-3 py-2 border rounded-lg" />
              <input value={newFeed.tags} onChange={e => setNewFeed(f => ({...f, tags: e.target.value}))}
                placeholder="tag1, tag2" className="px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button onClick={addFeed} disabled={!newFeed.name.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {t('eaSecondBrainModule.add')}
              </button>
              <button onClick={() => setShowAddFeed(false)}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                {t('eaSecondBrainModule.cancel')}
              </button>
            </div>
          </div>
        )}

        <div className="p-4 space-y-2">
          {loadingF ? (
            <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
          ) : feeds.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('eaSecondBrainModule.noFeeds')}</p>
          ) : (
            feeds.map((feed) => (
              <div key={feed.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-white transition-colors">
                <button onClick={() => toggleFeedActive(feed)} className="text-lg">
                  {feed.active ? '✅' : '⬜'}
                </button>
                <span className="text-xl">{feedTypeIcon(feed.feed_type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{feed.name}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{feed.feed_type}</span>
                    {feed.status && feed.status !== 'idle' && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">{feed.status}</span>
                    )}
                  </div>
                  {feed.url && <p className="text-xs text-gray-400 mt-0.5 truncate">{feed.url}</p>}
                  {feed.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {feed.tags.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">{feed.poll_interval_minutes}m</span>
                <button onClick={() => deleteFeed(feed.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="📋" title={t('eaSecondBrainModule.policiesTitle')} />
        <div className="p-6 space-y-4">
          {[
            { label: t('eaSecondBrainModule.policyJiraProjects'), desc: t('eaSecondBrainModule.policyJiraProjectsDesc'), value: 'EA, ARCH' },
            { label: t('eaSecondBrainModule.policySlackChannels'), desc: t('eaSecondBrainModule.policySlackChannelsDesc'), value: '#ea-updates, #engineering, #cto-brief' },
            { label: t('eaSecondBrainModule.policyAutoMode'), desc: t('eaSecondBrainModule.policyAutoModeDesc'), value: t('eaSecondBrainModule.policyValueLowRisk') },
          ].map((policy, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800">{policy.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{policy.desc}</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm font-mono">{policy.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="🔐" title={t('eaSecondBrainModule.envVarsTitle')} />
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-3">{t('eaSecondBrainModule.envVarsIntro')}<code className="bg-gray-100 px-1 rounded">{t('eaSecondBrainModule.envFile')}</code>{t('eaSecondBrainModule.envFileSuffix')}</p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`HMAC_SECRET=your-secret-key
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-token
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_DEFAULT_CHANNEL=#ea-updates
CONFLUENCE_BASE=https://your-wiki.atlassian.net
CONFLUENCE_AUTH=base64-user:token
GOOGLE_SA_JSON=path/to/service-account.json
SHEETS_SPREADSHEET_ID=your-sheet-id`}
          </pre>
        </div>
      </div>

      <div style={{ ...attentionCardStyle, background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)', border: '1px solid #bfdbfe' }}>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('eaSecondBrainModule.needHelpTitle')}</h3>
        <p className="text-sm text-blue-700">
          {t('eaSecondBrainModule.needHelpBody')}
          <a href="#" className="underline">{t('eaSecondBrainModule.needHelpLink')}</a>
        </p>
      </div>
    </AttentionPage>
  );
};

export default Settings;
