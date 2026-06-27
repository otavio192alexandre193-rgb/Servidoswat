const fs = require('fs');
const path = 'src/components/LeadList.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{isTodosView \? \(\s*<>\s*\{\/\* Telefone \(com DDD\) \*\/\}[\s\S]*?\{\/\* E-mail column in todos view \*\/\}[\s\S]*?\{\/\* Data de entrada column in todos view \*\/\}[\s\S]*?\{\/\* Ações column in todos view \*\/\}([\s\S]*?<\/td>\s*)<\/>\s*\)\s*:\s*\(/s;

const match = content.match(regex);
if (match) {
    const acoesContent = match[1];

    const newTodosViewBody = `{isTodosView ? (
                        <>
                          {/* Contato (Tel/Email) */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                            <div className="flex flex-col gap-1">
                              <input 
                                defaultValue={lead.phone}
                                onBlur={(e) => { if (e.target.value !== lead.phone) onUpdateLeadField?.(lead.id, { phone: e.target.value }) }}
                                className="block font-extrabold text-[10px] tracking-tight text-zinc-950 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full truncate"
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
                             <div className="flex flex-col gap-1 text-[9px] font-bold uppercase truncate">
                                <span>{lead.status || '-'}</span>
                                <span className="text-indigo-600">{lead.stage || '-'}</span>
                             </div>
                          </td>

                          {/* Perfil/Objeção */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                            <div className="flex flex-col gap-1 text-[9px] font-bold uppercase truncate">
                                <span className="text-zinc-700">{lead.mainProfile || '-'}</span>
                                <span className="text-red-600">{lead.objection || '-'}</span>
                             </div>
                          </td>

                          {/* Qualificação/Preferência */}
                          <td className="px-2 py-2 text-[10px] text-zinc-800 text-sm whitespace-nowrap max-w-[120px]">
                             <div className="flex flex-col gap-1 text-[9px] font-bold uppercase truncate">
                                <span className="text-zinc-700">{lead.qualificacao || '-'}</span>
                                <span className="text-emerald-600">{lead.propertyInterest || lead.programaDesejado || '-'}</span>
                             </div>
                          </td>

                          {/* Data de Entrada */}
                          <td className="px-2 py-2 text-[10px] font-mono text-xs text-zinc-650 whitespace-nowrap">
                            <div className="bg-indigo-50 border border-indigo-200 rounded px-1.5 py-1 inline-block shadow-sm">
                              <span className="text-[8px] text-indigo-500 font-black uppercase block leading-none mb-0.5">🗓️ ENTRADA</span>
                              <span className="text-[9px] font-black text-indigo-800">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR") : "-"}
                              </span>
                            </div>
                          </td>

                          {/* Ações Rápidas */}
                          <td className="px-2 py-2 text-[10px] font-sans whitespace-nowrap">
                            ${acoesContent}
                        </>
                      ) : (`;

    content = content.replace(regex, newTodosViewBody);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully refactored.");
} else {
    console.log("Could not match the regex.");
}
