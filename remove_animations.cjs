const fs = require('fs');
const files = [
  'src/components/LeadDetailsModal.tsx',
  'src/components/FollowUpsTable.tsx',
  'src/components/KanbanBoard.tsx',
  'src/components/ScheduleFollowUpModal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/animate-pulse/g, '');
  content = content.replace(/animate-spin/g, '');
  content = content.replace(/animate-in fade-in zoom-in-95 duration-150/g, '');
  fs.writeFileSync(file, content);
}
console.log('Animations removed.');
