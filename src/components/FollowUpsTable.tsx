/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Appointment, Lead } from '../types';
import { 
  Calendar, 
  Search, 
  Trash2, 
  ExternalLink,
  Filter,
  Check,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  List,
  Sparkles,
  CalendarDays,
  User,
  Plus,
  FileText,
  Download,
  Database,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { getWorkspaceToken, uploadFileToGoogleDrive, syncCRMMovementToGoogleSheet } from './GoogleWorkspace';
import ScheduleFollowUpModal from './ScheduleFollowUpModal';

interface FollowUpsTableProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  leads: Lead[];
  onOpenLeadDetails: (lead: Lead) => void;
  awardXP?: (xpGained: number) => void;
  addNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai') => void;
}

export default function FollowUpsTable({
  appointments,
  setAppointments,
  leads,
  onOpenLeadDetails,
  awardXP,
  addNotification
}: FollowUpsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  
  // Tabs: 'tabela' | 'calendario'
  const [viewMode, setViewMode] = useState<'tabela' | 'calendario'>('tabela');
  
  // Calendar States (Defaults to Today's actual date)
  const [currentDate, setCurrentDate] = useState(() => new Date()); 
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());

  // Bulk Selection States
  const [selectedAptIds, setSelectedAptIds] = useState<Set<string>>(new Set());

  // Interactive popup agendador states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleInitialLead, setScheduleInitialLead] = useState<Lead | null>(null);

  // Gemini assistant states
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Stats calculations
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'agendado').length;
  const completedCount = appointments.filter(a => a.status === 'realizado').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelado').length;

  // Toggle Appointment Status cycle
  const handleToggleStatus = (id: string) => {
    const updated = appointments.map(apt => {
      if (apt.id === id) {
        const nextStatus = apt.status === 'agendado' ? 'realizado' : apt.status === 'realizado' ? 'cancelado' : 'agendado';
        return { ...apt, status: nextStatus };
      }
      return apt;
    });
    setAppointments(updated);
    localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
    if (awardXP) awardXP(30);
  };

  // Delete Appointment
  const handleDeleteAppointment = (id: string) => {
    if (window.confirm("Deseja realmente remover este compromisso de follow-up?")) {
      const updated = appointments.filter(apt => apt.id !== id);
      setAppointments(updated);
      localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
      if (awardXP) awardXP(15);
      
      // Remove from selected set
      const newSelected = new Set(selectedAptIds);
      newSelected.delete(id);
      setSelectedAptIds(newSelected);
    }
  };

  // Bulk actions handlers
  const handleToggleStatusBulk = (status: 'realizado' | 'cancelado') => {
    const updated = appointments.map(apt => {
      if (selectedAptIds.has(apt.id)) {
        return { ...apt, status };
      }
      return apt;
    });
    setAppointments(updated);
    localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
    
    if (awardXP) awardXP(15 * selectedAptIds.size);
    if (addNotification) {
      addNotification(
        "Atualização em Massa", 
        `Status de ${selectedAptIds.size} compromissos de follow-up atualizado para "${status}" com sucesso.`, 
        'success'
      );
    }
    setSelectedAptIds(new Set());
  };

  const handleDeleteBulk = () => {
    if (window.confirm(`Deseja realmente excluir todos os ${selectedAptIds.size} compromissos de follow-up selecionados em massa?`)) {
      const updated = appointments.filter(apt => !selectedAptIds.has(apt.id));
      setAppointments(updated);
      localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
      
      if (awardXP) awardXP(10 * selectedAptIds.size);
      if (addNotification) {
        addNotification(
          "Exclusão em Massa", 
          `Foram removidos ${selectedAptIds.size} compromissos comerciais de follow-up da sua agenda ativa.`, 
          'warning'
        );
      }
      setSelectedAptIds(new Set());
    }
  };

  const handleGeminiAssist = async () => {
    setIsGeminiLoading(true);
    setGeminiResult(null);
    
    try {
      const selectedApts = appointments.filter(a => selectedAptIds.has(a.id));
      const selectedLeads = leads.filter(l => selectedApts.some(a => a.leadId === l.id));
      
      const res = await fetch('/api/ai/followups-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointments: selectedApts, leads: selectedLeads })
      });
      
      if (!res.ok) throw new Error('Falha no assistente Gemini');
      const data = await res.json();
      setGeminiResult(data.text || 'Nenhum resultado gerado pelo assistente.');
      
      if (awardXP) awardXP(50);
      if (addNotification) {
        addNotification(
          "Insights do Gemini", 
          `Assistência de copywriting e plano comercial criada para os ${selectedAptIds.size} leads de follow-up ativos.`, 
          'ai'
        );
      }
    } catch (err) {
      console.warn("Falling back to local static AI copy advice...", err);
      setGeminiResult(`### 🤖 Assistente Preditivo cicloCRED (Plano de Contingência)

Infelizmente houve uma instabilidade de rede ou a chave da API está temporariamente ausente.
Seguem as orientações táticas gerais de abordagem comercial para os leads selecionados:

*   **Abordagem por Whatsapp**: Comece com perguntas abertas focadas em orçamento. Se o cliente for do perfil Minha Casa Minha Vida, reforce as vantagens dos subsídios estaduais/federais e as taxas de juros reduzidas de fomento Caixa.
*   **Abordagem de Proposta**: Foque na segurança jurídica da aprovação de crédito Caixa. Destaque que a simulação oficial é rápida e sem compromisso.
*   **Ganchos de Fechamento**: Ofereça uma visita guiada ao decorado com café e atendimento consultivo da cicloCRED.`);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const handleExportToDrive = async () => {
    const token = getWorkspaceToken();
    if (!token) {
      alert("⚠️ Conexão Google Requerida: Sua conta Google não está conectada. Por favor, conecte-a na aba 'Google Workspace' no menu de configurações do CRM.");
      return;
    }
    
    setIsExporting(true);
    try {
      const selectedApts = appointments.filter(a => selectedAptIds.has(a.id));
      const selectedLeads = leads.filter(l => selectedApts.some(a => a.leadId === l.id));
      
      let report = `====================================================
PLANO DE NEGOCIAÇÃO E CRÉDITO COMERCIAL: cicloCRED CRM
Gerado em: ${new Date().toLocaleString('pt-BR')}
====================================================\n\n`;
      
      selectedApts.forEach((apt, idx) => {
        const lead = selectedLeads.find(l => l.id === apt.leadId);
        report += `----------------------------------------------------\n`;
        report += `TAREFA DE FOLLOW-UP #${idx + 1}\n`;
        report += `Título: ${apt.title}\n`;
        report += `Tipo de Ação: ${apt.type.toUpperCase()}\n`;
        report += `Status Atual: ${apt.status.toUpperCase()}\n`;
        report += `Agendamento: ${apt.date.split('-').reverse().join('/')} às ${apt.time}\n`;
        report += `Notas: ${apt.description}\n\n`;
        
        if (lead) {
          report += `DETALHES DO LEAD INTEGRADO:\n`;
          report += `- Nome: ${lead.name}\n`;
          report += `- Celular/WhatsApp: ${lead.phone || 'Não informado'}\n`;
          report += `- Renda Bruta Familiar Declarada: R$ ${lead.familyIncome || lead.familyGrossIncome || 0}\n`;
          report += `- Origem de Entrada: ${lead.origin || 'Ficha ativa'}\n`;
          report += `- Observações da Ficha: ${lead.notes || 'Sem observações adicionais.'}\n`;
        }
        report += `----------------------------------------------------\n\n`;
      });
      
      const filename = `ciclocred_plano_vendas_${Date.now()}.txt`;
      const success = await uploadFileToGoogleDrive(filename, report);
      
      if (success) {
        if (awardXP) awardXP(80);
        if (addNotification) {
          addNotification(
            "Exportação para Drive", 
            `O relatório tático de ${selectedAptIds.size} follow-ups foi gravado no arquivo "${filename}" no seu Drive.`, 
            'success'
          );
        }
        alert(`✓ Sucesso! O arquivo "${filename}" foi exportado e salvo no seu Google Drive.`);
      } else {
        alert("Falha na gravação do arquivo. Verifique sua conexão e tente de novo.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha operacional ao enviar arquivo para o Google Drive.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToSheets = async () => {
    const token = getWorkspaceToken();
    if (!token) {
      alert("⚠️ Conexão Google Requerida: Sua conta Google não está conectada. Por favor, conecte-a na aba 'Google Workspace' no menu de configurações do CRM.");
      return;
    }
    
    setIsExporting(true);
    try {
      const selectedApts = appointments.filter(a => selectedAptIds.has(a.id));
      let successCount = 0;
      
      for (const apt of selectedApts) {
        const details = `[Exportado] Compromisso: ${apt.title} | Data: ${apt.date} às ${apt.time} | Tipo: ${apt.type} | Lead: ${apt.leadName}`;
        const ok = await syncCRMMovementToGoogleSheet(
          "Follow-up Exportado",
          details,
          "Corretor cicloCRED"
        );
        if (ok) successCount++;
      }
      
      if (successCount > 0) {
        if (awardXP) awardXP(40);
        if (addNotification) {
          addNotification(
            "Exportação para Planilha", 
            `Foram registrados ${successCount} compromissos comerciais na planilha ativa integrada do Google Sheets.`, 
            'success'
          );
        }
        alert(`✓ Sucesso! ${successCount} compromissos foram adicionados como movimentos na sua Planilha Google.`);
      } else {
        alert("Falha ao registrar compromissos. Certifique-se de que a planilha de sincronização está ativa.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao sincronizar dados com o Google Sheets.");
    } finally {
      setIsExporting(false);
    }
  };

  // Find corresponding lead object to open details
  const handleLeadClick = (leadName: string, leadId?: string) => {
    const found = leads.find(l => l.id === leadId || l.name.toLowerCase() === leadName.toLowerCase());
    if (found) {
      onOpenLeadDetails(found);
    } else {
      alert(`Lead "${leadName}" não foi localizado no sistema ativo.`);
    }
  };

  // Filtered appointments for table listing
  const filteredAppointments = appointments.filter(apt => {
    const textMatch = 
      (apt.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.leadName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'todos' || apt.status === statusFilter;
    const typeMatch = typeFilter === 'todos' || apt.type === typeFilter;

    return textMatch && statusMatch && typeMatch;
  });

  // Calendar parameters and helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Prev & Next Month handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1); // Default select first day of new month
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1); // Default select first day of new month
  };

  // Formats date key YYYY-MM-DD
  const formatDateKey = (dayNum: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  };

  // Get appointments for a specific day
  const getDayAppointments = (dayNum: number) => {
    const dateKey = formatDateKey(dayNum);
    return filteredAppointments.filter(apt => apt.date === dateKey);
  };

  // Selected date's appointments
  const selectedDateStr = selectedDay ? formatDateKey(selectedDay) : '';
  const selectedDayAppointments = filteredAppointments.filter(apt => apt.date === selectedDateStr);

  // Checkbox bulk actions toggle handlers
  const handleSelectAllFiltered = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set([...selectedAptIds, ...filteredAppointments.map(a => a.id)]);
      setSelectedAptIds(allIds);
    } else {
      const allIds = new Set(selectedAptIds);
      filteredAppointments.forEach(a => allIds.delete(a.id));
      setSelectedAptIds(allIds);
    }
  };

  const handleSelectRow = (id: string, isChecked: boolean) => {
    const newSet = new Set(selectedAptIds);
    if (isChecked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedAptIds(newSet);
  };

  return (
    <div className="space-y-6 text-zinc-900 font-sans select-none">
      
      {/* 1. CARDS ESTATÍSTICOS DO FOLLOW-UP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border-2 border-zinc-950 rounded-2xl text-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[9px] uppercase font-mono font-black text-indigo-400 block tracking-widest">Total Geral</span>
          <p className="text-2xl font-black font-mono mt-1">{totalCount}</p>
        </div>

        <div className="p-4 bg-white border-2 border-zinc-950 rounded-2xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[9px] uppercase font-mono font-black text-amber-500 block tracking-widest flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full "></span>
            <span>Agendados</span>
          </span>
          <p className="text-2xl font-black font-mono mt-1 text-amber-600">{pendingCount}</p>
        </div>

        <div className="p-4 bg-white border-2 border-zinc-950 rounded-2xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[9px] uppercase font-mono font-black text-emerald-600 block tracking-widest flex items-center justify-center gap-1">
            <span>Realizados</span>
          </span>
          <p className="text-2xl font-black font-mono mt-1 text-emerald-600">{completedCount}</p>
        </div>

        <div className="p-4 bg-white border-2 border-zinc-950 rounded-2xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[9px] uppercase font-mono font-black text-red-500 block tracking-widest">Cancelados</span>
          <p className="text-2xl font-black font-mono mt-1 text-red-500">{cancelledCount}</p>
        </div>
      </div>

      {/* 2. SWITCH CONTROLLER, FILTERS BAR & AGENDADOR BUTTON */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-zinc-100 border-2 border-zinc-950 rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="flex flex-wrap items-center gap-3 justify-between xl:justify-start">
          {/* Switch Buttons */}
          <div className="bg-zinc-200 border-2 border-zinc-950 p-1 rounded-xl flex gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <button
              type="button"
              onClick={() => setViewMode('tabela')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'tabela'
                  ? 'bg-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendario')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'calendario'
                  ? 'bg-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
          </div>

          {/* Quick Add NPL Button */}
          <button
            type="button"
            onClick={() => {
              setScheduleInitialLead(null);
              setIsScheduleModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-black uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Follow-up (NPL)</span>
          </button>
        </div>

        {/* Unified Search & Filters */}
        <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por lead, compromisso, observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2 pl-9 text-xs font-bold text-zinc-900 focus:outline-none placeholder-zinc-400"
            />
          </div>

          {/* Filter by Status */}
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border-2 border-zinc-950 p-2 text-xs font-black text-zinc-800 rounded-xl focus:outline-none"
            >
              <option value="todos">🔹 Status: Todos</option>
              <option value="agendado">🕒 Agendados</option>
              <option value="realizado">✅ Realizados</option>
              <option value="cancelado">❌ Cancelados</option>
            </select>
          </div>

          {/* Filter by Type */}
          <div className="w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border-2 border-zinc-950 p-2 text-xs font-black text-zinc-800 rounded-xl focus:outline-none"
            >
              <option value="todos">🔸 Tipos: Todos</option>
              <option value="telefone">📞 Ligações</option>
              <option value="reuniao">🤝 Reuniões</option>
              <option value="proposta">📄 Propostas</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="visita">📍 Visita</option>
              <option value="presencial">🌍 Ação Ativa</option>
              <option value="outro">⚡ Outros</option>
            </select>
          </div>
        </div>

      </div>

      {/* 2.5 BULK ACTION STATUS BAR */}
      {selectedAptIds.size > 0 && (
        <div className="p-4 bg-zinc-900 border-4 border-zinc-950 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center gap-2 font-mono">
            <div className="w-7 h-7 bg-amber-400 text-zinc-950 rounded-lg flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]">
              {selectedAptIds.size}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-amber-400">Compromissos Selecionados</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Ações em massa cognitivas e exportações integradas</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Gemini Script / Note Assistant */}
            <button
              onClick={handleGeminiAssist}
              disabled={isGeminiLoading}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700 font-mono text-[10px] font-black uppercase tracking-wider rounded border border-white flex items-center gap-1 cursor-pointer transition"
              title="Obter roteiro de vendas para os leads selecionados usando o Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 " />
              <span>{isGeminiLoading ? 'Gemini Analisando...' : 'Assistência Gemini (Notas)'}</span>
            </button>

            {/* Export to Drive */}
            <button
              onClick={handleExportToDrive}
              disabled={isExporting}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 font-mono text-[10px] font-black uppercase tracking-wider rounded border border-white flex items-center gap-1 cursor-pointer transition"
              title="Salvar como arquivo .txt diretamente no Google Drive"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Processando...' : 'Exportar Drive'}</span>
            </button>

            {/* Export to Google Sheets */}
            <button
              onClick={handleExportToSheets}
              disabled={isExporting}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-700 font-mono text-[10px] font-black uppercase tracking-wider rounded border border-white flex items-center gap-1 cursor-pointer transition"
              title="Enviar compromissos como linhas na planilha oficial"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Exportar Planilha</span>
            </button>

            {/* Change status bulk */}
            <button
              onClick={() => handleToggleStatusBulk('realizado')}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 font-mono text-[10px] font-black uppercase rounded border border-zinc-600 cursor-pointer flex items-center gap-1 transition"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Realizados</span>
            </button>

            <button
              onClick={() => handleToggleStatusBulk('cancelado')}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 font-mono text-[10px] font-black uppercase rounded border border-zinc-600 cursor-pointer flex items-center gap-1 transition"
            >
              <X className="w-3 h-3 text-red-400" />
              <span>Cancelar</span>
            </button>

            {/* Delete bulk */}
            <button
              onClick={handleDeleteBulk}
              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded border border-red-500 cursor-pointer transition"
              title="Apagar todos da agenda"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2.7 GEMINI ANALYSIS DISPLAY PANEL */}
      {geminiResult && (
        <div className="p-4 bg-zinc-900 border-4 border-zinc-950 rounded-2xl text-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 " />
              <span className="font-mono text-xs font-black uppercase text-amber-400">Gabarito e Copywriting: Assistência Inteligente cicloCRED</span>
            </div>
            <button
              onClick={() => setGeminiResult(null)}
              className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase font-black"
            >
              [Ocultar x]
            </button>
          </div>
          <div className="text-[11px] font-sans text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-2">
            {geminiResult}
          </div>
        </div>
      )}

      {/* 3. VISUALIZAÇÃO: TABELA DINÂMICA */}
      {viewMode === 'tabela' ? (
        <div className="bg-white border-4 border-zinc-950 rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-900 text-white font-mono uppercase text-[9px] border-b-4 border-zinc-950">
                  <th className="p-3 border-r border-zinc-950 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredAppointments.length > 0 && filteredAppointments.every(apt => selectedAptIds.has(apt.id))}
                      onChange={handleSelectAllFiltered}
                      className="rounded border-zinc-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer bg-zinc-950"
                      title="Selecionar Todos / Deselecionar"
                    />
                  </th>
                  <th className="p-3 border-r border-zinc-950">Data / Horário</th>
                  <th className="p-3 border-r border-zinc-950">Tipo de Ação</th>
                  <th className="p-3 border-r border-zinc-950">Cliente / Lead</th>
                  <th className="p-3 border-r border-zinc-950">Tarefa / Atividade</th>
                  <th className="p-3 border-r border-zinc-950 text-center">Status</th>
                  <th className="p-3 text-center">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-950">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 bg-zinc-50 font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
                      Nenhum compromisso de follow-up localizado para os filtros informados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(apt => (
                    <tr key={apt.id} className="bg-white hover:bg-zinc-50 transition-colors">
                      
                      {/* Checkbox */}
                      <td className="p-3 border-r-2 border-zinc-950 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAptIds.has(apt.id)}
                          onChange={(e) => handleSelectRow(apt.id, e.target.checked)}
                          className="rounded border-zinc-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer bg-zinc-950"
                        />
                      </td>

                      {/* Date/Time */}
                      <td className="p-3 border-r-2 border-zinc-950 font-mono text-[10px] font-black text-zinc-900 whitespace-nowrap">
                        {apt.date.split('-').reverse().join('/')} às {apt.time}
                      </td>

                      {/* Action Type */}
                      <td className="p-3 border-r-2 border-zinc-950 whitespace-nowrap">
                        <span className={`inline-block font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                          apt.type === 'reuniao' ? 'bg-purple-100 text-purple-950' :
                          apt.type === 'telefone' ? 'bg-blue-100 text-blue-955' :
                          apt.type === 'proposta' ? 'bg-emerald-100 text-emerald-950' :
                          apt.type === 'whatsapp' ? 'bg-teal-100 text-teal-950' :
                          apt.type === 'visita' ? 'bg-orange-100 text-orange-950' :
                          apt.type === 'presencial' ? 'bg-rose-100 text-rose-950' :
                          'bg-zinc-100 text-zinc-950'
                        }`}>
                          {apt.type === 'reuniao' && '🤝 Reunião'}
                          {apt.type === 'telefone' && '📞 Ligação'}
                          {apt.type === 'proposta' && '📄 Proposta'}
                          {apt.type === 'whatsapp' && '💬 WhatsApp'}
                          {apt.type === 'visita' && '📍 Visita'}
                          {apt.type === 'presencial' && '🌍 Ação Ativa'}
                          {apt.type === 'outro' && '⚡ Outros'}
                        </span>
                      </td>

                      {/* Lead Link */}
                      <td className="p-3 border-r-2 border-zinc-950 font-sans font-black text-zinc-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleLeadClick(apt.leadName, apt.leadId)}
                          className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer hover:underline text-left"
                        >
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{apt.leadName}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400 shrink-0" />
                        </button>
                      </td>

                      {/* Title */}
                      <td className="p-3 border-r-2 border-zinc-950 font-medium text-zinc-800">
                        <div className="font-bold text-zinc-900 text-[11px]">{apt.title}</div>
                        {apt.description && (
                          <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5 max-w-xs truncate" title={apt.description}>
                            {apt.description}
                          </p>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="p-3 border-r-2 border-zinc-950 text-center whitespace-nowrap">
                        <span className={`inline-block font-mono text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-zinc-950 ${
                          apt.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800 '
                        }`}>
                          {apt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(apt.id)}
                            title="Alternar Status"
                            className="px-2 py-1 text-[8.5px] font-mono font-black uppercase border-2 border-zinc-950 rounded-md bg-zinc-100 hover:bg-zinc-200 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Mudar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(apt.id)}
                            title="Remover compromisso"
                            className="p-1 border-2 border-zinc-950 rounded-md bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer active:translate-y-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* 4. VISUALIZAÇÃO: CALENDÁRIO RESPONSIVO INTELIGENTE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Calendar Grid (8 Cols) */}
          <div className="lg:col-span-8 bg-white border-4 border-zinc-950 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
            
            {/* Month Control Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-zinc-200 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-650" />
                <h3 className="font-mono font-black text-sm uppercase tracking-wider text-zinc-900">
                  {monthNames[month]} {year}
                </h3>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 border-2 border-zinc-950 rounded-lg hover:bg-zinc-100 cursor-pointer transition-transform active:scale-95"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-900" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDate(new Date(2026, 5, 27));
                    setSelectedDay(27);
                  }}
                  className="px-2.5 py-1.5 border-2 border-zinc-950 rounded-lg text-[9px] font-mono font-black uppercase hover:bg-zinc-100 cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 border-2 border-zinc-950 rounded-lg hover:bg-zinc-100 cursor-pointer transition-transform active:scale-95"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-900" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono font-black text-[9px] uppercase tracking-widest text-zinc-500 mb-2">
              <div className="py-1 text-red-500">Dom</div>
              <div className="py-1">Seg</div>
              <div className="py-1">Ter</div>
              <div className="py-1">Qua</div>
              <div className="py-1">Qui</div>
              <div className="py-1">Sex</div>
              <div className="py-1">Sáb</div>
            </div>

            {/* Calendar grid body */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="aspect-square bg-zinc-50/50 border border-zinc-100 rounded-xl"
                    />
                  );
                }

                const dayApts = getDayAppointments(day);
                const isSelected = selectedDay === day;
                const hasApts = dayApts.length > 0;
                
                // Color accent of day elements
                const today = new Date();
                const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

                return (
                  <button
                    type="button"
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square p-1.5 flex flex-col justify-between items-stretch border-2 rounded-xl text-left transition-all relative cursor-pointer group ${
                      isSelected 
                        ? 'bg-amber-300 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-[1.02] z-10' 
                        : isToday
                          ? 'bg-indigo-100 border-indigo-600'
                          : 'bg-white border-zinc-950 hover:bg-zinc-50'
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[11px] font-mono font-black ${
                        isSelected 
                          ? 'text-zinc-950' 
                          : isToday
                            ? 'text-indigo-650'
                            : 'text-zinc-800'
                      }`}>
                        {day}
                      </span>
                      
                      {/* Badge if multiple items */}
                      {hasApts && (
                        <span className="text-[7.5px] font-mono font-black bg-zinc-900 text-white px-1 rounded">
                          {dayApts.length}
                        </span>
                      )}
                    </div>

                    {/* Miniature Colored Event Dot Indicators inside grid cell */}
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {dayApts.slice(0, 3).map((apt, i) => (
                        <span 
                          key={apt.id} 
                          className={`w-1.5 h-1.5 rounded-full border border-zinc-950 ${
                            apt.type === 'reuniao' ? 'bg-purple-500' :
                            apt.type === 'telefone' ? 'bg-blue-500' :
                            apt.type === 'proposta' ? 'bg-emerald-500' :
                            apt.type === 'whatsapp' ? 'bg-teal-500' :
                            apt.type === 'visita' ? 'bg-orange-500' :
                            apt.type === 'presencial' ? 'bg-rose-500' :
                            'bg-zinc-500'
                          }`}
                          title={`${apt.leadName}: ${apt.title}`}
                        />
                      ))}
                      {dayApts.length > 3 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-950" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Map Key */}
            <div className="mt-4 pt-3 border-t border-zinc-200 flex flex-wrap gap-4 text-[9.5px] font-mono font-black text-zinc-500 justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-purple-500 border border-zinc-950 rounded-full inline-block"></span>
                <span>Reuniões</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 border border-zinc-950 rounded-full inline-block"></span>
                <span>Ligações</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 border border-zinc-950 rounded-full inline-block"></span>
                <span>Propostas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-teal-500 border border-zinc-950 rounded-full inline-block"></span>
                <span>WhatsApp</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-orange-500 border border-zinc-950 rounded-full inline-block"></span>
                <span>Visitas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 border border-zinc-950 rounded-full inline-block"></span>
                <span>Ativas</span>
              </span>
            </div>

          </div>

          {/* Selected Date Details Sidebar (4 Cols) */}
          <div className="lg:col-span-4 bg-white border-4 border-zinc-950 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4 h-full flex flex-col">
            
            <div className="pb-3 border-b-2 border-zinc-200 shrink-0">
              <span className="text-[9px] uppercase font-mono font-black text-indigo-500 tracking-wider block">Agenda do Dia</span>
              <h4 className="font-mono font-black text-xs uppercase text-zinc-900">
                📅 {selectedDay ? `${String(selectedDay).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}` : 'Selecione um Dia'}
              </h4>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 flex-1">
              {selectedDayAppointments.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-300 p-4">
                  <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-[10.5px] text-zinc-400 font-mono font-black uppercase">Sem compromissos</p>
                  <p className="text-[9.5px] text-zinc-450 mt-1">Nenhum follow-up agendado para esta data.</p>
                </div>
              ) : (
                selectedDayAppointments.map(apt => (
                  <div 
                    key={apt.id} 
                    className="p-3 bg-zinc-50 border-2 border-zinc-950 rounded-xl hover:bg-zinc-100/55 transition-colors space-y-2.5"
                  >
                    {/* Header: Time and Type badge */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-mono font-black text-zinc-900 bg-amber-200 px-1.5 py-0.5 rounded border border-zinc-950">
                        <Clock className="w-3 h-3 text-zinc-800" />
                        <span>{apt.time}</span>
                      </span>

                      <span className={`text-[8.5px] font-mono font-black uppercase px-1.5 rounded border border-zinc-950 ${
                        apt.type === 'reuniao' ? 'bg-purple-100 text-purple-900' :
                        apt.type === 'telefone' ? 'bg-blue-100 text-blue-900' :
                        apt.type === 'proposta' ? 'bg-emerald-100 text-emerald-900' :
                        apt.type === 'whatsapp' ? 'bg-teal-100 text-teal-900' :
                        apt.type === 'visita' ? 'bg-orange-100 text-orange-900' :
                        apt.type === 'presencial' ? 'bg-rose-100 text-rose-900' :
                        'bg-zinc-100 text-zinc-900'
                      }`}>
                        {apt.type}
                      </span>
                    </div>

                    {/* Lead Title & Name */}
                    <div>
                      <div className="text-xs font-black text-zinc-900 tracking-tight">{apt.title}</div>
                      
                      <button
                        type="button"
                        onClick={() => handleLeadClick(apt.leadName, apt.leadId)}
                        className="text-[10px] text-indigo-650 hover:text-indigo-850 font-black flex items-center gap-0.5 mt-1 cursor-pointer hover:underline text-left"
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{apt.leadName}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </button>
                    </div>

                    {/* Optional description */}
                    {apt.description && (
                      <p className="text-[9.5px] text-zinc-450 font-mono border-l-2 border-zinc-300 pl-1.5 py-0.5">
                        {apt.description}
                      </p>
                    )}

                    {/* Status indicator */}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                      <span className={`text-[8.5px] font-mono font-black uppercase px-1.5 py-0.5 rounded-full border border-zinc-950 ${
                        apt.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800 '
                      }`}>
                        {apt.status}
                      </span>

                      {/* Quick controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(apt.id)}
                          className="px-1.5 py-0.5 border border-zinc-950 rounded bg-white hover:bg-zinc-100 text-[8px] font-mono font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                        >
                          Status
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(apt.id)}
                          className="p-1 border border-zinc-950 rounded bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer active:translate-y-0.5"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* 4. MODULAR SCHEDULE FOLLOW-UP MODAL (NPL COGNITIVE ENGINES) */}
      <ScheduleFollowUpModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleInitialLead(null);
        }}
        leads={leads}
        initialLead={scheduleInitialLead}
        onAddAppointment={(newAppt) => {
          const updated = [newAppt, ...appointments];
          setAppointments(updated);
          localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
        }}
        awardXP={awardXP}
        addNotification={addNotification}
      />

    </div>
  );
}
