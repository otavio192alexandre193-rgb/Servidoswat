import fs from 'fs';
const content = fs.readFileSync('src/components/FollowUpManager.tsx', 'utf8');
const index = content.indexOf('          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-zinc-200 pb-3 gap-3">');
if (index > -1) {
  fs.writeFileSync('src/components/FollowUpManager.tsx', content.substring(0, index));
}
