const fs = require('fs');
const path = 'src/components/LeadList.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure selects/inputs are w-full
content = content.replace(/w-\[120px\]/g, 'w-full max-w-[120px]');
content = content.replace(/w-\[130px\]/g, 'w-full max-w-[130px]');
content = content.replace(/max-w-\[145px\] md:max-w-\[210px\]/g, 'w-full max-w-[180px]');

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored input widths");
