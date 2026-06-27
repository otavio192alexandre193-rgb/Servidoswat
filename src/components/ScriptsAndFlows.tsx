import React, { useState, useEffect } from "react";
import { Play, Save, FileText, Bot, Search, PlusCircle, Edit2, Trash, Copy, Check } from "lucide-react";
import { getKanbanColumns } from "../utils/kanban";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import FluxoManager from "./FluxoManager";

interface ScriptsAndFlowsProps {
  leads: any[];
  globalFilteredLeads?: any[];
  globalSearchTerm?: string;
  onUpdateLeadField: (leadId: string, fields: any) => void;
  accSettings?: any;
  triggerSensoryFeedback?: (type: string, settings: any) => void;
  addNotification?: (title: string, msg: string, type: string) => void;
  initialSearchTerm?: string;
  onChangeSearchTerm?: (val: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onDeleteMultipleLeads?: (ids: string[]) => void;
  operationalFlows?: any[];
  setOperationalFlows?: any;
}

export default function ScriptsAndFlows({
  leads,
  globalFilteredLeads,
  globalSearchTerm,
  onUpdateLeadField,
  accSettings,
  triggerSensoryFeedback,
  addNotification,
  initialSearchTerm = "",
  onChangeSearchTerm,
  onDeleteLead,
  onDeleteMultipleLeads,
  operationalFlows = [],
  setOperationalFlows
}: ScriptsAndFlowsProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'library' | 'fluxos'>('leads');

  useEffect(() => {
    const handleNext = () => {
      setActiveSubTab((prev) => (prev === 'leads' ? 'library' : 'leads'));
    };
    const handlePrev = () => {
      setActiveSubTab((prev) => (prev === 'library' ? 'leads' : 'library'));
    };

    window.addEventListener("ciclocred_global_next_visibility", handleNext);
    window.addEventListener("ciclocred_global_prev_visibility", handlePrev);

    return () => {
      window.removeEventListener("ciclocred_global_next_visibility", handleNext);
      window.removeEventListener("ciclocred_global_prev_visibility", handlePrev);
    };
  }, []);

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (onChangeSearchTerm) {
      onChangeSearchTerm(val);
    }
  };

  // Local state to hold the "live" script for each lead (if they edit it)
  const [editableScripts, setEditableScripts] = useState<Record<string, string>>({});
  const [generatingIds, setGeneratingIds] = useState<Record<string, boolean>>({});

  // Batch actions / Bulk state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const handleBatchGenerateWithGemini = async () => {
    if (selectedLeadIds.length === 0) return;
    setIsBatchGenerating(true);
    setBatchProgress(0);

    if (addNotification) {
      addNotification("Processando Lote", `Iniciando geração de roteiros com Gemini para ${selectedLeadIds.length} contatos.`, "info");
    }

    let successCount = 0;
    for (let i = 0; i < selectedLeadIds.length; i++) {
      const leadId = selectedLeadIds[i];
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) {
        setBatchProgress(i + 1);
        continue;
      }

