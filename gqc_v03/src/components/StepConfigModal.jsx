import { X, FileText, Globe, Webhook, ChevronLeft, History } from 'lucide-react';
import FormBuilderPanel from './FormBuilderPanel';
import ExternalApiConfigPanel from './ExternalApiConfigPanel';
import WebhookConfigPanel from './WebhookConfigPanel';
import VersionHistoryPanel from './VersionHistoryPanel';

const MODE_META = {
  form: { label: 'Create Form', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  'external-api': { label: 'External API Call', icon: Globe, color: 'text-amber-600', bg: 'bg-amber-50' },
  webhook: { label: 'Expose Webhook', icon: Webhook, color: 'text-green-600', bg: 'bg-green-50' },
  versions: { label: 'Version History', icon: History, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export default function StepConfigModal({ isOpen, onClose, step, phase, programId, mode, onConfigSaved, onRollback, flowDefinition, configHistory, currentConfig: parentConfig }) {
  if (!isOpen || !step || !phase) return null;

  const meta = MODE_META[mode] || MODE_META.form;
  const Icon = meta.icon;
  const existingConfig = parentConfig || null;

  const handleSave = (config) => {
    const fullConfig = {
      ...config,
      phaseId: phase.id,
      stepId: step.id,
      version: (existingConfig?.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    if (onConfigSaved) {
      onConfigSaved(phase.id, step.id, fullConfig);
    }
    onClose();
  };

  const handleRollback = (versionEntry) => {
    if (onRollback) {
      onRollback(phase.id, step.id, versionEntry);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg}`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{meta.label}</h2>
              <p className="text-xs text-slate-500">
                {phase.shortName || phase.name} &rarr; {step.name}
                {existingConfig && (
                  <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-medium">
                    v{existingConfig.version}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {mode === 'form' && (
            <FormBuilderPanel
              step={step}
              phase={phase}
              programId={programId}
              existingConfig={existingConfig}
              onSave={handleSave}
              flowDefinition={flowDefinition}
            />
          )}
          {mode === 'external-api' && (
            <ExternalApiConfigPanel
              step={step}
              phase={phase}
              programId={programId}
              onSave={handleSave}
            />
          )}
          {mode === 'webhook' && (
            <WebhookConfigPanel
              step={step}
              phase={phase}
              programId={programId}
              onSave={handleSave}
            />
          )}
          {mode === 'versions' && (
            <VersionHistoryPanel
              history={configHistory || []}
              currentConfig={parentConfig || existingConfig}
              onRollback={handleRollback}
            />
          )}
        </div>
      </div>
    </div>
  );
}
