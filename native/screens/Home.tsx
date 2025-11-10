import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../contexts/AuthContext";
import { storyService } from "../services/story.service";
import { glimpseService } from "../services/glimpse.service";
import { postService } from "../services/post.service";

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [momentsUsers, setMomentsUsers] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load feed posts
  useEffect(() => {
    loadFeed();
  }, [user]);

  // Load moments/stories
  useEffect(() => {
    if (user) {
      loadMoments();
    }
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const feedPosts = await postService.getFeedPosts(user.userId, 1, 20);
      setPosts(feedPosts);
      
      // Load liked status
      const postIds = feedPosts.map((p: any) => p.postId);
      const likedPostIds = await postService.getUserLikedPosts(user.userId, postIds);
      setLikedPosts(new Set(likedPostIds));
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoments = async () => {
    if (!user) return;
    try {
      setLoadingMoments(true);
      
      const followingStories = await storyService.getFollowingStories(user.userId);
      const myStories = await storyService.getUserActiveStories(user.userId);
      const stories = [...myStories, ...followingStories];
      
      const userStories: {[key: string]: any} = {};
      stories.forEach((story: any) => {
        if (!userStories[story.authorId]) {
          userStories[story.authorId] = {
            userId: story.authorId,
            username: story.authorUsername,
            avatarURL: story.authorAvatarURL,
            hasActiveStory: true,
            hasViewedAll: false,
            isCurrentUser: story.authorId === user.userId,
            isCloseFriendsStory: story.audience === 'closeFriends',
          };
        }
      });
      
      const userHasStory = stories.some((s: any) => s.authorId === user.userId);
      const currentUserData = {
        userId: user.userId,
        username: user.username,
        avatarURL: user.avatarURL,
        hasActiveStory: userHasStory,
        hasViewedAll: false,
        isCurrentUser: true,
        isCloseFriendsStory: false,
      };
      
      const allUsers = [
        currentUserData,
        ...Object.values(userStories).filter((u: any) => u.userId !== user.userId)
      ];
      
      setMomentsUsers(allUsers);
    } catch (error) {
      console.error('Failed to load moments:', error);
    } finally {
      setLoadingMoments(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([loadFeed(), loadMoments()]);
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !user) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const morePosts = await postService.getFeedPosts(user.userId, nextPage, 20);
      
      if (morePosts.length > 0) {
        setPosts(prev => [...prev, ...morePosts]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePostLike = async (postId: string, isLiked: boolean, postType?: string) => {
    if (!user) return;
    
    try {
      if (postType === 'glimpse') {
        if (isLiked) {
          await glimpseService.unlikeGlimpse(postId, user.userId);
          setLikedPosts(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
        } else {
          await glimpseService.likeGlimpse(postId, user.userId);
          setLikedPosts(prev => new Set(prev).add(postId));
        }
      } else {
        if (isLiked) {
          await postService.unlikePost(postId, user.userId);
          setLikedPosts(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
        } else {
          await postService.likePost(postId, user.userId);
          setLikedPosts(prev => new Set(prev).add(postId));
        }
      }
    } catch (error) {
      console.error('Failed to like/unlike:', error);
    }
  };

  const renderStoryItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => {
        if (item.isCurrentUser && !item.hasActiveStory) {
          navigation.navigate('MomentCreate');
        } else {
          navigation.navigate('StoryViewer', { userId: item.userId });
        }
      }}
      style={styles.storyItem}
    >
      <View style={styles.storyRingContainer}>
        {item.hasActiveStory && (
          <View style={[
            styles.storyRing,
            item.hasViewedAll ? styles.storyRingViewed : item.isCloseFriendsStory ? styles.storyRingCloseFriends : styles.storyRingActive
          ]} />
        )}
        <Image
          source={{ uri: item.avatarURL }}
          style={styles.storyAvatar}
        />
        {item.isCurrentUser && !item.hasActiveStory && (
          <View style={styles.addBadge}>
            <Ionicons name="add" size={14} color="#000" />
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.isCurrentUser ? 'Your Mo...' : item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: any) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile', { userId: item.authorId })}
          style={styles.postUser}
        >
          <Image source={{ uri: item.authorAvatarURL }} style={styles.postAvatar} />
          <View>
            <Text style={styles.postUsername}>{item.authorUsername}</Text>
            {item.location && <Text style={styles.postLocation}>{item.location}</Text>}
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('PostViewer', { postId: item.postId })}>
        <Image
          source={{ uri: item.mediaURLs?.[0] }}
          style={styles.postImage}
        />
      </TouchableOpacity>
      
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={() => handlePostLike(item.postId, likedPosts.has(item.postId), item.postType)}>
            <Ionicons 
              name={likedPosts.has(item.postId) ? "heart" : "heart-outline"} 
              size={28} 
              color={likedPosts.has(item.postId) ? "#ef4444" : "#fff"} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: item.postId })}>
            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SharePost', { postId: item.postId })}>
            <Ionicons name="paper-plane-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.postInfo}>
        <Text style={styles.likesCount}>{item.stats?.likesCount || 0} likes</Text>
        {item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionUsername}>{item.authorUsername}</Text> {item.caption}
          </Text>
        )}
        {(item.stats?.commentsCount || 0) > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: item.postId })}>
            <Text style={styles.viewComments}>
              View all {item.stats.commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const ListHeaderComponent = () => (
    <View>
      <View style={styles.momentsSection}>
        <Text style={styles.momentsTitle}>Moments</Text>
        {loadingMoments ? (
          <View style={styles.storiesContainer}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.storyItemSkeleton}>
                <View style={styles.storyAvatarSkeleton} />
                <View style={styles.storyNameSkeleton} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            horizontal
            data={momentsUsers}
            renderItem={renderStoryItem}
            keyExtractor={(item) => item.userId}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
          />
        )}
      </View>
    </View>
  );

  const ListFooterComponent = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  };

  const ListEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="trending-up" size={48} color="#666" />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptyText}>Follow people to see their posts in your feed</Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.emptyButtonText}>Discover People</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={20} color="#000" />
      </TouchableOpacity>
      
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.postId}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  refreshButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  momentsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  momentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  storiesContainer: {
    paddingHorizontal: 12,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyRingContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  storyRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 40,
    borderWidth: 2,
  },
  storyRingActive: {
    borderColor: '#ec4899',
  },
  storyRingViewed: {
    borderColor: '#666',
  },
  storyRingCloseFriends: {
    borderColor: '#22c55e',
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  storyUsername: {
    fontSize: 12,
    color: '#fff',
    maxWidth: 64,
  },
  storyItemSkeleton: {
    alignItems: 'center',
    width: 70,
  },
  storyAvatarSkeleton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    marginBottom: 8,
  },
  storyNameSkeleton: {
    width: 48,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  postCard: {
    marginBottom: 24,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postLocation: {
    color: '#888',
    fontSize: 12,
  },
  postImage: {
    width: width,
    height: width,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postActionsLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  postInfo: {
    paddingHorizontal: 16,
  },
  likesCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  loadingMore: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
