// Example: Prompt Lab integrated with Robomind Clinic
import React, { useState } from 'react';
import { agentOpsClient } from '../lib/agentOpsClient';

export default function PromptLabWithClinic() {
  const [system, setSystem] = useState("You are a concise and helpful assistant.");
  const [user, setUser] = useState("Summarize https://www.volvocars.com in 5 bullet points.");
  const [model, setModel] = useState("qwen2.5-7b-instruct");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(512);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState(null);
  const [clinicStatus, setClinicStatus] = useState(null);

  const handleRun = async () => {
    if (!user.trim()) {
      alert("Please enter a user prompt");
      return;
    }

    setLoading(true);
    setRunId(null);
    setClinicStatus(null);
    
    try {
      // Generate a unique run ID for this session
      const newRunId = crypto.randomUUID();
      setRunId(newRunId);

      // Use the AgentOpsClient instead of direct API calls
      const response = await agentOpsClient.chat(newRunId, {
        userPrompt: user,
        systemMessage: system,
        model: model,
        temperature: temperature,
        max_tokens: maxTokens
      }, {
        module: 'prompt_lab',
        timestamp: new Date().toISOString()
      });

      setResult(response);
      setClinicStatus("✅ Processed through Robomind Clinic");
      
    } catch (error) {
      console.error('Error running prompt:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ 
        color: '#1f2937', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🧠 Prompt Lab with Robomind Clinic
        {clinicStatus && (
          <span style={{ 
            fontSize: '14px', 
            color: '#10b981',
            fontWeight: 'normal'
          }}>
            {clinicStatus}
          </span>
        )}
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            System Message:
          </label>
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            User Prompt:
          </label>
          <textarea
            value={user}
            onChange={(e) => setUser(e.target.value)}
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Model:
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          >
            <option value="qwen2.5-7b-instruct">Qwen2.5 7B</option>
            <option value="gpt-5.5">GPT-5.5</option>
            <option value="gpt-5.4-mini">GPT-5.4 mini</option>
            <option value="gpt-5.4-nano">GPT-5.4 nano</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Temperature:
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{temperature}</span>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Max Tokens:
          </label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Running...' : 'Run with Clinic'}
          </button>
        </div>
      </div>

      {runId && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <strong>Run ID:</strong> {runId}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>Result:</h3>
          <div style={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {result.output}
          </div>
        </div>
      )}
    </div>
  );
}
