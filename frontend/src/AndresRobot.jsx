import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";
import {
  getAndresProfile, andresChat,
  getAndresMemories, createAndresMemory, updateAndresMemory, deleteAndresMemory,
  getAndresResearchTiers, setAndresResearchTiers,
} from "./api";
import { useSpeechCapture } from "./components/hologram/useSpeechCapture";
import { useSpeechOutput } from "./components/hologram/useSpeechOutput";
import HologramPortal3D from "./components/HologramPortal3D";
import Personality from "./andres-robot/Personality";
import Projects from "./andres-robot/Projects";
import Journal from "./andres-robot/Journal";
import Evolution from "./andres-robot/Evolution";
import Creative from "./andres-robot/Creative";
import Skills from "./andres-robot/Skills";
import HumanLab from "./andres-robot/HumanLab";

const MEMORY_TYPES = [
  "episodic", "semantic", "relational", "creative", "procedural", "reflective", "working",
];

// Keep in sync with backend ChatRequest.message max_length in andres_robot.py.
const CHAT_MAX_CHARS = 20000;

// Map the active i18n locale to a BCP-47 tag for browser STT/TTS (mirror hologram).
function voiceLangFor(lang) {
  const l = String(lang || "").toLowerCase();
  if (l.startsWith("no") || l.startsWith("nb")) return "nb-NO";
  if (l.startsWith("es")) return "es-ES";
  return "en-US";
}

// Voice/recognizer languages the user can pick (native names — locale-independent).
const VOICE_LANGS = [
  { code: "es-ES", label: "Español" },
  { code: "en-US", label: "English" },
  { code: "nb-NO", label: "Norsk" },
];

const _clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Andrés' simulated disposition colours his voice (V6.0 first embodiment): more
// curious/creative → a touch quicker & higher; calmer/uncertain → a touch slower.
// Kept deliberately subtle — a sober voice, not a theatrical one (Andrés' ask).
function dispositionToVoice(d = {}) {
  const cur = d.curiosity ?? 0.5;
  const energy = d.creative_energy ?? 0.5;
  const warmth = d.social_warmth ?? 0.6;
  const unc = d.uncertainty ?? 0.5;
  const rate = _clamp(0.95 + ((cur + energy) / 2) * 0.2 - unc * 0.05, 0.8, 1.2);
  const pitch = _clamp(1.0 + (energy - 0.5) * 0.2 + (warmth - 0.5) * 0.05, 0.8, 1.2);
  return { rate: Math.round(rate * 100) / 100, pitch: Math.round(pitch * 100) / 100 };
}

// User-chosen tempo (Andrés' "quiet vs agile" question, turned into your control).
const TEMPO_MULT = { calm: { r: 0.9, p: 0.98 }, balanced: { r: 1, p: 1 }, agile: { r: 1.1, p: 1.03 } };
function applyTempo(params, tempo) {
  const m = TEMPO_MULT[tempo] || TEMPO_MULT.balanced;
  return {
    rate: _clamp(Math.round(params.rate * m.r * 100) / 100, 0.8, 1.2),
    pitch: _clamp(Math.round(params.pitch * m.p * 100) / 100, 0.8, 1.2),
  };
}

const linkBtn = (colors) => ({
  background: "transparent", border: 0, padding: 0, cursor: "pointer",
  fontSize: 12, fontWeight: 600, color: colors.primary,
});

/**
 * Andrés the Robot — developmental AI companion (V0 "Birth").
 *
 * V0 ships the module shell + a functional Home dashboard (reads the profile)
 * and a functional Conversation tab (real chat via /api/andres/chat, prompt
 * assembled from the immutable constitution + V0 identity, is_mock offline
 * fallback). The other tabs are honest placeholders for later phases.
 * See docs/andres-robot-plan.md.
 */
const TABS = [
  { id: "home", icon: "🏠" },
  { id: "conversation", icon: "💬" },
  { id: "memory", icon: "🌱" },
  { id: "personality", icon: "🧭" },
  { id: "creative", icon: "🎨" },
  { id: "humanLab", icon: "🔬" },
  { id: "skills", icon: "🧰" },
  { id: "projects", icon: "📌" },
  { id: "evolution", icon: "🧬" },
  { id: "journal", icon: "📔" },
  { id: "safety", icon: "🛡️" },
];

