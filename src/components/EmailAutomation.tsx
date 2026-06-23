/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Lead, EmailTemplate, EmailLog } from "../types";
import {
  Mail,
  Send,
  Plus,
  ChevronRight,
  CornerDownRight,
  Paperclip,
  CheckCircle2,
  Trash2,
  Smartphone,
  Instagram,
  Facebook,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Play,
  Square,
  UserCheck,
  Clock,
  Volume2,
  AlertTriangle,
  RotateCcw,
  ListOrdered,
  History,
} from "lucide-react";
import {
  triggerSensoryFeedback,
  INITIAL_ACCESSIBILITY_SETTINGS,
} from "../utils/sensory";

interface EmailAutomationProps {
  leads: Lead[];
  globalFilteredLeads?: Lead[];
  globalSearchTerm?: string;
  templates: EmailTemplate[];
  logs: EmailLog[];
  onAddTemplate: (newTemplate: EmailTemplate) => void;
  onEditTemplate: (updatedTemplate: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSendEmailSimulated: (emailLog: EmailLog) => void;
  theme?: "claro" | "escuro" | "galatico";
  accSettings?: any;
  initialTargetLeadIds?: string[];
  onClearInitialTargets?: () => void;
  tableHeaderComponent?: React.ReactNode | ((selectedLeadIds: string[], actions?: any) => React.ReactNode);
  forcedSubTab?: "massa" | "templates" | "logs";
  setEmailLogs?: React.Dispatch<React.SetStateAction<EmailLog[]>>;
  addNotification?: (title: string, body: string, type: string) => void;
  onlyTable?: boolean;
}

export default function EmailAutomation({
  leads,
  globalFilteredLeads,
  globalSearchTerm,
  templates,
  logs,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSendEmailSimulated,
  theme = "escuro",
  accSettings = INITIAL_ACCESSIBILITY_SETTINGS,
  initialTargetLeadIds = [],
  onClearInitialTargets,
  tableHeaderComponent,
  forcedSubTab,
  setEmailLogs,
  addNotification,
  onlyTable = false,
}: EmailAutomationProps) {
  // Tabs: 'fila' (Fila de Disparos), 'massa' (Painel de Administração e Disparos), 'templates' (Modelos), 'logs' (Histórico)
  const [activeTab, setActiveTab] = useState<"massa" | "templates" | "logs">(
    forcedSubTab || "massa",
  );

  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Synchronize state if forcedSubTab changes
  useEffect(() => {
    if (forcedSubTab) {
      setActiveTab(forcedSubTab);
    }
  }, [forcedSubTab]);

  // Filter dispatch options based on selected leads from CRM list
  const [isFilterBySelected, setIsFilterBySelected] = useState<boolean>(
    initialTargetLeadIds.length > 0,
  );

  // Sync state if initialTargetLeadIds changes
  useEffect(() => {
    if (initialTargetLeadIds.length > 0) {
      setIsFilterBySelected(true);
    }
  }, [initialTargetLeadIds]);

  // New/Edit Template Form States
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("");

  // Single Dispatch Selector States
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [dispatchChannel, setDispatchChannel] = useState<
    "whatsapp" | "email" | "instagram" | "facebook"
  >("whatsapp");
  const [socialHandle, setSocialHandle] = useState("");
  const [copied, setCopied] = useState(false);

  // TIMEOUT & TIMED QUEUE STATES
  interface QueueItem {
    lead: Lead;
    status: "idle" | "sending" | "waiting" | "done" | "failed";
    logId?: string;
  }
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedQueueTemplateId, setSelectedQueueTemplateId] = useState("");
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [countdown, setCountdown] = useState<number>(0);
  const [queueChannel, setQueueChannel] = useState<"whatsapp" | "email">(
    "whatsapp",
  );
  const [dispatchMode, setDispatchMode] = useState<"auto" | "semi-auto" | "manual">("semi-auto");
  const [leadsPerBlock, setLeadsPerBlock] = useState<number>(5);
  const [timerBetweenBlocks, setTimerBetweenBlocks] = useState<number>(60);
  const [timerBetweenLeads, setTimerBetweenLeads] = useState<number>(10);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [leadCheckboxSelection, setLeadCheckboxSelection] = useState<
    Record<string, boolean>
  >({});

  // Fila Criação Modal States
  const [isQueueCreationModalOpen, setIsQueueCreationModalOpen] =
    useState(false);
  const [newQueueName, setNewQueueName] = useState("");
  const [newQueueTimerBlocks, setNewQueueTimerBlocks] = useState(0);
  const [newQueueTimerContacts, setNewQueueTimerContacts] = useState(3);
  const [newQueueScriptType, setNewQueueScriptType] = useState<
    "custom" | "preselected"
  >("preselected");
  const [newQueueCustomScriptId, setNewQueueCustomScriptId] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Placeholders list
  const placeholders = [
    { code: "{{nome}}", desc: "Nome do lead" },
    { code: "{{clientName}}", desc: "Nome do cliente" },
    { code: "{{valor}}", desc: "Preço/Valor de Venda" },
    { code: "{{budget}}", desc: "Preço/Valor de Venda" },
    { code: "{{income}}", desc: "Renda Familiar" },
    { code: "{{creci}}", desc: "Seu Número de CRECI" },
    { code: "{{propertyInterest}}", desc: "Nome do Imóvel de Interesse" },
    { code: "{{origem}}", desc: "Origem do lead" },
  ];

