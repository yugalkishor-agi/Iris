const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList) {
  if (!fs.existsSync(dir)) return fileList;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      findFiles(p, fileList);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      fileList.push(p);
    }
  });
  return fileList;
}

const files = findFiles('native', []);
let fixedCount = 0;

files.forEach(p => {
  let txt = fs.readFileSync(p, 'utf8');
  let original = txt;
  
  // Normalize line endings for regex matching
  let normalized = txt.replace(/\r\n/g, '\n');
  
  // Look for patterns where expo-image import was injected poorly:
  if (normalized.includes('import {\nimport { Image } from \'expo-image\';')) {
    normalized = normalized.replace('import {\nimport { Image } from \'expo-image\';', 'import { Image } from \'expo-image\';\nimport {');
  }
  if (normalized.includes('import type {\nimport { Image } from \'expo-image\';')) {
    normalized = normalized.replace('import type {\nimport { Image } from \'expo-image\';', 'import { Image } from \'expo-image\';\nimport type {');
  }
  
  if (normalized !== txt.replace(/\r\n/g, '\n')) {
    // If we changed something, write it back with the system's original line endings (or just keep \n)
    fs.writeFileSync(p, normalized, 'utf8');
    console.log('Fixed broken import in: ' + p);
    fixedCount++;
  }
});

console.log('Fixed ' + fixedCount + ' files.');
