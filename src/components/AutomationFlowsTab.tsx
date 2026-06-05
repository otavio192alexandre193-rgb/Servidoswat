/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  MessageSquare, 
  Mail, 
  Cpu, 
  Layers, 
  Activity, 
  FileCode, 
  CheckCircle2, 
  HelpCircle, 
  ToggleLeft, 
  ToggleRight, 
  Info,
  Sliders,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';
import { EmailTemplate } from '../types';

interface AutomationFlowsTabProps {
  templates: EmailTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  awardXP: (xp: number) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai') => void;
  accSettings?: AccessibilitySettings;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string; // 'create_lead' | 'advance_proposta' | 'closed_win' | 'schedule_visit'
  actionType: string;   // 'whatsapp_script' | 'send_email' | 'award_xp' | 'crm_notify'
  actionValue: string;  // ID of script, template or custom text
  active: boolean;
  xpValue: number;
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'flow-1',
    name: 'Boas-vindas Imediato WhatsApp',
    triggerEvent: 'create_lead',
    actionType: 'whatsapp_script',
    actionValue: 'Boas-vindas cicloCRED',
    active: true,
    xpValue: 50
  },
  {
    id: 'flow-2',
    name: 'Bônus de Visita Validada',
    triggerEvent: 'schedule_visit',
    actionType: 'award_xp',
    actionValue: '300',
    active: true,
    xpValue: 300
  },
  {
    id: 'flow-3',
    name: 'Disparo de Alerta Preditivo no Fechamento',
    triggerEvent: 'closed_win',
    actionType: 'crm_notify',
    actionValue: 'Meta Batida! Comissão liberada para emissão do contrato corporativo.',
    active: true,
    xpValue: 80
  },
];

