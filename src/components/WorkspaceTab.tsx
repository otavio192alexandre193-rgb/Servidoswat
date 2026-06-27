import React, { useState, useEffect } from "react";

type TabData = {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
};

export function WorkspaceTab() {
  const defaultUrl = "https://www.google.com/webhp?igu=1";

  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "1",
      url: defaultUrl,
      title: "Nova Guia",
      history: [defaultUrl],
      historyIndex: 0
    }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [urlInput, setUrlInput] = useState("");
  const [iframeKey, setIframeKey] = useState(0);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const createTab = () => {
    const newTab: TabData = {
      id: Math.random().toString(36).substr(2, 9),
      url: defaultUrl,
      title: "Nova Guia",
      history: [defaultUrl],
      historyIndex: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput("");
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

  const [loadError, setLoadError] = useState<string | null>(null);

  // Validação robusta de URL com useEffect
  useEffect(() => {
    const validateInternalUrl = async () => {
      if (!activeTab || !activeTab.url) return;
      
      try {
        setLoadError(null);
        const urlObj = new URL(activeTab.url);
        // Se for um link inválido ou com protocolo não suportado
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          setLoadError("Protocolo de URL não suportado. Use http:// ou https://");
        }
      } catch (err) {
        setLoadError("A URL fornecida parece estar incorreta ou malformada.");
      }
    };

    validateInternalUrl();
  }, [activeTab?.url]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      setLoadError(null);
      let finalUrl = urlInput.trim();
      
      // Check if it's a URL
      const isUrl = /^https?:\/\//i.test(finalUrl) || 
                   /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(finalUrl);

      if (isUrl) {
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`;
        }
      } else {
        // Use Bing to avoid Google reCAPTCHA inside iframe which blocks navigation
        finalUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
      }

      // If it's a direct Google URL, ensure it has igu=1 so it embeds.
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
      console.error("Erro na navegação:", err);
      setLoadError("Não foi possível acessar este link. Tente digitar novamente.");
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
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-zinc-100 overflow-hidden pb-10 font-sans">
      {/* Chrome Tabs Bar */}
      <div className="flex items-end px-2 pt-2 bg-[#1a1a1a] gap-1 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 ml-1 mb-2 mr-2">
          {/* Mock Window Controls */}
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors cursor-pointer" />
        </div>

        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`group flex items-center justify-between gap-2 px-3 py-1.5 min-w-[140px] max-w-[240px] cursor-pointer rounded-t-lg transition-colors border-t border-x ${
                isActive 
                  ? "bg-[#2b2b2b] border-[#3a3a3a] text-white z-10 relative" 
                  : "bg-transparent border-transparent text-zinc-400 hover:bg-[#2a2a2a]"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-4 h-4 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-[9px]">🌐</span>
                </div>
                <span className="text-xs truncate">{tab.title}</span>
              </div>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className={`p-0.5 rounded hover:bg-zinc-700/50 transition-colors ${isActive ? "text-zinc-300" : "text-transparent group-hover:text-zinc-400"}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}

        <button 
          onClick={createTab}
          className="p-1.5 ml-1 mb-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Nova guia"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Chrome Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-[#2b2b2b] border-b border-[#3a3a3a] shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button 
            onClick={goBack} 
            disabled={activeTab.historyIndex <= 0}
            className={`p-1.5 rounded-full transition-colors ${activeTab.historyIndex > 0 ? "hover:bg-zinc-700 text-zinc-300" : "text-zinc-600 cursor-not-allowed"}`} 
            title="Voltar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={goForward} 
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className={`p-1.5 rounded-full transition-colors ${activeTab.historyIndex < activeTab.history.length - 1 ? "hover:bg-zinc-700 text-zinc-300" : "text-zinc-600 cursor-not-allowed"}`} 
            title="Avançar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            onClick={reloadIframe} 
            className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-300 transition-colors" 
            title="Recarregar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex-1 flex items-center mx-2 max-w-4xl">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-[10px] text-zinc-400 group-focus-within:text-zinc-300 font-bold">🔒</span>
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Pesquise no Google ou digite um URL..."
              className="w-full bg-[#1a1a1a] focus:bg-[#1a1a1a] hover:bg-[#202020] border-transparent focus:border-blue-500 text-zinc-200 rounded-full py-1.5 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500 transition-colors text-sm"
            />
          </div>
        </form>

        <div className="flex items-center">
          <button 
            onClick={() => window.open(activeTab.url, '_blank')}
            className="p-1.5 rounded-full hover:bg-zinc-700 text-blue-400 transition-colors flex items-center gap-1.5 px-3 text-xs font-bold" 
            title="Abrir em Nova Aba Externa se a página não carregar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden sm:inline">Nova Aba Externa</span>
          </button>
        </div>
      </div>

      {/* Browser Environment */}
      <div className="flex-1 bg-white relative w-full h-full">
        {/* Warning if blocked */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-100/50 pointer-events-none z-0">
          {loadError ? (
            <>
              <svg className="w-12 h-12 mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-600">Erro ao carregar a página</p>
              <p className="text-xs text-red-500 mt-1 max-w-sm text-center">
                {loadError}
              </p>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 mb-3 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <p className="text-sm font-medium">O site será carregado aqui</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm text-center">
                Nota: Vários sites possuem restrições de segurança que impedem exibição interna. Caso uma página dê erro ou fique em branco, utilize o botão "Abrir em Nova Aba Externa".
              </p>
            </>
          )}
        </div>

        {/* We use an iframe to simulate the browser environment */}
        {tabs.map((tab) => (
          <iframe
            key={`${tab.id}-${iframeKey}`}
            src={loadError && tab.id === activeTabId ? "about:blank" : tab.url}
            className={`absolute inset-0 w-full h-full border-0 z-10 ${loadError && tab.id === activeTabId ? 'bg-transparent pointer-events-none' : 'bg-white'} ${tab.id === activeTabId ? "block" : "hidden"}`}
            title={`Workspace Browser ${tab.id}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        ))}
      </div>
    </div>
  );
}
