// Teleop Console Component - Teleoperation Control
import React, { useState } from "react";
import { humanoidApi } from "./humanoidApi";

export default function TeleopConsole({ plan, sim, disabled }) {
  const [selectedCommand, setSelectedCommand] = useState("move");
  const [commandParams, setCommandParams] = useState({
    x: 1.0,
    y: 1.0,
    z: 0.5,
    force: 50
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [robotStatus, setRobotStatus] = useState(null);

  const commandTypes = [
    { id: "move", label: "Move", description: "Move to position (x, y, z)" },
    { id: "grip_open", label: "Grip Open", description: "Open gripper" },
    { id: "grip_close", label: "Grip Close", description: "Close gripper with force" },
    { id: "home", label: "Home", description: "Return to home position" },
    { id: "stop", label: "Stop", description: "Stop current operation" },
    { id: "pause", label: "Pause", description: "Pause current operation" },
    { id: "resume", label: "Resume", description: "Resume paused operation" },
    { id: "emergency_stop", label: "Emergency Stop", description: "Immediate stop (safety)" },
    { id: "status_check", label: "Status Check", description: "Check robot status" }
  ];

  const handleCommandChange = (commandId) => {
    setSelectedCommand(commandId);
    // Reset parameters for new command
    setCommandParams({
      x: 1.0,
      y: 1.0,
      z: 0.5,
      force: 50
    });
  };

  const handleParamChange = (param, value) => {
    setCommandParams(prev => ({
      ...prev,
      [param]: parseFloat(value) || 0
    }));
  };

  const handleExecuteCommand = async () => {
    if (disabled) {
      alert("Teleop Console is disabled. Please generate a plan first.");
      return;
    }

    setIsExecuting(true);
    
    try {
      const command = {
        type: selectedCommand,
        args: commandParams,
        dry_run: true // Safety measure - only dry runs in mock mode
      };

      const response = await humanoidApi.sendCommand(command);
      
      // Add to command history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        command: selectedCommand,
        params: { ...commandParams },
        status: response.status === "sent" ? "success" : "failed"
      };
      
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 commands
      
      // If status check, update robot status
      if (selectedCommand === "status_check") {
        setRobotStatus({
          status: "operational",
          battery_level: Math.random() * 0.3 + 0.7,
          position: { x: commandParams.x, y: commandParams.y, z: commandParams.z },
          gripper_state: "open",
          temperature: Math.random() * 15 + 20,
          error_count: Math.floor(Math.random() * 3)
        });
      }

    } catch (error) {
      console.error("Command execution failed:", error);
      alert(`Command failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getCommandDescription = () => {
    const command = commandTypes.find(cmd => cmd.id === selectedCommand);
    return command ? command.description : "";
  };

  const renderCommandParams = () => {
    switch (selectedCommand) {
      case "move":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>X (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={commandParams.x}
                  onChange={(e) => handleParamChange("x", e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Y (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={commandParams.y}
                  onChange={(e) => handleParamChange("y", e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Z (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={commandParams.z}
                  onChange={(e) => handleParamChange("z", e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem" }}
                />
              </div>
            </div>
          </div>
        );
      
      case "grip_close":
        return (
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Force (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={commandParams.force}
              onChange={(e) => handleParamChange("force", e.target.value)}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem" }}
            />
          </div>
        );
      
      default:
        return (
          <div style={{ color: "#6b7280", fontSize: "0.9rem", fontStyle: "italic" }}>
            No parameters required for this command
          </div>
        );
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1.5rem" 
      }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
          🎛️ Teleop Console
        </h2>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
          color: disabled ? "#ef4444" : "#10b981"
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: disabled ? "#ef4444" : "#10b981"
          }}></div>
          <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
            {disabled ? "Disabled" : "Ready"}
          </span>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {/* Command Interface */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Command Interface
          </h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.9rem", 
              fontWeight: "500", 
              marginBottom: "0.5rem" 
            }}>
              Command Type
            </label>
            <select
              value={selectedCommand}
              onChange={(e) => handleCommandChange(e.target.value)}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                backgroundColor: disabled ? "#f3f4f6" : "white"
              }}
            >
              {commandTypes.map(cmd => (
                <option key={cmd.id} value={cmd.id}>
                  {cmd.label}
                </option>
              ))}
            </select>
            <p style={{ 
              margin: "0.25rem 0 0 0", 
              fontSize: "0.8rem", 
              color: "#6b7280" 
            }}>
              {getCommandDescription()}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.9rem", 
              fontWeight: "500", 
              marginBottom: "0.5rem" 
            }}>
              Parameters
            </label>
            {renderCommandParams()}
          </div>

          <button
            onClick={handleExecuteCommand}
            disabled={disabled || isExecuting}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: disabled || isExecuting ? "#9ca3af" : "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: disabled || isExecuting ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: "500"
            }}
          >
            {isExecuting ? "Executing..." : "Execute Command"}
          </button>

          <div style={{ 
            marginTop: "0.75rem", 
            padding: "0.5rem", 
            backgroundColor: "#fef3c7", 
            borderRadius: "0.25rem",
            fontSize: "0.8rem",
            color: "#92400e"
          }}>
            ⚠️ Mock Mode: Only dry-run commands are allowed for safety
          </div>
        </div>

        {/* Robot Status */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Robot Status
          </h3>
          
          {robotStatus ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status:</span>
                <span style={{ 
                  color: robotStatus.status === "operational" ? "#10b981" : "#ef4444",
                  fontWeight: "500"
                }}>
                  {robotStatus.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Battery:</span>
                <span>{Math.round(robotStatus.battery_level * 100)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Position:</span>
                <span>
                  ({robotStatus.position.x}, {robotStatus.position.y}, {robotStatus.position.z})
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Gripper:</span>
                <span style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: robotStatus.gripper_state === "open" ? "#fef3c7" : "#d1fae5",
                  color: robotStatus.gripper_state === "open" ? "#92400e" : "#065f46",
                  fontSize: "0.8rem"
                }}>
                  {robotStatus.gripper_state}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Temperature:</span>
                <span>{robotStatus.temperature.toFixed(1)}°C</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Errors:</span>
                <span style={{ 
                  color: robotStatus.error_count > 0 ? "#ef4444" : "#10b981" 
                }}>
                  {robotStatus.error_count}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ 
              color: "#6b7280", 
              fontSize: "0.9rem", 
              fontStyle: "italic",
              textAlign: "center",
              padding: "1rem"
            }}>
              No status data available. Run a status check command.
            </div>
          )}
        </div>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div style={{
          marginTop: "1.5rem",
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Command History
          </h3>
          
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {commandHistory.map((entry) => (
              <div key={entry.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "0.9rem"
              }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ color: "#6b7280" }}>{entry.timestamp}</span>
                  <span style={{ fontWeight: "500" }}>{entry.command}</span>
                  {entry.params && Object.keys(entry.params).length > 0 && (
                    <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                      {JSON.stringify(entry.params)}
                    </span>
                  )}
                </div>
                <span style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: entry.status === "success" ? "#d1fae5" : "#fef3c7",
                  color: entry.status === "success" ? "#065f46" : "#92400e",
                  fontSize: "0.8rem"
                }}>
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disabled State Message */}
      {disabled && (
        <div style={{
          marginTop: "1.5rem",
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "0.5rem",
          padding: "1rem",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "#92400e" }}>
            ⚠️ Teleop Console is disabled. Please generate a plan first to enable teleoperation.
          </p>
        </div>
      )}
    </div>
  );
}
