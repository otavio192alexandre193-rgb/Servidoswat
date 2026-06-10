/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Trello, 
  Users, 
  Mail, 
  TrendingUp,
  Briefcase,
  Calendar,
  Package,
  Trophy,
  Settings,
  LogOut,
  ChevronUp,
  User,
  Share2,
  Sliders,
  Camera,
  FileSpreadsheet,
  MessageSquare,
  Gamepad2,
  Cpu,
  Cloud,
  Sparkles,
  Globe,
  Clock
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  leadsCount: number;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  accSettings?: AccessibilitySettings;
  forceLocalStorageMode?: boolean;
  onToggleForceLocalMode?: (val: boolean) => void;
  userLevel?: number;
  userXP?: number;
  creciNumber?: string;
  currentDateTime?: Date;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  leadsCount,
  userName = 'Operador CicloCred',
  userEmail = 'operador@ciclocred.com',
  onLogout,
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS,
  forceLocalStorageMode = false,
  onToggleForceLocalMode,
  userLevel = 1,
  userXP = 0,
  creciNumber = '',
  currentDateTime = new Date()
}: SidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load profile photo from localStorage if present
  const profilePhoto = localStorage.getItem('ciclocred_user_photo') || '';

  const menuItems = [
    { id: 'leads', name: 'Leads', icon: Users, badge: leadsCount },
    { id: 'inventory', name: 'Estoque de Imóveis', icon: Package },
    { id: 'gemini-server', name: 'Assistente AI', icon: Sparkles },
    { id: 'google-workspace', name: 'Google Workspace', icon: Cloud },
    { id: 'kids', name: 'Alavancagem & Finanças', icon: TrendingUp },
    { id: 'user-central', name: 'Painel do Usuário (Metas & Adm)', icon: Trophy },
    { id: 'reports', name: 'Relatórios Integrados', icon: TrendingUp },
  ];

  // Helper inside sidebar to render proper greetings
  const getGreeting = () => {
    const hrs = currentDateTime.getHours();
    if (hrs < 12) return '🌤️ Bom dia';
    if (hrs < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  const formattedDateAndClock = `${currentDateTime.toLocaleDateString('pt-BR', { weekday: 'short' })} • ${currentDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <aside className="w-68 bg-zinc-900 border-r-4 border-zinc-950 flex flex-col h-screen text-zinc-100 shrink-0">
      {/* Brand Header & Dynamic Greetings Panel */}
      <div className="p-5 border-b-4 border-zinc-950 space-y-4">
        {/* Clean Logo without SWAT keyword as requested */}
        <div className="flex items-center gap-2">
          <Briefcase className="w-5.5 h-5.5 text-indigo-400" />
          <span className="font-sans font-black tracking-tighter text-xl uppercase italic text-white leading-none">
            cicloCRED <span className="text-indigo-400">CRM</span>
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
          Menu Principal
        </div>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-btn-${item.id}`}
              key={item.id}
              onClick={() => {
                triggerSensoryFeedback('click', accSettings);
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] font-extrabold translate-y-[-1px]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-zinc-950 font-mono ${isActive ? 'bg-zinc-950 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer Card with Actionable Sign-out */}
      <div className="p-4 border-t-4 border-zinc-950 bg-zinc-950 relative">

        {showUserMenu && (
          <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border-2 border-zinc-950 p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-30 animate-scaleIn text-xs space-y-2">
            {/* Database Engine Operation Mode Selector Button in Footer/Sidebar */}
            <button
              type="button"
              onClick={() => {
                triggerSensoryFeedback('click', accSettings);
                if (onToggleForceLocalMode) {
                  onToggleForceLocalMode(!forceLocalStorageMode);
                }
              }}
              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border text-[9.5px] font-mono font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                forceLocalStorageMode
                  ? 'bg-amber-500/15 text-amber-400 border-amber-600/50 hover:bg-amber-500/25'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-950 hover:bg-emerald-500/20'
              }`}
              title={
                forceLocalStorageMode 
                  ? "Modo 100% Local Ativo para preservar cotas. Clique para reconectar a Nuvem." 
                  : "Nuvem Firestore Ativa. Clique para forçar Operação Local Autônoma."
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                forceLocalStorageMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              <span>
                {forceLocalStorageMode ? '📁 Usar Local' : '☁️ Usar Firestore'}
              </span>
            </button>

            {/* Gamification Level Pill Relocalized relative to user menu */}
            <div className="p-2 border border-zinc-800 rounded-lg text-left bg-zinc-950/70 select-none">
              <div className="text-[9px] font-mono font-black text-indigo-450 uppercase tracking-widest leading-none flex items-center justify-between">
                <span>⭐ GALAXY NÍVEL {userLevel}</span>
                <span className="text-zinc-500 font-bold">({userXP}/5000 XP)</span>
              </div>
              <div className="w-full bg-zinc-850 h-1.5 rounded-full mt-1.5 overflow-hidden border border-zinc-900">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (userXP / 5000) * 100)}%` }}
                />
              </div>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  triggerSensoryFeedback('warning', accSettings);
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 text-rose-400 hover:text-white hover:bg-rose-950/40 p-2.5 rounded-lg transition-all border border-transparent hover:border-rose-900/30 font-mono font-black uppercase text-[10px]"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sair do Sistema</span>
              </button>
            )}
          </div>
        )}

        <div 
          onClick={() => {
            triggerSensoryFeedback('click', accSettings);
            setShowUserMenu(!showUserMenu);
          }}
          className="flex items-center justify-between p-1 hover:bg-zinc-900 rounded-lg cursor-pointer transition select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {profilePhoto && profilePhoto !== '' ? (
              <img 
                src={profilePhoto || undefined} 
                alt={userName} 
                className="w-9 h-9 rounded object-cover border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded bg-indigo-500 border-2 border-zinc-900 flex items-center justify-center text-zinc-950 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 font-mono">
                {userName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white hover:text-indigo-400 uppercase tracking-wider font-mono truncate">{userName}</h4>
              <p className="text-[10px] text-zinc-400 font-bold font-mono truncate">{userEmail}</p>
              {/* Compact cloud firestore connection indicator */}
              <div className="mt-1 flex items-center gap-1 text-[8.5px] font-mono uppercase font-black tracking-wider text-zinc-400 select-none">
                <span className={`w-1 h-1 rounded-full ${forceLocalStorageMode ? 'bg-amber-400' : 'bg-emerald-450 animate-pulse'}`} />
                <span>{forceLocalStorageMode ? '📁 OFF-LINE' : '☁️ FIRESTORE'}</span>
              </div>
            </div>
          </div>
          <ChevronUp className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </aside>
  );
}
