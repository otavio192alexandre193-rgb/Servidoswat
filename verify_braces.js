const fs = require('fs');
const content = fs.readFileSync('src/components/LeadList.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let r = 2505; r < 3055; r++) { // line indices 2506 to 3056
  let line = lines[r];
  if (!line) continue;
  let i = 0;
  while (i < line.length) {
    let char = line[i];
    if (char === '/' && line[i+1] === '/') break;
    // Skip string literals
    if (char === '"' || char === "'" || char === '`') {
      let quote = char;
      i++;
      while (i < line.length && line[i] !== quote) {
        if (line[i] === '\\') i += 2;
        else i++;
      }
      i++;
      continue;
    }
    if (char === '(' || char === '{' || char === '[') {
      stack.push({ char, line: r + 1, col: i + 1 });
    } else if (char === ')' || char === '}' || char === ']') {
      if (stack.length > 0) {
        let top = stack[stack.length - 1];
        if (
          (char === ')' && top.char === '(') ||
          (char === '}' && top.char === '{') ||
          (char === ']' && top.char === '[')
        ) {
          stack.pop();
        } else {
          console.log(`Mismatch on line ${r+1} (index ${r}): found '${char}' but last opened was '${top.char}' from line ${top.line}`);
          stack.pop();
        }
      } else {
        console.log(`Unexpected closing '${char}' on line ${r+1} (index ${r}), col ${i+1}`);
      }
    }
    i++;
  }
}

console.log("\nEnding Stack:");
stack.forEach(item => {
  console.log(`Unclosed '${item.char}' on line ${item.line}`);
});
