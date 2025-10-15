import React, { useState } from 'react';

const Insights = () => {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const sendSampleInsight = async () => {
    setSending(true);
    setResult(null);

    try {
      const bundle = {
        run_id: `ea-${Date.now()}`,
        topic: 'Kubernetes 1.31 Deprecation Alert',
        summary_md: `## Impact on Norwegian Portfolio
        
Kubernetes 1.31 deprecates several APIs that affect our Payments API and Booking Service.

**Key Changes:**
- PodSecurityPolicy removed
- CertificateSigningRequest v1beta1 deprecated
- Ingress v1beta1 no longer supported

**Recommended Actions:**
1. Update Payments API Helm charts
2. Migrate to PodSecurityAdmission
3. Plan upgrade window for Q1 2025`,
        evidence: [
          {
            url: 'https://kubernetes.io/blog/2024/kubernetes-1-31-release',
            source: 'Kubernetes Blog',
            snippet: 'Several APIs are being deprecated in 1.31...',
            published_at: new Date().toISOString(),
          },
        ],
        portfolio_matches: [
          {
            id: 'APP-123',
            name: 'Payments API',
            score: 0.86,
            reason: 'Uses deprecated PodSecurityPolicy',
          },
          {
            id: 'APP-456',
            name: 'Booking Service',
            score: 0.72,
            reason: 'Uses Ingress v1beta1',
          },
        ],
        recommended_actions: [
          {
            title: 'Plan upgrade window',
            detail: 'Schedule maintenance window for Kubernetes upgrade',
            assignee: 'team-platform',
          },
          {
            title: 'Update Helm charts',
            detail: 'Migrate all charts to use current API versions',
            assignee: 'team-payments',
          },
        ],
        actions: [
          {
            type: 'jira.createIssue',
            payload: {
              projectKey: 'EA',
              summary: 'EA Update: Kubernetes 1.31 Deprecation',
              description:
                'Kubernetes 1.31 deprecates APIs affecting Payments API and Booking Service',
              issueType: 'Task',
              labels: ['ea', 'kubernetes', 'deprecation'],
            },
          },
          {
            type: 'slack.postMessage',
            payload: {
              text: '🚨 EA Alert: Kubernetes 1.31 affects Payments API and Booking Service. See Jira for details.',
            },
          },
        ],
        callback_url: '/api/agent-runs/callback',
      };

      // Sign the bundle (in production, this is done server-side)
      const signRes = await fetch('http://localhost:8000/api/dev/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });
      const signature = await signRes.text();

      // Execute the bundle
      const res = await fetch('http://localhost:8000/agents/ea/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: JSON.stringify(bundle),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Insights Dashboard
        </h2>
        <p className="text-sm text-gray-600">
          Review and dispatch EA insights to Norwegian systems
        </p>
      </div>

      {/* Demo Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📊 Demo: Send Sample Insight
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          This will create a sample Kubernetes deprecation alert and dispatch it
          to Jira and Slack
        </p>
        <button
          onClick={sendSampleInsight}
          disabled={sending}
          className={`
            px-6 py-3 rounded-lg font-medium text-white transition-colors
            ${
              sending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {sending ? '⏳ Dispatching...' : '🚀 Send Sample Insight'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg shadow p-6 ${
            result.error ? 'bg-red-50' : 'bg-green-50'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${
              result.error ? 'text-red-900' : 'text-green-900'
            }`}
          >
            {result.error ? '❌ Error' : '✅ Success'}
          </h3>
          {result.error ? (
            <p className="text-sm text-red-700">{result.error}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-green-900">Run ID:</p>
                <code className="text-xs text-green-800">{result.run_id}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  Attestation Hash:
                </p>
                <code className="text-xs text-green-800 break-all">
                  {result.attestation_hash}
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Artifacts:</p>
                <pre className="text-xs text-green-800 mt-2 p-3 bg-white rounded overflow-auto max-h-40">
                  {JSON.stringify(result.artifacts, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder for future insights table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Recent Insights
        </h3>
        <p className="text-sm text-gray-600 italic">
          This section will display automatically generated insights from the
          Pulse job
        </p>
      </div>
    </div>
  );
};

export default Insights;

