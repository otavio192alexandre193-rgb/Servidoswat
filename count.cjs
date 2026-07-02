const fs = require('fs');
const content = fs.readFileSync('src/components/FinanceSimulatorTab.tsx', 'utf-8');

const calc1Regex = /\{\/\* CALCULATOR 1 SCREEN: FINANCIAMENTO HABITACIONAL \*\/\}([\s\S]*?)\{\/\* CALCULATOR 2 SCREEN: SIMULADOR DE FLUXO DE VENDA OBRAS \*\/\}/;
const match = content.match(calc1Regex);
if (match) {
  const block = match[1];
  let openCount = (block.match(/<div/g) || []).length;
  let closeCount = (block.match(/<\/div>/g) || []).length;
  console.log(`CALC1 Divs -> Open: ${openCount}, Close: ${closeCount}`);
}

const calc2Regex = /\{\/\* CALCULATOR 2 SCREEN: SIMULADOR DE FLUXO DE VENDA OBRAS \*\/\}([\s\S]*?)\{\/\* 3\. EXTRATO DETALHADO DO FINANCIAMENTO \*\/\}/;
const match2 = content.match(calc2Regex);
if (match2) {
  const block = match2[1];
  let openCount = (block.match(/<div/g) || []).length;
  let closeCount = (block.match(/<\/div>/g) || []).length;
  console.log(`CALC2 Divs -> Open: ${openCount}, Close: ${closeCount}`);
}
