import React, { useState, useMemo } from 'react';
import { OperationalFlow, FlowStage, OperationalOS, Lead } from '../types';
import { 
  Settings, PlusCircle, Trash, Edit2, Play, AlertCircle, Plus, Link,
  Clock, ArrowRight, Bot, Zap, RotateCcw, FileText, CheckCircle, Award, ShieldAlert, Search, Sparkles
} from 'lucide-react';
import { createDefaultFlow, DEFAULT_FLOW_STAGES } from '../utils/flow';

interface FluxoManagerProps {
  leads?: Lead[];
  operationalFlows: OperationalFlow[];
  setOperationalFlows: React.Dispatch<React.SetStateAction<OperationalFlow[]>>;
  addNotification?: (title: string, msg: string, type: string) => void;
  operationalServiceOrders?: OperationalOS[];
  setOperationalServiceOrders?: React.Dispatch<React.SetStateAction<OperationalOS[]>>;
  onOSClick?: (os: OperationalOS) => void;
}

export default React.memo(function FluxoManager({ 
  leads = [],
  operationalFlows, 
  setOperationalFlows, 
  addNotification,
  operationalServiceOrders = [],
  setOperationalServiceOrders,
  onOSClick
}: FluxoManagerProps) {
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [selectedOSIdsForBulk, setSelectedOSIdsForBulk] = useState<string[]>([]);
  const [editingOSId, setEditingOSId] = useState<string | null>(null);
  const [editingOSTitle, setEditingOSTitle] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'flow' | 'pdf-matrix'>('flow');
  const [matrixSearch, setMatrixSearch] = useState('');

  const checkOSCanBeCompleted = (os: OperationalOS): { canComplete: boolean; reason?: string } => {
    if (!os.leadIds || os.leadIds.length === 0) {
      return { canComplete: true };
    }
    const flow = operationalFlows.find(f => f.id === os.fluxoId);
    if (!flow || !flow.stages || flow.stages.length === 0) {
      return { canComplete: true };
    }
    const lastStage = flow.stages[flow.stages.length - 1];
    const pendingLeads: { name: string; stage: string }[] = [];

    os.leadIds.forEach(leadId => {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        const isOnCorrectFlow = lead.fluxoId === os.fluxoId;
        const isInLastStage = lead.stage === lastStage.id || lead.stage === lastStage.name;
        if (!isOnCorrectFlow || !isInLastStage) {
          const currentStageObj = flow.stages?.find(s => s.id === lead.stage || s.name === lead.stage);
          const currentStageName = currentStageObj ? currentStageObj.name : (lead.stage || 'Sem Etapa');
          pendingLeads.push({
            name: lead.name,
            stage: currentStageName
          });
        }
      }
    });

    if (pendingLeads.length > 0) {
      const names = pendingLeads.map(pl => `${pl.name} (${pl.stage})`).join(', ');
      return {
        canComplete: false,
        reason: `A OS "${os.title}" possui leads pendentes no fluxo "${flow.name}": ${names}.`
      };
    }

    return { canComplete: true };
  };

  const handleSeedStandardOS = () => {
    if (!setOperationalServiceOrders) return;
    
    const standardOSs: OperationalOS[] = [
      {
        id: "os-standard-01",
        title: "OS 01 – Prospecção e Qualificação",
        subtitle: "Abordagem Inicial → Triagem → Qualificação",
        date: new Date().toISOString(),
        fluxoId: editingFlowId || 'flow-1',
        leadIds: [],
        type: 'operacional',
        status: 'em_execucao',
        priority: 'media',
        actionPlan: "Realizar o primeiro contato, identificar a necessidade, qualificar perfil e interesse do Lead.",
        toolUsed: "Executar abordagem via WhatsApp, Ligação, E-mail ou Mensagem; realizar triagem; preencher CRM; validar perfil e orçamento.",
        expectedResult: "Identificar Leads aptos para venda e eliminar Leads sem potencial.",
        nextAction: "Encaminhar automaticamente para OS02.",
        actions: ['whatsapp', 'ligacao'],
        metrics: { health: 100, totalLeads: 0, activeLeads: 0, conversionCount: 0 }
      },
      {
        id: "os-standard-02",
        title: "OS 02 – Análise e Solução",
        subtitle: "Análise → Compatibilização → Solução",
        date: new Date().toISOString(),
        fluxoId: editingFlowId || 'flow-1',
        leadIds: [],
        type: 'operacional',
        status: 'pendente',
        priority: 'media',
        actionPlan: "Estudar o perfil e encontrar a melhor solução.",
        toolUsed: "Utilizar dados da OS01, consultar estoque e apresentar solução.",
        expectedResult: "Demonstrar aderência da solução.",
        nextAction: "Encaminhar para OS03.",
        actions: ['ligacao', 'reuniao'],
        metrics: { health: 100, totalLeads: 0, activeLeads: 0, conversionCount: 0 }
      },
      {
        id: "os-standard-03",
        title: "OS 03 – Negociação",
        subtitle: "Proposta → Reunião → Objeções",
        date: new Date().toISOString(),
        fluxoId: editingFlowId || 'flow-1',
        leadIds: [],
        type: 'operacional',
        status: 'pendente',
        priority: 'alta',
        actionPlan: "Formalizar proposta e negociar.",
        toolUsed: "Gerar proposta, conduzir reunião e tratar objeções.",
        expectedResult: "Obter aceite comercial.",
        nextAction: "Encaminhar para OS04.",
        actions: ['reuniao', 'visita'],
        metrics: { health: 100, totalLeads: 0, activeLeads: 0, conversionCount: 0 }
      },
      {
        id: "os-standard-04",
        title: "OS 04 – Fechamento",
        subtitle: "Escolha → Estimulação → Fechamento",
        date: new Date().toISOString(),
        fluxoId: editingFlowId || 'flow-1',
        leadIds: [],
        type: 'operacional',
        status: 'pendente',
        priority: 'urgente',
        actionPlan: "Concluir a venda.",
        toolUsed: "Gerar contrato, assinatura e pagamento.",
        expectedResult: "Converter a venda.",
        nextAction: "Encaminhar para OS05.",
        actions: ['reuniao'],
        metrics: { health: 100, totalLeads: 0, activeLeads: 0, conversionCount: 0 }
      },
      {
        id: "os-standard-05",
        title: "OS 05 – Follow-up",
        subtitle: "Follow-up 1 → 2 → 3",
        date: new Date().toISOString(),
        fluxoId: editingFlowId || 'flow-1',
        leadIds: [],
        type: 'operacional',
        status: 'pendente',
        priority: 'baixa',
        actionPlan: "Manter Lead ativo ou acompanhar pós-venda.",
        toolUsed: "Executar contatos programados.",
        expectedResult: "Recuperar Leads.",
        nextAction: "Retornar à OS correspondente.",
        actions: ['whatsapp', 'ligacao'],
        metrics: { health: 100, totalLeads: 0, activeLeads: 0, conversionCount: 0 }
      },
      {
        id: "os-standard-06",
        title: "OS 06 – Resgate",
        subtitle: "Resgate → Reciclagem",
        date: new Date().toISOString(),
        fluxoId: editingFlowId || 'flow-1',
        leadIds: [],
        type: 'operacional',
        status: 'pendente',
        priority: 'baixa',
        actionPlan: "Última tentativa de recuperação.",
        toolUsed: "Nova oferta e requalificação.",
        expectedResult: "Reativar oportunidade.",
        nextAction: "Retorna OS 01/02/03.",
        actions: ['whatsapp'],
        metrics: { health: 100, totalLeads: 0, activeLeads: 0, conversionCount: 0 }
      }
    ];

    setOperationalServiceOrders(prev => {
      const filtered = prev.filter(item => !item.id.startsWith("os-standard-"));
      return [...standardOSs, ...filtered];
    });

    if (addNotification) {
      addNotification(
        "💼 OSs Padrão Ativadas",
        "As 6 Ordens de Serviço padrão da matriz de SLA do PDF foram importadas!",
        "success"
      );
    }
  };

  const handleCreateFlow = () => {
    const name = prompt("Nome do novo fluxo operacional:");
    if (!name) return;
    const newFlow = createDefaultFlow(`flow-${Date.now()}`, name);
    setOperationalFlows(prev => [...prev, newFlow]);
    setEditingFlowId(newFlow.id);
    if (addNotification) addNotification("Fluxo Criado", `Fluxo "${name}" adicionado com sucesso.`, "success");
  };

  const handleDeleteFlow = (id: string, name: string) => {
    if (operationalFlows.length <= 1) {
      if (addNotification) addNotification("Bloqueio", "O sistema requer pelo menos um fluxo operacional.", "warning");
      return;
    }
    if (window.confirm(`Tem certeza que deseja apagar o fluxo "${name}"?
Essa ação não pode ser desfeita e os leads vinculados a esse fluxo voltarão ao comportamento padrão.`)) {
      setOperationalFlows(prev => prev.filter(f => f.id !== id));
      if (editingFlowId === id) setEditingFlowId(null);
    }
  };

  const selectedFlow = operationalFlows.find(f => f.id === editingFlowId);

  const updateSelectedFlow = (updated: OperationalFlow) => {
    setOperationalFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  const updateStageTimer = (stageId: string, field: 'days' | 'hours' | 'minutes', value: number) => {
    if (!selectedFlow || !selectedFlow.stages) return;
    
    // Create new array with updated stage
    const newStages = selectedFlow.stages.map(s => {
      if (s.id === stageId) {
        return {
          ...s,
          timer: {
            ...s.timer,
            [field]: value
          }
        };
      }
      return s;
    });

    updateSelectedFlow({ ...selectedFlow, stages: newStages });
  };

  const updateStageMapping = (stageId: string, mappedStageId: string) => {
    if (!selectedFlow || !selectedFlow.stages) return;
    const newStages = selectedFlow.stages.map(s => {
      if (s.id === stageId) {
        return {
          ...s,
          mappedStageId
        };
      }
      return s;
    });
    updateSelectedFlow({ ...selectedFlow, stages: newStages });
    if (addNotification) {
      addNotification("🔗 Mapeamento Ativo", "Etapa conectada ao fluxo geral do CRM!", "success");
    }
  };

  const handleStageAdd = () => {
    if (!selectedFlow) return;
    const name = prompt("Nome da nova etapa personalizada:");
    if (!name) return;
    
    const newStageId = `custom-stage-${Date.now()}`;
    const newStages = [...(selectedFlow.stages || [])];
    newStages.push({
      id: newStageId,
      name: name.toUpperCase(),
      timer: { days: 1, hours: 0, minutes: 0 },
      mappedStageId: 'etapa-abordagem-inicial' // Default map
    });

    updateSelectedFlow({ ...selectedFlow, stages: newStages });
    if (addNotification) {
      addNotification("📋 Etapa Adicionada", `A etapa "${name.toUpperCase()}" foi criada neste fluxo!`, "success");
    }
  };

  const handleStageDelete = (stageId: string) => {
    if (!selectedFlow || !selectedFlow.stages) return;
    if (selectedFlow.stages.length <= 1) {
      alert("O fluxo operacional necessita de pelo menos uma etapa.");
      return;
    }
    const stage = selectedFlow.stages.find(s => s.id === stageId);
    if (!stage) return;

    if (window.confirm(`Excluir a etapa "${stage.name}" do fluxo "${selectedFlow.name}"?`)) {
      const newStages = selectedFlow.stages.filter(s => s.id !== stageId);
      updateSelectedFlow({ ...selectedFlow, stages: newStages });
      if (addNotification) {
        addNotification("🗑️ Etapa Removida", `Etapa "${stage.name}" foi excluída.`, "success");
      }
    }
  };

  const handleStageRename = (stageId: string) => {
    if (!selectedFlow || !selectedFlow.stages) return;
    const stage = selectedFlow.stages.find(s => s.id === stageId);
    if (!stage) return;

    const newName = prompt(`Editar nome da etapa:`, stage.name);
    if (!newName) return;

    const newStages = selectedFlow.stages.map(s => {
      if (s.id === stageId) {
        return { ...s, name: newName.toUpperCase() };
      }
      return s;
    });

    updateSelectedFlow({ ...selectedFlow, stages: newStages });
    if (addNotification) {
      addNotification("✏️ Etapa Editada", `Etapa renomeada para "${newName.toUpperCase()}".`, "success");
    }
  };

  const updateStatusTimer = (statusType: 'recentes' | 'ativos', field: 'hours' | 'minutes', value: number) => {
    if (!selectedFlow) return;
    
    let defaultTimers = selectedFlow.statusTimers || {
      recentes: { hours: 24, minutes: 0 },
      ativos: { hours: 24, minutes: 0 }
    };

    updateSelectedFlow({
      ...selectedFlow,
      statusTimers: {
        ...defaultTimers,
        [statusType]: {
            ...defaultTimers[statusType as keyof typeof defaultTimers],
            [field]: value
        }
      }
    });
  };

  const pdfMatrixData = useMemo(() => [
    {
      id: "os-01",
      title: "OS 01 – Prospecção e Qualificação",
      etapa: "Abordagem Inicial → Triagem → Qualificação",
      fazer: "Realizar o primeiro contato, identificar a necessidade, qualificar perfil e interesse do Lead.",
      como: "Executar abordagem via WhatsApp, Ligação, E-mail ou Mensagem; realizar triagem; preencher CRM; validar perfil e orçamento.",
      objetivo: "Identificar Leads aptos para venda e eliminar Leads sem potencial.",
      proxima: "Encaminhar automaticamente para OS02.",
      sla: "3 horas (1h por etapa)",
      estouro: "Gerar alerta, notificar responsável e criar tarefa pendente.",
      followup: "Follow up 1 → 2 → 3 → OS06.",
      destino: "OS02 ou OS06 ou Arquivado.",
      color: "indigo",
      accentBg: "bg-indigo-50",
      borderCol: "border-indigo-900",
      textCol: "text-indigo-950",
      stagesIds: ["etapa-abordagem-inicial", "etapa-triagem", "etapa-qualificacao"]
    },
    {
      id: "os-02",
      title: "OS 02 – Análise e Solução",
      etapa: "Análise → Compatibilização → Solução",
      fazer: "Estudar o perfil e encontrar a melhor solução.",
      como: "Utilizar dados da OS01, consultar estoque e apresentar solução.",
      objetivo: "Demonstrar aderência da solução.",
      proxima: "Encaminha para OS03.",
      sla: "72 horas",
      estouro: "Repriorizar atendimento.",
      followup: "Follow up 1 → 2 → 3 → OS06.",
      destino: "OS03 ou OS06.",
      color: "violet",
      accentBg: "bg-purple-50",
      borderCol: "border-purple-900",
      textCol: "text-purple-950",
      stagesIds: ["etapa-analise-perfil", "etapa-compatibilizacao", "etapa-apresentacao-solucao"]
    },
    {
      id: "os-03",
      title: "OS 03 – Negociação",
      etapa: "Proposta → Reunião → Objeções",
      fazer: "Formalizar proposta e negociar.",
      como: "Gerar proposta, conduzir reunião e tratar objeções.",
      objetivo: "Obter aceite comercial.",
      proxima: "Encaminha para OS04.",
      sla: "72 horas",
      estouro: "Escalar prioridade.",
      followup: "Follow up 1 → 2 → 3 → OS06.",
      destino: "OS04 ou OS06.",
      color: "amber",
      accentBg: "bg-amber-50",
      borderCol: "border-amber-950",
      textCol: "text-amber-950",
      stagesIds: ["etapa-proposta", "etapa-visita-reuniao", "etapa-objecoes"]
    },
    {
      id: "os-04",
      title: "OS 04 – Fechamento",
      etapa: "Escolha → Estimulação → Fechamento",
      fazer: "Concluir a venda.",
      como: "Gerar contrato, assinatura e pagamento.",
      objetivo: "Converter a venda.",
      proxima: "Encaminha para OS05.",
      sla: "6 horas",
      estouro: "Nova tentativa.",
      followup: "Follow up 1 → 2 → 3 → OS06.",
      destino: "OS05 ou OS06.",
      color: "rose",
      accentBg: "bg-rose-50",
      borderCol: "border-rose-900",
      textCol: "text-rose-950",
      stagesIds: ["etapa-escolha-unidade", "etapa-simulacao-final", "etapa-fechamento"]
    },
    {
      id: "os-05",
      title: "OS 05 – Follow-up",
      etapa: "Follow-up 1 → 2 → 3",
      fazer: "Manter Lead ativo ou acompanhar pós-venda.",
      como: "Executar contatos programados.",
      objetivo: "Recuperar Leads.",
      proxima: "Retornar à OS correspondente.",
      sla: "1 dia → 7 dias → 30 dias",
      estouro: "Criar automaticamente o próximo Follow-up.",
      followup: "Sequência automática.",
      destino: "OS06 se não responder.",
      color: "emerald",
      accentBg: "bg-emerald-50",
      borderCol: "border-emerald-900",
      textCol: "text-emerald-950",
      stagesIds: ["etapa-follow-up-1", "etapa-follow-up-2", "etapa-follow-up-3"]
    },
    {
      id: "os-06",
      title: "OS 06 – Resgate",
      etapa: "Resgate → Reciclagem",
      fazer: "Última tentativa de recuperação.",
      como: "Nova oferta e requalificação.",
      objetivo: "Reativar oportunidade.",
      proxima: "Retorna OS 01/02/03.",
      sla: "30 dias",
      estouro: "Arquivar se inativo.",
      followup: "Sem novos FUs.",
      destino: "Arquivado.",
      color: "zinc",
      accentBg: "bg-zinc-50",
      borderCol: "border-zinc-900",
      textCol: "text-zinc-950",
      stagesIds: ["etapa-resgate", "etapa-reciclagem"]
    }
  ], []);

  const getStageLeadCount = (stageIds: string[]) => {
    return (leads || []).filter(l => {
      const sId = l.stage || '';
      return stageIds.includes(sId) || stageIds.some(id => id.replace('etapa-', '').toUpperCase() === sId.toUpperCase());
    }).length;
  };

  const filteredMatrix = useMemo(() => {
    if (!matrixSearch.trim()) return pdfMatrixData;
    const q = matrixSearch.toLowerCase();
    return pdfMatrixData.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.etapa.toLowerCase().includes(q) ||
      item.fazer.toLowerCase().includes(q) ||
      item.como.toLowerCase().includes(q) ||
      item.objetivo.toLowerCase().includes(q) ||
      item.sla.toLowerCase().includes(q)
    );
  }, [matrixSearch, pdfMatrixData]);

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fadeIn text-zinc-800">
      {/* Sidebar: List of Flows */}
      <div className="w-full md:w-1/3 space-y-4">
        <div className="bg-white border-4 border-zinc-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono font-black text-sm uppercase">Meus Fluxos</h3>
            <button onClick={handleCreateFlow} className="text-zinc-600 hover:text-indigo-600 transition" title="Novo Fluxo">
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {operationalFlows.map(flow => (
              <div 
                key={flow.id} 
                className={`flex items-center justify-between p-3 border-2 rounded-xl transition cursor-pointer ${editingFlowId === flow.id ? 'bg-indigo-50 border-indigo-900 shadow-[2px_2px_0px_0px_rgba(49,46,129,1)]' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-400'}`}
                onClick={() => setEditingFlowId(flow.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <Play className={`w-3 h-3 ${editingFlowId === flow.id ? 'text-indigo-600' : 'text-zinc-400'}`} fill="currentColor" />
                  <span className="font-bold text-xs truncate">{flow.name}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteFlow(flow.id, flow.name); }}
                  className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Card 2: Gestão de Ordens de Serviço (OS) */}
        <div className="bg-white border-4 border-zinc-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <div className="flex flex-col gap-2 border-b pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono font-black text-sm uppercase text-zinc-900">Ordens de Serviço (OS)</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Atrelagem de Leads & Metas</p>
              </div>
              <button
                onClick={() => {
                  const title = prompt("Digite o nome da nova Ordem de Serviço:");
                  if (!title) return;
                  const priority = prompt("Prioridade (baixa, media, alta, urgente):", "media") as any;
                  const newOS: OperationalOS = {
                    id: `os-${Date.now()}`,
                    title,
                    date: new Date().toISOString(),
                    fluxoId: editingFlowId || 'flow-1',
                    leadIds: [],
                    type: 'personalizado',
                    status: 'pendente',
                    priority: ['baixa', 'media', 'alta', 'urgente'].includes(priority) ? priority : 'media',
                    metrics: {
                      health: 100,
                      totalLeads: 0,
                      activeLeads: 0,
                      conversionCount: 0
                    }
                  };
                  if (setOperationalServiceOrders) {
                    setOperationalServiceOrders(prev => [newOS, ...prev]);
                    if (addNotification) addNotification("💼 OS Criada", `A Ordem de Serviço "${title}" foi criada!`, "success");
                  }
                }}
                className="p-1 bg-zinc-100 border border-zinc-300 rounded hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                title="Nova Ordem de Serviço"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSeedStandardOS}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 border-2 border-indigo-900 hover:bg-indigo-100 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_rgba(49,46,129,1)] active:translate-y-0.5 cursor-pointer"
              title="Carregar as 6 OS padrão com regras de SLA do PDF"
            >
              <RotateCcw className="w-3 h-3 text-indigo-700 animate-spin-hover" />
              <span>Importar 6 OS Padrão (SLA PDF)</span>
            </button>
          </div>

          {/* Mass actions header when multiple selected */}
          {selectedOSIdsForBulk.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 p-2.5 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-black text-amber-950 font-mono flex items-center gap-1">
                ⚠️ Ações em Massa ({selectedOSIdsForBulk.length})
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    if (window.confirm(`Excluir as ${selectedOSIdsForBulk.length} Ordens de Serviço selecionadas?`)) {
                      if (setOperationalServiceOrders) {
                        setOperationalServiceOrders(prev => prev.filter(os => !selectedOSIdsForBulk.includes(os.id)));
                        setSelectedOSIdsForBulk([]);
                        if (addNotification) addNotification("🗑️ OSs Removidas", "As Ordens de Serviço selecionadas foram apagadas.", "success");
                      }
                    }
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-mono text-[9px] font-black uppercase cursor-pointer"
                >
                  Excluir
                </button>
                <button
                  onClick={() => {
                    const status = prompt("Digite o novo status (pendente, em_execucao, concluido):", "em_execucao") as any;
                    const validatedStatus = ['pendente', 'em_execucao', 'concluido'].includes(status) ? status : 'em_execucao';
                    if (setOperationalServiceOrders) {
                      let blockedMessages: string[] = [];
                      setOperationalServiceOrders(prev => prev.map(os => {
                        if (selectedOSIdsForBulk.includes(os.id)) {
                          if (validatedStatus === 'concluido') {
                            const check = checkOSCanBeCompleted(os);
                            if (!check.canComplete) {
                              blockedMessages.push(check.reason || `OS "${os.title}" bloqueada.`);
                              return os; // Keep current OS unmodified
                            }
                          }
                          return { ...os, status: validatedStatus };
                        }
                        return os;
                      }));

                      if (blockedMessages.length > 0) {
                        alert(`Algumas Ordens de Serviço não puderam ser concluídas:\n\n${blockedMessages.join('\n')}`);
                        if (addNotification) {
                          addNotification("⚠️ OS Bloqueada", "Alguns leads ainda não concluíram todas as etapas do fluxo associado à OS.", "warning");
                        }
                      } else {
                        if (addNotification) addNotification("💼 Status Atualizado", "Status das OSs selecionadas atualizado com sucesso.", "success");
                      }
                    }
                  }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-mono text-[9px] font-black uppercase cursor-pointer"
                >
                  Status
                </button>
                <button
                  onClick={() => {
                    const priority = prompt("Defina a prioridade (baixa, media, alta, urgente):", "media") as any;
                    const validatedPriority = ['baixa', 'media', 'alta', 'urgente'].includes(priority) ? priority : 'media';
                    if (setOperationalServiceOrders) {
                      setOperationalServiceOrders(prev => prev.map(os => {
                        if (selectedOSIdsForBulk.includes(os.id)) {
                          return { ...os, priority: validatedPriority };
                        }
                        return os;
                      }));
                      if (addNotification) addNotification("⚡ Prioridade Atualizada", "Prioridade das OSs selecionadas atualizada com sucesso.", "success");
                    }
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono text-[9px] font-black uppercase cursor-pointer"
                >
                  Prioridade
                </button>
              </div>
            </div>
          )}

          {/* OS list */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {operationalServiceOrders.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic text-center py-2">Nenhuma Ordem de Serviço cadastrada.</p>
            ) : (
              operationalServiceOrders.map(os => {
                const isSelected = selectedOSIdsForBulk.includes(os.id);
                const isEditing = editingOSId === os.id;
                return (
                  <div 
                    key={os.id} 
                    className="flex flex-col p-2.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl space-y-1.5 hover:border-zinc-300 transition"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOSIdsForBulk(prev => [...prev, os.id]);
                            } else {
                              setSelectedOSIdsForBulk(prev => prev.filter(id => id !== os.id));
                            }
                          }}
                          className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingOSTitle}
                            onChange={(e) => setEditingOSTitle(e.target.value)}
                            onBlur={() => {
                              if (setOperationalServiceOrders && editingOSTitle.trim()) {
                                setOperationalServiceOrders(prev => prev.map(item => item.id === os.id ? { ...item, title: editingOSTitle } : item));
                              }
                              setEditingOSId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (setOperationalServiceOrders && editingOSTitle.trim()) {
                                  setOperationalServiceOrders(prev => prev.map(item => item.id === os.id ? { ...item, title: editingOSTitle } : item));
                                }
                                setEditingOSId(null);
                              }
                            }}
                            className="bg-white border-2 border-zinc-950 px-1 py-0.5 rounded text-xs font-bold text-zinc-900 w-full"
                            autoFocus
                          />
                        ) : (
                          <span className="font-black text-[11px] text-zinc-900 uppercase truncate">
                            {os.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            if (onOSClick) onOSClick(os);
                          }}
                          className="p-1 hover:bg-zinc-200 rounded text-indigo-600 hover:text-indigo-900 transition cursor-pointer"
                          title="Abrir Detalhes da OS"
                        >
                          <Link className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingOSId(os.id);
                            setEditingOSTitle(os.title);
                          }}
                          className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                          title="Editar Nome da OS"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja remover a Ordem de Serviço "${os.title}"?`)) {
                              if (setOperationalServiceOrders) {
                                setOperationalServiceOrders(prev => prev.filter(item => item.id !== os.id));
                                setSelectedOSIdsForBulk(prev => prev.filter(id => id !== os.id));
                              }
                            }
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                          title="Apagar OS"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono font-black uppercase text-zinc-500">
                      {os.stageId && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-200/50 text-indigo-900 border border-indigo-300 transition" title="Etapa Ativada no Fluxo">
                          📍 {os.stageId.replace('etapa-', '')}
                        </span>
                      )}
                      
                      <button
                        onClick={() => {
                          const priority = prompt(`Digite a nova prioridade para "${os.title}" (baixa, media, alta, urgente):`, os.priority) as any;
                          if (!priority) return;
                          const validatedPriority = ['baixa', 'media', 'alta', 'urgente'].includes(priority) ? priority : os.priority;
                          if (setOperationalServiceOrders) {
                            setOperationalServiceOrders(prev => prev.map(item => item.id === os.id ? { ...item, priority: validatedPriority } : item));
                            if (addNotification) {
                              addNotification("⚡ OS Atualizada", `Prioridade da OS "${os.title}" alterada para "${validatedPriority}".`, "success");
                            }
                          }
                        }}
                        className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 transition cursor-pointer hover:bg-zinc-300"
                        title="Clique para alterar a prioridade"
                      >
                        {os.priority}
                      </button>

                      <button
                        onClick={() => {
                          const status = prompt(`Digite o novo status para "${os.title}" (pendente, em_execucao, concluido):`, os.status) as any;
                          if (!status) return;
                          const validatedStatus = ['pendente', 'em_execucao', 'concluido'].includes(status) ? status : os.status;
                          
                          if (validatedStatus === 'concluido') {
                            const check = checkOSCanBeCompleted(os);
                            if (!check.canComplete) {
                              alert(`Não foi possível concluir esta OS:\n\n${check.reason}`);
                              if (addNotification) {
                                addNotification("⚠️ OS Bloqueada", `Leads pendentes impedem a conclusão da OS "${os.title}".`, "warning");
                              }
                              return;
                            }
                          }
                          
                          if (setOperationalServiceOrders) {
                            setOperationalServiceOrders(prev => prev.map(item => item.id === os.id ? { ...item, status: validatedStatus } : item));
                            if (addNotification) {
                              addNotification("💼 OS Atualizada", `Status da OS "${os.title}" alterado para "${validatedStatus === 'em_execucao' ? 'em execução' : validatedStatus}".`, "success");
                            }
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded transition cursor-pointer hover:opacity-85 ${
                          os.status === 'concluido' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : os.status === 'em_execucao' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                        }`}
                        title="Clique para alterar o status"
                      >
                        {os.status === 'em_execucao' ? 'em execução' : os.status}
                      </button>

                      {os.status !== 'concluido' && !checkOSCanBeCompleted(os).canComplete && (
                        <div 
                          className="text-amber-600 flex items-center gap-0.5 cursor-help" 
                          title={checkOSCanBeCompleted(os).reason}
                        >
                          <AlertCircle className="w-3.5 h-3.5 animate-pulse shrink-0" />
                          <span className="text-[8px] font-bold text-amber-600">PENDENTE</span>
                        </div>
                      )}

                      <span className="ml-auto text-indigo-600 font-bold">
                        {os.leadIds?.length || 0} Leads
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Flow Editor & Matrix */}
      <div className="w-full md:w-2/3 space-y-4">
        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl w-fit border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setActiveMainTab('flow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeMainTab === 'flow' 
                ? 'bg-indigo-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Editor de Etapas & Timers</span>
          </button>
          
          <button
            onClick={() => setActiveMainTab('pdf-matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeMainTab === 'pdf-matrix' 
                ? 'bg-indigo-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Matriz de SLA & Diretrizes (PDF)</span>
          </button>
        </div>

        {activeMainTab === 'flow' ? (
          selectedFlow ? (
            <div className="bg-white border-4 border-zinc-950 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-6">
              <div className="border-b-2 border-zinc-100 pb-4">
                <h2 className="text-xl font-black uppercase text-indigo-900 font-mono flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Edição de Fluxo: {selectedFlow.name}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Acesse e customize os temporizadores associados às etapas e tabelas operacionais.
                </p>
              </div>

            {/* Temporizador de Tabelas / Status */}
            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase text-zinc-700 font-mono flex items-center gap-2 bg-zinc-100 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" /> 
                1. Regras de Visibilidade (Tabelas)
              </h3>
              <p className="text-xs text-zinc-500">
                Se um lead ficar sem interações por um período maior que o estipulado, ele transita de maneira autônoma para os arquivados.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-zinc-200 rounded-xl p-4 bg-amber-50/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                  <h4 className="text-xs font-black uppercase mb-3">Estágio: Recentes (Novos)</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1">Horas</label>
                      <input 
                        type="number" min="0" max="999"
                        value={selectedFlow.statusTimers?.recentes?.hours || 24}
                        onChange={(e) => updateStatusTimer('recentes', 'hours', parseInt(e.target.value) || 0)}
                        className="w-16 p-1.5 text-center text-xs font-bold border-2 border-zinc-300 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1">Minutos</label>
                      <input 
                        type="number" min="0" max="59"
                        value={selectedFlow.statusTimers?.recentes?.minutes || 0}
                        onChange={(e) => updateStatusTimer('recentes', 'minutes', parseInt(e.target.value) || 0)}
                        className="w-16 p-1.5 text-center text-xs font-bold border-2 border-zinc-300 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-xl p-4 bg-emerald-50/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h4 className="text-xs font-black uppercase mb-3">Estágio: Ativos (Em Processo)</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1">Horas</label>
                      <input 
                        type="number" min="0" max="999"
                        value={selectedFlow.statusTimers?.ativos?.hours || 24}
                        onChange={(e) => updateStatusTimer('ativos', 'hours', parseInt(e.target.value) || 0)}
                        className="w-16 p-1.5 text-center text-xs font-bold border-2 border-zinc-300 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 mb-1">Minutos</label>
                      <input 
                        type="number" min="0" max="59"
                        value={selectedFlow.statusTimers?.ativos?.minutes || 0}
                        onChange={(e) => updateStatusTimer('ativos', 'minutes', parseInt(e.target.value) || 0)}
                        className="w-16 p-1.5 text-center text-xs font-bold border-2 border-zinc-300 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Temporizador de Etapas / Pipeline */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-100 p-2 rounded-xl gap-2">
                <h3 className="font-black text-sm uppercase text-zinc-700 font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-indigo-600" /> 
                  2. Etapas Personalizadas & Mapeamento ao Fluxo Geral
                </h3>
                <button
                  type="button"
                  onClick={handleStageAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Etapa</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedFlow.stages && selectedFlow.stages.map((stage) => (
                  <div key={stage.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border-2 border-zinc-900 rounded-2xl bg-zinc-50 hover:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-3 lg:space-y-0">
                    
                    {/* Left: Stage Title & Actions */}
                    <div className="flex items-center justify-between lg:justify-start gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                        <span className="font-sans font-black text-xs text-zinc-900 uppercase italic tracking-tight">{stage.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleStageRename(stage.id)}
                          className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-indigo-600 transition cursor-pointer"
                          title="Renomear Etapa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStageDelete(stage.id)}
                          className="p-1 hover:bg-rose-50 rounded text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                          title="Excluir Etapa"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Right: Timers */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="0" max="365"
                          value={stage.timer.days}
                          onChange={(e) => updateStageTimer(stage.id, 'days', parseInt(e.target.value) || 0)}
                          className="w-12 p-1 text-center text-xs font-bold border-2 border-zinc-300 rounded bg-white focus:border-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-mono text-zinc-400">dd</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="0" max="23"
                          value={stage.timer.hours}
                          onChange={(e) => updateStageTimer(stage.id, 'hours', parseInt(e.target.value) || 0)}
                          className="w-12 p-1 text-center text-xs font-bold border-2 border-zinc-300 rounded bg-white focus:border-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-mono text-zinc-400">hr</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="0" max="59"
                          value={stage.timer.minutes}
                          onChange={(e) => updateStageTimer(stage.id, 'minutes', parseInt(e.target.value) || 0)}
                          className="w-12 p-1 text-center text-xs font-bold border-2 border-zinc-300 rounded bg-white focus:border-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-mono text-zinc-400">mn</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 border-4 border-dashed border-zinc-300 rounded-2xl text-center">
            <Settings className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="font-bold text-zinc-500 uppercase text-sm">Selecione ou crie um fluxo para editar</p>
            <p className="text-xs text-zinc-400 mt-2">Personalize os timeouts de cada etapa separadamente</p>
          </div>
        )) : (
          /* PDF MATRIX TAB VIEW */
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-6">
            <div className="border-b-2 border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase text-indigo-900 font-mono flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Matriz Operacional de SLA (Diretrizes do PDF)
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Regulamento operacional e cronogramas oficiais para o cicloCRED CRM.
                </p>
              </div>
              
              {/* Search Matrix */}
              <div className="relative shrink-0 w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar na diretriz..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border-2 border-zinc-300 rounded-xl text-xs font-bold focus:border-indigo-600 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Matrix cards */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {filteredMatrix.map((item) => {
                const liveCount = getStageLeadCount(item.stagesIds);
                let badgeClass = "bg-zinc-100 text-zinc-800 border-zinc-300";
                if (item.color === 'indigo') badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
                if (item.color === 'violet') badgeClass = "bg-purple-100 text-purple-800 border-purple-200";
                if (item.color === 'amber') badgeClass = "bg-amber-100 text-amber-900 border-amber-200";
                if (item.color === 'rose') badgeClass = "bg-rose-100 text-rose-800 border-rose-200";
                if (item.color === 'emerald') badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";

                return (
                  <div 
                    key={item.id} 
                    className={`border-4 ${item.borderCol} rounded-2xl p-4 ${item.accentBg} space-y-4 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black/5 pb-2.5">
                      <div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeClass} tracking-wider font-mono`}>
                          {item.id.toUpperCase()}
                        </span>
                        <h4 className="font-black text-sm uppercase text-zinc-900 mt-1">{item.title}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight mt-0.5">
                          🔁 {item.etapa}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Live count indicator */}
                        <div className="flex items-center gap-1 bg-white border border-zinc-300 px-2 py-1 rounded-xl text-[10px] font-black uppercase text-indigo-950 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{liveCount} Leads Ativos</span>
                        </div>
                      </div>
                    </div>

                    {/* Columns grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-3">
                        <div>
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono block">O que fazer?</span>
                          <p className="font-bold text-zinc-800 mt-0.5">{item.fazer}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono block">Como fazer?</span>
                          <p className="text-zinc-700 font-medium mt-0.5">{item.como}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono block">Objetivo</span>
                          <p className="text-zinc-700 font-medium mt-0.5">{item.objetivo}</p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-white/40 p-3 rounded-xl border border-black/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">SLA / Cronômetro</span>
                          <span className="text-[10px] font-black text-rose-700 font-mono bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            ⏱️ {item.sla}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono block">Se não concluir no prazo (Estouro)</span>
                          <p className="font-bold text-rose-950 mt-0.5 text-[11px] flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            {item.estouro}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider font-mono block">Follow-up</span>
                            <span className="text-[10px] font-bold text-zinc-700">{item.followup}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider font-mono block">Destino Final</span>
                            <span className="text-[10px] font-black text-indigo-950 font-mono">{item.destino}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-black/5">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono block">Próxima Ação</span>
                          <p className="text-indigo-900 font-bold text-[10px] uppercase tracking-tight flex items-center gap-1 mt-0.5">
                            <ArrowRight className="w-3 h-3 text-indigo-600" />
                            {item.proxima}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
