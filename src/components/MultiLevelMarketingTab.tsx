/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { Mail, Image, Share2, Sparkles } from 'lucide-react';
import EmailAutomation from './EmailAutomation';
import MediaCenter from './MediaCenter';
import { Lead, RealEstateProperty, EmailTemplate, EmailLog } from '../types';

interface MultiLevelMarketingTabProps {
  leads: Lead[];
  templates: EmailTemplate[];
  logs: EmailLog[];
  onAddTemplate: (newTemplate: EmailTemplate) => void;
  onEditTemplate: (updatedTemplate: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSendEmailSimulated: (emailLog: EmailLog) => void;
  properties: RealEstateProperty[];
  theme?: 'claro' | 'escuro' | 'galatico';
  accSettings?: any;
  awardXP?: (xp: number, cause: string) => void;
  addNotification?: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  initialTargetLeadIds?: string[];
  onClearInitialTargets?: () => void;
  onTriggerConversao?: () => void;
}

export default function MultiLevelMarketingTab({
  leads,
  templates,
  logs,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSendEmailSimulated,
  properties,
  theme = 'escuro',
  accSettings,
  awardXP,
  addNotification,
  initialTargetLeadIds = [],
  onClearInitialTargets,
  onTriggerConversao
}: MultiLevelMarketingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'disparos' | 'midia'>('disparos');

  return (
    <div className="space-y-6">
      
      {/* Sub-routing Navigation header buttons */}
      <div className="bg-zinc-900 border-4 border-zinc-950 p-2.5 rounded-2xl flex flex-wrap md:flex-nowrap gap-2 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] select-none">
        <button
          onClick={() => setActiveSubTab('disparos')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'disparos'
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold'
              : 'text-zinc-450 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          <span>Central de Disparos Multicanais</span>
        </button>
        <button
          onClick={() => setActiveSubTab('midia')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'midia'
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold'
              : 'text-zinc-450 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Image className="w-4 h-4 text-pink-400" />
          <span>Central de Mídia Integrada</span>
        </button>
        {onTriggerConversao && (
          <button
            onClick={() => {
              onTriggerConversao();
            }}
            className="flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-emerald-400 border border-zinc-700 hover:border-emerald-400 hover:bg-indigo-950/20 active:translate-y-px"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Portabilidade & Conversão</span>
          </button>
        )}
      </div>

      {activeSubTab === 'disparos' && (
        <EmailAutomation
          leads={leads}
          templates={templates}
          logs={logs}
          onAddTemplate={onAddTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onSendEmailSimulated={onSendEmailSimulated}
          theme={theme}
          accSettings={accSettings}
          initialTargetLeadIds={initialTargetLeadIds}
          onClearInitialTargets={onClearInitialTargets}
        />
      )}

      {activeSubTab === 'midia' && (
        <MediaCenter
          leads={leads}
          properties={properties}
          theme={theme}
          accSettings={accSettings}
          awardXP={(amount) => awardXP && awardXP(amount, 'MEDIA_CENTER_BOOST')}
          addNotification={addNotification}
        />
      )}
    </div>
  );
}
