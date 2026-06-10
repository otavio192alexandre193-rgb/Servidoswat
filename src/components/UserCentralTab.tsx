/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Settings, Sliders, Shield, TrendingUp } from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';
import GamificationView from './Gamification';
import SettingsView from './Settings';
import KidsTab from './KidsTab';
import { Goal, Project, Lead } from '../types';

interface UserCentralTabProps {
  accSettings: AccessibilitySettings;
  setAccSettings: (accSettings: AccessibilitySettings) => void;
  userXP: number;
  setUserXP: React.Dispatch<React.SetStateAction<number>>;
  userLevel: number;
  setUserLevel: React.Dispatch<React.SetStateAction<number>>;
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
  
  theme: 'claro' | 'escuro' | 'galatico';
  setTheme: (theme: 'claro' | 'escuro' | 'galatico') => void;
  galaxyPreset: string;
  setGalaxyPreset: (preset: string) => void;
  
  leads: Lead[];
  properties: any[];
  followUpsCount: number;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  
  onResetGamification: () => void;
  onWipeLeads: () => void;
  onWipeEstoque: () => void;
  onRequestConfirm: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;

  isAutonomyActive: boolean;
  setIsAutonomyActive: (active: boolean) => void;
  autonomyIntervalSec: number;
  setAutonomyIntervalSec: (sec: number) => void;
  consolidatedCrmInfo?: string;
  setConsolidatedCrmInfo?: (value: string) => void;
  awardXP?: (xp: number) => void;
}

export default function UserCentralTab({
  accSettings,
  setAccSettings,
  userXP,
  setUserXP,
  userLevel,
  setUserLevel,
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
  subscriptionPlan,
  setSubscriptionPlan,
  theme,
  setTheme,
  galaxyPreset,
  setGalaxyPreset,
  leads,
  properties,
  followUpsCount,
  goals,
  setGoals,
  projects,
  setProjects,
  onResetGamification,
  onWipeLeads,
  onWipeEstoque,
  onRequestConfirm,
  isAutonomyActive,
  setIsAutonomyActive,
  autonomyIntervalSec,
  setAutonomyIntervalSec,
  consolidatedCrmInfo,
  setConsolidatedCrmInfo,
  awardXP
}: UserCentralTabProps) {
  const [innerTab, setInnerTab] = useState<'gamification' | 'leveraging' | 'settings'>('gamification');

  const dealsClosed = leads.filter(l => l.status === 'fechado').length;

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher Headers */}
      <div className="flex flex-wrap bg-zinc-900 p-1.5 border-4 border-zinc-950 rounded-2xl w-full sm:w-max select-none text-left gap-2">
        <button
          id="user-central-tab-gaming"
          type="button"
          onClick={() => {
            triggerSensoryFeedback('click', accSettings);
            setInnerTab('gamification');
          }}
          className={`px-6 py-3 rounded-lg text-xs font-black uppercase font-mono tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
            innerTab === 'gamification'
              ? 'bg-indigo-650 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-transparent'
          }`}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          <span>Troféus & Metas Reais (Gamificação)</span>
        </button>

        <button
          id="user-central-tab-leveraging"
          type="button"
          onClick={() => {
            triggerSensoryFeedback('click', accSettings);
            setInnerTab('leveraging');
          }}
          className={`px-6 py-3 rounded-lg text-xs font-black uppercase font-mono tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
            innerTab === 'leveraging'
              ? 'bg-indigo-650 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-transparent'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Alavancagem & Finanças</span>
        </button>

        <button
          id="user-central-tab-admin"
          type="button"
          onClick={() => {
            triggerSensoryFeedback('click', accSettings);
            setInnerTab('settings');
          }}
          className={`px-6 py-3 rounded-lg text-xs font-black uppercase font-mono tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
            innerTab === 'settings'
              ? 'bg-indigo-650 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Configurações & Administração</span>
        </button>
      </div>

      <div className="pt-2 border-t-2 border-zinc-950/20 mt-4">
        {innerTab === 'gamification' ? (
          <GamificationView
            accSettings={accSettings}
            userXP={userXP}
            setUserXP={setUserXP}
            userLevel={userLevel}
            setUserLevel={setUserLevel}
            goals={goals}
            setGoals={setGoals}
            projects={projects}
            setProjects={setProjects}
            onResetGamification={onResetGamification}
            onRequestConfirm={onRequestConfirm}
            userName={userName}
            userEmail={userEmail}
            dealsClosedCount={dealsClosed}
            actionsCount={followUpsCount}
          />
        ) : innerTab === 'leveraging' ? (
          <KidsTab
            awardXP={awardXP || (() => {})}
            accSettings={accSettings}
          />
        ) : (
          <SettingsView
            theme={theme}
            setTheme={setTheme}
            galaxyPreset={galaxyPreset}
            setGalaxyPreset={setGalaxyPreset}
            accSettings={accSettings}
            setAccSettings={setAccSettings}
            userName={userName}
            setUserName={setUserName}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            creciNumber={creciNumber}
            setCreciNumber={setCreciNumber}
            userRole={userRole}
            setUserRole={setUserRole}
            agencyName={agencyName}
            setAgencyName={setAgencyName}
            subscriptionPlan={subscriptionPlan}
            setSubscriptionPlan={setSubscriptionPlan}
            userLevel={userLevel}
            userXP={userXP}
            properties={properties}
            leads={leads}
            isAutonomyActive={isAutonomyActive}
            setIsAutonomyActive={setIsAutonomyActive}
            autonomyIntervalSec={autonomyIntervalSec}
            setAutonomyIntervalSec={setAutonomyIntervalSec}
            leadsCount={leads.length}
            propertiesCount={properties.length}
            inventoryCount={properties.length}
            onWipeLeads={onWipeLeads}
            onWipeEstoque={onWipeEstoque}
            onRequestConfirm={onRequestConfirm}
            consolidatedCrmInfo={consolidatedCrmInfo}
            setConsolidatedCrmInfo={setConsolidatedCrmInfo}
          />
        )}
      </div>

    </div>
  );
}
