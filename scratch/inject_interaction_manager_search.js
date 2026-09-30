const fs = require('fs');

function applyDeferredLoading(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('InteractionManager')) {
    content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];/, (match, p1) => {
      return `import { InteractionManager, ${p1} } from 'react-native';`;
    });
  }

  if (!content.includes('const [isReady, setIsReady]')) {
    content = content.replace(/const \[query, setQuery\] = useState\(''\);/, 
      "const [query, setQuery] = useState('');\n  const [isReady, setIsReady] = useState(false);\n" +
      "  useEffect(() => {\n" +
      "    const task = InteractionManager.runAfterInteractions(() => {\n" +
      "      setIsReady(true);\n" +
      "    });\n" +
      "    return () => task.cancel();\n" +
      "  }, []);"
    );
  }

  if (!content.includes('if (!isReady) return')) {
    content = content.replace(/return\s*\(\s*<SafeAreaView style=\{styles\.screen\}>/, 
      "if (!isReady) {\n" +
      "    return (\n" +
      "      <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>\n" +
      "        <ActivityIndicator size=\"large\" color=\"#00D47E\" />\n" +
      "      </SafeAreaView>\n" +
      "    );\n" +
      "  }\n\n  return (\n    <SafeAreaView style={styles.screen}>"
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Applied deferred loading to ' + filePath);
}

applyDeferredLoading('native/screens/SearchScreenEnhanced.tsx');
