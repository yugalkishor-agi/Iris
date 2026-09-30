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
  const func = file.getFunction(utilName);
  if (func) {
    utilsFile.addFunction(func.getStructure());
    // ensure it's exported
    utilsFile.getFunction(utilName).setIsExported(true);
    func.remove();
  }
});

// Import them back in main file
file.addImportDeclaration({
  namedImports: utilsToExtract,
  moduleSpecifier: './NativePostImageEditor/utils'
});

// For the components, add imports
const compNames = ['EditorVisualLayer', 'EditorTextLayer', 'TextBackdrop', 'StickerAssetSheet', 'TextMiniSlider', 'GradeSlider'];
compNames.forEach(c => {
  const path = `../native/components/media/NativePostImageEditor/components/${c}.tsx`;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Prepend missing imports
    const imports = `import { styles } from '../styles';\nimport { getVariantContainerStyle, getVariantTextStyle, getTextShadowStyle, getContrastText, round2, cycleAlign, composerToolIconColor, normalizeComposerTextColor } from '../utils';\n`;
    
    fs.writeFileSync(path, imports + content);
  }
});

project.saveSync();
console.log('Utils extracted and imports added.');
