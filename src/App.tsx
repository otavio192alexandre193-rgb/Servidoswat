/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, EmailTemplate, EmailLog, LeadStatus, Appointment, InventoryItem, RealEstateProperty, Goal, Project, CRMNotification, FollowUpUpdate } from './types';
import { 
  INITIAL_LEADS, 
  INITIAL_TEMPLATES, 
  INITIAL_EMAIL_LOGS,
  INITIAL_PROPERTIES
} from './data/initialRecords';
import { db, auth, handleFirestoreError, OperationType, disableFirestoreNetwork } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { getKanbanColumns } from './utils/kanban';

import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import LeadList from './components/LeadList';
import FollowUpManager from './components/FollowUpManager';
import EmailAutomation from './components/EmailAutomation';
import Reports from './components/Reports';
import Appointments from './components/Appointments';
import RealEstateInventory from './components/RealEstateInventory';
import LeadModal from './components/LeadModal';
import LeadDetailsModal from './components/LeadDetailsModal';
import MultiLevelMarketingTab from './components/MultiLevelMarketingTab';
import FinanceSimulatorTab from './components/FinanceSimulatorTab';
import CicloCredInformTab from './components/CicloCredInformTab';

import PublicPortal from './components/PublicPortal';

// Sensory & Custom Sub tabs imports
import LoginView from './components/Login';
import SettingsView from './components/Settings';
import GamificationView from './components/Gamification';
import BackupManager from './components/BackupManager';
import UserCentralModal from './components/UserCentralModal';
import KidsTab from './components/KidsTab';
import AutomationFlowsTab from './components/AutomationFlowsTab';
import UserCentralTab from './components/UserCentralTab';
import GoogleWorkspace, { getWorkspaceToken, syncCRMMovementToGoogleSheet, autoSyncWorkspaceDatabase } from './components/GoogleWorkspace';
import GeminiServerTab from './components/GeminiServerTab';
import AnimatedCounter from './components/AnimatedCounter';
import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from './utils/sensory';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Mail, 
  ChevronRight, 
  Plus, 
  DollarSign, 
  Menu,
  X,
  FileSpreadsheet,
  Calendar,
  Box,
  Bell,
  BellRing,
  Sparkles,
  Check,
  AlertTriangle,
  ExternalLink,
  Cpu,
  Volume2,
  Trash2,
  Settings,
  Share2,
  Clock,
  Trophy,
  Gift,
  Cloud,
  LineChart,
  Search,
  UserPlus,
  Sliders,
  MoreHorizontal,
  Home,
  Calculator,
  BarChart2,
  User,
  Download,
  Upload
} from 'lucide-react';

