import fs from 'fs';
import path from 'path';

const replaceFile = (filePath: string, replacements: {from: string | RegExp, to: string}[]) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const {from, to} of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filePath, content);
};

replaceFile('src/components/cognitive/renderers/FlowchartRenderer.tsx', [
  {
    from: /<div style={{ width, height }} className="bg-zinc-950 p-8 overflow-auto relative flex items-center justify-start min-w-max gap-24 px-24">/g,
    to: '<div className="w-full h-full bg-zinc-950 p-8 overflow-auto relative">\n      {/* Background Grid Pattern */}\n      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: \'radial-gradient(#3f3f46 1px, transparent 1px)\', backgroundSize: \'24px 24px\' }} />\n      <div className="flex items-center justify-start min-w-max gap-24 px-24 relative z-10">'
  },
  {
    from: /\{\/\* Background Grid Pattern \*\/\}\n      <div className="absolute inset-0 opacity-20 pointer-events-none" style=\{\{ backgroundImage: 'radial-gradient\(#3f3f46 1px, transparent 1px\)', backgroundSize: '24px 24px' \}\} \/>\n/g,
    to: ''
  },
  {
    from: /<\/div>\n  \);\n}/g,
    to: '      </div>\n    </div>\n  );\n}'
  }
]);

replaceFile('src/components/cognitive/renderers/TreeRenderer.tsx', [
  {
    from: /<div style={{ width, height }} className="bg-zinc-950 p-12 overflow-auto flex items-start justify-center">/g,
    to: '<div className="w-full h-full bg-zinc-950 p-12 overflow-auto">\n       <div className="flex items-start justify-center min-w-max min-h-max">'
  },
  {
    from: /<\/div>\n    <\/div>\n  \);\n}/g,
    to: '       </div>\n    </div>\n  );\n}'
  }
]);

replaceFile('src/components/cognitive/renderers/TimelineRenderer.tsx', [
  {
    from: /<div style={{ width, height }} className="relative overflow-auto bg-zinc-950 p-12">/g,
    to: '<div className="w-full h-full relative overflow-auto bg-zinc-950 p-12">'
  }
]);

replaceFile('src/components/cognitive/renderers/MatrixRenderer.tsx', [
  {
    from: /<div style={{ width, height }} className="bg-zinc-950 p-8 flex flex-col items-center justify-center">/g,
    to: '<div className="w-full h-full bg-zinc-950 p-8 flex flex-col items-center overflow-auto">\n       <div className="w-full max-w-5xl aspect-square min-h-[600px] min-w-[600px] grid grid-cols-2 grid-rows-2 gap-4 relative mx-auto my-auto">'
  },
  {
    from: /<div className="w-full max-w-5xl aspect-square grid grid-cols-2 grid-rows-2 gap-4 relative">/g,
    to: ''
  }
]);
