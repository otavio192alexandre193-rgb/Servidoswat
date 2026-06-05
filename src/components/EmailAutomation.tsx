/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Lead, EmailTemplate, EmailLog } from '../types';
import { 
  Mail, 
  Send, 
  Plus, 
  ChevronRight, 
  CornerDownRight, 
  Paperclip,
  CheckCircle2,
  Trash2,
  Smartphone,
  Instagram,
  Facebook,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Play,
  Square,
  UserCheck,
  Clock,
  Volume2,
  AlertTriangle,
  RotateCcw,
  ListOrdered
} from 'lucide-react';
import { triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';

interface EmailAutomationProps {
  leads: Lead[];
  templates: EmailTemplate[];
  logs: EmailLog[];
  onAddTemplate: (newTemplate: EmailTemplate) => void;
  onEditTemplate: (updatedTemplate: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSendEmailSimulated: (emailLog: EmailLog) => void;
  theme?: 'claro' | 'escuro' | 'galatico';
  accSettings?: any;
  initialTargetLeadIds?: string[];
  onClearInitialTargets?: () => void;
}

export default function EmailAutomation({
  leads,
  templates,
  logs,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSendEmailSimulated,
  theme = 'escuro',
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS,
  initialTargetLeadIds = [],
  onClearInitialTargets
}: EmailAutomationProps) {
  // Tabs: 'templates' (Modelos de Scripts), 'dispatch' (Painel de Disparos), 'logs' (Histórico)
  const [activeTab, setActiveTab] = useState<'templates' | 'dispatch' | 'logs'>('templates');

  // Filter dispatch options based on selected leads from CRM list
  const [isFilterBySelected, setIsFilterBySelected] = useState<boolean>(initialTargetLeadIds.length > 0);

  // Sync state if initialTargetLeadIds changes
  useEffect(() => {
    if (initialTargetLeadIds.length > 0) {
      setIsFilterBySelected(true);
    }
  }, [initialTargetLeadIds]);

  // New/Edit Template Form States
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('');

  // Single Dispatch Selector States
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [dispatchChannel, setDispatchChannel] = useState<'whatsapp' | 'email' | 'instagram' | 'facebook'>('whatsapp');
  const [socialHandle, setSocialHandle] = useState('');
  const [copied, setCopied] = useState(false);

  // TIMEOUT & TIMED QUEUE STATES
  interface QueueItem {
    lead: Lead;
    status: 'idle' | 'sending' | 'waiting' | 'done' | 'failed';
    logId?: string;
  }
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedQueueTemplateId, setSelectedQueueTemplateId] = useState('');
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [countdown, setCountdown] = useState<number>(0);
  const [queueChannel, setQueueChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isAssistedMode, setIsAssistedMode] = useState(true);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [leadCheckboxSelection, setLeadCheckboxSelection] = useState<Record<string, boolean>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Placeholders list
  const placeholders = [
    { code: '{{nome}}', desc: 'Nome do lead' },
    { code: '{{empresa}}', desc: 'Nome da empresa' },
    { code: '{{valor}}', desc: 'Valor estimado' },
    { code: '{{origem}}', desc: 'Origem do lead' },
  ];

  // Compile / Resolve placeholders in real-time
  const resolvePlaceholders = (text: string, lead: Lead): string => {
    return text
      .replace(/\{\{nome\}\}/g, lead.name)
      .replace(/\{\{empresa\}\}/g, lead.company || 'sua empresa')
      .replace(/\{\{origem\}\}/g, lead.origin)
      .replace(/\{\{valor\}\}/g, lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));
  };

  const handleCreateOrEditTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) return;

    if (editingTemplate) {
      onEditTemplate({
        ...editingTemplate,
        name,
        subject,
        body,
        triggerEvent: triggerEvent || undefined
      });
      setEditingTemplate(null);
    } else {
      onAddTemplate({
        id: `template-${Date.now()}`,
        name,
        subject,
        body,
        triggerEvent: triggerEvent || undefined
      });
      setIsCreating(false);
    }

    // Reset Form
    setName('');
    setSubject('');
    setBody('');
    setTriggerEvent('');
  };

  const startEdit = (temp: EmailTemplate) => {
    setEditingTemplate(temp);
    setName(temp.name);
    setSubject(temp.subject);
    setBody(temp.body);
    setTriggerEvent(temp.triggerEvent || '');
    setIsCreating(true);
  };

  const handleTemplateSelection = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find(t => t.id === id);
    const lead = leads.find(l => l.id === selectedLeadId);

    if (tmpl) {
      if (lead) {
        setCustomSubject(resolvePlaceholders(tmpl.subject, lead));
        setCustomBody(resolvePlaceholders(tmpl.body, lead));
      } else {
        setCustomSubject(tmpl.subject);
        setCustomBody(tmpl.body);
      }
    } else {
      setCustomSubject('');
      setCustomBody('');
    }
  };

  const handleLeadSelection = (id: string) => {
    setSelectedLeadId(id);
    const lead = leads.find(l => l.id === id);
    const tmpl = templates.find(t => t.id === selectedTemplateId);

    if (lead && tmpl) {
      setCustomSubject(resolvePlaceholders(tmpl.subject, lead));
      setCustomBody(resolvePlaceholders(tmpl.body, lead));
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(customBody);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Helper trigger for action
  const executeSingleDispatchEvent = (lead: Lead, templateSubject: string, resolvedBody: string, channel: 'whatsapp' | 'email' | 'instagram' | 'facebook'): boolean => {
    let opened: Window | null = null;
    try {
      if (channel === 'email') {
        const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(templateSubject || 'Oportunidade cicloCRED & Cury')}&body=${encodeURIComponent(resolvedBody)}`;
        opened = window.open(mailtoUrl, '_blank');
      } else if (channel === 'whatsapp') {
        const rawPhone = lead.phone.replace(/\D/g, '');
        const cleanPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(resolvedBody)}`;
        opened = window.open(waUrl, '_blank');
      } else if (channel === 'instagram') {
        const instaUser = socialHandle ? socialHandle.replace('@', '') : '';
        const url = instaUser ? `https://instagram.com/${instaUser}/` : 'https://instagram.com/direct/inbox/';
        navigator.clipboard.writeText(resolvedBody);
        opened = window.open(url, '_blank');
      } else if (channel === 'facebook') {
        const fbUser = socialHandle;
        const url = fbUser ? `https://m.me/${fbUser}` : 'https://messenger.com/';
        navigator.clipboard.writeText(resolvedBody);
        opened = window.open(url, '_blank');
      }
    } catch (err) {
      console.warn("Blocked window.open:", err);
    }
    
    const success = !!opened;
    if (success) {
      setIsPopupBlocked(false);
    }
    return success;
  };

  const handleRealLocalDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead || !customBody) return;

    executeSingleDispatchEvent(lead, customSubject, customBody, dispatchChannel);

    // Save log entry inside local CRM audit
    const chosenTemplate = templates.find(t => t.id === selectedTemplateId);
    const log: EmailLog = {
      id: `log-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      templateName: (chosenTemplate ? chosenTemplate.name : 'Personalizado') + ` (${dispatchChannel.toUpperCase()})`,
      subject: customSubject || `Script para ${lead.name}`,
      body: customBody,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'enviado'
    };

    onSendEmailSimulated(log);

    // Reset simulator inputs
    setSelectedLeadId('');
    setSelectedTemplateId('');
    setCustomSubject('');
    setCustomBody('');
    setSocialHandle('');
    triggerSensoryFeedback('success', accSettings);
    setActiveTab('logs');
  };

  // MULTI-SELECTION FOR AUTOMATED TIMER QUEUE
  const handleToggleLeadSelection = (leadId: string) => {
    setLeadCheckboxSelection(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const handleSelectAllLeadsForQueue = () => {
    const newVal: Record<string, boolean> = {};
    leads.forEach(l => {
      newVal[l.id] = true;
    });
    setLeadCheckboxSelection(newVal);
    triggerSensoryFeedback('chime', accSettings);
  };

  const handleClearCheckboxSelection = () => {
    setLeadCheckboxSelection({});
    triggerSensoryFeedback('click', accSettings);
  };

  const handleAddSelectedToQueue = () => {
    const selectedLeads = leads.filter(l => leadCheckboxSelection[l.id]);
    if (selectedLeads.length === 0) return;

    const newQueueItems: QueueItem[] = selectedLeads.map(l => ({
      lead: l,
      status: 'idle'
    }));

    setQueue(prev => [...prev, ...newQueueItems]);
    setLeadCheckboxSelection({});
    triggerSensoryFeedback('success', accSettings);
  };

  const handleClearQueue = () => {
    stopQueueEngine();
    setQueue([]);
    setCurrentQueueIndex(-1);
    setCountdown(0);
    triggerSensoryFeedback('warning', accSettings);
  };

  // QUEUE PROCESSING CORE LOGIC
  const stopQueueEngine = () => {
    setIsQueueRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleStartQueue = () => {
    if (queue.length === 0) return;
    if (!selectedQueueTemplateId) {
      alert("Por favor, selecione qual Modelo de Script deseja disparar para o lote.");
      return;
    }

    triggerSensoryFeedback('chime', accSettings);
    setIsQueueRunning(true);
    
    // Find next non-done item
    let startIndex = queue.findIndex(item => item.status !== 'done');
    if (startIndex === -1) {
      // If all are finished, reset status to idle and start from beginning
      const resetQueue = queue.map(item => ({ ...item, status: 'idle' as const }));
      setQueue(resetQueue);
      startIndex = 0;
    }
    
    setCurrentQueueIndex(startIndex);
  };

  const handleAssistedDispatch = () => {
    if (currentQueueIndex === -1 || currentQueueIndex >= queue.length) return;
    const item = queue[currentQueueIndex];
    
    const selectedTmpl = templates.find(t => t.id === selectedQueueTemplateId);
    const scriptSubject = selectedTmpl ? selectedTmpl.subject : 'Apresentação cicloCRED & Cury';
    const scriptBody = selectedTmpl ? selectedTmpl.body : 'Olá {{nome}}';

    const resolvedSubject = resolvePlaceholders(scriptSubject, item.lead);
    const resolvedBody = resolvePlaceholders(scriptBody, item.lead);

    // 1. Fire window.open (this is a direct click gesture, popups will never be blocked!)
    executeSingleDispatchEvent(item.lead, resolvedSubject, resolvedBody, queueChannel);

    // 2. Write CRM audit log
    const auditRecord: EmailLog = {
      id: `log-queue-${Date.now()}-${currentQueueIndex}`,
      leadId: item.lead.id,
      leadName: item.lead.name,
      templateName: (selectedTmpl ? selectedTmpl.name : 'Modelo de Lote') + ` (${queueChannel.toUpperCase()} - Fila Assistida)`,
      subject: resolvedSubject,
      body: resolvedBody,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'enviado'
    };
    onSendEmailSimulated(auditRecord);

    // 3. Mark item as done
    setQueue(prev => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: 'done' } : q));

    // 4. Play success feedback
    triggerSensoryFeedback('chime', accSettings);

    // 5. Move to next item in the queue
    setCurrentQueueIndex(prev => prev + 1);
  };

  // Run queue trigger whenever index changes if queue is running
  useEffect(() => {
    if (!isQueueRunning || currentQueueIndex === -1 || currentQueueIndex >= queue.length) {
      if (isQueueRunning && currentQueueIndex >= queue.length) {
        // Queue fully complete!
        setIsQueueRunning(false);
        setCurrentQueueIndex(-1);
        triggerSensoryFeedback('success', accSettings);
      }
      return;
    }

    const item = queue[currentQueueIndex];
    
    // Process current queue item and change status to sending
    setQueue(prev => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: 'sending' } : q));

    if (isAssistedMode) {
      // In assisted mode, we PAUSE here and wait for the manual click to avoid popup blocker!
      // No automatic timers or window opens.
      return;
    }

    const selectedTmpl = templates.find(t => t.id === selectedQueueTemplateId);
    const scriptSubject = selectedTmpl ? selectedTmpl.subject : 'Apresentação cicloCRED & Cury';
    const scriptBody = selectedTmpl ? selectedTmpl.body : 'Olá {{nome}}';

    const resolvedSubject = resolvePlaceholders(scriptSubject, item.lead);
    const resolvedBody = resolvePlaceholders(scriptBody, item.lead);

    // Call simulated dispatcher
    const success = executeSingleDispatchEvent(item.lead, resolvedSubject, resolvedBody, queueChannel);
    if (!success && queueChannel === 'whatsapp') {
      setIsPopupBlocked(true);
    } else {
      setIsPopupBlocked(false);
    }

    // Write log audit to CRM
    const auditRecord: EmailLog = {
      id: `log-queue-${Date.now()}-${currentQueueIndex}`,
      leadId: item.lead.id,
      leadName: item.lead.name,
      templateName: (selectedTmpl ? selectedTmpl.name : 'Modelo de Lote') + ` (${queueChannel.toUpperCase()} - Fila)`,
      subject: resolvedSubject,
      body: resolvedBody,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'enviado'
    };

    onSendEmailSimulated(auditRecord);

    // Transition item to 'waiting' and start a visible 3-second delay timer countdown
    setQueue(prev => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: 'waiting' } : q));
    setCountdown(3);

    // Start countdown ticking
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Wait exactly 3 seconds, mark item as done, and progressive jump to next row sequentially
    timerRef.current = setTimeout(() => {
      setQueue(prev => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: 'done' } : q));
      setCurrentQueueIndex(prev => prev + 1);
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isQueueRunning, currentQueueIndex, selectedQueueTemplateId, isAssistedMode]);

  // Clean-up refs on destroy
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Keyboard accessibility: press ENTER in assisted mode to fire and advance the campaign queue instantly
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if operator is writing inside fields/textareas
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }

      if (isQueueRunning && isAssistedMode && currentQueueIndex !== -1 && currentQueueIndex < queue.length) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAssistedDispatch();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isQueueRunning, isAssistedMode, currentQueueIndex, queue, selectedQueueTemplateId]);

  // Theme support colors
  const pageBackground = theme === 'claro' 
    ? 'bg-zinc-50 text-zinc-900' 
    : theme === 'escuro' 
      ? 'bg-zinc-950 text-zinc-100' 
      : 'bg-indigo-950/20 text-indigo-100';

  const cardBackground = theme === 'claro'
    ? 'bg-white border-4 border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]'
    : theme === 'escuro'
      ? 'bg-zinc-900 border-4 border-zinc-950 text-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
      : 'bg-indigo-950/70 border-4 border-indigo-900 text-indigo-100 shadow-[4px_4px_0px_0px_rgba(129,140,248,0.15)]';

  const subCardBackground = theme === 'claro' ? 'bg-zinc-100 border border-zinc-250 text-zinc-800' : 'bg-zinc-950 border border-zinc-800 text-zinc-300';
  const labelTextColor = theme === 'claro' ? 'text-zinc-700' : 'text-zinc-300';
  const subtitleTextColor = theme === 'claro' ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div className={`space-y-8 animate-fadeIn ${pageBackground}`}>
      
      {/* Tab Navigation header */}
      <div className={`flex flex-col sm:flex-row border-4 border-zinc-950 p-1.5 rounded-2xl gap-2 select-none ${theme === 'claro' ? 'bg-zinc-100' : 'bg-zinc-900'}`}>
        <button
          onClick={() => { setActiveTab('templates'); setIsCreating(false); setEditingTemplate(null); }}
          className={`flex-1 px-5 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-xl border-2 text-center ${
            activeTab === 'templates' && !isCreating
              ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
              : 'border-transparent hover:text-indigo-400 transition ' + (theme === 'claro' ? 'text-zinc-600' : 'text-zinc-400')
          }`}
        >
          📝 Modelos de Scripts
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex-1 px-5 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-xl border-2 text-center ${
            activeTab === 'dispatch'
              ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
              : 'border-transparent hover:text-indigo-400 transition ' + (theme === 'claro' ? 'text-zinc-600' : 'text-zinc-400')
          }`}
        >
          ⚡ Painel de Disparos em Fila
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-5 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-xl border-2 text-center ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black'
              : 'border-transparent hover:text-indigo-400 transition ' + (theme === 'claro' ? 'text-zinc-600' : 'text-zinc-400')
          }`}
        >
          📁 Histórico de Envios ({logs.length})
        </button>
      </div>

      {/* RENDER MODEL TAB (Modelos de Scripts) */}
      {activeTab === 'templates' && (
        <div id="email-templates-tab-pane" className="space-y-6 animate-fadeIn">
          {/* Template Add / Form editor */}
          {isCreating ? (
            <form onSubmit={handleCreateOrEditTemplate} className={cardBackground}>
              <h3 className="text-md font-black uppercase italic tracking-tight border-b-2 border-zinc-900/40 pb-3 flex items-center gap-2">
                <span>{editingTemplate ? '✏️ Editar Modelo de Script' : '✉️ Novo Script de Atendimento'}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="temp-name" className="block text-xs font-black uppercase mb-2 font-mono">Nome de Controle do Script</label>
                  <input
                    type="text"
                    id="temp-name"
                    required
                    placeholder="Ex: First-call Convênio Cury MCMV"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:bg-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="temp-trigger" className="block text-xs font-black uppercase mb-2 font-mono">Gatilho do Funil</label>
                  <input
                    type="text"
                    id="temp-trigger"
                    placeholder="Ex: Proposta Inicial de Venda"
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:bg-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="temp-subject" className="block text-xs font-black uppercase mb-2 font-mono">Assunto / Título do Disparo</label>
                <input
                  type="text"
                  id="temp-subject"
                  required
                  placeholder="Seu assunto ou cabeçalho contendo variáveis de controle..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:bg-zinc-900 outline-none"
                />
              </div>

              {/* Placeholders helper bar */}
              <div id="email-template-placeholders" className={`flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl border mt-4 ${subCardBackground}`}>
                <span className="text-[10px] uppercase font-mono font-black">Gatilhos Rápidos:</span>
                {placeholders.map(p => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => {
                      setBody(prev => prev + ' ' + p.code);
                    }}
                    title={p.desc}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white border border-zinc-950 font-black px-3 py-1 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none cursor-pointer"
                  >
                    {p.code}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label htmlFor="temp-body" className="block text-xs font-black uppercase mb-2 font-mono">Corpo da Mensagem (Script Texto)</label>
                <textarea
                  id="temp-body"
                  required
                  rows={8}
                  placeholder="Olá {{nome}}, temos uma excelente oportunidade no residencial Cury Metropolitana..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm text-white focus:bg-zinc-900 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-zinc-800 mt-5">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingTemplate(null); }}
                  className="px-4.5 py-2.5 border-2 border-zinc-950 hover:bg-zinc-800 text-zinc-300 font-black rounded-xl text-xs uppercase font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] font-mono"
                >
                  Salvar Roteiro Script
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className={cardBackground + " p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"}>
                <div>
                  <h2 className="text-md font-black uppercase tracking-tight">Roteiros e Scripts de Vendas</h2>
                  <p className="text-xs font-medium font-sans">Desenvolva abordagens táticas com campos dinâmicos voltados à Cury, MCMV e SBPE.</p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Script</span>
                </button>
              </div>

              {/* Grid of existing templates */}
              <div id="templates-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className={cardBackground + " flex flex-col justify-between"}>
                    <div className="space-y-3 p-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-sans font-black text-sm uppercase tracking-tight">{tmpl.name}</h4>
                        {tmpl.triggerEvent && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded border border-zinc-950 bg-indigo-55 text-indigo-200 uppercase tracking-widest font-mono shrink-0">
                            {tmpl.triggerEvent}
                          </span>
                        )}
                      </div>
                      <div className="text-xs border-l-4 border-indigo-600 pl-3">
                        <span className="font-extrabold opacity-60">Assunto: </span>
                        {tmpl.subject}
                      </div>
                      <p className="text-xs line-clamp-4 whitespace-pre-wrap font-sans font-medium leading-relaxed">
                        {tmpl.body}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-zinc-800/60 pt-3.5 mt-4">
                      <button
                        onClick={() => startEdit(tmpl)}
                        className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Editar
                      </button>
                      <button
                        id={`delete-template-${tmpl.id}`}
                        onClick={() => onDeleteTemplate(tmpl.id)}
                        className="px-3 py-1 bg-rose-950/20 text-rose-500 border border-rose-900/40 hover:bg-rose-950/40 text-[10px] font-black uppercase rounded"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER DISPATCH TAB (Painel de Disparos em Fila Comercial) */}
      {activeTab === 'dispatch' && (
        <div id="email-dispatch-tab-pane" className="space-y-8 animate-fadeIn">
          
          {/* Section 1: Administrator of Timed Sequential Queue */}
          <div className={cardBackground}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-800/80 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-black text-indigo-400 bg-indigo-950/80 border border-indigo-900 px-2 py-0.5 rounded uppercase tracking-wider">▲ SISTEMA CRON-TEMPORIZADO</span>
                <h2 className="text-md font-black uppercase tracking-tight flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-indigo-500" />
                  <span>Fila de Disparos em Bloco Automatizada (3s delay)</span>
                </h2>
                <p className="text-xs text-zinc-400 font-medium">Selecione contatos, ordene na fila, aperte o play e assista o cicloCRED abrir sequencialmente as propostas.</p>
              </div>

              {/* Status Indicator */}
              {isQueueRunning && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/50 border-2 border-emerald-500 text-emerald-400 font-mono font-black text-xs uppercase rounded-xl animate-pulse">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Estágio Ativo • Pausa de 3s ({countdown}s restantes)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              
              {/* Left Column: Build Queue Selector (6 Cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/40">
                  <span className="text-[11px] font-mono font-black uppercase text-indigo-400">1. Escolha Clientes na Carteira</span>
                  <div className="flex gap-2.5">
                    <button 
                      onClick={handleSelectAllLeadsForQueue}
                      className="text-[9px] font-mono font-black uppercase text-zinc-300 hover:text-white"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-zinc-600">|</span>
                    <button 
                      onClick={handleClearCheckboxSelection}
                      className="text-[9px] font-mono font-black uppercase text-zinc-300 hover:text-white"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="max-h-[220px] overflow-y-auto border-2 border-zinc-950 rounded-xl bg-zinc-950/60 p-2 space-y-1.5">
                  {leads.map(lead => {
                    const isChecked = !!leadCheckboxSelection[lead.id];
                    return (
                      <div 
                        key={lead.id} 
                        onClick={() => handleToggleLeadSelection(lead.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none ${
                          isChecked ? 'bg-indigo-900/20 border border-indigo-700' : 'hover:bg-zinc-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Swallowed since card click handles it
                            className="accent-indigo-500 h-3.5 w-3.5 rounded"
                          />
                          <span className="font-bold text-white uppercase">{lead.name}</span>
                          <span className="text-[10px] text-zinc-400">({lead.origin})</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddSelectedToQueue}
                  disabled={leads.filter(l => leadCheckboxSelection[l.id]).length === 0}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border-2 border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Selecionados à Fila de Disparo comercial ({leads.filter(l => leadCheckboxSelection[l.id]).length})</span>
                </button>
              </div>

              {/* Right Column: Queue Dispatch controls (6 Cols) */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Script Template Selector to execute on LOT */}
                  <div>
                    <label className="block text-xs font-mono font-black uppercase text-zinc-400 mb-1.5">2. Roteiro / Script do Envio</label>
                    <select
                      value={selectedQueueTemplateId}
                      onChange={(e) => setSelectedQueueTemplateId(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2.5 text-xs text-white font-extrabold outline-none"
                    >
                      <option value="">Selecione o Roteiro Script para a fila...</option>
                      {templates.map(tmpl => (
                        <option key={tmpl.id} value={tmpl.id}>{tmpl.name} (Gatilho: {tmpl.triggerEvent || 'Geral'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Channel Toggle */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="block text-xs font-mono font-black uppercase text-zinc-400">3. Canal de Envio do Lote</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="radio" 
                          name="queue-chan" 
                          checked={queueChannel === 'whatsapp'} 
                          onChange={() => setQueueChannel('whatsapp')}
                          className="accent-indigo-500"
                        />
                        <span className="font-bold uppercase text-white font-semibold">WhatsApp Direct API</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="radio" 
                          name="queue-chan" 
                          checked={queueChannel === 'email'} 
                          onChange={() => setQueueChannel('email')}
                          className="accent-indigo-500"
                        />
                        <span className="font-bold uppercase text-white font-semibold">E-mail Local (Mailto)</span>
                      </label>
                    </div>
                  </div>

                  {/* Mode Toggle */}
                  <div className="pt-2.5 border-t border-zinc-800 space-y-1.5">
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isAssistedMode} 
                        onChange={(e) => setIsAssistedMode(e.target.checked)}
                        className="accent-indigo-500 rounded h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-mono font-black uppercase text-amber-400">Modo Assistido Semi-Automático (Recomendado)</span>
                    </label>
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                      Altamente recomendado para WhatsApp. Em vez de disparar de uma vez (o que o navegador bloqueia como popup indesejado), o sistema gerencia a fila e ativa cada conversa de forma ágil e segura com um clique seu por cliente.
                    </p>
                  </div>
                </div>

                {/* Queue Display & Start controls */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-black uppercase text-zinc-400">Status da Fila ({queue.length} Clientes)</span>
                    <button 
                      onClick={handleClearQueue} 
                      className="text-[9px] font-mono font-black text-rose-400 hover:text-rose-300 uppercase shrink-0 cursor-pointer"
                    >
                      Limpar Fila
                    </button>
                  </div>

                  {queue.length === 0 ? (
                    <p className="text-center py-5 text-xs text-zinc-500 italic">Nenhum cliente na fila de transmissão temporizada.</p>
                  ) : (
                    <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 font-mono">
                      {queue.map((item, index) => (
                        <div 
                          key={`${item.lead.id}-q-${index}`}
                          className={`flex justify-between items-center p-1.5 rounded text-[10px] ${
                            index === currentQueueIndex 
                              ? 'bg-indigo-600/35 text-indigo-100 font-extrabold border border-indigo-600' 
                              : item.status === 'done' 
                                ? 'opacity-40 text-zinc-400 line-through' 
                                : 'text-zinc-300'
                          }`}
                        >
                          <span className="truncate max-w-[170px]">({index + 1}) {item.lead.name}</span>
                          <span className={`text-[9px] uppercase font-black ${
                            item.status === 'done' ? 'text-emerald-400' :
                            item.status === 'sending' ? 'text-indigo-400 animate-pulse' :
                            item.status === 'waiting' ? 'text-yellow-400' : 'text-zinc-500'
                          }`}>
                            {item.status === 'done' && 'Concluído'}
                            {item.status === 'sending' && (isAssistedMode ? 'Aguardando Clique' : 'Disparando...')}
                            {item.status === 'waiting' && `Próximo em ${countdown}s`}
                            {item.status === 'idle' && 'Aguardando'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Play & Pause actions & Assisted Action Button */}
                  <div className="flex flex-col gap-2.5">
                    {isQueueRunning && isAssistedMode && currentQueueIndex !== -1 && currentQueueIndex < queue.length && (
                      <button
                        type="button"
                        onClick={handleAssistedDispatch}
                        className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-black font-mono uppercase text-[11px] rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.25)] flex items-center justify-center gap-2 animate-pulse cursor-pointer border-2 border-zinc-950 transform active:scale-95 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-zinc-950 stroke-[3]" />
                        <span>Abrir Whats para {queue[currentQueueIndex].lead.name} & Avançar 🚀</span>
                      </button>
                    )}

                    {isQueueRunning && isAssistedMode && (
                      <p className="text-[10px] text-amber-400 font-mono text-center animate-pulse leading-none py-1.5 bg-amber-950/20 rounded-md border border-amber-500/20">
                        💡 ATALHO ATIVO: Pressione [ ENTER ] no teclado para disparar e avançar super rápido!
                      </p>
                    )}

                    {isPopupBlocked && (
                      <div className="p-3 bg-rose-950/40 border border-rose-500 text-rose-300 rounded-xl text-[10.5px] leading-normal font-sans space-y-1 mt-1 text-left">
                        <span className="font-extrabold uppercase block text-rose-400">⚠️ BLOQUEADOR DE POP-UPS INTERCEPTADO</span>
                        <p className="opacity-90">
                          Seu navegador impediu a abertura automática da aba do WhatsApp. Como resolver:
                        </p>
                        <ol className="list-decimal pl-4.5 space-y-0.5 opacity-80 font-semibold">
                          <li>Clique no ícone de "Bloqueador de janela" na barra de endereço (lado direito).</li>
                          <li>Selecione "Sempre permitir popups e redirecionamentos..." e clique em Concluído.</li>
                          <li>Ou utilize o <strong className="text-amber-400">Modo Assistido</strong> e dispare com a tecla [Enter], que burla qualquer bloqueador!</li>
                        </ol>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isQueueRunning ? (
                        <button
                          type="button"
                          onClick={stopQueueEngine}
                          className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white font-mono font-black uppercase text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Square className="w-4 h-4" />
                          <span>Pausar Disparos</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartQueue}
                          disabled={queue.length === 0 || !selectedQueueTemplateId}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-black uppercase text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>{isAssistedMode ? 'Iniciar Fila Controlada (Modo Seguro)' : 'Iniciar Disparos Automáticos (delay 3s)'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Section 2: Unified Single / Manual Message panel (Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Dispatch controls */}
            <div className={`lg:col-span-7 ${cardBackground} p-6 space-y-5`}>
              <div>
                <h2 className="text-md font-black flex items-center gap-2 uppercase tracking-tight">
                  <Share2 className="w-5 h-5 text-indigo-500" />
                  <span>Abordagem Individual Rápida</span>
                </h2>
                <p className="text-xs subtitleTextColor font-medium">Configure e copie scripts personalizados instantaneamente para mídias sociais ou e-mail.</p>
              </div>

              {/* Channel Selection Buttons */}
              <div className="grid grid-cols-4 gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setDispatchChannel('whatsapp')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${dispatchChannel === 'whatsapp' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
                >
                  <Smartphone className="w-5 h-5 mb-1 text-emerald-500" />
                  <span className="text-[10px] uppercase font-mono font-black">WhatsApp</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDispatchChannel('email')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${dispatchChannel === 'email' ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200' : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
                >
                  <Mail className="w-5 h-5 mb-1 text-indigo-500" />
                  <span className="text-[10px] uppercase font-mono font-black">E-mail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDispatchChannel('instagram')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${dispatchChannel === 'instagram' ? 'bg-pink-900/45 border-pink-500 text-pink-200' : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
                >
                  <Instagram className="w-5 h-5 mb-1 text-pink-500" />
                  <span className="text-[10px] uppercase font-mono font-black">Instagram</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDispatchChannel('facebook')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${dispatchChannel === 'facebook' ? 'bg-blue-900/40 border-blue-500 text-blue-200' : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
                >
                  <Facebook className="w-5 h-5 mb-1 text-blue-500" />
                  <span className="text-[10px] uppercase font-mono font-black">Messenger</span>
                </button>
              </div>

              <form onSubmit={handleRealLocalDispatch} className="space-y-4 text-zinc-950">
                {/* FILTRO ATIVO DIRECT LINK TO SELECTED CLIENTS */}
                {initialTargetLeadIds && initialTargetLeadIds.length > 0 && (
                  <div className="p-3 bg-indigo-950/90 border-2 border-indigo-500/80 rounded-2xl flex items-center justify-between text-white font-mono text-[10px] animate-fadeIn shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span>
                        Filtro Clínico: <strong className="text-amber-400">{initialTargetLeadIds.length} contatos</strong> ativos do CRM
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer bg-indigo-900/40 hover:bg-indigo-900/85 px-1.5 py-0.5 rounded transition">
                      <input
                        type="checkbox"
                        checked={isFilterBySelected}
                        onChange={(e) => setIsFilterBySelected(e.target.checked)}
                        className="accent-indigo-500"
                      />
                      <span>Filtrar</span>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sim-select-lead" className={`block text-xs font-black uppercase mb-1.5 font-mono ${theme === 'claro' ? 'text-zinc-700' : 'text-zinc-400'}`}>Destinatário do Script *</label>
                    <select
                      id="sim-select-lead"
                      required
                      value={selectedLeadId}
                      onChange={(e) => handleLeadSelection(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold outline-none"
                    >
                      <option value="">Selecione um lead...</option>
                      {(isFilterBySelected && initialTargetLeadIds && initialTargetLeadIds.length > 0
                        ? leads.filter(l => initialTargetLeadIds.includes(l.id))
                        : leads
                      ).map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name} ({lead.company || 'Pessoa Física'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sim-select-template" className={`block text-xs font-black uppercase mb-1.5 font-mono ${theme === 'claro' ? 'text-zinc-700' : 'text-zinc-400'}`}>Modelo de Roteiro</label>
                    <select
                      id="sim-select-template"
                      required
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelection(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-extrabold outline-none"
                    >
                      <option value="">Selecione um modelo...</option>
                      {templates.map(tmpl => (
                        <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dynamic fields based on channel selection */}
                {dispatchChannel === 'email' && (
                  <div className="animate-fadeIn">
                    <label htmlFor="sim-subject" className={`block text-xs font-black uppercase mb-1.5 font-mono ${theme === 'claro' ? 'text-zinc-700' : 'text-zinc-400'}`}>Assunto do E-mail</label>
                    <input
                      type="text"
                      id="sim-subject"
                      required
                      placeholder="Ex: Confirmação de financiamento MCMV"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-xs text-white font-bold focus:bg-zinc-900 outline-none"
                    />
                  </div>
                )}

                {(dispatchChannel === 'instagram' || dispatchChannel === 'facebook') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <label htmlFor="sim-handle" className="block text-xs font-black text-zinc-400 uppercase mb-2 font-mono">
                        {dispatchChannel === 'instagram' ? 'Nome de Usuário (@insta)' : 'Usuário / Nome de Perfil (Facebook)'}
                      </label>
                      <input
                        type="text"
                        id="sim-handle"
                        placeholder={dispatchChannel === 'instagram' ? 'Ex: otavio.alexandre' : 'Ex: otavio.alexandre.9'}
                        value={socialHandle}
                        onChange={(e) => setSocialHandle(e.target.value)}
                        className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-xs text-white font-mono font-bold focus:bg-zinc-900 outline-none"
                      />
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 flex items-center">
                      <span>
                        💡 O conteúdo será copiado automaticamente para sua área de transferência para colagem rápida.
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="sim-body" className={`block text-xs font-black uppercase mb-1.5 font-mono ${theme === 'claro' ? 'text-zinc-700' : 'text-zinc-400'}`}>Conteúdo Gerado do Script</label>
                  <textarea
                    id="sim-body"
                    required
                    rows={8}
                    placeholder="Selecione o lead e o roteiro acima para processar as variáveis..."
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-xs text-white focus:bg-zinc-900 focus:outline-none font-mono"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!selectedLeadId || !customBody}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl uppercase tracking-widest border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all cursor-pointer font-mono"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span>
                      {dispatchChannel === 'whatsapp' && 'Disparar WhatsApp API'}
                      {dispatchChannel === 'email' && 'Disparar Email Nativo'}
                      {dispatchChannel === 'instagram' && 'Abrir Direct Instagram'}
                      {dispatchChannel === 'facebook' && 'Abrir Direct Messenger'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    disabled={!customBody}
                    className="p-3 px-5 border-2 border-zinc-950 bg-white hover:bg-zinc-50 disabled:opacity-45 text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-600" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Visual Mobile Screen Tracker */}
            <div className="lg:col-span-5 bg-zinc-950 border-4 border-zinc-950 rounded-2xl overflow-hidden self-start shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
              <div className="bg-zinc-900 p-3.5 border-b-2 border-zinc-800 flex items-center justify-between select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-300 font-black flex items-center gap-1">
                  PREVIEW {dispatchChannel.toUpperCase()}
                </span>
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
              </div>

              <div className="p-4.5 space-y-4 text-zinc-100 bg-zinc-950 min-h-[300px]">
                <div className="space-y-2 text-xs pb-3.5 border-b border-zinc-800">
                  {dispatchChannel === 'email' && (
                    <>
                      <div className="flex gap-2"><span className="text-zinc-500 font-bold w-12 text-right font-mono">Para:</span><span className="text-white font-extrabold truncate">{selectedLeadId ? leads.find(l => l.id === selectedLeadId)?.email : '(Selecione Destinatário)'}</span></div>
                      <div className="flex gap-2"><span className="text-zinc-500 font-bold w-12 text-right font-mono">Assunto:</span><span className="text-white font-black truncate">{customSubject || '(Preenchido automaticamente)'}</span></div>
                    </>
                  )}
                  {dispatchChannel === 'whatsapp' && (
                    <div className="flex gap-2"><span className="text-zinc-500 font-bold w-12 text-right font-mono">Fone:</span><span className="text-white font-extrabold">{selectedLeadId ? leads.find(l => l.id === selectedLeadId)?.phone : '(Selecione Destinatário)'}</span></div>
                  )}
                  {(dispatchChannel === 'instagram' || dispatchChannel === 'facebook') && (
                    <div className="flex gap-2"><span className="text-zinc-500 font-bold w-12 text-right font-mono">User:</span><span className="text-white font-extrabold">{socialHandle ? '@' + socialHandle.replace('@','') : '(Direto na Inbox de Contatos)'}</span></div>
                  )}
                </div>

                <div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed min-h-[180px]">
                  {customBody || (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-600 space-y-2 select-none">
                      <MessageSquare className="w-9 h-9 opacity-40 text-indigo-500 animate-bounce" />
                      <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-wide">Aguardando dados cadastrais...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER HISTORY LOGS TAB */}
      {activeTab === 'logs' && (
        <div id="email-logs-tab-pane" className="space-y-4 animate-fadeIn">
          <div className={cardBackground + " p-5 flex items-center justify-between"}>
            <div>
              <h2 className="text-md font-black uppercase tracking-tight">Registro de Transmissões</h2>
              <p className="text-xs subtitleTextColor font-medium font-sans">Histórico e auditoria de scripts de abordagens disparadas em tempo real.</p>
            </div>
            <div className="text-xs bg-zinc-950 text-white border border-zinc-850 px-3 py-2 rounded-xl flex items-center gap-1.5 font-mono font-black">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Canais de Transmissão Ativos</span>
            </div>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="p-16 text-center bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-zinc-500 font-mono font-bold uppercase">
                Nenhum disparo de roteiro ou script registrado.
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className={cardBackground + " flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-5"}
                  id={`email-log-${log.id}`}
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-tight">{log.leadName}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[9px] uppercase tracking-wide font-black border border-zinc-800 bg-amber-950/40 text-amber-500 px-2 py-0.5 rounded font-mono">
                        {log.templateName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{log.sentAt}</span>
                    </div>
                    <div className="text-xs text-zinc-300 font-bold flex items-center gap-1.5 truncate">
                      <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{log.subject}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <span className="text-[10px] bg-emerald-950/40 text-emerald-400 font-black tracking-widest border border-emerald-900/40 px-3 py-1 rounded-full uppercase font-mono text-[9px]">
                      ✓ ENVIADO {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
