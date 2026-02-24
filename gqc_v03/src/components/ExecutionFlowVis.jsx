import { useMemo, useState } from 'react';

const CW = 144;   // cell width (3x wider lanes)
const R = 5;      // station dot radius
const BR = 10;    // ball radius (2x)
const PH = 56;    // phase height
const SD = 4;     // step tilt per step
const LM = 44;    // left margin
const TM = 24;    // top margin
const RX = 14;    // route channel x for cross-phase

function computeNodes(fd) {
  if (!fd?.phases) return [];
  const out = [];
  let cy = TM;
  fd.phases.forEach(ph => {
    const steps = (fd.steps[ph.id] || []).filter(s => s.enabled !== false);
    steps.forEach((st, si) => {
      out.push({
        pid: ph.id, pn: ph.shortName || ph.name,
        pc: ph.color || '#64748b', pl: ph.light || '#f8fafc',
        sid: st.id, sn: st.name,
        x: LM + si * CW, y: cy + si * SD,
      });
    });
    cy += Math.max(steps.length - 1, 0) * SD + PH;
  });
  return out;
}

function resolveState(n, ex) {
  const { stepResults, currentPhase, currentStep, status } = ex || {};
  const sr = (stepResults || []).find(r => r.phaseId === n.pid && r.stepId === n.sid);
  if (sr) return {
    st: sr.status === 'COMPLETED' ? 'done' : 'fail',
    m: sr.metersProcessed || 0, pct: sr.conformanceActual,
  };
  if (status === 'RUNNING' && (
    (currentPhase === n.pid && currentStep === n.sid) ||
    (currentPhase === n.pn && currentStep === n.sn)
  )) return { st: 'run', m: 0, pct: null };
  return { st: 'wait', m: 0, pct: null };
}

function buildSegments(nodes) {
  const segs = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    if (a.pid === b.pid) {
      segs.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    } else {
      const ey = a.y + R + 3, ny = b.y - R - 3, cr = 10;
      segs.push([
        `M ${a.x} ${ey}`, `L ${a.x} ${ey + 8}`,
        `Q ${a.x} ${ey + 8 + cr} ${a.x - cr} ${ey + 8 + cr}`,
        `L ${RX + cr} ${ey + 8 + cr}`,
        `Q ${RX} ${ey + 8 + cr} ${RX} ${ey + 8 + cr * 2}`,
        `L ${RX} ${ny - 8 - cr * 2}`,
        `Q ${RX} ${ny - 8 - cr} ${RX + cr} ${ny - 8 - cr}`,
        `L ${b.x - cr} ${ny - 8 - cr}`,
        `Q ${b.x} ${ny - 8 - cr} ${b.x} ${ny - 8}`,
        `L ${b.x} ${ny}`,
      ].join(' '));
    }
  }
  return segs;
}

const C = { done: '#22c55e', fail: '#ef4444', run: '#06b6d4', wait: '#cbd5e1' };

