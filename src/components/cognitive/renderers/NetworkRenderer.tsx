import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function NetworkRenderer({ nodes: initialNodes, links: initialLinks, width, height, onNodeClick, onNodeDoubleClick, selectedNode, highlightFilter, searchTerm, is3D }: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>(null);
  const elementsRef = useRef<{ node: any, link: any }>({ node: null, link: null });

  // 1. Initialize Simulation and DOM structure
  useEffect(() => {
    if (!svgRef.current || initialNodes.length === 0) return;

    // Local mutable copy for D3
    const nodes = initialNodes.map((n: any) => ({ ...n }));
    const links = initialLinks.map((l: any) => ({ ...l }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        // Semantic zooming - hide text when zoomed out far
        if (event.transform.k < 0.5) {
           g.selectAll(".node-label").style("opacity", 0);
        } else {
           // Re-apply highlight filtering opacity
           g.selectAll(".node-label").style("opacity", (d: any) => {
             return isHighlighted(d, highlightFilter, searchTerm) ? 1 : 0.2;
           });
        }
      });
    svg.call(zoom as any);
    
    // Initial centering
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));

    const defs = svg.append("defs");

    // Glow filter
    const filter = defs.append("filter").attr("id", "glow-net");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Links
    const link = g.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("class", "graph-link")
      .attr("stroke", (d: any) => d.color || "#3f3f46")
      .attr("stroke-width", (d: any) => Math.max(1, Math.sqrt(d.value || 1)))
      .attr("opacity", 0.6);

    // Draw Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "graph-node")
      .attr("cursor", "pointer")
      .on("click", (e, d) => onNodeClick?.(d))
      .on("dblclick", (e, d) => onNodeDoubleClick?.(e, d))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Base circle
    node.append("circle")
      .attr("class", "node-circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => d.color || "#3b82f6")
      .attr("stroke", "#18181b")
      .attr("stroke-width", 2)
      .transition()
      .duration(750)
      .attr("r", (d: any) => d.radius);

    // Labels
    node.append("text")
      .attr("class", "node-label")
      .text((d: any) => d.label.length > 20 ? d.label.substring(0,20)+'...' : d.label)
      .attr("x", 0)
      .attr("y", (d: any) => d.radius + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#e4e4e7")
      .attr("font-size", "11px")
      .attr("font-family", "sans-serif")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .style("text-shadow", "0px 2px 4px rgba(0,0,0,0.8)");

    elementsRef.current = { node, link };

    // Setup Force Simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("x", d3.forceX(0).strength(0.05))
      .force("y", d3.forceY(0).strength(0.05))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 20).iterations(3));

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        if (dr === 0) return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
        
        const targetRadius = d.target.radius + 2; 
        const targetX = d.target.x - (dx * targetRadius) / dr;
        const targetY = d.target.y - (dy * targetRadius) / dr;
        
        // Slightly curved links
        return `M${d.source.x},${d.source.y} Q${d.source.x + dx/2},${d.source.y + dy/2 - 20} ${targetX},${targetY}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [initialNodes, initialLinks, width, height]); // run once per data set

  // Helper function for filtering
  const isHighlighted = (d: any, filterVal: string, searchVal: string) => {
      if (filterVal === 'ALL' && !searchVal) return true;
      let matchesSearch = true;
      if (searchVal) matchesSearch = d.label.toLowerCase().includes(searchVal.toLowerCase());
      let matchesFilter = true;
      if (filterVal !== 'ALL') matchesFilter = d.group === Number(filterVal);
      return matchesSearch && matchesFilter;
  };

  // 2. Update styling on selection/search changes
  useEffect(() => {
    if (!elementsRef.current.node) return;
    const { node, link } = elementsRef.current;

    node.select(".node-circle")
      .attr("stroke", (d: any) => selectedNode?.id === d.id ? "#22d3ee" : "#18181b")
      .attr("stroke-width", (d: any) => selectedNode?.id === d.id ? 3 : 2)
      .style("filter", (d: any) => selectedNode?.id === d.id ? "url(#glow-net)" : "none");

    node.style("opacity", (d: any) => isHighlighted(d, highlightFilter, searchTerm) ? 1 : 0.1);
    
    link.style("opacity", (d: any) => {
       if (selectedNode) {
          return (d.source.id === selectedNode.id || d.target.id === selectedNode.id) ? 0.8 : 0.05;
       }
       return (isHighlighted(d.source, highlightFilter, searchTerm) && isHighlighted(d.target, highlightFilter, searchTerm)) ? 0.6 : 0.05;
    });

  }, [selectedNode, highlightFilter, searchTerm]);

  return (
    <div className="w-full h-full bg-[#050505] overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#52525b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <svg ref={svgRef} width="100%" height="100%" className="block cursor-grab active:cursor-grabbing relative z-10" />
    </div>
  );
}
