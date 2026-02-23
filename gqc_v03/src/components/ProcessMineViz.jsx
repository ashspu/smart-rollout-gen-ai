import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ProcessMineViz({ data }) {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 900;
    const height = 420;

    svg.attr('width', width).attr('height', height);

    // Define the AMI deployment process stages
    const stages = [
      { id: 'identify', label: 'Identify', x: 70, color: '#64748b' },
      { id: 'schedule', label: 'Schedule', x: 190, color: '#3b82f6' },
      { id: 'notify', label: 'Notify', x: 310, color: '#8b5cf6' },
      { id: 'dispatch', label: 'Dispatch', x: 430, color: '#06b6d4' },
      { id: 'install', label: 'Install', x: 550, color: '#f59e0b' },
      { id: 'commission', label: 'Commission', x: 670, color: '#10b981' },
      { id: 'complete', label: 'Complete', x: 790, color: '#22c55e' },
    ];

    // Process variants (paths through the system) - Celonis style
    const variants = [
      { 
        id: 'happy', 
        name: 'Happy Path', 
        cases: 312400, 
        pct: 72,
        path: ['identify', 'schedule', 'notify', 'dispatch', 'install', 'commission', 'complete'],
        color: '#22c55e',
        opacity: 0.7
      },
      { 
        id: 'reschedule', 
        name: 'Reschedule Loop', 
        cases: 48200, 
        pct: 11,
        path: ['identify', 'schedule', 'notify', 'dispatch', 'schedule', 'notify', 'dispatch', 'install', 'commission', 'complete'],
        color: '#f59e0b',
        opacity: 0.6
      },
      { 
        id: 'no-access', 
        name: 'No Access → Retry', 
        cases: 38600, 
        pct: 9,
        path: ['identify', 'schedule', 'notify', 'dispatch', 'install', 'dispatch', 'install', 'commission', 'complete'],
        color: '#ef4444',
        opacity: 0.5
      },
      { 
        id: 'failed-comm', 
        name: 'Failed Commission', 
        cases: 21800, 
        pct: 5,
        path: ['identify', 'schedule', 'notify', 'dispatch', 'install', 'commission', 'install', 'commission', 'complete'],
        color: '#8b5cf6',
        opacity: 0.5
      },
      { 
        id: 'meter-issue', 
        name: 'Meter Defect', 
        cases: 13000, 
        pct: 3,
        path: ['identify', 'schedule', 'notify', 'dispatch', 'install', 'identify', 'schedule', 'notify', 'dispatch', 'install', 'commission', 'complete'],
        color: '#ec4899',
        opacity: 0.4
      },
    ];

    const defs = svg.append('defs');

    // Gradients for each stage
    stages.forEach(stage => {
      const grad = defs.append('linearGradient')
        .attr('id', `grad-${stage.id}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', stage.color).attr('stop-opacity', 0.9);
      grad.append('stop').attr('offset', '100%').attr('stop-color', stage.color).attr('stop-opacity', 0.7);
    });

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw flow paths (Sankey-like curves)
    const flowGroup = svg.append('g').attr('class', 'flows');
    
    // Calculate flow thickness based on case count
    const maxCases = Math.max(...variants.map(v => v.cases));
    const strokeScale = d3.scaleLinear().domain([0, maxCases]).range([3, 28]);

    // Y positions for each variant lane
    const laneHeight = 50;
    const baseY = 180;

    variants.forEach((variant, vIdx) => {
      const pathPoints = [];
      let currentX = stages.find(s => s.id === variant.path[0]).x;
      const yOffset = baseY + (vIdx - 2) * laneHeight;

      variant.path.forEach((stepId, idx) => {
        const stage = stages.find(s => s.id === stepId);
        const nextStep = variant.path[idx + 1];
        const nextStage = nextStep ? stages.find(s => s.id === nextStep) : null;

        if (idx === 0) {
          pathPoints.push({ x: stage.x, y: yOffset });
        }

        if (nextStage) {
          // Check if going backwards (exception loop)
          if (nextStage.x < stage.x) {
            // Loop back - curve up and over
            const loopHeight = yOffset - 60 - vIdx * 10;
            pathPoints.push({ x: stage.x + 20, y: yOffset });
            pathPoints.push({ x: stage.x + 20, y: loopHeight, curve: true });
            pathPoints.push({ x: nextStage.x - 20, y: loopHeight });
            pathPoints.push({ x: nextStage.x - 20, y: yOffset, curve: true });
            pathPoints.push({ x: nextStage.x, y: yOffset });
          } else {
            pathPoints.push({ x: nextStage.x, y: yOffset });
          }
        }
      });

      // Build path string
      let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
      for (let i = 1; i < pathPoints.length; i++) {
        const prev = pathPoints[i - 1];
        const curr = pathPoints[i];
        
        if (curr.curve || (i > 0 && pathPoints[i-1].curve)) {
          // Use bezier for curves
          const cp1x = prev.x + (curr.x - prev.x) * 0.5;
          const cp1y = prev.y;
          const cp2x = prev.x + (curr.x - prev.x) * 0.5;
          const cp2y = curr.y;
          pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else {
          pathD += ` L ${curr.x} ${curr.y}`;
        }
      }

      // Draw the flow
      flowGroup.append('path')
        .attr('d', pathD)
        .attr('fill', 'none')
        .attr('stroke', variant.color)
        .attr('stroke-width', strokeScale(variant.cases))
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('opacity', variant.opacity)
        .style('filter', variant.id === 'happy' ? 'url(#glow)' : null);

      // Animated particles along happy path
      if (variant.id === 'happy') {
        const particlePath = flowGroup.append('path')
          .attr('d', pathD)
          .attr('fill', 'none')
          .attr('stroke', 'white')
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '8 40')
          .attr('stroke-linecap', 'round')
          .attr('opacity', 0.8);

        // Animate
        function animateParticles() {
          particlePath
            .attr('stroke-dashoffset', 0)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', -48)
            .on('end', animateParticles);
        }
        animateParticles();
      }
    });

    // Draw stage nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    stages.forEach((stage, idx) => {
      const g = nodeGroup.append('g').attr('transform', `translate(${stage.x}, ${baseY})`);

      // Node circle with gradient
      g.append('circle')
        .attr('r', 32)
        .attr('fill', `url(#grad-${stage.id})`)
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))');

      // Stage number
      g.append('text')
        .attr('y', 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('fill', 'white')
        .text(idx + 1);

      // Stage label
      g.append('text')
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#475569')
        .text(stage.label);

      // Count at stage (current WIP)
      if (data.stageWIP && data.stageWIP[stage.id]) {
        g.append('text')
          .attr('y', 72)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', '500')
          .attr('fill', '#94a3b8')
          .text(`${(data.stageWIP[stage.id] / 1000).toFixed(1)}K`);
      }
    });

    // Variant legend
    const legendGroup = svg.append('g').attr('transform', `translate(${width - 180}, 30)`);
    
    legendGroup.append('text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .attr('text-transform', 'uppercase')
      .attr('letter-spacing', '0.5px')
      .text('Process Variants');

    variants.forEach((variant, idx) => {
      const y = 25 + idx * 22;
      
      legendGroup.append('line')
        .attr('x1', 0).attr('y1', y)
        .attr('x2', 20).attr('y2', y)
        .attr('stroke', variant.color)
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round')
        .attr('opacity', variant.opacity + 0.2);

      legendGroup.append('text')
        .attr('x', 28).attr('y', y + 4)
        .attr('font-size', '10px')
        .attr('fill', '#64748b')
        .text(`${variant.name}`);

      legendGroup.append('text')
        .attr('x', 140).attr('y', y + 4)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', variant.color)
        .attr('text-anchor', 'end')
        .text(`${variant.pct}%`);
    });

    // Bottleneck indicator
    if (data.bottleneck) {
      const bottleneckStage = stages.find(s => s.id === data.bottleneck.stage);
      if (bottleneckStage) {
        const bGroup = svg.append('g').attr('transform', `translate(${bottleneckStage.x}, ${baseY - 55})`);
        
        bGroup.append('rect')
          .attr('x', -45).attr('y', -12)
          .attr('width', 90).attr('height', 24)
          .attr('rx', 12)
          .attr('fill', '#fef2f2')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.5);

        bGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('fill', '#dc2626')
          .text(`⚠ ${data.bottleneck.label}`);
      }
    }

  }, [data]);

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="w-full" style={{ minHeight: 420 }} />
      
      {/* Watermark logos */}
      <div className="absolute bottom-3 right-3 flex items-center gap-3 opacity-30 pointer-events-none">
        <img src="/smartutilities-logo.png" alt="" className="h-5 object-contain" />
        <img src="/celonis-logo.png" alt="" className="h-4 object-contain" />
        <img src="/aws-logo.svg" alt="" className="h-5 object-contain" />
      </div>
    </div>
  );
}
