/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, OperationalFlow } from '../types';
import { X, Check } from 'lucide-react';
import { getKanbanColumns } from '../utils/kanban';
import { createDefaultFlow } from '../utils/flow';

interface LeadModalProps {
  isOpen: boolean;
  lead: Lead | null; // If null, we are in 'Create' mode
  defaultStatus?: LeadStatus;
  operationalFlows?: OperationalFlow[];
  setOperationalFlows?: React.Dispatch<React.SetStateAction<OperationalFlow[]>>;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

export default function LeadModal({ isOpen, lead, defaultStatus, operationalFlows = [], setOperationalFlows, onClose, onSave }: LeadModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<LeadStatus>('novo');
  const [origin, setOrigin] = useState('WhatsApp');
  const [notes, setNotes] = useState('');
  const [familyIncome, setFamilyIncome] = useState<number>(0);

  // Custom user suggested columns states
  const [mainProfile, setMainProfile] = useState<'Investidor' | 'Primeiro Imóvel' | 'Jovem' | 'Meia idade' | 'Idoso'>('Primeiro Imóvel');
  const [region, setRegion] = useState('Sul');
  const [gender, setGender] = useState<'Homem' | 'Mulher' | 'Outro' | 'Prefiro nao informar'>('Homem');
  const [sqmMatters, setSqmMatters] = useState<'sim' | 'nao'>('nao');
  const [unitTypeMatters, setUnitTypeMatters] = useState<'sim' | 'nao'>('nao');
  const [deliveryMatters, setDeliveryMatters] = useState<'sim' | 'nao'>('nao');
  const [firstImpression, setFirstImpression] = useState('');

  // Spreadsheet-Aligned Fields
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<'Solteiro' | 'Casado' | 'Uniao estavel' | 'Divorciado' | 'Viuvo'>('Solteiro');
  const [bairroEspecifico, setBairroEspecifico] = useState('');
  const [cep, setCep] = useState('');
  const [fgtsSaldo, setFgtsSaldo] = useState<number>(0);
  const [restricaoBacen, setRestricaoBacen] = useState<'Sim' | 'Não'>('Não');
  const [possuiImovel, setPossuiImovel] = useState<'Sim' | 'Não' | 'Em nome de terceiros'>('Não');
  const [programaDesejado, setProgramaDesejado] = useState<'Minha Casa Minha Vida' | 'SBPE' | 'Indiferente'>('Indiferente');
  const [preferenciasUnidade, setPreferenciasUnidade] = useState<string[]>([]);
  const [comoSoube, setComoSoube] = useState<'Instagram' | 'Facebook' | 'Google' | 'Indicacao' | 'Corretor' | 'Feira' | 'Outros'>('Instagram');
  const [incomeType, setIncomeType] = useState<'fixa' | 'variavel'>('fixa');
  const [fluxoId, setFluxoId] = useState<string>('');

  // Form Section Navigation
  const [activeFormSection, setActiveFormSection] = useState<'geral' | 'financeiro' | 'preferencias'>('geral');

  // Initializing state depending on edit/create mode
  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setEmail(lead.email || '');
      setPhone(lead.phone);
      setCompany(lead.company || '');
      setValue(lead.value || 0);
      setStatus(lead.status);
      setOrigin(lead.origin);
      setNotes(lead.notes || '');
      setFamilyIncome(lead.familyIncome || 0);
      
      setMainProfile(lead.mainProfile || 'Primeiro Imóvel');
      setRegion(lead.region || 'Sul');
      setGender(lead.gender || 'Homem');
      setSqmMatters(lead.sqmMatters || 'nao');
      setUnitTypeMatters(lead.unitTypeMatters || 'nao');
      setDeliveryMatters(lead.deliveryMatters || 'nao');
      setFirstImpression(lead.firstImpression || '');

      // Spreadsheet-Aligned hydration
      setCpf(lead.cpf || '');
      setBirthDate(lead.birthDate || '');
      setMaritalStatus(lead.maritalStatus || 'Solteiro');
      setBairroEspecifico(lead.bairroEspecifico || '');
      setCep(lead.cep || '');
      setFgtsSaldo(lead.fgtsSaldo || 0);
      setRestricaoBacen(lead.restricaoBacen || 'Não');
      setPossuiImovel(lead.possuiImovel || 'Não');
      setProgramaDesejado(lead.programaDesejado || 'Indiferente');
      setPreferenciasUnidade(lead.preferenciasUnidade || []);
      setComoSoube(lead.comoSoube || 'Instagram');
      setIncomeType((lead as any).incomeType || 'fixa');
      setFluxoId(lead.fluxoId || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setValue(0);
      setStatus(defaultStatus || 'novo');
      setOrigin('WhatsApp');
      setNotes('');
      setFamilyIncome(0);

      setMainProfile('Primeiro Imóvel');
      setRegion('Sul');
      setGender('Homem');
      setSqmMatters('nao');
      setUnitTypeMatters('nao');
      setDeliveryMatters('nao');
      setFirstImpression('');

      // Form reset values
      setCpf('');
      setBirthDate('');
      setMaritalStatus('Solteiro');
      setBairroEspecifico('');
      setCep('');
      setFgtsSaldo(0);
      setRestricaoBacen('Não');
      setPossuiImovel('Não');
      setProgramaDesejado('Indiferente');
      setPreferenciasUnidade([]);
      setComoSoube('Instagram');
      setIncomeType('fixa');
      setFluxoId('');
    }
  }, [lead, defaultStatus, isOpen]);

  // Real-time compound Lead Scoring based on user-provided spreadsheet logic
  const calculatedScore = React.useMemo(() => {
    let sc = 10; // Base score
    if (fgtsSaldo > 0) sc += 15;
    if (familyIncome > 8000) sc += 25;
    else if (familyIncome > 4400) sc += 20;
    else if (familyIncome > 2640) sc += 15;
    else if (familyIncome > 0) sc += 10;

    if (restricaoBacen === 'Não') sc += 25;
    if (possuiImovel === 'Não') sc += 15; // Primeiro imóvel gets a boost
    if (region && region !== '') sc += 5;
    if (cpf && cpf.length >= 11) sc += 10; // Documents provided
    return Math.min(100, sc);
  }, [fgtsSaldo, familyIncome, restricaoBacen, possuiImovel, region, cpf]);

  const togglePreference = (pref: string) => {
    if (preferenciasUnidade.includes(pref)) {
      setPreferenciasUnidade(preferenciasUnidade.filter(p => p !== pref));
    } else {
      setPreferenciasUnidade([...preferenciasUnidade, pref]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    if (!fluxoId) {
      alert("A Seleção de um Fluxo Operacional é obrigatória para salvar o cadastro do perfil.");
      return;
    }

    // Direct deduction of probable program in accordance with spreadsheet rules
    let probableProgram: 'Minha Casa Minha Vida' | 'SBPE' = 'SBPE';
    if (familyIncome <= 8000) {
      probableProgram = 'Minha Casa Minha Vida';
    }

    const savedLead: Lead = {
      id: lead ? lead.id : `lead-${Date.now()}`,
      name,
      email: email || '',
      phone,
      company: company || undefined,
      value: Number(value) || 0,
      status,
      origin,
      notes,
      createdAt: lead ? lead.createdAt : new Date().toISOString().slice(0, 10),
      lastContactAt: lead ? lead.lastContactAt : new Date().toISOString().slice(0, 10),
      familyIncome: Number(familyIncome) || undefined,
      gender,
      
      // Custom user columns mapping
      mainProfile,
      region,
      sqmMatters,
      unitTypeMatters,
      deliveryMatters,
      firstImpression: firstImpression || undefined,

      // Spreadsheet attributes
      cpf,
      birthDate,
      maritalStatus,
      bairroEspecifico,
      cep,
      fgtsSaldo: Number(fgtsSaldo) || 0,
      restricaoBacen,
      possuiImovel,
      programaDesejado: programaDesejado === 'Indiferente' ? probableProgram : programaDesejado,
      preferenciasUnidade,
      comoSoube,
      score: calculatedScore,
      fluxoId,
      incomeType
    } as any;

    onSave(savedLead);
  };

  const marketingOrigins = [
    'WhatsApp',
    'Site',
    'Indicação',
    'Stand',
    'Google Ads',
    'Facebook Ads',
    'Instagram Ads',
    'Manual'
  ];

  const unitPreferenceOptions = [
    '1 dorm.',
    '2 dorm.',
    'Suíte',
    'Varanda',
    'Vaga carro',
    'Vaga moto',
    'Bicicletário',
    'Térreo',
    'Andar alto',
    'Andar baixo'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 overflow-y-auto backdrop-blur-xs select-none">
      <div 
        id="lead-edit-modal-frame"
        className="bg-white border-4 border-zinc-950 rounded-2xl w-full max-w-2xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b-4 border-zinc-950 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">👤</span>
            <div>
              <h3 className="font-sans font-black text-xs uppercase tracking-wider">
                {lead ? 'Editar Cadastro de Lead' : 'Cadastrar Novo Lead no Funil'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                {lead ? `ID: ${lead.id}` : 'Novo Lead Operacional'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time score meter */}
            <div className="bg-zinc-950 text-emerald-400 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] font-mono font-black flex items-center gap-1">
              <span>SCORE EST.:</span>
              <span className="text-white">{calculatedScore} pt</span>
            </div>
            <button 
              onClick={onClose}
              type="button"
              className="text-zinc-450 hover:text-white p-1 rounded-lg border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-zinc-100 border-b-4 border-zinc-950 p-2 flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFormSection('geral')}
            className={`flex-1 px-3 py-2 text-[10.5px] font-black uppercase text-center rounded-xl border-2 transition ${
              activeFormSection === 'geral'
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            📋 Dados Gerais
          </button>
          <button
            type="button"
            onClick={() => setActiveFormSection('financeiro')}
            className={`flex-1 px-3 py-2 text-[10.5px] font-black uppercase text-center rounded-xl border-2 transition ${
              activeFormSection === 'financeiro'
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            💰 Crédito & Financeiro
          </button>
          <button
            type="button"
            onClick={() => setActiveFormSection('preferencias')}
            className={`flex-1 px-3 py-2 text-[10.5px] font-black uppercase text-center rounded-xl border-2 transition ${
              activeFormSection === 'preferencias'
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            🏡 Imóvel & Preferências
          </button>
        </div>

        {/* Input Form Fields */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-zinc-800 bg-white">
          
          {/* TAB 1: DADOS GERAIS */}
          {activeFormSection === 'geral' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-name" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Nome *</label>
                  <input
                    type="text"
                    id="lead-form-name"
                    required
                    placeholder="Ex: Amanda Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
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
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-email" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Endereço de E-mail</label>
                  <input
                    type="email"
                    id="lead-form-email"
                    placeholder="Ex: amanda@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* CPF */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-cpf" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">CPF do Proponente</label>
                  <input
                    type="text"
                    id="lead-form-cpf"
                    placeholder="Ex: 123.456.789-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-birth" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Data de Nascimento</label>
                  <input
                    type="date"
                    id="lead-form-birth"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none text-zinc-900"
                  />
                </div>

                {/* Estado Civil */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-marital" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Estado Civil</label>
                  <select
                    id="lead-form-marital"
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Solteiro">Solteiro(a)</option>
                    <option value="Casado">Casado(a)</option>
                    <option value="Uniao estavel">União Estável</option>
                    <option value="Divorciado">Divorciado(a)</option>
                    <option value="Viuvo">Viúvo(a)</option>
                  </select>
                </div>

                {/* Gênero */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-gender" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Gênero</label>
                  <select
                    id="lead-form-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Homem">Homem</option>
                    <option value="Mulher">Mulher</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro nao informar">Prefiro não informar</option>
                  </select>
                </div>

                {/* Empresa */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-company" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Profissão / Empresa</label>
                  <input
                    type="text"
                    id="lead-form-company"
                    placeholder="Ex: Servidor Público"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* Origem */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-origin" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Canal de Atendimento de Entrada</label>
                  <select
                    id="lead-form-origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    {marketingOrigins.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>

                {/* Fluxo Operations */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-fluxo" className="block text-[10px] font-mono font-black text-zinc-700 uppercase pt-2">Fluxo Operacional (Obrigatório)*</label>
                  <div className="flex gap-2">
                    <select
                      id="lead-form-fluxo"
                      value={fluxoId}
                      onChange={(e) => {
                        if (e.target.value === 'novo' && setOperationalFlows) {
                          const newName = prompt("Nome do novo fluxo:");
                          if (newName) {
                            const newFlow = createDefaultFlow(`flow-${Date.now()}`, newName);
                            setOperationalFlows(prev => [...prev, newFlow]);
                            setFluxoId(newFlow.id);
                          }
                        } else {
                          setFluxoId(e.target.value);
                        }
                      }}
                      className="flex-1 bg-amber-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                    >
                      <option value="">Selecione o fluxo...</option>
                      {operationalFlows.map(flow => (
                        <option key={flow.id} value={flow.id}>{flow.name}</option>
                      ))}
                      <option value="novo" className="bg-indigo-100 text-indigo-800 font-bold">+ Criar Novo Fluxo</option>
                    </select>
                  </div>
                </div>

                {/* Como soube da Cury */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-know" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Como Soube da Incorporadora (Cury/Minha Casa)?</label>
                  <select
                    id="lead-form-know"
                    value={comoSoube}
                    onChange={(e) => setComoSoube(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Instagram">Instagram / Redes</option>
                    <option value="Facebook">Facebook Ads</option>
                    <option value="Google">Google Search</option>
                    <option value="Indicacao">Indicação Operacional</option>
                    <option value="Corretor">Corretor Credenciado</option>
                    <option value="Feira">Feirão Habitacional</option>
                    <option value="Outros">Outras Mídias</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFIL FINANCEIRO & CRÉDITO */}
          {activeFormSection === 'financeiro' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-zinc-50 border-2 border-zinc-950 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-mono font-black uppercase text-zinc-900 flex items-center gap-2">
                  <span>📈</span> Métricas de Renda e Fomento
                </h4>
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                  As tabelas de fomento do sistema aplicam limites rígidos de comprometimento da parcela Caixa (até 30% da renda mensal).
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Renda Familiar */}
                  <div className="space-y-1">
                    <label htmlFor="lead-form-family-income" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Renda Familiar Bruta/Conjunta (R$)</label>
                    <input
                      type="number"
                      id="lead-form-family-income"
                      required
                      placeholder="Ex: 5000"
                      value={familyIncome || ''}
                      onChange={(e) => setFamilyIncome(Number(e.target.value) || 0)}
                      className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono text-zinc-950 font-black outline-none"
                    />
                  </div>

                  {/* FGTS Saldo */}
                  <div className="space-y-1">
                    <label htmlFor="lead-form-fgts" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Saldo de FGTS Declarado (R$)</label>
                    <input
                      type="number"
                      id="lead-form-fgts"
                      placeholder="Ex: 15000"
                      value={fgtsSaldo || ''}
                      onChange={(e) => setFgtsSaldo(Number(e.target.value) || 0)}
                      className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono text-zinc-950 font-black outline-none"
                    />
                  </div>

                  {/* Comprometimento de Parcela (Dedução spread) */}
                  <div className="bg-zinc-950 p-3 rounded-lg text-white font-mono text-xs flex flex-col justify-center">
                    <span className="text-[10px] text-zinc-400">PARCELA MÁXIMA AMORTIZADA (30%):</span>
                    <strong className="text-emerald-450 text-base">
                      R$ {((familyIncome || 0) * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>

                  {/* Program. Provável (Visual deduction based on renda) */}
                  <div className="bg-indigo-50 border border-indigo-250 p-2.5 rounded-lg flex flex-col justify-center text-xs">
                    <span className="text-[9.5px] text-indigo-500 font-bold uppercase font-mono">Enquadramento Federal:</span>
                    <strong className="text-indigo-900 mt-0.5">
                      {familyIncome <= 2640 ? 'MCMV - Faixa 1 (HIS 1)' :
                       familyIncome <= 4400 ? 'MCMV - Faixa 2 (HIS ' + (familyIncome <= 3200 ? '1' : '2') + ')' :
                       familyIncome <= 8000 ? 'MCMV - Faixa 3 (HMP)' : 'Crédito SBPE (Ampla Concor.)'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Tipo de Renda */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-income-type" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Origem de Comprovação da Renda</label>
                  <select
                    id="lead-form-income-type"
                    value={incomeType}
                    onChange={(e) => setIncomeType(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="fixa">Holerite / Renda Fixa CLT</option>
                    <option value="variavel">Pró-labore / Extrato Bancário / Renda Variável</option>
                  </select>
                </div>

                {/* Restrição BACEN */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-bacen" className="block text-[10px] font-mono font-black text-rose-700 uppercase">Restrição de Crédito / BACEN-SERASA? *</label>
                  <select
                    id="lead-form-bacen"
                    value={restricaoBacen}
                    onChange={(e) => setRestricaoBacen(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Não">Não possui nenhuma restrição</option>
                    <option value="Sim">Sim, possui restrição activa</option>
                  </select>
                </div>

                {/* Já possui imóvel */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-hasproperty" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Já Possui Imóvel Residencial?</label>
                  <select
                    id="lead-form-hasproperty"
                    value={possuiImovel}
                    onChange={(e) => setPossuiImovel(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Não">Não possuo imóveis ativos</option>
                    <option value="Sim">Sim, possuo imóvel próprio</option>
                    <option value="Em nome de terceiros">Em nome de terceiros / herança</option>
                  </select>
                </div>

                {/* Status no Funil de Vendas */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-status-select" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Etapa Principal do Funil</label>
                  <select
                    id="lead-form-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    {getKanbanColumns().map(col => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMÓVEL & PREFERÊNCIAS */}
          {activeFormSection === 'preferencias' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Zona de Interesse */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-region" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Região Preferencial</label>
                  <select
                    id="lead-form-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Sul">Zona Sul</option>
                    <option value="Norte">Zona Norte</option>
                    <option value="Leste">Zona Leste</option>
                    <option value="Oeste">Zona Oeste</option>
                    <option value="Centro">Centro / Região Central</option>
                  </select>
                </div>

                {/* Bairro específico */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-neighborhood" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Bairro Específico de Interesse</label>
                  <input
                    type="text"
                    id="lead-form-neighborhood"
                    placeholder="Ex: Penha, Tucuruvi, Bela Vista"
                    value={bairroEspecifico}
                    onChange={(e) => setBairroEspecifico(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* CEP de Origem/Trabalho */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-cep" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">CEP de Interesse / Referência</label>
                  <input
                    type="text"
                    id="lead-form-cep"
                    placeholder="Ex: 01311-200"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* Perfil Psicológico de Destino */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-profile" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Perfil Demográfico do Cliente</label>
                  <select
                    id="lead-form-profile"
                    value={mainProfile}
                    onChange={(e) => setMainProfile(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Primeiro Imóvel">Primeiro Imóvel (Uso Próprio)</option>
                    <option value="Investidor">Investidor (Renda de Locação/Short Stay)</option>
                    <option value="Jovem">Jovem Solteiro (Mobilidade & Metrô)</option>
                    <option value="Meia idade">Meia Idade (Espaço Familiar & Lazer)</option>
                    <option value="Idoso">Melhor Idade (Tranquilidade & Térreo)</option>
                  </select>
                </div>

                {/* Valor Global de Imóvel Buscado (Limitador) */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-value" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Valor Global Estimado do Imóvel (R$)</label>
                  <input
                    type="number"
                    id="lead-form-value"
                    placeholder="Ex: 275000"
                    value={value || ''}
                    onChange={(e) => setValue(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono text-zinc-950 font-bold focus:bg-white outline-none"
                  />
                </div>

                {/* Programa Desejado */}
                <div className="space-y-1">
                  <label htmlFor="lead-form-pdesejado" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Programa de Fomento Desejado</label>
                  <select
                    id="lead-form-pdesejado"
                    value={programaDesejado}
                    onChange={(e) => setProgramaDesejado(e.target.value as any)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                  >
                    <option value="Indiferente">Autodetectar por Faixa Salarial</option>
                    <option value="Minha Casa Minha Vida">Minha Casa Minha Vida (MCMV)</option>
                    <option value="SBPE">SBPE (Financiamento Livre por Banco)</option>
                  </select>
                </div>
              </div>

              {/* Checklist de Preferências de Unidade */}
              <div className="space-y-2 pt-1">
                <label className="block text-[10px] font-mono font-black text-zinc-700 uppercase">🔑 Diferenciais do Imóvel Desejados (Selecione Vários)</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {unitPreferenceOptions.map((opt) => {
                    const isSelected = preferenciasUnidade.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => togglePreference(opt)}
                        className={`p-2 border-2 rounded-xl text-[9px] font-black text-center transition truncate ${
                          isSelected
                            ? 'bg-zinc-900 border-zinc-950 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-zinc-50 border-zinc-350 text-zinc-700 hover:bg-zinc-150'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Matriz dos Fatores Decisores (Sim / Não toggles) */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-50 border-2 border-zinc-950 p-3 rounded-xl">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase">Metragem Importa?</label>
                  <select
                    value={sqmMatters}
                    onChange={(e) => setSqmMatters(e.target.value as any)}
                    className="w-full bg-white border border-zinc-400 rounded-lg p-1 text-xs font-bold text-zinc-800"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase">Tipo Unidade Importa?</label>
                  <select
                    value={unitTypeMatters}
                    onChange={(e) => setUnitTypeMatters(e.target.value as any)}
                    className="w-full bg-white border border-zinc-400 rounded-lg p-1 text-xs font-bold text-zinc-800"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase">Previsão Pronta?</label>
                  <select
                    value={deliveryMatters}
                    onChange={(e) => setDeliveryMatters(e.target.value as any)}
                    className="w-full bg-white border border-zinc-400 rounded-lg p-1 text-xs font-bold text-zinc-800"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>

              {/* Primeira Impressão (Campo Livre) */}
              <div className="space-y-1">
                <label htmlFor="lead-form-first" className="block text-[10px] font-mono font-black text-zinc-700 uppercase">Primeira Impressão Técnica</label>
                <input
                  type="text"
                  id="lead-form-first"
                  placeholder="Ex: Foco total em 2 dorms com vaga de moto na Leste"
                  value={firstImpression}
                  onChange={(e) => setFirstImpression(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-950 font-bold focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Notas Adicionais / Comentários (Always footer text-area) */}
          <div className="space-y-1 pt-1">
            <label htmlFor="lead-form-notes" className="block text-[10px] font-mono font-black text-zinc-700 uppercase font-sans">Notas Operacionais / Observações Extras do Atendimento</label>
            <textarea
              id="lead-form-notes"
              rows={2}
              placeholder="Digite o resumo extra desse lead, conversas anteriores, dores e termos comerciais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2 text-xs text-zinc-950 font-semibold focus:bg-white outline-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t-2 border-zinc-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 border-2 border-zinc-950 hover:bg-zinc-200 text-zinc-900 font-black rounded-xl text-[10px] uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-[10px] font-black rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{lead ? 'Gravar Alterações' : 'Adicionar Lead Operacional'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
