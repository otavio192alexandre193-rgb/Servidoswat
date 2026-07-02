const fs = require('fs');
let content = fs.readFileSync('src/components/FinanceSimulatorTab.tsx', 'utf-8');

// 1. Remove the malformed Plano Corretor from wherever it was inserted
content = content.replace(
/\{\/\* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA \*\/\}\s*<div className="bg-zinc-900 text-white p-4 rounded-xl space-y-3 border-2 border-zinc-950 relative overflow-hidden animate-fadeIn scale-\[0\.98\] origin-top">[\s\S]*?<\/div>\s*<\/div>/g,
  ""
);

// 2. Remove the leftover bottom half of Plano Corretor from the checklist
content = content.replace(
/\s*\{\/\* Auto dynamic calculations result band \*\/\}\s*\{\(\(\) => \{[\s\S]*?\}\)\(\)\}\s*<\/div>/g,
  ""
);

// 3. Insert a clean Plano Corretor at the end of Inteligência Preditiva.
// Inteligência Preditiva ends here:
//                 </div>
//               </div>
//             </div>
//
//             {/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}

const destRegex = /                <\/div>\s*<\/div>\s*<\/div>\s*\{\/\* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS \*\/\}/;

let cleanPC = `
{/* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA */}
<div className="bg-zinc-900 text-white p-4 rounded-xl space-y-3 border-2 border-zinc-950 relative overflow-hidden animate-fadeIn scale-[0.98] origin-top mt-4">
  <div className="absolute right-3 top-3 opacity-10 rotate-12 select-none pointer-events-none">
    <Building className="w-20 h-20 text-white" />
  </div>

  <div className="border-b border-zinc-800 pb-2 relative z-10 flex justify-between items-center">
    <div>
      <span className="text-[8.5px] font-mono font-black text-emerald-400 uppercase tracking-widest block leading-none">PLANO CORRETOR COMPLETO</span>
      <h4 className="text-xs font-black uppercase text-white tracking-tight flex items-center gap-1.5 mt-1">
        🏡 Entrada Facilitada Construtora (Período Obras)
      </h4>
    </div>
    <div className="px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase bg-emerald-500 text-zinc-950 tracking-wider">
      Entrada: R$ {requiredDownpayment.toLocaleString('pt-BR')}
    </div>
  </div>

  {/* Auto dynamic calculations result band */}
  {(() => {
    const totalFacilitadoAvulso = valorAto + (2 * valorAnual) + valorChaves;
    const diferencaRestante = Math.max(0, requiredDownpayment - totalFacilitadoAvulso);
    const valorMensalObra = tempoObra > 0 ? (diferencaRestante / tempoObra) : 0;

    return (
      <div className="relative z-10 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div>
          <span className="block text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">Total Sinal + Balões</span>
          <strong className="block text-xs font-sans font-black text-zinc-350 mt-1">
            R$ {totalFacilitadoAvulso.toLocaleString('pt-BR')}
          </strong>
          <span className="text-[8.5px] text-zinc-500 font-mono italic">
            (Ato + 2 Anuais + Chaves)
          </span>
        </div>

        <div className="border-t md:border-t-0 md:border-l md:border-r border-zinc-800 py-1.5 md:py-0 md:px-3">
          <span className="block text-[8px] font-mono font-black text-amber-400 uppercase leading-none">Diferença Restante</span>
          <strong className="block text-xs font-sans font-black text-amber-300 mt-1">
            R$ {diferencaRestante.toLocaleString('pt-BR')}
          </strong>
          <span className="text-[8.5px] text-zinc-500 font-mono italic">
            (Saldo restante para obras)
          </span>
        </div>

        <div className="bg-emerald-950/55 border border-emerald-800 p-2 text-center rounded-lg">
          <span className="text-[9px] font-mono font-black text-emerald-300 uppercase block tracking-wider leading-none">
            MENSAL OBRA ({tempoObra}X)
          </span>
          <strong className="block text-sm font-mono font-black text-emerald-400 mt-1">
            R$ {Math.round(valorMensalObra).toLocaleString('pt-BR')} /mês
          </strong>
          <span className="text-[8px] text-zinc-400 block mt-0.5 font-sans">
            Dividido automaticamente pelo tempo de obra
          </span>
        </div>
      </div>
    );
  })()}
</div>
`;

if (destRegex.test(content)) {
  content = content.replace(destRegex, `                </div>
              ${cleanPC}
              </div>
            </div>

            {/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}`);
  console.log("Applied clean PC!");
} else {
  console.log("Dest not found!");
}

fs.writeFileSync('src/components/FinanceSimulatorTab.tsx', content);