export default function AutomationFlowsTab({
  templates,
  setTemplates,
  awardXP,
  addNotification,
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS
}: AutomationFlowsTabProps) {
  // Scripts and templates manager
  const [activeScriptTab, setActiveScriptTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editBody, setEditBody] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Flow rules manager
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    const saved = localStorage.getItem('ciclocred_automation_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  // Create rule state
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<string>('create_lead');
  const [newRuleAction, setNewRuleAction] = useState<string>('whatsapp_script');
  const [newRuleValue, setNewRuleValue] = useState<string>('');
  const [showCreateRuleForm, setShowCreateRuleForm] = useState<boolean>(false);

  // Sync Rules to LocalStorage
  useEffect(() => {
    localStorage.setItem('ciclocred_automation_rules', JSON.stringify(rules));
  }, [rules]);

  // Load WhatsApp templates locally
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem('ciclocred_whatsapp_templates');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'wa-1',
        name: 'Boas-vindas cicloCRED',
        body: 'Olá {{clientName}}, seja bem-vindo à cicloCRED! Sou o consultor credenciado CRECI {{creci}}. Identificamos seu interesse pelo imóvel {{propertyInterest}} com renda de R$ {{income}}. Podemos agendar uma ligação hoje às 14h?'
      },
      {
        id: 'wa-2',
        name: 'Quebra de Objeção Financeira',
        body: 'Prezado(a) {{clientName}}, analisando seu orçamento familiar, preparei uma simulação Caixa especial onde a entrada pode ser parcelada em até 36x. O seu potencial de financiamento está excelente! Como deseja prosseguir o plano?'
      },
      {
        id: 'wa-3',
        name: 'Lembrete de Vistoria Habitacional',
        body: 'Atenção {{clientName}}, nossa vistoria técnica do agente Caixa está agendada para amanhã. É importante separar os holerites e a carteira de trabalho recente. Estou enviando as coordenadas do loteamento.'
      }
    ];
  });

  // Sync WhatsApp Templates
  useEffect(() => {
    localStorage.setItem('ciclocred_whatsapp_templates', JSON.stringify(whatsappTemplates));
  }, [whatsappTemplates]);

  // Load selected template details for edit
  useEffect(() => {
    if (activeScriptTab === 'email') {
      const active = templates.find(t => t.id === selectedTemplateId) || templates[0];
      if (active) {
        setEditName(active.name);
        setEditSubject(active.subject);
        setEditBody(active.body);
      }
    } else {
      const active = whatsappTemplates.find(t => t.id === selectedTemplateId) || whatsappTemplates[0];
      if (active) {
        setEditName(active.name);
        setEditSubject('');
        setEditBody(active.body);
      }
    }
  }, [selectedTemplateId, activeScriptTab]);

  // Trigger default selection on switch
  useEffect(() => {
    if (activeScriptTab === 'email' && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    } else if (activeScriptTab === 'whatsapp' && whatsappTemplates.length > 0) {
      setSelectedTemplateId(whatsappTemplates[0].id);
    }
  }, [activeScriptTab]);

  const handleSaveTemplate = () => {
    if (!editName.trim() || !editBody.trim()) {
      addNotification('⚠️ VALIDAÇÃO DE SCRIPT', 'Nome e conteúdo são obrigatórios para salvar.', 'warning');
      return;
    }
    
    setIsSaving(true);
    triggerSensoryFeedback('success', accSettings);

    if (activeScriptTab === 'email') {
      setTemplates(prev => {
        const index = prev.findIndex(t => t.id === selectedTemplateId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            name: editName,
            subject: editSubject,
            body: editBody
          };
          return updated;
        } else {
          // Create new
          const newTemplate: EmailTemplate = {
            id: `email-temp-${Date.now()}`,
            name: editName,
            subject: editSubject,
            body: editBody,
            triggerEvent: 'system'
          };
          setSelectedTemplateId(newTemplate.id);
          return [...prev, newTemplate];
        }
      });
    } else {
      setWhatsappTemplates(prev => {
        const index = prev.findIndex(t => t.id === selectedTemplateId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            name: editName,
            body: editBody
          };
          return updated;
        } else {
          const newTemplate = {
            id: `wa-temp-${Date.now()}`,
            name: editName,
            body: editBody
          };
          setSelectedTemplateId(newTemplate.id);
          return [...prev, newTemplate];
        }
      });
    }

    setTimeout(() => {
      setIsSaving(false);
      awardXP(80);
      addNotification('📝 SCRIPT SALVO', `O modelo "${editName}" foi atualizado e guardado na nuvem. +80 XP!`, 'success');
    }, 400);
  };

  const handleAddNewModel = () => {
    triggerSensoryFeedback('click', accSettings);
    const mockId = `temp-new-${Date.now()}`;
    setSelectedTemplateId(mockId);
    setEditName('Novo Modelo cicloCRED');
    setEditSubject(activeScriptTab === 'email' ? 'Assunto Padrão de Contato' : '');
    setEditBody('Olá {{clientName}},\n\nEscreva sua abordagem estratégica aqui...');
  };

  const handleDeleteTemplate = (id: string) => {
    if (activeScriptTab === 'email') {
      if (templates.length <= 1) {
        addNotification('⚠️ EXCLUSÃO BLOQUEADA', 'Você precisa de pelo menos 1 modelo de e-mail no CRM.', 'warning');
        return;
      }
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      if (whatsappTemplates.length <= 1) {
        addNotification('⚠️ EXCLUSÃO BLOQUEADA', 'Você precisa de pelo menos 1 modelo de WhatsApp no CRM.', 'warning');
        return;
      }
      setWhatsappTemplates(prev => prev.filter(t => t.id !== id));
    }
    triggerSensoryFeedback('warning', accSettings);
    addNotification('🗑️ MODELO REMOVIDO', 'O script foi apagado com sucesso do seu funil.', 'warning');
  };

  // Rule activation toggle
  const handleToggleRule = (ruleId: string) => {
    triggerSensoryFeedback('click', accSettings);
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      addNotification(
        '🎛️ FLUXO ATUALIZADO',
        `A regra de automação "${rule.name}" está agora ${!rule.active ? 'ATIVA' : 'MUTADA'}.`,
        'info'
      );
    }
  };

  // Create rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: AutomationRule = {
      id: `flow-rule-${Date.now()}`,
      name: newRuleName,
      triggerEvent: newRuleTrigger,
      actionType: newRuleAction,
      actionValue: newRuleValue || 'Roteiro Padrão',
      active: true,
      xpValue: newRuleTrigger === 'closed_win' ? 120 : 60
    };

    setRules(prev => [...prev, newRule]);
    setNewRuleName('');
    setNewRuleValue('');
    setShowCreateRuleForm(false);
    triggerSensoryFeedback('success', accSettings);
    awardXP(100);
    addNotification('🤖 NOVO FLUXO CADASTRADO', `A regra de automação "${newRule.name}" foi anexada ao seu CRM. +100 XP!`, 'success');
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    triggerSensoryFeedback('warning', accSettings);
    addNotification('🗑️ REGRA DELETADA', 'O gatilho de automação foi removido estrategicamente.', 'warning');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 select-text"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* LEFT PANEL: AUTOMATION VISUAL FLOW BUILDER (7 COLUMNS) */}
        <div className="lg:col-span-7 bg-white border-4 border-zinc-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
                Criador de Fluxos de Automação Cósmica 🤖
              </h2>
              <p className="text-xs text-zinc-500 font-sans">
                Conecte gatilhos operacionais de leads a disparos de scripts e recompensas em tempo real.
              </p>
            </div>
            <button
              id="flows-add-rule-btn"
              onClick={() => {
                triggerSensoryFeedback('click', accSettings);
                setShowCreateRuleForm(!showCreateRuleForm);
              }}
              className="px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(99,102,241,1)] cursor-pointer transition select-none shrink-0"
            >
              {showCreateRuleForm ? 'Fechar Form' : '⚡ Criar Gatilho'}
            </button>
          </div>

          {/* Dynamic Rule form creation */}
          <AnimatePresence>
            {showCreateRuleForm && (
              <motion.form
                onSubmit={handleCreateRule}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-indigo-50/50 border-2 border-zinc-950 rounded-2xl p-4.5 space-y-4 font-mono overflow-hidden select-none"
              >
                <div className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Configurar Novo Encadeamento Operacional:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-550 block uppercase">Nome Amigável do Fluxo</label>
                    <input
                      id="flows-rule-input-name"
                      type="text"
                      className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none"
                      placeholder="Ex: Alerta de Objeção Rápida"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-550 block uppercase">Quando o Evento Ocorrer (Gatilho)</label>
                    <select
                      id="flows-rule-trigger-select"
                      className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none"
                      value={newRuleTrigger}
                      onChange={(e) => setNewRuleTrigger(e.target.value)}
                    >
                      <option value="create_lead">📅 Cadastrar Novo Lead</option>
                      <option value="advance_proposta">📝 Lead Avançar para Proposta</option>
                      <option value="schedule_visit">🚗 Agendar Reunião ou Visita</option>
                      <option value="closed_win">💰 Fechar Proposta (Win!)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-550 block uppercase">Fazer a Seguinte Ação Direta</label>
                    <select
                      id="flows-rule-action-select"
                      className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none"
                      value={newRuleAction}
                      onChange={(e) => {
                        setNewRuleAction(e.target.value);
                        setNewRuleValue('');
                      }}
                    >
                      <option value="whatsapp_script">💬 Recomendar Roteiro WhatsApp</option>
                      <option value="send_email">📧 Disparar Campanha de E-mail</option>
                      <option value="award_xp">🎯 Conceder Bônus de XP Real</option>
                      <option value="crm_notify">🔔 Disparar Push Alerta no Painel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-550 block uppercase">Valor ou Modelo Associado</label>
                    {newRuleAction === 'whatsapp_script' ? (
                      <select
                        id="flows-rule-val-wa"
                        className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none animate-fadeIn"
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                      >
                        <option value="">Selecione um Roteiro...</option>
                        {whatsappTemplates.map(w => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    ) : newRuleAction === 'send_email' ? (
                      <select
                        id="flows-rule-val-email"
                        className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none animate-fadeIn"
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                      >
                        <option value="">Selecione um E-mail...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    ) : newRuleAction === 'award_xp' ? (
                      <select
                        id="flows-rule-val-xp"
                        className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none animate-fadeIn"
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                      >
                        <option value="50">+50 XP Real</option>
                        <option value="100">+100 XP Real</option>
                        <option value="200">+200 XP Real</option>
                        <option value="500">+500 XP Real</option>
                      </select>
                    ) : (
                      <input
                        id="flows-rule-val-other"
                        type="text"
                        className="w-full bg-white border-2 border-zinc-950 p-2 text-xs font-bold rounded-xl focus:outline-none animate-fadeIn"
                        placeholder="Ex: Atividade validada com sucesso!"
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 select-none">
                  <button
                    id="flows-submit-rule"
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950"
                  >
                    Ativar Robozinho de Automação 🤖
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Interactive visual pipeline logic blocks */}
          <div className="space-y-4">
            {rules.map((rule) => (
              <div 
                key={rule.id} 
                className={`border-4 border-zinc-950 rounded-2xl p-4.5 transition-all shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
                  rule.active ? 'bg-zinc-50' : 'bg-zinc-100 opacity-60'
                }`}
              >
                {/* Visual node background connection lines */}
                <div className="absolute top-0 bottom-0 left-2 w-1.5 bg-indigo-500/10 pointer-events-none" />

                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2.5 border-2 border-zinc-950 rounded-xl shrink-0 ${
                    rule.active ? 'bg-indigo-100 text-indigo-950' : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    <Activity className={`w-4 h-4 ${rule.active ? 'animate-pulse' : ''}`} />
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tight truncate">{rule.name}</h4>
                    
                    {/* Visual Event Trigger Connection */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1 font-black text-zinc-500 uppercase tracking-wider flex-wrap">
                      <span className="bg-zinc-200 border border-zinc-300 text-zinc-800 px-1.5 py-0.5 rounded">
                        {rule.triggerEvent === 'create_lead' && '📅 Criação de Lead'}
                        {rule.triggerEvent === 'advance_proposta' && '📝 Transição Proposta'}
                        {rule.triggerEvent === 'schedule_visit' && '🚗 Agendamento'}
                        {rule.triggerEvent === 'closed_win' && '💰 Negócio ganho'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {rule.actionType === 'whatsapp_script' && `💬 WhatsApp "${rule.actionValue}"`}
                        {rule.actionType === 'send_email' && `📧 E-mail "${rule.actionValue}"`}
                        {rule.actionType === 'award_xp' && `🎯 Conceder +${rule.actionValue} XP`}
                        {rule.actionType === 'crm_notify' && `🔔 Notificar: ${rule.actionValue}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto select-none">
                  {/* XP Reward Label */}
                  <span className="font-mono text-[9px] font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
                    +{rule.xpValue} XP Real
                  </span>

                  {/* Toggle Activator button */}
                  <button
                    id={`flows-toggle-${rule.id}`}
                    type="button"
                    onClick={() => handleToggleRule(rule.id)}
                    className="text-zinc-650 hover:text-zinc-900 transition cursor-pointer"
                  >
                    {rule.active ? (
                      <ToggleRight className="w-8 h-8 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-400" />
                    )}
                  </button>

                  <button
                    id={`flows-delete-${rule.id}`}
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 text-indigo-950 border border-indigo-250 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed font-sans">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Garantia de Sincronia Real:</strong> Diferente de outros CRMs com simulações fantasma em background, estes fluxos de automação agem <strong>estritamente</strong> mediante as suas ações reais no pipeline. O robô só trabalha quando você move o lead!
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: COMMUNICATIONS TEMPLATE EDITOR (5 COLUMNS) */}
        <div className="lg:col-span-5 bg-white border-4 border-zinc-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Template type switch tab button */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 select-none">
              <div className="space-y-1">
                <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-purple-650" />
                  Editor de Scripts Estratégicos
                </h2>
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 font-bold block">MODELOS DE COPYWRITING</span>
              </div>
            </div>

            <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 select-none">
              <button
                id="script-tab-wa-btn"
                type="button"
                onClick={() => {
                  triggerSensoryFeedback('click', accSettings);
                  setActiveScriptTab('whatsapp');
                }}
                className={`flex-1 py-2 text-[10px] font-mono font-black uppercase text-center rounded-lg border transition ${
                  activeScriptTab === 'whatsapp'
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-900 border-transparent hover:bg-zinc-200/50'
                }`}
              >
                💬 Roteiros WhatsApp
              </button>
              <button
                id="script-tab-email-btn"
                type="button"
                onClick={() => {
                  triggerSensoryFeedback('click', accSettings);
                  setActiveScriptTab('email');
                }}
                className={`flex-1 py-2 text-[10px] font-mono font-black uppercase text-center rounded-lg border transition ${
                  activeScriptTab === 'email'
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-900 border-transparent hover:bg-zinc-200/50'
                }`}
              >
                📧 Campanhas de E-mail
              </button>
            </div>

            {/* Selector list of templates based on active tabs */}
            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase">
                <span>Selecionar para Editar:</span>
                <button 
                  type="button"
                  id="script-add-new-model"
                  onClick={handleAddNewModel} 
                  className="text-indigo-600 hover:underline flex items-center gap-0.5 text-[9px] font-extrabold uppercase"
                >
                  <Plus className="w-3 h-3 shrink-0" /> Criar Novo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto p-1 border border-zinc-150 rounded-xl">
                {activeScriptTab === 'email' ? (
                  templates.map(temp => (
                    <button
                      id={`edit-temp-email-select-${temp.id}`}
                      key={temp.id}
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback('click', accSettings);
                        setSelectedTemplateId(temp.id);
                      }}
                      className={`p-2 rounded-lg border text-left text-[10px] font-bold truncate transition ${
                        selectedTemplateId === temp.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                          : 'border-zinc-200 hover:border-zinc-400 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      📧 {temp.name}
                    </button>
                  ))
                ) : (
                  whatsappTemplates.map(temp => (
                    <button
                      id={`edit-temp-wa-select-${temp.id}`}
                      key={temp.id}
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback('click', accSettings);
                        setSelectedTemplateId(temp.id);
                      }}
                      className={`p-2 rounded-lg border text-left text-[10px] font-bold truncate transition ${
                        selectedTemplateId === temp.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                          : 'border-zinc-200 hover:border-zinc-400 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      💬 {temp.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Template editing inputs block */}
            <div className="space-y-3 font-mono text-xs text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Nome do Modelo</label>
                <input
                  id="flows-edit-temp-name"
                  type="text"
                  className="w-full bg-zinc-50 border-2 border-zinc-950 p-2.5 rounded-xl font-bold focus:bg-white focus:outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do Modelo"
                />
              </div>

              {activeScriptTab === 'email' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Assunto do E-mail</label>
                  <input
                    id="flows-edit-temp-subject"
                    type="text"
                    className="w-full bg-zinc-50 border-2 border-zinc-950 p-2.5 rounded-xl font-bold focus:bg-white focus:outline-none"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Assunto"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  <span>Conteúdo (Arraste e Escreva)</span>
                  <span className="text-indigo-600 text-[8.5px]">Tags de Fusão Ativas 🏷️</span>
                </div>
                <textarea
                  id="flows-edit-temp-body"
                  rows={5}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 p-2.5 rounded-xl font-bold focus:bg-white font-mono focus:outline-none leading-relaxed text-[11px]"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Seu texto de abordagem..."
                />
              </div>

              {/* Variable Helper chips list */}
              <div className="bg-zinc-950/5 border border-zinc-200 rounded-xl p-2.5 space-y-1 select-none">
                <span className="text-[8.5px] font-black uppercase text-zinc-500 block font-mono">Dica: Use as tags para fusão preditiva:</span>
                <div className="flex flex-wrap gap-1 font-mono text-[8px] font-extrabold text-zinc-650">
                  <span className="bg-white border border-zinc-300 px-1 py-0.5 rounded cursor-help" title="Injeta o nome do lead real">{"{{clientName}}"}</span>
                  <span className="bg-white border border-zinc-300 px-1 py-0.5 rounded cursor-help" title="Injeta a renda familiar de vendas">{"{{income}}"}</span>
                  <span className="bg-white border border-zinc-300 px-1 py-0.5 rounded cursor-help" title="Injeta o valor estimado do lead">{"{{budget}}"}</span>
                  <span className="bg-white border border-zinc-300 px-1 py-0.5 rounded cursor-help" title="Injeta seu número registrado do CRECI">{"{{creci}}"}</span>
                  <span className="bg-white border border-zinc-300 px-1 py-0.5 rounded cursor-help" title="Injeta o nome do empreendimento imobiliário">{"{{propertyInterest}}"}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-zinc-200 grid grid-cols-3 gap-3">
            <button
              id="flows-template-delete"
              type="button"
              onClick={() => handleDeleteTemplate(selectedTemplateId)}
              className="py-2.5 bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 text-zinc-500 font-mono font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer select-none"
            >
              Apagar Modelo
            </button>
            <div className="col-span-2">
              <button
                id="flows-template-save"
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-[10px] uppercase rounded-xl border-2 border-zinc-950 shadow-[2.5px_2.5px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center gap-1.5 transition cursor-pointer select-none"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Salvando Alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Modelo Estratégico</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
