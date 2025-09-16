import React, { useState } from 'react';
import './AgentTheoryDocs.css';

const AgentTheoryDocs = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Datos de ejemplo - se reemplazarán con la información real del usuario
  const documentationData = {
    overview: {
      title: "Agent Theory & Documentation",
      description: "Comprehensive collection of AI agent theory, documentation, and web applications",
        stats: {
          totalDocs: 2,
          webApps: 16,
          examples: 3,
          lastUpdated: "Today"
        }
    },
    theory: {
      title: "Agent Theory",
      sections: [
        {
          title: "Getting Started Guides",
          items: [
            { 
              title: "Building your first AI Agent: A clear path!", 
              description: "Step-by-step methodology for building AI agents with practical approach", 
              status: "ready",
              content: {
                type: "article",
                author: "Practical Guide",
                keyPoints: [
                  "Pick a very small and very clear problem",
                  "Choose a base LLM (GPT, Claude, Gemini, LLaMA, Mistral)",
                  "Decide how the agent will interact with the outside world",
                  "Build the skeleton workflow (model → tool → result → model loop)",
                  "Add memory carefully (start with short-term context)",
                  "Wrap it in a usable interface",
                  "Iterate in small cycles",
                  "Keep the scope under control"
                ],
                coreLoop: "Model → Tool → Result → Model (the heartbeat of every agent)",
                advice: "The fastest way to learn is to build one specific agent, end-to-end. Once you've done that, making the next one becomes ten times easier."
              }
            },
            { 
              title: "7 AI Terms You Need to Know — Beyond the Basics", 
              description: "Enterprise-grade AI architecture terms for production systems", 
              status: "ready",
              content: {
                type: "article",
                author: "Alex Wang",
                source: "https://www.linkedin.com/pulse/7-ai-terms-you-need-know-beyond-basics-alex-wang-wmswc/",
                keyTerms: [
                  {
                    term: "Agentic AI",
                    definition: "Design philosophy where reasoning, memory, and actions run in loops until a goal is achieved",
                    useCase: "Customer support triage, ticket classification, incident response"
                  },
                  {
                    term: "Multi-Agent Orchestration", 
                    definition: "Networks of agents with distinct roles coordinating via shared protocols",
                    useCase: "Banking reporting tasks with planner, executor, and compliance agents"
                  },
                  {
                    term: "Mixture of Experts (MoE)",
                    definition: "Router activates only the 'experts' needed per token - saving compute",
                    useCase: "Multilingual support, domain-specific tasks (legal, technical)"
                  },
                  {
                    term: "Self-RAG vs Agentic RAG",
                    definition: "Self-RAG: model decides when/how to retrieve. Agentic RAG: retrieval as planned step in reasoning loop",
                    useCase: "Dynamic Q&A, policy research, complex troubleshooting"
                  },
                  {
                    term: "Autonomous Workflows",
                    definition: "Long-running processes with retries, escalations, approvals",
                    useCase: "Insurance: intake → verification → fraud check → payout"
                  },
                  {
                    term: "Trust Layers",
                    definition: "Safety, identity, policy, and observability baked into the stack",
                    useCase: "Healthcare PII redaction, compliance logging"
                  },
                  {
                    term: "AI-Native Protocols",
                    definition: "Standardize how agents, tools, and models communicate",
                    useCase: "JSON schemas, OpenAPI, MCP for model flexibility"
                  }
                ],
                keyInsight: "2025: We're shifting from models to systems - fast. For enterprises, that means building AI that's durable, governable, and reliable at scale."
              }
            }
          ]
        },
        {
          title: "Fundamental Concepts",
          items: [
            { title: "What are AI Agents?", description: "Basic definition and characteristics", status: "pending" },
            { title: "Agent Architectures", description: "Different architectural patterns", status: "pending" },
            { title: "Multi-Agent Systems", description: "Coordination and communication", status: "pending" }
          ]
        },
        {
          title: "Implementation Patterns",
          items: [
            { title: "ReAct Pattern", description: "Reasoning and Acting in language models", status: "pending" },
            { title: "Tool Use", description: "How agents interact with external tools", status: "pending" },
            { title: "Memory Systems", description: "Short and long-term memory for agents", status: "pending" }
          ]
        }
      ]
    },
    webApps: {
      title: "Web Applications & Examples",
      categories: [
        {
          name: "Hackathon Tools",
          apps: [
            { name: "Temporal AI", url: "https://temporal.io/ai/agentic-ai", description: "Durable Execution of tools, LLMs, and conversations. Simplifies workflows by managing state across single and multi-agent systems, ensuring massive scale and parallelism", status: "active" },
            { name: "OutSystems Agent Workbench", url: "https://www.outsystems.com/low-code-platform/agentic-ai-workbench", description: "Fuel enterprise innovation with custom agents. Create custom AI agents that streamline operations, elevate experiences, and grow revenue on the AI-powered low-code platform", status: "active" }
          ]
        },
        {
          name: "Business AI Agents",
          apps: [
            { name: "Bika.ai", url: "https://bika.ai/", description: "Organize your business with an AI agent that manages tasks, automations, databases, dashboards, and docs all in one place", status: "active" },
            { name: "Resea AI", url: "https://resea.ai/", description: "The World's First Academic Agent - handles research and writing tasks from start to finish", status: "active" },
            { name: "Momen", url: "http://go.momen.app/nocode", description: "No-code builder that lets non-technical founders turn app ideas into production-ready apps with UI, database, workflow, and AI", status: "active" },
            { name: "Mailgo", url: "http://aisecret.co/mailgo", description: "AI email platform that combines lead generation, inbox management, and automation for high-converting outreach campaigns", status: "active" },
            { name: "AutoBlocks", url: "https://shorturl.at/BdnyZ", description: "First agent simulation platform that helps AI teams prototype, test, and launch reliable AI agents at scale", status: "active" }
          ]
        },
        {
          name: "Automation & Workflow Agents",
          apps: [
            { name: "n8n.io", url: "https://n8n.io", description: "Flexible AI workflow automation for technical teams. Build with the precision of code or the speed of drag-n-drop. Host with on-prem control or in-the-cloud convenience", status: "active" },
            { name: "Zapier Agents", url: "https://zapier.com/agents", description: "Build custom AI agents in minutes using plain English to process leads, answer emails, manage calendars, and more", status: "active" },
            { name: "Kiva (Wellows)", url: "http://wellows.com", description: "AI-powered SEO agent that streamlines keyword research and content strategy with AI-driven insights", status: "active" },
            { name: "Taskade Agents", url: "http://taskade.com/agents", description: "AI-powered workspace that enables you to build, train, and deploy custom AI agents to automate tasks and enhance workflows", status: "active" },
            { name: "You.com", url: "http://you.com", description: "AI-powered agent that provides personalized search, content creation, and task automation", status: "active" }
          ]
        },
        {
          name: "Agent Frameworks",
          apps: [
            { name: "LangChain", url: "https://langchain.com", description: "Framework for developing applications with LLMs", status: "active" },
            { name: "AutoGen", url: "https://microsoft.github.io/autogen/", description: "Multi-agent conversation framework", status: "active" },
            { name: "CrewAI", url: "https://crewai.com", description: "Framework for orchestrating role-playing AI agents", status: "active" }
          ]
        },
        {
          name: "LLM Providers",
          apps: [
            { name: "OpenAI Assistants API", url: "https://platform.openai.com/docs/assistants", description: "OpenAI's agent platform", status: "active" },
            { name: "Anthropic Claude", url: "https://claude.ai", description: "Anthropic's AI assistant", status: "active" },
            { name: "Google Gemini", url: "https://gemini.google.com/", description: "Google's multimodal AI model", status: "active" }
          ]
        }
      ]
    },
    resources: {
      title: "Learning Resources",
      items: [
        { title: "Research Papers", count: 0, description: "Academic papers on agent theory" },
        { title: "Tutorials", count: 0, description: "Step-by-step guides" },
        { title: "Code Examples", count: 0, description: "Practical implementations" },
        { title: "Video Content", count: 3, description: "Educational videos and demos" }
      ],
      videos: [
        {
          title: "Temporal - Workflow Orchestration for AI Agents",
          description: "Essential tool for hackathon development of autonomous workflows and agent orchestration",
          url: "https://www.youtube.com/watch?v=GEXllEH2XiQ",
          platform: "YouTube",
          category: "Hackathon Tools",
          importance: "High - Required for competition"
        },
        {
          title: "OutSystems Agent Workbench - Introduction",
          description: "Short introduction to OutSystems Agent Workbench for agent development in hackathons",
          url: "https://www.youtube.com/watch?v=IXmCeAPX9GY",
          platform: "YouTube",
          category: "Hackathon Tools",
          importance: "High - Required for competition"
        },
        {
          title: "n8n Workflow Automation",
          description: "Essential workflow automation tool already integrated in our AgentOps Studio module",
          url: "https://www.youtube.com/watch?v=AURnISajubk",
          platform: "YouTube",
          category: "Integrated Tools",
          importance: "High - Currently in use"
        }
      ]
    }
  };

  const filteredData = (data) => {
    if (!searchTerm) return data;
    // Simple search implementation - can be enhanced
    return data;
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-number">{documentationData.overview.stats.totalDocs}</div>
          <div className="stat-label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-number">{documentationData.overview.stats.webApps}</div>
          <div className="stat-label">Web Apps</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💡</div>
          <div className="stat-number">{documentationData.overview.stats.examples}</div>
          <div className="stat-label">Examples</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🕒</div>
          <div className="stat-number">{documentationData.overview.stats.lastUpdated}</div>
          <div className="stat-label">Last Updated</div>
        </div>
      </div>
      
      <div className="welcome-message">
        <h3>Welcome to Agent Theory & Documentation</h3>
        <p>This section will contain all your accumulated knowledge about AI agents, including:</p>
        <ul>
          <li>📖 Theoretical foundations and concepts</li>
          <li>🛠️ Practical implementation guides</li>
          <li>🌐 Web applications and tools</li>
          <li>📝 Code examples and tutorials</li>
          <li>🔬 Research papers and studies</li>
        </ul>
        <p><strong>Ready to add your content!</strong> Share your documentation and I'll organize it here.</p>
      </div>
    </div>
  );

  const renderTheory = () => (
    <div className="theory-section">
      <h3>Agent Theory & Concepts</h3>
      {documentationData.theory.sections.map((section, index) => (
        <div key={index} className="theory-category">
          <h4>{section.title}</h4>
          <div className="theory-items">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="theory-item">
                <div className="item-header">
                  <h5>{item.title}</h5>
                  <span className={`status-badge ${item.status}`}>
                    {item.status === 'pending' ? '⏳ Pending' : '✅ Ready'}
                  </span>
                </div>
                <p>{item.description}</p>
                
                {item.content && item.status === 'ready' && (
                  <div className="article-content">
                    <div className="article-meta">
                      <span className="article-author">By: {item.content.author}</span>
                      <span className="article-type">{item.content.type}</span>
                    </div>
                    
                    {item.content.keyPoints && (
                      <div className="key-points">
                        <h6>Key Steps:</h6>
                        <ol>
                          {item.content.keyPoints.map((point, pointIndex) => (
                            <li key={pointIndex}>{point}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {item.content.keyTerms && (
                      <div className="key-terms">
                        <h6>7 Key Terms:</h6>
                        <div className="terms-grid">
                          {item.content.keyTerms.map((term, termIndex) => (
                            <div key={termIndex} className="term-card">
                              <h7 className="term-name">{term.term}</h7>
                              <p className="term-definition">{term.definition}</p>
                              <div className="term-use-case">
                                <strong>Use Case:</strong> {term.useCase}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.content.coreLoop && (
                      <div className="core-loop">
                        <h6>Core Loop:</h6>
                        <div className="loop-diagram">
                          {item.content.coreLoop}
                        </div>
                      </div>
                    )}
                    
                    {item.content.keyInsight && (
                      <div className="key-insight">
                        <h6>Key Insight:</h6>
                        <blockquote>{item.content.keyInsight}</blockquote>
                      </div>
                    )}
                    
                    {item.content.source && (
                      <div className="article-source">
                        <h6>Source:</h6>
                        <a href={item.content.source} target="_blank" rel="noopener noreferrer" className="source-link">
                          {item.content.source}
                        </a>
                      </div>
                    )}
                    
                    {item.content.advice && (
                      <div className="advice">
                        <h6>Key Advice:</h6>
                        <blockquote>{item.content.advice}</blockquote>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderWebApps = () => (
    <div className="webapps-section">
      <h3>Web Applications & Tools</h3>
      {documentationData.webApps.categories.map((category, index) => (
        <div key={index} className="webapp-category">
          <h4>{category.name}</h4>
          <div className="webapp-grid">
            {category.apps.map((app, appIndex) => (
              <div key={appIndex} className="webapp-card">
                <div className="webapp-header">
                  <h5>{app.name}</h5>
                  <span className={`status-badge ${app.status}`}>
                    {app.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                <p>{app.description}</p>
                <a href={app.url} target="_blank" rel="noopener noreferrer" className="webapp-link">
                  Visit Website →
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderResources = () => (
    <div className="resources-section">
      <h3>Learning Resources</h3>
      
      {/* Video Content Section */}
      {documentationData.resources.videos && documentationData.resources.videos.length > 0 && (
        <div className="videos-section">
          <h4>🎥 Video Content</h4>
          <div className="videos-grid">
            {documentationData.resources.videos.map((video, index) => (
              <div key={index} className="video-card">
                <div className="video-header">
                  <h5>{video.title}</h5>
                  <span className={`importance-badge ${video.importance.toLowerCase().includes('high') ? 'high' : 'medium'}`}>
                    {video.importance}
                  </span>
                </div>
                <p className="video-description">{video.description}</p>
                <div className="video-meta">
                  <span className="video-platform">📺 {video.platform}</span>
                  <span className="video-category">🏷️ {video.category}</span>
                </div>
                <a 
                  href={video.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="video-link"
                >
                  Watch Video →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Other Resources */}
      <div className="other-resources">
        <h4>📚 Other Resources</h4>
        <div className="resources-grid">
          {documentationData.resources.items.map((resource, index) => (
            <div key={index} className="resource-card">
              <div className="resource-icon">📁</div>
              <div className="resource-content">
                <h5>{resource.title}</h5>
                <div className="resource-count">{resource.count} items</div>
                <p>{resource.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="agent-theory-docs">
      <div className="docs-header">
        <h2>🤖 Agent Theory & Documentation</h2>
        <p>Comprehensive collection of AI agent knowledge and resources</p>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search documentation, apps, or concepts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-button">🔍</button>
        </div>
      </div>

      <div className="docs-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'theory' ? 'active' : ''}`}
          onClick={() => setActiveTab('theory')}
        >
          📚 Theory
        </button>
        <button 
          className={`tab-button ${activeTab === 'webapps' ? 'active' : ''}`}
          onClick={() => setActiveTab('webapps')}
        >
          🌐 Web Apps
        </button>
        <button 
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          📁 Resources
        </button>
      </div>

      <div className="docs-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'theory' && renderTheory()}
        {activeTab === 'webapps' && renderWebApps()}
        {activeTab === 'resources' && renderResources()}
      </div>
    </div>
  );
};

export default AgentTheoryDocs;
