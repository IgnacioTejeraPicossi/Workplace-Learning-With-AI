import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './EAHome.css';
import ProcessDesigner from './ProcessDesigner';
import HeatmapView from './HeatmapView';
import ImpactAnalysis from './ImpactAnalysis';
import CatalogManager from './CatalogManager';
import AIRiskAnalysis from './AIRiskAnalysis';
import { createEaCatalogTranslators } from './eaCatalogI18n';

export default function EAHome() {
  const { t } = useTranslation();
  const {
    tAppName, tAppDesc, tProcessName, tProcessDesc,
    tCapName, tCapDesc, tDataClass, tVendor, tOwner,
  } = createEaCatalogTranslators(t);
  const [activeTab, setActiveTab] = useState('overview');
  const [catalogOverview, setCatalogOverview] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Edit capability modal state
  const [showEditCapabilityModal, setShowEditCapabilityModal] = useState(false);
  const [editingCapability, setEditingCapability] = useState(null);
  const [editCapabilityFormData, setEditCapabilityFormData] = useState({});

  // Edit process state
  const [editingProcess, setEditingProcess] = useState(null);

  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadCatalogOverview(),
        loadProcesses(),
        loadApplications(),
        loadCapabilities()
      ]);
    };
    loadAllData();
  }, []);

  // Update catalog overview whenever data arrays change
  useEffect(() => {
    if (processes.length > 0 || applications.length > 0 || capabilities.length > 0) {
      updateCatalogOverview();
    }
  }, [processes, applications, capabilities]);

  const loadCatalogOverview = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ea/catalog/overview');
      if (response.data.success) {
        setCatalogOverview(response.data.overview);
      }
    } catch (err) {
      console.error('Error loading catalog overview:', err);
      // Provide fallback data instead of showing error
      setCatalogOverview({
        total_capabilities: 0,
        total_applications: 0,
        total_processes: 0,
        lifecycle_distribution: [],
        risk_distribution: []
      });
      // Don't show error message to user
      // setError('Failed to load catalog overview');
    } finally {
      setLoading(false);
    }
  };

  // Update catalog overview with real data counts
  const updateCatalogOverview = () => {
    const overview = {
      total_capabilities: capabilities.length,
      total_applications: applications.length,
      total_processes: processes.length,
      lifecycle_distribution: [],
      risk_distribution: []
    };
    console.log('Updating catalog overview:', overview);
    console.log('Current state:', { processes: processes.length, applications: applications.length, capabilities: capabilities.length });
    setCatalogOverview(overview);
  };

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ea/processes');
      console.log('Processes loaded:', response.data);
      setProcesses(response.data);
    } catch (err) {
      console.error('Error loading processes:', err);
      setError(t('enterpriseArchitectureModule.errorLoadProcesses'));
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ea/applications');
      console.log('Applications loaded:', response.data);
      setApplications(response.data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(t('enterpriseArchitectureModule.errorLoadApplications'));
    } finally {
      setLoading(false);
    }
  };

  const loadCapabilities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ea/capabilities');
      console.log('Capabilities loaded:', response.data);
      setCapabilities(response.data);
    } catch (err) {
      console.error('Error loading capabilities:', err);
      setError(t('enterpriseArchitectureModule.errorLoadCapabilities'));
    } finally {
      setLoading(false);
    }
  };

  // Handle process deletion
  const handleDeleteProcess = async (processId) => {
    if (!window.confirm(t('enterpriseArchitectureModule.confirmDeleteProcess'))) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/ea/processes/${processId}`);
      
      // Update local state
      setProcesses(processes.filter(proc => proc._id !== processId));
      
      setSuccess(t('enterpriseArchitectureModule.successProcessDeleted'));
      
      // Update catalog overview
      updateCatalogOverview();
    } catch (err) {
      console.error('Error deleting process:', err);
      setError(t('enterpriseArchitectureModule.errorDeleteProcess'));
    } finally {
      setLoading(false);
    }
  };

  // Handle process editing
  const handleEditProcess = (process) => {
    setEditingProcess(process);
    setActiveTab('process-designer');
  };

  // Handle application editing
  const handleEditApplication = (application) => {
    setEditingApplication(application);
    setEditFormData({
      name: application.name,
      description: application.description,
      category: application.category || '',
      risk: application.risk || 0,
      maturity: application.maturity || 1,
      vendor: application.vendor || '',
      lifecycle: application.lifecycle || 'Development',
      status: application.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleUpdateApplication = async () => {
    try {
      setLoading(true);
      
      const response = await axios.put(`/api/ea/applications/${editingApplication._id}`, editFormData);
      
      if (response.data.success) {
        // Update local state
        setApplications(applications.map(app => 
          app._id === editingApplication._id 
            ? { ...app, ...editFormData }
            : app
        ));
        
        setSuccess(t('enterpriseArchitectureModule.successAppUpdated'));
        setShowEditModal(false);
        setEditingApplication(null);
        setEditFormData({});
        
        // Update catalog overview
        updateCatalogOverview();
      }
    } catch (err) {
      console.error('Error updating application:', err);
      setError(t('enterpriseArchitectureModule.errorUpdateApp'));
    } finally {
      setLoading(false);
    }
  };

  // Handle capability editing
  const handleEditCapability = (capability) => {
    setEditingCapability(capability);
    setEditCapabilityFormData({
      name: capability.name,
      description: capability.description,
      level: capability.level || 'Strategic',
      owner: capability.owner || [],
      tags: capability.tags || [],
      strategic_importance: capability.strategic_importance || 'High',
      maturity: capability.maturity || 1,
      risk: capability.risk || 'Low'
    });
    setShowEditCapabilityModal(true);
  };

  const handleUpdateCapability = async () => {
    try {
      setLoading(true);
      
      const response = await axios.put(`/api/ea/capabilities/${editingCapability._id}`, editCapabilityFormData);
      
      if (response.data.success) {
        // Update local state
        setCapabilities(capabilities.map(cap => 
          cap._id === editingCapability._id 
            ? { ...cap, ...editCapabilityFormData }
            : cap
        ));
        
        setSuccess(t('enterpriseArchitectureModule.successCapabilityUpdated'));
        setShowEditCapabilityModal(false);
        setEditingCapability(null);
        setEditCapabilityFormData({});
        
        // Update catalog overview
        updateCatalogOverview();
      }
    } catch (err) {
      console.error('Error updating capability:', err);
      setError(t('enterpriseArchitectureModule.errorUpdateCapability'));
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const tStatus = (s) => {
    if (!s) return s;
    const map = {
      draft:       t('enterpriseArchitectureModule.statusDraft'),
      approved:    t('enterpriseArchitectureModule.statusApproved'),
      deprecated:  t('enterpriseArchitectureModule.statusDeprecated'),
      active:      t('enterpriseArchitectureModule.statusActive'),
      inactive:    t('enterpriseArchitectureModule.statusInactive'),
      review:      t('enterpriseArchitectureModule.statusReview'),
      pilot:       t('enterpriseArchitectureModule.statusPilot'),
      sunset:      t('enterpriseArchitectureModule.statusSunset'),
    };
    return map[s.toLowerCase()] || s;
  };

  const tLifecycle = (l) => {
    if (!l) return l;
    const map = {
      development: t('enterpriseArchitectureModule.lifecycleDevelopment'),
      dev:         t('enterpriseArchitectureModule.lifecycleDevelopment'),
      production:  t('enterpriseArchitectureModule.lifecycleProduction'),
      prod:        t('enterpriseArchitectureModule.lifecycleProduction'),
      maintenance: t('enterpriseArchitectureModule.lifecycleMaintenance'),
      maint:       t('enterpriseArchitectureModule.lifecycleMaintenance'),
      retirement:  t('enterpriseArchitectureModule.lifecycleRetirement'),
      retired:     t('enterpriseArchitectureModule.lifecycleRetirement'),
      ret:         t('enterpriseArchitectureModule.lifecycleRetirement'),
      pilot:       t('enterpriseArchitectureModule.statusPilot'),
      sunset:      t('enterpriseArchitectureModule.statusSunset'),
    };
    return map[l.toLowerCase()] || l;
  };

  const tLevel = (lv) => {
    if (!lv) return lv;
    const map = {
      strategic:  t('enterpriseArchitectureModule.levelStrategic'),
      core:       t('enterpriseArchitectureModule.levelCore'),
      supporting: t('enterpriseArchitectureModule.levelSupporting'),
      enabling:   t('enterpriseArchitectureModule.levelEnabling'),
    };
    return map[lv.toLowerCase()] || lv;
  };

  const renderOverview = () => (
    <div className="ea-overview">
      <div className="ea-stats-grid">
        <div className="ea-stat-card">
          <div className="ea-stat-icon">🏗️</div>
          <div className="ea-stat-value">{catalogOverview?.total_capabilities || 0}</div>
          <div className="ea-stat-label">{t('enterpriseArchitectureModule.statBusinessCapabilities')}</div>
        </div>
        
        <div className="ea-stat-card">
          <div className="ea-stat-icon">💻</div>
          <div className="ea-stat-value">{catalogOverview?.total_applications || 0}</div>
          <div className="ea-stat-label">{t('enterpriseArchitectureModule.statApplications')}</div>
        </div>
        
        <div className="ea-stat-card">
          <div className="ea-stat-icon">🔄</div>
          <div className="ea-stat-value">{catalogOverview?.total_processes || 0}</div>
          <div className="ea-stat-label">{t('enterpriseArchitectureModule.statProcesses')}</div>
        </div>
        
        <div className="ea-stat-card">
          <div className="ea-stat-icon">📊</div>
          <div className="ea-stat-value">
            {catalogOverview?.risk_distribution?.find(r => r._id === 'High')?.count || 0}
          </div>
          <div className="ea-stat-label">{t('enterpriseArchitectureModule.statHighRisk')}</div>
        </div>
      </div>

      <div className="ea-quick-actions">
        <h3>🚀 {t('enterpriseArchitectureModule.quickActions')}</h3>
        <div className="ea-action-buttons">
          <button 
            className="ea-action-btn primary"
            onClick={() => setActiveTab('processes')}
          >
            📝 {t('enterpriseArchitectureModule.btnCreateProcess')}
          </button>
          <button 
            className="ea-action-btn secondary"
            onClick={() => setActiveTab('applications')}
          >
            💻 {t('enterpriseArchitectureModule.btnAddApplication')}
          </button>
          <button 
            className="ea-action-btn secondary"
            onClick={() => setActiveTab('capabilities')}
          >
            🏗️ {t('enterpriseArchitectureModule.btnDefineCapability')}
          </button>
          <button 
            className="ea-action-btn backend"
            onClick={initializeBackendDemoData}
          >
            🚀 {t('enterpriseArchitectureModule.btnInitDemoData')}
          </button>
        </div>
      </div>

      <div className="ea-recent-items">
        <h3>📋 {t('enterpriseArchitectureModule.recentItems')}</h3>
        <div className="ea-recent-grid">
          <div className="ea-recent-section">
            <h4>{t('enterpriseArchitectureModule.recentProcesses')}</h4>
            {processes.slice(0, 3).map(process => (
              <div key={process._id} className="ea-recent-item">
                <span className="ea-item-name">{tProcessName(process.name)}</span>
                <span className={`ea-status-badge ${process.status}`}>
                  {tStatus(process.status)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="ea-recent-section">
            <h4>{t('enterpriseArchitectureModule.recentApplications')}</h4>
            {applications.slice(0, 3).map(app => (
              <div key={app._id} className="ea-recent-item">
                <span className="ea-item-name">{tAppName(app.name)}</span>
                <span className={`ea-lifecycle-badge ${app.lifecycle}`}>
                  {tLifecycle(app.lifecycle)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcesses = () => (
    <div className="ea-processes">
      <div className="ea-section-header">
        <h2>🔄 {t('enterpriseArchitectureModule.processManagement')}</h2>
        <button className="ea-create-btn" onClick={() => setActiveTab('process-designer')}>
          ➕ {t('enterpriseArchitectureModule.btnCreateNewProcess')}
        </button>
      </div>
      
      <div className="ea-filters">
        <select onChange={(e) => setActiveTab('processes')}>
          <option value="">{t('enterpriseArchitectureModule.filterAllStatuses')}</option>
          <option value="draft">{t('enterpriseArchitectureModule.filterDraft')}</option>
          <option value="approved">{t('enterpriseArchitectureModule.filterApproved')}</option>
          <option value="deprecated">{t('enterpriseArchitectureModule.filterDeprecated')}</option>
        </select>
        
        <select onChange={(e) => setActiveTab('processes')}>
          <option value="">{t('enterpriseArchitectureModule.filterAllCategories')}</option>
          <option value="General">{t('enterpriseArchitectureModule.filterGeneral')}</option>
          <option value="Finance">{t('enterpriseArchitectureModule.filterFinance')}</option>
          <option value="HR">{t('enterpriseArchitectureModule.filterHR')}</option>
          <option value="IT">{t('enterpriseArchitectureModule.filterIT')}</option>
        </select>
      </div>

      <div className="ea-processes-grid">
        {processes.map(process => (
          <div key={process._id} className="ea-process-card">
            <div className="ea-process-header">
              <h3>{tProcessName(process.name)}</h3>
              <span className={`ea-status-badge ${process.status}`}>
                {tStatus(process.status)}
              </span>
            </div>
            
            <p className="ea-process-description">{tProcessDesc(process.name, process.description)}</p>
            
            <div className="ea-process-meta">
              <span>👤 {tOwner(process.owner) || process.owner}</span>
              <span>📊 {t('enterpriseArchitectureModule.labelRisk')}: {process.risk}%</span>
              <span>⭐ {t('enterpriseArchitectureModule.labelMaturity')}: {process.maturity}/5</span>
            </div>
            
            <div className="ea-process-actions">
              <button className="ea-btn primary">👁️ {t('enterpriseArchitectureModule.btnView')}</button>
              <button 
                className="ea-btn secondary" 
                onClick={() => handleEditProcess(process)}
              >
                ✏️ {t('enterpriseArchitectureModule.btnEdit')}
              </button>
              <button className="ea-btn secondary">📋 {t('enterpriseArchitectureModule.btnClone')}</button>
              <button 
                className="ea-btn danger" 
                onClick={() => handleDeleteProcess(process._id)}
              >
                🗑️ {t('enterpriseArchitectureModule.btnDelete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="ea-applications">
      <div className="ea-section-header">
        <h2>💻 {t('enterpriseArchitectureModule.applicationCatalog')}</h2>
        <button className="ea-create-btn">➕ {t('enterpriseArchitectureModule.btnAddApp')}</button>
      </div>
      
      <div className="ea-applications-grid">
        {applications.map(app => (
          <div key={app._id} className="ea-app-card">
            <div className="ea-app-header">
              <h3>{tAppName(app.name)}</h3>
              <span className={`ea-lifecycle-badge ${app.lifecycle}`}>
                {tLifecycle(app.lifecycle)}
              </span>
            </div>
            
            <p className="ea-app-description">{tAppDesc(app.name, app.description)}</p>
            
            <div className="ea-app-meta">
              {app.vendor && <span>🏢 {tVendor(app.vendor) || app.vendor}</span>}
              <span>👥 {app.owners.length} {app.owners.length === 1 ? t('enterpriseArchitectureModule.labelOwnerSingular') : t('enterpriseArchitectureModule.labelOwners')}</span>
              <span>🏗️ {app.capabilities.length} {t('enterpriseArchitectureModule.labelCapabilities')}</span>
            </div>
            
            {app.dataClasses.length > 0 && (
              <div className="ea-data-classes">
                <span className="ea-data-label">{t('enterpriseArchitectureModule.labelDataClasses')}</span>
                {app.dataClasses.map(cls => (
                  <span key={cls} className="ea-data-badge">{tDataClass(cls)}</span>
                ))}
              </div>
            )}
            
            <div className="ea-app-actions">
              <button className="ea-btn primary">👁️ {t('enterpriseArchitectureModule.btnView')}</button>
              <button 
                className="ea-btn secondary" 
                onClick={() => handleEditApplication(app)}
              >
                ✏️ {t('enterpriseArchitectureModule.btnEdit')}
              </button>
              <button className="ea-btn secondary">🔗 {t('enterpriseArchitectureModule.btnLinkProcess')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCapabilities = () => (
    <div className="ea-capabilities">
      <div className="ea-section-header">
        <h2>🏗️ {t('enterpriseArchitectureModule.businessCapabilities')}</h2>
        <button className="ea-create-btn">➕ {t('enterpriseArchitectureModule.btnDefineCapabilityShort')}</button>
      </div>
      
      <div className="ea-capabilities-grid">
        {capabilities.map(cap => (
          <div key={cap._id} className="ea-cap-card">
            <div className="ea-cap-header">
              <h3>{tCapName(cap.name)}</h3>
              <span className="ea-level-badge">{tLevel(cap.level)}</span>
            </div>
            
            <p className="ea-cap-description">{tCapDesc(cap.name, cap.description)}</p>
            
            <div className="ea-cap-meta">
              <span>👥 {cap.owner.length} {cap.owner.length === 1 ? t('enterpriseArchitectureModule.labelOwnerSingular') : t('enterpriseArchitectureModule.labelOwners')}</span>
              <span>🏷️ {cap.tags.length} {t('enterpriseArchitectureModule.labelTags')}</span>
            </div>
            
            {cap.tags.length > 0 && (
              <div className="ea-cap-tags">
                {cap.tags.map(tag => (
                  <span key={tag} className="ea-tag">{tag}</span>
                ))}
              </div>
            )}
            
            <div className="ea-cap-actions">
              <button className="ea-btn primary">👁️ {t('enterpriseArchitectureModule.btnView')}</button>
              <button className="ea-btn secondary" onClick={() => handleEditCapability(cap)}>✏️ {t('enterpriseArchitectureModule.btnEdit')}</button>
              <button className="ea-btn secondary">🔗 {t('enterpriseArchitectureModule.btnLinkApps')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Initialize demo data from backend
  const initializeBackendDemoData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/ea/init-demo-data');
      
      if (response.data.success) {
        setSuccess(t('enterpriseArchitectureModule.successDemoInit', { caps: response.data.capabilities_inserted, apps: response.data.applications_inserted, procs: response.data.processes_inserted }));
        
        // Reload overview and data
        await loadCapabilities();
        await loadApplications();
        await loadProcesses();
        // Update catalog overview with new data
        updateCatalogOverview();
      }
    } catch (err) {
      console.error('Error initializing backend demo data:', err);
      setError(t('enterpriseArchitectureModule.errorInitDemo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ea-container">
      <div className="ea-header">
        <h1>🏢 {t('enterpriseArchitectureModule.title')}</h1>
        <p>{t('enterpriseArchitectureModule.subtitle')}</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="ea-message error">
          <span>❌ {error}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {success && (
        <div className="ea-message success">
          <span>✅ {success}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="ea-tabs">
        <button 
          className={`ea-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 {t('enterpriseArchitectureModule.tabOverview')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('processes');
            if (processes.length === 0) loadProcesses();
          }}
        >
          🔄 {t('enterpriseArchitectureModule.tabProcesses')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('applications');
            if (applications.length === 0) loadApplications();
          }}
        >
          💻 {t('enterpriseArchitectureModule.tabApplications')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'capabilities' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('capabilities');
            if (capabilities.length === 0) loadCapabilities();
          }}
        >
          🏗️ {t('enterpriseArchitectureModule.tabCapabilities')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          🗺️ {t('enterpriseArchitectureModule.tabHeatmap')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          💥 {t('enterpriseArchitectureModule.tabImpact')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'ai-risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-risk')}
        >
          🤖 {t('enterpriseArchitectureModule.tabAiRisk')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'process-designer' ? 'active' : ''}`}
          onClick={() => setActiveTab('process-designer')}
        >
          🔄 {t('enterpriseArchitectureModule.tabProcessDesigner')}
        </button>
        <button 
          className={`ea-tab ${activeTab === 'catalog-manager' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog-manager')}
        >
          📋 {t('enterpriseArchitectureModule.tabCatalogManager')}
        </button>
      </div>

      {/* Content Area */}
      <div className="ea-content">
        {loading && (
          <div className="ea-loading">
            <div className="ea-spinner"></div>
            <p>{t('enterpriseArchitectureModule.loading')}</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'processes' && renderProcesses()}
            {activeTab === 'applications' && renderApplications()}
            {activeTab === 'capabilities' && renderCapabilities()}
                        {activeTab === 'heatmap' && <HeatmapView />}
            {activeTab === 'impact' && <ImpactAnalysis />}
            {activeTab === 'ai-risk' && <AIRiskAnalysis />}
            {activeTab === 'process-designer' && (
              <ProcessDesigner 
                initialData={editingProcess}
                onSave={(processId) => {
                  if (editingProcess) {
                    setSuccess(t('enterpriseArchitectureModule.successProcessUpdated', { id: processId }));
                  } else {
                    setSuccess(t('enterpriseArchitectureModule.successProcessCreated', { id: processId }));
                  }
                  setEditingProcess(null);
                  setActiveTab('processes');
                  loadProcesses(); // Reload processes to show updated data
                }}
              />
            )}
            {activeTab === 'catalog-manager' && <CatalogManager />}
          </>
        )}
      </div>

      {/* Edit Application Modal */}
      {showEditModal && editingApplication && (
        <div className="ea-modal-overlay">
          <div className="ea-modal">
            <div className="ea-modal-header">
              <h3>{t('enterpriseArchitectureModule.modalEditApp')}</h3>
              <button 
                className="ea-modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingApplication(null);
                  setEditFormData({});
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="ea-modal-body">
              <div className="ea-form-group">
                <label>{t('enterpriseArchitectureModule.fieldNameRequired')}</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder={t('enterpriseArchitectureModule.placeholderAppName')}
                />
              </div>
              
              <div className="ea-form-group">
                <label>{t('enterpriseArchitectureModule.fieldDescription')}*</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  placeholder={t('enterpriseArchitectureModule.placeholderDescription')}
                  rows="3"
                />
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldCategory')}</label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    placeholder={t('enterpriseArchitectureModule.placeholderCategory')}
                  />
                </div>
                
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldRiskLevel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFormData.risk}
                    onChange={(e) => setEditFormData({...editFormData, risk: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldMaturityLevel')}</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editFormData.maturity}
                    onChange={(e) => setEditFormData({...editFormData, maturity: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldVendor')}</label>
                  <input
                    type="text"
                    value={editFormData.vendor}
                    onChange={(e) => setEditFormData({...editFormData, vendor: e.target.value})}
                    placeholder={t('enterpriseArchitectureModule.placeholderVendor')}
                  />
                </div>
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldLifecycle')}</label>
                  <select
                    value={editFormData.lifecycle}
                    onChange={(e) => setEditFormData({...editFormData, lifecycle: e.target.value})}
                  >
                    <option value="Development">{t('enterpriseArchitectureModule.lifecycleDevelopment')}</option>
                    <option value="Production">{t('enterpriseArchitectureModule.lifecycleProduction')}</option>
                    <option value="Maintenance">{t('enterpriseArchitectureModule.lifecycleMaintenance')}</option>
                    <option value="Retirement">{t('enterpriseArchitectureModule.lifecycleRetirement')}</option>
                  </select>
                </div>
                
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldStatus')}</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="Active">{t('enterpriseArchitectureModule.statusActive')}</option>
                    <option value="Inactive">{t('enterpriseArchitectureModule.statusInactive')}</option>
                    <option value="Deprecated">{t('enterpriseArchitectureModule.statusDeprecated')}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="ea-modal-footer">
              <button 
                className="ea-btn secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingApplication(null);
                  setEditFormData({});
                }}
              >
                {t('enterpriseArchitectureModule.btnCancel')}
              </button>
              <button 
                className="ea-btn primary"
                onClick={handleUpdateApplication}
                disabled={loading}
              >
                {loading ? t('enterpriseArchitectureModule.btnUpdating') : t('enterpriseArchitectureModule.btnUpdate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Capability Modal */}
      {showEditCapabilityModal && editingCapability && (
        <div className="ea-modal-overlay">
          <div className="ea-modal">
            <div className="ea-modal-header">
              <h3>{t('enterpriseArchitectureModule.modalEditCapability')}</h3>
              <button 
                className="ea-modal-close"
                onClick={() => {
                  setShowEditCapabilityModal(false);
                  setEditingCapability(null);
                  setEditCapabilityFormData({});
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="ea-modal-body">
              <div className="ea-form-group">
                <label>{t('enterpriseArchitectureModule.fieldName')}</label>
                <input
                  type="text"
                  value={editCapabilityFormData.name}
                  onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, name: e.target.value})}
                  placeholder={t('enterpriseArchitectureModule.placeholderCapabilityName')}
                />
              </div>
              
              <div className="ea-form-group">
                <label>{t('enterpriseArchitectureModule.fieldDescription')}</label>
                <textarea
                  value={editCapabilityFormData.description}
                  onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, description: e.target.value})}
                  placeholder={t('enterpriseArchitectureModule.placeholderCapabilityDesc')}
                  rows="3"
                />
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldLevel')}</label>
                  <select
                    value={editCapabilityFormData.level}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, level: e.target.value})}
                  >
                    <option value="Strategic">{t('enterpriseArchitectureModule.levelStrategic')}</option>
                    <option value="Core">{t('enterpriseArchitectureModule.levelCore')}</option>
                    <option value="Supporting">{t('enterpriseArchitectureModule.levelSupporting')}</option>
                    <option value="Enabling">{t('enterpriseArchitectureModule.levelEnabling')}</option>
                  </select>
                </div>
                
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldStrategicImportance')}</label>
                  <select
                    value={editCapabilityFormData.strategic_importance}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, strategic_importance: e.target.value})}
                  >
                    <option value="High">{t('enterpriseArchitectureModule.importanceHigh')}</option>
                    <option value="Medium">{t('enterpriseArchitectureModule.importanceMedium')}</option>
                    <option value="Low">{t('enterpriseArchitectureModule.importanceLow')}</option>
                  </select>
                </div>
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldMaturityLevel')}</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editCapabilityFormData.maturity}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, maturity: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="ea-form-group">
                  <label>{t('enterpriseArchitectureModule.fieldRiskLevelCap')}</label>
                  <select
                    value={editCapabilityFormData.risk}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, risk: e.target.value})}
                  >
                    <option value="Low">{t('enterpriseArchitectureModule.importanceLow')}</option>
                    <option value="Medium">{t('enterpriseArchitectureModule.importanceMedium')}</option>
                    <option value="High">{t('enterpriseArchitectureModule.importanceHigh')}</option>
                  </select>
                </div>
              </div>
              
              <div className="ea-form-group">
                <label>{t('enterpriseArchitectureModule.fieldTagsComma')}</label>
                <input
                  type="text"
                  value={editCapabilityFormData.tags.join(', ')}
                  onChange={(e) => setEditCapabilityFormData({
                    ...editCapabilityFormData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder={t('enterpriseArchitectureModule.placeholderTagsComma')}
                />
              </div>
            </div>
            
            <div className="ea-modal-footer">
              <button 
                className="ea-btn secondary"
                onClick={() => {
                  setShowEditCapabilityModal(false);
                  setEditingCapability(null);
                  setEditCapabilityFormData({});
                }}
              >
                {t('enterpriseArchitectureModule.btnCancel')}
              </button>
              <button 
                className="ea-btn primary"
                onClick={handleUpdateCapability}
                disabled={loading}
              >
                {loading ? t('enterpriseArchitectureModule.btnUpdating') : t('enterpriseArchitectureModule.btnUpdate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
