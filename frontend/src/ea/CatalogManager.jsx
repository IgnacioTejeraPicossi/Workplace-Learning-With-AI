import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './CatalogManager.css';
import { createEaCatalogTranslators } from './eaCatalogI18n';

export default function CatalogManager() {
  const { t } = useTranslation();
  const {
    tAppName, tAppDesc, tProcessName, tProcessDesc,
    tCapName, tCapDesc, tDataClass, tCapabilityName, tVendor, tOwner,
  } = createEaCatalogTranslators(t);
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [applicationsRes, capabilitiesRes, processesRes] = await Promise.allSettled([
        axios.get('/api/ea/applications'),
        axios.get('/api/ea/capabilities'),
        axios.get('/api/ea/processes')
      ]);

      if (applicationsRes.status === 'fulfilled') {
        setApplications(applicationsRes.value.data || []);
      }
      if (capabilitiesRes.status === 'fulfilled') {
        setCapabilities(capabilitiesRes.value.data || []);
      }
      if (processesRes.status === 'fulfilled') {
        setProcesses(processesRes.value.data || []);
      }

    } catch (err) {
      console.error('Error loading catalog data:', err);
      setError(t('enterpriseArchitectureModule.cmErrorLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Generate sample data for demo
  const generateSampleData = () => {
    const sampleApplications = [
      {
        id: 1,
        name: 'ERP System',
        description: 'Enterprise Resource Planning system for business operations',
        category: 'Business Operations',
        lifecycle: 'Production',
        risk: 35,
        maturity: 4,
        vendor: 'SAP',
        owners: ['IT Department', 'Business Operations'],
        capabilities: ['Financial Management', 'Inventory Control', 'HR Management'],
        dataClasses: ['Financial Data', 'Employee Data', 'Inventory Data'],
        dependencies: ['Database', 'Authentication Service'],
        status: 'Active'
      },
      {
        id: 2,
        name: 'CRM Platform',
        description: 'Customer Relationship Management platform',
        category: 'Sales & Marketing',
        lifecycle: 'Production',
        risk: 55,
        maturity: 3,
        vendor: 'Salesforce',
        owners: ['Sales Team', 'Marketing Team'],
        capabilities: ['Lead Management', 'Customer Analytics', 'Campaign Management'],
        dataClasses: ['Customer Data', 'Sales Data', 'Marketing Data'],
        dependencies: ['Email Service', 'Analytics Engine'],
        status: 'Active'
      },
      {
        id: 3,
        name: 'Legacy Database',
        description: 'Legacy database system for historical data',
        category: 'Data Management',
        lifecycle: 'Sunset',
        risk: 85,
        maturity: 1,
        vendor: 'Oracle',
        owners: ['Data Team'],
        capabilities: ['Data Storage', 'Data Retrieval'],
        dataClasses: ['Historical Data', 'Reference Data'],
        dependencies: ['Backup System'],
        status: 'Deprecated'
      }
    ];

    const sampleCapabilities = [
      {
        id: 1,
        name: 'Customer Management',
        description: 'Manage customer relationships and interactions',
        category: 'Customer Service',
        level: 'Strategic',
        risk: 30,
        maturity: 4,
        owner: ['Customer Service Team'],
        tags: ['customer', 'relationship', 'service'],
        applications: ['CRM Platform', 'Customer Portal'],
        status: 'Active'
      },
      {
        id: 2,
        name: 'Financial Operations',
        description: 'Manage financial transactions and reporting',
        category: 'Finance',
        level: 'Core',
        risk: 70,
        maturity: 2,
        owner: ['Finance Team'],
        tags: ['finance', 'accounting', 'reporting'],
        applications: ['ERP System', 'Financial Reporting Tool'],
        status: 'Active'
      },
      {
        id: 3,
        name: 'IT Infrastructure',
        description: 'Manage IT infrastructure and services',
        category: 'Information Technology',
        level: 'Supporting',
        risk: 50,
        maturity: 3,
        owner: ['IT Team'],
        tags: ['infrastructure', 'technology', 'support'],
        applications: ['Monitoring System', 'Backup System'],
        status: 'Active'
      }
    ];

    const sampleProcesses = [
      {
        id: 1,
        name: 'Order Processing',
        description: 'Process customer orders from receipt to fulfillment',
        category: 'Operations',
        risk: 25,
        maturity: 4,
        owner: 'Operations Team',
        status: 'Approved',
        applications: ['ERP System', 'Order Management'],
        capabilities: ['Order Management', 'Inventory Control'],
        dependencies: ['Customer Data', 'Inventory Data'],
        steps: ['Order Receipt', 'Validation', 'Fulfillment', 'Delivery']
      },
      {
        id: 2,
        name: 'Payment Processing',
        description: 'Process financial transactions and payments',
        category: 'Finance',
        risk: 75,
        maturity: 2,
        owner: 'Finance Team',
        status: 'Draft',
        applications: ['Payment Gateway', 'Financial System'],
        capabilities: ['Financial Operations', 'Risk Management'],
        dependencies: ['Payment Gateway', 'Banking API'],
        steps: ['Payment Initiation', 'Validation', 'Processing', 'Confirmation']
      }
    ];

    setApplications(sampleApplications);
    setCapabilities(sampleCapabilities);
    setProcesses(sampleProcesses);
    setSuccess('Sample data loaded successfully!');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleCreate = (itemType) => {
    setEditingItem(null);
    setShowCreateForm(true);
    setActiveTab(itemType);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowCreateForm(true);
  };

  const handleDelete = async (itemType, itemId) => {
    if (!window.confirm(`Are you sure you want to delete this ${itemType}?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/ea/${itemType}/${itemId}`);
      
      // Update local state
      if (itemType === 'applications') {
        setApplications(applications.filter(app => app.id !== itemId));
      } else if (itemType === 'capabilities') {
        setCapabilities(capabilities.filter(cap => cap.id !== itemId));
      } else if (itemType === 'processes') {
        setProcesses(processes.filter(proc => proc.id !== itemId));
      }
      
      setSuccess(`${itemType} deleted successfully!`);
    } catch (err) {
      console.error(`Error deleting ${itemType}:`, err);
      setError(`Failed to delete ${itemType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData, itemType) => {
    try {
      setLoading(true);
      
      if (editingItem) {
        // Update existing item
        await axios.put(`/api/ea/${itemType}/${editingItem.id}`, itemData);
        setSuccess(`${itemType} updated successfully!`);
      } else {
        // Create new item
        await axios.post(`/api/ea/${itemType}`, itemData);
        setSuccess(`${itemType} created successfully!`);
      }
      
      // Reload data
      await loadData();
      setShowCreateForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error(`Error saving ${itemType}:`, err);
      setError(`Failed to save ${itemType}`);
    } finally {
      setLoading(false);
    }
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

  const getFilteredItems = () => {
    let items = [];
    
    if (activeTab === 'applications') {
      items = applications;
    } else if (activeTab === 'capabilities') {
      items = capabilities;
    } else if (activeTab === 'processes') {
      items = processes;
    }

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory) {
      items = items.filter(item => item.category === filterCategory);
    }

    // Apply status filter
    if (filterStatus) {
      items = items.filter(item => item.status === filterStatus);
    }

    return items;
  };

  const getCategories = () => {
    const allItems = [...applications, ...capabilities, ...processes];
    return [...new Set(allItems.map(item => item.category).filter(Boolean))];
  };

  const getStatuses = () => {
    const allItems = [...applications, ...capabilities, ...processes];
    return [...new Set(allItems.map(item => item.status).filter(Boolean))];
  };

  const renderApplications = () => (
    <div className="catalog-section">
      <div className="section-header">
        <h2>💻 {t('enterpriseArchitectureModule.cmTabApplications')}</h2>
        <button className="create-btn" onClick={() => handleCreate('applications')}>
          ➕ {t('enterpriseArchitectureModule.btnAddApp')}
        </button>
      </div>
      
      <div className="items-grid">
        {getFilteredItems().map(app => (
          <div key={app.id} className="item-card application">
            <div className="item-header">
              <h3>{tAppName(app.name)}</h3>
              <div className="item-badges">
                <span className={`lifecycle-badge ${app.lifecycle}`}>
                  {tLifecycle(app.lifecycle)}
                </span>
                <span className={`status-badge ${app.status}`}>
                  {tStatus(app.status)}
                </span>
              </div>
            </div>
            
            <p className="item-description">{tAppDesc(app.name, app.description)}</p>
            
            <div className="item-meta">
              <span>🏢 {tVendor(app.vendor) || app.vendor || 'Internal'}</span>
              <span>📊 {t('enterpriseArchitectureModule.labelRisk')}: {app.risk}%</span>
              <span>⭐ {t('enterpriseArchitectureModule.labelMaturity')}: {app.maturity}/5</span>
            </div>
            
            <div className="item-details">
              <div className="detail-section">
                <strong>{t('enterpriseArchitectureModule.cmLabelCategory')}</strong> {app.category}
              </div>
              <div className="detail-section">
                <strong>{t('enterpriseArchitectureModule.cmLabelOwners')}</strong> {app.owners?.join(', ') || '-'}
              </div>
              <div className="detail-section">
                <strong>{t('enterpriseArchitectureModule.cmLabelCapabilities')}</strong> {app.capabilities?.map(tCapabilityName).join(', ') || '-'}
              </div>
              {app.dataClasses?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelDataClasses')}</strong>
                  <div className="data-classes">
                    {app.dataClasses.map(cls => (
                      <span key={cls} className="data-badge">{tDataClass(cls)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="item-actions">
              <button className="action-btn primary" onClick={() => handleEdit(app)}>
                ✏️ {t('enterpriseArchitectureModule.cmBtnEdit')}
              </button>
              <button className="action-btn secondary" onClick={() => handleDelete('applications', app.id)}>
                🗑️ {t('enterpriseArchitectureModule.cmBtnDelete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCapabilities = () => (
    <div className="catalog-section">
      <div className="section-header">
        <h2>🏗️ {t('enterpriseArchitectureModule.businessCapabilities')}</h2>
        <button className="create-btn" onClick={() => handleCreate('capabilities')}>
          ➕ {t('enterpriseArchitectureModule.btnDefineCapabilityShort')}
        </button>
      </div>
      
      <div className="items-grid">
        {getFilteredItems().map(cap => (
          <div key={cap.id} className="item-card capability">
            <div className="item-header">
              <h3>{tCapName(cap.name)}</h3>
              <div className="item-badges">
                <span className={`level-badge ${cap.level}`}>
                  {tLevel(cap.level)}
                </span>
                <span className={`status-badge ${cap.status}`}>
                  {tStatus(cap.status)}
                </span>
              </div>
            </div>
            
            <p className="item-description">{tCapDesc(cap.name, cap.description)}</p>
            
            <div className="item-meta">
              <span>📊 {t('enterpriseArchitectureModule.labelRisk')}: {cap.risk}%</span>
              <span>⭐ {t('enterpriseArchitectureModule.labelMaturity')}: {cap.maturity}/5</span>
              <span>🏷️ {cap.tags?.length || 0} {t('enterpriseArchitectureModule.labelTags')}</span>
            </div>
            
            <div className="item-details">
              <div className="detail-section">
                <strong>{t('enterpriseArchitectureModule.cmLabelCategory')}</strong> {cap.category}
              </div>
              <div className="detail-section">
                <strong>{t('enterpriseArchitectureModule.cmLabelOwner')}</strong> {cap.owner?.join(', ') || '-'}
              </div>
              {cap.tags?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelTags')}</strong>
                  <div className="tags">
                    {cap.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {cap.applications?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelApplications')}</strong> {cap.applications?.map(tAppName).join(', ')}
                </div>
              )}
            </div>
            
            <div className="item-actions">
              <button className="action-btn primary" onClick={() => handleEdit(cap)}>
                ✏️ {t('enterpriseArchitectureModule.cmBtnEdit')}
              </button>
              <button className="action-btn secondary" onClick={() => handleDelete('capabilities', cap.id)}>
                🗑️ {t('enterpriseArchitectureModule.cmBtnDelete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProcesses = () => (
    <div className="catalog-section">
      <div className="section-header">
        <h2>🔄 {t('enterpriseArchitectureModule.cmTabProcesses')}</h2>
        <button className="create-btn" onClick={() => handleCreate('processes')}>
          ➕ {t('enterpriseArchitectureModule.btnCreateProcess')}
        </button>
      </div>
      
      <div className="items-grid">
        {getFilteredItems().map(proc => (
          <div key={proc.id} className="item-card process">
            <div className="item-header">
              <h3>{tProcessName(proc.name)}</h3>
              <div className="item-badges">
                <span className={`status-badge ${proc.status}`}>
                  {tStatus(proc.status)}
                </span>
              </div>
            </div>
            
            <p className="item-description">{tProcessDesc(proc.name, proc.description)}</p>
            
            <div className="item-meta">
              <span>👤 {tOwner(proc.owner) || proc.owner}</span>
              <span>📊 {t('enterpriseArchitectureModule.labelRisk')}: {proc.risk}%</span>
              <span>⭐ {t('enterpriseArchitectureModule.labelMaturity')}: {proc.maturity}/5</span>
            </div>
            
            <div className="item-details">
              <div className="detail-section">
                <strong>{t('enterpriseArchitectureModule.cmLabelCategory')}</strong> {proc.category}
              </div>
              {proc.applications?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelApplications')}</strong> {proc.applications?.map(tAppName).join(', ')}
                </div>
              )}
              {proc.capabilities?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelCapabilities')}</strong> {proc.capabilities.map(tCapabilityName).join(', ')}
                </div>
              )}
              {proc.dependencies?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelDependencies')}</strong> {proc.dependencies.map(tDataClass).join(', ')}
                </div>
              )}
              {proc.steps?.length > 0 && (
                <div className="detail-section">
                  <strong>{t('enterpriseArchitectureModule.cmLabelProcessSteps')}</strong>
                  <ol className="process-steps">
                    {proc.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            
            <div className="item-actions">
              <button className="action-btn primary" onClick={() => handleEdit(proc)}>
                ✏️ {t('enterpriseArchitectureModule.cmBtnEdit')}
              </button>
              <button className="action-btn secondary" onClick={() => handleDelete('processes', proc.id)}>
                🗑️ {t('enterpriseArchitectureModule.cmBtnDelete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateForm = () => {
    if (!showCreateForm) return null;

    const itemType = activeTab;
    const isEditing = !!editingItem;
    const item = editingItem || {};

    return (
      <div className="create-form-overlay">
        <div className="create-form">
          <div className="form-header">
            <h3>{isEditing ? 'Edit' : 'Create'} {itemType.slice(0, -1)}</h3>
            <button className="close-btn" onClick={() => setShowCreateForm(false)}>
              ✕
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            handleSave(data, itemType);
          }}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input 
                  name="name" 
                  defaultValue={item.name || ''} 
                  required 
                  placeholder={`Enter ${itemType.slice(0, -1)} name`}
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  name="description" 
                  defaultValue={item.description || ''} 
                  required 
                  placeholder={`Enter ${itemType.slice(0, -1)} description`}
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input 
                  name="category" 
                  defaultValue={item.category || ''} 
                  placeholder="Enter category"
                />
              </div>
              <div className="form-group">
                <label>Risk Level (%)</label>
                <input 
                  type="number" 
                  name="risk" 
                  defaultValue={item.risk || 50} 
                  min="0" 
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Maturity Level (1-5)</label>
                <input 
                  type="number" 
                  name="maturity" 
                  defaultValue={item.maturity || 3} 
                  min="1" 
                  max="5"
                />
              </div>
            </div>

            {itemType === 'applications' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor</label>
                  <input 
                    name="vendor" 
                    defaultValue={item.vendor || ''} 
                    placeholder="Enter vendor name"
                  />
                </div>
                <div className="form-group">
                  <label>Lifecycle</label>
                  <select name="lifecycle" defaultValue={item.lifecycle || 'Production'}>
                    <option value="Development">Development</option>
                    <option value="Pilot">Pilot</option>
                    <option value="Production">Production</option>
                    <option value="Sunset">Sunset</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={item.status || 'Active'}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
            )}

            {itemType === 'capabilities' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Level</label>
                  <select name="level" defaultValue={item.level || 'Core'}>
                    <option value="Strategic">Strategic</option>
                    <option value="Core">Core</option>
                    <option value="Supporting">Supporting</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={item.status || 'Active'}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
            )}

            {itemType === 'processes' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Owner</label>
                  <input 
                    name="owner" 
                    defaultValue={item.owner || ''} 
                    placeholder="Enter process owner"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={item.status || 'Draft'}>
                    <option value="Draft">Draft</option>
                    <option value="Review">Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                {t('enterpriseArchitectureModule.cmBtnCancel')}
              </button>
              <button type="submit" className="save-btn">
                {isEditing ? t('enterpriseArchitectureModule.btnUpdate') : t('enterpriseArchitectureModule.cmBtnAddNew')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && !showCreateForm) {
    return (
      <div className="catalog-loading">
        <div className="loading-spinner"></div>
        <p>{t('enterpriseArchitectureModule.loading')}</p>
      </div>
    );
  }

  return (
    <div className="catalog-manager">
      <div className="catalog-header">
        <h2>📋 {t('enterpriseArchitectureModule.cmTitle')}</h2>
        <p>{t('enterpriseArchitectureModule.subtitle')}</p>
      </div>

      {error && (
        <div className="catalog-error">
          <span>❌ {error}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {success && (
        <div className="catalog-success">
          <span>✅ {success}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {/* Demo Data Button */}
      <div className="demo-controls">
        <button onClick={generateSampleData} className="demo-btn">
          🎯 {t('enterpriseArchitectureModule.btnLoadDemoData')}
        </button>
        <button onClick={loadData} className="refresh-btn">
          🔄 {t('enterpriseArchitectureModule.btnRefreshData')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="catalog-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('enterpriseArchitectureModule.cmSearchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('enterpriseArchitectureModule.filterAllCategories')}</option>
            {getCategories().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('enterpriseArchitectureModule.filterAllStatuses')}</option>
            {getStatuses().map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="catalog-tabs">
        <button 
          className={`catalog-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          💻 {t('enterpriseArchitectureModule.cmTabApplications')} ({applications.length})
        </button>
        <button 
          className={`catalog-tab ${activeTab === 'capabilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('capabilities')}
        >
          🏗️ {t('enterpriseArchitectureModule.cmTabCapabilities')} ({capabilities.length})
        </button>
        <button 
          className={`catalog-tab ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveTab('processes')}
        >
          🔄 {t('enterpriseArchitectureModule.cmTabProcesses')} ({processes.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="catalog-content">
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'capabilities' && renderCapabilities()}
        {activeTab === 'processes' && renderProcesses()}
      </div>

      {/* Create/Edit Form */}
      {renderCreateForm()}
    </div>
  );
}
