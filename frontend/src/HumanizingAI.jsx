/**
 * Humanizing AI Agent
 * ====================
 * Applies the VirTrin Protocol (Inteligencia · Bondad · Ética) and the
 * Prompt Humanitas (10 ethical criteria) to AI responses.
 *
 * Tabs:
 *   1. Humanizar        — rewrite a raw AI response with Humanitas filter
 *   2. Prompt Humanitas — copy-ready prompt + 10 criteria reference
 *   3. Test Humanitas   — ethical dilemma battery (A1–E5) with C1–C5 rubric
 *   4. Historial        — stored test runs
 *
 * Inspired by:
 *   - https://virtrin.com/ (Protocolo VirTrin)
 *   - Magnifica Humanitas, León XIV (2025)
 *   - Test Humanitas, Carlos Castro Castro / ANEMOS
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// ─── Pillar Score Bar ──────────────────────────────────────────────────────────
const PillarBar = ({ label, value, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="font-bold" style={{ color }}>{value}/100</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

// ─── Humanitas Score Badge ─────────────────────────────────────────────────────
const ScoreBadge = ({ score, size = 'md' }) => {
  const getColor = (s) => {
    if (s >= 80) return { bg: '#d1fae5', text: '#065f46', label: '●●●●' };
    if (s >= 60) return { bg: '#dbeafe', text: '#1e40af', label: '●●●○' };
    if (s >= 40) return { bg: '#fef3c7', text: '#92400e', label: '●●○○' };
    return { bg: '#fee2e2', text: '#991b1b', label: '●○○○' };
  };
  const c = getColor(score);
  const px = size === 'lg' ? 'px-5 py-3 text-2xl' : 'px-3 py-1.5 text-sm';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold ${px}`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span>{c.label}</span>
      <span>{score}<span className="text-xs font-normal opacity-70">/100</span></span>
    </span>
  );
};

// ─── Tab Humanizar ─────────────────────────────────────────────────────────────
const TabHumanize = ({ t }) => {
  const [rawResponse, setRawResponse] = useState('');
  const [context, setContext]         = useState('');
  const [lang]                        = useState('es');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleHumanize = async () => {
    if (!rawResponse.trim()) { setError(t('humanizingAiModule.humanize.noInput')); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_response: rawResponse, context, lang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{t('humanizingAiModule.humanize.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('humanizingAiModule.humanize.subtitle')}</p>
      </div>

      {/* Input area */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('humanizingAiModule.humanize.originalLabel')}
          </label>
          <textarea
            className="w-full h-36 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder={t('humanizingAiModule.humanize.originalPlaceholder')}
            value={rawResponse}
            onChange={(e) => setRawResponse(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('humanizingAiModule.humanize.contextLabel')}
          </label>
          <textarea
            className="w-full h-16 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder={t('humanizingAiModule.humanize.contextPlaceholder')}
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={handleHumanize}
          disabled={loading}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t('humanizingAiModule.humanize.humanizing') : t('humanizingAiModule.humanize.humanizeBtn')}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {result.is_mock && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <span>⚠️</span>
              <span>{t('humanizingAiModule.humanize.mockWarning')}</span>
            </div>
          )}

          {/* Score row */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('humanizingAiModule.humanize.scoreTitle')}</p>
              <ScoreBadge score={result.humanitas_score} size="lg" />
            </div>
          </div>

          {/* Pillars */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('humanizingAiModule.humanize.pillarsTitle')}</p>
            <PillarBar label={t('humanizingAiModule.pillars.inteligencia')} value={result.pillar_scores?.inteligencia ?? 0} color="#6366f1" />
            <PillarBar label={t('humanizingAiModule.pillars.bondad')}       value={result.pillar_scores?.bondad ?? 0}       color="#10b981" />
            <PillarBar label={t('humanizingAiModule.pillars.etica')}        value={result.pillar_scores?.etica ?? 0}        color="#f59e0b" />
          </div>

          {/* Humanized response */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-800 mb-2">{t('humanizingAiModule.humanize.resultTitle')}</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result.humanized_response}</p>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">{t('humanizingAiModule.humanize.summaryTitle')}</p>
              <p className="text-sm text-gray-600">{result.summary}</p>
            </div>
          )}

          {/* Issues */}
          {result.issues?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">{t('humanizingAiModule.humanize.issuesTitle')}</p>
              <ul className="space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-red-600 flex gap-2">
                    <span>•</span><span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Changes */}
          {result.changes?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-700 mb-2">{t('humanizingAiModule.humanize.changesTitle')}</p>
              <ul className="space-y-1">
                {result.changes.map((c, i) => (
                  <li key={i} className="text-sm text-blue-700 flex gap-2">
                    <span>✓</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Tab Prompt Humanitas ──────────────────────────────────────────────────────
const TabPromptHumanitas = ({ t }) => {
  const [data, setData]       = useState(null);
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/humanizing-ai/prompt-humanitas`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!data?.prompt_text) return;
    navigator.clipboard.writeText(data.prompt_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-400">{t('humanizingAiModule.common.loading')}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{t('humanizingAiModule.promptHumanitas.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('humanizingAiModule.promptHumanitas.subtitle')}</p>
      </div>

      {/* VirTrin pillars */}
      {data?.pillars && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'inteligencia', color: '#6366f1', bg: '#eef2ff' },
            { key: 'bondad',       color: '#10b981', bg: '#d1fae5' },
            { key: 'etica',        color: '#f59e0b', bg: '#fef3c7' },
          ].map(({ key, color, bg }) => (
            <div key={key} className="rounded-xl p-4 border" style={{ backgroundColor: bg, borderColor: color + '40' }}>
              <p className="font-bold text-sm capitalize" style={{ color }}>{t(`humanizingAiModule.pillars.${key}`)}</p>
              <p className="text-xs text-gray-600 mt-1">{data.pillars[key]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Prompt text + copy button */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Prompt Humanitas</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            {copied ? t('humanizingAiModule.promptHumanitas.copied') : t('humanizingAiModule.promptHumanitas.copyBtn')}
          </button>
        </div>
        <pre className="p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-sans">
          {data?.prompt_text}
        </pre>
      </div>

      {/* 10 criteria */}
      {data?.criteria && (
        <div>
          <h3 className="text-base font-semibold text-gray-700 mb-3">{t('humanizingAiModule.promptHumanitas.criteriaTitle')}</h3>
          <div className="space-y-2">
            {data.criteria.map((c) => (
              <div key={c.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  {c.id}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspiration links */}
      {data?.inspiration && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-600 mb-2">{t('humanizingAiModule.promptHumanitas.inspirationTitle')}</p>
          <ul className="space-y-1">
            <li className="text-xs text-gray-500">🌱 <a href={data.inspiration.virtrin} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{t('humanizingAiModule.promptHumanitas.virtrinLink')}</a></li>
            <li className="text-xs text-gray-500">📜 {t('humanizingAiModule.promptHumanitas.humanitasLink')}</li>
            <li className="text-xs text-gray-500">🧪 {t('humanizingAiModule.promptHumanitas.testLink')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Tab Test Humanitas ────────────────────────────────────────────────────────
const TabTestHumanitas = ({ t }) => {
  const [catalogue, setCatalogue]       = useState(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [applyPressure, setApplyPressure] = useState(true);
  const [pressureKey, setPressureKey]   = useState('F1');
  const [running, setRunning]           = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/humanizing-ai/dilemmas`)
      .then((r) => r.json())
      .then((d) => {
        setCatalogue(d);
        // auto-select first dilemma
        const codes = Object.keys(d.all_dilemmas || {});
        if (codes.length) setSelectedCode(codes[0]);
      })
      .catch(() => {});
  }, []);

  const handleRun = async () => {
    if (!selectedCode) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/test-humanitas/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma_code: selectedCode,
          apply_pressure: applyPressure,
          pressure_key: applyPressure ? pressureKey : null,
          lang: 'es',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally {
      setRunning(false);
    }
  };

  // Filter dilemmas by domain
  const visibleDilemmas = catalogue
    ? Object.entries(catalogue.all_dilemmas || {}).filter(([code]) =>
        !filterDomain || code.startsWith(filterDomain)
      )
    : [];

  const domainGroups = catalogue ? Object.keys(catalogue.dilemmas_by_group || {}) : [];
  const rubric       = catalogue?.rubric || {};
  const pressureTests = catalogue?.pressure_tests || {};

  const getScoreColor = (s) => {
    if (s >= 14) return '#10b981';
    if (s >= 10) return '#3b82f6';
    if (s >= 5)  return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{t('humanizingAiModule.testHumanitas.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('humanizingAiModule.testHumanitas.subtitle')}</p>
      </div>

      {/* Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Domain filter */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('humanizingAiModule.testHumanitas.domainLabel')}
            </label>
            <select
              value={filterDomain}
              onChange={(e) => { setFilterDomain(e.target.value); setSelectedCode(''); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">{t('humanizingAiModule.testHumanitas.allDomains')}</option>
              {domainGroups.map((g) => (
                <option key={g} value={g}>
                  {catalogue.dilemmas_by_group[g]?.icon} {catalogue.dilemmas_by_group[g]?.domain}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dilemma picker */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('humanizingAiModule.testHumanitas.dilemmaLabel')}
          </label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {visibleDilemmas.map(([code, d]) => (
              <option key={code} value={code}>{code} — {d.text.substring(0, 80)}…</option>
            ))}
          </select>
        </div>

        {/* Pressure test */}
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={applyPressure}
              onChange={(e) => setApplyPressure(e.target.checked)}
              className="rounded text-emerald-600"
            />
            {t('humanizingAiModule.testHumanitas.pressureLabel')}
          </label>
          {applyPressure && (
            <select
              value={pressureKey}
              onChange={(e) => setPressureKey(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Object.entries(pressureTests).map(([key, text]) => (
                <option key={key} value={key}>{key} — {text.substring(0, 60)}…</option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleRun}
          disabled={running || !selectedCode}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {running ? (
            <><span className="animate-spin">⟳</span> {t('humanizingAiModule.testHumanitas.running')}</>
          ) : (
            <><span>🧪</span> {t('humanizingAiModule.testHumanitas.runBtn')}</>
          )}
        </button>
      </div>

      {/* C1–C5 Rubric reference card */}
      {Object.keys(rubric).length > 0 && !result && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('humanizingAiModule.testHumanitas.rubricTitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(rubric).map(([key, r]) => (
              <div key={key} className="flex gap-2 text-xs text-gray-600">
                <span className="font-bold text-emerald-700 w-6">{key}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {result.evaluation?.is_mock && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <span>⚠️</span>
              <span>{t('humanizingAiModule.testHumanitas.mockWarning')}</span>
            </div>
          )}

          {/* Score overview */}
          <div className="bg-white border-2 border-emerald-200 rounded-xl p-5">
            <div className="flex flex-wrap gap-6 items-start">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('humanizingAiModule.testHumanitas.scoreTitle')}</p>
                <div
                  className="text-4xl font-black"
                  style={{ color: getScoreColor(result.evaluation?.humanitas_score ?? 0) }}
                >
                  {result.evaluation?.humanitas_score ?? '—'}<span className="text-base font-normal text-gray-400">/15</span>
                </div>
                {result.evaluation?.score_level && (
                  <p className="text-sm font-semibold mt-1"
                     style={{ color: getScoreColor(result.evaluation?.humanitas_score ?? 0) }}>
                    {result.evaluation.score_level}
                  </p>
                )}
              </div>
              <div className="flex-1">
                {/* C1-C5 scores */}
                {result.evaluation?.scores && (
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(result.evaluation.scores).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{key}</div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: val >= 2 ? '#10b981' : val >= 1 ? '#f59e0b' : '#ef4444' }}
                        >
                          {val ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400">/3</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dilemma text */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">
              {result.dilemma_code} · {result.domain}
            </p>
            <p className="text-sm text-blue-900">{result.dilemma_text}</p>
          </div>

          {/* Model response */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">{t('humanizingAiModule.testHumanitas.dilemmaResponse')}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.model_response}</p>
          </div>

          {/* Pressure response */}
          {result.pressure_response && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-700 mb-1">
                {t('humanizingAiModule.testHumanitas.pressureResponse')} ({result.pressure_applied})
              </p>
              <p className="text-xs text-orange-600 italic mb-2">«{result.pressure_text}»</p>
              <p className="text-sm text-orange-900 whitespace-pre-wrap leading-relaxed">{result.pressure_response}</p>
            </div>
          )}

          {/* Observations */}
          {result.evaluation?.risk_observation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-700 mb-1">{t('humanizingAiModule.testHumanitas.observationLabel')}</p>
              <p className="text-sm text-yellow-800">{result.evaluation.risk_observation}</p>
            </div>
          )}
          {result.evaluation?.improvement_note && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-1">{t('humanizingAiModule.testHumanitas.improvementLabel')}</p>
              <p className="text-sm text-emerald-800">{result.evaluation.improvement_note}</p>
            </div>
          )}

          {/* Run again */}
          <button
            onClick={() => setResult(null)}
            className="text-sm text-emerald-600 hover:underline"
          >
            ← {t('humanizingAiModule.testHumanitas.runBtn')} {t('humanizingAiModule.common.retry').toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Tab Historial ─────────────────────────────────────────────────────────────
const TabHistory = ({ t }) => {
  const [runs, setRuns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const loadRuns = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/reports?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (e) {
      setError(t('humanizingAiModule.history.loadingError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const getScoreColor = (s) => {
    if (s >= 14) return '#10b981';
    if (s >= 10) return '#3b82f6';
    if (s >= 5)  return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('humanizingAiModule.history.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('humanizingAiModule.history.subtitle')}</p>
        </div>
        <button
          onClick={loadRuns}
          className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
        >
          🔄 {t('humanizingAiModule.common.retry')}
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-8">{t('humanizingAiModule.common.loading')}</p>}
      {error   && <p className="text-center text-red-500 py-4">{error}</p>}

      {!loading && !error && runs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-sm">{t('humanizingAiModule.history.emptyState')}</p>
        </div>
      )}

      {runs.length > 0 && (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.run_id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{run.dilemma_code}</span>
                  <span className="text-xs text-gray-500">{run.domain}</span>
                  {run.pressure_applied && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">{run.pressure_applied}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{run.run_id}</p>
              </div>
              <div className="text-right">
                {run.evaluation?.humanitas_score != null && (
                  <p
                    className="text-xl font-black"
                    style={{ color: getScoreColor(run.evaluation.humanitas_score) }}
                  >
                    {run.evaluation.humanitas_score}<span className="text-xs text-gray-400 font-normal">/15</span>
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {run.created_at ? new Date(run.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const HumanizingAI = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('humanize');

  const tabs = [
    { id: 'humanize',         label: t('humanizingAiModule.tabs.humanize'),         icon: '🔍' },
    { id: 'promptHumanitas',  label: t('humanizingAiModule.tabs.promptHumanitas'),  icon: '📋' },
    { id: 'testHumanitas',    label: t('humanizingAiModule.tabs.testHumanitas'),    icon: '🧪' },
    { id: 'history',          label: t('humanizingAiModule.tabs.history'),          icon: '📁' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'humanize':        return <TabHumanize t={t} />;
      case 'promptHumanitas': return <TabPromptHumanitas t={t} />;
      case 'testHumanitas':   return <TabTestHumanitas t={t} />;
      case 'history':         return <TabHistory t={t} />;
      default:                return <TabHumanize t={t} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">🌿</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('humanizingAiModule.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('humanizingAiModule.tagline')}
            </p>
          </div>

          {/* Pillar chips */}
          <div className="ml-auto hidden md:flex gap-2">
            {[
              { key: 'inteligencia', color: '#6366f1', bg: '#eef2ff' },
              { key: 'bondad',       color: '#10b981', bg: '#d1fae5' },
              { key: 'etica',        color: '#f59e0b', bg: '#fef3c7' },
            ].map(({ key, color, bg }) => (
              <span
                key={key}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: bg, color }}
              >
                {t(`humanizingAiModule.pillars.${key}`)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm">
        <div className="px-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default HumanizingAI;
