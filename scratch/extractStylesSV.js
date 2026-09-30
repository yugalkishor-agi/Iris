const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/screens/StoryViewerScreenEnhanced.tsx');

const variables = file.getVariableStatements();
let stylesNode = null;

variables.forEach(v => {
  const decls = v.getDeclarations();
  if (decls.length > 0 && decls[0].getName() === 'styles') {
    stylesNode = v;
  }
});

if (stylesNode) {
  let content = `import { StyleSheet } from 'react-native';\n`;
  content += `import { colors, spacing, typography, borderRadius } from '../../styles/theme';\n\n`; // Adjust generic imports
  content += `export ` + stylesNode.getText();
  
  fs.writeFileSync('../native/screens/StoryViewerScreenEnhanced/styles.ts', content);
  stylesNode.remove();
  
  file.addImportDeclaration({
    namedImports: ['styles'],
    moduleSpecifier: './StoryViewerScreenEnhanced/styles'
  });
  
  project.saveSync();
  console.log('Styles extracted.');
} else {
  console.log('Styles not found.');
}
