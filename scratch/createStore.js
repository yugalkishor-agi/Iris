const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const file = project.addSourceFileAtPath('../native/screens/StoryViewerScreenEnhanced.tsx');

let comp = file.getFunction('StoryViewerScreenEnhanced') || file.getVariableDeclaration('StoryViewerScreenEnhanced')?.getInitializer();

const states = [];

comp.getVariableStatements().forEach(stmt => {
  const decls = stmt.getDeclarations();
  if (decls.length !== 1) return;
  const decl = decls[0];
  const init = decl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression) {
    const expr = init.getExpression();
    if (expr.getText() === 'useState') {
      const args = init.getArguments();
      const typeArgs = init.getTypeArguments();
      const typeArg = typeArgs.length > 0 ? typeArgs[0].getText() : 'any';
      
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

if (!fs.existsSync('../native/screens/StoryViewerScreenEnhanced')) {
  fs.mkdirSync('../native/screens/StoryViewerScreenEnhanced', { recursive: true });
}

let storeCode = `import { create } from 'zustand';\n\n`;

storeCode += `interface StoryViewerState {\n`;
for (const s of states) {
  storeCode += `  ${s.stateName}: ${s.typeArg};\n`;
  storeCode += `  ${s.setterName}: (val: ${s.typeArg} | ((prev: ${s.typeArg}) => ${s.typeArg})) => void;\n`;
}
storeCode += `}\n\n`;

storeCode += `export const useStoryViewerStore = create<StoryViewerState>((set) => ({\n`;
for (const s of states) {
  storeCode += `  ${s.stateName}: ${s.initialValue},\n`;
  storeCode += `  ${s.setterName}: (val) => set((state) => ({ ${s.stateName}: typeof val === 'function' ? (val as any)(state.${s.stateName}) : val })),\n`;
}
storeCode += `}));\n`;

fs.writeFileSync('../native/screens/StoryViewerScreenEnhanced/useStoryViewerStore.ts', storeCode);

states.forEach(s => {
  s.stmt.replaceWithText(`const ${s.stateName} = useStoryViewerStore(s => s.${s.stateName});\nconst ${s.setterName} = useStoryViewerStore(s => s.${s.setterName});`);
});

file.addImportDeclaration({
  namedImports: ['useStoryViewerStore'],
  moduleSpecifier: './StoryViewerScreenEnhanced/useStoryViewerStore'
});

project.saveSync();
console.log('Store generated and component refactored.');
