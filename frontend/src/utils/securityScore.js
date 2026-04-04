/**
 * Security Score Calculator
 *
 * Reads state from other security modules (localStorage) and computes
 * an overall security score (0-100) with individual check results.
 */

import { isEncryptionActive } from './encryptedStorage';
import { isAnonymizationEnabled } from './anonymizer';
import { isAutoPurgeEnabled, getRetentionPolicies } from './dataRetention';
import { getRecentEventCount } from './securityEventLog';

/**
 * Individual security checks with their weight and evaluation logic
 */
const CHECKS = [
  {
    id: 'encryption',
    weight: 25,
    evaluate: () => isEncryptionActive()
  },
  {
    id: 'anonymization',
    weight: 20,
    evaluate: () => isAnonymizationEnabled()
  },
  {
    id: 'autoPurge',
    weight: 15,
    evaluate: () => isAutoPurgeEnabled()
  },
  {
    id: 'https',
    weight: 15,
    evaluate: () => window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  },
  {
    id: 'retentionConfigured',
    weight: 10,
    evaluate: () => {
      try {
        const raw = localStorage.getItem('wlwai_retention_policy');
        return raw !== null;
      } catch { return false; }
    }
  },
  {
    id: 'recentActivity',
    weight: 10,
    evaluate: () => getRecentEventCount(168) > 0 // any event in the last 7 days
  },
  {
    id: 'profileSet',
    weight: 5,
    evaluate: () => {
      try {
        const raw = localStorage.getItem('wlwai_user_profile');
        if (!raw) return false;
        const p = JSON.parse(raw);
        return !!(p.displayName || p.email);
      } catch { return false; }
    }
  }
];

/**
 * Calculate the full security score
 * @returns {{ score: number, grade: string, checks: Array<{ id, passed, weight }>, recommendations: string[] }}
 */
export function calculateSecurityScore() {
  let totalWeight = 0;
  let earnedWeight = 0;
  const checks = [];
  const recommendations = [];

  for (const check of CHECKS) {
    const passed = check.evaluate();
    checks.push({ id: check.id, passed, weight: check.weight });
    totalWeight += check.weight;
    if (passed) {
      earnedWeight += check.weight;
    } else {
      recommendations.push(check.id);
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  let grade;
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score, grade, checks, recommendations };
}

/**
 * Get color for a given score
 */
export function getScoreColor(score) {
  if (score >= 90) return '#2e7d32';
  if (score >= 75) return '#43a047';
  if (score >= 60) return '#ff9800';
  if (score >= 40) return '#f57c00';
  return '#c62828';
}
