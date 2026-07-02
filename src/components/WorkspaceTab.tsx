import React, { useState } from "react";
import { 
  Globe, 
  Map, 
  Youtube, 
  Database, 
  Plus, 
  X, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ExternalLink,
  Layout,
  Chrome
} from "lucide-react";
import GoogleWorkspace from "./GoogleWorkspace";
import { Lead, Appointment, EmailTemplate, EmailLog } from "../types";
import { AccessibilitySettings, triggerSensoryFeedback } from "../utils/sensory";

type TabData = {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
};

interface WorkspaceTabProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  templates: EmailTemplate[];
  emailLogs: EmailLog[];
  setEmailLogs: React.Dispatch<React.SetStateAction<EmailLog[]>>;
  awardXP: (amount: number, reason?: string) => void;
  addNotification: (title: string, message: string, type: any) => void;
  accSettings: AccessibilitySettings;
}


export function WorkspaceTab(props: WorkspaceTabProps) {
  const defaultUrl = "https://www.google.com/webhp?igu=1";

  // Desktop App State
  const [activeApp, setActiveApp] = useState<'browser' | 'google-workspace'>('browser');
  
  // Browser State
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "1",
      url: defaultUrl,
      title: "Google Search",
      history: [defaultUrl],
      historyIndex: 0
    }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [urlInput, setUrlInput] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const createTab = (url: string = defaultUrl, title: string = "Nova Guia") => {
    triggerSensoryFeedback("click", props.accSettings);
    const newTab: TabData = {
      id: Math.random().toString(36).substr(2, 9),
      url: url,
      title: title,
      history: [url],
      historyIndex: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput(url === defaultUrl ? "" : url);
    setActiveApp('browser');
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      const newTab: TabData = {
        id: Math.random().toString(36).substr(2, 9),
        url: defaultUrl,
        title: "Nova Guia",
        history: [defaultUrl],
        historyIndex: 0
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
      setUrlInput("");
    } else {
      if (id === activeTabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
        setUrlInput(newTabs[newTabs.length - 1].url);
      }
      setTabs(newTabs);
    }
  };

  const switchTab = (id: string) => {
    setActiveTabId(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setUrlInput(tab.url);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      setLoadError(null);
      let finalUrl = urlInput.trim();
      
      const isUrl = /^https?:\/\//i.test(finalUrl) || 
                   /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(finalUrl);

      if (isUrl) {
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`;
        }
      } else {
        finalUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
      }

      let proxyUrl = finalUrl;
      if (proxyUrl.includes('google.com') && !proxyUrl.includes('igu=1')) {
        proxyUrl += proxyUrl.includes('?') ? '&igu=1' : '?igu=1';
      }

      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          const newHistory = t.history.slice(0, t.historyIndex + 1);
          newHistory.push(proxyUrl);
          return {
            ...t,
            url: proxyUrl,
            title: finalUrl,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        }
        return t;
      }));
      setUrlInput(finalUrl);
    } catch (err: any) {
      setLoadError("Erro na navegação. Tente novamente.");
    }
  };

  const launchQuickApp = (url: string, title: string) => {
    triggerSensoryFeedback("click", props.accSettings);
    let finalUrl = url;
    if (finalUrl.includes('google.com') && !finalUrl.includes('igu=1')) {
      finalUrl += finalUrl.includes('?') ? '&igu=1' : '?igu=1';
    }
    
    const existing = tabs.find(t => t.url.includes(url.split('?')[0]));
    if (existing) {
      setActiveTabId(existing.id);
      setActiveApp('browser');
      setUrlInput(existing.url);
    } else {
      createTab(finalUrl, title);
    }
  };

  const goBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const newIndex = t.historyIndex - 1;
        const newUrl = t.history[newIndex];
        setUrlInput(newUrl);
        return { ...t, url: newUrl, historyIndex: newIndex };
      }
      return t;
    }));
  };

  const goForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const newIndex = t.historyIndex + 1;
        const newUrl = t.history[newIndex];
        setUrlInput(newUrl);
        return { ...t, url: newUrl, historyIndex: newIndex };
      }
      return t;
    }));
  };

  const reloadIframe = () => {
    setIframeKey(k => k + 1);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-transparent text-zinc-100 overflow-hidden font-sans select-none gap-4 p-4 md:p-6 lg:p-8">
      
      {/* FLOATING GLASS DOCK (NAVEGADOR E GOOGLE WORKSPACE SELETOR) */}
      <div className="flex lg:flex-col items-center justify-between lg:justify-start gap-4 p-3 rounded-2xl bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-2xl shrink-0 z-40 lg:w-20">
        <div className="flex lg:flex-col items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/30 rounded-xl flex items-center justify-center border border-indigo-500/30 shadow-md">
            <Layout className="text-indigo-400 w-5 h-5" />
          </div>
          <div className="hidden lg:block h-[1px] w-8 bg-white/10" />
        </div>

        <div className="flex lg:flex-col gap-3 items-center">
          {/* Navegador Interno Mode */}
          <button 
            onClick={() => setActiveApp('browser')}
            className={`p-2.5 rounded-xl transition-all border ${
              activeApp === 'browser' 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 shadow-lg scale-105' 
                : 'bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
            title="Navegador Integrado"
          >
            <Globe className="w-5.5 h-5.5" />
          </button>

          {/* Google Workspace CRM Integration Mode */}
          <button 
            onClick={() => setActiveApp('google-workspace')}
            className={`p-2.5 rounded-xl transition-all border ${
              activeApp === 'google-workspace' 
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 shadow-lg scale-105' 
                : 'bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
            title="Google Workspace CRM"
          >
            <Database className="w-5.5 h-5.5" />
          </button>

          <div className="h-4 w-[1px] lg:h-[1px] lg:w-8 bg-white/10" />

          {/* Quick Apps shortcuts (floating widgets load inside Browser) */}
          <button 
            onClick={() => launchQuickApp("https://www.google.com/maps?igu=1", "Google Maps")}
            className="p-2.5 bg-transparent border border-transparent text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Google Maps"
          >
            <Map className="w-5 h-5" />
          </button>

          <button 
            onClick={() => launchQuickApp("https://www.youtube.com/embed?listType=search&list=ciclocred", "YouTube Music")}
            className="p-2.5 bg-transparent border border-transparent text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="YouTube"
          >
            <Youtube className="w-5 h-5" />
          </button>

          <button 
            onClick={() => launchQuickApp("https://www.google.com/search?q=ciclocred+crm&igu=1", "Google Search")}
            className="p-2.5 bg-transparent border border-transparent text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Google Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="lg:mt-auto">
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400/80 hidden lg:block text-center mt-2">
            vOS
          </div>
        </div>
      </div>

      {/* FLOATING GLASS VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-30">
        
        {activeApp === 'browser' ? (
          <div className="flex-1 flex flex-col bg-zinc-950/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden min-h-[480px]">
            {/* Browser Tabs Bar */}
            <div className="flex items-end px-3 pt-3 bg-zinc-950/50 gap-1.5 overflow-x-auto shrink-0 border-b border-white/5">
              <div className="flex items-center gap-1.5 ml-1 mb-2.5 mr-4 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-end gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => switchTab(tab.id)}
                      className={`group flex items-center justify-between gap-2 px-3.5 py-1.5 min-w-[140px] max-w-[220px] cursor-pointer rounded-t-xl transition-all border-t border-x ${
                        isActive 
                          ? "bg-zinc-900/80 border-white/10 text-white z-10 relative shadow-[0_-4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Chrome className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="text-[10px] font-bold truncate tracking-tight">{tab.title}</span>
                      </div>
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className={`p-0.5 rounded-full hover:bg-white/10 transition-colors ${isActive ? "text-zinc-300" : "text-transparent group-hover:text-zinc-500"}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => createTab()}
                className="p-1.5 mb-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all shrink-0"
                title="Abrir Nova Guia"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Browser Navigation Bar (Barra de Busca Inteligente - "Barra do Burro") */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-zinc-900/80 backdrop-blur-md border-b border-white/10 shrink-0 shadow-[0_4px_20px_0_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={goBack} 
                    disabled={activeTab.historyIndex <= 0} 
                    className={`p-2 rounded-xl transition-all ${activeTab.historyIndex > 0 ? "bg-white/5 hover:bg-white/10 text-zinc-100 hover:scale-105 active:scale-95" : "text-zinc-600 cursor-not-allowed opacity-40"}`}
                    title="Voltar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={goForward} 
                    disabled={activeTab.historyIndex >= activeTab.history.length - 1} 
                    className={`p-2 rounded-xl transition-all ${activeTab.historyIndex < activeTab.history.length - 1 ? "bg-white/5 hover:bg-white/10 text-zinc-100 hover:scale-105 active:scale-95" : "text-zinc-600 cursor-not-allowed opacity-40"}`}
                    title="Avançar"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={reloadIframe} 
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-100 hover:scale-105 active:scale-95 transition-all"
                    title="Recarregar"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Micro Google Environment Indicator */}
                <div className="flex items-center gap-1 bg-zinc-950/60 px-2.5 py-1.5 rounded-xl border border-white/5 text-[10px] select-none shrink-0 font-mono">
                  <span className="text-blue-400 font-black">G</span>
                  <span className="text-red-400 font-black">o</span>
                  <span className="text-yellow-400 font-black">o</span>
                  <span className="text-blue-400 font-black">g</span>
                  <span className="text-green-400 font-black">l</span>
                  <span className="text-red-400 font-black">e</span>
                  <span className="text-zinc-400 font-bold ml-1.5 text-[8px] uppercase tracking-widest bg-zinc-800/80 px-1 py-0.5 rounded-md">CRM.Link</span>
                </div>
              </div>

              {/* Floating Address Bar ("Barra do Burro") */}
              <form onSubmit={handleSearch} className="flex-1 flex items-center min-w-0">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Digite um URL completo ou pesquise no Google (ex: google.com)..."
                    className="w-full bg-zinc-950/90 border-2 border-white/10 text-zinc-100 rounded-2xl py-2 pl-10 pr-24 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/15 transition-all text-xs font-mono tracking-wide placeholder-zinc-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  />
                  
                  {/* Floating Action Hint */}
                  <div className="absolute inset-y-1 right-1 flex items-center gap-1 pr-1 pointer-events-none select-none">
                    <span className="hidden sm:inline-block text-[8px] font-black uppercase text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-1 rounded-lg font-mono">
                      barra de busca ⚡
                    </span>
                  </div>
                </div>
              </form>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(activeTab.url, '_blank')} 
                  className="p-2 bg-indigo-600/20 hover:bg-indigo-600/35 border-2 border-indigo-500/30 rounded-2xl text-indigo-300 hover:text-indigo-100 flex items-center gap-2 px-4 text-[10px] font-black uppercase tracking-widest shrink-0 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-lg"
                  title="Abrir em Nova Aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Externo
                </button>
              </div>
            </div>

            {/* Browser Iframe Area */}
            <div className="flex-1 bg-zinc-950/40 relative overflow-hidden">
              {tabs.map((tab) => (
                <iframe
                  key={`${tab.id}-${iframeKey}`}
                  src={tab.url}
                  className={`absolute inset-0 w-full h-full border-0 bg-transparent ${tab.id === activeTabId ? "block" : "hidden"}`}
                  title={`vOS Browser ${tab.id}`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-zinc-950/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6 overflow-y-auto custom-scrollbar">
            {/* Elegant Header Area inside Workspace Suite */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <span>Google Workspace CRM Suite</span>
                </h2>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Sincronizador de Dados de Alta Performance</p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Conectado
              </div>
            </div>

            <GoogleWorkspace 
              leads={props.leads}
              setLeads={props.setLeads}
              appointments={props.appointments}
              setAppointments={props.setAppointments}
              templates={props.templates}
              emailLogs={props.emailLogs}
              setEmailLogs={props.setEmailLogs}
              awardXP={(xp) => props.awardXP(xp)}
              addNotification={(t, m, ty) => props.addNotification(t, m, ty)}
              accSettings={props.accSettings}
            />
          </div>
        )}

      </div>
    </div>
  );
}

