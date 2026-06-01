// Shared design tokens for the Self-Simulating Reality Agent module.
// Kept in a separate file so all tabs use the same epistemic-level palette.

export const LEVEL_COLORS = {
  established:  { fg: '#047857', bg: '#d1fae5', border: '#6ee7b7' },
  mainstream:   { fg: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  speculative:  { fg: '#7c2d12', bg: '#fed7aa', border: '#fdba74' },
  philosophy:   { fg: '#6b21a8', bg: '#ede9fe', border: '#c4b5fd' },
  metaphor:     { fg: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  unsupported:  { fg: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

export const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 22,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
export const panelTitle = { margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
export const subtle = { color: '#64748b', fontSize: 13, lineHeight: 1.55 };
