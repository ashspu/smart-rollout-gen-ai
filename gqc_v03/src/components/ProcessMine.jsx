import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function ProcessMine() {
  // Process stages with flow counts
  const stages = [
    { name: 'Not Started', count: 1205000, color: 'slate' },
    { name: 'Scheduled', count: 48000, color: 'blue' },
    { name: 'Field Work', count: 12500, color: 'purple' },
    { name: 'Verification', count: 8200, color: 'amber' },
    { name: 'Complete', count: 438000, color: 'green' },
  ];

  // Flow paths between stages (simplified process mine)
  const flows = [
    { from: 0, to: 1, count: 2400, status: 'normal', label: 'Scheduling' },
    { from: 1, to: 2, count: 1800, status: 'normal', label: 'Dispatch' },
    { from: 2, to: 3, count: 1650, status: 'normal', label: 'Install Done' },
    { from: 3, to: 4, count: 1580, status: 'normal', label: 'Verified' },
    // Exception paths
    { from: 2, to: 1, count: 150, status: 'exception', label: 'No Access' },
    { from: 3, to: 2, count: 70, status: 'exception', label: 'Failed Check' },
  ];

  // Recent events for the activity feed
  const events = [
    { type: 'success', text: '1423 Walnut St completed', time: '2m ago' },
    { type: 'success', text: '892 Main St completed', time: '3m ago' },
    { type: 'error', text: '234 Oak Ave - No access', time: '5m ago' },
    { type: 'success', text: '567 Pine Rd completed', time: '6m ago' },
    { type: 'success', text: '789 Elm St completed', time: '8m ago' },
    { type: 'warning', text: '321 Market St verifying', time: '9m ago' },
    { type: 'error', text: '456 Ridge Ave - Meter damage', time: '11m ago' },
    { type: 'success', text: '678 Cedar Ln completed', time: '12m ago' },
  ];

  const eventIcons = {
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  };

  const formatCount = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'K';
    return n;
  };

  return (
    <div className="space-y-6">
      {/* Process Flow Diagram */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900">Process Flow</h2>
          <p className="text-sm text-slate-500">How meters move through the program</p>
        </div>
        <div className="card-body">
          {/* Visual Process Mine */}
          <div className="relative">
            {/* Main flow - horizontal stages */}
            <div className="flex items-center justify-between">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex flex-col items-center" style={{ width: '18%' }}>
                  {/* Stage box */}
                  <div className={`
                    w-full p-4 rounded-xl text-center border-2 transition-all
                    ${stage.color === 'slate' ? 'bg-slate-50 border-slate-200' : ''}
                    ${stage.color === 'blue' ? 'bg-blue-50 border-blue-200' : ''}
                    ${stage.color === 'purple' ? 'bg-purple-50 border-purple-200' : ''}
                    ${stage.color === 'amber' ? 'bg-amber-50 border-amber-200' : ''}
                    ${stage.color === 'green' ? 'bg-green-50 border-green-200' : ''}
                  `}>
                    <p className={`
                      text-2xl font-bold
                      ${stage.color === 'slate' ? 'text-slate-600' : ''}
                      ${stage.color === 'blue' ? 'text-blue-600' : ''}
                      ${stage.color === 'purple' ? 'text-purple-600' : ''}
                      ${stage.color === 'amber' ? 'text-amber-600' : ''}
                      ${stage.color === 'green' ? 'text-green-600' : ''}
                    `}>
                      {formatCount(stage.count)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{stage.name}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Flow arrows - main path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)', height: '40px' }}>
              {/* Arrow between each stage */}
              {[0, 1, 2, 3].map((idx) => {
                const startX = 18 * (idx + 1) + 1;
                const endX = 18 * (idx + 1) + 8;
                return (
                  <g key={idx}>
                    <line 
                      x1={`${startX}%`} 
                      y1="50%" 
                      x2={`${endX}%`} 
                      y2="50%" 
                      stroke="#22c55e" 
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <polygon 
                      points={`${endX + 1},50 ${endX - 1},40 ${endX - 1},60`}
                      fill="#22c55e"
                      transform={`translate(${endX * 0.01 * 800}, 0)`}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Exception paths shown below */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">Exception Paths</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Field Work</span>
                    <span className="text-red-500">→</span>
                    <span className="text-sm text-slate-600">Scheduled</span>
                  </div>
                  <span className="ml-auto text-sm font-medium text-red-600">150 today</span>
                  <span className="text-xs text-slate-500">No Access</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Verification</span>
                    <span className="text-red-500">→</span>
                    <span className="text-sm text-slate-600">Field Work</span>
                  </div>
                  <span className="ml-auto text-sm font-medium text-red-600">70 today</span>
                  <span className="text-xs text-slate-500">Failed Check</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Live Activity</h2>
            <p className="text-sm text-slate-500">Real-time process events</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-slate-600">6 success</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-slate-600">2 exceptions</span>
            </span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map((event, idx) => {
            const config = eventIcons[event.type];
            const Icon = config.icon;
            return (
              <div key={idx} className="px-6 py-3 flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className="text-sm text-slate-700 flex-1">{event.text}</span>
                <span className="text-xs text-slate-400">{event.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simple Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Today's Progress</p>
            <p className="text-3xl font-bold text-slate-900">1,580 meters completed</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Success Rate</p>
            <p className="text-3xl font-bold text-green-600">94.2%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
