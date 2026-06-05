/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { X, Check } from 'lucide-react';
import { getKanbanColumns } from '../utils/kanban';

interface LeadModalProps {
  isOpen: boolean;
  lead: Lead | null; // If null, we are in 'Create' mode
  defaultStatus?: LeadStatus;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

export default function LeadModal({ isOpen, lead, defaultStatus, onClose, onSave }: LeadModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<LeadStatus>('novo');
  const [origin, setOrigin] = useState('Google Ads');
  const [notes, setNotes] = useState('');
  const [familyIncome, setFamilyIncome] = useState<number>(0);

  // Initializing state depending on edit/create mode
  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone);
      setCompany(lead.company || '');
      setValue(lead.value);
      setStatus(lead.status);
      setOrigin(lead.origin);
      setNotes(lead.notes);
      setFamilyIncome(lead.familyIncome || 0);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setValue(0);
      setStatus(defaultStatus || 'novo');
      setOrigin('Google Ads');
      setNotes('');
      setFamilyIncome(0);
    }
  }, [lead, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    const savedLead: Lead = {
      id: lead ? lead.id : `lead-${Date.now()}`,
      name,
      email,
      phone,
      company: company || undefined,
      value: Number(value) || 0,
      status,
      origin,
      notes,
      createdAt: lead ? lead.createdAt : new Date().toISOString().slice(0, 10),
      lastContactAt: lead ? lead.lastContactAt : undefined,
      familyIncome: Number(familyIncome) || undefined
    };

    onSave(savedLead);
  };

  const marketingOrigins = [
    'Instagram Ads',
    'Google Ads',
    'LinkedIn Organic',
    'Indicação',
    'Site Institucional',
    'Pesquisa Orgânica',
    'Facebook Ads',
    'Manual'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 overflow-y-auto backdrop-blur-xs select-none">
      <div 
        id="lead-edit-modal-frame"
        className="bg-white border-4 border-zinc-950 rounded-2xl w-full max-w-xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4.5 border-b-4 border-zinc-950 bg-zinc-900 text-white flex items-center justify-between">
          <h3 className="font-sans font-black text-sm uppercase italic tracking-tight">
            {lead ? '✏️ Editar Dados do Lead' : '👤 Cadastrar Novo Lead'}
          </h3>
          <button 
            onClick={onClose}
            className="text-zinc-450 hover:text-white p-1 rounded-lg border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-zinc-800 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-1">
              <label htmlFor="lead-form-name" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Nome Completo *</label>
              <input
                type="text"
                id="lead-form-name"
                required
                placeholder="Ex: Amanda Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="lead-form-email" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Endereço de E-mail *</label>
              <input
                type="email"
                id="lead-form-email"
                required
                placeholder="Ex: amanda@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1">
              <label htmlFor="lead-form-phone" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Telefone de Contato *</label>
              <input
                type="text"
                id="lead-form-phone"
                required
                placeholder="Ex: (11) 99123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Empresa */}
            <div className="space-y-1">
              <label htmlFor="lead-form-company" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Empresa / Negócio</label>
              <input
                type="text"
                id="lead-form-company"
                placeholder="Ex: Aliança Comercial S/A"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Valor de interesse */}
            <div className="space-y-1">
              <label htmlFor="lead-form-value" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Valor do Imóvel/Investimento (R$)</label>
              <input
                type="number"
                id="lead-form-value"
                placeholder="10000"
                value={value || ''}
                onChange={(e) => setValue(Number(e.target.value) || 0)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm font-mono text-zinc-950 font-black focus:bg-white outline-none"
              />
            </div>

            {/* Renda Familiar */}
            <div className="space-y-1">
              <label htmlFor="lead-form-family-income" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Renda Familiar Declarada (R$)</label>
              <input
                type="number"
                id="lead-form-family-income"
                placeholder="Ex: 4500"
                value={familyIncome || ''}
                onChange={(e) => setFamilyIncome(Number(e.target.value) || 0)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm font-mono text-zinc-950 font-black focus:bg-white outline-none"
              />
            </div>

            {/* Status do funil */}
            <div className="space-y-1">
              <label htmlFor="lead-form-status" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Etapa do Funil</label>
              <select
                id="lead-form-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-extrabold focus:bg-white outline-none"
              >
                {getKanbanColumns().map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
            </div>

            {/* Origem */}
            <div className="space-y-1">
              <label htmlFor="lead-form-origin" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Origem de Captação</label>
              <select
                id="lead-form-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-extrabold focus:bg-white outline-none"
              >
                {marketingOrigins.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label htmlFor="lead-form-notes" className="block text-[10px] font-mono font-black text-zinc-700 uppercase font-sans">Notas Adicionais / Histórico</label>
            <textarea
              id="lead-form-notes"
              rows={4}
              placeholder="Digite o resumo desse lead, conversas anteriores, dores e termos comerciais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-sm text-zinc-950 font-semibold focus:bg-white outline-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t-2 border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 bg-zinc-100 border-2 border-zinc-950 hover:bg-zinc-200 text-zinc-900 font-black rounded-xl text-xs uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{lead ? 'Salvar Edições' : 'Criar Registro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
