const { Project, SyntaxKind } = require('ts-morph');
const p = new Project();
const f = p.addSourceFileAtPath('../native/screens/StoryViewerScreenEnhanced.tsx');

let comp = f.getFunction('StoryViewerScreenEnhanced');
if (!comp) {
  const vars = f.getVariableStatements();
  for (const v of vars) {
    const d = v.getDeclarations()[0];
    if (d.getName() === 'StoryViewerScreenEnhanced') {
      comp = d.getInitializer();
      break;
    }
  }
}

if (!comp) {
  console.log('Component not found!');
  process.exit(1);
}

let stateCount = 0;
const states = [];

comp.getVariableStatements().forEach(stmt => {
  const decls = stmt.getDeclarations();
  if (decls.length !== 1) return;
  const decl = decls[0];
  const init = decl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression) {
    const expr = init.getExpression();
    if (expr.getText() === 'useState') {
      stateCount++;
      const pattern = decl.getNameNode();
      if (pattern.getKind() === SyntaxKind.ArrayBindingPattern) {
        const elements = pattern.getElements();
        if (elements.length === 2) {
          states.push(elements[0].getText());
        }
      }
    }
  }
});

console.log('Total States:', stateCount);
console.log(states.join(', '));
