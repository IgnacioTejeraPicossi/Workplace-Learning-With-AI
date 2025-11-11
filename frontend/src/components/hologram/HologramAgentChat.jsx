import React from "react";
import { useHologramAgent } from "./useHologramAgent";

export default function HologramAgentChat({ onClose }) {
  const { messages, sendMessage, isLoading, mode, setMode } = useHologramAgent();

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = String(fd.get("message") || "").trim();
    if (!text) return;
    sendMessage(text);
    e.currentTarget.reset();
  };

  return (
    <div style={{
      position: "fixed",
      right: 16,
      bottom: 16,
      width: 380,
      maxWidth: "92vw",
      height: 420,
      maxHeight: "70vh",
      background: "rgba(255,255,255,0.95)",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 16,
      boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 700 }}>Hologram Guide</div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", padding: "2px 6px", fontSize: 12 }}
            >
              <option value="fast">Fast</option>
              <option value="accurate">Accurate</option>
            </select>
          </label>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ padding: "6px 12px", fontSize: 12, color: "#6b7280" }}>
        Ask about modules, features, or learning paths in Workplace Learning With AI.
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", marginBottom: 8 }}>
            <span style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 12,
              background: m.role === "user" ? "rgba(59,130,246,0.1)" : "rgba(15,23,42,0.06)",
              color: "#111827"
            }}>
              {m.content}
            </span>
          </div>
        ))}
        {isLoading && (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>The hologram is thinking…</div>
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(0,0,0,0.08)", padding: 10 }}>
        <input
          name="message"
          placeholder="Ask me something about the app…"
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)"
          }}
        />
        <button type="submit" style={{
          padding: "8px 12px",
          borderRadius: 12,
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: "pointer"
        }}>Send</button>
      </form>
    </div>
  );
}


