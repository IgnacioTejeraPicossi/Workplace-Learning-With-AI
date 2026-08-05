import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  getAndresProposals, getAndresVersions, proposeAndresEvolution,
  approveAndresProposal, rejectAndresProposal, rollbackAndres,
} from "../api";

/**
 * Andrés — Evolution tab (V2).
 *
 * The ONLY place Andrés' identity changes — and only with the user's approval.
 * Propose a change → it sits pending → the user approves or rejects. Approvals
 * snapshot the previous identity, so any version can be rolled back. The
 * immutable constitution is never touched here.
 */
const TRAITS = [
  "curiosity", "playfulness", "warmth", "independence", "imagination",
  "skepticism", "patience", "formality", "spontaneity", "constructive_disagreement",
];

export default function Evolution({ profile, onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [proposals, setProposals] = useState([]);
  const [versions, setVersions] = useState([]);

  // proposal form
  const [rationale, setRationale] = useState("");
  const [newSelf, setNewSelf] = useState("");
  const [addInterest, setAddInterest] = useState("");
  const [trait, setTrait] = useState("curiosity");
  const [delta, setDelta] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, v] = await Promise.all([
        getAndresProposals().catch(() => ({ proposals: [] })),
        getAndresVersions().catch(() => ({ versions: [] })),
      ]);
      setProposals(p.proposals || []);
      setVersions(v.versions || []);
    } catch (e) { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setError("");
    const changes = {};
    if (newSelf.trim()) changes.self_description = newSelf.trim();
    if (addInterest.trim()) changes.add_interests = [addInterest.trim()];
    if (Number(delta) !== 0) changes.trait_deltas = { [trait]: Number(delta) };
    if (Object.keys(changes).length === 0) {
      setError(t("andresRobotModule.evolution.emptyError"));
      return;
    }
    try {
      await proposeAndresEvolution(rationale.trim(), changes);
      setRationale(""); setNewSelf(""); setAddInterest(""); setDelta(0);
      await load();
    } catch (e) {
      setError(e?.message || t("andresRobotModule.evolution.failError"));
    }
  };

  const approve = async (p) => {
    try { await approveAndresProposal(p._id); await load(); onProfileChange && onProfileChange(); }
    catch (e) { setError(e?.message || ""); }
  };
  const reject = async (p) => {
    try { await rejectAndresProposal(p._id); await load(); }
    catch (e) { /* offline */ }
  };
  const rollback = async (v) => {
    try { await rollbackAndres(v.version); await load(); onProfileChange && onProfileChange(); }
    catch (e) { setError(e?.message || ""); }
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };
  const input = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
    background: colors.background, color: colors.text, width: "100%", boxSizing: "border-box",
  };
  const changeSummary = (ch) => {
    const parts = [];
    if (ch.self_description) parts.push(t("andresRobotModule.evolution.changeSelf"));
    if (ch.add_interests) parts.push(`+${ch.add_interests.join(", ")}`);
    if (ch.remove_interests) parts.push(`−${ch.remove_interests.join(", ")}`);
    if (ch.trait_deltas) parts.push(Object.entries(ch.trait_deltas).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).join(", "));
    return parts.join(" · ") || "—";
  };

  const pending = proposals.filter((p) => p.status === "pending");
  const decided = proposals.filter((p) => p.status !== "pending");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...card, lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <strong style={{ color: colors.text }}>{t("andresRobotModule.evolution.title")}</strong>
          <span style={{ background: colors.primaryLight, color: colors.primary, padding: "2px 10px", borderRadius: 999, fontSize: 12 }}>
            {t("andresRobotModule.evolution.currentVersion", { v: profile?.identity?.version ?? 1 })}
          </span>
        </div>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "6px 0 0" }}>
          {t("andresRobotModule.evolution.intro")}
        </p>
      </div>

      {/* Propose */}
      <div style={{ ...card, display: "grid", gap: 8 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.evolution.proposeTitle")}</strong>
        <textarea style={{ ...input, minHeight: 54, resize: "vertical" }} value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder={t("andresRobotModule.evolution.rationalePlaceholder")} />
        <textarea style={{ ...input, minHeight: 54, resize: "vertical" }} value={newSelf}
                  onChange={(e) => setNewSelf(e.target.value)}
                  placeholder={t("andresRobotModule.evolution.selfPlaceholder")} />
        <input style={input} value={addInterest} onChange={(e) => setAddInterest(e.target.value)}
               placeholder={t("andresRobotModule.evolution.interestPlaceholder")} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>{t("andresRobotModule.evolution.traitLabel")}</span>
          <select style={{ ...input, width: "auto" }} value={trait} onChange={(e) => setTrait(e.target.value)}>
            {TRAITS.map((tr) => (
              <option key={tr} value={tr}>{t(`andresRobotModule.personality.traitNames.${tr}`, tr)}</option>
            ))}
          </select>
          <input type="number" min={-20} max={20} style={{ ...input, width: 90 }} value={delta}
                 onChange={(e) => setDelta(e.target.value)} />
          <span style={{ fontSize: 11, color: colors.textSecondary }}>{t("andresRobotModule.evolution.capNote")}</span>
        </div>
        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
        <div>
          <button onClick={submit}
                  style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>
            {t("andresRobotModule.evolution.propose")}
          </button>
        </div>
      </div>

      {/* Pending proposals */}
      {pending.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          <strong style={{ color: colors.text }}>{t("andresRobotModule.evolution.pendingTitle")}</strong>
          {pending.map((p) => (
            <div key={p._id} style={{ ...card, padding: 16, borderLeft: `3px solid ${colors.primary}` }}>
              {p.rationale && <p style={{ color: colors.text, margin: "0 0 6px", fontSize: 14 }}>{p.rationale}</p>}
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                {t("andresRobotModule.evolution.changes")}: {changeSummary(p.changes)}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={() => approve(p)}
                        style={{ background: "#16a34a", color: "#fff", border: 0, borderRadius: 8, padding: "7px 16px", fontWeight: 600, cursor: "pointer" }}>
                  {t("andresRobotModule.evolution.approve")}
                </button>
                <button onClick={() => reject(p)}
                        style={{ background: "transparent", color: "#dc2626", border: `1px solid #dc2626`, borderRadius: 8, padding: "7px 16px", fontWeight: 600, cursor: "pointer" }}>
                  {t("andresRobotModule.evolution.reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Version history */}
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.evolution.historyTitle")}</strong>
        {versions.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
            {t("andresRobotModule.evolution.noHistory")}
          </div>
        ) : (
          versions.map((v) => (
            <div key={v._id} style={{ ...card, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <span style={{ color: colors.text, fontWeight: 600 }}>v{v.version}</span>
                <span style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8 }}>{v.reason}</span>
              </div>
              <button onClick={() => rollback(v)}
                      style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.primary, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {t("andresRobotModule.evolution.rollback")}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Decided proposals (audit trail) */}
      {decided.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <strong style={{ color: colors.text, fontSize: 13 }}>{t("andresRobotModule.evolution.decidedTitle")}</strong>
          {decided.map((p) => (
            <div key={p._id} style={{ fontSize: 12, color: colors.textSecondary }}>
              [{t(`andresRobotModule.evolution.proposalStatus.${p.status}`, p.status)}] {changeSummary(p.changes)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
