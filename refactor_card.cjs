const fs = require('fs');
const path = 'src/components/KanbanBoard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* INFOS \*\/\}.*?(?=\{\/\* FOOTER AÇÕES \*\/\})/s;

const newCardBody = `{/* CARD CONTENT COMPACT */}
                      <div className="text-zinc-400 text-[9px] border-b-[1.5px] border-zinc-805/85 pb-2">
                        <div className="grid grid-cols-2 gap-1 mb-2 font-mono">
                          <div className="flex flex-col">
                            <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-black">Telefone</span>
                            <span className="text-zinc-300 font-bold truncate">{lead.phone || "-"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-black">Renda Fam.</span>
                            <div className="flex items-center text-emerald-400 font-black">
                              <span className="text-[8px] mr-0.5">R$</span>
                              <input
                                type="number"
                                defaultValue={lead.familyIncome || 0}
                                onBlur={(e) => {
                                  if (onUpdateLeadField && Number(e.target.value) !== lead.familyIncome) {
                                    onUpdateLeadField(lead.id, { familyIncome: Number(e.target.value) });
                                  }
                                }}
                                className="bg-transparent focus:outline-none w-16"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-black">Programa</span>
                            <span className="text-indigo-400 font-bold truncate">{lead.programaDesejado === "Minha Casa Minha Vida" ? "MCMV" : lead.programaDesejado || "-"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-black">Idade</span>
                            <span className="text-zinc-300 font-bold">{lead.ageBracket || "-"}</span>
                          </div>
                        </div>

                        {/* BLOCOS RAPIDOS */}
                        <div className="grid grid-cols-3 gap-1 mt-2">
                          <select
                            title="Etapa"
                            value={lead.stage || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { stage: e.target.value })}
                            className="text-[6.5px] font-black uppercase font-mono border border-zinc-700 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm px-0.5 py-1"
                          >
                            <option value="">ETAPA</option>
                            {getKanbanColumns("etapas").map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                          <select
                            title="Perfil"
                            value={lead.mainProfile || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { mainProfile: e.target.value as any })}
                            className="text-[6.5px] font-black uppercase font-mono border border-zinc-700 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm px-0.5 py-1"
                          >
                            <option value="">PERFIL</option>
                            {getKanbanColumns("perfil").map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                          <select
                            title="Objeção"
                            value={lead.objection || ""}
                            onChange={(e) => onUpdateLeadField && onUpdateLeadField(lead.id, { objection: e.target.value })}
                            className="text-[6.5px] font-black uppercase font-mono border border-zinc-700 rounded bg-zinc-950 text-zinc-300 tracking-tighter cursor-pointer focus:outline-none w-full shadow-sm px-0.5 py-1"
                          >
                            <option value="">OBJEÇÃO</option>
                            {getKanbanColumns("objecoes").map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                          </select>
                        </div>
                      </div>
`;

content = content.replace(regex, newCardBody);
fs.writeFileSync(path, content, 'utf8');
console.log('Done refactoring card');
