/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  Globe, 
  HelpCircle, 
  BookOpen, 
  TrendingUp, 
  UserPlus, 
  DollarSign, 
  Award, 
  Home, 
  Flame, 
  FileText, 
  Sparkles, 
  Mail, 
  Phone, 
  User, 
  Send,
  Zap,
  Tag,
  Share2,
  CheckCircle
} from 'lucide-react';
import { RealEstateProperty, Lead } from '../types';
import { triggerSensoryFeedback } from '../utils/sensory';

interface CicloCredInformTabProps {
  properties: RealEstateProperty[];
  onAddInboundLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  theme?: 'claro' | 'escuro' | 'galatico';
  accSettings?: any;
  awardXP?: (xp: number, cause: string) => void;
  addNotification?: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
}

export default function CicloCredInformTab({
  properties,
  onAddInboundLead,
  theme = 'escuro',
  accSettings,
  awardXP,
  addNotification
}: CicloCredInformTabProps) {
  // Capture Form State for specific property
  const [selectedPropertyForInbound, setSelectedPropertyForInbound] = useState<RealEstateProperty | null>(null);
  const [inboundName, setInboundName] = useState('');
  const [inboundEmail, setInboundEmail] = useState('');
  const [inboundPhone, setInboundPhone] = useState('');
  const [inboundIncome, setInboundIncome] = useState<number>(4500);
  const [inboundLocation, setInboundLocation] = useState('Zona Leste - SP');
  const [submitted, setSubmitted] = useState(false);

  // General Capture form
  const [generalName, setGeneralName] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [generalPhone, setGeneralPhone] = useState('');
  const [generalIncome, setGeneralIncome] = useState<number>(3800);
  const [generalSubmitted, setGeneralSubmitted] = useState(false);

  // Informative posts or segments
  const posts = [
    {
      id: 1,
      title: "Novas Regras MCMV SP: Como conseguir Subsídio de até R$ 55.000",
      category: "Crédito Habitacional",
      readTime: "4 min de leitura",
      summary: "Entenda o enquadramento na Faixa 1, 2 e 3 do programa do governo federal e como o redutor da taxa do FGTS facilita sua parcela.",
      desc: "O programa Minha Casa Minha Vida passou por atualizações importantes em 2026. Agora, famílias com renda de até R$ 8.000,00 podem se enquadrar nas taxas de juros facilitadas de até 4.25% ao ano. Em São Paulo Metropolitana, o subsídio federal atinge até R$ 55.000,00 para proponentes com dependentes ou tempo de trabalho formal superior a 3 anos. O estoque da Construtora Cury em locais como Itaquera, Guaianases, Guarulhos e Santo André já estão parametrizados nas novas portarias Caixa.",
      tag: "Minha Casa Minha Vida"
    },
    {
      id: 2,
      title: "Financiamento SBPE: Linhas de Crédito vs SFH nos Bancos",
      category: "Médio e Alto Padrão",
      readTime: "5 min de leitura",
      summary: "Seu orçamento supera a margem do MCMV? Conheça as vantagens do Sistema Brasileiro de Poupança.",
      desc: "O SBPE (Sistema Brasileiro de Poupança e Empréstimo) é a principal engrenagem para adquirir imóveis acima do limite do programa social Minha Casa Minha Vida. Financiando até 80% do valor de avaliação pela Caixa, Bradesco, Itaú ou Santander, as taxas atuais variam de 8.5% a 10.2% a.a. através do Sistema de Amortização Constante (SAC). A vantagem é a flexibilidade onde a comprovação de renda aceita adquirentes com portfólios autônomos e empresariais, consolidando o bônus de taxas reduzidas da cicloCRED.",
      tag: "Linhas SBPE"
    },
    {
      id: 3,
      title: "Lançamentos Cury em São Paulo: Como Reservar com ITBI Grátis",
      category: "Lançamentos",
      readTime: "3 min de leitura",
      summary: "Veja nossa lista de empreendimentos parceiros com escritura e registro totalmente subsidiados pela construtora.",
      desc: "A Construtora Cury é líder em moradias de alto padrão de acabamento com entrada extremamente parcelada. Em parceria com o correspondente cicloCRED, os novos lançamentos concedem isenção integral da taxa de ITBI (Imposto sobre Transmissão de Bens Imóveis) e Registro de Imóveis no Cartório. Esse subsídio corporativo economiza em média R$ 12.000,00 na assinatura da sua pasta de crédito, permitindo diluir o fluxo de entrada direto no período de 36 meses de obra.",
      tag: "Estoque SP"
    }
  ];

  // Submit Specific Inbound Lead
  const handleInboundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboundName || !inboundPhone) return;

    triggerSensoryFeedback('success', accSettings);
    if (awardXP) awardXP(300, 'INBOUND_CAMPANHA_PORTAL_WEB');

    // Prepare Lead payload for registration
    const leadPayload = {
      name: inboundName,
      email: inboundEmail || `${inboundName.toLowerCase().replace(/\s+/g, '')}@inbound.com`,
      phone: inboundPhone,
      value: selectedPropertyForInbound?.price || 320000,
      status: 'novo' as const,
      origin: 'cicloCRED Inform (Portal de Captação)',
      notes: `Interesse expressado no imóvel comercial: ${selectedPropertyForInbound?.title || 'Lançamento Geral'} | Renda Declarada: R$ ${inboundIncome.toLocaleString()}`
    };

    onAddInboundLead(leadPayload);

    if (addNotification) {
      addNotification(
        '🎯 LEAD CAPTURADO ONLINE!',
        `Novo lead "${inboundName}" se cadastrou pelo portal cicloCRED Inform para o imóvel "${selectedPropertyForInbound?.title || 'Lançamento'}".`,
        'success'
      );
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedPropertyForInbound(null);
      setInboundName('');
      setInboundEmail('');
      setInboundPhone('');
    }, 3500);
  };

  // Submit General Capturing Form
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalName || !generalPhone) return;

    triggerSensoryFeedback('success', accSettings);
    if (awardXP) awardXP(250, 'INBOUND_GERAL_PORTAL_WEB');

    const leadPayload = {
      name: generalName,
      email: generalEmail || `${generalName.toLowerCase().replace(/\s+/g, '')}@boletim.com`,
      phone: generalPhone,
      value: 290000,
      status: 'novo' as const,
      origin: 'cicloCRED Inform (Inscrição Boletim)',
      notes: `Cadastro espontâneo via Boletim Informativo cicloCRED de São Paulo. Renda Informada: R$ ${generalIncome.toLocaleString()}`
    };

    onAddInboundLead(leadPayload);

    if (addNotification) {
      addNotification(
        '📨 INSCRIÇÃO CADASTRADA!',
        `Lead "${generalName}" inserido na lista do CRM através da inscrição no boletim cicloCRED Inform.`,
        'success'
      );
    }

    setGeneralSubmitted(true);
    setTimeout(() => {
      setGeneralSubmitted(false);
      setGeneralName('');
      setGeneralEmail('');
      setGeneralPhone('');
    }, 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Editorial Portal Intro Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-indigo-950 border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="p-1 px-2 text-[9px] font-mono font-black uppercase text-indigo-300 bg-indigo-900/40 border border-indigo-700/60 rounded">
              🌐 Site de Captação Conectado
            </span>
            <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white mt-1.5 flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-400 animate-spin [animation-duration:12s]" />
              Portal Público: cicloCRED Inform
            </h1>
            <p className="text-xs text-zinc-300 font-sans mt-0.5 max-w-2xl leading-normal">
              Esta é a simulação integrada do seu site externo e blog imobiliário de São Paulo. Qualquer lead que simule ou preencha formulários aqui será <strong>automaticamente inserido</strong> na sua lista do CRM.
            </p>
          </div>
          <div className="px-3.5 py-1.5 bg-indigo-900/70 border border-indigo-500 rounded-xl font-mono text-[10px] text-zinc-200">
            📡 Endereço Ativo: <strong className="text-emerald-300">ciclocred-inform.com.br</strong>
          </div>
        </div>
      </div>

      {/* Main Web Page Layout inside a simulated Desktop Browser Client */}
      <div className="border-4 border-zinc-950 bg-zinc-100 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
        
        {/* Browser Top bar Frame */}
        <div className="bg-zinc-950 text-white p-3 flex items-center justify-between border-b-2 border-zinc-950 select-none">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
            </div>
            <span className="text-zinc-400 ml-4">https://www.ciclocred-inform.com.br/sao-paulo-cury-mcmv</span>
          </div>
          <span className="text-[9px] font-black uppercase font-mono tracking-widest text-indigo-400">▲ PORTAL PÚBLICO INTEGRANTE</span>
        </div>

        {/* SITE CONTENT */}
        <div className="p-6 md:p-8 space-y-12 bg-white text-zinc-900 font-sans">
          
          {/* Header of Public Site */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs font-mono">CC</div>
              <div>
                <strong className="block text-sm font-black uppercase text-zinc-950">cicloCRED Inform</strong>
                <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Notícias, Lançamentos Cury & Crédito Caixa</span>
              </div>
            </div>
            <nav className="flex gap-4 font-bold text-xs text-zinc-600">
              <a href="#mcmv" className="hover:text-indigo-600">Minha Casa Minha Vida</a>
              <a href="#sbpe" className="hover:text-indigo-600">Crédito SBPE</a>
              <a href="#estoque" className="hover:text-indigo-600">Portfólio Cury</a>
              <a href="#inscrever" className="hover:text-indigo-600">Fale Conosco</a>
            </nav>
          </div>

          {/* Site Hero section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-indigo-50/70 to-zinc-50 p-6 sm:p-8 rounded-3xl border border-indigo-150">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Destaque da Semana São Paulo
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 uppercase leading-none">
                Conquiste Seu Apartamento Cury na Grande SP com <span className="text-indigo-600 underline decoration-indigo-300 decoration-wavy">Documentação Grátis</span>!
              </h2>
              <p className="text-xs text-zinc-650 leading-relaxed font-sans">
                A simulação de crédito habitacional Caixa cicloCRED agora inclui isenção total de taxas de transferência ITBI e custas de Cartório de Imóveis para quem se cadastrar neste portal informativo. Veja lançamentos participantes!
              </p>
              
              <div className="flex gap-3">
                <a 
                  href="#estoque" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] rounded-lg tracking-wider transition-all"
                >
                  🚀 Ver Empreendimentos
                </a>
                <a 
                  href="#mcmv" 
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-950 font-black uppercase text-[10px] rounded-lg tracking-wider"
                >
                  📚 Guia do Subsídio MCMV
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 border-2 border-zinc-950 rounded-2xl bg-white p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b pb-2 flex items-center gap-1.5 text-zinc-900 font-bold text-xs uppercase font-mono">
                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                Simule Sua Ficha em 1 Minuto!
              </div>

              {generalSubmitted ? (
                <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-center space-y-2 animate-scaleIn">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-black uppercase text-emerald-950">Ficha Enviada com Sucesso!</h4>
                  <p className="text-[10px] text-emerald-800 font-sans leading-relaxed">
                    Sua solicitação de simulação foi conectada com a esteira do CRM cicloCRED. Um corretor especialista entrará em contato em breve no seu WhatsApp!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleGeneralSubmit} className="space-y-3 font-sans text-xs">
                  <div className="space-y-0.5">
                    <label className="block text-[9px] font-black uppercase text-zinc-500">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={generalName}
                      onChange={(e) => setGeneralName(e.target.value)}
                      placeholder="Ex: João Silva de Souza"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-bold text-xs focus:ring-1 focus:ring-indigo-650"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-black uppercase text-zinc-500">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        required
                        value={generalPhone}
                        onChange={(e) => setGeneralPhone(e.target.value)}
                        placeholder="Ex: (11) 99999-9999"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-black uppercase text-zinc-500">Renda Familiar Bruta (R$)</label>
                      <input
                        type="number"
                        min={1500}
                        required
                        value={generalIncome}
                        onChange={(e) => setGeneralIncome(Number(e.target.value) || 3500)}
                        placeholder="Ex: R$ 3.800"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-[9px] font-black uppercase text-zinc-500">E-mail para contatos</label>
                    <input
                      type="email"
                      value={generalEmail}
                      onChange={(e) => setGeneralEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-zinc-950 hover:bg-indigo-900 text-white font-black uppercase text-[10px] rounded-lg tracking-wider cursor-pointer"
                  >
                    Simular Aprovação Caixa Grátis 🎯
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* MCMV vs SBPE educational guides section */}
          <div id="mcmv" className="space-y-6">
            <div className="border-l-4 border-indigo-600 pl-4">
              <span className="text-[10px] font-mono font-black uppercase text-indigo-650">Educação e Fomento Financeiro</span>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
                Comparativo de Regras: Minha Casa Minha Vida vs SBPE
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MCMV Card */}
              <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 space-y-3">
                <span className="p-1 px-2.5 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase font-mono rounded">
                  Imóveis de Interesse Social (HIS)
                </span>
                <h4 className="text-sm font-black text-indigo-950 uppercase">Programa Minha Casa Minha Vida (MCMV)</h4>
                <p className="text-xs text-zinc-650 leading-relaxed font-sans">
                  Focado em famílias com renda bruta mensal de até <strong>R$ 8.000,00</strong>. Oferece o menor patamar histórico de taxa de juros (variando de 4.00% a 5.50% a.a.) e concede um subsídio habitacional do governo federal de até R$ 55.000,00 que diminui a quantia de entrada que você precisará dar.
                </p>
                <div className="text-[11px] text-zinc-500 font-mono space-y-1">
                  <div>🎯 Limite Imóvel SP: <strong>R$ 350.000,00</strong></div>
                  <div>🏦 Financiador: <strong>Caixa Econômica Federal</strong></div>
                </div>
              </div>

              {/* SBPE Card */}
              <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/20 space-y-3">
                <span className="p-1 px-2.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase font-mono rounded">
                  Médio, Alto Padrão e Luxo
                </span>
                <h4 className="text-sm font-black text-amber-950 uppercase">Financiamento Sistema SBPE (Poupança)</h4>
                <p className="text-xs text-zinc-650 leading-relaxed font-sans">
                  Focado em rendas familiares acima de <strong>R$ 8.000,00</strong>. Utiliza as taxas de poupança como indexador e serve para qualquer imóvel residencial sem teto de avaliação social. Oferece prazos de até 35 anos (420 parcelas decrescentes pela Tabela SAC) e aceita uso de FGTS acumulado.
                </p>
                <div className="text-[11px] text-zinc-500 font-mono space-y-1">
                  <div>🎯 Limite Imóvel SP: <strong>R$ 1.500.000,00 (SFH)</strong></div>
                  <div>🏦 Financiador: <strong>Caixa, Itaú, Bradesco, Santander</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic real estate listings from CRM stock */}
          <div id="estoque" className="space-y-6">
            <div className="border-l-4 border-emerald-600 pl-4">
              <span className="text-[10px] font-mono font-black uppercase text-emerald-650 font-black">Empreendimentos Ativos na Grande SP</span>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">
                Lançamentos Disponíveis Cury & cicloCRED
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.filter(p => p.status === 'disponivel').slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border-2 border-zinc-350 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div className="relative h-44 bg-zinc-200">
                    <img 
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600'} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-zinc-950 text-white border-2 border-white text-[9px] font-black font-mono uppercase tracking-wider rounded">
                      🏡 Cury Lançamento
                    </span>
                    <span className="absolute bottom-3 right-3 bg-indigo-600 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded shadow-md border-2 border-zinc-950">
                      {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black truncate uppercase text-zinc-900">{item.title}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase font-mono">{item.neighborhood}, {item.location}</p>
                      <p className="text-[10px] text-zinc-600 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 font-mono pt-2 border-t mt-2">
                      <div>📐 Área: <strong>{item.sizeSqm}m²</strong></div>
                      <div>🛏️ Quartos: <strong>{item.bedrooms} dorms</strong></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerSensoryFeedback('click', accSettings);
                        setSelectedPropertyForInbound(item);
                      }}
                      className="w-full mt-3 py-2 bg-indigo-600 hover:bg-neutral-900 text-white font-mono text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors border border-indigo-800"
                    >
                      Simular Entrada p/ Este Imóvel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public blog articles segment */}
          <div className="space-y-6">
            <div className="border-b pb-2 flex items-center justify-between">
              <h3 className="text-xs font-mono font-black uppercase text-zinc-500">📖 Artigos de Fomento Imobiliário</h3>
              <span className="text-[10px] text-indigo-600 font-extrabold cursor-pointer hover:underline uppercase font-mono">Ver todos os artigos →</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post.id} className="p-5 border border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-2 flex flex-col justify-between hover:border-zinc-400 transition-all">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono font-black uppercase text-indigo-600">
                      <span>{post.category}</span>
                      <span className="text-zinc-400">{post.readTime}</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-zinc-950 leading-tight uppercase font-sans">{post.title}</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{post.summary}</p>
                  </div>
                  <p className="text-[10px] text-zinc-600 line-clamp-3 leading-relaxed mt-2.5 font-medium italic select-none">
                    "{post.desc}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer branding of site */}
          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-400 font-mono gap-4">
            <span>© 2026 cicloCRED Inform. Lojas e correspondência bancária credenciada Caixa Econômica.</span>
            <span>Estúdio de Captação e Leads Integrado via API cicloCRED CRM</span>
          </div>

        </div>
      </div>

      {/* POPUP MODAL FOR SOLICITING SIMULATION ON A SPECIFIC PROPERTY CARD */}
      {selectedPropertyForInbound && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-zinc-950 rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-800 animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white p-4 flex items-center justify-between border-b-2 border-zinc-950">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                <span className="font-sans font-black uppercase text-xs tracking-wider">
                  Solicitar Simulação Caixa
                </span>
              </div>
              <button 
                onClick={() => setSelectedPropertyForInbound(null)}
                className="p-1 text-white hover:text-red-500 font-black text-xs font-mono"
              >
                FECHAR ✕
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span className="text-[8px] font-mono font-black text-indigo-600 uppercase block">Empreendimento</span>
                <strong className="block text-xs font-extrabold uppercase text-zinc-900">{selectedPropertyForInbound.title}</strong>
                <span className="text-[10px] text-zinc-500 font-mono block">Valor de Venda: {selectedPropertyForInbound.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>

              {submitted ? (
                <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-center space-y-2 animate-scaleIn">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-black uppercase text-emerald-950">Proposta de Simulação Enviada!</h4>
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-sans">
                    Os dados foram transmitidos diretamente para o painel de leads do seu correspondente cicloCRED.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInboundSubmit} className="space-y-3 text-xs">
                  <div className="space-y-0.5">
                    <label className="block text-[9px] font-black uppercase text-zinc-500">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={inboundName}
                      onChange={(e) => setInboundName(e.target.value)}
                      placeholder="Ex: Clara Mendes Pinheiro"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-[9px] font-black uppercase text-zinc-500">WhatsApp para Simulação / Retorno</label>
                    <input
                      type="text"
                      required
                      value={inboundPhone}
                      onChange={(e) => setInboundPhone(e.target.value)}
                      placeholder="Ex: (11) 98888-8888"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-black uppercase text-zinc-500">Renda Mensal (R$)</label>
                      <input
                        type="number"
                        min={1000}
                        required
                        value={inboundIncome}
                        onChange={(e) => setInboundIncome(Number(e.target.value) || 4500)}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[9px] font-black uppercase text-zinc-500">E-mail</label>
                      <input
                        type="email"
                        value={inboundEmail}
                        onChange={(e) => setInboundEmail(e.target.value)}
                        placeholder="clara@email.com"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] rounded-lg tracking-wider"
                  >
                    Simular Entrada e Parcelamento de Obras 🚀
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
