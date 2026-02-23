import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function ProcessFlow() {
  const stages = [
    { 
      name: 'Not Started', 
      count: 1205000, 
      color: 'slate',
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-400',
      dotColor: 'bg-slate-500',
    },
    { 
      name: 'Scheduled', 
      count: 48000, 
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      dotColor: 'bg-blue-500',
    },
    { 
      name: 'In Field', 
      count: 12500, 
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      dotColor: 'bg-purple-500',
    },
    { 
      name: 'Verifying', 
      count: 8200, 
      color: 'amber',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-500',
    },
    { 
      name: 'Complete', 
      count: 438000, 
      color: 'green',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      dotColor: 'bg-green-500',
    },
  ];

  const formatCount = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n;
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Lifecycle Flow</h3>
      
      {/* Flow visualization */}
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center flex-1">
            {/* Stage box */}
            <div className={`flex-1 p-4 rounded-xl ${stage.bgColor} border ${stage.borderColor} text-center`}>
              <div className={`w-3 h-3 rounded-full ${stage.dotColor} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-white">{formatCount(stage.count)}</p>
              <p className={`text-xs ${stage.textColor} mt-1`}>{stage.name}</p>
            </div>
            
            {/* Arrow */}
            {idx < stages.length - 1 && (
              <ArrowRight className="w-5 h-5 text-slate-600 mx-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Success rate callout */}
      <div className="mt-6 flex items-center justify-center gap-8 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm text-slate-400">First-time success:</span>
          <span className="text-lg font-bold text-green-400">94.2%</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-platform-400" />
          <span className="text-sm text-slate-400">Avg cycle time:</span>
          <span className="text-lg font-bold text-platform-400">4.2 days</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-slate-400">Exception rate:</span>
          <span className="text-lg font-bold text-red-400">1.9%</span>
        </div>
      </div>
    </div>
  );
}
