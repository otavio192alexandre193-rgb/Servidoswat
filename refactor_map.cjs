const fs = require('fs');
const path = 'src/components/CognitiveMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace selectedMapLead with expandedLeads
content = content.replace(
  /const \[selectedMapLead, setSelectedMapLead\] = useState<Lead \| null>\(null\);/,
  `const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());`
);

// Update useMemo for nodes and links
const nodesLinksRegex = /const \{ nodes, links \} = useMemo\(\(\) => \{[\s\S]*?return \{ nodes, links \};\n  \}, \[leads, properties, visibleLinkTypes\]\);/s;

const newNodesLinksStr = `const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    leads.forEach(lead => {
      // Main Lead Node
      nodes.push({
        id: lead.id,
        label: lead.name,
        group: 1,
        radius: 18,
        lead: lead,
      });

      // Se estiver expandido, adicionamos nós filhos com métricas e infos
      if (expandedLeads.has(lead.id)) {
        const attributes = [
          { key: 'status', label: \`Status: \${lead.status}\`, group: 10 },
          { key: 'origin', label: \`Origem: \${lead.origin || '?'}\`, group: 11 },
          { key: 'income', label: \`Renda: \${lead.familyIncome ? 'R$ '+lead.familyIncome : 'Sem Renda'}\`, group: 12 },
          { key: 'program', label: \`Prog: \${lead.programaDesejado || '?'}\`, group: 13 },
          { key: 'profile', label: \`Perfil: \${lead.mainProfile || '?'}\`, group: 14 },
          { key: 'qual', label: \`Qual: \${lead.qualificacao || '?'}\`, group: 15 },
          { key: 'obj', label: \`Objeção: \${lead.objection || '?'}\`, group: 16 }
        ];

        attributes.forEach(attr => {
          const childId = \`\${lead.id}-\${attr.key}\`;
          nodes.push({
            id: childId,
            label: attr.label,
            group: attr.group,
            radius: 12,
            isDetailNode: true, // custom flag
            parentLeadId: lead.id
          });
          
          links.push({
            source: lead.id,
            target: childId,
            value: 2,
            type: 'detail'
          });
        });
      }

      // Propriedades Interessadas (já existiam no código anterior)
      if (visibleLinkTypes.has('interesse') && lead.propertyInterest) {
        properties.forEach(prop => {
          if (prop.title.toLowerCase().includes(lead.propertyInterest!.toLowerCase())) {
            if (!nodes.find(n => n.id === prop.id)) {
              nodes.push({
                id: prop.id,
                label: prop.title,
                group: 3,
                radius: 14,
              });
            }
            links.push({
              source: lead.id,
              target: prop.id,
              value: 1,
              type: 'interesse'
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [leads, properties, visibleLinkTypes, expandedLeads]);`;

content = content.replace(nodesLinksRegex, newNodesLinksStr);

// Update click handler to toggle expandedLeads
const clickHandlerRegex = /\.on\("click", \(event: any, d: any\) => \{[\s\S]*?\}\)/;
const newClickHandler = `.on("click", (event: any, d: any) => {
        if (d.group === 1) { // It's a lead node
          setExpandedLeads(prev => {
            const next = new Set(prev);
            if (next.has(d.id)) {
              next.delete(d.id);
            } else {
              next.add(d.id);
            }
            return next;
          });
        }
      })`;

content = content.replace(clickHandlerRegex, newClickHandler);

// Remove the right side panel
const panelRegex = /\{selectedMapLead && \([\s\S]*?\/\* End of selectedMapLead div \*\/\s*\)\}/s;
content = content.replace(/\{selectedMapLead && \([\s\S]*?\}\s*\)\}/s, '{/* Expandable Nodes shown in Map directly */}');

fs.writeFileSync(path, content, 'utf8');
console.log('Done refactoring CognitiveMap');
