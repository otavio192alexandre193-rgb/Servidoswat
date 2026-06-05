/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RealEstateProperty, Lead } from '../types';
import { 
  Building2, 
  Search, 
  MapPin, 
  DollarSign, 
  Key, 
  ChevronRight, 
  CheckCircle, 
  Smartphone, 
  User, 
  Mail, 
  Send,
  Home,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { triggerSensoryFeedback, AccessibilitySettings, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';

interface PublicPortalProps {
  properties: RealEstateProperty[];
  onAddCapturedLead: (newLead: Lead) => void;
  accSettings?: AccessibilitySettings;
}

export default function PublicPortal({ 
  properties, 
  onAddCapturedLead,
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS 
}: PublicPortalProps) {
  // Client selection and matching states
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>('todos');
  const [filterMaxBudget, setFilterMaxBudget] = useState<number>(1500000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Registration capture Form state
  const [capturedLeadName, setCapturedLeadName] = useState('');
  const [capturedLeadEmail, setCapturedLeadEmail] = useState('');
  const [capturedLeadPhone, setCapturedLeadPhone] = useState('');
  const [capturedLeadBudget, setCapturedLeadBudget] = useState(500000);
  const [capturedLeadNotes, setCapturedLeadNotes] = useState('');
  const [selectedPropertyForInterest, setSelectedPropertyForInterest] = useState<RealEstateProperty | null>(null);

  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Derive unique neighborhoods
  const neighborhoods = Array.from(new Set(properties.map(p => p.neighborhood)));

  // Filter properties
  const availableProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNeighborhood = filterNeighborhood === 'todos' || p.neighborhood === filterNeighborhood;
    const matchesBudget = p.price <= filterMaxBudget;
    return matchesSearch && matchesNeighborhood && matchesBudget && p.status === 'disponivel';
  });

  const handleSubmitInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedLeadName || !capturedLeadPhone) return;

    // Create a real new Lead object linked directly to this public portal landing page capture!
    const newLead: Lead = {
      id: `lead-public-${Date.now()}`,
      name: capturedLeadName,
      email: capturedLeadEmail || `${capturedLeadName.toLowerCase().replace(/\s+/g, '')}@exemplo-publico.com`,
      phone: capturedLeadPhone,
      company: '',
      value: Number(capturedLeadBudget) || (selectedPropertyForInterest ? selectedPropertyForInterest.price : 450000),
      status: 'novo',
      origin: 'Site Público (Portfólio)',
      notes: selectedPropertyForInterest 
        ? `Interessado em ver o imóvel ${selectedPropertyForInterest.title} (Código: ${selectedPropertyForInterest.code}) no valor de ${selectedPropertyForInterest.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}. ${capturedLeadNotes}`
        : `Interessado captado pelo formulário geral do Site Público. Notas: ${capturedLeadNotes}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    triggerSensoryFeedback('success', accSettings);
    onAddCapturedLead(newLead);
    setRegisterSuccess(true);

    // Reset fields
    setCapturedLeadName('');
    setCapturedLeadEmail('');
    setCapturedLeadPhone('');
    setCapturedLeadNotes('');
    
    setTimeout(() => {
      setRegisterSuccess(false);
      setSelectedPropertyForInterest(null);
    }, 6000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Simulation Banner explaining connection to CRM */}
      <div className="bg-gradient-to-br from-indigo-900 via-zinc-900 to-indigo-950 text-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-mono font-black text-indigo-400 tracking-wider">⚡ Simulação de Site Externo Público</span>
          <h2 className="text-xl font-black uppercase italic tracking-tight">Captação de Leads Conectada ao CRM em Tempo Real</h2>
          <p className="text-xs text-indigo-200 font-medium max-w-xl leading-relaxed">
            Abaixo é simulada a interface pública que seu cliente final acessa. Ao se cadastrar ou propor interesse em um imóvel, o visitante é <strong>inserido na hora</strong> como um Lead Novo no CRM e gera notificações sonoras!
          </p>
        </div>
        <div className="p-2.5 bg-indigo-950 rounded-2xl border border-indigo-700 font-mono text-[9px] text-zinc-300 font-bold max-w-xs uppercase">
          🔗 ORIGEM COMA CRM: <span className="text-white font-black">"Site Público (Portfólio)"</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PUBLIC WEBPAGE: PROPERTY DIRECTORY LIST (8 Columns) */}
        <div className="lg:col-span-8 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
            <div>
              <h3 className="text-md font-black uppercase tracking-tight text-zinc-950 flex items-center gap-1.5">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Portal Imobiliário cicloCRED</span>
              </h3>
              <p className="text-xs text-zinc-500 font-bold">Confira as cartas de imóveis e créditos ideais que pré-aprovamos para você.</p>
            </div>

            {/* General quick search input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por bairro ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-zinc-950"
              />
            </div>
          </div>

          {/* Quick External filters belt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 border-2 border-zinc-950 p-4 rounded-xl">
            {/* Filter 1 */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono">Bairro / Localidade</label>
              <select
                value={filterNeighborhood}
                onChange={(e) => setFilterNeighborhood(e.target.value)}
                className="w-full bg-white border border-zinc-350 p-2.5 rounded-lg text-xs font-black text-zinc-800"
              >
                <option value="todos">Todos os Bairros</option>
                {neighborhoods.map(nei => (
                  <option key={nei} value={nei}>{nei}</option>
                ))}
              </select>
            </div>

            {/* Filter 2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-black uppercase text-zinc-500">
                <span>Orçamento Máximo</span>
                <span className="text-indigo-600 font-black">R$ {filterMaxBudget.toLocaleString('pt-BR')}</span>
              </div>
              <input
                type="range"
                min="200000"
                max="2500000"
                step="50000"
                value={filterMaxBudget}
                onChange={(e) => setFilterMaxBudget(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-zinc-200 border border-zinc-350 rounded"
              />
            </div>
          </div>

          {/* Product Items catalog grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {availableProperties.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-zinc-400 font-mono text-xs uppercase font-black border-2 border-dashed border-zinc-200 rounded-2xl">
                Nenhum imóvel disponível para esses filtros comerciais.
              </div>
            ) : (
              availableProperties.map((prop) => (
                <div 
                  key={prop.id} 
                  className={`border-4 border-zinc-950 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col justify-between transition-transform hover:scale-[1.01] ${
                    selectedPropertyForInterest?.id === prop.id ? 'ring-4 ring-indigo-600 border-indigo-600' : ''
                  }`}
                >
                  <div className="relative aspect-video bg-zinc-100 border-b-2 border-zinc-950">
                    <img 
                      src={prop.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'} 
                      alt={prop.title}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-2.5 left-2.5 bg-zinc-950 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded border border-zinc-750">
                      💰 {prop.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-mono font-black uppercase text-indigo-600 text-[10px]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{prop.neighborhood} • {prop.location.slice(0, 15)}</span>
                      </div>
                      <h4 className="font-sans font-black text-xs text-zinc-950 uppercase leading-snug">{prop.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold lines-clamp-2 leading-relaxed">{prop.description}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono font-black text-zinc-500 border-t pt-3 border-zinc-100">
                      <span>📏 {prop.sizeSqm} m²</span>
                      <span>🛌 {prop.bedrooms} Dorms</span>
                      <span>🚗 {prop.parkingSpaces} Vaga</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback('click', accSettings);
                        setSelectedPropertyForInterest(prop);
                        setCapturedLeadBudget(prop.price);
                      }}
                      className={`w-full py-2 border-2 border-zinc-950 rounded-xl font-mono text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5 ${
                        selectedPropertyForInterest?.id === prop.id 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950'
                      }`}
                    >
                      {selectedPropertyForInterest?.id === prop.id ? '✓ Imóvel Selecionado' : 'Propor Interesse neste Imóvel'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EXTERNAL VISITOR CAPTURE FORM (4 Columns) */}
        <div id="lead-captured-form-card" className="lg:col-span-4 bg-zinc-50 border-4 border-zinc-950 p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-5">
          <div className="border-b pb-3 border-zinc-250">
            <h3 className="text-sm font-black uppercase text-zinc-950 italic flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Expressar Interesse</span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold">Faça o seu cadastro para simular financiamentos e receber atendimento exclusivo no WhatsApp.</p>
          </div>

          {registerSuccess ? (
            <div className="p-5 bg-emerald-100 border-2 border-emerald-600 text-emerald-950 rounded-2xl space-y-3.5 text-center animate-scaleIn select-none">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h5 className="text-xs font-black uppercase">Cadastro Realizado!</h5>
                <p className="text-[11px] font-bold">Enviamos seus dados diretamente ao CRM comercial cicloCRED.</p>
              </div>
              <p className="text-[10px] text-emerald-800 font-semibold font-mono bg-white border border-emerald-300 rounded p-1">
                🔔 O Corretor do CRM recebeu um alerta sonoro e de vibração agora!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitInterest} className="space-y-4 text-zinc-950 text-xs text-left">
              {/* Associated property notice */}
              {selectedPropertyForInterest && (
                <div className="p-2 bg-indigo-50 border border-indigo-300 rounded-lg text-[10px] font-extrabold text-indigo-950 flex justify-between items-center">
                  <span>🎯 Vinculado a: {selectedPropertyForInterest.title.slice(0, 18)}...</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedPropertyForInterest(null);
                      setCapturedLeadBudget(500000);
                    }}
                    className="text-red-600 font-black cursor-pointer uppercase text-[9px]"
                  >
                    Remover
                  </button>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-zinc-600 font-mono">Meu Nome completo*</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amanda Vasconcellos"
                    value={capturedLeadName}
                    onChange={(e) => setCapturedLeadName(e.target.value)}
                    className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 pl-9 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-zinc-600 font-mono">WhatsApp para contato*</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98888-7777"
                    value={capturedLeadPhone}
                    onChange={(e) => setCapturedLeadPhone(e.target.value)}
                    className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 pl-9 text-xs focus:bg-white outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-zinc-600 font-mono">E-mail para receber Proposta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="Ex: amanda@exemplo.com"
                    value={capturedLeadEmail}
                    onChange={(e) => setCapturedLeadEmail(e.target.value)}
                    className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 pl-9 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
              </div>

              {/* Budget slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase text-zinc-600">
                  <span>Meu Orçamento Estimado</span>
                  <span className="text-indigo-600 font-black">R$ {capturedLeadBudget.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="150000"
                  max="2500000"
                  step="50000"
                  value={capturedLeadBudget}
                  onChange={(e) => setCapturedLeadBudget(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-zinc-600 font-mono">Mensagem de Interesse / Notas</label>
                <textarea
                  rows={2}
                  placeholder="Gostaria de agendar visita no próximo sábado..."
                  value={capturedLeadNotes}
                  onChange={(e) => setCapturedLeadNotes(e.target.value)}
                  className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>Enviar Proposta e Cadastrar</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
