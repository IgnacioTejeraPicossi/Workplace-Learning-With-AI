import React, { useState, useEffect } from 'react';

const Findings = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFindings();
  }, []);

  const loadFindings = async () => {
    try {
      const response = await fetch('/agents/grc/findings');
      if (response.ok) {
        const data = await response.json();
        // Ensure findings is always an array
        setFindings(Array.isArray(data) ? data : (data.findings || []));
      } else {
        // If endpoint doesn't exist, use sample data
        setFindings([
          {
            object_id: "PO-4500001234",
            title: "Purchase Order Price Variance",
            category: "Procurement",
            severity: 0.8,
            confidence: 0.9,
            materiality: 0.7,
            status: "Open"
          },
          {
            object_id: "INV-51056001",
            title: "Invoice Three-way Match Failed",
            category: "Finance",
            severity: 0.6,
            confidence: 0.8,
            materiality: 0.5,
            status: "InProgress"
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to load findings:", error);
      // Use sample data on error
      setFindings([
        {
          object_id: "PO-4500001234",
          title: "Purchase Order Price Variance",
          category: "Procurement",
          severity: 0.8,
          confidence: 0.9,
          materiality: 0.7,
          status: "Open"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const dispatchHold = async () => {
    setSending(true);
    try {
      const run = `grc-${Date.now()}`;
      const bundle = {
        run_id: run,
        object_ref: "PO 4500001234",
        topic: "Three-way match failed",
        summary_md: "Price variance > 10% detected between PO and Invoice",
        evidence: [
          {
            source: "SAP",
            snippet: "PO vs Invoice mismatch detected"
          }
        ],
        actions: [
          {
            type: "invoice.hold",
            payload: {
              invoiceId: "51056001",
              reason: "Variance > 10%"
            },
            mode: "Auto"
          },
          {
            type: "notify.slack",
            payload: {
              channel: "#grc",
              text: "Invoice 51056001 on hold due to price variance > 10%"
            },
            mode: "Auto"
          }
        ],
        callback_url: "/api/agent-runs/callback"
      };

      const response = await fetch('/agents/grc/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'test-signature' // In real implementation, this would be properly signed
        },
        body: JSON.stringify(bundle)
      });

      if (response.ok) {
        alert('GRC action dispatched successfully!');
        loadFindings(); // Refresh findings
      } else {
        alert('Failed to dispatch GRC action');
      }
    } catch (error) {
      console.error("Failed to dispatch action:", error);
      alert('Error dispatching action');
    } finally {
      setSending(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity >= 0.8) return 'text-red-600 bg-red-100';
    if (severity >= 0.6) return 'text-orange-600 bg-orange-100';
    if (severity >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-red-600 bg-red-100';
      case 'InProgress': return 'text-blue-600 bg-blue-100';
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'Closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GRC Findings</h2>
          <p className="text-gray-600">Monitor and manage compliance findings across Finance, Procurement, Supply Chain, and ESG</p>
        </div>
        <button
          onClick={dispatchHold}
          disabled={sending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Dispatching..." : "Test Hold Invoice"}
        </button>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {findings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No findings available</p>
                      <p className="text-sm">Run the test action to generate sample findings</p>
                    </div>
                  </td>
                </tr>
              ) : (
                findings.map((finding, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{finding.object_id}</div>
                      <div className="text-sm text-gray-500">{finding.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {finding.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                        {(finding.severity * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(finding.status)}`}>
                        {finding.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((finding.severity * 0.5 + finding.confidence * 0.2 + finding.materiality * 0.2) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Approve & Dispatch
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sample Data Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Sample Data</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Click "Test Hold Invoice" to generate sample findings and test the GRC agent execution flow.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Findings;
