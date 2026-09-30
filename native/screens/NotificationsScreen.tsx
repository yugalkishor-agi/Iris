import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { Avatar } from '../components/ui/Avatar';
import type { NotificationType } from '../types/database';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'like':
      return { name: 'heart' as const, color: '#ef4444' };
    case 'comment':
      return { name: 'chatbubble' as const, color: '#3b82f6' };
    case 'follow':
      return { name: 'person-add' as const, color: '#10b981' };
    case 'follow_request':
      return { name: 'person-add' as const, color: '#f59e0b' };
    case 'mention':
      return { name: 'at' as const, color: '#8b5cf6' };
    case 'dm':
      return { name: 'mail' as const, color: '#3b82f6' };
    case 'story_view':
      return { name: 'eye' as const, color: '#3b82f6' };
    case 'story_reply':
      return { name: 'chatbubble' as const, color: '#3b82f6' };
    case 'story_like':
      return { name: 'heart' as const, color: '#ef4444' };
    case 'collaboration_request':
      return { name: 'people' as const, color: '#06b6d4' };
    default:
      return { name: 'notifications' as const, color: '#6b7280' };
  }
}

const NotificationsScreen = memo(function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { notifications, loading, refreshing, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

  // Load following status for all actors
  useEffect(() => {
    const loadFollowingStatus = async () => {
      if (!user) return;
      
      const actorIds = [...new Set(notifications.map(n => n.actorId).filter(Boolean))];
      const following = await userService.getFollowing(user.userId);
      
      const status: { [key: string]: boolean } = {};
      actorIds.forEach(actorId => {
        status[actorId] = following.includes(actorId);
      });
      
      setFollowingStatus(status);
    };
    
    loadFollowingStatus();
  }, [user, notifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await userService.followUser(user!.userId, userId);
      setFollowingStatus(prev => ({ ...prev, [userId]: true }));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }

    // Navigate based on notification type
    if (notification.glimpseId) {
      (navigation as any).navigate('GlimpseViewer', { glimpseId: notification.glimpseId });
    } else if (notification.postId) {
      (navigation as any).navigate('PostView', { postId: notification.postId });
    } else if (notification.actorId && ['follow', 'follow_request'].includes(notification.type)) {
      (navigation as any).navigate('UserProfile', { userId: notification.actorId });
    } else if (notification.type === 'dm') {
      (navigation as any).navigate('Chat', { userId: notification.actorId });
    }
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const renderNotificationItem = ({ item }: { item: any }) => {
    const iconConfig = getNotificationIcon(item.type);
    const isFollowing = followingStatus[item.actorId];
    const showFollowButton = item.type === 'follow' && !isFollowing;

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar source={item.actorAvatarURL} size={50} />
          <View style={[styles.iconBadge, { backgroundColor: iconConfig.color }]}>
            <Ionicons name={iconConfig.name} size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.boldText}>{item.actorUsername || 'Someone'}</Text>
            {' '}
            {item.message || 'interacted with your content'}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {showFollowButton && (
          <TouchableOpacity
            style={styles.followButton}
            onPress={(e) => {
              e.stopPropagation();
              handleFollowUser(item.actorId);
            }}
          >
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        )}

        {item.previewImageURL && (
          <Image source={{ uri: item.previewImageURL }} style={styles.previewImage} />
        )}

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => markAllAsRead()} style={styles.headerAction}>
          <Ionicons name="checkmark-done" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread
            {notifications.filter(n => !n.isRead).length > 0 && (
              <Text style={styles.badge}>
                {' '}• {notifications.filter(n => !n.isRead).length}
              </Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyDescription}>
            {activeTab === 'unread' 
              ? "You're all caught up!"
              : "We'll notify you when something happens"}
          </Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={styles.listContainer as any}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
});

export default NotificationsScreen;

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { paddingRight: 8, paddingVertical: 4 },
  headerAction: { paddingLeft: 8, paddingVertical: 4 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  badge: {
    fontSize: 13,
    color: '#ef4444',
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#eff6ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '600',
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    right: 16,
    top: 12,
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
    textAlign: 'center',
    marginTop: 8,
  },
});



