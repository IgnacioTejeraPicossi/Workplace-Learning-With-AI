import React, { useState } from "react";
import { webSearch } from "./api";
import { useTheme } from "./ThemeContext";

function WebSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await webSearch(query);
      // Extract the actual result content from the response
      const resultContent = data.result || data.results || JSON.stringify(data, null, 2);
      setResults(resultContent);
    } catch (error) {
      console.error("Failed to search:", error);
      setResults("Error performing web search.");
    }
    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text }}>Web Search (AI + Internet)</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="🔍 Ask anything..."
            style={{ 
              width: "100%",
              padding: "12px 16px",
              paddingLeft: "40px",
              borderRadius: 8,
              border: `2px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              fontSize: 16,
              outline: "none",
              transition: "border-color 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = colors.primary}
            onBlur={(e) => e.target.style.borderColor = colors.border}
          />
          <span style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "18px",
            color: colors.textSecondary,
            pointerEvents: "none"
          }}>
            🔍
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={handleSearch}
            disabled={loading || !query}
            style={{
              background: colors.buttonPrimary,
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading || !query ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.1s ease",
              minWidth: "100px",
              whiteSpace: "nowrap"
            }}
            onMouseDown={(e) => e.target.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.target.style.transform = "scale(1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            {loading ? "⏳ Searching..." : "🔎 Search"}
          </button>
          <button
            onClick={handleClear}
            disabled={loading && !query && !results}
            style={{
              background: colors.cardBackground,
              color: colors.text,
              border: `2px solid ${colors.border}`,
              borderRadius: 8,
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading && !query && !results ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
              minWidth: "80px",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
            onMouseLeave={(e) => e.target.style.borderColor = colors.border}
          >
            🗑️ Clear
          </button>
        </div>
      </div>
      {results && (
        <div style={{ 
          marginTop: 16, 
          background: colors.cardBackground, 
          borderRadius: 8, 
          padding: 20, 
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          maxHeight: "500px",
          overflowY: "auto"
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 16, 
            color: colors.text,
            fontSize: "18px",
            fontWeight: "600"
          }}>
            🔍 Search Results for "{query}"
          </h3>
          <div style={{ 
            color: colors.text,
            lineHeight: "1.6",
            fontSize: "14px",
            whiteSpace: "pre-wrap", 
            wordBreak: "break-word"
          }}>
            {results}
          </div>
        </div>
      )}
    </div>
  );
}

export default WebSearch;
