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
  globalFilteredLeads?: Lead[];
  globalSearchTerm?: string;
  templates: EmailTemplate[];
  logs: EmailLog[];
  onAddTemplate: (newTemplate: EmailTemplate) => void;
  onEditTemplate: (updatedTemplate: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSendEmailSimulated: (emailLog: EmailLog) => void;
  properties?: RealEstateProperty[];
  theme?: 'claro' | 'escuro' | 'galatico';
  accSettings?: any;
  awardXP?: (xp: number, cause: string) => void;
  addNotification?: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  initialTargetLeadIds?: string[];
  onClearInitialTargets?: () => void;
  onTriggerConversao?: () => void;
  tableHeaderComponent?: React.ReactNode | ((selectedLeadIds: string[], actions?: any) => React.ReactNode);
  forcedSubTab?: "massa" | "templates" | "logs";
  setEmailLogs?: React.Dispatch<React.SetStateAction<EmailLog[]>>;
  onlyTable?: boolean;
}

export default function MultiLevelMarketingTab({
  leads,
  globalFilteredLeads,
  globalSearchTerm,
  templates,
  logs,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSendEmailSimulated,
  theme = 'escuro',
  accSettings,
  addNotification,
  initialTargetLeadIds = [],
  onClearInitialTargets,
  onTriggerConversao,
  tableHeaderComponent,
  forcedSubTab,
  setEmailLogs,
  onlyTable = false
}: MultiLevelMarketingTabProps) {
  return (
    <div className="space-y-6">
      <EmailAutomation
        leads={leads}
        globalFilteredLeads={globalFilteredLeads}
        globalSearchTerm={globalSearchTerm}
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
        tableHeaderComponent={tableHeaderComponent}
        forcedSubTab={forcedSubTab}
        setEmailLogs={setEmailLogs}
        addNotification={addNotification}
        onlyTable={onlyTable}
      />
    </div>
  );
}
