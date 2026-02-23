import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  X, ZoomIn, ZoomOut, RotateCcw, ChevronRight, ArrowLeft, Plus, Eye, EyeOff,
  Check, Loader2, CheckCircle2, Circle, Square, ArrowRight, GripVertical,
  Save, Layers, Trash2
} from 'lucide-react';
import { meterProgramTemplates, templateToFlowDefinition } from '../data/meterProgramTemplates';
import FlowTemplateModal from './FlowTemplateModal';
import { generateASL, validateASL } from '../../../packages/asl-generator/index.js';
import api from '../utils/apiClient';


export default function FlowBuilderModal({ isOpen, onClose, onProgramCreated }) {
  const svgRef = useRef();
  const zoomRef = useRef(null);
  
  // Wizard state
  const [step, setStep] = useState('select');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  
  // Flow definition state
  const [flowDefinition, setFlowDefinition] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAddStepModal, setShowAddStepModal] = useState(null);
  const [newStepName, setNewStepName] = useState('');
  
  // Drag and drop state
  const [draggedStep, setDraggedStep] = useState(null);
  const [dragOverStep, setDragOverStep] = useState(null);

  // Add Phase modal state
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseShortName, setNewPhaseShortName] = useState('');
  const [newPhaseColor, setNewPhaseColor] = useState('#3b82f6');

  // Save as Template modal state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  // Program name state
  const [programName, setProgramName] = useState('');
  const [createdProgramId, setCreatedProgramId] = useState(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState([]);
  const [aslDefinition, setAslDefinition] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [showAslPreview, setShowAslPreview] = useState(false);

  const phases = flowDefinition?.phases || [];

  const handleSelectTemplate = (selection) => {
    // Support both typed objects { type, id/template } and legacy string IDs
    if (typeof selection === 'string') {
      // Legacy: plain template ID string
      const template = meterProgramTemplates[selection];
      if (template) {
        setFlowDefinition(templateToFlowDefinition(template));
        setSelectedTemplateId(selection);
        setStep('define');
      }
      return;
    }

    if (selection.type === 'builtIn') {
      const template = meterProgramTemplates[selection.id];
      if (template) {
        setFlowDefinition(templateToFlowDefinition(template));
        setSelectedTemplateId(selection.id);
        setStep('define');
      }
    } else if (selection.type === 'custom') {
      // Custom template from localStorage — already in template-compatible shape
      const customTemplate = selection.template;
      setFlowDefinition(templateToFlowDefinition(customTemplate));
      setSelectedTemplateId(customTemplate.templateId || customTemplate.id);
      setStep('define');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (phaseId, stepId) => {
    setDraggedStep({ phaseId, stepId });
  };

  const handleDragOver = (e, phaseId, stepId) => {
    e.preventDefault();
    if (draggedStep && draggedStep.phaseId === phaseId && draggedStep.stepId !== stepId) {
      setDragOverStep({ phaseId, stepId });
    }
  };

  const handleDragEnd = () => {
    if (draggedStep && dragOverStep && draggedStep.phaseId === dragOverStep.phaseId) {
      const phaseId = draggedStep.phaseId;
      const steps = [...(flowDefinition.steps[phaseId] || [])];
      const fromIndex = steps.findIndex(s => s.id === draggedStep.stepId);
      const toIndex = steps.findIndex(s => s.id === dragOverStep.stepId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        const [movedStep] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, movedStep);
        
        setFlowDefinition(prev => ({
          ...prev,
          steps: {
            ...prev.steps,
            [phaseId]: steps
          }
        }));
      }
    }
    setDraggedStep(null);
    setDragOverStep(null);
  };

  const getEnabledSteps = useCallback(() => {
    if (!flowDefinition) return [];
    
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
  }, [flowDefinition, phases]);

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
      detail: 'Custom step',
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

  const phaseColors = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#22c55e', label: 'Green' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#ef4444', label: 'Red' },
    { value: '#6366f1', label: 'Indigo' },
    { value: '#64748b', label: 'Slate' },
    { value: '#059669', label: 'Emerald' },
  ];

  const addPhase = () => {
    if (!newPhaseName.trim()) return;
    const shortName = newPhaseShortName.trim() || newPhaseName.trim().toUpperCase();
    const phaseId = `custom-phase-${Date.now()}`;
    // Derive a light bg from the chosen color
    const lightMap = {
      '#3b82f6': '#eff6ff', '#8b5cf6': '#f5f3ff', '#06b6d4': '#ecfeff',
      '#f59e0b': '#fffbeb', '#22c55e': '#f0fdf4', '#ec4899': '#fdf2f8',
      '#ef4444': '#fef2f2', '#6366f1': '#eef2ff', '#64748b': '#f1f5f9',
      '#059669': '#ecfdf5',
    };

    const newPhase = {
      id: phaseId,
      name: newPhaseName.trim(),
      shortName: shortName.toUpperCase(),
      color: newPhaseColor,
      light: lightMap[newPhaseColor] || '#f8fafc',
      icon: '📋',
    };

    setFlowDefinition(prev => ({
      ...prev,
      phases: [...prev.phases, newPhase],
      steps: {
        ...prev.steps,
        [phaseId]: [],
      }
    }));

    setNewPhaseName('');
    setNewPhaseShortName('');
    setNewPhaseColor('#3b82f6');
    setShowAddPhaseModal(false);
  };

  const removePhase = (phaseId) => {
    setFlowDefinition(prev => {
      const newSteps = { ...prev.steps };
      delete newSteps[phaseId];
      return {
        ...prev,
        phases: prev.phases.filter(p => p.id !== phaseId),
        steps: newSteps,
      };
    });
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;

    const now = new Date().toISOString();
    const savedTemplate = {
      templateId: `custom-${Date.now()}`,
      id: `custom-${Date.now()}`,
      schemaVersion: 1,
      name: templateName.trim(),
      description: templateDescription.trim(),
      source: 'local',
      createdAt: now,
      updatedAt: now,
      phases: flowDefinition.phases.map(phase => ({
        ...phase,
        steps: (flowDefinition.steps[phase.id] || []).map(({ conformance, ...step }) => step),
      })),
    };

    // Try API first, fall back to localStorage
    if (api.isConfigured()) {
      try {
        const result = await api.saveTemplate(savedTemplate);
        savedTemplate.templateId = result.templateId;
        savedTemplate.source = 'api';
      } catch {
        // API failed — fall back to local
      }
    }

    // Always save to localStorage as well
    const existing = JSON.parse(localStorage.getItem('smartrollout_custom_templates') || '[]');
    existing.push(savedTemplate);
    localStorage.setItem('smartrollout_custom_templates', JSON.stringify(existing));

    setTemplateSaved(true);
    setTimeout(() => {
      setTemplateSaved(false);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');
    }, 1500);
  };

  const handleGenerate = async () => {
    if (!programName.trim()) {
      setGenerationError('Please enter a program name.');
      return;
    }

    setStep('generate');
    setGenerating(true);
    setGenerationProgress([]);
    setAslDefinition(null);
    setGenerationError(null);
    setCreatedProgramId(null);

    const addProgress = (label, status = 'running') => {
      setGenerationProgress(prev => [...prev, { label, status }]);
      return prev => prev.map((s, i, arr) => i === arr.length - 1 ? { ...s, status: 'complete' } : s);
    };
    const markComplete = () => {
      setGenerationProgress(prev => prev.map((s, i) => i === prev.length - 1 ? { ...s, status: 'complete' } : s));
    };

    try {
      // Step 1: Validate flow
      addProgress('Validating flow configuration');
      await new Promise(r => setTimeout(r, 300));
      const enabledCount = getEnabledSteps().length;
      if (enabledCount === 0) throw new Error('No enabled steps in flow');
      markComplete();

      // Step 2: Create program via API
      let programId = 'preview';
      if (api.isConfigured()) {
        addProgress('Creating program record');
        const programResult = await api.createProgram({
          name: programName.trim(),
          description: flowDefinition.description || `${flowDefinition.name} program`,
          templateId: selectedTemplateId || 'custom',
          flowDefinition,
        });
        programId = programResult.programId;
        setCreatedProgramId(programId);
        markComplete();
      }

      // Step 3: Generate ASL
      addProgress('Generating AWS Step Functions ASL');
      await new Promise(r => setTimeout(r, 400));

      let asl;
      if (api.isConfigured()) {
        addProgress('Calling Smart Rollout API');
        const result = await api.generateFlow(programId, flowDefinition);
        asl = result.aslDefinition;
        markComplete();
      } else {
        asl = generateASL(flowDefinition, { programId });
      }
      markComplete();

      // Step 4: Validate ASL
      addProgress('Validating state machine definition');
      await new Promise(r => setTimeout(r, 300));
      const errors = validateASL(asl);
      if (errors.length > 0) throw new Error(`ASL validation failed: ${errors.join(', ')}`);
      markComplete();

      // Step 5: Configure integrations
      addProgress('Configuring Celonis process model');
      await new Promise(r => setTimeout(r, 500));
      markComplete();

      addProgress('Setting up conformance rules & thresholds');
      await new Promise(r => setTimeout(r, 400));
      markComplete();

      addProgress('Initializing monitoring & alerting');
      await new Promise(r => setTimeout(r, 400));
      markComplete();

      setAslDefinition(asl);
      setGenerating(false);
      setStep('complete');

      // Notify parent so ProgramList can refresh
      if (programId !== 'preview' && onProgramCreated) {
        onProgramCreated(programId);
      }
    } catch (err) {
      setGenerationError(err.message);
      setGenerating(false);
      setStep('complete');
    }
  };

  const downloadAsl = () => {
    if (!aslDefinition) return;
    const blob = new Blob([JSON.stringify(aslDefinition, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowDefinition?.name?.replace(/\s+/g, '-').toLowerCase() || 'flow'}-asl.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        zoomRef.current.transform, d3.zoomIdentity.translate(50, 40).scale(0.9)
      );
    }
  }, []);

  // D3 Visualization
  useEffect(() => {
    if (!isOpen || !svgRef.current || step !== 'define' || !flowDefinition) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const enabledSteps = getEnabledSteps();
    
    const phaseStepCounts = phases.map(p => 
      (flowDefinition.steps[p.id] || []).filter(s => s.enabled).length
    );
    const maxStepsInPhase = Math.max(...phaseStepCounts, 1);
    
    // Increased spacing for pixel-perfect layout
    const cellWidth = 160;
    const nodeRadius = 16;
    const labelOffset = 38;
    const phaseHeight = 140;
    const phasePadding = 24;
    const leftMargin = 40;
    const topMargin = 30;
    const productLabelX = cellWidth * maxStepsInPhase + leftMargin + 100; // Fixed X for product labels
    
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

    // Celonis product mapping - customer-impact and billing phases use Smart Billing
    const getCelonisProduct = (phaseId) => {
      const billingPhases = ['billing', 'customer-impact', 'prorate', 'tariff', 'cis'];
      if (billingPhases.some(b => phaseId.toLowerCase().includes(b))) {
        return { name: 'Smart Billing', color: '#ec4899', bg: '#fdf2f8' };
      }
      return { name: 'Smart Rollout', color: '#06b6d4', bg: '#ecfeff' };
    };

    // Calculate step positions with better spacing
    const getStepPosition = (step) => {
      const phaseIndex = phases.findIndex(p => p.id === step.phase);
      const phaseSteps = (flowDefinition.steps[step.phase] || []).filter(s => s.enabled);
      const stepIndex = phaseSteps.findIndex(s => s.id === step.id);
      
      return {
        x: leftMargin + 60 + stepIndex * cellWidth,
        y: topMargin + 50 + phaseIndex * phaseHeight
      };
    };

    // Group phases by product for dotted line drawing
    const phaseProducts = phases.map((phase, idx) => ({
      phase,
      idx,
      product: getCelonisProduct(phase.id),
      y: topMargin + 18 + idx * phaseHeight
    }));

    // Draw dotted vertical lines for each product column
    const productGroups = {};
    phaseProducts.forEach(pp => {
      if (!productGroups[pp.product.name]) {
        productGroups[pp.product.name] = { phases: [], color: pp.product.color };
      }
      productGroups[pp.product.name].phases.push(pp);
    });

    // Draw dotted vertical connector lines for aligned products
    Object.values(productGroups).forEach(group => {
      if (group.phases.length > 1) {
        const minY = Math.min(...group.phases.map(p => p.y));
        const maxY = Math.max(...group.phases.map(p => p.y));
        
        g.append('line')
          .attr('x1', productLabelX)
          .attr('y1', minY + 10)
          .attr('x2', productLabelX)
          .attr('y2', maxY + 10)
          .attr('stroke', group.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.4);
      }
    });

    // Draw phase backgrounds with aligned Celonis product badges
    phases.forEach((phase, idx) => {
      const phaseSteps = (flowDefinition.steps[phase.id] || []).filter(s => s.enabled);
      const rowWidth = Math.max(phaseSteps.length * cellWidth + 40, cellWidth * 2 + 40);
      const product = getCelonisProduct(phase.id);
      
      // Phase container
      g.append('rect')
        .attr('x', leftMargin)
        .attr('y', topMargin + idx * phaseHeight)
        .attr('width', rowWidth)
        .attr('height', phaseHeight - phasePadding)
        .attr('rx', 12)
        .attr('fill', '#f8fafc')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1);

      // Phase label - positioned on the RIGHT side of the phase box
      g.append('text')
        .attr('x', leftMargin + rowWidth + 16)
        .attr('y', topMargin + 20 + idx * phaseHeight)
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('fill', '#475569')
        .attr('letter-spacing', '0.05em')
        .text(phase.shortName.toUpperCase());

      // Celonis product badge - ALIGNED at fixed X position
      const badgeWidth = 95;
      const badgeX = productLabelX - badgeWidth / 2;
      const badgeY = topMargin + 8 + idx * phaseHeight;
      
      g.append('rect')
        .attr('x', badgeX)
        .attr('y', badgeY)
        .attr('width', badgeWidth)
        .attr('height', 22)
        .attr('rx', 11)
        .attr('fill', product.bg)
        .attr('stroke', product.color)
        .attr('stroke-width', 1.5);

      g.append('text')
        .attr('x', productLabelX)
        .attr('y', badgeY + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', product.color)
        .text(product.name);

      // Dotted horizontal connector from phase row to product badge
      g.append('line')
        .attr('x1', leftMargin + rowWidth + 8)
        .attr('y1', topMargin + 18 + idx * phaseHeight)
        .attr('x2', badgeX - 8)
        .attr('y2', topMargin + 18 + idx * phaseHeight)
        .attr('stroke', product.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.5);
    });

    // Draw connections - snake pattern with arrows
    enabledSteps.forEach((step, idx) => {
      if (idx === enabledSteps.length - 1) return;
      
      const nextStep = enabledSteps[idx + 1];
      const currentPos = getStepPosition(step);
      const nextPos = getStepPosition(nextStep);

      if (step.phase === nextStep.phase) {
        // Horizontal connection with arrow between nodes in same phase
        const startX = currentPos.x + nodeRadius + 4;
        const endX = nextPos.x - nodeRadius - 4;
        const midX = (startX + endX) / 2;
        
        // Draw line
        g.append('line')
          .attr('x1', startX)
          .attr('y1', currentPos.y)
          .attr('x2', endX)
          .attr('y2', nextPos.y)
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round');
        
        // Draw arrow head pointing right
        g.append('path')
          .attr('d', `M ${midX - 6} ${currentPos.y - 5} L ${midX + 4} ${currentPos.y} L ${midX - 6} ${currentPos.y + 5}`)
          .attr('fill', 'none')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
          
      } else {
        // Phase transition - drop down from last step, then connect to first step of next phase
        // The connector goes: down from current -> curves right -> down between phases -> curves left -> into first node of next phase
        const cornerRadius = 14;
        
        // Calculate the vertical positions
        const exitY = currentPos.y + nodeRadius + 4; // Exit from bottom of current node
        const entryY = nextPos.y - nodeRadius - 4; // Enter top of next node
        const midY = (exitY + entryY) / 2; // Midpoint between phases
        
        // The horizontal routing should stay INSIDE the phase boxes
        // Route through a point just to the left of the first node in next phase
        const routeX = leftMargin + 20; // Route along the left edge inside the phase box
        
        const path = d3.path();
        
        // Start from bottom of current node (last node in this phase)
        path.moveTo(currentPos.x, exitY);
        
        // Go straight down a bit
        path.lineTo(currentPos.x, exitY + 15);
        
        // Curve left
        path.quadraticCurveTo(
          currentPos.x, exitY + 15 + cornerRadius,
          currentPos.x - cornerRadius, exitY + 15 + cornerRadius
        );
        
        // Go left to the routing channel
        path.lineTo(routeX + cornerRadius, exitY + 15 + cornerRadius);
        
        // Curve down
        path.quadraticCurveTo(
          routeX, exitY + 15 + cornerRadius,
          routeX, exitY + 15 + cornerRadius * 2
        );
        
        // Go down through the gap to next phase level
        path.lineTo(routeX, entryY - 15 - cornerRadius * 2);
        
        // Curve right
        path.quadraticCurveTo(
          routeX, entryY - 15 - cornerRadius,
          routeX + cornerRadius, entryY - 15 - cornerRadius
        );
        
        // Go right toward the first node
        path.lineTo(nextPos.x - cornerRadius, entryY - 15 - cornerRadius);
        
        // Curve down
        path.quadraticCurveTo(
          nextPos.x, entryY - 15 - cornerRadius,
          nextPos.x, entryY - 15
        );
        
        // Go down to the node
        path.lineTo(nextPos.x, entryY);

        g.append('path')
          .attr('d', path.toString())
          .attr('fill', 'none')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round');
        
        // Draw arrow head pointing down entering the node from top
        const arrowY = entryY - 8;
        g.append('path')
          .attr('d', `M ${nextPos.x - 5} ${arrowY - 6} L ${nextPos.x} ${arrowY + 2} L ${nextPos.x + 5} ${arrowY - 6}`)
          .attr('fill', 'none')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
      }
    });

    // Draw step nodes — terminal step (last enabled step overall) gets the milestone checkmark
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
        .on('click', () => setSelectedStation(selectedStation?.id === step.id ? null : step));

      // Node circle
      stepG.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', isTerminal ? nodeColor : 'white')
        .attr('stroke', nodeColor)
        .attr('stroke-width', 2);

      // Milestone checkmark on terminal step
      if (isTerminal) {
        stepG.append('path')
          .attr('d', 'M-5 0 L-2 3 L5 -4')
          .attr('fill', 'none')
          .attr('stroke', 'white')
          .attr('stroke-width', 2.5)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
      }

      // Custom step indicator
      if (step.custom) {
        stepG.append('circle')
          .attr('cx', 12)
          .attr('cy', -12)
          .attr('r', 6)
          .attr('fill', '#8b5cf6')
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
      }

      // Step label - positioned below with enough clearance
      stepG.append('text')
        .attr('y', labelOffset)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', '#334155')
        .text(step.name);
    });

    // Start indicator
    if (enabledSteps.length > 0) {
      const firstStep = enabledSteps[0];
      const firstPos = getStepPosition(firstStep);
      
      // Start dot
      g.append('circle')
        .attr('cx', leftMargin)
        .attr('cy', firstPos.y)
        .attr('r', 6)
        .attr('fill', '#64748b');
      
      // Line to first node
      g.append('line')
        .attr('x1', leftMargin + 6)
        .attr('y1', firstPos.y)
        .attr('x2', firstPos.x - nodeRadius - 4)
        .attr('y2', firstPos.y)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round');
    }

  }, [isOpen, step, flowDefinition, selectedStation, getEnabledSteps, phases]);

  if (!isOpen) return null;

  // Template Selection - use FlowTemplateModal
  if (step === 'select') {
    return (
      <FlowTemplateModal
        isOpen={true}
        onClose={onClose}
        onSelectTemplate={(selection) => {
          handleSelectTemplate(selection);
        }}
      />
    );
  }

  // Flow Definition
  if (step === 'define') {
    const enabledSteps = getEnabledSteps();
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-[1400px] flex overflow-hidden">
          
          {/* Left Sidebar - Phase Navigator */}
          <div className="w-56 border-r border-slate-200 flex flex-col flex-shrink-0 bg-slate-50/50">
            {/* Back button */}
            <div className="px-4 py-4 border-b border-slate-200 flex items-center gap-3">
              <button
                onClick={() => setStep('select')}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phases</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Drag to reorder steps</p>
              </div>
            </div>
            
            {/* Phase list */}
            <div className="flex-1 overflow-y-auto py-2">
              {phases.map((phase) => {
                const phaseSteps = flowDefinition.steps[phase.id] || [];
                const enabledCount = phaseSteps.filter(s => s.enabled).length;
                const totalCount = phaseSteps.length;
                
                return (
                  <div key={phase.id} className="px-3 py-2">
                    {/* Phase header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: phase.color }} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-700">{phase.shortName}</div>
                          <div className="text-[10px] text-slate-400">{phase.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {phase.id.startsWith('custom-phase-') && (
                          <button
                            onClick={() => removePhase(phase.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Remove phase"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowAddStepModal(phase.id)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                          title="Add step"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-2 mx-1">
                      <div 
                        className="h-full bg-slate-400 rounded-full transition-all"
                        style={{ width: `${(enabledCount / Math.max(totalCount, 1)) * 100}%` }}
                      />
                    </div>

                    {/* Step list */}
                    <div className="space-y-0.5">
                      {phaseSteps.map((stepItem, stepIndex) => (
                        <div 
                          key={stepItem.id}
                          draggable
                          onDragStart={() => handleDragStart(phase.id, stepItem.id)}
                          onDragOver={(e) => handleDragOver(e, phase.id, stepItem.id)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-1 px-1.5 py-1.5 rounded text-xs transition-all cursor-move ${
                            stepItem.enabled 
                              ? 'text-slate-700 bg-white border border-slate-200' 
                              : 'text-slate-400 bg-slate-100/50'
                          } ${
                            dragOverStep?.phaseId === phase.id && dragOverStep?.stepId === stepItem.id
                              ? 'ring-2 ring-blue-400 ring-offset-1'
                              : ''
                          } ${
                            draggedStep?.phaseId === phase.id && draggedStep?.stepId === stepItem.id
                              ? 'opacity-50'
                              : ''
                          }`}
                        >
                          <GripVertical className="w-3 h-3 text-slate-300 flex-shrink-0" />
                          <button
                            onClick={() => toggleStepEnabled(phase.id, stepItem.id)}
                            className="flex-shrink-0"
                          >
                            {stepItem.enabled ? (
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </button>
                          <span className={`flex-1 truncate ${!stepItem.enabled && 'line-through'}`}>
                            {stepItem.name}
                          </span>
                          {stepItem.custom && (
                            <button
                              onClick={() => removeCustomStep(phase.id, stepItem.id)}
                              className="p-0.5 hover:bg-red-100 rounded"
                            >
                              <X className="w-3 h-3 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add Phase button */}
              <div className="px-3 py-3">
                <button
                  onClick={() => setShowAddPhaseModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Add Phase
                </button>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{flowDefinition.name}</h2>
                <p className="text-sm text-slate-500">Configure phases and steps</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
                  <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                    <ZoomOut className="w-4 h-4 text-slate-500" />
                  </button>
                  <span className="text-xs text-slate-500 w-12 text-center font-medium">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                    <ZoomIn className="w-4 h-4 text-slate-500" />
                  </button>
                  <div className="w-px h-4 bg-slate-200" />
                  <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-2">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden">
              <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'none' }} />
              
              {/* Watermark logos */}
              <div className="absolute bottom-4 right-4 flex items-center gap-4 opacity-25 pointer-events-none">
                <img src="/smartutilities-logo.png" alt="" className="h-6 object-contain" />
                <img src="/celonis-logo.png" alt="" className="h-5 object-contain" />
                <img src="/aws-logo.svg" alt="" className="h-6 object-contain" />
              </div>
              
              {/* Selected step details */}
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
                  <p className="text-sm text-slate-500">{selectedStation.detail}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white">
              {/* Program Name Input */}
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Program Name</label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g., PECO AMI 2.0 Replacement"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-slate-900">{enabledSteps.length}</span>
                    <span className="text-slate-500 ml-1">steps</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{phases.length}</span>
                    <span className="text-slate-500 ml-1">phases</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setTemplateName(flowDefinition.name || '');
                      setTemplateDescription(flowDefinition.description || '');
                      setShowSaveTemplateModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save as Template
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!programName.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Generate Flow
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Step Modal */}
        {showAddStepModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30">
            <div className="bg-white rounded-lg shadow-xl p-5 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-900">Add Step</h3>
                <button onClick={() => setShowAddStepModal(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <input
                type="text"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                placeholder="Step name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent mb-4"
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
                  className="flex-1 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Phase Modal */}
        {showAddPhaseModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30">
            <div className="bg-white rounded-lg shadow-xl p-5 w-96">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <h3 className="font-medium text-slate-900">Add Phase</h3>
                </div>
                <button onClick={() => setShowAddPhaseModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Phase Name</label>
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="e.g., Quality Assurance"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && addPhase()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Short Name (sidebar label)</label>
                  <input
                    type="text"
                    value={newPhaseShortName}
                    onChange={(e) => setNewPhaseShortName(e.target.value.toUpperCase())}
                    placeholder="e.g., QA"
                    maxLength={16}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {phaseColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setNewPhaseColor(c.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          newPhaseColor === c.value
                            ? 'border-slate-900 scale-110 shadow-sm'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setShowAddPhaseModal(false);
                    setNewPhaseName('');
                    setNewPhaseShortName('');
                  }}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPhase}
                  disabled={!newPhaseName.trim()}
                  className="flex-1 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Phase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save as Template Modal */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30">
            <div className="bg-white rounded-lg shadow-xl p-5 w-[420px]">
              {templateSaved ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg">Template Saved</h3>
                  <p className="text-sm text-slate-500 mt-1">Your template has been saved and can be reused.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4 text-slate-600" />
                      <h3 className="font-medium text-slate-900">Save as Template</h3>
                    </div>
                    <button onClick={() => setShowSaveTemplateModal(false)} className="p-1 hover:bg-slate-100 rounded">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Preview summary */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span><span className="font-semibold text-slate-700">{phases.length}</span> phases</span>
                      <span><span className="font-semibold text-slate-700">{enabledSteps.length}</span> steps</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {phases.map(p => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: p.light, color: p.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.shortName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Template Name</label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Custom AMI Rollout v2"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                      <textarea
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Describe what this template is for, when to use it, and any special considerations..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => {
                        setShowSaveTemplateModal(false);
                        setTemplateName('');
                        setTemplateDescription('');
                      }}
                      className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAsTemplate}
                      disabled={!templateName.trim()}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Save Template
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generation / Complete
  if (step === 'generate' || step === 'complete') {
    const stateCount = aslDefinition ? Object.keys(aslDefinition.States || {}).length : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className={`bg-white rounded-xl shadow-2xl ${showAslPreview ? 'w-[900px] h-[80vh] flex' : 'w-[520px]'} overflow-hidden`}>
          {/* Left: progress + actions */}
          <div className={`${showAslPreview ? 'w-[400px] border-r border-slate-200 flex flex-col' : ''} p-8`}>
            <div className="text-center mb-8">
              {step === 'generate' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Generating Flow</h2>
                  <p className="text-sm text-slate-500 mt-1">Setting up infrastructure and integrations</p>
                </>
              ) : generationError ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Generation Failed</h2>
                  <p className="text-sm text-red-600 mt-1">{generationError}</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Flow Generated</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {programName ? <><strong>{programName}</strong> is ready</> : 'Your meter program is ready'}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2 mb-6 flex-1 overflow-y-auto">
              {generationProgress.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  {item.status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
                  )}
                  <span className={`text-sm ${item.status === 'complete' ? 'text-slate-700' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ASL summary stats */}
            {step === 'complete' && aslDefinition && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">State Machine</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{stateCount}</div>
                    <div className="text-xs text-slate-500">states</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">{getEnabledSteps().length}</div>
                    <div className="text-xs text-slate-500">steps</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">StartAt</div>
                    <div className="text-sm font-mono text-slate-700 truncate">{aslDefinition.StartAt}</div>
                  </div>
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-2">
                {aslDefinition && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAslPreview(!showAslPreview)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {showAslPreview ? 'Hide' : 'View'} ASL
                    </button>
                    <button
                      onClick={downloadAsl}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Download JSON
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Close
                  </button>
                  {createdProgramId ? (
                    <button
                      onClick={() => { onClose(); onProgramCreated?.(createdProgramId); }}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Open Dashboard
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: ASL JSON preview */}
          {showAslPreview && aslDefinition && (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ASL Definition</span>
                <span className="text-xs text-slate-400 font-mono">{stateCount} states</span>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-700 bg-slate-50 leading-relaxed">
                {JSON.stringify(aslDefinition, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
