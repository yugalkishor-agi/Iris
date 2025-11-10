import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useComments } from '../hooks/usePost';

type CommentsScreenRouteProp = RouteProp<{ Comments: { postId: string; fromGlimpses?: boolean } }, 'Comments'>;

export default function CommentsScreen() {
  const route = useRoute<CommentsScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const postId = route.params?.postId;
  const isFromGlimpses = route.params?.fromGlimpses || false;
  
  const { comments, loading, addComment, likeComment, unlikeComment, deleteComment } = useComments(
    postId,
    isFromGlimpses ? 'glimpses' : 'posts'
  );
  
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ username: string; commentId: string } | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;

    const isLiked = likedComments.has(commentId);

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
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
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
    const isLiked = likedComments.has(comment.commentId) || comment.likedBy?.includes(user?.userId || '');
    const replies = getRepliesForComment(comment.commentId);
    const isExpanded = expandedComments.has(comment.commentId);
    const isMyComment = comment.authorId === user?.userId;

    return (
      <View key={comment.commentId} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile' as never, { userId: comment.authorId } as never)}
        >
          <Image
            source={{ uri: comment.authorAvatarURL || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile' as never, { userId: comment.authorId } as never)}
            >
              <Text style={styles.username}>{comment.authorUsername}</Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatTimeAgo(comment.createdAt)}</Text>
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

            {isMyComment && (
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
                  {isExpanded ? 'Hide' : 'View'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
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
          <Ionicons name="close" size={28} color="#000" />
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
        <FlatList
          ref={flatListRef}
          data={topLevelComments}
          renderItem={({ item }) => renderComment(item)}
          keyExtractor={(item) => item.commentId}
          contentContainerStyle={styles.listContainer}
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
        <Image
          source={{ uri: user?.avatarURL || 'https://via.placeholder.com/40' }}
          style={styles.inputAvatar}
        />
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
            <ActivityIndicator size="small" color="#3b82f6" />
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 36,
  },
  listContainer: {
    paddingVertical: 12,
  },
  commentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyContainer: {
    marginLeft: 40,
    paddingTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#6b7280',
  },
  replyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
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
    backgroundColor: '#d1d5db',
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3b82f6',
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
    color: '#374151',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#6b7280',
  },
  replyUsername: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    color: '#000',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
