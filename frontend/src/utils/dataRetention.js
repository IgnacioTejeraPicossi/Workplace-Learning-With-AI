/**
 * Data Retention — scan and purge localStorage entries by age
 *
 * Convention: any localStorage key that stores timestamped data should
 * follow the pattern of storing an object with a `_ts` (epoch ms) field,
 * or the module can register keys with explicit timestamps.
 *
 * This utility manages retention policies and tracks purge history.
 */

import { logSecurityEvent, EventType, EventSeverity } from './securityEventLog';

const POLICY_KEY = 'wlwai_retention_policy';
const PURGE_HISTORY_KEY = 'wlwai_purge_history';
const MAX_PURGE_HISTORY = 50;

// Keys managed by the platform that should never be purged
const PROTECTED_KEYS = [
  'wlwai_retention_policy',
  'wlwai_purge_history',
  'wlwai_security_events',
  'wlwai_anonymization_config',
  'wlwai_security_score_cache',
  'ai_enc_salt',
  'ai_enc_active',
  'i18nextLng',
  'theme',
  'clinic_policy'
];

/**
 * Default retention policies (in hours)
 */
const DEFAULT_POLICIES = {
  activityLogs: 30 * 24,     // 30 days in hours
  tempFiles: 7 * 24,         // 7 days
  cacheData: 24,             // 24 hours
  sessionData: 0             // 0 = until logout (manual only)
};

/**
 * Key prefix patterns for each category
 */
const CATEGORY_PATTERNS = {
  activityLogs: ['log_', 'activity_', 'history_', 'audit_'],
  tempFiles: ['tmp_', 'temp_', 'draft_', 'upload_'],
  cacheData: ['cache_', 'cached_', '_cache'],
  sessionData: ['session_', 'sess_']
};

/**
 * Get current retention policies
 */
export function getRetentionPolicies() {
  try {
    const raw = localStorage.getItem(POLICY_KEY);
    if (raw) {
      return { ...DEFAULT_POLICIES, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_POLICIES };
}

/**
 * Save retention policies
 */
export function saveRetentionPolicies(policies) {
  localStorage.setItem(POLICY_KEY, JSON.stringify(policies));
  logSecurityEvent(EventType.POLICY_CHANGED, EventSeverity.INFO, {
    action: 'retention_policy_updated',
    policies
  });
}

/**
 * Get auto-purge setting
 */
export function isAutoPurgeEnabled() {
  const policies = getRetentionPolicies();
  return policies._autoPurge !== false; // default true
}

/**
 * Toggle auto-purge on session start
 */
export function setAutoPurge(enabled) {
  const policies = getRetentionPolicies();
  policies._autoPurge = enabled;
  localStorage.setItem(POLICY_KEY, JSON.stringify(policies));
}

/**
 * Categorize a localStorage key
 * @returns {string|null} category name or null if uncategorized
 */
function categorizeKey(key) {
  const lowerKey = key.toLowerCase();
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerKey.startsWith(pattern) || lowerKey.endsWith(pattern)) {
        return category;
      }
    }
  }
  return null;
}

/**
 * Try to extract a timestamp from a localStorage value
 * Looks for _ts, timestamp, createdAt, created_at fields
 */
function extractTimestamp(value) {
  try {
    const obj = JSON.parse(value);
    if (typeof obj === 'object' && obj !== null) {
      const ts = obj._ts || obj.timestamp || obj.createdAt || obj.created_at;
      if (ts) {
        const date = new Date(ts);
        if (!isNaN(date.getTime())) return date.getTime();
      }
    }
  } catch {}
  return null;
}

/**
 * Scan localStorage and return categorized entries with age info
 */
export function scanStorage() {
  const now = Date.now();
  const policies = getRetentionPolicies();
  const results = {
    totalKeys: 0,
    totalBytes: 0,
    categories: {},
    expiredKeys: [],
    protectedKeys: 0
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    results.totalKeys++;
    const value = localStorage.getItem(key) || '';
    const bytes = (key.length + value.length) * 2; // UTF-16
    results.totalBytes += bytes;

    if (PROTECTED_KEYS.includes(key)) {
      results.protectedKeys++;
      continue;
    }

    const category = categorizeKey(key);
    if (!category) continue;

    if (!results.categories[category]) {
      results.categories[category] = { count: 0, bytes: 0, keys: [] };
    }

    const ts = extractTimestamp(value);
    const ageHours = ts ? (now - ts) / (1000 * 60 * 60) : null;
    const policyHours = policies[category];
    const expired = policyHours > 0 && ageHours !== null && ageHours > policyHours;

    const entry = { key, bytes, ageHours, expired, timestamp: ts };
    results.categories[category].count++;
    results.categories[category].bytes += bytes;
    results.categories[category].keys.push(entry);

    if (expired) {
      results.expiredKeys.push(entry);
    }
  }

  return results;
}

/**
 * Purge expired entries based on current policies
 * @param {boolean} dryRun - if true, returns what would be purged without actually purging
 * @returns {object} purge result with count and bytes freed
 */
export function purgeExpired(dryRun = false) {
  const scan = scanStorage();
  const result = {
    purgedCount: 0,
    bytesFreed: 0,
    purgedKeys: [],
    timestamp: new Date().toISOString()
  };

  for (const entry of scan.expiredKeys) {
    if (!dryRun) {
      localStorage.removeItem(entry.key);
    }
    result.purgedCount++;
    result.bytesFreed += entry.bytes;
    result.purgedKeys.push(entry.key);
  }

  if (!dryRun && result.purgedCount > 0) {
    // Record in purge history
    addPurgeHistory(result);
    // Log security event
    logSecurityEvent(EventType.DATA_PURGE, EventSeverity.OK, {
      purgedCount: result.purgedCount,
      bytesFreed: result.bytesFreed
    });
  }

  return result;
}

/**
 * Purge ALL non-protected keys in a specific category
 * @param {string} category
 */
export function purgeCategory(category) {
  const scan = scanStorage();
  const catData = scan.categories[category];
  if (!catData) return { purgedCount: 0, bytesFreed: 0 };

  let purgedCount = 0;
  let bytesFreed = 0;

  for (const entry of catData.keys) {
    localStorage.removeItem(entry.key);
    purgedCount++;
    bytesFreed += entry.bytes;
  }

  if (purgedCount > 0) {
    const result = {
      purgedCount,
      bytesFreed,
      category,
      timestamp: new Date().toISOString()
    };
    addPurgeHistory(result);
    logSecurityEvent(EventType.DATA_PURGE, EventSeverity.OK, {
      category,
      purgedCount,
      bytesFreed
    });
  }

  return { purgedCount, bytesFreed };
}

/**
 * Get estimated localStorage usage
 */
export function getStorageUsage() {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) || '';
    totalBytes += (key.length + value.length) * 2;
  }
  // Most browsers allow ~5-10 MB
  const maxBytes = 5 * 1024 * 1024;
  return {
    usedBytes: totalBytes,
    maxBytes,
    usedPercent: Math.round((totalBytes / maxBytes) * 100),
    usedFormatted: formatBytes(totalBytes),
    maxFormatted: formatBytes(maxBytes)
  };
}

/**
 * Get purge history
 */
export function getPurgeHistory() {
  try {
    const raw = localStorage.getItem(PURGE_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Add entry to purge history
 */
function addPurgeHistory(entry) {
  const history = getPurgeHistory();
  history.unshift(entry);
  if (history.length > MAX_PURGE_HISTORY) {
    history.length = MAX_PURGE_HISTORY;
  }
  localStorage.setItem(PURGE_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}
