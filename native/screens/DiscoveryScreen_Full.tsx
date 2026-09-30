import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const itemSize = (width - spacing.lg * 2 - spacing.xs * 2) / 3;

interface ExplorePost {
  postId: string;
  mediaURLs: string[];
  mediaType: 'image' | 'video';
  postType: 'post' | 'glimpse';
  stats?: {
    likesCount: number;
    commentsCount: number;
  };
}

export default function DiscoveryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [glimpses, setGlimpses] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'glimpses'>('posts');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);

      const [explorePosts, exploreGlimpses] = await Promise.all([
        postService.getExplorePosts(30),
        glimpseService.getExploreGlimpses(30),
      ]);

      setPosts(explorePosts as unknown as ExplorePost[]);
      setGlimpses(exploreGlimpses as unknown as ExplorePost[]);
    } catch (error) {
      console.error('Failed to load explore content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadContent();
  };

  const handlePostPress = (post: ExplorePost) => {
    if (post.postType === 'glimpse') {
      (navigation as any).navigate('GlimpseViewer', { glimpseId: post.postId });
    } else {
      (navigation as any).navigate('PostView', { postId: post.postId });
    }
  };

  const renderPost = ({ item }: { item: ExplorePost }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.mediaURLs[0] }}
        style={styles.gridImage}
        contentFit="cover"
      />

      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      )}

      {item.postType === 'glimpse' && (
        <View style={styles.glimpseBadge}>
          <Ionicons name="film" size={16} color="#fff" />
        </View>
      )}

      {item.stats && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#fff" />
            <Text style={styles.statText}>{item.stats.likesCount}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="compass-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>Explore Content</Text>
      <Text style={styles.emptyText}>
        Discover posts and glimpses from the community
      </Text>
    </View>
  );

  const currentData = activeTab === 'posts' ? posts : glimpses;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Main', { screen: 'Search' })}
        >
          <Ionicons name="search-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'posts' ? colors.text.primary : colors.text.secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'glimpses' && styles.activeTab]}
          onPress={() => setActiveTab('glimpses')}
        >
          <Ionicons
            name="film-outline"
            size={22}
            color={activeTab === 'glimpses' ? colors.text.primary : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Content Grid */}
      <FlashList estimatedItemSize={100}
        data={currentData}
        renderItem={renderPost}
        keyExtractor={(item) => item.postId}
        numColumns={3}
        contentContainerStyle={(
          currentData.length === 0 ? styles.emptyContent : styles.grid
        ) as any}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.text.primary,
  },
  grid: {
    padding: spacing.xs,
  },
  emptyContent: {
    flexGrow: 1,
  },
  gridItem: {
    width: itemSize,
    height: itemSize,
    margin: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.background.tertiary,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.full,
    padding: 4,
  },
  glimpseBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(147,51,234,0.8)',
    borderRadius: borderRadius.full,
    padding: 4,
  },
  stats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: typography.fontWeight.semibold as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
