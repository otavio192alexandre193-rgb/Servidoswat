import * as d3 from 'd3';

self.onmessage = function (event) {
  try {
    const { nodes, links, width, height, viewMode } = event.data;

    const collapsedNodesSet = new Set(event.data.collapsedNodes || []);
    
    // Simple BFS to find all visible nodes
    const visibleNodesSet = new Set<string>();
    
    // Assuming directed graph from source to target
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    nodes.forEach((n: any) => {
       inDegree.set(n.id, 0);
    });

    links.forEach((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      if (!adjacencyList.has(sourceId)) adjacencyList.set(sourceId, []);
      adjacencyList.get(sourceId)!.push(targetId);
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });

    // Root nodes are ones with 0 in-degree
    const queue: string[] = [];
    nodes.forEach((n: any) => {
       if (inDegree.get(n.id) === 0) {
          queue.push(n.id);
          visibleNodesSet.add(n.id);
       }
    });

    // Fallback if graph is completely cyclic and queue is empty
    if (queue.length === 0 && nodes.length > 0) {
       queue.push(nodes[0].id);
       visibleNodesSet.add(nodes[0].id);
    }

    while(queue.length > 0) {
      const current = queue.shift()!;
      if (!collapsedNodesSet.has(current)) {
         const children = adjacencyList.get(current) || [];
         children.forEach(child => {
            if (!visibleNodesSet.has(child)) {
               visibleNodesSet.add(child);
               queue.push(child);
            }
         });
      }
    }

    const rootId = 'crm-root';
    // Filter nodes and links
    const visibleNodes = nodes.filter((n: any) => visibleNodesSet.has(n.id) || n.id === rootId || n.isRoot);
    const visibleLinks = links.filter((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return visibleNodesSet.has(sourceId) && visibleNodesSet.has(targetId);
    });

    // Clone nodes and links to prevent mutating serialized data unexpectedly
    const nodesMap = new Map<string, any>(visibleNodes.map((n: any) => [n.id, { ...n }]));
    const workerNodes: any[] = Array.from(nodesMap.values());
    const workerLinks: any[] = visibleLinks.map((l: any) => {
      return {
        ...l,
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
      };
    });

    if (['network', 'map-3d', 'universe', 'constellation', 'neural', 'relations', 'dependencies'].includes(viewMode)) {
      // FORCE DIRECTED LAYOUT
      const simulation = d3.forceSimulation(workerNodes as d3.SimulationNodeDatum[])
        .force("link", d3.forceLink(workerLinks).id((d: any) => d.id).distance((l: any) => {
          if (l.source.group >= 10 || l.target.group >= 10) return 40;
          return 120;
        }))
        .force("charge", d3.forceManyBody().strength((d: any) => d.isCluster ? -800 : -300))
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 15).iterations(2))
        .force("x", d3.forceX((d: any) => {
           if (d.isCluster) {
             if (d.group === 2 || d.group === 4) return width * 0.15;
             if (d.group === 3 || d.group === 5) return width * 0.85;
           }
           if (d.group === 1) return width * 0.5;
           if (d.group === 10) return width * 0.35;
           if (d.group >= 11) return width * 0.65;
           return width / 2;
        }).strength(0.1))
        .force("y", d3.forceY((d: any) => {
           if (d.isCluster) {
             if (d.group === 2) return height * 0.25;
             if (d.group === 4) return height * 0.75;
             if (d.group === 3) return height * 0.25;
             if (d.group === 5) return height * 0.75;
           }
           return height / 2;
        }).strength(0.1))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
        .stop();

      const n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
      for (let i = 0; i < n; ++i) {
        simulation.tick();
      }
    } else if (['tree-vertical', 'tree-horizontal', 'radial', 'flowchart', 'layers'].includes(viewMode)) {
      // Tree-like layouts using forces
      const isHorizontal = viewMode === 'tree-horizontal' || viewMode === 'flowchart';
      const isRadial = viewMode === 'radial';

      // Simple topological sort / depth calculation for DAG
      const depthMap = new Map<string, number>();
      const getDepth = (id: string, visited = new Set<string>()): number => {
         if (visited.has(id)) return 0;
         if (depthMap.has(id)) return depthMap.get(id)!;
         
         const parents = workerLinks.filter(l => l.target === id || (typeof l.target === 'object' && (l.target as any).id === id)).map(l => typeof l.source === 'object' ? (l.source as any).id : l.source);
         if (parents.length === 0) {
            depthMap.set(id, 0);
            return 0;
         }
         
         visited.add(id);
         let maxParentDepth = 0;
         for (const p of parents) {
            maxParentDepth = Math.max(maxParentDepth, getDepth(p, visited));
         }
         visited.delete(id);
         
         const depth = maxParentDepth + 1;
         depthMap.set(id, depth);
         return depth;
      };

      workerNodes.forEach(n => getDepth(n.id));
      const maxDepth = Math.max(...Array.from(depthMap.values()), 1);

      const simulation = d3.forceSimulation(workerNodes as d3.SimulationNodeDatum[])
        .force("link", d3.forceLink(workerLinks).id((d: any) => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 20).iterations(2))
        .force("x", d3.forceX((d: any) => {
           const depth = depthMap.get(d.id) || 0;
           if (isHorizontal) {
              return 100 + (depth / maxDepth) * (width - 200);
           }
           if (isRadial) {
              return width / 2;
           }
           return width / 2 + (Math.random() * 200 - 100);
        }).strength(isHorizontal ? 0.8 : 0.1))
        .force("y", d3.forceY((d: any) => {
           const depth = depthMap.get(d.id) || 0;
           if (isHorizontal) {
              return height / 2 + (Math.random() * 200 - 100);
           }
           if (isRadial) {
              return height / 2;
           }
           return 100 + (depth / maxDepth) * (height - 200);
        }).strength(isHorizontal ? 0.1 : 0.8));

      if (isRadial) {
         simulation.force("radial", d3.forceRadial((d: any) => {
             const depth = depthMap.get(d.id) || 0;
             return (depth / maxDepth) * (Math.min(width, height) / 2 - 50);
         }, width / 2, height / 2).strength(1));
      }

      simulation.stop();
      const n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
      for (let i = 0; i < n; ++i) {
        simulation.tick();
      }
    } else if (['matrix', 'heatmap', 'kanban'].includes(viewMode)) {
      // GRID / KANBAN LAYOUT (Deterministic columns)
      const groups = Array.from(new Set(workerNodes.map(n => n.group))).sort((a,b)=>a-b);
      const groupSpacing = width / (groups.length + 1);
      
      const counts = new Map<number, number>();
      workerNodes.forEach(n => {
         const col = groups.indexOf(n.group);
         const row = counts.get(n.group) || 0;
         n.x = (col + 1) * groupSpacing;
         n.y = 100 + row * 80;
         counts.set(n.group, row + 1);
      });
    } else if (viewMode === 'timeline' || viewMode === 'sankey') {
      // TIMELINE / LINEAR LAYOUT (Deterministic zig-zag)
      workerNodes.sort((a, b) => {
         if (a.group !== b.group) return a.group - b.group;
         return a.id.localeCompare(b.id);
      });
      
      const spacingX = width / (workerNodes.length + 1);
      workerNodes.forEach((n, i) => {
         n.x = (i + 1) * spacingX;
         n.y = height / 2 + (i % 2 === 0 ? -60 : 60);
      });
    }

    // Send back the final positions
    self.postMessage({ type: 'END', nodes: workerNodes });
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', message: err.message, stack: err.stack });
  }
};
