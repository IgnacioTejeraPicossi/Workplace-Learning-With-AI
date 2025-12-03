import React, { useEffect, useState } from "react";
import { useHologramAgent } from "./useHologramAgent";
import { useSpeechCapture } from "./useSpeechCapture";
import { useSpeechOutput } from "./useSpeechOutput";
import { VoiceSettingsPanel } from "./VoiceSettingsPanel";
import { useAudioRecorder } from "./useAudioRecorder";

export default function HologramAgentChat({ onClose }) {
  const { messages, sendMessage, isLoading, mode, setMode } = useHologramAgent();

  // Voice state
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [muted, setMuted] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  // STT
  const {
    isSupported: sttSupported,
    isListening,
    transcript,
    error: sttError,
    startListening,
    stopListening,
    reset: resetTranscript,
  } = useSpeechCapture({ lang: voiceLanguage });

  // TTS
  const {
    supported: ttsSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useSpeechOutput({ lang: voiceLanguage, muted });

  const voiceSupported = sttSupported || ttsSupported;

  // Audio fallback
  const { supported: recSupported, isRecording, start: startRec, stop: stopRec } = useAudioRecorder();

  const uploadAndTranscribe = async (blob) => {
    if (!blob) return;
    try {
      setIsTranscribing(true);
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const fd = new FormData();
      fd.append("file", blob, "voice.webm");
      const res = await fetch(`${API_BASE}/api/stt/transcribe`, { method: "POST", body: fd });
      const data = await res.json();
      const text = (data && data.transcript) || "";
      if (text.trim()) {
        // Prefill the input with the transcription instead of auto-sending
        setMessageDraft(text.trim());
      }
    } catch (_) {
    } finally {
      setIsTranscribing(false);
    }
  };

  // Reflect interim/final transcript into the input; do not auto-send
  useEffect(() => {
    if (typeof transcript === "string") {
      setMessageDraft(transcript);
    }
  }, [transcript]);

  // Auto-speak last assistant message
  useEffect(() => {
    if (!autoSpeak || muted || !ttsSupported) return;
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && last.content) speak(last.content);
  }, [messages, autoSpeak, muted, ttsSupported, speak]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = String(messageDraft || "").trim();
    if (!text) return;
    sendMessage(text);
    setMessageDraft("");
    resetTranscript();
  };

  const toggleListening = () => {
    if (!sttSupported) return;
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      resetTranscript();
      setMessageDraft("");
      startListening();
    }
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {voiceSupported && (
            <button
              type="button"
              onClick={() => setShowVoiceSettings((v) => !v)}
              title="Voice settings"
              style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16 }}
            >
              ⚙️
            </button>
          )}
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
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
        {isListening && (
          <div style={{ fontSize: 12, color: "#2563eb" }}>
            Listening… {transcript ? `(${transcript})` : ""}
          </div>
        )}
        {sttError && (
          <div style={{ fontSize: 12, color: "#ea580c" }}>
            Speech recognition error: {sttError}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(0,0,0,0.08)", padding: 10 }}>
      <input
          name="message"
          value={messageDraft}
          onChange={(e) => setMessageDraft(e.target.value)}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px 8px 10px", fontSize: 12, color: "#6b7280" }}>
        {sttSupported ? (
          <button
            type="button"
            onClick={toggleListening}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(37,99,235,0.5)",
              background: isListening ? "rgba(37,99,235,0.08)" : "transparent",
              padding: "4px 8px",
              cursor: "pointer"
            }}
          >
            {isListening ? "🛑 Stop listening" : "🎙️ Talk to the Hologram"}
          </button>
        ) : recSupported ? (
          <button
            type="button"
            onClick={async () => {
              if (isRecording) {
                const blob = await stopRec();
                await uploadAndTranscribe(blob);
              } else {
                stopSpeaking();
                await startRec();
              }
            }}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(37,99,235,0.5)",
              background: isRecording ? "rgba(37,99,235,0.08)" : "transparent",
              padding: "4px 8px",
              cursor: "pointer"
            }}
            title="Browser STT not available – recording fallback"
          >
            {isRecording ? "🛑 Stop & transcribe" : "🎙️ Record & transcribe"}
          </button>
        ) : (
          <span>Voice input not supported.</span>
        )}
        <div>{isSpeaking && !muted ? <span style={{ color: "#16a34a" }}>Hologram is speaking…</span> : null}</div>
      </div>
      <VoiceSettingsPanel
        open={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        language={voiceLanguage}
        setLanguage={setVoiceLanguage}
        autoSpeak={autoSpeak}
        setAutoSpeak={setAutoSpeak}
        muted={muted}
        setMuted={setMuted}
        voiceSupported={voiceSupported}
      />
    </div>
  );
}


