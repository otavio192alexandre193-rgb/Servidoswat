/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LeadStatus = string;

export interface FlowStageTimer {
  days: number;
  hours: number;
  minutes: number;
}

export interface FlowStage {
  id: string;
  name: string;
  timer: FlowStageTimer;
  mappedStageId?: string; // ID da etapa do fluxo geral que esta etapa se conecta
}

export interface StatusTimer {
  hours: number;
  minutes: number;
}

export interface OperationalFlow {
  id: string;
  name: string;
  description?: string;
  stages?: FlowStage[];
  statusTimers?: {
    recentes?: StatusTimer;
    ativos?: StatusTimer;
  };
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  value: number;
  status: LeadStatus;
  pipeline?: string; // legacy support
  fluxoId?: string; // Operational flow id
  stage?: string; // Etapa atual (para funil Ativos)
  osStageId?: string; // Etapa atual específica no fluxo da Ordem de Serviço (OS)
  generalStageId?: string; // Etapa correspondente do fluxo geral/original do sistema
  objection?: string; // Objeção (para funil Carteira)
  notes: string;
  origin: string;
  qualificacao?: string;
  createdAt: string;
  lastContactAt?: string;
  lastInteractionAt?: string;
  familyIncome?: number;
  familyGrossIncome?: number;
  ai_muted?: boolean;
  propertyInterest?: string;
  tags?: string[];
  funnelPageId?: string;
  lostReason?: string;
  region?: string; // Zona de interesse
  sqmMatters?: 'sim' | 'nao'; // Metragem importa?
  incomeType?: 'fixa' | 'variavel';
  deadlineMatters?: 'sim' | 'nao';
  deliveryExpected?: 'sim' | 'nao';
  objections?: string[];
  gender?: 'Homem' | 'Mulher' | 'Outro' | 'Prefiro nao informar';
  ageBracket?: 'Jovem' | 'Meia idade' | 'Idoso';
  profiles?: string[];
  funnelPlacements?: { pageId: string; status: string }[];
  
  // Custom user suggested columns & spreadsheet requirements
  mainProfile?: string;
  unitTypeMatters?: 'sim' | 'nao'; // Tipo de unidade importa?
  deliveryMatters?: 'sim' | 'nao'; // Tempo de entrega importa?
  firstImpression?: string; // Primeira impressão / Observação

  // Ficha Cadastral Fields - Pessoal e Qualificação
  cpfOrRg?: string;
  age?: number | string;
  dependents?: number | string;
  program?: string;
  mcmvDiscount?: number;
  downPaymentAvailable?: number;
  ownsProperty?: 'sim' | 'nao';
  approvedStatus?: string;
  address?: string;
  profession?: string;
  restrictions?: string;

  // Parâmetros e Preferência
  desiredSqm?: number | string;
  bedrooms?: number | string;
  suites?: number | string;
  balcony?: 'sim' | 'nao';
  parkingSpots?: number | string;
  nearestStation?: string;
  unitTypology?: string;
  nextSteps?: string;

  // Financeiro e Arquivamento
  propertyValue?: number;
  financedValue?: number;
  installmentValue?: number;
  downPaymentValue?: number;
  facilitatedInstallment?: number;
  valorAto?: number;
  valorAnual?: number;
  valorChaves?: number;
  tempoObra?: number;

  // Documentos
  documentsChecklist?: {
    photoId?: boolean;
    dependentCert?: boolean;
    marriageCert?: boolean;
    incomeProof?: boolean;
    addressProof?: boolean;
    irRegistry?: boolean;
    interactionReport?: boolean;
    registrationForm?: boolean;
    imagesBook?: boolean;
    salesTable?: boolean;
    assessment?: boolean;
    simulation?: boolean;
    proposal?: boolean;
  };

  // HIGH FIDELITY SPREADSHEET FORMULAE ATTRIBUTES
  cpf?: string;
  birthDate?: string;
  maritalStatus?: 'Solteiro' | 'Casado' | 'Uniao estavel' | 'Divorciado' | 'Viuvo';
  bairroEspecifico?: string;
  cep?: string;
  fgtsSaldo?: number;
  restricaoBacen?: 'Sim' | 'Não';
  possuiImovel?: 'Sim' | 'Não' | 'Em nome de terceiros';
  programaDesejado?: 'Minha Casa Minha Vida' | 'SBPE' | 'Indiferente';
  preferenciasUnidade?: string[]; // 1 dorm, 2 dorm, suite, varanda, vaga, etc.
  comoSoube?: 'Instagram' | 'Facebook' | 'Google' | 'Indicacao' | 'Corretor' | 'Feira' | 'Outros';
  score?: number; // Real-time composition formula score
  lostDate?: string;
  lostCompetitor?: string;
  lostPotentialValue?: number;
  recyclingStatus?: 'Arquivado' | 'Resgatado';

