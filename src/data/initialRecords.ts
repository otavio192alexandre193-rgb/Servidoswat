/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, EmailTemplate, EmailLog, RealEstateProperty, RealEstateMemory } from '../types';

export const INITIAL_MEMORY: RealEstateMemory = {
  developers: [
    { id: 'dev-1', name: 'Cury Construtora', rating: 4.8 },
    { id: 'dev-2', name: 'Plano & Plano', rating: 4.7 },
    { id: 'dev-3', name: 'Tenda', rating: 4.5 },
    { id: 'dev-4', name: 'MRV', rating: 4.6 },
  ],
  neighborhoods: [
    { id: 'nb-1', name: 'Penha', region: 'Zona Leste', avgPriceSqm: 6500, priceTrend: 'subindo', avgDaysToSell: 45, predominantProfile: 'Famílias Jovens' },
    { id: 'nb-2', name: 'Tucuruvi', region: 'Zona Norte', avgPriceSqm: 7200, priceTrend: 'estavel', avgDaysToSell: 60, predominantProfile: 'Primeiro Imóvel' },
    { id: 'nb-3', name: 'Guarulhos Centro', region: 'Metropolitana', avgPriceSqm: 5800, priceTrend: 'subindo', avgDaysToSell: 30, predominantProfile: 'Investidores' },
  ],
  marketInsights: {
    lastUpdate: new Date().toISOString(),
    generalTrend: 'Mercado em alta para lançamentos MCMV na Grande SP.'
  }
};

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'João',
    email: 'joao.invest@email.com',
    phone: '11912345678',
    company: 'Demo Investimento',
    value: 350000,
    status: 'novo',
    stage: 'qualificacao',
    notes: 'Cliente experiente em aportes financeiros, focado em rentabilidade na Zona Sul.',
    origin: 'Inbound',
    createdAt: '2026-06-11',
    region: 'Sul',
    sqmMatters: 'sim',
    incomeType: 'variavel',
    deadlineMatters: 'nao',
    deliveryExpected: 'nao',
    objections: [],
    gender: 'Homem',
    ageBracket: 'Meia idade',
    profiles: ['Investidor', 'Meia idade'],
    funnelPlacements: [
      { pageId: 'principal', status: 'qualificacao' }
    ],
    mainProfile: 'Investidor',
    unitTypeMatters: 'nao',
    deliveryMatters: 'nao',
    firstImpression: 'Focado em alta rentabilidade com renda variável na Zona Sul.'
  },
  {
    id: 'lead-2',
    name: 'Maria',
    email: 'maria.primeira@email.com',
    phone: '21998765432',
    company: 'Demo Primeiro Imóvel',
    value: 250000,
    status: 'ativo',
    stage: 'objecao',
    notes: 'Procura segurança e subsídio. Achou as opções apresentadas caras.',
    origin: 'WhatsApp',
    createdAt: '2026-06-11',
    region: 'Norte',
    sqmMatters: 'sim',
    incomeType: 'fixa',
    deadlineMatters: 'sim',
    deliveryExpected: 'sim',
    objections: ['Muito caro'],
    gender: 'Mulher',
    ageBracket: 'Jovem',
    profiles: ['Primeiro imóvel', 'Jovem'],
    funnelPlacements: [
      { pageId: 'principal', status: 'objecoes' }
    ],
    mainProfile: 'Primeiro Imóvel',
    unitTypeMatters: 'sim',
    deliveryMatters: 'sim',
    firstImpression: 'Sonha com o primeiro imóvel, orçamentos sob rígida objeção de custo.'
  },
  {
    id: 'lead-3',
    name: 'José',
    email: 'jose.idoso@email.com',
    phone: '31988887777',
    company: 'Demo Acessibilidade',
    value: 180000,
    status: 'arquivado',
    stage: 'follow_up_1',
    notes: 'Prioriza acessibilidade e proximidade de serviços de saúde na Zona Leste.',
    origin: 'Google Organic',
    createdAt: '2026-06-11',
    region: 'Leste',
    sqmMatters: 'sim',
    incomeType: 'fixa',
    deadlineMatters: 'sim',
    deliveryExpected: 'sim',
    objections: [],
    gender: 'Homem',
    ageBracket: 'Idoso',
    profiles: ['Idoso'],
    funnelPlacements: [
      { pageId: 'followup_reciclagem', status: 'followup_1' }
    ],
    mainProfile: 'Idoso',
    unitTypeMatters: 'sim',
    deliveryMatters: 'sim',
    firstImpression: 'Aposentado, busca conforto e infraestrutura de segurança.'
  }
];

