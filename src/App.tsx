/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";

import {
  Lead,
  EmailTemplate,
  EmailLog,
  LeadActionLog,
  LeadStatus,
  Appointment,
  InventoryItem,
  RealEstateProperty,
  Goal,
  Project,
  CRMNotification,
  OperationalFlow,
  FollowUpUpdate,
  QuickNote,
  OperationalOS,
  AppBackgrounds,
  BackgroundConfig,
} from "./types";
import {
  INITIAL_LEADS,
  INITIAL_TEMPLATES,
  INITIAL_EMAIL_LOGS,
  INITIAL_PROPERTIES,
} from "./data/initialRecords";
import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
  disableFirestoreNetwork,
  enableFirestoreNetwork,
  googleSignIn,
  initAuth,
  getAccessToken,
} from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getKanbanColumns } from "./utils/kanban";
import { createDefaultFlow } from "./utils/flow";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

import { ConfigProvider } from "./context/ConfigContext";
import Sidebar from "./components/Sidebar";
import LeadEditorForm from "./components/LeadEditorForm";
import KanbanBoard from "./components/KanbanBoard";
import LeadList, {
  extractPhoneFromString,
  isFictitiousPhone,
  processFileOrPasteContent,
} from "./components/LeadList";
import ScriptsAndFlows from "./components/ScriptsAndFlows";
import EmailAutomation from "./components/EmailAutomation";
import Reports from "./components/Reports";
import RealEstateInventory from "./components/RealEstateInventory";
import LeadModal from "./components/LeadModal";
import LeadDetailsModal from "./components/LeadDetailsModal";
import OSModal from "./components/OSModal";
import MultiLevelMarketingTab from "./components/MultiLevelMarketingTab";
import FinanceSimulatorTab from "./components/FinanceSimulatorTab";
import CicloCredInformTab from "./components/CicloCredInformTab";
import FollowUpsTable from "./components/FollowUpsTable";

import PublicPortal from "./components/PublicPortal";
import RuleEnginePanel from "./components/RuleEnginePanel";
import AIAssistantChat from "./components/AIAssistantChat";

import PersonalizationModal from "./components/PersonalizationModal";
import IntelligenceDashboard from "./components/IntelligenceDashboard";
import { 
  calculateCompatibility, 
  calculatePriority, 
  suggestNextAction, 
  calculateConversionProbability 
} from "./utils/intelligence";

// Sensory & Custom Sub tabs imports
import LoginView from "./components/Login";
import SettingsView from "./components/Settings";
import GamificationView from "./components/Gamification";
import BackupManager from "./components/BackupManager";
import UserCentralModal from "./components/UserCentralModal";
import KidsTab from "./components/KidsTab";
import AutomationFlowsTab from "./components/AutomationFlowsTab";
import ArchivedLeadsSheet from "./components/ArchivedLeadsSheet";
import UserCentralTab from "./components/UserCentralTab";
import GoogleWorkspace, {
  getWorkspaceToken,
  syncCRMMovementToGoogleSheet,
  autoSyncWorkspaceDatabase,
} from "./components/GoogleWorkspace";
import GeminiServerTab from "./components/GeminiServerTab";
import QuickNotes from "./components/QuickNotes";
import ScheduleFollowUpModal from "./components/ScheduleFollowUpModal";
import { WorkspaceTab } from "./components/WorkspaceTab";
import AnimatedCounter from "./components/AnimatedCounter";
import {
  AccessibilitySettings,
  triggerSensoryFeedback,
  INITIAL_ACCESSIBILITY_SETTINGS,
} from "./utils/sensory";

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
  Palette,
  Search,
  UserPlus,
  Sliders,
  MoreHorizontal,
  Home,
  Calculator,
  BarChart2,
  User,
  Download,
  Upload,
  Zap,
  BookOpen,
  Archive,
  Database,
  MessageSquare,
  MoreVertical,
  Shield,
  ChevronLeft,
  Edit3,
  LayoutDashboard,
  FileText,
  History,
  ClipboardList,
  PlusCircle,
  StickyNote,
} from "lucide-react";

import SmartCalendar from "./components/SmartCalendar";
import SmartNextSteps from "./components/SmartNextSteps";

// Robust, in-app Markdown parser for CEO Copilot Insights
function parseBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="text-white font-black">
          {part}
        </strong>
      );
    }
    return part;
  });
}

function renderCeoMarkdown(txt: string) {
  if (!txt) return null;
  return txt.split("\n").map((line, i) => {
    let trimmed = line.trim();
    if (trimmed.startsWith("###")) {
      return (
        <h3
          key={i}
          className="text-zinc-100 font-extrabold text-xs uppercase mt-4 mb-2 tracking-wider flex items-center gap-2 border-l-4 border-purple-500 pl-2"
        >
          {trimmed.replace(/^###\s*/, "")}
        </h3>
      );
    }
    if (trimmed.startsWith("##")) {
      return (
        <h2
          key={i}
          className="text-purple-400 font-extrabold text-sm uppercase mt-5 mb-2 tracking-wide flex items-center gap-2"
        >
          {trimmed.replace(/^##\s*/, "")}
        </h2>
      );
    }
    if (trimmed.startsWith("#")) {
      return (
        <h1
          key={i}
          className="text-white font-black text-base uppercase mt-6 mb-3 tracking-widest border-b border-zinc-800 pb-1"
        >
          {trimmed.replace(/^#\s*/, "")}
        </h1>
      );
    }
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const text = trimmed.replace(/^[\*\-]\s*/, "");
      return (
        <div
          key={i}
          className="text-zinc-300 text-xs font-sans ml-4 pl-1 list-item mt-1.5 leading-relaxed"
        >
          {parseBoldText(text)}
        </div>
      );
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s+/, "");
      const num = trimmed.match(/^\d+/)?.[0] || "";
      return (
        <div
          key={i}
          className="text-zinc-300 text-xs font-sans ml-4 pl-1 mt-1.5 leading-relaxed"
        >
          <span className="text-purple-400 font-mono font-bold mr-1.5">
            {num}.
          </span>
          {parseBoldText(text)}
        </div>
      );
    }
    if (!trimmed) {
      return <div key={i} className="h-2"></div>;
    }
    return (
      <p
        key={i}
        className="text-zinc-300 text-xs font-mono mt-1.5 leading-relaxed"
      >
        {parseBoldText(line)}
      </p>
    );
  });
}

interface FloatingButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  colorClass?: string;
  accSettings: any;
}

function FloatingButton({
  label,
  icon,
  onClick,
  active,
  colorClass,
  accSettings,
}: FloatingButtonProps) {
  return (
    <div className="group relative flex items-center gap-2 select-none">
      {/* Horizontal Label shown on hover */}
      <span className="opacity-0 -translate-x-3 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-colors block text-xs font-black font-mono uppercase bg-zinc-950 border-2 border-zinc-950 text-white px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] whitespace-nowrap z-[100] absolute right-12">
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          triggerSensoryFeedback("click", accSettings);
          onClick();
        }}
        className={`w-11 h-11 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-colors cursor-pointer ${
          colorClass
            ? colorClass
            : active
              ? "bg-indigo-600 text-white border-zinc-950"
              : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        }`}
        title={label}
      >
        <span className="text-base select-none leading-none flex items-center justify-center">
          {icon}
        </span>
      </button>
    </div>
  );
}

function FloatingDashboardWidgets({ userName }: { userName: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const h = time.getHours();
  const greeting = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";

  const dateStr = time
    .toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "long",
    })
    .replace("-feira", "");
  const timeStr = time.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* Saudação (Esquerda) */}
      <div className="absolute left-[30px] md:left-[38px] top-[64px] md:top-[68px] z-[43] pointer-events-none flex items-center">
        <div className="bg-zinc-900/60  border border-zinc-800/80 px-3 py-1.5 rounded-br-xl text-zinc-300 font-medium text-[9px] md:text-[10px] uppercase font-mono tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
          👋 {greeting},{" "}
          <span className="font-black text-indigo-400">
            {userName ? userName.split(" ")[0] : "Usuário"}
          </span>
        </div>
      </div>
      {/* Relógio e Clima (Direita) */}
      <div className="absolute right-[30px] md:right-[38px] top-[64px] md:top-[68px] z-[43] pointer-events-none flex items-center">
        <div className="bg-zinc-900/60  border border-zinc-800/80 px-3 py-1.5 rounded-bl-xl text-zinc-300 font-medium text-[9px] md:text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-2.5 uppercase font-mono tracking-wider">
          <span>{dateStr}</span>
          <span className="opacity-30">|</span>
          <span className="text-emerald-400 font-bold">⏰ {timeStr}</span>
          <span className="opacity-30">|</span>
          <span className="text-indigo-300 font-bold">🌤️ 26°C</span>
        </div>
      </div>
    </>
  );
}

