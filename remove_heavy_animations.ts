import fs from 'fs';
import path from 'path';

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace transition-all with transition-colors
  content = content.replace(/transition-all duration-\d+/g, 'transition-colors');
  content = content.replace(/transition-all/g, 'transition-colors');
  
  // Remove heavy animations, leaving space in classNames just in case
  content = content.replace(/\banimate-pulse\b/g, '');
  content = content.replace(/\banimate-bounce\b/g, '');
  content = content.replace(/\banimate-spin-slow\b/g, '');
  content = content.replace(/\banimate-spin\b/g, '');
  content = content.replace(/\banimate-ping\b/g, '');
  content = content.replace(/\banimate-in\b/g, '');
  content = content.replace(/\bslide-in-from-\w+\b/g, '');
  content = content.replace(/\bduration-\d+\b/g, '');

  // Remove heavy backdrop blurs
  content = content.replace(/\bbackdrop-blur-\w+\b/g, '');
  content = content.replace(/\bbackdrop-blur\b/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
console.log('Finished removing heavy animations.');
