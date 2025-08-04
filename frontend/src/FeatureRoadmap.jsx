import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";
import ModalDialog from "./ModalDialog";

// Simulate admin check (replace with real auth in production)
const isAdmin = true;

// Status color mapping
const statusColors = {
  "Idea": "#bdbdbd",
  "Planned": "#1976d2",
  "In Review": "#f4b400",
  "Coming Soon": "#e67e22",
  "Implemented": "#2ecc40"
};

function FeatureRoadmap() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState("");
  const [upvoting, setUpvoting] = useState("");
  const [statusUpdating, setStatusUpdating] = useState("");
  const [scaffoldModal, setScaffoldModal] = useState({ open: false, code: "", feature: null });
  const [sortBy, setSortBy] = useState("upvotes");
  const [sortDir, setSortDir] = useState("desc");
  const [scaffoldType, setScaffoldType] = useState('API Route');
  const [historyModal, setHistoryModal] = useState({ open: false, idea: null, history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { colors } = useTheme();

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/admin/unknown-intents");
      const data = await res.json();
      setFeatures(data.ideas || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch feature roadmap.");
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleUpvote = async (id) => {
    setUpvoting(id);
    await fetch(`http://localhost:8000/admin/unknown-intents/${id}/upvote`, { method: "POST" });
    await fetchFeatures();
    setUpvoting("");
  };

  const handleSubscribe = async (id) => {
    setSubscribing(id);
    const email = prompt("Enter your email to be notified about this feature:");
    if (email) {
      await fetch(`http://localhost:8000/admin/unknown-intents/${id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      alert("Subscribed!");
    }
    setSubscribing("");
  };

  const handleStatusChange = async (id, status) => {
    setStatusUpdating(id);
    await fetch(`http://localhost:8000/admin/unknown-intents/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await fetchFeatures();
    setStatusUpdating("");
  };

  const handleGenerateScaffold = async (idea) => {
    // Call backend to generate scaffold
    let codeStub = "";
    try {
      const res = await fetch("http://localhost:8000/generate-scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_name: idea.classification?.new_feature || idea.user_input,
          feature_summary: idea.classification?.intent || idea.user_input,
          scaffold_type: scaffoldType
        })
      });
      const data = await res.json();
      codeStub = data.code || "(No code generated)";
    } catch (err) {
      codeStub = `// Scaffold for: ${idea.classification?.new_feature || idea.user_input}\n// (Backend error, using mock)\nimport React from 'react';\nfunction Feature() { return <div>Feature scaffold</div>; }\nexport default Feature;`;
    }
    setScaffoldModal({ open: true, code: codeStub, feature: idea });
  };

  const handleShowHistory = async (idea) => {
    setLoadingHistory(true);
    setHistoryModal({ open: true, idea, history: [] });
    try {
      const res = await fetch(`http://localhost:8000/scaffold-history/${encodeURIComponent(idea.classification?.new_feature || idea.user_input)}`);
      const data = await res.json();
      setHistoryModal({ open: true, idea, history: data.history || [] });
    } catch (err) {
      setHistoryModal({ open: true, idea, history: [] });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleApproveScaffold = async (scaffold) => {
    const admin_comment = prompt("Enter approval comment (optional):", "");
    const approved_by = "admin"; // Replace with real user if available
    const res = await fetch(`http://localhost:8000/scaffold-history/${scaffold._id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_comment, approved_by })
    });
    const data = await res.json();
    if (data.success) {
      // Refresh history
      handleShowHistory(historyModal.idea);
    } else {
      alert("Failed to approve scaffold.");
    }
  };

  const statusOptions = ["Idea", "Planned", "In Review", "Coming Soon", "Implemented"];

  const SCAFFOLD_TYPE_PREVIEWS = {
    'API Route': 'Generates a FastAPI route with Pydantic models as needed.',
    'DB Model': 'Generates a MongoDB (Motor) collection/model and related schemas.',
    'Background Job': 'Generates an async background task (e.g., with FastAPI BackgroundTasks or Celery).',
    'Unit Test': 'Generates a Python unit test for the feature.',
    'Cypress Test': 'Generates a Cypress end-to-end test for the feature.',
    'Docs': 'Generates markdown documentation for the feature.'
  };

  // Sorting logic
  const sortedFeatures = [...features].sort((a, b) => {
    let aVal, bVal;
    if (sortBy === "upvotes") {
      aVal = a.upvotes || 0;
      bVal = b.upvotes || 0;
    } else if (sortBy === "date") {
      aVal = new Date(a.created_at || 0).getTime();
      bVal = new Date(b.created_at || 0).getTime();
    } else if (sortBy === "status") {
      aVal = statusOptions.indexOf(a.status || "Idea");
      bVal = statusOptions.indexOf(b.status || "Idea");
    } else {
      aVal = 0; bVal = 0;
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Helper for clickable column headers
  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir(col === "upvotes" || col === "date" ? "desc" : "asc");
    }
  };

  return (
    <div style={{ color: colors.text, padding: 24 }}>
      <h2 style={{ color: colors.text }}>Feature Roadmap</h2>
      <p style={{ color: colors.textSecondary, marginBottom: 24 }}>
        This panel shows user-submitted ideas and potential future features. Upvote, subscribe for notifications, or (admin) update status.
      </p>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 600, marginRight: 12 }}>Status Legend:</span>
        {statusOptions.map(opt => (
          <span key={opt} style={{ background: statusColors[opt], color: '#fff', borderRadius: 6, padding: '2px 10px', marginRight: 8, fontSize: 13 }}>{opt}</span>
        ))}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ background: colors.primaryLight }}>
              <th style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: 'pointer' }} onClick={() => handleSort("feature")}>Feature Name</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: 'pointer' }} onClick={() => handleSort("status")}>Status {sortBy === "status" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Summary</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: 'pointer' }} onClick={() => handleSort("upvotes")}>Upvotes {sortBy === "upvotes" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Notifications</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: 'pointer' }} onClick={() => handleSort("date")}>Submitted {sortBy === "date" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedFeatures.map((idea, idx) => (
              <tr key={idea._id || idx} style={{ background: idx % 2 === 0 ? colors.cardBackground : colors.background }}>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.classification?.new_feature || "(No feature name)"}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <span style={{ background: statusColors[idea.status || "Idea"], color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>
                    {isAdmin ? (
                      <select
                        value={idea.status || "Idea"}
                        onChange={e => handleStatusChange(idea._id, e.target.value)}
                        disabled={statusUpdating === idea._id}
                        style={{ padding: 4, borderRadius: 4, background: statusColors[idea.status || "Idea"], color: '#fff', fontWeight: 600, border: 'none' }}
                      >
                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      idea.status || "Idea"
                    )}
                  </span>
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.classification?.intent || idea.user_input}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <button
                    onClick={() => handleUpvote(idea._id)}
                    disabled={upvoting === idea._id}
                    style={{ background: '#eee', border: '1px solid #ccc', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontWeight: 600 }}
                    title="Upvote this feature"
                  >
                    👍 {idea.upvotes || 0}
                  </button>
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <button
                    onClick={() => handleSubscribe(idea._id)}
                    disabled={subscribing === idea._id}
                    style={{ background: '#eee', border: '1px solid #ccc', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontWeight: 600 }}
                    title="Get notified about this feature"
                  >
                    🔔 Notify Me
                  </button>
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.created_at ? new Date(idea.created_at).toLocaleString() : "-"}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <select
                      value={scaffoldType}
                      onChange={e => setScaffoldType(e.target.value)}
                      style={{ marginBottom: 4, padding: 4, borderRadius: 4 }}
                    >
                      <option value="API Route">API Route</option>
                      <option value="DB Model">DB Model</option>
                      <option value="Background Job">Background Job</option>
                      <option value="Unit Test">Unit Test</option>
                      <option value="Cypress Test">Cypress Test</option>
                      <option value="Docs">Docs</option>
                    </select>
                    <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4, minHeight: 18 }}>
                      {SCAFFOLD_TYPE_PREVIEWS[scaffoldType]}
                    </div>
                    <button
                      onClick={() => handleGenerateScaffold(idea)}
                      style={{ background: '#eee', border: '1px solid #ccc', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontWeight: 600 }}
                      title="Generate code scaffold for this feature"
                    >
                      🛠️ Generate Scaffold
                    </button>
                    <button
                      onClick={() => handleShowHistory(idea)}
                      style={{ background: '#f4e2b8', color: '#8a6d1b', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontWeight: 600, marginTop: 2 }}
                      title="View scaffold history for this feature"
                    >
                      📜 History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ModalDialog
        isOpen={scaffoldModal.open}
        onRequestClose={() => setScaffoldModal({ open: false, code: "", feature: null })}
        title={`Code Scaffold for: ${scaffoldModal.feature?.classification?.new_feature || scaffoldModal.feature?.user_input || "Feature"}`}
      >
        <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8, fontSize: 14, maxHeight: 400, overflow: 'auto' }}>{scaffoldModal.code}</pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(scaffoldModal.code);
            alert("Code copied to clipboard!");
          }}
          style={{ marginTop: 16, background: '#1976d2', color: '#fff', border: 0, borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 16 }}
        >
          Copy Code
        </button>
      </ModalDialog>
      <ModalDialog
        isOpen={historyModal.open}
        onRequestClose={() => setHistoryModal({ open: false, idea: null, history: [] })}
        title={`Scaffold History for: ${historyModal.idea?.classification?.new_feature || historyModal.idea?.user_input || "Feature"}`}
      >
        {loadingHistory ? (
          <div>Loading...</div>
        ) : historyModal.history.length === 0 ? (
          <div style={{ color: colors.textSecondary }}>No scaffold history found for this feature.</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {historyModal.history.map((entry, idx) => (
              <div key={entry._id || idx} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
                  <b>Type:</b> {entry.scaffold_type} &nbsp; | &nbsp;
                  <b>User:</b> {entry.user} &nbsp; | &nbsp;
                  <b>Date:</b> {new Date(entry.created_at).toLocaleString()}
                  {entry.approved && (
                    <span style={{ color: '#2ecc40', fontWeight: 600, marginLeft: 8 }}>
                      ✔️ Approved by {entry.approved_by} at {entry.approved_at ? new Date(entry.approved_at).toLocaleString() : ''}
                    </span>
                  )}
                </div>
                <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 6, fontSize: 13, maxHeight: 200, overflow: 'auto' }}>{entry.code}</pre>
                {entry.admin_comment && (
                  <div style={{ fontSize: 13, color: '#1976d2', marginBottom: 4 }}>
                    <b>Admin Comment:</b> {entry.admin_comment}
                  </div>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(entry.code); alert('Code copied to clipboard!'); }}
                  style={{ background: '#1976d2', color: '#fff', border: 0, borderRadius: 6, padding: '6px 16px', fontWeight: 600, fontSize: 14 }}
                >
                  Copy Code
                </button>
                {!entry.approved && (
                  <button
                    onClick={() => handleApproveScaffold(entry)}
                    style={{ background: '#2ecc40', color: '#fff', border: 0, borderRadius: 6, padding: '6px 16px', fontWeight: 600, fontSize: 14, marginLeft: 8 }}
                  >
                    Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ModalDialog>
    </div>
  );
}

export default FeatureRoadmap; 