      setGeneratingIds(prev => ({ ...prev, [leadId]: true }));
      try {
        const systemPrompt = `Você é o redator publicitário de alto impacto do cicloCRED CRM integrado de forma direta com o Gemini.
Sua missão é gerar um script de atendimento pelo WhatsApp personalizado, empático e focado em conversão para este lead:
- Nome do Lead: ${lead.name}
- Renda Familiar Mensal: R$ ${lead.familyIncome ? Number(lead.familyIncome).toLocaleString('pt-BR') : 'Não informada'}
- Perfil Principal: ${lead.mainProfile || 'Atendimento Geral'}
- Objeção Cadastrada: ${lead.objection || 'Nenhuma objeção cadastrada'}
- Etapa de Negócio: ${lead.stage || 'Início'}
- Programa Desejado: ${lead.programaDesejado || 'Indiferente'}

Diretrizes de resposta:
1. Comece com uma abordagem amigável, chamando-o pelo primeiro nome de forma de tratamento natural do WhatsApp.
2. Aborde pontos que resolvam a Objeção informada de forma de contorno profissional e direto.
3. Insira uma pergunta direta ou convite estimulante no final para engajamento.
4. Mande APENAS o script final sem introduções de IA.`;

        const response = await fetch("/api/server/test-ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "Gere o roteiro de vendas definitivo WhatsApp.",
            custom_prompt: systemPrompt,
            model_name: "gemini-3.5-flash",
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.reply || "Erro na geração.";
          setEditableScripts(prev => ({
            ...prev,
            [leadId]: replyText
          }));
          successCount++;
        }
      } catch (err) {
        console.error(`Erro na geração do lead ${leadId}:`, err);
      } finally {
        setGeneratingIds(prev => ({ ...prev, [leadId]: false }));
        setBatchProgress(i + 1);
      }
    }

    setIsBatchGenerating(false);
    if (triggerSensoryFeedback) triggerSensoryFeedback("success", accSettings);
    if (addNotification) {
      addNotification(
        "Lote Concluído",
        `Gerados scripts com Inteligência Artificial para ${successCount} de ${selectedLeadIds.length} leads selecionados.`,
        "success"
      );
    }
  };

  const handleBatchApplyTemplate = (templateText: string) => {
    if (!templateText) return;
    const updated = { ...editableScripts };
    selectedLeadIds.forEach(leadId => {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        const first = lead.name.split(" ")[0];
        updated[leadId] = templateText.replace(/\[Nome do Lead\]/gi, first);
      }
    });
    setEditableScripts(updated);
    if (addNotification) {
      addNotification("Sucesso", `Modelo aplicado em lote a ${selectedLeadIds.length} roteiros selecionados!`, "success");
    }
    if (triggerSensoryFeedback) triggerSensoryFeedback("click", accSettings);
  };

  const handleBatchSaveToCRM = () => {
    if (selectedLeadIds.length === 0) return;
    let savedCount = 0;
    selectedLeadIds.forEach(leadId => {
      const draftText = editableScripts[leadId];
      if (draftText !== undefined) {
        onUpdateLeadField(leadId, { currentScript: draftText });
        savedCount++;
      }
    });

    if (addNotification) {
      addNotification("Lote Salvo 💾", `${savedCount} roteiros foram consolidados e salvos nas fichas dos leads com sucesso!`, "success");
    }
    if (triggerSensoryFeedback) triggerSensoryFeedback("success", accSettings);
    setSelectedLeadIds([]);
  };

  const handleBatchCopyTexts = () => {
    if (selectedLeadIds.length === 0) return;
    const segments = selectedLeadIds.map(leadId => {
      const lead = leads.find(l => l.id === leadId);
      const text = editableScripts[leadId] || (lead ? lead.currentScript : "") || "";
      return `----------------------------------------\nLEAD: ${lead ? lead.name : leadId}\nTELEFONE: ${lead ? lead.phone || "" : ""}\nROTEIRO:\n${text}`;
    });
    const clipboardContent = segments.join("\n\n");
    navigator.clipboard.writeText(clipboardContent);
    if (addNotification) {
      addNotification("Copiado em lote! 📋", `${selectedLeadIds.length} mensagens formatadas foram copiadas para a área de transferência!`, "success");
    }
    if (triggerSensoryFeedback) triggerSensoryFeedback("click", accSettings);
  };

  const handleBatchDeleteScripts = () => {
    if (selectedLeadIds.length === 0) return;
    const confirmDelete = window.confirm(`Tem certeza de que deseja apagar o roteiro atual de ${selectedLeadIds.length} lead(s) selecionado(s)?`);
    if (!confirmDelete) return;

    const updated = { ...editableScripts };
    selectedLeadIds.forEach(leadId => {
      updated[leadId] = "";
      onUpdateLeadField(leadId, { currentScript: "" });
    });
    setEditableScripts(updated);

    if (addNotification) {
      addNotification("Roteiros Apagados 🗑️", `Os roteiros contextuais de ${selectedLeadIds.length} contatos foram limpos com sucesso.`, "warning");
    }
    if (triggerSensoryFeedback) triggerSensoryFeedback("warning", accSettings);
    setSelectedLeadIds([]);
  };

  const handleBatchDeleteLeads = () => {
    if (selectedLeadIds.length === 0) return;
    if (onDeleteMultipleLeads) {
      onDeleteMultipleLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    } else {
      const confirmDelete = window.confirm(`Deseja remover permanentemente os ${selectedLeadIds.length} leads selecionados do CRM?`);
      if (confirmDelete) {
        selectedLeadIds.forEach(id => {
          onUpdateLeadField(id, { deleted: true });
        });
        if (addNotification) addNotification("Exclusão concluída", "Leads removidos.", "warning");
        setSelectedLeadIds([]);
      }
    }
  };

  const handleGenerateWithGemini = async (lead: any) => {
    setGeneratingIds(prev => ({ ...prev, [lead.id]: true }));
    try {
      const systemPrompt = `Você é o redator publicitário de alto impacto do cicloCRED CRM integrado de forma direta com o Gemini.
Sua missão é gerar um script de atendimento pelo WhatsApp personalizado, empático e focado em conversão para este lead:
- Nome do Lead: ${lead.name}
- Renda Familiar Mensal: R$ ${lead.familyIncome ? Number(lead.familyIncome).toLocaleString('pt-BR') : 'Não informada'}
- Perfil Principal: ${lead.mainProfile || 'Atendimento Geral'}
- Objeção Cadastrada: ${lead.objection || 'Nenhuma objeção cadastrada'}
- Etapa de Negócio: ${lead.stage || 'Início'}
- Programa Desejado: ${lead.programaDesejado || 'Indiferente'}

Diretrizes de resposta:
1. Comece com uma abordagem amigável, chamando-o pelo primeiro nome de forma de tratamento natural do WhatsApp.
2. Aborde pontos que resolvam a Objeção informada de forma madura (ex: se for Sem Entrada, sugira o parcelamento da entrada ou FGTS; se for Juros Altos, sugira portabilidade ou taxas do fomento Caixa Eco.).
3. Insira uma pergunta direta ou CTA amador no final para manter a conversa fluindo ("Podemos fazer uma simulação rápida de crédito para você hoje?").
4. Mantenha o texto limpo, convidativo e de tamanho ideal para envio pelo WhatsApp. Mande APENAS o script final formatado, sem introduções de IA.`;

      const response = await fetch("/api/server/test-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Gere o roteiro de vendas definitivo WhatsApp para este lead.",
          custom_prompt: systemPrompt,
          model_name: "gemini-3.5-flash",
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Erro de rede ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || "Não foi possível conectar de forma autônoma.";

      setEditableScripts(prev => ({
        ...prev,
        [lead.id]: replyText
      }));

      if (addNotification) addNotification("Sucesso", "Roteiro personalizado gerado pelo Gemini!", "success");
      if (triggerSensoryFeedback) triggerSensoryFeedback("success", accSettings);
    } catch (err: any) {
      console.error("Erro ao gerar roteiro via Gemini:", err);
      if (addNotification) addNotification("Falha", "Não conseguimos contato com o Gemini. Verifique a API.", "error");
    } finally {
      setGeneratingIds(prev => ({ ...prev, [lead.id]: false }));
    }
  };

  // Copywriting scripts library state
  const [copywritingScripts, setCopywritingScripts] = useState<{ id: string; title: string; category: string; text: string; trigger_keywords?: string; }[]>(() => {
    const saved = localStorage.getItem('ciclocred_copywriting_scripts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'script-1',
        title: 'Abordagem Inicial Habitacional',
        category: 'WhatsApp',
        text: 'Olá [Nome do Lead], identifiquei seu cadastro para simulação de crédito imobiliário. Podemos conversar para analisar sua margem de entrada e subsídios hoje?',
        trigger_keywords: 'oi, ola, simular, subsidio'
      },
      {
        id: 'script-2',
        title: 'Contorno de Objeção (Sem Entrada)',
        category: 'WhatsApp',
        text: 'Entendo perfeitamente sua preocupação com o valor de entrada, [Nome do Lead]. No entanto, sabias que conseguimos parcelar as condições pela construtora e usar o seu FGTS de forma facilitada? Desejas ver uma simulação rápida?',
        trigger_keywords: 'entrada, sem entrada, sem dinheiro'
      }
    ];
  });

  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editingScriptForm, setEditingScriptForm] = useState({ title: '', category: '', text: '', trigger_keywords: '' });
  const [isAddingScript, setIsAddingScript] = useState(false);
  const [addScriptForm, setAddScriptForm] = useState({ title: '', category: '', text: '', trigger_keywords: '' });

  // Load from Firestore
  useEffect(() => {
    const fetchFirestoreScripts = async () => {
      try {
        if (!db) return;
        const snap = await getDocs(collection(db, "copywriting_scripts"));
        const fetched: any[] = [];
        snap.forEach(docSnap => {
          fetched.push(docSnap.data());
        });
        if (fetched.length > 0) {
          setCopywritingScripts(fetched);
          localStorage.setItem('ciclocred_copywriting_scripts', JSON.stringify(fetched));
        }
      } catch (err) {
        console.warn("Falha ao recuperar scripts do Firestore em ScriptsAndFlows:", err);
      }
    };
    fetchFirestoreScripts();
  }, []);

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('ciclocred_copywriting_scripts', JSON.stringify(copywritingScripts));
  }, [copywritingScripts]);

  const handleStartEditScript = (script: any) => {
    setEditingScriptId(script.id);
    setEditingScriptForm({ 
      title: script.title, 
      category: script.category, 
      text: script.text,
      trigger_keywords: script.trigger_keywords || '' 
    });
    setIsAddingScript(false);
  };

  const handleSaveEditScript = async () => {
    if (!editingScriptForm.title.trim() || !editingScriptForm.text.trim()) return;
    const updatedForm = { ...editingScriptForm };
    setCopywritingScripts(prev => prev.map(s => s.id === editingScriptId ? { ...s, ...updatedForm } : s));

    if (db && editingScriptId) {
      try {
        await setDoc(doc(db, "copywriting_scripts", editingScriptId), {
          id: editingScriptId,
          ...updatedForm
        });
        if (addNotification) addNotification("Sucesso", "Script atualizado com sucesso no Firestore!", "success");
      } catch (err) {
        console.error("Erro ao salvar script editado no Firestore:", err);
      }
    }
    setEditingScriptId(null);
  };

  const handleDeleteScript = async (id: string) => {
    if (confirm("Deseja realmente excluir este script?")) {
      setCopywritingScripts(prev => prev.filter(s => s.id !== id));
      if (db) {
        try {
          await deleteDoc(doc(db, "copywriting_scripts", id));
          if (addNotification) addNotification("Sucesso", "Script removido do Firestore!", "success");
        } catch (err) {
          console.error("Erro ao apagar script do Firestore:", err);
        }
      }
    }
  };

  const handleCreateScript = async () => {
    if (!addScriptForm.title.trim() || !addScriptForm.text.trim()) return;
    const newId = `script-${Date.now()}`;
    const newScript = {
      id: newId,
      title: addScriptForm.title,
      category: addScriptForm.category || 'Atendimento Geral',
      text: addScriptForm.text,
      trigger_keywords: addScriptForm.trigger_keywords || ''
    };

    setCopywritingScripts(prev => [...prev, newScript]);
    if (db) {
      try {
        await setDoc(doc(db, "copywriting_scripts", newId), newScript);
        if (addNotification) addNotification("Sucesso", "Script salvo com sucesso!", "success");
      } catch (err) {
        console.error("Erro ao criar script no Firestore:", err);
      }
    }
    setIsAddingScript(false);
    setAddScriptForm({ title: '', category: '', text: '', trigger_keywords: '' });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 3000);
    if (addNotification) addNotification("Copiado!", "Texto copiado para a área de transferência.", "success");
  };

  // Generate generic script string
  const autoGenerateScript = (lead: any) => {
    const stage = (lead.stage || 'novo').toLowerCase();
    let script = `Olá ${lead.name.split(" ")[0]}, tudo bem? Aqui é do nosso time de especialistas imobiliários. `;

    if (stage === 'novo') {
        script += `Recebemos seu contato e identificamos seu interesse na região. `;
    } else if (stage === 'em_atendimento' || stage === 'agendado_visita') {
        script += `Estou passando para fazer o seu acompanhamento. Separamos excelentes oportunidades baseadas no seu perfil e região de interesse. `;
    } else if (stage === 'simulacao') {
        script += `Gostaria de lhe entregar a simulação de financiamento do seu Cury. Os valores e parcelas ficaram muito interessantes, já tem os documentos em mãos? `;
    } else if (stage === 'visita') {
        script += `Ainda tem interesse em prosseguir com o imóvel que agendamos a visita ou prefere que eu lhe envie outras opções? `;
    } else if (stage === 'proposta' || stage === 'analise_credito') {
        script += `Passando para dar andamento na análise do seu processo de financiamento que discutimos. Podemos avançar com o comitê em minutos! `;
    }

    if (lead.mainProfile === "Investidor") {
      script += `Notei que como investidor, posso apresentar um fluxo de alta rentabilidade que garantimos via repasse. `;
    } else if (lead.mainProfile === "Primeiro Imóvel" || lead.mainProfile === "MCMV") {
      script += `E o melhor: vi que está buscando seu primeiro imóvel. Podemos aprovar seu crédito usando os altos subsídios e facilidades do novo Minha Casa Minha Vida! `;
    } else {
      script += `Queremos apresentar as melhores oportunidades da Pauta! `;
    }

    if (lead.objection === "Muito caro") {
       script += `E mesmo que julgue ser apertado agora, conseguimos diluir tudo na construtora. `;
    } else if (lead.objection === "Sem entrada") {
       script += `E mesmo que você tenha pouca ou NENHUMA entrada imediata, desenhamos o parcelamento e o uso do seu FGTS, ou parcelamento em até 36x direto de forma ZERO para você começar. `;
    }
    
    script += `\n\nPodemos fazer um cálculo ágil pelo WhatsApp?`;
    return script;
  };

  useEffect(() => {
    // Populate the default generated scripts if non-existent
    const newDrafts = { ...editableScripts };
    let changed = false;
    leads.forEach((l) => {
      if (!newDrafts[l.id]) {
        newDrafts[l.id] = autoGenerateScript(l);
        changed = true;
      }
    });
    if (changed) {
      setEditableScripts(newDrafts);
    }
  }, [leads]);

  const handleApplyScript = (leadId: string) => {
    const text = editableScripts[leadId];
    if (!text) return;
    const l = leads.find((x) => x.id === leadId);
    if (l) {
      const newNotes = (l.notes ? l.notes + "\n\n" : "") + "[SCRIPT IA APLICADO]: " + text;
      onUpdateLeadField(leadId, { notes: newNotes });
      if (triggerSensoryFeedback) triggerSensoryFeedback("success", accSettings);
      if (addNotification) addNotification("Sucesso", "Script aplicado à ficha do lead!", "success");
    }
  };

  const getColLabel = (colType: string, val: string) => {
    const cols = getKanbanColumns(colType);
    return cols.find(c => c.id === val)?.label || val || "N/A";
  };

  const filteredLeads = (globalFilteredLeads && (globalSearchTerm || globalFilteredLeads.length !== leads.length) ? globalFilteredLeads : leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido' && l.status !== 'arquivado')).filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectTemplateForLead = (leadId: string, leadName: string, templateText: string) => {
    const formattedText = templateText.replace(/\[Nome do Lead\]/gi, leadName.split(" ")[0]);
    setEditableScripts(prev => ({
      ...prev,
      [leadId]: formattedText
    }));
    if (addNotification) addNotification("Carregado!", "Modelo carregado para o lead.", "info");
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="bg-zinc-900 border-4 border-zinc-950 p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 w-10 h-10 bg-indigo-500 border-2 border-zinc-950 text-white flex items-center justify-center rounded-xl shadow-[2px_2px_0px_0px_white]">
            <Bot size={20} className="font-black" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-white font-mono">IA Preditiva & Roteiros</h2>
            <p className="text-[10px] text-zinc-400 font-bold">Gerencie toda a comunicação, scripts e biblioteca de copywriting de atendimento</p>
          </div>
        </div>

        {/* Dynamic sub tab selector */}
        <div className="flex bg-zinc-850 p-1 border-2 border-zinc-700 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black transition ${
              activeSubTab === 'leads' 
                ? 'bg-indigo-600 text-white border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            📋 Roteiros De Leads
          </button>
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black transition ${
              activeSubTab === 'library' 
                ? 'bg-indigo-600 text-white border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            📚 Biblioteca Copywriting
          </button>
          <button
            onClick={() => setActiveSubTab('fluxos')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black transition ${
              activeSubTab === 'fluxos' 
                ? 'bg-indigo-600 text-white border border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            ⚙️ Fluxos Operacionais
          </button>
        </div>
      </div>

      {activeSubTab === 'leads' ? (
        <>
          {/* SEARCH FOR LEADS */}
          <div className="flex items-center justify-between gap-4 mt-2 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar lead para roteirização..."
                className="w-full bg-white border-2 border-zinc-950 rounded-lg pl-9 pr-4 py-2 text-xs font-mono placeholder-zinc-400 focus:outline-none"
              />
            </div>

            {selectedLeadIds.length > 0 && (
              <div className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-200 px-3 py-1.5 rounded-xl">
                📥 {selectedLeadIds.length} SELECIONADOS
              </div>
            )}
          </div>

          {/* BATCH ACTION PANEL */}
          {selectedLeadIds.length > 0 && (
            <div className="bg-zinc-950 border-4 border-zinc-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-white space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-black ">
                    {selectedLeadIds.length} LEAD(S)
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider font-mono text-zinc-300">
                    Painel Operacional Lote Geral
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Gemini API action */}
                  <button
                    type="button"
                    disabled={isBatchGenerating}
                    onClick={handleBatchGenerateWithGemini}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 text-white border-2 border-zinc-700 hover:border-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isBatchGenerating ? (
                      <>
                        <span className=" inline-block">⏳</span>
                        <span>IA Gerando {batchProgress}/{selectedLeadIds.length}...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ IA Lote (Gemini)</span>
                      </>
                    )}
                  </button>

                  {/* Copy Batch */}
                  <button
                    type="button"
                    onClick={handleBatchCopyTexts}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 border-2 border-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    📋 Copiar Roteiros
                  </button>

                  {/* Save/Commit Batch */}
                  <button
                    type="button"
                    onClick={handleBatchSaveToCRM}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    💾 Salvar no CRM
                  </button>

                  {/* Bulk Delete Scripts */}
                  <button
                    type="button"
                    onClick={handleBatchDeleteScripts}
                    className="px-3.5 py-2 bg-rose-900/40 hover:bg-rose-900/80 text-rose-200 hover:text-white border-2 border-rose-800 rounded-xl text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    🗑️ Excluir Roteiros
                  </button>

                  {/* Bulk Delete Leads */}
                  <button
                    type="button"
                    onClick={handleBatchDeleteLeads}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white border-2 border-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    ❌ Excluir Leads
                  </button>

                  {/* Clear selection */}
                  <button
                    type="button"
                    onClick={() => setSelectedLeadIds([])}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-700 rounded-xl text-[10px] font-mono font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-px transition-colors cursor-pointer shrink-0"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>

              {/* Batch template application */}
              {copywritingScripts.length > 0 && (
                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-3">
                  <span className="text-[10px] uppercase font-mono font-black text-zinc-400 flex items-center gap-1">
                    ⚡ SOBREPOR COM MODELO SALVO:
                  </span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBatchApplyTemplate(e.target.value);
                        e.target.value = ""; // reset
                      }
                    }}
                    className="bg-zinc-800 text-white border-2 border-zinc-700 hover:border-zinc-500 rounded-xl text-[10.5px] font-mono px-3 py-1.5 max-w-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Escolher Script da Biblioteca --</option>
                    {copywritingScripts.map(script => (
                      <option key={script.id} value={script.text}>
                        {script.title} ({script.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Beautiful linear progress bar during bulk AI generation */}
              {isBatchGenerating && (
                <div className="w-full bg-zinc-805 h-2.5 rounded-full overflow-hidden border-2 border-zinc-900">
                  <div
                    className="bg-purple-500 h-full transition-colors"
                    style={{ width: `${(batchProgress / selectedLeadIds.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* LEADS LIST SCRIPTS */}
          <div className="bg-white border-4 border-zinc-950 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] overflow-hidden flex flex-col">
            <div className="overflow-x-auto border-2 border-zinc-900 rounded-lg custom-scrollbar">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-900 text-white font-mono sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 text-center w-12 select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-2 border-zinc-950 text-indigo-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id))}
                        onChange={() => {
                          const isAllSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));
                          if (isAllSelected) {
                            const filteredIds = filteredLeads.map(l => l.id);
                            setSelectedLeadIds(prev => prev.filter(id => !filteredIds.includes(id)));
                          } else {
                            const filteredIds = filteredLeads.map(l => l.id);
                            setSelectedLeadIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                          }
                        }}
                      />
                    </th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 whitespace-nowrap">ID / Nome do Lead</th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 whitespace-nowrap min-w-[150px]">Ficha & Visibilidades</th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 w-full min-w-[300px]">Roteiro Contextual (Editável e Mutável)</th>
                    <th className="px-3 py-3 border-b-2 border-zinc-900 whitespace-nowrap text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, idx) => (
                    <tr key={lead.id} className={idx % 2 === 0 ? "bg-zinc-50" : "bg-white"}>
                      <td className="px-3 py-4 border-r border-b border-zinc-200 text-center select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-2 border-zinc-350 text-indigo-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => {
                            setSelectedLeadIds(prev =>
                              prev.includes(lead.id)
                                ? prev.filter(id => id !== lead.id)
                                : [...prev, lead.id]
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-4 border-r border-b border-zinc-200">
                        <div className="font-bold text-zinc-800 text-xs truncate max-w-[150px]" title={lead.name}>{lead.name}</div>
                        <div className="font-mono text-zinc-500 text-[9px] mt-1">Ref: {lead.id.split("-")[0].toUpperCase()}</div>
                      </td>
                      <td className="px-3 py-4 border-r border-b border-zinc-200 font-mono text-[9px] space-y-1 text-zinc-600">
                        <div className="flex justify-between"><span className="font-bold uppercase text-zinc-800">Status:</span> <span>{getColLabel("status", lead.status)}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase text-zinc-800">Etapa:</span> <span>{getColLabel("etapas", lead.stage)}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase text-zinc-800">Perfil:</span> <span>{getColLabel("perfil", lead.mainProfile)}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase text-zinc-800">Objeção:</span> <span>{getColLabel("objecoes", lead.objection)}</span></div>
                      </td>
                      <td className="px-3 py-4 border-r border-b border-zinc-200 space-y-3">
                        <textarea
                          className="w-full bg-white border-2 border-zinc-950 rounded-xl p-3 text-[11px] font-sans resize-y min-h-[90px] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-inner"
                          value={editableScripts[lead.id] !== undefined ? editableScripts[lead.id] : (lead.currentScript || "")}
                          onChange={(e) => setEditableScripts(prev => ({...prev, [lead.id]: e.target.value}))}
                          placeholder="Roteiro contextual e preditivo aparecerá aqui..."
                        />
                        {/* AI & Template controls row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={generatingIds[lead.id]}
                            onClick={() => handleGenerateWithGemini(lead)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-400 text-white border-2 border-zinc-950 rounded-xl text-[9px] font-mono font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(24,24,27,1)] active:translate-y-px active:shadow-none transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {generatingIds[lead.id] ? (
                              <>
                                <span className=" inline-block">⏳</span>
                                <span>IA Criando...</span>
                              </>
                            ) : (
                              <>
                                <span>✨ IA Predict (Gemini)</span>
                              </>
                            )}
                          </button>

                          {/* Selector of Quick Templates saved in database */}
                          {copywritingScripts.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-lg border border-zinc-200">
                              <span className="text-[7.5px] font-mono font-black uppercase text-zinc-600">Modelo:</span>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleSelectTemplateForLead(lead.id, lead.name, e.target.value);
                                    e.target.value = ""; // reset selection
                                  }
                                }}
                                className="bg-white border border-zinc-300 rounded text-[9.5px] font-mono px-1 py-0.5 max-w-[185px] focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Mudar para Script Rápido --</option>
                                {copywritingScripts.map(script => (
                                  <option key={script.id} value={script.text}>
                                    {script.title} ({script.category})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 border-b border-zinc-200">
                        <div className="flex flex-col gap-2 items-center">
                          <a
                            onClick={() => {
                              // Save logic
                              if (editableScripts[lead.id]) {
                                onUpdateLeadField(lead.id, { currentScript: editableScripts[lead.id] });
                                if (triggerSensoryFeedback) triggerSensoryFeedback("click", accSettings);
                              }
                            }}
                            href={`whatsapp://send?phone=${lead.phone ? lead.phone.replace(/[^0-9]/g, '') : ''}&text=${encodeURIComponent(editableScripts[lead.id] || lead.currentScript || "")}`}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-mono font-black uppercase text-[10.1px] px-3 py-2.5 rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-px active:shadow-none transition-colors flex items-center gap-1.5 w-full justify-center cursor-pointer"
                          >
                            💬 Enviar & Salvar 💾
                          </a>

                          <div className="flex gap-1.5 w-full">
                            {/* Limpar Roteiro */}
                            <button
                              type="button"
                              onClick={() => {
                                const confirmClear = window.confirm(`Deseja limpar o roteiro atual de "${lead.name}"?`);
                                if (confirmClear) {
                                  setEditableScripts(prev => ({ ...prev, [lead.id]: "" }));
                                  onUpdateLeadField(lead.id, { currentScript: "" });
                                  if (addNotification) {
                                    addNotification("Roteiro Limpo 🗑️", `O roteiro contextual de "${lead.name}" foi apagado.`, "warning");
                                  }
                                  if (triggerSensoryFeedback) triggerSensoryFeedback("warning", accSettings);
                                }
                              }}
                              className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[8.5px] font-mono font-black uppercase tracking-tighter text-center cursor-pointer transition-colors"
                              title="Limpar Roteiro Atual"
                            >
                              🗑️ Roteiro
                            </button>

                            {/* Excluir Lead */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteLead) {
                                  onDeleteLead(lead.id);
                                } else {
                                  const confirmDelete = window.confirm(`Deseja deletar o lead "${lead.name}" definitivamente do CRM?`);
                                  if (confirmDelete) {
                                    onUpdateLeadField(lead.id, { deleted: true });
                                    if (addNotification) {
                                      addNotification("Lead Removido ❌", `O contato "${lead.name}" foi deletado.`, "warning");
                                    }
                                    if (triggerSensoryFeedback) triggerSensoryFeedback("warning", accSettings);
                                  }
                                }
                              }}
                              className="flex-1 py-1.5 bg-zinc-900 hover:bg-rose-600 hover:border-zinc-950 text-white border border-zinc-950 rounded-lg text-[8.5px] font-mono font-black uppercase tracking-tighter text-center cursor-pointer transition-colors"
                              title="Excluir Lead definitivamente"
                            >
                              ❌ Lead
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-zinc-500 font-mono text-xs">
                        Nenhum lead encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* LIBRARY MANAGEMENT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create & Edit Panel */}
          <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 self-start">
            <div className="border-b pb-3 flex items-center gap-2 text-zinc-950">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">
                {editingScriptId ? "Editar Script do Banco" : "Cadastrar Roteiro Coprwriting"}
              </h3>
            </div>

            {/* Form layout */}
            <div className="space-y-3 font-mono text-[10px]">
              <div>
                <label className="text-[8px] font-mono font-black uppercase text-zinc-650 block mb-0.5">Título do Roteiro</label>
                <input
                  type="text"
                  value={editingScriptId ? editingScriptForm.title : addScriptForm.title}
                  onChange={e => editingScriptId 
                    ? setEditingScriptForm(prev => ({ ...prev, title: e.target.value }))
                    : setAddScriptForm(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex: Contorno de Taxa Bancária"
                  className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono font-black uppercase text-zinc-650 block mb-0.5">Selo / Categoria</label>
                <input
                  type="text"
                  value={editingScriptId ? editingScriptForm.category : addScriptForm.category}
                  onChange={e => editingScriptId 
                    ? setEditingScriptForm(prev => ({ ...prev, category: e.target.value }))
                    : setAddScriptForm(prev => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="Ex: WhatsApp, Financiamento, Caixa"
                  className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono font-black uppercase text-zinc-650 block mb-0.5 block">🔑 Palavras-chave Gatilho (separadas por vírgula)</label>
                <input
                  type="text"
                  value={editingScriptId ? editingScriptForm.trigger_keywords : addScriptForm.trigger_keywords}
                  onChange={e => editingScriptId 
                    ? setEditingScriptForm(prev => ({ ...prev, trigger_keywords: e.target.value }))
                    : setAddScriptForm(prev => ({ ...prev, trigger_keywords: e.target.value }))
                  }
                  placeholder="Ex: simular, simula, taxa, caixa, MCMV"
                  className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-xs outline-none"
                />
                <p className="text-[7.5px] text-zinc-400 mt-0.5 italic">Se o cliente enviar estas palavras pelo WhatsApp, o processador autônomo responderá.</p>
              </div>

              <div>
                <label className="text-[8px] font-mono font-black uppercase text-zinc-650 block mb-0.5">Redação Oficial do Script / Roteiro</label>
                <textarea
                  rows={5}
                  value={editingScriptId ? editingScriptForm.text : addScriptForm.text}
                  onChange={e => editingScriptId 
                    ? setEditingScriptForm(prev => ({ ...prev, text: e.target.value }))
                    : setAddScriptForm(prev => ({ ...prev, text: e.target.value }))
                  }
                  placeholder="Olá [Nome do Lead], tudo bem? Percebemos..."
                  className="w-full bg-white border-2 border-zinc-950 p-2 rounded-xl text-xs font-mono outline-none leading-tight"
                />
                <p className="text-[7.5px] text-zinc-400 mt-0.5">Dica: use <strong>[Nome do Lead]</strong> para substituição dinâmica inteligente de nomes.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {editingScriptId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingScriptId(null)}
                      className="px-3 py-1.5 border-2 border-zinc-950 rounded-xl text-[9px] uppercase font-black bg-white hover:bg-zinc-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditScript}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white border-2 border-zinc-950 rounded-xl text-[9px] uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Salvar Alterações
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsAddingScript(false)}
                      className="px-3 py-1.5 border-2 border-zinc-950 rounded-xl text-[9px] uppercase font-black bg-white hover:bg-zinc-50"
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateScript}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-zinc-950 rounded-xl text-[9px] uppercase font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] "
                    >
                      Salvar Roteiro
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* List display panel of templates */}
          <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <h3 className="font-mono text-xs font-black uppercase text-zinc-800">Roteiros Cadastrados (Biblioteca Ativa)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {copywritingScripts.map(script => (
                <div key={script.id} className="p-4 bg-white border-4 border-zinc-950 rounded-2xl relative space-y-2 text-left flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="space-y-1">
                    <div className="flex gap-1 items-center flex-wrap">
                      <span className="text-[7.5px] font-mono font-black uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {script.category}
                      </span>
                      {script.trigger_keywords && (
                        <span className="text-[7.5px] font-mono font-black uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Gatilhos de Auto-resposta">
                          🔑 Gatilhos: {script.trigger_keywords}
                        </span>
                      )}
                    </div>
                    <h4 className="text-[11px] font-black text-zinc-950 uppercase font-mono">{script.title}</h4>
                    <p className="bg-zinc-50 p-2.5 border-2 border-zinc-200 rounded-xl text-[9.5px] font-mono text-zinc-600 h-[100px] overflow-y-auto whitespace-pre-line leading-tight">
                      {script.text}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => handleStartEditScript(script)}
                      className="p-1.5 border border-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition"
                      title="Editar Roteiro"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-805" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScript(script.id)}
                      className="p-1.5 border border-zinc-900 bg-rose-50 rounded-lg hover:bg-rose-100 transition"
                      title="Excluir Roteiro"
                    >
                      <Trash className="w-3.5 h-3.5 text-rose-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(script.id, script.text)}
                      className={`p-1.5 border-2 border-zinc-950 rounded-lg hover:bg-zinc-100 transition shrink-0 ${copiedScriptId === script.id ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-zinc-800'}`}
                    >
                      {copiedScriptId === script.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
              {copywritingScripts.length === 0 && (
                <div className="col-span-2 text-center py-12 text-zinc-500 font-mono text-xs border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50">
                  Nenhum modelo cadastrado na biblioteca. Cadastre ao lado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'fluxos' && (
        <FluxoManager
          operationalFlows={operationalFlows}
          setOperationalFlows={setOperationalFlows}
          addNotification={addNotification}
        />
      )}
    </div>
  );
}
