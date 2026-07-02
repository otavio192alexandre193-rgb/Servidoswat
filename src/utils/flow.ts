export const DEFAULT_FLOW_STAGES = [
  { id: 'etapa-abordagem-inicial', name: 'ABORDAGEM INICIAL', timer: { days: 1, hours: 4, minutes: 30 }, mappedStageId: 'abordagem' },
  { id: 'etapa-triagem', name: 'TRIAGEM', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'triagem' },
  { id: 'etapa-qualificacao', name: 'QUALIFICAÇÃO', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'qualificacao' },
  { id: 'etapa-analise-perfil', name: 'ANÁLISE DE PERFIL', timer: { days: 0, hours: 48, minutes: 0 }, mappedStageId: 'analise_perfil' },
  { id: 'etapa-compatibilizacao', name: 'COMPATIBILIZAÇÃO COM ESTOQUE', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'compatibilizacao' },
  { id: 'etapa-apresentacao-solucao', name: 'APRESENTAÇÃO DE SOLUÇÃO', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'apresentacao' },
  { id: 'etapa-proposta', name: 'PROPOSTA', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'proposta' },
  { id: 'etapa-visita-reuniao', name: 'VISITA / REUNIÃO', timer: { days: 1, hours: 0, minutes: 0 }, mappedStageId: 'visita' },
  { id: 'etapa-objecoes', name: 'OBJEÇÕES', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'objecao' },
  { id: 'etapa-escolha-unidade', name: 'ESCOLHA DE UNIDADE', timer: { days: 0, hours: 24, minutes: 0 }, mappedStageId: 'escolha_de_unidade' },
  { id: 'etapa-simulacao-final', name: 'SIMULAÇÃO FINAL', timer: { days: 0, hours: 12, minutes: 0 }, mappedStageId: 'simulacao_final' },
  { id: 'etapa-fechamento', name: 'FECHAMENTO', timer: { days: 0, hours: 48, minutes: 0 }, mappedStageId: 'fechamento' },
  { id: 'etapa-pos-venda', name: 'PÓS-VENDA', timer: { days: 30, hours: 0, minutes: 0 }, mappedStageId: 'pos_venda' },
  { id: 'etapa-follow-up-1', name: 'FOLLOW-UP 1', timer: { days: 2, hours: 0, minutes: 0 }, mappedStageId: 'follow_up_1' },
  { id: 'etapa-follow-up-2', name: 'FOLLOW-UP 2', timer: { days: 5, hours: 0, minutes: 0 }, mappedStageId: 'follow_up_2' },
  { id: 'etapa-follow-up-3', name: 'FOLLOW-UP 3', timer: { days: 7, hours: 0, minutes: 0 }, mappedStageId: 'follow_up_3' },
  { id: 'etapa-resgate', name: 'RESGATE', timer: { days: 15, hours: 0, minutes: 0 }, mappedStageId: 'resgate' },
  { id: 'etapa-reciclagem', name: 'RECICLAGEM', timer: { days: 30, hours: 0, minutes: 0 }, mappedStageId: 'reciclagem' },
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
