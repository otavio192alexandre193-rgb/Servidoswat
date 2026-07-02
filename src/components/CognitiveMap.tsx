import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
// @ts-ignore
import D3Worker from '../workers/d3-worker?worker';
import { Lead, OperationalOS, OperationalFlow } from '../types';
import { X, Building2, DollarSign, Activity, ClipboardList } from 'lucide-react';
import { getKanbanColumns } from '../utils/kanban';
import RenderManager from './cognitive/RenderManager';

interface CognitiveMapProps {
  leads: Lead[];
  height?: number;
  onUpdateLeadField?: (leadId: string, updates: Partial<Lead>) => void;
  properties?: any[];
  onNodeClick?: (lead: Lead) => void;
  onOSClick?: (os: OperationalOS) => void;
  onAddToDispatchQueue?: (leadIds: string[]) => void;
  importBatches?: OperationalOS[];
  operationalFlows?: OperationalFlow[];
  activeSystemFlowId?: string;
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
  isAlert?: boolean;
  data?: any;
  action?: () => void;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: any;
  target: any;
  value: number;
  label?: string;
  type?: string;
}

export type ViewMode = 'network' | 'tree-horizontal' | 'radial' | 'timeline' | 'flowchart' | 'dashboard';

export default React.memo(function CognitiveMap({ leads, height = 600, onUpdateLeadField, properties = [], onNodeClick, onOSClick, onAddToDispatchQueue, importBatches = [], operationalFlows = [], activeSystemFlowId }: CognitiveMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [nlpCommand, setNlpCommand] = useState("");
  const [isProcessingNlp, setIsProcessingNlp] = useState(false);
  const [nlpResult, setNlpResult] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<'ficha' | 'acoes' | 'estoque' | 'conversao'>('ficha');

  const handleNodeDoubleClick = useCallback((event: any, d: any) => {
    event.stopPropagation();
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(d.id)) newSet.delete(d.id);
      else newSet.add(d.id);
      return newSet;
    });
  }, []);

  const handleNlpCommand = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpCommand.trim() || isProcessingNlp) return;

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
  }, [nlpCommand, isProcessingNlp, leads, properties, onUpdateLeadField, onAddToDispatchQueue]);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [visibleLinkTypes, setVisibleLinkTypes] = useState<Set<string>>(new Set(['origem', 'status', 'interesse', 'importacao', 'etapas', 'perfil', 'objecoes', 'qualificacao', 'estoque']));
  const [highlightFilter, setHighlightFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const positionsRef = React.useRef<Map<string, { x: number, y: number, vx?: number, vy?: number }>>(new Map());

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

    // Add Root Node for hierarchy
    const rootNode: Node = { id: 'root', label: 'CRM Core', group: 0, radius: 40, color: '#3b82f6', isCluster: true };
    nodes.push(rootNode);

    const originNodes = new Map<string, Node>();
    const statusNodes = new Map<string, Node>();
    const batchNodes = new Map<string, Node>();
    const stageNodes = new Map<string, Node>();
    const profileNodes = new Map<string, Node>();
    const objectionNodes = new Map<string, Node>();
    const qualNodes = new Map<string, Node>();
    const propertyNodes = new Map<string, Node>();
    
    // Map leads to their batches for quick lookup
    const leadToBatch = new Map<string, OperationalOS>();
    importBatches.forEach(batch => {
      batch.leadIds.forEach(leadId => {
        leadToBatch.set(leadId, batch);
      });
    });

    // Fetch real-time Columns of each funnel segment with the reactive active system flow context
    const statusCols = getKanbanColumns("status", activeSystemFlowId);
    const stagesList = getKanbanColumns("etapas", activeSystemFlowId);
    const profilesList = getKanbanColumns("perfil", activeSystemFlowId);
    const objectionsList = getKanbanColumns("objecoes", activeSystemFlowId);
    const qualsList = getKanbanColumns("qualificacao", activeSystemFlowId);

    // Status Nodes
    if (visibleLinkTypes.has('status')) {
      statusCols.forEach(s => {
        const statusNode: Node = {
          id: `status-${s.id}`,
          label: `📊 ${s.label}`,
          group: 3,
          radius: 25,
          color: '#8b5cf6',
          isCluster: true,
          detail: `Filtro de Status: ${s.label}. Toque para exibir leads associados.`
        };
        statusNodes.set(s.id, statusNode);
        nodes.push(statusNode);
        // Hierarchy Link
        links.push({ source: 'root', target: statusNode.id, value: 2.0, type: 'hierarchy' });
      });
    }

    // 1. Funnel Stages Cluster Nodes
    if (visibleLinkTypes.has('etapas')) {
      stagesList.forEach((s, idx) => {
        const stageNode: Node = {
          id: `global-stage-${s.id}`,
          label: `🔄 ${s.label}`,
          group: 20,
          radius: 25,
          color: '#6366f1',
          isCluster: true,
          detail: `Etapa do Funil: ${s.label}. Toque para exibir leads associados.`
        };
        stageNodes.set(s.id, stageNode);
        nodes.push(stageNode);
        // Hierarchy Link
        links.push({ source: 'root', target: stageNode.id, value: 2.0, type: 'hierarchy' });
        
        // Conectar as etapas principais sequencialmente para formar o Fluxo Principal
        if (idx > 0) {
          links.push({
            source: `global-stage-${stagesList[idx - 1].id}`,
            target: `global-stage-${s.id}`,
            value: 1.5,
            type: 'hierarchy'
          });
        }
      });
    }

    // 2. Profile Cluster Nodes
    if (visibleLinkTypes.has('perfil')) {
      profilesList.forEach(p => {
        const pIdSafe = p.id.replace(/\s+/g, '_');
        const pNode: Node = {
          id: `global-profile-${pIdSafe}`,
          label: `👤 ${p.label}`,
          group: 21,
          radius: 24,
          color: '#c084fc',
          isCluster: true,
          detail: `Perfil de Atendimento: ${p.label}.`
        };
        profileNodes.set(p.id, pNode);
        nodes.push(pNode);
        // Hierarchy Link
        links.push({ source: 'root', target: pNode.id, value: 2.0, type: 'hierarchy' });
      });
    }

    // 3. Objection Cluster Nodes
    if (visibleLinkTypes.has('objecoes')) {
      objectionsList.forEach(obj => {
        const objIdSafe = obj.id.replace(/\s+/g, '_');
        const objNode: Node = {
          id: `global-objection-${objIdSafe}`,
          label: `⚠️ ${obj.label}`,
          group: 22,
          radius: 24,
          color: '#f59e0b',
          isCluster: true,
          detail: `Barreira / Objeção Comercial: ${obj.label}.`
        };
        objectionNodes.set(obj.id, objNode);
        nodes.push(objNode);
        // Hierarchy Link
        links.push({ source: 'root', target: objNode.id, value: 2.0, type: 'hierarchy' });
      });
      // Also add 'Sem Objeção' as a fallback if not present
      if (!objectionNodes.has('Sem Objeção') && !objectionNodes.has('sem_objecao')) {
        const neutralNode: Node = {
          id: `global-objection-Sem_Objeção`,
          label: `✅ Sem Objeção`,
          group: 22,
          radius: 24,
          color: '#10b981',
          isCluster: true,
          detail: `Sem barreira ou objeção ativa.`
        };
        objectionNodes.set('Sem Objeção', neutralNode);
        nodes.push(neutralNode);
      }
    }

    // 4. Credit Qualification Cluster Nodes
    if (visibleLinkTypes.has('qualificacao')) {
      qualsList.forEach(q => {
        const qIdSafe = q.id.replace(/\s+/g, '_');
        const qNode: Node = {
          id: `global-qual-${qIdSafe}`,
          label: `🏅 ${q.label}`,
          group: 23,
          radius: 24,
          color: '#22c55e',
          isCluster: true,
          detail: `Status de Análise de Crédito: ${q.label}.`
        };
        qualNodes.set(q.id, qNode);
        nodes.push(qNode);
        // Hierarchy Link
        links.push({ source: 'root', target: qNode.id, value: 2.0, type: 'hierarchy' });
      });
    }

    // 5. Property Stock Nodes
    if (visibleLinkTypes.has('estoque') && properties && properties.length > 0) {
      properties.forEach(prop => {
        const pNode: Node = {
          id: `global-property-${prop.id}`,
          label: `🏢 ${prop.code} (${prop.title})`,
          group: 24,
          radius: 26,
          color: '#eab308', // Gold
          isCluster: true,
          data: prop,
          detail: `Unidade: ${prop.title} | Preço: R$ ${prop.price.toLocaleString('pt-BR')} | Status: ${prop.status === 'disponivel' ? 'Disponível' : prop.status}.`
        };
        propertyNodes.set(prop.id, pNode);
        propertyNodes.set(prop.title, pNode);
        propertyNodes.set(prop.code, pNode);
        nodes.push(pNode);
        // Hierarchy Link
        links.push({ source: 'root', target: pNode.id, value: 2.0, type: 'hierarchy' });
      });
    }
    
    const getDaysSinceContact = (lastContact: string | undefined | null) => {
      if (!lastContact) return null;
      const ms = Date.now() - new Date(lastContact).getTime();
      return Math.floor(ms / (1000 * 60 * 60 * 24));
    };

    const getMatchedStatusId = (status?: string) => {
      if (!status) return 'novo';
      const sLower = status.toLowerCase();
      if (statusNodes.has(sLower)) return sLower;
      if (sLower.includes('novo') || sLower.includes('triagem') || sLower.includes('abordagem')) return 'novo';
      if (sLower.includes('arquivado') || sLower.includes('perdido')) return 'arquivado';
      return 'ativo';
    };

    const getMatchedStageId = (stage?: string) => {
      if (!stage) return 'abordagem';
      const sLower = stage.toLowerCase().replace(/\s+/g, '_');
      if (stageNodes.has(sLower)) return sLower;
      for (const key of stageNodes.keys()) {
        if (key.toLowerCase().includes(sLower) || sLower.includes(key.toLowerCase())) return key;
      }
      const keys = Array.from(stageNodes.keys());
      return keys[0] || 'abordagem';
    };

    const getMatchedProfileId = (profile?: string) => {
      if (!profile) return 'jovem_solteiro';
      const pLower = profile.toLowerCase();
      for (const key of profileNodes.keys()) {
        const pIdSafe = key.replace(/\s+/g, '_');
        if (key.toLowerCase() === pLower || pIdSafe.toLowerCase() === pLower) return pIdSafe;
      }
      if (pLower.includes('investidor')) return 'investidor_pf';
      if (pLower.includes('primeiro')) return 'habitacional_social';
      if (pLower.includes('jovem')) return 'jovem_solteiro';
      if (pLower.includes('meia') || pLower.includes('idade')) return 'casal_sem_filhos';
      if (pLower.includes('idoso') || pLower.includes('aposentado')) return 'aposentado';
      for (const key of profileNodes.keys()) {
        const kLower = key.toLowerCase();
        const pIdSafe = key.replace(/\s+/g, '_');
        if (kLower.includes(pLower) || pLower.includes(kLower)) return pIdSafe;
      }
      const keys = Array.from(profileNodes.keys());
      return keys[0] ? keys[0].replace(/\s+/g, '_') : 'jovem_solteiro';
    };

    const getMatchedQualId = (qual?: string) => {
      if (!qual) return 'nao_qualificado';
      const qLower = qual.toLowerCase();
      for (const key of qualNodes.keys()) {
        const qIdSafe = key.replace(/\s+/g, '_');
        if (key.toLowerCase() === qLower || qIdSafe.toLowerCase() === qLower) return qIdSafe;
      }
      if (qLower.includes('aprovado') || qLower.includes('sim') || qLower.includes('dossie')) return 'dossie_pronto';
      if (qLower.includes('analise') || qLower.includes('pré') || qLower.includes('contato')) return 'em_qualificacao';
      if (qLower.includes('reprovado') || qLower.includes('não') || qLower.includes('nao')) return 'nao_qualificado';
      for (const key of qualNodes.keys()) {
        const kLower = key.toLowerCase();
        const qIdSafe = key.replace(/\s+/g, '_');
        if (kLower.includes(qLower) || qLower.includes(kLower)) return qIdSafe;
      }
      const keys = Array.from(qualNodes.keys());
      return keys[0] ? keys[0].replace(/\s+/g, '_') : 'nao_qualificado';
    };

    const getMatchedObjectionId = (obj?: string) => {
      if (!obj || obj.toLowerCase().includes('sem') || obj.toLowerCase().includes('no_objection')) {
        return 'Sem_Objeção';
      }
      const oLower = obj.toLowerCase();
      for (const key of objectionNodes.keys()) {
        const oIdSafe = key.replace(/\s+/g, '_');
        if (key.toLowerCase() === oLower || oIdSafe.toLowerCase() === oLower) return oIdSafe;
      }
      if (oLower.includes('caro') || oLower.includes('preço')) return 'muito_caro';
      if (oLower.includes('entrada')) return 'entrada_pesada';
      if (oLower.includes('parcela')) return 'parcelas_altas';
      if (oLower.includes('emprego') || oLower.includes('demissao')) return 'medo_perder_emprego';
      if (oLower.includes('endividado')) return 'endividado';
      if (oLower.includes('renda')) return 'renda_baixa';
      if (oLower.includes('bacen') || oLower.includes('restri')) return 'restricao_bacen';
      if (oLower.includes('sujo') || oLower.includes('spc') || oLower.includes('serasa')) return 'nome_sujo';
      if (oLower.includes('document') || oLower.includes('comprov')) return 'sem_comprovacao_renda';
      for (const key of objectionNodes.keys()) {
        const kLower = key.toLowerCase();
        const oIdSafe = key.replace(/\s+/g, '_');
        if (kLower.includes(oLower) || oLower.includes(kLower)) return oIdSafe;
      }
      const keys = Array.from(objectionNodes.keys());
      return keys[0] ? keys[0].replace(/\s+/g, '_') : 'Sem_Objeção';
    };

    leads.forEach(lead => {
      // Main Lead Node
      const daysSinceContact = getDaysSinceContact(lead.lastContactAt);
      const hasRestriction = lead.restricaoBacen === 'Sim';
      const isOverdue = daysSinceContact !== null && daysSinceContact > 7;
      const isHighValueCold = (lead.value && lead.value > 300000) && (lead.status === 'novo' || !lead.lastContactAt);
      const isAlert = isOverdue || hasRestriction || isHighValueCold;

      let alertReason = '';
      if (hasRestriction) alertReason = '⚠️ Restrição Cadastral Ativa (BACEN)';
      else if (isOverdue) alertReason = `🚨 Sem contato há ${daysSinceContact} dias! (SLA de Atendimento Estourado)`;
      else if (isHighValueCold) alertReason = '⚡ Lead de Alto Valor sem Atendimento ativo!';

      nodes.push({
        id: lead.id,
        label: lead.name,
        group: 1,
        radius: 18,
        color: hasRestriction ? '#ef4444' : isOverdue ? '#f59e0b' : lead.status === 'proposta' ? '#10b981' : '#6366f1',
        lead: lead,
        data: lead,
        isAlert: isAlert,
        detail: isAlert ? alertReason : `Lead ativo no funil. Status: ${lead.status || 'Novo'}.`
      });

      // Show links and nodes based on visibleLinkTypes
      if (visibleLinkTypes.has('origem') && lead.origin) {
        if (!originNodes.has(lead.origin)) {
          const originNode: Node = { id: `origin-${lead.origin}`, label: lead.origin, group: 2, radius: 25, color: '#ec4899', isCluster: true };
          originNodes.set(lead.origin, originNode);
          nodes.push(originNode);
        }
        links.push({ source: lead.id, target: `origin-${lead.origin}`, value: 1.0, type: 'origem' });
      }

      if (visibleLinkTypes.has('status') && lead.status) {
        const matchedStatusId = getMatchedStatusId(lead.status);
        links.push({ source: lead.id, target: `status-${matchedStatusId}`, value: 0.8, type: 'status' });
      }

      if (visibleLinkTypes.has('etapas')) {
        const matchedStageId = getMatchedStageId(lead.stage);
        links.push({ source: lead.id, target: `global-stage-${matchedStageId}`, value: 0.8, type: 'etapas' });
      }

      if (visibleLinkTypes.has('perfil')) {
        const matchedProfileId = getMatchedProfileId(lead.mainProfile);
        links.push({ source: lead.id, target: `global-profile-${matchedProfileId}`, value: 0.8, type: 'perfil' });
      }

      if (visibleLinkTypes.has('qualificacao')) {
        const matchedQualId = getMatchedQualId(lead.qualificacao);
        links.push({ source: lead.id, target: `global-qual-${matchedQualId}`, value: 0.8, type: 'qualificacao' });
      }

      if (visibleLinkTypes.has('objecoes')) {
        const matchedObjectionId = getMatchedObjectionId(lead.objection);
        links.push({ source: lead.id, target: `global-objection-${matchedObjectionId}`, value: 0.8, type: 'objecoes' });
      }

      if (visibleLinkTypes.has('estoque') && lead.propertyInterest) {
        const interestStr = String(lead.propertyInterest).toLowerCase();
        const foundProp = properties.find(p => 
          p.id === lead.propertyInterest || 
          p.code?.toLowerCase() === interestStr || 
          p.title?.toLowerCase() === interestStr
        );
        if (foundProp) {
          links.push({ source: lead.id, target: `global-property-${foundProp.id}`, value: 0.8, type: 'estoque' });
        }
      }

      let flowStageNodeId: string | null = null;

      if (visibleLinkTypes.has('importacao')) {
        const batch = leadToBatch.get(lead.id);
        if (batch) {
          const associatedFlow = operationalFlows.find(f => f.id === batch.fluxoId);
          const stages = associatedFlow?.stages && associatedFlow.stages.length > 0
            ? associatedFlow.stages
            : [
                { id: 'triagem', name: 'Triagem de Lead', timer: { days: 0, hours: 1, minutes: 0 } },
                { id: 'contato', name: 'Primeiro Contato', timer: { days: 0, hours: 2, minutes: 0 } },
                { id: 'simulacao', name: 'Simulação de Crédito', timer: { days: 1, hours: 0, minutes: 0 } },
                { id: 'visita', name: 'Visita Agendada', timer: { days: 2, hours: 0, minutes: 0 } },
                { id: 'proposta', name: 'Proposta Emitida', timer: { days: 3, hours: 0, minutes: 0 } },
                { id: 'fechamento', name: 'Financiamento Concluído', timer: { days: 5, hours: 0, minutes: 0 } },
              ];

          if (!batchNodes.has(batch.id)) {
            const batchNode: Node = { 
              id: `batch-${batch.id}`, 
              label: `OS: ${batch.title}`, 
              group: 4, 
              radius: 32, 
              color: '#4f46e5', 
              isCluster: true,
              data: batch,
              detail: `Importado em ${(() => { const d = new Date(batch.date); return isNaN(d.getTime()) ? batch.date : d.toLocaleDateString(); })()}`
            };
            batchNodes.set(batch.id, batchNode);
            nodes.push(batchNode);

            // Adicionar nós de hierarquia temporal baseados nas etapas do fluxo
            stages.forEach((stage, idx) => {
              const stageNodeId = `stage-${batch.id}-${stage.id}`;
              
              // CRONOMETRAGEM DINÂMICA DO SLA (LÓGICA TEMPORAL)
              const batchDateObj = new Date(batch.date);
              const totalHoursSla = (stage.timer.days * 24) + stage.timer.hours + (stage.timer.minutes / 60);
              const msSla = totalHoursSla * 60 * 60 * 1000;
              const deadlineMs = batchDateObj.getTime() + msSla;
              const timeRemainingMs = deadlineMs - Date.now();

              let slaLabel = '';
              let slaColor = '#10b981'; // verde por padrão (em dia)
              
              if (timeRemainingMs < 0) {
                const hoursOver = Math.abs(timeRemainingMs) / (60 * 60 * 1000);
                slaLabel = `🚨 SLA ESTOURADO (+${Math.round(hoursOver)}h)`;
                slaColor = '#ef4444'; // vermelho para atraso
              } else {
                const hoursLeft = timeRemainingMs / (60 * 60 * 1000);
                if (hoursLeft < 12) {
                  slaLabel = `⚠️ SLA Urgente (${Math.round(hoursLeft)}h rest.)`;
                  slaColor = '#f59e0b'; // amarelo para urgente
                } else {
                  slaLabel = `✅ SLA Em Dia (${Math.round(hoursLeft)}h rest.)`;
                  slaColor = '#10b981'; // verde para em dia
                }
              }

              const timerStr = `${stage.timer.days}d ${stage.timer.hours}h`;
              
              nodes.push({
                id: stageNodeId,
                label: `⏱️ ${stage.name} (${timerStr})`,
                group: 4,
                radius: 13,
                color: slaColor,
                data: batch,
                isAlert: timeRemainingMs < 0,
                detail: `SLA Temporal: ${slaLabel}. Toque para mover todos os leads desta OS para a etapa '${stage.name}' no CRM de forma bidirecional.`,
                action: () => {
                  if (onUpdateLeadField) {
                    batch.leadIds.forEach(leadId => {
                      onUpdateLeadField(leadId, { stage: stage.id });
                    });
                  }
                }
              });

              // Ligação temporal sequencial das etapas do fluxo
              if (idx === 0) {
                links.push({ source: `batch-${batch.id}`, target: stageNodeId, value: 1.0, type: 'hierarchy' });
              } else {
                links.push({ source: `stage-${batch.id}-${stages[idx - 1].id}`, target: stageNodeId, value: 0.8, type: 'hierarchy' });
              }

              // Mapear o estágio da OS para o estágio do funil geral do ecossistema
              let mappedGlobalStageId = '';
              const stageIdLower = stage.id.toLowerCase();
              const stageNameLower = stage.name.toLowerCase();
              
              if (stageIdLower.includes('triagem') || stageIdLower.includes('abordagem') || stageNameLower.includes('triagem') || stageNameLower.includes('abordagem')) {
                mappedGlobalStageId = 'abordagem';
              } else if (stageIdLower.includes('contato') || stageIdLower.includes('atendimento') || stageNameLower.includes('contato') || stageNameLower.includes('atendimento')) {
                mappedGlobalStageId = 'atendimento';
              } else if (stageIdLower.includes('simulacao') || stageIdLower.includes('simulação') || stageNameLower.includes('simulacao') || stageNameLower.includes('simulação')) {
                mappedGlobalStageId = 'simulacao';
              } else if (stageIdLower.includes('visita') || stageNameLower.includes('visita')) {
                mappedGlobalStageId = 'visita';
              } else if (stageIdLower.includes('proposta') || stageNameLower.includes('proposta')) {
                mappedGlobalStageId = 'proposta';
              } else if (stageIdLower.includes('concluido') || stageIdLower.includes('fechamento') || stageIdLower.includes('financiamento') || stageNameLower.includes('concluido') || stageNameLower.includes('fechamento') || stageNameLower.includes('financiamento')) {
                mappedGlobalStageId = 'fechamento';
              }

              // Criar um link conectando a etapa específica da OS ao Funil Geral do Ecossistema
              if (visibleLinkTypes.has('etapas') && mappedGlobalStageId && stageNodes.has(mappedGlobalStageId)) {
                links.push({
                  source: stageNodeId,
                  target: `global-stage-${mappedGlobalStageId}`,
                  value: 0.7,
                  type: 'funil-geral'
                });
              }
            });
          }

          // Identificar em qual estágio o lead está e criar o link correspondente
          const leadStatusLower = (lead.status || '').toLowerCase();
          const leadStageLower = (lead.stage || '').toLowerCase();
          let matchedStageId = lead.osStageId || '';
          
          if (!matchedStageId) {
            // Se o lead estiver na etapa ou status de objeções, determinamos seu estágio ativo no fluxo da OS
            let activeStageToSearch = leadStageLower;
            if (activeStageToSearch.includes('objec') || activeStageToSearch.includes('objeç') || leadStatusLower.includes('objec') || leadStatusLower.includes('objeç')) {
              // Heurística de estágio operacional ativo
              if (lead.financedValue || lead.installmentValue || lead.approvedStatus) {
                activeStageToSearch = 'simulacao';
              } else if (lead.propertyInterest) {
                activeStageToSearch = 'visita';
              } else if (lead.lastContactAt) {
                activeStageToSearch = 'contato';
              } else {
                activeStageToSearch = 'triagem';
              }
            }

            const foundStage = stages.find(s => {
              const sIdClean = s.id.toLowerCase().replace('etapa-', '').replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
              const searchClean = activeStageToSearch.replace('etapa-', '').replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
              const leadStatusClean = leadStatusLower.replace('etapa-', '').replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
              
              if (sIdClean === searchClean || sIdClean === leadStatusClean) return true;
              if (sIdClean === 'abordagem-inicial' && (searchClean === 'abordagem' || leadStatusClean === 'abordagem')) return true;
              if (sIdClean === 'apresentacao-solucao' && (searchClean === 'apresentacao' || leadStatusClean === 'apresentacao')) return true;
              if (sIdClean === 'visita-reuniao' && (searchClean === 'visita' || leadStatusClean === 'visita')) return true;
              if (sIdClean === 'objecoes' && (searchClean === 'objecao' || leadStatusClean === 'objecao')) return true;
              if (sIdClean === 'escolha-unidade' && (searchClean === 'escolha-de-unidade' || leadStatusClean === 'escolha-de-unidade')) return true;
              if (sIdClean === 'simulacao-final' && (searchClean === 'simulacao-final' || leadStatusClean === 'simulacao-final')) return true;
              if (s.name.toLowerCase() === activeStageToSearch || s.name.toLowerCase() === leadStatusLower) return true;
              return false;
            });
            
            if (foundStage) {
              matchedStageId = foundStage.id;
            } else {
              // Mapeamento heurístico padrão baseado no status ou etapa ativa do lead se não houver match direto
              if (leadStatusLower.includes('proposta') || activeStageToSearch.includes('proposta')) {
                matchedStageId = 'etapa-proposta';
              } else if (leadStatusLower.includes('agendado') || leadStatusLower.includes('visita') || activeStageToSearch.includes('visita')) {
                matchedStageId = 'etapa-visita-reuniao';
              } else if (leadStatusLower.includes('simulacao') || leadStatusLower.includes('simulação') || activeStageToSearch.includes('simulacao')) {
                matchedStageId = 'etapa-simulacao-final';
              } else if (leadStatusLower.includes('contato') || leadStatusLower.includes('atendimento') || leadStatusLower.includes('ativo') || activeStageToSearch.includes('contato')) {
                matchedStageId = 'etapa-abordagem-inicial';
              } else if (leadStatusLower.includes('concluido') || leadStatusLower.includes('ganho') || leadStatusLower.includes('contrato') || activeStageToSearch.includes('fechamento')) {
                matchedStageId = 'etapa-fechamento';
              } else {
                matchedStageId = stages[0]?.id || '';
              }
            }
          }

          // Garantir que a etapa mapeada realmente existe na lista de estágios gerada para evitar erro de nó não encontrado no D3
          if (matchedStageId && !stages.some(s => s.id === matchedStageId)) {
            const approxStage = stages.find(s => 
              s.id.toLowerCase().includes(matchedStageId.replace('etapa-', '')) || 
              matchedStageId.replace('etapa-', '').includes(s.id.toLowerCase())
            );
            matchedStageId = approxStage ? approxStage.id : (stages[0]?.id || '');
          }

          const targetStageNodeId = `stage-${batch.id}-${matchedStageId}`;
          flowStageNodeId = targetStageNodeId;
          links.push({ source: lead.id, target: targetStageNodeId, value: 1.2, type: 'lead-estagio' });
          links.push({ source: lead.id, target: `batch-${batch.id}`, value: 1.5, type: 'importacao' });
        }
      }

      // Lógica de Expansão Rica e Interativa do Lead (Os três blocos da ficha, dossiê, simulador e compatibilidade da unidade)
      if (expandedLeads.has(lead.id)) {
        
        // Parent connection node changes if flow stage exists
        const parentConnectionId = lead.id;

        // Buscar imóvel correspondente no inventário para cálculo de compatibilidade real-time
        const property = properties.find(p => 
          p.title?.toLowerCase() === lead.propertyInterest?.toLowerCase() ||
          p.code?.toLowerCase() === lead.propertyInterest?.toLowerCase() ||
          p.id === lead.propertyInterest
        );

        const propPrice = property ? property.price : (Number(lead.propertyValue) || Number(lead.value) || 240000);
        const incomeVal = Number(lead.familyIncome) || 3000;
        const ownsProp = lead.possuiImovel === 'Sim' || lead.ownsProperty === 'sim';
        const fgtsVal = Number(lead.fgtsSaldo) || 0;
        const hasFgts3Years = lead.checklist?.fgts_3anos ?? false;

        // 1. Cálculos de Subsídio e Juros Realistas do Programa MCMV / SBPE
        const hasDependents = (Number(lead.dependents) || 0) > 0;
        
        let subsidioEstimado = 0;
        let simuladorBracket = 'SBPE';
        let annualInterestRate = 0.084;
        
        if (!ownsProp) {
          if (incomeVal <= 2640) {
            simuladorBracket = 'Faixa 1 (MCMV)';
            annualInterestRate = hasFgts3Years ? 0.0400 : 0.0450;
            const factor = (incomeVal - 1412) / (2640 - 1412);
            subsidioEstimado = Math.max(20000, 55000 - factor * 30000);
            if (hasDependents) subsidioEstimado += 3000;
          } else if (incomeVal <= 4400) {
            simuladorBracket = 'Faixa 2 (MCMV)';
            annualInterestRate = hasFgts3Years ? 0.0475 : 0.0525;
            const factor = (incomeVal - 2640) / (4400 - 2640);
            subsidioEstimado = Math.max(10000, 25000 - factor * 15000);
            if (hasDependents) subsidioEstimado += 2000;
          } else if (incomeVal <= 8000) {
            simuladorBracket = 'Faixa 3 (MCMV)';
            annualInterestRate = hasFgts3Years ? 0.0600 : 0.0650;
            subsidioEstimado = hasDependents ? 5000 : 0;
          } else {
            simuladorBracket = 'SBPE (Livre)';
            annualInterestRate = 0.098;
            subsidioEstimado = 0;
          }
        } else {
          simuladorBracket = incomeVal <= 8000 ? 'MCMV (s/ subsídio)' : 'SBPE (Livre)';
          if (incomeVal <= 2640) annualInterestRate = hasFgts3Years ? 0.040 : 0.045;
          else if (incomeVal <= 4400) annualInterestRate = hasFgts3Years ? 0.0475 : 0.0525;
          else if (incomeVal <= 8000) annualInterestRate = hasFgts3Years ? 0.060 : 0.065;
          else annualInterestRate = 0.098;
          subsidioEstimado = 0;
        }

        // 2. Capacidade de Financiamento e Entrada via Sistema SAC
        const maxInstallment = incomeVal * 0.30;
        const monthlyInterestRate = annualInterestRate / 12;
        
        const maxFinancivel = propPrice * 0.80;
        const maxLoanByCapacitySAC = maxInstallment / ((1/360) + monthlyInterestRate);
        const financedAmount = Math.min(maxFinancivel, maxLoanByCapacitySAC);
        
        const initialInstallment = (financedAmount / 360) + (financedAmount * monthlyInterestRate);
        
        const entradaTotal = propPrice - financedAmount;
        const atoAvailable = Number(lead.downPaymentAvailable || lead.downPaymentValue) || 15000;
        const diferencaRestanteObra = Math.max(0, entradaTotal - fgtsVal - subsidioEstimado - atoAvailable);
        
        const requiredDownPayment = propPrice * 0.20;
        const availableDownPayment = atoAvailable + fgtsVal + subsidioEstimado;
        
        const downPaymentCompatible = availableDownPayment >= requiredDownPayment || diferencaRestanteObra <= (atoAvailable * 2); // lenient check
        const installmentCompatible = initialInstallment <= maxInstallment;
        const incomeCompatible = downPaymentCompatible && installmentCompatible;

        // 3. Região coincidente?
        const leadRegion = (lead.region || '').toLowerCase();
        const propRegion = property ? (property.neighborhood || property.location || '').toLowerCase() : '';
        const regionCompatible = !leadRegion || !propRegion || propRegion.includes(leadRegion) || leadRegion.includes(propRegion);

        // 4. Score de compatibilidade dinâmico baseado em conformidade financeira de entrada e prestação
        let matchScore = 100;
        if (!downPaymentCompatible) {
          const shortagePercent = (requiredDownPayment - availableDownPayment) / requiredDownPayment;
          matchScore -= Math.min(45, Math.round(shortagePercent * 60));
        }
        if (!installmentCompatible) {
          const installmentExcessPercent = (initialInstallment - maxInstallment) / maxInstallment;
          matchScore -= Math.min(40, Math.round(installmentExcessPercent * 50));
        }
        if (!regionCompatible) matchScore -= 10;
        if (ownsProp && propPrice <= 264000) {
          matchScore -= 15; // MCMV restringe quem tem imóvel
        }
        matchScore = Math.max(10, Math.min(100, matchScore));

        // -----------------------------------------------------------------
        // CONECTORES SEMÂNTICOS PARA O FLUXO DA OS
        // -----------------------------------------------------------------
        const batch = importBatches.find(b => b.leadIds.includes(lead.id));
        const activeFlow = operationalFlows.find(f => f.id === batch?.fluxoId);
        const getSemanticOsStageId = (keywords: string[]) => {
          if (!visibleLinkTypes.has('importacao')) return null;
          if (!batch || !activeFlow || !activeFlow.stages) return null;
          const stage = activeFlow.stages.find(s => keywords.some(k => s.id.toLowerCase().includes(k) || s.name.toLowerCase().includes(k)));
          if (stage) return `stage-${batch.id}-${stage.id}`;
          return null;
        };
        const fichaStageId = getSemanticOsStageId(['triagem', 'abordagem']);
        const dossieStageId = getSemanticOsStageId(['qualificação', 'qualificacao', 'analise', 'perfil']);
        const simuladorStageId = getSemanticOsStageId(['simulacao', 'simulação', 'apresentacao', 'proposta']);
        const matchStageId = getSemanticOsStageId(['match', 'estoque', 'unidade', 'reserva']);
        const conversaoStageId = getSemanticOsStageId(['fechamento', 'assinatura', 'conversão', 'conversao', 'contrato']);

        // -----------------------------------------------------------------
        // RAMIFICAÇÃO 1: FICHA CADASTRADA (NÓ DE AGRUPAMENTO - TRÊS BLOCOS)
        // -----------------------------------------------------------------
        const fichaPaiId = `${lead.id}-ficha-agrupador`;
        nodes.push({
          id: fichaPaiId,
          label: "📋 Ficha Cadastral",
          group: 10,
          radius: 14,
          color: "#4f46e5",
          detail: "Ficha integrada com 3 blocos estruturados. Clique duas vezes para contrair o lead."
        });
        links.push({ source: parentConnectionId, target: fichaPaiId, value: 1.5, type: 'hierarquia-interna' });
        if (fichaStageId) {
           links.push({ source: fichaStageId, target: fichaPaiId, value: 0.9, type: 'fluxo-operacional' });
        }

        // Bloco 1: Identidade & Perfil (Refatorado para usar o perfil de atendimento real do lead)
        const bloco1Id = `${lead.id}-bloco1-perfil`;
        const profileCols = getKanbanColumns("perfil");
        const mappedProfileId = getMatchedProfileId(lead.mainProfile);
        const matchedProfileCol = profileCols.find(c => c.id === mappedProfileId || c.id === lead.mainProfile);
        const profileLabel = matchedProfileCol ? matchedProfileCol.label : (lead.mainProfile || 'Não Informado');

        nodes.push({
          id: bloco1Id,
          label: `👤 Bloco 1 Perfil: ${profileLabel}`,
          group: 10,
          radius: 10,
          color: "#6366f1",
          detail: `Perfil de Atendimento: ${profileLabel}. Toque para alternar o perfil de forma síncrona!`,
          action: () => {
            const currentIdx = profileCols.findIndex(p => p.id === lead.mainProfile);
            const nextIdx = (currentIdx + 1) % profileCols.length;
            const nextProf = profileCols[nextIdx]?.id;
            if (onUpdateLeadField && nextProf) {
              onUpdateLeadField(lead.id, { mainProfile: nextProf });
            }
          }
        });
        links.push({ source: fichaPaiId, target: bloco1Id, value: 1.1, type: 'hierarquia-interna' });
        if (fichaStageId) links.push({ source: fichaStageId, target: bloco1Id, value: 0.8, type: 'status-funil' });

        // Bloco 2: Finanças e Renda (Interativo!)
        const bloco2Id = `${lead.id}-bloco2-renda`;
        nodes.push({
          id: bloco2Id,
          label: `💰 Bloco 2 Renda: R$ ${incomeVal.toLocaleString('pt-BR')}`,
          group: 10,
          radius: 10,
          color: "#10b981",
          detail: `Renda familiar bruta cadastrada. Toque para incrementar +R$ 1.500 e avaliar o impacto imediato na capacidade de crédito!`,
          action: () => {
            let nextIncome = incomeVal + 1500;
            if (nextIncome > 20000) nextIncome = 3000; // Reset para rotação
            if (onUpdateLeadField) {
              onUpdateLeadField(lead.id, { familyIncome: nextIncome });
            }
          }
        });
        links.push({ source: fichaPaiId, target: bloco2Id, value: 1.1, type: 'hierarquia-interna' });
        if (fichaStageId) links.push({ source: fichaStageId, target: bloco2Id, value: 0.8, type: 'status-funil' });

        // Bloco 3: Preferências e Região (Interativo!)
        const bloco3Id = `${lead.id}-bloco3-regiao`;
        nodes.push({
          id: bloco3Id,
          label: `📍 Bloco 3 Região: ${lead.region || 'São Paulo'}`,
          group: 10,
          radius: 10,
          color: "#d97706",
          detail: `Zona preferencial do cliente. Toque para alternar região e reavaliar conformidade geográfica com a unidade!`,
          action: () => {
            const regions = ["Zona Sul", "Zona Leste", "Zona Norte", "Zona Oeste", "Centro"];
            const currentIdx = regions.indexOf(lead.region || '');
            const nextRegion = regions[(currentIdx + 1) % regions.length];
            if (onUpdateLeadField) {
              onUpdateLeadField(lead.id, { region: nextRegion });
            }
          }
        });
        links.push({ source: fichaPaiId, target: bloco3Id, value: 1.1, type: 'hierarquia-interna' });
        if (fichaStageId) links.push({ source: fichaStageId, target: bloco3Id, value: 0.8, type: 'status-funil' });

        // Bloco 4: Etapa Atual (Refletindo a etapa real do lide no funil)
        const blocoEtapaId = `${lead.id}-bloco-etapa`;
        const stageCols = getKanbanColumns("etapas");
        const matchedStageCol = stageCols.find(c => c.id === lead.stage);
        const stageLabel = matchedStageCol ? matchedStageCol.label : 'Sem Etapa';

        nodes.push({
          id: blocoEtapaId,
          label: `🔄 Etapa: ${stageLabel}`,
          group: 10,
          radius: 10,
          color: "#818cf8",
          detail: `Etapa ativa do lead no funil: ${stageLabel}. Toque para avançar a etapa de forma síncrona!`,
          action: () => {
            const currentIdx = stageCols.findIndex(s => s.id === lead.stage);
            const nextIdx = (currentIdx + 1) % stageCols.length;
            const nextStage = stageCols[nextIdx]?.id;
            if (onUpdateLeadField && nextStage) {
              onUpdateLeadField(lead.id, { stage: nextStage });
            }
          }
        });
        links.push({ source: fichaPaiId, target: blocoEtapaId, value: 1.1, type: 'hierarquia-interna' });
        if (fichaStageId) links.push({ source: fichaStageId, target: blocoEtapaId, value: 0.8, type: 'status-funil' });

        // Bloco 5: Qualificação de Crédito Real
        const blocoQualId = `${lead.id}-bloco-qual`;
        const qualCols = getKanbanColumns("qualificacao");
        const matchedQualCol = qualCols.find(c => c.id === lead.qualificacao);
        const qualLabel = matchedQualCol ? matchedQualCol.label : 'Sem Qualificação';

        nodes.push({
          id: blocoQualId,
          label: `🏅 Qualificação: ${qualLabel}`,
          group: 10,
          radius: 10,
          color: "#34d399",
          detail: `Nível de qualificação de crédito: ${qualLabel}. Toque para alternar o status de qualificação!`,
          action: () => {
            const currentIdx = qualCols.findIndex(q => q.id === lead.qualificacao);
            const nextIdx = (currentIdx + 1) % qualCols.length;
            const nextQual = qualCols[nextIdx]?.id;
            if (onUpdateLeadField && nextQual) {
              onUpdateLeadField(lead.id, { qualificacao: nextQual });
            }
          }
        });
        links.push({ source: fichaPaiId, target: blocoQualId, value: 1.1, type: 'hierarquia-interna' });
        if (fichaStageId) links.push({ source: fichaStageId, target: blocoQualId, value: 0.8, type: 'status-funil' });

        // Bloco 6: Objeção Real
        const blocoObjeId = `${lead.id}-bloco-obje`;
        const objCols = getKanbanColumns("objecoes");
        const matchedObjeCol = objCols.find(c => c.id === lead.objection);
        const objectionLabel = matchedObjeCol ? matchedObjeCol.label : 'Sem Objeção';

        nodes.push({
          id: blocoObjeId,
          label: `⚠️ Objeção: ${objectionLabel}`,
          group: 10,
          radius: 10,
          color: "#f59e0b",
          detail: `Barreira ativa ou objeção do cliente: ${objectionLabel}. Toque para alternar barreiras!`,
          action: () => {
            const currentIdx = objCols.findIndex(o => o.id === lead.objection);
            const nextIdx = (currentIdx + 1) % objCols.length;
            const nextObj = objCols[nextIdx]?.id;
            if (onUpdateLeadField && nextObj) {
              onUpdateLeadField(lead.id, { objection: nextObj });
            }
          }
        });
        links.push({ source: fichaPaiId, target: blocoObjeId, value: 1.1, type: 'hierarquia-interna' });
        if (fichaStageId) links.push({ source: fichaStageId, target: blocoObjeId, value: 0.8, type: 'status-funil' });

        // -----------------------------------------------------------------
        // RAMIFICAÇÃO 2: DOSSIÊ DE CRÉDITO (CHECKLIST DE 8 DOCUMENTOS OBRIGATÓRIOS)
        // -----------------------------------------------------------------
        let localChecklist: Record<string, boolean> = {};
        try {
          const saved = localStorage.getItem(`ciclocred_checklist_${lead.id}`);
          if (saved) {
            localChecklist = JSON.parse(saved);
          }
        } catch (e) {
          console.error(e);
        }

        const docsChecklist = {
          doc_cnh_rg: localChecklist['doc_cnh_rg'] ?? !!(lead.documentsChecklist as any)?.photoId,
          doc_resid: localChecklist['doc_resid'] ?? !!(lead.documentsChecklist as any)?.addressProof,
          doc_est_civil: localChecklist['doc_est_civil'] ?? !!(lead.documentsChecklist as any)?.marriageCert,
          doc_fgts: localChecklist['doc_fgts'] ?? !!(lead.documentsChecklist as any)?.incomeProof,
          renda_holerites: localChecklist['renda_holerites'] ?? false,
          renda_ir: localChecklist['renda_ir'] ?? false,
          renda_extratos: localChecklist['renda_extratos'] ?? false,
          renda_carteira: localChecklist['renda_carteira'] ?? false,
        };

        const totalDocs = 8;
        const docsCount = Object.values(docsChecklist).filter(Boolean).length;
        const dossiePaiId = `${lead.id}-dossie-agrupador`;
        nodes.push({
          id: dossiePaiId,
          label: `📁 Dossiê: ${docsCount}/${totalDocs} Docs`,
          group: 11,
          radius: 14,
          color: "#ec4899",
          detail: `Dossiê de Crédito de ${lead.name}. Toque nos nós de documentos abaixo para dar baixa de forma bidirecional!`
        });
        links.push({ source: lead.id, target: dossiePaiId, value: 1.5, type: 'hierarquia-interna' });

        const docKeys = [
          { key: 'doc_cnh_rg', label: '🪪 RG/CNH' },
          { key: 'doc_resid', label: '🏠 Residência' },
          { key: 'doc_est_civil', label: '💍 Certidão' },
          { key: 'doc_fgts', label: '💼 FGTS Extrato' },
          { key: 'renda_holerites', label: '💵 Holerites' },
          { key: 'renda_ir', label: '📊 IRPF + Recibo' },
          { key: 'renda_extratos', label: '📈 Extratos' },
          { key: 'renda_carteira', label: '🎒 CTPS Digital' }
        ];

        docKeys.forEach(doc => {
          const docId = `${lead.id}-doc-${doc.key}`;
          const isDelivered = !!(docsChecklist as any)[doc.key];
          nodes.push({
            id: docId,
            label: `${doc.label}: ${isDelivered ? '✅' : '❌'}`,
            group: 11,
            radius: 9,
            color: isDelivered ? '#10b981' : '#f43f5e',
            detail: `${doc.label}. Toque para alternar o status deste documento no checklist do lead de forma síncrona.`,
            action: () => {
              const updatedDocs = { ...localChecklist, [doc.key]: !isDelivered };
              localStorage.setItem(`ciclocred_checklist_${lead.id}`, JSON.stringify(updatedDocs));
              // Também propaga para a base para re-renderizar o mapa e a ficha
              if (onUpdateLeadField) {
                onUpdateLeadField(lead.id, {
                  documentsChecklist: {
                    ...lead.documentsChecklist,
                    photoId: updatedDocs['doc_cnh_rg'] ?? !!lead.documentsChecklist?.photoId,
                    addressProof: updatedDocs['doc_resid'] ?? !!lead.documentsChecklist?.addressProof,
                    marriageCert: updatedDocs['doc_est_civil'] ?? !!lead.documentsChecklist?.marriageCert,
                    incomeProof: updatedDocs['doc_fgts'] ?? !!lead.documentsChecklist?.incomeProof,
                  }
                });
              }
            }
          });
          links.push({ source: dossiePaiId, target: docId, value: 1.0, type: 'detalhe-documento' });
          if (dossieStageId) links.push({ source: dossieStageId, target: docId, value: 0.8, type: 'status-funil' });
        });

        // -----------------------------------------------------------------
        // RAMIFICAÇÃO 3: SIMULADOR FINANCEIRO (NÓ DE AGRUPAMENTO - PARÂMETROS)
        // -----------------------------------------------------------------
        const simuladorPaiId = `${lead.id}-simulador-agrupador`;
        nodes.push({
          id: simuladorPaiId,
          label: `📊 Simulador ${simuladorBracket}`,
          group: 12,
          radius: 14,
          color: "#3b82f6",
          detail: "Motor de análise e simulação de taxas de juros, período de obra e elegibilidade ao FGTS."
        });
        links.push({ source: lead.id, target: simuladorPaiId, value: 1.5, type: 'hierarquia-interna' });

        const taxaJuros = `${(annualInterestRate * 100).toFixed(2)}% a.a.`;

        // Sub-nó Taxa de Juros (reage aos 3 anos de FGTS)
        const jurosId = `${lead.id}-sim-juros`;
        nodes.push({
          id: jurosId,
          label: `📈 Taxa: ${taxaJuros}`,
          group: 12,
          radius: 9,
          color: hasFgts3Years ? '#10b981' : '#a1a1aa',
          detail: `Taxa de juros anual efetiva da operação (${simuladorBracket}). Habilite o redutor de juros ativando o FGTS.`
        });
        links.push({ source: simuladorPaiId, target: jurosId, value: 1.0, type: 'simulacao' });
        if (simuladorStageId) links.push({ source: simuladorStageId, target: jurosId, value: 0.8, type: 'status-funil' });

        // Sub-nó de Subsídio MCMV (reage ao possuiImovel e renda de forma dinâmica pelas faixas da Caixa)
        const subsidioId = `${lead.id}-sim-subsidio`;
        nodes.push({
          id: subsidioId,
          label: `🎁 Subsídio: R$ ${subsidioEstimado.toLocaleString('pt-BR')}`,
          group: 12,
          radius: 9,
          color: subsidioEstimado > 0 ? '#10b981' : '#ef4444',
          detail: `Subsídio Estimado. Renda: R$ ${incomeVal}. Dependentes: ${hasDependents ? 'Sim' : 'Não'}. Imóvel: ${ownsProp ? 'Sim (Perde benefício)' : 'Não'}.`
        });
        links.push({ source: simuladorPaiId, target: subsidioId, value: 1.0, type: 'simulacao' });
        if (simuladorStageId) links.push({ source: simuladorStageId, target: subsidioId, value: 0.8, type: 'status-funil' });

        // Sub-nó 3 anos de contribuição FGTS (Clicável!)
        const fgts3AnosId = `${lead.id}-sim-3anosfgts`;
        nodes.push({
          id: fgts3AnosId,
          label: `⏱️ 3 Anos FGTS: ${hasFgts3Years ? '✅ Sim (Reduz Juros)' : '❌ Não (Toque p/ Ativar)'}`,
          group: 12,
          radius: 10,
          color: hasFgts3Years ? '#06b6d4' : '#ef4444',
          detail: `Possui 3 anos de contribuição ativa no FGTS? Garante taxas menores e subsídios adicionais na Caixa. Toque neste nó para alternar!`,
          action: () => {
            const updatedChecklist = { ...(lead.checklist || {}), aprov: !hasFgts3Years };
            if (onUpdateLeadField) {
              onUpdateLeadField(lead.id, { checklist: updatedChecklist });
            }
          }
        });
        links.push({ source: simuladorPaiId, target: fgts3AnosId, value: 1.0, type: 'simulacao' });
        if (simuladorStageId) links.push({ source: simuladorStageId, target: fgts3AnosId, value: 0.8, type: 'status-funil' });

        // NOVO: Sub-nó de Financiamento Liberado
        const finLiberadoId = `${lead.id}-sim-finan-liberado`;
        nodes.push({
          id: finLiberadoId,
          label: `🏦 Financiamento Liberado: R$ ${financedAmount.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`,
          group: 12,
          radius: 10,
          color: '#3b82f6',
          detail: `Valor do financiamento liberado pela Caixa (SAC). Parcela Inicial Estimada: R$ ${Math.round(initialInstallment).toLocaleString('pt-BR')}/mês.`
        });
        links.push({ source: simuladorPaiId, target: finLiberadoId, value: 1.0, type: 'simulacao' });
        if (simuladorStageId) links.push({ source: simuladorStageId, target: finLiberadoId, value: 0.8, type: 'status-funil' });

        // NOVO: Sub-nó de Período de Obra (Clicável!)
        const tempoObraVal = lead.tempoObra || 36;
        const mensalObra = tempoObraVal > 0 ? diferencaRestanteObra / tempoObraVal : 0;

        const tempoObraNodeId = `${lead.id}-sim-tempo-obra`;
        nodes.push({
          id: tempoObraNodeId,
          label: `🏗️ Evolução Obras: ${tempoObraVal}x de R$ ${Math.round(mensalObra).toLocaleString('pt-BR')}`,
          group: 12,
          radius: 10,
          color: mensalObra > 0 ? '#f59e0b' : '#10b981',
          detail: `Falta R$ ${Math.round(diferencaRestanteObra).toLocaleString('pt-BR')} para cobrir a Entrada (Valor do Imóvel - Financiamento - FGTS - Ato - Subsídio). Diluído em ${tempoObraVal} meses. Toque para ajustar o prazo (12x/24x/36x/48x/60x).`,
          action: () => {
            const periods = [12, 24, 36, 48, 60];
            const currentIdx = periods.indexOf(tempoObraVal);
            const nextPeriod = periods[(currentIdx + 1) % periods.length];
            if (onUpdateLeadField) {
              onUpdateLeadField(lead.id, { tempoObra: nextPeriod });
            }
          }
        });
        links.push({ source: simuladorPaiId, target: tempoObraNodeId, value: 1.0, type: 'simulacao' });
        if (simuladorStageId) links.push({ source: simuladorStageId, target: tempoObraNodeId, value: 0.8, type: 'status-funil' });

        // -----------------------------------------------------------------
        // RAMIFICAÇÃO 4: COMPATIBILIDADE DA UNIDADE (MATCH SYSTEM)
        // -----------------------------------------------------------------
        if (lead.propertyInterest) {
          const matchPaiId = `${lead.id}-match-agrupador`;
          nodes.push({
            id: matchPaiId,
            label: `🎯 Compatibilidade: ${matchScore}%`,
            group: 13,
            radius: 15,
            color: matchScore >= 80 ? '#10b981' : matchScore >= 50 ? '#f59e0b' : '#ef4444',
            detail: `Placar de Match. Mede conformidade de renda, FGTS, localização geográfica e elegibilidade ao programa MCMV.`
          });
          links.push({ source: parentConnectionId, target: matchPaiId, value: 1.8, type: 'hierarquia-interna' });
          if (matchStageId) {
             links.push({ source: matchStageId, target: matchPaiId, value: 0.9, type: 'fluxo-operacional' });
          }

          // Conectar ao Imóvel de Interesse
          const imovelNodeId = `${lead.id}-unidade-imovel`;
          nodes.push({
            id: imovelNodeId,
            label: `🏡 Unidade: ${lead.propertyInterest}`,
            group: 13,
            radius: 12,
            color: "#eab308",
            detail: property 
              ? `Empreendimento: ${property.title}. Preço: R$ ${property.price.toLocaleString('pt-BR')}. Localização: ${property.neighborhood}, ${property.location}.`
              : `Imóvel referenciado: ${lead.propertyInterest}. Sem dados físicos completos no inventário.`
          });
          links.push({ source: matchPaiId, target: imovelNodeId, value: 1.4, type: 'match-unidade' });
          if (matchStageId) {
             links.push({ source: matchStageId, target: imovelNodeId, value: 0.8, type: 'status-funil' });
          }

          // Nós de Critérios para Alimentar o Ambiente
          // Critério Entrada (Downpayment)
          const matchEntradaId = `${lead.id}-match-entrada`;
          nodes.push({
            id: matchEntradaId,
            label: `Entrada: R$ ${availableDownPayment.toLocaleString('pt-BR')} ${downPaymentCompatible ? '✅ OK' : '⚠️ Insuficiente'}`,
            group: 13,
            radius: 8,
            color: downPaymentCompatible ? '#10b981' : '#f43f5e',
            detail: `Recursos de Entrada Disponíveis: R$ ${availableDownPayment.toLocaleString('pt-BR')} (Entrada sugerida de 20%: R$ ${requiredDownPayment.toLocaleString('pt-BR')}).`
          });
          links.push({ source: matchPaiId, target: matchEntradaId, value: 1.0, type: 'criterio-match' });
          if (matchStageId) {
             links.push({ source: matchStageId, target: matchEntradaId, value: 0.8, type: 'status-funil' });
          }

          // Critério Parcela (SAC Installment check)
          const matchParcelasId = `${lead.id}-match-prestacao`;
          nodes.push({
            id: matchParcelasId,
            label: `Prestação: R$ ${Math.round(initialInstallment).toLocaleString('pt-BR')}/mês ${installmentCompatible ? '✅ Compatível' : '❌ Alta'}`,
            group: 13,
            radius: 8,
            color: installmentCompatible ? '#10b981' : '#f43f5e',
            detail: `Prestação SAC inicial de R$ ${Math.round(initialInstallment).toLocaleString('pt-BR')} (Capacidade de 30% da renda: R$ ${Math.round(maxInstallment).toLocaleString('pt-BR')}).`
          });
          links.push({ source: matchPaiId, target: matchParcelasId, value: 1.0, type: 'criterio-match' });
          if (matchStageId) {
             links.push({ source: matchStageId, target: matchParcelasId, value: 0.8, type: 'status-funil' });
          }

          // Critério Possui Imóvel Próprio? (Clicável!)
          const matchProprioId = `${lead.id}-match-criterio-proprio`;
          nodes.push({
            id: matchProprioId,
            label: `MCMV Elegível: ${ownsProp ? '⚠️ Não (Possui Imóvel)' : '✅ Sim'}`,
            group: 13,
            radius: 8,
            color: ownsProp ? '#ef4444' : '#10b981',
            detail: `Se o cliente já possui imóvel próprio, perde o direito ao Minha Casa Minha Vida. Toque para alternar e avaliar a compatibilidade!`,
            action: () => {
              if (onUpdateLeadField) {
                onUpdateLeadField(lead.id, { possuiImovel: ownsProp ? 'Não' : 'Sim', ownsProperty: ownsProp ? 'nao' : 'sim' });
              }
            }
          });
          links.push({ source: matchPaiId, target: matchProprioId, value: 1.0, type: 'criterio-match' });
          if (matchStageId) {
             links.push({ source: matchStageId, target: matchProprioId, value: 0.8, type: 'status-funil' });
          }

          // Critério Região
          const matchRegiaoId = `${lead.id}-match-criterio-regiao`;
          nodes.push({
            id: matchRegiaoId,
            label: `Região Coincide: ${regionCompatible ? '✅ Coincide' : '⚠️ Diferente'}`,
            group: 13,
            radius: 8,
            color: regionCompatible ? '#10b981' : '#f59e0b',
            detail: `Zona preferencial do lead: ${lead.region || 'São Paulo'}. Região do imóvel: ${property ? property.neighborhood : 'Não mapeada'}.`
          });
          links.push({ source: matchPaiId, target: matchRegiaoId, value: 1.0, type: 'criterio-match' });
          if (matchStageId) {
             links.push({ source: matchStageId, target: matchRegiaoId, value: 0.8, type: 'status-funil' });
          }
        }

        // -----------------------------------------------------------------
        // RAMIFICAÇÃO 5: NÓS DO MOTOR DE CONVERSÃO (7 MILSTONES DE SUCESSO)
        // -----------------------------------------------------------------
        const isStep1Complete = true; // Lead importado
        const isStep2Complete = leadToBatch.has(lead.id) || !!lead.stage;
        const isStep3Complete = (lead.stage && lead.stage !== 'abordagem') || (lead.status && lead.status !== 'novo');
        const isStep4Complete = docsCount === 8 || lead.qualificacao === 'Aprovado' || lead.approvedStatus === 'Sim';
        const isStep5Complete = !!lead.propertyInterest && matchScore >= 60;
        const isStep6Complete = lead.status === 'fechamento' || lead.stage === 'fechamento';
        const isStep7Active = !isStep6Complete && (lead.objection && lead.objection !== 'Sem Objeção');

        const conversionHubId = `${lead.id}-conversion-engine`;
        nodes.push({
          id: conversionHubId,
          label: "🌀 Ciclo de Conversão",
          group: 14,
          radius: 14,
          color: "#a855f7", // Purple-500
          detail: "Motor dinâmico de conversão do CRM: Importar -> SLA -> Nutrir -> Qualificar -> Match -> Proposta/Venda -> Follow-up."
        });
        links.push({ source: parentConnectionId, target: conversionHubId, value: 1.5, type: 'hierarquia-interna' });
        if (conversaoStageId) {
          links.push({ source: conversaoStageId, target: conversionHubId, value: 0.9, type: 'fluxo-operacional' });
        }

        const steps = [
          { id: 'step1', label: '1. Importar', complete: isStep1Complete, desc: 'Lead carregado no ecossistema.' },
          { id: 'step2', label: '2. SLA / OS', complete: isStep2Complete, desc: 'Ordem de serviço ativa vinculada.' },
          { id: 'step3', label: '3. Alimentar', complete: isStep3Complete, desc: 'Nutrido no funil além do contato inicial.' },
          { id: 'step4', label: '4. Qualificar', complete: isStep4Complete, desc: 'Ficha documental e perfil de crédito aprovados.' },
          { id: 'step5', label: '5. Compatibilizar', complete: isStep5Complete, desc: 'Unidade do estoque vinculada com match compatível.' },
          { id: 'step6', label: '6. Venda Garantida', complete: isStep6Complete, desc: 'Contrato assinado, venda fechada com sucesso!' },
          { id: 'step7', label: '7. Resgate / Follow-up', complete: isStep7Active, desc: 'Loop de engajamento e reversão de objeções ativo.' }
        ];

        steps.forEach((step, idx) => {
          const stepNodeId = `${lead.id}-conversion-${step.id}`;
          let stepColor = "#4b5563"; // default cinza pendente
          if (step.complete) {
            stepColor = idx === 6 ? "#fb7185" : "#10b981"; // rosa para follow-up de resgate, esmeralda para concluído
          } else if (idx === 0 || (idx > 0 && steps[idx - 1].complete)) {
            stepColor = "#f59e0b"; // amarelo para o próximo passo ativo na esteira
          }

          nodes.push({
            id: stepNodeId,
            label: `${step.complete ? '✅' : '⏳'} ${step.label}`,
            group: 14,
            radius: 10,
            color: stepColor,
            detail: `${step.desc} Status: ${step.complete ? 'Ativo / Concluído' : 'Pendente de Operação'}.`
          });
          
          links.push({ source: conversionHubId, target: stepNodeId, value: 1.1, type: 'funil-geral' });
          if (conversaoStageId) links.push({ source: conversaoStageId, target: stepNodeId, value: 0.8, type: 'status-funil' });
          if (idx > 0) {
            links.push({ 
              source: `${lead.id}-conversion-${steps[idx-1].id}`, 
              target: stepNodeId, 
              value: 0.8, 
              type: 'status-funil' 
            });
          }
        });
      }
    });

    // Process dynamic sub-diagrams data (circular progress & pie charts)
    nodes.forEach(node => {
      if (node.group === 1 && node.lead) {
        const lead = node.lead as any;
        const fields = ['email', 'phone', 'familyIncome', 'propertyInterest', 'stage', 'status', 'cpfOrRg', 'age'];
        const filled = fields.filter(f => lead[f] && String(lead[f]).trim() !== '').length;
        const progress = filled / fields.length;
        node.data = { ...node.data, progress };
      } else if (node.isCluster) {
        // Calculate Pie Chart of Lead Statuses connected to this cluster
        const connectedLeads = links
          .filter(l => l.target === node.id || l.source === node.id)
          .map(l => {
             const leadId = l.target === node.id ? l.source : l.target;
             return leads.find(ld => ld.id === leadId);
          })
          .filter(ld => !!ld);

        if (connectedLeads.length > 0) {
           const statusCounts = connectedLeads.reduce((acc, ld) => {
              const st = ld!.status || 'novo';
              acc[st] = (acc[st] || 0) + 1;
              return acc;
           }, {} as Record<string, number>);
           
           const total = connectedLeads.length;
           let currentAngle = 0;
           const pieData = Object.entries(statusCounts).map(([status, count]) => {
              const angle = (count / total) * Math.PI * 2;
              const data = { status, startAngle: currentAngle, endAngle: currentAngle + angle };
              currentAngle += angle;
              return data;
           });
           node.data = { ...node.data, pie: pieData, totalLeads: total };
        }
      }
    });

    return { nodes, links };
  }, [leads, visibleLinkTypes, expandedLeads, importBatches, operationalFlows, properties, activeSystemFlowId]);

  // D3 Rendering moved to RenderManager


  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        try {
          await containerRef.current.requestFullscreen();
        } catch (err: any) {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
    <div 
      ref={containerRef} 
      style={{ height: isFullScreen ? '100vh' : height, zIndex: isFullScreen ? 9999 : undefined }} 
      className={
        isFullScreen 
          ? "fixed inset-0 w-screen h-screen z-[9999] bg-[#0c0c0e] overflow-hidden flex flex-col" 
          : "relative w-full bg-[#0c0c0e] rounded-2xl overflow-hidden border border-zinc-800 shadow-inner flex flex-col"
      }
    >
      <style>{`
        @keyframes d3-pulse-stroke {
          0% { stroke-width: 1.5px; opacity: 0.85; }
          50% { stroke-width: 6px; opacity: 0.25; }
          100% { stroke-width: 1.5px; opacity: 0.85; }
        }
        .pulse-stroke {
          animation: d3-pulse-stroke 1.8s infinite ease-in-out;
        }
      `}</style>

      <div className="absolute top-4 left-4 z-[60] flex gap-2 w-[550px] pointer-events-auto">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500 font-bold shadow-lg appearance-none cursor-pointer"
        >
          <option value="network">1. Mapa em Rede (Atual)</option>
          <option value="tree-horizontal">2. Árvore Horizontal</option>
          <option value="radial">3. Mind Map Radial</option>
          <option value="timeline">4. Timeline Inteligente</option>
          <option value="flowchart">5. Fluxograma Operacional</option>
          <option value="dashboard">6. Dashboard Visual Dinâmico</option>
        </select>
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
        <button 
          onClick={toggleFullScreen} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg border border-indigo-500 whitespace-nowrap transition-colors"
        >
          {isFullScreen ? '🗗 Minimizar' : '🗖 Tela Cheia'}
        </button>
      </div>

      {viewMode === 'network' && (
        <div className="absolute top-4 right-4 bg-zinc-900/90 text-white p-3 rounded-xl border border-zinc-800 text-[10px] font-mono shadow-lg z-[60] w-44 pointer-events-auto">
          <div className="font-bold uppercase tracking-wider text-cyan-400 mb-2">Estrutura de Nós (D3)</div>
        <div className="flex items-center gap-2 mb-1.5 cursor-default"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> <span>Leads</span></div>
        
        <div 
          onClick={() => toggleLinkType('origem')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('origem') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Mapeia origem do lead (Web, Meta, etc)"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Origem</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('origem') ? 'ON' : 'OFF'}</span>
        </div>
        
        <div 
          onClick={() => toggleLinkType('status')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('status') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Filtro de status de atendimento"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Status</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('status') ? 'ON' : 'OFF'}</span>
        </div>
        
        <div 
          onClick={() => toggleLinkType('etapas')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('etapas') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Etapas do funil geral do sistema"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Etapa Funil</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('etapas') ? 'ON' : 'OFF'}</span>
        </div>

        <div 
          onClick={() => toggleLinkType('perfil')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('perfil') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Nós de perfis de compradores imobiliários"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            <span>Perfil</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('perfil') ? 'ON' : 'OFF'}</span>
        </div>

        <div 
          onClick={() => toggleLinkType('qualificacao')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('qualificacao') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Qualificação e análise de crédito"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Qualificação</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('qualificacao') ? 'ON' : 'OFF'}</span>
        </div>

        <div 
          onClick={() => toggleLinkType('objecoes')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('objecoes') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Mapeia objeções e gargalos de fechamento"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Objeção</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('objecoes') ? 'ON' : 'OFF'}</span>
        </div>

        <div 
          onClick={() => toggleLinkType('interesse')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('interesse') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Visualiza imóveis vinculados a cada lead"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span>Estoque</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('interesse') ? 'ON' : 'OFF'}</span>
        </div>

        <div 
          onClick={() => toggleLinkType('importacao')}
          className={`flex items-center justify-between cursor-pointer py-0.5 hover:bg-zinc-800/40 px-1 rounded transition ${visibleLinkTypes.has('importacao') ? 'opacity-100 font-bold' : 'opacity-40'}`}
          title="Ordens de Serviço e lotes importados"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Importação / OS</span>
          </div>
          <span className="text-[8px] text-zinc-500">{visibleLinkTypes.has('importacao') ? 'ON' : 'OFF'}</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-zinc-800">
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
      )}
      <div className="flex-1 relative overflow-hidden bg-black">
        <RenderManager 
          viewMode={viewMode as any} 
          nodes={nodes} 
          links={links} 
          width={containerRef.current?.clientWidth || 800} 
          height={height} 
          onNodeClick={(n) => { 
            setSelectedNode(n); 
            if (n.lead) { 
              setExpandedLeads(prev => {
                const next = new Set(prev);
                if (next.has(n.id)) next.delete(n.id);
                else next.add(n.id);
                return next;
              });
            } 
          }} 
          onNodeDoubleClick={handleNodeDoubleClick} 
          selectedNode={selectedNode} 
          highlightFilter={highlightFilter} 
          searchTerm={searchTerm}
          leads={leads}
          properties={properties}
          operationalFlows={operationalFlows}
          importBatches={importBatches}
          onUpdateLeadField={onUpdateLeadField}
        />
      </div>

      {/* Recommended Actions panel overlay */}
      {selectedNode && (
        <div className="absolute bottom-24 left-4 bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.25)] w-[360px] md:w-[410px] text-white font-mono text-xs z-[70] animate-fade-in max-h-[500px] overflow-y-auto scrollbar-thin pointer-events-auto">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-2">
            <span className="text-cyan-400 font-extrabold uppercase text-[9px] tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Painel do Agente Cognitivo
            </span>
            <button onClick={() => setSelectedNode(null)} className="text-zinc-400 hover:text-white font-bold p-1">✕</button>
          </div>

          <div className="mb-2">
            <div className="text-zinc-100 font-bold text-xs uppercase mb-1">
              {selectedNode.group === 1 
                ? (leads.find(l => l.id === selectedNode.id)?.name || selectedNode.label)
                : selectedNode.label
              }
            </div>
            
            {selectedNode.group === 1 ? (
              (() => {
                const freshLead = leads.find(l => l.id === selectedNode.id);
                if (!freshLead) return <div className="text-zinc-400">{selectedNode.detail}</div>;
                
                const stagesList = getKanbanColumns("etapas");
                const profilesList = getKanbanColumns("perfil");
                const objectionsList = getKanbanColumns("objecoes");
                const qualsList = getKanbanColumns("qualificacao");
                const statusCols = getKanbanColumns("status");

                // Calculate stock matching
                const matchedProperties = (properties || []).map(prop => {
                  const income = Number(freshLead.familyGrossIncome) || Number(freshLead.familyIncome) || 3000;
                  const fgts = Number(freshLead.fgtsSaldo) || 0;
                  const savings = Number(freshLead.downPaymentAvailable || freshLead.downPaymentValue) || 15000;
                  
                  const maxInstallment = income * 0.3;
                  const maxLoan = maxInstallment / 0.0075;
                  const maxBuyingCap = maxLoan + fgts + savings;
                  
                  const diff = prop.price - maxBuyingCap;
                  let score = 100;
                  if (diff > 0) {
                    score = Math.max(25, Math.round(100 - (diff / prop.price) * 120));
                  } else {
                    score = 100;
                  }

                  if (freshLead.region && prop.neighborhood && freshLead.region.toLowerCase().trim() === prop.neighborhood.toLowerCase().trim()) {
                    score = Math.min(100, score + 10);
                  }

                  return {
                    property: prop,
                    score,
                    maxBuyingCap
                  };
                }).sort((a, b) => b.score - a.score);

                return (
                  <div>
                    {/* TABS */}
                    <div className="flex border-b border-zinc-800 my-2">
                      <button 
                        onClick={() => setPanelTab('ficha')}
                        className={`flex-1 py-1 text-center font-bold text-[9px] uppercase tracking-wider ${panelTab === 'ficha' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500'}`}
                      >
                        🗂️ Ficha
                      </button>
                      <button 
                        onClick={() => setPanelTab('conversao')}
                        className={`flex-1 py-1 text-center font-bold text-[9px] uppercase tracking-wider ${panelTab === 'conversao' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500'}`}
                      >
                        🌀 Ciclo
                      </button>
                      <button 
                        onClick={() => setPanelTab('acoes')}
                        className={`flex-1 py-1 text-center font-bold text-[9px] uppercase tracking-wider ${panelTab === 'acoes' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500'}`}
                      >
                        ⚡ Ações
                      </button>
                      <button 
                        onClick={() => setPanelTab('estoque')}
                        className={`flex-1 py-1 text-center font-bold text-[9px] uppercase tracking-wider ${panelTab === 'estoque' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-500'}`}
                      >
                        🏢 Estoque ({properties.length})
                      </button>
                    </div>

                    {/* TAB CONTENT: FICHA */}
                    {panelTab === 'ficha' && (
                      <div className="space-y-3 pt-1 text-[10px]">
                        <div>
                          <label className="text-zinc-500 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Status Geral</label>
                          <select
                            value={freshLead.status || 'novo'}
                            onChange={(e) => {
                              if (onUpdateLeadField) {
                                onUpdateLeadField(freshLead.id, { status: e.target.value });
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 outline-none text-[10px]"
                          >
                            {statusCols.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Etapa do Funil (CRM / Kanban)</label>
                          <select
                            value={freshLead.stage || 'abordagem'}
                            onChange={(e) => {
                              if (onUpdateLeadField) {
                                onUpdateLeadField(freshLead.id, { stage: e.target.value, status: e.target.value });
                                window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                  detail: { 
                                    title: "FUNIL SINCRONIZADO",
                                    message: `Lead ${freshLead.name} movido para etapa '${e.target.value}'`,
                                    type: "success"
                                  } 
                                }));
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 outline-none text-[10px]"
                          >
                            {stagesList.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Perfil de Atendimento</label>
                          <select
                            value={freshLead.mainProfile || ''}
                            onChange={(e) => {
                              if (onUpdateLeadField) {
                                onUpdateLeadField(freshLead.id, { mainProfile: e.target.value });
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 outline-none text-[10px]"
                          >
                            {profilesList.map(p => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Objeção Principal</label>
                          <select
                            value={freshLead.objection || 'Sem Objeção'}
                            onChange={(e) => {
                              if (onUpdateLeadField) {
                                onUpdateLeadField(freshLead.id, { objection: e.target.value });
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 outline-none text-[10px]"
                          >
                            {objectionsList.map(o => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Qualificação de Crédito</label>
                          <select
                            value={freshLead.qualificacao || 'nao_qualificado'}
                            onChange={(e) => {
                              if (onUpdateLeadField) {
                                onUpdateLeadField(freshLead.id, { qualificacao: e.target.value });
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 outline-none text-[10px]"
                          >
                            {qualsList.map(q => (
                              <option key={q.id} value={q.id}>{q.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-zinc-500 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Tempo de Obra (Meses)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              value={freshLead.tempoObra !== undefined ? freshLead.tempoObra : 36}
                              onChange={(e) => {
                                if (onUpdateLeadField) {
                                  onUpdateLeadField(freshLead.id, { tempoObra: Number(e.target.value) || 36 });
                                }
                              }}
                              className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded px-2 py-1 outline-none text-[10px]"
                              placeholder="Tempo de obra em meses"
                            />
                            <div className="flex gap-1">
                              {[12, 24, 36, 48].map(v => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    if (onUpdateLeadField) {
                                      onUpdateLeadField(freshLead.id, { tempoObra: v });
                                    }
                                  }}
                                  className={`px-1.5 py-1 text-[8px] font-mono rounded font-bold border transition ${
                                    (freshLead.tempoObra !== undefined ? freshLead.tempoObra : 36) === v 
                                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  {v}m
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800 space-y-1">
                          <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Resumo Financeiro</div>
                          <div>💰 Renda Gross: <span className="text-emerald-400 font-bold">R$ {(Number(freshLead.familyGrossIncome) || Number(freshLead.familyIncome) || 0).toLocaleString('pt-BR')}</span></div>
                          <div>💰 Saldo FGTS: <span className="text-sky-400 font-bold">R$ {(Number(freshLead.fgtsSaldo) || 0).toLocaleString('pt-BR')}</span></div>
                          <div>🏢 Interesse: <span className="text-amber-400 font-bold">{freshLead.propertyInterest || 'Nenhum'}</span></div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: CONVERSAO STEPS */}
                    {panelTab === 'conversao' && (() => {
                      const leadToBatch = new Map<string, OperationalOS>();
                      importBatches.forEach(batch => {
                        batch.leadIds.forEach(leadId => {
                          leadToBatch.set(leadId, batch);
                        });
                      });

                      let localChecklist: Record<string, boolean> = {};
                      try {
                        const saved = localStorage.getItem(`ciclocred_checklist_${freshLead.id}`);
                        if (saved) {
                          localChecklist = JSON.parse(saved);
                        }
                      } catch (e) {}

                      const docsChecklist = {
                        doc_cnh_rg: localChecklist['doc_cnh_rg'] ?? !!(freshLead.documentsChecklist as any)?.photoId,
                        doc_resid: localChecklist['doc_resid'] ?? !!(freshLead.documentsChecklist as any)?.addressProof,
                        doc_est_civil: localChecklist['doc_est_civil'] ?? !!(freshLead.documentsChecklist as any)?.marriageCert,
                        doc_fgts: localChecklist['doc_fgts'] ?? !!(freshLead.documentsChecklist as any)?.incomeProof,
                        renda_holerites: localChecklist['renda_holerites'] ?? false,
                        renda_ir: localChecklist['renda_ir'] ?? false,
                        renda_extratos: localChecklist['renda_extratos'] ?? false,
                        renda_carteira: localChecklist['renda_carteira'] ?? false,
                      };
                      const docsCount = Object.values(docsChecklist).filter(Boolean).length;

                      const isS1 = true;
                      const isS2 = leadToBatch.has(freshLead.id) || !!freshLead.stage;
                      const isS3 = (freshLead.stage && freshLead.stage !== 'abordagem') || (freshLead.status && freshLead.status !== 'novo');
                      const isS4 = docsCount === 8 || freshLead.qualificacao === 'Aprovado' || freshLead.approvedStatus === 'Sim';
                      
                      const property = properties.find(p => 
                        p.title?.toLowerCase() === freshLead.propertyInterest?.toLowerCase() ||
                        p.code?.toLowerCase() === freshLead.propertyInterest?.toLowerCase() ||
                        p.id === freshLead.propertyInterest
                      );
                      const propPrice = property ? property.price : (Number(freshLead.propertyValue) || Number(freshLead.value) || 240000);
                      const incomeVal = Number(freshLead.familyIncome) || 3000;
                      const ownsProp = freshLead.possuiImovel === 'Sim' || freshLead.ownsProperty === 'sim';
                      const fgtsVal = Number(freshLead.fgtsSaldo) || 0;
                      const hasFgts3Years = freshLead.checklist?.aprov ?? false;

                      const hasDependents = (Number(freshLead.dependents) || 0) > 0;
                      let subsidioEstimado = 0;
                      let annualInterestRate = 0.084;
                      if (!ownsProp) {
                        if (incomeVal <= 2640) {
                          annualInterestRate = hasFgts3Years ? 0.0400 : 0.0450;
                          const factor = (incomeVal - 1412) / (2640 - 1412);
                          subsidioEstimado = Math.max(20000, 55000 - factor * 30000);
                          if (hasDependents) subsidioEstimado += 3000;
                        } else if (incomeVal <= 4400) {
                          annualInterestRate = hasFgts3Years ? 0.0475 : 0.0525;
                          const factor = (incomeVal - 2640) / (4400 - 2640);
                          subsidioEstimado = Math.max(10000, 25000 - factor * 15000);
                          if (hasDependents) subsidioEstimado += 2000;
                        } else if (incomeVal <= 8000) {
                          annualInterestRate = hasFgts3Years ? 0.0600 : 0.0650;
                          subsidioEstimado = hasDependents ? 5000 : 0;
                        } else {
                          annualInterestRate = 0.098;
                          subsidioEstimado = 0;
                        }
                      } else {
                        if (incomeVal <= 2640) annualInterestRate = hasFgts3Years ? 0.040 : 0.045;
                        else if (incomeVal <= 4400) annualInterestRate = hasFgts3Years ? 0.0475 : 0.0525;
                        else if (incomeVal <= 8000) annualInterestRate = hasFgts3Years ? 0.060 : 0.065;
                        else annualInterestRate = 0.098;
                        subsidioEstimado = 0;
                      }

                      const maxInstallment = incomeVal * 0.30;
                      const monthlyInterestRate = annualInterestRate / 12;
                      const maxFinancivel = propPrice * 0.80;
                      const maxLoanByCapacitySAC = maxInstallment / ((1/360) + monthlyInterestRate);
                      const financedAmount = Math.min(maxFinancivel, maxLoanByCapacitySAC);

                      const initialInstallment = (financedAmount / 360) + (financedAmount * monthlyInterestRate);
                      const installmentCompatible = initialInstallment <= maxInstallment;

                      const entradaTotal = propPrice - financedAmount;
                      const atoAvailable = Number(freshLead.downPaymentAvailable || freshLead.downPaymentValue) || 15000;
                      const diferencaRestanteObra = Math.max(0, entradaTotal - fgtsVal - subsidioEstimado - atoAvailable);
                      const requiredDownPayment = propPrice * 0.20;
                      const availableDownPayment = atoAvailable + fgtsVal + subsidioEstimado;
                      const downPaymentCompatible = availableDownPayment >= requiredDownPayment || diferencaRestanteObra <= (atoAvailable * 2);

                      let matchScore = 100;
                      if (!downPaymentCompatible) matchScore -= 40;
                      if (!installmentCompatible) matchScore -= 40;
                      matchScore = Math.max(10, matchScore);

                      const isS5 = !!freshLead.propertyInterest && matchScore >= 60;
                      const isS6 = freshLead.status === 'fechamento' || freshLead.stage === 'fechamento';
                      const isS7 = !isS6 && (freshLead.objection && freshLead.objection !== 'Sem Objeção');

                      return (
                        <div className="space-y-3 pt-1 text-[10px]">
                          <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex justify-between items-center">
                            <span>Esteira de Sucesso</span>
                            <span className="text-purple-400 font-mono">cicloCRED Motor</span>
                          </div>

                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {/* PASSO 1 */}
                            <div className={`p-1.5 rounded border ${isS1 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>📥 1. Carga de Importação</span>
                                <span className="text-emerald-400 text-[8px] uppercase">Concluído</span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Origem cadastrada como <strong className="text-zinc-200">{freshLead.origin || 'Web'}</strong>.</p>
                            </div>

                            {/* PASSO 2 */}
                            <div className={`p-1.5 rounded border ${isS2 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>⚙️ 2. Ordem de Serviço / SLA</span>
                                <span className={isS2 ? "text-emerald-400 text-[8px] uppercase" : "text-amber-500 text-[8px] uppercase"}>
                                  {isS2 ? "SLA Ativo" : "Pendente"}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Distribuição do lead no fluxo de SLA com disparos automáticos.</p>
                              {!isS2 && onUpdateLeadField && (
                                <button 
                                  onClick={() => onUpdateLeadField(freshLead.id, { stage: 'abordagem' })}
                                  className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-0.5 text-[8px] font-bold"
                                >
                                  ⚡ Ativar SLA no CRM
                                </button>
                              )}
                            </div>

                            {/* PASSO 3 */}
                            <div className={`p-1.5 rounded border ${isS3 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>📋 3. Alimentar e Agendar</span>
                                <span className={isS3 ? "text-emerald-400 text-[8px] uppercase" : "text-amber-500 text-[8px] uppercase"}>
                                  {isS3 ? "Nutrido" : "Pendente"}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Atualmente na etapa <strong className="text-zinc-200">{freshLead.stage || 'Abordagem'}</strong>.</p>
                              {!isS3 && onUpdateLeadField && (
                                <button 
                                  onClick={() => onUpdateLeadField(freshLead.id, { stage: 'contato' })}
                                  className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-0.5 text-[8px] font-bold"
                                >
                                  📞 Iniciar Nutrição
                                </button>
                              )}
                            </div>

                            {/* PASSO 4 */}
                            <div className={`p-1.5 rounded border ${isS4 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>🏆 4. Qualificar Crédito</span>
                                <span className={isS4 ? "text-emerald-400 text-[8px] uppercase" : "text-amber-500 text-[8px] uppercase"}>
                                  {isS4 ? "Aprovado" : `${docsCount}/8 Documentos`}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Análise financeira Caixa / SBPE do lead.</p>
                              {!isS4 && (
                                <button 
                                  onClick={() => {
                                    const allChecked = {
                                      doc_cnh_rg: true,
                                      doc_resid: true,
                                      doc_est_civil: true,
                                      doc_fgts: true,
                                      renda_holerites: true,
                                      renda_ir: true,
                                      renda_extratos: true,
                                      renda_carteira: true,
                                    };
                                    localStorage.setItem(`ciclocred_checklist_${freshLead.id}`, JSON.stringify(allChecked));
                                    if (onUpdateLeadField) {
                                      onUpdateLeadField(freshLead.id, {
                                        qualificacao: 'Aprovado',
                                        approvedStatus: 'Sim',
                                        documentsChecklist: {
                                          photoId: true,
                                          addressProof: true,
                                          marriageCert: true,
                                          incomeProof: true,
                                        }
                                      });
                                    }
                                    window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                      detail: { 
                                        title: "📋 CRÉDITO QUALIFICADO",
                                        message: `Dossiê completo e crédito Aprovado para ${freshLead.name}!`,
                                        type: "success"
                                      } 
                                    }));
                                  }}
                                  className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2 py-0.5 text-[8px] font-bold"
                                >
                                  ✅ Aprovar Crédito Imediato
                                </button>
                              )}
                            </div>

                            {/* PASSO 5 */}
                            <div className={`p-1.5 rounded border ${isS5 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>🎯 5. Compatibilizar Unidade</span>
                                <span className={isS5 ? "text-emerald-400 text-[8px] uppercase" : "text-amber-500 text-[8px] uppercase"}>
                                  {isS5 ? "Unidade Vinculada" : "Pendente"}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Unidade de interesse: <strong className="text-zinc-200">{freshLead.propertyInterest || 'Nenhuma'}</strong> ({matchScore}% Match).</p>
                              {!isS5 && properties.length > 0 && onUpdateLeadField && (
                                <button 
                                  onClick={() => {
                                    const best = properties[0];
                                    if (best) {
                                      onUpdateLeadField(freshLead.id, { 
                                        propertyInterest: best.id,
                                        value: best.price,
                                        propertyValue: best.price
                                      });
                                      window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                        detail: { 
                                          title: "🏢 AUTO-COMPATIBILIZAÇÃO",
                                          message: `Melhor imóvel disponível '${best.code}' vinculado ao lead!`,
                                          type: "success"
                                        } 
                                      }));
                                    }
                                  }}
                                  className="mt-1 bg-amber-600 hover:bg-amber-700 text-white rounded px-2 py-0.5 text-[8px] font-bold"
                                >
                                  🔗 Auto-vincular Melhor Unidade
                                </button>
                              )}
                            </div>

                            {/* PASSO 6 */}
                            <div className={`p-1.5 rounded border ${isS6 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>💰 6. Venda Garantida</span>
                                <span className={isS6 ? "text-emerald-400 text-[8px] uppercase" : "text-amber-500 text-[8px] uppercase"}>
                                  {isS6 ? "Venda Concluída!" : "Em Aberto"}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Contrato gerado, proposta aprovada e comissão faturada.</p>
                              {!isS6 && onUpdateLeadField && (
                                <button 
                                  onClick={() => {
                                    onUpdateLeadField(freshLead.id, { stage: 'fechamento', status: 'fechamento' });
                                    window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                      detail: { 
                                        title: "🎉 VENDA GARANTIDA!",
                                        message: `Parabéns! Proposta assinada e venda faturada com sucesso!`,
                                        type: "success"
                                      } 
                                    }));
                                  }}
                                  className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-0.5 text-[8px] font-bold"
                                >
                                  🏆 Fechar Venda e Faturar!
                                </button>
                              )}
                            </div>

                            {/* PASSO 7 */}
                            <div className={`p-1.5 rounded border ${isS7 ? 'bg-rose-950/20 border-rose-800/40' : 'bg-zinc-900 border-zinc-850'}`}>
                              <div className="flex justify-between font-bold">
                                <span>🔄 7. Régua de Resgate</span>
                                <span className={isS7 ? "text-rose-400 text-[8px] uppercase font-bold" : "text-zinc-500 text-[8px]"}>
                                  {isS7 ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[8px] mt-0.5">Se a venda esfriar, ativa o follow-up automático com scripts de reversão de objeções.</p>
                              {!isS7 && !isS6 && onUpdateLeadField && (
                                <button 
                                  onClick={() => {
                                    onUpdateLeadField(freshLead.id, { objection: 'Renda Insuficiente' });
                                    window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                      detail: { 
                                        title: "🔄 RESGATE ATIVADO",
                                        message: `Lead marcado com objeção de renda para início do follow-up!`,
                                        type: "warning"
                                      } 
                                    }));
                                  }}
                                  className="mt-1 bg-rose-600 hover:bg-rose-700 text-white rounded px-2 py-0.5 text-[8px] font-bold"
                                >
                                  ⚠️ Simular Objeção / Ativar Resgate
                                </button>
                              )}
                            </div>
                          </div>

                          {/* PROPOSTA FINANCEIRA COMPLETA E INTEGRADA */}
                          {(() => {
                            const tempoObraVal = freshLead.tempoObra || 36;
                            const entradaTotal = propPrice - financedAmount;
                            const atoAvailable = Number(freshLead.downPaymentAvailable || freshLead.downPaymentValue) || 15000;
                            const diferencaRestanteObra = Math.max(0, entradaTotal - fgtsVal - subsidioEstimado - atoAvailable);
                            const mensalObra = tempoObraVal > 0 ? diferencaRestanteObra / tempoObraVal : 0;

                            return (
                              <div className="bg-zinc-950 rounded border border-zinc-800 p-2 mt-3 space-y-1.5">
                                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex justify-between items-center border-b border-zinc-900 pb-1">
                                  <span className="text-zinc-400">📋 Proposta Completa</span>
                                  <span className={installmentCompatible && downPaymentCompatible ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                                    {installmentCompatible && downPaymentCompatible ? "Elegível" : "Ajuste Requerido"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
                                  <div>
                                    <span className="text-zinc-500 block">Valor Imóvel:</span>
                                    <strong className="text-zinc-200">R$ {propPrice.toLocaleString('pt-BR')}</strong>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Financiamento (SAC):</span>
                                    <strong className="text-zinc-200">R$ {financedAmount.toLocaleString('pt-BR')}</strong>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Taxa de Juros:</span>
                                    <strong className="text-emerald-400 font-bold">{(annualInterestRate * 100).toFixed(2)}% a.a.</strong>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Tempo de Obra:</span>
                                    <strong className="text-orange-400 font-bold">{tempoObraVal} Meses</strong>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Prestação Inicial:</span>
                                    <strong className={installmentCompatible ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                      R$ {initialInstallment.toLocaleString('pt-BR')}/mês
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Mensal Período Obra:</span>
                                    <strong className="text-orange-400 font-bold">
                                      R$ {Math.round(mensalObra).toLocaleString('pt-BR')}/mês
                                    </strong>
                                  </div>
                                </div>
                                
                                <div className="text-[7.5px] border-t border-zinc-900 pt-1.5 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Entrada Mínima Requerida (20%):</span>
                                    <span className="text-zinc-300 font-mono">R$ {requiredDownPayment.toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Entrada Disponível Total:</span>
                                    <span className={downPaymentCompatible ? "text-emerald-400 font-bold font-mono" : "text-rose-400 font-bold font-mono"}>
                                      R$ {availableDownPayment.toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Limite Parcela (30% Renda):</span>
                                    <span className="text-zinc-300 font-mono">R$ {maxInstallment.toLocaleString('pt-BR')}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* TAB CONTENT: ACOES */}
                    {panelTab === 'acoes' && (
                      <div className="space-y-1.5 pt-1">
                        {selectedNode.isAlert && (
                          <button
                            onClick={() => {
                              const text = `Olá ${freshLead.name}, aqui é o correspondente bancário do cicloCRED. Gostaríamos de atualizar sua análise de crédito imobiliário!`;
                              window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(freshLead.phone || '')}&text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="w-full py-2 px-2 text-left rounded bg-red-950/60 hover:bg-red-900/60 border border-red-500 text-red-200 text-[10px] font-bold transition flex items-center justify-between"
                          >
                            <span>🚨 Resolver Alerta (WhatsApp)</span>
                            <span>→</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const text = `Olá ${freshLead.name}, sou o consultor de crédito cicloCRED. Recebemos seus dados para simulação imobiliária. Qual o melhor horário para conversarmos?`;
                            window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(freshLead.phone || '')}&text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="w-full py-1.5 px-2 text-left rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 text-[10px] transition flex items-center justify-between"
                        >
                          <span>💬 Enviar Script de Boas-Vindas</span>
                          <span>→</span>
                        </button>

                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("ciclocred_open_simulator_lead", { detail: { lead: freshLead } }));
                          }}
                          className="w-full py-1.5 px-2 text-left rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 text-[10px] transition flex items-center justify-between"
                        >
                          <span>🧮 Simular Crédito (MCMV/SBPE)</span>
                          <span>→</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onUpdateLeadField) {
                              onUpdateLeadField(freshLead.id, { status: 'visita', stage: 'visita' });
                              window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                detail: { 
                                  title: "📍 VISITA AGENDADA",
                                  message: `Lead ${freshLead.name} avançado para estágio de Visita!`,
                                  type: "success"
                                } 
                              }));
                            }
                          }}
                          className="w-full py-1.5 px-2 text-left rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 text-[10px] transition flex items-center justify-between"
                        >
                          <span>📍 Agendar Visita Decorado</span>
                          <span>→</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onUpdateLeadField) {
                              onUpdateLeadField(freshLead.id, { status: 'fechamento', stage: 'fechamento' });
                              window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                detail: { 
                                  title: "🏆 FINANCIAMENTO CONCLUÍDO",
                                  message: `Lead ${freshLead.name} contratado com sucesso!`,
                                  type: "success"
                                } 
                              }));
                            }
                          }}
                          className="w-full py-1.5 px-2 text-left rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500 text-emerald-200 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>🏆 Financiamento Concluído</span>
                          <span>→</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onNodeClick) onNodeClick(freshLead);
                          }}
                          className="w-full py-1.5 px-2 text-left rounded bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-500 text-indigo-200 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>👁️ Detalhes & Ficha do Lead</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}

                    {/* TAB CONTENT: ESTOQUE */}
                    {panelTab === 'estoque' && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Simulação de Compatibilidade</div>
                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                          {matchedProperties.slice(0, 4).map(({ property: prop, score }) => {
                            const isSelected = freshLead.propertyInterest === prop.id || freshLead.propertyInterest === prop.code || freshLead.propertyInterest === prop.title;
                            const badgeColor = score >= 85 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' : score >= 60 ? 'text-amber-400 border-amber-500/30 bg-amber-950/40' : 'text-red-400 border-red-500/30 bg-red-950/40';
                            
                            return (
                              <div key={prop.id} className={`p-2 rounded border text-[9px] transition ${isSelected ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900'}`}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-extrabold text-white text-[10px]">{prop.code}</span>
                                    <span className="text-zinc-400 ml-1">({prop.title})</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${badgeColor}`}>
                                    {score}% MATCH
                                  </span>
                                </div>
                                <div className="text-zinc-400 mt-1 flex justify-between">
                                  <span>Preço: <strong className="text-zinc-200">R$ {prop.price.toLocaleString('pt-BR')}</strong></span>
                                  <span>Região: <strong className="text-zinc-200">{prop.neighborhood || '-'}</strong></span>
                                </div>
                                <div className="mt-1.5 flex gap-1 justify-end">
                                  {isSelected ? (
                                    <span className="text-[8px] text-amber-500 font-bold uppercase flex items-center gap-1">
                                      ✨ Unidade Vinculada
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (onUpdateLeadField) {
                                          onUpdateLeadField(freshLead.id, { 
                                            propertyInterest: prop.id, 
                                            value: prop.price,
                                            propertyValue: prop.price
                                          });
                                          window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                                            detail: { 
                                              title: "ESTOQUE COMPATIBILIZADO",
                                              message: `Lead ${freshLead.name} vinculado ao imóvel '${prop.code}'!`,
                                              type: "success"
                                            } 
                                          }));
                                        }
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-0.5 text-[8px] font-bold uppercase transition"
                                    >
                                      🔗 Vincular Unidade
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-[10px] text-zinc-400 leading-snug">
                {selectedNode.detail || 'Nenhum detalhe adicional.'}
              </div>
            )}
          </div>

          {/* RENDERING SERVICE ORDER ACTIONS */}
          {selectedNode.group === 4 && selectedNode.data && (
            <div className="space-y-1.5 mt-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  if (selectedNode.action) {
                    selectedNode.action();
                  } else if (onUpdateLeadField) {
                    const batch = selectedNode.data as OperationalOS;
                    const stageId = selectedNode.id.split('-').pop() || 'triagem';
                    batch.leadIds.forEach(id => {
                      onUpdateLeadField(id, { osStageId: stageId });
                    });
                    window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                      detail: { 
                        title: "🚀 ETAPA ATUALIZADA",
                        message: `Todos os leads da OS: ${batch.title} foram movidos para a etapa correspondente.`,
                        type: "success"
                      } 
                    }));
                  }
                }}
                className="w-full py-1.5 px-2 text-left rounded bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-500 text-indigo-200 text-[10px] font-bold transition flex items-center justify-between"
              >
                <span>🚀 Promover todos para esta etapa</span>
                <span>→</span>
              </button>
              <button
                onClick={() => {
                  if (onAddToDispatchQueue) {
                    const batch = selectedNode.data as OperationalOS;
                    onAddToDispatchQueue(batch.leadIds);
                    window.dispatchEvent(new CustomEvent("ciclocred_map_toast", { 
                      detail: { 
                        title: "💬 TRANSMISSÃO EM MASSA",
                        message: `Todos os ${batch.leadIds.length} leads desta OS foram adicionados à fila de transmissão WhatsApp!`,
                        type: "success"
                      } 
                    }));
                  }
                }}
                className="w-full py-1.5 px-2 text-left rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-100 text-[10px] transition flex items-center justify-between"
              >
                <span>💬 Disparar transmissão em massa</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* NLP Command Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-2xl z-[70] pointer-events-auto">
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
});
