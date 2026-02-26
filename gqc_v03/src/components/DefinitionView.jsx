import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import StepContextMenu from './StepContextMenu';
import StepConfigModal from './StepConfigModal';
import api from '../utils/apiClient';

const CONFIG_BADGE = {
  form: { color: '#3b82f6', label: 'F' },
  'external-api': { color: '#f59e0b', label: 'A' },
  webhook: { color: '#22c55e', label: 'W' },
};

export default function DefinitionView({ flowDefinition, programName, programId, isDemo }) {
  const svgRef = useRef();
  const zoomRef = useRef(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contextMenu, setContextMenu] = useState(null);
  const [configModal, setConfigModal] = useState(null);
  const [stepConfigs, setStepConfigs] = useState({});
  const [stepConfigHistory, setStepConfigHistory] = useState({});

  const useApiPersistence = !isDemo && api.isConfigured() && !!programId;

  const phases = flowDefinition?.phases || [];

  const getEnabledSteps = useCallback(() => {
    if (!flowDefinition) return [];
    const result = [];
    phases.forEach((phase) => {
      (flowDefinition.steps[phase.id] || [])
        .filter((s) => s.enabled)
        .forEach((s) => result.push({ ...s, phase: phase.id }));
    });
    return result;
  }, [flowDefinition, phases]);

  // Load step configs from API on mount
  useEffect(() => {
    if (!useApiPersistence) return;
    api.listAllStepConfigs(programId)
      .then(data => {
        const configs = {};
        for (const item of (data.configs || [])) {
          const key = `${item.phaseId}#${item.stepId}`;
          configs[key] = {
            configType: item.configType,
            ...(item.configType === 'form' ? { formConfig: item.config } : {}),
            ...(item.configType === 'external-api' ? { apiConfig: item.config } : {}),
            ...(item.configType === 'webhook' ? { webhookConfig: item.config } : {}),
            formSchema: item.configType === 'form' ? item.config?.jsonSchema : undefined,
            phaseId: item.phaseId,
            stepId: item.stepId,
            version: item.version,
            updatedAt: item.updatedAt,
          };
        }
        setStepConfigs(configs);
      })
      .catch(err => console.warn('Failed to load step configs:', err));
  }, [programId, useApiPersistence]);

  const handleContextMenuSelect = useCallback((action, step, phase) => {
    if (action === 'remove') {
      const key = `${phase.id}#${step.id}`;
      setStepConfigs(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (useApiPersistence) {
        api.deleteStepConfig(programId, phase.id, step.id)
          .catch(err => console.error('Failed to delete step config:', err));
      }
      return;
    }
    if (action === 'versions') {
      if (useApiPersistence) {
        api.listStepConfigVersions(programId, phase.id, step.id)
          .then(data => {
            const key = `${phase.id}#${step.id}`;
            const versions = (data.versions || []).map(v => ({
              ...v,
              configType: v.configType,
              formConfig: v.configType === 'form' ? v.config : undefined,
              apiConfig: v.configType === 'external-api' ? v.config : undefined,
              webhookConfig: v.configType === 'webhook' ? v.config : undefined,
              formSchema: v.configType === 'form' ? v.config?.jsonSchema : undefined,
              savedAt: v.updatedAt,
            }));
            setStepConfigHistory(prev => ({ ...prev, [key]: versions }));
            setConfigModal({ step, phase, mode: 'versions' });
          })
          .catch(() => setConfigModal({ step, phase, mode: 'versions' }));
      } else {
        setConfigModal({ step, phase, mode: 'versions' });
      }
      return;
    }
    const modeMap = { form: 'form', 'external-api': 'external-api', webhook: 'webhook', edit: null };
    let mode = modeMap[action];
    if (action === 'edit') {
      const key = `${phase.id}#${step.id}`;
      mode = stepConfigs[key]?.configType || 'form';
    }
    if (mode) {
      setConfigModal({ step, phase, mode });
    }
  }, [stepConfigs, useApiPersistence, programId]);

  const handleConfigSaved = useCallback(async (phaseId, stepId, config) => {
    const key = `${phaseId}#${stepId}`;
    // Optimistic local update
    setStepConfigs(prev => ({ ...prev, [key]: config }));
    setStepConfigHistory(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { ...config, savedAt: new Date().toISOString() }],
    }));
    // Persist to API
    if (useApiPersistence) {
      try {
        const saved = await api.saveStepConfig(programId, phaseId, stepId, config);
        setStepConfigs(prev => ({
          ...prev,
          [key]: { ...prev[key], version: saved.version, updatedAt: saved.updatedAt },
        }));
      } catch (err) {
        console.error('Failed to save step config:', err);
      }
    }
  }, [programId, useApiPersistence]);

  const handleRollback = useCallback(async (phaseId, stepId, versionEntry) => {
    const key = `${phaseId}#${stepId}`;
    if (useApiPersistence) {
      try {
        const result = await api.rollbackStepConfig(programId, phaseId, stepId, versionEntry.version);
        const config = {
          configType: result.configType,
          ...(result.configType === 'form' ? { formConfig: result.config } : {}),
          ...(result.configType === 'external-api' ? { apiConfig: result.config } : {}),
          ...(result.configType === 'webhook' ? { webhookConfig: result.config } : {}),
          phaseId, stepId,
          version: result.version,
          updatedAt: result.updatedAt,
        };
        setStepConfigs(prev => ({ ...prev, [key]: config }));
      } catch (err) {
        console.error('Failed to rollback:', err);
      }
    } else {
      const rolledBack = {
        ...versionEntry,
        version: (stepConfigs[key]?.version || 0) + 1,
        updatedAt: new Date().toISOString(),
        rolledBackFrom: versionEntry.version,
      };
      setStepConfigs(prev => ({ ...prev, [key]: rolledBack }));
      setStepConfigHistory(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), { ...rolledBack, savedAt: new Date().toISOString() }],
      }));
    }
  }, [programId, useApiPersistence, stepConfigs]);

  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current || !flowDefinition) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const enabledSteps = getEnabledSteps();
    const phaseStepCounts = phases.map(p =>
      (flowDefinition.steps[p.id] || []).filter(s => s.enabled).length
    );
    const maxStepsInPhase = Math.max(...phaseStepCounts, 1);

    const cellWidth = 160;
    const nodeRadius = 16;
    const labelOffset = 38;
    const phaseHeight = 140;
    const phasePadding = 24;
    const leftMargin = 40;
    const topMargin = 30;
    const productLabelX = cellWidth * maxStepsInPhase + leftMargin + 100;

    const width = productLabelX + 120;
    const height = phaseHeight * phases.length + topMargin + 60;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('class', 'zoom-group');

    const zoom = d3.zoom()
      .scaleExtent([0.4, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(60, 50).scale(0.8));

    const getCelonisProduct = (phaseId) => {
      const billingPhases = ['billing', 'customer-impact', 'prorate', 'tariff', 'cis'];
      if (billingPhases.some(b => phaseId.toLowerCase().includes(b))) {
        return { name: 'Smart Billing', color: '#ec4899', bg: '#fdf2f8' };
      }
      return { name: 'Smart Rollout', color: '#06b6d4', bg: '#ecfeff' };
    };

    const getStepPosition = (step) => {
      const phaseIndex = phases.findIndex(p => p.id === step.phase);
      const phaseSteps = (flowDefinition.steps[step.phase] || []).filter(s => s.enabled);
      const stepIndex = phaseSteps.findIndex(s => s.id === step.id);
      return {
        x: leftMargin + 60 + stepIndex * cellWidth,
        y: topMargin + 50 + phaseIndex * phaseHeight
      };
    };

    // Product column dotted lines
    const phaseProducts = phases.map((phase, idx) => ({
      phase, idx, product: getCelonisProduct(phase.id),
      y: topMargin + 18 + idx * phaseHeight
    }));
    const productGroups = {};
    phaseProducts.forEach(pp => {
      if (!productGroups[pp.product.name]) productGroups[pp.product.name] = { phases: [], color: pp.product.color };
      productGroups[pp.product.name].phases.push(pp);
    });
    Object.values(productGroups).forEach(group => {
      if (group.phases.length > 1) {
        const minY = Math.min(...group.phases.map(p => p.y));
        const maxY = Math.max(...group.phases.map(p => p.y));
        g.append('line').attr('x1', productLabelX).attr('y1', minY + 10)
          .attr('x2', productLabelX).attr('y2', maxY + 10)
          .attr('stroke', group.color).attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4').attr('opacity', 0.4);
      }
    });

    // Phase backgrounds with product badges
    phases.forEach((phase, idx) => {
      const phaseSteps = (flowDefinition.steps[phase.id] || []).filter(s => s.enabled);
      const rowWidth = Math.max(phaseSteps.length * cellWidth + 40, cellWidth * 2 + 40);
      const product = getCelonisProduct(phase.id);

      g.append('rect').attr('x', leftMargin).attr('y', topMargin + idx * phaseHeight)
        .attr('width', rowWidth).attr('height', phaseHeight - phasePadding)
        .attr('rx', 12).attr('fill', '#f8fafc').attr('stroke', '#e2e8f0').attr('stroke-width', 1);

      g.append('text').attr('x', leftMargin + rowWidth + 16).attr('y', topMargin + 20 + idx * phaseHeight)
        .attr('font-size', '12px').attr('font-weight', '700').attr('fill', '#475569')
        .attr('letter-spacing', '0.05em').text(phase.shortName.toUpperCase());

      const badgeWidth = 95;
      const badgeX = productLabelX - badgeWidth / 2;
      const badgeY = topMargin + 8 + idx * phaseHeight;

      g.append('rect').attr('x', badgeX).attr('y', badgeY)
        .attr('width', badgeWidth).attr('height', 22).attr('rx', 11)
        .attr('fill', product.bg).attr('stroke', product.color).attr('stroke-width', 1.5);
      g.append('text').attr('x', productLabelX).attr('y', badgeY + 15)
        .attr('text-anchor', 'middle').attr('font-size', '10px').attr('font-weight', '600')
        .attr('fill', product.color).text(product.name);

      g.append('line').attr('x1', leftMargin + rowWidth + 8).attr('y1', topMargin + 18 + idx * phaseHeight)
        .attr('x2', badgeX - 8).attr('y2', topMargin + 18 + idx * phaseHeight)
        .attr('stroke', product.color).attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4').attr('opacity', 0.5);
    });

    // Connections — snake pattern with arrows
    enabledSteps.forEach((step, idx) => {
      if (idx === enabledSteps.length - 1) return;
      const nextStep = enabledSteps[idx + 1];
      const currentPos = getStepPosition(step);
      const nextPos = getStepPosition(nextStep);

      if (step.phase === nextStep.phase) {
        const startX = currentPos.x + nodeRadius + 4;
        const endX = nextPos.x - nodeRadius - 4;
        const midX = (startX + endX) / 2;
        g.append('line').attr('x1', startX).attr('y1', currentPos.y)
          .attr('x2', endX).attr('y2', nextPos.y)
          .attr('stroke', '#cbd5e1').attr('stroke-width', 2).attr('stroke-linecap', 'round');
        g.append('path')
          .attr('d', `M ${midX - 6} ${currentPos.y - 5} L ${midX + 4} ${currentPos.y} L ${midX - 6} ${currentPos.y + 5}`)
          .attr('fill', 'none').attr('stroke', '#cbd5e1').attr('stroke-width', 2)
          .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      } else {
        const cornerRadius = 14;
        const exitY = currentPos.y + nodeRadius + 4;
        const entryY = nextPos.y - nodeRadius - 4;
        const routeX = leftMargin + 20;

        const path = d3.path();
        path.moveTo(currentPos.x, exitY);
        path.lineTo(currentPos.x, exitY + 15);
        path.quadraticCurveTo(currentPos.x, exitY + 15 + cornerRadius, currentPos.x - cornerRadius, exitY + 15 + cornerRadius);
        path.lineTo(routeX + cornerRadius, exitY + 15 + cornerRadius);
        path.quadraticCurveTo(routeX, exitY + 15 + cornerRadius, routeX, exitY + 15 + cornerRadius * 2);
        path.lineTo(routeX, entryY - 15 - cornerRadius * 2);
        path.quadraticCurveTo(routeX, entryY - 15 - cornerRadius, routeX + cornerRadius, entryY - 15 - cornerRadius);
        path.lineTo(nextPos.x - cornerRadius, entryY - 15 - cornerRadius);
        path.quadraticCurveTo(nextPos.x, entryY - 15 - cornerRadius, nextPos.x, entryY - 15);
        path.lineTo(nextPos.x, entryY);

        g.append('path').attr('d', path.toString())
          .attr('fill', 'none').attr('stroke', '#cbd5e1').attr('stroke-width', 2).attr('stroke-linecap', 'round');

        const arrowY = entryY - 8;
        g.append('path')
          .attr('d', `M ${nextPos.x - 5} ${arrowY - 6} L ${nextPos.x} ${arrowY + 2} L ${nextPos.x + 5} ${arrowY - 6}`)
          .attr('fill', 'none').attr('stroke', '#cbd5e1').attr('stroke-width', 2)
          .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      }
    });

    // Step nodes
    const terminalStepId = enabledSteps.length > 0 ? enabledSteps[enabledSteps.length - 1].id : null;
    enabledSteps.forEach((step) => {
      const pos = getStepPosition(step);
      const phase = phases.find(p => p.id === step.phase);
      const product = getCelonisProduct(phase.id);
      const isTerminal = step.id === terminalStepId;
      const nodeColor = isTerminal ? product.color : '#64748b';

      const stepG = g.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .style('cursor', 'pointer')
        .on('click', () => setSelectedStation(selectedStation?.id === step.id ? null : step))
        .on('contextmenu', (event) => {
          event.preventDefault();
          event.stopPropagation();
          setContextMenu({ x: event.clientX, y: event.clientY, step, phase });
        });

      stepG.append('circle').attr('r', nodeRadius)
        .attr('fill', isTerminal ? nodeColor : 'white')
        .attr('stroke', nodeColor).attr('stroke-width', 2);

      if (isTerminal) {
        stepG.append('path').attr('d', 'M-5 0 L-2 3 L5 -4')
          .attr('fill', 'none').attr('stroke', 'white').attr('stroke-width', 2.5)
          .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      }
      if (step.custom) {
        stepG.append('circle').attr('cx', 12).attr('cy', -12).attr('r', 6)
          .attr('fill', '#8b5cf6').attr('stroke', 'white').attr('stroke-width', 2);
      }

      // Config type badge
      const configKey = `${step.phase}#${step.id}`;
      const badge = CONFIG_BADGE[stepConfigs[configKey]?.configType];
      if (badge) {
        stepG.append('circle').attr('cx', -12).attr('cy', -12).attr('r', 7)
          .attr('fill', badge.color).attr('stroke', 'white').attr('stroke-width', 2);
        stepG.append('text').attr('x', -12).attr('y', -9)
          .attr('text-anchor', 'middle').attr('font-size', '8px').attr('font-weight', '700')
          .attr('fill', 'white').text(badge.label);
      }

      stepG.append('text').attr('y', labelOffset).attr('text-anchor', 'middle')
        .attr('font-size', '11px').attr('font-weight', '500').attr('fill', '#334155')
        .text(step.name);
    });

    // Start indicator
    if (enabledSteps.length > 0) {
      const firstStep = enabledSteps[0];
      const firstPos = getStepPosition(firstStep);
      g.append('circle').attr('cx', leftMargin).attr('cy', firstPos.y).attr('r', 6).attr('fill', '#64748b');
      g.append('line').attr('x1', leftMargin + 6).attr('y1', firstPos.y)
        .attr('x2', firstPos.x - nodeRadius - 4).attr('y2', firstPos.y)
        .attr('stroke', '#cbd5e1').attr('stroke-width', 2).attr('stroke-linecap', 'round');
    }

  }, [flowDefinition, selectedStation, getEnabledSteps, phases, stepConfigs]);

  const handleZoomIn = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 1.25);
    }
  }, []);
  const handleZoomOut = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 0.8);
    }
  }, []);
  const handleResetZoom = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        zoomRef.current.transform, d3.zoomIdentity.translate(60, 50).scale(0.8)
      );
    }
  }, []);

  if (!flowDefinition) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No flow definition available
      </div>
    );
  }

  const enabledSteps = getEnabledSteps();

  return (
    <div className="flex h-full">
      {/* Read-only phase/step sidebar */}
      <div className="w-56 border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">{programName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {phases.length} phases · {enabledSteps.length} steps
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {phases.map((phase) => {
            const steps = (flowDefinition.steps[phase.id] || []).filter(s => s.enabled);
            return (
              <div key={phase.id} className="px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {phase.shortName}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">{steps.length}</span>
                </div>
                {steps.map((step) => {
                  const configKey = `${phase.id}#${step.id}`;
                  const hasConfig = !!stepConfigs[configKey];
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-1.5 text-xs py-1 pl-4 rounded cursor-pointer transition-colors ${
                        selectedStation?.id === step.id
                          ? 'text-slate-900 bg-white font-medium'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      onClick={() => setSelectedStation(selectedStation?.id === step.id ? null : { ...step, phase: phase.id })}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, step: { ...step, phase: phase.id }, phase });
                      }}
                    >
                      {hasConfig && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CONFIG_BADGE[stepConfigs[configKey].configType]?.color || '#94a3b8' }}
                        />
                      )}
                      {step.name}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Zoom controls */}
        <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-slate-200">
          <span className="text-xs text-slate-400 mr-2">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={handleZoomOut} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={handleResetZoom} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><RotateCcw className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'none' }} />

          {/* Watermark logos */}
          <div className="absolute bottom-4 right-4 flex items-center gap-4 opacity-25 pointer-events-none">
            <img src="/smartutilities-logo.png" alt="" className="h-6 object-contain" />
            <img src="/celonis-logo.png" alt="" className="h-5 object-contain" />
            <img src="/aws-logo.svg" alt="" className="h-6 object-contain" />
          </div>

          {/* Selected step detail overlay */}
          {selectedStation && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {phases.find(p => p.id === selectedStation.phase)?.shortName}
                </span>
                <button onClick={() => setSelectedStation(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <h4 className="font-medium text-slate-900 mb-1">{selectedStation.name}</h4>
              <p className="text-sm text-slate-500 mb-2">{selectedStation.detail}</p>
              {selectedStation.conformance != null && (
                <div className="text-xs text-slate-400">
                  Conformance target: <span className="font-semibold text-slate-600">{selectedStation.conformance}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <StepContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          step={contextMenu.step}
          phase={contextMenu.phase}
          hasConfig={!!stepConfigs[`${contextMenu.phase.id}#${contextMenu.step.id}`]}
          onClose={() => setContextMenu(null)}
          onSelect={handleContextMenuSelect}
        />
      )}

      {/* Config Modal */}
      {configModal && (
        <StepConfigModal
          isOpen={!!configModal}
          onClose={() => setConfigModal(null)}
          step={configModal.step}
          phase={configModal.phase}
          programId={programId}
          mode={configModal.mode}
          onConfigSaved={handleConfigSaved}
          onRollback={handleRollback}
          flowDefinition={flowDefinition}
          configHistory={stepConfigHistory[`${configModal.phase.id}#${configModal.step.id}`] || []}
          currentConfig={stepConfigs[`${configModal.phase.id}#${configModal.step.id}`] || null}
        />
      )}
    </div>
  );
}
