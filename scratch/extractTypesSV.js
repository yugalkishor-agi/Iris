const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/screens/StoryViewerScreenEnhanced.tsx');

const typesFile = project.createSourceFile('../native/screens/StoryViewerScreenEnhanced/types.ts', '', { overwrite: true });
const constantsFile = project.createSourceFile('../native/screens/StoryViewerScreenEnhanced/constants.ts', '', { overwrite: true });

// Extract all Type Aliases
const typeAliases = file.getTypeAliases();
typeAliases.forEach(t => {
  typesFile.addTypeAlias(t.getStructure());
  t.remove();
});

// Extract all Interfaces except NativePostImageEditorProps equivalent if any
const interfaces = file.getInterfaces();
interfaces.forEach(i => {
  typesFile.addInterface(i.getStructure());
  i.remove();
});

// Extract Constants
const variables = file.getVariableStatements();
const extractedVars = [];
variables.forEach(v => {
  const decls = v.getDeclarations();
  if (decls.length > 0) {
    const name = decls[0].getName();
    // Move all uppercase constants
    if (name === name.toUpperCase() && name.length > 3) { // rudimentary check
      constantsFile.addVariableStatement(v.getStructure());
      extractedVars.push(name);
      v.remove();
    }
  }
});

// Add imports to original file
file.addImportDeclaration({
  namespaceImport: 'Types',
  moduleSpecifier: './StoryViewerScreenEnhanced/types'
});

if (extractedVars.length > 0) {
  file.addImportDeclaration({
    namedImports: extractedVars,
    moduleSpecifier: './StoryViewerScreenEnhanced/constants'
  });
}

project.saveSync();
console.log('Types and constants extracted.');
