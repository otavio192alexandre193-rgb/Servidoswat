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

export const DEFAULT_STATUS_COLUMNS: KanbanColumn[] = [
  { id: 'novo', label: 'Novos', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'ativo', label: 'Ativos', bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
  { id: 'arquivado', label: 'Arquivados', bgClass: 'bg-zinc-100/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-500' },
];

export const DEFAULT_ETAPAS_COLUMNS: KanbanColumn[] = [
  { id: 'abordagem', label: 'Abordagem inicial', bgClass: 'bg-sky-100/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-500' },
  { id: 'triagem', label: 'Triagem', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'qualificacao', label: 'Qualificação', bgClass: 'bg-purple-100/90', labelClass: 'text-purple-950', accentBorderClass: 'border-purple-500' },
  { id: 'analise_perfil', label: 'Análise de Perfil', bgClass: 'bg-fuchsia-100/90', labelClass: 'text-fuchsia-950', accentBorderClass: 'border-fuchsia-500' },
  { id: 'compatibilizacao', label: 'Compatibilização c/ Estoque', bgClass: 'bg-rose-100/90', labelClass: 'text-rose-950', accentBorderClass: 'border-rose-500' },
  { id: 'apresentacao', label: 'Apresentação de solução', bgClass: 'bg-pink-100/90', labelClass: 'text-pink-950', accentBorderClass: 'border-pink-500' },
  { id: 'proposta', label: 'Proposta', bgClass: 'bg-red-100/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-500' },
  { id: 'visita', label: 'Visita / Reunião', bgClass: 'bg-orange-100/90', labelClass: 'text-orange-950', accentBorderClass: 'border-orange-500' },
  { id: 'objecao', label: 'Objeções', bgClass: 'bg-amber-100/90', labelClass: 'text-amber-950', accentBorderClass: 'border-amber-500' },
  { id: 'escolha_de_unidade', label: 'Escolha de unidade', bgClass: 'bg-yellow-100/90', labelClass: 'text-yellow-950', accentBorderClass: 'border-yellow-500' },
  { id: 'simulacao_final', label: 'Simulação final', bgClass: 'bg-lime-100/90', labelClass: 'text-lime-950', accentBorderClass: 'border-lime-500' },
  { id: 'fechamento', label: 'Fechamento', bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
  { id: 'pos_venda', label: 'Pós-Venda', bgClass: 'bg-green-100/90', labelClass: 'text-green-950', accentBorderClass: 'border-green-500' },
  { id: 'follow_up_1', label: 'Follow-up 1', bgClass: 'bg-teal-100/90', labelClass: 'text-teal-950', accentBorderClass: 'border-teal-500' },
  { id: 'follow_up_2', label: 'Follow-up 2', bgClass: 'bg-cyan-100/90', labelClass: 'text-cyan-950', accentBorderClass: 'border-cyan-500' },
  { id: 'follow_up_3', label: 'Follow-up 3', bgClass: 'bg-sky-100/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-500' },
  { id: 'resgate', label: 'Resgate', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'reciclagem', label: 'Reciclagem', bgClass: 'bg-zinc-100/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-500' },
];

export const DEFAULT_PERFIL_COLUMNS: KanbanColumn[] = [
  { id: 'jovem_solteiro', label: 'Jovem profissional solteiro', bgClass: 'bg-blue-100/90', labelClass: 'text-blue-950', accentBorderClass: 'border-blue-500' },
  { id: 'casal_sem_filhos', label: 'Casal sem filhos', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'familia_com_filhos', label: 'Família com filhos', bgClass: 'bg-violet-100/90', labelClass: 'text-violet-950', accentBorderClass: 'border-violet-500' },
  { id: 'universitario', label: 'Universitário', bgClass: 'bg-purple-100/90', labelClass: 'text-purple-950', accentBorderClass: 'border-purple-500' },
  { id: 'investidor_pf', label: 'Investidor PF', bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
  { id: 'executivo_expatriado', label: 'Executivo expatriado', bgClass: 'bg-zinc-100/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-500' },
  { id: 'aposentado', label: 'Aposentado', bgClass: 'bg-orange-100/90', labelClass: 'text-orange-950', accentBorderClass: 'border-orange-500' },
  { id: 'divorciada_o', label: 'Divorciado(a)', bgClass: 'bg-rose-100/90', labelClass: 'text-rose-950', accentBorderClass: 'border-rose-500' },
  { id: 'migrante_interior', label: 'Migrante do interior', bgClass: 'bg-sky-100/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-500' },
  { id: 'nomade_digital', label: 'Nômade digital', bgClass: 'bg-cyan-100/90', labelClass: 'text-cyan-950', accentBorderClass: 'border-cyan-500' },
  { id: 'casal_lgbtqia', label: 'Casal LGBTQIA+', bgClass: 'bg-fuchsia-100/90', labelClass: 'text-fuchsia-950', accentBorderClass: 'border-fuchsia-500' },
  { id: 'familia_multigeracional', label: 'Família multigeracional', bgClass: 'bg-amber-100/90', labelClass: 'text-amber-950', accentBorderClass: 'border-amber-500' },
  { id: 'classe_media_ascendente', label: 'Classe média ascendente', bgClass: 'bg-teal-100/90', labelClass: 'text-teal-950', accentBorderClass: 'border-teal-500' },
  { id: 'habitacional_social', label: 'Habitacional social', bgClass: 'bg-lime-100/90', labelClass: 'text-lime-950', accentBorderClass: 'border-lime-500' },
  { id: 'profissional_liberal', label: 'Profissional liberal (home office)', bgClass: 'bg-yellow-100/90', labelClass: 'text-yellow-950', accentBorderClass: 'border-yellow-500' },
  { id: 'jovem_herdeiro', label: 'Jovem herdeiro', bgClass: 'bg-stone-100/90', labelClass: 'text-stone-950', accentBorderClass: 'border-stone-500' },
  { id: 'comprador_acessibilidade', label: 'Comprador por acessibilidade', bgClass: 'bg-sky-200/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-600' },
  { id: 'ex_morador_risco', label: 'Ex-morador de área de risco', bgClass: 'bg-red-100/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-500' },
  { id: 'usuario_transporte', label: 'Usuário de transporte/metrô', bgClass: 'bg-slate-100/90', labelClass: 'text-slate-950', accentBorderClass: 'border-slate-500' },
  { id: 'casal_investidor', label: 'Casal investidor (renda de aluguel)', bgClass: 'bg-emerald-200/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-600' },
];

export const DEFAULT_OBJECOES_COLUMNS: KanbanColumn[] = [
  { id: 'muito_caro', label: 'Muito caro', bgClass: 'bg-pink-100/90', labelClass: 'text-pink-950', accentBorderClass: 'border-pink-500' },
  { id: 'entrada_pesada', label: 'Entrada pesada', bgClass: 'bg-red-100/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-500' },
  { id: 'parcelas_altas', label: 'Parcelas altas', bgClass: 'bg-rose-100/90', labelClass: 'text-rose-950', accentBorderClass: 'border-rose-500' },
  { id: 'medo_perder_emprego', label: 'Medo de perder emprego', bgClass: 'bg-orange-100/90', labelClass: 'text-orange-950', accentBorderClass: 'border-orange-500' },
  { id: 'endividado', label: 'Endividado', bgClass: 'bg-red-200/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-600' },
  { id: 'renda_baixa', label: 'Renda baixa', bgClass: 'bg-amber-100/90', labelClass: 'text-amber-950', accentBorderClass: 'border-amber-500' },
  { id: 'restricao_bacen', label: 'Restrição BACEN', bgClass: 'bg-red-300/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-700' },
  { id: 'nome_sujo', label: 'Nome sujo', bgClass: 'bg-zinc-300/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-600' },
  { id: 'sem_comprovacao_renda', label: 'Sem comprovação de renda', bgClass: 'bg-stone-200/90', labelClass: 'text-stone-950', accentBorderClass: 'border-stone-500' },
  { id: 'achei_pequeno', label: 'Achei pequeno', bgClass: 'bg-purple-100/90', labelClass: 'text-purple-950', accentBorderClass: 'border-purple-500' },
  { id: 'planta_ruim', label: 'Planta ruim', bgClass: 'bg-fuchsia-100/90', labelClass: 'text-fuchsia-950', accentBorderClass: 'border-fuchsia-500' },
  { id: 'sem_vaga', label: 'Sem vaga', bgClass: 'bg-sky-100/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-500' },
  { id: 'sem_varanda', label: 'Sem varanda', bgClass: 'bg-cyan-100/90', labelClass: 'text-cyan-950', accentBorderClass: 'border-cyan-500' },
  { id: 'pouca_iluminacao', label: 'Pouca iluminação', bgClass: 'bg-slate-200/90', labelClass: 'text-slate-950', accentBorderClass: 'border-slate-500' },
  { id: 'acabamento_simples', label: 'Acabamento simples', bgClass: 'bg-zinc-200/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-500' },
  { id: 'andar_muito_baixo', label: 'Andar baixo', bgClass: 'bg-teal-100/90', labelClass: 'text-teal-950', accentBorderClass: 'border-teal-500' },
  { id: 'nao_quero_terreo', label: 'Não quer térreo', bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
  { id: 'longe_do_metro', label: 'Longe do metrô', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'bairro_violento', label: 'Bairro violento', bgClass: 'bg-red-400/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-800' },
  { id: 'transito_intenso', label: 'Trânsito intenso', bgClass: 'bg-amber-200/90', labelClass: 'text-amber-950', accentBorderClass: 'border-amber-600' },
  { id: 'enchente_alagamento', label: 'Enchente/alagamento', bgClass: 'bg-blue-200/90', labelClass: 'text-blue-950', accentBorderClass: 'border-blue-600' },
  { id: 'ma_reputacao', label: 'Má reputação', bgClass: 'bg-zinc-400/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-700' },
  { id: 'medo_de_atraso', label: 'Medo de atraso', bgClass: 'bg-orange-200/90', labelClass: 'text-orange-950', accentBorderClass: 'border-orange-600' },
  { id: 'medo_de_falencia', label: 'Medo de falência', bgClass: 'bg-red-500/90', labelClass: 'text-red-950', accentBorderClass: 'border-red-900' },
  { id: 'demora_pra_entregar', label: 'Demora na entrega', bgClass: 'bg-lime-100/90', labelClass: 'text-lime-950', accentBorderClass: 'border-lime-500' },
  { id: 'interesse_futuro', label: 'Interesse futuro', bgClass: 'bg-yellow-100/90', labelClass: 'text-yellow-950', accentBorderClass: 'border-yellow-500' },
  { id: 'curioso', label: 'Curioso (só pesquisando)', bgClass: 'bg-zinc-100/90', labelClass: 'text-zinc-950', accentBorderClass: 'border-zinc-500' },
  { id: 'indeciso', label: 'Indeciso', bgClass: 'bg-sky-200/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-600' },
  { id: 'conjuge_nao_gostou', label: 'Marido/esposa não gostou', bgClass: 'bg-fuchsia-200/90', labelClass: 'text-fuchsia-950', accentBorderClass: 'border-fuchsia-600' },
  { id: 'ver_outro_barato', label: 'Vai ver outro mais barato', bgClass: 'bg-teal-200/90', labelClass: 'text-teal-950', accentBorderClass: 'border-teal-600' },
  { id: 'alugar_melhor', label: 'Alugar melhor que comprar', bgClass: 'bg-indigo-200/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-600' },
  { id: 'primeira_compra_inseguranca', label: 'Primeira compra (insegurança)', bgClass: 'bg-violet-200/90', labelClass: 'text-violet-950', accentBorderClass: 'border-violet-600' },
];

export const DEFAULT_QUALIFICACAO_COLUMNS: KanbanColumn[] = [
  { id: 'nao_qualificado', label: 'Sem Perfil / Não Qualificado', bgClass: 'bg-rose-100/90', labelClass: 'text-rose-950', accentBorderClass: 'border-rose-500' },
  { id: 'em_qualificacao', label: 'Em Qualificação / Análise', bgClass: 'bg-amber-100/90', labelClass: 'text-amber-950', accentBorderClass: 'border-amber-500' },
  { id: 'qualificado_mcmv', label: 'Qualificado MCMV', bgClass: 'bg-sky-100/90', labelClass: 'text-sky-950', accentBorderClass: 'border-sky-500' },
  { id: 'qualificado_sbpe', label: 'Qualificado SBPE', bgClass: 'bg-indigo-100/90', labelClass: 'text-indigo-950', accentBorderClass: 'border-indigo-500' },
  { id: 'dossie_pronto', label: 'Dossiê Pronto Caixa', bgClass: 'bg-emerald-100/90', labelClass: 'text-emerald-950', accentBorderClass: 'border-emerald-500' },
];

export function getKanbanColumns(pageId?: string, activeFlowId?: string): KanbanColumn[] {
  const activePageId = pageId || localStorage.getItem('ciclocred_active_funnel_page_id') || 'etapas';
  
  if (activePageId === 'principal' || activePageId === 'tabelas' || activePageId === 'status') {
    // legacy global fallback
    const savedLegacy = localStorage.getItem('swat_kanban_columns_v1');
    if (savedLegacy) {
      try {
        const parsed = JSON.parse(savedLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing kanban columns from localStorage', e);
      }
    }
  }

  const savedPage = localStorage.getItem(`swat_kanban_columns_page_${activePageId}`);
  if (savedPage) {
    try {
      const parsed = JSON.parse(savedPage);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (_) {}
  }

  if (activePageId === 'status') return DEFAULT_STATUS_COLUMNS;
  if (activePageId === 'etapas' || activePageId === 'ativos') {
    const flowId = activeFlowId || localStorage.getItem("ciclocred_active_system_flow_id");
    const savedFlows = localStorage.getItem("ciclocred_crm_operational_flows");
    if (flowId && savedFlows) {
      try {
        const flows = JSON.parse(savedFlows);
        if (Array.isArray(flows)) {
          const activeFlow = flows.find(f => f.id === flowId);
          if (activeFlow && activeFlow.stages && activeFlow.stages.length > 0) {
            const colors = [
              { bg: 'bg-indigo-100/90', text: 'text-indigo-950', border: 'border-indigo-500' },
              { bg: 'bg-emerald-100/90', text: 'text-emerald-950', border: 'border-emerald-500' },
              { bg: 'bg-sky-100/90', text: 'text-sky-950', border: 'border-sky-500' },
              { bg: 'bg-purple-100/90', text: 'text-purple-950', border: 'border-purple-500' },
              { bg: 'bg-fuchsia-100/90', text: 'text-fuchsia-950', border: 'border-fuchsia-500' },
              { bg: 'bg-rose-100/90', text: 'text-rose-950', border: 'border-rose-500' },
              { bg: 'bg-amber-100/90', text: 'text-amber-950', border: 'border-amber-500' },
            ];
            return activeFlow.stages.map((stage: any, index: number) => {
              const color = colors[index % colors.length];
              return {
                id: stage.id,
                label: stage.name,
                bgClass: color.bg,
                labelClass: color.text,
                accentBorderClass: color.border
              };
            });
          }
        }
      } catch (_) {}
    }
    return DEFAULT_ETAPAS_COLUMNS;
  }
  if (activePageId === 'perfil') return DEFAULT_PERFIL_COLUMNS;
  if (activePageId === 'qualificacao') return DEFAULT_QUALIFICACAO_COLUMNS;
  if (activePageId === 'objecoes' || activePageId === 'carteira') return DEFAULT_OBJECOES_COLUMNS;
  return DEFAULT_ETAPAS_COLUMNS;
}

export function saveKanbanColumns(columns: KanbanColumn[], pageId?: string): void {
  const activePageId = pageId || localStorage.getItem('ciclocred_active_funnel_page_id') || 'etapas';
  localStorage.setItem(`swat_kanban_columns_page_${activePageId}`, JSON.stringify(columns));
  if (activePageId === 'principal' || activePageId === 'tabelas' || activePageId === 'status') {
    // Keep legacy key synced for fallback
    localStorage.setItem('swat_kanban_columns_v1', JSON.stringify(columns));
  }
}
