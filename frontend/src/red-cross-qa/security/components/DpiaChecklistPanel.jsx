import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  panel, panelTitle, hint, inputCss, primaryBtn, ghostBtn,
  errorBox, formatTimestamp,
} from '../tokens';
import { securityApi } from '../api';

/**
 * Structured DPIA editor. Replaces the legacy DPIA panel that only
 * displayed audit results — this one is editable and persists via
 * PATCH /api/qa/security/dpia.
 *
 * Lazy-loads on mount, debounces inline edits, has a "Save changes"
 * button that emits the full form, plus a "Discard" that reverts the
 * local draft.
 */
const FIELD_DEFS = [
  // Each (key, kind) drives how the form renders the field.
  { key: 'purpose',           kind: 'textarea' },
  { key: 'data_types',        kind: 'list' },
  { key: 'sensitive_data',    kind: 'bool' },
  { key: 'storage_location',  kind: 'text' },
  { key: 'access_roles',      kind: 'list' },
  { key: 'retention',         kind: 'text' },
  { key: 'third_parties',     kind: 'list' },
  { key: 'legal_basis',       kind: 'textarea' },
  { key: 'risk_notes',        kind: 'textarea' },
  { key: 'mitigations',       kind: 'list' },
];

const EMPTY_FORM = {
  id: 'dpia_main',
  purpose: '',
  data_types: [],
  sensitive_data: false,
  storage_location: '',
  access_roles: [],
  retention: '',
  third_parties: [],
  legal_basis: '',
  risk_notes: '',
  mitigations: [],
};

export default function DpiaChecklistPanel() {
  const { t } = useTranslation();
  const [original, setOriginal] = useState(EMPTY_FORM);
  const [draft, setDraft] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const dpia = await securityApi.dpia.get();
      const merged = { ...EMPTY_FORM, ...dpia };
      setOriginal(merged); setDraft(merged);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const isDirty = JSON.stringify(original) !== JSON.stringify(draft);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const saved = await securityApi.dpia.save({
        ...draft,
        updated_by: 'workshop-host',
      });
      const merged = { ...EMPTY_FORM, ...saved };
      setOriginal(merged); setDraft(merged);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const discard = () => setDraft(original);

  const setField = (key, value) => setDraft(d => ({ ...d, [key]: value }));

  return (
    <div style={{ ...panel, borderTop: '4px solid #6b21a8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ ...panelTitle, margin: 0 }}>
          ⚖️ {t('redCrossWebQaModule.securityPrivacy.dpiaTitle')}
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {isDirty && (
            <button onClick={discard} disabled={saving} style={ghostBtn('#64748b')}>
              ↺ {t('redCrossWebQaModule.securityPrivacy.dpiaDiscard')}
            </button>
          )}
          <button onClick={save} disabled={!isDirty || saving} style={primaryBtn(!isDirty || saving, '#6b21a8')}>
            {saving ? t('redCrossWebQaModule.common.running') : `💾 ${t('redCrossWebQaModule.securityPrivacy.dpiaSave')}`}
          </button>
        </div>
      </div>
      <p style={hint}>{t('redCrossWebQaModule.securityPrivacy.dpiaHint')}</p>

      {loading && <p style={{ fontSize: 13, color: '#94a3b8' }}>{t('redCrossWebQaModule.common.running')}…</p>}
      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {FIELD_DEFS.map(f => (
          <DpiaField key={f.key} fieldKey={f.key} kind={f.kind} value={draft[f.key]} onChange={setField} t={t} />
        ))}
      </div>

      <div style={{
        marginTop: 14, padding: '8px 12px', borderRadius: 8,
        backgroundColor: '#f5f3ff', border: '1px solid #d8b4fe',
        fontSize: 11, color: '#581c87', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span>
          📜 <strong>{t('redCrossWebQaModule.securityPrivacy.dpiaLastUpdate')}:</strong>{' '}
          {formatTimestamp(original.updated_at)}
          {original.updated_by && ` · ${original.updated_by}`}
        </span>
        {savedAt && (
          <span style={{
            padding: '3px 10px', borderRadius: 999,
            backgroundColor: '#dcfce7', color: '#15803d',
            fontWeight: 700, border: '1px solid #86efac',
          }}>
            ✓ {t('redCrossWebQaModule.securityPrivacy.dpiaSavedAt', { time: savedAt })}
          </span>
        )}
      </div>
    </div>
  );
}

function DpiaField({ fieldKey, kind, value, onChange, t }) {
  const label = t(`redCrossWebQaModule.securityPrivacy.dpiaField_${fieldKey}`);
  const placeholder = t(`redCrossWebQaModule.securityPrivacy.dpiaPlaceholder_${fieldKey}`,
                          { defaultValue: '' });

  if (kind === 'bool') {
    return (
      <div>
        <label style={fieldLabel}>{label}</label>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 6,
          backgroundColor: value ? '#fef3c7' : '#f8fafc',
          border: `1px solid ${value ? '#fcd34d' : '#cbd5e1'}`,
          cursor: 'pointer',
        }}>
          <input type="checkbox" checked={!!value}
                 onChange={e => onChange(fieldKey, e.target.checked)} />
          <span style={{ fontSize: 13, color: '#1e293b' }}>
            {value
              ? t('redCrossWebQaModule.securityPrivacy.dpiaBoolYes')
              : t('redCrossWebQaModule.securityPrivacy.dpiaBoolNo')}
          </span>
        </label>
      </div>
    );
  }
  if (kind === 'textarea') {
    return (
      <div style={{ gridColumn: 'span 2' }}>
        <label style={fieldLabel}>{label}</label>
        <textarea
          value={value || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          rows={3}
          placeholder={placeholder}
          style={{ ...inputCss, resize: 'vertical' }}
        />
      </div>
    );
  }
  if (kind === 'list') {
    // Render as a tags input — value is an array; the input is a single
    // textarea showing one item per line. Cheap, no extra deps.
    const joined = Array.isArray(value) ? value.join('\n') : '';
    return (
      <div>
        <label style={fieldLabel}>
          {label}
          {' '}<span style={{ color: '#94a3b8', fontWeight: 400 }}>
            ({t('redCrossWebQaModule.securityPrivacy.dpiaListHint')})
          </span>
        </label>
        <textarea
          value={joined}
          onChange={e => onChange(fieldKey, e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          rows={3}
          placeholder={placeholder}
          style={{ ...inputCss, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
        />
      </div>
    );
  }
  // Default: text
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <input value={value || ''}
             onChange={e => onChange(fieldKey, e.target.value)}
             placeholder={placeholder}
             style={inputCss} />
    </div>
  );
}

const fieldLabel = {
  display: 'block', fontSize: 10, color: '#64748b',
  textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4,
  marginBottom: 4,
};
