/**
 * Security Event Log — circular buffer in localStorage
 *
 * Other security modules call logSecurityEvent() to record events.
 * RealTimeMonitoring reads them via getSecurityEvents().
 *
 * Max 200 events stored. Oldest are dropped when limit is exceeded.
 */

const STORAGE_KEY = 'wlwai_security_events';
const MAX_EVENTS = 200;

/**
 * Severity levels for security events
 */
export const EventSeverity = {
  INFO: 'info',
  OK: 'ok',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Event types for security events
 */
export const EventType = {
  ENCRYPTION_ENABLED: 'encryption_enabled',
  ENCRYPTION_DISABLED: 'encryption_disabled',
  DATA_PURGE: 'data_purge',
  DATA_EXPORT: 'data_export',
  ANONYMIZATION_TOGGLED: 'anonymization_toggled',
  ANONYMIZATION_APPLIED: 'anonymization_applied',
  ACCOUNT_DELETION: 'account_deletion',
  POLICY_CHANGED: 'policy_changed',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  SCAN_COMPLETED: 'scan_completed',
  SETTINGS_CHANGED: 'settings_changed'
};

/**
 * Get raw events array from localStorage (bypasses encryption if active)
 */
function getRawEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save events array to localStorage
 */
function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save security events:', e);
  }
}

/**
 * Log a security event
 * @param {string} type - Event type from EventType enum
 * @param {string} severity - Severity from EventSeverity enum
 * @param {object} details - Additional event details
 */
export function logSecurityEvent(type, severity = EventSeverity.INFO, details = {}) {
  const events = getRawEvents();

  const event = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    type,
    severity,
    details
  };

  events.unshift(event); // newest first

  // Trim to max size
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }

  saveEvents(events);
  return event;
}

/**
 * Get all security events, optionally filtered
 * @param {object} filters - { type, severity, limit, since }
 * @returns {Array} Array of event objects
 */
export function getSecurityEvents(filters = {}) {
  let events = getRawEvents();

  if (filters.type) {
    events = events.filter(e => e.type === filters.type);
  }

  if (filters.severity) {
    events = events.filter(e => e.severity === filters.severity);
  }

  if (filters.since) {
    const sinceDate = new Date(filters.since);
    events = events.filter(e => new Date(e.timestamp) >= sinceDate);
  }

  if (filters.limit && filters.limit > 0) {
    events = events.slice(0, filters.limit);
  }

  return events;
}

/**
 * Get count of events in the last N hours
 * @param {number} hours
 * @returns {number}
 */
export function getRecentEventCount(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return getSecurityEvents({ since }).length;
}

/**
 * Clear all security events
 */
export function clearSecurityEvents() {
  saveEvents([]);
}
