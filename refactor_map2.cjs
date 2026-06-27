const fs = require('fs');
const path = 'src/components/CognitiveMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const \{ nodes, links \} = useMemo\(\(\) => \{[\s\S]*?\}, \[leads, visibleLinkTypes, highlightFilter\]\);/s;

const newNodesLinksStr = `const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const originNodes = new Map<string, Node>();
    const statusNodes = new Map<string, Node>();
    
    leads.forEach(lead => {
      // Main Lead Node
      nodes.push({
        id: lead.id,
        label: lead.name,
        group: 1,
        radius: 18,
        color: lead.status === 'proposta' ? '#10b981' : lead.status === 'agendado' ? '#f59e0b' : '#6366f1',
        data: lead
      });

      // Show links and nodes based on visibleLinkTypes
      if (visibleLinkTypes.has('origem') && lead.origin) {
        if (!originNodes.has(lead.origin)) {
          const originNode: Node = { id: \`origin-\${lead.origin}\`, label: lead.origin, group: 2, radius: 25, color: '#ec4899', isCluster: true };
          originNodes.set(lead.origin, originNode);
          nodes.push(originNode);
        }
        links.push({ source: lead.id, target: \`origin-\${lead.origin}\`, value: 1, type: 'origem' });
      }

      if (visibleLinkTypes.has('status') && lead.status) {
        if (!statusNodes.has(lead.status)) {
          const statusNode: Node = { id: \`status-\${lead.status}\`, label: lead.status, group: 3, radius: 25, color: '#8b5cf6', isCluster: true };
          statusNodes.set(lead.status, statusNode);
          nodes.push(statusNode);
        }
        links.push({ source: lead.id, target: \`status-\${lead.status}\`, value: 1, type: 'status' });
      }

      // Expansion logic (double click)
      if (expandedLeads.has(lead.id)) {
        // Renda
        const rendaId = \`\${lead.id}-renda\`;
        nodes.push({ id: rendaId, label: \`R$: \${lead.familyIncome || 0}\`, group: 10, radius: 10, color: '#10b981' });
        links.push({ source: lead.id, target: rendaId, value: 1, type: 'detail' });
        
        // Status detail
        const statusId = \`\${lead.id}-status-detail\`;
        nodes.push({ id: statusId, label: lead.status || 'sem-status', group: 11, radius: 10, color: '#8b5cf6' });
        links.push({ source: lead.id, target: statusId, value: 1, type: 'detail' });

        // Parametro
        if (lead.propertyInterest) {
           const paramId = \`\${lead.id}-param\`;
           nodes.push({ id: paramId, label: lead.propertyInterest, group: 12, radius: 10, color: '#f59e0b' });
           links.push({ source: lead.id, target: paramId, value: 1, type: 'detail' });
        }

        // Info Qualificação
        const qualId = \`\${lead.id}-qual\`;
        nodes.push({ id: qualId, label: \`Qual: \${lead.qualificacao || '?'}\`, group: 13, radius: 10, color: '#0ea5e9' });
        links.push({ source: lead.id, target: qualId, value: 1, type: 'detail' });
      }
    });

    return { nodes, links };
  }, [leads, visibleLinkTypes, expandedLeads]);`;

if (content.match(regex)) {
    content = content.replace(regex, newNodesLinksStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully refactored CognitiveMap.");
} else {
    console.log("Could not match useMemo regex.");
}
