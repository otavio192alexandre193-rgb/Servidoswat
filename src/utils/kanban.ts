/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom dynamic "Abas" (columns) manager utility for SWAT CRM

export interface KanbanColumn {
  id: string;
  label: string;
  bgClass: string;
  labelClass: string;
  accentBorderClass: string;
}

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'novo', label: 'Novos Leads', bgClass: 'bg-blue-100/90', labelClass: 'text-blue-950', accentBorderClass: 'border-blue-500' },
  { id: 'em_contato', label: 'Em Contato', bgClass: 'bg-amber-100/90', labelClass: 'text-amber-950', accentBorderClass: 'border-yellow-500' },
  { id: 'proposta', label: 'Proposta', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'fechado', label: 'Fechados', bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
  { id: 'perdido', label: 'Perdidos', bgClass: 'bg-red-100/90', labelClass: 'text-red-950', accentBorderClass: 'border-rose-500' },
];

export function getKanbanColumns(): KanbanColumn[] {
  const saved = localStorage.getItem('swat_kanban_columns_v1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing kanban columns from localStorage', e);
    }
  }
  return DEFAULT_COLUMNS;
}

export function saveKanbanColumns(columns: KanbanColumn[]): void {
  localStorage.setItem('swat_kanban_columns_v1', JSON.stringify(columns));
}
