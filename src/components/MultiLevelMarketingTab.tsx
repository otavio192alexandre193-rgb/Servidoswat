/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { Mail, Sparkles } from 'lucide-react';
import EmailAutomation from './EmailAutomation';
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
  theme = 'escuro',
  accSettings,
  initialTargetLeadIds = [],
  onClearInitialTargets,
  onTriggerConversao
}: MultiLevelMarketingTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Page Title */}
      <div className="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-400" />
            <span>Disparos em Massa</span>
          </h2>
          <p className="text-xs text-zinc-400 font-semibold font-sans mt-0.5">
            Dispare templates promocionais e scripts de vendas em massa para seus leads por e-mail, WhatsApp ou canais sociais.
          </p>
        </div>
        {onTriggerConversao && (
          <button
            onClick={() => onTriggerConversao()}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border-2 border-zinc-850 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Importar & Converter Simulações da Caixa"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Conversor de Simulação</span>
          </button>
        )}
      </div>

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
    </div>
  );
}
