import { AlertTriangle, AlertCircle, Info, ChevronRight, Lightbulb } from 'lucide-react';
import { pecoProgram } from '../data/pecoProgram';

export default function RiskPanel() {
  const { activeRisks } = pecoProgram;

  const severityConfig = {
    high: {
      icon: AlertTriangle,
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400',
    },
    medium: {
      icon: AlertCircle,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
    },
    low: {
      icon: Info,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400',
    },
  };

  return (
    <div className="glass-card p-6 glow-red">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Active Risks</h3>
            <p className="text-sm text-slate-400">{activeRisks.length} items require attention</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeRisks.map((risk) => {
          const config = severityConfig[risk.severity];
          const Icon = config.icon;
          
          return (
            <div 
              key={risk.id}
              className={`p-4 rounded-xl ${config.bg} border ${config.border} hover:bg-white/5 transition-colors cursor-pointer group`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.text} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                      {risk.severity}
                    </span>
                    <span className="text-xs text-slate-500">{risk.type}</span>
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">{risk.title}</h4>
                  <p className="text-xs text-slate-400 mb-3">{risk.description}</p>
                  
                  {/* Recommendation */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                    <Lightbulb className="w-4 h-4 text-platform-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-300">{risk.recommendation}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500">
                      {risk.impactedMeters.toLocaleString()} meters impacted
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      <button className="w-full mt-4 py-2 text-sm font-medium text-platform-400 hover:text-platform-300 transition-colors">
        View all risks →
      </button>
    </div>
  );
}
