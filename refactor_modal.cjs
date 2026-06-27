const fs = require('fs');
const path = 'src/components/LeadDetailsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Single layout for the grid
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-zinc-950 rounded-lg overflow-hidden bg-white shadow-sm">/,
  '<div className="grid grid-cols-1 gap-0 border-2 border-zinc-950 rounded-lg overflow-hidden bg-white shadow-sm">'
);

// Remove md:border-r-2 from left column
content = content.replace(
  /<div className="flex flex-col border-r-0 md:border-r-2 border-zinc-950">/,
  '<div className="flex flex-col border-r-0">'
);

// Fix top border for right column
content = content.replace(
  /<div className="bg-blue-100\/60 border-b-2 border-zinc-950 py-2 text-center border-t-2 md:border-t-0 border-zinc-950">/,
  '<div className="bg-blue-100/60 border-y-2 border-zinc-950 py-2 text-center">'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored grid");
