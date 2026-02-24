import { useMemo, useState } from 'react';

// Compact layout — fits inside execution card without scrolling
const CW = 90;        // cell width between steps
const R = 8;          // station circle radius
const BR = 11;        // ball radius (slightly larger than station)
const PH = 60;        // phase row height
const SD = 4;         // step drop (gravity tilt per step)
const LM = 44;        // left margin
const TM = 22;        // top margin
const RX = 12;        // route-x for cross-phase channel

function computeNodes(flowDef) {
  if (!flowDef?.phases) return [];
  const nodes = [];
  let cumY = TM;
  flowDef.phases.forEach((phase) => {
    const steps = (flowDef.steps[phase.id] || []).filter(s => s.enabled !== false);
    steps.forEach((step, si) => {
      nodes.push({
        phaseId: phase.id,
        phaseName: phase.shortName || phase.name,
        phaseColor: phase.color || '#64748b',
        phaseLight: phase.light || '#f8fafc',
        stepId: step.id,
        stepName: step.name,
        x: LM + si * CW,
        y: cumY + si * SD,
      });
    });
    cumY += Math.max(steps.length - 1, 0) * SD + PH;
  });
  return nodes;
}

function resolveState(node, execution) {
  const { stepResults, currentPhase, currentStep, status } = execution || {};
  const sr = (stepResults || []).find(r => r.phaseId === node.phaseId && r.stepId === node.stepId);
  if (sr) {
    return {
      state: sr.status === 'COMPLETED' ? 'completed' : 'failed',
      meters: sr.metersProcessed || 0,
      conformance: sr.conformanceActual,
    };
  }
  // match by name too (currentPhase is phaseName, not phaseId)
  const isRunning = status === 'RUNNING' && (
    (currentPhase === node.phaseId && currentStep === node.stepId) ||
    (currentPhase === node.phaseName && currentStep === node.stepName)
  );
  if (isRunning) return { state: 'running', meters: null, conformance: null };
  return { state: 'pending', meters: null, conformance: null };
}

function buildTrack(nodes) {
  const segs = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    if (a.phaseId === b.phaseId) {
      segs.push({ type: 'same', d: `M ${a.x + R + 3} ${a.y} L ${b.x - R - 3} ${b.y}` });
    } else {
      const ey = a.y + R + 3, ny = b.y - R - 3, cr = 8;
      segs.push({ type: 'cross', d: [
        `M ${a.x} ${ey}`, `L ${a.x} ${ey + 8}`,
        `Q ${a.x} ${ey + 8 + cr} ${a.x - cr} ${ey + 8 + cr}`,
        `L ${RX + cr} ${ey + 8 + cr}`,
        `Q ${RX} ${ey + 8 + cr} ${RX} ${ey + 8 + cr * 2}`,
        `L ${RX} ${ny - 8 - cr * 2}`,
        `Q ${RX} ${ny - 8 - cr} ${RX + cr} ${ny - 8 - cr}`,
        `L ${b.x - cr} ${ny - 8 - cr}`,
        `Q ${b.x} ${ny - 8 - cr} ${b.x} ${ny - 8}`,
        `L ${b.x} ${ny}`,
      ].join(' ') });
    }
  }
  return segs;
}

const COLORS = {
  completed: '#22c55e',
  failed: '#ef4444',
  running: '#06b6d4',
  pending: '#cbd5e1',
};

