const fs = require('fs');

function removeAnimations(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove framer-motion imports
  content = content.replace(/import\s*\{[^}]*motion[^}]*\}\s*from\s+['"]motion\/react['"];/g, '');
  content = content.replace(/import\s*\{[^}]*AnimatePresence[^}]*\}\s*from\s+['"]motion\/react['"];/g, '');
  content = content.replace(/import\s*\{[^}]*motion,\s*AnimatePresence[^}]*\}\s*from\s+['"]motion\/react['"];/g, '');
  
  // Replace <motion.div with <div
  content = content.replace(/<motion\.([a-zA-Z0-9]+)/g, '<$1');
  content = content.replace(/<\/motion\.([a-zA-Z0-9]+)>/g, '</$1>');
  
  // Remove <AnimatePresence> wrappers
  content = content.replace(/<\/?AnimatePresence(?:[^>]*)>/g, '');
  
  // Remove motion props
  content = content.replace(/\b(initial|animate|exit|transition|whileHover|whileTap|layoutId|layout)=\{[^}]+\}/g, '');
  // Sometimes they are nested or multiline, but basic regex catches most.
  // We'll also remove them if they have string values like layout="position"
  content = content.replace(/\blayout=['"][^'"]*['"]/g, '');

  content = content.replace(/\banimate-[a-zA-Z0-9]+/g, ''); // Tailwind custom animations

  fs.writeFileSync(filePath, content);
}

removeAnimations('src/App.tsx');
try { removeAnimations('src/components/KanbanBoard.tsx'); } catch(e){}
try { removeAnimations('src/components/LeadList.tsx'); } catch(e){}
try { removeAnimations('src/components/GoogleWorkspace.tsx'); } catch(e){}
try { removeAnimations('src/components/FollowUpManager.tsx'); } catch(e){}
try { removeAnimations('src/components/LeadDetailsModal.tsx'); } catch(e){}
try { removeAnimations('src/components/CreateLeadModal.tsx'); } catch(e){}
try { removeAnimations('src/components/RealEstateInventory.tsx'); } catch(e){}
try { removeAnimations('src/components/ToolsServices.tsx'); } catch(e){}
try { removeAnimations('src/components/Simulators.tsx'); } catch(e){}
try { removeAnimations('src/components/Gamification.tsx'); } catch(e){}
