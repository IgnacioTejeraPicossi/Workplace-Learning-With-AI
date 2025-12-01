import React from "react";

export function VoiceSettingsPanel({
  open,
  onClose,
  language,
  setLanguage,
  autoSpeak,
  setAutoSpeak,
  muted,
  setMuted,
  voiceSupported,
}) {
  if (!open) return null;
  const languages = [
    { value: "en-US", label: "English (US)" },
    { value: "en-GB", label: "English (UK)" },
    { value: "no-NO", label: "Norwegian" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 104,
        right: 20,
        width: 270,
        padding: 10,
        borderRadius: 14,
        background: "#020617",
        color: "#e5e7eb",
        boxShadow: "0 18px 40px rgba(15,23,42,0.7)",
        zIndex: 10000,
        fontSize: "0.78rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 600 }}>Voice settings</span>
        <button
          onClick={onClose}
          style={{ border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
      {!voiceSupported && (
        <div style={{ color: "#f97316", marginBottom: 8 }}>
          Voice features are not supported in this browser.
        </div>
      )}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            width: "100%",
            borderRadius: 999,
            padding: "4px 8px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
          }}
        >
          {languages.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
          />
          Auto-play hologram replies
        </label>
      </div>
      <div>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />
          Mute hologram voice
        </label>
      </div>
    </div>
  );
}


