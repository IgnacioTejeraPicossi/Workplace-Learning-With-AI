import React, { useEffect, useState } from 'react';

const Clusters = () => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/clusters');
      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (error) {
      console.error('Failed to load clusters:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestAlert = async () => {
    setSending(true);
    try {
      const bundle = {
        run_id: `attn-test-${Date.now()}`,
        topic: "Test Alert - Vendor Outage",
        summary_md: "This is a test alert for the Personal Attention Agent",
        evidence: [
          {
            url: "https://status.example.com",
            source: "Status Page",
            snippet: "Service degradation detected",
            published_at: new Date().toISOString()
          }
        ],
        recommended_actions: [
          {
            title: "Post status update",
            detail: "Inform team about the outage",
            assignee: "oncall@telenor.com",
            due_date: new Date(Date.now() + 3600000).toISOString()
          }
        ],
        actions: [
          {
            type: "slack.postMessage",
            payload: {
              channel: "#cto-brief",
              text: "🚨 Test Alert: Vendor outage detected. Please check status page."
            }
          },
          {
            type: "teams.sendCard",
            payload: {
              title: "Vendor Outage Alert",
              summary: "Service degradation detected on vendor platform",
              url: "https://status.example.com"
            }
          }
        ],
        callback_url: "http://localhost:8000/api/agent-runs/callback"
      };

      const response = await fetch('/agents/attention/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle)
      });

      if (response.ok) {
        window.alert('Test alert sent successfully!');
        loadClusters();
      } else {
        window.alert('Failed to send test alert');
      }
    } catch (error) {
      console.error('Failed to send test alert:', error);
      window.alert('Error sending test alert');
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800';
    if (score >= 0.6) return 'bg-orange-100 text-orange-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPriorityLabel = (score) => {
    if (score >= 0.8) return 'Urgent';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Signal Clusters</h1>
            <p className="text-gray-600 mt-1">
              AI-powered clustering of multi-channel signals with priority scoring
            </p>
          </div>
          <button
            onClick={sendTestAlert}
            disabled={sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Test Alert'}
          </button>
        </div>

        {/* Clusters List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Clusters</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading clusters...</div>
            </div>
          ) : clusters.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 mb-4">No clusters found</div>
              <p className="text-sm text-gray-400">
                Clusters will appear as signals are ingested and processed
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clusters.map((cluster) => (
                <div key={cluster._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {cluster.topic}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(cluster.score)}`}>
                          {getPriorityLabel(cluster.score)} ({cluster.score.toFixed(2)})
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {cluster.volume} signals
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{cluster.summaryMd}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Evidence */}
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Evidence</h5>
                          <div className="space-y-2">
                            {cluster.evidence && cluster.evidence.slice(0, 3).map((ev, i) => (
                              <div key={i} className="text-sm">
                                <a 
                                  href={ev.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {ev.source}
                                </a>
                                {ev.snippet && (
                                  <p className="text-gray-500 text-xs mt-1">{ev.snippet}</p>
                                )}
                              </div>
                            ))}
                            {cluster.evidence && cluster.evidence.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{cluster.evidence.length - 3} more sources
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Recommended Actions */}
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Recommended Actions</h5>
                          <div className="space-y-2">
                            {cluster.recommended_actions && cluster.recommended_actions.slice(0, 2).map((action, i) => (
                              <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                                <div className="font-medium">{action.title}</div>
                                {action.detail && (
                                  <div className="text-gray-600 text-xs mt-1">{action.detail}</div>
                                )}
                                {action.assignee && (
                                  <div className="text-blue-600 text-xs mt-1">→ {action.assignee}</div>
                                )}
                              </div>
                            ))}
                            {cluster.recommended_actions && cluster.recommended_actions.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{cluster.recommended_actions.length - 2} more actions
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                        Send Alert
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>First seen: {new Date(cluster.firstSeen).toLocaleString()}</span>
                      <span>Last seen: {new Date(cluster.lastSeen).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clusters;
