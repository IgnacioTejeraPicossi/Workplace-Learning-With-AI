import React, { useEffect, useState } from "react";
import { Settings as Api } from "./agentopsApi";

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { 
    Api.get().then(setS).catch(e => setMsg(`Error loading settings: ${e}`)); 
  }, []);

  async function saveAll() {
    setBusy(true); 
    setMsg("");
    try {
      const out = await Api.put(stripMeta(s));
      setS(out); 
      setMsg("Settings saved successfully!");
    } catch (e) { 
      setMsg(`Error saving settings: ${e}`); 
    }
    finally { 
      setBusy(false); 
    }
  }

  function reset() {
    setS({
      default_spreadsheet_id: '',
      default_sheet_name: 'Reports',
      default_slack_webhook_url: '',
      default_email_to: '',
      default_email_subject_tpl: 'Report ready: {{topic}}',
      default_flow_id: '',
      lmstudio_base: '',
      destinations_enabled_by_default: false
    });
  }

  if (!s) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading settings...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AgentOps Studio — Settings</h2>
        <p className="text-gray-600">Configure global defaults and preferences for your AI workflows</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Destinations Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <span className="mr-3">📤</span>
              Global Destinations
            </h3>
            <p className="text-blue-100 text-sm mt-1">Configure default output destinations for reports</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Google Sheets */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">📊</span>
                <h4 className="text-lg font-medium text-gray-900">Google Sheets</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={s.default_spreadsheet_id || ""}
                    onChange={e => setS({...s, default_spreadsheet_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="1AbcDEF..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    value={s.default_sheet_name || ""}
                    onChange={e => setS({...s, default_sheet_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Reports"
                  />
                </div>
              </div>
            </div>

            {/* Slack */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">💬</span>
                <h4 className="text-lg font-medium text-gray-900">Slack</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={s.default_slack_webhook_url || ""}
                  onChange={e => setS({...s, default_slack_webhook_url: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://hooks.slack.com/services/XXX/YYY/ZZZ"
                />
              </div>
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">📧</span>
                <h4 className="text-lg font-medium text-gray-900">Email</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Address
                  </label>
                  <input
                    type="email"
                    value={s.default_email_to || ""}
                    onChange={e => setS({...s, default_email_to: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="ops@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Template
                  </label>
                  <input
                    type="text"
                    value={s.default_email_subject_tpl || ""}
                    onChange={e => setS({...s, default_email_subject_tpl: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Report ready: {{topic}}"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <span className="mr-3">⚙️</span>
              Configuration
            </h3>
            <p className="text-purple-100 text-sm mt-1">Advanced settings and preferences</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Flow Settings */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🔄</span>
                <h4 className="text-lg font-medium text-gray-900">Flow Settings</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Flow ID
                </label>
                <input
                  type="text"
                  value={s.default_flow_id || ""}
                  onChange={e => setS({...s, default_flow_id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Flow ID to preselect"
                />
                <p className="text-xs text-gray-500 mt-1">Flow to preselect in dropdowns</p>
              </div>
            </div>

            {/* LM Studio */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🤖</span>
                <h4 className="text-lg font-medium text-gray-900">LM Studio</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={s.lmstudio_base || ""}
                  onChange={e => setS({...s, lmstudio_base: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="http://localhost:1234/v1"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: LM Studio endpoint for local AI</p>
              </div>
            </div>

            {/* Global Toggle */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">Enable by Default</h4>
                    <p className="text-sm text-gray-600">Auto-enable destinations in Playbook</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!s.destinations_enabled_by_default}
                    onChange={e => setS({...s, destinations_enabled_by_default: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {msg && (
        <div className={`mt-6 p-4 rounded-lg border-l-4 ${
          msg.includes('Error') 
            ? 'bg-red-50 border-red-400 text-red-700' 
            : 'bg-green-50 border-green-400 text-green-700'
        }`}>
          <div className="flex items-center">
            <span className="text-xl mr-3">
              {msg.includes('Error') ? '❌' : '✅'}
            </span>
            <span className="font-medium">{msg}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
        >
          Reset to Defaults
        </button>
        <button
          onClick={saveAll}
          disabled={busy}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
        >
          {busy ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
}

function stripMeta(s) {
  const { _id, created_at, updated_at, ...rest } = s || {};
  return rest;
}