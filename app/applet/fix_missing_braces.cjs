const fs = require('fs');
const cp = require('child_process');

console.log('Running tsc...');
let tscOutput = '';
try {
  tscOutput = cp.execSync('npx tsc --noEmit', { encoding: 'utf-8' });
} catch (e) {
  tscOutput = e.stdout;
}

const lines = tscOutput.split('\n');
const fixes = {}; 

lines.forEach(line => {
  // src/App.tsx(5105,13): error TS1005: '}' expected.
  const match = line.match(/^([^:]+)\((\d+),\d+\): error TS1005: '\}' expected/);
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2], 10);
    if (!fixes[file]) fixes[file] = [];
    fixes[file].push(lineNum);
  }
});

for (const file of Object.keys(fixes)) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf-8').split('\n');
  const lineFixes = [...new Set(fixes[file])].sort((a,b)=>b-a);
  
  let changed = false;
  lineFixes.forEach(ln => {
    // ln is 1-indexed. let's look backwards from idx = ln - 1
    let idx = ln - 1;
    // tsc error might be exactly at the line or on the following line
    // find first non-empty line going backwards
    while(idx >= 0 && content[idx].trim() === '') {
      idx--;
    }
    if (idx >= 0) {
      if (content[idx].trim() === ')') {
        content[idx] = content[idx].replace(/\)\s*$/, ')}');
        changed = true;
      } else if (content[idx].trim().endsWith(')')) {
        content[idx] = content[idx] + '}';
        changed = true;
      } else {
        // If the line doesn't end in ), it might be that a } was stripped from the end
        // Let's just append }
        content[idx] = content[idx] + '}';
        changed = true;
      }
    }
  });

  if(changed) {
    fs.writeFileSync(file, content.join('\n'));
    console.log('Added } to ' + file);
  }
}
