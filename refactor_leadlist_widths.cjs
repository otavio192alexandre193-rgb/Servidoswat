const fs = require('fs');
const path = 'src/components/LeadList.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace min-w-[170px] md:min-w-[225px]
content = content.replace(/min-w-\[170px\] md:min-w-\[225px\]/g, 'w-[20%] break-words');
// Replace min-w-[145px] md:min-w-[180px]
content = content.replace(/min-w-\[145px\] md:min-w-\[180px\]/g, 'w-[12%] break-words');
// Replace other min-w in td
content = content.replace(/min-w-\[120px\]/g, 'break-words');
content = content.replace(/min-w-\[100px\]/g, 'break-words');
content = content.replace(/min-w-\[140px\]/g, 'break-words');
content = content.replace(/min-w-\[150px\]/g, 'break-words');

fs.writeFileSync(path, content, 'utf8');
console.log("Removed min-w constraints from LeadList");
