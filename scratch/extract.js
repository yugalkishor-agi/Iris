const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/components/media/NativePostImageEditor.tsx');

const typesFile = project.createSourceFile('../native/components/media/NativePostImageEditor/types.ts', '', { overwrite: true });
const constantsFile = project.createSourceFile('../native/components/media/NativePostImageEditor/constants.ts', '', { overwrite: true });

typesFile.addImportDeclaration({
  namedImports: ['GiphyGif'],
  moduleSpecifier: '../../../services/giphy.service'
});
typesFile.addImportDeclaration({
  namedImports: ['TextAlignMode', 'TextVariant', 'TextAnimationOption', 'TextEffectOption', 'TextBackgroundOption', 'AssetPickerMode', 'TextComposerTool'],
  moduleSpecifier: './types' // Self reference won't work, we'll fix it
});

// Extract all Type Aliases
const typeAliases = file.getTypeAliases();
typeAliases.forEach(t => {
  typesFile.addTypeAlias(t.getStructure());
  t.remove();
});

// Extract all Interfaces except NativePostImageEditorProps
const interfaces = file.getInterfaces();
interfaces.forEach(i => {
  if (i.getName() !== 'NativePostImageEditorProps') {
    typesFile.addInterface(i.getStructure());
    i.remove();
  }
});

// Extract Constants
const variables = file.getVariableStatements();
variables.forEach(v => {
  const decls = v.getDeclarations();
  if (decls.length > 0) {
    const name = decls[0].getName();
    // Move all uppercase constants and PRESETS
    if (name === name.toUpperCase() || name === 'FONTS' || name === 'FONT_SIZES' || name === 'PRESETS' || name === 'COLORS') {
      constantsFile.addVariableStatement(v.getStructure());
      v.remove();
    }
  }
});

constantsFile.addImportDeclaration({
  namedImports: ['TextAlignMode', 'TextVariant', 'TextAnimationOption', 'TextEffectOption', 'TextBackgroundOption'],
  moduleSpecifier: './types'
});

// Add imports to original file
file.addImportDeclaration({
  namespaceImport: 'Types', // generic to avoid conflict
  moduleSpecifier: './NativePostImageEditor/types'
});
// Need to add specific imports for what's left
file.addImportDeclaration({
  namedImports: ['EditorTab', 'TextAlignMode', 'TextVariant', 'TextAnimationOption', 'TextEffectOption', 'TextBackgroundOption', 'AssetPickerMode', 'TextComposerTool', 'TextLayer', 'VisualLayer', 'TextStyleState', 'VisualLayerKind'],
  moduleSpecifier: './NativePostImageEditor/types'
});
file.addImportDeclaration({
  namedImports: ['PRESETS', 'DEFAULT_TEXT_STYLE', 'FONTS', 'FONT_SIZES', 'COLORS', 'DEFAULT_TEXT_SIZE'],
  moduleSpecifier: './NativePostImageEditor/constants'
});

project.saveSync();
console.log('Types and constants extracted successfully.');
