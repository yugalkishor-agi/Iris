import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Alert,
  Share} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { collectionService } from '../services/collection.service';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { Avatar } from '../components/ui/Avatar';
import { useLikeIntentController } from '../hooks/useLikeIntentController';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

export default function PostViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const postId = (route.params as any)?.postId;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await postService.getPost(postId, user?.userId);
      if (data) {
        let hydratedLiked = false;
        if (user) {
          const likedPosts = await postService.getUserLikedPosts(user.userId, [postId]);
          hydratedLiked = likedPosts.includes(postId);
        }
        setPost({
          ...data,
          isLiked: hydratedLiked,
        });
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
  }, [postId]);

  const {
    liked,
    likesCount,
    toggleLike,
    inFlight: likeInFlight,
  } = useLikeIntentController({
    userId: user?.userId,
    contentType: 'post',
    contentId: postId,
    initialLiked: !!post?.isLiked,
    initialLikesCount: Number(post?.stats?.likesCount || post?.likesCount || 0),
    onChange: (state) => {
      setPost((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          isLiked: state.liked,
          likesCount: state.likesCount,
          stats: {
            ...(prev.stats || {}),
            likesCount: state.likesCount,
          },
        };
      });
    },
    onError: (error) => {
      console.error('Failed to like/unlike post:', error);
    },
  });

  const handleLike = async () => {
    if (!user || actionLoading || likeInFlight) return;

    setActionLoading(true);
    try {
      await toggleLike();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || actionLoading) return;
    
    setActionLoading(true);
    const wasSaved = saved;
    setSaved(!saved);
    
    try {
      if (wasSaved) {
        await collectionService.unsavePostFromAllCollections(user.userId, postId);
      } else {
        await collectionService.savePost(user.userId, postId);
      }
    } catch (error) {
      setSaved(wasSaved); // Revert on error
      console.error('Failed to save/unsave post:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    if (!post) return;
    (navigation as any).navigate('SharePost', {
      contentType: 'post',
      contentData: {
        id: postId,
        authorId: post.authorId,
        authorUsername: post.authorUsername,
        authorAvatarURL: post.authorAvatarURL,
        mediaURL: post.mediaURLs?.[0],
        caption: post.caption,
        mediaType: /\.(mp4|mov|webm)$/i.test(String(post.mediaURLs?.[0] || '')) ? 'video' : 'image',
      },
      onShared: (count: number) => {
        if (!count || count <= 0) return;
        setPost((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              sharesCount: (prev.stats?.sharesCount || 0) + count,
            },
          };
        });
      },
    });
  };

  const handleExternalShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by @${post?.authorUsername}`,
        url: `https://iris.app/post/${postId}`,
      });
    } catch (error) {
      console.error('Failed to share externally:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !post || actionLoading) return;
    
    setActionLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    
    try {
      if (wasFollowing) {
        await userService.unfollowUser(user.userId, post.authorId);
      } else {
        await userService.followUser(user.userId, post.authorId);
      }
    } catch (error) {
      setIsFollowing(wasFollowing); // Revert on error
      console.error('Failed to follow/unfollow:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.text.secondary} />
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOwnPost = user?.userId === post.authorId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity onPress={handleExternalShare}>
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Author Info */}
        <View style={styles.authorSection}>
          <TouchableOpacity 
            style={styles.authorInfo}
            onPress={() => (navigation as any).navigate('UserProfile', { userId: post.authorId })}
          >
            <Avatar source={post.authorAvatarURL} size={40} />
            <View style={styles.authorText}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{post.authorDisplayName}</Text>
                {post.authorVerified && (
                  <VerifiedBadge size={16} />
                )}
              </View>
              <Text style={styles.authorUsername}>@{post.authorUsername}</Text>
            </View>
          </TouchableOpacity>
          
          {!isOwnPost && (
            <TouchableOpacity 
              onPress={handleFollow}
              style={[styles.followButton, isFollowing && styles.followingButton]}
              disabled={actionLoading}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Media */}
        <View style={styles.mediaContainer}>
          {post.mediaURLs?.map((mediaURL: string, index: number) => (
            <Image key={index} source={{ uri: mediaURL }} style={styles.postImage} />
          ))}
          {post.postType === 'carousel' && post.mediaURLs?.length > 1 && (
            <View style={styles.carouselIndicator}>
              <Text style={styles.carouselText}>1/{post.mediaURLs.length}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={handleLike} disabled={actionLoading}>
              <Ionicons 
                name={liked ? 'heart' : 'heart-outline'} 
                size={24} 
                color={liked ? '#ef4444' : colors.text.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => (navigation as any).navigate('Comments', { postId })}
              style={styles.actionButton}
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={actionLoading}>
            <Ionicons 
              name={saved ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={saved ? colors.accent.primary : colors.text.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Post Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.likesCount}>
            {likesCount} {(likesCount) === 1 ? 'like' : 'likes'}
          </Text>
        </View>

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionSection}>
            <Text style={styles.caption}>
              <Text style={styles.authorNameInCaption}>{post.authorUsername}</Text>
              {' '}{post.caption}
            </Text>
          </View>
        )}

        {/* Location */}
        {post.location && (
          <View style={styles.locationSection}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.locationText}>{post.location}</Text>
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.timestampSection}>
          <Text style={styles.timestamp}>
            {new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  author: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  media: { width, height: width, backgroundColor: '#f3f4f6' },
  actions: { flexDirection: 'row', padding: 16, gap: 20 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 15, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 22 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 16, color: colors.text.secondary, textAlign: 'center' },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: colors.accent.primary },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text.primary },
  content: { flex: 1 },
  authorSection: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  authorInfo: { flex: 1, marginLeft: 12 },
  authorText: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  authorName: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  authorUsername: { fontSize: 14, color: colors.text.secondary, marginTop: 2 },
  followButton: { backgroundColor: colors.accent.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  followingButton: { backgroundColor: colors.background.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.border.subtle },
  followButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  followingButtonText: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  mediaContainer: { backgroundColor: colors.background.secondary },
  postImage: { width: '100%', aspectRatio: 1 },
  carouselIndicator: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  carouselText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsSection: { paddingHorizontal: 16, paddingBottom: 8 },
  likesCount: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  captionSection: { paddingHorizontal: 16, paddingBottom: 16 },
  authorNameInCaption: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  locationSection: { paddingHorizontal: 16, paddingBottom: 8 },
  locationText: { fontSize: 14, color: colors.text.secondary },
  timestampSection: { paddingHorizontal: 16, paddingBottom: 16 },
  timestamp: { fontSize: 12, color: colors.text.muted },
});


