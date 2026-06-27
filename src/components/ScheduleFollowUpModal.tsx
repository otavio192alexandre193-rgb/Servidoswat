import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { Calendar, MessageSquare, Phone, MapPin, Award, Send, Users, Sparkles, X, Check, Globe } from 'lucide-react';
import { Appointment, Lead } from '../types';
import { getCachedGoogleWorkspaceToken } from './GoogleWorkspace';

interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  initialLead?: Lead | null;
  initialLeads?: Lead[] | null;
  onAddAppointment: (newAppt: Appointment) => void;
  awardXP?: (xp: number) => void;
  addNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai') => void;
}

export default function ScheduleFollowUpModal({
  isOpen,
  onClose,
  leads,
  initialLead,
  initialLeads,
  onAddAppointment,
  awardXP,
  addNotification
}: ScheduleFollowUpModalProps) {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  // Form states
  const [leadId, setLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Appointment['type']>('whatsapp');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('14:00');
  const [description, setDescription] = useState('');
  
  // Google integration states
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [createMeet, setCreateMeet] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // NPL prompt state
  const [nplText, setNplText] = useState('');
  const [isNplProcessing, setIsNplProcessing] = useState(false);
  const [nplFeedback, setNplFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Detect Google Account Token
  useEffect(() => {
    if (currentUser) {
      const cachedToken = getCachedGoogleWorkspaceToken(currentUser.uid);
      setGoogleToken(cachedToken);
      if (cachedToken) {
        setSyncToGoogle(true);
      }
    }
  }, [currentUser, isOpen]);

  // Handle selected lead when initialLead changes
  useEffect(() => {
    if (initialLeads && initialLeads.length > 0) {
      setLeadId('bulk');
      setTitle(`Agendamento em Lote (${initialLeads.length} Leads)`);
    } else if (initialLead) {
      setLeadId(initialLead.id);
      setTitle(`Follow-up: ${initialLead.name}`);
    } else {
      setLeadId('');
      setTitle('');
    }
    setNplText('');
    setNplFeedback(null);
  }, [initialLead, initialLeads, isOpen]);

  if (!isOpen) return null;

  // Smart local client-side Regex parsing heuristic fallback
  const parseNplCommandLocally = (command: string) => {
    const cmd = command.toLowerCase();
    let detectedType: Appointment['type'] = 'whatsapp';
    let detectedTitle = 'Compromisso Comercial';
    let detectedDate = new Date().toISOString().split('T')[0];
    let detectedTime = '14:00';
    let detectedDescription = `Agendado via Comando de Linguagem Natural: "${command}"`;
    let matchedLead: Lead | null = null;

    // 1. Detect Type
    if (cmd.includes('whatsapp') || cmd.includes('zap') || cmd.includes('mensagem') || cmd.includes('enviar msg')) {
      detectedType = 'whatsapp';
      detectedTitle = 'Interação WhatsApp';
    } else if (cmd.includes('ligar') || cmd.includes('ligação') || cmd.includes('telefone') || cmd.includes('telefonar') || cmd.includes('call')) {
      detectedType = 'telefone';
      detectedTitle = 'Ligação de Prospecção';
    } else if (cmd.includes('reunião') || cmd.includes('reuniao') || cmd.includes('meeting') || cmd.includes('alinhar')) {
      detectedType = 'reuniao';
      detectedTitle = 'Reunião de Vendas';
    } else if (cmd.includes('proposta') || cmd.includes('orçamento') || cmd.includes('enviar valores') || cmd.includes('mcmv') || cmd.includes('sbpe')) {
      detectedType = 'proposta';
      detectedTitle = 'Apresentação de Proposta';
    } else if (cmd.includes('visita') || cmd.includes('visitar') || cmd.includes('decorado') || cmd.includes('stand')) {
      detectedType = 'visita';
      detectedTitle = 'Visita ao Stand/Decorado';
    } else if (cmd.includes('presencial') || cmd.includes('ação ativa') || cmd.includes('plantão') || cmd.includes('panfletagem')) {
      detectedType = 'presencial';
      detectedTitle = 'Ação Ativa Presencial';
    }

    // 2. Detect Lead by looping and scanning name in text
    for (const l of leads) {
      if (cmd.includes(l.name.toLowerCase())) {
        matchedLead = l;
        break;
      }
    }

    // 3. Detect date relative terms
    const today = new Date();
    if (cmd.includes('amanhã') || cmd.includes('amanha')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      detectedDate = tomorrow.toISOString().split('T')[0];
    } else if (cmd.includes('hoje')) {
      detectedDate = today.toISOString().split('T')[0];
    } else if (cmd.includes('depois de amanhã') || cmd.includes('depois de amanha')) {
      const dayAfter = new Date(today);
      dayAfter.setDate(today.getDate() + 2);
      detectedDate = dayAfter.toISOString().split('T')[0];
    } else {
      // Look for specific weekday name
      const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const ptDayMap: Record<string, number> = {
        segunda: 1, 'terça': 2, terca: 2, quarta: 3, quinta: 4, sexta: 5, 'sábado': 6, sabado: 6, domingo: 0
      };
      
      for (const dayWord of Object.keys(ptDayMap)) {
        if (cmd.includes(dayWord)) {
          const targetDayNum = ptDayMap[dayWord];
          const currentDayNum = today.getDay();
          let daysToAdd = targetDayNum - currentDayNum;
          if (daysToAdd <= 0) daysToAdd += 7; // Next week's weekday
          
          const nextWeekdayDate = new Date(today);
          nextWeekdayDate.setDate(today.getDate() + daysToAdd);
          detectedDate = nextWeekdayDate.toISOString().split('T')[0];
          break;
        }
      }
    }

    // 4. Detect time regex
    const timeRegex = /(\d{1,2})[h:](\d{2})?/;
    const match = cmd.match(timeRegex);
    if (match) {
      const hr = match[1].padStart(2, '0');
      const min = (match[2] || '00').padStart(2, '0');
      detectedTime = `${hr}:${min}`;
    }

    return {
      title: matchedLead ? `${detectedTitle}: ${matchedLead.name}` : detectedTitle,
      type: detectedType,
      date: detectedDate,
      time: detectedTime,
      description: detectedDescription,
      matchedLeadId: matchedLead ? matchedLead.id : '',
      matchedLeadName: matchedLead ? matchedLead.name : ''
    };
  };

  // NPL Parser Submit Handler
  const handleNplInterpret = async () => {
    if (!nplText.trim()) return;
    setIsNplProcessing(true);
    setNplFeedback(null);

    try {
      // Try hitting our backend Gemini model endpoint
      const res = await fetch('/api/ai/parse-followup-npl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nplText, leads })
      });

      if (!res.ok) throw new Error('API processing error');
      
      const parsed = await res.json();
      
      if (parsed) {
        setTitle(parsed.title || '');
        setType(parsed.type || 'whatsapp');
        setDate(parsed.date || new Date().toISOString().split('T')[0]);
        setTime(parsed.time || '14:00');
        setDescription(parsed.description || '');
        if (parsed.matchedLeadId) {
          setLeadId(parsed.matchedLeadId);
        }
        
        setNplFeedback({
          message: `✨ Comando interpretado com sucesso para o lead "${parsed.matchedLeadName || 'Não especificado'}"!`,
          type: 'success'
        });

        if (addNotification) {
          addNotification(
            "Comando NPL Interpretado", 
            `O Gemini configurou um compromisso do tipo "${parsed.type}" para dia ${parsed.date} às ${parsed.time}.`, 
            'ai'
          );
        }
      }
    } catch (err) {
      console.warn("Falling back to local heuristic Regex NPL parser...", err);
      // Fallback
      const localParsed = parseNplCommandLocally(nplText);
      setTitle(localParsed.title);
      setType(localParsed.type);
      setDate(localParsed.date);
      setTime(localParsed.time);
      setDescription(localParsed.description);
      if (localParsed.matchedLeadId) {
        setLeadId(localParsed.matchedLeadId);
      }

      setNplFeedback({
        message: localParsed.matchedLeadId 
          ? `✓ (Heurística Local) Comando interpretado para o lead "${localParsed.matchedLeadName}"!`
          : `✓ (Heurística Local) Comando interpretado, selecione o lead manualmente para confirmar.`,
        type: 'info'
      });
    } finally {
      setIsNplProcessing(false);
    }
  };

  // Google Calendar event creation worker
  const syncWithGoogleCalendar = async (appt: Appointment) => {
    if (!googleToken) return null;
    
    try {
      const startDateTime = new Date(`${appt.date}T${appt.time}:00`).toISOString();
      const endDateTime = new Date(new Date(`${appt.date}T${appt.time}:00`).getTime() + 60 * 60 * 1000).toISOString(); // 1h duration

      const eventBody: any = {
        summary: `[cicloCRED CRM] ${appt.title}`,
        description: `${appt.description}\n\nLead Vinculado: ${appt.leadName}`,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      if (createMeet && appt.type === 'reuniao') {
        eventBody.conferenceData = {
          createRequest: {
            requestId: `meet-${appt.id}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events` + 
        (createMeet && appt.type === 'reuniao' ? `?conferenceDataVersion=1` : '');

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (!res.ok) throw new Error('Falha ao sincronizar com Google Agenda');
      
      const createdEvent = await res.json();
      return createdEvent;
    } catch (err) {
      console.error("Erro na sincronização da Agenda Google:", err);
      return null;
    }
  };

  // Handle Create Appointment Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      alert('Por favor, selecione um lead para este agendamento.');
      return;
    }
    if (!title.trim()) {
      alert('Por favor, insira o assunto do agendamento.');
      return;
    }

    // Mass scheduling path
    if (initialLeads && initialLeads.length > 0) {
      setIsSyncing(true);
      let successCount = 0;

      for (let idx = 0; idx < initialLeads.length; idx++) {
        const selectedLeadObj = initialLeads[idx];
        const newAppt: Appointment = {
          id: `appt-${Date.now()}-${idx}`,
          leadId: selectedLeadObj.id,
          leadName: selectedLeadObj.name,
          title: title.trim(),
          date,
          time,
          description: description.trim() || `Interação de follow-up em lote do tipo ${type}.`,
          status: 'agendado',
          type,
          reminderMinutes: 15,
          reminderSent: false
        };

        if (syncToGoogle && googleToken) {
          await syncWithGoogleCalendar(newAppt);
        }

        onAddAppointment(newAppt);
        successCount++;
      }

      if (awardXP) awardXP(50 * initialLeads.length);

      if (addNotification) {
        addNotification(
          "Sucesso no Agendamento em Lote",
          `Agendamos ${successCount} compromissos de follow-up para o dia ${date} às ${time}.`,
          'success'
        );
      }

      setIsSyncing(false);
      onClose();
      return;
    }

    // Single scheduling path
    const selectedLeadObj = leads.find(l => l.id === leadId);
    if (!selectedLeadObj) {
      alert('Lead selecionado inválido.');
      return;
    }

    setIsSyncing(true);

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      leadId,
      leadName: selectedLeadObj.name,
      title: title.trim(),
      date,
      time,
      description: description.trim() || `Interação de follow-up do tipo ${type}.`,
      status: 'agendado',
      type,
      reminderMinutes: 15,
      reminderSent: false
    };

    let syncResultText = '';
    if (syncToGoogle && googleToken) {
      const synced = await syncWithGoogleCalendar(newAppt);
      if (synced) {
        const meetLink = synced.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
        if (meetLink) {
          newAppt.description += `\n\n🎥 SALA REUNIÃO GOOGLE MEET: ${meetLink}`;
          syncResultText = ' Sincronizado no Google Calendar com sala Google Meet gerada com sucesso!';
        } else {
          syncResultText = ' Sincronizado com o seu Google Calendar com sucesso!';
        }
      } else {
        syncResultText = ' (Aviso: A sincronização com Google Calendar falhou, mas o evento foi criado localmente).';
      }
    }

    onAddAppointment(newAppt);
    
    if (awardXP) awardXP(100);
    
    if (addNotification) {
      addNotification(
        "Sucesso no Agendamento",
        `Follow-up para "${newAppt.leadName}" agendado para o dia ${newAppt.date} às ${newAppt.time}.${syncResultText}`,
        'success'
      );
    }

    setIsSyncing(false);
    onClose();
  };

  const getBadgeIcon = (val: Appointment['type']) => {
    switch (val) {
      case 'whatsapp': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'telefone': return <Phone className="w-3.5 h-3.5" />;
      case 'reuniao': return <Users className="w-3.5 h-3.5" />;
      case 'visita': return <MapPin className="w-3.5 h-3.5" />;
      case 'presencial': return <Globe className="w-3.5 h-3.5" />;
      default: return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xs overflow-y-auto">
      <div 
        id="schedule-follow-up-modal"
        className="relative bg-zinc-900 w-full max-w-2xl rounded-2xl border-4 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Banner de XP */}
        <div className="bg-amber-500 py-1.5 px-4 flex items-center justify-between border-b-2 border-zinc-950">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono text-zinc-950 flex items-center gap-1.5 animate-pulse">
            <Award className="w-4 h-4" />
            <span>Módulo Ativo de Conversão: Planejar este follow-up concede +100 XP ao corretor!</span>
          </span>
          <span className="hidden md:inline-block font-mono text-[10px] font-black text-zinc-950 uppercase">cicloCRED CRM</span>
        </div>

        {/* Header */}
        <div className="p-4 border-b-2 border-zinc-950 bg-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 border-2 border-zinc-950 flex items-center justify-center font-mono text-white text-md font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              🚨
            </div>
            <div>
              <h2 className="text-sm sm:text-md font-black uppercase font-mono text-white tracking-tight leading-none">
                Agendador Inteligente de Follow-up
              </h2>
              <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono tracking-wider">
                ▲ Organizar o Próximo Passo do Funil Comercial
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 border-2 border-zinc-950 text-zinc-400 hover:text-white transition flex items-center justify-center font-black cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-4 sm:p-5 flex flex-col space-y-5 overflow-y-auto max-h-[calc(92vh-140px)]">
          
          {/* NPL (NLP) Quick Command Input */}
          <div className="p-3.5 bg-zinc-800/60 rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase font-mono text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Comando de Voz ou Texto NPL Inteligente (IA)</span>
              </span>
              <span className="font-mono text-[9px] text-zinc-400 uppercase font-bold">Processamento Cognitivo</span>
            </div>
            
            <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
              Digite livremente o compromisso para preencher o formulário na hora. O assistente cicloCRED identificará o lead, o tipo, o dia e a hora.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={nplText}
                onChange={(e) => setNplText(e.target.value)}
                placeholder="Ex: Ligar para Otávio amanhã às 15 horas sobre o financiamento Caixa"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNplInterpret();
                  }
                }}
                className="flex-1 px-3 py-2 bg-zinc-950 rounded-lg text-xs font-mono border-2 border-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleNplInterpret}
                disabled={isNplProcessing}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 text-white font-mono text-xs font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {isNplProcessing ? 'Processando...' : 'Aplicar'}
                <Send className="w-3 h-3" />
              </button>
            </div>

            {nplFeedback && (
              <div className={`p-2 rounded border-2 border-zinc-950 font-mono text-[10px] font-bold ${
                nplFeedback.type === 'success' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-900' :
                nplFeedback.type === 'info' ? 'bg-indigo-950/50 text-indigo-300 border-indigo-900' :
                'bg-red-950/50 text-red-300 border-red-900'
              }`}>
                {nplFeedback.message}
              </div>
            )}
          </div>

          {/* Actual Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Step 1: Select Lead */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-zinc-400 block font-mono">
                1. Selecionar Cliente Vinculado (Lead)
              </label>
              {initialLeads && initialLeads.length > 0 ? (
                <div className="p-3 bg-indigo-900/40 border-2 border-indigo-950 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-white uppercase font-mono">Agendamento em Massa Ativado</p>
                      <p className="text-[10px] text-zinc-300 font-bold font-mono">
                        {initialLeads.length} leads selecionados para esta agenda!
                      </p>
                    </div>
                  </div>
                  <div className="max-w-[180px] truncate text-[9px] text-zinc-400 font-bold font-mono">
                    {initialLeads.map(l => l.name).join(', ')}
                  </div>
                </div>
              ) : (
                <select
                  value={leadId}
                  onChange={(e) => {
                    setLeadId(e.target.value);
                    const selected = leads.find(l => l.id === e.target.value);
                    if (selected) {
                      setTitle(`Follow-up: ${selected.name}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-950 rounded-lg text-xs font-mono border-2 border-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Selecione o Lead na lista ativa --</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.phone || 'Sem telefone'}) - Renda: R$ {lead.familyIncome || lead.familyGrossIncome || 0}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-zinc-400 block font-mono">
                2. Assunto / Título do Compromisso
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Apresentação de Tabela Simulação SBPE"
                className="w-full px-3 py-2 bg-zinc-950 rounded-lg text-xs font-mono border-2 border-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Step 3: Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-zinc-400 block font-mono">
                3. Canal de Interação (Tipo de Atividade)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['whatsapp', 'telefone', 'reuniao', 'proposta', 'visita', 'presencial'] as Appointment['type'][]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2.5 rounded-lg border-2 border-zinc-950 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      type === t 
                        ? 'bg-amber-400 text-zinc-950 shadow-none translate-x-[1px] translate-y-[1px]' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    {getBadgeIcon(t)}
                    <span>
                      {t === 'whatsapp' && 'WhatsApp'}
                      {t === 'telefone' && 'Ligação'}
                      {t === 'reuniao' && 'Reunião'}
                      {t === 'proposta' && 'Proposta'}
                      {t === 'visita' && 'Visita'}
                      {t === 'presencial' && 'Ação Ativa'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-zinc-400 block font-mono">
                  4. Data da Atividade
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 rounded-lg text-xs font-mono border-2 border-zinc-950 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-zinc-400 block font-mono">
                  5. Horário Agendado
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 rounded-lg text-xs font-mono border-2 border-zinc-950 text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Step 5: Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-zinc-400 block font-mono">
                6. Notas Adicionais e Roteiro de Apoio
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Insira detalhes adicionais, links de plantas analisadas ou observações sobre o perfil de financiamento do cliente."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-950 rounded-lg text-xs font-mono border-2 border-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Google Integration Panel */}
            <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px] font-bold">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Configurações do Google Workspace</span>
                </div>
                {googleToken ? (
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                    Google Conectado
                  </span>
                ) : (
                  <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                    Offline
                  </span>
                )}
              </div>

              {googleToken ? (
                <div className="space-y-2 text-[11px] font-mono">
                  <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToGoogle}
                      onChange={(e) => setSyncToGoogle(e.target.checked)}
                      className="rounded border-zinc-950 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer bg-zinc-950"
                    />
                    Sincronizar este compromisso com o meu Google Agenda
                  </label>

                  {type === 'reuniao' && (
                    <label className="flex items-center gap-2 text-zinc-200 cursor-pointer pl-6">
                      <input
                        type="checkbox"
                        checked={createMeet}
                        onChange={(e) => setCreateMeet(e.target.checked)}
                        className="rounded border-zinc-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer bg-zinc-950"
                      />
                      Gerar sala de videoconferência Google Meet no evento
                    </label>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  ⚠️ Sua conta Google não está conectada. Para sincronizar esta tarefa com a agenda oficial do seu celular e habilitar convites ao Meet para o cliente, ative o login com o Google na aba <strong>"Google Workspace"</strong> no menu de configurações do CRM.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-650 text-zinc-300 font-mono text-xs font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-mono text-xs font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
