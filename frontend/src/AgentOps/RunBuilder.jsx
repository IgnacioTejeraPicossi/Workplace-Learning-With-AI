import React, { useState, useEffect } from 'react';
import { get, post } from './agentopsApi';

export default function RunBuilder({ onLoadExample }) {
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState('');
  const [inputJson, setInputJson] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunId, setLastRunId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const res = await get('/flows');
      setFlows(res.items || []);
    } catch (error) {
      console.error('Error loading flows:', error);
      setError('Failed to load flows: ' + error.message);
    }
  };

  const handleFlowChange = (flowId) => {
    setSelectedFlow(flowId);
    setError('');
    
    // Load example input for the selected flow
    const flow = flows.find(f => f._id === flowId);
    if (flow) {
      setInputJson(JSON.stringify(getExampleInput(flow.name), null, 2));
    }
  };

  const getExampleInput = (flowName) => {
    if (flowName.toLowerCase().includes('web research') || flowName.toLowerCase().includes('research')) {
      return {
        url: "https://www.tetrapak.com/en",
        topic: "Sustainable packaging for electronics",
        depth: 2,
        model: "qwen2.5-7b-instruct",
        lm_base: "http://localhost:1234/v1/chat/completions",
        callback_url: "http://localhost:5000/api/agentops/callback/FLOW_ID"
      };
    } else if (flowName.toLowerCase().includes('humanoid') || flowName.toLowerCase().includes('chain')) {
      return {
        twin: {
          human_role: "Warehouse Picker",
          skills: ["object_detection", "precision_gripping", "path_planning"],
          constraints: {
            max_load: 5.0,
            max_reach: 1.2,
            max_speed: 2.5,
            precision_tolerance: 0.01
          },
          environment: {
            zone: "A1-Shelf-3",
            shelf_height: 1.8,
            lighting: "LED_high",
            temperature: 22.5
          }
        },
        task: {
          name: "Pick and Pack Electronics",
          description: "Pick electronic components from shelf A1-Shelf-3, perform quality inspection, and pack them safely for shipping",
          steps: [
            "Navigate to shelf A1-Shelf-3",
            "Scan and identify target components",
            "Grip components with precision",
            "Perform quality inspection",
            "Pack components safely",
            "Update inventory system",
            "Return to base station"
          ],
          quality_goal: "balanced"
        },
        context: {
          e_stop: true,
          safe_zone_cleared: true,
          payload_within_limit: true,
          payload_weight: 1.5
        },
        callback_url: "http://localhost:5000/api/agentops/callback/FLOW_ID"
      };
    } else {
      return {
        example: "Replace this with your input data",
        data: "Any JSON structure your workflow expects"
      };
    }
  };

  const validateJson = (jsonString) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const startRun = async () => {
    if (!selectedFlow) {
      setError('Please select a flow');
      return;
    }

    if (!inputJson.trim()) {
      setError('Please provide input JSON');
      return;
    }

    if (!validateJson(inputJson)) {
      setError('Invalid JSON format');
      return;
    }

    try {
      setIsRunning(true);
      setError('');
      
      const inputData = JSON.parse(inputJson);
      const response = await post('/runs/start', {
        flow_id: selectedFlow,
        input: inputData
      });
      
      setLastRunId(response.run_id);
      
      // Show success message
      alert(`Run started successfully! Run ID: ${response.run_id}`);
      
    } catch (error) {
      console.error('Error starting run:', error);
      setError('Failed to start run: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const copyRunId = () => {
    if (lastRunId) {
      navigator.clipboard.writeText(lastRunId);
      alert('Run ID copied to clipboard!');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🚀 Run Builder
        </h2>
        <p style={{ color: '#6b7280' }}>
          Create and execute workflow runs. Select flows, configure inputs, and monitor execution progress.
        </p>
      </div>

      {/* Flow Selection */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          Select Flow
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Available Flows
            </label>
            <select
              value={selectedFlow}
              onChange={(e) => handleFlowChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a flow...</option>
              {flows.map(flow => (
                <option key={flow._id} value={flow._id}>
                  {flow.name} (v{flow.version})
                </option>
              ))}
            </select>
          </div>

          {selectedFlow && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '0.375rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
                <strong>Selected Flow:</strong> {flows.find(f => f._id === selectedFlow)?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0c4a6e', marginTop: '0.25rem' }}>
                {flows.find(f => f._id === selectedFlow)?.description || 'No description available'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Configuration */}
      {selectedFlow && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
            Input Configuration
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Input JSON
              </label>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  minHeight: '300px',
                  resize: 'vertical'
                }}
                placeholder="Enter your input JSON here..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setInputJson(JSON.stringify(getExampleInput(flows.find(f => f._id === selectedFlow)?.name), null, 2))}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                🔄 Reset to Example
              </button>
              
              {onLoadExample && (
                <button
                  onClick={onLoadExample}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  🎯 Load Example
                </button>
              )}
              
              <button
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(JSON.parse(inputJson), null, 2);
                    setInputJson(formatted);
                  } catch (e) {
                    alert('Invalid JSON format');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                🎨 Format JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.375rem',
          padding: '1rem',
          color: '#dc2626'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Display */}
      {lastRunId && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '0.375rem',
          padding: '1rem',
          color: '#059669'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>✅ Run Started Successfully!</strong>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Run ID: <code style={{ fontFamily: 'monospace', backgroundColor: '#e5e7eb', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{lastRunId}</code>
              </div>
            </div>
            <button
              onClick={copyRunId}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              📋 Copy Run ID
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            setSelectedFlow('');
            setInputJson('');
            setError('');
            setLastRunId(null);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          🗑️ Clear All
        </button>
        
        <button
          onClick={startRun}
          disabled={isRunning || !selectedFlow || !inputJson.trim() || !validateJson(inputJson)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isRunning || !selectedFlow || !inputJson.trim() || !validateJson(inputJson) ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: isRunning || !selectedFlow || !inputJson.trim() || !validateJson(inputJson) ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isRunning ? '⏳ Starting Run...' : '🚀 Start Run'}
        </button>
      </div>
    </div>
  );
}
