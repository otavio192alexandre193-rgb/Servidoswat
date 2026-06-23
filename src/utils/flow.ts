export const DEFAULT_FLOW_STAGES = [
  { id: 'etapa-abordagem-inicial', name: 'ABORDAGEM INICIAL', timer: { days: 1, hours: 4, minutes: 30 } },
  { id: 'etapa-triagem', name: 'TRIAGEM', timer: { days: 0, hours: 24, minutes: 0 } },
  { id: 'etapa-qualificacao', name: 'QUALIFICAÇÃO', timer: { days: 0, hours: 24, minutes: 0 } },
  { id: 'etapa-analise-perfil', name: 'ANÁLISE DE PERFIL', timer: { days: 0, hours: 48, minutes: 0 } },
  { id: 'etapa-apresentacao-solucao', name: 'APRESENTAÇÃO DE SOLUÇÃO', timer: { days: 0, hours: 24, minutes: 0 } },
  { id: 'etapa-proposta', name: 'PROPOSTA', timer: { days: 0, hours: 24, minutes: 0 } },
  { id: 'etapa-visita-reuniao', name: 'VISITA / REUNIÃO', timer: { days: 1, hours: 0, minutes: 0 } },
  { id: 'etapa-objecoes', name: 'OBJEÇÕES', timer: { days: 0, hours: 24, minutes: 0 } },
  { id: 'etapa-escolha-unidade', name: 'ESCOLHA DE UNIDADE', timer: { days: 0, hours: 24, minutes: 0 } },
  { id: 'etapa-simulacao-final', name: 'SIMULAÇÃO FINAL', timer: { days: 0, hours: 12, minutes: 0 } },
  { id: 'etapa-fechamento', name: 'FECHAMENTO', timer: { days: 0, hours: 48, minutes: 0 } },
  { id: 'etapa-follow-up-1', name: 'FOLLOW-UP 1', timer: { days: 2, hours: 0, minutes: 0 } },
  { id: 'etapa-follow-up-2', name: 'FOLLOW-UP 2', timer: { days: 5, hours: 0, minutes: 0 } },
  { id: 'etapa-follow-up-3', name: 'FOLLOW-UP 3', timer: { days: 7, hours: 0, minutes: 0 } },
  { id: 'etapa-resgate', name: 'RESGATE', timer: { days: 15, hours: 0, minutes: 0 } },
  { id: 'etapa-reciclagem', name: 'RECICLAGEM', timer: { days: 30, hours: 0, minutes: 0 } },
];

export const DEFAULT_STATUS_TIMERS = {
  recentes: { hours: 24, minutes: 0 },
  ativos: { hours: 24, minutes: 0 }
};

export function createDefaultFlow(id: string, name: string) {
  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    stages: [...DEFAULT_FLOW_STAGES],
    statusTimers: { ...DEFAULT_STATUS_TIMERS }
  };
}
