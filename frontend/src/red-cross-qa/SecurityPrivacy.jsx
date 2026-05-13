// Phase H · Pack 2 — Sikkerhet og personvern tab is now backend-driven.
//
// The old single-file SecurityPrivacy.jsx (status board + DPIA panel) has
// been promoted into a full workbench under `frontend/src/red-cross-qa/security/`:
//
//   - SecurityPrivacyTab.jsx           ← orchestrator (this file imports it)
//   - components/SecurityCheckCard
//   - components/SecurityCheckDetailPanel
//   - components/FindingsList
//   - components/FindingRow
//   - components/ScanHistoryPanel
//   - components/DpiaChecklistPanel
//   - components/StatusFilters
//
// The agent shell (RedCrossWebQAAgent.jsx) keeps importing `SecurityPrivacy`
// from this path, so no wiring change is needed elsewhere.

import SecurityPrivacyTab from './security/SecurityPrivacyTab';

export default SecurityPrivacyTab;
