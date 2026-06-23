/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";

import {
  Lead,
  EmailTemplate,
  EmailLog,
  LeadStatus,
  Appointment,
  InventoryItem,
  RealEstateProperty,
  Goal,
  Project,
  CRMNotification,
  OperationalFlow,
  FollowUpUpdate,
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
import MultiLevelMarketingTab from "./components/MultiLevelMarketingTab";
import FinanceSimulatorTab from "./components/FinanceSimulatorTab";
import CicloCredInformTab from "./components/CicloCredInformTab";

import PublicPortal from "./components/PublicPortal";
import RuleEnginePanel from "./components/RuleEnginePanel";
import AIAssistantChat from "./components/AIAssistantChat";

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
      <span className="opacity-0 -translate-x-3 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 block text-xs font-black font-mono uppercase bg-zinc-950 border-2 border-zinc-950 text-white px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] whitespace-nowrap z-[100] absolute right-12">
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          triggerSensoryFeedback("click", accSettings);
          onClick();
        }}
        className={`w-11 h-11 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer ${
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
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 px-3 py-1.5 rounded-br-xl text-zinc-300 font-medium text-[9px] md:text-[10px] uppercase font-mono tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
          👋 {greeting},{" "}
          <span className="font-black text-indigo-400">
            {userName ? userName.split(" ")[0] : "Usuário"}
          </span>
        </div>
      </div>
      {/* Relógio e Clima (Direita) */}
      <div className="absolute right-[30px] md:right-[38px] top-[64px] md:top-[68px] z-[43] pointer-events-none flex items-center">
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 px-3 py-1.5 rounded-bl-xl text-zinc-300 font-medium text-[9px] md:text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-2.5 uppercase font-mono tracking-wider">
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
      "[App.tsx] cicloCRED CRM App Component has successfully MOUNTED in viewport DOM.",
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

  const setLeads = React.useCallback((val: React.SetStateAction<Lead[]>) => {
    isLocalLeadsChangeRef.current = true;
    rawSetLeads(val);
  }, []);

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

  // Background archiver for leads checking status timeouts
  useEffect(() => {
    if (!isDbHydrated || operationalFlows.length === 0) return;

    const checkAndArchiveLeads = () => {
      const now = Date.now();

      setLeads((prevLeads) => {
        let changed = false;
        const updatedLeads = prevLeads.map((l) => {
          if (
            l.status === "arquivado" ||
            l.status === "perdido" ||
            l.status === "perdi"
          ) {
            return l;
          }

          const flow =
            operationalFlows.find((f) => f.id === l.fluxoId) ||
            operationalFlows[0];

          let timeoutMs = 48 * 60 * 60 * 1000; // default 48h
          if (flow && flow.statusTimers) {
            if (l.status === "novo" && flow.statusTimers.recentes) {
              timeoutMs =
                flow.statusTimers.recentes.hours * 60 * 60 * 1000 +
                flow.statusTimers.recentes.minutes * 60 * 1000;
            } else if (flow.statusTimers.ativos) {
              timeoutMs =
                flow.statusTimers.ativos.hours * 60 * 60 * 1000 +
                flow.statusTimers.ativos.minutes * 60 * 1000;
            }
          }

          const lastTime = l.lastInteractionAt
            ? new Date(l.lastInteractionAt).getTime()
            : l.createdAt
              ? new Date(l.createdAt).getTime()
              : now;
          const elapsed = now - lastTime;

          if (elapsed > timeoutMs) {
            changed = true;
            return {
              ...l,
              status: "arquivado" as any,
              lastInteractionAt: new Date().toISOString(),
              lostReason: `Inatividade > ${Math.floor(timeoutMs / (1000 * 60 * 60))} horas (Automático)`,
            };
          }
          return l;
        });

        return changed ? updatedLeads : prevLeads;
      });
    };

    checkAndArchiveLeads();
    const interval = setInterval(checkAndArchiveLeads, 15 * 60 * 1000); // Check every 15 minutes
    return () => clearInterval(interval);
  }, [isDbHydrated, setLeads, operationalFlows]);

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

  const [activeTab, rawSetActiveTab] = useState<string>(() => {
    return localStorage.getItem("ciclocred_active_tab") || "dashboard";
  });
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [leadsViewMode, setLeadsViewMode] = useState<
    "pesquisa_geral" | "recentes" | "ativos" | "archived" | "todos"
  >(() => {
    const saved = localStorage.getItem("ciclocred_filter_leads_view_mode");
    if (saved === "novos") return "recentes";
    return (saved as any) || "todos";
  });

  const [leadsSearchMode, setLeadsSearchMode] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_leads_search_mode");
    return saved !== null ? Number(saved) : 0;
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
    "dashboard",
    "leads",
    "automation-flows",
    "simulador",
    "inventory",
    "settings",
    "gemini-server",
    "painel-geral",
  ];
  const TAB_NAMES: Record<string, string> = {
    "painel-geral": "Painel Geral",
    dashboard: "WhatsApp Dashboard",
    leads: "Leads",
    simulador: "Simulador",
    inventory: "Estoque e Lançamentos",
    settings: "Configurações",
    "gemini-server": "Assistente AI",
    "automation-flows": "Biblioteca de Scripts",
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
          if (prev === "todos") return "recentes";
          if (prev === "recentes" || (prev as any) === "novos") return "ativos";
          if (prev === "ativos") return "archived";
          if (prev === "archived") return "todos";
          return "todos";
        });
      } else if (currentTab === "dashboard") {
        setDashboardVisibility((prev) => {
          if (prev === "disparos") return "scripts-roteiros";
          if (prev === "scripts-roteiros") return "envios-realizados";
          return "disparos";
        });
      }
    };

    const handlePrevVisibility = () => {
      const currentTab = activeTabRef.current;
      if (currentTab === "leads") {
        setLeadsViewMode((prev) => {
          if (prev === "todos") return "archived";
          if (prev === "archived") return "ativos";
          if (prev === "ativos") return "recentes";
          if (prev === "recentes" || (prev as any) === "novos") return "todos";
          return "todos";
        });
      } else if (currentTab === "dashboard") {
        setDashboardVisibility((prev) => {
          if (prev === "disparos") return "envios-realizados";
          if (prev === "scripts-roteiros") return "disparos";
          return "scripts-roteiros";
        });
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
      if (prev === "todos") return "recentes";
      if (prev === "recentes" || (prev as any) === "novos") return "ativos";
      if (prev === "ativos") return "archived";
      return "todos";
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
        setActiveTab("painel-geral");
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
    return leads.filter((lead) => {
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
        genderFilter === "todos" || lead.gender === genderFilter;
      const matchesAge =
        ageBracketFilter === "todos" || lead.ageBracket === ageBracketFilter;

      const matchesObjections =
        objectionsFilter === "todos" ||
        (lead.objections && lead.objections.includes(objectionsFilter)) ||
        (objectionsFilter === "-" &&
          (!lead.objections || lead.objections.length === 0));

      const matchesProfiles =
        profileFilter === "todos" ||
        (lead.profiles && lead.profiles.includes(profileFilter));

      // Credito sensitive filters
      let matchesFamilyIncome = true;
      if (familyIncomeFilter !== "todos") {
        const income = lead.familyIncome || 0;
        if (familyIncomeFilter === "baixa") {
          matchesFamilyIncome = income < 4000;
        } else if (familyIncomeFilter === "media") {
          matchesFamilyIncome = income >= 4000 && income <= 8000;
        } else if (familyIncomeFilter === "alta") {
          matchesFamilyIncome = income > 8000;
        }
      }

      const matchesRestricaoBacen =
        restricaoBacenFilter === "todos" ||
        (restricaoBacenFilter === "sim" && lead.restricaoBacen === "Sim") ||
        (restricaoBacenFilter === "nao" &&
          (lead.restricaoBacen === "Não" || !lead.restricaoBacen));

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
    return localStorage.getItem("ciclocred_user_name") || "Operador cicloCRED";
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return (
      localStorage.getItem("ciclocred_user_email") || "operador@sistema.com.br"
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
    return Number(localStorage.getItem("ciclocred_autonomy_interval")) || 45;
  });

  // CONNECTED GAMIFICATION STATES (Evolves from zero/zerado!)
  const [userXP, setUserXP] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_user_xp");
    return saved ? Number(saved) : 0; // Starts fresh at 0 XP
  });

  const [userLevel, setUserLevel] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_user_level");
    return saved ? Number(saved) : 1; // Starts fresh at Nível 1
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
      "cicloCRED Empreendimentos Comerciais"
    );
  });
  const [consolidatedCrmInfo, setConsolidatedCrmInfo] = useState<string>(() => {
    return (
      localStorage.getItem("ciclocred_consolidated_crm_info") ||
      "Operando com performance máxima. Metas comerciais alinhadas e integradas cycleCRED."
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
          "Metodologia ativa recomendando ofertas exclusivas de terrenos planos da cicloCRED.",
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
            "Metodologia ativa recomendando ofertas exclusivas de terrenos planos da cicloCRED.",
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
        title: "Assistente Autônomo cicloCRED ✨",
        message:
          "Conectei seu funil de CRM. Monitorando a carteira de leads e agendamentos imobiliários em tempo real com clock tátil.",
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
      if (selectedLeadIds.length > 0 && blockActions?.openCampaignModal) {
        blockActions.openCampaignModal();
      } else {
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

    const isDashboardTab = activeTab === "dashboard";
    const isMarketingTab =
      activeTab === "marketing" || activeTab === "settings";

    const containerClasses = isMarketingTab
      ? "bg-transparent pb-3 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased mb-2"
      : isDashboardTab
        ? "bg-zinc-900/40 backdrop-blur-md px-4 py-3 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased text-white border-2 border-zinc-800/60 rounded-3xl"
        : "bg-zinc-900 px-4 py-2.5 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased text-white border-b-4 border-zinc-950 border-t-0";

    const leftButtonsClass = isMarketingTab
      ? "w-10 h-10 rounded-xl border-2 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] transition-all shrink-0"
      : isDashboardTab
        ? "w-10 h-10 rounded-xl border-2 border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 text-white text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] transition-all shrink-0"
        : "w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-800 hover:bg-zinc-700 text-white text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] transition-all shrink-0";

    const rightButtonsClass = isMarketingTab
      ? "w-10 h-10 rounded-xl border-2 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] transition-all shrink-0"
      : isDashboardTab
        ? "w-10 h-10 rounded-xl border-2 border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 text-white text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] transition-all shrink-0"
        : "w-10 h-10 rounded-xl border-2 border-zinc-950 bg-zinc-800 hover:bg-zinc-700 text-white text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] transition-all shrink-0";

    const inputClass = isMarketingTab
      ? "w-full bg-zinc-900 border-2 border-zinc-800 text-zinc-100 text-xs md:text-sm font-black font-sans pl-12 pr-4 py-3 rounded-xl uppercase tracking-wider placeholder-zinc-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-opacity-90"
      : isDashboardTab
        ? "w-full bg-white/5 hover:bg-white/10 focus:bg-white/15 border-2 border-zinc-750 text-white text-[10px] md:text-xs font-black font-mono pl-12 pr-4 py-2.5 rounded-xl uppercase tracking-wider placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        : "w-full bg-zinc-100 border-2 border-zinc-950 text-zinc-900 text-[10px] md:text-xs font-black font-mono pl-12 pr-4 py-2.5 rounded-xl uppercase tracking-wider placeholder-zinc-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all";

    const activeFilterBtnClass = "bg-indigo-600 text-white";

    return (
      <div className={containerClasses}>
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-3">
          {/* LADO ESQUERDO: Botões solicitados */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-start">
            <button
              type="button"
              onClick={cycleVisibility}
              title="👁️ Alterar Visibilidade/Alerta"
              className={leftButtonsClass}
            >
              👁️
            </button>
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
          </div>

          {/* CENTRO: Barra de Pesquisa */}
          <div className="flex-1 relative flex items-center gap-1 w-full">
            <div className="relative flex-1 flex items-center">
              <button
                type="button"
                onClick={() => {
                  triggerSensoryFeedback("click", accSettings);
                  const SpeechRecognition =
                    (window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition;
                  if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.lang = "pt-BR";
                    recognition.start();
                    recognition.onstart = () => {
                      addNotification(
                        "Ouvindo...",
                        "Pode falar seu comando.",
                        "info",
                      );
                    };
                    recognition.onresult = (event: any) => {
                      const text = event.results[0][0].transcript;
                      setSearchTerm(text);
                      addNotification(
                        "Comando recebido",
                        `"${text}"`,
                        "success",
                      );
                    };
                    recognition.onerror = () => {
                      addNotification(
                        "Erro",
                        "Não foi possível reconhecer a voz.",
                        "warning",
                      );
                    };
                  } else {
                    alert(
                      "A API de reconhecimento de voz não é suportada por este navegador.",
                    );
                  }
                }}
                title="🎤 Pesquisa por Voz"
                className="absolute left-3 p-1.5 rounded-lg hover:bg-zinc-800 text-indigo-400 transition-colors z-10"
              >
                🎤
              </button>
              <input
                type="text"
                placeholder="Pesquisar / Filtrar globalmente leads e funil..."
                value={searchTerm}
                className={inputClass}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.trim() === "/automacao") {
                    setActiveTab("automation-flows");
                    setSearchTerm("");
                    return;
                  }
                  if (val.trim() === "/assistente") {
                    setActiveTab("gemini-server");
                    setSearchTerm("");
                    return;
                  }
                  setSearchTerm(val);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && searchTerm.trim() !== "") {
                    const originalQuery = searchTerm;
                    setIsCeoLoading(true);
                    setCeoResponse({
                      query: originalQuery,
                      message:
                        "Analisando dados do CRM... Conectando com a Diretoria Executiva cicloCRED.",
                    });
                    try {
                      const res = await fetch("/api/ai/ceo-query", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          query: originalQuery,
                          leadsContext: leads,
                          activeTab: activeTab,
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        const filters = data.filters || {};

                        if (filters.regionFilter)
                          setRegionFilter(filters.regionFilter);
                        if (filters.statusFilter)
                          setStatusFilter(filters.statusFilter);
                        if (filters.stageFilter)
                          setStageFilter(filters.stageFilter);
                        if (filters.familyIncomeFilter)
                          setFamilyIncomeFilter(filters.familyIncomeFilter);
                        if (filters.programaDesejadoFilter)
                          setProgramaDesejadoFilter(
                            filters.programaDesejadoFilter,
                          );
                        if (filters.objectionsFilter)
                          setObjectionsFilter(filters.objectionsFilter);
                        if (filters.profileFilter)
                          setProfileFilter(filters.profileFilter);

                        setCeoResponse({
                          query: originalQuery,
                          message:
                            data.message || "Relatório executivo concluído.",
                        });
                        setSearchTerm("");
                        addNotification(
                          "Relatório do CEO",
                          "Gemini CEO analisou a situação, leads e estruturou as diretrizes.",
                          "success",
                        );
                      } else {
                        throw new Error("Erro na comunicação");
                      }
                    } catch (error) {
                      console.error("CEO Query Erro:", error);
                      setCeoResponse({
                        query: originalQuery,
                        message:
                          "⚠️ Erro ao se comunicar com a Diretoria Executiva (Gemini). Verifique a chave de API em Settings.",
                      });
                    } finally {
                      setIsCeoLoading(false);
                    }
                  }
                }}
              />
              {/* Gemini Badge */}
              <span className="absolute inset-y-0 right-2 flex items-center gap-1 pointer-events-none">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                <span className="text-[7.5px] font-black uppercase text-purple-600 bg-purple-100 px-1 py-0.5 rounded border border-purple-300 hidden md:block">
                  Inteligência Gemini
                </span>
              </span>
            </div>
          </div>

          {/* LADO DIREITO: Botões solicitados 📥📤🔻 */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsImportModalOpen(true);
              }}
              title="📥 Importar Leads"
              className={rightButtonsClass}
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsExportModalOpen(true);
              }}
              title="📤 Exportar Leads"
              className={rightButtonsClass}
            >
              📤
            </button>
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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
                setSearchFiltersVisibility(1);
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

  // One-time startup sweep to zero the lead list and fulfill user intent safely (offline/local mode)
  useEffect(() => {
    const hasWiped =
      localStorage.getItem("ciclocred_leads_wiped_zero_v3") === "true";
    if (!hasWiped) {
      localStorage.removeItem("ciclocred_crm_leads");
      setLeads([]);
      lastLeadsIdsRef.current = [];
      if (!auth.currentUser) {
        localStorage.setItem("ciclocred_leads_wiped_zero_v3", "true");
      }
    }
  }, []);

  // ONE-TIME BOOTSTRAP TO GALAXY CHASSIS - 100% REAL AND ZEROED gamification
  useEffect(() => {
    const hasGalaxyReset =
      localStorage.getItem("ciclocred_galaxy_force_reset_v4") === "true";
    if (!hasGalaxyReset) {
      setUserXP(0);
      setUserLevel(1);

      const resetGoals = [
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
      const resetProjects = [
        {
          id: "proj-1",
          name: "Expansão de Lotes Urbanos Virgem",
          description:
            "Metodologia ativa recomendando ofertas exclusivas de terrenos planos da cicloCRED.",
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

      setGamificationGoals(resetGoals);
      setGamificationProjects(resetProjects);

      localStorage.setItem("ciclocred_user_xp", "0");
      localStorage.setItem("ciclocred_user_level", "1");
      localStorage.setItem(
        "ciclocred_gamification_goals",
        JSON.stringify(resetGoals),
      );
      localStorage.setItem(
        "ciclocred_gamification_projects",
        JSON.stringify(resetProjects),
      );
      localStorage.setItem("ciclocred_autonomy_enabled", "false");
      localStorage.setItem("ciclocred_galaxy_force_reset_v4", "true");
    }
  }, []);

  // 1. Authentication Status Sync & Firestore Hydration logic
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserName(
          user.displayName ||
            user.email?.split("@")[0].toUpperCase() ||
            "Operador cicloCRED",
        );
        setUserEmail(user.email || "operador@sistema.com.br");
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
          const hasWiped =
            localStorage.getItem("ciclocred_leads_wiped_zero_v3") === "true";
          if (!hasWiped) {
            if (
              (window as any).isFirestoreQuotaExceeded ||
              localStorage.getItem("firestore_quota_exceeded_status") === "true"
            ) {
              throw new Error(
                "resource-exhausted: Quota exceeded during wipe processing",
              );
            }
            const leadsSnapshot = await getDocs(collection(db, "leads"));
            for (const docSnap of leadsSnapshot.docs) {
              if (
                (window as any).isFirestoreQuotaExceeded ||
                localStorage.getItem("firestore_quota_exceeded_status") ===
                  "true"
              ) {
                throw new Error(
                  "resource-exhausted: Quota exceeded during deletion activity",
                );
              }
              await deleteDoc(doc(db, "leads", docSnap.id));
            }
            localStorage.setItem("ciclocred_crm_leads", JSON.stringify([]));
            localStorage.setItem("ciclocred_leads_wiped_zero_v3", "true");
            setLeads([]);
            lastLeadsIdsRef.current = [];
          }

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
              // No automatic seeding of mock records as requested. Keep collections empty until manually added or imported.
              setter([]);
              idRef.current = [];
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
      unsubscribeAppointments();
      unsubscribeTemplates();
      unsubscribeEmailLogs();
      unsubscribeInventory();
      unsubscribeProperties();
      unsubscribeGoals();
      unsubscribeProjects();
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

  // Centralized Lead Field Updater
  const handleUpdateLeadField = (leadId: string, fields: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const updated = {
            ...l,
            ...fields,
            lastInteractionAt: new Date().toISOString(),
          };

          // Auto-advance rule: ANY edit or alteration on a "novo" lead automatically promotes it to status "ativo" and initial stage "abordagem"
          if (
            l.status === "novo" &&
            updated.status !== "arquivado" &&
            updated.status !== "lead_descartado" &&
            updated.status !== "descartado" &&
            updated.status !== "ganhou"
          ) {
            updated.status = "ativo";
            updated.stage = "abordagem";
          }

          // Sync details modal if open
          if (selectedLeadForDetails?.id === leadId) {
            setSelectedLeadForDetails((curr) =>
              curr ? { ...curr, ...updated } : null,
            );
          }
          return updated;
        }
        return l;
      }),
    );
  };

  // Lead transition handler
  const handleMoveLead = (
    leadId: string,
    newStatus: string,
    targetPageId?: string,
  ) => {
    let previousStatus: string | undefined;
    // Get columns to automatically tag the lead based on matching stage label
    const cols = getKanbanColumns(targetPageId);
    const targetCol = cols.find((c) => c.id === newStatus);
    const stageLabel = targetCol ? targetCol.label : String(newStatus);

    // Resolve which field the target column actually represents
    const resolvedPageId =
      targetPageId ||
      localStorage.getItem("ciclocred_active_funnel_page_id") ||
      "status";

    setLeads((prevLeads) => {
      return prevLeads.map((l) => {
        if (l.id === leadId) {
          previousStatus = l.status;

          // Ensure funnelPlacements works correctly
          const placements =
            l.funnelPlacements && l.funnelPlacements.length > 0
              ? [...l.funnelPlacements]
              : [{ pageId: l.funnelPageId || "status", status: l.status }];

          const existingPlacementIndex = placements.findIndex(
            (p) => p.pageId === resolvedPageId,
          );

          if (existingPlacementIndex !== -1) {
            placements[existingPlacementIndex] = {
              pageId: resolvedPageId,
              status: newStatus,
            };
          } else {
            placements.push({ pageId: resolvedPageId, status: newStatus });
          }

          const currentTags = l.tags || [];
          const newTags = currentTags.includes(stageLabel)
            ? currentTags
            : [...currentTags, stageLabel];

          const updatedLead = {
            ...l,
            tags: newTags,
            funnelPageId: resolvedPageId,
            funnelPlacements: placements,
            lastInteractionAt: new Date().toISOString(),
          };

          if (resolvedPageId === "status" || resolvedPageId === "tabelas") {
            updatedLead.status = newStatus as any;
          } else if (
            resolvedPageId === "etapas" ||
            resolvedPageId === "ativos"
          ) {
            updatedLead.stage = newStatus;
          } else if (resolvedPageId === "perfil") {
            updatedLead.mainProfile = newStatus;
          } else if (
            resolvedPageId === "objecoes" ||
            resolvedPageId === "carteira"
          ) {
            updatedLead.objection = newStatus;
          }

          // Auto-advance rule: Any movement on a "novo" lead places it directly into 'ativo' and 'abordagem'
          if (
            l.status === "novo" &&
            updatedLead.status !== "arquivado" &&
            updatedLead.status !== "lead_descartado" &&
            updatedLead.status !== "descartado" &&
            updatedLead.status !== "ganhou"
          ) {
            updatedLead.status = "ativo";
            updatedLead.stage = "abordagem";
          }

          return updatedLead;
        }
        return l;
      });
    });

    // Sync current details modal if matches
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        if (resolvedPageId === "status" || resolvedPageId === "tabelas")
          updated.status = newStatus as any;
        if (resolvedPageId === "etapas" || resolvedPageId === "ativos")
          updated.stage = newStatus;
        if (resolvedPageId === "perfil") updated.mainProfile = newStatus;
        if (resolvedPageId === "objecoes" || resolvedPageId === "carteira")
          updated.objection = newStatus;
        return updated;
      });
    }

    // Trigger Gamification for moving leads in Kanban!
    if (previousStatus && previousStatus !== newStatus) {
      if (newStatus === "fechado") {
        progressGoalCategory("venda", 1);
        awardXP(500); // 500 XP big closed win deal bonus!
      } else {
        awardXP(40); // 40 XP for advancing pipeline stage
      }

      // Sync to Google Sheets Real-time
      const leadObj = leads.find((l) => l.id === leadId);
      if (leadObj) {
        syncCRMMovementToGoogleSheet(
          "Fase Alterada",
          `Lead ${leadObj.name} movido de [${(previousStatus || "").toUpperCase()}] para [${newStatus.toUpperCase()}] | Negócio: R$ ${leadObj.value.toLocaleString("pt-BR")}`,
          userName,
        );
      }
    }
  };

  const handleUpdateNotes = (leadId: string, newNotes: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.id === leadId ? { ...l, notes: newNotes } : l)),
    );
    // Sync current details modal if matches
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails((prev) =>
        prev ? { ...prev, notes: newNotes } : null,
      );
    }
  };

  const handleUpdateLeadFull = (
    leadId: string,
    updatedFields: Partial<Lead>,
  ) => {
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.id === leadId ? { ...l, ...updatedFields } : l)),
    );
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails((prev) =>
        prev ? { ...prev, ...updatedFields } : null,
      );
    }
  };

  const handleUpdateFamilyIncome = (leadId: string, income: number) => {
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.id === leadId ? { ...l, familyIncome: income } : l,
      ),
    );
    if (selectedLeadForDetails && selectedLeadForDetails.id === leadId) {
      setSelectedLeadForDetails((prev) =>
        prev ? { ...prev, familyIncome: income } : null,
      );
    }
  };



  const handleDeleteLead = (leadId: string) => {
    const leadObj = leads.find((l) => l.id === leadId);
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
  };

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

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${theme === "escuro" || theme === "galatico" ? "dark bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"} ${theme === "galatico" ? "bg-black" : ""} ${accSettings.highContrast ? "contrast-125" : ""}`}
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
      <div className="relative flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top-center Hover/Touch trigger for the auto-hiding navigation system */}
        <div
          onMouseEnter={() => setIsHeaderExpanded(true)}
          onClick={() => setIsHeaderExpanded((prev) => !prev)}
          className="fixed top-0 left-1/2 -translate-x-1/2 w-48 h-3.5 z-[100] cursor-pointer bg-transparent border-none opacity-0 select-none"
          title="Toque/Encoste para abrir ou fechar o menu superior"
        />

        {/* Unified Neo-Brutalist Layout according to diagram */}
        <div
          className={`bg-black text-white flex items-center justify-between w-full select-none shrink-0 pl-4 md:pl-8 pr-12 md:pr-16 py-3 gap-3.5 relative z-40 transition-all duration-300 ease-in-out ${
            isHeaderExpanded
              ? "translate-y-0 opacity-100 border-b-4 border-zinc-950 h-auto py-3"
              : "-translate-y-full opacity-0 pointer-events-none h-0 overflow-hidden py-0 border-b-0"
          }`}
          onMouseLeave={() => setIsHeaderExpanded(false)}
        >
          {/* Title / Brand and Left Icons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setActiveTab("painel-geral");
              }}
              className="flex items-center gap-2.5 focus:outline-none transition group text-left shrink-0 cursor-pointer mr-2"
              title="cicloCRED CRM - Painel Geral"
            >
              <Briefcase className="w-5.5 h-5.5 text-indigo-400 group-hover:scale-110 transition duration-200" />
              <span className="font-sans font-black tracking-tight text-lg md:text-xl uppercase italic text-white leading-none whitespace-nowrap">
                CICLOCRED <span className="text-indigo-400 font-sans">CRM</span>
              </span>
            </button>

            {/* Header Left: Tab Navigation 🔄 */}
            <button
              onClick={handleCycleTab}
              className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-xl border-2 transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-inner hover:scale-105 active:scale-95`}
              title={`${TAB_NAMES[activeTab] || "Página"} - 🔄 Navegação (Clique: Próxima)`}
            >
              <span className="text-sm font-bold">🔄</span>
            </button>

            {/* Page Name Pill / Indicator */}
            {showPageNamePill && (
              <div className="flex items-center bg-zinc-900 border-2 border-zinc-700 text-indigo-400 rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] px-3 h-9 mr-auto animate-fadeIn shrink-0">
                <span className="font-mono font-black text-[10px] md:text-xs uppercase whitespace-nowrap">
                  {TAB_NAMES[activeTab] || "Página"}
                </span>
                <button
                  onClick={() => setShowPageNamePill(false)}
                  className="ml-2 text-lg hover:text-rose-500 text-zinc-500 font-bold transition-colors leading-none"
                  title="Fechar Aviso"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Right Side Control Panel - User Photo/Modal, Notifications, and Add Lead */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Add Lead ➕👤 Button */}
            <button
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setSelectedLeadForEdit(null);
                setIsLeadModalOpen(true);
              }}
              className="bg-zinc-800 text-white border-2 border-zinc-950 text-sm font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] px-2 min-w-[40px] h-9 flex items-center justify-center transition-transform hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer shrink-0 whitespace-nowrap"
              title="➕👤 Adicionar Lead à Ficha Cadastral"
            >
              ➕👤
            </button>

            {/* Notification Bell 🔔 */}
            <button
              id="bell-notification-trigger"
              type="button"
              onClick={() => {
                triggerSensoryFeedback("click", accSettings);
                setIsNotificationsOpen((prev) => !prev);
              }}
              className="relative w-9 h-9 rounded-lg border-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer flex items-center justify-center focus:outline-none shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)]"
              title="🔔 Ver Notificações"
            >
              <Bell className="w-4 h-4 text-zinc-350 shrink-0" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 block text-[8px] font-black font-mono leading-none py-0.5 px-1 bg-rose-600 text-white rounded-full border border-zinc-950">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {/* User Profile Button with photo or initial */}
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
          </div>

          {/* Page Visibility / Actions Options (3 dots vertical) - Colado no canto */}
          <button
            onClick={() => {
              triggerSensoryFeedback("click", accSettings);
              alert(
                "Ajustes de edições referentes à página e visibilidade específica aberta e vísivel.",
              );
            }}
            className="absolute right-0 top-0 h-full w-10 md:w-12 bg-zinc-900 border-l border-zinc-700/0 text-zinc-300 hover:bg-zinc-800 hover:text-white transition flex items-center justify-center shrink-0 cursor-pointer"
            title="Ajustes e Visibilidade da Página"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
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
              <div className="flex flex-col flex-nowrap items-center justify-start gap-1 pb-1 pt-1 px-1 bg-zinc-950/90 border-2 border-zinc-700/80 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,0.5)] backdrop-blur-md w-11">
                {/* 1. Dashboard WhatsApp */}
                <button
                  onClick={() => {
                    triggerSensoryFeedback("click", accSettings);
                    handleTabClick("dashboard");
                  }}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-emerald-600 border-white text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-emerald-400"
                  }`}
                  title="WhatsApp Dashboard"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </button>

                {/* 2. Leads */}
                <button
                  onClick={() => handleTabClick("leads")}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "leads"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-indigo-300"
                  }`}
                  title="Leads/Clientes"
                >
                  👥
                </button>

                

                {/* 5. Scripts e Roteiros */}
                <button
                  onClick={() => handleTabClick("automation-flows")}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "automation-flows" ||
                    activeTab === "scripts-roteiros" ||
                    activeTab === "disparos" ||
                    activeTab === "envios-realizados"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-indigo-300"
                  }`}
                  title="Scripts e Roteiros"
                >
                  💬
                </button>

                

                {/* 7. Simulador */}
                <button
                  onClick={() => handleTabClick("simulador")}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "simulador"
                      ? "bg-sky-600 border-sky-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-sky-300"
                  }`}
                  title="Simulador de Financiamento"
                >
                  🧮
                </button>

                {/* 8. Estoque */}
                <button
                  onClick={() => handleTabClick("inventory")}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "inventory"
                      ? "bg-orange-600 border-orange-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-orange-300"
                  }`}
                  title="Estoque / Carteira"
                >
                  🏢
                </button>

                {/* 9. Configurações */}
                <button
                  onClick={() => {
                    handleTabClick("settings");
                    setSettingsModalTab("profile");
                  }}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "settings" && settingsModalTab === "profile"
                      ? "bg-indigo-700 border-indigo-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-slate-300"
                  }`}
                  title="Configurações do Perfil"
                >
                  ⚙️
                </button>

                {/* 10. Logs e Dados */}
                <button
                  onClick={() => {
                    handleTabClick("settings");
                    setSettingsModalTab("database");
                  }}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "settings" && settingsModalTab === "database"
                      ? "bg-rose-700 border-rose-450 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-rose-300"
                  }`}
                  title="Backup / Logs e Dados"
                >
                  💾
                </button>

                {/* 11. Assistente AI */}
                <button
                  onClick={() => {
                    triggerSensoryFeedback("click", accSettings);
                    setActiveTab("gemini-server");
                  }}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "gemini-server"
                      ? "bg-purple-600 border-purple-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-purple-300"
                  }`}
                  title="Assistente AI cicloCRED"
                >
                  ✨
                </button>

                {/* 12. Painel Geral */}
                <button
                  onClick={() => handleTabClick("painel-geral")}
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border hover:border-2 transition-all cursor-pointer ${
                    activeTab === "painel-geral"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-inner scale-95"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-indigo-300"
                  }`}
                  title="Painel Geral"
                >
                  📊
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
                    className={`fixed bottom-[74px] right-6 ${floatingRightPosition} z-50 pointer-events-auto select-none transition-all duration-300 ease-in-out`}
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
                      className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer transition-all"
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
                    className={`fixed bottom-6 right-6 ${floatingRightPosition} z-50 flex flex-row items-center gap-2 pointer-events-auto select-none transition-all duration-300 ease-in-out`}
                  >
                    {/* Button 🔍: Toggle page zoom mode (hyperfocus) */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback("click", accSettings);
                        setGlobalHyperfocus((prev) => !prev);
                      }}
                      className={`font-mono font-black w-11 h-11 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer`}
                      title="🔍 Zoom da Página (Hiperfoco 80%)"
                      style={{
                        backgroundColor: globalHyperfocus
                          ? "#f59e0b"
                          : "#18181b",
                        color: globalHyperfocus ? "#09090b" : "#f4f4f5",
                      }}
                    >
                      <span className="text-base select-none leading-none">
                        🔍
                      </span>
                    </button>

                    {/* Button 🔻: Toggle filter search bar */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback("click", accSettings);
                        setSearchFiltersVisibility((prev) =>
                          prev === 0 ? 2 : 0,
                        );
                      }}
                      className={`font-mono font-black w-11 h-11 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer`}
                      title="🔻 Alternar barra de pesquisa e filtros"
                      style={{
                        backgroundColor:
                          searchFiltersVisibility !== 0 ? "#4f46e5" : "#18181b",
                        color: "#f4f4f5",
                      }}
                    >
                      <span className="text-base select-none leading-none">
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
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black h-11 rounded-full px-3.5 flex items-center justify-center gap-2 border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer select-none"
                      title="👁️ Troca a visibilidade da página aberta"
                    >
                      <span className="text-base select-none leading-none">
                        👁️
                      </span>
                      <span className="uppercase text-[8.5px] tracking-wider font-extrabold max-w-[110px] truncate block select-none">
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
          style={{ zoom: globalHyperfocus ? "80%" : "100%" }}
          className={`relative flex-1 overflow-x-auto overflow-hidden flex flex-col ${
            theme === "claro"
              ? "bg-zinc-100/50"
              : theme === "escuro"
                ? "bg-zinc-900/40"
                : "bg-indigo-950/20 backdrop-blur-xs"
          }`}
        >
          {/* FLOATING SUB-HEADER: Invisible limit line, transparent, and floating controls */}
          <div className="flex items-center justify-between px-6 md:px-10 py-3 bg-zinc-900/5 dark:bg-zinc-100/5 backdrop-blur-xs text-zinc-950 dark:text-white border-b border-transparent relative z-30 shrink-0 select-none rounded-2xl mx-8 md:mx-16 lg:mx-24 my-3">
            {/* Left Nav & Greeting */}
            <div className="flex items-center gap-3">
              <div className="font-sans font-black text-[11px] md:text-sm uppercase tracking-tight text-zinc-500 truncate max-w-[150px] sm:max-w-none">
                👋{" "}
                {(() => {
                  const h = new Date().getHours();
                  return h < 12
                    ? "Bom dia"
                    : h < 18
                      ? "Boa tarde"
                      : "Boa noite";
                })()}
                ,{" "}
                <span className="font-black text-indigo-500 dark:text-indigo-400">
                  {userName ? userName.split(" ")[0] : "Usuário"}
                </span>
              </div>
            </div>

            {/* Right Status / Clock / Nav */}
            <div className="flex items-center gap-3">
              <div className="font-mono text-[9px] md:text-xs tracking-wider flex items-center gap-2 text-zinc-650 dark:text-zinc-400 shrink-0 bg-zinc-500/5 px-2.5 py-1.5 rounded-xl border border-zinc-500/5">
                <span className="hidden sm:inline font-bold uppercase">
                  {new Date()
                    .toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })
                    .replace("-feira", "")}
                </span>
                <span className="opacity-30 hidden sm:inline">|</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                  ⏰{" "}
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="opacity-30">|</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
                  🌤️ 26°C
                </span>
              </div>
            </div>
          </div>

          {/* SCROLLABLE WORKSPACE AREA: Scrollbar starts below the header nav buttons */}
          <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-24 py-4 md:py-8 flex flex-col w-full h-full space-y-8 pr-2 custom-scrollbar">
            {isQuotaExceeded && (
              <div className="bg-amber-950/40 border-2 border-amber-500/70 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xs relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 font-mono tracking-tighter text-7xl select-none select-none pointer-events-none group-hover:scale-105 transition-all text-amber-500 font-extrabold font-black">
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
                    className="bg-zinc-950 text-amber-500 hover:text-amber-400 font-black font-sans text-xs tracking-wider uppercase px-4 py-3 rounded-xl border border-amber-500/50 hover:border-amber-500 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    ATIVAR MEMÓRIA LOCAL PERMANENTE
                  </button>
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

            {/* RENDER ACTIVE TAB */}

            <Suspense
              fallback={<div className="p-8 text-white">Carregando...</div>}
            >
              {/* 1. PAINEL GERAL (REPORTS) */}
              {activeTab === "painel-geral" && (
                <div
                  id="crm-dashboard-default"
                  className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden"
                >
                  <Reports
                    leads={leads}
                    appointments={appointments}
                    emailLogs={emailLogs}
                    goals={gamificationGoals}
                  />
                </div>
              )}

              {/* 0. DYNAMIC WHATSAPP DASHBOARD */}
              {activeTab === "dashboard" && (
                <div
                  id="crm-dashboard-whatsapp"
                  className="flex flex-col flex-1 min-h-0 space-y-6 select-none animate-fadeIn"
                >
                  <div className="bg-gradient-to-br from-zinc-900 to-emerald-950/70 border-4 border-zinc-950 p-6 md:p-8 rounded-[30px] shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-white relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase">
                      WA.CONN
                    </div>

                    <div className="relative z-10 space-y-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Iniciação Automática Ativa
                      </span>

                      <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-8 h-8 text-emerald-400 shrink-0"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                          </svg>
                          <span>Porta de Comunicação WhatsApp</span>
                        </h1>
                        <p className="text-xs text-zinc-350 leading-relaxed font-sans max-w-2xl">
                          Sempre que o cicloCRED CRM é iniciado, este canal
                          prepara a esteira de conexões para disparos
                          automatizados de crédito. Se o seu navegador bloquear
                          ou não abrir automaticamente o WhatsApp, utilize o
                          acionamento direto abaixo.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerSensoryFeedback("success", accSettings);
                            window.location.href = "whatsapp://send";
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-zinc-950 font-black font-sans text-xs tracking-wider uppercase px-6 py-4 rounded-xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>ABRIR WHATSAPP MANUALMENTE</span>
                          <ExternalLink className="w-4 h-4 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerSensoryFeedback("click", accSettings);
                            setActiveTab("imoveis");
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 active:translate-y-0.5 text-white font-black font-sans text-xs tracking-wider uppercase px-6 py-4 rounded-xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>IR PARA ESTOQUE E LANÇAMENTOS</span>
                          <span className="text-zinc-400">🏢</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Operational Status Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 font-bold">
                        <span>Gateway de Transmissão</span>
                        <span className="px-2 py-0.5 text-[8px] bg-emerald-950 text-emerald-400 rounded-full border border-emerald-500/20 font-black">
                          ONLINE
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tight text-white leading-none">
                          Canal Estabilizado
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                          Seu app cicloCRED está sincronizado com as instâncias
                          do WhatsApp Business e portabilidades de contratos.
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 font-bold">
                        <span>Envios Autônomos</span>
                        <span className="px-2 py-0.5 text-[8px] bg-indigo-950 text-indigo-400 rounded-full border border-indigo-500/20 font-black">
                          AUTONOMY ACTIVE
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tight text-white leading-none">
                          Paciência Cognitiva
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                          Os robôs respondem em segundo plano baseando-se nos
                          scripts de copywriting e inteligência integrada.
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 font-bold">
                        <span>Monitoramento</span>
                        <span className="text-emerald-400 font-mono text-[10px] font-bold">
                          ⚡ SYNC OK
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tight text-white leading-none">
                          {leads.length} Leads Ativos
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                          A base completa de leads no seu funil está pronta para
                          receber ações automáticas ou manuais.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* cicloCRED WhatsApp Dashboard Sub-Visibilities Section */}
                  <div className="border-t-4 border-zinc-950 pt-6 mt-2 space-y-6">
                    {/* Integrated Sub-tab Component */}
                    <div className="w-full animate-fadeIn">
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
                        tableHeaderComponent={(ids, actions) =>
                          renderTableSearchBar({
                            selectedLeadIds: ids,
                            blockActions: actions,
                          })
                        }
                        forcedSubTab={
                          dashboardVisibility === "disparos"
                            ? "massa"
                            : dashboardVisibility === "scripts-roteiros"
                              ? "templates"
                              : "logs"
                        }
                        setEmailLogs={setEmailLogs}
                      />
                    </div>
                  </div>
                </div>
              )}

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
                      leadsViewMode === "recentes" ||
                      (leadsViewMode as any) === "novos"
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
                      <div className="w-full flex-1 flex flex-col min-h-0 space-y-6">
                        

                        {/* KANBAN/FUNNEL COMPONENT DIRECTLY INTEGRATED IN LEADS LIST */}
                        <div
                          id="integrated-kanban-board-scroll"
                          className={`flex flex-col gap-4 flex-none shrink-0 border-t-4 border-dashed border-zinc-800 pt-8 mt-6`}
                        >
                          <div
                            className={`flex-1 ${kanbanHyperfocus === 1 ? "overflow-visible" : "overflow-hidden"}`}
                          >
                            <KanbanBoard
                              leads={leads}
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
                              setTriggerCreatePage={setKanbanTriggerCreatePage}
                              triggerEditPage={kanbanTriggerEditPage}
                              setTriggerEditPage={setKanbanTriggerEditPage}
                              triggerDeletePage={kanbanTriggerDeletePage}
                              setTriggerDeletePage={setKanbanTriggerDeletePage}
                              triggerHyperfocus={kanbanTriggerHyperfocus}
                              setTriggerHyperfocus={setKanbanTriggerHyperfocus}
                              onOpenAIAssistant={handleOpenAIAssistant}
                              onOpenRuleEngine={handleOpenRuleEngine}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === "automation-flows" && (
                <ScriptsAndFlows
                  leads={leads}
                  onUpdateLeadField={handleUpdateLeadField}
                  accSettings={accSettings}
                  triggerSensoryFeedback={triggerSensoryFeedback}
                  addNotification={addNotification}
                  initialSearchTerm={scriptSearchTerm}
                  onChangeSearchTerm={setScriptSearchTerm}
                  onDeleteLead={handleDeleteLead}
                  onDeleteMultipleLeads={handleDeleteMultipleLeadsHandler}
                  operationalFlows={operationalFlows}
                  setOperationalFlows={setOperationalFlows}
                />
              )}

              {/* 4.6. REAL ESTATE INVENTORY MODULE */}
              {activeTab === "inventory" && (
                <div className="w-full">
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
                    theme={theme}
                    accSettings={accSettings}
                    addNotification={addNotification}
                    awardXP={(xp, cause) => awardXP(xp)}
                  />
                </div>
              )}

              {/* 6. STANDALONE FINANCE SIMULATOR */}
              {activeTab === "simulador" && (
                <div className="w-full">
                  <FinanceSimulatorTab
                    leads={leads}
                    theme={theme}
                    accSettings={accSettings}
                    addNotification={addNotification}
                    awardXP={(xp, cause) => awardXP(xp)}
                  />
                </div>
              )}

              {/* 6.1. SITE DE CAPTAÇÃO PÚBLICO (DISABLED BECAUSE IT IS REPLACED WITH PORTAL CICLOCRED) */}
              {activeTab === "public-portal-disabled" && (
                <div className="w-full">
                  <PublicPortal
                    properties={properties}
                    onAddCapturedLead={handleAddNewLeadCapturedPublicly}
                    accSettings={accSettings}
                  />
                </div>
              )}


              {/* 7.1. GEMINI NEURAL SERVER MANAGEMENT MODULE */}
              {activeTab === "gemini-server" && (
                <div className="w-full">
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
                </div>
              )}

              {/* 8. CHILDREN FINANCIAL LITERACY & GAME ROOM */}
              {activeTab === "kids" && (
                <div className="w-full">
                  <KidsTab awardXP={awardXP} accSettings={accSettings} />
                </div>
              )}

              {/* 9. CENTRAL USER PANEL (GAMIFICATION + SETTINGS + LEADERBOARD + ADMIN CONTROLS) */}
              {activeTab === "user-central" && (
                <div className="w-full">
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
                </div>
              )}

              {/* 10. SETTINGS & ADMINISTRATION TAB */}
              {activeTab === "settings" && (
                <div className="w-full flex-1 flex flex-col min-h-0 space-y-6 animate-fadeIn pb-10">
                  {/* Top Page Title Header (Broadcast Style) */}
                  <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 font-mono tracking-tighter text-8xl select-none pointer-events-none font-black uppercase group-hover:scale-105 transition-all">
                      CONFIG
                    </div>
                    <div className="flex-1 z-10">
                      <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
                        <Settings className="w-8 h-8 text-indigo-400 animate-spin-slow" />
                        <span>Gestão & Administração</span>
                      </h2>
                      <p className="text-xs text-zinc-400 font-bold font-mono mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Acesse seu perfil, ajuste metas de gamificação e
                        gerencie backups do CRM.
                      </p>
                    </div>
                  </div>

                  {/* Header Decoration and Tabs */}
                  <div
                    className={`flex flex-col sm:flex-row border-4 border-zinc-950 p-1.5 rounded-2xl gap-2 select-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${theme === "claro" ? "bg-zinc-100" : "bg-zinc-900"}`}
                  >
                    {(["config", "database"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          triggerSensoryFeedback("click", accSettings);
                          setSettingsModalTab(
                            t === "config" ? "profile" : "database",
                          );
                        }}
                        className={`flex-1 px-5 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-xl border-2 text-center ${
                          (settingsModalTab === "profile" && t === "config") ||
                          (settingsModalTab === "database" && t === "database")
                            ? "bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            : "border-transparent hover:bg-zinc-800 " +
                              (theme === "claro"
                                ? "text-zinc-600"
                                : "text-zinc-400")
                        }`}
                      >
                        {t === "config"
                          ? "👤 Perfil & Gamificação"
                          : "💾 Banco de Dados & Log"}
                      </button>
                    ))}
                  </div>

                  {/* Search bar context - using the unified component */}
                  {renderTableSearchBar({})}

                  {/* Scrollable Content Container */}
                  <div className="flex-1 min-h-0">
                    {settingsModalTab === "profile" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* 3 Column Layout inspired by UserCentralModal */}

                        {/* Col 1: Profile UI */}
                        <div
                          className={`lg:col-span-4 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-6 ${theme === "claro" ? "bg-white" : "bg-zinc-900"}`}
                        >
                          <div
                            className={`border-b-2 pb-4 ${theme === "claro" ? "border-zinc-100" : "border-zinc-800"}`}
                          >
                            <h3
                              className={`text-sm font-black uppercase italic tracking-tighter flex items-center gap-2 ${theme === "claro" ? "text-zinc-950" : "text-white"}`}
                            >
                              <User className="w-4 h-4 text-indigo-600" />
                              Identidade do Corretor
                            </h3>
                          </div>

                          <div className="flex flex-col items-center gap-4 text-center">
                            <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-zinc-950 bg-indigo-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                              {localStorage.getItem("ciclocred_user_photo") ? (
                                <img
                                  src={
                                    localStorage.getItem(
                                      "ciclocred_user_photo",
                                    )!
                                  }
                                  alt="User"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-4xl text-white select-none">
                                  {userName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="space-y-4 w-full">
                              <div className="space-y-1.5 text-left">
                                <label className="block text-[10px] font-mono font-black uppercase text-zinc-500">
                                  Nome Profissional
                                </label>
                                <input
                                  type="text"
                                  value={userName}
                                  onChange={(e) => setUserName(e.target.value)}
                                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-bold uppercase"
                                />
                              </div>
                              <div className="space-y-1.5 text-left">
                                <label className="block text-[10px] font-mono font-black uppercase text-zinc-500">
                                  Registro CRECI / CRM
                                </label>
                                <input
                                  type="text"
                                  value={creciNumber}
                                  onChange={(e) =>
                                    setCreciNumber(e.target.value)
                                  }
                                  className="w-full bg-zinc-50 border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Gamification & System UI */}
                        <div className="lg:col-span-5 space-y-8">
                          {/* XP & PROGRESS */}
                          <div className="bg-zinc-950 text-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                              <Trophy className="w-32 h-32 text-amber-500" />
                            </div>
                            <div className="relative z-10 space-y-4">
                              <div className="flex justify-between items-end">
                                <div>
                                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                                    PATENTE GALAXY
                                  </span>
                                  <h4 className="text-2xl font-black italic tracking-tighter uppercase">
                                    NÍVEL {userLevel}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                    XP ACUMULADO
                                  </span>
                                  <p className="text-lg font-black text-white">
                                    {userXP} XP
                                  </p>
                                </div>
                              </div>
                              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 p-0.5">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-1000"
                                  style={{ width: `${(userXP % 500) / 5}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* SYSTEM PREFERENCES (Style like UserCentralModal Col 3) */}
                          <div
                            className={`border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-5 ${theme === "claro" ? "bg-white" : "bg-zinc-900"}`}
                          >
                            <div
                              className={`border-b-2 pb-3 ${theme === "claro" ? "border-zinc-100" : "border-zinc-800"}`}
                            >
                              <h3
                                className={`text-sm font-black uppercase italic tracking-tighter flex items-center gap-2 ${theme === "claro" ? "text-zinc-950" : "text-white"}`}
                              >
                                <Sliders className="w-4 h-4 text-amber-600" />
                                Preferências & Acessibilidade
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-zinc-700">
                                  Som & Alertas
                                </span>
                                <button
                                  onClick={() => {
                                    const next = {
                                      ...accSettings,
                                      soundsEnabled: !accSettings.soundsEnabled,
                                    };
                                    setAccSettings(next);
                                    triggerSensoryFeedback("chime", next);
                                  }}
                                  className={`w-10 h-6 rounded-full p-1 transition-colors ${accSettings.soundsEnabled ? "bg-indigo-600" : "bg-zinc-300"}`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${accSettings.soundsEnabled ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </button>
                              </div>
                              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-zinc-700">
                                  Feedback Tátil
                                </span>
                                <button
                                  onClick={() => {
                                    const next = {
                                      ...accSettings,
                                      hapticsEnabled:
                                        !accSettings.hapticsEnabled,
                                    };
                                    setAccSettings(next);
                                    triggerSensoryFeedback("click", next);
                                  }}
                                  className={`w-10 h-6 rounded-full p-1 transition-colors ${accSettings.hapticsEnabled ? "bg-indigo-600" : "bg-zinc-300"}`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${accSettings.hapticsEnabled ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="block text-[10px] font-mono font-black uppercase text-zinc-500">
                                Tamanho Visual da Interface
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {(
                                  ["normal", "large", "extra-large"] as const
                                ).map((sz) => (
                                  <button
                                    key={sz}
                                    onClick={() => {
                                      setAccSettings({
                                        ...accSettings,
                                        fontSizeClass: sz,
                                      });
                                      triggerSensoryFeedback(
                                        "click",
                                        accSettings,
                                      );
                                    }}
                                    className={`py-2 rounded-xl border-2 font-black text-[9px] uppercase tracking-tighter ${
                                      accSettings.fontSizeClass === sz
                                        ? "bg-zinc-950 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        : "bg-zinc-50 border-zinc-200 text-zinc-500"
                                    }`}
                                  >
                                    {sz === "normal"
                                      ? "Padrão"
                                      : sz === "large"
                                        ? "Grande"
                                        : "Super"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Col 3: Advanced CRM Settings (Legacy Settings Component) */}
                        <div className="lg:col-span-3 bg-zinc-950 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-6">
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
                          />
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              )}

              {/* Google Workspace Connectors Module */}
              {activeTab === "google-workspace" && (
                <div className="w-full">
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
        <div className="fixed inset-0 bg-zinc-950/80 flex items-center justify-center p-4 z-[9999] select-none backdrop-blur-xs">
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
      <LeadModal
        isOpen={isLeadModalOpen}
        lead={selectedLeadForEdit}
        defaultStatus={defaultStatusForCreate}
        operationalFlows={operationalFlows}
        setOperationalFlows={setOperationalFlows}
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
        onUpdateLeadFull={handleUpdateLeadFull}
        awardXP={(xp) => awardXP(xp)}
        onOpenAIAssistant={handleOpenAIAssistant}
        onOpenRuleEngine={handleOpenRuleEngine}

        onOpenEditModal={(lead) => {
          setSelectedLeadForEdit(lead);
          setIsLeadModalOpen(true);
        }}
        onDeleteLead={handleDeleteLead}
      />

      {/* C. CEO Copilot Floating Insights Board */}
      {ceoResponse && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-zinc-950 border-4 border-zinc-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white select-none">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                  Diretoria Executiva cicloCRED
                </h3>
                <h2 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                  Painel de Decisões do CEO
                </h2>
              </div>
            </div>
            <button
              onClick={() => setCeoResponse(null)}
              className="text-zinc-400 hover:text-white font-black font-mono text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg transition-all cursor-pointer uppercase"
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
                <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                <p className="text-zinc-400 text-[9px] font-mono uppercase tracking-widest animate-pulse">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
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
                    link.setAttribute("download", "Exportacao_cicloCRED.csv");
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
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
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
                      className={`p-3.5 rounded-xl border-2 transition-all duration-350 ${
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
                  className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs uppercase border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all"
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
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs" />
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
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs"
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
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                          accSettings.soundsEnabled
                            ? "bg-indigo-600"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
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
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                          accSettings.hapticsEnabled
                            ? "bg-indigo-600"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
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
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                          accSettings.speakAloudEnabled
                            ? "bg-indigo-600"
                            : "bg-zinc-805"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
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
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                          accSettings.highLegibilityFont
                            ? "bg-indigo-600"
                            : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
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
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer"
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

      {/* Absolute Translucent Edge Navigation Buttons - Próximo ao Cabeçalho */}
      <div className="fixed left-4 top-[48px] z-[99] pointer-events-none">
        <button
          onClick={() => {
            triggerSensoryFeedback("click", accSettings);
            const evt = new CustomEvent("ciclocred_global_prev_visibility", {
              detail: { handled: false },
            });
            window.dispatchEvent(evt);
          }}
          className="pointer-events-auto w-12 h-12 rounded-full bg-zinc-900/10 hover:bg-zinc-900/30 text-zinc-500 hover:text-indigo-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:hover:text-indigo-400 border border-zinc-500/10 backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Visibilidade Anterior (Seta Esquerda)"
        >
          <span className="text-xl font-bold font-sans">‹</span>
        </button>
      </div>

      <div className="fixed right-4 top-[48px] z-[99] pointer-events-none">
        <button
          onClick={() => {
            triggerSensoryFeedback("click", accSettings);
            const evt = new CustomEvent("ciclocred_global_next_visibility", {
              detail: { handled: false },
            });
            window.dispatchEvent(evt);
          }}
          className="pointer-events-auto w-12 h-12 rounded-full bg-zinc-900/10 hover:bg-zinc-900/30 text-zinc-500 hover:text-indigo-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:hover:text-indigo-400 border border-zinc-500/10 backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Próxima Visibilidade (Seta Direita)"
        >
          <span className="text-xl font-bold font-sans">›</span>
        </button>
      </div>

      {/* Botões Laterais - Abaixo da Linha da Saudação e Horário */}
      <div className="fixed left-4 top-[120px] z-[99] pointer-events-none">
        <button
          onClick={() => {
            triggerSensoryFeedback("click", accSettings);
            window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_prev"));
          }}
          className="pointer-events-auto w-12 h-12 rounded-full bg-indigo-950/15 hover:bg-indigo-900/30 text-indigo-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Página Anterior"
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
          className="pointer-events-auto w-12 h-12 rounded-full bg-indigo-950/15 hover:bg-indigo-900/30 text-indigo-400 dark:bg-white/5 dark:hover:bg-white/10 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          title="Próxima Página"
        >
          <span className="text-xl font-black font-sans">»</span>
        </button>
      </div>

      <AIAssistantChat
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        lead={selectedLeadForAI}
      />
    </div>
  );
}
