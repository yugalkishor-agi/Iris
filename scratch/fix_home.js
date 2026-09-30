const fs = require('fs');

const path = 'native/screens/HomeScreenWorking.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the header
const badHeader = `<TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate('Suggestions')}
          >
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate('Messages')}
          >`;

const goodHeader = `<TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate('Suggestions')}
          >
            <Ionicons name="people-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              (navigation as any).navigate('Notifications');
            }}
          >
            <View style={styles.notificationIconContainer}>
              <Ionicons name="heart-outline" size={24} color={unreadNotifications > 0 ? "#ef4444" : "#FFFFFF"} />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate('Messages')}
          >`;

if (content.includes(badHeader)) {
  content = content.replace(badHeader, goodHeader);
  console.log('Fixed header');
}

// 2. Fix the syntax error block
const badSyntaxBlock = `  if (shouldShowInitialSkeleton) {
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

const goodSyntaxBlock = `  if (!isReady) {
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

if (content.includes(badSyntaxBlock)) {
  content = content.replace(badSyntaxBlock, goodSyntaxBlock);
  console.log('Fixed syntax block');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done fixing HomeScreenWorking.tsx');
