/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  RotateCcw, 
  Trash2, 
  Phone, 
  Mail, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';

interface ArchivedLeadsSheetProps {
  leads: Lead[]; // pre-filtered from parent
  unfilteredLeads?: Lead[]; // optional all archived leads for stats
  onReactivateLead: (leadId: string) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLeadField?: (leadId: string, fields: Partial<Lead>) => void;
  accSettings?: AccessibilitySettings;
}

export default function ArchivedLeadsSheet({
  leads,
  unfilteredLeads,
  onReactivateLead,
  onDeleteLead,
  onUpdateLeadField,
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS
}: ArchivedLeadsSheetProps) {

  // For stats, prioritize unfilteredLeads or fallback to leads
  const overallArchived = useMemo(() => {
    const list = unfilteredLeads || leads;
    return list.filter(l => l.status === 'perdido');
  }, [leads, unfilteredLeads]);

  // Lead list is already pre-filtered by parent
  const filteredArchived = useMemo(() => {
    return leads.filter(l => l.status === 'perdido');
  }, [leads]);

  // Stat computations
  const reasonStats = useMemo(() => {
    const stats = {
      semMargem: 0,
      sumiu: 0,
      desistiu: 0,
      comprouOutro: 0,
      outros: 0
    };
    overallArchived.forEach(l => {
      const reason = (l.lostReason || '').toLowerCase();
      if (reason.includes('margem') || reason.includes('renda')) stats.semMargem++;
      else if (reason.includes('resposta') || reason.includes('sumiu') || reason.includes('vácuo')) stats.sumiu++;
      else if (reason.includes('desist') || reason.includes('mudei')) stats.desistiu++;
      else if (reason.includes('concorrente') || reason.includes('comprado') || reason.includes('outro')) stats.comprouOutro++;
      else stats.outros++;
    });
    return stats;
  }, [overallArchived]);

  const handleExportCSV = () => {
    triggerSensoryFeedback('chime', accSettings);
    const headers = ['Nome', 'Telefone', 'E-mail', 'Renda Familiar', 'Bairro/Interesse', 'Motivo de Arquivamento', 'Anotações'];
    const rows = filteredArchived.map(l => [
      l.name,
      l.phone,
      l.email || '',
      l.familyIncome ? `R$ ${l.familyIncome}` : 'Não cadastrada',
      l.company || '',
      l.lostReason || 'Não especificado',
      (l.notes || '').replace(/\r?\n/g, ' ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planilha_seguimento_arquivados_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReasonChange = (leadId: string, newReason: string) => {
    triggerSensoryFeedback('click', accSettings);
    if (onUpdateLeadField) {
      onUpdateLeadField(leadId, { lostReason: newReason });
    } else {
      // Direct local storage override or notes injection if no direct handler
      const stored = localStorage.getItem('ciclocred_crm_leads');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updated = parsed.map((l: any) => l.id === leadId ? { ...l, lostReason: newReason } : l);
          localStorage.setItem('ciclocred_crm_leads', JSON.stringify(updated));
        } catch(_) {}
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP INFO STAT BARS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-zinc-900 border-2 border-zinc-950 px-2 py-3 rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <p className="text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest leading-tight">Sem Margem Caixa ⚠️</p>
          <p className="text-xl font-black text-white mt-1 leading-none">{reasonStats.semMargem}</p>
        </div>
        <div className="bg-zinc-900 border-2 border-zinc-950 px-2 py-3 rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <p className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest leading-tight">Sumiu / Sem Resp. 🔇</p>
          <p className="text-xl font-black text-white mt-1 leading-none">{reasonStats.sumiu}</p>
        </div>
        <div className="bg-zinc-900 border-2 border-zinc-950 px-2 py-3 rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <p className="text-[9px] font-mono font-black text-sky-400 uppercase tracking-widest leading-tight">Desistência 🛑</p>
          <p className="text-xl font-black text-white mt-1 leading-none">{reasonStats.desistiu}</p>
        </div>
        <div className="bg-zinc-900 border-2 border-zinc-950 px-2 py-3 rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <p className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest leading-tight">Comprou Outro 💔</p>
          <p className="text-xl font-black text-white mt-1 leading-none">{reasonStats.comprouOutro}</p>
        </div>
        <div className="bg-rose-950 border-2 border-zinc-950 px-2 py-3 rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] col-span-2 md:col-span-1 flex flex-col justify-center">
          <p className="text-[9px] font-mono font-black text-rose-200 uppercase tracking-widest leading-tight">Perda Líquida 📉</p>
          <p className="text-xl font-black text-white mt-1 leading-none">
            {leads.length > 0 ? `${Math.round((overallArchived.length / leads.length) * 100)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* 3. FLUID SPREADSHEET TABLE GRID */}
      <div className="bg-white border-4 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-4 bg-zinc-950 border-b-2 border-zinc-950 text-white flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
            <span className="font-mono text-[10.5px] font-black uppercase tracking-wider text-rose-350">
              PLANILHA DE SEGUIMENTO DE ARQUIVADOS ({filteredArchived.length} registros filtrados)
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold font-mono uppercase hidden sm:block">
            Histórico de Perda de Oportunidades
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-950 text-zinc-700 text-[10px] font-black uppercase font-mono tracking-wider">
                <th className="px-2 py-2 text-[10px] border-r border-zinc-200">Nome do Lead</th>
                <th className="px-2 py-2 text-[10px] border-r border-zinc-200">Contato / E-mail</th>
                <th className="px-2 py-2 text-[10px] border-r border-zinc-200 text-center">Renda F.</th>
                <th className="px-2 py-2 text-[10px] border-r border-zinc-200">Segmento / Zona</th>
                <th className="px-2 py-2 text-[10px] border-r border-zinc-200">Motivo de Arquivamento (In-Line)</th>
                <th className="px-2 py-2 text-[10px] border-r border-zinc-200">Última Notas</th>
                <th className="px-2 py-2 text-[10px] text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredArchived.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400 font-mono text-xs">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                    <span>Nenhum lead arquivado encontrado com os termos pesquisados.</span>
                  </td>
                </tr>
              ) : (
                filteredArchived.map((lead) => {
                  const lostReason = lead.lostReason || 'Sem motivo cadastrado';
                  
                  return (
                    <tr 
                      key={lead.id} 
                      className="border-b border-zinc-200 hover:bg-rose-50/20 transition-colors font-sans text-xs text-zinc-900 group"
                    >
                      {/* Name */}
                      <td className="px-2 py-2 text-[10.5px] border-r border-zinc-100 font-black uppercase tracking-tight text-zinc-950">
                        <input 
                          defaultValue={lead.name}
                          onBlur={(e) => { if (e.target.value !== lead.name) onUpdateLeadField?.(lead.id, { name: e.target.value }) }}
                          className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full max-w-[130px] truncate"
                          title={lead.name}
                        />
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {lead.tags.map(t => (
                              <span key={t} className="text-[7.5px] font-mono bg-zinc-100 px-1 py-0.2 rounded border text-zinc-600 font-black uppercase">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-2 py-2 text-[10px] border-r border-zinc-100">
                        <div className="space-y-0.5 font-mono text-[11px] font-bold">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <input 
                              defaultValue={lead.phone}
                              onBlur={(e) => { if (e.target.value !== lead.phone) onUpdateLeadField?.(lead.id, { phone: e.target.value }) }}
                              className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full max-w-[140px] truncate"
                            />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-550 select-all mt-0.5">
                            <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                            <input 
                              defaultValue={lead.email || ''}
                              onBlur={(e) => { if (e.target.value !== lead.email) onUpdateLeadField?.(lead.id, { email: e.target.value }) }}
                              className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full max-w-[140px] truncate"
                              placeholder="E-mail"
                              title={lead.email || ''}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Family Income */}
                      <td className="px-2 py-2 text-[10px] border-r border-zinc-100 text-center">
                        <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-950 font-mono text-[10px] font-black whitespace-nowrap flex items-center justify-center gap-1">
                          R$ <input 
                            type="number"
                            defaultValue={lead.familyIncome || 0}
                            onBlur={(e) => { if (Number(e.target.value) !== lead.familyIncome) onUpdateLeadField?.(lead.id, { familyIncome: Number(e.target.value) }) }}
                            className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-20 text-center text-amber-950"
                          />
                        </span>
                      </td>

                      {/* Unit / Zone */}
                      <td className="px-2 py-2 text-[10px] border-r border-zinc-100 font-mono text-[10px] font-bold">
                        <input 
                          defaultValue={lead.company || lead.locationInterested || 'Imóvel Geral'}
                          onBlur={(e) => { if (e.target.value !== (lead.company || lead.locationInterested || 'Imóvel Geral')) onUpdateLeadField?.(lead.id, { company: e.target.value }) }}
                          className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full mb-1"
                        />
                        <div className="text-[9px] text-zinc-500">
                          <input 
                            defaultValue={lead.origin || 'Web-Direct'}
                            onBlur={(e) => { if (e.target.value !== (lead.origin || 'Web-Direct')) onUpdateLeadField?.(lead.id, { origin: e.target.value }) }}
                            className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full"
                          />
                        </div>
                      </td>

                      {/* Lost Reason Select-in-place */}
                      <td className="px-2 py-2 text-[10px] border-r border-zinc-100">
                        <select
                          value={lead.lostReason || 'Sem motivo cadastrado'}
                          onChange={(e) => handleReasonChange(lead.id, e.target.value)}
                          className="bg-zinc-50 border border-zinc-950 rounded px-2 py-1.5 font-mono text-[10.5px] font-black text-zinc-900 w-full focus:outline-none focus:bg-white"
                        >
                          <option value="Sem motivo cadastrado">-- Escolher Motivo --</option>
                          <option value="Sem Margem Caixa ⚠️">Sem Margem Caixa ⚠️</option>
                          <option value="Sumiu / Sem Resposta 🔇">Sumiu / Sem Resposta 🔇</option>
                          <option value="Desistência de Compra 🛑">Desistência de Compra 🛑</option>
                          <option value="Comprou com Concorrente 💔">Comprou com Concorrente 💔</option>
                          <option value="Unidade Indisponível 🏢">Unidade Indisponível 🏢</option>
                          <option value="Fora do Orçamento Familiar 💸">Fora do Orçamento Familiar 💸</option>
                        </select>
                      </td>

                      {/* Last Note text preview */}
                      <td className="px-2 py-2 text-[10px] border-r border-zinc-100 max-w-xs text-zinc-550 italic font-semibold text-[10.5px]">
                        <textarea
                          defaultValue={lead.notes || ''}
                          placeholder="Sem anotações registradas no dossiê..."
                          onBlur={(e) => { if (e.target.value !== lead.notes) onUpdateLeadField?.(lead.id, { notes: e.target.value }) }}
                          className="bg-transparent border border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none w-full resize-none outline-none leading-tight"
                          rows={2}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-2 text-[10px] text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Reactivate emerald button */}
                          <button
                            onClick={() => onReactivateLead(lead.id)}
                            className="p-1 px-2.5 bg-emerald-50 border border-emerald-950 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-mono font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center gap-1 cursor-pointer"
                            title="Reativar Lead no CRM"
                          >
                            <RotateCcw className="w-3 h-3 shrink-0" />
                            <span>Reativar</span>
                          </button>

                          {/* Delete permanently */}
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="p-1.5 border border-red-300 hover:border-red-650 text-red-500 hover:bg-red-50 rounded transition hover:text-red-700 cursor-pointer"
                            title="Excluir Definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
