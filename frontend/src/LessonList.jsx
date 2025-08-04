import React, { useEffect, useState } from "react";
import { fetchLessons, deleteLesson, updateLesson } from "./api";
import { useTheme } from "./ThemeContext";

function LessonList({ user }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState({});
  const [editContent, setEditContent] = useState({});
  const { colors } = useTheme();

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await fetchLessons();
      setLessons(data.lessons || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLessons();
    } else {
      // Set loading to false when no user, so the component renders properly
      setLoading(false);
      setLessons([]);
    }
  }, [user]);

  const handleExpandToggle = id => setExpanded({ ...expanded, [id]: !expanded[id] });
  
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(id);
      await loadLessons();
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleEdit = (id, topic, lesson) => {
    setEditing({ ...editing, [id]: true });
    setEditContent({ ...editContent, [id]: { topic, lesson } });
  };
  
  const handleEditChange = (id, field, value) => {
    setEditContent({
      ...editContent,
      [id]: { ...editContent[id], [field]: value }
    });
  };
  
  const handleEditSave = async (id) => {
    const { topic, lesson } = editContent[id];
    try {
      await updateLesson(id, { topic, lesson });
      setEditing({ ...editing, [id]: false });
      await loadLessons();
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleClear = () => setFilter("");

  const filteredLessons = lessons.filter(lesson =>
    lesson.topic.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div data-testid="saved-lessons-loading">Loading saved lessons...</div>;
  if (error) return <div data-testid="saved-lessons-error" style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div 
      data-testid="saved-lessons-panel"
      style={{ margin: "32px 0", padding: "24px", maxWidth: 800, background: colors.cardBackground, borderRadius: 12, boxShadow: colors.shadow, color: colors.text }}>
      <h2 
        data-testid="saved-lessons-heading"
        style={{ marginTop: 0, color: colors.text }}>Saved Micro-lessons</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Filter by topic..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: 300, marginRight: 8, background: colors.cardBackground, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 8 }}
        />
        <button
          onClick={handleClear}
          style={{
            background: colors.cardBackground,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 1px 4px #0001"
          }}
        >
          Clear
        </button>
      </div>
      {filteredLessons.length === 0 ? (
        <div data-testid="saved-lessons-empty">No lessons found.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredLessons.map(lesson => (
            <li
              key={lesson._id}
              style={{
                marginBottom: "1.5rem",
                background: colors.primaryLight,
                borderRadius: "8px",
                padding: "1rem",
                boxShadow: colors.shadow,
                color: colors.text
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <strong>Topic:</strong>
                {editing[lesson._id] ? (
                  <input
                    value={editContent[lesson._id]?.topic || ""}
                    onChange={e =>
                      handleEditChange(lesson._id, "topic", e.target.value)
                    }
                    style={{ flex: 1, background: colors.cardBackground, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 6 }}
                  />
                ) : (
                  <span>{lesson.topic}</span>
                )}
                <button
                  onClick={() => handleExpandToggle(lesson._id)}
                  style={{
                    background: colors.cardBackground,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  {expanded[lesson._id] ? "Compress" : "Expand"}
                </button>
                <button
                  onClick={() => handleDelete(lesson._id)}
                  style={{
                    background: "#d32f2f",
                    color: "#fff",
                    border: 0,
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
                {editing[lesson._id] ? (
                  <>
                    <button
                      onClick={() => handleEditSave(lesson._id)}
                      style={{
                        background: colors.buttonPrimary,
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer"
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing({ ...editing, [lesson._id]: false })}
                      style={{
                        background: colors.cardBackground,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(lesson._id, lesson.topic, lesson.lesson)}
                    style={{
                      background: colors.buttonPrimary,
                      color: "#fff",
                      border: 0,
                      borderRadius: 6,
                      padding: "4px 12px",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              {expanded[lesson._id] && (
                <div>
                  {editing[lesson._id] ? (
                    <textarea
                      value={editContent[lesson._id]?.lesson || ""}
                      onChange={e =>
                        handleEditChange(lesson._id, "lesson", e.target.value)
                      }
                      rows={8}
                      style={{
                        width: "100%",
                        marginTop: 8,
                        fontFamily: "monospace",
                        background: colors.cardBackground,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 6,
                        padding: 8
                      }}
                    />
                  ) : (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        background: colors.cardBackground,
                        padding: "0.5rem",
                        borderRadius: "4px",
                        marginTop: "0.5rem",
                        color: colors.text
                      }}
                    >
                      {lesson.lesson}
                    </pre>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LessonList; 