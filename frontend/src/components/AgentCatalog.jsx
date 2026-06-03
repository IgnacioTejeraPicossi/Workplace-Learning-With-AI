import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function AgentCatalog() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAgentCatalog();
  }, []);

  const loadAgentCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agents/catalog');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Error loading agent catalog:', err);
      setError(err instanceof Error ? err.message : t('agentopsStudio.agentCatalog.loadErrorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(t('agentopsStudio.agentCatalog.copiedToClipboard', { label }));
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert(t('agentopsStudio.agentCatalog.copyFailed'));
    }
  };

  const getModuleIcon = (module) => {
    switch (module) {
      case 'compliance': return '🛡️';
      case 'productivity': return '🚀';
      default: return '🤖';
    }
  };

  const getModuleColor = (module) => {
    switch (module) {
      case 'compliance': return '#3b82f6'; // Blue
      case 'productivity': return '#10b981'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>{t('agentopsStudio.agentCatalog.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p>Error: {error}</p>
        <button 
          onClick={loadAgentCatalog}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          {t('agentopsStudio.agentCatalog.retry')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📚 {t('agentopsStudio.agentCatalog.heading')}
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0
        }}>
          {t('agentopsStudio.agentCatalog.description')}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {items.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('agentopsStudio.agentCatalog.totalAgents')}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {items.filter(a => a.mcp?.endpoint).length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('agentopsStudio.agentCatalog.mcpEnabled')}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {new Set(items.flatMap(a => a.capabilities || [])).size}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('agentopsStudio.agentCatalog.uniqueCapabilities')}</div>
        </div>
      </div>

      {/* Agent Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {items.map((agent) => (
          <div key={agent.id} style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            padding: '1.5rem',
            transition: 'all 0.2s ease'
          }}>
            {/* Agent Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {getModuleIcon(agent.module)}
                </span>
                <div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {agent.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: getModuleColor(agent.module) + '20',
                      color: getModuleColor(agent.module),
                      fontWeight: '500'
                    }}>
                      {agent.module}
                    </span>
                    <span>v{agent.version}</span>
                  </div>
                </div>
              </div>
              
              {agent.mcp?.endpoint && (
                <button
                  onClick={() => copyToClipboard(agent.mcp.endpoint, 'MCP Endpoint')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {t('agentopsStudio.agentCatalog.copyMCP')}
                </button>
              )}
            </div>

            {/* Description — localized via i18n key keyed by agent.id, with
                fallback to the raw English description from the JSON descriptor
                if no translation is registered for this agent. Lets new agents
                appear in the catalog without breaking when their translations
                land later. */}
            {agent.description && (
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                {t(`agentopsStudio.agentCatalog.descriptions.${agent.id}`, { defaultValue: agent.description })}
              </p>
            )}

            {/* Capabilities */}
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {t('agentopsStudio.agentCatalog.capabilities')}
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem'
                }}>
                  {agent.capabilities.map((capability) => (
                    <span key={capability} style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      fontFamily: 'monospace'
                    }}>
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MCP Tools */}
            {agent.mcp?.tools && agent.mcp.tools.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {t('agentopsStudio.agentCatalog.mcpTools')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {agent.mcp.tools.map((tool, index) => (
                    <div key={index} style={{
                      padding: '0.25rem 0',
                      fontFamily: 'monospace'
                    }}>
                      • {tool.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policy */}
            {agent.policy && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#374151' }}>
                  {t('agentopsStudio.agentCatalog.policy')}
                </div>
                {agent.policy.allowed_jira_projects && (
                  <div>Jira: {agent.policy.allowed_jira_projects.join(', ')}</div>
                )}
                {agent.policy.allowed_slack_channels && (
                  <div>Slack: {agent.policy.allowed_slack_channels.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>{t('agentopsStudio.agentCatalog.noAgentsFound')}</p>
        </div>
      )}
    </div>
  );
}
