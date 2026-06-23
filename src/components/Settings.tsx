
import { useState, useEffect, useMemo } from 'react';
import { Search, Settings as SettingsIcon, Shield, User, BrainCircuit, Zap, Network, Database, Save, RotateCcw, Box, AlertTriangle, Eye, EyeOff, Cpu } from 'lucide-react';
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
}

const categories = [
  { id: 'geral', label: 'Geral', icon: SettingsIcon },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
  { id: 'identidade', label: 'Identidade', icon: User },
  { id: 'google-ia', label: 'Google & IA', icon: BrainCircuit },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'rede', label: 'Rede', icon: Network },
  { id: 'dados-logs', label: 'Dados & Logs', icon: Database },
  { id: 'armazenamento', label: 'Armazenamento', icon: Box },
  { id: 'regionalizacao', label: 'Regionalização', icon: SettingsIcon },
  { id: 'acessibilidade', label: 'Acessibilidade', icon: SettingsIcon },
  { id: 'dev', label: 'Modo Desenvolvedor', icon: Cpu },
  { id: 'design', label: 'Layout & Design', icon: Box },
  { id: 'ambientes', label: 'Ambientes', icon: Network },
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

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-tight">{setting.label}</label>
          <span className={`text-[9px] uppercase font-black px-1 py-0.5 rounded ${impactColors[setting.impact as keyof typeof impactColors]}`}>
            {setting.impact}
          </span>
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
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${currentVal ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${currentVal ? 'translate-x-5' : 'translate-x-0'}`} />
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
              className="w-full pl-10 pr-3 py-3 bg-zinc-950 border-2 border-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
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
            <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-black text-white uppercase italic shadow-md">
              {props.userName?.[0] || 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-[10px] font-black text-white uppercase truncate leading-none mb-1">{props.userName}</p>
              <p className="text-[8px] font-black text-zinc-500 uppercase truncate tracking-widest">{props.userRole}</p>
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
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-zinc-950" />
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Núcleo Central / v4.2</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => applyChanges?.()}
            className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-zinc-950 flex items-center gap-2 active:translate-y-0.5 active:shadow-none"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sincronizar Kernels</span>
          </button>
        </header>

        <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${props.theme === 'claro' ? 'bg-zinc-100/50' : 'bg-zinc-950/20'}`}>
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {activeCategory === 'design' && (
              <div className={`p-8 rounded-2xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6 ${props.theme === 'claro' ? 'bg-white' : 'bg-zinc-900'}`}>
                <div>
                  <h3 className={`text-lg font-black uppercase italic tracking-tighter mb-4 ${props.theme === 'claro' ? 'text-zinc-900' : 'text-zinc-100'}`}>Seletor de Identidade Visual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['claro', 'escuro', 'galatico'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => props.setTheme(t)}
                        className={`p-4 rounded-xl border-4 flex flex-col items-center gap-2 transition-all ${props.theme === t ? 'bg-indigo-600 border-zinc-950 text-white translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : (props.theme === 'claro' ? 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-zinc-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500')}`}
                      >
                        <span className="text-2xl">{t === 'claro' ? '☀️' : t === 'escuro' ? '🌙' : '🌌'}</span>
                        <span className="text-[10px] font-black uppercase">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {props.theme === 'galatico' && (
                  <div className="pt-6 border-t border-zinc-200">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-400">Presets Galácticos</h3>
                    <div className="flex flex-wrap gap-2">
                      {['andromeda', 'orion', 'supernova', 'nebula'].map(p => (
                        <button
                          key={p}
                          onClick={() => props.setGalaxyPreset(p)}
                          className={`px-3 py-2 rounded-lg border-2 text-[9px] font-bold uppercase transition-all ${props.galaxyPreset === p ? 'bg-indigo-500 border-zinc-950 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {filteredSettings.length > 0 ? (
              filteredSettings.map(s => {
                const contextValue = settings?.config?.[s.id]?.value;
                return (
                  <div key={s.id} className="bg-white p-7 rounded-2xl border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all duration-200 group">
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

            {(activeCategory === 'dados-logs' || activeCategory === 'dev') && !searchQuery && (
              <div className="mt-8 p-6 bg-rose-50 dark:bg-zinc-900 rounded-2xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-6 w-6 shrink-0 animate-bounce" />
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
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white border-2 border-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
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
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 border-2 border-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      Excluir Estoque Definitivamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'dev' && !searchQuery && (
              <div className="mt-12 p-8 bg-zinc-900 rounded-2xl border-l-4 border-indigo-500 space-y-4 shadow-2xl relative overflow-hidden group">
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

        <footer className="px-6 py-4 border-t border-zinc-100 bg-white/80 backdrop-blur-md flex items-center justify-between">
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
