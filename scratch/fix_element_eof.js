const fs = require('fs');
const lines = fs.readFileSync('native/components/editor/SkiaCanvas/ElementRenderer.tsx', 'utf8').split('\n');
const newLines = lines.slice(0, 196);
newLines.push("  return icons[widgetType] || '📌';", "}");
fs.writeFileSync('native/components/editor/SkiaCanvas/ElementRenderer.tsx', newLines.join('\n'), 'utf8');
console.log('Fixed ElementRenderer.tsx');
