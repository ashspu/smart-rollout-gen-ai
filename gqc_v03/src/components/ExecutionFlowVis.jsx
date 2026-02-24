import { useMemo } from 'react';

// Layout constants (adapted from DefinitionView)
const CELL_W = 140;
const R = 14;
const PHASE_H = 100;
const STEP_DROP = 8;
const LEFT = 60;
const TOP = 40;
const ROUTE_X = 22; // left channel for cross-phase curves

function computeNodes(flowDef) {
  if (!flowDef?.phases) return [];
  const nodes = [];
  let cumY = TOP;

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
        milestone: step.milestone,
        x: LEFT + si * CELL_W,
        y: cumY + si * STEP_DROP,
      });
    });
    const lastDrop = Math.max(steps.length - 1, 0) * STEP_DROP;
    cumY += lastDrop + PHASE_H;
  });
  return nodes;
}

function resolveState(node, execution) {
  const { stepResults, currentPhase, currentStep, status } = execution || {};
  const sr = (stepResults || []).find(
    r => r.phaseId === node.phaseId && r.stepId === node.stepId
  );
  if (sr) {
    return {
      state: sr.status === 'COMPLETED' ? 'completed' : 'failed',
      meters: sr.metersProcessed,
      conformance: sr.conformanceActual,
      duration: sr.durationMs,
    };
  }
  if (status === 'RUNNING' && currentPhase === node.phaseId && currentStep === node.stepId) {
    return { state: 'running', meters: null, conformance: null };
  }
  return { state: 'pending', meters: null, conformance: null };
}

function buildTrackSegments(nodes) {
  // returns array of { d, type } path strings
  const segs = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    if (a.phaseId === b.phaseId) {
      // same phase: straight tilted line
      segs.push({
        type: 'same',
        d: `M ${a.x + R + 4} ${a.y} L ${b.x - R - 4} ${b.y}`,
      });
    } else {
      // cross-phase: curved drop through left channel
      const exitY = a.y + R + 4;
      const entryY = b.y - R - 4;
      const cr = 14;
      const d = [
        `M ${a.x} ${exitY}`,
        `L ${a.x} ${exitY + 12}`,
        `Q ${a.x} ${exitY + 12 + cr} ${a.x - cr} ${exitY + 12 + cr}`,
        `L ${ROUTE_X + cr} ${exitY + 12 + cr}`,
        `Q ${ROUTE_X} ${exitY + 12 + cr} ${ROUTE_X} ${exitY + 12 + cr * 2}`,
        `L ${ROUTE_X} ${entryY - 12 - cr * 2}`,
        `Q ${ROUTE_X} ${entryY - 12 - cr} ${ROUTE_X + cr} ${entryY - 12 - cr}`,
        `L ${b.x - cr} ${entryY - 12 - cr}`,
        `Q ${b.x} ${entryY - 12 - cr} ${b.x} ${entryY - 12}`,
        `L ${b.x} ${entryY}`,
      ].join(' ');
      segs.push({ type: 'cross', d });
    }
  }
  return segs;
}

const STATE_COLORS = {
  completed: '#22c55e',
  failed: '#ef4444',
  running: '#06b6d4',
  pending: '#cbd5e1',
};

