import React, { useState, useEffect } from 'react';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/agents/ops/recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRecommendation = async (recommendation) => {
    setSending(true);
    try {
      const runId = `ops-${Date.now()}`;
      
      // Create action bundle based on recommendation
      const bundle = {
        run_id: runId,
        customer_id: recommendation.customer_id,
        topic: recommendation.title,
        summary_md: recommendation.reason,
        recommendations: [{
          title: recommendation.title,
          detail: recommendation.reason
        }],
        actions: [
          {
            type: "tmf622.order.create",
            payload: {
              externalId: runId,
              customerId: recommendation.customer_id,
              offeringId: recommendation.offering_id
            }
          },
          {
            type: "comm.send",
            payload: {
              channel: "email",
              to: `${recommendation.customer_id}@example.com`,
              subject: `Order Confirmation: ${recommendation.title}`,
              html: `<p>Your order for ${recommendation.title} has been processed.</p>`
            }
          }
        ],
        callback_url: "http://localhost:8000/api/agent-runs/callback"
      };

      // Sign the bundle (mock signature for now)
      const signature = "mock-signature";
      
      const response = await fetch('/agents/ops/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature
        },
        body: JSON.stringify(bundle)
      });

      if (response.ok) {
        window.alert('Recommendation approved and dispatched successfully!');
        loadRecommendations(); // Reload to update status
      } else {
        window.alert('Failed to approve recommendation');
      }
    } catch (error) {
      console.error('Failed to approve recommendation:', error);
      window.alert('Error approving recommendation');
    } finally {
      setSending(false);
    }
  };

  const getModeBadge = (mode) => {
    const styles = {
      auto: 'bg-green-100 text-green-800',
      one_click: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[mode] || 'bg-gray-100 text-gray-800'}`}>
        {mode === 'auto' ? '🤖 Auto' : '👆 One-Click'}
      </span>
    );
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
          <p className="text-gray-600">AI-generated recommendations ready for approval</p>
        </div>
        <button
          onClick={loadRecommendations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recommendations</h3>
          <p className="text-gray-600">No pending recommendations at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                    {getModeBadge(rec.mode)}
                  </div>
                  <p className="text-gray-600 mb-3">{rec.reason}</p>
                  
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <span className="ml-2 font-medium">{rec.customer_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Confidence:</span>
                      <span className={`ml-2 font-medium ${getConfidenceColor(rec.confidence)}`}>
                        {(rec.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expected Value:</span>
                      <span className="ml-2 font-medium text-green-600">
                        €{rec.expected_value?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Price Impact:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        €{rec.price_impact?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => approveRecommendation(rec)}
                    disabled={sending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? '⏳ Dispatching...' : '✅ Approve & Dispatch'}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📋 View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sample Recommendation Button */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Recommendation</h3>
        <p className="text-blue-700 mb-4">Create a sample recommendation to test the approval flow</p>
        <button
          onClick={() => {
            const sampleRec = {
              customer_id: "TELIA-123",
              title: "Upgrade to 5G Unlimited",
              reason: "High usage detected, customer is eligible for 5G upgrade",
              offering_id: "5G-UNLTD",
              price_impact: 8.0,
              expected_value: 15.0,
              confidence: 0.85,
              mode: "one_click"
            };
            approveRecommendation(sampleRec);
          }}
          disabled={sending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {sending ? '⏳ Creating...' : '🧪 Create Sample Recommendation'}
        </button>
      </div>
    </div>
  );
};

export default Recommendations;
