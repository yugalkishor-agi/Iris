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

  // Check if standard Image is used from react-native
  const hasReactNativeImageImport = /import\s+{[^}]*\bImage\b[^}]*}\s+from\s+['"]react-native['"];?/.test(content);
  
  if (hasReactNativeImageImport || content.includes('<Image')) {
    // Import expo-image
    if (!content.includes("import { Image } from 'expo-image'") && !content.includes('import { Image } from "expo-image"')) {
      // Remove Image from react-native import
      content = content.replace(/(import\s+{[^}]*)\bImage\b,?\s*([^}]*}\s+from\s+['"]react-native['"];?)/g, (match, p1, p2) => {
        // Clean up empty spaces and trailing commas
        let replaced = p1 + p2;
        replaced = replaced.replace(/{\s*,/, '{').replace(/,\s*,/, ',').replace(/,\s*}/, '}');
        if (replaced.includes('{}')) {
            return ''; // Empty import
        }
        return replaced;
      });
      
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
          const endOfLastImport = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLastImport) + "\nimport { Image } from 'expo-image';" + content.slice(endOfLastImport);
      } else {
          content = "import { Image } from 'expo-image';\n" + content;
      }
    }

    // Replace resizeMode with contentFit
    content = content.replace(/resizeMode=['"]cover['"]/g, 'contentFit="cover"');
    content = content.replace(/resizeMode=['"]contain['"]/g, 'contentFit="contain"');
    content = content.replace(/resizeMode=['"]stretch['"]/g, 'contentFit="fill"');
    content = content.replace(/resizeMode=\{([^}]+)\}/g, 'contentFit={$1}');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Migrated to expo-image: ${file}`);
    }
  }
});

console.log(`\nMigration complete. ${updatedCount} files updated to use expo-image.`);
