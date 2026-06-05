/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { 
  X, 
  User, 
  Trophy, 
  Settings, 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  Compass, 
  Volume2, 
  VolumeX, 
  Flame, 
  Grid, 
  Image, 
  Percent, 
  UserCheck, 
  Mail, 
  Award,
  BookOpen
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback } from '../utils/sensory';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: string;
}

interface UserCentralModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (val: string | ((prev: string) => string)) => void;
  creciNumber: string;
  setCreciNumber: (val: string) => void;
  userLevel: number;
  userXP: number;
  goals: Goal[];
  accSettings: AccessibilitySettings;
  setAccSettings: (val: AccessibilitySettings) => void;
  addNotification?: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  theme?: 'claro' | 'escuro' | 'galatico';
}

export default function UserCentralModal({
  isOpen,
  onClose,
  userName,
  setUserName,
  creciNumber,
  setCreciNumber,
  userLevel,
  userXP,
  goals,
  accSettings,
  setAccSettings,
  addNotification,
  theme = 'escuro'
}: UserCentralModalProps) {
  if (!isOpen) return null;

  // Static badge achievement list
  const badges = [
    { title: 'Primeiro Lead', desc: 'Cadastrou ou importou o primeiro contato', unlocked: true, icon: '🔥' },
    { title: 'Simulador Ativo', desc: 'Gerou e copiou uma planilha de obras completa', unlocked: true, icon: '📊' },
    { title: 'Fechamento Cury', desc: 'Fez um fit perfeito entre lead e residencial', unlocked: false, icon: '🔑' },
    { title: 'Inbound Champion', desc: 'Capturou lead pelo site cicloCRED Inform', unlocked: userXP > 500, icon: '🌐' }
  ];

  const handleFontSizeChange = (size: 'normal' | 'large' | 'extra-large') => {
    triggerSensoryFeedback('click', accSettings);
    setAccSettings({ ...accSettings, fontSizeClass: size });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-zinc-950/80 backdrop-blur-xs animate-fadeIn">
      
      {/* Modal Dialog container frame */}
      <div className={`relative w-full max-w-4xl rounded-3xl text-zinc-900 border-4 border-zinc-950 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[92vh] overflow-y-auto bg-white transition-all animate-scaleIn`}>
        
        {/* Header decoration bar */}
        <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b-4 border-zinc-950">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500 fill-amber-500 animate-bounce" />
            <div>
              <h2 className="text-base md:text-lg font-black uppercase italic tracking-tight font-sans">
                Central do Usuário: Perfil, Metas & Preferências
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wide block">Painel Gerencial CicloCred CRM</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              onClose();
            }}
            className="p-2 bg-zinc-900 border-2 border-zinc-850 hover:bg-zinc-805 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Profile & Photo Identification (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5 bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
            <span className="text-[10px] font-mono font-black text-indigo-750 uppercase tracking-widest block">👤 Configurações de Identidade</span>
            
            {/* User Profile Avatar Frame */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-zinc-950 bg-indigo-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {localStorage.getItem('ciclocred_user_photo') && localStorage.getItem('ciclocred_user_photo') !== '' ? (
                  <img 
                    src={localStorage.getItem('ciclocred_user_photo') || undefined} 
                    alt="Foto do Corretor" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-3xl text-zinc-955 select-none">
                    {userName.substring(0,2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase cursor-pointer hover:underline">
                  ✏️ Alterar Imagem de Perfil
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          localStorage.setItem('ciclocred_user_photo', reader.result as string);
                          triggerSensoryFeedback('success', accSettings);
                          if (addNotification) addNotification('📸 FOTO REGISTRADA', 'Sua nova foto de perfil foi salva localmente no CRM.', 'success');
                          // Force parent update
                          setUserName(prev => prev + " ");
                          setTimeout(() => setUserName(prev => prev.trim()), 30);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {localStorage.getItem('ciclocred_user_photo') && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('ciclocred_user_photo');
                      triggerSensoryFeedback('warning', accSettings);
                      setUserName(prev => prev + " ");
                      setTimeout(() => setUserName(prev => prev.trim()), 30);
                    }}
                    className="block text-[9px] font-mono text-rose-500 hover:text-rose-700 mx-auto"
                  >
                    Excluir Foto
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields for Name and CRECI */}
            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-black uppercase text-zinc-500">Nome do Corretor</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-black uppercase text-zinc-500">Registro CRECI / CRM</label>
                <input 
                  type="text" 
                  value={creciNumber} 
                  onChange={(e) => setCreciNumber(e.target.value)} 
                  className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs font-mono font-bold"
                  placeholder="Ex: CRECI-SP 21.439"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Gamification Achievements & Metas (lg:col-span-4) */}
          <div className="lg:col-span-5 space-y-5 bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
            <span className="text-[10px] font-mono font-black text-amber-800 uppercase tracking-widest block">🏆 Placar de Metas e Conquistas</span>
            
            {/* XP Level progress card */}
            <div className="bg-zinc-950 text-white rounded-2xl p-4 border-2 border-zinc-950 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <strong className="text-indigo-400">NÍVEL GALAXY {userLevel}</strong>
                <span className="text-zinc-400 font-bold">{userXP % 500} / 500 XP</span>
              </div>
              <div className="w-full h-3 bg-zinc-850 rounded-full overflow-hidden border border-zinc-700">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${(userXP % 500) / 5}%` }}
                />
              </div>
              <span className="block text-[9px] uppercase font-mono text-zinc-500 text-right mt-1">XP Total Acumulado: {userXP} XP</span>
            </div>

            {/* Live Goals checking */}
            <div className="space-y-2">
              <span className="block text-[9px] font-mono font-black uppercase text-zinc-500">Metas Comerciais em Progresso</span>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                  return (
                    <div key={g.id} className="p-2.5 bg-white border rounded-xl flex flex-col justify-between gap-1 shadow-sm">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="uppercase text-zinc-900 text-[10px] truncate max-w-[150px]">{g.title}</span>
                        <span className="font-mono text-indigo-650">{g.current}/{g.target} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badges and milestones medals list */}
            <div className="space-y-2">
              <span className="block text-[9px] font-mono font-black uppercase text-zinc-500">Medalhas de Mérito do Corretor</span>
              <div className="grid grid-cols-2 gap-2">
                {badges.map((b, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                      b.unlocked 
                        ? 'bg-amber-50/55 border-amber-200 text-zinc-900' 
                        : 'bg-zinc-100 border-zinc-200 text-zinc-400 opacity-60'
                    }`}
                  >
                    <span className="text-lg">{b.icon}</span>
                    <div className="leading-tight">
                      <strong className="block text-[9px] uppercase font-black tracking-tight truncate">{b.title}</strong>
                      <span className="block text-[8px] truncate max-w-[120px]">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Accessibility Settings & Preferences (lg:col-span-4) */}
          <div className="lg:col-span-3 space-y-5 bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
            <span className="text-[10px] font-mono font-black text-indigo-750 uppercase tracking-widest block">⚡ Acessibilidade e Som</span>
            
            {/* Quick toggles */}
            <div className="space-y-3 font-sans text-xs">
              
              {/* Sound Effects */}
              <div className="flex items-center justify-between p-2 hover:bg-zinc-100 rounded-lg transition">
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[10px] block">Efeitos Narrativos</span>
                  <span className="text-[9px] text-zinc-500 font-medium block">Tons auditivos ao clicar</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = { ...accSettings, soundsEnabled: !accSettings.soundsEnabled };
                    setAccSettings(nextValue);
                    triggerSensoryFeedback('chime', nextValue);
                  }}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${accSettings.soundsEnabled ? 'bg-indigo-600' : 'bg-zinc-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${accSettings.soundsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Haptic feed */}
              <div className="flex items-center justify-between p-2 hover:bg-zinc-100 rounded-lg transition">
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[10px] block">Vibração Sensorial</span>
                  <span className="text-[9px] text-zinc-500 font-medium block">Haptic feedbacks táteis</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = { ...accSettings, hapticsEnabled: !accSettings.hapticsEnabled };
                    setAccSettings(nextValue);
                    triggerSensoryFeedback('click', nextValue);
                  }}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${accSettings.hapticsEnabled ? 'bg-indigo-600' : 'bg-zinc-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${accSettings.hapticsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Text To Speech */}
              <div className="flex items-center justify-between p-2 hover:bg-zinc-100 rounded-lg transition">
                <div className="space-y-0.5">
                  <span className="font-black uppercase text-[10px] block">Leitura por Voz</span>
                  <span className="text-[9px] text-zinc-500 font-medium block">Sons auto narrados</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = { ...accSettings, speakAloudEnabled: !accSettings.speakAloudEnabled };
                    setAccSettings(nextValue);
                    triggerSensoryFeedback('click', nextValue);
                  }}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${accSettings.speakAloudEnabled ? 'bg-indigo-600' : 'bg-zinc-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${accSettings.speakAloudEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Font Sizing */}
              <div className="space-y-2 pt-2 border-t font-sans">
                <span className="font-black uppercase text-[10px] text-zinc-500 block">Tamanho da Fonte das Letras</span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] text-zinc-700">
                  {(['normal', 'large', 'extra-large'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleFontSizeChange(sz)}
                      className={`py-1 px-1.5 rounded uppercase font-black text-center border transition ${
                        accSettings.fontSizeClass === sz
                          ? 'bg-indigo-600 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      {sz === 'normal' && 'Padrão'}
                      {sz === 'large' && 'Grande'}
                      {sz === 'extra-large' && 'Super'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal footer save metrics */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-end">
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('success', accSettings);
              onClose();
            }}
            className="py-2.5 px-6 bg-zinc-950 hover:bg-indigo-900 text-white font-black font-mono text-[10px] uppercase rounded-xl tracking-wider cursor-pointer border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Salvar e Confirmar Perfil 🎯
          </button>
        </div>

      </div>
    </div>
  );
}
