const fs = require('fs');
const path = require('path');

try {
  const file = path.join(__dirname, 'src/components/KanbanBoard.tsx');
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/transition-all duration-300/g, 'transition-colors');
  content = content.replace(/transition-all/g, 'transition-colors');
  content = content.replace(/transition-transform duration-300/g, '');
  content = content.replace(/transition-transform/g, '');
  content = content.replace(/animate-pulse/g, '');
  content = content.replace(/animate-bounce/g, '');
  content = content.replace(/animate-spin/g, '');
  content = content.replace(/transition-shadow/g, '');
  content = content.replace(/transition-\[border-color,box-shadow,transform,background-color\] duration-200/g, 'transition-colors');

  fs.writeFileSync(file, content);
  console.log('Successfully updated KanbanBoard.tsx');
} catch (e) {
  console.error('Error:', e);
}
