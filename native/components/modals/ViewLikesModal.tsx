import { ScreenSkeleton, InlineLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Avatar } from '../ui/Avatar';
import { userService } from '../../services/user.service';
import { postService } from '../../services/post.service';
import { useAuth } from '../../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

interface LikeUser {
  userId: string;
  username: string;
  displayName: string;
  avatarURL: string;
  verified?: boolean;
}

interface ViewLikesModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  onUserPress?: (userId: string) => void;
}

export function ViewLikesModal({
  visible,
  onClose,
  postId,
  onUserPress,
}: ViewLikesModalProps) {
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [followingLoading, setFollowingLoading] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (visible) {
      loadLikes();
    }
  }, [visible, postId]);

  const loadLikes = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockLikes: LikeUser[] = [
        {
          userId: 'user1',
          username: 'john_doe',
          displayName: 'John Doe',
          avatarURL: 'https://picsum.photos/100/100?random=1',
          verified: true,
        },
        {
          userId: 'user2',
          username: 'jane_smith',
          displayName: 'Jane Smith',
          avatarURL: 'https://picsum.photos/100/100?random=2',
        },
        {
          userId: 'user3',
          username: 'mike_wilson',
          displayName: 'Mike Wilson',
          avatarURL: 'https://picsum.photos/100/100?random=3',
          verified: true,
        },
        {
          userId: 'user4',
          username: 'sarah_jones',
          displayName: 'Sarah Jones',
          avatarURL: 'https://picsum.photos/100/100?random=4',
        },
        {
          userId: 'user5',
          username: 'alex_brown',
          displayName: 'Alex Brown',
          avatarURL: 'https://picsum.photos/100/100?random=5',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLikes(mockLikes);

      // Check following states
      if (currentUser) {
        const states: { [key: string]: boolean } = {};
        // Mock following states
        mockLikes.forEach((user) => {
          states[user.userId] = Math.random() > 0.5; // Random following state
        });
        setFollowingStates(states);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;

    setFollowingLoading(prev => ({ ...prev, [userId]: true }));

    try {
      if (followingStates[userId]) {
        await userService.unfollowUser(currentUser.userId, userId);
      } else {
        await userService.followUser(currentUser.userId, userId);
      }

      setFollowingStates(prev => ({
        ...prev,
        [userId]: !prev[userId],
      }));

      Alert.alert(
        'Success',
        followingStates[userId] ? 'Unfollowed user' : 'Following user'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const renderLikeUser = ({ item }: { item: LikeUser }) => {
    const isFollowing = followingStates[item.userId];
    const isLoading = followingLoading[item.userId];
    const isCurrentUser = currentUser?.userId === item.userId;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
          onClose();
          if (onUserPress) {
            onUserPress(item.userId);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          <Avatar
            source={item.avatarURL || undefined}
            size={44}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.username}>{item.username}</Text>
              {item.verified && (
                <VerifiedBadge size={16} />
              )}
            </View>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.displayName}
            </Text>
          </View>
        </View>

        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleFollow(item.userId);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No likes yet</Text>
      <Text style={styles.emptyMessage}>Be the first to like this post</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Likes</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ScreenSkeleton variant="list" rows={6} />
            <Text style={styles.loadingText}>Loading likes...</Text>
          </View>
        ) : (
          <FlashList estimatedItemSize={100}
            data={likes}
            renderItem={renderLikeUser}
            keyExtractor={(item) => item.userId}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={(likes.length === 0 ? styles.emptyContainer : undefined) as any}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  displayName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});


