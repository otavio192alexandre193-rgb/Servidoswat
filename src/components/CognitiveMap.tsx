import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Lead } from '../types';
import { X, Building2, DollarSign, Activity } from 'lucide-react';

interface CognitiveMapProps {
  leads: Lead[];
  height?: number;
  onUpdateLeadField?: (leadId: string, updates: Partial<Lead>) => void;
  properties?: any[];
  onNodeClick?: (lead: Lead) => void;
  onAddToDispatchQueue?: (leadIds: string[]) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  radius: number;
  lead?: Lead;
  label: string;
  detail?: string;
  color?: string;
  isCluster?: boolean;
  data?: any;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: any;
  target: any;
  value: number;
  label?: string;
  type?: string;
}

export default function CognitiveMap({ leads, height = 600, onUpdateLeadField, properties = [], onNodeClick, onAddToDispatchQueue }: CognitiveMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nlpCommand, setNlpCommand] = useState("");
  const [isProcessingNlp, setIsProcessingNlp] = useState(false);
  const [nlpResult, setNlpResult] = useState<string | null>(null);

  const handleNlpCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpCommand.trim()) return;

    setIsProcessingNlp(true);
    setNlpResult(null);

    try {
      const res = await fetch("/api/ai/nlp-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          command: nlpCommand, 
          leadsContext: leads.map(l => ({ id: l.id, name: l.name, value: l.value, status: l.status, origin: l.origin, propertyInterest: l.propertyInterest })),
          propertiesContext: properties.map(p => ({ id: p.id, code: p.code, title: p.title, price: p.price }))
        })
      });

      if (!res.ok) throw new Error("Erro na API de NLP");

      const data = await res.json();
      
      if (data.actions && Array.isArray(data.actions)) {
        let appliedCount = 0;
        let queuedCount = 0;
        let focusedCount = 0;
        data.actions.forEach((action: any) => {
          if (action.type === 'UPDATE_LEAD' && action.leadId && onUpdateLeadField) {
            onUpdateLeadField(action.leadId, action.updates);
            appliedCount++;
          } else if (action.type === 'ADD_TO_DISPATCH_QUEUE' && action.leadIds && onAddToDispatchQueue) {
            onAddToDispatchQueue(action.leadIds);
            queuedCount += action.leadIds.length;
          } else if (action.type === 'FOCUS_LEAD' && action.leadIds) {
            setExpandedLeads(prev => {
              const next = new Set(prev);
              action.leadIds.forEach((id: string) => next.add(id));
              return next;
            });
            focusedCount += action.leadIds.length;
          }
        });
        setNlpResult(`✅ IA: ${appliedCount} updates, ${queuedCount} na fila, ${focusedCount} expandidos.`);
      } else {
        setNlpResult(`⚠️ ${data.message || 'Nenhuma ação aplicável identificada.'}`);
      }

      setNlpCommand("");
    } catch (err) {
      console.error(err);
      setNlpResult("❌ Falha ao comunicar com o servidor Gemini.");
    } finally {
      setIsProcessingNlp(false);
      setTimeout(() => setNlpResult(null), 5000);
    }
  };

  const [visibleLinkTypes, setVisibleLinkTypes] = useState<Set<string>>(new Set(['origem', 'status', 'interesse']));
  const [highlightFilter, setHighlightFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

  const toggleLinkType = (type: string) => {
    setVisibleLinkTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const getAvailableFilterOptions = () => {
    const options = new Set<string>();
    leads.forEach(l => {
      if (l.origin) options.add(l.origin);
      if (l.status) options.add(l.status);
      if (l.propertyInterest) options.add(l.propertyInterest);
    });
    return Array.from(options).sort();
  };

  // Generate nodes and links based on leads
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const originNodes = new Map<string, Node>();
    const statusNodes = new Map<string, Node>();
    
    leads.forEach(lead => {
      // Main Lead Node
      nodes.push({
        id: lead.id,
        label: lead.name,
        group: 1,
        radius: 18,
        color: lead.status === 'proposta' ? '#10b981' : lead.status === 'agendado' ? '#f59e0b' : '#6366f1',
        data: lead
      });

      // Show links and nodes based on visibleLinkTypes
      if (visibleLinkTypes.has('origem') && lead.origin) {
        if (!originNodes.has(lead.origin)) {
          const originNode: Node = { id: `origin-${lead.origin}`, label: lead.origin, group: 2, radius: 25, color: '#ec4899', isCluster: true };
          originNodes.set(lead.origin, originNode);
          nodes.push(originNode);
        }
        links.push({ source: lead.id, target: `origin-${lead.origin}`, value: 1, type: 'origem' });
      }

      if (visibleLinkTypes.has('status') && lead.status) {
        if (!statusNodes.has(lead.status)) {
          const statusNode: Node = { id: `status-${lead.status}`, label: lead.status, group: 3, radius: 25, color: '#8b5cf6', isCluster: true };
          statusNodes.set(lead.status, statusNode);
          nodes.push(statusNode);
        }
        links.push({ source: lead.id, target: `status-${lead.status}`, value: 1, type: 'status' });
      }

      // Expansion logic (double click)
      if (expandedLeads.has(lead.id)) {
        // 1. Renda Familiar (Verde)
        const rendaId = `${lead.id}-renda`;
        nodes.push({ id: rendaId, label: `💰 Renda: R$ ${lead.familyIncome || lead.familyGrossIncome || '0'}`, group: 10, radius: 9, color: '#10b981' });
        links.push({ source: lead.id, target: rendaId, value: 1.2, type: 'detail' });
        
        // 2. Orçamento (Verde Escuro)
        const orcamentoId = `${lead.id}-orcamento`;
        nodes.push({ id: orcamentoId, label: `💸 Orçam: R$ ${lead.value || '0'}`, group: 10, radius: 9, color: '#059669' });
        links.push({ source: lead.id, target: orcamentoId, value: 1.2, type: 'detail' });

        // 3. Status (Roxo)
        const statusId = `${lead.id}-status-detail`;
        nodes.push({ id: statusId, label: `📌 Status: ${lead.status || 'novo'}`, group: 11, radius: 9, color: '#8b5cf6' });
        links.push({ source: lead.id, target: statusId, value: 1.2, type: 'detail' });

        // 4. Imóvel de Interesse (Laranja)
        if (lead.propertyInterest) {
           const paramId = `${lead.id}-param`;
           nodes.push({ id: paramId, label: `🏢 Imóvel: ${lead.propertyInterest}`, group: 12, radius: 9, color: '#f59e0b' });
           links.push({ source: lead.id, target: paramId, value: 1.2, type: 'detail' });
        }

        // 5. Qualificação (Ciano)
        const qualId = `${lead.id}-qual`;
        nodes.push({ id: qualId, label: `🎯 Qual: ${lead.qualificacao || 'A Classificar'}`, group: 13, radius: 9, color: '#0ea5e9' });
        links.push({ source: lead.id, target: qualId, value: 1.2, type: 'detail' });

        // 6. Score de Crédito (Vermelho / Amarelo / Verde dependendo do score)
        const scoreId = `${lead.id}-score-node`;
        const scoreVal = lead.score || 40;
        nodes.push({ id: scoreId, label: `🏆 Score: ${scoreVal}/100`, group: 13, radius: 9, color: scoreVal >= 80 ? '#10b981' : scoreVal >= 50 ? '#f59e0b' : '#ef4444' });
        links.push({ source: lead.id, target: scoreId, value: 1.2, type: 'detail' });

        // 7. Profissão (Indigo)
        if (lead.profession) {
          const profId = `${lead.id}-profession`;
          nodes.push({ id: profId, label: `💼 Prof: ${lead.profession}`, group: 13, radius: 9, color: '#6366f1' });
          links.push({ source: lead.id, target: profId, value: 1.2, type: 'detail' });
        }

        // 8. Região de Interesse (Amber)
        if (lead.region) {
          const regId = `${lead.id}-region`;
          nodes.push({ id: regId, label: `📍 Região: ${lead.region}`, group: 12, radius: 9, color: '#d97706' });
          links.push({ source: lead.id, target: regId, value: 1.2, type: 'detail' });
        }

        // 9. Dossiê/Documentos Checklist Completo (Pink)
        const docsCount = lead.documentsChecklist ? Object.values(lead.documentsChecklist).filter(Boolean).length : 0;
        const docsId = `${lead.id}-docs-node`;
        nodes.push({ id: docsId, label: `📁 Dossiê: ${docsCount}/13 Docs`, group: 11, radius: 9, color: '#ec4899' });
        links.push({ source: lead.id, target: docsId, value: 1.2, type: 'detail' });

        // 10. Próxima Agenda / Compromisso (Lime)
        if (lead.nextSteps || lead.nextAction || lead.nextFollowUpDate) {
          const agendaId = `${lead.id}-agenda-node`;
          nodes.push({ id: agendaId, label: `📅 Agenda: ${lead.nextSteps || lead.nextAction || lead.nextFollowUpDate}`, group: 11, radius: 9, color: '#84cc16' });
          links.push({ source: lead.id, target: agendaId, value: 1.2, type: 'detail' });
        }
      }
    });

    return { nodes, links };
  }, [leads, visibleLinkTypes, expandedLeads]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    // cleanup any previous tooltips
    d3.select(containerRef.current).selectAll(".d3-tooltip").remove();

    const width = containerRef.current.clientWidth;
    const h = height;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    svg
      .attr("viewBox", [0, 0, width, h])
      .attr("width", width)
      .attr("height", h)
      .style("max-width", "100%")
      .style("height", "auto");

    // Add zoom capabilities
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    let focusedNodeId: string | null = null;

    // Colors for different groups
    const color = d3.scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4])
      .range(["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6"]); // Purple (Leads), Green (Origin), Amber (Status), Blue (Property)

    const getNodeColor = (d: Node) => {
      if (d.color) return d.color;
      if (d.group === 1 && d.lead?.status) {
        switch (d.lead.status) {
          case 'novo': return '#3b82f6';
          case 'atendimento': return '#eab308';
          case 'simulacao': return '#8b5cf6';
          case 'visita': return '#ec4899';
          case 'proposta': return '#f97316';
          case 'fechamento': return '#10b981';
          case 'perdido': return '#ef4444';
          default: return color(1);
        }
      }
      return color(d.group);
    };

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, h / 2))
      .force("collide", d3.forceCollide().radius(d => (d as Node).radius + 10).iterations(2));

    // Links
    const link = g.append("g")
      .attr("stroke", "#3f3f46") // zinc-700
      .selectAll<SVGLineElement, Link>("line")
      .data(links)
      .join("line")
      .attr("stroke-opacity", (l: any) => {
        if (!highlightFilter && !searchTerm) return 0.4;
        const sourceMatches = (highlightFilter && l.source.label === highlightFilter) || (highlightFilter && l.source.lead && (l.source.lead.status === highlightFilter || l.source.lead.origin === highlightFilter || l.source.lead.propertyInterest === highlightFilter)) || (searchTerm && l.source.label.toLowerCase().includes(searchTerm.toLowerCase()));
        const targetMatches = (highlightFilter && l.target.label === highlightFilter) || (highlightFilter && l.target.lead && (l.target.lead.status === highlightFilter || l.target.lead.origin === highlightFilter || l.target.lead.propertyInterest === highlightFilter)) || (searchTerm && l.target.label.toLowerCase().includes(searchTerm.toLowerCase()));
        return (sourceMatches || targetMatches) ? 0.8 : 0.05;
      })
      .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const tooltip = d3.select(containerRef.current)
      .append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(9, 9, 11, 0.95)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("border", "1px solid #27272a")
      .style("font-size", "11px")
      .style("pointer-events", "none")
      .style("z-index", "100")
      .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.5)");

    // Nodes
    const node = g.append("g")
      .attr("stroke", "#18181b") // zinc-900
      .attr("stroke-width", 2)
      .selectAll<SVGCircleElement, Node>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => getNodeColor(d))
      .style("opacity", (d: any) => {
        if (!highlightFilter && !searchTerm) return 1;
        const matchesHighlight = highlightFilter && (d.label === highlightFilter || (d.lead && (d.lead.status === highlightFilter || d.lead.origin === highlightFilter || d.lead.propertyInterest === highlightFilter)));
        const matchesSearch = searchTerm && d.label.toLowerCase().includes(searchTerm.toLowerCase());
        return (matchesHighlight || matchesSearch) ? 1 : 0.1;
      })
      .style("cursor", (d: any) => d.group === 1 ? "pointer" : "grab")
      .on("mouseover", (event: any, d: any) => {
        if (focusedNodeId) return; // Disable hover effects in focus mode
        
        // Physical swell animation for current hovered node
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("r", (x: any) => x.radius * 1.4);

        // Highlight logic
        node.style("opacity", (n: any) => {
          const isConnected = links.some(l => 
            (l.source.id === d.id && l.target.id === n.id) || 
            (l.target.id === d.id && l.source.id === n.id)
          );
          return isConnected || n.id === d.id ? 1 : 0.15;
        });
        link.style("opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05);

        // Highlight corresponding labels with scale and weight transition
        label.style("opacity", (n: any) => {
          const isConnected = links.some(l => 
            (l.source.id === d.id && l.target.id === n.id) || 
            (l.target.id === d.id && l.source.id === n.id)
          );
          return isConnected || n.id === d.id ? 1 : 0.15;
        })
        .style("font-size", (n: any) => n.id === d.id ? "12px" : "9px")
        .style("font-weight", (n: any) => n.id === d.id ? "bold" : "normal");

        // Tooltip logic
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <div style="font-weight: 900; margin-bottom: 4px; color: ${getNodeColor(d)}; text-transform: uppercase;">${d.label}</div>
          <div style="color: #a1a1aa;">${d.detail || ''}</div>
          ${d.lead ? `<div style="margin-top: 4px; font-weight: bold; color: #fff;">Status: <span style="text-transform: uppercase;">${d.lead.status}</span></div>` : ''}
        `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event: any) => {
        if (focusedNodeId) return;
        tooltip.style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        if (focusedNodeId) return;

        // Reset all nodes to their original radii with smooth transition
        node.transition()
          .duration(150)
          .attr("r", (x: any) => x.radius);

        node.style("opacity", (d: any) => {
          if (!highlightFilter && !searchTerm) return 1;
          const matchesHighlight = highlightFilter && (d.label === highlightFilter || (d.lead && (d.lead.status === highlightFilter || d.lead.origin === highlightFilter || d.lead.propertyInterest === highlightFilter)));
          const matchesSearch = searchTerm && d.label.toLowerCase().includes(searchTerm.toLowerCase());
          return (matchesHighlight || matchesSearch) ? 1 : 0.1;
        });
        link.style("opacity", (l: any) => {
          if (!highlightFilter && !searchTerm) return 0.4;
          const sourceMatches = (highlightFilter && l.source.label === highlightFilter) || (highlightFilter && l.source.lead && (l.source.lead.status === highlightFilter || l.source.lead.origin === highlightFilter || l.source.lead.propertyInterest === highlightFilter)) || (searchTerm && l.source.label.toLowerCase().includes(searchTerm.toLowerCase()));
          const targetMatches = (highlightFilter && l.target.label === highlightFilter) || (highlightFilter && l.target.lead && (l.target.lead.status === highlightFilter || l.target.lead.origin === highlightFilter || l.target.lead.propertyInterest === highlightFilter)) || (searchTerm && l.target.label.toLowerCase().includes(searchTerm.toLowerCase()));
          return (sourceMatches || targetMatches) ? 0.8 : 0.05;
        });
        label.style("opacity", 1)
          .style("font-size", "10px")
          .style("font-weight", "normal");
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", (event: any, d: any) => {
        if (d.group === 1 && d.lead && onNodeClick) {
          onNodeClick(d.lead);
        }
      })
      .on("dblclick", (event: any, d: any) => {
        event.stopPropagation();
        
        // Expansion logic for leads
        if (d.group === 1) { 
          setExpandedLeads(prev => {
            const next = new Set(prev);
            if (next.has(d.id)) {
              next.delete(d.id);
            } else {
              next.add(d.id);
            }
            return next;
          });
        }

        // Focus logic
        if (focusedNodeId === d.id) {
          focusedNodeId = null;
          // Reset zoom and opacity
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
          );
          node.style("opacity", (n: any) => {
            if (!highlightFilter && !searchTerm) return 1;
            const matchesHighlight = highlightFilter && (n.label === highlightFilter || (n.lead && (n.lead.status === highlightFilter || n.lead.origin === highlightFilter || n.lead.propertyInterest === highlightFilter)));
            const matchesSearch = searchTerm && n.label.toLowerCase().includes(searchTerm.toLowerCase());
            return (matchesHighlight || matchesSearch) ? 1 : 0.1;
          });
          link.style("opacity", (l: any) => {
            if (!highlightFilter && !searchTerm) return 0.4;
            const sourceMatches = (highlightFilter && l.source.label === highlightFilter) || (highlightFilter && l.source.lead && (l.source.lead.status === highlightFilter || l.source.lead.origin === highlightFilter || l.source.lead.propertyInterest === highlightFilter)) || (searchTerm && l.source.label.toLowerCase().includes(searchTerm.toLowerCase()));
            const targetMatches = (highlightFilter && l.target.label === highlightFilter) || (highlightFilter && l.target.lead && (l.target.lead.status === highlightFilter || l.target.lead.origin === highlightFilter || l.target.lead.propertyInterest === highlightFilter)) || (searchTerm && l.target.label.toLowerCase().includes(searchTerm.toLowerCase()));
            return (sourceMatches || targetMatches) ? 0.8 : 0.05;
          });
        } else {
          focusedNodeId = d.id;
          node.style("opacity", (n: any) => {
            const isConnected = links.some(l => 
              (l.source.id === d.id && l.target.id === n.id) || 
              (l.target.id === d.id && l.source.id === n.id)
            );
            return isConnected || n.id === d.id ? 1 : 0.05;
          });
          link.style("opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.02);
          
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2, h / 2).scale(1.5).translate(-d.x!, -d.y!)
          );
        }
      })
      .call(drag(simulation) as any);


    // Labels
    const label = g.append("g")
      .selectAll<SVGTextElement, Node>("text")
      .data(nodes)
      .join("text")
      .attr("dy", (d: any) => d.radius + 12)
      .attr("text-anchor", "middle")
      .attr("fill", "#e4e4e7") // zinc-200
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("pointer-events", "none")
      .text((d: any) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x!)
        .attr("cy", (d: any) => d.y!);

      label
        .attr("x", (d: any) => d.x!)
        .attr("y", (d: any) => d.y!);
    });

    // Cleanup simulation on unmount
    return () => {
      simulation.stop();
    };

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }, [nodes, links, height]);

  const handleSnapshot = () => {
    if (!svgRef.current) return;
    const svgNode = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgNode);
    
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    
    const canvas = document.createElement("canvas");
    canvas.width = svgNode.clientWidth;
    canvas.height = svgNode.clientHeight;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = function() {
      if (ctx) {
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = "mapa-conectivo.png";
        a.href = pngUrl;
        a.click();
      }
    };
    img.src = url;
  };

  return (
    <div ref={containerRef} style={{ height }} className="w-full bg-[#0c0c0e] rounded-2xl overflow-hidden border border-zinc-800 relative shadow-inner flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex gap-2 w-72">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar lead ou empresa..."
          className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 font-mono shadow-lg"
        />
        <button onClick={handleSnapshot} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg border border-zinc-700 whitespace-nowrap transition-colors">
          📷 Snapshot
        </button>
      </div>

      <div className="absolute top-4 right-4 bg-zinc-900/90 text-white p-3 rounded-xl border border-zinc-800 text-[10px] font-mono shadow-lg z-10">
        <div className="font-bold uppercase tracking-wider text-cyan-400 mb-2">Mapa Conectivo (D3)</div>
        <div className="flex items-center gap-2 mb-1 cursor-default"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Leads</div>
        
        <div 
          onClick={() => toggleLinkType('origem')}
          className={`flex items-center gap-2 mb-1 cursor-pointer transition-opacity ${visibleLinkTypes.has('origem') ? 'opacity-100' : 'opacity-40'}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Origem
        </div>
        
        <div 
          onClick={() => toggleLinkType('status')}
          className={`flex items-center gap-2 mb-1 cursor-pointer transition-opacity ${visibleLinkTypes.has('status') ? 'opacity-100' : 'opacity-40'}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Status
        </div>
        
        <div 
          onClick={() => toggleLinkType('interesse')}
          className={`flex items-center gap-2 cursor-pointer transition-opacity ${visibleLinkTypes.has('interesse') ? 'opacity-100' : 'opacity-40'}`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Imóvel/Interesse
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="text-zinc-500 font-bold mb-1 uppercase tracking-widest text-[8px]">Filtro de Destaque</div>
          <select 
            value={highlightFilter}
            onChange={(e) => setHighlightFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-1 text-[9px] outline-none"
          >
            <option value="">-- Todos --</option>
            {getAvailableFilterOptions().map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        
        </div>
      
      {/* NLP Command Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-2xl z-20">
        <form onSubmit={handleNlpCommand} className="flex gap-2 relative">
          <input 
            type="text" 
            value={nlpCommand}
            onChange={(e) => setNlpCommand(e.target.value)}
            placeholder="Ex: 'Atribuir status de Ativo para o João' ou 'Vincular o lead Maria ao imóvel Cód 123'"
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors font-mono"
            disabled={isProcessingNlp}
          />
          <button 
            type="submit"
            disabled={isProcessingNlp || !nlpCommand.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest font-mono transition-colors"
          >
            {isProcessingNlp ? "Processando..." : "Executar IA"}
          </button>
        </form>
        {nlpResult && (
          <div className="absolute -top-12 left-0 w-full text-center">
            <span className="inline-block bg-zinc-900 border border-zinc-700 text-xs text-white px-4 py-2 rounded-full shadow-lg">
              {nlpResult}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
