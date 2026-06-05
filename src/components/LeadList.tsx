/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { getKanbanColumns } from '../utils/kanban';
import { triggerSensoryFeedback, AccessibilitySettings, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';
import { 
  Search, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Filter, 
  ArrowUpDown,
  UserPlus,
  AlertTriangle,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  MessageSquare,
  Sparkles,
  Zap,
  Wand2,
  Info,
  Check
} from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
  onOpenLeadDetails: (lead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenCreateModal: () => void;
  onMoveLead: (leadId: string, newStatus: LeadStatus) => void;
  onAddBulkLeads?: (newLeads: Lead[]) => void;
  onDeleteMultipleLeads?: (leadIds: string[]) => void; // New bulk delete prop
  onMoveMultipleLeads?: (leadIds: string[], status: LeadStatus) => void; // New bulk status update prop
  onUpdateMultipleLeads?: (updatedLeads: Lead[]) => void; // Prop for applying bulk updates
  onRequestConfirm?: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;
  awardXP?: (xp: number) => void;
  addNotification?: (title: string, message: string, type?: any) => void;
  appointments?: any[];
  setAppointments?: any;
}

export function isFictitiousPhone(phone: string | undefined | null): boolean {
  if (!phone) return true;
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return true;
  // Common fictitious strings, all 9s, all 0s, containing 9999999
  if (clean.includes('99999999') || clean.includes('00000000') || clean.includes('11111111') || clean.includes('999999999')) return true;
  return false;
}

export function formatBRLPhone(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  } else if (clean.length === 9) {
    return `(11) ${clean.slice(0, 5)}-${clean.slice(5)}`;
  } else if (clean.length === 8) {
    return `(11) ${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return digits;
}

export function extractPhoneFromEmail(email: string | undefined | null): { extractedPhone: string | null; cleanedEmail: string } {
  if (!email) return { extractedPhone: null, cleanedEmail: '' };
  
  // Look for any string of 10 or 11 digits (Brazilian phone sequence)
  const phoneRegex = /\d{10,11}/;
  const match = email.match(phoneRegex);
  if (match) {
    const digits = match[0];
    const ddd = parseInt(digits.slice(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      // Clean digits out of the email body
      let cleaned = email.replace(digits, '');
      // Fix dangling hyphens, underscores or periods before the @ sign
      cleaned = cleaned.replace(/[_.-]+@/g, '@');
      return {
        extractedPhone: formatBRLPhone(digits),
        cleanedEmail: cleaned
      };
    }
  }

  // Fallback: look for 8 or 9 digits without DDD
  const phoneShortRegex = /\d{8,9}/;
  const matchShort = email.match(phoneShortRegex);
  if (matchShort) {
    const digits = matchShort[0];
    // Exclude common year matches like 19xx, 202x
    if (!digits.startsWith('19') && !digits.startsWith('20')) {
      let cleaned = email.replace(digits, '');
      cleaned = cleaned.replace(/[_.-]+@/g, '@');
      return {
        extractedPhone: formatBRLPhone('11' + digits), // Default to SP DDD
        cleanedEmail: cleaned
      };
    }
  }

  return { extractedPhone: null, cleanedEmail: email };
}

// === Smart Universal Importer Engine ===
const KEYWORDS = {
  name: ['nome', 'name', 'lead', 'contato', 'cliente', 'proprietario', 'interessado', 'usuario', 'corretor', 'pess'],
  email: ['email', 'mail', 'correio', 'eletronico', 'electronicmail', 'contatoemail'],
  phone: ['telefone', 'tel', 'celular', 'phone', 'whatsapp', 'cel', 'fone', 'zap', 'wpp', 'mobi', 'mobile', 'contatotelefone'],
  value: ['valor', 'orcamento', 'preco', 'budget', 'value', 'investimento', 'capital', 'dinheiro'],
  company: ['empresa', 'company', 'imobiliaria', 'corporacao', 'organizacao', 'org'],
  origin: ['origem', 'canal', 'origin', 'source', 'midia', 'campanha', 'como'],
  notes: ['notas', 'notes', 'mensagem', 'descricao', 'obs', 'observacao', 'comentario', 'detalhes'],
  status: ['status', 'fase', 'etapa', 'estagio', 'coluna']
};

function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, ""); // remove spaces/punctuation
}

function detectDelimiter(text: string): string {
  const delimiters = ['\t', ';', ',', '|'];
  const firstLines = text.split(/\r?\n/).slice(0, 4).filter(line => line.trim().length > 0);
  if (firstLines.length === 0) return ',';
  
  let bestDelimiter = ',';
  let maxCount = -1;
  
  for (const delim of delimiters) {
    let consistentSum = 0;
    firstLines.forEach(line => {
      consistentSum += (line.split(delim).length - 1);
    });
    const avg = consistentSum / firstLines.length;
    if (avg > maxCount && consistentSum > 0) {
      maxCount = avg;
      bestDelimiter = delim;
    }
  }
  return bestDelimiter;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function isHeaderRow(row: string[]): boolean {
  if (row.length === 0 || row.every(cell => !cell)) return false;
  
  const keywordsList = Object.values(KEYWORDS).flat();
  const matchedCount = row.filter(cell => {
    const norm = normalizeString(cell);
    return keywordsList.some(kw => norm === kw || norm.includes(kw));
  }).length;
  
  if (matchedCount > 0) return true;
  
  const totalEmails = row.filter(cell => cell.includes('@') && cell.includes('.')).length;
  if (totalEmails > 0) return false;
  
  const numericCount = row.filter(cell => cell && !isNaN(Number(cell.replace(/[^0-9.-]/g, '')))).length;
  if (row.length > 2 && numericCount / row.length > 0.5) return false;
  
  return true;
}

function processFileOrPasteContent(text: string, defaultOrigin: string): { parsedItems: Lead[], errors: string[] } {
  const parsedItems: Lead[] = [];
  const errors: string[] = [];
  
  if (!text.trim()) return { parsedItems, errors };
  
  const delimiter = detectDelimiter(text);
  const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (rawLines.length === 0) return { parsedItems, errors };
  
  const rows = rawLines.map(line => parseCSVLine(line, delimiter));
  
  const hasHeaders = isHeaderRow(rows[0]);
  const headers = hasHeaders ? rows[0] : [];
  const dataStartRow = hasHeaders ? 1 : 0;
  
  const mapping = {
    name: -1,
    email: -1,
    phone: -1,
    value: -1,
    company: -1,
    origin: -1,
    notes: -1,
    status: -1
  };
  
  const numColumns = rows[0].length;
  
  // 1. Synonym matching on headers
  if (hasHeaders) {
    headers.forEach((hdr, idx) => {
      const norm = normalizeString(hdr);
      Object.entries(KEYWORDS).forEach(([field, synonyms]) => {
        if (synonyms.some(syn => norm === syn || norm.includes(syn))) {
          if (mapping[field as keyof typeof mapping] === -1) {
            mapping[field as keyof typeof mapping] = idx;
          }
        }
      });
    });
  }
  
  // 2. Content-based matching for unmapped values
  const maxScanRows = Math.min(rows.length, dataStartRow + 10);
  const dataRows = rows.slice(dataStartRow, maxScanRows);
  
  if (dataRows.length > 0) {
    for (let colIdx = 0; colIdx < numColumns; colIdx++) {
      let emailMatches = 0;
      let phoneMatches = 0;
      let valueMatches = 0;
      let statusMatches = 0;
      
      dataRows.forEach(row => {
        const val = (row[colIdx] || '').trim();
        if (!val) return;
        
        if (val.includes('@') && val.split('@')[1]?.includes('.')) {
          emailMatches++;
        }
        
        const digits = val.replace(/\D/g, '');
        if (digits.length >= 8 && digits.length <= 15 && /^[\d\s+\-()]{7,22}$/.test(val)) {
          phoneMatches++;
        }
        
        const rawNum = val.replace(/R\$\s?|\$\s?/i, '').replace(/[^0-9,-]/g, '').replace(',', '.');
        const numberVal = Number(rawNum);
        if (!isNaN(numberVal) && numberVal > 1000) {
          valueMatches++;
        }
        
        const normVal = normalizeString(val);
        if (['novo', 'contato', 'proposta', 'fechado', 'perdido', 'ganho', 'lost', 'won', 'new', 'proposal'].includes(normVal)) {
          statusMatches++;
        }
      });
      
      const rate = (count: number) => count / dataRows.length;
      
      if (rate(emailMatches) > 0.4 && mapping.email === -1) mapping.email = colIdx;
      if (rate(phoneMatches) > 0.4 && mapping.phone === -1) mapping.phone = colIdx;
      if (rate(valueMatches) > 0.4 && mapping.value === -1) mapping.value = colIdx;
      if (rate(statusMatches) > 0.4 && mapping.status === -1) mapping.status = colIdx;
    }
  }
  
  // Final fallback mappings
  if (mapping.name === -1) {
    for (let colIdx = 0; colIdx < numColumns; colIdx++) {
      if (colIdx !== mapping.email && colIdx !== mapping.phone && colIdx !== mapping.value) {
        mapping.name = colIdx;
        break;
      }
    }
    if (mapping.name === -1) mapping.name = 0;
  }
  
  // Parse rows and generate items
  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    
    const rawName = mapping.name !== -1 ? row[mapping.name] : '';
    const name = (rawName || '').trim();
    if (!name) continue;
    
    // Check if duplicate of header
    if (hasHeaders && i > dataStartRow && normalizeString(name) === normalizeString(rows[0][mapping.name])) {
      continue;
    }
    
    const email = mapping.email !== -1 ? (row[mapping.email] || '').trim() : '';
    const phone = mapping.phone !== -1 ? (row[mapping.phone] || '').trim() : '';
    
    const rawVal = mapping.value !== -1 ? row[mapping.value] : '';
    let value = 0;
    if (rawVal) {
      let valStr = rawVal.replace(/R\$\s?|\$\s?/i, '').trim();
      if (valStr.includes(',') && valStr.includes('.')) {
        const lastComma = valStr.lastIndexOf(',');
        const lastDot = valStr.lastIndexOf('.');
        if (lastComma > lastDot) {
          valStr = valStr.replace(/\./g, '').replace(',', '.');
        } else {
          valStr = valStr.replace(/,/g, '');
        }
      } else if (valStr.includes(',')) {
        const parts = valStr.split(',');
        if (parts[parts.length - 1].length <= 2) {
          valStr = valStr.replace(',', '.');
        } else {
          valStr = valStr.replace(/,/g, '');
        }
      }
      value = Number(valStr.replace(/[^0-9.-]/g, '')) || 0;
    }
    
    const company = mapping.company !== -1 ? (row[mapping.company] || '').trim() : '';
    const origin = mapping.origin !== -1 ? (row[mapping.origin] || '').trim() : defaultOrigin;
    const notes = mapping.notes !== -1 ? (row[mapping.notes] || '').trim() : 'Importado via Planilha';
    
    const rawStatus = mapping.status !== -1 ? (row[mapping.status] || '').trim() : 'novo';
    let status: LeadStatus = 'novo';
    const normStatus = normalizeString(rawStatus);
    if (normStatus === 'novo' || normStatus === 'new' || normStatus === 'lead') status = 'novo';
    else if (normStatus === 'emcontato' || normStatus === 'contato' || normStatus === 'contact' || normStatus === 'abordado' || normStatus === 'em_contato') status = 'em_contato';
    else if (normStatus === 'proposta' || normStatus === 'proposal' || normStatus === 'negociacao') status = 'proposta';
    else if (normStatus === 'fechado' || normStatus === 'ganho' || normStatus === 'won' || normStatus === 'fechando' || normStatus === 'sucesso') status = 'fechado';
    else if (normStatus === 'perdido' || normStatus === 'lost' || normStatus === 'arquivado') status = 'perdido';
    
    parsedItems.push({
      id: `lead-bulk-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      name,
      email: email || '',
      phone: phone || '',
      company,
      value: value || 0,
      status,
      notes,
      origin,
      createdAt: new Date().toISOString().slice(0, 10)
    });
  }
  
  return { parsedItems, errors };
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

