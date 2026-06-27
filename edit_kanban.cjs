const fs = require('fs');
const content = fs.readFileSync('src/components/KanbanBoard.tsx', 'utf8');
const lines = content.split('\n');

// 1. Add import
const importIdx = lines.findIndex(l => l.includes('import { handleWhatsAppAction }'));
lines.splice(importIdx, 0, 'import CognitiveMap from "./CognitiveMap";');

// 2. Replace the canvas block
const startIdx = lines.findIndex(l => l.includes('Elegant faint dot pattern background for NotebookLM look')) - 1;
const endIdx = lines.findIndex(l => l.includes('Option for bottom border expansion by dragging down')) - 1;

if (startIdx > 0 && endIdx > startIdx) {
  lines.splice(startIdx, endIdx - startIdx, '              <CognitiveMap leads={mapaFilteredLeads} height={mapHeight} />');
  fs.writeFileSync('src/components/KanbanBoard.tsx', lines.join('\n'));
  console.log('Successfully modified KanbanBoard.tsx');
} else {
  console.log('Could not find markers', startIdx, endIdx);
}
