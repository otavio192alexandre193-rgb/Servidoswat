const fs = require('fs');
const path = 'src/components/KanbanBoard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /className=\{`grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-colors \$\{/g,
  'style={{ zoom: `${layoutZoom}%` }}\n                    className={`grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-row gap-6 items-start overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 select-none transition-colors ${'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added layoutZoom to KanbanBoard columns container");
