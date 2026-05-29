import React from 'react';
import WebLabPage from './_WebLabPage';

/**
 * Item.no web — Web Lab placeholder for the company website.
 *
 * V0 · 1.16.0 (2026-05-29): structure only. Real clone / install / start
 * are documented in docs/web-lab-plan.md and arrive in V1+.
 */
export default function ItemNoWeb() {
  return (
    <WebLabPage
      icon="🏢"
      gradient="linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%)"
      accentColor="#2563eb"
      titleKey="webLab.itemNo.title"
      subtitleKey="webLab.itemNo.subtitle"
      productionUrl="https://www.item.no"
      plannedLocalPort="3101"
      productionUrlLabelKey="webLab.itemNo.productionUrl"
      plannedLocalPortLabelKey="webLab.itemNo.plannedLocalPort"
    />
  );
}
