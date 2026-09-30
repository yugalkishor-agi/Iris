import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/common/Header';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Comment {
  commentId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarURL?: string;
  verified?: boolean;
  text: string;
  timestamp: any;
  likesCount: number;
  isLiked: boolean;
  replies?: Comment[];
  replyToId?: string;
}

export default function CommentsScreenNew() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { postId } = route.params as { postId: string };
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Mock data for now
  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      // Mock comments data
      const mockComments: Comment[] = [
        {
          commentId: '1',
          userId: 'user1',
          username: 'yugalkishor',
          displayName: 'Yugal Kishor',
          avatarURL: 'https://via.placeholder.com/40',
          verified: true,
          text: 'Amazing photo! 🔥',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          likesCount: 12,
          isLiked: false,
        },
        {
          commentId: '2',
          userId: 'user2',
          username: 'indiai',
          displayName: 'India I',
          avatarURL: 'https://via.placeholder.com/40',
          text: 'Love this! Where was this taken?',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          likesCount: 5,
          isLiked: true,
        },
        {
          commentId: '3',
          userId: 'user3',
          username: 'comrade',
          displayName: 'Comrade',
          avatarURL: 'https://via.placeholder.com/40',
          text: 'Incredible shot! The lighting is perfect 📸',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          likesCount: 8,
          isLiked: false,
        },
      ];
      setComments(mockComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.commentId === commentId 
        ? { 
            ...comment, 
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1
          }
        : comment
    ));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      commentId: Date.now().toString(),
      userId: user?.userId || 'current_user',
      username: user?.username || 'you',
      displayName: user?.displayName || 'You',
      avatarURL: user?.avatarURL,
      text: newComment.trim(),
      timestamp: new Date(),
      likesCount: 0,
      isLiked: false,
      replyToId: replyingTo || undefined,
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setReplyingTo(null);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.avatarURL || 'https://via.placeholder.com/40' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <View style={styles.commentUserInfo}>
            <Text style={styles.commentUsername}>
              {item.displayName}
            </Text>
            {item.verified && (
              <VerifiedBadge size={12} />
            )}
            <Text style={styles.commentTime}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleLikeComment(item.commentId)}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={item.isLiked ? '#E91E63' : colors.text.muted}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.commentText}>
          {item.text}
        </Text>
        
        <View style={styles.commentActions}>
          {item.likesCount > 0 && (
            <Text style={styles.commentLikes}>
              {item.likesCount} {item.likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
          <TouchableOpacity onPress={() => setReplyingTo(item.commentId)}>
            <Text style={styles.replyButton}>
              Reply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Comments" />
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlashList estimatedItemSize={100}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.commentId}
          contentContainerStyle={styles.commentsList as any}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Comment Input */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Replying to comment
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <Image
              source={{ uri: user?.avatarURL || 'https://via.placeholder.com/32' }}
              style={styles.inputAvatar}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.text.muted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={newComment.trim() ? colors.text.link : colors.text.muted}
              />
            </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  commentsList: {
    paddingVertical: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentUsername: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  commentTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  commentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  commentLikes: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  replyButton: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.semibold as any,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.primary,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  replyingToText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    padding: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
