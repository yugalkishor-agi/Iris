import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Avatar } from '../ui/Avatar';
import { AppNotification, NotificationGroup } from '../../hooks/notifications/notificationTypes';
import {
  formatNotificationTime,
  getActorHeadline,
  getGroupBody,
  getNotificationIcon,
  getNotificationTone,
  sanitizePreviewImageURL,
} from '../../utils/notifications/notificationUtils';
import { typography } from '../../styles/theme';

interface NotificationItemProps {
  group: NotificationGroup;
  currentUserId: string | null;
  followingUsers: Set<string>;
  onPress: (group: NotificationGroup) => void;
  onDelete: (group: NotificationGroup) => void;
  onFollow: (userId: string) => void;
  onAcceptCollaboration: (notification: AppNotification) => void;
  onDeclineCollaboration: (notification: AppNotification) => void;
}

export const NotificationItem = React.memo(function NotificationItem({
  group,
  currentUserId,
  followingUsers,
  onPress,
  onDelete,
  onFollow,
  onAcceptCollaboration,
  onDeclineCollaboration,
}: NotificationItemProps) {
  const { suffix, preview } = getGroupBody(group);
  const headline = getActorHeadline(group.actors, group.totalCount);
  const latest = group.latestNotification;

  const renderTrailing = useCallback(() => {
    if (latest.type === 'follow' && group.totalCount === 1 && latest.actorId !== currentUserId) {
      const following = followingUsers.has(latest.actorId);
      return (
        <TouchableOpacity
          style={[styles.followButton, following && styles.followingButton]}
          onPress={() => onFollow(latest.actorId)}
          activeOpacity={0.9}
        >
          <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      );
    }

    const previewURL = sanitizePreviewImageURL(latest.postImageURL);
    if (previewURL) {
      return <Image source={{ uri: previewURL }} style={styles.previewImage} contentFit="cover" />;
    }

    return <View style={styles.trailingSpacer} />;
  }, [currentUserId, followingUsers, group.totalCount, latest.actorId, latest.postImageURL, latest.type, onFollow]);

  const renderActors = useCallback(() => {
    const tone = getNotificationTone(group.type);
    const iconName = getNotificationIcon(group.type) as any;
    const visibleActors = group.actors.length > 0
      ? group.actors
      : [
          {
            userId: latest.actorId,
            username: latest.actorUsername,
            avatarURL: latest.actorAvatarURL,
            verified: latest.actorVerified,
          },
        ];

    const stackedActors = visibleActors.slice(0, 2);

    return (
      <View style={styles.avatarStackWrap}>
        <View style={styles.avatarStackInner}>
          {stackedActors.map((actor, index) => {
            const isSingle = stackedActors.length === 1;
            const isFrontAvatar = isSingle || index === stackedActors.length - 1;
            const avatarSize = isSingle ? 40 : 36;

            return (
              <View
                key={`${group.key}-actor-${actor.userId}`}
                style={[
                  styles.groupAvatar,
                  isSingle ? styles.groupAvatarSingle : index === 0 ? styles.groupAvatarBack : styles.groupAvatarFront,
                  { zIndex: isSingle ? 3 : index === 0 ? 1 : 2 },
                ]}
              >
                <Avatar source={actor.avatarURL} size={avatarSize} fallbackText={actor.username || '?'} />
                {isFrontAvatar ? (
                  <View style={[styles.activityBadge, { backgroundColor: tone }]}>
                    <Ionicons name={iconName} size={10} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [group.actors, group.key, group.type, latest.actorAvatarURL, latest.actorId, latest.actorUsername, latest.actorVerified]);

  const renderInlineActions = useCallback(() => {
    if (latest.type !== 'collaboration_request' || group.totalCount !== 1) return null;

    return (
      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity
          style={styles.secondaryPrimaryButton}
          activeOpacity={0.9}
          onPress={() => onAcceptCollaboration(latest)}
        >
          <Text style={styles.secondaryPrimaryButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryGhostButton}
          activeOpacity={0.9}
          onPress={() => onDeclineCollaboration(latest)}
        >
          <Text style={styles.secondaryGhostButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    );
  }, [group.totalCount, latest, onAcceptCollaboration, onDeclineCollaboration]);

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <TouchableOpacity style={styles.deleteAction} activeOpacity={0.92} onPress={() => onDelete(group)}>
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity
        style={[styles.notificationRow, !group.isRead && styles.notificationRowUnread]}
        onPress={() => onPress(group)}
        activeOpacity={0.88}
      >
        {renderActors()}

        <View style={styles.notificationBody}>
          <Text style={styles.notificationText} numberOfLines={2}>
            <Text style={styles.actorName}>{headline} </Text>
            <Text style={styles.notificationMessage}>{suffix}</Text>
            <Text style={styles.notificationTime}> {formatNotificationTime(latest.createdAt)}</Text>
          </Text>

          {preview ? (
            <Text style={styles.previewSnippet} numberOfLines={2}>
              {preview}
            </Text>
          ) : null}

          {renderInlineActions()}
        </View>

        <View style={styles.trailingWrap}>
          {!group.isRead ? <View style={styles.unreadDot} /> : null}
          {renderTrailing()}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#000000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  notificationRowUnread: {
    backgroundColor: '#090B10',
  },
  avatarStackWrap: {
    width: 64,
    height: 48,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  avatarStackInner: {
    width: 58,
    height: 44,
    position: 'relative',
  },
  groupAvatar: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
  },
  groupAvatarSingle: {
    left: 8,
    top: 1,
  },
  groupAvatarBack: {
    left: 0,
    top: 2,
  },
  groupAvatarFront: {
    left: 18,
    top: 8,
  },
  activityBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  notificationBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  actorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: typography.fontWeight.bold as any,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  notificationMessage: {
    color: '#F4F4F5',
  },
  notificationTime: {
    color: '#8E8E93',
    fontSize: 13,
  },
  previewSnippet: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  trailingWrap: {
    width: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A6BFF',
    marginBottom: 8,
  },
  previewImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#111111',
  },
  trailingSpacer: {
    width: 58,
    height: 58,
  },
  followButton: {
    minWidth: 94,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0095F6',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.fontWeight.bold as any,
  },
  followingButton: {
    backgroundColor: '#17191D',
    borderWidth: 1,
    borderColor: '#363636',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 11,
  },
  secondaryPrimaryButton: {
    minWidth: 78,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0095F6',
  },
  secondaryPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.bold as any,
  },
  secondaryGhostButton: {
    minWidth: 78,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17191D',
    borderWidth: 1,
    borderColor: '#363636',
  },
  secondaryGhostButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold as any,
  },
  deleteAction: {
    width: 96,
    marginVertical: 6,
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold as any,
    marginTop: 4,
  },
});
