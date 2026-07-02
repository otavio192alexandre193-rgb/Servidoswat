const fs = require('fs');

let content = fs.readFileSync('src/components/FinanceSimulatorTab.tsx', 'utf-8');

// Step 1: Add showChecklist state
content = content.replace(
  /const \[searchTerm, setSearchTerm\] = useState\(''\);/,
  "const [searchTerm, setSearchTerm] = useState('');\n  const [showChecklist, setShowChecklist] = useState(false);"
);

// Step 2: Add toggle checklist button in left column (Formulário)
const formHeaderStr = `<span className="text-[10px] font-mono font-black text-indigo-650 uppercase">Formulário Habitacional</span>
              <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight -mt-1 leading-none">
                Simulador de Crédito
              </h3>`;
content = content.replace(
  formHeaderStr,
  `<div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-black text-indigo-650 uppercase">Formulário Habitacional</span>
                  <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight -mt-1 leading-none">
                    Simulador de Crédito
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowChecklist(!showChecklist)}
                  className="bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase tracking-wider font-mono rounded-lg px-2 py-1 border border-indigo-400 hover:bg-indigo-200 transition-colors"
                >
                  {showChecklist ? "Ocultar Checklist" : "Ver Checklist"}
                </button>
              </div>`
);

// Step 3: Extract "Os quatro bloquinhos" (Inputs for downpayment)
const fourBlocksRegex = /\{\/\* Inputs for downpayment facilitation layout \*\/\}\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 text-xs">([\s\S]*?)<\/div>\s*\{\/\* Auto dynamic calculations result band \*\/\}/;
const fourBlocksMatch = content.match(fourBlocksRegex);
let fourBlocks = "";
if (fourBlocksMatch) {
  fourBlocks = `{/* Inputs for downpayment facilitation layout */}\n<div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 text-xs">\n${fourBlocksMatch[1]}</div>\n`;
  content = content.replace(fourBlocksMatch[0], "{/* Auto dynamic calculations result band */}");
}

// Step 4: Extract "Distribuição de Recursos Requeridos"
const distribRegex = /<div className="space-y-3 relative z-10">\s*<h4 className="text-\[11px\] font-mono font-black text-zinc-550 uppercase border-b pb-1">Distribuição de Recursos Requeridos<\/h4>([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS \*\/\}/;
const distribMatch = content.match(distribRegex);
let distribBlock = "";
if (distribMatch) {
  distribBlock = `<div className="space-y-3 relative z-10">\n<h4 className="text-[11px] font-mono font-black text-zinc-550 uppercase border-b pb-1">Distribuição de Recursos Requeridos</h4>${distribMatch[1]}</div>\n`;
  content = content.replace(distribMatch[0], "{/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}");
}

// Step 5: Extract & Remove "2. Parcela da Entrada Facilitada"
const parcela2Regex = /\{\/\* 2\. FACILITATED DOWNPAYMENT ITEM \*\/\}\s*\{\(\(\) => \{[\s\S]*?\}\)\(\)\}/;
content = content.replace(parcela2Regex, "");

// Step 6: Extract the rest of "Plano Corretor Completo"
const planoCorretorRegex = /\{\/\* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA \*\/\}\s*<div className="bg-zinc-900 text-white p-5 rounded-2xl space-y-4 border-2 border-zinc-950 shadow-\[3px_3px_0px_0px_rgba\(0,0,0,1\)\] relative overflow-hidden animate-fadeIn">([\s\S]*?)(?:<\/div>\s*){2}\{\/\* Smart info list bullet \*\/\}/;
const planoCorretorMatch = content.match(planoCorretorRegex);
let planoCorretorBlock = "";
if (planoCorretorMatch) {
  planoCorretorBlock = `
{/* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA */}
<div className="bg-zinc-900 text-white p-4 rounded-xl space-y-3 border-2 border-zinc-950 relative overflow-hidden animate-fadeIn scale-[0.98] origin-top">
${planoCorretorMatch[1]}
</div>
</div>
`;
  content = content.replace(planoCorretorMatch[0], "{/* Smart info list bullet */}");
} else {
  console.log("Could not find Plano Corretor!");
  const fallbackRegex = /\{\/\* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA \*\/\}\s*<div className="bg-zinc-900 text-white p-5 rounded-2xl space-y-4 border-2 border-zinc-950 shadow-\[3px_3px_0px_0px_rgba\(0,0,0,1\)\] relative overflow-hidden animate-fadeIn">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* Smart info list bullet \*\/\}/;
  const match2 = content.match(fallbackRegex);
  if(match2) {
    planoCorretorBlock = `
    {/* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA */}
    <div className="bg-zinc-900 text-white p-4 rounded-xl space-y-3 border-2 border-zinc-950 relative overflow-hidden animate-fadeIn scale-[0.98] origin-top">
    ${match2[1]}
    </div>
    </div>
    `;
    content = content.replace(match2[0], "{/* Smart info list bullet */}");
  } else {
    console.log("Could not find Plano Corretor fallback!");
  }
}

// Step 7: Re-assemble Right Column (Inteligência Preditiva)
const rightColumnRegex = /\{\/\* RIGHT COLUMN: Inteligência Preditiva \*\/\}\s*<div className="bg-zinc-50 border-4 border-zinc-950 p-6 rounded-3xl space-y-4 relative overflow-hidden">\s*<div className="absolute right-0 bottom-0 text-\[100px\] font-black font-sans -mr-8 -mb-10 text-zinc-200\/40 select-none pointer-events-none">CAIXA<\/div>\s*<div className="space-y-4 relative z-10">\s*<h4 className="text-\[11px\] font-mono font-black text-zinc-550 uppercase border-b pb-1">Inteligência Preditiva: Parcelas Mensais<\/h4>([\s\S]*?)<\/div>\s*<\/div>/;

const rcMatch = content.match(rightColumnRegex);
if (rcMatch) {
  let rcContent = rcMatch[1];
  let newRcContent = `
{/* RIGHT COLUMN: Inteligência Preditiva */}
<div className="bg-zinc-50 border-4 border-zinc-950 p-6 rounded-3xl space-y-4 relative overflow-hidden">
  <div className="absolute right-0 bottom-0 text-[100px] font-black font-sans -mr-8 -mb-10 text-zinc-200/40 select-none pointer-events-none">CAIXA</div>

  <div className="space-y-4 relative z-10">
    ${fourBlocks}
    ${distribBlock}
    
    <h4 className="text-[11px] font-mono font-black text-zinc-550 uppercase border-b pb-1 mt-4">Inteligência Preditiva: Parcelas Mensais</h4>
    ${rcContent}
    
    ${planoCorretorBlock}
  </div>
</div>
`;
  content = content.replace(rightColumnRegex, newRcContent);
} else {
  console.log("Could not find right column!");
}

// Step 8: Conditionally render Checklist
content = content.replace(
  /\{\/\* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS \*\/\}/,
  "{/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}\n{showChecklist && ("
);
content = content.replace(
  /\{\/\* Smart info list bullet \*\/\}/,
  ")}\n{/* Smart info list bullet */}"
);

fs.writeFileSync('src/components/FinanceSimulatorTab.tsx', content);
console.log("Patch completed");
