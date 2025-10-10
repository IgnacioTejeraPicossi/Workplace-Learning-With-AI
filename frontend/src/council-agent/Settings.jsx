import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    harmGate: 0.35,
    minPersonas: 3,
    maxPersonas: 8,
    autoPublish: false,
    defaultChannel: '#council-briefs',
    confluenceSpace: 'SEC'
  });
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadPersonas();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/agents/council/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...settings, ...data });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonas = async () => {
    try {
      const response = await fetch('/agents/council/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error("Failed to load personas:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/agents/council/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert('Error saving settings');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Configure personas, safety thresholds, and publishing options</p>
        </div>
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          Save Settings
        </button>
      </div>

      {/* Safety Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety & Quality Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harm Gate Threshold
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.harmGate}
              onChange={(e) => handleSettingChange('harmGate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.0 (Permissive)</span>
              <span className="font-medium">{settings.harmGate}</span>
              <span>1.0 (Strict)</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Content with harm risk above this threshold will be blocked
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Personas Required
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={settings.minPersonas}
              onChange={(e) => handleSettingChange('minPersonas', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              Minimum number of personas required for deliberation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Personas Allowed
            </label>
            <input
              type="number"
              min="3"
              max="15"
              value={settings.maxPersonas}
              onChange={(e) => handleSettingChange('maxPersonas', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              Maximum number of personas allowed per deliberation
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoPublish}
                onChange={(e) => handleSettingChange('autoPublish', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Auto-publish successful deliberations
              </span>
            </label>
            <p className="text-sm text-gray-600 mt-2">
              Automatically publish briefs to configured channels when deliberation completes
            </p>
          </div>
        </div>
      </div>

      {/* Publishing Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Slack Channel
            </label>
            <input
              type="text"
              value={settings.defaultChannel}
              onChange={(e) => handleSettingChange('defaultChannel', e.target.value)}
              placeholder="#council-briefs"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              Default channel for publishing Council Briefs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confluence Space
            </label>
            <input
              type="text"
              value={settings.confluenceSpace}
              onChange={(e) => handleSettingChange('confluenceSpace', e.target.value)}
              placeholder="SEC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              Default Confluence space for publishing briefs
            </p>
          </div>
        </div>
      </div>

      {/* Persona Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Configuration</h3>
        
        <div className="space-y-4">
          {personas.map((persona, index) => (
            <div key={persona.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{persona.name}</h4>
                  <p className="text-sm text-gray-600">{persona.lens} • {persona.region}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {persona.lens}
                  </span>
                  <button className="text-purple-600 hover:text-purple-900 text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise Tags
                  </label>
                  <input
                    type="text"
                    value={persona.expertise_tags || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Values (JSON)
                  </label>
                  <textarea
                    value={persona.values_json || '{}'}
                    readOnly
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Add New Persona
          </button>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Configuration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">SLACK_BOT_TOKEN</span>
            <span className="text-xs text-gray-500">Required for Slack publishing</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">CONFLUENCE_BASE_URL</span>
            <span className="text-xs text-gray-500">Required for Confluence publishing</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">HARM_GATE</span>
            <span className="text-xs text-gray-500">Safety threshold (default: 0.35)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
