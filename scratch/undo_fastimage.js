const fs = require('fs');
const path = require('path');

const targetDirs = [
  'u:/i/native',
  'u:/i/src'
];

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

let allFiles = [];
targetDirs.forEach(dir => {
  allFiles = getAllFiles(dir, allFiles);
});

let updatedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (content.includes('<FastImage') || content.includes('import FastImage') || content.includes('FastImage')) {
    // Replace <FastImage with <Image
    content = content.replace(/<FastImage\b/g, '<Image');
    content = content.replace(/<\/FastImage>/g, '</Image>');

    // Remove FastImage import
    content = content.replace(/import\s+FastImage\s+from\s+['"]react-native-fast-image['"];?\n?/g, '');
    
    // Some components might have `import { FastImage } from ...` if it was aliased, but standard is default.
    content = content.replace(/import\s*{\s*Image\s+as\s+FastImage\s*}\s*from\s*['"]react-native['"];?\n?/g, '');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Reverted: ${file}`);
    }
  }
});

console.log(`\nRevert complete. ${updatedCount} files updated back to standard Image.`);
