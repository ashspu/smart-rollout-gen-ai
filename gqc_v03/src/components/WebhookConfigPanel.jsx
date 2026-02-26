import { useState, useMemo } from 'react';
import { Webhook, Copy, CheckCircle, Shield, Code } from 'lucide-react';

export default function WebhookConfigPanel({ step, phase, programId, onSave }) {
  const [authType, setAuthType] = useState('hmac-sha256');
  const [copied, setCopied] = useState(false);

  const webhookId = useMemo(() => {
    // Deterministic ID from program + phase + step for display
    return `wh-${programId?.slice(0, 8) || 'demo'}-${phase.id}-${step.id}`.replace(/[^a-z0-9-]/gi, '-');
  }, [programId, phase.id, step.id]);

  const webhookUrl = `https://ig32bglkok.execute-api.us-east-1.amazonaws.com/prod/webhooks/${webhookId}`;
  const hmacSecret = 'whsec_' + btoa(`${programId}:${phase.id}:${step.id}`).slice(0, 32);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X POST '${webhookUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Signature: sha256=<hmac_signature>' \\
  -d '{
    "status": "completed",
    "meterId": "MTR-12345",
    "timestamp": "${new Date().toISOString()}",
    "data": { "readingValue": 12345.67 }
  }'`;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Webhook URL</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50 text-slate-600"
            />
            <button
              onClick={() => copyToClipboard(webhookUrl)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">External systems POST to this URL to signal step completion.</p>
        </div>

        {/* Authentication */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Shield className="w-3.5 h-3.5 inline mr-1" />Authentication Method
          </label>
          <select
            value={authType}
            onChange={e => setAuthType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="hmac-sha256">HMAC-SHA256 Signature</option>
            <option value="oauth2-token">OAuth2 Token Validation</option>
            <option value="api-key">API Key</option>
          </select>
        </div>

        {/* HMAC Secret */}
        {authType === 'hmac-sha256' && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-2">Signing Secret</p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-white rounded border border-amber-200 text-xs font-mono text-amber-700 break-all">
                {hmacSecret}
              </code>
              <button
                onClick={() => copyToClipboard(hmacSecret)}
                className="px-3 py-2 bg-amber-100 rounded text-amber-700 hover:bg-amber-200"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Store this securely. Compute HMAC-SHA256 of the request body using this secret and send as X-Signature header.
            </p>
          </div>
        )}

        {authType === 'oauth2-token' && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <input placeholder="Expected Issuer (iss)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
            <input placeholder="Expected Audience (aud)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
          </div>
        )}

        {/* Example */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Code className="w-3.5 h-3.5 inline mr-1" />Example Request
          </label>
          <pre className="p-4 bg-slate-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
            {curlExample}
          </pre>
          <button
            onClick={() => copyToClipboard(curlExample)}
            className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
          >
            <Copy className="w-3.5 h-3.5" />Copy curl command
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => onSave?.({ configType: 'webhook', webhookConfig: { webhookId, authType, hmacSecret } })}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Webhook className="w-4 h-4" />Enable Webhook
          </button>
        </div>
      </div>
    </div>
  );
}
