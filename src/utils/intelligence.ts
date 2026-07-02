import { Lead, RealEstateProperty, RealEstateMemory } from '../types';

export interface CompatibilityResult {
  score: number;
  reasoning: string;
}

/**
 * Motor de Compatibilidade Lead × Estoque
 */
export function calculateCompatibility(lead: Lead, property: RealEstateProperty): CompatibilityResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Capacidade Financeira (R$ Estimado do Imóvel ou Valor que o Lead busca)
  const leadTargetValue = lead.propertyValue || lead.value || 0;
  if (leadTargetValue > 0) {
    const diff = Math.abs(property.price - leadTargetValue);
    const diffPct = (diff / leadTargetValue) * 100;
    
    if (diffPct <= 10) {
      score += 40;
      reasons.push("Preço ideal para o orçamento.");
    } else if (diffPct <= 25) {
      score += 25;
      reasons.push("Preço dentro da margem de negociação.");
    }
  }

  // 2. Localização (Região e Bairro)
  if (lead.region && property.location && lead.region.toLowerCase() === property.location.toLowerCase()) {
    score += 15;
    reasons.push("Região compatível.");
  }
  
  if (lead.bairroEspecifico && property.neighborhood && lead.bairroEspecifico.toLowerCase() === property.neighborhood.toLowerCase()) {
    score += 15;
    reasons.push("Bairro exato desejado.");
  }

  // 3. Tipologia (Dormitórios)
  const leadBedrooms = Number(lead.bedrooms) || 0;
  if (leadBedrooms > 0 && property.bedrooms >= leadBedrooms) {
    score += 10;
    reasons.push(`${property.bedrooms} dormitórios atendem.`);
  }

  // 4. Prazo de Entrega
  if (lead.deliveryTimePreference && property.deliveryPhase && lead.deliveryTimePreference === property.deliveryPhase) {
    score += 10;
    reasons.push(`Fase de entrega (${property.deliveryPhase}) ideal.`);
  }

  // 5. Objetivo (Moradia vs Investimento)
  if (lead.objective === 'Investimento' && property.type === 'comercial') {
    score += 10;
    reasons.push("Excelente para perfil investidor.");
  }

  return {
    score: Math.min(100, score),
    reasoning: reasons.join(" • ")
  };
}

/**
 * Motor de Priorização
 */
export function calculatePriority(lead: Lead): Lead['priority'] {
  let points = 0;

  // Tempo sem contato
  const daysSinceContact = lead.lastContactAt ? 
    (Date.now() - new Date(lead.lastContactAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceContact < 1) points += 20;
  if (daysSinceContact > 7) points -= 10;

  // Interesse e Estágio
  if (lead.status === 'proposta_enviada') points += 50;
  if (lead.status === 'visita_agendada') points += 40;
  if (lead.status === 'quente') points += 30;

  // Compatibilidade (se houver score salvo)
  if (lead.compatibilityScore) points += lead.compatibilityScore / 2;

  if (points >= 80) return 'Crítico';
  if (points >= 60) return 'Muito Alto';
  if (points >= 40) return 'Alto';
  if (points >= 20) return 'Médio';
  return 'Baixo';
}

/**
 * Motor de Próxima Melhor Ação
 */
export function suggestNextAction(lead: Lead): string {
  if (lead.status === 'novo') return "Iniciar primeiro contato via WhatsApp";
  if (lead.status === 'quente' && !lead.checklist?.visitou) return "Agendar visita ao decorado";
  if (lead.checklist?.visitou && lead.status !== 'proposta_enviada') return "Solicitar documentação para proposta";
  if (lead.status === 'proposta_enviada') return "Realizar follow-up da proposta enviada";
  
  const daysSinceLastInteraction = lead.lastInteractionAt ? 
    (Date.now() - new Date(lead.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24) : 999;

  if (daysSinceLastInteraction > 3) return "Enviar conteúdo de valor/atualização de obra";
  
  return "Manter relacionamento periódico";
}

/**
 * Motor de Probabilidade de Conversão
 */
export function calculateConversionProbability(lead: Lead): number {
  let prob = 0.1;
  
  if (lead.status === 'proposta_enviada') prob += 0.5;
  if (lead.checklist?.visitou) prob += 0.2;
  if (lead.checklist?.aprov) prob += 0.15;
  if (lead.compatibilityScore && lead.compatibilityScore > 80) prob += 0.1;
  
  return Math.min(0.95, prob);
}
