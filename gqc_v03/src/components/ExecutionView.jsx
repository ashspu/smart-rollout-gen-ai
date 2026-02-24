import { useState, useEffect } from 'react';
import ProcessMineModal from './ProcessMineModal';
import api from '../utils/apiClient';
import {
  AlertTriangle,
  Target,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  Truck,
  ArrowRight,
  Maximize2,
  GitBranch,
  Lightbulb,
  Loader2,
  Play
} from 'lucide-react';

// Demo program data
const demoPmData = {
  startDate: 'Mar 15, 2025',
  targetEnd: 'Dec 31, 2026',
  daysElapsed: 395,
  daysRemaining: 335,
  percentComplete: 25.4,
  onTrackForTarget: false,
  projectedEnd: 'Mar 2027',
  behindByDays: 62,
  thisWeek: { target: 8500, actual: 7200, variance: -15.3, exceptions: 340 },
  crews: 24,
  avgPerCrew: 42,
  topCrew: { name: 'Crew 7', completed: 68 },
  bottomCrew: { name: 'Crew 12', completed: 18 },
  processMineData: {
    stageWIP: { identify: 45200, schedule: 18400, notify: 12800, dispatch: 8900, install: 7600, commission: 4200, complete: 438000 },
    bottleneck: { stage: 'install', label: 'Bottleneck: 7.6K' },
    variants: {
      happy: { cases: 312400, pct: 72 },
      reschedule: { cases: 48200, pct: 11 },
      noAccess: { cases: 38600, pct: 9 },
      failedComm: { cases: 21800, pct: 5 },
      meterDefect: { cases: 13000, pct: 3 },
    }
  },
  blockers: [
    { id: 1, issue: 'No-Access Rate Spiking', impact: '1,840 meters stuck', trend: 'up', detail: 'Zone 4 showing 28% no-access vs 12% baseline', action: 'Pre-appointment letters sent, door hangers on retry' },
    { id: 2, issue: 'QC Validation Backlog', impact: '420 pending >48hrs', trend: 'stable', detail: 'AMI head-end sync delay causing validation queue', action: 'Engineering escalation in progress' },
    { id: 3, issue: 'Crew 12 Underperforming', impact: '-58% vs avg', trend: 'down', detail: 'New crew, training gaps on gas meter protocol', action: 'Paired with Crew 7 for mentoring this week' },
  ],
  weeklyTrend: [
    { week: 'W1', target: 8500, actual: 9200, cumTarget: 8500, cumActual: 9200 },
    { week: 'W2', target: 8500, actual: 8800, cumTarget: 17000, cumActual: 18000 },
    { week: 'W3', target: 8500, actual: 8400, cumTarget: 25500, cumActual: 26400 },
    { week: 'W4', target: 8500, actual: 6100, cumTarget: 34000, cumActual: 32500 },
    { week: 'W5', target: 8500, actual: 8200, cumTarget: 42500, cumActual: 40700 },
    { week: 'W6', target: 8500, actual: 5400, cumTarget: 51000, cumActual: 46100 },
    { week: 'W7', target: 8500, actual: 8600, cumTarget: 59500, cumActual: 54700 },
    { week: 'W8', target: 8500, actual: 6200, cumTarget: 68000, cumActual: 60900 },
    { week: 'W9', target: 8500, actual: 7100, cumTarget: 76500, cumActual: 68000 },
    { week: 'W10', target: 8500, actual: 8100, cumTarget: 85000, cumActual: 76100 },
    { week: 'W11', target: 8500, actual: 8400, cumTarget: 93500, cumActual: 84500 },
    { week: 'W12', target: 8500, actual: 7200, cumTarget: 102000, cumActual: 91700 },
  ],
};

const demoRecommendations = [
  { id: 1, action: 'Increase crew allocation in Zone 4', reason: 'No-access rate 28% vs 12% baseline — concentrated in 3 zip codes', priority: 'high' },
  { id: 2, action: 'Escalate QC validation backlog to engineering', reason: '420 meters pending >48hrs, AMI head-end sync causing delays', priority: 'high' },
  { id: 3, action: 'Pair Crew 12 with Crew 7 for field training', reason: 'Crew 12 at -58% vs average, training gaps on gas meter protocol', priority: 'medium' },
  { id: 4, action: 'Increase weekly target to 9,200 to recover schedule', reason: 'Currently 62 days behind plan, need 15% throughput increase for Q2', priority: 'medium' },
  { id: 5, action: 'Pre-send appointment confirmation SMS for Zone 4', reason: 'No-access rate correlates with missed appointment notifications', priority: 'low' },
];