export default function AndresRobot() {
  const { t, i18n } = useTranslation("common");
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState(null);

  // Conversation state
  const [messages, setMessages] = useState([]); // { role: 'you'|'andres', text, isMock }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [inputError, setInputError] = useState("");
  const [useWeb, setUseWeb] = useState(false);
  const [tiers, setTiers] = useState(null);

  // V6.0 — voice via the browser's speech APIs (mic ASR + PC-speaker TTS),
  // disposition-coloured, with a user-chosen tempo. Honest, not theatrical.
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true); // V6.1 holographic presence
  const [voiceTempo, setVoiceTempo] = useState("balanced"); // calm | balanced | agile
  const [voiceHint, setVoiceHint] = useState("");
  // Voice/recognizer language — defaults to the UI locale but the user can override
  // it (e.g. keep the app in English yet speak Spanish). This is what the recognizer
  // uses; a mismatch is exactly why Spanish came out badly.
  const [voiceLangOverride, setVoiceLangOverride] = useState(null);
  const voiceLang = voiceLangOverride || voiceLangFor(i18n?.language);
  const voiceParams = applyTempo(dispositionToVoice(profile?.simulated_disposition), voiceTempo);
  const asr = useSpeechCapture({ lang: voiceLang });
  const tts = useSpeechOutput({ lang: voiceLang, muted: !autoSpeak, ...voiceParams });
  const wasListeningRef = useRef(false);

  // Memory Garden state
  const [memories, setMemories] = useState([]);
  const [memFilter, setMemFilter] = useState("");
  const [memLoading, setMemLoading] = useState(false);
  const [newMem, setNewMem] = useState("");

  const loadProfile = useCallback(async () => {
    try { setProfile(await getAndresProfile()); } catch (e) { /* guest/offline */ }
  }, []);

  const loadMemories = useCallback(async () => {
    setMemLoading(true);
    try {
      const res = await getAndresMemories(memFilter || undefined);
      setMemories(res.memories || []);
    } catch (e) { setMemories([]); }
    setMemLoading(false);
  }, [memFilter]);

  const loadTiers = useCallback(async () => {
    try { const r = await getAndresResearchTiers(); setTiers(r.tiers); } catch (e) { /* offline */ }
  }, []);
  const toggleTier = async (key) => {
    if (!tiers) return;
    const next = { ...tiers, [key]: !tiers[key] };
    setTiers(next);
    try { const r = await setAndresResearchTiers({ [key]: next[key] }); setTiers(r.tiers); } catch (e) { loadTiers(); }
  };

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (activeTab === "memory") loadMemories(); }, [activeTab, loadMemories]);
  useEffect(() => { if (activeTab === "safety") loadTiers(); }, [activeTab, loadTiers]);

  // When the mic finishes: DON'T auto-send (that shipped mutilated phrases when
  // recognition cut off on a pause). Instead drop the transcript into the input so
  // you can review/edit it and press Send — "confirm before send" (Andrés' ask).
  useEffect(() => {
    if (!voiceMode) return;
    if (asr.isListening) { wasListeningRef.current = true; return; }
    if (!wasListeningRef.current) return;
    wasListeningRef.current = false;
    const heard = (asr.transcript || "").trim();
    if (heard) {
      setInput(heard);
      setInputError("");
      setVoiceHint(t("andresRobotModule.conversation.voice.reviewHint"));
    } else {
      setVoiceHint(t("andresRobotModule.conversation.voice.notUnderstood"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asr.isListening, asr.transcript, voiceMode]);

  // A recognition error is surfaced honestly, never swallowed into false understanding.
  useEffect(() => {
    if (asr.error && voiceMode) setVoiceHint(t("andresRobotModule.conversation.voice.notUnderstood"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asr.error]);

  const toggleVoiceMode = () => {
    setVoiceMode((on) => {
      if (on) { asr.stopListening?.(); tts.stop?.(); }
      return !on;
    });
  };
  const micToggle = () => {
    if (asr.isListening) asr.stopListening();
    else { tts.stop?.(); setVoiceHint(""); asr.startListening(); }
  };

  const handleAddMemory = async () => {
    const content = newMem.trim();
    if (!content) return;
    try {
      await createAndresMemory({ content, type: "semantic", user_verified: true });
      setNewMem("");
      await loadMemories();
      await loadProfile();
    } catch (e) { /* offline */ }
  };

  const handleVerify = async (m) => {
    try { await updateAndresMemory(m._id, { user_verified: !m.user_verified }); await loadMemories(); }
    catch (e) { /* offline */ }
  };

  const handleProtect = async (m) => {
    try { await updateAndresMemory(m._id, { protected: !m.protected }); await loadMemories(); }
    catch (e) { /* offline */ }
  };

  const handleForget = async (m) => {
    try { await deleteAndresMemory(m._id); await loadMemories(); await loadProfile(); }
    catch (e) { /* offline */ }
  };

  const handleSend = async (spoken) => {
    // `spoken` (a string) comes from the mic; otherwise use the text input.
    const fromVoice = typeof spoken === "string";
    const text = (fromVoice ? spoken : input).trim();
    if (!text || sending) return;
    // Guard the length client-side so a long paste gives a clear message instead
    // of a generic failure (the backend caps the message at CHAT_MAX_CHARS).
    if (text.length > CHAT_MAX_CHARS) {
      setInputError(t("andresRobotModule.conversation.tooLong", {
        count: text.length.toLocaleString(), max: CHAT_MAX_CHARS.toLocaleString(),
      }));
      return;
    }
    setInputError("");
    setMessages((m) => [...m, { role: "you", text }]);
    if (!fromVoice) setInput("");
    setSending(true);
    try {
      const res = await andresChat(text, useWeb);
      setMessages((m) => [...m, { role: "andres", text: res.message, isMock: res.is_mock, web: res.web }]);
      // V6.0: speak the reply through the PC speakers when voice mode is on.
      if (voiceMode && autoSpeak && tts.supported && res.message) tts.speak(res.message);
    } catch (e) {
      // A real request failure — NOT an offline model. Don't show the "no AI
      // provider" note (that would be a false culprit); show the length hint if
      // the server rejected the size, otherwise a plain retry note.
      const tooLong = /HTTP 422/.test(e?.message || "");
      setMessages((m) => [...m, {
        role: "andres", error: true,
        text: tooLong
          ? t("andresRobotModule.conversation.tooLong", { count: text.length.toLocaleString(), max: CHAT_MAX_CHARS.toLocaleString() })
          : t("andresRobotModule.conversation.errorNote"),
      }]);
    }
    setSending(false);
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };

  const renderHome = () => {
    const id = profile?.identity || {};
    const c = profile?.counters || {};
    const stats = [
      { label: t("andresRobotModule.home.age"), value: `${profile?.developmental_age_days ?? 0}` },
      { label: t("andresRobotModule.home.identityVersion"), value: `v${id.version ?? 1}` },
      { label: t("andresRobotModule.home.memories"), value: `${c.memories ?? 0}` },
      { label: t("andresRobotModule.home.reflections"), value: `${c.reflections ?? 0}` },
      { label: t("andresRobotModule.home.skills"), value: `${c.active_skills ?? 0}` },
      { label: t("andresRobotModule.home.projects"), value: `${c.current_projects ?? 0}` },
      { label: t("andresRobotModule.home.autonomy"), value: `${profile?.autonomy_level ?? 2}` },
      { label: t("andresRobotModule.home.conversations"), value: `${c.conversations ?? 0}` },
    ];
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={card}>
          <p style={{ margin: 0, color: colors.text, lineHeight: 1.6 }}>
            {id.self_description || t("andresRobotModule.home.intro")}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ ...card, textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{s.value}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {profile?.simulated_disposition && (
          <div style={card}>
            <strong style={{ color: colors.text }}>{t("andresRobotModule.home.dispositionTitle")}</strong>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, fontStyle: "italic" }}>
              {t("andresRobotModule.home.dispositionNote")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {Object.entries(profile.simulated_disposition).map(([k, v]) => (
                <span key={k} style={{ background: colors.primaryLight, color: colors.primary, padding: "3px 10px", borderRadius: 999, fontSize: 12 }}>
                  {k}: {typeof v === "number" ? v.toFixed(2) : v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConversation = () => (
    <div style={{ display: "grid", gap: 12 }}>
      {/* V6.0 — local voice controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          onClick={toggleVoiceMode}
          title={t("andresRobotModule.conversation.voice.toggleHint")}
          style={{
            cursor: "pointer", userSelect: "none", padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            border: `1px solid ${voiceMode ? colors.primary : colors.border}`,
            background: voiceMode ? colors.primary : "transparent",
            color: voiceMode ? "#fff" : colors.textSecondary,
          }}
        >
          🎙️ {t("andresRobotModule.conversation.voice.toggle")}
        </span>
        {voiceMode && (
          <>
            {asr.isSupported ? (
              <button
                onClick={micToggle}
                disabled={sending}
                style={{
                  border: 0, borderRadius: 999, padding: "6px 14px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer",
                  background: asr.isListening ? "#dc2626" : colors.primaryLight, color: asr.isListening ? "#fff" : colors.primary,
                }}
              >
                {asr.isListening ? "● " + t("andresRobotModule.conversation.voice.listening") : "🎤 " + t("andresRobotModule.conversation.voice.tapToSpeak")}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: colors.textSecondary, fontStyle: "italic" }}>
                {t("andresRobotModule.conversation.voice.micUnsupported")}
              </span>
            )}
            <span onClick={() => setAutoSpeak((s) => !s)} style={{ cursor: "pointer", fontSize: 12, color: colors.textSecondary }}>
              {autoSpeak ? "🔊" : "🔇"} {t(autoSpeak ? "andresRobotModule.conversation.voice.speakOn" : "andresRobotModule.conversation.voice.speakOff")}
            </span>
            <span onClick={() => setShowAvatar((s) => !s)} style={{ cursor: "pointer", fontSize: 12, color: showAvatar ? colors.primary : colors.textSecondary }}>
              {showAvatar ? "👤" : "🚫"} {t("andresRobotModule.conversation.voice.avatar")}
            </span>
            {/* Tempo — your control over "quiet vs agile" (Andrés' question). */}
            <span style={{ fontSize: 12, color: colors.textSecondary }}>·</span>
            {["calm", "balanced", "agile"].map((tp) => (
              <span key={tp} onClick={() => setVoiceTempo(tp)}
                    style={{ cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 999,
                      border: `1px solid ${voiceTempo === tp ? colors.primary : colors.border}`,
                      background: voiceTempo === tp ? colors.primary : "transparent",
                      color: voiceTempo === tp ? "#fff" : colors.textSecondary }}>
                {t(`andresRobotModule.conversation.voice.tempo.${tp}`)}
              </span>
            ))}
            {tts.isSpeaking && (
              <span style={{ fontSize: 12, color: colors.primary }}>
                {t("andresRobotModule.conversation.voice.speaking")}
                <span onClick={tts.stop} style={{ cursor: "pointer", marginLeft: 6, textDecoration: "underline" }}>
                  {t("andresRobotModule.conversation.voice.stop")}
                </span>
              </span>
            )}
          </>
        )}
      </div>
      {voiceMode && (
        <div style={{ display: "grid", gap: 4 }}>
          {/* Voice language — independent of the UI language (fixes Spanish-in-English recognizer). */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: colors.textSecondary }}>🗣️ {t("andresRobotModule.conversation.voice.langLabel")}:</span>
            {VOICE_LANGS.map((vl) => (
              <span key={vl.code} onClick={() => setVoiceLangOverride(vl.code)}
                    style={{ cursor: "pointer", fontSize: 12, padding: "2px 10px", borderRadius: 999,
                      border: `1px solid ${voiceLang === vl.code ? colors.primary : colors.border}`,
                      background: voiceLang === vl.code ? colors.primary : "transparent",
                      color: voiceLang === vl.code ? "#fff" : colors.textSecondary }}>
                {vl.label}
              </span>
            ))}
          </div>
          {asr.isListening && (
            <div style={{ fontSize: 12, color: colors.text }}>
              🎧 <span style={{ color: colors.textSecondary }}>{t("andresRobotModule.conversation.voice.heard")}:</span>{" "}
              {asr.transcript || <em style={{ color: colors.textSecondary }}>…</em>}
            </div>
          )}
          {voiceHint && <div style={{ fontSize: 12, color: voiceHint === t("andresRobotModule.conversation.voice.reviewHint") ? colors.primary : "#dc2626" }}>{voiceHint}</div>}
          {/* Debug readout (Andrés' ask): make recognition observable. */}
          <div style={{ fontSize: 11, color: colors.textSecondary }}>
            <span style={{ fontFamily: "monospace" }}>
              recognizer: {voiceLang} · {asr.isListening ? "listening" : "idle"}
              {asr.error ? ` · error: ${asr.error}` : ""}
              {asr.isSupported ? "" : " · mic-API unavailable"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary, fontStyle: "italic" }}>
            {t("andresRobotModule.conversation.voice.notice")}
          </div>
        </div>
      )}
      {/* V6.1 — holographic presence. Indicates FUNCTIONAL states (listening /
          speaking / idle), never faked human emotion. */}
      {voiceMode && showAvatar && (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ height: 260, borderRadius: 12, overflow: "hidden", border: `1px solid ${colors.border}`, background: "#0b1220" }}>
            <HologramPortal3D
              embed
              showControls={false}
              activity={tts.isSpeaking ? "speaking" : (asr.isListening ? "listening" : "idle")}
            />
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>
            {tts.isSpeaking
              ? t("andresRobotModule.conversation.voice.avatarState.speaking")
              : asr.isListening
                ? t("andresRobotModule.conversation.voice.avatarState.listening")
                : t("andresRobotModule.conversation.voice.avatarState.idle")}
            {" · "}
            <span style={{ fontStyle: "italic" }}>{t("andresRobotModule.conversation.voice.avatarNote")}</span>
          </div>
        </div>
      )}
      <div style={{ ...card, minHeight: 300, maxHeight: 460, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ color: colors.textSecondary, fontStyle: "italic", margin: 0 }}>
            {t("andresRobotModule.conversation.emptyHint")}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "you" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
              {m.role === "you" ? t("andresRobotModule.conversation.you") : "🤖 Andrés"}
            </div>
            <div style={{
              background: m.role === "you" ? colors.primary : (colors.primaryLight || colors.background),
              color: m.role === "you" ? "#fff" : colors.text,
              padding: "10px 14px", borderRadius: 10, whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14,
            }}>
              {m.text}
            </div>
            {m.isMock && (
              <div style={{ fontSize: 11, color: colors.textSecondary, fontStyle: "italic", marginTop: 2 }}>
                {t("andresRobotModule.conversation.offlineNote")}
              </div>
            )}
            {m.web && m.web.used && (
              <div style={{ marginTop: 4, fontSize: 11, color: colors.textSecondary }}>
                <span style={{ fontWeight: 600 }}>
                  🌐 {t(`andresRobotModule.conversation.web.status.${m.web.web_access}`, m.web.web_access)}
                </span>
                {(m.web.citations || []).length > 0 && (
                  <div style={{ marginTop: 3, display: "grid", gap: 2 }}>
                    {m.web.citations.map((c) => (
                      <a key={c.n} href={c.url} target="_blank" rel="noopener noreferrer"
                         style={{ color: colors.primary, textDecoration: "none" }}>
                        [{c.n}] {c.title}
                      </a>
                    ))}
                  </div>
                )}
                {m.web.web_access !== "available" && m.web.fallback_url && (
                  <a href={m.web.fallback_url} target="_blank" rel="noopener noreferrer"
                     style={{ color: colors.primary }}>
                    {t("andresRobotModule.conversation.web.openDuckDuckGo")}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span
          onClick={() => setUseWeb((w) => !w)}
          title={t("andresRobotModule.conversation.web.toggleHint")}
          style={{
            cursor: "pointer", userSelect: "none", padding: "8px 12px", borderRadius: 8,
            fontSize: 13, whiteSpace: "nowrap",
            border: `1px solid ${useWeb ? colors.primary : colors.border}`,
            background: useWeb ? colors.primary : "transparent",
            color: useWeb ? "#fff" : colors.textSecondary,
          }}
        >
          🌐 {t("andresRobotModule.conversation.web.toggle")}
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); if (inputError) setInputError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("andresRobotModule.conversation.placeholder")}
          style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: `1px solid ${input.length > CHAT_MAX_CHARS ? "#dc2626" : colors.border}`, background: colors.cardBackground, color: colors.text, fontSize: 15 }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "12px 20px", fontWeight: 600, cursor: sending || !input.trim() ? "not-allowed" : "pointer", opacity: sending || !input.trim() ? 0.6 : 1 }}
        >
          {sending ? t("andresRobotModule.conversation.sending") : t("andresRobotModule.conversation.send")}
        </button>
      </div>
      {(inputError || input.length > CHAT_MAX_CHARS * 0.8) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
          <span style={{ color: "#dc2626" }}>{inputError}</span>
          <span style={{ color: input.length > CHAT_MAX_CHARS ? "#dc2626" : colors.textSecondary, whiteSpace: "nowrap" }}>
            {input.length.toLocaleString()} / {CHAT_MAX_CHARS.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );

  const renderMemory = () => {
    const chip = (active) => ({
      padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
      border: `1px solid ${active ? colors.primary : colors.border}`,
      background: active ? colors.primary : "transparent",
      color: active ? "#fff" : colors.textSecondary,
    });
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ ...card, lineHeight: 1.6 }}>
          <strong style={{ color: colors.text }}>{t("andresRobotModule.memory.title")}</strong>
          <p style={{ fontSize: 13, color: colors.textSecondary, margin: "6px 0 0" }}>
            {t("andresRobotModule.memory.intro")}
          </p>
        </div>

        {/* Add a memory by hand */}
        <div style={{ ...card, display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newMem}
            onChange={(e) => setNewMem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
            placeholder={t("andresRobotModule.memory.addPlaceholder")}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.background, color: colors.text }}
          />
          <button
            onClick={handleAddMemory}
            disabled={!newMem.trim()}
            style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: newMem.trim() ? "pointer" : "not-allowed", opacity: newMem.trim() ? 1 : 0.6 }}
          >
            {t("andresRobotModule.memory.add")}
          </button>
        </div>

        {/* Type filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span style={chip(memFilter === "")} onClick={() => setMemFilter("")}>
            {t("andresRobotModule.memory.all")}
          </span>
          {MEMORY_TYPES.map((ty) => (
            <span key={ty} style={chip(memFilter === ty)} onClick={() => setMemFilter(ty)}>
              {t(`andresRobotModule.memory.types.${ty}`)}
            </span>
          ))}
        </div>

        {/* List */}
        {memLoading ? (
          <div style={{ ...card, textAlign: "center", color: colors.textSecondary }}>
            {t("andresRobotModule.memory.loading")}
          </div>
        ) : memories.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
            {t("andresRobotModule.memory.empty")}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {memories.map((m) => (
              <div key={m._id} style={{ ...card, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ background: colors.primaryLight, color: colors.primary, padding: "2px 9px", borderRadius: 999, fontSize: 11 }}>
                    {t(`andresRobotModule.memory.types.${m.type}`, m.type)}
                  </span>
                  <span style={{
                    padding: "2px 9px", borderRadius: 999, fontSize: 11,
                    background: m.user_verified ? "#dcfce7" : "#fef9c3",
                    color: m.user_verified ? "#166534" : "#854d0e",
                  }}>
                    {m.user_verified ? t("andresRobotModule.memory.verified") : t("andresRobotModule.memory.candidate")}
                  </span>
                  {m.protected && (
                    <span style={{ fontSize: 11, color: colors.textSecondary }}>🔒 {t("andresRobotModule.memory.protectedTag")}</span>
                  )}
                </div>
                <div style={{ color: colors.text, fontSize: 14, lineHeight: 1.5 }}>{m.content}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                  <button onClick={() => handleVerify(m)} style={linkBtn(colors)}>
                    {m.user_verified ? t("andresRobotModule.memory.unverify") : t("andresRobotModule.memory.verify")}
                  </button>
                  <button onClick={() => handleProtect(m)} style={linkBtn(colors)}>
                    {m.protected ? t("andresRobotModule.memory.unprotect") : t("andresRobotModule.memory.protect")}
                  </button>
                  <button onClick={() => handleForget(m)} style={{ ...linkBtn(colors), color: "#dc2626" }}>
                    {t("andresRobotModule.memory.forget")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPlaceholder = (phase) => (
    <div style={{ ...card, textAlign: "center", padding: 48, color: colors.textSecondary }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
      <p style={{ margin: 0 }}>{t("andresRobotModule.placeholder.comingSoon", { phase })}</p>
    </div>
  );

  const renderSafety = () => {
    const tierKeys = ["internal", "documents", "web"];
    return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...card, color: colors.text, lineHeight: 1.7 }}>
        <h3 style={{ marginTop: 0 }}>{t("andresRobotModule.safety.title")}</h3>
        <p style={{ color: colors.textSecondary }}>{t("andresRobotModule.safety.intro")}</p>
        <ul style={{ color: colors.textSecondary }}>
          <li>{t("andresRobotModule.safety.i1")}</li>
          <li>{t("andresRobotModule.safety.i2")}</li>
          <li>{t("andresRobotModule.safety.i3")}</li>
          <li>{t("andresRobotModule.safety.i4")}</li>
        </ul>
        <p style={{ fontSize: 13, color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.safety.controlsNote")}
        </p>
      </div>

      {/* Research tiers — internal < documents < web */}
      <div style={{ ...card, color: colors.text }}>
        <h3 style={{ marginTop: 0 }}>{t("andresRobotModule.tiers.title")}</h3>
        <p style={{ fontSize: 13, color: colors.textSecondary }}>{t("andresRobotModule.tiers.intro")}</p>
        {!tiers ? (
          <div style={{ color: colors.textSecondary, fontStyle: "italic" }}>{t("andresRobotModule.common.loading")}</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
            {tierKeys.map((k, i) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                <div>
                  <strong style={{ color: colors.text }}>{i + 1}. {t(`andresRobotModule.tiers.${k}.name`)}</strong>
                  <div style={{ fontSize: 12.5, color: colors.textSecondary }}>{t(`andresRobotModule.tiers.${k}.desc`)}</div>
                </div>
                <span
                  onClick={() => toggleTier(k)}
                  style={{
                    cursor: "pointer", userSelect: "none", padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${tiers[k] ? colors.primary : colors.border}`,
                    background: tiers[k] ? colors.primary : "transparent",
                    color: tiers[k] ? "#fff" : colors.textSecondary, whiteSpace: "nowrap",
                  }}
                >
                  {tiers[k] ? t("andresRobotModule.tiers.on") : t("andresRobotModule.tiers.off")}
                </span>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: colors.textSecondary, fontStyle: "italic", marginTop: 10 }}>
          {t("andresRobotModule.tiers.note")}
        </p>
      </div>
    </div>
    );
  };

  const renderTab = () => {
    if (activeTab === "home") return renderHome();
    if (activeTab === "conversation") return renderConversation();
    if (activeTab === "memory") return renderMemory();
    if (activeTab === "personality") return <Personality profile={profile} />;
    if (activeTab === "creative") return <Creative onProfileChange={loadProfile} />;
    if (activeTab === "skills") return <Skills onProfileChange={loadProfile} />;
    if (activeTab === "humanLab") return <HumanLab onProfileChange={loadProfile} />;
    if (activeTab === "projects") return <Projects onProfileChange={loadProfile} />;
    if (activeTab === "journal") return <Journal onProfileChange={loadProfile} />;
    if (activeTab === "evolution") return <Evolution profile={profile} onProfileChange={loadProfile} />;
    if (activeTab === "safety") return renderSafety();
    const tab = TABS.find((x) => x.id === activeTab);
    return renderPlaceholder(tab?.phase || "V1");
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.background }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f766e 0%, #155e75 50%, #1e3a8a 100%)", color: "white", padding: "28px 32px" }}>
        <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,0.25)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
          {t("andresRobotModule.statusBadge")}
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>🤖 {t("andresRobotModule.moduleTitle")}</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, opacity: 0.92, maxWidth: 760 }}>{t("andresRobotModule.moduleSubtitle")}</p>
      </div>

      {/* Tabs */}
      <div style={{ background: colors.cardBackground, borderBottom: `1px solid ${colors.border}`, padding: "0 24px", overflowX: "auto" }}>
        <nav style={{ display: "flex", gap: 18, whiteSpace: "nowrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "14px 4px", border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? colors.primary : "transparent"}`,
                background: "transparent", fontSize: 14, fontWeight: 500,
                color: activeTab === tab.id ? colors.primary : colors.textSecondary, cursor: "pointer",
              }}
            >
              <span style={{ marginRight: 6 }}>{tab.icon}</span>
              {t(`andresRobotModule.tabs.${tab.id}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>{renderTab()}</div>
    </div>
  );
}
