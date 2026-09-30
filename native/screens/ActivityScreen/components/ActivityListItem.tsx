import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Avatar } from '../../../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../../../styles/theme';
import { ActivityItem } from '../types';

interface ActivityListItemProps {
  item: ActivityItem;
  onPress: (activity: ActivityItem) => void;
}

const formatTimeAgo = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const getActivityText = (activity: ActivityItem) => {
  switch (activity.type) {
    case 'like':
      return 'liked your post';
    case 'glimpse_like':
      return 'liked your glimpse';
    case 'comment':
      return 'commented on your post';
    case 'follow':
      return 'started following you';
    case 'mention':
      return 'mentioned you in a post';
    case 'story_view':
      return 'viewed your story';
    default:
      return 'interacted with your content';
  }
};

const getActivityIcon = (activity: ActivityItem) => {
  switch (activity.type) {
    case 'like':
    case 'glimpse_like':
      return { name: 'heart' as const, color: '#ff3040' };
    case 'comment':
      return { name: 'chatbubble' as const, color: colors.accent.primary };
    case 'follow':
      return { name: 'person-add' as const, color: '#10b981' };
    case 'mention':
      return { name: 'at' as const, color: '#8b5cf6' };
    case 'story_view':
      return { name: 'eye' as const, color: colors.accent.primary };
    default:
      return { name: 'notifications' as const, color: colors.text.secondary };
  }
};

function ActivityListItemComponent({ item, onPress }: ActivityListItemProps) {
  const icon = getActivityIcon(item);

  return (
    <TouchableOpacity 
      style={[styles.activityItem, !item.isRead && styles.unreadActivity]}
      onPress={() => onPress(item)}
    >
      <View style={styles.activityLeft}>
        <Avatar source={item.user.avatarURL} size={44} />
        <View style={[styles.activityIcon, { backgroundColor: icon.color }]}>
          <Ionicons name={icon.name} size={12} color="#fff" />
        </View>
      </View>
      
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.username}>{item.user.displayName}</Text>
          <Text style={styles.actionText}> {getActivityText(item)}</Text>
        </Text>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.timestamp)}</Text>
      </View>
      
      {item.content?.mediaURL && (
        <Image source={{ uri: item.content.mediaURL }} style={styles.contentThumbnail} />
      )}
      
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export const ActivityListItem = memo(ActivityListItemComponent);

const styles = StyleSheet.create({
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
  },
  unreadActivity: {
    backgroundColor: colors.background.secondary,
  },
  activityLeft: {
    position: 'relative',
    marginRight: spacing.md,
  },
  activityIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  username: {
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  actionText: {
    color: colors.text.secondary,
  },
  timeAgo: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  contentThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
    marginLeft: spacing.sm,
  },
});
