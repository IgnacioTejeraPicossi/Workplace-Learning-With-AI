// Safety & Ethics Component - Safety evaluation and ethical guidelines
import React, { useState, useEffect } from "react";
import { humanoidApi } from "./humanoidApi";

export default function SafetyEthics({ twin, task, plan, safety, onSafetyCheck, isLoading, setIsLoading }) {
  const [safetyContext, setSafetyContext] = useState({
    e_stop: true,
    safe_zone_cleared: true,
    payload_within_limit: true,
    emergency_stop_accessible: true,
    human_operator_present: true,
    payload_weight: 3.0
  });
  const [safetyCheckStep, setSafetyCheckStep] = useState(0);
  const [safetyStatus, setSafetyStatus] = useState("");

  const safetyGuidelines = [
    {
      category: "Physical Safety",
      items: [
        "Ensure emergency stop is accessible at all times",
        "Verify safe zone is cleared of personnel",
        "Check payload weight is within robot limits",
        "Confirm no obstacles in robot workspace",
        "Validate gripper force settings are appropriate"
      ]
    },
    {
      category: "Human-Robot Interaction",
      items: [
        "Maintain safe distance from human operators",
        "Use appropriate warning signals before movement",
        "Ensure human operator is present during operation",
        "Implement collision avoidance systems",
        "Provide clear visual and audio feedback"
      ]
    },
    {
      category: "Environmental Safety",
      items: [
        "Check lighting conditions are adequate",
        "Verify stable surface for robot operation",
        "Ensure proper ventilation in workspace",
        "Check for hazardous materials in area",
        "Validate temperature is within operating range"
      ]
    },
    {
      category: "Ethical Considerations",
      items: [
        "Respect human autonomy and decision-making",
        "Ensure transparency in robot actions",
        "Maintain privacy of collected data",
        "Implement fair and unbiased algorithms",
        "Provide clear accountability for robot decisions"
      ]
    }
  ];

  const handleContextChange = (field, value) => {
    setSafetyContext(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSafetyCheck = async () => {
    if (!twin || !task || !plan) {
      alert("Please configure Twin, Task, and Plan before running safety check.");
      return;
    }

    setIsLoading(true);
    setSafetyCheckStep(0);
    setSafetyStatus("Preparing safety evaluation...");

    try {
      // Step 1: Prepare safety payload
      setSafetyCheckStep(1);
      setSafetyStatus("Sending data to safety agent...");
      
      const safetyPayload = {
        twin: twin,
        task: task,
        plan: plan,
        context: safetyContext
      };

      // Step 2: Run safety check
      setSafetyCheckStep(2);
      setSafetyStatus("AI safety agent evaluating risks...");
      
      const response = await humanoidApi.checkSafety(safetyPayload);
      
      // Step 3: Process results
      setSafetyCheckStep(3);
      setSafetyStatus("Processing safety evaluation results...");
      
      onSafetyCheck(response);
      setSafetyStatus("Safety evaluation completed!");

    } catch (error) {
      console.error("Safety check failed:", error);
      setSafetyStatus(`Safety check failed: ${error.message}`);
      alert(`Safety check failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSafetyCheckStep(0);
    }
  };

  const safetyCheckSteps = [
    "Preparing evaluation",
    "Sending to safety agent", 
    "AI analyzing risks",
    "Processing results"
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
          🛡️ Safety & Ethics
        </h2>
        <button
          onClick={handleSafetyCheck}
          disabled={isLoading || !twin || !task || !plan}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isLoading ? "#9ca3af" : "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}
        >
          {isLoading ? "Checking..." : "Run Safety Check"}
        </button>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {/* Safety Context */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Safety Context
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.9rem" }}>E-stop Accessible</label>
              <input
                type="checkbox"
                checked={safetyContext.e_stop}
                onChange={(e) => handleContextChange("e_stop", e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.9rem" }}>Safe Zone Cleared</label>
              <input
                type="checkbox"
                checked={safetyContext.safe_zone_cleared}
                onChange={(e) => handleContextChange("safe_zone_cleared", e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.9rem" }}>Payload Within Limit</label>
              <input
                type="checkbox"
                checked={safetyContext.payload_within_limit}
                onChange={(e) => handleContextChange("payload_within_limit", e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.9rem" }}>Emergency Stop Accessible</label>
              <input
                type="checkbox"
                checked={safetyContext.emergency_stop_accessible}
                onChange={(e) => handleContextChange("emergency_stop_accessible", e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.9rem" }}>Human Operator Present</label>
              <input
                type="checkbox"
                checked={safetyContext.human_operator_present}
                onChange={(e) => handleContextChange("human_operator_present", e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.9rem", 
                marginBottom: "0.25rem" 
              }}>
                Payload Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={safetyContext.payload_weight}
                onChange={(e) => handleContextChange("payload_weight", parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem"
                }}
              />
            </div>
          </div>
        </div>

        {/* Safety Results */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Safety Evaluation Results
          </h3>
          
          {safety ? (
            <div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                marginBottom: "1rem"
              }}>
                <span style={{ 
                  fontSize: "1.5rem",
                  color: safety.ok ? "#10b981" : "#ef4444"
                }}>
                  {safety.ok ? "✅" : "❌"}
                </span>
                <span style={{ 
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: safety.ok ? "#10b981" : "#ef4444"
                }}>
                  {safety.ok ? "SAFETY PASSED" : "SAFETY FAILED"}
                </span>
              </div>
              
              {safety.risk_level && (
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontWeight: "500" }}>Risk Level: </span>
                  <span style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    backgroundColor: safety.risk_level === "low" ? "#d1fae5" : 
                                   safety.risk_level === "medium" ? "#fef3c7" : "#fecaca",
                    color: safety.risk_level === "low" ? "#065f46" : 
                           safety.risk_level === "medium" ? "#92400e" : "#991b1b",
                    fontSize: "0.9rem",
                    fontWeight: "500"
                  }}>
                    {safety.risk_level.toUpperCase()}
                  </span>
                </div>
              )}
              
              {safety.findings && safety.findings.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: "600" }}>
                    Findings:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                    {safety.findings.map((finding, index) => (
                      <li key={index} style={{ 
                        marginBottom: "0.25rem", 
                        fontSize: "0.9rem",
                        color: safety.ok ? "#065f46" : "#991b1b"
                      }}>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {safety.recommendations && safety.recommendations.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: "600" }}>
                    Recommendations:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                    {safety.recommendations.map((rec, index) => (
                      <li key={index} style={{ 
                        marginBottom: "0.25rem", 
                        fontSize: "0.9rem",
                        color: "#374151"
                      }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              color: "#6b7280", 
              fontSize: "0.9rem", 
              fontStyle: "italic",
              textAlign: "center",
              padding: "1rem"
            }}>
              No safety evaluation results available. Run a safety check.
            </div>
          )}
        </div>
      </div>

      {/* Safety Guidelines */}
      <div style={{
        marginTop: "1.5rem",
        backgroundColor: "#f0f9ff",
        border: "1px solid #0ea5e9",
        borderRadius: "0.5rem",
        padding: "1rem"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#0c4a6e" }}>
          Safety Guidelines & Best Practices
        </h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "1rem" 
        }}>
          {safetyGuidelines.map((category, index) => (
            <div key={index}>
              <h4 style={{ 
                margin: "0 0 0.5rem 0", 
                fontSize: "1rem", 
                fontWeight: "600",
                color: "#0c4a6e"
              }}>
                {category.category}
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} style={{ 
                    marginBottom: "0.25rem", 
                    fontSize: "0.9rem",
                    color: "#0c4a6e"
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Check Status */}
      {isLoading && (
        <div style={{
          marginTop: "1.5rem",
          backgroundColor: "#f0f9ff",
          border: "1px solid #0ea5e9",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
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
              {safetyStatus}
            </span>
          </div>
          <div style={{ 
            display: "flex", 
            gap: "0.5rem",
            marginLeft: "2rem"
          }}>
            {safetyCheckSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.8rem",
                  backgroundColor: index <= safetyCheckStep ? "#0ea5e9" : "#e5e7eb",
                  color: index <= safetyCheckStep ? "white" : "#6b7280"
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Requirements Warning */}
      {(!twin || !task || !plan) && (
        <div style={{
          marginTop: "1.5rem",
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "0.5rem",
          padding: "1rem",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "#92400e" }}>
            ⚠️ Please configure Twin, Task, and Plan before running safety check
          </p>
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
