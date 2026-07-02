import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Clock, Filter, AlertTriangle, User, Calendar, CheckCircle2 } from 'lucide-react';

export default function TimelineRenderer({ nodes: initialNodes = [], width, height, onNodeClick, onNodeDoubleClick, selectedNode }: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'recent' | 'qualified'>('all');

  // Filter events logically based on criteria
  const filteredEvents = useMemo(() => {
    // Collect lead-level objects or cluster nodes
    const leadsList = initialNodes.filter((n: any) => n.lead);
    const nonLeads = initialNodes.filter((n: any) => !n.lead);

    if (activeFilter === 'critical') {
      // Retenção crítica / bottleneck nodes
      return initialNodes.filter((n: any) => n.isAlert || (n.lead && (n.lead.objections?.length > 0 || n.lead.objection)));
    } else if (activeFilter === 'recent') {
      // Recent leads created in last 7 days or matching stage
      return initialNodes.filter((n: any) => {
        if (!n.lead) return false;
        const elapsed = Date.now() - new Date(n.lead.createdAt).getTime();
        return elapsed < (7 * 24 * 60 * 60 * 1000) || n.lead.stage === 'recentes';
      });
    } else if (activeFilter === 'qualified') {
      // Leads qualified with credit approved or high budget
      return initialNodes.filter((n: any) => {
        if (!n.lead) return false;
        return n.lead.familyGrossIncome && n.lead.familyGrossIncome >= 5000;
      });
    }

    // Default: Sort logically chronologically
    return [...initialNodes].sort((a: any, b: any) => {
      const tA = a.lead?.createdAt ? new Date(a.lead.createdAt).getTime() : 0;
      const tB = b.lead?.createdAt ? new Date(b.lead.createdAt).getTime() : 0;
      return tB - tA; // Newest first
    });
  }, [initialNodes, activeFilter]);

  useEffect(() => {
    if (!svgRef.current || filteredEvents.length === 0) return;

    const w = width || 900;
    const h = height || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Enable zooming and panning on the timeline
    const zoom = d3.zoom()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    const nodeSpacing = 220;
    // Position nodes along a chronological linear flow
    const positionedNodes = filteredEvents.map((node: any, idx: number) => {
      const x = idx * nodeSpacing + 100;
      // Alternate nodes up and down relative to central timeline axis to reduce vertical overlap
      const y = idx % 2 === 0 ? -110 : 110;
      return { ...node, x, y, idx };
    });

    const timelineWidth = (positionedNodes.length - 1) * nodeSpacing + 250;

    // Apply initial translation zoom to center the timeline
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(80, h / 2).scale(0.8));

    // 1. Central Timeline glowing axis
    g.append("line")
      .attr("x1", -100)
      .attr("y1", 0)
      .attr("x2", timelineWidth)
      .attr("y2", 0)
      .attr("stroke", "#1e1b4b")
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round");

    g.append("line")
      .attr("x1", -100)
      .attr("y1", 0)
      .attr("x2", timelineWidth)
      .attr("y2", 0)
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .style("filter", "url(#time-glow)");

    // Defs for timeline glows
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "time-glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // 2. Render chronological milestone nodes on the axis itself (The anchors)
    const axisDots = g.selectAll(".axis-dot")
      .data(positionedNodes)
      .join("g")
      .attr("class", "axis-dot")
      .attr("transform", (d: any) => `translate(${d.x},0)`);

    // Vertical guide connection line from axis to card node (The Stalk)
    axisDots.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", (d: any) => d.y)
      .attr("stroke", (d: any) => d.isAlert ? "#ef4444" : d.color || "#4f46e5")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 4")
      .attr("opacity", 0.7);

    // Timeline Central Pearl indicator
    axisDots.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 6)
      .attr("fill", "#09090b")
      .attr("stroke", (d: any) => d.isAlert ? "#ef4444" : d.color || "#6366f1")
      .attr("stroke-width", 3.5)
      .style("filter", (d: any) => d.id === selectedNode?.id ? "url(#time-glow)" : "none");

    // Chronological Timestamp flag above axis
    axisDots.append("text")
      .attr("x", 0)
      .attr("y", (d: any) => d.idx % 2 === 0 ? 20 : -12)
      .attr("text-anchor", "middle")
      .attr("fill", "#71717a")
      .attr("font-size", "8.5px")
      .attr("font-weight", "black")
      .attr("font-family", "monospace")
      .text((d: any) => {
        if (d.lead?.createdAt) {
          const parsed = new Date(d.lead.createdAt);
          return isNaN(parsed.getTime()) ? `D+${d.idx}` : parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
        return `D+${d.idx}`;
      });

    // 3. Render event cards at positioned coordinates (The actual Sub-nodes)
    const cardG = g.selectAll(".timeline-card")
      .data(positionedNodes)
      .join("g")
      .attr("class", "timeline-card")
      .attr("transform", (d: any) => `translate(${d.x}, ${d.y > 0 ? d.y : d.y - 40})`)
      .attr("cursor", "pointer")
      .on("click", (e, d: any) => onNodeClick?.(d))
      .on("dblclick", (e, d: any) => onNodeDoubleClick?.(e, d))
      .style("opacity", (d: any) => selectedNode ? (d.id === selectedNode.id ? 1 : 0.15) : 1)
      .style("transition", "opacity 0.25s");

    // Card frame
    cardG.append("rect")
      .attr("x", -95)
      .attr("y", 0)
      .attr("width", 190)
      .attr("height", 48)
      .attr("rx", 10)
      .attr("fill", (d: any) => d.id === selectedNode?.id ? "#111827" : "#09090b")
      .attr("stroke", (d: any) => d.id === selectedNode?.id ? "#22d3ee" : d.isAlert ? "#991b1b" : "#27272a")
      .attr("stroke-width", (d: any) => d.id === selectedNode?.id ? 2 : 1)
      .style("filter", (d: any) => d.id === selectedNode?.id ? "url(#time-glow)" : "none");

    // Colored horizontal tab bar indicating stage category
    cardG.append("rect")
      .attr("x", -95)
      .attr("y", 0)
      .attr("width", 5)
      .attr("height", 48)
      .attr("rx", 2)
      .attr("fill", (d: any) => d.isAlert ? "#ef4444" : d.color || "#4f46e5");

    // Title / Lead Name
    cardG.append("text")
      .attr("x", -82)
      .attr("y", 16)
      .attr("fill", "#f4f4f5")
      .attr("font-size", "9.5px")
      .attr("font-weight", "black")
      .text((d: any) => d.label.length > 22 ? d.label.substring(0, 20) + '...' : d.label);

    // Detail / Action sub-label
    cardG.append("text")
      .attr("x", -82)
      .attr("y", 28)
      .attr("fill", "#a1a1aa")
      .attr("font-size", "7.5px")
      .attr("font-family", "monospace")
      .text((d: any) => d.detail ? (d.detail.length > 32 ? d.detail.substring(0, 30) + '...' : d.detail) : 'Sem detalhes de interação');

    // Display stage value
    cardG.append("text")
      .attr("x", -82)
      .attr("y", 38)
      .attr("fill", (d: any) => d.isAlert ? "#fca5a5" : "#a5b4fc")
      .attr("font-size", "7px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .text((d: any) => {
        const stage = d.lead?.stage || d.lead?.status || 'Fase';
        return `⚙️ PROCESSO: ${stage.toUpperCase()}`;
      });

    // Alert badge count icon inside cards
    cardG.filter((d: any) => !!d.isAlert)
      .append("circle")
      .attr("cx", 80)
      .attr("cy", 12)
      .attr("r", 5)
      .attr("fill", "#ef4444");

  }, [filteredEvents, width, height, selectedNode]);

  return (
    <div className="w-full h-full bg-[#040407] overflow-hidden relative flex flex-col select-none">
      {/* Control Filter Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col sm:flex-row gap-2 pointer-events-none">
        
        {/* Info panel */}
        <div className="bg-zinc-950/90 border-2 border-zinc-900 p-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm max-w-sm pointer-events-auto shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center border border-cyan-800 shrink-0">
            <Clock className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">Timeline Temporal de Leads</h4>
            <p className="text-[8.5px] text-zinc-500 font-mono">Linha de tempo cronológica conectando marcos operacionais com seus sub-nós correspondentes.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-950/90 border border-zinc-900 p-1.5 rounded-2xl flex items-center gap-1 backdrop-blur-sm pointer-events-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-xl text-[8.5px] font-extrabold uppercase tracking-tight transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'all' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1 rounded-xl text-[8.5px] font-extrabold uppercase tracking-tight transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'critical' ? 'bg-rose-950 text-rose-400 border border-rose-800/40 shadow-md' : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Gargalos
          </button>
          <button
            onClick={() => setActiveFilter('recent')}
            className={`px-3 py-1 rounded-xl text-[8.5px] font-extrabold uppercase tracking-tight transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'recent' ? 'bg-indigo-900 text-indigo-200 shadow-md' : 'text-zinc-400 hover:text-indigo-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            Recentes
          </button>
          <button
            onClick={() => setActiveFilter('qualified')}
            className={`px-3 py-1 rounded-xl text-[8.5px] font-extrabold uppercase tracking-tight transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'qualified' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40 shadow-md' : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Qualificados
          </button>
        </div>

      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#06b6d4 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
      <svg ref={svgRef} width="100%" height="100%" className="block cursor-grab active:cursor-grabbing relative z-10" />
    </div>
  );
}
