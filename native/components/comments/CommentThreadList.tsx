import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThreadedComment, { Comment } from './ThreadedComment';
import { commentService } from '../../services/comment.service';
import { FlashList } from '@shopify/flash-list';

interface CommentThreadListProps {
  postId: string;
  postAuthorId: string;
  currentUserId: string;
  onClose?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'top' | 'pinned';

export default function CommentThreadList({
  postId,
  postAuthorId,
  currentUserId,
  onClose,
}: CommentThreadListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('pinned');
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, [postId, sortBy]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentService.getThreadedComments(postId, sortBy);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData = {
        postId,
        authorId: currentUserId,
        text: newComment.trim(),
        parentCommentId: replyingTo?.commentId,
      };

      await commentService.addComment(commentData);
      setNewComment('');
      setReplyingTo(null);
      loadComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const handleReply = useCallback((commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    setNewComment(`@${username} `);
  }, []);

  const handleLike = useCallback(async (commentId: string) => {
    try {
      await commentService.likeComment(commentId, currentUserId);
      // Update local state optimistically
      setComments(prev => updateCommentInTree(prev, commentId, (comment) => ({
        ...comment,
        isLiked: true,
        likesCount: comment.likesCount + 1,
      })));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }, [currentUserId]);

  const handleUnlike = useCallback(async (commentId: string) => {
    try {
      await commentService.unlikeComment(commentId, currentUserId);
      // Update local state optimistically
      setComments(prev => updateCommentInTree(prev, commentId, (comment) => ({
        ...comment,
        isLiked: false,
        likesCount: Math.max(0, comment.likesCount - 1),
      })));
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  }, [currentUserId]);

  const handleDelete = useCallback(async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId, currentUserId);
      loadComments(); // Refresh comments
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    }
  }, [currentUserId]);

  const handlePin = useCallback(async (commentId: string) => {
    try {
      await commentService.togglePinComment(commentId, postAuthorId);
      loadComments(); // Refresh comments
    } catch (error) {
      console.error('Error pinning comment:', error);
      Alert.alert('Error', 'Failed to pin comment. Please try again.');
    }
  }, [postAuthorId]);

  const handleReport = useCallback(async (commentId: string) => {
    try {
      await commentService.reportComment(commentId, currentUserId);
      Alert.alert('Reported', 'Comment has been reported. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Error reporting comment:', error);
      Alert.alert('Error', 'Failed to report comment. Please try again.');
    }
  }, [currentUserId]);

  const handleToggleCollapse = useCallback((commentId: string) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    // Update comment collapse state
    setComments(prev => updateCommentInTree(prev, commentId, (comment) => ({
      ...comment,
      isCollapsed: !comment.isCollapsed,
    })));
  }, []);

  // Helper function to update comment in nested tree
  const updateCommentInTree = (
    comments: Comment[],
    commentId: string,
    updateFn: (comment: Comment) => Comment
  ): Comment[] => {
    return comments.map(comment => {
      if (comment.commentId === commentId) {
        return updateFn(comment);
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updateFn),
        };
      }
      return comment;
    });
  };

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <View style={styles.sortButtons}>
        {[
          { key: 'pinned', label: 'Pinned' },
          { key: 'top', label: 'Top' },
          { key: 'newest', label: 'Newest' },
          { key: 'oldest', label: 'Oldest' },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              sortBy === option.key && styles.activeSortButton,
            ]}
            onPress={() => setSortBy(option.key as SortOption)}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === option.key && styles.activeSortButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <ThreadedComment
      comment={item}
      currentUserId={currentUserId}
      postAuthorId={postAuthorId}
      onReply={handleReply}
      onLike={handleLike}
      onUnlike={handleUnlike}
      onDelete={handleDelete}
      onPin={handlePin}
      onReport={handleReport}
      onToggleCollapse={handleToggleCollapse}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>No comments yet</Text>
      <Text style={styles.emptyStateSubtext}>Be the first to comment!</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comments</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      {renderSortOptions()}

      {/* Comments List */}
      <FlashList estimatedItemSize={100}
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.commentId}
        style={styles.commentsList}
        contentContainerStyle={(comments.length === 0 ? styles.emptyContainer : undefined) as any}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadComments}
      />

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Replying to @{replyingTo.username}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
            >
              <Ionicons name="close" size={16} color="#999999" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={2000}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newComment.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newComment.trim() ? '#007AFF' : '#CCCCCC'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
  },
  activeSortButton: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  commentsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
