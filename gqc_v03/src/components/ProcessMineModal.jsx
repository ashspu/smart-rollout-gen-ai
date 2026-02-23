import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  X, ZoomIn, ZoomOut, Home, ChevronRight, ChevronLeft, GitBranch, Activity, Plus, Eye, EyeOff, RotateCcw, Settings,
  Target, Users, Truck, Radio, Receipt, Search, ClipboardCheck, Bell, Calendar, Wrench, CheckCircle2
} from 'lucide-react';

// SAP-style phase icons - monochrome, professional
const PhaseIcon = ({ phaseId, className = "w-5 h-5" }) => {
  const icons = {
    identify: Target,
    engage: Users,
    deploy: Truck,
    activate: Radio,
    billing: Receipt,
    prioritize: ClipboardCheck,
    notify: Bell,
    schedule: Calendar,
    validate: CheckCircle2,
    detect: Search,
    triage: ClipboardCheck,
    dispatch: Truck,
    replace: Wrench,
    request: Users,
    consent: CheckCircle2,
    configure: Settings,
    design: ClipboardCheck,
    select: Target,
    monitor: Activity,
    evaluate: Search,
    certify: CheckCircle2,
    report: ClipboardCheck,
  };
  const Icon = icons[phaseId] || Target;
  return <Icon className={className} />;
};

