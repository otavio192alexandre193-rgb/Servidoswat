/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lead, LeadStatus } from '../types';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  Info,
  AlertTriangle,
  Edit2,
  Check,
  X,
  Trash2,
  Maximize2,
  Minimize2,
  AlignJustify,
  ArrowRightLeft,
  Sliders,
  Settings,
  Grid
} from 'lucide-react';
import { getKanbanColumns, saveKanbanColumns, KanbanColumn } from '../utils/kanban';

interface KanbanBoardProps {
  leads: Lead[];
  onMoveLead: (leadId: string, newStatus: LeadStatus) => void;
  onOpenLeadDetails: (lead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
  onOpenCreateModal: (status?: LeadStatus) => void;
}

const getDaysSinceContact = (lastContactAt?: string): number | null => {
  if (!lastContactAt) return null;
  const cleanStr = lastContactAt.slice(0, 10);
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const contactDate = new Date(year, month, day);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = todayMidnight.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const COLOR_SCHEMES: Record<string, { bgClass: string; labelClass: string; accentBorderClass: string }> = {
  blue: { bgClass: 'bg-blue-100/90', labelClass: 'text-blue-950', accentBorderClass: 'border-blue-500' },
  amber: { bgClass: 'bg-amber-100/90', labelClass: 'text-amber-950', accentBorderClass: 'border-yellow-500' },
  indigo: { bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  emerald: { bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
  red: { bgClass: 'bg-red-100/90', labelClass: 'text-red-950', accentBorderClass: 'border-rose-500' },
  pink: { bgClass: 'bg-pink-100/90', labelClass: 'text-pink-950', accentBorderClass: 'border-pink-500' },
  teal: { bgClass: 'bg-teal-100/90', labelClass: 'text-teal-950', accentBorderClass: 'border-teal-500' },
  orange: { bgClass: 'bg-orange-100/90', labelClass: 'text-orange-950', accentBorderClass: 'border-orange-500' },
  zinc: { bgClass: 'bg-zinc-100/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-500' },
};

export default function KanbanBoard({ 
  leads, 
  onMoveLead, 
  onOpenLeadDetails, 
  onOpenEditModal, 
  onOpenCreateModal 
}: KanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [activeDragCol, setActiveDragCol] = useState<string | null>(null);

  // Load columns from LocalStorage helper and put into state for dynamic rendering
  const [columns, setColumns] = useState<KanbanColumn[]>(() => getKanbanColumns());
  
  // Create / Edit aba state
  const [newAbaName, setNewAbaName] = useState('');
  const [newAbaColor, setNewAbaColor] = useState('blue');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColLabel, setEditingColLabel] = useState('');

  // Premium Zoom & Visibility parameters
  const [zoomMode, setZoomMode] = useState<'normal' | 'compact' | 'overview'>('normal');
  const [showAbaOrganizer, setShowAbaOrganizer] = useState(false);

  const handleMoveAbaForward = (idx: number) => {
    if (idx >= columns.length - 1) return;
    const newCols = [...columns];
    const temp = newCols[idx];
    newCols[idx] = newCols[idx + 1];
    newCols[idx + 1] = temp;
    setColumns(newCols);
    saveKanbanColumns(newCols);
    window.dispatchEvent(new Event('kanban-columns-updated'));
  };

  const handleMoveAbaBackward = (idx: number) => {
    if (idx <= 0) return;
    const newCols = [...columns];
    const temp = newCols[idx];
    newCols[idx] = newCols[idx - 1];
    newCols[idx - 1] = temp;
    setColumns(newCols);
    saveKanbanColumns(newCols);
    window.dispatchEvent(new Event('kanban-columns-updated'));
  };

  const handleCreateAba = () => {
    if (!newAbaName.trim()) return;
    if (columns.length >= 10) return;

    const scheme = COLOR_SCHEMES[newAbaColor] || COLOR_SCHEMES.blue;
    const newId = 'aba_' + Date.now();
    const newColumn: KanbanColumn = {
      id: newId,
      label: newAbaName.trim(),
      bgClass: scheme.bgClass,
      labelClass: scheme.labelClass,
      accentBorderClass: scheme.accentBorderClass
    };

    const updatedCols = [...columns, newColumn];
    setColumns(updatedCols);
    saveKanbanColumns(updatedCols);
    setNewAbaName('');
    
    // Force custom event or window reload triggers if other components need immediate updates
    window.dispatchEvent(new Event('kanban-columns-updated'));
  };

  const handleSaveEditAbaName = (colId: string) => {
    if (!editingColLabel.trim()) return;
    
    const updatedCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, label: editingColLabel.trim() };
      }
      return col;
    });

