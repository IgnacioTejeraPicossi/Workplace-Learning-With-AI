import React, { useState } from 'react';
import Overview from './Overview';
import FlowCatalog from './FlowCatalog';
import RunBuilder from './RunBuilder';
import Runs from './Runs';
import Settings from './Settings';

export default function AgentOps() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    {
      id: 'Overview',
      label: 'Overview',
      icon: '📊',
      description: 'Dashboard with KPIs, run history, and data analytics. View performance metrics and export results.'
    },
    {
      id: 'FlowCatalog',
      label: 'Flow Catalog',
      icon: '📋',
      description: 'Register and manage n8n workflows. Add webhook URLs, configure input schemas, and version flows.'
    },
    {
      id: 'RunBuilder',
      label: 'Run Builder',
      icon: '🚀',
      description: 'Create and execute workflow runs. Select flows, configure inputs, and monitor execution progress.'
    },
    {
      id: 'Runs',
      label: 'Runs',
      icon: '📈',
      description: 'Monitor and analyze workflow executions. View logs, filter results, and track performance metrics.'
    },
    {
      id: 'Settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'Configure API settings, HMAC secrets, connection parameters, and system preferences.'
    }
  ];

  // Example data for demonstration
  const exampleData = {
    flow: {
      name: "Web Research Agent",
      n8n_webhook_url: "https://your-n8n-instance.com/webhook/agentops-web-research",
      description: "Research topics using web content and LM Studio analysis",
      version: "1.0.0"
    },
    run: {
      input: {
        url: "https://www.tetrapak.com/en",
        topic: "Sustainable packaging for electronics",
        depth: 2,
        model: "qwen2.5-7b-instruct",
        lm_base: "http://localhost:1234/v1/chat/completions",
        callback_url: "http://localhost:5000/api/agentops/callback/FLOW_ID"
      }
    }
  };

  const runCompleteExample = async () => {
    setIsLoading(true);
    
    try {
      // Simulate the complete workflow
      console.log('🚀 Starting AgentOps Complete Example...');
      
      // Step 1: Register the example flow
      console.log('📋 Step 1: Registering example flow...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Start a run with example data
      console.log('🚀 Step 2: Starting example run...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 3: Simulate workflow execution
      console.log('⚙️ Step 3: Executing n8n workflow...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Show results
      console.log('✅ Step 4: Workflow completed successfully!');
      
      // Switch to Runs tab to show the result
      setActiveTab('Runs');
      
      alert('🎉 Example completed! Check the Runs tab to see the results.');
      
    } catch (error) {
      console.error('Error running example:', error);
      alert('Error running example: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Overview':
        return <Overview onRunExample={runCompleteExample} isLoading={isLoading} />;
      case 'FlowCatalog':
        return <FlowCatalog onLoadExample={() => {
          // Load example flow data
          console.log('Loading example flow data:', exampleData.flow);
        }} />;
      case 'RunBuilder':
        return <RunBuilder onLoadExample={() => {
          // Load example run data
          console.log('Loading example run data:', exampleData.run);
        }} />;
      case 'Runs':
        return <Runs />;
      case 'Settings':
        return <Settings />;
      default:
        return <Overview onRunExample={runCompleteExample} isLoading={isLoading} />;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🤖 AgentOps Orchestrator (n8n Bridge)
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              Orchestrate n8n workflows with AI agents. Start workflows, monitor runs, and manage flows.
            </p>
          </div>
          <button
            onClick={runCompleteExample}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isLoading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              marginLeft: '1rem'
            }}
          >
            {isLoading ? '⏳ Running Example...' : '🚀 Run Complete Example'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.description}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#374151',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === tab.id ? '2px solid #1d4ed8' : '2px solid transparent'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {renderActiveTab()}
      </div>
    </div>
  );
}
