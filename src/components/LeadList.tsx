/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lead, LeadStatus, Appointment } from '../types';
import ScheduleFollowUpModal from './ScheduleFollowUpModal';
import FinanceSimulatorTab from './FinanceSimulatorTab';
import { getKanbanColumns } from '../utils/kanban';
import { triggerSensoryFeedback, AccessibilitySettings, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';
import { auth } from '../firebase';
import * as XLSX from 'xlsx';
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
  Check,
  RotateCw,
  Globe,
  BookOpen,
  MessageCircle, 
  Phone, 
  Bell, 
  Bot, 
  FileText,
  ListTree,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { handleWhatsAppAction, autoGenerateScript as advancedAutoGenerateScript } from '../utils/whatsapp';
import { cn } from '../lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';

interface LeadListProps {
  leads: Lead[];
  tableHeaderComponent?: React.ReactNode | ((selectedLeadIds: string[], actions: { openCampaignModal: () => void; openBulkScheduleModal: () => void }) => React.ReactNode);
  onOpenLeadDetails: (lead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenCreateModal: () => void;
  onMoveLead: (leadId: string, newStatus: LeadStatus | string, targetPageId?: string) => void;
  onNavigateToFollowUp?: (lead: Lead) => void;
  onAddBulkLeads?: (newLeads: Lead[]) => void;
  onDeleteMultipleLeads?: (leadIds: string[]) => void;
  onMoveMultipleLeads?: (leadIds: string[], status: LeadStatus) => void;
  onUpdateMultipleLeads?: (updatedLeads: Lead[]) => void;
  onUpdateLeadField?: (leadId: string, fields: Partial<Lead>) => void;
  onRequestConfirm?: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;
  awardXP?: (xp: number) => void;
  addNotification?: (title: string, message: string, type?: any) => void;
  appointments?: any[];
  setAppointments?: any;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  statusFilter?: string;
  setStatusFilter?: (val: string) => void;
  originFilter?: string;
  setOriginFilter?: (val: string) => void;
  initialLetterFilter?: string;
  setInitialLetterFilter?: (val: string) => void;
  regionFilter?: string;
  profileFilter?: string;
  stageFilter?: string;
  objectionFilter?: string;
  programaDesejadoFilter?: string;
  restricaoBacenFilter?: string;
  genderFilter?: string;
  familyIncomeFilter?: string;
  incomeTypeFilter?: string;
  deliveryExpectedFilter?: string;
  externalShowImporter?: boolean;
  setExternalShowImporter?: (val: boolean) => void;
  externalShowPlanner?: boolean;
  setExternalShowPlanner?: (val: boolean) => void;
  onlyImporter?: boolean;
  onOpenAIAssistant?: (lead: Lead) => void;
  onOpenRuleEngine?: (lead: Lead) => void;
  hideRowActionButtons?: boolean;
  isTodosView?: boolean;
  isActiveLeadsView?: boolean;
  isCompactColumns?: boolean;
  maxRows?: number;
  theme?: 'claro' | 'escuro' | 'galatico';
  renderInlineLeadDetails?: (lead: Lead) => React.ReactNode;
}

export function isFictitiousPhone(phone: string | undefined | null): boolean {
  if (!phone) return true;
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return true;
  if (/(\d)\1{5,}/.test(clean)) return true;
  if (clean.includes('1234567') || clean.includes('9876543')) return true;
  return false;
}

const getDaysSinceContact = (lastContactAt?: string): number | null => {
  if (!lastContactAt) return null;
  const cleanStr = lastContactAt.slice(0, 10);
  const parts = cleanStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const contactDate = new Date(year, month, day);
  contactDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date();
  targetDate.setFullYear(2026, 5, 13);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - contactDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export function autoGenerateScript(lead: any): string {
  return advancedAutoGenerateScript(lead);
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

export function extractPhoneFromString(text: string | undefined | null): { extractedPhone: string | null; cleanedText: string } {
  if (!text) return { extractedPhone: null, cleanedText: '' };
  
  const phoneRegexWithDDD = /(?:\+?55\s*)?\(?([1-9][0-9])\)?\s*(9?\s*[0-9]{4})\s*-?\s*([0-9]{4})(?!\d)/;
  const matchWithDDD = text.match(phoneRegexWithDDD);
  
  if (matchWithDDD) {
    const fullMatch = matchWithDDD[0];
    const ddd = matchWithDDD[1];
    const p1 = matchWithDDD[2];
    const p2 = matchWithDDD[3];
    
    // Clean to strict digits
    const rawDigits = (ddd + p1 + p2).replace(/\D/g, '');
    let formatted = '';
    
    if (rawDigits.length >= 10 && rawDigits.length <= 11) {
       formatted = formatBRLPhone(rawDigits);
    } else {
       formatted = rawDigits;
    }
    
    let cleaned = text.replace(fullMatch, '').trim();
    cleaned = cleaned.replace(/^[-_\s()]+|[-_\s()]+$/g, '').trim();
    
    return {
      extractedPhone: formatted,
      cleanedText: cleaned
    };
  }

  // Fallback: look for 8 or 9 digits WITHOUT DDD
  const phoneShortRegex = /(?<!\d)(9?\s*[0-9]{4})\s*-?\s*([0-9]{4})(?!\d)/;
  const matchShort = text.match(phoneShortRegex);
  
  if (matchShort) {
    const fullMatch = matchShort[0];
    const p1 = matchShort[1];
    const p2 = matchShort[2];
    const rawDigits = (p1 + p2).replace(/\D/g, '');
    
    if (rawDigits.length >= 8 && !(rawDigits.length === 8 && (rawDigits.startsWith('19') || rawDigits.startsWith('20')))) {
      let formatted = formatBRLPhone('11' + rawDigits); // Default to SP DDD
      
      let cleaned = text.replace(fullMatch, '').trim();
      cleaned = cleaned.replace(/^[-_\s()]+|[-_\s()]+$/g, '').trim();
      
      return {
        extractedPhone: formatted,
        cleanedText: cleaned
      };
    }
  }

  return { extractedPhone: null, cleanedText: text.trim() };
}
;

export function splitCSVRow(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function processFileOrPasteContent(text: string, origin: string): { parsedItems: Partial<Lead>[], errors: string[] } {
  try {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    const parsedItems: Partial<Lead>[] = [];
    const errors: string[] = [];

    if (lines.length === 0) {
      return { parsedItems: [], errors: [] };
    }

    // Detect separator: Tab, Semicolon, or Comma
    let separator = '\t';
    const tabCount = (text.match(/\t/g) || []).length;
    const semiCount = (text.match(/;/g) || []).length;
    const commaCount = (text.match(/,/g) || []).length;

    if (tabCount >= semiCount && tabCount >= commaCount) {
      separator = '\t';
    } else if (semiCount >= tabCount && semiCount >= commaCount) {
      separator = ';';
    } else if (commaCount >= tabCount) {
      separator = ',';
    }

    const cleanCell = (str: string) => {
      let val = str.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).trim();
      }
      return val;
    };

    const firstLine = lines[0];
    const firstLinePartsRaw = splitCSVRow(firstLine, separator).map(p => cleanCell(p));
    const firstLinePartsCleaned = firstLinePartsRaw.map(p => p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    let nameIdx = -1;
    let phoneIdx = -1;
    let emailIdx = -1;
    let statusIdx = -1;
    let regionIdx = -1;
    let incomeIdx = -1;
    let valueIdx = -1;
    let notesIdx = -1;
    let originIdx = -1;
    let propertyIdx = -1;
    let objectionIdx = -1;
    let genderIdx = -1;
    let ageIdx = -1;
    let cpfIdx = -1;
    let birthIdx = -1;
    let civilIdx = -1;
    let fgtsIdx = -1;
    let bacenIdx = -1;
    let possuiIdx = -1;
    let programaIdx = -1;

    // Search for keywords (handles translation varieties seamlessly)
    firstLinePartsCleaned.forEach((part, idx) => {
      if (part.includes('nome') || part.includes('name') || part.includes('client') || part.includes('lead') || part.includes('contato') || part.includes('proponente')) {
        if (nameIdx === -1) nameIdx = idx;
      } else if (part.includes('telefone') || part.includes('phone') || part.includes('tel') || part.includes('celular') || part.includes('whatsapp') || part.includes('cel') || part.includes('numero')) {
        if (phoneIdx === -1) phoneIdx = idx;
      } else if (part.includes('email') || part.includes('e-mail') || part.includes('mail')) {
        if (emailIdx === -1) emailIdx = idx;
      } else if (part.includes('status') || part.includes('etapa') || part.includes('fase') || part.includes('situac')) {
        if (statusIdx === -1) statusIdx = idx;
      } else if (part.includes('regia') || part.includes('local') || part.includes('uf') || part.includes('zona') || part.includes('cidade') || part.includes('bairro')) {
        if (regionIdx === -1) regionIdx = idx;
      } else if (part.includes('renda') || part.includes('income') || part.includes('faturamento') || part.includes('salari')) {
        if (incomeIdx === -1) incomeIdx = idx;
      } else if (part.includes('valor') || part.includes('value') || part.includes('proposta') || part.includes('budget') || part.includes('credito') || part.includes('potencial') || part.includes('aprovado')) {
        if (valueIdx === -1) valueIdx = idx;
      } else if (part.includes('nota') || part.includes('coment') || part.includes('notes') || part.includes('obs')) {
        if (notesIdx === -1) notesIdx = idx;
      } else if (part.includes('origem') || part.includes('origin') || part.includes('canal')) {
        if (originIdx === -1) originIdx = idx;
      } else if (part.includes('empreendimento') || part.includes('projeto') || part.includes('imovel')) {
        if (propertyIdx === -1) propertyIdx = idx;
      } else if (part.includes('objec') || part.includes('motivo')) {
        if (objectionIdx === -1) objectionIdx = idx;
      } else if (part.includes('genero') || part.includes('sexo')) {
        if (genderIdx === -1) genderIdx = idx;
      } else if (part.includes('idade') || part.includes('faixa')) {
        if (ageIdx === -1) ageIdx = idx;
      } else if (part.includes('cpf')) {
        if (cpfIdx === -1) cpfIdx = idx;
      } else if (part.includes('nasc') || part.includes('birth')) {
        if (birthIdx === -1) birthIdx = idx;
      } else if (part.includes('civil') || part.includes('marital')) {
        if (civilIdx === -1) civilIdx = idx;
      } else if (part.includes('fgts')) {
        if (fgtsIdx === -1) fgtsIdx = idx;
      } else if (part.includes('bacen') || part.includes('restric')) {
        if (bacenIdx === -1) bacenIdx = idx;
      } else if (part.includes('possui')) {
        if (possuiIdx === -1) possuiIdx = idx;
      } else if (part.includes('programa')) {
        if (programaIdx === -1) programaIdx = idx;
      }
    });

    const hasHeader = nameIdx !== -1 || emailIdx !== -1 || phoneIdx !== -1;
    let startIndex = 0;

    if (hasHeader) {
      startIndex = 1; // Seek rows from index 1 forward
    } else {
      // Dynamic smart guessing based on row format below
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = splitCSVRow(line, separator).map(p => cleanCell(p));
      
      let name = '';
      let email = '';
      let phone = '';
      let rawIncome = '';
      let rawValue = '';
      let statusValue = '';
      let notesValue = '';
      let leadOrigin = '';
      let region = '';
      let propertyInterest = '';
      let objection = '';
      let gender = '';
      let ageBracket = '';
      let cpf = '';
      let birthDate = '';
      let maritalStatus = '';
      let fgtsSaldo = '';
      let restricaoBacen = '';
      let possuiImovel = '';
      let programaDesejado = '';

      if (hasHeader) {
        name = nameIdx !== -1 && nameIdx < parts.length ? parts[nameIdx] : '';
        email = emailIdx !== -1 && emailIdx < parts.length ? parts[emailIdx] : '';
        phone = phoneIdx !== -1 && phoneIdx < parts.length ? parts[phoneIdx] : '';
        rawIncome = incomeIdx !== -1 && incomeIdx < parts.length ? parts[incomeIdx] : '';
        rawValue = valueIdx !== -1 && valueIdx < parts.length ? parts[valueIdx] : '';
        statusValue = statusIdx !== -1 && statusIdx < parts.length ? parts[statusIdx] : '';
        notesValue = notesIdx !== -1 && notesIdx < parts.length ? parts[notesIdx] : '';
        leadOrigin = originIdx !== -1 && originIdx < parts.length ? parts[originIdx] : '';
        region = regionIdx !== -1 && regionIdx < parts.length ? parts[regionIdx] : '';
        propertyInterest = propertyIdx !== -1 && propertyIdx < parts.length ? parts[propertyIdx] : '';
        objection = objectionIdx !== -1 && objectionIdx < parts.length ? parts[objectionIdx] : '';
        gender = genderIdx !== -1 && genderIdx < parts.length ? parts[genderIdx] : '';
        ageBracket = ageIdx !== -1 && ageIdx < parts.length ? parts[ageIdx] : '';
        cpf = cpfIdx !== -1 && cpfIdx < parts.length ? parts[cpfIdx] : '';
        birthDate = birthIdx !== -1 && birthIdx < parts.length ? parts[birthIdx] : '';
        maritalStatus = civilIdx !== -1 && civilIdx < parts.length ? parts[civilIdx] : '';
        fgtsSaldo = fgtsIdx !== -1 && fgtsIdx < parts.length ? parts[fgtsIdx] : '';
        restricaoBacen = bacenIdx !== -1 && bacenIdx < parts.length ? parts[bacenIdx] : '';
        possuiImovel = possuiIdx !== -1 && possuiIdx < parts.length ? parts[possuiIdx] : '';
        programaDesejado = programaIdx !== -1 && programaIdx < parts.length ? parts[programaIdx] : '';
      } else {
        // Smart guessing based on value patterns for headerless content
        parts.forEach(part => {
          if (!part || part.toLowerCase() === 'não informado' || part.toLowerCase() === 'nao informado') return;
          if (part.includes('@')) {
            email = part;
          } else if (/^\+?[\d\s()-.]{8,20}$/.test(part) && (part.replace(/\D/g, '').length >= 8)) {
            phone = part;
          } else if (/^[0-9.,$-]{4,12}$/.test(part) && !isNaN(parseFloat(part.replace(/[^\d.-]/g, '')))) {
            const val = parseFloat(part.replace(/[^\d.-]/g, ''));
            if (val > 10000) {
              rawValue = part;
            } else {
              rawIncome = part;
            }
          } else if (part.length > 3 && name === '') {
            name = part;
          } else {
            notesValue = notesValue ? `${notesValue} | ${part}` : part;
          }
        });
      }

      // Failsafe Regex Extractor: if 'name' contains typical email/phone/value/income patterns, separate them cleanly.
      // Helps solve cases where the entire row text is accidentally digested inside the name column!
      if (name) {
        // 1. Extract email if present
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10})/;
        const emailMatch = name.match(emailRegex);
        if (emailMatch) {
          if (!email) email = emailMatch[1];
          name = name.replace(emailRegex, '').trim();
        }

        // 2. Extract phone number if present
        const phoneRegex = /(\(?\+?\d{1,3}\)?\s?\(?\d{2,3}\)?\s?\d{4,5}[-\s]?\d{4})/;
        const phoneMatch = name.match(phoneRegex);
        if (phoneMatch) {
          if (!phone) phone = phoneMatch[1];
          name = name.replace(phoneRegex, '').trim();
        }

        // 3. Extract CPF
        const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2})/;
        const cpfMatch = name.match(cpfRegex);
        if (cpfMatch) {
          if (!cpf) cpf = cpfMatch[1];
          name = name.replace(cpfRegex, '').trim();
        }

        // 4. Extract monetary value/budget (e.g. R$ 250.000 or R$250000)
        const valueRegex = /(R\$?\s?\d{1,3}(\.\d{3})*(,\d{2})?)/i;
        const valueMatch = name.match(valueRegex);
        if (valueMatch) {
          const rawV = valueMatch[1];
          const numericPart = parseFloat(rawV.replace(/[^\d]/g, ''));
          if (numericPart > 20000) {
            if (!rawValue) rawValue = rawV;
          } else if (numericPart > 0) {
            if (!rawIncome) rawIncome = rawV;
          }
          name = name.replace(valueRegex, '').trim();
        }

        // 5. Standalone budget/income numbers
        const numericRegex = /\b(\d{5,8})\b/;
        const numericMatch = name.match(numericRegex);
        if (numericMatch) {
          const valNum = parseInt(numericMatch[1], 10);
          if (valNum >= 25000) {
            if (!rawValue) rawValue = String(valNum);
            name = name.replace(numericRegex, '').trim();
          } else if (valNum > 900) {
            if (!rawIncome) rawIncome = String(valNum);
            name = name.replace(numericRegex, '').trim();
          }
        }

        // Clean up remaining punctuation on name edges
        name = name.replace(/^[\s,;:\-\/\\\[\]{}()]+/g, '').replace(/[\s,;:\-\/\\\[\]{}()]+$/g, '').trim();
        
        if (!name && email) {
          name = email.split('@')[0];
          name = name.charAt(0).toUpperCase() + name.slice(1);
        }
      }

      // Cleanup filler values like "Não informado" to keep fields purely blank (editable)
      const isNotFilled = (val: string) => {
        const lower = val.toLowerCase().trim();
        return !val || lower === 'nao informado' || lower === 'não informado' || lower === 'null' || lower === 'undefined' || lower === '-';
      };

      if (isNotFilled(name)) name = '';
      if (isNotFilled(email)) email = '';
      if (isNotFilled(phone)) phone = '';
      if (isNotFilled(region)) region = '';
      if (isNotFilled(propertyInterest)) propertyInterest = '';
      if (isNotFilled(objection)) objection = '';
      if (isNotFilled(gender)) gender = '';
      if (isNotFilled(ageBracket)) ageBracket = '';
      if (isNotFilled(cpf)) cpf = '';
      if (isNotFilled(birthDate)) birthDate = '';
      if (isNotFilled(maritalStatus)) maritalStatus = '';
      if (isNotFilled(restricaoBacen)) restricaoBacen = '';
      if (isNotFilled(possuiImovel)) possuiImovel = '';
      if (isNotFilled(programaDesejado)) programaDesejado = '';

      // Skip row if completely empty/unidentified
      if (!name && !email && !phone) {
        continue;
      }

      let parsedIncome: number | undefined = undefined;
      if (rawIncome && !isNotFilled(rawIncome)) {
        const cleanReg = rawIncome.replace(/[^\d.-]/g, '');
        if (cleanReg) {
          const val = parseFloat(cleanReg);
          if (!isNaN(val)) parsedIncome = val;
        }
      }

      let parsedValue = 0;
      if (rawValue && !isNotFilled(rawValue)) {
        const cleanValReg = rawValue.replace(/[^\d.-]/g, '');
        if (cleanValReg) {
          const val = parseFloat(cleanValReg);
          if (!isNaN(val)) parsedValue = val;
        }
      }

      let parsedFgts: number | undefined = undefined;
      if (fgtsSaldo && !isNotFilled(fgtsSaldo)) {
        const cleanReg = fgtsSaldo.replace(/[^\d.-]/g, '');
        if (cleanReg) {
          const val = parseFloat(cleanReg);
          if (!isNaN(val)) parsedFgts = val;
        }
      }

      // Normalize status and stages
      let finalStatus = 'novo';
      let finalStage = 'abordagem';
      if (statusValue && !isNotFilled(statusValue)) {
        const sv = statusValue.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (sv.includes('ganha') || sv.includes('fechado') || sv.includes('contrato')) {
          finalStatus = 'ativo';
          finalStage = 'fechamento';
        } else if (sv.includes('perdid') || sv.includes('lost') || sv.includes('distrat') || sv.includes('arquiv') || sv.includes('recic')) {
          finalStatus = 'arquivado';
          finalStage = 'reciclagem';
        } else if (sv.includes('negocia')) {
          finalStatus = 'ativo';
          finalStage = 'proposta';
        } else if (sv.includes('analise') || sv.includes('bancari')) {
          finalStatus = 'ativo';
          finalStage = 'analise_perfil';
        } else if (sv.includes('pasta') || sv.includes('montagem') || sv.includes('triagem')) {
          finalStatus = 'ativo';
          finalStage = 'triagem';
        } else if (sv.includes('ativo')) {
          finalStatus = 'ativo';
          finalStage = 'abordagem';
        }
      }

      // Handle checkbox checklist
      const hasAprovVal = rawValue && !isNotFilled(rawValue) && rawValue.toLowerCase() !== 'nao informado' && rawValue.toLowerCase() !== 'não informado';
      const checklist = {
        interesse: true,
        visitou: finalStage === 'fechamento' || finalStage === 'proposta',
        aprov: hasAprovVal ? true : undefined
      };

      // Handle Marital Status types
      let normalizedMarital: Lead['maritalStatus'] = undefined;
      if (maritalStatus) {
        const ms = maritalStatus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (ms.includes('solteir')) normalizedMarital = 'Solteiro';
        else if (ms.includes('casad')) normalizedMarital = 'Casado';
        else if (ms.includes('estavel')) normalizedMarital = 'Uniao estavel';
        else if (ms.includes('divorci')) normalizedMarital = 'Divorciado';
        else if (ms.includes('viuv')) normalizedMarital = 'Viuvo';
      }

      // Handle Gender types
      let normalizedGender: Lead['gender'] = undefined;
      if (gender) {
        const g = gender.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (g.startsWith('h') || g.includes('homem') || g.includes('masc')) normalizedGender = 'Homem';
        else if (g.startsWith('m') || g.includes('mulher') || g.includes('fem')) normalizedGender = 'Mulher';
        else if (g.startsWith('o') || g.includes('outro')) normalizedGender = 'Outro';
        else normalizedGender = 'Prefiro nao informar';
      }

      // Handle Age Bracket types
      let normalizedAge: Lead['ageBracket'] = undefined;
      if (ageBracket) {
        const a = ageBracket.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (a.includes('jovem') || a.includes('novo')) normalizedAge = 'Jovem';
        else if (a.includes('meia') || a.includes('medio')) normalizedAge = 'Meia idade';
        else if (a.includes('idoso') || a.includes('velho') || a.includes('aposent')) normalizedAge = 'Idoso';
      }

      // Handle Programa Desejado types
      let normalizedPrograma: Lead['programaDesejado'] = undefined;
      if (programaDesejado) {
        const p = programaDesejado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (p.includes('casa') || p.includes('vida') || p.includes('mcmv')) normalizedPrograma = 'Minha Casa Minha Vida';
        else if (p.includes('sbpe')) normalizedPrograma = 'SBPE';
        else normalizedPrograma = 'Indiferente';
      }

      parsedItems.push({
        name,
        email,
        phone,
        familyIncome: parsedIncome,
        value: parsedValue,
        status: finalStatus,
        stage: finalStage,
        origin: leadOrigin || origin,
        notes: notesValue || '',
        region: region || undefined,
        propertyInterest: propertyInterest || undefined,
        objection: objection || undefined,
        gender: normalizedGender,
        ageBracket: normalizedAge,
        cpf: cpf || undefined,
        birthDate: birthDate || undefined,
        maritalStatus: normalizedMarital,
        fgtsSaldo: parsedFgts,
        restricaoBacen: restricaoBacen ? (restricaoBacen.toLowerCase().includes('sim') || restricaoBacen.toLowerCase().includes('s') ? 'Sim' : 'Não') : undefined,
        possuiImovel: possuiImovel ? (possuiImovel.toLowerCase().includes('sim') || possuiImovel.toLowerCase().includes('s') ? 'Sim' : 'Não') as any : undefined,
        programaDesejado: normalizedPrograma,
        checklist
      });
    }

    return { parsedItems, errors };
  } catch (err: any) {
    return { parsedItems: [], errors: [err.message] };
  }
}

