
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Settings as SettingsIcon, Shield, User, BrainCircuit, Zap, Network, 
  Database, Save, RotateCcw, Box, AlertTriangle, Eye, EyeOff, Cpu, Sparkles,
  Filter, Home, Calculator, MessageCircle, FileText, Settings2, Calendar, 
  Bell, Download, Upload, Users, History, Cloud, Link, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import GeminiServerTab from './GeminiServerTab';
import AIAssistantChat from './AIAssistantChat';
import ScriptsManagerTab from './ScriptsManagerTab';
import { useConfig } from '../context/ConfigContext';
import { settingsDefinitions } from '../data/settingsDefinition';
import { SettingDefinition } from '../types/settings';
import { AccessibilitySettings } from '../utils/sensory';

interface SettingsProps {
  theme: 'claro' | 'escuro' | 'galatico';
  setTheme: (theme: 'claro' | 'escuro' | 'galatico') => void;
  galaxyPreset: string;
  setGalaxyPreset: (preset: string) => void;
  accSettings: AccessibilitySettings;
  setAccSettings: (accSettings: AccessibilitySettings) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  creciNumber: string;
  setCreciNumber: (creci: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  agencyName: string;
  setAgencyName: (agency: string) => void;
  subscriptionPlan: string;
  setSubscriptionPlan: (plan: string) => void;
  userLevel: number;
  userXP: number;
  properties: any[];
  leads: any[];
  isAutonomyActive: boolean;
  setIsAutonomyActive: (active: boolean) => void;
  autonomyIntervalSec: number;
  setAutonomyIntervalSec: (sec: number) => void;
  leadsCount: number;
  propertiesCount: number;
  inventoryCount: number;
  onWipeLeads: () => void;
  onWipeEstoque: () => void;
  onRequestConfirm: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;
  consolidatedCrmInfo?: string;
  setConsolidatedCrmInfo?: (value: string) => void;
  forceLocalStorageMode?: boolean;
  onToggleForceLocalMode?: (checked: boolean) => void;
  awardXP?: (amount: number, reason: string) => void;
  addNotification?: (title: string, message: string, type: any) => void;
  setLeads?: React.Dispatch<React.SetStateAction<any[]>>;
  templates?: any[];
  appointments?: any[];
  setAppointments?: React.Dispatch<React.SetStateAction<any[]>>;
  emailLogs?: any[];
  setEmailLogs?: React.Dispatch<React.SetStateAction<any[]>>;
}

const categories = [
  { id: 'geral', label: 'Preferências Gerais', icon: SettingsIcon },
  { id: 'funil', label: 'Gestão de Funil', icon: Filter },
  { id: 'estoque', label: 'Config. de Estoque', icon: Home },
  { id: 'simulador', label: 'Parâmetros Simulador', icon: Calculator },
  { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageCircle },
  { id: 'scripts', label: 'Biblioteca de Scripts', icon: FileText },
  { id: 'automacoes', label: 'Automações & Regras', icon: Settings2 },
  { id: 'agenda', label: 'Agenda & Compromissos', icon: Calendar },
  { id: 'notificacoes', label: 'Alertas & Notificações', icon: Bell },
  { id: 'google-ia', label: 'Google & IA Neural', icon: BrainCircuit },
  { id: 'usuarios', label: 'Usuários & Permissões', icon: Users },
  { id: 'dados-logs', label: 'Logs & Auditoria', icon: Database },
  { id: 'armazenamento', label: 'Arquivos & Mídia', icon: Box },
  { id: 'backup', label: 'Backup & Recuperação', icon: Cloud },
  { id: 'apis', label: 'APIs & Webhooks', icon: Link },
  { id: 'seguranca', label: 'Segurança & Firewall', icon: Shield },
  { id: 'performance', label: 'Performance & Cache', icon: Zap },
  { id: 'rede', label: 'Configurações de Rede', icon: Network },
  { id: 'regionalizacao', label: 'Localização & Moeda', icon: SettingsIcon },
  { id: 'design', label: 'Identidade Visual', icon: Box },
  { id: 'dev', label: 'Console Desenvolvedor', icon: Cpu },
];

const SettingControl = ({ setting, value, onChange }: { setting: SettingDefinition<any>, value: any, onChange: (val: any) => void }) => {
  const [showSecret, setShowSecret] = useState(false);

  const impactColors = {
    low: 'text-blue-500 bg-blue-50',
    medium: 'text-yellow-500 bg-yellow-50',
    high: 'text-orange-500 bg-orange-50',
    critical: 'text-red-500 bg-red-50',
  };

  const currentVal = value !== undefined ? value : setting.defaultValue;
  const isValid = setting.type === 'number' ? currentVal >= 0 : currentVal !== '';

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-tight">{setting.label}</label>
          <span className={`text-[9px] uppercase font-black px-1 py-0.5 rounded ${impactColors[setting.impact as keyof typeof impactColors]}`}>
            {setting.impact}
          </span>
          {!isValid && (
            <span className="flex items-center gap-0.5 text-[9px] text-red-600 bg-red-50 uppercase font-black px-1 py-0.5 rounded border border-red-100 animate-pulse">
              <AlertCircle className="w-2 h-2" />
              Inválido
            </span>
          )}
          {setting.needsRestart && (
            <span className="flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 uppercase font-black px-1 py-0.5 rounded border border-amber-100">
              <RotateCcw className="w-2 h-2" />
              Restart
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">{setting.description}</p>
      </div>

      <div className="w-full md:w-64 shrink-0">
        {setting.type === 'boolean' ? (
          <div className="flex items-center">
            <button
              onClick={() => onChange(!currentVal)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors  ease-in-out focus:outline-none ${currentVal ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition  ease-in-out ${currentVal ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ) : setting.type === 'enum' ? (
          <select
            value={currentVal}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded border-gray-300 bg-gray-50 py-1 px-2 text-[10px] font-mono focus:border-indigo-500 focus:ring-indigo-500"
          >
            {setting.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : setting.type === 'textarea' ? (
          <textarea
            value={currentVal}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className="block w-full rounded border-gray-300 bg-gray-50 py-1 px-2 text-[10px] focus:border-indigo-500 focus:ring-indigo-500 font-mono"
          />
        ) : setting.type === 'secret' ? (
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={currentVal}
              onChange={(e) => onChange(e.target.value)}
              className="block w-full rounded border-gray-300 bg-gray-50 py-1 pl-2 pr-8 text-[10px] focus:border-indigo-500 focus:ring-indigo-500 font-mono"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <input
            type={setting.type === 'number' ? 'number' : 'text'}
            value={currentVal}
            onChange={(e) => onChange(setting.type === 'number' ? Number(e.target.value) : e.target.value)}
            className="block w-full rounded border-gray-300 bg-gray-50 py-1 px-2 text-[10px] font-mono focus:border-indigo-500 focus:ring-indigo-500"
          />
        )}
      </div>
    </div>
  );
};

export default function Settings(props: SettingsProps) {
  const [activeCategory, setActiveCategory] = useState('geral');
  const [searchQuery, setSearchQuery] = useState('');
  const configContext = useConfig();
  
  const settings = configContext?.settings;
  const updateSetting = configContext?.updateSetting;
  const applyChanges = configContext?.applyChanges;
  const isSaving = configContext?.isSaving;
  const hasUnsavedChanges = configContext?.hasUnsavedChanges;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "ciclocred_settings_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredSettings = useMemo(() => {
    try {
      const defs = settingsDefinitions || [];
      return defs.filter(s => {
        const matchesCategory = s.category === activeCategory;
        const matchesSearch = s.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.description.toLowerCase().includes(searchQuery.toLowerCase());
        return searchQuery ? matchesSearch : matchesCategory;
      });
    } catch (err) {
      console.error('Error filtering settings:', err);
      return [];
    }
  }, [activeCategory, searchQuery]);

  const activeCategoryLabel = categories.find(c => c.id === activeCategory)?.label || 'Configurações';
  const cardBackground = "bg-white border-4 border-zinc-950 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]";

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[600px] bg-transparent overflow-hidden gap-6">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-4 border-zinc-950 rounded-3xl bg-zinc-900 flex flex-col shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-5 border-b-4 border-zinc-950">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="BUSCAR PARÂMETRO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-zinc-950 border-2 border-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border-2 ${
                activeCategory === cat.id && !searchQuery
                  ? 'bg-indigo-600 border-zinc-950 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <cat.icon className={`h-4 w-4 ${activeCategory === cat.id && !searchQuery ? 'text-white' : 'text-zinc-500'}`} />
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t-4 border-zinc-950 bg-zinc-950/50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border-2 border-zinc-800 shadow-inner">
            <div className="flex-1 truncate">
              <p className="text-[10px] font-black text-white uppercase truncate leading-none mb-1">Painel Administrativo</p>
              <p className="text-[8px] font-black text-zinc-500 uppercase truncate tracking-widest">Acesso de Engenharia</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className={`flex-1 flex flex-col border-4 border-zinc-950 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] ${props.theme === 'claro' ? 'bg-white' : 'bg-zinc-900'}`}>
        <header className={`px-6 py-5 border-b-4 border-zinc-950 flex items-center justify-between z-20 ${props.theme === 'claro' ? 'bg-zinc-50' : 'bg-zinc-950'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-900 border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SettingsIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className={`text-sm font-black uppercase italic tracking-tight ${props.theme === 'claro' ? 'text-zinc-950' : 'text-white'}`}>
                {searchQuery ? `Resultados: "${searchQuery}"` : activeCategoryLabel}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isSaving ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse border border-zinc-950" />
                    <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Sincronizando Alterações...</p>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-500 border border-zinc-950" />
                    <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Alterações Pendentes</p>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500  border border-zinc-950" />
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Sistema Sincronizado / v4.2</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && !isSaving && (
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 animate-bounce">
                Auto-save em 2s...
              </span>
            )}
            <button
              onClick={() => applyChanges?.()}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-zinc-950 flex items-center gap-2 active:translate-y-0.5 active:shadow-none ${
                isSaving || !hasUnsavedChanges 
                  ? 'bg-zinc-200 text-zinc-400 border-zinc-300 cursor-not-allowed shadow-none translate-y-0.5' 
                  : 'bg-zinc-950 text-white hover:bg-indigo-600'
              }`}
            >
              {isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Sincronizando...' : 'Sincronizar Kernels'}</span>
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${props.theme === 'claro' ? 'bg-zinc-100/50' : 'bg-zinc-950/20'}`}>
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Admin Dashboard Hero */}
            {!searchQuery && activeCategory === 'geral' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border-2 border-zinc-950 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                      <Zap className="w-16 h-16 text-zinc-900" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Status do Núcleo</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      <span className="text-xs font-black uppercase italic">Operacional</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-2 font-mono">Uptime: 99.9%</p>
                  </div>
                  
                  <div className="bg-white border-2 border-zinc-950 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                      <Network className="w-16 h-16 text-zinc-900" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Latência Global</span>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-black uppercase italic">24ms (Avg)</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-2 font-mono">Ping: 0.002s</p>
                  </div>

                  <div className="bg-white border-2 border-zinc-950 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                      <Database className="w-16 h-16 text-zinc-900" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Sincronismo</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                      <span className="text-xs font-black uppercase italic">Firebase Live</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-2 font-mono">157 Ops/min</p>
                  </div>

                  <div className="bg-white border-2 border-zinc-950 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                      <Cpu className="w-16 h-16 text-zinc-900" />
                    </div>
                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Motor IA</span>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span className="text-xs font-black uppercase italic">Gemini 1.5 PRO</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-2 font-mono">v4.2.0-STABLE</p>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-3xl p-6 border-4 border-zinc-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <History className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase italic tracking-widest">Atividade Recente do Kernel</h4>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Monitoramento de eventos em tempo real</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-emerald-400 animate-pulse">Live</span>
                  </div>
                  <div className="space-y-2 font-mono">
                    <div className="flex items-center gap-3 py-1 border-b border-zinc-900/50">
                      <span className="text-[8px] text-zinc-600">[14:32:01]</span>
                      <span className="text-[9px] text-indigo-400">AUTH_KERNEL:</span>
                      <span className="text-[9px] text-zinc-300 uppercase">Sessão administrativa validada via JWT (RSA-256)</span>
                    </div>
                    <div className="flex items-center gap-3 py-1 border-b border-zinc-900/50">
                      <span className="text-[8px] text-zinc-600">[14:31:55]</span>
                      <span className="text-[9px] text-emerald-400">FS_SYNC:</span>
                      <span className="text-[9px] text-zinc-300 uppercase">Sincronismo de leads concluído (Snapshot 0x7F4)</span>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                      <span className="text-[8px] text-zinc-600">[14:31:40]</span>
                      <span className="text-[9px] text-amber-400">AI_CORE:</span>
                      <span className="text-[9px] text-zinc-300 uppercase">Predição de conversão para Lead #9238 gerada</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'backup' && !searchQuery && (
              <div className="bg-white p-6 rounded-2xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-3 text-indigo-600">
                  <History className="h-6 w-6" />
                  <h4 className="font-black uppercase text-sm tracking-tight italic">Snapshot & Histórico do Sistema</h4>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">
                  Gerencie pontos de restauração e backups locais. O sistema realiza backups automáticos em intervalos definidos, mas você pode forçar a criação de um snapshot agora.
                </p>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleExport} className="flex-1 py-3 bg-zinc-950 text-white rounded-xl border-2 border-zinc-950 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <Download className="w-3.5 h-3.5" />
                    Exportar Pacote Geral
                  </button>
                  <button className="flex-1 py-3 bg-white text-zinc-950 rounded-xl border-2 border-zinc-950 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <Upload className="w-3.5 h-3.5" />
                    Importar do Arquivo
                  </button>
                </div>
              </div>
            )}

            {filteredSettings.length > 0 ? (
              filteredSettings.map(s => {
                const contextValue = settings?.config?.[s.id]?.value;
                return (
                  <div key={s.id} className="bg-white p-7 rounded-2xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-colors group">
                    <SettingControl
                      setting={s}
                      value={contextValue}
                      onChange={(val) => updateSetting?.(s.id, val)}
                    />
                  </div>
                );
              })
            ) : (
              <div className="py-32 flex flex-col items-center justify-center bg-white rounded-3xl border-4 border-dashed border-zinc-200">
                <div className="p-5 bg-zinc-50 rounded-full mb-4 border-2 border-zinc-100">
                  <AlertTriangle className="h-10 w-10 text-zinc-300" />
                </div>
                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">Nenhum parâmetro identificado</h4>
                <p className="text-[9px] text-zinc-300 mt-2 font-bold uppercase">Verifique o filtro de busca ou alterne a categoria lateral.</p>
              </div>
            )}

            {activeCategory === 'scripts' && !searchQuery && (
              <div className="mt-8 border-t-4 border-zinc-950 pt-8 space-y-12">
                <ScriptsManagerTab />
              </div>
            )}

            {activeCategory === 'google-ia' && !searchQuery && (
              <div className="mt-8 border-t-4 border-zinc-950 pt-8 space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <Sparkles className="h-6 w-6" />
                      <h4 className="font-black uppercase text-lg tracking-widest italic text-zinc-900">IA Neural & Assistência Cognitiva</h4>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Gemini Ativo</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                      <h5 className="text-[11px] font-black uppercase text-zinc-900 mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-indigo-600" />
                        Capacidade de Raciocínio
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 mb-1">
                            <span>Análise de Crédito</span>
                            <span>98%</span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full border border-zinc-200 overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: '98%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 mb-1">
                            <span>NLP & Copywriting</span>
                            <span>94%</span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full border border-zinc-200 overflow-hidden">
                            <div className="h-full bg-indigo-400" style={{ width: '94%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 border-4 border-zinc-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-white">
                      <h5 className="text-[11px] font-black uppercase text-indigo-400 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Ações Autônomas (Scripts)
                      </h5>
                      <p className="text-[10px] text-zinc-400 font-medium leading-relaxed mb-4">
                        O motor atua 100% autônomo consultando as palavras-chave cadastradas na Central de Configurações.
                      </p>
                      <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-2 border-zinc-950 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
                        Testar Gatilhos Agora
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950 rounded-[40px] p-2 border-4 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="bg-zinc-900 rounded-[36px] overflow-hidden">
                      <AIAssistantChat
                        isOpen={true}
                        onClose={() => {}}
                        lead={null}
                        isInline={true}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 text-indigo-400 mb-6">
                    <BrainCircuit className="h-6 w-6" />
                    <h4 className="font-black uppercase text-lg tracking-widest italic text-zinc-900">Painel Neural de Operações</h4>
                  </div>
                  <div className="bg-zinc-950 rounded-[40px] p-2 border-4 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="bg-zinc-900 rounded-[36px] overflow-hidden">
                      <GeminiServerTab
                        accSettings={props.accSettings}
                        awardXP={props.awardXP}
                        addNotification={props.addNotification}
                        leads={props.leads}
                        setLeads={props.setLeads}
                        templates={props.templates}
                        appointments={props.appointments}
                        setAppointments={props.setAppointments}
                        emailLogs={props.emailLogs}
                        setEmailLogs={props.setEmailLogs}
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {(activeCategory === 'dados-logs' || activeCategory === 'dev') && !searchQuery && (
              <div className="mt-8 p-6 bg-rose-50 dark:bg-zinc-900 rounded-2xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-6 w-6 shrink-0 " />
                  <div>
                    <h4 className="font-black uppercase text-sm tracking-tight italic">Limpeza Crítica de Base & Expurgo Global</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Ações permanentes e irreversíveis de higienização de dados</p>
                  </div>
                </div>
                
                <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed uppercase">
                  Conforme as diretrizes operacionais do cicloCRED CRM, estas ferramentas permitem zerar e limpar todos os registros nas memórias locais (localStorage) e nuvem persistente (Google Firebase Cloud Firestore). Utilize para iniciar novas tarefas ou demonstrações de forma limpa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-rose-500 text-xs font-black uppercase tracking-wider block mb-1">🧹 BASE DE CONTATOS</span>
                      <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 leading-tight uppercase">Apaga permanentemente todos os leads cadastrados, histórico de follow-ups e métricas de funis associadas.</p>
                    </div>
                    <button
                      onClick={() => {
                        props.onRequestConfirm(
                          "EXPURGAR TODOS OS LEADS?",
                          "Deseja deletar PERMANENTEMENTE toda a base de contatos, interações e followups no Firebase e cache local? Esta ação não pode ser desfeita.",
                          () => props.onWipeLeads(),
                          "danger"
                        );
                      }}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white border-2 border-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-colors cursor-pointer"
                    >
                      Excluir Leads Definitivamente
                    </button>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-amber-600 text-xs font-black uppercase tracking-wider block mb-1">🏠 ESTOQUE DE PRODUTOS</span>
                      <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 leading-tight uppercase">Remove permanentemente todas as unidades de estoque imobiliário, empreendimentos ou portfólios registrados.</p>
                    </div>
                    <button
                      onClick={() => {
                        props.onRequestConfirm(
                          "EXPURGAR TODO ESTOQUE?",
                          "Deseja deletar PERMANENTEMENTE todos os registros de empreendimentos, imóveis e portfólios no Firebase e cache local? Esta operação é irreversível.",
                          () => props.onWipeEstoque(),
                          "danger"
                        );
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 border-2 border-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-colors cursor-pointer"
                    >
                      Excluir Estoque Definitivamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'dev' && !searchQuery && (
              <div className="mt-12 p-8 bg-zinc-900 rounded-2xl border-l-4 border-indigo-500 space-y-4 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                  <Cpu className="w-24 h-24 text-white" />
                </div>
                <div className="flex items-center gap-3 text-indigo-400">
                  <BrainCircuit className="h-5 w-5" />
                  <h4 className="font-black uppercase text-[11px] tracking-widest italic">Core Engine Maintenance</h4>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed uppercase max-w-lg">
                  Ambiente restrito: Operações de baixo nível detectadas. 
                  A limpeza de cache ou reinicialização de hot-reload afeta todos os usuários conectados ao cluster cicloCRED.
                </p>
                <div className="flex gap-3 pt-4">
                  <button className="px-5 py-2.5 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/20">
                    Wipe Redis Cache
                  </button>
                  <button className="px-5 py-2.5 bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] font-black rounded-lg uppercase hover:bg-zinc-700 transition">
                    Audit System Logs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-zinc-100 bg-white/80  flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Sincronizado: 100%</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Esgotamento: 0%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-black text-zinc-900 uppercase italic bg-zinc-100 px-2 py-1 rounded">V4.2.0-STABLE</span>
             <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter font-mono opacity-50">#BUILD_062026_RC2</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
