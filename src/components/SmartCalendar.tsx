import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Phone, 
  Bot, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Flame, 
  CalendarPlus, 
  Home
} from "lucide-react";
import { Lead } from "../types";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SmartCalendarProps {
  leads: Lead[];
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
  onNavigateToFollowUp?: (lead: Lead) => void;
  onOpenAIAssistant?: (lead: Lead) => void;
  theme?: "claro" | "escuro";
}

export default function SmartCalendar({ 
  leads, 
  onUpdateLead, 
  onNavigateToFollowUp, 
  onOpenAIAssistant,
  theme = "claro" 
}: SmartCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "dia">("semana");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Generate calendar days
  const getDaysInView = () => {
    if (viewMode === "semana") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else if (viewMode === "dia") {
      return [selectedDate];
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const days = getDaysInView();
  const isDark = theme === "escuro";

  return (
    <div className={`w-full h-full flex flex-col xl:flex-row gap-4 p-2 relative ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
      {/* COLUNA 1: FOLLOW-UP (Left Sidebar) */}
      <div className={`w-full xl:w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto hidden xl:flex`}>
        <div className={`p-4 rounded-2xl flex flex-col h-full bg-white dark:bg-zinc-900 border-4 border-zinc-950 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]`}>
          <div className="flex items-center gap-2 mb-4 border-b-4 pb-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-black font-sans uppercase text-sm tracking-widest text-indigo-600 dark:text-indigo-400">Assistente IA</h2>
          </div>
          
          {selectedLead ? (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <h3 className="font-black text-lg leading-tight uppercase font-sans tracking-tight">{selectedLead.name}</h3>
                <span className="text-[10px] font-bold opacity-70 block font-mono">{selectedLead.phone}</span>
              </div>
              
              <div className={`p-3 rounded-xl border-2 bg-zinc-50 dark:bg-zinc-950 border-zinc-950 dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`}>
                <h4 className="font-mono text-[9px] uppercase font-black tracking-widest mb-3 text-zinc-500">Sugestões (Gemini)</h4>
                <div className="space-y-3 text-xs font-bold font-mono">
                  <p className="flex items-center gap-2 text-amber-600 dark:text-amber-500"><Flame className="w-4 h-4 shrink-0"/> TEMPERATURA: QUENTE</p>
                  <p className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><AlertCircle className="w-4 h-4 shrink-0"/> AÇÃO: REVER VISITA</p>
                  <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500"><Clock className="w-4 h-4 shrink-0"/> TEMPO: AMANHÃ 14H</p>
                </div>
              </div>

              <div className="mt-auto space-y-2">
                <input 
                  type="text" 
                  placeholder="Ex: Agendar follow-up para quinta às 14h..."
                  className={`w-full p-3 rounded-xl border-2 text-[10px] uppercase font-black font-mono transition-colors focus:outline-none bg-zinc-50 dark:bg-zinc-950 border-zinc-950 dark:border-zinc-700 focus:border-indigo-500 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] dark:shadow-none placeholder-zinc-400`}
                />
                <button className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] transition-colors hover:translate-y-[-1px] cursor-pointer border-2 border-zinc-950 dark:border-indigo-400">
                  Executar Comando NLP
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-3">
              <CalendarIcon className="w-10 h-10" />
              <p className="text-[10px] uppercase font-black font-mono tracking-widest">Selecione um lead<br/>para exibir o Dossiê</p>
            </div>
          )}
        </div>
      </div>

      {/* COLUNA 2: CALENDÁRIO CENTRAL */}
      <div className={`flex-1 flex flex-col rounded-2xl bg-white dark:bg-zinc-950 border-4 border-zinc-950 dark:border-zinc-800 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden`}>
        <div className={`p-4 border-b-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-zinc-950 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900`}>
          <div className="flex items-center gap-3">
            <h2 className="font-black text-xl lg:text-2xl font-sans uppercase tracking-tight">Calendário</h2>
            <div className={`px-2.5 py-1 rounded-lg border-2 text-[10px] font-black font-mono uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] bg-white dark:bg-zinc-800 border-zinc-950 dark:border-zinc-700`}>
              {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex rounded-lg border-2 overflow-hidden shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] border-zinc-950 dark:border-zinc-700`}>
              <button 
                onClick={() => setViewMode("dia")}
                className={`px-4 py-2 text-[9px] font-black uppercase transition-colors ${viewMode === "dia" ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-400"} border-r-2 border-zinc-950 dark:border-zinc-700`}
              >Dia</button>
              <button 
                onClick={() => setViewMode("semana")}
                className={`px-4 py-2 text-[9px] font-black uppercase transition-colors ${viewMode === "semana" ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-400"} border-r-2 border-zinc-950 dark:border-zinc-700`}
              >Semana</button>
              <button 
                onClick={() => setViewMode("mes")}
                className={`px-4 py-2 text-[9px] font-black uppercase transition-colors ${viewMode === "mes" ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-400"}`}
              >Mês</button>
            </div>
          </div>
        </div>
        
        <div className={`flex-1 overflow-y-auto p-4 bg-zinc-100/50 dark:bg-zinc-950/50`}>
          <div className={`grid gap-3 h-full ${viewMode === "mes" ? "grid-cols-7" : viewMode === "semana" ? "grid-cols-7" : "grid-cols-1"}`}>
            {days.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={idx} className={`min-h-[140px] rounded-xl border-2 flex flex-col p-2 transition-colors bg-white dark:bg-zinc-900 ${isToday ? "border-indigo-600 shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] scale-[1.02] z-10" : "border-zinc-950 dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"}`}>
                  <div className="flex items-center justify-between mb-3 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-1">
                    <span className={`text-xs font-black font-mono ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-zinc-400"}`}>
                      {format(day, "dd")} <span className="opacity-50 ml-1">{viewMode !== "mes" && format(day, "EEE", { locale: ptBR })}</span>
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-900 dark:text-white">
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none pr-1">
                    {/* Simulated Events */}
                    {idx === 2 && (
                       <div onClick={() => setSelectedLead(leads[0] || null)} className={`p-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-[9px] font-black uppercase tracking-tight cursor-pointer hover:translate-y-[-1px] transition-transform shadow-[1.5px_1.5px_0px_0px_rgba(79,70,229,1)]`}>
                         <span className="flex items-center gap-1 mb-1 text-indigo-900 dark:text-indigo-200"><Phone className="w-3 h-3 text-indigo-600"/> João Silva</span>
                         <span className="text-indigo-600 dark:text-indigo-400 font-mono">14:00 - Follow-up</span>
                       </div>
                    )}
                    {idx === 2 && (
                       <div className={`p-2 rounded-lg border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-black uppercase tracking-tight cursor-pointer hover:translate-y-[-1px] transition-transform shadow-[1.5px_1.5px_0px_0px_rgba(5,150,105,1)]`}>
                         <span className="flex items-center gap-1 mb-1 text-emerald-900 dark:text-emerald-200"><Home className="w-3 h-3 text-emerald-600"/> Pedro Costa</span>
                         <span className="text-emerald-600 dark:text-emerald-400 font-mono">16:30 - Visita</span>
                       </div>
                    )}
                    {idx === 4 && (
                       <div className={`p-2 rounded-lg border-2 border-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-[9px] font-black uppercase tracking-tight cursor-pointer hover:translate-y-[-1px] transition-transform shadow-[1.5px_1.5px_0px_0px_rgba(192,38,211,1)]`}>
                         <span className="flex items-center gap-1 mb-1 text-fuchsia-900 dark:text-fuchsia-200"><Bot className="w-3 h-3 text-fuchsia-600"/> Maria Santos</span>
                         <span className="text-fuchsia-600 dark:text-fuchsia-400 font-mono">Auto Análise</span>
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLUNA 3: HISTÓRICO */}
      <div className={`w-full xl:w-[280px] shrink-0 flex flex-col gap-4 overflow-y-auto hidden xl:flex`}>
         <div className={`p-4 rounded-2xl flex flex-col h-full bg-white dark:bg-zinc-900 border-4 border-zinc-950 dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]`}>
           <div className="flex items-center gap-2 mb-4 border-b-4 pb-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <Clock className="w-5 h-5 text-zinc-900 dark:text-zinc-400" />
            <h2 className="font-black font-sans uppercase text-sm tracking-widest text-zinc-900 dark:text-zinc-100">Linha do Tempo</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:w-0.5 before:h-full before:bg-zinc-200 dark:before:bg-zinc-800 pr-2">
            
            {/* Timeline Items Mock */}
            <div className="relative flex items-center justify-between z-10 w-full pl-8 md:pl-0">
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-zinc-950 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(24,24,27,1)]">
                <Phone className="w-3 h-3 text-white" />
              </div>
              <div className={`w-full md:w-[calc(100%-2rem)] p-2.5 rounded-xl border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[9px] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`}>
                <div className="flex justify-between font-black uppercase text-indigo-600 dark:text-indigo-400 mb-1.5 font-sans trackign-tight">
                  <span>João Silva</span> <span className="font-mono">09:00</span>
                </div>
                <p className="font-bold text-zinc-600 dark:text-zinc-400 font-mono">Ligação realizada (3 mins)</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between z-10 w-full pl-8 md:pl-0">
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-6 h-6 rounded-full bg-fuchsia-600 border-2 border-zinc-950 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(24,24,27,1)]">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className={`w-full md:w-[calc(100%-2rem)] p-2.5 rounded-xl border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[9px] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`}>
                <div className="flex justify-between font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 mb-1.5 font-sans trackign-tight">
                  <span>Gemini</span> <span className="font-mono">10:30</span>
                </div>
                <p className="font-bold text-zinc-600 dark:text-zinc-400 font-mono">Dossiê atualizado</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between z-10 w-full pl-8 md:pl-0">
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-800 border-2 border-zinc-950 dark:border-zinc-700 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(24,24,27,1)]">
                <CheckCircle2 className="w-3 h-3 text-zinc-500" />
              </div>
              <div className={`w-full md:w-[calc(100%-2rem)] p-2.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-[9px] shadow-[2px_2px_0px_0px_rgba(24,24,27,0.2)]`}>
                <div className="flex justify-between font-black uppercase text-zinc-500 mb-1.5 font-sans trackign-tight">
                  <span>João Silva</span> <span className="font-mono">18:00</span>
                </div>
                <p className="font-bold text-zinc-400 font-mono line-through">Follow-up concluído</p>
              </div>
            </div>

          </div>
         </div>
      </div>
    </div>
  );
}
