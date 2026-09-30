import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, TextInput, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

interface DiscoverContent {
  id: string;
  type: 'post' | 'glimpse' | 'user';
  mediaURL?: string;
  thumbnailURL?: string;
  title?: string;
  subtitle?: string;
  stats?: {
    likesCount?: number;
    viewsCount?: number;
    followersCount?: number;
  };
  user?: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
  };
}

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'people'>('trending');
  const [content, setContent] = useState<DiscoverContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);

  useEffect(() => {
    loadDiscoverContent();
  }, [activeTab]);

  const loadDiscoverContent = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let discoverItems: DiscoverContent[] = [];
      
      switch (activeTab) {
        case 'trending':
          // Get trending posts and glimpses
          const [trendingPosts, { glimpses: trendingGlimpses }] = await Promise.all([
            postService.getTrendingPosts(20),
            glimpseService.getAllGlimpses(15, undefined, user?.userId)
          ]);
          
          // Convert posts to discover format
          if (trendingPosts) {
            const postItems = trendingPosts.map((post: any) => ({
              id: post.postId,
              type: 'post' as const,
              mediaURL: post.mediaURLs?.[0],
              thumbnailURL: post.thumbnailURL,
              stats: {
                likesCount: post.stats?.likesCount || 0,
              },
              user: {
                userId: post.authorId,
                username: post.authorUsername,
                displayName: post.authorDisplayName,
                avatarURL: post.authorAvatarURL,
              }
            }));
            discoverItems.push(...postItems);
          }
          
          // Convert glimpses to discover format
          if (trendingGlimpses) {
            const glimpseItems = trendingGlimpses.map((glimpse: any) => ({
              id: glimpse.storyId,
              type: 'glimpse' as const,
              mediaURL: glimpse.mediaURL,
              thumbnailURL: glimpse.thumbnailURL,
              stats: {
                likesCount: glimpse.likesCount || 0,
                viewsCount: glimpse.viewsCount || 0,
              },
              user: {
                userId: glimpse.authorId,
                username: glimpse.authorUsername,
                displayName: glimpse.authorDisplayName,
                avatarURL: glimpse.authorAvatarURL,
              }
            }));
            discoverItems.push(...glimpseItems);
          }
          
          // Sort by engagement
          discoverItems.sort((a, b) => {
            const aEngagement = (a.stats?.likesCount || 0) + (a.stats?.viewsCount || 0);
            const bEngagement = (b.stats?.likesCount || 0) + (b.stats?.viewsCount || 0);
            return bEngagement - aEngagement;
          });
          
          break;
          
        case 'recent':
          // Get recent posts and glimpses
          const followingIds = await userService.getFollowing(user.userId);
          const [recentPosts, recentGlimpses] = await Promise.all([
            postService.getFeedPosts(followingIds, user.userId, 15),
            glimpseService.getFeedGlimpses(followingIds, user.userId, 10)
          ]);
          
          // Combine and format recent content
          const recentPostItems = (recentPosts.posts || []).map((post: any) => ({
            id: post.postId,
            type: 'post' as const,
            mediaURL: post.mediaURLs?.[0],
            stats: { likesCount: post.stats?.likesCount || 0 },
            user: {
              userId: post.authorId,
              username: post.authorUsername,
              displayName: post.authorDisplayName,
              avatarURL: post.authorAvatarURL,
            }
          }));
          
          const recentGlimpseItems = (recentGlimpses || []).map((glimpse: any) => ({
            id: glimpse.storyId,
            type: 'glimpse' as const,
            mediaURL: glimpse.mediaURL,
            stats: { 
              likesCount: glimpse.likesCount || 0,
              viewsCount: glimpse.viewsCount || 0 
            },
            user: {
              userId: glimpse.authorId,
              username: glimpse.authorUsername,
              displayName: glimpse.authorDisplayName,
              avatarURL: glimpse.authorAvatarURL,
            }
          }));
          
          discoverItems = [...recentPostItems, ...recentGlimpseItems];
          break;
          
        case 'people':
          // Get suggested users (simplified)
          const allFollowing = await userService.getFollowing(user.userId);
          const suggestedUserIds = allFollowing.slice(0, 20); // Get some users from network
          
          const userPromises = suggestedUserIds.map(async (userId: string) => {
            const userData = await userService.getUser(userId);
            if (userData) {
              return {
                id: userData.userId,
                type: 'user' as const,
                mediaURL: userData.avatarURL,
                title: userData.displayName,
                subtitle: `@${userData.username}`,
                stats: {
                  followersCount: userData.stats?.followersCount || 0,
                },
                user: {
                  userId: userData.userId,
                  username: userData.username,
                  displayName: userData.displayName,
                  avatarURL: userData.avatarURL,
                }
              };
            }
            return null;
          });
          
          const users = await Promise.all(userPromises);
          discoverItems = users.filter(u => u !== null) as DiscoverContent[];
          break;
      }
      
      setContent(discoverItems.slice(0, 50)); // Limit results
      console.log('🔍 Loaded discover content:', discoverItems.length, 'for tab:', activeTab);
      
      // Load trending hashtags for trending tab
      if (activeTab === 'trending') {
        setTrendingHashtags([
          { tag: 'photography', posts: 12500 },
          { tag: 'travel', posts: 9800 },
          { tag: 'food', posts: 8200 },
          { tag: 'art', posts: 6500 },
          { tag: 'nature', posts: 5800 },
        ]);
      }
      
    } catch (error) {
      console.error('Failed to load discover content:', error);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiscoverContent();
    setRefreshing(false);
  };

  const handleContentPress = (item: DiscoverContent) => {
    switch (item.type) {
      case 'post':
        (navigation as any).navigate('PostView', { postId: item.id });
        break;
      case 'glimpse':
        (navigation as any).navigate('GlimpseViewer', { glimpseId: item.id });
        break;
      case 'user':
        (navigation as any).navigate('UserProfile', { userId: item.id });
        break;
    }
  };

  const handleHashtagPress = (hashtag: string) => {
    (navigation as any).navigate('Hashtag', { hashtag });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      (navigation as any).navigate('Main', { screen: 'Search', params: { query: searchQuery.trim() } });
    }
  };

  const renderGridItem = ({ item }: { item: DiscoverContent }) => {
    if (item.type === 'user') {
      return (
        <TouchableOpacity 
          style={styles.userCard}
          onPress={() => handleContentPress(item)}
        >
          <Image 
            source={{ uri: item.mediaURL || 'https://via.placeholder.com/100' }} 
            style={styles.userAvatar} 
          />
          <Text style={styles.userName} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.userSubtitle} numberOfLines={1}>{item.subtitle}</Text>
          <Text style={styles.userStats}>
            {item.stats?.followersCount || 0} followers
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => handleContentPress(item)}
      >
        <Image source={{ uri: item.mediaURL }} style={styles.gridImage} />
        
        {/* Content type indicator */}
        {item.type === 'glimpse' && (
          <View style={styles.glimpseIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        
        {/* Stats overlay */}
        <View style={styles.statsOverlay}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.statText}>{item.stats?.likesCount || 0}</Text>
          </View>
          {item.stats?.viewsCount && (
            <View style={styles.statItem}>
              <Ionicons name="eye" size={12} color="#fff" />
              <Text style={styles.statText}>{item.stats.viewsCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHashtag = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.hashtagItem}
      onPress={() => handleHashtagPress(item.tag)}
    >
      <Text style={styles.hashtagText}>#{item.tag}</Text>
      <Text style={styles.hashtagCount}>{item.posts.toLocaleString()} posts</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Main', { screen: 'Search' })}>
          <Ionicons name="search" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, glimpses, people..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        {['trending', 'recent', 'people'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Discovering content...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Trending Hashtags (only for trending tab) */}
          {activeTab === 'trending' && trendingHashtags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending Hashtags</Text>
              <FlashList estimatedItemSize={100}
                data={trendingHashtags}
                renderItem={renderHashtag}
                keyExtractor={(item) => item.tag}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hashtagsList as any}
              />
            </View>
          )}
          
          {/* Content Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'people' ? 'Suggested People' : 'Discover Content'}
            </Text>
            
            {content.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No content found</Text>
                <Text style={styles.emptySubtitle}>
                  Try switching tabs or refreshing
                </Text>
              </View>
            ) : (
              <FlashList estimatedItemSize={100}
                data={content}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id}
                numColumns={activeTab === 'people' ? 2 : 3}
                scrollEnabled={false}
                contentContainerStyle={styles.grid as any}
              />
            )}
          </View>
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.accent.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  hashtagsList: {
    paddingHorizontal: spacing.lg,
  },
  hashtagItem: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  hashtagText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  hashtagCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  grid: {
    paddingHorizontal: spacing.lg,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  glimpseIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  userCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: spacing.sm,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    textAlign: 'center',
  },
  userSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  userStats: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

