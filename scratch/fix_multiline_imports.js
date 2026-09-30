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
  
  // Look for patterns where expo-image import was injected poorly:
  // e.g., "import {\nimport { Image } from 'expo-image';"
  if (txt.includes('import {\nimport { Image } from \'expo-image\';')) {
    txt = txt.replace('import {\nimport { Image } from \'expo-image\';', 'import { Image } from \'expo-image\';\nimport {');
  }
  if (txt.includes('import type {\nimport { Image } from \'expo-image\';')) {
    txt = txt.replace('import type {\nimport { Image } from \'expo-image\';', 'import { Image } from \'expo-image\';\nimport type {');
  }
  
  if (txt !== original) {
    fs.writeFileSync(p, txt, 'utf8');
    console.log('Fixed broken import in: ' + p);
    fixedCount++;
  }
});

console.log('Fixed ' + fixedCount + ' files.');