  // Active follow-up calculations
  suggestedUnit?: string;
  suggestedValue?: number;
  lastAction?: string;
  nextAction?: string;
  nextFollowUpDate?: string;

  // Independent Card Checklist
  checklist?: Record<string, boolean>;
  
  // Intelligent Engine Fields
  priority?: 'Crítico' | 'Muito Alto' | 'Alto' | 'Médio' | 'Baixo';
  compatibilityScore?: number; // 0-100
  compatibilityReasoning?: string;
  nextBestAction?: string;
  conversionProbability?: number; // 0-1
  deliveryTimePreference?: 'Pronto' | 'Curto' | 'Médio' | 'Longo' | 'Lançamento';
  objective?: 'Moradia' | 'Investimento';
  maxCommuteTime?: number;
  familyProfile?: 'Solteiro' | 'Casal' | 'Casal com Filhos' | 'Sênior';
}

export interface RealEstateDeveloper {
  id: string;
  name: string;
  rating?: number;
}

export interface NeighborhoodStats {
  id: string;
  name: string;
  region: string;
  avgPriceSqm: number;
  priceTrend: 'subindo' | 'estavel' | 'descendo';
  avgDaysToSell: number;
  predominantProfile?: string;
}

export interface RealEstateMemory {
  developers: RealEstateDeveloper[];
  neighborhoods: NeighborhoodStats[];
  marketInsights: {
    lastUpdate: string;
    generalTrend: string;
  };
}

export interface BackgroundConfig {
  images: string[]; // List of URLs or Base64
  interval: number; // ms
}

export type AppBackgrounds = Record<string, BackgroundConfig>;

export interface OperationalOS {
  id: string;
  title: string;
  subtitle?: string;
  date: string; // startDate
  endDate?: string;
  fluxoId: string;
  stageId?: string; // Etapa do fluxo que a OS ativa
  stageIds?: string[]; // Multiplas etapas ativadas pela OS
  leadIds: string[];
  type: 'import' | 'operacional' | 'personalizado';
  status: 'pendente' | 'em_execucao' | 'concluido';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  actions?: string[];
  
  // Princípio Operacional
  actionPlan?: string; // O que fazer? (ação)
  toolUsed?: string; // Como fazer? (ferramenta)
  expectedResult?: string; // Qual o objetivo? (resultado esperado)
  nextAction?: string; // Qual é a próxima ação? (continuidade do fluxo)

  metrics: {
    health: number; // 0-100
    totalLeads: number;
    activeLeads: number;
    conversionCount: number;
  };
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  linkedLeadId?: string;
  linkedAppointmentId?: string;
  linkedFollowUpId?: string;
  tags?: string[];
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

export interface LeadActionLog {
  id: string;
  leadId: string;
  timestamp: string;
  module: string; // e.g. Tabela, Ficha, Kanban, Simulador, WhatsApp, etc.
  action: string; // e.g. 'Status alterado', 'Nota adicionada', 'Renda alterada'
  prevValue: string;
  newValue: string;
  user: string;
  notes?: string;
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
  type: 'reuniao' | 'telefone' | 'proposta' | 'whatsapp' | 'visita' | 'presencial' | 'outro';
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
  deliveryPhase?: 'Pronto' | 'Curto' | 'Médio' | 'Longo' | 'Lançamento';
  deliveryDate?: string;
  developerId?: string;
  campaigns?: string[];
  features?: string[]; // varanda, suite, etc.
  description: string;
  imageUrl?: string;
  images?: string[];
  region?: string;
  enterpriseName?: string;
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

  // SPREADSHEET ALIGNED FIELDS
  attemptNo?: number; // Tentativa nº (1, 2, 3, Resgate)
  scriptIdUsed?: string; // ID do script usado
  result?: 'Atendeu' | 'Caixa postal' | 'Não respondeu' | 'Respondeu positivamente' | 'Respondeu negativamente';
  newObjectionDetected?: string;
  statusPostFollowUp?: 'Lead avançou' | 'Lead estagnou' | 'Lead retrocedeu';
}



