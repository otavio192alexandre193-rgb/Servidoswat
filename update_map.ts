import fs from 'fs';

const filePath = 'src/components/CognitiveMap.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the large useEffect block for D3
const useEffectStart = '  useEffect(() => {\n    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;\n';
const useEffectEnd = '  }, [nodes, links, height, isFullScreen, viewMode, collapsedNodes]);';

const startIndex = content.indexOf(useEffectStart);
const endIndex = content.indexOf(useEffectEnd) + useEffectEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + `  // D3 Rendering moved to RenderManager\n` + content.substring(endIndex);
} else {
  console.log("Could not find useEffect block to replace.");
}

// Add the import
if (!content.includes('import RenderManager')) {
  content = content.replace("import { getKanbanColumns } from '../utils/kanban';", "import { getKanbanColumns } from '../utils/kanban';\nimport RenderManager from './cognitive/RenderManager';");
}

// Replace the SVG element with RenderManager
const svgTagStart = '      <div className="flex-1 relative overflow-hidden bg-black">\n        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />\n      </div>';
const replacement = `      <div className="flex-1 relative overflow-hidden bg-black">\n        <RenderManager viewMode={viewMode as any} nodes={nodes} links={links} width={containerRef.current?.clientWidth || 800} height={height} onNodeClick={(n) => { setSelectedNode(n); if(n.lead) { onNodeClick?.(n.lead); } }} onNodeDoubleClick={handleNodeDoubleClick} selectedNode={selectedNode} highlightFilter={highlightFilter} searchTerm={searchTerm} />\n      </div>`;

if (content.includes(svgTagStart)) {
  content = content.replace(svgTagStart, replacement);
} else {
  console.log("Could not find SVG tag to replace.");
}

fs.writeFileSync(filePath, content);
console.log("Done updating CognitiveMap.tsx");
