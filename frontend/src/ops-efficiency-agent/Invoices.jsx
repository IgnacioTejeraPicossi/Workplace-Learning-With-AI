import React, { useState, useEffect } from 'react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      // Mock data for demo
      const mockInvoices = [
        {
          id: 'INV-2024-001',
          vendor: 'Office Supplies AS',
          amount: 2500.00,
          currency: 'NOK',
          status: 'pending',
          po_number: 'PO-2024-001',
          gr_number: 'GR-2024-001',
          variance_percent: 2.5,
          variance_amount: 62.50,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 'INV-2024-002',
          vendor: 'IT Services Ltd',
          amount: 15000.00,
          currency: 'NOK',
          status: 'approved',
          po_number: 'PO-2024-002',
          gr_number: 'GR-2024-002',
          variance_percent: 0.0,
          variance_amount: 0.00,
          created_at: '2024-01-14T14:20:00Z'
        },
        {
          id: 'INV-2024-003',
          vendor: 'Marketing Agency',
          amount: 8500.00,
          currency: 'NOK',
          status: 'hold',
          po_number: 'PO-2024-003',
          gr_number: 'GR-2024-003',
          variance_percent: 8.2,
          variance_amount: 697.00,
          created_at: '2024-01-13T09:15:00Z'
        }
      ];
      
      setInvoices(mockInvoices);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
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

  const handleApprove = async (invoice) => {
    setSending(true);
    try {
      const runId = `opsx-inv-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: `Invoice ${invoice.id} Approval`,
        summary_md: `Approving invoice ${invoice.id} for ${invoice.vendor}`,
        actions: [
          {
            type: "invoice.approve",
            payload: { invoiceId: invoice.id }
          },
          {
            type: "notify.slack",
            payload: {
              channel: "#finance",
              text: `Invoice ${invoice.id} approved for NOK ${invoice.amount.toLocaleString()}`,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: "✅ Invoice Approved"
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Invoice ID:*\n${invoice.id}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Amount:*\nNOK ${invoice.amount.toLocaleString()}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Vendor:*\n${invoice.vendor}`
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
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'approved' } : inv
      ));
      
      alert(`Invoice ${invoice.id} approved successfully!`);
    } catch (error) {
      alert(`Failed to approve invoice: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleHold = async (invoice) => {
    setSending(true);
    try {
      const runId = `opsx-inv-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: `Invoice ${invoice.id} Hold`,
        summary_md: `Putting invoice ${invoice.id} on hold for review`,
        actions: [
          {
            type: "invoice.hold",
            payload: { 
              invoiceId: invoice.id,
              reason: `Variance ${invoice.variance_percent}% exceeds threshold`
            }
          },
          {
            type: "notify.slack",
            payload: {
              channel: "#finance",
              text: `Invoice ${invoice.id} put on hold - variance ${invoice.variance_percent}%`,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: "⚠️ Invoice On Hold"
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Invoice ID:*\n${invoice.id}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Variance:*\n${invoice.variance_percent}%`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Reason:*\nManual review required`
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
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'hold' } : inv
      ));
      
      alert(`Invoice ${invoice.id} put on hold!`);
    } catch (error) {
      alert(`Failed to hold invoice: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      hold: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVarianceBadge = (variance) => {
    if (variance === 0) return null;
    
    const color = Math.abs(variance) > 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
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
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-lg text-gray-600 mt-2">Process invoices with 3-way matching and variance detection</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
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
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                    <div className="text-sm text-gray-500">PO: {invoice.po_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.vendor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      NOK {invoice.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVarianceBadge(invoice.variance_percent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {invoice.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(invoice)}
                            disabled={sending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleHold(invoice)}
                            disabled={sending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Hold
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                      >
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Invoice Details - {selectedInvoice.id}
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Vendor:</span> {selectedInvoice.vendor}
                </div>
                <div>
                  <span className="font-medium">Amount:</span> NOK {selectedInvoice.amount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">PO Number:</span> {selectedInvoice.po_number}
                </div>
                <div>
                  <span className="font-medium">GR Number:</span> {selectedInvoice.gr_number}
                </div>
                <div>
                  <span className="font-medium">Variance:</span> {selectedInvoice.variance_percent}% 
                  (NOK {selectedInvoice.variance_amount.toLocaleString()})
                </div>
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
