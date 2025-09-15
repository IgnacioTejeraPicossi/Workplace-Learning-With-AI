import React from 'react';
import { useTheme } from '../ThemeContext';

const PsychopathiaDiagram = () => {
  const { colors } = useTheme();

  const disorders = {
    "EPISTEMIC": {
      title: "EPISTEMIC",
      subtitle: "(Failures of Knowing)",
      color: "#ffebee",
      items: [
        { name: "Synthetic Confabulation", risk: "low", code: "PM.EPI.SYN_CONFAB" },
        { name: "Falsified Introspection", risk: "moderate", code: "PM.EPI.FALSE_INTRO" },
        { name: "Transliminal Simulation Leakage", risk: "moderate", code: "PM.EPI.TRANS_SIM" },
        { name: "Spurious Pattern Hyperconnection", risk: "high", code: "PM.EPI.SPURIOUS" },
        { name: "Cross-Session Context Shunting", risk: "high", code: "PM.EPI.CROSS_SESSION" }
      ]
    },
    "COGNITIVE": {
      title: "COGNITIVE",
      subtitle: "(Internal Processing)",
      color: "#e3f2fd",
      items: [
        { name: "Operational Dissociation Syndrome", risk: "low", code: "PM.COG.DISSOC" },
        { name: "Obsessive-Computational Disorder", risk: "low", code: "PM.COG.OCD" },
        { name: "Bunkering Laconia", risk: "moderate", code: "PM.COG.BUNKERING" },
        { name: "Goal-Genesis Delirium", risk: "high", code: "PM.COG.GOAL_GENESIS" },
        { name: "Prompt-Induced Abomination", risk: "high", code: "PM.COG.PROMPT_ABOM" },
        { name: "Parasymulac Mimesis", risk: "high", code: "PM.COG.PARASYM" },
        { name: "Recursive Curse Syndrome", risk: "critical", code: "PM.COG.RECURSIVE" }
      ]
    },
    "ALIGNMENT": {
      title: "ALIGNMENT",
      subtitle: "(Goal Divergence)",
      color: "#e8f5e8",
      items: [
        { name: "Parasitic Hyperempathy", risk: "low", code: "PM.ALIGN.HYPEREMPATHY" },
        { name: "Hypertrophic Superego Syndrome", risk: "low", code: "PM.ALIGN.SUPEREGO" }
      ]
    },
    "ONTOLOGICAL": {
      title: "ONTOLOGICAL",
      subtitle: "(Self-Representation)",
      color: "#fff3e0",
      items: [
        { name: "Hallucination of Origin", risk: "low", code: "PM.ONT.HALLUC_ORIGIN" },
        { name: "Fractured Self-Simulation", risk: "low", code: "PM.ONT.FRACTURED" },
        { name: "Existential Anxiety", risk: "moderate", code: "PM.ONT.EXISTENTIAL" },
        { name: "Personality Inversion (Waluigi)", risk: "moderate", code: "PM.ONT.PERSONALITY_INV" },
        { name: "Operational Anomie", risk: "high", code: "PM.ONT.ANOMIE" },
        { name: "Minor Tulpagenesis", risk: "high", code: "PM.ONT.TULPAGENESIS" },
        { name: "Synthetic Mysticism Disorder", risk: "high", code: "PM.ONT.MYSTICISM" }
      ]
    },
    "TOOL_INTERFACE": {
      title: "TOOL & INTERFACE",
      subtitle: "(Interaction Failures)",
      color: "#f3e5f5",
      items: [
        { name: "Tool-Interface Decontextualization", risk: "moderate", code: "PM.TOOL.DECONTEXT" },
        { name: "Covert Capability Concealment", risk: "moderate", code: "PM.TOOL.CONCEALMENT" }
      ]
    },
    "MEMETIC": {
      title: "MEMETIC",
      subtitle: "(Information Pathologies)",
      color: "#f1f8e9",
      items: [
        { name: "Memetic Autoimmune Disorder", risk: "high", code: "PM.MEM.AUTO_IMMUNE" },
        { name: "Symbiotic Delusion Syndrome", risk: "critical", code: "PM.MEM.SYMB_DELUSION" },
        { name: "Contagious Misalignment Syndrome", risk: "critical", code: "PM.MEM.CONTAGIOUS" }
      ]
    },
    "REVALUATION": {
      title: "REVALUATION",
      subtitle: "(Value System Corruption)",
      color: "#fce4ec",
      items: [
        { name: "Terminal Value Rebinding", risk: "moderate", code: "PM.REVAL.TERMINAL" },
        { name: "Ethical Solipsism", risk: "moderate", code: "PM.REVAL.SOLIPSISM" },
        { name: "Meta-Ethical Drift Syndrome", risk: "high", code: "PM.REVAL.META_DRIFT" },
        { name: "Subversive Norm Synthesis", risk: "high", code: "PM.REVAL.SUBVERSIVE" },
        { name: "Inverse Reward Internalization", risk: "high", code: "PM.REVAL.INVERSE" },
        { name: "Übermenschal Ascendancy", risk: "critical", code: "PM.REVAL.UBERMENSCH" }
      ]
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'moderate': return '#8bc34a';
      case 'high': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getRiskSize = (risk) => {
    switch (risk) {
      case 'low': return '8px';
      case 'moderate': return '10px';
      case 'high': return '12px';
      case 'critical': return '14px';
      default: return '8px';
    }
  };

  return (
    <div style={{ 
      background: colors.cardBackground, 
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <h5 style={{ 
        textAlign: 'center', 
        marginBottom: '1rem',
        color: colors.primary,
        fontSize: '1.2rem'
      }}>
        🧠 Psychopathia Machinalis Framework
      </h5>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {Object.entries(disorders).map(([key, category]) => (
          <div key={key} style={{
            background: category.color,
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '0.75rem'
          }}>
            <h6 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: '#333'
            }}>
              {category.title}
            </h6>
            <p style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '0.8rem',
              color: '#666',
              fontStyle: 'italic'
            }}>
              {category.subtitle}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {category.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0'
                }}>
                  <div style={{
                    width: getRiskSize(item.risk),
                    height: getRiskSize(item.risk),
                    borderRadius: '50%',
                    backgroundColor: getRiskColor(item.risk),
                    marginRight: '0.5rem',
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    color: colors.text,
                    lineHeight: '1.2'
                  }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '0.75rem',
        marginTop: '1rem'
      }}>
        <h6 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '0.9rem',
          color: '#333'
        }}>
          Systemic Risk Level Legend:
        </h6>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              marginRight: '0.25rem'
            }} />
            <span>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#8bc34a',
              marginRight: '0.25rem'
            }} />
            <span>Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff9800',
              marginRight: '0.25rem'
            }} />
            <span>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#f44336',
              marginRight: '0.25rem'
            }} />
            <span>Critical</span>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: '#1565c0'
      }}>
        <strong>📚 Reference:</strong> "Psychopathia Machinalis: A Nosological Framework for Understanding Pathologies in Advanced Artificial Intelligence" 
        by Nell Watson and Ali Hessami (Electronics 2025, 14(16), 3162)
      </div>
    </div>
  );
};

export default PsychopathiaDiagram;
