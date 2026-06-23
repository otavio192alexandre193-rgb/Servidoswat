import fs from 'fs';

const content = fs.readFileSync('src/components/FollowUpManager.tsx', 'utf8');

const anchor = "    return (\n    <div id=\"followup-interactive-pane\"";
const fix = `    return (
      lead.name.toLowerCase().includes(term) ||
      (lead.tags && lead.tags.some(t => t.toLowerCase().includes(term))) ||
      (lead.phone && lead.phone.includes(term)) ||
      (lead.objection && lead.objection.toLowerCase().includes(term))
    );
  }).filter(l => l.status === 'ativo' || appointments?.some(a => a.leadId === l.id && a.status === 'pendente'));

  return (
    <div id="followup-interactive-pane"`;

if (content.includes(anchor)) {
    const newContent = content.replace(anchor, fix);
    fs.writeFileSync('src/components/FollowUpManager.tsx', newContent);
    console.log("Fixed the missing filter bracket!");
} else {
    console.log("Anchor not found. Let's see what is there.");
    console.log(content.substring(content.indexOf("const filteredMatrixLeads"), content.indexOf("const filteredMatrixLeads") + 300));
}
