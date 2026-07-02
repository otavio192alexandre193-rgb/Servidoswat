import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ClipboardList, Calendar, AlignLeft, CheckSquare, Trash2, Edit2, CheckCircle2, ChevronRight, Users, ArrowRight, ArrowLeft,
  ChevronDown, ChevronUp, FileText, User, MapPin, Sparkles, Plus, AlertCircle, Award, CheckCircle, ShieldAlert, Clock
} from 'lucide-react';
import { OperationalOS, OperationalFlow, Lead, Appointment } from '../types';
import { getKanbanColumns } from '../utils/kanban';

interface OSModalProps {
  isOpen: boolean;
  onClose: () => void;
  os: OperationalOS | null;
  onSave: (os: Partial<OperationalOS>) => void;
  onDelete?: (id: string) => void;
  leads?: Lead[];
  onUpdateLeadStage?: (leadId: string, direction: 'next' | 'prev') => void;
  onRemoveLeadFromOS?: (leadId: string) => void;
  onUpdateLeadChecklist?: (leadId: string, checklist: Record<string, boolean>) => void;
  onUpdateLead?: (leadId: string, fields: Partial<Lead>) => void;
  appointments?: Appointment[];
  onAddAppointment?: (app: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
}

export default function OSModal({ 
  isOpen, 
  onClose, 
  os, 
  onSave, 
  onDelete,
  leads = [],
  onUpdateLeadStage,
  onRemoveLeadFromOS,
  onUpdateLeadChecklist,
  onUpdateLead,
  appointments = [],
  onAddAppointment,
  onDeleteAppointment
}: OSModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [actionPlan, setActionPlan] = useState('');
  const [toolUsed, setToolUsed] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [stageId, setStageId] = useState('');
  const [stageIds, setStageIds] = useState<string[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Expanded client profile & metrics states
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [activeLeadTab, setActiveLeadTab] = useState<'ficha' | 'documentos' | 'compatibilidade' | 'agenda' | 'progresso'>('ficha');
  
  // New appointment states
  const [newApptTitle, setNewApptTitle] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('');
  const [newApptType, setNewApptType] = useState<'reuniao' | 'telefone' | 'proposta' | 'whatsapp' | 'visita' | 'presencial' | 'outro'>('reuniao');
  const [newApptDesc, setNewApptDesc] = useState('');
  
  const stages = getKanbanColumns('etapas');

  const availableActions = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
    { id: 'ligacao', label: 'Ligação', icon: '📞' },
    { id: 'agendamento', label: 'Agendamento', icon: '📅' },
    { id: 'reuniao', label: 'Reunião', icon: '🤝' },
    { id: 'visita', label: 'Visita', icon: '🏠' },
  ];

  useEffect(() => {
    if (!isOpen || !hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, hasChanges]);

  useEffect(() => {
    setHasChanges(false);
    if (os) {
      setTitle(os.title || '');
      setSubtitle(os.subtitle || '');
      const parseDateSafe = (dStr: string) => {
        try {
          if (dStr.includes('/')) {
            // Assume DD/MM/YYYY
            const parts = dStr.split('/');
            if (parts.length === 3) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).toISOString().split('T')[0];
            }
          }
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          return '';
        } catch {
          return '';
        }
      };
      
      setStartDate(os.date ? parseDateSafe(os.date) : '');
      setEndDate(os.endDate ? parseDateSafe(os.endDate) : '');
      setActions(os.actions || []);
      setActionPlan(os.actionPlan || '');
      setToolUsed(os.toolUsed || '');
      setExpectedResult(os.expectedResult || '');
      setNextAction(os.nextAction || '');
      setStageId(os.stageId || '');
      setStageIds(os.stageIds || (os.stageId ? [os.stageId] : []));
      setIsEditing(false); // Default to view mode if editing existing
      setSelectedLeads([]);
    } else {
      // New OS
      setTitle('');
      setSubtitle('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setActions([]);
      setActionPlan('');
      setToolUsed('');
      setExpectedResult('');
      setNextAction('');
      setStageId('');
      setStageIds([]);
      setIsEditing(true);
      setSelectedLeads([]);
    }
  }, [os, isOpen]);

  const handleSave = () => {
    setHasChanges(false);
    onSave({
      title,
      subtitle,
      date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      actions,
      actionPlan,
      toolUsed,
      expectedResult,
      nextAction,
      stageId: stageIds[0] || stageId,
      stageIds,
    });
    setIsEditing(false);
    if (!os) onClose(); // close if it was a new creation
  };

  const toggleAction = (actionId: string) => {
    if (!isEditing) return;
    setHasChanges(true);
    setActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(a => a !== actionId)
        : [...prev, actionId]
    );
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkAction = (action: 'next' | 'prev' | 'remove') => {
    selectedLeads.forEach(leadId => {
      if (action === 'remove' && onRemoveLeadFromOS) {
        onRemoveLeadFromOS(leadId);
      } else if (onUpdateLeadStage) {
        onUpdateLeadStage(leadId, action as 'next' | 'prev');
      }
    });
    setSelectedLeads([]);
  };

  const handleDocChecklistChange = (leadId: string, docKey: string, checked: boolean, currentChecklist: any) => {
    if (onUpdateLead) {
      const updated = { ...(currentChecklist || {}), [docKey]: checked };
      onUpdateLead(leadId, { documentsChecklist: updated });
    } else if (onUpdateLeadChecklist) {
      onUpdateLeadChecklist(leadId, { [docKey]: checked });
    }
  };

  const handleSaveAppointmentForLead = (leadId: string, leadName: string) => {
    if (!newApptTitle.trim() || !newApptDate || !newApptTime) return;
    if (onAddAppointment) {
      onAddAppointment({
        id: `appt_${Date.now()}`,
        leadId,
        leadName,
        title: newApptTitle,
        date: newApptDate,
        time: newApptTime,
        description: newApptDesc,
        status: 'agendado',
        type: newApptType
      });
      // Reset form fields
      setNewApptTitle('');
      setNewApptDate('');
      setNewApptTime('');
      setNewApptDesc('');
      setNewApptType('reuniao');
    }
  };

  if (!isOpen) return null;

  const osLeads = leads.filter(l => os?.leadIds?.includes(l.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-3xl bg-white border-4 border-zinc-950 rounded-[40px] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-zinc-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center border-2 border-zinc-800 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight">
                  {os ? (isEditing ? 'Editar Ordem de Serviço' : os.title) : 'Nova Ordem de Serviço'}
                </h2>
                {os && !isEditing && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {os.subtitle && <p className="w-full text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">{os.subtitle}</p>}
                    {((os.stageIds && os.stageIds.length > 0) ? os.stageIds : (os.stageId ? [os.stageId] : [])).map(sid => (
                      <div key={sid} className="flex items-center gap-1 text-[10px] bg-indigo-950/30 text-indigo-300 w-fit px-2 py-0.5 rounded font-bold uppercase border border-indigo-500/30">
                        <ChevronRight className="w-3 h-3" />
                        Etapa: {stages.find(s => s.id === sid)?.label || sid}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {os && !isEditing && (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    title="Editar OS"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(os.id)}
                      className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      title="Excluir OS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors ml-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Form Area */}
            {isEditing ? (
              <div className="space-y-4" onChange={() => setHasChanges(true)}>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 mb-1">
                    <ClipboardList className="w-3 h-3" /> Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    placeholder="Nome da OS..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 mb-1">
                    <AlignLeft className="w-3 h-3" /> Subtítulo / Descrição
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    placeholder="Breve descrição..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" /> Data Início
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" /> Data Término
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 space-y-4">
                  <h4 className="text-xs font-black uppercase text-indigo-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Princípio Operacional
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1 mb-1">
                        O que fazer? (Ação)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Qualificar lead e enviar tabela"
                        value={actionPlan}
                        onChange={(e) => setActionPlan(e.target.value)}
                        className="w-full bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1 mb-1">
                        Como fazer? (Ferramenta)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: WhatsApp + PDF Tabela"
                        value={toolUsed}
                        onChange={(e) => setToolUsed(e.target.value)}
                        className="w-full bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1 mb-1">
                        Qual o objetivo? (Resultado)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Agendar visita"
                        value={expectedResult}
                        onChange={(e) => setExpectedResult(e.target.value)}
                        className="w-full bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1 mb-1">
                        Próxima Ação? (Continuidade)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Mover para estágio 'Visita'"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        className="w-full bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 mb-2">
                    <CheckSquare className="w-3 h-3" /> Ações da OS
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableActions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => toggleAction(action.id)}
                        className={`px-3 py-2 rounded-xl border-2 text-xs font-black uppercase flex items-center gap-2 transition-all ${
                          actions.includes(action.id)
                            ? 'bg-indigo-100 border-indigo-600 text-indigo-900 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300'
                        }`}
                      >
                        <span>{action.icon}</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1 mb-2">
                    <ChevronRight className="w-3 h-3" /> Etapas Ativas nesta O.S. (Selecione uma ou mais)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stages.map(st => {
                      const isSelected = stageIds.includes(st.id);
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setHasChanges(true);
                            setStageIds(prev => 
                              prev.includes(st.id)
                                ? prev.filter(id => id !== st.id)
                                : [...prev, st.id]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl border-2 text-[11px] font-bold uppercase transition-all ${
                            isSelected
                              ? 'bg-indigo-100 border-indigo-600 text-indigo-900 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300'
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl border-4 border-zinc-950 text-xs font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar Ordem de Serviço
                  </button>
                  {os && (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-2xl border-4 border-zinc-950 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-8">
                {/* Visualização de Info da OS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Início</span>
                    <div className="flex items-center gap-2 text-zinc-900 font-black text-sm">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {startDate ? (() => { const d = new Date(startDate); return isNaN(d.getTime()) ? startDate : d.toLocaleDateString(); })() : '--'}
                    </div>
                  </div>
                  <div className="bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Término</span>
                    <div className="flex items-center gap-2 text-zinc-900 font-black text-sm">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      {endDate ? (() => { const d = new Date(endDate); return isNaN(d.getTime()) ? endDate : d.toLocaleDateString(); })() : '--'}
                    </div>
                  </div>
                  
                  {/* Princípio Operacional View */}
                  {(actionPlan || toolUsed || expectedResult || nextAction) && (
                    <div className="bg-indigo-50/30 border-2 border-indigo-200 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] col-span-2 space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-2 border-b-2 border-indigo-100 pb-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        Princípio Operacional
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {actionPlan && (
                          <div>
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block mb-1">O que fazer? (Ação)</span>
                            <p className="text-sm font-medium text-zinc-800">{actionPlan}</p>
                          </div>
                        )}
                        {toolUsed && (
                          <div>
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Como fazer? (Ferramenta)</span>
                            <p className="text-sm font-medium text-zinc-800">{toolUsed}</p>
                          </div>
                        )}
                        {expectedResult && (
                          <div>
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Qual o objetivo? (Resultado)</span>
                            <p className="text-sm font-medium text-zinc-800">{expectedResult}</p>
                          </div>
                        )}
                        {nextAction && (
                          <div>
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Próxima Ação? (Continuidade)</span>
                            <p className="text-sm font-medium text-zinc-800">{nextAction}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] col-span-2">
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Ações Mapeadas</span>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {actions.length > 0 ? actions.map(actId => {
                        const act = availableActions.find(a => a.id === actId);
                        return act ? (
                          <span key={actId} className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-bold uppercase border border-indigo-200">
                            {act.icon} {act.label}
                          </span>
                        ) : null;
                      }) : <span className="text-xs text-zinc-400 font-bold italic">Nenhuma ação vinculada.</span>}
                    </div>
                  </div>
                </div>

                {/* Leads Area */}
                {os && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black uppercase text-zinc-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          Leads Vinculados ({osLeads.length})
                        </h3>
                        {osLeads.length > 0 && (
                          <button
                            onClick={() => {
                              const allSelected = osLeads.every(l => selectedLeads.includes(l.id));
                              if (allSelected) {
                                setSelectedLeads(prev => prev.filter(id => !osLeads.some(ol => ol.id === id)));
                              } else {
                                const otherSelected = selectedLeads.filter(id => !osLeads.some(ol => ol.id === id));
                                setSelectedLeads([...otherSelected, ...osLeads.map(l => l.id)]);
                              }
                            }}
                            className="text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors border-2 border-indigo-200 hover:border-indigo-400 bg-white px-2 py-0.5 rounded-lg shadow-sm"
                          >
                            {osLeads.every(l => selectedLeads.includes(l.id)) ? "Desmarcar Todos" : "Selecionar Todos"}
                          </button>
                        )}
                      </div>
                      {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 p-1.5 rounded-xl animate-in fade-in zoom-in">
                          <span className="text-[10px] font-black uppercase text-indigo-800 px-2">{selectedLeads.length} selecionados</span>
                          <button onClick={() => handleBulkAction('prev')} className="p-1.5 bg-white text-zinc-700 hover:text-indigo-600 rounded-lg shadow-sm border border-zinc-200" title="Retornar Etapa">
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleBulkAction('next')} className="p-1.5 bg-white text-zinc-700 hover:text-emerald-600 rounded-lg shadow-sm border border-zinc-200" title="Avançar Etapa">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-4 bg-indigo-200 mx-1"></div>
                          <button onClick={() => handleBulkAction('remove')} className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg shadow-sm border border-rose-200" title="Excluir da OS">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-zinc-50 border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {osLeads.length === 0 ? (
                        <div className="p-8 text-center">
                          <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Nenhum lead nesta Ordem de Serviço.</p>
                        </div>
                      ) : (
                        <div className="divide-y-2 divide-zinc-950">
                          {osLeads.map(lead => {
                            const isExpanded = expandedLeadId === lead.id;
                            const hasFgts3Years = !!lead.checklist?.['fgts_3anos'];
                            const incomeVal = Number(lead.familyGrossIncome || lead.familyIncome) || 0;
                            const ownsProp = lead.possuiImovel === 'Sim' || lead.ownsProperty === 'sim';
                            let bracket = 'SBPE (Livre)';
                            if (!ownsProp && incomeVal > 0) {
                              if (incomeVal <= 2640) bracket = 'Faixa 1 (MCMV)';
                              else if (incomeVal <= 4400) bracket = 'Faixa 2 (MCMV)';
                              else if (incomeVal <= 8000) bracket = 'Faixa 3 (MCMV)';
                            } else if (incomeVal > 0 && incomeVal <= 8000) {
                              bracket = 'MCMV (s/ subsídio)';
                            }

                            // Dynamic compatibility score formula
                            const score = (() => {
                              let s = 0;
                              if (incomeVal > 0) s += 20;
                              if (lead.cpf || lead.cpfOrRg) s += 15;
                              if (lead.region || lead.bairroEspecifico) s += 15;
                              const docsChecked = Object.values(lead.documentsChecklist || {}).filter(Boolean).length;
                              s += Math.min(25, docsChecked * 3.5);
                              if (lead.documentsChecklist?.assessment || lead.checklist?.credito_aprovado) s += 15;
                              if (lead.suggestedUnit) s += 10;
                              return Math.min(100, Math.round(s));
                            })();

                            // Diagnostic criteria for funnel advancement
                            const diagnosticCriteria = [
                              { id: 'cpf', label: 'CPF / RG Cadastrado', met: !!(lead.cpf || lead.cpfOrRg) },
                              { id: 'income', label: 'Comprovante de Renda Validado', met: incomeVal > 0 },
                              { id: 'docs', label: 'Mínimo de 3 Documentos Entregues', met: Object.values(lead.documentsChecklist || {}).filter(Boolean).length >= 3 },
                              { id: 'simulation', label: 'Simulação / Aprovação de Crédito', met: !!(lead.documentsChecklist?.assessment || lead.checklist?.credito_aprovado) },
                              { id: 'restrictions', label: 'Nenhuma Restrição Financeira', met: lead.restricaoBacen !== 'Sim' && !lead.restrictions },
                              { id: 'agenda', label: 'Próxima Ação ou Data Mapeada', met: !!(lead.nextFollowUpDate || lead.nextAction) }
                            ];
                            const metCount = diagnosticCriteria.filter(c => c.met).length;
                            const isEligibleToAdvance = metCount >= 4;

                            // Filter appointments associated with this lead
                            const leadAppointments = (appointments || []).filter(a => a.leadId === lead.id);

                            return (
                              <div key={lead.id} className={`flex flex-col border-b border-zinc-200 last:border-0 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-indigo-50/20' : ''}`}>
                                
                                {/* Lead Card Main Row */}
                                <div className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-100/50 cursor-pointer transition-colors" onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}>
                                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      checked={selectedLeads.includes(lead.id)}
                                      onChange={() => toggleLeadSelection(lead.id)}
                                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-zinc-900 flex items-center gap-2">
                                      {lead.name}
                                      <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full font-bold">
                                        Score: {score}%
                                      </span>
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium truncate mt-1">
                                      <span>{lead.phone}</span>
                                      <span>•</span>
                                      <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{bracket}</span>
                                      {hasFgts3Years && <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✓ FGTS 3 Anos</span>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                    <span className="inline-block px-2 py-1 bg-zinc-200 text-zinc-700 text-[9px] font-black uppercase rounded-md border border-zinc-300">
                                      {lead.stage}
                                    </span>
                                    <button 
                                      onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                                      className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-lg border border-zinc-300 transition-colors"
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Lead Info & Metrics Portal */}
                                {isExpanded && (
                                  <div className="px-4 pb-6 pt-2 bg-white border-t border-zinc-200 animate-in fade-in slide-in-from-top-2 duration-300">
                                    
                                    {/* Tabs Header */}
                                    <div className="flex flex-wrap gap-1 border-b-2 border-zinc-200 pb-2 mb-4">
                                      {[
                                        { id: 'ficha', label: '📊 Ficha Cadastral', icon: User },
                                        { id: 'documentos', label: '🗂️ Documentos', icon: FileText },
                                        { id: 'compatibilidade', label: '🎯 Compatibilidade', icon: Sparkles },
                                        { id: 'agenda', label: '📅 Agenda & Calendário', icon: Calendar },
                                        { id: 'progresso', label: '⚡ Diagnóstico de Avanço', icon: ShieldAlert },
                                      ].map(tab => {
                                        const Icon = tab.icon;
                                        const isActive = activeLeadTab === tab.id;
                                        return (
                                          <button
                                            key={tab.id}
                                            onClick={() => setActiveLeadTab(tab.id as any)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border-2 ${
                                              isActive 
                                                ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm' 
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100'
                                            }`}
                                          >
                                            <Icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Tab 1: Ficha Cadastral Form */}
                                    {activeLeadTab === 'ficha' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">CPF / RG</label>
                                          <input 
                                            type="text"
                                            value={lead.cpf || lead.cpfOrRg || ''}
                                            onChange={e => onUpdateLead?.(lead.id, { cpf: e.target.value, cpfOrRg: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: 000.000.000-00"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Data de Nascimento</label>
                                          <input 
                                            type="date"
                                            value={lead.birthDate || ''}
                                            onChange={e => onUpdateLead?.(lead.id, { birthDate: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Estado Civil</label>
                                          <select 
                                            value={lead.maritalStatus || 'Solteiro'}
                                            onChange={e => onUpdateLead?.(lead.id, { maritalStatus: e.target.value as any })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                          >
                                            <option value="Solteiro">Solteiro(a)</option>
                                            <option value="Casado">Casado(a)</option>
                                            <option value="Uniao estavel">União Estável</option>
                                            <option value="Divorciado">Divorciado(a)</option>
                                            <option value="Viuvo">Viúvo(a)</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Profissão</label>
                                          <input 
                                            type="text"
                                            value={lead.profession || ''}
                                            onChange={e => onUpdateLead?.(lead.id, { profession: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: Analista Financeiro"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Renda Bruta Familiar</label>
                                          <input 
                                            type="number"
                                            value={lead.familyGrossIncome || lead.familyIncome || ''}
                                            onChange={e => onUpdateLead?.(lead.id, { familyGrossIncome: Number(e.target.value) || undefined, familyIncome: Number(e.target.value) || undefined })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: 5000"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Saldo FGTS</label>
                                          <input 
                                            type="number"
                                            value={lead.fgtsSaldo || ''}
                                            onChange={e => onUpdateLead?.(lead.id, { fgtsSaldo: Number(e.target.value) || undefined })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: 15000"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Possui Imóvel?</label>
                                          <select 
                                            value={lead.possuiImovel || (lead.ownsProperty === 'sim' ? 'Sim' : 'Não')}
                                            onChange={e => onUpdateLead?.(lead.id, { possuiImovel: e.target.value as any, ownsProperty: e.target.value === 'Sim' ? 'sim' : 'nao' })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                          >
                                            <option value="Não">Não</option>
                                            <option value="Sim">Sim</option>
                                            <option value="Em nome de terceiros">Em nome de terceiros</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Restrição BACEN / SPC</label>
                                          <select 
                                            value={lead.restricaoBacen || (lead.restrictions ? 'Sim' : 'Não')}
                                            onChange={e => onUpdateLead?.(lead.id, { restricaoBacen: e.target.value as any, restrictions: e.target.value === 'Sim' ? 'Possui restrições' : '' })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                          >
                                            <option value="Não">Não</option>
                                            <option value="Sim">Sim</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Dependentes</label>
                                          <input 
                                            type="number"
                                            value={lead.dependents || ''}
                                            onChange={e => onUpdateLead?.(lead.id, { dependents: Number(e.target.value) || undefined })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: 1"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Tab 2: Documentos & Checklist */}
                                    {activeLeadTab === 'documentos' && (
                                      <div className="space-y-4">
                                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                                          <span className="font-bold">Ficha de Documentação Cadastral</span>
                                          <span className="font-mono text-[10px] bg-indigo-200 px-2 py-0.5 rounded">
                                            {Object.values(lead.documentsChecklist || {}).filter(Boolean).length} / 12 concluídos
                                          </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                                          {[
                                            { key: 'photoId', label: '🪪 RG / CNH / Identidade' },
                                            { key: 'incomeProof', label: '💵 Comprovante de Renda (3 Holerites)' },
                                            { key: 'addressProof', label: '📍 Comprovante de Residência Atualizado' },
                                            { key: 'dependentCert', label: '👶 Certidão de Dependentes (Filhos)' },
                                            { key: 'marriageCert', label: '💍 Certidão de Casamento / Estável' },
                                            { key: 'irRegistry', label: '📈 Declaração de Imposto de Renda' },
                                            { key: 'registrationForm', label: '📝 Ficha Cadastral Assinada' },
                                            { key: 'assessment', label: '🏦 Simulação de Crédito Habitacional' },
                                            { key: 'simulation', label: '✓ Aprovação Caixa / Bancária' },
                                            { key: 'salesTable', label: '📊 Tabela de Vendas Ajustada' },
                                            { key: 'proposal', label: '✍️ Proposta de Compra Concluída' },
                                            { key: 'interactionReport', label: '📋 Relatório de Atendimento' },
                                          ].map(doc => {
                                            const isDocChecked = !!lead.documentsChecklist?.[doc.key as keyof typeof lead.documentsChecklist];
                                            return (
                                              <label 
                                                key={doc.key} 
                                                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                                  isDocChecked 
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                                                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                                }`}
                                              >
                                                <input 
                                                  type="checkbox"
                                                  checked={isDocChecked}
                                                  onChange={e => handleDocChecklistChange(lead.id, doc.key, e.target.checked, lead.documentsChecklist)}
                                                  className="w-4 h-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer shrink-0"
                                                />
                                                <span className="font-medium text-[11px] truncate" title={doc.label}>{doc.label}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tab 3: Compatibilidade Imobiliária */}
                                    {activeLeadTab === 'compatibilidade' && (
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        
                                        {/* Parametros de Busca */}
                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Programa Desejado</label>
                                            <select 
                                              value={lead.programaDesejado || 'Indiferente'}
                                              onChange={e => onUpdateLead?.(lead.id, { programaDesejado: e.target.value as any })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            >
                                              <option value="Minha Casa Minha Vida">Minha Casa Minha Vida</option>
                                              <option value="SBPE">SBPE (Tradicional)</option>
                                              <option value="Indiferente">Indiferente</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Metragem Desejada (m²)</label>
                                            <input 
                                              type="number"
                                              value={lead.desiredSqm || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { desiredSqm: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                              placeholder="Ex: 45"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Dormitórios</label>
                                            <input 
                                              type="number"
                                              value={lead.bedrooms || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { bedrooms: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                              placeholder="Ex: 2"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Vagas de Garagem</label>
                                            <input 
                                              type="number"
                                              value={lead.parkingSpots || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { parkingSpots: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                              placeholder="Ex: 1"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Varanda Desejada?</label>
                                            <select 
                                              value={lead.balcony || 'nao'}
                                              onChange={e => onUpdateLead?.(lead.id, { balcony: e.target.value as any })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            >
                                              <option value="nao">Não importa / Sem varanda</option>
                                              <option value="sim">Sim, faz questão</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Estação Metrô de Interesse</label>
                                            <input 
                                              type="text"
                                              value={lead.nearestStation || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { nearestStation: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                              placeholder="Ex: Metrô Carrão"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Unidade Recomendada</label>
                                            <input 
                                              type="text"
                                              value={lead.suggestedUnit || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { suggestedUnit: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold"
                                              placeholder="Ex: Apto 142 - Bloco B"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Valor do Imóvel (R$)</label>
                                            <input 
                                              type="number"
                                              value={lead.suggestedValue || lead.propertyValue || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { suggestedValue: Number(e.target.value) || undefined, propertyValue: Number(e.target.value) || undefined })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-zinc-800 focus:outline-none focus:border-indigo-500"
                                              placeholder="Ex: 275000"
                                            />
                                          </div>
                                        </div>

                                        {/* Match Score Gauge */}
                                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col items-center justify-center text-center">
                                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-2">Índice de Compatibilidade</span>
                                          
                                          <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                                            <svg className="w-full h-full transform -rotate-90">
                                              <circle cx="48" cy="48" r="40" stroke="#e4e4e7" strokeWidth="8" fill="transparent" />
                                              <circle 
                                                cx="48" 
                                                cy="48" 
                                                r="40" 
                                                stroke={score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'} 
                                                strokeWidth="8" 
                                                fill="transparent" 
                                                strokeDasharray={251.2} 
                                                strokeDashoffset={251.2 - (251.2 * score) / 100}
                                                strokeLinecap="round"
                                              />
                                            </svg>
                                            <span className="absolute text-xl font-black text-zinc-900">{score}%</span>
                                          </div>

                                          <p className="text-[10px] text-zinc-500 leading-snug font-medium">
                                            {score > 70 
                                              ? "Excelente enquadramento financeiro e cadastral." 
                                              : score > 40 
                                                ? "Moderado. Necessário obter comprovantes adicionais." 
                                                : "Baixo. Pendências críticas de documentos/renda."
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Tab 4: Agenda & Calendário */}
                                    {activeLeadTab === 'agenda' && (
                                      <div className="space-y-4">
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          
                                          {/* Compromissos e Histórico */}
                                          <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
                                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                              Agenda do Cliente ({leadAppointments.length})
                                            </h4>
                                            
                                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                              {leadAppointments.length === 0 ? (
                                                <p className="text-[10px] text-zinc-400 italic">Nenhum agendamento vinculado a este lead.</p>
                                              ) : (
                                                leadAppointments.map(appt => (
                                                  <div key={appt.id} className="bg-white p-2.5 rounded-xl border border-zinc-150 flex items-start justify-between gap-2 shadow-xs">
                                                    <div className="min-w-0">
                                                      <span className="text-[8px] bg-zinc-150 text-zinc-700 px-1.5 py-0.5 rounded font-black uppercase font-mono">
                                                        {appt.type}
                                                      </span>
                                                      <h5 className="text-xs font-black text-zinc-900 mt-1">{appt.title}</h5>
                                                      <p className="text-[9px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
                                                        <Clock className="w-3 h-3 text-zinc-400" />
                                                        {appt.date} às {appt.time}
                                                      </p>
                                                    </div>
                                                    <button 
                                                      onClick={() => onDeleteAppointment?.(appt.id)}
                                                      className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                                                      title="Excluir agendamento"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          </div>

                                          {/* Novo Agendamento Mini-Form */}
                                          <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
                                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                              Agendar Compromisso
                                            </h4>
                                            
                                            <div className="space-y-2 text-xs">
                                              <input 
                                                type="text"
                                                placeholder="Título do agendamento..."
                                                value={newApptTitle}
                                                onChange={e => setNewApptTitle(e.target.value)}
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-800 focus:outline-none"
                                              />
                                              
                                              <div className="grid grid-cols-2 gap-2">
                                                <input 
                                                  type="date"
                                                  value={newApptDate}
                                                  onChange={e => setNewApptDate(e.target.value)}
                                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-800 focus:outline-none"
                                                />
                                                <input 
                                                  type="time"
                                                  value={newApptTime}
                                                  onChange={e => setNewApptTime(e.target.value)}
                                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-800 focus:outline-none"
                                                />
                                              </div>

                                              <div className="grid grid-cols-2 gap-2">
                                                <select
                                                  value={newApptType}
                                                  onChange={e => setNewApptType(e.target.value as any)}
                                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-800 focus:outline-none"
                                                >
                                                  <option value="reuniao">Reunião</option>
                                                  <option value="visita">Visita</option>
                                                  <option value="telefone">Telefone</option>
                                                  <option value="whatsapp">WhatsApp</option>
                                                  <option value="proposta">Proposta</option>
                                                </select>
                                                <button
                                                  onClick={() => handleSaveAppointmentForLead(lead.id, lead.name)}
                                                  disabled={!newApptTitle.trim() || !newApptDate || !newApptTime}
                                                  className="bg-zinc-950 text-white text-[10px] font-black uppercase tracking-tight py-1 rounded-lg hover:bg-zinc-850 disabled:opacity-40 transition-colors"
                                                >
                                                  Salvar
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Datas de Acompanhamento no Lead */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Próximo Follow-up Mapeado</label>
                                            <input 
                                              type="date"
                                              value={lead.nextFollowUpDate || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { nextFollowUpDate: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Definição da Próxima Ação</label>
                                            <input 
                                              type="text"
                                              value={lead.nextAction || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { nextAction: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold"
                                              placeholder="Ex: Enviar simulação atualizada da CEF"
                                            />
                                          </div>
                                          <div className="sm:col-span-2">
                                            <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Anotações Gerais / Histórico do Lead</label>
                                            <textarea 
                                              value={lead.notes || ''}
                                              onChange={e => onUpdateLead?.(lead.id, { notes: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-800 focus:outline-none focus:border-indigo-500 text-xs font-medium"
                                              rows={2}
                                              placeholder="Histórico, objeções e detalhes do atendimento..."
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Tab 5: Diagnóstico de Avanço */}
                                    {activeLeadTab === 'progresso' && (
                                      <div className="space-y-4">
                                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                                          <div className="flex items-center justify-between mb-3">
                                            <div>
                                              <h4 className="text-xs font-black text-zinc-900 uppercase">Análise de Requisitos Operacionais</h4>
                                              <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Indicadores obrigatórios e sugeridos de qualificação de crédito</p>
                                            </div>
                                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                                              isEligibleToAdvance ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                              {metCount} / 6 Concluídos
                                            </span>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {diagnosticCriteria.map(crit => (
                                              <div key={crit.id} className="flex items-center gap-2 text-xs font-medium">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${crit.met ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                                                <span className={crit.met ? 'text-zinc-900' : 'text-zinc-400'}>
                                                  {crit.label}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Status and Actions Panel */}
                                        <div className="p-4 rounded-2xl border-2 border-dashed flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50 border-zinc-200">
                                          <div className="flex items-start gap-3 text-left">
                                            <div className="p-2 bg-white rounded-xl border border-zinc-200 text-zinc-800 shrink-0">
                                              {isEligibleToAdvance ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />}
                                            </div>
                                            <div>
                                              <h5 className="text-xs font-black uppercase text-zinc-900">
                                                {isEligibleToAdvance ? "Avanço Altamente Recomendado" : "Requisitos Não Preenchidos"}
                                              </h5>
                                              <p className="text-[10px] text-zinc-500 font-medium leading-normal mt-1 max-w-md">
                                                {isEligibleToAdvance 
                                                  ? "O perfil cadastral e as métricas coletadas comprovam compatibilidade com o fluxo. O lead está pronto para progredir no CRM." 
                                                  : "O lead não atinge o limite mínimo de 4 métricas validadas. Recomenda-se completar a ficha cadastral e anexar os documentos de renda."
                                                }
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end" onClick={e => e.stopPropagation()}>
                                            <button 
                                              onClick={() => onUpdateLeadStage?.(lead.id, 'prev')}
                                              className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
                                            >
                                              Retornar Etapa
                                            </button>
                                            <button 
                                              onClick={() => onUpdateLeadStage?.(lead.id, 'next')}
                                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
                                            >
                                              Avançar Lead ➔
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
