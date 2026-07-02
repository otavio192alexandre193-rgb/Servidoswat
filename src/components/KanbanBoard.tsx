/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";

import { Lead, LeadStatus, OperationalOS, OperationalFlow } from "../types";
import CognitiveMap from "./CognitiveMap";
import { handleWhatsAppAction } from "../utils/whatsapp";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Building2,
  Info,
  AlertTriangle,
  Edit2,
  Check,
  X,
  Trash2,
  Maximize2,
  Minimize2,
  AlignJustify,
  ArrowRightLeft,
  Sliders,
  Settings,
  Grid,
  MessageCircle,
  Phone,
  Bell,
  Bot,
  FileText,
  ListTree,
  Sparkles,
} from "lucide-react";
import {
  getKanbanColumns,
  saveKanbanColumns,
  KanbanColumn,
} from "../utils/kanban";

interface KanbanBoardProps {
  layoutZoom?: number;
  leads: Lead[];
  tableHeaderComponent?: React.ReactNode;
  onMoveLead: (
    leadId: string,
    newStatus: LeadStatus,
    newPageId?: string,
  ) => void;
  onOpenLeadDetails: (lead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
  onOpenCreateModal: (status?: LeadStatus) => void;
  onUpdateLeadField?: (leadId: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (leadId: string) => void;
  showOrganizer?: boolean;
  setShowOrganizer?: (val: boolean) => void;
  hyperfocusActive?: boolean | number;
  setHyperfocusActive?: (val: boolean | number) => void;
  triggerCreateStatus?: boolean;
  setTriggerCreateStatus?: (val: boolean) => void;
  triggerCreatePage?: boolean;
  setTriggerCreatePage?: (val: boolean) => void;
  triggerEditPage?: boolean;
  setTriggerEditPage?: (val: boolean) => void;
  triggerDeletePage?: boolean;
  setTriggerDeletePage?: (val: boolean) => void;
  triggerHyperfocus?: boolean;
  setTriggerHyperfocus?: (val: boolean) => void;
  kanbanViewMode?: "etapas" | "perfil" | "qualificacao" | "objecoes";
  onOpenAIAssistant?: (lead: Lead) => void;
  onOpenRuleEngine?: (lead: Lead) => void;
  onNavigateToFollowUp?: (lead: Lead) => void;
  onOSClick?: (os: OperationalOS) => void;
  renderOnlyColumns?: boolean;
  renderOnlyMap?: boolean;
  properties?: any[];
  onAddToDispatchQueue?: (leadIds: string[]) => void;
  importBatches?: OperationalOS[];
  operationalFlows?: OperationalFlow[];
  activeSystemFlowId?: string;
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
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const diffTime = todayMidnight.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const COLOR_SCHEMES: Record<
  string,
  { bgClass: string; labelClass: string; accentBorderClass: string }
> = {
  blue: {
    bgClass: "bg-blue-100/90",
    labelClass: "text-blue-950",
    accentBorderClass: "border-blue-500",
  },
  amber: {
    bgClass: "bg-amber-100/90",
    labelClass: "text-amber-950",
    accentBorderClass: "border-yellow-500",
  },
  indigo: {
    bgClass: "bg-indigo-100/90",
    labelClass: "text-indigo-950",
    accentBorderClass: "border-indigo-500",
  },
  emerald: {
    bgClass: "bg-emerald-100/90",
    labelClass: "text-emerald-950",
    accentBorderClass: "border-emerald-500",
  },
  red: {
    bgClass: "bg-red-100/90",
    labelClass: "text-red-950",
    accentBorderClass: "border-rose-500",
  },
  pink: {
    bgClass: "bg-pink-100/90",
    labelClass: "text-pink-950",
    accentBorderClass: "border-pink-500",
  },
  teal: {
    bgClass: "bg-teal-100/90",
    labelClass: "text-teal-950",
    accentBorderClass: "border-teal-500",
  },
  orange: {
    bgClass: "bg-orange-100/90",
    labelClass: "text-orange-950",
    accentBorderClass: "border-orange-500",
  },
  zinc: {
    bgClass: "bg-zinc-100/90",
    labelClass: "text-zinc-950",
    accentBorderClass: "border-zinc-500",
  },
};

export default React.memo(function KanbanBoard({
  layoutZoom = 100,
  leads,
  tableHeaderComponent,
  onMoveLead,
  onOpenLeadDetails,
  onOpenEditModal,
  onOpenCreateModal,
  onUpdateLeadField,
  onDeleteLead,
  showOrganizer = false,
  setShowOrganizer,
  hyperfocusActive = false,
  setHyperfocusActive,
  triggerCreateStatus = false,
  setTriggerCreateStatus,
  triggerCreatePage = false,
  setTriggerCreatePage,
  triggerEditPage = false,
  setTriggerEditPage,
  triggerDeletePage = false,
  setTriggerDeletePage,
  triggerHyperfocus = false,
  setTriggerHyperfocus,
  kanbanViewMode,
  onOpenAIAssistant,
  onOpenRuleEngine,
  onNavigateToFollowUp,
  onOSClick,
  renderOnlyColumns = false,
  renderOnlyMap = false,
  properties: externalProperties,
  onAddToDispatchQueue,
  importBatches = [],
  operationalFlows = [],
  activeSystemFlowId
}: KanbanBoardProps) {
  const [activeDragCol, setActiveDragCol] = useState<string | null>(null);

  const memoizedStatusColumns = useMemo(() => getKanbanColumns("status", activeSystemFlowId), [activeSystemFlowId]);
  const memoizedEtapasColumns = useMemo(() => getKanbanColumns("etapas", activeSystemFlowId), [activeSystemFlowId]);
  const memoizedPerfilColumns = useMemo(() => getKanbanColumns("perfil", activeSystemFlowId), [activeSystemFlowId]);
  const memoizedObjecoesColumns = useMemo(() => getKanbanColumns("objecoes", activeSystemFlowId), [activeSystemFlowId]);

  // State for columns
  const [columns, setColumns] = useState<KanbanColumn[]>(() =>
    getKanbanColumns(undefined, activeSystemFlowId),
  );

  // Dynamic Map height state for bottom border resize dragging
  const [mapHeight, setMapHeight] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_kanban_map_height");
    const parsed = Number(saved);
    return saved && !isNaN(parsed) ? parsed : 650;
  });

  // Funnel visible pages count state (🔍 button)
  const [visiblePagesCount, setVisiblePagesCount] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_kanban_visible_pages_count");
    const parsed = Number(saved);
    return saved && !isNaN(parsed) ? parsed : 1;
  });

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFocusClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      // Double click action: turn off hyperfocus completely!
      if (setHyperfocusActive) {
        setHyperfocusActive(0);
      }
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      // Single click action: cycle through hyperfocus levels
      if (setHyperfocusActive) {
        const current =
          typeof hyperfocusActive === "number"
            ? hyperfocusActive
            : hyperfocusActive
              ? 1
              : 0;
        let nextValue = 1;
        if (current === 0) {
          nextValue = 1;
        } else if (current === 1) {
          nextValue = 2;
        } else if (current === 2) {
          nextValue = 3;
        } else if (current === 3) {
          nextValue = 1;
        }
        setHyperfocusActive(nextValue);
      }
      clickTimeoutRef.current = null;
    }, 250); // 250ms is perfect for double-click detection
  };

  // Mapa (formerly Hiperfoco 3) State Variables
  const [kanbanSearchText, setKanbanSearchText] = useState("");
  const [mapaColumns, setMapaColumns] = useState<
    Array<{ colId: string; pageId: string }>
  >(() => {
    const saved =
      localStorage.getItem("ciclocred_mapa_columns") ||
      localStorage.getItem("ciclocred_h3_columns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  });
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    const saved = localStorage.getItem("ciclocred_h3_node_positions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return {};
  });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [draggingColId, setDraggingColId] = useState<string | null>(null);

  const [h3Pan, setH3Pan] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem("ciclocred_h3_pan");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
      } catch (_) {}
    }
    return { x: 0, y: 0 };
  });
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);

  // Advanced Interactive H3 states for CRM Intelligence
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedH3LeadId, setSelectedH3LeadId] = useState<string | null>(null);

  const handleToggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const handleToggleColumnSelection = (colId: string, pageId: string) => {
    const colLeads = leads.filter(l => getLeadStatusForPage(l, pageId) === colId);
    const colLeadIds = colLeads.map(l => l.id);
    const allSelected = colLeadIds.length > 0 && colLeadIds.every(id => selectedLeadIds.includes(id));

    if (allSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !colLeadIds.includes(id)));
    } else {
      setSelectedLeadIds(prev => {
        const unique = new Set([...prev, ...colLeadIds]);
        return Array.from(unique);
      });
    }
  };

  const handleBulkMoveStatusKanban = (status: LeadStatus) => {
    if (selectedLeadIds.length === 0) return;
    selectedLeadIds.forEach(id => {
      onMoveLead(id, status, "status");
    });
    setSelectedLeadIds([]);
  };

  const handleBulkMoveStageKanban = (stage: string) => {
    if (selectedLeadIds.length === 0) return;
    selectedLeadIds.forEach(id => {
      onMoveLead(id, stage, "etapas");
      if (onUpdateLeadField) {
        onUpdateLeadField(id, { stage: stage });
      }
    });
    setSelectedLeadIds([]);
  };

  const handleBulkDeleteKanban = () => {
    if (selectedLeadIds.length === 0) return;
    if (window.confirm(`Tem certeza que deseja apagar ${selectedLeadIds.length} leads selecionados no Kanban?`)) {
      selectedLeadIds.forEach(id => {
        if (onDeleteLead) onDeleteLead(id);
      });
      setSelectedLeadIds([]);
    }
  };
  const [mapaFilter, setMapaFilter] = useState<{
    initial?: string;
    today?: boolean;
  } | null>(null);
  const [nlpCommandText, setNlpCommandText] = useState("");
  const [nlpProcessing, setNlpProcessing] = useState(false);
  const [nlpFeedback, setNlpFeedback] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);
  const [agendaDate, setAgendaDate] = useState("");
  const [agendaTime, setAgendaTime] = useState("");
  const [agendaActivity, setAgendaActivity] = useState(
    "Visita no Decorado Cury",
  );
  const [generatedPitch, setGeneratedPitch] = useState("");
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [searchClickCount, setSearchClickCount] = useState(0);

  // Atomic Zoom state from 10% to 1000%
  const [h3Zoom, setH3Zoom] = useState<number>(() => {
    const saved = localStorage.getItem("ciclocred_h3_zoom");
    const parsed = Number(saved);
    return saved && !isNaN(parsed) ? Math.max(10, Math.min(1000, parsed)) : 100;
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Real Estate stock loaded from localStorage directly
  const [properties, setProperties] = useState<any[]>(() => {
    if (externalProperties && externalProperties.length > 0)
      return externalProperties;
    const saved = localStorage.getItem("ciclocred_crm_properties");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  });

  useEffect(() => {
    if (externalProperties && externalProperties.length > 0) {
      setProperties(externalProperties);
    }
  }, [externalProperties]);

  // Persists Mapa columns & node positions instantly on edit to sustain full page reloading!
  useEffect(() => {
    localStorage.setItem("ciclocred_mapa_columns", JSON.stringify(mapaColumns));
  }, [mapaColumns]);

  useEffect(() => {
    localStorage.setItem("ciclocred_h3_zoom", String(h3Zoom));
  }, [h3Zoom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        "ciclocred_h3_node_positions",
        JSON.stringify(nodePositions),
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [nodePositions]);

  // High performance visual translation tracking
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const dragStartNodeRef = useRef({ x: 0, y: 0 });
  const dragStartPanRef = useRef({ x: 0, y: 0 });
  const lastMoveCoords = useRef({ clientX: 0, clientY: 0 });
  const requestRef = useRef<number | null>(null);

  const handleNodeStartDrag = (
    id: string,
    initialPos: { x: number; y: number },
    clientX: number,
    clientY: number,
  ) => {
    setDraggingNodeId(id);
    // Retrieve current position safely
    const currentPos = nodePositions[id] || initialPos;
    dragStartNodeRef.current = { x: currentPos.x, y: currentPos.y };
    dragStartMouseRef.current = { x: clientX, y: clientY };
    lastMoveCoords.current = { clientX, clientY };
  };

  const handleNodeMouseDown = (
    id: string,
    initialPos: { x: number; y: number },
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    handleNodeStartDrag(id, initialPos, e.clientX, e.clientY);
  };

  const handleNodeTouchStart = (
    id: string,
    initialPos: { x: number; y: number },
    e: React.TouchEvent,
  ) => {
    e.stopPropagation();
    if (e.touches && e.touches[0]) {
      handleNodeStartDrag(
        id,
        initialPos,
        e.touches[0].clientX,
        e.touches[0].clientY,
      );
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsPanningCanvas(true);
    dragStartPanRef.current = { x: h3Pan.x, y: h3Pan.y };
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    lastMoveCoords.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setIsPanningCanvas(true);
      dragStartPanRef.current = { x: h3Pan.x, y: h3Pan.y };
      dragStartMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastMoveCoords.current = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      };
    }
  };

  // Process NLP intents via backend processing and apply ecosystem actions
  const handleNlpExecute = async () => {
    if (!nlpCommandText.trim()) return;
    setNlpProcessing(true);
    setNlpFeedback(null);

    try {
      const res = await fetch("/api/ai/nlp-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          command: nlpCommandText,
          leadsContext: leads.map((l) => ({
            id: l.id,
            name: l.name,
            status: l.status,
            value: l.value,
            familyGrossIncome: l.familyGrossIncome,
            familyIncome: l.familyIncome,
            qualificacao: l.qualificacao
          })),
          propertiesContext: properties ? properties.map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            neighborhood: p.neighborhood
          })) : []
        }),
      });

      if (!res.ok) throw new Error("Erro na comunicação com a IA");
      const data = await res.json();
      
      let actionsApplied = 0;

      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          if (action.type === "UPDATE_LEAD" && onUpdateLeadField) {
            onUpdateLeadField(action.leadId, action.updates);
            
            // Special case for status move (Kanban visual update)
            if (action.updates.status && onMoveLead) {
              const pageId = ["novo", "ativo", "arquivado"].includes(action.updates.status) ? "status" : "etapas";
              onMoveLead(action.leadId, action.updates.status, pageId);
            }
            actionsApplied++;
          } else if (action.type === "ADD_TO_DISPATCH_QUEUE" && onAddToDispatchQueue) {
            onAddToDispatchQueue(action.leadIds || []);
            actionsApplied++;
          } else if (action.type === "FOCUS_LEAD") {
            const focusLead = leads.find(l => (action.leadIds || []).includes(l.id));
            if (focusLead) {
              if (onOpenLeadDetails) onOpenLeadDetails(focusLead);
              setSelectedH3LeadId(focusLead.id);
              actionsApplied++;
            }
          }
        }
      }

      setNlpFeedback({
        type: "success",
        msg: `${data.message}\n\nAções integradas aplicadas no CRM: ${actionsApplied}`
      });
      setNlpCommandText("");
    } catch (err: any) {
      console.error(err);
      
      // Fallback local commands for map manipulations
      const promptLow = nlpCommandText.toLowerCase();
      let handledLocally = false;
      if (promptLow.includes("mapa") || promptLow.includes("aplique")) {
         let updated = false;
         let msgs = [];
         const newCols: { colId: string; pageId: string }[] = [];
         const possibleCols = ["abordagem", "triagem", "proposta", "fechado", "arquivado", "novo", "ativo"];
         possibleCols.forEach((c) => {
           if (promptLow.includes(c)) {
             let col = c;
             let pageId = ["novo", "ativo", "arquivado"].includes(col) ? "status" : "etapas";
             if (!mapaColumns.some((m) => m.colId === col && m.pageId === pageId)) {
               newCols.push({ colId: col, pageId });
             }
           }
         });
         if (newCols.length > 0) {
           setMapaColumns((prev) => [...prev, ...newCols]);
           msgs.push(`Colunas ativadas: ${newCols.map((c) => c.colId).join(", ")}`);
           updated = true;
         }
         
         if (promptLow.includes("limpar") || promptLow.includes("resetar")) {
           setMapaFilter(null);
           msgs.push("Filtros removidos");
           updated = true;
         }
         
         if (updated) {
           setNlpFeedback({ type: "success", msg: msgs.join(" | ") });
           handledLocally = true;
           setNlpCommandText("");
         }
      }

      if (!handledLocally) {
        setNlpFeedback({
          type: "error",
          msg: `Err: ${err.message || "Falha ao processar comando avançado."}`,
        });
      }
    } finally {
      setNlpProcessing(false);
    }
  };

  const handleDropOnH3Canvas = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data && data.startsWith("col-header:")) {
      const parts = data.split(":");
      if (parts.length >= 3) {
        const colId = parts[1];
        const pageId = parts[2];
        if (
          !mapaColumns.some(
            (item) => item.colId === colId && item.pageId === pageId,
          )
        ) {
          setMapaColumns((prev) => [...prev, { colId, pageId }]);
        }
      }
    } else if (data) {
      // It might be a lead drag
      const draggedLead = leads.find((l) => l.id === data);
      if (draggedLead) {
        // Find which column this lead belongs to in the currently active page or all pages
        // We'll just look through active funnel pages to find its status
        for (const page of funnelPages) {
          const statusId = getLeadStatusForPage(draggedLead, page.id);
          if (statusId) {
            if (
              !mapaColumns.some(
                (item) => item.colId === statusId && item.pageId === page.id,
              )
            ) {
              setMapaColumns((prev) => [
                ...prev,
                { colId: statusId, pageId: page.id },
              ]);
            }
            break;
          }
        }
      }
    }
  };

  // Layout helper for Hiperfoco 3 Nodes (Columns and Leads) to space them beautifully
  const getHiperfocoPos = (
    nodeId: string,
    isCol: boolean,
    columnIdx: number,
    itemIdxInCol?: number,
  ) => {
    if (nodePositions[nodeId]) {
      return nodePositions[nodeId];
    }
    // Fixed intervals so existing elements don't shift when new columns are added
    const hInterval = 400;
    const vInterval = 120;

    if (isCol) {
      return { x: 70 + columnIdx * hInterval, y: 80 };
    } else {
      const parentX = 70 + columnIdx * hInterval;
      const idx = itemIdxInCol || 0;
      const colCol = idx % 2;
      const rowRow = Math.floor(idx / 2);

      const x = parentX + (colCol === 0 ? -15 : 135) + (idx % 3) * 6;
      const y = 220 + rowRow * vInterval + (idx % 2) * 6;
      return { x, y };
    }
  };

  const getH3DetailNodePos = (
    nodeId: string,
    leadPos: { x: number; y: number },
    index: number,
    isFicha: boolean,
  ) => {
    if (nodePositions[nodeId]) {
      return nodePositions[nodeId];
    }
    if (isFicha) {
      return { x: leadPos.x + 280, y: leadPos.y - 20 };
    } else {
      return { x: leadPos.x + 550, y: leadPos.y - 150 + index * 70 };
    }
  };

  // Local overrides for modals
  const [showStatusCreatorDirect, setShowStatusCreatorDirect] = useState(false);
  const [showPageCreatorDirect, setShowPageCreatorDirect] = useState(false);

  useEffect(() => {
    if (triggerCreatePage) {
      setShowPageCreatorDirect(true);
      setTriggerCreatePage?.(false);
    }
  }, [triggerCreatePage, setTriggerCreatePage]);

  useEffect(() => {
    if (triggerCreateStatus) {
      setShowStatusCreatorDirect(true);
      setTriggerCreateStatus?.(false);
    }
  }, [triggerCreateStatus, setTriggerCreateStatus]);

  // Funnel multiple pages states
  const [funnelPages, setFunnelPages] = useState<
    { id: string; name: string }[]
  >(() => {
    const saved = localStorage.getItem("ciclocred_funnel_pages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((p) => p.id !== "status");
          if (!filtered.some((p) => p.id === "qualificacao")) {
            filtered.splice(1, 0, {
              id: "qualificacao",
              name: "Visibilidade: Qualificação",
            });
          }
          filtered.unshift({ id: "status", name: "Visibilidade: Status" });
          return filtered;
        }
      } catch (_) {}
    }
    return [
      { id: "status", name: "Visibilidade: Status" },
      { id: "etapas", name: "Visibilidade: Etapas" },
      { id: "perfil", name: "Visibilidade: Perfil" },
      { id: "qualificacao", name: "Visibilidade: Qualificação" },
      { id: "objecoes", name: "Visibilidade: Objeções" },
    ];
  });
  const [activeFunnelsPage, setActiveFunnelsPage] = useState(() => {
    const active = localStorage.getItem("ciclocred_active_funnel_page_id");
    return active ? active : "status";
  });

  useEffect(() => {
    if (
      kanbanViewMode &&
      ["status", "etapas", "perfil", "qualificacao", "objecoes"].includes(
        kanbanViewMode,
      )
    ) {
      setActiveFunnelsPage(kanbanViewMode);
      localStorage.setItem("ciclocred_active_funnel_page_id", kanbanViewMode);
    }
  }, [kanbanViewMode]);

  useEffect(() => {
    setColumns(getKanbanColumns(activeFunnelsPage, activeSystemFlowId));
  }, [activeFunnelsPage, activeSystemFlowId]);

  useEffect(() => {
    const handleUpdate = () => {
      setColumns(getKanbanColumns(activeFunnelsPage, activeSystemFlowId));
    };
    window.addEventListener("kanban-columns-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("kanban-columns-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [activeFunnelsPage, activeSystemFlowId]);
  const handleCycleVisibility = () => {
    const sequence = ["status", "etapas", "perfil", "qualificacao", "objecoes"];
    const currentIndex = sequence.indexOf(activeFunnelsPage);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % sequence.length;
    const nextValue = sequence[nextIndex];
    setActiveFunnelsPage(nextValue);
    localStorage.setItem("ciclocred_active_funnel_page_id", nextValue);
  };

  const [newFunnelPageName, setNewFunnelPageName] = useState("");

  const handleCreateFunnelPage = () => {
    if (!newFunnelPageName.trim()) return;
    const newPage = {
      id: "page_" + Date.now(),
      name: newFunnelPageName.trim(),
    };
    const updated = [...funnelPages, newPage];
    setFunnelPages(updated);
    localStorage.setItem("ciclocred_funnel_pages", JSON.stringify(updated));
    setActiveFunnelsPage(newPage.id);
    localStorage.setItem("ciclocred_active_funnel_page_id", newPage.id);
    setNewFunnelPageName("");
  };

  // Page edit and delete states and handlers
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState("");

  const handleSavePageRename = (pageId: string) => {
    if (!editingPageName.trim()) return;
    const updated = funnelPages.map((page) => {
      if (page.id === pageId) {
        return { ...page, name: editingPageName.trim() };
      }
      return page;
    });
    setFunnelPages(updated);
    localStorage.setItem("ciclocred_funnel_pages", JSON.stringify(updated));
    setEditingPageId(null);
  };

  const handleDeleteFunnelPage = (pageId: string, pageName: string) => {
    setFunnelPageToDelete({ id: pageId, name: pageName });
  };

  useEffect(() => {
    if (triggerEditPage) {
      setEditingPageId(activeFunnelsPage);
      setEditingPageName(
        funnelPages.find((p) => p.id === activeFunnelsPage)?.name || "",
      );
      if (setTriggerEditPage) setTriggerEditPage(false);
    }
  }, [triggerEditPage, activeFunnelsPage, funnelPages, setTriggerEditPage]);

  useEffect(() => {
    if (triggerDeletePage) {
      if (
        !["etapas", "perfil", "qualificacao", "objecoes"].includes(
          activeFunnelsPage,
        )
      ) {
        handleDeleteFunnelPage(
          activeFunnelsPage,
          funnelPages.find((p) => p.id === activeFunnelsPage)?.name || "",
        );
      } else {
        alert("Não é possível inativar/excluir este funil padrão.");
      }
      if (setTriggerDeletePage) setTriggerDeletePage(false);
    }
  }, [triggerDeletePage, activeFunnelsPage, funnelPages, setTriggerDeletePage]);

  useEffect(() => {
    if (triggerHyperfocus) {
      if (setHyperfocusActive) {
        const current =
          typeof hyperfocusActive === "number"
            ? hyperfocusActive
            : hyperfocusActive
              ? 1
              : 0;
        let nextValue: number = 0;
        if (current === 0) {
          nextValue = 1;
        } else if (current === 1) {
          nextValue = 2;
        } else if (current === 2) {
          if (mapaColumns.length > 0) {
            nextValue = 0;
          } else {
            nextValue = 3;
            const statusCols = getKanbanColumns("status");
            setMapaColumns(
              statusCols.map((col) => ({ colId: col.id, pageId: "status" })),
            );
          }
        } else {
          nextValue = 0;
          if (mapaColumns.length === 0) {
            setMapaColumns([]);
          }
        }
        setHyperfocusActive(nextValue);
      }
      if (setTriggerHyperfocus) setTriggerHyperfocus(false);
    }
  }, [
    triggerHyperfocus,
    setTriggerHyperfocus,
    setHyperfocusActive,
    mapaColumns,
  ]);

  // Create / Edit aba state
  const [newAbaName, setNewAbaName] = useState("");
  const [newAbaColor, setNewAbaColor] = useState("blue");
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColLabel, setEditingColLabel] = useState("");

  // Premium Zoom & Density parameters with single-click adaptive focus
  const [zoomState, setZoomState] = useState<
    "compact" | "normal" | "expanded" | "overview"
  >("normal");
  const zoomMode =
    hyperfocusActive === 1
      ? "overview"
      : hyperfocusActive === 2
        ? "compact"
        : zoomState;
  const [showAbaOrganizer, setShowAbaOrganizer] = useState(false);
  const showAbaOrganizerState =
    showOrganizer !== undefined ? showOrganizer : showAbaOrganizer;
  const setShowAbaOrganizerState =
    setShowOrganizer !== undefined ? setShowOrganizer : setShowAbaOrganizer;

  const [funnelPageToDelete, setFunnelPageToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [abaToDelete, setAbaToDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const confirmDeleteFunnelPage = (pageId: string) => {
    const updated = funnelPages.filter((page) => page.id !== pageId);
    setFunnelPages(updated);
    localStorage.setItem("ciclocred_funnel_pages", JSON.stringify(updated));
    if (activeFunnelsPage === pageId) {
      setActiveFunnelsPage("etapas");
      localStorage.setItem("ciclocred_active_funnel_page_id", "etapas");
    }
    setFunnelPageToDelete(null);
  };

  const confirmDeleteAba = (colId: string) => {
    const updatedCols = columns.filter((col) => col.id !== colId);
    setColumns(updatedCols);
    saveKanbanColumns(updatedCols);
    window.dispatchEvent(new Event("kanban-columns-updated"));
    setAbaToDelete(null);
  };

  const handleMoveAbaForward = (idx: number) => {
    if (idx >= columns.length - 1) return;
    const newCols = [...columns];
    const temp = newCols[idx];
    newCols[idx] = newCols[idx + 1];
    newCols[idx + 1] = temp;
    setColumns(newCols);
    saveKanbanColumns(newCols);
    window.dispatchEvent(new Event("kanban-columns-updated"));
  };

  const handleMoveAbaBackward = (idx: number) => {
    if (idx <= 0) return;
    const newCols = [...columns];
    const temp = newCols[idx];
    newCols[idx] = newCols[idx - 1];
    newCols[idx - 1] = temp;
    setColumns(newCols);
    saveKanbanColumns(newCols);
    window.dispatchEvent(new Event("kanban-columns-updated"));
  };

  const handleCreateAba = () => {
    if (!newAbaName.trim()) return;
    if (columns.length >= 10) return;

    const scheme = COLOR_SCHEMES[newAbaColor] || COLOR_SCHEMES.blue;
    const newId = "aba_" + Date.now();
    const newColumn: KanbanColumn = {
      id: newId,
      label: newAbaName.trim(),
      bgClass: scheme.bgClass,
      labelClass: scheme.labelClass,
      accentBorderClass: scheme.accentBorderClass,
    };

    const updatedCols = [...columns, newColumn];
    setColumns(updatedCols);
    saveKanbanColumns(updatedCols);
    setNewAbaName("");

    // Force custom event or window reload triggers if other components need immediate updates
    window.dispatchEvent(new Event("kanban-columns-updated"));
  };

  const handleSaveEditAbaName = (colId: string) => {
    if (!editingColLabel.trim()) return;

    const updatedCols = columns.map((col) => {
      if (col.id === colId) {
        return { ...col, label: editingColLabel.trim() };
      }
      return col;
    });

    setColumns(updatedCols);
    saveKanbanColumns(updatedCols);
    setEditingColId(null);
    setEditingColLabel("");
    window.dispatchEvent(new Event("kanban-columns-updated"));
  };

  const handleDeleteAba = (colId: string) => {
    // Check if there are any leads currently in this column/aba
    const colName = columns.find((c) => c.id === colId)?.label || colId;
    const hasLeads = leads.some((l) => l.status === colId);
    if (hasLeads) {
      setAbaToDelete({ id: colId, label: colName });
    } else {
      const updatedCols = columns.filter((col) => col.id !== colId);
      setColumns(updatedCols);
      saveKanbanColumns(updatedCols);
      window.dispatchEvent(new Event("kanban-columns-updated"));
    }
  };

  function getLeadStatusForPage(lead: any, pageId: string): string {
    if (lead.funnelPlacements && lead.funnelPlacements.length > 0) {
      const placement = lead.funnelPlacements.find(
        (p: any) => p.pageId === pageId,
      );
      if (placement) return placement.status;
    }

    if (pageId === "etapas") {
      return lead.stage || "abordagem";
    }
    if (pageId === "perfil") {
      return lead.mainProfile || "";
    }
    if (pageId === "qualificacao") {
      if (lead.restricacaoBacen === "Sim" || lead.restricaoBacen === "Sim")
        return "nao_qualificado";
      if (lead.programaDesejado === "Minha Casa Minha Vida")
        return "qualificado_mcmv";
      if (lead.programaDesejado === "SBPE") return "qualificado_sbpe";
      return "em_qualificacao";
    }
    if (pageId === "objecoes") {
      return lead.objection || "";
    }
    return lead.status;
  }

  // Dynamic metrics of the H3 canvas to give more internal space when there are more items
  const h3ColCount = mapaColumns.length;
  const h3LeadsCount = useMemo(() => {
    return leads.filter((l) =>
      mapaColumns.some((item) => {
        const leadColId = getLeadStatusForPage(l, item.pageId);
        return leadColId === item.colId;
      }),
    ).length;
  }, [leads, mapaColumns]);

  // Scaled level of hyperfocus goes up to 10
  const h3Level = h3ColCount > 0 ? Math.min(10, h3ColCount + 2) : 0;

  // Responsive zoom scale to provide a modular viewport inside the canvas
  const dynamicZoom = useMemo(() => {
    return Math.max(0.1, Math.min(10.0, h3Zoom / 100));
  }, [h3Zoom]);

  // Handle active wheel zooming with smooth browser prevention
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      setH3Zoom((prevZoom) => {
        // Increment/decrement based on wheel direction
        const delta = e.deltaY < 0 ? 15 : -15;
        const nextZoom = Math.max(10, Math.min(1000, prevZoom + delta));
        
        if (nextZoom !== prevZoom) {
          const oldScale = prevZoom / 100;
          const newScale = nextZoom / 100;
          
          setH3Pan(prevPan => {
            const mapX = (mouseX - prevPan.x) / oldScale;
            const mapY = (mouseY - prevPan.y) / oldScale;
            
            const newPanX = mouseX - (mapX * newScale);
            const newPanY = mouseY - (mapY * newScale);
            
            return { x: newPanX, y: newPanY };
          });
        }
        
        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Auto-center map when columns are added
  useEffect(() => {
    if (mapaColumns.length > 0) {
      const lastColIdx = mapaColumns.length - 1;
      const lastColPos = getHiperfocoPos(
        `col-${mapaColumns[lastColIdx].colId}-${mapaColumns[lastColIdx].pageId}`,
        true,
        lastColIdx
      );
      
      const container = canvasContainerRef.current;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        
        // Target pan: Center the newly added column on screen
        const targetPanX = (width / 2) - (lastColPos.x * dynamicZoom);
        const targetPanY = (height / 3) - (lastColPos.y * dynamicZoom);
        
        setH3Pan({ x: targetPanX, y: targetPanY });
      }
    }
  }, [mapaColumns.length]);

  // High performance window dragging handler with dynamic scaling and direct DOM updates to bypass React re-renders during active drag
  useEffect(() => {
    if (!draggingNodeId) return;

    const handleMove = (clientX: number, clientY: number) => {
      lastMoveCoords.current = { clientX, clientY };

      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        const dx = (clientX - dragStartMouseRef.current.x) / dynamicZoom;
        const dy = (clientY - dragStartMouseRef.current.y) / dynamicZoom;

        const newX = dragStartNodeRef.current.x + dx;
        const newY = dragStartNodeRef.current.y + dy;

        // Update node DOM position directly for ultra-fluid responsive rendering
        const nodeEl = document.getElementById(draggingNodeId);
        if (nodeEl) {
          nodeEl.style.left = `${newX}px`;
          nodeEl.style.top = `${newY}px`;
        }

        // Update connected cables (SVG paths) in the DOM directly for instantaneous redraws
        if (draggingNodeId.startsWith("col-")) {
          const parts = draggingNodeId.split("-");
          if (parts.length >= 3) {
            const colId = parts[1];
            const pageId = parts[2];

            const colIdx = mapaColumns.findIndex(
              (item) => item.colId === colId && item.pageId === pageId,
            );
            if (colIdx !== -1) {
              const colLeads = mapaFilteredLeads.filter(
                (l) => getLeadStatusForPage(l, pageId) === colId,
              );
              colLeads.forEach((lead, leadIdx) => {
                const leadNodeId = `lead-${lead.id}-${pageId}`;
                const leadPos = getHiperfocoPos(
                  leadNodeId,
                  false,
                  colIdx,
                  leadIdx,
                );

                const startX = newX + 88;
                const startY = newY + 40;
                const endX = leadPos.x + 61;
                const endY = leadPos.y + 30;
                const midY = (startY + endY) / 2;
                const dStr = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

                const outerPath = document.getElementById(
                  `cable-outer-${draggingNodeId}-${lead.id}`,
                );
                const innerPath = document.getElementById(
                  `cable-inner-${draggingNodeId}-${lead.id}`,
                );
                if (outerPath) outerPath.setAttribute("d", dStr);
                if (innerPath) innerPath.setAttribute("d", dStr);
              });
            }
          }
        } else if (draggingNodeId.startsWith("lead-")) {
          const parts = draggingNodeId.split("-");
          if (parts.length >= 3) {
            const leadId = parts[1];
            const pageId = parts[2];
            const leadObj = leads.find((l) => l.id === leadId);
            if (leadObj) {
              const colId = getLeadStatusForPage(leadObj, pageId);
              const colIdx = mapaColumns.findIndex(
                (item) => item.colId === colId && item.pageId === pageId,
              );
              if (colIdx !== -1) {
                const colNodeId = `col-${colId}-${pageId}`;
                const colPos = getHiperfocoPos(colNodeId, true, colIdx);

                const colLeads = mapaFilteredLeads.filter(
                  (l) => getLeadStatusForPage(l, pageId) === colId,
                );
                const leadIdx = colLeads.findIndex((l) => l.id === leadId);

                if (leadIdx !== -1) {
                  const startX = colPos.x + 88;
                  const startY = colPos.y + 40;
                  const endX = newX + 61;
                  const endY = newY + 30;
                  const midY = (startY + endY) / 2;
                  const dStr = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

                  const outerPath = document.getElementById(
                    `cable-outer-${colNodeId}-${leadId}`,
                  );
                  const innerPath = document.getElementById(
                    `cable-inner-${colNodeId}-${leadId}`,
                  );
                  if (outerPath) outerPath.setAttribute("d", dStr);
                  if (innerPath) innerPath.setAttribute("d", dStr);
                }
              }
            }

            // Ficha cables
            const fichaNodeId = `fichalead-${leadId}`;
            const fichaPos = nodePositions[fichaNodeId];
            if (fichaPos || document.getElementById(fichaNodeId)) {
              const fichaEl = document.getElementById(fichaNodeId);
              let fx = fichaPos?.x || 0;
              let fy = fichaPos?.y || 0;
              if (fichaEl) {
                fx = parseFloat(fichaEl.style.left) || fx;
                fy = parseFloat(fichaEl.style.top) || fy;
              }
              const sx = newX + 123;
              const sy = newY + 30;
              const ex = fx;
              const ey = fy + 30;
              const mx = (sx + ex) / 2;
              const dStrFicha = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
              const outerFicha = document.getElementById(
                `cable-outer-${draggingNodeId}-${fichaNodeId}`,
              );
              const innerFicha = document.getElementById(
                `cable-inner-${draggingNodeId}-${fichaNodeId}`,
              );
              if (outerFicha) outerFicha.setAttribute("d", dStrFicha);
              if (innerFicha) innerFicha.setAttribute("d", dStrFicha);
            }
          }
        } else if (draggingNodeId.startsWith("fichalead-")) {
          const leadId = draggingNodeId.replace("fichalead-", "");
          const leadNodeEl = document.querySelector(`[id^='lead-${leadId}-']`);
          if (leadNodeEl) {
            const leadNodeId = leadNodeEl.id;
            const lx = parseFloat((leadNodeEl as HTMLElement).style.left) || 0;
            const ly = parseFloat((leadNodeEl as HTMLElement).style.top) || 0;

            const sx = lx + 123;
            const sy = ly + 30;
            const ex = newX;
            const ey = newY + 30;
            const mx = (sx + ex) / 2;
            const dStr = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
            const outerPath = document.getElementById(
              `cable-outer-${leadNodeId}-${draggingNodeId}`,
            );
            const innerPath = document.getElementById(
              `cable-inner-${leadNodeId}-${draggingNodeId}`,
            );
            if (outerPath) outerPath.setAttribute("d", dStr);
            if (innerPath) innerPath.setAttribute("d", dStr);
          }

          const detailProps = [
            "name",
            "email",
            "phone",
            "income",
            "notes",
            "property",
            "tags",
          ];
          detailProps.forEach((prop) => {
            const detailNodeId = `detail-${leadId}-${prop}`;
            const detailEl = document.getElementById(detailNodeId);
            if (detailEl) {
              const dX = parseFloat(detailEl.style.left) || 0;
              const dY = parseFloat(detailEl.style.top) || 0;

              const dsx = newX + 70;
              const dsy = newY + 30;
              const dex = dX;
              const dey = dY + 10;
              const dmx = (dsx + dex) / 2;
              const dStrDet = `M ${dsx} ${dsy} C ${dmx} ${dsy}, ${dmx} ${dey}, ${dex} ${dey}`;

              const outerDet = document.getElementById(
                `cable-outer-${draggingNodeId}-${detailNodeId}`,
              );
              const innerDet = document.getElementById(
                `cable-inner-${draggingNodeId}-${detailNodeId}`,
              );
              if (outerDet) outerDet.setAttribute("d", dStrDet);
              if (innerDet) innerDet.setAttribute("d", dStrDet);
            }
          });
        } else if (draggingNodeId.startsWith("detail-")) {
          const parts = draggingNodeId.split("-");
          if (parts.length >= 3) {
            const leadId = parts[1];
            const fichaNodeId = `fichalead-${leadId}`;
            const fichaEl = document.getElementById(fichaNodeId);
            if (fichaEl) {
              const fx = parseFloat(fichaEl.style.left) || 0;
              const fy = parseFloat(fichaEl.style.top) || 0;

              const dsx = fx + 70;
              const dsy = fy + 30;
              const dex = newX;
              const dey = newY + 10;
              const dmx = (dsx + dex) / 2;
              const dStrDet = `M ${dsx} ${dsy} C ${dmx} ${dsy}, ${dmx} ${dey}, ${dex} ${dey}`;

              const outerDet = document.getElementById(
                `cable-outer-${fichaNodeId}-${draggingNodeId}`,
              );
              const innerDet = document.getElementById(
                `cable-inner-${fichaNodeId}-${draggingNodeId}`,
              );
              if (outerDet) outerDet.setAttribute("d", dStrDet);
              if (innerDet) innerDet.setAttribute("d", dStrDet);
            }
          }
        }
      });
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        // Prevent default browser scrolling or bouncing during drag
        if (e.cancelable) e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleWindowEndDrag = () => {
      // Calculate final position from last known move coordinates to lock into state
      const dx =
        (lastMoveCoords.current.clientX - dragStartMouseRef.current.x) /
        dynamicZoom;
      const dy =
        (lastMoveCoords.current.clientY - dragStartMouseRef.current.y) /
        dynamicZoom;

      const finalX = dragStartNodeRef.current.x + dx;
      const finalY = dragStartNodeRef.current.y + dy;

      setDraggingNodeId(null);

      // Commit exactly once to state and storage
      setNodePositions((prev) => {
        const next = {
          ...prev,
          [draggingNodeId]: { x: finalX, y: finalY },
        };
        try {
          localStorage.setItem(
            "ciclocred_h3_node_positions",
            JSON.stringify(next),
          );
        } catch (_) {}
        return next;
      });
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowEndDrag);
    window.addEventListener("touchmove", handleWindowTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", handleWindowEndDrag);
    window.addEventListener("touchcancel", handleWindowEndDrag);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowEndDrag);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowEndDrag);
      window.removeEventListener("touchcancel", handleWindowEndDrag);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [draggingNodeId, dynamicZoom, leads, mapaColumns]);

  useEffect(() => {
    if (!isPanningCanvas) return;

    const handleMove = (clientX: number, clientY: number) => {
      lastMoveCoords.current = { clientX, clientY };

      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        const dx = clientX - dragStartMouseRef.current.x;
        const dy = clientY - dragStartMouseRef.current.y;

        const newX = dragStartPanRef.current.x + dx;
        const newY = dragStartPanRef.current.y + dy;

        const canvasEl = document.getElementById("h3-canvas-inner");
        if (canvasEl) {
          canvasEl.style.transform = `translate(${newX}px, ${newY}px) scale(${dynamicZoom})`;
        }
      });
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        if (e.cancelable) e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleWindowEndDrag = () => {
      setIsPanningCanvas(false);
      
      const dx = lastMoveCoords.current.clientX - dragStartMouseRef.current.x;
      const dy = lastMoveCoords.current.clientY - dragStartMouseRef.current.y;
      
      const newX = dragStartPanRef.current.x + dx;
      const newY = dragStartPanRef.current.y + dy;
      
      const newPan = { x: newX, y: newY };
      setH3Pan(newPan);
      localStorage.setItem("ciclocred_h3_pan", JSON.stringify(newPan));
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowEndDrag);
    window.addEventListener("touchmove", handleWindowTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", handleWindowEndDrag);
    window.addEventListener("touchcancel", handleWindowEndDrag);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowEndDrag);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowEndDrag);
      window.removeEventListener("touchcancel", handleWindowEndDrag);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPanningCanvas, dynamicZoom]);

  // Filtered leads by selected Funnel Page
  const filteredPageLeads = leads.filter((l) => {
    if (
      ["status", "etapas", "perfil", "qualificacao", "objecoes"].includes(
        activeFunnelsPage,
      )
    ) {
      return true;
    }
    if (l.funnelPlacements && l.funnelPlacements.length > 0) {
      return l.funnelPlacements.some((p) => p.pageId === activeFunnelsPage);
    }
    const lPage = l.funnelPageId || "etapas";
    return lPage === activeFunnelsPage;
  });

  // Filtered leads with local transparent Search bar support
  const filteredLeads = useMemo(() => {
    if (!kanbanSearchText.trim()) return filteredPageLeads;
    const searchLow = kanbanSearchText.toLowerCase();
    return filteredPageLeads.filter((l) => {
      return (
        (l.name && l.name.toLowerCase().includes(searchLow)) ||
        (l.phone && l.phone.toLowerCase().includes(searchLow)) ||
        (l.email && l.email.toLowerCase().includes(searchLow)) ||
        (l.region && l.region.toLowerCase().includes(searchLow)) ||
        (l.bairroEspecifico &&
          l.bairroEspecifico.toLowerCase().includes(searchLow)) ||
        (l.origin && l.origin.toLowerCase().includes(searchLow)) ||
        (l.comoSoube && l.comoSoube.toLowerCase().includes(searchLow)) ||
        (l.programaDesejado &&
          l.programaDesejado.toLowerCase().includes(searchLow)) ||
        (l.familyGrossIncome &&
          String(l.familyGrossIncome).toLowerCase().includes(searchLow)) ||
        (l.familyIncome &&
          String(l.familyIncome).toLowerCase().includes(searchLow))
      );
    });
  }, [filteredPageLeads, kanbanSearchText]);

  const mapaFilteredLeads = useMemo(() => {
    if (!mapaFilter) return leads;
    return leads.filter((l) => {
      let matches = true;
      if (mapaFilter.initial) {
        matches =
          matches &&
          (l.name || "").toLowerCase().startsWith(mapaFilter.initial.toLowerCase());
      }
      if (mapaFilter.today) {
        const todayStr = new Date().toISOString().split("T")[0];
        let leadDate = "";
        if (l.createdAt) {
          const d = new Date(l.createdAt);
          if (!isNaN(d.getTime())) {
            leadDate = d.toISOString().split("T")[0];
          }
        }
        matches = matches && leadDate === todayStr;
      }
      return matches;
    });
  }, [leads, mapaFilter]);

  // O usuário pediu que hiperfoco apenas diminua o zoom para ver todos os status na tela
  const visibleColumns = columns;

  // Calculate sum of values for a column
  const getColumnTotal = (status: string) => {
    return filteredLeads
      .filter((l) => getLeadStatusForPage(l, activeFunnelsPage) === status)
      .reduce((sum, l) => sum + l.value, 0);
  };

  const goPreviousFunnelPage = () => {
    const currentIndex = funnelPages.findIndex(
      (p) => p.id === activeFunnelsPage,
    );
    if (currentIndex > 0) {
      const newPage = funnelPages[currentIndex - 1].id;
      setActiveFunnelsPage(newPage);
      localStorage.setItem("ciclocred_active_funnel_page_id", newPage);
      if ((window as any).setKanbanViewMode)
        (window as any).setKanbanViewMode(newPage);
    } else {
      window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_prev"));
    }
  };

  const goNextFunnelPage = () => {
    const currentIndex = funnelPages.findIndex(
      (p) => p.id === activeFunnelsPage,
    );
    if (currentIndex < funnelPages.length - 1) {
      const newPage = funnelPages[currentIndex + 1].id;
      setActiveFunnelsPage(newPage);
      localStorage.setItem("ciclocred_active_funnel_page_id", newPage);
      if ((window as any).setKanbanViewMode)
        (window as any).setKanbanViewMode(newPage);
    } else {
      window.dispatchEvent(new CustomEvent("ciclocred_cycle_tab_next"));
    }
  };

  useEffect(() => {
    const prevListener = (e: any) => {
      if (e && e.detail) e.detail.handled = true;
      goPreviousFunnelPage();
    };
    const nextListener = (e: any) => {
      if (e && e.detail) e.detail.handled = true;
      goNextFunnelPage();
    };

    window.addEventListener("ciclocred_global_prev_visibility", prevListener);
    window.addEventListener("ciclocred_global_next_visibility", nextListener);

    return () => {
      window.removeEventListener(
        "ciclocred_global_prev_visibility",
        prevListener,
      );
      window.removeEventListener(
        "ciclocred_global_next_visibility",
        nextListener,
      );
    };
  }, [activeFunnelsPage, funnelPages]);

  const renderKanbanColumnsForPage = (
    pageId: "status" | "etapas" | "perfil" | "qualificacao" | "objecoes",
  ) => {
    const pageCols = getKanbanColumns(pageId);

    if (pageCols.length === 0) {
      if (visiblePagesCount > 1) return null;
      return (
        <div className="w-full text-center py-10 bg-zinc-900 border-4 border-dashed border-zinc-700 rounded-2xl p-6 select-none font-mono">
          <span className="text-3xl">🔍</span>
          <h3 className="text-sm font-black text-rose-450 mt-3 uppercase">
            Nenhum Bloco com Leads
          </h3>
          <p className="text-xs text-zinc-500 mt-1 uppercase">
            Todos os blocos deste funil estão vazios.
          </p>
        </div>
      );
    }

    return pageCols.map((col, idx) => {
      const colLeads = leads.filter(
        (l) => getLeadStatusForPage(l, pageId) === col.id,
      );
      const totalValue = colLeads.reduce((sum, l) => sum + (l.value || 0), 0);
      const isOverThisCol = activeDragCol === col.id;
      // Only allow editing in non-hyperfocus, or if the page matches
      const isEditing =
        editingColId === col.id &&
        (!hyperfocusActive || activeFunnelsPage === pageId);

      return (
        <div
          key={col.id}
          onDragOver={(e) => {
            e.preventDefault();
            if (activeDragCol !== col.id) {
              setActiveDragCol(col.id);
            }
          }}
          onDragLeave={() => {
            setActiveDragCol(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const rawDragId = e.dataTransfer.getData("text/plain");
            if (rawDragId && !rawDragId.startsWith("col-header:")) {
              onMoveLead(rawDragId, col.id, pageId);
            }
            setActiveDragCol(null);
          }}
          className={`bg-zinc-950/90 rounded-2xl border-[3px] border-zinc-800 shrink-0 select-none h-[calc(100vh-320px)] flex flex-col transition-colors relative overflow-hidden group hover:border-indigo-500/50 ${
            zoomMode === "compact"
              ? "w-52"
              : zoomMode === "expanded"
                ? "w-[300px]"
                : "w-[260px]"
          } ${
            isOverThisCol
              ? "ring-2 ring-indigo-500 bg-indigo-950/20 translate-y-[-2px] shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              : "shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
          }`}
        >
          {/* Subtle top color bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 group-hover:h-1.5 transition-colors" />

          {/* Column Header */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "text/plain",
                `col-header:${col.id}:${pageId}`,
              );
              e.dataTransfer.effectAllowed = "move";
              setIsDraggingColumn(true);
              setDraggingColId(col.id);
            }}
            onDragEnd={() => {
              setIsDraggingColumn(false);
              setDraggingColId(null);
            }}
            className={`cursor-grab active:cursor-grabbing flex flex-col gap-1 transition-colors ${
              draggingColId === col.id
                ? "bg-purple-950/90 border-2 border-purple-500 rounded-xl p-2 scale-95 shadow-[0_0_20px_rgba(168,85,247,0.6)] text-purple-200"
                : `border-b-[3px] border-zinc-800 bg-zinc-900 rounded-t-xl hover:bg-zinc-850/80 ${
                    zoomMode === "compact"
                      ? "p-1.5"
                      : zoomMode === "expanded"
                        ? "p-3.5"
                        : "p-2.5"
                  }`
            }`}
            title="Arraste o cabeçalho para baixo para o Portal de Hiperfoco 3! 🌌"
          >
            <div className="flex items-center justify-between gap-1">
              {isEditing ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    type="text"
                    value={editingColLabel}
                    onChange={(e) => setEditingColLabel(e.target.value)}
                    className="bg-white border-2 border-zinc-950 rounded p-1 text-xs font-black text-zinc-950 w-full outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEditAbaName(col.id)}
                    className="p-1 bg-emerald-600 text-white rounded border border-zinc-950"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingColId(null);
                      setEditingColLabel("");
                    }}
                    className="p-1 bg-red-500 text-white rounded border border-zinc-950"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/header w-full justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <input
                      type="checkbox"
                      checked={colLeads.length > 0 && colLeads.every(l => selectedLeadIds.includes(l.id))}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleColumnSelection(col.id, pageId);
                      }}
                      className="w-3.5 h-3.5 rounded border-zinc-750 bg-zinc-950 text-indigo-550 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                      title="Selecionar/Deselecionar todos os leads desta coluna"
                    />
                    <div className="flex flex-col truncate">
                      {visiblePagesCount > 1 && (
                        <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase leading-none mb-1 select-none block truncate max-w-[130px]">
                          {funnelPages
                            .find((p) => p.id === pageId)
                            ?.name?.replace("Visibilidade: ", "") || pageId}
                        </span>
                      )}
                      <h3
                        className={`font-sans font-black uppercase italic tracking-tight ${
                          zoomMode === "compact" ? "text-[9px]" : "text-[11px]"
                        } text-zinc-100 truncate mr-1`}
                      >
                        {col.label}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setEditingColId(col.id);
                        setEditingColLabel(col.label);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-indigo-600 hover:bg-white/60 transition"
                      title="Editar nome"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          mapaColumns.some(
                            (item) =>
                              item.colId === col.id && item.pageId === pageId,
                          )
                        ) {
                          setMapaColumns((prev) =>
                            prev.filter(
                              (item) =>
                                !(
                                  item.colId === col.id &&
                                  item.pageId === pageId
                                ),
                            ),
                          );
                        } else {
                          setMapaColumns((prev) => {
                            if (prev.length >= 10) return prev;
                            return [...prev, { colId: col.id, pageId }];
                          });
                        }
                      }}
                      className={`p-1 rounded text-xs transition flex items-center justify-center ${
                        mapaColumns.some(
                          (item) =>
                            item.colId === col.id && item.pageId === pageId,
                        )
                          ? "bg-purple-950/40 text-purple-400 border border-purple-500/30"
                          : "text-zinc-400 hover:text-purple-450 hover:bg-purple-950/20"
                      }`}
                      title={
                        mapaColumns.some(
                          (item) =>
                            item.colId === col.id && item.pageId === pageId,
                        )
                          ? "Retirar do Mapa"
                          : "Enviar ao Mapa 🌌"
                      }
                    >
                      🌌
                    </button>
                    {!hyperfocusActive && columns.length > 1 && (
                      <button
                        onClick={() => handleDeleteAba(col.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Excluir aba"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-xs bg-zinc-900 text-white border border-zinc-950 px-2 py-0.5 rounded font-mono font-black shadow-[1.1px_1.1px_0px_0px_rgba(0,0,0,0.5)] leading-none">
                      {colLeads.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-700 mt-2 font-mono font-black">
              <span>VALOR:</span>
              <span
                key={`${col.id}-${totalValue}-${colLeads.length}`}
                className="font-mono bg-zinc-950 text-emerald-400 px-1.5 py-0.5 rounded border border-zinc-800 text-[9px] inline-block"
              >
                {totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>

          {/* Column Cards Container */}
          <div
            className={`flex-1 overflow-y-auto overflow-x-hidden ${
              zoomMode === "compact"
                ? "p-1 space-y-1"
                : "p-2 space-y-2"
            } transition-colors custom-scrollbar ${
              isOverThisCol ? "bg-indigo-950/40" : "bg-zinc-950/50"
            }`}
            id={`kanban-column-${col.id}`}
          >
            {colLeads.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center ${zoomMode === "compact" ? "py-6" : "py-16"} text-center select-none text-zinc-400`}
              >
                <Building2
                  className={`${zoomMode === "compact" ? "w-6 h-6 mb-1" : "w-8 h-8 mb-2"} opacity-20`}
                />
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                  Vazio
                </p>
              </div>
            ) : (
              colLeads.map((lead) => {
                const daysSinceContact = getDaysSinceContact(
                  lead.lastContactAt,
                );
                const isOverdue =
                  daysSinceContact !== null && daysSinceContact > 7;

                return (
                  <div
                    id={`lead-card-${lead.id}`}
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      e.currentTarget.classList.add("opacity-40");
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove("opacity-40");
                    }}
                    className={`group bg-zinc-900 border-[2px] ${
                      selectedLeadIds.includes(lead.id) ? "border-indigo-550 ring-2 ring-indigo-500/30 bg-indigo-950/10" : "border-zinc-805/90"
                    } hover:border-indigo-500 rounded-xl transition-colors relative overflow-hidden ${
                      zoomMode === "compact" || zoomMode === "overview"
                        ? "p-2 shadow-[2px_2px_0px_0px_rgba(15,15,15,1)]"
                        : zoomMode === "expanded"
                          ? "p-4 shadow-[4px_4px_0px_0px_rgba(15,15,15,1)]"
                          : "p-3 shadow-[3px_3px_0px_0px_rgba(15,15,15,1)]"
                    } hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-grab active:cursor-grabbing`}
                  >
                    <div className="flex flex-col gap-2 font-sans">
                      {/* Header NOME */}
                      <div className="border-b border-zinc-805/85 pb-1 flex justify-between items-center gap-2 px-1">
                        <div className="flex items-center gap-1.5 min-w-0 w-full">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleLeadSelection(lead.id);
                            }}
                            className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-indigo-500 cursor-pointer accent-indigo-650 shrink-0"
                            title="Selecionar lead para ações em lote"
                          />
                          <button
                            onClick={() => onOpenLeadDetails(lead)}
                            className="text-zinc-100 hover:text-indigo-400 font-sans font-black text-left transition-colors truncate uppercase tracking-tight text-[9px] w-full"
                          >
                            {lead.name}
                          </button>
                        </div>
                        {isOverdue && (
                            <span className="flex items-center gap-0.5 text-[7px] bg-red-100 text-red-950 rounded px-1 font-mono font-black select-none shrink-0" title={`Último contato foi há ${daysSinceContact} dias!`}>
                                <AlertTriangle className="w-2 h-2 text-red-650 shrink-0" />
                                {daysSinceContact}d
                            </span>
                        )}
                      </div>

                      {/* CARD CONTENT COMPACT */}
                      <div className="text-zinc-400 text-[8px] pb-1 px-1 flex flex-col gap-1">
                        <div className="flex justify-between items-center font-mono">
                          <span className="text-zinc-300 font-bold truncate">{lead.phone || "-"}</span>
                          <div className="flex gap-2">
                            <div className="flex items-center text-emerald-400 font-black text-[7px]" title="Renda Líquida">
                              <span className="mr-0.5">L</span>
                              <input
                                type="number"
                                defaultValue={lead.familyIncome || 0}
                                onBlur={(e) => {
                                  if (onUpdateLeadField && Number(e.target.value) !== lead.familyIncome) {
                                    onUpdateLeadField(lead.id, { familyIncome: Number(e.target.value) });
                                  }
                                }}
                                className="bg-transparent focus:outline-none w-10 text-right"
                              />
                            </div>
                            <div className="flex items-center text-indigo-400 font-black text-[7px]" title="Renda Bruta">
                              <span className="mr-0.5">B</span>
                              <input
                                type="number"
                                defaultValue={lead.familyGrossIncome || 0}
                                onBlur={(e) => {
                                  if (onUpdateLeadField && Number(e.target.value) !== lead.familyGrossIncome) {
                                    onUpdateLeadField(lead.id, { familyGrossIncome: Number(e.target.value) });
                                  }
                                }}
                                className="bg-transparent focus:outline-none w-10 text-right"
                              />
                            </div>
                          </div>
                        </div>

                        {/* BLOCOS RAPIDOS */}
                        <div className="grid grid-cols-3 gap-0.5">
                          <select
                            title="Etapa"
                            value={lead.stage || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { stage: e.target.value })}
                            className="text-[6px] font-black uppercase font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm py-0.5"
                          >
                            <option value="">ETAPA</option>
                            {memoizedEtapasColumns.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                          <select
                            title="Perfil"
                            value={lead.mainProfile || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { mainProfile: e.target.value as any })}
                            className="text-[6px] font-black uppercase font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm py-0.5"
                          >
                            <option value="">PERFIL</option>
                            {memoizedPerfilColumns.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                          <select
                            title="Objeção"
                            value={lead.objection || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { objection: e.target.value })}
                            className="text-[6px] font-black uppercase font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm py-0.5"
                          >
                            <option value="">OBJEÇÃO</option>
                            {memoizedObjecoesColumns.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                        </div>
                      </div>

                      {/* AÇÕES COMPACT */}
                      <div className="grid grid-cols-6 gap-0.5 pt-0.5 border-t border-zinc-800/80 px-1">
                          <button onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, "")}`)} className="p-0.5 bg-zinc-800 hover:bg-emerald-950/40 text-emerald-500 rounded flex justify-center"><MessageCircle className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onNavigateToFollowUp ? onNavigateToFollowUp(lead) : onOpenEditModal(lead)} className="p-0.5 bg-zinc-800 hover:bg-amber-950/40 text-amber-500 rounded flex justify-center"><Bell className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onOpenRuleEngine && onOpenRuleEngine(lead)} className="p-0.5 bg-zinc-800 hover:bg-indigo-950/40 text-indigo-500 rounded flex justify-center"><Bot className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onOpenLeadDetails(lead)} className="p-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded flex justify-center"><FileText className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onMoveLead(lead.id, "prospect", "etapas")} className="p-0.5 bg-zinc-800 hover:bg-sky-950/40 text-sky-500 rounded flex justify-center"><ChevronDown className="w-2.5 h-2.5" /></button>
                          <button onClick={() => { if(window.confirm("Certeza?")) { onDeleteLead && onDeleteLead(lead.id) } }} className="p-0.5 bg-zinc-800 hover:bg-rose-950/40 text-rose-500 rounded flex justify-center"><Trash2 className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className={`flex flex-col h-full relative space-y-4`}
    >
      {tableHeaderComponent && !renderOnlyMap && (
        <div className="w-full">
          {typeof tableHeaderComponent === "function"
            ? tableHeaderComponent([], {})
            : tableHeaderComponent}
        </div>
      )}

      {/* 🗺️ AMBIENTE MAPA: AMBIENTE DE CONEXÃO DE NÓS (Renders stably above the Kanban columns) */}
      {!renderOnlyColumns && (
        <div className={`${renderOnlyMap ? "w-full h-full" : "mb-6 bg-zinc-950 rounded-[30px] p-4 xl:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] pb-8"} relative transition-colors w-full`}>
          <div className={`flex flex-col xl:flex-row gap-6 w-full items-start ${renderOnlyMap ? "h-full" : ""}`}>
            {/* WIDGET 1: CÉREBRO DE COMANDO NLP & COLIGAÇÃO DE ESTOQUE */}
            <div
              style={{ height: renderOnlyMap ? "100%" : `${mapHeight}px` }}
              className={`w-full xl:w-[350px] shrink-0 bg-zinc-950/80 border-2 border-purple-500/10 rounded-2xl p-4 shadow-md flex flex-col gap-4 self-stretch justify-start overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 text-white`}
            >
              {/* NLP Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider font-sans uppercase text-zinc-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <span>Linguagem Natural (NLP)</span>
                  </span>
                  <span className="text-[8px] font-mono font-black py-0.5 px-1 bg-purple-950 text-purple-400 border border-purple-500/20 uppercase rounded leading-none">
                    Gemini Ativo
                  </span>
                </div>
                <textarea
                  value={nlpCommandText}
                  onChange={(e) => setNlpCommandText(e.target.value)}
                  placeholder="Ex: 'Agendar visita com João Silva amanhã às 14:00' ou 'Mover Marcos para Proposta'..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[10px] text-white focus:outline-none focus:border-purple-500/60 placeholder-zinc-600 h-24 resize-none leading-relaxed font-mono"
                />
                <button
                  type="button"
                  onClick={handleNlpExecute}
                  disabled={nlpProcessing}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider transition shadow-[0_2px_10px_rgba(168,85,247,0.3)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {nlpProcessing ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full " />
                      <span>Processando Ordenação...</span>
                    </>
                  ) : (
                    <>
                      <span>Executar Comando CRM</span>
                    </>
                  )}
                </button>

                {nlpFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-[9px] font-bold font-mono transition-colors uppercase leading-relaxed ${
                      nlpFeedback.type === "success"
                        ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400"
                        : nlpFeedback.type === "error"
                          ? "bg-rose-950/40 border-rose-500/20 text-rose-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 border-b border-white/5 pb-1">
                      <span>Resultado:</span>
                      <button
                        onClick={() => setNlpFeedback(null)}
                        className="hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="whitespace-pre-line">{nlpFeedback.msg}</p>
                  </div>
                )}
              </div>

              {/* Connected / Selected Node Workspace */}
              <div className="border-t border-zinc-800/80 pt-3 flex-1 flex flex-col justify-start">
                {!selectedH3LeadId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 py-8 border-2 border-dashed border-zinc-800/60 rounded-xl bg-zinc-900/10 self-stretch">
                    <span className="text-2xl opacity-40">🔌</span>
                    <h5 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mt-2">
                      Nenhum Nó Vinculado
                    </h5>
                    <p className="text-[8px] text-zinc-500 leading-normal max-w-xs mt-1">
                      Clique em qualquer nó de Lead no Canvas ao lado para
                      linkar sua ficha à Coligação de Estoque e Google Agenda.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const lead = leads.find((l) => l.id === selectedH3LeadId);
                    if (!lead)
                      return (
                        <p className="text-[10px] text-zinc-500">
                          Lead não encontrado ou removido.
                        </p>
                      );

                    // Find linking property from the real estate stock list
                    const linkedProp = properties.find(
                      (p) =>
                        p.id === lead.propertyInterest ||
                        p.title === lead.propertyInterest,
                    );

                    // Filter properties that fit the familyGrossIncome or value
                    const fitProps = properties
                      .filter((p) => {
                        const lValue = lead.value || 300000;
                        return p.price ? p.price <= lValue * 1.35 : true;
                      })
                      .slice(0, 3);

                    return (
                      <div className="space-y-4 flex flex-col justify-start align-stretch w-full">
                        {/* Header of Active Node */}
                        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl relative">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[7px] font-mono font-black text-purple-400 bg-purple-950/55 px-1 py-0.5 rounded leading-none">
                                NO-VINCULADO
                              </span>
                              <h4 className="text-xs font-black uppercase text-white tracking-widest mt-1 truncate max-w-[190px]">
                                {lead.name}
                              </h4>
                              <p className="text-[8px] font-mono font-bold text-zinc-500 mt-0.5">
                                {lead.email || "Sem e-mail"}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedH3LeadId(null)}
                              className="text-zinc-600 hover:text-white text-[9px]"
                              title="Desvincular nó"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] font-mono border-t border-zinc-800/80 pt-1.5 font-black uppercase">
                            <div>
                              <span className="block text-zinc-500">
                                RENDA LÍQUIDA:
                              </span>
                              <span className="text-white">
                                R${" "}
                                {(
                                  lead.familyIncome ||
                                  lead.familyGrossIncome ||
                                  0
                                ).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <div>
                              <span className="block text-zinc-500">
                                CARTA CRÉDITO:
                              </span>
                              <span className="text-emerald-450 font-black">
                                R$ {(lead.value || 0).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Google Agenda direct scheduler */}
                        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl space-y-2">
                          <h5 className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                            <span>📅 Agendador de Visitas Google</span>
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[7px] text-zinc-500 font-mono font-black uppercase block">
                                DATA:
                              </label>
                              <input
                                type="date"
                                value={agendaDate}
                                onChange={(e) => setAgendaDate(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-[9px] text-white p-1 rounded-md outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[7px] text-zinc-500 font-mono font-black uppercase block">
                                HORA:
                              </label>
                              <input
                                type="time"
                                value={agendaTime}
                                onChange={(e) => setAgendaTime(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-[9px] text-white p-1 rounded-md outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] text-zinc-500 font-mono font-black uppercase block">
                              ATIVIDADE COMPROMISSO:
                            </label>
                            <select
                              value={agendaActivity}
                              onChange={(e) =>
                                setAgendaActivity(e.target.value)
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 text-[9px] text-white p-1.5 rounded-md outline-none"
                            >
                              <option value="Visita Técnica no Decorado Cury">
                                Visita Técnica no Decorado Cury
                              </option>
                              <option value="Assinatura de Contrato cicloCRED">
                                Assinatura de Contrato cicloCRED
                              </option>
                              <option value="Apresentação de Fluxo Caixa">
                                Apresentação de Fluxo Caixa
                              </option>
                              <option value="Follow-up Call de crédito">
                                Follow-up Call de crédito
                              </option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!agendaDate || !agendaTime) {
                                alert(
                                  "Defina a data e o horário para o agendamento.",
                                );
                                return;
                              }
                              const startDateTime = `${agendaDate}T${agendaTime}:00`;
                              const endHour =
                                parseInt(agendaTime.slice(0, 2)) + 1;
                              const endHourStr =
                                endHour < 10 ? `0${endHour}` : String(endHour);
                              const endDateTime = `${agendaDate}T${endHourStr === "24" ? "23" : endHourStr}:${agendaTime.slice(3, 5)}:00`;

                              const hasGToken = !!(
                                localStorage.getItem("gcal_access_token") ||
                                localStorage.getItem("workspace_token")
                              );

                              if (onUpdateLeadField) {
                                onUpdateLeadField(lead.id, {
                                  lastContactAt: new Date().toISOString(),
                                  notes: `${lead.notes || ""}\n\n[AGENDAMENTO ${agendaActivity.toUpperCase()}]: Agendado para ${agendaDate} às ${agendaTime}.`,
                                });
                              }

                              if (hasGToken) {
                                fetch(
                                  "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("gcal_access_token") || localStorage.getItem("workspace_token")}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      summary: `[cicloCRED] ${agendaActivity} - ${lead.name}`,
                                      description: `Agendamento coligado via Workspace CRM.\n\nLead: ${lead.name}\nEmail: ${lead.email}\nTelefone: ${lead.phone}`,
                                      start: {
                                        dateTime: startDateTime,
                                        timeZone:
                                          Intl.DateTimeFormat().resolvedOptions()
                                            .timeZone,
                                      },
                                      end: {
                                        dateTime: endDateTime,
                                        timeZone:
                                          Intl.DateTimeFormat().resolvedOptions()
                                            .timeZone,
                                      },
                                    }),
                                  },
                                )
                                  .then((res) => {
                                    if (res.ok) {
                                      alert(
                                        "Compromisso sincronizado e adicionado com sucesso na sua conta Google Agenda real!",
                                      );
                                    } else {
                                      alert(
                                        "Gravado localmente! Dica: O token do Google Agenda expirou. Recarregue e renove seu login na aba Workspace.",
                                      );
                                    }
                                  })
                                  .catch(() =>
                                    alert(
                                      "Agendado localmente com sucesso no histórico!",
                                    ),
                                  );
                              } else {
                                alert(
                                  "Salvo localmente no histórico da ficha do Lead! Para enviar ao Google Agenda real, vincule seu login do Google na aba Configurações/Workspace.",
                                );
                              }
                              setAgendaDate("");
                              setAgendaTime("");
                            }}
                            className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase tracking-wider transition font-sans"
                          >
                            Confirmar Agendamento Real
                          </button>
                        </div>

                        {/* Real estate coligation */}
                        <div className="bg-zinc-900 border border-zinc-855 p-3 rounded-xl space-y-2">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                            <h5 className="text-[9px] font-black text-white uppercase tracking-wider">
                              🏡 Coligação de Estoque Cury / MCMV
                            </h5>
                            {linkedProp && (
                              <span className="text-[7.5px] px-1 py-0.5 bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-bold uppercase rounded leading-none">
                                VINCULADO
                              </span>
                            )}
                          </div>

                          {linkedProp ? (
                            <div className="p-2.5 bg-zinc-950/70 border border-emerald-500/10 rounded-lg">
                              <span className="text-[7px] text-zinc-500 font-mono block">
                                UNIDADE ATIVA:
                              </span>
                              <h6 className="text-[10px] font-black text-white uppercase mt-0.5">
                                {linkedProp.title || linkedProp.name}
                              </h6>
                              <p className="text-[8px] text-zinc-400 font-mono mt-0.5">
                                Valor: R${" "}
                                {(linkedProp.price || 0).toLocaleString(
                                  "pt-BR",
                                )}
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateLeadField) {
                                    onUpdateLeadField(lead.id, {
                                      propertyInterest: "",
                                    });
                                  }
                                }}
                                className="mt-2 text-[8px] text-rose-400 hover:text-rose-300 font-bold uppercase transition"
                              >
                                ✕ Desvincular Unidade
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="text-[8px] text-zinc-500 leading-normal">
                                Selecione uma das opções do estoque para
                                vincular com proposta ao lead:
                              </p>
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                {fitProps.length === 0 ? (
                                  <p className="text-[8px] text-zinc-650 font-mono italic">
                                    Estoque vazio. Importe imóveis na aba
                                    Estoque.
                                  </p>
                                ) : (
                                  fitProps.map((prop, propIdx) => (
                                    <div
                                      key={propIdx}
                                      className="flex items-center justify-between gap-1.5 p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg hover:border-purple-500/20 transition font-sans"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <h6 className="text-[9px] font-black text-white truncate uppercase">
                                          {prop.title || prop.name}
                                        </h6>
                                        <p className="text-[7.5px] text-emerald-400 font-mono font-bold">
                                          R${" "}
                                          {(prop.price || 0).toLocaleString(
                                            "pt-BR",
                                          )}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsGeneratingPitch(true);
                                          setGeneratedPitch("");
                                          if (onUpdateLeadField) {
                                            onUpdateLeadField(lead.id, {
                                              propertyInterest:
                                                prop.title ||
                                                prop.name ||
                                                String(prop.id),
                                              notes: `${lead.notes || ""}\n\n[PROPOSTA DE UNIDADE]: Coligou o imóvel "${prop.title || prop.name}" no valor de R$ ${(prop.price || 0).toLocaleString("pt-BR")}.`,
                                            });
                                          }

                                          fetch("/api/ai/generate-pitch", {
                                            method: "POST",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              leadName: lead.name,
                                              income:
                                                lead.familyIncome ||
                                                lead.familyGrossIncome ||
                                                0,
                                              budget:
                                                prop.price ||
                                                lead.value ||
                                                250000,
                                              propertyInterest:
                                                prop.title || prop.name,
                                              notes: lead.notes,
                                              agency: "cicloCRED CRM",
                                              agentName:
                                                "Consultor de Crédito cicloCRED",
                                            }),
                                          })
                                            .then((res) => res.json())
                                            .then((data) => {
                                              setGeneratedPitch(
                                                data.script || data.text || "",
                                              );
                                            })
                                            .catch(() => {
                                              const fallbackP = `📲 *Apresentação cicloCRED imobiliária Cury*\n\nOlá *${lead.name}*, tudo bem?\n\nSelecionamos a dedo uma unidade no empreendimento *${prop.title || prop.name}*, com valor de R$ ${(prop.price || 240000).toLocaleString("pt-BR")}.\n\nEsse perfil está perfeitamente alinhado com a sua renda declarada de R$ ${(lead.familyIncome || 0).toLocaleString("pt-BR")}. Vamos agendar uma simulação com aprovação Caixa?\n\nFico à disposição!`;
                                              setGeneratedPitch(fallbackP);
                                            })
                                            .finally(() =>
                                              setIsGeneratingPitch(false),
                                            );
                                        }}
                                        className="py-1 px-2 rounded-md bg-purple-900/60 border border-purple-500/20 text-[8px] font-black hover:bg-purple-800 text-purple-300 hover:text-white transition whitespace-nowrap"
                                      >
                                        Coligar
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* WhatsApp Generated Pitch display */}
                          {(isGeneratingPitch || generatedPitch) && (
                            <div className="border-t border-zinc-800 pt-2 space-y-1">
                              <span className="text-[8px] font-black text-purple-400 font-mono tracking-widest block uppercase ">
                                ✨ WHATSAPP PITCH - CO-PRODUÇÃO GEMINI
                              </span>
                              {isGeneratingPitch ? (
                                <div className="flex items-center gap-1.5 p-2 bg-zinc-950/60 rounded-lg text-zinc-500 font-mono text-[8px]">
                                  <span className="w-2.5 h-2.5 border-2 border-purple-500 border-t-transparent rounded-full " />
                                  <span>Co-produzindo pitch de vendas...</span>
                                </div>
                              ) : (
                                <div className="space-y-1.5 w-full">
                                  <textarea
                                    readOnly
                                    value={generatedPitch}
                                    className="w-full bg-zinc-950 text-white rounded-lg p-2 text-[8.5px] border border-zinc-800 font-mono h-28 leading-relaxed outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        generatedPitch,
                                      );
                                      alert(
                                        "Pitch copiado para a área de transferência! Envie de forma premium via WhatsApp.",
                                      );
                                    }}
                                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-wider transition font-sans"
                                  >
                                    Copiar Mensagem do Whatsapp
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* WIDGET 2: GRAPH NODES CANVAS AREA */}
            <div
              ref={canvasContainerRef}
              style={{ height: renderOnlyMap ? "100%" : `${mapHeight}px` }}
              className="flex-1 min-w-0 relative overflow-hidden rounded-[24px] border border-zinc-800/60 bg-[#0c0c0e] w-full"
              onDrop={handleDropOnH3Canvas}
              onDragOver={(e) => e.preventDefault()}
            >
              <CognitiveMap 
                leads={mapaFilteredLeads} 
                properties={externalProperties} 
                onUpdateLeadField={onUpdateLeadField} 
                onNodeClick={onOpenLeadDetails}
                onOSClick={onOSClick}
                onAddToDispatchQueue={onAddToDispatchQueue}
                importBatches={importBatches}
                operationalFlows={operationalFlows}
                activeSystemFlowId={activeSystemFlowId}
              />
              {/* Option for bottom border expansion by dragging down */}
              {!renderOnlyMap && (
                <div
                  onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startHeight = mapHeight;
                  const onMouseMove = (moveEvent: MouseEvent) => {
                    const deltaY = moveEvent.clientY - startY;
                    const newHeight = Math.max(
                      300,
                      Math.min(1500, startHeight + deltaY),
                    );
                    setMapHeight(newHeight);
                    localStorage.setItem(
                      "ciclocred_kanban_map_height",
                      String(newHeight),
                    );
                  };
                  const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                  };
                  document.addEventListener("mousemove", onMouseMove);
                  document.addEventListener("mouseup", onMouseUp);
                }}
                className="absolute bottom-0 left-0 right-0 h-4 bg-zinc-900 hover:bg-indigo-600 cursor-row-resize flex items-center justify-center transition-colors rounded-b-[30px] border-t border-zinc-800/80 z-40 select-none group"
                title="Arraste para baixo para expandir a altura do mapa"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-white " />
                  <span className="text-[9px] font-mono font-black tracking-wider text-zinc-500 group-hover:text-white uppercase">
                    Puxe para expandir ambiente ↕️
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-white " />
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!renderOnlyMap && (
        <>
          {/* Dynamic Clickable Section Tabs from funnelPages */}
          <div className="flex flex-wrap gap-2.5 items-center justify-between w-full mb-2 px-1 select-none">
            {(() => {
              const activePage =
                funnelPages.find((p) => p.id === activeFunnelsPage) ||
                funnelPages[0];
              if (!activePage) return null;

              let icon = "📁";
              let displayName = activePage.name.replace("Visibilidade: ", "");
              if (activePage.id === "status") {
                icon = "📊";
                displayName = "Status";
              } else if (activePage.id === "etapas") {
                icon = "🚀";
                displayName = "Etapas";
              } else if (activePage.id === "perfil") {
                icon = "👤";
                displayName = "Perfil";
              } else if (activePage.id === "qualificacao") {
                icon = "🎯";
                displayName = "Qualificação";
              } else if (activePage.id === "objecoes") {
                icon = "🛑";
                displayName = "Objeções";
              }

              const cycleFunnelPage = () => {
                const currentIndex = funnelPages.findIndex(
                  (p) => p.id === activeFunnelsPage,
                );
                const nextIndex = (currentIndex + 1) % funnelPages.length;
                const nextPage = funnelPages[nextIndex];
                setActiveFunnelsPage(nextPage.id);
                localStorage.setItem(
                  "ciclocred_active_funnel_page_id",
                  nextPage.id,
                );
                if ((window as any).setKanbanViewMode)
                  (window as any).setKanbanViewMode(nextPage.id);
              };

              return (
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[10px] md:text-xs font-black uppercase tracking-wider">
                    Visibilidade Funil:
                  </span>
                  <button
                    type="button"
                    onClick={cycleFunnelPage}
                    className="flex items-center gap-2.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-zinc-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors text-xs font-black uppercase tracking-wider relative cursor-pointer active:translate-y-[1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    title="Clique para alternar a visibilidade do funil"
                  >
                    <span className="text-sm">{icon}</span>
                    <span>{displayName}</span>
                  </button>
                </div>
              );
            })()}
          </div>
          {/* Transparent Unified Search Bar with Side Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/30  border-[2px] border-zinc-800 p-3 rounded-2xl shadow-lg w-full mb-3">
            {/* LADO ESQUERDO: 🗑️✏️📁 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => confirmDeleteFunnelPage(activeFunnelsPage)}
                title="Excluir Página Atual (🗑️ - Excluir visibilidade)"
                className="w-10 h-10 rounded-xl bg-zinc-800/40 hover:bg-red-500/10 border border-zinc-700/50 hover:border-red-500/40 text-rose-400 font-bold transition flex items-center justify-center text-lg shrink-0 shadow-sm"
              >
                🗑️
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPageId(activeFunnelsPage);
                  setEditingPageName(
                    funnelPages.find((p) => p.id === activeFunnelsPage)?.name ||
                      "",
                  );
                }}
                title="Editar Título de Visibilidade (✏️ - Editar título de visibilidade)"
                className="w-10 h-10 rounded-xl bg-zinc-800/40 hover:bg-amber-500/10 border border-zinc-700/50 hover:border-amber-500/40 text-amber-400 font-bold transition flex items-center justify-center text-lg shrink-0 shadow-sm"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => setShowPageCreatorDirect(true)}
                title="Criar Nova Visibilidade (📁 - Criar nova visibilidade)"
                className="w-10 h-10 rounded-xl bg-zinc-800/40 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/40 text-emerald-400 font-bold transition flex items-center justify-center text-lg shrink-0 shadow-sm"
              >
                📁
              </button>
            </div>

            {/* CENTRO: Barra de pesquisa transparente */}
            <div className="flex-1 relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </span>
              <input
                type="text"
                placeholder="Buscar Leads no Funil..."
                value={kanbanSearchText}
                onChange={(e) => setKanbanSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40 text-white placeholder-zinc-500 font-bold font-mono text-xs rounded-xl focus:border-indigo-500/60 focus:ring-0 outline-none transition-colors"
              />
            </div>

            {/* LADO DIREITO: 🔍🔄➕ */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFocusClick}
                className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl border transition shrink-0 shadow-sm ${
                  hyperfocusActive
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/30"
                    : "bg-zinc-800/40 border-zinc-700/50 text-indigo-400 hover:bg-zinc-750/50"
                }`}
                title="Clique para alternar o Hiperfoco do Funil (H1 -> H2 -> H3 -> H1). Duplo clique para fechar e retornar à página ativa."
              >
                <span className="text-base">🔍</span>
                {hyperfocusActive ? (
                  <span className="text-[7px] leading-none text-indigo-400 font-mono font-bold">
                    H{hyperfocusActive}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setShowAbaOrganizerState(!showAbaOrganizerState)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition shrink-0 text-lg shadow-sm ${
                  showAbaOrganizerState
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                    : "bg-zinc-800/40 border-zinc-700/50 text-indigo-400 hover:bg-zinc-700/40"
                }`}
                title="Organizador de colunas (🔄)"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowStatusCreatorDirect(!showStatusCreatorDirect)
                }
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition shrink-0 text-lg shadow-sm ${
                  showStatusCreatorDirect
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                    : "bg-zinc-800/40 border-zinc-700/50 text-emerald-500 hover:bg-zinc-700/40"
                }`}
                title="Adicionar colunas (➕)"
              >
                ➕
              </button>
            </div>
          </div>

          {showStatusCreatorDirect && (
            <div className="bg-zinc-50 border-2 border-zinc-300 p-3 rounded-xl flex flex-wrap items-center gap-3 w-full ">
              <input
                type="text"
                placeholder="Nome do Novo Bloco..."
                value={newAbaName}
                onChange={(e) => setNewAbaName(e.target.value)}
                className="bg-white border-2 border-zinc-950 text-xs px-3 py-2 rounded-lg font-bold shrink-0 w-48 font-mono outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAba();
                  if (e.key === "Escape") setShowStatusCreatorDirect(false);
                }}
              />
              <select
                value={newAbaColor}
                onChange={(e) => setNewAbaColor(e.target.value)}
                className="bg-white border-2 border-zinc-950 text-xs px-2 py-2 rounded-lg font-black uppercase outline-none shrink-0 cursor-pointer"
              >
                <option value="blue">🔵 Azul</option>
                <option value="amber">🟡 Amarelo</option>
                <option value="indigo">🟣 Roxo</option>
                <option value="emerald">🟢 Verde</option>
                <option value="red">🔴 Vermelho</option>
                <option value="pink">🌸 Rosa</option>
                <option value="teal">🔷 Ciano</option>
                <option value="orange">🟠 Laranja</option>
                <option value="zinc">⚙️ Cinza</option>
              </select>
              <button
                onClick={handleCreateAba}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg border-2 border-zinc-950 text-xs font-black uppercase"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowStatusCreatorDirect(false)}
                className="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-200 rounded-lg text-xs"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Grid containing Columns and Sidebar Drawer */}
          <div className="relative flex flex-col xl:flex-row gap-5 items-start">
            {/* Kanban Columns Grid Scroll Container */}
            <div className="flex-1 w-full relative group">
              <div className="absolute right-4 bottom-4 flex gap-2 z-20 md:hidden group-hover:flex">
                <button
                  onClick={() => {
                    const el = document.getElementById("kanban-columns-grid");
                    if (el) el.scrollBy({ left: -300, behavior: "smooth" });
                  }}
                  className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-950 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:bg-zinc-800 transition active:translate-y-1 active:shadow-none"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("kanban-columns-grid");
                    if (el) el.scrollBy({ left: 300, behavior: "smooth" });
                  }}
                  className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-950 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:bg-zinc-800 transition active:translate-y-1 active:shadow-none"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              {hyperfocusActive ? (
                hyperfocusActive === 1 ? (
                  /* LEVEL 1 HYPERFOCUS - 2 BLOCKS with 2 visibilities each */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto xl:h-[700px] overflow-hidden pb-4">
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest border-l-4 border-indigo-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Etapas & Perfil
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("etapas")}
                        {renderKanbanColumnsForPage("perfil")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest border-l-4 border-rose-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Qualificação & Objeções
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("qualificacao")}
                        {renderKanbanColumnsForPage("objecoes")}
                      </div>
                    </div>
                  </div>
                ) : hyperfocusActive === 2 ? (
                  /* LEVEL 2 HYPERFOCUS - 4 BLOCKS with 1 visibility each, all on the same visible line on desktop */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full h-auto xl:h-[700px] overflow-hidden pb-4">
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest border-l-4 border-indigo-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Etapas
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("etapas")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-emerald-500 tracking-widest border-l-4 border-emerald-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Perfil
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("perfil")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest border-l-4 border-rose-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Qualificação
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("qualificacao")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest border-l-4 border-amber-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Objeções
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("objecoes")}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LEVEL 3 HYPERFOCUS - 5 BLOCKS with 1 visibility each, all on the same visible line on desktop */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full h-auto xl:h-[700px] overflow-hidden pb-4">
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest border-l-4 border-blue-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Status
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("status")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest border-l-4 border-indigo-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Etapas
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("etapas")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-emerald-500 tracking-widest border-l-4 border-emerald-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Perfil
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("perfil")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest border-l-4 border-rose-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Qualificação
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("qualificacao")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                      <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest border-l-4 border-amber-500 pl-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">
                        Objeções
                      </h3>
                      <div className="flex-1 overflow-x-auto overflow-y-auto pb-1 flex flex-row gap-4 select-none transition-colors w-full custom-scrollbar min-h-0 items-start">
                        {renderKanbanColumnsForPage("objecoes")}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  {selectedLeadIds.length > 0 && (
                    <div className="bg-indigo-950/80 border-2 border-indigo-500/80 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-[11px] mb-1 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="font-bold text-zinc-100 uppercase">
                          {selectedLeadIds.length} leads selecionados no Funil
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Move Status */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleBulkMoveStatusKanban(e.target.value as LeadStatus);
                              e.target.value = '';
                            }
                          }}
                          className="bg-zinc-900 text-zinc-100 border border-zinc-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer focus:outline-none hover:border-indigo-500 transition-colors"
                        >
                          <option value="">-- Mover Status --</option>
                          {memoizedStatusColumns.map(col => (
                            <option key={col.id} value={col.id}>{col.label}</option>
                          ))}
                        </select>

                        {/* Move Stage */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleBulkMoveStageKanban(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-zinc-900 text-zinc-100 border border-zinc-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer focus:outline-none hover:border-indigo-500 transition-colors"
                        >
                          <option value="">-- Mover Etapa --</option>
                          {memoizedEtapasColumns.map(col => (
                            <option key={col.id} value={col.id}>{col.label}</option>
                          ))}
                        </select>

                        <button
                          onClick={handleBulkDeleteKanban}
                          className="px-2.5 py-1 bg-red-900/85 hover:bg-red-800 text-red-100 border border-red-700 rounded-md transition-colors font-bold cursor-pointer text-[10px] uppercase"
                        >
                          Excluir
                        </button>

                        <button
                          onClick={() => setSelectedLeadIds([])}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md transition-colors cursor-pointer text-[10px]"
                        >
                          Limpar ×
                        </button>
                      </div>
                    </div>
                  )}
                  <div
                    id="kanban-columns-grid"
                    style={{ zoom: `${layoutZoom}%` }}
                    className={`flex flex-row gap-4 items-start overflow-x-auto pb-4 custom-scrollbar select-none transition-colors ${
                      zoomMode === "overview"
                        ? "scale-[0.80] xl:scale-[0.74] origin-top-left w-[135%] h-[125%]"
                        : ""
                    }`}
                  >
                    {renderKanbanColumnsForPage(activeFunnelsPage as any)}
                  </div>
                </div>
              )}
            </div>
            {/* cicloCRED Sidebar Drawer: "Gerador & Organizador Premium de Status" */}
            {showAbaOrganizerState && (
              <div className="w-full xl:w-80 shrink-0 bg-white border-4 border-zinc-950 p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4  sticky top-4 z-10 self-start">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5">
                  <span className="text-xs font-black font-mono text-zinc-950 uppercase flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Ordem dos Blocos ({columns.length}/10)</span>
                  </span>
                  <button
                    onClick={() => setShowAbaOrganizerState(false)}
                    className="p-1 px-2.5 bg-zinc-950 text-white rounded-md text-xs font-bold hover:bg-zinc-800 transition"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-[10px] text-zinc-500 font-bold leading-tight">
                  Puxe ou empurre os blocos clicando nas setas organizadoras.
                  Qualquer modificação atualizará a esteira de CRM em tempo
                  real.
                </p>

                {/* List of current Abas with ordering triggers */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {columns.map((col, idx) => (
                    <div
                      key={col.id}
                      className="p-2.5 bg-zinc-50 border-2 border-zinc-950 rounded-xl flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono text-indigo-500 font-bold block">
                          Fase {idx + 1} de {columns.length}
                        </span>
                        <strong className="text-xs text-zinc-900 font-black tracking-tight truncate block uppercase">
                          {col.label}
                        </strong>
                      </div>

                      {/* Push / Pull Order controllers */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveAbaBackward(idx)}
                          className="p-1 bg-white border-2 border-zinc-950 rounded-lg hover:bg-indigo-50 text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed transition"
                          title="Empurrar para trás (Fase Anterior)"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === columns.length - 1}
                          onClick={() => handleMoveAbaForward(idx)}
                          className="p-1 bg-white border-2 border-zinc-950 rounded-lg hover:bg-indigo-50 text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed transition"
                          title="Empurrar para frente (Próxima Fase)"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#fcf8e3] border border-[#faebcc] text-[#8a6d3b] p-3 rounded-xl text-[10px] leading-relaxed font-semibold">
                  💡 Dica: O cicloCRED CRM foi otimizado para comportar de forma
                  premium até 10 blocos ativos simultaneamente.
                </div>
              </div>
            )}
          </div>

          {/* 🌌 PORTAL DE HIPERFOCO 3: AMBIENTE DE CONEXÃO DE NÓS (Renders stably below the row, independent bandwidth) */}
          {false && <div className="hidden"></div>}

          {/* CUSTOM MODAL FOR PAGE DELETION */}
          {funnelPageToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60   flex items-center justify-center p-4">
              <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-zinc-950 space-y-4 ">
                <div className="flex items-center gap-3 text-red-650">
                  <span className="text-3xl">⚠️</span>
                  <h3 className="text-md font-black uppercase font-mono tracking-tight leading-tight">
                    Confirmar Exclusão de Funil
                  </h3>
                </div>
                <p className="text-xs text-zinc-650 leading-relaxed font-bold">
                  Tem certeza que deseja excluir permanentemente o funil{" "}
                  <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded font-black italic">
                    "{funnelPageToDelete.name}"
                  </span>
                  ?
                </p>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Esta ação removerá a pasta do fluxo de trabalho e atribuirá
                  seus leads de volta ao funil Principal padrão.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setFunnelPageToDelete(null)}
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-450 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() =>
                      confirmDeleteFunnelPage(funnelPageToDelete.id)
                    }
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition"
                  >
                    Sim, Excluir permanentemente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOM MODAL FOR STATUS ABA DELETION WITH ASSOCIATED LEADS */}
          {abaToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60   flex items-center justify-center p-4">
              <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-zinc-950 space-y-4 ">
                <div className="flex items-center gap-3 text-amber-600">
                  <span className="text-3xl">⚠️</span>
                  <h3 className="text-md font-black uppercase font-mono tracking-tight leading-tight">
                    Bloco com Leads Associados
                  </h3>
                </div>
                <p className="text-xs text-zinc-650 leading-relaxed font-bold">
                  Atenção: O bloco{" "}
                  <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-black italic">
                    "{abaToDelete.label}"
                  </span>{" "}
                  possui leads de fomento ativos associados.
                </p>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                  Ao excluí-lo, o bloco será removido do funil Kanban e você
                  precisará realocar/mover os leads deste bloco. Deseja
                  prosseguir com a exclusão do bloco mesmo assim?
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setAbaToDelete(null)}
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-450 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => confirmDeleteAba(abaToDelete.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition"
                  >
                    Prosseguir e Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OVERLAY MODAL FOR CREATE PAGE DIRECT */}
          {showPageCreatorDirect && (
            <div className="fixed inset-0 z-[100] bg-black/60   flex items-center justify-center p-4 ">
              <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white space-y-4 font-mono">
                <div className="flex items-center gap-3 text-indigo-400">
                  <span className="text-2xl">➕</span>
                  <h3 className="text-sm font-black uppercase tracking-tight leading-tight">
                    Nova Página de Funil
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">
                  Crie uma nova visibilidade de fluxo de trabalho no CRM.
                </p>
                <input
                  type="text"
                  placeholder="Nome do Funil (ex: Funil de Consórcios)..."
                  value={newFunnelPageName}
                  onChange={(e) => setNewFunnelPageName(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 font-bold tracking-wide outline-none focus:border-indigo-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFunnelPage();
                      setShowPageCreatorDirect(false);
                      setTriggerCreatePage?.(false);
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
                  <button
                    onClick={() => {
                      setShowPageCreatorDirect(false);
                      setTriggerCreatePage?.(false);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-950 active:translate-y-0.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleCreateFunnelPage();
                      setShowPageCreatorDirect(false);
                      setTriggerCreatePage?.(false);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-950 shadow-[1.5px_1.5px_0px_0px_white] active:translate-y-0.5"
                  >
                    Criar Funil ➕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OVERLAY MODAL FOR EDIT PAGE DIRECT */}
          {editingPageId && (
            <div className="fixed inset-0 z-[100] bg-black/60   flex items-center justify-center p-4 ">
              <div className="bg-amber-50 border-4 border-zinc-950 p-6 rounded-3xl max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-amber-950 space-y-4 font-mono">
                <div className="flex items-center gap-3 text-amber-600">
                  <span className="text-2xl">✏️</span>
                  <h3 className="text-sm font-black uppercase tracking-tight leading-tight">
                    Editar Nome / Meta da Página
                  </h3>
                </div>
                <p className="text-[10px] text-amber-800 font-bold uppercase">
                  Renomeie o fluxo de trabalho{" "}
                  {funnelPages.find((p) => p.id === activeFunnelsPage)?.name}.
                </p>
                <input
                  type="text"
                  placeholder="Novo nome do Funil e valor estimado..."
                  value={editingPageName}
                  onChange={(e) => setEditingPageName(e.target.value)}
                  className="w-full bg-white border-2 border-zinc-950 rounded-xl p-2.5 text-xs text-zinc-900 placeholder-zinc-400 font-bold tracking-wide outline-none focus:border-amber-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSavePageRename(editingPageId);
                    } else if (e.key === "Escape") {
                      setEditingPageId(null);
                    }
                  }}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingPageId(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition text-[10px] font-black uppercase tracking-wider border border-zinc-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSavePageRename(editingPageId)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition text-[10px] font-black uppercase tracking-wider border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Atualizar Página
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OVERLAY MODAL FOR CREATE STATUS DIRECT */}
          {showStatusCreatorDirect && (
            <div className="fixed inset-0 z-[100] bg-black/60   flex items-center justify-center p-4 ">
              <div className="bg-zinc-900 border-4 border-zinc-950 p-6 rounded-3xl max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white space-y-4 font-mono">
                <div className="flex items-center gap-3 text-indigo-400">
                  <span className="text-2xl">➕</span>
                  <h3 className="text-sm font-black uppercase tracking-tight leading-tight">
                    Novo Bloco no Funil
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">
                  Insira um novo bloco no funil ativo.
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome do Bloco (ex: Visita Agendada)..."
                    value={newAbaName}
                    onChange={(e) => setNewAbaName(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 font-bold tracking-wide outline-none focus:border-indigo-500"
                    autoFocus
                  />

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 uppercase">
                      Cor do Bloco:
                    </span>
                    <select
                      value={newAbaColor}
                      onChange={(e) => setNewAbaColor(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-2 text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="blue">🔵 Azul</option>
                      <option value="amber">🟡 Amarelo</option>
                      <option value="indigo">🟣 Roxo</option>
                      <option value="emerald">🟢 Verde</option>
                      <option value="red">🔴 Vermelho</option>
                      <option value="pink">🌸 Rosa</option>
                      <option value="teal">🔷 Ciano</option>
                      <option value="orange">🟠 Laranja</option>
                      <option value="zinc">⚙️ Cinza</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
                  <button
                    onClick={() => {
                      setShowStatusCreatorDirect(false);
                      setTriggerCreateStatus?.(false);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-950 active:translate-y-0.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleCreateAba();
                      setShowStatusCreatorDirect(false);
                      setTriggerCreateStatus?.(false);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-950 shadow-[1.5px_1.5px_0px_0px_white] active:translate-y-0.5"
                  >
                    Criar Status ➕
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
