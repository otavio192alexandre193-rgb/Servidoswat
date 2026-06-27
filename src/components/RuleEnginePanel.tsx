import React, { useState } from "react";
import { X, Settings, CheckCircle } from "lucide-react";
import { Lead } from "../types";

interface RuleEnginePanelProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function RuleEnginePanel({ isOpen, onClose, lead }: RuleEnginePanelProps) {
  const [activeModule, setActiveModule] = useState("Leads");

  const rulesData = [
    { module: "Leads", rules: [
      { id: "l1", name: "Distribuição (Round-Robin / Score)", desc: "Distribui automaticamente o lead criado por score ou corretores.", active: true },
      { id: "l2", name: "Enriquecimento Webhook", desc: "Consulta ReceitaWS ao receber telefone ou CNPJ.", active: true },
      { id: "l3", name: "Fluxo de Boas-Vindas", desc: "Inscreve novo lead no fluxo padrão.", active: false },
      { id: "l4", name: "Funil: Abertura de Email", desc: "Move lead para 'Interessado' se abrir email.", active: true },
      { id: "l5", name: "Alerta Score > 80", desc: "Envia push ao vendedor com leads quentes.", active: true },
      { id: "l6", name: "Anti-Duplicidade", desc: "Bloqueia lead com email/telefone existente na base.", active: true },
    ]},
    { module: "Funil", rules: [
      { id: "f1", name: "Avanço por Proposta", desc: "Mover etapa ao enviar proposta.", active: true },
      { id: "f2", name: "Follow-up Automático", desc: "Criar tarefa se inativo por X dias.", active: false },
      { id: "f3", name: "Lembrete Temporal Fechamento", desc: "Avisar 2 dias antes da previsão de fechamento.", active: true },
      { id: "f4", name: "Auto Atualizar Valor Real", desc: "Recalcula comissão atualizada.", active: true },
      { id: "f5", name: "Alerta Gestor (Perdido >10k)", desc: "Notifica diretoria sobre perda crítica.", active: true },
      { id: "f6", name: "Backup Histórico Funil", desc: "Salva snapshot diário de mudanças.", active: true },
    ]},
    { module: "Disparos", rules: [
      { id: "d1", name: "Agendamento Comercial", desc: "Pausa envios fora do horário comercial.", active: true },
      { id: "d2", name: "Pausa Anti-Spam", desc: "Interrompe envio se taxa de falha > 5%.", active: true },
      { id: "d3", name: "Lotes com Delay", desc: "Delay aleatório (30s-90s) para evitar block.", active: true },
    ]},
    { module: "Agendamentos", rules: [
      { id: "a1", name: "Lembrete de Reunião (-1h e -24h)", desc: "Envia email/wa para confirmar evento.", active: true },
      { id: "a2", name: "Bloqueio Deslocamento", desc: "Agenda +1h auto para reuniões presenciais.", active: false },
    ]}
  ];

  const currentRules = rulesData.find(m => m.module === activeModule)?.rules || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60  transition-opacity">
      <div className="w-full max-w-md bg-zinc-900 border-l-4 border-zinc-950 shadow-lg h-full flex flex-col font-mono   ">
        {/* Header */}
        <div className="p-4 border-b-2 border-zinc-950 flex items-center justify-between bg-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 border-2 border-zinc-950 flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-wider">Motor de Regras</h2>
              <p className="text-indigo-400 text-[10px] font-bold">Ações Automáticas Ativadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lead Context If Available */}
        {lead && (
          <div className="bg-indigo-950/50 p-3 border-b border-zinc-800 flex items-center gap-3">
            <span className="text-[10px] text-indigo-300 font-bold uppercase">Contexto:</span>
            <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px] text-white font-black truncate max-w-[200px]">
              {lead.name}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Modules */}
          <div className="w-32 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
            {rulesData.map(mod => (
              <button
                key={mod.module}
                onClick={() => setActiveModule(mod.module)}
                className={`w-full text-left p-3 text-[10px] font-black uppercase tracking-wider transition ${
                  activeModule === mod.module ? "bg-indigo-600 text-white border-l-4 border-indigo-400" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
              >
                {mod.module}
              </button>
            ))}
          </div>

          {/* Rules List */}
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-900 space-y-3">
            {currentRules.map((rule) => (
              <div key={rule.id} className="bg-zinc-800 border-2 border-zinc-950 rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-zinc-100 font-black text-xs uppercase leading-tight mb-1">{rule.name}</h4>
                    <p className="text-zinc-500 text-[9px] leading-snug">{rule.desc}</p>
                  </div>
                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input type="checkbox" className="sr-only peer" defaultChecked={rule.active} />
                    <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-colors peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t-2 border-zinc-900">
          <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] transition active:translate-y-1 active:shadow-none flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
