import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import './ProcessDesigner.css';

// Custom Node Types
const CustomNode = ({ data, selected }) => {
  // Add safety check for data
  if (!data) {
    console.warn('CustomNode: data is undefined');
    return (
      <div className="custom-node error">
        <div className="node-icon">❌</div>
        <div className="node-label">Error</div>
      </div>
    );
  }

  return (
    <div className={`custom-node ${data.type || 'default'} ${selected ? 'selected' : ''}`}>
      <div className="node-icon">{data.icon || '📄'}</div>
      <div className="node-label">{data.label || 'Unnamed'}</div>
      {data.riskScore > 0 && (
        <div className="risk-indicator" style={{ 
          backgroundColor: data.riskScore > 70 ? '#dc3545' : data.riskScore > 40 ? '#ffc107' : '#28a745' 
        }}>
          {data.riskScore}%
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  start: CustomNode,
  task: CustomNode,
  decision: CustomNode,
  system: CustomNode,
  data: CustomNode,
  end: CustomNode,
  custom: CustomNode
};

export default function ProcessDesigner({ onSave, initialData = null }) {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [processName, setProcessName] = useState('');
  const [processDescription, setProcessDescription] = useState('');
  const [processCategory, setProcessCategory] = useState('General');
  const [processOwner, setProcessOwner] = useState('');
  const [processMaturity, setProcessMaturity] = useState(3);
  const [processRisk, setProcessRisk] = useState(0);
  const [showProperties, setShowProperties] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper function to get node icon
  const getNodeIcon = (type) => {
    const icons = {
      start: '🟢',
      task: '📋',
      decision: '❓',
      system: '💻',
      data: '🗄️',
      end: '🔴'
    };
    return icons[type] || '📄';
  };

  // Initialize with sample data if provided
  React.useEffect(() => {
    if (initialData) {
      console.log('Loading initial data:', initialData);
      
      // Convert database nodes to ReactFlow format
      const reactFlowNodes = (initialData.nodes || []).map(node => ({
        id: node.id,
        type: 'custom',
        position: node.position || { x: 100, y: 100 },
        data: {
          type: node.type,
          label: node.label,
          icon: getNodeIcon(node.type),
          appId: node.appId,
          trainingModuleId: node.trainingModuleId,
          riskScore: node.riskScore || 0
        }
      }));
      
      // Convert database edges to ReactFlow format
      const reactFlowEdges = (initialData.edges || []).map(edge => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        type: 'smoothstep'
      }));
      
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      setProcessName(initialData.name || '');
      setProcessDescription(initialData.description || '');
      setProcessCategory(initialData.category || 'General');
      setProcessOwner(initialData.owner || '');
      setProcessMaturity(initialData.maturity || 3);
      setProcessRisk(initialData.risk || 0);
      console.log('Loaded nodes:', reactFlowNodes);
      console.log('Loaded edges:', reactFlowEdges);
    }
  }, [initialData]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.arrowClosed },
      style: { strokeWidth: 2, stroke: '#667eea' }
    }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowProperties(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowProperties(false);
  }, []);

  // Add new node
  const addNode = (type, position) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: type,
      position: position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: type,
        icon: getNodeIcon(type),
        riskScore: 0,
        appId: null,
        trainingModuleId: null
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Update node properties
  const updateNodeProperties = (nodeId, updates) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
      setShowProperties(false);
    }
  };

  // Save process
  const saveProcess = async () => {
    if (!processName.trim()) {
      setError(t('enterpriseArchitectureModule.pdErrorNameRequired'));
      return;
    }

    if (nodes.length === 0) {
      setError(t('enterpriseArchitectureModule.pdErrorNodeRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const processData = {
        name: processName,
        description: processDescription,
        owner: processOwner || 'Current User',
        category: processCategory,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.type,
          label: node.data.label,
          appId: node.data.appId,
          trainingModuleId: node.data.trainingModuleId,
          riskScore: node.data.riskScore,
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          from: edge.source,
          to: edge.target,
          label: edge.label
        })),
        maturity: processMaturity,
        risk: processRisk
      };

      console.log('Saving process data:', processData);
      console.log('Nodes to save:', processData.nodes);
      console.log('Edges to save:', processData.edges);

      let response;
      if (initialData && initialData._id) {
        // Update existing process
        response = await axios.put(`/api/ea/processes/${initialData._id}`, processData);
      } else {
        // Create new process
        response = await axios.post('/api/ea/processes', processData);
      }
      
      if (response.data.success) {
        setSuccess(initialData ? t('enterpriseArchitectureModule.pdSuccessUpdated') : t('enterpriseArchitectureModule.pdSuccessSaved'));
        if (onSave) onSave(initialData ? initialData._id : response.data.process_id);
      }
    } catch (err) {
      console.error('Error saving process:', err);
      setError(t('enterpriseArchitectureModule.pdErrorSave', { detail: err.response?.data?.detail || err.message }));
    } finally {
      setLoading(false);
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="process-designer">
      {/* Header */}
      <div className="designer-header">
        <h2>🔄 {initialData ? t('enterpriseArchitectureModule.pdEditTitle') : t('enterpriseArchitectureModule.pdTitle')}</h2>
        <div className="header-actions">
          <button 
            className="save-btn"
            onClick={saveProcess}
            disabled={loading}
          >
            {loading ? `💾 ${t('enterpriseArchitectureModule.pdSaving')}` : (initialData ? `💾 ${t('enterpriseArchitectureModule.pdUpdateProcess')}` : `💾 ${t('enterpriseArchitectureModule.pdSaveProcess')}`)}
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="message error">
          <span>❌ {error}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {success && (
        <div className="message success">
          <span>✅ {success}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {/* Process Information Form */}
      <div className="process-info">
        <div className="form-row">
          <div className="form-group">
            <label>{t('enterpriseArchitectureModule.pdFieldProcessName')}</label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              placeholder={t('enterpriseArchitectureModule.pdPlaceholderProcName')}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>{t('enterpriseArchitectureModule.pdFieldCategory')}</label>
            <select
              value={processCategory}
              onChange={(e) => setProcessCategory(e.target.value)}
              className="form-select"
            >
              <option value="General">{t('enterpriseArchitectureModule.filterGeneral')}</option>
              <option value="Finance">{t('enterpriseArchitectureModule.filterFinance')}</option>
              <option value="HR">{t('enterpriseArchitectureModule.filterHR')}</option>
              <option value="IT">{t('enterpriseArchitectureModule.filterIT')}</option>
              <option value="Operations">{t('enterpriseArchitectureModule.filterOperations')}</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{t('enterpriseArchitectureModule.pdFieldDescription')}</label>
            <textarea
              value={processDescription}
              onChange={(e) => setProcessDescription(e.target.value)}
              placeholder={t('enterpriseArchitectureModule.pdPlaceholderDesc')}
              className="form-textarea"
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>{t('enterpriseArchitectureModule.pdFieldOwner')}</label>
            <input
              type="text"
              value={processOwner}
              onChange={(e) => setProcessOwner(e.target.value)}
              placeholder={t('enterpriseArchitectureModule.pdPlaceholderOwner')}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('enterpriseArchitectureModule.pdFieldMaturity', { value: processMaturity })}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={processMaturity}
              onChange={(e) => setProcessMaturity(parseInt(e.target.value))}
              className="form-range"
            />
          </div>
          <div className="form-group">
            <label>{t('enterpriseArchitectureModule.pdFieldRisk', { value: processRisk })}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={processRisk}
              onChange={(e) => setProcessRisk(parseInt(e.target.value))}
              className="form-range"
            />
          </div>
        </div>
      </div>

      <div className="designer-container">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-section">
            <h4>📦 {t('enterpriseArchitectureModule.pdAddNodes')}</h4>
            <div className="node-buttons">
              <button onClick={() => addNode('start')} className="node-btn start">
                🟢 {t('enterpriseArchitectureModule.pdNodeStart')}
              </button>
              <button onClick={() => addNode('task')} className="node-btn task">
                📋 {t('enterpriseArchitectureModule.pdNodeTask')}
              </button>
              <button onClick={() => addNode('decision')} className="node-btn decision">
                ❓ {t('enterpriseArchitectureModule.pdNodeDecision')}
              </button>
              <button onClick={() => addNode('system')} className="node-btn system">
                💻 {t('enterpriseArchitectureModule.pdNodeSystem')}
              </button>
              <button onClick={() => addNode('data')} className="node-btn data">
                💾 {t('enterpriseArchitectureModule.pdNodeData')}
              </button>
              <button onClick={() => addNode('end')} className="node-btn end">
                🔴 {t('enterpriseArchitectureModule.pdNodeEnd')}
              </button>
            </div>
          </div>

          <div className="toolbar-section">
            <h4>🔧 {t('enterpriseArchitectureModule.pdActions')}</h4>
            <button 
              onClick={deleteSelectedNode} 
              disabled={!selectedNode}
              className="action-btn delete"
            >
              🗑️ {t('enterpriseArchitectureModule.pdDeleteNode')}
            </button>
            <button 
              onClick={() => setNodes([])} 
              className="action-btn clear"
            >
              🧹 {t('enterpriseArchitectureModule.pdClearAll')}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="canvas-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {showProperties && selectedNode && (
          <div className="properties-panel">
            <div className="panel-header">
              <h4>⚙️ {t('enterpriseArchitectureModule.pdNodeProperties')}</h4>
              <button onClick={() => setShowProperties(false)} className="close-btn">
                ✕
              </button>
            </div>
            
            <div className="panel-content">
              <div className="property-group">
                <label>{t('enterpriseArchitectureModule.pdLabelLabel')}</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { label: e.target.value })}
                  className="property-input"
                />
              </div>

              <div className="property-group">
                <label>{t('enterpriseArchitectureModule.pdLabelRiskScore')}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedNode.data.riskScore}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { riskScore: parseInt(e.target.value) })}
                  className="property-range"
                />
                <span className="range-value">{selectedNode.data.riskScore}%</span>
              </div>

              <div className="property-group">
                <label>{t('enterpriseArchitectureModule.pdLabelAppId')}</label>
                <input
                  type="text"
                  value={selectedNode.data.appId || ''}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { appId: e.target.value })}
                  className="property-input"
                  placeholder={t('enterpriseArchitectureModule.pdPlaceholderLinkApp')}
                />
              </div>

              <div className="property-group">
                <label>{t('enterpriseArchitectureModule.pdLabelTrainingId')}</label>
                <input
                  type="text"
                  value={selectedNode.data.trainingModuleId || ''}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { trainingModuleId: e.target.value })}
                  className="property-input"
                  placeholder={t('enterpriseArchitectureModule.pdPlaceholderLinkTraining')}
                />
              </div>

              <div className="property-info">
                <p><strong>{t('enterpriseArchitectureModule.pdLabelType')}</strong> {selectedNode.data.type}</p>
                <p><strong>{t('enterpriseArchitectureModule.pdLabelPosition')}</strong> X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
