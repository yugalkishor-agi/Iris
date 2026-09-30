import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { useAuth } from '../contexts/AuthContext';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const imageSize = (width - spacing.md * 4) / 3;

export default function DiscoveryScreenEnhanced() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadDiscoveryContent();
  }, []);

  const loadDiscoveryContent = async () => {
    try {
      setLoading(true);
      
      const [posts, glimpses] = await Promise.all([
        postService.getExplorePosts(30),
        glimpseService.getExploreGlimpses(20),
      ]);

      // Mix posts and glimpses randomly
      const allContent = [
        ...(posts || []).map((p: any) => ({ ...p, type: 'post' })),
        ...(glimpses || []).map((g: any) => ({ ...g, type: 'glimpse' }))
      ].sort(() => Math.random() - 0.5);

      setContent(allContent);
    } catch (error) {
      console.error('Failed to load discovery content:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiscoveryContent();
    setRefreshing(false);
  };

  const handleContentPress = (item: any) => {
    const isGlimpse = item.type === 'glimpse' || item.isGlimpse || item.glimpseId;
    const itemId = item.postId || item.glimpseId || item.storyId;
    
    if (isGlimpse) {
      (navigation as any).navigate('GlimpseViewer', { glimpseId: itemId });
    } else {
      (navigation as any).navigate('PostViewer', { id: itemId });
    }
  };

  const renderContent = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.contentItem}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.mediaURLs?.[0] || item.mediaURL }}
        style={styles.contentImage}
        contentFit="cover"
      />
      {item.mediaType === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
      {item.type === 'glimpse' && (
        <View style={styles.glimpseOverlay}>
          <Ionicons name="film" size={12} color="white" />
        </View>
      )}
      <View style={styles.contentStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={12} color="white" />
          <Text style={styles.statText}>{item.stats?.likesCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Main', { screen: 'Search' })}>
          <Ionicons name="search" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={content}
        renderItem={renderContent}
        keyExtractor={(item) => item.postId || item.glimpseId}
        numColumns={3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
          />
        }
        contentContainerStyle={styles.contentGrid as any}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentGrid: {
    padding: 2,
  },
  contentItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    position: 'relative',
  },
  contentImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
  },
  videoOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  glimpseOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  contentStats: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: 'white',
    fontWeight: typography.fontWeight.semibold as any,
  },
});
