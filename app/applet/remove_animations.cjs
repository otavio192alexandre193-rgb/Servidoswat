const fs = require('fs');
const file = 'src/components/KanbanBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/transition-all duration-300/g, 'transition-colors');
content = content.replace(/transition-all/g, 'transition-colors');
content = content.replace(/transition-transform duration-300/g, '');
content = content.replace(/animate-pulse/g, '');
content = content.replace(/animate-bounce/g, '');
content = content.replace(/animate-spin/g, '');
content = content.replace(/transition-shadow/g, '');
content = content.replace(/transition-\[border-color,box-shadow,transform,background-color\] duration-200/g, 'transition-colors');

fs.writeFileSync(file, content);
console.log('Done cleaning animations!');