  // Compile / Resolve placeholders in real-time
  const resolvePlaceholders = (text: string, lead: Lead): string => {
    return text
      .replace(/\{\{nome\}\}/g, lead.name)
      .replace(/\{\{clientName\}\}/g, lead.name)
      .replace(/\{\{empresa\}\}/g, lead.company || "sua empresa")
      .replace(/\{\{origem\}\}/g, lead.origin)
      .replace(
        /\{\{valor\}\}/g,
        lead.value
          ? lead.value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            })
          : "0",
      )
      .replace(
        /\{\{budget\}\}/g,
        lead.value
          ? lead.value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            })
          : "0",
      )
      .replace(
        /\{\{income\}\}/g,
        lead.familyIncome
          ? lead.familyIncome.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            })
          : "sob consulta",
      )
      .replace(
        /\{\{creci\}\}/g,
        localStorage.getItem("ciclocred_user_creci") || "Inexistente",
      )
      .replace(
        /\{\{propertyInterest\}\}/g,
        lead.propertyInterest || "Empreendimento Cury",
      );
  };

  // Resolve list of leads strictly respecting the global filters logic
  const targetLeadsList =
    globalFilteredLeads &&
    (globalSearchTerm || globalFilteredLeads.length !== leads.length)
      ? globalFilteredLeads
      : leads.filter(
          (l) =>
            l.status !== "fechado" &&
            l.status !== "perdido" &&
            l.status !== "arquivado",
        ); // Default to active if no filtering applies

  const handleCreateOrEditTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) return;

    if (editingTemplate) {
      onEditTemplate({
        ...editingTemplate,
        name,
        subject,
        body,
        triggerEvent: triggerEvent || undefined,
      });
      setEditingTemplate(null);
    } else {
      onAddTemplate({
        id: `template-${Date.now()}`,
        name,
        subject,
        body,
        triggerEvent: triggerEvent || undefined,
      });
      setIsCreating(false);
    }

    // Reset Form
    setName("");
    setSubject("");
    setBody("");
    setTriggerEvent("");
  };

  const startEdit = (temp: EmailTemplate) => {
    setEditingTemplate(temp);
    setName(temp.name);
    setSubject(temp.subject);
    setBody(temp.body);
    setTriggerEvent(temp.triggerEvent || "");
    setIsCreating(true);
  };

  const handleTemplateSelection = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    const lead = leads.find((l) => l.id === selectedLeadId);

    if (tmpl) {
      if (lead) {
        setCustomSubject(resolvePlaceholders(tmpl.subject, lead));
        setCustomBody(resolvePlaceholders(tmpl.body, lead));
      } else {
        setCustomSubject(tmpl.subject);
        setCustomBody(tmpl.body);
      }
    } else {
      setCustomSubject("");
      setCustomBody("");
    }
  };

  const handleLeadSelection = (id: string) => {
    setSelectedLeadId(id);
    const lead = leads.find((l) => l.id === id);
    const tmpl = templates.find((t) => t.id === selectedTemplateId);

    if (lead && tmpl) {
      setCustomSubject(resolvePlaceholders(tmpl.subject, lead));
      setCustomBody(resolvePlaceholders(tmpl.body, lead));
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(customBody);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Helper trigger for action
  const executeSingleDispatchEvent = (
    lead: Lead,
    templateSubject: string,
    resolvedBody: string,
    channel: "whatsapp" | "email" | "instagram" | "facebook",
  ): boolean => {
    let opened: Window | null = null;
    try {
      if (channel === "email") {
        const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(templateSubject || "Oportunidade de Crédito & Cury")}&body=${encodeURIComponent(resolvedBody)}`;
        opened = window.open(mailtoUrl, "_blank");
      } else if (channel === "whatsapp") {
        const rawPhone = (lead.phone || "").replace(/\D/g, "");
        const cleanPhone = rawPhone.startsWith("55")
          ? rawPhone
          : `55${rawPhone}`;
        const waUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(resolvedBody)}`;
        window.location.href = waUrl;
        opened = window;
      } else if (channel === "instagram") {
        const instaUser = socialHandle ? socialHandle.replace("@", "") : "";
        const url = instaUser
          ? `https://instagram.com/${instaUser}/`
          : "https://instagram.com/direct/inbox/";
        navigator.clipboard.writeText(resolvedBody);
        opened = window.open(url, "_blank");
      } else if (channel === "facebook") {
        const fbUser = socialHandle;
        const url = fbUser
          ? `https://m.me/${fbUser}`
          : "https://messenger.com/";
        navigator.clipboard.writeText(resolvedBody);
        opened = window.open(url, "_blank");
      }
    } catch (err) {
      console.warn("Blocked window.open:", err);
    }

    const success = !!opened;
    if (success) {
      setIsPopupBlocked(false);
    }
    return success;
  };

  const handleRealLocalDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead || !customBody) return;

    executeSingleDispatchEvent(
      lead,
      customSubject,
      customBody,
      dispatchChannel,
    );

    // Save log entry inside local CRM audit
    const chosenTemplate = templates.find((t) => t.id === selectedTemplateId);
    const log: EmailLog = {
      id: `log-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      templateName:
        (chosenTemplate ? chosenTemplate.name : "Personalizado") +
        ` (${dispatchChannel.toUpperCase()})`,
      subject: customSubject || `Script para ${lead.name}`,
      body: customBody,
      sentAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "enviado",
    };

    onSendEmailSimulated(log);

    // Reset simulator inputs
    setSelectedLeadId("");
    setSelectedTemplateId("");
    setCustomSubject("");
    setCustomBody("");
    setSocialHandle("");
    triggerSensoryFeedback("success", accSettings);
    setActiveTab("logs");
  };

  // MULTI-SELECTION FOR AUTOMATED TIMER QUEUE
  const handleToggleLeadSelection = (leadId: string) => {
    setLeadCheckboxSelection((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  };

  const handleSelectAllLeadsForQueue = () => {
    const newVal: Record<string, boolean> = {};
    targetLeadsList.forEach((l) => {
      newVal[l.id] = true;
    });
    setLeadCheckboxSelection(newVal);
    triggerSensoryFeedback("chime", accSettings);
  };

  const handleClearCheckboxSelection = () => {
    setLeadCheckboxSelection({});
    triggerSensoryFeedback("click", accSettings);
  };

  const handleAddSelectedToQueue = () => {
    const selectedLeads = targetLeadsList.filter(
      (l) => leadCheckboxSelection[l.id],
    );
    if (selectedLeads.length === 0) return;

    const newQueueItems: QueueItem[] = selectedLeads.map((l) => ({
      lead: l,
      status: "idle",
    }));

    setQueue((prev) => [...prev, ...newQueueItems]);
    setLeadCheckboxSelection({});
    triggerSensoryFeedback("success", accSettings);
  };

  const handleClearQueue = () => {
    stopQueueEngine();
    setQueue([]);
    setCurrentQueueIndex(-1);
    setCountdown(0);
    triggerSensoryFeedback("warning", accSettings);
  };

  const handleCreateQueueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLeads = targetLeadsList.filter(
      (l) => leadCheckboxSelection[l.id],
    );
    if (selectedLeads.length === 0) return;

    // Optional: we can apply "newQueueScriptType" logic. For now, pushing to queue.
    const newItems: QueueItem[] = selectedLeads.map((l) => ({
      lead: l,
      status: "idle",
    }));

    if (newQueueScriptType === "custom" && newQueueCustomScriptId) {
      setSelectedQueueTemplateId(newQueueCustomScriptId);
    }

    setQueue((prev) => [...prev, ...newItems]);
    setLeadCheckboxSelection({});
    setIsQueueCreationModalOpen(false);
    triggerSensoryFeedback("success", accSettings);
    setActiveTab("massa"); // Transition to Massa tab directly
  };

  // QUEUE PROCESSING CORE LOGIC
  const stopQueueEngine = () => {
    setIsQueueRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleStartQueue = () => {
    if (queue.length === 0) return;
    if (!selectedQueueTemplateId) {
      alert(
        "Por favor, selecione qual Modelo de Script deseja disparar para o lote.",
      );
      return;
    }

    triggerSensoryFeedback("chime", accSettings);
    setIsQueueRunning(true);

    // Find next non-done item
    let startIndex = queue.findIndex((item) => item.status !== "done");
    if (startIndex === -1) {
      // If all are finished, reset status to idle and start from beginning
      const resetQueue = queue.map((item) => ({
        ...item,
        status: "idle" as const,
      }));
      setQueue(resetQueue);
      startIndex = 0;
    }

    setCurrentQueueIndex(startIndex);
  };

  const handleAssistedDispatch = () => {
    if (currentQueueIndex === -1 || currentQueueIndex >= queue.length) return;
    const item = queue[currentQueueIndex];

    const selectedTmpl = templates.find(
      (t) => t.id === selectedQueueTemplateId,
    );
    let scriptSubject = selectedTmpl
      ? selectedTmpl.subject
      : "Apresentação de Cury";
    let scriptBody = selectedTmpl ? selectedTmpl.body : "Olá {{nome}}";

    if (selectedQueueTemplateId === "gemini_auto") {
      scriptSubject = "Apresentação Personalizada Cury";
      scriptBody = `Olá {{nome}}, tudo bem?

Vi que o seu perfil {{perfil}} tem muito a ver com algumas oportunidades de imóveis que foram recém liberadas.
Sabendo que sua renda gira em torno de R$ {{renda}}, conseguimos aprovações muito facilitadas com condições exclusivas, principalmente se estivermos focando na região de {{regiao}}. 

Gostaria de te enviar algumas fotos sem compromisso?`;
    }

    const resolvedSubject = resolvePlaceholders(scriptSubject, item.lead);
    const resolvedBody = resolvePlaceholders(scriptBody, item.lead);

    // 1. Fire window.open (this is a direct click gesture, popups will never be blocked!)
    executeSingleDispatchEvent(
      item.lead,
      resolvedSubject,
      resolvedBody,
      queueChannel,
    );

    // 2. Write CRM audit log
    const auditRecord: EmailLog = {
      id: `log-queue-${Date.now()}-${currentQueueIndex}`,
      leadId: item.lead.id,
      leadName: item.lead.name,
      templateName:
        selectedQueueTemplateId === "gemini_auto"
          ? "Auto-Gerado via Gemini"
          : (selectedTmpl ? selectedTmpl.name : "Modelo de Lote") +
            ` (${queueChannel.toUpperCase()} - Fila Assistida)`,
      subject: resolvedSubject,
      body: resolvedBody,
      sentAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "enviado",
    };
    onSendEmailSimulated(auditRecord);

    // 3. Mark item as done
    setQueue((prev) =>
      prev.map((q, idx) =>
        idx === currentQueueIndex ? { ...q, status: "done" } : q,
      ),
    );

    // 4. Play success feedback
    triggerSensoryFeedback("chime", accSettings);

    // 5. Move to next item in the queue
    setCurrentQueueIndex((prev) => prev + 1);
  };

  // Run queue trigger whenever index changes if queue is running
  useEffect(() => {
    if (!isQueueRunning || currentQueueIndex === -1 || currentQueueIndex >= queue.length) {
      if (isQueueRunning && currentQueueIndex >= queue.length) {
        setIsQueueRunning(false);
        setCurrentQueueIndex(-1);
        triggerSensoryFeedback("success", accSettings);
      }
      return;
    }

    const item = queue[currentQueueIndex];

    if (item.status !== "idle") {
      return; // Already being processed or done
    }

    setQueue((prev) =>
      prev.map((q, idx) =>
        idx === currentQueueIndex ? { ...q, status: "sending" } : q,
      ),
    );

    if (dispatchMode === "manual") {
      // In manual mode, we PAUSE here and wait for the manual click to avoid popup blocker!
      // No automatic timers or window opens.
      return;
    }

    // Fire immediately for Auto and Semi-Auto
    const selectedTmpl = templates.find((t) => t.id === selectedQueueTemplateId);
    let scriptSubject = selectedTmpl ? selectedTmpl.subject : "Apresentação de Cury";
    let scriptBody = selectedTmpl ? selectedTmpl.body : "Olá {{nome}}";

    if (selectedQueueTemplateId === "gemini_auto") {
      scriptSubject = "Apresentação Personalizada Cury";
      scriptBody = `Olá {{nome}}, tudo bem?\n\nVi que o seu perfil {{perfil}} tem muito a ver com algumas oportunidades de imóveis que foram recém liberadas.\nSabendo que sua renda gira em torno de R$ {{renda}}, conseguimos aprovações muito facilitadas com condições exclusivas, principalmente se estivermos focando na região de {{regiao}}.\n\nGostaria de te enviar algumas fotos sem compromisso?`;
    }

    const resolvedSubject = resolvePlaceholders(scriptSubject, item.lead);
    const resolvedBody = resolvePlaceholders(scriptBody, item.lead);

    const success = executeSingleDispatchEvent(item.lead, resolvedSubject, resolvedBody, queueChannel);
    setIsPopupBlocked(!success && queueChannel === "whatsapp");

    const auditRecord: EmailLog = {
      id: `log-queue-${Date.now()}-${currentQueueIndex}`,
      leadId: item.lead.id,
      leadName: item.lead.name,
      templateName: selectedQueueTemplateId === "gemini_auto" ? "Auto-Gerado via Gemini" : (selectedTmpl ? selectedTmpl.name : "Modelo de Lote") + ` (${queueChannel.toUpperCase()} - Fila)`,
      subject: resolvedSubject,
      body: resolvedBody,
      sentAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "enviado",
    };
    onSendEmailSimulated(auditRecord);

    setQueue((prev) => prev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: "waiting" } : q));

    // Calculate wait time
    // If it's a block end (ie (index + 1) % leadsPerBlock == 0), wait 'timerBetweenBlocks'. Otherwise 'timerBetweenLeads'
    const isBlockEnd = (currentQueueIndex + 1) % leadsPerBlock === 0;
    const waitTimeSeconds = isBlockEnd && currentQueueIndex < queue.length - 1 ? timerBetweenBlocks : timerBetweenLeads;
    
    setCountdown(waitTimeSeconds);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
       if (dispatchMode === "semi-auto" && !document.hasFocus()) {
           // Pause countdown when not focused in semi-auto mode
           return; 
       }
       setCountdown((prev) => {
         if (prev <= 1) {
           if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
           
           // Complete item and go next
           setQueue((qPrev) =>
             qPrev.map((q, idx) => idx === currentQueueIndex ? { ...q, status: "done" } : q)
           );
           
           // Slight delay to decouple state updates
           setTimeout(() => {
               setCurrentQueueIndex((idx) => idx + 1);
           }, 0);
           
           return 0;
         }
         return prev - 1;
       });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [
    isQueueRunning,
    currentQueueIndex,
    selectedQueueTemplateId,
    dispatchMode,
    leadsPerBlock,
    timerBetweenBlocks,
    timerBetweenLeads
  ]);

  // Clean-up refs on destroy
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Keyboard accessibility: press ENTER in assisted mode to fire and advance the campaign queue instantly
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if operator is writing inside fields/textareas
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.hasAttribute("contenteditable"))
      ) {
        return;
      }

      if (
        isQueueRunning &&
        dispatchMode === "manual" &&
        currentQueueIndex !== -1 &&
        currentQueueIndex < queue.length
      ) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAssistedDispatch();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [
    isQueueRunning,
    dispatchMode,
    currentQueueIndex,
    queue,
    selectedQueueTemplateId,
  ]);

  // Theme support colors
  const pageBackground =
    theme === "claro"
      ? "bg-zinc-50 text-zinc-900"
      : theme === "escuro"
        ? "bg-zinc-950 text-zinc-100"
        : "bg-indigo-950/20 text-indigo-100";

  const cardBackground =
    theme === "claro"
      ? "bg-white border-4 border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
      : theme === "escuro"
        ? "bg-zinc-900 border-4 border-zinc-950 text-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        : "bg-indigo-950/70 border-4 border-indigo-900 text-indigo-100 shadow-[4px_4px_0px_0px_rgba(129,140,248,0.15)]";

  const subCardBackground =
    theme === "claro"
      ? "bg-zinc-100 border border-zinc-250 text-zinc-800"
      : "bg-zinc-950 border border-zinc-800 text-zinc-300";
  const labelTextColor = theme === "claro" ? "text-zinc-700" : "text-zinc-300";
  const subtitleTextColor =
    theme === "claro" ? "text-zinc-500" : "text-zinc-400";

  return (
    <div className={`space-y-8 animate-fadeIn ${pageBackground}`}>
      {activeTab !== "massa" && tableHeaderComponent && typeof tableHeaderComponent === 'function' && (
        <div className="w-full">
          {tableHeaderComponent([], {})}
        </div>
      )}
      
      {/* Tab Navigation header removed - controlled directly by outer navigation */}

      {/* RENDER FILA TAB (Seleção de Leads e Criação de Fila) */}
      {activeTab === "fila" && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={
              cardBackground +
              " p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-0"
            }
          >
            <div>
              <h2 className="text-md font-black uppercase tracking-tight">
                Criar Fila de Disparos
              </h2>
              <p className="text-xs font-medium font-sans">
                Selecione os leads de acordo com seus próximos passos e crie
                filas dinâmicas.
              </p>
            </div>
            <button
              onClick={() => setIsQueueCreationModalOpen(true)}
              disabled={
                targetLeadsList.filter((l) => leadCheckboxSelection[l.id])
                  .length === 0
              }
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-900 text-white font-black rounded-xl text-xs uppercase border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus className="w-4 h-4" />
              <span>
                Criar Fila (
                {
                  targetLeadsList.filter((l) => leadCheckboxSelection[l.id])
                    .length
                }
                )
              </span>
            </button>
          </div>

          <div className="bg-white border-4 border-zinc-950 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllLeadsForQueue}
                  className="text-[10px] font-mono font-black uppercase text-indigo-700 hover:text-indigo-900 underline"
                >
                  Selecionar Todos
                </button>
                <span className="text-zinc-300">|</span>
                <button
                  onClick={handleClearCheckboxSelection}
                  className="text-[10px] font-mono font-black uppercase text-zinc-600 hover:text-zinc-900 underline"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-zinc-900 rounded-lg custom-scrollbar">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-900 text-white font-mono sticky top-0 z-10">
                  <tr>
                    <th className="p-3 border-b-2 border-zinc-900 w-10 text-center">
                      <Check className="w-3.5 h-3.5 inline text-indigo-400" />
                    </th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 whitespace-nowrap">
                      ID / Nome do Lead
                    </th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 whitespace-nowrap min-w-[150px]">
                      Status & Próximo Passo
                    </th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 w-full min-w-[150px]">
                      Sugestão Próximo Roteiro/Script
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {targetLeadsList.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className={
                        idx % 2 === 0
                          ? "bg-zinc-50 hover:bg-indigo-50"
                          : "bg-white hover:bg-indigo-50"
                      }
                    >
                      <td
                        className="p-3 border-r border-b border-zinc-200 text-center cursor-pointer"
                        onClick={() => handleToggleLeadSelection(lead.id)}
                      >
                        <input
                          type="checkbox"
                          checked={!!leadCheckboxSelection[lead.id]}
                          readOnly
                          className="accent-indigo-500 h-3.5 w-3.5 rounded"
                        />
                      </td>
                      <td
                        className="px-3 py-4 border-r border-b border-zinc-200 cursor-pointer"
                        onClick={() => handleToggleLeadSelection(lead.id)}
                      >
                        <div
                          className="font-bold text-zinc-800 text-xs truncate max-w-[150px]"
                          title={lead.name}
                        >
                          {lead.name}
                        </div>
                        <div className="font-mono text-zinc-500 text-[9px] mt-1">
                          Ref: {lead.id.split("-")[0].toUpperCase()}
                        </div>
                      </td>
                      <td className="px-3 py-4 border-r border-b border-zinc-200 font-mono text-[9px] space-y-1 text-zinc-600">
                        <div className="flex justify-between">
                          <span className="font-bold uppercase text-zinc-800">
                            Status:
                          </span>{" "}
                          <span>{(lead.status || "").replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold uppercase text-zinc-800">
                            Etapa:
                          </span>{" "}
                          <span>{(lead.stage || "").replace("_", " ")}</span>
                        </div>
                        {lead.nextAction && (
                          <div className="mt-1 pt-1 border-t border-zinc-200 text-indigo-700 font-bold whitespace-normal line-clamp-2">
                            {lead.nextAction}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 border-b border-zinc-200 font-sans text-[10px] text-zinc-700 italic">
                        {
                          "(Scripts Contextuais serão compilados de acordo com etapa)"
                        }
                      </td>
                    </tr>
                  ))}
                  {targetLeadsList.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-zinc-400 font-mono font-bold"
                      >
                        NENHUM LEAD CORRESPONDE AOS FILTROS.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR FILA */}
      {isQueueCreationModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-zinc-950 rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] max-w-xl w-full">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-3 mb-4">
              <h3 className="font-black text-lg uppercase tracking-tight text-zinc-900">
                Configuração da Fila de Transferência
              </h3>
              <button
                onClick={() => setIsQueueCreationModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                {/* Fechar */}X
              </button>
            </div>

            <form onSubmit={handleCreateQueueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-black uppercase text-zinc-700 mb-1">
                  Nome da Fila
                </label>
                <input
                  type="text"
                  value={newQueueName}
                  onChange={(e) => setNewQueueName(e.target.value)}
                  placeholder="Ex: Disparo Segunda-Feira Convênio Cury"
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-900 font-bold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-black uppercase text-zinc-700 mb-1">
                    Tempo entre Bloq. (min)
                  </label>
                  <input
                    type="number"
                    value={newQueueTimerBlocks}
                    onChange={(e) =>
                      setNewQueueTimerBlocks(Number(e.target.value))
                    }
                    min={0}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-900 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-black uppercase text-zinc-700 mb-1">
                    Tempo Contatos (seg)
                  </label>
                  <input
                    type="number"
                    value={newQueueTimerContacts}
                    onChange={(e) =>
                      setNewQueueTimerContacts(Number(e.target.value))
                    }
                    min={3}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-900 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <label className="block text-xs font-mono font-black uppercase text-zinc-700">
                  Origem do Script do Lote
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      checked={newQueueScriptType === "preselected"}
                      onChange={() => setNewQueueScriptType("preselected")}
                      className="accent-indigo-600"
                    />
                    Scripts Contextuais Locais (Cada Lead mantém seu script)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      checked={newQueueScriptType === "custom"}
                      onChange={() => setNewQueueScriptType("custom")}
                      className="accent-indigo-600"
                    />
                    Sobrescrever com Modelo
                  </label>
                </div>
              </div>

              {newQueueScriptType === "custom" && (
                <div className="pt-2 animate-fadeIn">
                  <select
                    value={newQueueCustomScriptId}
                    onChange={(e) => setNewQueueCustomScriptId(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-900 font-extrabold outline-none"
                    required
                  >
                    <option value="">
                      Selecione o Roteiro Script sobressalente...
                    </option>
                    {templates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} (Gatilho: {tmpl.triggerEvent || "Geral"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t-2 border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setIsQueueCreationModalOpen(false)}
                  className="px-4 py-2 border-2 border-zinc-950 rounded-xl font-black text-xs uppercase text-zinc-700 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-px active:shadow-none transition-all"
                >
                  Iniciar Lote 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER MODEL TAB (Modelos de Scripts) */}
      {activeTab === "templates" && (
        <div id="email-templates-tab-pane" className="space-y-6 animate-fadeIn">
          {/* Template Add / Form editor */}
          {isCreating ? (
            <form
              onSubmit={handleCreateOrEditTemplate}
              className={cardBackground}
            >
              <h3 className="text-md font-black uppercase italic tracking-tight border-b-2 border-zinc-900/40 pb-3 flex items-center gap-2">
                <span>
                  {editingTemplate
                    ? "✏️ Editar Modelo de Script"
                    : "✉️ Novo Script de Atendimento"}
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="temp-name"
                    className="block text-xs font-black uppercase mb-2 font-mono"
                  >
                    Nome de Controle do Script
                  </label>
                  <input
                    type="text"
                    id="temp-name"
                    required
                    placeholder="Ex: First-call Convênio Cury MCMV"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:bg-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="temp-trigger"
                    className="block text-xs font-black uppercase mb-2 font-mono"
                  >
                    Gatilho do Funil
                  </label>
                  <input
                    type="text"
                    id="temp-trigger"
                    placeholder="Ex: Proposta Inicial de Venda"
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:bg-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="temp-subject"
                  className="block text-xs font-black uppercase mb-2 font-mono"
                >
                  Assunto / Título do Disparo
                </label>
                <input
                  type="text"
                  id="temp-subject"
                  required
                  placeholder="Seu assunto ou cabeçalho contendo variáveis de controle..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:bg-zinc-900 outline-none"
                />
              </div>

              {/* Placeholders helper bar */}
              <div
                id="email-template-placeholders"
                className={`flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl border mt-4 ${subCardBackground}`}
              >
                <span className="text-[10px] uppercase font-mono font-black">
                  Gatilhos Rápidos:
                </span>
                {placeholders.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => {
                      setBody((prev) => prev + " " + p.code);
                    }}
                    title={p.desc}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white border border-zinc-950 font-black px-3 py-1 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none cursor-pointer"
                  >
                    {p.code}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label
                  htmlFor="temp-body"
                  className="block text-xs font-black uppercase mb-2 font-mono"
                >
                  Corpo da Mensagem (Script Texto)
                </label>
                <textarea
                  id="temp-body"
                  required
                  rows={8}
                  placeholder="Olá {{nome}}, temos uma excelente oportunidade no residencial Cury Metropolitana..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-3 text-sm text-white focus:bg-zinc-900 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-zinc-800 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4.5 py-2.5 border-2 border-zinc-950 hover:bg-zinc-800 text-zinc-300 font-black rounded-xl text-xs uppercase font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] font-mono"
                >
                  Salvar Roteiro Script
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div
                className={
                  cardBackground +
                  " p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                }
              >
                <div>
                  <h2 className="text-md font-black uppercase tracking-tight">
                    Roteiros e Scripts de Vendas
                  </h2>
                  <p className="text-xs font-medium font-sans">
                    Desenvolva abordagens táticas com campos dinâmicos voltados
                    à Cury, MCMV e SBPE.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Script</span>
                </button>
              </div>

              {/* Grid of existing templates */}
              <div
                id="templates-grid"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className={
                      cardBackground + " flex flex-col justify-between"
                    }
                  >
                    <div className="space-y-3 p-1">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-sans font-black text-sm uppercase tracking-tight">
                          {tmpl.name}
                        </h4>
                        {tmpl.triggerEvent && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded border border-zinc-950 bg-indigo-55 text-indigo-200 uppercase tracking-widest font-mono shrink-0">
                            {tmpl.triggerEvent}
                          </span>
                        )}
                      </div>
                      <div className="text-xs border-l-4 border-indigo-600 pl-3">
                        <span className="font-extrabold opacity-60">
                          Assunto:{" "}
                        </span>
                        {tmpl.subject}
                      </div>
                      <p className="text-xs line-clamp-4 whitespace-pre-wrap font-sans font-medium leading-relaxed">
                        {tmpl.body}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-zinc-800/60 pt-3.5 mt-4">
                      <button
                        onClick={() => startEdit(tmpl)}
                        className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-950 text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Editar
                      </button>
                      <button
                        id={`delete-template-${tmpl.id}`}
                        onClick={() => onDeleteTemplate(tmpl.id)}
                        className="px-3 py-1 bg-rose-950/20 text-rose-500 border border-rose-900/40 hover:bg-rose-950/40 text-[10px] font-black uppercase rounded"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER DISPATCH TAB (Painel de Disparos em Fila Comercial) */}
      {activeTab === "massa" && onlyTable ? (
        <div id="email-dispatch-tab-pane-onlytable" className="space-y-3 animate-fadeIn text-zinc-100">
          {/* Compact Control Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">Canal:</span>
              <select
                value={dispatchChannel}
                onChange={(e) => setDispatchChannel(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[9px] font-black uppercase text-zinc-100 outline-none"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>

              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 ml-2">Modo:</span>
              <select
                value={dispatchMode}
                onChange={(e) => setDispatchMode(e.target.value as any)}
                disabled={isQueueRunning}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[9px] font-black uppercase text-zinc-100 outline-none"
              >
                <option value="auto">Automático</option>
                <option value="semi-auto">Semi-Auto</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleStartQueue}
                disabled={queue.length === 0 || isQueueRunning}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[9px] font-black rounded uppercase flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3" /> Iniciar
              </button>
              <button
                type="button"
                onClick={stopQueueEngine}
                disabled={!isQueueRunning}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-[9px] font-black rounded uppercase flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3" /> Parar
              </button>
              <button
                onClick={() => {
                  setLeadCheckboxSelection({});
                  handleClearQueue();
                }}
                className="p-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded border border-zinc-800 text-[9px] cursor-pointer"
                title="Limpar Fila"
              >
                <RotateCcw className="w-3" />
              </button>
              {isQueueRunning && (
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-950 px-1.5 py-0.5 rounded font-bold animate-pulse">
                  {countdown}s
                </span>
              )}
            </div>
          </div>

          {/* Core Queue Table */}
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/20 flex flex-col h-[calc(100vh-340px)] min-h-[300px]">
            <div className="flex justify-between items-center p-2 bg-zinc-950/80 border-b border-zinc-800/60 text-[9px] font-mono font-black uppercase text-zinc-500">
              <button
                onClick={() => {
                  const allSelected = targetLeadsList.every((l) => leadCheckboxSelection[l.id]);
                  const newSelection: Record<string, boolean> = {};
                  if (!allSelected) {
                    targetLeadsList.forEach((l) => (newSelection[l.id] = true));
                  }
                  setLeadCheckboxSelection(newSelection);
                }}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pl-1"
              >
                <Check className="w-2.5 h-2.5" /> Selecionar Todos ({targetLeadsList.length})
              </button>

              <button
                onClick={() => {
                  const checkedIds = Object.keys(leadCheckboxSelection).filter((k) => leadCheckboxSelection[k]);
                  if (checkedIds.length > 0) {
                    setQueue(targetLeadsList.filter((l) => checkedIds.includes(l.id)).map((l) => ({ lead: l, status: 'idle' })));
                    if (addNotification) {
                      addNotification(
                        "Fila Preparada",
                        `${checkedIds.length} leads preparados para envio.`,
                        "success"
                      );
                    }
                  }
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider"
              >
                Gerar Fila ({Object.keys(leadCheckboxSelection).filter((k) => leadCheckboxSelection[k]).length})
              </button>
            </div>

            {targetLeadsList.length === 0 ? (
              <div className="p-12 text-center text-[10px] font-mono font-black opacity-50 uppercase">
                Não há leads correspondentes à seleção estruturada.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto overflow-x-auto select-none custom-scrollbar">
                <table className="w-full text-left text-[11px] bg-transparent">
                  <thead className="bg-zinc-950 sticky top-0 font-mono z-10 text-[9px] uppercase text-zinc-500 border-b border-zinc-800/60">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Sel</th>
                      <th className="p-2.5 border-l border-zinc-800/40">Nome Completo</th>
                      <th className="p-2.5 border-l border-zinc-800/40 text-center">Renda</th>
                      <th className="p-2.5 border-l border-zinc-800/40 text-center">Status Transmissão</th>
                      <th className="p-2.5 border-l border-zinc-800/40 text-right pr-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {targetLeadsList.map((lead, idx) => {
                      const queueItem = queue.find((q) => q.lead.id === lead.id);
                      const qIdx = queue.findIndex((q) => q.lead.id === lead.id);

                      let statusGfx = null;
                      if (queueItem) {
                        if (queueItem.status === "idle")
                          statusGfx = <span className="text-zinc-500 font-mono text-[9px] uppercase font-bold">Fila</span>;
                        if (queueItem.status === "sending")
                          statusGfx = <span className="text-indigo-400 font-mono font-black animate-pulse text-[9px] uppercase">Processando</span>;
                        if (queueItem.status === "waiting")
                          statusGfx = <span className="text-amber-500 font-mono text-[9px] uppercase">Espera({countdown}s)</span>;
                        if (queueItem.status === "done")
                          statusGfx = <span className="text-emerald-500 font-mono text-[9px] uppercase font-bold">✓ Sucesso</span>;
                        if (queueItem.status === "failed")
                          statusGfx = <span className="text-rose-500 font-mono text-[9px] uppercase font-bold">Falhou</span>;
                      }

                      return (
                        <tr
                          key={`${lead.id}-${idx}`}
                          className={`transition-colors text-[10px] ${qIdx === currentQueueIndex && qIdx !== -1 ? "bg-indigo-950/20 border-l-2 border-l-indigo-600" : "bg-transparent hover:bg-zinc-900/30"}`}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!leadCheckboxSelection[lead.id] || !!queueItem}
                              onChange={(e) => {
                                if (isQueueRunning) return;
                                setLeadCheckboxSelection((prev) => ({
                                  ...prev,
                                  [lead.id]: e.target.checked,
                                }));
                              }}
                              disabled={isQueueRunning || !!queueItem}
                              className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer disabled:opacity-40"
                            />
                          </td>
                          <td className="p-2.5 border-l border-zinc-800/40">
                            <div className="font-extrabold uppercase text-zinc-100 truncate max-w-[130px]">{lead.name}</div>
                            <div className="text-[8px] font-mono uppercase text-zinc-500 truncate mt-0.5">
                              {lead.phone} • {lead.stage.replace("_", " ")}
                            </div>
                          </td>
                          <td className="p-2.5 border-l border-zinc-800/40 text-center font-mono font-black text-emerald-500">
                            {lead.familyIncome ? `R$ ${lead.familyIncome.toLocaleString("pt-BR")}` : "N/D"}
                          </td>
                          <td className="p-2.5 border-l border-zinc-800/40 text-center font-mono">
                            {statusGfx || <span className="text-[9px] uppercase text-zinc-650">— Fila Vazia —</span>}
                          </td>
                          <td className="p-2.5 pr-4 border-l border-zinc-800/40 text-right">
                            {queueItem && queueItem.status === "sending" && dispatchMode === "manual" ? (
                              <button
                                onClick={handleAssistedDispatch}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase rounded shadow-sm inline-flex items-center justify-center cursor-pointer"
                              >
                                DISPARAR
                              </button>
                            ) : queueItem && queueItem.status === "done" ? (
                              <span className="text-emerald-500 font-mono text-[9px] font-bold">✓ OK</span>
                            ) : (
                              <span className="text-zinc-650 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "massa" && (
        <div id="email-dispatch-tab-pane" className="space-y-8 animate-fadeIn">
          {/* Section: TABELA DE DISPAROS E ENVIOS */}
          <div className="bg-transparent space-y-4">
            <div className={cardBackground}>
              <div className="flex flex-col gap-3 p-5 pb-2">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-indigo-500" />
                      <span>Tabela: Disparos e Envios Avançados</span>
                    </h2>
                  </div>

                  {/* Status Indicator */}
                  {isQueueRunning && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/50 border-2 border-emerald-500 text-emerald-400 font-mono font-black text-xs uppercase rounded-xl animate-pulse">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>
                        Estágio Ativo • {countdown}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtitle Search Bar / Integrated CRM Filters */}
                {tableHeaderComponent && typeof tableHeaderComponent === 'function' && (
                  <div className="w-full pt-1">
                    {tableHeaderComponent(
                      Object.keys(leadCheckboxSelection).filter((k) => leadCheckboxSelection[k]),
                      {
                        openCampaignModal: () => {
                          const checkedIds = Object.keys(leadCheckboxSelection).filter((k) => leadCheckboxSelection[k]);
                          if (checkedIds.length > 0) {
                            setQueue(targetLeadsList.filter((l) => checkedIds.includes(l.id)).map((l) => ({ lead: l, status: 'idle' })));
                            if (addNotification) {
                              addNotification(
                                "Configuração de Disparos",
                                `${checkedIds.length} Leads carregados para transmission cron-temporizada.`,
                                "success"
                              );
                            }
                          } else {
                            if (addNotification) {
                              addNotification("Lote Vazio", "Selecione um ou mais Leads antes de iniciar.", "warning");
                            }
                          }
                        }
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Tabela de Topo (Configuração em 3 Colunas) */}
              <div className="px-5 pb-5 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* COLUNA 1: Gerar Filas e Blocos */}
                <div className="space-y-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative">
                   <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-500 uppercase px-2 py-1 rounded font-black font-mono">1º Passo</div>
                   <label className="text-[11px] font-mono font-black uppercase text-indigo-400 flex items-center gap-1 mb-3">
                      <ListOrdered className="w-3.5 h-3.5" />
                      Gerar Filas e Blocos
                   </label>
                   
                   <div className="flex justify-between items-center text-xs text-zinc-300 font-bold mb-1">
                      <span>Leads por Bloco:</span>
                      <input 
                         type="number" 
                         min="1" 
                         value={leadsPerBlock} 
                         onChange={e => setLeadsPerBlock(Number(e.target.value) || 1)} 
                         disabled={isQueueRunning}
                         className="w-16 bg-zinc-950 border border-zinc-700 rounded p-1 text-center font-mono focus:border-indigo-500 outline-none"
                      />
                   </div>
                   <p className="text-[10px] text-zinc-500 leading-snug mb-3">
                      Ex: Se possui 20 leads selecionados e 5 por bloco, 4 blocos serão gerados.
                   </p>
                   
                   <div className="flex gap-2 pt-2 border-t border-zinc-800/60">
                      <button 
                         onClick={() => {
                            const checkedIds = Object.keys(leadCheckboxSelection).filter(k => leadCheckboxSelection[k]);
                            if (checkedIds.length === 0) {
                               alert("Selecione os leads na tabela abaixo primeiro.");
                               return;
                            }
                            const leadsToQueue = targetLeadsList.filter(l => checkedIds.includes(l.id));
                            setQueue(leadsToQueue.map(l => ({ lead: l, status: 'idle' })));
                            triggerSensoryFeedback("success", accSettings);
                         }}
                         disabled={isQueueRunning}
                         className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[10px] uppercase font-black rounded border border-zinc-700 disabled:opacity-50"
                      >
                         Criar Fila ({Object.keys(leadCheckboxSelection).filter(k => leadCheckboxSelection[k]).length})
                      </button>
                      <button className="py-1.5 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded flex items-center justify-center">
                         <History className="w-3 h-3" />
                      </button>
                   </div>
                </div>

                {/* COLUNA 2: Scripts & Temporizadores */}
                <div className="space-y-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative">
                   <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-500 uppercase px-2 py-1 rounded font-black font-mono">2º Passo</div>
                   <label className="text-[11px] font-mono font-black uppercase text-indigo-400 flex items-center gap-1 mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      Scripts e Cronômetros
                   </label>
                   
                   <select
                      value={selectedQueueTemplateId}
                      onChange={(e) => setSelectedQueueTemplateId(e.target.value)}
                      disabled={isQueueRunning}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-white outline-none mb-3"
                    >
                      <option value="">Selecione o Roteiro...</option>
                      <option value="gemini_auto">🤖 Personalizado Inteligente (IA)</option>
                      {templates.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                      ))}
                   </select>

                   <div className="grid grid-cols-2 gap-2 text-xs font-bold text-zinc-300">
                      <div>
                         <span className="block text-[9px] text-zinc-500 font-mono mb-1 uppercase">Pausa / Leads (s)</span>
                         <input 
                            type="number" min="0" value={timerBetweenLeads} 
                            onChange={e => setTimerBetweenLeads(Number(e.target.value))}
                            disabled={isQueueRunning}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-center font-mono"
                         />
                      </div>
                      <div>
                         <span className="block text-[9px] text-zinc-500 font-mono mb-1 uppercase">Pausa / Blocos (s)</span>
                         <input 
                            type="number" min="0" value={timerBetweenBlocks} 
                            onChange={e => setTimerBetweenBlocks(Number(e.target.value))}
                            disabled={isQueueRunning}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-center font-mono"
                         />
                      </div>
                   </div>
                </div>

                {/* COLUNA 3: Controle e Operação */}
                <div className="space-y-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative">
                   <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-500 uppercase px-2 py-1 rounded font-black font-mono">3º Passo</div>
                   <label className="text-[11px] font-mono font-black uppercase text-indigo-400 flex items-center gap-1 mb-3">
                      <Play className="w-3.5 h-3.5" />
                      Controle e Operação
                   </label>

                   <select
                      value={dispatchMode}
                      onChange={(e) => setDispatchMode(e.target.value as any)}
                      disabled={isQueueRunning}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-[10px] font-black uppercase text-white outline-none mb-3"
                    >
                      <option value="auto">Modo Automático (2º Plano)</option>
                      <option value="semi-auto">Modo Semi-Automático (Foco na Aba)</option>
                      <option value="manual">Modo Manual (Click p/ Enviar)</option>
                   </select>

                   <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={handleStartQueue}
                         disabled={queue.length === 0 || isQueueRunning}
                         className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-950 disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-900 text-white text-[10px] font-black rounded uppercase flex items-center justify-center gap-1"
                       >
                         <Play className="w-3.5 h-3.5" /> Play
                       </button>
                       <button
                         type="button"
                         onClick={stopQueueEngine}
                         disabled={!isQueueRunning}
                         className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 border border-rose-950 disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-900 text-white text-[10px] font-black rounded uppercase flex items-center justify-center gap-1"
                       >
                         <Square className="w-3.5 h-3.5" /> Parar
                       </button>
                   </div>
                </div>

              </div>

              <div className="flex flex-col max-h-[500px]">
                <div className="flex justify-between items-center p-3 bg-zinc-950/80 border-b border-zinc-800/80">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const allSelected = targetLeadsList.every(
                          (l) => leadCheckboxSelection[l.id],
                        );
                        const newSelection: Record<string, boolean> = {};
                        if (!allSelected) {
                          targetLeadsList.forEach(
                            (l) => (newSelection[l.id] = true),
                          );
                        }
                        setLeadCheckboxSelection(newSelection);
                      }}
                      className="text-[10px] font-mono font-black uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Todos Pág.
                    </button>
                    <button
                      onClick={() => {
                          setLeadCheckboxSelection({});
                          handleClearQueue();
                      }}
                      className="text-[10px] font-mono font-black uppercase text-zinc-500 hover:text-rose-500 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Limpar Tudo
                    </button>
                  </div>
                  {queue.length > 0 && (
                     <span className="text-[10px] font-mono font-black uppercase text-emerald-500 px-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg">Fila Ativa: {queue.length}</span>
                  )}
                </div>

                {targetLeadsList.length === 0 ? (
                  <div className="bg-zinc-950/60 p-12 text-center text-xs font-mono font-bold text-zinc-500 uppercase">
                    Nenhum registro encontrado na base atual de filtros.
                  </div>
                ) : (
                  <div className="h-[280px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs bg-transparent">
                      <thead className="bg-zinc-950 sticky top-0 font-mono z-10 text-[10px] uppercase text-zinc-500 border-b border-zinc-800 shadow-sm">
                        <tr>
                          <th className="p-3 pl-5 w-12 text-center">
                            Select
                          </th>
                          <th className="p-3 border-l border-zinc-800/40">
                            Nome Prospecto / Perfil
                          </th>
                          <th className="p-3 border-l border-zinc-800/40">
                            Status da Transmissão
                          </th>
                          <th className="p-3 border-l border-zinc-800/40 pr-5 text-center w-40">
                            Ação Assistida
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {targetLeadsList.map((lead, idx) => {
                          const queueItem = queue.find(q => q.lead.id === lead.id);
                          const qIdx = queue.findIndex(q => q.lead.id === lead.id);
                          
                          let statusGfx = null;
                          if (queueItem) {
                            if (queueItem.status === "idle")
                              statusGfx = (
                                <span className="text-zinc-500 font-mono flex items-center gap-1 uppercase text-[10px] font-bold">
                                  <Clock className="w-3 h-3" /> na fila
                                </span>
                              );
                            if (queueItem.status === "sending")
                              statusGfx = (
                                <span className="text-indigo-400 font-mono animate-pulse uppercase text-[10px] font-black flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span> processando...
                                </span>
                              );
                            if (queueItem.status === "waiting")
                              statusGfx = (
                                <span className="text-amber-400 font-mono animate-pulse font-black uppercase text-[10px] flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Em contagem({countdown}s)
                                </span>
                              );
                            if (queueItem.status === "done")
                              statusGfx = (
                                <span className="text-emerald-500 font-mono flex items-center gap-1 uppercase text-[10px] font-bold">
                                  <CheckCircle2 className="w-4 h-4" /> finalizado
                                </span>
                              );
                            if (queueItem.status === "failed")
                              statusGfx = (
                                <span className="text-rose-500 font-mono flex items-center gap-1 uppercase text-[10px] font-bold">
                                  <AlertTriangle className="w-4 h-4" /> falha
                                </span>
                              );
                          }

                          return (
                            <tr
                              key={`${lead.id}-${idx}`}
                              className={`transition-colors ${qIdx === currentQueueIndex && qIdx !== -1 ? "bg-indigo-950/20 border-l-4 border-l-indigo-600" : "bg-transparent hover:bg-zinc-900/30"}`}
                            >
                              <td className="p-3 pl-5 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!leadCheckboxSelection[lead.id] || !!queueItem}
                                  onChange={(e) => {
                                    if (isQueueRunning) return;
                                    setLeadCheckboxSelection((prev) => ({
                                      ...prev,
                                      [lead.id]: e.target.checked,
                                    }));
                                  }}
                                  disabled={isQueueRunning || !!queueItem}
                                  className="w-4 h-4 accent-indigo-600 cursor-pointer disabled:opacity-50"
                                />
                              </td>
                              <td className="p-3 border-l border-zinc-800/40">
                                <div className="font-black uppercase truncate max-w-[200px] text-zinc-100">
                                  {lead.name}
                                </div>
                                <div className="text-[9px] font-mono uppercase text-zinc-500 mt-1 flex items-center gap-1">
                                   <span className="bg-zinc-950 border border-zinc-800/50 px-1 py-0.5 rounded">{lead.status.replace("_", " ")}</span>
                                   <span className="bg-zinc-950 border border-zinc-800/50 px-1 py-0.5 rounded">{lead.stage.replace("_", " ")}</span>
                                </div>
                              </td>
                              <td className="p-3 border-l border-zinc-800/40">
                                {statusGfx || <span className="text-zinc-600 font-mono text-[9px] uppercase font-bold">— pendente —</span>}
                              </td>
                              <td className="p-3 pr-5 text-center border-l border-zinc-800/40">
                                {queueItem && queueItem.status === "sending" && dispatchMode === "manual" ? (
                                  <button
                                    onClick={handleAssistedDispatch}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg text-[10px] font-black uppercase inline-flex items-center justify-center gap-1 w-full"
                                  >
                                    DISPARAR!
                                  </button>
                                ) : queueItem && queueItem.status === "done" ? (
                                  <div className="flex items-center justify-center text-emerald-500 border border-emerald-900 bg-emerald-950/30 rounded px-2 py-1">
                                    <Check className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="text-zinc-700 text-[10px]">—</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      )}

      {/* RENDER HISTORY LOGS TAB */}
      {activeTab === "logs" && (
        <div id="email-logs-tab-pane" className="space-y-4 animate-fadeIn">
          <div
            className={
              cardBackground + " p-5 flex items-center justify-between"
            }
          >
            <div>
              <h2 className="text-md font-black uppercase tracking-tight">
                Registro de Transmissões
              </h2>
              <p className="text-xs subtitleTextColor font-medium font-sans">
                Histórico e auditoria de scripts de abordagens disparadas em
                tempo real.
              </p>
            </div>
            <div className="text-xs bg-zinc-950 text-white border border-zinc-850 px-3 py-2 rounded-xl flex items-center gap-1.5 font-mono font-black">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Canais de Transmissão Ativos</span>
            </div>
          </div>

          {(() => {
            const term = (globalSearchTerm || "").trim().toLowerCase();
            const filteredLogs = logs.filter((log) => {
              if (!term) return true;
              return (
                (log.leadName || "").toLowerCase().includes(term) ||
                (log.templateName || "").toLowerCase().includes(term) ||
                (log.subject || "").toLowerCase().includes(term) ||
                (log.body || "").toLowerCase().includes(term) ||
                (log.status || "").toLowerCase().includes(term)
              );
            });

            return (
              <div className="space-y-4">
                {/* Select All, Delete and Export Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/25 p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback("click", accSettings);
                        if (filteredLogs.length === 0) return;
                        const allSelected = filteredLogs.every((l) => selectedLogIds.includes(l.id));
                        if (allSelected) {
                          setSelectedLogIds((prev) => prev.filter((id) => !filteredLogs.some((fl) => fl.id === id)));
                        } else {
                          setSelectedLogIds((prev) => {
                            const newIds = [...prev];
                            filteredLogs.forEach((fl) => {
                              if (!newIds.includes(fl.id)) newIds.push(fl.id);
                            });
                            return newIds;
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:translate-y-0.5 text-white text-[10px] font-black uppercase rounded-lg border border-zinc-700 transition cursor-pointer"
                    >
                      {filteredLogs.length > 0 && filteredLogs.every((l) => selectedLogIds.includes(l.id))
                        ? "🚫 Desmarcar Filtrados"
                        : "☑ Selecionar Todos"}
                    </button>
                    {selectedLogIds.length > 0 && (
                      <span className="text-zinc-400 font-mono text-[10px] uppercase font-black px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                        {selectedLogIds.length} selecionados
                      </span>
                    )}
                  </div>

                  {selectedLogIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerSensoryFeedback("click", accSettings);
                          const targetLogs = logs.filter((l) => selectedLogIds.includes(l.id));
                          if (targetLogs.length === 0) return;
                          
                          const headers = ["ID", "Lead Name", "Template Name", "Subject", "Sent At", "Status"];
                          const rows = targetLogs.map((l) => [
                            l.id,
                            l.leadName,
                            l.templateName,
                            l.subject,
                            l.sentAt,
                            l.status,
                          ]);
                          
                          const csvContent =
                            "data:text/csv;charset=utf-8,\uFEFF" +
                            [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
                          
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `registro_transmissoes_${Date.now()}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          addNotification?.(
                            "Exportação Concluída",
                            `${targetLogs.length} transmissões foram exportadas com sucesso para arquivo CSV.`,
                            "success"
                          );
                        }}
                        className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 active:translate-y-0.5 text-white text-[10px] font-black uppercase rounded-lg border border-indigo-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        📥 Exportar CSV
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerSensoryFeedback("click", accSettings);
                          if (
                            window.confirm(
                              `Atenção: Tem certeza de que deseja apagar permanentemente os ${selectedLogIds.length} registros selecionados de logs de transmissões no CRM? Esta ação é irreversível.`
                            )
                          ) {
                            if (setEmailLogs) {
                              setEmailLogs((prev) => prev.filter((l) => !selectedLogIds.includes(l.id)));
                              setSelectedLogIds([]);
                              addNotification?.(
                                "Registros Deletados",
                                `Os ${selectedLogIds.length} logs selecionados foram excluídos da base com sucesso.`,
                                "warning"
                              );
                            } else {
                              alert("Aviso: Função de alteração de logs não conectada no controlador.");
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-400 text-[10px] font-black uppercase rounded-lg border border-rose-800/40 transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        🗑 Excluir Selecionados
                      </button>
                    </div>
                  )}
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="p-16 text-center bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-zinc-500 font-mono font-bold uppercase">
                    {term
                      ? `Nenhum disparo correspondente à pesquisa "${term}".`
                      : "Nenhum disparo de roteiro ou script registrado."}
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={
                        cardBackground +
                        " flex md:items-center justify-between gap-4 py-4 px-5 relative group"
                      }
                      id={`email-log-${log.id}`}
                    >
                      <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedLogIds.includes(log.id)}
                          onChange={(e) => {
                            triggerSensoryFeedback("click", accSettings);
                            if (e.target.checked) {
                              setSelectedLogIds((prev) => [...prev, log.id]);
                            } else {
                              setSelectedLogIds((prev) => prev.filter((id) => id !== log.id));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 bg-zinc-950 border-zinc-750 rounded focus:ring-indigo-500 cursor-pointer mt-1 md:mt-0"
                        />
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-tight">
                              {log.leadName}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[9px] uppercase tracking-wide font-black border border-zinc-800 bg-amber-950/40 text-amber-500 px-2 py-0.5 rounded font-mono">
                              {log.templateName}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {log.sentAt}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300 font-bold flex items-center gap-1.5 truncate">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{log.subject}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <span className="text-[10px] bg-emerald-950/40 text-emerald-400 font-black tracking-widest border border-emerald-900/40 px-3 py-1 rounded-full uppercase font-mono text-[9px]">
                          ✓ ENVIADO {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
