import { useMemo, useState, useRef, useCallback, useEffect } from 'react';

const CW = 144;   // cell width (3x wider lanes)
const R = 4;      // station dot radius
const BR = 6;     // ball radius (60% of 10)
const PH = 70;    // phase height — increased for label breathing room
const SD = 6;     // step tilt per step — slightly more for vertical spread
const LM = 60;    // left margin — more room for phase labels
const TM = 32;    // top margin — room for first count badge
const RX = 18;    // route channel x for cross-phase

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
      // Same phase: straight line between centers
      segs.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    } else {
      // Cross-phase: route down through left channel
      const ey = a.y + R + 4;   // exit below station a
      const ny = b.y - R - 4;   // enter above station b
      const cr = 12;             // curve radius
      segs.push([
        `M ${a.x} ${ey}`,
        `L ${a.x} ${ey + 10}`,
        `Q ${a.x} ${ey + 10 + cr} ${a.x - cr} ${ey + 10 + cr}`,
        `L ${RX + cr} ${ey + 10 + cr}`,
        `Q ${RX} ${ey + 10 + cr} ${RX} ${ey + 10 + cr * 2}`,
        `L ${RX} ${ny - 10 - cr * 2}`,
        `Q ${RX} ${ny - 10 - cr} ${RX + cr} ${ny - 10 - cr}`,
        `L ${b.x - cr} ${ny - 10 - cr}`,
        `Q ${b.x} ${ny - 10 - cr} ${b.x} ${ny - 10}`,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
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

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      setAnimKey(k => k + 1); // replay on enter
    } else {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // ESC to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  if (!nodes.length) return null;

  const vw = Math.max(...nodes.map(n => n.x)) + CW + 20;
  const vh = Math.max(...nodes.map(n => n.y)) + 50;

  // Animation speed multiplier (0.5x = 2x duration)
  const spd = 2; // multiply all durations by this for 0.5x speed

  const svgContent = (
    <svg key={animKey} viewBox={`0 0 ${vw} ${vh}`}
      className={isFullscreen ? 'w-full h-full' : 'w-full'}
      preserveAspectRatio="xMidYMid meet"
      style={isFullscreen ? { background: 'white' } : undefined}>
      <defs>
        {/* Track segment paths — referenced by animateMotion */}
        {segs.map((d, i) => <path key={`sp-${i}`} id={`seg-${animKey}-${i}`} d={d} fill="none" />)}
        {/* Glow filters */}
        {[0.15, 0.25, 0.4, 0.55, 0.7].map((v, i) => (
          <filter key={i} id={`gl${animKey}-${i}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={2 + v * 3} result="b" />
            <feFlood floodColor="#22c55e" floodOpacity={v * 0.4} result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        <filter id={`glf${animKey}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feFlood floodColor="#ef4444" floodOpacity="0.3" result="c" />
          <feComposite in="c" in2="b" operator="in" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`glr${animKey}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
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
            <rect x={Math.min(...xs) - 28} y={Math.min(...ys) - 22}
              width={Math.max(...xs) - Math.min(...xs) + 56} height={Math.max(...ys) - Math.min(...ys) + 44}
              rx={6} fill={pg.pl} stroke={pg.pc} strokeWidth={0.6} strokeOpacity={0.25} />
          </g>
        );
      })}

      {/* Layer 2: Visible track lines */}
      {segs.map((d, i) => (
        <path key={`t${i}`} d={d} fill="none" stroke="#e2e8f0" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* Layer 3: Station dots */}
      {enriched.map(n => (
        <circle key={`st-${n.pid}-${n.sid}`} cx={n.x} cy={n.y} r={R}
          fill={n.st === 'wait' ? '#f8fafc' : 'white'}
          stroke={n.st === 'wait' ? '#e2e8f0' : n.pc}
          strokeWidth={0.8}
          strokeDasharray={n.st === 'wait' ? '2.5,1.5' : 'none'}
          opacity={n.st === 'wait' ? 0.4 : 0.7} />
      ))}

      {/* Layer 4: Rolling balls — travel along track segments */}
      {enriched.map(n => {
        if (n.st === 'wait') return null;
        const opacity = n.st === 'done' ? 0.3 + n.mr * 0.7 : n.st === 'fail' ? 0.65 : 0.5;
        const gi = n.st === 'done' ? Math.min(4, Math.floor(n.mr * 5)) : 0;
        const filt = n.st === 'done' ? `url(#gl${animKey}-${gi})` : n.st === 'fail' ? `url(#glf${animKey})` : `url(#glr${animKey})`;
        const delay = n.i * 0.24 * spd;  // 0.12 * spd
        const dur = (n.i > 0 && n.pid !== nodes[n.i - 1]?.pid ? 0.5 : 0.3) * spd;
        const hasIncoming = n.i > 0;

        return (
          <g key={`ball-${n.pid}-${n.sid}`}>
            {/* Traveling ball — rolls along incoming segment */}
            {hasIncoming ? (
              <circle cx="0" cy="0" r={BR} fill={C[n.st]} opacity="0" filter={filt}>
                <animateMotion dur={`${dur}s`} begin={`${delay}s`} fill="freeze"
                  calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1">
                  <mpath href={`#seg-${animKey}-${n.i - 1}`} />
                </animateMotion>
                <animate attributeName="opacity" from="0.15" to={opacity}
                  dur={`${dur}s`} begin={`${delay}s`} fill="freeze" />
              </circle>
            ) : (
              /* First node — ball drops from above */
              <circle cx={n.x} cy={n.y} r={BR} fill={C[n.st]} opacity="0" filter={filt}>
                <animate attributeName="cy" from={n.y - 20} to={n.y}
                  dur={`${0.3 * spd}s`} begin={`${delay}s`} fill="freeze"
                  calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" />
                <animate attributeName="opacity" from="0" to={opacity}
                  dur={`${0.3 * spd}s`} begin={`${delay}s`} fill="freeze" />
              </circle>
            )}

            {/* Running pulse ring */}
            {n.st === 'run' && (
              <circle cx={n.x} cy={n.y} r={BR} fill="none" stroke="#06b6d4" strokeWidth={1}>
                <animate attributeName="r" values={`${BR};${BR + 6};${BR}`} dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.4s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Layer 5 (top): Labels — always above everything */}
      {/* Phase labels — positioned top-left of phase, outside the ball area */}
      {phases.map(pg => {
        const x1 = Math.min(...pg.ns.map(n => n.x)) - 24;
        const y1 = Math.min(...pg.ns.map(n => n.y)) - 18;
        return (
          <g key={`pl-${pg.pid}`}>
            <rect x={x1} y={y1 - 10} width={pg.pn.length * 5.5 + 8} height={10} rx={3}
              fill="white" fillOpacity="0.92" />
            <text x={x1 + 4} y={y1 - 2.5} fontSize="7" fontWeight="700" fill={pg.pc}
              letterSpacing="0.3">{pg.pn}</text>
          </g>
        );
      })}

      {/* Step name labels — below station, with clearance from ball */}
      {enriched.map(n => {
        const tw = n.sn.length * 4.2 + 8;
        const ly = n.y + BR + 8; // below ball bottom with gap
        return (
          <g key={`lb-${n.pid}-${n.sid}`}>
            <rect x={n.x - tw / 2} y={ly} width={tw} height={10} rx={3}
              fill="white" fillOpacity="0.92" />
            <text x={n.x} y={ly + 7.5} textAnchor="middle"
              fontSize="6" fill="#64748b" fontWeight="500">{n.sn}</text>
          </g>
        );
      })}

      {/* Count / % labels — above each ball with clearance */}
      {enriched.map(n => {
        if (n.st === 'wait' || n.st === 'run') return null;
        const label = showPct && n.pct != null ? `${n.pct}%` : n.m > 0 ? n.m.toLocaleString() : null;
        if (!label) return null;
        const tw = label.length * 4.5 + 7;
        const delay = n.i * 0.24 * spd + 0.25 * spd;
        const ly = n.y - BR - 12; // above ball top with gap
        return (
          <g key={`ct-${n.pid}-${n.sid}`} opacity="0">
            <animate attributeName="opacity" from="0" to="1"
              dur={`${0.2 * spd}s`} begin={`${delay}s`} fill="freeze" />
            <rect x={n.x - tw / 2} y={ly} width={tw} height={10} rx={3}
              fill={n.st === 'fail' ? '#fef2f2' : '#f0fdf4'}
              stroke={n.st === 'fail' ? '#fca5a5' : '#bbf7d0'}
              strokeWidth={0.4} />
            <text x={n.x} y={ly + 7.5} textAnchor="middle"
              fontSize="6" fontWeight="700"
              fill={n.st === 'fail' ? '#dc2626' : '#166534'}>{label}</text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <div ref={containerRef}>
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
          <button onClick={toggleFullscreen}
            className="text-[9px] text-slate-400 hover:text-cyan-600 px-1.5 py-0.5 rounded border border-slate-200 hover:border-cyan-300 flex items-center gap-1"
            title="Fullscreen replay">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 6V2h4"/><path d="M10 2h4v4"/><path d="M14 10v4h-4"/><path d="M6 14H2v-4"/>
            </svg>
            Fullscreen
          </button>
          <button onClick={() => setShowPct(p => !p)}
            className="text-[9px] text-slate-400 hover:text-cyan-600 px-1.5 py-0.5 rounded border border-slate-200 hover:border-cyan-300">
            {showPct ? 'Counts' : '%'}
          </button>
        </div>
      </div>

      {svgContent}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {[['done','Completed'],['fail','Failed'],['run','Running'],['wait','Pending']].map(([k,l]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${k === 'wait' ? 'border border-slate-300' : ''} ${k === 'run' ? 'animate-pulse' : ''}`}
                    style={k !== 'wait' ? { background: C[k] } : {}} />{l}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setAnimKey(k => k + 1)}
                className="text-xs text-slate-500 hover:text-cyan-600 px-2 py-1 rounded border border-slate-200 hover:border-cyan-300 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4s2-3 7-3 7 4 7 7-3 7-7 7"/><path d="M1 1v3h3"/></svg>
                Replay
              </button>
              <button onClick={() => setShowPct(p => !p)}
                className="text-xs text-slate-500 hover:text-cyan-600 px-2 py-1 rounded border border-slate-200 hover:border-cyan-300">
                {showPct ? 'Counts' : '%'}
              </button>
              <button onClick={() => setIsFullscreen(false)}
                className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded border border-slate-200 hover:border-red-300 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 2v4H0"/><path d="M12 2v4h4"/><path d="M12 14v-4h4"/><path d="M4 14v-4H0"/>
                </svg>
                Close (Esc)
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {svgContent}
          </div>
        </div>
      )}
    </div>
  );
}
