/**
 * Unit tests for the security event log (circular buffer in localStorage).
 * Pure logic — runs under jsdom. No network.
 */
import {
  logSecurityEvent,
  getSecurityEvents,
  getRecentEventCount,
  clearSecurityEvents,
  EventType,
  EventSeverity,
} from './securityEventLog';

beforeEach(() => localStorage.clear());

test('logs newest-first with id, timestamp and details', () => {
  logSecurityEvent(EventType.AUTH_SUCCESS, EventSeverity.OK, { user: 'a' });
  logSecurityEvent(EventType.DATA_EXPORT, EventSeverity.INFO, { format: 'json' });

  const events = getSecurityEvents();
  expect(events).toHaveLength(2);
  expect(events[0].type).toBe(EventType.DATA_EXPORT); // newest first
  expect(events[0].details.format).toBe('json');
  expect(events[1].type).toBe(EventType.AUTH_SUCCESS);
  expect(events[0].id).toBeTruthy();
  expect(events[0].timestamp).toBeTruthy();
});

test('filters by type and by severity', () => {
  logSecurityEvent(EventType.AUTH_SUCCESS, EventSeverity.OK);
  logSecurityEvent(EventType.AUTH_FAILURE, EventSeverity.WARNING);

  expect(getSecurityEvents({ type: EventType.AUTH_FAILURE })).toHaveLength(1);
  expect(getSecurityEvents({ severity: EventSeverity.OK })).toHaveLength(1);
  expect(getSecurityEvents({ type: EventType.DATA_PURGE })).toHaveLength(0);
});

test('limit caps the number of results returned', () => {
  for (let i = 0; i < 5; i++) logSecurityEvent(EventType.SETTINGS_CHANGED);
  expect(getSecurityEvents({ limit: 2 })).toHaveLength(2);
});

test('stored events are capped at 200 (oldest dropped)', () => {
  for (let i = 0; i < 210; i++) logSecurityEvent(EventType.SCAN_COMPLETED);
  expect(getSecurityEvents()).toHaveLength(200);
});

test('getRecentEventCount counts events within the window', () => {
  logSecurityEvent(EventType.AUTH_SUCCESS);
  logSecurityEvent(EventType.AUTH_SUCCESS);
  expect(getRecentEventCount(24)).toBeGreaterThanOrEqual(2);
});

test('clearSecurityEvents empties the log', () => {
  logSecurityEvent(EventType.AUTH_SUCCESS);
  clearSecurityEvents();
  expect(getSecurityEvents()).toHaveLength(0);
});

test('corrupt storage is tolerated (returns empty, never throws)', () => {
  localStorage.setItem('wlwai_security_events', 'not-json{');
  expect(() => getSecurityEvents()).not.toThrow();
  expect(getSecurityEvents()).toEqual([]);
});
