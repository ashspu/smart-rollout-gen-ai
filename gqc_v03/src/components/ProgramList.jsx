import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Zap, TestTube, FileCheck, CheckCircle2, AlertCircle, Clock, Plus, Sparkles } from 'lucide-react';
import { programs as demoPrograms } from '../data/programs';
import FlowBuilderModal from './FlowBuilderModal';
import api from '../utils/apiClient';

const typeIcons = {
  'AMI Rollout': Zap,
  'Test Cycle': TestTube,
  'Regulatory': FileCheck,
};

const typeColors = {
  'AMI Rollout': { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', shadow: 'rgba(6, 182, 212, 0.3)' },
  'Test Cycle': { bg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', shadow: 'rgba(168, 85, 247, 0.3)' },
  'Regulatory': { bg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', shadow: 'rgba(236, 72, 153, 0.3)' },
};

const healthConfig = {
  'on-track': { color: '#10b981', label: 'On Track', icon: CheckCircle2 },
  'at-risk': { color: '#f59e0b', label: 'At Risk', icon: AlertCircle },
  'not-started': { color: '#94a3b8', label: 'Planned', icon: Clock },
};

export default function ProgramList({ onSelect }) {
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);
  const [apiPrograms, setApiPrograms] = useState([]);

  const fetchPrograms = useCallback(async () => {
    if (!api.isConfigured()) return;
    try {
      const result = await api.listPrograms();
      setApiPrograms(result.programs || []);
    } catch {
      // API unavailable — just show demo data
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  // Merge demo programs with API-created programs
  const programs = [
    ...demoPrograms,
    ...apiPrograms.map(p => ({
      id: p.programId,
      name: p.name,
      utility: p.description || 'Custom Program',
      type: 'AMI Rollout',
      status: p.status || 'active',
      meters: 0,
      complete: 0,
      health: p.status === 'active' ? 'on-track' : 'not-started',
      isApi: true,
    })),
  ];

  const handleProgramCreated = () => {
    fetchPrograms();
  };

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n;
  };

  return (
    <div className="py-4">
      {/* Page title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold tracking-tight steel-text mb-3">
          Meter Programs
        </h1>
        <p className="text-lg text-slate-500 font-light">
          Select a program to view process intelligence
        </p>
      </div>

      {/* Create New Program Button */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={() => setShowFlowBuilder(true)}
          className="w-full p-5 border-2 border-dashed border-cyan-300/60 rounded-2xl text-left hover:border-pink-400 hover:bg-white/60 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Create New Meter Program
                <Sparkles className="w-4 h-4 text-pink-500" />
              </h3>
              <p className="text-sm text-slate-500">Pick a template, define your flow, and generate AWS + Celonis integration</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Program cards */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {programs.map((program) => {
          const Icon = typeIcons[program.type] || Zap;
          const colors = typeColors[program.type];
          const health = healthConfig[program.health];
          const HealthIcon = health.icon;
          const progress = program.meters > 0 ? (program.complete / program.meters) * 100 : 0;

          return (
            <button
              key={program.id}
              onClick={() => onSelect(program.id)}
              className="card w-full text-left p-6 transition-all duration-300 hover:scale-[1.01] group"
            >
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    background: colors.bg,
                    boxShadow: `0 4px 14px ${colors.shadow}`
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-semibold tracking-tight steel-text">{program.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{program.utility}</p>
                  
                  {/* Progress section */}
                  <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    <div className="flex-1">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${progress}%`,
                            background: colors.bg
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-slate-700">{formatNumber(program.complete)}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-500">{formatNumber(program.meters)}</span>
                    </div>

                    {/* Health indicator */}
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${health.color}15` }}
                    >
                      <HealthIcon className="w-3.5 h-3.5" style={{ color: health.color }} />
                      <span className="text-xs font-medium" style={{ color: health.color }}>
                        {health.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Platform description */}
      <div className="max-w-2xl mx-auto mt-16">
        <div className="text-center">
          <p className="text-sm text-slate-400 leading-relaxed">
            Smart Rollout combines orchestration with process mining<br />
            to deliver real-time visibility into utility meter programs.
          </p>
        </div>
      </div>

      {/* Flow Builder Modal */}
      <FlowBuilderModal
        isOpen={showFlowBuilder}
        onClose={() => setShowFlowBuilder(false)}
        onProgramCreated={handleProgramCreated}
      />
    </div>
  );
}
