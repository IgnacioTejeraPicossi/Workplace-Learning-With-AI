import React, { useState, useCallback, useRef } from 'react';
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
const CustomNode = ({ data, selected }) => (
  <div className={`custom-node ${data.type} ${selected ? 'selected' : ''}`}>
    <div className="node-icon">{data.icon}</div>
    <div className="node-label">{data.label}</div>
    {data.riskScore > 0 && (
      <div className="risk-indicator" style={{ 
        backgroundColor: data.riskScore > 70 ? '#dc3545' : data.riskScore > 40 ? '#ffc107' : '#28a745' 
      }}>
        {data.riskScore}%
      </div>
    )}
  </div>
);

const nodeTypes = {
  start: CustomNode,
  task: CustomNode,
  decision: CustomNode,
  system: CustomNode,
  data: CustomNode,
  end: CustomNode
};

export default function ProcessDesigner({ onSave, initialData = null }) {
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

  // Initialize with sample data if provided
  React.useEffect(() => {
    if (initialData) {
      setNodes(initialData.nodes || []);
      setEdges(initialData.edges || []);
      setProcessName(initialData.name || '');
      setProcessDescription(initialData.description || '');
      setProcessCategory(initialData.category || 'General');
      setProcessOwner(initialData.owner || '');
      setProcessMaturity(initialData.maturity || 3);
      setProcessRisk(initialData.risk || 0);
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

  // Get node icon
  const getNodeIcon = (type) => {
    const icons = {
      start: '🟢',
      task: '📋',
      decision: '❓',
      system: '💻',
      data: '💾',
      end: '🔴'
    };
    return icons[type] || '📄';
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
      setError('Process name is required');
      return;
    }

    if (nodes.length === 0) {
      setError('Process must have at least one node');
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

      const response = await axios.post('/api/ea/processes', processData);
      
      if (response.data.success) {
        setSuccess('Process saved successfully!');
        if (onSave) onSave(response.data.process_id);
      }
    } catch (err) {
      console.error('Error saving process:', err);
      setError('Failed to save process: ' + (err.response?.data?.detail || err.message));
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
        <h2>🔄 Process Designer</h2>
        <div className="header-actions">
          <button 
            className="save-btn"
            onClick={saveProcess}
            disabled={loading}
          >
            {loading ? '💾 Saving...' : '💾 Save Process'}
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
            <label>Process Name *</label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              placeholder="Enter process name"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={processCategory}
              onChange={(e) => setProcessCategory(e.target.value)}
              className="form-select"
            >
              <option value="General">General</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={processDescription}
              onChange={(e) => setProcessDescription(e.target.value)}
              placeholder="Describe the process"
              className="form-textarea"
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>Owner</label>
            <input
              type="text"
              value={processOwner}
              onChange={(e) => setProcessOwner(e.target.value)}
              placeholder="Process owner"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Maturity Level: {processMaturity}/5</label>
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
            <label>Risk Level: {processRisk}%</label>
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
            <h4>📦 Add Nodes</h4>
            <div className="node-buttons">
              <button onClick={() => addNode('start')} className="node-btn start">
                🟢 Start
              </button>
              <button onClick={() => addNode('task')} className="node-btn task">
                📋 Task
              </button>
              <button onClick={() => addNode('decision')} className="node-btn decision">
                ❓ Decision
              </button>
              <button onClick={() => addNode('system')} className="node-btn system">
                💻 System
              </button>
              <button onClick={() => addNode('data')} className="node-btn data">
                💾 Data
              </button>
              <button onClick={() => addNode('end')} className="node-btn end">
                🔴 End
              </button>
            </div>
          </div>

          <div className="toolbar-section">
            <h4>🔧 Actions</h4>
            <button 
              onClick={deleteSelectedNode} 
              disabled={!selectedNode}
              className="action-btn delete"
            >
              🗑️ Delete Node
            </button>
            <button 
              onClick={() => setNodes([])} 
              className="action-btn clear"
            >
              🧹 Clear All
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
              <h4>⚙️ Node Properties</h4>
              <button onClick={() => setShowProperties(false)} className="close-btn">
                ✕
              </button>
            </div>
            
            <div className="panel-content">
              <div className="property-group">
                <label>Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { label: e.target.value })}
                  className="property-input"
                />
              </div>

              <div className="property-group">
                <label>Risk Score (%)</label>
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
                <label>Application ID</label>
                <input
                  type="text"
                  value={selectedNode.data.appId || ''}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { appId: e.target.value })}
                  className="property-input"
                  placeholder="Link to application"
                />
              </div>

              <div className="property-group">
                <label>Training Module ID</label>
                <input
                  type="text"
                  value={selectedNode.data.trainingModuleId || ''}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { trainingModuleId: e.target.value })}
                  className="property-input"
                  placeholder="Link to training module"
                />
              </div>

              <div className="property-info">
                <p><strong>Type:</strong> {selectedNode.data.type}</p>
                <p><strong>Position:</strong> X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
