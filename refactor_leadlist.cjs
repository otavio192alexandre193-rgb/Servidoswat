const fs = require('fs');
const path = 'src/components/LeadList.tsx';
let content = fs.readFileSync(path, 'utf8');

// Modifying the 'isTodosView' block
content = content.replace(
  /\{isTodosView \? \([\s\S]*?\) : \(/,
  `{isTodosView ? (
                    <>
                      <th className={\`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 \${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}\`} style={{ width: '12%' }}>Contato</th>
                      <th className={\`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 \${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}\`} style={{ width: '12%' }}>Status/Etapa</th>
                      <th className={\`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 \${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}\`} style={{ width: '12%' }}>Perfil/Objeção</th>
                      <th className={\`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 \${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}\`} style={{ width: '12%' }}>Qualificação/Pref.</th>
                      <th className={\`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center \${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}\`} style={{ width: '10%' }}>Data</th>
                      <th className={\`px-2 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 text-center \${theme === "claro" ? "text-zinc-600 border-zinc-200" : "text-zinc-300 border-zinc-950"}\`} style={{ width: '8%' }}>Ações</th>
                    </>
                  ) : (`
);

content = content.replace(
  /Nome \/ Região<\/th>/,
  "Nome / Região</th>"
);
content = content.replace(
  /style=\{\{ width: isTodosView \? '30%' : '20%' \}\}/,
  "style={{ width: isTodosView ? '20%' : '20%' }}"
);


const isTodosViewBodyRegex = /\{isTodosView \? \(\s*<>\s*\{\/\* Telefone \(com DDD\) \*\/\}(.*?)\{\/\* Ações Rápidas \*\/\}(.*?)\)\s*:\s*\(/s;
const newTodosViewBody = `{isTodosView ? (
                        <>
                          {/* Contato (Tel/Email) */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                            <div className="flex flex-col gap-1">
                              <input 
                                defaultValue={lead.phone}
                                onBlur={(e) => { if (e.target.value !== lead.phone) onUpdateLeadField?.(lead.id, { phone: e.target.value }) }}
                                className="block font-extrabold text-xs tracking-tight text-zinc-950 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
                              />
                              <input 
                                defaultValue={lead.email}
                                onBlur={(e) => { if (e.target.value !== lead.email) onUpdateLeadField?.(lead.id, { email: e.target.value }) }}
                                className="block text-[9px] text-zinc-500 font-mono font-medium tracking-tight bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
                              />
                            </div>
                          </td>

                          {/* Status/Etapa */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                             <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase truncate">{lead.status || '-'}</span>
                                <span className="text-[9px] text-indigo-600 font-bold uppercase truncate">{lead.stage || '-'}</span>
                             </div>
                          </td>

                          {/* Perfil/Objeção */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase truncate text-zinc-700">{lead.mainProfile || '-'}</span>
                                <span className="text-[9px] text-red-600 font-bold uppercase truncate">{lead.objection || '-'}</span>
                             </div>
                          </td>

                          {/* Qualificação/Preferência */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                             <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase truncate text-zinc-700">{lead.qualificacao || '-'}</span>
                                <span className="text-[9px] text-emerald-600 font-bold uppercase truncate">{lead.propertyInterest || lead.programaDesejado || '-'}</span>
                             </div>
                          </td>

                          {/* Data de Entrada */}
                          <td className="px-2 py-2 text-center text-[10px] font-mono whitespace-nowrap text-zinc-500">
                            {lead.createdAt 
                              ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                              : '-'}
                          </td>

                          {/* Ações Rápidas */}
                          $2) : (`

content = content.replace(isTodosViewBodyRegex, newTodosViewBody);
// colSpan fix
content = content.replace(/colSpan=\{isTodosView \? 7 : 9\}/g, "colSpan={isTodosView ? 9 : 9}");

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored leadlist.");
