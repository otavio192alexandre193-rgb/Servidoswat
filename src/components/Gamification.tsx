import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  Workflow, 
  Award, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Zap, 
  AlertCircle, 
  TrendingUp, 
  Compass, 
  Lightbulb,
  Trash2,
  CalendarDays,
  RotateCcw,
  Edit2,
  Check,
  X,
  Users,
  Share2,
  Lock
} from 'lucide-react';
import { AccessibilitySettings, triggerSensoryFeedback } from '../utils/sensory';
import { Goal, Project } from '../types';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface GamificationProps {
  accSettings: AccessibilitySettings;
  userXP: number;
  setUserXP: React.Dispatch<React.SetStateAction<number>>;
  userLevel: number;
  setUserLevel: React.Dispatch<React.SetStateAction<number>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onResetGamification: () => void;
  onRequestConfirm: (title: string, desc: string, onConfirm: () => void, type?: 'danger' | 'warning') => void;
  // Live Leaderboard sync props
  userName?: string;
  userEmail?: string;
  dealsClosedCount?: number;
  actionsCount?: number;
}

export default function GamificationView({ 
  accSettings,
  userXP,
  setUserXP,
  userLevel,
  setUserLevel,
  goals,
  setGoals,
  projects,
  setProjects,
  onResetGamification,
  onRequestConfirm,
  userName = 'Operador CicloCred',
  userEmail = 'operador@ciclocred.com',
  dealsClosedCount = 0,
  actionsCount = 0
}: GamificationProps) {
  const xpNeededForNextLevel = 5000;

  // Real-time Cloud Leaderboard list of top teams
  const [onlineRankings, setOnlineRankings] = useState<any[]>([]);
  const [rankingSyncStatus, setRankingSyncStatus] = useState<'syncing' | 'synced' | 'failed'>('syncing');

  // Upsert current user and listen to other brokers' rankings
  useEffect(() => {
    let cleanEmail = userEmail || 'operador@ciclocred.com';
    let docId = `broker_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const forcedOffline = localStorage.getItem('ciclocred_force_local_offline') === 'true';
    const quotaExceededLogged = localStorage.getItem('firestore_quota_exceeded_status') === 'true';
    const isOfflineMode = forcedOffline || quotaExceededLogged || !!(window as any).isFirestoreQuotaExceeded;

    if (isOfflineMode) {
      setRankingSyncStatus('failed');
      setOnlineRankings([
        { id: 'offline-self', name: userName || 'Você (Modo Local)', email: cleanEmail, level: Number(userLevel || 1), xp: Number(userXP || 0), dealsClosed: Number(dealsClosedCount || 0), actionsCount: Number(actionsCount || 0), lastActive: new Date().toISOString() }
      ]);
      return;
    }

    const upsertStats = async () => {
      try {
        await setDoc(doc(db, 'brokerRankings', docId), {
          id: docId,
          name: userName || 'Operador',
          email: cleanEmail,
          level: Number(userLevel || 1),
          xp: Number(userXP || 0),
          dealsClosed: Number(dealsClosedCount || 0),
          actionsCount: Number(actionsCount || 0),
          lastActive: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Could not upsert stats to brokerRankings in database (rules may require signin):", err);
      }
    };

    upsertStats();

    // Listen to changes across all participants (up to 5 invited + 1 user)
    const unsub = onSnapshot(collection(db, 'brokerRankings'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const emailLower = (data.email || '').toLowerCase();
        if (
          emailLower === 'manoel@ciclocred.com' ||
          emailLower === 'ana@ciclocred.com' ||
          emailLower === 'ricardo@ciclocred.com' ||
          data.id?.includes('bot') ||
          data.id?.includes('offline-bot') ||
          data.name === 'Manoel das Neves' ||
          data.name === 'Ana Paula Souza' ||
          data.name === 'Ricardo Dias'
        ) {
          // Filter out / skip fictitious data completely from rankings
          return;
        }
        list.push(data);
      });
      // Sort by level descending, then xp descending
      list.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      });
      setOnlineRankings(list);
      setRankingSyncStatus('synced');
    }, (error) => {
      console.error("Error fetching online broker rankings:", error);
      setRankingSyncStatus('failed');
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errCode = (error as any)?.code || '';
      if (
        errCode === 'resource-exhausted' ||
        errorMsg.toLowerCase().includes('quota') || 
        errorMsg.toLowerCase().includes('exhausted') || 
        errorMsg.toLowerCase().includes('resource-exhausted')
      ) {
        localStorage.setItem('firestore_quota_exceeded_status', 'true');
        (window as any).isFirestoreQuotaExceeded = true;
        try {
          window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
        } catch (_) {}
      }
    });

    return () => unsub();
  }, [userXP, userLevel, userName, userEmail, dealsClosedCount, actionsCount]);

  // UNLOCKED TROPHIES & BADGES SYSTEM (Dynamic based on real progression!)
  const trophies = [
    { 
      title: 'Estrela Comercial ✨', 
      description: 'Complete uma das metas ativas do dia.', 
      unlocked: goals.some(g => g.completed), 
      color: goals.some(g => g.completed) ? 'text-amber-500 bg-amber-50' : 'text-zinc-400 bg-zinc-100' 
    },
    { 
      title: 'Desbravador Sideral 🌌', 
      description: 'Alcançou o Nível 2 ou superior.', 
      unlocked: userLevel >= 2, 
      color: userLevel >= 2 ? 'text-indigo-500 bg-indigo-50' : 'text-zinc-400 bg-zinc-100' 
    },
    { 
      title: 'Titã Imperial 🏆', 
      description: 'Completou um projeto de expansão com sucesso.', 
      unlocked: projects.some(p => p.progress >= 100), 
      color: projects.some(p => p.progress >= 100) ? 'text-purple-400 bg-purple-50' : 'text-zinc-400 bg-zinc-100' 
    },
    { 
      title: 'Mestre da Gravidade Sideral ⚡', 
      description: 'Acumulou mais de 2.000 XP no total.', 
      unlocked: userXP + (userLevel - 1) * xpNeededForNextLevel >= 2000, 
      color: (userXP + (userLevel - 1) * xpNeededForNextLevel >= 2000) ? 'text-cyan-500 bg-cyan-55' : 'text-zinc-400 bg-zinc-100' 
    }
  ];

  // GOAL CREATOR FORM STATE
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(3);
  const [newGoalCategory, setNewGoalCategory] = useState<'venda' | 'prospecção' | 'visita' | 'email'>('prospecção');
  const [newGoalFrequency, setNewGoalFrequency] = useState<'diaria' | 'semanal' | 'mensal'>('diaria');

  // GOAL EDITING STATES (Goal Gameficação Editável)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState(3);
  const [editGoalCurrent, setEditGoalCurrent] = useState(0);
  const [editGoalXp, setEditGoalXp] = useState(250);
  const [editGoalCategory, setEditGoalCategory] = useState<'venda' | 'prospecção' | 'visita' | 'email'>('prospecção');
  const [editGoalFrequency, setEditGoalFrequency] = useState<'diaria' | 'semanal' | 'mensal'>('diaria');

  // NEW PROJECT CREATOR STATE
  const [isAddProjOpen, setIsAddProjOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjGoalId, setNewProjGoalId] = useState('');

  // PROJECT EDITING STATES (Projetos de Expansão Editável)
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjProgress, setEditProjProgress] = useState(0);
  const [editProjXp, setEditProjXp] = useState(1000);
  const [editProjGoalId, setEditProjGoalId] = useState('');

  // USER GALAXY RANGS COMPUTATION
  const computeGalaxyRank = (level: number) => {
    if (level < 2) return 'Sonda Orbital Júnior';
    if (level < 4) return 'Corretor Estelar Sideral';
    if (level < 6) return 'Agente Gravitacional de Alta Energia';
    return 'Imperador Cósmico da Galáxia Lineack';
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const created: Goal = {
      id: `goal-custom-${Date.now()}`,
      title: newGoalTitle,
      targetCount: newGoalTarget,
      currentCount: 0,
      xpReward: newGoalTarget * 75,
      frequency: newGoalFrequency,
      category: newGoalCategory,
      completed: false
    };

    setGoals(prev => [created, ...prev]);
    setIsAddGoalOpen(false);
    setNewGoalTitle('');
    triggerSensoryFeedback('success', accSettings);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const created: Project = {
      id: `proj-custom-${Date.now()}`,
      name: newProjName,
      description: newProjDesc,
      status: 'ativo',
      progress: 0,
      xpReward: 1000,
      assignedToGoalId: newProjGoalId || undefined
    };

    setProjects(prev => [created, ...prev]);
    setIsAddProjOpen(false);
    setNewProjName('');
    setNewProjDesc('');
    triggerSensoryFeedback('success', accSettings);
  };

  const incrementGoalProgress = (id: string) => {
    setGoals(prev => 
      prev.map(g => {
        if (g.id !== id) return g;
        const nextCount = g.currentCount + 1;
        const reached = nextCount >= g.targetCount;
        
        if (reached && !g.completed) {
          // Trigger special success sound & visual flash
          setTimeout(() => {
            triggerSensoryFeedback('chime', accSettings);
            setUserXP(current => {
              const total = current + g.xpReward;
              if (total >= xpNeededForNextLevel) {
                const levelsGained = Math.floor(total / xpNeededForNextLevel);
                setUserLevel(lvl => lvl + levelsGained);
                return total % xpNeededForNextLevel;
              }
              return total;
            });
          }, 100);
        } else {
          // Normal click sound
          triggerSensoryFeedback('click', accSettings);
        }

        return {
          ...g,
          currentCount: nextCount > g.targetCount ? g.targetCount : nextCount,
          completed: reached
        };
      })
    );
  };

  // Safe confirm delete handlers
  const deleteGoal = (id: string, name: string) => {
    onRequestConfirm(
      'Excluir Meta Desejada?',
      `Tem certeza que deseja apagar a meta "${name}"? Todo o progresso acumulado nela será perdido no CRM.`,
      () => {
        setGoals(prev => prev.filter(g => g.id !== id));
        triggerSensoryFeedback('warning', accSettings);
      },
      'danger'
    );
  };

  const deleteProject = (id: string, name: string) => {
    onRequestConfirm(
      'Remover Projeto de Expansão?',
      `Deseja realmente excluir permanentemente o projeto de expansão "${name}" das suas metas?`,
      () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        triggerSensoryFeedback('warning', accSettings);
      },
      'danger'
    );
  };

  // Actions for goal editing
  const handleStartEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditGoalTitle(goal.title);
    setEditGoalTarget(goal.targetCount);
    setEditGoalCurrent(goal.currentCount);
    setEditGoalXp(goal.xpReward);
    setEditGoalCategory(goal.category);
    setEditGoalFrequency(goal.frequency);
    triggerSensoryFeedback('click', accSettings);
  };

  const handleSaveGoal = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const completed = editGoalCurrent >= editGoalTarget;
      return {
        ...g,
        title: editGoalTitle,
        targetCount: editGoalTarget,
        currentCount: editGoalCurrent,
        xpReward: editGoalXp,
        category: editGoalCategory,
        frequency: editGoalFrequency,
        completed
      };
    }));
    setEditingGoalId(null);
    triggerSensoryFeedback('success', accSettings);
  };

  // Actions for project editing
  const handleStartEditProject = (proj: Project) => {
    setEditingProjId(proj.id);
    setEditProjName(proj.name);
    setEditProjDesc(proj.description);
    setEditProjProgress(proj.progress);
    setEditProjXp(proj.xpReward);
    setEditProjGoalId(proj.assignedToGoalId || '');
    triggerSensoryFeedback('click', accSettings);
  };

  const handleSaveProject = (id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        name: editProjName,
        description: editProjDesc,
        progress: editProjProgress,
        xpReward: editProjXp,
        status: editProjProgress >= 100 ? 'concluido' : 'ativo',
        assignedToGoalId: editProjGoalId || undefined
      };
    }));
    setEditingProjId(null);
    triggerSensoryFeedback('success', accSettings);
  };

  // AUTOMATED ACTIVITY TRACKING RECOMMENDATIONS (Dadas pelas Metas de Venda)
  const getGoalRecommendations = () => {
    const recommendations: string[] = [];
    
    // Check if goal for loading leads exists and is not complete
    const leadsGoal = goals.find(g => g.category === 'prospecção' && !g.completed);
    if (leadsGoal) {
      recommendations.push("Sua meta de prospecção está ativa! Acesse a Grade de Planilhas em 'Estoque Imobiliário' ou 'Clientes Leads', arraste seu arquivo .csv de novos leads para preencher o funil de forma automática.");
    }

    // Check if visits goal is completed
    const visitsGoal = goals.find(g => g.category === 'visita' && g.completed);
    if (visitsGoal) {
      recommendations.push("Excelente! Meta de visitas imobiliárias atingida na semana. RECOMENDAÇÃO: Aplique o Script de Fechamento de Proposta & Urgência nas conversas ativas para forçar a conversão de imediato.");
    } else {
      recommendations.push("Agendamentos estagnados? Utilize o Calendário Vivo Inteligente na aba 'Agendamentos' selecionando os dias azuis vagos para entrar em contato tático com os contatos pendentes.");
    }

    // Checking email automations goal
    const emailsGoal = goals.find(g => g.category === 'email' && !g.completed);
    if (emailsGoal) {
      recommendations.push(`Automação em progresso: Próxima atividade recomendada: Disparar modelo de e-mail de 'Follow-up' de taxa cicloCRED Empresas.`);
    }

    return recommendations;
  };

  return (
    <div className="space-y-6">
      
      {/* XP PROGRESS HEADER CARD */}
      <div className="bg-zinc-950 text-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] relative overflow-hidden">
        {/* Galaxy background lines decor */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-indigo-950/55 to-zinc-950/90 pointer-events-none" />
        <div className="absolute right-12 top-0 h-full w-1/3 border-l-4 border-dashed border-purple-500/20 pointer-events-none transform skew-x-12" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono font-black text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800 tracking-wider">
              Patente Espacial: {computeGalaxyRank(userLevel)}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <Trophy className="w-8 h-8 text-amber-400 animate-pulse shrink-0" />
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-white font-mono">Quartel de Gamificação & Metas</h2>
                <p className="text-xs text-zinc-400 font-sans">Cada ação realizada no CRM fornece experiência (XP). Suba de nível e lidere as automações do cicloCRED!</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-72 space-y-2">
            <div className="flex justify-between items-end text-xs font-mono font-black">
              <span>NÍVEL {userLevel}</span>
              <span className="text-purple-300 font-bold">{userXP} / {xpNeededForNextLevel} XP</span>
            </div>
            <div className="w-full h-4 bg-zinc-900 border-2 border-zinc-950 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0px_0px_10px_2px_rgba(129,140,248,0.5)] transition-all duration-700"
                style={{ width: `${(userXP / xpNeededForNextLevel) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-zinc-400 text-right font-mono font-bold">Ganhe mais {xpNeededForNextLevel - userXP} XP para avançar para a próxima galáxia</p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onResetGamification}
                className="flex items-center gap-1 text-[9px] font-mono font-black text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded transition uppercase"
                title="Zerar toda a evolução de gamificação para modo inicial"
              >
                <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                <span>Zerar Progresso (Atividades Reais)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GALAXY NÍVEL INTEGRITY BANNER */}
      <div className="bg-gradient-to-br from-indigo-950 via-zinc-950 to-purple-950 border-4 border-zinc-950 p-5 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-white select-none relative overflow-hidden">
        <div className="absolute right-4 top-2 text-6xl text-indigo-500/10 font-black font-mono">GALAXY</div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-sm font-black font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
              Nível Galaxy: Operações 100% Reais
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              <strong>A máquina só tem tração se o humano operar!</strong> Simulações fictícias e automações de segundo plano foram completamente desativadas e purgadas do seu quartel. Cada XP e nível adquirido é originado diretamente das suas tarefas e ações operacionais no CRM cicloCRED.
            </p>
          </div>
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 shrink-0 font-sans">
            <div className="text-[10px] space-y-1">
              <span className="font-mono text-indigo-300 font-black uppercase text-[9px] block">Tabela de Atividades Reais (XP):</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-bold font-mono text-zinc-400 text-[9px]">
                <span className="text-emerald-400">📅 Agendar Visita: +100 XP</span>
                <span className="text-indigo-400">✅ Realizar Visita: +200 XP</span>
                <span className="text-purple-400">📞 Registrar Follow-Up: +80 XP</span>
                <span className="text-amber-400">💰 Feachar Venda: +500 XP</span>
                <span className="text-cyan-400">🤖 Coproduzir com IA: +50 XP</span>
                <span className="text-pink-400">🏠 Cadastrar Imóvel: +30 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME LEADERSHIP SCOREBOARD: COMPARTILHAR COM MAIS 5 COLEGAS */}
      <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] text-left space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-zinc-200">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase font-mono text-zinc-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Ranking ao Vivo: Arena de Corretores</span>
            </h3>
            <p className="text-xs text-zinc-550 font-medium">
              Sua equipe conectada em tempo real via Firestore Cloud. Ações e resultados geram pontuações instantâneas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-600">Nuvem Ativa</span>
            </div>

            <button
              id="ranking-copy-link-btn"
              onClick={() => {
                triggerSensoryFeedback('success', accSettings);
                navigator.clipboard.writeText(window.location.href);
                alert("Link do aplicativo copiado para área de transferência! Compartilhe com +5 pessoas e insira e-mails separados nas configurações para ver todos pontuando juntos!");
              }}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 font-mono text-[9px] font-black px-3 py-1.5 rounded-xl uppercase transition cursor-pointer select-none"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Convidar Time (+5)</span>
            </button>
          </div>
        </div>

        {/* Board table listing brokers updates live */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono select-text">
          {onlineRankings.length === 0 ? (
            /* Sync Loading or Offline display state fallback */
            <div className="col-span-full py-8 text-center text-zinc-400 font-bold border-2 border-dashed border-zinc-250 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs uppercase tracking-wider">Lendo Conexões de Corretores...</span>
            </div>
          ) : (
            /* Loop ranked items */
            onlineRankings.slice(0, 6).map((broker, bIdx) => {
              const isCurrentUser = broker.email === userEmail;
              const placeColor = 
                bIdx === 0 ? 'bg-yellow-400 text-zinc-950 border-yellow-500' :
                bIdx === 1 ? 'bg-zinc-300 text-zinc-900 border-zinc-400' :
                bIdx === 2 ? 'bg-amber-600 text-white border-amber-700' :
                'bg-zinc-100 text-zinc-650 border-zinc-250';

              return (
                <div 
                  key={broker.id || bIdx}
                  className={`border-2 border-zinc-950 p-4 rounded-2.5xl relative shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition ${
                    isCurrentUser ? 'bg-indigo-50/45 border-indigo-600 ring-2 ring-indigo-300' : 'bg-zinc-50'
                  }`}
                >
                  {/* Absolute place Badge top right */}
                  <div className={`absolute right-3.5 top-3 w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-inner ${placeColor}`}>
                    {bIdx + 1}º
                  </div>

                  <div className="space-y-3.5 text-left">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-1 truncate font-sans">
                        <span className="text-xs font-black uppercase text-zinc-900 truncate" title={broker.name}>{broker.name}</span>
                        {isCurrentUser && (
                          <span className="bg-indigo-650 text-white text-[7.5px] px-1 rounded-md shrink-0 font-mono font-extrabold font-black uppercase">VOCÊ</span>
                        )}
                      </div>
                      <span className="text-[9px] text-zinc-405 block truncate max-w-full font-mono">{broker.email}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t pt-2.5 border-dashed border-zinc-200">
                      <div>
                        <span className="text-[8px] font-black uppercase text-zinc-450 block">PROGRESÇÃO</span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-zinc-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">Lvl {broker.level}</span>
                          <span className="text-[10px] font-bold text-zinc-700">{broker.xp} XP</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase text-zinc-450 block">CONVERSÃO</span>
                        <div className="flex flex-wrap items-center gap-1 text-[9px] font-bold text-zinc-650">
                          <span className="text-emerald-600">💰 {broker.dealsClosed || 0}</span>
                          <span className="text-zinc-400">|</span>
                          <span className="text-indigo-600">📞 {broker.actionsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1 & 2: DYNAMIC GOALS & PROJECTS ENGINE */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION: METAS ATIVAS */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-950 font-mono tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <span>Configuração e Ajuste de Metas</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium font-sans">Lançamento, edição de alvos, XP atribuídos e acompanhamento das atividades em tempo real.</p>
              </div>

              <button
                onClick={() => setIsAddGoalOpen(!isAddGoalOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-90 w-auto text-[10px] uppercase font-mono font-black text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Meta</span>
              </button>
            </div>

            {/* Collapse add form */}
            {isAddGoalOpen && (
              <form onSubmit={handleCreateGoal} className="p-4 bg-zinc-50 border-2 border-zinc-950 rounded-2xl space-y-3 animate-scaleIn text-xs">
                <span className="text-[9px] font-mono font-black text-indigo-700 uppercase">Preencha os Parâmetros da Meta</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1">Título do Objetivo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Entrar em contato com 4 leads frios"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2.5 font-bold text-zinc-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1">Frequência</label>
                    <select
                      value={newGoalFrequency}
                      onChange={(e) => setNewGoalFrequency(e.target.value as any)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2.5 font-bold text-zinc-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="diaria">Diária</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1">Meta Acumulada (Contagem)</label>
                    <input 
                      type="number" 
                      min={1}
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2.5 font-bold text-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1">Categoria de Gatilho</label>
                    <select
                      value={newGoalCategory}
                      onChange={(e) => setNewGoalCategory(e.target.value as any)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2.5 font-bold text-zinc-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="prospecção">Prospecção (Novos Leads)</option>
                      <option value="visita">Visita Comercial (Imobiliário)</option>
                      <option value="email">Modelos de E-mail (Mensageria)</option>
                      <option value="venda">Vendas (Contrato Assinado)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGoalOpen(false)}
                    className="px-3 py-1.5 border border-zinc-400 rounded-lg hover:bg-zinc-100 font-bold uppercase text-[10px]"
                  >
                    Abortar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-zinc-950 font-black uppercase text-[10px]"
                  >
                    Ativar Meta Cósmica
                  </button>
                </div>
              </form>
            )}

            {/* List goals in nice block with direct sensory triggers and EDITABLE panels */}
            <div className="space-y-3">
              {goals.map(goal => (
                <div 
                  key={goal.id}
                  className={`border-2 rounded-2xl p-4 transition-all relative ${
                    editingGoalId === goal.id ? 'border-primary ring-2 ring-indigo-400 bg-zinc-50/50' :
                    goal.completed ? 'bg-emerald-50/30 border-emerald-400' : 'bg-zinc-50 border-zinc-950'
                  }`}
                >
                  {editingGoalId === goal.id ? (
                    /* EDITING FORM FOR THE GOAL */
                    <div className="space-y-3.5 text-xs animate-scaleIn">
                      <span className="text-[10px] font-mono font-black text-indigo-700 uppercase flex items-center gap-1">
                        ✏️ EDITANDO PARÂMETROS DA META
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        <div>
                          <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase mb-0.5">Título da Meta</label>
                          <input
                            type="text"
                            value={editGoalTitle}
                            onChange={(e) => setEditGoalTitle(e.target.value)}
                            className="w-full p-2 bg-white border border-zinc-300 rounded font-bold text-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase mb-0.5">Categoria</label>
                          <select
                            value={editGoalCategory}
                            onChange={(e) => setEditGoalCategory(e.target.value as any)}
                            className="w-full p-2 bg-white border border-zinc-300 rounded font-bold text-zinc-900"
                          >
                            <option value="prospecção">Prospecção</option>
                            <option value="visita">Visita Comercial</option>
                            <option value="email">Modelos de E-mail</option>
                            <option value="venda">Vendas</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase mb-0.5">Frequência</label>
                          <select
                            value={editGoalFrequency}
                            onChange={(e) => setEditGoalFrequency(e.target.value as any)}
                            className="w-full p-2 bg-white border border-zinc-300 rounded font-bold text-zinc-900"
                          >
                            <option value="diaria">Diária</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensal">Mensal</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase mb-0.5">Atual</label>
                            <input
                              type="number"
                              min={0}
                              value={editGoalCurrent}
                              onChange={(e) => setEditGoalCurrent(Number(e.target.value))}
                              className="w-full p-2 bg-white border border-zinc-300 font-mono rounded font-black text-zinc-950 text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase mb-0.5">Alvo</label>
                            <input
                              type="number"
                              min={1}
                              value={editGoalTarget}
                              onChange={(e) => setEditGoalTarget(Number(e.target.value))}
                              className="w-full p-2 bg-white border border-zinc-300 font-mono rounded font-black text-zinc-950 text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase mb-0.5">XP Ref.</label>
                            <input
                              type="number"
                              min={10}
                              value={editGoalXp}
                              onChange={(e) => setEditGoalXp(Number(e.target.value))}
                              className="w-full p-2 bg-white border border-zinc-300 font-mono rounded font-black text-indigo-700 text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-dashed">
                        <button
                          type="button"
                          onClick={() => setEditingGoalId(null)}
                          className="px-3 py-1.5 border border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-[9px] font-mono font-black uppercase flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> CANCELAR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveGoal(goal.id)}
                          className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded-lg text-[9px] font-mono font-black uppercase flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_rgba(99,102,241,1)]"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> SALVAR META
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL VIEW OF THE GOAL */
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                            goal.completed ? 'bg-emerald-100/80 border-emerald-300 text-emerald-800' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          }`}>
                            {goal.frequency} · {goal.category}
                          </span>
                          <span className="text-[8.5px] font-mono text-indigo-600 font-extrabold block">
                            (+{goal.xpReward} XP)
                          </span>
                          {goal.completed && (
                            <span className="font-mono text-[8px] font-black text-emerald-700 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
                              ✓ BATIDA!
                            </span>
                          )}
                        </div>

                        <h4 className={`text-xs font-black uppercase font-mono ${goal.completed ? 'text-zinc-500 line-through' : 'text-zinc-950'}`}>
                          {goal.title}
                        </h4>

                        {/* Simple bar progress indicator */}
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-1.5 bg-zinc-250 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${goal.completed ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                              style={{ width: `${Math.min((goal.currentCount / goal.targetCount) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-black text-zinc-500">
                            {goal.currentCount} de {goal.targetCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          disabled={goal.completed}
                          onClick={() => incrementGoalProgress(goal.id)}
                          className={`text-[9px] font-mono font-black uppercase tracking-wider p-2 rounded-xl transition-all border flex items-center gap-1 ${
                            goal.completed 
                              ? 'bg-emerald-100 text-emerald-700 border-transparent cursor-not-allowed' 
                              : 'bg-white hover:bg-zinc-100 border-zinc-950 text-indigo-700 hover:translate-y-[-1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          }`}
                        >
                          <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{goal.completed ? '+XP Coletado' : `Registrar Progresso`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditGoal(goal)}
                          className="p-2 bg-white hover:bg-indigo-50 border border-zinc-950 text-indigo-700 rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:text-indigo-900 transition"
                          title="Editar Parâmetros da Meta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id, goal.title)}
                          className="p-2 bg-white hover:bg-rose-50 border border-zinc-950 text-rose-600 rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:text-rose-800 transition"
                          title="Excluir Meta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: PROJETOS DE EXPANSÃO */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-950 font-mono tracking-tight flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-indigo-600" />
                  <span>Projetos e Campanhas Corporativas</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium font-sans">Campanhas ativas da imobiliária e monitoramento de performance editável.</p>
              </div>

              <button
                onClick={() => setIsAddProjOpen(!isAddProjOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-90 w-auto text-[10px] uppercase font-mono font-black text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Projeto</span>
              </button>
            </div>

            {/* Project Creator Collapse */}
            {isAddProjOpen && (
              <form onSubmit={handleCreateProject} className="p-4 bg-zinc-50 border-2 border-zinc-950 rounded-2xl space-y-3 animate-scaleIn text-xs">
                <span className="text-[10px] font-mono font-black text-indigo-700 uppercase">Preencha os Campos do Projeto</span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1 font-black">Nome da Campanha</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Aquisição de Chácaras no Interior de SP"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2 font-bold text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1 font-black">Memorial do Escopo</label>
                    <textarea 
                      placeholder="Ex: Tratar leads focados em consórcios rurais e estoque de chácaras."
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2 font-bold text-zinc-900"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-black text-zinc-700 mb-1 font-black">Filiar a uma Meta Ativa (Opcional)</label>
                    <select
                      value={newProjGoalId}
                      onChange={(e) => setNewProjGoalId(e.target.value)}
                      className="w-full bg-white border border-zinc-350 rounded-lg p-2 font-bold text-zinc-900 focus:outline-none"
                    >
                      <option value="">Nenhuma</option>
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProjOpen(false)}
                    className="px-3 py-1.5 border border-zinc-400 rounded-lg hover:bg-zinc-100 font-bold uppercase text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-zinc-950 font-black uppercase text-[10px]"
                  >
                    Lançar Projeto Ativo
                  </button>
                </div>
              </form>
            )}

            {/* List projets with custom EDITABLE layouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(proj => (
                <div 
                  key={proj.id} 
                  className={`p-4 border-2 border-zinc-950 rounded-3xl flex flex-col justify-between space-y-3 relative group transition ${
                    editingProjId === proj.id ? 'ring-2 ring-indigo-500 bg-white' : 'bg-zinc-50/50'
                  }`}
                >
                  {editingProjId === proj.id ? (
                    /* PROJECT EDITING FORM */
                    <div className="space-y-3.5 text-xs animate-scaleIn w-full">
                      <span className="text-[9px] font-mono font-black text-indigo-700 uppercase">
                        ✏️ EDITANDO PROJETO
                      </span>
                      <div className="space-y-2 pt-1 font-sans">
                        <div>
                          <label className="block text-[9px] font-mono font-black text-zinc-550 uppercase">Nome do Projeto</label>
                          <input
                            type="text"
                            value={editProjName}
                            onChange={(e) => setEditProjName(e.target.value)}
                            className="w-full p-2 bg-white border rounded font-semibold text-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-black text-zinc-550 uppercase">Memorial do Escopo</label>
                          <textarea
                            value={editProjDesc}
                            onChange={(e) => setEditProjDesc(e.target.value)}
                            rows={2}
                            className="w-full p-2 bg-white border rounded font-semibold text-zinc-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono font-black text-zinc-550 uppercase">Progresso (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editProjProgress}
                              onChange={(e) => setEditProjProgress(Number(e.target.value))}
                              className="w-full p-2 bg-white border rounded font-semibold text-zinc-900 font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-black text-zinc-550 uppercase">XP Atribuído</label>
                            <input
                              type="number"
                              min={100}
                              value={editProjXp}
                              onChange={(e) => setEditProjXp(Number(e.target.value))}
                              className="w-full p-2 bg-white border rounded font-semibold text-zinc-900 font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-dashed">
                        <button
                          type="button"
                          onClick={() => setEditingProjId(null)}
                          className="px-2 py-1 border border-zinc-400 bg-white text-zinc-500 rounded hover:bg-zinc-50 text-[9px] font-mono uppercase"
                        >
                          Abortar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveProject(proj.id)}
                          className="px-3 py-1 bg-zinc-950 text-white rounded text-[9px] font-mono uppercase font-black"
                        >
                          Salvar Projeto
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PROJECT NORMAL VIEW */
                    <>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-mono font-black uppercase bg-violet-100 text-violet-800 px-2 py-0.5 rounded border border-violet-200">
                            ESTOQUE EXPANDIDO (+{proj.xpReward} XP)
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEditProject(proj)}
                              className="text-zinc-550 hover:text-indigo-700 transition"
                              title="Editar Projeto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteProject(proj.id, proj.name)}
                              className="text-zinc-400 hover:text-rose-600 transition"
                              title="Remover Projeto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-black uppercase font-mono text-zinc-950 leading-tight">
                          {proj.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-medium font-sans leading-tight">
                          {proj.description}
                        </p>
                      </div>

                      {/* Progressive indicator */}
                      <div className="space-y-1.5 border-t pt-2.5">
                        <div className="flex justify-between items-center text-[9px] font-mono font-black text-zinc-550 row">
                          <span>Progresso da Operação</span>
                          <span>{proj.progress}%</span>
                        </div>

                        <div className="w-full h-2.5 bg-zinc-200 border border-zinc-300 rounded-full overflow-hidden p-[1px]">
                          <div 
                            className={`h-full rounded-full ${proj.progress > 50 ? 'bg-indigo-600' : 'bg-amber-500'}`}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            triggerSensoryFeedback('complete', accSettings);
                            setProjects(prev => prev.map(p => {
                              if (p.id !== proj.id) return p;
                              const nextProg = p.progress + 15;
                              const isDone = nextProg >= 100;
                              if (isDone) {
                                // Give XP for completing project
                                setUserXP(cx => {
                                  const extra = cx + p.xpReward;
                                  if (extra >= xpNeededForNextLevel) {
                                    setUserLevel(cl => cl + 1);
                                  }
                                  return extra;
                                });
                              }
                              return {
                                ...p,
                                progress: nextProg > 100 ? 100 : nextProg,
                                status: isDone ? 'concluido' : p.status
                              };
                            }));
                          }}
                          disabled={proj.progress >= 100}
                          className="w-full py-1.5 bg-white border border-zinc-950 hover:bg-zinc-50 rounded-xl text-[9px] font-mono font-black uppercase text-zinc-900 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 transition"
                        >
                          {proj.progress >= 100 ? '✓ CAMPANHA CONCLUÍDA' : 'Avançar Campanha (+15%)'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* COL 3: AUTOMATED RECOMMENDATIONS TICKER DRIVEN BY ACTIVE GOALS */}
        <div className="space-y-6">
          
          {/* ASSISTANT RECOMMENDATIONS */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">Deduções de Metas</h3>
            </div>

            <p className="text-[11px] text-zinc-500 leading-tight">Suas metas de vendas ativas criam orientações automáticas inteligentes para acelerar o CRM.</p>

            <div className="space-y-3.5">
              {getGoalRecommendations().map((rec, rIdx) => (
                <div key={rIdx} className="p-3 bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-[10.5px] font-inter font-medium text-amber-950 flex gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                  <p className="leading-tight">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BADGES & TROPHIES DASHBOARD */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] space-y-4">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">Títulos Adquiridos</h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {trophies.map((tr, tid) => (
                <div key={tid} className={`p-3 border rounded-2xl flex items-center gap-3 transition ${tr.unlocked ? 'border-zinc-950 bg-zinc-50/40' : 'border-dashed border-zinc-300 opacity-60 bg-white'}`}>
                  <div className={`w-9 h-9 rounded-xl border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 ${tr.color}`}>
                    <Trophy className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase font-mono text-zinc-950 flex items-center gap-1.5">
                      <span>{tr.title}</span>
                      {tr.unlocked ? (
                        <span className="text-[7px] font-black bg-emerald-100 text-emerald-800 px-1 rounded">✓ LIBERADO</span>
                      ) : (
                        <span className="text-[7px] font-black bg-zinc-100 text-zinc-500 px-1 rounded">PENDENTE</span>
                      )}
                    </h5>
                    <p className="text-[8.5px] text-zinc-500 leading-tight block mt-0.5 font-sans font-bold">{tr.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
