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
          examples: 5,
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
        hackathons: {
          title: "Upcoming Hackathons",
          events: [
            {
              id: "hackathon-1", 
              name: "OutSystems Low-Code Agent Builder Hackathon",
              organizer: "AVO Consulting, AWS, Innovation Pioneers & Cillers",
              date: "October 14, 2025",
              location: "AVO Consulting, Schweigaards Gate 16, 0190 Oslo, Norway",
              format: "In Person",
              challenge: "Build a tireless teammate that empowers your team to deliver better results more effectively",
              description: "Create custom AI solutions that transform team productivity. Build AI agents that handle repetitive tasks 24/7, freeing people for strategic work.",
              features: [
                "OutSystems low-code agent platform",
                "Compliant, secure and reliable agents",
                "Days to value development",
                "Enterprise-grade security and compliance",
                "Consistent governance across agents",
                "Built-in reliability and scalability",
                "Library of reusable components",
                "Advanced access control with unified auth",
                "Pre-built connectors to enterprise systems"
              ],
              jury: [
                "DNB Bank", "Aker BP", "Avinor", "Equinor", "Telenor", "Norsk Hydro",
                "Mowi", "Yara International", "Orkla", "Gjensidige Forsikring", 
                "Kongsberg Gruppen", "SalMar", "Storebrand", "SpareBank", "Schibsted"
              ],
              schedule: {
                "Oct 14": "08:30 - 20:30 (CET) - Full Day Event"
              },
              benefits: "Free of charge, breakfast, lunch, fika, dinner & beverages included",
              tools: ["OutSystems Agent Workbench", "AWS", "Low-code platform"],
              status: "upcoming"
            }
          ]
        },
        resources: {
          title: "Learning Resources",
          items: [
            { title: "Research Papers", count: 0, description: "Academic papers on agent theory" },
            { title: "Tutorials", count: 0, description: "Step-by-step guides" },
            { title: "Code Examples", count: 0, description: "Practical implementations" },
            { title: "Video Content", count: 4, description: "Educational videos and demos" },
            { title: "Hackathon Plans", count: 0, description: "Complete implementation plans for competitions" }
          ],
          videos: [
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
            },
            {
              title: "n8n Tutorial - Complete Workflow Automation Guide",
              description: "Comprehensive tutorial covering n8n workflow automation from basics to advanced features",
              url: "https://www.youtube.com/watch?v=Eh24sZWGxzA",
              platform: "YouTube",
              category: "Learning Resources",
              importance: "High - Essential for n8n mastery"
            },
            {
              title: "n8n Advanced Workflows - AI Integration & Automation",
              description: "Advanced n8n techniques for AI agent integration and complex workflow automation",
              url: "https://www.youtube.com/watch?v=Eh24sZWGxzA",
              platform: "YouTube",
              category: "Learning Resources",
              importance: "High - Advanced n8n techniques"
            }
          ],
          hackathonPlans: []
        },
        toolStack: {
          title: "The Ultimate Tool Stack for AI Agents",
          description: "Comprehensive collection of tools and platforms for building, deploying, and managing AI agents across all development stages",
          categories: [
            {
              id: "orchestration-platforms",
              name: "Orchestration Platforms",
              focus: "Run and scale AI agents in real workflows",
              color: "#3498db",
              icon: "🎯",
              tools: [
                {
                  name: "LangChain Hub",
                  description: "Share agent workflows and prompts",
                  category: "Orchestration",
                  importance: "High"
                },
                {
                  name: "Make.com",
                  description: "Visual no-code orchestrator for agents & APIs",
                  category: "Orchestration",
                  importance: "High"
                },
                {
                  name: "n8n",
                  description: "Node-based automation builder integrating AI workflows",
                  category: "Orchestration",
                  importance: "High"
                },
                {
                  name: "Reka",
                  description: "Agent flow manager with task tracking",
                  category: "Orchestration",
                  importance: "Medium"
                },
                {
                  name: "CrewAI + LangGraph",
                  description: "Hybrid orchestration using graphs",
                  category: "Orchestration",
                  importance: "High"
                },
                {
                  name: "PromptLayer",
                  description: "Manage, version, and observe prompt performance",
                  category: "Orchestration",
                  importance: "Medium"
                },
                {
                  name: "Cognosys",
                  description: "Autonomous agent deployment with memory",
                  category: "Orchestration",
                  importance: "Medium"
                },
                {
                  name: "Flowise",
                  description: "Drag-and-drop visual builder for agent apps",
                  category: "Orchestration",
                  importance: "High"
                }
              ]
            },
            {
              id: "tool-use-api-integration",
              name: "Tool Use & API Integration",
              focus: "Tools that enable agents to interact with real-world APIs and platforms",
              color: "#2ecc71",
              icon: "🔧",
              tools: [
                {
                  name: "BrowserPilot",
                  description: "Agent-powered browser automation",
                  category: "API Integration",
                  importance: "High"
                },
                {
                  name: "AutoGPT Plugins",
                  description: "Modular tool expansion for AutoGPT agents",
                  category: "API Integration",
                  importance: "Medium"
                },
                {
                  name: "SerpAPI",
                  description: "Real-time search tool for web-enabled agents",
                  category: "API Integration",
                  importance: "High"
                },
                {
                  name: "ShellGPT",
                  description: "Terminal-based shell interaction via agents",
                  category: "API Integration",
                  importance: "Medium"
                },
                {
                  name: "OpenAI Functions",
                  description: "Native tool-use via function calling",
                  category: "API Integration",
                  importance: "High"
                },
                {
                  name: "Anthropic Tools",
                  description: "Claude's API calling interface",
                  category: "API Integration",
                  importance: "High"
                },
                {
                  name: "LangChain Tools",
                  description: "Pre-built wrappers for APIs and utilities",
                  category: "API Integration",
                  importance: "High"
                },
                {
                  name: "Zapier AI Actions",
                  description: "Connect LLMs with 6000+ apps",
                  category: "API Integration",
                  importance: "High"
                }
              ]
            },
            {
              id: "agent-safety-guardrails",
              name: "Agent Safety & Guardrails",
              focus: "Ensure secure, ethical, and reliable agent behavior",
              color: "#27ae60",
              icon: "🛡️",
              tools: [
                {
                  name: "PromptLayer Monitor",
                  description: "Audit and inspect prompt behavior",
                  category: "Safety",
                  importance: "High"
                },
                {
                  name: "TruLens",
                  description: "Evaluate agent outputs for accuracy, toxicity, etc.",
                  category: "Safety",
                  importance: "High"
                },
                {
                  name: "HumanLoop",
                  description: "Add human-in-the-loop to AI pipelines",
                  category: "Safety",
                  importance: "High"
                },
                {
                  name: "Aegis AI",
                  description: "Agent security and safety evaluation suite",
                  category: "Safety",
                  importance: "Medium"
                },
                {
                  name: "GuardrailsAI",
                  description: "Add safety, validation, and structure to LLM outputs",
                  category: "Safety",
                  importance: "High"
                },
                {
                  name: "Llama Guard",
                  description: "Meta's open-source moderation for agents",
                  category: "Safety",
                  importance: "Medium"
                },
                {
                  name: "Rebuff",
                  description: "Protect agents from prompt injection",
                  category: "Safety",
                  importance: "High"
                },
                {
                  name: "Prompt Armor",
                  description: "Prompt sanitizer & security wrapper",
                  category: "Safety",
                  importance: "Medium"
                }
              ]
            },
            {
              id: "agent-frameworks",
              name: "Agent Frameworks",
              focus: "Building, orchestrating, and managing AI agents with multi-step reasoning",
              color: "#f39c12",
              icon: "🤖",
              tools: [
                {
                  name: "LangChain",
                  description: "Modular framework for LLM apps with agent/tool integration",
                  category: "Framework",
                  importance: "High"
                },
                {
                  name: "AutoGen",
                  description: "Microsoft's multi-agent conversation framework",
                  category: "Framework",
                  importance: "High"
                },
                {
                  name: "CrewAI",
                  description: "Role-based multi-agent collaboration platform",
                  category: "Framework",
                  importance: "High"
                },
                {
                  name: "LangGraph",
                  description: "Graph-based agent orchestration atop LangChain",
                  category: "Framework",
                  importance: "High"
                },
                {
                  name: "MetaGPT",
                  description: "Agents with SOP-style team collaboration",
                  category: "Framework",
                  importance: "Medium"
                },
                {
                  name: "AgentOps",
                  description: "Platform for testing, evaluating, and deploying agents",
                  category: "Framework",
                  importance: "High"
                },
                {
                  name: "Camel AI",
                  description: "Role-based roleplay between agents for task planning",
                  category: "Framework",
                  importance: "Medium"
                },
                {
                  name: "SuperAgent",
                  description: "Plug-and-play agent development with integrations",
                  category: "Framework",
                  importance: "Medium"
                }
              ]
            },
            {
              id: "multi-agent-collaboration",
              name: "Multi-Agent Collaboration",
              focus: "Allow agents to talk, delegate, and collaborate on tasks",
              color: "#9b59b6",
              icon: "👥",
              tools: [
                {
                  name: "AutoGen Agents",
                  description: "Role-based agent dialogue with memory",
                  category: "Collaboration",
                  importance: "High"
                },
                {
                  name: "CrewAI Roles",
                  description: "Assign manager, developer, critic, etc.",
                  category: "Collaboration",
                  importance: "High"
                },
                {
                  name: "Camel Agents",
                  description: "Simulate structured conversations for brainstorming",
                  category: "Collaboration",
                  importance: "Medium"
                },
                {
                  name: "MetaGPT",
                  description: "Hierarchical collaboration with defined work roles",
                  category: "Collaboration",
                  importance: "Medium"
                },
                {
                  name: "LangGraph Multi-Agent",
                  description: "Directed graphs for collaborative agent paths",
                  category: "Collaboration",
                  importance: "High"
                },
                {
                  name: "AutoGPT Chains",
                  description: "Sequential task breakdowns with multiple agents",
                  category: "Collaboration",
                  importance: "Medium"
                },
                {
                  name: "OpenAgents",
                  description: "Collaborative execution with chat interfaces",
                  category: "Collaboration",
                  importance: "Medium"
                },
                {
                  name: "Devika",
                  description: "AI software developer agent using collaborative planning",
                  category: "Collaboration",
                  importance: "Medium"
                }
              ]
            },
            {
              id: "memory-vector-databases",
              name: "Memory & Vector Databases",
              focus: "Store and retrieve long-term context and facts",
              color: "#8e44ad",
              icon: "🧠",
              tools: [
                {
                  name: "Pinecone",
                  description: "High-performance vector DB for fast semantic search",
                  category: "Database",
                  importance: "High"
                },
                {
                  name: "Weaviate",
                  description: "Modular, schema-flexible vector DB",
                  category: "Database",
                  importance: "High"
                },
                {
                  name: "Chroma",
                  description: "Open-source embedding DB, works well with LangChain",
                  category: "Database",
                  importance: "High"
                },
                {
                  name: "FAISS",
                  description: "Facebook's open-source vector search library",
                  category: "Database",
                  importance: "High"
                },
                {
                  name: "Milvus",
                  description: "Scalable, GPU-accelerated vector DB",
                  category: "Database",
                  importance: "Medium"
                },
                {
                  name: "Redis Vector Store",
                  description: "In-memory DB with vector support",
                  category: "Database",
                  importance: "Medium"
                },
                {
                  name: "Zep",
                  description: "Memory backend for conversational agents",
                  category: "Database",
                  importance: "Medium"
                },
                {
                  name: "Qdrant",
                  description: "Production-ready open-source vector engine",
                  category: "Database",
                  importance: "High"
                }
              ]
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

  const renderHackathons = () => (
    <div className="hackathons-section">
      <h3>🏆 Upcoming Hackathons</h3>
      <p className="section-description">
        Detailed information about the hackathons we'll be participating in. 
        This information is available for Ignacio, Cursor AI, and ChatGPT5 to help with implementation planning.
      </p>
      
      {documentationData.hackathons.events.map((hackathon, index) => (
        <div key={hackathon.id} className="hackathon-card">
          <div className="hackathon-header">
            <h4>{hackathon.name}</h4>
            <span className={`status-badge ${hackathon.status}`}>
              {hackathon.status === 'upcoming' ? '📅 Upcoming' : '✅ Completed'}
            </span>
          </div>
          
          <div className="hackathon-meta">
            <div className="meta-item">
              <strong>📅 Date:</strong> {hackathon.date}
            </div>
            <div className="meta-item">
              <strong>📍 Location:</strong> {hackathon.location}
            </div>
            <div className="meta-item">
              <strong>🏢 Organizer:</strong> {hackathon.organizer}
            </div>
            <div className="meta-item">
              <strong>💻 Format:</strong> {hackathon.format}
            </div>
          </div>

          <div className="hackathon-challenge">
            <h5>🎯 Challenge</h5>
            <p>{hackathon.challenge}</p>
            <p className="challenge-description">{hackathon.description}</p>
          </div>

          {hackathon.examples && (
            <div className="hackathon-examples">
              <h5>💡 Example Workflows</h5>
              <ul className="examples-list">
                {hackathon.examples.map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          {hackathon.features && (
            <div className="hackathon-features">
              <h5>🔧 Platform Features</h5>
              <ul className="features-list">
                {hackathon.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="hackathon-schedule">
            <h5>⏰ Schedule</h5>
            {Object.entries(hackathon.schedule).map(([day, time]) => (
              <div key={day} className="schedule-item">
                <strong>{day}:</strong> {time}
              </div>
            ))}
          </div>

          <div className="hackathon-tools">
            <h5>🛠️ Recommended Tools</h5>
            <div className="tools-tags">
              {hackathon.tools.map((tool, idx) => (
                <span key={idx} className="tool-tag">{tool}</span>
              ))}
            </div>
          </div>

          <div className="hackathon-jury">
            <h5>👥 Jury & Executives</h5>
            <div className="jury-grid">
              {hackathon.jury.map((company, idx) => (
                <span key={idx} className="jury-company">{company}</span>
              ))}
            </div>
          </div>

          <div className="hackathon-benefits">
            <h5>🎁 Benefits</h5>
            <p>{hackathon.benefits}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderToolStack = () => (
    <div className="tool-stack-section">
      <div className="tool-stack-header">
        <h3>{documentationData.toolStack.title}</h3>
        <p className="tool-stack-description">{documentationData.toolStack.description}</p>
      </div>
      
      <div className="tool-stack-overview">
        <div className="overview-stats">
          <div className="stat-card">
            <div className="stat-number">{documentationData.toolStack.categories.length}</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {documentationData.toolStack.categories.reduce((total, category) => total + category.tools.length, 0)}
            </div>
            <div className="stat-label">Tools</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {documentationData.toolStack.categories.reduce((total, category) => 
                total + category.tools.filter(tool => tool.importance === 'High').length, 0)}
            </div>
            <div className="stat-label">Essential Tools</div>
          </div>
        </div>
      </div>

      <div className="categories-grid">
        {documentationData.toolStack.categories.map((category, index) => (
          <div key={category.id} className="category-card" style={{ borderLeftColor: category.color }}>
            <div className="category-header">
              <div className="category-icon">{category.icon}</div>
              <div className="category-info">
                <h4>{category.name}</h4>
                <p className="category-focus">{category.focus}</p>
              </div>
            </div>
            
            <div className="tools-grid">
              {category.tools.map((tool, toolIndex) => (
                <div key={toolIndex} className="tool-card">
                  <div className="tool-header">
                    <h5>{tool.name}</h5>
                    <span className={`importance-badge ${tool.importance.toLowerCase()}`}>
                      {tool.importance}
                    </span>
                  </div>
                  <p className="tool-description">{tool.description}</p>
                  <div className="tool-category">{tool.category}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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
      
      {/* Hackathon Plans Section */}
      {documentationData.resources.hackathonPlans && documentationData.resources.hackathonPlans.length > 0 && (
        <div className="hackathon-plans-section">
          <h4>🏆 Hackathon Implementation Plans</h4>
          <div className="hackathon-plans-grid">
            {documentationData.resources.hackathonPlans.map((plan, index) => (
              <div key={plan.id} className="hackathon-plan-card">
                <div className="plan-header">
                  <h5>{plan.title}</h5>
                  <span className={`status-badge ${plan.status}`}>
                    {plan.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="plan-meta">
                  <div className="plan-hackathon">🏆 {plan.hackathon}</div>
                  <div className="plan-date">📅 {plan.date}</div>
                  <div className="plan-location">📍 {plan.location}</div>
                </div>
                
                <p className="plan-description">{plan.description}</p>
                
                {/* MVP Section */}
                <div className="plan-section">
                  <h6>🎯 MVP Use Case</h6>
                  <p className="mvp-use-case">{plan.mvp.useCase}</p>
                  <div className="mvp-features">
                    <div className="mvp-feature">
                      <strong>Key Feature:</strong> {plan.mvp.keyFeature}
                    </div>
                    <div className="mvp-showcase">
                      <strong>Showcase:</strong> {plan.mvp.showcase}
                    </div>
                  </div>
                </div>
                
                {/* Architecture Section */}
                <div className="plan-section">
                  <h6>🏗️ Architecture</h6>
                  <div className="architecture-grid">
                    <div className="arch-item">
                      <strong>Backend:</strong> {plan.architecture.backend}
                    </div>
                    <div className="arch-item">
                      <strong>LLM:</strong> {plan.architecture.llm}
                    </div>
                    <div className="arch-item">
                      <strong>Database:</strong> {plan.architecture.database}
                    </div>
                    <div className="arch-item">
                      <strong>Orchestration:</strong> {plan.architecture.orchestration}
                    </div>
                  </div>
                </div>
                
                {/* Execution Plan */}
                <div className="plan-section">
                  <h6>📋 Execution Plan</h6>
                  <div className="execution-days">
                    <div className="execution-day">
                      <h7>Day 1 - Build and Wire Up MVP</h7>
                      <ul>
                        {plan.executionPlan.day1.map((task, taskIndex) => (
                          <li key={taskIndex}>{task}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="execution-day">
                      <h7>Day 2 - Resilience & Demo Polish</h7>
                      <ul>
                        {plan.executionPlan.day2.map((task, taskIndex) => (
                          <li key={taskIndex}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Code Structure */}
                <div className="plan-section">
                  <h6>💻 Code Structure</h6>
                  <div className="code-structure">
                    <div className="code-category">
                      <strong>Temporal:</strong>
                      <ul>
                        {plan.codeStructure.temporal.map((file, fileIndex) => (
                          <li key={fileIndex}>{file}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="code-category">
                      <strong>Docker:</strong>
                      <ul>
                        {plan.codeStructure.docker.map((file, fileIndex) => (
                          <li key={fileIndex}>{file}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="code-category">
                      <strong>Integration:</strong>
                      <ul>
                        {plan.codeStructure.integration.map((file, fileIndex) => (
                          <li key={fileIndex}>{file}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Demo Script */}
                <div className="plan-section">
                  <h6>🎬 Demo Script (5 Min)</h6>
                  <ol className="demo-script">
                    {plan.demoScript.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                {/* Tools & Features */}
                <div className="plan-section">
                  <h6>🛠️ Tools & Features</h6>
                  <div className="tools-features">
                    <div className="tools-list">
                      <strong>Tools:</strong>
                      <ul>
                        {plan.tools.map((tool, toolIndex) => (
                          <li key={toolIndex}>{tool}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="features-list">
                      <strong>Features:</strong>
                      <ul>
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
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
          className={`tab-button ${activeTab === 'toolstack' ? 'active' : ''}`}
          onClick={() => setActiveTab('toolstack')}
        >
          🛠️ Tool Stack
        </button>
        <button 
          className={`tab-button ${activeTab === 'webapps' ? 'active' : ''}`}
          onClick={() => setActiveTab('webapps')}
        >
          🌐 Web Apps
        </button>
        <button 
          className={`tab-button ${activeTab === 'hackathons' ? 'active' : ''}`}
          onClick={() => setActiveTab('hackathons')}
        >
          🏆 Hackathons
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
        {activeTab === 'toolstack' && renderToolStack()}
        {activeTab === 'webapps' && renderWebApps()}
        {activeTab === 'hackathons' && renderHackathons()}
        {activeTab === 'resources' && renderResources()}
      </div>
    </div>
  );
};

export default AgentTheoryDocs;
