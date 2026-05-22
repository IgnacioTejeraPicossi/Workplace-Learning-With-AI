import { useState, useRef, useEffect } from "react";

/**
 * Simple chat state + backend integration for the Hologram Guide.
 * Keeps local history and calls the backend endpoint for replies.
 *
 * 1.15.4 — locale-aware:
 *   - `language` is forwarded to the backend so the LLM answers in the
 *     active UI locale (NO / ES / EN). When omitted, backend defaults to
 *     legacy English behaviour.
 *   - `initialGreeting` lets the caller pass a localised opening message
 *     so the first message the user sees is already in their language.
 *   - `errorReply` / `fallbackReply` allow the caller to localise the
 *     error / fallback messages that surface when the backend or LLM
 *     stack is unreachable.
 *   - When `language` changes (user flips the locale selector while the
 *     chat is open), the initial greeting auto-refreshes IF the user
 *     has not yet typed anything (i.e. only the greeting is in the log).
 */
const DEFAULT_GREETING =
  "Hello, I'm your Hologram Guide. I can help you explore Workplace Learning With AI. What would you like to learn about?";
const DEFAULT_ERROR_REPLY =
  "Oops, I had trouble accessing my AI core. Please try again in a moment.";
const DEFAULT_FALLBACK_REPLY =
  "I'm having trouble accessing my AI core. Please try again.";

export function useHologramAgent({
  language = null,
  initialGreeting = DEFAULT_GREETING,
  errorReply = DEFAULT_ERROR_REPLY,
  fallbackReply = DEFAULT_FALLBACK_REPLY,
} = {}) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: initialGreeting },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);
  const [mode, setMode] = useState(() => localStorage.getItem("holoChatMode") || "fast"); // 'fast' | 'accurate'

  // Auto-refresh greeting when the locale changes — but ONLY when no
  // conversation has happened yet (i.e. the log is just the greeting).
  // This avoids rewriting a live conversation when the user flips locale
  // mid-chat.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1) return prev;          // chat already in flight
      if (prev[0]?.role !== "assistant") return prev;
      if (prev[0]?.content === initialGreeting) return prev; // no change
      return [{ role: "assistant", content: initialGreeting }];
    });
  }, [initialGreeting]);

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
      // 1.15.4 — Forward the active UI locale so the backend can instruct
      // the LLM to answer in the same language. Field is Optional on the
      // backend side: legacy callers (without language) keep working.
      const body = { messages: next, mode };
      if (language) body.language = language;
      const res = await fetch(`${API_BASE}/api/hologram-agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = await res.json();
      const reply = data?.reply || fallbackReply;
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
        { role: "assistant", content: errorReply },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading, mode, setMode: updateMode };
}
