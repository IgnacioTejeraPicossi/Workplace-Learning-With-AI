// Overview Component - Dashboard for Human-Humanoid Lab
import React, { useEffect, useState } from "react";
import { get, download, qs } from "./humanoidApi";

export default function Overview({ plan, sim, safety, judge, onRefresh }) {
  const [summary, setSummary] = useState(null);
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [limit, setLimit] = useState(25);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [task, setTask] = useState("");
  const [minScore, setMinScore] = useState("");
  const [safetyOk, setSafetyOk] = useState("");
  const [minTR, setMinTR] = useState("");
  const [maxTR, setMaxTR] = useState("");
  const [onlyMinor, setOnlyMinor] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const params = {
        limit,
        start: start || undefined,
        end: end || undefined,
        task: task || undefined,
        min_score: minScore || undefined,
        safety_ok: safetyOk === "" ? undefined : safetyOk === "true",
        min_time_ratio: minTR || undefined,
        max_time_ratio: maxTR || undefined,
        only_minor_events: onlyMinor || undefined
      };
      const query = qs(params);

      const [summaryData, runsData] = await Promise.all([
        get(`/runs/summary${query}`),
        get(`/runs${query}`)
      ]);
      
      setSummary(summaryData);
      setRuns(runsData.items || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDownload = async (format) => {
    try {
      const params = {
        limit,
        start: start || undefined,
        end: end || undefined,
        task: task || undefined,
        min_score: minScore || undefined,
        safety_ok: safetyOk === "" ? undefined : safetyOk === "true",
        min_time_ratio: minTR || undefined,
        max_time_ratio: maxTR || undefined,
        only_minor_events: onlyMinor || undefined
      };
      const query = qs(params);
      const filename = format === "json" ? "humanoid_runs.json" : "humanoid_runs.csv";
      await download(`/runs/export${query}&format=${format}`, filename);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  };

  const resetFilters = () => {
    setLimit(25);
    setStart("");
    setEnd("");
    setTask("");
    setMinScore("");
    setSafetyOk("");
    setMinTR("");
    setMaxTR("");
    setOnlyMinor(false);
  };

  return (
    <div className="overview" style={{ padding: "1rem" }}>
      {/* Example Information */}
      <div style={{
        backgroundColor: "#f0f9ff",
        border: "1px solid #0ea5e9",
        borderRadius: "0.5rem",
        padding: "1rem",
        marginBottom: "1.5rem"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: "600", color: "#0c4a6e" }}>
          🎯 Example Workflow: "Pick and Pack Electronics"
        </h3>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#0c4a6e" }}>
          This example demonstrates a complete warehouse automation workflow where a humanoid robot picks electronic components, 
          performs quality inspection, and packs them safely for shipping.
        </p>
        <div style={{ fontSize: "0.85rem", color: "#0c4a6e" }}>
          <p style={{ margin: "0 0 0.25rem 0" }}><strong>Digital Twin:</strong> Warehouse Picker with precision gripping and quality inspection skills</p>
          <p style={{ margin: "0 0 0.25rem 0" }}><strong>Task:</strong> 7-step process including navigation, scanning, gripping, inspection, and packaging</p>
          <p style={{ margin: "0" }}><strong>Safety:</strong> Anti-static requirements, zone clearance, and payload limits</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "1rem", 
        marginBottom: "1.5rem" 
      }}>
        <KPICard 
          title="Total Runs" 
          value={summary?.count ?? "—"} 
          icon="📊"
          color="#3b82f6"
        />
        <KPICard 
          title="Safety OK Rate" 
          value={summary ? `${Math.round((summary.ok_rate || 0) * 100)}%` : "—"} 
          icon="🛡️"
          color="#10b981"
        />
        <KPICard 
          title="Avg Judge Score" 
          value={summary?.avg_score?.toFixed?.(1) ?? "—"} 
          icon="⚖️"
          color="#f59e0b"
        />
        <KPICard 
          title="Avg Time Ratio" 
          value={summary?.avg_time_ratio ?? "—"} 
          icon="⏱️"
          color="#8b5cf6"
        />
      </div>

      {/* Controls */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={refreshData}
            disabled={isLoading}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
          
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label style={{ fontSize: "0.9rem", color: "#374151" }}>Limit:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              style={{
                padding: "0.25rem 0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            >
              {[10, 25, 50, 100, 250].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              const menu = e.currentTarget.nextSibling;
              menu.style.display = menu.style.display === "block" ? "none" : "block";
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer"
            }}
          >
            Download ▼
          </button>
          <div style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "0.25rem",
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            display: "none",
            zIndex: 10
          }}>
            <button
              onClick={() => handleDownload("csv")}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb"
              }}
            >
              CSV
            </button>
            <button
              onClick={() => handleDownload("json")}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
        marginBottom: "1.5rem"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "600" }}>Filters</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1rem" 
        }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Start Date (YYYY-MM-DD)
            </label>
            <input
              type="text"
              placeholder="2025-01-01"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              End Date (YYYY-MM-DD)
            </label>
            <input
              type="text"
              placeholder="2025-01-31"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Task (contains)
            </label>
            <input
              type="text"
              placeholder="Picking"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Min Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="70"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Safety OK
            </label>
            <select
              value={safetyOk}
              onChange={(e) => setSafetyOk(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            >
              <option value="">Any</option>
              <option value="true">Only OK</option>
              <option value="false">Only Issues</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Min Time Ratio
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.9"
              value={minTR}
              onChange={(e) => setMinTR(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Max Time Ratio
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="1.2"
              value={maxTR}
              onChange={(e) => setMaxTR(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem"
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              id="onlyMinor"
              checked={onlyMinor}
              onChange={(e) => setOnlyMinor(e.target.checked)}
            />
            <label htmlFor="onlyMinor" style={{ fontSize: "0.9rem" }}>
              Only runs with minor events
            </label>
          </div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={refreshData}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer"
            }}
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              resetFilters();
              setTimeout(refreshData, 0);
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "600" }}>
          Recent Runs ({runs.length})
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            fontSize: "0.9rem"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>When</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Task</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Est (s)</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Actual (s)</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Time Ratio</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Safety</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Score</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #d1d5db" }}>Minor Events</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.75rem" }}>
                    {new Date(run.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {run.plan?.task_name || "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {run.plan?.est_total_seconds ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {run.sim?.sim_total_seconds ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {run.time_ratio ? run.time_ratio.toFixed(2) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{
                      color: run.safety?.ok ? "#10b981" : "#ef4444",
                      fontWeight: "500"
                    }}>
                      {run.safety?.ok ? "OK" : "Issues"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {run.judge?.score ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {run.sim?.kpis?.minor_events ?? 0}
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    No runs found. Generate a plan → simulate → safety → judge to create your first run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color }) {
  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "0.5rem",
      padding: "1rem",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>
        {title}
      </div>
      <div style={{ 
        fontSize: "1.5rem", 
        fontWeight: "bold", 
        color: color || "#1f2937" 
      }}>
        {value}
      </div>
    </div>
  );
}
