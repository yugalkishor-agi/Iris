import { ScreenSkeleton } from '../ui/LoadingSkeleton';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/post.service';
import { userService } from '../../services/user.service';
import { FlashList } from '@shopify/flash-list';

interface ViewLikesModalProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
}

interface LikeUser {
  userId: string;
  username: string;
  displayName: string;
  avatarURL: string;
  verified?: boolean;
  isFollowing?: boolean;
}

export function ViewLikesModal({ isVisible, onClose, postId }: ViewLikesModalProps) {
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isVisible && postId) {
      loadLikes();
    }
  }, [isVisible, postId]);

  const loadLikes = async () => {
    setLoading(true);
    try {
      // Get users who liked the post
      const likeUsers = await postService.getPostLikes(postId);
      
      // Check if current user follows these users
      if (currentUser) {
        const followingList = await userService.getFollowing(currentUser.userId);
        const states: { [key: string]: boolean } = {};
        likeUsers.forEach((user: any) => {
          states[user.userId] = followingList.includes(user.userId);
        });
        setFollowingStates(states);
      }
      
      setLikes(likeUsers as LikeUser[]);
    } catch (error: any) {
      console.error('Failed to load likes:', error);
      Alert.alert('Error', 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;

    try {
      if (followingStates[userId]) {
        await userService.unfollowUser(currentUser.userId, userId);
      } else {
        await userService.followUser(currentUser.userId, userId);
      }

      setFollowingStates((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));

      Alert.alert('Success', followingStates[userId] ? 'Unfollowed' : 'Following');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderUser = ({ item }: { item: LikeUser }) => {
    const isFollowing = followingStates[item.userId];
    const isCurrentUser = currentUser?.userId === item.userId;

    return (
      <View style={styles.userItem}>
        <Avatar source={item.avatarURL} size={44} fallbackText={item.displayName} />
        
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.username}>{item.username}</Text>
            {item.verified && (
              <VerifiedBadge size={16} />
            )}
          </View>
          <Text style={styles.displayName}>{item.displayName}</Text>
        </View>

        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={() => handleFollow(item.userId)}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Likes</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ScreenSkeleton variant="list" rows={6} />
            <Text style={styles.loadingText}>Loading likes...</Text>
          </View>
        ) : likes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No likes yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to like this post</Text>
          </View>
        ) : (
          <FlashList estimatedItemSize={100}
            data={likes}
            renderItem={renderUser}
            keyExtractor={(item) => item.userId}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersListContent as any}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  displayName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  followButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.inverse,
  },
  followingButtonText: {
    color: colors.text.primary,
  },
});

