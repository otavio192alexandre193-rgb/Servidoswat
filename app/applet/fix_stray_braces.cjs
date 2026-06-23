const fs = require('fs');
const cp = require('child_process');

// Run tsc to get all errors
console.log('Running tsc...');
let tscOutput = '';
try {
  tscOutput = cp.execSync('npx tsc --noEmit', { encoding: 'utf-8' });
} catch (e) {
  tscOutput = e.stdout;
}

const lines = tscOutput.split('\n');
const fixes = {}; // { filepath: [lineNumbers to delete/fix] }

lines.forEach(line => {
  const match = line.match(/^([^:]+)\((\d+),\d+\): error TS(?:1381|1382|1005|1109|1128|1003|17002):/);
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2], 10);
    if (!fixes[file]) fixes[file] = [];
    fixes[file].push(lineNum);
  }
});

for (const file of Object.keys(fixes)) {
  if (!fs.existsSync(file)) continue;
  const contentLines = fs.readFileSync(file, 'utf-8').split('\n');
  const linesToFix = fixes[file].sort((a,b) => b-a); // reverse to not mess up indices
  
  let changed = false;
  for (const lineNum of linesToFix) {
    const idx = lineNum - 1;
    if (contentLines[idx].trim() === '}' || contentLines[idx].trim() === ']' || contentLines[idx].trim() === '}') {
      contentLines.splice(idx, 1);
      changed = true;
    } else if (contentLines[idx].includes('}')) {
       // if it's like a trailing } 
       contentLines[idx] = contentLines[idx].replace(/}\s*$/, '');
       changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, contentLines.join('\n'));
    console.log(`Fixed ${file}`);
  }
}
