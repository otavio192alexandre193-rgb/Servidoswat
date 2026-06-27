const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<KanbanBoard\n([\s\S]*?)leads=\{currentLeadsArray\}/g,
  '<KanbanBoard\n$1layoutZoom={layoutZoom}\nleads={currentLeadsArray}'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added layoutZoom to KanbanBoard instances");
