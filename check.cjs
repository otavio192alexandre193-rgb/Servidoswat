const fs = require('fs');
const lines = fs.readFileSync('src/components/LeadDetailsModal.tsx', 'utf-8').split('\n');
console.log("Line 1894:", JSON.stringify(lines[1893]));
console.log("Line 1895:", JSON.stringify(lines[1894]));
console.log("Line 1896:", JSON.stringify(lines[1895]));
