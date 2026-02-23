import { pecoProgram } from '../data/pecoProgram';
import { MapPin } from 'lucide-react';

export default function RegionalMap() {
  const { regions } = pecoProgram;

  const statusColors = {
    'on-track': 'bg-green-500',
    'at-risk': 'bg-amber-500',
    'ahead': 'bg-platform-500',
    'behind': 'bg-red-500',
  };

  const statusBg = {
    'on-track': 'bg-green-500/10 border-green-500/20',
    'at-risk': 'bg-amber-500/10 border-amber-500/20',
    'ahead': 'bg-platform-500/10 border-platform-500/20',
    'behind': 'bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Regional Status</h3>
          <p className="text-sm text-slate-400">Southeast Pennsylvania</p>
        </div>
        <MapPin className="w-5 h-5 text-slate-400" />
      </div>

      {/* Simplified Map Visualization */}
      <div className="relative h-40 mb-6 rounded-xl bg-slate-800/50 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#475569" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Region dots */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-[200px] max-h-[120px]">
            {/* Philadelphia - center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-8 h-8 rounded-full ${statusColors[regions[0].status]} opacity-60`} />
              <div className={`absolute inset-1 rounded-full ${statusColors[regions[0].status]}`} />
            </div>
            {/* Montgomery - top right */}
            <div className="absolute top-2 right-4">
              <div className={`w-6 h-6 rounded-full ${statusColors[regions[1].status]} opacity-60`} />
              <div className={`absolute inset-1 rounded-full ${statusColors[regions[1].status]}`} />
            </div>
            {/* Delaware - bottom left */}
            <div className="absolute bottom-4 left-8">
              <div className={`w-5 h-5 rounded-full ${statusColors[regions[2].status]} opacity-60`} />
              <div className={`absolute inset-1 rounded-full ${statusColors[regions[2].status]}`} />
            </div>
            {/* Chester - left */}
            <div className="absolute top-1/3 left-2">
              <div className={`w-5 h-5 rounded-full ${statusColors[regions[3].status]} opacity-60`} />
              <div className={`absolute inset-1 rounded-full ${statusColors[regions[3].status]}`} />
            </div>
            {/* Bucks - top */}
            <div className="absolute top-0 left-1/3">
              <div className={`w-4 h-4 rounded-full ${statusColors[regions[4].status]} opacity-60`} />
              <div className={`absolute inset-1 rounded-full ${statusColors[regions[4].status]}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Region List */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {regions.map((region, idx) => (
          <div 
            key={idx}
            className={`flex items-center justify-between p-3 rounded-lg border ${statusBg[region.status]} transition-colors cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${statusColors[region.status]}`} />
              <div>
                <p className="text-sm font-medium text-white">{region.name}</p>
                <p className="text-xs text-slate-500">
                  {region.complete.toLocaleString()} / {region.total.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{region.rate}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
