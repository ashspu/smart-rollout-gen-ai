import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ProcessFlowD3({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 320;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    svg.attr('width', width).attr('height', height);

    // Nodes - process stages with teal-to-pink gradient theme
    const nodes = [
      { id: 'scheduled', label: 'Scheduled', x: 80, y: height / 2, count: data.scheduled, color: '#94a3b8' },
      { id: 'dispatched', label: 'Dispatched', x: 240, y: height / 2, count: data.dispatched, color: '#06b6d4' },
      { id: 'field', label: 'Field Work', x: 400, y: height / 2, count: data.fieldWork, color: '#8b5cf6' },
      { id: 'validation', label: 'Validation', x: 560, y: height / 2, count: data.validation, color: '#d946ef' },
      { id: 'complete', label: 'Complete', x: 720, y: height / 2, count: data.complete, color: '#ec4899' },
    ];

    // Exception loops
    const exceptions = [
      { from: 'field', to: 'scheduled', label: 'No Access', count: data.exceptions.noAccess, color: '#ef4444' },
      { from: 'validation', to: 'field', label: 'Failed QC', count: data.exceptions.failedQC, color: '#f97316' },
      { from: 'dispatched', to: 'scheduled', label: 'Reschedule', count: data.exceptions.reschedule, color: '#eab308' },
    ];

    // Main flow links
    const mainLinks = [
      { source: nodes[0], target: nodes[1], value: data.scheduled - data.exceptions.reschedule },
      { source: nodes[1], target: nodes[2], value: data.dispatched },
      { source: nodes[2], target: nodes[3], value: data.fieldWork - data.exceptions.noAccess },
      { source: nodes[3], target: nodes[4], value: data.validation - data.exceptions.failedQC },
    ];

    // Calculate stroke widths based on flow volume
    const maxFlow = Math.max(...mainLinks.map(l => l.value));
    const strokeScale = d3.scaleLinear().domain([0, maxFlow]).range([4, 24]);

    // Draw main flow paths
    const mainFlowGroup = svg.append('g').attr('class', 'main-flows');
    
    mainLinks.forEach(link => {
      const path = d3.path();
      path.moveTo(link.source.x + 50, link.source.y);
      path.bezierCurveTo(
        link.source.x + 80, link.source.y,
        link.target.x - 80, link.target.y,
        link.target.x - 50, link.target.y
      );

      mainFlowGroup.append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', strokeScale(link.value))
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.6);

      // Animated flow
      mainFlowGroup.append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', 'url(#flowGradient)')
        .attr('stroke-width', strokeScale(link.value) * 0.6)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', '10 20')
        .attr('opacity', 0.8)
        .style('animation', 'flowAnimation 2s linear infinite');
    });

    // Draw exception loops (curved paths going above or below)
    const exceptionGroup = svg.append('g').attr('class', 'exceptions');
    
    exceptions.forEach((exc, idx) => {
      const sourceNode = nodes.find(n => n.id === exc.from);
      const targetNode = nodes.find(n => n.id === exc.to);
      
      const yOffset = idx === 0 ? -80 : idx === 1 ? 80 : -50;
      const path = d3.path();
      path.moveTo(sourceNode.x, sourceNode.y - 35);
      path.bezierCurveTo(
        sourceNode.x, sourceNode.y + yOffset,
        targetNode.x, targetNode.y + yOffset,
        targetNode.x, targetNode.y - 35
      );

      // Exception path
      exceptionGroup.append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', exc.color)
        .attr('stroke-width', Math.max(2, exc.count / 500))
        .attr('stroke-dasharray', '6 4')
        .attr('opacity', 0.7);

      // Exception label
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = sourceNode.y + yOffset * 0.8;
      
      exceptionGroup.append('rect')
        .attr('x', midX - 45)
        .attr('y', midY - 12)
        .attr('width', 90)
        .attr('height', 24)
        .attr('rx', 12)
        .attr('fill', 'white')
        .attr('stroke', exc.color)
        .attr('stroke-width', 1.5);

      exceptionGroup.append('text')
        .attr('x', midX)
        .attr('y', midY + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', exc.color)
        .text(`${exc.label}: ${exc.count.toLocaleString()}`);
    });

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    nodes.forEach(node => {
      const g = nodeGroup.append('g').attr('transform', `translate(${node.x}, ${node.y})`);

      // Node background
      g.append('rect')
        .attr('x', -50)
        .attr('y', -35)
        .attr('width', 100)
        .attr('height', 70)
        .attr('rx', 14)
        .attr('fill', 'white')
        .attr('stroke', node.color)
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))');

      // Count
      g.append('text')
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', '700')
        .attr('fill', node.color)
        .text(node.count >= 1000 ? `${(node.count / 1000).toFixed(1)}K` : node.count);

      // Label
      g.append('text')
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', '#64748b')
        .text(node.label);
    });

    // Gradient definition - teal to pink theme
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'flowGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4');
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#8b5cf6');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#ec4899');

  }, [data]);

  return (
    <div className="relative">
      <style>{`
        @keyframes flowAnimation {
          from { stroke-dashoffset: 30; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <svg ref={svgRef} className="w-full" style={{ minHeight: 320 }} />
      
      {/* Watermark logos */}
      <div className="absolute bottom-3 right-3 flex items-center gap-3 opacity-30">
        <img src="/smartutilities-logo.png" alt="" className="h-5 object-contain" />
        <img src="/celonis-logo.png" alt="" className="h-4 object-contain" />
        <img src="/aws-logo.svg" alt="" className="h-5 object-contain" />
      </div>
    </div>
  );
}
