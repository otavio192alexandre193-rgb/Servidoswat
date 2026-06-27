const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace container classes
content = content.replace(
  /const containerClasses = isMarketingTab\n[\s\S]*?border-t-0";/,
  `const containerClasses = isMarketingTab
      ? "bg-transparent pb-2 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased mb-1"
      : isDashboardTab
        ? "bg-zinc-950 px-3 py-2 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased text-white border border-zinc-800 rounded-xl"
        : "bg-zinc-900 px-3 py-2 shrink-0 flex flex-col gap-2 select-none relative z-30 w-full antialiased text-white border-b-2 border-zinc-950";`
);

// Replace button classes
content = content.replace(
  /const leftButtonsClass = isMarketingTab[\s\S]*?shrink-0";/,
  `const leftButtonsClass = "w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-black flex items-center justify-center relative cursor-pointer transition-colors shrink-0";`
);

content = content.replace(
  /const rightButtonsClass = isMarketingTab[\s\S]*?shrink-0";/,
  `const rightButtonsClass = "w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-black flex items-center justify-center relative cursor-pointer transition-colors shrink-0";`
);

// Replace input class
content = content.replace(
  /const inputClass = isMarketingTab[\s\S]*?transition-colors";/,
  `const inputClass = "w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] md:text-xs font-mono font-medium pl-10 pr-3 py-2 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors";`
);

// Replace the large search icon padding/size
content = content.replace(
  /<Search className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 absolute left-4" \/>/,
  `<Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5" />`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored search bar");
