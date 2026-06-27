/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, EmailLog, OperationalFlow, Appointment } from '../types';
import { handleWhatsAppAction } from '../utils/whatsapp';
import { getKanbanColumns } from '../utils/kanban';
import { 
  X, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  Clock, 
  FileText, 
  MessageSquare,
  Send,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  Award,
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Calculator,
  Layers,
  Users,
  Cloud,
  Calendar,
  MessageCircle,
  Bell,
  Bot,
  ListTree,
  ChevronDown,
  Trash2,
  Plus,
  Check,
  CalendarDays
} from 'lucide-react';
import { 
  getWorkspaceToken, 
  sendGmailMessage, 
  createGoogleCalendarEvent 
} from './GoogleWorkspace';

interface LeadDetailsModalProps {
  isOpen: boolean;
  lead: Lead | null;
  emailLogs: EmailLog[];
  properties?: any[];
  onClose: () => void;
  onUpdateLeadNotes: (leadId: string, notes: string) => void;
  onUpdateLeadStatus: (leadId: string, status: string, targetPageId?: string) => void;
  onUpdateLeadFamilyIncome?: (leadId: string, income: number) => void;
  onUpdateLeadFull?: (leadId: string, updatedFields: Partial<Lead>) => void;
  awardXP?: (xpGained: number) => void;
  onOpenAIAssistant?: (lead: Lead) => void;
  onOpenRuleEngine?: (lead: Lead) => void;
  onOpenEditModal?: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  onNavigateToFollowUp?: (lead: Lead) => void;
  appointments?: Appointment[];
  setAppointments?: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const getDaysSinceContact = (lastContactAt?: string): number | null => {
  if (!lastContactAt) return null;
  const cleanStr = lastContactAt.slice(0, 10);
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const contactDate = new Date(year, month, day);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = todayMidnight.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

interface PredictiveProperty {
  id: string;
  title: string;
  developer: string;
  price: number;
  location: string;
  typology: string;
  minIncomeRequired: number;
  benefits: string[];
  icon: string;
  imageBg: string;
}

const STOCK_DEVELOPMENTS: PredictiveProperty[] = [
  {
    id: 'prop-cury-1',
    title: 'Cury Residencial Parque do Carmo',
    developer: 'Cury Construtora',
    price: 245000,
    location: 'Itaquera, Zona Leste - SP',
    typology: '1 e 2 Dormitórios • Varanda & Lazer Completo',
    minIncomeRequired: 1800,
    benefits: ['Subsídio Caixa de até R$ 55 mil', 'ITBI e Registro Grátis', 'Entrada parcelada em 36x'],
    icon: '🏠',
    imageBg: 'from-cyan-100 to-blue-50/50'
  },
  {
    id: 'prop-cury-2',
    title: 'Cury Eko Metropolitana Guarulhos',
    developer: 'Cury Construtora',
    price: 315000,
    location: 'Guarulhos Centro - SP',
    typology: '2 Dormitórios • Suíte e Sacada Gourmet',
    minIncomeRequired: 2800,
    benefits: ['Subsídio Caixa Faixa 3 ativa', 'Use FGTS Integral', 'Menor taxa de juros Caixa MCMV'],
    icon: '🏢',
    imageBg: 'from-violet-100 to-purple-50/50'
  },
  {
    id: 'prop-cury-3',
    title: 'Cury Dez Metro Itaquera',
    developer: 'Cury Construtora',
    price: 285000,
    location: 'Itaquera (Ao lado do Metrô) - SP',
    typology: '1 ou 2 Dorms • Opção de Vaga Coberta',
    minIncomeRequired: 2200,
    benefits: ['Fácil acesso ao metrô', 'Documentação Grátis Cury', 'Subsídio MCMV active'],
    icon: '🚇',
    imageBg: 'from-sky-100 to-blue-50/50'
  },
  {
    id: 'prop-cury-4',
    title: 'Cury Único Santo André',
    developer: 'Cury Construtora',
    price: 340000,
    location: 'Santo André Bairro Campestre - SP',
    typology: '2 Dorms • Garagem demarcada inclusive',
    minIncomeRequired: 3300,
    benefits: ['Complexo aquático residencial', 'Localização premium ABC', 'Escrituração Grátis'],
    icon: '🌊',
    imageBg: 'from-emerald-100 to-teal-50/50'
  },
  {
    id: 'prop-cury-5',
    title: 'Cury Elite Pinheiros',
    developer: 'Cury Construtora Alto Padrão',
    price: 495000,
    location: 'Pinheiros, Zona Oeste - SP',
    typology: 'Estúdio e 2 Dorms • Lazer de luxo no Rooftop',
    minIncomeRequired: 7000,
    benefits: ['Amortização facilitada', 'Investimento com alta liquidez', 'Taxas SBPE exclusivas'],
    icon: '✨',
    imageBg: 'from-amber-100 to-yellow-50/50'
  }
];

export default function LeadDetailsModal({ 
  isOpen, 
  lead, 
  emailLogs,
  properties = [],
  onClose, 
  onUpdateLeadNotes,
  onUpdateLeadStatus,
  onUpdateLeadFamilyIncome,
  onUpdateLeadFull,
  awardXP,
  onOpenAIAssistant,
  onOpenRuleEngine,
  onOpenEditModal,
  onDeleteLead,
  onNavigateToFollowUp,
  appointments = [],
  setAppointments
}: LeadDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'ficha_checklist' | 'dossies_fluxos' | 'agenda' | 'historico'>('ficha_checklist');
  const [notesText, setNotesText] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [flowNotification, setFlowNotification] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('script-mcmv');

  const [operationalFlows, setOperationalFlows] = useState<OperationalFlow[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_operational_flows");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: "flow-1",
        name: "Fluxo Padrão - Geral",
        createdAt: new Date().toISOString(),
        stages: [
          { id: "stage-1", name: "Primeiro Contato", timer: { days: 1, hours: 0, minutes: 0 } },
          { id: "stage-2", name: "Simulação", timer: { days: 2, hours: 0, minutes: 0 } },
          { id: "stage-3", name: "Análise de Crédito", timer: { days: 3, hours: 0, minutes: 0 } }
        ]
      }
    ];
  });

  useEffect(() => {
    if (lead) {
      setSelectedFlowId(lead.fluxoId || '');
    }
  }, [lead]);

  const SCRIPTS_LIBRARY = [
    {
      id: 'script-mcmv',
      title: '🟢 Abordagem MCMV & Subsídio',
      category: 'Primeiro Imóvel',
      description: 'Focado em atrair clientes com potencial para subsídio de até R$ 55 mil.',
      template: 'Olá [Nome], tudo bem? Me chamo [Corretor] e sou especialista em crédito do cicloCRED.\n\nEstava analisando seu perfil e vi que tem interesse no empreendimento [Imovel]. Sabia que com a sua renda mensal declarada de R$ [Renda], você tem direito ao programa Minha Casa Minha Vida e pode receber até R$ 55.000 de subsídio direto do governo para abater o saldo?\n\nGostaria de simular suas parcelas em 2 minutos sem compromisso? Tenho um simulador oficial Caixa aberto aqui.'
    },
    {
      id: 'script-sbpe',
      title: '🔵 Apresentação de Parcelas Médias / SBPE',
      category: 'Médio/Alto Padrão',
      description: 'Ideal para clientes de classe média interessados em tabela SAC ou Price.',
      template: 'Olá [Nome], excelente dia! Aqui é [Corretor] do cicloCRED.\n\nTenho ótimas notícias sobre o empreendimento [Imovel] de seu interesse. Fiz um pré-enquadramento de crédito habitacional pelo SBPE na tabela SAC, e as primeiras parcelas estimadas ficaram super confortáveis, com a facilidade de amortização progressiva.\n\nSua renda declarada de R$ [Renda] se enquadra perfeitamente. Vamos fazer uma simulação personalizada hoje? Qual o melhor horário?'
    },
    {
      id: 'script-restricao',
      title: '🟡 Contorno de Restrição Bacen & Composição',
      category: 'Recuperação',
      description: 'Roteiro de acolhimento para contornar restrições de crédito propondo composição familiar.',
      template: 'Olá [Nome], tudo bem?\n\nQuero te tranquilizar sobre o financiamento do [Imovel]. Muitos clientes pensam que ter alguma restrição Bacen inviabiliza o sonho do imóvel, mas a verdade é que existem ótimas soluções! Nós conseguimos fazer a composição de renda familiar, incluindo um co-comprador para aprovar seu crédito sem burocracia na Caixa.\n\nCom a renda conjunta ajustada, o banco aprova o crédito rapidamente. Vamos conversar para eu te mostrar como funciona?'
    }
  ];

  const getPersonalizedScript = (template: string) => {
    if (!lead) return '';
    const agentName = localStorage.getItem('ciclocred_user_name') || 'Consultor';
    const rawIncome = lead.familyIncome || 5000;
    const formattedIncome = Number(rawIncome).toLocaleString('pt-BR');
    const imovelName = lead.propertyInterest || 'Empreendimento de Interesse';
    
    return template
      .replace(/\[Nome\]/g, lead.name)
      .replace(/\[Corretor\]/g, agentName)
      .replace(/\[Renda\]/g, formattedIncome)
      .replace(/\[Imovel\]/g, imovelName);
  };

  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const scoreBadgeColor = () => {
    if (!lead) return 'bg-zinc-100 text-zinc-800 border-zinc-500';
    const sc = lead.score || 40;
    if (sc >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-600';
    if (sc >= 50) return 'bg-amber-105 text-amber-800 border-amber-500';
    return 'bg-red-100 text-red-800 border-red-500';
  };

  const calculatedScore = (updatedFields: Partial<Lead>) => {
    if (!lead) return 10;
    const fgts = updatedFields.fgtsSaldo !== undefined ? updatedFields.fgtsSaldo : (lead.fgtsSaldo || 0);
    const income = updatedFields.familyIncome !== undefined ? updatedFields.familyIncome : (lead.familyIncome || 0);
    const bacen = updatedFields.restricaoBacen !== undefined ? updatedFields.restricaoBacen : (lead.restricaoBacen || 'Não');
    const imovel = updatedFields.possuiImovel !== undefined ? updatedFields.possuiImovel : (lead.possuiImovel || 'Não');
    const reg = updatedFields.region !== undefined ? updatedFields.region : (lead.region || '');
    const cpfVal = updatedFields.cpf !== undefined ? updatedFields.cpf : (lead.cpf || '');

    let sc = 10; // Base score
    if (fgts > 0) sc += 15;
    if (income > 8000) sc += 25;
    else if (income > 4400) sc += 20;
    else if (income > 2640) sc += 15;
    else if (income > 0) sc += 10;

    if (bacen === 'Não') sc += 25;
    if (imovel === 'Não') sc += 15; // Primeiro imóvel gets a boost
    if (reg && reg !== '') sc += 5;
    if (cpfVal && cpfVal.length >= 11) sc += 10; // Documents provided
    return Math.min(100, sc);
  };

  const updateField = (field: keyof Lead, value: any) => {
    if (!lead) return;
    if (onUpdateLeadFull) {
      const nextFields = { [field]: value };
      const nextScore = calculatedScore(nextFields);
      onUpdateLeadFull(lead.id, { ...nextFields, score: nextScore });
    }
  };

  // Core editable fields
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMainProfile, setLeadMainProfile] = useState<'Investidor' | 'Primeiro Imóvel' | 'Jovem' | 'Meia idade' | 'Idoso'>('Primeiro Imóvel');
  const [leadRegion, setLeadRegion] = useState('Sul');
  const [leadGender, setLeadGender] = useState<'Homem' | 'Mulher' | 'Outro'>('Homem');

  const [valorAto, setValorAto] = useState<number>(15000);
  const [valorAnual, setValorAnual] = useState<number>(5000);
  const [valorChaves, setValorChaves] = useState<number>(10000);
  const [tempoObra, setTempoObra] = useState<number>(36);

  const [sessionIncome, setSessionIncome] = useState<number>(0);
  const [tempIncomeInput, setTempIncomeInput] = useState<string>('');
  const [isUpdatingIncome, setIsUpdatingIncome] = useState(false);

  // --- Advanced Configurable Variables ---
  const [hasCoBuyer, setHasCoBuyer] = useState<boolean>(false);
  const [coBuyerIncome, setCoBuyerIncome] = useState<number>(2500);
  const [tempCoBuyerIncomeInput, setTempCoBuyerIncomeInput] = useState<string>('2500');
  const [hasDependents, setHasDependents] = useState<boolean>(false);
  const [hasThreeYearsCLT, setHasThreeYearsCLT] = useState<boolean>(true);
  const [fgtsBalance, setFgtsBalance] = useState<number>(12000);
  const [tempFgtsInput, setTempFgtsInput] = useState<string>('12000');
  const [ownSavings, setOwnSavings] = useState<number>(8000);
  const [tempOwnSavingsInput, setTempOwnSavingsInput] = useState<string>('8000');
  const [proponentAge, setProponentAge] = useState<number>(31);
  const [amortizationSystem, setAmortizationSystem] = useState<'SAC' | 'PRICE'>('SAC');
  const [hasCleanCredit, setHasCleanCredit] = useState<boolean>(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-cury-2');

  // Checklist de Qualificação (Financiamento & Simulação)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Inline appointment creation state
  const [newAptTitle, setNewAptTitle] = useState('');
  const [newAptDate, setNewAptDate] = useState(new Date().toISOString().substring(0, 10));
  const [newAptTime, setNewAptTime] = useState('14:00');
  const [newAptType, setNewAptType] = useState<'reuniao' | 'telefone' | 'proposta' | 'outro'>('telefone');

  const availableProperties = properties.length > 0 ? properties.map(p => ({
    id: p.id,
    title: p.title,
    developer: p.ownerName || 'Construtora Parceira',
    price: p.price,
    location: `${p.neighborhood}, ${p.city} - ${p.state}`,
    typology: `${p.bedrooms} Dorms • ${p.type}`,
    minIncomeRequired: p.price * 0.01,
    benefits: p.features || ['Excelente localização', 'Financiamento facilitado'],
    icon: '🏢',
    imageBg: 'from-blue-100 to-indigo-50/50'
  })) : STOCK_DEVELOPMENTS;

  useEffect(() => {
    if (lead?.id) {
      const saved = localStorage.getItem(`ciclocred_checklist_${lead.id}`);
      if (saved) {
        try {
          setChecklist(JSON.parse(saved));
        } catch (e) {
          setChecklist({});
        }
      } else {
        setChecklist({});
      }
    }
  }, [lead?.id]);

  const handleToggleChecklistItem = (key: string) => {
    if (!lead?.id) return;
    const newChecklist = {
      ...checklist,
      [key]: !checklist[key]
    };
    setChecklist(newChecklist);
    localStorage.setItem(`ciclocred_checklist_${lead.id}`, JSON.stringify(newChecklist));
    if (awardXP) {
      awardXP(5);
    }
  };

  const [aiPitchText, setAiPitchText] = useState<string>('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);
  const [aiPitchError, setAiPitchError] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [modalCoproductTab, setModalCoproductTab] = useState<'pitch' | 'dossier' | 'campaign'>('pitch');

  // Google Workspace direct branch states
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);
  const [isSendingGoogleEmail, setIsSendingGoogleEmail] = useState<boolean>(false);
  const [isSchedulingGoogleCalendar, setIsSchedulingGoogleCalendar] = useState<boolean>(false);
  const [googleCalendarDate, setGoogleCalendarDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [googleCalendarTime, setGoogleCalendarTime] = useState<string>('14:00');
  const [googleWorkspaceError, setGoogleWorkspaceError] = useState<string | null>(null);
  const [googleWorkspaceSuccess, setGoogleWorkspaceSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkspaceToken(getWorkspaceToken());
      setGoogleWorkspaceSuccess(null);
      setGoogleWorkspaceError(null);
    }
  }, [isOpen, lead]);

  const handleGenerateAiPitch = async (actionOverride?: 'pitch' | 'dossier' | 'campaign') => {
    if (!lead) return;
    setIsGeneratingPitch(true);
    setAiPitchError('');
    setAiPitchText('');
    setIsCopied(false);
    
    const activeProperty = availableProperties.find(p => p.id === selectedPropertyId) || availableProperties[0];
    const targetAction = actionOverride || modalCoproductTab;

    try {
      const res = await fetch('/api/ai/coproduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: targetAction,
          leadName: lead.name,
          budget: lead.value,
          income: sessionIncome || tempIncomeInput || 0,
          creci: localStorage.getItem('ciclocred_creci_number') || 'CRECI 12345-F',
          role: localStorage.getItem('ciclocred_user_role') || 'Corretor de Crédito Sênior',
          agency: localStorage.getItem('ciclocred_agency_name') || 'Assessoria Imobiliária',
          agentName: localStorage.getItem('ciclocred_user_name') || 'Consultor',
          notes: notesText,
          propertyInterest: activeProperty?.title || 'Terrenos e Portfólio Geral Cury/Minha Casa Minha Vida'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro inesperado na geração de coprodução.');
      }
      setAiPitchText(data.text);
      if (awardXP) {
        awardXP(50);
      }
    } catch (err: any) {
      console.error("AI Pitch Error", err);
      setAiPitchError(err.message || 'Falha de comunicação com o servidor de IA.');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!aiPitchText) return;
    navigator.clipboard.writeText(aiPitchText);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  useEffect(() => {
    if (lead) {
      setNotesText(lead.notes);
      setSessionIncome(lead.familyIncome || 0);
      setTempIncomeInput(lead.familyIncome ? String(lead.familyIncome) : '');
      setLeadName(lead.name || '');
      setLeadPhone(lead.phone || '');
      setLeadMainProfile(lead.mainProfile || 'Primeiro Imóvel');
      setLeadRegion(lead.region || 'Sul');
      setLeadGender(lead.gender || 'Homem');
      
      setValorAto(lead.valorAto !== undefined ? lead.valorAto : 15000);
      setValorAnual(lead.valorAnual !== undefined ? lead.valorAnual : 5000);
      setValorChaves(lead.valorChaves !== undefined ? lead.valorChaves : 10000);
      setTempoObra(lead.tempoObra !== undefined ? lead.tempoObra : 36);

      // Deduce co-buyer and dependents based on value/notes if they matched
      setHasCoBuyer(lead.value > 250000 || lead.name.length % 2 === 0);
      setHasDependents(lead.notes.toLowerCase().includes('concluí') || lead.name.length % 3 === 0);
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  // Filter logs associated ONLY to this lead
  const filteredLogs = emailLogs.filter(log => log.leadId === lead.id);

  const dynColumns = getKanbanColumns();
  const currentStatusObj = dynColumns.find(col => col.id === lead.status) || {
    id: lead.status,
    label: lead.status.charAt(0).toUpperCase() + lead.status.slice(1),
    bgClass: 'bg-zinc-100',
    labelClass: 'text-zinc-950',
    accentBorderClass: 'border-zinc-500'
  };

  const currentStatus = {
    label: currentStatusObj.label,
    bg: `${currentStatusObj.bgClass} border-2 ${currentStatusObj.accentBorderClass}`,
    text: currentStatusObj.labelClass
  };
  const daysSinceContact = getDaysSinceContact(lead.lastContactAt);
  const isOverdue = daysSinceContact !== null && daysSinceContact > 7;

  const handleNotesSave = () => {
    setIsSavingNotes(true);
    setTimeout(() => {
        onUpdateLeadNotes(lead.id, notesText);
        setIsSavingNotes(false);
    }, 400);
  };

  // Advanced predictive calculation engine
  const calculateAdvancedMetrics = (propertyPrice: number, minIncome: number) => {
    const mainIncome = sessionIncome || 0;
    const jointIncome = hasCoBuyer ? coBuyerIncome : 0;
    const grossIncome = mainIncome + jointIncome;
    const hasFGTS = hasThreeYearsCLT;

    // Pagamento máximo tolerável = 30% da renda familiar bruta
    const paymentCapacity = grossIncome * 0.30;
    const maxAllowedInstallment = paymentCapacity;

    let rate = 4.25; // Default interest rate
    let subsidy = 0;
    let bracket = '';
    let finalFinanced = 0;

    // Caso geral de enquadramento idêntico ao simulador consolidado
    if (grossIncome <= 2640) {
      bracket = 'Faixa 1 (MCMV)';
      rate = hasFGTS ? 4.0 : 4.5;
      const factor = (grossIncome - 1412) / (2640 - 1412);
      subsidy = Math.max(20000, 55000 - factor * 30000);
      if (hasDependents) subsidy += 3000;
    } else if (grossIncome <= 4400) {
      bracket = 'Faixa 2 (MCMV)';
      rate = hasFGTS ? 4.75 : 5.25;
      const factor = (grossIncome - 2640) / (4400 - 2640);
      subsidy = Math.max(10000, 25000 - factor * 15000);
      if (hasDependents) subsidy += 2000;
    } else if (grossIncome <= 8000) {
      bracket = 'Faixa 3 (MCMV)';
      rate = hasFGTS ? 6.0 : 6.5;
      subsidy = hasDependents ? 5000 : 0;
    } else {
      bracket = 'SBPE (Livre habitacional)';
      rate = 9.8;
      subsidy = 0;
    }

    const annualRate = rate;

    let maxFundingPct = 0.80;
    if (grossIncome <= 4400 && hasFGTS) {
      maxFundingPct = 0.80;
    } else if (grossIncome <= 4400 && !hasFGTS) {
      maxFundingPct = 0.70;
    }
    
    const maxFinancivel = propertyPrice * maxFundingPct;
    
    // Calcula proposta de financiamento necessária
    const initialRequiredLoan = propertyPrice - subsidy - fgtsBalance - ownSavings;
    const requiredLoan = Math.max(0, Math.min(maxFinancivel, initialRequiredLoan));
    finalFinanced = requiredLoan;

    // Limites de idade e prazo máximo Caixa
    const maxYears = Math.min(35, 80 - proponentAge);
    const maxTermMonths = maxYears * 12;

    const monthlyRate = (rate / 100) / 12;

    let initialInstallment = 0;
    let finalInstallment = 0;

    if (requiredLoan > 0) {
      if (amortizationSystem === 'PRICE') {
        const factor = (monthlyRate * Math.pow(1 + monthlyRate, maxTermMonths)) / (Math.pow(1 + monthlyRate, maxTermMonths) - 1);
        const fixedMonthly = requiredLoan * factor;
        initialInstallment = Math.min(paymentCapacity, fixedMonthly);
        finalInstallment = Math.min(paymentCapacity, fixedMonthly);
      } else {
        const priceAmortization = requiredLoan / maxTermMonths;
        initialInstallment = Math.min(paymentCapacity, priceAmortization + (requiredLoan * monthlyRate));
        finalInstallment = priceAmortization + (priceAmortization * monthlyRate);
      }

      // Se a parcela bruta simular acima da capacidade real de 30% da renda, reduzimos o valor do financiamento aprovável
      const rawFirstPay = amortizationSystem === 'PRICE'
        ? requiredLoan * ((monthlyRate * Math.pow(1 + monthlyRate, maxTermMonths)) / (Math.pow(1 + monthlyRate, maxTermMonths) - 1))
        : (requiredLoan / maxTermMonths) + (requiredLoan * monthlyRate);

      if (rawFirstPay > paymentCapacity) {
        // Reduz financiamento aprovado para caber na capacidade exata
        const allowableFinancing = paymentCapacity / ( (1 / maxTermMonths) + (monthlyRate * 0.75) );
        finalFinanced = Math.min(maxFinancivel, Math.max(allowableFinancing, 0));
        
        // Recalcula parcelas com base no financiamento refinado
        if (amortizationSystem === 'PRICE') {
          const factor = (monthlyRate * Math.pow(1 + monthlyRate, maxTermMonths)) / (Math.pow(1 + monthlyRate, maxTermMonths) - 1);
          const fixedMonthly = finalFinanced * factor;
          initialInstallment = Math.min(paymentCapacity, fixedMonthly);
          finalInstallment = Math.min(paymentCapacity, fixedMonthly);
        } else {
          const priceAmortization = finalFinanced / maxTermMonths;
          initialInstallment = Math.min(paymentCapacity, priceAmortization + (finalFinanced * monthlyRate));
          finalInstallment = priceAmortization + (priceAmortization * monthlyRate);
        }
      }
    }

    const approvedLoan = finalFinanced;
    const totalDownPaymentRequired = Math.max(0, propertyPrice - approvedLoan - subsidy);
    const rawWorkBalance = totalDownPaymentRequired - fgtsBalance - ownSavings;
    const workBalanceToInstall = Math.max(0, rawWorkBalance);

    // Obras em 36 meses padrão construtora
    const constructionInstallment = workBalanceToInstall / 36;

    // Suitability Match percentage
    let suitability = 100;

    if (grossIncome <= 0) {
      suitability = 0;
    } else {
      if (grossIncome < minIncome) {
        const diffRatio = grossIncome / minIncome;
        suitability -= (1 - diffRatio) * 55;
      }

      const budgetForWork = grossIncome * 0.25;
      if (constructionInstallment > budgetForWork) {
        const overRatio = constructionInstallment / budgetForWork;
        suitability -= Math.min(25, (overRatio - 1) * 15);
      }

      if (workBalanceToInstall > propertyPrice * 0.25) {
        suitability -= 12;
      }

      if (!hasCleanCredit) {
        suitability -= 45;
      }

      if (hasThreeYearsCLT) {
        suitability += 3;
      }
    }

    suitability = Math.max(5, Math.min(99, Math.round(suitability)));

    // Calculate score probability
    let approvalProbability = 92;
    if (!hasCleanCredit) approvalProbability -= 60;
    if (grossIncome < minIncome) approvalProbability -= 20;
    if (hasCoBuyer) approvalProbability += 8;
    if (proponentAge > 52) approvalProbability -= 7;
    approvalProbability = Math.max(12, Math.min(97, approvalProbability));

    return {
      subsidy,
      annualRate,
      maxTermMonths,
      maxAllowedInstallment,
      approvedLoan,
      totalDownPaymentRequired,
      workBalanceToInstall,
      constructionInstallment,
      suitability,
      approvalProbability,
      initialInstallment,
      finalInstallment
    };
  };

  // Find current selected property simulation
  const selectedProperty = availableProperties.find(p => p.id === selectedPropertyId) || availableProperties[0];
  const sim = calculateAdvancedMetrics(selectedProperty.price, selectedProperty.minIncomeRequired);

  // Map developments to show live fitting score
  const rankedProperties = availableProperties.map(p => {
    const metrics = calculateAdvancedMetrics(p.price, p.minIncomeRequired);
    return {
      ...p,
      metrics
    };
  }).sort((a, b) => b.metrics.suitability - a.metrics.suitability);

  const handleUpdateIncomeClick = () => {
    const parsed = parseFloat(tempIncomeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setIsUpdatingIncome(true);
      setSessionIncome(parsed);
      updateField('familyIncome', parsed);
      setTimeout(() => {
        setIsUpdatingIncome(false);
      }, 300);
      if (awardXP) awardXP(40);
    }
  };

  const handleAddNewAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptTitle.trim() || !setAppointments) return;

    const newApt: Appointment = {
      id: `appt-${Math.random().toString(36).substr(2, 9)}`,
      leadId: lead.id,
      leadName: lead.name,
      title: newAptTitle,
      date: newAptDate,
      time: newAptTime,
      type: newAptType,
      status: 'agendado',
      description: `Compromisso programado diretamente na aba de Agenda do lead ${lead.name}.`
    };

    const updated = [...appointments, newApt];
    setAppointments(updated);
    localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
    
    // Clear form and award XP
    setNewAptTitle('');
    if (awardXP) awardXP(80);
    setGoogleWorkspaceSuccess("Compromisso cadastrado no CRM!");
    setTimeout(() => setGoogleWorkspaceSuccess(null), 3000);
  };

  const handleToggleAppointmentStatus = (apptId: string) => {
    if (!setAppointments) return;
    const updated = appointments.map(apt => {
      if (apt.id === apptId) {
        const nextStatus = apt.status === 'agendado' ? 'realizado' : apt.status === 'realizado' ? 'cancelado' : 'agendado';
        return { ...apt, status: nextStatus };
      }
      return apt;
    });
    setAppointments(updated);
    localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
    if (awardXP) awardXP(30);
  };

  // Find active scheduled follow-ups for this lead
  const leadAppointments = appointments.filter(apt => apt.leadId === lead.id || apt.leadName === lead.name);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xs overflow-hidden"
      id="lead-details-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="lead-details-modal-frame"
        className="bg-white border-4 border-zinc-950 rounded-2xl w-full max-w-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden max-h-[92vh] flex flex-col text-zinc-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header containing name and current status badge */}
        <div className="p-5 border-b-4 border-zinc-950 bg-zinc-900 text-white flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono">Ficha de Qualificação e Dossiê</span>
            <h2 className="font-sans font-black text-xl text-white truncate">{lead.name}</h2>
            
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded ${currentStatus.bg} ${currentStatus.text}`}>
                {currentStatus.label}
              </span>
              <span className="text-xs text-zinc-300 font-bold font-mono">Origem: {lead.origin}</span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-0.5 rounded bg-red-100 border border-red-500 text-red-700  font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Atenção: Sem Contato há {daysSinceContact} dias</span>
                </span>
              )}
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticky Tab Selector */}
        <div className="bg-zinc-100 border-b-2 border-zinc-950 px-4 py-2.5 flex flex-wrap gap-1.5 select-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ficha_checklist')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ficha_checklist'
                ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-200'
            }`}
          >
            📋 Ficha & Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossies_fluxos')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dossies_fluxos'
                ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-200'
            }`}
          >
            🔬 Dossiês & Fluxos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'agenda'
                ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-200'
            }`}
          >
            📅 Agenda & Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'historico'
                ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-200'
            }`}
          >
            🗒️ Histórico & Notas
          </button>
        </div>

        {/* Main Unified Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-zinc-50 flex flex-col gap-6 custom-scrollbar text-zinc-900 font-sans">
          
          {/* TAB 1: FICHA & CHECKLIST */}
          {activeTab === 'ficha_checklist' && (
            <>
              {/* Header Info */}
              <div className="p-4 bg-white border-2 border-zinc-950 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-zinc-900 tracking-tight font-mono">📋 Ficha Cadastral</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-black font-mono">Totalmente integrada com blocos, fluxos e propostas.</p>
                </div>
                <div className={`px-4 py-2 border-2 border-zinc-950 rounded-xl font-mono font-black text-xs uppercase bg-white ${scoreBadgeColor()}`}>
                  🏆 Score: {lead.score || 40} pts
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* 1. PESSOAL */}
                <div className="bg-white border-4 border-zinc-950 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col min-h-[500px]">
                  <div className="bg-blue-100 border-b-4 border-zinc-950 py-2.5 text-center shrink-0">
                    <h4 className="font-black text-xs uppercase tracking-wider text-blue-950 font-mono">👤 PESSOAL</h4>
                    <p className="text-[8.5px] text-blue-900/70 font-bold uppercase tracking-widest mt-0.5">Identificação e Contato</p>
                  </div>
                  
                  <div className="flex flex-col text-[11px] font-semibold text-zinc-700 divide-y divide-zinc-200 flex-1">
                    {/* Sub-header 1 */}
                    <div className="bg-blue-50 text-blue-950 px-3 py-1.5 font-mono font-black text-[9px] uppercase tracking-wider border-b-2 border-zinc-950 flex items-center gap-1 shrink-0">
                      👤 Pessoal e Qualificação
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Nome Completo">Nome Completo</span>
                      <div className="col-span-7">
                        <input type="text" value={leadName} onChange={(e) => { setLeadName(e.target.value); updateField('name', e.target.value); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Telefone">Telefone</span>
                      <div className="col-span-7">
                        <input type="text" value={leadPhone} onChange={(e) => { setLeadPhone(e.target.value); updateField('phone', e.target.value); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="E-mail">E-mail</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.email || ''} onBlur={(e) => updateField('email', e.target.value)} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="CPF">CPF</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.cpf || ''} onBlur={(e) => updateField('cpf', e.target.value)} placeholder="000.000.000-00" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Nascimento">Nascimento</span>
                      <div className="col-span-7 text-right">
                        <input type="date" defaultValue={lead.birthDate || ''} onBlur={(e) => updateField('birthDate', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Estado Civil">Estado Civil</span>
                      <div className="col-span-7 text-right">
                        <select defaultValue={lead.maritalStatus || 'Solteiro'} onChange={(e: any) => updateField('maritalStatus', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Solteiro">Solteiro</option>
                          <option value="Casado">Casado</option>
                          <option value="Uniao estavel">União Estável</option>
                          <option value="Divorciado">Divorciado</option>
                          <option value="Viuvo">Viúvo</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Gênero">Gênero</span>
                      <div className="col-span-7 text-right">
                        <select value={leadGender} onChange={(e: any) => { setLeadGender(e.target.value); updateField('gender', e.target.value); }} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Homem">Homem</option>
                          <option value="Mulher">Mulher</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    {/* Sub-header 2 */}
                    <div className="bg-blue-50 text-blue-950 px-3 py-1.5 font-mono font-black text-[9px] uppercase tracking-wider border-y-2 border-zinc-950 flex items-center gap-1 shrink-0">
                      📍 Localização
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="CEP">CEP</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.cep || ''} onBlur={(e) => updateField('cep', e.target.value)} placeholder="00000-000" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Endereço">Endereço</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.address || ''} onBlur={(e) => updateField('address', e.target.value)} placeholder="Rua, Número" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. QUALIFICAÇÃO */}
                <div className="bg-white border-4 border-zinc-950 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col min-h-[500px]">
                  <div className="bg-amber-100 border-b-4 border-zinc-950 py-2.5 text-center shrink-0">
                    <h4 className="font-black text-xs uppercase tracking-wider text-amber-950 font-mono">🎯 QUALIFICAÇÃO</h4>
                    <p className="text-[8.5px] text-amber-900/70 font-bold uppercase tracking-widest mt-0.5">Perfil, Parâmetros & Preferências</p>
                  </div>
                  
                  <div className="flex flex-col text-[11px] font-semibold text-zinc-700 divide-y divide-zinc-200 flex-1">
                    {/* Sub-header 1 */}
                    <div className="bg-amber-50 text-amber-950 px-3 py-1.5 font-mono font-black text-[9px] uppercase tracking-wider border-b-2 border-zinc-950 flex items-center gap-1 shrink-0">
                      🎯 Qualificação Profissional
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Profissão">Profissão</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.profession || ''} onBlur={(e) => updateField('profession', e.target.value)} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Como Soube">Como Soube</span>
                      <div className="col-span-7 text-right">
                        <select defaultValue={lead.comoSoube || 'Instagram'} onChange={(e: any) => updateField('comoSoube', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Google">Google</option>
                          <option value="Indicacao">Indicação</option>
                          <option value="Corretor">Corretor</option>
                          <option value="Feira">Feira</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Dependentes">Dependentes</span>
                      <div className="col-span-7 text-right">
                        <input type="number" defaultValue={lead.dependents || 0} onBlur={(e) => updateField('dependents', e.target.value)} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Perfil Atendimento">Perfil Atend.</span>
                      <div className="col-span-7 text-right">
                        <select value={leadMainProfile} onChange={(e: any) => { setLeadMainProfile(e.target.value); updateField('mainProfile', e.target.value); }} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Primeiro Imóvel">Primeiro Imóvel</option>
                          <option value="Investidor">Investidor</option>
                          <option value="Jovem">Público Jovem</option>
                          <option value="Meia idade">Meia idade</option>
                          <option value="Idoso">Aposentado / Idoso</option>
                        </select>
                      </div>
                    </div>

                    {/* Sub-header 2 */}
                    <div className="bg-amber-50 text-amber-950 px-3 py-1.5 font-mono font-black text-[9px] uppercase tracking-wider border-y-2 border-zinc-950 flex items-center gap-1 shrink-0">
                      ⚙️ Parâmetros e Preferências
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Região Preferida">Região Pref.</span>
                      <div className="col-span-7 text-right">
                        <select value={leadRegion} onChange={(e) => { setLeadRegion(e.target.value); updateField('region', e.target.value); }} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Sul">Sul</option>
                          <option value="Leste">Leste</option>
                          <option value="Oeste">Oeste</option>
                          <option value="Norte">Norte</option>
                          <option value="Centro">Centro / ABC</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Bairro Desejado">Bairro</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.bairroEspecifico || ''} onBlur={(e) => updateField('bairroEspecifico', e.target.value)} placeholder="Ex: Cambuci" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Área M² Desejada">M² Desejado</span>
                      <div className="col-span-7 text-right">
                        <input type="number" defaultValue={lead.desiredSqm || ''} onBlur={(e) => updateField('desiredSqm', e.target.value)} placeholder="Ex: 55" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Dormitórios">Dormitórios</span>
                      <div className="col-span-7 text-right">
                        <input type="number" defaultValue={lead.bedrooms || ''} onBlur={(e) => updateField('bedrooms', e.target.value)} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Suítes">Suítes</span>
                      <div className="col-span-7 text-right">
                        <input type="number" defaultValue={lead.suites || ''} onBlur={(e) => updateField('suites', e.target.value)} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Varanda">Varanda</span>
                      <div className="col-span-7 text-right">
                        <select defaultValue={lead.balcony || 'nao'} onChange={(e: any) => updateField('balcony', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Vagas">Vagas</span>
                      <div className="col-span-7 text-right">
                        <input type="number" defaultValue={lead.parkingSpots || ''} onBlur={(e) => updateField('parkingSpots', e.target.value)} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Estação Próxima">Estação Próx.</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.nearestStation || ''} onBlur={(e) => updateField('nearestStation', e.target.value)} placeholder="Ex: Metrô" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Tipologia do Imóvel">Tipologia</span>
                      <div className="col-span-7">
                        <input type="text" defaultValue={lead.unitTypology || ''} onBlur={(e) => updateField('unitTypology', e.target.value)} placeholder="Ex: Padrão" className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Programa Habitacional">Prog. Habit.</span>
                      <div className="col-span-7 text-right">
                        <select defaultValue={lead.programaDesejado || 'Indiferente'} onChange={(e: any) => updateField('programaDesejado', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Indiferente">Indiferente</option>
                          <option value="Minha Casa Minha Vida">Minha Casa Minha Vida</option>
                          <option value="SBPE">SBPE (Tradicional)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. FINANCEIRO */}
                <div className="bg-white border-4 border-zinc-950 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col min-h-[500px]">
                  <div className="bg-emerald-100 border-b-4 border-zinc-950 py-2.5 text-center shrink-0">
                    <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950 font-mono">💵 FINANCEIRO</h4>
                    <p className="text-[8.5px] text-emerald-900/70 font-bold uppercase tracking-widest mt-0.5">Análise de Crédito & Valores</p>
                  </div>

                  <div className="flex flex-col text-[11px] font-semibold text-zinc-700 divide-y divide-zinc-200 flex-1">
                    {/* Sub-header 1 */}
                    <div className="bg-emerald-50 text-emerald-950 px-3 py-1.5 font-mono font-black text-[9px] uppercase tracking-wider border-b-2 border-zinc-950 flex items-center gap-1 shrink-0">
                      💵 Análise Financeira
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Renda Familiar Bruta/Conjunta">Renda Fam.</span>
                      <div className="col-span-7 text-right flex items-center justify-end gap-1">
                        <span className="text-zinc-500 font-bold text-xs">R$</span>
                        <input type="number" value={tempIncomeInput} onChange={(e) => setTempIncomeInput(e.target.value)} onBlur={handleUpdateIncomeClick} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Saldo FGTS Disponível">FGTS</span>
                      <div className="col-span-7 text-right flex items-center justify-end gap-1">
                        <span className="text-zinc-500 font-bold text-xs">R$</span>
                        <input type="number" defaultValue={lead.fgtsSaldo || 0} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; updateField('fgtsSaldo', v); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Restrição BACEN / Crédito">BACEN</span>
                      <div className="col-span-7 text-right">
                        <select defaultValue={lead.restricaoBacen || 'Não'} onChange={(e) => updateField('restricaoBacen', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Não">Não</option>
                          <option value="Sim">Sim (Prejudica)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Possui Imóvel Ativo">Possui Imóvel</span>
                      <div className="col-span-7 text-right">
                        <select defaultValue={lead.possuiImovel || 'Não'} onChange={(e) => updateField('possuiImovel', e.target.value)} className="font-black text-zinc-900 bg-transparent focus:outline-none p-1 border border-zinc-200 focus:border-zinc-950 rounded-md text-xs w-full text-right">
                          <option value="Não">Não (MCMV)</option>
                          <option value="Sim">Sim (SBPE)</option>
                        </select>
                      </div>
                    </div>

                    {/* Sub-header 2 */}
                    <div className="bg-emerald-50 text-emerald-950 px-3 py-1.5 font-mono font-black text-[9px] uppercase tracking-wider border-y-2 border-zinc-950 flex items-center gap-1 shrink-0">
                      📊 Condições de Crédito
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Valor do Imóvel de Interesse">Vlr Imóvel</span>
                      <div className="col-span-7 text-right flex items-center justify-end gap-1">
                        <span className="text-zinc-500 font-bold text-xs">R$</span>
                        <input type="number" defaultValue={lead.propertyValue || ''} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; updateField('propertyValue', v); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Financiamento Estimado CEF">Financ. Est.</span>
                      <div className="col-span-7 text-right flex items-center justify-end gap-1">
                        <span className="text-zinc-500 font-bold text-xs">R$</span>
                        <input type="number" defaultValue={lead.financedValue || ''} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; updateField('financedValue', v); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Valor Estimado da Parcela">Vlr Parcela</span>
                      <div className="col-span-7 text-right flex items-center justify-end gap-1">
                        <span className="text-zinc-500 font-bold text-xs">R$</span>
                        <input type="number" defaultValue={lead.installmentValue || ''} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; updateField('installmentValue', v); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>

                    <div className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 transition-colors">
                      <span className="col-span-5 text-zinc-500 uppercase font-black text-[8.5px] font-mono tracking-wider truncate" title="Entrada Total de Financiamento">Entrada</span>
                      <div className="col-span-7 text-right flex items-center justify-end gap-1">
                        <span className="text-zinc-500 font-bold text-xs">R$</span>
                        <input type="number" defaultValue={lead.downPaymentValue || ''} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; updateField('downPaymentValue', v); }} className="text-right font-black text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-100 p-1 border border-zinc-200 focus:border-zinc-950 rounded-md w-full text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA (TABELA DE SIMULAÇÃO & PROPOSTA) */}
              <div className="bg-zinc-900 text-white p-5 rounded-2xl space-y-4 border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden animate-fadeIn">
                <div className="absolute right-3 top-3 opacity-10 rotate-12 select-none pointer-events-none">
                  <Calculator className="w-20 h-20 text-white" />
                </div>

                <div className="border-b border-zinc-800 pb-2 relative z-10 flex justify-between items-center">
                  <div>
                    <span className="text-[8.5px] font-mono font-black text-emerald-400 uppercase tracking-widest block leading-none">TABELA DE SIMULAÇÃO E PROPOSTA</span>
                    <h4 className="text-xs font-black uppercase text-white tracking-tight flex items-center gap-1.5 mt-1">
                      🏡 Entrada Facilitada Construtora (Período Obras)
                    </h4>
                  </div>
                  <div className="px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase bg-emerald-500 text-zinc-950 tracking-wider">
                    Entrada Necessária: R$ {(lead.downPaymentValue || sim.totalDownPaymentRequired || 0).toLocaleString('pt-BR')}
                  </div>
                </div>

                {/* Inputs for downpayment facilitation layout */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 text-xs">
                  {/* Parcela de Ato */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase">Ato (Sinal)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500 font-bold">R$</span>
                      <input
                        type="number"
                        value={valorAto || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setValorAto(val);
                          updateField('valorAto', val);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-505 rounded-lg p-1.5 pl-6 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* 2 Parcelas Anuais */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase text-amber-400">2x Balões Anuais (Cada)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500 font-bold">R$</span>
                      <input
                        type="number"
                        value={valorAnual || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setValorAnual(val);
                          updateField('valorAnual', val);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-505 rounded-lg p-1.5 pl-6 text-xs text-white font-mono"
                      />
                    </div>
                    <span className="block text-[8px] text-zinc-500 font-mono">Total de Balões: R$ {(2 * valorAnual).toLocaleString('pt-BR')}</span>
                  </div>

                  {/* Parcela de Chaves */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase">Chaves</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500 font-bold">R$</span>
                      <input
                        type="number"
                        value={valorChaves || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setValorChaves(val);
                          updateField('valorChaves', val);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-505 rounded-lg p-1.5 pl-6 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Tempo de Obra */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase">Tempo de Obra (Meses)</label>
                    <select
                      value={tempoObra}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 36;
                        setTempoObra(val);
                        updateField('tempoObra', val);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-505 rounded-lg p-1.5 text-xs text-white font-mono cursor-pointer"
                    >
                      <option value={12}>12 meses (1 ano)</option>
                      <option value={18}>18 meses</option>
                      <option value={20}>20 meses</option>
                      <option value={24}>24 meses (2 anos)</option>
                      <option value={30}>30 meses</option>
                      <option value={36}>36 meses (3 anos)</option>
                      <option value={48}>48 meses (4 anos)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic calculation banner */}
                {(() => {
                  const requiredDownpayment = lead.downPaymentValue || sim.totalDownPaymentRequired || 0;
                  const totalFacilitadoAvulso = valorAto + (2 * valorAnual) + valorChaves;
                  const diferencaRestante = Math.max(0, requiredDownpayment - totalFacilitadoAvulso);
                  const valorMensalObra = tempoObra > 0 ? (diferencaRestante / tempoObra) : 0;

                  return (
                    <div className="relative z-10 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div>
                        <span className="block text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">Total Sinal + Balões</span>
                        <strong className="block text-xs font-sans font-black text-zinc-300 mt-1">
                          R$ {totalFacilitadoAvulso.toLocaleString('pt-BR')}
                        </strong>
                        <span className="text-[8.5px] text-zinc-500 font-mono italic">
                          (Ato + 2 Anuais + Chaves)
                        </span>
                      </div>

                      <div className="border-t md:border-t-0 md:border-l md:border-r border-zinc-800 py-1.5 md:py-0 md:px-3">
                        <span className="block text-[8px] font-mono font-black text-amber-400 uppercase leading-none">Diferença Restante</span>
                        <strong className="block text-xs font-sans font-black text-amber-300 mt-1">
                          R$ {diferencaRestante.toLocaleString('pt-BR')}
                        </strong>
                        <span className="text-[8.5px] text-zinc-500 font-mono italic">
                          (Saldo restante para obras)
                        </span>
                      </div>

                      <div className="bg-emerald-950/55 border border-emerald-800 p-2 text-center rounded-lg">
                        <span className="text-[9px] font-mono font-black text-emerald-300 uppercase block tracking-wider leading-none">
                          MENSAL OBRA ({tempoObra}X)
                        </span>
                        <strong className="block text-sm font-mono font-black text-emerald-400 mt-1">
                          R$ {Math.round(valorMensalObra).toLocaleString('pt-BR')} /mês
                        </strong>
                        <span className="text-[8px] text-zinc-400 block mt-0.5 font-sans">
                          Dividido automaticamente pelo tempo de obra
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* CHECKLIST DE QUALIFICAÇÃO */}
              <div className="bg-white border-2 border-zinc-950 rounded-xl p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center border-b-2 border-zinc-200 pb-2">
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                    📋 Checklist de Qualificação de Financiamento
                  </h3>
                  <span className="text-[9px] bg-emerald-100 border border-emerald-300 text-emerald-950 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    Dossiê Ativo
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-500 font-medium">
                  Verifique se o lead possui as condições e a papelada correta para seguir com a simulação habitacional:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seção 1: Documentação Pessoal */}
                  <div className="space-y-2 select-none">
                    <h4 className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1 flex items-center gap-1">
                      <span>🪪 Doc. Pessoal</span>
                    </h4>
                    {[
                      { key: 'doc_cnh_rg', label: 'RG ou CNH legível e atualizada' },
                      { key: 'doc_resid', label: 'Comprovante de residência (< 90 dias)' },
                      { key: 'doc_est_civil', label: 'Certidão de Nascimento/Casamento' },
                      { key: 'doc_fgts', label: 'Extrato do FGTS para abatimento' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer hover:bg-zinc-50 p-1.5 rounded transition">
                        <input type="checkbox" checked={!!checklist[item.key]} onChange={() => handleToggleChecklistItem(item.key)} className="rounded border-zinc-350 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Seção 2: Comprovação de Renda */}
                  <div className="space-y-2 select-none">
                    <h4 className="text-[10px] font-mono font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-1 flex items-center gap-1">
                      <span>💵 Comprovação de Renda</span>
                    </h4>
                    {[
                      { key: 'renda_holerites', label: '3 últimos holerites (se CLT)' },
                      { key: 'renda_ir', label: 'Declaração completa de IRPF + recibo' },
                      { key: 'renda_extratos', label: '6 meses de extrato bancário (se autônomo)' },
                      { key: 'renda_carteira', label: 'Carteira de Trabalho Digital (para CLT > 3 anos)' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer hover:bg-zinc-50 p-1.5 rounded transition">
                        <input type="checkbox" checked={!!checklist[item.key]} onChange={() => handleToggleChecklistItem(item.key)} className="rounded border-zinc-350 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                {(() => {
                  const checkedCount = Object.values(checklist).filter(Boolean).length;
                  const totalCount = 8;
                  const percent = Math.round((checkedCount / totalCount) * 100);
                  return (
                    <div className="pt-3 border-t border-zinc-150 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 font-mono">
                        <span>Status de Qualificação Documental</span>
                        <span>{percent}% Completo ({checkedCount}/{totalCount})</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden border border-zinc-300">
                        <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* TAB 2: DOSSIÊS & FLUXOS */}
          {activeTab === 'dossies_fluxos' && (
            <>
              {/* GEMINI AI DOSSIÊ */}
              <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 border-4 border-zinc-950 rounded-2xl p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] select-text">
                <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-mono font-black text-purple-950 uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-650 shrink-0" />
                      Central Coprodutora do Gemini (CRM Direct)
                    </h3>
                    <span className="text-[9px] tracking-widest font-black text-zinc-455 font-mono block">GEMINI 2.5 FLASH • CONECTOR SIDERADO CRÉDITO</span>
                  </div>
                  <div className="shrink-0 bg-purple-100 border border-purple-300 text-purple-950 font-mono font-black text-[9px] px-2 py-0.5 rounded-full select-none">
                    +120 XP REAL
                  </div>
                </div>

                {/* Sub-tab selectors */}
                <div className="flex bg-zinc-950/5 p-1 rounded-xl border border-zinc-300/60 gap-1 select-none">
                  <button type="button" onClick={() => { setModalCoproductTab('pitch'); setAiPitchText(''); }} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer ${modalCoproductTab === 'pitch' ? 'bg-purple-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-650 hover:text-zinc-950'}`}>
                    📱 Abordagem Rápida
                  </button>
                  <button type="button" onClick={() => { setModalCoproductTab('dossier'); setAiPitchText(''); }} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer ${modalCoproductTab === 'dossier' ? 'bg-purple-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-650 hover:text-zinc-950'}`}>
                    🔬 Dossiê Habitacional
                  </button>
                  <button type="button" onClick={() => { setModalCoproductTab('campaign'); setAiPitchText(''); }} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer ${modalCoproductTab === 'campaign' ? 'bg-purple-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-650 hover:text-zinc-950'}`}>
                    📅 Plano de Campanha
                  </button>
                </div>

                <div className="text-xs text-zinc-650 leading-relaxed font-sans space-y-3">
                  <p>
                    {modalCoproductTab === 'pitch' && "Gere um roteiro de abordagem e copywriting ultra persuasivo focado para WhatsApp com o Gemini."}
                    {modalCoproductTab === 'dossier' && "Gere um Dossiê Digital de Qualificação contendo scorecard de enquadramento, taxas estimativas e plano de ação Caixa."}
                    {modalCoproductTab === 'campaign' && "Crie um cronograma estratégico de engajamento de 7 dias com gatilhos persuasivos de follow-up."}
                  </p>

                  {aiPitchError && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-[10px] text-red-950 font-sans leading-relaxed border-4">
                      <strong>Falha de Integração:</strong> {aiPitchError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end pt-1 select-none">
                    <div>
                      <label className="text-[8.5px] uppercase font-black text-zinc-500 block mb-1">Selecione o Imóvel Referência</label>
                      <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="w-full bg-white border border-zinc-300 p-2 text-[10.5px] font-extrabold text-zinc-800 rounded-lg">
                        {availableProperties.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} (R$ {p.price.toLocaleString('pt-BR')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="button" disabled={isGeneratingPitch} onClick={() => handleGenerateAiPitch()} className="py-2.5 px-4 bg-purple-700 hover:bg-purple-650 disabled:bg-zinc-400 text-white rounded-lg text-[10px] font-mono font-black uppercase tracking-wider block transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer">
                      {isGeneratingPitch ? '🔮 Coprocessando IA...' : '⚡ Acionar Gemini AI'}
                    </button>
                  </div>

                  {aiPitchText && (
                    <div className="pt-3 border-t border-purple-200 space-y-2">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-[9px] uppercase font-mono font-black text-purple-900 tracking-wider">Texto de Coprodução Gerado</span>
                        <button type="button" onClick={handleCopyPitch} className="px-2.5 py-1 text-[9px] font-black uppercase bg-white hover:bg-purple-100 text-purple-950 border border-purple-300 rounded transition flex items-center gap-1 cursor-pointer">
                          {isCopied ? '✔ Copiado!' : '📋 Copiar Roteiro'}
                        </button>
                      </div>
                      <textarea readOnly value={aiPitchText} rows={8} className="w-full bg-zinc-950 text-purple-200 border-2 border-zinc-950 font-mono text-[10px] p-3 rounded-xl select-all focus:outline-none leading-relaxed" />
                    </div>
                  )}
                </div>
              </div>

              {/* INTELIGÊNCIA PREDITIVA DE CRÉDITO */}
              <div className="bg-gradient-to-br from-indigo-50/40 via-white to-zinc-50 border-2 border-zinc-950 rounded-xl p-5 space-y-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] select-none">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                  <div>
                    <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-4 h-4 text-indigo-600  shrink-0" />
                      Inteligência Preditiva de Crédito
                    </h3>
                    <span className="text-[9px] tracking-widest font-bold text-zinc-400 font-mono block mt-0.5">ESTOQUE PARCEIRO CONSTRUTORA</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      {sim.suitability}% Fit Match
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Controles Avançados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-zinc-50 p-4 border-2 border-zinc-950 rounded-xl">
                    <div className="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Coobrigado / Compositor</span>
                        <span className="text-[10px] font-extrabold text-zinc-700 font-sans">Compõe renda?</span>
                      </div>
                      <input type="checkbox" checked={hasCoBuyer} onChange={(e) => setHasCoBuyer(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    </div>

                    {hasCoBuyer && (
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Renda do Compositor</label>
                        <div className="flex items-center border border-zinc-300 rounded-lg p-1 px-2 bg-white">
                          <span className="text-[10.5px] font-bold text-zinc-450 mr-1">R$</span>
                          <input type="number" value={tempCoBuyerIncomeInput} onChange={(e) => { setTempCoBuyerIncomeInput(e.target.value); const val = parseFloat(e.target.value) || 0; setCoBuyerIncome(val); }} className="w-full text-xs font-black text-zinc-800 bg-transparent focus:outline-none" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Dependentes</span>
                        <span className="text-[10px] font-extrabold text-zinc-700 font-sans">Possui dependentes?</span>
                      </div>
                      <input type="checkbox" checked={hasDependents} onChange={(e) => setHasDependents(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Vínculo de fomento</span>
                        <span className="text-[10px] font-extrabold text-zinc-700 font-sans">CLT &gt; 3 anos (FGTS)?</span>
                      </div>
                      <input type="checkbox" checked={hasThreeYearsCLT} onChange={(e) => setHasThreeYearsCLT(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Saldo do FGTS</label>
                      <div className="flex items-center border border-zinc-300 rounded-lg p-1 px-2 bg-white">
                        <span className="text-[10.5px] font-bold text-zinc-450 mr-1">R$</span>
                        <input type="number" value={tempFgtsInput} onChange={(e) => { setTempFgtsInput(e.target.value); const val = parseFloat(e.target.value) || 0; setFgtsBalance(val); }} className="w-full text-xs font-black text-zinc-800 bg-transparent focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Idade do Proponente</label>
                      <input type="number" value={proponentAge} onChange={(e) => setProponentAge(Math.max(18, parseInt(e.target.value) || 18))} className="w-full text-xs font-black text-zinc-800 bg-white border border-zinc-300 rounded-lg p-1.5 focus:outline-none" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Amortização</label>
                      <select value={amortizationSystem} onChange={(e: any) => setAmortizationSystem(e.target.value)} className="w-full text-xs font-black text-zinc-800 bg-white border border-zinc-300 rounded-lg p-1.5 focus:outline-none">
                        <option value="SAC">SAC (Parcelas Decrescentes)</option>
                        <option value="PRICE">PRICE (Parcelas Constantes)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Histórico Bacen</span>
                        <span className="text-[10px] font-extrabold text-zinc-700 font-sans">Nome Limpo?</span>
                      </div>
                      <input type="checkbox" checked={hasCleanCredit} onChange={(e) => setHasCleanCredit(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    </div>
                  </div>

                  {/* Resultados Simulados */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1 text-center">
                      <span className="text-[8px] uppercase font-bold text-zinc-400 block">Subsídio Caixa</span>
                      <p className="text-sm font-black font-mono text-indigo-700">R$ {sim.subsidy.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1 text-center">
                      <span className="text-[8px] uppercase font-bold text-zinc-400 block">Juros Efetivos</span>
                      <p className="text-sm font-black font-mono text-zinc-700">{sim.annualRate}% a.a.</p>
                    </div>
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1 text-center">
                      <span className="text-[8px] uppercase font-bold text-zinc-400 block">Financiamento Caixa</span>
                      <p className="text-sm font-black font-mono text-emerald-700">R$ {sim.approvedLoan.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1 text-center">
                      <span className="text-[8px] uppercase font-bold text-zinc-400 block">Aprovação</span>
                      <p className={`text-sm font-black font-mono ${sim.approvalProbability >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>{sim.approvalProbability}% Prob.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOW ASSIGNMENT & SCRIPT LIBRARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FLOW ASSIGNMENT CARD */}
                <div className="bg-white border-2 border-zinc-950 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-zinc-900 tracking-tight flex items-center gap-1 font-mono">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Vincular Fluxo Operacional
                  </h4>
                  <p className="text-[10px] text-zinc-500">Insira este lead em uma esteira estratégica de timers de vendas:</p>

                  <div className="flex gap-2">
                    <select value={selectedFlowId} onChange={(e) => setSelectedFlowId(e.target.value)} className="flex-1 bg-white border-2 border-zinc-950 p-1.5 text-xs font-bold text-zinc-800 rounded-lg">
                      <option value="">Nenhum Fluxo Selecionado</option>
                      {operationalFlows.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => { updateField('fluxoId', selectedFlowId); setFlowNotification("Fluxo atualizado com sucesso!"); setTimeout(() => setFlowNotification(null), 3000); }} className="px-3 bg-zinc-900 text-white rounded-lg border-2 border-zinc-950 font-mono text-[9px] font-black uppercase">
                      Vincular
                    </button>
                  </div>
                  {flowNotification && (
                    <p className="text-[9.5px] font-bold text-emerald-600 font-sans">{flowNotification}</p>
                  )}
                </div>

                {/* SCRIPTS LIBRARY */}
                <div className="bg-white border-2 border-zinc-950 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-zinc-900 tracking-tight flex items-center gap-1 font-mono">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Biblioteca de Scripts de Venda
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Selecione o Roteiro de Abordagem</label>
                    <select value={selectedScriptId} onChange={(e) => setSelectedScriptId(e.target.value)} className="w-full bg-white border-2 border-zinc-950 p-1.5 text-xs font-bold text-zinc-800 rounded-lg">
                      {SCRIPTS_LIBRARY.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const scr = SCRIPTS_LIBRARY.find(s => s.id === selectedScriptId) || SCRIPTS_LIBRARY[0];
                    const personalizedText = getPersonalizedScript(scr.template);
                    return (
                      <div className="pt-2 space-y-2">
                        <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-mono text-zinc-600 leading-relaxed max-h-24 overflow-y-auto">
                          {personalizedText}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { navigator.clipboard.writeText(personalizedText); if (awardXP) awardXP(20); }} className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-black text-[9px] uppercase border-2 border-zinc-950 rounded-lg active:translate-y-0.5">
                            Copiar Texto
                          </button>
                          <button type="button" onClick={() => { const cl = (lead?.phone || '').replace(/\D/g, ''); window.location.href = `whatsapp://send?phone=55${cl}&text=${encodeURIComponent(personalizedText)}`; }} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-[9px] uppercase border-2 border-zinc-950 rounded-lg active:translate-y-0.5">
                            Disparar Whats
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: AGENDA & WORKSPACE */}
          {activeTab === 'agenda' && (
            <>
              {/* GOOGLE WORKSPACE RAMIFICATIONS PANEL */}
              <div className="bg-white border-4 border-zinc-950 p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4 text-left select-none">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] tracking-widest font-black text-indigo-600 font-mono uppercase flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-indigo-500" />
                      <span>Google Workspace Ativo</span>
                    </span>
                    <h4 className="text-xs font-black text-zinc-900 uppercase font-mono">Conexões Expandidas de Vendas</h4>
                  </div>
                  {workspaceToken ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8.5px] px-2 py-0.5 rounded-full font-mono font-black uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      <span>Conectado</span>
                    </span>
                  ) : (
                    <span className="bg-zinc-100 text-zinc-500 border border-zinc-300 text-[8.5px] px-2 py-0.5 rounded-full font-mono font-black uppercase">
                      Desconectado
                    </span>
                  )}
                </div>

                {!workspaceToken ? (
                  <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 p-4 rounded-xl text-center space-y-2">
                    <p className="text-[10.5px] text-zinc-500 leading-snug">
                      Conecte sua conta Google na aba <strong>"Google Workspace"</strong> na barra lateral para disparar propostas automáticas via Gmail e agendar reuniões no Google Calendar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {googleWorkspaceSuccess && (
                       <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-[10px] text-emerald-950 font-sans">
                         ✔ {googleWorkspaceSuccess}
                       </div>
                    )}
                    {googleWorkspaceError && (
                       <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-[10px] text-rose-950 font-sans">
                         ❌ {googleWorkspaceError}
                       </div>
                    )}

                    {/* Gmail Rapid Action */}
                    <div className="space-y-2 group border border-zinc-200 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                      <h5 className="text-[10px] uppercase font-black text-zinc-700 tracking-wider font-mono flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-red-500" />
                        <span>E-mail Instantâneo (Via Gmail API)</span>
                      </h5>
                      <p className="text-[9.5px] text-zinc-500">
                        Dispare a proposta comercial diretamente do seu Gmail institucional para o lead: <strong className="text-zinc-800 break-all">{lead.email || 'Não cadastrado'}</strong>.
                      </p>
                      <button
                        type="button"
                        disabled={isSendingGoogleEmail || !lead.email}
                        onClick={async () => {
                          if (!lead.email) return;
                          setIsSendingGoogleEmail(true);
                          setGoogleWorkspaceSuccess(null);
                          setGoogleWorkspaceError(null);
                          
                          const subject = `Proposta Comercial Imobiliária | ${lead.name}`;
                          const messageBody = aiPitchText || `Olá ${lead.name},\n\nTemos novidades excelentes de crédito habitacional e simulação para você.\n\nAtenciosamente,\nSua Assessoria Imobiliária`;
                          
                          const ok = await sendGmailMessage(subject, messageBody.replace(/\n/g, '<br/>'), lead.email);
                          if (ok) {
                            setGoogleWorkspaceSuccess("E-mail enviado com sucesso do seu Gmail!");
                            if (awardXP) awardXP(100);
                          } else {
                            setGoogleWorkspaceError("Erro ao despachar Gmail. Verifique o escopo de autorização do Workspace.");
                          }
                          setIsSendingGoogleEmail(false);
                        }}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 disabled:bg-zinc-200 text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider block transition"
                      >
                        {isSendingGoogleEmail ? 'Enviando e-mail...' : 'Disparar Proposta via Gmail'}
                      </button>
                    </div>

                    {/* Google Calendar Event syncing */}
                    <div className="space-y-2 group border border-zinc-200 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                      <h5 className="text-[10px] uppercase font-black text-zinc-700 tracking-wider font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>Agendar Visita (Google Calendar)</span>
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] uppercase font-bold text-zinc-400 block mb-0.5">Data</label>
                          <input
                            type="date"
                            value={googleCalendarDate}
                            onChange={(e) => setGoogleCalendarDate(e.target.value)}
                            className="w-full text-[10px] font-semibold border border-zinc-300 p-1.5 rounded bg-white text-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] uppercase font-bold text-zinc-400 block mb-0.5">Hora</label>
                          <input
                            type="time"
                            value={googleCalendarTime}
                            onChange={(e) => setGoogleCalendarTime(e.target.value)}
                            className="w-full text-[10px] font-semibold border border-zinc-300 p-1.5 rounded bg-white text-zinc-800"
                          />
                        </div>
                      </div>

                      <p className="text-[9.5px] text-zinc-500">
                        Sincronize automaticamente o evento de visita no seu celular e na agenda de compromissos do Google Workspace.
                      </p>
                      
                      <button
                        type="button"
                        disabled={isSchedulingGoogleCalendar}
                        onClick={async () => {
                          setIsSchedulingGoogleCalendar(true);
                          setGoogleWorkspaceSuccess(null);
                          setGoogleWorkspaceError(null);
                          
                          const title = `Visita Técnica & Financiamento - ${lead.name}`;
                          const description = `Reunião comercial de simulação de crédito e avaliação habitacional.\nTelefone Lead: ${lead.phone || 'Indefinido'}\nEmail: ${lead.email || 'Indefinido'}`;
                          
                          const ok = await createGoogleCalendarEvent(title, description, googleCalendarDate, googleCalendarTime, 60);
                          if (ok) {
                            setGoogleWorkspaceSuccess("Visita agendada com sucesso no Google Calendar!");
                            if (awardXP) awardXP(120);
                          } else {
                            setGoogleWorkspaceError("Falha ao incluir compromisso. Certifique-se de que a API do Calendar está liberada na autenticação.");
                          }
                          setIsSchedulingGoogleCalendar(false);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider block transition"
                      >
                        {isSchedulingGoogleCalendar ? 'Agendando...' : 'Sincronizar no Google Calendar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Potential Value Card */}
              <div className="bg-zinc-900 border-4 border-zinc-950 text-white rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none">
                <DollarSign className="w-5 h-5 text-indigo-400 mb-0.5" />
                <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider font-mono">Potencial Comercial</span>
                <h4 className="text-2xl font-mono font-black text-white">
                  {(lead.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h4>
              </div>

              {/* DYNAMIC FOLLOW-UPS TABLE */}
              <div className="bg-white border-2 border-zinc-950 rounded-xl p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                  <h4 className="text-xs font-black uppercase text-zinc-900 tracking-tight flex items-center gap-1.5 font-mono">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    Compromissos e Follow-ups ({leadAppointments.length})
                  </h4>
                  <span className="text-[9px] uppercase font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                    Tabela de Acompanhamento
                  </span>
                </div>

                {leadAppointments.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-500 font-bold">Nenhum compromisso agendado para este lead.</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Use o formulário abaixo para registrar e acompanhar o follow-up!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border-2 border-zinc-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-900 text-white font-mono uppercase text-[9px] border-b-2 border-zinc-950">
                          <th className="p-2 border-r border-zinc-950">Data / Hora</th>
                          <th className="p-2 border-r border-zinc-950">Tipo</th>
                          <th className="p-2 border-r border-zinc-950">Atividade / Titulo</th>
                          <th className="p-2 border-r border-zinc-950">Status</th>
                          <th className="p-2 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {leadAppointments.map(apt => (
                          <tr key={apt.id} className="bg-white hover:bg-zinc-50 font-sans">
                            <td className="p-2 border-r border-zinc-200 font-mono text-[10px] font-bold text-zinc-800">
                              {apt.date.split('-').reverse().join('/')} • {apt.time}
                            </td>
                            <td className="p-2 border-r border-zinc-200">
                              <span className={`inline-block font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                apt.type === 'reuniao' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                apt.type === 'telefone' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                apt.type === 'proposta' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                'bg-zinc-100 text-zinc-800 border border-zinc-300'
                              }`}>
                                {apt.type}
                              </span>
                            </td>
                            <td className="p-2 border-r border-zinc-200 font-bold text-zinc-900 truncate max-w-[150px]" title={apt.title}>
                              {apt.title}
                            </td>
                            <td className="p-2 border-r border-zinc-200">
                              <span className={`inline-block font-mono text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                apt.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' :
                                apt.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleAppointmentStatus(apt.id)}
                                className="px-2 py-1 text-[8px] font-mono font-black uppercase border border-zinc-950 rounded bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
                              >
                                Alternar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* QUICK INLINE APPOINTMENT CREATION FORM */}
                <form onSubmit={handleAddNewAppointment} className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">Agendar Novo Follow-up no CRM</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="col-span-1 sm:col-span-2 md:col-span-1 space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Descrição do Compromisso</label>
                      <input
                        type="text"
                        required
                        value={newAptTitle}
                        onChange={(e) => setNewAptTitle(e.target.value)}
                        placeholder="Ex: Retorno de Simulação Caixa"
                        className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 p-2 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-2 md:col-span-2">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Data</label>
                        <input
                          type="date"
                          value={newAptDate}
                          onChange={(e) => setNewAptDate(e.target.value)}
                          className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 p-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Hora</label>
                        <input
                          type="time"
                          value={newAptTime}
                          onChange={(e) => setNewAptTime(e.target.value)}
                          className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 p-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1 items-end">
                    <div className="w-full sm:w-1/2 space-y-1">
                      <label className="text-[8.5px] uppercase font-black text-zinc-400 block font-mono">Tipo de Ação</label>
                      <select
                        value={newAptType}
                        onChange={(e: any) => setNewAptType(e.target.value)}
                        className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 p-2 rounded-lg focus:outline-none"
                      >
                        <option value="telefone">📞 Ligação de Retorno</option>
                        <option value="reuniao">🤝 Reunião / Visita</option>
                        <option value="proposta">📄 Apresentação de Proposta</option>
                        <option value="outro">🔹 Outros / WhatsApp</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono font-black text-[9.5px] uppercase tracking-wider block transition active:translate-y-0.5 cursor-pointer"
                    >
                      Programar Compromisso
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* TAB 4: HISTÓRICO & NOTAS */}
          {activeTab === 'historico' && (
            <>
              {/* Editable Notes Frame */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pr-1 select-none">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Anotações de Acompanhamento
                  </label>
                  <button
                    type="button"
                    onClick={handleNotesSave}
                    disabled={isSavingNotes}
                    className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-indigo-600 border-2 border-zinc-950 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 transition active:translate-y-0.5"
                  >
                    {isSavingNotes ? 'Aguarde...' : '💾 Salvar Nota'}
                  </button>
                </div>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Insira detalhes sobre conversas, necessidades e próximos passos acordados com o cliente..."
                  rows={6}
                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs leading-relaxed text-zinc-900 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Interaction history timeline (Simulated + real logs) */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Linha do Tempo
                </h3>

                <div id="lead-activity-timeline" className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {/* Simulated Creation Event */}
                  <div className="flex gap-2.5 items-start text-xs rounded-xl border-2 border-zinc-950 p-3 bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-zinc-900 uppercase tracking-tight text-[11px]">Lead Cadastrado</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold">Iniciado de {lead.origin}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Automation Log integrations matching lead */}
                  {filteredLogs.length === 0 ? (
                    <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 py-4 text-center border-2 border-dashed border-zinc-200 rounded-xl">
                      <span>Nenhum e-mail despachado ainda.</span>
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <div key={log.id} className="flex gap-2.5 items-start text-xs rounded-xl border-2 border-zinc-950 p-3 bg-indigo-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Send className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-zinc-900 uppercase tracking-tight text-[11px] truncate">E-mail: {log.templateName}</h4>
                          <p className="text-[10px] text-zinc-500 truncate font-semibold">{log.subject}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{log.sentAt}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* FOOTER AÇÕES */}
        <div className="bg-zinc-100 p-3 border-t-2 border-zinc-950 flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto overflow-y-hidden">
          <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest hidden md:block shrink-0">
            Ações Rápidas
          </div>
          <div className="flex flex-nowrap items-center gap-[4px] w-auto shrink-0 pb-1">
            <button onClick={() => handleWhatsAppAction(lead, undefined, () => onUpdateLeadFull?.(lead.id, { lastInteractionAt: new Date().toISOString() }))} title="WhatsApp Inteligente" className="p-2 px-3 bg-white hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <MessageCircle className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Whats</span>
            </button>
            <button onClick={() => window.open(`tel:${lead.phone.replace(/\D/g, '')}`)} title="Ligar" className="p-2 px-3 bg-white hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <Phone className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Ligar</span>
            </button>
            <button onClick={() => { if (onNavigateToFollowUp) { onNavigateToFollowUp(lead); } else if (onOpenEditModal) { onOpenEditModal(lead); } onClose(); }} title="Follow-Up" className="p-2 px-3 bg-white hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <Bell className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">F-UP</span>
            </button>
            <button onClick={() => { onOpenRuleEngine && onOpenRuleEngine(lead); onClose(); }} title="Automação AI / Regras" className="p-2 px-3 bg-white hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <Bot className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Auto</span>
            </button>
            <button onClick={() => { onUpdateLeadStatus(lead.id, 'etapas', 'funil'); onClose(); }} title="Mover Funil" className="p-2 px-3 bg-white hover:bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <ChevronDown className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Funil</span>
            </button>
            <button onClick={() => {
                if (window.confirm("Certeza que deseja excluir este lead?")) {
                  onDeleteLead && onDeleteLead(lead.id);
                  onClose();
                }
              }} title="Excluir" className="p-2 px-3 bg-white hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <Trash2 className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Excluir</span>
            </button>
            <button onClick={() => { onOpenAIAssistant && onOpenAIAssistant(lead); onClose(); }} title="Assistente AI" className="p-2 px-3 bg-white hover:bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(24,24,27,1)] whitespace-nowrap cursor-pointer">
              <Sparkles className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Assist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