export const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'temp-1',
    name: 'Boas-vindas Comercial',
    subject: 'Olá {{nome}} - Apresentação da Ciclo Cred!',
    body: 'Olá, {{nome}}!\n\nTudo bem? Vi que você solicitou contato através de nosso canal em {{origem}} demonstrando interesse nas nossas soluções de CRM e Automação.\n\nQueremos entender melhor o desafio atual da {{empresa}} para desenhar a melhor proposta de valor para você. Qual o melhor dia e horário para um bate-papo de 15 minutos nesta semana?\n\nGrande abraço,\nEquipe Ciclo Cred',
    triggerEvent: 'Disparo manual para novos leads',
  },
  {
    id: 'temp-2',
    name: 'Follow-up de Proposta',
    subject: 'Atualização da Proposta Comercial - {{empresa}}',
    body: 'Olá, {{nome}}!\n\nPassando para acompanhar a proposta comercial de {{valor}} que enviamos recentemente para a {{empresa}}.\n\nFicou alguma dúvida em relação ao escopo, relatórios integrados ou termos comerciais? Estamos prontos para fazer ajustes se necessário para fecharmos essa parceria.\n\nFico no aguardo do seu feedback!\n\nAtenciosamente,\nDiretoria de Vendas - Ciclo Cred',
    triggerEvent: 'Follow-up em andamento',
  },
  {
    id: 'temp-3',
    name: 'Reativação de Lead Adormecido',
    subject: 'Como estão as suas metas comerciais este mês, {{nome}}?',
    body: 'Olá, {{nome}}!\n\nHá algum tempo conversamos sobre como o CRM e a automação poderiam impulsionar os resultados comerciais da {{empresa}}.\n\nAcabamos de lançar um novo módulo de relatórios estendidos de altíssima performance estruturados diretamente por performance de canais de marketing. Gostaria de agendar uma demonstração rápida de 5 minutos?\n\nAbraço,\nEquipe Ciclo Cred',
    triggerEvent: 'Reengajamento de leads antigos',
  }
];

export const INITIAL_EMAIL_LOGS: EmailLog[] = [
  {
    id: 'log-1',
    leadId: 'lead-2',
    leadName: 'Roberto Alencar',
    templateName: 'Boas-vindas Comercial',
    subject: 'Olá Roberto - Apresentação da Ciclo Cred!',
    body: 'Olá, Roberto!\n\nTudo bem? ...',
    sentAt: '2026-05-19 14:32',
    status: 'enviado',
  },
  {
    id: 'log-2',
    leadId: 'lead-3',
    leadName: 'Felipe Santos Oliveira',
    templateName: 'Follow-up de Proposta',
    subject: 'Atualização da Proposta Comercial - Growth Corp',
    body: 'Olá, Felipe!\n\nAssegurando a nossa proposta...',
    sentAt: '2026-05-22 09:15',
    status: 'enviado',
  }
];

