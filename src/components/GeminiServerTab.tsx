import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Settings, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  HelpCircle, 
  Clock, 
  UserPlus, 
  MessageSquare,
  Flame,
  Zap,
  Info,
  Search,
  Trash2
} from 'lucide-react';
import { triggerSensoryFeedback, AccessibilitySettings } from '../utils/sensory';

interface AIConfig {
  active: boolean;
  model_name: string;
  system_instruction: string;
  temperature: number;
  whatsapp_enabled: boolean;
  leads_auto_creation_enabled: boolean;
  autoresponder_url?: string;
  response_mode?: 'ai' | 'hybrid' | 'manual';
  company_name?: string;
  system_name?: string;
  answer_length?: 'short' | 'medium' | 'long';
}

interface WebhookLog {
  id: string;
  timestamp: string;
  phone: string;
  sender: string;
  message: string;
  reply: string;
  status: 'sucesso' | 'erro' | 'manual_intercepted';
  model_used: string;
  latency_ms: number;
  error_message?: string;
}

interface GeminiServerTabProps {
  accSettings?: AccessibilitySettings;
  awardXP?: (amount: number, reason: string) => void;
  addNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai') => void;
  leads?: any[];
  setLeads?: React.Dispatch<React.SetStateAction<any[]>>;
  templates?: any[];
}

