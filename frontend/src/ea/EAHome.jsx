import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EAHome.css';
import ProcessDesigner from './ProcessDesigner';
import HeatmapView from './HeatmapView';
import ImpactAnalysis from './ImpactAnalysis';
import CatalogManager from './CatalogManager';
import AIRiskAnalysis from './AIRiskAnalysis';

export default function EAHome() {
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
      setError('Failed to load processes');
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
      setError('Failed to load applications');
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
      setError('Failed to load capabilities');
    } finally {
      setLoading(false);
    }
  };

  // Handle process deletion
  const handleDeleteProcess = async (processId) => {
    if (!window.confirm('Are you sure you want to delete this process? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/ea/processes/${processId}`);
      
      // Update local state
      setProcesses(processes.filter(proc => proc._id !== processId));
      
      setSuccess('Process deleted successfully!');
      
      // Update catalog overview
      updateCatalogOverview();
    } catch (err) {
      console.error('Error deleting process:', err);
      setError('Failed to delete process');
    } finally {
      setLoading(false);
    }
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
        
        setSuccess('Application updated successfully!');
        setShowEditModal(false);
        setEditingApplication(null);
        setEditFormData({});
        
        // Update catalog overview
        updateCatalogOverview();
      }
    } catch (err) {
      console.error('Error updating application:', err);
      setError('Failed to update application');
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
        
        setSuccess('Capability updated successfully!');
        setShowEditCapabilityModal(false);
        setEditingCapability(null);
        setEditCapabilityFormData({});
        
        // Update catalog overview
        updateCatalogOverview();
      }
    } catch (err) {
      console.error('Error updating capability:', err);
      setError('Failed to update capability');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderOverview = () => (
    <div className="ea-overview">
      <div className="ea-stats-grid">
        <div className="ea-stat-card">
          <div className="ea-stat-icon">🏗️</div>
          <div className="ea-stat-value">{catalogOverview?.total_capabilities || 0}</div>
          <div className="ea-stat-label">Business Capabilities</div>
        </div>
        
        <div className="ea-stat-card">
          <div className="ea-stat-icon">💻</div>
          <div className="ea-stat-value">{catalogOverview?.total_applications || 0}</div>
          <div className="ea-stat-label">Applications</div>
        </div>
        
        <div className="ea-stat-card">
          <div className="ea-stat-icon">🔄</div>
          <div className="ea-stat-value">{catalogOverview?.total_processes || 0}</div>
          <div className="ea-stat-label">Processes</div>
        </div>
        
        <div className="ea-stat-card">
          <div className="ea-stat-icon">📊</div>
          <div className="ea-stat-value">
            {catalogOverview?.risk_distribution?.find(r => r._id === 'High')?.count || 0}
          </div>
          <div className="ea-stat-label">High Risk Items</div>
        </div>
      </div>

      <div className="ea-quick-actions">
        <h3>🚀 Quick Actions</h3>
        <div className="ea-action-buttons">
          <button 
            className="ea-action-btn primary"
            onClick={() => setActiveTab('processes')}
          >
            📝 Create Process
          </button>
          <button 
            className="ea-action-btn secondary"
            onClick={() => setActiveTab('applications')}
          >
            💻 Add Application
          </button>
          <button 
            className="ea-action-btn secondary"
            onClick={() => setActiveTab('capabilities')}
          >
            🏗️ Define Capability
          </button>
          <button 
            className="ea-action-btn backend"
            onClick={initializeBackendDemoData}
          >
            🚀 Initialize Demo Data
          </button>
        </div>
      </div>

      <div className="ea-recent-items">
        <h3>📋 Recent Items</h3>
        <div className="ea-recent-grid">
          <div className="ea-recent-section">
            <h4>Recent Processes</h4>
            {processes.slice(0, 3).map(process => (
              <div key={process._id} className="ea-recent-item">
                <span className="ea-item-name">{process.name}</span>
                <span className={`ea-status-badge ${process.status}`}>
                  {process.status}
                </span>
              </div>
            ))}
          </div>
          
          <div className="ea-recent-section">
            <h4>Recent Applications</h4>
            {applications.slice(0, 3).map(app => (
              <div key={app._id} className="ea-recent-item">
                <span className="ea-item-name">{app.name}</span>
                <span className={`ea-lifecycle-badge ${app.lifecycle}`}>
                  {app.lifecycle}
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
        <h2>🔄 Process Management</h2>
        <button className="ea-create-btn" onClick={() => setActiveTab('process-designer')}>
          ➕ Create New Process
        </button>
      </div>
      
      <div className="ea-filters">
        <select onChange={(e) => setActiveTab('processes')}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="deprecated">Deprecated</option>
        </select>
        
        <select onChange={(e) => setActiveTab('processes')}>
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Finance">Finance</option>
          <option value="HR">HR</option>
          <option value="IT">IT</option>
        </select>
      </div>

      <div className="ea-processes-grid">
        {processes.map(process => (
          <div key={process._id} className="ea-process-card">
            <div className="ea-process-header">
              <h3>{process.name}</h3>
              <span className={`ea-status-badge ${process.status}`}>
                {process.status}
              </span>
            </div>
            
            <p className="ea-process-description">{process.description}</p>
            
            <div className="ea-process-meta">
              <span>👤 {process.owner}</span>
              <span>📊 Risk: {process.risk}%</span>
              <span>⭐ Maturity: {process.maturity}/5</span>
            </div>
            
            <div className="ea-process-actions">
              <button className="ea-btn primary">👁️ View</button>
              <button className="ea-btn secondary">✏️ Edit</button>
              <button className="ea-btn secondary">📋 Clone</button>
              <button 
                className="ea-btn danger" 
                onClick={() => handleDeleteProcess(process._id)}
              >
                🗑️ Delete
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
        <h2>💻 Application Catalog</h2>
        <button className="ea-create-btn">➕ Add Application</button>
      </div>
      
      <div className="ea-applications-grid">
        {applications.map(app => (
          <div key={app._id} className="ea-app-card">
            <div className="ea-app-header">
              <h3>{app.name}</h3>
              <span className={`ea-lifecycle-badge ${app.lifecycle}`}>
                {app.lifecycle}
              </span>
            </div>
            
            <p className="ea-app-description">{app.description}</p>
            
            <div className="ea-app-meta">
              {app.vendor && <span>🏢 {app.vendor}</span>}
              <span>👥 {app.owners.length} owners</span>
              <span>🏗️ {app.capabilities.length} capabilities</span>
            </div>
            
            {app.dataClasses.length > 0 && (
              <div className="ea-data-classes">
                <span className="ea-data-label">Data Classes:</span>
                {app.dataClasses.map(cls => (
                  <span key={cls} className="ea-data-badge">{cls}</span>
                ))}
              </div>
            )}
            
            <div className="ea-app-actions">
              <button className="ea-btn primary">👁️ View</button>
              <button 
                className="ea-btn secondary" 
                onClick={() => handleEditApplication(app)}
              >
                ✏️ Edit
              </button>
              <button className="ea-btn secondary">🔗 Link Process</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCapabilities = () => (
    <div className="ea-capabilities">
      <div className="ea-section-header">
        <h2>🏗️ Business Capabilities</h2>
        <button className="ea-create-btn">➕ Define Capability</button>
      </div>
      
      <div className="ea-capabilities-grid">
        {capabilities.map(cap => (
          <div key={cap._id} className="ea-cap-card">
            <div className="ea-cap-header">
              <h3>{cap.name}</h3>
              <span className="ea-level-badge">{cap.level}</span>
            </div>
            
            <p className="ea-cap-description">{cap.description}</p>
            
            <div className="ea-cap-meta">
              <span>👥 {cap.owner.length} owners</span>
              <span>🏷️ {cap.tags.length} tags</span>
            </div>
            
            {cap.tags.length > 0 && (
              <div className="ea-cap-tags">
                {cap.tags.map(tag => (
                  <span key={tag} className="ea-tag">{tag}</span>
                ))}
              </div>
            )}
            
            <div className="ea-cap-actions">
              <button className="ea-btn primary">👁️ View</button>
              <button className="ea-btn secondary" onClick={() => handleEditCapability(cap)}>✏️ Edit</button>
              <button className="ea-btn secondary">🔗 Link Apps</button>
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
        setSuccess(`Backend demo data initialized successfully! ${response.data.capabilities_inserted} capabilities, ${response.data.applications_inserted} applications, ${response.data.processes_inserted} processes created.`);
        
        // Reload overview and data
        await loadCapabilities();
        await loadApplications();
        await loadProcesses();
        // Update catalog overview with new data
        updateCatalogOverview();
      }
    } catch (err) {
      console.error('Error initializing backend demo data:', err);
      setError('Failed to initialize backend demo data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ea-container">
      <div className="ea-header">
        <h1>🏢 Enterprise Architecture</h1>
        <p>Model, analyze, and transform your IT landscape with process control and impact analysis</p>
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
          📊 Overview
        </button>
        <button 
          className={`ea-tab ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('processes');
            if (processes.length === 0) loadProcesses();
          }}
        >
          🔄 Processes
        </button>
        <button 
          className={`ea-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('applications');
            if (applications.length === 0) loadApplications();
          }}
        >
          💻 Applications
        </button>
        <button 
          className={`ea-tab ${activeTab === 'capabilities' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('capabilities');
            if (capabilities.length === 0) loadCapabilities();
          }}
        >
          🏗️ Capabilities
        </button>
        <button 
          className={`ea-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          🗺️ Heatmap
        </button>
        <button 
          className={`ea-tab ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          💥 Impact Analysis
        </button>
        <button 
          className={`ea-tab ${activeTab === 'ai-risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-risk')}
        >
          🤖 AI Risk Analysis
        </button>
        <button 
          className={`ea-tab ${activeTab === 'process-designer' ? 'active' : ''}`}
          onClick={() => setActiveTab('process-designer')}
        >
          🔄 Process Designer
        </button>
        <button 
          className={`ea-tab ${activeTab === 'catalog-manager' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog-manager')}
        >
          📋 Catalog Manager
        </button>
      </div>

      {/* Content Area */}
      <div className="ea-content">
        {loading && (
          <div className="ea-loading">
            <div className="ea-spinner"></div>
            <p>Loading...</p>
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
                onSave={(processId) => {
                  setSuccess(`Process created successfully! ID: ${processId}`);
                  setActiveTab('processes');
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
              <h3>Edit Application</h3>
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
                <label>Name*</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="Enter application name"
                />
              </div>
              
              <div className="ea-form-group">
                <label>Description*</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  placeholder="Enter description"
                  rows="3"
                />
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    placeholder="Enter category"
                  />
                </div>
                
                <div className="ea-form-group">
                  <label>Risk Level (%)</label>
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
                  <label>Maturity Level (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editFormData.maturity}
                    onChange={(e) => setEditFormData({...editFormData, maturity: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="ea-form-group">
                  <label>Vendor</label>
                  <input
                    type="text"
                    value={editFormData.vendor}
                    onChange={(e) => setEditFormData({...editFormData, vendor: e.target.value})}
                    placeholder="Enter vendor name"
                  />
                </div>
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>Lifecycle</label>
                  <select
                    value={editFormData.lifecycle}
                    onChange={(e) => setEditFormData({...editFormData, lifecycle: e.target.value})}
                  >
                    <option value="Development">Development</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retirement">Retirement</option>
                  </select>
                </div>
                
                <div className="ea-form-group">
                  <label>Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Deprecated">Deprecated</option>
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
                Cancel
              </button>
              <button 
                className="ea-btn primary"
                onClick={handleUpdateApplication}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
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
              <h3>✏️ Edit Capability</h3>
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
                <label>Name</label>
                <input
                  type="text"
                  value={editCapabilityFormData.name}
                  onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, name: e.target.value})}
                  placeholder="Enter capability name"
                />
              </div>
              
              <div className="ea-form-group">
                <label>Description</label>
                <textarea
                  value={editCapabilityFormData.description}
                  onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, description: e.target.value})}
                  placeholder="Enter capability description"
                  rows="3"
                />
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>Level</label>
                  <select
                    value={editCapabilityFormData.level}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, level: e.target.value})}
                  >
                    <option value="Strategic">Strategic</option>
                    <option value="Core">Core</option>
                    <option value="Supporting">Supporting</option>
                    <option value="Enabling">Enabling</option>
                  </select>
                </div>
                
                <div className="ea-form-group">
                  <label>Strategic Importance</label>
                  <select
                    value={editCapabilityFormData.strategic_importance}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, strategic_importance: e.target.value})}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              
              <div className="ea-form-row">
                <div className="ea-form-group">
                  <label>Maturity Level (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editCapabilityFormData.maturity}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, maturity: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="ea-form-group">
                  <label>Risk Level</label>
                  <select
                    value={editCapabilityFormData.risk}
                    onChange={(e) => setEditCapabilityFormData({...editCapabilityFormData, risk: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              
              <div className="ea-form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editCapabilityFormData.tags.join(', ')}
                  onChange={(e) => setEditCapabilityFormData({
                    ...editCapabilityFormData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder="Enter tags separated by commas"
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
                Cancel
              </button>
              <button 
                className="ea-btn primary"
                onClick={handleUpdateCapability}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
