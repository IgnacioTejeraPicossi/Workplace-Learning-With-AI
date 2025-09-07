// AgentOps Studio - Prompt Lab Component
import React, { useState } from 'react';
import { Prompt } from './agentopsApi';

export default function PromptLab() {
  const [system, setSystem] = useState("You are a concise and helpful assistant.");
  const [user, setUser] = useState("Summarize https://www.volvocars.com in 5 bullet points.");
  const [model, setModel] = useState("qwen2.5-7b-instruct");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(512);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!user.trim()) {
      alert("Please enter a user prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await Prompt.run({
        system,
        user,
        model,
        temperature,
        max_tokens: maxTokens
      });
      setResult(response);
    } catch (error) {
      console.error('Error running prompt:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (ok) => {
    return ok ? '#10b981' : '#ef4444';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '600', 
        marginBottom: '2rem',
        color: '#1e293b'
      }}>
        🧪 Prompt Lab
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Input Panel */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Prompt Configuration
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              System Message
            </label>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                minHeight: '80px'
              }}
              placeholder="Enter system message..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              User Prompt
            </label>
            <textarea
              value={user}
              onChange={(e) => setUser(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                minHeight: '120px'
              }}
              placeholder="Enter your prompt..."
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="4000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? '⏳ Running...' : '🚀 Run Prompt'}
          </button>
        </div>

        {/* Results Panel */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Results
          </h3>

          {result ? (
            <div>
              {/* Safety Status */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                  <span style={{ fontWeight: '500' }}>Safety Check</span>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: getStatusColor(result.safety?.ok) + '20',
                    color: getStatusColor(result.safety?.ok)
                  }}>
                    {result.safety?.ok ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                {result.safety?.findings?.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                    {result.safety.findings.map((finding, i) => (
                      <div key={i}>• {finding}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Score */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⭐</span>
                  <span style={{ fontWeight: '500' }}>Quality Score</span>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: getScoreColor(result.judge?.score) + '20',
                    color: getScoreColor(result.judge?.score)
                  }}>
                    {result.judge?.score || 0}/100
                  </span>
                </div>
              </div>

              {/* Response */}
              {result.result && (
                <div>
                  <div style={{ 
                    fontWeight: '500', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>🤖</span>
                    AI Response
                    {result.result.latency_s && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b',
                        fontWeight: '400'
                      }}>
                        ({result.result.latency_s}s)
                      </span>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                  }}>
                    {result.result.text}
                  </div>
                </div>
              )}

              {/* Error */}
              {result.judge?.error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.9rem'
                }}>
                  <strong>Error:</strong> {result.judge.error}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧪</div>
              <p>Run a prompt to see results here</p>
            </div>
          )}
        </div>
      </div>

      {/* Example Prompts */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
          💡 Example Prompts
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
              Web Research
            </h4>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
              Research and summarize a website
            </p>
            <button
              onClick={() => setUser("Research https://www.openai.com and provide a summary of their main products and services.")}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Use This
            </button>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
              Code Analysis
            </h4>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
              Analyze and explain code
            </p>
            <button
              onClick={() => setUser("Explain this Python function: def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)")}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Use This
            </button>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>
              Creative Writing
            </h4>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
              Generate creative content
            </p>
            <button
              onClick={() => setUser("Write a short story about a robot learning to paint.")}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Use This
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
