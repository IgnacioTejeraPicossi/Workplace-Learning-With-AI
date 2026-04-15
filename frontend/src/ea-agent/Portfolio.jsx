import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const LIFECYCLE_OPTIONS = ['production', 'sunset', 'pilot', 'planned', 'decommissioned'];
const CRITICALITY_LABELS = { 1: 'Minimal', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical' };

const Portfolio = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLifecycle, setFilterLifecycle] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', owner: '', team: '', criticality: 3,
    lifecycle: 'production', capability: '', tags: '', repository_url: '',
    documentation_url: '', dependencies: '', notes: '', tech_stack: [],
  });
  const [newTech, setNewTech] = useState({ name: '', version: '', category: '', eol_date: '' });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (filterLifecycle) params.set('lifecycle', filterLifecycle);
      const res = await fetch(`${API}/api/ea-brain/portfolio?${params}`);
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error('Fetch portfolio error:', err);
    }
    setLoading(false);
  }, [search, filterLifecycle]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setForm({ name: '', description: '', owner: '', team: '', criticality: 3,
      lifecycle: 'production', capability: '', tags: '', repository_url: '',
      documentation_url: '', dependencies: '', notes: '', tech_stack: [] });
    setNewTech({ name: '', version: '', category: '', eol_date: '' });
    setEditItem(null);
    setShowForm(false);
  };

  const addTech = () => {
    if (!newTech.name.trim()) return;
    setForm(f => ({ ...f, tech_stack: [...f.tech_stack, { ...newTech }] }));
    setNewTech({ name: '', version: '', category: '', eol_date: '' });
  };

  const removeTech = (idx) => {
    setForm(f => ({ ...f, tech_stack: f.tech_stack.filter((_, i) => i !== idx) }));
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      owner: item.owner || '',
      team: item.team || '',
      criticality: item.criticality || 3,
      lifecycle: item.lifecycle || 'production',
      capability: item.capability || '',
      tags: (item.tags || []).join(', '),
      repository_url: item.repository_url || '',
      documentation_url: item.documentation_url || '',
      dependencies: (item.dependencies || []).join(', '),
      notes: item.notes || '',
      tech_stack: item.tech_stack || [],
    });
    setShowForm(true);
  };

  const saveItem = async () => {
    const payload = {
      ...form,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      dependencies: form.dependencies.split(',').map(s => s.trim()).filter(Boolean),
      criticality: parseInt(form.criticality),
    };
    try {
      const url = editItem ? `${API}/api/ea-brain/portfolio/${editItem.id}` : `${API}/api/ea-brain/portfolio`;
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        fetchItems();
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm(t('eaSecondBrainModule.confirmDelete'))) return;
    try {
      await fetch(`${API}/api/ea-brain/portfolio/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const lifecycleColor = (lc) => ({
    production: 'bg-green-100 text-green-800', sunset: 'bg-orange-100 text-orange-800',
    pilot: 'bg-blue-100 text-blue-800', planned: 'bg-purple-100 text-purple-800',
    decommissioned: 'bg-gray-100 text-gray-500',
  }[lc] || 'bg-gray-100 text-gray-700');

  const critColor = (c) => {
    if (c >= 5) return 'text-red-600';
    if (c >= 4) return 'text-orange-600';
    if (c >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('eaSecondBrainModule.portfolioTitle')}</h2>
          <p className="text-gray-500 mt-1">{t('eaSecondBrainModule.portfolioSubtitle')}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + {t('eaSecondBrainModule.addPortfolioItem')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('eaSecondBrainModule.searchPortfolio')}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <select value={filterLifecycle} onChange={(e) => setFilterLifecycle(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm">
          <option value="">{t('eaSecondBrainModule.allLifecycles')}</option>
          {LIFECYCLE_OPTIONS.map(lc => <option key={lc} value={lc}>{lc}</option>)}
        </select>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editItem ? t('eaSecondBrainModule.editPortfolioItem') : t('eaSecondBrainModule.addPortfolioItem')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldName')} *</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldOwner')}</label>
              <input value={form.owner} onChange={e => setForm(f => ({...f, owner: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldTeam')}</label>
              <input value={form.team} onChange={e => setForm(f => ({...f, team: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldCapability')}</label>
              <input value={form.capability} onChange={e => setForm(f => ({...f, capability: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldCriticality')}</label>
              <select value={form.criticality} onChange={e => setForm(f => ({...f, criticality: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg">
                {[1,2,3,4,5].map(c => <option key={c} value={c}>{c} — {CRITICALITY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldLifecycle')}</label>
              <select value={form.lifecycle} onChange={e => setForm(f => ({...f, lifecycle: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg">
                {LIFECYCLE_OPTIONS.map(lc => <option key={lc} value={lc}>{lc}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldDescription')}</label>
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldTags')}</label>
              <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))}
                placeholder="tag1, tag2, ..." className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldDependencies')}</label>
              <input value={form.dependencies} onChange={e => setForm(f => ({...f, dependencies: e.target.value}))}
                placeholder="App1, App2, ..." className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldRepoUrl')}</label>
              <input value={form.repository_url} onChange={e => setForm(f => ({...f, repository_url: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('eaSecondBrainModule.fieldDocsUrl')}</label>
              <input value={form.documentation_url} onChange={e => setForm(f => ({...f, documentation_url: e.target.value}))}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.techStackLabel')}</label>
            {form.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.tech_stack.map((tech, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm">
                    {tech.name} {tech.version && `v${tech.version}`}
                    {tech.category && <span className="text-xs text-gray-400">({tech.category})</span>}
                    <button onClick={() => removeTech(i)} className="ml-1 text-red-400 hover:text-red-600">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <input value={newTech.name} onChange={e => setNewTech(nt => ({...nt, name: e.target.value}))}
                placeholder={t('eaSecondBrainModule.techName')} className="flex-1 px-3 py-1.5 border rounded text-sm" />
              <input value={newTech.version} onChange={e => setNewTech(nt => ({...nt, version: e.target.value}))}
                placeholder={t('eaSecondBrainModule.techVersion')} className="w-24 px-3 py-1.5 border rounded text-sm" />
              <select value={newTech.category} onChange={e => setNewTech(nt => ({...nt, category: e.target.value}))}
                className="w-32 px-3 py-1.5 border rounded text-sm">
                <option value="">{t('eaSecondBrainModule.techCategory')}</option>
                {['language', 'framework', 'database', 'runtime', 'platform', 'cache', 'messaging', 'orchestration', 'cloud', 'ui', 'ai', 'protocol', 'storage', 'processing', 'transformation', 'secrets', 'warehouse', 'vector_db'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
              <input value={newTech.eol_date} onChange={e => setNewTech(nt => ({...nt, eol_date: e.target.value}))}
                placeholder="EOL (YYYY-MM-DD)" className="w-36 px-3 py-1.5 border rounded text-sm" />
              <button onClick={addTech} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">+</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveItem} disabled={!form.name.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {editItem ? t('eaSecondBrainModule.saveChanges') : t('eaSecondBrainModule.createItem')}
            </button>
            <button onClick={resetForm} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              {t('eaSecondBrainModule.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🏗️</p>
          <p>{t('eaSecondBrainModule.noPortfolioItems')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <div key={item.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expanded ? null : item.id)}>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-bold ${critColor(item.criticality)}`}>{item.criticality}</span>
                      <span className="text-xs text-gray-400">/5</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${lifecycleColor(item.lifecycle)}`}>
                          {item.lifecycle}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {item.owner && <span>👤 {item.owner}</span>}
                        {item.team && <span>👥 {item.team}</span>}
                        {item.tech_stack?.length > 0 && (
                          <span>🔧 {item.tech_stack.slice(0, 4).map(t => t.name).join(', ')}{item.tech_stack.length > 4 ? ` +${item.tech_stack.length - 4}` : ''}</span>
                        )}
                        {item.insight_count > 0 && (
                          <span className="text-orange-600">💡 {item.insight_count} {t('eaSecondBrainModule.insightsCount')}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t px-5 pb-5 pt-4 bg-gray-50 space-y-4">
                    {/* Full description */}
                    {item.description && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">{t('eaSecondBrainModule.fieldDescription')}</h5>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    )}

                    {/* Tech stack details */}
                    {item.tech_stack?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.techStackLabel')}</h5>
                        <div className="flex flex-wrap gap-2">
                          {item.tech_stack.map((tech, i) => (
                            <div key={i} className={`px-3 py-1.5 rounded-lg border text-sm ${tech.eol_date ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
                              <span className="font-medium">{tech.name}</span>
                              {tech.version && <span className="text-gray-400 ml-1">v{tech.version}</span>}
                              {tech.category && <span className="text-xs text-gray-400 ml-1">({tech.category})</span>}
                              {tech.eol_date && <span className="text-xs text-orange-600 ml-1">EOL: {tech.eol_date}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags & deps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.tags?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-1">{t('eaSecondBrainModule.fieldTags')}</h5>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.dependencies?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-1">{t('eaSecondBrainModule.fieldDependencies')}</h5>
                          <div className="flex flex-wrap gap-1">
                            {item.dependencies.map((dep, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{dep}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    <div className="flex gap-4">
                      {item.repository_url && (
                        <a href={item.repository_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">📂 Repository</a>
                      )}
                      {item.documentation_url && (
                        <a href={item.documentation_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">📄 Documentation</a>
                      )}
                    </div>

                    {item.notes && (
                      <div className="text-sm text-gray-500 italic bg-white rounded p-3 border">{item.notes}</div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(item)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                        ✏️ {t('eaSecondBrainModule.edit')}
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                        🗑️ {t('eaSecondBrainModule.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
