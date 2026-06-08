/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LeadStatus = 'novo' | 'em_contato' | 'proposta' | 'fechado' | 'perdido';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  value: number;
  status: LeadStatus;
  notes: string;
  origin: string;
  createdAt: string;
  lastContactAt?: string;
  familyIncome?: number;
  ai_muted?: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggerEvent?: string; // e.g., 'Automatic' or manual
}

export interface EmailLog {
  id: string;
  leadId: string;
  leadName: string;
  templateName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'enviado' | 'falhou';
}

export interface DashboardMetrics {
  totalLeads: number;
  totalPipelineValue: number;
  closedLeadsCount: number;
  conversionRate: number;
}

export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  type: 'reuniao' | 'telefone' | 'proposta' | 'outro';
  reminderMinutes?: number; // e.g. 15, 60, 1440
  reminderSent?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  status: 'disponivel' | 'baixo_estoque' | 'indisponivel' | 'esgotado';
  notes?: string;
}

export interface RealEstateProperty {
  id: string;
  code: string;
  title: string;
  type: 'apartamento' | 'casa' | 'lote' | 'comercial';
  price: number;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parkingSpaces: number;
  sizeSqm: number;
  location: string;
  neighborhood: string;
  status: 'disponivel' | 'reservado' | 'vendido';
  description: string;
  imageUrl?: string;
  images?: string[];
}

export interface Goal {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  frequency: 'diaria' | 'semanal' | 'mensal';
  category: 'venda' | 'prospecção' | 'visita' | 'email';
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'em_planejamento' | 'ativo' | 'concluido';
  progress: number;
  xpReward: number;
  assignedToGoalId?: string;
}

export interface CRMNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alarm' | 'ai';
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  appointmentId?: string;
}

export interface FollowUpUpdate {
  id: string;
  leadId: string;
  leadName: string;
  date: string;
  time: string;
  type: 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'proposta';
  notes: string;
  nextStepTitle?: string;
  nextStepDate?: string;
  nextStepTime?: string;
  userEmail?: string;
}



