import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";
import {
  getAndresProfile, andresChat,
  getAndresMemories, createAndresMemory, updateAndresMemory, deleteAndresMemory,
} from "./api";
import Personality from "./andres-robot/Personality";
import Projects from "./andres-robot/Projects";
import Journal from "./andres-robot/Journal";
import Evolution from "./andres-robot/Evolution";
import Creative from "./andres-robot/Creative";
import Skills from "./andres-robot/Skills";

const MEMORY_TYPES = [
  "episodic", "semantic", "relational", "creative", "procedural", "reflective", "working",
];

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
  { id: "humanLab", icon: "🔬", phase: "V5" },
  { id: "skills", icon: "🧰" },
  { id: "projects", icon: "📌" },
  { id: "evolution", icon: "🧬" },
  { id: "journal", icon: "📔" },
  { id: "safety", icon: "🛡️" },
];

export default function AndresRobot() {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState(null);

  // Conversation state
  const [messages, setMessages] = useState([]); // { role: 'you'|'andres', text, isMock }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

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

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (activeTab === "memory") loadMemories(); }, [activeTab, loadMemories]);

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "you", text }]);
    setInput("");
    setSending(true);
    try {
      const res = await andresChat(text);
      setMessages((m) => [...m, { role: "andres", text: res.message, isMock: res.is_mock }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "andres", text: t("andresRobotModule.conversation.errorNote"), isMock: true }]);
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
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("andresRobotModule.conversation.placeholder")}
          style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.cardBackground, color: colors.text, fontSize: 15 }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "12px 20px", fontWeight: 600, cursor: sending || !input.trim() ? "not-allowed" : "pointer", opacity: sending || !input.trim() ? 0.6 : 1 }}
        >
          {sending ? t("andresRobotModule.conversation.sending") : t("andresRobotModule.conversation.send")}
        </button>
      </div>
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

  const renderSafety = () => (
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
  );

  const renderTab = () => {
    if (activeTab === "home") return renderHome();
    if (activeTab === "conversation") return renderConversation();
    if (activeTab === "memory") return renderMemory();
    if (activeTab === "personality") return <Personality profile={profile} />;
    if (activeTab === "creative") return <Creative onProfileChange={loadProfile} />;
    if (activeTab === "skills") return <Skills onProfileChange={loadProfile} />;
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
