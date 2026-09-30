const fs = require('fs');

function applyDeferredLoading(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if missing
  if (!content.includes('InteractionManager')) {
    content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];/, (match, p1) => {
      return `import { InteractionManager, ${p1} } from 'react-native';`;
    });
  }

  // Inject isReady state
  if (!content.includes('const [isReady, setIsReady]')) {
    content = content.replace(/const \[loading, setLoading\] = useState\(true\);/, 
      "const [loading, setLoading] = useState(true);\n  const [isReady, setIsReady] = useState(false);\n" +
      "  useEffect(() => {\n" +
      "    const task = InteractionManager.runAfterInteractions(() => {\n" +
      "      setIsReady(true);\n" +
      "    });\n" +
      "    return () => task.cancel();\n" +
      "  }, []);"
    );
  }

  // For ProfileScreen, return skeleton if not ready
  if (filePath.includes('ProfileScreen.tsx') && !content.includes('if (!isReady) return')) {
    content = content.replace(/return\s*\(\s*<SafeAreaView style=\{styles\.container\}>/, 
      "if (!isReady) {\n" +
      "    return (\n" +
      "      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>\n" +
      "        <ActivityIndicator size=\"large\" color=\"#00D47E\" />\n" +
      "      </SafeAreaView>\n" +
      "    );\n" +
      "  }\n\n  return (\n    <SafeAreaView style={styles.container}>"
    );
  }
  
  // For HomeScreenWorking, return skeleton if not ready
  if (filePath.includes('HomeScreenWorking.tsx') && !content.includes('if (!isReady) return')) {
    content = content.replace(/return\s*\(\s*<SafeAreaView style=\{styles\.container\}>/, 
      "if (!isReady) {\n" +
      "    return (\n" +
      "      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>\n" +
      "        <ActivityIndicator size=\"large\" color=\"#00D47E\" />\n" +
      "      </SafeAreaView>\n" +
      "    );\n" +
      "  }\n\n  return (\n    <SafeAreaView style={styles.container}>"
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Applied deferred loading to ' + filePath);
}

applyDeferredLoading('native/screens/ProfileScreen.tsx');
applyDeferredLoading('native/screens/HomeScreenWorking.tsx');