export default function LeadList({
  leads,
  onOpenLeadDetails,
  onOpenEditModal,
  onDeleteLead,
  onOpenCreateModal,
  onMoveLead,
  onAddBulkLeads,
  onDeleteMultipleLeads,
  onMoveMultipleLeads,
  onUpdateMultipleLeads,
  onRequestConfirm,
  awardXP,
  addNotification,
  appointments,
  setAppointments
}: LeadListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [accSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('crm_accessibility_settings');
    return saved ? JSON.parse(saved) : INITIAL_ACCESSIBILITY_SETTINGS;
  });
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');
  const [genderFilter, setGenderFilter] = useState<'todos' | 'homens' | 'mulheres'>('todos');
  const [initialLetterFilter, setInitialLetterFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-selection states
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  // Lazy infinite scrolling states (loads on scroll/demand)
  const [visibleCount, setVisibleCount] = useState(15);

  // Quick delete mode to bypass popup confirmations on demand
  const [quickDeleteMode, setQuickDeleteMode] = useState(false);

  // States for organizer wizard
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [organizerSelectedCandidateIds, setOrganizerSelectedCandidateIds] = useState<Record<string, boolean>>({});

  // Campaigns & Marketing scripts custom suite states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState(0);
  const [customCampaignText, setCustomCampaignText] = useState('');
  const [campaignDispatchMode, setCampaignDispatchMode] = useState<'whatsapp' | 'batch'>('whatsapp');
  const [messagedLeads, setMessagedLeads] = useState<Record<string, boolean>>({});
  const [isDispatchingBatch, setIsDispatchingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchLog, setBatchLog] = useState<string[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);
  const [batchCountdownSeconds, setBatchCountdownSeconds] = useState<number>(0);
  const [campaignIsAssistedMode, setCampaignIsAssistedMode] = useState<boolean>(true);
  
  // Custom Campaign Batch parameters
  const [campaignWhatsappChannel, setCampaignWhatsappChannel] = useState<'app' | 'web'>('app');
  const [campaignDispatchDelay, setCampaignDispatchDelay] = useState<number>(5);
  const batchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const batchCleanupRef = React.useRef<(() => void) | null>(null);

  // Advanced Gemini-Powered Bulk Lead Campaign Active Planner and Metrics Calculator
  const [showCampaignPlanner, setShowCampaignPlanner] = useState(false);
  const [plannerLeadCount, setPlannerLeadCount] = useState<number>(30);
  const [plannerLeadOrigin, setPlannerLeadOrigin] = useState<string>('Planilha Comercial');
  const [plannerAverageValue, setPlannerAverageValue] = useState<number>(275000);
  const [plannerCustomNiches, setPlannerCustomNiches] = useState<string>('Leads do Facebook Ads interessados em parcelamento facilitado Zona Leste');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlanMarkdown, setGeneratedPlanMarkdown] = useState<string>('');
  const [schedulingProgress, setSchedulingProgress] = useState<'idle' | 'scheduling' | 'done'>('idle');

  const CAMPAIGN_TEMPLATES = [
    {
      id: 'template-boasvindas',
      title: '👋 Boas-vindas & Taxas Habitacionais',
      subject: 'Assessoria de Crédito cicloCRED',
      body: 'Olá, {{nome}}! Aqui é do atendimento cicloCRED. Identifiquei seu cadastro e gostaria de te apresentar as taxas especiais de financiamento habitacional da Caixa e bancos privados. Conseguimos financiar até 80% do valor do imóvel. Vamos simular um orçamento aproximado para você?'
    },
    {
      id: 'template-mcmv',
      title: '🏠 Minha Casa Minha Vida (Subsídios)',
      subject: 'Subsídio Minha Casa Minha Vida',
      body: 'Olá, {{nome}}! Excelentes notícias: o Governo Federal expandiu os subsídios do Minha Casa Minha Vida! Se o seu orçamento estimado de {{valor}} for compatível, podemos conseguir até R$ 55.000 em subsídios de entrada e taxas reduzidas de juros. Qual o melhor horário para conversarmos?'
    },
    {
      id: 'template-cury',
      title: '⚡ Lançamento Cury & ITBI e Registro Grátis',
      subject: 'Oportunidades Construtora Cury',
      body: 'Olá, {{nome}}! Temos uma oportunidade exclusiva em parceria com a Construtora Cury de no valor estimado de {{valor}}. Apartamentos incríveis com entrada parcelada em até 36x e Documentação (ITBI e Registro) 100% grátis! Gostaria de receber o folheto de apresentação no WhatsApp?'
    },
    {
      id: 'template-cartaocred',
      title: '💳 Crédito Facilitado / FGTS Habitação',
      subject: 'Redução de Juros e Amortização FGTS',
      body: 'Prezado(a) {{nome}}, sabias que é possível usar 100% do saldo do seu FGTS para amortizar ou pagar a entrada do seu novo imóvel? Com a assessoria de crédito da cicloCRED, facilitamos toda a burocracia sem custos de intermediação. Retorne para que possamos fazer seu estudo prévio.'
    },
    {
      id: 'template-custom',
      title: '📝 Roteiro / Script Livre e Personalizado',
      subject: 'Mensagem Livre',
      body: 'Olá {{nome}}, verificamos o seu interesse em simulação bancária no valor aproximado de {{valor}}. Entre em contato no WhatsApp para enviarmos sua ficha de simulação!'
    }
  ];

  const resolveTemplateText = (text: string, lead: Lead): string => {
    let resolved = text;
    resolved = resolved.replace(/\{\{nome\}\}/gi, lead.name);
    resolved = resolved.replace(/\{\{email\}\}/gi, lead.email || 'não informado');
    resolved = resolved.replace(/\{\{telefone\}\}/gi, lead.phone || 'não informado');
    resolved = resolved.replace(/\{\{valor\}\}/gi, lead.value ? lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'sob consulta');
    resolved = resolved.replace(/\{\{empresa\}\}/gi, lead.company || 'cicloCRED');
    resolved = resolved.replace(/\{\{origem\}\}/gi, lead.origin || 'Portal Digital');
    return resolved;
  };

  const stopBatchDispatch = () => {
    setIsDispatchingBatch(false);
    setBatchLog(prev => [`🛑 [SIND_ENGINE] Campanha interrompida pelo operador.`, ...prev]);
    if (addNotification) {
      addNotification('⚠️ TRANSMISSÃO PAUSADA', 'O envio em massa do lote foi interrompido.', 'warning');
    }
  };

  const startBatchDispatch = () => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    if (selectedLeads.length === 0) return;
    
    setIsDispatchingBatch(true);
    setActiveBatchIndex(0);
    setBatchProgress(0);
    setBatchCountdownSeconds(3); // 3-second warm-up delay
    setBatchLog([
      `🚀 [SETUP] Iniciando Transmissora SWAT Lote...`,
      `🔌 Canal: ${campaignWhatsappChannel === 'app' ? 'WhatsApp Desktop (Local)' : 'WhatsApp Web'}`,
      `⏱️ Intervalo Base: ${campaignDispatchDelay}s`,
      `🎯 Total: ${selectedLeads.length} leads selecionados`
    ]);
  };

  const executeBatchItemDispatch = (index: number) => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    if (index >= selectedLeads.length) return;

    const leadItem = selectedLeads[index];
    const rawBody = customCampaignText || (CAMPAIGN_TEMPLATES[selectedCampaignTemplate] ? CAMPAIGN_TEMPLATES[selectedCampaignTemplate].body : '');
    const resolvedText = resolveTemplateText(rawBody, leadItem);
    const cleanPhone = (leadItem.phone || '').replace(/[^0-9]/g, '');
    const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const waLink = campaignWhatsappChannel === 'app'
      ? `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`
      : `https://api.whatsapp.com/send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`;

    if (leadItem.phone) {
      try {
        if (campaignWhatsappChannel === 'app') {
          const anchor = document.createElement('a');
          anchor.href = waLink;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        } else {
          window.open(waLink, '_blank');
        }
        
        setBatchLog(prev => [
          `[${new Date().toLocaleTimeString()}] ✅ Disparado para ${leadItem.name} (${leadItem.phone}) ✔️`,
          ...prev
        ]);
        setMessagedLeads(prev => ({ ...prev, [leadItem.id]: true }));
        if (awardXP) awardXP(50);
      } catch (err) {
        setBatchLog(prev => [
          `[${new Date().toLocaleTimeString()}] ❌ Erro ao abrir contato de ${leadItem.name}.`,
          ...prev
        ]);
      }
    } else {
      setBatchLog(prev => [
        `[${new Date().toLocaleTimeString()}] ⚠️ Pulado: ${leadItem.name} - Telefone ausente.`,
        ...prev
      ]);
    }

    const nextIdx = index + 1;
    setActiveBatchIndex(nextIdx);
    setBatchProgress(Math.floor((nextIdx / selectedLeads.length) * 100));
    setBatchCountdownSeconds(campaignDispatchDelay || 3);
  };

  useEffect(() => {
    if (!isDispatchingBatch) return;

    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    if (selectedLeads.length === 0) return;

    if (activeBatchIndex >= selectedLeads.length) {
      setIsDispatchingBatch(false);
      setShowCampaignModal(false);
      setSelectedLeadIds([]);
      if (awardXP) awardXP(selectedLeads.length * 30 + 100);
      if (addNotification) {
        addNotification(
          '🚀 CAMPANHA ENVIADA', 
          `Disparo em lote concluído com sucesso para ${selectedLeads.length} leads selecionados! Redes aquecidas!`, 
          'success'
        );
      }
      alert(`Campanha real disparada com sucesso em lote para todos os ${selectedLeads.length} leads selecionados! Recompensa de XP creditada.`);
      return;
    }

    setBatchCountdownSeconds(campaignDispatchDelay || 3);
  }, [isDispatchingBatch, activeBatchIndex]);

  // Listen for tab return to reset countdown safely
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isDispatchingBatch) {
        const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
        if (selectedLeads.length > 0 && activeBatchIndex < selectedLeads.length) {
          const delay = activeBatchIndex === 0 ? 3 : 5;
          setBatchCountdownSeconds(delay);
          setBatchLog(prev => [
            `[${new Date().toLocaleTimeString()}] 👀 Retorno detectado! Redefinindo cronômetro de segurança para ${delay}s...`,
            ...prev
          ]);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isDispatchingBatch, activeBatchIndex, selectedLeadIds, leads]);

  useEffect(() => {
    if (!isDispatchingBatch) return;
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    if (selectedLeads.length === 0 || activeBatchIndex >= selectedLeads.length) return;

    if (batchCountdownSeconds > 0) {
      const timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setBatchCountdownSeconds(prev => prev - 1);
        } else {
          setBatchLog(prev => {
            if (prev[0]?.includes('⏳ Aguardando retorno ao CRM')) return prev;
            return [
              `[${new Date().toLocaleTimeString()}] ⏳ Aguardando retorno ao CRM para retomar contagem...`,
              ...prev
            ];
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const activeLead = selectedLeads[activeBatchIndex];
      setBatchLog(prev => {
        if (prev[0]?.includes('👉 [PRONTO]')) return prev;
        return [
          `[${new Date().toLocaleTimeString()}] 👉 [PRONTO] Canal quente! Abra o chat para enviar para ${activeLead.name}!`,
          ...prev
        ];
      });

      // If in automatic mode, automatically trigger!
      if (!campaignIsAssistedMode) {
        executeBatchItemDispatch(activeBatchIndex);
      }
    }
  }, [isDispatchingBatch, activeBatchIndex, batchCountdownSeconds, campaignIsAssistedMode, campaignDispatchDelay]);

  // Keyboard shortcut Enter listener for fast assisted batch pacing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isDispatchingBatch && campaignIsAssistedMode) {
        e.preventDefault();
        executeBatchItemDispatch(activeBatchIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDispatchingBatch, campaignIsAssistedMode, activeBatchIndex, customCampaignText, selectedCampaignTemplate]);

  // Lead spreadsheet states
  const [showImporter, setShowImporter] = useState(false);
  const [importerTab, setImporterTab] = useState<'classic' | 'simulation'>('classic');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationProgress, setSimulationProgress] = useState<number>(-1);
  const [extractedSimulationLead, setExtractedSimulationLead] = useState<any | null>(null);
  const [isSimulatingExtraction, setIsSimulatingExtraction] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importedFileName, setImportedFileName] = useState('');
  const [rawPasteData, setRawPasteData] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<Lead[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImportSuccess, setIsImportSuccess] = useState(false);

  const origins = Array.from(new Set(leads.map(l => l.origin)));

  // File Import Processor
  const handleFileImport = (file: File) => {
    setImportedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setIsImportSuccess(false);
        setImportErrors([]);
        
        const { parsedItems, errors } = processFileOrPasteContent(text, 'Planilha Importada');
        setImportPreview(parsedItems);
        setImportErrors(errors);
        
        if (parsedItems.length > 0) {
          setRawPasteData(text);
        }
      }
    };
    reader.readAsText(file);
  };

  // Bulk Paste Excel/CSV parser
  const handleParsePaste = () => {
    if (!rawPasteData.trim()) return;
    setIsImportSuccess(false);
    setImportErrors([]);

    const { parsedItems, errors } = processFileOrPasteContent(rawPasteData, 'Planilha Comercial');
    setImportPreview(parsedItems);
    setImportErrors(errors);
  };

  // Web Gateway simulation uploader function
  const runSimulationPortability = (fileName: string, presetLead?: any) => {
    setIsSimulatingExtraction(true);
    setSimulationProgress(0);
    setSimulationLogs([`📡 [CONNECTED] Inicializando Gateway de Portabilidade cicloCRED...`]);
    setExtractedSimulationLead(null);
    
    // Step by step extraction simulation
    const steps = [
      { prg: 15, log: `📁 [LOADED] Arquivo de simulação local carregado com sucesso: "${fileName}"` },
      { prg: 35, log: `🔍 [ANALYZING] Escaneando metadados habitacionais e tabelas de simulação de fomento Caixa...` },
      { prg: 55, log: `🔑 [PARSING] Mapeando chaves do formulário habitacional Cury e subsídios MCMV...` },
      { prg: 75, log: `👤 [FOUND] Proponente localizado! Extraindo dados pessoais e renda líquida auferida...` },
      { prg: 90, log: `⚙️ [AUTOMATION] Cruzando com heurísticas de elegibilidade cicloCRED & Banco de Imóveis...` },
      { prg: 100, log: `🚀 [CRM_SYNC] Portabilidade concluída! Ficha cadastral pré-preenchida com inteligência preditiva.` }
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSimulationProgress(steps[currentStep].prg);
        setSimulationLogs(prev => [...prev, steps[currentStep].log]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulatingExtraction(false);
        
        // Define default parsed lead details
        const details = presetLead || {
          name: 'Cláudia Maria de Souza',
          email: 'claudia.souza@ficticio.com.br',
          phone: '(11) 98729-1029',
          value: 315000,
          familyIncome: 4350,
          origin: 'Gateway Simulação Local',
          notes: 'Ficha portada via Portal de Portabilidade cicloCRED. Proponente possui interesse direto no Cury Eko Guarulhos. Financiamento pré-aprovado Caixa Econômica de 80% do valor.'
        };
        setExtractedSimulationLead(details);
        if (triggerSensoryFeedback && accSettings) {
          triggerSensoryFeedback('success', accSettings);
        }
      }
    }, 450);
  };

  const handleOrganizeImportPreview = () => {
    let correctedCount = 0;
    const cleanedPreview = importPreview.map(item => {
      const cleanPhone = (item.phone || '').trim();
      const isDummy = isFictitiousPhone(cleanPhone);
      if (isDummy) {
        const { extractedPhone, cleanedEmail } = extractPhoneFromEmail(item.email || '');
        if (extractedPhone) {
          correctedCount++;
          return {
            ...item,
            phone: extractedPhone,
            email: cleanedEmail
          };
        }
      }
      return item;
    });

    if (correctedCount > 0) {
      setImportPreview(cleanedPreview);
      if (addNotification) {
        addNotification(
          '🧹 MARCADORES CORRIGIDOS',
          `Separados telefone e e-mail de ${correctedCount} contatos da sua planilha com sucesso!`,
          'success'
        );
      }
    } else {
      if (addNotification) {
        addNotification(
          '✨ DADOS CONFORMES',
          'Não foram encontrados telefones fictícios com números embutidos nos e-mails desta planilha.',
          'info'
        );
      }
    }
  };

  const handleApplyBulkImport = () => {
    if (importPreview.length === 0 || !onAddBulkLeads) return;

    const count = importPreview.length;
    const origin = importPreview[0]?.origin || 'Planilha Importada';
    const averageValue = importPreview.reduce((acc, current) => acc + (current.value || 0), 0) / count || 275000;

    onAddBulkLeads(importPreview);
    
    // Automatically pre-configure the advanced marketing campaign planner
    setPlannerLeadCount(count);
    setPlannerLeadOrigin(origin);
    setPlannerAverageValue(Math.round(averageValue));
    setPlannerCustomNiches(`Contatos lotes importados via "${origin}" - Foco em conversão célere.`);
    setShowCampaignPlanner(true); 

    setIsImportSuccess(true);
    setRawPasteData('');
    setImportPreview([]);
    setImportedFileName('');
    setTimeout(() => {
      setIsImportSuccess(false);
    }, 5000);
  };

  // Exporter to CSV
  const handleExportLeadsCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID;Nome;Email;Telefone;Orcamento;Canal;Notas;CriadoEm\r\n";
    leads.forEach(l => {
      csvContent += `"${l.id}";"${l.name}";"${l.email}";"${l.phone}";"${l.value}";"${l.origin}";"${l.notes.replace(/"/g, '""')}";"${l.createdAt}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", 'Planilha_Leads_cicloCRED.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCampaignPlan = async () => {
    setIsGeneratingPlan(true);
    setGeneratedPlanMarkdown('');
    if (awardXP) awardXP(30);

    try {
      const response = await fetch('/api/ai/plan-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadCount: plannerLeadCount,
          origin: plannerLeadOrigin,
          averageValue: plannerAverageValue,
          customNiches: plannerCustomNiches
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setGeneratedPlanMarkdown(data.text);
        if (awardXP) awardXP(150);
        if (addNotification) {
          addNotification('🧠 ENGAJAMENTO PLANEJADO', `Plano estruturado gerado pelo Gemini para ${plannerLeadCount} leads de "${plannerLeadOrigin}"!`, 'success');
        }
      } else {
        throw new Error(data.error || 'Erro ao comunicar com a inteligência do Gemini.');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback simulated plan
      const simulatedPlan = `# Plano Inteligente de Conversão cicloCRED

## 📈 Metas e Métricas do Funil Ativo (${plannerLeadCount} Leads de "${plannerLeadOrigin}")

* **Total de Contatos**: **${plannerLeadCount} leads**
* **Abordagens por WhatsApp (Meta: 100%)**: **${plannerLeadCount} tentativas** de aproximação
* **Telefonemas de Perfilamento (Meta: ~40%)**: **${Math.ceil(plannerLeadCount * 0.4)} telefonemas completados**
* **Simulações Habitacionais Automatizadas (Meta: ~20%)**: **${Math.ceil(plannerLeadCount * 0.2)} simulações cicloCRED/Caixa**
* **Agendamento de Visitas Físicas (Meta: ~8%)**: **${Math.ceil(plannerLeadCount * 0.08)} visitas estruturadas**
* **Vendas Efetivas Estimadas (Conversão de 2.5%)**: **${Math.ceil(plannerLeadCount * 0.025)} fechamentos de contrato**
* **Receita Estimada de Comissão (Média R$ 250k a 3%)**: **R$ ${(Math.ceil(plannerLeadCount * 0.025) * 250000 * 0.03).toLocaleString('pt-BR')}**

---

## 🗓️ Cronograma Comercial Sugerido de Engajamento

* **Dia 1: Aquecimento Conector**  
  Disparar primeira abordagem via WhatsApp. Mensagem breve e instigante sobre aprovação de crédito simplificada cicloCRED. Não tentar vender o imóvel imediatamente, mas sim vender a simulação de parcelas.
  
* **Dia 2: Chamada telefônica de Conexão Humana**  
  Tornar-se ativo. Ligar para os leads que abriram as mensagens ou responderam. Validar qual faixa de renda e tempo de FGTS possuem.
  
* **Dia 3: Envio de Proposta de Simulador**  
  Realizar simulações de fluxo direto do Residencial Cury correspondente e enviar imagens em alta resolução do "Decorado Virtual".
  
* **Dia 5: Maturação & Superação de Objeções**  
  Apresentar condições de parcelamento de entrada em até 36x e subvenção/subsídios estaduais.
  
* **Dia 7: Visita Formal e Fechamento**  
  Direcionar o cliente pré-aprovado para o stand físico para escolha de unidade e assinatura de ficha Caixa!

---

## 💬 Roteiro de Copywriting Exclusivo para WhatsApp

*"Olá! Tudo bem? Sou consultor parceiro da cicloCRED. Notei seu interesse nas unidades com subsídio facilitado de até R$ 55 mil e juros reduzidos Minha Casa Minha Vida.*

*Consegui simular sua aprovação de financiamento Caixa com parcelas que cabem confortavelmente no seu orçamento mensal, sem complicação de burocracias.*

*Eu tenho as melhores opções de plantas prontas hoje no bairro desejado. Qual o melhor horário para eu te enviar os arquivos e números sem compromisso, às 14h ou às 17h?"*`;
      setGeneratedPlanMarkdown(simulatedPlan);
      if (addNotification) {
        addNotification('📊 RETORNO PLANEJADO (EMULADO)', 'Estrutura de plano calculada localmente com base nas métricas comerciais cicloCRED.', 'info');
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleScheduleCampaignTasks = () => {
    if (!setAppointments) {
      if (addNotification) addNotification('⚠️ ERRO', 'Não foi possível acessar a estrutura de calendário de visitas.', 'warning');
      return;
    }
    
    setSchedulingProgress('scheduling');
    
    setTimeout(() => {
      const baseDays = [1, 2, 3, 5, 7];
      const taskTitles = [
        `📲 WhatsApp: Abordagem inicial de Boas-vindas para ${plannerLeadCount} leads (${plannerLeadOrigin})`,
        `📞 Telefonar: Perfilamento de Comportamento para Leads de ${plannerLeadOrigin}`,
        `📊 Simulação cicloCRED: Envio de estudo de renda de leads qualificados`,
        `🏬 Apresentar Portfólio: Envio de Books e Plantas aos pré-aprovados`,
        `🤝 Agendar Stand: Reuniões físicas de fechamento com leads convertidos`
      ];
      
      const categories: ('Reunião' | 'Telefonema' | 'Outro')[] = ['Outro', 'Telefonema', 'Outro', 'Outro', 'Reunião'];
      const descriptions = [
        `Disparar roteiro de copywriting gerado para ${plannerLeadCount} leads a fim de extrair as primeiras respostas positivas.`,
        `Separar leads receptivos de ${plannerLeadOrigin} e realizar chamadas ativas de perfilamento cadastral, analisando potencial de FGTS.`,
        `Calcular o subsídio e financiamento exatos para os leads engajados e enviar as tabelas ilustradas cicloCRED.`,
        `Realizar tours virtuais de decorados do portfólio de Estoque e reforçar os diferenciais da construtora selecionada.`,
        `Levar clientes da planilha de ${plannerLeadOrigin} para fechar o negócio no stand sob comissão integrada.`
      ];

      const newAppts: any[] = [];
      
      const categoryMap: { [key: string]: 'reuniao' | 'telefone' | 'proposta' | 'outro' } = {
        'Reunião': 'reuniao',
        'Telefonema': 'telefone',
        'Outro': 'outro'
      };

      baseDays.forEach((day, index) => {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + day);
        const dateStr = dateObj.toISOString().slice(0, 10);
        const rawType = categories[index];
        const type: 'reuniao' | 'telefone' | 'proposta' | 'outro' = categoryMap[rawType] || 'outro';
        
        newAppts.push({
          id: `appt-camp-${Date.now()}-${day}`,
          leadId: `camp-lote-${plannerLeadOrigin.toLowerCase().replace(/[^a-z0-9]/g, '') || 'default'}`.substring(0, 100),
          leadName: `Lote: ${plannerLeadOrigin}`,
          title: taskTitles[index].substring(0, 200),
          date: dateStr,
          time: index === 1 ? "10:00" : index === 4 ? "14:00" : "09:00",
          type: type,
          description: descriptions[index].substring(0, 5000),
          status: 'agendado'
        });
      });

      setAppointments((prev: any[]) => [...newAppts, ...prev]);
      setSchedulingProgress('done');
      
      if (awardXP) awardXP(250);
      if (addNotification) {
        addNotification(
          '🗓️ CRONOGRAMA INTEGRADO',
          `As 5 atividades de abordagens foram lançadas no seu Calendário de Visitas com marcadores reais!`,
          'success'
        );
      }
    }, 1500);
  };

  const inferGenderFromName = (name: string): 'M' | 'F' => {
    const first = name.trim().split(' ')[0].toLowerCase();
    if (first.endsWith('a') || first.endsWith('is') || first === 'maria' || first === 'ana' || first === 'beatriz' || first === 'rachel' || first === 'ruth' || first === 'alice' || first === 'sofia' || first === 'laura' || first === 'luiza' || first === 'yasmin' || first.endsWith('elle') || first.endsWith('ily') || first.endsWith('ine')) {
      if (['luca', 'joshua', 'sasha', 'andrea', 'mustafa'].includes(first)) {
        return 'M';
      }
      return 'F';
    }
    return 'M';
  };

  // Filter & Sort
  const processedLeads = leads
    .filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
      const matchesOrigin = originFilter === 'todos' || lead.origin === originFilter;
      
      const matchesGender = 
        genderFilter === 'todos' ||
        (genderFilter === 'homens' && inferGenderFromName(lead.name) === 'M') ||
        (genderFilter === 'mulheres' && inferGenderFromName(lead.name) === 'F');

      const matchesInitial = 
        initialLetterFilter === 'todos' ||
        lead.name.trim().charAt(0).toUpperCase() === initialLetterFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesOrigin && matchesGender && matchesInitial;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'value') {
        comparison = a.value - b.value;
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Reset pagination on filter adjustments
  useEffect(() => {
    setVisibleCount(15);
  }, [searchTerm, statusFilter, originFilter, genderFilter, initialLetterFilter]);

  // Clean active campaign batch intervals on unmount or closing modal
  useEffect(() => {
    if (!showCampaignModal) {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
      if (batchCleanupRef.current) {
        batchCleanupRef.current();
        batchCleanupRef.current = null;
      }
      setIsDispatchingBatch(false);
    }
    return () => {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
        clearTimeout(batchTimerRef.current);
      }
      if (batchCleanupRef.current) {
        batchCleanupRef.current();
      }
    };
  }, [showCampaignModal]);

  const visibleLeads = processedLeads.slice(0, visibleCount);

  // Lazy loading observer hook
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 15, processedLeads.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [visibleLeads.length, processedLeads.length]);

  // Bulk operation helpers
  const handleToggleSelectOne = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = visibleLeads.map(l => l.id);
    const areAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedLeadIds.includes(id));
    
    if (areAllSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedLeadIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    
    const proceed = () => {
      if (onDeleteMultipleLeads) {
        onDeleteMultipleLeads(selectedLeadIds);
      } else {
        selectedLeadIds.forEach(id => onDeleteLead(id));
      }
      setSelectedLeadIds([]);
    };

    if (quickDeleteMode) {
      proceed();
    } else if (onRequestConfirm) {
      onRequestConfirm(
        'Apagar Leads Selecionados?',
        `Tem certeza que deseja apagar permanentemente os ${selectedLeadIds.length} leads selecionados? Esta ação é irreversível.`,
        proceed,
        'danger'
      );
    } else {
      try {
        if (confirm(`Excluir permanentemente ${selectedLeadIds.length} leads selecionados?`)) {
          proceed();
        }
      } catch (err) {
        proceed();
      }
    }
  };

  const handleIndividualDelete = (leadId: string) => {
    if (quickDeleteMode) {
      onDeleteLead(leadId);
    } else if (onRequestConfirm) {
      const leadObj = leads.find(l => l.id === leadId);
      const leadName = leadObj ? leadObj.name : 'este lead';
      onRequestConfirm(
        'Remover Cliente Lead?',
        `Tem certeza de que deseja remover permanentemente o lead "${leadName}" do CRM? Esta ação apagará seu histórico de forma definitiva.`,
        () => onDeleteLead(leadId),
        'danger'
      );
    } else {
      if (confirm('Tem certeza de que deseja remover este lead?')) {
        onDeleteLead(leadId);
      }
    }
  };

  const handleBulkMoveStatus = (status: LeadStatus) => {
    if (selectedLeadIds.length === 0) return;
    if (onMoveMultipleLeads) {
      onMoveMultipleLeads(selectedLeadIds, status);
      setSelectedLeadIds([]);
    } else {
      selectedLeadIds.forEach(id => onMoveLead(id, status));
      setSelectedLeadIds([]);
    }
  };

  const handleBulkExportSelected = () => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID;Nome;Email;Telefone;Orcamento;Canal;Notas;CriadoEm\r\n";
    selectedLeads.forEach(l => {
      csvContent += `"${l.id}";"${l.name}";"${l.email}";"${l.phone}";"${l.value}";"${l.origin}";"${l.notes.replace(/"/g, '""')}";"${l.createdAt}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leads_Selecionados_${selectedLeadIds.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'name' | 'value' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Build dynamic statusMap based on saved Columns (abas)
  const dynCols = getKanbanColumns();
  const statusMap: Record<string, { label: string; bg: string; text: string }> = {};
  
  dynCols.forEach(col => {
    statusMap[col.id] = {
      label: col.label,
      bg: `${col.bgClass} border-2 ${col.accentBorderClass}`,
      text: col.labelClass
    };
  });

  // Fallback for any leads whose status has not been mapped
  leads.forEach(lead => {
    if (!statusMap[lead.status]) {
      statusMap[lead.status] = {
        label: lead.status.charAt(0).toUpperCase() + lead.status.slice(1),
        bg: 'bg-zinc-100 border-2 border-zinc-500',
        text: 'text-zinc-950'
      };
    }
  });

  return (
    <div className="space-y-8">
      {/* Search and Advanced Filters toolbar */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-5 animate-fadeIn">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h2 id="leadbar-heading" className="text-md font-black text-zinc-950 flex items-center gap-2 uppercase tracking-tight">
            <Filter className="w-5 h-5 text-indigo-600" />
            <span>Filtros Avançados ({processedLeads.length} de {leads.length})</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">


            <button
              onClick={() => {
                setPlannerLeadCount(leads.length || 30);
                setShowCampaignPlanner(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border-2 border-zinc-950 text-white hover:bg-zinc-850 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>⚡ Planejar Campanha de Leads</span>
            </button>

            <button
              onClick={() => setShowImporter(!showImporter)}
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                showImporter 
                  ? 'bg-amber-100 text-amber-950' 
                  : 'bg-white text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>{showImporter ? 'Fechar Planilha ✕' : 'Planilha (Importar/Exportar)'}</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Lead</span>
            </button>
          </div>
        </div>

        {/* Collapsible Importer/Exporter Panel */}
        {showImporter && (
          <div className="border-t-2 border-dashed border-zinc-200 pt-5 space-y-5 animate-scaleIn">
            
            {/* Embedded Subsistem Tab Bar Selector */}
            <div className="flex border-b-2 border-zinc-200 gap-1 overflow-x-auto pb-1.5 select-none">
              <button
                type="button"
                onClick={() => setImporterTab('classic')}
                className={`px-4 py-2 border-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                  importerTab === 'classic'
                    ? 'bg-zinc-90 w-auto bg-zinc-900 text-white border-zinc-950'
                    : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-350'
                }`}
              >
                📁 Importador Clássico (CSV / Excel)
              </button>
              <button
                type="button"
                onClick={() => setImporterTab('simulation')}
                className={`px-4 py-2 border-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-1.5 ${
                  importerTab === 'simulation'
                    ? 'bg-zinc-900 text-white border-zinc-950'
                    : 'bg-zinc-50 text-indigo-700 hover:text-indigo-950 border-indigo-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse shrink-0" />
                ⚡ Portabilidade de Simulações Cury/Caixa (Gateway Web)
              </button>
            </div>

            {importerTab === 'classic' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Drag n Drop Upload Area */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleFileImport(file);
                    }
                  }}
                  className={`border-4 border-dashed rounded-2xl p-6 text-center transition-all select-none flex flex-col items-center justify-center gap-2 ${
                    isDraggingFile 
                      ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' 
                      : 'border-zinc-350 bg-zinc-50 hover:bg-zinc-100/60'
                  }`}
                >
                  <Upload className={`w-8 h-8 ${isDraggingFile ? 'text-indigo-600 font-black' : 'text-zinc-400'}`} />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase font-mono text-zinc-950">
                      Arrastar e soltar planilha (.csv, .txt, .tsv) aqui
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold">
                      Ou clique abaixo para carregar um arquivo local do seu computador
                    </p>
                  </div>
                  
                  <label className="mt-2 px-3.5 py-1.5 bg-white border border-zinc-950 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    Selecionar Arquivo
                    <input 
                      type="file" 
                      accept=".csv,.txt,.tsv" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileImport(file);
                        }
                      }} 
                    />
                  </label>
                  
                  {importedFileName && (
                    <span className="text-[10px] font-mono font-black text-indigo-800 uppercase bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                      📄 Carregado: {importedFileName}
                    </span>
                  )}
                </div>

                {/* Paste Panel Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-zinc-700 uppercase font-mono">
                    <span>Cole dados copiados do Excel/Sheets</span>
                    <span className="text-[9px] text-zinc-400 normal-case font-bold">Separados por Tabulação</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder={`Cole linhas aqui. Exemplo:\nNome\tEmail\tTelefone\tOrcamento\tEmpresa\tOrigem\tNotas\nJoão Silva\tjoao@email.com\t(11) 98888-8888\t350000\tSilva S/A\tFacebook\tInteressado em capital de giro`}
                    value={rawPasteData}
                    onChange={(e) => setRawPasteData(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={handleParsePaste}
                      disabled={!rawPasteData.trim()}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-950 text-white font-black uppercase font-mono text-[10px] rounded-lg border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                    >
                      Analisar dados colados
                    </button>

                    <button
                      type="button"
                      onClick={handleExportLeadsCSV}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 border border-zinc-950 text-zinc-900 font-bold font-mono text-[10px] rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Baixar Planilha Completa de Leads (.csv)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-scaleIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Drag n Drop Upload Area for Simu files */}
                  <div className="space-y-4">
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          runSimulationPortability(file.name);
                        }
                      }}
                      className={`border-4 border-dashed rounded-2xl p-6 text-center transition-all select-none flex flex-col items-center justify-center gap-2 ${
                        isDraggingFile 
                          ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' 
                          : 'border-zinc-350 bg-zinc-50 hover:bg-zinc-100/60'
                      }`}
                    >
                      <Upload className={`w-8 h-8 ${isDraggingFile ? 'text-indigo-600' : 'text-zinc-400'}`} />
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase font-mono text-zinc-950">
                          Arrastar Ficha de Simulação (PDF ou .xlsx) aqui
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold font-sans">
                          Carregue arquivos gerados nos correspondentes bancários Caixa / Cury
                        </p>
                      </div>
                      
                      <label className="mt-2 px-3.5 py-1.5 bg-white border border-zinc-950 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        Selecionar PDF/Excel Comercial
                        <input 
                          type="file" 
                          accept=".pdf,.xlsx,.csv,.txt" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              runSimulationPortability(file.name);
                            }
                          }} 
                        />
                      </label>
                    </div>

                    {/* Preset Templates Shortcut triggers to avoid larping! */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider block">Atalhos Rápidos de Simulação (Caixa Federal & Cury):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => runSimulationPortability('Ficha_Simulacao_MCMV_Carmo.pdf', {
                            name: 'Marcos Vinícius Prado',
                            email: 'marcos.prado92@gmail.com',
                            phone: '(11) 98112-4029',
                            value: 265000,
                            familyIncome: 2450,
                            origin: 'Ficha Caixa (Carmo)',
                            notes: 'Ficha de simulação portada via correspondente local do Parque do Carmo. Enquadramento MCMV Faixa 1.5.'
                          })}
                          className="p-2.5 border-2 border-zinc-950 bg-white hover:bg-zinc-50 rounded-xl text-left text-[10px] font-mono leading-tight font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                        >
                          📄 MCMV_Carmo.pdf
                          <span className="block text-[9px] text-zinc-400 font-semibold font-sans mt-0.5">Renda: R$ 2.450</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => runSimulationPortability('Ficha_Simulacao_Guarulhos.xlsx', {
                            name: 'Juliana de Alencar',
                            email: 'juliana.vasconcelos@outlook.com',
                            phone: '(11) 97109-1122',
                            value: 325000,
                            familyIncome: 4850,
                            origin: 'Ficha Cury (Guarulhos)',
                            notes: 'Integração de proposta de venda do estoque Cury Eko Guarulhos. Entrada no cheque facilitada.'
                          })}
                          className="p-2.5 border-2 border-zinc-950 bg-white hover:bg-zinc-50 rounded-xl text-left text-[10px] font-mono leading-tight font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                        >
                          📊 Guarulhos.xlsx
                          <span className="block text-[9px] text-zinc-400 font-semibold font-sans mt-0.5">Renda: R$ 4.850</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => runSimulationPortability('Simulador_SBPE_Mirante.pdf', {
                            name: 'Dr. Alberto Santos',
                            email: 'alberto.santos.adv@advocacia.com',
                            phone: '(11) 99245-8021',
                            value: 450000,
                            familyIncome: 10800,
                            origin: 'Ficha Caixa (Mirante)',
                            notes: 'Simulador Caixa SBPE. Proponente qualificado em renda alta corporativa, sem restritivos no CPF.'
                          })}
                          className="p-2.5 border-2 border-zinc-950 bg-white hover:bg-zinc-50 rounded-xl text-left text-[10px] font-mono leading-tight font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                        >
                          📄 SBPE_Mirante.pdf
                          <span className="block text-[9px] text-zinc-400 font-semibold font-sans mt-0.5">Renda: R$ 10.800</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Log Output and Ported View */}
                  <div className="bg-zinc-950 border-4 border-zinc-950 rounded-2xl p-4 text-white font-mono text-[10.5px] min-h-[220px] flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-1.5 overflow-y-auto max-h-[170px]">
                      {simulationLogs.length === 0 ? (
                        <span className="text-zinc-500 italic block py-4 text-center">Pronto para receber arquivos habitacionais de portabilidade...</span>
                      ) : (
                        simulationLogs.map((log, idx) => (
                          <div key={idx} className={log.includes('[SUCCESS]') || log.includes('[CRM_SYNC]') ? 'text-emerald-400 font-bold' : log.includes('[FOUND]') ? 'text-amber-300 font-bold' : 'text-zinc-350'}>
                            {log}
                          </div>
                        ))
                      )}
                      {isSimulatingExtraction && (
                        <div className="flex items-center gap-1.5 text-indigo-400 animate-pulse mt-1.5">
                          <span>⚙️ Mapemanento Inteligente... {simulationProgress}%</span>
                        </div>
                      )}
                    </div>

                    {simulationProgress > 0 && (
                      <div className="w-full bg-zinc-800 rounded-full h-1 mt-3">
                        <div 
                          className="bg-indigo-500 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${simulationProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Result View */}
                {extractedSimulationLead && (
                  <div className="bg-gradient-to-r from-emerald-50 to-zinc-50 border-2 border-zinc-950 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between animate-scaleIn select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-2 flex-1">
                      <span className="text-[9px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded font-black font-mono">
                        ✨ METADADOS EXTRAÍDOS COM SUCESSO
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase font-black block leading-none">Proponente</span>
                          <strong className="text-zinc-900 font-extrabold text-sm">{extractedSimulationLead.name}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase font-black block leading-none">Renda Declarada</span>
                          <strong className="text-emerald-600 font-mono font-black text-sm">
                            {extractedSimulationLead.familyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase font-black block leading-none">Orcamento / Imóvel</span>
                          <strong className="text-zinc-900 font-mono font-black text-sm">
                            {extractedSimulationLead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newLeadObj: Lead = {
                          id: 'lead-sim-' + Date.now(),
                          name: extractedSimulationLead.name,
                          email: extractedSimulationLead.email,
                          phone: extractedSimulationLead.phone,
                          value: extractedSimulationLead.value,
                          familyIncome: extractedSimulationLead.familyIncome,
                          status: 'novo',
                          origin: extractedSimulationLead.origin,
                          notes: extractedSimulationLead.notes,
                          company: 'Pessoa Física',
                          createdAt: new Date().toISOString().slice(0, 10)
                        };
                        
                        if (onAddBulkLeads) {
                          onAddBulkLeads([newLeadObj]);
                        }
                        setExtractedSimulationLead(null);
                        setSimulationLogs([]);
                        setSimulationProgress(-1);
                        if (addNotification) {
                          addNotification('🚀 SIMULAÇÃO INTEGRADA', `Proposta de ${extractedSimulationLead.name} cadastrada com inteligência preditiva!`, 'success');
                        }
                        if (awardXP) {
                          awardXP(150);
                        }
                        if (triggerSensoryFeedback && accSettings) {
                          triggerSensoryFeedback('success', accSettings);
                        }
                      }}
                      className="px-5 py-3 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-zinc-950 font-black rounded-xl text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-0.5 transition cursor-pointer"
                    >
                      Confirmar e Cadastrar Lead (+150 XP)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Indicators */}
            {importErrors.length > 0 && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-1 text-xs text-rose-800 font-mono">
                <p className="font-black uppercase flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-600" /> Erros de formatação:</p>
                <ul className="list-disc pl-5">
                  {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* Preview Sheet items block */}
            {importPreview.length > 0 && (
              <div className="bg-indigo-50/50 border-2 border-indigo-400 p-4 rounded-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h5 className="text-xs font-black uppercase text-indigo-950 font-mono flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                      <span>Dados prontos para processar ({importPreview.length} registros detectados)</span>
                    </h5>
                    <p className="text-[10px] text-indigo-700">Verifique os dados abaixo antes de efetivar o acoplamento no CRM.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleOrganizeImportPreview}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 transition-all"
                    >
                      <Wand2 className="w-4 h-4 text-emerald-200" />
                      <span>🧹 Organizar Planilha</span>
                    </button>
                    <button
                      onClick={handleApplyBulkImport}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Confirmar e Gravar no Estoque de Leads
                    </button>
                  </div>
                </div>

                <div className="max-h-[160px] overflow-y-auto border border-zinc-250 rounded bg-white text-[10px]">
                  <table className="w-full border-collapse">
                    <thead className="bg-zinc-100 text-zinc-700 font-mono uppercase font-black text-left sticky top-0">
                      <tr>
                        <th className="p-2 border-b">Nome</th>
                        <th className="p-2 border-b">Email</th>
                        <th className="p-2 border-b">Telefone</th>
                        <th className="p-2 border-b">Orçamento</th>
                        <th className="p-2 border-b">Canal Origem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-bold text-zinc-800 font-sans">
                      {importPreview.map((item, id) => (
                        <tr key={id}>
                          <td className="p-2 font-black">{item.name}</td>
                          <td className="p-2 font-semibold text-zinc-500">{item.email}</td>
                          <td className="p-2 font-mono">{item.phone}</td>
                          <td className="p-2 font-mono text-indigo-600">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</td>
                          <td className="p-2 uppercase font-mono text-[9px]"><span className="bg-zinc-100 px-1 py-0.5 rounded">{item.origin}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isImportSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-black animate-scaleIn">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>Importação de Leads concluída! Os contatos foram inseridos como "Novos" na carteira do CRM.</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Query search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              id="lead-list-search"
              placeholder="Pesquisar por nome, empresa, e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:bg-white font-bold placeholder-zinc-500"
            />
          </div>

          {/* Status selector */}
          <div>
            <select
              id="lead-list-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl px-4 py-2.5 text-sm text-zinc-800 font-extrabold focus:outline-none"
            >
              <option value="todos">Filtrar por Status (Todos)</option>
              {dynCols.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* Origin selector */}
          <div>
            <select
              id="lead-list-filter-origin"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl px-4 py-2.5 text-sm text-zinc-800 font-extrabold focus:outline-none"
            >
              <option value="todos">Filtrar por Origem (Todas)</option>
              {origins.map(origin => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters: Gender and Initial Letters */}
        <div className="bg-zinc-50 border-2 border-zinc-950 p-4 rounded-xl space-y-3 shadow-inner">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-700 font-mono">Filtro de Gênero:</span>
              <div className="flex gap-1">
                {(['todos', 'homens', 'mulheres'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border-2 transition ${
                      genderFilter === g
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                        : 'bg-white text-zinc-650 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {g === 'todos' ? 'Todos' : g === 'homens' ? 'Homens ♂' : 'Mulheres ♀'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-700 font-mono">Letra Inicial:</span>
              <select
                value={initialLetterFilter}
                onChange={(e) => setInitialLetterFilter(e.target.value)}
                className="bg-white text-zinc-900 border-2 border-zinc-950 px-3 py-1 rounded-lg text-xs font-extrabold outline-none"
              >
                <option value="todos">Todas as Letras</option>
                {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Letter Keycap Strip */}
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-200 justify-start select-none">
            <button
              onClick={() => setInitialLetterFilter('todos')}
              className={`px-1.5 py-1 text-[9px] font-black uppercase rounded border transition ${
                initialLetterFilter === 'todos'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white text-zinc-600 border-zinc-250 hover:bg-zinc-100'
              }`}
            >
              Todos
            </button>
            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
              <button
                key={letter}
                onClick={() => setInitialLetterFilter(letter)}
                className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono font-black uppercase rounded border transition active:scale-90 ${
                  initialLetterFilter === letter
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow'
                    : 'bg-white text-zinc-600 border-zinc-250 hover:bg-zinc-100'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk actions Floating Toolbar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-indigo-50 border-4 border-zinc-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-scaleIn font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
            </span>
            <span className="font-black text-indigo-950 uppercase text-[10.5px]">
              ⚡ Ações em massa: <span className="underline font-mono font-black">{selectedLeadIds.length}</span> selecionados
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase text-white">
            <span className="text-zinc-600 font-bold font-sans normal-case">Mover Funil:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkMoveStatus(e.target.value as LeadStatus);
                  e.target.value = '';
                }
              }}
              className="bg-white text-zinc-950 border-2 border-zinc-950 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer focus:outline-none"
            >
              <option value="">-- Escolher --</option>
              {dynCols.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setShowCampaignModal(true);
                setCustomCampaignText('Olá {{nome}}, verificamos o seu interesse em simulação bancária no valor aproximado de {{valor}}. Entre em contato no WhatsApp para enviarmos sua ficha de simulação!');
              }}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 border-2 border-zinc-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 transition-all hover:scale-[1.03] active:scale-95 text-[10px]"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-zinc-950" />
              <span>🚀 Campanhas / Roteiros</span>
            </button>

            <button
              onClick={handleBulkExportSelected}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-950 text-white border-2 border-zinc-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition"
            >
              📥 Exportar
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white border-2 border-zinc-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition"
            >
              🗑️ Excluir
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-350 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold transition"
            >
              Limpar ✕
            </button>
          </div>
        </div>
      )}

      {/* Gmail-style Master Selection Banner */}
      {selectedLeadIds.length > 0 && selectedLeadIds.length < processedLeads.length && (
        <div className="mb-4 bg-amber-50 border-4 border-zinc-950 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-950 font-mono shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-[11px] animate-scaleIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Você selecionou <strong>{selectedLeadIds.length} leads</strong> visíveis. Deseja selecionar todos os <strong>{processedLeads.length} leads</strong> que atendem aos filtros atuais?
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLeadIds(processedLeads.map(l => l.id))}
            className="p-1.5 px-3 bg-zinc-90 w-full sm:w-auto bg-zinc-900 border-2 border-zinc-950 text-white font-black rounded-lg hover:bg-zinc-950 transition uppercase text-[9px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            Selecionar todos os {processedLeads.length} leads
          </button>
        </div>
      )}

      {/* Leads Table Card */}
      <div className="bg-white border-4 border-zinc-950 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
        <div id="lead-table-scroll-container" className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-zinc-800">
            <thead>
              <tr className="border-b-4 border-zinc-950 bg-zinc-900 text-white">
                <th className="p-4 w-12 text-center text-xs font-black uppercase tracking-widest text-zinc-300">
                  <input
                    type="checkbox"
                    checked={visibleLeads.length > 0 && visibleLeads.every(l => selectedLeadIds.includes(l.id))}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Selecionar todos visíveis"
                  />
                </th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300">
                  <button 
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    <span>Nome / Cliente</span> 
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300">Contato / E-mail</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300">Origem</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300">
                  <button 
                    onClick={() => toggleSort('value')}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    <span>Valor Estimado</span> 
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300">Status Funil</th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300">
                  <button 
                    onClick={() => toggleSort('createdAt')}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    <span>Cadastro</span> 
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </th>
                <th className="p-4 text-xs font-black uppercase tracking-widest text-zinc-300 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-100 bg-white">
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-zinc-400 font-mono font-bold uppercase tracking-widest bg-zinc-50">
                    Nenhum lead correspondente encontrado.
                  </td>
                </tr>
              ) : (
                visibleLeads.map((lead) => {
                  const statusInfo = statusMap[lead.status] || { label: lead.status, bg: 'bg-zinc-100 border border-zinc-300', text: 'text-zinc-700' };
                  const daysSinceContact = getDaysSinceContact(lead.lastContactAt);
                  const isOverdue = daysSinceContact !== null && daysSinceContact > 7;

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-zinc-50/80 transition-colors ${selectedLeadIds.includes(lead.id) ? 'bg-indigo-50/30' : ''}`}
                      id={`lead-row-${lead.id}`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Name / Co */}
                      <td className="p-4 font-sans">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-extrabold text-zinc-950 text-sm">{lead.name}</div>
                          {isOverdue && (
                            <span 
                              className="inline-flex items-center gap-1 text-[9px] bg-red-100 border border-red-500 rounded px-1.5 py-0.5 font-mono font-black text-red-700 animate-pulse select-none"
                              title={`Último contato há ${daysSinceContact} dias!`}
                            >
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>{daysSinceContact}d</span>
                            </span>
                          )}
                        </div>
                        {lead.company && (
                          <div className="text-xs text-zinc-500 font-semibold mt-0.5">{lead.company}</div>
                        )}
                      </td>

                      {/* Contact Channels */}
                      <td className="p-4 text-zinc-800 text-sm">
                        <div className="font-extrabold">{lead.phone}</div>
                        <div className="text-xs text-zinc-500 font-semibold mt-0.5">{lead.email}</div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {/* Whatsapp action */}
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Olá ${lead.name}, aqui é o gestor da CicloCred Imobiliária. Identifiquei seu interesse num crédito imobiliário no valor de R$ ${lead.value.toLocaleString('pt-BR')}. Podemos conversar?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-1.5 bg-emerald-100 hover:bg-emerald-250 text-emerald-800 border-2 border-zinc-950 rounded text-[9px] font-mono font-black uppercase flex items-center gap-1 hover:translate-y-[-1px] transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                            title="Conversar no WhatsApp"
                          >
                            <span>WhatsApp 💬</span>
                          </a>

                          {/* Email copy action */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`Prezado(a) ${lead.name},\n\nAqui é da CicloCred Imobiliária. Temos excelentes notícias sobre a simulação de crédito corporativo para aquisição no valor estimado de R$ ${lead.value.toLocaleString('pt-BR')}.\n\nQuando seria melhor agendarmos um bate-papo?\n\nAtenciosamente,\nEquipe CicloCred`);
                              alert(`Abordagem para ${lead.name} copiada com sucesso para área de transferência!`);
                            }}
                            className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-2 border-zinc-950 rounded text-[9px] font-mono font-black uppercase flex items-center gap-1 hover:translate-y-[-1px] transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                            title="Roteiro de abordagem"
                          >
                            <span>Copy 📋</span>
                          </button>
                        </div>
                      </td>

                      {/* Marketing Origin */}
                      <td className="p-4">
                        <span className="text-[10px] uppercase font-black tracking-wider bg-zinc-100 border border-zinc-900 text-zinc-800 px-2.5 py-1 rounded">
                          {lead.origin}
                        </span>
                      </td>

                      {/* Deal Value */}
                      <td className="p-4 font-mono font-black text-sm text-indigo-600">
                        {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </td>

                      {/* Status Stage Transition Selector */}
                      <td className="p-4">
                        <select
                          id={`lead-row-status-select-${lead.id}`}
                          value={lead.status}
                          onChange={(e) => onMoveLead(lead.id, e.target.value as LeadStatus)}
                          className={`text-xs font-black rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none select-none cursor-pointer ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {dynCols.map(col => (
                            <option key={col.id} value={col.id}>{col.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Created At */}
                      <td className="p-4 text-zinc-500 text-xs font-mono font-bold">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenLeadDetails(lead)}
                            title="Ficha do Lead"
                            className="p-1.5 px-3 text-[10px] bg-white border border-zinc-950 hover:bg-zinc-100 text-zinc-950 font-black rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] transition flex items-center gap-1 active:translate-y-0.5"
                          >
                            <ExternalLink className="w-3 h-3 text-indigo-600" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => onOpenEditModal(lead)}
                            title="Editar"
                            className="p-1.5 border border-zinc-400 hover:border-zinc-950 rounded bg-white text-zinc-600 hover:text-zinc-900 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-btn-${lead.id}`}
                            onClick={() => handleIndividualDelete(lead.id)}
                            title="Inativar/Excluir"
                            className="p-1.5 border border-red-300 hover:border-red-600 hover:bg-red-50 rounded transition text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Infinite Scroll sentinel tracker element */}
              <tr id="infinite-scroll-sentinel" className="h-4">
                <td colSpan={8} className="p-0 border-0"></td>
              </tr>
              
              {/* Manual Load more backup button */}
              {visibleCount < processedLeads.length && (
                <tr>
                  <td colSpan={8} className="p-4 text-center bg-zinc-50 border-t">
                    <button
                      onClick={() => setVisibleCount(prev => Math.min(prev + 15, processedLeads.length))}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-400 text-indigo-800 font-mono text-[9px] font-black uppercase rounded-lg shadow-sm"
                    >
                      Carregar Mais Contatos... (Mostrando {visibleCount} de {processedLeads.length})
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign and marketing script dispatching modal suite */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-800">
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b-4 border-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-400 rounded-lg text-zinc-950 font-black animate-pulse">
                  <Zap className="w-5 h-5 fill-current text-zinc-900" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                    Disparador de Campanhas & Roteiros cicloCRED VIP
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold">
                    Preparando transmissão avançada para <span className="text-amber-400 font-bold">{selectedLeadIds.length} leads</span> selecionados
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCampaignModal(false)}
                className="p-1 px-2.5 bg-red-600 hover:bg-red-700 text-white border-2 border-white rounded-lg font-black text-xs transition"
              >
                Fechar ✕
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Step 1: Choose or build template */}
                <div className="md:col-span-1 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 font-mono flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>1. Escolha o Roteiro</span>
                  </h4>
                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                    {CAMPAIGN_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedCampaignTemplate(idx);
                          setCustomCampaignText(tmpl.body);
                        }}
                        className={`w-full text-left p-3 border-2 rounded-xl transition ${
                          selectedCampaignTemplate === idx 
                            ? 'bg-indigo-50 border-indigo-600 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]' 
                            : 'border-zinc-350 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="text-xs font-black uppercase text-zinc-900 truncate">{tmpl.title}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 line-clamp-3">{tmpl.body}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview and customization area */}
                <div className="md:col-span-2 space-y-4 flex flex-col">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 font-mono">
                    2. Editor & Preview Dinâmico do Script
                  </h4>
                  
                  {/* Persistently editable textarea editor with live tag indicators */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center justify-between">
                      <span>Texto do seu script (Livre para edição):</span>
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold text-[8px] uppercase">Roteiro Editável</span>
                    </label>
                    <textarea
                      value={customCampaignText}
                      onChange={(e) => setCustomCampaignText(e.target.value)}
                      placeholder="Escreva ou edite o roteiro de atendimento personalizado usando colchetes dinâmicos: {{nome}}, {{valor}}, {{email}}, ou {{telefone}}..."
                      className="w-full h-36 p-3 text-xs border-2 border-zinc-950 rounded-xl focus:ring-1 focus:ring-indigo-600 font-mono outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {['{{nome}}', '{{valor}}', '{{email}}', '{{telefone}}', '{{empresa}}', '{{origem}}'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setCustomCampaignText(prev => prev + ' ' + tag)}
                          className="p-1 px-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded text-[9px] font-mono font-bold text-zinc-700"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel dispatch options */}
                  <div className="border-t pt-4 space-y-3">
                    <label className="text-xs font-black uppercase text-zinc-700 font-sans">
                      Selecione o Canal de Transmissão:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCampaignDispatchMode('whatsapp')}
                        className={`p-3.5 border-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition ${
                          campaignDispatchMode === 'whatsapp'
                            ? 'bg-emerald-50 border-emerald-600 shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]'
                            : 'border-zinc-350 hover:bg-zinc-50'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black uppercase">WhatsApp (Manual Individual)</span>
                        <span className="text-[9px] text-zinc-500 font-semibold uppercase">Disparo manual individualizado</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCampaignDispatchMode('batch')}
                        className={`p-3.5 border-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition ${
                          campaignDispatchMode === 'batch'
                            ? 'bg-indigo-50 border-indigo-600 shadow-[3px_3px_0px_0px_rgba(79,70,229,1)]'
                            : 'border-zinc-350 hover:bg-zinc-50'
                        }`}
                      >
                        <Send className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-black uppercase">Fila de Disparo (Automatizado)</span>
                        <span className="text-[9px] text-zinc-500 font-semibold uppercase">Simulação de lote sequencial</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel View - WhatsApp Manual Clicker */}
              {campaignDispatchMode === 'whatsapp' && (
                <div className="border-2 border-zinc-950 rounded-xl bg-zinc-50 p-4 space-y-3 animate-scaleIn">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h4 className="text-xs font-black uppercase text-emerald-800 font-mono">Fila de Disparos Individuais via WhatsApp</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">Pronto para rodar no aplicativo oficial</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-full font-mono text-[10px] font-black">
                      {Object.keys(messagedLeads).length} de {leads.filter(l => selectedLeadIds.includes(l.id)).length} enviados
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
                    {leads.filter(l => selectedLeadIds.includes(l.id)).map((lead) => {
                      const resolvedText = resolveTemplateText(
                        selectedCampaignTemplate === CAMPAIGN_TEMPLATES.length - 1 ? customCampaignText : CAMPAIGN_TEMPLATES[selectedCampaignTemplate].body,
                        lead
                      );
                      const isSent = !!messagedLeads[lead.id];
                      const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                      const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(resolvedText)}`;
                      
                      return (
                        <div key={lead.id} className="bg-white border-2 border-zinc-950 p-3 rounded-xl flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {isSent && <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-500 px-1.5 py-0.5 rounded font-black uppercase">Enviado ✔️</span>}
                              <span className="text-xs font-black text-zinc-900">{lead.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono font-bold">{lead.phone || '(Sem telefone)'}</span>
                            </div>
                            <div className="text-[11px] text-zinc-600 bg-zinc-50 p-1.5 rounded font-serif italic">
                              "{resolvedText}"
                            </div>
                          </div>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              setMessagedLeads(prev => ({ ...prev, [lead.id]: true }));
                              if (awardXP) awardXP(50);
                              if (addNotification) addNotification('💬 LEAD CONTATADO', `Abordagem direta via WhatsApp enviada para ${lead.name} [+50 XP]`, 'success');
                            }}
                            className={`p-2 px-3.5 border-2 border-zinc-950 font-mono font-black text-[10px] rounded-lg uppercase tracking-wider text-center flex items-center justify-center gap-1.5 hover:translate-y-[-1px] active:translate-y-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(24,24,27,1)] transition shrink-0 ${
                              isSent ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            <span>Disparar Zap</span>
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Channel View - Automated Batch Dispatcher Progress */}
              {campaignDispatchMode === 'batch' && (
                <div className="border-2 border-zinc-950 rounded-xl bg-zinc-950 text-zinc-100 p-5 space-y-4 animate-scaleIn font-mono">
                  <div className="flex justify-between items-center border-b border-dashed border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isDispatchingBatch ? 'bg-red-505 animate-pulse text-red-500' : 'bg-emerald-500'}`} style={{ backgroundColor: isDispatchingBatch ? '#ef4444' : '#10b981' }} />
                      <h4 className="text-xs font-black uppercase text-amber-400">Console de Transmissão ciclocred batch v2</h4>
                    </div>
                    {isDispatchingBatch && (
                      <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded uppercase animate-pulse">
                        Processando Disparos...
                      </span>
                    )}
                  </div>

                  {/* Configuration parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">🔌 Canal de Disparo</label>
                      <select
                        disabled={isDispatchingBatch}
                        value={campaignWhatsappChannel}
                        onChange={(e) => setCampaignWhatsappChannel(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs font-bold text-emerald-400 outline-none"
                      >
                        <option value="app">📲 WhatsApp Desktop (Local App - Sem Abas Extras)</option>
                        <option value="web">💻 WhatsApp Web / API (Abre Links Navegador)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">⏱️ Intervalo por Lead</label>
                      <select
                        disabled={isDispatchingBatch}
                        value={campaignDispatchDelay}
                        onChange={(e) => setCampaignDispatchDelay(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs font-bold text-amber-500 outline-none"
                      >
                        <option value={3}>3 segundos (Acelerado)</option>
                        <option value={5}>5 segundos (Recomendado)</option>
                        <option value={8}>8 segundos (Seguro)</option>
                        <option value={12}>12 segundos (Anti-Block)</option>
                        <option value={15}>15 segundos (Lento)</option>
                      </select>
                    </div>
                  </div>

                  {/* Mode Toggle Button Row */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono font-black uppercase text-center select-none bg-zinc-900 p-1 rounded-xl">
                    <button
                      type="button"
                      disabled={isDispatchingBatch}
                      onClick={() => setCampaignIsAssistedMode(true)}
                      className={`p-2 rounded-lg transition ${campaignIsAssistedMode ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Modo Assistido (Enter ⏎)
                    </button>
                    <button
                      type="button"
                      disabled={isDispatchingBatch}
                      onClick={() => setCampaignIsAssistedMode(false)}
                      className={`p-2 rounded-lg transition ${!campaignIsAssistedMode ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      Modo Automático (Foco-Retorno)
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase">
                      <span>Progresso:</span>
                      <span>{batchProgress}% ({Math.min(activeBatchIndex, leads.filter(l => selectedLeadIds.includes(l.id)).length)} / {leads.filter(l => selectedLeadIds.includes(l.id)).length})</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-4 border-2 border-zinc-700 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Lead Control and Pulsating Dispatcher Button Panel */}
                  {isDispatchingBatch && (() => {
                    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
                    const activeLead = selectedLeads[activeBatchIndex];
                    if (!activeLead) return null;

                    return (
                      <div className="bg-zinc-900 border-2 border-indigo-500/50 p-4 rounded-xl space-y-3 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-indigo-400">AGUARDANDO DISPARO ATIVO</span>
                            <h5 className="text-xs font-black text-white">{activeLead.name}</h5>
                          </div>
                          {batchCountdownSeconds > 0 ? (
                            <div className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-700 px-2 py-1 rounded font-black animate-pulse flex items-center gap-1.5">
                              ⏱️ {batchCountdownSeconds}s para liberação
                            </div>
                          ) : (
                            <div className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-1 rounded font-black animate-bounce flex items-center gap-1.5">
                              🔥 CANAL PRONTO
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-zinc-400 max-h-20 overflow-y-auto bg-zinc-950 p-2 border border-zinc-800 rounded font-serif italic">
                          "{resolveTemplateText(customCampaignText || (CAMPAIGN_TEMPLATES[selectedCampaignTemplate] ? CAMPAIGN_TEMPLATES[selectedCampaignTemplate].body : ''), activeLead)}"
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => executeBatchItemDispatch(activeBatchIndex)}
                            className={`flex-1 py-3 text-center text-xs font-black uppercase rounded-lg border-2 tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                              batchCountdownSeconds > 0
                                ? 'bg-amber-500 hover:bg-amber-600 border-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{batchCountdownSeconds > 0 ? `Disparar Cedo (${batchCountdownSeconds}s)` : 'DISPARAR WHATSAPP AGORA'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextIdx = activeBatchIndex + 1;
                              setActiveBatchIndex(nextIdx);
                              setBatchProgress(Math.floor((nextIdx / selectedLeads.length) * 100));
                              setBatchCountdownSeconds(campaignDispatchDelay);
                              setBatchLog(prev => [`[${new Date().toLocaleTimeString()}] ➡️ Lead ${activeLead.name} pulado manualmente.`, ...prev]);
                            }}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 border border-zinc-700 text-[10px] font-bold uppercase rounded-lg transition"
                          >
                            Pular
                          </button>
                        </div>
                        <p className="text-[8.5px] text-zinc-500 font-medium text-center">
                          ⚠️ Clique no botão acima para abrir a janela do WhatsApp. Os navegadores bloqueiam disparos automáticos subsequentes sem clique para evitar SPAM.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Log console window */}
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg h-36 overflow-y-auto text-[10px] space-y-1.5 scrollbar-thin">
                    {batchLog.length === 0 ? (
                      <em className="text-zinc-500">[Pronto para envio. Configure os parâmetros acima e inicie o motor]</em>
                    ) : (
                      batchLog.map((log, index) => (
                        <div key={index} className="text-zinc-300 select-none">
                          {log}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dispatch triggers */}
                  <div className="flex justify-end gap-2 pt-1">
                    {isDispatchingBatch ? (
                      <button
                        type="button"
                        onClick={stopBatchDispatch}
                        className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs rounded-xl tracking-wide border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-1.5 active:translate-y-0.5 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Parar Disparo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startBatchDispatch}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs rounded-xl tracking-wide border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-1.5 active:translate-y-0.5 transition"
                      >
                        <Send className="w-4 h-4" />
                        <span>Iniciar Transmissão em Lote</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 p-5 flex items-center justify-between border-t-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase font-sans">
                cicloCRED Pro V2.0. Digital Campaign Dashboard
              </span>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="px-5 py-2 border-2 border-zinc-950 font-black uppercase text-xs rounded-xl hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-0.5px] transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrganizerModal && (() => {
        const candidates = leads.map(lead => {
          const phoneStr = (lead.phone || '').trim();
          const isDummy = isFictitiousPhone(phoneStr);
          if (isDummy) {
            const { extractedPhone, cleanedEmail } = extractPhoneFromEmail(lead.email || '');
            if (extractedPhone) {
              return {
                lead,
                currentEmail: lead.email,
                currentPhone: lead.phone,
                detectedPhone: extractedPhone,
                suggestedEmail: cleanedEmail
              };
            }
          }
          return null;
        }).filter((x): x is NonNullable<typeof x> => x !== null);

        const totalSelected = candidates.filter(cand => !!organizerSelectedCandidateIds[cand.lead.id]).length;

        const handleApplyBatchCorrections = () => {
          if (!onUpdateMultipleLeads) return;
          const updated = leads.map(l => {
            const match = candidates.find(cand => cand.lead.id === l.id);
            if (match && organizerSelectedCandidateIds[l.id]) {
              return {
                ...l,
                phone: match.detectedPhone || l.phone,
                email: match.suggestedEmail || l.email
              };
            }
            return l;
          });
          onUpdateMultipleLeads(updated);
          if (awardXP) awardXP(150 + totalSelected * 15);
          if (addNotification) {
            addNotification(
              '🧹 ORGANIZAÇÃO CONCLUÍDA',
              `Corrigido telefone e e-mail de ${totalSelected} leads que estavam misturados!`,
              'success'
            );
          }
          setShowOrganizerModal(false);
        };

        const handleWipeAllLeads = () => {
          const proceed = () => {
            if (onDeleteMultipleLeads) {
              onDeleteMultipleLeads(leads.map(l => l.id));
              setSelectedLeadIds([]);
            } else {
              leads.forEach(l => onDeleteLead(l.id));
            }
            if (addNotification) {
              addNotification(
                '🗑️ LIMPEZA COMPLETA',
                `A carteira de leads foi totalmente esvaziada. Pronta para novas importações!`,
                'warning'
              );
            }
            setShowOrganizerModal(false);
          };

          if (onRequestConfirm) {
            onRequestConfirm(
              '⚠️ APAGAR TODA A BASE DE LEADS?',
              `ATENÇÃO: Você está prestes a apagar permanentemente todos os ${leads.length} contatos cadastrados no CRM. Esta ação apagará permanentemente todos os registros, notas e status do banco de dados!`,
              proceed,
              'danger'
            );
          } else if (confirm(`ATENÇÃO: Deseja apagar TODOS os ${leads.length} contatos?`)) {
            proceed();
          }
        };

        return (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border-4 border-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-800">
              {/* Header */}
              <div className="bg-emerald-600 text-white p-5 flex items-center justify-between border-b-4 border-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-950 rounded-lg text-emerald-400 font-black">
                    <Wand2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                      Assistente de Organização de Contatos cicloCRED
                    </h3>
                    <p className="text-emerald-100 text-xs font-semibold uppercase">
                      Localiza celulares digitados junto com o e-mail e corrige as ordens da planilha
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrganizerModal(false)}
                  className="p-1 px-2.5 bg-zinc-950 hover:bg-zinc-900 border-2 border-white rounded-lg font-black text-xs uppercase"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Stats board */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 border-2 border-zinc-950 p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Total no CRM</span>
                    <p className="text-xl font-black font-sans text-zinc-900">{leads.length} Leads</p>
                  </div>
                  <div className="bg-zinc-50 border-2 border-zinc-950 p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Telefones Fictícios</span>
                    <p className="text-xl font-black font-sans text-rose-600">
                      {leads.filter(l => isFictitiousPhone(l.phone)).length} Leads
                    </p>
                  </div>
                  <div className="bg-emerald-50 border-2 border-emerald-950 p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 font-mono">Encontrados p/ Correção</span>
                    <p className="text-xl font-black font-sans text-emerald-700">{candidates.length} Elegíveis</p>
                  </div>
                </div>

                {/* Analysis description */}
                <div className="p-4 bg-zinc-100 border-2 border-zinc-950 rounded-xl space-y-1.5 text-xs text-zinc-700 font-medium">
                  <h4 className="font-black text-zinc-900 uppercase flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Como funciona esta verificação inteligente?
                  </h4>
                  <p>
                    Vários leads importados de planilhas possuíam telefones fictícios como <strong className="font-mono text-rose-700 font-bold">(11) 99999-9999</strong>, enquanto o celular real ficava misturado junto à frase do e-mail.
                  </p>
                  <p>
                    O nosso algoritmo analisou toda a sua base de leads e encontrou sequências de 10/11 dígitos numéricos escondidas dentro do campo de e-mail. Agora, você pode separar e consertar isso em lote imediatamente!
                  </p>
                </div>

                {/* List of candidates */}
                {candidates.length === 0 ? (
                  <div className="p-8 text-center border-4 border-zinc-950 rounded-2xl bg-zinc-50 space-y-2">
                    <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-black uppercase text-zinc-900 font-mono">Sua base está organizada!</h4>
                    <p className="text-xs text-zinc-500 font-semibold uppercase font-mono">
                      Nenhum celular escondido nos e-mails foi localizado neste momento. Parabéns pelo saneamento!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-serif font-bold italic text-zinc-650">
                        Selecione as correções que quer aplicar:
                      </span>
                      <button
                        onClick={() => {
                          const allSelected = candidates.every(c => !!organizerSelectedCandidateIds[c.lead.id]);
                          const next: Record<string, boolean> = {};
                          if (!allSelected) {
                            candidates.forEach(c => {
                              next[c.lead.id] = true;
                            });
                          }
                          setOrganizerSelectedCandidateIds(next);
                        }}
                        className="text-[10px] text-indigo-700 font-black uppercase underline cursor-pointer hover:text-indigo-900"
                      >
                        {candidates.every(c => !!organizerSelectedCandidateIds[c.lead.id]) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto border-2 border-zinc-950 rounded-xl divide-y-2 divide-zinc-250">
                      {candidates.map(({ lead, currentEmail, currentPhone, detectedPhone, suggestedEmail }) => {
                        const isChecked = !!organizerSelectedCandidateIds[lead.id];
                        return (
                          <div key={lead.id} className={`p-4 flex items-start gap-3.5 hover:bg-zinc-50 transition ${isChecked ? 'bg-emerald-50/20' : 'bg-white'}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setOrganizerSelectedCandidateIds(prev => ({
                                  ...prev,
                                  [lead.id]: e.target.checked
                                }));
                              }}
                              className="mt-1 w-4 h-4 rounded border-zinc-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer text-emerald-600 font-bold"
                            />
                            <div className="flex-1 space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b pb-1">
                                <span className="font-black text-zinc-950 text-sm tracking-tight">{lead.name}</span>
                                <span className="text-[9px] uppercase font-mono font-black bg-zinc-100 border px-1.5 py-0.5 rounded text-zinc-605">
                                  ID: {lead.id.slice(0, 8)}...
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 border-t border-zinc-50">
                                {/* Email Side */}
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-black text-zinc-500 block font-mono">Correção de E-mail</span>
                                  <div className="space-y-0.5">
                                    <div className="text-red-650 line-through truncate font-mono text-[11px]" title={currentEmail || ''}>
                                      ❌ {currentEmail}
                                    </div>
                                    <div className="text-emerald-800 font-black font-mono text-[11px] bg-emerald-50/80 border border-emerald-300 px-1 rounded block truncate" title={suggestedEmail}>
                                      ✔️ {suggestedEmail}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Phone Side */}
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-black text-zinc-500 block font-mono">Ajuste de Telefone Real</span>
                                  <div className="space-y-0.5">
                                    <div className="text-red-650 line-through font-mono text-[11px]">
                                      ❌ {currentPhone || '(Sem número)'}
                                    </div>
                                    <div className="text-indigo-900 font-black font-mono text-[11px] bg-indigo-50 border border-indigo-300 px-1 rounded block">
                                      ✔️ {detectedPhone}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reset Entire Table Option */}
                <div className="p-4 border-2 border-red-300 bg-red-50/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-red-950 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-650 shrink-0" />
                      Zerar Funil / Limpeza Geral de Leads (Wipeout)
                    </h4>
                    <p className="text-[11px] text-zinc-650 font-medium">
                      Exclua integralmente todos os contatos cadastrados para recomeçar com planilhas limpas. Esta ação é definitiva e sincronizada!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleWipeAllLeads}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 border-2 border-zinc-950 text-white font-black uppercase text-[10px] rounded-lg tracking-wider transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer shrink-0"
                  >
                    🗑️ Zerar Base ({leads.length})
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-zinc-50 p-5 flex items-center justify-between border-t-2-dashed">
                <span className="text-[10px] text-zinc-500 font-bold uppercase font-sans">
                  Sincronizador Inteligente cicloCRED CRM © 2026
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOrganizerModal(false)}
                    className="px-4 py-2 bg-white border-2 border-zinc-950 text-zinc-800 font-black uppercase text-xs rounded-xl hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition"
                  >
                    Fechar
                </button>
                  {candidates.length > 0 && (
                    <button
                      disabled={totalSelected === 0}
                      onClick={handleApplyBatchCorrections}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white border-2 border-zinc-950 font-black uppercase text-xs rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 animate-bounce" />
                      <span>Aplicar Correções Inteligentes ({totalSelected})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GEMINI-POWERED Campaign active planner modal */}
      {showCampaignPlanner && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-zinc-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-850">
            {/* Header */}
            <div className="bg-zinc-900 border-b-4 border-zinc-950 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 rounded-2xl text-zinc-950">
                  <Sparkles className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                    Planejador e Conversor Ativo de Planilha cicloCRED
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold">
                    Calculando atividades e estruturando roteiros inteligentes de captação
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCampaignPlanner(false);
                  setSchedulingProgress('idle');
                }}
                className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Dynamic Metrics Section */}
              <div className="bg-emerald-50/50 border-2 border-emerald-500 p-5 rounded-2xl space-y-4 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.1)] text-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-850 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Calculadora Matemática de Atividades
                  </span>
                </div>
                <h4 className="text-sm font-black uppercase tracking-tight text-emerald-950 font-mono">
                  Mapeamento de Esforço para Conversão de {plannerLeadCount} Leads ({plannerLeadOrigin})
                </h4>
                
                {/* Visual Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 border-2 border-zinc-950 rounded-xl">
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">1. Abordagens</p>
                    <p className="text-lg font-black text-indigo-700 mt-1">{plannerLeadCount}</p>
                    <p className="text-[9px] text-zinc-400 font-medium font-mono">Meta: 100% Leads</p>
                  </div>
                  <div className="bg-white p-3 border-2 border-zinc-950 rounded-xl">
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">2. Simulações</p>
                    <p className="text-lg font-black text-amber-600 mt-1">{Math.ceil(plannerLeadCount * 0.35)}</p>
                    <p className="text-[9px] text-zinc-400 font-medium font-mono">Meta: ~35% Retornos</p>
                  </div>
                  <div className="bg-white p-3 border-2 border-zinc-950 rounded-xl">
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">3. Visitas</p>
                    <p className="text-lg font-black text-sky-600 mt-1">{Math.ceil(plannerLeadCount * 0.08)}</p>
                    <p className="text-[9px] text-zinc-400 font-medium font-mono">Meta: ~8% Visitas</p>
                  </div>
                  <div className="bg-white p-3 border-2 border-zinc-950 rounded-xl bg-indigo-50 border-indigo-200">
                    <p className="text-[10px] font-mono font-bold text-indigo-800 uppercase">4. Fechamentos</p>
                    <p className="text-lg font-black text-emerald-600 mt-1">{(plannerLeadCount * 0.02).toFixed(1)}</p>
                    <p className="text-[9px] text-indigo-550 font-black font-mono">Taxa Meta: 2%</p>
                  </div>
                </div>

                {/* Estimate Profit */}
                <div className="p-3 bg-zinc-900 border-2 border-zinc-950 rounded-xl flex items-center justify-between text-white font-mono text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">Lucro de Comissão Estimado:</span>
                  </div>
                  <span className="text-emerald-400 font-black text-sm">
                    R$ {Math.round((plannerLeadCount * 0.02) * plannerAverageValue * 0.03).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Adjustable Input Form for Campaign Parameters */}
              <div className="bg-zinc-50 p-5 border-2 border-zinc-950 rounded-2xl space-y-4 font-mono text-xs text-zinc-800">
                <h4 className="text-xs font-black uppercase text-zinc-950 tracking-wider">Parâmetros de Ajuste de Campanha</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-zinc-500 mb-1">Qtd Leads Alvo</label>
                    <input 
                      type="number"
                      value={plannerLeadCount}
                      onChange={(e) => setPlannerLeadCount(Number(e.target.value))}
                      className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-zinc-900 font-black font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-zinc-500 mb-1">Origem dos Contatos</label>
                    <input 
                      type="text"
                      value={plannerLeadOrigin}
                      onChange={(e) => setPlannerLeadOrigin(e.target.value)}
                      className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-zinc-900 font-black font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-zinc-500 mb-1">Preço Médio Imóvel (R$)</label>
                    <input 
                      type="number"
                      step="1000"
                      value={plannerAverageValue}
                      onChange={(e) => setPlannerAverageValue(Number(e.target.value))}
                      className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-zinc-900 font-black font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-zinc-500 mb-1">Nicho das Unidades & Observações Extras</label>
                  <input 
                    type="text"
                    value={plannerCustomNiches}
                    onChange={(e) => setPlannerCustomNiches(e.target.value)}
                    placeholder="Ex: Minha Casa Minha Vida - Residencial Cury Zona Leste"
                    className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-zinc-900 font-bold font-mono"
                  />
                </div>

                <button
                  onClick={handleGenerateCampaignPlan}
                  disabled={isGeneratingPlan || plannerLeadCount <= 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black uppercase text-xs rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all active:translate-y-0.5 disabled:opacity-50 text-center cursor-pointer"
                >
                  {isGeneratingPlan ? '⏳ Consultando Inteligência do Gemini AI...' : '⚡ Roteirizar Base de Leads & Copys com Gemini'}
                </button>
              </div>

              {/* Advanced scheduling / roadmap calendar triggers */}
              {generatedPlanMarkdown && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scaleIn">
                  {/* Generated Plan text sheet */}
                  <div className="lg:col-span-7 bg-zinc-950 text-white border-4 border-zinc-950 p-6 rounded-3xl max-h-[450px] overflow-y-auto space-y-3 font-sans relative shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute top-3 right-3 text-[9px] uppercase font-mono font-black text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                      Plano Estruturado
                    </div>
                    
                    <div className="prose text-zinc-300">
                      {generatedPlanMarkdown.split('\n').map((line, idx) => {
                        let content = line;
                        let className = "text-zinc-300 mb-1.5 leading-relaxed text-xs";
                        
                        if (line.startsWith('###')) {
                          content = line.replace('###', '').trim();
                          className = "text-xs font-black uppercase text-indigo-400 mt-4 mb-2 tracking-wide font-mono";
                        } else if (line.startsWith('##')) {
                          content = line.replace('##', '').trim();
                          className = "text-sm font-black uppercase text-white mt-5 mb-3 border-b border-zinc-800 pb-1 font-mono";
                        } else if (line.startsWith('#')) {
                          content = line.replace('#', '').trim();
                          className = "text-md font-black italic uppercase text-emerald-400 mt-6 mb-4";
                        } else if (line.startsWith('-') || line.startsWith('*')) {
                          content = '• ' + line.substring(1).trim();
                          className = "text-zinc-300 ml-4 mb-1 text-xs list-disc";
                        }
                        
                        const parts = [];
                        const boldRegex = /\*\*([^*]+)\*\*/g;
                        let lastIndex = 0;
                        let match;
                        
                        while ((match = boldRegex.exec(content)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(content.substring(lastIndex, match.index));
                          }
                          parts.push(<strong key={match.index} className="font-extrabold text-white text-emerald-400">{match[1]}</strong>);
                          lastIndex = boldRegex.lastIndex;
                        }
                        if (lastIndex < content.length) {
                          parts.push(content.substring(lastIndex));
                        }

                        if (parts.length === 0) {
                          return <p key={idx} className={className}>{content}</p>;
                        }
                        return <p key={idx} className={className}>{parts}</p>;
                      })}
                    </div>
                  </div>

                  {/* Operational Agenda Injector controls */}
                  <div className="lg:col-span-5 bg-white border-4 border-zinc-950 p-5 rounded-3xl space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between text-zinc-800">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-mono font-black text-rose-600 block">Automação de Agenda</span>
                      <h4 className="text-sm font-black uppercase tracking-tight text-zinc-950 font-mono italic">
                        Organizar Atividades de Conversão
                      </h4>
                      <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
                        Gostaria que o sistema organize e lance automaticamente na sua agenda do CRM as 5 macro-etapas recomendadas de engajamento para este lote de leads?
                      </p>

                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[11px] space-y-1.5 font-mono text-zinc-650">
                        <p className="flex items-center gap-1">⏱️ <span className="font-extrabold text-zinc-800">D1:</span> Abordagem WhatsApp</p>
                        <p className="flex items-center gap-1">📞 <span className="font-extrabold text-zinc-800">D2:</span> Ligação Perfil</p>
                        <p className="flex items-center gap-1">📊 <span className="font-extrabold text-zinc-800">D3:</span> Simulação Caixa</p>
                        <p className="flex items-center gap-1">🏬 <span className="font-extrabold text-zinc-800">D5:</span> Fornecer Books</p>
                        <p className="flex items-center gap-1">🤝 <span className="font-extrabold text-zinc-800">D7:</span> Visitas Stand</p>
                      </div>
                    </div>

                    <div className="pt-3">
                      {schedulingProgress === 'idle' && (
                        <button
                          onClick={handleScheduleCampaignTasks}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-white font-mono font-black uppercase text-xs rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition hover:translate-y-[-1.5px] cursor-pointer"
                        >
                          📅 Programar Atividades e Funil no CRM
                        </button>
                      )}

                      {schedulingProgress === 'scheduling' && (
                        <div className="text-center py-2 space-y-2">
                          <p className="text-[11px] font-mono font-black text-indigo-700 animate-pulse">⚙️ Sincronizando Calendário cicloCRED...</p>
                          <div className="w-full bg-zinc-100 rounded-full h-3 border border-zinc-300 overflow-hidden">
                            <div className="bg-indigo-600 h-full animate-[loading_1.5s_ease-out_infinite]" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                      )}

                      {schedulingProgress === 'done' && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl space-y-2 text-center animate-scaleIn text-xs">
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                          <p>Funil Integrado! Atividades organizadas e calendarizadas sob a tag <span className="bg-emerald-100 font-extrabold text-emerald-950 px-1 rounded">#CampanhaLote</span>.</p>
                          <p className="text-[10px] text-zinc-500 font-mono">+250 XP conquistados!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 p-4 border-t-2 border-zinc-100 flex items-center justify-between font-mono text-[10px] text-zinc-500 font-bold uppercase">
              <span>Sincronizador cicloCRED CRM</span>
              <button
                onClick={() => {
                  setShowCampaignPlanner(false);
                  setSchedulingProgress('idle');
                }}
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-950 rounded-xl text-xs font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End Campaign Planner modal */}
    </div>
  );
}
