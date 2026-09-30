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
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
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

  // Pattern 1: Check if 'Image' is imported from 'react-native'
  // e.g. import { View, Image, Text } from 'react-native';
  const importRegex = /import\s+{[^}]*\bImage\b[^}]*}\s+from\s+['"]react-native['"];/g;
  
  // Actually a safer approach:
  // If Image is imported from react-native, we need to add FastImage import.
  const hasReactNativeImageImport = /import\s+{([^}]*)}\s+from\s+['"]react-native['"]/.test(content);
  
  if (hasReactNativeImageImport) {
    // Replace <Image with <FastImage
    content = content.replace(/<Image\b/g, '<FastImage');
    content = content.replace(/<\/Image>/g, '</FastImage>');

    // Make sure FastImage is imported from 'react-native-fast-image'
    if (content !== originalContent) {
        if (!content.includes("import FastImage from 'react-native-fast-image'") && !content.includes('import FastImage from "react-native-fast-image"')) {
            // Find the last import statement and add the FastImage import after it
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLastImport) + "\nimport FastImage from 'react-native-fast-image';" + content.slice(endOfLastImport);
            } else {
                content = "import FastImage from 'react-native-fast-image';\n" + content;
            }
        }
        
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Updated: ${file}`);
    }
  }
});

console.log(`\nMigration complete. ${updatedCount} files updated to use FastImage.`);
