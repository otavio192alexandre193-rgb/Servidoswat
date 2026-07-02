/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead } from '../types';

export function autoGenerateScript(lead: Lead): string {
  const firstName = lead.name ? lead.name.split(" ")[0] : "Cliente";
  
  // Format variables
  const incomeStr = lead.familyIncome
    ? lead.familyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '';
  const fgtsStr = lead.fgtsSaldo
    ? lead.fgtsSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '';
  const valueStr = lead.value
    ? (lead.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '';

  // Greetings and Intro based on Profile
  let intro = `Olá, ${firstName}! Tudo bem? Aqui é o seu especialista da Cury Constelação. 🤝`;
  
  if (lead.mainProfile === "Investidor") {
    intro = `Olá, ${firstName}! Tudo bem? Sou especialista da Cury Constelação. 📈`;
  } else if (lead.mainProfile === "Primeiro Imóvel") {
    intro = `Olá, ${firstName}! Sou o consultor da Cury Constelação. Vi que você quer realizar o sonho de conquistar seu apartamento Cury na planta! 🏠`;
  }

  let body = '';
  
  // Custom context matching
  if (lead.programaDesejado === "Minha Casa Minha Vida") {
    body += `Excelente notícia: com as novas regras do programa Minha Casa Minha Vida, você possui um scorecard excelente (${lead.score || 70} pt) `;
    if (incomeStr) body += `para a sua faixa de renda de ${incomeStr}. `;
    if (lead.fgtsSaldo && lead.fgtsSaldo > 0) {
      body += `Podemos abater o seu saldo de FGTS de ${fgtsStr} diretamente nas parcelas! `;
    } else {
      body += `Temos planos de entrada facilitada que cabem perfeitamente no seu bolso. `;
    }
  } else if (lead.programaDesejado === "SBPE") {
    body += `Configurei uma simulação exclusiva pelo SBPE para o seu perfil. `;
    if (incomeStr) body += `Considerando sua renda familiar de ${incomeStr}, conseguimos ótimas taxas de juros no mercado. `;
  } else {
    body += `Fizemos uma simulação prévia do seu cadastro na Cury Constelação e seu perfil é elegível para excelentes condições de financiamento. `;
  }

  // Preferences
  if (lead.preferenciasUnidade && lead.preferenciasUnidade.length > 0) {
    body += `Inclusive, separei algumas opções contendo exatamente o que busca: ${lead.preferenciasUnidade.join(', ')} `;
    if (lead.bairroEspecifico) body += `na região de ${lead.bairroEspecifico}. `;
    else if (lead.region) body += `na Zona ${lead.region}. `;
  } else if (lead.bairroEspecifico) {
    body += `Filtrei algumas excelentes plantas na região de ${lead.bairroEspecifico} para você dar uma olhada. `;
  } else if (lead.region) {
    body += `Temos lançamentos imperdíveis na Zona ${lead.region} com facilidades incríveis. `;
  }

  // Objections
  if (lead.objection === "Muito caro" || lead.objection === "Sem entrada") {
    body += `Fique tranquilo quanto à entrada: temos fluxo de obras facilitado em até 36x e podemos buscar subsídio do governo de até R$ 55 mil para ajudar. `;
  } else if (lead.objection === "Aprovação de crédito" || lead.objection === "Restrição") {
    body += `Temos uma equipe especializada na aprovação junto à Caixa para perfis autônomos ou com restrições resolvidas recentemente para garantir a sua liberação. `;
  }

  const cta = `Podemos agendar uma ligação rápida de 3 minutos hoje ou enviar o dossiê detalhado em PDF para você dar uma olhada?`;

  return `${intro}\n\n${body.trim()}\n\n${cta}`;
}

export async function handleWhatsAppAction(
  lead: Lead,
  setLoadingState?: (loading: boolean) => void,
  onInteractionUpdate?: () => void
) {
  if (setLoadingState) setLoadingState(true);

  try {
    const brokerName = localStorage.getItem("crm_user_name") || localStorage.getItem("ciclocred_user_name") || "Consultor Especialista";
    const roleName = localStorage.getItem("crm_user_role") || localStorage.getItem("ciclocred_user_role") || "Consultor de Imóveis e Crédito";
    const agencyName = localStorage.getItem("crm_user_agency") || localStorage.getItem("ciclocred_agency_name") || "Cury Constelação";
    const creci = localStorage.getItem("crm_user_creci") || localStorage.getItem("ciclocred_creci_number") || "CRECI Ativo";

    const res = await fetch("/api/ai/generate-whatsapp-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead,
        brokerName,
        roleName,
        agencyName,
        creci
      })
    });

    let finalScript = '';
    if (res.ok) {
      const data = await res.json();
      finalScript = data.script;
    }

    if (!finalScript) {
      finalScript = autoGenerateScript(lead);
    }

    // Callback to update last contact or interaction
    if (onInteractionUpdate) {
      onInteractionUpdate();
    }

    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const waUrl = `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(finalScript)}`;
    
    // Attempt to open the local WhatsApp application directly
    window.location.href = waUrl;
  } catch (err) {
    console.warn("Fallback de script local devido a erro:", err);
    const fallbackScript = autoGenerateScript(lead);
    
    if (onInteractionUpdate) {
      onInteractionUpdate();
    }

    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const defaultPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const waUrl = `whatsapp://send?phone=${defaultPhone}&text=${encodeURIComponent(fallbackScript)}`;
    
    // Attempt to open the local WhatsApp application directly
    window.location.href = waUrl;
  } finally {
    if (setLoadingState) setLoadingState(false);
  }
}
