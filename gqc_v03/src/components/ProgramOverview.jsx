import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { pecoProgram } from '../data/pecoProgram';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { progressHistory } from '../data/pecoProgram';

export default function ProgramOverview() {
  const { currentState, definition } = pecoProgram;
  const { metrics, lifecycle } = currentState;
  
  const stats = [
    {
      label: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      subValue: `${lifecycle.complete.toLocaleString()} of ${definition.targetPopulation.total.toLocaleString()}`,
      trend: metrics.planVariance,
      icon: CheckCircle2,
      color: 'green',
    },
    {
      label: 'Plan Variance',
      value: `${metrics.planVariance}%`,
      subValue: metrics.planVariance < 0 ? 'Behind schedule' : 'Ahead of schedule',
      trend: metrics.planVariance,
      icon: metrics.planVariance < 0 ? TrendingDown : TrendingUp,
      color: metrics.planVariance < 0 ? 'amber' : 'green',
    },
    {
      label: 'First-Time Success',
      value: `${metrics.firstTimeSuccess}%`,
      subValue: 'Target: 95%',
      trend: metrics.firstTimeSuccess >= 95 ? 1 : -1,
      icon: CheckCircle2,
      color: metrics.firstTimeSuccess >= 95 ? 'green' : 'amber',
    },
    {
      label: 'Avg Cycle Time',
      value: `${metrics.avgCycleTime} days`,
      subValue: 'Target: 5 days',
      trend: 1,
      icon: Clock,
      color: 'green',
    },
    {
      label: 'Active Risks',
      value: pecoProgram.activeRisks.length,
      subValue: `${pecoProgram.activeRisks.filter(r => r.severity === 'high').length} high severity`,
      trend: -1,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: 'Unbilled Exposure',
      value: `$${(metrics.unbilledExposure / 1000000).toFixed(2)}M`,
      subValue: `${metrics.customersImpacted.toLocaleString()} customers`,
      trend: -1,
      icon: DollarSign,
      color: 'amber',
    },
  ];

  const colorClasses = {
    green: 'from-green-400 to-emerald-500 text-green-400 bg-green-500/10',
    amber: 'from-amber-400 to-orange-500 text-amber-400 bg-amber-500/10',
    red: 'from-red-400 to-rose-500 text-red-400 bg-red-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="glass-card p-4 hover:bg-white/[0.08] transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${colorClasses[stat.color].split(' ').slice(-1)}`}>
                <stat.icon className={`w-4 h-4 ${colorClasses[stat.color].split(' ')[2]}`} />
              </div>
              {stat.trend !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-1 group-hover:gradient-text transition-all">
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <p className="text-xs text-slate-500">{stat.subValue}</p>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Program Progress</h3>
            <p className="text-sm text-slate-400">Planned vs Actual completion over time</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-platform-400" />
              <span className="text-xs text-slate-400">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-slate-400">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" style={{ opacity: 0.5 }} />
              <span className="text-xs text-slate-400">Projected</span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}
                itemStyle={{ color: '#94a3b8', fontSize: 12 }}
                formatter={(value) => [value.toLocaleString() + ' meters', '']}
              />
              <Area 
                type="monotone" 
                dataKey="planned" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                fill="url(#plannedGradient)" 
                name="Planned"
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#actualGradient)" 
                name="Actual"
              />
              <Area 
                type="monotone" 
                dataKey="projected" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none" 
                name="Projected"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
