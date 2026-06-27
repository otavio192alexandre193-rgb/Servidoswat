const fs = require('fs');
const path = 'src/components/LeadDetailsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer"/g,
  'className="w-full bg-zinc-50 border border-zinc-200 p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer text-xs font-bold"'
);

content = content.replace(
  /className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"/g,
  'className="w-full bg-zinc-50 border border-zinc-200 p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded text-xs font-bold"'
);

content = content.replace(
  /className={`w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded \${item.readOnly \? 'text-zinc-400' : ''}`}/g,
  'className={`w-full bg-zinc-50 border border-zinc-200 p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded text-xs font-bold ${item.readOnly ? \'text-zinc-400 bg-zinc-100\' : \'\'}`}'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored inputs");
