const fs = require('fs');
const path = 'native/screens/HomeScreenWorking.tsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const result = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Fix header
  if (line.includes('<View style={styles.headerContainer}>')) {
    result.push(line);
    // Write out the correct header manually and skip whatever is broken
    result.push('      {/* App Header */}');
    result.push('      <View style={styles.header}>');
    result.push('        <View style={styles.headerSide} />');
    result.push('        <Text style={styles.headerTitle}>Iris</Text>');
    result.push('        <View style={[styles.headerSide, styles.headerRight]}>');
    result.push('          <TouchableOpacity');
    result.push('            style={styles.headerButton}');
    result.push("            onPress={() => (navigation as any).navigate('Suggestions')}");
    result.push('          >');
    result.push('            <Ionicons name="people-outline" size={24} color="#FFFFFF" />');
    result.push('          </TouchableOpacity>');
    result.push('          <TouchableOpacity ');
    result.push('            style={styles.headerButton}');
    result.push('            onPress={() => {');
    result.push("              (navigation as any).navigate('Notifications');");
    result.push('            }}');
    result.push('          >');
    result.push('            <View style={styles.notificationIconContainer}>');
    result.push('              <Ionicons name="heart-outline" size={24} color={unreadNotifications > 0 ? "#ef4444" : "#FFFFFF"} />');
    result.push('              {unreadNotifications > 0 && (');
    result.push('                <View style={styles.notificationBadge}>');
    result.push('                  <Text style={styles.notificationBadgeText}>');
    result.push("                    {unreadNotifications > 9 ? '9+' : unreadNotifications}");
    result.push('                  </Text>');
    result.push('                </View>');
    result.push('              )}');
    result.push('            </View>');
    result.push('          </TouchableOpacity>');
    result.push('          <TouchableOpacity ');
    result.push('            style={styles.headerButton}');
    result.push("            onPress={() => (navigation as any).navigate('Messages')}");
    result.push('          >');
    result.push('            <Animated.View style={{ transform: [ { translateX: messageWiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: [-3, 0, 3] }) }, { rotate: messageWiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-10deg", "0deg", "10deg"] }) } ] }}>');
    result.push('              <Ionicons name="paper-plane-outline" size={24} color={unreadMessages > 0 ? "#ef4444" : "#FFFFFF"} />');
    result.push('            </Animated.View>');
    result.push('          </TouchableOpacity>');
    result.push('        </View>');
    result.push('      </View>');

    // Skip until we find StoryProcessingBar
    i++;
    while (i < lines.length && !lines[i].includes('<StoryProcessingBar />')) {
      i++;
    }
    continue;
  }

  // Fix syntax error block
  if (line.includes('if (shouldShowInitialSkeleton) {') && lines[i+1]?.includes('if (!isReady) {')) {
    result.push('  if (!isReady) {');
    result.push('    return (');
    result.push("      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>");
    result.push('        <ActivityIndicator size="large" color="#00D47E" />');
    result.push('      </SafeAreaView>');
    result.push('    );');
    result.push('  }');
    result.push('');
    result.push('  if (shouldShowInitialSkeleton) {');
    result.push('    return (');
    result.push('      <SafeAreaView style={styles.container}>');
    result.push('        <StatusBar barStyle="light-content" backgroundColor="#000000" />');
    
    // Skip the broken lines
    i++;
    while (i < lines.length && !lines[i].includes('paddingHorizontal')) {
      i++;
    }
    // Push the paddingHorizontal line
    result.push(lines[i]);
    i++;
    continue;
  }

  result.push(line);
  i++;
}

fs.writeFileSync(path, result.join('\\n'), 'utf8');
console.log('Fixed HomeScreenWorking.tsx');
