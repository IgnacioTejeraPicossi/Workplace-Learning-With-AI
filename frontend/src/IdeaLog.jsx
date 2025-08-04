import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";

function IdeaLog() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const { colors } = useTheme();

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/admin/unknown-intents");
        const data = await res.json();
        setIdeas(data.ideas || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch idea log.");
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    try {
      await fetch(`http://localhost:8000/admin/unknown-intents/${id}`, { method: 'DELETE' });
      setIdeas(ideas => ideas.filter(idea => idea._id !== id));
    } catch (err) {
      alert('Failed to delete idea.');
    }
  };

  // Extract unique confidence levels and module matches for filters
  const confidenceLevels = Array.from(new Set(ideas.map(i => i.classification?.confidence).filter(Boolean)));
  const moduleMatches = Array.from(new Set(ideas.map(i => i.classification?.module_match).filter(Boolean)));

  // Tag color helpers
  const confidenceColor = (level) => {
    if (!level) return colors.border;
    const l = level.toLowerCase();
    if (l === "high") return "#2ecc40";
    if (l === "medium") return "#f4b400";
    if (l === "low") return "#e74c3c";
    return colors.border;
  };
  const moduleColor = (mod) => {
    if (!mod) return colors.border;
    return "#1976d2";
  };

  // Filtering logic
  const filteredIdeas = ideas.filter(idea => {
    const conf = idea.classification?.confidence || "";
    const mod = idea.classification?.module_match || "";
    const userInput = idea.user_input?.toLowerCase() || "";
    const intent = idea.classification?.intent?.toLowerCase() || "";
    return (
      (!confidenceFilter || conf === confidenceFilter) &&
      (!moduleFilter || mod === moduleFilter) &&
      (!search || userInput.includes(search.toLowerCase()) || intent.includes(search.toLowerCase()))
    );
  });

  return (
    <div style={{ color: colors.text, padding: 24 }}>
      <h2 style={{ color: colors.text }}>Idea Log (Unknown Requests)</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
        <label>Confidence:
          <select value={confidenceFilter} onChange={e => setConfidenceFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {confidenceLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>
        <label>Module:
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {moduleMatches.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </label>
        <input
          type="text"
          placeholder="Search user input or intent..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 16, padding: 4, borderRadius: 4, border: `1px solid ${colors.border}` }}
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ background: colors.primaryLight }}>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>User Input</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Intent</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Module Match</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>New Feature</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Confidence</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Follow-up Question</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Timestamp</th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIdeas.map((idea, idx) => (
              <tr key={idea._id || idx} style={{ background: idx % 2 === 0 ? colors.cardBackground : colors.background }}>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.user_input}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.classification?.intent}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.classification?.module_match && (
                    <span style={{ background: moduleColor(idea.classification?.module_match), color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 13 }}>
                      {idea.classification?.module_match}
                    </span>
                  )}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.classification?.new_feature}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.classification?.confidence && (
                    <span style={{ background: confidenceColor(idea.classification?.confidence), color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 13 }}>
                      {idea.classification?.confidence}
                    </span>
                  )}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.classification?.follow_up_question}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>{idea.created_at ? new Date(idea.created_at).toLocaleString() : "-"}</td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <button onClick={() => handleDelete(idea._id)} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }} title="Delete this idea">🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default IdeaLog; 