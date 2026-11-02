import React from 'react';
import WebLabPage from './_WebLabPage';
import { RCQA_DEFAULT_SETTINGS } from '../red-cross-qa/settingsApi';

/** Planned clone URL for Redcross.no (Web Lab port map — see docs/web-lab-plan.md). */
export const REDCROSS_PLANNED_LOCAL_URL = 'http://localhost:3102';
export const REDCROSS_PLANNED_LOCAL_PORT = '3102';

/**
 * Redcross.no web — Web Lab placeholder for the rodekors.no website.
 *
 * V0 · 1.16.0 (2026-05-29): structure only. The "Related agent" panel
 * cross-references the existing Red Cross Web QA Agent module so users
 * understand the relationship (Web Lab = the actual web pages; RC QA
 * Agent = the QA testing patterns).
 *
 * V1 contract (docs/web-lab-plan.md §7): "Use as local env" must set
 * RCQA `env_local_url` → http://localhost:3102, keep `env_test_url`
 * (TestSide) + `enonic_admin_url`, invalidate settingsApi cache, open
 * RCQA with Environment = Local. Do NOT write env_test_url.
 *
 * URL defaults below are imported from RCQA settingsApi so the placeholder
 * stays aligned with the agent Settings runtime (no live fetch in V0).
 *
 * `onNavigate` prop comes from App.jsx and switches the active section
 * to "red-cross-web-qa" when the user clicks the cross-link button.
 */
export default function RedcrossNoWeb({ onNavigate }) {
  const urlContext = {
    titleKey: 'webLab.redcrossNo.urlMapTitle',
    hintKey: 'webLab.redcrossNo.urlMapHint',
    docsHintKey: 'webLab.redcrossNo.docsHint',
    items: [
      {
        labelKey: 'webLab.redcrossNo.plannedLocalUrl',
        value: REDCROSS_PLANNED_LOCAL_URL,
        isLink: false,
        noteKey: 'webLab.redcrossNo.plannedLocalUrlNote',
      },
      {
        labelKey: 'webLab.redcrossNo.rcqaTestUrl',
        value: RCQA_DEFAULT_SETTINGS.env_test_url,
        isLink: true,
        noteKey: 'webLab.redcrossNo.rcqaTestUrlNote',
      },
      {
        labelKey: 'webLab.redcrossNo.enonicAdminUrl',
        value: RCQA_DEFAULT_SETTINGS.enonic_admin_url,
        isLink: true,
        noteKey: 'webLab.redcrossNo.enonicAdminUrlNote',
      },
    ],
  };

  return (
    <WebLabPage
      icon="❤️‍🩹"
      gradient="linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #9d174d 100%)"
      accentColor="#dc2626"
      titleKey="webLab.redcrossNo.title"
      subtitleKey="webLab.redcrossNo.subtitle"
      productionUrl="https://www.rodekors.no"
      plannedLocalPort={REDCROSS_PLANNED_LOCAL_PORT}
      productionUrlLabelKey="webLab.redcrossNo.productionUrl"
      plannedLocalPortLabelKey="webLab.redcrossNo.plannedLocalPort"
      urlContext={urlContext}
      relatedAgentKey="webLab.redcrossNo.relatedAgent"
      relatedAgentHintKey="webLab.redcrossNo.relatedAgentHint"
      onOpenRelatedAgent={onNavigate ? () => onNavigate('red-cross-web-qa') : undefined}
    />
  );
}
