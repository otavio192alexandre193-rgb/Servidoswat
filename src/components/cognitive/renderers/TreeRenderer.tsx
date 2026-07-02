import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Lead } from '../../../types';
import { getKanbanColumns } from '../../../utils/kanban';

interface HierarchicalNode {
  id: string;
  name: string;
  label: string;
  color?: string;
  group?: number;
  lead?: Lead;
  children?: HierarchicalNode[];
}

export default function TreeRenderer({ 
  leads = [], 
  properties = [], 
  width = 800, 
  height = 600, 
  onNodeClick, 
  selectedNode, 
  viewMode 
}: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // React state to persist collapsed node IDs across renders
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    // Start with a few stages open, and details collapsed by default to avoid initial clutter
    const initial = new Set<string>();
    return initial;
  });

  const isRadial = viewMode === 'radial';
  const isHorizontal = viewMode === 'tree-horizontal' || isRadial;

  // Fetch standard stages
  const stagesList = useMemo(() => getKanbanColumns("etapas"), []);

  // Build the clean hierarchical tree
  const treeData = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        id: 'root-crm',
        name: 'Constelação',
        label: '✨ Constelação cicloCRED',
        color: '#a855f7',
        group: 0,
        children: []
      };
    }

    const root: HierarchicalNode = {
      id: 'root-crm',
      name: 'Constelação',
      label: '✨ Constelação cicloCRED',
      color: '#a855f7',
      group: 0,
      children: []
    };

    // Group leads by their active stage
    const stageGroups: Record<string, Lead[]> = {};
    leads.forEach(l => {
      const stageId = l.stage || 'contato_inicial';
      if (!stageGroups[stageId]) stageGroups[stageId] = [];
      stageGroups[stageId].push(l);
    });

    stagesList.forEach(stage => {
      const stageLeads = stageGroups[stage.id] || [];
      const stageNodeId = `stage-${stage.id}`;
      
      const stageNode: HierarchicalNode = {
        id: stageNodeId,
        name: stage.label,
        label: `🔄 ${stage.label} (${stageLeads.length})`,
        color: '#6366f1',
        group: 20,
        children: []
      };

      // Only add children if this stage is NOT collapsed
      if (!collapsedIds.has(stageNodeId)) {
        stageLeads.forEach(lead => {
          const leadNodeId = `lead-${lead.id}`;
          const leadDetails: HierarchicalNode[] = [];

          // Only add metadata children if this individual lead is NOT collapsed
          if (!collapsedIds.has(leadNodeId)) {
            // 1. Profile Detail
            if (lead.mainProfile) {
              leadDetails.push({
                id: `${leadNodeId}-profile`,
                name: lead.mainProfile,
                label: `👤 Perfil: ${lead.mainProfile}`,
                color: '#c084fc',
                group: 21
              });
            }

            // 2. Objection Detail
            if (lead.objection) {
              const hasNoObjection = lead.objection.toLowerCase().includes('sem');
              leadDetails.push({
                id: `${leadNodeId}-objection`,
                name: lead.objection,
                label: hasNoObjection ? `✅ Sem Objeção` : `⚠️ Objeção: ${lead.objection}`,
                color: hasNoObjection ? '#10b981' : '#f59e0b',
                group: 22
              });
            }

            // 3. Entry & Interaction Detail
            const lastContactStr = (() => {
              if (!lead.lastContactAt) return 'Sem contato';
              const d = new Date(lead.lastContactAt);
              return isNaN(d.getTime()) ? 'Sem contato' : d.toLocaleDateString('pt-BR');
            })();
            leadDetails.push({
              id: `${leadNodeId}-interactions`,
              name: 'interactions',
              label: `📥 Entrada: ${lead.origin || 'Web'} | Último: ${lastContactStr} | Score: ${lead.score || 70}%`,
              color: '#38bdf8',
              group: 25
            });

            // 4. Operational OS & Workflow Progress Detail
            const activeOS = lead.osStageId ? `Ativa (${lead.osStageId})` : 'Sem O.S. Ativa';
            leadDetails.push({
              id: `${leadNodeId}-os-status`,
              name: 'os-status',
              label: `⚙️ Fluxo OS: ${activeOS}`,
              color: lead.osStageId ? '#fbbf24' : '#71717a',
              group: 26
            });

            // 5. Inventory Compatibility Check (Cálculo de Compatibilidade)
            let compScore = 75;
            if (lead.propertyInterest) compScore += 10;
            if (lead.bedrooms || lead.parkingSpots) compScore += 10;
            if (lead.restricaoBacen === 'Sim') compScore -= 30;
            compScore = Math.max(10, Math.min(99, compScore));
            
            leadDetails.push({
              id: `${leadNodeId}-compatibility`,
              name: 'compatibility',
              label: `🏢 Compatibilidade Estoque: ${compScore}% ${lead.propertyInterest ? `(${lead.propertyInterest})` : ''}`,
              color: compScore > 75 ? '#10b981' : '#f59e0b',
              group: 27
            });

            // 6. Financial Qualification and Approval (Qualificação & Aprovação Financeira)
            const income = lead.familyGrossIncome || lead.familyIncome || 5000;
            const maxInstallment = income * 0.3;
            const capFinancing = maxInstallment * 135;
            const downPayment = lead.downPaymentAvailable || lead.fgtsSaldo || (income * 1.5);
            const totalCapacity = capFinancing + downPayment;
            const bacenStatus = lead.restricaoBacen === 'Sim' ? '🛑 Restrição BACEN' : '✅ Sem Restrições';
            const creditApproved = lead.restricaoBacen === 'Sim' ? 'Reprovado' : 'Aprovado p/ Fomento';

            leadDetails.push({
              id: `${leadNodeId}-fin-cap`,
              name: 'financial-capacity',
              label: `💰 Limite Financiamento: R$ ${Math.round(capFinancing).toLocaleString('pt-BR')} (Total: R$ ${Math.round(totalCapacity).toLocaleString('pt-BR')})`,
              color: lead.restricaoBacen === 'Sim' ? '#ef4444' : '#10b981',
              group: 28
            });

            leadDetails.push({
              id: `${leadNodeId}-fin-status`,
              name: 'financial-status',
              label: `🏦 Linha sugerida: ${lead.programaDesejado || 'MCMV'} (${bacenStatus} - ${creditApproved})`,
              color: lead.restricaoBacen === 'Sim' ? '#ef4444' : '#22c55e',
              group: 29
            });

            // 7. Next Actions & Closing Probability (O que fazer agora & Conversão final)
            let conversionProb = 45;
            if (lead.restricaoBacen === 'Sim') {
              conversionProb = 5;
            } else {
              if (income > 7000) conversionProb += 20;
              if (lead.score) conversionProb += (lead.score - 50) * 0.35;
              if (lead.objection && lead.objection.toLowerCase().includes('sem')) conversionProb += 15;
            }
            conversionProb = Math.round(Math.max(5, Math.min(98, conversionProb)));

            leadDetails.push({
              id: `${leadNodeId}-conversion`,
              name: 'conversion-prob',
              label: `🎯 Probabilidade Fechamento: ${conversionProb}% | Status: ${conversionProb > 75 ? 'Excelente' : conversionProb > 40 ? 'Morno' : 'Frio'}`,
              color: conversionProb > 75 ? '#10b981' : conversionProb > 40 ? '#f59e0b' : '#ef4444',
              group: 30
            });

            leadDetails.push({
              id: `${leadNodeId}-next-step`,
              name: 'next-action',
              label: `⚡ Próximo Passo: ${lead.nextSteps || 'Agendar simulação detalhada de crédito'}`,
              color: '#38bdf8',
              group: 31
            });
          }

          stageNode.children?.push({
            id: leadNodeId,
            name: lead.name,
            label: `👤 ${lead.name}`,
            color: lead.restricaoBacen === 'Sim' ? '#ef4444' : '#06b6d4',
            group: 1,
            lead: lead,
            children: leadDetails
          });
        });
      }

      root.children?.push(stageNode);
    });

    return root;
  }, [leads, stagesList, collapsedIds]);

  useEffect(() => {
    if (!svgRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    
    // Zoom and pan setup
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    // Initial positioning transition
    if (isRadial) {
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));
    } else {
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(120, height / 2).scale(0.75));
    }

    // Build hierarchy
    const root = d3.hierarchy(treeData);

    // Compute tree size and layout
    let treeLayout: any;
    if (isRadial) {
      const radius = Math.min(width, height) / 2 - 120;
      treeLayout = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    } else {
      // Horizontal tree size (height scale, width depth)
      treeLayout = d3.tree()
        .nodeSize([45, 240]); // fixed size per node prevents overlap
    }

    treeLayout(root);

    // Nodes and links selection arrays
    const descendants = root.descendants();
    const linksData = root.links();

    // Link generator
    const linkGenerator = isRadial 
      ? d3.linkRadial().angle((d: any) => d.x).radius((d: any) => d.y)
      : d3.linkHorizontal().x((d: any) => d.y).y((d: any) => d.x);

    // Glow filter for beautiful visual effects
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow-cyan");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Links
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#27272a")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5)
      .selectAll("path")
      .data(linksData)
      .join("path")
      .attr("d", linkGenerator as any)
      .attr("stroke", (d: any) => {
         // Highlight link if child or parent is selected
         if (selectedNode && (d.source.data.id === selectedNode.id || d.target.data.id === selectedNode.id)) {
           return "#06b6d4";
         }
         return "#27272a";
      })
      .attr("stroke-width", (d: any) => {
         if (selectedNode && (d.source.data.id === selectedNode.id || d.target.data.id === selectedNode.id)) {
           return 2.5;
         }
         return 1.5;
      })
      .attr("stroke-opacity", (d: any) => {
         if (selectedNode && (d.source.data.id === selectedNode.id || d.target.data.id === selectedNode.id)) {
           return 0.9;
         }
         return 0.5;
      });

    // Draw Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(descendants)
      .join("g")
      .attr("transform", (d: any) => {
         if (isRadial) {
           return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`;
         }
         return `translate(${d.y},${d.x})`;
      })
      .attr("cursor", "pointer")
      .on("click", (e, d: any) => {
         e.stopPropagation();
         const nodeId = d.data.id;
         
         // Toggle collapsed state for this clicked node ID
         setCollapsedIds(prev => {
           const next = new Set(prev);
           if (next.has(nodeId)) {
             next.delete(nodeId);
           } else {
             next.add(nodeId);
           }
           return next;
         });

         // Invoke node click handler for Leads
         if (d.data.lead && onNodeClick) {
           onNodeClick(d.data.lead);
         }
      });

    // Selected state indicator ring
    node.append("circle")
      .attr("r", (d: any) => {
         const isSelected = selectedNode && (d.data.id === selectedNode.id || d.data.id === `lead-${selectedNode.id}`);
         return isSelected ? 14 : 0;
      })
      .attr("fill", "none")
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", 2)
      .style("filter", "url(#glow-cyan)");

    // Node interactive bullet circle
    node.append("circle")
      .attr("r", (d: any) => {
         if (d.data.id === 'root-crm') return 9;
         if (d.data.id.startsWith('stage-')) return 7;
         return 5;
      })
      .attr("fill", (d: any) => d.data.color || "#6366f1")
      .attr("stroke", "#09090b")
      .attr("stroke-width", 1.5)
      .style("filter", (d: any) => {
         // Glow if there are collapsed children inside
         const hasCollapsedChildren = collapsedIds.has(d.data.id);
         return hasCollapsedChildren ? "url(#glow-cyan)" : "none";
      });

    // Expand / collapse small indicator sign
    node.filter((d: any) => {
      // stages or leads that have children when expanded
      return d.data.id.startsWith('stage-') || d.data.id.startsWith('lead-');
    })
    .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 3)
      .attr("fill", "#09090b")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .style("opacity", (d: any) => collapsedIds.has(d.data.id) ? 1 : 0);

    // Node labels
    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => {
         if (isRadial) {
           return d.x < Math.PI === !d.children ? 12 : -12;
         }
         return d.children ? -12 : 12;
      })
      .attr("text-anchor", (d: any) => {
         if (isRadial) {
           return d.x < Math.PI === !d.children ? "start" : "end";
         }
         return d.children ? "end" : "start";
      })
      .attr("transform", (d: any) => {
         if (isRadial) {
           return d.x >= Math.PI ? "rotate(180)" : null;
         }
         return null;
      })
      .attr("fill", (d: any) => {
         const isSelected = selectedNode && (d.data.id === selectedNode.id || d.data.id === `lead-${selectedNode.id}`);
         if (isSelected) return "#22d3ee";
         if (d.data.id === 'root-crm') return "#a855f7";
         if (d.data.id.startsWith('stage-')) return "#e4e4e7";
         return "#a1a1aa";
      })
      .attr("font-size", (d: any) => {
         if (d.data.id === 'root-crm') return "11px";
         if (d.data.id.startsWith('stage-')) return "10px";
         return "9px";
      })
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", (d: any) => {
         const isSelected = selectedNode && (d.data.id === selectedNode.id || d.data.id === `lead-${selectedNode.id}`);
         return (isSelected || d.data.id === 'root-crm' || d.data.id.startsWith('stage-')) ? "bold" : "normal";
      })
      .text((d: any) => d.data.label);

  }, [treeData, width, height, viewMode, selectedNode, collapsedIds, isRadial]);

  // Helper buttons to Expand All / Collapse All
  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  const handleCollapseAll = () => {
    const allIds = new Set<string>();
    stagesList.forEach(s => {
      allIds.add(`stage-${s.id}`);
    });
    leads.forEach(l => {
      allIds.add(`lead-${l.id}`);
    });
    setCollapsedIds(allIds);
  };

  return (
    <div className="w-full h-full bg-[#050508] overflow-hidden relative select-none">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1f1f2e 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }} />
      
      {/* Floating control buttons */}
      <div className="absolute bottom-4 right-4 z-50 flex gap-2 pointer-events-auto">
        <button 
          onClick={handleExpandAll}
          className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[9px] font-mono border border-zinc-850 shadow-lg transition-colors"
        >
          ➕ Expandir Tudo
        </button>
        <button 
          onClick={handleCollapseAll}
          className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[9px] font-mono border border-zinc-850 shadow-lg transition-colors"
        >
          ➖ Recolher Tudo
        </button>
      </div>

      <svg ref={svgRef} width="100%" height="100%" className="block cursor-grab active:cursor-grabbing relative z-10" />
    </div>
  );
}
