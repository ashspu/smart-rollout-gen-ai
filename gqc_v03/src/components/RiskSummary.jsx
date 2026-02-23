import { AlertTriangle, TrendingDown, MapPin, Lightbulb } from 'lucide-react';

const risks = [
  {
    id: 1,
    severity: 'high',
    title: 'Cohort B behind schedule',
    metric: '8% variance',
    impact: '27,400 meters at risk',
    action: 'Focus on Chester County sub-region',
  },
  {
    id: 2,
    severity: 'medium',
    title: 'Montgomery County access issues',
    metric: '12% no-access rate',
    impact: '3,200 reschedules needed',
    action: 'Customer outreach campaign',
  },
  {
    id: 3,
    severity: 'medium',
    title: 'Unbilled exposure rising',
    metric: '$2.84M current',
    impact: 'Threshold: $3.5M',
    action: 'Prioritize verification queue',
  },
];

const severityConfig = {
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-400',
    icon: 'text-red-400',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400',
    icon: 'text-amber-400',
  },
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400',
    icon: 'text-blue-400',
  },
};

export default function RiskSummary() {
  const highCount = risks.filter(r => r.severity === 'high').length;
  const mediumCount = risks.filter(r => r.severity === 'medium').length;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Active Risks</h3>
          <p className="text-sm text-slate-400">Requires attention</p>
        </div>
        <div className="flex items-center gap-2">
          {highCount > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
              {highCount} high
            </span>
          )}
          {mediumCount > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
              {mediumCount} medium
            </span>
          )}
        </div>
      </div>

      {/* Risk cards */}
      <div className="space-y-3">
        {risks.map((risk) => {
          const config = severityConfig[risk.severity];
          
          return (
            <div 
              key={risk.id}
              className={`p-4 rounded-xl ${config.bg} border ${config.border}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 ${config.icon} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-white">{risk.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${config.badge}`}>
                      {risk.severity}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span className="font-mono">{risk.metric}</span>
                    <span>·</span>
                    <span>{risk.impact}</span>
                  </div>
                  
                  {/* Recommended action */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <Lightbulb className="w-3 h-3 text-platform-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300">{risk.action}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regulator confidence statement */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 italic">
          "We know the exact state of the program, the risks we are carrying, and the mitigations in flight."
        </p>
      </div>
    </div>
  );
}
