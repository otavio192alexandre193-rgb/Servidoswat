import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  UserCheck, 
  Sliders, 
  Zap, 
  Activity,
  CheckCircle2,
  ListOrdered,
  DollarSign,
  Briefcase,
  Home,
  CheckCircle,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Lead, OperationalOS, OperationalFlow } from '../../../types';

interface DashboardRendererProps {
  nodes: any[];
  links: any[];
  leads: Lead[];
  operationalFlows?: OperationalFlow[];
  importBatches?: OperationalOS[];
  width: number;
  height: number;
  onNodeClick?: (node: any) => void;
  onUpdateLeadField?: (leadId: string, updates: Partial<Lead>) => void;
  selectedNode?: any;
}

export default function DashboardRenderer({
  leads = [],
  operationalFlows = [],
  importBatches = [],
  onUpdateLeadField,
  onNodeClick,
  selectedNode
}: DashboardRendererProps) {
  const [activeFlowId, setActiveFlowId] = useState<string>(operationalFlows[0]?.id || 'default');
  const [simulationLog, setSimulationLog] = useState<{ id: string; msg: string; type: 'advance' | 'rollback' | 'info'; timestamp: string }[]>([]);

  // Find the currently active operational flow
  const currentFlow = useMemo(() => {
    return operationalFlows.find(f => f.id === activeFlowId) || operationalFlows[0] || {
      id: 'default',
      name: 'Fluxo Geral Padrão',
      stages: [
        { id: 'recentes', name: 'Leads Recentes', timer: { days: 1, hours: 0, minutes: 0 } },
        { id: 'contato_inicial', name: 'Contato Inicial', timer: { days: 2, hours: 0, minutes: 0 } },
        { id: 'ficha_qualificacao', name: 'Ficha e Qualificação', timer: { days: 3, hours: 0, minutes: 0 } },
        { id: 'simulacao_credito', name: 'Simulação de Crédito', timer: { days: 5, hours: 0, minutes: 0 } },
        { id: 'proposta_enviada', name: 'Proposta Enviada', timer: { days: 7, hours: 0, minutes: 0 } },
        { id: 'fechamento', name: 'Fechamento', timer: { days: 10, hours: 0, minutes: 0 } }
      ]
    };
  }, [activeFlowId, operationalFlows]);

  // Map and calculate real-time stats per stage
  const stageStats = useMemo(() => {
    const stats = currentFlow.stages?.map(stage => {
      // Find leads in this stage
      const stageLeads = leads.filter(l => {
        const leadStage = l.stage || l.generalStageId || l.status || '';
        return leadStage.toLowerCase() === stage.id.toLowerCase() || 
               leadStage.toLowerCase() === stage.name.toLowerCase() ||
               (stage.mappedStageId && leadStage.toLowerCase() === stage.mappedStageId.toLowerCase());
      });

      // Calculate time limit threshold
      const limitDays = stage.timer?.days || 0;
      const limitHours = stage.timer?.hours || 0;
      const limitMin = stage.timer?.minutes || 0;
      const totalLimitMs = ((limitDays * 24 + limitHours) * 60 + limitMin) * 60 * 1000;

      // Filter bottleneck leads
      const bottlenecks = stageLeads.filter(l => {
        const createdTime = new Date(l.createdAt).getTime();
        const lastContact = l.lastContactAt ? new Date(l.lastContactAt).getTime() : createdTime;
        const elapsed = Date.now() - lastContact;
        return elapsed > (totalLimitMs || (48 * 60 * 60 * 1000)); // 48h fallback
      });

      const totalValue = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);

      return {
        id: stage.id,
        name: stage.name,
        timerDesc: `${limitDays > 0 ? `${limitDays}d ` : ''}${limitHours}h`,
        count: stageLeads.length,
        bottleneckCount: bottlenecks.length,
        totalValue,
        leads: stageLeads,
        bottleneckLeads: bottlenecks
      };
    }) || [];

    return stats;
  }, [currentFlow, leads]);

  // Overall calculations
  const totalLeadsInFlow = useMemo(() => leads.length, [leads]);
  const totalBottlenecks = useMemo(() => stageStats.reduce((sum, s) => sum + s.bottleneckCount, 0), [stageStats]);
  const pipelineValue = useMemo(() => leads.reduce((sum, l) => sum + (l.value || 0), 0), [leads]);

  // Dynamic Chart coordinates
  const chartData = useMemo(() => {
    return stageStats.map(s => ({
      name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
      'Volume de Leads': s.count,
      'Gargalos (Atraso)': s.bottleneckCount,
      'Valor (k R$)': Math.round(s.totalValue / 1000)
    }));
  }, [stageStats]);

  const originDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const orig = l.origin || 'Web';
      counts[orig] = (counts[orig] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [leads]);

  // Selected Lead context for instant Real-time Housing Fomento / Subsidy Simulator Alignment
  const activeSelectedLead = useMemo(() => {
    if (selectedNode && selectedNode.lead) {
      return selectedNode.lead;
    }
    // Fallback: Pick first lead with income if none selected to make dashboard look complete
    return leads.find(l => l.familyGrossIncome && l.familyGrossIncome > 0) || leads[0];
  }, [selectedNode, leads]);

  // Calculate MCMV / SBPE Financing Eligibility in real-time
  const financialEligibility = useMemo(() => {
    if (!activeSelectedLead) return null;

    const income = activeSelectedLead.familyGrossIncome || 0;
    const isMCMV = income <= 8000;
    
    let range = 'Não Enquadrado';
    let maxSubsidio = 0;
    let taxaJuros = 'SBPE Mercado (~9.5% a.a.)';
    let maxFinanciamento = 0;

    if (isMCMV) {
      if (income <= 2640) {
        range = 'MCMV - Faixa 1';
        maxSubsidio = 55000;
        taxaJuros = '4.00% a.a.';
      } else if (income <= 4400) {
        range = 'MCMV - Faixa 2';
        maxSubsidio = 40000;
        taxaJuros = '5.00% a.a.';
      } else {
        range = 'MCMV - Faixa 3';
        maxSubsidio = 0;
        taxaJuros = '7.66% a.a.';
      }
      maxFinanciamento = Math.min(350000, income * 130); // MCMV Cap limit
    } else {
      range = 'SBPE / Tradicional';
      maxSubsidio = 0;
      taxaJuros = '9.9% a.a. (TR)';
      maxFinanciamento = income * 110; // SBPE estimate based on age & entry
    }

    return {
      income,
      isMCMV,
      range,
      maxSubsidio,
      taxaJuros,
      maxFinanciamento,
      leadName: activeSelectedLead.name,
      rating: income > 6000 ? 'Alto Enquadramento' : income >= 3000 ? 'Médio Enquadramento' : 'Baixo Enquadramento'
    };
  }, [activeSelectedLead]);

  // Predictive algorithm for immediate stage moves
  const predictiveActions = useMemo(() => {
    const list: { lead: Lead; type: 'advance' | 'rollback'; title: string; desc: string; targetStageId: string; reason: string }[] = [];

    leads.slice(0, 15).forEach(lead => {
      const leadStage = lead.stage || lead.generalStageId || lead.status || '';
      
      // Advance high-income leads from recent to qualification
      if (lead.familyGrossIncome && lead.familyGrossIncome >= 6500 && (leadStage === 'recentes' || leadStage === 'novo')) {
        list.push({
          lead,
          type: 'advance',
          title: `Avançar ${lead.name}`,
          desc: 'Renda acima de R$6,5k. Enviar imediato para simulação SBPE.',
          targetStageId: 'ficha_qualificacao',
          reason: 'Score financeiro alto'
        });
      }

      // Rollback leads with objections active
      const hasObjection = lead.objection || (lead.objections && lead.objections.length > 0);
      if (hasObjection && leadStage !== 'recentes' && leadStage !== 'novo') {
        list.push({
          lead,
          type: 'rollback',
          title: `Re-engajar ${lead.name}`,
          desc: `Identificada objeção ativa. Mover para re-qualificação imediata.`,
          targetStageId: 'contato_inicial',
          reason: `Gargalo: Objeção`
        });
      }
    });

    return list.slice(0, 4);
  }, [leads]);

  // Apply simulated movement action
  const handleApplyAction = (leadId: string, targetStageId: string, type: 'advance' | 'rollback', leadName: string) => {
    if (onUpdateLeadField) {
      onUpdateLeadField(leadId, {
        stage: targetStageId,
        generalStageId: targetStageId,
        lastInteractionAt: new Date().toISOString()
      });

      const logMsg = {
        id: Math.random().toString(),
        msg: `${type === 'advance' ? '🚀 AVANÇO' : '🔄 RE-ENGAJAMENTO'} aplicado para ${leadName} ➔ "${targetStageId}"`,
        type,
        timestamp: new Date().toLocaleTimeString()
      };
      setSimulationLog(prev => [logMsg, ...prev]);
    }
  };

  // Quick Action: Simulate a new lead ingress
  const handleSimulateNewLead = () => {
    if (onUpdateLeadField) {
      const logMsg = {
        id: Math.random().toString(),
        msg: `📥 WEBHOOK: Novo lead registrado na Central cycleCRED via Integração WhatsApp`,
        type: 'info' as const,
        timestamp: new Date().toLocaleTimeString()
      };
      setSimulationLog(prev => [logMsg, ...prev]);
    }
  };

  // Quick Action: Clear all critical bottleneck alerts
  const handleClearBottlenecks = () => {
    leads.forEach(l => {
      const leadStage = l.stage || l.generalStageId || l.status || '';
      if (l.lastContactAt) {
        onUpdateLeadField?.(l.id, { lastContactAt: new Date().toISOString() });
      }
    });
    const logMsg = {
      id: Math.random().toString(),
      msg: `⚡ SLAs RESETADOS: Datas de último contato re-engajadas globalmente em tempo real`,
      type: 'info' as const,
      timestamp: new Date().toLocaleTimeString()
    };
    setSimulationLog(prev => [logMsg, ...prev]);
  };

  return (
    <div className="w-full h-full bg-[#030305] text-zinc-100 overflow-y-auto p-4 sm:p-6 scrollbar-thin flex flex-col gap-6 select-none relative z-10">
      
      {/* Background radial ambient lights */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-cyan-950/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[250px] h-[250px] rounded-full bg-purple-950/20 blur-[80px] pointer-events-none" />

      {/* Responsive Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
              Painel Geral de Diagnóstico Real-time
            </h2>
            <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded font-mono font-black animate-pulse">
              SYNCED
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-1">
            Métricas de fomento de faturamento, simulações integradas, tempos de estágio e inteligência preditiva de O.S.
          </p>
        </div>

        {/* Operational Flow selector & Simulation Triggers */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <select
            value={activeFlowId}
            onChange={(e) => setActiveFlowId(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 text-zinc-300 text-[11px] font-black uppercase rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xl font-mono"
          >
            {operationalFlows.length > 0 ? (
              operationalFlows.map(flow => (
                <option key={flow.id} value={flow.id}>{flow.name}</option>
              ))
            ) : (
              <option value="default">Fluxo Geral Padrão</option>
            )}
          </select>

          <button
            onClick={handleSimulateNewLead}
            className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition cursor-pointer flex items-center gap-1 font-mono"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            Simular Ingress
          </button>
          
          <button
            onClick={handleClearBottlenecks}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition cursor-pointer flex items-center gap-1 font-mono"
          >
            <RotateCcw className="w-3 h-3 text-zinc-300" />
            Resetar SLAs
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border-2 border-zinc-900 p-4 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-black">Em Atendimento</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1 font-mono">
            {totalLeadsInFlow}
            <span className="text-xs font-normal text-zinc-500">leads</span>
          </div>
          <div className="text-[9px] text-emerald-400 flex items-center gap-1 mt-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Engajamento Ativo</span>
          </div>
          <div className="absolute top-2 right-2 p-1 bg-zinc-900 rounded-lg text-zinc-500">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-zinc-950 border-2 border-[#1a0f0f] p-4 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="text-[8.5px] font-mono text-rose-500 uppercase tracking-widest font-black">Retenções Críticas</div>
          <div className="text-2xl font-black text-rose-500 mt-1 flex items-baseline gap-1 font-mono">
            {totalBottlenecks}
            <span className="text-xs font-normal text-rose-500/60">SLA estourado</span>
          </div>
          <div className="text-[9px] text-rose-400 flex items-center gap-1 mt-2 font-mono">
            <AlertTriangle className="w-3 h-3" />
            <span>Excedeu tempo regulamentar</span>
          </div>
          <div className="absolute top-2 right-2 p-1 bg-rose-950/40 rounded-lg text-rose-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-zinc-950 border-2 border-[#0e1717] p-4 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-widest font-black">Volume de Crédito Habitacional</div>
          <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(pipelineValue)}
          </div>
          <div className="text-[9px] text-cyan-500 flex items-center gap-1 mt-2 font-mono">
            <Sparkles className="w-3 h-3" />
            <span>Enquadrado MCMV & SBPE</span>
          </div>
          <div className="absolute top-2 right-2 p-1 bg-cyan-950/40 rounded-lg text-cyan-400">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-zinc-950 border-2 border-[#160e1d] p-4 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="text-[8.5px] font-mono text-purple-400 uppercase tracking-widest font-black">Conversão Projetada</div>
          <div className="text-2xl font-black text-purple-400 mt-1 font-mono">
            {totalLeadsInFlow > 0 ? `${Math.round(((totalLeadsInFlow - totalBottlenecks) / totalLeadsInFlow) * 100)}%` : '100%'}
          </div>
          <div className="text-[9px] text-purple-500 flex items-center gap-1 mt-2 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>Giro do ciclo de vendas</span>
          </div>
          <div className="absolute top-2 right-2 p-1 bg-purple-950/40 rounded-lg text-purple-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline and Real-time Housing Fomento Simulator alignment */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2): Visual Stage Pipeline & Charts */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Conversion Pipeline widget */}
          <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-cyan-400" />
                Pipeline de Conversão Cronometrada (Estágios do Fluxo)
              </span>
              <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded font-mono font-black animate-pulse">
                AUTOMATION ACTIVE
              </span>
            </div>

            {/* Stage Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stageStats.map((stage, idx) => {
                const hasBottleneck = stage.bottleneckCount > 0;
                return (
                  <div 
                    key={stage.id} 
                    className={`p-3 rounded-2xl border relative transition-all duration-300 ${
                      hasBottleneck 
                        ? 'bg-rose-950/5 border-rose-900/30 shadow-md' 
                        : 'bg-zinc-900/20 border-zinc-850 hover:border-zinc-800'
                    }`}
                  >
                    <div className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-tight flex justify-between">
                      <span>Fase {idx + 1}</span>
                      <span className="text-cyan-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {stage.timerDesc}
                      </span>
                    </div>

                    <div className="text-xs font-black text-zinc-100 truncate mt-1.5" title={stage.name}>
                      {stage.name}
                    </div>

                    <div className="flex items-baseline justify-between mt-3 font-mono">
                      <div>
                        <span className="text-base font-black text-white">{stage.count}</span>
                        <span className="text-[8px] text-zinc-500 ml-0.5">leads</span>
                      </div>

                      {hasBottleneck && (
                        <div className="bg-rose-950/80 text-rose-400 text-[8px] px-1 py-0.5 rounded border border-rose-900/40 font-black flex items-center gap-0.5 animate-pulse">
                          <span>{stage.bottleneckCount} critical</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-850 h-1 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full ${hasBottleneck ? 'bg-rose-500' : 'bg-cyan-500'}`}
                        style={{ width: `${stage.count > 0 ? Math.min(100, ((stage.count - stage.bottleneckCount) / stage.count) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts Row */}
          <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Volume e Gargalos por Estágio Operacional
            </span>

            <div className="h-[210px] w-full pointer-events-auto">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                    />
                    <Bar dataKey="Volume de Leads" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#a855f7' : '#3b82f6'} />
                      ))}
                    </Bar>
                    <Bar dataKey="Gargalos (Atraso)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
                  Sem dados para exibição do gráfico.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Real-time Financing Enquadramento and Predictive Actions */}
        <div className="flex flex-col gap-6">

          {/* Integrated Subsidy eligibility engine */}
          {financialEligibility && (
            <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs font-black uppercase tracking-wider font-mono text-zinc-200 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Subsídio e Enquadramento Habitacional
                </span>
                <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-900/40">
                  REAL-TIME SIM
                </span>
              </div>

              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Lead Focado:</span>
                  <span className="text-zinc-200 font-bold">{financialEligibility.leadName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Renda Bruta Familiar:</span>
                  <span className="text-cyan-400 font-bold font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialEligibility.income)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Classificação Fomento:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    financialEligibility.isMCMV ? 'bg-indigo-950 text-indigo-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {financialEligibility.range}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Taxa Estimada Juros:</span>
                  <span className="text-emerald-400 font-bold">{financialEligibility.taxaJuros}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                  <span className="text-zinc-500">Subsídio de Fomento:</span>
                  <span className="text-pink-400 font-black">
                    {financialEligibility.maxSubsidio > 0 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialEligibility.maxSubsidio)
                      : 'Sem Subsídio (SBPE / Acima do teto)'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-500">Financiamento Máximo:</span>
                  <span className="text-white font-black">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialEligibility.maxFinanciamento)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Predictive recommendations stream */}
          <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl flex flex-col gap-4 shadow-xl flex-1">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300 flex items-center gap-2 border-b border-zinc-900 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Sugestões de Avanço / Re-engajamento
            </span>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[190px] pr-1 scrollbar-thin">
              {predictiveActions.length > 0 ? (
                predictiveActions.map((act, i) => {
                  const isAdvance = act.type === 'advance';
                  return (
                    <div 
                      key={i} 
                      className="bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl flex flex-col gap-2 hover:bg-zinc-900/60 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          isAdvance 
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/20' 
                            : 'bg-amber-950/30 text-amber-400 border-amber-800/20'
                        }`}>
                          {isAdvance ? 'Avanço Preditivo' : 'Objeção Encontrada'}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">
                          {act.reason}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-zinc-100 truncate">
                        {act.title}
                      </div>

                      <p className="text-[10px] text-zinc-400 leading-normal font-mono">
                        {act.desc}
                      </p>

                      <div className="flex justify-end pointer-events-auto">
                        <button
                          onClick={() => handleApplyAction(act.lead.id, act.targetStageId, act.type, act.lead.name)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 transition ${
                            isAdvance 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          Aplicar Ação
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-zinc-600 font-mono text-xs">
                  Aguardando faturamento e renda bruta familiar...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Grid of Origins vs Stuck Objections & Realtime Simulation Logs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Origin distribution table */}
        <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300">
            Origens de Entrada Ativas
          </span>
          <div className="flex flex-col gap-2.5 mt-4">
            {originDistribution.map((orig, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-900 text-xs">
                <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  {orig.name}
                </span>
                <span className="font-black text-white font-mono">{orig.value} leads</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottleneck alert boxes */}
        <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-rose-400 flex items-center gap-1.5">
            <BadgeAlert className="w-4.5 h-4.5 text-rose-500" />
            Alertas de Retenção Crítica (SLA)
          </span>

          <div className="flex flex-col gap-2 mt-4 max-h-[140px] overflow-y-auto scrollbar-thin">
            {stageStats.some(s => s.bottleneckCount > 0) ? (
              stageStats.filter(s => s.bottleneckCount > 0).map(stage => (
                <div key={stage.id} className="bg-rose-950/10 border border-rose-900/30 p-2.5 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-rose-400">{stage.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Time limite: {stage.timerDesc}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-500 font-mono">{stage.bottleneckCount} leads</span>
                    <p className="text-[8px] text-zinc-500 font-mono">excedido</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-600 font-mono text-xs">
                Nenhuma etapa com retenção crítica regulamentada!
              </div>
            )}
          </div>
        </div>

        {/* Live sync logs ticker */}
        <div className="bg-zinc-950 border-2 border-zinc-900 p-5 rounded-2xl shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            Histórico de Lógica Aplicada (Real-time)
          </span>

          <div className="flex flex-col gap-1.5 mt-4 max-h-[140px] overflow-y-auto font-mono text-[9px] text-zinc-400 scrollbar-thin">
            {simulationLog.length > 0 ? (
              simulationLog.map(log => (
                <div key={log.id} className="border-b border-zinc-900 pb-1 flex items-start gap-1">
                  <span className="text-zinc-600">[{log.timestamp}]</span>
                  <span className={log.type === 'advance' ? 'text-emerald-400' : 'text-amber-400'}>
                    {log.msg}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-600 italic">
                Aguardando execução de ações cognitivas preditivas...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
