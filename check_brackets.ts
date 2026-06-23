import fs from 'fs';

const code = fs.readFileSync('src/components/FollowUpManager.tsx', 'utf8');

// Basic bracket matching
let line = 1;
const stack: {char: string, line: number}[] = [];

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  if (char === '\n') {
    line++;
  } else if (char === '{' || char === '(' || char === '[') {
    stack.push({ char, line });
  } else if (char === '}' || char === ')' || char === ']') {
    const last = stack.pop();
    if (!last) {
      console.log(`Unmatched closing ${char} at line ${line}`);
      break;
    }
    const match = last.char === '{' ? '}' : last.char === '(' ? ')' : ']';
    if (match !== char) {
      console.log(`Mismatched closing ${char} at line ${line}, expected ${match} (opened at ${last.line})`);
      break;
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed brackets:');
  for (const s of stack) {
    console.log(`- ${s.char} opened at line ${s.line}`);
  }
} else {
  console.log('All brackets match.');
}