export default function ExecutionFlowVis({ flowDefinition, execution }) {
  const [showPct, setShowPct] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const nodes = useMemo(() => computeNodes(flowDefinition), [flowDefinition]);
  const segs = useMemo(() => buildSegments(nodes), [nodes]);

  const enriched = useMemo(() => {
    const raw = nodes.map((n, i) => ({ ...n, i, ...resolveState(n, execution) }));
    const mx = Math.max(1, ...raw.map(n => n.m || 0));
    return raw.map(n => ({ ...n, mr: (n.m || 0) / mx }));
  }, [nodes, execution]);

  const phases = useMemo(() => {
    const g = []; let c = null;
    enriched.forEach(n => {
      if (!c || c.pid !== n.pid) { c = { pid: n.pid, pn: n.pn, pc: n.pc, pl: n.pl, ns: [] }; g.push(c); }
      c.ns.push(n);
    });
    return g;
  }, [enriched]);

  if (!nodes.length) return null;

  const vw = Math.max(...nodes.map(n => n.x)) + CW + 10;
  const vh = Math.max(...nodes.map(n => n.y)) + 40;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-[9px] text-slate-400">
          {[['done','Completed'],['fail','Failed'],['run','Running'],['wait','Pending']].map(([k,l]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${k === 'wait' ? 'border border-slate-300' : ''} ${k === 'run' ? 'animate-pulse' : ''}`}
                style={k !== 'wait' ? { background: C[k] } : {}} />{l}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAnimKey(k => k + 1)}
            className="text-[9px] text-slate-400 hover:text-cyan-600 px-1.5 py-0.5 rounded border border-slate-200 hover:border-cyan-300 flex items-center gap-1"
            title="Replay animation">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4s2-3 7-3 7 4 7 7-3 7-7 7"/><path d="M1 1v3h3"/></svg>
            Replay
          </button>
          <button onClick={() => setShowPct(p => !p)}
            className="text-[9px] text-slate-400 hover:text-cyan-600 px-1.5 py-0.5 rounded border border-slate-200 hover:border-cyan-300">
            {showPct ? 'Counts' : '%'}
          </button>
        </div>
      </div>

      <svg key={animKey} viewBox={`0 0 ${vw} ${vh}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Track segment paths — referenced by animateMotion */}
          {segs.map((d, i) => <path key={`sp-${i}`} id={`seg-${i}`} d={d} fill="none" />)}
          {/* Glow filters */}
          {[0.15, 0.25, 0.4, 0.55, 0.7].map((v, i) => (
            <filter key={i} id={`gl${i}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={3 + v * 4} result="b" />
              <feFlood floodColor="#22c55e" floodOpacity={v * 0.4} result="c" />
              <feComposite in="c" in2="b" operator="in" result="g" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
          <filter id="glf" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feFlood floodColor="#ef4444" floodOpacity="0.3" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glr" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feFlood floodColor="#06b6d4" floodOpacity="0.4" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Layer 1: Phase backgrounds */}
        {phases.map(pg => {
          const xs = pg.ns.map(n => n.x), ys = pg.ns.map(n => n.y);
          return (
            <g key={pg.pid}>
              <rect x={Math.min(...xs) - 22} y={Math.min(...ys) - 18}
                width={Math.max(...xs) - Math.min(...xs) + 44} height={Math.max(...ys) - Math.min(...ys) + 36}
                rx={6} fill={pg.pl} stroke={pg.pc} strokeWidth={0.6} strokeOpacity={0.25} />
            </g>
          );
        })}

        {/* Layer 2: Visible track lines */}
        {segs.map((d, i) => (
          <path key={`t${i}`} d={d} fill="none" stroke="#e2e8f0" strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Layer 3: Station dots */}
        {enriched.map(n => (
          <circle key={`st-${n.pid}-${n.sid}`} cx={n.x} cy={n.y} r={R}
            fill={n.st === 'wait' ? '#f8fafc' : 'white'}
            stroke={n.st === 'wait' ? '#e2e8f0' : n.pc}
            strokeWidth={1}
            strokeDasharray={n.st === 'wait' ? '3,2' : 'none'}
            opacity={n.st === 'wait' ? 0.4 : 0.7} />
        ))}

        {/* Layer 4: Rolling balls — travel along track segments */}
        {enriched.map(n => {
          if (n.st === 'wait') return null;
          const opacity = n.st === 'done' ? 0.3 + n.mr * 0.7 : n.st === 'fail' ? 0.65 : 0.5;
          const gi = n.st === 'done' ? Math.min(4, Math.floor(n.mr * 5)) : 0;
          const filt = n.st === 'done' ? `url(#gl${gi})` : n.st === 'fail' ? 'url(#glf)' : 'url(#glr)';
          const delay = n.i * 0.12;
          const dur = n.i > 0 && n.pid !== nodes[n.i - 1]?.pid ? 0.5 : 0.3;
          const hasIncoming = n.i > 0;

          return (
            <g key={`ball-${n.pid}-${n.sid}`}>
              {/* Traveling ball — rolls along incoming segment */}
              {hasIncoming ? (
                <circle cx="0" cy="0" r={BR} fill={C[n.st]} opacity="0" filter={filt}>
                  <animateMotion dur={`${dur}s`} begin={`${delay}s`} fill="freeze"
                    calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1">
                    <mpath href={`#seg-${n.i - 1}`} />
                  </animateMotion>
                  <animate attributeName="opacity" from="0.15" to={opacity}
                    dur={`${dur}s`} begin={`${delay}s`} fill="freeze" />
                </circle>
              ) : (
                /* First node — ball drops from above */
                <circle cx={n.x} cy={n.y} r={BR} fill={C[n.st]} opacity="0" filter={filt}>
                  <animate attributeName="cy" from={n.y - 20} to={n.y}
                    dur="0.3s" begin={`${delay}s`} fill="freeze"
                    calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" />
                  <animate attributeName="opacity" from="0" to={opacity}
                    dur="0.3s" begin={`${delay}s`} fill="freeze" />
                </circle>
              )}

              {/* Running pulse ring */}
              {n.st === 'run' && (
                <circle cx={n.x} cy={n.y} r={BR} fill="none" stroke="#06b6d4" strokeWidth={1.5}>
                  <animate attributeName="r" values={`${BR};${BR + 8};${BR}`} dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* Layer 5 (top): Labels — always above everything */}
        {/* Phase labels */}
        {phases.map(pg => {
          const x1 = Math.min(...pg.ns.map(n => n.x)) - 18;
          const y1 = Math.min(...pg.ns.map(n => n.y)) - 14;
          return (
            <g key={`pl-${pg.pid}`}>
              <rect x={x1} y={y1 - 11} width={pg.pn.length * 6 + 10} height={11} rx={3}
                fill="white" fillOpacity="0.9" />
              <text x={x1 + 5} y={y1 - 3} fontSize="7.5" fontWeight="700" fill={pg.pc}
                letterSpacing="0.4">{pg.pn}</text>
            </g>
          );
        })}

        {/* Step name labels — in white badge background */}
        {enriched.map(n => {
          const tw = n.sn.length * 4.5 + 8;
          return (
            <g key={`lb-${n.pid}-${n.sid}`}>
              <rect x={n.x - tw / 2} y={n.y + R + 4} width={tw} height={11} rx={3}
                fill="white" fillOpacity="0.92" />
              <text x={n.x} y={n.y + R + 12.5} textAnchor="middle"
                fontSize="6.5" fill="#64748b" fontWeight="500">{n.sn}</text>
            </g>
          );
        })}

        {/* Count / % labels — in badge above each ball */}
        {enriched.map(n => {
          if (n.st === 'wait' || n.st === 'run') return null;
          const label = showPct && n.pct != null ? `${n.pct}%` : n.m > 0 ? n.m.toLocaleString() : null;
          if (!label) return null;
          const tw = label.length * 5 + 8;
          const delay = n.i * 0.12 + 0.25;
          return (
            <g key={`ct-${n.pid}-${n.sid}`} opacity="0">
              <animate attributeName="opacity" from="0" to="1"
                dur="0.2s" begin={`${delay}s`} fill="freeze" />
              <rect x={n.x - tw / 2} y={n.y - BR - 14} width={tw} height={11} rx={3.5}
                fill={n.st === 'fail' ? '#fef2f2' : '#f0fdf4'}
                stroke={n.st === 'fail' ? '#fca5a5' : '#bbf7d0'}
                strokeWidth={0.5} />
              <text x={n.x} y={n.y - BR - 6} textAnchor="middle"
                fontSize="6.5" fontWeight="700"
                fill={n.st === 'fail' ? '#dc2626' : '#166534'}>{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
