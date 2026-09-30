import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notification.service';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Notification {
  notificationId: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'story_view' | 'story_like' | 'dm' | 'message';
  actorId: string;
  actorUsername: string;
  actorAvatarURL?: string;
  refType?: 'post' | 'glimpse' | 'story' | 'comment' | 'message';
  refId?: string;
  refPreview?: string;
  refMediaURL?: string;
  isRead: boolean;
  createdAt: any;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'follows'>('all');

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        notificationId: doc.id,
        ...doc.data()
      })) as Notification[];

      setNotifications(notifs);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Firestore listener will automatically refresh
  };

  const handleNotificationPress = async (notif: Notification) => {
    // Mark as read
    if (!notif.isRead && user) {
      await notificationService.markAsRead(notif.notificationId);
    }

    // Navigate based on type
    switch (notif.type) {
      case 'like':
      case 'comment':
      case 'mention':
        if (notif.refType === 'post' && notif.refId) {
          (navigation as any).navigate('PostView', { postId: notif.refId });
        } else if (notif.refType === 'glimpse' && notif.refId) {
          (navigation as any).navigate('GlimpseViewer', { glimpseId: notif.refId });
        } else if (notif.refType === 'story' && notif.refId) {
          // Open the owner's story viewer (owner is the current user for likes)
          (navigation as any).navigate('StoryViewerEnhanced', { userId: user?.userId });
        }
        break;
      case 'follow':
        (navigation as any).navigate('UserProfile', { userId: notif.actorId });
        break;
      case 'story_view':
        (navigation as any).navigate('StoryViewerEnhanced', { userId: notif.actorId });
        break;
      case 'message':
      case 'dm':
        (navigation as any).navigate('Chat', { userId: notif.actorId });
        break;
      case 'story_like':
        (navigation as any).navigate('StoryViewerEnhanced', { userId: user?.userId });
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={20} color={colors.accent.error} />;
      case 'story_like':
        return <Ionicons name="heart" size={20} color={colors.accent.error} />;
      case 'comment':
        return <Ionicons name="chatbubble" size={20} color={colors.accent.primary} />;
      case 'follow':
        return <Ionicons name="person-add" size={20} color={colors.accent.primary} />;
      case 'mention':
        return <Ionicons name="at" size={20} color={colors.accent.primary} />;
      case 'story_view':
        return <Ionicons name="eye" size={20} color={colors.text.secondary} />;
      case 'message':
        return <Ionicons name="mail" size={20} color={colors.accent.primary} />;
      default:
        return <Ionicons name="notifications" size={20} color={colors.text.secondary} />;
    }
  };

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'like':
        if (notif.refType === 'glimpse') return 'liked your glimpse';
        if (notif.refType === 'story') return 'liked your story';
        return 'liked your post';
      case 'comment':
        return notif.refPreview ? `commented: ${notif.refPreview}` : 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'mention':
        if (notif.refType === 'post') return 'mentioned you in a post';
        if (notif.refType === 'story') return 'mentioned you in a story';
        return 'mentioned you';
      case 'story_view':
        return 'viewed your story';
      case 'story_like':
        return 'liked your story';
      case 'message':
        return 'sent you a message';
      default:
        return notif.refPreview || '';
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === 'follow');

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          source={item.actorAvatarURL}
          size={44}
          fallbackText={item.actorUsername}
        />
        <View style={styles.iconBadge}>
          {getNotificationIcon(item.type)}
        </View>
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationText} numberOfLines={2}>
          <Text style={styles.username}>{item.actorUsername}</Text>
          {' '}
          <Text style={styles.action}>{getNotificationText(item)}</Text>
        </Text>
        <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
      </View>

      {!!item.refMediaURL && (
        <Image
          source={{ uri: item.refMediaURL }}
          style={styles.postThumbnail}
        />
      )}

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyText}>
        When someone likes or comments on your posts, you'll see it here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
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
          style={[styles.tab, activeTab === 'follows' && styles.activeTab]}
          onPress={() => setActiveTab('follows')}
        >
          <Text style={[styles.tabText, activeTab === 'follows' && styles.activeTabText]}>
            Follows
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlashList estimatedItemSize={100}
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.notificationId}
        contentContainerStyle={(
          filteredNotifications.length === 0 ? styles.emptyContent : styles.list
        ) as any}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.text.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  unreadNotification: {
    backgroundColor: `${colors.accent.primary}10`,
  },
  avatarContainer: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  username: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  action: {
    color: colors.text.secondary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
