import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, 
  RotateCcw, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  FileCheck,
  FileDown,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Play
} from 'lucide-react';
import { Lead, RealEstateProperty, Appointment, InventoryItem, EmailTemplate, Goal, Project } from '../types';
import { triggerSensoryFeedback, AccessibilitySettings } from '../utils/sensory';

interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  leadsCount: number;
  propertiesCount: number;
  appointmentsCount: number;
  data: {
    leads: Lead[];
    properties: RealEstateProperty[];
    appointments: Appointment[];
    inventory: InventoryItem[];
    templates: EmailTemplate[];
    goals: Goal[];
    projects: Project[];
    userXP: number;
    userLevel: number;
  };
}

interface BackupManagerProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  properties: RealEstateProperty[];
  setProperties: React.Dispatch<React.SetStateAction<RealEstateProperty[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  templates: EmailTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  userXP: number;
  setUserXP: React.Dispatch<React.SetStateAction<number>>;
  userLevel: number;
  setUserLevel: React.Dispatch<React.SetStateAction<number>>;
  accSettings: AccessibilitySettings;
  onAddNotification: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  // Trigger delete warning
  onRequestConfirm: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;
}

export default function BackupManager({
  leads,
  setLeads,
  properties,
  setProperties,
  appointments,
  setAppointments,
  inventory,
  setInventory,
  templates,
  setTemplates,
  goals,
  setGoals,
  projects,
  setProjects,
  userXP,
  setUserXP,
  userLevel,
  setUserLevel,
  accSettings,
  onAddNotification,
  onRequestConfirm
}: BackupManagerProps) {
  const [localHistory, setLocalHistory] = useState<BackupSnapshot[]>(() => {
    const saved = localStorage.getItem('ciclocred_system_backups');
    return saved ? JSON.parse(saved) : [];
  });

  const [backupLabel, setBackupLabel] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ciclocred_auto_backup_on') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'backup-list' | 'custom-import-export' | 'automation'>('backup-list');

  // CSV separator helper
  const separator = ';';

  // Persistence for snapshots list
  useEffect(() => {
    localStorage.setItem('ciclocred_system_backups', JSON.stringify(localHistory));
  }, [localHistory]);

  // Handle auto backup effect (on crucial changes)
  useEffect(() => {
    localStorage.setItem('ciclocred_auto_backup_on', String(autoBackupEnabled));
  }, [autoBackupEnabled]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importCsvLeadsRef = useRef<HTMLInputElement>(null);
  const importCsvPropsRef = useRef<HTMLInputElement>(null);

  // Manual Backup trigger
  const handleCreateSnapshot = (labelStr?: string) => {
    const backupName = labelStr || backupLabel.trim() || `Ponto de Restauração - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: backupName,
      leadsCount: leads.length,
      propertiesCount: properties.length,
      appointmentsCount: appointments.length,
      data: {
        leads,
        properties,
        appointments,
        inventory,
        templates,
        goals,
        projects,
        userXP,
        userLevel
      }
    };

    setLocalHistory(prev => [newSnapshot, ...prev]);
    setBackupLabel('');
    triggerSensoryFeedback('success', accSettings);
    onAddNotification(
      '💾 BACKUP LOCAL REALIZADO',
      `O ponto "${backupName}" foi armazenado no banco histórico interno.`,
      'success'
    );
  };

  // Restore snapshot helper
  const handleRestoreSnapshot = (snapshot: BackupSnapshot) => {
    const performRestore = () => {
      const { data } = snapshot;
      if (data.leads) setLeads(data.leads);
      if (data.properties) setProperties(data.properties);
      if (data.appointments) setAppointments(data.appointments);
      if (data.inventory) setInventory(data.inventory);
      if (data.templates) setTemplates(data.templates);
      if (data.goals) setGoals(data.goals);
      if (data.projects) setProjects(data.projects);
      if (typeof data.userXP === 'number') setUserXP(data.userXP);
      if (typeof data.userLevel === 'number') setUserLevel(data.userLevel);

      triggerSensoryFeedback('complete', accSettings);
      onAddNotification(
        '🔄 CRÉDITOS E DADOS RESTAURADOS',
        `O CRM retornou com sucesso ao estado de: ${snapshot.label}.`,
        'success'
      );
    };

    onRequestConfirm(
      'Confirmar Restauração',
      `Atenção: Restaurar o ponto "${snapshot.label}" substituirá todos os leads, imóveis, agendamentos e progresso de gamificação vigentes no momento. Deseja prosseguir?`,
      performRestore,
      'warning'
    );
  };

  // Delete snapshot
  const handleDeleteSnapshot = (id: string, name: string) => {
    onRequestConfirm(
      'Remover Histórico',
      `Deseja realmente excluir permanentemente o ponto de backup "${name}"?`,
      () => {
        setLocalHistory(prev => prev.filter(snap => snap.id !== id));
        triggerSensoryFeedback('warning', accSettings);
        onAddNotification('🗑 BACKUP REMOVIDO', 'Ponto de restauração excluído do armazenamento local.', 'info');
      },
      'danger'
    );
  };

  // Clear all history logs
  const handleClearAllHistory = () => {
    onRequestConfirm(
      'Limpar Todo o Histórico?',
      'Esta ação é irreversível e excluirá todos os pontos de restauração guardados no navegador. Deseja prosseguir?',
      () => {
        setLocalHistory([]);
        triggerSensoryFeedback('alarm', accSettings);
        onAddNotification('💥 HISTÓRICO LIMPO', 'Todos os arquivos locais do banco de backups foram limpos.', 'warning');
      },
      'danger'
    );
  };

  // Export entire CRM package as .json
  const handleDownloadFullJsonBackup = () => {
    const fullState = {
      format: 'ciclocred-crm-backup',
      version: '2.5',
      exportedAt: new Date().toISOString(),
      leads,
      properties,
      appointments,
      inventory,
      templates,
      goals,
      projects,
      userXP,
      userLevel,
      accSettings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ciclocred_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSensoryFeedback('click', accSettings);
    onAddNotification('📥 DOWNLOAD CONCLUÍDO', 'O arquivo JSON completo de backup foi baixado.', 'success');
  };

  // Export entire CRM as a single fully functional HTML with current live data
  const handleDownloadSingleFileHtmlApp = () => {
    const serializedLeads = JSON.stringify(leads);
    const serializedProperties = JSON.stringify(properties);
    const serializedAppointments = JSON.stringify(appointments);

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cicloCRED CRM Portátil - Portfólio Unificado</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #18181b; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #6366f1; }
    .custom-shadow { box-shadow: 4px 4px 0px 0px #09090b; }
    .custom-shadow-sm { box-shadow: 2px 2px 0px 0px #09090b; }
    .neo-border { border: 3px solid #09090b; }
    
    /* Dynamic Theme Styles */
    body.theme-claro { --bg-app: #f4f4f5; --bg-card: #ffffff; --text-main: #18181b; --text-muted: #71717a; --border: #09090b; --primary: #4f46e5; }
    body.theme-escuro { --bg-app: #09090b; --bg-card: #18181b; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: #ffffff; --primary: #6366f1; background-color: #09090b; color: #f4f4f5; }
    body.theme-galatico { --bg-app: #0f172a; --bg-card: #1e293b; --text-main: #f8fafc; --text-muted: #94a3b8; --border: #f43f5e; --primary: #ec4899; background-color: #0f172a; color: #f8fafc; }
    
    body { transition: background-color 0.3s, color 0.3s; }
  </style>
</head>
<body class="theme-escuro bg-zinc-950 text-zinc-100 font-sans tracking-tight min-h-screen flex flex-col">

  <div id="app" class="flex h-screen overflow-hidden w-full">
    <!-- SIDEBAR -->
    <aside class="w-64 bg-zinc-900 border-r-4 border-zinc-950 flex flex-col h-screen text-zinc-100 shrink-0 select-none">
      <div class="p-6 border-b-4 border-zinc-950 bg-zinc-950">
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
          </svg>
          <span class="font-sans font-black tracking-tighter text-2xl uppercase italic text-white">
            Ciclo<span class="text-indigo-400">Cred</span>
          </span>
        </div>
        <p class="text-[9px] text-zinc-400 uppercase tracking-widest font-black mt-1 font-mono">⚡ PORTÁTIL SUPREMO</p>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto" id="sidebar-nav"></nav>

      <!-- Theme Selector inside Sidebar -->
      <div class="p-3 border-t border-zinc-800 bg-zinc-950 space-y-2">
        <label class="text-[9px] font-bold uppercase tracking-wider font-mono text-zinc-400">Paleta do Painel</label>
        <div class="grid grid-cols-3 gap-1">
          <button onclick="setTheme('claro')" class="py-1 px-1.5 bg-zinc-100 text-zinc-900 rounded font-bold text-[8px] uppercase font-mono border border-zinc-950">Claro</button>
          <button onclick="setTheme('escuro')" class="py-1 px-1.5 bg-zinc-800 text-white rounded font-bold text-[8px] uppercase font-mono border border-zinc-950">Escuro</button>
          <button onclick="setTheme('galatico')" class="py-1 px-1.5 bg-rose-950 text-rose-300 rounded font-bold text-[8px] uppercase font-mono border border-zinc-950">Galáctico</button>
        </div>
      </div>

      <div class="p-4 border-t-4 border-zinc-950 bg-zinc-950 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded bg-indigo-500 border-2 border-zinc-900 flex items-center justify-center text-zinc-950 font-black text-xs shadow-sm font-mono shrink-0">OP</div>
          <div class="min-w-0">
            <h4 id="sidebar-op-name" class="text-xs font-black text-white uppercase tracking-wider font-mono truncate">Operador CicloCred</h4>
            <p id="sidebar-op-creci" class="text-[9px] text-zinc-400 font-bold font-mono">CRECI-SP SP349272</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- CONTENT VIEWPORT -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
      <header class="h-16 border-b-4 border-zinc-950 bg-zinc-900 flex items-center justify-between px-6 shrink-0 z-10">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-zinc-950 animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-wider font-mono text-zinc-300">Workspace 100% Offline Local</span>
          </div>
        </div>

        <div class="flex items-center gap-6 text-xs text-zinc-300 font-semibold font-mono">
          <div class="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 border-2 border-zinc-950 rounded-lg shadow-sm">
            <span class="text-indigo-400 font-bold">XP Acumulado:</span>
            <span id="header-xp-val" class="font-bold text-white">${userXP}</span>
            <span class="text-zinc-500">/</span>
            <span class="text-[9px] bg-indigo-500 text-zinc-950 px-1.5 font-sans font-black uppercase rounded">NÍVEL <span id="header-level-val">${userLevel}</span></span>
          </div>
          <span id="running-clock" class="text-zinc-100 font-black">00:00:00</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 space-y-6" id="workspace-view">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-zinc-800 pb-4">
          <div>
            <h1 id="tab-title" class="text-2xl font-black uppercase italic tracking-tighter text-white">Dashboard</h1>
            <p id="tab-desc" class="text-xs text-zinc-450 font-medium">Metas, faturamentos e acompanhamento de clientes ciclocred.</p>
          </div>
          <div id="tab-actions-area"></div>
        </div>

        <div id="tab-host" class="space-y-6"></div>
      </main>
    </div>
  </div>

  <!-- MAIN OPERATOR MODALS -->
  <div id="lead-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-zinc-950/80" onclick="closeLeadModal()"></div>
    <div class="relative w-full max-w-lg bg-zinc-900 border-4 border-zinc-950 rounded-2xl p-6 custom-shadow text-white flex flex-col max-h-[90vh] z-10">
      <div class="flex items-center justify-between border-b-2 border-zinc-800 pb-4 mb-4">
        <h3 id="lead-modal-title" class="font-sans font-black uppercase tracking-tight text-white">CADASTRAR NOVO LEAD</h3>
        <button onclick="closeLeadModal()" class="p-1.5 rounded-lg border-2 border-zinc-950 bg-zinc-800 hover:bg-zinc-700 font-mono text-[10px] font-bold">FECHAR</button>
      </div>
      <form id="lead-form" class="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
        <input type="hidden" id="form-lead-id">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Nome do Comprador *</label>
            <input type="text" id="form-lead-name" required class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Fone WhatsApp *</label>
            <input type="text" id="form-lead-phone" required class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white font-mono">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">E-mail Operacional</label>
            <input type="email" id="form-lead-email" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white font-mono">
          </div>
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Origem do Lead</label>
            <select id="form-lead-source" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white font-bold font-mono">
              <option value="Campanha de Anúncios">Campanha de Anúncios</option>
              <option value="Portal Imobiliário">Portal Imobiliário</option>
              <option value="WhatsApp Direto">WhatsApp Direto</option>
              <option value="Indicação Corporativa">Indicação Corporativa</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Renda Bruta (R$)</label>
            <input type="number" id="form-lead-income" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white font-mono">
          </div>
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Valor Pretendido (R$)</label>
            <input type="number" id="form-lead-value" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white font-mono">
          </div>
          <div class="space-y-1">
            <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Status no Funil</label>
            <select id="form-lead-status" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 text-indigo-400 rounded-lg font-bold font-mono">
              <option value="novo">Novo</option>
              <option value="em_contato">Em Contato</option>
              <option value="proposta">Proposta</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>
        <div class="space-y-1">
          <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Anotações do Cliente</label>
          <textarea id="form-lead-notes" rows="3" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-lg text-white"></textarea>
        </div>
        <div class="pt-4 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
          <button type="button" onclick="closeLeadModal()" class="px-4 py-2.5 bg-zinc-800 border-2 border-zinc-950 rounded-lg font-black hover:bg-zinc-700">CANCELAR</button>
          <button type="submit" class="px-5 py-2.5 bg-indigo-600 border-2 border-zinc-950 text-white rounded-lg font-black hover:bg-indigo-700">SALVAR DADOS</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const STORAGE_PREFIX = 'ciclocred_offline_crm_';
    
    let state = {
      leads: loadFromStorage('leads', ${serializedLeads}),
      properties: loadFromStorage('properties', ${serializedProperties}),
      appointments: loadFromStorage('appointments', ${serializedAppointments}),
      xp: parseInt(loadFromStorage('user_xp', '${userXP}')),
      level: parseInt(loadFromStorage('user_level', '${userLevel}')),
      userName: loadFromStorage('user_name', 'Operador CicloCred'),
      userCreci: loadFromStorage('user_creci', 'CRECI-SP SP349272'),
      activeTab: 'dashboard',
      scoreKids: parseInt(loadFromStorage('kids_score', '0')),
      quizIndex: 0,
      mcmvNews: [
        { title: 'Redução Histórica de Juros Habitacionais Caixa', date: '2026-05-30', snippet: 'Taxas para Faixa 1 caem para patamares históricos de 4.25% para quem tem dependente e FGTS.' },
        { title: 'Ampliação do Teto de Subsídio Federal', date: '2026-05-24', snippet: 'Lançado no diário oficial o novo limite de subsídio habitacional de até R$ 55.000 para famílias qualificadas.' }
      ],
      // CAIXA Amortization Rule table
      table275k: [
        { income: 1700, rateSem: 4.85, finSem: 98615, rateCom: 4.33, finCom: 105162, subsidyCom: 55000, subsidySem: 16500, firstPay: 510 },
        { income: 2000, rateSem: 4.85, finSem: 116711, rateCom: 4.33, finCom: 124459, subsidyCom: 50777, subsidySem: 15233, firstPay: 600 },
        { income: 2500, rateSem: 5.11, finSem: 142339, rateCom: 4.59, finCom: 151626, subsidyCom: 25438, subsidySem: 7631, firstPay: 750 },
        { income: 3000, rateSem: 5.37, finSem: 161640, rateCom: 4.85, finCom: 172003, subsidyCom: 9818, subsidySem: 2945, firstPay: 900 },
        { income: 4000, rateSem: 6.16, finSem: 199670, rateCom: 5.64, finCom: 211812, subsidyCom: 2149, subsidySem: 0, firstPay: 1200 },
        { income: 5000, rateSem: 7.22, finSem: 220000, rateCom: 6.69, finCom: 220000, subsidyCom: 0, subsidySem: 0, firstPay: 1469 }
      ]
    };

    function saveToStorage(key, value) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
    function loadFromStorage(key, fallback) {
      const saved = localStorage.getItem(STORAGE_PREFIX + key);
      if (saved === null) return fallback;
      try { return JSON.parse(saved); } catch (e) { return fallback; }
    }

    function setTheme(t) {
      document.body.className = 'theme-' + t;
      localStorage.setItem(STORAGE_PREFIX + 'layout_theme', t);
    }

    function awardXp(amount) {
      state.xp += amount;
      const requiredXp = state.level * 1000;
      if (state.xp >= requiredXp) {
        state.xp -= requiredXp;
        state.level += 1;
        alert('💥 Nível Operacional Elevado! Você alcançou o Nível ' + state.level + '!');
      }
      saveToStorage('user_xp', state.xp);
      saveToStorage('user_level', state.level);
      document.getElementById('header-xp-val').innerText = state.xp;
      document.getElementById('header-level-val').innerText = state.level;
    }

    const navItems = [
      { id: 'dashboard', name: 'Painel Geral', icon: \`<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>\` },
      { id: 'kanban', name: 'Kanban Funil', icon: \`<path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>\` },
      { id: 'leads_list', name: 'Leads (Filtros)', icon: \`<path d="M4 6h16M4 12h16M4 18h7" />\` },
      { id: 'simulator', name: 'Simulador MCMV', icon: \`<path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>\` },
      { id: 'properties', name: 'Estoque Imóveis', icon: \`<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/>\` },
      { id: 'appointments', name: 'Compromissos', icon: \`<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>\` },
      { id: 'copywriting', name: 'Mídia & Copy AI', icon: \`<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>\` },
      { id: 'kids', name: 'Alavancagem & Finanças', icon: \`<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>\` },
      { id: 'mcmv_news', name: 'Portal Inform', icon: \`<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12m2 4h-4m-4 0h-2"/>\` },
      { id: 'settings', name: 'Configuração', icon: \`<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>\` }
    ];

    function renderSidebar() {
      const el = document.getElementById('sidebar-nav');
      el.innerHTML = '';
      navItems.forEach(item => {
        const active = state.activeTab === item.id;
        const btn = document.createElement('button');
        btn.onclick = () => selectTab(item.id);
        btn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold font-mono transition uppercase tracking-wider border-2 ' + 
          (active ? 'bg-indigo-600 text-white border-zinc-950 shadow-sm' : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800');
        btn.innerHTML = \`<div class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">\${item.icon}</svg><span>\${item.name}</span></div>\`;
        el.appendChild(btn);
      });
    }

    function updateOperatorProfile() {
      document.getElementById('sidebar-op-name').innerText = state.userName;
      document.getElementById('sidebar-op-creci').innerText = 'CRECI-SP ' + state.userCreci;
    }

    function selectTab(id) {
      state.activeTab = id;
      renderSidebar();
      const t = document.getElementById('tab-title');
      const d = document.getElementById('tab-desc');
      const actions = document.getElementById('tab-actions-area');
      actions.innerHTML = '';

      if (id === 'dashboard') {
        t.innerText = 'PAINEL CENTRAL CRM';
        d.innerText = 'Estatísticas de performance cicloCRED em tempo real.';
        actions.innerHTML = \`<button onclick="openLeadModalForCreate()" class="p-2 px-4 bg-indigo-600 text-white font-mono rounded-xl font-bold border-2 border-zinc-950 text-xs shadow-sm capitalize hover:bg-indigo-700">+ ADICIONAR CLIENTE</button>\`;
        renderDashboard();
      } else if (id === 'kanban') {
        t.innerText = 'FUNIL DE PROSPECÇÃO KANBAN';
        d.innerText = 'Arraste ou gerencie o status de aprovação de crédito de seus proponentes.';
        actions.innerHTML = \`<button onclick="openLeadModalForCreate()" class="p-2 px-4 bg-indigo-600 text-white font-mono rounded-xl font-bold border-2 border-zinc-950 text-xs shadow-sm capitalize hover:bg-indigo-700">+ ADICIONAR CLIENTE</button>\`;
        renderKanban();
      } else if (id === 'leads_list') {
        t.innerText = 'HISTÓRICO ATIVO DE CLIENTES';
        d.innerText = 'Pesquise, filtre e edite a ficha completa de seus leads.';
        renderLeadsList();
      } else if (id === 'simulator') {
        t.innerText = 'SIMULADOR HABITACIONAL OFICIAL';
        d.innerText = 'Cálculos de amortização SAC ou PRICE, subsidios e parcelamento Caixa MCMV.';
        renderSimulator();
      } else if (id === 'properties') {
        t.innerText = 'CADASTRO E ESTOQUE DE IMÓVEIS';
        d.innerText = 'Lista residenciais para incorporação e vendas.';
        renderProperties();
      } else if (id === 'appointments') {
        t.innerText = 'AGENDA COMPROMISSOS';
        d.innerText = 'Monitore visitas de obra e reuniões do cicloCRED.';
        renderAppointments();
      } else if (id === 'copywriting') {
        t.innerText = 'MÍDIA & ABORDAGEM DE CLIENTES';
        d.innerText = 'Gere copys inteligentes de WhatsApp prontos para envio.';
        renderCopywriting();
      } else if (id === 'kids') {
        t.innerText = 'ALAVANCAGEM & FINANÇAS';
        d.innerText = 'Calculadora de juros de 1% ao mês e gincanas de investimento estratégico.';
        renderKids();
      } else if (id === 'mcmv_news') {
        t.innerText = 'DIRETRIZES MINHA CASA MINHA VIDA';
        d.innerText = 'Legislação, informativos e regras Caixa fomento.';
        renderMcmvNews();
      } else if (id === 'settings') {
        t.innerText = 'CONFIGURAÇÕES DA INTEGRADORA';
        d.innerText = 'Defina suas credenciais locais e altere nomes operacionais.';
        renderSettings();
      }
    }

    // ==========================================
    // TAB: DASHBOARD
    // ==========================================
    function renderDashboard() {
      const host = document.getElementById('tab-host');
      const leadsCount = state.leads.length;
      const closedCount = state.leads.filter(l => l.status === 'fechado').length;
      const totalVolume = state.leads.reduce((a, b) => a + (parseInt(b.value) || 0), 0);

      host.innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <span class="text-[9px] font-mono uppercase text-zinc-400">Total Leads Capturados</span>
            <h3 class="text-3xl font-black mt-1 text-white">\${leadsCount}</h3>
          </div>
          <div class="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <span class="text-[9px] font-mono uppercase text-zinc-400">Geração de Caixa</span>
            <h3 class="text-3xl font-black text-emerald-400 mt-1">R$ \${(totalVolume/1000).toFixed(0)}k</h3>
          </div>
          <div class="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <span class="text-[9px] font-mono uppercase text-zinc-400">Contratos Assinados</span>
            <h3 class="text-3xl font-black text-indigo-400 mt-1">\${closedCount}</h3>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl">
            <h3 class="font-bold text-sm mb-4 uppercase">Status de Clientes</h3>
            <div id="stat-bars" class="space-y-3 font-mono text-xs"></div>
          </div>

          <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl">
            <h3 class="font-bold text-sm mb-4 uppercase">Agenda Hoje</h3>
            <div id="quick-appts" class="space-y-3 font-mono text-xs"></div>
          </div>
        </div>
      \`;

      // Status Bars Render
      const statuses = ['novo', 'em_contato', 'proposta', 'fechado', 'perdido'];
      const stEl = document.getElementById('stat-bars');
      statuses.forEach(s => {
        const count = state.leads.filter(l => l.status === s).length;
        const pct = leadsCount > 0 ? (count / leadsCount) * 100 : 0;
        stEl.innerHTML += \`
          <div>
            <div class="flex justify-between text-[11px] mb-1 font-bold">
              <span class="uppercase">\${s.replace('_', ' ')}</span>
              <span>\${count} (\${pct.toFixed(0)}%)</span>
            </div>
            <div class="w-full bg-zinc-800 h-2 rounded border border-zinc-950">
              <div class="bg-indigo-500 h-full rounded" style="width: \${pct}%"></div>
            </div>
          </div>
        \`;
      });

      // Quick Appts
      const qEl = document.getElementById('quick-appts');
      if (state.appointments.length === 0) {
        qEl.innerHTML = '<p class="text-zinc-500">Sem compromissos marcados para hoje.</p>';
      } else {
        state.appointments.forEach(ap => {
          qEl.innerHTML += \`
            <div class="p-3 bg-zinc-850 rounded border border-zinc-800 flex justify-between items-center">
              <div>
                <strong class="text-zinc-200">\${ap.time} - \${ap.title}</strong>
                <p class="text-[10px] text-zinc-400 capitalize">Cliente: \${ap.leadName}</p>
              </div>
              <span class="text-[9px] uppercase px-2 py-0.5 bg-indigo-950/50 text-indigo-400 rounded border border-indigo-900 font-bold">\${ap.type}</span>
            </div>
          \`;
        });
      }
    }

    // ==========================================
    // TAB: KANBAN
    // ==========================================
    function renderKanban() {
      const host = document.getElementById('tab-host');
      host.innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl min-h-[450px]" ondragover="allowDrop(event)" ondrop="handleColumnDrop(event, 'novo')">
            <div class="flex justify-between items-center mb-4 border-b-2 border-zinc-950 pb-2">
              <span class="font-bold text-xs uppercase text-zinc-400">ENTRADA (NOVO)</span>
              <span class="bg-zinc-800 text-[10px] px-2 py-0.5 rounded font-black font-mono" id="count-novo">0</span>
            </div>
            <div class="space-y-3" id="kanban-novo"></div>
          </div>

          <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl min-h-[450px]" ondragover="allowDrop(event)" ondrop="handleColumnDrop(event, 'em_contato')">
            <div class="flex justify-between items-center mb-4 border-b-2 border-zinc-950 pb-2">
              <span class="font-bold text-xs uppercase text-indigo-400">EM CONTATO</span>
              <span class="bg-zinc-800 text-[10px] px-2 py-0.5 rounded font-black font-mono" id="count-em_contato">0</span>
            </div>
            <div class="space-y-3" id="kanban-em_contato"></div>
          </div>

          <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl min-h-[450px]" ondragover="allowDrop(event)" ondrop="handleColumnDrop(event, 'proposta')">
            <div class="flex justify-between items-center mb-4 border-b-2 border-zinc-950 pb-2">
              <span class="font-bold text-xs uppercase text-yellow-500">PROPOSTAS</span>
              <span class="bg-zinc-800 text-[10px] px-2 py-0.5 rounded font-black font-mono" id="count-proposta">0</span>
            </div>
            <div class="space-y-3" id="kanban-proposta"></div>
          </div>

          <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl min-h-[450px]" ondragover="allowDrop(event)" ondrop="handleColumnDrop(event, 'fechado')">
            <div class="flex justify-between items-center mb-4 border-b-2 border-zinc-950 pb-2">
              <span class="font-bold text-xs uppercase text-emerald-400">CONTRATOS ✅</span>
              <span class="bg-zinc-800 text-[10px] px-2 py-0.5 rounded font-black font-mono" id="count-fechado">0</span>
            </div>
            <div class="space-y-3" id="kanban-fechado"></div>
          </div>

          <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl min-h-[450px]" ondragover="allowDrop(event)" ondrop="handleColumnDrop(event, 'perdido')">
            <div class="flex justify-between items-center mb-4 border-b-2 border-zinc-950 pb-2">
              <span class="font-bold text-xs uppercase text-red-500">REJEITADO ❌</span>
              <span class="bg-zinc-800 text-[10px] px-2 py-0.5 rounded font-black font-mono" id="count-perdido">0</span>
            </div>
            <div class="space-y-3" id="kanban-perdido"></div>
          </div>
        </div>
      \`;

      const counts = { novo: 0, em_contato: 0, proposta: 0, fechado: 0, perdido: 0 };
      
      state.leads.forEach(l => {
        counts[l.status]++;
        const div = document.createElement('div');
        div.draggable = true;
        div.ondragstart = (e) => handleDragStart(e, l.id);
        div.className = 'bg-zinc-850 p-3 rounded-lg border-2 border-zinc-950 custom-shadow-sm cursor-grab active:cursor-grabbing text-xs hover:border-indigo-500 transition-all group';
        
        div.innerHTML = \`
          <div class="flex justify-between items-start font-bold">
            <h4 class="text-zinc-200 group-hover:text-indigo-400 transition truncate mr-2">\${l.name}</h4>
          </div>
          <p class="text-[10px] text-zinc-400 font-mono mt-1">\${l.phone}</p>
          <div class="flex justify-between items-center mt-3 pt-2 border-t border-zinc-800">
            <span class="text-[10px] font-black text-emerald-400 font-mono">R$ \${parseInt(l.value || 0).toLocaleString('pt-BR')}</span>
            <div class="flex gap-1">
              <button onclick="moveLeadLeft('\${l.id}', '\${l.status}')" class="p-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded text-[9px] font-mono font-bold">&larr;</button>
              <button onclick="openLeadModalForEdit('\${l.id}')" class="p-1 px-1.5 bg-zinc-800 hover:bg-zinc-750 text-indigo-400 rounded text-[9px] font-mono font-bold font-black flex items-center gap-0.5">EDIT</button>
              <button onclick="moveLeadRight('\${l.id}', '\${l.status}')" class="p-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded text-[9px] font-mono font-bold">&rarr;</button>
            </div>
          </div>
        \`;

        const listCol = document.getElementById('kanban-' + l.status);
        if (listCol) listCol.appendChild(div);
      });

      Object.keys(counts).forEach(s => {
        document.getElementById('count-' + s).innerText = counts[s];
      });
    }

    function allowDrop(e) { e.preventDefault(); }
    function handleDragStart(e, id) { e.dataTransfer.setData('text/plain', id); }
    function handleColumnDrop(e, targetStatus) {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const lead = state.leads.find(l => l.id === id);
      if (lead) {
        lead.status = targetStatus;
        saveToStorage('leads', state.leads);
        awardXp(80);
        renderKanban();
      }
    }

    function moveLeadLeft(id, currentStatus) {
      const parent = ['novo', 'em_contato', 'proposta', 'fechado', 'perdido'];
      const idx = parent.indexOf(currentStatus);
      if (idx > 0) {
        const lead = state.leads.find(l => l.id === id);
        if (lead) {
          lead.status = parent[idx - 1];
          saveToStorage('leads', state.leads);
          renderKanban();
        }
      }
    }

    function moveLeadRight(id, currentStatus) {
      const parent = ['novo', 'em_contato', 'proposta', 'fechado', 'perdido'];
      const idx = parent.indexOf(currentStatus);
      if (idx < parent.length - 1) {
        const lead = state.leads.find(l => l.id === id);
        if (lead) {
          lead.status = parent[idx + 1];
          saveToStorage('leads', state.leads);
          renderKanban();
        }
      }
    }

    // ==========================================
    // TAB: LEADS LIST VIEW WITH FILTERS
    // ==========================================
    function renderLeadsList() {
      const host = document.getElementById('tab-host');
      host.innerHTML = \`
        <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl space-y-4">
          <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div class="flex flex-1 gap-2 w-full">
              <input type="text" id="search-input" placeholder="Buscar comprador pelo nome..." oninput="filterTableLeads()" class="flex-1 p-2.5 bg-zinc-850 rounded-xl border-2 border-zinc-950 text-xs">
              <select id="filter-status-select" onchange="filterTableLeads()" class="p-2.5 bg-zinc-850 rounded-xl border-2 border-zinc-950 text-xs font-mono font-bold text-indigo-400">
                <option value="todos font-sans">Todos Status</option>
                <option value="novo">Novo</option>
                <option value="em_contato">Em Contato</option>
                <option value="proposta">Proposta</option>
                <option value="fechado">Fechado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
            <button onclick="openLeadModalForCreate()" class="w-full md:w-auto p-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs uppercase min-w-max rounded-xl border-2 border-zinc-950 custom-shadow-sm">+ Cadastrar Ficha</button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr class="border-b-2 border-zinc-950 text-zinc-400 uppercase text-[9px] tracking-wider">
                  <th class="py-3 px-2">Comprador</th>
                  <th class="py-3 px-2">WhatsApp Fone</th>
                  <th class="py-3 px-2">Origem</th>
                  <th class="py-3 px-2">Budget Máx</th>
                  <th class="py-3 px-2">Renda Mensal</th>
                  <th class="py-3 px-2">Estágio Funil</th>
                  <th class="py-3 px-2 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody id="table-leads-body" class="divide-y divide-zinc-800 text-zinc-100"></tbody>
            </table>
          </div>
        </div>
      \`;
      filterTableLeads();
    }

    function filterTableLeads() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const statusFilter = document.getElementById('filter-status-select').value;
      const b = document.getElementById('table-leads-body');
      b.innerHTML = '';

      state.leads.forEach(l => {
        const matchesQuery = l.name.toLowerCase().includes(q) || l.phone.includes(q);
        const matchesStatus = statusFilter === 'todos font-sans' || l.status === statusFilter;

        if (matchesQuery && matchesStatus) {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-zinc-850 transition';
          tr.innerHTML = \`
            <td class="py-3 px-2 font-sans font-bold text-white">\${l.name}</td>
            <td class="py-3 px-2 text-zinc-400">\${l.phone}</td>
            <td class="py-3 px-2 text-zinc-400 font-sans">\${l.source || 'Manual'}</td>
            <td class="py-3 px-2 text-emerald-400 font-bold">R$ \${parseInt(l.value || 0).toLocaleString('pt-BR')}</td>
            <td class="py-3 px-2 text-zinc-350">R$ \${parseInt(l.income || 0).toLocaleString('pt-BR')}</td>
            <td class="py-3 px-2 capitalize"><span class="px-2 py-0.5 rounded font-black text-[9px] bg-zinc-800 border uppercase border-zinc-700">\${l.status.replace('_', ' ')}</span></td>
            <td class="py-3 px-2 text-right">
              <button onclick="openLeadModalForEdit('\${l.id}')" class="p-1 px-3 bg-indigo-950/40 text-indigo-400 border border-indigo-900 rounded-lg font-bold hover:bg-indigo-900/30 transition text-[9px]">EDITAR</button>
              <button onclick="deleteLead('\${l.id}')" class="p-1 px-2.5 bg-rose-950/20 text-rose-500 border border-rose-900/40 rounded-lg hover:bg-rose-950 hover:text-white font-bold transition text-[9px] ml-1">&times;</button>
            </td>
          \`;
          b.appendChild(tr);
        }
      });
    }

    function deleteLead(id) {
      if (confirm('Deseja realmente remover permanentemente esta ficha de proponente do seu navegador?')) {
        state.leads = state.leads.filter(l => l.id !== id);
        saveToStorage('leads', state.leads);
        if (state.activeTab === 'kanban') renderKanban();
        else renderLeadsList();
      }
    }

    // ==========================================
    // TAB: SIMULATOR (SAC & PRICE CALCULATOR)
    // ==========================================
    function renderSimulator() {
      const host = document.getElementById('tab-host');
      host.innerHTML = \`
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl space-y-4 lg:col-span-1 text-xs">
            <h3 class="font-bold text-sm mb-2 uppercase text-indigo-400">Parâmetros Proponente</h3>
            
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Vincular Cliente Ativo</label>
                <select id="sim-lead-select" onchange="loadLeadToSim()" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl font-bold font-mono">
                  <option value="">-- CLIENTE AVULSO --</option>
                  \${state.leads.map(l => '<option value="' + l.id + '">' + l.name + ' (R$ ' + (l.income||0) + ')</option>').join('')}
                </select>
              </div>

              <div class="space-y-1">
                <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Renda Bruta Unificada CLT (R$)</label>
                <input type="number" id="sim-income-clt" value="4000" oninput="calculateFinancing()" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl font-mono text-white">
              </div>

              <div class="space-y-1">
                <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Idade Proponente</label>
                <input type="number" id="sim-age" value="32" oninput="calculateFinancing()" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl font-mono">
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2">
                <label class="flex items-center gap-2 font-mono text-[10px] font-bold cursor-pointer">
                  <input type="checkbox" id="sim-dependents" onchange="calculateFinancing()" checked class="p-1 rounded"> Possui Dependente
                </label>
                <label class="flex items-center gap-2 font-mono text-[10px] font-bold cursor-pointer">
                  <input type="checkbox" id="sim-fgts" onchange="calculateFinancing()" checked class="p-1 rounded"> 3+ Anos FGTS
                </label>
              </div>

              <div class="space-y-1 pt-2">
                <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Preço Imóvel (R$)</label>
                <input type="number" id="sim-price" value="275000" oninput="calculateFinancing()" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl font-mono text-emerald-400 font-bold">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Amortização</label>
                  <select id="sim-system" onchange="calculateFinancing()" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl font-mono">
                    <option value="SAC">SAC (Decrescente)</option>
                    <option value="PRICE">PRICE (Constante)</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Prazo (Meses)</label>
                  <input type="number" id="sim-months" value="360" min="12" max="420" oninput="calculateFinancing()" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl font-mono">
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 space-y-6">
            <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl relative">
              <h3 class="font-bold text-sm mb-4 uppercase text-emerald-400">Demonstrador de Viabilidade de Crédito Caixa</h3>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
                <div class="bg-zinc-850 p-3 rounded-xl border border-zinc-800">
                  <span class="text-[9px] uppercase text-zinc-400">Financiamento Max</span>
                  <p id="res-financed" class="text-md font-black text-white">R$ 0</p>
                </div>
                <div class="bg-zinc-850 p-3 rounded-xl border border-zinc-800">
                  <span class="text-[9px] uppercase text-zinc-400">Subsídios Caixa</span>
                  <p id="res-subsidy" class="text-md font-black text-emerald-400">R$ 0</p>
                </div>
                <div class="bg-zinc-850 p-3 rounded-xl border border-zinc-800">
                  <span class="text-[9px] uppercase text-zinc-400">Juros Anual (MCMV)</span>
                  <p id="res-rate" class="text-md font-black text-indigo-400">0%</p>
                </div>
                <div class="bg-zinc-850 p-3 rounded-xl border border-zinc-800">
                  <span class="text-[9px] uppercase text-zinc-400">Entrada Exigida</span>
                  <p id="res-downpayment" class="text-md font-black text-rose-400">R$ 0</p>
                </div>
              </div>

              <!-- FACILITADORES CONSTRUTORA -->
              <div class="mt-6 pt-4 border-t border-zinc-800">
                <h4 class="font-bold text-xs uppercase mb-3">Fluxo de Parcelamento de Entrada (Obra)</h4>
                <div class="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div class="bg-zinc-850 p-2.5 rounded border border-zinc-800">
                    <span class="text-[9px] block text-zinc-400 uppercase">Sinal / Ato (60%)</span>
                    <strong class="text-white text-[11px]" id="res-fluxo-ato">R$ 0</strong>
                  </div>
                  <div class="bg-zinc-850 p-2.5 rounded border border-zinc-800">
                    <span class="text-[9px] block text-zinc-400 uppercase">36x Mensais Obra</span>
                    <strong class="text-white text-[11px]" id="res-fluxo-parcela">R$ 0</strong>
                  </div>
                  <div class="bg-zinc-850 p-2.5 rounded border border-zinc-800">
                    <span class="text-[9px] block text-zinc-400 uppercase">Chaves / Conclusão</span>
                    <strong class="text-white text-[11px]" id="res-fluxo-chaves">R$ 0</strong>
                  </div>
                </div>
              </div>

              <div class="mt-6 text-right">
                <button onclick="window.print()" class="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase font-mono text-[10px] tracking-wider border-2 border-zinc-950 custom-shadow-sm inline-flex items-center gap-2">Imprimir Proposta Oficial como PDF</button>
              </div>
            </div>

            <!-- TABELA DE PARCELAS INTEGRADA -->
            <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl">
              <h3 class="font-bold text-sm mb-4 uppercase text-indigo-400">Cronograma Completo de Amortização Mensal</h3>
              <div class="overflow-y-auto max-h-[300px]">
                <table class="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr class="border-b border-zinc-805 uppercase text-[9px] text-zinc-400">
                      <th class="py-2">Mês</th>
                      <th class="py-2">Prestação</th>
                      <th class="py-2">Amortização</th>
                      <th class="py-2">Juros Cobrados</th>
                      <th class="py-2 text-right">Saldo Devedor</th>
                    </tr>
                  </thead>
                  <tbody id="sim-amort-rows"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      \`;
      calculateFinancing();
    }

    function loadLeadToSim() {
      const id = document.getElementById('sim-lead-select').value;
      if (id) {
        const lead = state.leads.find(l => l.id === id);
        if (lead) {
          document.getElementById('sim-income-clt').value = lead.income || 4000;
          document.getElementById('sim-price').value = lead.value || 275000;
          calculateFinancing();
        }
      }
    }

    function calculateFinancing() {
      const income = parseFloat(document.getElementById('sim-income-clt').value) || 3000;
      const age = parseInt(document.getElementById('sim-age').value) || 32;
      const hasDeps = document.getElementById('sim-dependents').checked;
      const hasFgts = document.getElementById('sim-fgts').checked;
      const propertyPrice = parseFloat(document.getElementById('sim-price').value) || 275000;
      const months = Math.min(parseInt(document.getElementById('sim-months').value) || 360, (80 - age) * 12);
      const system = document.getElementById('sim-system').value;

      let subsidy = 0;
      let interestRate = 5.5; 
      let financed = propertyPrice * 0.8;

      // Find closest rule matching income from table 275k
      const matchedRow = state.table275k.reduce((prev, curr) => 
        Math.abs(curr.income - income) < Math.abs(prev.income - income) ? curr : prev
      );

      interestRate = hasFgts ? matchedRow.rateCom : matchedRow.rateSem;
      subsidy = hasDeps ? matchedRow.subsidyCom : matchedRow.subsidySem;
      financed = Math.min(propertyPrice * 0.8, hasFgts ? matchedRow.finCom : matchedRow.finSem);

      if (propertyPrice !== 275000) {
        // scale logic
        const scale = propertyPrice / 275000;
        financed = Math.min(propertyPrice * 0.8, financed * scale);
        subsidy = Math.min(propertyPrice * 0.2, subsidy);
      }

      const totalDown = Math.max(0, propertyPrice - financed - subsidy);

      document.getElementById('res-financed').innerText = 'R$ ' + Math.ceil(financed).toLocaleString('pt-BR');
      document.getElementById('res-subsidy').innerText = 'R$ ' + Math.ceil(subsidy).toLocaleString('pt-BR');
      document.getElementById('res-rate').innerText = interestRate.toFixed(2) + '% a.a.';
      document.getElementById('res-downpayment').innerText = 'R$ ' + Math.ceil(totalDown).toLocaleString('pt-BR');

      // Installment calculation structures
      const tableBody = document.getElementById('sim-amort-rows');
      tableBody.innerHTML = '';

      const monthlyRate = (interestRate / 100) / 12;
      let balance = financed;
      let firstPay = 0;

      for (let i = 1; i <= Math.min(months, 36); i++) {
        let amort = 0;
        let interest = balance * monthlyRate;
        let pmt = 0;

        if (system === 'SAC') {
          amort = financed / months;
          pmt = amort + interest;
        } else {
          // PRICE system
          pmt = financed * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
          amort = pmt - interest;
        }

        if (i === 1) firstPay = pmt;
        balance -= amort;

        tableBody.innerHTML += \`
          <tr class="border-b border-zinc-800/40">
            <td class="py-2">\${i}</td>
            <td class="py-2 font-bold text-white">R$ \${Math.ceil(pmt).toLocaleString('pt-BR')}</td>
            <td class="py-2 text-zinc-300">R$ \${Math.ceil(amort).toLocaleString('pt-BR')}</td>
            <td class="py-2 text-rose-400">R$ \${Math.ceil(interest).toLocaleString('pt-BR')}</td>
            <td class="py-2 text-right">R$ \${Math.max(0, Math.ceil(balance)).toLocaleString('pt-BR')}</td>
          </tr>
        \`;
      }

      // Construction downpayment flow
      const ato = totalDown * 0.6;
      const obraMensal = (totalDown * 0.3) / 36;
      const chaves = totalDown * 0.1;

      document.getElementById('res-fluxo-ato').innerText = 'R$ ' + Math.ceil(ato).toLocaleString('pt-BR');
      document.getElementById('res-fluxo-parcela').innerText = 'R$ ' + Math.ceil(obraMensal).toLocaleString('pt-BR') + '/mês';
      document.getElementById('res-fluxo-chaves').innerText = 'R$ ' + Math.ceil(chaves).toLocaleString('pt-BR');
    }

    // ==========================================
    // TAB: COMPROMISSOS
    // ==========================================
    function renderAppointments() {
      const host = document.getElementById('tab-host');
      const list = state.appointments.map(a => \`
        <div class="p-4 bg-zinc-900 border-2 border-zinc-950 custom-shadow-sm rounded-xl flex justify-between items-center text-xs">
          <div>
            <strong class="text-white text-sm font-sans">\${a.time} - \${a.title}</strong>
            <p class="text-[10px] text-zinc-400 font-sans mt-0.5 capitalize">Proponente: \${a.leadName || 'Ficha Externa'}</p>
          </div>
          <div class="flex items-center gap-3 font-mono">
            <span class="text-[9px] p-1 px-2.5 bg-zinc-850 rounded border border-zinc-700 h-fit text-zinc-300">\${a.date}</span>
            <button onclick="deleteAppt('\${a.id}')" class="p-1 px-2 bg-rose-950/40 border border-rose-800 text-rose-500 rounded font-black hover:bg-rose-900 hover:text-white">&times;</button>
          </div>
        </div>
      \`).join('');

      host.innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl text-xs space-y-4">
            <h3 class="font-bold mb-1 uppercase text-indigo-400 text-sm">Marcar Reunião ou Visita</h3>
            <form onsubmit="addAppt(event)" class="space-y-3 font-mono">
              <input type="text" id="ap-t" required placeholder="Título do Compromisso" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
              <div class="grid grid-cols-2 gap-2">
                <input type="date" id="ap-d" required class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
                <input type="time" id="ap-h" required class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
              </div>
              <input type="text" id="ap-c" required placeholder="Nome Proponente" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
              <select id="ap-type" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white font-bold">
                <option value="reuniao">Reunião Formal</option>
                <option value="visita">Vistoria de Obra</option>
                <option value="telefone">Atendimento Telefônico</option>
              </select>
              <button type="submit" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl border-2 border-zinc-950 font-sans font-black tracking-wider uppercase">AGENDAR COMPROMISSO</button>
            </form>
          </div>
          <div class="md:col-span-2 bg-zinc-950 border-4 border-zinc-950 p-6 rounded-2xl space-y-3 overflow-y-auto max-h-[500px]">
            <h3 class="font-sans font-bold text-zinc-300 uppercase text-xs tracking-wider">Acompanhamento Ativo de Trabalho</h3>
            \${list || '<p class="text-zinc-650 text-xs font-mono">Nenhum compromisso pendente no momento.</p>'}
          </div>
        </div>
      \`;
    }

    function addAppt(e) {
      e.preventDefault();
      const title = document.getElementById('ap-t').value;
      const date = document.getElementById('ap-d').value;
      const time = document.getElementById('ap-h').value;
      const leadName = document.getElementById('ap-c').value;
      const type = document.getElementById('ap-type').value;

      state.appointments.unshift({ id: Math.random().toString(), title, date, time, leadName, type });
      saveToStorage('appointments', state.appointments);
      awardXp(120);
      renderAppointments();
    }

    function deleteAppt(id) {
      state.appointments = state.appointments.filter(a => a.id !== id);
      saveToStorage('appointments', state.appointments);
      renderAppointments();
    }

    // ==========================================
    // TAB: PROPERTIES (ESTOQUE)
    // ==========================================
    function renderProperties() {
      const host = document.getElementById('tab-host');
      const cards = state.properties.map(p => \`
        <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl flex flex-col justify-between custom-shadow-sm group text-xs font-mono">
          <div>
            <strong class="text-white text-sm font-sans tracking-tight">\${p.title}</strong>
            <p class="text-zinc-400 text-[10px] uppercase mt-1 leading-relaxed">\${p.location || 'Residencial Próximo'}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-zinc-850 flex justify-between items-center">
            <strong class="text-emerald-400 font-bold text-sm">R$ \${p.price ? p.price.toLocaleString('pt-BR') : '250.000'}</strong>
            <button onclick="loadPropertyToSim(\${p.price})" class="py-1 px-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-950 text-indigo-400 rounded text-[9px] uppercase font-bold">Simular</button>
          </div>
        </div>
      \`).join('');

      host.innerHTML = \`
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">\${cards || 'Nenhum residencial faturado no estoque.'}</div>
      \`;
    }

    function loadPropertyToSim(price) {
      selectTab('simulator');
      document.getElementById('sim-price').value = price;
      calculateFinancing();
    }

    // ==========================================
    // TAB: COPYWRITING GERAL
    // ==========================================
    function renderCopywriting() {
      const host = document.getElementById('tab-host');
      host.innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
          <div class="bg-zinc-900 p-6 border-4 border-zinc-950 rounded-2xl space-y-4">
            <h3 class="font-bold mb-1 uppercase text-indigo-400">Variáveis Cliente</h3>
            <input type="text" id="copy-name" value="Sra. Elaine Silveira" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
            <input type="text" id="copy-prop" value="Residencial das Rosas" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
            
            <button onclick="genDynamicCopy()" class="w-full py-3 bg-indigo-650 text-white font-bold rounded-xl border-2 border-zinc-900 custom-shadow-sm uppercase">GERAR ABORDAGEM OFICIAL WHATSAPP</button>
          </div>
          <div class="md:col-span-2">
            <textarea id="copy-out" rows="12" readonly class="w-full p-4 border-2 border-zinc-950 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs focus:outline-none"></textarea>
          </div>
        </div>
      \`;
      genDynamicCopy();
    }

    function genDynamicCopy() {
      const name = document.getElementById('copy-name').value;
      const prop = document.getElementById('copy-prop').value;
      const text = \`Prezada \${name},\\n\\nTemos o prazer de anunciar que o seu perfil de crédito foi testado e pré-aprovado nas condições do novo programa Minha Casa Minha Vida para o empreendimento *\${prop}*!\\n\\n✨ Subsídios de até R$ 55 mil disponíveis para abatimento imediato.\\n\\nVamos marcar uma simulação real sem custo? Responda Sim.\\n\\nAtenciosamente,\\nEquipe cicloCRED Habitacional\`;
      document.getElementById('copy-out').value = text;
    }

    // ==========================================
    // TAB: ALAVANCAGEM & FINANÇAS SIMULATOR
    // ==========================================
    function renderKids() {
      const host = document.getElementById('tab-host');
      const year1 = Math.round(500 * ((Math.pow(1.01, 12) - 1) / 0.01));
      const year3 = Math.round(500 * ((Math.pow(1.01, 36) - 1) / 0.01));
      
      host.innerHTML = \`
        <div class="bg-zinc-900 border-4 border-zinc-950 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6 text-left">
          <div class="space-y-1">
            <span class="px-2.5 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase font-mono tracking-widest">Acelerador Real</span>
            <h2 class="text-lg font-black uppercase text-white tracking-tight">Simulador de Juros Real Composto (1% a.m.) 🚀</h2>
            <p class="text-zinc-400 text-xs leading-relaxed font-sans">Projete o power de reinvestimento das suas comissões de corretagem em longo prazo de forma segura.</p>
          </div>

          <div class="p-5 bg-zinc-950 border-2 border-zinc-850 rounded-xl space-y-4">
            <div class="flex justify-between items-center text-xs font-mono">
              <span class="text-zinc-400">Reinvestimento Mensal Sugerido:</span>
              <span class="text-white font-black bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-900">R$ 500,00</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-center font-mono">
              <div class="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                <span class="text-[9px] text-zinc-500 block">1 ANO (1% real a.m.)</span>
                <span class="text-md font-black text-emerald-400 block mt-1">R$ \${year1.toLocaleString()}</span>
                <span class="text-[8px] text-zinc-500 block">Reinvestido: R$ 6.000</span>
              </div>
              <div class="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                <span class="text-[9px] text-zinc-500 block">3 ANOS (1% real a.m.)</span>
                <span class="text-md font-black text-amber-400 block mt-1">R$ \${year3.toLocaleString()}</span>
                <span class="text-[8px] text-zinc-500 block">Reinvestido: R$ 18.000</span>
              </div>
            </div>
          </div>

          <div class="p-5 bg-zinc-950 border-2 border-zinc-850 rounded-xl space-y-2">
            <h3 class="text-xs font-black text-white uppercase font-mono">🎯 Gincana Rápida: Mentalidade Corretor</h3>
            <p class="text-[11px] text-zinc-350 font-sans" id="quiz-question">O que o corretor elite faz com os rendimentos das comissões?</p>
            <div class="flex flex-col gap-2 pt-2" id="quiz-options-block">
              <button onclick="answerQuiz(true)" class="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono text-left border border-zinc-700 transition">A) Reinvisto em tráfego pago, CRM, e alavancagem de 1% a.m.</button>
              <button onclick="answerQuiz(false)" class="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono text-left border border-zinc-700 transition">B) Compro supérfluos e mimos no primeiro fechamento de lote</button>
            </div>
          </div>
          <div class="text-[10px] font-mono text-indigo-400">Pontuação de Alavancagem: <strong><span id="kids-score-val">\${state.scoreKids}</span> XP</strong></div>
        </div>
      \`;
    }

    function answerQuiz(isRight) {
      if (isRight) {
        state.scoreKids += 100;
        saveToStorage('kids_score', state.scoreKids);
        alert('⭐ Excelente escolha! Alavancar as comissões gera riqueza real composta! (+100 XP)');
        awardXp(100);
      } else {
        alert('💡 Reinvestir com paciência e método é a chave do sucesso! Vamos tentar de novo.');
      }
      renderKids();
    }

    // ==========================================
    // TAB: PORTAL NEWS / DIRETRIZES
    // ==========================================
    function renderMcmvNews() {
      const host = document.getElementById('tab-host');
      const list = state.mcmvNews.map(n => \`
        <div class="bg-zinc-900 border-2 border-zinc-950 p-4 rounded-xl text-xs space-y-2">
          <div class="flex justify-between font-mono text-[9px] text-zinc-400">
            <span>DIRETRIZ OFICIAL</span>
            <span>\${n.date}</span>
          </div>
          <h4 class="font-bold text-sm text-white font-sans">\${n.title}</h4>
          <p class="text-zinc-400 leading-relaxed font-sans">\${n.snippet}</p>
        </div>
      \`).join('');
      host.innerHTML = \`<div class="space-y-4 max-w-3xl">\${list}</div>\`;
    }

    // ==========================================
    // TAB: SETTINGS & BACKUP snapshot import
    // ==========================================
    function renderSettings() {
      const host = document.getElementById('tab-host');
      host.innerHTML = \`
        <div class="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl max-w-lg space-y-5 text-xs">
          <h3 class="font-bold text-sm uppercase text-indigo-400">Identificação Operador</h3>
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Nome Completo</label>
              <input type="text" id="set-op-name" value="\${state.userName}" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
            </div>
            <div class="space-y-1">
              <label class="block font-black uppercase text-[10px] tracking-wider font-mono">Inscrição CRECI (Opcional)</label>
              <input type="text" id="set-op-creci" value="\${state.userCreci}" class="w-full p-2.5 bg-zinc-850 border-2 border-zinc-950 rounded-xl text-white">
            </div>
            <button onclick="saveOperatorSettings()" class="py-2.5 px-5 bg-indigo-650 text-white font-bold rounded-xl border-2 border-zinc-950 uppercase">SALVAR PERFIL</button>
          </div>

          <div class="pt-5 border-t border-zinc-800 space-y-3">
            <h3 class="font-bold text-sm uppercase text-red-500">Zerar Sistema</h3>
            <p class="text-[10px] text-zinc-400">Esta ação limpa todos os dados salvos em caches locais e de localStorage no seu navegador.</p>
            <button onclick="clearStorage()" class="p-3 bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 font-bold rounded-xl select-none font-mono tracking-wider">APAGAR CACHE DO NAVEGADOR</button>
          </div>
        </div>
      \`;
    }

    function saveOperatorSettings() {
      const name = document.getElementById('set-op-name').value;
      const creci = document.getElementById('set-op-creci').value;
      state.userName = name;
      state.userCreci = creci;
      saveToStorage('user_name', name);
      saveToStorage('user_creci', creci);
      updateOperatorProfile();
      alert('Perfil do Operador atualizado com sucesso!');
    }

    function clearStorage() {
      if (confirm('Deseja realmente limpar toda sua base local de dados do ciclocred? Todos os proponentes, simulados e metas do navegador serão excluídos.')) {
        localStorage.clear();
        location.reload();
      }
    }

    // ==========================================
    // MODAL: FORM FOR LEADS
    // ==========================================
    function openLeadModalForCreate() {
      document.getElementById('lead-modal-title').innerText = 'CADASTRAR NOVO PROPOENTE';
      document.getElementById('form-lead-id').value = '';
      document.getElementById('form-lead-name').value = '';
      document.getElementById('form-lead-phone').value = '';
      document.getElementById('form-lead-email').value = '';
      document.getElementById('form-lead-income').value = '4000';
      document.getElementById('form-lead-value').value = '275000';
      document.getElementById('form-lead-status').value = 'novo';
      document.getElementById('lead-modal').classList.remove('hidden');
    }

    function openLeadModalForEdit(id) {
      const lead = state.leads.find(l => l.id === id);
      if (lead) {
        document.getElementById('lead-modal-title').innerText = 'EDITAR FICHA COMPRADOR';
        document.getElementById('form-lead-id').value = lead.id;
        document.getElementById('form-lead-name').value = lead.name;
        document.getElementById('form-lead-phone').value = lead.phone;
        document.getElementById('form-lead-email').value = lead.email || '';
        document.getElementById('form-lead-income').value = lead.income || 4000;
        document.getElementById('form-lead-value').value = lead.value || 275000;
        document.getElementById('form-lead-status').value = lead.status;
        document.getElementById('lead-modal').classList.remove('hidden');
      }
    }

    function closeLeadModal() {
      document.getElementById('lead-modal').classList.add('hidden');
    }

    document.getElementById('lead-form').onsubmit = function(e) {
      e.preventDefault();
      const id = document.getElementById('form-lead-id').value;
      const name = document.getElementById('form-lead-name').value;
      const phone = document.getElementById('form-lead-phone').value;
      const email = document.getElementById('form-lead-email').value;
      const income = parseInt(document.getElementById('form-lead-income').value) || 4000;
      const value = parseInt(document.getElementById('form-lead-value').value) || 275000;
      const status = document.getElementById('form-lead-status').value;
      const notes = document.getElementById('form-lead-notes').value;

      if (id) {
        // Edit existing
        const idx = state.leads.findIndex(l => l.id === id);
        if (idx !== -1) {
          state.leads[idx] = { ...state.leads[idx], name, phone, email, income, value, status, notes };
        }
      } else {
        // Insert new
        const newLead = {
          id: 'lead-' + Date.now(),
          name, phone, email, income, value, status, notes,
          source: 'Cadastro Humano'
        };
        state.leads.unshift(newLead);
        awardXp(150);
      }

      saveToStorage('leads', state.leads);
      closeLeadModal();

      if (state.activeTab === 'kanban') renderKanban();
      else if (state.activeTab === 'leads_list') renderLeadsList();
      else selectTab('leads_list');
    };

    // Global Initialization & Timer
    setInterval(() => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      document.getElementById('running-clock').innerText = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }, 1000);

    window.onload = () => {
      const savedTheme = localStorage.getItem(STORAGE_PREFIX + 'layout_theme') || 'escuro';
      setTheme(savedTheme);
      updateOperatorProfile();
      selectTab(state.activeTab);
    };
  </script>
</body>
</html>`;

    // Create download link element in React memory
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ciclocred_portatil_completo.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    triggerSensoryFeedback('complete', accSettings);
    onAddNotification(
      '📦 PORTÁTIL EXPORTADO!',
      'O sistema unificado HTML portátil contendo todos os seus dados foi baixado.',
      'success'
    );
  };


  // Upload and restore full JSON file
  const handleUploadFullJsonBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.leads && Array.isArray(parsed.leads)) {
          
          const restoreFromUploaded = () => {
            setLeads(parsed.leads);
            if (parsed.properties) setProperties(parsed.properties);
            if (parsed.appointments) setAppointments(parsed.appointments);
            if (parsed.inventory) setInventory(parsed.inventory);
            if (parsed.templates) setTemplates(parsed.templates);
            if (parsed.goals) setGoals(parsed.goals);
            if (parsed.projects) setProjects(parsed.projects);
            if (typeof parsed.userXP === 'number') setUserXP(parsed.userXP);
            if (typeof parsed.userLevel === 'number') setUserLevel(parsed.userLevel);

            triggerSensoryFeedback('complete', accSettings);
            onAddNotification(
              '🎯 BACKUP RESTAURADO',
              'O CRM foi completamente restaurado com os dados importados do arquivo JSON.',
              'success'
            );
          };

          onRequestConfirm(
            'Confirmar Upload Completo',
            'Deseja sobrescrever todos os dados do seu sistema com as informações contidas neste arquivo de backup?',
            restoreFromUploaded,
            'warning'
          );

        } else {
          alert('Arquivo JSON inválido. Verifique se é um backup correto da cicloCRED.');
        }
      } catch (err) {
        alert('Erro ao decodificar arquivo JSON de backup.');
      }
    };
    fileReader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export Custom CSV for Leads
  const handleExportLeadsToCsv = () => {
    const headers = ['ID', 'Nome', 'E-mail', 'Telefone', 'Origem/Canal', 'Status', 'Valor Potencial (R$)', 'Cadastrado Em'];
    const rows = leads.map(l => [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.origin,
      l.status,
      l.value,
      l.createdAt
    ]);

    // Build CSV Content styled for Latin-1/Excel (Portuguese defaults)
    let csvContent = "\uFEFF"; // BOM for excel
    csvContent += headers.join(separator) + "\n";
    rows.forEach(r => {
      csvContent += r.map(cell => {
        const valStr = String(cell).replace(/"/g, '""');
        return valStr.includes(separator) || valStr.includes('\n') ? `"${valStr}"` : valStr;
      }).join(separator) + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ciclocred_leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerSensoryFeedback('click', accSettings);
    onAddNotification('📈 CSV DE LEADS CONCLUÍDO', 'O arquivo CSV de leads foi exportado com sucesso.', 'success');
  };

  // Export Custom CSV for Real estate Inventory
  const handleExportPropertiesToCsv = () => {
    const headers = ['ID', 'Código', 'Título', 'Tipo', 'Preço (R$)', 'Localização', 'Bairro', 'Status', 'Quartos', 'Suítes', 'Banheiros', 'Vagas', 'Área (m²)', 'Descrição'];
    const rows = properties.map(p => [
      p.id,
      p.code,
      p.title,
      p.type,
      p.price,
      p.location,
      p.neighborhood,
      p.status,
      p.bedrooms,
      p.suites,
      p.bathrooms,
      p.parkingSpaces,
      p.sizeSqm,
      p.description
    ]);

    let csvContent = "\uFEFF"; // BOM
    csvContent += headers.join(separator) + "\n";
    rows.forEach(r => {
      csvContent += r.map(cell => {
        const valStr = String(cell).replace(/"/g, '""');
        return valStr.includes(separator) || valStr.includes('\n') ? `"${valStr}"` : valStr;
      }).join(separator) + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ciclocred_imoveis_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerSensoryFeedback('click', accSettings);
    onAddNotification('🏠 CSV DE IMÓVEIS CONCLUÍDO', 'O estoque imobiliário foi exportado como arquivo CSV.', 'success');
  };

  // Import Leads from Custom CSV
  const handleImportLeadsCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        if (lines.length < 2) {
          alert('O arquivo CSV selecionado parece vazio.');
          return;
        }

        // Simplistic CSV line parser
        const importedLeads: Lead[] = [];
        // Header line represents indices
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split with separator
          const cols = line.split(separator).map(c => {
            // Remove double quotes
            let clean = c.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.substring(1, clean.length - 1);
            }
            return clean.replace(/""/g, '"');
          });

          if (cols.length >= 3) {
            // Match fields: cols[1] Name, cols[2] Email, cols[3] Phone
            const name = cols[1] || `Lead Importado #${Date.now() + i}`;
            const email = cols[2] || 'sem@email.com';
            const phone = cols[3] || '(00) 00000-0000';
            const origin = cols[4] || 'Importação Manual CSV';
            const statusStr = cols[5] || 'novo';
            const valNum = Number(cols[6]) || 250000;

            importedLeads.push({
              id: `lead-import-${Date.now()}-${i}`,
              name,
              email,
              phone,
              origin,
              status: statusStr as any,
              value: valNum,
              notes: '',
              createdAt: new Date().toISOString()
            });
          }
        }

        if (importedLeads.length > 0) {
          setLeads(prev => [...importedLeads, ...prev]);
          triggerSensoryFeedback('complete', accSettings);
          onAddNotification(
            '💥 IMPORTAÇÃO COMPLETA!',
            `${importedLeads.length} novos leads foram anexados à sua carteira ativa com sucesso via CSV.`,
            'success'
          );
        } else {
          alert('Nenhum registro legível encontrado. Certifique-se que o delimitador seja ponto e vírgula (;).');
        }

      } catch (err) {
        alert('Falha crítica ao importar arquivo CSV.');
      }
    };
    fileReader.readAsText(file);
    if (importCsvLeadsRef.current) importCsvLeadsRef.current.value = '';
  };

  // Import Properties from Custom CSV
  const handleImportPropertiesCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        if (lines.length < 2) {
          alert('O arquivo CSV selecionado parece vazio.');
          return;
        }

        const importedProps: RealEstateProperty[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = line.split(separator).map(c => {
            let clean = c.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.substring(1, clean.length - 1);
            }
            return clean.replace(/""/g, '"');
          });

          if (cols.length >= 5) {
            const title = cols[1] || `Estoque Importado #${Date.now() + i}`;
            const type = (cols[2] || 'casa').toLowerCase();
            const price = Number(cols[3]) || 450000;
            const locationVal = cols[4] || 'Endereço Indefinido';
            const status = cols[5] || 'disponivel';
            const bedrooms = Number(cols[6]) || 3;
            const sizeSqm = Number(cols[7]) || 120;

            importedProps.push({
              id: `prop-import-${Date.now()}-${i}`,
              code: `IMP-${Math.floor(Math.random() * 900 + 100)}`,
              title,
              type: type as any,
              price,
              location: locationVal,
              neighborhood: 'Bairro',
              status: status as any,
              bedrooms,
              suites: 1,
              bathrooms: Math.max(bedrooms - 1, 1),
              parkingSpaces: 1,
              sizeSqm,
              description: 'Importado em lote via Central de Backup.'
            });
          }
        }

        if (importedProps.length > 0) {
          setProperties(prev => [...importedProps, ...prev]);
          triggerSensoryFeedback('complete', accSettings);
          onAddNotification(
            '🏡 PROPRIEDADES IMPORTADAS!',
            `${importedProps.length} imóveis adicionados ao Estoque Imobiliário da imobiliária.`,
            'success'
          );
        } else {
          alert('Nenhum imóvel legível detectado no CSV.');
        }

      } catch (err) {
        alert('Erro ao descriptografar CSV de imóveis.');
      }
    };
    fileReader.readAsText(file);
    if (importCsvPropsRef.current) importCsvPropsRef.current.value = '';
  };

  return (
    <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <span className="text-[10px] uppercase font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            🛡️ Inteligência e Segurança Cósmica
          </span>
          <h2 className="text-lg font-black uppercase text-zinc-950 font-mono tracking-tight mt-1.5 flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-indigo-600" />
            <span>Central de Backup, Histórico & Importação/Exportação</span>
          </h2>
          <p className="text-xs text-zinc-500 font-medium font-sans mt-0.5">
            Crie cópias de segurança manuais ou configure automações de logs, exporte faturas/comissões para CSV e restaure versões anteriores do sistema em tempo real.
          </p>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-2 border-zinc-950 bg-zinc-50 p-1 rounded-2xl select-none text-[10px] font-mono font-black uppercase gap-1 max-w-lg">
        <button
          onClick={() => {
            setActiveTab('backup-list');
            triggerSensoryFeedback('click', accSettings);
          }}
          className={`flex-1 py-1.5 text-center rounded-xl transition ${
            activeTab === 'backup-list' ? 'bg-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-550 hover:bg-zinc-150'
          }`}
        >
          ⏱️ Banco Local ({localHistory.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('custom-import-export');
            triggerSensoryFeedback('click', accSettings);
          }}
          className={`flex-1 py-1.5 text-center rounded-xl transition ${
            activeTab === 'custom-import-export' ? 'bg-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-550 hover:bg-zinc-150'
          }`}
        >
          📊 CSV e JSON Sob Medida
        </button>
        <button
          onClick={() => {
            setActiveTab('automation');
            triggerSensoryFeedback('click', accSettings);
          }}
          className={`flex-1 py-1.5 text-center rounded-xl transition ${
            activeTab === 'automation' ? 'bg-zinc-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-550 hover:bg-zinc-150'
          }`}
        >
          🤖 Automações de Cópias
        </button>
      </div>

      {/* TAB 1: LOCAL SNAPSHOTS */}
      {activeTab === 'backup-list' && (
        <div className="space-y-4 animate-scaleIn text-xs">
          
          {/* Snap Input creator row */}
          <div className="p-4 bg-zinc-55 bg-indigo-50/50 border-2 border-dashed border-indigo-250 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <label className="block text-[10px] font-mono font-black text-indigo-900 uppercase mb-1">Rotular Novo Ponto de Restauração</label>
              <input
                type="text"
                placeholder="Exemplo: Antes de importar planilha de chácaras de SP"
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
                className="w-full p-2.5 bg-white border border-zinc-350 rounded-xl font-bold text-zinc-900 text-xs focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <button
                type="button"
                onClick={() => handleCreateSnapshot()}
                className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-[10.5px] uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5"
              >
                💾 Registrar Backup
              </button>
            </div>
          </div>

          {/* List of points */}
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-zinc-50 p-2.5 px-4 text-[10px] font-mono font-black border border-zinc-250 rounded-xl">
              <span className="text-zinc-500">PONTOS DE RESTAURAÇÃO DE SEGURANÇA NA MEMÓRIA DO CRM</span>
              {localHistory.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="text-rose-600 hover:text-rose-800 uppercase"
                >
                  Limpar Todo Histórico
                </button>
              )}
            </div>

            {localHistory.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs uppercase font-extrabold text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl">
                Nenhum ponto registrado. Realize um backup antes de operações complexas de teste!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {localHistory.map((snap) => (
                  <div key={snap.id} className="p-3.5 bg-zinc-50 border-2 border-zinc-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-100 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="font-mono text-[9px] font-black uppercase text-zinc-500">
                          {new Date(snap.timestamp).toLocaleDateString('pt-BR')} às {new Date(snap.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="text-xs font-black uppercase font-mono text-zinc-900">{snap.label}</h4>
                      
                      {/* Contents info */}
                      <div className="flex gap-3 text-[9px] font-mono text-indigo-700 font-extrabold flex-wrap uppercase">
                        <span>👥 {snap.leadsCount} Leads</span>
                        <span>🏠 {snap.propertiesCount} Imóveis</span>
                        <span>📅 {snap.appointmentsCount} Agendas</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="py-1 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-zinc-950 rounded-lg text-[9px] font-mono font-black uppercase transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] flex items-center gap-1"
                        title="Restaurar este estado no CRM"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(snap.id, snap.label)}
                        className="p-1 px-2.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-850 border border-zinc-950 rounded-lg transition"
                        title="Remover ponto de backup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: EXPORTS & IMPORTS */}
      {activeTab === 'custom-import-export' && (
        <div className="space-y-6 animate-scaleIn text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left box: Exports of custom database structures */}
            <div className="p-5 border-2 border-zinc-950 bg-zinc-50 rounded-2xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-900 flex items-center gap-1.5 border-b pb-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Exportações sob Medida (.csv / .json)</span>
              </h3>
              <p className="text-[11px] text-zinc-550 leading-tight">Escolha quais coleções comerciais você deseja empacotar e baixar para visualização externa.</p>
              
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleExportLeadsToCsv}
                  className="w-full p-3 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-950 rounded-xl font-mono font-black text-[10px] uppercase text-left flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="flex items-center gap-2">🟢 Carteira de Clientes Leads (.csv)</span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportPropertiesToCsv}
                  className="w-full p-3 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-950 rounded-xl font-mono font-black text-[10px] uppercase text-left flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="flex items-center gap-2">🏠 Estoque de Imóveis cicloCRED (.csv)</span>
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFullJsonBackup}
                  className="w-full p-3 bg-zinc-950 hover:bg-zinc-900 text-white border-2 border-zinc-950 rounded-xl font-mono font-black text-[10px] uppercase text-left flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(99,102,241,0.5)]"
                >
                  <span className="flex items-center gap-2 text-indigo-400">🔥 Backup Completo Estruturado (.json)</span>
                  <Download className="w-4 h-4 text-indigo-400" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSingleFileHtmlApp}
                  className="w-full p-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:opacity-90 text-white border-2 border-zinc-950 rounded-xl font-mono font-black text-[10px] uppercase text-left flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)]"
                  title="Exportar app completo como um arquivo único HTML autônomo offline"
                >
                  <span className="flex items-center gap-2 text-white">📦 Baixar App Portátil Único (.html)</span>
                  <Download className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Right box: Custom imports */}
            <div className="p-5 border-2 border-zinc-950 bg-zinc-50 rounded-2xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-900 flex items-center gap-1.5 border-b pb-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Importação e Carga de Ficheiros</span>
              </h3>
              <p className="text-[11px] text-zinc-550 leading-tight">Envie arquivos CSV salvos com delimitador ';' ou uploads JSON para engordar o estoque do seu CRM instantaneamente.</p>

              {/* Multi file buttons wrapper */}
              <div className="space-y-3 pt-1">
                {/* Leads CSV upload */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase">Carga de Novos Leads (.csv)</span>
                  <button
                    onClick={() => importCsvLeadsRef.current?.click()}
                    className="p-2.5 bg-white border border-zinc-400 hover:border-zinc-950 text-[10px] uppercase font-mono font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100/50 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Importar Leads via CSV</span>
                  </button>
                  <input
                    type="file"
                    ref={importCsvLeadsRef}
                    accept=".csv"
                    onChange={handleImportLeadsCsv}
                    className="hidden"
                  />
                </div>

                {/* Properties CSV upload */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase">Carga de Carteira de Imóveis (.csv)</span>
                  <button
                    onClick={() => importCsvPropsRef.current?.click()}
                    className="p-2.5 bg-white border border-zinc-400 hover:border-zinc-950 text-[10px] uppercase font-mono font-black text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Importar Imóveis via CSV</span>
                  </button>
                  <input
                    type="file"
                    ref={importCsvPropsRef}
                    accept=".csv"
                    onChange={handleImportPropertiesCsv}
                    className="hidden"
                  />
                </div>

                {/* General JSON Restore upload */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase">Carga de Backup Completo (.json)</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-zinc-900 text-white text-[10px] uppercase font-mono font-black hover:bg-zinc-800 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Restaurar Backup Completo (.json)</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleUploadFullJsonBackup}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Quick info about schema formats */}
          <div className="p-4 bg-zinc-50 border border-zinc-350 rounded-2xl">
            <h4 className="text-[10px] font-mono font-black text-zinc-800 flex items-center gap-1 uppercase">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span>Instruções de Formato de Carga</span>
            </h4>
            <p className="text-[9.5px] text-zinc-500 font-medium leading-relaxed mt-1">
              Os seus arquivos CSV devem conter campos separados por ponto e vírgula (<code className="bg-zinc-200 p-0.5 rounded font-mono font-bold font-black px-1">;</code>). O arquivo de leads deve ter na primeira linha os cabeçalhos: ID, Nome, Email, Telefone, Origem, Status, Valor, Data. Para que o Excel do Windows abra as exportações sem corromper caracteres lusófonos, nós auto-incorporamos o cabeçalho universal UTF-8 BOM.
            </p>
          </div>

        </div>
      )}

      {/* TAB 3: SCHEDULES AUTOMATION */}
      {activeTab === 'automation' && (
        <div className="space-y-4 animate-scaleIn text-xs">
          
          <div className="p-4 bg-zinc-50 border-2 border-zinc-950 rounded-2xl flex items-center justify-between select-none">
            <div className="space-y-0.5 pr-2">
              <h3 className="text-xs font-black uppercase text-zinc-900">Automação Inteligente de Backups Locais</h3>
              <p className="text-[10px] text-zinc-500 leading-tight">Quando ativo, o CRM cria autonomamente um snapshot toda vez que o volume de leads se altera, provendo histórico indestrutível.</p>
            </div>
            <button
              onClick={() => {
                setAutoBackupEnabled(!autoBackupEnabled);
                triggerSensoryFeedback('click', accSettings);
              }}
              className={`py-1.5 px-4 rounded-xl border-2 border-zinc-950 font-mono font-black text-[10px] uppercase transition ${
                autoBackupEnabled ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-zinc-500'
              }`}
            >
              {autoBackupEnabled ? 'ATIVO' : 'DESLIGADO'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-indigo-200 bg-indigo-50/20 rounded-2xl flex gap-3">
              <Sparkles className="w-6 h-6 text-indigo-600 shrink-0" />
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-black uppercase text-indigo-700">Automação de Varredura</span>
                <p className="text-[10px] text-zinc-500 font-inter font-medium leading-normal">
                  Nossos algoritmos do <strong>Motor Autônomo</strong> do CRM fazem validações cíclicas a cada intervalo configurado. Se identificarem divergências nas planilhas ou alterações massivas de status, criam um ponto de restauração instantâneo de segurança de forma 100% silenciosa.
                </p>
              </div>
            </div>

            <div className="p-4 border-2 border-emerald-200 bg-emerald-50/20 rounded-2xl flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-black uppercase text-emerald-800">Segurança do Navegador</span>
                <p className="text-[10px] text-zinc-500 font-inter font-medium leading-normal">
                  Todo o banco histórico de dados simula sincronismos em nuvem e reside de forma robusta e otimizada sob o namespace <code className="bg-zinc-100 p-0.5 border text-[9px] font-black rounded font-mono">ciclocred_system_backups</code> do localStorage para que suas edições persistam mesmo se você reiniciar a aba.
                </p>
              </div>
            </div>
          </div>

          {/* Simulate automated trigger testing button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                handleCreateSnapshot(`Cópia Temporal Automatizada #${Math.round(Math.random() * 10000)}`);
              }}
              className="py-1 px-3 bg-zinc-950 text-white font-mono font-black text-[9px] uppercase hover:bg-zinc-800 border-2 border-zinc-950 rounded-xl transition shadow-[2px_2px_0px_0px_rgba(99,102,241,1)] flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5 shrink-0" />
              <span>Simular Disparo de Automação de Cópia agora</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
