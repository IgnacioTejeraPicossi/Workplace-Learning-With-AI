import React, { useEffect, useState } from "react";
import HologramAgentChat from "./HologramAgentChat";

/**
 * Floating launcher button that opens the Hologram Guide chat.
 * Non-intrusive: keeps existing hologram navigation intact.
 */
export default function HologramAgentLauncher() {
  const [open, setOpen] = useState(false);
  const [chatOnClick, setChatOnClick] = useState(() => {
    const v = localStorage.getItem("holoChatOnClick");
    return v ? v === "1" : false;
  });

  useEffect(() => {
    const handler = () => {
      if (chatOnClick) setOpen(true);
    };
    window.addEventListener("hologram-card-click", handler);
    window.addEventListener("open-holo-chat", handler);
    return () => {
      window.removeEventListener("hologram-card-click", handler);
      window.removeEventListener("open-holo-chat", handler);
    };
  }, [chatOnClick]);

  useEffect(() => {
    localStorage.setItem("holoChatOnClick", chatOnClick ? "1" : "0");
    try { window.__holoChatOnClick = chatOnClick; } catch (_) {}
  }, [chatOnClick]);

  return (
    <>
      {/* Small settings pill for toggle */}
      <div style={{
        position: "fixed",
        right: 16,
        bottom: 92,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 14,
        background: "rgba(12,40,60,0.5)",
        border: "1px solid rgba(90,200,255,0.5)",
        color: "#b9ecff",
        backdropFilter: "blur(6px)"
      }}>
        <span style={{ fontSize: 12 }}>Chat on click Hologram</span>
        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={chatOnClick}
            onChange={(e) => setChatOnClick(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <span style={{ fontSize: 12 }}>{chatOnClick ? "On" : "Off"}</span>
        </label>
      </div>

      <button
        onClick={() => setOpen(true)}
        title="Chat with the Hologram Guide"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16 + (open ? 440 : 0), // lift when chat is open to avoid overlap
          zIndex: 1000,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "1px solid rgba(90,200,255,0.6)",
          background: "radial-gradient(circle at 30% 30%, rgba(120,220,255,0.65), rgba(12,40,60,0.6))",
          color: "#e6f7ff",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          cursor: "pointer"
        }}
      >
        <span style={{ fontSize: 24, display: "block", lineHeight: "20px" }}>🤖</span>
        <span style={{ fontSize: 12 }}>Chat</span>
      </button>
      {open && <HologramAgentChat onClose={() => setOpen(false)} />}
    </>
  );
}


