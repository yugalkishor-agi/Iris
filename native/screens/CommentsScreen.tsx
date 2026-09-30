import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useComments } from '../hooks/usePost';
import { doc as firestoreDoc, getDoc, addDoc, collection as firestoreCollection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScreenSkeleton, InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { FlashList } from '@shopify/flash-list';

type CommentsScreenRouteProp = RouteProp<{ Comments: { postId: string; fromGlimpses?: boolean; postType?: 'glimpse' | 'post'; targetCommentId?: string; highlightCommentId?: string; parentCommentId?: string } }, 'Comments'>;

export default function CommentsScreen() {
  const route = useRoute<CommentsScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const postId = route.params?.postId;
  const isFromGlimpses = (route.params?.fromGlimpses ?? (route.params?.postType === 'glimpse')) || false;
  const targetCommentId = route.params?.targetCommentId || route.params?.highlightCommentId || null;
  const targetParentCommentId = route.params?.parentCommentId || null;
  
  const { comments, loading, addComment, likeComment, unlikeComment, deleteComment } = useComments(
    postId,
    isFromGlimpses ? 'glimpses' : 'posts'
  );
  
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ username: string; commentId: string } | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flatListRef = useRef<FlashList<any>>(null);
  const [parentAuthorId, setParentAuthorId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Load parent content to allow owner to moderate (delete) comments
  useEffect(() => {
    const loadParent = async () => {
      try {
        if (!postId) return;
        const parentRef = firestoreDoc(db, isFromGlimpses ? 'glimpses' : 'posts', postId);
        const snap = await getDoc(parentRef);
        if (snap.exists()) {
          const data: any = snap.data();
          setParentAuthorId(data?.authorId || data?.userId || null);
        }
      } catch {}
    };
    loadParent();
  }, [postId, isFromGlimpses]);

  // Sync initially liked comments to render red heart immediately
  useEffect(() => {
    const preliked = comments.filter((c: any) => c.isLiked).map((c: any) => c.commentId);
    setLikedComments(new Set(preliked));
  }, [comments]);

  // Sort comments
  const topLevelComments = comments
    .filter(c => !c.parentCommentId)
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    });

  const getRepliesForComment = (commentId: string) => {
    return comments.filter(c => c.parentCommentId === commentId);
  };

  const handleScrollToIndexFailed = useCallback(({ index, averageItemLength }: any) => {
    flatListRef.current?.scrollToOffset({
      offset: Math.max(0, index * (averageItemLength || 104)),
      animated: true,
    });
  }, []);

  useEffect(() => {
    if (!targetCommentId || comments.length === 0) return;

    const targetComment = comments.find((comment: any) => comment.commentId === targetCommentId);
    if (!targetComment) return;

    const parentId = targetComment.parentCommentId || targetParentCommentId || null;
    if (parentId) {
      setExpandedComments(prev => {
        if (prev.has(parentId)) return prev;
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }

    const topLevelId = parentId || targetComment.commentId;
    const targetIndex = topLevelComments.findIndex((comment: any) => comment.commentId === topLevelId);
    if (targetIndex >= 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.22 });
      });
    }

    setHighlightedCommentId(targetComment.commentId);
    const timer = setTimeout(() => {
      setHighlightedCommentId((current) => current === targetComment.commentId ? null : current);
    }, 2600);

    return () => clearTimeout(timer);
  }, [comments, targetCommentId, targetParentCommentId, topLevelComments]);


  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReply = (username: string, commentId: string) => {
    setReplyingTo({ username, commentId });
    setText(`@${username} `);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !postId || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(text.trim(), replyingTo?.commentId);
      setText('');
      setReplyingTo(null);

      // Notify parent screen (e.g., viewer) of updated count
      try {
        const parentRef = firestoreDoc(db, isFromGlimpses ? 'glimpses' : 'posts', postId);
        const snap = await getDoc(parentRef);
        const newCount = snap.data()?.stats?.commentsCount ?? 0;
        const onCommentAdded = (route.params as any)?.onCommentAdded as ((n: number) => void) | undefined;
        onCommentAdded?.(newCount);
      } catch {}
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;

    const current = comments.find((c: any) => c.commentId === commentId);
    const isLiked = likedComments.has(commentId) || !!current?.isLiked;

    // Optimistic update
    if (isLiked) {
      setLikedComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      await unlikeComment(commentId);
    } else {
      setLikedComments(prev => new Set(prev).add(commentId));
      await likeComment(commentId);
    }
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);

              // Notify parent screen (e.g., viewer) of updated count
              try {
                if (!postId) return;
                const parentRef = firestoreDoc(db, isFromGlimpses ? 'glimpses' : 'posts', postId);
                const snap = await getDoc(parentRef);
                const newCount = snap.data()?.stats?.commentsCount ?? 0;
                const onCommentAdded = (route.params as any)?.onCommentAdded as ((n: number) => void) | undefined;
                onCommentAdded?.(newCount);
              } catch {}
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleReportComment = async (comment: any) => {
    if (!user || !postId) return;
    try {
      await addDoc(firestoreCollection(db, 'commentReports'), {
        postId,
        commentId: comment.commentId,
        commentAuthorId: comment.authorId,
        reporterId: user.userId,
        parentCommentId: comment.parentCommentId || null,
        text: comment.text || '',
        source: isFromGlimpses ? 'glimpse' : 'post',
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      Alert.alert('Reported', 'Thanks. We will review this comment.');
    } catch (error) {
      Alert.alert('Error', 'Failed to report comment');
    }
  };

  const handleCommentOptions = (comment: any) => {
    const canDelete = comment.authorId === user?.userId || (parentAuthorId != null && parentAuthorId === user?.userId);
    const buttons: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Report', style: 'destructive', onPress: () => handleReportComment(comment) },
      { text: 'Cancel', style: 'cancel' },
    ];

    if (canDelete) {
      buttons.unshift({ text: 'Delete', style: 'destructive', onPress: () => handleDelete(comment.commentId) });
    }

    Alert.alert('Comment options', 'Choose an action', buttons);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const renderComment = (comment: any, isReply: boolean = false) => {
    const isLiked = !!comment.isLiked || likedComments.has(comment.commentId) || (comment.likedBy?.includes(user?.userId || '') ?? false);
    const replies = getRepliesForComment(comment.commentId);
    const isExpanded = expandedComments.has(comment.commentId);
    const canDelete = comment.authorId === user?.userId || (parentAuthorId != null && parentAuthorId === user?.userId);

    return (
      <View key={comment.commentId} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('UserProfile', { userId: comment.authorId })}
        >
          <Avatar source={comment.authorAvatarURL} size={40} />
        </TouchableOpacity>

        <View style={[styles.commentContent, highlightedCommentId === comment.commentId && styles.commentContentHighlighted]}>
          <View style={styles.commentHeader}>
            <View style={styles.commentHeaderLeft}>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('UserProfile', { userId: comment.authorId })}
              >
                <Text style={styles.username}>{comment.authorUsername}</Text>
              </TouchableOpacity>
              <Text style={styles.timeText}>{formatTimeAgo(comment.createdAt)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleCommentOptions(comment)} style={styles.commentMoreButton}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <Text style={styles.commentText}>{comment.text}</Text>

          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => handleLike(comment.commentId)} style={styles.actionButton}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={isLiked ? '#ef4444' : '#6b7280'}
              />
              {comment.likesCount > 0 && (
                <Text style={styles.actionText}>{comment.likesCount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleReply(comment.authorUsername, comment.commentId)}
              style={styles.actionButton}
            >
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>

            {canDelete && (
              <TouchableOpacity
                onPress={() => handleDelete(comment.commentId)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {replies.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => toggleReplies(comment.commentId)}
                style={styles.viewRepliesButton}
              >
                <View style={styles.replyLine} />
                <Text style={styles.viewRepliesText}>
                  {isExpanded ? 'Hide replies' : `(${replies.length}) View replies`}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.repliesContainer}>
                  {replies.map(reply => renderComment(reply, true))}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenSkeleton variant="comments" rows={6} />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Comments List */}
      {topLevelComments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptyDescription}>Be the first to comment</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          ref={flatListRef}
          data={topLevelComments}
          renderItem={({ item }) => renderComment(item)}
          keyExtractor={(item) => item.commentId}
          contentContainerStyle={styles.listContainer as any}
        />
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <View style={styles.replyPreview}>
          <Text style={styles.replyPreviewText}>
            Replying to <Text style={styles.replyUsername}>@{replyingTo.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => { setReplyingTo(null); setText(''); }}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <Avatar source={user?.avatarURL} size={32} />
        <TextInput
          style={styles.textInput}
          placeholder="Add a comment..."
          placeholderTextColor="#9ca3af"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || isSubmitting) && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <InlineLoadingSkeleton />
          ) : (
            <Ionicons name="send" size={20} color={text.trim() ? '#3b82f6' : '#9ca3af'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111114',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 36,
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 22,
  },
  commentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyContainer: {
    marginLeft: 22,
    paddingTop: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  commentMoreButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  commentText: {
    fontSize: 14,
    color: '#e4e4e7',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  actionText: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  replyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4d4d8',
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  replyLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7dd3fc',
  },
  repliesContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e4e4e7',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#121216',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#d4d4d8',
  },
  replyUsername: {
    fontWeight: '700',
    color: '#67e8f9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0f0f12',
    gap: 12,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  commentContentHighlighted: {
    backgroundColor: '#1A2233',
    borderColor: '#4DA3FF',
    shadowColor: '#4DA3FF',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});






