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
  
  // Remove motion props handling multi-line props 
  // It's dangerous to do simple regex for nested objects, but let's try a safe one for one-liners
  content = content.replace(/\b(?:initial|animate|exit|transition|whileHover|whileTap|layoutId|layout)=\{[^}]+\}/g, '');
  // sometimes they have double brackets like transition={{ duration: 0.3 }}
  content = content.replace(/\b(?:initial|animate|exit|transition|whileHover|whileTap|layoutId|layout)=\{\{.*?\}\}/g, '');

  content = content.replace(/\banimate-[a-zA-Z0-9A-Z]+/g, ''); // Tailwind custom animations

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
