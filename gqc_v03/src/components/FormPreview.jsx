import { useState, useRef, useEffect, useMemo } from 'react';
import Form from '@rjsf/core';
import { getDefaultRegistry } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { CheckCircle, AlertCircle, RotateCcw, ClipboardList, FlaskConical } from 'lucide-react';

const DefaultFieldTemplate = getDefaultRegistry().templates.FieldTemplate;

function HighlightFieldTemplate(props) {
  const { id, changedFields } = props;
  const fieldKey = id?.replace(/^root_/, '');
  const isChanged = changedFields && changedFields.has(fieldKey);

  // Strip our custom prop before passing to the default template
  const { changedFields: _, ...defaultProps } = props;

  if (!isChanged) {
    return <DefaultFieldTemplate {...defaultProps} />;
  }

  return (
    <div className="rjsf-field-changed">
      <span className="inline-block mb-1 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full animate-pulse">
        Changed
      </span>
      <DefaultFieldTemplate {...defaultProps} />
    </div>
  );
}

export default function FormPreview({ schema, uiSchema, onSubmitTest, changedFields }) {
  const [formData, setFormData] = useState(undefined);
  const [testResults, setTestResults] = useState([]);
  const [liveErrors, setLiveErrors] = useState([]);
  const [hideChanges, setHideChanges] = useState(false);
  const formRef = useRef(null);

  // Reset form data when schema changes so new defaults take effect in preview
  useEffect(() => {
    setFormData(undefined);
    setLiveErrors([]);
    setHideChanges(false);
  }, [JSON.stringify(schema)]);

  // Auto-hide changed field highlights after 5 seconds
  useEffect(() => {
    if (changedFields && changedFields.size > 0) {
      setHideChanges(false);
      const timer = setTimeout(() => setHideChanges(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [changedFields]);

  const visibleChanges = hideChanges ? new Set() : (changedFields || new Set());

  // Build a FieldTemplate wrapping the default, with highlight for changed fields
  const templates = useMemo(() => ({
    FieldTemplate: (props) => <HighlightFieldTemplate {...props} changedFields={visibleChanges} />,
  }), [visibleChanges]);

  if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Schema will appear here as you build the form...
      </div>
    );
  }

  const requiredCount = (schema.required || []).length;
  const totalCount = Object.keys(schema.properties).length;
  const filledCount = formData
    ? Object.entries(formData).filter(([k, v]) => v !== undefined && v !== '' && v !== null).length
    : 0;

  const handleSubmit = ({ formData: data }) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      valid: true,
      data,
      fieldCount: Object.keys(data).filter(k => data[k] !== undefined && data[k] !== '').length,
    };
    setTestResults(prev => [result, ...prev].slice(0, 10));
    if (onSubmitTest) onSubmitTest(data);
  };

  const handleError = (errors) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      valid: false,
      errors,
      fieldCount: filledCount,
    };
    setTestResults(prev => [result, ...prev].slice(0, 10));
  };

  const handleReset = () => {
    setFormData(undefined);
    setLiveErrors([]);
  };

  const latestResult = testResults[0] || null;

  return (
    <div className="h-full flex flex-col">
      {/* Test status bar */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">
          {filledCount}/{totalCount} fields filled &middot; {requiredCount} required
        </span>
        <div className="ml-auto flex items-center gap-2">
          {testResults.length > 0 && (
            <span className="text-[10px] text-slate-400">
              {testResults.length} test{testResults.length !== 1 ? 's' : ''} run
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
            title="Reset form"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <Form
          key={JSON.stringify(schema)}
          ref={formRef}
          schema={schema}
          uiSchema={{
            ...uiSchema,
            'ui:submitButtonOptions': {
              submitText: 'Test Submit',
              norender: false,
              props: {
                className: 'w-full mt-4 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer',
              },
            },
          }}
          formData={formData}
          onChange={({ formData: d }) => setFormData(d)}
          validator={validator}
          onSubmit={handleSubmit}
          onError={handleError}
          templates={templates}
          liveValidate={false}
          showErrorList={false}
          className="rjsf-form"
        />
      </div>

      {/* Test results panel */}
      {latestResult && (
        <div className={`mx-3 mb-3 rounded-lg text-sm border overflow-hidden ${
          latestResult.valid ? 'border-green-200' : 'border-red-200'
        }`}>
          {/* Result header */}
          <div className={`px-3 py-2 flex items-center gap-2 ${
            latestResult.valid ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {latestResult.valid ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">Test passed</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-700">Validation failed</span>
              </>
            )}
            <span className="text-[10px] text-slate-400 ml-auto">{latestResult.timestamp}</span>
          </div>

          {/* Result body */}
          <div className="px-3 py-2 bg-white max-h-40 overflow-y-auto">
            {latestResult.valid ? (
              <>
                <p className="text-xs text-slate-500 mb-1.5">{latestResult.fieldCount} field(s) submitted — JSON payload:</p>
                <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 rounded p-2 overflow-x-auto">
                  {JSON.stringify(latestResult.data, null, 2)}
                </pre>
              </>
            ) : (
              <>
                <p className="text-xs text-red-600 mb-1">Fix these errors and re-submit:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {(latestResult.errors || []).map((err, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">&bull;</span>
                      <span>{err.stack?.replace('instance.', '') || err.message}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Test history (collapsed) */}
          {testResults.length > 1 && (
            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/50">
              <details className="text-[10px] text-slate-400">
                <summary className="cursor-pointer hover:text-slate-600">
                  <ClipboardList className="w-3 h-3 inline mr-1" />
                  {testResults.length - 1} previous test{testResults.length > 2 ? 's' : ''}
                </summary>
                <div className="mt-1 space-y-0.5">
                  {testResults.slice(1).map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      {r.valid
                        ? <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                        : <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                      }
                      <span>{r.timestamp} — {r.valid ? `${r.fieldCount} fields` : `${(r.errors || []).length} error(s)`}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
