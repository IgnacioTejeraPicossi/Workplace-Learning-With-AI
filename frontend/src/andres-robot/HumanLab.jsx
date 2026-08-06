import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  suggestAndresDevelopment, getAndresSuggestions, actAndresSuggestion,
  getAndresIdentityHistory, exportAndresCapsule, previewAndresCapsule, importAndresCapsule,
} from "../api";

/**
 * Andrés — Development Lab (V5). "Companion with his own initiative" track.
 *
 * Three user-initiated, fully auditable sections:
 * 1. Andrés' own developmental suggestions — he PROPOSES; the user accepts/dismisses.
 * 2. Identity history — the version timeline with diffs (nothing changes silently).
 * 3. Personality Capsule — export a portable snapshot; import applies identity only,
 *    reversibly, after showing a legible diff.
 */
export default function HumanLab({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();

  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [history, setHistory] = useState([]);
  const [capsule, setCapsule] = useState(null);
  const [importText, setImportText] = useState("");
  const [diff, setDiff] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        getAndresSuggestions().catch(() => ({ suggestions: [] })),
        getAndresIdentityHistory().catch(() => ({ history: [] })),
      ]);
      setSuggestions(s.suggestions || []);
      setHistory(h.history || []);
    } catch (e) { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setSuggesting(true);
    try { await suggestAndresDevelopment(); await load(); }
    catch (e) { /* offline */ }
    setSuggesting(false);
  };

  const act = async (s, action) => {
    try { await actAndresSuggestion(s._id, action); await load(); onProfileChange && onProfileChange(); }
    catch (e) { /* offline */ }
  };

  const doExport = async () => {
    try { setCapsule(await exportAndresCapsule()); } catch (e) { /* offline */ }
  };

  const doPreview = async () => {
    setMsg("");
    let parsed;
    try { parsed = JSON.parse(importText); }
    catch (e) { setMsg(t("andresRobotModule.humanLab.badJson")); return; }
    try { setDiff(await previewAndresCapsule(parsed)); }
    catch (e) { setMsg(e?.message || t("andresRobotModule.humanLab.previewFail")); }
  };

  const doImport = async () => {
    let parsed;
    try { parsed = JSON.parse(importText); } catch (e) { setMsg(t("andresRobotModule.humanLab.badJson")); return; }
    try {
      const r = await importAndresCapsule(parsed);
      setMsg(t("andresRobotModule.humanLab.imported", { v: r.version }));
      setDiff(null); setImportText("");
      await load(); onProfileChange && onProfileChange();
    } catch (e) { setMsg(e?.message || t("andresRobotModule.humanLab.importFail")); }
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };
  const btn = (busy) => ({
    background: colors.primary, color: "#fff", border: 0, borderRadius: 8,
    padding: "9px 16px", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
  });
  const input = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
    background: colors.background, color: colors.text, width: "100%", boxSizing: "border-box",
    fontFamily: "monospace", fontSize: 12,
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* 1. Andrés' initiative */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: colors.text }}>{t("andresRobotModule.humanLab.initiativeTitle")}</strong>
          <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 0", maxWidth: 640 }}>
            {t("andresRobotModule.humanLab.initiativeIntro")}
          </p>
        </div>
        <button onClick={generate} disabled={suggesting} style={btn(suggesting)}>
          {suggesting ? t("andresRobotModule.humanLab.thinking") : t("andresRobotModule.humanLab.propose")}
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.humanLab.noSuggestions")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {suggestions.map((s) => (
            <div key={s._id} style={{ ...card, padding: 16, opacity: s.status === "dismissed" ? 0.5 : 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ background: colors.primaryLight, color: colors.primary, padding: "2px 10px", borderRadius: 999, fontSize: 11 }}>
                  {t(`andresRobotModule.humanLab.kinds.${s.kind}`, s.kind)}
                </span>
                {s.status !== "open" && (
                  <span style={{ fontSize: 11, color: colors.textSecondary }}>
                    {t(`andresRobotModule.humanLab.suggestionStatus.${s.status}`, s.status)}
                  </span>
                )}
                {s.is_mock && <span style={{ fontSize: 11, color: colors.textSecondary, fontStyle: "italic" }}>{t("andresRobotModule.humanLab.offlineTag")}</span>}
              </div>
              <div style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{s.title}</div>
              {s.rationale && <p style={{ color: colors.textSecondary, fontSize: 13, margin: "4px 0 0" }}>{s.rationale}</p>}
              {(s.benefit || s.risk || s.success_criterion || s.close_plan) && (
                <div style={{ display: "grid", gap: 4, marginTop: 8, fontSize: 12.5, color: colors.text }}>
                  {s.benefit && <div><span style={{ color: colors.textSecondary }}>{t("andresRobotModule.humanLab.benefit")}: </span>{s.benefit}</div>}
                  {s.risk && <div><span style={{ color: colors.textSecondary }}>{t("andresRobotModule.humanLab.risk")}: </span>{s.risk}</div>}
                  {s.success_criterion && <div><span style={{ color: colors.textSecondary }}>{t("andresRobotModule.humanLab.success")}: </span>{s.success_criterion}</div>}
                  {s.close_plan && <div><span style={{ color: colors.textSecondary }}>{t("andresRobotModule.humanLab.closePlan")}: </span>{s.close_plan}</div>}
                </div>
              )}
              {s.status === "open" && (
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button onClick={() => act(s, "accept")}
                          style={{ background: "#16a34a", color: "#fff", border: 0, borderRadius: 8, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>
                    {t("andresRobotModule.humanLab.accept")}
                  </button>
                  <button onClick={() => act(s, "dismiss")}
                          style={{ background: "transparent", color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                    {t("andresRobotModule.humanLab.dismiss")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. Identity history */}
      <div style={{ ...card }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.humanLab.historyTitle")}</strong>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 10px" }}>
          {t("andresRobotModule.humanLab.historyIntro")}
        </p>
        {history.length === 0 ? (
          <div style={{ color: colors.textSecondary, fontStyle: "italic" }}>{t("andresRobotModule.humanLab.noHistory")}</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${h.current ? colors.primary : colors.border}`, paddingLeft: 12 }}>
                <div style={{ fontWeight: 600, color: colors.text, fontSize: 13 }}>
                  v{h.version}{h.current ? ` · ${t("andresRobotModule.humanLab.currentTag")}` : ""}
                  {h.reason && !h.current ? <span style={{ color: colors.textSecondary, fontWeight: 400 }}> — {h.reason}</span> : null}
                </div>
                {h.diff && h.diff.changes && h.diff.changes.length > 0 && (
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {h.diff.changes.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Personality Capsule */}
      <div style={{ ...card }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.humanLab.capsuleTitle")}</strong>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 10px" }}>
          {t("andresRobotModule.humanLab.capsuleIntro")}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button onClick={doExport} style={btn(false)}>{t("andresRobotModule.humanLab.export")}</button>
        </div>
        {capsule && (
          <pre style={{ ...input, minHeight: 80, maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(capsule, null, 2)}
          </pre>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: colors.text, fontWeight: 600, marginBottom: 6 }}>
            {t("andresRobotModule.humanLab.importTitle")}
          </div>
          <textarea style={{ ...input, minHeight: 90, resize: "vertical" }} value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={t("andresRobotModule.humanLab.importPlaceholder")} />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={doPreview} disabled={!importText.trim()}
                    style={{ background: "transparent", border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: importText.trim() ? "pointer" : "not-allowed", opacity: importText.trim() ? 1 : 0.6 }}>
              {t("andresRobotModule.humanLab.preview")}
            </button>
            {diff && (
              <button onClick={doImport} style={btn(false)}>{t("andresRobotModule.humanLab.applyImport")}</button>
            )}
          </div>
          {msg && <div style={{ marginTop: 8, fontSize: 13, color: colors.text }}>{msg}</div>}
          {diff && (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: colors.background, border: `1px dashed ${colors.border}` }}>
              <strong style={{ fontSize: 12, color: colors.textSecondary }}>{t("andresRobotModule.humanLab.diffTitle")}</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, color: colors.text }}>
                {diff.self_description_changes && <li>{t("andresRobotModule.humanLab.diffSelf")}</li>}
                {(diff.trait_changes || []).map((c, i) => (
                  <li key={i}>{c.trait}: {c.from} → {c.to}</li>
                ))}
                {(diff.interests_added || []).map((it, i) => <li key={`a${i}`}>+ {it}</li>)}
                {(diff.interests_removed || []).map((it, i) => <li key={`r${i}`}>− {it}</li>)}
                {!diff.self_description_changes && (diff.trait_changes || []).length === 0
                  && (diff.interests_added || []).length === 0 && (diff.interests_removed || []).length === 0 && (
                  <li style={{ color: colors.textSecondary }}>{t("andresRobotModule.humanLab.diffNone")}</li>
                )}
              </ul>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6 }}>{diff.note}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
