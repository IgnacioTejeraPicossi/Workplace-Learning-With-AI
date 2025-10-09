import React, { useState } from 'react';

const Hygiene = () => {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  async function fixHygieneGaps() {
    setSending(true);
    
    try {
      const bundle = {
        run_id: `sales-hygiene-${Date.now()}`,
        topic: "Fix Pipeline Hygiene",
        summary_md: "Automatically fixing missing fields and stale stages in CRM",
        targets: [
          {
            type: "Opportunity",
            crm_id: "006xx000004",
            name: "ACME Deal"
          }
        ],
        recommended_actions: [
          {
            title: "Update close date",
            detail: "Set realistic close date based on stage",
            assignee: "sales@company.com"
          },
          {
            title: "Schedule next activity",
            detail: "Book follow-up call with decision maker",
            assignee: "sales@company.com"
          }
        ],
        actions: [
          {
            type: "crm.updateOpportunity",
            payload: {
              id: "006xx000004",
              stage: "Proposal",
              nextStep: "Schedule demo",
              closeDate: "2025-01-20",
              amount: 50000
            }
          },
          {
            type: "crm.createTask",
            payload: {
              opportunityId: "006xx000004",
              subject: "Book demo with ACME",
              due: "2025-01-10",
              ownerId: "sales@company.com"
            }
          },
          {
            type: "slack.postMessage",
            payload: {
              text: "🧹 Pipeline Hygiene Alert: Fixed missing fields for ACME Deal",
              channel: "#sales"
            }
          }
        ],
        callback_url: "/api/agent-runs/callback"
      };

      const response = await fetch('/agents/sales/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'demo-signature' // In real implementation, this would be HMAC signed
        },
        body: JSON.stringify(bundle)
      });

      const result = await response.json();
      setLastResult(result);
      
    } catch (error) {
      console.error('Failed to execute hygiene fix:', error);
      setLastResult({ error: error.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">🧹</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pipeline Hygiene</h1>
              <p className="text-gray-600">Monitor and fix data quality issues in your CRM</p>
            </div>
          </div>
        </div>

        {/* Sample Hygiene Issues */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sample Hygiene Issues</h2>
          
          <div className="space-y-4">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800">ACME Deal</h3>
                  <p className="text-sm text-red-600">Missing: Close Date, Next Activity, Amount</p>
                  <p className="text-xs text-red-500">Hygiene Score: 85% (High Risk)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Owner: sales@company.com</p>
                  <p className="text-sm text-gray-600">Stage: Qualification</p>
                </div>
              </div>
            </div>

            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-800">Beta Corp Deal</h3>
                  <p className="text-sm text-yellow-600">Missing: Next Activity</p>
                  <p className="text-xs text-yellow-500">Hygiene Score: 25% (Medium Risk)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Owner: sales@company.com</p>
                  <p className="text-sm text-gray-600">Stage: Proposal</p>
                </div>
              </div>
            </div>

            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">Gamma Inc Deal</h3>
                  <p className="text-sm text-green-600">All fields complete</p>
                  <p className="text-xs text-green-500">Hygiene Score: 5% (Low Risk)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Owner: sales@company.com</p>
                  <p className="text-sm text-gray-600">Stage: Negotiation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="flex space-x-4">
            <button
              onClick={fixHygieneGaps}
              disabled={sending}
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all duration-200
                ${sending 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                }
              `}
            >
              {sending ? 'Fixing...' : 'Fix Sample Gaps'}
            </button>

            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
            >
              Refresh Data
            </button>
          </div>

          {lastResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Last Result:</h3>
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Issues</p>
                <p className="text-3xl font-bold text-red-600">12</p>
              </div>
              <div className="text-4xl text-red-500">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Auto-Fixed</p>
                <p className="text-3xl font-bold text-green-600">8</p>
              </div>
              <div className="text-4xl text-green-500">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Score</p>
                <p className="text-3xl font-bold text-blue-600">23%</p>
              </div>
              <div className="text-4xl text-blue-500">📊</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hygiene;
