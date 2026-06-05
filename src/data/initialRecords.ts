/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, EmailTemplate, EmailLog } from '../types';

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Ana Carolina Mendonça',
    email: 'ana.mendonca@email.com',
    phone: '(11) 98765-4321',
    company: 'Mendonça Seguros',
    value: 12500,
    status: 'novo',
    notes: 'Demonstrou alto interesse em soluções de automação empresarial. Solicitou contato preferencialmente no período da tarde.',
    origin: 'Instagram Ads',
    createdAt: '2026-05-20',
  },
  {
    id: 'lead-2',
    name: 'Roberto Alencar',
    email: 'roberto.alencar@techsolutions.cl',
    phone: '(21) 97654-3210',
    company: 'TechSolutions CL',
    value: 28000,
    status: 'em_contato',
    notes: 'Reunião de escopo inicial agendada. Deseja unificar seu CRM atual com nossa automação de e-mails.',
    origin: 'Google Ads',
    createdAt: '2026-05-18',
    lastContactAt: '2026-05-22',
  },
  {
    id: 'lead-3',
    name: 'Felipe Santos Oliveira',
    email: 'felipe.santos@growthcorp.com.br',
    phone: '(31) 99876-5432',
    company: 'Growth Corp',
    value: 45000,
    status: 'proposta',
    notes: 'Proposta comercial enviada no dia 22/05. Aguardando retorno da diretoria financeira sobre os módulos adicionais.',
    origin: 'LinkedIn Organic',
    createdAt: '2026-05-15',
    lastContactAt: '2026-05-22',
  },
  {
    id: 'lead-4',
    name: 'Mariana Duarte Costa',
    email: 'mariana.duarte@modasdesign.com',
    phone: '(85) 98877-6655',
    company: 'Design & Moda',
    value: 7500,
    status: 'fechado',
    notes: 'Contrato assinado! Setup de implantação de automações de e-mail e relatórios integrados planejado para a próxima semana.',
    origin: 'Indicação',
    createdAt: '2026-05-10',
    lastContactAt: '2026-05-24',
  },
  {
    id: 'lead-5',
    name: 'Lucas Ferreira Lima',
    email: 'lucas.lima@industriasferreira.com',
    phone: '(41) 99111-2222',
    company: 'Ferreira Ferragens',
    value: 19000,
    status: 'perdido',
    notes: 'Decidiu suspender o projeto por motivos de reestruturação orçamentária interna. Entrar em contato novamente no próximo trimestre.',
    origin: 'Pesquisa Orgânica',
    createdAt: '2026-05-08',
    lastContactAt: '2026-05-14',
  },
  {
    id: 'lead-6',
    name: 'Gabriela Vasconcelos',
    email: 'gabriela.v@vasconcelosadv.com.br',
    phone: '(11) 96543-9876',
    company: 'Vasconcelos Advocacia',
    value: 15000,
    status: 'novo',
    notes: 'Baixou o e-book de automação de processos comerciais. Excelente lead de topo de funil para nutrição frequente.',
    origin: 'Site Institucional',
    createdAt: '2026-05-23',
  },
  {
    id: 'lead-7',
    name: 'Carlos Alberto Souza',
    email: 'carlos.alberto@souzafood.com',
    phone: '(81) 97432-8877',
    company: 'Souza Food Distribuidora',
    value: 32000,
    status: 'em_contato',
    notes: 'Apresentação comercial realizada. Demonstrou interesse em relatórios estendidos de performance e KPIs.',
    origin: 'Google Ads',
    createdAt: '2026-05-19',
    lastContactAt: '2026-05-21',
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
    description: 'Mais um grande sucesso de vendas da Cury Construtora em parceria de captação cicloCRED. Apartamentos na planta com fluxo ideal facilitado e taxa de juros balcão reduzida pela Caixa.',
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
    description: 'Empreendimento de alta qualidade Cury Construtora em parceria de captação cicloCRED. Totalmente enquadrado no Programa Minha Casa Minha Vida HIS 1 com subsídios imperdíveis da Caixa Econômica.',
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
    description: 'Lançamento exclusivo Cury Construtora integrado com a central de parcelamento cicloCRED. Excelente localização na região metropolitana com fomento habitacional e FGTS Redutor.',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'
    ]
  }
];

