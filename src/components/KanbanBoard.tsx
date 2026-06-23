/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";

import { Lead, LeadStatus } from "../types";
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
  Sparkles
} from "lucide-react";
import {
  getKanbanColumns,
  saveKanbanColumns,
  KanbanColumn,
} from "../utils/kanban";

interface KanbanBoardProps {
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

export default function KanbanBoard({
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
}: KanbanBoardProps) {
  const [activeDragCol, setActiveDragCol] = useState<string | null>(null);

  // State for columns
  const [columns, setColumns] = useState<KanbanColumn[]>(() =>
    getKanbanColumns(),
  );

  // Hiperfoco 3 State Variables
  const [kanbanSearchText, setKanbanSearchText] = useState("");
  const [hiperfoco3Columns, setHiperfoco3Columns] = useState<Array<{ colId: string; pageId: string }>>([]);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [draggingColId, setDraggingColId] = useState<string | null>(null);

  // High performance visual translation tracking
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const dragStartNodeRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);

  const handleNodeMouseDown = (id: string, initialPos: { x: number; y: number }, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingNodeId(id);
    
    // Retrieve current position safely
    const currentPos = nodePositions[id] || initialPos;
    dragStartNodeRef.current = { x: currentPos.x, y: currentPos.y };
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleDropOnH3Canvas = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data && data.startsWith("col-header:")) {
      const parts = data.split(":");
      if (parts.length >= 3) {
        const colId = parts[1];
        const pageId = parts[2];
        if (!hiperfoco3Columns.some(item => item.colId === colId && item.pageId === pageId)) {
          setHiperfoco3Columns(prev => [...prev, { colId, pageId }]);
        }
      }
    }
  };

  // Layout helper for Hiperfoco 3 Nodes (Columns and Leads) to space them beautifully
  const getHiperfocoPos = (nodeId: string, isCol: boolean, columnIdx: number, itemIdxInCol?: number) => {
    if (nodePositions[nodeId]) {
      return nodePositions[nodeId];
    }
    // As colCount grows, we spread columns horizontally to prevent overlapping.
    const hInterval = 340 + (hiperfoco3Columns.length * 18);
    const vInterval = 90 + (leads.length * 0.1); // Expands as more leads exist
    
    if (isCol) {
      const x = 70 + columnIdx * hInterval;
      const y = 80;
      return { x, y };
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
          const filtered = parsed.filter(p => p.id !== "status");
          if (!filtered.some(p => p.id === "qualificacao")) {
            filtered.splice(1, 0, { id: "qualificacao", name: "Visibilidade: Qualificação" });
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
    if (kanbanViewMode && ["status", "etapas", "perfil", "qualificacao", "objecoes"].includes(kanbanViewMode)) {
      setActiveFunnelsPage(kanbanViewMode);
      localStorage.setItem("ciclocred_active_funnel_page_id", kanbanViewMode);
    }
  }, [kanbanViewMode]);

  useEffect(() => {
    setColumns(getKanbanColumns(activeFunnelsPage));
  }, [activeFunnelsPage]);

  useEffect(() => {
    const handleUpdate = () => {
      setColumns(getKanbanColumns(activeFunnelsPage));
    };
    window.addEventListener("kanban-columns-updated", handleUpdate);
    return () =>
      window.removeEventListener("kanban-columns-updated", handleUpdate);
  }, [activeFunnelsPage]);
  const handleCycleVisibility = () => {
    const sequence = ["status", "etapas", "perfil", "qualificacao", "objecoes"];
    const currentIndex = sequence.indexOf(activeFunnelsPage);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % sequence.length;
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
      setEditingPageName(funnelPages.find(p => p.id === activeFunnelsPage)?.name || "");
      if (setTriggerEditPage) setTriggerEditPage(false);
    }
  }, [triggerEditPage, activeFunnelsPage, funnelPages, setTriggerEditPage]);

  useEffect(() => {
    if (triggerDeletePage) {
      if (!["etapas", "perfil", "qualificacao", "objecoes"].includes(activeFunnelsPage)) {
        handleDeleteFunnelPage(activeFunnelsPage, funnelPages.find(p => p.id === activeFunnelsPage)?.name || "");
      } else {
         alert("Não é possível inativar/excluir este funil padrão.");
      }
      if (setTriggerDeletePage) setTriggerDeletePage(false);
    }
  }, [triggerDeletePage, activeFunnelsPage, funnelPages, setTriggerDeletePage]);

  useEffect(() => {
    if (triggerHyperfocus) {
      if (setHyperfocusActive) {
        const current = typeof hyperfocusActive === 'number' ? hyperfocusActive : (hyperfocusActive ? 1 : 0);
        let nextValue: number = 0;
        if (current === 0) {
          nextValue = 1;
        } else if (current === 1) {
          nextValue = 2;
        } else if (current === 2) {
          nextValue = 3;
          if (hiperfoco3Columns.length === 0) {
            const statusCols = getKanbanColumns("status");
            setHiperfoco3Columns(statusCols.map(col => ({ colId: col.id, pageId: "status" })));
          }
        } else {
          nextValue = 0;
          setHiperfoco3Columns([]);
        }
        setHyperfocusActive(nextValue);
      }
      if (setTriggerHyperfocus) setTriggerHyperfocus(false);
    }
  }, [triggerHyperfocus, setTriggerHyperfocus, setHyperfocusActive, hiperfoco3Columns]);

  // Create / Edit aba state
  const [newAbaName, setNewAbaName] = useState("");
  const [newAbaColor, setNewAbaColor] = useState("blue");
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColLabel, setEditingColLabel] = useState("");

  // Premium Zoom & Density parameters with single-click adaptive focus
  const [zoomState, setZoomState] = useState<
    "compact" | "normal" | "expanded" | "overview"
  >("normal");
  const zoomMode = hyperfocusActive === 1 ? "overview" : (hyperfocusActive === 2 ? "compact" : zoomState);
  const [showAbaOrganizer, setShowAbaOrganizer] = useState(false);
  const showAbaOrganizerState = showOrganizer !== undefined ? showOrganizer : showAbaOrganizer;
  const setShowAbaOrganizerState = setShowOrganizer !== undefined ? setShowOrganizer : setShowAbaOrganizer;

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
    
    if (pageId === 'etapas') {
       return lead.stage || 'abordagem';
    }
    if (pageId === 'perfil') {
       return lead.mainProfile || '';
    }
    if (pageId === 'qualificacao') {
       if (lead.restricacaoBacen === 'Sim' || lead.restricaoBacen === 'Sim') return 'nao_qualificado';
       if (lead.programaDesejado === 'Minha Casa Minha Vida') return 'qualificado_mcmv';
       if (lead.programaDesejado === 'SBPE') return 'qualificado_sbpe';
       return 'em_qualificacao';
    }
    if (pageId === 'objecoes') {
       return lead.objection || '';
    }
    return lead.status;
  }

  // Dynamic metrics of the H3 canvas to give more internal space when there are more items
  const h3ColCount = hiperfoco3Columns.length;
  const h3LeadsCount = useMemo(() => {
    return leads.filter(l =>
      hiperfoco3Columns.some(item => {
        const leadColId = getLeadStatusForPage(l, item.pageId);
        return leadColId === item.colId;
      })
    ).length;
  }, [leads, hiperfoco3Columns]);

  // Scaled level of hyperfocus goes up to 10
  const h3Level = h3ColCount > 0 ? Math.min(10, h3ColCount + 2) : 0;

  // Responsive zoom scale to provide a modular viewport inside the canvas
  const dynamicZoom = useMemo(() => {
    if (h3ColCount === 0) return 1.0;
    const calculated = 1.15 - (h3ColCount * 0.081) - (h3LeadsCount * 0.010);
    return Math.max(0.40, calculated);
  }, [h3ColCount, h3LeadsCount]);

  // High performance window dragging handler with dynamic scaling and frame rate synchronization
  useEffect(() => {
    if (!draggingNodeId) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      // Scale mouse movement delta strictly according to the zoom factor
      const dx = (e.clientX - dragStartMouseRef.current.x) / dynamicZoom;
      const dy = (e.clientY - dragStartMouseRef.current.y) / dynamicZoom;
      
      const newX = dragStartNodeRef.current.x + dx;
      const newY = dragStartNodeRef.current.y + dy;

      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        setNodePositions((prev) => ({
          ...prev,
          [draggingNodeId]: { x: newX, y: newY },
        }));
      });
    };

    const handleWindowMouseUp = () => {
      setDraggingNodeId(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [draggingNodeId, dynamicZoom]);

  // Filtered leads by selected Funnel Page
  const filteredPageLeads = leads.filter((l) => {
    if (["status", "etapas", "perfil", "qualificacao", "objecoes"].includes(activeFunnelsPage)) {
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
        (l.bairroEspecifico && l.bairroEspecifico.toLowerCase().includes(searchLow)) ||
        (l.origin && l.origin.toLowerCase().includes(searchLow)) ||
        (l.comoSoube && l.comoSoube.toLowerCase().includes(searchLow)) ||
        (l.programaDesejado && l.programaDesejado.toLowerCase().includes(searchLow)) ||
        (l.familyGrossIncome && String(l.familyGrossIncome).toLowerCase().includes(searchLow)) ||
        (l.familyIncome && String(l.familyIncome).toLowerCase().includes(searchLow))
      );
    });
  }, [filteredPageLeads, kanbanSearchText]);

  // O usuário pediu que hiperfoco apenas diminua o zoom para ver todos os status na tela
  const visibleColumns = columns;

  // Calculate sum of values for a column
  const getColumnTotal = (status: string) => {
    return filteredLeads
      .filter((l) => getLeadStatusForPage(l, activeFunnelsPage) === status)
      .reduce((sum, l) => sum + l.value, 0);
  };

  const goPreviousFunnelPage = () => {
    const currentIndex = funnelPages.findIndex(p => p.id === activeFunnelsPage);
    if (currentIndex > 0) {
       const newPage = funnelPages[currentIndex - 1].id;
       setActiveFunnelsPage(newPage);
       localStorage.setItem("ciclocred_active_funnel_page_id", newPage);
       if ((window as any).setKanbanViewMode) (window as any).setKanbanViewMode(newPage);
    } else {
       window.dispatchEvent(new CustomEvent('ciclocred_cycle_tab_prev'));
    }
  };

  const goNextFunnelPage = () => {
    const currentIndex = funnelPages.findIndex(p => p.id === activeFunnelsPage);
    if (currentIndex < funnelPages.length - 1) {
       const newPage = funnelPages[currentIndex + 1].id;
       setActiveFunnelsPage(newPage);
       localStorage.setItem("ciclocred_active_funnel_page_id", newPage);
       if ((window as any).setKanbanViewMode) (window as any).setKanbanViewMode(newPage);
    } else {
       window.dispatchEvent(new CustomEvent('ciclocred_cycle_tab_next'));
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

    window.addEventListener('ciclocred_global_prev_visibility', prevListener);
    window.addEventListener('ciclocred_global_next_visibility', nextListener);

    return () => {
      window.removeEventListener('ciclocred_global_prev_visibility', prevListener);
      window.removeEventListener('ciclocred_global_next_visibility', nextListener);
    };
  }, [activeFunnelsPage, funnelPages]);

  const renderKanbanColumnsForPage = (pageId: "status" | "etapas" | "perfil" | "qualificacao" | "objecoes") => {
    const pageCols = getKanbanColumns(pageId);
    
    if (pageCols.length === 0) {
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
      const isEditing = editingColId === col.id && (!hyperfocusActive || activeFunnelsPage === pageId);

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
          className={`bg-zinc-950/90 rounded-2xl border-[3px] border-zinc-800 shrink-0 select-none ${
            zoomMode === "compact" ? "min-h-[260px] h-full" : "min-h-[370px]"
          } flex flex-col transition-all duration-300 relative overflow-hidden group hover:border-indigo-500/50 ${
            zoomMode === "compact"
              ? "w-52"
              : zoomMode === "expanded"
                ? "w-full xl:w-52"
                : "w-full xl:w-48"
          } ${
            isOverThisCol
              ? "ring-2 ring-indigo-500 bg-indigo-950/20 translate-y-[-2px] shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              : "shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
          }`}
        >
          {/* Subtle top color bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 group-hover:h-1.5 transition-all" />
          
          {/* Column Header */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", `col-header:${col.id}:${pageId}`);
              e.dataTransfer.effectAllowed = "move";
              setIsDraggingColumn(true);
              setDraggingColId(col.id);
              if (setHyperfocusActive) {
                setHyperfocusActive(3);
              }
            }}
            onDragEnd={() => {
              setIsDraggingColumn(false);
              setDraggingColId(null);
            }}
            className={`cursor-grab active:cursor-grabbing flex flex-col gap-1 transition-all duration-300 ${
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
                    <h3
                      className={`font-sans font-black uppercase italic tracking-tight ${
                        zoomMode === "compact"
                          ? "text-[10px]"
                          : "text-xs"
                      } text-zinc-100 truncate mr-1`}
                    >
                      {col.label}
                    </h3>
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
                        if (hiperfoco3Columns.some(item => item.colId === col.id && item.pageId === pageId)) {
                          setHiperfoco3Columns(prev => prev.filter(item => !(item.colId === col.id && item.pageId === pageId)));
                        } else {
                          setHiperfoco3Columns(prev => {
                            if (prev.length >= 10) return prev;
                            return [...prev, { colId: col.id, pageId }];
                          });
                          if (setHyperfocusActive) {
                            setHyperfocusActive(3);
                          }
                        }
                      }}
                      className={`p-1 rounded text-xs transition flex items-center justify-center ${
                        hiperfoco3Columns.some(item => item.colId === col.id && item.pageId === pageId)
                          ? "bg-purple-950/40 text-purple-400 border border-purple-500/30"
                          : "text-zinc-400 hover:text-purple-450 hover:bg-purple-950/20"
                      }`}
                      title={hiperfoco3Columns.some(item => item.colId === col.id && item.pageId === pageId) ? "Retirar do Hiperfoco 3" : "Enviar ao Hiperfoco 3 🌌"}
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
                ? "max-h-[180px] p-1.5 space-y-1.5"
                : "max-h-[40vh] xl:max-h-[44vh] p-2.5 space-y-2.5"
            } transition-colors duration-200 scrollbar-thin ${
              isOverThisCol ? "bg-indigo-950/40" : "bg-zinc-950/50"
            }`}
            id={`kanban-column-${col.id}`}
          >
            {colLeads.length === 0 ? (
              <div className={`flex flex-col items-center justify-center ${zoomMode === "compact" ? "py-6" : "py-16"} text-center select-none text-zinc-400`}>
                <Building2 className={`${zoomMode === "compact" ? "w-6 h-6 mb-1" : "w-8 h-8 mb-2"} opacity-20`} />
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
                    className={`group bg-zinc-900 border-[2px] border-zinc-805/90 hover:border-indigo-500 rounded-xl transition-all relative overflow-hidden ${
                      zoomMode === "compact" || zoomMode === "overview"
                        ? "p-2 shadow-[2px_2px_0px_0px_rgba(15,15,15,1)]"
                        : zoomMode === "expanded"
                          ? "p-4 shadow-[4px_4px_0px_0px_rgba(15,15,15,1)]"
                          : "p-3 shadow-[3px_3px_0px_0px_rgba(15,15,15,1)]"
                    } hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-grab active:cursor-grabbing`}
                  >
                    <div className="flex flex-col gap-2 font-sans">
                      {/* Header NOME */}
                      <div className="border-b-[1.5px] border-zinc-805/85 pb-2 flex flex-col items-center">
                        <div className="flex items-center gap-1 w-full justify-between mb-0.5">
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5">
                              {lead.tags.slice(0, 1).map((tg: string) => (
                                <span key={tg} className="text-[7px] font-black uppercase bg-indigo-50 border border-indigo-150 text-indigo-700 rounded px-1 tracking-tight shrink-0 font-mono">
                                  🏷️ {tg}
                                </span>
                              ))}
                            </div>
                          )}
                          {isOverdue && (
                            <span className="flex items-center gap-0.5 text-[7px] bg-red-100 border border-red-650 text-red-950 rounded px-1 font-mono font-black select-none shrink-0" title={`Último contato foi há ${daysSinceContact} dias!`}>
                              <AlertTriangle className="w-2 h-2 text-red-650 shrink-0" />
                              {daysSinceContact}d
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onOpenLeadDetails(lead)}
                          className={`w-full text-zinc-100 hover:text-indigo-400 font-sans font-black text-center transition-colors truncate uppercase tracking-tight ${
                            zoomMode === 'compact' || zoomMode === 'overview' ? 'text-[9.5px]' : 'text-[10.5px]'
                          }`}
                        >
                          {lead.name}
                        </button>
                      </div>

                      {/* INFOS */}
                      <div className={`text-zinc-400 ${zoomMode === 'compact' || zoomMode === 'overview' ? 'text-[8.5px]' : 'text-[9px]'} border-b-[1.5px] border-zinc-805/85 pb-2`}>
                        <div className={`text-center font-black uppercase bg-zinc-950 border border-zinc-800/80 rounded mb-1 py-0.5 tracking-widest text-zinc-400 ${
                          zoomMode === 'compact' || zoomMode === 'overview' ? 'text-[7.5px]' : 'text-[8px]'
                        }`}>Infos</div>
                        <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 text-center font-semibold text-zinc-400 text-[8px] leading-tight font-mono bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-850/50">
                          <div className="truncate border-r border-zinc-800" title={lead.phone}>{lead.phone || '-'}</div>
                          <div className="truncate border-r border-zinc-800" title={lead.region}>{lead.region || '-'}</div>
                          <div className="truncate" title={lead.programaDesejado}>
                            {lead.programaDesejado === 'Minha Casa Minha Vida' ? 'MCMV' : lead.programaDesejado || '-'}
                          </div>
                          <div className="truncate border-r border-zinc-800" title={lead.gender}>{lead.gender || '-'}</div>
                          <div className="truncate border-r border-zinc-800" title={lead.ageBracket}>{lead.ageBracket || '-'}</div>
                          <div className="truncate" title={lead.sqmMatters}>{lead.sqmMatters === 'sim' ? 'Imp. m²' : (lead.sqmMatters === 'nao' ? 'M² indif.' : '-')}</div>
                        </div>
                      </div>

                      {/* CHECKLIST */}
                      <div className="border-b-[1.5px] border-zinc-805/85 pb-2">
                        <div className="text-center font-black uppercase text-[7.5px] bg-zinc-950 border border-zinc-800/80 rounded mb-1 py-0.5 tracking-widest text-zinc-400">Documentação Financeira</div>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <div className="flex-1 border border-indigo-500/50 bg-indigo-950/40 rounded px-1 flex flex-col items-center justify-center shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] py-0.5" title="Renda Familiar Líquida">
                            <span className="text-[7.5px] text-zinc-400 font-black uppercase tracking-tight leading-none block">Líquida</span>
                            <div className="flex items-center text-[10px] font-mono font-black text-indigo-400">
                              <span className="text-[8px] mr-0.5">R$</span>
                              <input 
                                type="number"
                                defaultValue={lead.familyIncome || 0}
                                onBlur={(e) => { 
                                  if (onUpdateLeadField && Number(e.target.value) !== lead.familyIncome) {
                                    onUpdateLeadField(lead.id, { familyIncome: Number(e.target.value) });
                                  }
                                }}
                                className="bg-transparent text-center focus:outline-none w-12"
                              />
                            </div>
                          </div>
                          <div className="flex-1 border border-emerald-500/50 bg-emerald-950/40 rounded px-1 flex flex-col items-center justify-center shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] py-0.5" title="Renda Familiar Bruta">
                            <span className="text-[7.5px] text-zinc-400 font-black uppercase tracking-tight leading-none block">Bruta</span>
                            <div className="flex items-center text-[10px] font-mono font-black text-emerald-400">
                              <span className="text-[8px] mr-0.5">R$</span>
                              <input 
                                type="number"
                                defaultValue={lead.familyGrossIncome || lead.familyIncome || 0}
                                onBlur={(e) => { 
                                  if (onUpdateLeadField && Number(e.target.value) !== lead.familyGrossIncome) {
                                    onUpdateLeadField(lead.id, { familyGrossIncome: Number(e.target.value) });
                                  }
                                }}
                                className="bg-transparent text-center focus:outline-none w-12"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BLOCOS */}
                      <div className="border-b-[1.5px] border-zinc-805/85 pb-2">
                        <div className="text-center font-black uppercase text-[7.5px] bg-zinc-950 border border-zinc-800/80 rounded mb-1 py-0.5 tracking-widest text-zinc-400">Blocos</div>
                        <div className="grid grid-cols-3 gap-1">
                            <select
                              title="Etapa"
                              value={lead.stage || ""}
                              onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { stage: e.target.value })}
                              className="text-[6.5px] font-black uppercase font-mono border border-zinc-700 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm px-0.5 py-0.5"
                            >
                              <option value="">ETAPA</option>
                              {getKanbanColumns("etapas").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <select
                              title="Perfil"
                              value={lead.mainProfile || ""}
                              onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { mainProfile: e.target.value as any })}
                              className="text-[6.5px] font-black uppercase font-mono border border-zinc-700 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm px-0.5 py-0.5"
                            >
                              <option value="">PERFIL</option>
                              {getKanbanColumns("perfil").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <select
                              title="Objeção"
                              value={lead.objection || ""}
                              onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { objection: e.target.value })}
                              className="text-[6.5px] font-black uppercase font-mono border border-zinc-700 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm px-0.5 py-0.5"
                            >
                              <option value="">OBJEÇÃO</option>
                              {getKanbanColumns("objecoes").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                      </div>

                      {/* AÇÕES */}
                      <div>
                        <div className="text-center font-black uppercase text-[7.5px] bg-zinc-950 border border-zinc-800/80 rounded mb-1 py-0.5 tracking-widest text-zinc-400">Ações</div>
                        <div className="grid grid-cols-4 gap-[2px]">
                          <button onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)} title="WhatsApp" className="p-1 bg-zinc-800 hover:bg-emerald-950/40 border border-zinc-700 hover:border-emerald-500/50 text-emerald-500 rounded flex items-center justify-center transition">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => window.open(`tel:${lead.phone.replace(/\D/g, '')}`)} title="Ligar" className="p-1 bg-zinc-800 hover:bg-blue-950/40 border border-zinc-700 hover:border-blue-500/50 text-blue-500 rounded flex items-center justify-center transition">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onNavigateToFollowUp ? onNavigateToFollowUp(lead) : onOpenEditModal(lead)} title="Follow-Up" className="p-1 bg-zinc-800 hover:bg-amber-950/40 border border-zinc-700 hover:border-amber-500/50 text-amber-500 rounded flex items-center justify-center transition">
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onOpenRuleEngine && onOpenRuleEngine(lead)} title="Ações Automáticas" className="p-1 bg-zinc-800 hover:bg-indigo-950/40 border border-zinc-700 hover:border-indigo-500/50 text-indigo-500 rounded flex items-center justify-center transition">
                            <Bot className="w-3.5 h-3.5" />
                          </button>
                          
                          <button onClick={() => onOpenLeadDetails(lead)} title="Ficha" className="p-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white rounded flex items-center justify-center transition">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onMoveLead(lead.id, 'prospect', 'etapas')} title="Funil" className="p-1 bg-zinc-800 hover:bg-sky-950/40 border border-zinc-700 hover:border-sky-500/50 text-sky-500 rounded flex items-center justify-center transition">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Certeza que deseja excluir este lead?")) {
                                onDeleteLead && onDeleteLead(lead.id);
                              }
                            }} title="Excluir" className="p-1 bg-zinc-800 hover:bg-rose-950/40 border border-zinc-700 hover:border-rose-500/50 text-rose-500 rounded flex items-center justify-center transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onOpenAIAssistant && onOpenAIAssistant(lead)} title="Assistente AI" className="p-1 bg-zinc-800 hover:bg-fuchsia-950/40 border border-zinc-700 hover:border-fuchsia-500/50 text-fuchsia-500 rounded flex items-center justify-center transition">
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
    <div className="space-y-6 relative">
      
      {/* Table search bar block injected from App.tsx */}
      {tableHeaderComponent && (
        <div className="w-full">
          {typeof tableHeaderComponent === 'function' ? tableHeaderComponent([], {}) : tableHeaderComponent}
        </div>
      )}

      {/* Dynamic Clickable Section Tabs from funnelPages */}
      <div className="flex flex-wrap gap-2.5 items-center justify-start w-full mb-2 px-1 select-none">
        {funnelPages.map((page) => {
          const isActive = activeFunnelsPage === page.id;
          // Determine clean name and icon based on id
          let icon = "📁";
          let displayName = page.name.replace("Visibilidade: ", "");
          if (page.id === "status") {
            icon = "📊";
            displayName = "Status";
          } else if (page.id === "etapas") {
            icon = "🚀";
            displayName = "Etapas";
          } else if (page.id === "perfil") {
            icon = "👤";
            displayName = "Perfil";
          } else if (page.id === "qualificacao") {
            icon = "🎯";
            displayName = "Qualificação";
          } else if (page.id === "objecoes") {
            icon = "🛑";
            displayName = "Objeções";
          }
          
          return (
            <button
              key={page.id}
              onClick={() => {
                setActiveFunnelsPage(page.id);
                localStorage.setItem("ciclocred_active_funnel_page_id", page.id);
                if ((window as any).setKanbanViewMode) (window as any).setKanbanViewMode(page.id);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 hover:bg-zinc-800/40 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider relative ${
                isActive
                  ? "bg-indigo-600 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]"
                  : "bg-zinc-900/40 text-zinc-400 border-zinc-800/80"
              }`}
            >
              <span className="text-sm">{icon}</span>
              <span>{displayName}</span>
            </button>
          );
        })}
      </div>
      {/* Transparent Unified Search Bar with Side Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/30 backdrop-blur-md border-[2px] border-zinc-800 p-3 rounded-2xl shadow-lg w-full mb-3">
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
              setEditingPageName(funnelPages.find(p => p.id === activeFunnelsPage)?.name || "");
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
            className="w-full pl-10 pr-4 py-2 border-2 border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40 text-white placeholder-zinc-500 font-bold font-mono text-xs rounded-xl focus:border-indigo-500/60 focus:ring-0 outline-none transition-all"
          />
        </div>

        {/* LADO DIREITO: 🔍🔄➕ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (setHyperfocusActive) {
                const current = typeof hyperfocusActive === 'number' ? hyperfocusActive : (hyperfocusActive ? 1 : 0);
                let nextValue = 0;
                if (current === 0) {
                  nextValue = 1;
                } else if (current === 1) {
                  nextValue = 2;
                } else if (current === 2) {
                  nextValue = 3;
                  if (hiperfoco3Columns.length === 0) {
                    const statusCols = getKanbanColumns("status");
                    setHiperfoco3Columns(statusCols.map(col => ({ colId: col.id, pageId: "status" })));
                  }
                } else {
                  nextValue = 0;
                  setHiperfoco3Columns([]);
                }
                setHyperfocusActive(nextValue);
              }
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition shrink-0 text-lg shadow-sm ${
              hyperfocusActive === 3
                ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                : hyperfocusActive === 1 || hyperfocusActive === 2
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-zinc-800/40 border-zinc-700/50 text-indigo-400 hover:bg-zinc-700/40"
            }`}
            title={hyperfocusActive === 3 ? "Sair do Hiperfoco" : `Ativar Hiperfoco (Nível Atual: ${hyperfocusActive || 0})`}
          >
            🔍
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
            onClick={() => setShowStatusCreatorDirect(!showStatusCreatorDirect)}
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
        <div className="flex-1 w-full overflow-hidden relative group">
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
            hyperfocusActive === 2 ? (
              /* LEVEL 2 HYPERFOCUS - 2x2 GRID (Two on upper half, two on lower half, making all 4 visible at once) */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pr-4 w-full h-auto xl:h-[740px] overflow-hidden shrink-0 transition-all duration-300 pb-4">
                <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                  <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest border-l-4 border-indigo-500 pl-3 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">Etapas</h3>
                  <div className="flex-1 overflow-x-auto overflow-y-hidden pb-1 flex flex-row gap-4 select-none transition-all w-full duration-300 custom-scrollbar min-h-0 items-start">
                    {renderKanbanColumnsForPage("etapas")}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                  <h3 className="text-xs font-black uppercase text-emerald-500 tracking-widest border-l-4 border-emerald-500 pl-3 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">Perfil</h3>
                  <div className="flex-1 overflow-x-auto overflow-y-hidden pb-1 flex flex-row gap-4 select-none transition-all w-full duration-300 custom-scrollbar min-h-0 items-start">
                    {renderKanbanColumnsForPage("perfil")}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                  <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest border-l-4 border-rose-500 pl-3 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">Qualificação</h3>
                  <div className="flex-1 overflow-x-auto overflow-y-hidden pb-1 flex flex-row gap-4 select-none transition-all w-full duration-300 custom-scrollbar min-h-0 items-start">
                    {renderKanbanColumnsForPage("qualificacao")}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-0 w-full h-[350px] xl:h-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 p-3 rounded-xl bg-zinc-50/40 dark:bg-zinc-950/20 shadow-inner">
                  <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest border-l-4 border-amber-500 pl-3 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-3 rounded-r-lg max-w-max shadow-sm mb-2 select-none">Objeções</h3>
                  <div className="flex-1 overflow-x-auto overflow-y-hidden pb-1 flex flex-row gap-4 select-none transition-all w-full duration-300 custom-scrollbar min-h-0 items-start">
                    {renderKanbanColumnsForPage("objecoes")}
                  </div>
                </div>
              </div>
            ) : (
              /* LEVEL 1 HYPERFOCUS - TWO-ROW SPLIT GRID (Upper pair and lower pair) */
              <div className="flex flex-col gap-6 pr-4 pb-12 w-full overflow-x-hidden transition-all duration-300 h-auto">
                 <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 min-h-0 shrink-0">
                    <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
                      <h3 className="text-xl font-black uppercase text-indigo-500 tracking-widest border-l-4 border-indigo-500 pl-4 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-4 rounded-r-xl max-w-max shadow-sm mb-4 select-none">Etapas</h3>
                      <div className="flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-all w-full duration-300">
                        {renderKanbanColumnsForPage("etapas")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
                      <h3 className="text-xl font-black uppercase text-emerald-500 tracking-widest border-l-4 border-emerald-500 pl-4 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-4 rounded-r-xl max-w-max shadow-sm mb-4 select-none">Perfil</h3>
                      <div className="flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-all w-full duration-300">
                        {renderKanbanColumnsForPage("perfil")}
                      </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 min-h-0 shrink-0 mt-8 border-t-4 border-dashed border-zinc-200 pt-8">
                    <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
                      <h3 className="text-xl font-black uppercase text-rose-500 tracking-widest border-l-4 border-rose-500 pl-4 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-4 rounded-r-xl max-w-max shadow-sm mb-4 select-none">Qualificação</h3>
                      <div className="flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-all w-full duration-300">
                        {renderKanbanColumnsForPage("qualificacao")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
                      <h3 className="text-xl font-black uppercase text-amber-500 tracking-widest border-l-4 border-amber-500 pl-4 bg-zinc-50 border-y border-r border-zinc-200 py-1 pr-4 rounded-r-xl max-w-max shadow-sm mb-4 select-none">Objeções</h3>
                      <div className="flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-all w-full duration-300">
                        {renderKanbanColumnsForPage("objecoes")}
                      </div>
                    </div>
                 </div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4 w-full">
              <div
                id="kanban-columns-grid"
                className={`grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-all duration-300 ${
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
              Qualquer modificação atualizará a esteira de CRM em tempo real.
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
      {(isDraggingColumn || hiperfoco3Columns.length > 0 || hyperfocusActive === 3) && (
        <div className="mt-8 bg-zinc-950/20 rounded-3xl p-0 w-full relative transition-all duration-300">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const rawData = e.dataTransfer.getData("text/plain");
              if (rawData && rawData.startsWith("col-header:")) {
                const parts = rawData.split(":");
                const colId = parts[1];
                const pageId = parts[2];
                if (colId && pageId) {
                  if (setHyperfocusActive) {
                    setHyperfocusActive(3);
                  }
                  if (!hiperfoco3Columns.some(item => item.colId === colId && item.pageId === pageId)) {
                    setHiperfoco3Columns(prev => {
                      if (prev.length >= 10) return prev; // Limit to level 10 of true CRM hyperfocus
                      return [...prev, { colId, pageId }];
                    });
                  }
                }
              }
            }}
            id="h3-canvas-area"
            className="w-full h-[650px] bg-zinc-950/30 rounded-3xl relative overflow-hidden p-6 shadow-2xl border-0"
          >
            {/* Grid overlay background */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* FLOATING ACTION HUD CONTROLLER */}
            <div className="absolute top-4 right-4 z-40 bg-zinc-950/85 backdrop-blur-md rounded-2xl p-4 border border-purple-500/15 shadow-2xl w-64 select-none flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-[10px] font-mono font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Hiperfoco {h3Level}/10</span>
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-black">ACTIVE</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 uppercase">
                  <span>Colunas:</span>
                  <span className="text-white font-bold">{h3ColCount}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 uppercase">
                  <span>Leads:</span>
                  <span className="text-white font-bold">{h3LeadsCount}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 uppercase">
                  <span>Escala Zoom:</span>
                  <span className="text-white font-mono font-bold">{(dynamicZoom * 100).toFixed(0)}%</span>
                </div>
              </div>
              {hiperfoco3Columns.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-zinc-800/80 pt-2.5">
                  <p className="text-[8px] tracking-widest text-zinc-500 uppercase font-black mb-1">Canais Conectados</p>
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {hiperfoco3Columns.map((item, idx) => {
                      const colObj = getKanbanColumns(item.pageId).find(c => c.id === item.colId);
                      return (
                        <div key={idx} className="flex items-center justify-between gap-2 p-1.5 py-1 bg-zinc-900/60 rounded-xl border border-zinc-800/40 text-[10px]">
                          <span className="text-zinc-300 font-bold max-w-[150px] truncate uppercase">
                            {colObj?.label || item.colId}
                          </span>
                          <button
                            onClick={() => {
                              setHiperfoco3Columns(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="w-5 h-5 rounded-md bg-zinc-900 hover:bg-red-500/15 border border-zinc-800 hover:border-red-500/20 text-rose-400 hover:text-white transition flex items-center justify-center text-[8px] font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Inner responsive scaled canvas region */}
            <div 
              className="w-full h-full relative origin-top-left transition-transform duration-300"
              style={{ 
                transform: `scale(${dynamicZoom})`, 
                width: `${100 / dynamicZoom}%`, 
                height: `${100 / dynamicZoom}%` 
              }}
            >
              {hiperfoco3Columns.length === 0 ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 select-none pointer-events-none">
                  <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse">🌌</span>
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mt-4">
                    Ambiente de Hiperfoco 10
                  </h3>
                  <p className="text-[10px] text-zinc-650 uppercase font-mono mt-2 leading-relaxed max-w-md">
                    Arraste cabeçalhos de colunas do CRM para soltar dentro deste espaço infinito paralelo! Cada coluna aumenta seu nível de foco real (Até Nível 10).
                  </p>
                </div>
              ) : (
                <>

            {/* Connection Cables layer */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
              <defs>
                <linearGradient id="cable-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                </linearGradient>
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {hiperfoco3Columns.map((item, colIdx) => {
                const colNodeId = `col-${item.colId}-${item.pageId}`;
                const colPos = getHiperfocoPos(colNodeId, true, colIdx);
                const colLeads = leads.filter(l => getLeadStatusForPage(l, item.pageId) === item.colId);
                
                return colLeads.map((lead, leadIdx) => {
                  const leadNodeId = `lead-${lead.id}-${item.pageId}`;
                  const leadPos = getHiperfocoPos(leadNodeId, false, colIdx, leadIdx);
                  
                  // Anchor coordinates
                  const startX = colPos.x + 88; // Card center
                  const startY = colPos.y + 40;
                  const endX = leadPos.x + 96;
                  const endY = leadPos.y + 35;
                  
                  const midY = (startY + endY) / 2;
                  
                  return (
                    <g key={`cable-${colNodeId}-${lead.id}`}>
                      {/* Outer glowing path */}
                      <path
                        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="4"
                        strokeOpacity="0.25"
                        filter="url(#neon-glow)"
                      />
                      {/* Inner path */}
                      <path
                        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="url(#cable-grad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="4 2"
                        className="animate-[dash_10s_linear_infinite]"
                      />
                    </g>
                  );
                });
              })}
            </svg>

            {/* The Column header blocks */}
            {hiperfoco3Columns.map((item, colIdx) => {
              const colNodeId = `col-${item.colId}-${item.pageId}`;
              const pos = getHiperfocoPos(colNodeId, true, colIdx);
              const colObj = getKanbanColumns(item.pageId).find(c => c.id === item.colId);
              if (!colObj) return null;

              return (
                <div
                  key={colNodeId}
                  style={{ left: pos.x, top: pos.y }}
                  onMouseDown={(e) => handleNodeMouseDown(colNodeId, pos, e)}
                  className="absolute z-10 w-44 bg-zinc-900 border-2 border-purple-500 rounded-xl p-3 shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-move select-none transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.55)] border-t-[5px]"
                >
                  <p className="text-[8px] font-mono font-black uppercase text-purple-400 tracking-wider">
                    {item.pageId} • col-nó
                  </p>
                  <div className="flex items-center justify-between gap-1.5 mt-1">
                    <h4 className="text-xs font-black uppercase tracking-tight text-white truncate max-w-[100px]">
                      {colObj.label}
                    </h4>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHiperfoco3Columns(prev => prev.filter(i => !(i.colId === item.colId && i.pageId === item.pageId)));
                      }}
                      className="p-1 px-1.5 text-[9px] font-black rounded bg-purple-950 text-purple-400 hover:text-white hover:bg-purple-900 transition"
                      title="Recolher e desativar Hiperfoco 3"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 text-[9px] text-zinc-400 uppercase font-mono">
                    LEADS CONECTADOS: {leads.filter(l => getLeadStatusForPage(l, item.pageId) === item.colId).length}
                  </div>
                </div>
              );
            })}

            {/* The disconnected Leads node cloud */}
            {hiperfoco3Columns.map((item, colIdx) => {
              const colLeads = leads.filter(l => getLeadStatusForPage(l, item.pageId) === item.colId);
              
              return colLeads.map((lead, leadIdx) => {
                const leadNodeId = `lead-${lead.id}-${item.pageId}`;
                const pos = getHiperfocoPos(leadNodeId, false, colIdx, leadIdx);
                
                return (
                  <div
                    key={leadNodeId}
                    style={{ left: pos.x, top: pos.y }}
                    onMouseDown={(e) => handleNodeMouseDown(leadNodeId, pos, e)}
                    onClick={() => {
                      onOpenLeadDetails(lead);
                    }}
                    className="absolute z-10 w-48 bg-zinc-950/95 border-2 border-zinc-800 hover:border-indigo-500/80 rounded-xl p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] cursor-pointer select-none transition-all duration-200 group/node hover:scale-105"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="text-[8px] font-mono font-black uppercase text-indigo-400 leading-tight">
                          {lead.origin || "Lead"}
                        </p>
                        <h5 className="text-[11px] font-black uppercase text-white tracking-widest leading-none mt-1 group-hover/node:text-indigo-300 transition-colors">
                          {lead.name}
                        </h5>
                      </div>
                      <span className="text-[8px] px-1 py-0.5 bg-zinc-900 text-purple-400 font-mono font-black uppercase rounded leading-none border border-zinc-800">
                        nó-lead
                      </span>
                    </div>

                    <div className="mt-2 space-y-0.5 text-[8px] font-mono uppercase text-zinc-500 border-t border-zinc-900 pt-1.5 leading-tight">
                      {lead.value ? (
                        <div className="flex justify-between">
                          <span>VALOR:</span>
                          <span className="text-emerald-450 font-black">
                            R$ {lead.value.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ) : null}
                      {getLeadStatusForPage(lead, item.pageId) ? (
                        <div className="flex justify-between">
                          <span>FASE:</span>
                          <span className="text-zinc-300 font-black">
                            {getLeadStatusForPage(lead, item.pageId)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              });
            })}
                </>
              )}
            </div>
          </div>
        </div>
      )}



      {/* CUSTOM MODAL FOR PAGE DELETION */}
      {funnelPageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xs flex items-center justify-center p-4">
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
              Esta ação removerá a pasta do fluxo de trabalho e atribuirá seus
              leads de volta ao funil Principal padrão.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFunnelPageToDelete(null)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-450 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDeleteFunnelPage(funnelPageToDelete.id)}
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
        <div className="fixed inset-0 z-50 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xs flex items-center justify-center p-4">
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
              Ao excluí-lo, o bloco será removido do funil Kanban e você precisará
              realocar/mover os leads deste bloco. Deseja prosseguir com a
              exclusão do bloco mesmo assim?
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
        <div className="fixed inset-0 z-[100] bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xs flex items-center justify-center p-4 ">
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
        <div className="fixed inset-0 z-[100] bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xs flex items-center justify-center p-4 ">
          <div className="bg-amber-50 border-4 border-zinc-950 p-6 rounded-3xl max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-amber-950 space-y-4 font-mono">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="text-2xl">✏️</span>
              <h3 className="text-sm font-black uppercase tracking-tight leading-tight">
                Editar Nome / Meta da Página
              </h3>
            </div>
            <p className="text-[10px] text-amber-800 font-bold uppercase">
              Renomeie o fluxo de trabalho {funnelPages.find(p => p.id === activeFunnelsPage)?.name}.
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
        <div className="fixed inset-0 z-[100] bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xs flex items-center justify-center p-4 ">
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
    </div>
  );
}
