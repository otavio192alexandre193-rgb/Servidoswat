/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Sparkles, 
  Type, 
  Palette, 
  FileText, 
  Copy, 
  Check, 
  Globe, 
  Compass, 
  ShieldAlert,
  Moon,
  Sun,
  Flame,
  User,
  Coffee,
  Award,
  ShieldCheck,
  Building2,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Sliders,
  Edit2,
  Trash,
  PlusCircle,
  Save,
  X
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback, SensoryAction } from '../utils/sensory';

interface SettingsProps {
  theme: 'claro' | 'escuro' | 'galatico';
  setTheme: (t: 'claro' | 'escuro' | 'galatico') => void;
  galaxyPreset: string;
  setGalaxyPreset: (p: string) => void;
  accSettings: AccessibilitySettings;
  setAccSettings: (s: AccessibilitySettings) => void;
  userName: string;
  setUserName: (n: string) => void;
  userEmail: string;
  setUserEmail: (e: string) => void;
  creciNumber: string;
  setCreciNumber: (c: string) => void;
  userRole: string;
  setUserRole: (r: string) => void;
  agencyName: string;
  setAgencyName: (a: string) => void;
  subscriptionPlan?: string;
  setSubscriptionPlan?: (p: string) => void;
  userLevel: number;
  userXP: number;
  properties: any[];
  leads: any[];
  isAutonomyActive?: boolean;
  setIsAutonomyActive?: (active: boolean) => void;
  autonomyIntervalSec?: number;
  setAutonomyIntervalSec?: (sec: number) => void;
  leadsCount: number;
  propertiesCount: number;
  inventoryCount: number;
  onWipeLeads: () => void;
  onWipeEstoque: () => void;
  onRequestConfirm?: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;
}