export const INITIAL_PROPERTIES: any[] = [
  {
    id: 'prop-1',
    code: 'IMO-CURY-4012',
    title: 'Cury Residencial Mirante do Vale - Penha',
    type: 'apartamento',
    price: 275000,
    bedrooms: 2,
    suites: 1,
    bathrooms: 1,
    parkingSpaces: 1,
    sizeSqm: 42,
    location: 'São Paulo - SP',
    neighborhood: 'Penha (Zona Leste)',
    status: 'disponivel',
    deliveryPhase: 'Lançamento',
    features: ['varanda', 'suíte', 'lazer completo'],
    developerId: 'dev-1',
    description: 'Excelente apartamento Cury Construtora na planta com sacada gourmet, opções de lazer completo diferenciado equipado pelo programa Caixa Minha Casa Minha Vida.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: 'prop-2',
    code: 'IMO-CURY-8821',
    title: 'Cury Dez Alvorada - Alto de Pinheiros (Planta)',
    type: 'apartamento',
    price: 345000,
    bedrooms: 2,
    suites: 1,
    bathrooms: 1,
    parkingSpaces: 1,
    sizeSqm: 48,
    location: 'São Paulo - SP',
    neighborhood: 'Alto de Pinheiros (Arredores)',
    status: 'disponivel',
    deliveryPhase: 'Médio',
    features: ['varanda', 'suíte'],
    developerId: 'dev-1',
    description: 'Moderno apartamento Cury Construtora, excelente localização, acabamentos impecáveis de qualidade e plano de parcelamento facilitado em obras.',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: 'prop-3',
    code: 'IMO-CURY-1193',
    title: 'Cury Vista Cantareira - Tucuruvi',
    type: 'apartamento',
    price: 295000,
    bedrooms: 2,
    suites: 0,
    bathrooms: 1,
    parkingSpaces: 1,
    sizeSqm: 40,
    location: 'São Paulo - SP',
    neighborhood: 'Tucuruvi (Zona Norte)',
    status: 'disponivel',
    description: 'Sua oportunidade Cury Construtora na Zona Norte. Apartamento moderno na planta com subsídios federais e Casa Paulista integrados no fluxo.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: 'prop-4',
    code: 'IMO-CURY-3958',
    title: 'Cury Único Marginal Pinheiros',
    type: 'apartamento',
    price: 310000,
    bedrooms: 2,
    suites: 1,
    bathrooms: 1,
    parkingSpaces: 1,
    sizeSqm: 45,
    location: 'São Paulo - SP',
    neighborhood: 'Bela Vista / Marginais',
    status: 'reservado',
    description: 'Mais um grande sucesso de vendas da Cury Construtora em parceria de captação Cury Constelação. Apartamentos na planta com fluxo ideal facilitado e taxa de juros balcão reduzida pela Caixa.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: 'prop-cury-1',
    code: 'IMO-CURY-001',
    title: 'Cury Residencial Parque do Carmo - Leste SP',
    type: 'apartamento',
    price: 265000,
    bedrooms: 2,
    suites: 1,
    bathrooms: 1,
    parkingSpaces: 1,
    sizeSqm: 48,
    location: 'Região Metropolitana de SP - São Paulo',
    neighborhood: 'Parque do Carmo',
    status: 'disponivel',
    description: 'Empreendimento de alta qualidade Cury Construtora em parceria de captação Cury Constelação. Totalmente enquadrado no Programa Minha Casa Minha Vida HIS 1 com subsídios imperdíveis da Caixa Econômica.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=600'
    ]
  },
  {
    id: 'prop-cury-2',
    code: 'IMO-CURY-002',
    title: 'Cury Eko Metropolitana Guarulhos',
    type: 'apartamento',
    price: 325000,
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    sizeSqm: 56,
    location: 'Região Metropolitana de SP - Guarulhos',
    neighborhood: 'Centro de Guarulhos',
    status: 'disponivel',
    description: 'Lançamento exclusivo Cury Construtora integrado com a central de parcelamento Cury Constelação. Excelente localização na região metropolitana com fomento habitacional e FGTS Redutor.',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'
    ]
  }
];

