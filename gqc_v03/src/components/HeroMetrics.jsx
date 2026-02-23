import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function HeroMetrics() {
  const metrics = [
    {
      label: 'Complete',
      value: '438K',
      subtext: 'of 1.72M meters',
      percent: 25.5,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      textColor: 'text-green-400',
    },
    {
      label: 'In Progress',
      value: '68.7K',
      subtext: 'active in lifecycle',
      percent: 4,
      icon: Clock,
      color: 'blue',
      bgColor: 'from-platform-500/20 to-blue-500/20',
      borderColor: 'border-platform-500/30',
      iconBg: 'bg-platform-500/20',
      textColor: 'text-platform-400',
    },
    {
      label: 'Needs Attention',
      value: '8.3K',
      subtext: 'exceptions & failures',
      percent: 0.5,
      icon: AlertTriangle,
      color: 'amber',
      bgColor: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      textColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric, idx) => (
        <div 
          key={idx}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${metric.bgColor} border ${metric.borderColor} p-6`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">{metric.label}</p>
              <p className="text-4xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-sm text-slate-500">{metric.subtext}</p>
            </div>
            <div className={`p-3 rounded-xl ${metric.iconBg}`}>
              <metric.icon className={`w-6 h-6 ${metric.textColor}`} />
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${metric.textColor.replace('text', 'bg')}`}
                style={{ width: `${Math.min(metric.percent * 4, 100)}%` }}
              />
            </div>
            <p className={`text-xs ${metric.textColor} mt-2`}>{metric.percent}% of program</p>
          </div>
        </div>
      ))}
    </div>
  );
}
