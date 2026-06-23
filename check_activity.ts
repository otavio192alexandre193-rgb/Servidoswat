import fs from 'fs';
const files = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx'));
for (const file of files) {
  const content = fs.readFileSync(`src/components/${file}`, 'utf8');
  if (content.includes('<Activity') || content.includes('Activity,')) {
     const hasImport = content.match(/import\s+{[^}]*Activity[^}]*}\s+from\s+['"]lucide-react['"]/m);
     if (!hasImport) {
        console.log(`Missing Activity import in ${file}`);
     }
  }
}