export function safeFormatLocaleString(dateVal: any, options?: Intl.DateTimeFormatOptions): string {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", options);
  } catch (_) {
    return "-";
  }
}

export function safeFormatDateString(dateVal: any, options?: Intl.DateTimeFormatOptions): string {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR", options);
  } catch (_) {
    return "-";
  }
}

export default React.memo(function LeadList({
  leads,
  tableHeaderComponent,
  onOpenLeadDetails,
  onOpenEditModal,
  onDeleteLead,
  onOpenCreateModal,
  onMoveLead,
  onNavigateToFollowUp,
  onAddBulkLeads,
  onDeleteMultipleLeads,
  onMoveMultipleLeads,
  onUpdateMultipleLeads,
  onUpdateLeadField,
  onRequestConfirm,
  awardXP,
  addNotification,
  appointments,
  setAppointments,
  searchTerm: propsSearchTerm,
  setSearchTerm: propsSetSearchTerm,
  statusFilter: propsStatusFilter,
  setStatusFilter: propsSetStatusFilter,
  originFilter: propsOriginFilter,
  setOriginFilter: propsSetOriginFilter,
  initialLetterFilter: propsInitialLetterFilter,
  setInitialLetterFilter: propsSetInitialLetterFilter,
  regionFilter,
  profileFilter,
  stageFilter,
  objectionFilter,
  programaDesejadoFilter,
  restricaoBacenFilter,
  genderFilter,
  familyIncomeFilter,
  incomeTypeFilter,
  deliveryExpectedFilter,
  externalShowImporter,
  setExternalShowImporter,
  externalShowPlanner,
  setExternalShowPlanner,
  onlyImporter = false,
  onOpenAIAssistant,
  onOpenRuleEngine,
  hideRowActionButtons = false,
  isTodosView = false,
  isActiveLeadsView = false,
  isCompactColumns = false,
  maxRows,
  theme = 'escuro',
  renderInlineLeadDetails
}: LeadListProps) {
  const localSearchState = useState('');
  const [expandedPanel, setExpandedPanel] = useState<{ leadId: string; type: 'simulator' | 'details' | 'schedule' } | null>(null);
  const [hideFictitiousWarning, setHideFictitiousWarning] = useState(false);
  const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState(false);
  const [scheduleSingleLead, setScheduleSingleLead] = useState<Lead | null>(null);
  const searchTerm = propsSearchTerm !== undefined ? propsSearchTerm : localSearchState[0];
  const setSearchTerm = propsSetSearchTerm || localSearchState[1];

  const localStatusState = useState<string>('todos');
  const statusFilter = propsStatusFilter !== undefined ? propsStatusFilter : localStatusState[0];
  const setStatusFilter = propsSetStatusFilter || localStatusState[1];

  const localOriginState = useState<string>('todos');
  const originFilter = propsOriginFilter !== undefined ? propsOriginFilter : localOriginState[0];
  const setOriginFilter = propsSetOriginFilter || localOriginState[1];

  const localLetterState = useState<string>('todos');
  const initialLetterFilter = propsInitialLetterFilter !== undefined ? propsInitialLetterFilter : localLetterState[0];
  const setInitialLetterFilter = propsSetInitialLetterFilter || localLetterState[1];

  const [accSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('crm_accessibility_settings');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...INITIAL_ACCESSIBILITY_SETTINGS, ...parsed };
        }
      }
    } catch (_) {}
    return INITIAL_ACCESSIBILITY_SETTINGS;
  });
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const parentRef = React.useRef<HTMLDivElement>(null);

  const [campaignIsAssistedMode, setCampaignIsAssistedMode] = useState<boolean>(true);
  
  // Custom Campaign Batch parameters
  const [campaignWhatsappChannel, setCampaignWhatsappChannel] = useState<'app' | 'web'>('app');
  const [campaignDispatchDelay, setCampaignDispatchDelay] = useState<number>(5);
  const batchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const batchCleanupRef = React.useRef<(() => void) | null>(null);
  const waWindowRef = React.useRef<Window | null>(null);

  // Advanced Gemini-Powered Bulk Lead Campaign Active Planner and Metrics Calculator
  const [plannerLeadCount, setPlannerLeadCount] = useState<number>(30);
  const [plannerLeadOrigin, setPlannerLeadOrigin] = useState<string>('Planilha Comercial');
  const [plannerAverageValue, setPlannerAverageValue] = useState<number>(275000);
  const [plannerCustomNiches, setPlannerCustomNiches] = useState<string>('Leads do Facebook Ads interessados em parcelamento facilitado Zona Leste');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatingScriptLeadId, setGeneratingScriptLeadId] = useState<string | null>(null);
  const [generatedPlanMarkdown, setGeneratedPlanMarkdown] = useState<string>('');
  const [schedulingProgress, setSchedulingProgress] = useState<'idle' | 'scheduling' | 'done'>('idle');

  const CAMPAIGN_TEMPLATES = [
    {
      id: 'template-boasvindas',
      title: '👋 Boas-vindas & Taxas Habitacionais',
      subject: 'Assessoria de Crédito Habitacional',
      body: 'Olá, {{nome}}! Aqui é do atendimento especializado. Identifiquei seu cadastro e gostaria de te apresentar as taxas especiais de financiamento habitacional da Caixa e bancos privados. Conseguimos financiar até 80% do valor do imóvel. Vamos simular um orçamento aproximado para você?'
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
      body: 'Prezado(a) {{nome}}, sabias que é possível usar 100% do saldo do seu FGTS para amortizar ou pagar a entrada do seu novo imóvel? Com a assessoria de crédito credenciada, facilitamos toda a burocracia sem custos de intermediação. Retorne para que possamos fazer seu estudo prévio.'
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
    resolved = resolved.replace(/\{\{valor\}\}/gi, lead.value ? (lead.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'sob consulta');
    resolved = resolved.replace(/\{\{empresa\}\}/gi, lead.company || 'Assessoria');
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
    setBatchProgress(0);
    setBatchLog([
      `🚀 [SETUP] Iniciando Transmissora de Lote...`,
      `🔌 Canal: ${campaignWhatsappChannel === 'app' ? 'WhatsApp Desktop (Local)' : 'WhatsApp Web'}`,
      `⏱️ Intervalo Base: ${campaignDispatchDelay}s`,
      `🎯 Total: ${selectedLeads.length} leads selecionados`
    ]);

    // Open first lead immediately under user gesture to establish window focus and bypass popup blocker!
    const leadItem = selectedLeads[0];
    const rawBody = customCampaignText || (CAMPAIGN_TEMPLATES[selectedCampaignTemplate] ? CAMPAIGN_TEMPLATES[selectedCampaignTemplate].body : '');
    const resolvedText = resolveTemplateText(rawBody, leadItem);
    const cleanPhone = (leadItem.phone || '').replace(/[^0-9]/g, '');
    const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const waLink = campaignWhatsappChannel === 'web' 
      ? `https://web.whatsapp.com/send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`
      : `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`;

    if (leadItem.phone) {
      try {
        const win = window.open(waLink, 'whatsapp_window');
        if (win) {
          waWindowRef.current = win;
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

    if (selectedLeads.length === 1) {
      // Finished campaign immediately if only 1 lead was selected
      setIsDispatchingBatch(false);
      setShowCampaignModal(false);
      setSelectedLeadIds([]);
      if (awardXP) awardXP(130);
      if (addNotification) {
        addNotification(
          '🚀 CAMPANHA ENVIADA', 
          `Disparo concluído com sucesso para o lead selecionado!`, 
          'success'
        );
      }
      alert(`Campanha disparada com sucesso para o lead selecionado!`);
      return;
    }

    // Set index for the NEXT item in batch (index 1)
    setActiveBatchIndex(1);
    setBatchProgress(Math.floor((1 / selectedLeads.length) * 100));
    setBatchCountdownSeconds(campaignDispatchDelay || 3);
  };

  const executeBatchItemDispatch = (index: number) => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    if (index >= selectedLeads.length) return;

    const leadItem = selectedLeads[index];
    const rawBody = customCampaignText || (CAMPAIGN_TEMPLATES[selectedCampaignTemplate] ? CAMPAIGN_TEMPLATES[selectedCampaignTemplate].body : '');
    const resolvedText = resolveTemplateText(rawBody, leadItem);
    const cleanPhone = (leadItem.phone || '').replace(/[^0-9]/g, '');
    const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    // For Web, we must use https://web.whatsapp.com/send
    // For App, we use whatsapp://send
    const waLink = campaignWhatsappChannel === 'web' 
      ? `https://web.whatsapp.com/send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`
      : `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`;

    if (leadItem.phone) {
      try {
        let openedSuccessfully = false;

        // Try using pre-opened window reference first to completely bypass popup blocker
        if (waWindowRef.current && !waWindowRef.current.closed) {
          try {
            waWindowRef.current.location.href = waLink;
            waWindowRef.current.focus();
            openedSuccessfully = true;
          } catch (domErr) {
            // In case of cross-origin or other browser block, fallback to target name window
            const win = window.open(waLink, 'whatsapp_window');
            if (win) {
              waWindowRef.current = win;
              openedSuccessfully = true;
            }
          }
        } else {
          const win = window.open(waLink, 'whatsapp_window');
          if (win) {
            waWindowRef.current = win;
            openedSuccessfully = true;
          }
        }

        if (!openedSuccessfully) {
          if (campaignWhatsappChannel === 'web') {
             const a = document.createElement('a');
             a.href = waLink;
             a.target = 'whatsapp_window';
             a.click();
          } else {
             // Use iframe for protocol handler to avoid navigation cancellation
             let iframe = document.getElementById('wa-dispatch-iframe') as HTMLIFrameElement;
             if (!iframe) {
               iframe = document.createElement('iframe');
               iframe.id = 'wa-dispatch-iframe';
               iframe.style.display = 'none';
               document.body.appendChild(iframe);
             }
             iframe.src = waLink;
          }
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
        setBatchCountdownSeconds(prev => prev - 1);
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
  const showImporter = onlyImporter || (externalShowImporter !== undefined ? externalShowImporter : false);
  const setShowImporter = setExternalShowImporter || (() => {});
  const showCampaignPlanner = externalShowPlanner !== undefined ? externalShowPlanner : false;
  const setShowCampaignPlanner = setExternalShowPlanner || (() => {});
  const [importerTab, setImporterTab] = useState<'classic' | 'simulation' | 'export'>('classic');
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

  // Advanced Multi-Source Importer state values
  const [importSource, setImportSource] = useState<'local' | 'paste' | 'g_sheets'>('local');
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [gSheetsList, setGSheetsList] = useState<any[]>([]);
  const [isLoadingGSheets, setIsLoadingGSheets] = useState(false);
  const [selectedGSheetId, setSelectedGSheetId] = useState('');
  const [gSheetUrlInput, setGSheetUrlInput] = useState('');
  const [isOrganizingAI, setIsOrganizingAI] = useState(false);

  // Proclaim and look up Google Workspace token changes
  useEffect(() => {
    const handleCheckToken = () => {
      const user = auth.currentUser;
      if (user) {
        const t = localStorage.getItem(`ciclocred_workspace_token_${user.uid}`);
        setGoogleToken(t);
      } else {
        setGoogleToken(null);
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const t = localStorage.getItem(`ciclocred_workspace_token_${user.uid}`);
        setGoogleToken(t);
      } else {
        setGoogleToken(null);
      }
    });

    handleCheckToken();
    return () => unsubscribe();
  }, []);

  // Fetch lists of spreadsheets from user Google Drive
  const handleFetchGoogleSheets = async () => {
    if (!googleToken) return;
    setIsLoadingGSheets(true);
    setImportErrors([]);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType = 'application/vnd.google-apps.spreadsheet'&pageSize=15&fields=files(id, name, modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${googleToken}` }
        }
      );
      if (res.status === 401) {
        setGoogleToken(null);
        setImportErrors(['Sua sessão do Google Workspace expirou. Reative-a no painel do Google Workspace.']);
        return;
      }
      const data = await res.json();
      setGSheetsList(data.files || []);
      if (addNotification) {
        addNotification('📊 GOOGLE SHEETS', `Encontradas ${data.files?.length || 0} planilhas no seu Google Drive.`, 'success');
      }
    } catch (err: any) {
      setImportErrors([`Erro ao ler planilhas do Google Drive: ${err.message}`]);
    } finally {
      setIsLoadingGSheets(false);
    }
  };

  // Preview leads directly from a given Google Sheet ID (Private OAuth or Public Web csv format fallback)
  const handleLoadLeadsFromGoogleSheet = async (sheetId: string) => {
    setSelectedGSheetId(sheetId);
    setIsLoadingGSheets(true);
    setImportPreview([]);
    setImportErrors([]);

    // 1. If we have a Google Workspace OAuth Token, try authenticating
    if (googleToken) {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:I100`,
          {
            headers: { Authorization: `Bearer ${googleToken}` }
          }
        );

        if (res.ok) {
          const data = await res.json();
          const rows = data.values || [];

          if (rows.length >= 2) {
            // Convert rows into tab-separated values to digest through same core processFileOrPasteContent
            const tsvLines = rows.map((row: any[]) => {
              return row.map(cell => {
                if (cell === null || cell === undefined) return '';
                return String(cell).replace(/\t/g, ' ').replace(/\r|\n/g, ' ');
              }).join('\t');
            }).filter((line: string) => line.trim() !== '').join('\n');

            const { parsedItems, errors } = processFileOrPasteContent(tsvLines, 'Google Sheets Privado');
            if (parsedItems.length > 0) {
              autoOrganizeWithAI(parsedItems);
              setImportErrors(errors);
              if (addNotification) {
                addNotification(
                  '📥 CONVERSOR GOOGLE SHEETS',
                  `Mapeados ${parsedItems.length} leads da planilha privada do Drive!`,
                  'success'
                );
              }
              setIsLoadingGSheets(false);
              return;
            }
          }
        }
      } catch (err) {
        // Fallback silently to public fetch attempt
        console.warn('OAuth Sheets fetch failed, rolling over to public CSV viewer fallback...', err);
      }
    }

    // 2. PUBLIC SPREADSHEET READER (Supports public Google Sheets instant load without authentication tokens)
    try {
      const res = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      );

      if (!res.ok) {
        throw new Error('Planilha não encontrada. Certifique-se de que o ID ou o link esteja correto e as permissões estejam corretas.');
      }

      const text = await res.text();

      // Check if we received HTML (meaning a Google login page) instead of CSV data
      if (text.includes('id="signin-container"') || text.includes('ServiceLogin') || text.includes('<!DOCTYPE html>')) {
        throw new Error('Esta planilha é Privada. Por favor, acesse o Sheets, clique em Compartilhar e mude para "Qualquer pessoa com o link como Leitor", ou faça login com sua conta no Google Workspace.');
      }

      const { parsedItems, errors } = processFileOrPasteContent(text, 'Google Sheets Público');
      if (parsedItems.length > 0) {
        autoOrganizeWithAI(parsedItems);
        setImportErrors(errors);
        if (addNotification) {
          addNotification(
            '🌐 PLANILHA COMPARTILHADA',
            `Sincronizados ${parsedItems.length} leads de planilha pública de forma instantânea!`,
            'success'
          );
        }
      } else {
        setImportErrors(['Sem registros legíveis. Certifique-se de conter colunas fundamentais como "Nome", "Telefone" ou similar.']);
      }
    } catch (err: any) {
      setImportErrors([
        `Falha ao importar: ${err.message || err}. Dica: certifique-se de que a planilha foi configurada para ser visível a Qualquer Pessoa Com o Link.`
      ]);
    } finally {
      setIsLoadingGSheets(false);
    }
  };

  // Extract Sheet ID and read leads by Sheet URL
  const handleLoadGoogleSheetByUrl = async () => {
    if (!gSheetUrlInput.trim()) return;
    const match = gSheetUrlInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      setImportErrors(['URL de planilha Google Sheets inválida. Forneça o link completo ou o ID da planilha.']);
      return;
    }
    const spreadsheetId = match[1];
    await handleLoadLeadsFromGoogleSheet(spreadsheetId);
  };

  const origins = Array.from(new Set(leads.map(l => l.origin)));

  // File Import Processor (Excel .xlsx/.xls, CSV, TXT, TSV)
  const handleFileImport = (file: File) => {
    setImportedFileName(file.name);
    setIsImportSuccess(false);
    setImportErrors([]);
    
    if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
      alert("Módulo OCR Simulado: Documento carregado. Extraindo informações financeiras para tabela de Leads...");
      // Simulate extraction of 2 leads for demo backend limits:
      const fakeLeads: Omit<Lead, "id">[] = [
        {name: "Lead Faturamento (Extraído DOC)", email: "doc1@pdf.com", phone: "11999990000", value: 250000, status: "novo", origin: "Importação OCR", fluxoId: "financiamento", createdAt: new Date().toISOString(), tags: ["pdf", "ocr"], notes: ""},
        {name: "Lead Portabilidade (Extraído DOC)", email: "doc2@pdf.com", phone: "11988880000", value: 450000, status: "novo", origin: "Importação OCR", fluxoId: "portabilidade", createdAt: new Date().toISOString(), tags: ["docs", "ocr"], notes: ""}
      ];
      setImportPreview(fakeLeads as Lead[]);
      return;
    }

    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const jsonRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          if (jsonRows.length < 2) {
            setImportErrors(['Planilha Excel sem dados suficientes. Requer pelo menos cabeçalho e 1 registro.']);
            return;
          }

          const tsvLines = jsonRows.map((row: any) => {
            if (!Array.isArray(row)) return '';
            return row.map(cell => {
              if (cell === null || cell === undefined) return '';
              return String(cell).replace(/\t/g, ' ').replace(/\r|\n/g, ' ');
            }).join('\t');
          }).filter(line => line.trim() !== '').join('\n');

          const { parsedItems, errors } = processFileOrPasteContent(tsvLines, 'Planilha Excel Local');
          autoOrganizeWithAI(parsedItems);
          setImportErrors(errors);
        } catch (excelErr: any) {
          setImportErrors([`Erro na leitura do arquivo Excel: ${excelErr.message || excelErr}`]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const { parsedItems, errors } = processFileOrPasteContent(text, 'Planilha Importada');
          autoOrganizeWithAI(parsedItems);
          setImportErrors(errors);
        }
      };
      reader.readAsText(file);
    }
  };

  // Bulk Paste Excel/CSV parser
  const handleParsePaste = () => {
    if (!rawPasteData.trim()) return;
    setIsImportSuccess(false);
    setImportErrors([]);

    const { parsedItems, errors } = processFileOrPasteContent(rawPasteData, 'Planilha Comercial');
    autoOrganizeWithAI(parsedItems);
    setImportErrors(errors);
  };

  // Web Gateway simulation uploader function
  const runSimulationPortability = (fileName: string, presetLead?: any) => {
    setIsSimulatingExtraction(true);
    setSimulationProgress(0);
    setSimulationLogs([`📡 [CONNECTED] Inicializando Gateway de Portabilidade do Sistema...`]);
    setExtractedSimulationLead(null);
    
    // Step by step extraction simulation
    const steps = [
      { prg: 15, log: `📁 [LOADED] Arquivo de simulação local carregado com sucesso: "${fileName}"` },
      { prg: 35, log: `🔍 [ANALYZING] Escaneando metadados habitacionais e tabelas de simulação de fomento Caixa...` },
      { prg: 55, log: `🔑 [PARSING] Mapeando chaves do formulário habitacional Cury e subsídios MCMV...` },
      { prg: 75, log: `👤 [FOUND] Proponente localizado! Extraindo dados pessoais e renda líquida auferida...` },
      { prg: 90, log: `⚙️ [AUTOMATION] Cruzando com heurísticas de elegibilidade do sistema & Banco de Imóveis...` },
      { prg: 100, log: `🚀 [CRM_SYNC] Portabilidade concluída! Ficha cadastral pré-preenchida com inteligência preditiva.` }
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const stepDetail = steps[currentStep];
        setSimulationProgress(stepDetail.prg);
        setSimulationLogs(prev => [...prev, stepDetail.log]);
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
          notes: 'Ficha portada via Portal de Portabilidade de Crédito. Proponente possui interesse direto no Cury Eko Guarulhos. Financiamento pré-aprovado Caixa Econômica de 80% do valor.'
        };
        setExtractedSimulationLead(details);
        if (triggerSensoryFeedback && accSettings) {
          triggerSensoryFeedback('success', accSettings);
        }
      }
    }, 450);
  };

  const autoOrganizeWithAI = async (parsedItems: Partial<Lead>[]) => {
    if (parsedItems.length === 0) return;
    setIsOrganizingAI(true);
    // Show preview immediately while organizing
    setImportPreview(parsedItems as Lead[]);
    
    try {
      const response = await fetch('/api/ai/organize-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leads: parsedItems })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro na requisição para organizar leads');
      }
      
      const data = await response.json();
      if (data.leads && Array.isArray(data.leads)) {
        setImportPreview(data.leads);
        if (addNotification) {
          addNotification(
            '🤖 DADOS ESTRUTURADOS COM IA',
            `A Inteligência Artificial filtrou e corrigiu a formatação de ${data.leads.length} contatos automaticamente!`,
            'success'
          );
        }
      } else {
        throw new Error('Formato de resposta inválido retornado pela IA');
      }
    } catch (err: any) {
      console.error(err);
      if (addNotification) {
        addNotification(
          '⚠️ ERRO NA IA',
          `Não foi possível organizar os leads automaticamente: ${err.message}`,
          'error'
        );
      }
    } finally {
      setIsOrganizingAI(false);
    }
  };

  const handleOrganizeImportPreview = async () => {
    autoOrganizeWithAI(importPreview);
  };

  const handleApplyBulkImport = () => {
    if (importPreview.length === 0 || !onAddBulkLeads) return;

    const count = importPreview.length;
    const origin = importPreview[0]?.origin || 'Planilha Importada';
    const averageValue = importPreview.reduce((acc, current) => acc + (current.value || 0), 0) / count || 275000;

    const formattedLeads = importPreview.map((item, idx) => ({
      ...item,
      id: item.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${idx}`,
      status: item.status || 'novo',
      stage: item.stage || 'abordagem',
      createdAt: item.createdAt || new Date().toISOString()
    })) as Lead[];

    onAddBulkLeads(formattedLeads);
    
    setIsImportSuccess(true);
    setRawPasteData('');
    setImportPreview([]);
    setImportedFileName('');
    setTimeout(() => {
      setIsImportSuccess(false);
    }, 5000);
  };

  const handleWhatsAppClick = async (lead: any) => {
    if (generatingScriptLeadId) return; // Prevent double clicks
    
    await handleWhatsAppAction(
      lead,
      (loading) => setGeneratingScriptLeadId(loading ? lead.id : null),
      () => onUpdateLeadField?.(lead.id, { lastInteractionAt: new Date().toISOString() })
    );
  };

  // Exporter to CSV
  const handleExportLeadsCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID;Nome;Email;Telefone;Orcamento;Canal;Notas;CriadoEm\r\n";
    leads.forEach(l => {
      csvContent += `"${l.id}";"${l.name}";"${l.email}";"${l.phone}";"${l.value}";"${l.origin}";"${(l.notes || "").replace(/"/g, '""')}";"${l.createdAt}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", 'Planilha_Leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCampaignPlan = useCallback(async () => {
    if (isGeneratingPlan) return;
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
      const simulatedPlan = `# Plano Inteligente de Conversão

## 📈 Metas e Métricas do Funil Ativo (${plannerLeadCount} Leads de "${plannerLeadOrigin}")

* **Total de Contatos**: **${plannerLeadCount} leads**
* **Abordagens por WhatsApp (Meta: 100%)**: **${plannerLeadCount} tentativas** de aproximação
* **Telefonemas de Perfilamento (Meta: ~40%)**: **${Math.ceil(plannerLeadCount * 0.4)} telefonemas completados**
* **Simulações Habitacionais Automatizadas (Meta: ~20%)**: **${Math.ceil(plannerLeadCount * 0.2)} simulações de Crédito/Caixa**
* **Agendamento de Visitas Físicas (Meta: ~8%)**: **${Math.ceil(plannerLeadCount * 0.08)} visitas estruturadas**
* **Vendas Efetivas Estimadas (Conversão de 2.5%)**: **${Math.ceil(plannerLeadCount * 0.025)} fechamentos de contrato**
* **Receita Estimada de Comissão (Média R$ 250k a 3%)**: **R$ ${(Math.ceil(plannerLeadCount * 0.025) * 250000 * 0.03).toLocaleString('pt-BR')}**

---

## 🗓️ Cronograma Comercial Sugerido de Engajamento

* **Dia 1: Aquecimento Conector**  
  Disparar primeira abordagem via WhatsApp. Mensagem breve e instigante sobre aprovação de crédito simplificada. Não tentar vender o imóvel imediatamente, mas sim vender a simulação de parcelas.
  
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

*"Olá! Tudo bem? Sou consultor parceiro. Notei seu interesse nas unidades com subsídio facilitado de até R$ 55 mil e juros reduzidos Minha Casa Minha Vida.*

*Consegui simular sua aprovação de financiamento Caixa com parcelas que cabem confortavelmente no seu orçamento mensal, sem complicação de burocracias.*

*Eu tenho as melhores opções de plantas prontas hoje no bairro desejado. Qual o melhor horário para eu te enviar os arquivos e números sem compromisso, às 14h ou às 17h?"*`;
      setGeneratedPlanMarkdown(simulatedPlan);
      if (addNotification) {
        addNotification('📊 RETORNO PLANEJADO (EMULADO)', 'Estrutura de plano calculada localmente com base nas métricas comerciais.', 'info');
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [isGeneratingPlan, plannerLeadCount, plannerLeadOrigin, plannerAverageValue, plannerCustomNiches, awardXP, addNotification]);

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
        `⚡ Simulação de Crédito: Envio de estudo de renda de leads qualificados`,
        `🏬 Apresentar Portfólio: Envio de Books e Plantas aos pré-aprovados`,
        `🤝 Agendar Stand: Reuniões físicas de fechamento com leads convertidos`
      ];
      
      const categories: ('Reunião' | 'Telefonema' | 'Outro')[] = ['Outro', 'Telefonema', 'Outro', 'Outro', 'Reunião'];
      const descriptions = [
        `Disparar roteiro de copywriting gerado para ${plannerLeadCount} leads a fim de extrair as primeiras respostas positivas.`,
        `Separar leads receptivos de ${plannerLeadOrigin} e realizar chamadas ativas de perfilamento cadastral, analisando potencial de FGTS.`,
        `Calcular o subsídio e financiamento exatos para os leads engajados e enviar as tabelas ilustradas.`,
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
  const processedLeads = useMemo(() => {
    return leads
      .filter(lead => {
        const matchesSearch = 
          String(lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(lead.phone || '').includes(searchTerm) ||
          String(lead.company || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
        const matchesOrigin = originFilter === 'todos' || lead.origin === originFilter;
        
        const matchesInitial = 
          initialLetterFilter === 'todos' ||
          lead.name.trim().charAt(0).toUpperCase() === initialLetterFilter.toUpperCase();

        const matchesRegion = !regionFilter || regionFilter === 'todos' || lead.region === regionFilter;
        const matchesProfile = !profileFilter || profileFilter === 'todos' || lead.mainProfile === profileFilter;
        const matchesStage = !stageFilter || stageFilter === 'todos' || lead.stage === stageFilter;
        const matchesObjection = !objectionFilter || objectionFilter === 'todos' || lead.objection === objectionFilter;
        const matchesPrograma = !programaDesejadoFilter || programaDesejadoFilter === 'todos' || lead.programaDesejado === programaDesejadoFilter;
        const matchesBacen = !restricaoBacenFilter || restricaoBacenFilter === 'todos' || lead.restricaoBacen === restricaoBacenFilter;
        const matchesGender = !genderFilter || genderFilter === 'todos' || lead.gender === genderFilter;
        
        const matchesFamilyIncome = !familyIncomeFilter || familyIncomeFilter === 'todos' || 
          (familyIncomeFilter === 'Faixa 1' && (lead.familyIncome || 0) <= 2640) ||
          (familyIncomeFilter === 'Faixa 2' && (lead.familyIncome || 0) > 2640 && (lead.familyIncome || 0) <= 4400) ||
          (familyIncomeFilter === 'Faixa 3' && (lead.familyIncome || 0) > 4400 && (lead.familyIncome || 0) <= 8000) ||
          (familyIncomeFilter === 'Acima do Teto' && (lead.familyIncome || 0) > 8000);

        const matchesIncomeType = !incomeTypeFilter || incomeTypeFilter === 'todos' || lead.incomeType === incomeTypeFilter;
        const matchesDelivery = !deliveryExpectedFilter || deliveryExpectedFilter === 'todos' || lead.deliveryExpected === deliveryExpectedFilter;

        return matchesSearch && matchesStatus && matchesOrigin && matchesInitial && 
              matchesRegion && matchesProfile && matchesStage && matchesObjection && matchesPrograma && matchesBacen && 
              matchesGender && matchesFamilyIncome && matchesIncomeType && matchesDelivery;
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
  }, [
    leads, searchTerm, statusFilter, originFilter, initialLetterFilter,
    regionFilter, profileFilter, stageFilter, objectionFilter, programaDesejadoFilter,
    restricaoBacenFilter, genderFilter, familyIncomeFilter, incomeTypeFilter,
    deliveryExpectedFilter, sortBy, sortOrder
  ]);

  // Reset pagination on filter adjustments
  useEffect(() => {
    setVisibleCount(15);
  }, [searchTerm, statusFilter, originFilter, initialLetterFilter]);

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

  const visibleLeads = maxRows 
    ? processedLeads.slice(0, maxRows) 
    : processedLeads; // We will virtualize instead of paginating

  const rowVirtualizer = useVirtualizer({
    count: visibleLeads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isActiveLeadsView ? 150 : 50,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0 
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0) 
    : 0;

  // Lazy loading observer hook (removed since we are using virtualization)

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
    
    if (onDeleteMultipleLeads) {
      onDeleteMultipleLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    } else if (onRequestConfirm) {
      onRequestConfirm(
        "Apagar Leads Selecionados?",
        `Tem certeza que deseja apagar os ${selectedLeadIds.length} leads selecionados permanentemente?`,
        () => {
          selectedLeadIds.forEach(id => onDeleteLead(id));
          setSelectedLeadIds([]);
          if (addNotification) {
            addNotification("Limpeza Concluída", `${selectedLeadIds.length} leads foram removidos.`, "warning");
          }
        },
        "danger"
      );
    } else {
      // Fallback
      if (window.confirm(`Tem certeza que deseja apagar ${selectedLeadIds.length} leads?`)) {
        selectedLeadIds.forEach(id => onDeleteLead(id));
        setSelectedLeadIds([]);
      }
    }
  };

  const handleIndividualDelete = (leadId: string) => {
    onDeleteLead(leadId);
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

  const handleBulkMoveStage = (stage: string) => {
    if (selectedLeadIds.length === 0) return;
    selectedLeadIds.forEach(id => {
      onMoveLead(id, stage, "etapas");
      if (onUpdateLeadField) {
        onUpdateLeadField(id, { stage: stage });
      }
    });
    if (addNotification) {
      addNotification("Sucesso em Lote", `${selectedLeadIds.length} leads foram atualizados para a etapa: ${stage}`, "success");
    }
    setSelectedLeadIds([]);
  };

  const handleBulkExportSelected = () => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID;Nome;Email;Telefone;Orcamento;Canal;Notas;CriadoEm\r\n";
    selectedLeads.forEach(l => {
      csvContent += `"${l.id}";"${l.name}";"${l.email}";"${l.phone}";"${l.value}";"${l.origin}";"${(l.notes || "").replace(/"/g, '""')}";"${l.createdAt}"\r\n`;
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
  const dynCols = getKanbanColumns("status");
  const dynColsAtivos = getKanbanColumns("etapas");
  const dynColsPerfil = getKanbanColumns("perfil");
  const dynColsCarteira = getKanbanColumns("objecoes");
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

  const activeStats = useMemo(() => {
    const stats = {
      total: processedLeads.length,
      comRenda: 0,
      agendados: 0,
      proposta: 0,
      potencialFinanciamento: 0
    };
    processedLeads.forEach(l => {
      if (l.familyIncome && l.familyIncome > 0) stats.comRenda++;
      if (l.status === 'agendamento' || (l.notes && l.notes.toLowerCase().includes('agend'))) stats.agendados++;
      if (l.status === 'proposta-de-compra') stats.proposta++;
      stats.potencialFinanciamento += (l.value || 0);
    });
    return stats;
  }, [processedLeads]);

  return (
    <div className="space-y-6">

      {/* Collapsible Importer/Exporter Panel */}
      {showImporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4  overflow-y-auto">
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl w-full max-w-4xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-5  max-h-[90vh] overflow-y-auto relative text-zinc-900">
            {/* Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2 text-zinc-950">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 " />
                <h3 className="font-sans font-black text-sm uppercase italic tracking-tight">📥 Central de Fomento & Importação</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowImporter(false)}
                className="text-zinc-600 hover:text-zinc-900 p-1.5 rounded-lg border border-zinc-250 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Embedded Subsistem Tab Bar Selector */}
            <div className="flex border-b-2 border-zinc-200 gap-1 overflow-x-auto pb-1.5 select-none">
              <button
                type="button"
                onClick={() => setImporterTab('classic')}
                className={`px-4 py-2 border-2 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-1.5 ${
                  importerTab === 'classic'
                    ? 'bg-zinc-900 text-white border-zinc-950'
                    : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-350'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Importar</span>
              </button>

              <button
                type="button"
                onClick={() => setImporterTab('export')}
                className={`px-4 py-2 border-2 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-1.5 ${
                  importerTab === 'export'
                    ? 'bg-zinc-900 text-white border-zinc-950'
                    : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-350'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Baixar Planilha</span>
              </button>

              <button
                type="button"
                onClick={() => setImporterTab('simulation')}
                className={`px-4 py-2 border-2 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 flex items-center gap-1.5 ${
                  importerTab === 'simulation'
                    ? 'bg-zinc-900 text-white border-zinc-950'
                    : 'bg-zinc-50 text-indigo-700 hover:text-indigo-950 border-indigo-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400  shrink-0" />
                <span>Portabilidade Cury/Caixa</span>
              </button>
            </div>

            {importerTab === 'classic' && (
              <div className="space-y-6 ">
                {/* Source Toggle Sub-navbar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-250 pb-3">
                  <span className="text-[10px] text-zinc-500 font-black uppercase font-mono mr-2">Origem da Importação:</span>
                  
                  <button
                    type="button"
                    onClick={() => { setImportSource('local'); setImportErrors([]); }}
                    className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                      importSource === 'local'
                        ? 'bg-zinc-900 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-350'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Upload Local (.xlsx, .csv, .txt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setImportSource('paste'); setImportErrors([]); }}
                    className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                      importSource === 'paste'
                        ? 'bg-zinc-900 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-350'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Copiar & Colar Células</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setImportSource('g_sheets'); setImportErrors([]); }}
                    className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 ${
                      importSource === 'g_sheets'
                        ? 'bg-zinc-900 text-white border-zinc-950'
                        : 'bg-white text-zinc-700 hover:text-zinc-950 border-zinc-350'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sincronizar Google Sheets</span>
                  </button>
                </div>

                {importSource === 'local' && (
                  <div className="grid grid-cols-1 gap-4 ">
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
                      className={`border-4 border-dashed rounded-2xl p-7 text-center transition-colors select-none flex flex-col items-center justify-center gap-2 ${
                        isDraggingFile 
                          ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' 
                          : 'border-zinc-350 bg-zinc-50 hover:bg-zinc-100/60'
                      }`}
                    >
                      <Upload className={`w-8 h-8 ${isDraggingFile ? 'text-indigo-600 font-black' : 'text-zinc-400'}`} />
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase font-mono text-zinc-950">
                          Arrastar e soltar arquivo (.xlsx, .xls, .csv, .txt, .tsv, .pdf, .docx) aqui
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold max-w-md mx-auto">
                          Suporta arquivos Excel, CSV, Texto e leitura de Documentos Textuais/PDF de faturamento.
                        </p>
                      </div>
                      
                      <label className="mt-2 px-3.5 py-1.5 bg-white border border-zinc-950 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        Selecionar Arquivo do Computador
                        <input 
                          type="file" 
                          accept=".xlsx,.xls,.csv,.txt,.tsv,.pdf,.docx" 
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
                          📄 Carregado Local: {importedFileName}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {importSource === 'paste' && (
                  <div className="space-y-3 ">
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
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-950 text-white font-black uppercase font-mono text-[10px] rounded-lg border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 active:translate-y-0.5 transition-colors"
                      >
                        Analisar dados colados
                      </button>
                    </div>
                  </div>
                )}

                {importSource === 'g_sheets' && (
                  <div className="space-y-4  bg-zinc-50 border-2 border-zinc-250 p-4.5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-emerald-600 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"/>
                      </svg>
                      <div>
                        <h4 className="text-xs font-black uppercase text-zinc-950 font-mono">Planilhas do Google Drive</h4>
                        <p className="text-[9px] text-zinc-500 font-bold">Importe diretamente sem precisar baixar arquivos locais</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {/* Option A: Google Sheet URL Input (Available to ALL users) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-800 block">
                          🔗 Cole a URL completa da sua Planilha do Google (Google Sheets):
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="https://docs.google.com/spreadsheets/d/1A2B3C.../edit"
                            value={gSheetUrlInput}
                            onChange={(e) => setGSheetUrlInput(e.target.value)}
                            className="flex-1 bg-white border-2 border-zinc-950 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          />
                          <button
                            type="button"
                            onClick={handleLoadGoogleSheetByUrl}
                            disabled={isLoadingGSheets || !gSheetUrlInput.trim()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer active:translate-y-0.5 transition-colors"
                          >
                            {isLoadingGSheets ? 'Processando...' : 'Carregar Planilha'}
                          </button>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-bold leading-normal">
                          💡 **Requisito para link**: No Google Sheets, clique em **Compartilhar** (canto superior direito) e mude o Acesso Geral para **"Qualquer pessoa com o link"** no modo **"Leitor"**.
                        </p>
                      </div>

                      {/* Option B: Private Workspace Drive folder search (Requires oauth authorization Token) */}
                      <div className="border-t-2 border-zinc-200 pt-3.5 space-y-2 mt-2">
                        <h5 className="text-[10px] font-black uppercase text-zinc-800">
                          📁 Navegação do Drive do Google Workspace
                        </h5>

                        {!googleToken ? (
                          <div className="p-3 bg-indigo-50/50 border border-indigo-250 rounded-xl">
                            <p className="text-[10px] text-zinc-650 font-bold leading-relaxed">
                              🔑 **Quer pesquisar direto entre seus arquivos privados no Drive?** Faça Login na aba correspondente do Google Workspace para ativar a busca integrada.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-650">
                              <span>Escolha uma item da sua conta integrada:</span>
                              <button
                                type="button"
                                onClick={handleFetchGoogleSheets}
                                disabled={isLoadingGSheets}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-950 text-white font-mono text-[8px] font-black uppercase rounded-md border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 active:translate-y-0.5 transition"
                              >
                                <RotateCw className={`w-2.5 h-2.5 ${isLoadingGSheets ? '' : ''}`} />
                                <span>Listar Meus Arquivos</span>
                              </button>
                            </div>

                          {gSheetsList.length > 0 && (
                            <div className="border-2 border-zinc-950 max-h-[120px] overflow-y-auto p-1 bg-zinc-150 rounded-lg space-y-1">
                              {gSheetsList.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleLoadLeadsFromGoogleSheet(item.id)}
                                  className={`w-full text-left p-2 text-[10.5px] rounded transition-colors font-mono uppercase flex justify-between items-center ${
                                    selectedGSheetId === item.id 
                                      ? 'bg-green-900 text-white font-black border border-green-800' 
                                      : 'bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200'
                                  }`}
                                >
                                  <span className="truncate mr-1.5">{item.name}</span>
                                  <span className="text-[8px] text-zinc-400">
                                    {new Date(item.modifiedTime).toLocaleDateString()}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

            {importerTab === 'export' && (
              <div className="space-y-4  bg-zinc-50 border-2 border-zinc-950 p-5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h4 className="text-sm font-black uppercase text-zinc-950 font-mono">Exportar Tudo e Baixar Planilha</h4>
                </div>
                <p className="text-xs text-zinc-650 font-bold leading-relaxed max-w-2xl">
                  Gere e faça o download instantâneo de um arquivo compactado <code className="bg-zinc-200 px-1 py-0.5 rounded text-zinc-800">.csv</code> contendo todos os contatos e propostas cadastrados na sua esteira de CRM. Ideal para importar no Google Sheets, Excel ou realizar backups de segurança periódicos.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleExportLeadsCSV}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black font-mono text-xs rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0 stroke-[2.5]" />
                    <span>Baixar Planilha Completa (.csv)</span>
                  </button>
                  {selectedLeadIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkExportSelected}
                      className="flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-950 text-white font-black font-mono text-xs rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 stroke-[2.5]" />
                      <span>Baixar Selecionados ({selectedLeadIds.length}) (.csv)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {importerTab === 'simulation' && (
              <div className="space-y-5 ">
                {/* Visual Tutorial Box explains the exact purpose clearly */}
                <div className="bg-gradient-to-r from-indigo-50 to-zinc-50 border-2 border-indigo-400 p-4 rounded-xl text-xs text-zinc-800 font-sans space-y-1.5 shadow-[2px_2px_0px_0px_rgba(99,102,241,0.1)]">
                  <p className="font-mono font-black uppercase text-[10.5px] text-indigo-950 flex items-center gap-1.5">
                    💡 O QUE É O GATEWAY DE PORTABILIDADE DE SIMULAÇÕES?
                  </p>
                  <p className="font-bold text-[11px] leading-relaxed text-zinc-600">
                    Trabalhar com faturas ou PDFs da Caixa/Cury exige copiar e colar dezenas de campos manualmente. Com este Gateway, você <strong>arrasta um PDF ou Excel de simulação residencial</strong> emitido no banco e o sistema lê instantaneamente a Renda Bruta do cliente, o Valor de Compra e Contato. Em segundos, ele <strong>cria o Lead correspondente</strong> no CRM, poupando tempo na análise de crédito imediato!
                  </p>
                  <div className="p-2 bg-indigo-100/30 rounded border border-indigo-200 text-[10px] text-indigo-850 font-bold italic font-mono flex items-center gap-1">
                    👉 Dica Operacional: Clique em qualquer um dos botões de exemplo rápido ("MCMV_Carmo.pdf", "Guarulhos.xlsx", etc.) para simular o processo em tempo real!
                  </div>
                </div>

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
                      className={`border-4 border-dashed rounded-2xl p-6 text-center transition-colors select-none flex flex-col items-center justify-center gap-2 ${
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
                        <div className="flex items-center gap-1.5 text-indigo-400  mt-1.5">
                          <span>⚙️ Mapemanento Inteligente... {simulationProgress}%</span>
                        </div>
                      )}
                    </div>

                    {simulationProgress > 0 && (
                      <div className="w-full bg-zinc-800 rounded-full h-1 mt-3">
                        <div 
                          className="bg-indigo-500 h-1 rounded-full transition-colors" 
                          style={{ width: `${simulationProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Result View */}
                {extractedSimulationLead && (
                  <div className="bg-gradient-to-r from-emerald-50 to-zinc-50 border-2 border-zinc-950 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between  select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                      disabled={isOrganizingAI}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase rounded-lg border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 transition-colors"
                    >
                      {isOrganizingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 text-emerald-200 " />
                          <span>🤖 Organizando com IA...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 text-emerald-200" />
                          <span>🤖 Organizar Planilha com IA</span>
                        </>
                      )}
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
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-black ">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>Importação de Leads concluída! Os contatos foram inseridos como "Novos" na carteira do CRM.</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImporter(false)}
                className="px-6 py-2.5 bg-zinc-900 border-2 border-zinc-950 rounded-xl hover:bg-zinc-950 text-white font-mono font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition active:translate-y-0 cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Bulk Actions & Selection Toolbar */}
      {!onlyImporter && (
        <>
          {(() => {
            const fictitiousCount = leads.filter(l => isFictitiousPhone(l.phone)).length;
            if (fictitiousCount > 0 && !hideFictitiousWarning) {
              return (
                <div className="bg-amber-50 border-4 border-amber-950 p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono text-xs mb-4">
                  <div className="flex items-center gap-3 text-amber-900 font-bold uppercase">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                    <span>Aviso: Seu banco possui {fictitiousCount} leads com telefones inválidos/fictícios gerados durante importações.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowOrganizerModal(true)}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-lg border-2 border-amber-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition whitespace-nowrap"
                    >
                      Corriga em Lote
                    </button>
                    <button
                      onClick={() => setHideFictitiousWarning(true)}
                      className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-lg border-2 border-amber-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition text-lg leading-none flex items-center justify-center"
                      title="Fechar Aviso"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {selectedLeadIds.length > 0 && (
        <div className="bg-indigo-50 border-4 border-zinc-950 p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4  font-mono text-xs mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className=" absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
              </span>
              <span className="font-extrabold text-indigo-950 uppercase text-[11px]">
                {selectedLeadIds.length} selecionados
              </span>
            </div>

            {selectedLeadIds.length < processedLeads.length && (
              <button
                type="button"
                onClick={() => setSelectedLeadIds(processedLeads.map(l => l.id))}
                className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-900 font-bold border-2 border-zinc-950 rounded-lg text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-colors"
              >
                Selecionar todos os {processedLeads.length} leads
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="text-zinc-600 font-bold font-sans">Ações:</span>
            
            {/* Status Select Option */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkMoveStatus(e.target.value as LeadStatus);
                  e.target.value = '';
                }
              }}
              className="bg-white text-zinc-950 border-2 border-zinc-950 px-2 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer focus:outline-none"
            >
              <option value="">-- Editar Status --</option>
              {dynCols.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>

            {/* Stage Select Option */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkMoveStage(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-white text-zinc-950 border-2 border-zinc-950 px-2 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer focus:outline-none"
            >
              <option value="">-- Editar Etapa --</option>
              {dynColsAtivos.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>

            {/* Exportar Leads Action */}
            <button
              onClick={handleBulkExportSelected}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-950 text-white border-2 border-zinc-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition font-bold cursor-pointer"
            >
              Exportar Leads
            </button>

            {/* Agendar Follow-ups Action */}
            <button
              onClick={() => setIsBulkScheduleModalOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-zinc-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition font-bold cursor-pointer"
            >
              Follow-ups 🚨
            </button>

            {/* Excluir Leads Action */}
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white border-2 border-zinc-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(185,28,28,1)] transition font-bold cursor-pointer"
            >
              Excluir Leads
            </button>

            {/* Limpar Action */}
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-350 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold transition cursor-pointer"
            >
              Limpar ✕
            </button>
          </div>
        </div>
      )}

      {/* Leads Table Card */}
      <div className="bg-white border-4 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] flex flex-col flex-1 relative min-h-[500px] overflow-hidden">
        {tableHeaderComponent && (
          <div className="border-b-4 border-zinc-950 shrink-0">
            {typeof tableHeaderComponent === 'function' ? tableHeaderComponent(selectedLeadIds, { openCampaignModal: () => setShowCampaignModal(true), openBulkScheduleModal: () => setIsBulkScheduleModalOpen(true) }) : tableHeaderComponent}
          </div>
        )}
        <div id="lead-table-scroll-container" ref={parentRef} className="flex-1 bg-white relative overflow-auto max-h-[600px] custom-scrollbar">
          <div className={`${isActiveLeadsView ? 'min-w-[1450px]' : isTodosView ? 'min-w-[1250px]' : 'min-w-[1100px]'} w-full`}>
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-zinc-800 relative z-10">
            <thead className="sticky top-0 z-50 bg-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-b-2 border-zinc-200">
              {isActiveLeadsView ? (
                <>
                  <tr className="bg-zinc-100 text-zinc-600 font-mono text-[10px] select-none text-center border-b border-zinc-200">
                    <th className="px-1.5 py-1 bg-zinc-150 border-r border-b border-zinc-300 w-10 text-center font-bold text-zinc-500"></th>
                    <th className="px-3 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[14%]">A</th>
                    <th className="px-3 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[18%]">B</th>
                    <th className="px-3 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[12%]">C</th>
                    <th className="px-3 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[14%]">D</th>
                    <th className="px-3 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[14%]">E</th>
                    <th className="px-3 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[10%]">F</th>
                    <th className="px-2 py-1 bg-zinc-100 border-r border-b border-zinc-300 text-center font-bold text-zinc-500 w-[10%]">G</th>
                    <th className="px-3 py-1 bg-zinc-100 border-b border-zinc-300 text-center font-bold text-zinc-500 w-[8%]">H</th>
                  </tr>
                  <tr className="bg-zinc-200 border-b-2 border-zinc-400 select-none whitespace-nowrap text-zinc-800">
                    <th className="px-1.5 py-2 bg-zinc-150 border-r border-zinc-300 text-center text-[10px] font-mono font-bold text-zinc-600">1</th>
                    <th className="px-3 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 uppercase tracking-wider text-left">Lead</th>
                    <th className="px-3 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 uppercase tracking-wider text-left">Pessoal</th>
                    <th className="px-3 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 uppercase tracking-wider text-left">Parâmetros</th>
                    <th className="px-3 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 uppercase tracking-wider text-left">Qualificação</th>
                    <th className="px-3 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 uppercase tracking-wider text-left">Preferências</th>
                    <th className="px-3 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 uppercase tracking-wider text-left">Financeiro</th>
                    <th className="px-2 py-2 border-r border-zinc-300 font-black text-xs text-zinc-950 text-center uppercase tracking-wider">ações</th>
                    <th className="px-3 py-2 font-black text-xs text-zinc-950 text-center uppercase tracking-wider text-left">atividades</th>
                  </tr>
                </>
              ) : (
                <tr className={`${theme === "claro" ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-950"} border-b-4 text-zinc-300 select-none whitespace-nowrap`}>
                  <th className={`px-2 py-2 text-[10px] w-8 text-center font-black uppercase tracking-widest border-b-4 ${theme === "claro" ? "border-zinc-200" : "border-zinc-950"}`}>
                    <input
                      type="checkbox"
                      checked={visibleLeads.length > 0 && visibleLeads.every(l => selectedLeadIds.includes(l.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Selecionar todos visíveis"
                    />
                  </th>
                  <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '5%' }}>ID</th>
                  <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: isTodosView ? '20%' : '20%' }}>Nome / Região</th>
                  {isTodosView ? (
                    <>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '12%' }}>Contato</th>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '12%' }}>Status/Etapa</th>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '12%' }}>Perfil/Objeção</th>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '12%' }}>Qualificação/Pref.</th>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '10%' }}>Data</th>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '8%' }}>Ações</th>
                      <th className={`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '12%' }}>Atividades</th>
                    </>
                  ) : (
                    <>
                      <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '15%' }}>Tel / Email</th>
                      <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '15%' }}>Data / Interação</th>
                      <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center ${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}`} style={{ width: '10%' }}>Ações</th>
                      <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center border-l ${theme === "claro" ? "text-zinc-600 border-zinc-200 border-l-zinc-200" : "text-zinc-300 border-zinc-950 border-l-zinc-850"}`} style={{ width: '15%' }}>Parâmetros</th>
                      <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center border-l ${theme === "claro" ? "text-zinc-600 border-zinc-200 border-l-zinc-200" : "text-zinc-300 border-zinc-950 border-l-zinc-850"}`} style={{ width: '15%' }}>Infos</th>
                      <th className={`px-2 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center border-l ${theme === "claro" ? "text-zinc-600 border-zinc-200 border-l-zinc-200" : "text-zinc-300 border-zinc-950 border-l-zinc-850"}`} style={{ width: '10%' }}>Atividades</th>
                    </>
                  )}
                </tr>
              )}
            </thead>
            <tbody className="divide-y-2 divide-zinc-100 bg-white">
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-zinc-400 font-mono font-bold uppercase tracking-widest bg-zinc-50">
                    Nenhum lead correspondente encontrado.
                  </td>
                </tr>
              ) : (
                <>
                  {paddingTop > 0 && <tr><td style={{ height: `${paddingTop}px` }} colSpan={10} /></tr>}
                  {virtualItems.map((virtualRow) => {
                    const idx = virtualRow.index;
                    const lead = visibleLeads[idx];
                    if (!lead) return null;
                    
                    if (isActiveLeadsView) {
                      const startRowIdx = 2 + (idx * 4);
                      let calculatedAge = 35;
                      if (lead.birthDate) {
                        const parsedYr = new Date(lead.birthDate).getFullYear();
                        if (!isNaN(parsedYr)) {
                          calculatedAge = new Date().getFullYear() - parsedYr;
                        }
                      }
                      const formattedValue = lead.value ? (lead.value || 0).toLocaleString('pt-BR') : '500.000';
                      const financedValue = (lead.value ? lead.value * 0.8 : 400000).toLocaleString('pt-BR');
                      const installmentValue = (lead.value ? lead.value * 0.005 : 2500).toLocaleString('pt-BR');
                      const familyIncomeFormatted = lead.familyIncome ? lead.familyIncome.toLocaleString('pt-BR') : '15.000';

                      return (
                        <React.Fragment key={lead.id}>
                          {/* ROW 1 */}
                          <tr ref={rowVirtualizer.measureElement} data-index={virtualRow.index} className="hover:bg-zinc-50/50 border-b border-zinc-200">
                            <td className="px-1.5 py-2 bg-zinc-150 border-r border-zinc-300 text-center text-[10px] font-mono font-black text-zinc-500 w-10">
                            {startRowIdx}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-sans text-xs w-[14%]">
                            <input 
                              defaultValue={lead.name}
                              onBlur={(e) => { if (e.target.value !== lead.name) onUpdateLeadField?.(lead.id, { name: e.target.value }) }}
                              className="font-extrabold text-zinc-950 text-xs tracking-tight bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full"
                            />
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[18%]">
                            CPF: {lead.cpf || '123.456.789-00'}, Atuação: {lead.company || 'Eng.'}, Dep: 2
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[12%]">
                            etapas: {lead.status || 'Prospecção'} | status: {lead.status === 'novo' ? 'Novo' : 'Negociação'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[14%]">
                            Tem imóvel: {lead.possuiImovel || 'Não'}, Entrada: {lead.fgtsSaldo > 0 ? 'FGTS' : '20%'}, Restrição: {lead.restricaoBacen || 'Não'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[14%]">
                            Região: {lead.region || 'Sul'}, Metragem: {lead.propertyInterest || '80m²'}, Dorm: {lead.preferenciasUnidade?.includes('3 dorm.') ? '3' : '3'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[10%]">
                            Valor imóvel: R$ {formattedValue}
                          </td>
                          {/* Column G - Ações (rowSpan=3) */}
                          <td className="px-2 py-4 border-r border-zinc-200 text-center w-[10%] bg-zinc-50/30" rowSpan={3}>
                            <div className="flex flex-col gap-1.5 items-center justify-center">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleWhatsAppClick(lead)}
                                  disabled={generatingScriptLeadId === lead.id}
                                  className="p-1 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center justify-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                                  title={generatingScriptLeadId === lead.id ? "Gerando roteiro..." : "WhatsApp"}
                                >
                                  💬
                                </button>
                                <a
                                  href={`tel:${(lead.phone || "").replace(/\D/g, '')}`}
                                  onClick={() => onUpdateLeadField?.(lead.id, { lastInteractionAt: new Date().toISOString() })}
                                  className="p-1 px-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center justify-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                                  title="Ligar"
                                >
                                  📞
                                </a>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setExpandedPanel(prev => prev?.leadId === lead.id && prev?.type === 'details' ? null : { leadId: lead.id, type: 'details' })}
                                  className="p-1 px-1.5 bg-zinc-100 hover:bg-zinc-200 text-[10px] rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                                  title="Ficha do Lead"
                                >
                                  📑
                                </button>
                                <button
                                  onClick={() => onOpenEditModal(lead)}
                                  className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                                  title="Editar"
                                >
                                  ⚙️
                                </button>
                              </div>
                              <button
                                onClick={() => onDeleteLead(lead.id)}
                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] rounded border border-zinc-950 transition cursor-pointer font-bold uppercase tracking-wider"
                                title="Deletar"
                              >
                                🗑️ Excluir
                              </button>
                            </div>
                          </td>
                          {/* Column H - Atividades (rowSpan=3) */}
                          <td className="px-3 py-4 text-center w-[8%] bg-zinc-50/30" rowSpan={3}>
                            <div className="flex flex-col gap-2 items-center justify-center">
                              <span className="inline-block bg-teal-50 border border-teal-300 text-teal-800 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs select-none">
                                impressão
                              </span>
                              <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs select-none">
                                interações
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* ROW 2 */}
                        <tr className="hover:bg-zinc-50/50 border-b border-zinc-200">
                          <td className="px-1.5 py-2 bg-zinc-150 border-r border-zinc-300 text-center text-[10px] font-mono font-black text-zinc-500 w-10">
                            {startRowIdx + 1}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-sans text-xs w-[14%]">
                            <input 
                              defaultValue={lead.phone}
                              onBlur={(e) => { if (e.target.value !== lead.phone) onUpdateLeadField?.(lead.id, { phone: e.target.value }) }}
                              className="font-mono text-xs font-bold text-zinc-900 bg-transparent focus:bg-white focus:outline-none w-full border-b border-transparent focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[18%]">
                            Bairro: {lead.bairroEspecifico || 'Vila Mariana'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[12%]">
                            perfil: {lead.mainProfile || 'Médio'} | entrada: {lead.createdAt ? safeFormatDateString(lead.createdAt, {day:'2-digit', month:'2-digit'}) : '30/04'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[14%]">
                            Aprovado: Sim
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[14%]">
                            Estágio: {lead.stage || 'Saída'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[10%]">
                            Valor financiado: R$ {financedValue}
                          </td>
                        </tr>

                        {/* ROW 3 */}
                        <tr className="hover:bg-zinc-50/50 border-b border-zinc-200">
                          <td className="px-1.5 py-2 bg-zinc-150 border-r border-zinc-300 text-center text-[10px] font-mono font-black text-zinc-500 w-10">
                            {startRowIdx + 2}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-sans text-xs w-[14%]">
                            <input 
                              defaultValue={lead.email || ''}
                              onBlur={(e) => { if (e.target.value !== lead.email) onUpdateLeadField?.(lead.id, { email: e.target.value }) }}
                              placeholder="E-mail"
                              className="text-xs font-medium text-zinc-700 bg-transparent focus:bg-white focus:outline-none w-full border-b border-transparent focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[18%]">
                            Gênero: {lead.gender || 'M'}, Idade: {calculatedAge}, EC: {lead.maritalStatus || 'Casado'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[12%]">
                            objetivos: {lead.company || 'Preço'} | Alt. int.: {lead.lastContactAt ? safeFormatDateString(lead.lastContactAt, {day:'2-digit', month: '2-digit'}) : '15/06'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[14%]">
                            R.Liq: R$ {familyIncomeFormatted} | R.Bruta: R$ {lead.familyGrossIncome ? lead.familyGrossIncome.toLocaleString('pt-BR') : '-'}, Programa: {lead.programaDesejado || 'MCMV'}
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[14%]">
                            Suíte: {lead.preferenciasUnidade?.includes('Suíte') ? 'Sim' : 'Sim'}, Varanda: {lead.preferenciasUnidade?.includes('Varanda') ? 'Sim' : 'Sim'}, Vaga: 2
                          </td>
                          <td className="px-3 py-2 border-r border-zinc-200 font-mono text-[11px] text-zinc-650 w-[10%]">
                            Parcelas: R$ {installmentValue}
                          </td>
                        </tr>

                        {/* ROW 4 - SPACER */}
                        <tr className="bg-zinc-100">
                          <td className="px-1.5 py-1.5 bg-zinc-200 border-r border-zinc-300 text-center text-[10px] font-mono font-bold text-zinc-500 w-10 select-none">
                            {startRowIdx + 3}
                          </td>
                          <td colSpan={8} className="bg-zinc-150 h-3 border-y border-zinc-250 select-none"></td>
                        </tr>

                        {expandedPanel?.leadId === lead.id && expandedPanel.type === 'simulator' && (
                          <tr className="bg-indigo-50 border-y-4 border-indigo-950">
                            <td colSpan={10} className="p-4 relative">
                              <button 
                                onClick={() => setExpandedPanel(null)}
                                className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-50 text-xs font-black cursor-pointer"
                              >
                                Fechar Simulação ✕
                              </button>
                              <div className="bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] rounded-xl overflow-hidden relative max-w-full">
                                <FinanceSimulatorTab 
                                  leads={[lead]}
                                  theme={theme}
                                  accSettings={accSettings}
                                  addNotification={addNotification}
                                  awardXP={awardXP}
                                  isInline={true}
                                />
                              </div>
                            </td>
                          </tr>
                        )}

                        {expandedPanel?.leadId === lead.id && expandedPanel.type === 'details' && renderInlineLeadDetails && (
                          <tr className="bg-indigo-50 border-y-4 border-indigo-950">
                            <td colSpan={10} className="p-4 relative">
                              <button 
                                onClick={() => setExpandedPanel(null)}
                                className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-50 text-xs font-black cursor-pointer"
                              >
                                Fechar Ficha ✕
                              </button>
                              <div className="bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] rounded-xl overflow-hidden relative max-w-full">
                                {renderInlineLeadDetails(lead)}
                              </div>
                            </td>
                          </tr>
                        )}

                        {expandedPanel?.leadId === lead.id && expandedPanel.type === 'schedule' && (
                          <tr className="bg-indigo-50 border-y-4 border-indigo-950">
                            <td colSpan={10} className="p-4 relative">
                              <button 
                                onClick={() => setExpandedPanel(null)}
                                className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-50 text-xs font-black cursor-pointer"
                              >
                                Fechar Agendador ✕
                              </button>
                              <div className="bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] rounded-xl overflow-hidden relative max-w-full">
                                <ScheduleFollowUpModal
                                  isOpen={true}
                                  onClose={() => setExpandedPanel(null)}
                                  leads={leads}
                                  initialLead={lead}
                                  initialLeads={null}
                                  onAddAppointment={(newAppt) => {
                                    if (setAppointments && appointments) {
                                      const updated = [...appointments, newAppt];
                                      setAppointments(updated);
                                      localStorage.setItem('ciclocred_crm_appointments', JSON.stringify(updated));
                                    }
                                  }}
                                  awardXP={awardXP}
                                  addNotification={addNotification}
                                  isInline={true}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }

                  const statusInfo = statusMap[lead.status] || { label: lead.status, bg: 'bg-zinc-100 border border-zinc-300', text: 'text-zinc-700' };
                  const daysSinceContact = getDaysSinceContact(lead.lastContactAt);
                  const isOverdue = daysSinceContact !== null && daysSinceContact > 7;

                  // Age bracket coloring
                  const ageBadgeColors = lead.ageBracket === 'Jovem' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : lead.ageBracket === 'Meia idade' 
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' 
                    : lead.ageBracket === 'Idoso' 
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : 'bg-zinc-100 text-zinc-500 border border-zinc-200';

                  // Gender visualization
                  let genderAvatarSymbol = '👤';
                  let genderAvatarBg = 'bg-zinc-100 text-zinc-700';
                  if (lead.gender === 'Homem') {
                    genderAvatarSymbol = '👨';
                    genderAvatarBg = 'bg-sky-100 text-sky-850 border border-sky-400';
                  } else if (lead.gender === 'Mulher') {
                    genderAvatarSymbol = '👩';
                    genderAvatarBg = 'bg-pink-100 text-pink-850 border border-pink-400';
                  }

                  // Profiles list renders as clean, high-contrast tech tags
                  const renderedProfiles = lead.profiles && lead.profiles.length > 0 
                    ? lead.profiles 
                    : [];

                  return (
                    <React.Fragment key={lead.id}>
                      <tr 
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        className={cn(
                          "hover:bg-zinc-50/80 transition-colors border-b-2",
                          theme === 'claro' ? 'border-zinc-100' : 'border-zinc-900',
                          selectedLeadIds.includes(lead.id) && (theme === 'claro' ? 'bg-indigo-50/50' : 'bg-indigo-900/20')
                        )}
                        id={`lead-row-${lead.id}`}
                      >
                      {/* Selection Checkbox */}
                      <td className="px-2 py-2 text-[10px] text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* ID (sequencial automático) */}
                      <td className="px-1 py-2 text-[10px] text-center font-mono font-black text-zinc-400">
                        #{idx + 1}
                      </td>

                      {/* Nome completo e Gênero */}
                      <td className="px-2 py-2 text-[10px] font-sans w-[20%] break-words">
                        <div className="flex items-start gap-2.5">
                          <div className="space-y-1 w-full">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input 
                                defaultValue={lead.name}
                                onBlur={(e) => { if (e.target.value !== lead.name) onUpdateLeadField?.(lead.id, { name: e.target.value }) }}
                                className="font-extrabold text-zinc-950 text-sm tracking-tight bg-transparent border-b-2 border-transparent focus:border-indigo-500 focus:outline-none w-full w-full max-w-[180px] truncate"
                                title={lead.name}
                              />
                              {isOverdue && (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[8.5px] bg-red-150 border border-red-500 rounded px-1.5 py-0.5 font-mono font-black text-red-700 select-none"
                                  title={`Último contato há ${daysSinceContact} dias!`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-red-600 shrink-0" />
                                  <span>{daysSinceContact}d</span>
                                </span>
                              )}
                            </div>
                            
                            {/* Gênero Selector below Name */}
                            <div className="mt-1">
                              <select
                                value={lead.gender || 'Não Informado'}
                                onChange={(e) => onUpdateLeadField?.(lead.id, { gender: e.target.value })}
                                className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wide font-mono focus:outline-none cursor-pointer w-full max-w-[120px] truncate ${
                                  lead.gender === 'Homem' ? 'bg-sky-50 text-sky-850 border-sky-350' :
                                  lead.gender === 'Mulher' ? 'bg-pink-50 text-pink-850 border-pink-350' :
                                  'bg-zinc-50 text-zinc-800 border-zinc-200'
                                }`}
                              >
                                <option value="Não Informado">👤 ND / Não Inf.</option>
                                <option value="Homem">👨 Homem</option>
                                <option value="Mulher">👩 Mulher</option>
                              </select>
                            </div>
                            
                            {/* Tags list (Profiles & Age) */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {lead.ageBracket && (
                                <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${ageBadgeColors}`}>
                                  {lead.ageBracket}
                                </span>
                              )}
                              
                              {renderedProfiles.map((prof, pIdx) => (
                                <span 
                                  key={pIdx} 
                                  className="text-[8.5px] font-mono font-black bg-zinc-900 border border-zinc-800 text-white px-1.5 py-0.5 rounded uppercase tracking-wider"
                                >
                                  {prof}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {isTodosView ? (
                        <>
                          {/* Contato (Tel/Email) */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-full max-w-[120px]">
                            <div className="flex flex-col gap-1">
                              <input 
                                defaultValue={lead.phone}
                                onBlur={(e) => { if (e.target.value !== lead.phone) onUpdateLeadField?.(lead.id, { phone: e.target.value }) }}
                                className="block font-extrabold text-[10px] tracking-tight text-zinc-950 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
                              />
                              <input 
                                defaultValue={lead.email}
                                onBlur={(e) => { if (e.target.value !== lead.email) onUpdateLeadField?.(lead.id, { email: e.target.value }) }}
                                className="block text-[9px] text-zinc-500 font-mono font-medium tracking-tight bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
                              />
                            </div>
                          </td>

                          {/* Status/Etapa */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-full max-w-[120px]">
                             <div className="flex flex-col gap-1 text-[9px] font-bold uppercase truncate">
                                <span>{lead.status || '-'}</span>
                                <span className="text-indigo-600">{lead.stage || '-'}</span>
                             </div>
                          </td>

                          {/* Perfil/Objeção */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-full max-w-[120px]">
                            <div className="flex flex-col gap-1 text-[9px] font-bold uppercase truncate">
                                <span className="text-zinc-700">{lead.mainProfile || '-'}</span>
                                <span className="text-red-600">{lead.objection || '-'}</span>
                             </div>
                          </td>

                          {/* Qualificação/Preferência */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-full max-w-[120px]">
                             <div className="flex flex-col gap-1 text-[9px] font-bold uppercase truncate">
                                <span className="text-zinc-700">{lead.qualificacao || '-'}</span>
                                <span className="text-emerald-600">{lead.propertyInterest || lead.programaDesejado || '-'}</span>
                             </div>
                          </td>

                          {/* Data de Entrada */}
                          <td className="px-2 py-2 text-[10px] font-mono text-xs text-zinc-650 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="bg-indigo-50 border border-indigo-200/80 rounded px-1.5 py-0.5 inline-block shadow-sm w-fit">
                                <span className="text-[7.5px] text-indigo-500 font-black uppercase block leading-none mb-0.5">🗓️ ENTRADA</span>
                                <span className="text-[9px] font-bold text-indigo-800">
                                  {lead.createdAt ? safeFormatDateString(lead.createdAt) : "-"}
                                </span>
                              </div>
                              {lead.lastInteractionAt || lead.lastContactAt ? (
                                <div className="bg-emerald-50 border border-emerald-200/80 rounded px-1.5 py-0.5 inline-block shadow-sm w-fit">
                                  <span className="text-[7.5px] text-emerald-500 font-black uppercase block leading-none mb-0.5">⚡ INTERAÇÃO</span>
                                  <span className="text-[9px] font-bold text-emerald-800">
                                    {safeFormatLocaleString(lead.lastInteractionAt || lead.lastContactAt, {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <div className="bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 inline-block shadow-sm w-fit">
                                  <span className="text-[7.5px] text-zinc-500 font-black uppercase block leading-none mb-0.5">⏳ SEM INTERAÇÃO</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Ações Rápidas */}
                          <td className="px-2 py-2 text-[10px] font-sans whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {/* Whatsapp Action with AI generation */}
                              <button
                                onClick={() => handleWhatsAppClick(lead)}
                                disabled={generatingScriptLeadId === lead.id}
                                className="p-1 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center justify-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer min-w-[28px]"
                                title={generatingScriptLeadId === lead.id ? "Gerando..." : "WhatsApp"}
                              >
                                {generatingScriptLeadId === lead.id ? (
                                  <span className=" text-[8px]">⏳</span>
                                ) : (
                                  <span>💬</span>
                                )}
                              </button>

                              {/* Ligar action */}
                              <a
                                href={`tel:${(lead.phone || "").replace(/\D/g, '')}`}
                                onClick={() => onUpdateLeadField?.(lead.id, { lastInteractionAt: new Date().toISOString() })}
                                className="p-1 px-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                                title="Ligar"
                              >
                                <span>📞</span>
                              </a>

                              {/* Follow-up action */}
                              <button
                                onClick={() => {
                                  onUpdateLeadField?.(lead.id, { lastInteractionAt: new Date().toISOString() });
                                  setExpandedPanel(prev => (prev?.leadId === lead.id && prev?.type === 'schedule') ? null : { leadId: lead.id, type: 'schedule' });
                                }}
                                className={`p-1 px-1.5 ${expandedPanel?.leadId === lead.id && expandedPanel?.type === 'schedule' ? 'bg-amber-300' : 'bg-amber-100 hover:bg-amber-200'} text-amber-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]`}
                                title="Agendar Follow-up"
                              >
                                <span>🚨</span>
                              </button>

                              {/* Excluir action */}
                              <button
                                onClick={() => handleIndividualDelete(lead.id)}
                                className="p-1 px-1.5 bg-red-100 hover:bg-red-200 text-red-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                                title="Excluir Lead"
                              >
                                <span>🗑️</span>
                              </button>
                            </div>
                          </td>

                          {/* Atividades Column for Todos os Leads */}
                          <td className="px-2 py-2 text-center border-l border-zinc-100">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <div className="flex items-center gap-1">
                                {/* Ficha */}
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setExpandedPanel(prev => (prev?.leadId === lead.id && prev?.type === 'details') ? null : { leadId: lead.id, type: 'details' });
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center ${expandedPanel?.leadId === lead.id && expandedPanel?.type === 'details' ? 'bg-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200'} text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-zinc-850 cursor-pointer`}
                                  title="Ver Ficha Cadastral"
                                >
                                  📑
                                </button>

                                {/* Funil Status */}
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const dev = document.getElementById("integrated-kanban-board-scroll");
                                    if (dev) {
                                      dev.scrollIntoView({ behavior: "smooth" });
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-zinc-850 cursor-pointer"
                                  title="Rolar para o Funil Kanban Integrado"
                                >
                                  🔽
                                </button>

                                {/* Simulador */}
                                <button 
                                  type="button"
                                  onClick={() => setExpandedPanel(prev => (prev?.leadId === lead.id && prev?.type === 'simulator') ? null : { leadId: lead.id, type: 'simulator' })}
                                  className={`w-7 h-7 flex items-center justify-center ${expandedPanel?.leadId === lead.id && expandedPanel?.type === 'simulator' ? 'bg-indigo-200 hover:bg-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100'} text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-indigo-800 cursor-pointer`}
                                  title="Abrir Simulador de Crédito"
                                >
                                  🧮
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Regras */}
                                <button 
                                  type="button"
                                  onClick={() => onOpenRuleEngine && onOpenRuleEngine(lead)}
                                  className="w-7 h-7 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-indigo-850 cursor-pointer"
                                  title="Ações Automáticas (Regras)"
                                >
                                  🤖
                                </button>

                                {/* Assistente */}
                                <button 
                                  type="button"
                                  onClick={() => onOpenAIAssistant && onOpenAIAssistant(lead)}
                                  className="w-7 h-7 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-purple-850 cursor-pointer"
                                  title="Assistente AI & Objeções"
                                >
                                  ✨
                                </button>
                              </div>
                            </div>
                          </td>
                        
                        </>
                      ) : (
                        <>
                          {/* Telefone / E-mail */}
                          <td className="px-2 py-2 text-[10px] text-zinc-805 whitespace-nowrap">
                            <div className="space-y-1 max-w-[155px]">
                              <div>
                                <span className="text-[8px] text-zinc-400 font-mono font-bold block leading-none">TELEFONE</span>
                                <input 
                                  defaultValue={lead.phone}
                                  onBlur={(e) => { if (e.target.value !== lead.phone) onUpdateLeadField?.(lead.id, { phone: e.target.value }) }}
                                  className="block font-black text-xs tracking-tight text-zinc-950 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
                                />
                              </div>
                              <div>
                                <span className="text-[8px] text-zinc-400 font-mono font-bold block leading-none">E-MAIL</span>
                                <input 
                                  defaultValue={lead.email || ''}
                                  placeholder="Sem e-mail"
                                  onBlur={(e) => { if (e.target.value !== lead.email) onUpdateLeadField?.(lead.id, { email: e.target.value }) }}
                                  className="block text-[11px] font-semibold text-zinc-750 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
                                  title={lead.email || ''}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Entrada / Interação */}
                          <td className="px-2 py-2 text-[10px] text-zinc-805 whitespace-nowrap">
                            <div className="space-y-2 max-w-full max-w-[120px]">
                              <div className="bg-zinc-150 border border-zinc-300 rounded px-1.5 py-1 shadow-sm">
                                <span className="text-[8px] text-zinc-500 font-mono font-bold block leading-none mb-0.5">🗓️ ENTRADA</span>
                                <div className="text-[10px] font-mono font-black text-indigo-700">
                                   {lead.createdAt ? safeFormatDateString(lead.createdAt) + " " + safeFormatLocaleString(lead.createdAt, {hour: '2-digit', minute:'2-digit'}) : "-"}
                                </div>
                              </div>
                              <div className="bg-emerald-50/50 border border-emerald-200 rounded px-1.5 py-1 shadow-sm">
                                <span className="text-[8px] text-emerald-600 font-mono font-bold block leading-none mb-0.5">⚡ INTERAÇÃO</span>
                                <div className="text-[10px] font-mono font-black text-emerald-800">
                                   {lead.lastInteractionAt ? safeFormatDateString(lead.lastInteractionAt) + " " + safeFormatLocaleString(lead.lastInteractionAt, {hour: '2-digit', minute:'2-digit'}) : "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <div className="flex items-center gap-1">
                                {/* Whatsapp Action with dynamic AI simulation */}
                                <button
                                  onClick={() => handleWhatsAppClick(lead)}
                                  disabled={generatingScriptLeadId === lead.id}
                                  className="p-1 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center justify-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer min-w-[28px]"
                                  title={generatingScriptLeadId === lead.id ? "Gerando roteiro inteligente..." : "Conversar no WhatsApp"}
                                >
                                  {generatingScriptLeadId === lead.id ? (
                                    <span className=" text-[8px]">⏳</span>
                                  ) : (
                                    <span>💬</span>
                                  )}
                                </button>

                                {/* Ligar action */}
                                <a
                                  href={`tel:${(lead.phone || "").replace(/\D/g, '')}`}
                                  onClick={() => onUpdateLeadField?.(lead.id, { lastInteractionAt: new Date().toISOString() })}
                                  className="p-1 px-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                                  title="Ligar"
                                >
                                  <span>📞</span>
                                </a>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Follow-up calendar action */}
                                <button
                                  onClick={() => {
                                    onUpdateLeadField?.(lead.id, { lastInteractionAt: new Date().toISOString() });
                                    setExpandedPanel(prev => (prev?.leadId === lead.id && prev?.type === 'schedule') ? null : { leadId: lead.id, type: 'schedule' });
                                  }}
                                  className="p-1 px-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                                  title="Agendar Follow-up"
                                >
                                  <span>🚨</span>
                                </button>

                                {/* Excluir action */}
                                <button
                                  onClick={() => handleIndividualDelete(lead.id)}
                                  className="p-1 px-1.5 bg-red-100 hover:bg-red-200 text-red-800 border border-zinc-950 rounded text-[10px] font-mono font-black uppercase flex items-center gap-0.5 transition shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
                                  title="Excluir Lead"
                                >
                                  <span>🗑️</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Parâmetros */}
                          <td className="px-2 py-2 text-zinc-900 border-l border-zinc-100">
                            <div className="space-y-1 max-w-[180px] mx-auto">
                              <div className="grid grid-cols-2 gap-1 items-center">
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Status</span>
                                  <select
                                    value={lead.status || ""}
                                    onChange={(e) => onMoveLead(lead.id, e.target.value, "status")}
                                    className={`text-[9px] font-black uppercase rounded py-0.5 px-0.5 border border-zinc-950 outline-none select-none cursor-pointer w-full truncate ${statusInfo ? statusInfo.bg : "bg-zinc-100"} ${statusInfo ? statusInfo.text : "text-zinc-650"}`}
                                  >
                                    {dynCols.map(col => (
                                      <option key={col.id} value={col.id}>{col.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Perfil</span>
                                  <select 
                                    value={lead.mainProfile || ''}
                                    onChange={(e) => { onMoveLead(lead.id, e.target.value, "perfil"); }}
                                    className="text-[9px] font-black uppercase bg-amber-50 border border-zinc-300 rounded py-0.5 px-0.5 focus:outline-none w-full cursor-pointer truncate"
                                  >
                                    <option disabled value="">- Perfil -</option>
                                    {dynColsPerfil.map(col => (
                                      <option key={col.id} value={col.id}>{col.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-1 items-center">
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Etapa</span>
                                  <select
                                    value={lead.stage || ''}
                                    onChange={(e) => onMoveLead(lead.id, e.target.value, "etapas")}
                                    className="text-[9px] font-black uppercase px-0.5 py-0.5 rounded border border-zinc-300 focus:outline-none cursor-pointer w-full bg-white truncate"
                                  >
                                    <option disabled value="">- Etapa -</option>
                                    {dynColsAtivos.map(col => (
                                      <option key={col.id} value={col.id}>{col.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Objeção</span>
                                  <select
                                    value={lead.objection || ''}
                                    onChange={(e) => onMoveLead(lead.id, e.target.value, "objecoes")}
                                    className="text-[9px] font-black uppercase px-0.5 py-0.5 rounded border focus:outline-none cursor-pointer w-full bg-white truncate border-zinc-300"
                                  >
                                    <option disabled value="">- Objeção -</option>
                                    {dynColsCarteira.map(col => (
                                      <option key={col.id} value={col.id}>{col.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Infos */}
                          <td className="px-2 py-2 text-zinc-900 border-l border-zinc-100">
                            <div className="space-y-1 max-w-[180px] mx-auto">
                              <div className="grid grid-cols-2 gap-1 items-center">
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none" title="Renda Familiar Líquida">R. Líquida</span>
                                  <input 
                                    type="number"
                                    defaultValue={lead.familyIncome || 0}
                                    onBlur={(e) => { if (Number(e.target.value) !== lead.familyIncome) onUpdateLeadField?.(lead.id, { familyIncome: Number(e.target.value) }) }}
                                    className="text-zinc-950 font-black text-[11px] bg-transparent border-b border-zinc-200 focus:border-indigo-500 focus:outline-none w-full text-center py-0.5"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none" title="Renda Familiar Bruta">R. Bruta</span>
                                  <input 
                                    type="number"
                                    defaultValue={lead.familyGrossIncome || lead.familyIncome || 0}
                                    onBlur={(e) => { if (Number(e.target.value) !== lead.familyGrossIncome) onUpdateLeadField?.(lead.id, { familyGrossIncome: Number(e.target.value) }) }}
                                    className="text-zinc-950 font-black text-[11px] bg-transparent border-b border-zinc-200 focus:border-emerald-500 focus:outline-none w-full text-center py-0.5"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-1 items-center">
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Região</span>
                                  <select 
                                    value={lead.region || 'Geral'}
                                    onChange={(e) => { if (e.target.value !== (lead.region || 'Geral')) onUpdateLeadField?.(lead.id, { region: e.target.value }) }}
                                    className="bg-white border border-zinc-300 font-black rounded py-0.5 px-0.5 text-[9px] uppercase cursor-pointer text-zinc-900 focus:outline-none w-full truncate"
                                  >
                                    <option value="Geral">Geral</option>
                                    <option value="Centro">Centro</option>
                                    <option value="Norte">Z. Norte</option>
                                    <option value="Sul">Z. Sul</option>
                                    <option value="Leste">Z. Leste</option>
                                    <option value="Oeste">Z. Oeste</option>
                                    <option value="Guarulhos">Guarulhos</option>
                                    <option value="ABC">ABC</option>
                                  </select>
                                </div>
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Programa</span>
                                  <select
                                    value={lead.programaDesejado || 'Indiferente'}
                                    onChange={(e) => onUpdateLeadField?.(lead.id, { programaDesejado: e.target.value })}
                                    className={`text-[9px] font-mono font-black uppercase px-0.5 py-0.5 rounded border focus:outline-none cursor-pointer w-full truncate ${
                                      lead.programaDesejado === 'Minha Casa Minha Vida'
                                        ? 'bg-indigo-50 text-indigo-805 border-indigo-200'
                                        : lead.programaDesejado === 'SBPE'
                                        ? 'bg-amber-50 text-amber-805 border-amber-200'
                                        : 'bg-zinc-100 text-zinc-650 border-zinc-200'
                                    }`}
                                  >
                                    <option value="Indiferente">Indif</option>
                                    <option value="Minha Casa Minha Vida">MCMV</option>
                                    <option value="SBPE">SBPE</option>
                                  </select>
                                </div>
                                <div>
                                  <span className="text-[8px] text-zinc-400 font-mono font-bold block uppercase leading-none">Metragem m²</span>
                                  <input 
                                    type="text"
                                    defaultValue={lead.propertyInterest || ''}
                                    placeholder="m²"
                                    onBlur={(e) => { if (e.target.value !== lead.propertyInterest) onUpdateLeadField?.(lead.id, { propertyInterest: e.target.value }) }}
                                    className="text-zinc-950 text-[10px] font-bold bg-transparent border-b border-zinc-200 focus:border-indigo-500 focus:outline-none w-full text-center py-0.5"
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Atividades */}
                          <td className="px-2 py-2 text-center border-l border-zinc-100">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <div className="flex items-center gap-1">
                                {/* Ficha */}
                                <button 
                                  type="button"
                                  onClick={() => setExpandedPanel(prev => prev?.leadId === lead.id && prev?.type === 'details' ? null : { leadId: lead.id, type: 'details' })}
                                  className="w-7 h-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-zinc-850 cursor-pointer"
                                  title="Ver Ficha Cadastral"
                                >
                                  📑
                                </button>

                                {/* Funil Status */}
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const dev = document.getElementById("integrated-kanban-board-scroll");
                                    if (dev) {
                                      dev.scrollIntoView({ behavior: "smooth" });
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-zinc-850 cursor-pointer"
                                  title="Rolar para o Funil Kanban Integrado"
                                >
                                  🔽
                                </button>

                                {/* Simulador */}
                                <button 
                                  type="button"
                                  onClick={() => setExpandedPanel(prev => (prev?.leadId === lead.id && prev?.type === 'simulator') ? null : { leadId: lead.id, type: 'simulator' })}
                                  className={`w-7 h-7 flex items-center justify-center ${expandedPanel?.leadId === lead.id && expandedPanel?.type === 'simulator' ? 'bg-indigo-200 hover:bg-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100'} text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-indigo-800 cursor-pointer`}
                                  title="Abrir Simulador de Crédito"
                                >
                                  🧮
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Regras */}
                                <button 
                                  type="button"
                                  onClick={() => onOpenRuleEngine && onOpenRuleEngine(lead)}
                                  className="w-7 h-7 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-indigo-850 cursor-pointer"
                                  title="Ações Automáticas (Regras)"
                                >
                                  🤖
                                </button>

                                {/* Assistente */}
                                <button 
                                  type="button"
                                  onClick={() => onOpenAIAssistant && onOpenAIAssistant(lead)}
                                  className="w-7 h-7 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-purple-850 cursor-pointer"
                                  title="Assistente AI & Objeções"
                                >
                                  ✨
                                </button>

                                {/* Estoque */}
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if ((window as any).setActiveTab) {
                                      (window as any).setActiveTab("inventory");
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-xs rounded border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-emerald-800 cursor-pointer"
                                  title="Abrir Estoque"
                                >
                                  🏢
                                </button>
                              </div>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                    {expandedPanel?.leadId === lead.id && expandedPanel.type === 'simulator' && (
                      <tr className="bg-indigo-50 border-y-4 border-indigo-950">
                        <td colSpan={10} className="p-4 relative">
                          <button 
                            onClick={() => setExpandedPanel(null)}
                            className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-50 text-xs font-black cursor-pointer"
                          >
                            Fechar Simulação ✕
                          </button>
                          <div className="bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] rounded-xl overflow-hidden relative max-w-full">
                            <FinanceSimulatorTab 
                              leads={[lead]}
                              theme={theme}
                              accSettings={accSettings}
                              addNotification={addNotification}
                              awardXP={awardXP}
                              isInline={true}
                            />
                          </div>
                        </td>
                      </tr>
                    )}

                    {expandedPanel?.leadId === lead.id && expandedPanel.type === 'details' && renderInlineLeadDetails && (
                      <tr className="bg-indigo-50 border-y-4 border-indigo-950">
                        <td colSpan={10} className="p-4 relative">
                          <button 
                            onClick={() => setExpandedPanel(null)}
                            className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-50 text-xs font-black cursor-pointer"
                          >
                            Fechar Ficha ✕
                          </button>
                          <div className="bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] rounded-xl overflow-hidden relative max-w-full">
                            {renderInlineLeadDetails(lead)}
                          </div>
                        </td>
                      </tr>
                    )}

                    {expandedPanel?.leadId === lead.id && expandedPanel.type === 'schedule' && (
                      <tr className="bg-indigo-50 border-y-4 border-indigo-950">
                        <td colSpan={10} className="p-4 relative">
                          <button 
                            onClick={() => setExpandedPanel(null)}
                            className="absolute top-4 right-4 p-1 bg-white hover:bg-zinc-100 border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-50 text-xs font-black cursor-pointer"
                          >
                            Fechar Agendador ✕
                          </button>
                          <div className="bg-white border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] rounded-xl overflow-hidden relative max-w-full">
                            <ScheduleFollowUpModal
                              isOpen={true}
                              onClose={() => setExpandedPanel(null)}
                              leads={leads}
                              initialLead={lead}
                              initialLeads={null}
                              onAddAppointment={(newAppt) => {
                                if (setAppointments && appointments) {
                                  const updated = [...appointments, newAppt];
                                  setAppointments(updated);
                                  localStorage.setItem('ciclocred_crm_appointments', JSON.stringify(updated));
                                }
                              }}
                              awardXP={awardXP}
                              addNotification={addNotification}
                              isInline={true}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
                </>
              )}
              {paddingBottom > 0 && <tr><td style={{ height: `${paddingBottom}px` }} colSpan={10} /></tr>}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Campaign and marketing script dispatching modal suite */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70  flex items-center justify-center p-4 ">
          <div className="bg-white border-4 border-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-800">
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b-4 border-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-400 rounded-lg text-zinc-950 font-black ">
                  <Zap className="w-5 h-5 fill-current text-zinc-900" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                    Disparador de Campanhas & Roteiros VIP
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
                <div className="border-2 border-zinc-950 rounded-xl bg-zinc-50 p-4 space-y-3 ">
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
                      const cleanPhone = (lead.phone || "").replace(/[^0-9]/g, '');
                      const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                      const waLink = `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(resolvedText)}`;
                      
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
                <div className="border-2 border-zinc-950 rounded-xl bg-zinc-950 text-zinc-100 p-5 space-y-4  font-mono">
                  <div className="flex justify-between items-center border-b border-dashed border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isDispatchingBatch ? 'bg-red-505  text-red-500' : 'bg-emerald-500'}`} style={{ backgroundColor: isDispatchingBatch ? '#ef4444' : '#10b981' }} />
                      <h4 className="text-xs font-black uppercase text-amber-400">Console de Transmissão batch v2</h4>
                    </div>
                    {isDispatchingBatch && (
                      <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded uppercase ">
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
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-colors"
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
                      <div className="bg-zinc-900 border-2 border-indigo-500/50 p-4 rounded-xl space-y-3 ">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-indigo-400">AGUARDANDO DISPARO ATIVO</span>
                            <h5 className="text-xs font-black text-white">{activeLead.name}</h5>
                          </div>
                          {batchCountdownSeconds > 0 ? (
                            <div className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-700 px-2 py-1 rounded font-black  flex items-center gap-1.5">
                              ⏱️ {batchCountdownSeconds}s para liberação
                            </div>
                          ) : (
                            <div className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-1 rounded font-black  flex items-center gap-1.5">
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
                                : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] '
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
                Pro V2.0. Digital Campaign Dashboard
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
            let { extractedPhone, cleanedText: cleanedEmail } = extractPhoneFromString(lead.email || '');
            let cleanedName = lead.name;

            if (!extractedPhone && lead.name) {
              const res = extractPhoneFromString(lead.name);
              if (res.extractedPhone) {
                extractedPhone = res.extractedPhone;
                cleanedName = res.cleanedText; // Name without phone
              }
            }

            if (extractedPhone) {
              return {
                lead,
                currentEmail: lead.email,
                currentPhone: lead.phone,
                detectedPhone: extractedPhone,
                suggestedEmail: cleanedEmail || lead.email,
                suggestedName: cleanedName || lead.name
              };
            }
          }
          return null;
        }).filter((x): x is NonNullable<typeof x> => x !== null);

        const totalSelected = candidates.filter(cand => !!organizerSelectedCandidateIds[cand.lead.id]).length;

        const getLeadAgeInDays = (lead: Lead): number => {
          const refDateStr = lead.lastContactAt || lead.createdAt;
          if (!refDateStr) return 0;
          try {
            const d = new Date(refDateStr);
            if (isNaN(d.getTime())) return 0;
            const diffTime = new Date().getTime() - d.getTime();
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
          } catch (_) {
            return 0;
          }
        };

        const inactiveCandidates = leads.filter(lead => {
          const isActive = lead.status !== 'fechado' && lead.status !== 'perdido';
          const age = getLeadAgeInDays(lead);
          return isActive && age >= 30;
        });

        const handleExecute30DayCleanup = () => {
          if (inactiveCandidates.length === 0) return;
          const proceed = () => {
            const updated = leads.map(l => {
              const isInactive = inactiveCandidates.some(cand => cand.id === l.id);
              if (isInactive) {
                const currentNotes = l.notes || '';
                const dateStr = new Date().toLocaleDateString('pt-BR');
                return {
                  ...l,
                  status: 'perdido',
                  lostReason: 'Arquivamento Automático (Inatividade > 30 dias)',
                  notes: currentNotes + `\n[${dateStr}] Auto-arquivado por inatividade de 30 dias. Tarefas e compromissos complementares concluídos de forma autônoma.`
                };
              }
              return l;
            });

            if (setAppointments && appointments) {
              const updatedApts = appointments.map((apt: any) => {
                const isLeadInactive = inactiveCandidates.some(cand => cand.id === apt.leadId || cand.name === apt.leadName);
                if (isLeadInactive && apt.status !== 'realizada') {
                  return {
                    ...apt,
                    status: 'realizada',
                    notes: (apt.notes || '') + ' (Concluída automaticamente no arquivamento temporal de 30 dias)'
                  };
                }
                return apt;
              });
              setAppointments(updatedApts);
            }

            if (onUpdateMultipleLeads) {
              onUpdateMultipleLeads(updated);
            }

            if (awardXP) {
              awardXP(200 + inactiveCandidates.length * 20);
            }

            if (addNotification) {
              addNotification(
                '🧹 TEMPO SANEADO',
                `Processados e arquivados ${inactiveCandidates.length} contatos inativos por 30+ dias! Atividades integradas concluídas.`,
                'success'
              );
            }

            setShowOrganizerModal(false);
          };

          if (onRequestConfirm) {
            onRequestConfirm(
              '⏱️ CONFIRMAR ARQUIVAMENTO TEMPORAL (30 DIAS)?',
              `Você está prestes a transferir automaticamente todos os ${inactiveCandidates.length} leads inativos há mais de 30 dias para a lixeira de arquivados e encerrar/concluir os compromissos relacionados no seu calendário de forma automatizada. Deseja prosseguir de imediato?`,
              proceed,
              'warning'
            );
          } else if (confirm(`Deseja transferir ${inactiveCandidates.length} leads inativos para o status "Perdido"?`)) {
            proceed();
          }
        };

        const handleApplyBatchCorrections = () => {
          if (!onUpdateMultipleLeads) return;
          const updated = leads.map(l => {
            const match = candidates.find(cand => cand.lead.id === l.id);
            if (match && organizerSelectedCandidateIds[l.id]) {
              return {
                ...l,
                phone: match.detectedPhone || l.phone,
                email: match.suggestedEmail || l.email,
                name: match.suggestedName || l.name
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
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-zinc-950/70  flex items-center justify-center p-4 ">
            <div className="bg-white border-4 border-zinc-950 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-800">
              {/* Header */}
              <div className="bg-emerald-600 text-white p-5 flex items-center justify-between border-b-4 border-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-950 rounded-lg text-emerald-400 font-black">
                    <Wand2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                      Assistente de Organização de Contatos
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
                    <Sparkles className="w-4 h-4 text-emerald-600 " />
                    Como funciona esta verificação inteligente?
                  </h4>
                  <p>
                    Vários leads importados de planilhas possuíam telefones fictícios como <strong className="font-mono text-rose-700 font-bold">(11) 99999-9999</strong>, enquanto o celular real ficava misturado junto à frase do e-mail.
                  </p>
                  <p>
                    O nosso algoritmo analisou sua base de leads e encontrou sequências numéricas escondidas dentro do campo de E-mail ou do Nome. Você pode corrigir em lote!
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
                      {candidates.map(({ lead, currentEmail, currentPhone, detectedPhone, suggestedEmail, suggestedName }) => {
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
                              <div className="flex flex-col gap-1 border-b pb-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-zinc-950 text-sm tracking-tight">{lead.name}</span>
                                  <span className="text-[9px] uppercase font-mono font-black bg-zinc-100 border px-1.5 py-0.5 rounded text-zinc-600">
                                    ID: {lead.id.slice(0, 8)}...
                                  </span>
                                </div>
                                {suggestedName !== lead.name && (
                                   <div className="text-[11px] font-mono font-black bg-emerald-50 border border-emerald-300 text-emerald-800 px-1 rounded block w-max">
                                     ✔️ Novo Nome: {suggestedName}
                                   </div>
                                )}
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

                {/* Auto-Arquivamento Temporal 30 Dias (Nativo CRM) */}
                <div className="p-5 border-4 border-zinc-950 bg-amber-50/20 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[9.5px] font-mono font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 inline-block uppercase select-none">
                      Saneamento Temporal Ágil (30 Dias)
                    </span>
                    <h4 className="text-sm font-black uppercase text-zinc-950 font-mono tracking-tight flex items-center gap-1.5 mt-1">
                      <span>⏱️</span> Auto-Arquivamento de Leads Inativos
                    </h4>
                    <p className="text-[11.5px] text-zinc-650 leading-relaxed font-semibold">
                      Agilize a sua esteira de vendas! Esta inteligência local varre todos os seus contatos ativos e localiza aqueles sem interação ou contatos em <strong className="text-zinc-900 font-extrabold">mais de 30 dias</strong>.
                    </p>
                    <p className="text-[11.5px] text-zinc-650 leading-relaxed font-semibold">
                      Ao acionar, o sistema <strong className="text-zinc-900 font-extrabold">auto-arquiva</strong> os {inactiveCandidates.length} contatos elegíveis diretos sob o rótulo "Arquivados" e <strong className="text-zinc-900 font-extrabold">adianta de forma automática</strong> todas as tarefas, agendamentos e prospecções pendentes, saneando seu calendário de gargalos!
                    </p>
                  </div>
                  <div className="flex flex-col justify-center items-center md:items-end gap-3 shrink-0">
                    <div className="bg-white border-2 border-zinc-950 p-2 px-4 rounded-xl text-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono block">Elegíveis</span>
                      <strong className="text-xl font-black font-sans text-rose-600 block">{inactiveCandidates.length}</strong>
                      <span className="text-[9px] text-zinc-550 font-mono block">Inativos há +30d</span>
                    </div>

                    <button
                      type="button"
                      disabled={inactiveCandidates.length === 0}
                      onClick={handleExecute30DayCleanup}
                      className="px-5 py-3 bg-zinc-900 hover:bg-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed text-white border-2 border-zinc-950 rounded-xl font-black uppercase text-xs tracking-wider transition-colors shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer shrink-0 text-center"
                    >
                      🚀 Arquivar & Adiantar Tudo
                    </button>
                  </div>
                </div>

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
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 border-2 border-zinc-950 text-white font-black uppercase text-[10px] rounded-lg tracking-wider transition-colors shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer shrink-0"
                  >
                    🗑️ Zerar Base ({leads.length})
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-zinc-50 p-5 flex items-center justify-between border-t-2-dashed">
                <span className="text-[10px] text-zinc-500 font-bold uppercase font-sans">
                  Sincronizador Inteligente CRM © 2026
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
                      <Sparkles className="w-4 h-4 " />
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70  flex items-center justify-center p-4 ">
          <div className="bg-white border-4 border-zinc-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-850">
            {/* Header */}
            <div className="bg-zinc-900 border-b-4 border-zinc-950 p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 rounded-2xl text-zinc-950">
                  <Sparkles className="w-5 h-5 " />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                      Planejador e Conversor Ativo de Planilha
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
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black uppercase text-xs rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-colors active:translate-y-0.5 disabled:opacity-50 text-center cursor-pointer"
                >
                  {isGeneratingPlan ? '⏳ Consultando Inteligência do Gemini AI...' : '⚡ Roteirizar Base de Leads & Copys com Gemini'}
                </button>
              </div>

              {/* Advanced scheduling / roadmap calendar triggers */}
              {generatedPlanMarkdown && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 ">
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
                          <p className="text-[11px] font-mono font-black text-indigo-700 ">⚙️ Sincronizando Calendário...</p>
                          <div className="w-full bg-zinc-100 rounded-full h-3 border border-zinc-300 overflow-hidden">
                            <div className="bg-indigo-600 h-full animate-[loading_1.5s_ease-out_infinite]" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                      )}

                      {schedulingProgress === 'done' && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl space-y-2 text-center  text-xs">
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
              <span>Sincronizador CRM</span>
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

      {isBulkScheduleModalOpen && (
        <ScheduleFollowUpModal
          isOpen={isBulkScheduleModalOpen}
          onClose={() => setIsBulkScheduleModalOpen(false)}
          leads={leads}
          initialLead={null}
          initialLeads={leads.filter(l => selectedLeadIds.includes(l.id))}
          onAddAppointment={(newAppt) => {
            if (setAppointments) {
              setAppointments((prev: any) => {
                const updated = [newAppt, ...prev];
                localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
                return updated;
              });
            }
          }}
          awardXP={awardXP}
          addNotification={addNotification}
        />
      )}

      {scheduleSingleLead && (
        <ScheduleFollowUpModal
          isOpen={!!scheduleSingleLead}
          onClose={() => setScheduleSingleLead(null)}
          leads={leads}
          initialLead={scheduleSingleLead}
          initialLeads={null}
          onAddAppointment={(newAppt) => {
            if (setAppointments) {
              setAppointments((prev: any) => {
                const updated = [newAppt, ...prev];
                localStorage.setItem("ciclocred_crm_appointments", JSON.stringify(updated));
                return updated;
              });
            }
          }}
          awardXP={awardXP}
          addNotification={addNotification}
        />
      )}
        </>
      )}
    </div>
  );
});
