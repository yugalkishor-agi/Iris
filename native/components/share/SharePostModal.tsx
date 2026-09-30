import { ScreenSkeleton, InlineLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user.service';
import { shareService } from '../../services/share.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface SharePostModalProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
  postData: {
    authorId: string;
    authorUsername: string;
    authorAvatarURL: string;
    mediaURL: string;
    caption?: string;
    mediaType: 'image' | 'video';
  };
  onShared?: (count: number) => void;
}

interface ShareUser {
  userId: string;
  username: string;
  displayName: string;
  avatarURL: string;
  verified?: boolean;
}

export function SharePostModal({ isVisible, onClose, postId, postData, onShared }: SharePostModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadUsers();
    }
  }, [isVisible]);

  const loadUsers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get followers and following
      const [followers, following] = await Promise.all([
        userService.getFollowers(user.userId),
        userService.getFollowing(user.userId),
      ]);
      
      // Combine and deduplicate
      const allUserIds = [...new Set([...followers, ...following])];
      
      // Get user details
      const userDetails = await Promise.all(
        allUserIds.slice(0, 50).map(async (userId) => {
          try {
            const userData = await userService.getUser(userId);
            return userData;
          } catch (error) {
            return null;
          }
        })
      );
      
      setUsers(userDetails.filter(u => u !== null) as ShareUser[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one person to share with');
      return;
    }

    if (!user) return;

    try {
      setSharing(true);
      
      // Share with each selected user
      await Promise.all(
        selectedUsers.map(userId => 
          shareService.sharePostInDM(
            postId,
            postData,
            user.userId,
            user.username,
            user.avatarURL || '',
            userId,
            message
          )
        )
      );

      Alert.alert('Success', `Post shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}`);
      onShared?.(selectedUsers.length);
      onClose();
      setSelectedUsers([]);
      setMessage('');
    } catch (error) {
      console.error('Failed to share post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    // In production, this would copy the post link to clipboard
    Alert.alert('Link Copied', 'Post link copied to clipboard!');
  };

  const handleShareToStory = () => {
    // In production, this would open story editor with post as background
    Alert.alert('Coming Soon', 'Share to story feature coming soon!');
  };

  const renderUser = ({ item }: { item: ShareUser }) => {
    const isSelected = selectedUsers.includes(item.userId);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => handleUserToggle(item.userId)}
      >
        <Avatar source={item.avatarURL} size={40} fallbackText={item.displayName} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Post</Text>
          <TouchableOpacity 
            onPress={handleShare} 
            disabled={selectedUsers.length === 0 || sharing}
            style={[styles.shareButton, (selectedUsers.length === 0 || sharing) && styles.disabledButton]}
          >
            {sharing ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text style={styles.shareButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Post Preview */}
        <View style={styles.postPreview}>
          <Image source={{ uri: postData.mediaURL }} style={styles.postImage} />
          <View style={styles.postInfo}>
            <Text style={styles.postAuthor}>@{postData.authorUsername}</Text>
            {postData.caption && (
              <Text style={styles.postCaption} numberOfLines={2}>
                {postData.caption}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleShareToStory}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="add-circle" size={24} color={colors.accent.primary} />
            </View>
            <Text style={styles.quickActionText}>Add to Story</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleCopyLink}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="link" size={24} color={colors.accent.primary} />
            </View>
            <Text style={styles.quickActionText}>Copy Link</Text>
          </TouchableOpacity>
        </View>

        {/* Message Input */}
        <View style={styles.messageSection}>
          <TextInput
            style={styles.messageInput}
            placeholder="Add a message..."
            placeholderTextColor={colors.text.secondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Selected Users Count */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
            </Text>
          </View>
        )}

        {/* Users List */}
        {loading ? (
          <ScreenSkeleton variant="list" rows={6} />
        ) : (
          <FlashList estimatedItemSize={100}
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.userId}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
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
  shareButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.text.secondary,
  },
  shareButtonText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  postPreview: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  postCaption: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  messageSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  messageInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  selectedCount: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  selectedCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.md,
  },
  selectedUserItem: {
    backgroundColor: colors.accent.primary + '20',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  userUsername: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


