/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lead, Appointment, EmailLog, Goal } from '../types';
import { 
  BarChart, 
  DollarSign, 
  TrendingUp, 
  PieChart as PieIcon, 
  Activity,
  Layers,
  Calendar,
  Mail,
  Target,
  Award,
  Clock,
  Briefcase,
  AlertCircle,
  Percent,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ReportsProps {
  leads: Lead[];
  appointments?: Appointment[];
  emailLogs?: EmailLog[];
  goals?: Goal[];
}

type ReportSubModule = 'geral_canais' | 'atividades' | 'rendimentos' | 'objetivos';

export default function Reports({ 
  leads, 
  appointments = [], 
  emailLogs = [], 
  goals = [] 
}: ReportsProps) {
  const [activeSubModule, setActiveSubModule] = useState<ReportSubModule>('geral_canais');
  
  // Custom commission factor simulation state (defaults to 1.5% commission rate)
  const [commissionRate, setCommissionRate] = useState<number>(1.5);

  // Aggregate Metrics
  const totalLeads = leads.length;
  const totalPipelineValue = leads.reduce((sum, l) => sum + l.value, 0);
  const closedLeads = leads.filter(l => l.status === 'fechado');
  const closedCount = closedLeads.length;
  const closedValue = closedLeads.reduce((sum, l) => sum + l.value, 0);
  
  const activeLeadsCount = leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length;
  const lostLeadsCount = leads.filter(l => l.status === 'perdido').length;

  const conversionRate = totalLeads > 0 
    ? Math.round((closedCount / totalLeads) * 100) 
    : 0;

  const averageDealValue = totalLeads > 0 
    ? Math.round(totalPipelineValue / totalLeads) 
    : 0;

  // Status Distribution
  const statusCounts = {
    novo: leads.filter(l => l.status === 'novo').length,
    em_contato: leads.filter(l => l.status === 'em_contato').length,
    proposta: leads.filter(l => l.status === 'proposta').length,
    fechado: leads.filter(l => l.status === 'fechado').length,
    perdido: leads.filter(l => l.status === 'perdido').length,
  };

  // Origin / Lead source distribution
  const origins = Array.from(new Set(leads.map(l => l.origin)));
  const originData = origins.map(orig => {
    const origLeads = leads.filter(l => l.origin === orig);
    const valueSum = origLeads.reduce((sum, l) => sum + l.value, 0);
    return {
      name: orig,
      count: origLeads.length,
      value: valueSum,
      percentage: totalLeads > 0 ? Math.round((origLeads.length / totalLeads) * 100) : 0
    };
  }).sort((a, b) => b.count - a.count);

  // SVG Concentric Ring computations for Status Pie-Alternative Chart
  const ringRadius = 50;
  const ringCircumference = 2 * Math.PI * ringRadius;
  
  const statusColors: Record<string, string> = {
    novo: '#3b82f6',       // Blue
    em_contato: '#f59e0b', // Amber
    proposta: '#6366f1',   // Indigo
    fechado: '#10b981',    // Emerald
    perdido: '#ef4444',    // Red
  };
  
  const statusLabels: Record<string, string> = {
    novo: 'Novo Lead',
    em_contato: 'Em Contato',
    proposta: 'Proposta Enviada',
    fechado: 'Negócio Fechado',
    perdido: 'Negócio Perdido',
  };

  // RENDER DYNAMIC FUTURISTIC SPEEDOMETER GAUGE (PREMIUM HUD QUALITY)
  const renderSpeedometer = (percentage: number, label: string, color: string = '#6366f1') => {
    const cleanPct = Math.min(Math.max(percentage, 0), 100);
    const rotation = -90 + (cleanPct * 1.8); // map 0-100 to -90 to +90 degrees for rotation
    const uniqueId = `neon-glow-${label.replace(/[^a-zA-Z]/g, '')}`;

    return (
      <div className="flex flex-col items-center justify-center p-5 bg-zinc-950 text-white border-4 border-zinc-950 rounded-3xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[4px_4px_0px_0px_rgba(99,102,241,1)] hover:translate-y-[-2px] transition-all relative overflow-hidden h-48 w-full select-none">
        {/* Subtle holographic grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:10px_10px] opacity-10 pointer-events-none" />
        <div className="absolute -right-3 -top-3 w-10 h-10 border border-indigo-500/10 rounded-full" />
        
        {/* Top Label */}
        <div className="w-full flex justify-between items-center text-[9px] font-mono tracking-wider text-zinc-400 uppercase px-1 mb-2 z-10">
          <span>{label}</span>
        </div>

        <div className="relative w-36 h-20 overflow-hidden z-10">
          <svg className="w-full h-full" viewBox="0 0 100 50">
            <defs>
              {/* Outer Glow filter */}
              <filter id={uniqueId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor={color} />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Scale indicator ticks */}
            <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="1 3" />

            {/* Gauge Arc background */}
            <path
              d="M 15 50 A 35 35 0 0 1 85 50"
              fill="none"
              stroke="#18181b"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Active Gowing arc path */}
            <path
              d="M 15 50 A 35 35 0 0 1 85 50"
              fill="none"
              stroke={`url(#grad-${uniqueId})`}
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeDasharray="110"
              strokeDashoffset={110 - (110 * cleanPct / 100)}
              filter={`url(#${uniqueId})`}
              className="transition-all duration-1000 ease-out"
            />

            {/* 3 central guide dots */}
            <circle cx="50" cy="50" r="33" fill="none" stroke="#27272a" strokeWidth="0.5" strokeDasharray="5 3" />

            {/* Digital Tick Indicators */}
            <circle cx="15" cy="50" r="1" fill="#ef4444" /> {/* Min */}
            <circle cx="50" cy="15" r="1.2" fill="#6366f1" className="animate-pulse" /> {/* Mid */}
            <circle cx="85" cy="50" r="1" fill="#10b981" /> {/* Max */}
          </svg>

          {/* Glowing HUD Needle */}
          <div 
            className="absolute bottom-0 left-1/2 w-[2px] h-15 bg-gradient-to-t from-zinc-500 to-indigo-400 origin-bottom transition-transform duration-1000 ease-out"
            style={{ 
              transform: `translate(-50%, 0) rotate(${rotation}deg)`,
              boxShadow: '0 0 8px 1px rgba(129, 140, 248, 0.4)'
            }}
          >
            {/* Elegant needle crown */}
            <div className="w-1.5 h-1.5 bg-white rounded-full absolute -top-1 left-1/2 -translate-x-1/2 border border-zinc-950" />
            
            {/* Axis Center bolt */}
            <div className="w-4 h-4 bg-zinc-900 rounded-full border-2 border-indigo-500/80 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Big cyberpunk Digital values display */}
        <div className="mt-2 text-center z-10 space-y-0.5">
          <div className="text-xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-100 to-emerald-300">
            {cleanPct}%
          </div>
          <div className="text-[7.5px] font-mono font-black text-indigo-400 uppercase tracking-widest">
            {cleanPct >= 80 ? '🚩 EXCELÊNCIA ADQUIRIDA' : cleanPct >= 50 ? '⚡ RENDIMENTO NOMINAL' : '🌀 EM OTIMIZAÇÃO'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Sub-modules Selector Belt */}
      <div className="flex flex-wrap border-4 border-zinc-950 bg-white p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none">
        <button
          onClick={() => setActiveSubModule('geral_canais')}
          className={`flex-1 min-w-[140px] py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${
            activeSubModule === 'geral_canais' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          📊 Geral & Canais
        </button>
        <button
          onClick={() => setActiveSubModule('atividades')}
          className={`flex-1 min-w-[140px] py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${
            activeSubModule === 'atividades' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          ⏱ Registro de Atividades
        </button>
        <button
          onClick={() => setActiveSubModule('rendimentos')}
          className={`flex-1 min-w-[140px] py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${
            activeSubModule === 'rendimentos' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          💰 Rendimentos & ROI
        </button>
        <button
          onClick={() => setActiveSubModule('objetivos')}
          className={`flex-1 min-w-[140px] py-3 text-xs font-black uppercase tracking-wider font-mono rounded-xl transition ${
            activeSubModule === 'objetivos' 
              ? 'bg-indigo-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
              : 'text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          🎯 Objetivos & Metas
        </button>
      </div>

      {/* RENDER ACTIVE REPORT SUB-MODULE */}

      {/* SUB-MODULE A: GERAL & CANAIS */}
      {activeSubModule === 'geral_canais' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Level CRM Statistics Dashboard Headers */}
          <div id="reports-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI: Total Pipeline */}
            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Carteira Total</span>
                <h3 className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
                  {totalPipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[10px] text-zinc-500 font-semibold font-mono">▲ Potencial financeiro geral</p>
              </div>
              <div className="p-2.5 bg-zinc-100 border-2 border-zinc-950 rounded-xl">
                <DollarSign className="w-5 h-5 text-zinc-950" />
              </div>
            </div>

            {/* KPI: Receita Fechada */}
            <div className="bg-zinc-900 text-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-indigo-400 uppercase font-mono">★ Valor Fechado</span>
                <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                  {closedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold font-mono">Mensal recorrente e adesão</p>
              </div>
              <div className="p-2.5 bg-zinc-800 border-2 border-zinc-950 rounded-xl">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            {/* KPI: Ticket Médio */}
            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Ticket Médio</span>
                <h3 className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
                  {averageDealValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[10px] text-zinc-500 font-semibold font-mono">Média por lead captado</p>
              </div>
              <div className="p-2.5 bg-blue-50 border-2 border-zinc-950 rounded-xl">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* KPI: Conversão Geral */}
            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Taxa de Conversão</span>
                <h3 className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
                  {conversionRate}%
                </h3>
                <p className="text-[10px] text-zinc-500 font-semibold font-mono">Aproveitamento comercial</p>
              </div>
              <div className="p-2.5 bg-rose-50 border-2 border-zinc-950 rounded-xl">
                <BarChart className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FUNNEL STAGES CONVERSION CHART (7 Cols) */}
            <div className="lg:col-span-7 bg-white border-4 border-zinc-950 rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
              <div>
                <h3 className="text-md font-black text-zinc-950 uppercase italic tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Conversão de Etapas do Funil
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Taxa de evasão e transição de leads entre estágios atuais.</p>
              </div>

              <div id="funnel-visualization-container" className="space-y-4 pt-4">
                {Object.entries(statusCounts).map(([statusKey, count], idx) => {
                  const maxCount = Math.max(...Object.values(statusCounts), 1);
                  const colInfo = statusColors[statusKey];
                  const label = statusLabels[statusKey];
                  const pctOfMax = Math.round((count / maxCount) * 100);

                  return (
                    <div key={statusKey} className="space-y-1.5" id={`report-funnel-${statusKey}`}>
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                        <span className="font-extrabold">{label}</span>
                        <span className="font-mono text-zinc-500">
                          {count} lead{count !== 1 ? 's' : ''} ({totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden border-2 border-zinc-950">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.max(pctOfMax, 3)}%`, 
                            backgroundColor: colInfo,
                            borderRightWidth: count > 0 ? '2px' : '0px',
                            borderRightColor: '#09090b',
                            opacity: 1 - (idx * 0.08)
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATUS PIE ALTERNATIVE (5 Cols) */}
            <div className="lg:col-span-5 bg-white border-4 border-zinc-950 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
              <div>
                <h3 className="text-md font-black text-zinc-950 uppercase italic tracking-tight flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-indigo-600" />
                  Proporção Volumétrica do Pipeline
                </h3>
                <p className="text-xs text-zinc-500 font-medium font-sans">Visualização de participação percentual por status de negócio.</p>
              </div>

              {/* SVG Pie Chart Alternative using segmented concentric rings */}
              <div id="status-distribution-ring" className="flex items-center justify-center p-2">
                <svg width="150" height="150" viewBox="0 0 120 120" className="transform -rotate-90">
                  <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="#f4f4f5" strokeWidth="8" />
                  {(() => {
                    let accumulatedPercent = 0;
                    return Object.entries(statusCounts).map(([statusKey, count]) => {
                      if (totalLeads === 0) return null;
                      const ratio = count / totalLeads;
                      const strokeDasharray = `${ratio * ringCircumference} ${ringCircumference}`;
                      const strokeDashoffset = -accumulatedPercent * ringCircumference;
                      accumulatedPercent += ratio;

                      return (
                        <circle
                          key={statusKey}
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          fill="none"
                          stroke={statusColors[statusKey]}
                          strokeWidth="9"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Legend Table */}
              <div id="status-pie-legend" className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-100">
                {Object.entries(statusCounts).map(([statusKey, count]) => (
                  <div key={statusKey} className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-zinc-950" 
                      style={{ backgroundColor: statusColors[statusKey] }}
                    ></span>
                    <span className="text-zinc-500 font-medium">{statusLabels[statusKey]}:</span>
                    <span className="font-extrabold text-zinc-900 font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MARKETING LEADS CHANNELS ANALYSIS */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl space-y-4 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
            <div>
              <h3 className="text-md font-black text-zinc-950 uppercase italic tracking-tight flex items-center gap-2">
                <BarChart className="w-5 h-5 text-indigo-600" />
                Desempenho por Canais de Marketing (Aquisição)
              </h3>
              <p className="text-xs text-zinc-500 font-medium">Análise de origens em termos de quantidade de captação de contatos e volume financeiro associado.</p>
            </div>

            <div id="marketing-origins-metric-table-scroll" className="overflow-x-auto">
              <table className="w-full text-box text-zinc-800">
                <thead>
                  <tr className="border-b-4 border-zinc-950 bg-zinc-950 text-white text-xs text-left">
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-zinc-300">Canal / Origem</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-zinc-300 text-center">Quantidade Leads</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-zinc-300 text-center">Participação</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-zinc-300 text-right">Potencial Financeiro</th>
                    <th className="py-3 px-4 font-black uppercase tracking-widest text-zinc-300 text-right">Média por Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-100 text-xs bg-white">
                  {originData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400 font-mono font-bold uppercase">Nenhum canal captado comercialmente.</td>
                    </tr>
                  ) : (
                    originData.map((orig) => {
                      const media = Math.round(orig.value / orig.count);
                      return (
                        <tr key={orig.name} className="hover:bg-zinc-50 text-zinc-800">
                          <td className="py-3 px-4 font-black text-zinc-900 text-sm">{orig.name}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-sm">{orig.count}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono font-black text-zinc-700 w-8 text-right">{orig.percentage}%</span>
                              <div className="w-20 bg-zinc-100 border-2 border-zinc-950 h-3.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${orig.percentage}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-indigo-600 font-extrabold text-sm">
                            {orig.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-zinc-600 font-bold">
                            {media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE B: REGISTRO DE ATIVIDADES */}
      {activeSubModule === 'atividades' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Activity Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Disparos de E-mail logs</span>
                <h3 className="text-3xl font-black text-zinc-950 font-mono">{emailLogs.length}</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">📧 Disparados com Sucesso</p>
              </div>
              <div className="p-2.5 bg-indigo-50 border-2 border-zinc-950 rounded-xl">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Agendamentos Totais</span>
                <h3 className="text-3xl font-black text-zinc-950 font-mono">{appointments.length}</h3>
                <p className="text-[10px] text-indigo-600 font-bold uppercase">📅 Reuniões & Visitas</p>
              </div>
              <div className="p-2.5 bg-blue-50 border-2 border-zinc-950 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Reuniões Realizadas</span>
                <h3 className="text-3xl font-black text-zinc-950 font-mono">
                  {appointments.filter(a => a.status === 'realizado').length}
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">✓ Concluídas com Sucesso</p>
              </div>
              <div className="p-2.5 bg-emerald-50 border-2 border-zinc-950 rounded-xl">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Email Logs Feed */}
            <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="text-sm font-black uppercase text-zinc-950 italic flex items-center gap-1.5 border-b pb-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Logs de Comunicação por E-mail</span>
              </h3>
              
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {emailLogs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 font-mono text-xs uppercase font-extrabold border-2 border-dashed border-zinc-200 rounded-xl">
                    Nenhum disparo registrado ainda.
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div key={log.id} className="p-3 border-2 border-zinc-950 bg-zinc-50 rounded-xl space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-mono font-black text-zinc-500">
                        <span className="bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-800">ENVIADO</span>
                        <span>{new Date(log.sentAt).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <div className="text-xs font-extrabold text-zinc-900">
                        Destinatário: <span className="text-indigo-600">{log.leadName}</span>
                      </div>
                      <p className="text-[11px] font-black text-zinc-500 font-mono uppercase bg-white p-1 px-2 rounded border border-zinc-300">
                        Assunto: {log.subject}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Visits / Meetings Log Feed */}
            <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="text-sm font-black uppercase text-zinc-950 italic flex items-center gap-1.5 border-b pb-3">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Atividades de Agenda & Reuniões</span>
              </h3>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 font-mono text-xs uppercase font-extrabold border-2 border-dashed border-zinc-200 rounded-xl">
                    Nenhum compromisso agendado.
                  </div>
                ) : (
                  appointments.map((ap) => (
                    <div 
                      key={ap.id} 
                      className={`p-3 border-2 border-zinc-950 rounded-xl space-y-2 ${
                        ap.status === 'realizado' ? 'bg-emerald-50/40 border-emerald-900' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono font-black">
                        <span className={`px-1.5 py-0.5 rounded border ${
                          ap.status === 'realizado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {ap.status.toUpperCase()}
                        </span>
                        <span className="text-zinc-500">{new Date(ap.date).toLocaleDateString('pt-BR')} às {ap.time}</span>
                      </div>
                      <div className="text-xs font-black text-zinc-900">
                        Commitment: {ap.title}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold block">
                        Cliente: <span className="text-zinc-900 font-black">{ap.leadName}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE C: RENDIMENTOS & ROI */}
      {activeSubModule === 'rendimentos' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Revenue Top Headers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1 font-mono">
                <span className="text-[10px] tracking-wider uppercase font-black text-zinc-500 block">Comissão Esperada Estimada</span>
                <h3 className="text-2xl font-black text-indigo-600">
                  {((closedValue * commissionRate) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase">Com base em R$ {closedValue.toLocaleString('pt-BR')} fechados</p>
              </div>
              <div className="p-2.5 bg-indigo-50 border-2 border-zinc-950 rounded-xl flex items-center justify-center">
                <Percent className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="bg-zinc-900 text-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1 font-mono">
                <span className="text-[10px] tracking-wider uppercase font-black text-zinc-400 block">Projeção Máxima (100% Conversão)</span>
                <h3 className="text-2xl font-black text-emerald-400">
                  {((totalPipelineValue * commissionRate) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase">Sobre total do funil comercial</p>
              </div>
              <div className="p-2.5 bg-zinc-800 border-2 border-zinc-950 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="bg-white border-4 border-zinc-950 p-5 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-500 uppercase font-mono">Eficiência Conversão ROI</span>
                <h3 className="text-3xl font-black text-zinc-950 font-mono">{(closedValue > 0 && totalPipelineValue > 0) ? Math.round((closedValue / totalPipelineValue) * 100) : 0}%</h3>
                <p className="text-[10px] text-indigo-600 font-bold uppercase">Proporção financeira fechada</p>
              </div>
              <div className="p-2.5 bg-rose-50 border-2 border-zinc-950 rounded-xl">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Interactive Commission Rate Slider Slider */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-sm font-black uppercase text-zinc-950 italic">
                💰 Simulador de Ganhos por Comissão cicloCRED
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Arraste o indicador abaixo para recalcular as projeções de rendimentos comerciais de acordo com as taxas de agenciamento de crédito praticados.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>Taxa Praticada:</span>
                  <span className="bg-indigo-100 text-indigo-950 border border-indigo-200 px-2 py-0.5 rounded font-black">
                    {commissionRate.toFixed(1)}% de Comissão
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5.0" 
                  step="0.1" 
                  value={commissionRate} 
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value))} 
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-100 border-2 border-zinc-950 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold font-mono">
                  <span>Mínimo: 0.5%</span>
                  <span>Meio Imobiliário: ~2.0%</span>
                  <span>Máximo: 5.0%</span>
                </div>
              </div>
            </div>

            {/* Simulated Values Summary Card */}
            <div className="md:col-span-5 bg-zinc-50 border-4 border-zinc-950 p-4.5 rounded-2xl space-y-3">
              <span className="text-[9px] uppercase font-mono font-black text-zinc-500">RESUMO DA NEGOCIAÇÃO</span>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500 font-bold pb-1 border-b">
                  <span>Total Contratos Fechados:</span>
                  <span className="text-zinc-950 font-black">{closedCount} contratos</span>
                </div>
                <div className="flex justify-between text-zinc-500 font-bold pb-1 border-b">
                  <span>Valor Líquido Total:</span>
                  <span className="text-zinc-950 font-black font-mono">R$ {closedValue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span className="text-indigo-950 font-black">Sua Comissão Líquida:</span>
                  <span className="text-indigo-600 font-black font-mono">
                    R$ {((closedValue * commissionRate) / 100).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE D: OBJETIVOS & DESEMPENHO */}
      {activeSubModule === 'objetivos' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stunning Speedometers row showing overall gamification completion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Speedometer 1: Goals completion rate */}
            {(() => {
              const totalGoals = goals.length;
              const completedCount = goals.filter(g => g.completed).length;
              const goalsPct = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;
              return renderSpeedometer(goalsPct, 'Objetivos Concluídos 🎯', '#6366f1');
            })()}

            {/* Speedometer 2: Funnel closing yield */}
            {(() => {
              const closedCount = leads.filter(l => l.status === 'fechado').length;
              const totalLeads = leads.length;
              const closingPct = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;
              return renderSpeedometer(closingPct, 'Taxa de Fechamento Geral 🏆', '#10b981');
            })()}

            {/* Speedometer 3: Conversion efficiency projection */}
            {(() => {
              const proposalCount = leads.filter(l => l.status === 'proposta').length;
              const closedCount = leads.filter(l => l.status === 'fechado').length;
              const conversionPct = proposalCount > 0 ? Math.round((closedCount / proposalCount) * 100) : 0;
              return renderSpeedometer(conversionPct, 'Aproveitamento Proposta -> Fecho', '#e11d48');
            })()}
          </div>

          {/* Gamification Objective Metas Tracking Deck */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-950 italic flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Seus Objetivos Ativos e Rendimentos Comerciais</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Persiga metas específicas do cicloCRED para elevar seu multiplicador XP e faturar mais.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-zinc-900 text-white font-black uppercase px-2 py-1 rounded">
                XP TOTAL ACUMULADO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.length === 0 ? (
                <div className="md:col-span-2 text-center py-12 text-zinc-400 font-mono text-xs uppercase font-extrabold border-2 border-dashed border-zinc-200 rounded-xl">
                  Nenhuma meta estabelecida. Vá à aba de Gamificação para calibrar novos objetivos!
                </div>
              ) : (
                goals.map((g) => {
                  const progressPct = Math.min(Math.round((g.currentCount / g.targetCount) * 100), 100);
                  return (
                    <div key={g.id} className="p-4 border-2 border-zinc-950 bg-zinc-50 rounded-2xl space-y-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase font-mono font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {g.frequency} • {g.category}
                          </span>
                          <h4 className="text-xs font-black text-zinc-900 mt-1 uppercase font-semibold leading-tight">{g.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-100 px-2.0 py-0.5 rounded border border-indigo-200">
                          +{g.xpReward} XP
                        </span>
                      </div>

                      {/* Progress bar info */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 font-mono">
                          <span>Progresso atual: {g.currentCount} de {g.targetCount}</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-3 bg-zinc-200 rounded-full overflow-hidden border border-zinc-950">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
