const babel = require('@babel/core');
const fs = require('fs');

const code = fs.readFileSync('src/components/LeadDetailsModal.tsx', 'utf-8');

try {
  babel.parseSync(code, {
    filename: 'LeadDetailsModal.tsx',
    presets: ['@babel/preset-typescript', '@babel/preset-react']
  });
  console.log("Babel parsed successfully!");
} catch (err) {
  console.log(err.message);
}
