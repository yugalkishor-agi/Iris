const fs = require('fs');

let txt = fs.readFileSync('native/screens/HomeScreenWorking.tsx', 'utf8');

const marker = '  return (\n    <SafeAreaView style={styles.container}>\n      <StatusBar barStyle="light-content" backgroundColor="#000000" />';

const idx = txt.lastIndexOf(marker); // Get the last one in case it was duplicated!

if (idx !== -1) {
  const replacement = marker + `
      
      {/* Main Feed */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyExtractor={(item) => item.postId}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#007AFF']}
          />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfigRef.current}
        onScroll={(event) => {
          scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
          scheduleRecomputeActiveMusicPost();
        }}
        scrollEventThrottle={16}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}
`;

  // Actually, wait, let's find the FIRST occurrence of the marker!
  const firstIdx = txt.indexOf(marker);
  
  if (firstIdx !== -1) {
    txt = txt.substring(0, firstIdx) + replacement;
    fs.writeFileSync('native/screens/HomeScreenWorking.tsx', txt, 'utf8');
    console.log('Fixed HomeScreenWorking.tsx');
  }
} else {
  console.log('Marker not found');
}
