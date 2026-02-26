import { useState } from 'react';
import { Globe, Plus, Trash2, Play, Lock } from 'lucide-react';

export default function ExternalApiConfigPanel({ step, phase, programId, onSave }) {
  const [config, setConfig] = useState({
    url: '',
    method: 'POST',
    headers: [{ key: '', value: '' }],
    auth: { type: 'none' },
    requestMapping: '{}',
    responseMapping: '{}',
    retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
    timeoutMs: 30000,
  });

  const update = (path, value) => {
    setConfig(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-6 space-y-6 max-w-2xl">
        {/* URL + Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Endpoint</label>
          <div className="flex gap-2">
            <select
              value={config.method}
              onChange={e => update('method', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50"
            >
              {['GET', 'POST', 'PUT', 'PATCH'].map(m => <option key={m}>{m}</option>)}
            </select>
            <input
              type="text"
              value={config.url}
              onChange={e => update('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        {/* Authentication */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Lock className="w-3.5 h-3.5 inline mr-1" />Authentication
          </label>
          <select
            value={config.auth.type}
            onChange={e => update('auth.type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="none">None</option>
            <option value="oauth2-client-credentials">OAuth2 — Client Credentials</option>
            <option value="api-key">API Key</option>
            <option value="bearer">Bearer Token</option>
          </select>

          {config.auth.type === 'oauth2-client-credentials' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <input placeholder="Token URL" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Client ID" className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
                <input placeholder="Client Secret" type="password" className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
              <input placeholder="Scopes (comma-separated)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
            </div>
          )}
        </div>

        {/* Headers */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Headers</label>
          {config.headers.map((h, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Key"
                value={h.key}
                onChange={e => {
                  const headers = [...config.headers];
                  headers[i] = { ...h, key: e.target.value };
                  setConfig(prev => ({ ...prev, headers }));
                }}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
              <input
                placeholder="Value"
                value={h.value}
                onChange={e => {
                  const headers = [...config.headers];
                  headers[i] = { ...h, value: e.target.value };
                  setConfig(prev => ({ ...prev, headers }));
                }}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
              <button
                onClick={() => setConfig(prev => ({ ...prev, headers: prev.headers.filter((_, j) => j !== i) }))}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setConfig(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }))}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />Add Header
          </button>
        </div>

        {/* Retry + Timeout */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Max Retries</label>
            <input
              type="number" min={0} max={10}
              value={config.retryPolicy.maxAttempts}
              onChange={e => update('retryPolicy.maxAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Backoff (ms)</label>
            <input
              type="number" min={100} step={100}
              value={config.retryPolicy.backoffMs}
              onChange={e => update('retryPolicy.backoffMs', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Timeout (ms)</label>
            <input
              type="number" min={1000} step={1000}
              value={config.timeoutMs}
              onChange={e => update('timeoutMs', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">
            <Play className="w-4 h-4" />Test Connection
          </button>
          <button
            onClick={() => onSave?.({ configType: 'external-api', apiConfig: config })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Globe className="w-4 h-4" />Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
