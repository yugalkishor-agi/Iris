const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/components/media/NativePostImageEditor.tsx');

const component = file.getFunction('NativePostImageEditor');
if (!component) throw new Error('Component not found');

const states = [];

// Find all useState calls
component.getVariableStatements().forEach(stmt => {
  const decls = stmt.getDeclarations();
  if (decls.length !== 1) return;
  const decl = decls[0];
  const init = decl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression) {
    const expr = init.getExpression();
    if (expr.getText() === 'useState') {
      const args = init.getArguments();
      const typeArgs = init.getTypeArguments();
      const typeArg = typeArgs.length > 0 ? typeArgs[0].getText() : '';
      
      const pattern = decl.getNameNode();
      if (pattern.getKind() === SyntaxKind.ArrayBindingPattern) {
        const elements = pattern.getElements();
        if (elements.length === 2) {
          const stateName = elements[0].getText();
          const setterName = elements[1].getText();
          const initialValue = args.length > 0 ? args[0].getText() : 'undefined';
          
          states.push({
            stateName,
            setterName,
            initialValue,
            typeArg,
            stmt
          });
        }
      }
    }
  }
});

console.log(`Found ${states.length} useState hooks.`);

// Generate Store Content
let storeCode = `import { create } from 'zustand';\n`;
storeCode += `import type { EditorTab, TextLayer, VisualLayer, TextAlignMode, TextVariant, TextAnimationOption, TextEffectOption, TextBackgroundOption, AssetPickerMode, TextComposerTool, TextStyleState } from './types';\n`;
storeCode += `import { PRESETS, DEFAULT_TEXT_STYLE } from './constants';\n\n`;

storeCode += `interface EditorState {\n`;
for (const s of states) {
  const t = s.typeArg || 'any'; // In a real app we'd infer it, but 'any' or the generic works for now
  storeCode += `  ${s.stateName}: ${t};\n`;
  storeCode += `  ${s.setterName}: (val: ${t} | ((prev: ${t}) => ${t})) => void;\n`;
}
storeCode += `}\n\n`;

storeCode += `export const useEditorStore = create<EditorState>((set) => ({\n`;
for (const s of states) {
  storeCode += `  ${s.stateName}: ${s.initialValue},\n`;
  storeCode += `  ${s.setterName}: (val) => set((state) => ({ ${s.stateName}: typeof val === 'function' ? (val as any)(state.${s.stateName}) : val })),\n`;
}
storeCode += `}));\n`;

fs.writeFileSync('../native/components/media/NativePostImageEditor/useEditorStore.ts', storeCode);

// Replace useState with store selectors
states.forEach(s => {
  s.stmt.replaceWithText(`const ${s.stateName} = useEditorStore(s => s.${s.stateName});\nconst ${s.setterName} = useEditorStore(s => s.${s.setterName});`);
});

// Add store import
file.addImportDeclaration({
  namedImports: ['useEditorStore'],
  moduleSpecifier: './NativePostImageEditor/useEditorStore'
});

file.saveSync();
console.log('Successfully refactored component and generated store.');
