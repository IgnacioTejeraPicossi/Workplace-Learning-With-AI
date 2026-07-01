import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from '../_tokens';
import EpistemicBadge from '../EpistemicBadge';

/**
 * TheoryMap — SVG interactive graph of the 8 theories the module covers.
 *
 * Design choices:
 *   - Pure SVG, no library — the graph is tiny (8 nodes), so react-flow etc.
 *     would be overkill.
 *   - OPH at the centre (it's the programme the whole module orbits).
 *   - The other 7 theories on a circle around it, position hand-picked so
 *     structurally related theories (holographic ↔ celestialHolography, iit
 *     ↔ gnw) sit near each other.
 *   - Edges are typed and coloured by relation:
 *       provides_form / structural_parallel / competes_with / candidate_measure
 *       / de_mystifies / different_framing / supports_side
 *   - Click a node → info panel below shows the same body / level / link
 *     already curated in the Theory Tour tab (single source of truth).
 */

// ─── Layout ────────────────────────────────────────────────────────────────
const W = 780;
const H = 520;
const CX = W / 2;
const CY = H / 2;
const R  = 190;  // orbit radius
const R_NODE = 46;

// Ring positions clockwise from top. Chosen so that:
//   iit at 12 & gnw at ~1 sit next to each other (they compete)
//   holographic at ~4 & celestialHolography at ~5 sit next to each other
//   predictive at ~7 (mind / cognition side)
//   relationalQm at ~9 (QM side)
//   simHypothesis at ~11 (philosophy side)
const RING_ORDER = [
  'iit',                //  0/8 · top
  'gnw',                //  1/8
  'holographic',        //  3/8 · right-ish
  'celestialHolography',//  4/8
  'predictive',         //  5/8
  'relationalQm',       //  6/8
  'simHypothesis',      //  7/8
];

const NODES = (() => {
  const list = [{ id: 'oph', cx: CX, cy: CY, isCenter: true }];
  const angles = [
    -Math.PI / 2,             // iit — top
    -Math.PI / 2 + Math.PI / 3.5,   // gnw
    Math.PI / 6,              // holographic
    Math.PI / 3,              // celestialHolography
    Math.PI / 2 + Math.PI / 6,      // predictive
    Math.PI + Math.PI / 12,   // relationalQm
    -Math.PI / 2 - Math.PI / 3.5,   // simHypothesis
  ];
  RING_ORDER.forEach((id, i) => {
    const a = angles[i];
    list.push({
      id,
      cx: CX + R * Math.cos(a),
      cy: CY + R * Math.sin(a),
    });
  });
  return list;
})();

// ─── Edges ─────────────────────────────────────────────────────────────────
const REL_STYLE = {
  provides_form:       { color: '#2563eb', dash: '',      icon: '△' },
  structural_parallel: { color: '#7c3aed', dash: '',      icon: '≈' },
  competes_with:       { color: '#dc2626', dash: '6 4',   icon: '⇄' },
  candidate_measure:   { color: '#0d9488', dash: '2 3',   icon: '⚖' },
  de_mystifies:        { color: '#0891b2', dash: '2 3',   icon: '⚙' },
  different_framing:   { color: '#6b7280', dash: '4 4',   icon: '⊕' },
  supports_side:       { color: '#059669', dash: '2 3',   icon: '↦' },
  extends_to_flat:     { color: '#7c3aed', dash: '',      icon: '⇢' },
};

const EDGES = [
  { from: 'holographic',        to: 'oph',                 rel: 'provides_form' },
  { from: 'celestialHolography',to: 'oph',                 rel: 'structural_parallel' },
  { from: 'holographic',        to: 'celestialHolography', rel: 'extends_to_flat' },
  { from: 'iit',                to: 'oph',                 rel: 'candidate_measure' },
  { from: 'gnw',                to: 'oph',                 rel: 'candidate_measure' },
  { from: 'iit',                to: 'gnw',                 rel: 'competes_with' },
  { from: 'relationalQm',       to: 'oph',                 rel: 'de_mystifies' },
  { from: 'simHypothesis',      to: 'oph',                 rel: 'different_framing' },
  { from: 'predictive',         to: 'oph',                 rel: 'supports_side' },
];

const nodePos = (id) => NODES.find(n => n.id === id);

