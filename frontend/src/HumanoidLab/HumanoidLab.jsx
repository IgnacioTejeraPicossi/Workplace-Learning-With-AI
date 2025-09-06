// Human+Humanoid Lab - Main Component
import React, { useState } from "react";
import Overview from "./Overview";
import TwinBuilder from "./TwinBuilder";
import TaskPlaybook from "./TaskPlaybook";
import SimArena from "./SimArena";
import TeleopConsole from "./TeleopConsole";
import SafetyEthics from "./SafetyEthics";

export default function HumanHumanoidLab() {
  const [activeTab, setActiveTab] = useState("Overview");
  
  // State for the humanoid lab workflow
  const [twin, setTwin] = useState({
    human_role: "Operator",
    skills: ["picking", "navigation"],
    constraints: { 
      max_load: 8.0, 
      max_reach: 1.1,
      max_height: 1.8
    },
    environment: { 
      zone: "A1", 
      shelf_height: 1.6,
      lighting: "good"
    }
  });
  
  const [task, setTask] = useState({
    name: "Shelf Replenishment",
    description: "Pick item from shelf A1 and place into bin B2",
    steps_hint: [
      "Navigate to shelf A1",
      "Detect target item with camera",
      "Grip item with appropriate force",
      "Lift item to safe height",
      "Navigate to bin B2",
      "Place item in target location",
      "Verify placement success"
    ],
    safety_requirements: [
      "E-stop accessible",
      "Safe zone cleared",
      "Payload within limit"
    ]
  });
  
  const [plan, setPlan] = useState(null);
  const [sim, setSim] = useState(null);
  const [safety, setSafety] = useState(null);
  const [judge, setJudge] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Example data for demonstration
  const exampleData = {
    twin: {
      human_role: "Warehouse Picker",
      skills: ["object_detection", "precision_gripping", "path_planning", "quality_inspection"],
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
        temperature: 22.5,
        obstacles: ["conveyor_belt", "safety_barrier"]
      }
    },
    task: {
      name: "Pick and Pack Electronics",
      description: "Retrieve electronic components from shelf A1-3, perform quality inspection, and pack them in protective containers for shipping. Ensure proper handling of fragile items and verify part numbers match the order.",
      steps_hint: [
        "Navigate to shelf A1-3",
        "Scan barcode for item verification", 
        "Carefully grip the electronic component",
        "Perform visual quality inspection",
        "Place in anti-static container",
        "Seal container and apply shipping label",
        "Update inventory system"
      ],
      safety_requirements: [
        "Anti-static wrist strap required",
        "Verify no personnel in work zone",
        "Check component temperature before handling",
        "Ensure proper lighting for inspection"
      ]
    }
  };

  const tabs = [
    { 
      id: "Overview", 
      label: "Overview", 
      icon: "📊",
      description: "Dashboard with KPIs, run history, and data analytics. View performance metrics and export results."
    },
    { 
      id: "TwinBuilder", 
      label: "Twin Builder", 
      icon: "👤",
      description: "Configure your digital twin: human role, skills, physical constraints, and environment settings."
    },
    { 
      id: "TaskPlaybook", 
      label: "Task Playbook", 
      icon: "📋",
      description: "Define tasks and generate AI-powered execution plans. Create step-by-step workflows for humanoid operations."
    },
    { 
      id: "SimArena", 
      label: "Sim Arena", 
      icon: "🎮",
      description: "Run realistic simulations of planned tasks. View telemetry data and performance metrics in real-time."
    },
    { 
      id: "TeleopConsole", 
      label: "Teleop Console", 
      icon: "🎛️",
      description: "Control humanoid robots remotely. Send commands, monitor status, and manage teleoperation operations."
    },
    { 
      id: "SafetyEthics", 
      label: "Safety & Ethics", 
      icon: "🛡️",
      description: "Evaluate safety compliance and ethical considerations. Run risk assessments and safety checks before execution."
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const loadExampleData = () => {
    setTwin(exampleData.twin);
    setTask(exampleData.task);
  };

  const runCompleteExample = async () => {
    setIsLoading(true);
    try {
      // Load example data
      loadExampleData();
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate plan
      const planResponse = await fetch('/api/humanoid/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twin: exampleData.twin,
          task: exampleData.task,
          quality_goal: "balanced"
        })
      });
      const planData = await planResponse.json();
      setPlan(planData.plan);
      
      // Wait and simulate
      await new Promise(resolve => setTimeout(resolve, 1000));
      const simResponse = await fetch('/api/humanoid/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planData.plan })
      });
      const simData = await simResponse.json();
      setSim(simData);
      
      // Wait and safety check
      await new Promise(resolve => setTimeout(resolve, 1000));
      const safetyResponse = await fetch('/api/humanoid/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: planData.plan,
          sim: simData,
          twin: exampleData.twin,
          context: {
            e_stop: true,
            safe_zone_cleared: true,
            payload_within_limit: true,
            payload_weight: 1.5
          }
        })
      });
      const safetyData = await safetyResponse.json();
      setSafety(safetyData);
      
      // Wait and judge
      await new Promise(resolve => setTimeout(resolve, 1000));
      const judgeResponse = await fetch('/api/humanoid/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: planData.plan,
          sim: simData,
          safety: safetyData
        })
      });
      const judgeData = await judgeResponse.json();
      setJudge(judgeData);
      
      // Switch to Overview to show results
      setActiveTab("Overview");
      
    } catch (error) {
      console.error('Error running example:', error);
      alert('Error running example. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwinUpdate = (updatedTwin) => {
    setTwin(updatedTwin);
  };

  const handleTaskUpdate = (updatedTask) => {
    setTask(updatedTask);
  };

  const handlePlanGenerated = (generatedPlan) => {
    setPlan(generatedPlan);
  };

  const handleSimulationComplete = (simResult) => {
    setSim(simResult);
  };

  const handleSafetyCheck = (safetyResult) => {
    setSafety(safetyResult);
  };

  const handleJudgeComplete = (judgeResult) => {
    setJudge(judgeResult);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <Overview 
            plan={plan}
            sim={sim}
            safety={safety}
            judge={judge}
            onRefresh={() => {
              // Refresh data logic
            }}
          />
        );
      case "TwinBuilder":
        return (
          <TwinBuilder 
            twin={twin}
            onTwinUpdate={handleTwinUpdate}
            onLoadExample={loadExampleData}
          />
        );
      case "TaskPlaybook":
        return (
          <TaskPlaybook 
            task={task}
            twin={twin}
            onTaskUpdate={handleTaskUpdate}
            onPlanGenerated={handlePlanGenerated}
            plan={plan}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onLoadExample={loadExampleData}
          />
        );
      case "SimArena":
        return (
          <SimArena 
            plan={plan}
            sim={sim}
            onSimulationComplete={handleSimulationComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case "TeleopConsole":
        return (
          <TeleopConsole 
            plan={plan}
            sim={sim}
            disabled={!plan}
          />
        );
      case "SafetyEthics":
        return (
          <SafetyEthics 
            twin={twin}
            task={task}
            plan={plan}
            safety={safety}
            onSafetyCheck={handleSafetyCheck}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      default:
        return <Overview plan={plan} sim={sim} safety={safety} judge={judge} />;
    }
  };

  return (
    <div className="humanoid-lab" style={{ padding: "1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ 
          fontSize: "1.8rem", 
          fontWeight: "bold", 
          marginBottom: "0.5rem",
          color: "#1f2937"
        }}>
          🤖 Human+Humanoid Lab
        </h1>
        <p style={{ 
          color: "#6b7280", 
          fontSize: "0.95rem",
          marginBottom: "1rem"
        }}>
          Design, simulate, and evaluate human-humanoid workflows with AI agents
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex", 
        gap: "0.5rem", 
        marginBottom: "1.5rem",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "0.5rem"
      }}>
        <button
          onClick={runCompleteExample}
          disabled={isLoading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isLoading ? "#9ca3af" : "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
            marginRight: "auto"
          }}
        >
          {isLoading ? "⏳ Running Example..." : "🚀 Run Complete Example"}
        </button>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            title={tab.description}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: activeTab === tab.id ? "#3b82f6" : "#f3f4f6",
              color: activeTab === tab.id ? "white" : "#374151",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.backgroundColor = "#e5e7eb";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#f8fafc",
          borderRadius: "0.5rem",
          marginBottom: "1rem"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#3b82f6"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #e5e7eb",
              borderTop: "2px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ fontWeight: "500" }}>Processing...</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div style={{ minHeight: "400px" }}>
        {renderActiveTab()}
      </div>

      {/* Status Bar */}
      <div style={{
        marginTop: "1.5rem",
        padding: "1rem",
        backgroundColor: "#f8fafc",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
            <span style={{ color: plan ? "#10b981" : "#6b7280" }}>
              📋 Plan: {plan ? "Generated" : "Not generated"}
            </span>
            <span style={{ color: sim ? "#10b981" : "#6b7280" }}>
              🎮 Simulation: {sim ? "Complete" : "Not run"}
            </span>
            <span style={{ color: safety ? "#10b981" : "#6b7280" }}>
              🛡️ Safety: {safety ? (safety.ok ? "Passed" : "Failed") : "Not checked"}
            </span>
            <span style={{ color: judge ? "#10b981" : "#6b7280" }}>
              ⚖️ Judge: {judge ? `${judge.score}/100` : "Not scored"}
            </span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Human+Humanoid Lab v1.0.0
          </div>
        </div>
      </div>

      {/* CSS for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
