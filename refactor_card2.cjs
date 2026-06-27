const fs = require('fs');
const path = 'src/components/KanbanBoard.tsx';
let content = fs.readFileSync(path, 'utf8');

// I want to replace everything from: {/* Header NOME */} to the closing </div> of the card.
// Wait, the card ends with `</div>\n                  </div>\n                );`

const startTag = '{/* Header NOME */}';
const endTag = '</div>\n                  </div>\n                );';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag, startIndex);

if (startIndex > -1 && endIndex > -1) {
  const newCard = `{/* Header NOME */}
                      <div className="border-b border-zinc-805/85 pb-1 flex justify-between items-center px-1">
                        <button
                          onClick={() => onOpenLeadDetails(lead)}
                          className="text-zinc-100 hover:text-indigo-400 font-sans font-black text-left transition-colors truncate uppercase tracking-tight text-[9px] w-full"
                        >
                          {lead.name}
                        </button>
                        {isOverdue && (
                            <span className="flex items-center gap-0.5 text-[7px] bg-red-100 text-red-950 rounded px-1 font-mono font-black select-none shrink-0" title={\`Último contato foi há \${daysSinceContact} dias!\`}>
                                <AlertTriangle className="w-2 h-2 text-red-650 shrink-0" />
                                {daysSinceContact}d
                            </span>
                        )}
                      </div>

                      {/* CARD CONTENT COMPACT */}
                      <div className="text-zinc-400 text-[8px] pb-1 px-1 flex flex-col gap-1">
                        <div className="flex justify-between items-center font-mono">
                          <span className="text-zinc-300 font-bold truncate">{lead.phone || "-"}</span>
                          <div className="flex items-center text-emerald-400 font-black" title="Renda Fam.">
                            <span className="mr-0.5">R$</span>
                            <input
                              type="number"
                              defaultValue={lead.familyIncome || 0}
                              onBlur={(e) => {
                                if (onUpdateLeadField && Number(e.target.value) !== lead.familyIncome) {
                                  onUpdateLeadField(lead.id, { familyIncome: Number(e.target.value) });
                                }
                              }}
                              className="bg-transparent focus:outline-none w-12 text-right"
                            />
                          </div>
                        </div>

                        {/* BLOCOS RAPIDOS */}
                        <div className="grid grid-cols-3 gap-0.5">
                          <select
                            title="Etapa"
                            value={lead.stage || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { stage: e.target.value })}
                            className="text-[6px] font-black uppercase font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm py-0.5"
                          >
                            <option value="">ETAPA</option>
                            {getKanbanColumns("etapas").map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                          <select
                            title="Perfil"
                            value={lead.mainProfile || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { mainProfile: e.target.value as any })}
                            className="text-[6px] font-black uppercase font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm py-0.5"
                          >
                            <option value="">PERFIL</option>
                            {getKanbanColumns("perfil").map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                          <select
                            title="Objeção"
                            value={lead.objection || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { objection: e.target.value })}
                            className="text-[6px] font-black uppercase font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm py-0.5"
                          >
                            <option value="">OBJEÇÃO</option>
                            {getKanbanColumns("objecoes").map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                        </div>
                      </div>

                      {/* AÇÕES COMPACT */}
                      <div className="grid grid-cols-6 gap-0.5 pt-0.5 border-t border-zinc-800/80 px-1">
                          <button onClick={() => window.open(\`https://wa.me/\${lead.phone.replace(/\\D/g, "")}\`)} className="p-0.5 bg-zinc-800 hover:bg-emerald-950/40 text-emerald-500 rounded flex justify-center"><MessageCircle className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onNavigateToFollowUp ? onNavigateToFollowUp(lead) : onOpenEditModal(lead)} className="p-0.5 bg-zinc-800 hover:bg-amber-950/40 text-amber-500 rounded flex justify-center"><Bell className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onOpenRuleEngine && onOpenRuleEngine(lead)} className="p-0.5 bg-zinc-800 hover:bg-indigo-950/40 text-indigo-500 rounded flex justify-center"><Bot className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onOpenLeadDetails(lead)} className="p-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded flex justify-center"><FileText className="w-2.5 h-2.5" /></button>
                          <button onClick={() => onMoveLead(lead.id, "prospect", "etapas")} className="p-0.5 bg-zinc-800 hover:bg-sky-950/40 text-sky-500 rounded flex justify-center"><ChevronDown className="w-2.5 h-2.5" /></button>
                          <button onClick={() => { if(window.confirm("Certeza?")) { onDeleteLead && onDeleteLead(lead.id) } }} className="p-0.5 bg-zinc-800 hover:bg-rose-950/40 text-rose-500 rounded flex justify-center"><Trash2 className="w-2.5 h-2.5" /></button>
                      `;

  content = content.substring(0, startIndex) + newCard + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Card replaced.");
} else {
  console.log("Could not find bounds.");
}