export default function App() {
  // Mounting Diagnostic logs & Telemetry
  useEffect(() => {
    console.log(
      "[App.tsx] Cury Constelação CRM App Component has successfully MOUNTED in viewport DOM.",
    );
    console.log("[App.tsx] Navigator User Agent:", navigator.userAgent);
    console.log("[App.tsx] System datetime:", new Date().toISOString());
    let loggedLeadsCount = 0;
    try {
      const savedLeads = localStorage.getItem("ciclocred_crm_leads");
      if (savedLeads) {
        loggedLeadsCount = JSON.parse(savedLeads).length || 0;
      }
    } catch (_) {}
    console.log(
      "[App.tsx] Local storage status - leads count:",
      loggedLeadsCount,
    );

    const handleGlobalError = (event: ErrorEvent) => {
      console.error(
        "[App.tsx] Silent/Unhandled runtime error intercepted:",
        event.message,
        "at",
        event.filename,
        ":",
        event.lineno,
      );
    };
    window.addEventListener("error", handleGlobalError);
    return () => {
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  console.log("[App.tsx] App rendering lifecycle tick.");

  // Universal Collapsible Side Drawer state
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Search and Filter visibility state (0 = Hidden, 1 = Search Only, 2 = Search + Filters)
  const [searchFiltersVisibility, setSearchFiltersVisibility] = useState<
    0 | 1 | 2
  >(1);
  const filterClickTimeoutRef = useRef<any>(null);

  // Global Hyperfocus state
  const [globalHyperfocus, setGlobalHyperfocus] = useState(false);
  const [layoutZoom, setLayoutZoom] = useState(100);
  const [selectedSmartDay, setSelectedSmartDay] = useState("2026-06-13");
  const [smartTaskTitle, setSmartTaskTitle] = useState("");
  const [smartLeadName, setSmartLeadName] = useState("");
  const [funnelAmbient, setFunnelAmbient] = useState(0); // 0 = Funnel CRM Columns, 1 = Calendário Inteligente Dashboard
  const [rightSideStep, setRightSideStep] = useState(0); // 0 = Follow-up Calendar, 1 = Próximos Passos
  const [leftSideStep, setLeftSideStep] = useState(0); // 0 = Todos os Leads (3 CRM Columns), 1 = Tabela de Disparos
  const [pesquisaGeralStep, setPesquisaGeralStep] = useState(0); // 0 = Todos os Leads & Resultados, 1 = Resultados & Calendário, 2 = Calendário & Próximos Passos
  const [localResultsMode, setLocalResultsMode] = useState<"busca" | "disparos">("busca");

  // Firebase Database Sync States
  const [isDbHydrated, setIsDbHydrated] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [forceLocalStorageMode, setForceLocalStorageMode] = useState<boolean>(
    () => {
      return localStorage.getItem("ciclocred_force_local_offline") === "true";
    },
  );
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => {
    const forced =
      localStorage.getItem("ciclocred_force_local_offline") === "true";
    if (forced) return false; // Force Local Mode ignores Firestore Quota warnings
    const quotaLogged =
      localStorage.getItem("firestore_quota_exceeded_status") === "true";
    return quotaLogged || !!(window as any).isFirestoreQuotaExceeded;
  });

  // Gracefully disable/enable Firestore server communication
  useEffect(() => {
    if (isQuotaExceeded || forceLocalStorageMode) {
      disableFirestoreNetwork();
    } else {
      enableFirestoreNetwork();
    }
  }, [isQuotaExceeded, forceLocalStorageMode]);

  // Handle global/custom firestore quota events
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };
    window.addEventListener("firestore-quota-exceeded", handleQuotaExceeded);
    const forced =
      localStorage.getItem("ciclocred_force_local_offline") === "true";
    const quotaLogged =
      localStorage.getItem("firestore_quota_exceeded_status") === "true";
    if (forced || quotaLogged || (window as any).isFirestoreQuotaExceeded) {
      setIsQuotaExceeded(true);
    }
    return () => {
      window.removeEventListener(
        "firestore-quota-exceeded",
        handleQuotaExceeded,
      );
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

  const isLocalLeadsChangeRef = useRef<boolean>(false);
  const isLocalTemplatesChangeRef = useRef<boolean>(false);
  const isLocalEmailLogsChangeRef = useRef<boolean>(false);
  const isLocalApptsChangeRef = useRef<boolean>(false);
  const isLocalInventoryChangeRef = useRef<boolean>(false);
  const isLocalPropertiesChangeRef = useRef<boolean>(false);
  const isLocalGoalsChangeRef = useRef<boolean>(false);
  const isLocalProjectsChangeRef = useRef<boolean>(false);
  const isLocalProfileChangeRef = useRef<boolean>(false);
  const isLocalNotesChangeRef = useRef<boolean>(false);
  const isLocalImportBatchesChangeRef = useRef<boolean>(false);

  // Core CRM States (Hydrated with LocalStorage or Seeded with defaults)
  const [leads, rawSetLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_leads");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });
  
  const leadsRef = useRef<Lead[]>(leads);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);


  const setLeads = React.useCallback((val: React.SetStateAction<Lead[]>) => {
    isLocalLeadsChangeRef.current = true;
    rawSetLeads(val);
  }, []);

  const isLocalActionLogsChangeRef = useRef<boolean>(false);
  const [actionLogs, rawSetActionLogs] = useState<LeadActionLog[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_action_logs");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const setActionLogs = React.useCallback((val: React.SetStateAction<LeadActionLog[]>) => {
    isLocalActionLogsChangeRef.current = true;
    rawSetActionLogs(val);
  }, []);

  useEffect(() => {
    localStorage.setItem("ciclocred_crm_action_logs", JSON.stringify(actionLogs));
  }, [actionLogs]);

  const [activeSystemFlowId, setActiveSystemFlowId] = useState<string>(() => {
    return localStorage.getItem("ciclocred_active_system_flow_id") || "flow-1";
  });

  useEffect(() => {
    localStorage.setItem("ciclocred_active_system_flow_id", activeSystemFlowId);
  }, [activeSystemFlowId]);

  const [operationalFlows, rawSetOperationalFlows] = useState<
    OperationalFlow[]
  >(() => {
    const saved = localStorage.getItem("ciclocred_crm_operational_flows");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [createDefaultFlow("flow-1", "Fluxo Padrão - Geral")];
  });

  const setOperationalFlows = React.useCallback(
    (val: React.SetStateAction<OperationalFlow[]>) => {
      rawSetOperationalFlows((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        localStorage.setItem(
          "ciclocred_crm_operational_flows",
          JSON.stringify(next),
        );
        return next;
      });
    },
    [],
  );

  const [templates, rawSetTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_templates");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const setTemplates = React.useCallback(
    (val: React.SetStateAction<EmailTemplate[]>) => {
      isLocalTemplatesChangeRef.current = true;
      rawSetTemplates(val);
    },
    [],
  );

  const [emailLogs, rawSetEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_logs");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const setEmailLogs = React.useCallback(
    (val: React.SetStateAction<EmailLog[]>) => {
      isLocalEmailLogsChangeRef.current = true;
      rawSetEmailLogs(val);
    },
    [],
  );

  // Helper to strictly sanitize appointment records for database schema compliance
  const sanitizeAppointmentRecord = (item: any): Appointment => {
    const todayStr = new Date().toISOString().slice(0, 10);

    let mappedType: "reuniao" | "telefone" | "proposta" | "outro" = "outro";
    const rawType = String(item.type || "").toLowerCase();
    if (rawType.includes("reuniao") || rawType.includes("reunião"))
      mappedType = "reuniao";
    else if (
      rawType.includes("telefone") ||
      rawType.includes("telefonema") ||
      rawType.includes("ligacao")
    )
      mappedType = "telefone";
    else if (rawType.includes("proposta")) mappedType = "proposta";

    let mappedStatus: "agendado" | "realizado" | "cancelado" = "agendado";
    const rawStatus = String(item.status || "").toLowerCase();
    if (rawStatus === "realizado" || rawStatus === "completo")
      mappedStatus = "realizado";
    else if (rawStatus === "cancelado") mappedStatus = "cancelado";

    const cleanId = String(
      item.id || `appt-${Math.random().toString(36).substr(2, 9)}`,
    ).substring(0, 99);
    const cleanLeadId = String(
      item.leadId || item.clientId || "lead-auto",
    ).substring(0, 99);
    const cleanLeadName = String(
      item.leadName || item.clientName || "Lead Desconhecido",
    ).substring(0, 149);
    const cleanTitle = String(item.title || "Compromisso Comercial").substring(
      0,
      199,
    );
    const cleanDate =
      item.date && String(item.date).length === 10
        ? String(item.date)
        : todayStr;
    const cleanTime =
      item.time && String(item.time).length === 5 ? String(item.time) : "09:00";
    const cleanDesc = String(item.description || item.notes || "").substring(
      0,
      4999,
    );

    const result: Appointment = {
      id: cleanId,
      leadId: cleanLeadId,
      leadName: cleanLeadName,
      title: cleanTitle,
      date: cleanDate,
      time: cleanTime,
      description: cleanDesc,
      status: mappedStatus,
      type: mappedType,
    };

    if (typeof item.reminderMinutes === "number" && item.reminderMinutes >= 0) {
      result.reminderMinutes = item.reminderMinutes;
    }
    if (typeof item.reminderSent === "boolean") {
      result.reminderSent = item.reminderSent;
    }

    return result;
  };

  // New States: Appointments and Inventory Stock
  const [appointments, rawSetAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_appointments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            const todayStr = new Date().toISOString().slice(0, 10);

            let mappedType: "reuniao" | "telefone" | "proposta" | "outro" =
              "outro";
            const rawType = String(item.type || "").toLowerCase();
            if (rawType.includes("reuniao") || rawType.includes("reunião"))
              mappedType = "reuniao";
            else if (
              rawType.includes("telefone") ||
              rawType.includes("telefonema") ||
              rawType.includes("ligacao")
            )
              mappedType = "telefone";
            else if (rawType.includes("proposta")) mappedType = "proposta";

            let mappedStatus: "agendado" | "realizado" | "cancelado" =
              "agendado";
            const rawStatus = String(item.status || "").toLowerCase();
            if (rawStatus === "realizado" || rawStatus === "completo")
              mappedStatus = "realizado";
            else if (rawStatus === "cancelado") mappedStatus = "cancelado";

            const cleanId = String(
              item.id || `appt-${Math.random().toString(36).substr(2, 9)}`,
            ).substring(0, 99);
            const cleanLeadId = String(
              item.leadId || item.clientId || "lead-auto",
            ).substring(0, 99);
            const cleanLeadName = String(
              item.leadName || item.clientName || "Lead Desconhecido",
            ).substring(0, 149);
            const cleanTitle = String(
              item.title || "Compromisso Comercial",
            ).substring(0, 199);
            const cleanDate =
              item.date && String(item.date).length === 10
                ? String(item.date)
                : todayStr;
            const cleanTime =
              item.time && String(item.time).length === 5
                ? String(item.time)
                : "09:00";
            const cleanDesc = String(
              item.description || item.notes || "",
            ).substring(0, 4999);

            const result: Appointment = {
              id: cleanId,
              leadId: cleanLeadId,
              leadName: cleanLeadName,
              title: cleanTitle,
              date: cleanDate,
              time: cleanTime,
              description: cleanDesc,
              status: mappedStatus,
              type: mappedType,
            };

            if (
              typeof item.reminderMinutes === "number" &&
              item.reminderMinutes >= 0
            ) {
              result.reminderMinutes = item.reminderMinutes;
            }
            if (typeof item.reminderSent === "boolean") {
              result.reminderSent = item.reminderSent;
            }

            return result;
          });
        }
      } catch (err) {
        console.error("Error loaded saved appointments:", err);
      }
    }

    return [];
  });

  const setAppointments = React.useCallback(
    (val: React.SetStateAction<Appointment[]>) => {
      isLocalApptsChangeRef.current = true;
      rawSetAppointments(val);
    },
    [],
  );

  const [inventory, rawSetInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_inventory");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}

    return [];
  });

  const setInventory = React.useCallback(
    (val: React.SetStateAction<InventoryItem[]>) => {
      isLocalInventoryChangeRef.current = true;
      rawSetInventory(val);
    },
    [],
  );

  const [properties, rawSetProperties] = useState<RealEstateProperty[]>(() => {
    const saved = localStorage.getItem("ciclocred_crm_properties");
    let raw = [];
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

  const setProperties = React.useCallback(
    (val: React.SetStateAction<RealEstateProperty[]>) => {
      isLocalPropertiesChangeRef.current = true;
      rawSetProperties(val);
    },
    [],
  );

  // Enriched Leads with Intelligence Engine metrics
  const enrichedLeads = useMemo(() => {
    return leads.map(lead => {
      // Find best property match for this lead
      let bestMatch: { score: number, reasoning: string, property: RealEstateProperty | null } = { score: 0, reasoning: '', property: null };
      
      properties.forEach(prop => {
        const result = calculateCompatibility(lead, prop);
        if (result.score > bestMatch.score) {
          bestMatch = { ...result, property: prop };
        }
      });

      const priority = calculatePriority({ ...lead, compatibilityScore: bestMatch.score });
      const nextBestAction = suggestNextAction(lead);
      const conversionProbability = calculateConversionProbability({ ...lead, compatibilityScore: bestMatch.score });

      return {
        ...lead,
        priority,
        compatibilityScore: bestMatch.score,
        compatibilityReasoning: bestMatch.reasoning,
        nextBestAction,
        conversionProbability,
        suggestedUnit: bestMatch.property?.title || lead.suggestedUnit
      };
    });
  }, [leads, properties]);

  const [activeTab, rawSetActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem("ciclocred_active_tab");
    if (saved === "painel-geral" || saved === "dashboard" || saved === "marketing") return "google-workspace";
    return saved || "google-workspace";
  });
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [leadsViewMode, setLeadsViewMode] = useState<
    "dashboard" | "simulador" | "todos" | "mapa" | "roteiros" | "recentes" | "ativos" | "archived" | "disparos" | "kanban" | "estoque" | "followups"
  >(() => {
    const saved = localStorage.getItem("ciclocred_filter_leads_view_mode");
    if (saved === "novos" || saved === "recentes") return "recentes";
    if (saved === "pesquisa_geral") return "todos";
    return (saved as any) || "todos";
  });

  const [leadsSearchMode, setLeadsSearchMode] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_leads_search_mode");
    const parsed = Number(saved);
    return saved !== null && !isNaN(parsed) ? parsed : 0;
  });
  const lastLeadsModeClickRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_leads_search_mode",
      String(leadsSearchMode),
    );
  }, [leadsSearchMode]);
  const [kanbanViewMode, setKanbanViewMode] = useState<
    "etapas" | "perfil" | "qualificacao" | "objecoes"
  >(() => {
    const saved = localStorage.getItem("ciclocred_filter_kanban_view_mode");
    return (saved && saved !== "status" ? saved : "etapas") as any;
  });
  const [followUpActiveSubTab, setFollowUpActiveSubTab] = useState<
    "follow-ups" | "agendamentos"
  >(() => {
    return (
      (localStorage.getItem("ciclocred_followup_sub_tab") as any) ||
      "follow-ups"
    );
  });
  const [marketingTargetLeadIds, setMarketingTargetLeadIds] = useState<
    string[]
  >([]);
  const [scriptsTargetLeadId, setScriptsTargetLeadId] = useState<string>("");
  const [scriptSearchTerm, setScriptSearchTerm] = useState<string>("");
  const [scriptsSubSection, setScriptsSubSection] = useState<
    "generator" | "library"
  >(() => {
    return (
      (localStorage.getItem("ciclocred_scripts_sub_section") as any) ||
      "generator"
    );
  });

  const activeTabRef = useRef(activeTab);
  const leadsViewModeRef = useRef(leadsViewMode);
  const kanbanViewModeRef = useRef(kanbanViewMode);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    leadsViewModeRef.current = leadsViewMode;
  }, [leadsViewMode]);

  useEffect(() => {
    kanbanViewModeRef.current = kanbanViewMode;
  }, [kanbanViewMode]);

  const setActiveTab = React.useCallback((tab: string) => {
    localStorage.setItem("ciclocred_active_tab", tab);
    rawSetActiveTab(tab);
  }, []);

  const handleOpenFollowUpForLead = React.useCallback(
    (lead: Lead) => {
      setScriptsTargetLeadId(lead.id);
      setFollowUpActiveSubTab("agendamentos");
    },
    [setActiveTab],
  );
  const [hoveredStatusSlice, setHoveredStatusSlice] = useState<string | null>(
    null,
  );

  const [ceoResponse, setCeoResponse] = useState<{
    query: string;
    message: string;
  } | null>(null);
  const [isCeoLoading, setIsCeoLoading] = useState(false);

  const handleAskCEOCopilot = async (query: string) => {
    setIsCeoLoading(true);
    setCeoResponse({ query, message: "" });
    try {
      const activeFlowId = localStorage.getItem("ciclocred_active_system_flow_id") || "flow-1";
      const savedFlows = localStorage.getItem("ciclocred_crm_operational_flows");
      let activeFlowStr = "Fluxo Geral Padrão (Etapas tradicionais)";
      if (activeFlowId && savedFlows) {
        try {
          const flows = JSON.parse(savedFlows);
          if (Array.isArray(flows)) {
            const activeFlow = flows.find((f: any) => f.id === activeFlowId);
            if (activeFlow) {
              activeFlowStr = `Fluxo de Trabalho Ativo: "${activeFlow.name}". Etapas: ${activeFlow.stages?.map((s: any) => s.name).join(' -> ')}`;
            }
          }
        } catch (_) {}
      }

      const stats = {
        totalLeads: leads.length,
        novo: leads.filter(l => l.status === 'novo').length,
        quente: leads.filter(l => l.status === 'quente').length,
        frio: leads.filter(l => l.status === 'frio').length,
        atendimento: leads.filter(l => l.status === 'atendimento' || l.stage?.toLowerCase().includes('atend')).length,
        visita: leads.filter(l => l.status === 'visita_agendada' || l.checklist?.visitou).length,
        proposta: leads.filter(l => l.status === 'proposta_enviada').length,
        vendido: leads.filter(l => l.status === 'vendido' || l.status === 'contrato_assinado').length,
        totalProperties: properties.length
      };

      const systemPrompt = `Você é o Diretor Estratégico AI (CEO Copilot) da cicloCRED, especialista em conversão de leads de alto padrão e habitação popular (Minha Casa Minha Vida e SBPE).
Sua missão é emitir diretrizes de tomada de decisão, diagnósticos e táticas de vendas baseando-se no cenário operacional atual.

[MÉTRICAS DO CRM HOJE]
- Total de Leads: ${stats.totalLeads}
- Novos: ${stats.novo}
- Quentes: ${stats.quente}
- Em Atendimento: ${stats.atendimento}
- Com Visita ou Visitou: ${stats.visita}
- Proposta Enviada: ${stats.proposta}
- Vendidos/Fechados: ${stats.vendido}
- Imóveis no Estoque: ${stats.totalProperties}
- ${activeFlowStr}

Diretrizes de Formatação:
- Responda de forma executiva, séria, perspicaz e com foco em conversão e faturamento.
- Use títulos Markdown com '###' para seções e listas com marcadores rápidos.
- Crie um plano de ação tático específico para responder à pergunta/demanda informada.`;

      const res = await fetch("/api/server/test-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: query,
          custom_prompt: systemPrompt,
          model_name: "gemini-3.5-flash",
          temperature: 0.7
        })
      });

      if (!res.ok) {
        throw new Error(`Erro status: ${res.status}`);
      }

      const data = await res.json();
      setCeoResponse({
        query,
        message: data.reply || "Não consegui formular as diretrizes no momento. Tente novamente."
      });
    } catch (err: any) {
      console.error("Erro no CEO Copilot:", err);
      setCeoResponse({
        query,
        message: `### ⚠️ Falha na Conectividade Estratégica\nNão foi possível obter resposta direta do Gemini para formular a diretriz estratégica: ${err.message || 'Erro de rede'}. Por favor, verifique se a sua chave de API do Gemini está configurada corretamente nas variáveis de ambiente.`
      });
    } finally {
      setIsCeoLoading(false);
    }
  };

  const [visibilityFilter, setVisibilityFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_visibility_filter") || "todos",
  );
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem("ciclocred_filter_search_term") || "",
  );
  const [todosSearchTerm, setTodosSearchTerm] = useState("");
  const [funnelSearchTerm, setFunnelSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_status_filter") || "todos",
  );
  const [qualificacaoFilter, setQualificacaoFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_qualificacao_filter") || "todos",
  );
  const [stageFilter, setStageFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_stage_filter") || "todos",
  );
  const [originFilter, setOriginFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_origin_filter") || "todos",
  );
  const [initialLetterFilter, setInitialLetterFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_initial_letter_filter") || "todos",
  );
  const [regionFilter, setRegionFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_region_filter") || "todos",
  );
  const [sqmMattersFilter, setSqmMattersFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_sqm_matters_filter") || "todos",
  );
  const [incomeTypeFilter, setIncomeTypeFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_income_type_filter") || "todos",
  );
  const [deadlineMattersFilter, setDeadlineMattersFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_deadline_matters_filter") ||
      "todos",
  );
  const [deliveryExpectedFilter, setDeliveryExpectedFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_delivery_expected_filter") ||
      "todos",
  );
  const [objectionsFilter, setObjectionsFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_objections_filter") || "todos",
  );
  const [genderFilter, setGenderFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_gender_filter") || "todos",
  );
  const [ageBracketFilter, setAgeBracketFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_age_bracket_filter") || "todos",
  );
  const [profileFilter, setProfileFilter] = useState(
    () => localStorage.getItem("ciclocred_filter_profile_filter") || "todos",
  );
  const [familyIncomeFilter, setFamilyIncomeFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_family_income_filter") || "todos",
  );
  const [restricaoBacenFilter, setRestricaoBacenFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_restricao_bacen_filter") ||
      "todos",
  );
  const [programaDesejadoFilter, setProgramaDesejadoFilter] = useState(
    () =>
      localStorage.getItem("ciclocred_filter_programa_desejado_filter") ||
      "todos",
  );

  useEffect(() => {
    (window as any).setActiveTab = (tab: string) => {
      setActiveTab(tab);
    };
    (window as any).setKanbanViewMode = (mode: string) => {
      setKanbanViewMode(mode as any);
    };
  }, [setActiveTab, setKanbanViewMode]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_filter_visibility_filter",
      visibilityFilter,
    );
    localStorage.setItem("ciclocred_filter_search_term", searchTerm);
    localStorage.setItem("ciclocred_filter_status_filter", statusFilter);
    localStorage.setItem(
      "ciclocred_filter_qualificacao_filter",
      qualificacaoFilter,
    );
    localStorage.setItem("ciclocred_filter_stage_filter", stageFilter);
    localStorage.setItem("ciclocred_filter_origin_filter", originFilter);
    localStorage.setItem(
      "ciclocred_filter_initial_letter_filter",
      initialLetterFilter,
    );
    localStorage.setItem("ciclocred_filter_region_filter", regionFilter);
    localStorage.setItem(
      "ciclocred_filter_sqm_matters_filter",
      sqmMattersFilter,
    );
    localStorage.setItem(
      "ciclocred_filter_income_type_filter",
      incomeTypeFilter,
    );
    localStorage.setItem(
      "ciclocred_filter_deadline_matters_filter",
      deadlineMattersFilter,
    );
    localStorage.setItem(
      "ciclocred_filter_delivery_expected_filter",
      deliveryExpectedFilter,
    );
    localStorage.setItem(
      "ciclocred_filter_objections_filter",
      objectionsFilter,
    );
    localStorage.setItem("ciclocred_filter_gender_filter", genderFilter);
    localStorage.setItem(
      "ciclocred_filter_age_bracket_filter",
      ageBracketFilter,
    );
    localStorage.setItem("ciclocred_filter_profile_filter", profileFilter);
    localStorage.setItem(
      "ciclocred_filter_family_income_filter",
      familyIncomeFilter,
    );
    localStorage.setItem(
      "ciclocred_filter_restricao_bacen_filter",
      restricaoBacenFilter,
    );
    localStorage.setItem(
      "ciclocred_filter_programa_desejado_filter",
      programaDesejadoFilter,
    );
    localStorage.setItem("ciclocred_filter_leads_view_mode", leadsViewMode);
    localStorage.setItem("ciclocred_filter_kanban_view_mode", kanbanViewMode);
    localStorage.setItem("ciclocred_followup_sub_tab", followUpActiveSubTab);
    localStorage.setItem("ciclocred_scripts_sub_section", scriptsSubSection);
  }, [
    visibilityFilter,
    searchTerm,
    statusFilter,
    qualificacaoFilter,
    stageFilter,
    originFilter,
    initialLetterFilter,
    regionFilter,
    sqmMattersFilter,
    incomeTypeFilter,
    deadlineMattersFilter,
    deliveryExpectedFilter,
    objectionsFilter,
    genderFilter,
    ageBracketFilter,
    profileFilter,
    familyIncomeFilter,
    restricaoBacenFilter,
    programaDesejadoFilter,
    leadsViewMode,
    kanbanViewMode,
    followUpActiveSubTab,
    scriptsSubSection,
  ]);

  const [isPlanilhasModalOpen, setIsPlanilhasModalOpen] = useState(false);
  const [isPremiumActionsOpen, setIsPremiumActionsOpen] = useState(false);
  const [isConversaoModalOpen, setIsConversaoModalOpen] = useState(false);
  const [isRuleEngineOpen, setIsRuleEngineOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [selectedLeadForAutomation, setSelectedLeadForAutomation] =
    useState<Lead | null>(null);
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<Lead | null>(null);

  const [dashboardVisibility, setDashboardVisibility] = useState<
    "disparos" | "scripts-roteiros" | "envios-realizados"
  >(
    () =>
      (localStorage.getItem("ciclocred_dashboard_visibility") as any) ||
      "disparos",
  );

  useEffect(() => {
    localStorage.setItem("ciclocred_dashboard_visibility", dashboardVisibility);
  }, [dashboardVisibility]);

  const TABS_ORDER = [
    "google-workspace",
    "leads",
    "settings",
  ];
  const TAB_NAMES: Record<string, string> = {
    "google-workspace": "Google Workspace",
    "leads": "Leads",
    settings: "Configurações",
  };

  const handleCycleTab = (e: React.MouseEvent) => {
    triggerSensoryFeedback("click", accSettings);
    setActiveTab((prev) => {
      const currentIndex = TABS_ORDER.indexOf(prev);
      let nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % TABS_ORDER.length;
      return TABS_ORDER[nextIndex];
    });
  };

  useEffect(() => {
    const handleNextPage = () => {
      setActiveTab((prev) => {
        const idx = TABS_ORDER.indexOf(prev);
        let nextIdx = (idx + 1) % TABS_ORDER.length;
        return TABS_ORDER[nextIdx];
      });
    };
    const handlePrevPage = () => {
      setActiveTab((prev) => {
        const idx = TABS_ORDER.indexOf(prev);
        let prevIdx = (idx - 1 + TABS_ORDER.length) % TABS_ORDER.length;
        return TABS_ORDER[prevIdx];
      });
    };

    const handleNextVisibility = () => {
      const currentTab = activeTabRef.current;
      if (currentTab === "leads") {
        setLeadsViewMode((prev) => {
          if (prev === "dashboard") return "simulador";
          if (prev === "simulador") return "todos";
          if (prev === "todos") return "mapa";
          if (prev === "mapa") return "roteiros";
          return "dashboard";
        });
      } else if (currentTab === "google-workspace") {
        // No-op or custom behavior
      }
    };

    const handlePrevVisibility = () => {
      const currentTab = activeTabRef.current;
      if (currentTab === "leads") {
        setLeadsViewMode((prev) => {
          if (prev === "dashboard") return "roteiros";
          if (prev === "roteiros") return "mapa";
          if (prev === "mapa") return "todos";
          if (prev === "todos") return "simulador";
          return "dashboard";
        });
      }
    };

    const handleMapToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.message) {
        addNotification(
          customEvent.detail.title || "🤖 MAPA CONECTIVO",
          customEvent.detail.message,
          customEvent.detail.type || "success"
        );
      }
    };

    window.addEventListener("ciclocred_cycle_tab_next", handleNextPage);
    window.addEventListener("ciclocred_cycle_tab_prev", handlePrevPage);
    window.addEventListener(
      "ciclocred_global_next_visibility",
      handleNextVisibility,
    );
    window.addEventListener(
      "ciclocred_global_prev_visibility",
      handlePrevVisibility,
    );
    window.addEventListener("ciclocred_map_toast", handleMapToast);

    return () => {
      window.removeEventListener("ciclocred_cycle_tab_next", handleNextPage);
      window.removeEventListener("ciclocred_cycle_tab_prev", handlePrevPage);
      window.removeEventListener(
        "ciclocred_global_next_visibility",
        handleNextVisibility,
      );
      window.removeEventListener(
        "ciclocred_global_prev_visibility",
        handlePrevVisibility,
      );
      window.removeEventListener("ciclocred_map_toast", handleMapToast);
    };
  }, []);

  const handleOpenRuleEngine = (lead: Lead | null) => {
    setSelectedLeadForAutomation(lead);
    setIsRuleEngineOpen(true);
  };

  const handleOpenAIAssistant = (lead: Lead | null) => {
    setSelectedLeadForAI(lead);
    setIsAIAssistantOpen(true);
  };

  const handleSaveAppletSettings = () => {
    alert("Saved!");
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importOrigin, setImportOrigin] = useState<
    "upload" | "copy" | "google_sheets"
  >("upload");
  const [importPipeline, setImportPipeline] = useState<string>("");
  const [importBatchTitle, setImportBatchTitle] = useState<string>("");
  const [operationalServiceOrders, rawSetOperationalServiceOrders] = useState<OperationalOS[]>(() => {
    const saved = localStorage.getItem("ciclocred_import_batches");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const setOperationalServiceOrders = React.useCallback(
    (val: React.SetStateAction<OperationalOS[]>) => {
      isLocalImportBatchesChangeRef.current = true;
      rawSetOperationalServiceOrders(val);
    },
    [],
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "xlsx" | "csv" | "pdf" | "json"
  >("xlsx");
  const [exportTarget, setExportTarget] = useState<
    "download" | "clipboard" | "email"
  >("download");

  const [kanbanShowOrganizer, setKanbanShowOrganizer] = useState(false);
  const [kanbanHyperfocus, setKanbanHyperfocus] = useState<number>(0);
  const [kanbanTriggerCreateStatus, setKanbanTriggerCreateStatus] =
    useState(false);
  const [kanbanTriggerCreatePage, setKanbanTriggerCreatePage] = useState(false);
  const [kanbanTriggerEditPage, setKanbanTriggerEditPage] = useState(false);
  const [kanbanTriggerDeletePage, setKanbanTriggerDeletePage] = useState(false);
  const [kanbanTriggerHyperfocus, setKanbanTriggerHyperfocus] = useState(false);

  const [isMaisTabsOpen, setIsMaisTabsOpen] = useState(false);
  const [showPageNamePill, setShowPageNamePill] = useState(true);

  // Quick Notes States
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  
  const [appBackgrounds, setAppBackgrounds] = useState<AppBackgrounds>(() => {
    const saved = localStorage.getItem("ciclocred_app_backgrounds_v2");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      }
    } catch (_) {}
    
    // Premium fallback default carousels
    const defaultImages = [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200"
    ];
    const defaultConfigs: AppBackgrounds = {};
    const tabs = ['leads', 'google-workspace', 'settings', 'dashboard', 'database', 'gemini-server'];
    tabs.forEach(tab => {
      defaultConfigs[tab] = {
        images: defaultImages,
        interval: 8000
      };
    });
    return defaultConfigs;
  });

  const [bgIndices, setBgIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    localStorage.setItem("ciclocred_app_backgrounds_v2", JSON.stringify(appBackgrounds));
  }, [appBackgrounds]);

  // Carousel Timer Effect
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    (Object.entries(appBackgrounds) as [string, BackgroundConfig][]).forEach(([tab, config]) => {
      if (config.images.length > 1 && config.interval > 0) {
        const timer = setInterval(() => {
          setBgIndices(prev => ({
            ...prev,
            [tab]: ((prev[tab] || 0) + 1) % config.images.length
          }));
        }, config.interval);
        timers.push(timer);
      }
    });

    return () => timers.forEach(clearInterval);
  }, [appBackgrounds]);
  const [quickNotes, rawSetQuickNotes] = useState<QuickNote[]>(() => {
    const saved = localStorage.getItem("ciclocred_quick_notes");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const setQuickNotes = React.useCallback(
    (val: React.SetStateAction<QuickNote[]>) => {
      isLocalNotesChangeRef.current = true;
      rawSetQuickNotes(val);
    },
    [],
  );
  const [isScheduleFollowUpModalOpen, setIsScheduleFollowUpModalOpen] = useState(false);
  const [isOSDetailsModalOpen, setIsOSDetailsModalOpen] = useState(false);
  const [selectedOSForDetails, setSelectedOSForDetails] = useState<OperationalOS | null>(null);
  const [scheduleFollowUpInitialLead, setScheduleFollowUpInitialLead] = useState<Lead | null>(null);
  const [scheduleFollowUpInitialData, setScheduleFollowUpInitialData] = useState<Partial<Appointment> | null>(null);

  useEffect(() => {
    if (isLocalNotesChangeRef.current && auth.currentUser && !forceLocalStorageMode) {
      const sync = async () => {
        try {
          const batch = writeBatch(db);
          // Get all existing notes first to know what to delete
          const notesSnap = await getDocs(collection(db, "quickNotes"));
          notesSnap.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          // Add current notes
          quickNotes.forEach((note) => {
            const noteRef = doc(collection(db, "quickNotes"), note.id);
            batch.set(noteRef, note);
          });
          await batch.commit();
          isLocalNotesChangeRef.current = false;
        } catch (err) {
          console.warn("CRM: Syncing notes to Firestore failed:", err);
        }
      };
      sync();
    }
    localStorage.setItem("ciclocred_quick_notes", JSON.stringify(quickNotes));
  }, [quickNotes]);

  useEffect(() => {
    if (isLocalImportBatchesChangeRef.current && auth.currentUser && !forceLocalStorageMode) {
      const sync = async () => {
        try {
          const batch = writeBatch(db);
          const snap = await getDocs(collection(db, "importBatches"));
          snap.forEach((docSnap) => batch.delete(docSnap.ref));
          operationalServiceOrders.forEach((b) => {
            const ref = doc(collection(db, "importBatches"), b.id);
            batch.set(ref, b);
          });
          await batch.commit();
          isLocalImportBatchesChangeRef.current = false;
        } catch (err) {
          console.warn("CRM: Syncing importBatches failed:", err);
        }
      };
      sync();
    }
    localStorage.setItem("ciclocred_import_batches", JSON.stringify(operationalServiceOrders));
  }, [operationalServiceOrders]);

  const handleAddQuickNote = (note: QuickNote) => {
    setQuickNotes(prev => [note, ...prev]);
    addNotification("Nota Salva", `A nota "${note.title}" foi salva com sucesso.`, "success");
  };

  const handleDeleteQuickNote = (id: string) => {
    setQuickNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateQuickNote = (note: QuickNote) => {
    setQuickNotes(prev => prev.map(n => n.id === note.id ? note : n));
  };

  const cycleKanbanViewMode = React.useCallback(() => {
    setKanbanViewMode((prev) => {
      if (prev === "etapas") return "perfil";
      if (prev === "perfil") return "qualificacao";
      if (prev === "qualificacao") return "objecoes";
      return "etapas";
    });
  }, []);

  const cycleVisibilityFilter = React.useCallback(() => {
    setVisibilityFilter((prev) => {
      if (prev === "todos") return "my_leads";
      if (prev === "my_leads") return "high_priority";
      return "todos";
    });
  }, []);

  const cycleFollowUpViewMode = React.useCallback(() => {
    setFollowUpActiveSubTab((prev) =>
      "follow-ups",
    );
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard") {
      setTimeout(() => {
        window.location.href = "whatsapp://send";
      }, 50);
    }
  }, [activeTab]);

  const cycleLeadsViewMode = React.useCallback(() => {
    setLeadsViewMode((prev) => {
      let nextMode: "todos" | "recentes" | "ativos" | "archived" | "disparos" | "kanban" | "mapa" | "roteiros" | "estoque" = "todos";
      if (prev === "todos") nextMode = "recentes";
      else if (prev === "recentes") nextMode = "ativos";
      else if (prev === "ativos") nextMode = "kanban";
      else if (prev === "kanban") nextMode = "mapa";
      else if (prev === "mapa") nextMode = "disparos";
      else if (prev === "disparos") nextMode = "roteiros";
      else if (prev === "roteiros") nextMode = "estoque";
      else if (prev === "estoque") nextMode = "archived";
      else nextMode = "todos";

      localStorage.setItem("ciclocred_filter_leads_view_mode", nextMode);
      return nextMode;
    });
  }, []);

  useEffect(() => {
    let shiftPressCount = 0;
    let shiftPressTimer: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName,
        ) ||
          document.activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.key === " " || e.key === "Spacebar" || e.code === "Space") {
        e.preventDefault();
        setActiveTab("leads");
        return;
      }

      if (e.key === "Alt") {
        e.preventDefault();
        setActiveTab("leads");
        return;
      }

      if (e.key === "Shift") {
        // O botão shift não pode trocar as visibilidade da página de disparos.
        const currentTab = activeTabRef.current;
        if (
          ["disparos", "scripts-roteiros", "envios-realizados"].includes(
            currentTab,
          )
        ) {
          return;
        }
        shiftPressCount++;
        if (shiftPressTimer) clearTimeout(shiftPressTimer);
        shiftPressTimer = setTimeout(() => {
          if (shiftPressCount === 1) {
            window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_next"));
          } else if (shiftPressCount >= 2) {
            window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_prev"));
          }
          shiftPressCount = 0;
        }, 220);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const main = document.querySelector("main");
        if (main) main.scrollBy({ top: -200, behavior: "instant" });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const main = document.querySelector("main");
        if (main) main.scrollBy({ top: 200, behavior: "instant" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unifiedFilteredLeads = useMemo(() => {
    return enrichedLeads.filter((lead) => {
      const matchesSearch =
        String(lead.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.email || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.phone || "").includes(searchTerm) ||
        String(lead.company || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.gender || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.region || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.stage || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.status || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.objection || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.mainProfile || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(lead.programaDesejado || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Omit archived ('perdido', 'arquivado') status leads during standard active tables unless searching
      if (
        !searchTerm &&
        (leadsViewMode === "recentes" || leadsViewMode === "ativos")
      ) {
        if (lead.status === "perdido" || lead.status === "arquivado")
          return false;
      }

      const matchesStatus =
        statusFilter === "todos" || lead.status === statusFilter;
      const matchesStage =
        stageFilter === "todos" ||
        lead.stage === stageFilter ||
        (getKanbanColumns("etapas").find((col) => col.id === stageFilter)?.label === lead.stage);
      const leadQualif = (() => {
        if (lead.funnelPlacements && lead.funnelPlacements.length > 0) {
          const placement = lead.funnelPlacements.find(
            (p: any) => p.pageId === "qualificacao",
          );
          if (placement) return placement.status;
        }
        if (lead.restricacaoBacen === "Sim" || lead.restricaoBacen === "Sim")
          return "nao_qualificado";
        if (lead.programaDesejado === "Minha Casa Minha Vida")
          return "qualificado_mcmv";
        if (lead.programaDesejado === "SBPE") return "qualificado_sbpe";
        return "em_qualificacao";
      })();
      const matchesQualificacao =
        qualificacaoFilter === "todos" || leadQualif === qualificacaoFilter;
      const matchesOrigin =
        originFilter === "todos" || lead.origin === originFilter;
      const matchesInitial =
        initialLetterFilter === "todos" ||
        String(lead.name || "")
          .trim()
          .charAt(0)
          .toUpperCase() === initialLetterFilter.toUpperCase();

      const matchesRegion =
        regionFilter === "todos" || lead.region === regionFilter;
      const matchesSqm =
        sqmMattersFilter === "todos" || lead.sqmMatters === sqmMattersFilter;
      const matchesIncome =
        incomeTypeFilter === "todos" || lead.incomeType === incomeTypeFilter;
      const matchesDeadline =
        deadlineMattersFilter === "todos" ||
        lead.deadlineMatters === deadlineMattersFilter;
      const matchesDelivery =
        deliveryExpectedFilter === "todos" ||
        lead.deliveryExpected === deliveryExpectedFilter;
      const matchesGender =
        genderFilter === "todos" ||
        lead.gender === genderFilter ||
        (genderFilter.toLowerCase().startsWith("m") && lead.gender === "Homem") ||
        (genderFilter.toLowerCase().startsWith("f") && lead.gender === "Mulher") ||
        (genderFilter === "Homem" && lead.gender === "Homem") ||
        (genderFilter === "Mulher" && lead.gender === "Mulher");
      const matchesAge =
        ageBracketFilter === "todos" || lead.ageBracket === ageBracketFilter;

      const matchesObjections =
        objectionsFilter === "todos" ||
        lead.objection === objectionsFilter ||
        (lead.objections && lead.objections.includes(objectionsFilter)) ||
        (getKanbanColumns("objecoes").find((col) => col.id === objectionsFilter)?.label === lead.objection) ||
        (objectionsFilter === "-" &&
          (!lead.objections || lead.objections.length === 0));

      const matchesProfiles =
        profileFilter === "todos" ||
        lead.mainProfile === profileFilter ||
        (lead.profiles && lead.profiles.includes(profileFilter)) ||
        (getKanbanColumns("perfil").find((col) => col.id === profileFilter)?.label === lead.mainProfile);

      // Credito sensitive filters
      let matchesFamilyIncome = true;
      if (familyIncomeFilter !== "todos") {
        const income = lead.familyIncome || 0;
        if (familyIncomeFilter === "Faixa 1" || familyIncomeFilter === "baixa") {
          matchesFamilyIncome = income <= 2640 || income < 4000;
        } else if (familyIncomeFilter === "Faixa 2" || familyIncomeFilter === "media") {
          matchesFamilyIncome = (income > 2640 && income <= 4400) || (income >= 4000 && income <= 8000);
        } else if (familyIncomeFilter === "Faixa 3") {
          matchesFamilyIncome = income > 4400 && income <= 8000;
        } else if (familyIncomeFilter === "Acima do Teto" || familyIncomeFilter === "alta") {
          matchesFamilyIncome = income > 8000;
        }
      }

      const matchesRestricaoBacen =
        restricaoBacenFilter === "todos" ||
        (restricaoBacenFilter === "Sim" && lead.restricaoBacen === "Sim") ||
        (restricaoBacenFilter === "Não" && (lead.restricaoBacen === "Não" || !lead.restricaoBacen)) ||
        (restricaoBacenFilter === "sim" && lead.restricaoBacen === "Sim") ||
        (restricaoBacenFilter === "nao" && (lead.restricaoBacen === "Não" || !lead.restricaoBacen));

      const matchesProgramaDesejado =
        programaDesejadoFilter === "todos" ||
        lead.programaDesejado === programaDesejadoFilter;

      let matchesVisibility = true;
      if (visibilityFilter === "my_leads") {
        matchesVisibility = true; // Assume all leads are "mine" for this demo
      } else if (visibilityFilter === "by_stage") {
        matchesVisibility = !!lead.stage && lead.stage !== "";
      } else if (visibilityFilter === "high_priority") {
        matchesVisibility =
          (lead.profiles || []).some(
            (p) =>
              p.toLowerCase().includes("quente") ||
              p.toLowerCase().includes("alta"),
          ) || lead.value > 200000;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStage &&
        matchesOrigin &&
        matchesInitial &&
        matchesRegion &&
        matchesSqm &&
        matchesIncome &&
        matchesDeadline &&
        matchesDelivery &&
        matchesGender &&
        matchesAge &&
        matchesObjections &&
        matchesProfiles &&
        matchesFamilyIncome &&
        matchesRestricaoBacen &&
        matchesProgramaDesejado &&
        matchesQualificacao &&
        matchesVisibility
      );
    });
  }, [
    leads,
    searchTerm,
    statusFilter,
    stageFilter,
    qualificacaoFilter,
    originFilter,
    initialLetterFilter,
    leadsViewMode,
    regionFilter,
    sqmMattersFilter,
    incomeTypeFilter,
    deadlineMattersFilter,
    deliveryExpectedFilter,
    objectionsFilter,
    genderFilter,
    ageBracketFilter,
    profileFilter,
    familyIncomeFilter,
    restricaoBacenFilter,
    programaDesejadoFilter,
    visibilityFilter,
  ]);

  const funnelFilteredLeads = useMemo(() => {
    if (!funnelSearchTerm.trim()) return leads;
    const term = funnelSearchTerm.toLowerCase().trim();
    return leads.filter((lead) => {
      return (
        String(lead.name || "")
          .toLowerCase()
          .includes(term) ||
        String(lead.email || "")
          .toLowerCase()
          .includes(term) ||
        String(lead.phone || "").includes(term) ||
        String(lead.region || "")
          .toLowerCase()
          .includes(term) ||
        String(lead.mainProfile || "")
          .toLowerCase()
          .includes(term) ||
        String(lead.company || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [leads, funnelSearchTerm]);

  const dynamicStatuses = useMemo(() => {
    // Extract both current stored columns and any other column currently assigned to leads
    const colIds = new Set(getKanbanColumns().map((c) => c.id));
    leads.forEach((l) => {
      if (l.status) colIds.add(l.status);
      if (l.funnelPlacements) {
        l.funnelPlacements.forEach((p) => colIds.add(p.status));
      }
    });

    const getLabel = (id: string) => {
      const col = getKanbanColumns().find((c) => c.id === id);
      if (col) return col.label;
      const defaults: Record<string, string> = {
        novo: "Novos Leads",
        em_contato: "Em Contato",
        proposta: "Proposta",
        fechado: "Fechados",
        perdido: "Perdidos",
        qualificacao: "Qualificação",
        objecoes: "Objeções",
        abordagem_inicial: "Abordagem Inicial",
        triagem: "Triagem",
        analise_perfil: "Análise de Perfil",
        apresentacao_solucao: "Apresentação de Solução",
        visita_reuniao: "Visita / Reunião",
        escolha_unidade: "Escolha de Unidade",
        simulacao_final: "Simulação Final",
        fechamento: "Fechamento",
        followup_1: "Follow-Up 1",
        followup_2: "Follow-Up 2",
        followup_3: "Follow-Up 3",
        resgate: "Resgate",
        reciclagem: "Reciclagem",
      };
      return defaults[id] || id.replace(/_/g, " ").toUpperCase();
    };

    return Array.from(colIds).map((id) => ({ id, label: getLabel(id) }));
  }, [leads]);

  // USER AUTHENTICATION & ACCESSIBILITY SENSORY STATES
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("ciclocred_auth_active") === "true";
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("ciclocred_user_name") || "Operador Cury Constelação";
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return (
      localStorage.getItem("ciclocred_user_email") || "vendas@curyconstelacao.com.br"
    );
  });

  const [theme, setTheme] = useState<"claro" | "escuro" | "galatico">(() => {
    return (localStorage.getItem("ciclocred_theme") as any) || "escuro";
  });

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const [palette, setPalette] = useState<"vender" | "bege" | "azul" | "lilas">(
    () => {
      return (localStorage.getItem("ciclocred_palette") as any) || "vender";
    },
  );

  const [galaxyPreset, setGalaxyPreset] = useState<string>(() => {
    return localStorage.getItem("ciclocred_galaxy_preset") || "lineack";
  });

  const [accSettings, setAccSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("ciclocred_sensory_config");
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

  // Reactive strategy calibration listener for activeSystemFlowId changes
  const lastActiveFlowIdRef = useRef<string>(activeSystemFlowId);
  useEffect(() => {
    if (!isDbHydrated) return;
    if (lastActiveFlowIdRef.current === activeSystemFlowId) return;
    lastActiveFlowIdRef.current = activeSystemFlowId;

    const flow = operationalFlows.find((f) => f.id === activeSystemFlowId);
    if (flow) {
      triggerSensoryFeedback("chime", accSettings);
      addNotification(
        "⚡ Estratégia de Fluxo Ativada",
        `O CRM, Workspace, Mapas e Ordens de Serviço foram recalibrados para a lógica do fluxo '${flow.name}'.`,
        "success"
      );
      
      // Open a high-fidelity interactive system alert banner
      setActiveAlarm({
        id: `flow-recalibrate-${Date.now()}`,
        title: `Estratégia '${flow.name}' Ativada ⚡`,
        leadName: "Sistema cicloCRED",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        description: `O Motor Cognitivo de automações, prazos temporais, scripts de abordagem e tabelas financeiras foram reconfigurados de acordo com esta nova diretriz de crédito.`
      });
    }
  }, [activeSystemFlowId, isDbHydrated, operationalFlows, accSettings]);

  // upgrade to full Cognitive Automation and Responsive Engine
  useEffect(() => {
    if (!isDbHydrated || operationalFlows.length === 0) return;

    const runCognitiveAutomation = () => {
      const now = Date.now();

      setLeads((prevLeads) => {
        let changed = false;
        
        const updatedLeads = prevLeads.map((l) => {
          // 1. skip archived/lost/perdi leads for general calculations
          if (
            l.status === "arquivado" ||
            l.status === "perdido" ||
            l.status === "perdi"
          ) {
            return l;
          }

          let updatedLead = { ...l };
          let leadChanged = false;

          const activeFlow =
            operationalFlows.find((f) => f.id === (updatedLead.fluxoId || activeSystemFlowId)) ||
            operationalFlows.find((f) => f.id === activeSystemFlowId) ||
            operationalFlows[0];

          // 2. AUTO-CALCULATE FINANCIAL ENQUADRAMENTO (CREDIT QUALIFICATION)
          const income = Number(updatedLead.familyGrossIncome || updatedLead.familyIncome || 0);
          if (income > 0 && (!updatedLead.financedValue || !updatedLead.installmentValue || !updatedLead.program)) {
            const isMCMV = income <= 8000;
            const calculatedProgram = isMCMV ? "Minha Casa Minha Vida (MCMV)" : "SBPE (Poupança/FGTS)";
            
            // MCMV subsidy estimation (mcmvDiscount)
            let subsidy = 0;
            if (isMCMV) {
              if (income <= 2000) subsidy = 55000;
              else if (income <= 3000) subsidy = 35000;
              else if (income <= 4000) subsidy = 20000;
              else if (income <= 8000) subsidy = 5000;
            }

            const financedLimit = Math.round(isMCMV ? income * 90 : income * 110);
            const installment = Math.round(income * 0.3);
            const searchBudget = Number(updatedLead.value || 250000);
            const downpaymentNeeded = Math.max(0, searchBudget - financedLimit - subsidy);

            updatedLead.program = calculatedProgram;
            updatedLead.mcmvDiscount = subsidy;
            updatedLead.financedValue = financedLimit;
            updatedLead.installmentValue = installment;
            updatedLead.downPaymentValue = downpaymentNeeded;
            updatedLead.approvedStatus = updatedLead.approvedStatus || "Qualificado pelo Motor ⚡";
            leadChanged = true;
            changed = true;

            addNotification(
              `Calibragem Financeira: ${updatedLead.name} 📊`,
              `Motor calculou capacidade de crédito: Financiamento de R$ ${financedLimit.toLocaleString("pt-BR")} e Entrada de R$ ${downpaymentNeeded.toLocaleString("pt-BR")}.`,
              "ai"
            );
          }

          // 3. AUTO-MATCH REAL ESTATE INVENTORY (STOCK COMPATIBILITY)
          if (properties && properties.length > 0 && !updatedLead.propertyInterest && updatedLead.value) {
            const maxBudget = Number(updatedLead.value);
            const leadBedrooms = Number(updatedLead.bedrooms || 0);
            
            const bestMatches = properties.map(p => {
              let score = 100;
              if (p.price > maxBudget) {
                const excess = (p.price - maxBudget) / maxBudget;
                score -= Math.min(60, excess * 100);
              }
              if (leadBedrooms > 0 && p.bedrooms < leadBedrooms) {
                score -= (leadBedrooms - p.bedrooms) * 20;
              }
              if (updatedLead.region && p.zone && updatedLead.region.toLowerCase() !== p.zone.toLowerCase()) {
                score -= 15;
              }
              return { property: p, score: Math.max(0, Math.round(score)) };
            }).filter(m => m.score >= 80)
              .sort((a, b) => b.score - a.score);

            if (bestMatches.length > 0) {
              const best = bestMatches[0];
              updatedLead.propertyInterest = best.property.title;
              updatedLead.nextSteps = updatedLead.nextSteps 
                ? `${updatedLead.nextSteps} | Apresentar unidade compatível ${best.property.title} (${best.score}% compatibilidade)` 
                : `Apresentar unidade compatível ${best.property.title} (${best.score}% compatibilidade)`;
              leadChanged = true;
              changed = true;

              addNotification(
                `Unidade Compatível: ${updatedLead.name} 🏠`,
                `O imóvel '${best.property.title}' possui enquadramento de ${best.score}% com as preferências deste cliente.`,
                "success"
              );
            }
          }

          // 4. CHECK STATUS TIMEOUT (ARCHIVER / INACTIVITY)
          let timeoutMs = 48 * 60 * 60 * 1000; // default 48h
          if (activeFlow && activeFlow.statusTimers) {
            if (updatedLead.status === "novo" && activeFlow.statusTimers.recentes) {
              timeoutMs =
                activeFlow.statusTimers.recentes.hours * 60 * 60 * 1000 +
                activeFlow.statusTimers.recentes.minutes * 60 * 1000;
            } else if (activeFlow.statusTimers.ativos) {
              timeoutMs =
                activeFlow.statusTimers.ativos.hours * 60 * 60 * 1000 +
                activeFlow.statusTimers.ativos.minutes * 60 * 1000;
            }
          }

          const lastTime = updatedLead.lastInteractionAt
            ? new Date(updatedLead.lastInteractionAt).getTime()
            : updatedLead.createdAt
              ? new Date(updatedLead.createdAt).getTime()
              : now;
          const elapsed = now - lastTime;

          if (elapsed > timeoutMs) {
            changed = true;
            return {
              ...updatedLead,
              status: "arquivado" as any,
              lastInteractionAt: new Date().toISOString(),
              lostReason: `Inatividade > ${Math.floor(timeoutMs / (1000 * 60 * 60))} horas (Automático)`,
            };
          }

          // 5. RESPONSIVE FLOW STAGE TIMER (STAGE TIMELINE ALARMS)
          // Find if lead has stage limit in the active flow
          const currentStageId = updatedLead.osStageId || updatedLead.stage;
          if (currentStageId && activeFlow && activeFlow.stages) {
            const currentStage = activeFlow.stages.find(s => s.id === currentStageId);
            if (currentStage && currentStage.timer) {
              const { days = 0, hours = 0, minutes = 0 } = currentStage.timer;
              const stageTimeoutMs = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
              
              if (stageTimeoutMs > 0) {
                // If elapsed time is greater than 100% of stage timer
                if (elapsed > stageTimeoutMs) {
                  // Check if we already tagged this as expired
                  if (!updatedLead.nextSteps?.includes("🛑 ALERTA TEMPORAL EXPIRADO")) {
                    updatedLead.nextSteps = updatedLead.nextSteps 
                      ? `🛑 ALERTA TEMPORAL EXPIRADO: Prazo da etapa ${currentStage.name} estourou! | ${updatedLead.nextSteps}` 
                      : `🛑 ALERTA TEMPORAL EXPIRADO: Prazo da etapa ${currentStage.name} estourou!`;
                    leadChanged = true;
                    changed = true;

                    triggerSensoryFeedback("chime", accSettings);
                    addNotification(
                      `🛑 Prazo Estourado: ${updatedLead.name}`,
                      `O limite de tempo (${days}d ${hours}h) da etapa '${currentStage.name}' estourou. Fale com o cliente imediatamente.`,
                      "alarm"
                    );

                    setActiveAlarm({
                      id: `stage-expired-${updatedLead.id}`,
                      title: `PRAZO ESTOURADO: ${updatedLead.name} 🛑`,
                      leadName: updatedLead.name,
                      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                      description: `O lead ultrapassou o tempo limite de ${days} dias na etapa '${currentStage.name}' do fluxo comercial ativo.`
                    });
                  }
                } 
                // If elapsed time is greater than 80% of stage timer
                else if (elapsed > stageTimeoutMs * 0.8) {
                  if (!updatedLead.nextSteps?.includes("⚠️ PRAZO PRÓXIMO")) {
                    updatedLead.nextSteps = updatedLead.nextSteps 
                      ? `⚠️ PRAZO PRÓXIMO: Enviar script de reengajamento | ${updatedLead.nextSteps}` 
                      : `⚠️ PRAZO PRÓXIMO: Enviar script de reengajamento`;
                    leadChanged = true;
                    changed = true;

                    addNotification(
                      `⚠️ Prazo Próximo do Fim: ${updatedLead.name}`,
                      `O lead está prestes a estourar o limite de tempo na etapa '${currentStage.name}'.`,
                      "warning"
                    );
                  }
                }
              }
            }
          }

          return leadChanged ? updatedLead : l;
        });

        return changed ? updatedLeads : prevLeads;
      });
    };

    // run immediately on start/flow-change
    runCognitiveAutomation();

    // check every 30 seconds for real-time reactivity
    const interval = setInterval(runCognitiveAutomation, 30000); 
    return () => clearInterval(interval);
  }, [isDbHydrated, setLeads, operationalFlows, activeSystemFlowId, properties, accSettings]);

  // CUSTOM STYLED CONFIRMATION DIALOG STATE
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
    type?: "danger" | "warning";
  } | null>(null);

  const requestConfirmation = (
    title: string,
    desc: string,
    onConfirm: () => void,
    type: "danger" | "warning" = "warning",
  ) => {
    triggerSensoryFeedback("chime", accSettings);
    setConfirmModal({
      isOpen: true,
      title,
      description: desc,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      type,
    });
  };

  const [isAutonomyActive, setIsAutonomyActive] = useState<boolean>(() => {
    return false; // Desativado para priorizar 100% de dados reais e prevenir simulações fictícias em background
  });

  const [autonomyIntervalSec, setAutonomyIntervalSec] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_autonomy_interval");
    const parsed = Number(saved);
    return saved && !isNaN(parsed) ? parsed : 45;
  });

  // CONNECTED GAMIFICATION STATES (Evolves from zero/zerado!)
  const [userXP, setUserXP] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_user_xp");
    const parsed = Number(saved);
    return saved && !isNaN(parsed) ? parsed : 0; // Starts fresh at 0 XP
  });

  const [userLevel, setUserLevel] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_user_level");
    const parsed = Number(saved);
    return saved && !isNaN(parsed) ? parsed : 1; // Starts fresh at Nível 1
  });

  // Profile preferences & digital sharing states
  const [showProfilePrefsModal, setShowProfilePrefsModal] =
    useState<boolean>(false);
  const [creciNumber, setCreciNumber] = useState<string>(() => {
    return localStorage.getItem("ciclocred_creci_number") || "CRECI 12345-F";
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return (
      localStorage.getItem("ciclocred_user_role") ||
      "Corretor de Crédito Sênior"
    );
  });
  const [agencyName, setAgencyName] = useState<string>(() => {
    return (
      localStorage.getItem("ciclocred_agency_name") ||
      "Cury Constelação - Vendas de Apartamentos na Planta"
    );
  });
  const [consolidatedCrmInfo, setConsolidatedCrmInfo] = useState<string>(() => {
    return (
      localStorage.getItem("ciclocred_consolidated_crm_info") ||
      "Operando com performance máxima. Metas comerciais e lançamentos Cury integrados na constelação de vendas."
    );
  });
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>(() => {
    return localStorage.getItem("ciclocred_subscription_plan") || "Premium VIP";
  });

  // Leads da sorte state variables
  const [isSpinningSorte, setIsSpinningSorte] = useState<boolean>(false);
  const [luckyLead, setLuckyLead] = useState<Lead | null>(null);
  const [luckyLeadCelebration, setLuckyLeadCelebration] =
    useState<boolean>(false);
  const [currentSpinningName, setCurrentSpinningName] = useState<string>("");

  const drawLuckyLead = () => {
    if (leads.length === 0) return;
    triggerSensoryFeedback("click", accSettings);
    setIsSpinningSorte(true);
    setLuckyLeadCelebration(false);
    setLuckyLead(null);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * leads.length);
      setCurrentSpinningName(leads[randomIndex].name);
      counter++;

      if (counter % 2 === 0) {
        triggerSensoryFeedback("click", accSettings);
      }

      if (counter > 15) {
        clearInterval(interval);
        const finalLead = leads[Math.floor(Math.random() * leads.length)];
        setLuckyLead(finalLead);
        setIsSpinningSorte(false);
        setLuckyLeadCelebration(true);
        triggerSensoryFeedback("success", accSettings);
        awardXP(150); // reward the user for doing lucky lead drawer
        addNotification(
          "🎰 LEAD DA SORTE SORTEADO",
          `O lead "${finalLead.name}" foi selecionado! Entre em contato imediato para bônus de conversão.`,
          "success",
        );
      }
    }, 120);
  };

  const [gamificationGoals, rawSetGamificationGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("ciclocred_gamification_goals");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: "goal-1",
        title: "Carregar 5 Novos Leads na Carteira",
        targetCount: 5,
        currentCount: 0,
        xpReward: 350,
        frequency: "diaria",
        category: "prospecção",
        completed: false,
      },
      {
        id: "goal-2",
        title: "Agendar 3 Visitas Imobiliárias",
        targetCount: 3,
        currentCount: 0,
        xpReward: 500,
        frequency: "semanal",
        category: "visita",
        completed: false,
      },
      {
        id: "goal-3",
        title: "Disparar 10 Modelos de Email Automatizados",
        targetCount: 10,
        currentCount: 0,
        xpReward: 250,
        frequency: "diaria",
        category: "email",
        completed: false,
      },
      {
        id: "goal-4",
        title: "Fechar Proposta Comercial de Crédito",
        targetCount: 1,
        currentCount: 0,
        xpReward: 1200,
        frequency: "mensal",
        category: "venda",
        completed: false,
      },
    ];
  });

  const setGamificationGoals = React.useCallback(
    (val: React.SetStateAction<Goal[]>) => {
      isLocalGoalsChangeRef.current = true;
      rawSetGamificationGoals(val);
    },
    [],
  );

  const [gamificationProjects, rawSetGamificationProjects] = useState<
    Project[]
  >(() => {
    const saved = localStorage.getItem("ciclocred_gamification_projects");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: "proj-1",
        name: "Expansão de Lotes Urbanos Virgem",
        description:
          "Metodologia ativa recomendando ofertas exclusivas da Cury Constelação.",
        status: "ativo",
        progress: 0,
        xpReward: 1500,
        assignedToGoalId: "goal-2",
      },
      {
        id: "proj-2",
        name: "Automação Massiva de Whatsapp",
        description:
          "Enviar scripts de copywriting para leads frios contidos nas planilhas integradas.",
        status: "em_planejamento",
        progress: 0,
        xpReward: 900,
        assignedToGoalId: "goal-3",
      },
    ];
  });

  const setGamificationProjects = React.useCallback(
    (val: React.SetStateAction<Project[]>) => {
      isLocalProjectsChangeRef.current = true;
      rawSetGamificationProjects(val);
    },
    [],
  );

  // Save changes to localStorage on alteration
  useEffect(() => {
    localStorage.setItem("ciclocred_auth_active", String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("ciclocred_user_name", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("ciclocred_user_email", userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem("ciclocred_creci_number", creciNumber);
  }, [creciNumber]);

  useEffect(() => {
    localStorage.setItem("ciclocred_user_role", userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem("ciclocred_agency_name", agencyName);
  }, [agencyName]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_consolidated_crm_info",
      consolidatedCrmInfo,
    );
  }, [consolidatedCrmInfo]);

  useEffect(() => {
    localStorage.setItem("ciclocred_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ciclocred_palette", palette);
  }, [palette]);

  // Download auto do backup a cada 3 horas
  useEffect(() => {
    const hoursInMs = 3 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      const dataToExport = {
        leads,
        appointments,
        settings: {
          userName,
          userEmail,
          creciNumber,
          agencyName,
          theme,
          palette,
          galaxyPreset,
        },
        timestamp: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ciclocred-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, hoursInMs);

    return () => clearInterval(interval);
  }, [
    leads,
    appointments,
    userName,
    userEmail,
    creciNumber,
    agencyName,
    theme,
    palette,
    galaxyPreset,
  ]);

  useEffect(() => {
    localStorage.setItem("ciclocred_galaxy_preset", galaxyPreset);
  }, [galaxyPreset]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_sensory_config",
      JSON.stringify(accSettings),
    );
  }, [accSettings]);

  useEffect(() => {
    localStorage.setItem("ciclocred_user_xp", String(userXP));
  }, [userXP]);

  useEffect(() => {
    localStorage.setItem("ciclocred_user_level", String(userLevel));
  }, [userLevel]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_gamification_goals",
      JSON.stringify(gamificationGoals),
    );
  }, [gamificationGoals]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_gamification_projects",
      JSON.stringify(gamificationProjects),
    );
  }, [gamificationProjects]);

  // CORE METICULOSITY XP FORMULA & PROGRESS SYNC HANDLERS
  const awardXP = (xpGained: number) => {
    setUserXP((current) => {
      const xpNeeded = 5000;
      let total = current + xpGained;
      let currentLevel = userLevel;
      while (total >= xpNeeded) {
        total -= xpNeeded;
        currentLevel += 1;
        // Trigger Level-Up chime sensory audio feedback
        setTimeout(() => {
          triggerSensoryFeedback("chime", accSettings);
        }, 300);
      }
      if (currentLevel !== userLevel) {
        setUserLevel(currentLevel);
      }
      return total;
    });
  };

  const progressGoalCategory = (
    category: "venda" | "prospecção" | "visita" | "email",
    amount = 1,
  ) => {
    setGamificationGoals((prevGoals) =>
      prevGoals.map((g) => {
        if (g.category !== category || g.completed) return g;
        const nextCount = g.currentCount + amount;
        const reached = nextCount >= g.targetCount;

        if (reached) {
          setTimeout(() => {
            triggerSensoryFeedback("chime", accSettings);
            // Award large bonus XP for completing a goal
            awardXP(g.xpReward);
          }, 150);
        } else {
          // Play micro click sound for incremental movement
          setTimeout(() => {
            triggerSensoryFeedback("click", accSettings);
          }, 50);
        }

        return {
          ...g,
          currentCount: reached ? g.targetCount : nextCount,
          completed: reached,
        };
      }),
    );
  };

  const handleResetGamification = () => {
    if (
      window.confirm(
        "Deseja realmente ZERAR todo o seu progresso da gamificação (Voltar ao Nível 1, 0 XP e metas limpas)?",
      )
    ) {
      setUserXP(0);
      setUserLevel(1);
      const initialGoals = [
        {
          id: "goal-1",
          title: "Carregar 5 Novos Leads na Carteira",
          targetCount: 5,
          currentCount: 0,
          xpReward: 350,
          frequency: "diaria",
          category: "prospecção",
          completed: false,
        },
        {
          id: "goal-2",
          title: "Agendar 3 Visitas Imobiliárias",
          targetCount: 3,
          currentCount: 0,
          xpReward: 500,
          frequency: "semanal",
          category: "visita",
          completed: false,
        },
        {
          id: "goal-3",
          title: "Disparar 10 Modelos de Email Automatizados",
          targetCount: 10,
          currentCount: 0,
          xpReward: 250,
          frequency: "diaria",
          category: "email",
          completed: false,
        },
        {
          id: "goal-4",
          title: "Fechar Proposta Comercial de Crédito",
          targetCount: 1,
          currentCount: 0,
          xpReward: 1200,
          frequency: "mensal",
          category: "venda",
          completed: false,
        },
      ];
      const initialProjects = [
        {
          id: "proj-1",
          name: "Expansão de Lotes Urbanos Virgem",
          description:
            "Metodologia ativa recomendando ofertas exclusivas da Cury Constelação.",
          status: "ativo",
          progress: 0,
          xpReward: 1500,
          assignedToGoalId: "goal-2",
        },
        {
          id: "proj-2",
          name: "Automação Massiva de Whatsapp",
          description:
            "Enviar scripts de copywriting para leads frios contidos nas planilhas integradas.",
          status: "em_planejamento",
          progress: 0,
          xpReward: 900,
          assignedToGoalId: "goal-3",
        },
      ];
      setGamificationGoals(initialGoals);
      setGamificationProjects(initialProjects);
      localStorage.setItem("ciclocred_user_xp", "0");
      localStorage.setItem("ciclocred_user_level", "1");
      localStorage.setItem(
        "ciclocred_gamification_goals",
        JSON.stringify(initialGoals),
      );
      localStorage.setItem(
        "ciclocred_gamification_projects",
        JSON.stringify(initialProjects),
      );
      triggerSensoryFeedback("warning", accSettings);
      addNotification(
        "🏆 GAMIFICAÇÃO REINICIADA",
        "Sua evolução de gamificação foi resetada com sucesso da base de dados local!",
        "success",
      );
    }
  };

  // Modals visibility configurations
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(
    null,
  );
  const [defaultStatusForCreate, setDefaultStatusForCreate] =
    useState<LeadStatus>("novo");

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] =
    useState<Lead | null>(null);
  const [isUserCentralModalOpen, setIsUserCentralModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<
    "profile" | "database"
  >("profile");

  // NOTIFICATION & ALARM CENTRAL STATES (Visual, Sonoro & Sensorial)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CRMNotification[]>(() => {
    const saved = localStorage.getItem("ciclocred_notifications");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: "notify-1",
        title: "Assistente Cury Constelação ✨",
        message:
          "Conectei seu ecossistema de vendas espacial. Monitorando a carteira comercial de apartamentos na planta Cury em tempo real.",
        type: "ai",
        timestamp: "19:00",
        read: false,
      },
      {
        id: "notify-2",
        title: "Quartel de Gamificação Sincronizado 🎯",
        message:
          "O CRM começou agora em Modo Real. Complete tarefas operacionais para obter XP e atingir outras Galáxias!",
        type: "info",
        timestamp: "19:01",
        read: false,
      },
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
    localStorage.setItem(
      "ciclocred_notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  // Request browser Web Notifications permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => {
        console.log(
          "Push notification permission blocked inside iframe context.",
          err,
        );
      });
    }
  }, []);

  const addNotification = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "alarm" | "ai" = "info",
  ) => {
    const newNotify: CRMNotification = {
      id: `notify-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };

    setNotifications((prev) => [newNotify, ...prev]);

    // Play sounds, vibrate and trigger sensory pulses
    if (type === "alarm") {
      triggerSensoryFeedback("alarm", accSettings);
    } else if (type === "success") {
      triggerSensoryFeedback("success", accSettings);
    } else if (type === "ai") {
      triggerSensoryFeedback("chime", accSettings);
    } else {
      triggerSensoryFeedback("click", accSettings);
    }

    // Fire actual HTML5 Push alarm notification if authorized
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          tag: "ciclocred-crm-alert",
          silent: false,
        });
      } catch (err) {
        console.warn("Silent or regular push blocked by context.", err);
      }
    }
  };

  const renderTableSearchBar = ({
    selectedLeadIds = [],
    blockActions,
  }: {
    selectedLeadIds?: string[];
    blockActions?: {
      openCampaignModal?: () => void;
      openBulkScheduleModal?: () => void;
      onDelete?: (ids: string[]) => void;
      onExport?: (ids: string[]) => void;
    };
  }) => {
    const cycleVisibility = () => {
      triggerSensoryFeedback("click", accSettings);
      if (activeTab === "leads") {
        cycleLeadsViewMode();
      }
    };

    const handleMassMessage = () => {
      triggerSensoryFeedback("click", accSettings);
      if (activeTab === "leads") {
        setLeadsViewMode("disparos");
        localStorage.setItem("ciclocred_filter_leads_view_mode", "disparos");
        addNotification(
          "Tabela de Disparos",
          "A tabela de disparos em lote agora está ativa na tabela dinâmica abaixo.",
          "info"
        );
      }
      if (selectedLeadIds.length > 0 && blockActions?.openCampaignModal) {
        blockActions.openCampaignModal();
      } else if (activeTab !== "leads") {
        addNotification(
          "Ação em Massa",
          "Selecione pelo menos um Lead para realizar envios de mensagem em lote.",
          "warning",
        );
      }
    };

    const handleMassTask = () => {
      triggerSensoryFeedback("click", accSettings);
      if (selectedLeadIds.length > 0) {
        if (blockActions?.openBulkScheduleModal) {
          blockActions.openBulkScheduleModal();
        } else {
          selectedLeadIds.forEach((id) => {
            const tempAppt = {
              id: `appt-ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: "Acompanhamento em Massa",
              date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
              time: "10:00",
              type: "call",
              leadId: id,
              completed: false,
              notes: "Adicionado via ação em massa (🚨).",
            };
            setAppointments((prev: any) => [...prev, tempAppt]);
          });
          addNotification(
            "Lote Agendado",
            `Criadas atividades futuras para ${selectedLeadIds.length} leads selecionados.`,
            "success",
          );
        }
      } else {
        addNotification(
          "Ação em Massa",
          "Selecione pelo menos um Lead para criar atividades/tarefas.",
          "warning",
        );
      }
    };

    const handleMassDelete = () => {
      triggerSensoryFeedback("click", accSettings);
      if (selectedLeadIds.length > 0) {
        requestConfirmation(
          "Apagar Leads Selecionados?",
          `Tem certeza que deseja apagar os ${selectedLeadIds.length} leads selecionados permanentemente? Esta ação é irreversível.`,
          () => {
            setLeads((prev) =>
              prev.filter((l) => !selectedLeadIds.includes(l.id)),
            );
            triggerSensoryFeedback("warning", accSettings);
            addNotification(
              "🗑️ LEADS EXCLUÍDOS",
              `${selectedLeadIds.length} contatos foram excluídos permanentemente do CRM.`,
              "warning",
            );
          },
          "danger",
        );
      } else {
        addNotification(
          "Limpeza de Base",
          "Selecione pelo menos um Lead para realizar a exclusão em lote.",
          "warning",
        );
      }
    };

    const handleMassOSAssign = (osId: string) => {
      triggerSensoryFeedback("click", accSettings);
      if (selectedLeadIds.length > 0 && osId) {
        const selectedOS = operationalServiceOrders.find(os => os.id === osId);
        if (selectedOS) {
          requestConfirmation(
            "Atribuir Ordem de Serviço?",
            `Vincular ${selectedLeadIds.length} leads à OS: ${selectedOS.title}?`,
            () => {
              // Update OS
              const newOrders = [...operationalServiceOrders];
              const osIndex = newOrders.findIndex(os => os.id === osId);
              if (osIndex !== -1) {
                const uniqueLeads = Array.from(new Set([...newOrders[osIndex].leadIds, ...selectedLeadIds]));
                newOrders[osIndex] = {
                  ...newOrders[osIndex],
                  leadIds: uniqueLeads,
                  metrics: {
                    ...newOrders[osIndex].metrics,
                    totalLeads: uniqueLeads.length,
                    activeLeads: uniqueLeads.length
                  }
                };
                rawSetOperationalServiceOrders(newOrders);
              }

              // Update Leads
              setLeads(prev => prev.map(lead => {
                if (selectedLeadIds.includes(lead.id)) {
                  return { ...lead, fluxoId: selectedOS.fluxoId };
                }
                return lead;
              }));

              triggerSensoryFeedback("success", accSettings);
              addNotification(
                "✅ OS ATRIBUÍDA",
                `${selectedLeadIds.length} leads vinculados à OS: ${selectedOS.title}.`,
                "success"
              );
            },
            "warning"
          );
        }
      } else if (!osId) {
        // Just changed back to default, do nothing
      } else {
        addNotification(
          "Atribuição de OS",
          "Selecione pelo menos um Lead para atribuir a Ordem de Serviço.",
          "warning"
        );
      }
    };

    const isLeadsTab = activeTab === "leads";
    const isSettingsTab = activeTab === "settings";

    const currentBgConfig = appBackgrounds[activeTab];
    const activeIndex = bgIndices[activeTab] || 0;
    const currentBgImage = currentBgConfig?.images[activeIndex < currentBgConfig.images.length ? activeIndex : 0];
    const hasBg = !!currentBgImage;
    const containerClasses = isSettingsTab
      ? "bg-transparent pb-2 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased mb-1"
      : isLeadsTab
        ? `${hasBg ? "bg-zinc-950/80 backdrop-blur-md" : "bg-zinc-950"} px-3 py-2 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased text-white border border-zinc-800 rounded-xl`
        : `${hasBg ? "bg-zinc-900/80 backdrop-blur-md" : "bg-zinc-900"} px-3 py-2 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased text-white border-b-2 border-zinc-950`;

    const leftButtonsClass = "w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-black flex items-center justify-center relative cursor-pointer transition-colors shrink-0";

    const rightButtonsClass = "w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-black flex items-center justify-center relative cursor-pointer transition-colors shrink-0";

    const inputClass = "w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] md:text-xs font-mono font-medium pl-10 pr-3 py-2 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors";

    const activeFilterBtnClass = "bg-indigo-600 text-white";

    return (
      <div className={containerClasses}>
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-3">
          {/* LADO ESQUERDO: Botões solicitados */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-start">
            <button
              type="button"
              onClick={handleMassMessage}
              title="📨 Enviar Email/Mensagem em Lote"
              className={leftButtonsClass}
            >
              📨
              {selectedLeadIds.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                  {selectedLeadIds.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleMassTask}
              title="🚨 Criar Tarefa/Atividade em Lote"
              className={leftButtonsClass}
            >
              🚨
              {selectedLeadIds.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                  {selectedLeadIds.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleMassDelete}
              title="🗑️ Excluir Leads em Massa"
              className={leftButtonsClass}
            >
              🗑️
              {selectedLeadIds.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] pointer-events-none">
                  {selectedLeadIds.length}
                </span>
              )}
            </button>
            
            {/* VINCULAR OS LOTE */}
            <select
              title="Vincular Ordem de Serviço"
              onChange={(e) => {
                handleMassOSAssign(e.target.value);
                e.target.value = ""; // reset select state
              }}
              disabled={selectedLeadIds.length === 0}
              className={`rounded-lg border border-zinc-700 bg-zinc-800 text-white text-[10px] font-black h-8 px-2 uppercase transition focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${selectedLeadIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
            >
              <option value="">Vincular OS...</option>
              {operationalServiceOrders.map(os => (
                <option key={os.id} value={os.id}>{os.title}</option>
              ))}
            </select>
          </div>

          {/* CENTRO: Barra de Pesquisa restaurada conforme solicitado */}
          <div className="flex-1 w-full max-w-md relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </span>
              <input
                type="text"
                placeholder="Pesquisar ou digite comando NPL (ex: focar João)..."
                value={searchTerm}
                onChange={(e) => {
                  triggerSensoryFeedback("click", accSettings);
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleExecuteCentralNlp(searchTerm);
                  }
                }}
                className={`${inputClass} pr-10`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white font-bold text-xs"
                  title="Limpar pesquisa"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleExecuteCentralNlp(searchTerm)}
              disabled={isNlpExecuting || !searchTerm.trim()}
              title="🤖 Executar Inteligência NLP (Ctrl+Enter)"
              className={`p-2 rounded-xl border border-zinc-950 font-black text-[10px] transition duration-200 uppercase flex items-center gap-1 shrink-0 ${
                isNlpExecuting 
                  ? "bg-indigo-900/60 text-indigo-300 cursor-not-allowed animate-pulse" 
                  : !searchTerm.trim()
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700/50"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-[1.02]"
              }`}
            >
              {isNlpExecuting ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full" />
                  <span>Agindo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">IA NLP</span>
                </>
              )}
            </button>
          </div>

          {/* LADO DIREITO: Botões solicitados 🔻 */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setSearchFiltersVisibility((prev) => (prev === 2 ? 1 : 2));
              }}
              title="🔻 Mostrar/Ocultar Filtros"
              className={`${rightButtonsClass} ${searchFiltersVisibility === 2 ? activeFilterBtnClass : ""}`}
            >
              🔻
            </button>
          </div>
        </div>

        {/* Linha dos Filtros suspensa */}
        {searchFiltersVisibility === 2 && (
          <div className="w-full flex items-center gap-1 pt-2 pb-3 px-1 overflow-hidden">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">St: TODOS</option>
              <option value="novo">St: Novos</option>
              <option value="ativo">St: Ativos</option>
              <option value="arquivado">St: Arq</option>
            </select>
            <select
              value={qualificacaoFilter}
              onChange={(e) => {
                setQualificacaoFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Qualif: TODAS</option>
              {getKanbanColumns("qualificacao").map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Etapa: TODAS</option>
              {getKanbanColumns("etapas").map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <select
              value={profileFilter}
              onChange={(e) => {
                setProfileFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Perfil: TODOS</option>
              {getKanbanColumns("perfil").map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <select
              value={objectionsFilter}
              onChange={(e) => {
                setObjectionsFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Obj: TODAS</option>
              {getKanbanColumns("objecoes").map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <select
              value={originFilter}
              onChange={(e) => {
                setOriginFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Orig: TODAS</option>
              <option value="WhatsApp">WPP</option>
              <option value="Insta/Face/Tiktok">Sociais</option>
              <option value="Google Ads/Site">Google</option>
              <option value="Planilhas Antigas">Planilhas</option>
              <option value="Plantão Fisico (Porta)">Físico</option>
              <option value="Indicação">Indicação</option>
              <option value="Cury Vendas">Cury</option>
              <option value="Roleta">Roleta</option>
              <option value="Outros">Outras</option>
            </select>
            <select
              value={initialLetterFilter}
              onChange={(e) => {
                setInitialLetterFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">A-Z: T</option>
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                <option key={`letter-${letter}`} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Região: T</option>
              <option value="Leste">Z.Leste</option>
              <option value="Norte">Z.Norte</option>
              <option value="Sul">Z.Sul</option>
              <option value="Oeste">Z.Oeste</option>
              <option value="Centro">Centro</option>
              <option value="Litoral/Interior">Int</option>
              <option value="Alto Padrao SBPE">SBPE</option>
            </select>
            <select
              value={programaDesejadoFilter}
              onChange={(e) => {
                setProgramaDesejadoFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Prog: T</option>
              <option value="Minha Casa Minha Vida">MCMV</option>
              <option value="SBPE">SBPE</option>
              <option value="Pode Entrar">PE</option>
            </select>
            <select
              value={restricaoBacenFilter}
              onChange={(e) => {
                setRestricaoBacenFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Bacen: T</option>
              <option value="Não">Limpo</option>
              <option value="Sim">Restrito</option>
              <option value="Desconhecido">Verificar</option>
            </select>
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Gênero: T</option>
              <option value="Homem">M</option>
              <option value="Mulher">F</option>
              <option value="Prefiro nao informar">O</option>
            </select>
            <select
              value={familyIncomeFilter}
              onChange={(e) => {
                setFamilyIncomeFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Renda: T</option>
              <option value="Faixa 1">F1 (-2.6k)</option>
              <option value="Faixa 2">F2 (-4.4k)</option>
              <option value="Faixa 3">F3 (-8k)</option>
              <option value="Acima do Teto">Teto+</option>
            </select>
            <select
              value={incomeTypeFilter}
              onChange={(e) => {
                setIncomeTypeFilter(e.target.value);
              }}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-300 border border-zinc-950 text-[7px] font-black uppercase font-mono px-1 flex-shrink-0 py-1.5 rounded-md outline-none cursor-pointer truncate shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="todos">Vínculo: T</option>
              <option value="CLT">CLT</option>
              <option value="Autônomo/Sócio">Aut</option>
              <option value="Funcionario Publico">Func</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  const handleToggleForceLocalMode = (checked: boolean) => {
    localStorage.setItem(
      "ciclocred_force_local_offline",
      checked ? "true" : "false",
    );
    setForceLocalStorageMode(checked);
    if (checked) {
      setIsQuotaExceeded(false); // Hide standard cloud quota warnings since we are operating locally
      disableFirestoreNetwork();
      addNotification(
        "📁 CRM 100% LOCAL",
        "Operando de forma independente no localStorage do navegador para evitar limites diários.",
        "success",
      );
    } else {
      localStorage.removeItem("ciclocred_force_local_offline");
      localStorage.removeItem("firestore_quota_exceeded_status");
      (window as any).isFirestoreQuotaExceeded = false;
      setIsQuotaExceeded(false);
      addNotification(
        "☁️ RECONECTANDO NUVEM",
        "Reiniciando a conexão com o Firebase Cloud...",
        "info",
      );
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
        },
      },
      {
        title: "⚠️ Alerta de Acompanhamento",
        message: `O cliente ${randomLead.name} está no estágio "${randomLead.status}". Que tal registrar um novo follow-up no CRM?`,
        type: "warning" as const,
        action: () => {
          awardXP(30);
        },
      },
      {
        title: "💡 Dica de Venda",
        message: `Envie o plano de parcelamento facilitado para ${randomLead.name} via WhatsApp para acelerar a captação Caixa.`,
        type: "ai" as const,
        action: () => {
          awardXP(40);
        },
      },
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
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const currentDateStr = `${year}-${month}-${day}`;

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${hours}:${minutes}`;

      setAppointments((prevAppts) => {
        let hasChanges = false;
        const updatedAppts = prevAppts.map((appt) => {
          // Compare today's dates, matching schedules and warning flag
          if (
            appt.status === "agendado" &&
            appt.date === currentDateStr &&
            appt.time === currentTimeStr &&
            !appt.reminderSent
          ) {
            hasChanges = true;

            // Trigger alarm block
            setTimeout(() => {
              addNotification(
                `🚨 ALARME: ${appt.title}`,
                `Compromisso pendente com cliente ${appt.leadName} agora (${appt.time})! Verifique a aba de agendamentos.`,
                "alarm",
              );
              setActiveAlarm({
                id: appt.id,
                title: appt.title,
                leadName: appt.leadName,
                time: appt.time,
                description:
                  appt.description ||
                  "Tarefa operacional sem observações extras.",
              });
            }, 80);

            return { ...appt, reminderSent: true };
          }
          return appt;
        });

        if (hasChanges) {
          localStorage.setItem(
            "ciclocred_crm_appointments",
            JSON.stringify(updatedAppts),
          );
          return updatedAppts;
        }
        return prevAppts;
      });
    }, 6000); // Executed every 6 seconds

    return () => clearInterval(scanTimer);
  }, [accSettings]);

  // Setup loop for autonomous periodic CRM intelligence tips - completely disabled to focus strictly on real-time data
  useEffect(() => {
    localStorage.setItem("ciclocred_autonomy_enabled", "false");
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_autonomy_interval",
      String(autonomyIntervalSec),
    );
  }, [autonomyIntervalSec]);

  useEffect(() => {
    // Background automation for fictitious actions is completely disabled to protect real production data.
    // The assistant will never automatically broadcast fictitious notifications or mock actions.
  }, []);

  // Persistent storage side-effects
  useEffect(() => {
    localStorage.setItem("ciclocred_crm_leads", JSON.stringify(leads));
  }, [leads]);

  // Automated 24-hour inactivity check (Auto-Archive)
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      let changed = false;

      rawSetLeads((prevLeads) => {
        const nextLeads = prevLeads.map((l) => {
          // A lead is active or recent if status is "novo" or anything other than archived, lost, discarded, won
          const isActiveOrRecent =
            l.status === "novo" ||
            (l.status !== "arquivado" &&
              l.status !== "perdido" &&
              l.status !== "lead_descartado" &&
              l.status !== "descartado" &&
              l.status !== "ganhou");

          if (isActiveOrRecent) {
            const lastInteractionStr = l.lastInteractionAt || l.createdAt;
            const lastInteractionTime = new Date(lastInteractionStr).getTime();

            if (now - lastInteractionTime > twentyFourHoursMs) {
              changed = true;
              return {
                ...l,
                status: "arquivado",
                lastInteractionAt: new Date().toISOString(),
              };
            }
          }
          return l;
        });

        if (changed) {
          isLocalLeadsChangeRef.current = true;
          setTimeout(() => {
            addNotification(
              "Leads Arquivados",
              "Alguns contatos sem interações por mais de 24h foram movidos para Arquivados automaticamente.",
              "warning",
            );
          }, 100);
          return nextLeads;
        }
        return prevLeads;
      });
    };

    // Run on boot (after a short delay), then every 60 seconds
    const interval = setInterval(checkInactivity, 60000);
    const timeout = setTimeout(checkInactivity, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [addNotification]);

  useEffect(() => {
    localStorage.setItem("ciclocred_crm_templates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("ciclocred_crm_logs", JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_crm_appointments",
      JSON.stringify(appointments),
    );
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem("ciclocred_crm_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(
      "ciclocred_crm_properties",
      JSON.stringify(properties),
    );
  }, [properties]);


  // Hybrid Workspace Real-time background replication backplane
  useEffect(() => {
    // Wait until db is loaded initially to avoid syncing before hydration
    const isAutosync =
      localStorage.getItem("ciclocred_sheets_autosync_enabled") === "true";
    if (!isAutosync) return;

    const timer = setTimeout(() => {
      autoSyncWorkspaceDatabase(leads, appointments, emailLogs).catch((err) =>
        console.warn(
          "Background auto sync to Google Workspace failed silently:",
          err,
        ),
      );
    }, 4500); // 4.5s debounce to keep REST requests healthy and non-blocking

    return () => clearTimeout(timer);
  }, [leads, appointments, emailLogs]);

  // Deleted one-time startup sweep that wiped leads to prevent unexpected data loss

  // Removed ONE-TIME BOOTSTRAP TO GALAXY CHASSIS gamification wipe to preserve user gamification states

  // 1. Authentication Status Sync & Firestore Hydration logic
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserName(
          user.displayName ||
            user.email?.split("@")[0].toUpperCase() ||
            "Operador Cury Constelação",
        );
        setUserEmail(user.email || "vendas@curyconstelacao.com.br");
        setIsSyncing(true);

        const forcedOffline =
          localStorage.getItem("ciclocred_force_local_offline") === "true";
        const quotaExceededLogged =
          localStorage.getItem("firestore_quota_exceeded_status") === "true";
        let rawQuotaExceeded =
          quotaExceededLogged || !!(window as any).isFirestoreQuotaExceeded;

        if (forcedOffline) {
          console.log(
            "CRM: Operando em modo 100% Local (escolha do operador).",
          );
          setIsQuotaExceeded(false);
          setIsDbHydrated(true);
          setIsSyncing(false);
          return;
        }

        if (!rawQuotaExceeded) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch("/api/server/status", {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const status = await res.json();
              if (status.isQuotaExceeded) {
                console.warn(
                  "Server reported Firestore quota is exceeded during hydration check.",
                );
                rawQuotaExceeded = true;
                localStorage.setItem("firestore_quota_exceeded_status", "true");
                (window as any).isFirestoreQuotaExceeded = true;
                try {
                  window.dispatchEvent(
                    new CustomEvent("firestore-quota-exceeded"),
                  );
                } catch (_) {}
              }
            }
          } catch (fetchErr) {
            console.warn(
              "Could not retrieve server status within timeout:",
              fetchErr,
            );
          }
        }

        if (rawQuotaExceeded) {
          console.warn(
            "Quota exceeded or Offline local-only mode detected. Hydrating instantly from localStorage.",
          );
          setIsQuotaExceeded(true);
          setIsDbHydrated(true);
          setIsSyncing(false);
          return;
        }

        try {
          // Check for one-time wipe to clear the 147 dummy/fictitious leads
          // Removed one-time startup sweep on firestore connection

          const loadOrSeedCollection = async <T extends { id: string }>(
            colName: string,
            initialSeed: T[],
            setter: React.Dispatch<React.SetStateAction<T[]>>,
            idRef: React.MutableRefObject<string[]>,
          ) => {
            if (
              (window as any).isFirestoreQuotaExceeded ||
              localStorage.getItem("firestore_quota_exceeded_status") === "true"
            ) {
              throw new Error(
                `resource-exhausted: Quota exceeded before query of ${colName}`,
              );
            }
            const querySnapshot = await getDocs(collection(db, colName));
            if (querySnapshot.empty) {
              if (initialSeed && initialSeed.length > 0 && auth.currentUser) {
                // Upload local state to the cloud if the cloud is empty
                for (const item of initialSeed) {
                  try {
                    await setDoc(doc(db, colName, item.id), item);
                  } catch (e) {
                    console.error(`Failed to push local ${colName} to cloud:`, e);
                  }
                }
                setter(initialSeed);
                idRef.current = initialSeed.map((i) => i.id);
              } else {
                // No automatic seeding of mock records as requested. Keep collections empty until manually added or imported.
                setter([]);
                idRef.current = [];
              }
              return;
            } else {
              if (auth.currentUser) {
                localStorage.setItem(`ciclocred_seeded_${colName}`, "true");
                try {
                  await setDoc(
                    doc(db, "system", `seed_${colName}`),
                    { seeded: true },
                    { merge: true },
                  );
                } catch (e) {}
              }
              const loaded: T[] = [];
              querySnapshot.forEach((docSnap) => {
                let data = docSnap.data();
                if (colName === "appointments") {
                  data = sanitizeAppointmentRecord(data);
                }
                loaded.push(data as T);
              });
              const seen = new Set<string>();
              const uniqueLoaded = loaded.filter((item) => {
                const idStr = String(item.id || "");
                if (!idStr || seen.has(idStr)) return false;
                seen.add(idStr);
                return true;
              });
              setter(uniqueLoaded);
              idRef.current = uniqueLoaded.map((i) => i.id);
            }
          };

          await loadOrSeedCollection(
            "leads",
            leads,
            rawSetLeads,
            lastLeadsIdsRef,
          );
          await loadOrSeedCollection(
            "templates",
            templates,
            rawSetTemplates,
            lastTemplatesIdsRef,
          );
          await loadOrSeedCollection(
            "emailLogs",
            emailLogs,
            rawSetEmailLogs,
            lastLogsIdsRef,
          );
          await loadOrSeedCollection(
            "appointments",
            appointments,
            rawSetAppointments,
            lastApptsIdsRef,
          );
          await loadOrSeedCollection(
            "inventory",
            inventory,
            rawSetInventory,
            lastInventoryIdsRef,
          );
          await loadOrSeedCollection(
            "properties",
            properties,
            rawSetProperties,
            lastPropertiesIdsRef,
          );
          await loadOrSeedCollection(
            "gamificationGoals",
            gamificationGoals,
            rawSetGamificationGoals,
            lastGoalsIdsRef,
          );
          await loadOrSeedCollection(
            "gamificationProjects",
            gamificationProjects,
            rawSetGamificationProjects,
            lastProjectsIdsRef,
          );

          // Load or Seed userProfile
          try {
            const profileRef = doc(db, "userProfiles", user.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const data = profileSnap.data();
              const firestoreUpdatedAt = data.updatedAt || 0;
              const localUpdatedAt = Number(
                localStorage.getItem("ciclocred_profile_updated_at") || "0",
              );

              if (firestoreUpdatedAt >= localUpdatedAt) {
                console.log("CRM: Carregando perfil mais recente do Firestore");
                isLocalProfileChangeRef.current = false;
                if (data.userName) setUserName(data.userName);
                if (data.userEmail) setUserEmail(data.userEmail);
                if (data.creciNumber) setCreciNumber(data.creciNumber);
                if (data.userRole) setUserRole(data.userRole);
                if (data.agencyName) setAgencyName(data.agencyName);
                if (data.subscriptionPlan)
                  setSubscriptionPlan(data.subscriptionPlan);
                if (data.theme) setTheme(data.theme);
                if (data.galaxyPreset) setGalaxyPreset(data.galaxyPreset);
                if (data.userXP !== undefined) setUserXP(data.userXP);
                if (data.userLevel !== undefined) setUserLevel(data.userLevel);
                if (data.accSettings) setAccSettings(data.accSettings);
                if (data.notifications) setNotifications(data.notifications);
                localStorage.setItem(
                  "ciclocred_profile_updated_at",
                  String(firestoreUpdatedAt),
                );
              } else {
                console.log(
                  "CRM: Perfil local é mais recente. Irá sincronizar para o Firestore",
                );
                isLocalProfileChangeRef.current = true;
              }
            } else {
              console.log(
                "CRM: Criando perfil inicial no Firestore com os dados locais",
              );
              isLocalProfileChangeRef.current = true;
            }
          } catch (profileErr) {
            console.warn("Could not sync user profile on login:", profileErr);
          }

          setIsDbHydrated(true);
        } catch (err: any) {
          console.error("Hydration fault: ", err);
          const errMsg = err?.message || String(err);
          const errCode = err?.code || "";

          const isQuota =
            errCode === "resource-exhausted" ||
            errMsg.toLowerCase().includes("quota") ||
            errMsg.toLowerCase().includes("exhausted") ||
            errMsg.toLowerCase().includes("resource-exhausted");

          if (isQuota) {
            localStorage.setItem("firestore_quota_exceeded_status", "true");
            (window as any).isFirestoreQuotaExceeded = true;
            try {
              window.dispatchEvent(new CustomEvent("firestore-quota-exceeded"));
            } catch (_) {}
            setIsQuotaExceeded(true);
          } else {
            console.warn(
              "CRM: Outra falha de conexão/CORS de sandbox detectada. Operando em modo seguro local.",
            );
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
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    const unsubscribeLeads = onSnapshot(
      collection(db, "leads"),
      (snapshot) => {
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

        localStorage.setItem("ciclocred_crm_leads", JSON.stringify(loaded));
        rawSetLeads(loaded);
        lastLeadsIdsRef.current = loaded.map((l) => l.id);
      },
      (err) => {
        const errMsg = err?.message || String(err);
        if (
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("exhausted") ||
          errMsg.toLowerCase().includes("resource-exhausted")
        ) {
          setIsQuotaExceeded(true);
        } else {
          handleFirestoreError(err, OperationType.GET, "leads");
        }
      },
    );

    const unsubscribeActionLogs = onSnapshot(
      collection(db, "actionLogs"),
      (snapshot) => {
        if (isLocalActionLogsChangeRef.current) {
          isLocalActionLogsChangeRef.current = false;
          return;
        }
        const loaded: LeadActionLog[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as LeadActionLog);
        });
        loaded.sort((a, b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tB - tA;
        });
        localStorage.setItem("ciclocred_crm_action_logs", JSON.stringify(loaded));
        rawSetActionLogs(loaded);
      },
      (err) => {
        console.warn("Firestore actionLogs snapshot error:", err);
      }
    );

    const unsubscribeAppointments = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        if (isLocalApptsChangeRef.current) return;
        const loaded: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(sanitizeAppointmentRecord(docSnap.data()));
        });
        localStorage.setItem(
          "ciclocred_crm_appointments",
          JSON.stringify(loaded),
        );
        rawSetAppointments(loaded);
        lastApptsIdsRef.current = loaded.map((a) => a.id);
      },
      (err) => {
        console.warn("Appointments live listener failed:", err);
      },
    );

    const unsubscribeTemplates = onSnapshot(
      collection(db, "templates"),
      (snapshot) => {
        if (isLocalTemplatesChangeRef.current) return;
        const loaded: EmailTemplate[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as EmailTemplate);
        });
        localStorage.setItem("ciclocred_crm_templates", JSON.stringify(loaded));
        rawSetTemplates(loaded);
        lastTemplatesIdsRef.current = loaded.map((t) => t.id);
      },
      (err) => {
        console.warn("Templates live listener failed:", err);
      },
    );

    const unsubscribeEmailLogs = onSnapshot(
      collection(db, "emailLogs"),
      (snapshot) => {
        if (isLocalEmailLogsChangeRef.current) return;
        const loaded: EmailLog[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as EmailLog);
        });
        localStorage.setItem("ciclocred_crm_logs", JSON.stringify(loaded));
        rawSetEmailLogs(loaded);
        lastLogsIdsRef.current = loaded.map((l) => l.id);
      },
      (err) => {
        console.warn("EmailLogs live listener failed:", err);
      },
    );

    const unsubscribeInventory = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        if (isLocalInventoryChangeRef.current) return;
        const loaded: InventoryItem[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as InventoryItem);
        });
        localStorage.setItem("ciclocred_crm_inventory", JSON.stringify(loaded));
        rawSetInventory(loaded);
        lastInventoryIdsRef.current = loaded.map((i) => i.id);
      },
      (err) => {
        console.warn("Inventory live listener failed:", err);
      },
    );

    const unsubscribeProperties = onSnapshot(
      collection(db, "properties"),
      (snapshot) => {
        if (isLocalPropertiesChangeRef.current) return;
        const loaded: RealEstateProperty[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as RealEstateProperty);
        });
        localStorage.setItem(
          "ciclocred_crm_properties",
          JSON.stringify(loaded),
        );
        rawSetProperties(loaded);
        lastPropertiesIdsRef.current = loaded.map((p) => p.id);
      },
      (err) => {
        console.warn("Properties live listener failed:", err);
      },
    );

    const unsubscribeGoals = onSnapshot(
      collection(db, "gamificationGoals"),
      (snapshot) => {
        if (isLocalGoalsChangeRef.current) return;
        const loaded: Goal[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as Goal);
        });
        localStorage.setItem(
          "ciclocred_gamification_goals",
          JSON.stringify(loaded),
        );
        rawSetGamificationGoals(loaded);
        lastGoalsIdsRef.current = loaded.map((g) => g.id);
      },
      (err) => {
        console.warn("Goals live listener failed:", err);
      },
    );

    const unsubscribeProjects = onSnapshot(
      collection(db, "gamificationProjects"),
      (snapshot) => {
        if (isLocalProjectsChangeRef.current) return;
        const loaded: Project[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as Project);
        });
        localStorage.setItem(
          "ciclocred_gamification_projects",
          JSON.stringify(loaded),
        );
        rawSetGamificationProjects(loaded);
        lastProjectsIdsRef.current = loaded.map((p) => p.id);
      },
      (err) => {
        console.warn("Projects live listener failed:", err);
      },
    );

    const unsubscribeQuickNotes = onSnapshot(
      collection(db, "quickNotes"),
      (snapshot) => {
        if (isLocalNotesChangeRef.current) return;
        const loaded: QuickNote[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as QuickNote);
        });
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem("ciclocred_quick_notes", JSON.stringify(loaded));
        rawSetQuickNotes(loaded);
      },
      (err) => {
        console.warn("QuickNotes live listener failed:", err);
      }
    );

    const unsubscribeImportBatches = onSnapshot(
      collection(db, "importBatches"),
      (snapshot) => {
        if (isLocalImportBatchesChangeRef.current) return;
        const loaded: OperationalOS[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as OperationalOS);
        });
        loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem("ciclocred_import_batches", JSON.stringify(loaded));
        rawSetOperationalServiceOrders(loaded);
      },
      (err) => {
        console.warn("ImportBatches live listener failed:", err);
      }
    );

    const unsubscribeProfile = onSnapshot(
      doc(db, "userProfiles", auth.currentUser.uid),
      (docSnap) => {
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
          localStorage.setItem(
            "ciclocred_profile_updated_at",
            String(data.updatedAt || Date.now()),
          );
        }
      },
      (err) => {
        console.warn("UserProfile snapshot error:", err);
      },
    );

    return () => {
      unsubscribeLeads();
      unsubscribeActionLogs();
      unsubscribeAppointments();
      unsubscribeTemplates();
      unsubscribeEmailLogs();
      unsubscribeInventory();
      unsubscribeProperties();
      unsubscribeGoals();
      unsubscribeProjects();
      unsubscribeQuickNotes();
      unsubscribeImportBatches();
      unsubscribeProfile();
    };
  }, [isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // Leads Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalLeadsChangeRef.current) return;
    const syncLeads = async () => {
      try {
        const lastIds = lastLeadsIdsRef.current;
        const currentIds = new Set(leads.map((l) => l.id));

        const operations: { type: "delete" | "set"; id: string; data?: any }[] =
          [];

        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            operations.push({ type: "delete", id });
          }
        }
        for (const lead of leads) {
          operations.push({ type: "set", id: lead.id, data: lead });
        }

        const CHUNK_SIZE = 450;
        for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
          const chunk = operations.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          for (const op of chunk) {
            if (op.type === "delete") {
              batch.delete(doc(db, "leads", op.id));
            } else if (op.type === "set") {
              // Sanitize undefined fields by stringifying
              const cleanData = JSON.parse(JSON.stringify(op.data));
              batch.set(doc(db, "leads", op.id), cleanData);
            }
          }
          await batch.commit();
        }

        lastLeadsIdsRef.current = Array.from(currentIds);
        isLocalLeadsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "leads");
      }
    };
    syncLeads();
  }, [leads, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // Templates Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalTemplatesChangeRef.current) return;
    const syncTemplates = async () => {
      try {
        const lastIds = lastTemplatesIdsRef.current;
        const currentIds = new Set(templates.map((t) => t.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, "templates", id));
          }
        }
        for (const template of templates) {
          const cleanTemplate = JSON.parse(JSON.stringify(template));
          await setDoc(doc(db, "templates", template.id), cleanTemplate);
        }
        lastTemplatesIdsRef.current = Array.from(currentIds);
        isLocalTemplatesChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "templates");
      }
    };
    syncTemplates();
  }, [templates, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // EmailLogs Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalEmailLogsChangeRef.current) return;
    const syncLogs = async () => {
      try {
        const lastIds = lastLogsIdsRef.current;
        const currentIds = new Set(emailLogs.map((l) => l.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, "emailLogs", id));
          }
        }
        for (const log of emailLogs) {
          const cleanLog = JSON.parse(JSON.stringify(log));
          await setDoc(doc(db, "emailLogs", log.id), cleanLog);
        }
        lastLogsIdsRef.current = Array.from(currentIds);
        isLocalEmailLogsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "emailLogs");
      }
    };
    syncLogs();
  }, [emailLogs, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // Appointments Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalApptsChangeRef.current) return;
    const syncAppts = async () => {
      try {
        const lastIds = lastApptsIdsRef.current;
        const currentIds = new Set(appointments.map((a) => a.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, "appointments", id));
          }
        }
        for (const appt of appointments) {
          const cleanAppt = JSON.parse(JSON.stringify(appt));
          await setDoc(doc(db, "appointments", appt.id), cleanAppt);
        }
        lastApptsIdsRef.current = Array.from(currentIds);
        isLocalApptsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "appointments");
      }
    };
    syncAppts();
  }, [appointments, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // Inventory Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalInventoryChangeRef.current) return;
    const syncInventory = async () => {
      try {
        const lastIds = lastInventoryIdsRef.current;
        const currentIds = new Set(inventory.map((i) => i.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, "inventory", id));
          }
        }
        for (const item of inventory) {
          const cleanItem = JSON.parse(JSON.stringify(item));
          await setDoc(doc(db, "inventory", item.id), cleanItem);
        }
        lastInventoryIdsRef.current = Array.from(currentIds);
        isLocalInventoryChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "inventory");
      }
    };
    syncInventory();
  }, [inventory, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // Properties Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalPropertiesChangeRef.current) return;
    const syncProperties = async () => {
      try {
        const lastIds = lastPropertiesIdsRef.current;
        const currentIds = new Set(properties.map((p) => p.id));

        let batch = writeBatch(db);
        let opCount = 0;
        const MAX_BATCH_OPS = 450;

        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            batch.delete(doc(db, "properties", id));
            opCount++;
            if (opCount >= MAX_BATCH_OPS) {
              await batch.commit();
              batch = writeBatch(db);
              opCount = 0;
            }
          }
        }
        for (const item of properties) {
          const cleanData = JSON.parse(JSON.stringify(item));
          batch.set(doc(db, "properties", item.id), cleanData);
          opCount++;
          if (opCount >= MAX_BATCH_OPS) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }

        if (opCount > 0) {
          await batch.commit();
        }

        lastPropertiesIdsRef.current = Array.from(currentIds);
        isLocalPropertiesChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "properties");
      }
    };
    syncProperties();
  }, [properties, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // GamificationGoals Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalGoalsChangeRef.current) return;
    const syncGoals = async () => {
      try {
        const lastIds = lastGoalsIdsRef.current;
        const currentIds = new Set(gamificationGoals.map((g) => g.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, "gamificationGoals", id));
          }
        }
        for (const goal of gamificationGoals) {
          const cleanGoal = JSON.parse(JSON.stringify(goal));
          await setDoc(doc(db, "gamificationGoals", goal.id), cleanGoal);
        }
        lastGoalsIdsRef.current = Array.from(currentIds);
        isLocalGoalsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "gamificationGoals");
      }
    };
    syncGoals();
  }, [gamificationGoals, isDbHydrated, isQuotaExceeded, forceLocalStorageMode]);

  // GamificationProjects Sync
  useEffect(() => {
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
    if (!isLocalProjectsChangeRef.current) return;
    const syncProjects = async () => {
      try {
        const lastIds = lastProjectsIdsRef.current;
        const currentIds = new Set(gamificationProjects.map((p) => p.id));
        for (const id of lastIds) {
          if (!currentIds.has(id)) {
            await deleteDoc(doc(db, "gamificationProjects", id));
          }
        }
        for (const proj of gamificationProjects) {
          const cleanProj = JSON.parse(JSON.stringify(proj));
          await setDoc(doc(db, "gamificationProjects", proj.id), cleanProj);
        }
        lastProjectsIdsRef.current = Array.from(currentIds);
        isLocalProjectsChangeRef.current = false;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "gamificationProjects");
      }
    };
    syncProjects();
  }, [
    gamificationProjects,
    isDbHydrated,
    isQuotaExceeded,
    forceLocalStorageMode,
  ]);


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
    if (
      !isDbHydrated ||
      !auth.currentUser ||
      isQuotaExceeded ||
      forceLocalStorageMode
    )
      return;
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
          updatedAt: Date.now(),
        };
        await setDoc(
          doc(db, "userProfiles", auth.currentUser!.uid),
          profileDoc,
        );
        localStorage.setItem(
          "ciclocred_profile_updated_at",
          String(profileDoc.updatedAt),
        );
      } catch (err) {
        console.warn("Failed to sync userProfile to Firestore:", err);
      }
    };

    // Debounce uploads by 1200ms to avoid flooding on keystrokes/XP rewards
    const timer = setTimeout(() => {
      syncProfile();
    }, 1200);
    return () => clearTimeout(timer);
  }, [
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
    isDbHydrated,
    isQuotaExceeded,
    forceLocalStorageMode,
  ]);

  // Centralized high-performance Engine for Global Synchronization, Memória Operacional and Fluxo Inteligente
  const enrichAndSyncLead = React.useCallback(async (
    leadId: string,
    fields: Partial<Lead>,
    moduleSource: string,
    customLogNote?: string
  ) => {
    isLocalLeadsChangeRef.current = true;
    
    let oldLead: Lead | undefined;
    let enrichedLead: Lead | undefined;
    let logEntries: LeadActionLog[] = [];

    // 1. Update the local state React leads and compute intelligence on the fly
    setLeads((prev) => {
      const existing = prev.find(l => l.id === leadId);
      if (!existing) return prev;
      oldLead = { ...existing };

      let updated: Lead = {
        ...existing,
        ...fields,
        lastInteractionAt: new Date().toISOString(),
      };

      // Auto-advance rule: ANY edit or alteration on a "novo" lead automatically promotes it to status "ativo" and initial stage "abordagem" (unless explicitly setting another stage)
      if (
        existing.status === "novo" &&
        updated.status !== "arquivado" &&
        updated.status !== "lead_descartado" &&
        updated.status !== "descartado" &&
        updated.status !== "ganhou"
      ) {
        updated.status = "ativo";
        if (!fields.stage && !updated.stage) {
          updated.stage = "abordagem";
        }
      }

      // ----------------- COMPLETE BIDIRECTIONAL SYNC (STATUS <-> STAGE) -----------------
      if (fields.status !== undefined && fields.status !== existing.status) {
        if (fields.status === 'ganhou' || fields.status === 'Convertido') {
          updated.stage = 'fechamento';
        } else if (fields.status === 'ativo' && (!updated.stage || updated.stage === 'fechamento')) {
           updated.stage = 'abordagem';
        }
      } else if (fields.stage !== undefined && fields.stage !== existing.stage) {
        if (fields.stage === 'fechamento' || fields.stage === 'concluido') {
          updated.status = 'ganhou';
        } else if (fields.stage && updated.status === 'novo') {
          updated.status = 'ativo';
        }
      }

      // ----------------- IMPLICIT STAGE PROMOTION -----------------
      const stageOrder = [
        'abordagem', 'triagem', 'qualificacao', 'analise_perfil', 'compatibilizacao',
        'apresentacao', 'proposta', 'visita', 'objecao', 'escolha_de_unidade',
        'simulacao_final', 'fechamento', 'pos_venda', 'follow_up_1', 'follow_up_2',
        'follow_up_3'
      ];
      
      const currentStageIdx = stageOrder.indexOf(updated.stage || 'abordagem');
      let maxNewStageIdx = currentStageIdx;

      // Auto-promote only if the user didn't explicitly set the stage in this update
      if (fields.stage === undefined) {
        // Rule 1: Triagem (Basic info captured)
        if (updated.name && updated.phone) {
          maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('triagem'));
        }
        // Rule 2: Qualificação (Income / Basic Financials)
        if (updated.familyIncome && updated.familyIncome > 0) {
          maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('qualificacao'));
        }
        // Rule 3: Análise de Perfil (Profile, Dependents)
        if (updated.mainProfile) {
          maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('analise_perfil'));
        }
        // Rule 4: Compatibilização (Property Interest / Match)
        if (updated.propertyInterest) {
          maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('compatibilizacao'));
        }
        // Rule 5: Objeções
        if (updated.objection && updated.objection !== "Sem Objeção") {
          maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('objecao'));
        }
        // Rule 6: Checklist (Documentos, Visita, Proposta, etc.)
        if (updated.checklist) {
          if (updated.checklist['doc_cnh_rg'] && updated.checklist['doc_resid'] && updated.checklist['renda_holerites']) maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('analise_perfil'));
          if (updated.checklist['visita_agendada'] || updated.checklist['visita_realizada']) maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('visita'));
          if (updated.checklist['proposta_assinada']) maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('proposta'));
          if (updated.checklist['credito_aprovado']) maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('simulacao_final'));
          if (updated.checklist['assinatura_caixa']) maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('fechamento'));
          if (updated.checklist['chaves_entregues']) maxNewStageIdx = Math.max(maxNewStageIdx, stageOrder.indexOf('pos_venda'));
        }
        
        if (maxNewStageIdx > currentStageIdx && maxNewStageIdx !== -1) {
          updated.stage = stageOrder[maxNewStageIdx];
        }
      }

      // ----------------- OS FLOW & GENERAL STAGE BIDIRECTIONAL SYNC -----------------
      let activeFluxoId = updated.fluxoId;
      if (!activeFluxoId && operationalServiceOrders) {
        const matchingOS = (operationalServiceOrders || []).find(os => os.leadIds && os.leadIds.includes(leadId));
        if (matchingOS) {
          activeFluxoId = matchingOS.fluxoId;
          updated.fluxoId = matchingOS.fluxoId;
        }
      }

      if (activeFluxoId) {
        const activeFlow = (operationalFlows || []).find(f => f.id === activeFluxoId);
        if (activeFlow && activeFlow.stages && activeFlow.stages.length > 0) {
          if (fields.fluxoId !== undefined && fields.fluxoId !== existing.fluxoId) {
            // Flow changed, re-map current stage to new flow
            const stageToMap = updated.stage || 'abordagem';
            const matchedCustomStage = activeFlow.stages.find(s => s.mappedStageId === stageToMap || s.id === stageToMap || (s.mappedStageId && s.mappedStageId.includes(stageToMap)) || s.id.includes(stageToMap) || s.name.toLowerCase().includes(stageToMap.replace(/_/g, ' ')));
            if (matchedCustomStage) {
              updated.osStageId = matchedCustomStage.id;
            } else {
              updated.osStageId = activeFlow.stages[0]?.id; // Default to first stage if no mapping
            }
          } else if (fields.osStageId !== undefined) {
            // Updated via Custom/OS stage
            const matchedCustomStage = activeFlow.stages.find(s => s.id === fields.osStageId);
            if (matchedCustomStage) {
              updated.osStageId = matchedCustomStage.id;
              if (matchedCustomStage.mappedStageId) {
                updated.generalStageId = matchedCustomStage.mappedStageId;
                // Reflect mapped stage in the general kanban (stage)
                updated.stage = matchedCustomStage.mappedStageId;
              }
            }
          } else if (fields.stage !== undefined || updated.stage !== existing.stage) {
            // Updated via General Kanban stage directly OR Implicit Stage Promotion
            const stageToMap = fields.stage !== undefined ? fields.stage : updated.stage;
            // Find a custom stage in the flow that is mapped to this general stage
            const matchedCustomStage = activeFlow.stages.find(s => s.mappedStageId === stageToMap || s.id === stageToMap || (s.mappedStageId && s.mappedStageId.includes(stageToMap)) || s.id.includes(stageToMap) || s.name.toLowerCase().includes(stageToMap.replace(/_/g, ' ')));
            if (matchedCustomStage) {
              updated.osStageId = matchedCustomStage.id;
              if (matchedCustomStage.mappedStageId) {
                updated.generalStageId = matchedCustomStage.mappedStageId;
                updated.stage = matchedCustomStage.mappedStageId;
              }
            }
          } else if (updated.osStageId) {
            // Make sure general stage is mapped if osStageId is present
            const matchedCustomStage = activeFlow.stages.find(s => s.id === updated.osStageId);
            if (matchedCustomStage && matchedCustomStage.mappedStageId) {
              updated.generalStageId = matchedCustomStage.mappedStageId;
              updated.stage = matchedCustomStage.mappedStageId;
            }
          }
        }
      }

      // ----------------- FINAL SYNC FOR STATUS FROM STAGE (2nd PASS) -----------------
      if (updated.stage !== existing.stage) {
        if (updated.stage === 'fechamento' || updated.stage === 'concluido') {
          updated.status = 'ganhou';
        } else if (updated.stage && updated.status === 'novo') {
          updated.status = 'ativo';
        } else if (updated.status === 'ganhou' && updated.stage !== 'fechamento' && updated.stage !== 'concluido') {
          updated.status = 'ativo';
        }
      }

      // ----------------- FLUXO INTELIGENTE RECALCULATIONS -----------------
      // a) Recalcular prioridade do Lead
      updated.priority = calculatePriority(updated);

      // b) Recalcular probabilidade e compatibilidade com estoque
      let maxCompatScore = 0;
      if (properties && properties.length > 0) {
        properties.forEach((p) => {
          const res = calculateCompatibility(updated, p);
          if (res.score > maxCompatScore) {
            maxCompatScore = res.score;
          }
        });
      }
      updated.compatibilityScore = maxCompatScore;
      
      // c) Identificar próxima melhor ação
      updated.notes = updated.notes || ""; // avoid undefined

      // Update indicators/suggestions
      const nextAction = suggestNextAction(updated);

      // ----------------- MEMÓRIA OPERACIONAL (TIMELINE LOG ENTRY) -----------------
      // Compare fields to detect which values changed
      const fieldsToTrack: (keyof Lead)[] = [
        'name', 'email', 'phone', 'value', 'status', 'stage', 
        'notes', 'familyIncome', 'propertyInterest', 'objection', 'fluxoId'
      ];

      fieldsToTrack.forEach(field => {
        if (fields[field] !== undefined && String(fields[field]) !== String(existing[field])) {
          const fieldLabels: Record<string, string> = {
            name: 'Nome',
            email: 'E-mail',
            phone: 'Telefone',
            value: 'Valor do Negócio',
            status: 'Status/Fase',
            stage: 'Etapa do Funil',
            notes: 'Anotações',
            familyIncome: 'Renda Familiar Conjunta',
            propertyInterest: 'Interesse Imobiliário',
            objection: 'Objeção do Cliente',
            fluxoId: 'Fluxo Vinculado'
          };

          const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          logEntries.push({
            id: logId,
            leadId: leadId,
            timestamp: new Date().toISOString(),
            module: moduleSource,
            action: `Alterou ${fieldLabels[field] || String(field)}`,
            prevValue: String(existing[field] || 'Vazio'),
            newValue: String(updated[field] || 'Vazio'),
            user: userName || 'Sistema',
            notes: customLogNote || `Atualização de dados via ${moduleSource}`
          });
        }
      });

      enrichedLead = updated;

      return prev.map((l) => (l.id === leadId ? updated : l));
    });

    // 2. Perform external async side effects (Firestore save)
    if (enrichedLead) {
      if (selectedLeadForDetails?.id === leadId) {
        setSelectedLeadForDetails(enrichedLead);
      }
      const cleanLead = JSON.parse(JSON.stringify(enrichedLead));
      
      // Firestore Save Lead
      if (auth.currentUser && !forceLocalStorageMode && !isQuotaExceeded) {
        setDoc(doc(db, "leads", leadId), cleanLead).catch(err => {
          console.warn("Failed to sync updated lead to Firestore:", err);
        });
      }

      // 3. Save Log Entries to state & Firestore
      if (logEntries.length > 0) {
        isLocalActionLogsChangeRef.current = true;
        setActionLogs(prevLogs => {
          const updatedLogs = [...logEntries, ...prevLogs];
          localStorage.setItem("ciclocred_crm_action_logs", JSON.stringify(updatedLogs));
          return updatedLogs;
        });

        // Save logs to Firestore in parallel
        if (auth.currentUser && !forceLocalStorageMode && !isQuotaExceeded) {
          logEntries.forEach(log => {
            const cleanLog = JSON.parse(JSON.stringify(log));
            setDoc(doc(db, "actionLogs", log.id), cleanLog).catch(err => {
              console.warn("Failed to sync action log to Firestore:", err);
            });
          });
        }

        // Emit alerts if compatibility score is extremely high!
        if (enrichedLead.compatibilityScore && enrichedLead.compatibilityScore >= 80) {
          addNotification(
            "ALTA COMPATIBILIDADE",
            `O cliente ${enrichedLead.name} possui ${enrichedLead.compatibilityScore}% de compatibilidade com imóveis do estoque!`,
            "info"
          );
        }

        // Trigger Google Sheets Sync
        logEntries.forEach(log => {
          syncCRMMovementToGoogleSheet(
            log.action,
            `Cliente: ${enrichedLead?.name} | ${log.action}: De [${log.prevValue}] para [${log.newValue}] (${log.module})`,
            userName
          );
        });
      }
    }
  }, [
    properties,
    userName,
    selectedLeadForDetails,
    forceLocalStorageMode,
    isQuotaExceeded,
    setActionLogs,
    setLeads,
    addNotification,
    operationalFlows,
    operationalServiceOrders
  ]);

  // Centralized Lead Field Updater
  const handleUpdateLeadField = React.useCallback((leadId: string, fields: Partial<Lead>) => {
    enrichAndSyncLead(leadId, fields, "CRM");
  }, [enrichAndSyncLead]);

  // Lead transition handler
  const handleMoveLead = React.useCallback((
    leadId: string,
    newStatus: string,
    targetPageId?: string,
  ) => {
    const leadObj = leadsRef.current.find((l) => l.id === leadId);
    const previousStatus = leadObj ? leadObj.status : undefined;

    const cols = getKanbanColumns(targetPageId);
    const targetCol = cols.find((c) => c.id === newStatus);
    const stageLabel = targetCol ? targetCol.label : String(newStatus);

    const resolvedPageId =
      targetPageId ||
      localStorage.getItem("ciclocred_active_funnel_page_id") ||
      "status";

    const fieldsToUpdate: Partial<Lead> = {};
    if (resolvedPageId === "status" || resolvedPageId === "tabelas") {
      fieldsToUpdate.status = newStatus as any;
    } else if (resolvedPageId === "etapas" || resolvedPageId === "ativos") {
      fieldsToUpdate.stage = newStatus;
    } else if (resolvedPageId === "perfil") {
      fieldsToUpdate.mainProfile = newStatus as any;
    } else if (resolvedPageId === "objecoes" || resolvedPageId === "carteira") {
      fieldsToUpdate.objection = newStatus;
    }

    enrichAndSyncLead(leadId, fieldsToUpdate, "Kanban");

    // Trigger Gamification for moving leads in Kanban!
    if (previousStatus && previousStatus !== newStatus) {
      if (newStatus === "fechado" || newStatus === "ganhou") {
        progressGoalCategory("venda", 1);
        awardXP(500); // 500 XP big closed win deal bonus!
      } else {
        awardXP(40); // 40 XP for advancing pipeline stage
      }
    }
  }, [enrichAndSyncLead, progressGoalCategory, awardXP]);

  const handleUpdateNotes = React.useCallback((leadId: string, newNotes: string) => {
    enrichAndSyncLead(leadId, { notes: newNotes }, "Notas");
  }, [enrichAndSyncLead]);

  const handleUpdateLeadFull = React.useCallback((
    leadId: string,
    updatedFields: Partial<Lead>,
  ) => {
    enrichAndSyncLead(leadId, updatedFields, "CRM");
  }, [enrichAndSyncLead]);

  const handleUpdateFamilyIncome = React.useCallback((leadId: string, income: number) => {
    enrichAndSyncLead(leadId, { familyIncome: income }, "Ficha");
  }, [enrichAndSyncLead]);

  const [isNlpExecuting, setIsNlpExecuting] = useState(false);

  const handleExecuteCentralNlp = async (command: string) => {
    if (!command.trim()) return;
    setIsNlpExecuting(true);
    try {
      const res = await fetch("/api/ai/nlp-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          leadsContext: leads.map((l) => ({
            id: l.id,
            name: l.name,
            status: l.status,
            stage: l.stage,
            value: l.value,
            familyGrossIncome: l.familyGrossIncome,
            familyIncome: l.familyIncome,
            qualificacao: l.qualificacao,
            mainProfile: l.mainProfile,
            objection: l.objection
          })),
          propertiesContext: []
        }),
      });

      if (!res.ok) throw new Error("Erro na comunicação com a IA");
      const data = await res.json();

      let actionsApplied = 0;
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          if (action.type === "UPDATE_LEAD") {
            handleUpdateLeadField(action.leadId, action.updates);
            
            if (action.updates.status) {
              handleMoveLead(action.leadId, action.updates.status, "status");
            }
            if (action.updates.stage) {
              handleMoveLead(action.leadId, action.updates.stage, "etapas");
            }
            if (action.updates.mainProfile) {
              handleMoveLead(action.leadId, action.updates.mainProfile, "perfil");
            }
            if (action.updates.objection) {
              handleMoveLead(action.leadId, action.updates.objection, "objecoes");
            }
            actionsApplied++;
          } else if (action.type === "ADD_TO_DISPATCH_QUEUE") {
            handleAddMultipleToDisparos(action.leadIds || []);
            actionsApplied++;
          } else if (action.type === "FOCUS_LEAD") {
            const focusLead = leads.find(l => (action.leadIds || []).includes(l.id));
            if (focusLead) {
              setSelectedLeadForDetails(focusLead);
              setIsDetailsModalOpen(true);
              actionsApplied++;
            }
          }
        }
      }

      addNotification(
        "🤖 COMANDO IA EXECUTADO", 
        data.message || `${actionsApplied} ações inteligentes aplicadas no ecossistema cicloCRED.`, 
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("❌ ERRO IA", "Falha ao processar comando com o Gemini.", "alarm");
    } finally {
      setIsNlpExecuting(false);
    }
  };



  const handleDeleteLead = React.useCallback((leadId: string) => {
    const leadObj = leadsRef.current.find((l) => l.id === leadId);
    const leadName = leadObj ? leadObj.name : "este lead";
    requestConfirmation(
      "Remover Cliente Lead?",
      `Tem certeza de que deseja remover permanentemente o lead "${leadName}" do CRM? Esta ação apagará seu histórico nesta sessão de forma definitiva.`,
      async () => {
        // Flag local change to prevent incoming firestore snapshots from resetting our data
        isLocalLeadsChangeRef.current = true;

        // 1. Update local state and also keep the tracking reference in exact sync
        setLeads((prev) => {
          const filtered = prev.filter((l) => l.id !== leadId);
          lastLeadsIdsRef.current = filtered.map((l) => l.id);
          return filtered;
        });

        // 1.1 Also purge all corresponding follow-up logs, appointments and templates/email-logs for this lead
        rawSetAppointments((prev) => prev.filter((a) => a.leadId !== leadId));
        rawSetEmailLogs((prev) => prev.filter((l) => l.leadId !== leadId));

        // 1.2 Clear select states if they pointed to this deleted lead
        if (scriptsTargetLeadId === leadId) {
          setScriptsTargetLeadId("");
        }

        // 2. Explicitly remove from localStorage
        const savedLeads = localStorage.getItem("ciclocred_crm_leads");
        if (savedLeads) {
          try {
            const parsed = JSON.parse(savedLeads);
            if (Array.isArray(parsed)) {
              const updated = parsed.filter((l: any) => l.id !== leadId);
              localStorage.setItem(
                "ciclocred_crm_leads",
                JSON.stringify(updated),
              );
            }
          } catch (_) {}
        }

        // 3. Remove from Firestore immediately
        if (auth.currentUser) {
          try {
            await deleteDoc(doc(db, "leads", leadId));
          } catch (err) {
            console.error("Erro ao deletar lead do Firestore:", err);
          }
        }

        if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
          setIsDetailsModalOpen(false);
        }
        triggerSensoryFeedback("warning", accSettings);
        addNotification(
          "🗑️ LEAD REMOVIDO",
          `O lead "${leadName}" foi removido do seu funil com persistência total.`,
          "warning",
        );

        // Keep the sync disabled momentarily for the database writes to propagate and stabilize
        setTimeout(() => {
          isLocalLeadsChangeRef.current = false;
        }, 1500);
      },
      "danger",
    );
  }, [requestConfirmation, setLeads, scriptsTargetLeadId, selectedLeadForDetails, accSettings, addNotification]);

  const handleDeleteMultipleLeadsHandler = async (ids: string[]) => {
    // Flag local change to lock incoming snapshots
    isLocalLeadsChangeRef.current = true;

    // 1. Update local state and tracking reference
    setLeads((prev) => {
      const filtered = prev.filter((l) => !ids.includes(l.id));
      lastLeadsIdsRef.current = filtered.map((l) => l.id);
      return filtered;
    });

    // 1.1 Also purge corresponding follow-up logs, appointments, email logs and clear select states
    rawSetAppointments((prev) => prev.filter((a) => !ids.includes(a.leadId)));
    rawSetEmailLogs((prev) => prev.filter((l) => !ids.includes(l.leadId)));

    if (ids.includes(scriptsTargetLeadId)) {
      setScriptsTargetLeadId("");
    }

    if (selectedLeadForDetails && ids.includes(selectedLeadForDetails.id)) {
      setIsDetailsModalOpen(false);
    }

    // 2. Update localStorage
    const savedLeads = localStorage.getItem("ciclocred_crm_leads");
    if (savedLeads) {
      try {
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((l: any) => !ids.includes(l.id));
          localStorage.setItem("ciclocred_crm_leads", JSON.stringify(updated));
        }
      } catch (_) {}
    }

    // 3. Update Firestore immediately
    if (auth.currentUser) {
      try {
        const CHUNK_SIZE = 450;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
          const chunk = ids.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((id) => {
            batch.delete(doc(db, "leads", id));
          });
          await batch.commit();
        }
      } catch (err) {
        console.error("Erro ao deletar múltiplos leads no Firestore:", err);
      }
    }
    triggerSensoryFeedback("warning", accSettings);
    addNotification(
      "🗑️ LEADS EXCLUÍDOS",
      `${ids.length} contatos foram excluídos permanentemente de forma integrada e persistente.`,
      "warning",
    );

    // Release sync lock after safety margin
    setTimeout(() => {
      isLocalLeadsChangeRef.current = false;
    }, 1500);
  };

  const handleNavigateToScripts = (lead: any) => {
    setIsConversaoModalOpen(true);
    triggerSensoryFeedback("chime", accSettings);
    addNotification(
      "Assistente AI Ativado",
      `Carregando IA Integrada e Simulações para ${lead.name}`,
      "info",
    );
  };

  const handleNavigateToDisparos = (lead: any) => {
    setMarketingTargetLeadIds([lead.id]);
    setDashboardVisibility("disparos");
    setActiveTab("dashboard");
    triggerSensoryFeedback("chime", accSettings);
    addNotification(
      "Preparar Campanha",
      `O lead ${lead.name} foi adicionado à fila de campanhas de disparos em massa.`,
      "info",
    );
  };

  const handleAddMultipleToDisparos = (leadIds: string[]) => {
    setMarketingTargetLeadIds(prev => Array.from(new Set([...prev, ...leadIds])));
    triggerSensoryFeedback("chime", accSettings);
    addNotification(
      "Fila de Disparos",
      `${leadIds.length} leads foram adicionados à fila de disparos no mapa.`,
      "success"
    );
  };

  const handleWipeLeads = async () => {
    setLeads([]);
    localStorage.setItem("ciclocred_crm_leads", JSON.stringify([]));
    lastLeadsIdsRef.current = [];
    if (auth.currentUser) {
      try {
        const querySnapshot = await getDocs(collection(db, "leads"));
        for (const d of querySnapshot.docs) {
          await deleteDoc(doc(db, "leads", d.id));
        }
      } catch (e) {
        console.error("Erro ao expurgar leads no Firebase:", e);
      }
    }
    triggerSensoryFeedback("alarm", accSettings);
    addNotification(
      "🗑️ LEADS EXPURGADOS",
      "Toda a base de leads foi limpa com sucesso.",
      "warning",
    );
  };

  const handleWipeProperties = async () => {
    setProperties([]);
    localStorage.setItem("ciclocred_crm_properties", JSON.stringify([]));
    lastPropertiesIdsRef.current = [];
    if (auth.currentUser) {
      try {
        const querySnapshot = await getDocs(collection(db, "properties"));
        for (const d of querySnapshot.docs) {
          await deleteDoc(doc(db, "properties", d.id));
        }
      } catch (e) {
        console.error("Erro ao expurgar properties no Firebase:", e);
      }
    }
    triggerSensoryFeedback("alarm", accSettings);
    addNotification(
      "🏠 ESTOQUE EXPURGADO",
      "Todo o estoque correspondente foi limpo com sucesso.",
      "warning",
    );
  };

  const handleMasterSystemReset = async () => {
    requestConfirmation(
      "🚨 RESETAR CENTRAL DO CRM?",
      "ATENÇÃO: Este é um Master System Reset completo! Ele vai deletar PERMANENTEMENTE toda a sua base de Leads, interações, agendamentos, estoque de imóveis, logs e notificações de todas as memórias do Firebase e do navegador. Seus códigos de sistema continuarão 100% intactos e limpos.",
      async () => {
        try {
          addNotification(
            "⚙️ INICIANDO MASTER RESET",
            "Limpando todos os registros e bancos...",
            "info",
          );

          // 1. Clear state and localStorage
          setLeads([]);
          setProperties([]);
          setAppointments([]);
          setNotifications([]);

          localStorage.removeItem("ciclocred_crm_leads");
          localStorage.removeItem("ciclocred_crm_properties");
          localStorage.removeItem("ciclocred_crm_appointments");
          localStorage.removeItem("ciclocred_crm_notifications");

          lastLeadsIdsRef.current = [];
          lastPropertiesIdsRef.current = [];

          // 2. Wipe Firestore collection leads
          if (auth.currentUser) {
            try {
              const leadsSnap = await getDocs(collection(db, "leads"));
              for (const d of leadsSnap.docs) {
                await deleteDoc(doc(db, "leads", d.id));
              }
            } catch (err) {
              console.error("Erro ao limpar Leads no Firestore:", err);
            }

            try {
              const propsSnap = await getDocs(collection(db, "properties"));
              for (const d of propsSnap.docs) {
                await deleteDoc(doc(db, "properties", d.id));
              }
            } catch (err) {
              console.error("Erro ao limpar Properties no Firestore:", err);
            }
          }

          // 3. Complete and announce success
          triggerSensoryFeedback("alarm", accSettings);
          addNotification(
            "🔥 SISTEMA LIMPO",
            "O CRM foi resetado por completo com sucesso! Pronto para novas tarefas.",
            "success",
          );
          setIsUserCentralModalOpen(false);
        } catch (error: any) {
          alert(
            "Ocorreu um erro durante o reset de segurança: " + error.message,
          );
        }
      },
      "danger",
    );
  };

  const handleSaveLead = async (rawLead: Lead) => {
    let savedLead = { ...rawLead };

    // Validations:
    if (/\d/.test(savedLead.name)) {
      alert('Erro Crítico: O campo "Nome" não deve conter números.');
      return;
    }
    if (
      /[a-zA-Z]/.test(savedLead.phone) ||
      isFictitiousPhone(savedLead.phone)
    ) {
      alert(
        'Erro Crítico: O campo "Telefone" contém letras ou é um número fictício inválido.',
      );
      return;
    }

    let isNew = false;
    setLeads((prevLeads) => {
      const exists = prevLeads.some((l) => l.id === savedLead.id);
      if (!exists) isNew = true;
      if (exists) {
        return prevLeads.map((l) => (l.id === savedLead.id ? savedLead : l));
      } else {
        return [savedLead, ...prevLeads];
      }
    });

    if (auth.currentUser) {
      try {
        const cleanData = JSON.parse(JSON.stringify(savedLead));
        await setDoc(doc(db, "leads", savedLead.id), cleanData);
      } catch (err) {
        console.error("Erro Firebase lead:", err);
      }
    }

    if (isNew) {
      progressGoalCategory("prospecção", 1);
      awardXP(50); // 50 XP for cataloging new prospective client

      syncCRMMovementToGoogleSheet(
        "Lead Cadastrado",
        `Novo prospecto ${savedLead.name} criado | Origem: ${savedLead.origin} | Valor: R$ ${savedLead.value.toLocaleString("pt-BR")}`,
        userName,
      );
    } else {
      syncCRMMovementToGoogleSheet(
        "Lead Atualizado",
        `Cadastro de ${savedLead.name} editado ou atualizado pelo painel CRM.`,
        userName,
      );
    }

    setIsLeadModalOpen(false);
    setSelectedLeadForEdit(null);
  };

  const handleAddNewLeadCapturedPublicly = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    progressGoalCategory("prospecção", 1);
    awardXP(150);
    addNotification(
      "💥 NOVO LEAD CAPTADO!",
      `O cliente ${newLead.name} cadastrou-se no seu Site Público manifestando interesse num valor estimado de R$ ${newLead.value.toLocaleString("pt-BR")}.`,
      "success",
    );

    syncCRMMovementToGoogleSheet(
      "Captura Pública",
      `Lead ${newLead.name} inserido via Site Externo | Telefone: ${newLead.phone} | Orçamento de Investimento: R$ ${newLead.value.toLocaleString("pt-BR")}`,
      "Site Público Captor",
    );
  };

  // Templates CRUD side actions
  const handleAddTemplate = (newTemplate: EmailTemplate) => {
    setTemplates((prev) => [newTemplate, ...prev]);
  };

  const handleEditTemplate = (updatedTemplate: EmailTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    const tempObj = templates.find((t) => t.id === templateId);
    const tempName = tempObj ? tempObj.title : "este modelo";
    requestConfirmation(
      "Remover Modelo de E-mail?",
      `Deseja realmente apagar o template de mensagem "${tempName}"? Isto desativará campanhas de follow-up ligadas a ele.`,
      () => {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        triggerSensoryFeedback("warning", accSettings);
        addNotification(
          "📨 TEMPLATE REMOVIDO",
          `O modelo "${tempName}" foi excluído.`,
          "info",
        );
      },
      "danger",
    );
  };

  const handleSendEmailSimulated = (log: EmailLog) => {
    setEmailLogs((prev) => [log, ...prev]);
    // Tag lead profile with last contacted timestamp
    setLeads((prev) =>
      prev.map((l) =>
        l.id === log.leadId ? { ...l, lastContactAt: log.sentAt } : l,
      ),
    );

    // Automation email trigger gamified XP!
    progressGoalCategory("email", 1);
    awardXP(25); // 25 XP for automated template trigger
  };

  const handleAddAppointment = (newAppt: Appointment) => {
    setAppointments((prev) => [newAppt, ...prev]);

    // Visita goal progress!
    progressGoalCategory("visita", 1);
    awardXP(100); // 100 XP for planning & scheduling a visit!

    syncCRMMovementToGoogleSheet(
      "Visita Agendada",
      `Reunião/Visita agendada para o cliente [${newAppt.leadName}] | Assunto: ${newAppt.title} em ${newAppt.date} às ${newAppt.time}`,
      userName,
    );
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    status: "agendado" | "realizado" | "cancelado",
  ) => {
    let previousStatus: Appointment["status"] | undefined;
    setAppointments((prev) => {
      const appt = prev.find((a) => a.id === id);
      if (appt) previousStatus = appt.status;
      return prev.map((a) => (a.id === id ? { ...a, status } : a));
    });

    if (status === "realizado" && previousStatus !== "realizado") {
      progressGoalCategory("visita", 1);
      awardXP(200); // 200 XP for successfully finishing an operational task!
    }
  };

  const handleDeleteAppointment = (id: string) => {
    const appObj = appointments.find((a) => a.id === id);
    const appTitle = appObj ? appObj.title : "compromisso";
    requestConfirmation(
      "Excluir Agendamento?",
      `Tem certeza que deseja apagar o compromisso comercial "${appTitle}"? Isto desativará o alarme em tempo real no CRM.`,
      () => {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        triggerSensoryFeedback("warning", accSettings);
        addNotification(
          "📅 AGENDAMENTO REMOVIDO",
          "Seu compromisso comercial foi removido dos registros.",
          "info",
        );
      },
      "danger",
    );
  };

  const handleAddProduct = (newProduct: InventoryItem) => {
    setInventory((prev) => [newProduct, ...prev]);
    awardXP(30); // 30 XP for catalog expansion
  };

  const handleUpdateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newQty = Math.max(0, p.quantity + delta);
          let newStatus: "disponivel" | "baixo_estoque" | "esgotado" =
            "disponivel";
          if (newQty === 0) {
            newStatus = "esgotado";
          } else if (newQty < p.minQuantity) {
            newStatus = "baixo_estoque";
          }
          return { ...p, quantity: newQty, status: newStatus };
        }
        return p;
      }),
    );
  };

  const handleDeleteProduct = (id: string) => {
    const prodObj = inventory.find((i) => i.id === id);
    const prodName = prodObj ? prodObj.name : "este item";
    requestConfirmation(
      "Remover Item do Almoxarifado?",
      `Tem certeza que deseja remover o lote "${prodName}" do estoque do almoxarifado?`,
      () => {
        setInventory((prev) => prev.filter((p) => p.id !== id));
        triggerSensoryFeedback("warning", accSettings);
        addNotification(
          "📦 ITEM DELETADO",
          "Registro de produto excluído do almoxarifado.",
          "info",
        );
      },
      "danger",
    );
  };

  const handleAddProperty = (prop: RealEstateProperty) => {
    isLocalPropertiesChangeRef.current = true;
    setProperties((prev) => {
      const filtered = prev.filter((p) => p.id !== prop.id);
      return [prop, ...filtered];
    });
    awardXP(50); // 50 XP for cataloging product assets

    syncCRMMovementToGoogleSheet(
      "Imóvel Catalogado",
      `Imóvel [${prop.code}] ${prop.title} registrado em ${prop.neighborhood} | R$ ${prop.price.toLocaleString("pt-BR")}`,
      userName,
    );
  };

  const handleAddBulkProperties = (newProps: RealEstateProperty[]) => {
    isLocalPropertiesChangeRef.current = true;
    setProperties((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filteredNew = newProps.filter((p) => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });
    awardXP(120); // 120 XP for bulk portfolio uploads

    syncCRMMovementToGoogleSheet(
      "Carga em Lote de Estoque",
      `Importados ${newProps.length} imóveis/lotes residenciais com sucesso para o catálogo universal.`,
      userName,
    );
  };

  const handleAddBulkLeads = (newLeads: Lead[]) => {
    // 1. Immediately save to localStorage to guarantee maximum local persistence
    const saved = localStorage.getItem("ciclocred_crm_leads");
    let currentLeadsList: Lead[] = [];
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) currentLeadsList = parsed;
      }
    } catch (_) {}
    const existingIds = new Set(currentLeadsList.map((l) => l.id));
    const filteredNew = newLeads.filter((l) => !existingIds.has(l.id));
    const updatedLeadsList = [...filteredNew, ...currentLeadsList];
    localStorage.setItem(
      "ciclocred_crm_leads",
      JSON.stringify(updatedLeadsList),
    );

    // 2. Set leads state
    isLocalLeadsChangeRef.current = true;
    rawSetLeads(updatedLeadsList);

    // 3. Immediately sync new leads to Firestore in batch to prevent network delays or race conditions from dropping them!
    if (auth.currentUser && !forceLocalStorageMode && !isQuotaExceeded) {
      const dbSyncLeads = async () => {
        try {
          const CHUNK_SIZE = 450;
          for (let i = 0; i < filteredNew.length; i += CHUNK_SIZE) {
            const chunk = filteredNew.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            chunk.forEach((l) => {
              const cleanData = JSON.parse(JSON.stringify(l));
              batch.set(doc(db, "leads", l.id), cleanData);
            });
            await batch.commit();
          }
          // Merge newly synced IDs into lastLeadsIdsRef to keep general sync loop consistent
          const nextSet = new Set([
            ...lastLeadsIdsRef.current,
            ...filteredNew.map((l) => l.id),
          ]);
          lastLeadsIdsRef.current = Array.from(nextSet);
        } catch (dbErr) {
          console.error(
            "Erro ao sincronizar lote importado no Firestore:",
            dbErr,
          );
        }
      };
      dbSyncLeads();
    }

    // Big bulk lead prospecting multiplier!
    progressGoalCategory("prospecção", newLeads.length);
    awardXP(newLeads.length * 20); // 20 XP per lead imported

    syncCRMMovementToGoogleSheet(
      "Importação em Lote de Leads",
      `Carga de ${newLeads.length} novos leads inseridos via planilha (.xlsx / .csv).`,
      userName,
    );
  };

  const handleDeleteProperty = (id: string) => {
    const propObj = properties.find((p) => p.id === id);
    const propTitle = propObj ? propObj.title : "imóvel";
    requestConfirmation(
      "Excluir Imóvel do Estoque?",
      `Tem certeza que deseja apagar o imóvel "${propTitle}"? Isto removerá sua divulgação no Site de Captação Público.`,
      () => {
        isLocalPropertiesChangeRef.current = true;
        setProperties((prev) => prev.filter((p) => p.id !== id));
        triggerSensoryFeedback("warning", accSettings);
        addNotification(
          "🏠 IMÓVEL DELETADO",
          "Propriedade retirada do estoque de captação.",
          "warning",
        );
      },
      "danger",
    );
  };

  const handleDeleteMultiplePropertiesHandler = async (ids: string[]) => {
    isLocalPropertiesChangeRef.current = true;
    setProperties((prev) => prev.filter((p) => !ids.includes(p.id)));

    // 2. Update localStorage
    const saved = localStorage.getItem("ciclocred_crm_properties");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((p: any) => !ids.includes(p.id));
          localStorage.setItem(
            "ciclocred_crm_properties",
            JSON.stringify(updated),
          );
        }
      } catch (_) {}
    }

    // 3. Update Firestore immediately
    if (auth.currentUser) {
      try {
        const CHUNK_SIZE = 450;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
          const chunk = ids.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((id) => {
            batch.delete(doc(db, "properties", id));
          });
          await batch.commit();
        }
      } catch (err) {
        console.error("Erro ao deletar múltiplas props no Firestore:", err);
      }
    }
  };

  const handleUpdatePropertyStatus = (
    id: string,
    status: "disponivel" | "reservado" | "vendido",
  ) => {
    isLocalPropertiesChangeRef.current = true;
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  };

  const handleUpdateProperty = (updated: RealEstateProperty) => {
    isLocalPropertiesChangeRef.current = true;
    setProperties((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  };

  // Aggregated home stats computation
  const totalLeads = leads.length;
  const totalPipelineValue = leads.reduce((sum, l) => sum + l.value, 0);
  const conversionRate =
    totalLeads > 0
      ? Math.round(
          (leads.filter((l) => l.status === "fechado").length / totalLeads) *
            100,
        )
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
  const fontStyle =
    accSettings.fontSizeClass === "large"
      ? { fontSize: "110%" }
      : accSettings.fontSizeClass === "extra-large"
        ? { fontSize: "122%" }
        : {};

  let rootClass = "flex h-screen overflow-hidden font-sans ";
  if (theme === "claro") {
    rootClass += "bg-zinc-50 text-zinc-900";
  } else if (theme === "escuro") {
    rootClass += "bg-zinc-950 text-zinc-100";
  } else {
    // galatico
    rootClass +=
      "bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 text-indigo-100";
  }

  const handleGoogleSheetsImport = async () => {
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) token = result.accessToken;
      }
      if (!token) return;

      const showPicker = (oauthToken: string) => {
        const origin = window.location.origin;
        if (!(window as any).google?.picker) {
          addNotification(
            "Acesso Autorizado",
            "Aguarde o carregamento do explorador...",
            "info",
          );
          return;
        }
        const picker = new (window as any).google.picker.PickerBuilder()
          .addView((window as any).google.picker.ViewId.SPREADSHEETS)
          .setOAuthToken(oauthToken)
          .setDeveloperKey("") // Uses origin implicitly
          .setCallback(async (data: any) => {
            if (data.action === (window as any).google.picker.Action.PICKED) {
              const file = data.docs[0];
              await importFromGoogleSheet(file.id, oauthToken);
            }
          })
          .setOrigin(origin)
          .build();
        picker.setVisible(true);
      };

      if ((window as any).gapi && !(window as any).google?.picker) {
        (window as any).gapi.load("picker", () => showPicker(token as string));
      } else {
        showPicker(token);
      }
    } catch (err: any) {
      alert("Erro ao abrir importador Google Sheets: " + err.message);
    }
  };

  const importFromGoogleSheet = async (sheetId: string, token: string) => {
    try {
      addNotification(
        "Conectando...",
        "A extração dos dados foi iniciada.",
        "info",
      );
      setIsImportModalOpen(false);

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A2:G100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok)
        throw new Error("Não foi possível ler as colunas da primeira página.");
      const data = await res.json();
      const rows = data.values || [];
      if (rows.length === 0) {
        alert("A planilha selecionada está vazia!");
        return;
      }
      let count = 0;
      const parsedLeads: Lead[] = [];
      for (const row of rows) {
        if (!row[0]) continue;
        parsedLeads.push({
          id: `sheet-lead-${Date.now()}-${count}`,
          name: row[0] || "Nome",
          email: row[1] || "sem@email.com",
          phone: row[2] || "",
          familyIncome: row[3]
            ? parseFloat(row[3].replace(/[^\d.-]/g, ""))
            : 4500,
          value: row[4] ? parseFloat(row[4].replace(/[^\d.-]/g, "")) : 0,
          status: "novo",
          origin: row[5] || "Google Sheets",
          notes: row[6] || "Importado via API",
          fluxoId: importPipeline,
          createdAt: new Date().toISOString(),
        });
        count++;
      }
      handleAddBulkLeads(parsedLeads);
      addNotification(
        "📥 PLANILHA IMPORTADA",
        `${count} leads carregados do Sheets de forma 100% nativa.`,
        "success",
      );
      triggerSensoryFeedback("success", accSettings);
    } catch (e: any) {
      alert("Erro ao ler dados da planilha: " + e.message);
    }
  };

  const currentBgConfig = appBackgrounds[activeTab];
  const activeIndex = bgIndices[activeTab] || 0;
  const currentBgImage = currentBgConfig?.images[activeIndex < currentBgConfig.images.length ? activeIndex : 0];

  return (
    <div
      className={`min-h-screen transition-colors  ${theme === "escuro" || theme === "galatico" ? "dark bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"} ${theme === "galatico" ? "bg-black" : ""} ${accSettings.highContrast ? "contrast-125" : ""}`}
      style={{
        fontSize: `${accSettings.fontScale}%`,
        fontFamily: accSettings.dyslexicFont
          ? "OpenDyslexic, sans-serif"
          : "inherit",
        filter:
          accSettings.daltonism !== "none"
            ? `url(#daltonism-${accSettings.daltonism})`
            : "none",
      }}
      data-palette={palette}
    >
      {accSettings.highLegibilityFont && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          * {
            font-family: Arial, Inter, Helvetica, sans-serif !important;
          }
        `,
          }}
        />
      )}
      {/* Right Core Content viewports wrapper */}
      <div 
        className="relative flex-1 flex flex-col h-screen overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{ 
          backgroundImage: currentBgImage ? `url(${currentBgImage})` : 'none',
        }}
      >
        {currentBgImage && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none z-0" />
        )}
        {/* Unified Neo-Brutalist Layout - Fixed Header */}
        <div
          className={`${currentBgImage ? "bg-black/90 backdrop-blur-md" : "bg-black"} text-white flex items-center justify-between w-full select-none shrink-0 pl-4 md:pl-8 pr-4 py-3 gap-3.5 relative z-40 border-b-4 border-zinc-950 h-auto`}
        >
          {/* User Profile Button with photo or initial - LEFT CORNER */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsUserCentralModalOpen(true);
              }}
              className="relative w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 hover:bg-zinc-750 transition cursor-pointer flex items-center justify-center overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] focus:outline-none"
              title="👤 Central do Usuário"
            >
              {localStorage.getItem("ciclocred_user_photo") &&
              localStorage.getItem("ciclocred_user_photo") !== "" ? (
                <img
                  src={
                    localStorage.getItem("ciclocred_user_photo") || undefined
                  }
                  alt="Perfil"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-indigo-500 font-black text-xs text-zinc-950 flex items-center justify-center uppercase">
                  {userName ? userName.slice(0, 2).toUpperCase() : "U"}
                </div>
              )}
            </button>

            {/* NOVOS BOTÕES: Importar, Exportar e Bloco de Notas (Lado Esquerdo) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => {
                  triggerSensoryFeedback("click", accSettings);
                  setIsImportModalOpen(true);
                }}
                title="📥 Importar Leads"
                className="w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-zinc-300"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  triggerSensoryFeedback("click", accSettings);
                  setIsExportModalOpen(true);
                }}
                title="📤 Exportar Leads"
                className="w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-zinc-300"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  triggerSensoryFeedback("click", accSettings);
                  setIsQuickNotesOpen(true);
                }}
                title="📝 Bloco de Notas Rápido"
                className="w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-amber-400"
              >
                <StickyNote className="w-5 h-5" />
              </button>

              {/* SELETOR DE FLUXO ATIVO DO SISTEMA */}
              <div className="flex items-center gap-1 bg-zinc-900 border-2 border-zinc-950 px-2 py-1.5 h-10 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hover:border-indigo-500">
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider font-mono px-1">Fluxo Ativo:</span>
                <select
                  value={activeSystemFlowId}
                  onChange={(e) => {
                    triggerSensoryFeedback("click", accSettings);
                    setActiveSystemFlowId(e.target.value);
                    window.dispatchEvent(new Event("storage"));
                  }}
                  className="bg-zinc-950 text-white font-bold text-[11px] uppercase border-none focus:ring-0 cursor-pointer rounded px-1.5 py-0.5 outline-none max-w-[150px] truncate"
                >
                  {operationalFlows.map(flow => (
                    <option key={flow.id} value={flow.id} className="bg-zinc-900 text-white font-sans text-xs">
                      {flow.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* RIGHT SIDE HEADER ACTIONS */}
          <div className="flex items-center gap-2 shrink-0">
            {/* NOVO LEAD BUTTON */}
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsLeadModalOpen(true);
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] font-black text-[10px] uppercase tracking-widest transition-all active:translate-y-0.5 active:shadow-none"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Lead</span>
            </button>

            {/* WHATSAPP LOGO BUTTON */}
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                window.location.href = "whatsapp://send";
              }}
              title="Abrir WhatsApp"
              className="w-10 h-10 rounded-xl border-2 border-zinc-950 bg-emerald-500 hover:bg-emerald-600 transition flex items-center justify-center text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </button>

            {/* NOTIFICATIONS BELL */}
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsNotificationsOpen(!isNotificationsOpen);
              }}
              className="relative w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 border-2 border-black rounded-full text-[8px] font-black flex items-center justify-center text-white">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>

            {/* THREE DOTS MORE MENU */}
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsPersonalizationModalOpen(true);
              }}
              title="🎨 Personalização de Layout"
              className="w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating elements removed, integrated natively into the sticky viewport sub-header */}

        <div
          onMouseEnter={() => setIsSidebarVisible(!isSidebarVisible)}
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className="fixed bottom-[30%] right-3 w-8 h-48 z-[60] pointer-events-auto cursor-pointer opacity-0 bg-transparent"
          title="Alternar Ferramentas CRM"
        />

        {/* Vertical Panel Strip: Rich, side-aligned high-level CRM tools */}
        {(() => {
          const isVisibleFinal =
            isSidebarVisible ||
            isAIAssistantOpen ||
            isRuleEngineOpen ||
            isNotificationsOpen;

          const floatingRightPosition = "right-6 md:right-6";

          const handleTabClick = (tab: string) => {
            triggerSensoryFeedback("click", accSettings);
            setActiveTab(tab);
          };

          return (
            <div
              className={`fixed bottom-6 z-50 pointer-events-auto select-none ${floatingRightPosition} ${
                isVisibleFinal
                  ? "block"
                  : "hidden text-transparent pointer-events-none"
              }`}
            >
              {/* Vertical toolbar panel */}
              <div className="flex flex-col flex-nowrap items-center justify-start gap-1 pb-1 pt-1 px-1 bg-zinc-950/90 border-2 border-zinc-700/80 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,0.5)]  w-11">
                {/* 2. Leads */}
                <button
                  onClick={() => handleTabClick("leads")}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-colors cursor-pointer ${
                    activeTab === "leads"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-indigo-300"
                  }`}
                  title="Leads/Clientes"
                >
                  👥
                </button>

                {/* 9. Configurações */}
                <button
                  onClick={() => {
                    handleTabClick("settings");
                    setSettingsModalTab("profile");
                  }}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-colors cursor-pointer ${
                    activeTab === "settings" && settingsModalTab === "profile"
                      ? "bg-indigo-700 border-indigo-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-slate-300"
                  }`}
                  title="Configuração"
                >
                  ⚙️
                </button>

                {/* 10. Logs e Dados */}
                <button
                  onClick={() => {
                    handleTabClick("settings");
                    setSettingsModalTab("database");
                  }}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-colors cursor-pointer ${
                    activeTab === "settings" && settingsModalTab === "database"
                      ? "bg-rose-700 border-rose-450 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-rose-300"
                  }`}
                  title="Dados"
                >
                  💾
                </button>
              </div>
            </div>
          );
        })()}
        {false && (
          <>
            {(() => {
              const floatingRightPosition =
                isNotificationsOpen || isRuleEngineOpen
                  ? "md:right-[472px]"
                  : isAIAssistantOpen
                    ? "md:right-[408px]"
                    : "md:right-6";
              return (
                <>
                  {/* WhatsApp float button stacked precisely above the 👁️ button on the far right */}
                  <div
                    className={`fixed bottom-[74px] right-6 ${floatingRightPosition} z-50 pointer-events-auto select-none transition-colors ease-in-out`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback("click", accSettings);
                        const leadCtx =
                          selectedLeadForDetails || selectedLeadForEdit;
                        if (leadCtx && leadCtx.phone) {
                          const num = leadCtx.phone.replace(/\D/g, "");
                          window.location.href = `whatsapp://send?phone=55${num}`;
                        } else {
                          window.location.href = "whatsapp://send";
                        }
                      }}
                      className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer transition-colors"
                      title="Abrir WhatsApp"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5.5 h-5.5"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className={`fixed bottom-6 right-6 ${floatingRightPosition} z-50 flex flex-row items-center gap-2 pointer-events-auto select-none transition-colors ease-in-out`}
                  >
                    {/* Button 🔻: Toggle filter search bar */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback("click", accSettings);
                        setSearchFiltersVisibility((prev) =>
                          prev === 0 ? 2 : 0,
                        );
                      }}
                      className={`font-mono font-black w-7 h-7 rounded-md flex items-center justify-center border border-zinc-950 shadow-sm hover:translate-y-[-1px] active:translate-y-[0.5px] transition-all cursor-pointer`}
                      title="🔻 Alternar barra de pesquisa e filtros"
                      style={{
                        backgroundColor:
                          searchFiltersVisibility !== 0 ? "#4f46e5" : "#18181b",
                        color: "#f4f4f5",
                      }}
                    >
                      <span className="text-xs select-none leading-none">
                        🔻
                      </span>
                    </button>

                    {/* Button 👁️: Cycle view modes of open tab */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback("click", accSettings);
                        if (activeTab === "leads") {
                          cycleLeadsViewMode();

                        } else {
                          cycleVisibilityFilter();
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black h-7 rounded-md px-2 flex items-center justify-center gap-1 border border-zinc-950 shadow-sm hover:translate-y-[-1px] active:translate-y-[0.5px] transition-all cursor-pointer select-none"
                      title="👁️ Troca a visibilidade da página aberta"
                    >
                      <span className="text-xs select-none leading-none">
                        👁️
                      </span>
                      <span className="uppercase text-[8px] tracking-tight font-black max-w-[80px] truncate block select-none">
                        {activeTab === "leads"
                          ? leadsViewMode
                          : visibilityFilter === "todos"
                            ? "Geral"
                            : visibilityFilter === "my_leads"
                              ? "Meus"
                              : "Prioridade"}
                      </span>
                    </button>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* Main dynamically scrolled workspace content viewport */}
        <main
          className={`relative flex-1 overflow-x-auto overflow-hidden flex flex-col ${
            theme === "claro"
              ? "bg-zinc-100/50"
              : theme === "escuro"
                ? "bg-zinc-900/40"
                : "bg-indigo-950/20 "
          }`}
        >
          {/* SCROLLABLE WORKSPACE AREA: Scrollbar starts below the header nav buttons */}
          <div className={`flex-1 flex flex-col w-full h-full ${activeTab === "google-workspace" ? "overflow-hidden" : "overflow-y-auto px-8 md:px-16 lg:px-24 py-4 md:py-8 space-y-8 pr-2 custom-scrollbar"}`}>
            {isQuotaExceeded && (
              <div className="bg-amber-950/40 border-2 border-amber-500/70 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]  relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-mono tracking-tighter text-7xl select-none select-none pointer-events-none group-hover:scale-105 transition-colors text-amber-500 font-extrabold font-black">
                  FIREBASE
                </div>
                <div className="flex gap-4 items-start max-w-3xl">
                  <div className="p-3 bg-amber-500/25 border border-amber-500/40 text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-6 h-6  shrink-0" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <h4 className="text-sm font-sans font-black uppercase text-amber-400 tracking-wider">
                      ⚠️ COTA DO CLOUD FIRESTORE EXCEDIDA (SPARK FREE TIER)
                    </h4>
                    <p className="text-[12px] opacity-90 leading-relaxed text-amber-100">
                      Você atingiu o limite gratuito diário de gravações ou
                      leituras do Firebase Firestore para este projeto. O
                      sistema ativou automaticamente o{" "}
                      <strong>
                        Modo Off-line Inteligente (Armazenamento Local)
                      </strong>{" "}
                      para que você possa continuar operando, cadastrando leads
                      e usando a IA sem nenhuma interrupção ou perda de
                      informações! Seus dados estão salvos com segurança no
                      localStorage. O sincronismo retornará de forma
                      transparente assim que o Google reiniciar a cota diária
                      (geralmente à meia-noite PST). Mais informações sobre
                      limites sob a coluna de plano <strong>Spark</strong> na
                      seção <strong>Enterprise edition</strong> em{" "}
                      <a
                        href="https://firebase.google.com/pricing#cloud-firestore"
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-amber-300 font-bold"
                      >
                        Firebase Pricing
                      </a>
                      .
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10.5px] font-mono text-amber-300 font-bold uppercase mt-2">
                      <span>
                        • Banco ID:{" "}
                        <code className="bg-zinc-950/50 px-1 py-0.5 rounded text-amber-100 italic font-normal text-[10px]">
                          ai-studio-7295f37f-3832-47f6-8eec-a7e26d15c260
                        </code>
                      </span>
                      <span>
                        • Projeto ID:{" "}
                        <code className="bg-zinc-950/50 px-1 py-0.5 rounded text-amber-100 italic font-normal text-[10px]">
                          project-06c00c3b-56af-4fcd-b6a
                        </code>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3 md:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleForceLocalMode(true)}
                    className="bg-zinc-950 text-amber-500 hover:text-amber-400 font-black font-sans text-xs tracking-wider uppercase px-4 py-3 rounded-xl border border-amber-500/50 hover:border-amber-500 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    ATIVAR MEMÓRIA LOCAL PERMANENTE
                  </button>
                  <a
                    href="https://console.firebase.google.com/project/project-06c00c3b-56af-4fcd-b6a/firestore/databases/ai-studio-7295f37f-3832-47f6-8eec-a7e26d15c260/data?openUpgradeDialog=true"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber-500 hover:bg-amber-600 active:translate-y-0.5 text-zinc-950 font-black font-sans text-xs tracking-wider uppercase px-4 py-3 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>UPGRADE NO CONSOLE</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {/* RENDER ACTIVE TAB */}

            <Suspense
              fallback={<div className="p-8 text-white">Carregando...</div>}
            >
              {/* 1. PAINEL GERAL (REPORTS) REMOVED */}

              {/* 0. DYNAMIC WHATSAPP DASHBOARD */}
              {/* Dashboard WhatsApp REMOVED */}

              {/* 2 & 3. UNIFIED GESTÃO DE LEADS (TABELA / STATUS / FOLLOW-UP MULTI-MODE) */}
              {activeTab === "leads" && (
                <div className="w-full flex-1 flex flex-col min-h-0 space-y-5">
                  {(() => {
                    const hasActiveFilters =
                      searchTerm !== "" ||
                      statusFilter !== "todos" ||
                      stageFilter !== "todos" ||
                      profileFilter !== "todos" ||
                      originFilter !== "todos" ||
                      initialLetterFilter !== "todos" ||
                      regionFilter !== "todos" ||
                      sqmMattersFilter !== "todos" ||
                      incomeTypeFilter !== "todos" ||
                      deadlineMattersFilter !== "todos" ||
                      deliveryExpectedFilter !== "todos" ||
                      genderFilter !== "todos" ||
                      ageBracketFilter !== "todos" ||
                      objectionsFilter !== "todos";

                    const nowTimeVal = Date.now();

                    const leadsAtivos = unifiedFilteredLeads.filter((l) => {
                      const createdTime = new Date(
                        l.createdAt || nowTimeVal,
                      ).getTime();
                      const elapsedH =
                        (nowTimeVal - createdTime) / (1000 * 60 * 60);
                      const hasInteraction = !!(
                        l.lastInteractionAt &&
                        l.lastInteractionAt !== l.createdAt
                      );

                      // Cannot be active if explicitly archived or lost
                      if (
                        l.status === "arquivado" ||
                        l.status === "perdido" ||
                        l.status === "fechado"
                      ) {
                        return false;
                      }

                      // If elapsed time > 24h and no interaction, it's archived, so NOT active
                      if (elapsedH > 24 && !hasInteraction) {
                        return false;
                      }

                      // To be active, it must have received an interaction (if within 24h, it appears here and in recent; if >24h, must have interaction)
                      return hasInteraction;
                    });

                    const leadsRecentes = unifiedFilteredLeads.filter((l) => {
                      if (hasActiveFilters) return true;

                      const createdTime = new Date(
                        l.createdAt || nowTimeVal,
                      ).getTime();
                      const elapsedH =
                        (nowTimeVal - createdTime) / (1000 * 60 * 60);
                      const hasInteraction = !!(
                        l.lastInteractionAt &&
                        l.lastInteractionAt !== l.createdAt
                      );

                      if (l.status === "arquivado" || l.status === "perdido") {
                        return false;
                      }

                      // If elapsed time > 24h and no interaction, it's archived, so NOT recent
                      if (elapsedH > 24 && !hasInteraction) {
                        return false;
                      }

                      // Remains in recent if creation age <= 24 hours (with or without interaction)
                      return elapsedH <= 24;
                    });

                    const currentLeadsArray =
                      leadsViewMode === "recentes"
                        ? leadsRecentes
                        : leadsViewMode === "ativos"
                          ? leadsAtivos
                          : leadsViewMode === "archived"
                            ? unifiedFilteredLeads.filter(
                                (l) =>
                                  l.status === "perdido" ||
                                  l.status === "arquivado" ||
                                  l.status === "fechado",
                              )
                            : unifiedFilteredLeads;

                    return (
                      <div className="w-full flex-1 flex flex-col min-h-0 space-y-8 pb-12">
                        
                        {/* BROADCAST HEADER FOR PÁGINA INICIAL */}
                        <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase group-hover:scale-105 transition-colors">
                            CRM.CORE
                          </div>
                          <div className="flex-1 z-10">
                            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
                              <Users className="w-8 h-8 text-indigo-400" />
                              <span>Página Inicial</span>
                            </h2>
                            <p className="text-xs text-zinc-400 font-bold font-mono mt-1 flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full " />
                              Central de inteligência, prospecção e gestão de fluxos operacionais.
                            </p>
                          </div>
                        </div>
                        {/* BLOCK NAVIGATION TABS - High Performance Refined Layout */}
                        <div className="grid grid-cols-5 gap-3 p-2 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl">
                          <button
                            onClick={() => { triggerSensoryFeedback("click", accSettings); setLeadsViewMode("dashboard"); }}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all ${leadsViewMode === "dashboard" ? "bg-emerald-600 text-white shadow-lg" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"}`}
                          >
                            <MessageSquare className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-black uppercase">WhatsApp</span>
                          </button>
                          <button
                            onClick={() => { triggerSensoryFeedback("click", accSettings); setLeadsViewMode("simulador"); }}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all ${leadsViewMode === "simulador" ? "bg-sky-600 text-white shadow-lg" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"}`}
                          >
                            <Sliders className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-black uppercase">Simulador</span>
                          </button>
                          <button
                            onClick={() => { triggerSensoryFeedback("click", accSettings); setLeadsViewMode("todos"); }}
                            className={`flex flex-col items-center justify-center py-6 -mt-4 rounded-3xl transition-all ${leadsViewMode === "todos" ? "bg-white text-zinc-950 shadow-2xl scale-110 z-10" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                          >
                            <LayoutDashboard className="w-6 h-6 mb-1" />
                            <span className="text-[11px] font-black uppercase">Início</span>
                          </button>
                          <button
                            onClick={() => { triggerSensoryFeedback("click", accSettings); setLeadsViewMode("mapa"); }}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all ${leadsViewMode === "mapa" ? "bg-amber-600 text-white shadow-lg" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"}`}
                          >
                            <Share2 className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-black uppercase">Mapa</span>
                          </button>
                          <button
                            onClick={() => { triggerSensoryFeedback("click", accSettings); setLeadsViewMode("roteiros"); }}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all ${leadsViewMode === "roteiros" ? "bg-indigo-600 text-white shadow-lg" : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"}`}
                          >
                            <Sparkles className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-black uppercase">Fluxos</span>
                          </button>
                        </div>


                        {/* TABELA DINÂMICA UNIFICADA: Toggled views based on eye icon (👁️) click */}
                        <div className="w-full shrink-0">
                          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h2 className="text-xl font-extrabold uppercase tracking-tight flex items-center gap-2 text-indigo-400">
                                <span>TABELA DINÂMICA: {
                                  leadsViewMode === "todos"
                                    ? "Página Inicial"
                                    : leadsViewMode === "dashboard"
                                      ? "WhatsApp Dashboard"
                                      : leadsViewMode === "simulador"
                                        ? "Simulador de Financiamento"
                                        : leadsViewMode === "recentes"
                                          ? "Leads Recentes (Últimas 24h)"
                                          : leadsViewMode === "ativos"
                                            ? "Leads Ativos"
                                        : leadsViewMode === "followups"
                                          ? "Tabela de Follow-ups & Compromissos Gerais"
                                          : leadsViewMode === "archived"
                                            ? "Leads Arquivados / Perdidos"
                                            : leadsViewMode === "disparos"
                                              ? "Fila e Automação de Disparos em Massa"
                                              : leadsViewMode === "kanban"
                                                ? "Visibilidade do Funil"
                                                : leadsViewMode === "mapa"
                                                  ? "Mapa Conectivo (Nós)"
                                                  : leadsViewMode === "roteiros"
                                                    ? "IA Preditiva e Roteiros de Atendimento"
                                                    : "Acervo de Imóveis do Estoque"
                                }</span>
                              </h2>
                              <p className="text-xs text-zinc-400">
                                {leadsViewMode === "disparos"
                                  ? "Gerencie a fila de disparos de mensagens, templates de respostas e histórico de envios ativos diretamente."
                                  : leadsViewMode === "kanban"
                                    ? "Arraste e solte cartões de leads para mover as etapas de status e gerenciar o funil visualmente."
                                    : leadsViewMode === "mapa"
                                      ? "Visualize as conexões, fluxos e interações dos leads de forma gráfica e interativa."
                                      : leadsViewMode === "roteiros"
                                        ? "Gerencie a comunicação do lead com roteiros de atendimento gerados por Inteligência Artificial."
                                        : leadsViewMode === "estoque"
                                          ? "Visualize, gerencie e faça o download de mídias e fotos do acervo imobiliário disponível."
                                          : leadsViewMode === "followups"
                                            ? "Gerencie, filtre e acompanhe todos os agendamentos, visitas e tarefas de follow-up integrados com os leads."
                                            : "Utilize as bordas translúcidas laterais para alternar entre as visibilidades em sequência."
                                }
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-zinc-850 text-zinc-300 font-mono text-xs font-black rounded-lg border-2 border-zinc-950 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] self-start md:self-center">
                              Visão Ativa: {leadsViewMode}
                            </span>
                          </div>

                          {leadsViewMode === "disparos" ? (
                            <div className="p-4 bg-zinc-900/40 rounded-2xl border-2 border-zinc-950">
                              <EmailAutomation
                                leads={leads}
                                globalFilteredLeads={unifiedFilteredLeads}
                                globalSearchTerm={searchTerm}
                                templates={templates}
                                logs={emailLogs}
                                onAddTemplate={handleAddTemplate}
                                onEditTemplate={handleEditTemplate}
                                onDeleteTemplate={handleDeleteTemplate}
                                onSendEmailSimulated={handleSendEmailSimulated}
                                theme={theme}
                                accSettings={accSettings}
                                forcedSubTab="massa"
                                setEmailLogs={setEmailLogs}
                                addNotification={addNotification}
                                onlyTable={false}
                                tableHeaderComponent={(ids, actions) =>
                                  renderTableSearchBar({
                                    selectedLeadIds: ids,
                                    blockActions: {
                                      openCampaignModal: actions?.openCampaignModal,
                                      onDelete: handleDeleteMultipleLeadsHandler,
                                    },
                                  })
                                }
                              />
                            </div>
                          ) : leadsViewMode === "kanban" ? (
                            <div className="space-y-4">
                              <div
                                className={`flex-1 ${kanbanHyperfocus === 1 ? "overflow-visible" : "overflow-hidden"}`}
                              >
                                <KanbanBoard
                                  layoutZoom={layoutZoom}
                                  leads={currentLeadsArray}
                                  properties={properties}
                                  onMoveLead={handleMoveLead}
                                  onAddToDispatchQueue={handleAddMultipleToDisparos}
                                  importBatches={operationalServiceOrders}
                                  operationalFlows={operationalFlows}
                                  activeSystemFlowId={activeSystemFlowId}
                                  onOSClick={(os) => {
                                    setSelectedOSForDetails(os);
                                    setIsOSDetailsModalOpen(true);
                                  }}
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
                                    setDefaultStatusForCreate(status || "novo");
                                    setIsLeadModalOpen(true);
                                  }}
                                  showOrganizer={kanbanShowOrganizer}
                                  setShowOrganizer={setKanbanShowOrganizer}
                                  hyperfocusActive={kanbanHyperfocus}
                                  setHyperfocusActive={setKanbanHyperfocus}
                                  triggerCreateStatus={kanbanTriggerCreateStatus}
                                  setTriggerCreateStatus={
                                    setKanbanTriggerCreateStatus
                                  }
                                  triggerCreatePage={kanbanTriggerCreatePage}
                                  setTriggerCreatePage={
                                    setKanbanTriggerCreatePage
                                  }
                                  triggerEditPage={kanbanTriggerEditPage}
                                  setTriggerEditPage={setKanbanTriggerEditPage}
                                  triggerDeletePage={kanbanTriggerDeletePage}
                                  setTriggerDeletePage={
                                    setKanbanTriggerDeletePage
                                  }
                                  triggerHyperfocus={kanbanTriggerHyperfocus}
                                  setTriggerHyperfocus={setKanbanTriggerHyperfocus}
                                  onOpenAIAssistant={handleOpenAIAssistant}
                                  onOpenRuleEngine={handleOpenRuleEngine}
                                  renderOnlyColumns={true}
                                />
                              </div>
                            </div>
                          ) : leadsViewMode === "mapa" ? (
                            <div className="space-y-4">
                              <div className="flex-1 overflow-hidden">
                                <KanbanBoard
                                  layoutZoom={layoutZoom}
                                  leads={currentLeadsArray}
                                  properties={properties}
                                  onMoveLead={handleMoveLead}
                                  onAddToDispatchQueue={handleAddMultipleToDisparos}
                                  importBatches={operationalServiceOrders}
                                  operationalFlows={operationalFlows}
                                  activeSystemFlowId={activeSystemFlowId}
                                  onOSClick={(os) => {
                                    setSelectedOSForDetails(os);
                                    setIsOSDetailsModalOpen(true);
                                  }}
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
                                    setDefaultStatusForCreate(status || "novo");
                                    setIsLeadModalOpen(true);
                                  }}
                                  showOrganizer={kanbanShowOrganizer}
                                  setShowOrganizer={setKanbanShowOrganizer}
                                  hyperfocusActive={kanbanHyperfocus}
                                  setHyperfocusActive={setKanbanHyperfocus}
                                  triggerCreateStatus={kanbanTriggerCreateStatus}
                                  setTriggerCreateStatus={
                                    setKanbanTriggerCreateStatus
                                  }
                                  triggerCreatePage={kanbanTriggerCreatePage}
                                  setTriggerCreatePage={
                                    setKanbanTriggerCreatePage
                                  }
                                  triggerEditPage={kanbanTriggerEditPage}
                                  setTriggerEditPage={setKanbanTriggerEditPage}
                                  triggerDeletePage={kanbanTriggerDeletePage}
                                  setTriggerDeletePage={
                                    setKanbanTriggerDeletePage
                                  }
                                  triggerHyperfocus={kanbanTriggerHyperfocus}
                                  setTriggerHyperfocus={setKanbanTriggerHyperfocus}
                                  onOpenAIAssistant={handleOpenAIAssistant}
                                  onOpenRuleEngine={handleOpenRuleEngine}
                                  renderOnlyMap={true}
                                />
                              </div>
                              {marketingTargetLeadIds.length > 0 && (
                                <div className="mt-4 border-t-2 border-dashed border-zinc-700 pt-4 relative bg-zinc-950 p-4 rounded-xl shadow-xl">
                                  <button onClick={() => setMarketingTargetLeadIds([])} className="absolute -top-3 right-4 bg-zinc-900 border-2 border-zinc-950 px-3 py-1 text-[10px] font-black uppercase text-red-400 rounded-full hover:bg-red-950 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 cursor-pointer flex items-center gap-1">❌ Fechar Painel de Disparos</button>
                                  <EmailAutomation
                                    leads={leads}
                                    globalFilteredLeads={unifiedFilteredLeads}
                                    globalSearchTerm={searchTerm}
                                    templates={templates}
                                    logs={emailLogs}
                                    onAddTemplate={handleAddTemplate}
                                    onEditTemplate={handleEditTemplate}
                                    onDeleteTemplate={handleDeleteTemplate}
                                    onSendEmailSimulated={handleSendEmailSimulated}
                                    theme={theme}
                                    accSettings={accSettings}
                                    initialTargetLeadIds={marketingTargetLeadIds}
                                    onClearInitialTargets={() => setMarketingTargetLeadIds([])}
                                    setEmailLogs={setEmailLogs}
                                    addNotification={addNotification}
                                  />
                                </div>
                              )}
                            </div>
                          ) : leadsViewMode === "roteiros" ? (
                            <div className="space-y-8">
                              {/* Painel Operacional Inteligente Hub (Centralizado) */}
                              <IntelligenceDashboard 
                                leads={enrichedLeads}
                                properties={properties}
                                onOpenLead={(lead) => {
                                  setSelectedLeadForDetails(lead);
                                  setIsDetailsModalOpen(true);
                                }}
                                addNotification={addNotification}
                                importBatches={operationalServiceOrders}
                                onNewOS={() => {
                                  setSelectedOSForDetails(null);
                                  setIsOSDetailsModalOpen(true);
                                }}
                                onNewImport={() => setIsImportModalOpen(true)}
                                onAskCEOCopilot={handleAskCEOCopilot}
                              />

                              <div className="p-4 bg-zinc-900/40 rounded-2xl border-2 border-zinc-950">
                                <ScriptsAndFlows
                                  leads={leads}
                                  onUpdateLeadField={handleUpdateLeadField}
                                  accSettings={accSettings}
                                  triggerSensoryFeedback={triggerSensoryFeedback}
                                  addNotification={addNotification}
                                  initialSearchTerm={scriptSearchTerm || searchTerm}
                                  onChangeSearchTerm={setScriptSearchTerm}
                                  onDeleteLead={handleDeleteLead}
                                  onDeleteMultipleLeads={handleDeleteMultipleLeadsHandler}
                                  operationalFlows={operationalFlows}
                                  setOperationalFlows={setOperationalFlows}
                                  operationalServiceOrders={operationalServiceOrders}
                                  setOperationalServiceOrders={setOperationalServiceOrders}
                                  onOSClick={(os) => {
                                    setSelectedOSForDetails(os);
                                    setIsOSDetailsModalOpen(true);
                                  }}
                                />
                              </div>
                            </div>
                          ) : leadsViewMode === "followups" ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-zinc-900/40 rounded-2xl border-2 border-zinc-950">
                                <FollowUpsTable
                                  appointments={appointments}
                                  setAppointments={setAppointments}
                                  leads={leads}
                                  onOpenLeadDetails={(lead) => {
                                    setSelectedLeadForDetails(lead);
                                    setIsDetailsModalOpen(true);
                                  }}
                                  awardXP={(xp) => awardXP(xp)}
                                  addNotification={addNotification}
                                />
                              </div>
                            </div>
                          ) : leadsViewMode === "estoque" ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-zinc-900/40 rounded-2xl border-2 border-zinc-950">
                                <RealEstateInventory
                                  leads={leads}
                                  globalFilteredLeads={unifiedFilteredLeads}
                                  globalSearchTerm={searchTerm}
                                  properties={properties}
                                  setProperties={setProperties}
                                  onAddProperty={handleAddProperty}
                                  onAddBulkProperties={handleAddBulkProperties}
                                  onAddBulkLeads={handleAddBulkLeads}
                                  onDeleteProperty={handleDeleteProperty}
                                  onDeleteMultipleProperties={
                                    handleDeleteMultiplePropertiesHandler
                                  }
                                  onUpdatePropertyStatus={handleUpdatePropertyStatus}
                                  onUpdateProperty={handleUpdateProperty}
                                  onUpdateLeadField={handleUpdateLeadField}
                                  theme={theme}
                                  accSettings={accSettings}
                                  addNotification={addNotification}
                                  awardXP={(xp, cause) => awardXP(xp)}
                                />
                              </div>
                            </div>
                          ) : leadsViewMode === "dashboard" ? (
                            <div className="flex flex-col space-y-6 w-full select-none">
                              <div className="bg-gradient-to-br from-zinc-900 to-emerald-950/70 border-4 border-zinc-950 p-6 md:p-8 rounded-[30px] shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-white relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
                                <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase">
                                  WA.CONN
                                </div>
                                <div className="relative z-10 space-y-5">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500  inline-block" />
                                    Iniciação Automática Ativa
                                  </span>
                                  <div className="space-y-2">
                                    <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-emerald-400 shrink-0">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                      </svg>
                                      <span>Porta de Comunicação WhatsApp</span>
                                    </h1>
                                    <p className="text-xs text-zinc-350 leading-relaxed font-sans max-w-2xl">
                                      Sempre que o Cury Constelação CRM é iniciado, este canal prepara a esteira de conexões para disparos automatizados e fomento. Utilize o acionamento direto abaixo.
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-4 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerSensoryFeedback("click", accSettings);
                                        setDashboardVisibility("disparos");
                                      }}
                                      className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest transition-all rounded-xl border-2 flex items-center gap-2 whitespace-nowrap ${dashboardVisibility === "disparos" ? "bg-emerald-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"}`}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      <span>Tabela de Disparos</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerSensoryFeedback("click", accSettings);
                                        setDashboardVisibility("scripts-roteiros");
                                      }}
                                      className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest transition-all rounded-xl border-2 flex items-center gap-2 whitespace-nowrap ${dashboardVisibility === "scripts-roteiros" ? "bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"}`}
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Biblioteca de Scripts</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerSensoryFeedback("click", accSettings);
                                        setDashboardVisibility("envios-realizados");
                                      }}
                                      className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest transition-all rounded-xl border-2 flex items-center gap-2 whitespace-nowrap ${dashboardVisibility === "envios-realizados" ? "bg-zinc-100 text-zinc-900 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"}`}
                                    >
                                      <History className="w-4 h-4" />
                                      <span>Histórico</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerSensoryFeedback("success", accSettings);
                                        window.location.href = "whatsapp://send";
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-zinc-950 font-black font-sans text-xs tracking-wider uppercase px-6 py-4 rounded-xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-colors flex items-center gap-2 cursor-pointer ml-auto"
                                    >
                                      <span>ABRIR WHATSAPP MANUALMENTE</span>
                                      <ExternalLink className="w-4 h-4 shrink-0" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="w-full">
                                <MultiLevelMarketingTab
                                  leads={leads}
                                  globalFilteredLeads={unifiedFilteredLeads}
                                  globalSearchTerm={searchTerm}
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
                                  tableHeaderComponent={(ids, actions) => renderTableSearchBar({ selectedLeadIds: ids, blockActions: actions })}
                                  forcedSubTab={dashboardVisibility === "disparos" ? "massa" : dashboardVisibility === "scripts-roteiros" ? "templates" : "logs"}
                                  setEmailLogs={setEmailLogs}
                                />
                              </div>
                            </div>
                          ) : leadsViewMode === "simulador" ? (
                            <div className="w-full">
                              <FinanceSimulatorTab
                                leads={leads}
                                theme={theme}
                                accSettings={accSettings}
                                addNotification={addNotification}
                                awardXP={(xp, cause) => awardXP(xp)}
                              />
                            </div>
                          ) : leadsViewMode === "todos" ? (
                            <div className="flex flex-col gap-12 w-full">
                              {/* 1. Acervo de Imóveis do Estoque */}
                              <div className="space-y-4">
                                <h2 className="text-xl font-black font-mono text-zinc-900 uppercase flex items-center gap-2">
                                  <span>🏢 Acervo de Imóveis do Estoque</span>
                                </h2>
                                <div className="p-4 bg-zinc-900/40 rounded-2xl border-2 border-zinc-950">
                                  <RealEstateInventory
                                    leads={leads}
                                    globalFilteredLeads={unifiedFilteredLeads}
                                    globalSearchTerm={searchTerm}
                                    properties={properties}
                                    setProperties={setProperties}
                                    onAddProperty={handleAddProperty}
                                    onAddBulkProperties={handleAddBulkProperties}
                                    onAddBulkLeads={handleAddBulkLeads}
                                    onDeleteProperty={handleDeleteProperty}
                                    onDeleteMultipleProperties={handleDeleteMultiplePropertiesHandler}
                                    onUpdatePropertyStatus={handleUpdatePropertyStatus}
                                    onUpdateProperty={handleUpdateProperty}
                                    onUpdateLeadField={handleUpdateLeadField}
                                    theme={theme}
                                    accSettings={accSettings}
                                    addNotification={addNotification}
                                    awardXP={(xp, cause) => awardXP(xp)}
                                  />
                                </div>
                              </div>

                              {/* 2. Página Inicial (Tabela principal) */}
                              <div className="space-y-4">
                                <h2 className="text-xl font-black font-mono text-zinc-900 uppercase flex items-center gap-2">
                                  <span>🏠 Página Inicial</span>
                                </h2>
                                <LeadList
                                  leads={currentLeadsArray}
                                  tableHeaderComponent={(ids, actions) =>
                                    renderTableSearchBar({
                                      selectedLeadIds: ids,
                                      blockActions: {
                                        openCampaignModal: actions.openCampaignModal,
                                        openBulkScheduleModal: actions.openBulkScheduleModal,
                                        onDelete: handleDeleteMultipleLeadsHandler,
                                      },
                                    })
                                  }
                                  onOpenLeadDetails={(lead) => {
                                    setSelectedLeadForDetails(lead);
                                    setIsDetailsModalOpen(true);
                                  }}
                                  renderInlineLeadDetails={(lead) => (
                                    <LeadDetailsModal
                                      isOpen={true}
                                      lead={lead}
                                      emailLogs={emailLogs}
                                      actionLogs={actionLogs}
                                      properties={properties}
                                      onClose={() => {}}
                                      onUpdateLeadNotes={handleUpdateNotes}
                                      onUpdateLeadStatus={handleMoveLead}
                                      onUpdateLeadFamilyIncome={handleUpdateFamilyIncome}
                                      onUpdateLeadFull={handleUpdateLeadFull}
                                      awardXP={(xp) => awardXP(xp)}
                                      onOpenAIAssistant={handleOpenAIAssistant}
                                      onOpenRuleEngine={handleOpenRuleEngine}
                                      appointments={appointments}
                                      setAppointments={setAppointments}
                                      onOpenEditModal={(l) => {
                                        setSelectedLeadForEdit(l);
                                        setIsLeadModalOpen(true);
                                      }}
                                      onDeleteLead={handleDeleteLead}
                                      onNavigateToFollowUp={() => {}}
                                      isInline={true}
                                    />
                                  )}
                                  onOpenEditModal={(lead) => {
                                    setSelectedLeadForEdit(lead);
                                    setIsLeadModalOpen(true);
                                  }}
                                  onDeleteLead={handleDeleteLead}
                                  onOpenCreateModal={() => {
                                    setSelectedLeadForEdit(null);
                                    setDefaultStatusForCreate("novo");
                                    setIsLeadModalOpen(true);
                                  }}
                                  onMoveLead={handleMoveLead}
                                  onNavigateToFollowUp={(lead) => {
                                    setActiveTab("dashboard");
                                  }}
                                  onAddBulkLeads={handleAddBulkLeads}
                                  onDeleteMultipleLeads={handleDeleteMultipleLeadsHandler}
                                  onUpdateLeadField={handleUpdateLeadField}
                                  awardXP={awardXP}
                                  addNotification={addNotification}
                                  appointments={appointments}
                                  setAppointments={setAppointments}
                                  searchTerm={searchTerm}
                                  setSearchTerm={setSearchTerm}
                                  statusFilter={statusFilter}
                                  setStatusFilter={setStatusFilter}
                                  originFilter={originFilter}
                                  setOriginFilter={setOriginFilter}
                                  initialLetterFilter={initialLetterFilter}
                                  setInitialLetterFilter={setInitialLetterFilter}
                                  regionFilter={regionFilter}
                                  profileFilter={profileFilter}
                                  stageFilter={stageFilter}
                                  objectionFilter={objectionsFilter}
                                  programaDesejadoFilter={programaDesejadoFilter}
                                  restricaoBacenFilter={restricaoBacenFilter}
                                  genderFilter={genderFilter}
                                  familyIncomeFilter={familyIncomeFilter}
                                  incomeTypeFilter={incomeTypeFilter}
                                  deliveryExpectedFilter={deliveryExpectedFilter}
                                  theme={theme}
                                  isTodosView={leadsViewMode === "todos"}
                                  isActiveLeadsView={leadsViewMode === "ativos"}
                                  onOpenAIAssistant={handleOpenAIAssistant}
                                  onOpenRuleEngine={handleOpenRuleEngine}
                                />
                              </div>

                              {/* 3. Follow-Ups e Compromissos Gerais */}
                              <div className="space-y-4">
                                <h2 className="text-xl font-black font-mono text-zinc-900 uppercase flex items-center gap-2">
                                  <span>📅 Follow-Ups e Compromissos Gerais</span>
                                </h2>
                                <div className="p-4 bg-zinc-900/40 rounded-2xl border-2 border-zinc-950">
                                  <FollowUpsTable
                                    appointments={appointments}
                                    setAppointments={setAppointments}
                                    leads={leads}
                                    onOpenLeadDetails={(lead) => {
                                      setSelectedLeadForDetails(lead);
                                      setIsDetailsModalOpen(true);
                                    }}
                                    awardXP={(xp) => awardXP(xp)}
                                    addNotification={addNotification}
                                  />
                                </div>
                              </div>

                              {/* 4. Visibilidade do Funil */}
                              <div className="space-y-4">
                                <h2 className="text-xl font-black font-mono text-zinc-900 uppercase flex items-center gap-2">
                                  <span>🚀 Visibilidade do Funil</span>
                                </h2>
                                <div className="flex-1 overflow-visible">
                                  <KanbanBoard
                                    layoutZoom={layoutZoom}
                                    leads={currentLeadsArray}
                                    properties={properties}
                                    onMoveLead={handleMoveLead}
                                    onAddToDispatchQueue={handleAddMultipleToDisparos}
                                    importBatches={operationalServiceOrders}
                                    operationalFlows={operationalFlows}
                                    activeSystemFlowId={activeSystemFlowId}
                                    onOSClick={(os) => {
                                      setSelectedOSForDetails(os);
                                      setIsOSDetailsModalOpen(true);
                                    }}
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
                                      setDefaultStatusForCreate(status || "novo");
                                      setIsLeadModalOpen(true);
                                    }}
                                    showOrganizer={kanbanShowOrganizer}
                                    setShowOrganizer={setKanbanShowOrganizer}
                                    hyperfocusActive={kanbanHyperfocus}
                                    setHyperfocusActive={setKanbanHyperfocus}
                                    triggerCreateStatus={kanbanTriggerCreateStatus}
                                    setTriggerCreateStatus={setKanbanTriggerCreateStatus}
                                    triggerCreatePage={kanbanTriggerCreatePage}
                                    setTriggerCreatePage={setKanbanTriggerCreatePage}
                                    triggerEditPage={kanbanTriggerEditPage}
                                    setTriggerEditPage={setKanbanTriggerEditPage}
                                    triggerDeletePage={kanbanTriggerDeletePage}
                                    setTriggerDeletePage={setKanbanTriggerDeletePage}
                                    triggerHyperfocus={kanbanTriggerHyperfocus}
                                    setTriggerHyperfocus={setKanbanTriggerHyperfocus}
                                    onOpenAIAssistant={handleOpenAIAssistant}
                                    onOpenRuleEngine={handleOpenRuleEngine}
                                    renderOnlyColumns={true}
                                  />
                                </div>
                              </div>

                              {/* 5. Painel Geral */}
                              <div className="space-y-4">
                                <h2 className="text-xl font-black font-mono text-zinc-900 uppercase flex items-center gap-2">
                                  <span>📈 Painel Geral</span>
                                </h2>
                                <Reports 
                                  leads={leads}
                                  appointments={appointments}
                                  emailLogs={emailLogs}
                                />
                              </div>

                              {/* 6. Mapa Conectivo */}
                              <div className="space-y-4 mt-8">
                                <h2 className="text-xl font-black font-mono text-zinc-900 uppercase flex items-center gap-2">
                                  <span>🗺️ Mapa Conectivo de Leads</span>
                                </h2>
                                <div className="p-6 bg-zinc-900 border-4 border-zinc-950 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-white">
                                  <div className="mb-4">
                                    <span className="text-[10px] uppercase font-mono font-black text-indigo-400 block">Visualização Gráfica Integrada</span>
                                    <p className="text-xs text-zinc-400 font-medium mt-0.5">Visão consolidada das conexões estruturadas, fluxo operacional e clusters de relacionamento.</p>
                                  </div>
                                  <div className="h-[450px] overflow-hidden rounded-2xl border-2 border-zinc-850 bg-zinc-950/20 relative">
                                    <KanbanBoard
                                      layoutZoom={layoutZoom}
                                      leads={currentLeadsArray}
                                      properties={properties}
                                      onMoveLead={handleMoveLead}
                                      onAddToDispatchQueue={handleAddMultipleToDisparos}
                                      importBatches={operationalServiceOrders}
                                      operationalFlows={operationalFlows}
                                      activeSystemFlowId={activeSystemFlowId}
                                      onOSClick={(os) => {
                                      setSelectedOSForDetails(os);
                                      setIsOSDetailsModalOpen(true);
                                    }}
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
                                      setDefaultStatusForCreate(status || "novo");
                                      setIsLeadModalOpen(true);
                                    }}
                                    showOrganizer={false}
                                    setShowOrganizer={() => {}}
                                    hyperfocusActive={3}
                                    setHyperfocusActive={() => {}}
                                    triggerCreateStatus={false}
                                    setTriggerCreateStatus={() => {}}
                                    renderOnlyMap={true}
                                  />
                                </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <LeadList
                               leads={currentLeadsArray}
                               tableHeaderComponent={(ids, actions) =>
                                 renderTableSearchBar({
                                   selectedLeadIds: ids,
                                   blockActions: {
                                     openCampaignModal: actions.openCampaignModal,
                                     openBulkScheduleModal: actions.openBulkScheduleModal,
                                     onDelete: handleDeleteMultipleLeadsHandler,
                                   },
                                 })
                               }
                               onOpenLeadDetails={(lead) => {
                                 setSelectedLeadForDetails(lead);
                                 setIsDetailsModalOpen(true);
                               }}
                               renderInlineLeadDetails={(lead) => (
                                 <LeadDetailsModal
                                   isOpen={true}
                                   lead={lead}
                                   emailLogs={emailLogs}
                                   actionLogs={actionLogs}
                                   properties={properties}
                                   onClose={() => {}}
                                   onUpdateLeadNotes={handleUpdateNotes}
                                   onUpdateLeadStatus={handleMoveLead}
                                   onUpdateLeadFamilyIncome={handleUpdateFamilyIncome}
                                   onUpdateLeadFull={handleUpdateLeadFull}
                                   awardXP={(xp) => awardXP(xp)}
                                   onOpenAIAssistant={handleOpenAIAssistant}
                                   onOpenRuleEngine={handleOpenRuleEngine}
                                   appointments={appointments}
                                   setAppointments={setAppointments}
                                   onOpenEditModal={(l) => {
                                     setSelectedLeadForEdit(l);
                                     setIsLeadModalOpen(true);
                                   }}
                                   onDeleteLead={handleDeleteLead}
                                   onNavigateToFollowUp={() => {}}
                                   isInline={true}
                                 />
                               )}
                               onOpenEditModal={(lead) => {
                                 setSelectedLeadForEdit(lead);
                                 setIsLeadModalOpen(true);
                               }}
                               onDeleteLead={handleDeleteLead}
                               onOpenCreateModal={() => {
                                 setSelectedLeadForEdit(null);
                                 setDefaultStatusForCreate("novo");
                                 setIsLeadModalOpen(true);
                               }}
                               onMoveLead={handleMoveLead}
                               onNavigateToFollowUp={(lead) => {
                                 setActiveTab("dashboard");
                               }}
                               onAddBulkLeads={handleAddBulkLeads}
                               onDeleteMultipleLeads={handleDeleteMultipleLeadsHandler}
                               onUpdateLeadField={handleUpdateLeadField}
                               awardXP={awardXP}
                               addNotification={addNotification}
                               appointments={appointments}
                               setAppointments={setAppointments}
                               searchTerm={searchTerm}
                               setSearchTerm={setSearchTerm}
                               statusFilter={statusFilter}
                               setStatusFilter={setStatusFilter}
                               originFilter={originFilter}
                               setOriginFilter={setOriginFilter}
                               initialLetterFilter={initialLetterFilter}
                               setInitialLetterFilter={setInitialLetterFilter}
                               regionFilter={regionFilter}
                               profileFilter={profileFilter}
                               stageFilter={stageFilter}
                               objectionFilter={objectionsFilter}
                               programaDesejadoFilter={programaDesejadoFilter}
                               restricaoBacenFilter={restricaoBacenFilter}
                               genderFilter={genderFilter}
                               familyIncomeFilter={familyIncomeFilter}
                               incomeTypeFilter={incomeTypeFilter}
                               deliveryExpectedFilter={deliveryExpectedFilter}
                               theme={theme}
                               isTodosView={leadsViewMode === "todos"}
                               isActiveLeadsView={leadsViewMode === "ativos"}
                               onOpenAIAssistant={handleOpenAIAssistant}
                               onOpenRuleEngine={handleOpenRuleEngine}
                             />
                          )}

                          {/* Fixed Connective Map below the main components for specific views */}
                          {["recentes", "ativos", "kanban", "disparos", "roteiros"].includes(leadsViewMode) && (
                            <div className="mt-8 p-6 bg-zinc-905 border-4 border-zinc-950 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-white">
                              <div className="mb-4">
                                <span className="text-[10px] uppercase font-mono font-black text-indigo-400 block">Visualização Gráfica Integrada</span>
                                <h3 className="text-base font-black italic uppercase tracking-tight text-zinc-100 flex items-center gap-2">
                                  <span>🗺️ Mapa Conectivo de Leads</span>
                                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 font-mono text-[9px] font-black rounded border border-zinc-700 uppercase">Fixo</span>
                                </h3>
                                <p className="text-xs text-zinc-400 font-medium mt-0.5">Visão consolidada das conexões estruturadas, fluxo operacional e clusters de relacionamento.</p>
                              </div>
                              <div className="h-[450px] overflow-hidden rounded-2xl border-2 border-zinc-850 bg-zinc-950/20 relative">
                                <KanbanBoard
                                  layoutZoom={layoutZoom}
                                  leads={currentLeadsArray}
                                  properties={properties}
                                  onMoveLead={handleMoveLead}
                                  onAddToDispatchQueue={handleAddMultipleToDisparos}
                                  importBatches={operationalServiceOrders}
                                  operationalFlows={operationalFlows}
                                  activeSystemFlowId={activeSystemFlowId}
                                  onOSClick={(os) => {
                                    setSelectedOSForDetails(os);
                                    setIsOSDetailsModalOpen(true);
                                  }}
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
                                    setDefaultStatusForCreate(status || "novo");
                                    setIsLeadModalOpen(true);
                                  }}
                                  showOrganizer={kanbanShowOrganizer}
                                  setShowOrganizer={setKanbanShowOrganizer}
                                  hyperfocusActive={kanbanHyperfocus}
                                  setHyperfocusActive={setKanbanHyperfocus}
                                  triggerCreateStatus={kanbanTriggerCreateStatus}
                                  setTriggerCreateStatus={
                                    setKanbanTriggerCreateStatus
                                  }
                                  triggerCreatePage={kanbanTriggerCreatePage}
                                  setTriggerCreatePage={
                                    setKanbanTriggerCreatePage
                                  }
                                  triggerEditPage={kanbanTriggerEditPage}
                                  setTriggerEditPage={setKanbanTriggerEditPage}
                                  triggerDeletePage={kanbanTriggerDeletePage}
                                  setTriggerDeletePage={
                                    setKanbanTriggerDeletePage
                                  }
                                  triggerHyperfocus={kanbanTriggerHyperfocus}
                                  setTriggerHyperfocus={setKanbanTriggerHyperfocus}
                                  onOpenAIAssistant={handleOpenAIAssistant}
                                  onOpenRuleEngine={handleOpenRuleEngine}
                                  renderOnlyMap={true}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 5. STANDALONE TABS REMOVED AS THEY ARE NOW INTEGRATED IN LEADS PAGE */}
              
              {/* 10. SETTINGS TAB */}
              {activeTab === "settings" && (
                <div className="w-full flex-1 flex flex-col min-h-0 space-y-6 pb-10">
                  {/* Top Page Title Header (Broadcast Style) */}
                  <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase group-hover:scale-105 transition-colors">
                      CONFIG
                    </div>
                    <div className="flex-1 z-10">
                      <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
                        <Settings className="w-8 h-8 text-indigo-400" />
                        <span>Gestão & Configurações</span>
                      </h2>
                      <p className="text-xs text-zinc-400 font-bold font-mono mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full " />
                        Acesse as configurações do sistema e gerencie as preferências do CRM.
                      </p>
                    </div>
                  </div>

                  {/* Scrollable Content Container */}
                  <div className="flex-1 min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Advanced CRM Settings */}
                      <div className="lg:col-span-12 bg-zinc-950 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-6">
                        <div className="border-b-2 border-zinc-800 pb-4">
                          <h3 className="text-sm font-black uppercase italic tracking-tighter text-indigo-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Segurança & Sistema
                          </h3>
                        </div>
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
                          awardXP={awardXP}
                          addNotification={addNotification}
                          setLeads={setLeads}
                          templates={templates}
                          appointments={appointments}
                          setAppointments={setAppointments}
                          emailLogs={emailLogs}
                          setEmailLogs={setEmailLogs}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. DATABASE & LOG TAB */}
              {activeTab === "database" && (
                <div className="w-full flex-1 flex flex-col min-h-0 space-y-6 pb-10">
                  <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase group-hover:scale-105 transition-colors">
                      DADOS
                    </div>
                    <div className="flex-1 z-10">
                      <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
                        <Database className="w-8 h-8 text-indigo-400" />
                        <span>Banco de Dados & Log</span>
                      </h2>
                      <p className="text-xs text-zinc-400 font-bold font-mono mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full " />
                        Gerencie backups, exportações e históricos operacionais do CRM.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border-4 border-zinc-950 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
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
                      awardXP={awardXP}
                      theme={theme}
                    />
                  </div>
                </div>
              )}

              {/* Google Workspace Connectors Module */}
              {activeTab === "google-workspace" && (
                <div className="w-full h-full flex flex-col">
                  <WorkspaceTab
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
                </div>
              )}

              {/* Settings and Administration Tabs Removed */}
            </Suspense>
          </div>
        </main>
      </div>

      {/* SHARED MODALS */}

      {/* D. CUSTOM STYLED CONFIRMATION OVERLAY */}

      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 flex items-center justify-center p-4 z-[9999] select-none ">
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl w-full max-w-sm shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-4 text-zinc-950">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 border-2 border-zinc-950 rounded-2xl shrink-0 ${
                  confirmModal.type === "danger"
                    ? "bg-rose-100 text-rose-600 "
                    : "bg-amber-100 text-amber-700 "
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-tight leading-snug">
                  {confirmModal.title}
                </h3>
                <span className="text-[8px] font-mono font-black text-zinc-400 block uppercase pt-0.5">
                  SEGURANÇA ATIVA COMERCIAL
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
                  triggerSensoryFeedback("click", accSettings);
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
                  confirmModal.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                Confirmar Operação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A. Lead Edit/Create Modal overlay */}
      <PersonalizationModal
        isOpen={isPersonalizationModalOpen}
        onClose={() => setIsPersonalizationModalOpen(false)}
        backgrounds={appBackgrounds}
        setBackgrounds={setAppBackgrounds}
        activeTab={activeTab}
        accSettings={accSettings}
      />

      <LeadModal
        isOpen={isLeadModalOpen}
        lead={selectedLeadForEdit}
        defaultStatus={defaultStatusForCreate}
        operationalFlows={operationalFlows}
        setOperationalFlows={setOperationalFlows}
        properties={properties}
        onClose={() => {
          setIsLeadModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSave={handleSaveLead}
        operationalServiceOrders={operationalServiceOrders}
        setOperationalServiceOrders={setOperationalServiceOrders}
      />

      {/* B. Leads Dossier Details Card Modal overlay */}
      <LeadDetailsModal
        isOpen={isDetailsModalOpen}
        lead={selectedLeadForDetails}
        emailLogs={emailLogs}
        actionLogs={actionLogs}
        properties={properties}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedLeadForDetails(null);
        }}
        onUpdateLeadNotes={handleUpdateNotes}
        onUpdateLeadStatus={handleMoveLead}
        onUpdateLeadFamilyIncome={handleUpdateFamilyIncome}
        onUpdateLeadFull={handleUpdateLeadFull}
        awardXP={(xp) => awardXP(xp)}
        onOpenAIAssistant={handleOpenAIAssistant}
        onOpenRuleEngine={handleOpenRuleEngine}
        appointments={appointments}
        setAppointments={setAppointments}
        operationalServiceOrders={operationalServiceOrders}
        setOperationalServiceOrders={setOperationalServiceOrders}

        onOpenEditModal={(lead) => {
          setSelectedLeadForEdit(lead);
          setIsLeadModalOpen(true);
        }}
        onDeleteLead={handleDeleteLead}
      />

      <OSModal 
        isOpen={isOSDetailsModalOpen}
        onClose={() => setIsOSDetailsModalOpen(false)}
        os={selectedOSForDetails}
        leads={leads}
        onSave={(osData) => {
          if (selectedOSForDetails) {
            // Update existing
            const newOrders = operationalServiceOrders.map(os => 
              os.id === selectedOSForDetails.id ? { ...os, ...osData } : os
            );
            setOperationalServiceOrders(newOrders);
            addNotification("OS Atualizada", `A OS foi salva com sucesso.`, "success");
          } else {
            // Create new
            const newOS: OperationalOS = {
              id: `os_${Date.now()}`,
              title: osData.title || 'Nova OS',
              subtitle: osData.subtitle || '',
              date: osData.date || new Date().toISOString(),
              endDate: osData.endDate || '',
              actions: osData.actions || [],
              fluxoId: operationalFlows[0]?.id || "",
              leadIds: [],
              type: 'personalizado',
              status: 'pendente',
              priority: 'media',
              metrics: {
                health: 100,
                totalLeads: 0,
                activeLeads: 0,
                conversionCount: 0
              }
            };
            setOperationalServiceOrders(prev => [newOS, ...prev]);
            addNotification("OS Criada", `A OS "${newOS.title}" foi criada.`, "success");
          }
        }}
        onDelete={(id) => {
          requestConfirmation(
            "Excluir OS",
            "Deseja realmente apagar esta Ordem de Serviço permanentemente?",
            () => {
              setOperationalServiceOrders(prev => prev.filter(os => os.id !== id));
              setIsOSDetailsModalOpen(false);
              addNotification("OS Excluída", "Ordem de serviço removida.", "warning");
            },
            "danger"
          );
        }}
        onUpdateLeadStage={(leadId, direction) => {
          const lead = leads.find(l => l.id === leadId);
          if (lead) {
            const stageOrder = [
              'abordagem', 'triagem', 'qualificacao', 'analise_perfil', 'compatibilizacao',
              'apresentacao', 'proposta', 'visita', 'objecao', 'escolha_de_unidade',
              'simulacao_final', 'fechamento', 'pos_venda', 'follow_up_1', 'follow_up_2',
              'follow_up_3'
            ];
            const currentStageIndex = stageOrder.indexOf(lead.stage as any);
            let newStage = lead.stage;
            if (direction === 'next' && currentStageIndex < stageOrder.length - 1) {
              newStage = stageOrder[currentStageIndex + 1];
            } else if (direction === 'prev' && currentStageIndex > 0) {
              newStage = stageOrder[currentStageIndex - 1];
            }
            if (newStage !== lead.stage) {
              handleMoveLead(leadId, newStage, lead.status);
              addNotification("Etapa Atualizada", `Lead movido para ${newStage}.`, "success");
            }
          }
        }}
        onUpdateLeadChecklist={(leadId, checklist) => {
          enrichAndSyncLead(leadId, { checklist }, "CRM");
        }}
        onUpdateLead={(leadId, fields) => {
          enrichAndSyncLead(leadId, fields, "CRM");
        }}
        appointments={appointments}
        onAddAppointment={(newAppt) => {
          setAppointments(prev => [...prev, newAppt]);
        }}
        onDeleteAppointment={(apptId) => {
          setAppointments(prev => prev.filter(a => a.id !== apptId));
        }}
        onRemoveLeadFromOS={(leadId) => {
          if (selectedOSForDetails) {
            const newOrders = operationalServiceOrders.map(os => {
              if (os.id === selectedOSForDetails.id) {
                const newLeads = os.leadIds.filter(id => id !== leadId);
                return {
                  ...os,
                  leadIds: newLeads,
                  metrics: {
                    ...os.metrics,
                    totalLeads: newLeads.length,
                    activeLeads: newLeads.length
                  }
                };
              }
              return os;
            });
            setOperationalServiceOrders(newOrders);
            // Update OS state for modal
            setSelectedOSForDetails(newOrders.find(os => os.id === selectedOSForDetails.id) || null);
            
            // Remove OS mapping from lead
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
              enrichAndSyncLead(leadId, { fluxoId: "" }, "CRM");
            }
            addNotification("Lead Removido", "Lead desvinculado da OS.", "info");
          }
        }}
      />

      {/* C. CEO Copilot Floating Insights Board */}
      {ceoResponse && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-zinc-950 border-4 border-zinc-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white select-none">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                  Diretoria Executiva Cury Constelação
                </h3>
                <h2 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                  Painel de Decisões do CEO
                </h2>
              </div>
            </div>
            <button
              onClick={() => setCeoResponse(null)}
              className="text-zinc-400 hover:text-white font-black font-mono text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg transition-colors cursor-pointer uppercase"
            >
              Fechar ✕
            </button>
          </div>

          <div className="mt-3">
            <span className="text-[7px] font-mono tracking-widest font-black uppercase text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
              Sua pergunta como COFO
            </span>
            <p className="text-zinc-200 text-[10px] font-bold font-mono pl-1 mt-1 italic border-l-2 border-zinc-700">
              "{ceoResponse.query}"
            </p>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto bg-zinc-900/60 rounded-2xl p-4 border border-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {isCeoLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent "></div>
                <p className="text-zinc-400 text-[9px] font-mono uppercase tracking-widest ">
                  Consultando dados de leads...
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {renderCeoMarkdown(ceoResponse.message)}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(ceoResponse.message);
                addNotification(
                  "Copiado!",
                  "Visão executiva copiada para a área de transferência.",
                  "success",
                );
              }}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-950 text-white font-mono font-black text-[9px] uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
            >
              📋 Copiar Diretrizes
            </button>
            <button
              type="button"
              onClick={() => setCeoResponse(null)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 border-2 border-zinc-950 text-white font-mono font-black text-[9px] uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
            >
              Ciente, CEO! 🤝
            </button>
          </div>
        </div>
      )}

      {/* ADAPTIVE IMPORT AND EXPORT MODALS */}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 ">
          <div className="bg-zinc-50 border-4 border-zinc-950 rounded-3xl w-full max-w-md shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col">
            <div className="p-4 bg-emerald-500 border-b-4 border-zinc-950 flex items-center justify-between">
              <h3 className="font-black text-zinc-950 uppercase italic text-sm tracking-widest flex items-center gap-2">
                <span>📥</span> IMPORTAÇÃO
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-mono font-black text-xs text-zinc-800 uppercase mb-2">
                  Fluxo Operacional (Obrigatório)*:
                </h4>
                <div className="flex flex-col gap-2">
                  <select
                    className="w-full bg-white border-2 border-zinc-950 p-2.5 rounded-xl font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={importPipeline}
                    onChange={(e) => {
                      if (e.target.value === "new") {
                        const newName = prompt(
                          "Nome do novo fluxo operacional:",
                        );
                        if (newName) {
                          const newFlow = createDefaultFlow(
                            `flow-${Date.now()}`,
                            newName,
                          );
                          setOperationalFlows((prev) => [...prev, newFlow]);
                          setImportPipeline(newFlow.id);
                        }
                      } else {
                        setImportPipeline(e.target.value);
                      }
                    }}
                  >
                    <option value="">Selecione um fluxo...</option>
                    {operationalFlows.map((flow) => (
                      <option key={flow.id} value={flow.id}>
                        {flow.name}
                      </option>
                    ))}
                    <option value="new">+ Criar Novo Fluxo</option>
                  </select>
                </div>
              </div>

              {importPipeline ? (
                <div>
                  <h4 className="font-mono font-black text-xs text-zinc-800 uppercase mb-2">
                    Origem dos Dados:
                  </h4>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-emerald-500 transition">
                      <input
                        type="radio"
                        value="upload"
                        checked={importOrigin === "upload"}
                        onChange={() => setImportOrigin("upload")}
                        className="accent-emerald-600 w-4 h-4"
                      />
                      <span className="font-bold text-sm text-zinc-700">
                        Upload de Arquivo Local
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-emerald-500 transition">
                      <input
                        type="radio"
                        value="google_sheets"
                        checked={importOrigin === "google_sheets"}
                        onChange={() => {
                          setImportOrigin("google_sheets");
                          handleGoogleSheetsImport();
                        }}
                        className="accent-emerald-600 w-4 h-4"
                      />
                      <span className="font-bold text-sm text-zinc-700 flex items-center gap-2">
                        Google Sheets / Drive{" "}
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                          LIVE
                        </span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-emerald-500 transition">
                      <input
                        type="radio"
                        value="copy"
                        checked={importOrigin === "copy"}
                        onChange={() => setImportOrigin("copy")}
                        className="accent-emerald-600 w-4 h-4"
                      />
                      <span className="font-bold text-sm text-zinc-700">
                        Copiar & Colar
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-800 font-mono text-[10px] text-center font-black">
                  SELECIONE OU CRIE UM FLUXO OPERACIONAL PARA CONTINUAR A
                  IMPORTAÇÃO DE CONTATOS.
                </div>
              )}

              {importPipeline && (
                <>
                  <div className="border-4 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-100 transition cursor-pointer group">
                    <Upload className="w-8 h-8 text-zinc-400 group-hover:text-emerald-500 mb-2" />
                    <p className="font-black text-sm text-zinc-700">
                      ARRASTE ARQUIVO
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      .xlsx, .csv, .txt
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {importOrigin === "upload" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500">Título da Importação (OS)</label>
                          <input
                            type="text"
                            placeholder="Ex: Lead Instagram Junho"
                            value={importBatchTitle}
                            onChange={(e) => setImportBatchTitle(e.target.value)}
                            className="w-full p-2.5 border-2 border-zinc-950 rounded-xl text-xs"
                          />
                        </div>

                        <label className="w-full py-2.5 bg-zinc-200 hover:bg-zinc-300 border-2 border-zinc-950 rounded-xl font-black text-xs uppercase text-zinc-900 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center cursor-pointer">
                          Selecionar Arquivo CSV/JSON
                          <input
                            type="file"
                            accept=".csv,.json,application/json,text/csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const content = evt.target?.result as string;
                                try {
                                  let count = 0;
                                  const bulkLeadsToImport: Lead[] = [];

                                  if (file.name.endsWith(".json")) {
                                    const parsed = JSON.parse(content);
                                    const list = Array.isArray(parsed)
                                      ? parsed
                                      : [parsed];
                                    list.forEach((item) => {
                                      let finalPhone =
                                        item.phone || "11900000000";
                                      let finalName = item.name || "Contato";
                                      let finalEmail =
                                        item.email || "contato@email.com";

                                      if (isFictitiousPhone(finalPhone)) {
                                        const emailExt =
                                          extractPhoneFromString(finalEmail);
                                        if (emailExt.extractedPhone) {
                                          finalPhone = emailExt.extractedPhone;
                                          finalEmail =
                                            emailExt.cleanedText || finalEmail;
                                        } else {
                                          const nameExt =
                                            extractPhoneFromString(finalName);
                                          if (nameExt.extractedPhone) {
                                            finalPhone = nameExt.extractedPhone;
                                            finalName =
                                              nameExt.cleanedText || finalName;
                                          }
                                        }
                                      }

                                      const newLead = {
                                        id:
                                          "imported_" +
                                          Math.random()
                                            .toString(36)
                                            .substring(2, 9),
                                        name: finalName,
                                        familyIncome:
                                          Number(
                                            item.familyIncome ||
                                              item.familyGrossIncome,
                                          ) || 4500,
                                        familyGrossIncome:
                                          Number(
                                            item.familyIncome ||
                                              item.familyGrossIncome,
                                          ) || 4500,
                                        phone: finalPhone,
                                        email: finalEmail,
                                        origin: item.origin || "Upload Arquivo",
                                        status: "novo" as const,
                                        createdAt: new Date().toISOString(),
                                        notes: "Importado por upload file",
                                        stage: "abordagem",
                                        tags: ["Importado"],
                                        value: Number(item.value) || 0,
                                        fluxoId: importPipeline,
                                      };
                                      bulkLeadsToImport.push(newLead);
                                      count++;
                                    });
                                  } else {
                                    const { parsedItems } =
                                      processFileOrPasteContent(
                                        content,
                                        "Upload Arquivo",
                                      );
                                    parsedItems.forEach((item) => {
                                      const familyIncomeVal =
                                        item.familyIncome !== undefined
                                          ? item.familyIncome
                                          : 4500;
                                      const newLead: Lead = {
                                        id:
                                          "imported_" +
                                          Math.random()
                                            .toString(36)
                                            .substring(2, 9),
                                        name: item.name || "Contato",
                                        email:
                                          item.email || "contato@email.com",
                                        phone: item.phone || "11900000000",
                                        familyIncome: familyIncomeVal,
                                        familyGrossIncome: familyIncomeVal,
                                        value: item.value || 0,
                                        origin: item.origin || "Upload Arquivo",
                                        status: item.status || "novo",
                                        stage: item.stage || "abordagem",
                                        createdAt: new Date().toISOString(),
                                        notes: item.notes || "Importado CSV",
                                        tags: ["Importado"],
                                        region: item.region,
                                        propertyInterest: item.propertyInterest,
                                        objection: item.objection,
                                        gender: item.gender,
                                        ageBracket: item.ageBracket,
                                        cpf: item.cpf,
                                        birthDate: item.birthDate,
                                        maritalStatus: item.maritalStatus,
                                        fgtsSaldo: item.fgtsSaldo,
                                        restricaoBacen: item.restricaoBacen,
                                        possuiImovel: item.possuiImovel,
                                        programaDesejado: item.programaDesejado,
                                        checklist: item.checklist || {
                                          interesse: true,
                                        },
                                        fluxoId: importPipeline,
                                      };

                                      bulkLeadsToImport.push(newLead);
                                      count++;
                                    });
                                  }

                                  handleAddBulkLeads(bulkLeadsToImport);
                                  
                                  const batchId = "import_" + Math.random().toString(36).substring(2, 9);
                                  const newBatch: OperationalOS = {
                                    id: batchId,
                                    title: importBatchTitle || `Importação ${new Date().toLocaleDateString()}`,
                                    date: new Date().toISOString(),
                                    fluxoId: importPipeline,
                                    leadIds: bulkLeadsToImport.map(l => l.id),
                                    type: 'import',
                                    status: 'concluido',
                                    priority: 'media',
                                    metrics: {
                                      health: 100,
                                      totalLeads: bulkLeadsToImport.length,
                                      activeLeads: bulkLeadsToImport.length,
                                      conversionCount: 0
                                    }
                                  };
                                  setOperationalServiceOrders(prev => [newBatch, ...prev]);
                                  setImportBatchTitle("");

                                  addNotification(
                                    "📥 IMPORTAÇÃO CONCLUÍDA",
                                    `${count} leads carregados.`,
                                    "success",
                                  );
                                  triggerSensoryFeedback(
                                    "success",
                                    accSettings,
                                  );
                                  setIsImportModalOpen(false);
                                } catch (err: any) {
                                  alert("Erro ao ler arquivo: " + err.message);
                                }
                              };
                              reader.readAsText(file);
                            }}
                          />
                        </label>
                      </>
                    )}
                    {importOrigin === "copy" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500">Título da Importação (OS)</label>
                          <input
                            type="text"
                            placeholder="Ex: Lead Facebook Maio"
                            value={importBatchTitle}
                            onChange={(e) => setImportBatchTitle(e.target.value)}
                            className="w-full p-2.5 border-2 border-zinc-950 rounded-xl text-xs"
                          />
                        </div>

                        <textarea
                          id="importPastedData"
                          placeholder="Cole o JSON ou CSV aqui..."
                          className="w-full h-32 p-3 font-mono text-xs border-2 border-zinc-950 rounded-xl"
                        />
                        <button
                          onClick={() => {
                            const textarea = document.getElementById(
                              "importPastedData",
                            ) as HTMLTextAreaElement;
                            if (textarea && textarea.value.trim()) {
                              try {
                                let count = 0;
                                const content = textarea.value.trim();
                                const bulkPastedLeadsToImport: Lead[] = [];

                                if (content.startsWith("[")) {
                                  const parsed = JSON.parse(content);
                                  parsed.forEach((item: any) => {
                                    let finalPhone =
                                      item.phone || "11900000000";
                                    let finalName = item.name || "Contato";
                                    let finalEmail =
                                      item.email || "contato@email.com";

                                    if (isFictitiousPhone(finalPhone)) {
                                      const emailExt =
                                        extractPhoneFromString(finalEmail);
                                      if (emailExt.extractedPhone) {
                                        finalPhone = emailExt.extractedPhone;
                                        finalEmail =
                                          emailExt.cleanedText || finalEmail;
                                      } else {
                                        const nameExt =
                                          extractPhoneFromString(finalName);
                                        if (nameExt.extractedPhone) {
                                          finalPhone = nameExt.extractedPhone;
                                          finalName =
                                            nameExt.cleanedText || finalName;
                                        }
                                      }
                                    }

                                    const newLead = {
                                      id:
                                        "imported_" +
                                        Math.random()
                                          .toString(36)
                                          .substring(2, 9),
                                      name: finalName,
                                      familyIncome:
                                        Number(
                                          item.familyIncome ||
                                            item.familyGrossIncome,
                                        ) || 4500,
                                      familyGrossIncome:
                                        Number(
                                          item.familyIncome ||
                                            item.familyGrossIncome,
                                        ) || 4500,
                                      phone: finalPhone,
                                      email: finalEmail,
                                      origin: item.origin || "Copiar/Colar",
                                      stage: item.stage || "abordagem",
                                      status: item.status || "novo",
                                      createdAt: new Date().toISOString(),
                                      notes: item.notes || "",
                                      tags: item.tags || ["Importado"],
                                      value: Number(item.value) || 0,
                                      cpf: item.cpf,
                                      birthDate: item.birthDate,
                                      maritalStatus: item.maritalStatus,
                                      restricaoBacen: item.restricaoBacen,
                                      possuiImovel: item.possuiImovel,
                                      programaDesejado: item.programaDesejado,
                                      region: item.region,
                                      gender: item.gender,
                                      ageBracket: item.ageBracket,
                                      objections: item.objections || [],
                                      profiles: item.profiles || [],
                                      fgtsSaldo: item.fgtsSaldo,
                                      checklist: item.checklist || {
                                        interesse: true,
                                      },
                                      fluxoId: importPipeline,
                                    };
                                    bulkPastedLeadsToImport.push(newLead);
                                    count++;
                                  });
                                } else {
                                  const { parsedItems } =
                                    processFileOrPasteContent(
                                      content,
                                      "Copiar/Colar",
                                    );
                                  parsedItems.forEach((item) => {
                                    const familyIncomeVal =
                                      item.familyIncome !== undefined
                                        ? item.familyIncome
                                        : 4500;
                                    const newLead: Lead = {
                                      id:
                                        "imported_" +
                                        Math.random()
                                          .toString(36)
                                          .substring(2, 9),
                                      name: item.name || "Contato",
                                      email: item.email || "contato@email.com",
                                      phone: item.phone || "11900000000",
                                      familyIncome: familyIncomeVal,
                                      familyGrossIncome: familyIncomeVal,
                                      value: item.value || 0,
                                      origin: item.origin || "Copiar/Colar",
                                      status: item.status || "novo",
                                      stage: item.stage || "abordagem",
                                      createdAt: new Date().toISOString(),
                                      notes: item.notes || "",
                                      tags: ["Importado"],
                                      region: item.region || "",
                                      propertyInterest:
                                        item.propertyInterest || "",
                                      objection: item.objection || "",
                                      gender: item.gender,
                                      ageBracket: item.ageBracket,
                                      cpf: item.cpf || "",
                                      birthDate: item.birthDate || "",
                                      maritalStatus: item.maritalStatus,
                                      fgtsSaldo: item.fgtsSaldo || 0,
                                      restricaoBacen: item.restricaoBacen,
                                      possuiImovel: item.possuiImovel,
                                      programaDesejado: item.programaDesejado,
                                      checklist: item.checklist || {
                                        interesse: true,
                                      },
                                      fluxoId: importPipeline,
                                    };
                                    // legacy name
                                    // legacy email

                                    // legacy check replaced
                                    bulkPastedLeadsToImport.push(newLead);
                                    count++;
                                  });
                                }

                                handleAddBulkLeads(bulkPastedLeadsToImport);

                                const batchId = "import_" + Math.random().toString(36).substring(2, 9);
                                const newBatch: OperationalOS = {
                                  id: batchId,
                                  title: importBatchTitle || `Importação ${new Date().toLocaleDateString()}`,
                                  date: new Date().toISOString(),
                                  fluxoId: importPipeline,
                                  leadIds: bulkPastedLeadsToImport.map(l => l.id),
                                  type: 'import',
                                  status: 'concluido',
                                  priority: 'media',
                                  metrics: {
                                    health: 100,
                                    totalLeads: bulkPastedLeadsToImport.length,
                                    activeLeads: bulkPastedLeadsToImport.length,
                                    conversionCount: 0
                                  }
                                };
                                setOperationalServiceOrders(prev => [newBatch, ...prev]);
                                setImportBatchTitle("");

                                addNotification(
                                  "📥 IMPORTAÇÃO CONCLUÍDA",
                                  `${count} leads carregados.`,
                                  "success",
                                );
                                triggerSensoryFeedback("success", accSettings);
                                setIsImportModalOpen(false);
                              } catch (e: any) {
                                alert(
                                  "Erro ao processar. Verifique a semântica JSON ou CSV.",
                                );
                              }
                            }
                          }}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 border-2 border-zinc-950 rounded-xl font-black text-xs uppercase text-zinc-950 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          Processar e Importar
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 ">
          <div className="bg-zinc-50 border-4 border-zinc-950 rounded-3xl w-full max-w-md shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col">
            <div className="p-4 bg-indigo-500 border-b-4 border-zinc-950 flex items-center justify-between">
              <h3 className="font-black text-white uppercase italic text-sm tracking-widest flex items-center gap-2">
                <span>📤</span> EXPORTAÇÃO
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-mono font-black text-xs text-zinc-800 uppercase mb-2">
                  Destino dos Dados:
                </h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="download"
                      checked={exportTarget === "download"}
                      onChange={() => setExportTarget("download")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">
                      Baixar Localmente
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="clipboard"
                      checked={exportTarget === "clipboard"}
                      onChange={() => setExportTarget("clipboard")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">
                      Copiar p/ área de transferência
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="email"
                      checked={exportTarget === "email"}
                      onChange={() => setExportTarget("email")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">
                      Enviar por e-mail
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-mono font-black text-xs text-zinc-800 uppercase mb-2">
                  Formato:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="xlsx"
                      checked={exportFormat === "xlsx"}
                      onChange={() => setExportFormat("xlsx")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">
                      XLSX
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === "csv"}
                      onChange={() => setExportFormat("csv")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">CSV</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="pdf"
                      checked={exportFormat === "pdf"}
                      onChange={() => setExportFormat("pdf")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">PDF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border-2 border-zinc-200 rounded-lg hover:border-indigo-500 transition">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === "json"}
                      onChange={() => setExportFormat("json")}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-zinc-700">
                      JSON
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button className="w-full py-2.5 bg-zinc-200 hover:bg-zinc-300 border-2 border-zinc-950 rounded-xl font-black text-xs uppercase text-zinc-900 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Selecionar Planilha
                </button>
                <button
                  onClick={() => {
                    let csvContent =
                      "data:text/csv;charset=utf-8,ID;Nome;Email;Telefone;Valor;Canal;Notas\r\n";
                    leads.forEach((l) => {
                      csvContent += `"${l.id}";"${l.name}";"${l.email}";"${l.phone}";"${l.value}";"${l.origin}";"${l.notes?.replace(/"/g, '""') || ""}"\r\n`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "Exportacao_Cury_Constelacao.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    addNotification(
                      "📊 EXPORTAÇÃO",
                      "Os dados foram convertidos e o download concluído.",
                      "success",
                    );
                    setIsExportModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 border-2 border-zinc-950 rounded-xl font-black text-xs uppercase text-zinc-950 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. Dynamic Conversational CRM Notifications Drawer overlay */}

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsNotificationsOpen(false)}
            className="absolute inset-0 bg-black/70 "
          />
          <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
            <div className="w-screen max-w-md bg-zinc-950 text-zinc-100 border-l-4 border-zinc-900 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col h-full font-sans">
              {/* Header title block */}
              <div className="p-6 border-b-2 border-zinc-900 bg-gradient-to-r from-indigo-950 to-zinc-950">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-black uppercase font-mono tracking-wider text-white">
                        Canal CRM Autônomo
                      </h3>
                      <p className="text-[10px] text-indigo-300 font-semibold font-mono">
                        Conversão Ativa em Tempo Real
                      </p>
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
                    <span className="block text-[8px] uppercase text-zinc-500">
                      Histórico de Alertas
                    </span>
                    <span className="text-white text-xs font-black">
                      {notifications.length} registros
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-lg border border-indigo-950 flex items-center gap-1.5 justify-between">
                    <div>
                      <span className="block text-[8px] uppercase text-indigo-400">
                        NÍVEL ATUAL
                      </span>
                      <span className="text-indigo-300 text-xs font-black">
                        Galaxy {userLevel}
                      </span>
                    </div>
                    <span className="rounded-full bg-indigo-900/40 p-1 text-[10px] text-white">
                      🚀
                    </span>
                  </div>
                </div>
              </div>

              {/* Notification Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/90 h-[calc(100vh-230px)]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3.5">
                    <Bell className="w-8 h-8 text-zinc-600 " />
                    <div>
                      <h4 className="text-xs font-black uppercase font-mono text-zinc-400">
                        Tudo Silencioso no Espaço
                      </h4>
                      <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                        Nenhum evento detectado. Use o botão abaixo para simular
                        alertas imediatamente!
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notify) => (
                    <div
                      key={notify.id}
                      className={`p-3.5 rounded-xl border-2 transition-colors ${
                        notify.read
                          ? "bg-zinc-905 bg-opacity-30 border-zinc-900 text-zinc-400"
                          : "bg-zinc-900 border-indigo-900 text-white shadow-[0_2px_8px_rgba(99,102,241,0.15)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {notify.type === "ai" && (
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          {notify.type === "alarm" && (
                            <BellRing className="w-4 h-4 text-rose-500 shrink-0 " />
                          )}
                          {notify.type === "success" && (
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          {notify.type === "warning" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          {notify.type === "info" && (
                            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}

                          <span className="text-xs font-black uppercase font-mono tracking-tight text-white">
                            {notify.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 tracking-wider shrink-0 ml-1">
                          {notify.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-300 mt-2 font-sans leading-relaxed">
                        {notify.message}
                      </p>

                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-zinc-800/80">
                        {!notify.read && (
                          <button
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notify.id ? { ...n, read: true } : n,
                                ),
                              );
                              triggerSensoryFeedback("click", accSettings);
                            }}
                            className="text-[9px] font-mono font-black uppercase text-indigo-400 hover:text-indigo-300 transition"
                          >
                            Marcar como lido
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.filter((n) => n.id !== notify.id),
                            );
                            triggerSensoryFeedback("warning", accSettings);
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
                    triggerSensoryFeedback("click", accSettings);
                    simulateCRMAction();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs uppercase border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>DIAGNOSTICAR OPORTUNIDADES REAL 🔍</span>
                </button>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono font-black">
                  <button
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, read: true })),
                      );
                      triggerSensoryFeedback("success", accSettings);
                    }}
                    className="py-2.5 bg-zinc-905 bg-opacity-40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg uppercase transition"
                  >
                    Ler Todas
                  </button>
                  <button
                    onClick={() => {
                      setNotifications([]);
                      triggerSensoryFeedback("warning", accSettings);
                    }}
                    className="py-2.5 bg-zinc-905 bg-opacity-40 hover:bg-zinc-800 border border-zinc-800 text-rose-400 rounded-lg uppercase transition"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. Real-Time Scheduled Task Alarm Modal */}

      {activeAlarm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/80 " />
          <div className="relative w-full max-w-md bg-white border-8 border-red-600 rounded-3xl p-6 text-zinc-900 shadow-[0_0_50px_rgba(239,68,68,0.5)] flex flex-col space-y-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3.5">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 w-16 h-16 rounded-full bg-red-500/20  pointer-events-none" />
                <div className="rounded-full bg-zinc-950 border-4 border-zinc-950 p-4 relative z-10">
                  <BellRing className="w-8 h-8 text-rose-500 " />
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
                  triggerSensoryFeedback("success", accSettings);
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] text-white font-black rounded-2xl text-xs uppercase tracking-wider border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-1 py-3"
              >
                Concluir / Desativar Alarme 🔕
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAlarm(null);
                  setActiveTab("appointments");
                  triggerSensoryFeedback("click", accSettings);
                }}
                className="text-[10px] font-mono font-black text-indigo-600 hover:text-indigo-800 transition uppercase"
              >
                Ver compromisso na aba de agendamentos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Preferences and Photo Modal Removed */}

      {/* E. User Profile & Preferences Modal */}

      {isUserCentralModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/80 "
            onClick={() => setIsUserCentralModalOpen(false)}
          />
          <div
            className={`relative w-full max-w-3xl rounded-3xl p-6 md:p-8 text-white border-4 border-zinc-950 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto ${
              theme === "galatico"
                ? "bg-gradient-to-b from-indigo-950 to-zinc-950 border-indigo-500/50"
                : "bg-zinc-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-zinc-800 mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  Menu do Corretor & Preferências
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Gerencie seu perfil de vendas, acessibilidade e compartilhe
                  seu portfólio digital nas redes.
                </p>
              </div>
              <button
                onClick={() => {
                  triggerSensoryFeedback("click", accSettings);
                  setIsUserCentralModalOpen(false);
                }}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-950 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Column 1: Profile & Photo */}
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase font-mono tracking-wider text-indigo-400">
                  Identificação & Foto
                </h4>

                {/* Avatar Upload UI */}
                <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shrink-0 flex items-center justify-center">
                    {localStorage.getItem("ciclocred_user_photo") &&
                    localStorage.getItem("ciclocred_user_photo") !== "" ? (
                      <img
                        src={
                          localStorage.getItem("ciclocred_user_photo") ||
                          undefined
                        }
                        alt="Perfil"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-500 font-black text-2xl text-zinc-950 flex items-center justify-center uppercase">
                        {userName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="block text-[10px] uppercase text-zinc-400 font-black font-mono">
                      Alterar Imagem de Perfil
                    </span>
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
                              localStorage.setItem(
                                "ciclocred_user_photo",
                                base64String,
                              );
                              triggerSensoryFeedback("success", accSettings);
                              addNotification(
                                "📸 FOTO ATUALIZADA",
                                "Sua nova foto de perfil foi salva localmente no CRM.",
                                "success",
                              );
                              // Force state refresh
                              setUserName((prev) => prev + " ");
                              setTimeout(
                                () => setUserName((prev) => prev.trim()),
                                50,
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      onClick={() => {
                        localStorage.removeItem("ciclocred_user_photo");
                        triggerSensoryFeedback("warning", accSettings);
                        setUserName((prev) => prev + " ");
                        setTimeout(
                          () => setUserName((prev) => prev.trim()),
                          50,
                        );
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
                    <label className="block text-[10px] uppercase font-mono font-black text-zinc-405 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        localStorage.setItem(
                          "ciclocred_user_name",
                          e.target.value,
                        );
                      }}
                      className="w-full text-xs font-bold px-3 py-2 bg-zinc-950 border-2 border-zinc-950 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-black text-zinc-400 mb-1">
                      E-mail de Contato
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => {
                        setUserEmail(e.target.value);
                        localStorage.setItem(
                          "ciclocred_user_email",
                          e.target.value,
                        );
                      }}
                      className="w-full text-xs font-bold px-3 py-2 bg-zinc-950 border-2 border-zinc-950 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-black text-zinc-400 mb-1">
                        Inscrição CRECI
                      </label>
                      <input
                        type="text"
                        value={creciNumber}
                        onChange={(e) => {
                          setCreciNumber(e.target.value);
                          localStorage.setItem(
                            "ciclocred_creci_number",
                            e.target.value,
                          );
                        }}
                        placeholder="CRECI 12345-F"
                        className="w-full text-xs font-bold px-3 py-2 bg-zinc-950 border-2 border-zinc-950 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-black text-zinc-400 mb-1">
                        Rank de Vendas
                      </label>
                      <div className="px-3 py-2 bg-zinc-950 rounded-xl border-2 border-zinc-950 text-xs text-indigo-300 font-black uppercase font-mono flex items-center gap-1">
                        🏆 Platinum Vendedor
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Accessibility & Settings Preferences */}
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase font-mono tracking-wider text-indigo-400">
                  Preferências Sensoriais
                </h4>

                <div className="space-y-4 bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {/* Accessibility switches */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-white">
                          Efeitos Sonoros
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Acione toques auditivos e alertas de CRM
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...accSettings,
                            soundsEnabled: !accSettings.soundsEnabled,
                          };
                          setAccSettings(updated);
                          localStorage.setItem(
                            "ciclocred_sensory_config",
                            JSON.stringify(updated),
                          );
                          triggerSensoryFeedback("click", updated);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors  ${
                          accSettings.soundsEnabled
                            ? "bg-indigo-600"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform  ${
                            accSettings.soundsEnabled
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-white">
                          Sensório de Vibração Tátil
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Sincronize pulsações táteis na digitação
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...accSettings,
                            hapticsEnabled: !accSettings.hapticsEnabled,
                          };
                          setAccSettings(updated);
                          localStorage.setItem(
                            "ciclocred_sensory_config",
                            JSON.stringify(updated),
                          );
                          triggerSensoryFeedback("chime", updated);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors  ${
                          accSettings.hapticsEnabled
                            ? "bg-indigo-600"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform  ${
                            accSettings.hapticsEnabled
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-white">
                          Sintetizador por Voz AI
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Leitor dinâmico assistido por voz artificial
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...accSettings,
                            speakAloudEnabled: !accSettings.speakAloudEnabled,
                          };
                          setAccSettings(updated);
                          localStorage.setItem(
                            "ciclocred_sensory_config",
                            JSON.stringify(updated),
                          );
                          triggerSensoryFeedback("success", updated);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors  ${
                          accSettings.speakAloudEnabled
                            ? "bg-indigo-600"
                            : "bg-zinc-805"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform  ${
                            accSettings.speakAloudEnabled
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-850 pt-2">
                      <div>
                        <span className="block text-xs font-bold text-white">
                          Fonte de Alta Legibilidade (Acessibilidade)
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Forçar letra sans-serif limpa para uma leitura de
                          verdade sem distrações
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...accSettings,
                            highLegibilityFont: !accSettings.highLegibilityFont,
                          };
                          setAccSettings(updated);
                          localStorage.setItem(
                            "ciclocred_sensory_config",
                            JSON.stringify(updated),
                          );
                          triggerSensoryFeedback("click", updated);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors  ${
                          accSettings.highLegibilityFont
                            ? "bg-indigo-600"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform  ${
                            accSettings.highLegibilityFont
                              ? "translate-x-6"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <span className="block text-[10px] uppercase font-mono font-black text-indigo-400 mb-2">
                      Tamanho das Fontes
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-black">
                      {["normal", "large", "extra-large"].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => {
                            const updated = {
                              ...accSettings,
                              fontSizeClass: sz as any,
                            };
                            setAccSettings(updated);
                            localStorage.setItem(
                              "ciclocred_sensory_config",
                              JSON.stringify(updated),
                            );
                            triggerSensoryFeedback("click", updated);
                          }}
                          className={`py-1.5 uppercase border rounded-lg text-[9px] font-mono font-black transition ${
                            accSettings.fontSizeClass === sz
                              ? "bg-indigo-600 text-white border-zinc-950 font-black"
                              : "bg-zinc-900 text-zinc-450 border-zinc-800"
                          }`}
                        >
                          {sz === "normal"
                            ? "Padrão"
                            : sz === "large"
                              ? "Grande"
                              : "Gigante"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <span className="block text-[10px] uppercase font-mono font-black text-indigo-400 mb-2">
                      Tema Visual Geral
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-black">
                      {["claro", "escuro", "galatico"].map((tm) => (
                        <button
                          key={tm}
                          onClick={() => {
                            setTheme(tm as any);
                            localStorage.setItem("ciclocred_theme", tm);
                            triggerSensoryFeedback("click", accSettings);
                          }}
                          className={`py-1.5 uppercase border rounded-lg text-[9px] font-mono font-black transition ${
                            theme === tm
                              ? "bg-indigo-600 text-white border-zinc-950 font-black"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`}
                        >
                          {tm === "claro"
                            ? "Claro"
                            : tm === "escuro"
                              ? "Escuro"
                              : "Galáctico"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <span className="block text-[10px] uppercase font-mono font-black text-indigo-400 mb-2">
                      Paleta de Cores
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-black">
                      {["vender", "bege", "azul", "lilas"].map((pal) => (
                        <button
                          key={pal}
                          onClick={() => {
                            setPalette(pal as any);
                            localStorage.setItem("ciclocred_palette", pal);
                            triggerSensoryFeedback("click", accSettings);
                          }}
                          className={`py-1.5 uppercase border rounded-lg text-[9px] font-mono font-black transition cursor-pointer ${
                            palette === pal
                              ? "bg-indigo-600 text-white border-zinc-950"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                          }`}
                        >
                          {pal === "vender"
                            ? "Vender"
                            : pal === "bege"
                              ? "Bege"
                              : pal === "azul"
                                ? "Azul"
                                : "Lilás"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Local & Social area */}
            <div className="mt-6 pt-4 border-t-2 border-zinc-800 space-y-3">
              <h4 className="text-sm font-black uppercase font-mono tracking-wider text-indigo-400 font-bold">
                Compartilhar Cartão Web do Corretor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    const shareText = `Olá, aqui é o Corretor ${userName} (${creciNumber || "CRECI"}). Acesse meu estoque exclusivo de imóveis residenciais atualizados em tempo real: ${window.location.protocol}//${window.location.host}?ref=${creciNumber}`;
                    if (navigator.share) {
                      navigator
                        .share({
                          title: `Portfólio Imobiliário - Corretor ${userName}`,
                          text: shareText,
                          url: window.location.href,
                        })
                        .then(() => {
                          awardXP(100);
                          addNotification(
                            "🚀 INFORMAÇÕES COMPARTILHADAS",
                            "Você compartilhou suas informações de contato imobiliário.",
                            "success",
                          );
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    } else {
                      navigator.clipboard.writeText(shareText);
                      triggerSensoryFeedback("success", accSettings);
                      alert(
                        "Link do Cartão Digital copiado com sucesso para a área de transferência!",
                      );
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
                    const msg = encodeURIComponent(
                      `Olá, sou Corretor Credenciado ${userName} (${creciNumber}). Segue o link com as novidades do portfólio de imóveis em aberto: ${window.location.href}`,
                    );
                    window.location.href = `whatsapp://send?text=${msg}`;
                    awardXP(50);
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition"
                >
                  <Share2 className="w-4 h-4 text-emerald-200 " />
                  <span>Postar WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Confira as oportunidades que separei para você! Fale direto com ${userName} no número do CRECI: ${creciNumber}. Link: ${window.location.href}`,
                    );
                    triggerSensoryFeedback("success", accSettings);
                    alert(
                      "Copiado texto do Instagram profissional! Cole na sua Bio ou Stories para engajamento rápido.",
                    );
                    window.open("https://www.instagram.com/");
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition"
                >
                  <Share2 className="w-4 h-4 text-pink-200" />
                  <span>Instagram Bio</span>
                </button>
              </div>
            </div>

            {/* Master System Reset area for wiping the whole base securely */}
            <div className="mt-6 pt-4 border-t-2 border-rose-950 bg-rose-950/10 p-4 rounded-2xl border border-rose-500/20 space-y-3 text-left">
              <h4 className="text-xs font-black uppercase font-mono tracking-wider text-rose-500 font-bold flex items-center gap-1.5">
                ⚠️ MODERAÇÃO DO CRM: MASTER SYSTEM RESET
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                Esta ação serve para limpar toda a memória do sistema (leads,
                notificações, histórico, agendamentos e estoque de imóveis
                salvos no Firebase e localStorage) para iniciar novas tarefas
                sem corromper nenhuma linha de código.
              </p>
              <button
                onClick={handleMasterSystemReset}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-colors cursor-pointer"
              >
                🔥 Executar Master Reset Completo de Registro e Logs
              </button>
            </div>
          </div>
        </div>
      )}

      <RuleEnginePanel
        isOpen={isRuleEngineOpen}
        onClose={() => setIsRuleEngineOpen(false)}
        lead={selectedLeadForAutomation}
      />

      {/* Fully Integrated Translucent Left Edge Click-Zone for seamless CRM visibility cycling */}
      <div 
        onClick={() => {
          triggerSensoryFeedback("click", accSettings);
          const evt = new CustomEvent("ciclocred_global_prev_visibility", {
            detail: { handled: false },
          });
          window.dispatchEvent(evt);
        }}
        className="fixed left-0 top-[180px] bottom-[80px] w-6 md:w-10 z-[80] cursor-pointer flex items-center justify-center transition-all bg-transparent hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 border-r border-transparent hover:border-indigo-500/10 dark:hover:border-indigo-500/10 select-none group"
        title="Clique na borda esquerda para alternar para a Visibilidade Anterior"
      >
        <span className="text-2xl font-black font-sans text-zinc-600/20 group-hover:text-indigo-400 group-hover:scale-125 transition-all">
          ‹
        </span>
      </div>

      {/* Fully Integrated Translucent Right Edge Click-Zone for seamless CRM visibility cycling */}
      <div 
        onClick={() => {
          triggerSensoryFeedback("click", accSettings);
          const evt = new CustomEvent("ciclocred_global_next_visibility", {
            detail: { handled: false },
          });
          window.dispatchEvent(evt);
        }}
        className="fixed right-0 top-[180px] bottom-[80px] w-6 md:w-10 z-[80] cursor-pointer flex items-center justify-center transition-all bg-transparent hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 border-l border-transparent hover:border-indigo-500/10 dark:hover:indigo-500/10 select-none group"
        title="Clique na borda direita para alternar para a Próxima Visibilidade"
      >
        <span className="text-2xl font-black font-sans text-zinc-600/20 group-hover:text-indigo-400 group-hover:scale-125 transition-all">
          ›
        </span>
      </div>

      {/* Botões Laterais - Alternar Páginas Ativas (Abas) */}
      <div className="fixed left-4 top-[120px] z-[99] pointer-events-none">
        <button
          onClick={() => {
            triggerSensoryFeedback("click", accSettings);
            window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_prev"));
          }}
          className="pointer-events-auto w-12 h-12 rounded-full bg-indigo-950/15 hover:bg-indigo-900/30 text-indigo-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-indigo-400 border border-indigo-500/20  flex items-center justify-center transition-colors cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Página Anterior (Abas)"
        >
          <span className="text-xl font-black font-sans">«</span>
        </button>
      </div>

      <div className="fixed right-4 top-[120px] z-[99] pointer-events-none">
        <button
          onClick={() => {
            triggerSensoryFeedback("click", accSettings);
            window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_next"));
          }}
          className="pointer-events-auto w-12 h-12 rounded-full bg-indigo-950/15 hover:bg-indigo-900/30 text-indigo-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-indigo-400 border border-indigo-500/20  flex items-center justify-center transition-colors cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Próxima Página (Abas)"
        >
          <span className="text-xl font-black font-sans">»</span>
        </button>
      </div>

      <AIAssistantChat
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        lead={selectedLeadForAI}
      />

      <QuickNotes
        isOpen={isQuickNotesOpen}
        onClose={() => setIsQuickNotesOpen(false)}
        notes={quickNotes}
        onAddNote={handleAddQuickNote}
        onDeleteNote={handleDeleteQuickNote}
        onUpdateNote={handleUpdateQuickNote}
        leads={leads}
        appointments={appointments}
        onOpenLeadModal={(initialLead) => {
          setSelectedLeadForEdit(initialLead);
          setIsLeadModalOpen(true);
        }}
        onOpenAppointmentModal={(lead, data) => {
          setScheduleFollowUpInitialLead(lead);
          setScheduleFollowUpInitialData(data);
          setIsScheduleFollowUpModalOpen(true);
        }}
      />

      <ScheduleFollowUpModal
        isOpen={isScheduleFollowUpModalOpen}
        onClose={() => setIsScheduleFollowUpModalOpen(false)}
        leads={leads}
        initialLead={scheduleFollowUpInitialLead}
        initialData={scheduleFollowUpInitialData}
        onAddAppointment={(newAppt) => {
          setAppointments(prev => [...prev, newAppt]);
          addNotification("Agenda Atualizada", `Compromisso "${newAppt.title}" agendado.`, "success");
        }}
        awardXP={awardXP}
        addNotification={addNotification}
      />
    </div>
  );
}
