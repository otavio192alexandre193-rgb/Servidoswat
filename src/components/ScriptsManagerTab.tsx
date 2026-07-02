import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Save, FileText, CheckCircle2 } from 'lucide-react';

export default function ScriptsManagerTab() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      // Load from local storage first for immediate rendering
      const local = localStorage.getItem('crm_copywriting_scripts');
      if (local) {
        setScripts(JSON.parse(local));
      }

      // Sync with Firestore
      if (db) {
        const snap = await getDocs(collection(db, 'copywriting_scripts'));
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetched.length > 0) {
          setScripts(fetched);
          localStorage.setItem('crm_copywriting_scripts', JSON.stringify(fetched));
        } else if (!local) {
            // Default scripts if empty
            const defaultScripts = [
              {
                id: 'script-default-1',
                title: 'Abordagem Comercial - WhatsApp',
                category: 'Prospecção Fria',
                text: 'Olá, [Nome do Lead]! Tudo bem? 👋 \\n\\nSeja muito bem-vindo(a) à *{{agencyName}}*!\\n\\nVocê gostaria de simular um crédito habitacional hoje?',
                trigger_keywords: 'oi, ola, olá, bom dia, boa tarde, boa noite, como vai, tudo bem, falar com, ajuda'
              },
            ];
            setScripts(defaultScripts);
        }
      }
    } catch (e) {
      console.error('Error loading scripts:', e);
    }
    setLoading(false);
  };

  const saveScripts = async () => {
    setSaving(true);
    try {
      localStorage.setItem('crm_copywriting_scripts', JSON.stringify(scripts));
      
      if (db) {
        for (const script of scripts) {
          if (!script.id) script.id = `script-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, 'copywriting_scripts', script.id), script);
        }
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving scripts:', e);
    }
    setSaving(false);
  };

  const addScript = () => {
    setScripts([...scripts, {
      id: `script-${Date.now()}`,
      title: 'Novo Script',
      category: 'Geral',
      text: '',
      trigger_keywords: ''
    }]);
  };

  const updateScript = (index: number, field: string, value: string) => {
    const updated = [...scripts];
    updated[index] = { ...updated[index], [field]: value };
    setScripts(updated);
  };

  const removeScript = async (index: number, id: string) => {
    const updated = [...scripts];
    updated.splice(index, 1);
    setScripts(updated);
    
    if (db && id) {
      try {
        await deleteDoc(doc(db, 'copywriting_scripts', id));
      } catch (e) {
        console.error('Error deleting script from DB', e);
      }
    }
  };

  if (loading) return <div className="text-zinc-500 font-mono text-xs p-6">Carregando scripts...</div>;

  return (
    <div className="bg-white border-4 border-zinc-950 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-indigo-600" />
            Scripts de Copywriting (IA Autônoma)
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">Configure as respostas automáticas do CRM baseadas em palavras-chave.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={addScript}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg border-2 border-zinc-950 text-xs font-black uppercase hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> Novo Script
          </button>
          <button 
            onClick={saveScripts}
            disabled={saving}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg border-2 border-zinc-950 text-xs font-black uppercase hover:bg-emerald-600 transition-colors shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center gap-2"
          >
            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {success ? 'Salvo!' : 'Salvar Scripts'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {scripts.map((script, idx) => (
          <div key={script.id || idx} className="border-2 border-zinc-300 rounded-xl p-4 bg-zinc-50 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Título do Script</label>
                  <input 
                    type="text" 
                    value={script.title} 
                    onChange={e => updateScript(idx, 'title', e.target.value)}
                    className="w-full mt-1 p-2 border-2 border-zinc-300 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none"
                    placeholder="Ex: Saudação Inicial"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Gatilhos (Separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={script.trigger_keywords} 
                    onChange={e => updateScript(idx, 'trigger_keywords', e.target.value)}
                    className="w-full mt-1 p-2 border-2 border-zinc-300 rounded-lg text-xs font-mono focus:border-indigo-500 outline-none"
                    placeholder="Ex: oi, ola, simular, preço"
                  />
                </div>
              </div>
              <button 
                onClick={() => removeScript(idx, script.id)}
                className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors border-2 border-transparent hover:border-rose-200 mt-5"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div>
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Corpo da Mensagem (Permite variáveis: [Nome do Lead], {"{{agencyName}}"}</label>
              <textarea 
                value={script.text} 
                onChange={e => updateScript(idx, 'text', e.target.value)}
                rows={4}
                className="w-full mt-1 p-3 border-2 border-zinc-300 rounded-lg text-xs font-medium focus:border-indigo-500 outline-none resize-y custom-scrollbar"
                placeholder="Escreva sua mensagem aqui..."
              />
            </div>
          </div>
        ))}

        {scripts.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-300 rounded-xl">
            <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-zinc-500 font-bold text-sm">Nenhum script configurado.</p>
            <p className="text-zinc-400 font-mono text-xs mt-1">Crie palavras-chave gatilho para resposta autônoma via Webhook.</p>
          </div>
        )}
      </div>
    </div>
  );
}
