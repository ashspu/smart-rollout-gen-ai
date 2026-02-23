import { TrendingUp, Shield, Users, Wrench, CheckCircle2 } from 'lucide-react';
import { pecoProgram } from '../data/pecoProgram';

export default function BenefitsPanel() {
  const { benefits } = pecoProgram;
  
  const benefitItems = [
    {
      label: 'Failures Avoided',
      planned: benefits.planned.failuresAvoided,
      realized: benefits.realized.failuresAvoided,
      projected: benefits.projected.failuresAvoided,
      icon: Shield,
      format: (v) => v.toLocaleString(),
    },
    {
      label: 'Revenue Protected',
      planned: benefits.planned.unbilledRevenueProtected,
      realized: benefits.realized.unbilledRevenueProtected,
      projected: benefits.projected.unbilledRevenueProtected,
      icon: TrendingUp,
      format: (v) => `$${(v / 1000000).toFixed(1)}M`,
    },
    {
      label: 'Complaints Avoided',
      planned: benefits.planned.customerComplaintsAvoided,
      realized: benefits.realized.customerComplaintsAvoided,
      projected: benefits.projected.customerComplaintsAvoided,
      icon: Users,
      format: (v) => v.toLocaleString(),
    },
    {
      label: 'Emergency Dispatches Saved',
      planned: benefits.planned.emergencyDispatchesAvoided,
      realized: benefits.realized.emergencyDispatchesAvoided,
      projected: benefits.projected.emergencyDispatchesAvoided,
      icon: Wrench,
      format: (v) => v.toLocaleString(),
    },
  ];

  return (
    <div className="glass-card p-6 glow-green">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Benefits Realization</h3>
            <p className="text-sm text-slate-400">Value delivered vs business case</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {benefitItems.map((item, idx) => {
          const realizedPercent = (item.realized / item.planned) * 100;
          const projectedPercent = (item.projected / item.planned) * 100;
          const Icon = item.icon;
          
          return (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.format(item.realized)}</span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                {/* Projected */}
                <div 
                  className="absolute inset-y-0 left-0 bg-green-500/30 rounded-full"
                  style={{ width: `${Math.min(projectedPercent, 100)}%` }}
                />
                {/* Realized */}
                <div 
                  className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${realizedPercent}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {realizedPercent.toFixed(0)}% of target
                </span>
                <span className="text-xs text-slate-500">
                  Target: {item.format(item.planned)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Projected Benefits Capture</p>
            <p className="text-2xl font-bold text-green-400">
              {((benefits.projected.unbilledRevenueProtected / benefits.planned.unbilledRevenueProtected) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">vs business case</p>
            <p className="text-lg font-semibold text-white">
              ${(benefits.projected.unbilledRevenueProtected / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
