// AgentOps Studio - Playbook Component
import React, { useState, useEffect } from 'react';
import { Digital, Playbooks, Flows, Runs, Settings } from './agentopsApi';

export default function Playbook() {
  const [name, setName] = useState("Web Research Brief");
  const [description, setDescription] = useState("Fetch → Extract → Summarize");
  const [task, setTask] = useState({
    name: "Competitive Snapshot",
    description: "Generate a one-page Markdown brief",
    inputs: {},
    actions: [
      { type: "fetch_url", params: { url: "https://www.volvocars.com" } },
      { type: "extract_text", params: { max_chars: 15000 } },
      { type: "prompt_chain", params: { 
        model: "qwen2.5-7b-instruct", 
        prompt: "Summarize into markdown with headings & bullets." 
      }}
    ]
  });

  const [twin, setTwin] = useState({
    name: "Research Analyst",
    skills: ["web_research", "summarization"],
    policies: {
      respect_robots: true,
      rate_limit_rps: 1,
      allowed_domains: [],
      blocked_domains: []
    }
  });

  const [plan, setPlan] = useState(null);
  const [safety, setSafety] = useState(null);
  const [sim, setSim] = useState(null);
  const [judge, setJudge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  
  // Destinations state
  const [destinations, setDestinations] = useState({
    sheets: { enabled: false, spreadsheetId: "", sheetName: "Reports" },
    slack:  { enabled: false, webhook_url: "", message_template: "✅ Report ready: {{topic}} (score: {{score}})" },
    email:  { enabled: false, to: "", subject_template: "Report ready: {{topic}}" }
  });

  useEffect(() => {
    loadFlows();
    loadSettings();
  }, []);

  const loadFlows = async () => {
    try {
      const response = await Flows.list();
      setFlows(response.items || []);
    } catch (error) {
      console.error('Error loading flows:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await Settings.get();
      setDestinations(prev => ({
        sheets: {
          enabled: !!settings.destinations_enabled_by_default,
          spreadsheetId: settings.default_spreadsheet_id || prev.sheets.spreadsheetId,
          sheetName: settings.default_sheet_name || prev.sheets.sheetName
        },
        slack: {
          enabled: !!settings.destinations_enabled_by_default && !!settings.default_slack_webhook_url,
          webhook_url: settings.default_slack_webhook_url || prev.slack.webhook_url,
          message_template: prev.slack.message_template
        },
        email: {
          enabled: !!settings.destinations_enabled_by_default && !!settings.default_email_to,
          to: settings.default_email_to || prev.email.to,
          subject_template: settings.default_email_subject_tpl || prev.email.subject_template
        }
      }));
      // Preselect default flow
      if (settings.default_flow_id) {
        setSelectedFlowId(settings.default_flow_id);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const runPipeline = async () => {
    setLoading(true);
    try {
      const response = await Digital.pipeline({ twin, task });
      setPlan(response.plan);
      setSafety(response.safety);
      setSim(response.sim);
      setJudge(response.judge);
    } catch (error) {
      console.error('Error running pipeline:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    try {
      const doc = await Playbooks.save({ name, description, task });
      alert(`Saved playbook: ${doc._id || "success"}`);
    } catch (error) {
      console.error('Error saving playbook:', error);
      alert(`Error saving: ${error.message}`);
    }
  };

  const executeViaAgentOps = async () => {
    if (!selectedFlowId) {
      alert("Please select a Flow first");
      return;
    }

    const input = mapTaskToWebResearchInput(task, destinations);
    if (!input.url) {
      alert("No URL found in actions. Add at least one fetch_url action.");
      return;
    }

    try {
      const response = await Runs.start({ flow_id: selectedFlowId, input });
      alert(`Started AgentOps run: ${response.run_id}`);
    } catch (error) {
      console.error('Error starting run:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const mapTaskToWebResearchInput = (task, destinations) => {
    const urls = (task.actions || [])
      .filter(a => a.type === "fetch_url" && a.params?.url)
      .map(a => a.params.url);
    
    const promptStep = (task.actions || []).find(a => a.type === "prompt_chain");
    const model = promptStep?.params?.model || "qwen2.5-7b-instruct";
    const prompt = promptStep?.params?.prompt || "";
    
    return {
      // core
      url: urls[0] || task.inputs?.url || "",
      extra_urls: urls.slice(1),
      topic: task.description || task.name || "Untitled task",
      depth: task.inputs?.depth || 1,
      model,
      prompt_override: prompt || null,
      lm_base: process.env.REACT_APP_LMSTUDIO_BASE || "http://localhost:1234/v1/chat/completions",
      callback_url: `${process.env.REACT_APP_API_BASE_URL}/api/runs/callback/${selectedFlowId}`,

      // NEW: destinations (n8n checks each flag)
      destinations: {
        sheets_append: {
          enabled: !!destinations?.sheets?.enabled,
          spreadsheetId: destinations?.sheets?.spreadsheetId || "",
          sheetName: destinations?.sheets?.sheetName || "Reports",
        },
        slack_notify: {
          enabled: !!destinations?.slack?.enabled,
          webhook_url: destinations?.slack?.webhook_url || "",
          message_template: destinations?.slack?.message_template ||
            "✅ *Report ready*: {{topic}} (score: {{score}})"
        },
        email_send: {
          enabled: !!destinations?.email?.enabled,
          to: destinations?.email?.to || "",
          subject_template: destinations?.email?.subject_template ||
            "Report ready: {{topic}}",
          include_markdown: true
        }
      }
    };
  };

  const updateAction = (index, field, value) => {
    const newActions = [...task.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setTask({ ...task, actions: newActions });
  };

  const updateParam = (index, key, value) => {
    const newActions = [...task.actions];
    newActions[index] = {
      ...newActions[index],
      params: { ...(newActions[index].params || {}), [key]: value }
    };
    setTask({ ...task, actions: newActions });
  };

  const addAction = () => {
    setTask({
      ...task,
      actions: [...task.actions, { type: "fetch_url", params: { url: "" } }]
    });
  };

  const removeAction = (index) => {
    const newActions = [...task.actions];
    newActions.splice(index, 1);
    setTask({ ...task, actions: newActions });
  };

  const actionTypes = [
    "fetch_url", "extract_text", "prompt_chain", "classify", 
    "transform", "http_request", "write_file", "send_webhook"
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '600', 
        marginBottom: '2rem',
        color: '#1e293b'
      }}>
        📋 Task Playbook
      </h2>

      {/* Toolbar */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={runPipeline}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? '⏳' : '🚀'} Run One-Click: Plan → Safety → Sim
          </button>

          <button
            onClick={saveToDB}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            💾 Save to DB
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={selectedFlowId}
              onChange={(e) => setSelectedFlowId(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Select Flow (n8n)</option>
              {flows.map(flow => (
                <option key={flow._id} value={flow._id}>{flow.name}</option>
              ))}
            </select>

            <button
              onClick={executeViaAgentOps}
              disabled={!selectedFlowId}
              style={{
                backgroundColor: !selectedFlowId ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: !selectedFlowId ? 'not-allowed' : 'pointer'
              }}
            >
              🔄 Execute via AgentOps
            </button>
          </div>
        </div>
      </div>

      {/* Destinations Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
          Destinations
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Google Sheets */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={destinations.sheets.enabled}
                onChange={e => setDestinations({...destinations, sheets: {...destinations.sheets, enabled: e.target.checked}})}
              />
              <span style={{ fontWeight: '500' }}>Google Sheets</span>
            </label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', marginBottom: '0.5rem' }}
              placeholder="Spreadsheet ID"
              value={destinations.sheets.spreadsheetId}
              onChange={e => setDestinations({...destinations, sheets: {...destinations.sheets, spreadsheetId: e.target.value}})}
            />
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              placeholder="Sheet name"
              value={destinations.sheets.sheetName}
              onChange={e => setDestinations({...destinations, sheets: {...destinations.sheets, sheetName: e.target.value}})}
            />
          </div>

          {/* Slack */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={destinations.slack.enabled}
                onChange={e => setDestinations({...destinations, slack: {...destinations.slack, enabled: e.target.checked}})}
              />
              <span style={{ fontWeight: '500' }}>Slack</span>
            </label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', marginBottom: '0.5rem' }}
              placeholder="Incoming Webhook URL"
              value={destinations.slack.webhook_url}
              onChange={e => setDestinations({...destinations, slack: {...destinations.slack, webhook_url: e.target.value}})}
            />
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              placeholder="Message template"
              value={destinations.slack.message_template}
              onChange={e => setDestinations({...destinations, slack: {...destinations.slack, message_template: e.target.value}})}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={destinations.email.enabled}
                onChange={e => setDestinations({...destinations, email: {...destinations.email, enabled: e.target.checked}})}
              />
              <span style={{ fontWeight: '500' }}>Email</span>
            </label>
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', marginBottom: '0.5rem' }}
              placeholder="To email"
              value={destinations.email.to}
              onChange={e => setDestinations({...destinations, email: {...destinations.email, to: e.target.value}})}
            />
            <input 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              placeholder="Subject template"
              value={destinations.email.subject_template}
              onChange={e => setDestinations({...destinations, email: {...destinations.email, subject_template: e.target.value}})}
            />
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Task Configuration */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Task Configuration
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Playbook Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Task Name
            </label>
            <input
              type="text"
              value={task.name}
              onChange={(e) => setTask({ ...task, name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Task Description
            </label>
            <textarea
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
              🤖 Software Twin: {twin.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Skills: {twin.skills.join(', ')}
            </div>
          </div>
        </div>

        {/* Actions Editor */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              Actions
            </h3>
            <button
              onClick={addAction}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add Action
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {task.actions.map((action, index) => (
              <div key={index} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, "type", e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    {actionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeAction(index)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  {Object.entries(action.params || {}).map(([key, value]) => (
                    <div key={key}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>
                        {key}
                      </div>
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => updateParam(index, key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {(plan || safety || sim || judge) && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Pipeline Results
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {plan && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  📋 Plan
                </h4>
                <pre style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(plan, null, 2)}
                </pre>
              </div>
            )}

            {safety && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  🛡️ Safety
                </h4>
                <pre style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(safety, null, 2)}
                </pre>
              </div>
            )}

            {sim && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  🎮 Simulation
                </h4>
                <pre style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(sim, null, 2)}
                </pre>
              </div>
            )}

            {judge && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  ⭐ Judge
                </h4>
                <pre style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(judge, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
