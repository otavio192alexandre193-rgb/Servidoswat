const fs = require('fs');
const content = fs.readFileSync('src/components/LeadDetailsModal.tsx', 'utf-8');

let divDepth = 0;
const lines = content.split('\n');

let insideJsx = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Very rough approximation of JSX start
  if (line.includes('const modalContent = (')) {
     insideJsx = true;
  }
  
  if (insideJsx) {
    const opens = (line.match(/<div(\s|>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    
    divDepth += opens;
    divDepth -= closes;
    
    if (divDepth < 0) {
      console.log(`NEGATIVE DEPTH AT LINE ${i + 1}: ${line}`);
    }
  }
}
console.log('Final depth:', divDepth);
