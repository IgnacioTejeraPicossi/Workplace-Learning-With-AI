import React, { useState, useEffect } from 'react';

const Allocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      // Mock data for demo
      const mockAllocations = [
        {
          id: 'ALLOC-2024-001',
          document_id: 'DOC-2024-001',
          vendor: 'SaaS Provider AS',
          description: 'Monthly subscription - Office 365',
          total_amount: 5000.00,
          status: 'draft',
          confidence_score: 0.85,
          rationale: 'Historical pattern shows 60% IT, 40% Operations split',
          lines: [
            { amount: 3000, gl_account: '6020', cost_center: 'IT_DEPT', project: null, note: 'IT Department' },
            { amount: 2000, gl_account: '6020', cost_center: 'OPS_DEPT', project: null, note: 'Operations' }
          ],
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 'ALLOC-2024-002',
          document_id: 'DOC-2024-002',
          vendor: 'Marketing Agency',
          description: 'Q1 Marketing Campaign',
          total_amount: 25000.00,
          status: 'posted',
          confidence_score: 0.92,
          rationale: 'Campaign-specific allocation based on project codes',
          lines: [
            { amount: 15000, gl_account: '6040', cost_center: 'MARKETING', project: 'Q1_CAMPAIGN', note: 'Campaign costs' },
            { amount: 10000, gl_account: '6040', cost_center: 'MARKETING', project: 'BRANDING', note: 'Brand development' }
          ],
          created_at: '2024-01-14T14:20:00Z'
        }
      ];
      
      setAllocations(mockAllocations);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
      setLoading(false);
    }
  };

  const executeOpsx = async (bundle) => {
    try {
      const response = await fetch('/agents/opsx/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'test-signature' // In production, generate proper HMAC
        },
        body: JSON.stringify(bundle)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Ops Efficiency execution result:', result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to execute Ops Efficiency:', error);
      throw error;
    }
  };

  const handleSuggestAllocation = async () => {
    setSending(true);
    try {
      const runId = `opsx-alloc-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: "Cost Allocation Suggestion",
        summary_md: "AI-powered cost allocation suggestion based on vendor patterns",
        actions: [
          {
            type: "cost.allocate",
            payload: {
              docId: "JRN-001",
              lines: [
                { amount: 3000, gl: "6020", costCenter: "IT_DEPT", project: null, note: "IT Department" },
                { amount: 2000, gl: "6020", costCenter: "OPS_DEPT", project: null, note: "Operations" }
              ]
            }
          },
          {
            type: "notify.slack",
            payload: {
              channel: "#finance",
              text: "New cost allocation suggestion generated with 85% confidence",
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: "💰 Cost Allocation Suggestion"
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: "*Document:*\nJRN-001"
                    },
                    {
                      type: "mrkdwn",
                      text: "*Total Amount:*\nNOK 5,000"
                    },
                    {
                      type: "mrkdwn",
                      text: "*Confidence:*\n85%"
                    },
                    {
                      type: "mrkdwn",
                      text: "*Rationale:*\nHistorical pattern analysis"
                    }
                  ]
                }
              ]
            }
          }
        ],
        callback_url: "/api/agent-runs/callback"
      };

      await executeOpsx(bundle);
      setShowSuggestion(true);
      alert('Cost allocation suggestion generated successfully!');
    } catch (error) {
      alert(`Failed to generate suggestion: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handlePostAllocation = async (allocation) => {
    setSending(true);
    try {
      const runId = `opsx-alloc-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: `Post Allocation ${allocation.id}`,
        summary_md: `Posting cost allocation ${allocation.id} to ERP system`,
        actions: [
          {
            type: "cost.allocate",
            payload: {
              docId: allocation.document_id,
              lines: allocation.lines
            }
          },
          {
            type: "notify.slack",
            payload: {
              channel: "#finance",
              text: `Allocation ${allocation.id} posted successfully`,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: "✅ Allocation Posted"
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Allocation ID:*\n${allocation.id}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Amount:*\nNOK ${allocation.total_amount.toLocaleString()}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Lines:*\n${allocation.lines.length}`
                    }
                  ]
                }
              ]
            }
          }
        ],
        callback_url: "/api/agent-runs/callback"
      };

      await executeOpsx(bundle);
      
      // Update local state
      setAllocations(prev => prev.map(alloc => 
        alloc.id === allocation.id ? { ...alloc, status: 'posted' } : alloc
      ));
      
      alert(`Allocation ${allocation.id} posted successfully!`);
    } catch (error) {
      alert(`Failed to post allocation: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      posted: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getConfidenceBadge = (confidence) => {
    const color = confidence >= 0.8 ? 'bg-green-100 text-green-800' : 
                  confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {(confidence * 100).toFixed(0)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cost Allocations</h1>
        <p className="text-lg text-gray-600 mt-2">AI-powered cost allocation suggestions with explainability</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <button
          onClick={handleSuggestAllocation}
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Generating...' : 'Suggest New Allocation'}
        </button>
      </div>

      {/* Allocation Suggestions */}
      {showSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">New Allocation Suggestion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Suggested Split:</h4>
              <ul className="mt-2 space-y-1">
                <li className="text-sm text-gray-600">IT Department: NOK 3,000 (60%)</li>
                <li className="text-sm text-gray-600">Operations: NOK 2,000 (40%)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Rationale:</h4>
              <p className="text-sm text-gray-600 mt-2">
                Historical pattern analysis shows consistent 60/40 split for SaaS subscriptions
              </p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Accept Suggestion
            </button>
            <button 
              onClick={() => setShowSuggestion(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Allocations Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Allocations</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocations.map((allocation) => (
                <tr key={allocation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{allocation.id}</div>
                    <div className="text-sm text-gray-500">Doc: {allocation.document_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{allocation.vendor}</div>
                    <div className="text-sm text-gray-500">{allocation.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      NOK {allocation.total_amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(allocation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getConfidenceBadge(allocation.confidence_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {allocation.status === 'draft' && (
                        <button
                          onClick={() => handlePostAllocation(allocation)}
                          disabled={sending}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          Post
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Details */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Breakdown</h3>
        <div className="space-y-4">
          {allocations.map((allocation) => (
            <div key={allocation.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">{allocation.id}</h4>
                <div className="flex space-x-2">
                  {getStatusBadge(allocation.status)}
                  {getConfidenceBadge(allocation.confidence_score)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{allocation.rationale}</p>
              <div className="space-y-2">
                {allocation.lines.map((line, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {line.cost_center} {line.project && `(${line.project})`}
                    </span>
                    <span className="font-medium">NOK {line.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Allocations;
