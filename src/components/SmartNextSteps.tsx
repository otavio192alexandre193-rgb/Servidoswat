import React, { useState } from "react";
import { Lead } from "../types";
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  PhoneCall, 
  Bot, 
  CalendarDays, 
  ChevronRight,
  Filter
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SmartNextStepsProps {
  leads: Lead[];
  onNavigateToFollowUp?: (lead: Lead) => void;
  theme?: "claro" | "escuro";
}

export default function SmartNextSteps({
  leads,
  onNavigateToFollowUp,
  theme = "claro"
}: SmartNextStepsProps) {
  const isDark = theme === "escuro";
  const [filterMode, setFilterMode] = useState<"pendentes" | "hoje" | "todos">("pendentes");

  // Filter tasks from leads - mock tasks if none exist
  // We'll extract activities/followups that need attention
  const extractTasks = () => {
    const tasks: any[] = [];
    
    // Some mock logic to generate "next steps"
    leads.forEach(lead => {
      // If lead is not final status, assume it has a next step.
      if (lead.status !== "finalizado" && lead.status !== "arquivo") {
        
        let taskType = "follow-up";
        let date = new Date();
        let icon = <PhoneCall className="w-4 h-4 text-indigo-500" />;
        
        // Pseudo-randomizing based on some property length to distribute tasks
        if (lead.name.length % 3 === 0) {
          taskType = "visita";
          icon = <MapPin className="w-4 h-4 text-emerald-500" />;
          date.setDate(date.getDate() + 1); // tomorrow
        } else if (lead.name.length % 3 === 1) {
          taskType = "analise_ia";
          icon = <Bot className="w-4 h-4 text-fuchsia-500" />;
        } else {
           date.setDate(date.getDate() - 1); // atrasado
        }

        tasks.push({
          id: lead.id + "_" + taskType,
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadStatus: lead.status,
          type: taskType,
          icon,
          title: taskType === 'visita' ? 'Agendar Visita Imóvel' : taskType === 'analise_ia' ? 'Revisar Dossiê IA' : 'Ligar para Follow-up',
          dueDate: date,
          urgency: isPast(date) ? 'alta' : (isToday(date) ? 'media' : 'baixa'),
          leadRef: lead
        });
      }
    });
    
    // Sort by date/urgency
    return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  let tasks = extractTasks();
  
  if (filterMode === "pendentes") {
     tasks = tasks.filter(t => t.urgency === 'alta' || t.urgency === 'media');
  } else if (filterMode === "hoje") {
     tasks = tasks.filter(t => isToday(t.dueDate));
  }

  const getUrgencyClasses = (urgency: string) => {
    if (urgency === 'alta') return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
    if (urgency === 'media') return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800";
  };

  const getUrgencyText = (urgency: string, date: Date) => {
     if (urgency === 'alta') return "Atrasado";
     if (isToday(date)) return "Hoje";
     if (isTomorrow(date)) return "Amanhã";
     return format(date, "dd MMM", { locale: ptBR });
  };

  return (
    <div className={`w-full h-full flex flex-col rounded-2xl border-4 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden ${
      isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-950 text-zinc-900"
    }`}>
      {/* Header */}
      <div className={`p-5 lg:p-6 border-b-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-950 bg-zinc-50"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 border-2 border-zinc-950 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-xl lg:text-2xl font-sans uppercase tracking-tight">Próximos Passos</h2>
            <p className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Lista de Tarefas & Follow-ups Gerais</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`flex items-center rounded-xl border-2 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] overflow-hidden ${isDark ? "border-zinc-700" : "border-zinc-950"}`}>
          <button 
            onClick={() => setFilterMode("pendentes")}
            className={`px-4 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterMode === "pendentes" ? "bg-indigo-600 text-white" : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-700 hover:bg-zinc-100"}`}
          >
            <Filter className="w-3 h-3" />
            Pendentes <span className="bg-zinc-950 text-white px-1.5 rounded-md ml-1">{extractTasks().filter(t => t.urgency === 'alta' || t.urgency === 'media').length}</span>
          </button>
          <div className={`w-0.5 h-full ${isDark ? "bg-zinc-700" : "bg-zinc-950"}`}></div>
          <button 
            onClick={() => setFilterMode("hoje")}
            className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${filterMode === "hoje" ? "bg-indigo-600 text-white" : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-700 hover:bg-zinc-100"}`}
          >
            Apenas Hoje
          </button>
          <div className={`w-0.5 h-full ${isDark ? "bg-zinc-700" : "bg-zinc-950"}`}></div>
          <button 
            onClick={() => setFilterMode("todos")}
            className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${filterMode === "todos" ? "bg-indigo-600 text-white" : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-700 hover:bg-zinc-100"}`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {tasks.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-60">
            <CalendarDays className="w-16 h-16 mb-4 text-zinc-400" />
            <h3 className="font-sans font-black text-xl uppercase tracking-wider text-center">Tudo Limpo!</h3>
            <p className="font-mono text-xs uppercase mt-2 text-center">Nenhum próximo passo encontrado para o filtro atual.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => onNavigateToFollowUp && onNavigateToFollowUp(task.leadRef)}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer hover:border-indigo-500 hover:-translate-y-1 ${
                isDark ? "bg-zinc-900 border-zinc-700 shadow-[3px_3px_0px_0px_rgba(24,24,27,0.5)]" : "bg-white border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
              }`}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 ${
                  isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-100 border-zinc-950"
                }`}>
                  {task.icon}
                </div>
                <div>
                  <h3 className="font-black font-sans uppercase tracking-tight text-sm mb-0.5">{task.title}</h3>
                  <div className="flex items-center gap-3 font-mono text-[9px] uppercase font-bold text-zinc-500">
                    <span className="text-zinc-800 dark:text-zinc-300">{task.leadName}</span>
                    <span className="opacity-50 hidden sm:inline">•</span>
                    <span>{task.leadPhone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className={`px-3 py-1.5 rounded-lg border-2 font-mono text-[9px] font-black uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${getUrgencyClasses(task.urgency)}`}>
                  <Clock className="w-3 h-3" />
                  {getUrgencyText(task.urgency, task.dueDate)}
                </div>
                
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${
                  isDark ? "bg-zinc-950 border-zinc-800 text-zinc-500" : "bg-zinc-100 border-zinc-950 text-zinc-500"
                } hover:bg-indigo-600 hover:text-white hover:border-indigo-700 transition-colors`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
