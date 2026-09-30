const fs = require('fs');

const path = 'native/screens/HomeScreenWorking.tsx';
let content = fs.readFileSync(path, 'utf8');

const badBlock = `  if (shouldShowInitialSkeleton) {
    if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00D47E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />`;

const goodBlock = `  if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00D47E" />
      </SafeAreaView>
    );
  }

  if (shouldShowInitialSkeleton) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />`;

if (content.includes(badBlock)) {
  content = content.replace(badBlock, goodBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed syntax error in HomeScreenWorking.tsx');
} else {
  console.log('Could not find the exact bad block. Did you already fix it?');
}
