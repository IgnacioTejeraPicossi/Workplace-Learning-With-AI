// Task Playbook Component - Task Definition and Planning
import React, { useState, useEffect } from "react";
import { humanoidApi } from "./humanoidApi";

export default function TaskPlaybook({ task, twin, onTaskUpdate, onPlanGenerated, plan, isLoading, setIsLoading, onLoadExample }) {
  const [localTask, setLocalTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);
  const [planningStep, setPlanningStep] = useState(0);
  const [planningStatus, setPlanningStatus] = useState("");

  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  const handleInputChange = (field, value) => {
    setLocalTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepChange = (index, value) => {
    setLocalTask(prev => ({
      ...prev,
      steps_hint: prev.steps_hint.map((step, i) => 
        i === index ? value : step
      )
    }));
  };

  const handleAddStep = () => {
    setLocalTask(prev => ({
      ...prev,
      steps_hint: [...prev.steps_hint, ""]
    }));
  };

  const handleRemoveStep = (index) => {
    setLocalTask(prev => ({
      ...prev,
      steps_hint: prev.steps_hint.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onTaskUpdate(localTask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalTask(task);
    setIsEditing(false);
  };

  const handleGeneratePlan = async () => {
    if (!twin || !localTask) {
      alert("Please configure both Twin and Task before generating a plan.");
      return;
    }

    setIsLoading(true);
    setPlanningStep(0);
    setPlanningStatus("Preparing plan request...");

    try {
      // Step 1: Prepare request
      setPlanningStep(1);
      setPlanningStatus("Sending request to AI planner...");
      
      const planRequest = {
        twin: twin,
        task: localTask,
        quality_goal: "balanced"
      };

      // Step 2: Generate plan
      setPlanningStep(2);
      setPlanningStatus("AI is analyzing task and generating plan...");
      
      const response = await humanoidApi.generatePlan(planRequest);
      
      // Step 3: Process response
      setPlanningStep(3);
      setPlanningStatus("Processing plan response...");
      
      if (response.plan) {
        onPlanGenerated(response.plan);
        setPlanningStatus("Plan generated successfully!");
      } else {
        throw new Error("No plan received from server");
      }

    } catch (error) {
      console.error("Plan generation failed:", error);
      setPlanningStatus(`Plan generation failed: ${error.message}`);
      alert(`Failed to generate plan: ${error.message}`);
    } finally {
      setIsLoading(false);
      setPlanningStep(0);
    }
  };

  const planningSteps = [
    "Preparing request",
    "Sending to AI planner", 
    "AI analyzing task",
    "Processing response"
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1.5rem" 
      }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
          📋 Task Playbook
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={onLoadExample}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            🎯 Load Example
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer"
              }}
            >
              Edit Task
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {/* Task Definition */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Task Definition
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.9rem", 
                fontWeight: "500", 
                marginBottom: "0.25rem" 
              }}>
                Task Name
              </label>
              <input
                type="text"
                value={localTask.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  backgroundColor: isEditing ? "white" : "#f3f4f6"
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.9rem", 
                fontWeight: "500", 
                marginBottom: "0.25rem" 
              }}>
                Description
              </label>
              <textarea
                value={localTask.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={!isEditing}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  backgroundColor: isEditing ? "white" : "#f3f4f6",
                  resize: "vertical"
                }}
              />
            </div>
          </div>
        </div>

        {/* Task Steps */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "1rem" 
          }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
              Task Steps (Hints)
            </h3>
            {isEditing && (
              <button
                onClick={handleAddStep}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                + Add Step
              </button>
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {localTask.steps_hint.map((step, index) => (
              <div key={index} style={{ 
                display: "flex", 
                gap: "0.5rem", 
                alignItems: "center" 
              }}>
                <span style={{ 
                  fontSize: "0.9rem", 
                  fontWeight: "500", 
                  minWidth: "20px" 
                }}>
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  disabled={!isEditing}
                  placeholder={`Step ${index + 1} description`}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.25rem",
                    backgroundColor: isEditing ? "white" : "#f3f4f6"
                  }}
                />
                {isEditing && (
                  <button
                    onClick={() => handleRemoveStep(index)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.8rem"
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {localTask.steps_hint.length === 0 && (
              <p style={{ 
                color: "#6b7280", 
                fontStyle: "italic", 
                textAlign: "center",
                margin: "1rem 0"
              }}>
                No steps defined. Add steps to help the AI planner.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plan Generation */}
      <div style={{
        marginTop: "1.5rem",
        backgroundColor: "#f0f9ff",
        border: "1px solid #0ea5e9",
        borderRadius: "0.5rem",
        padding: "1rem"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#0c4a6e" }}>
          AI Plan Generation
        </h3>
        
        {isLoading && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              marginBottom: "0.5rem"
            }}>
              <div style={{
                width: "20px",
                height: "20px",
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #0ea5e9",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <span style={{ fontWeight: "500", color: "#0c4a6e" }}>
                {planningStatus}
              </span>
            </div>
            <div style={{ 
              display: "flex", 
              gap: "0.5rem",
              marginLeft: "2rem"
            }}>
              {planningSteps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.8rem",
                    backgroundColor: index <= planningStep ? "#0ea5e9" : "#e5e7eb",
                    color: index <= planningStep ? "white" : "#6b7280"
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={handleGeneratePlan}
            disabled={isLoading || !twin || !localTask}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: isLoading ? "#9ca3af" : "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: "500"
            }}
          >
            {isLoading ? "Generating..." : "Generate AI Plan"}
          </button>
          
          {plan && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              color: "#10b981",
              fontSize: "0.9rem"
            }}>
              <span>✅</span>
              <span>Plan ready ({plan.steps?.length || 0} steps)</span>
            </div>
          )}
        </div>
        
        {!twin && (
          <p style={{ 
            color: "#f59e0b", 
            fontSize: "0.9rem", 
            margin: "0.5rem 0 0 0" 
          }}>
            ⚠️ Please configure your Digital Twin first
          </p>
        )}
      </div>

      {/* Generated Plan Display */}
      {plan && (
        <div style={{
          marginTop: "1.5rem",
          backgroundColor: "#f0fdf4",
          border: "1px solid #10b981",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#065f46" }}>
            Generated Plan: {plan.task_name}
          </h3>
          
          <div style={{ marginBottom: "0.5rem", color: "#065f46" }}>
            <strong>Estimated Total Time:</strong> {plan.est_total_seconds}s
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {plan.steps?.map((step, index) => (
              <div key={index} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem",
                backgroundColor: "white",
                borderRadius: "0.25rem",
                border: "1px solid #d1d5db"
              }}>
                <span style={{ fontWeight: "500" }}>
                  {step.index}. {step.action}
                </span>
                <span style={{ 
                  color: "#6b7280", 
                  fontSize: "0.9rem" 
                }}>
                  ~{step.est_seconds}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
