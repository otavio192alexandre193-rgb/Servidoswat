const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/KanbanBoard.tsx',
  'src/components/FollowUpManager.tsx',
  'src/components/RealEstateInventory.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf-8');
  
  // Rule 1: fix closing parentheses that should be )}
  // usually they look like:
  //       </div>
  //     )
  // Let's replace line containing ONLY `)` (with indent) that comes after `</div>`
  content = content.replace(/(<\/div>\s*\n\s*)\)(\s*\n)/g, '$1)}$2');
  
  // Rule 2: same for `</>`) or `</KanbanBoard>`) or `</FollowUpManager>`)
  content = content.replace(/(<\/[A-Za-z0-9_]+>\s*\n\s*)\)(\s*\n)/g, '$1)}$2');
  
  // Rule 3: some might be after `/>` instead of `</...>`
  content = content.replace(/(\/>\s*\n\s*)\)(\s*\n)/g, '$1)}$2');

  // Rule 4: fix invalid '}' added to comments
  content = content.replace(/\*\/(\s*)\}+/g, '*/$1');

  // Rule 5: fix invalid '}' added to empty lines or html tags
  // Actually let's just remove any standalone `}` or `}}` if they are causing errors, but wait, 
  // maybe we don't need to if we fix the `)` that was causing the cascading errors.
  
  // Rule 6: `className="w-full space-y-6 "} ` -> `className="w-full space-y-6" ` 
  content = content.replace(/"\s*\}+/g, '"');
  
  fs.writeFileSync(f, content);
  console.log('Fixed patterns in', f);
});
