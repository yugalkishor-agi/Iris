import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components/common/BackButton';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface NotificationItem {
  id: string;
  type: 'like_story' | 'like_post' | 'follow' | 'comment';
  user: {
    userId: string;
    username: string;
    avatarURL?: string;
    verified?: boolean;
  };
  message: string;
  timestamp: string;
  thumbnail?: string;
  actionRequired?: boolean;
}

export default function NotificationsScreenNew() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'like_story',
      user: {
        userId: 'user1',
        username: 'yugalkishor',
        avatarURL: 'https://via.placeholder.com/50',
      },
      message: 'liked your story',
      timestamp: '12d',
      thumbnail: 'https://via.placeholder.com/50',
    },
    {
      id: '2',
      type: 'like_story',
      user: {
        userId: 'user2',
        username: '@comrade',
        avatarURL: 'https://via.placeholder.com/50',
      },
      message: 'liked your story',
      timestamp: '16d',
      thumbnail: 'https://via.placeholder.com/50',
    },
    {
      id: '3',
      type: 'like_post',
      user: {
        userId: 'user3',
        username: '@comrade',
        avatarURL: 'https://via.placeholder.com/50',
      },
      message: 'liked your post',
      timestamp: '16d',
      thumbnail: 'https://via.placeholder.com/50',
    },
    {
      id: '4',
      type: 'follow',
      user: {
        userId: 'user4',
        username: 'indiai',
        avatarURL: 'https://via.placeholder.com/50',
      },
      message: 'started following you',
      timestamp: '16d',
      actionRequired: true,
    },
  ]);

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => {
        if (item.type === 'follow') {
          (navigation as any).navigate('UserProfile' as never, { userId: item.user.userId } as never);
        } else {
          // Navigate to post/story
        }
      }}
    >
      <Image
        source={{ uri: item.user.avatarURL || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.message}> {item.message}</Text>
        </Text>
        <Text style={styles.timestamp}>
          <Text>{item.timestamp}</Text>
        </Text>
      </View>
      {item.thumbnail && (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      )}
      {item.actionRequired && (
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>
            <Text>Follow Back</Text>
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>
          <Text>Notifications</Text>
        </Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            <Text>All</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mentions' && styles.activeTab]}
          onPress={() => setActiveTab('mentions')}
        >
          <Text style={[styles.tabText, activeTab === 'mentions' && styles.activeTabText]}>
            <Text>Mentions</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'follows' && styles.activeTab]}
          onPress={() => setActiveTab('follows')}
        >
          <Text style={[styles.tabText, activeTab === 'follows' && styles.activeTabText]}>
            <Text>Follows</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlashList estimatedItemSize={100}
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList as any}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={colors.text.muted} />
            <Text style={styles.emptyText}>
              <Text>No notifications yet</Text>
            </Text>
            <Text style={styles.emptySubtext}>
              <Text>When someone likes or comments on your posts, you'll see it here</Text>
            </Text>
          </View>
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
    flex: 1,
    marginLeft: spacing.md,
  },
  headerIcon: {
    padding: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
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
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  activeTabText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  notificationsList: {
    paddingBottom: spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginBottom: 2,
  },
  username: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  message: {
    color: colors.text.secondary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
  },
  followButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.text.link,
    borderRadius: borderRadius.sm,
  },
  followButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.background.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

