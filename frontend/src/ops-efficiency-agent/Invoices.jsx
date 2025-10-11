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
					{ type: "invoice.approve", payload: { invoiceId: invoice.id } },
					{
						type: "notify.slack",
						payload: {
							channel: "#finance",
							text: `Invoice ${invoice.id} approved for NOK ${invoice.amount.toLocaleString()}`,
							blocks: [
								{ type: "header", text: { type: "plain_text", text: "✅ Invoice Approved" } },
								{ type: "section", fields: [
									{ type: "mrkdwn", text: `*Invoice ID:*\n${invoice.id}` },
									{ type: "mrkdwn", text: `*Amount:*\nNOK ${invoice.amount.toLocaleString()}` },
									{ type: "mrkdwn", text: `*Vendor:*\n${invoice.vendor}` }
								]}
							]
						}
					}
				],
				callback_url: "/api/agent-runs/callback"
			};
			await executeOpsx(bundle);
			setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: 'approved' } : inv));
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
					{ type: "invoice.hold", payload: { invoiceId: invoice.id, reason: `Variance ${invoice.variance_percent}% exceeds threshold` } },
					{
						type: "notify.slack",
						payload: {
							channel: "#finance",
							text: `Invoice ${invoice.id} put on hold - variance ${invoice.variance_percent}%`,
							blocks: [
								{ type: "header", text: { type: "plain_text", text: "⚠️ Invoice On Hold" } },
								{ type: "section", fields: [
									{ type: "mrkdwn", text: `*Invoice ID:*\n${invoice.id}` },
									{ type: "mrkdwn", text: `*Variance:*\n${invoice.variance_percent}%` },
									{ type: "mrkdwn", text: `*Reason:*\nManual review required` }
								]}
							]
						}
					}
				],
				callback_url: "/api/agent-runs/callback"
			};
			await executeOpsx(bundle);
			setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: 'hold' } : inv));
			alert(`Invoice ${invoice.id} put on hold!`);
		} catch (error) {
			alert(`Failed to hold invoice: ${error.message}`);
		} finally {
			setSending(false);
		}
	};

	const getStatusBadge = (status) => {
		const map = {
			pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
			approved: { bg: '#DCFCE7', color: '#166534', label: 'Approved' },
			hold: { bg: '#FEE2E2', color: '#991B1B', label: 'Hold' },
			rejected: { bg: '#E5E7EB', color: '#374151', label: 'Rejected' }
		};
		const s = map[status] || { bg: '#E5E7EB', color: '#374151', label: status };
		return (
			<span style={{ padding: '0.25rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, backgroundColor: s.bg, color: s.color }}>
				{s.label}
			</span>
		);
	};

	const getVarianceBadge = (variance) => {
		if (variance === 0) return null;
		const isRed = Math.abs(variance) > 5;
		return (
			<span style={{ padding: '0.25rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, backgroundColor: isRed ? '#FEE2E2' : '#FEF3C7', color: isRed ? '#991B1B' : '#92400E' }}>
				{variance > 0 ? '+' : ''}{variance.toFixed(1)}%
			</span>
		);
	};

	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: '2rem' }}>
				<div style={{ fontSize: '1.5rem' }}>⏳</div>
				<p>Loading invoices...</p>
			</div>
		);
	}

	const container = { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' };
	const card = { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
	const cardHeader = { padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
	const cardTitle = { margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' };
	const tableWrap = { overflowX: 'auto' };
	const table = { width: '100%', borderCollapse: 'collapse' };
	const th = { textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', backgroundColor: '#F9FAFB', borderBottom: '1px solid #e5e7eb' };
	const td = { padding: '0.75rem', borderBottom: '1px solid #F3F4F6', fontSize: '0.9rem', color: '#111827' };

	const btn = (color) => ({
		padding: '0.35rem 0.6rem',
		borderRadius: '8px',
		border: `1px solid ${color.border}`,
		backgroundColor: color.bg,
		color: color.text,
		cursor: 'pointer'
	});

	return (
		<div style={container}>
			<div style={{ marginBottom: '1.25rem' }}>
				<h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: 0 }}>Invoice Management</h1>
				<p style={{ color: '#6B7280', marginTop: '0.5rem' }}>Process invoices with 3-way matching and variance detection</p>
			</div>

			<div style={card}>
				<div style={cardHeader}>
					<h2 style={cardTitle}>Recent Invoices</h2>
				</div>
				<div style={{ padding: '0.25rem 0 1rem 0' }}>
					<div style={tableWrap}>
						<table style={table}>
							<thead>
								<tr>
									<th style={th}>Invoice ID</th>
									<th style={th}>Vendor</th>
									<th style={th}>Amount</th>
									<th style={th}>Status</th>
									<th style={th}>Variance</th>
									<th style={th}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map((invoice) => (
									<tr key={invoice.id}>
										<td style={td}>
											<div style={{ fontWeight: 600 }}>{invoice.id}</div>
											<div style={{ color: '#6B7280', fontSize: '0.85rem' }}>PO: {invoice.po_number}</div>
										</td>
										<td style={td}>{invoice.vendor}</td>
										<td style={td}>NOK {invoice.amount.toLocaleString()}</td>
										<td style={td}>{getStatusBadge(invoice.status)}</td>
										<td style={td}>{getVarianceBadge(invoice.variance_percent)}</td>
										<td style={td}>
											<div style={{ display: 'flex', gap: '0.5rem' }}>
												{invoice.status === 'pending' && (
													<>
														<button onClick={() => handleApprove(invoice)} disabled={sending} style={btn({ bg: '#ECFDF5', border: '#10B981', text: '#065F46' })}>Approve</button>
														<button onClick={() => handleHold(invoice)} disabled={sending} style={btn({ bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' })}>Hold</button>
													</>
												)}
												<button onClick={() => setSelectedInvoice(invoice)} style={btn({ bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' })}>Details</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Invoice Details Modal */}
			{selectedInvoice && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
					<div style={{ width: 480, background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: 20 }}>
						<h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>Invoice Details - {selectedInvoice.id}</h3>
						<div style={{ display: 'grid', rowGap: 8 }}>
							<div><span style={{ fontWeight: 600 }}>Vendor:</span> {selectedInvoice.vendor}</div>
							<div><span style={{ fontWeight: 600 }}>Amount:</span> NOK {selectedInvoice.amount.toLocaleString()}</div>
							<div><span style={{ fontWeight: 600 }}>PO Number:</span> {selectedInvoice.po_number}</div>
							<div><span style={{ fontWeight: 600 }}>GR Number:</span> {selectedInvoice.gr_number}</div>
							<div><span style={{ fontWeight: 600 }}>Variance:</span> {selectedInvoice.variance_percent}% (NOK {selectedInvoice.variance_amount.toLocaleString()})</div>
							<div><span style={{ fontWeight: 600 }}>Status:</span> {getStatusBadge(selectedInvoice.status)}</div>
						</div>
						<div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
							<button onClick={() => setSelectedInvoice(null)} style={{ padding: '0.45rem 0.8rem', background: '#E5E7EB', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, cursor: 'pointer' }}>Close</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Invoices;
