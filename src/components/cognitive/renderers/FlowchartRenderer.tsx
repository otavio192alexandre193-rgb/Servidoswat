import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Play, RotateCcw, Info, CheckSquare, Zap, Activity } from 'lucide-react';

export default function FlowchartRenderer({ nodes: initialNodes = [], links: initialLinks = [], width, height, onNodeClick, onNodeDoubleClick, selectedNode }: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  // Define 5 Core Chronological Pipeline Columns
  const FLOW_COLUMNS = [
    { id: 'col-entrada', title: '1. ENTRADA & TRIAGEM', color: '#a855f7', desc: 'Captação, triagem via WhatsApp e origens' },
    { id: 'col-qualificacao', title: '2. QUALIFICAÇÃO & CRÉDITO', color: '#3b82f6', desc: 'Análise de renda, holerites e FGTS' },
    { id: 'col-compatibilizacao', title: '3. COMPATIBILIZAÇÃO', color: '#10b981', desc: 'Cruzamento com estoque de imóveis' },
    { id: 'col-negociacao', title: '4. PROPOSTA & NEGOCIAÇÃO', color: '#f59e0b', desc: 'Tratamento de objeções e parcelamento' },
    { id: 'col-conversao', title: '5. CONVERSÃO & O.S.', color: '#ec4899', desc: 'Crédito aprovado, geração de O.S. e fechamento' }
  ];

  useEffect(() => {
    if (!svgRef.current || initialNodes.length === 0) return;

    const w = width || 900;
    const h = height || 600;

    // 1. Map nodes into the 5 chronological columns
    const columnMap: Record<string, any[]> = {
      'col-entrada': [],
      'col-qualificacao': [],
      'col-compatibilizacao': [],
      'col-negociacao': [],
      'col-conversao': []
    };

    initialNodes.forEach((node: any) => {
      let targetCol = 'col-entrada';
      const labelLower = (node.label || '').toLowerCase();
      const idLower = (node.id || '').toLowerCase();

      // Categorize based on group, ID and label text
      if (idLower.startsWith('origin-') || idLower.includes('novo') || idLower.includes('triagem') || node.group === 2 || node.group === 10) {
        targetCol = 'col-entrada';
      } else if (idLower.includes('qual') || idLower.includes('perfil') || idLower.includes('renda') || idLower.includes('credito') || node.group === 21 || node.group === 23 || node.group === 13) {
        targetCol = 'col-qualificacao';
      } else if (idLower.includes('compat') || idLower.includes('imovel') || idLower.includes('vaga') || node.group === 5 || node.group === 12) {
        targetCol = 'col-compatibilizacao';
      } else if (idLower.includes('objec') || idLower.includes('negoc') || idLower.includes('proposta') || node.group === 22) {
        targetCol = 'col-negociacao';
      } else if (idLower.includes('fech') || idLower.includes('os-') || idLower.includes('convers') || node.group === 4 || node.group === 24 || node.group === 14) {
        targetCol = 'col-conversao';
      } else {
        // Fallback mapping based on status fields
        const statusVal = node.lead?.status || node.lead?.stage || '';
        if (statusVal === 'novo' || statusVal === 'triagem') targetCol = 'col-entrada';
        else if (statusVal === 'qualificacao') targetCol = 'col-qualificacao';
        else if (statusVal === 'compatibilizacao') targetCol = 'col-compatibilizacao';
        else if (statusVal === 'objecao') targetCol = 'col-negociacao';
        else if (statusVal === 'fechamento') targetCol = 'col-conversao';
        else targetCol = 'col-entrada';
      }

      columnMap[targetCol].push(node);
    });

    const colWidth = 260;
    const rowHeight = 70;
    const positionedNodes = new Map<string, any>();

    // Sort and position nodes inside each column
    FLOW_COLUMNS.forEach((col, colIdx) => {
      const x = colIdx * colWidth + 50;
      const nodesInCol = columnMap[col.id];

      // Render up to 25 nodes per column to keep the diagram readable and performant
      nodesInCol.slice(0, 25).forEach((node, rowIdx) => {
        const y = rowIdx * rowHeight + 100;
        
        // Define if it is a decision gate (diamonds) or a lead sub-node
        const isDecisionGate = node.isCluster || node.group === 3 || node.group === 20;
        positionedNodes.set(node.id, {
          ...node,
          x,
          y,
          colIdx,
          colId: col.id,
          isDecision: isDecisionGate
        });
      });
    });

    const d3Nodes = Array.from(positionedNodes.values());

    // 2. Compute connections (links) with explicit paths between columns
    const d3Links: any[] = [];

    // Add automatic chronological flowchart step connections
    for (let i = 0; i < FLOW_COLUMNS.length - 1; i++) {
      const currentColId = FLOW_COLUMNS[i].id;
      const nextColId = FLOW_COLUMNS[i+1].id;
      
      const currentNodes = d3Nodes.filter(n => n.colId === currentColId && n.isDecision);
      const nextNodes = d3Nodes.filter(n => n.colId === nextColId && n.isDecision);

      if (currentNodes.length > 0 && nextNodes.length > 0) {
        // Connect the primary decision gates chronologically
        d3Links.push({
          source: currentNodes[0].id,
          target: nextNodes[0].id,
          type: 'process-flow',
          label: 'Avanço de Etapa ➔'
        });
      }
    }

    // Map existing initial relations into our coordinate grid
    initialLinks.forEach((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;

      if (positionedNodes.has(sourceId) && positionedNodes.has(targetId)) {
        d3Links.push({
          source: sourceId,
          target: targetId,
          type: l.type || 'logical-link',
          label: l.label || ''
        });
      }
    });

    // Format source and target as fully positioned objects for D3 drawing
    const formattedLinks = d3Links.map(l => ({
      ...l,
      sourceObj: positionedNodes.get(l.source),
      targetObj: positionedNodes.get(l.target)
    })).filter(l => l.sourceObj && l.targetObj);

    // 3. Draw with D3
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Enable zooming & panning
    const zoom = d3.zoom()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    // Initial positioning to center the flowchart
    const totalWidth = FLOW_COLUMNS.length * colWidth;
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(Math.max(40, (w / 2) - (totalWidth / 2.3)), 80).scale(0.85));

    // Defs & Arrows
    const defs = svg.append("defs");
    
    // Default flow arrow
    defs.append("marker")
      .attr("id", "flowchart-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Cyan glowing arrow for selected paths
    defs.append("marker")
      .attr("id", "glow-arrow-cyan")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#22d3ee");

    // Glow filter
    const filter = defs.append("filter").attr("id", "flow-glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Column Headers
    FLOW_COLUMNS.forEach((col, colIdx) => {
      const colX = colIdx * colWidth + 50;

      // Vertical background divider rails
      g.append("rect")
        .attr("x", colX - 15)
        .attr("y", 10)
        .attr("width", colWidth - 25)
        .attr("height", h + 400)
        .attr("fill", "#18181b")
        .attr("opacity", 0.2)
        .attr("rx", 16)
        .attr("stroke", "#27272a")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");

      // Header top bar
      g.append("rect")
        .attr("x", colX - 15)
        .attr("y", 15)
        .attr("width", colWidth - 25)
        .attr("height", 45)
        .attr("fill", "#09090b")
        .attr("rx", 8)
        .attr("stroke", col.color)
        .attr("stroke-width", 1.5);

      // Title Text
      g.append("text")
        .attr("x", colX + (colWidth - 25) / 2)
        .attr("y", 40)
        .attr("fill", "#ffffff")
        .attr("font-size", "10px")
        .attr("font-weight", "900")
        .attr("font-family", "monospace")
        .attr("text-anchor", "middle")
        .text(col.title);

      // Subtitle Desc
      g.append("text")
        .attr("x", colX + (colWidth - 25) / 2)
        .attr("y", 52)
        .attr("fill", "#71717a")
        .attr("font-size", "7.5px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(col.desc);
    });

    // Draw Links (Curved S-Paths)
    const linkGenerator = d3.linkHorizontal()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    const linksG = g.append("g")
      .selectAll("g")
      .data(formattedLinks)
      .join("g");

    linksG.append("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
        const isHighlighted = selectedNode && (d.sourceObj.id === selectedNode.id || d.targetObj.id === selectedNode.id);
        if (isHighlighted) return '#22d3ee';
        if (d.type === 'process-flow') return '#4f46e5';
        return '#3f3f46';
      })
      .attr("stroke-width", (d: any) => {
        const isHighlighted = selectedNode && (d.sourceObj.id === selectedNode.id || d.targetObj.id === selectedNode.id);
        return isHighlighted ? 2.5 : 1.2;
      })
      .attr("opacity", (d: any) => {
        if (!selectedNode) return d.type === 'process-flow' ? 0.7 : 0.4;
        const isRelated = d.sourceObj.id === selectedNode.id || d.targetObj.id === selectedNode.id;
        return isRelated ? 1 : 0.08;
      })
      .attr("marker-end", (d: any) => {
        const isHighlighted = selectedNode && (d.sourceObj.id === selectedNode.id || d.targetObj.id === selectedNode.id);
        return isHighlighted ? "url(#glow-arrow-cyan)" : "url(#flowchart-arrow)";
      })
      .attr("d", (d: any) => {
        // Calculate offsets for precise exit and entry points
        const startX = d.sourceObj.x + (d.sourceObj.isDecision ? 120 : 155);
        const startY = d.sourceObj.y + (d.sourceObj.isDecision ? 25 : 22);
        const endX = d.targetObj.x;
        const endY = d.targetObj.y + (d.targetObj.isDecision ? 25 : 22);

        return linkGenerator({
          source: { x: startX, y: startY },
          target: { x: endX, y: endY }
        } as any);
      })
      .attr("stroke-dasharray", function(this: any) { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function(this: any) { return this.getTotalLength(); })
      .transition().duration(600)
      .attr("stroke-dashoffset", 0);

    // Draw Links Text/Labels
    linksG.filter(d => !!d.label && (!selectedNode || d.sourceObj.id === selectedNode.id || d.targetObj.id === selectedNode.id))
      .append("text")
      .attr("x", (d: any) => (d.sourceObj.x + d.targetObj.x + 100) / 2)
      .attr("y", (d: any) => (d.sourceObj.y + d.targetObj.y + 40) / 2 - 4)
      .attr("fill", "#a1a1aa")
      .attr("font-size", "7.5px")
      .attr("font-weight", "black")
      .attr("font-family", "monospace")
      .attr("text-anchor", "middle")
      .text((d: any) => d.label);

    // Draw Nodes
    const nodesG = g.append("g")
      .selectAll("g")
      .data(d3Nodes)
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .on("click", (e, d: any) => onNodeClick?.(d))
      .on("dblclick", (e, d: any) => onNodeDoubleClick?.(e, d))
      .style("opacity", (d: any) => {
        if (!selectedNode) return 1;
        if (d.id === selectedNode.id) return 1;
        const isConnected = formattedLinks.some((l: any) => 
          (l.sourceObj.id === selectedNode.id && l.targetObj.id === d.id) ||
          (l.targetObj.id === selectedNode.id && l.sourceObj.id === d.id)
        );
        return isConnected ? 1 : 0.15;
      })
      .style("transition", "opacity 0.2s");

    // 1. RENDER DECISION GATES / CLUSTERS (Horizontal Hexagons)
    const decisionNodes = nodesG.filter(d => d.isDecision);
    decisionNodes.append("path")
      .attr("d", "M 15 0 L 105 0 L 120 25 L 105 50 L 15 50 L 0 25 Z")
      .attr("fill", (d: any) => d.id === selectedNode?.id ? "#1e1b4b" : "#09090b")
      .attr("stroke", (d: any) => d.id === selectedNode?.id ? "#818cf8" : d.color || "#4f46e5")
      .attr("stroke-width", (d: any) => d.id === selectedNode?.id ? 2.5 : 1.5)
      .style("filter", (d: any) => d.id === selectedNode?.id ? "url(#flow-glow)" : "none");

    decisionNodes.append("text")
      .attr("x", 60)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "9px")
      .attr("font-weight", "black")
      .attr("font-family", "sans-serif")
      .text((d: any) => d.label.length > 18 ? d.label.substring(0, 15) + '...' : d.label);

    decisionNodes.append("circle")
      .attr("cx", 60)
      .attr("cy", 40)
      .attr("r", 3)
      .attr("fill", (d: any) => d.color || "#4f46e5");

    // 2. RENDER SUB-NODES / LEAD CARDS (Rounded Rectangles)
    const cardNodes = nodesG.filter(d => !d.isDecision);
    cardNodes.append("rect")
      .attr("width", 155)
      .attr("height", 44)
      .attr("rx", 10)
      .attr("fill", (d: any) => d.id === selectedNode?.id ? "#164e63" : "#09090b")
      .attr("stroke", (d: any) => d.id === selectedNode?.id ? "#22d3ee" : "#27272a")
      .attr("stroke-width", (d: any) => d.id === selectedNode?.id ? 2 : 1)
      .style("filter", (d: any) => d.id === selectedNode?.id ? "url(#flow-glow)" : "none");

    // Colored vertical indicator bar inside lead card
    cardNodes.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 4)
      .attr("height", 44)
      .attr("rx", 2)
      .attr("fill", (d: any) => d.color || "#ec4899");

    // Lead Name Text
    cardNodes.append("text")
      .attr("x", 12)
      .attr("y", 16)
      .attr("fill", "#f4f4f5")
      .attr("font-size", "9.5px")
      .attr("font-weight", "bold")
      .text((d: any) => d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label);

    // Lead Subtext / Detail (e.g. Income or phone)
    cardNodes.append("text")
      .attr("x", 12)
      .attr("y", 30)
      .attr("fill", "#a1a1aa")
      .attr("font-size", "7.5px")
      .attr("font-family", "monospace")
      .text((d: any) => d.detail ? (d.detail.length > 28 ? d.detail.substring(0, 26) + '...' : d.detail) : '');

    // Active Alarm pulse dot on card if present
    cardNodes.filter(d => !!d.isAlert)
      .append("circle")
      .attr("cx", 145)
      .attr("cy", 12)
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .append("animate")
      .attr("attributeName", "opacity")
      .attr("values", "1;0.2;1")
      .attr("dur", "1.2s")
      .attr("repeatCount", "indefinite");

  }, [initialNodes, initialLinks, width, height, selectedNode]);

  return (
    <div className="w-full h-full bg-[#030305] overflow-hidden relative flex flex-col">
      {/* Absolute Header with Instructions & Legend */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-2">
        <div className="bg-zinc-950/90 border-2 border-zinc-900 p-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm max-w-sm pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 flex items-center justify-center border border-indigo-700 shrink-0">
            <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">Fluxograma Cognitivo</h4>
            <p className="text-[8.5px] text-zinc-500 font-mono">Arraste para navegar, use scroll para zoom. Clique em qualquer nó para realçar caminhos e conexões operacionais.</p>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-zinc-950/80 border border-zinc-900 px-3 py-1.5 rounded-xl flex items-center gap-4 text-[8px] font-mono tracking-wider font-bold text-zinc-400 pointer-events-auto w-fit">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-1.5 bg-indigo-600 rounded"></div>
            <span>Fluxo Principal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-purple-500 rounded-sm"></div>
            <span>Portas de Decisão</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-zinc-900 border border-zinc-700 rounded-sm"></div>
            <span>Sub-nós (Leads)</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1.5px, transparent 1.5px), linear-gradient(90deg, #4f46e5 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />
      <svg ref={svgRef} width="100%" height="100%" className="block cursor-grab active:cursor-grabbing relative z-10" />
    </div>
  );
}
