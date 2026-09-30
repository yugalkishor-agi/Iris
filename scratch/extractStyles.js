const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/components/media/NativePostImageEditor.tsx');

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
  content += `import { borderRadius, spacing, typography } from '../../../styles/theme';\n\n`;
  
  content += `export ` + stylesNode.getText();
  
  fs.writeFileSync('../native/components/media/NativePostImageEditor/styles.ts', content);
  stylesNode.remove();
  
  file.addImportDeclaration({
    namedImports: ['styles'],
    moduleSpecifier: './NativePostImageEditor/styles'
  });
  
  project.saveSync();
  console.log('Styles extracted.');
} else {
  console.log('Styles not found.');
}