export default function ExecutionFlowVis({ flowDefinition, execution }) {
  const [showPct, setShowPct] = useState(false);
  const nodes = useMemo(() => computeNodes(flowDefinition), [flowDefinition]);

  // find max meters across steps for opacity scaling
  const enriched = useMemo(() => {
    const raw = nodes.map((n, i) => ({ ...n, idx: i, ...resolveState(n, execution) }));
    const maxM = Math.max(1, ...raw.map(n => n.meters || 0));
    return raw.map(n => ({ ...n, meterRatio: (n.meters || 0) / maxM }));
  }, [nodes, execution]);

  const segments = useMemo(() => buildTrack(nodes), [nodes]);

  const phaseGroups = useMemo(() => {
    const g = []; let c = null;
    enriched.forEach(n => {
      if (!c || c.phaseId !== n.phaseId) { c = { ...n, nodes: [] }; g.push(c); }
      c.nodes.push(n);
    });
    return g;
  }, [enriched]);

  if (!nodes.length) return null;

  const maxX = Math.max(...nodes.map(n => n.x)) + CW;
  const maxY = Math.max(...nodes.map(n => n.y)) + 42;

  return (
    <div>
      {/* Header row: legend + toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-[9px] text-slate-400 font-medium">
          {[['completed','Completed'],['failed','Failed'],['running','Running'],['pending','Pending']].map(([k,l]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${k === 'pending' ? 'border border-slate-300 bg-white' : ''} ${k === 'running' ? 'animate-pulse' : ''}`}
                style={k !== 'pending' ? { background: COLORS[k] } : {}} />
              {l}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowPct(p => !p)}
          className="text-[9px] font-medium text-slate-400 hover:text-cyan-600 transition-colors px-1.5 py-0.5 rounded border border-slate-200 hover:border-cyan-300"
        >
          {showPct ? 'Show Counts' : 'Show %'}
        </button>
      </div>

      <svg viewBox={`0 0 ${maxX} ${maxY}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ef-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodOpacity="0.15" />
          </filter>
          {/* Glow filters at different intensities */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((v, i) => (
            <filter key={i} id={`glow-${i}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation={2 + v * 3} result="b" />
              <feFlood floodColor="#22c55e" floodOpacity={v * 0.35} result="c" />
              <feComposite in="c" in2="b" operator="in" result="g" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
          <filter id="glow-fail" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feFlood floodColor="#ef4444" floodOpacity="0.3" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-run" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor="#06b6d4" floodOpacity="0.45" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Phase backgrounds */}
        {phaseGroups.map(pg => {
          const xs = pg.nodes.map(n => n.x), ys = pg.nodes.map(n => n.y);
          const x1 = Math.min(...xs) - 18, x2 = Math.max(...xs) + 18;
          const y1 = Math.min(...ys) - 16, y2 = Math.max(...ys) + 22;
          return (
            <g key={pg.phaseId}>
              <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={6}
                fill={pg.phaseLight} stroke={pg.phaseColor} strokeWidth={0.5} strokeOpacity={0.3} />
              <text x={x1 + 4} y={y1 - 3} fontSize="6" fontWeight="700" fill={pg.phaseColor}
                textAnchor="start" letterSpacing="0.5">{pg.phaseName}</text>
            </g>
          );
        })}

        {/* Track */}
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke="#e2e8f0" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Nodes */}
        {enriched.map((node) => {
          const { state, meters, conformance, meterRatio, idx } = node;
          const isPending = state === 'pending';
          const isRunning = state === 'running';
          const isFailed = state === 'failed';
          const isCompleted = state === 'completed';

          // Opacity: translucent base + proportion from meter ratio
          const ballOpacity = isCompleted ? 0.35 + meterRatio * 0.65
            : isFailed ? 0.7
            : isRunning ? 0.6
            : 0;
          // Glow intensity bucket (0-4) based on meter ratio
          const glowIdx = isCompleted ? Math.min(4, Math.floor(meterRatio * 5)) : 0;
          const filterAttr = isCompleted ? `url(#glow-${glowIdx})`
            : isFailed ? 'url(#glow-fail)'
            : isRunning ? 'url(#glow-run)'
            : 'url(#ef-shadow)';

          const label = showPct && conformance != null ? `${conformance}%`
            : meters != null && meters > 0 ? meters.toLocaleString()
            : null;

          return (
            <g key={`${node.phaseId}-${node.stepId}`}>
              {/* Station dot */}
              <circle cx={node.x} cy={node.y} r={R}
                fill={isPending ? '#f8fafc' : 'white'}
                stroke={isPending ? '#e2e8f0' : node.phaseColor}
                strokeWidth={isPending ? 0.75 : 1}
                strokeDasharray={isPending ? '3,2' : 'none'}
                opacity={isPending ? 0.5 : 0.8}
              />

              {/* Ball — translucent, opacity scales with meter count */}
              {!isPending && (
                <circle cx={node.x} cy={node.y} r={BR}
                  fill={COLORS[state]} opacity={ballOpacity}
                  filter={filterAttr}
                >
                  {/* Drop animation: ball falls into place */}
                  <animate attributeName="cy" from={node.y - 14} to={node.y}
                    dur="0.4s" begin={`${idx * 0.08}s`} fill="freeze"
                    calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" />
                  <animate attributeName="opacity" from="0" to={ballOpacity}
                    dur="0.35s" begin={`${idx * 0.08}s`} fill="freeze" />
                </circle>
              )}

              {/* Running pulse ring */}
              {isRunning && (
                <circle cx={node.x} cy={node.y} r={BR} fill="none" stroke="#06b6d4" strokeWidth={1.5}>
                  <animate attributeName="r" values={`${BR};${BR + 8};${BR}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Step name */}
              <text x={node.x} y={node.y + R + 10} textAnchor="middle"
                fontSize="6" fill="#64748b" fontWeight="500">{node.stepName}</text>

              {/* Count or % label above */}
              {label && (
                <text x={node.x} y={node.y - BR - 3} textAnchor="middle"
                  fontSize="6.5" fill={isFailed ? '#dc2626' : '#374151'} fontWeight="600">
                  <animate attributeName="opacity" from="0" to="1"
                    dur="0.25s" begin={`${idx * 0.08 + 0.2}s`} fill="freeze" />
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
