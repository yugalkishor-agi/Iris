import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { onSnapshot, collection, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FlashList } from '@shopify/flash-list';

interface Comment {
  commentId: string;
  text: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL?: string;
  createdAt: any;
  likesCount?: number;
  isLiked?: boolean;
  replies?: Comment[];
}

export default function CommentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, onCommentAdded } = route.params as any;
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const flatListRef = useRef<FlashList<any>>(null);

  useEffect(() => {
    if (!postId) return;

    setLoading(true);

    // Real-time listener for comments
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        commentId: doc.id,
        ...doc.data()
      })) as Comment[];

      // Check like status for each comment
      if (user) {
        const commentsWithLikeStatus = await Promise.all(
          commentsData.map(async (comment) => {
            try {
              const likeRef = collection(db, 'posts', postId, 'comments', comment.commentId, 'likes');
              const likeSnapshot = await getDocs(query(likeRef, where('userId', '==', user.userId)));
              return {
                ...comment,
                isLiked: !likeSnapshot.empty
              };
            } catch (error) {
              return { ...comment, isLiked: false };
            }
          })
        );
        setComments(commentsWithLikeStatus);
      
      // Call onCommentAdded callback with updated count
      if (onCommentAdded && typeof onCommentAdded === 'function') {
        onCommentAdded(commentsWithLikeStatus.length);
      }
      } else {
        setComments(commentsData);
        
        // Call onCommentAdded callback with updated count
        if (onCommentAdded && typeof onCommentAdded === 'function') {
          onCommentAdded(commentsData.length);
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Comments listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSendComment = async () => {
    if (!commentText.trim() || !user || sending) return;

    const textToSend = commentText.trim();
    setCommentText('');
    setSending(true);

    try {
      await postService.addComment(
        postId,
        user.userId,
        user.username,
        user.avatarURL || '',
        textToSend,
        replyingTo?.commentId
      );

      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send comment:', error);
      setCommentText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      // Toggle like/unlike
      const comment = comments.find(c => c.commentId === commentId);
      if (comment?.isLiked) {
        await postService.unlikeComment(postId, commentId, user.userId);
      } else {
        await postService.likeComment(postId, commentId, user.userId);
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      await postService.deleteComment(postId, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.authorUsername} `);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <TouchableOpacity
        onPress={() =>
          (navigation as any).navigate('Profile' as never, { username: item.authorUsername } as never)
        }
      >
        <Avatar
          source={item.authorAvatarURL}
          size={36}
          fallbackText={item.authorUsername}
        />
      </TouchableOpacity>

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.authorUsername}</Text>
          <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
        </View>

        <Text style={styles.commentText}>{item.text}</Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikeComment(item.commentId)}
          >
            <Text style={styles.actionText}>
              {item.likesCount ? `${item.likesCount} likes` : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReply(item)}
          >
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>

          {/* Delete button for own comments */}
          {item.authorId === user?.userId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteComment(item.commentId)}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Replies */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => (
              <View key={reply.commentId} style={styles.replyItem}>
                <Avatar
                  source={reply.authorAvatarURL}
                  size={28}
                  fallbackText={reply.authorUsername}
                />
                <View style={styles.replyContent}>
                  <Text style={styles.replyText}>
                    <Text style={styles.replyUsername}>{reply.authorUsername}</Text>
                    {' '}
                    {reply.text}
                  </Text>
                  <Text style={styles.replyTimestamp}>{formatTime(reply.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => handleLikeComment(item.commentId)}
      >
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={16}
          color={item.isLiked ? colors.accent.error : colors.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptyText}>Be the first to comment</Text>
    </View>
  );

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Comments</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        <FlashList estimatedItemSize={100}
          ref={flatListRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.commentId}
          contentContainerStyle={(
            comments.length === 0 ? styles.emptyContent : styles.list
          ) as any}
          ListEmptyComponent={renderEmpty}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText}>
                Replying to @{replyingTo.authorUsername}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Avatar
              source={user?.avatarURL}
              size={32}
              fallbackText={user?.username}
            />

            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={colors.text.secondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />

            {commentText.trim() && (
              <TouchableOpacity
                onPress={handleSendComment}
                disabled={sending}
              >
                {sending ? (
                  <InlineLoadingSkeleton />
                ) : (
                  <Text style={styles.postButton}>Post</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  commentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  deleteText: {
    color: colors.accent.error,
  },
  likeButton: {
    padding: spacing.xs,
  },
  repliesContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  replyItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  replyContent: {
    flex: 1,
  },
  replyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  replyUsername: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  replyTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  replyingToText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    maxHeight: 80,
  },
  postButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.accent.primary,
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

