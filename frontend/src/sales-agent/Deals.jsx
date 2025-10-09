import React, { useState, useEffect } from 'react';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock data - in real implementation, this would come from API
    setDeals([
      {
        id: 'deal-001',
        name: 'ACME Corporation',
        stage: 'Proposal',
        amount: 150000,
        owner: 'sales@company.com',
        closeDate: '2025-01-15',
        riskScore: 85,
        potentialScore: 90,
        nextStep: 'Schedule demo'
      },
      {
        id: 'deal-002',
        name: 'Beta Industries',
        stage: 'Negotiation',
        amount: 75000,
        owner: 'sales@company.com',
        closeDate: '2025-01-20',
        riskScore: 45,
        potentialScore: 80,
        nextStep: 'Finalize contract'
      },
      {
        id: 'deal-003',
        name: 'Gamma Solutions',
        stage: 'Qualification',
        amount: 25000,
        owner: 'sales@company.com',
        closeDate: '2025-02-01',
        riskScore: 70,
        potentialScore: 60,
        nextStep: 'Needs analysis'
      }
    ]);
  }, []);

  const filteredDeals = deals.filter(deal => {
    if (filter === 'high-risk') return deal.riskScore >= 70;
    if (filter === 'high-potential') return deal.potentialScore >= 80;
    return true;
  });

  const createEmailDraft = async (deal) => {
    try {
      const bundle = {
        run_id: `sales-draft-${Date.now()}`,
        topic: `Follow-up email for ${deal.name}`,
        summary_md: `Creating contextual follow-up email for ${deal.name} deal`,
        targets: [
          {
            type: "Opportunity",
            crm_id: deal.id,
            name: deal.name
          }
        ],
        actions: [
          {
            type: "email.createDraft",
            payload: {
              subject: `Follow-up: ${deal.name} - ${deal.nextStep}`,
              html: `
                <p>Hi Team,</p>
                <p>Following up on our discussion about <strong>${deal.name}</strong>.</p>
                <p><strong>Deal Details:</strong></p>
                <ul>
                  <li>Stage: ${deal.stage}</li>
                  <li>Amount: $${deal.amount.toLocaleString()}</li>
                  <li>Close Date: ${deal.closeDate}</li>
                  <li>Next Step: ${deal.nextStep}</li>
                </ul>
                <p>Let's schedule the next meeting to move this forward.</p>
                <p>Best regards,<br>Sales Team</p>
              `,
              to: [
                { address: 'buyer@acme.com', name: 'Decision Maker' }
              ]
            }
          },
          {
            type: "slack.postMessage",
            payload: {
              text: `📧 Created follow-up email draft for ${deal.name} ($${deal.amount.toLocaleString()})`,
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
          'X-Signature': 'demo-signature'
        },
        body: JSON.stringify(bundle)
      });

      const result = await response.json();
      console.log('Email draft created:', result);
      
    } catch (error) {
      console.error('Failed to create email draft:', error);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPotentialColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">💼</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Deals Dashboard</h1>
                <p className="text-gray-600">Monitor high-risk and high-potential opportunities</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Deals
              </button>
              <button
                onClick={() => setFilter('high-risk')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'high-risk' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setFilter('high-potential')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'high-potential' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                High Potential
              </button>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <div key={deal.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{deal.name}</h3>
                  <p className="text-sm text-gray-600">{deal.owner}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${deal.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stage:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {deal.stage}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Close Date:</span>
                  <span className="text-sm font-medium">{deal.closeDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Score:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRiskColor(deal.riskScore)}`}>
                    {deal.riskScore}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Potential Score:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPotentialColor(deal.potentialScore)}`}>
                    {deal.potentialScore}%
                  </span>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 mb-2">Next Step:</p>
                  <p className="text-sm font-medium text-gray-900">{deal.nextStep}</p>
                </div>

                <button
                  onClick={() => createEmailDraft(deal)}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  📧 Create Follow-up Email
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Deals</p>
                <p className="text-3xl font-bold text-gray-900">{deals.length}</p>
              </div>
              <div className="text-4xl text-gray-500">💼</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Risk</p>
                <p className="text-3xl font-bold text-red-600">
                  {deals.filter(d => d.riskScore >= 70).length}
                </p>
              </div>
              <div className="text-4xl text-red-500">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Potential</p>
                <p className="text-3xl font-bold text-green-600">
                  {deals.filter(d => d.potentialScore >= 80).length}
                </p>
              </div>
              <div className="text-4xl text-green-500">🚀</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${deals.reduce((sum, deal) => sum + deal.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-4xl text-blue-500">💰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deals;
