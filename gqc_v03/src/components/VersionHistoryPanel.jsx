import { Clock, RotateCcw, CheckCircle, FileText, Globe, Webhook } from 'lucide-react';

const TYPE_META = {
  form: { label: 'Form', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  'external-api': { label: 'API Call', icon: Globe, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  webhook: { label: 'Webhook', icon: Webhook, color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
};

export default function VersionHistoryPanel({ history, currentConfig, onRollback }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No version history yet. Save a configuration to create the first version.
      </div>
    );
  }

  const sorted = [...history].reverse(); // newest first

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{history.length}</span> version{history.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-6 bottom-6 w-px bg-slate-200" />

          <div className="space-y-4">
            {sorted.map((entry, idx) => {
              const isCurrent = entry.version === currentConfig?.version;
              const meta = TYPE_META[entry.configType] || TYPE_META.form;
              const Icon = meta.icon;
              const ts = entry.savedAt || entry.updatedAt;
              const date = ts ? new Date(ts) : null;

              return (
                <div key={entry.version} className="relative flex items-start gap-4 pl-9">
                  {/* Timeline dot */}
                  <div className={`absolute left-[9px] top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    isCurrent ? meta.dot : 'bg-slate-300'
                  }`} />

                  <div className={`flex-1 rounded-lg border p-4 transition-colors ${
                    isCurrent ? 'border-purple-200 bg-purple-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isCurrent ? 'text-purple-700' : 'text-slate-700'}`}>
                          v{entry.version}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                            <CheckCircle className="w-2.5 h-2.5" /> Current
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {meta.label}
                        </span>
                      </div>
                      {date && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Config summary */}
                    {entry.configType === 'form' && entry.formSchema && (
                      <p className="text-xs text-slate-500">
                        {Object.keys(entry.formSchema.properties || {}).length} field(s)
                        {entry.formSchema.required?.length > 0 && ` · ${entry.formSchema.required.length} required`}
                      </p>
                    )}

                    {/* Rollback button */}
                    {!isCurrent && onRollback && (
                      <button
                        onClick={() => onRollback(entry)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Rollback to this version
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
