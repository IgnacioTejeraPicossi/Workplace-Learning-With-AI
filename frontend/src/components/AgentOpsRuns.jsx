import React, { useEffect, useState } from "react";

export default function AgentOpsRuns() {
  const [items, setItems] = useState([]);
  const [module, setModule] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = module ? `?module=${module}` : "";
      const response = await fetch(`http://localhost:8000/api/agent-runs${q}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const res = await response.json();
      setItems(res.items || res.data?.items || []);
    } catch (error) {
      console.error('Failed to load agent runs:', error);
      alert('Failed to load agent runs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [module]);

  return (
    <div className="p-4">
      <div className="flex gap-3 items-center mb-3">
        <h1 className="text-xl font-bold">Agent Runs</h1>
        <select 
          className="border p-1 rounded" 
          value={module} 
          onChange={e => setModule(e.target.value)}
        >
          <option value="">All</option>
          <option value="compliance">Compliance</option>
          <option value="productivity">Productivity</option>
        </select>
        <button 
          className="border px-3 py-1 rounded" 
          onClick={load}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Run ID</th>
              <th className="p-2">Module</th>
              <th className="p-2">Topic</th>
              <th className="p-2">Status</th>
              <th className="p-2">Artifacts</th>
              <th className="p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.run_id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">{x.run_id}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    x.module === 'compliance' ? 'bg-blue-100 text-blue-800' : 
                    x.module === 'productivity' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {x.module}
                  </span>
                </td>
                <td className="p-2">{x.topic}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    x.status === 'DONE' ? 'bg-green-100 text-green-800' :
                    x.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' :
                    x.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {x.status}
                  </span>
                </td>
                <td className="p-2">
                  <div className="space-y-1">
                    {x.artifacts?.jira && (
                      <div className="text-xs">
                        <strong>Jira:</strong> {Array.isArray(x.artifacts.jira) ? 
                          x.artifacts.jira.join(", ") : String(x.artifacts.jira)}
                      </div>
                    )}
                    {x.artifacts?.slack && (
                      <div className="text-xs">
                        <strong>Slack:</strong> {String(x.artifacts.slack)}
                      </div>
                    )}
                    {x.artifacts?.sheets && (
                      <div className="text-xs">
                        <strong>Sheets:</strong> 
                        <a 
                          className="underline ml-1 text-blue-600" 
                          href={String(x.artifacts.sheets)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          open
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2 text-xs text-gray-600">
                  {new Date(x.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No agent runs found. Try running a compliance or productivity agent first.
          </div>
        )}
      </div>
    </div>
  );
}