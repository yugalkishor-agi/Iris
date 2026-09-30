import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Image } from 'expo-image';

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorAvatarURL?: string;
  authorVerified?: boolean;
  text: string;
  parentCommentId?: string;
  depth: number;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isPinned: boolean;
  likedByCreator: boolean;
  createdAt: Date;
  replies?: Comment[];
  isCollapsed?: boolean;
}

interface ThreadedCommentProps {
  comment: Comment;
  currentUserId: string;
  postAuthorId: string;
  onReply: (commentId: string, parentUsername: string) => void;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onPin: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onToggleCollapse: (commentId: string) => void;
  maxDepth?: number;
}

export default function ThreadedComment({
  comment,
  currentUserId,
  postAuthorId,
  onReply,
  onLike,
  onUnlike,
  onDelete,
  onPin,
  onReport,
  onToggleCollapse,
  maxDepth = 3,
}: ThreadedCommentProps) {
  const [showActions, setShowActions] = useState(false);

  const isOwnComment = comment.authorId === currentUserId;
  const isPostAuthor = comment.authorId === postAuthorId;
  const canReply = comment.depth < maxDepth;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const handleLongPress = () => {
    setShowActions(!showActions);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(comment.commentId),
        },
      ]
    );
  };

  const handlePin = () => {
    Alert.alert(
      comment.isPinned ? 'Unpin Comment' : 'Pin Comment',
      comment.isPinned 
        ? 'Remove this comment from the top?'
        : 'Pin this comment to the top?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: comment.isPinned ? 'Unpin' : 'Pin',
          onPress: () => onPin(comment.commentId),
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => onReport(comment.commentId) },
        { text: 'Inappropriate', onPress: () => onReport(comment.commentId) },
        { text: 'Harassment', onPress: () => onReport(comment.commentId) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Thread Line */}
      {comment.depth > 0 && (
        <View style={styles.threadLine} />
      )}

      <View style={[
        styles.commentContainer,
        { marginLeft: comment.depth * 20 },
        comment.isPinned && styles.pinnedComment,
      ]}>
        {/* Pinned Badge */}
        {comment.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={12} color="#007AFF" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}

        <View style={styles.commentContent}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarContainer}>
            {comment.authorAvatarURL ? (
              <Image source={{ uri: comment.authorAvatarURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#999" />
              </View>
            )}
            {isPostAuthor && (
              <View style={styles.authorBadge}>
                <Ionicons name="person" size={8} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Comment Body */}
          <View style={styles.commentBody}>
            {/* Header */}
            <View style={styles.commentHeader}>
              <Text style={styles.username}>
                {comment.authorUsername}
                {comment.authorVerified && (
                  <VerifiedBadge size={14} />
                )}
              </Text>
              
              <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
              
              {comment.likedByCreator && (
                <View style={styles.creatorLike}>
                  <Ionicons name="heart" size={12} color="#FF3B30" />
                </View>
              )}
            </View>

            {/* Comment Text */}
            <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.9}>
              <Text style={styles.commentText}>{comment.text}</Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => comment.isLiked ? onUnlike(comment.commentId) : onLike(comment.commentId)}
              >
                <Ionicons
                  name={comment.isLiked ? 'heart' : 'heart-outline'}
                  size={16}
                  color={comment.isLiked ? '#FF3B30' : '#999'}
                />
                {comment.likesCount > 0 && (
                  <Text style={[styles.actionText, comment.isLiked && styles.likedText]}>
                    {comment.likesCount}
                  </Text>
                )}
              </TouchableOpacity>

              {canReply && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onReply(comment.commentId, comment.authorUsername)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#999" />
                  <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
              )}

              {comment.repliesCount > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onToggleCollapse(comment.commentId)}
                >
                  <Ionicons
                    name={comment.isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color="#999"
                  />
                  <Text style={styles.actionText}>
                    {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Extended Actions */}
            {showActions && (
              <View style={styles.extendedActions}>
                {isOwnComment && (
                  <TouchableOpacity style={styles.extendedAction} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <Text style={[styles.extendedActionText, { color: '#FF3B30' }]}>Delete</Text>
                  </TouchableOpacity>
                )}

                {currentUserId === postAuthorId && !isOwnComment && (
                  <TouchableOpacity style={styles.extendedAction} onPress={handlePin}>
                    <Ionicons
                      name={comment.isPinned ? 'pin-outline' : 'pin'}
                      size={16}
                      color="#007AFF"
                    />
                    <Text style={[styles.extendedActionText, { color: '#007AFF' }]}>
                      {comment.isPinned ? 'Unpin' : 'Pin'}
                    </Text>
                  </TouchableOpacity>
                )}

                {!isOwnComment && (
                  <TouchableOpacity style={styles.extendedAction} onPress={handleReport}>
                    <Ionicons name="flag-outline" size={16} color="#FF9500" />
                    <Text style={[styles.extendedActionText, { color: '#FF9500' }]}>Report</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.extendedAction}
                  onPress={() => setShowActions(false)}
                >
                  <Ionicons name="close" size={16} color="#999" />
                  <Text style={styles.extendedActionText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && !comment.isCollapsed && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <ThreadedComment
                key={reply.commentId}
                comment={reply}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                onReply={onReply}
                onLike={onLike}
                onUnlike={onUnlike}
                onDelete={onDelete}
                onPin={onPin}
                onReport={onReport}
                onToggleCollapse={onToggleCollapse}
                maxDepth={maxDepth}
              />
            ))}
          </View>
        )}

        {/* Load More Replies */}
        {comment.repliesCount > (comment.replies?.length || 0) && !comment.isCollapsed && (
          <TouchableOpacity style={styles.loadMoreReplies}>
            <Text style={styles.loadMoreText}>
              Load {comment.repliesCount - (comment.replies?.length || 0)} more replies
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  threadLine: {
    position: 'absolute',
    left: 30,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E5EA',
  },
  commentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pinnedComment: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  pinnedText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  commentContent: {
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999999',
  },
  creatorLike: {
    marginLeft: 'auto',
  },
  commentText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
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
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  likedText: {
    color: '#FF3B30',
  },
  extendedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 16,
  },
  extendedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  extendedActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
  loadMoreReplies: {
    marginTop: 8,
    marginLeft: 44,
  },
  loadMoreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