export default function ProcessMineModal({ isOpen, onClose, data }) {
  const svgRef = useRef();
  const zoomRef = useRef(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [legendCollapsed, setLegendCollapsed] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState('conformance'); // 'conformance', 'flow', or 'define'
  const [showAddStepModal, setShowAddStepModal] = useState(null); // phase id when adding

  // Phase definitions with color coding - teal to pink gradient theme
  const phases = [
    { id: 'identify', name: 'Identification & Engagement', shortName: 'IDENTIFY', color: '#06b6d4', light: '#ecfeff' },
    { id: 'deploy', name: 'Field Deployment', shortName: 'DEPLOY', color: '#8b5cf6', light: '#f5f3ff' },
    { id: 'activate', name: 'Activation', shortName: 'ACTIVATE', color: '#d946ef', light: '#fdf4ff' },
    { id: 'billing', name: 'Billing Setup', shortName: 'BILLING', color: '#ec4899', light: '#fdf2f8' },
  ];

  // Default AMI Journey Template - "95% of all AMI activations follow this flow"
  const defaultTemplate = {
    name: 'Standard AMI Activation',
    description: '95% of AMI meter-to-first-bill activations follow this journey',
    steps: {
      identify: [
        { id: 'identify', name: 'Identify Meter', enabled: true, conformance: 99.8, detail: 'Cohort selection by install year, failure probability' },
        { id: 'validate', name: 'Validate Eligibility', enabled: true, conformance: 99.2, detail: 'Check opt-out list, DNI list, meter type compatibility' },
        { id: 'schedule', name: 'Schedule Appt', enabled: true, conformance: 97.5, detail: 'Appointment slot assignment via customer portal or IVR' },
        { id: 'notify', name: 'Send Notification', enabled: true, conformance: 98.1, detail: 'Pre-install customer notice (SMS, email, letter)' },
        { id: 'confirm', name: 'Customer Confirms', enabled: true, conformance: 93.2, deviation: 'Reschedule 14.6%', detail: 'Customer acknowledgment or reschedule request' },
      ],
      deploy: [
        { id: 'dispatch', name: 'Dispatch Crew', enabled: true, conformance: 98.8, detail: 'Internal crew or contractor assignment + route optimization' },
        { id: 'arrive', name: 'Arrive On-Site', enabled: true, conformance: 96.2, detail: 'GPS confirmation, travel time tracking' },
        { id: 'access', name: 'Gain Access', enabled: true, conformance: 86.5, deviation: 'No Access 9.7%', critical: true, detail: 'Customer access + meter base condition check (0.73% need repair)' },
        { id: 'meter-swap', name: 'Meter Swap', enabled: true, conformance: 99.1, detail: 'Old meter removal, final read, new meter installation' },
        { id: 'verify', name: 'Verify Install', enabled: true, conformance: 98.9, detail: 'Physical installation QC, photo documentation' },
      ],
      activate: [
        { id: 'register', name: 'Register in AMI', enabled: true, conformance: 99.5, detail: 'HES meter registration, network assignment' },
        { id: 'commission', name: 'Commission', enabled: true, conformance: 91.2, deviation: 'Retry 7.1%', critical: true, detail: 'RF network join, TGB handshake, signal strength check' },
        { id: 'first-comm', name: 'First Comm Check', enabled: true, conformance: 97.8, detail: 'First ping successful, initial reading received' },
        { id: 'validate-reads', name: 'Validate Readings', enabled: true, conformance: 98.4, detail: 'MDM validation, plausibility check, VEE processing' },
      ],
      billing: [
        { id: 'update-cis', name: 'Update CIS', enabled: true, conformance: 99.2, detail: 'Customer Information System update, account linkage' },
        { id: 'tariff', name: 'Assign Tariff', enabled: true, conformance: 95.5, deviation: 'Mismatch 2.2%', detail: 'Rate structure assignment (TOU, tiered, net metering)' },
        { id: 'billing-val', name: 'Billing Validation', enabled: true, conformance: 94.1, deviation: 'Issues 4.5%', detail: 'Pre-bill validation, proration calculation' },
        { id: 'first-bill', name: 'First Bill', enabled: true, conformance: 98.2, milestone: true, detail: 'Customer receives accurate first bill on new meter' },
      ],
    }
  };

  // User-customizable flow state
  const [flowDefinition, setFlowDefinition] = useState(defaultTemplate);
  const [newStepName, setNewStepName] = useState('');

  // Get all enabled steps as flat array for visualization
  const getEnabledSteps = () => {
    const allSteps = [];
    let globalIdx = 0;
    
    phases.forEach((phase, phaseIdx) => {
      const phaseSteps = flowDefinition.steps[phase.id] || [];
      phaseSteps.filter(s => s.enabled).forEach((step, stepIdx) => {
        allSteps.push({
          ...step,
          phase: phase.id,
          phaseIndex: phaseIdx,
          stepIndex: stepIdx,
          globalIndex: globalIdx++,
        });
      });
    });
    
    return allSteps;
  };

  // Conformance issues - what Celonis would detect
  const conformanceIssues = [
    { from: 'confirm', to: 'schedule', pct: 14.6, label: 'Reschedule', color: '#06b6d4', cause: 'Customer unavailable, conflict' },
    { from: 'access', to: 'schedule', pct: 9.7, label: 'No Access', color: '#ef4444', cause: 'Locked gate, dog, customer absent' },
    { from: 'commission', to: 'register', pct: 7.1, label: 'Comm Retry', color: '#d946ef', cause: 'RF coverage gap, TGB issue' },
    { from: 'billing-val', to: 'tariff', pct: 4.5, label: 'Billing Fix', color: '#ec4899', cause: 'Rate mismatch, read sequence' },
    { from: 'tariff', to: 'update-cis', pct: 2.2, label: 'Tariff Fix', color: '#8b5cf6', cause: 'Net metering, TOU setup error' },
  ];

  const handleZoomIn = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform, d3.zoomIdentity.translate(40, 30).scale(0.9)
      );
    }
  }, []);

  const toggleStepEnabled = (phaseId, stepId) => {
    setFlowDefinition(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [phaseId]: prev.steps[phaseId].map(s => 
          s.id === stepId ? { ...s, enabled: !s.enabled } : s
        )
      }
    }));
  };

  const addCustomStep = (phaseId, stepName) => {
    if (!stepName.trim()) return;
    
    const newStep = {
      id: `custom-${Date.now()}`,
      name: stepName,
      enabled: true,
      conformance: 100,
      detail: 'Custom step added by user',
      custom: true,
    };

    setFlowDefinition(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [phaseId]: [...prev.steps[phaseId], newStep]
      }
    }));
    
    setNewStepName('');
    setShowAddStepModal(null);
  };

  const removeCustomStep = (phaseId, stepId) => {
    setFlowDefinition(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [phaseId]: prev.steps[phaseId].filter(s => s.id !== stepId)
      }
    }));
  };

  const resetToDefault = () => {
    setFlowDefinition(defaultTemplate);
    setSelectedStation(null);
  };

  // D3 Visualization
  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const enabledSteps = getEnabledSteps();
    
    // Calculate dimensions based on steps per phase
    const phaseStepCounts = phases.map(p => 
      (flowDefinition.steps[p.id] || []).filter(s => s.enabled).length
    );
    const maxStepsInPhase = Math.max(...phaseStepCounts, 1);
    
    const cellWidth = 160;
    const cellHeight = 130;
    const phaseHeight = cellHeight + 20;
    const leftMargin = 0; // Phase labels are now in separate div
    const width = leftMargin + cellWidth * maxStepsInPhase + 160;
    const height = phaseHeight * 4 + 120;
    
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('class', 'zoom-group');

    const zoom = d3.zoom()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(40, 30).scale(0.9));

    // Get phase color
    const getPhaseColor = (phaseId) => phases.find(p => p.id === phaseId)?.color || '#64748b';
    const getPhaseLightColor = (phaseId) => phases.find(p => p.id === phaseId)?.light || '#f1f5f9';

    // Draw phase background rows with labels
    phases.forEach((phase, idx) => {
      const phaseSteps = (flowDefinition.steps[phase.id] || []).filter(s => s.enabled);
      const rowWidth = Math.max(phaseSteps.length * cellWidth + 80, cellWidth * 2);
      
      // Phase background
      g.append('rect')
        .attr('x', 20)
        .attr('y', 40 + idx * phaseHeight)
        .attr('width', rowWidth)
        .attr('height', phaseHeight - 15)
        .attr('rx', 16)
        .attr('fill', phase.light)
        .attr('opacity', 0.7);

      // Phase label at top of each swimlane
      g.append('text')
        .attr('x', 35)
        .attr('y', 58 + idx * phaseHeight)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', phase.color)
        .attr('letter-spacing', '0.5px')
        .attr('opacity', 0.9)
        .text(phase.shortName);
    });

    // Calculate step positions
    const getStepPosition = (step) => {
      const phaseIndex = phases.findIndex(p => p.id === step.phase);
      const phaseSteps = (flowDefinition.steps[step.phase] || []).filter(s => s.enabled);
      const stepIndex = phaseSteps.findIndex(s => s.id === step.id);
      
      return {
        x: 80 + stepIndex * cellWidth,
        y: 80 + phaseIndex * phaseHeight
      };
    };

    // Draw flow connections between steps
    enabledSteps.forEach((step, idx) => {
      if (idx === enabledSteps.length - 1) return;
      
      const nextStep = enabledSteps[idx + 1];
      const currentPos = getStepPosition(step);
      const nextPos = getStepPosition(nextStep);
      const currentColor = getPhaseColor(step.phase);
      const nextColor = getPhaseColor(nextStep.phase);

      if (step.phase === nextStep.phase) {
        // Same phase - horizontal line
        g.append('line')
          .attr('x1', currentPos.x + 55)
          .attr('y1', currentPos.y)
          .attr('x2', nextPos.x - 55)
          .attr('y2', nextPos.y)
          .attr('stroke', currentColor)
          .attr('stroke-width', 4)
          .attr('stroke-linecap', 'round')
          .attr('opacity', 0.6);
      } else {
        // Phase transition - curved connector
        const path = d3.path();
        path.moveTo(currentPos.x, currentPos.y + 35);
        path.lineTo(currentPos.x, currentPos.y + phaseHeight / 2 + 5);
        path.quadraticCurveTo(currentPos.x, currentPos.y + phaseHeight / 2 + 25, currentPos.x - 25, currentPos.y + phaseHeight / 2 + 25);
        path.lineTo(nextPos.x + 25, nextPos.y - phaseHeight / 2 + 25);
        path.quadraticCurveTo(nextPos.x, nextPos.y - phaseHeight / 2 + 25, nextPos.x, nextPos.y - 35);
        
        // Create gradient for transition
        const gradientId = `gradient-${step.id}-${nextStep.id}`;
        const gradient = svg.append('defs')
          .append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', currentColor);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', nextColor);

        g.append('path')
          .attr('d', path.toString())
          .attr('fill', 'none')
          .attr('stroke', `url(#${gradientId})`)
          .attr('stroke-width', 4)
          .attr('stroke-linecap', 'round')
          .attr('opacity', 0.6);
      }
    });

    // Draw conformance deviation loops
    if (viewMode === 'conformance') {
      conformanceIssues.forEach((issue, idx) => {
        const fromStep = enabledSteps.find(s => s.id === issue.from);
        const toStep = enabledSteps.find(s => s.id === issue.to);
        if (!fromStep || !toStep) return;

        const fromPos = getStepPosition(fromStep);
        const toPos = getStepPosition(toStep);
        
        const path = d3.path();
        const loopHeight = 40 + idx * 12;
        
        if (fromStep.phase === toStep.phase) {
          // Same phase loop back
          path.moveTo(fromPos.x, fromPos.y - 28);
          path.quadraticCurveTo(fromPos.x, fromPos.y - loopHeight, fromPos.x - 35, fromPos.y - loopHeight);
          path.lineTo(toPos.x + 35, toPos.y - loopHeight);
          path.quadraticCurveTo(toPos.x, toPos.y - loopHeight, toPos.x, toPos.y - 28);
        } else {
          // Cross-phase loop
          path.moveTo(fromPos.x + 25, fromPos.y - 28);
          path.quadraticCurveTo(fromPos.x + 25, fromPos.y - loopHeight - 20, fromPos.x - 15, fromPos.y - loopHeight - 20);
          path.lineTo(toPos.x + 55, toPos.y + loopHeight);
          path.quadraticCurveTo(toPos.x, toPos.y + loopHeight, toPos.x, toPos.y + 28);
        }

        g.append('path')
          .attr('d', path.toString())
          .attr('fill', 'none')
          .attr('stroke', issue.color)
          .attr('stroke-width', Math.max(2, issue.pct / 3.5))
          .attr('stroke-linecap', 'round')
          .attr('stroke-dasharray', '8 4')
          .attr('opacity', 0.75);

        // Deviation label
        const labelX = (fromPos.x + toPos.x) / 2;
        const labelY = fromStep.phase === toStep.phase ? fromPos.y - loopHeight - 10 : (fromPos.y + toPos.y) / 2 - 25;
        
        const labelG = g.append('g')
          .attr('transform', `translate(${labelX}, ${labelY})`)
          .style('cursor', 'pointer');

        const labelWidth = issue.label.length * 7 + 48;
        labelG.append('rect')
          .attr('x', -labelWidth / 2)
          .attr('y', -11)
          .attr('width', labelWidth)
          .attr('height', 22)
          .attr('rx', 11)
          .attr('fill', 'white')
          .attr('stroke', issue.color)
          .attr('stroke-width', 1.5);

        labelG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 4)
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('fill', issue.color)
          .text(`${issue.label} ${issue.pct}%`);
      });
    }

    // Draw step nodes
    enabledSteps.forEach((step) => {
      const pos = getStepPosition(step);
      const color = getPhaseColor(step.phase);
      
      const stepG = g.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .style('cursor', 'pointer')
        .on('click', () => setSelectedStation(selectedStation?.id === step.id ? null : step));

      // Conformance indicator ring
      if (viewMode === 'conformance') {
        const conformanceColor = step.conformance >= 98 ? '#22c55e' : 
                                  step.conformance >= 95 ? '#f59e0b' : '#ef4444';
        
        const arcBg = d3.arc()
          .innerRadius(26)
          .outerRadius(30)
          .startAngle(0)
          .endAngle(2 * Math.PI);

        stepG.append('path')
          .attr('d', arcBg())
          .attr('fill', '#e2e8f0');

        const arc = d3.arc()
          .innerRadius(26)
          .outerRadius(30)
          .startAngle(0)
          .endAngle((step.conformance / 100) * 2 * Math.PI);

        stepG.append('path')
          .attr('d', arc())
          .attr('fill', conformanceColor);
      }

      // Main circle
      const radius = step.milestone ? 22 : 18;
      
      stepG.append('circle')
        .attr('r', radius)
        .attr('fill', 'white')
        .attr('stroke', step.critical ? '#ef4444' : color)
        .attr('stroke-width', step.milestone ? 4 : 2.5)
        .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))');

      if (step.milestone) {
        stepG.append('circle')
          .attr('r', radius - 6)
          .attr('fill', '#22c55e');
      }

      // Conformance percentage inside circle
      if (viewMode === 'conformance' && !step.milestone) {
        stepG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 4)
          .attr('font-size', '9px')
          .attr('font-weight', '700')
          .attr('fill', step.conformance >= 95 ? '#64748b' : '#ef4444')
          .text(`${step.conformance}%`);
      }

      // Custom step indicator
      if (step.custom) {
        stepG.append('circle')
          .attr('cx', 16)
          .attr('cy', -16)
          .attr('r', 7)
          .attr('fill', '#8b5cf6');
        
        stepG.append('text')
          .attr('x', 16)
          .attr('y', -12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', '700')
          .attr('fill', 'white')
          .text('★');
      }

      // Step label below
      stepG.append('text')
        .attr('y', 42)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#1e293b')
        .text(step.name);

      // Critical deviation indicator
      if (step.critical && viewMode === 'conformance') {
        stepG.append('circle')
          .attr('cx', -18)
          .attr('cy', -18)
          .attr('r', 8)
          .attr('fill', '#ef4444');
        
        stepG.append('text')
          .attr('x', -18)
          .attr('y', -14)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('fill', 'white')
          .text('!');
      }
    });

    // Start indicator
    if (enabledSteps.length > 0) {
      const firstStep = enabledSteps[0];
      const firstPos = getStepPosition(firstStep);
      
      g.append('circle')
        .attr('cx', firstPos.x - 55)
        .attr('cy', firstPos.y)
        .attr('r', 7)
        .attr('fill', getPhaseColor(firstStep.phase));
      
      g.append('line')
        .attr('x1', firstPos.x - 48)
        .attr('y1', firstPos.y)
        .attr('x2', firstPos.x - 30)
        .attr('y2', firstPos.y)
        .attr('stroke', getPhaseColor(firstStep.phase))
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');
    }

  }, [isOpen, selectedStation, viewMode, flowDefinition]);

  if (!isOpen) return null;

  const enabledSteps = getEnabledSteps();
  const overallConformance = enabledSteps.length > 0 
    ? (enabledSteps.reduce((sum, s) => sum + s.conformance, 0) / enabledSteps.length).toFixed(1)
    : 0;
  const happyPathRate = 55.8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[92vh] max-w-[1500px] flex overflow-hidden">
        
        {/* Left Phase Sidebar */}
        <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phases</div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {phases.map((phase, idx) => {
              const phaseSteps = flowDefinition.steps[phase.id] || [];
              const enabledCount = phaseSteps.filter(s => s.enabled).length;
              const totalCount = phaseSteps.length;
              
              return (
                <div 
                  key={phase.id}
                  className="border-b border-slate-100"
                  style={{ background: phase.light }}
                >
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PhaseIcon phaseId={phase.id} className="w-5 h-5" style={{ color: phase.color }} />
                      <div className="flex-1">
                        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: phase.color }}>
                          {phase.shortName}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {phase.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Step count & control */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        {enabledCount} / {totalCount} steps
                      </span>
                      {viewMode === 'define' && (
                        <button
                          onClick={() => setShowAddStepModal(phase.id)}
                          className="p-1 rounded hover:bg-white/50 transition-colors"
                          title="Add step"
                        >
                          <Plus className="w-3.5 h-3.5" style={{ color: phase.color }} />
                        </button>
                      )}
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(enabledCount / Math.max(totalCount, 1)) * 100}%`,
                          background: phase.color 
                        }}
                      />
                    </div>
                  </div>

                  {/* Step list in Define mode */}
                  {viewMode === 'define' && (
                    <div className="px-3 pb-3 space-y-1">
                      {phaseSteps.map(step => (
                        <div 
                          key={step.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                            step.enabled ? 'bg-white/70' : 'bg-white/30 opacity-60'
                          }`}
                        >
                          <button
                            onClick={() => toggleStepEnabled(phase.id, step.id)}
                            className="flex-shrink-0"
                          >
                            {step.enabled ? (
                              <Eye className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                          <span className={`flex-1 truncate ${step.enabled ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                            {step.name}
                          </span>
                          {step.custom && (
                            <button
                              onClick={() => removeCustomStep(phase.id, step.id)}
                              className="p-0.5 hover:bg-red-100 rounded"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Define mode controls */}
          {viewMode === 'define' && (
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <button
                onClick={resetToDefault}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default
              </button>
            </div>
          )}
        </div>

        {/* Main visualization area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 flex-shrink-0 bg-white">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {viewMode === 'define' ? 'Flow Definition' : 'Process Conformance'}
              </h2>
              <p className="text-xs text-slate-500">
                {viewMode === 'define' 
                  ? 'Define your AMI activation journey — toggle steps or add custom ones'
                  : `${flowDefinition.name} · ${enabledSteps.length} steps · 534K cases analyzed`
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('conformance')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'conformance' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Conformance
                </button>
                <button
                  onClick={() => setViewMode('flow')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'flow' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Flow
                </button>
                <button
                  onClick={() => setViewMode('define')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'define' ? 'bg-white shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Define
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded transition-colors">
                  <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <span className="text-xs text-slate-500 w-9 text-center font-medium">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded transition-colors">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button onClick={handleResetZoom} className="p-1.5 hover:bg-white rounded transition-colors">
                  <Home className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden cursor-grab active:cursor-grabbing">
            <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'none' }} />
            
            {/* Watermark logos */}
            <div className="absolute bottom-4 right-4 flex items-center gap-4 opacity-25 pointer-events-none">
              <img src="/smartutilities-logo.png" alt="" className="h-6 object-contain" />
              <img src="/celonis-logo.png" alt="" className="h-5 object-contain" />
              <img src="/aws-logo.svg" alt="" className="h-6 object-contain" />
            </div>
            
            {/* Selected step detail overlay */}
            {selectedStation && (
              <div className="absolute top-4 left-4 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: phases.find(p => p.id === selectedStation.phase)?.color }}>
                    {phases.find(p => p.id === selectedStation.phase)?.shortName}
                  </span>
                  <button onClick={() => setSelectedStation(null)} className="p-1 hover:bg-slate-100 rounded">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">{selectedStation.name}</h4>
                <p className="text-xs text-slate-500 mb-4">{selectedStation.detail}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400 uppercase">Conformance</div>
                    <div className={`text-lg font-bold ${selectedStation.conformance >= 98 ? 'text-green-600' : selectedStation.conformance >= 95 ? 'text-amber-600' : 'text-red-600'}`}>
                      {selectedStation.conformance}%
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400 uppercase">Status</div>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">
                      {selectedStation.critical ? '⚠️ Critical' : selectedStation.milestone ? '✓ Milestone' : 'Normal'}
                    </div>
                  </div>
                </div>
                
                {selectedStation.deviation && (
                  <div className="py-2 px-3 bg-amber-50 rounded-lg mb-3">
                    <span className="text-xs font-semibold text-amber-700">⚠️ {selectedStation.deviation}</span>
                  </div>
                )}
                
                <button className="w-full py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                  View Deviating Cases
                </button>
              </div>
            )}

            {/* Collapsible Legend */}
            <div className="absolute bottom-4 left-4">
              {legendCollapsed ? (
                <button 
                  onClick={() => setLegendCollapsed(false)}
                  className="bg-white rounded-xl shadow-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600">Legend</span>
                </button>
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 w-56">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Conformance</span>
                    <button onClick={() => setLegendCollapsed(true)} className="p-1 hover:bg-slate-100 rounded">
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-green-500"></div>
                      <span className="text-slate-600">≥98% On Track</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-amber-500"></div>
                      <span className="text-slate-600">95-98% Minor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-red-500"></div>
                      <span className="text-slate-600">&lt;95% Critical</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <div className="w-5 h-0.5 border-t-2 border-dashed border-red-400"></div>
                      <span className="text-slate-600">Loop Back</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-6 overflow-x-auto">
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-green-600">{happyPathRate}%</div>
                <div className="text-[10px] text-slate-500">Happy Path</div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-slate-800">{overallConformance}%</div>
                <div className="text-[10px] text-slate-500">Conformance</div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-amber-600">14.6%</div>
                <div className="text-[10px] text-slate-500">Reschedule</div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-red-600">9.7%</div>
                <div className="text-[10px] text-slate-500">No Access</div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-purple-600">7.1%</div>
                <div className="text-[10px] text-slate-500">Comm Retry</div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-pink-600">0.73%</div>
                <div className="text-[10px] text-slate-500">Base Repair</div>
              </div>
              <div className="flex-shrink-0">
                <div className="text-xl font-bold text-blue-600">98.2%</div>
                <div className="text-[10px] text-slate-500">First Bill ✓</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Right Panel */}
        <div className={`border-l border-slate-200 flex flex-col bg-white transition-all duration-300 ${panelCollapsed ? 'w-10' : 'w-72'}`}>
          {panelCollapsed ? (
            <button 
              onClick={() => setPanelCollapsed(false)}
              className="flex-1 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-800">Deviation Analysis</h3>
                <button onClick={() => setPanelCollapsed(true)} className="p-1 hover:bg-slate-100 rounded transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Top Deviations</div>
                  {conformanceIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 rounded transition-colors -mx-1 px-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: issue.color }}></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700">{issue.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{issue.cause}</div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: issue.color }}>{issue.pct}%</span>
                    </div>
                  ))}
                </div>

                <div className="p-4">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Integration Points</div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-[10px] text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>HES (Head-End)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>MDM (Meter Data)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      <span>CIS (Customer Info)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span>WFM (Workforce)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white flex-shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Overall Score</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-green-600">{overallConformance}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${overallConformance}%` }}></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Step Modal */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Add Custom Step</h3>
              <button onClick={() => setShowAddStepModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Add a custom step to the <span className="font-semibold" style={{ color: phases.find(p => p.id === showAddStepModal)?.color }}>
                {phases.find(p => p.id === showAddStepModal)?.name}
              </span> phase.
            </p>
            <input
              type="text"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              placeholder="Step name..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addCustomStep(showAddStepModal, newStepName)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddStepModal(null)}
                className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addCustomStep(showAddStepModal, newStepName)}
                className="flex-1 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Add Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
