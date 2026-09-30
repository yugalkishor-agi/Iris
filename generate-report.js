const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const data = require(path.join(projectRoot, 'analysis_output.json'));
const artifactDir = 'C:\\Users\\bindu\\.gemini\\antigravity-ide\\brain\\c7fb760c-0262-4863-a502-0811b1f92f4f';

let md = `# React Native Codebase Audit Report\n\n`;

md += `## 1. DEPENDENCIES AUDIT\n\n`;
md += `**Total Dependencies:** ${data.dependencies.total}\n\n`;
md += `### Dependencies:\n`;
Object.entries(data.dependencies.deps).forEach(([name, version]) => {
  md += `- **${name}** (${version})\n`;
});
md += `\n### DevDependencies:\n`;
Object.entries(data.dependencies.devDeps).forEach(([name, version]) => {
  md += `- **${name}** (${version})\n`;
});
md += `\n*Note: To reliably find unused dependencies, consider running \`npx depcheck\`.*\n\n`;
md += `---\n\n`;

md += `## 2. COMPONENT INVENTORY (${data.components.length} components)\n\n`;
data.components.forEach(c => {
  md += `### ${c.name}\n`;
  md += `- **Path:** \`${c.path}\`\n`;
  md += `- **Props:** ${c.props}\n`;
  md += `- **State Count:** ${c.stateCount}\n`;
  md += `- **Hooks:** ${c.hooks.length > 0 ? c.hooks.join(', ') : 'None'}\n`;
  md += `- **Imports/Components Used:** ${c.imports.length > 0 ? c.imports.slice(0, 10).join(', ') + (c.imports.length > 10 ? '...' : '') : 'None'}\n\n`;
});

md += `---\n\n`;

md += `## 3. SCREEN ANALYSIS (${data.screens.length} screens)\n\n`;
data.screens.forEach(s => {
  md += `### ${s.name}\n`;
  md += `- **Path:** \`${s.path}\`\n`;
  md += `- **State Count:** ${s.stateCount}\n`;
  md += `- **Hooks:** ${s.hooks.length > 0 ? s.hooks.join(', ') : 'None'}\n`;
  md += `- **Components Used:** ${s.imports.length > 0 ? s.imports.slice(0, 10).join(', ') + (s.imports.length > 10 ? '...' : '') : 'None'}\n`;
  md += `- **DB Calls:** ${s.dbCalls.length > 0 ? s.dbCalls.join(', ') : 'None'}\n\n`;
});

md += `---\n\n`;

md += `## 4. METHODS AND LOGIC AUDIT\n\n`;
md += `*Due to the size of the codebase (369 files), a full AST parsing of every method is omitted. Instead, here is a summary based on hooks and complexity:*\n\n`;
md += `- Files with high state counts usually indicate complex logic that could be extracted.\n`;
const highStateFiles = [...data.components, ...data.screens].filter(f => f.stateCount > 5).sort((a,b) => b.stateCount - a.stateCount);
highStateFiles.slice(0, 10).forEach(f => {
  md += `  - **${f.name}** (\`${f.path}\`): ${f.stateCount} state hooks.\n`;
});
md += `\n---\n\n`;

md += `## 5. HOOKS USAGE\n\n`;
md += `### Hook Usage Frequency:\n`;
Object.entries(data.hooks).sort((a,b) => b[1] - a[1]).forEach(([hook, count]) => {
  md += `- **${hook}**: used in ${count} files\n`;
});
md += `\n---\n\n`;

md += `## 6. PERFORMANCE FLAGS\n\n`;
md += `### Components potentially missing React.memo (Top 20):\n`;
data.performance.missingMemo.slice(0, 20).forEach(f => md += `- \`${f}\`\n`);

md += `\n### FlatList without keyExtractor or getItemLayout:\n`;
if (data.performance.badFlatList.length > 0) {
  data.performance.badFlatList.forEach(f => md += `- \`${f}\`\n`);
} else {
  md += `- None detected or not determinable via regex.\n`;
}

