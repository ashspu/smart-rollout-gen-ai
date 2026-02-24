import { useState, useEffect } from 'react';
import {
  X, Play, Copy, Check, AlertTriangle, Settings2, Zap,
  Database, MapPin, Shuffle, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

const PRESETS = {
  small:  { label: 'Small',  metersCount: 500,   durationDays: 30,  regionCount: 2, desc: '500 meters, 30 days, 2 regions' },
  medium: { label: 'Medium', metersCount: 5000,  durationDays: 90,  regionCount: 4, desc: '5K meters, 90 days, 4 regions' },
  large:  { label: 'Large',  metersCount: 50000, durationDays: 365, regionCount: 8, desc: '50K meters, 365 days, 8 regions' },
  custom: { label: 'Custom', metersCount: 1000,  durationDays: 60,  regionCount: 3, desc: 'Set your own parameters' },
};

const FAILURE_MODES = [
  { value: 'none', label: 'None (baseline)' },
  { value: 'no-access', label: 'No-Access bias' },
  { value: 'meter-defect', label: 'Meter Defect bias' },
  { value: 'comm-failure', label: 'Comm Failure bias' },
  { value: 'mixed', label: 'Mixed failures' },
];

export default function RunExecutionDialog({ isOpen, onClose, onSubmit, programId, flowDefinition }) {
  const [preset, setPreset] = useState('small');
  const [metersCount, setMetersCount] = useState(500);
  const [durationDays, setDurationDays] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [seed, setSeed] = useState('');
  const [regionCount, setRegionCount] = useState(2);
  const [failureModeBias, setFailureModeBias] = useState('none');
  const [includeDownstreamImpacts, setIncludeDownstreamImpacts] = useState(true);
  const [endpointMappingMode, setEndpointMappingMode] = useState('auto');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Generate rolloutInstanceId (read-only, generated on dialog open)
  const [rolloutInstanceId, setRolloutInstanceId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRolloutInstanceId(crypto.randomUUID());
      setError(null);
      setSubmitting(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Update params when preset changes
  useEffect(() => {
    if (preset !== 'custom') {
      const p = PRESETS[preset];
      setMetersCount(p.metersCount);
      setDurationDays(p.durationDays);
      setRegionCount(p.regionCount);
    }
  }, [preset]);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(rolloutInstanceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        programId,
        scenarioParams: {
          preset,
          metersCount,
          durationDays,
          startDate,
          seed: seed ? parseInt(seed, 10) : null,
          regionCount,
          failureModeBias,
          includeDownstreamImpacts,
          endpointMappingMode,
        },
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to start execution');
    } finally {
      setSubmitting(false);
    }
  };

  // Count steps from flowDefinition
  const stepCount = flowDefinition
    ? (flowDefinition.phases || []).reduce((sum, phase) => {
        return sum + (flowDefinition.steps?.[phase.id] || []).filter(s => s.enabled !== false).length;
      }, 0)
    : 0;
  const phaseCount = flowDefinition?.phases?.length || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Run Execution</h2>
              <p className="text-sm text-slate-500">Configure scenario parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* rolloutInstanceId — read-only with copy */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rollout Instance ID</label>
              <span className="text-[10px] text-slate-400 uppercase">Primary Case Key</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all">
                {rolloutInstanceId}
              </code>
              <button
                onClick={handleCopyId}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Preset Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Scenario Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    preset === key
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-sm font-semibold ${preset === key ? 'text-cyan-700' : 'text-slate-700'}`}>
                    {p.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Core Parameters */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Database className="w-3 h-3 inline mr-1" />Meters Count
              </label>
              <input
                type="number"
                value={metersCount}
                onChange={(e) => { setMetersCount(parseInt(e.target.value) || 0); setPreset('custom'); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                min="10"
                max="500000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duration (days)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => { setDurationDays(parseInt(e.target.value) || 0); setPreset('custom'); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                min="1"
                max="730"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />Regions
              </label>
              <input
                type="number"
                value={regionCount}
                onChange={(e) => { setRegionCount(parseInt(e.target.value) || 0); setPreset('custom'); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                min="1"
                max="20"
              />
            </div>
          </div>

          {/* Start Date & Failure Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <AlertTriangle className="w-3 h-3 inline mr-1" />Failure Mode Bias
              </label>
              <select
                value={failureModeBias}
                onChange={(e) => setFailureModeBias(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                {FAILURE_MODES.map(fm => (
                  <option key={fm.value} value={fm.value}>{fm.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border border-slate-200 rounded-xl">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Advanced Settings
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      <Shuffle className="w-3 h-3 inline mr-1" />Seed (optional)
                    </label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Random"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Set for reproducible runs</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      <Zap className="w-3 h-3 inline mr-1" />Endpoint Mapping
                    </label>
                    <select
                      value={endpointMappingMode}
                      onChange={(e) => setEndpointMappingMode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="auto">Auto (derive from step name)</option>
                      <option value="manual">Manual (custom mapping)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="downstream"
                    checked={includeDownstreamImpacts}
                    onChange={(e) => setIncludeDownstreamImpacts(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="downstream" className="text-sm text-slate-700">Include downstream impacts (billing, CX)</label>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Execution Preview</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-slate-500 text-xs">Flow</div>
                <div className="font-semibold text-slate-800">{phaseCount} phases, {stepCount} steps</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Synthetic Data</div>
                <div className="font-semibold text-slate-800">{metersCount.toLocaleString()} meters</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Datasets</div>
                <div className="font-semibold text-slate-800">6 tables to S3</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-[11px] text-slate-500 font-mono">
                s3://.../{programId?.substring(0, 8)}.../{rolloutInstanceId.substring(0, 8)}.../parquet/
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['executions', 'events', 'work_orders', 'billing_outcomes', 'customer_contacts', 'costs'].map(ds => (
                  <span key={ds} className="px-2 py-0.5 bg-white text-[10px] font-mono text-slate-600 rounded border border-slate-200">{ds}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || metersCount < 10}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Execution
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