export default function App() {
  // Mounting Diagnostic logs & Telemetry
  useEffect(() => {
    console.log('[App.tsx] cicloCRED CRM App Component has successfully MOUNTED in viewport DOM.');
    console.log('[App.tsx] Navigator User Agent:', navigator.userAgent);
    console.log('[App.tsx] System datetime:', new Date().toISOString());
    let loggedLeadsCount = 0;
    try {
      const savedLeads = localStorage.getItem('ciclocred_crm_leads');
      if (savedLeads) {
        loggedLeadsCount = JSON.parse(savedLeads).length || 0;
      }
    } catch (_) {}
    console.log('[App.tsx] Local storage status - leads count:', loggedLeadsCount);
    
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('[App.tsx] Silent/Unhandled runtime error intercepted:', event.message, 'at', event.filename, ':', event.lineno);
    };
    window.addEventListener('error', handleGlobalError);
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  console.log('[App.tsx] App rendering lifecycle tick.');

  // Universal Collapsible Side Drawer state
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Real-time Dynamic Header Clock, Temperature & Location
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Database Sync States
  const [isDbHydrated, setIsDbHydrated] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [forceLocalStorageMode, setForceLocalStorageMode] = useState<boolean>(() => {
    return localStorage.getItem('ciclocred_force_local_offline') === 'true';
  });
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => {
    const forced = localStorage.getItem('ciclocred_force_local_offline') === 'true';
    if (forced) return false; // Force Local Mode ignores Firestore Quota warnings
    const quotaLogged = localStorage.getItem('firestore_quota_exceeded_status') === 'true';
    return quotaLogged || !!(window as any).isFirestoreQuotaExceeded;
  });

  // Gracefully disable Firestore server communication if quota limit is exceeded
  useEffect(() => {
    if (isQuotaExceeded || forceLocalStorageMode) {
      disableFirestoreNetwork();
    }
  }, [isQuotaExceeded, forceLocalStorageMode]);

  // Handle global/custom firestore quota events
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };
    window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    const forced = localStorage.getItem('ciclocred_force_local_offline') === 'true';
    const quotaLogged = localStorage.getItem('firestore_quota_exceeded_status') === 'true';
    if (forced || quotaLogged || (window as any).isFirestoreQuotaExceeded) {
      setIsQuotaExceeded(true);
    }
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // References to safely track elements and prevent deleting on startup
  const lastLeadsIdsRef = useRef<string[]>([]);
  const lastTemplatesIdsRef = useRef<string[]>([]);
  const lastLogsIdsRef = useRef<string[]>([]);
  const lastApptsIdsRef = useRef<string[]>([]);
  const lastInventoryIdsRef = useRef<string[]>([]);
  const lastPropertiesIdsRef = useRef<string[]>([]);
  const lastGoalsIdsRef = useRef<string[]>([]);
  const lastProjectsIdsRef = useRef<string[]>([]);
  const lastFollowupsIdsRef = useRef<string[]>([]);

  const isLocalLeadsChangeRef = useRef<boolean>(false);
  const isLocalFollowUpsChangeRef = useRef<boolean>(false);
  const isLocalTemplatesChangeRef = useRef<boolean>(false);
  const isLocalEmailLogsChangeRef = useRef<boolean>(false);
  const isLocalApptsChangeRef = useRef<boolean>(false);
  const isLocalInventoryChangeRef = useRef<boolean>(false);
  const isLocalPropertiesChangeRef = useRef<boolean>(false);
  const isLocalGoalsChangeRef = useRef<boolean>(false);
  const isLocalProjectsChangeRef = useRef<boolean>(false);
  const isLocalProfileChangeRef = useRef<boolean>(false);

  // Core CRM States (Hydrated with LocalStorage or Seeded with defaults)
  const [leads, rawSetLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_leads');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const setLeads = React.useCallback((val: React.SetStateAction<Lead[]>) => {
    isLocalLeadsChangeRef.current = true;
    rawSetLeads(val);
  }, []);

  const [templates, rawSetTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_templates');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return INITIAL_TEMPLATES;
  });

  const setTemplates = React.useCallback((val: React.SetStateAction<EmailTemplate[]>) => {
    isLocalTemplatesChangeRef.current = true;
    rawSetTemplates(val);
  }, []);

  const [emailLogs, rawSetEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_logs');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return INITIAL_EMAIL_LOGS;
  });

  const setEmailLogs = React.useCallback((val: React.SetStateAction<EmailLog[]>) => {
    isLocalEmailLogsChangeRef.current = true;
    rawSetEmailLogs(val);
  }, []);

  // Helper to strictly sanitize appointment records for database schema compliance
  const sanitizeAppointmentRecord = (item: any): Appointment => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    let mappedType: 'reuniao' | 'telefone' | 'proposta' | 'outro' = 'outro';
    const rawType = String(item.type || '').toLowerCase();
    if (rawType.includes('reuniao') || rawType.includes('reunião')) mappedType = 'reuniao';
    else if (rawType.includes('telefone') || rawType.includes('telefonema') || rawType.includes('ligacao')) mappedType = 'telefone';
    else if (rawType.includes('proposta')) mappedType = 'proposta';

    let mappedStatus: 'agendado' | 'realizado' | 'cancelado' = 'agendado';
    const rawStatus = String(item.status || '').toLowerCase();
    if (rawStatus === 'realizado' || rawStatus === 'completo') mappedStatus = 'realizado';
    else if (rawStatus === 'cancelado') mappedStatus = 'cancelado';

    const cleanId = String(item.id || `appt-${Math.random().toString(36).substr(2, 9)}`).substring(0, 99);
    const cleanLeadId = String(item.leadId || item.clientId || 'lead-auto').substring(0, 99);
    const cleanLeadName = String(item.leadName || item.clientName || 'Lead Desconhecido').substring(0, 149);
    const cleanTitle = String(item.title || 'Compromisso Comercial').substring(0, 199);
    const cleanDate = (item.date && String(item.date).length === 10) ? String(item.date) : todayStr;
    const cleanTime = (item.time && String(item.time).length === 5) ? String(item.time) : '09:00';
    const cleanDesc = String(item.description || item.notes || '').substring(0, 4999);

    const result: Appointment = {
      id: cleanId,
      leadId: cleanLeadId,
      leadName: cleanLeadName,
      title: cleanTitle,
      date: cleanDate,
      time: cleanTime,
      description: cleanDesc,
      status: mappedStatus,
      type: mappedType
    };

    if (typeof item.reminderMinutes === 'number' && item.reminderMinutes >= 0) {
      result.reminderMinutes = item.reminderMinutes;
    }
    if (typeof item.reminderSent === 'boolean') {
      result.reminderSent = item.reminderSent;
    }

    return result;
  };

  // New States: Appointments and Inventory Stock
  const [appointments, rawSetAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_appointments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            const todayStr = new Date().toISOString().slice(0, 10);
            
            let mappedType: 'reuniao' | 'telefone' | 'proposta' | 'outro' = 'outro';
            const rawType = String(item.type || '').toLowerCase();
            if (rawType.includes('reuniao') || rawType.includes('reunião')) mappedType = 'reuniao';
            else if (rawType.includes('telefone') || rawType.includes('telefonema') || rawType.includes('ligacao')) mappedType = 'telefone';
            else if (rawType.includes('proposta')) mappedType = 'proposta';

            let mappedStatus: 'agendado' | 'realizado' | 'cancelado' = 'agendado';
            const rawStatus = String(item.status || '').toLowerCase();
            if (rawStatus === 'realizado' || rawStatus === 'completo') mappedStatus = 'realizado';
            else if (rawStatus === 'cancelado') mappedStatus = 'cancelado';

            const cleanId = String(item.id || `appt-${Math.random().toString(36).substr(2, 9)}`).substring(0, 99);
            const cleanLeadId = String(item.leadId || item.clientId || 'lead-auto').substring(0, 99);
            const cleanLeadName = String(item.leadName || item.clientName || 'Lead Desconhecido').substring(0, 149);
            const cleanTitle = String(item.title || 'Compromisso Comercial').substring(0, 199);
            const cleanDate = (item.date && String(item.date).length === 10) ? String(item.date) : todayStr;
            const cleanTime = (item.time && String(item.time).length === 5) ? String(item.time) : '09:00';
            const cleanDesc = String(item.description || item.notes || '').substring(0, 4999);

            const result: Appointment = {
              id: cleanId,
              leadId: cleanLeadId,
              leadName: cleanLeadName,
              title: cleanTitle,
              date: cleanDate,
              time: cleanTime,
              description: cleanDesc,
              status: mappedStatus,
              type: mappedType
            };

            if (typeof item.reminderMinutes === 'number' && item.reminderMinutes >= 0) {
              result.reminderMinutes = item.reminderMinutes;
            }
            if (typeof item.reminderSent === 'boolean') {
              result.reminderSent = item.reminderSent;
            }

            return result;
          });
        }
      } catch (err) {
        console.error("Error loaded saved appointments:", err);
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 'appt-1',
        title: 'Apresentação: Crédito de Capital de Giro',
        date: todayStr,
        time: '14:30',
        leadId: 'lead-2',
        leadName: 'Roberto Alencar',
        description: 'Explicar taxas diferenciadas do portfólio cicloCRED Empresas.',
        status: 'agendado',
        type: 'reuniao'
      },
      {
        id: 'appt-2',
        title: 'Follow-up de Assinatura de Contrato',
        date: todayStr,
        time: '16:00',
        leadId: 'lead-3',
        leadName: 'Felipe Santos Oliveira',
        description: 'Ligar para o Felipe e sanar pendências sobre as taxas retroativas.',
        status: 'agendado',
        type: 'telefone'
      }
    ];
  });

  const setAppointments = React.useCallback((val: React.SetStateAction<Appointment[]>) => {
    isLocalApptsChangeRef.current = true;
    rawSetAppointments(val);
  }, []);

  const [inventory, rawSetInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_inventory');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}

    return [
      {
        id: 'prod-1',
        name: 'Maquininha Smart cicloCRED Wi-Fi',
        sku: 'CC-SMART-001',
        category: 'Dispositivos',
        quantity: 12,
        minQuantity: 4,
        price: 299,
        status: 'disponivel',
        notes: 'Leitor de cartões de alta performance com conexão chip e Wi-Fi inclusos.'
      },
      {
        id: 'prod-2',
        name: 'Kit Contratos Físicos & Caneta cicloCRED',
        sku: 'CC-PAPER-KIT',
        category: 'Papelaria',
        quantity: 35,
        minQuantity: 10,
        price: 15,
        status: 'disponivel',
        notes: 'Pastas institucionais, canetas personalizadas cicloCRED e cédulas impressas padrão.'
      },
      {
        id: 'prod-3',
        name: 'Banners Promocionais de PDV',
        sku: 'CC-ADV-BANNER',
        category: 'Marketing',
        quantity: 2,
        minQuantity: 5,
        price: 120,
        status: 'baixo_estoque',
        notes: 'Totens impressos em lona para estandes de crédito consorciado.'
      }
    ];
  });

  const setInventory = React.useCallback((val: React.SetStateAction<InventoryItem[]>) => {
    isLocalInventoryChangeRef.current = true;
    rawSetInventory(val);
  }, []);

  const [properties, rawSetProperties] = useState<RealEstateProperty[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_properties');
    let raw = INITIAL_PROPERTIES;
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          raw = parsed;
        }
      }
    } catch (_) {}
    if (Array.isArray(raw)) {
      const seen = new Set<string>();
      return raw.filter((p: any) => {
        if (!p || !p.id) return false;
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }
    return [];
  });

  const setProperties = React.useCallback((val: React.SetStateAction<RealEstateProperty[]>) => {
    isLocalPropertiesChangeRef.current = true;
    rawSetProperties(val);
  }, []);

  const [activeTab, rawSetActiveTab] = useState<string>('leads');
  const [leadsViewMode, setLeadsViewMode] = useState<'kanban' | 'list' | 'followup' | 'automation-flows' | 'marketing'>('list');

  const setActiveTab = React.useCallback((tab: string) => {
    rawSetActiveTab(tab);
  }, []);
  const [hoveredStatusSlice, setHoveredStatusSlice] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [originFilter, setOriginFilter] = useState('todos');
  const [initialLetterFilter, setInitialLetterFilter] = useState('todos');
  const [isPlanilhasModalOpen, setIsPlanilhasModalOpen] = useState(false);
  const [isPremiumActionsOpen, setIsPremiumActionsOpen] = useState(false);
  const [isConversaoModalOpen, setIsConversaoModalOpen] = useState(false);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const unifiedFilteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
      const matchesOrigin = originFilter === 'todos' || lead.origin === originFilter;
      const matchesInitial = 
        initialLetterFilter === 'todos' ||
        lead.name.trim().charAt(0).toUpperCase() === initialLetterFilter.toUpperCase();
      return matchesSearch && matchesStatus && matchesOrigin && matchesInitial;
    });
  }, [leads, searchTerm, statusFilter, originFilter, initialLetterFilter]);

  const [followUps, rawSetFollowUps] = useState<FollowUpUpdate[]>(() => {
    const saved = localStorage.getItem('ciclocred_crm_followups');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: 'fup-1',
        leadId: 'lead-2',
        leadName: 'Roberto Alencar',
        date: new Date().toISOString().slice(0, 10),
        time: '14:00',
        type: 'ligacao',
        notes: 'Ligação de alinhamento com Roberto Alencar sobre taxas de juros habitacionais. Portabilidade cicloCRED validada e pré-aprovada.',
        nextStepTitle: 'Cobrar comprovantes adicionais de renda para Caixa',
        nextStepDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        nextStepTime: '15:00'
      }
    ];
  });

  const setFollowUps = React.useCallback((val: React.SetStateAction<FollowUpUpdate[]>) => {
    isLocalFollowUpsChangeRef.current = true;
    rawSetFollowUps(val);
  }, []);

  // USER AUTHENTICATION & ACCESSIBILITY SENSORY STATES
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ciclocred_auth_active') === 'true';
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('ciclocred_user_name') || 'Operador CicloCred';
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('ciclocred_user_email') || 'operador@ciclocred.com';
  });

  const [theme, setTheme] = useState<'claro' | 'escuro' | 'galatico'>(() => {
    return (localStorage.getItem('ciclocred_theme') as any) || 'escuro';
  });

  const [galaxyPreset, setGalaxyPreset] = useState<string>(() => {
    return localStorage.getItem('ciclocred_galaxy_preset') || 'lineack';
  });

  const [accSettings, setAccSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('ciclocred_sensory_config');
    try {
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_ACCESSIBILITY_SETTINGS;
  });

  // CUSTOM STYLED CONFIRMATION DIALOG STATE
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
    type?: 'danger' | 'warning';
  } | null>(null);

  const requestConfirmation = (
    title: string, 
    desc: string, 
    onConfirm: () => void, 
    type: 'danger' | 'warning' = 'warning'
  ) => {
    triggerSensoryFeedback('chime', accSettings);
    setConfirmModal({
      isOpen: true,
      title,
      description: desc,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      type
    });
  };

  const [isAutonomyActive, setIsAutonomyActive] = useState<boolean>(() => {
    return false; // Desativado para priorizar 100% de dados reais e prevenir simulações fictícias em background
  });

  const [autonomyIntervalSec, setAutonomyIntervalSec] = useState<number>(() => {
    return Number(localStorage.getItem('ciclocred_autonomy_interval')) || 45;
  });

  // CONNECTED GAMIFICATION STATES (Evolves from zero/zerado!)
  const [userXP, setUserXP] = useState<number>(() => {
    const saved = localStorage.getItem('ciclocred_user_xp');
    return saved ? Number(saved) : 0; // Starts fresh at 0 XP
  });

  const [userLevel, setUserLevel] = useState<number>(() => {
    const saved = localStorage.getItem('ciclocred_user_level');
    return saved ? Number(saved) : 1; // Starts fresh at Nível 1
  });

  // Profile preferences & digital sharing states
  const [showProfilePrefsModal, setShowProfilePrefsModal] = useState<boolean>(false);
  const [creciNumber, setCreciNumber] = useState<string>(() => {
    return localStorage.getItem('ciclocred_creci_number') || 'CRECI 12345-F';
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('ciclocred_user_role') || 'Corretor de Crédito Sênior';
  });
  const [agencyName, setAgencyName] = useState<string>(() => {
    return localStorage.getItem('ciclocred_agency_name') || 'cicloCRED Empreendimentos Comerciais';
  });
  const [consolidatedCrmInfo, setConsolidatedCrmInfo] = useState<string>(() => {
    return localStorage.getItem('ciclocred_consolidated_crm_info') || 'Operando com performance máxima. Metas comerciais alinhadas e integradas cycleCRED.';
  });
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>(() => {
    return localStorage.getItem('ciclocred_subscription_plan') || 'Premium VIP';
  });

  // Leads da sorte state variables
  const [isSpinningSorte, setIsSpinningSorte] = useState<boolean>(false);
  const [luckyLead, setLuckyLead] = useState<Lead | null>(null);
  const [luckyLeadCelebration, setLuckyLeadCelebration] = useState<boolean>(false);
  const [currentSpinningName, setCurrentSpinningName] = useState<string>('');

  const drawLuckyLead = () => {
    if (leads.length === 0) return;
    triggerSensoryFeedback('click', accSettings);
    setIsSpinningSorte(true);
    setLuckyLeadCelebration(false);
    setLuckyLead(null);
    
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * leads.length);
      setCurrentSpinningName(leads[randomIndex].name);
      counter++;
      
      if (counter % 2 === 0) {
        triggerSensoryFeedback('click', accSettings);
      }

      if (counter > 15) {
        clearInterval(interval);
        const finalLead = leads[Math.floor(Math.random() * leads.length)];
        setLuckyLead(finalLead);
        setIsSpinningSorte(false);
        setLuckyLeadCelebration(true);
        triggerSensoryFeedback('success', accSettings);
        awardXP(150); // reward the user for doing lucky lead drawer
        addNotification(
          '🎰 LEAD DA SORTE SORTEADO',
          `O lead "${finalLead.name}" foi selecionado! Entre em contato imediato para bônus de conversão.`,
          'success'
        );
      }
    }, 120);
  };

  const [gamificationGoals, rawSetGamificationGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('ciclocred_gamification_goals');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      { id: 'goal-1', title: 'Carregar 5 Novos Leads na Carteira', targetCount: 5, currentCount: 0, xpReward: 350, frequency: 'diaria', category: 'prospecção', completed: false },
      { id: 'goal-2', title: 'Agendar 3 Visitas Imobiliárias', targetCount: 3, currentCount: 0, xpReward: 500, frequency: 'semanal', category: 'visita', completed: false },
      { id: 'goal-3', title: 'Disparar 10 Modelos de Email Automatizados', targetCount: 10, currentCount: 0, xpReward: 250, frequency: 'diaria', category: 'email', completed: false },
      { id: 'goal-4', title: 'Fechar Proposta Comercial de Crédito', targetCount: 1, currentCount: 0, xpReward: 1200, frequency: 'mensal', category: 'venda', completed: false }
    ];
  });

  const setGamificationGoals = React.useCallback((val: React.SetStateAction<Goal[]>) => {
    isLocalGoalsChangeRef.current = true;
    rawSetGamificationGoals(val);
  }, []);

  const [gamificationProjects, rawSetGamificationProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ciclocred_gamification_projects');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      { id: 'proj-1', name: 'Expansão de Lotes Urbanos Virgem', description: 'Metodologia ativa recomendando ofertas exclusivas de terrenos planos da CicloCred.', status: 'ativo', progress: 0, xpReward: 1500, assignedToGoalId: 'goal-2' },
      { id: 'proj-2', name: 'Automação Massiva de Whatsapp', description: 'Enviar scripts de copywriting para leads frios contidos nas planilhas integradas.', status: 'em_planejamento', progress: 0, xpReward: 900, assignedToGoalId: 'goal-3' }
    ];
  });

  const setGamificationProjects = React.useCallback((val: React.SetStateAction<Project[]>) => {
    isLocalProjectsChangeRef.current = true;
    rawSetGamificationProjects(val);
  }, []);

  // Save changes to localStorage on alteration
  useEffect(() => {
    localStorage.setItem('ciclocred_auth_active', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('ciclocred_user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('ciclocred_user_email', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('ciclocred_creci_number', creciNumber);
  }, [creciNumber]);

  useEffect(() => {
    localStorage.setItem('ciclocred_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('ciclocred_agency_name', agencyName);
  }, [agencyName]);

  useEffect(() => {
    localStorage.setItem('ciclocred_consolidated_crm_info', consolidatedCrmInfo);
  }, [consolidatedCrmInfo]);

  useEffect(() => {
    localStorage.setItem('ciclocred_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ciclocred_galaxy_preset', galaxyPreset);
  }, [galaxyPreset]);

  useEffect(() => {
    localStorage.setItem('ciclocred_sensory_config', JSON.stringify(accSettings));
  }, [accSettings]);

  useEffect(() => {
    localStorage.setItem('ciclocred_user_xp', String(userXP));
  }, [userXP]);

  useEffect(() => {
    localStorage.setItem('ciclocred_user_level', String(userLevel));
  }, [userLevel]);

  useEffect(() => {
    localStorage.setItem('ciclocred_gamification_goals', JSON.stringify(gamificationGoals));
  }, [gamificationGoals]);

  useEffect(() => {
    localStorage.setItem('ciclocred_gamification_projects', JSON.stringify(gamificationProjects));
  }, [gamificationProjects]);

  // CORE METICULOSITY XP FORMULA & PROGRESS SYNC HANDLERS
  const awardXP = (xpGained: number) => {
    setUserXP(current => {
      const xpNeeded = 5000;
      let total = current + xpGained;
      let currentLevel = userLevel;
      while (total >= xpNeeded) {
        total -= xpNeeded;
        currentLevel += 1;
        // Trigger Level-Up chime sensory audio feedback
        setTimeout(() => {
          triggerSensoryFeedback('chime', accSettings);
        }, 300);
      }
      if (currentLevel !== userLevel) {
        setUserLevel(currentLevel);
      }
      return total;
    });
  };

  const progressGoalCategory = (category: 'venda' | 'prospecção' | 'visita' | 'email', amount = 1) => {
    setGamificationGoals(prevGoals => 
      prevGoals.map(g => {
        if (g.category !== category || g.completed) return g;
        const nextCount = g.currentCount + amount;
        const reached = nextCount >= g.targetCount;
        
        if (reached) {
          setTimeout(() => {
            triggerSensoryFeedback('chime', accSettings);
            // Award large bonus XP for completing a goal
            awardXP(g.xpReward);
          }, 150);
        } else {
          // Play micro click sound for incremental movement
          setTimeout(() => {
            triggerSensoryFeedback('click', accSettings);
          }, 50);
        }

        return {
          ...g,
          currentCount: reached ? g.targetCount : nextCount,
          completed: reached
        };
      })
    );
  };

  const handleResetGamification = () => {
    if (window.confirm('Deseja realmente ZERAR todo o seu progresso da gamificação (Voltar ao Nível 1, 0 XP e metas limpas)?')) {
      setUserXP(0);
      setUserLevel(1);
      const initialGoals = [
        { id: 'goal-1', title: 'Carregar 5 Novos Leads na Carteira', targetCount: 5, currentCount: 0, xpReward: 350, frequency: 'diaria', category: 'prospecção', completed: false },
        { id: 'goal-2', title: 'Agendar 3 Visitas Imobiliárias', targetCount: 3, currentCount: 0, xpReward: 500, frequency: 'semanal', category: 'visita', completed: false },
        { id: 'goal-3', title: 'Disparar 10 Modelos de Email Automatizados', targetCount: 10, currentCount: 0, xpReward: 250, frequency: 'diaria', category: 'email', completed: false },
        { id: 'goal-4', title: 'Fechar Proposta Comercial de Crédito', targetCount: 1, currentCount: 0, xpReward: 1200, frequency: 'mensal', category: 'venda', completed: false }
      ];
      const initialProjects = [
        { id: 'proj-1', name: 'Expansão de Lotes Urbanos Virgem', description: 'Metodologia ativa recomendando ofertas exclusivas de terrenos planos da CicloCred.', status: 'ativo', progress: 0, xpReward: 1500, assignedToGoalId: 'goal-2' },
        { id: 'proj-2', name: 'Automação Massiva de Whatsapp', description: 'Enviar scripts de copywriting para leads frios contidos nas planilhas integradas.', status: 'em_planejamento', progress: 0, xpReward: 900, assignedToGoalId: 'goal-3' }
      ];
      setGamificationGoals(initialGoals);
      setGamificationProjects(initialProjects);
      localStorage.setItem('ciclocred_user_xp', '0');
      localStorage.setItem('ciclocred_user_level', '1');
      localStorage.setItem('ciclocred_gamification_goals', JSON.stringify(initialGoals));
      localStorage.setItem('ciclocred_gamification_projects', JSON.stringify(initialProjects));
      triggerSensoryFeedback('warning', accSettings);
      addNotification('🏆 GAMIFICAÇÃO REINICIADA', 'Sua evolução de gamificação foi resetada com sucesso da base de dados local!', 'success');
    }
  };

  // Modals visibility configurations
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [defaultStatusForCreate, setDefaultStatusForCreate] = useState<LeadStatus>('novo');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'profile' | 'database'>('profile');

  // NOTIFICATION & ALARM CENTRAL STATES (Visual, Sonoro & Sensorial)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CRMNotification[]>(() => {
    const saved = localStorage.getItem('ciclocred_notifications');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: 'notify-1',
        title: 'Assistente Autônomo CicloCred ✨',
        message: 'Conectei seu funil de CRM. Monitorando a carteira de leads e agendamentos imobiliários em tempo real com clock tátil.',
        type: 'ai',
        timestamp: '19:00',
        read: false
      },
      {
        id: 'notify-2',
        title: 'Quartel de Gamificação Sincronizado 🎯',
        message: 'O CRM começou agora em Modo Real. Complete tarefas operacionais para obter XP e atingir outras Galáxias!',
        type: 'info',
        timestamp: '19:01',
        read: false
      }
    ];
  });

  const [activeAlarm, setActiveAlarm] = useState<{
    id: string;
    title: string;
    leadName: string;
    time: string;
    description: string;
  } | null>(null);

  // Save notifications history on alteration
  useEffect(() => {
    localStorage.setItem('ciclocred_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Request browser Web Notifications permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.log('Push notification permission blocked inside iframe context.', err);
      });
    }
  }, []);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alarm' | 'ai' = 'info') => {
    const newNotify: CRMNotification = {
      id: `notify-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotify, ...prev]);

    // Play sounds, vibrate and trigger sensory pulses
    if (type === 'alarm') {
      triggerSensoryFeedback('alarm', accSettings);
    } else if (type === 'success') {
      triggerSensoryFeedback('success', accSettings);
    } else if (type === 'ai') {
      triggerSensoryFeedback('chime', accSettings);
    } else {
      triggerSensoryFeedback('click', accSettings);
    }

    // Fire actual HTML5 Push alarm notification if authorized
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          tag: 'ciclocred-crm-alert',
          silent: false
        });
      } catch (err) {
        console.warn('Silent or regular push blocked by context.', err);
      }
    }
  };

  const handleToggleForceLocalMode = (checked: boolean) => {
    localStorage.setItem('ciclocred_force_local_offline', checked ? 'true' : 'false');
    setForceLocalStorageMode(checked);
    if (checked) {
      setIsQuotaExceeded(false); // Hide standard cloud quota warnings since we are operating locally
      disableFirestoreNetwork();
      addNotification('📁 CRM 100% LOCAL', 'Operando de forma independente no localStorage do navegador para evitar limites diários.', 'success');
    } else {
      localStorage.removeItem('ciclocred_force_local_offline');
      localStorage.removeItem('firestore_quota_exceeded_status');
      (window as any).isFirestoreQuotaExceeded = false;
      setIsQuotaExceeded(false);
      addNotification('☁️ RECONECTANDO NUVEM', 'Reiniciando a conexão com o Firebase Cloud...', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };
  const simulateCRMAction = () => {
    if (!leads || leads.length === 0) {
      // Avoid creating mock leads or dispatching fake alerts if there are no registered leads
      return;
    }
    
    // Select a real client lead indeed to create a highly contextual alert/tip
    const randomLead = leads[Math.floor(Math.random() * leads.length)];
    
    const realEvents = [
      {
        title: "🤖 Assistente Preditivo: Oportunidade!",
        message: `O portfólio habitacional está ideal para seu cliente ${randomLead.name}. Considere reavaliar o fluxo de obras com ele para otimizar os percentuais!`,
        type: "ai" as const,
        action: () => {
          awardXP(50);
        }
      },
      {
        title: "⚠️ Alerta de Acompanhamento",
        message: `O cliente ${randomLead.name} está no estágio "${randomLead.status}". Que tal registrar um novo follow-up no CRM?`,
        type: "warning" as const,
        action: () => {
          awardXP(30);
        }
      },
      {
        title: "💡 Dica de Venda",
        message: `Envie o plano de parcelamento facilitado para ${randomLead.name} via WhatsApp para acelerar a captação Caixa.`,
        type: "ai" as const,
        action: () => {
          awardXP(40);
        }
      }
    ];

    const idx = Math.floor(Math.random() * realEvents.length);
    const item = realEvents[idx];
    addNotification(item.title, item.message, item.type);
    item.action();
  };

  // Background clock check interval (real alarms with seconds synchrony!)
  useEffect(() => {
    const scanTimer = setInterval(() => {
      const now = new Date();
      // Format today
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDateStr = `${year}-${month}-${day}`;

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      setAppointments(prevAppts => {
        let hasChanges = false;
        const updatedAppts = prevAppts.map(appt => {
          // Compare today's dates, matching schedules and warning flag
          if (appt.status === 'agendado' && appt.date === currentDateStr && appt.time === currentTimeStr && !appt.reminderSent) {
            hasChanges = true;

            // Trigger alarm block
            setTimeout(() => {
              addNotification(
                `🚨 ALARME: ${appt.title}`,
                `Compromisso pendente com cliente ${appt.leadName} agora (${appt.time})! Verifique a aba de agendamentos.`,
                'alarm'
              );
              setActiveAlarm({
                id: appt.id,
                title: appt.title,
                leadName: appt.leadName,
                time: appt.time,
                description: appt.description || 'Tarefa operacional sem observações extras.'
              });
            }, 80);

            return { ...appt, reminderSent: true };
          }
          return appt;
        });

        if (hasChanges) {
          localStorage.setItem('ciclocred_crm_appointments', JSON.stringify(updatedAppts));
          return updatedAppts;
        }
        return prevAppts;
      });
    }, 6000); // Executed every 6 seconds

    return () => clearInterval(scanTimer);
  }, [accSettings]);

  // Setup loop for autonomous periodic CRM intelligence tips - completely disabled to focus strictly on real-time data
  useEffect(() => {
    localStorage.setItem('ciclocred_autonomy_enabled', 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('ciclocred_autonomy_interval', String(autonomyIntervalSec));
  }, [autonomyIntervalSec]);

  useEffect(() => {
    // Background automation for fictitious actions is completely disabled to protect real production data.
    // The assistant will never automatically broadcast fictitious notifications or mock actions.
  }, []);

  // Persistent storage side-effects
  useEffect(() => {
    localStorage.setItem('ciclocred_crm_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('ciclocred_crm_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('ciclocred_crm_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem('ciclocred_crm_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('ciclocred_crm_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('ciclocred_crm_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('ciclocred_crm_followups', JSON.stringify(followUps));
  }, [followUps]);

  // Hybrid Workspace Real-time background replication backplane
  useEffect(() => {
    // Wait until db is loaded initially to avoid syncing before hydration
    const isAutosync = localStorage.getItem('ciclocred_sheets_autosync_enabled') === 'true';
    if (!isAutosync) return;

    const timer = setTimeout(() => {
      autoSyncWorkspaceDatabase(leads, appointments, emailLogs)
        .catch(err => console.warn("Background auto sync to Google Workspace failed silently:", err));
    }, 4500); // 4.5s debounce to keep REST requests healthy and non-blocking

    return () => clearTimeout(timer);
  }, [leads, appointments, emailLogs]);

  // One-time startup sweep to zero the lead list and fulfill user intent safely (offline/local mode)
  useEffect(() => {
    const hasWiped = localStorage.getItem('ciclocred_leads_wiped_zero_v3') === 'true';
    if (!hasWiped) {
      localStorage.removeItem('ciclocred_crm_leads');
      setLeads([]);
      lastLeadsIdsRef.current = [];
      if (!auth.currentUser) {
        localStorage.setItem('ciclocred_leads_wiped_zero_v3', 'true');
      }
    }
  }, []);

  // ONE-TIME BOOTSTRAP TO GALAXY CHASSIS - 100% REAL AND ZEROED gamification
  useEffect(() => {
    const hasGalaxyReset = localStorage.getItem('ciclocred_galaxy_force_reset_v4') === 'true';
    if (!hasGalaxyReset) {
      setUserXP(0);
      setUserLevel(1);
      
      const resetGoals = [
        { id: 'goal-1', title: 'Carregar 5 Novos Leads na Carteira', targetCount: 5, currentCount: 0, xpReward: 350, frequency: 'diaria', category: 'prospecção', completed: false },
        { id: 'goal-2', title: 'Agendar 3 Visitas Imobiliárias', targetCount: 3, currentCount: 0, xpReward: 500, frequency: 'semanal', category: 'visita', completed: false },
        { id: 'goal-3', title: 'Disparar 10 Modelos de Email Automatizados', targetCount: 10, currentCount: 0, xpReward: 250, frequency: 'diaria', category: 'email', completed: false },
        { id: 'goal-4', title: 'Fechar Proposta Comercial de Crédito', targetCount: 1, currentCount: 0, xpReward: 1200, frequency: 'mensal', category: 'venda', completed: false }
      ];
      const resetProjects = [
        { id: 'proj-1', name: 'Expansão de Lotes Urbanos Virgem', description: 'Metodologia ativa recomendando ofertas exclusivas de terrenos planos da CicloCred.', status: 'ativo', progress: 0, xpReward: 1500, assignedToGoalId: 'goal-2' },
        { id: 'proj-2', name: 'Automação Massiva de Whatsapp', description: 'Enviar scripts de copywriting para leads frios contidos nas planilhas integradas.', status: 'em_planejamento', progress: 0, xpReward: 900, assignedToGoalId: 'goal-3' }
      ];
      
      setGamificationGoals(resetGoals);
      setGamificationProjects(resetProjects);
      
      localStorage.setItem('ciclocred_user_xp', '0');
      localStorage.setItem('ciclocred_user_level', '1');
      localStorage.setItem('ciclocred_gamification_goals', JSON.stringify(resetGoals));
      localStorage.setItem('ciclocred_gamification_projects', JSON.stringify(resetProjects));
      localStorage.setItem('ciclocred_autonomy_enabled', 'false');
      localStorage.setItem('ciclocred_galaxy_force_reset_v4', 'true');
    }
  }, []);

  // 1. Authentication Status Sync & Firestore Hydration logic
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserName(user.displayName || user.email?.split('@')[0].toUpperCase() || 'Operador CicloCred');
        setUserEmail(user.email || 'operador@ciclocred.com');
        setIsSyncing(true);

        const forcedOffline = localStorage.getItem('ciclocred_force_local_offline') === 'true';
        const quotaExceededLogged = localStorage.getItem('firestore_quota_exceeded_status') === 'true';
        let rawQuotaExceeded = quotaExceededLogged || !!(window as any).isFirestoreQuotaExceeded;

        if (forcedOffline) {
          console.log("CRM: Operando em modo 100% Local (escolha do operador).");
          setIsQuotaExceeded(false);
          setIsDbHydrated(true);
          setIsSyncing(false);
          return;
        }

        if (!rawQuotaExceeded) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch('/api/server/status', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
              const status = await res.json();
              if (status.isQuotaExceeded) {
                console.warn("Server reported Firestore quota is exceeded during hydration check.");
                rawQuotaExceeded = true;
                localStorage.setItem('firestore_quota_exceeded_status', 'true');
                (window as any).isFirestoreQuotaExceeded = true;
                try {
                  window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
                } catch (_) {}
              }
            }
          } catch (fetchErr) {
            console.warn("Could not retrieve server status within timeout:", fetchErr);
          }
        }

        if (rawQuotaExceeded) {
          console.warn("Quota exceeded or Offline local-only mode detected. Hydrating instantly from localStorage.");
          setIsQuotaExceeded(true);
          setIsDbHydrated(true);
          setIsSyncing(false);
          return;
        }

        try {
          // Check for one-time wipe to clear the 147 dummy/fictitious leads
          const hasWiped = localStorage.getItem('ciclocred_leads_wiped_zero_v3') === 'true';
          if (!hasWiped) {
            if ((window as any).isFirestoreQuotaExceeded || localStorage.getItem('firestore_quota_exceeded_status') === 'true') {
              throw new Error("resource-exhausted: Quota exceeded during wipe processing");
            }
            const leadsSnapshot = await getDocs(collection(db, 'leads'));
            for (const docSnap of leadsSnapshot.docs) {
              if ((window as any).isFirestoreQuotaExceeded || localStorage.getItem('firestore_quota_exceeded_status') === 'true') {
                throw new Error("resource-exhausted: Quota exceeded during deletion activity");
              }
              await deleteDoc(doc(db, 'leads', docSnap.id));
            }
            localStorage.setItem('ciclocred_crm_leads', JSON.stringify([]));
            localStorage.setItem('ciclocred_leads_wiped_zero_v3', 'true');
            setLeads([]);
            lastLeadsIdsRef.current = [];
          }

          const loadOrSeedCollection = async <T extends { id: string }>(
            colName: string,
            initialSeed: T[],
            setter: React.Dispatch<React.SetStateAction<T[]>>,
            idRef: React.MutableRefObject<string[]>
          ) => {
            if ((window as any).isFirestoreQuotaExceeded || localStorage.getItem('firestore_quota_exceeded_status') === 'true') {
              throw new Error(`resource-exhausted: Quota exceeded before query of ${colName}`);
            }
            const querySnapshot = await getDocs(collection(db, colName));
            if (querySnapshot.empty) {
              const cleanSeed = colName === 'appointments' 
                ? initialSeed.map(item => sanitizeAppointmentRecord(item) as unknown as T)
                : initialSeed;
              for (const item of cleanSeed) {
                if ((window as any).isFirestoreQuotaExceeded || localStorage.getItem('firestore_quota_exceeded_status') === 'true') {
                  throw new Error(`resource-exhausted: Quota exceeded during seed write of ${colName}`);
                }
                await setDoc(doc(db, colName, item.id), item);
              }
              const seen = new Set<string>();
              const uniqueSeed = cleanSeed.filter(item => {
                const idStr = String(item.id || '');
                if (!idStr || seen.has(idStr)) return false;
                seen.add(idStr);
                return true;
              });
              setter(uniqueSeed);
              idRef.current = uniqueSeed.map(i => i.id);
            } else {
              const loaded: T[] = [];
              querySnapshot.forEach((docSnap) => {
                let data = docSnap.data();
                if (colName === 'appointments') {
                  data = sanitizeAppointmentRecord(data);
                }
                loaded.push(data as T);
              });
              const seen = new Set<string>();
              const uniqueLoaded = loaded.filter(item => {
                const idStr = String(item.id || '');
                if (!idStr || seen.has(idStr)) return false;
                seen.add(idStr);
                return true;
              });
              setter(uniqueLoaded);
              idRef.current = uniqueLoaded.map(i => i.id);
            }
          };

          await loadOrSeedCollection('leads', leads, rawSetLeads, lastLeadsIdsRef);
          await loadOrSeedCollection('templates', templates, rawSetTemplates, lastTemplatesIdsRef);
          await loadOrSeedCollection('emailLogs', emailLogs, rawSetEmailLogs, lastLogsIdsRef);
          await loadOrSeedCollection('appointments', appointments, rawSetAppointments, lastApptsIdsRef);
          await loadOrSeedCollection('inventory', inventory, rawSetInventory, lastInventoryIdsRef);
          await loadOrSeedCollection('properties', properties, rawSetProperties, lastPropertiesIdsRef);
          await loadOrSeedCollection('gamificationGoals', gamificationGoals, rawSetGamificationGoals, lastGoalsIdsRef);
          await loadOrSeedCollection('gamificationProjects', gamificationProjects, rawSetGamificationProjects, lastProjectsIdsRef);
          await loadOrSeedCollection('followups', followUps, rawSetFollowUps, lastFollowupsIdsRef);

          // Load or Seed userProfile
          try {
            const profileRef = doc(db, 'userProfiles', user.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const data = profileSnap.data();
              const firestoreUpdatedAt = data.updatedAt || 0;
              const localUpdatedAt = Number(localStorage.getItem('ciclocred_profile_updated_at') || '0');
              
              if (firestoreUpdatedAt >= localUpdatedAt) {
                console.log("CRM: Carregando perfil mais recente do Firestore");
                isLocalProfileChangeRef.current = false;
                if (data.userName) setUserName(data.userName);
                if (data.userEmail) setUserEmail(data.userEmail);
                if (data.creciNumber) setCreciNumber(data.creciNumber);
                if (data.userRole) setUserRole(data.userRole);
                if (data.agencyName) setAgencyName(data.agencyName);
                if (data.subscriptionPlan) setSubscriptionPlan(data.subscriptionPlan);
                if (data.theme) setTheme(data.theme);
                if (data.galaxyPreset) setGalaxyPreset(data.galaxyPreset);
                if (data.userXP !== undefined) setUserXP(data.userXP);
                if (data.userLevel !== undefined) setUserLevel(data.userLevel);
                if (data.accSettings) setAccSettings(data.accSettings);
                if (data.notifications) setNotifications(data.notifications);
                localStorage.setItem('ciclocred_profile_updated_at', String(firestoreUpdatedAt));
              } else {
                console.log("CRM: Perfil local é mais recente. Irá sincronizar para o Firestore");
                isLocalProfileChangeRef.current = true;
              }
            } else {
              console.log("CRM: Criando perfil inicial no Firestore com os dados locais");
              isLocalProfileChangeRef.current = true;
            }
          } catch (profileErr) {
            console.warn("Could not sync user profile on login:", profileErr);
          }

          setIsDbHydrated(true);
        } catch (err: any) {
          console.error("Hydration fault: ", err);
          const errMsg = err?.message || String(err);
          const errCode = err?.code || '';
          
          const isQuota = 
            errCode === 'resource-exhausted' ||
            errMsg.toLowerCase().includes('quota') || 
            errMsg.toLowerCase().includes('exhausted') || 
            errMsg.toLowerCase().includes('resource-exhausted');

          if (isQuota) {
            localStorage.setItem('firestore_quota_exceeded_status', 'true');
            (window as any).isFirestoreQuotaExceeded = true;
            try {
              window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
            } catch (_) {}
            setIsQuotaExceeded(true);
          } else {
            console.warn("CRM: Outra falha de conexão/CORS de sandbox detectada. Operando em modo seguro local.");
          }
          setIsDbHydrated(true); // CRITICAL: Always hydrate so the CRM interface initializes with localStorage fallback states!
        } finally {
          setIsSyncing(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsDbHydrated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Active Firestore Live synchronization for all CRM data matrices
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    const unsubscribeLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      if (isLocalLeadsChangeRef.current) return;
      const loaded: Lead[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as Lead);
      });
      loaded.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      
      localStorage.setItem('ciclocred_crm_leads', JSON.stringify(loaded));
      rawSetLeads(loaded);
      lastLeadsIdsRef.current = loaded.map(l => l.id);
    }, (err) => {
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
      } else {
        handleFirestoreError(err, OperationType.GET, 'leads');
      }
    });

    const unsubscribeFollowups = onSnapshot(collection(db, 'followups'), (snapshot) => {
      if (isLocalFollowUpsChangeRef.current) return;
      const loaded: FollowUpUpdate[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as FollowUpUpdate);
      });
      loaded.sort((a, b) => {
        const valA = `${a.date || ''} ${a.time || ''}`;
        const valB = `${b.date || ''} ${b.time || ''}`;
        return valB.localeCompare(valA);
      });
      
      localStorage.setItem('ciclocred_crm_followups', JSON.stringify(loaded));
      rawSetFollowUps(loaded);
      lastFollowupsIdsRef.current = loaded.map(f => f.id);
    }, (err) => {
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
      } else {
        handleFirestoreError(err, OperationType.GET, 'followups');
      }
    });

    const unsubscribeAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      if (isLocalApptsChangeRef.current) return;
      const loaded: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(sanitizeAppointmentRecord(docSnap.data()));
      });
      localStorage.setItem('ciclocred_crm_appointments', JSON.stringify(loaded));
      rawSetAppointments(loaded);
      lastApptsIdsRef.current = loaded.map(a => a.id);
    }, (err) => {
      console.warn("Appointments live listener failed:", err);
    });

    const unsubscribeTemplates = onSnapshot(collection(db, 'templates'), (snapshot) => {
      if (isLocalTemplatesChangeRef.current) return;
      const loaded: EmailTemplate[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as EmailTemplate);
      });
      localStorage.setItem('ciclocred_crm_templates', JSON.stringify(loaded));
      rawSetTemplates(loaded);
      lastTemplatesIdsRef.current = loaded.map(t => t.id);
    }, (err) => {
      console.warn("Templates live listener failed:", err);
    });

    const unsubscribeEmailLogs = onSnapshot(collection(db, 'emailLogs'), (snapshot) => {
      if (isLocalEmailLogsChangeRef.current) return;
      const loaded: EmailLog[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as EmailLog);
      });
      localStorage.setItem('ciclocred_crm_logs', JSON.stringify(loaded));
      rawSetEmailLogs(loaded);
      lastLogsIdsRef.current = loaded.map(l => l.id);
    }, (err) => {
      console.warn("EmailLogs live listener failed:", err);
    });

    const unsubscribeInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      if (isLocalInventoryChangeRef.current) return;
      const loaded: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as InventoryItem);
      });
      localStorage.setItem('ciclocred_crm_inventory', JSON.stringify(loaded));
      rawSetInventory(loaded);
      lastInventoryIdsRef.current = loaded.map(i => i.id);
    }, (err) => {
      console.warn("Inventory live listener failed:", err);
    });

    const unsubscribeProperties = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (isLocalPropertiesChangeRef.current) return;
      const loaded: RealEstateProperty[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as RealEstateProperty);
      });
      localStorage.setItem('ciclocred_crm_properties', JSON.stringify(loaded));
      rawSetProperties(loaded);
      lastPropertiesIdsRef.current = loaded.map(p => p.id);
    }, (err) => {
      console.warn("Properties live listener failed:", err);
    });

    const unsubscribeGoals = onSnapshot(collection(db, 'gamificationGoals'), (snapshot) => {
      if (isLocalGoalsChangeRef.current) return;
      const loaded: Goal[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as Goal);
      });
      localStorage.setItem('ciclocred_gamification_goals', JSON.stringify(loaded));
      rawSetGamificationGoals(loaded);
      lastGoalsIdsRef.current = loaded.map(g => g.id);
    }, (err) => {
      console.warn("Goals live listener failed:", err);
    });

    const unsubscribeProjects = onSnapshot(collection(db, 'gamificationProjects'), (snapshot) => {
      if (isLocalProjectsChangeRef.current) return;
      const loaded: Project[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(docSnap.data() as Project);
      });
      localStorage.setItem('ciclocred_gamification_projects', JSON.stringify(loaded));
      rawSetGamificationProjects(loaded);
      lastProjectsIdsRef.current = loaded.map(p => p.id);
    }, (err) => {
      console.warn("Projects live listener failed:", err);
    });

    const unsubscribeProfile = onSnapshot(doc(db, 'userProfiles', auth.currentUser.uid), (docSnap) => {
      if (isLocalProfileChangeRef.current) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.userName) setUserName(data.userName);
        if (data.userEmail) setUserEmail(data.userEmail);
        if (data.creciNumber) setCreciNumber(data.creciNumber);
        if (data.userRole) setUserRole(data.userRole);
        if (data.agencyName) setAgencyName(data.agencyName);
        if (data.subscriptionPlan) setSubscriptionPlan(data.subscriptionPlan);
        if (data.theme) setTheme(data.theme);
        if (data.galaxyPreset) setGalaxyPreset(data.galaxyPreset);
        if (data.userXP !== undefined) setUserXP(data.userXP);
        if (data.userLevel !== undefined) setUserLevel(data.userLevel);
        if (data.accSettings) setAccSettings(data.accSettings);
        if (data.notifications) setNotifications(data.notifications);
        localStorage.setItem('ciclocred_profile_updated_at', String(data.updatedAt || Date.now()));
      }
    }, (err) => {
      console.warn("UserProfile snapshot error:", err);
    });

    return () => {
      unsubscribeLeads();
      unsubscribeFollowups();
      unsubscribeAppointments();
      unsubscribeTemplates();
      unsubscribeEmailLogs();
      unsubscribeInventory();
      unsubscribeProperties();
      unsubscribeGoals();
      unsubscribeProjects();
      unsubscribeProfile();
    };
  }, [isDbHydrated, isQuotaExceeded]);

  // Leads Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalLeadsChangeRef.current) return;
    const syncLeads = async () => {
      try {
        const lastIds = lastLeadsIdsRef.current;
        const currentIds = new Set(leads.map(l => l.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'leads', id));
          }
        }
        for (const lead of leads) {
          await setDoc(doc(db, 'leads', lead.id), lead);
        }
        lastLeadsIdsRef.current = Array.from(currentIds);
        isLocalLeadsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'leads');
      }
    };
    syncLeads();
  }, [leads, isDbHydrated, isQuotaExceeded]);

  // Templates Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalTemplatesChangeRef.current) return;
    const syncTemplates = async () => {
      try {
        const lastIds = lastTemplatesIdsRef.current;
        const currentIds = new Set(templates.map(t => t.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'templates', id));
          }
        }
        for (const template of templates) {
          await setDoc(doc(db, 'templates', template.id), template);
        }
        lastTemplatesIdsRef.current = Array.from(currentIds);
        isLocalTemplatesChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'templates');
      }
    };
    syncTemplates();
  }, [templates, isDbHydrated, isQuotaExceeded]);

  // EmailLogs Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalEmailLogsChangeRef.current) return;
    const syncLogs = async () => {
      try {
        const lastIds = lastLogsIdsRef.current;
        const currentIds = new Set(emailLogs.map(l => l.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'emailLogs', id));
          }
        }
        for (const log of emailLogs) {
          await setDoc(doc(db, 'emailLogs', log.id), log);
        }
        lastLogsIdsRef.current = Array.from(currentIds);
        isLocalEmailLogsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'emailLogs');
      }
    };
    syncLogs();
  }, [emailLogs, isDbHydrated, isQuotaExceeded]);

  // Appointments Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalApptsChangeRef.current) return;
    const syncAppts = async () => {
      try {
        const lastIds = lastApptsIdsRef.current;
        const currentIds = new Set(appointments.map(a => a.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'appointments', id));
          }
        }
        for (const appt of appointments) {
          await setDoc(doc(db, 'appointments', appt.id), appt);
        }
        lastApptsIdsRef.current = Array.from(currentIds);
        isLocalApptsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'appointments');
      }
    };
    syncAppts();
  }, [appointments, isDbHydrated, isQuotaExceeded]);

  // Inventory Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalInventoryChangeRef.current) return;
    const syncInventory = async () => {
      try {
        const lastIds = lastInventoryIdsRef.current;
        const currentIds = new Set(inventory.map(i => i.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'inventory', id));
          }
        }
        for (const item of inventory) {
          await setDoc(doc(db, 'inventory', item.id), item);
        }
        lastInventoryIdsRef.current = Array.from(currentIds);
        isLocalInventoryChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'inventory');
      }
    };
    syncInventory();
  }, [inventory, isDbHydrated, isQuotaExceeded]);

  // Properties Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalPropertiesChangeRef.current) return;
    const syncProperties = async () => {
      try {
        const lastIds = lastPropertiesIdsRef.current;
        const currentIds = new Set(properties.map(p => p.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'properties', id));
          }
        }
        for (const item of properties) {
          await setDoc(doc(db, 'properties', item.id), item);
        }
        lastPropertiesIdsRef.current = Array.from(currentIds);
        isLocalPropertiesChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'properties');
      }
    };
    syncProperties();
  }, [properties, isDbHydrated, isQuotaExceeded]);

  // GamificationGoals Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalGoalsChangeRef.current) return;
    const syncGoals = async () => {
      try {
        const lastIds = lastGoalsIdsRef.current;
        const currentIds = new Set(gamificationGoals.map(g => g.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'gamificationGoals', id));
          }
        }
        for (const goal of gamificationGoals) {
          await setDoc(doc(db, 'gamificationGoals', goal.id), goal);
        }
        lastGoalsIdsRef.current = Array.from(currentIds);
        isLocalGoalsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'gamificationGoals');
      }
    };
    syncGoals();
  }, [gamificationGoals, isDbHydrated, isQuotaExceeded]);

  // GamificationProjects Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalProjectsChangeRef.current) return;
    const syncProjects = async () => {
      try {
        const lastIds = lastProjectsIdsRef.current;
        const currentIds = new Set(gamificationProjects.map(p => p.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'gamificationProjects', id));
          }
        }
        for (const proj of gamificationProjects) {
          await setDoc(doc(db, 'gamificationProjects', proj.id), proj);
        }
        lastProjectsIdsRef.current = Array.from(currentIds);
        isLocalProjectsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'gamificationProjects');
      }
    };
    syncProjects();
  }, [gamificationProjects, isDbHydrated, isQuotaExceeded]);

  // FollowUps Sync
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalFollowUpsChangeRef.current) return;
    const syncFollowUps = async () => {
      try {
        const lastIds = lastFollowupsIdsRef.current;
        const currentIds = new Set(followUps.map(f => f.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, 'followups', id));
          }
        }
        for (const fup of followUps) {
          await setDoc(doc(db, 'followups', fup.id), fup);
        }
        lastFollowupsIdsRef.current = Array.from(currentIds);
        isLocalFollowUpsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'followups');
      }
    };
    syncFollowUps();
  }, [followUps, isDbHydrated, isQuotaExceeded]);

  // Enable local tracking 5 seconds after hydration is complete to prevent initial load overwrite loops
  useEffect(() => {
    if (isDbHydrated) {
      const timer = setTimeout(() => {
        isLocalProfileChangeRef.current = true;
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      isLocalProfileChangeRef.current = false;
    }
  }, [isDbHydrated]);

  // Synchronize userProfile state changes to Firestore
  useEffect(() => {
    if (!isDbHydrated || !auth.currentUser || isQuotaExceeded) return;
    if (!isLocalProfileChangeRef.current) return;

    const syncProfile = async () => {
      try {
        const profileDoc = {
          userName,
          userEmail,
          creciNumber,
          userRole,
          agencyName,
          consolidatedCrmInfo,
          subscriptionPlan,
          theme,
          galaxyPreset,
          userXP,
          userLevel,
          accSettings,
          notifications,
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'userProfiles', auth.currentUser!.uid), profileDoc);
        localStorage.setItem('ciclocred_profile_updated_at', String(profileDoc.updatedAt));
      } catch (err) {
        console.warn("Failed to sync userProfile to Firestore:", err);
      }
    };
    
    // Debounce uploads by 1200ms to avoid flooding on keystrokes/XP rewards
    const timer = setTimeout(() => {
      syncProfile();
    }, 1200);
    return () => clearTimeout(timer);
  }, [userName, userEmail, creciNumber, userRole, agencyName, consolidatedCrmInfo, subscriptionPlan, theme, galaxyPreset, userXP, userLevel, accSettings, notifications, isDbHydrated, isQuotaExceeded]);

  // Lead transition handler
  const handleMoveLead = (leadId: string, newStatus: LeadStatus, newPageId?: string) => {
    let previousStatus: LeadStatus | undefined;
    
    // Get columns to automatically tag the lead based on matching stage label
    const cols = getKanbanColumns();
    const targetCol = cols.find(c => c.id === newStatus);
    const stageLabel = targetCol ? targetCol.label : String(newStatus);

    setLeads(prevLeads => {
      return prevLeads.map(l => {
        if (l.id === leadId) {
          previousStatus = l.status;
          const currentTags = l.tags || [];
          const newTags = currentTags.includes(stageLabel) ? currentTags : [...currentTags, stageLabel];
          return { 
            ...l, 
            status: newStatus, 
            tags: newTags,
            funnelPageId: newPageId !== undefined ? newPageId : (l.funnelPageId || 'principal')
          };
        }
        return l;
      });
    });
    
    // Sync current details modal if matches
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // Trigger Gamification for moving leads in Kanban!
    if (previousStatus && previousStatus !== newStatus) {
      if (newStatus === 'fechado') {
        progressGoalCategory('venda', 1);
        awardXP(500); // 500 XP big closed win deal bonus!
      } else {
        awardXP(40); // 40 XP for advancing pipeline stage
      }

      // Sync to Google Sheets Real-time
      const leadObj = leads.find(l => l.id === leadId);
      if (leadObj) {
        syncCRMMovementToGoogleSheet(
          'Fase Alterada',
          `Lead ${leadObj.name} movido de [${(previousStatus || '').toUpperCase()}] para [${newStatus.toUpperCase()}] | Negócio: R$ ${leadObj.value.toLocaleString('pt-BR')}`,
          userName
        );
      }
    }
  };

  const handleUpdateNotes = (leadId: string, newNotes: string) => {
    setLeads(prevLeads => 
      prevLeads.map(l => l.id === leadId ? { ...l, notes: newNotes } : l)
    );
     // Sync current details modal if matches
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails(prev => prev ? { ...prev, notes: newNotes } : null);
    }
  };

  const handleUpdateFamilyIncome = (leadId: string, income: number) => {
    setLeads(prevLeads => 
      prevLeads.map(l => l.id === leadId ? { ...l, familyIncome: income } : l)
    );
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails(prev => prev ? { ...prev, familyIncome: income } : null);
    }
  };

  const handleAddFollowUp = (newFupData: Omit<FollowUpUpdate, 'id'>, createAppointment: boolean) => {
    const newId = `fup-${Date.now()}`;
    const completeFup: FollowUpUpdate = {
      id: newId,
      ...newFupData
    };
    
    setFollowUps(prev => [completeFup, ...prev]);

    if (createAppointment && newFupData.nextStepTitle && newFupData.nextStepDate) {
      const newAppt: Appointment = {
        id: `appt-fup-${Date.now()}`,
        leadId: newFupData.leadId,
        leadName: newFupData.leadName,
        title: `Follow-Up: ${newFupData.nextStepTitle}`,
        date: newFupData.nextStepDate,
        time: newFupData.nextStepTime || '12:00',
        description: `Agendado automaticamente via painel de Follow-Up. Notas: ${newFupData.notes}`,
        status: 'agendado',
        type: newFupData.type === 'ligacao' ? 'telefone' : newFupData.type === 'reuniao' ? 'reuniao' : 'outro'
      };
      
      setAppointments(prev => [newAppt, ...prev]);
    }

    awardXP(80);
    triggerSensoryFeedback('success', accSettings);
    addNotification(
      '🎙️ HISTÓRICO ATUALIZADO',
      `Follow-up registrado com sucesso para o lead ${newFupData.leadName}. +80 XP!`,
      'success'
    );
  };

  const handleDeleteFollowUp = (id: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
    triggerSensoryFeedback('warning', accSettings);
    addNotification('🗑️ HISTÓRICO REMOVIDO', 'Registro de follow-up removido do CRM.', 'warning');
  };

  const handleDeleteLead = (leadId: string) => {
    const leadObj = leads.find(l => l.id === leadId);
    const leadName = leadObj ? leadObj.name : 'este lead';
    requestConfirmation(
      'Remover Cliente Lead?',
      `Tem certeza de que deseja remover permanentemente o lead "${leadName}" do CRM? Esta ação apagará seu histórico nesta sessão de forma definitiva.`,
      () => {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
          setIsDetailsModalOpen(false);
        }
        triggerSensoryFeedback('warning', accSettings);
        addNotification('🗑️ LEAD REMOVIDO', `O lead "${leadName}" foi removido do seu funil.`, 'warning');
      },
      'danger'
    );
  };

  const handleWipeLeads = async () => {
    setLeads([]);
    localStorage.setItem('ciclocred_crm_leads', JSON.stringify([]));
    lastLeadsIdsRef.current = [];
    if (auth.currentUser) {
      try {
        const querySnapshot = await getDocs(collection(db, 'leads'));
        for (const d of querySnapshot.docs) {
          await deleteDoc(doc(db, 'leads', d.id));
        }
      } catch (e) {
        console.error("Erro ao expurgar leads no Firebase:", e);
      }
    }
    triggerSensoryFeedback('alarm', accSettings);
    addNotification('🗑️ LEADS EXPURGADOS', 'Toda a base de leads foi limpa com sucesso.', 'warning');
  };

  const handleWipeProperties = async () => {
    setProperties([]);
    localStorage.setItem('ciclocred_crm_properties', JSON.stringify([]));
    lastPropertiesIdsRef.current = [];
    if (auth.currentUser) {
      try {
        const querySnapshot = await getDocs(collection(db, 'properties'));
        for (const d of querySnapshot.docs) {
          await deleteDoc(doc(db, 'properties', d.id));
        }
      } catch (e) {
        console.error("Erro ao expurgar properties no Firebase:", e);
      }
    }
    triggerSensoryFeedback('alarm', accSettings);
    addNotification('🏠 ESTOQUE EXPURGADO', 'Todo o estoque correspondente foi limpo com sucesso.', 'warning');
  };

  const handleSaveLead = (savedLead: Lead) => {
    let isNew = false;
    setLeads(prevLeads => {
      const exists = prevLeads.some(l => l.id === savedLead.id);
      if (!exists) isNew = true;
      if (exists) {
        return prevLeads.map(l => l.id === savedLead.id ? savedLead : l);
      } else {
        return [savedLead, ...prevLeads];
      }
    });

    if (isNew) {
      progressGoalCategory('prospecção', 1);
      awardXP(50); // 50 XP for cataloging new prospective client
      
      syncCRMMovementToGoogleSheet(
        'Lead Cadastrado',
        `Novo prospecto ${savedLead.name} criado | Origem: ${savedLead.origin} | Valor: R$ ${savedLead.value.toLocaleString('pt-BR')}`,
        userName
      );
    } else {
      syncCRMMovementToGoogleSheet(
        'Lead Atualizado',
        `Cadastro de ${savedLead.name} editado ou atualizado pelo painel CRM.`,
        userName
      );
    }

    setIsLeadModalOpen(false);
    setSelectedLeadForEdit(null);
  };

  const handleAddNewLeadCapturedPublicly = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
    progressGoalCategory('prospecção', 1);
    awardXP(150);
    addNotification(
      '💥 NOVO LEAD CAPTADO!',
      `O cliente ${newLead.name} cadastrou-se no seu Site Público manifestando interesse num valor estimado de R$ ${newLead.value.toLocaleString('pt-BR')}.`,
      'success'
    );

    syncCRMMovementToGoogleSheet(
      'Captura Pública',
      `Lead ${newLead.name} inserido via Site Externo | Telefone: ${newLead.phone} | Orçamento de Investimento: R$ ${newLead.value.toLocaleString('pt-BR')}`,
      'Site Público Captor'
    );
  };

  // Templates CRUD side actions
  const handleAddTemplate = (newTemplate: EmailTemplate) => {
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleEditTemplate = (updatedTemplate: EmailTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const handleDeleteTemplate = (templateId: string) => {
    const tempObj = templates.find(t => t.id === templateId);
    const tempName = tempObj ? tempObj.title : 'este modelo';
    requestConfirmation(
      'Remover Modelo de E-mail?',
      `Deseja realmente apagar o template de mensagem "${tempName}"? Isto desativará campanhas de follow-up ligadas a ele.`,
      () => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        triggerSensoryFeedback('warning', accSettings);
        addNotification('📨 TEMPLATE REMOVIDO', `O modelo "${tempName}" foi excluído.`, 'info');
      },
      'danger'
    );
  };

  const handleSendEmailSimulated = (log: EmailLog) => {
    setEmailLogs(prev => [log, ...prev]);
    // Tag lead profile with last contacted timestamp
    setLeads(prev => 
      prev.map(l => l.id === log.leadId ? { ...l, lastContactAt: log.sentAt } : l)
    );

    // Automation email trigger gamified XP!
    progressGoalCategory('email', 1);
    awardXP(25); // 25 XP for automated template trigger
  };

  const handleAddAppointment = (newAppt: Appointment) => {
    setAppointments(prev => [newAppt, ...prev]);

    // Visita goal progress!
    progressGoalCategory('visita', 1);
    awardXP(100); // 100 XP for planning & scheduling a visit!

    syncCRMMovementToGoogleSheet(
      'Visita Agendada',
      `Reunião/Visita agendada para o cliente [${newAppt.leadName}] | Assunto: ${newAppt.title} em ${newAppt.date} às ${newAppt.time}`,
      userName
    );
  };

  const handleUpdateAppointmentStatus = (id: string, status: 'agendado' | 'realizado' | 'cancelado') => {
    let previousStatus: Appointment['status'] | undefined;
    setAppointments(prev => {
      const appt = prev.find(a => a.id === id);
      if (appt) previousStatus = appt.status;
      return prev.map(a => a.id === id ? { ...a, status } : a);
    });

    if (status === 'realizado' && previousStatus !== 'realizado') {
      progressGoalCategory('visita', 1);
      awardXP(200); // 200 XP for successfully finishing an operational task!
    }
  };

  const handleDeleteAppointment = (id: string) => {
    const appObj = appointments.find(a => a.id === id);
    const appTitle = appObj ? appObj.title : 'compromisso';
    requestConfirmation(
      'Excluir Agendamento?',
      `Tem certeza que deseja apagar o compromisso comercial "${appTitle}"? Isto desativará o alarme em tempo real no CRM.`,
      () => {
        setAppointments(prev => prev.filter(a => a.id !== id));
        triggerSensoryFeedback('warning', accSettings);
        addNotification('📅 AGENDAMENTO REMOVIDO', 'Seu compromisso comercial foi removido dos registros.', 'info');
      },
      'danger'
    );
  };

  const handleAddProduct = (newProduct: InventoryItem) => {
    setInventory(prev => [newProduct, ...prev]);
    awardXP(30); // 30 XP for catalog expansion
  };

  const handleUpdateStock = (id: string, delta: number) => {
    setInventory(prev => 
      prev.map(p => {
        if (p.id === id) {
          const newQty = Math.max(0, p.quantity + delta);
          let newStatus: 'disponivel' | 'baixo_estoque' | 'esgotado' = 'disponivel';
          if (newQty === 0) {
            newStatus = 'esgotado';
          } else if (newQty < p.minQuantity) {
            newStatus = 'baixo_estoque';
          }
          return { ...p, quantity: newQty, status: newStatus };
        }
        return p;
      })
    );
  };

  const handleDeleteProduct = (id: string) => {
    const prodObj = inventory.find(i => i.id === id);
    const prodName = prodObj ? prodObj.name : 'este item';
    requestConfirmation(
      'Remover Item do Almoxarifado?',
      `Tem certeza que deseja remover o lote "${prodName}" do estoque do almoxarifado?`,
      () => {
        setInventory(prev => prev.filter(p => p.id !== id));
        triggerSensoryFeedback('warning', accSettings);
        addNotification('📦 ITEM DELETADO', 'Registro de produto excluído do almoxarifado.', 'info');
      },
      'danger'
    );
  };

  const handleAddProperty = (prop: RealEstateProperty) => {
    setProperties(prev => {
      const filtered = prev.filter(p => p.id !== prop.id);
      return [prop, ...filtered];
    });
    awardXP(50); // 50 XP for cataloging product assets

    syncCRMMovementToGoogleSheet(
      'Imóvel Catalogado',
      `Imóvel [${prop.code}] ${prop.title} registrado em ${prop.neighborhood} | R$ ${prop.price.toLocaleString('pt-BR')}`,
      userName
    );
  };

  const handleAddBulkProperties = (newProps: RealEstateProperty[]) => {
    setProperties(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const filteredNew = newProps.filter(p => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });
    awardXP(120); // 120 XP for bulk portfolio uploads

    syncCRMMovementToGoogleSheet(
      'Carga em Lote de Estoque',
      `Importados ${newProps.length} imóveis/lotes residenciais com sucesso para o catálogo universal.`,
      userName
    );
  };

  const handleAddBulkLeads = (newLeads: Lead[]) => {
    setLeads(prev => {
      const existingIds = new Set(prev.map(l => l.id));
      const filteredNew = newLeads.filter(l => !existingIds.has(l.id));
      return [...filteredNew, ...prev];
    });

    // Big bulk lead prospecting multiplier!
    progressGoalCategory('prospecção', newLeads.length);
    awardXP(newLeads.length * 20); // 20 XP per lead imported

    syncCRMMovementToGoogleSheet(
      'Importação em Lote de Leads',
      `Carga de ${newLeads.length} novos leads inseridos via planilha (.xlsx / .csv).`,
      userName
    );
  };

  const handleDeleteProperty = (id: string) => {
    const propObj = properties.find(p => p.id === id);
    const propTitle = propObj ? propObj.title : 'imóvel';
    requestConfirmation(
      'Excluir Imóvel do Estoque?',
      `Tem certeza que deseja apagar o imóvel "${propTitle}"? Isto removerá sua divulgação no Site de Captação Público.`,
      () => {
        setProperties(prev => prev.filter(p => p.id !== id));
        triggerSensoryFeedback('warning', accSettings);
        addNotification('🏠 IMÓVEL DELETADO', 'Propriedade retirada do estoque de captação.', 'warning');
      },
      'danger'
    );
  };

  const handleUpdatePropertyStatus = (id: string, status: 'disponivel' | 'reservado' | 'vendido') => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleUpdateProperty = (updated: RealEstateProperty) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // Aggregated home stats computation
  const totalLeads = leads.length;
  const totalPipelineValue = leads.reduce((sum, l) => sum + l.value, 0);
  const conversionRate = totalLeads > 0 
    ? Math.round((leads.filter(l => l.status === 'fechado').length / totalLeads) * 100)
    : 0;
  const winRate = conversionRate;

  // Gate app behind user login and password
  if (!isAuthenticated) {
    return (
      <LoginView 
        onLoginSuccess={(name, email) => {
          setUserName(name);
          setUserEmail(email);
          setIsAuthenticated(true);
        }}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // Handle CSS variable sizing and themes class
  const fontStyle = accSettings.fontSizeClass === 'large' 
    ? { fontSize: '110%' } 
    : accSettings.fontSizeClass === 'extra-large' 
      ? { fontSize: '122%' } 
      : {};

  let rootClass = "flex h-screen overflow-hidden font-sans transition-all duration-300 ";
  if (theme === 'claro') {
    rootClass += "bg-zinc-50 text-zinc-900";
  } else if (theme === 'escuro') {
    rootClass += "bg-zinc-950 text-zinc-100";
  } else { // galatico
    rootClass += "bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 text-indigo-100";
  }

  return (
    <div className={rootClass} style={fontStyle}>
      {/* Right Core Content viewports wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile top-bar */}
        {/* Universal Action & Notification Header Bar - Unified Single Responsive Header */}
        <div className="px-4 md:px-8 py-3.5 border-b-4 bg-black border-zinc-950 text-white flex items-center justify-between">
          {/* Left Portion of Header: Clickable brand title, shortcuts, and collapsible menu trigger right after appointments */}
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            {/* Clickable Brand Logo/Title - Clicking it redirects directly to Dashboard ('leads') */}
            <button
              onClick={() => {
                triggerSensoryFeedback('click', accSettings);
                setActiveTab('leads');
              }}
              className="flex items-center gap-1.5 focus:outline-none transition group select-none text-left shrink-0 cursor-pointer"
              title="Ir para a Tela Inicial"
            >
              <Briefcase className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition duration-200" />
              <span className="font-sans font-black tracking-tighter text-md uppercase italic text-white leading-none whitespace-nowrap">
                cicloCRED <span className="text-indigo-400">CRM</span>
              </span>
            </button>
          </div>

          {/* Right Portion of Header: Notifications, Settings, and Novo Lead button */}
          <div className="flex items-center gap-3">
            {/* Static Bell Notification controller button */}
            <button
               id="bell-notification-trigger"
               type="button"
               onClick={() => {
                 triggerSensoryFeedback('click', accSettings);
                 setIsNotificationsOpen(true);
               }}
               className="relative p-2.5 rounded-xl border-2 border-zinc-805 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
               title="Ver Notificações"
            >
              <Bell className="w-4 h-4 text-zinc-300 shrink-0" />

              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 block text-[9px] font-black font-mono leading-none py-0.5 px-1 bg-rose-600 text-white rounded-full border border-zinc-950">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Static Settings Gear Icon button */}
            <button
              onClick={() => {
                triggerSensoryFeedback('click', accSettings);
                setIsSettingsModalOpen(true);
              }}
              className="p-2.5 rounded-xl border-2 border-zinc-805 bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white transition cursor-pointer flex items-center justify-center focus:outline-none"
              title="Ajustes, Administração & Perfil do Operador"
            >
              <Settings className="w-4 h-4 text-zinc-300 shrink-0" />
            </button>

            {/* Novo Lead Button - Cadastro Rápido Trigger styled as elegant neo-brutalist widget */}
            <button
              type="button"
              onClick={() => {
                triggerSensoryFeedback('click', accSettings);
                setSelectedLeadForEdit(null);
                setIsLeadModalOpen(true);
              }}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs tracking-wider border-2 border-zinc-950 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center gap-1.5 uppercase shrink-0"
              title="Adicionar Novo Lead no CRM"
            >
              <UserPlus className="w-4 h-4 text-white shrink-0" />
              <span>Novo Lead</span>
            </button>
          </div>
        </div>

        {/* Nova Barra Horizontal de Navegação Fixa (Substitui Menu Lateral) */}
        <div className={`px-4 md:px-8 py-3.5 border-b-4 flex flex-wrap items-center gap-3 transition-colors duration-300 md:overflow-visible overflow-x-auto scrollbar-thin ${
          theme === 'claro' 
            ? 'bg-zinc-100 border-zinc-950' 
            : theme === 'escuro' 
              ? 'bg-zinc-900 border-zinc-950' 
              : 'bg-indigo-950 border-indigo-900'
        }`} id="fixed-horizontal-navbar">
          
          {/* Botão Leads */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('leads');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'leads'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Leads</span>
          </button>

          {/* Botão Estoque (Renomeado) */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('inventory');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <Home className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Estoque</span>
          </button>

          {/* Botão Agendamentos (Fixo após estoque) */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('appointments');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'appointments'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Agendamentos</span>
          </button>

          {/* Botão Simulador */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('simulador');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'simulador'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Simulador</span>
          </button>

          {/* Botão Relatórios */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('reports');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Relatórios</span>
          </button>

          {/* Botão Assistente AI (Com Workspace Integrado) */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('gemini-server');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'gemini-server'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Assistente AI</span>
          </button>

          {/* Botão Usuário */}
          <button
            type="button"
            onClick={() => {
              triggerSensoryFeedback('click', accSettings);
              setActiveTab('user-central');
            }}
            className={`px-4 py-2 text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all border-2 border-zinc-950 flex items-center gap-2 cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] shrink-0 h-10 ${
              activeTab === 'user-central'
                ? 'bg-indigo-600 text-white translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-850 hover:bg-zinc-800 border-transparent text-zinc-350'
            }`}
          >
            <User className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Usuário</span>
          </button>
        </div>

        {/* Main dynamically scrolled workspace content viewport */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-8 transition-colors duration-300 ${
          theme === 'claro' 
            ? 'bg-zinc-100/50' 
            : theme === 'escuro' 
              ? 'bg-zinc-900/40' 
              : 'bg-indigo-950/20 backdrop-blur-xs'
        }`}>
          {isQuotaExceeded && (
            <div className="bg-amber-950/40 border-2 border-amber-500/70 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xs relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-mono tracking-tighter text-7xl select-none select-none pointer-events-none group-hover:scale-105 transition-all text-amber-500 font-extrabold font-black">
                FIREBASE
              </div>
              <div className="flex gap-4 items-start max-w-3xl">
                <div className="p-3 bg-amber-500/25 border border-amber-500/40 text-amber-400 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6 animate-pulse shrink-0" />
                </div>
                <div className="space-y-1.5 text-left">
                  <h4 className="text-sm font-sans font-black uppercase text-amber-400 tracking-wider">
                    ⚠️ COTA DO CLOUD FIRESTORE EXCEDIDA (SPARK FREE TIER)
                  </h4>
                  <p className="text-[12px] opacity-90 leading-relaxed text-amber-100">
                    Você atingiu o limite gratuito diário de gravações ou leituras do Firebase Firestore para este projeto. O sistema ativou automaticamente o <strong>Modo Off-line Inteligente (Armazenamento Local)</strong> para que você possa continuar operando, cadastrando leads e usando a IA sem nenhuma interrupção ou perda de informações! Seus dados estão salvos com segurança no localStorage. O sincronismo retornará de forma transparente assim que o Google reiniciar a cota diária (geralmente à meia-noite PST). Mais informações sobre limites sob a coluna de plano <strong>Spark</strong> na seção <strong>Enterprise edition</strong> em <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noreferrer" className="underline hover:text-amber-300 font-bold">Firebase Pricing</a>.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10.5px] font-mono text-amber-300 font-bold uppercase mt-2">
                    <span>• Banco ID: <code className="bg-zinc-950/50 px-1 py-0.5 rounded text-amber-100 italic font-normal text-[10px]">ai-studio-7295f37f-3832-47f6-8eec-a7e26d15c260</code></span>
                    <span>• Projeto ID: <code className="bg-zinc-950/50 px-1 py-0.5 rounded text-amber-100 italic font-normal text-[10px]">project-06c00c3b-56af-4fcd-b6a</code></span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center md:self-center">
                <a
                  href="https://console.firebase.google.com/project/project-06c00c3b-56af-4fcd-b6a/firestore/databases/ai-studio-7295f37f-3832-47f6-8eec-a7e26d15c260/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-500 hover:bg-amber-600 active:translate-y-0.5 text-zinc-950 font-black font-sans text-xs tracking-wider uppercase px-4 py-3 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>UPGRADE NO CONSOLE</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Space between header bar and active tab content */}
          <div className="pt-2"></div>

          {/* RENDER ACTIVE TAB */}
          
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              id="crm-dashboard-default"
              className="space-y-8"
            >
              {/* BLOCO DE SAUDAÇÃO E INFORMAÇÕES CRM CONSOLIDADOS */}
              <div className="bg-zinc-950 text-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase">
                  CRM
                </div>
                
                {/* LADO ESQUERDO: SAUDAÇÃO, CRECI, DIA, HORÁRIO E CLIMA */}
                <div className="md:col-span-6 space-y-4 z-10 text-left flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {currentDateTime.getHours() < 12 ? '🌤️' : currentDateTime.getHours() < 18 ? '☀️' : '🌙'}
                    </span>
                    <div>
                      <h2 className="text-xl font-black tracking-tight uppercase italic leading-tight text-white">
                        {currentDateTime.getHours() < 12 ? 'Bom dia' : currentDateTime.getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, <span className="text-indigo-400">{userName}</span>!
                      </h2>
                      <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wide text-left mt-0.5">
                        🏡 {agencyName} • CRECI: {creciNumber || 'Não Integrado'}
                      </p>
                    </div>
                  </div>

                  {/* Date, Time & Clima display substituting old information block */}
                  <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl space-y-2.5 text-left">
                    <span className="text-[9.5px] font-mono font-black text-indigo-400 uppercase tracking-widest block text-left">
                      🕒 DATA, HORÁRIO E CLIMA CORRENTE
                    </span>
                    
                    <div className="space-y-1.5 font-mono text-[10.5px]">
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="uppercase text-zinc-200 font-bold">
                          {currentDateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-white text-lg font-black tracking-tight font-sans">
                          {currentDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full hidden sm:inline" />
                        <span className="text-emerald-400 font-black flex items-center gap-1">
                          🌡️ 24°C • SÃO PAULO, SP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LADO DIREITO: OBJETIVOS OPERACIONAIS CONSOLIDADOS */}
                <div className="md:col-span-6 bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between h-full relative overflow-hidden group z-10">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest block">
                      🎛️ INFORMAÇÕES CRM CONSOLIDADAS
                    </span>
                    <h4 className="text-xs font-black text-zinc-350 uppercase tracking-tight">Objetivos Operacionais de Venda</h4>
                  </div>

                  <div className="space-y-3 my-3">
                    {/* Metric 1: Taxa de Negócios Fechados */}
                    {(() => {
                      const closedCount = leads.filter(l => l.status === 'fechado').length;
                      const totalCount = leads.length;
                      const pct = totalCount > 0 ? Math.round((closedCount / totalCount) * 105) : 0;
                      const displayPct = Math.min(100, pct);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-zinc-300">🏆 Taxa de Negócios Fechados</span>
                            <span className="font-mono font-black text-emerald-450">{displayPct}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-805">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${displayPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Metric 2: Meta de Leads */}
                    {(() => {
                      const count = leads.length;
                      const pct = Math.min(Math.round((count / 10) * 100), 100);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-zinc-300">📈 Meta na Carteira Ativa</span>
                            <span className="font-mono font-black text-indigo-400">{pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-805">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Metric 3: Qualidade de Cadastro Real */}
                    {(() => {
                      const totalCrm = leads.length;
                      const hasFictitious = leads.filter(l => l.phone && (l.phone.includes('99999-9999') || l.phone.includes('00000-0000'))).length;
                      const realPct = totalCrm > 0 ? Math.round(((totalCrm - hasFictitious) / totalCrm) * 100) : 100;
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-zinc-300">📞 Saneamento & Qualidade</span>
                            <span className="font-mono font-black text-emerald-400">{realPct}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-805">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${realPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Informações consolidadas custom user edit note */}
                  <p className="text-[9px] text-zinc-400 font-sans italic border-t border-zinc-800/60 pt-2 text-left">
                    💬 {consolidatedCrmInfo || 'Painel de faturamento integrado e atualizado via Google Workspace CRM.'}
                  </p>
                </div>
              </div>

              {/* KPIs indicators belt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] transition-all duration-250">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-wider uppercase font-black text-zinc-500 font-mono">Total de Leads</span>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{totalLeads}</h3>
                  </div>
                  <div className="p-2 border-2 border-zinc-950 rounded-xl bg-indigo-50">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <div className="bg-zinc-900 text-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] transition-all duration-250">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-wider uppercase font-black text-indigo-400 font-mono">★ Potencial Estimado</span>
                    <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                      {totalPipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </h3>
                  </div>
                  <div className="p-2 border-2 border-zinc-950 rounded-xl bg-zinc-800">
                    <DollarSign className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>

                <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] transition-all duration-250">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-wider uppercase font-black text-zinc-500 font-mono">Taxa de Conversão</span>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
                      <AnimatedCounter value={conversionRate} />%
                    </h3>
                  </div>
                  <div className="p-2 border-2 border-zinc-950 rounded-xl bg-emerald-50">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>

                <div 
                  id="crm-dashboard-winrate"
                  className={`border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between relative group hover:translate-y-[-2px] transition-all duration-250 ${
                    theme === 'claro' 
                      ? 'bg-gradient-to-br from-rose-50/80 via-zinc-50 to-white text-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]'
                      : theme === 'galatico'
                      ? 'bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white border-indigo-500 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.45)]'
                      : 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]'
                  }`}
                >
                  {/* Detailed Interactive Tooltip */}
                  <div className="absolute bottom-[108%] left-1/2 -translate-x-1/2 w-72 bg-zinc-950 border-4 border-zinc-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-300 z-50 text-left space-y-2.5">
                    <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                      <Trophy className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-[10px] font-black uppercase text-zinc-100 font-mono tracking-wider">Metas e Win Rate</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                      Representa a taxa de conversão direta de leads que foram encerrados como <span className="text-emerald-400 font-bold">"Fechado (Concluído)"</span> com sucesso frente ao montante acumulado.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-zinc-900/90 font-mono text-[9px]">
                      <div className="bg-zinc-900 p-1.5 rounded-lg border border-zinc-805">
                        <span className="text-zinc-500 block">FECHADOS</span>
                        <span className="text-emerald-400 font-black text-xs">{leads.filter(l => l.status === 'fechado').length}</span>
                      </div>
                      <div className="bg-zinc-900 p-1.5 rounded-lg border border-zinc-805">
                        <span className="text-zinc-500 block">TOTAL LEADS</span>
                        <span className="text-white font-black text-xs">{totalLeads}</span>
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-zinc-500 text-center uppercase">
                      Fórmula: (Fechados / Total) * 100
                    </div>
                    {/* Tooltip arrow decoration */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 border-r-4 border-b-4 border-zinc-950 rotate-45 -translate-y-1.5" />
                  </div>

                  <div className="space-y-1 relative z-10">
                    <span className={`text-[10px] tracking-wider uppercase font-black font-mono ${theme === 'claro' ? 'text-rose-600' : theme === 'galatico' ? 'text-pink-400' : 'text-rose-400'}`}>
                      Win Rate
                    </span>
                    <h3 className={`text-3xl font-black tracking-tight ${theme === 'claro' ? 'text-zinc-900' : 'text-white'}`}>
                      <AnimatedCounter value={winRate} />%
                    </h3>
                  </div>
                  <div className={`p-2 border-2 border-zinc-950 rounded-xl relative z-10 shrink-0 ${theme === 'claro' ? 'bg-rose-100 text-rose-700' : 'bg-rose-50 text-rose-600'}`}>
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] transition-all duration-250">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-wider uppercase font-black text-zinc-500 font-mono">Automações Ativas</span>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{emailLogs.length}</h3>
                  </div>
                  <div className="p-2 border-2 border-zinc-950 rounded-xl bg-amber-50">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* NEW PREMIUM KPI ROW (1/3 metrics, 2/3 Leads Control Pie Chart) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none animate-fade-in">
                
                {/* 1. Novo Gráfico: Origem de Captação dos Leads (Recharts BarChart) */}
                <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-[340px] select-none">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] tracking-wider uppercase font-black text-indigo-650 font-mono">★ Canais de Marketing</span>
                      <h3 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">Origem de Captação</h3>
                    </div>
                  </div>

                  {leads.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <p className="text-zinc-500 text-xs font-mono uppercase font-bold">Sem captação registrada</p>
                      <p className="text-zinc-400 text-[10px] max-w-xs mt-1 leading-tight">Cadastre novos leads com canais definidos para alimentar este gráfico gerencial.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-end mt-4 h-[210px] w-full">
                      {(() => {
                        const counts: Record<string, number> = {};
                        leads.forEach(l => {
                          let raw = l.origin || 'Outros';
                          if (raw.toLowerCase().includes('chat')) raw = 'Chatbot';
                          else if (raw.toLowerCase().includes('whats')) raw = 'WhatsApp';
                          else if (raw.toLowerCase().includes('meta') || raw.toLowerCase().includes('face') || raw.toLowerCase().includes('insta')) raw = 'Meta Ads';
                          else if (raw.toLowerCase().includes('indica')) raw = 'Indicação';
                          else if (raw.toLowerCase().includes('site') || raw.toLowerCase().includes('web')) raw = 'Portal Web';
                          else if (raw.toLowerCase().includes('manual') || raw.toLowerCase().includes('cadast')) raw = 'Manual';
                          counts[raw] = (counts[raw] || 0) + 1;
                        });

                        const chartData = Object.entries(counts)
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 4);

                        const colors = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b'];

                        return (
                          <div className="w-full h-full relative">
                            <ResponsiveContainer width="100%" height={180}>
                              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  axisLine={false}
                                  tickLine={false} 
                                  tick={{ fontSize: 9, fontWeight: 900, fill: '#18181b', fontFamily: 'monospace' }}
                                  width={75}
                                />
                                <Tooltip 
                                  cursor={{ fill: '#f4f4f5', opacity: 0.5 }}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-zinc-950 border-2 border-zinc-900 p-2 rounded-xl shadow-lg text-[9px] font-mono text-white">
                                          <p className="font-bold">{data.name}</p>
                                          <p className="text-zinc-300 mt-0.5">Leads: {data.value}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                                  {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                            
                            {/* Premium Mini-Legend inline below */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-2 border-t border-zinc-100">
                              {chartData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-1 font-mono text-[8px] font-bold text-zinc-500 uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                  <span>{d.name}: {d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[8px] font-mono font-bold text-zinc-400 select-none">
                    <span>CANAIS DE MARKETING</span>
                    <span>ATUALIZAÇÃO TEMPO REAL</span>
                  </div>
                </div>

                {/* 2. Leads Control Pie Chart (Take up 2 columns space of the layout) */}
                <div className="lg:col-span-2 bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between h-[340px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] tracking-wider uppercase font-black text-indigo-650 font-mono">★ Gestão de Desempenho</span>
                      <h3 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">Indicador Gráfico de Leads (Pizza)</h3>
                    </div>
                    <div className="bg-indigo-50 border-2 border-zinc-950 rounded-xl px-2.5 py-1 text-[9.5px] font-mono font-black text-indigo-750 uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      Total Ativos: {leads.length}
                    </div>
                  </div>

                  {leads.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 rounded-full border-4 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 font-bold text-xl font-mono">0%</div>
                      <p className="text-zinc-500 text-xs font-mono mt-3 uppercase font-bold">Nenhum Lead ativo para exibir controle gráfico</p>
                      <p className="text-zinc-400 text-[10px] max-w-sm mt-1 leading-tight">Cadastre alguns contatos na aba "Leads" para ativar o monitoramento em formato pizza.</p>
                    </div>
                  ) : (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-1">
                      
                      {/* Left: The Pie Chart Canvas (5 columns) */}
                      <div className="sm:col-span-5 flex justify-center items-center relative h-[210px] w-full">
                        {(() => {
                          const statusMeta = {
                            novo: { label: 'Novo / Entrada', color: '#06b6d4', ringHex: 'rgba(6,182,212,0.15)' },
                            em_contato: { label: 'Em Contato', color: '#f59e0b', ringHex: 'rgba(245,158,11,0.15)' },
                            proposta: { label: 'Proposta Enviada', color: '#a855f7', ringHex: 'rgba(168,85,247,0.15)' },
                            fechado: { label: 'Fechado (Ganho)', color: '#10b981', ringHex: 'rgba(16,185,129,0.15)' },
                            perdido: { label: 'Perdido', color: '#f43f5e', ringHex: 'rgba(244,63,94,0.15)' },
                          };

                          const totalLeadsCount = leads.length;
                          const slices = Object.keys(statusMeta).map((statusKey) => {
                            const key = statusKey as LeadStatus;
                            const filtered = leads.filter(l => l.status === key);
                            const count = filtered.length;
                            const pct = totalLeadsCount > 0 ? (count / totalLeadsCount) * 100 : 0;
                            const value = filtered.reduce((acc, curr) => acc + (curr.value || 0), 0);
                            return {
                              status: key,
                              label: statusMeta[key].label,
                              color: statusMeta[key].color,
                              ringHex: statusMeta[key].ringHex,
                              count,
                              pct,
                              value
                            };
                          });

                          const rechartsData = slices.filter(s => s.count > 0).map(s => ({
                            name: s.label,
                            value: s.count,
                            color: s.color,
                            pct: s.pct,
                            totalValue: s.value,
                            status: s.status
                          }));

                          const activeSlice = slices.find(s => s.status === hoveredStatusSlice) || null;

                          return (
                            <>
                              <div className="w-full h-full relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={200}>
                                  <PieChart>
                                    <Pie
                                      data={rechartsData.length > 0 ? rechartsData : [{ name: 'Sem dados', value: 1, color: '#e4e4e7', pct: 0, totalValue: 0, status: 'empty' }]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={55}
                                      outerRadius={75}
                                      paddingAngle={2}
                                      dataKey="value"
                                      animationDuration={700}
                                      onMouseEnter={(_, index) => {
                                        if (rechartsData[index]) {
                                          setHoveredStatusSlice(rechartsData[index].status as any);
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredStatusSlice(null);
                                      }}
                                    >
                                      {rechartsData.length > 0 ? (
                                        rechartsData.map((entry, index) => (
                                          <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color}
                                            style={{
                                              filter: hoveredStatusSlice === entry.status ? 'drop-shadow(0px 3px 6px rgba(0,0,0,0.15))' : 'none',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease',
                                              transform: hoveredStatusSlice === entry.status ? 'scale(1.04)' : 'scale(1)',
                                              transformOrigin: 'center'
                                            }}
                                          />
                                        ))
                                      ) : (
                                        <Cell fill="#e4e4e7" />
                                      )}
                                    </Pie>
                                    <Tooltip 
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length && rechartsData.length > 0) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-zinc-950 border-2 border-zinc-900 p-2.5 rounded-xl shadow-xl text-[10px] font-mono text-white max-w-[180px]">
                                              <p className="font-black uppercase tracking-wider text-indigo-300">{data.name}</p>
                                              <p className="text-zinc-300 mt-1">Leads: {data.value} ({data.pct.toFixed(0)}%)</p>
                                              <p className="text-emerald-450 font-bold mt-0.5">
                                                {data.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>

                                {/* Absolute Centered Label */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                                  {activeSlice ? (
                                    <>
                                      <strong className="text-2xl font-sans font-black text-zinc-900 leading-none">
                                        {activeSlice.count}
                                      </strong>
                                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 font-mono">
                                        {activeSlice.count === 1 ? 'LEAD' : 'LEADS'}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <strong className="text-xs font-sans font-black text-indigo-600 uppercase tracking-wider leading-none">
                                        FUNIL
                                      </strong>
                                      <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-0.5 font-mono">
                                        REALTIME
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Right: The Grid Legend & Data breakdown list (7 columns) */}
                      <div className="sm:col-span-7 space-y-1.5 font-sans">
                        {(() => {
                          const statusMeta = {
                            novo: { label: 'Novo / Entrada', color: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700' },
                            em_contato: { label: 'Prospecção / Tratativa', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
                            proposta: { label: 'Proposta Enviada', color: '#a855f7', bg: 'bg-purple-50', text: 'text-purple-705' },
                            fechado: { label: 'Vendido / Fechado', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                            perdido: { label: 'Sem Sucesso', color: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-700' },
                          };

                          const totalLeadsCount = leads.length;
                          return Object.keys(statusMeta).map((statusKey) => {
                            const key = statusKey as LeadStatus;
                            const filtered = leads.filter(l => l.status === key);
                            const count = filtered.length;
                            const pct = totalLeadsCount > 0 ? (count / totalLeadsCount) * 100 : 0;
                            const value = filtered.reduce((acc, curr) => acc + (curr.value || 0), 0);
                            const meta = statusMeta[key];
                            const isSelected = hoveredStatusSlice === key;

                            return (
                              <div
                                key={key}
                                onMouseEnter={() => setHoveredStatusSlice(key)}
                                onMouseLeave={() => setHoveredStatusSlice(null)}
                                className={`flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-zinc-50 border-zinc-950 translate-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                                    : 'bg-white border-zinc-105 hover:border-zinc-300'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                                  <span className="text-[10px] font-black text-zinc-700">{meta.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-right pl-4">
                                  <span className="text-zinc-400">({count})</span>
                                  <span className={`px-1.5 py-0.5 rounded-md font-bold ${meta.bg} ${meta.text}`}>
                                    {pct.toFixed(0)}%
                                  </span>
                                  <span className="font-bold text-zinc-850 w-16 truncate">
                                    {value > 0 ? value.toLocaleString('pt-BR', { notation: 'compact' }) : 'R$ 0'}
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                    </div>
                  )}

                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[8.5px] font-mono font-bold text-zinc-400 select-none">
                    <span>💡 DICA: PASSE O MOUSE SOBRE OS SEGMENTOS PARA FILTRAR OS DETALHES DE STATUS</span>
                    <span>PAINEL REALTIME CICLOCRED</span>
                  </div>
                </div>

              </div>

              {/* INTERACTIVE LEADS DA SORTE ROULLETTE */}
              <div className="bg-zinc-900 border-4 border-zinc-950 rounded-3xl p-6 select-none shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/25 to-transparent pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-4 mb-4 gap-4">
                  <div>
                    <span className="text-[10.5px] font-mono font-black text-indigo-400 uppercase tracking-widest block">
                      🎰 DISTRIBUIDOR DE OPORTUNIDADES
                    </span>
                    <h2 className="text-xl font-black text-zinc-100 uppercase italic tracking-tighter flex items-center gap-2">
                      <span>Leads da Sorte cicloCRED</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-850 px-2.5 py-1 rounded-xl border border-zinc-800">
                      Disponível: {leads.length} Leads
                    </span>
                    <button
                      onClick={drawLuckyLead}
                      disabled={isSpinningSorte || leads.length === 0}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-xs font-black text-white rounded-xl uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-1px] transition duration-200 outline-none flex items-center gap-2 cursor-pointer"
                    >
                      <Gift className="w-4 h-4 animate-bounce" />
                      {isSpinningSorte ? 'Sorteando...' : '🎰 Sortear Lead da Sorte'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: Roulette Animation Display or Idle State */}
                  <div className="md:col-span-6 bg-zinc-950 rounded-2xl border-2 border-zinc-850 p-6 h-[180px] flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="absolute top-2 left-3 text-[8px] font-mono text-zinc-650 tracking-wider">VISUALIZADOR REALTIME</div>
                    
                    {isSpinningSorte && (
                      <div className="text-center space-y-3">
                        <div className="text-2xl font-black tracking-widest text-indigo-400 font-mono animate-pulse uppercase truncate max-w-xs transition-all duration-75">
                          🎰 {currentSpinningName}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase font-bold animate-pulse">Girando roleta da fortuna corporativa...</p>
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-200"></span>
                          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-300"></span>
                        </div>
                      </div>
                    )}

                    {!isSpinningSorte && !luckyLead && (
                      <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-zinc-350">Precisa focar em um novo contato?</p>
                        <p className="text-xs text-zinc-500 max-w-sm">Gire a roleta de distribuição inteligente para receber sugestão da IA para o seu próximo follow-up de alta conversão! (+150 XP de bônus ao sortear)</p>
                      </div>
                    )}

                    {!isSpinningSorte && luckyLead && (
                      <div className="text-center space-y-2.5 w-full">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-mono font-black uppercase">
                          ⭐ Lead Premiado do Dia
                        </div>
                        <h3 className="text-2xl font-black text-zinc-100 uppercase truncate px-4">{luckyLead.name}</h3>
                        <p className="text-xs font-mono text-zinc-400">Origem: {luckyLead.origin} · R$ {luckyLead.value.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Information & Actions of Chosen Lead */}
                  <div className="md:col-span-6 space-y-4">
                    {luckyLead ? (
                      <div className="bg-zinc-850 rounded-2xl p-4.5 border-2 border-zinc-950 space-y-3.5 select-text animate-fadeIn text-xs">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400 border-b border-zinc-800 pb-2">
                          <span>📋 AÇÕES DE ALTA CONVERSÃO RECOMENDADAS:</span>
                          <span className="text-emerald-500 font-black">+150 XP CONCEDIDO 💰</span>
                        </div>
                        
                        <div className="space-y-2 font-sans font-medium text-zinc-300 leading-relaxed text-left">
                          <p>🎯 <strong>Renda Declarada:</strong> {luckyLead.familyIncome ? `R$ ${luckyLead.familyIncome.toLocaleString('pt-BR')}` : 'Não cadastrada'}</p>
                          <p>📞 <strong>Telefone:</strong> {luckyLead.phone} · ✉️ <strong>Email:</strong> {luckyLead.email}</p>
                          <p className="truncate">📝 <strong>Notas Rápidas:</strong> {luckyLead.notes || 'Sem anotações no cadastro deste lead.'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={() => {
                              setSelectedLeadForDetails(luckyLead);
                              setIsDetailsModalOpen(true);
                            }}
                            className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black text-white rounded-lg border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] uppercase transition cursor-pointer"
                          >
                            Abrir Dossiê Preditivo 🔬
                          </button>
                          <a
                            href={`https://wa.me/55${luckyLead.phone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(luckyLead.name)}!%20Aqui%20é%20o%20credenciado%20da%20cicloCRED.%25Sorteado!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black text-white rounded-lg border-2 border-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] uppercase transition inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Chamar no Whatsapp 💬
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-4 border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500 font-mono uppercase font-black text-[10px] tracking-wider mb-1">🎰 NENHUM LEAD CONVOCADO</p>
                        <p className="text-[10px] text-zinc-400">Clique em "Sortear Lead da Sorte" acima para rodar o distribuidor acelerado!</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* GOOGLE WORKSPACE EXPANDED DASHBOARD BENTO BOX */}
              <div className="bg-gradient-to-br from-indigo-950 via-zinc-950 to-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-white select-none relative overflow-hidden my-2">
                <div className="absolute right-4 bottom-2 text-8xl text-white/5 font-black font-mono select-none pointer-events-none">G-WORK</div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-4">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] uppercase font-black text-indigo-400 font-mono tracking-widest flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Sincronismo Global Google Workspace</span>
                    </span>
                    <h3 className="text-md md:text-lg font-black uppercase text-zinc-100 font-sans italic">Hub Avançado de Desempenho & Ações Digitais</h3>
                  </div>
                  
                  {getWorkspaceToken() ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-mono font-black uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
                        <span>WORKSPACE CONECTADO</span>
                      </span>
                      <button
                        onClick={() => {
                          triggerSensoryFeedback('click', accSettings);
                          setActiveTab('google-workspace');
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[9.5px] px-3 py-1 rounded-full font-mono font-black uppercase transition cursor-pointer"
                      >
                        Configurar APIs
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="bg-amber-950/80 border border-amber-600 text-amber-300 text-[9px] px-3 py-1 rounded-full font-mono font-black uppercase text-center font-bold">
                        ⚠️ AGUARDANDO AUTENTICAÇÃO OAUTH
                      </span>
                      <button
                        onClick={() => {
                          triggerSensoryFeedback('click', accSettings);
                          setActiveTab('google-workspace');
                        }}
                        className="bg-indigo-650 hover:bg-indigo-700 hover:translate-y-[-1px] text-white text-[9.5px] px-3.5 py-1 rounded-full font-mono font-black uppercase text-center transition cursor-pointer"
                      >
                        Ativar Workspace Já!
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {/* Calendar Widget */}
                  <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-indigo-400 uppercase font-mono flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-450" />
                        <span>Compromissos Google Calendar</span>
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                        Sua agenda de visitas habitacionais e reuniões de alinhamento corporativo integrados.
                      </p>
                    </div>
                    {getWorkspaceToken() ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-zinc-900 border border-zinc-800 text-[10px] rounded space-y-0.5">
                          <span className="font-sans font-black text-white block">Revisão SBPE MCMV - Sr. Silva</span>
                          <span className="text-[8.5px] text-zinc-500 font-mono block">Amanhã · 14:00 (Google Calendar Sync)</span>
                        </div>
                        <button
                          onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveTab('appointments'); }}
                          className="w-full text-center py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded text-[9.5px] font-mono font-black uppercase text-zinc-350 cursor-pointer"
                        >
                          Visualizar Escala
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-650 italic font-mono">Conecte sua conta Google para ler a agenda.</span>
                    )}
                  </div>

                  {/* Gmail Widget */}
                  <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-red-400 uppercase font-mono flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-red-450" />
                        <span>API de E-mails do Gmail</span>
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                        Frequência de follow-up automatizado de vendas e reaquecimento ativo de leads desengajados.
                      </p>
                    </div>
                    {getWorkspaceToken() ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 font-bold">STATUS API GMAIL:</span>
                          <span className="text-emerald-400 font-black">ATIVA & PRONTA</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-full" />
                        </div>
                        <button
                          onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveTab('automation-flows'); }}
                          className="w-full text-center py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded text-[9.5px] font-mono font-black uppercase text-zinc-350 cursor-pointer"
                        >
                          Roteiros e Disparos
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-650 italic font-mono">Autentique para habilitar disparos velozes.</span>
                    )}
                  </div>

                  {/* Sheets & Drive Integration Widget */}
                  <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                        <LineChart className="w-4 h-4 text-emerald-450" />
                        <span>Controle de Planilhas & Drive</span>
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                        Extraia cadastros de planilhas do Google Drive ou envie backups para armazenamento em nuvem.
                      </p>
                    </div>
                    {getWorkspaceToken() ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-zinc-900 border border-zinc-800 text-[10px] rounded flex justify-between items-center">
                          <span className="text-zinc-300 font-sans truncate">Backup_CicloCred.xlsx</span>
                          <span className="text-[8.5px] text-emerald-400 bg-emerald-950 font-black px-1.5 py-0.5 rounded uppercase font-mono shrink-0">Ativo</span>
                        </div>
                        <button
                          onClick={() => { triggerSensoryFeedback('click', accSettings); setActiveTab('google-workspace'); }}
                          className="w-full text-center py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded text-[9.5px] font-mono font-black uppercase text-zinc-350 cursor-pointer"
                        >
                          Importar / Exportar Planilhas
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-650 italic font-mono">Faça login para importar planilhas corporativas.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Split Body Layout: Left Feed, Right Quick Actions and Leads Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Recent Activities (7 Columns) */}
                <div className="lg:col-span-7 bg-white border-4 border-zinc-950 rounded-3xl p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">Disparos Recentes</h2>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">Últimos e-mails disparados via campanhas automatizadas.</p>
                    </div>
                    {emailLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          requestConfirmation(
                            "Zerar Histórico de Envio",
                            "Deseja realmente apagar de forma definitiva todo o histórico de disparos de e-mails? Essa operação não pode ser desfeita.",
                            () => {
                              setEmailLogs([]);
                              addNotification(
                                '🧹 HISTÓRICO ZERADO',
                                'O histórico de disparos de e-mail foi limpo com sucesso.',
                                'info'
                              );
                            },
                            'danger'
                          );
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border-2 border-zinc-950 text-rose-700 hover:text-rose-800 text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Zerar Histórico</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {emailLogs.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-10 text-center font-mono font-medium">Nenhum e-mail enviado recentemente.</p>
                    ) : (
                      emailLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="flex gap-3 text-xs bg-zinc-50 p-3.5 rounded-xl border-2 border-zinc-950 items-start shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                          <div className="p-1 border border-zinc-950 rounded bg-emerald-100 shrink-0">
                            <Mail className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-zinc-900 text-xs">{log.leadName}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-400" />
                              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-zinc-950 bg-amber-100 text-amber-900 font-mono">
                                {log.templateName}
                              </span>
                            </div>
                            <p className="text-zinc-700 font-bold truncate">{log.subject}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{log.sentAt}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Leads review summary (5 Columns) */}
                <div className="lg:col-span-5 bg-white border-4 border-zinc-950 rounded-3xl p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">Recém Cadastrados</h2>
                    <p className="text-xs text-zinc-500 mt-1 font-medium">Leads captados recentemente nos canais integrados.</p>
                  </div>

                  <div className="space-y-3">
                    {leads.slice(0, 4).map(lead => (
                      <div 
                        key={lead.id} 
                        className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border-2 border-zinc-950 select-none hover:bg-zinc-100/80 transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      >
                        <div className="min-w-0">
                          <button
                            onClick={() => {
                              setSelectedLeadForDetails(lead);
                              setIsDetailsModalOpen(true);
                            }}
                            className="text-xs font-black text-zinc-900 truncate text-left w-full hover:text-indigo-600 block transition"
                          >
                            {lead.name}
                          </button>
                          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{lead.origin} · {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>

                        <span className="font-mono text-xs text-indigo-600 font-black shrink-0 pl-2">
                          {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {leads.length > 4 && (
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-1px] transition block"
                    >
                      Acessar carteira completa →
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* 2 & 3. UNIFIED GESTÃO DE LEADS (TABELA / STATUS / FOLLOW-UP MULTI-MODE) */}
          {activeTab === 'leads' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full space-y-5"
            >
              {/* BLOCO 1: NAVEGAÇÃO DE STATUS E FUNIL COMPLETO DO CRM (SEM TÍTULOS REPETIDOS) */}
              <div className="bg-zinc-900 border-4 border-zinc-950 p-2.5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] select-none animate-fadeIn w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-zinc-950 p-1.5 border-2 border-zinc-800 rounded-xl gap-2 w-full">
                  {/* 1. Tabela */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadsViewMode('list');
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className={`px-3 py-3 rounded-xl text-[10.5px] font-mono font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
                      leadsViewMode === 'list'
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span>Tabela</span>
                  </button>

                  {/* 2. Funil (Renomeado de Status) */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadsViewMode('kanban');
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className={`px-3 py-3 rounded-xl text-[10.5px] font-mono font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
                      leadsViewMode === 'kanban'
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                    <span>Funil</span>
                  </button>

                  {/* 3. Follow-ups */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadsViewMode('followup');
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className={`px-3 py-3 rounded-xl text-[10.5px] font-mono font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
                      leadsViewMode === 'followup'
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Follow-ups</span>
                  </button>

                  {/* 4. Scripts e fluxos (Integrated) */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadsViewMode('automation-flows');
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className={`px-3 py-3 rounded-xl text-[10.5px] font-mono font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
                      leadsViewMode === 'automation-flows'
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Scripts e Fluxos</span>
                  </button>

                  {/* 5. Disparos (Renomeado) */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadsViewMode('marketing');
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className={`px-3 py-3 rounded-xl text-[10.5px] font-mono font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border ${
                      leadsViewMode === 'marketing'
                        ? 'bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                    <span>Disparos</span>
                  </button>
                </div>
              </div>

              {/* BLOCO 2: DESTAQUE PARA BARRA DE PESQUISA & FILTROS AVANÇADOS (ALTÍSSIMO CONTRASTE) */}
              <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 animate-fadeIn">
                
                {/* MASSIVO DESTAQUE PARA BARRA DE PESQUISA */}
                <div className="relative flex-grow max-w-xl group">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-md group-hover:bg-indigo-500/15 transition duration-300"></div>
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 top-4.5 w-4.5 h-4.5 text-indigo-600 animate-pulse stroke-[2.5]" />
                    <input
                      type="text"
                      placeholder="PESQUISAR CLIENTES POR NOME, CONTRATO OU TELEFONE..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-zinc-950 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-zinc-950 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 font-extrabold placeholder-zinc-500 tracking-wider uppercase font-mono transition-all"
                    />
                  </div>
                </div>

                {/* DROPDOWNS E FILTROS COMPLEMENTARES */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className="bg-white border-2 border-zinc-950 rounded-xl px-4 py-3.5 text-[10.5px] font-black text-zinc-950 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 uppercase font-mono cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50"
                  >
                    <option value="todos">Status: Todos</option>
                    {getKanbanColumns().map(col => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>

                  {/* Origem */}
                  <select
                    value={originFilter}
                    onChange={(e) => {
                      setOriginFilter(e.target.value);
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className="bg-white border-2 border-zinc-950 rounded-xl px-4 py-3.5 text-[10.5px] font-black text-zinc-950 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 uppercase font-mono cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50"
                  >
                    <option value="todos">Origem: Todas</option>
                    {Array.from(new Set(leads.map(l => l.origin || 'outros'))).filter(Boolean).map(origin => (
                      <option key={origin} value={origin}>{origin}</option>
                    ))}
                  </select>

                  {/* Alfabeto */}
                  <select
                    value={initialLetterFilter}
                    onChange={(e) => {
                      setInitialLetterFilter(e.target.value);
                      triggerSensoryFeedback('click', accSettings);
                    }}
                    className="bg-white border-2 border-zinc-950 rounded-xl px-4 py-3.5 text-[10.5px] font-black text-zinc-950 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 uppercase font-mono cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50"
                  >
                    <option value="todos">Letra Inicial: Todas</option>
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>

                  {/* Importar Button */}
                  <button
                    onClick={() => {
                      triggerSensoryFeedback('click', accSettings);
                      setIsImportModalOpen(true);
                    }}
                    className="text-[10px] font-mono font-black text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-3.5 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer hover:translate-y-[-1px] active:translate-y-0.5"
                    title="Importar dados deste painel"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0 text-emerald-100" />
                    <span>Importar</span>
                  </button>

                  {/* Exportar Button */}
                  <button
                    onClick={() => {
                      triggerSensoryFeedback('click', accSettings);
                      setIsExportModalOpen(true);
                    }}
                    className="text-[10px] font-mono font-black text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-3.5 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer hover:translate-y-[-1px] active:translate-y-0.5"
                    title="Exportar dados deste painel"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0 text-indigo-100" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>

              {leadsViewMode === 'list' ? (
                <LeadList 
                  leads={unifiedFilteredLeads}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  originFilter={originFilter}
                  setOriginFilter={setOriginFilter}
                  initialLetterFilter={initialLetterFilter}
                  setInitialLetterFilter={setInitialLetterFilter}
                  externalShowImporter={isPlanilhasModalOpen}
                  setExternalShowImporter={setIsPlanilhasModalOpen}
                  externalShowPlanner={isConversaoModalOpen}
                  setExternalShowPlanner={setIsConversaoModalOpen}
                  onOpenLeadDetails={(lead) => {
                    setSelectedLeadForDetails(lead);
                    setIsDetailsModalOpen(true);
                  }}
                  onOpenEditModal={(lead) => {
                    setSelectedLeadForEdit(lead);
                    setIsLeadModalOpen(true);
                  }}
                  onDeleteLead={handleDeleteLead}
                  onOpenCreateModal={() => {
                    setSelectedLeadForEdit(null);
                    setDefaultStatusForCreate('novo');
                    setIsLeadModalOpen(true);
                  }}
                  onMoveLead={handleMoveLead}
                  onAddBulkLeads={handleAddBulkLeads}
                  onDeleteMultipleLeads={(ids) => {
                    requestConfirmation(
                      'Apagar Leads Selecionados?',
                      `Tem certeza que deseja apagar os ${ids.length} leads selecionados permanentemente? Esta ação é irreversível de forma integral.`,
                      () => {
                        setLeads(prev => prev.filter(l => !ids.includes(l.id)));
                        triggerSensoryFeedback('warning', accSettings);
                        addNotification('🗑️ LEADS EXCLUÍDOS', `${ids.length} contatos foram excluídos permanentemente.`, 'warning');
                      },
                      'danger'
                    );
                  }}
                  onMoveMultipleLeads={(ids, newStatus) => {
                    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l));
                    triggerSensoryFeedback('success', accSettings);
                    addNotification('⚡ ATUALIZAÇÃO EM MASSA', `${ids.length} leads migrados no funil para "${newStatus}".`, 'success');
                  }}
                  onUpdateMultipleLeads={(updatedLeads) => {
                    setLeads(updatedLeads);
                    triggerSensoryFeedback('success', accSettings);
                    addNotification('🧹 CONFIGURAÇÃO SANEADA', `Contatos ajustados e sincronizados com sucesso na base!`, 'success');
                  }}
                  onRequestConfirm={requestConfirmation}
                  awardXP={awardXP}
                  addNotification={addNotification}
                  appointments={appointments}
                  setAppointments={setAppointments}
                />
              ) : leadsViewMode === 'kanban' ? (
                <KanbanBoard 
                  leads={unifiedFilteredLeads}
                  onMoveLead={handleMoveLead}
                  onOpenLeadDetails={(lead) => {
                    setSelectedLeadForDetails(lead);
                    setIsDetailsModalOpen(true);
                  }}
                  onOpenEditModal={(lead) => {
                    setSelectedLeadForEdit(lead);
                    setIsLeadModalOpen(true);
                  }}
                  onOpenCreateModal={(status) => {
                    setSelectedLeadForEdit(null);
                    setDefaultStatusForCreate(status || 'novo');
                    setIsLeadModalOpen(true);
                  }}
                />
              ) : leadsViewMode === 'followup' ? (
                <FollowUpManager
                  leads={unifiedFilteredLeads}
                  followUps={followUps}
                  onAddFollowUp={handleAddFollowUp}
                  onDeleteFollowUp={handleDeleteFollowUp}
                  accSettings={accSettings}
                />
              ) : leadsViewMode === 'automation-flows' ? (
                <AutomationFlowsTab
                  templates={templates}
                  setTemplates={setTemplates}
                  awardXP={(xp) => awardXP(xp)}
                  addNotification={addNotification}
                  accSettings={accSettings}
                />
              ) : (
                <MultiLevelMarketingTab
                  leads={unifiedFilteredLeads}
                  templates={templates}
                  logs={emailLogs}
                  onAddTemplate={handleAddTemplate}
                  onEditTemplate={handleEditTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                  onSendEmailSimulated={handleSendEmailSimulated}
                  properties={properties}
                  theme={theme}
                  accSettings={accSettings}
                  awardXP={(xp, cause) => awardXP(xp)}
                  addNotification={addNotification}
                  onTriggerConversao={() => setIsConversaoModalOpen(true)}
                />
              )}
            </motion.div>
          )}

          {/* DEDICATED APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <Appointments
                leads={leads}
                appointments={appointments}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onDeleteAppointment={handleDeleteAppointment}
                accSettings={accSettings}
              />
            </motion.div>
          )}

          {/* DEDICATED MARKETING TAB */}
          {activeTab === 'marketing' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <MultiLevelMarketingTab
                leads={leads}
                templates={templates}
                logs={emailLogs}
                onAddTemplate={handleAddTemplate}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onSendEmailSimulated={handleSendEmailSimulated}
                properties={properties}
                theme={theme}
                accSettings={accSettings}
                awardXP={(xp, cause) => awardXP(xp)}
                addNotification={addNotification}
                onTriggerConversao={() => setIsConversaoModalOpen(true)}
              />
            </motion.div>
          )}

          {/* 4.6. REAL ESTATE INVENTORY MODULE */}
          {activeTab === 'inventory' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <RealEstateInventory
                leads={leads}
                properties={properties}
                onAddProperty={handleAddProperty}
                onAddBulkProperties={handleAddBulkProperties}
                onAddBulkLeads={handleAddBulkLeads}
                onDeleteProperty={handleDeleteProperty}
                onUpdatePropertyStatus={handleUpdatePropertyStatus}
                onUpdateProperty={handleUpdateProperty}
                theme={theme}
                accSettings={accSettings}
                addNotification={addNotification}
                awardXP={(xp, cause) => awardXP(xp)}
              />
            </motion.div>
          )}

          {/* 5. INTEGRATED ANALYTICAL REPORTS */}
          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <Reports 
                leads={leads} 
                appointments={appointments} 
                emailLogs={emailLogs} 
                goals={gamificationGoals} 
              />
            </motion.div>
          )}

          {/* 6. STANDALONE FINANCE SIMULATOR */}
          {activeTab === 'simulador' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <FinanceSimulatorTab
                leads={leads}
                theme={theme}
                accSettings={accSettings}
                addNotification={addNotification}
                awardXP={(xp, cause) => awardXP(xp)}
              />
            </motion.div>
          )}

          {/* 6.1. SITE DE CAPTAÇÃO PÚBLICO (DISABLED BECAUSE IT IS REPLACED WITH PORTAL CICLOCRED) */}
          {activeTab === 'public-portal-disabled' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <PublicPortal 
                properties={properties}
                onAddCapturedLead={handleAddNewLeadCapturedPublicly}
                accSettings={accSettings}
              />
            </motion.div>
          )}

          {/* 7.1. GEMINI NEURAL SERVER MANAGEMENT MODULE */}
          {activeTab === 'gemini-server' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <GeminiServerTab
                accSettings={accSettings}
                awardXP={awardXP}
                addNotification={addNotification}
                leads={leads}
                setLeads={setLeads}
                templates={templates}
                appointments={appointments}
                setAppointments={setAppointments}
                emailLogs={emailLogs}
                setEmailLogs={setEmailLogs}
              />
            </motion.div>
          )}

          {/* 8. CHILDREN FINANCIAL LITERACY & GAME ROOM */}
          {activeTab === 'kids' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <KidsTab
                awardXP={awardXP}
                accSettings={accSettings}
              />
            </motion.div>
          )}

          {/* 9. CENTRAL USER PANEL (GAMIFICATION + SETTINGS + LEADERBOARD + ADMIN CONTROLS) */}
          {activeTab === 'user-central' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <UserCentralTab
                accSettings={accSettings}
                setAccSettings={setAccSettings}
                userXP={userXP}
                setUserXP={setUserXP}
                userLevel={userLevel}
                setUserLevel={setUserLevel}
                userName={userName}
                setUserName={setUserName}
                userEmail={userEmail}
                setUserEmail={setUserEmail}
                creciNumber={creciNumber}
                setCreciNumber={setCreciNumber}
                userRole={userRole}
                setUserRole={setUserRole}
                agencyName={agencyName}
                setAgencyName={setAgencyName}
                subscriptionPlan={subscriptionPlan}
                setSubscriptionPlan={setSubscriptionPlan}
                theme={theme}
                setTheme={setTheme}
                galaxyPreset={galaxyPreset}
                setGalaxyPreset={setGalaxyPreset}
                leads={leads}
                properties={properties}
                followUpsCount={followUps.length}
                goals={gamificationGoals}
                setGoals={setGamificationGoals}
                projects={gamificationProjects}
                setProjects={setGamificationProjects}
                onResetGamification={handleResetGamification}
                onWipeLeads={handleWipeLeads}
                onWipeEstoque={handleWipeProperties}
                onRequestConfirm={requestConfirmation}
                isAutonomyActive={isAutonomyActive}
                setIsAutonomyActive={setIsAutonomyActive}
                autonomyIntervalSec={autonomyIntervalSec}
                setAutonomyIntervalSec={setAutonomyIntervalSec}
                consolidatedCrmInfo={consolidatedCrmInfo}
                setConsolidatedCrmInfo={setConsolidatedCrmInfo}
                awardXP={awardXP}
              />
            </motion.div>
          )}

          {/* Google Workspace Connectors Module */}
          {activeTab === 'google-workspace' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <GoogleWorkspace
                leads={leads}
                setLeads={setLeads}
                appointments={appointments}
                setAppointments={setAppointments}
                templates={templates}
                emailLogs={emailLogs}
                setEmailLogs={setEmailLogs}
                awardXP={awardXP}
                addNotification={addNotification}
                accSettings={accSettings}
              />
            </motion.div>
          )}

          {/* Settings and Administration Tabs Removed */}

        </main>
      </div>

      {/* SHARED MODALS */}

      {/* D. CUSTOM STYLED CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 bg-zinc-950/80 flex items-center justify-center p-4 z-[9999] select-none backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-zinc-950 p-6 rounded-3xl w-full max-w-sm shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-4 text-zinc-950"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 border-2 border-zinc-950 rounded-2xl shrink-0 ${
                  confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-amber-100 text-amber-700 animate-pulse'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase font-mono tracking-tight leading-snug">
                    {confirmModal.title}
                  </h3>
                  <span className="text-[8px] font-mono font-black text-zinc-400 block uppercase pt-0.5">
                    SEGURANÇA ATIVA COMERCIAL · cicloCRED
                  </span>
                </div>
              </div>

              <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans font-bold">
                {confirmModal.description}
              </p>

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setConfirmModal(null);
                  }}
                  className="px-3.5 py-1.5 border border-zinc-450 text-zinc-700 rounded-xl hover:bg-zinc-100 font-mono font-black text-[9px] uppercase transition"
                >
                  Regressar (Cancelar)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className={`px-4 py-1.5 text-white border-2 border-zinc-950 rounded-xl font-mono font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition active:translate-y-0 ${
                    confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  Confirmar Operação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* A. Lead Edit/Create Modal overlay */}
      <LeadModal
        isOpen={isLeadModalOpen}
        lead={selectedLeadForEdit}
        defaultStatus={defaultStatusForCreate}
        onClose={() => {
          setIsLeadModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSave={handleSaveLead}
      />

      {/* B. Leads Dossier Details Card Modal overlay */}
      <LeadDetailsModal
        isOpen={isDetailsModalOpen}
        lead={selectedLeadForDetails}
        emailLogs={emailLogs}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedLeadForDetails(null);
        }}
        onUpdateLeadNotes={handleUpdateNotes}
        onUpdateLeadStatus={handleMoveLead}
        onUpdateLeadFamilyIncome={handleUpdateFamilyIncome}
        awardXP={(xp) => awardXP(xp)}
      />

      {/* ADAPTIVE IMPORT AND EXPORT MODALS */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md select-none overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-zinc-950 rounded-3xl w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 bg-emerald-600 text-white font-sans font-black flex items-center justify-between border-b-4 border-zinc-950">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-white" />
                  <span className="uppercase tracking-wider text-xs">Importador Adaptável ({activeTab === 'leads' ? 'Leads' : activeTab === 'inventory' ? 'Estoque' : activeTab === 'appointments' ? 'Agenda' : 'Geral'})</span>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-750 text-white rounded-lg p-1.5 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-zinc-600 text-xs font-mono font-bold uppercase select-none">
                  Insira abaixo os dados estruturados em texto ou JSON para alimentar o painel do seu CRM de forma direta e persistente:
                </p>

                {activeTab === 'leads' && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 text-emerald-800 text-[10px] font-mono leading-relaxed select-none">
                      💡 <strong>Dica de formato de Importação de Leads:</strong> Copie e cole linhas como <code>Nome, Renda Bruta, Telefone, Email</code> ou insira uma lista simples. Se preferir, use o botão rápido abaixo para auto-popular dados de teste reais.
                    </div>
                    <textarea
                      id="importLeadsTextarea"
                      rows={5}
                      className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono text-zinc-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ana Silva, 5500, 11988887777, ana.silva@email.com&#10;Bruno Santana, 7200, 21977778888, bruno@email.com"
                    />
                    <div className="flex gap-2 justify-between">
                      <button
                        onClick={() => {
                          const textarea = document.getElementById('importLeadsTextarea') as HTMLTextAreaElement;
                          if (textarea) {
                            textarea.value = JSON.stringify([
                              { name: 'Gabriel Toledo', familyGrossIncome: 8500, phone: '11981234567', email: 'gabriel.toledo@email.com', origin: 'Indicação' },
                              { name: 'Larissa Alencar', familyGrossIncome: 12400, phone: '21983456789', email: 'larissa.a@email.com', origin: 'Instagram' }
                            ], null, 2);
                          }
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-2 border-zinc-950 rounded-lg text-[9px] font-mono font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        Carregar Exemplo JSON
                      </button>
                      <button
                        onClick={() => {
                          const textarea = document.getElementById('importLeadsTextarea') as HTMLTextAreaElement;
                          if (textarea && textarea.value.trim()) {
                            try {
                              let count = 0;
                              const content = textarea.value.trim();
                              if (content.startsWith('[')) {
                                const parsed = JSON.parse(content);
                                if (Array.isArray(parsed)) {
                                  parsed.forEach(item => {
                                    const newLead: any = {
                                      id: 'imported_' + Math.random().toString(36).substring(2, 9),
                                      name: item.name || 'Contato Importado',
                                      familyGrossIncome: Number(item.familyGrossIncome) || 4500,
                                      phone: item.phone || '11900000000',
                                      email: item.email || 'importado@email.com',
                                      origin: item.origin || 'Importação Direta',
                                      status: 'novo',
                                      createdAt: new Date().toISOString(),
                                      history: [{ date: new Date().toISOString().substring(0, 10), text: 'Lead importado via carga adaptável.' }],
                                      tags: ['Importado']
                                    };
                                    setLeads(prev => [newLead, ...prev]);
                                    count++;
                                  });
                                }
                              } else {
                                const lines = content.split('\n');
                                lines.forEach(line => {
                                  if (line.trim()) {
                                    const parts = line.split(',');
                                    const newLead: any = {
                                      id: 'imported_' + Math.random().toString(36).substring(2, 9),
                                      name: parts[0]?.trim() || 'Contato Sem Nome',
                                      familyGrossIncome: Number(parts[1]) || 5000,
                                      phone: parts[2] ? parts[2].trim() : '11900000000',
                                      email: parts[3] ? parts[3].trim() : 'import@email.com',
                                      origin: 'Importação Manual',
                                      status: 'novo',
                                      createdAt: new Date().toISOString(),
                                      history: [{ date: new Date().toISOString().substring(0, 10), text: 'Contato importado CSV manual.' }],
                                      tags: ['Importado']
                                    };
                                    setLeads(prev => [newLead, ...prev]);
                                    count++;
                                  }
                                });
                              }
                              triggerSensoryFeedback('success', accSettings);
                              addNotification('📥 IMPORTAÇÃO EXECUTADA', `${count} novos leads injetados no CRM com sucesso!`, 'success');
                              setIsImportModalOpen(false);
                            } catch (e) {
                              alert('Erro ao processar dados de entrada. Verifique a semântica.');
                            }
                          }
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-zinc-950 rounded-lg text-[9px] font-mono font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        Salvar e Importar Leads
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'inventory' && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 text-emerald-800 text-[10px] font-mono leading-relaxed select-none">
                      🏢 <strong>Importar Lançamento Imobiliário:</strong> Insira o JSON do imóvel. O estoque persistirá instantaneamente com os novos ativos no painel de vendas.
                    </div>
                    <textarea
                      id="importInventoryTextarea"
                      rows={5}
                      className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono text-zinc-950 focus:outline-none"
                      placeholder='{ "title": "Cury Jardim de Alah", "price": 275000, "typology": "Apartamento 2D", "city": "Rio de Janeiro" }'
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          const textarea = document.getElementById('importInventoryTextarea') as HTMLTextAreaElement;
                          if (textarea && textarea.value.trim()) {
                            try {
                              const parsed = JSON.parse(textarea.value.trim());
                              const list = Array.isArray(parsed) ? parsed : [parsed];
                              list.forEach(prop => {
                                const newId = Math.random().toString(36).substring(2, 9);
                                setProperties(prev => [
                                  {
                                    id: prop.id || 'imported-' + newId,
                                    title: prop.title || 'Lançamento Cury Importado',
                                    price: Number(prop.price) || 289000,
                                    typology: prop.typology || 'Apartamento 2 Dorms',
                                    builder: prop.builder || 'Cury Construtora',
                                    region: prop.region || 'Metropolitana',
                                    city: prop.city || 'São Paulo',
                                    parameters: prop.parameters || { maxFinancingRatio: 0.8, baseInterestRate: 0.0829 }
                                  },
                                  ...prev
                                ]);
                              });
                              triggerSensoryFeedback('success', accSettings);
                              addNotification('🏢 ESTOQUE EXPANDIDO', `Novas propriedades de Cury adicionadas de forma durável!`, 'success');
                              setIsImportModalOpen(false);
                            } catch (err) {
                              alert('Dados JSON inválidos. Favor corrigir a sintaxe.');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-black text-[10px] uppercase border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        Carregar Unidades
                      </button>
                    </div>
                  </div>
                )}

                {activeTab !== 'leads' && activeTab !== 'inventory' && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 font-mono select-none">
                      Não há importadores adicionais necessários para a aba "{activeTab}". Use os importadores customizados nativos do cicloCRED CRM.
                    </p>
                    <button
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 bg-zinc-900 border-2 border-zinc-950 text-white rounded-xl text-xs font-mono font-black uppercase cursor-pointer block text-center w-full"
                    >
                      Entendido / Fechar Janela
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md select-none overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-zinc-950 rounded-3xl w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 bg-indigo-600 text-white font-sans font-black flex items-center justify-between border-b-4 border-zinc-950">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-white" />
                  <span className="uppercase tracking-wider text-xs">Exportar Dados ({activeTab === 'leads' ? 'Leads' : activeTab === 'inventory' ? 'Ativos Estoque' : 'Relatórios & Parâmetros'})</span>
                </div>
                <button onClick={() => setIsExportModalOpen(false)} className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-750 text-white rounded-lg p-1.5 transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="bg-indigo-50 border-2 border-indigo-400 p-3 rounded-xl text-indigo-900 text-[10px] font-mono leading-relaxed select-none">
                  Sincronização Ativa & Exportação Dinâmica. Abaixo, copie ou baixe a representação codificada dos seus dados no CRM.
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] text-zinc-950 font-black font-mono uppercase">Snapshot JSON Atual:</label>
                  <pre className="bg-zinc-900 text-green-400 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-[250px] whitespace-pre-wrap select-all">
                    {activeTab === 'leads' ? (
                      JSON.stringify(unifiedFilteredLeads.map(l => ({ name: l.name, email: l.email, phone: l.phone, income: l.familyGrossIncome, status: l.status, origin: l.origin })), null, 2)
                    ) : activeTab === 'inventory' ? (
                      JSON.stringify(properties, null, 2)
                    ) : activeTab === 'appointments' ? (
                      JSON.stringify(appointments, null, 2)
                    ) : (
                      JSON.stringify({
                        exportedAt: new Date().toISOString(),
                        currentActiveTab: activeTab,
                        leadsFilteredCount: unifiedFilteredLeads.length
                      }, null, 2)
                    )}
                  </pre>
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => {
                      const text = activeTab === 'leads' ? (
                        JSON.stringify(unifiedFilteredLeads, null, 2)
                      ) : activeTab === 'inventory' ? (
                        JSON.stringify(properties, null, 2)
                      ) : (
                        JSON.stringify(appointments, null, 2)
                      );
                      navigator.clipboard.writeText(text);
                      triggerSensoryFeedback('success', accSettings);
                      addNotification('📋 COPIADO', 'Os dados estruturados foram copiados para sua área de transferência.', 'success');
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-black text-[10px] uppercase border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Copiar Clipboard
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
                        activeTab === 'leads' ? JSON.stringify(unifiedFilteredLeads) : JSON.stringify(properties)
                      );
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `ciclocred-${activeTab}-export.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      addNotification('💾 ARQUIVO SALVO', 'Exportação realizada e transferida com êxito!', 'success');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-[10px] uppercase border-2 border-zinc-950 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Baixar Arquivo .json
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BB. Settings & Administration Modal Overlay */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md select-none overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-zinc-950 rounded-3xl w-full max-w-5xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-4.5 border-b-4 border-zinc-950 bg-zinc-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                  <h3 className="font-sans font-black text-sm uppercase italic tracking-tight">
                    ⚙️ Administração & Configurações cicloCRED
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg border border-transparent hover:border-zinc-700 hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector Inside Modal */}
              <div className="px-6 py-2.5 bg-zinc-800 text-white flex gap-4 border-b-4 border-zinc-950 text-xs font-mono font-black uppercase select-none">
                <button
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setSettingsModalTab('profile');
                  }}
                  className={`pb-1 border-b-2 transition ${settingsModalTab === 'profile' ? 'border-indigo-400 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-250'}`}
                >
                  👤 Perfil & Ajustes CRM
                </button>
                <button
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setSettingsModalTab('database');
                  }}
                  className={`pb-1 border-b-2 transition ${settingsModalTab === 'database' ? 'border-indigo-400 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-250'}`}
                >
                  💾 Banco de Dados & Backups
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="p-6 overflow-y-auto bg-zinc-50 flex-1 text-zinc-800">
                {settingsModalTab === 'profile' ? (
                  <SettingsView
                    theme={theme}
                    setTheme={setTheme}
                    galaxyPreset={galaxyPreset}
                    setGalaxyPreset={setGalaxyPreset}
                    accSettings={accSettings}
                    setAccSettings={setAccSettings}
                    userName={userName}
                    setUserName={setUserName}
                    userEmail={userEmail}
                    setUserEmail={setUserEmail}
                    creciNumber={creciNumber}
                    setCreciNumber={setCreciNumber}
                    userRole={userRole}
                    setUserRole={setUserRole}
                    agencyName={agencyName}
                    setAgencyName={setAgencyName}
                    subscriptionPlan={subscriptionPlan}
                    setSubscriptionPlan={setSubscriptionPlan}
                    userLevel={userLevel}
                    userXP={userXP}
                    properties={properties}
                    leads={leads}
                    isAutonomyActive={isAutonomyActive}
                    setIsAutonomyActive={setIsAutonomyActive}
                    autonomyIntervalSec={autonomyIntervalSec}
                    setAutonomyIntervalSec={setAutonomyIntervalSec}
                    leadsCount={leads.length}
                    propertiesCount={properties.length}
                    inventoryCount={properties.length}
                    onWipeLeads={handleWipeLeads}
                    onWipeEstoque={handleWipeProperties}
                    onRequestConfirm={requestConfirmation}
                    forceLocalStorageMode={forceLocalStorageMode}
                    onToggleForceLocalMode={handleToggleForceLocalMode}
                    consolidatedCrmInfo={consolidatedCrmInfo}
                    setConsolidatedCrmInfo={setConsolidatedCrmInfo}
                  />
                ) : (
                  <BackupManager
                    leads={leads}
                    setLeads={setLeads}
                    properties={properties}
                    setProperties={setProperties}
                    appointments={appointments}
                    setAppointments={setAppointments}
                    inventory={inventory}
                    setInventory={setInventory}
                    templates={templates}
                    setTemplates={setTemplates}
                    goals={gamificationGoals}
                    setGoals={setGamificationGoals}
                    projects={gamificationProjects}
                    setProjects={setGamificationProjects}
                    userXP={userXP}
                    setUserXP={setUserXP}
                    userLevel={userLevel}
                    setUserLevel={setUserLevel}
                    accSettings={accSettings}
                    onAddNotification={addNotification}
                    onRequestConfirm={requestConfirmation}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-100 border-t-4 border-zinc-950 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-mono font-black text-xs uppercase border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition active:translate-y-0"
                >
                  Sair das Configurações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. Dynamic Conversational CRM Notifications Drawer overlay */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-screen max-w-md bg-zinc-950 text-zinc-100 border-l-4 border-zinc-900 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col h-full font-sans"
              >
                {/* Header title block */}
                <div className="p-6 border-b-2 border-zinc-900 bg-gradient-to-r from-indigo-950 to-zinc-950">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">Canal CRM Autônomo</h3>
                        <p className="text-[10px] text-indigo-300 font-semibold font-mono">Conversão Ativa em Tempo Real</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-[9px] font-mono font-bold text-zinc-400">
                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                      <span className="block text-[8px] uppercase text-zinc-500">Histórico de Alertas</span>
                      <span className="text-white text-xs font-black">{notifications.length} registros</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-lg border border-indigo-950 flex items-center gap-1.5 justify-between">
                      <div>
                        <span className="block text-[8px] uppercase text-indigo-400">NÍVEL ATUAL</span>
                        <span className="text-indigo-300 text-xs font-black">Galaxy {userLevel}</span>
                      </div>
                      <span className="rounded-full bg-indigo-900/40 p-1 text-[10px] text-white">🚀</span>
                    </div>
                  </div>
                </div>

                {/* Notification Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/90 h-[calc(100vh-230px)]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3.5">
                      <Bell className="w-8 h-8 text-zinc-600 animate-bounce" />
                      <div>
                        <h4 className="text-xs font-black uppercase font-mono text-zinc-400">Tudo Silencioso no Espaço</h4>
                        <p className="text-[10px] text-zinc-500 max-w-xs mt-1">Nenhum evento detectado. Use o botão abaixo para simular alertas imediatamente!</p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((notify) => (
                      <div
                        key={notify.id}
                        className={`p-3.5 rounded-xl border-2 transition-all duration-350 ${
                          notify.read 
                            ? 'bg-zinc-905 bg-opacity-30 border-zinc-900 text-zinc-400' 
                            : 'bg-zinc-900 border-indigo-900 text-white shadow-[0_2px_8px_rgba(99,102,241,0.15)]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {notify.type === 'ai' && <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            {notify.type === 'alarm' && <BellRing className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />}
                            {notify.type === 'success' && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {notify.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {notify.type === 'info' && <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                            
                            <span className="text-xs font-black uppercase font-mono tracking-tight text-white">{notify.title}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 tracking-wider shrink-0 ml-1">{notify.timestamp}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-zinc-300 mt-2 font-sans leading-relaxed">{notify.message}</p>
                        
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-800/80">
                          {!notify.read && (
                            <button
                              onClick={() => {
                                setNotifications(prev => prev.map(n => n.id === notify.id ? { ...n, read: true } : n));
                                triggerSensoryFeedback('click', accSettings);
                              }}
                              className="text-[9px] font-mono font-black uppercase text-indigo-400 hover:text-indigo-300 transition"
                            >
                              Marcar como lido
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setNotifications(prev => prev.filter(n => n.id !== notify.id));
                              triggerSensoryFeedback('warning', accSettings);
                            }}
                            className="text-[9px] font-mono text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition ml-auto"
                            title="Deletar notificação"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer and test trigger */}
                <div className="p-4 border-t-2 border-zinc-900 bg-zinc-950 space-y-2 mt-auto">
                  <button
                    onClick={() => {
                      triggerSensoryFeedback('click', accSettings);
                      simulateCRMAction();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs uppercase border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>DIAGNOSTICAR OPORTUNIDADES REAL 🔍</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-black">
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        triggerSensoryFeedback('success', accSettings);
                      }}
                      className="py-2.5 bg-zinc-905 bg-opacity-40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg uppercase transition"
                    >
                      Ler Todas
                    </button>
                    <button
                      onClick={() => {
                        setNotifications([]);
                        triggerSensoryFeedback('warning', accSettings);
                      }}
                      className="py-2.5 bg-zinc-905 bg-opacity-40 hover:bg-zinc-800 border border-zinc-800 text-rose-400 rounded-lg uppercase transition"
                    >
                      Limpar Tudo
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* D. Real-Time Scheduled Task Alarm Modal */}
      <AnimatePresence>
        {activeAlarm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative w-full max-w-md bg-white border-8 border-red-600 rounded-3xl p-6 text-zinc-900 shadow-[0_0_50px_rgba(239,68,68,0.5)] flex flex-col space-y-4"
            >
              <div className="flex flex-col items-center justify-center text-center space-y-3.5">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-x-0 w-16 h-16 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                  <div className="rounded-full bg-zinc-950 border-4 border-zinc-950 p-4 relative z-10">
                    <BellRing className="w-8 h-8 text-rose-500 animate-bounce" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black bg-rose-100 text-rose-800 px-3 py-1 rounded-full uppercase border border-rose-200">
                    ⚠️ ALARME DO CRM ATIVO ÀS {activeAlarm.time}
                  </span>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-zinc-900 mt-3 font-sans">
                    {activeAlarm.title}
                  </h3>
                  <p className="text-xs font-bold text-zinc-500 mt-1 font-mono">
                    Cliente / Lead: {activeAlarm.leadName}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 border-2 border-zinc-950 p-4 rounded-2xl text-xs text-zinc-700 font-bold leading-relaxed font-sans shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {activeAlarm.description}
              </div>

              <div className="space-y-2 text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAlarm(null);
                    triggerSensoryFeedback('success', accSettings);
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] text-white font-black rounded-2xl text-xs uppercase tracking-wider border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-1 py-3"
                >
                  Concluir / Desativar Alarme 🔕
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAlarm(null);
                    setActiveTab('appointments');
                    triggerSensoryFeedback('click', accSettings);
                  }}
                  className="text-[10px] font-mono font-black text-indigo-600 hover:text-indigo-800 transition uppercase"
                >
                  Ver compromisso na aba de agendamentos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Preferences and Photo Modal Removed */}

      {/* E. Deactivated Legacy Profile Modal */}
      <AnimatePresence>
        {false && showProfilePrefsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs"
              onClick={() => setShowProfilePrefsModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`relative w-full max-w-3xl rounded-3xl p-6 md:p-8 text-white border-4 border-zinc-950 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto ${
                theme === 'galatico'
                  ? 'bg-gradient-to-b from-indigo-950 to-zinc-950 border-indigo-500/50'
                  : 'bg-zinc-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-zinc-800 mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Menu do Corretor & Preferências
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">Gerencie seu perfil de vendas, acessibilidade e compartilhe seu portfólio digital nas redes.</p>
                </div>
                <button
                  onClick={() => {
                    triggerSensoryFeedback('click', accSettings);
                    setShowProfilePrefsModal(false);
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-950 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Column 1: Profile & Photo */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase font-mono tracking-wider text-indigo-400">Identificação & Foto</h4>
                  
                  {/* Avatar Upload UI */}
                  <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shrink-0 flex items-center justify-center">
                      {localStorage.getItem('ciclocred_user_photo') && localStorage.getItem('ciclocred_user_photo') !== '' ? (
                        <img                     
                          src={localStorage.getItem('ciclocred_user_photo') || undefined}
                          alt="Perfil"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-500 font-black text-2xl text-zinc-950 flex items-center justify-center uppercase">
                          {userName.substring(0,2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <span className="block text-[10px] uppercase text-zinc-400 font-black font-mono">Alterar Imagem de Perfil</span>
                      <label className="inline-block px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-black uppercase font-mono text-zinc-300 rounded-lg cursor-pointer border border-zinc-700 transition">
                        Fazer Upload Foto
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result as string;
                                localStorage.setItem('ciclocred_user_photo', base64String);
                                triggerSensoryFeedback('success', accSettings);
                                addNotification('📸 FOTO ATUALIZADA', 'Sua nova foto de perfil foi salva localmente no CRM.', 'success');
                                // Force state refresh
                                setUserName(prev => prev + " ");
                                setTimeout(() => setUserName(prev => prev.trim()), 50);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button 
                        onClick={() => {
                          localStorage.removeItem('ciclocred_user_photo');
                          triggerSensoryFeedback('warning', accSettings);
                          setUserName(prev => prev + " ");
                          setTimeout(() => setUserName(prev => prev.trim()), 50);
                        }}
                        className="block text-[10px] font-mono text-rose-405 hover:text-rose-300 font-bold transition"
                      >
                        Remover Foto
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-black text-zinc-405 mb-1">Nome Completo</label>
                      <input 
                        type="text"
                        value={userName}
                        onChange={(e) => {
                          setUserName(e.target.value);
                          localStorage.setItem('ciclocred_user_name', e.target.value);
                        }}
                        className="w-full text-xs font-bold px-3 py-2 bg-zinc-950 border-2 border-zinc-950 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-black text-zinc-400 mb-1">E-mail de Contato</label>
                      <input 
                        type="email"
                        value={userEmail}
                        onChange={(e) => {
                          setUserEmail(e.target.value);
                          localStorage.setItem('ciclocred_user_email', e.target.value);
                        }}
                        className="w-full text-xs font-bold px-3 py-2 bg-zinc-950 border-2 border-zinc-950 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-mono font-black text-zinc-400 mb-1">Inscrição CRECI</label>
                        <input 
                          type="text"
                          value={creciNumber}
                          onChange={(e) => {
                            setCreciNumber(e.target.value);
                            localStorage.setItem('ciclocred_creci_number', e.target.value);
                          }}
                          placeholder="CRECI 12345-F"
                          className="w-full text-xs font-bold px-3 py-2 bg-zinc-950 border-2 border-zinc-950 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono font-black text-zinc-400 mb-1">Rank de Vendas</label>
                        <div className="px-3 py-2 bg-zinc-950 rounded-xl border-2 border-zinc-950 text-xs text-indigo-300 font-black uppercase font-mono flex items-center gap-1">
                          🏆 Platinum Vendedor
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Accessibility & Settings Preferences */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase font-mono tracking-wider text-indigo-400">Preferências Sensoriais</h4>

                  <div className="space-y-4 bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {/* Accessibility switches */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-white">Efeitos Sonoros</span>
                          <span className="text-[10px] text-zinc-500">Acione toques auditivos e alertas de CRM</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...accSettings, soundsEnabled: !accSettings.soundsEnabled };
                            setAccSettings(updated);
                            localStorage.setItem('ciclocred_sensory_config', JSON.stringify(updated));
                            triggerSensoryFeedback('click', updated);
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                            accSettings.soundsEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                            accSettings.soundsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-white">Sensório de Vibração Tátil</span>
                          <span className="text-[10px] text-zinc-500">Sincronize pulsações táteis na digitação</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...accSettings, hapticsEnabled: !accSettings.hapticsEnabled };
                            setAccSettings(updated);
                            localStorage.setItem('ciclocred_sensory_config', JSON.stringify(updated));
                            triggerSensoryFeedback('chime', updated);
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                            accSettings.hapticsEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                            accSettings.hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-white">Sintetizador por Voz AI</span>
                          <span className="text-[10px] text-zinc-500">Leitor dinâmico assistido por voz artificial</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...accSettings, speakAloudEnabled: !accSettings.speakAloudEnabled };
                            setAccSettings(updated);
                            localStorage.setItem('ciclocred_sensory_config', JSON.stringify(updated));
                            triggerSensoryFeedback('success', updated);
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                            accSettings.speakAloudEnabled ? 'bg-indigo-600' : 'bg-zinc-805'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                            accSettings.speakAloudEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-3">
                      <span className="block text-[10px] uppercase font-mono font-black text-indigo-400 mb-2">Tamanho das Fontes</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-black">
                        {['normal', 'large', 'extra-large'].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => {
                              const updated = { ...accSettings, fontSizeClass: sz as any };
                              setAccSettings(updated);
                              localStorage.setItem('ciclocred_sensory_config', JSON.stringify(updated));
                              triggerSensoryFeedback('click', updated);
                            }}
                            className={`py-1.5 uppercase border rounded-lg text-[9px] font-mono font-black transition ${
                              accSettings.fontSizeClass === sz
                                ? 'bg-indigo-600 text-white border-zinc-950 font-black'
                                : 'bg-zinc-900 text-zinc-450 border-zinc-800'
                            }`}
                          >
                            {sz === 'normal' ? 'Padrão' : sz === 'large' ? 'Grande' : 'Gigante'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-3">
                      <span className="block text-[10px] uppercase font-mono font-black text-indigo-400 mb-2">Tema Visual Geral</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-black">
                        {['claro', 'escuro', 'galatico'].map((tm) => (
                          <button
                            key={tm}
                            onClick={() => {
                              setTheme(tm as any);
                              localStorage.setItem('ciclocred_theme', tm);
                              triggerSensoryFeedback('click', accSettings);
                            }}
                            className={`py-1.5 uppercase border rounded-lg text-[9px] font-mono font-black transition ${
                              theme === tm
                                ? 'bg-indigo-600 text-white border-zinc-950 font-black'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {tm === 'claro' ? 'Claro' : tm === 'escuro' ? 'Escuro' : 'Galáctico'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Local & Social area */}
              <div className="mt-6 pt-4 border-t-2 border-zinc-800 space-y-3">
                <h4 className="text-sm font-black uppercase font-mono tracking-wider text-indigo-400 font-bold">Compartilhar Cartão Web do Corretor</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      const shareText = `Olá, aqui é o Corretor ${userName} (${creciNumber || 'CRECI'}). Acesse meu estoque exclusivo de imóveis residenciais atualizados em tempo real: ${window.location.protocol}//${window.location.host}?ref=${creciNumber}`;
                      if (navigator.share) {
                        navigator.share({
                          title: `Portfólio Imobiliário - Corretor ${userName}`,
                          text: shareText,
                          url: window.location.href,
                        }).then(() => {
                          awardXP(100);
                          addNotification('🚀 INFORMAÇÕES COMPARTILHADAS', 'Você compartilhou suas informações de contato imobiliário.', 'success');
                        }).catch(err => {
                          console.log(err);
                        });
                      } else {
                        navigator.clipboard.writeText(shareText);
                        triggerSensoryFeedback('success', accSettings);
                        alert('Link do Cartão Digital copiado com sucesso para a área de transferência!');
                        awardXP(50);
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-zinc-955 hover:bg-zinc-800 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition"
                  >
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Compartilhar Local</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`Olá, sou Corretor Credenciado ${userName} (${creciNumber}). Segue o link com as novidades do portfólio de imóveis em aberto: ${window.location.href}`);
                      window.open(`https://api.whatsapp.com/send?text=${msg}`);
                      awardXP(50);
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition"
                  >
                    <Share2 className="w-4 h-4 text-emerald-200 animate-pulse" />
                    <span>Postar WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Confira as oportunidades que separei para você! Fale direto com ${userName} no número do CRECI: ${creciNumber}. Link: ${window.location.href}`);
                      triggerSensoryFeedback('success', accSettings);
                      alert('Copiado texto do Instagram profissional! Cole na sua Bio ou Stories para engajamento rápido.');
                      window.open('https://www.instagram.com/');
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition"
                  >
                    <Share2 className="w-4 h-4 text-pink-200" />
                    <span>Instagram Bio</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTÃO FLUTUANTE TRÊS PONTINHOS - PERSISTENTE E PREMIUM */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsPremiumActionsOpen(!isPremiumActionsOpen);
            triggerSensoryFeedback('click', accSettings);
          }}
          className="h-14 w-14 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white flex items-center justify-center border-4 border-white shadow-[0px_4px_16px_0px_rgba(0,0,0,0.3)] animate-pulse hover:animate-none cursor-pointer transition transform active:scale-95"
          title="Central de Ações cicloCRED"
        >
          {isPremiumActionsOpen ? (
            <X className="w-6 h-6 text-pink-400 shrink-0" />
          ) : (
            <MoreHorizontal className="w-7 h-7 text-indigo-400 shrink-0" />
          )}
        </button>
      </div>

      {/* CENTRAL DE AÇÕES PREMIUM OVERLAY */}
      <AnimatePresence>
        {isPremiumActionsOpen && (
          <div className="fixed inset-0 z-45 flex items-end sm:items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white border-4 border-zinc-950 rounded-3xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden text-zinc-900 text-left"
            >
              <div className="p-4.5 bg-zinc-900 border-b-4 border-zinc-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h3 className="font-sans font-black text-sm uppercase italic tracking-tight">
                    Central de Ações Premium
                  </h3>
                </div>
                <button
                  onClick={() => setIsPremiumActionsOpen(false)}
                  className="text-zinc-400 hover:text-white text-xs font-bold uppercase font-mono px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-zinc-500 font-sans font-semibold">
                  Acesso rápido e unificado de importação, relatórios, rotinas de backup e links operacionais simplificados.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  
                  {/* IMPORT LEADS */}
                  <button
                    onClick={() => {
                      setIsPremiumActionsOpen(false);
                      setActiveTab('leads');
                      setIsPlanilhasModalOpen(true);
                      awardXP(10);
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-indigo-50 hover:bg-indigo-100 border-2 border-zinc-950 rounded-xl transition text-left cursor-pointer"
                  >
                    <span className="text-lg">📥</span>
                    <div>
                      <strong className="block text-xs font-black uppercase text-indigo-950 leading-tight">Importar Leads</strong>
                      <span className="text-[10.5px] text-zinc-500 font-medium">Planilhas Excel/CSV</span>
                    </div>
                  </button>

                  {/* EXPORT LEADS */}
                  <button
                    onClick={() => {
                      setIsPremiumActionsOpen(false);
                      // Execute exporting
                      let csvContent = "data:text/csv;charset=utf-8,ID;Nome;Email;Telefone;Orcamento;Canal;Notas;CriadoEm\r\n";
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
                      awardXP(15);
                      addNotification('📊 EXPORTAÇÃO INICIADA', 'Os contatos cadastrados no CRM foram consolidados com sucesso em formato .csv', 'success');
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-zinc-950 rounded-xl transition text-left cursor-pointer"
                  >
                    <span className="text-lg">📤</span>
                    <div>
                      <strong className="block text-xs font-black uppercase text-emerald-950 leading-tight">Exportar Leads</strong>
                      <span className="text-[10.5px] text-zinc-500 font-medium">Download Planilha</span>
                    </div>
                  </button>

                  {/* EXPORT PROPERTIES */}
                  <button
                    onClick={() => {
                      setIsPremiumActionsOpen(false);
                      // Execute exporting properties
                      let csvContent = "data:text/csv;charset=utf-8,Codigo;Titulo;Tipo;Preco;Quartos;Bairro;Area_m2;Status\r\n";
                      properties.forEach(p => {
                        csvContent += `"${p.code}";"${p.title}";"${p.type}";"${p.price}";"${p.bedrooms}";"${p.neighborhood}";"${p.sizeSqm}";"${p.status}"\r\n`;
                      });
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", 'Planilha_Estoque_IMO_cicloCRED.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      awardXP(15);
                      addNotification('🏠 ACERVO EXPORTADO', 'A planilha consolidada com todo o catálogo de estoque foi exportada com sucesso.', 'success');
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-950 rounded-xl transition text-left cursor-pointer"
                  >
                    <span className="text-lg">📊</span>
                    <div>
                      <strong className="block text-xs font-black uppercase text-zinc-950 leading-tight">Exportar Estoque</strong>
                      <span className="text-[10.5px] text-zinc-500 font-medium">Download de Imóveis</span>
                    </div>
                  </button>

                  {/* BULK DISPAROS */}
                  <button
                    onClick={() => {
                      setIsPremiumActionsOpen(false);
                      setActiveTab('marketing');
                      awardXP(5);
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-purple-50 hover:bg-purple-100 border-2 border-zinc-950 rounded-xl transition text-left cursor-pointer"
                  >
                    <span className="text-lg">📣</span>
                    <div>
                      <strong className="block text-xs font-black uppercase text-purple-950 leading-tight">Campanhas</strong>
                      <span className="text-[10.5px] text-zinc-500 font-medium">Central de Disparos</span>
                    </div>
                  </button>

                  {/* APPOINTMENTS */}
                  <button
                    onClick={() => {
                      setIsPremiumActionsOpen(false);
                      setActiveTab('appointments');
                      awardXP(5);
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-amber-50 hover:bg-amber-100 border-2 border-zinc-950 rounded-xl transition text-left cursor-pointer"
                  >
                    <span className="text-lg">📅</span>
                    <div>
                      <strong className="block text-xs font-black uppercase text-amber-950 leading-tight">Compromissos</strong>
                      <span className="text-[10.5px] text-zinc-500 font-medium">Agenda do Corretor</span>
                    </div>
                  </button>

                  {/* BACKUP & RESTORE */}
                  <button
                    onClick={() => {
                      setIsPremiumActionsOpen(false);
                      setActiveTab('settings');
                      setSettingsModalTab('database');
                      awardXP(5);
                    }}
                    className="flex items-center gap-2.5 p-3.5 bg-pink-50 hover:bg-pink-100 border-2 border-zinc-950 rounded-xl transition text-left cursor-pointer"
                  >
                    <span className="text-lg">💾</span>
                    <div>
                      <strong className="block text-xs font-black uppercase text-pink-950 leading-tight">Migração local</strong>
                      <span className="text-[10.5px] text-zinc-555 font-medium">Importador de Banco</span>
                    </div>
                  </button>

                </div>

                {/* COPY PORTAL LINK */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPremiumActionsOpen(false);
                    navigator.clipboard.writeText(window.location.origin);
                    triggerSensoryFeedback('success', accSettings);
                    addNotification('🔗 LINK COPIADO', 'O endereço de acesso ao seu portal de vendas cicloCRED foi copiado!', 'success');
                    awardXP(10);
                  }}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-950 text-white rounded-2xl border-4 border-zinc-950 font-mono font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition active:translate-y-0.5 cursor-pointer mt-2"
                >
                  🔗 Copiar Link de Acesso do CRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
