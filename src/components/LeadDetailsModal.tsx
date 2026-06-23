/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, EmailLog } from '../types';
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
  Trash2
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
    benefits: ['Fácil acesso ao metrô', 'Documentação Grátis Cury', 'Subsídio MCMV ativo'],
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
  onNavigateToFollowUp
}: LeadDetailsModalProps) {
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState<'dossier' | 'ficha'>('dossier');

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
    
    const activeProperty = STOCK_DEVELOPMENTS.find(p => p.id === selectedPropertyId) || STOCK_DEVELOPMENTS[0];
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

    // 7. Calculate Suitability Match percentage
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
  const selectedProperty = STOCK_DEVELOPMENTS.find(p => p.id === selectedPropertyId) || STOCK_DEVELOPMENTS[1];
  const sim = calculateAdvancedMetrics(selectedProperty.price, selectedProperty.minIncomeRequired);

  // Map developments to show live fitting score
  const rankedProperties = STOCK_DEVELOPMENTS.map(p => {
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
      setTimeout(() => {
        setSessionIncome(parsed);
        if (onUpdateLeadFamilyIncome) {
          onUpdateLeadFamilyIncome(lead.id, parsed);
        }
        setIsUpdatingIncome(false);
      }, 400);
    }
  };

  const handleUpdateCoBuyerIncome = () => {
    const parsed = parseFloat(tempCoBuyerIncomeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setCoBuyerIncome(parsed);
    }
  };

  const handleUpdateFgts = () => {
    const parsed = parseFloat(tempFgtsInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setFgtsBalance(parsed);
    }
  };

  const handleUpdateOwnSavings = () => {
    const parsed = parseFloat(tempOwnSavingsInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setOwnSavings(parsed);
    }
  };

  // Auto copy simulation dossier text into NOTES
  const handleApplySimulationToNotes = () => {
    const mainIncomeStr = (sessionIncome || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const jointIncomeStr = (hasCoBuyer ? coBuyerIncome : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const subsidyStr = sim.subsidy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const loanStr = sim.approvedLoan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const firstInstallmentStr = sim.initialInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const workInstallmentStr = sim.constructionInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Calculate 5-rules parameters for dossier text
    const totalIncome = sessionIncome + (hasCoBuyer ? coBuyerIncome : 0);
    const maxPermitidoParcela = totalIncome * 0.3;
    const isMCMV = selectedProperty.price <= 275000;
    const rule1Passed = !isMCMV || selectedProperty.price <= 275000;
    const rule2Passed = sim.initialInstallment <= maxPermitidoParcela;
    const totalEntrada = fgtsBalance + ownSavings;
    const rule3Passed = totalEntrada >= (selectedProperty.price * 0.2);
    const rule4Passed = sim.approvalProbability >= 50;
    const rule5Passed = hasCleanCredit;

    const rulesStatus = `
📋 SCORECARD TÉCNICO DE CRÉDITO (5 REGRAS DO SISTEMA):
1. Regra de Teto (Enquadramento): ${rule1Passed ? '✅ Aprovável' : '❌ Falha: Excede limite MCMV R$ 275k'}
2. Comprometimento de Renda (<30%): ${rule2Passed ? '✅ Aprovável' : '❌ Excedido (Parc: ' + firstInstallmentStr + ' / Limite: ' + maxPermitidoParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + ')'}
3. Cota Mínima Recursos Próprios (20% LTV): ${rule3Passed ? '✅ Aprovável' : '❌ Baixo (Entrada: ' + totalEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + ' / Exigido: ' + (selectedProperty.price * 0.2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + ')'}
4. Coobrigado/Lastro Cadastral Caixa: ${rule4Passed ? '✅ Viável' : '⚠️ Alto Risco'}
5. Restrição Cadastral (BACEN/Serasa): ${rule5Passed ? '✅ CPF Limpo' : '❌ Bloqueio Cadastral Ativo'}`;

    const dossierText = `🤖 [DOSSIÊ PREDITIVO DE CRÉDITO]
Ficha de crédito analisada via motor preditivo:
• Produto Selecionado: ${selectedProperty.title}
• Renda Familiar Total: ${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
• Subsídio Estimado Caixa: ${subsidyStr}
• Crédito Habitacional Pré-Aprovado (${amortizationSystem}): ${loanStr} (Taxa: ${sim.annualRate}% a.a.)
• Encargo Habitacional Inicial: ${firstInstallmentStr}/mês (Termo: ${sim.maxTermMonths} meses)
• Fluxo Período Obras Facilitado: 36x fixas de ${workInstallmentStr}/mês
• Probabilidade de Aprovação Instantânea: ${sim.approvalProbability}%
• Fit Score de Qualificação: ${sim.suitability}% Match
${rulesStatus}

Gerado inteligentemente pelo Sistema em ${new Date().toLocaleDateString('pt-BR')}.`;

    setNotesText(prev => prev ? `${prev}\n\n${dossierText}` : dossierText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 overflow-y-auto backdrop-blur-xs select-none">
      <div 
        id="lead-details-modal-frame"
        className="bg-white border-4 border-zinc-950 rounded-2xl w-full max-w-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden  max-h-[92vh] flex flex-col text-zinc-800"
      >
        {/* Header containing name and current status badge */}
        <div className="p-5 border-b-4 border-zinc-950 bg-zinc-900 text-white flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono">Checklist & Roteiros do Lead</span>
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

        {/* Navigation Tabs for Modal Section */}
        <div className="flex bg-zinc-100 border-b-4 border-zinc-950 p-1.5 gap-1.5 shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveModalSection('dossier')}
            className={`flex-1 py-2.5 text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 rounded-xl cursor-pointer ${
              activeModalSection === 'dossier'
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'text-zinc-650 hover:text-zinc-950 bg-white border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            📋 Checklist & Roteiros IA
          </button>
          <button
            type="button"
            onClick={() => setActiveModalSection('ficha')}
            className={`flex-1 py-2.5 text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-2 rounded-xl cursor-pointer ${
              activeModalSection === 'ficha'
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'text-zinc-650 hover:text-zinc-950 bg-white border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            👤 Ficha Cadastral do Lead
          </button>
        </div>

        {/* Modular Content split in two columns */}
        <div className={`p-6 overflow-y-auto flex-1 bg-white ${activeModalSection === 'ficha' ? 'hidden' : 'grid grid-cols-1 md:grid-cols-12 gap-6'}`}>
          {/* LEFT PANEL: Core details and Notes editor (7 Columns) */}
          <div className="md:col-span-7 space-y-6">

             {/* CHECKLIST DE QUALIFICAÇÃO DE FINANCIAMENTO & ANÁLISE FACILITADA */}
             <div className="bg-zinc-50 border-2 border-zinc-950 rounded-xl p-5 space-y-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex justify-between items-center border-b-2 border-zinc-200 pb-2">
                 <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                   📋 Checklist de Qualificação de Financiamento
                 </h3>
                 <span className="text-[9px] bg-emerald-100 border border-emerald-300 text-emerald-950 px-2 py-0.5 rounded font-mono font-bold uppercase">
                   Dossiê Digital
                 </span>
               </div>
               
               <p className="text-[11px] text-zinc-500 font-medium">
                 Verifique se o lead possui as condições e a papelada correta para seguir com a simulação habitacional:
               </p>

               {/* Checklist Sections */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 
                 {/* Seção 1: Documentação Pessoal */}
                 <div className="space-y-2 select-none">
                   <h4 className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1 flex items-center gap-1">
                     <span>🪪 Doc. Pessoal</span>
                   </h4>
                   <div className="space-y-1.5">
                     {[
                       { key: 'doc_id', label: 'Documento ID (RG / CNH)' },
                       { key: 'doc_res', label: 'Comprovante Residência' },
                       { key: 'doc_civ', label: 'Certidão Nascimento/Casamento' }
                     ].map(item => (
                       <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                         <input 
                           type="checkbox"
                           checked={!!checklist[item.key]}
                           onChange={() => handleToggleChecklistItem(item.key)}
                           className="w-4 h-4 rounded border-2 border-zinc-950 text-indigo-600 focus:ring-0 accent-indigo-600 cursor-pointer"
                         />
                         <span>{item.label}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Seção 2: Comprovação de Renda */}
                 <div className="space-y-2 select-none">
                   <h4 className="text-[10px] font-mono font-black text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-1 flex items-center gap-1">
                     <span>💵 Comprov. Renda</span>
                   </h4>
                   <div className="space-y-1.5">
                     {[
                       { key: 'ren_hol', label: '3 últimos holerites/extratos' },
                       { key: 'ren_irpf', label: 'Declaração IRPF + Recibo' },
                       { key: 'ren_ctps', label: 'Carteira de Trabalho (CTPS)' }
                     ].map(item => (
                       <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                         <input 
                           type="checkbox"
                           checked={!!checklist[item.key]}
                           onChange={() => handleToggleChecklistItem(item.key)}
                           className="w-4 h-4 rounded border-2 border-zinc-950 text-indigo-600 focus:ring-0 accent-indigo-600 cursor-pointer"
                         />
                         <span>{item.label}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Seção 3: Análise de Crédito */}
                 <div className="space-y-2 select-none">
                   <h4 className="text-[10px] font-mono font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-1 flex items-center gap-1">
                     <span>🛡️ Score & Crédito</span>
                   </h4>
                   <div className="space-y-1.5">
                     {[
                       { key: 'cre_serasa', label: 'Consulta Serasa (Score 500+)' },
                       { key: 'cre_limpo', label: 'Nome Limpo (Sem Restrições)' },
                       { key: 'cre_fgts', label: 'Três Anos CLT ativos (FGTS)' }
                     ].map(item => (
                       <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                         <input 
                           type="checkbox"
                           checked={!!checklist[item.key]}
                           onChange={() => handleToggleChecklistItem(item.key)}
                           className="w-4 h-4 rounded border-2 border-zinc-950 text-indigo-600 focus:ring-0 accent-indigo-600 cursor-pointer"
                         />
                         <span>{item.label}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 {/* Seção 4: Requisitos MCMV */}
                 <div className="space-y-2 select-none">
                   <h4 className="text-[10px] font-mono font-black text-purple-600 uppercase tracking-widest border-b border-purple-100 pb-1 flex items-center gap-1">
                     <span>🏡 Requisitos MCMV</span>
                   </h4>
                   <div className="space-y-1.5">
                     {[
                       { key: 'req_unico', label: 'Sem outro imóvel ativo' },
                       { key: 'req_resid', label: 'Reside ou trabalha na região' },
                       { key: 'req_dep', label: 'Possui dependente (Subsídio+)' }
                     ].map(item => (
                       <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                         <input 
                           type="checkbox"
                           checked={!!checklist[item.key]}
                           onChange={() => handleToggleChecklistItem(item.key)}
                           className="w-4 h-4 rounded border-2 border-zinc-950 text-indigo-600 focus:ring-0 accent-indigo-600 cursor-pointer"
                         />
                         <span>{item.label}</span>
                       </label>
                     ))}
                   </div>
                 </div>

               </div>

               {/* Progresso de Qualificação */}
               {(() => {
                 const totalItems = 12;
                 const checkedCount = Object.keys(checklist).filter(k => checklist[k]).length;
                 const progressPercent = Math.min((checkedCount / totalItems) * 100, 100);
                 const barColor = progressPercent < 40 ? 'bg-red-500' : progressPercent < 80 ? 'bg-amber-400' : 'bg-emerald-500';

                 return (
                   <div className="bg-zinc-100 border-2 border-zinc-950 rounded-xl p-3 flex flex-col gap-2 mt-2 font-mono">
                     <div className="flex justify-between items-center text-xs font-bold font-mono">
                       <span className="text-[10px] text-zinc-500">Progresso do Dossiê:</span>
                       <span className="text-zinc-900">{checkedCount}/{totalItems} ({Math.round(progressPercent)}%)</span>
                     </div>
                     <div className="w-full bg-zinc-200 border border-zinc-950 h-2.5 rounded-full overflow-hidden p-0.5">
                       <div className={`${barColor} h-full rounded-full transition-all duration-300`} style={{ width: `${progressPercent}%` }}></div>
                     </div>
                     {checkedCount === totalItems && (
                       <span className="text-[10px] font-mono font-black text-emerald-700 flex items-center gap-1 uppercase tracking-tight mt-0.5 ">
                         <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                         <span>Excelente! Dossiê 100% completo e qualificado para proposta Caixa.</span>
                       </span>
                     )}
                   </div>
                 );
               })()}
             </div>

            {/* AI EXPANDED PREDICTIVE STOCK SUITE */}
            <div className="bg-gradient-to-br from-indigo-50/40 via-white to-zinc-50 border-2 border-zinc-950 rounded-xl p-5 space-y-5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] select-none">
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                <div>
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4 h-4 text-indigo-600  shrink-0" />
                    Inteligência Preditiva de Crédito
                  </h3>
                  <span className="text-[9px] tracking-widest font-bold text-zinc-400 font-mono block mt-0.5">ESTOQUE PARCEIRO CONSTRUTORA CURY</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    {sim.suitability}% Fit Match
                  </span>
                </div>
              </div>

              {/* Dynamic state if income is configured or not */}
              {sessionIncome <= 0 ? (
                <div className="space-y-3.5 py-1">
                  <p className="text-xs text-zinc-500 font-medium">
                    Nenhuma renda familiar autodeclarada identificada para este lead. Insira a renda mensal para simular e identificar o produto e subsídio Caixa MCMV ideais:
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 font-mono">R$</span>
                      <input 
                        type="number"
                        placeholder="Renda familiar ex: 4500"
                        value={tempIncomeInput}
                        onChange={(e) => setTempIncomeInput(e.target.value)}
                        className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 pl-9 text-xs font-mono font-black text-zinc-900 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleUpdateIncomeClick}
                      disabled={isUpdatingIncome}
                      className="whitespace-nowrap px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-zinc-950 font-black rounded-xl text-xs uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition pointer-events-auto"
                    >
                      {isUpdatingIncome ? 'Analisando...' : '🔍 Analisar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4.5 ">
                  
                  {/* Phase A: Multi-layered Configurable Predictor parameters */}
                  <div className="bg-zinc-950 text-white rounded-xl p-3 border-2 border-zinc-950 text-xs font-mono select-text">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                      <span className="text-[10px] font-black text-indigo-400 font-sans">1. CONFIGURAÇÃO DE PARÂMETROS DE CRÉDITO</span>
                      <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Caixa MCMV v3.5</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {/* Proponente Renda */}
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-sans block font-black">Renda Proponente Principal</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input 
                            type="number"
                            value={tempIncomeInput}
                            onChange={(e) => setTempIncomeInput(e.target.value)}
                            onBlur={handleUpdateIncomeClick}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1 text-xs font-bold font-mono text-center outline-none focus:border-indigo-400 bg-white"
                          />
                        </div>
                      </div>

                      {/* Co-Buyer Composição Toggle & Input */}
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-sans block font-black">Adicionar Compositor / Co-adquirente</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input 
                            type="checkbox"
                            checked={hasCoBuyer}
                            onChange={(e) => setHasCoBuyer(e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                          />
                          {hasCoBuyer ? (
                            <input 
                              type="number"
                              value={tempCoBuyerIncomeInput}
                              onChange={(e) => setTempCoBuyerIncomeInput(e.target.value)}
                              onBlur={handleUpdateCoBuyerIncome}
                              placeholder="Familiar extra"
                              className="w-20 bg-zinc-900 border border-zinc-700 text-white rounded px-1.5 py-0.5 text-xs font-bold text-center outline-none bg-white"
                            />
                          ) : (
                            <span className="text-[9px] text-zinc-500 font-sans font-bold">Sem coobrigado</span>
                          )}
                        </div>
                      </div>

                      {/* Depentents & CLT Duration */}
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-sans block font-black">Propriedades do Proponente</span>
                        <div className="flex flex-col gap-1 mt-1 font-sans">
                          <label className="flex items-center gap-1.5 text-zinc-300 text-[10px] font-bold cursor-pointer hover:text-white">
                            <input 
                              type="checkbox" 
                              checked={hasDependents} 
                              onChange={(e) => setHasDependents(e.target.checked)}
                              className="rounded border-zinc-700 w-3.5 h-3.5 text-indigo-600"
                            />
                            <span>Possui Dependentes (+Subsídio)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-zinc-300 text-[10px] font-bold cursor-pointer hover:text-white">
                            <input 
                              type="checkbox" 
                              checked={hasThreeYearsCLT} 
                              onChange={(e) => setHasThreeYearsCLT(e.target.checked)}
                              className="rounded border-zinc-700 w-3.5 h-3.5 text-indigo-600"
                            />
                            <span>Tempo FGTS &gt; 3 anos (-Juros)</span>
                          </label>
                        </div>
                      </div>

                      {/* Score Serasa & Amortization System */}
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-sans block font-black">Validação Cadastral & Opção</span>
                        <div className="flex flex-col gap-1 mt-1 font-sans">
                          <label className="flex items-center gap-1.5 text-zinc-300 text-[10px] font-bold cursor-pointer hover:text-white">
                            <input 
                              type="checkbox" 
                              checked={hasCleanCredit} 
                              onChange={(e) => setHasCleanCredit(e.target.checked)}
                              className="rounded border-zinc-700 w-3.5 h-3.5 text-indigo-600"
                            />
                            <span className="truncate">Sem restrições CADIN/Serasa</span>
                          </label>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-bold mt-0.5">
                            <span className="shrink-0">Tabela de Amort.:</span>
                            <select 
                              value={amortizationSystem}
                              onChange={(e) => setAmortizationSystem(e.target.value as 'SAC' | 'PRICE')}
                              className="bg-zinc-800 border border-zinc-700 text-white rounded text-[10px] px-1 py-0.5 font-bold outline-none cursor-pointer"
                            >
                              <option value="SAC">SAC (Decrescente)</option>
                              <option value="PRICE">PRICE (Constante)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Assets: FGTS slider and Personal Savings input */}
                      <div className="col-span-2 pt-2 border-t border-zinc-800/60 grid grid-cols-2 gap-3 mt-1 text-[11px]">
                        <div>
                          <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-zinc-400 font-sans">
                            <span>Saldo FGTS Utilizável:</span>
                            <span className="text-emerald-400 font-mono font-bold">R$ {fgtsBalance.toLocaleString()}</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="80000"
                            step="2000"
                            value={fgtsBalance}
                            onChange={(e) => {
                              setFgtsBalance(parseInt(e.target.value));
                              setTempFgtsInput(e.target.value);
                            }}
                            className="w-full accent-indigo-500 mt-1 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-zinc-400 font-sans">
                            <span>Recurs. Próprios / Sinal:</span>
                            <span className="text-indigo-300 font-mono font-bold">R$ {ownSavings.toLocaleString()}</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="60000"
                            step="2000"
                            value={ownSavings}
                            onChange={(e) => {
                              setOwnSavings(parseInt(e.target.value));
                              setTempOwnSavingsInput(e.target.value);
                            }}
                            className="w-full accent-indigo-500 mt-1 cursor-pointer"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Phase B: Property Stock Fitting Matrix (Dynamic Portfolio Match Selection) */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-black uppercase text-zinc-500 font-mono block">
                      2. MATRIZ DE DESTAQUES CURY EM PORTFÓLIO (ORDENAÇÃO POR COMPATIBILIDADE)
                    </span>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-[175px] overflow-y-auto pr-1">
                      {rankedProperties.map((prop) => {
                        const isSelected = selectedPropertyId === prop.id;
                        return (
                          <div
                            key={prop.id}
                            onClick={() => setSelectedPropertyId(prop.id)}
                            className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'bg-indigo-50 border-zinc-950 translate-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                                : 'bg-white border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl bg-zinc-50 border border-zinc-100 p-1 rounded-lg shrink-0">{prop.icon}</span>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-[11px] text-zinc-900 truncate leading-tight uppercase font-sans">{prop.title}</h4>
                                <p className="text-[9.5px] text-zinc-400 leading-tight truncate">{prop.location} • R$ {prop.price.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-2">
                              <div className="text-right shrink-0">
                                <span className={`text-[9.5px] font-black font-mono px-2 py-0.5 rounded-full ${
                                  prop.metrics.suitability > 90 ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' : 
                                  prop.metrics.suitability >= 70 ? 'bg-amber-100 text-amber-800 border border-amber-250' : 
                                  'bg-red-100 text-red-800 border border-rose-250'
                                }`}>
                                  {prop.metrics.suitability}% Match
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Phase C: Selected Target Financial Ledger & Sugerido Obra Flux */}
                  <div className="bg-white border-4 border-zinc-950 rounded-2xl p-4.5 space-y-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] select-text ">
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-2">
                      <div>
                        <span className="text-[8.5px] uppercase font-bold text-indigo-700 tracking-wider font-mono">Dossiê Financeiro Ativo:</span>
                        <h4 className="font-black text-xs text-zinc-900 uppercase font-sans leading-tight mt-0.5">{selectedProperty.title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-400 block font-mono">Preço Habitacional</span>
                        <span className="text-xs font-black font-mono text-zinc-900">{selectedProperty.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-mono">
                      <div className="flex justify-between pb-1 border-b border-zinc-100">
                        <span className="text-zinc-500">Valor do Imóvel:</span>
                        <span className="text-zinc-950 font-black">{selectedProperty.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                      </div>
                      
                      <div className="flex justify-between pb-1 border-b border-zinc-100">
                        <span className="text-zinc-500">Subsídio Caixa MCMV:</span>
                        <span className="text-emerald-600 font-extrabold">
                          {sim.subsidy > 0 ? `-${sim.subsidy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}` : 'R$ 0,00'}
                        </span>
                      </div>

                      <div className="flex justify-between pb-1 border-b border-zinc-100">
                        <span className="text-zinc-500">Financiamento Caixa ({amortizationSystem}):</span>
                        <span className="text-zinc-950 font-black">-{sim.approvedLoan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                      </div>

                      <div className="flex justify-between pb-1Doc border-b border-zinc-100">
                        <span className="text-zinc-500">Taxa de Juros Caixa:</span>
                        <span className="text-indigo-600 font-black">{sim.annualRate.toFixed(2)}% a.a.</span>
                      </div>

                      <div className="flex justify-between pb-1 border-b border-zinc-100">
                        <span className="text-zinc-500">Recurso Próprio (FGTS + Sinal):</span>
                        <span className="text-zinc-950 font-semibold">R$ {(fgtsBalance + ownSavings).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>

                      <div className="flex justify-between pb-1 border-b border-zinc-150 bg-amber-50 px-1 font-bold">
                        <span className="text-amber-900">Entrada Pendente Obras:</span>
                        <span className="text-amber-700 font-extrabold">
                          {(Math.max(0, selectedProperty.price - sim.approvedLoan - sim.subsidy - fgtsBalance - ownSavings)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Caixa Credit scoring probability bar */}
                    <div className="pt-2.5 border-t border-zinc-100">
                      <div className="flex justify-between items-center text-[10px] mb-1 font-sans">
                        <span className="font-extrabold text-zinc-650 uppercase font-mono">Pró-Análise: Probabilidade de Crédito Caixa</span>
                        <span className={`font-mono font-black ${
                          sim.approvalProbability > 85 ? 'text-emerald-600' :
                          sim.approvalProbability >= 50 ? 'text-amber-600' :
                          'text-red-650'
                        }`}>{sim.approvalProbability}% (Score {hasCleanCredit ? 'Filtro Ok' : 'Restrito'})</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            sim.approvalProbability > 85 ? 'bg-emerald-500' :
                            sim.approvalProbability >= 50 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${sim.approvalProbability}%` }}
                        />
                      </div>
                    </div>

                    {/* 5-Rule Credit Checklist */}
                    {(() => {
                      const totalIncome = sessionIncome + (hasCoBuyer ? coBuyerIncome : 0);
                      const maxPermitidoParcela = totalIncome * 0.3;
                      const isMCMV = selectedProperty.price <= 275000;
                      const rule1Passed = !isMCMV || selectedProperty.price <= 275000;
                      const rule2Passed = sim.initialInstallment <= maxPermitidoParcela;
                      const totalEntrada = fgtsBalance + ownSavings;
                      const rule3Passed = totalEntrada >= (selectedProperty.price * 0.2);
                      const rule4Passed = sim.approvalProbability >= 50;
                      const rule5Passed = hasCleanCredit;
                      const allRulesPassed = rule1Passed && rule2Passed && rule3Passed && rule4Passed && rule5Passed;

                      return (
                        <div className="mt-4 border-2 border-zinc-950 rounded-xl bg-zinc-50 p-3.5 space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-1.5">
                            <span className="text-[10px] font-mono font-black text-zinc-900 uppercase">
                              📋 Diagnóstico Técnico de Crédito (5 Regras Gerais)
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border font-mono ${
                              allRulesPassed
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {allRulesPassed ? 'Ficha Altamente Qualificada ✅' : 'Verificar Inconsistências de Margem ⚠️'}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            {/* Rule 1 */}
                            <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-zinc-200/40 leading-normal">
                              <div className="min-w-0 flex-1">
                                <span className="block font-sans font-extrabold text-[10.5px] uppercase text-zinc-950">
                                  Regra 1: Teto Regulatório (Faixa Programa)
                                </span>
                                <span className="text-[9.5px] text-zinc-500 block font-sans">
                                  {isMCMV 
                                    ? `Empreendimento MCMV sob teto de R$ 275.000` 
                                    : `Modalidade SBPE sem limite superior de teto`}
                                </span>
                              </div>
                              <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                                rule1Passed 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-850 border border-rose-300'
                              }`}>
                                {rule1Passed ? 'Aprovado ✓' : 'Excedido ✖'}
                              </span>
                            </div>

                            {/* Rule 2 */}
                            <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-zinc-200/40 leading-normal">
                              <div className="min-w-0 flex-1">
                                <span className="block font-sans font-extrabold text-[10.5px] uppercase text-zinc-950">
                                  Regra 2: Comprometimento Máximo de Renda (30% Limite)
                                </span>
                                <span className="text-[9.5px] text-zinc-500 block font-sans">
                                  Encargo: {sim.initialInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} | Margem Permitida: {maxPermitidoParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                                rule2Passed 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {rule2Passed ? 'Aprovado ✓' : `Excedido (${((sim.initialInstallment / totalIncome) * 100).toFixed(0)}%) ✖`}
                              </span>
                            </div>

                            {/* Rule 3 */}
                            <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-zinc-200/40 leading-normal">
                              <div className="min-w-0 flex-1">
                                <span className="block font-sans font-extrabold text-[10.5px] uppercase text-zinc-950">
                                  Regra 3: Cota Mínima de Entrada Mínima (20% LTV)
                                </span>
                                <span className="text-[9.5px] text-zinc-500 block font-sans">
                                  Sinal + FGTS: {totalEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} ({(((totalEntrada) / selectedProperty.price) * 100).toFixed(1)}%) | Exigido: {(selectedProperty.price * 0.2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                                rule3Passed 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-350' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-350'
                              }`}>
                                {rule3Passed ? 'Garantido ✓' : 'Sinal Baixo ✖'}
                              </span>
                            </div>

                            {/* Rule 4 */}
                            <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-zinc-200/40 leading-normal">
                              <div className="min-w-0 flex-1">
                                <span className="block font-sans font-extrabold text-[10.5px] uppercase text-zinc-950">
                                  Regra 4: Probabilidade Regulatória do Financiamento
                                </span>
                                <span className="text-[9.5px] text-zinc-500 block font-sans">
                                  Motor Preditivo Caixa indica probabilidade de aprovação de {sim.approvalProbability}%
                                </span>
                              </div>
                              <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                                rule4Passed 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {rule4Passed ? 'Viável ✓' : 'Risco Alto ✖'}
                              </span>
                            </div>

                            {/* Rule 5 */}
                            <div className="flex items-start justify-between gap-2.5 leading-normal">
                              <div className="min-w-0 flex-1">
                                <span className="block font-sans font-extrabold text-[10.5px] uppercase text-zinc-950">
                                  Regra 5: CPF Desimpedido (Restrições CADIN/Bacen)
                                </span>
                                <span className="text-[9.5px] text-zinc-500 block font-sans">
                                  Filtros Serasa/Bacen sem apontamentos ativos
                                </span>
                              </div>
                              <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                                rule5Passed 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {rule5Passed ? 'Sem Restrição ✓' : 'Restrito ✖'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SEPARATED PAYMENTS ANALYSIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-200">
                      
                      {/* 1. BANK FINANCING ITEM */}
                      <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black text-indigo-900 block uppercase font-mono">🏦 1. Parcela do Financiamento Bancário (Pós-Obra)</span>
                          <span className="text-[9px] text-indigo-800 block mt-0.5 leading-tight">Garantia sob a menor faixa MCMV / SBPE simulada:</span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between items-center bg-white border border-indigo-100 rounded px-1.5 py-1">
                            <span className="text-[9px] font-bold text-zinc-650 font-sans font-medium">Primeira Parcela:</span>
                            <span className="text-xs font-black text-indigo-950 font-mono">
                              {sim.initialInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/mês
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-white border border-indigo-100 rounded px-1.5 py-1">
                            <span className="text-[9px] font-bold text-zinc-650 font-sans font-medium">Última Parcela (Estimada):</span>
                            <span className="text-xs font-black text-indigo-950 font-mono">
                              {sim.finalInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/mês
                            </span>
                          </div>
                          <div className="flex justify-between text-[8px] text-zinc-400 font-mono">
                            <span>PRAZO: {sim.maxTermMonths} meses</span>
                            <span>SISTEMA: {amortizationSystem}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. FACILITATED DOWNPAYMENT ITEM */}
                      <div className="bg-emerald-50/75 p-3 rounded-xl border border-emerald-300 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black text-emerald-950 block uppercase font-mono">🧱 2. Parcela da Entrada Facilitada (Durante a Obra)</span>
                          <span className="text-[9px] text-emerald-800 block mt-0.5 leading-tight">Saldo residual parcelado no período de obras:</span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between items-center bg-white border border-emerald-100 rounded px-1.5 py-1 flex-1">
                            <span className="text-[9px] font-bold text-zinc-650 font-sans font-medium">Período de Obra SUGERIDO:</span>
                            <span className="text-xs font-black text-emerald-950 font-mono">
                              {sim.constructionInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/mês
                            </span>
                          </div>
                          <div className="p-1 px-1.5 bg-white border border-emerald-150 rounded text-[8.5px] text-emerald-900 font-sans leading-tight">
                            • Parcelamento em <strong className="font-extrabold text-emerald-950">36 parcelas mensais fixas</strong> durante a construção do empreendimento.
                          </div>
                        </div>
                      </div>

                    </div>

                    {(sim.totalDownPaymentRequired / selectedProperty.price) > 0.18 && (
                      <div className="flex items-start gap-2 bg-amber-50 border-2 border-amber-500 text-zinc-900 p-2.5 rounded-xl text-[10px] leading-tight font-sans mt-1">
                        <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-amber-850 uppercase text-[8px] font-mono">👥 ENTRADA REQUERIDA CONFIRMADA ACIMA DE 18%</strong>
                          <span>A entrada calculada de R$ {sim.totalDownPaymentRequired.toLocaleString('pt-BR')} ({((sim.totalDownPaymentRequired / selectedProperty.price) * 100).toFixed(1)}%) ultrapassou o teto confortável de 18% do valor do imóvel (R$ {selectedProperty.price.toLocaleString('pt-BR')}). <span className="font-extrabold text-indigo-800">É preciso agregar renda, compor um co-adquirente ou um fiador</span> para diminuir este saldo residual de entrada!</span>
                        </div>
                      </div>
                    )}

                    {/* Action copy integration */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplySimulationToNotes}
                        className="bg-indigo-600 hover:bg-indigo-700 active:translate-y-0.5 text-white border-2 border-zinc-950 font-mono font-black text-[9.5px] uppercase px-3 py-1.5 rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition inline-flex items-center gap-1"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        Vincular Simulação às Notas
                      </button>
                    </div>

                  </div>

                </div>
              )}
            </div>

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

            {/* AI COPRODUCTION ASSISTANT CARD */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 border-4 border-zinc-950 rounded-2xl p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] select-text">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-mono font-black text-purple-950 uppercase tracking-tight flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-650 shrink-0" />
                    Central Coprodutora do Gemini (CRM Direct)
                  </h3>
                  <span className="text-[9px] tracking-widest font-black text-zinc-450 font-mono block">GEMINI 3.5 FLASH • CONECTOR SIDERADO CRÉDITO</span>
                </div>
                <div className="shrink-0 bg-purple-100 border border-purple-300 text-purple-950 font-mono font-black text-[9px] px-2 py-0.5 rounded-full select-none">
                  +120 XP REAL
                </div>
              </div>

              {/* Sub-tab selectors */}
              <div className="flex bg-zinc-950/5 p-1 rounded-xl border border-zinc-300/60 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setModalCoproductTab('pitch');
                    setAiPitchText('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    modalCoproductTab === 'pitch'
                      ? 'bg-purple-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-zinc-650 hover:text-zinc-950'
                  }`}
                >
                  📱 Abordagem Rápida
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalCoproductTab('dossier');
                    setAiPitchText('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    modalCoproductTab === 'dossier'
                      ? 'bg-purple-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-zinc-650 hover:text-zinc-950'
                  }`}
                >
                  🔬 Dossiê Habitacional
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalCoproductTab('campaign');
                    setAiPitchText('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    modalCoproductTab === 'campaign'
                      ? 'bg-purple-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-zinc-650 hover:text-zinc-950'
                  }`}
                >
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
                  <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-[10px] text-red-950 font-sans leading-relaxed select-text flex items-start gap-1.5 border-4">
                    <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Falha de Integração:</strong> {aiPitchError}
                    </div>
                  </div>
                )}

                {aiPitchText ? (
                  <div className="space-y-3">
                    <div className="bg-zinc-950 text-zinc-100 border-2 border-zinc-950 p-4 rounded-xl shadow-inner text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[290px] overflow-y-auto select-text">
                      {aiPitchText}
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 select-none">
                      <button
                        type="button"
                        onClick={handleCopyPitch}
                        className={`px-3 py-2 border-2 border-zinc-950 rounded-lg font-mono font-black text-[9px] uppercase transition cursor-pointer active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          isCopied 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                      >
                        {isCopied ? '✓ Copiado!' : 'Copiar Texto 📋'}
                      </button>

                      {modalCoproductTab === 'pitch' && (
                        <button
                          type="button"
                          onClick={() => {
                            const rawMsg = aiPitchText.split('---')[0] || aiPitchText;
                            const cleanPhone = (leadPhone || lead?.phone || '').replace(/[^0-9]/g, '');
                            const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                            window.location.href = `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(rawMsg.trim())}`;
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-zinc-950 rounded-lg font-mono font-black text-[9px] uppercase transition cursor-pointer active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                        >
                          Enviar WhatsApp Local 📲
                        </button>
                      )}

                      {modalCoproductTab === 'dossier' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!lead || !onUpdateLeadNotes) return;
                            const updatedNotes = `${lead.notes || ''}\n\n--- 🔬 DOSSIÊ DIGITAL DE QUALIFICAÇÃO (GEMINI DIRECT) ---\n${aiPitchText}`;
                            onUpdateLeadNotes(lead.id, updatedNotes);
                            setNotesText(updatedNotes);
                            if (awardXP) awardXP(120);
                            alert("Dossiê do Gemini anexado com sucesso na ficha cadastral das anotações do Lead!");
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-zinc-950 rounded-lg font-mono font-black text-[9px] uppercase transition cursor-pointer active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                        >
                          Salvar e Anexar ao Lead 🔬
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 flex">
                    <button
                      type="button"
                      onClick={() => handleGenerateAiPitch(modalCoproductTab)}
                      disabled={isGeneratingPitch}
                      className="w-full py-3 bg-purple-650 hover:bg-purple-750 active:translate-y-0.5 text-white border-2 border-zinc-950 font-mono font-black text-[10px] uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition flex items-center justify-center gap-2 select-none"
                    >
                      {isGeneratingPitch ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full shrink-0 animate-spin" />
                          <span>Solicitando inteligência ao Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>
                            {modalCoproductTab === 'pitch' && 'Gerar Abordagem Personalizada'}
                            {modalCoproductTab === 'dossier' && 'Gerar Dossiê de Qualificação'}
                            {modalCoproductTab === 'campaign' && 'Gerar Plano de Campanha 7 Dias'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* GOOGLE WORKSPACE RAMIFICATIONS PANEL */}
            <div className="bg-white border-4 border-zinc-950 p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4 text-left select-none mt-6">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] tracking-widest font-black text-indigo-600 font-mono uppercase flex items-center gap-1">
                    <Cloud className="w-3 h-3  text-indigo-500" />
                    <span>Google Workspace Ativo</span>
                  </span>
                  <h4 className="text-xs font-black text-zinc-900 uppercase font-mono">Conexões Expandidas de Vendas</h4>
                </div>
                {workspaceToken ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8.5px] px-2 py-0.5 rounded-full font-mono font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full "></span>
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
                    Conecte sua conta Google na aba <strong>"Google Workspace"</strong> para enviar propostas automáticas via Gmail e agendar visitas no Google Calendar real!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Message Notification alerts */}
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
                  <div className="space-y-2 group border border-zinc-200 p-3 rounded-xl hover:bg-zinc-50 transition-all duration-200">
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
                          setGoogleWorkspaceSuccess("E-mail disparado via Gmail API com absoluto sucesso!");
                          if (awardXP) awardXP(100);
                        } else {
                          setGoogleWorkspaceError("Não foi possível disparar o e-mail via Gmail. Verifique as permissões de escopo.");
                        }
                        setIsSendingGoogleEmail(false);
                      }}
                      className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider block transition"
                    >
                      {isSendingGoogleEmail ? 'Despachando via Gmail...' : 'Enviar Abordagem pelo seu Gmail'}
                    </button>
                  </div>

                  {/* Google Calendar Event syncing */}
                  <div className="space-y-2 group border border-zinc-200 p-3 rounded-xl hover:bg-zinc-50 transition-all duration-200">
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

          </div>

          {/* RIGHT PANEL: History, values, and quick stages transition (5 Columns) */}
          <div className="md:col-span-5 space-y-6">
            {/* Value card */}
            <div className="bg-zinc-900 border-4 border-zinc-950 text-white rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <DollarSign className="w-5 h-5 text-indigo-400 mb-0.5" />
              <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider font-mono">Potencial Comercial</span>
              <h4 className="text-2xl font-mono font-black text-white">
                {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h4>
            </div>



            {/* Interaction history timeline (Simulated + real logs) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Linha do Tempo
              </h3>

              <div id="lead-activity-timeline" className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
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
          </div>
        </div>

        {activeModalSection === 'ficha' && (
          <div className="p-6 overflow-y-auto flex-1 bg-zinc-50 space-y-6 text-zinc-900 font-sans">
             {/* Header Info with score */}
             <div className="p-4 bg-white border-2 border-zinc-950 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
               <div>
                 <h3 className="text-sm font-black uppercase text-zinc-900 tracking-tight font-mono">📋 Ficha de Qualificação</h3>
                 <p className="text-[10px] text-zinc-500 uppercase font-black font-mono">Modifique os parâmetros para recalcular o enquadramento imediatamente</p>
               </div>
               <div className={`px-4 py-2 border-2 border-zinc-950 rounded-xl font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${scoreBadgeColor()}`}>
                 🏆 Real-time Score: {lead.score || 40} pts
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {/* 1. DADOS DE IDENTIFICAÇÃO */}
               <div className="bg-white border-2 border-zinc-950 p-5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                 <div className="flex items-center gap-2 border-b pb-2 mb-2">
                   <span className="text-sm">👤</span>
                   <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-900">Dados de Identificação & Contato</h4>
                 </div>

                 <div className="space-y-3">
                   <div>
                     <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Nome Completo</label>
                     <input
                       type="text"
                       value={leadName}
                       onChange={(e) => {
                         setLeadName(e.target.value);
                         updateField('name', e.target.value);
                       }}
                       className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none focus:bg-zinc-50 font-sans"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Gênero</label>
                       <select
                         value={lead.gender || 'Homem'}
                         onChange={(e) => updateField('gender', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-sans"
                       >
                         <option value="Homem">Homem</option>
                         <option value="Mulher">Mulher</option>
                         <option value="Outro">Outro</option>
                         <option value="Prefiro nao informar">Não Informar</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Data de Nascimento</label>
                       <input
                         type="date"
                         value={lead.birthDate || ''}
                         onChange={(e) => updateField('birthDate', e.target.value)}
                         className="w-full text-xs font-bold p-1 border-2 border-zinc-950 rounded-lg focus:outline-none font-sans"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Telefone</label>
                       <input
                         type="text"
                         value={leadPhone}
                         onChange={(e) => {
                           setLeadPhone(e.target.value);
                           updateField('phone', e.target.value);
                         }}
                         className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-sans font-mono"
                       />
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">E-mail</label>
                       <input
                         type="email"
                         value={lead.email || ''}
                         onChange={(e) => updateField('email', e.target.value)}
                         className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-sans"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">CPF</label>
                       <input
                         type="text"
                         placeholder="000.000.000-00"
                         value={lead.cpf || ''}
                         onChange={(e) => updateField('cpf', e.target.value)}
                         className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-mono"
                       />
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Estado Civil</label>
                       <select
                         value={lead.maritalStatus || 'Solteiro'}
                         onChange={(e) => updateField('maritalStatus', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-sans"
                       >
                         <option value="Solteiro">Solteiro</option>
                         <option value="Casado">Casado</option>
                         <option value="Uniao estavel">União Estável</option>
                         <option value="Divorciado">Divorciado</option>
                         <option value="Viuvo">Viúvo</option>
                       </select>
                     </div>
                   </div>

                   <div>
                     <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Como nos conheceu?</label>
                     <select
                       value={lead.comoSoube || 'Instagram'}
                       onChange={(e) => updateField('comoSoube', e.target.value)}
                       className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-sans"
                     >
                       <option value="Instagram">Instagram</option>
                       <option value="Facebook">Facebook</option>
                       <option value="Google">Google Search</option>
                       <option value="Indicacao">Indicação</option>
                       <option value="Corretor">Abordagem Física</option>
                       <option value="Feira">Eventos / Feiras</option>
                       <option value="Outros">Outras Mídias</option>
                     </select>
                   </div>
                 </div>
               </div>

               {/* 2. ENQUADRAMENTO E CRÉDITO DE FOMENTO */}
               <div className="bg-white border-2 border-zinc-950 p-5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
                 <div className="flex items-center gap-2 border-b pb-2 mb-2">
                   <span className="text-sm">🧮</span>
                   <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-900">Enquadramento & Parâmetros de Crédito</h4>
                 </div>

                 <div className="space-y-3">
                   <div>
                     <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Renda Familiar Mensal Bruta (R$)</label>
                     <input
                       type="number"
                       value={lead.familyIncome || 0}
                       onChange={(e) => {
                         const numVal = Number(e.target.value) || 0;
                         setSessionIncome(numVal);
                         setTempIncomeInput(String(numVal));
                         updateField('familyIncome', numVal);
                       }}
                       className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-mono"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Tipo de Comprovação</label>
                       <select
                         value={lead.incomeType || 'fixa'}
                         onChange={(e) => updateField('incomeType', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-mono"
                       >
                         <option value="fixa">Fixa / CLT</option>
                         <option value="variavel">Variável / Autôn.</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Saldo do FGTS (R$)</label>
                       <input
                         type="number"
                         value={lead.fgtsSaldo || 0}
                         onChange={(e) => updateField('fgtsSaldo', Number(e.target.value) || 0)}
                         className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-mono"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Restrição BACEN / SERASA</label>
                       <select
                         value={lead.restricaoBacen || 'Não'}
                         onChange={(e) => updateField('restricaoBacen', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-mono"
                       >
                         <option value="Não">Não (Crédito Limpo)</option>
                         <option value="Sim">Sim (Com restrições)</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Possui Outro Imóvel</label>
                       <select
                         value={lead.possuiImovel || 'Não'}
                         onChange={(e) => updateField('possuiImovel', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-mono"
                       >
                         <option value="Não">Não (Estilo 1º Apoio)</option>
                         <option value="Sim">Sim (Não MCMV)</option>
                         <option value="Em nome de terceiros">Em nome de terceiros</option>
                       </select>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Programa Desejado</label>
                       <select
                         value={lead.programaDesejado || 'Indiferente'}
                         onChange={(e) => updateField('programaDesejado', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-mono"
                       >
                         <option value="Indiferente">Indiferente</option>
                         <option value="Minha Casa Minha Vida">MCMV (Minha Casa)</option>
                         <option value="SBPE">SBPE / Convencional</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Perfil Principal</label>
                       <select
                         value={lead.mainProfile || 'Primeiro Imóvel'}
                         onChange={(e) => updateField('mainProfile', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-mono"
                       >
                         <option value="Primeiro Imóvel">Primeiro Imóvel</option>
                         <option value="Investidor">Investidor</option>
                         <option value="Jovem">Jovem</option>
                         <option value="Meia idade">Meia Idade</option>
                         <option value="Idoso">Sênior</option>
                       </select>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Ticket / Valor Máx. (R$)</label>
                       <input
                         type="number"
                         value={lead.value || 0}
                         onChange={(e) => updateField('value', Number(e.target.value) || 0)}
                         className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-mono"
                       />
                     </div>
                     <div>
                       <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Região Desejada (Zona)</label>
                       <select
                         value={lead.region || 'Sul'}
                         onChange={(e) => updateField('region', e.target.value)}
                         className="w-full text-xs font-bold p-1.5 border-2 border-zinc-950 rounded-lg focus:outline-none bg-white font-mono"
                       >
                         <option value="Sul">Zona Sul</option>
                         <option value="Leste">Zona Leste</option>
                         <option value="Norte">Zona Norte</option>
                         <option value="Oeste">Zona Oeste</option>
                         <option value="Centro">Região Central</option>
                         <option value="ABC">Grande ABC / Litoral</option>
                       </select>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* PREFERÊNCIAS E BAIRRO CARD */}
             <div className="bg-white border-2 border-zinc-950 p-5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
               <div className="flex items-center gap-2 border-b pb-2 mb-2">
                 <span className="text-sm">🏢</span>
                 <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-900">Interesse Geográfico & Preferências da Unidade</h4>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-3">
                   <div>
                     <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Bairro Específico</label>
                     <input
                       type="text"
                       placeholder="Ex: Ipiranga, Santana, Pinheiros..."
                       value={lead.bairroEspecifico || ''}
                       onChange={(e) => updateField('bairroEspecifico', e.target.value)}
                       className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-sans"
                     />
                   </div>
                   <div>
                     <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">CEP de Localização</label>
                     <input
                       type="text"
                       placeholder="00000-000"
                       value={lead.cep || ''}
                       onChange={(e) => updateField('cep', e.target.value)}
                       className="w-full text-xs font-bold p-2 border-2 border-zinc-950 rounded-lg focus:outline-none font-mono"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[9px] font-black uppercase text-zinc-500 mb-2">Preferências de Unidades (Clique para marcar)</label>
                   <div className="flex flex-wrap gap-1.5">
                     {['1 Dormitório', '2 Dormitórios', 'Suíte integrada', 'Varanda Goumert', 'Vaga de Garagem', 'Lazer Completo', 'Próximo ao Metrô', 'Entrada Zero'].map((item) => {
                       const activePrefs = lead.preferenciasUnidade || [];
                       const isSelected = activePrefs.includes(item);
                       return (
                         <button
                           key={item}
                           type="button"
                           onClick={() => {
                             const nextPrefs = isSelected 
                               ? activePrefs.filter(p => p !== item)
                               : [...activePrefs, item];
                             updateField('preferenciasUnidade', nextPrefs);
                           }}
                           className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border-2 transition-all cursor-pointer ${
                             isSelected 
                               ? 'bg-zinc-900 text-white border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                               : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                           }`}
                         >
                           {isSelected ? '✓ ' : '+ '} {item}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               </div>
             </div>

             {/* NOTAS E OBSERVAÇÕES RÁPIDAS */}
             <div className="bg-white border-2 border-zinc-950 p-5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex items-center justify-between border-b pb-2 mb-2">
                 <div className="flex items-center gap-1.5">
                   <span className="text-sm">✍️</span>
                   <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-900">Histórico de Observação & Transmissão</h4>
                 </div>
                 <div className="text-[9px] font-mono text-zinc-500 font-black uppercase font-bold">Atualização Síncrona Automática com IA</div>
               </div>

               <div className="space-y-3">
                 <textarea
                   rows={3}
                   value={notesText}
                   onChange={(e) => {
                     setNotesText(e.target.value);
                     onUpdateLeadNotes(lead.id, e.target.value);
                   }}
                   placeholder="Anote o andamento da conversa com o cliente para fundamentar o dossiê analítico da Inteligência cicloCRED..."
                   className="w-full text-xs font-bold p-3 border-2 border-zinc-950 rounded-lg focus:outline-none focus:bg-zinc-50 font-sans"
                 />
               </div>
             </div>
          </div>
        )}

        {activeModalSection === 'ficha' && (
          <div className="px-6 pb-6 bg-zinc-50">
            <div className="bg-white border-2 border-zinc-950 p-5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 mb-2">
                <span className="text-sm">👁️</span>
                <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-900 font-sans">Visibilidades & Funil do Lead</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Status do CRM</label>
                  <select
                    value={lead.status || ""}
                    onChange={(e) => onUpdateLeadFull && onUpdateLeadFull(lead.id, { status: e.target.value as any })}
                    className="w-full text-xs font-bold p-2 border-2 border-zinc-950 bg-white rounded-lg focus:outline-none focus:bg-zinc-50"
                  >
                    {getKanbanColumns("status").map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Etapa do Funil</label>
                  <select
                    value={lead.stage || ""}
                    onChange={(e) => onUpdateLeadFull && onUpdateLeadFull(lead.id, { stage: e.target.value })}
                    className="w-full text-xs font-bold p-2 border-2 border-zinc-950 bg-white rounded-lg focus:outline-none focus:bg-zinc-50"
                  >
                    <option value="">-- Selecione Etapa --</option>
                    {getKanbanColumns("etapas").map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Perfil de Qualificação</label>
                  <select
                    value={lead.mainProfile || ""}
                    onChange={(e) => onUpdateLeadFull && onUpdateLeadFull(lead.id, { mainProfile: e.target.value as any })}
                    className="w-full text-xs font-bold p-2 border-2 border-zinc-950 bg-white rounded-lg focus:outline-none focus:bg-zinc-50"
                  >
                    <option value="">-- Selecione Perfil --</option>
                    {getKanbanColumns("perfil").map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase text-zinc-500 font-mono">Objeção Ativa</label>
                  <select
                    value={lead.objection || ""}
                    onChange={(e) => onUpdateLeadFull && onUpdateLeadFull(lead.id, { objection: e.target.value })}
                    className="w-full text-xs font-bold p-2 border-2 border-zinc-950 bg-white rounded-lg focus:outline-none focus:bg-zinc-50"
                  >
                    <option value="">-- Selecione Objeção --</option>
                    {getKanbanColumns("objecoes").map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER AÇÕES */}
        <div className="bg-zinc-100 p-3 border-t-2 border-zinc-950 flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto overflow-y-hidden">
          <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest hidden md:block shrink-0">
            Ações
          </div>
          <div className="flex flex-nowrap items-center gap-[4px] w-auto shrink-0 pb-1">
            <button onClick={() => handleWhatsAppAction(lead, undefined, () => onUpdateLeadFull?.(lead.id, { lastInteractionAt: new Date().toISOString() }))} title="WhatsApp Inteligente" className="p-2 px-3 bg-white hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <MessageCircle className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Whats</span>
            </button>
            <button onClick={() => window.open(`tel:${lead.phone.replace(/\D/g, '')}`)} title="Ligar" className="p-2 px-3 bg-white hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <Phone className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Ligar</span>
            </button>
            <button onClick={() => { if (onNavigateToFollowUp) { onNavigateToFollowUp(lead); } else if (onOpenEditModal) { onOpenEditModal(lead); } onClose(); }} title="Follow-Up" className="p-2 px-3 bg-white hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <Bell className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">F-UP</span>
            </button>
            <button onClick={() => { onOpenRuleEngine && onOpenRuleEngine(lead); onClose(); }} title="Automação AI / Regras" className="p-2 px-3 bg-white hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <Bot className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Auto</span>
            </button>
            
            <button
              onClick={() => setActiveModalSection(activeModalSection === 'ficha' ? 'dossier' : 'ficha')}
              title={activeModalSection === 'ficha' ? "Ver Checklist & Roteiros IA" : "Ver Ficha Cadastral"}
              className={`p-2 px-3 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap ${
                activeModalSection === 'ficha'
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-white hover:bg-zinc-100 text-zinc-900'
              }`}
            >
              <FileText className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">{activeModalSection === 'ficha' ? 'Checklist/Roteiros' : 'Ficha'}</span>
            </button>
            <button onClick={() => { onUpdateLeadStatus(lead.id, 'etapas', 'funil'); onClose(); }} title="Mover Funil" className="p-2 px-3 bg-white hover:bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <ChevronDown className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Funil</span>
            </button>
            <button onClick={() => {
                if (window.confirm("Certeza que deseja excluir este lead?")) {
                  onDeleteLead && onDeleteLead(lead.id);
                  onClose();
                }
              }} title="Excluir" className="p-2 px-3 bg-white hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <Trash2 className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Excluir</span>
            </button>
            <button onClick={() => { onOpenAIAssistant && onOpenAIAssistant(lead); onClose(); }} title="Assistente AI" className="p-2 px-3 bg-white hover:bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center transition border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
              <Sparkles className="w-4 h-4 mr-1.5" /> <span className="font-black text-xs">Assist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
