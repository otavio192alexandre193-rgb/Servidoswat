import fs from 'fs';

const code = fs.readFileSync('src/components/FollowUpManager.tsx', 'utf8');
let openCount = 0;
let lastUnmatchedLine = -1;
let line = 1;

for (let i = 0; i < code.length; i++) {
  if (code[i] === '\n') line++;
  if (code[i] === '(') {
    // maybe print to see?
    openCount++;
  } else if (code[i] === ')') {
    openCount--;
  }
}
console.log('Parens openCount:', openCount);

openCount = 0;
for (let i = 0; i < code.length; i++) {
  if (code[i] === '\n') line++;
  if (code[i] === '{') openCount++;
  else if (code[i] === '}') openCount--;
}
console.log('Braces openCount:', openCount);

openCount = 0;
for (let i = 0; i < code.length; i++) {
  if (code[i] === '\n') line++;
  if (code[i] === '<') openCount++;
  else if (code[i] === '>') openCount--;
}
console.log('JSX Angles maybe openCount:', openCount);