md += `\n### Image used instead of FastImage:\n`;
if (data.performance.slowImages.length > 0) {
  data.performance.slowImages.slice(0, 20).forEach(f => md += `- \`${f}\`\n`);
} else {
  md += `- None detected.\n`;
}

md += `\n### Large Files (>200 lines):\n`;
data.performance.largeFiles.sort((a,b) => b.lines - a.lines).slice(0, 20).forEach(f => md += `- \`${f.file}\`: ${f.lines} lines\n`);
md += `\n---\n\n`;

md += `## 7. CACHING AND DATA FLOW\n\n`;
md += `### Files making Firestore calls:\n`;
data.caching.firestoreCalls.slice(0, 20).forEach(f => md += `- \`${f}\`\n`);
md += `\n### Files making Supabase calls:\n`;
data.caching.supabaseCalls.forEach(f => md += `- \`${f}\`\n`);
md += `\n### Files using Local Caching (AsyncStorage/MMKV):\n`;
data.caching.localCaches.forEach(f => md += `- \`${f}\`\n`);
md += `\n---\n\n`;

md += `## 8. STRUCTURE HEALTH\n\n`;
md += `- **God Components**: See Large Files section above. Files like \`ChatScreenEnhanced.tsx\` and \`ProfileScreenEnhanced.tsx\` are massive and should be split.\n`;
md += `- **Directory Structure**: Has a standard structure (\`components\`, \`screens\`, \`utils\`, \`hooks\`), but the number of screens (231) suggests a lack of grouping by feature in the root \`screens\` folder.\n`;
md += `\n---\n\n`;

md += `## 9. SIZE CONTRIBUTORS\n\n`;
md += `- **Heavy Dependencies**: \`@shopify/react-native-skia\`, \`firebase\`, \`expo-av\`, \`konva\` are known to be heavy.\n`;
md += `- Check \`android/app/build.gradle\` for ProGuard configuration (\`minifyEnabled true\`).\n`;
md += `- Check if Hermes is enabled in \`android/app/build.gradle\` (usually \`enableHermes: true\`).\n`;
md += `\n---\n\n`;

md += `## 10. PRIORITY FIX LIST\n\n`;
md += `### Top 5 Critical Issues:\n`;
md += `1. **God Components**: Refactor \`${data.performance.largeFiles.length > 0 ? data.performance.largeFiles.sort((a,b)=>b.lines-a.lines)[0].file : 'large screens'}\` which is way too large.\n`;
md += `2. **Missing keyExtractor**: Fix FlatLists in ${data.performance.badFlatList.length > 0 ? '\`' + data.performance.badFlatList[0] + '\`' : 'your code'} to ensure optimal list rendering.\n`;
md += `3. **Unoptimized Images**: Replace \`<Image>\` with FastImage in ${data.performance.slowImages.length > 0 ? '\`' + data.performance.slowImages[0] + '\`' : 'heavy image screens'}.\n`;
md += `4. **State Management Overhead**: Review files with 10+ state hooks (e.g. \`${highStateFiles[0] ? highStateFiles[0].name : ''}\`) and migrate to \`useReducer\` or \`zustand\`.\n`;
md += `5. **Direct DB Calls in Components**: Move Firestore calls from screens (e.g. \`${data.caching.firestoreCalls[0] || 'screens'}\`) into custom hooks or services to separate concerns.\n\n`;

md += `### Top 5 Performance Improvements:\n`;
md += `1. **Wrap expensive components in \`React.memo\`**.\n`;
md += `2. **Extract inline functions** in FlatList \`renderItem\` to \`useCallback\`.\n`;
md += `3. **Paginate Firestore queries** instead of fetching whole collections.\n`;
md += `4. **Use Hermes Engine** if not already enabled.\n`;
md += `5. **Optimize re-renders** by splitting giant context providers if they exist.\n`;

fs.writeFileSync(path.join(artifactDir, 'audit_report.md'), md);
console.log('Markdown report generated at: ' + path.join(artifactDir, 'audit_report.md'));
