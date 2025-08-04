import React from 'react';
import { useTheme } from './ThemeContext';

function FutureApp({ onSectionSelect }) {
  const { colors } = useTheme();

  const phaseLinks = [
    {
      phase: "1",
      title: "Unknown Intent Logger",
      mainFeature: "Logs and classifies user ideas",
      feasibility: "High",
      status: "Live",
      color: "#4caf50",
      section: "idea-log"
    },
    {
      phase: "2", 
      title: "Clarifying Q&A",
      mainFeature: "Ask follow-ups before discard",
      feasibility: "High",
      status: "Live",
      color: "#ff9800",
      section: null
    },
    {
      phase: "3",
      title: "Evolution Panel", 
      mainFeature: "Suggest future features, upvotes, notifications",
      feasibility: "High",
      status: "Live",
      color: "#ff5722",
      section: "feature-roadmap"
    },
    {
      phase: "4",
      title: "Cursor-Driven Scaffolds",
      mainFeature: "AI codegen, scaffold history, admin approval", 
      feasibility: "High",
      status: "Live",
      color: "#2196f3",
      section: "feature-roadmap"
    },
    {
      phase: "5",
      title: "Real-Time Code Integration",
      mainFeature: "Update system instantly",
      feasibility: "Low (R&D)",
      status: "Planned",
      color: "#f44336",
      section: null
    }
  ];

  const handlePhaseClick = (section) => {
    if (section && onSectionSelect) {
      onSectionSelect(section);
    }
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text, marginBottom: "2rem" }}>🔮 Future App Vision</h2>
      
      {/* Summary Table */}
      <div style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: colors.text, marginBottom: "1rem" }}>Development Roadmap</h3>
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: 12, 
          padding: "1.5rem",
          boxShadow: colors.shadow,
          overflowX: "auto"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ textAlign: "left", padding: "0.75rem", color: colors.textSecondary }}>Phase</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: colors.textSecondary }}>Title</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: colors.textSecondary }}>Main Feature</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: colors.textSecondary }}>Feasibility</th>
                <th style={{ textAlign: "left", padding: "0.75rem", color: colors.textSecondary }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {phaseLinks.map((phase, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      background: phase.color,
                      color: "white",
                      fontSize: "0.9rem",
                      fontWeight: "bold"
                    }}>
                      {phase.phase}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {phase.section ? (
                      <button
                        onClick={() => handlePhaseClick(phase.section)}
                        style={{
                          background: "none",
                          border: "none",
                          color: colors.primary,
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontSize: "inherit",
                          padding: 0,
                          fontFamily: "inherit"
                        }}
                      >
                        {phase.title}
                      </button>
                    ) : (
                      <span style={{ color: colors.text }}>{phase.title}</span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem", color: colors.text }}>{phase.mainFeature}</td>
                  <td style={{ 
                    padding: "0.75rem", 
                    color: phase.feasibility.includes("High") ? "#4caf50" : "#f44336",
                    fontWeight: "500"
                  }}>
                    {phase.feasibility}
                  </td>
                  <td style={{ 
                    padding: "0.75rem", 
                    color: phase.status === "Live" ? "#4caf50" : colors.textSecondary,
                    fontWeight: "500"
                  }}>
                    {phase.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phase 5 Preview */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: 12, 
        padding: "2rem",
        boxShadow: colors.shadow
      }}>
        <h3 style={{ color: colors.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🔮 Phase 5 Preview: Real-Time Dynamic Feature Activation
        </h3>
        
        <p style={{ color: colors.text, marginBottom: "2rem", lineHeight: 1.6 }}>
          The future of adaptive, self-evolving applications. Watch as user ideas become live features in real-time.
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ color: colors.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🏗️ Technical Architecture
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <div style={{ 
              background: colors.background, 
              padding: "1.5rem", 
              borderRadius: 8, 
              border: `1px solid ${colors.border}`,
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧠</div>
              <h5 style={{ color: colors.text, marginBottom: "0.5rem" }}>Cursor AI + Scaffolding</h5>
              <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
                Generate backend/frontend/test/docs code
              </p>
            </div>
            
            <div style={{ 
              background: colors.background, 
              padding: "1.5rem", 
              borderRadius: 8, 
              border: `1px solid ${colors.border}`,
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🐛</div>
              <h5 style={{ color: colors.text, marginBottom: "0.5rem" }}>Bugbot Integration</h5>
              <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
                Catch runtime and build-time errors in AI code
              </p>
            </div>
            
            <div style={{ 
              background: colors.background, 
              padding: "1.5rem", 
              borderRadius: 8, 
              border: `1px solid ${colors.border}`,
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔄</div>
              <h5 style={{ color: colors.text, marginBottom: "0.5rem" }}>Hot Reloading</h5>
              <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
                Inject new code without full restart
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ color: colors.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🎬 Live Demo Preview
          </h4>
          <div style={{ 
            background: colors.background, 
            padding: "1.5rem", 
            borderRadius: 8, 
            border: `1px solid ${colors.border}`,
            fontFamily: "monospace",
            fontSize: "0.9rem",
            color: colors.textSecondary
          }}>
            <div style={{ marginBottom: "0.5rem" }}>$ user: "Add a new learning module"</div>
            <div style={{ marginBottom: "0.5rem" }}>🤖 AI: "Generating scaffold for 'learning-module'..."</div>
            <div style={{ marginBottom: "0.5rem" }}>🔧 Creating: React component, API route, tests...</div>
            <div style={{ marginBottom: "0.5rem" }}>✅ Hot-reloading new feature...</div>
            <div style={{ color: "#4caf50" }}>🎉 Feature live! Try it now.</div>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ color: colors.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            💼 Business Impact
          </h4>
          <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: "1.5rem" }}>
            <li><strong>Adaptive Applications:</strong> Software that evolves with user needs</li>
            <li><strong>Zero-Downtime Updates:</strong> Features appear instantly without deployment</li>
            <li><strong>AI-Driven Development:</strong> Natural language to working code</li>
            <li><strong>User-Centric Evolution:</strong> Features built from real user feedback</li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: colors.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🗺️ Implementation Roadmap
          </h4>
          <div style={{ 
            background: colors.background, 
            padding: "1.5rem", 
            borderRadius: 8, 
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: "0.9rem"
          }}>
            <div style={{ marginBottom: "0.5rem" }}><strong>Phase 5.1:</strong> Sandboxed code execution</div>
            <div style={{ marginBottom: "0.5rem" }}><strong>Phase 5.2:</strong> Real-time state synchronization</div>
            <div style={{ marginBottom: "0.5rem" }}><strong>Phase 5.3:</strong> Hot-reload UI components</div>
            <div style={{ marginBottom: "0.5rem" }}><strong>Phase 5.4:</strong> Rollback and safety controls</div>
            <div style={{ color: colors.textSecondary, fontStyle: "italic" }}>
              Estimated timeline: 6-12 months (R&D phase)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FutureApp; 