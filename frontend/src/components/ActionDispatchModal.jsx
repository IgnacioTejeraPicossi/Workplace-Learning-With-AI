import React, { useState } from "react";

export default function ActionDispatchModal({
  module,
  open,
  onClose,
  buildPayload,
  endpoint
}) {
  const [dest, setDest] = useState({ 
    jira: { enabled: true }, 
    slack: { enabled: true }, 
    sheets: { enabled: true } 
  });
  const [busy, setBusy] = useState(false);
  
  const toggle = (k) => setDest({ 
    ...dest, 
    [k]: { ...(dest[k] || {}), enabled: !(dest[k]?.enabled) } 
  });

  async function submit() {
    setBusy(true);
    try {
      const payload = buildPayload(dest);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      alert(`Sent to OutSystems (${module}): ${result.run_id}`);
      onClose();
    } catch (e) {
      alert("Dispatch error: " + (e?.message || "unknown"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-5 w-[520px] space-y-4 shadow-xl">
        <h2 className="text-xl font-bold">Send to OutSystems Agent</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={!!dest.jira?.enabled} 
              onChange={() => toggle("jira")} 
            /> 
            Jira
            <input 
              className="ml-auto border p-1 rounded" 
              placeholder="Project Key" 
              onChange={e => setDest({
                ...dest, 
                jira: { ...dest.jira, projectKey: e.target.value }
              })} 
            />
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={!!dest.slack?.enabled} 
              onChange={() => toggle("slack")} 
            /> 
            Slack
            <input 
              className="ml-auto border p-1 rounded" 
              placeholder="#channel" 
              onChange={e => setDest({
                ...dest, 
                slack: { ...dest.slack, channel: e.target.value }
              })} 
            />
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={!!dest.sheets?.enabled} 
              onChange={() => toggle("sheets")} 
            /> 
            Google Sheets
            <input 
              className="ml-auto border p-1 rounded" 
              placeholder="Sheet ID" 
              onChange={e => setDest({
                ...dest, 
                sheets: { ...dest.sheets, sheetId: e.target.value }
              })} 
            />
          </label>
        </div>
        <div className="flex gap-3 justify-end">
          <button 
            className="px-3 py-2 rounded bg-gray-200" 
            onClick={onClose} 
            disabled={busy}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-2 rounded bg-blue-600 text-white" 
            onClick={submit} 
            disabled={busy}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}