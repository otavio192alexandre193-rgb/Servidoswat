import fs from 'fs';
import path from 'path';

const dir = 'src/components/cognitive/renderers';
const files = fs.readdirSync(dir);

files.forEach(file => {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/\\`/g, '`');
  fs.writeFileSync(filePath, newContent);
});