export default function SettingsView({
  theme,
  setTheme,
  galaxyPreset,
  setGalaxyPreset,
  accSettings,
  setAccSettings,
  userName,
  setUserName,
  userEmail,
  setUserEmail,
  creciNumber,
  setCreciNumber,
  userRole,
  setUserRole,
  agencyName,
  setAgencyName,
  subscriptionPlan = 'Premium VIP',
  setSubscriptionPlan = () => {},
  userLevel,
  userXP,
  properties = [],
  leads = [],
  isAutonomyActive = true,
  setIsAutonomyActive = () => {},
  autonomyIntervalSec = 45,
  setAutonomyIntervalSec = () => {},
  leadsCount,
  propertiesCount,
  inventoryCount,
  onWipeLeads,
  onWipeEstoque,
  onRequestConfirm
}: SettingsProps) {
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // GALAXY LABELS & GRAPHICS FOR THE "LINEACK" MULTIPLE GALAXY PRESENTS
  const galaxyClusters = [
    { id: 'andromeda', name: 'Andrômeda Prime 🌀', desc: 'Nebulosas violetas, violeta-claro e poeira estelar cintilante.' },
    { id: 'virgo', name: 'Superaglomerado Virgem ⭐', desc: 'Azul ciano espacial, supernovas e distorções magnéticas.' },
    { id: 'cartwheel', name: 'Roda de Carro Gravitacional 🌌', desc: 'Aurora boreal galática, feixes ultravioleta e buraco negro lúdico.' },
    { id: 'lineack', name: 'Lineack Conector Magnético ⚡', desc: 'Aglomerado total de galáxias unidas por pontes de plasma neon.' }
  ];

  // COPYWRITING SCRIPTS STATE FOR SALES & CREDITS
  const [copywritingScripts, setCopywritingScripts] = useState<{ id: string; title: string; category: string; text: string; }[]>(() => {
    try {
      const saved = localStorage.getItem('ciclocred_copywriting_scripts');
      if (saved) {
        let loaded = JSON.parse(saved);
        // Desenviesar saved scripts if they have the hardcoded name "cicloCRED"
        loaded = loaded.map((s: any) => {
          if (typeof s.text === 'string') {
            s.text = s.text.replace(/cicloCRED/g, agencyName);
          }
          if (typeof s.title === 'string') {
            s.title = s.title.replace(/ - WhatsApp cicloCRED/g, ' - WhatsApp');
          }
          return s;
        });
        return loaded;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'script-1',
        title: 'Abordagem Comercial - WhatsApp',
        category: 'Prospecção Fria',
        text: `Olá [Nome do Lead], tudo bem? Me chamo ${userName}, sou especialista de crédito credenciado com CRECI ${creciNumber} na ${agencyName}.\n\nVi que você simulou as taxas para ampliação Patrimonial Imobiliária. Conseguimos liberar uma linha especial com aprovação rápida e taxas de financiamento abaixo da inflação.\n\nVocê teria 5 minutos para entendermos seu projeto?`
      },
      {
        id: 'script-2',
        title: 'Apresentação de Imóvel com Financiamento Integrado',
        category: 'Real Estate Broker',
        text: `Olá [Nome do Lead], excelente dia!\n\nSelecionei um imóvel do portfólio da ${agencyName} que se enquadra perfeitamente no perfil que conversamos.\n\nO melhor de tudo: Conseguimos subsidiar o financiamento para você quitar o saldo devedor de forma facilitada. Parcelamento de obras que cabe no bolso!\n\nPodemos marcar uma reunião?`
      },
      {
        id: 'script-3',
        title: 'Quebra de Objeções: "A taxa está alta"',
        category: 'Contorno de Objeções',
        text: `Entendo perfeitamente sua preocupação com custos, [Nome do Lead].\n\nNo entanto, na ${agencyName} operamos com tabelas de subsídios MCMV e simulações com amortização facilitada, reduzindo sensivelmente os juros acumulados.\n\nPodemos simular sua renda familiar para ver os subsídios operantes?`
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ciclocred_copywriting_scripts', JSON.stringify(copywritingScripts));
  }, [copywritingScripts, userName, creciNumber, agencyName]);

  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editingScriptForm, setEditingScriptForm] = useState({ title: '', category: '', text: '' });
  const [isAddingScript, setIsAddingScript] = useState(false);
  const [addScriptForm, setAddScriptForm] = useState({ title: '', category: '', text: '' });

  const handleStartEditScript = (script: typeof copywritingScripts[0]) => {
    setEditingScriptId(script.id);
    setEditingScriptForm({ title: script.title, category: script.category, text: script.text });
    setIsAddingScript(false);
  };

  const handleSaveEditScript = () => {
    if (!editingScriptForm.title.trim() || !editingScriptForm.text.trim()) return;
    setCopywritingScripts(prev => prev.map(s => s.id === editingScriptId ? { ...s, ...editingScriptForm } : s));
    setEditingScriptId(null);
    triggerSensoryFeedback('success', accSettings);
  };

  const handleDeleteScript = (id: string) => {
    if (confirm("Deseja realmente excluir este script?")) {
      setCopywritingScripts(prev => prev.filter(s => s.id !== id));
      triggerSensoryFeedback('alarm', accSettings);
    }
  };

  const handleCreateScript = () => {
    if (!addScriptForm.title.trim() || !addScriptForm.text.trim()) return;
    const newScript = {
      id: `script-${Date.now()}`,
      title: addScriptForm.title,
      category: addScriptForm.category || 'Atendimento Geral',
      text: addScriptForm.text
    };
    setCopywritingScripts(prev => [...prev, newScript]);
    setIsAddingScript(false);
    setAddScriptForm({ title: '', category: '', text: '' });
    triggerSensoryFeedback('success', accSettings);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    triggerSensoryFeedback('complete', accSettings);
    setTimeout(() => setCopiedScriptId(null), 3000);
  };

  const updateSetting = (key: keyof AccessibilitySettings, val: any) => {
    const updated = { ...accSettings, [key]: val };
    setAccSettings(updated);
    setTimeout(() => {
      triggerSensoryFeedback('click', updated);
    }, 50);
  };

  const handleSaveCorporateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSensoryFeedback('success', accSettings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4500);
  };

  // Portfolio aggregates
  const totalPropertiesValue = properties.reduce((acc, p) => acc + (p.price || 0), 0);
  const totalCompletedLeadsNum = leads.filter(l => l.status === 'fechado').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. MASTER UNIFIED HEADER */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono font-black text-indigo-600 tracking-wider block">Central de Administração do Operador</span>
          <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-zinc-950 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Administração, Conta & Configurações</span>
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Gerencie seus dados de credenciamento CRECI, perfil corporativo, preferências de acessibilidade e limpezas operacionais do CRM.</p>
        </div>
      </div>

      {/* 2. OPERATOR EXPERIENCE & CARD ROW (MAPPED FROM ADMINACCOUNT) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* User Badge Card (7 Columns) */}
        <div className="md:col-span-7 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-4 flex justify-center">
            {/* Initials badge avatar */}
            <div className="w-24 h-24 rounded-2xl bg-indigo-600 border-4 border-zinc-950 flex items-center justify-center text-white font-black text-3xl uppercase tracking-widest shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] select-none">
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="sm:col-span-8 space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="text-[10px] font-mono font-black uppercase text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded">
                ★ {userRole}
              </span>
              <span className="text-[10px] font-mono font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                ✓ Credenciado {creciNumber}
              </span>
            </div>
            
            <h3 className="text-xl font-black text-zinc-950 uppercase italic tracking-tight">{userName}</h3>
            <p className="text-xs text-zinc-500 font-bold font-mono">{userEmail}</p>

            <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-zinc-650 font-extrabold mt-1">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>{agencyName}</span>
            </div>
          </div>
        </div>

        {/* Level Progression Card (5 Columns) */}
        <div className="md:col-span-5 bg-zinc-900 text-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-mono font-black text-indigo-400">Progresso de Produtividade</span>
              <h4 className="text-lg font-black font-sans uppercase italic tracking-tight">Galaxy Nível {userLevel}</h4>
            </div>
            <span className="p-2 border-2 border-zinc-950 bg-zinc-800 rounded-xl text-indigo-400">
              <Award className="w-5 h-5 text-indigo-400 font-black animate-pulse" />
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-3 border-t border-zinc-800 mt-2">
            <div className="flex justify-between text-[10px] font-mono font-black">
              <span>Experiência Acumulada: {userXP} / 5000 XP</span>
              <span className="text-indigo-300">{(userXP / 5000 * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-950">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(userXP / 5000 * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase text-zinc-450 border-t border-zinc-800 pt-2.5 mt-2">
            <span>Plano Ativo: <strong className="text-indigo-400">{subscriptionPlan}</strong></span>
            <span className="text-emerald-400 font-black">✓ SITUAÇÃO REGULAR</span>
          </div>
        </div>

      </div>

      {/* 3. CORE EDITING & PARAMETERS BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMN 1: INTEGRATED PROFILE & COLOR COSMOS */}
        <div className="space-y-6">
          
          {/* Complete Profile Form */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">1. Dados do Credenciamento</h3>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-[10px] text-emerald-800 font-black animate-scaleIn">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Dados atualizados com sucesso no dispositivo!</span>
              </div>
            )}

            <form onSubmit={handleSaveCorporateProfile} className="space-y-3.5 text-xs text-left text-zinc-950">
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Nome de Exibição *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">E-mail de Trabalho *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Registro Profissional (CRECI)</label>
                <input
                  type="text"
                  value={creciNumber}
                  onChange={(e) => setCreciNumber(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none"
                  placeholder="Ex: CRECI 12345-F"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Cargo de Atuação</label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Nome da Corretora / Empresa</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black uppercase tracking-wider rounded-xl cursor-pointer text-[10px] text-center transition active:translate-y-0.5"
              >
                Gravar Credenciais
              </button>
            </form>
          </div>

          {/* Theme selection card */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <Palette className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">2. Paletas & Preset Galáctico</h3>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => { setTheme('claro'); triggerSensoryFeedback('chime', accSettings); }}
                  className={`py-2 px-1 rounded-xl border-2 border-zinc-950 text-center flex flex-col items-center justify-center gap-1 transition-all ${theme === 'claro' ? 'bg-zinc-100 font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]' : 'bg-white font-bold text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-[8px] font-mono uppercase">Claro</span>
                </button>

                <button
                  onClick={() => { setTheme('escuro'); triggerSensoryFeedback('chime', accSettings); }}
                  className={`py-2 px-1 rounded-xl border-2 border-zinc-950 text-center flex flex-col items-center justify-center gap-1 transition-all ${theme === 'escuro' ? 'bg-zinc-900 text-white font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]' : 'bg-white font-bold text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-[8px] font-mono uppercase">Escuro</span>
                </button>

                <button
                  onClick={() => { setTheme('galatico'); triggerSensoryFeedback('chime', accSettings); }}
                  className={`py-2 px-1 rounded-xl border-2 border-zinc-950 text-center flex flex-col items-center justify-center gap-1 transition-all ${theme === 'galatico' ? 'bg-indigo-950 text-indigo-200 border-indigo-400 font-black shadow-[1.5px_1.5px_0px_0px_rgba(99,102,241,1)]' : 'bg-white font-bold text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <Flame className="w-4 h-4 text-violet-500" />
                  <span className="text-[8px] font-mono uppercase">Neon</span>
                </button>
              </div>

              {theme === 'galatico' && (
                <div className="p-3 bg-indigo-950/45 border-2 border-indigo-300 rounded-xl space-y-2 animate-fadeIn mt-2">
                  <span className="text-[8px] font-mono font-black uppercase text-indigo-400 block tracking-widest leading-none">Aglomerados Galácticos Connected</span>
                  <div className="space-y-1">
                    {galaxyClusters.map(cl => (
                      <button
                        key={cl.id}
                        type="button"
                        onClick={() => { setGalaxyPreset(cl.id); triggerSensoryFeedback('click', accSettings); }}
                        className={`w-full text-left p-1.5 px-2.5 rounded border text-[9px] font-mono transition-all ${galaxyPreset === cl.id ? 'bg-indigo-900 border-indigo-400 text-white font-black' : 'bg-indigo-980 border-indigo-900/40 text-indigo-300 hover:border-indigo-750'}`}
                      >
                        {cl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: SENSORY ACCESSIBILITY & CRITICAL SETTINGS */}
        <div className="space-y-6">
          
          {/* Sensory Accessibility Panel */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <Volume2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">3. Cockpit Sensorial & Sons</h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sound toggle */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 select-none">
                <div className="flex items-center gap-2">
                  {accSettings.enableSound ? <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                  <div>
                    <p className="font-extrabold uppercase text-[10px] text-zinc-800">Sintetizador Web Audio</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">Retorno auditivo das ações</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('enableSound', !accSettings.enableSound)}
                  className={`p-1 px-2.5 rounded text-[9px] font-black uppercase border-2 border-zinc-950 ${accSettings.enableSound ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500'}`}
                >
                  {accSettings.enableSound ? 'Ativo' : 'Mutado'}
                </button>
              </div>

              {/* Vibration Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 select-none">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-500" />
                  <div>
                    <p className="font-extrabold uppercase text-[10px] text-zinc-800">Vibração háptica</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">Física táctil nos clicks</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('enableVibration', !accSettings.enableVibration)}
                  className={`p-1 px-2.5 rounded text-[9px] font-black uppercase border-2 border-zinc-950 ${accSettings.enableVibration ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500'}`}
                >
                  {accSettings.enableVibration ? 'Sim' : 'Não'}
                </button>
              </div>

              {/* Screen Pulse Flash toggle */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 select-none">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-extrabold uppercase text-[10px] text-zinc-800">Pulso Luminoso Neon</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">Borda da tela pisca em sucessos</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('visualPulse', !accSettings.visualPulse)}
                  className={`p-1 px-2.5 rounded text-[9px] font-black uppercase border-2 border-zinc-950 ${accSettings.visualPulse ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500'}`}
                >
                  {accSettings.visualPulse ? 'Ligado' : 'Desligado'}
                </button>
              </div>

              {/* Font Size adjustments */}
              <div className="space-y-1.5 pt-2 border-t">
                <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Tamanho de Letra (Acessibilidade)</label>
                <div className="grid grid-cols-3 gap-1 px-0.5">
                  {(['normal', 'large', 'extra-large'] as const).map(sz => (
                    <button
                      key={sz}
                      onClick={() => updateSetting('fontSizeClass', sz)}
                      className={`py-1.5 text-[10px] uppercase font-mono font-black rounded border-2 border-zinc-950 ${accSettings.fontSizeClass === sz ? 'bg-zinc-950 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-zinc-500'}`}
                    >
                      {sz === 'normal' ? 'Normal' : sz === 'large' ? 'Grande' : 'Letra G'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Autonomy Setting Panel */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-100 bg-zinc-950 p-3 rounded-2xl">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="text-left leading-none">
                <span className="text-[10px] font-black uppercase font-mono text-indigo-400 block">Monitoramento de Alertas</span>
                <span className="text-[9px] text-zinc-400 mt-0.5">Assistente Inteligente Pragmático</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-left">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <h4 className="font-extrabold text-[10px] text-indigo-950 uppercase font-mono">⚠️ Simulações Automáticas Desativadas</h4>
                <p className="text-[9px] text-indigo-900 leading-normal font-medium">
                  Para proteger a integridade dos seus dados, a criação de leads e alertas fictícios automáticos foi totalmente desligada. 
                  O sistema agora opera <strong className="font-extrabold">exclusivamente sob dados e leads reais</strong> inseridos por você.
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 select-none">
                <div>
                  <h4 className="font-extrabold text-[10px] text-zinc-800">Motor de Análise de Leads</h4>
                  <p className="text-[8.5px] text-zinc-500">Detecta oportunidades nas notas e perfis dos leads rápidos</p>
                </div>
                <div className="p-1 px-2.5 rounded text-[8px] font-black uppercase border border-zinc-300 bg-white text-zinc-400">
                  Operador Real
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: OPERATIONAL METRICS & SALES COPY SCRIPTS */}
        <div className="space-y-6">
          
          {/* Operational Metrics (From old AdminAccount) */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">4. Carteira & Crédito Imobiliário</h3>
            </div>

            <div className="space-y-3 pt-0.5 text-xs">
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-mono font-black text-zinc-500 uppercase block leading-none mb-1">Inventário Comercial</span>
                  <span className="text-xs font-black text-zinc-900">{propertiesCount} Ativos de Negócio</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-500">Valor: R$ {totalPropertiesValue.toLocaleString('pt-BR')}</span>
              </div>

              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-mono font-black text-zinc-500 uppercase block leading-none mb-1">Contratos Imobiliários</span>
                  <span className="text-xs font-black text-zinc-900">{totalCompletedLeadsNum} Casos Consolidados</span>
                </div>
                <span className="text-[9px] font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">Regular</span>
              </div>

              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-mono font-black text-zinc-500 uppercase block leading-none mb-1">Licença Profissional</span>
                  <span className="text-xs font-black text-zinc-900">Credencial COFECI Ativa</span>
                </div>
                <span className="p-1 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </span>
              </div>
            </div>
          </div>

          {/* Copywriting Scripts List - Scripts rápidos */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-3.5">
            <div className="border-b pb-3 flex items-center justify-between gap-2 text-zinc-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-wider font-mono">5. Scripts rápidos</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingScript(prev => !prev);
                  setEditingScriptId(null);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border-2 border-zinc-950 rounded-xl text-[9px] font-mono font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-700" />
                <span>Criar Script</span>
              </button>
            </div>

            {/* Form for adding script */}
            {isAddingScript && (
              <div className="p-3 bg-indigo-50/40 border-2 border-zinc-950 rounded-xl space-y-2.5 text-left animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-mono font-black uppercase text-zinc-600 block mb-0.5">Título do Script</label>
                    <input
                      type="text"
                      value={addScriptForm.title}
                      onChange={e => setAddScriptForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Abordagem Inicial"
                      className="w-full bg-white border border-zinc-950 p-1 rounded font-sans text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono font-black uppercase text-zinc-600 block mb-0.5">Selo / Categoria</label>
                    <input
                      type="text"
                      value={addScriptForm.category}
                      onChange={e => setAddScriptForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: WhatsApp"
                      className="w-full bg-white border border-zinc-950 p-1 rounded font-sans text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-mono font-black uppercase text-zinc-600 block mb-0.5">Redação do Script</label>
                  <textarea
                    rows={3}
                    value={addScriptForm.text}
                    onChange={e => setAddScriptForm(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Olá [Nome do Lead], como vai?..."
                    className="w-full bg-white border border-zinc-950 p-1.5 rounded font-mono text-[10px] outline-none leading-tight"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingScript(false)}
                    className="px-2 py-1 border border-zinc-950 rounded text-[9px] uppercase font-black font-mono bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateScript}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white border border-zinc-950 rounded text-[9px] uppercase font-black font-mono shadow-[1px_1px_x_rgba(0,0,0,1)]"
                  >
                    Salvar Script
                  </button>
                </div>
              </div>
            )}

            {/* Form for editing script */}
            {editingScriptId && (
              <div className="p-3 bg-amber-50/40 border-2 border-zinc-950 rounded-xl space-y-2.5 text-left animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-mono font-black uppercase text-zinc-600 block mb-0.5">Editar Título</label>
                    <input
                      type="text"
                      value={editingScriptForm.title}
                      onChange={e => setEditingScriptForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white border border-zinc-950 p-1 rounded font-sans text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono font-black uppercase text-zinc-600 block mb-0.5">Editar Categoria</label>
                    <input
                      type="text"
                      value={editingScriptForm.category}
                      onChange={e => setEditingScriptForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white border border-zinc-950 p-1 rounded font-sans text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-mono font-black uppercase text-zinc-600 block mb-0.5">Redação do Script</label>
                  <textarea
                    rows={3}
                    value={editingScriptForm.text}
                    onChange={e => setEditingScriptForm(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full bg-white border border-zinc-950 p-1.5 rounded font-mono text-[10px] outline-none leading-tight"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingScriptId(null)}
                    className="px-2 py-1 border border-zinc-950 rounded text-[9px] uppercase font-black font-mono bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditScript}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white border border-zinc-950 rounded text-[9px] uppercase font-black font-mono shadow-[1px_1px_x_rgba(0,0,0,1)]"
                  >
                    Confirmar Alterações
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[210px] overflow-y-auto pr-1">
              {copywritingScripts.map(script => (
                <div key={script.id} className="p-3 bg-zinc-50 border-2 border-zinc-950 rounded-xl relative space-y-1 text-left">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <span className="text-[7px] font-mono font-black uppercase text-indigo-700 bg-indigo-50 px-1 rounded border border-indigo-200">
                        {script.category}
                      </span>
                      <h4 className="text-[10px] font-black text-zinc-950 uppercase font-mono mt-1">{script.title}</h4>
                    </div>

                    <div className="flex gap-1.5 shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => handleStartEditScript(script)}
                        className="p-1 border border-zinc-900 bg-white rounded hover:bg-zinc-100 transition"
                        title="Editar Script"
                      >
                        <Edit2 className="w-3 h-3 text-zinc-800" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScript(script.id)}
                        className="p-1 border border-zinc-900 bg-rose-50 rounded hover:bg-rose-100 transition"
                        title="Excluir Script"
                      >
                        <Trash className="w-3 h-3 text-rose-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(script.id, script.text)}
                        className={`p-1.5 border border-zinc-950 rounded-lg hover:bg-zinc-100 transition shrink-0 ${copiedScriptId === script.id ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-zinc-800'}`}
                      >
                        {copiedScriptId === script.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 border border-zinc-350 rounded text-[9px] font-mono text-zinc-500 h-[60px] overflow-y-auto whitespace-pre-line leading-tight">
                    {script.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE RESET DADOS */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4">
        <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
          <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-900">⚠️ Zona de Higienização & Limpeza Operacional</h3>
        </div>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          Use estes botões com extrema atenção para expurgar ou reiniciar tabelas temporárias. Estas ações limparão dados locais e serão sincronizadas com o banco persistente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expurgar Leads */}
          <div className="p-4 border-2 border-zinc-950 rounded-2xl bg-rose-50/20 flex flex-col justify-between gap-3 text-left">
            <div>
              <h4 className="text-xs font-black uppercase text-rose-950 font-mono">🗑️ Esvaziar Clientes (Leads)</h4>
              <p className="text-[10px] text-zinc-650 leading-tight font-medium mt-1">Esvazia completamente os {leadsCount} leads cadastrados.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const proceed = () => {
                  onWipeLeads();
                  triggerSensoryFeedback('alarm', accSettings);
                };
                if (onRequestConfirm) {
                  onRequestConfirm(
                    '⚠️ APAGAR TODOS OS LEADS?',
                    `ATENÇÃO: Você está prestes a deletar todos os ${leadsCount} leads do CRM. Esta ação é definitiva e irreversível!`,
                    proceed,
                    'danger'
                  );
                } else if (confirm(`Deseja apagar todos os ${leadsCount} leads?`)) {
                  proceed();
                }
              }}
              className="py-2 px-4 bg-red-650 hover:bg-red-700 text-white font-black uppercase text-[10px] rounded-xl border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Zerar Leads ({leadsCount})
            </button>
          </div>

          {/* Expurgar Estoque */}
          <div className="p-4 border-2 border-zinc-950 rounded-2xl bg-amber-50/20 flex flex-col justify-between gap-3 text-left">
            <div>
              <h4 className="text-xs font-black uppercase text-amber-950 font-mono">🏠 Esvaziar Estoque (Imóveis Y Lotes)</h4>
              <p className="text-[10px] text-zinc-650 leading-tight font-medium mt-1">Expurga {propertiesCount} captações e lotes comerciais.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const proceed = () => {
                  onWipeEstoque();
                  triggerSensoryFeedback('alarm', accSettings);
                };
                if (onRequestConfirm) {
                  onRequestConfirm(
                    '⚠️ APAGAR TODO O ESTOQUE?',
                    `ATENÇÃO: Você está prestes a apagar todos os ${propertiesCount} ativos do estoque. Esta ação não pode ser desfeita!`,
                    proceed,
                    'danger'
                  );
                } else if (confirm(`Deseja esvaziar todo o estoque (${propertiesCount} ativos)?`)) {
                  proceed();
                }
              }}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px] rounded-xl border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Zerar Estoque ({propertiesCount})
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
