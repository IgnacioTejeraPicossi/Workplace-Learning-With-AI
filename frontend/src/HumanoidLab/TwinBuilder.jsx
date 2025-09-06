// Twin Builder Component - Digital Twin Configuration
import React, { useState, useEffect } from "react";

export default function TwinBuilder({ twin, onTwinUpdate, onLoadExample }) {
  const [localTwin, setLocalTwin] = useState(twin);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalTwin(twin);
  }, [twin]);

  const handleInputChange = (field, value) => {
    setLocalTwin(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConstraintChange = (constraint, value) => {
    setLocalTwin(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [constraint]: parseFloat(value) || 0
      }
    }));
  };

  const handleEnvironmentChange = (env, value) => {
    setLocalTwin(prev => ({
      ...prev,
      environment: {
        ...prev.environment,
        [env]: value
      }
    }));
  };

  const handleSkillToggle = (skill) => {
    setLocalTwin(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSave = () => {
    onTwinUpdate(localTwin);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalTwin(twin);
    setIsEditing(false);
  };

  const availableSkills = [
    "picking", "precision", "navigation", "gripping", 
    "inspection", "sorting", "lifting", "placement",
    "quality_control", "safety_monitoring"
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
          👤 Digital Twin Builder
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
              Edit Twin
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
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {/* Basic Information */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Basic Information
          </h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.9rem", 
              fontWeight: "500", 
              marginBottom: "0.25rem" 
            }}>
              Human Role
            </label>
            <input
              type="text"
              value={localTwin.human_role}
              onChange={(e) => handleInputChange("human_role", e.target.value)}
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
        </div>

        {/* Skills */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Skills
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
            gap: "0.5rem" 
          }}>
            {availableSkills.map(skill => (
              <label key={skill} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                cursor: isEditing ? "pointer" : "default"
              }}>
                <input
                  type="checkbox"
                  checked={localTwin.skills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  disabled={!isEditing}
                  style={{ transform: "scale(1.1)" }}
                />
                <span style={{ fontSize: "0.9rem" }}>
                  {skill.replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Physical Constraints
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.9rem", 
                fontWeight: "500", 
                marginBottom: "0.25rem" 
              }}>
                Max Load (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={localTwin.constraints.max_load || 0}
                onChange={(e) => handleConstraintChange("max_load", e.target.value)}
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
                Max Reach (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={localTwin.constraints.max_reach || 0}
                onChange={(e) => handleConstraintChange("max_reach", e.target.value)}
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
                Max Height (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={localTwin.constraints.max_height || 0}
                onChange={(e) => handleConstraintChange("max_height", e.target.value)}
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
          </div>
        </div>

        {/* Environment */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
            Environment
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.9rem", 
                fontWeight: "500", 
                marginBottom: "0.25rem" 
              }}>
                Zone
              </label>
              <input
                type="text"
                value={localTwin.environment.zone || ""}
                onChange={(e) => handleEnvironmentChange("zone", e.target.value)}
                disabled={!isEditing}
                placeholder="A1"
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
                Shelf Height (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={localTwin.environment.shelf_height || 0}
                onChange={(e) => handleEnvironmentChange("shelf_height", e.target.value)}
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
                Lighting
              </label>
              <select
                value={localTwin.environment.lighting || ""}
                onChange={(e) => handleEnvironmentChange("lighting", e.target.value)}
                disabled={!isEditing}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.25rem",
                  backgroundColor: isEditing ? "white" : "#f3f4f6"
                }}
              >
                <option value="">Select lighting</option>
                <option value="poor">Poor</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Twin Summary */}
      <div style={{
        marginTop: "1.5rem",
        backgroundColor: "#f0f9ff",
        border: "1px solid #0ea5e9",
        borderRadius: "0.5rem",
        padding: "1rem"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#0c4a6e" }}>
          Twin Summary
        </h3>
        <div style={{ fontSize: "0.9rem", color: "#0c4a6e" }}>
          <p><strong>Role:</strong> {localTwin.human_role}</p>
          <p><strong>Skills:</strong> {localTwin.skills.join(", ") || "None selected"}</p>
          <p><strong>Max Load:</strong> {localTwin.constraints.max_load || 0} kg</p>
          <p><strong>Max Reach:</strong> {localTwin.constraints.max_reach || 0} m</p>
          <p><strong>Environment:</strong> Zone {localTwin.environment.zone || "Not set"}, {localTwin.environment.lighting || "No lighting set"}</p>
        </div>
      </div>
    </div>
  );
}
