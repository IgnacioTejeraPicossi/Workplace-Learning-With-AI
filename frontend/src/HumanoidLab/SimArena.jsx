// Sim Arena Component - Simulation Execution
import React, { useState, useEffect } from "react";
import { humanoidApi } from "./humanoidApi";

export default function SimArena({ plan, sim, onSimulationComplete, isLoading, setIsLoading }) {
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState("");
  const [telemetryData, setTelemetryData] = useState([]);

  useEffect(() => {
    if (sim && sim.telemetry) {
      setTelemetryData(sim.telemetry);
    }
  }, [sim]);

  const handleRunSimulation = async () => {
    if (!plan) {
      alert("Please generate a plan first before running simulation.");
      return;
    }

    setIsLoading(true);
    setSimulationStep(0);
    setSimulationStatus("Preparing simulation...");

    try {
      // Step 1: Prepare simulation
      setSimulationStep(1);
      setSimulationStatus("Sending plan to simulator...");
      
      const simulationPayload = {
        plan: plan
      };

      // Step 2: Run simulation
      setSimulationStep(2);
      setSimulationStatus("Simulating task execution...");
      
      const response = await humanoidApi.runSimulation(simulationPayload);
      
      // Step 3: Process results
      setSimulationStep(3);
      setSimulationStatus("Processing simulation results...");
      
      if (response.ok) {
        onSimulationComplete(response);
        setSimulationStatus("Simulation completed successfully!");
        setTelemetryData(response.telemetry || []);
      } else {
        throw new Error("Simulation failed");
      }

    } catch (error) {
      console.error("Simulation failed:", error);
      setSimulationStatus(`Simulation failed: ${error.message}`);
      alert(`Simulation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSimulationStep(0);
    }
  };

  const simulationSteps = [
    "Preparing simulation",
    "Sending to simulator", 
    "Executing simulation",
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
          🎮 Sim Arena
        </h2>
        <button
          onClick={handleRunSimulation}
          disabled={isLoading || !plan}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isLoading ? "#9ca3af" : "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}
        >
          {isLoading ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {/* Simulation Status */}
      {isLoading && (
        <div style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #0ea5e9",
          borderRadius: "0.5rem",
          padding: "1rem",
          marginBottom: "1.5rem"
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
              {simulationStatus}
            </span>
          </div>
          <div style={{ 
            display: "flex", 
            gap: "0.5rem",
            marginLeft: "2rem"
          }}>
            {simulationSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.8rem",
                  backgroundColor: index <= simulationStep ? "#0ea5e9" : "#e5e7eb",
                  color: index <= simulationStep ? "white" : "#6b7280"
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Results */}
      {sim && (
        <div style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #10b981",
          borderRadius: "0.5rem",
          padding: "1rem",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#065f46" }}>
            Simulation Results
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem",
            marginBottom: "1rem"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>
                {sim.sim_total_seconds}s
              </div>
              <div style={{ fontSize: "0.9rem", color: "#065f46" }}>Total Time</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b" }}>
                {sim.kpis?.minor_events || 0}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#065f46" }}>Minor Events</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#8b5cf6" }}>
                {sim.kpis?.avg_step_seconds?.toFixed(1) || 0}s
              </div>
              <div style={{ fontSize: "0.9rem", color: "#065f46" }}>Avg Step Time</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#06b6d4" }}>
                {(sim.kpis?.energy_efficiency * 100)?.toFixed(0) || 0}%
              </div>
              <div style={{ fontSize: "0.9rem", color: "#065f46" }}>Energy Efficiency</div>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Data */}
      {telemetryData.length > 0 && (
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Execution Telemetry
          </h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              fontSize: "0.9rem"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Step</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Duration</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Energy</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Position</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Gripper</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Events</th>
                </tr>
              </thead>
              <tbody>
                {telemetryData.map((entry, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem" }}>
                      {entry.step}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {entry.duration}s
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {entry.energy_j}J
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {entry.position ? 
                        `(${entry.position.x}, ${entry.position.y}, ${entry.position.z})` : 
                        "—"
                      }
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: entry.gripper_state === "open" ? "#fef3c7" : "#d1fae5",
                        color: entry.gripper_state === "open" ? "#92400e" : "#065f46",
                        fontSize: "0.8rem"
                      }}>
                        {entry.gripper_state}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {entry.events?.map((event, i) => (
                        <span key={i} style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          backgroundColor: event === "ok" ? "#d1fae5" : "#fef3c7",
                          color: event === "ok" ? "#065f46" : "#92400e",
                          fontSize: "0.8rem",
                          marginRight: "0.25rem"
                        }}>
                          {event}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Plan Warning */}
      {!plan && (
        <div style={{
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "0.5rem",
          padding: "1rem",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "#92400e" }}>
            ⚠️ Please generate a plan first before running simulation
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