    setColumns(updatedCols);
    saveKanbanColumns(updatedCols);
    setEditingColId(null);
    setEditingColLabel('');
    window.dispatchEvent(new Event('kanban-columns-updated'));
  };

  const handleDeleteAba = (colId: string) => {
    // Check if there are any leads currently in this column/aba
    const hasLeads = leads.some(l => l.status === colId);
    if (hasLeads) {
      if (!window.confirm('Atenção: Esta aba possui leads associados. Ao excluí-la, você ainda precisará mover os leads existentes. Deseja prosseguir?')) {
        return;
      }
    }

    const updatedCols = columns.filter(col => col.id !== colId);
    setColumns(updatedCols);
    saveKanbanColumns(updatedCols);
    window.dispatchEvent(new Event('kanban-columns-updated'));
  };

  // Map origins for filters
  const origins = Array.from(new Set(leads.map(l => l.origin)));

  // Filtered leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrigin = originFilter === '' || lead.origin === originFilter;
    return matchesSearch && matchesOrigin;
  });

  // Calculate sum of values for a column
  const getColumnTotal = (status: string) => {
    return filteredLeads
      .filter(l => l.status === status)
      .reduce((sum, l) => sum + l.value, 0);
  };

  return (
    <div className="space-y-8">
      {/* Abas Dynamic Controller Toolbar */}
      <div className="bg-white p-5 rounded-2xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-md font-sans font-black uppercase text-zinc-950 flex items-center gap-2">
              <span className="bg-indigo-600 text-white rounded px-2 py-0.5 tracking-tighter uppercase font-mono italic text-xs">SWAT</span>
              Painel de Abas ({columns.length}/10)
            </h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">
              Personalize o fluxo de atendimento. Altere os nomes das abas ou seccione seus contatos em até 10 fases sob medida.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {columns.length < 10 ? (
              <div className="flex items-center gap-2 bg-zinc-50 p-1.5 border-2 border-zinc-950 rounded-xl w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Nome do status..."
                  value={newAbaName}
                  onChange={(e) => setNewAbaName(e.target.value)}
                  className="bg-white border-2 border-zinc-950 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none font-bold shrink-0 placeholder-zinc-400 w-32"
                />
                <select
                  value={newAbaColor}
                  onChange={(e) => setNewAbaColor(e.target.value)}
                  className="bg-white border-2 border-zinc-950 text-[11px] px-1.5 py-1.5 rounded-lg font-black uppercase focus:outline-none shrink-0"
                >
                  <option value="blue">🔵 Azul</option>
                  <option value="amber">🟡 Amarelo</option>
                  <option value="indigo">🟣 Roxo</option>
                  <option value="emerald">🟢 Verde</option>
                  <option value="red">🔴 Vermelho</option>
                  <option value="pink">🌸 Rosa</option>
                  <option value="teal">🔷 Ciano</option>
                  <option value="orange">🟠 Laranja</option>
                  <option value="zinc">⚙️ Cinza</option>
                </select>
                <button
                  onClick={handleCreateAba}
                  className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase border border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>CRIAR</span>
                </button>
              </div>
            ) : (
              <span className="text-xs bg-red-100 border-2 border-red-650 text-red-950 px-3 py-1.5 rounded-xl font-mono font-black uppercase animate-pulse">
                ⚠️ Limite de 10 abas atingido !
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Filter Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
        <div className="flex flex-col md:flex-row flex-1 w-full gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              id="kanban-search"
              placeholder="Buscar por nome, e-mail, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold placeholder-zinc-500"
            />
          </div>
          
          <div className="flex gap-2 shrink-0">
            <select
              id="kanban-filter-origin"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-zinc-50 border-2 border-zinc-950 rounded-xl px-3 py-2 text-xs text-zinc-800 font-extrabold focus:outline-none focus:bg-white"
            >
              <option value="">Origem (Todas)</option>
              {origins.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>

            {/* Premium Zoom Selector Controls */}
            <div className="flex bg-zinc-150 border-2 border-zinc-950 rounded-xl p-0.5 font-mono select-none">
              {(['normal', 'compact', 'overview'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setZoomMode(mode)}
                  className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                    zoomMode === mode 
                      ? 'bg-zinc-950 text-indigo-400' 
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                  title={
                    mode === 'normal' 
                      ? 'Zoom normal' 
                      : mode === 'compact' 
                        ? 'Visualização compacta para mais colunas' 
                        : 'Overview ajustado (Enxergar todas as fases na tela)'
                  }
                >
                  {mode === 'normal' && 'Normal'}
                  {mode === 'compact' && 'Compacto'}
                  {mode === 'overview' && 'Zoom Total'}
                </button>
              ))}
            </div>

            {/* Abas lateral reordering pull drawer trigger */}
            <button
              onClick={() => setShowAbaOrganizer(!showAbaOrganizer)}
              className={`flex items-center gap-1.5 px-3 py-2 border-2 rounded-xl text-xs font-black uppercase transition-all ${
                showAbaOrganizer 
                  ? 'bg-zinc-950 text-indigo-400 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
              title="Organizador Lateral de Abas"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 stroke-[3px]" />
              <span className="font-sans">Organizar Abas</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => onOpenCreateModal(columns.length > 0 ? columns[0].id : 'novo')}
          className="w-full xl:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-3 rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>NOVO LEAD</span>
        </button>
      </div>

      {/* Grid containing Columns and Sidebar Drawer */}
      <div className="relative flex flex-col xl:flex-row gap-5 items-start">
        
        {/* Kanban Columns Grid Scroll Container */}
        <div className="flex-1 w-full overflow-hidden">
          <div 
            id="kanban-columns-grid" 
            className={`grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-all duration-300 ${
              zoomMode === 'overview' 
                ? 'scale-[0.80] xl:scale-[0.74] origin-top-left w-[135%] h-[125%]' 
                : ''
            }`}
          >
            {columns.map((col, idx) => {
              const colLeads = filteredLeads.filter(l => l.status === col.id);
              const totalValue = getColumnTotal(col.id);
              const isOverThisCol = activeDragCol === col.id;
              const isEditing = editingColId === col.id;

          return (
            <div 
              key={col.id} 
              onDragOver={(e) => {
                e.preventDefault();
                if (activeDragCol !== col.id) {
                  setActiveDragCol(col.id);
                }
              }}
              onDragLeave={() => {
                setActiveDragCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData('text/plain');
                if (leadId) {
                  onMoveLead(leadId, col.id);
                }
                setActiveDragCol(null);
              }}
              className={`bg-white rounded-2xl border-4 border-zinc-950 shrink-0 select-none min-h-[555px] flex flex-col transition-all duration-200 ${
                zoomMode === 'compact' ? 'w-full xl:w-[218px]' : 'w-full xl:w-72'
              } ${
                isOverThisCol ? 'ring-4 ring-indigo-600 bg-indigo-50/20 translate-y-[-2px]' : ''
              }`}
              style={{ boxShadow: '4px_4px_0px_0px_rgba(24,24,27,1)' }}
            >
              {/* Column Header */}
              <div className={`border-b-4 border-zinc-950 flex flex-col gap-1 ${
                zoomMode === 'compact' ? 'p-3' : 'p-4'
              } ${col.bgClass || 'bg-zinc-100'}`}>
                <div className="flex items-center justify-between gap-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        value={editingColLabel}
                        onChange={(e) => setEditingColLabel(e.target.value)}
                        className="bg-white border-2 border-zinc-950 rounded p-1 text-xs font-black text-zinc-950 w-full outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEditAbaName(col.id)}
                        className="p-1 bg-emerald-600 text-white rounded border border-zinc-950"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { setEditingColId(null); setEditingColLabel(''); }}
                        className="p-1 bg-red-500 text-white rounded border border-zinc-950"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/header w-full justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <h3 className={`font-sans font-black uppercase italic tracking-tight ${
                          zoomMode === 'compact' ? 'text-[10px]' : 'text-xs'
                        } ${col.labelClass || 'text-zinc-900'} truncate mr-1`}>{col.label}</h3>
                        <button
                          onClick={() => {
                            setEditingColId(col.id);
                            setEditingColLabel(col.label);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-indigo-600 hover:bg-white/60 transition"
                          title="Editar nome"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {columns.length > 1 && (
                          <button
                            onClick={() => handleDeleteAba(col.id)}
                            className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Excluir aba"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-xs bg-zinc-900 text-white border border-zinc-950 px-2 py-0.5 rounded font-mono font-black shadow-[1.1px_1.1px_0px_0px_rgba(0,0,0,0.5)] leading-none">
                          {colLeads.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-700 mt-2 font-mono font-black">
                  <span>VALOR:</span>
                  <motion.span 
                    key={`${col.id}-${totalValue}-${colLeads.length}`}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="font-mono bg-zinc-950 text-emerald-400 px-1.5 py-0.5 rounded border border-zinc-800 text-[9px] inline-block"
                  >
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </motion.span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div 
                className={`flex-1 overflow-y-auto max-h-[60vh] xl:max-h-[65vh] transition-colors duration-200 ${
                  zoomMode === 'compact' ? 'p-2.5 space-y-3' : 'p-3.5 space-y-4'
                } ${
                  isOverThisCol ? 'bg-indigo-50/50' : 'bg-zinc-50'
                }`}
                id={`kanban-column-${col.id}`}
              >
                {colLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center select-none text-zinc-400">
                    <Building2 className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">Vazio</p>
                  </div>
                ) : (
                  colLeads.map(lead => {
                    const daysSinceContact = getDaysSinceContact(lead.lastContactAt);
                    const isOverdue = daysSinceContact !== null && daysSinceContact > 7;

                    return (
                      <div
                        id={`lead-card-${lead.id}`}
                        key={lead.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', lead.id);
                          e.currentTarget.classList.add('opacity-40');
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove('opacity-40');
                        }}
                        className={`group bg-white hover:bg-zinc-100/50 border-2 border-zinc-950 rounded-xl transition-all relative ${
                          zoomMode === 'compact' ? 'p-2.5 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]' : 'p-4 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                        } hover:translate-y-[-1px] cursor-grab active:cursor-grabbing`}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Title and details actions */}
                          <div className="flex items-start justify-between gap-1">
                            <button
                              onClick={() => onOpenLeadDetails(lead)}
                              className={`text-zinc-900 hover:text-indigo-600 font-sans font-black text-left transition-colors truncate flex-1 uppercase tracking-tight ${
                                zoomMode === 'compact' ? 'text-[11px]' : 'text-xs'
                              }`}
                            >
                              {lead.name}
                            </button>
                            {isOverdue && (
                              <span 
                                className="flex items-center gap-1 text-[8px] bg-red-100 border-2 border-red-650 text-red-950 rounded px-1.5 py-0.5 font-mono font-black animate-pulse select-none shrink-0"
                                title={`Último contato foi há ${daysSinceContact} dias!`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-red-650 shrink-0" />
                                <span>{daysSinceContact}d</span>
                              </span>
                            )}
                          </div>

                          {/* Company Detail */}
                          {lead.company && (
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-650 font-semibold">
                              <Building2 className="w-3 h-3 shrink-0 text-zinc-450" />
                              <span className="truncate">{lead.company}</span>
                            </div>
                          )}

                          {/* Value and Origin Row */}
                          <div className="flex items-center justify-between pt-1.5 border-t-2 border-zinc-100 mt-1">
                            <span className={`font-mono font-black text-indigo-600 ${
                              zoomMode === 'compact' ? 'text-[11px]' : 'text-xs'
                            }`}>
                              {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded border border-zinc-950 bg-zinc-200 text-zinc-800">
                              {lead.origin}
                            </span>
                          </div>

                          {/* Quick Interactive Actions */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t-2 border-zinc-100 mt-1">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onOpenLeadDetails(lead)}
                                title="Visualizar Ficha"
                                className="p-0.5 px-1 bg-white border border-zinc-950 hover:bg-zinc-100 text-zinc-900 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
                              >
                                <Info className="w-2.5 h-2.5 text-indigo-650" />
                                <span>Ficha</span>
                              </button>
                              <button
                                onClick={() => onOpenEditModal(lead)}
                                title="Editar Leads"
                                className="p-0.5 px-1 bg-white border border-zinc-950 hover:bg-zinc-100 text-zinc-900 text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
                              >
                                E
                              </button>
                            </div>

                            {/* Quick stage rotation arrows (Prev/Next) */}
                            <div className="flex items-center gap-0.5">
                              {(() => {
                                const adx = columns.findIndex(c => c.id === col.id);
                                return (
                                  <>
                                    {adx > 0 && (
                                      <button
                                        onClick={() => onMoveLead(lead.id, columns[adx - 1].id)}
                                        title="Mover anterior"
                                        className="p-0.5 rounded border border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
                                      >
                                        <ChevronLeft className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    {adx < columns.length - 1 && (
                                      <button
                                        onClick={() => onMoveLead(lead.id, columns[adx + 1].id)}
                                        title="Mover próximo"
                                        className="p-0.5 rounded border border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
                                      >
                                        <ChevronRight className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* SWATS Sidebar Drawer: "Gerador & Organizador Premium de Abas" */}
    {showAbaOrganizer && (
      <div className="w-full xl:w-80 shrink-0 bg-white border-4 border-zinc-950 p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-fadeIn sticky top-4 z-10 self-start">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5">
          <span className="text-xs font-black font-mono text-zinc-950 uppercase flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Ordem das Abas ({columns.length}/10)</span>
          </span>
          <button
            onClick={() => setShowAbaOrganizer(false)}
            className="p-1 px-2.5 bg-zinc-950 text-white rounded-md text-xs font-bold hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>
        
        <p className="text-[10px] text-zinc-500 font-bold leading-tight">
          Puxe ou empurre as abas clicando nas setas organizadoras. Qualquer modificação atualizará a esteira de CRM em tempo real.
        </p>

        {/* List of current Abas with ordering triggers */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {columns.map((col, idx) => (
            <div key={col.id} className="p-2.5 bg-zinc-50 border-2 border-zinc-950 rounded-xl flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono text-indigo-500 font-bold block">Fase {idx + 1} de {columns.length}</span>
                <strong className="text-xs text-zinc-900 font-black tracking-tight truncate block uppercase">{col.label}</strong>
              </div>
              
              {/* Push / Pull Order controllers */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveAbaBackward(idx)}
                  className="p-1 bg-white border-2 border-zinc-950 rounded-lg hover:bg-indigo-50 text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed transition"
                  title="Empurrar para trás (Fase Anterior)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={idx === columns.length - 1}
                  onClick={() => handleMoveAbaForward(idx)}
                  className="p-1 bg-white border-2 border-zinc-950 rounded-lg hover:bg-indigo-50 text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed transition"
                  title="Empurrar para frente (Próxima Fase)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#fcf8e3] border border-[#faebcc] text-[#8a6d3b] p-3 rounded-xl text-[10px] leading-relaxed font-semibold">
          💡 Dica: O CRM SWAT foi otimizado para comportar de forma premium até 10 abas ativas simultaneamente.
        </div>
      </div>
    )}
    </div>
  </div>
  );
}
