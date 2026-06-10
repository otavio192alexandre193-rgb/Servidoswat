/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lead, Appointment } from '../types';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  User, 
  Video, 
  Phone,
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  FileText,
  VideoIcon,
  Check,
  Volume2,
  BellRing,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone
} from 'lucide-react';

import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';

interface AppointmentsProps {
  leads: Lead[];
  appointments: Appointment[];
  onAddAppointment: (newAppt: Appointment) => void;
  onUpdateAppointmentStatus: (id: string, status: 'agendado' | 'realizado' | 'cancelado') => void;
  onDeleteAppointment: (id: string) => void;
  accSettings?: AccessibilitySettings;
}

export default function Appointments({
  leads,
  appointments,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS
}: AppointmentsProps) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'reuniao' | 'telefone' | 'proposta' | 'outro'>('reuniao');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);

  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // CALENDAR CALCULATION & MONTHS CARDS CONFIGURATION
  const now = new Date();
  const [calMonth, setCalMonth] = useState<number>(5); // May
  const [calYear, setCalYear] = useState<number>(2026); // year

  const monthsLabels = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // ACTIVE SYSTEM FEEDBACK, ALARMS, SOUNDS, AND PHYSICAL VIBRATIONS
  const [isVibrating, setIsVibrating] = useState(false);
  const [isAlarmEnabling, setIsAlarmEnabling] = useState(true);
  const [alarmLogs, setAlarmLogs] = useState<string[]>([
    "Sincronização de clock ativa em Tempo Real.",
    "Bateria do sensor de proximidade em 98%.",
    "Pronto para emitir vibração e alarmes."
  ]);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  const triggerSynthesizedNotification = (customText?: string) => {
    // Generates elegant beep beep alarms via Web Audio API 
    try {
      if (!isAlarmEnabling) return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      setIsSoundPlaying(true);

      const playBeepAt = (timeDelay: number, frequencyTone: number, beepLen: number) => {
        setTimeout(() => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequencyTone, audioCtx.currentTime);

          gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + beepLen);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.start();
          oscillator.stop(audioCtx.currentTime + beepLen);
        }, timeDelay);
      };

      // Play double urgent beeps (like a digital timer alarmbeep)
      playBeepAt(0, 880, 0.12);
      playBeepAt(160, 880, 0.12);
      playBeepAt(320, 1100, 0.20);

      setTimeout(() => {
        setIsSoundPlaying(false);
      }, 700);

    } catch (e) {
      console.warn("AudioContext blocked or unavailable inside preview frame", e);
    }

    // Trigger physical vibration
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 150]);
    }

    setIsVibrating(true);
    setTimeout(() => {
      setIsVibrating(false);
    }, 1500);

    const logMsg = customText || `🔔 ALARME DE REUNIÃO COMERCIAL DISPARADO ÀS ${new Date().toLocaleTimeString('pt-BR')}`;
    setAlarmLogs(prev => [
      `[${new Date().toLocaleTimeString('pt-BR')}] ${logMsg}`,
      ...prev
    ]);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !title || !date || !time) return;

    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      title,
      date,
      time,
      description,
      status: 'agendado',
      type,
      reminderMinutes: Number(reminderMinutes) || 0,
      reminderSent: false
    };

    onAddAppointment(newAppt);
    triggerSensoryFeedback('complete', accSettings);
    setIsScheduling(false);

    // Reset inputs
    setSelectedLeadId('');
    setTitle('');
    setDate('');
    setTime('');
    setDescription('');
    setType('reuniao');
    setReminderMinutes(15);
  };

  // Filtered Appointments list
  const filteredAppts = appointments.filter(appt => {
    const matchesDate = dateFilter ? appt.date === dateFilter : true;
    const matchesStatus = statusFilter === 'todos' ? true : appt.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  // Today marker
  const todayStr = new Date().toISOString().slice(0, 10);
  const appointmentsToday = appointments.filter(appt => appt.date === todayStr && appt.status === 'agendado');

  const typeLabels = {
    reuniao: { label: 'Reunião por Vídeo', icon: Video, colorClass: 'bg-indigo-100 text-indigo-950 border-indigo-400' },
    telefone: { label: 'Telefonema / Call', icon: Phone, colorClass: 'bg-emerald-100 text-emerald-950 border-emerald-400' },
    proposta: { label: 'Apresentação de Proposta', icon: FileSpreadsheet, colorClass: 'bg-amber-100 text-amber-950 border-amber-400' },
    outro: { label: 'Outros Compromissos', icon: FileText, colorClass: 'bg-zinc-100 text-zinc-950 border-zinc-400' }
  };

  const statusLabels = {
    agendado: { label: 'Pendente', bg: 'bg-blue-100 border-2 border-blue-600', text: 'text-blue-950' },
    realizado: { label: 'Realizado', bg: 'bg-emerald-100 border-2 border-emerald-600', text: 'text-emerald-950' },
    cancelado: { label: 'Cancelado', bg: 'bg-red-100 border-2 border-rose-600', text: 'text-red-950' }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview alerts & action steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 to-indigo-950 text-white border-4 border-zinc-950 p-6 rounded-3xl flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="space-y-2">
            <span className="text-[10px] tracking-wider uppercase font-black text-indigo-400 font-mono">📅 Calendário Inteligente cicloCRED</span>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Coordene seus compromissos comerciais</h2>
            <p className="text-xs text-zinc-300 font-medium max-w-md">Estreite relacionamentos ligando para seus leads, enviando propostas e realizando vídeochamadas integradas com o histórico.</p>
          </div>
          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center gap-1.5 px-4.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-y-[-2px] transition shrink-0 ml-4"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Compromisso</span>
          </button>
        </div>

        {/* Alerts card */}
        <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide font-mono">Compromissos de Hoje</h3>
            <span className="text-[10px] uppercase font-mono font-black border border-red-500 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">
              {appointmentsToday.length} pendentes
            </span>
          </div>

          {appointmentsToday.length === 0 ? (
            <div className="flex items-center gap-2.5 p-3 bg-zinc-50 border-2 border-zinc-950 rounded-xl mt-4">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold text-zinc-700">Tudo limpo para hoje! Aproveite para prospectar.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[100px] overflow-y-auto mt-4 pr-1">
              {appointmentsToday.map(appt => (
                <div key={appt.id} className="flex justify-between items-center bg-indigo-50 border border-indigo-400 p-2.5 rounded-lg text-xs font-bold">
                  <div className="truncate pr-2">
                    <span className="font-black text-zinc-900 truncate">{appt.title}</span>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-tight">{appt.leadName} às {appt.time}</p>
                  </div>
                  <Clock className="w-4 h-4 text-indigo-700 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* THE LIVE RESPONSIVE CALENDAR */}
      <div className="w-full">
        
        {/* Living Month Selector Grid */}
        <div id="living-calendar-grid" className="w-full bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div>
              <span className="text-[9px] uppercase font-mono font-black text-indigo-600 block">Calendário Geral de Atividades</span>
              <h3 className="text-md font-black uppercase italic tracking-tight text-zinc-950 flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Navegador de Datas Inteligente</span>
              </h3>
              <p className="text-xs text-zinc-500 font-sans font-medium mt-0.5">Selecione um dia específico no grid abaixo para filiar e depurar os agendamentos instantaneamente.</p>
            </div>

            {/* Nav month arrows */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 border-2 border-zinc-950 rounded-xl select-none">
              <button 
                type="button"
                onClick={() => {
                  if (calMonth === 1) {
                    setCalMonth(12);
                    setCalYear(prev => prev - 1);
                  } else {
                    setCalMonth(prev => prev - 1);
                  }
                }}
                className="p-1 px-2 hover:bg-zinc-200 rounded font-black font-mono transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black uppercase tracking-wider font-mono px-3 text-zinc-950 whitespace-nowrap">
                {monthsLabels[calMonth - 1]} {calYear}
              </span>
              <button 
                type="button"
                onClick={() => {
                  if (calMonth === 12) {
                    setCalMonth(1);
                    setCalYear(prev => prev + 1);
                  } else {
                    setCalMonth(prev => prev + 1);
                  }
                }}
                className="p-1 px-2 hover:bg-zinc-200 rounded font-black font-mono transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Days */}
          <div className="space-y-4">
            {/* Week header labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-black uppercase text-zinc-500 pb-1 border-b">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            {/* Days block */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {/* Blank days from offset weekday */}
              {Array.from({ length: new Date(calYear, calMonth - 1, 1).getDay() }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="aspect-square bg-zinc-50/40 rounded-xl border border-transparent" />
              ))}

              {/* Functional days */}
              {Array.from({ length: new Date(calYear, calMonth, 0).getDate() }).map((_, dayIndex) => {
                const dayNum = dayIndex + 1;
                const formattedDayStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                // Indicators check
                const hasAppointmentsOnDay = appointments.some(appt => appt.date === formattedDayStr);
                const hasPendingAppts = appointments.some(appt => appt.date === formattedDayStr && appt.status === 'agendado');
                const isSelectedDay = dateFilter === formattedDayStr;
                
                const dayTodayStr = now.toISOString().slice(0, 10);
                const isCurrentToday = dayTodayStr === formattedDayStr;

                let borderStyleClass = 'border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50';
                let bgStyleClass = 'bg-white text-zinc-900';
                
                if (isCurrentToday) {
                  borderStyleClass = 'border-indigo-600 ring-2 ring-indigo-200';
                  bgStyleClass = 'bg-indigo-50 text-indigo-950 font-black';
                }
                
                if (isSelectedDay) {
                  borderStyleClass = 'border-zinc-950 ring-4 ring-indigo-500/30 scale-95';
                  bgStyleClass = 'bg-indigo-600 text-white font-extrabold';
                }

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => {
                      if (isSelectedDay) {
                        setDateFilter(''); // toggle filter off
                      } else {
                        setDateFilter(formattedDayStr);
                      }
                    }}
                    className={`aspect-square border-2 ${borderStyleClass} ${bgStyleClass} p-1 rounded-2xl transition flex flex-col justify-between relative group select-none`}
                  >
                    <span className="text-xs font-mono font-black">{dayNum}</span>
                    
                    {/* Ring highlight if contains pending visits */}
                    {hasAppointmentsOnDay && (
                      <div className="flex gap-1 justify-center items-center w-full pb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasPendingAppts ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-500'}`} />
                        {isSelectedDay && <span className="text-[7px] text-zinc-400 font-mono">OK</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Date Stats footer info */}
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 border-t pt-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Dias azuis contêm compromissos agendados</span>
            </span>
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="text-indigo-600 hover:underline hover:text-indigo-800 uppercase font-black"
              >
                Mostrar Todos os Dias ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointment creator overlay form */}
      {isScheduling && (
        <form onSubmit={handleCreateAppointment} className="bg-white border-4 border-zinc-950 p-6 rounded-2xl space-y-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-scaleIn">
          <div className="flex justify-between items-center border-b-2 border-zinc-100 pb-3">
            <h3 className="text-sm font-black text-zinc-950 uppercase italic tracking-tight">
              📅 Novo compromisso comercial
            </h3>
            <button
              type="button"
              onClick={() => setIsScheduling(false)}
              className="text-zinc-[10px] uppercase font-black text-rose-600 hover:underline"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Title / Objective */}
            <div className="md:col-span-8 space-y-1.5">
              <label htmlFor="appt-title" className="block text-xs font-black text-zinc-700 uppercase font-mono">Assunto / Objetivo do Agendamento *</label>
              <input
                type="text"
                id="appt-title"
                required
                placeholder="Ex: Apresentar simulação de crédito corporativo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Type */}
            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="appt-type" className="block text-xs font-black text-zinc-700 uppercase font-mono">Meio de Contato</label>
              <select
                id="appt-type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 font-extrabold"
              >
                <option value="reuniao">🎥 Reunião de Vídeo</option>
                <option value="telefone">📞 Telefonema / Call</option>
                <option value="proposta">📊 Apresentação Comercial</option>
                <option value="outro">📁 Outro contato</option>
              </select>
            </div>

            {/* Target CRM Lead */}
            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="appt-lead" className="block text-xs font-black text-zinc-700 uppercase font-mono">Vincular a um Lead Ativo *</label>
              <select
                id="appt-lead"
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 font-extrabold"
              >
                <option value="">Selecione o lead...</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.company || 'Pessoa Física'})</option>
                ))}
              </select>
            </div>

            {/* Appointment Date */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="appt-date" className="block text-xs font-black text-zinc-700 uppercase font-mono">Data *</label>
              <input
                type="date"
                id="appt-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono text-zinc-950 font-bold"
              />
            </div>

            {/* Appointment Time */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="appt-time" className="block text-xs font-black text-zinc-700 uppercase font-mono">Horário *</label>
              <input
                type="time"
                id="appt-time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm font-mono text-zinc-950 font-bold"
              />
            </div>

            {/* Configure Reminder (Lembrete) */}
            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="appt-reminder" className="block text-xs font-black text-indigo-950 uppercase font-mono">🔔 Configurar Lembrete</label>
              <select
                id="appt-reminder"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full bg-indigo-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-indigo-950 font-extrabold"
              >
                <option value={0}>Sem lembrete (off)</option>
                <option value={15}>15 minutos antes</option>
                <option value={60}>1 hora antes</option>
                <option value={1440}>1 dia antes</option>
              </select>
            </div>

            {/* Description/agenda notes */}
            <div className="md:col-span-12 space-y-1.5">
              <label htmlFor="appt-desc" className="block text-xs font-black text-zinc-700 uppercase font-mono">Anotações / Roteiro da Conversa</label>
              <textarea
                id="appt-desc"
                rows={3}
                placeholder="Insira observações relevantes, links da sala de reuniões virtuais (Teams, Google Meet, Zoom)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-sm text-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-zinc-150 pt-4">
            <button
              type="button"
              onClick={() => setIsScheduling(false)}
              className="px-4 py-2.5 bg-zinc-100 border-2 border-zinc-950 hover:bg-zinc-200 text-zinc-900 font-black rounded-xl text-xs uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            >
              Confirmar Agendamento
            </button>
          </div>
        </form>
      )}

      {/* Structured Calendar Agenda list with reactive filters */}
      <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
        
        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-md font-black text-zinc-950 uppercase tracking-tight">Linha do Tempo de Compromissos</h3>
            <p className="text-xs text-zinc-500 font-sans font-medium">Filtre compromissos por data específica e status atual.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Date */}
            <div className="flex items-center gap-1.5 bg-zinc-50 rounded-xl border-2 border-zinc-950 px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none font-mono"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-[10px] uppercase font-mono font-black text-zinc-500 hover:text-zinc-950">Limpar</button>
              )}
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-50 border-2 border-zinc-950 outline-none rounded-xl px-3 py-2 text-xs font-bold font-sans"
            >
              <option value="todos">Todos os Status</option>
              <option value="agendado">Pendente</option>
              <option value="realizado">Completo</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* List Grid */}
        {filteredAppts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl font-mono text-zinc-400 font-extrabold uppercase">
            Nenhum compromisso comercial agendado para o filtro selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppts.map(appt => {
              const typeCfg = typeLabels[appt.type as keyof typeof typeLabels] || typeLabels.outro;
              const statCfg = statusLabels[appt.status as keyof typeof statusLabels] || statusLabels.agendado;
              const IconType = typeCfg.icon;

              return (
                <div key={appt.id} className="bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between hover:translate-y-[-1px] transition-all">
                  <div className="space-y-3.5">
                    
                    {/* Header: Date Badge & Status Indicator */}
                    <div className="flex items-center justify-between gap-1 select-none">
                      <div className="flex items-center gap-1 text-[10px] bg-white border border-zinc-950 px-2 py-0.5 rounded font-mono font-bold text-zinc-500">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>{new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      {appt.reminderMinutes && appt.reminderMinutes > 0 ? (
                        <div className="flex items-center gap-1 text-[9px] bg-indigo-100 border border-indigo-400 text-indigo-950 px-2 py-0.5 rounded-full font-black font-mono">
                          <span className="animate-pulse">🔔</span>
                          <span>{appt.reminderMinutes === 1440 ? '1 dia' : appt.reminderMinutes === 60 ? '1 hora' : `${appt.reminderMinutes} min`}</span>
                        </div>
                      ) : null}

                      {appt.status === 'agendado' && (
                        <div className="flex items-center gap-0.5 text-[8px] bg-rose-50 border border-rose-300 text-rose-700 px-1.5 py-0.5 rounded-full font-black font-mono animate-pulse uppercase" title="Alarme push de tempo real ativo">
                          <span>⏰ ALARME REAL</span>
                        </div>
                      )}
                      
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${statCfg.bg} ${statCfg.text}`}>
                        {statCfg.label}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-sans font-black text-sm uppercase tracking-tight text-zinc-950 mb-1 leading-tight">{appt.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold border-l-2 border-indigo-500 pl-2">
                        <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">Com {appt.leadName}</span>
                      </div>
                    </div>

                    {/* Type card */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${typeCfg.colorClass}`}>
                      <IconType className="w-4 h-4 shrink-0" />
                      <span className="truncate">{typeCfg.label} às {appt.time}</span>
                    </div>

                    {/* Description */}
                    {appt.description && (
                      <p className="text-[11px] leading-relaxed text-zinc-600 font-semibold italic bg-white p-2.5 border border-zinc-200.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)]">
                        "{appt.description}"
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-zinc-200 mt-4.5">
                    {appt.status === 'agendado' && (
                      <>
                        <button
                          onClick={() => {
                            triggerSensoryFeedback('success', accSettings);
                            onUpdateAppointmentStatus(appt.id, 'realizado');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3 h-3 text-white shrink-0" />
                          <span>Concluir</span>
                        </button>
                        <button
                          onClick={() => {
                            triggerSensoryFeedback('warning', accSettings);
                            onUpdateAppointmentStatus(appt.id, 'cancelado');
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase rounded transition"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => {
                        triggerSensoryFeedback('warning', accSettings);
                        onDeleteAppointment(appt.id);
                      }}
                      title="Excluir"
                      className="p-1.5 bg-white border border-zinc-950 hover:bg-zinc-100 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-zinc-500 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
