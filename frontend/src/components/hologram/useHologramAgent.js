import { useState, useRef } from "react";

/**
 * Simple chat state + backend integration for the Hologram Guide.
 * Keeps local history and calls the backend endpoint for replies.
 */
export function useHologramAgent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello, I'm your Hologram Guide. I can help you explore Workplace Learning With AI. What would you like to learn about?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);
  const [mode, setMode] = useState(() => localStorage.getItem("holoChatMode") || "fast"); // 'fast' | 'accurate'

  const updateMode = (m) => {
    const v = m === "accurate" ? "accurate" : "fast";
    setMode(v);
    try { localStorage.setItem("holoChatMode", v); } catch (_) {}
  };

  const sendMessage = async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;

    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setIsLoading(true);

    try {
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (_) {}
      }
      abortRef.current = new AbortController();
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/api/hologram-agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = await res.json();
      const reply = data?.reply || "I'm having trouble accessing my AI core. Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);

      // Optional: handle actions (navigate) if provided
      if (Array.isArray(data?.actions)) {
        for (const a of data.actions) {
          if (a?.type === "NAVIGATE" && a?.target) {
            window.dispatchEvent(new CustomEvent("navigateToModule", { detail: { module: a.target } }));
          }
        }
      }
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: "Oops, I had trouble accessing my AI core. Please try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading, mode, setMode: updateMode };
}


