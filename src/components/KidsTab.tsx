/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PiggyBank, 
  TrendingUp, 
  Flame, 
  Award, 
  Sparkles, 
  Coins, 
  Target, 
  ArrowRight,
  TrendingDown,
  LineChart,
  Briefcase,
  Layers,
  Zap,
  HelpCircle,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  CloudLightning,
  ChevronRight
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback, INITIAL_ACCESSIBILITY_SETTINGS } from '../utils/sensory';

interface KidsTabProps {
  awardXP: (xp: number) => void;
  accSettings?: AccessibilitySettings;
}

export default function KidsTab({ awardXP, accSettings = INITIAL_ACCESSIBILITY_SETTINGS }: KidsTabProps) {
  // Monthly brokerage investing / capital allocation
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(500);
  
  // Custom Portfolio Assets selection state
  const [selectedTools, setSelectedTools] = useState<string[]>(['ads-micro', 'landing-page']);
  
  // Game states (Gincana 1: Campaign Simulator)
  const [campaignBudget, setCampaignBudget] = useState<number>(300);
  const [ctrChoice, setCtrChoice] = useState<number>(2.5); // 1.5%, 2.5%, 5%
  const [conversionChoice, setConversionChoice] = useState<number>(10); // 5%, 10%, 20%
  const [simulationResult, setSimulationResult] = useState<{
    clicks: number;
    leadsGenerated: number;
    estimatedValue: number;
    roi: number;
    feedback: string;
    xpEarned: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Game states (Gincana 2: Advanced Investment Quiz)
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizDone, setQuizDone] = useState<boolean>(false);
  const [chosenAnswer, setChosenAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Estados para Alocação Paralela de Lucro das Vendas (Máquina Brutal de Ganhos)
  const [allocationClosingProfit, setAllocationClosingProfit] = useState<number>(35000);
  const [allocationYieldPercent, setAllocationYieldPercent] = useState<number>(60); // 60% Rendimentos, 40% Tráfego
  const [allocationProjectionMonths, setAllocationProjectionMonths] = useState<number>(12);

  // Business Asset/Tool Options
  const leverageTools = [
    { 
      id: 'ads-micro', 
      name: '🎯 Tráfego Pago local (Google/Meta)', 
      cost: 250, 
      desc: 'Mais visitas para suas ofertas habitacionais.', 
      benefit: 'Gera +10 leads/mês com leads qualificados.' 
    },
    { 
      id: 'landing-page', 
      name: '⚡ Landing Page Ultra Rápida', 
      cost: 150, 
      desc: 'Página otimizada de alta conversão SBPE/MCMV.', 
      benefit: 'Aumenta conversão de leads em 4% geral.' 
    },
    { 
      id: 'google-workspace', 
      name: '📦 Integração Total Google Workspace', 
      cost: 100, 
      desc: 'Agenda, Gmail automatizado e drive integrados.', 
      benefit: 'Reduz em 25 minutos o tempo de resposta do funil.' 
    },
    { 
      id: 'copy-ai', 
      name: '🤖 Roteiros Copywriting Assistidos por Gemini', 
      cost: 200, 
      desc: 'Mensagens cativantes para reaquecer leads frios.', 
      benefit: 'Aumenta Win Rate das propostas em até 5%.' 
    },
    { 
      id: 'crm-dashboard', 
      name: '📊 Dashboard de Performance Avançado', 
      cost: 300, 
      desc: 'Análise de canais e faturamentos reais.', 
      benefit: 'Ajuda a focar nos canais de ROI superior.' 
    },
    { 
      id: 'mentoring', 
      name: '🎓 Mentoria CRECI & Vendas de Alto Padrão', 
      cost: 500, 
      desc: 'Táticas de contorno de objeções de crédito.', 
      benefit: 'Aumenta potencial médio da carteira em 15%.' 
    },
  ];

  const quizQuestions = [
    {
      question: "Qual o efeito dos juros de $1\%$ ao mês reinvestidos de forma composta a longo prazo para o corretor?",
      options: [
        "Insignificante, pois os juros são baixos comparados com a inflação",
        "Efeito bola de neve, onde os rendimentos de cada mês geram ainda mais ganhos sobre os saldos acumulados!",
        "Apenas corrige o dinheiro sem aumentar o poder de compra da corretora"
      ],
      correct: 1,
      explanation: "Perfeito! Juros de 1% ao mês geram crescimento fantástico no longo prazo por reinvestir o lucro operacional."
    },
    {
      question: "O que significa 'Alavancagem Comercial' no mercado imobiliário?",
      options: [
        "Tomar empréstimos caros para comprar roupas de grife",
        "Investir parte da sua comissão na ampliação de ferramentas (CRM, automações, Workspace, anúncios) gerando mais leads e fechamentos!",
        "Trabalhar mais horas sem descanso para tentar dobrar o faturamento"
      ],
      correct: 1,
      explanation: "Correto! Alavancagem inteligente reduz o esforço manual e multiplica as fontes de receita automatizadas."
    },
    {
      question: "Se você gera 100 leads e converte 2 propostas de venda, qual seria seu ROI ideal ao dobrar o orçamento de mídia?",
      options: [
        "Procurar melhorar a qualificação dos leads antes de investir para não desperdiçar verba",
        "Gastar todo o orçamento restante em mídias físicas tradicionais",
        "Importar qualquer planilha de lista fria e disparar spam indiscriminado"
      ],
      correct: 0,
      explanation: "Exato! Alavancar a operação garantindo boa taxa de resposta/conversão antes de escalar evita ROI negativo."
    }
  ];

  // Compound Interest Calcs at real 1% per month (r = 0.01)
  // Formula: A = PMT * (((1 + r)^n - 1) / r)
  const calcCompound = (pmt: number, months: number) => {
    const r = 0.01; // Real interest rate of 1%
    const total = pmt * ((Math.pow(1 + r, months) - 1) / r);
    return Math.round(total);
  };

  const results = {
    months12: calcCompound(monthlyInvestment, 12),
    months36: calcCompound(monthlyInvestment, 36),
    months60: calcCompound(monthlyInvestment, 60),
    months120: calcCompound(monthlyInvestment, 120),
  };

  const totalInvestedOfPeriod = (months: number) => monthlyInvestment * months;

  const toggleTool = (toolId: string) => {
    triggerSensoryFeedback('click', accSettings);
    if (selectedTools.includes(toolId)) {
      setSelectedTools(prev => prev.filter(id => id !== toolId));
    } else {
      setSelectedTools(prev => [...prev, id => toolId]);
    }
  };

  // Run Ad Campaign Gincana
  const handleRunSimulation = () => {
    setIsSimulating(true);
    triggerSensoryFeedback('click', accSettings);

    setTimeout(() => {
      // 1 CPC = R$ 1.50
      const clicks = Math.round(campaignBudget / 1.5);
      const leadsGenerated = Math.round(clicks * (ctrChoice / 100));
      const simulatedWinRate = conversionChoice / 100;
      const closedDeals = Math.round(leadsGenerated * simulatedWinRate * 10) / 10;
      
      // Potential revenue
      const estimatedValue = Math.round(closedDeals * 280000 * 0.03); // 3% average commission on R$280k
      const roi = campaignBudget > 0 ? Math.round(((estimatedValue - campaignBudget) / campaignBudget) * 100) : 0;

      let feedback = "";
      let xp = 150;
      if (roi > 300) {
        feedback = "🏆 EXCELENTE! Você alinhou perfeitamente tráfego e conversão. Alto ROI e captação voraz!";
        xp = 350;
      } else if (roi >= 100) {
        feedback = "📈 BOM RETORNO! Seus investimentos geraram negócios suficientes para pagar as contas de marketing e sobrou lucro.";
        xp = 250;
      } else if (roi > 0) {
        feedback = "⚖️ EQUILIBRADO! O retorno foi baixo mas positivo. Ajuste seu roteiro de objeções e aproveite melhor seus leads.";
        xp = 180;
      } else {
        feedback = "⚠️ ROI NEGATIVO. Ajuste a conversão do funil ou conectores Google Workspace para agilizar o follow-up.";
        xp = 100;
      }

      setSimulationResult({
        clicks,
        leadsGenerated,
        estimatedValue,
        roi,
        feedback,
        xpEarned: xp
      });
      setIsSimulating(false);
      awardXP(xp);
      triggerSensoryFeedback(roi > 0 ? 'success' : 'warning', accSettings);
    }, 1000);
  };

  // Handle Quiz Gincana
  const handleSelectAnswer = (idx: number) => {
    if (submitted) return;
    triggerSensoryFeedback('click', accSettings);
    setChosenAnswer(idx);
  };

  const handleNextQuestion = () => {
    setChosenAnswer(null);
    setSubmitted(false);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizDone(true);
      triggerSensoryFeedback('chime', accSettings);
      const scoreXp = quizScore * 100 + 150;
      awardXP(scoreXp);
    }
  };

  const handleQuizSubmit = () => {
    if (chosenAnswer === null || submitted) return;
    setSubmitted(true);
    const correct = chosenAnswer === quizQuestions[quizIndex].correct;
    if (correct) {
      setQuizScore(prev => prev + 1);
      triggerSensoryFeedback('success', accSettings);
    } else {
      triggerSensoryFeedback('warning', accSettings);
    }
  };

  const resetQuiz = () => {
    triggerSensoryFeedback('click', accSettings);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizDone(false);
    setChosenAnswer(null);
    setSubmitted(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 select-none"
    >
      {/* 1. COMMISSION REINVESTMENT HEADER */}
      <div className="bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-950 border-4 border-zinc-950 p-6 md:p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] text-white relative overflow-hidden">
        <div className="absolute right-4 bottom-2 text-9xl text-white/5 font-black font-mono select-none pointer-events-none">ROI</div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 border border-indigo-400 text-white rounded-full text-[10px] font-black uppercase font-mono tracking-widest">
            <TrendingUp className="w-4 h-4 shrink-0 animate-pulse text-cyan-400" />
            Acelerador de Alavancagem & Fortunas
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-sans uppercase italic tracking-tighter leading-none text-white">
            Reinvista seus Ganhos para Alavancar seu Negócio! 🚀
          </h2>
          <p className="text-xs md:text-sm text-zinc-300 font-medium leading-relaxed font-sans text-left">
            O corretor de alto impacto imobiliário não gasta toda a sua comissão à toa. Ele destina uma parcela mensal para acumular com juros de 1% ao mês e outra parte para investir em ferramentas de conversão, anúncios de tráfego e integrações do Google Workspace, multiplicando seus resultados!
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-mono font-black text-cyan-400">
            <span className="bg-zinc-950/60 px-2.5 py-1 rounded-full border border-zinc-800">📊 Juros Real de 1% ao Mês</span>
            <span className="bg-zinc-950/60 px-2.5 py-1 rounded-full border border-zinc-800">🔥 Desafios & Gincanas Financeiras</span>
            <span className="bg-zinc-950/60 px-2.5 py-1 rounded-full border border-zinc-800">🧠 Estratégia de Captação Autoral</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. REAL INVESTMENT SIMULATOR */}
        <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between space-y-5">
          <div className="space-y-1.5 text-left border-b border-zinc-200 pb-3">
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-indigo-600 animate-bounce" />
              Simulador de Juros Compostos Reais (1% ao Mês) 🪙
            </h3>
            <p className="text-xs text-zinc-500 font-sans">
              Veja o impacto astronômico de guardar uma fração da comissão mensal para capital de expansão e giro da sua imobiliária.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-zinc-600">Reinvestimento Mensal Recomendado:</span>
                <span className="bg-indigo-50 text-indigo-800 px-3 py-1 border border-indigo-200 rounded-full font-black text-sm">
                  R$ {monthlyInvestment.toLocaleString('pt-BR')},00
                </span>
              </div>
              <input
                id="broker-investment-slider"
                type="range"
                min="100"
                max="5000"
                step="100"
                value={monthlyInvestment}
                onChange={(e) => {
                  triggerSensoryFeedback('click', accSettings);
                  setMonthlyInvestment(Number(e.target.value));
                }}
                className="w-full h-3 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 select-none pb-0"
              />
              <div className="flex justify-between text-[9px] font-black text-zinc-400 font-mono uppercase">
                <span>R$ 100 (Básico)</span>
                <span>R$ 5.000 (Investidor Elite)</span>
              </div>
            </div>

            {/* Results Grid - 1% real compound interest over time */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
              <div className="bg-zinc-50 border-2 border-zinc-950 p-2.5 rounded-2xl text-center space-y-1">
                <span className="text-[8.5px] font-black text-zinc-400 block">1 ANO</span>
                <span className="text-sm font-black text-zinc-900 block">R$ {results.months12.toLocaleString()}</span>
                <p className="text-[8px] text-zinc-500 font-sans">Aplicado: R$ {totalInvestedOfPeriod(12).toLocaleString()}</p>
                <span className="text-[7.5px] text-indigo-700 bg-indigo-50 py-0.5 rounded font-black block mt-0.5">
                  🛡️ Fundo Emergência
                </span>
              </div>

              <div className="bg-zinc-50 border-2 border-zinc-950 p-2.5 rounded-2xl text-center space-y-1">
                <span className="text-[8.5px] font-black text-zinc-400 block text-indigo-600">3 ANOS</span>
                <span className="text-sm font-black text-zinc-900 block">R$ {results.months36.toLocaleString()}</span>
                <p className="text-[8px] text-zinc-500 font-sans">Aplicado: R$ {totalInvestedOfPeriod(36).toLocaleString()}</p>
                <span className="text-[7.5px] text-emerald-700 bg-emerald-50 py-0.5 rounded font-black block mt-0.5">
                  🚀 Escritório Próprio
                </span>
              </div>

              <div className="bg-zinc-50 border-2 border-zinc-950 p-2.5 rounded-2xl text-center space-y-1">
                <span className="text-[8.5px] font-black text-zinc-400 block text-purple-650">5 ANOS</span>
                <span className="text-sm font-black text-zinc-900 block">R$ {results.months60.toLocaleString()}</span>
                <p className="text-[8px] text-zinc-500 font-sans">Aplicado: R$ {totalInvestedOfPeriod(60).toLocaleString()}</p>
                <span className="text-[7.5px] text-purple-700 bg-purple-50 py-0.5 rounded font-black block mt-0.5">
                  🏢 Expansão de Franquias
                </span>
              </div>

              <div className="bg-zinc-950 border-2 border-zinc-950 text-white p-2.5 rounded-2xl text-center space-y-1 relative overflow-hidden">
                <span className="text-[8.5px] font-black text-cyan-400 block">10 ANOS</span>
                <span className="text-sm font-black text-white block">R$ {results.months120.toLocaleString()}</span>
                <p className="text-[8px] text-zinc-400 font-sans">Aplicado: R$ {totalInvestedOfPeriod(120).toLocaleString()}</p>
                <span className="text-[7.5px] text-yellow-400 bg-zinc-900 border border-zinc-800 py-0.5 rounded font-black block mt-0.5">
                  💎 Liberdade Financeira
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 text-zinc-300 border-2 border-zinc-950 p-3.5 rounded-2xl space-y-1.5 text-xs font-sans text-left">
            <div className="flex items-center gap-1.5 text-yellow-300 font-mono text-[9px] font-extrabold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Por que 1% Juros Real?</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Diferente de juros nominais que sofrem depreciação inflacionária, a meta de <strong>1% real ao mês</strong> significa rendimento líquido já descontado toda a inflação. Isso garante crescimento exponencial real do poder aquisitivo do consultor autônomo.
            </p>
          </div>
        </div>

        {/* 3. BUSINESS ASSET BUILDING */}
        <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div className="space-y-1.5 text-left border-b border-zinc-200 pb-3">
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Montagem de Portfólio de Alavancagem Comercial ⚒️
            </h3>
            <p className="text-xs text-zinc-500 font-sans">
              Monte seu arsenal tecnológico. Marque as caixas para ver os benefícios esperados acumulados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
            {leverageTools.map((tool) => {
              const active = selectedTools.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`border-2 rounded-2xl p-3.5 cursor-pointer text-left transition-all relative flex flex-col justify-between ${
                    active 
                      ? 'bg-indigo-50/50 border-indigo-600 shadow-[2.5px_2.5px_0px_0px_rgba(79,70,229,1)]' 
                      : 'bg-white border-zinc-350 hover:bg-zinc-50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-zinc-800 uppercase font-mono tracking-tight">{tool.name}</h4>
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        className="rounded border-zinc-350 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">{tool.desc}</p>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-dashed border-zinc-200 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Custo Estimado:</span>
                    <span className="text-[10.5px] font-black text-indigo-650 font-mono">R$ {tool.cost}/mês</span>
                  </div>
                  {active && (
                    <div className="mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8.5px] p-1.5 rounded font-bold font-mono">
                      🔥 {tool.benefit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aggregated indicators */}
          <div className="bg-zinc-950 text-zinc-150 p-4 border-2 border-zinc-950 rounded-2xl flex justify-between items-center font-mono text-center">
            <div className="space-y-0.5">
              <span className="text-[8px] text-zinc-400 font-extrabold uppercase block">Custo Total Ativo</span>
              <span className="text-base font-black text-white">
                R$ {selectedTools.reduce((acc, currentId) => acc + (leverageTools.find(t => t.id === currentId)?.cost || 0), 0)}/mês
              </span>
            </div>
            <div className="w-[1.5px] bg-zinc-800 h-9 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[8px] text-zinc-400 font-extrabold uppercase block">Retorno em Conversão</span>
              <span className="text-sm font-black text-indigo-400">
                🚀 Multiplicador Otimizado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GINCANA INTERATIVA MULTI-PLAY PANEL */}
      <div className="border-4 border-zinc-950 bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
        <div className="border-b border-zinc-200 pb-3 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-indigo-650 font-mono tracking-widest flex items-center gap-1">
              <CloudLightning className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Gincanas de Treinamento e Escala Comercial</span>
            </span>
            <h3 className="text-lg font-black text-zinc-900 uppercase italic">Quadra de Desafios do Corretor Investidor</h3>
          </div>
          <div className="bg-amber-100 text-amber-800 border-2 border-zinc-950 rounded-full px-3 py-1 font-mono font-black text-xs">
            ✨ Pratique e ganhe XP operacional e estrutural
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* GINCANA 1: SIMULADOR DE TRÁFEGO PAGO */}
          <div className="lg:col-span-7 bg-zinc-50 border-2 border-zinc-950 p-5 rounded-2xl space-y-4">
            <div className="border-b border-zinc-350 pb-2">
              <span className="bg-purple-150 text-purple-800 px-2.5 py-0.5 border border-purple-200 rounded-full text-[9px] font-black uppercase font-mono tracking-wider">Gincana das Mídias</span>
              <h4 className="text-base font-black text-zinc-900 uppercase mt-1">Simulador Prático de Google & Meta Ads</h4>
              <p className="text-[10.5px] text-zinc-500 font-sans mt-0.5">Simule uma campanha imobiliária direcionada a lançamentos da Caixa Econômica.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-mono font-black text-zinc-500 block">Orçamento da Campanha</label>
                <select
                  value={campaignBudget}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setCampaignBudget(Number(e.target.value));
                  }}
                  className="w-full bg-white border-2 border-zinc-950 p-1.5 rounded-lg text-xs font-black"
                >
                  <option value="150">R$ 150 (Testes Críticos)</option>
                  <option value="300">R$ 300 (Campanha Localizada)</option>
                  <option value="1000">R$ 1.000 (Multi-Canais Premium)</option>
                  <option value="2500">R$ 2.500 (Impacto Regional)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-mono font-black text-zinc-500 block">Taxa de Cliques (CTR)</label>
                <select
                  value={ctrChoice}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setCtrChoice(Number(e.target.value));
                  }}
                  className="w-full bg-white border-2 border-zinc-950 p-1.5 rounded-lg text-xs font-black"
                >
                  <option value="1.5">1.5% (Anuncio Comum)</option>
                  <option value="2.5">2.5% (Copy Otimizada)</option>
                  <option value="5">5.0% (Vídeo Autoral)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-mono font-black text-zinc-500 block">Taxa de Compra / Vendas</label>
                <select
                  value={conversionChoice}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setConversionChoice(Number(e.target.value));
                  }}
                  className="w-full bg-white border-2 border-zinc-950 p-1.5 rounded-lg text-xs font-black"
                >
                  <option value="2">2.0% (Respostas Demoradas)</option>
                  <option value="10">10.0% (Follow-up Excelente)</option>
                  <option value="20">20.0% (Funil Ativo c/ Workspace)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 active:translate-y-0.5 text-white border-2 border-zinc-950 rounded-xl text-xs font-black uppercase font-mono tracking-wider flex items-center justify-center gap-2 select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
            >
              {isSimulating ? (
                <span>Injetando anúncios e simulado CTR...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-450 fill-white" />
                  <span>Disparar Campanha Simulada</span>
                </>
              )}
            </button>

            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 text-white p-4 rounded-xl border-2 border-zinc-950 space-y-3.5 relative overflow-hidden"
              >
                <div className="absolute right-2 top-2 bg-yellow-400 text-zinc-950 border border-zinc-950 text-[9px] px-2 py-0.5 rounded font-black font-mono">
                  +{simulationResult.xpEarned} XP GANHO
                </div>

                <h5 className="text-xs uppercase font-mono text-cyan-400 font-extrabold tracking-wide">📊 Resultados Finais Estimados</h5>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-zinc-950 rounded-lg p-2.5">
                    <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">CLIQUES REAIS</span>
                    <span className="text-base font-black text-white">{simulationResult.clicks}</span>
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-2.5">
                    <span className="text-[8.5px] text-zinc-400 uppercase block font-mono font-bold">LEADS GERADOS</span>
                    <span className="text-base font-black text-white">{simulationResult.leadsGenerated}</span>
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-2.5">
                    <span className="text-[8.5px] text-zinc-400 uppercase block font-mono font-bold">RECONHECIMENTO ROI</span>
                    <span className={`text-base font-black ${simulationResult.roi >= 100 ? 'text-emerald-400' : simulationResult.roi > 0 ? 'text-yellow-400' : 'text-rose-400'}`}>
                      {simulationResult.roi}%
                    </span>
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-2.5">
                    <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Faturamento Comissão</span>
                    <span className="text-base font-black text-emerald-450">
                      R$ {simulationResult.estimatedValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-left text-[11px] font-semibold text-zinc-300">
                  {simulationResult.feedback}
                </div>
              </motion.div>
            )}
          </div>

          {/* GINCANA 2: QUIZ OPERACIONAL FINANCEIRO */}
          <div className="lg:col-span-5 bg-zinc-900 text-white border-2 border-zinc-950 p-5 rounded-3xl flex flex-col justify-between">
            <div className="space-y-2">
              <span className="bg-indigo-650 text-indigo-100 border border-indigo-500 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase font-mono tracking-wider">Quiz de Alavancagem</span>
              <h4 className="text-md font-black uppercase tracking-tight font-mono text-zinc-100">Desafio de Mentalidade de Giro</h4>
              
              {!quizDone ? (
                <div className="space-y-4 pt-1 text-left">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-450 uppercase font-bold">
                    <span>Questão {quizIndex + 1} de {quizQuestions.length}</span>
                    <span>Acertos: {quizScore}</span>
                  </div>
                  
                  <p className="text-xs font-black leading-snug">{quizQuestions[quizIndex].question}</p>
                  
                  <div className="space-y-2.5">
                    {quizQuestions[quizIndex].options.map((option, idx) => {
                      const isSelected = chosenAnswer === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAnswer(idx)}
                          disabled={submitted}
                          className={`w-full text-left p-3 text-[11px] rounded-xl border-2 transition-all font-sans relative ${
                            submitted
                              ? idx === quizQuestions[quizIndex].correct
                                ? 'bg-emerald-900/40 border-emerald-500 text-emerald-250 font-black'
                                : isSelected
                                  ? 'bg-rose-900/40 border-rose-500 text-rose-250'
                                  : 'bg-zinc-950/40 border-zinc-850 text-zinc-450'
                              : isSelected
                                ? 'bg-indigo-950 border-indigo-500 text-white font-bold'
                                : 'bg-zinc-950/20 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/40 text-zinc-350'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono text-[9px] font-black shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="leading-snug">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl text-[10.5px] border ${
                        chosenAnswer === quizQuestions[quizIndex].correct
                          ? 'bg-emerald-950/30 border-emerald-850 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-850 text-rose-300'
                      }`}
                    >
                      <strong>{chosenAnswer === quizQuestions[quizIndex].correct ? '✓ Acertou!' : '❌ Incorreto.'}</strong>{' '}
                      {quizQuestions[quizIndex].explanation}
                    </motion.div>
                  )}

                  <div className="pt-2">
                    {!submitted ? (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={chosenAnswer === null}
                        className={`w-full py-2.5 bg-yellow-450 hover:bg-yellow-500 text-zinc-950 border-2 border-zinc-950 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition ${
                          chosenAnswer === null ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Submeter Resposta
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-950 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition"
                      >
                        {quizIndex + 1 < quizQuestions.length ? 'Próxima Questão' : 'Ver Recompensa Total de XP'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-950 border-2 border-indigo-500 rounded-full flex items-center justify-center text-yellow-300 font-black text-2xl mx-auto shadow-lg animate-pulse">
                    🏆
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-zinc-100 uppercase font-mono">Quiz Concluído!</h5>
                    <p className="text-xs text-zinc-400">Excelente aproveitamento operacional de conteúdo financeiro comercial.</p>
                  </div>
                  
                  <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 font-mono text-xs">
                    <div>Respostas Corretas: <strong className="text-emerald-400">{quizScore} de {quizQuestions.length}</strong></div>
                    <div className="mt-1 text-[11px] text-yellow-400 font-bold">XP Acumulado Concedido: +{quizScore * 100 + 150} XP</div>
                  </div>

                  <button
                    onClick={resetQuiz}
                    className="px-5 py-2 hover:bg-zinc-850 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] uppercase font-mono font-black tracking-widest flex items-center gap-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar Quiz</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DUAL-ENGINE ALLOCATION MACHINE (Rendimentos & Tráfego) */}
      <div className="border-4 border-zinc-950 bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] text-left animate-fadeIn">
        <div className="border-b border-zinc-200 pb-3 mb-6">
          <span className="text-[10px] uppercase font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-300 rounded-full tracking-widest inline-flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            <span>Alavancagem de Lucro Real de Vendas</span>
          </span>
          <h3 className="text-lg font-black text-zinc-900 uppercase italic mt-1.5 flex items-center gap-2">
            Máquina Brutal de Investimentos & Tráfego
          </h3>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Configure o lucro obtido com o fechamento de vendas reais e simule a alocação paralela ideal entre Rendimento Financeiro Passivo e Amplificação Ativa por Mídia/Marketing.
          </p>
        </div>

        {/* Input Parameters panel */}
        <div className="bg-zinc-50 p-5 border-2 border-zinc-950 rounded-2xl space-y-5 font-mono text-xs mb-6 text-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] uppercase font-black text-zinc-650 block">Lucro das Vendas Efetivas (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-zinc-400">R$</span>
                <input
                  type="number"
                  step="1000"
                  value={allocationClosingProfit}
                  onChange={(e) => {
                    triggerSensoryFeedback('click', accSettings);
                    setAllocationClosingProfit(Math.max(0, Number(e.target.value)));
                  }}
                  className="w-full bg-white border-2 border-zinc-950 p-2 pl-9 rounded-xl text-zinc-900 font-black"
                />
              </div>
              <p className="text-[9px] text-zinc-500 font-sans font-medium">Ex: Comissão líquida de negociações cicloCRED salvas.</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] uppercase font-black text-zinc-650 flex justify-between">
                <span>Alocação para Aplicação</span>
                <span className="text-indigo-650 font-black">{allocationYieldPercent}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={allocationYieldPercent}
                onChange={(e) => {
                  triggerSensoryFeedback('click', accSettings);
                  setAllocationYieldPercent(Number(e.target.value));
                }}
                className="w-full accent-indigo-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                <span>0% Poupar</span>
                <span>Restante p/ Marketing: {100 - allocationYieldPercent}%</span>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] uppercase font-black text-zinc-650 flex justify-between">
                <span>Tempo de Projeção</span>
                <span className="text-amber-600 font-black">{allocationProjectionMonths} Meses</span>
              </label>
              <input
                type="range"
                min="1"
                max="36"
                step="1"
                value={allocationProjectionMonths}
                onChange={(e) => {
                  triggerSensoryFeedback('click', accSettings);
                  setAllocationProjectionMonths(Number(e.target.value));
                }}
                className="w-full accent-amber-500 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                <span>1 Mês</span>
                <span>36 Meses (3 Anos)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Engines Grid Display */}
        {(() => {
          const yieldAmount = allocationClosingProfit * (allocationYieldPercent / 100);
          const marketingAmount = allocationClosingProfit * ((100 - allocationYieldPercent) / 100);
          
          // Yield compounds 1% per month: Total = P * (1 + 0.01)^N
          const projectedYieldCapital = yieldAmount * Math.pow(1.01, allocationProjectionMonths);
          const interestYieldGain = projectedYieldCapital - yieldAmount;

          // Marketing simulation
          // Cost per Lead (CPL) is R$ 35
          const leadsFromTraffic = Math.floor(marketingAmount / 35);
          // Lead to Client conversion is 2%
          const projectedConversions = leadsFromTraffic * 0.02;
          // Sub-sale profit assuming normal commission structure of R$ 8,000 net fee per conversion
          const subSaleCommissionGain = projectedConversions * 8000;
          const marketingROI = marketingAmount > 0 ? ((subSaleCommissionGain - marketingAmount) / marketingAmount) * 100 : 0;

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-805">
              {/* Engine A: Yield passive compounding */}
              <div className="bg-indigo-50/40 border-2 border-indigo-600 p-5 rounded-2xl flex flex-col justify-between relative shadow-[4px_4px_0px_0px_rgba(79,70,229,0.1)]">
                <div className="absolute top-3 right-3 p-1 bg-indigo-100 rounded-lg text-indigo-700">
                  <PiggyBank className="w-4 h-4 animate-bounce" />
                </div>
                
                <div className="space-y-3">
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                    Motor A • Rendimentos e Juros Compostos
                  </span>
                  <h4 className="text-sm font-black uppercase text-indigo-950 font-sans tracking-tight">
                    Capital Garantido sob Taxa de 1% a.m. composto
                  </h4>
                  <p className="text-[11px] text-zinc-650">
                    O montante alocado em fundos de rendimentos passivos crescerá de forma sólida e sem riscos comerciais, protegendo seu faturamento acumulado.
                  </p>

                  <div className="bg-white p-4 border border-indigo-150 rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>Valor Alocado Hoje:</span>
                      <strong className="text-zinc-800">R$ {yieldAmount.toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>Rendimentos Obtidos ({allocationProjectionMonths}m):</span>
                      <strong className="text-emerald-600 font-extrabold">+ R$ {Math.round(interestYieldGain).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className="h-px bg-zinc-200 my-1" />
                    <div className="flex justify-between items-center text-[12.5px]">
                      <span className="font-extrabold text-zinc-900">Capital Acumulado Líquido:</span>
                      <strong className="text-indigo-700 font-black">R$ {Math.round(projectedYieldCapital).toLocaleString('pt-BR')}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-200/50 text-[10.5px] italic text-zinc-500 font-sans leading-relaxed">
                  📢 "Os juros compostos são a oitava maravilha do mundo imobiliário. Quem compreende, ganha; quem não compreende, paga."
                </div>
              </div>

              {/* Engine B: Active Marketing Multiplier */}
              <div className="bg-emerald-50/40 border-2 border-emerald-600 p-5 rounded-2xl flex flex-col justify-between relative shadow-[4px_4px_0px_0px_rgba(16,185,129,0.1)]">
                <div className="absolute top-3 right-3 p-1 bg-emerald-100 rounded-lg text-emerald-700">
                  <TrendingUp className="w-4 h-4 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    Motor B • Tráfego Pago & Captação Ativa
                  </span>
                  <h4 className="text-sm font-black uppercase text-emerald-950 font-sans tracking-tight">
                    Máquina de Escala e Anúncios Digitais
                  </h4>
                  <p className="text-[11px] text-zinc-650">
                    Investir o faturamento diretamente em anúncios de tráfego pago (Google/Meta Ads) atrai múltiplos leads qualificados para a planilha cicloCRED do CRM.
                  </p>

                  <div className="bg-white p-4 border border-emerald-200 rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>Verba Alocada Tráfego:</span>
                      <strong className="text-zinc-800">R$ {marketingAmount.toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>Previsão de Leads Gerados (CPL ~R$ 35):</span>
                      <strong className="text-indigo-600 font-black">{leadsFromTraffic} Leads</strong>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>Novas Vendas Convertidas (~2%):</span>
                      <strong className="text-amber-600 font-black">{projectedConversions.toFixed(1)} Fechamentos</strong>
                    </div>
                    <div className="h-px bg-zinc-200 my-1" />
                    <div className="flex justify-between items-center text-[12.5px]">
                      <span className="font-extrabold text-zinc-900">Novas Comissões Estimadas:</span>
                      <strong className="text-emerald-700 font-black">R$ {Math.round(subSaleCommissionGain).toLocaleString('pt-BR')}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200/50 flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-zinc-500">Retorno sobre Mídia (ROI):</span>
                  <span className={`${marketingROI >= 100 ? 'text-emerald-700 font-black' : 'text-zinc-600 font-bold'}`}>
                    📊 +{marketingROI.toFixed(0)}% ROI Geral
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Aggregate Multiplier summary banner */}
        <div className="mt-6 p-4 bg-zinc-950 font-mono text-xs border-2 border-zinc-950 rounded-2xl flex flex-col sm:flex-row items-center justify-between text-white gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="font-bold">Estratégia cicloCRED de Fortalecimento Integrado</p>
              <p className="text-[10px] text-zinc-400 font-medium">Equilíbrio perfeito de tesouraria do corretor de sucesso.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (awardXP) awardXP(150);
              triggerSensoryFeedback('success', accSettings);
            }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 border-2 border-zinc-950 rounded-xl text-[10px] text-white font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition active:translate-y-0.5 cursor-pointer text-center"
          >
            Aproveitar Planejamento Financeiro (+150 XP)
          </button>
        </div>
      </div>
    </motion.div>
  );
}
