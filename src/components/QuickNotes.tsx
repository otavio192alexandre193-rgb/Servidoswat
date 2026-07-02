
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  UserPlus, 
  Calendar, 
  Link as LinkIcon, 
  History, 
  Search,
  StickyNote,
  ExternalLink,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { QuickNote, Lead, Appointment, FollowUpUpdate } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface QuickNotesProps {
  isOpen: boolean;
  onClose: () => void;
  notes: QuickNote[];
  onAddNote: (note: QuickNote) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (note: QuickNote) => void;
  leads: Lead[];
  appointments: Appointment[];
  followUps: FollowUpUpdate[];
  onOpenLeadModal: (initialData?: Partial<Lead>) => void;
  onOpenAppointmentModal: (initialData?: Partial<Appointment>) => void;
  onLinkToLead: (noteId: string, leadId: string) => void;
  triggerFeedback: (type: 'success' | 'click' | 'error' | 'alarm', settings: any) => void;
  accSettings: any;
}

const QuickNotes: React.FC<QuickNotesProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  leads,
  appointments,
  followUps,
  onOpenLeadModal,
  onOpenAppointmentModal,
  onLinkToLead,
  triggerFeedback,
  accSettings
}) => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => 
        (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         n.content.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filter === 'all' || 
         (filter === 'linked' && (n.linkedLeadId || n.linkedAppointmentId || n.linkedFollowUpId)) ||
         (filter === 'unlinked' && !(n.linkedLeadId || n.linkedAppointmentId || n.linkedFollowUpId)))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, searchTerm, filter]);

  const handleAdd = () => {
    if (!newNoteContent.trim()) return;
    
    const newNote: QuickNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNoteTitle.trim() || 'Sem título',
      content: newNoteContent,
      createdAt: new Date().toISOString(),
    };
    
    onAddNote(newNote);
    setNewNoteContent('');
    setNewNoteTitle('');
    triggerFeedback('success', accSettings);
  };

  const handleConvertToLead = (note: QuickNote) => {
    onOpenLeadModal({
      notes: note.content,
      name: note.title !== 'Sem título' ? note.title : '',
    });
    triggerFeedback('click', accSettings);
  };

  const handleSchedule = (note: QuickNote) => {
    onOpenAppointmentModal({
      description: note.content,
      title: note.title !== 'Sem título' ? note.title : 'Tarefa de Nota',
    });
    triggerFeedback('click', accSettings);
  };

  const [isLinkingLead, setIsLinkingLead] = useState(false);
  const [selectedLeadIdToLink, setSelectedLeadIdToLink] = useState('');

  const filteredLeads = useMemo(() => {
    return leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
  }, [leads, searchTerm]);

  const handleLinkNote = (leadId: string) => {
    const currentNote = notes.find(n => n.title === newNoteTitle && n.content === newNoteContent);
    if (currentNote) {
      const updatedNote = { ...currentNote, linkedLeadId: leadId };
      onUpdateNote(updatedNote);
      setIsLinkingLead(false);
      triggerFeedback('success', accSettings);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-zinc-100 border-4 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden rounded-3xl"
      >
        {/* HEADER */}
        <div className="bg-zinc-900 p-6 flex items-center justify-between border-b-4 border-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl">
              <StickyNote className="w-6 h-6 text-zinc-900" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Bloco de Notas Rápido</h2>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Histórico e ações diretas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white transition-all rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR: LIST */}
          <div className="w-1/3 border-r-4 border-zinc-950 flex flex-col bg-zinc-200">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Pesquisar notas..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border-2 border-zinc-950 rounded-xl font-bold text-sm focus:ring-2 ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="flex gap-2">
                {(['all', 'linked', 'unlinked'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 border-zinc-950 rounded-lg transition-all ${
                      filter === f ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]' : 'bg-white text-zinc-500'
                    }`}
                  >
                    {f === 'all' ? 'Tudo' : f === 'linked' ? 'Vinculados' : 'Soltos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => {
                    setNewNoteTitle(note.title);
                    setNewNoteContent(note.content);
                    triggerFeedback('click', accSettings);
                  }}
                  className="w-full text-left p-4 bg-white border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {note.linkedLeadId && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <UserPlus className="w-2.5 h-2.5" />
                          {leads.find(l => l.id === note.linkedLeadId)?.name || 'Lead'}
                        </span>
                      )}
                      {(note.linkedAppointmentId || note.linkedFollowUpId) && (
                        <LinkIcon className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-black text-zinc-900 text-sm mb-1 truncate">{note.title}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-tight">{note.content}</p>
                </button>
              ))}
              
              {filteredNotes.length === 0 && (
                <div className="text-center py-12">
                  <StickyNote className="w-12 h-12 text-zinc-300 mx-auto mb-2 opacity-20" />
                  <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Nenhuma nota encontrada</p>
                </div>
              )}
            </div>
          </div>

          {/* MAIN CONTENT: EDITOR & ACTIONS */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="Título da nota..."
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  className="w-full text-3xl font-black text-zinc-900 placeholder:text-zinc-300 border-none outline-none focus:ring-0"
                />
                <textarea 
                  placeholder="Comece a escrever algo importante..."
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  className="w-full h-64 text-lg font-medium text-zinc-700 placeholder:text-zinc-300 border-none outline-none focus:ring-0 resize-none leading-relaxed"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const currentNote = notes.find(n => n.title === newNoteTitle && n.content === newNoteContent);
                    if (currentNote) {
                      handleConvertToLead(currentNote);
                    } else {
                      // Create temp note to convert
                      handleConvertToLead({ id: 'temp', title: newNoteTitle, content: newNoteContent, createdAt: '' });
                    }
                  }}
                  className="p-4 bg-emerald-500 border-4 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3 group"
                >
                  <UserPlus className="w-6 h-6 text-zinc-950" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-zinc-950/60 uppercase tracking-widest leading-none">Ação rápida</p>
                    <p className="text-sm font-black text-zinc-950 uppercase tracking-tighter">Criar novo Lead</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const currentNote = notes.find(n => n.title === newNoteTitle && n.content === newNoteContent);
                    if (currentNote) {
                      handleSchedule(currentNote);
                    } else {
                      handleSchedule({ id: 'temp', title: newNoteTitle, content: newNoteContent, createdAt: '' });
                    }
                  }}
                  className="p-4 bg-indigo-500 border-4 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3 group"
                >
                  <Calendar className="w-6 h-6 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">Ação rápida</p>
                    <p className="text-sm font-black text-white uppercase tracking-tighter">Agendar no Calendário</p>
                  </div>
                </button>
              </div>

              {/* LINKING SECTION */}
              <div className="p-6 bg-zinc-50 border-4 border-dashed border-zinc-200 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-zinc-400 uppercase text-xs tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Vincular a um registro existente
                  </h4>
                  {notes.find(n => n.title === newNoteTitle && n.content === newNoteContent)?.linkedLeadId && (
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Check className="w-3 h-3" />
                      Vinculado a Lead
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {!isLinkingLead ? (
                    <>
                      <button 
                        onClick={() => setIsLinkingLead(true)}
                        className="px-4 py-2 bg-white border-2 border-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                      >
                        Vincular a Lead
                      </button>
                      <button className="px-4 py-2 bg-white border-2 border-zinc-200 text-zinc-300 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed">
                        Vincular a Follow-up
                      </button>
                    </>
                  ) : (
                    <div className="w-full space-y-2">
                      <div className="flex gap-2">
                        <select 
                          value={selectedLeadIdToLink}
                          onChange={e => setSelectedLeadIdToLink(e.target.value)}
                          className="flex-1 bg-white border-2 border-zinc-950 rounded-xl px-4 py-2 text-sm font-bold"
                        >
                          <option value="">Selecione um Lead...</option>
                          {leads.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleLinkNote(selectedLeadIdToLink)}
                          disabled={!selectedLeadIdToLink}
                          className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setIsLinkingLead(false)}
                          className="px-4 py-2 bg-zinc-200 text-zinc-500 rounded-xl text-xs font-black uppercase tracking-widest"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 bg-zinc-50 border-t-4 border-zinc-950 flex items-center justify-between">
              <button
                onClick={() => {
                  const currentNote = notes.find(n => n.title === newNoteTitle && n.content === newNoteContent);
                  if (currentNote) {
                    onDeleteNote(currentNote.id);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                    triggerFeedback('error', accSettings);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Nota
              </button>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setNewNoteTitle('');
                    setNewNoteContent('');
                    triggerFeedback('click', accSettings);
                  }}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none"
                >
                  Limpar Editor
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newNoteContent.trim()}
                  className="px-8 py-3 bg-yellow-400 disabled:opacity-50 text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 active:shadow-none transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Salvar Nota no Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickNotes;
