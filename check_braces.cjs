const fs = require('fs');
const content = fs.readFileSync('src/components/LeadDetailsModal.tsx', 'utf-8');

const singleQuotes = (content.match(/'/g) || []).length;
const doubleQuotes = (content.match(/"/g) || []).length;
const backticks = (content.match(/`/g) || []).length;

console.log(`': ${singleQuotes} (odd? ${singleQuotes % 2 !== 0})`);
console.log(`": ${doubleQuotes} (odd? ${doubleQuotes % 2 !== 0})`);
console.log(`\`: ${backticks} (odd? ${backticks % 2 !== 0})`);
