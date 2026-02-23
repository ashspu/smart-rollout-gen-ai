import { ChevronDown, Calendar, Users, Zap } from 'lucide-react';
import { pecoProgram } from '../data/pecoProgram';

export default function ProgramSelector() {
  return (
    <div className="glass-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Program Dropdown */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{pecoProgram.name}</p>
              <p className="text-xs text-slate-400">{pecoProgram.utility}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
          </button>
          
          {/* Program Type Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-platform-500/10 border border-platform-500/20 rounded-full">
            <span className="w-2 h-2 bg-platform-400 rounded-full" />
            <span className="text-xs font-medium text-platform-400">{pecoProgram.type}</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Day {pecoProgram.currentState.dayInProgram}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">
              {(pecoProgram.definition.targetPopulation.total / 1000000).toFixed(2)}M meters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
              <span className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
            </div>
            <span className="text-sm text-green-400 font-medium">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