export default function GeminiServerTab({ 
  accSettings,
  awardXP,
  addNotification,
  leads = [],
  setLeads,
  templates = []
}: GeminiServerTabProps) {
  // Config state
  const [config, setConfig] = useState<AIConfig>({
    active: true,
    model_name: 'gemini-3.5-flash',
    system_instruction: '',
    temperature: 0.7,
    whatsapp_enabled: true,
    leads_auto_creation_enabled: true,
    autoresponder_url: '',
    response_mode: 'hybrid',
    company_name: 'cicloCRED',
    system_name: 'CRM',
    answer_length: 'short',
  });

  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Playground state
  const [testMessage, setTestMessage] = useState('Oi! Gostaria de entender como funciona a simulação habitacional conosco.');
  const [testReply, setTestReply] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ latency_ms?: number; timestamp?: string } | null>(null);

  // Advanced Webhook Simulation States based on Whatauto specifications
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'flow' | 'json' | 'debugger'>('flow');
  const [mockSender, setMockSender] = useState('Otavio Alexandre');
  const [mockPhone, setMockPhone] = useState('+55 11 98888-7777');
  const [mockIsGroup, setMockIsGroup] = useState(false);
  const [mockGroupParticipant, setMockGroupParticipant] = useState('');
  const [ruleId, setRuleId] = useState(42);
  const [isTestMessage, setIsTestMessage] = useState(false);

  // New Direct Server-to-Autoresponder Webhook States
  const [autoresponderUrl, setAutoresponderUrl] = useState('');
  const [webhookDebugLogsList, setWebhookDebugLogsList] = useState<any[]>([]);
  const [isLoadingDebugLogs, setIsLoadingDebugLogs] = useState(false);
  const [isTestingDirect, setIsTestingDirect] = useState(false);
  const [testDirectResult, setTestDirectResult] = useState<any>(null);

  // Live Chat and WhatsApp Conversation states
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<'chatbot' | 'whatsapp_conversations' | 'playground'>('chatbot');
  const [selectedChatPhone, setSelectedChatPhone] = useState<string>('');
  const [customReplyText, setCustomReplyText] = useState<string>('');
  const [isSendingCustom, setIsSendingCustom] = useState<boolean>(false);

  // Interactive Chatbot State
  const [chatBotMessages, setChatBotMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: 'Olá! Sou o seu Assistente AI cicloCRED calibrado. Como posso te auxiliar nos testes de simulações, captações ou triagem operúrgica de crédito?',
      timestamp: new Date().toLocaleTimeString('pt-BR')
    }
  ]);
  const [typedChatBotMessage, setTypedChatBotMessage] = useState('');
  const [isBotResponding, setIsBotResponding] = useState(false);

  const handleSendChatBotMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    if (triggerSensoryFeedback && accSettings) {
      triggerSensoryFeedback('click', accSettings);
    }
    setTypedChatBotMessage('');
    
    // Add User Message
    const userMsg = { sender: 'user' as const, text: trimmed, timestamp: new Date().toLocaleTimeString('pt-BR') };
    setChatBotMessages(prev => [...prev, userMsg]);
    setIsBotResponding(true);

    // Auto scroll
    setTimeout(() => {
      const el = document.getElementById('chatbot-chat-viewport');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);

    try {
      const res = await fetch('/api/server/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          custom_prompt: config.system_instruction,
          model_name: config.model_name,
          temperature: config.temperature
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatBotMessages(prev => [...prev, {
          sender: 'ai' as const,
          text: data.reply || 'Desculpe, não consegui obter uma resposta válida do motor Gemini.',
          timestamp: new Date().toLocaleTimeString('pt-BR')
        }]);
        if (awardXP) {
          awardXP(15, 'Interagiu com o Chatbot do Assistente AI!');
        }
        if (addNotification) {
          addNotification('Assistente AI Respondeu', 'Feedback de inteligência cognitiva processado pelo servidor com sucesso.', 'ai');
        }
        if (triggerSensoryFeedback && accSettings) {
          triggerSensoryFeedback('complete', accSettings);
        }
      } else {
        const errData = await res.json();
        setChatBotMessages(prev => [...prev, {
          sender: 'ai' as const,
          text: `⚠️ Erro no servidor: ${errData.error || 'Não foi possível completar a chamada.'}`,
          timestamp: new Date().toLocaleTimeString('pt-BR')
        }]);
        if (triggerSensoryFeedback && accSettings) {
          triggerSensoryFeedback('warning', accSettings);
        }
      }
    } catch (e: any) {
      setChatBotMessages(prev => [...prev, {
        sender: 'ai' as const,
        text: `⚠️ Erro de rede: ${e.message}`,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      }]);
      if (triggerSensoryFeedback && accSettings) {
        triggerSensoryFeedback('warning', accSettings);
      }
    } finally {
      setIsBotResponding(false);
      setTimeout(() => {
        const el = document.getElementById('chatbot-chat-viewport');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  };

  const selectedLead = React.useMemo(() => {
    if (!selectedChatPhone) return null;
    const cleanSelPhone = selectedChatPhone.replace(/\D/g, "");
    return leads.find((l: any) => {
      const leadPhone = l.phone ? String(l.phone).replace(/\D/g, "") : "";
      return leadPhone === cleanSelPhone || 
             (leadPhone.length >= 8 && cleanSelPhone.endsWith(leadPhone)) || 
             (cleanSelPhone.length >= 8 && leadPhone.endsWith(cleanSelPhone));
    });
  }, [leads, selectedChatPhone]);

  const handleToggleLeadMute = async () => {
    if (!selectedLead || !setLeads) return;
    triggerSensoryFeedback('click', accSettings);
    const newMuteStatus = !selectedLead.ai_muted;
    
    // Optimistic frontend update
    setLeads(prevLeads => prevLeads.map((l: any) => {
      if (l.id === selectedLead.id) {
        return { ...l, ai_muted: newMuteStatus };
      }
      return l;
    }));

    try {
      await fetch(`/api/server/leads/${selectedLead.id}/toggle-ai-mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_muted: newMuteStatus })
      });
      if (addNotification) {
        addNotification(
          newMuteStatus ? 'Assistente Silenciado' : 'Assistente Ativo',
          `Auto-respostas da IA silenciadas para o lead ${selectedLead.name}.`,
          'info'
        );
      }
    } catch (err) {
      console.error("Erro ao sincronizar silenciador de contato:", err);
    }
  };

  // Logs state
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  const handleDeleteLog = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir chat ao clicar no botão de excluir
    
    // Confirmação para evitar exclusões acidentais
    if (!window.confirm("Atenção: Tem certeza de que deseja excluir permanentemente este registro de log do servidor?")) {
      return;
    }

    triggerSensoryFeedback('click', accSettings);
    try {
      const res = await fetch(`/api/server/logs/${logId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (addNotification) {
          addNotification("Registro Deletado", "O log de processamento foi removido permanentemente com sucesso.", "info");
        }
        // Recarregar os logs imediatamente
        fetchConfigAndLogs();
      } else {
        const err = await res.json();
        alert("Erro ao excluir log: " + (err.error || "Erro desconhecido"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao se conectar com o servidor para deletar.");
    }
  };

  // Clipboard support
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Computed metrics
  const totalCalls = logs.length;
  const successCalls = logs.filter(l => l.status === 'sucesso').length;
  const errorCalls = logs.filter(l => l.status === 'erro').length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100;
  const avgLatency = totalCalls > 0 
    ? Math.round(logs.reduce((acc, curr) => acc + (curr.latency_ms || 0), 0) / totalCalls) 
    : 0;

  // Determine App Hostname for dynamic Webhook URL demonstration
  const appOrigin = window.location.origin;
  const webhookUrl = `${appOrigin}/api/whatauto`;

  // Fetch Server Config on Mount
  useEffect(() => {
    fetchConfigAndLogs();
    setAutoresponderUrl(`${window.location.origin}/api/mock-autoresponder-receiver`);
  }, []);

  // Sync / Auto-Fetch real-time raw webhook logs when tab opens
  useEffect(() => {
    if (activeRightPanelTab === 'playground' && activePlaygroundTab === 'debugger') {
      fetchWebhookDebugLogs();
    }
  }, [activeRightPanelTab, activePlaygroundTab]);

  const fetchConfigAndLogs = async () => {
    setIsLoadingConfig(true);
    setIsLoadingLogs(true);
    try {
      // Fetch dynamic config from backend
      const configRes = await fetch('/api/server/config');
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
        if (data.autoresponder_url) {
          setAutoresponderUrl(data.autoresponder_url);
        }
      }

      // Fetch webhook processing logs
      const logsRes = await fetch('/api/server/logs');
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
        if (data && data.length > 0) {
          // Find the first log with a phone, handle safely
          const firstWithPhone = data.find((l: any) => l.phone);
          if (firstWithPhone) {
            setSelectedChatPhone((prev) => prev || firstWithPhone.phone);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao conectar com a API do Servidor', e);
      if (addNotification) {
        addNotification('Conexão Offline', 'Mostrar cache local de IA. Verifique as credenciais no terminal caso erro persista.', 'warning');
      }
    } finally {
      setIsLoadingConfig(false);
      setIsLoadingLogs(false);
    }
  };

  const handleSaveConfig = async () => {
    triggerSensoryFeedback('click', accSettings);
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/server/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, autoresponder_url: autoresponderUrl })
      });
      if (res.ok) {
        triggerSensoryFeedback('success', accSettings);
        if (addNotification) {
          addNotification('Configuração Salva', 'Servidor de Inteligência Artificial atualizado com sucesso!', 'success');
        }
        if (awardXP) {
          awardXP(15, 'Configurou o assistente neural no Servidor!');
        }
      } else {
        throw new Error('Falha ao atualizar parâmetros.');
      }
    } catch (err: any) {
      triggerSensoryFeedback('warning', accSettings);
      if (addNotification) {
        addNotification('Erro ao Salvar', err?.message || 'Verifique conexão com banco Firestore.', 'alarm');
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) return;
    triggerSensoryFeedback('click', accSettings);
    setIsTesting(true);
    setTestReply('');
    setTestResult(null);
    try {
      const res = await fetch('/api/server/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          custom_prompt: config.system_instruction,
          model_name: config.model_name,
          temperature: config.temperature
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestReply(data.reply);
        setTestResult({
          latency_ms: data.latency_ms,
          timestamp: data.timestamp
        });
        triggerSensoryFeedback('success', accSettings);
        if (awardXP) {
          awardXP(5, 'Executou simulação em tempo real com Gemini IA');
        }
      } else {
        const errorData = await res.json();
        setTestReply(`[ERRO DO SERVIDOR]: ${errorData.error || 'Erro desconhecido na resposta.'}`);
        triggerSensoryFeedback('warning', accSettings);
      }
    } catch (e: any) {
      setTestReply(`[ERRO DA REQUISIÇÃO]: Não foi possível conectar ao servidor. Verifique se o servidor está rodando na porta correta.\nDetalhe: ${e.message}`);
      triggerSensoryFeedback('warning', accSettings);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!testMessage.trim()) return;
    triggerSensoryFeedback('click', accSettings);
    setIsTesting(true);
    setTestReply('');
    setTestResult(null);
    try {
      // Simulate real POST to the actual webhook endpoint with the JSON structure requested
      const payload = {
        appPackageName: "tkstudio.autorespondermsg",
        messengerPackageName: "com.whatsapp",
        query: {
          sender: mockSender,
          message: testMessage,
          isGroup: mockIsGroup,
          groupParticipant: mockIsGroup ? mockGroupParticipant : "",
          ruleId: ruleId,
          isTestMessage: isTestMessage,
          phone: mockPhone
        }
      };

      const res = await fetch('/api/whatauto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        // The backend returns { reply: string, replies: [{message: string}] }
        if (data.replies && data.replies.length > 0) {
          setTestReply(data.replies[0].message);
        } else {
          setTestReply(data.reply || '');
        }
        
        setTestResult({
          latency_ms: 250 + Math.floor(Math.random() * 400),
          timestamp: new Date().toISOString()
        });

        triggerSensoryFeedback('success', accSettings);
        
        if (addNotification) {
          addNotification('Simulação do Webhook', 'Receptor processado com sucesso. Novo lead/interação inseridos!', 'success');
        }

        if (awardXP) {
          awardXP(12, 'Simulou fluxo com o payload oficial de Webhook!');
        }

        // Reload logs slightly later
        setTimeout(async () => {
          const logsRes = await fetch('/api/server/logs');
          if (logsRes.ok) {
            const dataLogs = await logsRes.json();
            setLogs(dataLogs);
          }
        }, 800);

      } else {
        const errText = await res.text();
        setTestReply(`[ERRO DO WEBHOOK]: ${errText}`);
        triggerSensoryFeedback('warning', accSettings);
      }
    } catch (e: any) {
      setTestReply(`[ERRO DE REDE]: Não foi possível chamar o webhook: ${e.message}`);
      triggerSensoryFeedback('warning', accSettings);
    } finally {
      setIsTesting(false);
    }
  };

  const fetchWebhookDebugLogs = async () => {
    setIsLoadingDebugLogs(true);
    try {
      const res = await fetch('/api/server/webhook-debug-logs');
      if (res.ok) {
        const data = await res.json();
        setWebhookDebugLogsList(data);
      }
    } catch (e) {
      console.error("Erro ao carregar raw logs de webhook:", e);
    } finally {
      setIsLoadingDebugLogs(false);
    }
  };

  const handleSimulateDirectTest = async () => {
    if (!testMessage.trim()) return;
    triggerSensoryFeedback('click', accSettings);
    setIsTestingDirect(true);
    setTestDirectResult(null);

    try {
      const payload = {
        sender: mockSender,
        phone: mockPhone,
        message: testMessage,
        targetUrl: autoresponderUrl || `${window.location.origin}/api/mock-autoresponder-receiver`,
        isGroup: mockIsGroup,
        groupParticipant: mockIsGroup ? mockGroupParticipant : "",
        ruleId: ruleId,
        isTestMessage: isTestMessage
      };

      const res = await fetch('/api/server/test-webhook-to-autoresponder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setTestDirectResult(data);

      if (res.ok && data.success) {
        setTestReply(data.reply || '');
        setTestResult({
          latency_ms: data.latency_ms || 350,
          timestamp: new Date().toISOString()
        });

        triggerSensoryFeedback('success', accSettings);
        if (addNotification) {
          addNotification('Teste Webhook Direto', 'Simulação transmitida de ponta a ponta com sucesso!', 'success');
        }
        if (awardXP) {
          awardXP(15, 'Usou simulação direta com disparo ao autoresponder!');
        }
      } else {
        triggerSensoryFeedback('warning', accSettings);
        const errDetail = data.error || data.validation_errors?.join(', ') || 'Falha na validação de campos obrigatórios.';
        if (addNotification) {
          addNotification('Falha de Validação', `Rejeitado pelo servidor: ${errDetail}`, 'warning');
        }
      }

      // Reload real-time logs list
      fetchWebhookDebugLogs();
      
      // Reload standard audits logs
      setTimeout(async () => {
        const logsRes = await fetch('/api/server/logs');
        if (logsRes.ok) {
          const dataLogs = await logsRes.json();
          setLogs(dataLogs);
        }
      }, 800);

    } catch (e: any) {
      triggerSensoryFeedback('warning', accSettings);
      setTestDirectResult({ error: `Falha de Rede: ${e.message}` });
    } finally {
      setIsTestingDirect(false);
    }
  };

  const handleSendCustomMessage = async (msgText: string, type: 'human' | 'ai') => {
    if (!msgText.trim() || !selectedChatPhone) return;
    triggerSensoryFeedback('click', accSettings);
    setIsSendingCustom(true);
    try {
      // Find the name of the sender from current logs
      const chatLog = logs.find(l => l.phone === selectedChatPhone);
      const chatName = chatLog ? chatLog.sender : 'Cliente WhatsApp';

      const res = await fetch('/api/server/send-custom-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedChatPhone,
          sender: chatName,
          message: msgText,
          responseType: type
        })
      });

      if (res.ok) {
        setCustomReplyText('');
        triggerSensoryFeedback('success', accSettings);
        if (addNotification) {
          addNotification('Mensagem Gravada', `Mensagem comercial enviada à fila de saída para ${chatName}! Sincronizado no CRM.`, 'success');
        }
        if (awardXP) {
          awardXP(10, `Interação direta via webhook WhatsApp ativo com ${chatName}!`);
        }
        // Force log reload
        const logsRes = await fetch('/api/server/logs');
        if (logsRes.ok) {
          const dataLogs = await logsRes.json();
          setLogs(dataLogs);
        }
      } else {
        const errorData = await res.json();
        if (addNotification) {
          addNotification('Erro de Envio', errorData.error || 'Falha ao registrar mensagem.', 'alarm');
        }
      }
    } catch (e: any) {
      console.error('Erro de envio manual', e);
    } finally {
      setIsSendingCustom(false);
    }
  };

  const handleAutofillAI = async () => {
    if (!selectedChatPhone) return;
    // Find the last incoming message from the customer
    const customerLogs = logs.filter(l => l.phone === selectedChatPhone && l.message);
    if (customerLogs.length === 0) return;
    const lastMsg = customerLogs[0].message; // sorted desc

    triggerSensoryFeedback('click', accSettings);
    setIsSendingCustom(true);
    try {
      if (addNotification) {
        addNotification('Inteligência Artificial', 'Analisando histórico e as regras instrucionais em processamento neural...', 'ai');
      }

      const res = await fetch('/api/server/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastMsg,
          custom_prompt: config.system_instruction,
          model_name: config.model_name,
          temperature: config.temperature
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCustomReplyText(data.reply || '');
        triggerSensoryFeedback('success', accSettings);
      }
    } catch (e: any) {
      console.error('Erro ao sugerir com IA', e);
    } finally {
      setIsSendingCustom(false);
    }
  };

  const handleApplyTemplate = (templateBody: string) => {
    triggerSensoryFeedback('click', accSettings);
    let filledText = templateBody;
    
    if (selectedLead) {
      filledText = filledText
        .replace(/\{\{nome\}\}/gi, selectedLead.name || '')
        .replace(/\{\{empresa\}\}/gi, config.company_name || 'nossa empresa')
        .replace(/\{\{origem\}\}/gi, selectedLead.origin || 'WhatsApp')
        .replace(/\{\{valor\}\}/gi, selectedLead.value ? `R$ ${selectedLead.value.toLocaleString('pt-BR')}` : 'seu financiamento');
    } else {
      filledText = filledText
        .replace(/\{\{nome\}\}/gi, 'amigo(a)')
        .replace(/\{\{empresa\}\}/gi, config.company_name || 'nossa empresa')
        .replace(/\{\{origem\}\}/gi, 'WhatsApp')
        .replace(/\{\{valor\}\}/gi, 'financiamento');
    }
    
    setCustomReplyText(filledText);
    if (addNotification) {
      addNotification("Script Carregado", "O roteiro do workspace foi formatado e colado no campo de digitação.", "success");
    }
  };

  const copyToClipboard = () => {
    triggerSensoryFeedback('click', accSettings);
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    if (addNotification) {
      addNotification('Link Copiado', 'Link do Webhook Whatauto copiado para a área de transferência!', 'success');
    }
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Memoized chats and active logs grouping for the live conversation controller
  const activeChats = React.useMemo(() => {
    const chatsMap: { [phone: string]: { name: string; lastMsg: string; timestamp: string; status: string; messagesCount: number } } = {};
    
    // Sort oldest first, so newest overwrites in the map
    const sortedOldestFirst = [...logs].reverse();
    sortedOldestFirst.forEach(log => {
      if (log.phone) {
        let msgPreview = log.reply || log.message || '';
        chatsMap[log.phone] = {
          name: log.sender || 'Cliente WhatsApp',
          lastMsg: msgPreview,
          timestamp: log.timestamp,
          status: log.status === 'erro' ? 'erro' : 'sucesso',
          messagesCount: (chatsMap[log.phone]?.messagesCount || 0) + 1
        };
      }
    });

    return Object.entries(chatsMap).map(([phone, info]) => ({
      phone,
      ...info
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  const selectedChatMessages = React.useMemo(() => {
    if (!selectedChatPhone) return [];
    
    const filtered = logs.filter(l => l.phone === selectedChatPhone);
    const messages: { sender: 'customer' | 'ai' | 'broker'; text: string; time: string; model?: string; isError?: boolean }[] = [];
    
    [...filtered].reverse().forEach(log => {
      if (log.message === '[CORRETOR DIGITOU]' || log.message === '[SOLICITAÇÃO DE RETORNO IA]') {
        messages.push({
          sender: log.message === '[CORRETOR DIGITOU]' ? 'broker' : 'ai',
          text: log.reply || '',
          time: new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          model: log.model_used
        });
      } else {
        if (log.message) {
          messages.push({
            sender: 'customer',
            text: log.message,
            time: new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          });
        }
        if (log.reply) {
          messages.push({
            sender: 'ai',
            text: log.reply,
            time: new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            model: log.model_used,
            isError: log.status === 'erro'
          });
        }
      }
    });

    return messages;
  }, [logs, selectedChatPhone]);

  return (
    <div className="space-y-8 pb-16">
      {/* Dynamic Network / Server Core Health Header */}
      <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/15 border border-indigo-400 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black uppercase text-white font-mono">Motor Inteligente de Vendas</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  SERVIDOR ONLINE
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Conecte seu WhatsApp com o Gemini 3.5 pelo webhook Whatauto e deixe o assistente capturar e responder clientes com maestria.
              </p>
            </div>
          </div>
          <button
            onClick={fetchConfigAndLogs}
            disabled={isLoadingConfig}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-zinc-950 transition active:translate-y-0.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConfig ? 'animate-spin' : ''}`} />
            Sincronizar Painel
          </button>
        </div>

        {/* Server Real-time Webhook Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 border-t-2 border-zinc-950 pt-6">
          <div className="bg-zinc-950/40 border-2 border-zinc-950 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono block">Mensagens Recebidas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{totalCalls}</span>
              <span className="text-[10px] text-zinc-500 font-semibold font-mono">requisições</span>
            </div>
          </div>
          <div className="bg-zinc-950/40 border-2 border-zinc-950 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono block">Taxa de Resposta</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">{successRate}%</span>
              <span className="text-[10px] text-zinc-500 font-semibold font-mono">sucesso</span>
            </div>
          </div>
          <div className="bg-zinc-950/40 border-2 border-zinc-950 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono block">Latência Média</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">{avgLatency}ms</span>
              <span className="text-[10px] text-zinc-500 font-semibold font-mono">tempo do gemini</span>
            </div>
          </div>
          <div className="bg-zinc-950/40 border-2 border-zinc-950 p-4 rounded-xl">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono block">Origem do Webhook</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs font-bold text-indigo-400 font-mono truncate max-w-full">Whatauto App</span>
              <span className="text-[10px] text-zinc-500 font-semibold font-mono">android</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Column Left: Server Configurations (Config e Instruções) */}
        <div className="xl:col-span-7 space-y-8">
          
          <div className="bg-zinc-900 border-4 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-4 bg-zinc-950/30 border-b-2 border-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-xs font-black uppercase text-zinc-300">Parâmetros de Produção do Assistente AI</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isLoadingConfig ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Carregando parâmetros...</span>
                </div>
              ) : (
                <>
                  {/* Active / Inactive Switchers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950/30 border-2 border-zinc-950 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-black text-white uppercase tracking-wider font-mono">IA Geral Ativa</label>
                        <p className="text-[10px] text-zinc-400 block">Ativa ou suspende o motor de respostas da inteligência artificial.</p>
                      </div>
                      <button
                        onClick={() => {
                          triggerSensoryFeedback('click', accSettings);
                          setConfig(prev => ({ ...prev, active: !prev.active }));
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          config.active ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                        } border border-zinc-950`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white transition-all shadow-md" />
                      </button>
                    </div>

                    <div className="bg-zinc-950/30 border-2 border-zinc-950 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-black text-white uppercase tracking-wider font-mono">Auto Enviar no WhatsApp</label>
                        <p className="text-[10px] text-zinc-400 block">Autoriza responder diretamente as chamadas de webhook do Whatauto.</p>
                      </div>
                      <button
                        onClick={() => {
                          triggerSensoryFeedback('click', accSettings);
                          setConfig(prev => ({ ...prev, whatsapp_enabled: !prev.whatsapp_enabled }));
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          config.whatsapp_enabled ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                        } border border-zinc-950`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white transition-all shadow-md" />
                      </button>
                    </div>

                    <div className="bg-zinc-950/30 border-2 border-zinc-950 p-4 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                      <div className="space-y-0.5">
                        <label className="text-xs font-black text-white uppercase tracking-wider font-mono">Novo Lead Automático no CRM</label>
                        <p className="text-[10px] text-zinc-400 block">
                          Se um número de WhatsApp não cadastrado mandar mensagem, a IA cria e insere ele de imediato com a tag <span className="text-indigo-400 font-mono">WhatsApp Webhook</span> no Funil de Leads.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          triggerSensoryFeedback('click', accSettings);
                          setConfig(prev => ({ ...prev, leads_auto_creation_enabled: !prev.leads_auto_creation_enabled }));
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          config.leads_auto_creation_enabled ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                        } border border-zinc-950`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white transition-all shadow-md" />
                      </button>
                    </div>
                  </div>

                    {/* Brand Customization & Neutrality Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-zinc-950 pt-6">
                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block font-mono">Identidade da Empresa (Nome da Construtora / Imobiliária)</label>
                        <input
                          type="text"
                          value={config.company_name || ''}
                          onChange={(e) => {
                            setConfig(prev => ({ ...prev, company_name: e.target.value }));
                          }}
                          placeholder="Ex: Construtora Real, Imobiliária Aliança"
                          className="w-full mt-1.5 p-3 rounded-lg bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-zinc-400 mt-1">A IA utilizará este nome para se apresentar e rejeitará herança dos termos cicloCRED.</p>
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block font-mono">Nome da Central ou Sistema de Atendimento</label>
                        <input
                          type="text"
                          value={config.system_name || ''}
                          onChange={(e) => {
                            setConfig(prev => ({ ...prev, system_name: e.target.value }));
                          }}
                          placeholder="Ex: Central de Vendas, assistente virtual"
                          className="w-full mt-1.5 p-3 rounded-lg bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-zinc-400 mt-1">Identificação do sistema nas respostas (Ex: Robô do Chat, Atendente Virtual).</p>
                      </div>
                    </div>

                    {/* Operating Mode & Response Length restrictions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-zinc-950 pt-6">
                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block font-mono">Modo de Operação (Lógica do Assistente AI)</label>
                        <select
                          value={config.response_mode || 'hybrid'}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setConfig(prev => ({ ...prev, response_mode: e.target.value as any }));
                          }}
                          className="w-full mt-1.5 p-3 rounded-lg bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono"
                        >
                          <option value="ai">🤖 IA 100% Automática (Responde tudo via Gemini)</option>
                          <option value="hybrid">🤝 Híbrido Inteligente (Primeiro busca Scripts do CRM, fallback na IA)</option>
                          <option value="scripts">⚡ Autônomo via Scripts (Apenas triggers/scripts do CRM, SEM Gemini)</option>
                          <option value="manual">👤 Manual de Atendimento (Quiet Mode, sem auto-resposta)</option>
                        </select>
                        <p className="text-[9px] text-zinc-400 mt-1">Defina Autônomo via Scripts para impedir que a IA (Gemini) intervenha ou gere custos.</p>
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block font-mono">Restrição de Tamanho da Resposta (Gemini)</label>
                        <select
                          value={config.answer_length || 'short'}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setConfig(prev => ({ ...prev, answer_length: e.target.value as any }));
                          }}
                          className="w-full mt-1.5 p-3 rounded-lg bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono"
                        >
                          <option value="short">⚡ Resposta Curta (1 a 2 parágrafos pequenos, ideal para mobile)</option>
                          <option value="medium">📏 Resposta Média (2 a 3 parágrafos equilibrados)</option>
                          <option value="long">📖 Resposta Longa/Completa (Até 4 parágrafos bem explicados)</option>
                        </select>
                        <p className="text-[9px] text-zinc-400 mt-1">Evita textos excessivamente complexos ou extensos para chats móveis.</p>
                      </div>
                    </div>

                    {/* Model Name & Temperature */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-zinc-950 pt-6">
                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block font-mono">Modelo Gemini Recomendado</label>
                        <select
                          value={config.model_name}
                          onChange={(e) => {
                            triggerSensoryFeedback('click', accSettings);
                            setConfig(prev => ({ ...prev, model_name: e.target.value }));
                          }}
                          className="w-full mt-1.5 p-3 rounded-lg bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono"
                        >
                          <option value="gemini-3.5-flash">Gemini 3.5 Flash (Veloz / Recomendado)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Ultra Raciocínio)</option>
                        </select>
                      </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-wider font-mono">Temperatura: {config.temperature}</label>
                        <span className="text-[9px] text-indigo-400 font-bold uppercase font-mono">
                          {config.temperature < 0.4 ? 'Focado / Rígido' : config.temperature > 0.8 ? 'Criativo / Despojado' : 'Equilibrado'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => {
                          setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }));
                        }}
                        className="w-full mt-3 h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>

                  {/* AI Persona System Instruction Prompt */}
                  <div className="border-t-2 border-zinc-950 pt-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-zinc-300 uppercase tracking-wider font-mono">Prompt Central de Comportamento (Instruções de Sistema)</label>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-indigo-400 font-black font-mono">PERSONA PRINCIPAL</span>
                    </div>
                    <textarea
                      rows={10}
                      value={config.system_instruction}
                      onChange={(e) => setConfig(prev => ({ ...prev, system_instruction: e.target.value }))}
                      placeholder="Descreva as regras operacionais, tom de voz e como o robô deve contornar objeções dos compradores..."
                      className="w-full p-4 rounded-xl bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono leading-relaxed resize-none"
                    />
                    <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-lg flex gap-2.5 items-start">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-300 leading-normal">
                        <strong>Dica comercial:</strong> Deixe claro que no final de qualquer conversa o robô deve convidar o lead para simular o financiamento CEF ou Cury com o consultor correspondente via formulário. Isso aumenta sua taxa de leads ativos!
                      </p>
                    </div>
                  </div>

                  {/* Save Configuration Action Bar */}
                  <div className="border-t-2 border-zinc-950 pt-4 flex justify-end">
                    <button
                      onClick={handleSaveConfig}
                      disabled={isSavingConfig}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5 disabled:opacity-50"
                    >
                      {isSavingConfig ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Gravando Servidor...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Salvar e Aplicar Alterações
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Whatauto Webhook Integration Tutorial Card */}
          <div className="bg-zinc-900 border-4 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-4 bg-zinc-950/30 border-b-2 border-zinc-950 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-xs font-black uppercase text-zinc-300">Como Integrar o Robô no seu WhatsApp Grátis</span>
            </div>

            <div className="p-6 space-y-4 text-xs text-zinc-300 leading-relaxed">
              <p>
                Utilizamos o aplicativo Android gratuito <strong>Whatauto</strong> para encaminhar as mensagens recebidas no seu WhatsApp Business para o nosso servidor inteligente em tempo real. Siga o roteiro passo a passo:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                <div className="p-3 bg-zinc-950/40 border-2 border-zinc-950 rounded-xl space-y-1">
                  <span className="text-[10px] font-black font-mono text-indigo-400 block uppercase">Passo 1</span>
                  <p className="text-[11px] leading-snug">Instale o app <strong>Whatauto</strong> na Play Store em um dispositivo com WhatsApp ativo.</p>
                </div>
                <div className="p-3 bg-zinc-950/40 border-2 border-zinc-950 rounded-xl space-y-1">
                  <span className="text-[10px] font-black font-mono text-indigo-400 block uppercase">Passo 2</span>
                  <p className="text-[11px] leading-snug">Ative a chave <strong>Auto Resposta</strong> e limpe os textos padrões. Acesse o menu <strong>Menu Lateral &gt; Servidor API</strong>.</p>
                </div>
                <div className="p-3 bg-zinc-950/40 border-2 border-zinc-950 rounded-xl space-y-1">
                  <span className="text-[10px] font-black font-mono text-indigo-400 block uppercase">Passo 3</span>
                  <p className="text-[11px] leading-snug">Habilite o <strong>Servidor API</strong> e cole a URL do webhook correspondente no campo URL.</p>
                </div>
              </div>

              {/* Box showing core Webhook URL to copy */}
              <div className="bg-zinc-950 border-2 border-zinc-950 p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black font-mono text-zinc-500 uppercase block">Sua URL de Webhook Exclusiva (Whatauto)</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 block truncate select-all">{webhookUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg border border-zinc-950 shrink-0 relative transition active:scale-95"
                  title="Copiar URL para Área de Transferência"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl flex gap-2.5 items-start mt-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300/90 leading-normal">
                  <strong>IMPORTANTE:</strong> No painel de configurações do app Whatauto, marque o formato de parâmetros como <strong>JSON</strong> para garantir o envio correto do nome do cliente (`sender`), mensagem (`message`) e telefone (`phone`).
                </p>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-xl flex gap-3 items-start mt-3">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[10.5px] text-zinc-300 leading-normal space-y-1">
                  <p className="font-extrabold uppercase tracking-wide text-rose-400 font-mono text-[9.5px]">🔒 Barreira de Cookie Sandbox (Ambiente Protegido do Google AI Studio)</p>
                  <p>
                    Por estar rodando em um servidor de visualização e desenvolvimento privado do AI Studio, o proxy do Google requer cookies de autenticação do seu navegador para liberar o acesso. Dispositivos externos físicos (como o seu celular com o aplicativo <strong>Whatauto</strong>, Postman ou curl) não possuem esses cookies do seu login e, por isso, <strong>recebem a página de "Cookie check / Action required" do Google</strong>.
                  </p>
                  <p className="text-zinc-400 font-medium">
                    🎯 <strong>Como Testar Agora:</strong> Use a aba <strong>📲 Simulador de Webhook</strong> na coluna da direita! Ela simula a entrada de mensagens enviando requisições com os seus cookies ativos do navegador, permitindo que as mensagens de teste sejam processadas pela IA e apareçam na <strong>Central de Conversas</strong> instantaneamente. Quando seu sistema for implantado em produção definitiva, o celular integrará perfeitamente sem barreiras!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Column Right: Interactive Playground & Real-Time Log Viewer */}
        <div className="xl:col-span-12 lg:col-span-12 space-y-8 transition-all">
          
          {/* Main Container with 2 tabs: 💬 Active Chats WA or 📲 Whatauto Simulator */}
          <div className="bg-zinc-900 border-4 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            
            {/* Real-time Administrator Tabs Header */}
            <div className="flex border-b-4 border-zinc-950 bg-zinc-950">
              <button
                type="button"
                onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveRightPanelTab('chatbot'); }}
                className={`flex-1 py-4.5 px-4 text-center text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 border-r-2 border-zinc-850 ${
                  activeRightPanelTab === 'chatbot'
                    ? 'bg-zinc-900 text-indigo-400 border-b-4 border-b-indigo-500'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                🤖 Chatbot do Assistente AI
              </button>

              <button
                type="button"
                onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveRightPanelTab('whatsapp_conversations'); }}
                className={`flex-1 py-4.5 px-4 text-center text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 border-r-2 border-zinc-850 ${
                  activeRightPanelTab === 'whatsapp_conversations'
                    ? 'bg-zinc-900 text-emerald-400 border-b-4 border-b-emerald-500'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                💬 Central de Conversas WhatsApp
              </button>
              
              <button
                type="button"
                onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveRightPanelTab('playground'); }}
                className={`flex-1 py-4.5 px-4 text-center text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeRightPanelTab === 'playground'
                    ? 'bg-zinc-900 text-[#4E9F3D] border-b-4 border-b-[#4E9F3D]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Cpu className="w-4 h-4" />
                📲 Simulador de Webhook
              </button>
            </div>

            {/* TAB 0: Interactive Chatbot Module */}
            {activeRightPanelTab === 'chatbot' && (
              <div className="flex flex-col h-[580px] bg-zinc-950/40">
                {/* Chat header area */}
                <div className="p-4 bg-zinc-950 border-b-4 border-zinc-950 flex justify-between items-center select-none shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-zinc-900 flex items-center justify-center text-white font-extrabold text-sm">
                        <Sparkles className="w-4 h-4 text-indigo-200 animate-spin-slow" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white font-mono tracking-wider flex items-center gap-1.5">
                        Assistente Virtual cicloCRED
                      </h4>
                      <p className="text-[9.5px] text-zinc-500 font-mono font-bold">MONITORAMENTO: {config.model_name.toUpperCase()} ENGINE</p>
                    </div>
                  </div>
                  <div className="flex bg-zinc-900 p-0.5 border border-zinc-700/60 rounded-lg gap-0.5 select-none">
                    <span className="text-[9px] px-2 py-0.5 text-zinc-400 font-black font-mono">TEMP: {config.temperature}</span>
                    <span className="text-[9px] px-2 py-0.5 text-indigo-400 font-black font-mono bg-zinc-950 rounded">CHAT MOCK</span>
                  </div>
                </div>

                {/* Message Log viewport */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3.5 flex flex-col justify-end min-h-0 bg-zinc-900/10">
                  <div className="overflow-y-auto p-2 space-y-4 max-h-full" id="chatbot-chat-viewport">
                    {chatBotMessages.map((msg, index) => {
                      const isAI = msg.sender === 'ai';
                      return (
                        <div key={index} className={`flex max-w-[85%] flex-col ${isAI ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                          {/* Sender identity */}
                          <span className="text-[8px] font-black uppercase font-mono tracking-wider text-zinc-500 mb-1">
                            {isAI ? '🤖 ASSISTENTE AI' : '👤 OPERADOR'} • {msg.timestamp}
                          </span>
                          {/* Message bubble */}
                          <div className={`p-3.5 rounded-2xl border-2 text-xs font-semibold leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            isAI 
                              ? 'bg-zinc-900 text-zinc-100 border-zinc-950 rounded-tl-none' 
                              : 'bg-indigo-600 text-white border-zinc-950 rounded-tr-none'
                          }`}>
                            <p className="whitespace-pre-line">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isBotResponding && (
                      <div className="flex max-w-[80%] flex-col mr-auto items-start animate-pulse">
                        <span className="text-[8px] font-black uppercase font-mono tracking-wider text-indigo-400 mb-1">
                          🤖 Assistente está elaborando resposta...
                        </span>
                        <div className="p-3.5 bg-zinc-900 border-2 border-zinc-950 text-xs font-semibold rounded-2xl rounded-tl-none text-zinc-400 flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce delay-75" />
                            <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wide">Consultando motor Generativo...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Suggestions Row */}
                <div className="px-4 py-2 bg-zinc-950/30 border-t-2 border-zinc-950 flex gap-2 overflow-x-auto select-none shrink-0 no-scrollbar">
                  {[
                    "Simular Financiamento MCMV",
                    "Como funciona a esteira de financiamento?",
                    "Como importar planilha de leads do Facebook?",
                    "Fale um pitch comercial para consórcio imobiliário"
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      disabled={isBotResponding}
                      onClick={() => handleSendChatBotMessage(preset)}
                      className="px-3 py-1.5 border border-zinc-800 text-[10px] text-zinc-300 font-mono font-bold uppercase rounded-lg bg-zinc-900/60 hover:text-indigo-300 hover:border-indigo-500 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Input action toolbar panel */}
                <div className="p-4 bg-zinc-950 border-t-4 border-zinc-950 flex gap-2 items-center shrink-0">
                  <input
                    type="text"
                    value={typedChatBotMessage}
                    onChange={(e) => setTypedChatBotMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && typedChatBotMessage.trim() && !isBotResponding) {
                        handleSendChatBotMessage(typedChatBotMessage.trim());
                      }
                    }}
                    placeholder={isBotResponding ? "Aguardando resposta do motor..." : "Fale com o seu Assistente AI cicloCRED calibrador..."}
                    disabled={isBotResponding}
                    className="flex-grow bg-zinc-900 border-2 border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendChatBotMessage(typedChatBotMessage)}
                    disabled={!typedChatBotMessage.trim() || isBotResponding}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl border-2 border-zinc-950 hover:translate-y-[-1px] active:translate-y-px transition cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[50px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-100" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: Real-Time WhatsApp CRM Conversation Center */}
            {activeRightPanelTab === 'whatsapp_conversations' && (
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px] bg-zinc-950/20">
                
                {/* Left Drawer Pane: Callers / Unique Chats Grouped */}
                <div className="md:col-span-4 bg-zinc-950/40 border-r-4 border-zinc-950 flex flex-col h-[580px] overflow-hidden">
                  <div className="p-3.5 bg-zinc-950 border-b-2 border-zinc-950 flex items-center justify-between">
                    <span className="text-[10px] font-black font-mono text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Interações Ativas ({activeChats.length})
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 font-mono font-bold">LIVE</span>
                  </div>

                  {/* Sidebar Chats Scroll Zone */}
                  <div className="flex-1 overflow-y-auto divide-y-2 divide-zinc-950 font-sans">
                    {activeChats.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 text-[11px] font-mono italic leading-relaxed">
                        Nenhuma conversa ativa registrada.<br />
                        <span className="text-zinc-600 mt-2 block not-italic">Utilize a aba "Simulador de Webhook" ao lado para disparar mensagens de teste e preencher a fila!</span>
                      </div>
                    ) : (
                      activeChats.map((chat) => {
                        const isSelected = selectedChatPhone === chat.phone;
                        const initials = chat.name ? chat.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'WA';
                        
                        return (
                          <button
                            key={chat.phone}
                            type="button"
                            onClick={() => { triggerSensoryFeedback('click', accSettings); setSelectedChatPhone(chat.phone); }}
                            className={`w-full text-left p-4 flex gap-3 transition-all ${
                              isSelected 
                                ? 'bg-zinc-800 text-white border-l-4 border-l-emerald-500 shadow-[inset_-3px_0px_0px_0px_rgba(0,0,0,0.5)]' 
                                : 'hover:bg-zinc-900/60 text-zinc-300 border-l-4 border-l-transparent'
                            }`}
                          >
                            {/* Visual Avatar Bubble */}
                            <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-black uppercase font-mono ${
                              isSelected 
                                ? 'bg-emerald-400 text-zinc-950 shadow-[1px_1px_2px_0_rgba(0,0,0,0.4)]' 
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                              {initials}
                            </div>

                            {/* Partner Meta description */}
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-baseline gap-1.5">
                                <span className="text-xs truncate font-black tracking-wide text-zinc-100">{chat.name}</span>
                                <span className="text-[8.5px] font-mono text-zinc-500 shrink-0">
                                  {new Date(chat.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              <p className="text-[10.5px] text-zinc-400 font-mono block truncate mt-1">
                                {chat.lastMsg.replace('[CORRETOR DIGITOU]', '').replace('[SOLICITAÇÃO DE RETORNO IA]', '').trim() || 'Fim de transmissão...'}
                              </p>

                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-950/20">
                                <span className="text-[8.5px] font-mono text-zinc-500 font-bold block">
                                  {chat.phone}
                                </span>
                                <span className={`text-[8.5px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                                  chat.status === 'erro' 
                                    ? 'bg-rose-950 text-rose-400 border border-rose-500/20' 
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {chat.status === 'erro' ? 'Falhou' : 'Sincronizado'}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Interactive Mockup Screen: WA Styled Box */}
                <div className="md:col-span-8 flex flex-col h-[580px] bg-[#0c1317] border-t border-zinc-950 relative overflow-hidden select-none">
                  
                  {/* WhatsApp styled ambient grid wallpaper overlay */}
                  <div className="absolute inset-0 opacity-4 pointer-events-none" style={{
                    backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                    backgroundSize: '360px',
                    backgroundRepeat: 'repeat'
                  }} />

                  {selectedChatPhone ? (
                    <>
                      {/* Active Partner Chat Header */}
                      <div className="p-3.5 bg-zinc-900 border-b-2 border-zinc-950 shrink-0 z-10 flex items-center justify-between gap-2 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-black font-mono">
                            {logs.find(l => l.phone === selectedChatPhone)?.sender.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'WA'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {logs.find(l => l.phone === selectedChatPhone)?.sender || 'Cliente WhatsApp'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[8.5px] px-2 py-0.5 bg-emerald-950 border border-emerald-500/25 rounded-md text-emerald-400 font-extrabold uppercase font-mono tracking-widest animate-pulse">
                                <span className="h-1 w-1 bg-emerald-400 rounded-full shrink-0" />
                                Monitoramento Ativo
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">Telefone Sincronizado: {selectedChatPhone}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedLead && (
                            <button
                              type="button"
                              onClick={handleToggleLeadMute}
                              className={`flex items-center gap-1.5 text-[9px] font-black uppercase font-mono tracking-wider px-2.5 py-1.5 rounded-lg border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition active:scale-95 ${
                                selectedLead.ai_muted 
                                  ? 'bg-rose-600 text-white hover:bg-rose-500' 
                                  : 'bg-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-700'
                              }`}
                              title={selectedLead.ai_muted ? "Habilitar auto-respostas da IA" : "Silenciar auto-respostas da IA para este contato específico"}
                            >
                              {selectedLead.ai_muted ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-yellow-300 shrink-0" />
                                  <span>Humano Ativo (IA Muda)</span>
                                </>
                              ) : (
                                <>
                                  <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>IA Ativa</span>
                                </>
                              )}
                            </button>
                          )}

                          <div className="flex items-center gap-1.5 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-850">
                            <span className="text-[9px] font-mono text-zinc-400">Canal LIVE</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages Log Body */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4 z-10 font-sans flex flex-col scrollbar-thin">
                        {selectedChatMessages.length === 0 ? (
                          <div className="m-auto text-center text-zinc-500 max-w-xs space-y-3 p-12">
                            <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto" />
                            <p className="text-xs font-mono font-bold uppercase tracking-wider">Histórico não indexado</p>
                            <p className="text-[10px] text-zinc-500 leading-normal font-mono">Sincronize mensagens do webhook Whatauto para iniciar o monitoramento gráfico.</p>
                          </div>
                        ) : (
                          selectedChatMessages.map((msg, idx) => {
                            const isCustomer = msg.sender === 'customer';
                            const isAI = msg.sender === 'ai';
                            
                            return (
                              <div
                                key={idx}
                                className={`flex flex-col max-w-[82%] ${
                                  isCustomer 
                                    ? 'self-start items-start' 
                                    : 'self-end items-end'
                                }`}
                              >
                                {/* Chat Bubble framing based on author */}
                                <div className={`p-3.5 rounded-2xl relative shadow-lg break-words text-left ${
                                  isCustomer
                                    ? 'bg-zinc-800 text-white rounded-tl-none border-l-2 border-indigo-500'
                                    : isAI 
                                      ? 'bg-emerald-950/90 border border-emerald-500/20 text-emerald-100 rounded-tr-none'
                                      : 'bg-indigo-950/90 border border-indigo-500/20 text-indigo-100 rounded-tr-none'
                                }`}>
                                  
                                  {/* Bubble sender label */}
                                  <span className={`text-[8px] font-bold font-mono uppercase tracking-widest block mb-1 ${
                                    isCustomer ? 'text-indigo-400' : isAI ? 'text-emerald-400' : 'text-purple-400'
                                  }`}>
                                    {isCustomer 
                                      ? 'CLIENTE (ENTRADA WHATSAPP)' 
                                      : isAI 
                                        ? 'AUTO-RESPOSTA IA (GEMINI WEBHOOK)' 
                                        : 'CORRETOR (OUTBOUND CRM)'}
                                  </span>

                                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                  
                                  {/* Message Stamp */}
                                  <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] font-mono text-zinc-500/80 leading-none">
                                    {msg.model && (
                                      <span className="text-[8px] font-black text-zinc-400 font-mono tracking-widest bg-zinc-950/90 py-0.5 px-1.5 rounded uppercase">
                                        {msg.model}
                                      </span>
                                    )}
                                    <span>{msg.time}</span>
                                    {!isCustomer && (
                                      <span className="text-emerald-400 font-bold tracking-tighter" title="Mensagem Entregue e Disparada">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Prompt Directive Quick Reply Suggestions with Dynamic Workspace Script Templates */}
                      <div className="px-3 py-2 bg-zinc-900/90 border-t border-zinc-950/80 z-10 flex gap-2 overflow-x-auto shrink-0 scrollbar-none select-none items-center">
                        <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest shrink-0 border-r border-zinc-850 pr-2">Roteiros:</span>
                        
                        <button
                          type="button"
                          onClick={handleAutofillAI}
                          disabled={isSendingCustom}
                          className="text-[10px] font-mono font-black text-indigo-300 shrink-0 bg-zinc-950 border border-indigo-500/30 py-1.5 px-3.5 rounded-full hover:bg-zinc-900 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse fill-indigo-400" />
                          <span>✨ Auto-Sugerir IA</span>
                        </button>
                        
                        {/* Dynamic Workspace Script Templates */}
                        {templates.length === 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate('Olá {{nome}}! Aqui é o seu consultor da {{empresa}}. Verifiquei seu interesse no portal e gostaria de agendar uma ligação para alinhar seu financiamento. Qual o melhor horário?')}
                              className="text-[10px] font-mono text-zinc-300 shrink-0 bg-zinc-950 border border-zinc-800 py-1.5 px-3.5 rounded-full hover:bg-zinc-900 transition"
                            >
                              📋 Apresentação Padrão
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate('Excelente, {{nome}}. Para realizar sua simulação exata pela {{empresa}}, qual é a sua renda bruta mensal atual e você possui saldo de FGTS disponível?')}
                              className="text-[10px] font-mono text-zinc-300 shrink-0 bg-zinc-950 border border-zinc-800 py-1.5 px-3.5 rounded-full hover:bg-zinc-900 transition"
                            >
                              📋 Solicitação de FGTS & Renda
                            </button>
                          </>
                        ) : (
                          templates.map((tpl: any) => (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => handleApplyTemplate(tpl.body)}
                              className="text-[10px] font-mono text-zinc-300 shrink-0 bg-zinc-950 border border-zinc-800/80 py-1.5 px-3.5 rounded-full hover:bg-zinc-900 transition flex items-center gap-1 hover:border-zinc-750 hover:text-white"
                              title={tpl.body}
                            >
                              <span className="text-zinc-500 font-bold">📋</span>
                              <span>{tpl.name}</span>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Custom outbound input controller */}
                      <div className="p-3 bg-zinc-900 border-t-2 border-zinc-950 shrink-0 z-10 flex items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
                        <input
                          type="text"
                          value={customReplyText}
                          onChange={(e) => setCustomReplyText(e.target.value)}
                          placeholder={isSendingCustom ? "Processando transmissão..." : "Escreva uma resposta para enviar ao WhatsApp do cliente..."}
                          className="flex-1 p-3 bg-zinc-950 text-white text-xs rounded-xl border border-zinc-850 focus:outline-none focus:border-indigo-500 font-sans font-medium"
                          disabled={isSendingCustom}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customReplyText.trim()) {
                              handleSendCustomMessage(customReplyText, 'human');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSendCustomMessage(customReplyText, 'human')}
                          disabled={isSendingCustom || !customReplyText.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl border-2 border-zinc-950 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition active:scale-95 disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                          title="Enviar Mensagem via Dispositivo Ativo"
                        >
                          {isSendingCustom ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-amber-300 stroke-amber-400" />
                              <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Enviar WhatsApp</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="m-auto text-center px-6 max-w-xs space-y-4 py-28 z-10">
                      <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto" />
                      <h4 className="text-sm font-black text-zinc-300 font-mono uppercase tracking-wider animate-pulse">Selecione uma Conversa</h4>
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Selecione um dos contatos na lista lateral para monitorar o timeline de diálogo da inteligência e do WhatsApp de ponta a ponta.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: Whatauto Standard Playground & Webhook mapping */}
            {activeRightPanelTab === 'playground' && (
              <div>
                {/* Header Tabs inside the playground */}
                <div className="flex border-b-2 border-zinc-950 bg-zinc-950/20">
                  <button
                    type="button"
                    onClick={() => { triggerSensoryFeedback('click', accSettings); setActivePlaygroundTab('flow'); }}
                    className={`flex-1 py-3 text-center text-[10px] font-black uppercase font-mono tracking-wider transition-all border-r border-[#1a1a1a] ${
                      activePlaygroundTab === 'flow'
                        ? 'bg-zinc-800 text-white'
                        : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    📲 Simulador
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerSensoryFeedback('click', accSettings); setActivePlaygroundTab('json'); }}
                    className={`flex-1 py-3 text-center text-[10px] font-black uppercase font-mono tracking-wider transition-all border-r border-[#1a1a1a] ${
                      activePlaygroundTab === 'json'
                        ? 'bg-zinc-800 text-[#4E9F3D]'
                        : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    📋 JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerSensoryFeedback('click', accSettings); setActivePlaygroundTab('debugger'); }}
                    className={`flex-1 py-3 text-center text-[10px] font-black uppercase font-mono tracking-wider transition-all ${
                      activePlaygroundTab === 'debugger'
                        ? 'bg-zinc-800 text-amber-400'
                        : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    💻 Console Debug
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {activePlaygroundTab === 'flow' && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400">
                        Insira os dados simulando as configurações reais de um app de mensagens para validar o roteamento e a auto-resposta inteligente:
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono">Nome Cliente (sender)</label>
                          <input
                            type="text"
                            value={mockSender}
                            onChange={(e) => setMockSender(e.target.value)}
                            className="w-full mt-1 p-2 bg-zinc-950 rounded-lg text-white text-xs border border-zinc-850 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono">Telefone (phone)</label>
                          <input
                            type="text"
                            value={mockPhone}
                            onChange={(e) => setMockPhone(e.target.value)}
                            className="w-full mt-1 p-2 bg-zinc-950 rounded-lg text-white text-xs border border-zinc-850 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono">ID Regra (ruleId)</label>
                          <input
                            type="number"
                            value={ruleId}
                            onChange={(e) => setRuleId(Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-zinc-950 rounded-lg text-white text-xs border border-zinc-850 font-mono"
                          />
                        </div>
                        <div className="flex flex-col justify-center items-center bg-zinc-950/50 rounded-lg border border-zinc-850 p-1">
                          <span className="text-[9px] font-black text-zinc-500 font-mono uppercase">É Grupo?</span>
                          <input
                            type="checkbox"
                            checked={mockIsGroup}
                            onChange={(e) => setMockIsGroup(e.target.checked)}
                            className="mt-1 h-3.5 w-3.5 accent-indigo-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col justify-center items-center bg-zinc-950/50 rounded-lg border border-zinc-850 p-1">
                          <span className="text-[9px] font-black text-zinc-500 font-mono uppercase">Teste?</span>
                          <input
                            type="checkbox"
                            checked={isTestMessage}
                            onChange={(e) => setIsTestMessage(e.target.checked)}
                            className="mt-1 h-3.5 w-3.5 accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {mockIsGroup && (
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono">Participante do Grupo</label>
                          <input
                            type="text"
                            placeholder="Ex: Consultor Otávio"
                            value={mockGroupParticipant}
                            onChange={(e) => setMockGroupParticipant(e.target.value)}
                            className="w-full mt-1 p-2 bg-zinc-950 rounded-lg text-white text-xs border border-zinc-850 font-mono"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block font-mono">Mensagem do Cliente (message)</label>
                        <textarea
                          rows={2}
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          placeholder="Exemplo: Gostaria de simular a compra de um apartamento Minha Casa Minha Vida"
                          className="w-full mt-1 p-3 rounded-lg bg-zinc-950 text-white text-xs border-2 border-zinc-950 focus:border-indigo-500 focus:outline-none font-mono resize-none leading-relaxed"
                        />
                      </div>

                      {/* Connection Router & Destination Settings */}
                      <div className="bg-zinc-950/40 border-2 border-zinc-950 p-3.5 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-500/25" />
                            <span className="text-[10px] font-black uppercase text-zinc-300 font-mono tracking-wider">URL do Autoresponder (Celular)</span>
                          </div>
                          <span className="text-[8px] font-mono uppercase bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500">Ponto de Envio</span>
                        </div>
                        <input
                          type="text"
                          value={autoresponderUrl}
                          onChange={(e) => setAutoresponderUrl(e.target.value)}
                          placeholder="Ex: http://192.168.15.5:8080 or Mock built-in URL"
                          className="w-full p-2.5 bg-zinc-950 rounded-lg text-white font-mono text-[10.5px] border border-zinc-850 focus:border-indigo-500 focus:outline-none"
                        />
                        <p className="text-[9px] text-zinc-500 font-mono leading-relaxed">
                          Dica: Deixe o padrão do simulador integrado para disparar de volta ao canal de recepção mockado seguro. O Servidor validará e transmitirá o JSON.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pb-1">
                        <button
                          type="button"
                          onClick={handleSimulateWebhook}
                          disabled={isTesting || isTestingDirect || !testMessage.trim()}
                          className="w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-350 hover:text-white text-[10.5px] font-black uppercase tracking-wider py-3 px-3 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5 disabled:opacity-50 font-mono"
                          title="Simular requisição de entrada recebida pelo Whatauto"
                        >
                          {isTesting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Simulando...
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              1. Simular Webhook
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSimulateDirectTest}
                          disabled={isTesting || isTestingDirect || !testMessage.trim()}
                          className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black uppercase tracking-wider py-3 px-3 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-0.5 disabled:opacity-50 font-mono"
                          title="Disparar fluxo de volta ao celular, testando portas e conexões físicas de rede"
                        >
                          {isTestingDirect ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Disparando...
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-amber-300 stroke-amber-400" />
                              2. Teste Direto
                            </>
                          )}
                        </button>
                      </div>

                      {testReply && (
                        <div className="bg-zinc-950/40 p-4 rounded-xl border-2 border-zinc-950 space-y-3.5 mt-2 transition-all">
                          <div className="flex items-center justify-between text-[10px] font-mono border-b border-zinc-950 pb-2">
                            <span className="text-emerald-400 font-extrabold uppercase tracking-wider">Fluxo Webhook Processado</span>
                            {testResult?.latency_ms && (
                              <span className="text-zinc-500">{testResult.latency_ms}ms de latência</span>
                            )}
                          </div>

                          <div className="space-y-3 pt-1">
                            <div className="relative pl-6 space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                              <div className="relative">
                                <span className="absolute -left-[24px] top-0.5 w-[14px] h-[14px] rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-black text-black">1</span>
                                <p className="text-[11px] font-mono text-zinc-300">
                                  <span className="font-black text-zinc-100">{mockSender}</span> enviou no WhatsApp: <span className="text-emerald-300 italic font-medium">"{testMessage}"</span>
                                </p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[24px] top-0.5 w-[14px] h-[14px] rounded-full bg-zinc-700 flex items-center justify-center text-[8px] font-black text-white">2</span>
                                <p className="text-[11px] font-mono text-zinc-400">
                                  App <span className="text-indigo-400">Whatauto</span> interceptou o evento e converteu em pacote JSON estruturado.
                                </p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[24px] top-0.5 w-[14px] h-[14px] rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">3</span>
                                <p className="text-[11px] font-mono text-zinc-300">
                                  Assistente <span className="text-purple-400">AI cicloCRED</span> ativou a persona de atendimento e persistiu o histórico no CRM do Firestore.
                                </p>
                              </div>
                            </div>

                            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-1">
                              <span className="text-[9px] font-black text-emerald-400 block font-mono uppercase tracking-widest">Retorno do Assistente AI via Replies:</span>
                              <p className="text-[11px] text-zinc-200 leading-relaxed font-mono whitespace-pre-line bg-zinc-950">{testReply}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activePlaygroundTab === 'json' && (
                    <div className="space-y-5 text-left font-mono">
                      <p className="text-xs text-zinc-400">
                        Abaixo você visualiza os objetos de dados em tempo real conforme as regras e variáveis preenchidas no simulador de fluxo:
                      </p>

                      <div>
                        <h3 className="text-xs font-black text-[#4E9F3D] font-mono uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <span>•</span> Solicitação ao servidor
                        </h3>
                        <div className="p-3 bg-zinc-950 border-2 border-zinc-950 rounded-xl font-mono text-[11px] text-zinc-300 leading-snug max-h-72 overflow-y-auto select-all">
                          <span>{"{"}</span>
                          <div className="pl-4">
                            <p><span className="text-purple-400">"appPackageName"</span>: <span className="text-emerald-400">"tkstudio.autorespondermsg"</span>,</p>
                            <p><span className="text-purple-400">"messengerPackageName"</span>: <span className="text-emerald-400">"com.whatsapp"</span>,</p>
                            <p><span className="text-purple-400">"query"</span>: <span className="text-zinc-500">{"{"}</span></p>
                            <div className="pl-4 text-zinc-400">
                              <p><span className="text-teal-400">"sender"</span>: <span className="text-amber-300">"{mockSender}"</span>,</p>
                              <p><span className="text-teal-400">"message"</span>: <span className="text-amber-300">"{testMessage}"</span>,</p>
                              <p><span className="text-teal-400">"isGroup"</span>: <span className="text-indigo-400">{mockIsGroup ? 'true' : 'false'}</span>,</p>
                              <p><span className="text-teal-400">"groupParticipant"</span>: <span className="text-amber-300">"{mockIsGroup ? mockGroupParticipant : ''}"</span>,</p>
                              <p><span className="text-teal-400">"ruleId"</span>: <span className="text-indigo-400">{ruleId}</span>,</p>
                              <p><span className="text-teal-400">"isTestMessage"</span>: <span className="text-indigo-400">{isTestMessage ? 'true' : 'false'}</span>,</p>
                              <p><span className="text-teal-400">"phone"</span>: <span className="text-amber-300">"{mockPhone}"</span></p>
                            </div>
                            <p className="text-zinc-500">{"}"}</p>
                          </div>
                          <span>{"}"}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-[#4E9F3D] font-mono uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <span>•</span> Resposta do servidor
                        </h3>
                        <div className="p-3 bg-zinc-950 border-2 border-zinc-950 rounded-xl font-mono text-[11px] text-zinc-300 leading-snug max-h-72 overflow-y-auto selection:bg-emerald-800">
                          {testReply ? (
                            <>
                              <span>{"{"}</span>
                              <div className="pl-4">
                                <p><span className="text-purple-400">"replies"</span>: <span className="text-zinc-500">{"["}</span></p>
                                <div className="pl-4">
                                  <p className="text-zinc-500">{"{"}</p>
                                  <div className="pl-4">
                                    <p><span className="text-teal-400">"message"</span>: <span className="text-emerald-300">"{testReply.replace(/"/g, '\\"')}"</span></p>
                                  </div>
                                  <p className="text-zinc-500">{"}"}</p>
                                </div>
                                <p className="text-zinc-500">{"]"}</p>
                              </div>
                              <span>{"}"}</span>
                            </>
                          ) : (
                            <div className="text-zinc-500 italic text-center py-4 text-[10px]">
                              [Aguardando processar simulação para expor resposta em vetor estruturado replies]
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 leading-normal bg-zinc-950/35 border border-zinc-800 p-2.5 rounded-lg font-mono">
                        💡 <strong>Como funciona a lógica de ida e volta:</strong> O Whatauto intercepta a notificação do celular do broker em tempo real, despacha a "Solicitação" via POST ao nosso servidor e injeta a "Resposta" de volta no balão correspondente de chat.
                      </div>
                    </div>
                  )}

                  {activePlaygroundTab === 'debugger' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-3 text-left">
                        <div>
                          <h4 className="text-xs font-black uppercase text-zinc-300 font-mono tracking-wider">Console de Depuração de Rede</h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Visão detalhada do tráfego raw e status de validação de leads.</p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchWebhookDebugLogs}
                          disabled={isLoadingDebugLogs}
                          className="flex items-center gap-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-850 text-[10px] uppercase font-mono font-bold tracking-wider transition"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingDebugLogs ? 'animate-spin' : ''}`} />
                          Atualizar
                        </button>
                      </div>

                      {isLoadingDebugLogs && webhookDebugLogsList.length === 0 ? (
                        <div className="py-16 text-center space-y-2">
                          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-sans">Lendo fluxos brutos...</p>
                        </div>
                      ) : webhookDebugLogsList.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-zinc-950 text-zinc-500 font-mono text-[10.5px] p-6 rounded-xl leading-relaxed text-center">
                          ⚠️ Nenhum log de depuração registrado ainda.<br/>
                          Realize disparos de teste ou simulação para gerar atividades em tempo real.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {webhookDebugLogsList.map((log: any) => {
                            const isIncoming = log.direction === 'incoming';
                            const isOutgoing = log.direction === 'outgoing_test';
                            const isIncomingSim = log.direction === 'incoming_simulation';
                            
                            let directionBadge = "📥 Entrada";
                            let badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                            if (isOutgoing) {
                              directionBadge = "📤 Envio Teste";
                              badgeStyle = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                            } else if (isIncomingSim) {
                              directionBadge = "🔮 Simulação";
                              badgeStyle = "bg-[#4E9F3D]/10 text-[#4E9F3D] border border-[#4E9F3D]/20";
                            }

                            return (
                              <div key={log.id} className="bg-zinc-950 p-3.5 border-2 border-zinc-950 rounded-xl space-y-3 font-mono text-[10.5px] text-left">
                                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${badgeStyle}`}>
                                      {directionBadge}
                                    </span>
                                    <span className="text-[9px] text-zinc-500">{new Date(log.timestamp).toLocaleTimeString('pt-BR')} • {log.method}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${log.isValid ? 'bg-indigo-500/10 text-indigo-300 font-bold' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold'}`}>
                                      {log.isValid ? 'Válido' : 'Rejeitado'}
                                    </span>
                                    <span className="text-[9.5px] text-zinc-600">({log.responseStatus})</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 bg-zinc-950 border border-zinc-900 rounded p-2 overflow-x-auto text-[9.5px]">
                                  <div className="flex items-center justify-between text-[8px] border-b border-zinc-900 pb-1.5 mb-1.5">
                                    <span className="text-zinc-500 font-extrabold uppercase font-sans">Rota / Host de Tráfego:</span>
                                    <span className="text-zinc-400 select-all font-mono italic max-w-xs truncate">{log.endpoint}</span>
                                  </div>
                                  
                                  {log.validationErrors && log.validationErrors.length > 0 && (
                                    <div className="bg-rose-950/15 p-2 rounded border border-rose-950/40 text-[9.5px] text-rose-300 space-y-1 mb-2">
                                      <strong className="block text-[8px] tracking-widest uppercase text-rose-400 font-sans">Invalidações da Camada de Segurança:</strong>
                                      {log.validationErrors.map((err: string, idx: number) => (
                                        <p key={idx}>• {err}</p>
                                      ))}
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-wider block font-mono font-sans">Payload de Entrada (Raw Query):</span>
                                    <pre className="text-[9px] text-zinc-400 max-h-40 overflow-y-auto bg-zinc-950/80 p-2 rounded scrollbar-thin select-all leading-normal font-mono">
                                      {JSON.stringify(log.rawPayload, null, 2)}
                                    </pre>
                                  </div>

                                  {log.responsePayload && (
                                    <div className="space-y-1 mt-2 border-t border-zinc-900 pt-2 pb-1 font-mono">
                                      <span className="text-[8.5px] font-black text-indigo-400 uppercase tracking-wider block font-mono font-sans">Resposta Completa Retornada:</span>
                                      <pre className="text-[9px] text-zinc-400 max-h-40 overflow-y-auto bg-zinc-950/80 p-2 rounded scrollbar-thin select-all leading-normal font-mono">
                                        {JSON.stringify(log.responsePayload, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Webhook API Real-time Logs Monitor */}
          <div className="bg-zinc-900 border-4 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-4 bg-zinc-950/30 border-b-2 border-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs font-black uppercase text-zinc-300">Filtro Rápido e Logs de Processamento</span>
              </div>
              <button
                onClick={fetchConfigAndLogs}
                disabled={isLoadingLogs}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Sincronizar Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Filtro Rápido de Logs */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filtro rápido: buscar por nome, telefone, mensagem ou retorno..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-950 hover:border-zinc-800 focus:border-purple-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>

              {isLoadingLogs && logs.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Lendo logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono uppercase">
                  Nenhuma mensagem via webhook foi processada ainda.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {(() => {
                    const filteredLogs = logs.filter(log => {
                      const q = logSearchQuery.toLowerCase();
                      if (!q) return true;
                      return (log.sender || '').toLowerCase().includes(q) ||
                             (log.phone || '').toLowerCase().includes(q) ||
                             (log.message || '').toLowerCase().includes(q) ||
                             (log.reply || '').toLowerCase().includes(q);
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <div className="py-8 text-center text-zinc-500 text-xs font-mono italic">
                          Nenhum log corresponde ao filtro "{logSearchQuery}".
                        </div>
                      );
                    }

                    return filteredLogs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => {
                          triggerSensoryFeedback('click', accSettings);
                          if (log.phone) {
                            setSelectedChatPhone(log.phone);
                          }
                          setActiveRightPanelTab('whatsapp_conversations');
                          if (addNotification) {
                            addNotification('Chat Aberto', `Visualizando timeline de ${log.sender}`, 'info');
                          }
                        }}
                        className={`group relative p-3.5 rounded-xl border-2 border-zinc-950 cursor-pointer hover:border-indigo-500/60 hover:bg-zinc-800/40 transition-all ${
                          log.status === 'sucesso' 
                            ? 'bg-zinc-950/20' 
                            : 'bg-rose-950/10 border-rose-950/40'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 text-left font-sans">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black font-sans text-white hover:text-emerald-400 transition-colors">{log.sender}</span>
                              <span className="text-[9px] font-mono text-zinc-500">({log.phone})</span>
                            </div>
                            
                            {/* Label formatting based on sender context */}
                            <div className="flex items-center gap-1.5 mt-1 font-mono">
                              <span className="text-[8.5px] font-black uppercase text-zinc-500 block">Enviou:</span>
                              <p className="text-[10.5px] text-zinc-300 italic line-clamp-1">
                                "{log.message}"
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[8px] font-black font-mono uppercase px-1.5 py-0.5 rounded ${
                              log.status === 'sucesso' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                            }`}>
                              {log.status === 'sucesso' ? 'sucesso' : 'erro'}
                            </span>
                            
                            {/* Trash Delete Action Button */}
                            {log.id && log.id !== 'quota-limit-log' && (
                              <button
                                onClick={(e) => handleDeleteLog(log.id, e)}
                                title="Excluir este log permanentemente"
                                className="p-1 px-1.5 rounded-md border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {log.reply && log.status === 'sucesso' && (
                          <div className="mt-2 text-[10px] font-mono text-indigo-300 bg-zinc-950/40 p-2.5 rounded border border-zinc-900/60 line-clamp-2 leading-relaxed text-left">
                            <strong>Retorno:</strong> {log.reply}
                          </div>
                        )}

                        {log.error_message && (
                          <div className="mt-2 text-[10.5px] font-mono text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-950/50 text-left">
                            <strong>Erro:</strong> {log.error_message}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-zinc-950/20 text-[9px] text-zinc-500 font-mono">
                          <span className="text-indigo-400">Clique para abrir chat do cliente</span>
                          <span>{new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {log.latency_ms} ms</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
