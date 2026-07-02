import React, { useState, useMemo } from "react";
import { Bot, Zap, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";
import FluxoManager from "./FluxoManager";

interface ScriptsAndFlowsProps {
  leads: any[];
  onUpdateLeadField: (leadId: string, fields: any) => void;
  accSettings?: any;
  triggerSensoryFeedback?: (type: string, settings: any) => void;
  addNotification?: (title: string, msg: string, type: string) => void;
  operationalFlows?: any[];
  setOperationalFlows?: any;
  initialSearchTerm?: string;
  onChangeSearchTerm?: (val: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onDeleteMultipleLeads?: (ids: string[]) => void;
  operationalServiceOrders?: any[];
  setOperationalServiceOrders?: any;
  onOSClick?: (os: any) => void;
}

export default React.memo(function ScriptsAndFlows({
  leads,
  onUpdateLeadField,
  accSettings,
  triggerSensoryFeedback,
  addNotification,
  operationalFlows = [],
  setOperationalFlows,
  operationalServiceOrders = [],
  setOperationalServiceOrders,
  onOSClick
}: ScriptsAndFlowsProps) {

  // --- Fila Inteligente do Dia Logic ---
  const smartQueue = useMemo(() => {
    const queue: any[] = [];
    if (!operationalServiceOrders) return queue;
    
    operationalServiceOrders.forEach(os => {
      if (os.status !== 'concluido' && (os.priority === 'alta' || os.priority === 'urgente' || os.status === 'em_execucao')) {
        const osLeads = (os.leadIds || []).map((id: string) => leads.find(l => l.id === id)).filter(Boolean);
        
        osLeads.forEach((lead: any) => {
          let recommendedAction = "Realizar contato de follow-up";
          let urgencyLevel = os.priority === 'urgente' ? 'text-rose-600 bg-rose-100 border-rose-300' : 'text-amber-600 bg-amber-100 border-amber-300';
          
          if (lead.stage === 'triagem') {
            recommendedAction = "Preencher dados financeiros (Renda/FGTS)";
          } else if (lead.stage === 'qualificacao') {
            recommendedAction = "Definir Perfil Principal e Imóvel de Interesse";
          } else if (lead.stage === 'compatibilizacao') {
            recommendedAction = "Enviar apresentação da solução e agendar visita";
          } else if (lead.stage === 'objecao') {
            recommendedAction = "Tratar objeções e tentar resgate ativo";
          }

          queue.push({
            lead,
            os,
            action: recommendedAction,
            style: urgencyLevel
          });
        });
      }
    });

    // Sort by priority (urgente first)
    return queue.sort((a, b) => {
      if (a.os.priority === 'urgente' && b.os.priority !== 'urgente') return -1;
      if (a.os.priority !== 'urgente' && b.os.priority === 'urgente') return 1;
      return 0;
    }).slice(0, 10); // Limit to top 10 critical actions
  }, [leads, operationalServiceOrders]);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div className="bg-zinc-900 border-4 border-zinc-950 p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 w-10 h-10 bg-indigo-500 border-2 border-zinc-950 text-white flex items-center justify-center rounded-xl shadow-[2px_2px_0px_0px_white]">
            <Bot size={20} className="font-black" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-white font-mono">Fluxo & Scripts</h2>
            <p className="text-[10px] text-zinc-400 font-bold">Gestão única de fluxos operacionais e scripts atrelados</p>
          </div>
        </div>
      </div>

      {/* FILA INTELIGENTE DO DIA */}
      <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
        <div className="flex items-center gap-2 mb-4 border-b-2 border-zinc-100 pb-3">
          <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg border-2 border-amber-300">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase text-zinc-900 font-mono">Fila Inteligente do Dia</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ações Operacionais Críticas & Prioritárias</p>
          </div>
        </div>
        
        {smartQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
            <UserCheck className="w-10 h-10 mb-2 opacity-50" />
            <span className="font-bold text-xs uppercase tracking-wider">Fila Operacional Vazia</span>
            <span className="text-[10px]">Não há leads críticos ou Ordens de Serviço pendentes para hoje.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartQueue.map((item, idx) => (
              <div key={`${item.lead.id}-${idx}`} className={`p-3 border-2 rounded-xl flex flex-col justify-between ${item.style} bg-opacity-30`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      OS: {item.os.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/50 rounded uppercase">{item.os.priority}</span>
                  </div>
                  <h4 className="font-black text-sm uppercase truncate">{item.lead.name}</h4>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight mt-0.5">
                    Etapa: {item.lead.stage || 'Não definida'}
                  </p>
                </div>
                
                <div className="mt-3 pt-2 border-t border-black/10">
                  <span className="text-[9px] font-black uppercase tracking-wider block mb-1 opacity-70">Ação Recomendada:</span>
                  <div className="flex items-start gap-1 font-bold text-xs">
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{item.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FluxoManager 
        leads={leads}
        operationalFlows={operationalFlows} 
        setOperationalFlows={setOperationalFlows}
        addNotification={addNotification}
        operationalServiceOrders={operationalServiceOrders}
        setOperationalServiceOrders={setOperationalServiceOrders}
        onOSClick={onOSClick}
      />
    </div>
  );
});
