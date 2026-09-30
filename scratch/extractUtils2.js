const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/components/media/NativePostImageEditor.tsx');

const utilsFile = project.createSourceFile('../native/components/media/NativePostImageEditor/utils.ts', '', { overwrite: true });

utilsFile.addImportDeclaration({
  namedImports: ['TextLayer', 'TextAlignMode'],
  moduleSpecifier: './types'
});
utilsFile.addImportDeclaration({
  namedImports: ['COLORS'],
  moduleSpecifier: './constants'
});

const utilsToExtract = [
  'getVariantContainerStyle',
  'getVariantTextStyle',
  'getTextShadowStyle',
  'getContrastText',
  'round2',
  'cycleAlign',
  'composerToolIconColor',
  'normalizeComposerTextColor'
];

utilsToExtract.forEach(utilName => {
  const varStmt = file.getVariableStatement(stmt => {
    const decls = stmt.getDeclarations();
    return decls.length > 0 && decls[0].getName() === utilName;
  });
  
  if (varStmt) {
    let structure = varStmt.getStructure();
    structure.isExported = true;
    utilsFile.addVariableStatement(structure);
    varStmt.remove();
  }
});

file.addImportDeclaration({
  namedImports: utilsToExtract,
  moduleSpecifier: './NativePostImageEditor/utils'
});

project.saveSync();
console.log('Utils successfully extracted.');
