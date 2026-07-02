import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, BrainCircuit, MessageSquare, Briefcase, Zap, Loader2 } from "lucide-react";
import { Lead } from "../types";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isQuickAction?: boolean;
}

interface AIAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  isInline?: boolean;
}

export default function AIAssistantChat({ isOpen, onClose, lead, isInline }: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Olá! Sou o Assistente Oficial cicloCRED integrado ao Gemini. O que você gostaria de analisar técnica ou comercialmente hoje?",
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const quickActions = [
    { label: "Analisar Lead", icon: BrainCircuit, query: "Faça uma análise profunda do perfil deste lead, simule o melhor plano de conversão de acordo com sua renda e fomento Caixa/MCMV ou SBPE e aponte os diferenciais.", reqLead: true },
    { label: "Roteiro Curto", icon: MessageSquare, query: "Gere um script de vendas imobiliárias curto e direto focado no perfil e na objeção cadastrada deste lead para eu enviar no privado.", reqLead: true },
    { label: "Sugerir Follow-Up", icon: Briefcase, query: "Com base nas notas, objeções e etapa do funil do lead, crie uma estratégia de follow-up com sugestão de data e melhor canal de contato.", reqLead: true },
    { label: "Aconselhar Venda", icon: Zap, query: "Seja meu coach de vendas. O que posso fazer para destravar o fechamento desse lead o mais rápido possível?", reqLead: true },
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsgId = Date.now().toString();
    const newMessages = [...messages, { id: userMsgId, sender: 'user' as const, text }];
    setMessages(newMessages);
    setInputVal("");
    setIsTyping(true);

    try {
      // Build dynamic system instructions incorporating lead profile, files, and active workflow
      const activeFlowId = localStorage.getItem("ciclocred_active_system_flow_id") || "flow-1";
      const savedFlows = localStorage.getItem("ciclocred_crm_operational_flows");
      let activeFlowStr = "Fluxo Geral Padrão (Etapas tradicionais)";
      if (activeFlowId && savedFlows) {
        try {
          const flows = JSON.parse(savedFlows);
          if (Array.isArray(flows)) {
            const activeFlow = flows.find((f: any) => f.id === activeFlowId);
            if (activeFlow) {
              activeFlowStr = `Fluxo de Trabalho Ativo: "${activeFlow.name}" (${activeFlow.description || 'sem descrição'}). Etapas do Funil que regem o CRM: ${activeFlow.stages?.map((s: any) => s.name).join(' -> ')}`;
            }
          }
        } catch (_) {}
      }

      let systemPrompt = "";
      if (lead) {
        systemPrompt = `Você é o Co-piloto e Consultor de Crédito & Vendas Inteligente oficial do cicloCRED CRM.
Sua missão é prestar assessoria estratégica em vendas imobiliárias e análise de crédito profissional para o corretor humano sobre o Lead atual:
- Nome do Lead: ${lead.name || 'Não informado'}
- Renda Familiar Mensal: R$ ${lead.familyIncome ? Number(lead.familyIncome).toLocaleString('pt-BR') : 'Não informada'}
- Valor de Aquisição Estimado: R$ ${lead.value ? Number(lead.value).toLocaleString('pt-BR') : 'Não informado'}
- Perfil Principal: ${lead.mainProfile || 'Geral/Atendimento'}
- Etapa de Compra: ${lead.stage || 'Prospecção'}
- Status no Funil: ${lead.status || 'Ativo'}
- Objeção Declarada do Cliente: ${lead.objection || 'Nenhuma objeção explícita cadastrada'}
- Programa Desejado: ${lead.programaDesejado || 'Minha Casa Minha Vida (MCMV) / SBPE Geral'}
- Histórico do Negócio / Notas do Corretor: ${lead.notes || 'Sem anotações adicionais'}

[CONTEXTO DE TRABALHO CRÍTICO]
${activeFlowStr}

Diretrizes de Resposta:
1. Responda de forma assertiva, estratégica e extremamente prática para o corretor.
2. Formate as mensagens usando Markdown elegante (negrito, marcadores rápidos).
3. Nunca fale em nome do cliente. Fale diretamente para o CORRETOR, assessorando-o sobre como fechar negócio imobiliário com este cliente.
4. Ao dar dicas do fomento imobiliário, faça recomendações de acordo com a renda (ex: se renda for baixa, recomende taxas do Minha Casa Minha Vida, subsídios Caixa; se for renda mais alta, recomende enquadramento SBPE flexível).
5. Se o corretor solicitar análise de lead ou script, produza respostas maduras, realistas e com alto tom de fechamento.`;
      } else {
        systemPrompt = `Você é o Co-piloto Estratégico oficial do cicloCRED CRM integrado de forma direta com o Gemini.
Sua missão é dar suporte e guiar corretores de imóveis e analistas de financiamento residencial sobre estratégias gerais de vendas, enquadramento de tabelas Caixa, simulações de financiamento, follow-ups eficientes e propostas.

[CONTEXTO DE TRABALHO CRÍTICO]
${activeFlowStr}

Seja conciso, direto, utilize formatação Markdown enriquecida com negritos e listas para leitura rápida e empodere a equipe com insights de alto nível imobiliário.`;
      }

      // Execute real Gemini API call through secure server-side route
      const res = await fetch("/api/server/test-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          custom_prompt: systemPrompt,
          model_name: "gemini-3.5-flash",
          temperature: 0.7
        })
      });

      if (!res.ok) {
        throw new Error(`Servidor respondeu com código de status ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "Desculpe, não consegui obter resposta da inteligência. Verifique se o servidor do Gemini está operacional.";

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: replyText }]);
    } catch (err: any) {
      console.error("Erro na integração do Assistente Gemini:", err);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: `⚠️ Ocorreu uma interrupção temporária na conexão direta com o Gemini: ${err.message || 'Erro de rede'}. Por favor, verifique se a chave de API está definida e tente novamente.` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen && !isInline) return null;

  const content = (
    <div className={`${isInline ? 'w-full h-[500px]' : 'w-full max-w-sm h-full border-l-4'} bg-zinc-900 border-zinc-950 shadow-lg flex flex-col font-mono`}>
      {/* Header */}
      <div className="p-4 border-b-2 border-zinc-950 flex items-center justify-between bg-purple-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 border-2 border-zinc-950 flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-black uppercase tracking-wider text-xs">Assistente Imobiliário AI</h2>
            {lead ? (
              <p className="text-purple-300 text-[9px] font-bold">Dossiê e Análise de: {lead.name}</p>
            ) : (
              <p className="text-purple-300 text-[9px] font-bold">Canal Co-piloto (Conexão Direta Gemini)</p>
            )}
          </div>
        </div>
        {!isInline && (
          <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Action Chips */}
      {lead && (
        <div className="p-2 bg-zinc-950 border-b border-zinc-800 flex overflow-x-auto gap-2 pb-2 scrollbar-none">
          {quickActions.map((action, i) => (
            <button
              key={i}
              disabled={isTyping}
              onClick={() => handleSend(action.query)}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 bg-zinc-800 hover:bg-purple-600/30 border border-zinc-700 hover:border-purple-500 rounded-full text-[9px] font-bold text-zinc-300 transition-colors disabled:opacity-50"
            >
              <action.icon className="w-3 h-3 text-purple-400" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              msg.sender === 'user'
                ? 'bg-purple-600 text-white border-2 border-zinc-950'
                : 'bg-zinc-850 text-zinc-200 border-2 border-zinc-950'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-850 border-2 border-zinc-950 max-w-[80%] rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-purple-300 text-[10px] font-bold">
              <Loader2 className="w-4 h-4  text-purple-500" />
              O Gemini está analisando os dados...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-zinc-950 border-t-2 border-zinc-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            disabled={isTyping}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
            placeholder={lead ? "Peça um conselho de renegociação sobre o lead..." : "Pergunte algo sobre o mercado de crédito Caixa..."}
            className="flex-1 bg-zinc-900 border-2 border-zinc-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(inputVal)}
            disabled={isTyping}
            className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-0.5 active:shadow-none shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 transition-opacity">
      {content}
    </div>
  );
}
