import React from 'react';
import WebLabPage from './_WebLabPage';

/**
 * Redcross.no web — Web Lab placeholder for the rodekors.no website.
 *
 * V0 · 1.16.0 (2026-05-29): structure only. The "Related agent" panel
 * cross-references the existing Red Cross Web QA Agent module so users
 * understand the relationship (Web Lab = the actual web pages; RC QA
 * Agent = the QA testing patterns).
 *
 * `onNavigate` prop comes from App.jsx and switches the active section
 * to "red-cross-web-qa" when the user clicks the cross-link button.
 */
export default function RedcrossNoWeb({ onNavigate }) {
  return (
    <WebLabPage
      icon="❤️‍🩹"
      gradient="linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #9d174d 100%)"
      accentColor="#dc2626"
      titleKey="webLab.redcrossNo.title"
      subtitleKey="webLab.redcrossNo.subtitle"
      productionUrl="https://www.rodekors.no"
      plannedLocalPort="3102"
      productionUrlLabelKey="webLab.redcrossNo.productionUrl"
      plannedLocalPortLabelKey="webLab.redcrossNo.plannedLocalPort"
      relatedAgentKey="webLab.redcrossNo.relatedAgent"
      relatedAgentHintKey="webLab.redcrossNo.relatedAgentHint"
      onOpenRelatedAgent={onNavigate ? () => onNavigate('red-cross-web-qa') : undefined}
    />
  );
}
