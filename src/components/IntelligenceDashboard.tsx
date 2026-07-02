import React, { useState } from 'react';
import { Lead, RealEstateProperty, CRMNotification, OperationalOS } from '../types';
import { 
  Zap, 
  Target, 
  Building2,
  Clock, 
  TrendingUp, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Calendar,
  FileText,
  ClipboardList,
  Plus,
  Upload,
  Bot,
  Sparkles,
  Send
} from 'lucide-react';

interface IntelligenceDashboardProps {
  leads: Lead[];
  properties: RealEstateProperty[];
  onOpenLead: (lead: Lead) => void;
  addNotification: (title: string, message: string, type: CRMNotification['type']) => void;
  importBatches?: OperationalOS[];
  onNewOS?: () => void;
  onNewImport?: () => void;
  onAskCEOCopilot?: (query: string) => void;
}

export default React.memo(function IntelligenceDashboard({ 
  leads, 
  properties, 
  onOpenLead, 
  addNotification,
  importBatches = [],
  onNewOS,
  onNewImport,
  onAskCEOCopilot
}: IntelligenceDashboardProps) {
  const [customQuery, setCustomQuery] = useState("");

  // 1. Leads Críticos (Prioridade Máxima + Tempo sem contato)
  const criticalLeads = leads
    .filter(l => l.priority === 'Crítico' || l.priority === 'Muito Alto')
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 5);

  // 2. Maiores Compatibilidades Recentes
  const highCompatibilityLeads = leads
    .filter(l => (l.compatibilityScore || 0) > 80 && l.status !== 'vendido')
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 5);

  // 3. Unidades com mais matches
  const propertyMatches = properties.map(p => {
    const matches = leads.filter(l => {
      // Basic compatibility check for quick dashboard summary
      const priceMatch = l.propertyValue ? p.price <= l.propertyValue * 1.1 : true;
      const regionMatch = l.region ? p.location === l.region : true;
      return priceMatch && regionMatch;
    }).length;
    return { ...p, matchCount: matches };
  }).sort((a, b) => b.matchCount - a.matchCount).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fila Inteligente do Dia */}
        <div className="lg:col-span-2 bg-white border-4 border-zinc-950 rounded-[30px] overflow-hidden shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col">
          <div className="p-6 border-b-4 border-zinc-950 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <div>
                <h2 className="text-lg font-black uppercase italic tracking-tight">Fila Inteligente do Dia</h2>
                <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Leads Críticos & Ações Urgentes</p>
              </div>
            </div>
            <div className="bg-zinc-950 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              {criticalLeads.length} Pendentes
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
            {criticalLeads.length > 0 ? (
              criticalLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => onOpenLead(lead)}
                  className="group bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-950 rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-zinc-950 flex items-center justify-center text-xl font-black italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-zinc-900 uppercase truncate max-w-[150px]">{lead.name}</h3>
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded border border-rose-200">
                          {lead.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase">
                          <Target className="w-3 h-3" />
                          {lead.compatibilityScore || 0}% Match
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase">
                          <Clock className="w-3 h-3" />
                          {(() => {
                            if (!lead.lastContactAt) return 'Sem contato';
                            const d = new Date(lead.lastContactAt);
                            return isNaN(d.getTime()) ? 'Sem contato' : d.toLocaleDateString('pt-BR');
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black uppercase text-indigo-600">Próxima Ação:</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-zinc-950 rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {lead.nextBestAction?.includes('Ligar') && <Phone className="w-3 h-3" />}
                      {lead.nextBestAction?.includes('WhatsApp') && <MessageSquare className="w-3 h-3" />}
                      {lead.nextBestAction?.includes('Visita') && <Calendar className="w-3 h-3" />}
                      {lead.nextBestAction?.includes('Proposta') && <FileText className="w-3 h-3" />}
                      {lead.nextBestAction || 'Definir Próximo Passo'}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Tudo em dia! Sem leads críticos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Radar de Oportunidades (Matches de Estoque) */}
        <div className="bg-zinc-950 border-4 border-zinc-950 rounded-[30px] p-6 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-white flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-tight">Radar de Estoque</h2>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Unidades com Maior Demanda</p>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {propertyMatches.map(prop => (
              <div key={prop.id} className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 space-y-3 group hover:border-emerald-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="max-w-[150px]">
                    <h3 className="text-xs font-black uppercase truncate">{prop.title}</h3>
                    <p className="text-[9px] font-mono text-zinc-500">{prop.location} • {prop.neighborhood}</p>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/30 text-[10px] font-black">
                    {prop.matchCount} Matches
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-[8px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>Detalhes</span>
                  </button>
                  <button 
                    onClick={() => addNotification('Infraestrutura', `Escolas próximas a ${prop.title}: Colégio Objetivo, Escola Estadual Maria José.`, 'info')}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg border border-blue-500/30 text-[8px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1"
                  >
                    <Target className="w-3 h-3" />
                    <span>Escolas</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                   <span className="text-[10px] font-black uppercase text-zinc-500">Conversão Est.</span>
                   <span className="text-[10px] font-black text-emerald-500">Alta</span>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl border-2 border-zinc-700 text-[10px] font-black uppercase tracking-widest transition-all">
            Ver Inventário Completo
          </button>
        </div>
      </div>

      {/* SEÇÃO INTEGRADA: COPILOTO DE DECISÕES DO CEO */}
      <div className="bg-gradient-to-br from-zinc-900 to-indigo-950 border-4 border-zinc-950 rounded-[30px] p-6 text-white shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
          <Bot className="w-32 h-32 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                Copiloto de Decisões do CEO
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Diretrizes estratégicas & Diagnóstico comercial instantâneo</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-xs text-zinc-300 font-bold leading-relaxed">
            Selecione uma diretriz de análise rápida abaixo ou envie uma pergunta personalizada ao Copiloto Estratégico para receber recomendações em tempo real com base no estado atual do seu funil e leads:
          </p>

          {/* Quick Action Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Diagnóstico de Gargalos", query: "Diagnóstico de Gargalos: Onde a conversão está travando no funil atual?" },
              { label: "Táticas de Fechamento", query: "Táticas de Fechamento: Como acelerar os leads em fase de proposta?" },
              { label: "Análise de Estoque", query: "Análise de Estoque: O estoque de imóveis atende a demanda dos leads quentes?" },
              { label: "Projeção de Metas", query: "Projeção de Metas: Qual a estimativa de conversões com base no score de enquadramento?" }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAskCEOCopilot?.(chip.query)}
                className="p-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-left text-[10px] font-black uppercase text-zinc-200 hover:text-white hover:border-purple-500 transition-all cursor-pointer shadow-xs active:translate-y-0.5"
              >
                {chip.label} &rarr;
              </button>
            ))}
          </div>

          {/* Custom Query Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (customQuery.trim() && onAskCEOCopilot) {
                onAskCEOCopilot(customQuery.trim());
                setCustomQuery("");
              }
            }}
            className="flex gap-2 bg-zinc-950/40 p-1.5 border-2 border-zinc-850 rounded-2xl"
          >
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Digite sua dúvida de diretoria (Ex: Como qualificar melhor leads de renda baixa?)"
              className="flex-1 bg-transparent px-4 py-2.5 text-xs text-white font-bold placeholder-zinc-500 outline-none"
            />
            <button
              type="submit"
              disabled={!customQuery.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl border border-purple-500 flex items-center justify-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 transition-all cursor-pointer"
            >
              <span>Perguntar</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      <div className="bg-white border-4 border-zinc-950 rounded-[30px] p-6 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900">Alertas Operacionais & OS</h2>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Gargalos e Sugestões do Motor</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onNewOS} className="p-2 bg-indigo-600 text-white rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-500 transition-all active:translate-y-0.5 active:shadow-none">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onNewImport} className="p-2 bg-zinc-900 text-white rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-800 transition-all active:translate-y-0.5 active:shadow-none">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-rose-700 mb-1">Leads Parados</p>
              <p className="text-xs font-bold text-zinc-900">{leads.filter(l => !l.lastInteractionAt).length} sem interação</p>
            </div>
          </div>
          
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-700 mb-1">Matches Prontos</p>
              <p className="text-xs font-bold text-zinc-900">{highCompatibilityLeads.length} prontos para conversão</p>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-amber-700 mb-1">OS Pendentes</p>
              <p className="text-xs font-bold text-zinc-900">{importBatches.filter(b => b.status === 'pendente').length} em fila de espera</p>
            </div>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-700 mb-1">Dica de Conversão</p>
              <p className="text-xs font-bold text-zinc-900">Priorize disparos para o cluster de MCMV.</p>
            </div>
          </div>
        </div>

        {/* OS List Mini-Dashboard */}
        {importBatches.length > 0 && (
          <div className="border-t-2 border-zinc-100 pt-6">
            <h3 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-widest flex items-center gap-2">
              <ClipboardList className="w-3 h-3" />
              Ordens de Serviço de Importação Recentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {importBatches.slice(0, 3).map(batch => (
                <div key={batch.id} className="bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <h4 className="text-[11px] font-black uppercase truncate">{batch.title}</h4>
                    <p className="text-[9px] text-zinc-500 font-mono">{(() => { const d = new Date(batch.date); return isNaN(d.getTime()) ? batch.date : d.toLocaleDateString(); })()}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                      {batch.metrics.totalLeads} Leads
                    </span>
                    <span className={`text-[9px] font-black uppercase ${batch.status === 'pendente' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {batch.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
