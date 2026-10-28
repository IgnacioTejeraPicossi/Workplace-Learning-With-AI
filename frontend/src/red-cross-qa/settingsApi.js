/**
 * Shared Settings access for the Red Cross Web QA Agent.
 *
 * - Loads / caches GET /api/red-cross-qa/settings once
 * - resolveBaseUrl(environment, settings) → published site for local|test
 * - Shell loads settings and passes baseUrl down; tabs sync URL inputs from it
 * - Settings.save calls invalidateRcqaSettingsCache() + reloadSettings()
 */
import { useCallback, useEffect, useState } from 'react';

export const RCQA_API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

export const RCQA_DEFAULT_SETTINGS = {
  env_local_url: 'http://localhost:3000',
  env_test_url: 'https://next.lunix.cloud/testside',
  enonic_admin_url: 'https://rodekors-xp8dev.enonic.cloud/admin',
  env_default: 'test',
  execution_mode: 'generate',
  ado_organization: 'RedCrossNorway',
  ado_project: 'rkdotno',
  ado_area_path: 'rkdotno\\Web QA',
  ado_iteration_path: 'rkdotno\\Sprint 2',
};

let _cache = null;
let _inflight = null;

export function stripTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

export function resolveBaseUrl(environment, settings) {
  const s = settings || RCQA_DEFAULT_SETTINGS;
  const raw = environment === 'local'
    ? (s.env_local_url || RCQA_DEFAULT_SETTINGS.env_local_url)
    : (s.env_test_url || RCQA_DEFAULT_SETTINGS.env_test_url);
  return stripTrailingSlash(raw);
}

export function resolveEnonicAdminUrl(settings) {
  const s = settings || RCQA_DEFAULT_SETTINGS;
  return stripTrailingSlash(s.enonic_admin_url || RCQA_DEFAULT_SETTINGS.enonic_admin_url);
}

export function invalidateRcqaSettingsCache() {
  _cache = null;
  _inflight = null;
}

export async function fetchRcqaSettings({ force = false } = {}) {
  if (_cache && !force) return _cache;
  if (_inflight && !force) return _inflight;

  _inflight = (async () => {
    try {
      const res = await fetch(`${RCQA_API}/settings`);
      const data = await res.json();
      _cache = (data.status === 'ok' && data.settings)
        ? { ...RCQA_DEFAULT_SETTINGS, ...data.settings }
        : { ...RCQA_DEFAULT_SETTINGS };
    } catch {
      _cache = { ...RCQA_DEFAULT_SETTINGS };
    } finally {
      _inflight = null;
    }
    return _cache;
  })();

  return _inflight;
}

/**
 * Hook used by the agent shell. Tabs should prefer props from the shell
 * (baseUrl / settings / reloadSettings) rather than calling this again.
 */
export function useRcqaSettings() {
  const [settings, setSettings] = useState(RCQA_DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const s = await fetchRcqaSettings({ force: true });
    setSettings(s);
    setLoaded(true);
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchRcqaSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return {
    settings,
    loaded,
    reloadSettings: reload,
    baseUrlFor: (environment) => resolveBaseUrl(environment, settings),
    enonicAdminUrl: resolveEnonicAdminUrl(settings),
  };
}
