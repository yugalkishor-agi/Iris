import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Modal, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/theme';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');

type TabType = 'all' | 'mentions' | 'follows';

interface NotificationItem {
  notificationId: string;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention' | 'story_view' | 'story_reply' | 'story_like' | 'collaboration_request';
  actorId: string;
  actorUsername: string;
  actorAvatarURL: string;
  actorVerified?: boolean;
  message: string;
  postId?: string;
  postImageURL?: string;
  storyId?: string;
  glimpseId?: string;
  isRead: boolean;
  createdAt: any;
  refPreview?: string;
  refMediaURL?: string;
}

export default function NotificationsEnhanced() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  
  // Helper: derive a user-friendly message from notification type
  const getMessage = (type: string) => {
    switch (type) {
      case 'like':
      case 'story_like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'follow_request':
        return 'requested to follow you';
      case 'mention':
        return 'mentioned you';
      case 'story_view':
        return 'viewed your story';
      case 'story_reply':
        return 'replied to your story';
      default:
        return 'sent you an update';
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const notifs: any[] = await notificationService.getUserNotifications(user.userId);
      const items: NotificationItem[] = (notifs || []).map((n: any) => ({
        notificationId: n.notificationId,
        type: n.type,
        actorId: n.actorId,
        actorUsername: n.actorUsername,
        actorAvatarURL: n.actorAvatarURL,
        actorVerified: n.actorVerified,
        message: n.refPreview || getMessage(n.type),
        postId: n.refType === 'post' ? n.refId : undefined,
        postImageURL: n.refType === 'post' ? n.refMediaURL : undefined,
        storyId: n.refType === 'story' ? n.refId : undefined,
        isRead: !!n.isRead,
        createdAt: n.createdAt?.toDate?.() || new Date(),
        refPreview: n.refPreview,
        refMediaURL: n.refMediaURL,
      }));
      setNotifications(items);
      setUnreadCount(items.filter(i => !i.isRead).length);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try { await notificationService.markAsRead(notificationId); } catch {}
    setNotifications(prev => 
      prev.map(n => 
        n.notificationId === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try { await notificationService.markAllAsRead(user.userId); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    Alert.alert('Success', 'All notifications marked as read');
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'story_like':
        if (notification.postId) {
          (navigation as any).navigate('PostView', { postId: notification.postId });
        }
        break;
      case 'follow':
      case 'follow_request':
        (navigation as any).navigate('UserProfile', { userId: notification.actorId });
        break;
      case 'mention':
        if (notification.postId) {
          (navigation as any).navigate('PostView', { postId: notification.postId });
        } else {
          (navigation as any).navigate('UserProfile', { userId: notification.actorId });
        }
        break;
      case 'story_view':
      case 'story_reply':
        (navigation as any).navigate('StoryViewerEnhanced', { userId: notification.actorId });
        break;
      case 'collaboration_request':
        if (notification.glimpseId) {
          (navigation as any).navigate('GlimpseViewer', { glimpseId: notification.glimpseId });
        } else if (notification.postId) {
          (navigation as any).navigate('PostView', { postId: notification.postId });
        }
        break;
    }
  };

  const handleFollowUser = async (targetUserId: string) => {
    if (!user) return;
    try {
      await userService.followUser(user.userId, targetUserId);
      setFollowingUsers(prev => new Set(prev).add(targetUserId));
      Alert.alert('Success', 'User followed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const handleAcceptFollowRequest = async (requesterId: string, notificationId: string) => {
    if (!user) return;
    try {
      await userService.acceptFollowRequest(user.userId, requesterId);
      await markAsRead(notificationId);
      Alert.alert('Success', 'Follow request accepted');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept follow request');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#FF3B30' };
      case 'comment':
        return { name: 'chatbubble', color: '#007AFF' };
      case 'follow':
      case 'follow_request':
        return { name: 'person-add', color: '#34C759' };
      case 'mention':
        return { name: 'at', color: '#AF52DE' };
      case 'story_view':
        return { name: 'eye', color: '#FF9500' };
      case 'story_reply':
        return { name: 'chatbubble', color: '#FF9500' };
      case 'collaboration_request':
        return { name: 'people', color: '#00C7BE' };
      default:
        return { name: 'notifications', color: '#8E8E93' };
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mentions') return notification.type === 'mention';
    if (activeTab === 'follows') return notification.type === 'follow' || notification.type === 'follow_request';
    return true;
  });

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const icon = getNotificationIcon(item.type);
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            source={item.actorAvatarURL}
            size={44}
          />
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name as any} size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <View style={styles.notificationTextRow}>
              <View style={styles.identityRow}>
                <Text style={styles.username}>{item.actorUsername}</Text>
                {item.actorVerified ? (
                  <VerifiedBadge size={14} style={styles.inlineVerifiedBadge} />
                ) : null}
              </View>
              <Text style={styles.message}> {item.message}</Text>
            </View>
            
            {item.refPreview && (
              <Text style={styles.preview} numberOfLines={1}>
                {item.refPreview}
              </Text>
            )}
            
            <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
          </View>

          {/* Action Buttons */}
          {item.type === 'follow' && !followingUsers.has(item.actorId) && (
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => handleFollowUser(item.actorId)}
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          )}

          {item.type === 'follow_request' && (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptFollowRequest(item.actorId, item.notificationId)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton}>
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Media Preview */}
          {item.postImageURL && (
            <Image source={{ uri: item.postImageURL }} style={styles.mediaPreview} />
          )}
        </View>

        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptyMessage}>
        {activeTab === 'all' 
          ? "You'll see updates about your activity here"
          : activeTab === 'mentions'
          ? "No mentions yet"
          : "No new followers"
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.accent.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'mentions', 'follows'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'All' : tab === 'mentions' ? 'Mentions' : 'Follows'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.notificationId}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={(filteredNotifications.length === 0 ? styles.emptyContainer : undefined) as any}
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  markAllRead: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.accent.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  unreadItem: {
    backgroundColor: colors.background.secondary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  notificationTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexShrink: 1,
  },
  username: {
    fontWeight: '600',
    flexShrink: 1,
  },
  inlineVerifiedBadge: {
    marginLeft: 4,
    marginRight: 2,
  },
  message: {
    color: colors.text.muted,
  },
  preview: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  declineButtonText: {
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  mediaPreview: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
    marginLeft: 8,
    marginTop: 6,
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
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
})
;




