const fs = require('fs');

function removeAnimations(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove framer-motion imports
  content = content.replace(/import\s*\{[^}]*(?:motion|AnimatePresence)[^}]*\}\s*from\s+['"]motion\/react['"];/gi, '');
  
  // Replace <motion.div with <div
  content = content.replace(/<motion\.([a-zA-Z0-9]+)/g, '<$1');
  content = content.replace(/<\/motion\.([a-zA-Z0-9]+)>/g, '</$1>');
  
  // Remove <AnimatePresence> wrappers
  content = content.replace(/<\/?AnimatePresence(?:[^>]*)>/g, '');
  
  // Regex to match initial={{...}} and similar. 
  // We can just use a simple regex to remove initial=... animate=... exit=... transition=...
  // if they are on the same line.
  content = content.replace(/\b(?:initial|animate|exit|transition|whileHover|whileTap|layoutId|layout|variants|custom)=\{{1,2}[^}]+\}{1,2}/g, '');

  content = content.replace(/\banimate-[a-zA-Z0-9A-Z_]+/g, ''); // Tailwind custom animations

  fs.writeFileSync(filePath, content);
}

const files = [
  'src/App.tsx',
  'src/components/KanbanBoard.tsx',
  'src/components/LeadList.tsx',
  'src/components/GoogleWorkspace.tsx',
  'src/components/FollowUpManager.tsx',
  'src/components/LeadDetailsModal.tsx',
  'src/components/CreateLeadModal.tsx',
  'src/components/RealEstateInventory.tsx',
  'src/components/ToolsServices.tsx',
  'src/components/Simulators.tsx',
  'src/components/Gamification.tsx'
];

files.forEach(f => {
  try {
    removeAnimations(f);
    console.log('Processed', f);
  } catch(e){
    console.log('Skipped or failed', f, e.message);
  }
});
