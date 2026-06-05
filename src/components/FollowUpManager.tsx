/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  Search,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { motion } from 'motion/react';
import { Lead, FollowUpUpdate, Appointment } from '../types';

interface FollowUpManagerProps {
  leads: Lead[];
  followUps: FollowUpUpdate[];
  onAddFollowUp: (followUp: Omit<FollowUpUpdate, 'id'>, createAppointment: boolean) => void;
  onDeleteFollowUp: (id: string) => void;
  accSettings?: {
    highContrast: boolean;
    largeText: boolean;
    sensoryBips: boolean;
    vibrationFeedback: boolean;
  };
}

export default function FollowUpManager({
  leads,
  followUps,
  onAddFollowUp,
  onDeleteFollowUp,
  accSettings
}: FollowUpManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [contactType, setContactType] = useState<'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'proposta'>('ligacao');
  const [notes, setNotes] = useState('');
  
  // Next step scheduling
  const [scheduleNextStep, setScheduleNextStep] = useState(false);
  const [nextStepTitle, setNextStepTitle] = useState('');
  const [nextStepDate, setNextStepDate] = useState('');
  const [nextStepTime, setNextStepTime] = useState('');

  // Filtering follow-up history
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');

  // Helper to find lead info
  const getLeadById = (id: string) => leads.find(l => l.id === id);

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !notes.trim()) return;

    const lead = getLeadById(selectedLeadId);
    if (!lead) return;

    const followUpData: Omit<FollowUpUpdate, 'id'> = {
      leadId: selectedLeadId,
      leadName: lead.name,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: contactType,
      notes,
      ...(scheduleNextStep ? {
        nextStepTitle,
        nextStepDate,
        nextStepTime
      } : {})
    };

    onAddFollowUp(followUpData, scheduleNextStep);

    // Reset Form
    setSelectedLeadId('');
    setNotes('');
    setScheduleNextStep(false);
    setNextStepTitle('');
    setNextStepDate('');
    setNextStepTime('');
  };

  // Helper to format contact types
  const getContactIcon = (type: string) => {
    switch (type) {
      case 'ligacao': return <Phone className="w-4 h-4 text-sky-500" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'email': return <Mail className="w-4 h-4 text-indigo-500" />;
      case 'reuniao': return <Users className="w-4 h-4 text-fuchsia-500" />;
      case 'proposta': return <ClipboardList className="w-4 h-4 text-amber-500" />;
      default: return <ClipboardList className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getContactLabel = (type: string) => {
    switch (type) {
      case 'ligacao': return 'Ligação Telefônica';
      case 'whatsapp': return 'Contato WhatsApp';
      case 'email': return 'E-mail Comercial';
      case 'reuniao': return 'Reunião Síncrona';
      case 'proposta': return 'Apresentação de Proposta';
      default: return type;
    }
  };

  // Analyze leads who need follow-up (e.g. no contact in 3+ days, or lack followup completely)
  const getDaysSinceContact = (dateStr?: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.slice(0, 10);
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const contactDate = new Date(year, month, day);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = todayMidnight.getTime() - contactDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const pendingLeads = leads
    .map(l => {
      // Find latest follow up date or createdAt
      const lastFup = followUps.filter(f => f.leadId === l.id).sort((a,b) => b.date.localeCompare(a.date))[0];
      const referenceDate = lastFup ? lastFup.date : l.createdAt;
      const days = getDaysSinceContact(referenceDate);
      return { lead: l, days, lastAction: lastFup ? lastFup.type : 'Nenhum' };
    })
    .filter(item => item.lead.status !== 'fechado' && item.lead.status !== 'perdido')
    .sort((a,b) => (b.days ?? 99) - (a.days ?? 99));

  // Filtered follow ups history
  const filteredFollowUps = followUps
    .filter(f => {
      const matchSearch = f.leadName.toLowerCase().includes(historySearch.toLowerCase()) || f.notes.toLowerCase().includes(historySearch.toLowerCase());
      const matchType = historyFilterType === 'all' || f.type === historyFilterType;
      return matchSearch && matchType;
    })
    .sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  return (
    <div id="followup-panel-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      
      {/* LEFT COLUMN: URGENCY CONTROL OR SELECT LEAD */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* NEW FOLLOW-UP LOG FORM */}
        <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center gap-2 border-b-2 border-zinc-950 pb-3 mb-4">
            <span className="text-lg">📢</span>
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-zinc-900">
              Registrar Novo Follow-Up
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lead Select dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                Selecionar Lead do Funil *
              </label>
              <select
                required
                value={selectedLeadId}
                onChange={(e) => {
                  setSelectedLeadId(e.target.value);
                  const latestFup = followUps.filter(f => f.leadId === e.target.value).sort((a,b)=>b.date.localeCompare(a.date))[0];
                  if (latestFup) {
                    setNotes(`Follow-up de andamento. Último contato realizado por ${getContactLabel(latestFup.type)}. `);
                  } else {
                    setNotes('');
                  }
                }}
                className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              >
                <option value="">-- SELECIONE O LEAD --</option>
                {leads
                  .filter(l => l.status !== 'fechado' && l.status !== 'perdido')
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.status.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            {/* Interaction Channel Buttons */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">
                Canal de Abordagem / Meio
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['ligacao', 'whatsapp', 'email', 'reuniao', 'proposta'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContactType(type)}
                    className={`p-2 border-2 rounded-xl text-[9px] font-black uppercase text-center flex flex-col items-center justify-center gap-1 transition ${
                      contactType === type
                        ? 'bg-zinc-900 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-zinc-650 border-zinc-350 hover:bg-zinc-50'
                    }`}
                  >
                    {getContactIcon(type)}
                    <span>{type === 'ligacao' ? 'Ligar' : type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes content */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                Resumo da Interação (Mensagens, Feedbacks, etc.) *
              </label>
              <textarea
                required
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Expositor portando Cury Eko Guarulhos. Informou que a aprovação na Caixa exige complementar comprovação de FGTS de 3 anos..."
                className="w-full bg-white border-2 border-zinc-950 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-zinc-950 transition"
              />
            </div>

            {/* NEXT STEP SCHEDULER INTEGRATION */}
            <div className="bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scheduleNextStep}
                    onChange={(e) => setScheduleNextStep(e.target.checked)}
                    className="rounded border-zinc-350 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[10px] font-black uppercase text-zinc-700">
                    💡 Agendar Próximo Passo Integrado
                  </span>
                </label>
              </div>

              {scheduleNextStep && (
                <div className="space-y-2.5 animate-scaleIn">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">
                      Título da Tarefa de Retorno
                    </label>
                    <input
                      type="text"
                      required={scheduleNextStep}
                      placeholder="Cobrar resposta da análise de crédito Caixa"
                      value={nextStepTitle}
                      onChange={(e) => setNextStepTitle(e.target.value)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">
                        Data Planejada
                      </label>
                      <input
                        type="date"
                        required={scheduleNextStep}
                        value={nextStepDate}
                        onChange={(e) => setNextStepDate(e.target.value)}
                        className="w-full bg-white border border-zinc-350 rounded-lg p-2 text-xs font-mono font-bold text-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-0.5">
                        Horário Previsto
                      </label>
                      <input
                        type="time"
                        required={scheduleNextStep}
                        value={nextStepTime}
                        onChange={(e) => setNextStepTime(e.target.value)}
                        className="w-full bg-white border border-zinc-350 rounded-lg p-2 text-xs font-mono font-bold text-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedLeadId || !notes.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white border-2 border-zinc-950 rounded-xl py-3 text-xs font-black uppercase italic tracking-wider shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Gravar Follow-Up & Pontuar</span>
            </button>
          </form>
        </div>

        {/* ALERTS AND HEALTH STATUS PANEL */}
        <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5 mb-3">
            <h4 className="font-sans font-black text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <span>⚠️</span> Alerta de Negligência / Intervalo
            </h4>
            <span className="text-[9px] bg-amber-100 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-amber-800">
              Urgente
            </span>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
            {pendingLeads.slice(0, 5).map(({ lead, days, lastAction }) => {
              const isCritical = (days ?? 0) >= 3;
              return (
                <div 
                  key={lead.id} 
                  className={`p-2.5 border border-zinc-950 rounded-xl flex items-center justify-between ${
                    isCritical ? 'bg-rose-50 border-rose-300' : 'bg-amber-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-zinc-900 block leading-tight">{lead.name}</span>
                    <span className="text-[9px] font-mono text-zinc-500 block">
                      Última ação: <strong className="text-zinc-700">{getContactLabel(lastAction)}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      isCritical ? 'bg-red-200 text-red-900 border border-red-300' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {days === null ? 'Sem contato' : `Há ${days} ` + (days === 1 ? 'dia' : 'dias')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="block text-[9px] font-extrabold text-indigo-600 underline hover:text-indigo-800 ml-auto mt-1"
                    >
                      Aproximar
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingLeads.length === 0 && (
              <span className="text-xs text-zinc-500 italic block py-4 text-center">Toda a sua base está aquecida! Sem pendências de contato.</span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTION HISTORY STREAM */}
      <div className="lg:col-span-8 flex flex-col space-y-5">
        
        {/* HEADER TOOLBAR WITH FILTER */}
        <div className="bg-white border-4 border-zinc-950 p-4.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="bg-zinc-900 p-2 border-2 border-zinc-950 rounded-xl text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-black text-sm uppercase italic tracking-tight text-zinc-900">
                Log Histórico de Interações Sólidas
              </h2>
              <p className="text-[10px] text-zinc-500 leading-none">
                {filteredFollowUps.length} abordagens registradas na base operacional do CRM.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Filtrar por nome ou nota..."
                className="w-full bg-zinc-50 border-2 border-zinc-350 pr-3 pl-8 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Type filter */}
            <select
              value={historyFilterType}
              onChange={(e) => setHistoryFilterType(e.target.value)}
              className="bg-zinc-50 border-2 border-zinc-350 rounded-xl p-1.5 text-xs font-bold"
            >
              <option value="all">TODOS MEIOS</option>
              <option value="ligacao">📞 LIGAÇÃO</option>
              <option value="whatsapp">💬 WHATSAPP</option>
              <option value="email">✉️ E-MAIL</option>
              <option value="reuniao">👥 REUNIÃO</option>
              <option value="proposta">📄 PROPOSTA</option>
            </select>
          </div>
        </div>

        {/* FEED STREAM LAYOUT */}
        <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredFollowUps.map((fup, index) => {
            const lead = getLeadById(fup.leadId);
            return (
              <motion.div
                key={fup.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.04 }}
                className="bg-white border-4 border-zinc-950 rounded-2xl p-4.5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] relative hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] transition-all group"
              >
                {/* Delete button positioned nicely */}
                <button
                  type="button"
                  onClick={() => onDeleteFollowUp(fup.id)}
                  title="Remover histórico de follow-up"
                  className="absolute right-4.5 top-4.5 opacity-0 group-hover:opacity-100 p-1.5 border-2 border-zinc-350 hover:border-red-650 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-zinc-50 border-2 border-zinc-950 rounded-xl shrink-0">
                    {getContactIcon(fup.type)}
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <strong className="text-zinc-900 font-sans font-black text-sm uppercase">
                        {fup.leadName}
                      </strong>
                      <span className="text-[10px] text-zinc-400 font-mono font-bold">
                        {fup.date.split('-').reverse().join('/')} às {fup.time}
                      </span>
                      
                      <span className="text-[8px] bg-zinc-150 border border-zinc-300 font-mono font-black uppercase text-zinc-700 px-2 py-0.5 rounded ml-auto">
                        {getContactLabel(fup.type)}
                      </span>
                    </div>

                    {/* Note Content text */}
                    <p className="text-[11.5px] font-semibold text-zinc-700 bg-zinc-50 border-l-4 border-zinc-950 p-2.5 rounded-r-xl leading-relaxed">
                      {fup.notes}
                    </p>

                    {/* Next step planned summary */}
                    {fup.nextStepTitle && (
                      <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-xl p-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🎯</span>
                          <div>
                            <span className="text-[9px] text-indigo-400 font-black uppercase leading-none block">Compromisso Agendado</span>
                            <strong className="text-xs text-indigo-950 font-bold block leading-tight">{fup.nextStepTitle}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-indigo-100 border border-indigo-200 rounded-lg px-2 py-1 text-[9.5px] font-mono text-indigo-900 font-black">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{fup.nextStepDate?.split('-').reverse().join('/')} {fup.nextStepTime}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredFollowUps.length === 0 && (
            <div className="bg-white border-4 border-zinc-950 p-12 rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <span className="text-4xl block mb-2">🔭</span>
              <p className="text-xs text-zinc-500 font-mono font-bold uppercase">Nenhum registro de follow-up localizado para os filtros informados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