const apiRecommendations = [
  { id: 1, action: 'Start first execution to begin collecting data', reason: 'No execution data available yet — run the flow to generate step-level analytics', priority: 'info' },
  { id: 2, action: 'Connect Celonis process mining feed', reason: 'Real-time conformance and bottleneck detection requires event data integration', priority: 'info' },
];

const priorityColors = {
  high: { border: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-600' },
  medium: { border: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-600' },
  low: { border: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-600' },
  info: { border: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-600' },
};

export default function ExecutionView({ programId, programData, isDemo }) {
  const [showProcessMine, setShowProcessMine] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [loadingExec, setLoadingExec] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    api.listExecutions(programId, 10)
      .then(r => setExecutions(r.executions || []))
      .catch(() => {})
      .finally(() => setLoadingExec(false));
  }, [programId, isDemo]);

  const StatusBadge = ({ positive, value }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value}
    </span>
  );

  const recommendations = isDemo ? demoRecommendations : apiRecommendations;
  const pmData = demoPmData;

  return (
    <div className="py-6 overflow-y-auto">
      {isDemo ? (
        <>
          {/* Demo: Full dashboard */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-slate-500">{programData?.utility || 'PECO Energy'} · Day {pmData.daysElapsed} of {pmData.daysElapsed + pmData.daysRemaining}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-800">{pmData.percentComplete}%</div>
              <div className="text-sm text-slate-500">complete</div>
            </div>
          </div>

          {/* PM Status Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Schedule</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">{pmData.behindByDays}</span>
                <span className="text-sm text-slate-500">days behind</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Projected: {pmData.projectedEnd}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">This Week</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800">{pmData.thisWeek.actual.toLocaleString()}</span>
                <StatusBadge positive={false} value={`${pmData.thisWeek.variance}%`} />
              </div>
              <p className="text-xs text-slate-400 mt-2">Target: {pmData.thisWeek.target.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Exceptions</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">{pmData.thisWeek.exceptions}</span>
                <span className="text-sm text-slate-500">this week</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">4.7% exception rate</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Crews Active</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800">{pmData.crews}</span>
                <span className="text-sm text-slate-500">@ {pmData.avgPerCrew}/day avg</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Range: {pmData.bottomCrew.completed} - {pmData.topCrew.completed}/day</p>
            </div>
          </div>

          {/* Customer Journey Map */}
          <button
            onClick={() => setShowProcessMine(true)}
            className="card p-6 mb-8 w-full text-left hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Customer Journey Map</h2>
                  <p className="text-sm text-slate-500">Identification → Deployment → Billing → First Bill</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                <span>Open</span>
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                {[
                  { name: 'Identify', color: '#64748b' },
                  { name: 'Engage', color: '#3b82f6' },
                  { name: 'Deploy', color: '#8b5cf6' },
                  { name: 'Activate', color: '#f59e0b' },
                  { name: 'Billing', color: '#22c55e' },
                  { name: 'First Bill', color: '#22c55e', milestone: true },
                ].map((phase, idx) => (
                  <div key={phase.name} className="flex items-center">
                    <div
                      className={`px-3 py-2 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        phase.milestone ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                        'bg-white text-slate-600 border border-slate-200'
                      }`}
                      style={!phase.milestone ? { borderLeftColor: phase.color, borderLeftWidth: 3 } : {}}
                    >
                      {phase.name}
                    </div>
                    {idx < 5 && <ArrowRight className="w-4 h-4 text-slate-300 mx-1" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>98.2% First Bill Success
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>4.5% Billing Issues
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>9.7% No Access
                </span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-xl font-bold text-green-600">55.8%</div><div className="text-xs text-slate-500">Happy Path</div></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-xl font-bold text-slate-700">45d</div><div className="text-xs text-slate-500">To First Bill</div></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-xl font-bold text-slate-700">22</div><div className="text-xs text-slate-500">Process Steps</div></div>
              <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-xl font-bold text-blue-600">94.2</div><div className="text-xs text-slate-500">CX Score</div></div>
              <div className="text-center p-3 bg-red-50 rounded-lg"><div className="text-xl font-bold text-red-600">72d</div><div className="text-xs text-slate-500">P90</div></div>
            </div>
          </button>

          <ProcessMineModal isOpen={showProcessMine} onClose={() => setShowProcessMine(false)} data={pmData.processMineData} />

          {/* Blockers */}
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800">Active Blockers</h2>
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{pmData.blockers.length} items</span>
            </div>
            <div className="space-y-4">
              {pmData.blockers.map((blocker) => (
                <div key={blocker.id} className="p-4 rounded-xl border-l-4 bg-slate-50"
                  style={{ borderLeftColor: blocker.trend === 'up' ? '#ef4444' : blocker.trend === 'down' ? '#22c55e' : '#f59e0b' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-800">{blocker.issue}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        blocker.trend === 'up' ? 'bg-red-100 text-red-600' :
                        blocker.trend === 'down' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {blocker.trend === 'up' ? '↑ Worsening' : blocker.trend === 'down' ? '↓ Improving' : '→ Stable'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{blocker.impact}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{blocker.detail}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600"><strong>Action:</strong> {blocker.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Progress Chart */}
          <div className="card p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Cumulative Progress vs Plan</h2>
              <p className="text-sm text-slate-500">Weekly trend showing deviation from target trajectory</p>
            </div>
            <div className="relative h-64">
              <svg viewBox="0 0 800 250" className="w-full h-full">
                {[0, 1, 2, 3, 4].map(i => (
                  <g key={i}>
                    <line x1="60" y1={50 + i * 45} x2="780" y2={50 + i * 45} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="50" y={55 + i * 45} textAnchor="end" fontSize="11" fill="#94a3b8">{(102 - i * 25)}K</text>
                  </g>
                ))}
                <path d={`M 60 230 ${pmData.weeklyTrend.map((w, i) => `L ${60 + (i + 1) * 60} ${230 - (w.cumTarget / 102000) * 180}`).join(' ')}`}
                  fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
                <path d={`M 60 230 ${pmData.weeklyTrend.map((w, i) => `L ${60 + (i + 1) * 60} ${230 - (w.cumActual / 102000) * 180}`).join(' ')}`}
                  fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d={`M 60 230 ${pmData.weeklyTrend.map((w, i) => `L ${60 + (i + 1) * 60} ${230 - (w.cumTarget / 102000) * 180}`).join(' ')} ${[...pmData.weeklyTrend].reverse().map((w, i) => `L ${60 + (12 - i) * 60} ${230 - (w.cumActual / 102000) * 180}`).join(' ')} Z`}
                  fill="rgba(239, 68, 68, 0.1)" />
                {pmData.weeklyTrend.map((w, i) => (
                  <text key={i} x={60 + (i + 1) * 60} y="248" textAnchor="middle" fontSize="10" fill="#94a3b8">{w.week}</text>
                ))}
                <circle cx={60 + 12 * 60} cy={230 - (91700 / 102000) * 180} r="6" fill="#3b82f6" />
                <g transform="translate(720, 100)">
                  <rect x="0" y="-12" width="60" height="24" rx="4" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1" />
                  <text x="30" y="4" textAnchor="middle" fontSize="11" fontWeight="600" fill="#ef4444">-10.3K</text>
                </g>
              </svg>
              <div className="absolute top-0 right-0 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-300" style={{ borderStyle: 'dashed' }}></span><span className="text-slate-500">Target</span></span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 rounded"></span><span className="text-slate-500">Actual</span></span>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-3 opacity-25 pointer-events-none">
                <img src="/smartutilities-logo.png" alt="" className="h-4 object-contain" />
                <img src="/celonis-logo.png" alt="" className="h-3 object-contain" />
                <img src="/aws-logo.svg" alt="" className="h-4 object-contain" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* API Program: Stub analytics + executions */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {['Schedule', 'This Week', 'Exceptions', 'Crews'].map(label => (
              <div key={label} className="card p-5">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{label}</div>
                <div className="text-2xl font-bold text-slate-300">--</div>
                <p className="text-xs text-slate-400 mt-2">Awaiting Celonis data</p>
              </div>
            ))}
          </div>

          {/* Executions */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Executions</h2>
              <button
                onClick={async () => {
                  try {
                    await api.executeFlow(programId);
                    const r = await api.listExecutions(programId, 10);
                    setExecutions(r.executions || []);
                  } catch { /* ignore */ }
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Run Execution
              </button>
            </div>
            {loadingExec ? (
              <div className="py-8 text-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
              </div>
            ) : executions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No executions yet. Click "Run Execution" to start.</p>
            ) : (
              <div className="space-y-3">
                {executions.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-slate-700 font-mono">{ex.executionId?.substring(0, 12)}...</div>
                      <div className="text-xs text-slate-500">{ex.startedAt || 'Unknown'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {ex.stepsCompleted != null && (
                        <span className="text-xs text-slate-500">{ex.stepsCompleted}/{ex.stepsTotal} steps</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ex.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                        ex.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' :
                        ex.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ex.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Recommended Next Steps (both demo and API) */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-semibold text-slate-800">Recommended Next Steps</h2>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const pc = priorityColors[rec.priority];
            return (
              <div key={rec.id} className="p-4 rounded-xl border-l-4 bg-slate-50" style={{ borderLeftColor: pc.border }}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{rec.action}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${pc.badge}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{rec.reason}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
