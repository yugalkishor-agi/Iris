const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const compName = 'ChatScreenEnhanced';
const funcName = 'ChatScreen';
const filePath = `../native/screens/${compName}.tsx`;

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
  process.exit(1);
}

const file = project.addSourceFileAtPath(filePath);
let comp = file.getFunction(funcName) || file.getVariableDeclaration(funcName)?.getInitializer();
if (!comp) {
  console.log(`Component ${funcName} not found in ${filePath}`);
  process.exit(1);
}

// 1. Extract States to Zustand
const states = [];
comp.getVariableStatements().forEach(stmt => {
  const decls = stmt.getDeclarations();
  if (decls.length !== 1) return;
  const decl = decls[0];
  const init = decl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression && init.getExpression().getText() === 'useState') {
    const args = init.getArguments();
    const typeArgs = init.getTypeArguments();
    const typeArg = typeArgs.length > 0 ? typeArgs[0].getText() : 'any';
    
    const pattern = decl.getNameNode();
    if (pattern.getKind() === SyntaxKind.ArrayBindingPattern) {
      const elements = pattern.getElements();
      if (elements.length === 2) {
        states.push({
          stateName: elements[0].getText(),
          setterName: elements[1].getText(),
          initialValue: args.length > 0 ? args[0].getText() : 'undefined',
          typeArg,
          stmt
        });
      }
    }
  }
});

if (states.length > 0) {
  const dirPath = `../native/screens/${compName}`;
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  let storeCode = `import { create } from 'zustand';\n\ninterface ${funcName}State {\n`;
  for (const s of states) {
    storeCode += `  ${s.stateName}: ${s.typeArg};\n  ${s.setterName}: (val: ${s.typeArg} | ((prev: ${s.typeArg}) => ${s.typeArg})) => void;\n`;
  }
  storeCode += `}\n\nexport const use${funcName}Store = create<${funcName}State>((set) => ({\n`;
  for (const s of states) {
    storeCode += `  ${s.stateName}: ${s.initialValue},\n  ${s.setterName}: (val) => set((state) => ({ ${s.stateName}: typeof val === 'function' ? (val as any)(state.${s.stateName}) : val })),\n`;
  }
  storeCode += `}));\n`;

  fs.writeFileSync(`${dirPath}/use${funcName}Store.ts`, storeCode);

  states.forEach(s => {
    s.stmt.replaceWithText(`const ${s.stateName} = use${funcName}Store(s => s.${s.stateName});\nconst ${s.setterName} = use${funcName}Store(s => s.${s.setterName});`);
  });

  file.addImportDeclaration({
    namedImports: [`use${funcName}Store`],
    moduleSpecifier: `./${compName}/use${funcName}Store`
  });
  console.log(`- Extracted ${states.length} states to use${funcName}Store.ts`);
}

// 2. Extract Styles
// For ChatScreenEnhanced, styles is "const styles = chatScreenStyles;" which might mean styles are imported or defined differently. Let's see if there's an object.
const variables = file.getVariableStatements();
let stylesNode = null;
variables.forEach(v => {
  const decls = v.getDeclarations();
  if (decls.length > 0 && decls[0].getName() === 'chatScreenStyles') {
    stylesNode = v;
  }
});

if (stylesNode) {
  const dirPath = `../native/screens/${compName}`;
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  let content = `import { StyleSheet } from 'react-native';\nimport { colors, spacing, typography, borderRadius } from '../../styles/theme';\n\nexport ` + stylesNode.getText();
  fs.writeFileSync(`${dirPath}/styles.ts`, content);
  stylesNode.remove();
  
  file.addImportDeclaration({
    namedImports: ['chatScreenStyles'],
    moduleSpecifier: `./${compName}/styles`
  });
  console.log(`- Extracted chatScreenStyles.`);
}

project.saveSync();
