const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(file));
      } else {
        if(file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          results.push(file);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('u:/i/native').concat(walk('u:/i/src'));
let fixedCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("import FastImage from 'react-native-fast-image';")) {
      const badString1 = "\nimport FastImage from 'react-native-fast-image';\n";
      const badString2 = "\nimport FastImage from 'react-native-fast-image';";
      const badString3 = "import FastImage from 'react-native-fast-image';\n";
      
      let newContent = content.split(badString1).join('\n')
                              .split(badString2).join('')
                              .split(badString3).join('');
                              
      // Prepend to top
      newContent = "import FastImage from 'react-native-fast-image';\n" + newContent;
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        fixedCount++;
      }
    }
  } catch(e) {
    console.error(e);
  }
});

console.log('Fixed imports in', fixedCount, 'files.');
