const fs = require('fs');
let content = fs.readFileSync('src/components/FinanceSimulatorTab.tsx', 'utf-8');

const pcRegex = /\{\/\* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA \*\/\}\s*<div className="bg-zinc-900 text-white p-5 rounded-2xl space-y-4 border-2 border-zinc-950 shadow-\[3px_3px_0px_0px_rgba\(0,0,0,1\)\] relative overflow-hidden animate-fadeIn">([\s\S]*?)<\/div>\s*<\/div>/;
const match = content.match(pcRegex);

if (match) {
  let pcBlock = `
{/* PLANO DE PARCELAMENTO FACILITADO COM A CONSTRUTORA */}
<div className="bg-zinc-900 text-white p-4 rounded-xl space-y-3 border-2 border-zinc-950 relative overflow-hidden animate-fadeIn scale-[0.98] origin-top">
${match[1]}
</div>
</div>
`;
  content = content.replace(match[0], "");

  // Now find where Inteligência Preditiva ends.
  // It ends around here:
  //                 </div>
  //               </div>
  //             </div>
  // 
  //             {/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}
  const destRegex = /                <\/div>\s*<\/div>\s*<\/div>\s*\{\/\* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS \*\/\}/;
  const destMatch = content.match(destRegex);
  if (destMatch) {
    content = content.replace(destRegex, `
                </div>
                ${pcBlock}
              </div>
            </div>

            {/* CHECKLIST DE ENQUADRAMENTO E DOSSIÊ DE DOCUMENTOS */}
`);
    fs.writeFileSync('src/components/FinanceSimulatorTab.tsx', content);
    console.log("Moved Plano Corretor!");
  } else {
    console.log("Could not find destination!");
  }
} else {
  console.log("Could not find Plano Corretor to move!");
}