// Shortest path segment between two nodes, so the line stops at the circle
// border and doesn't disappear under the node.
const edgeSegment = (a, b, pad = R_NODE + 4) => {
  const dx = b.cx - a.cx, dy = b.cy - a.cy;
  const d  = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return {
    x1: a.cx + ux * pad, y1: a.cy + uy * pad,
    x2: b.cx - ux * pad, y2: b.cy - uy * pad,
    mx: (a.cx + b.cx) / 2, my: (a.cy + b.cy) / 2,
  };
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function TheoryMap() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('oph');
  const [hoverEdge, setHoverEdge] = useState(null);

  // Read the theory's level from the same key theoryTour uses.
  const theoryLevel = (id) => {
    const raw = t(`selfSimReality.theoryTour.rows.${id}Level`, { defaultValue: '' });
    return raw || 'speculative';
  };

  const selNode = NODES.find(n => n.id === selected);

  return (
    <div style={{ ...panel }}>
      <h3 style={panelTitle}>🗺️ {t('selfSimReality.playground.map.title')}</h3>
      <p style={{ ...subtle, margin: '0 0 4px' }}>{t('selfSimReality.playground.map.subtitle')}</p>
      <p style={{ margin: '0 0 12px', fontSize: 11, color: '#94a3b8' }}>
        {t('selfSimReality.playground.map.instruction')}
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        {Object.keys(REL_STYLE).map(rel => (
          <span key={rel} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 600, color: REL_STYLE[rel].color,
            padding: '2px 8px', borderRadius: 999,
            border: `1px solid ${REL_STYLE[rel].color}33`,
            background: `${REL_STYLE[rel].color}0d`,
          }}>
            <span>{REL_STYLE[rel].icon}</span>
            {t(`selfSimReality.playground.map.relations.${rel}`)}
          </span>
        ))}
      </div>

      {/* SVG graph */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{
          background: 'radial-gradient(circle at 50% 50%, #faf5ff 0%, #f8fafc 65%)',
          borderRadius: 10, border: '1px solid #e2e8f0',
        }}>
          {/* Edges */}
          {EDGES.map((e, i) => {
            const a = nodePos(e.from), b = nodePos(e.to);
            const seg = edgeSegment(a, b);
            const style = REL_STYLE[e.rel];
            const isHover = hoverEdge === i;
            return (
              <g key={i}
                 onMouseEnter={() => setHoverEdge(i)}
                 onMouseLeave={() => setHoverEdge(null)}
                 style={{ cursor: 'help' }}>
                <line
                  x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                  stroke={style.color}
                  strokeWidth={isHover ? 3 : 1.8}
                  strokeDasharray={style.dash}
                  opacity={isHover ? 1 : 0.6}
                />
                {isHover && (
                  <g>
                    <rect
                      x={seg.mx - 62} y={seg.my - 10} width={124} height={20}
                      rx={4} ry={4}
                      fill="#1e293b" opacity={0.92}
                    />
                    <text
                      x={seg.mx} y={seg.my + 4}
                      textAnchor="middle"
                      fill="white" fontSize={10} fontWeight={600}
                    >
                      {t(`selfSimReality.playground.map.relations.${e.rel}`)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map(n => {
            const isSel = n.id === selected;
            const level = theoryLevel(n.id);
            const colors = LEVEL_COLORS[level] || LEVEL_COLORS.speculative;
            const r = n.isCenter ? R_NODE + 6 : R_NODE;
            return (
              <g key={n.id}
                 onClick={() => setSelected(n.id)}
                 style={{ cursor: 'pointer' }}>
                {isSel && (
                  <circle cx={n.cx} cy={n.cy} r={r + 8}
                          fill="none" stroke={colors.fg}
                          strokeWidth={2} opacity={0.35} />
                )}
                <circle
                  cx={n.cx} cy={n.cy} r={r}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isSel ? 3 : 2}
                />
                {/* Two lines of label — id-based short label from i18n */}
                <foreignObject x={n.cx - r} y={n.cy - 20} width={r * 2} height={40}>
                  <div style={{
                    height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', fontSize: 10, fontWeight: 700,
                    color: colors.fg, lineHeight: 1.2, padding: '0 6px',
                    boxSizing: 'border-box', userSelect: 'none',
                  }}>
                    {t(`selfSimReality.playground.map.nodes.${n.id}`)}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info panel for selected node */}
      {selNode && (
        <div style={{
          marginTop: 14, padding: '14px 16px',
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <strong style={{ fontSize: 14, color: '#1e293b' }}>
              {t(`selfSimReality.theoryTour.rows.${selected}Title`)}
            </strong>
            <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              {t(`selfSimReality.theoryTour.rows.${selected}Author`)}
            </span>
            <EpistemicBadge level={theoryLevel(selected)} />
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
            {t(`selfSimReality.theoryTour.rows.${selected}Body`)}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#6b21a8', fontStyle: 'italic', lineHeight: 1.45 }}>
            {t(`selfSimReality.theoryTour.rows.${selected}Link`)}
          </p>
        </div>
      )}
    </div>
  );
}
