import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { glimpseService } from '../services/glimpse.service';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { Avatar } from '../components/ui/Avatar';
import { FlashList } from '@shopify/flash-list';

const { width, height } = Dimensions.get('window');

interface Reel {
  id: string;
  videoURL: string;
  thumbnailURL?: string;
  caption: string;
  author: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    verified?: boolean;
  };
  stats: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
  };
  createdAt: any;
  isLiked?: boolean;
  music?: {
    title: string;
    artist: string;
  };
}

export default function ReelsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlashList<any>>(null);
  const videoRefs = useRef<{ [key: string]: Video }>({});
  const likeUnsubsRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    loadReels();
  }, []);

  // Refresh liked state whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      const refreshLikes = async () => {
        if (!user || reels.length === 0) return;
        try {
          const reelIds = reels.map(r => r.id);
          const likedIds = await glimpseService.getUserLikedGlimpses(user.userId, reelIds);
          if (!cancelled) setLikedReels(new Set(likedIds));
        } catch {}
      };
      refreshLikes();
      return () => { cancelled = true; };
    }, [user, reels])
  );

  // Real-time like listeners per reel for current user
  useEffect(() => {
    if (!user || reels.length === 0) return;
    // Cleanup previous listeners
    Object.values(likeUnsubsRef.current).forEach((unsub) => {
      try { unsub && unsub(); } catch {}
    });
    likeUnsubsRef.current = {};

    reels.forEach((r) => {
      const id = r.id;
      try {
        likeUnsubsRef.current[id] = glimpseService.listenUserLike(id, user.userId, (liked) => {
          setLikedReels((prev) => {
            const next = new Set(prev);
            if (liked) next.add(id); else next.delete(id);
            return next;
          });
        });
      } catch {}
    });

    return () => {
      Object.values(likeUnsubsRef.current).forEach((unsub) => {
        try { unsub && unsub(); } catch {}
      });
      likeUnsubsRef.current = {};
    };
  }, [user, reels]);

  const loadReels = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get video glimpses (reels) from following + public
      const followingIds = await userService.getFollowing(user.userId);
      console.log('🎬 Loading reels for following:', followingIds.length);
      
      let allReels: Reel[] = [];
      
      // Get reels from following users
      if (followingIds.length > 0) {
        const followingReels = await glimpseService.getFeedGlimpses(followingIds, user.userId, 15);
        const videoReels = followingReels.filter(g => g.mediaType === 'video');
        allReels.push(...videoReels.map(formatGlimpseToReel));
      }
      
      // Get public video reels
      const { glimpses: publicGlimpses } = await glimpseService.getAllGlimpses(20, undefined, user?.userId);
      const publicVideoReels = publicGlimpses.filter(g => g.mediaType === 'video');
      allReels.push(...publicVideoReels.map(formatGlimpseToReel));
      
      // Remove duplicates and sort by engagement
      const uniqueReels = allReels
        .filter((r, index, arr) => arr.findIndex(item => item.id === r.id) === index)
        .sort((a, b) => {
          const aEngagement = a.stats.likesCount + a.stats.viewsCount + a.stats.commentsCount;
          const bEngagement = b.stats.likesCount + b.stats.viewsCount + b.stats.commentsCount;
          return bEngagement - aEngagement;
        });
      
      setReels(uniqueReels);
      
      // Load liked status
      if (uniqueReels.length > 0) {
        const reelIds = uniqueReels.map(r => r.id);
        const likedIds = await glimpseService.getUserLikedGlimpses(user.userId, reelIds);
        setLikedReels(new Set(likedIds));
      }
      
      console.log('🎬 Loaded reels:', uniqueReels.length);
    } catch (error) {
      console.error('Failed to load reels:', error);
      Alert.alert('Error', 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const formatGlimpseToReel = (glimpse: any): Reel => ({
    id: glimpse.storyId,
    videoURL: glimpse.mediaURL,
    thumbnailURL: glimpse.thumbnailURL,
    caption: glimpse.caption || '',
    author: {
      userId: glimpse.authorId,
      username: glimpse.authorUsername,
      displayName: glimpse.authorDisplayName || glimpse.authorUsername,
      avatarURL: glimpse.authorAvatarURL,
      verified: glimpse.authorVerified || false,
    },
    stats: {
      likesCount: glimpse.likesCount || 0,
      commentsCount: glimpse.commentsCount || 0,
      sharesCount: glimpse.sharesCount || 0,
      viewsCount: glimpse.viewsCount || 0,
    },
    createdAt: glimpse.createdAt,
    music: glimpse.backgroundMusic,
  });

  const handleLike = async (reel: Reel) => {
    if (!user) return;
    
    const isLiked = likedReels.has(reel.id);
    
    try {
      if (isLiked) {
        await glimpseService.unlikeGlimpse(reel.id, user.userId);
        setLikedReels(prev => {
          const newSet = new Set(prev);
          newSet.delete(reel.id);
          return newSet;
        });
        // Update local stats
        setReels(prev => prev.map(r => 
          r.id === reel.id 
            ? { ...r, stats: { ...r.stats, likesCount: Math.max(0, r.stats.likesCount - 1) } }
            : r
        ));
      } else {
        await glimpseService.likeGlimpse(reel.id, user.userId);
        setLikedReels(prev => new Set([...prev, reel.id]));
        // Update local stats
        setReels(prev => prev.map(r => 
          r.id === reel.id 
            ? { ...r, stats: { ...r.stats, likesCount: r.stats.likesCount + 1 } }
            : r
        ));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleComment = (reel: Reel) => {
    (navigation as any).navigate('Comments', { 
      postId: reel.id, 
      fromGlimpses: true 
    });
  };

  const handleShare = (reel: Reel) => {
    (navigation as any).navigate('SharePost', { 
      postId: reel.id,
      postType: 'reel'
    });
  };

  const handleUserPress = (reel: Reel) => {
    (navigation as any).navigate('UserProfile', { userId: reel.author.userId });
  };

  const handleViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      
      // Pause all videos except current
      Object.keys(videoRefs.current).forEach((key, index) => {
        const video = videoRefs.current[key];
        if (video) {
          if (index === newIndex) {
            video.playAsync();
          } else {
            video.pauseAsync();
          }
        }
      });
    }
  };

  const renderReel = ({ item, index }: { item: Reel; index: number }) => {
    const isLiked = likedReels.has(item.id);
    
    return (
      <View style={styles.reelContainer}>
        {/* Video */}
        <Video
          ref={(ref) => {
            if (ref) videoRefs.current[item.id] = ref;
          }}
          source={{ uri: item.videoURL }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={index === currentIndex}
          isLooping
          isMuted={false}
        />
        
        {/* Overlay Content */}
        <View style={styles.overlay}>
          {/* User Info */}
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => handleUserPress(item)}
          >
            <Avatar source={item.author.avatarURL} size={44} />
            <View style={styles.userText}>
              <View style={styles.userNameRow}>
                <Text style={styles.username}>@{item.author.username}</Text>
                {item.author.verified && (
                  <VerifiedBadge size={16} />
                )}
              </View>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          
          {/* Caption */}
          {item.caption && (
            <Text style={styles.caption} numberOfLines={3}>
              {item.caption}
            </Text>
          )}
          
          {/* Music Info */}
          {item.music && (
            <View style={styles.musicInfo}>
              <Ionicons name="musical-notes" size={16} color="#fff" />
              <Text style={styles.musicText} numberOfLines={1}>
                {item.music.title} - {item.music.artist}
              </Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={32} 
              color={isLiked ? "#ff3040" : "#fff"} 
            />
            <Text style={styles.actionText}>{formatCount(item.stats.likesCount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleComment(item)}
          >
            <Ionicons name="chatbubble-outline" size={30} color="#fff" />
            <Text style={styles.actionText}>{formatCount(item.stats.commentsCount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="paper-plane-outline" size={30} color="#fff" />
            <Text style={styles.actionText}>{formatCount(item.stats.sharesCount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reels</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('GlimpseCreate')}>
            <Ionicons name="camera" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading reels...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('GlimpseCreate')}>
          <Ionicons name="camera" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <FlashList estimatedItemSize={100}
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />
    </SafeAreaView>
  );
}

const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp || 0);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const formatCount = (count: number) => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
  reelContainer: {
    width,
    height: height - 100,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 140,
    left: spacing.lg,
    right: 80,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: '#fff',
  },
  timeAgo: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  caption: {
    fontSize: typography.fontSize.base,
    color: '#fff',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  musicText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
    flex: 1,
  },
  actions: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 140,
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    fontWeight: typography.fontWeight.medium as any,
  },
});

