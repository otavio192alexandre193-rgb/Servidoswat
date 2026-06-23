import fs from 'fs';

const content = fs.readFileSync('src/components/FollowUpManager.tsx', 'utf8');

const returnMarker = "  return (";
// Find the last index of `return (` which shouldn't be matched by something else as long as it's the main return
const startIndex = content.lastIndexOf("  return (");

if (startIndex > -1) {
  const newStructure = `  return (
    <div id="followup-interactive-pane" className="space-y-6">
      <Appointments
        leads={leads}
        appointments={appointments || []}
        onAddAppointment={onAddAppointment || (() => {})}
        onUpdateAppointmentStatus={onUpdateAppointmentStatus || (() => {})}
        onDeleteAppointment={onDeleteAppointment || (() => {})}
        accSettings={accSettings}
        renderCustomLayout={({ Header, TodayCard, CalendarGrid, ModalForm, ListGrid }) => (
          <div className="w-full space-y-6">

            {/* TITLE BLOCK */}
            <div className="bg-zinc-950 p-6 rounded-3xl text-white flex items-center justify-between border-4 border-zinc-950 shadow-[6px_6px_0px_0px_rgba(39,39,42,1)]">
               <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Activity className="w-6 h-6 text-indigo-400" />
                    Linha do Tempo
                  </h1>
                  <p className="text-sm font-bold text-zinc-400 mt-1">Gestão unificada de acompanhamento e rotinas estruturadas do CRM</p>
               </div>
            </div>

            {/* TABELA PRÓXIMOS PASSOS */}
            <div className="bg-white border-4 border-zinc-950 p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] text-zinc-950 ">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-zinc-200 pb-3 mb-5 gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 px-2.5 bg-indigo-100 border border-indigo-400 text-indigo-800 text-[9px] font-black uppercase tracking-wider font-mono rounded-lg">
                      Próximos Passos
                    </span>
                    <span className="text-xl">📊</span>
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-zinc-950 mt-1">
                    TABELA PRÓXIMOS PASSOS
                  </h2>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder="Pesquisa avançada de leads..."
                      className="w-full bg-zinc-50 border-2 border-zinc-350 pr-3 pl-8 py-1.5 rounded-xl text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold max-w-[200px] leading-tight hidden md:block">
                    Ações matemáticas baseadas na jornada do Lead ativo ou pendente.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border-4 border-zinc-950 rounded-xl">
                <table className="w-full text-left border-collapse bg-zinc-50 text-[11px]">
                  <thead className="bg-zinc-950 text-white font-mono font-black uppercase text-[10px] h-9">
                    <tr>
                      <th className="px-4 border-r border-zinc-800 w-[240px]">👤 Lead / Contexto Global</th>
                      <th className="px-3 border-r border-zinc-800 text-center w-[120px]">⏳ Prazo Limite</th>
                      <th className="px-4 border-r border-zinc-800 w-[220px]">🎯 Ação Sugerida</th>
                      <th className="px-4">➡️ Próximos Passos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-zinc-950 font-medium bg-zinc-200">
                    {filteredMatrixLeads.map((lead) => {
                      const deduc = getMatrixDeduction(
                        lead.stage || 'novo',
                        lead.status || 'ativo',
                        lead.mainProfile,
                        lead.objection
                      );

                      // Determine overdues
                      let daysSinceContact = null;
                      if (lead.lastContactAt) {
                        const contactDate = new Date(lead.lastContactAt);
                        const diffTime = Math.abs(new Date().getTime() - contactDate.getTime());
                        daysSinceContact = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      }
                      const isOverdue = daysSinceContact !== null && daysSinceContact > 7;

                      return (
                        <tr key={lead.id} className="hover:bg-zinc-300 transition-colors h-auto">
                          {/* Contexto Global do Lead em formato de CARD */}
                          <td className="px-4 py-3 border-r-2 border-zinc-950 align-top max-w-[280px]">
                            
                            <div className="bg-white hover:bg-zinc-50 border-2 border-zinc-950 rounded-xl transition-all relative p-3.5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col gap-1.5 font-sans">
                               <div className="border-b-2 border-zinc-950 pb-1 flex flex-col items-center">
                                  <div className="flex items-center gap-1 w-full justify-between mb-0.5">
                                    {lead.tags && lead.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-0.5">
                                        {lead.tags.slice(0, 1).map((tg) => (
                                          <span key={tg} className="text-[7px] font-black uppercase bg-indigo-50 border border-indigo-150 text-indigo-700 rounded px-1 tracking-tight shrink-0 font-mono">
                                            🏷️ {tg}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {isOverdue && (
                                      <span className="flex items-center gap-0.5 text-[7px] bg-red-100 border border-red-650 text-red-950 rounded px-1 font-mono font-black select-none shrink-0" title={\`Último contato foi há \${daysSinceContact} dias!\`}>
                                        <AlertTriangle className="w-2 h-2 text-red-650 shrink-0" />
                                        {daysSinceContact}d
                                      </span>
                                    )}
                                  </div>
                                  <strong className="w-full text-zinc-900 font-sans font-black text-center truncate uppercase tracking-tight text-[11px]">
                                    {lead.name}
                                  </strong>
                               </div>

                               <div className="text-[9px] text-zinc-800">
                                 <div className="text-center font-black uppercase text-[7px] bg-zinc-200 border border-zinc-950 rounded mb-0.5 tracking-widest text-zinc-600">Infos</div>
                                 <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 text-center font-semibold text-[8px]">
                                    <div className="truncate border-r border-zinc-200" title={lead.phone}>{lead.phone || '-'}</div>
                                    <div className="truncate border-r border-zinc-200" title={lead.region}>{lead.region || '-'}</div>
                                    <div className="truncate" title={lead.programaDesejado}>
                                      {lead.programaDesejado === 'Minha Casa Minha Vida' ? 'MCMV' : lead.programaDesejado || '-'}
                                    </div>
                                 </div>
                               </div>

                               <div>
                                 <div className="text-center font-black uppercase text-[7px] bg-zinc-200 border border-zinc-950 rounded mb-0.5 tracking-widest text-zinc-600">Blocos de Status</div>
                                 <div className="flex flex-col gap-1 w-full">
                                    <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold uppercase tracking-tight text-center text-[8.5px] rounded w-full py-0.5 truncate">
                                      {lead.stage || 'NOVA'}
                                    </span>
                                    <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold uppercase tracking-tight text-center text-[8.5px] rounded w-full py-0.5 truncate">
                                      {lead.status || 'ATIVO'}
                                    </span>
                                 </div>
                               </div>
                            </div>
                          </td>

                          {/* Prazo Limite */}
                          <td className="px-3 py-4 border-r-2 border-zinc-950 text-center font-mono font-black text-rose-600 text-[10.5px] bg-white">
                            {deduc.prazo}
                          </td>

                          {/* Ação Sugerida */}
                          <td className="px-4 py-4 border-r-2 border-zinc-950 font-bold text-zinc-950 text-[11px] leading-relaxed bg-zinc-50 align-top">
                            {deduc.fazer}
                          </td>

                          {/* Próximos Passos */}
                          <td className="px-4 py-4 bg-indigo-50/50 font-black text-indigo-950 uppercase tracking-tight text-[10.5px] align-top">
                            <div className="flex flex-col gap-3">
                              <span className="block break-words">{deduc.passo}</span>
                              {onNavigateToScripts && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToScripts(lead.name);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black uppercase text-[8px] px-2 py-1.5 rounded border border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-y-px active:shadow-none transition-all flex items-center justify-center gap-1 w-full"
                                >
                                  ✍️ Carregar Roteiro
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredMatrixLeads.length === 0 && (
                      <tr className="bg-white">
                        <td colSpan={4} className="px-4 py-12 text-center text-zinc-400 font-mono font-black tracking-widest uppercase">
                          Nenhum lead encontrado. Exibindo apenas leads ativos ou pendentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOWER BLOCKS: HISTÓRICO DE INTERAÇÕES E TAREFAS/CRIADOR */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* COLUNA ESQUERDA: HISTORICO DE INTERAÇÕES E FORM DE NOVO FOLLOW UP */}
              <div className="space-y-6">
                
                {/* HISTÓRICO DE INTERAÇÕES */}
                <div className="bg-zinc-50 border-4 border-zinc-950 p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-900 p-2.5 border-2 border-zinc-950 rounded-xl text-white">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-sans font-black text-sm uppercase italic tracking-tight text-zinc-950">
                          Histórico de Interações
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {filteredFollowUps.length} interações e rotinas
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mb-5">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Filtrar por nome ou nota..."
                        className="w-full bg-white border-2 border-zinc-350 pr-3 pl-9 py-2.5 rounded-xl text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none"
                      />
                    </div>
                    <select
                      value={historyFilterType}
                      onChange={(e) => setHistoryFilterType(e.target.value)}
                      className="bg-white border-2 border-zinc-350 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-800 whitespace-nowrap outline-none"
                    >
                      <option value="all">Filtro: TODOS</option>
                      <option value="ligacao">📞 LIGAÇÃO</option>
                      <option value="whatsapp">💬 WHATSAPP</option>
                      <option value="email">✉️ E-MAIL</option>
                      <option value="reuniao">👥 REUNIÃO</option>
                      <option value="proposta">📄 PROPOSTA</option>
                    </select>
                  </div>

                  <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar text-zinc-900">
                    {filteredFollowUps.map((fup, index) => (
                      <div
                        key={fup.id}
                        className="bg-white border-2 border-zinc-950 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] relative hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => onDeleteFollowUp(fup.id)}
                          title="Remover do histórico"
                          className="absolute right-4.5 top-4.5 opacity-0 group-hover:opacity-100 p-1.5 border-2 border-zinc-950 hover:border-red-650 rounded-lg bg-white hover:bg-rose-100 text-zinc-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 bg-zinc-50 border-2 border-zinc-950 rounded-xl shrink-0">
                            {getContactIcon(fup.type)}
                          </div>

                          <div className="space-y-2.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <strong className="text-zinc-950 font-sans font-black text-xs uppercase leading-tight">
                                {fup.leadName}
                              </strong>
                              <span className="text-[10px] text-zinc-400 font-mono font-bold tracking-tighter">
                                {fup.date.split('-').reverse().join('/')} às {fup.time}
                              </span>
                              <span className="text-[8px] bg-zinc-200 border border-zinc-300 font-mono font-black uppercase text-zinc-700 px-2 py-0.5 rounded ml-auto">
                                {getContactLabel(fup.type)}
                              </span>
                            </div>

                            <p className="text-[11.5px] font-semibold text-zinc-700 bg-zinc-50 border-l-4 border-zinc-950 p-2.5 rounded-r-xl leading-relaxed">
                              {fup.notes}
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {fup.attemptNo && (
                                <span className="text-[8.5px] bg-zinc-900 font-mono font-black text-white px-2 py-0.5 rounded-lg uppercase">
                                  Tentativa {fup.attemptNo}ª
                                </span>
                              )}
                              {fup.result && (
                                <span className="text-[8.5px] bg-emerald-50 border border-emerald-300 font-mono font-black text-emerald-800 px-2 py-0.5 rounded-lg uppercase">
                                  {fup.result}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredFollowUps.length === 0 && (
                      <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 p-8 rounded-2xl text-center">
                        <span className="text-4xl block mb-2 opacity-50">🔭</span>
                        <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest">Nenhum registro localizado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* FORMULÁRIO DE REGISTRO */}
                <div className="bg-indigo-50 border-4 border-zinc-950 p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] text-zinc-900 relative overflow-hidden">
                  <div className="flex items-center gap-2 border-b-2 border-zinc-950 pb-3 mb-5 relative z-10">
                    <span className="text-xl">📢</span>
                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-indigo-950">
                      Registrar Nova Interação Manual
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div>
                      <select
                        required
                        value={selectedLeadId}
                        onChange={(e) => {
                          setSelectedLeadId(e.target.value);
                          const latestFup = followUps.filter(f => f.leadId === e.target.value).sort((a,b)=>b.date.localeCompare(a.date))[0];
                          if (latestFup) {
                            setNotes('Follow-up de andamento.');
                          } else {
                            setNotes('');
                          }
                        }}
                        className="w-full bg-white border-2 border-zinc-950 rounded-xl p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-650 transition"
                      >
                        <option value="">-- SELECIONE O LEAD NO FUNIL --</option>
                        {leads
                          .filter(l => l.status !== 'fechado' && l.status !== 'perdido')
                          .map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.status.toUpperCase()})</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">
                        Canal de Abordagem / Meio
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {(['ligacao', 'whatsapp', 'email', 'reuniao', 'proposta'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setContactType(type)}
                            className={\`p-1.5 border-2 rounded-xl text-[8.5px] font-black uppercase tracking-tight text-center flex flex-col items-center justify-center gap-1 transition \${
                              contactType === type
                                ? 'bg-zinc-950 text-white border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-white text-zinc-650 border-zinc-350 hover:bg-zinc-100'
                            }\`}
                          >
                            {getContactIcon(type)}
                            <span className="truncate w-full">{type}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border-2 border-zinc-950 p-4 rounded-xl space-y-4 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                      <span className="text-[10px] font-mono font-black text-indigo-900 uppercase block">📊 Métricas do Atendimento</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-zinc-650 uppercase mb-1">Tentativa Nº</label>
                          <select
                            value={fupAttemptNo}
                            onChange={(e) => setFupAttemptNo(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-350 rounded-lg p-2 text-xs font-semibold text-zinc-900 outline-none"
                          >
                            <option value={1}>1ª Tent. de Abordagem</option>
                            <option value={2}>2ª Tent. de Abordagem</option>
                            <option value={3}>3ª Tent. de Abordagem</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-zinc-650 uppercase mb-1">Resultado da Interação</label>
                          <select
                            value={fupResult}
                            onChange={(e) => setFupResult(e.target.value as any)}
                            className="w-full bg-zinc-50 border border-zinc-350 rounded-lg p-2 text-xs font-bold text-zinc-950 outline-none"
                          >
                            <option value="Sucesso (Contato Efetivo)">✅ Efetivo</option>
                            <option value="Caixa Postal / Sem retorno">☎️ S. Retorno</option>
                            <option value="Follow-up Reagendado">📅 Reagendado</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <textarea
                        required
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white border-2 border-zinc-950 rounded-xl p-3 text-xs min-h-[90px] font-medium resize-y focus:outline-none"
                        placeholder="Anotações desta interação... (Ex: Cliente pediu retorno amanhã)"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs py-3.5 rounded-xl border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-px active:shadow-none transition-all flex items-center justify-center gap-2 tracking-widest"
                    >
                      Salvar Interação No Histórico
                    </button>
                  </form>
                </div>

              </div>

              {/* COLUNA DIREITA: CALENDARIO, TAREFAS */}
              <div className="space-y-6">
                {/* CALENDÁRIO */}
                {CalendarGrid}
                
                {/* LISTGRID (TAREFAS E ATIVIDADES) E MODAL */}
                {ModalForm}
                {ListGrid}
              </div>

            </div>
          </div>
        )}
      />
    </div>
  );
}
`;

  // We are replacing from the FIRST index of "  return (" (which is the FollowUpManager's return block)
  // until the end. We'll find it via content.indexOf("  return (")
  const startIndexReal = content.indexOf("  return (");
  
  const newFileContent = content.substring(0, startIndexReal) + newStructure;
  fs.writeFileSync('src/components/FollowUpManager.tsx', newFileContent);
  console.log('Successfully replaced structure cleanly.');
} else {
  console.error('Could not find start marker:', startIndex);
}