export default function ExecutionFlowVis({ flowDefinition, execution }) {
  const nodes = useMemo(() => computeNodes(flowDefinition), [flowDefinition]);

  const enriched = useMemo(
    () => nodes.map((n, i) => ({ ...n, idx: i, ...resolveState(n, execution) })),
    [nodes, execution]
  );

  const segments = useMemo(() => buildTrackSegments(nodes), [nodes]);

  // group by phase for backgrounds
  const phaseGroups = useMemo(() => {
    const groups = [];
    let cur = null;
    enriched.forEach(n => {
      if (!cur || cur.phaseId !== n.phaseId) {
        cur = { phaseId: n.phaseId, phaseName: n.phaseName, phaseColor: n.phaseColor, phaseLight: n.phaseLight, nodes: [] };
        groups.push(cur);
      }
      cur.nodes.push(n);
    });
    return groups;
  }, [enriched]);

  if (nodes.length === 0) return null;

  const maxX = Math.max(...nodes.map(n => n.x)) + CELL_W + 20;
  const maxY = Math.max(...nodes.map(n => n.y)) + 70;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-3 text-[10px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATE_COLORS.completed }} /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATE_COLORS.failed }} /> Failed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: STATE_COLORS.running }} /> Running
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-white" /> Pending
        </span>
      </div>

      <svg viewBox={`0 0 ${maxX} ${maxY}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ball-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
          </filter>
          <filter id="glow-cyan" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <style>{`
            @keyframes marble-drop {
              0% { opacity: 0; transform: translateY(-18px); }
              50% { opacity: 1; transform: translateY(3px); }
              70% { transform: translateY(-2px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes marble-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes ring-expand {
              0% { r: 16; opacity: 0.6; }
              100% { r: 26; opacity: 0; }
            }
            .marble-ball {
              animation: marble-drop 0.45s ease-out both;
            }
            .marble-running {
              animation: marble-pulse 1.2s ease-in-out infinite;
            }
            .glow-ring {
              animation: ring-expand 1.5s ease-out infinite;
            }
          `}</style>
        </defs>

        {/* Phase backgrounds */}
        {phaseGroups.map(pg => {
          const minX = Math.min(...pg.nodes.map(n => n.x)) - 28;
          const maxPX = Math.max(...pg.nodes.map(n => n.x)) + 28;
          const minY = Math.min(...pg.nodes.map(n => n.y)) - 24;
          const maxPY = Math.max(...pg.nodes.map(n => n.y)) + 34;
          return (
            <g key={pg.phaseId}>
              <rect
                x={minX} y={minY}
                width={maxPX - minX} height={maxPY - minY}
                rx={10} ry={10}
                fill={pg.phaseLight} stroke={pg.phaseColor} strokeWidth={1} strokeOpacity={0.25}
              />
              {/* Phase label */}
              <text
                x={minX + 6} y={minY - 6}
                fontSize="9" fontWeight="600" fill={pg.phaseColor}
                textAnchor="start" dominantBaseline="auto"
              >
                {pg.phaseName}
              </text>
            </g>
          );
        })}

        {/* Track path segments */}
        {segments.map((seg, i) => (
          <path key={i} d={seg.d} fill="none" stroke="#cbd5e1" strokeWidth={4}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        ))}

        {/* Direction arrows on same-phase segments */}
        {segments.filter(s => s.type === 'same').map((seg, i) => {
          // place arrow at midpoint of the line
          const a = nodes[i], b = nodes[i + 1];
          if (!a || !b || a.phaseId !== b.phaseId) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <path key={`arr-${i}`}
              d={`M ${mx - 5} ${my - 4} L ${mx + 3} ${my} L ${mx - 5} ${my + 4}`}
              fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            />
          );
        })}

        {/* Station waypoints + balls */}
        {enriched.map((node) => {
          const isPending = node.state === 'pending';
          const isRunning = node.state === 'running';
          const ballColor = STATE_COLORS[node.state];

          return (
            <g key={`${node.phaseId}-${node.stepId}`}>
              {/* Station circle */}
              <circle
                cx={node.x} cy={node.y} r={R}
                fill={isPending ? 'white' : '#f8fafc'}
                stroke={isPending ? '#cbd5e1' : node.phaseColor}
                strokeWidth={isPending ? 1 : 1.5}
                strokeDasharray={isPending ? '5,3' : 'none'}
                opacity={isPending ? 0.6 : 1}
              />

              {/* Running glow ring */}
              {isRunning && (
                <circle
                  cx={node.x} cy={node.y} r={16}
                  fill="none" stroke="#06b6d4" strokeWidth={2}
                  className="glow-ring"
                />
              )}

              {/* Ball */}
              {!isPending && (
                <circle
                  cx={node.x} cy={node.y}
                  r={isRunning ? 10 : 10}
                  fill={ballColor}
                  filter="url(#ball-shadow)"
                  className={isRunning ? 'marble-ball marble-running' : 'marble-ball'}
                  style={{ animationDelay: `${node.idx * 120}ms` }}
                />
              )}

              {/* Checkmark on completed */}
              {node.state === 'completed' && (
                <path
                  d={`M ${node.x - 4} ${node.y} L ${node.x - 1} ${node.y + 3} L ${node.x + 5} ${node.y - 3}`}
                  fill="none" stroke="white" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                  className="marble-ball"
                  style={{ animationDelay: `${node.idx * 120 + 200}ms` }}
                />
              )}

              {/* X mark on failed */}
              {node.state === 'failed' && (
                <g className="marble-ball" style={{ animationDelay: `${node.idx * 120 + 200}ms` }}>
                  <line x1={node.x - 3.5} y1={node.y - 3.5} x2={node.x + 3.5} y2={node.y + 3.5}
                    stroke="white" strokeWidth={2.5} strokeLinecap="round" />
                  <line x1={node.x + 3.5} y1={node.y - 3.5} x2={node.x - 3.5} y2={node.y + 3.5}
                    stroke="white" strokeWidth={2.5} strokeLinecap="round" />
                </g>
              )}

              {/* Step name label */}
              <text
                x={node.x} y={node.y + R + 14}
                textAnchor="middle" fontSize="9.5" fill="#475569" fontWeight="500"
              >
                {node.stepName}
              </text>

              {/* Meter count above ball */}
              {node.meters != null && node.meters > 0 && (
                <text
                  x={node.x} y={node.y - R - 6}
                  textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="600"
                  className="marble-ball"
                  style={{ animationDelay: `${node.idx * 120 + 300}ms` }}
                >
                  {node.meters.toLocaleString()}
                </text>
              )}

              {/* Conformance badge */}
              {node.conformance != null && (
                <g className="marble-ball" style={{ animationDelay: `${node.idx * 120 + 300}ms` }}>
                  <rect
                    x={node.x + R + 2} y={node.y - 7}
                    width={32} height={14} rx={7}
                    fill={node.conformance >= 95 ? '#dcfce7' : node.conformance >= 80 ? '#fef9c3' : '#fee2e2'}
                    stroke={node.conformance >= 95 ? '#86efac' : node.conformance >= 80 ? '#fde047' : '#fca5a5'}
                    strokeWidth={0.5}
                  />
                  <text
                    x={node.x + R + 18} y={node.y + 1}
                    textAnchor="middle" fontSize="8" fontWeight="600"
                    fill={node.conformance >= 95 ? '#166534' : node.conformance >= 80 ? '#854d0e' : '#991b1b'}
                  >
                    {node.conformance}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
