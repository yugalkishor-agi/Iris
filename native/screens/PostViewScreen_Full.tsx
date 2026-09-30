import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params as any;
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await postService.getPost(postId);
      if (!postData) {
        setPost(null);
        setLikesCount(0);
        setLoading(false);
        return;
      }
      setPost(postData);
      setLikesCount(postData.stats?.likesCount || 0);

      if (user) {
        const liked = await postService.isPostLiked(postId, user.userId);
        setIsLiked(liked);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await postService.unlikePost(postId, user.userId);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await postService.likePost(postId, user.userId);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Failed to like/unlike:', error);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleExternalShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Check out this post by @${post.authorUsername}`,
        url: `https://iris.app/post/${postId}`,
      });
    } catch (error) {
      console.error('Failed to share externally:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => (navigation as any).navigate('Profile', { username: post.authorUsername })}
          activeOpacity={0.7}
        >
          <Avatar
            source={post.authorAvatarURL}
            size={40}
            fallbackText={post.authorUsername}
          />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{post.authorUsername}</Text>
              {post.authorVerified && (
                <VerifiedBadge size={14} />
              )}
            </View>
            {post.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.location}>{post.location}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Image */}
        <Image
          source={{ uri: post.mediaURLs[0] }}
          style={styles.postImage}
          contentFit="cover"
        />

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={isLiked ? '#E91E63' : colors.text.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (navigation as any).navigate('Comments', { postId })}
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
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
                    setPost((prev: any) => prev ? {
                      ...prev,
                      stats: {
                        ...prev.stats,
                        sharesCount: (prev.stats?.sharesCount || 0) + count,
                      },
                    } : prev);
                  }
                });
              }}
            >
              <Ionicons name="paper-plane-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleExternalShare}>
              <Ionicons name="share-social-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        {likesCount > 0 && (
          <Text style={styles.likes}>
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </Text>
        )}

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{post.authorUsername}</Text>
              {' '}
              {post.caption}
            </Text>
          </View>
        )}

        {/* Time */}
        <Text style={styles.time}>{formatTime(post.createdAt)}</Text>

        {/* Comments Section */}
        {post.stats?.commentsCount > 0 && (
          <TouchableOpacity
            style={styles.viewComments}
            onPress={() => (navigation as any).navigate('Comments', { postId })}
          >
            <Text style={styles.viewCommentsText}>
              View all {post.stats.commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  location: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: colors.background.tertiary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: spacing.lg,
    padding: spacing.xs,
  },
  likes: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  captionContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  captionUsername: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  viewComments: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  viewCommentsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
