import React, { useState } from 'react';
import { OperationalFlow, FlowStage } from '../types';
import { Settings, PlusCircle, Trash, Edit2, Play, AlertCircle } from 'lucide-react';
import { createDefaultFlow } from '../utils/flow';

interface FluxoManagerProps {
  operationalFlows: OperationalFlow[];
  setOperationalFlows: React.Dispatch<React.SetStateAction<OperationalFlow[]>>;
  addNotification?: (title: string, msg: string, type: string) => void;
}

export default function FluxoManager({ operationalFlows, setOperationalFlows, addNotification }: FluxoManagerProps) {
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);

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
      </div>

      {/* Main Content: Flow Editor */}
      <div className="w-full md:w-2/3">
        {selectedFlow ? (
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
              <h3 className="font-black text-sm uppercase text-zinc-700 font-mono flex items-center gap-2 bg-zinc-100 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" /> 
                2. Temporizadores de Pipeline (Avisos de Fim de Prazo)
              </h3>
              
              <div className="space-y-2">
                {selectedFlow.stages && selectedFlow.stages.map((stage) => (
                  <div key={stage.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-zinc-200 rounded-xl bg-zinc-50 hover:bg-white transition">
                    <div className="font-bold text-xs text-zinc-800 uppercase w-48 shrink-0 flex items-center gap-2 mb-2 sm:mb-0">
                      <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                      {stage.name}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="0" max="365"
                          value={stage.timer.days}
                          onChange={(e) => updateStageTimer(stage.id, 'days', parseInt(e.target.value) || 0)}
                          className="w-12 p-1 text-center text-xs font-bold border border-zinc-300 rounded bg-white focus:border-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-mono text-zinc-400">dd</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="0" max="23"
                          value={stage.timer.hours}
                          onChange={(e) => updateStageTimer(stage.id, 'hours', parseInt(e.target.value) || 0)}
                          className="w-12 p-1 text-center text-xs font-bold border border-zinc-300 rounded bg-white focus:border-indigo-500 outline-none"
                        />
                        <span className="text-[10px] font-mono text-zinc-400">hr</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" min="0" max="59"
                          value={stage.timer.minutes}
                          onChange={(e) => updateStageTimer(stage.id, 'minutes', parseInt(e.target.value) || 0)}
                          className="w-12 p-1 text-center text-xs font-bold border border-zinc-300 rounded bg-white focus:border-indigo-500 outline-none"
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
        )}
      </div>
    </div>
  );
}
