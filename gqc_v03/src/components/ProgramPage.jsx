import { useState, useEffect } from 'react';
import { programs as demoPrograms, amiProgram, demoFlowDefinitions } from '../data/programs';
import api from '../utils/apiClient';
import DefinitionView from './DefinitionView';
import ExecutionView from './ExecutionView';
import { GitBranch, Activity, Loader2 } from 'lucide-react';

export default function ProgramPage({ programId }) {
  const [activeTab, setActiveTab] = useState('definition');
  const [programData, setProgramData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDemoProgram = demoPrograms.some(p => p.id === programId);
  const demoInfo = demoPrograms.find(p => p.id === programId);

  useEffect(() => {
    if (isDemoProgram) {
      setProgramData({
        name: demoInfo?.name || 'Demo Program',
        utility: demoInfo?.utility || '',
        flowDefinition: demoFlowDefinitions[programId] || null,
        isDemo: true,
      });
      setLoading(false);
      return;
    }

    // API program — fetch full record
    setLoading(true);
    api.getProgram(programId)
      .then(data => setProgramData({ ...data, isDemo: false }))
      .catch(() => setProgramData({ programId, name: programId, isDemo: false }))
      .finally(() => setLoading(false));
  }, [programId, isDemoProgram, demoInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const programName = programData?.name || programId;
  const flowDefinition = programData?.flowDefinition || null;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header with program name + tabs */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <h1 className="text-xl font-semibold text-slate-800">{programName}</h1>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('definition')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'definition' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Definition
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'execution' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            Execution
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'definition' ? (
          <DefinitionView flowDefinition={flowDefinition} programName={programName} programId={programId} isDemo={isDemoProgram} />
        ) : (
          <div className="h-full overflow-y-auto px-6">
            <ExecutionView
              programId={programId}
              programData={programData}
              isDemo={isDemoProgram}
            />
          </div>
        )}
      </div>
    </div>
  );
}
