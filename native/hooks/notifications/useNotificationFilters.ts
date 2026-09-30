import { useMemo, useState } from 'react';
import { AppNotification, FeedItem, FilterTab, NotificationGroup } from './notificationTypes';
import { buildAggregationKey, buildGroupActors, getBucketMeta, normalizeTime } from '../../utils/notifications/notificationUtils';

const MAX_BUCKETS = 30;

export function useNotificationFilters(
  notifications: AppNotification[],
  isPrivateAccount: boolean
) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredNotifications = useMemo(() => {
    const base = notifications.filter((notification) => notification.type !== 'dm');
    const byFilter = activeFilter === 'comments'
      ? base.filter((notification) => notification.type === 'comment')
      : base;

    if (isPrivateAccount) {
      return byFilter.filter((notification) => notification.type !== 'follow_request');
    }

    return byFilter;
  }, [activeFilter, isPrivateAccount, notifications]);

  const groupedFeedItems = useMemo<FeedItem[]>(() => {
    const sectionOrder: string[] = [];
    const sectionMeta = new Map<string, { title: string; order: number; groups: Map<string, NotificationGroup> }>();

    for (const notification of filteredNotifications) {
      const bucket = getBucketMeta(notification.createdAt);
      if (!sectionMeta.has(bucket.key)) {
        if (sectionOrder.length >= MAX_BUCKETS) break;
        sectionOrder.push(bucket.key);
        sectionMeta.set(bucket.key, {
          title: bucket.title,
          order: bucket.order,
          groups: new Map(),
        });
      }

      const section = sectionMeta.get(bucket.key);
      if (!section) continue;

      const aggregationKey = buildAggregationKey(notification);
      const existing = section.groups.get(aggregationKey);
      if (existing) {
        existing.notifications.push(notification);
        existing.totalCount += 1;
        existing.isRead = existing.isRead && notification.isRead;
      } else {
        section.groups.set(aggregationKey, {
          key: `${bucket.key}:${aggregationKey}`,
          bucketKey: bucket.key,
          bucketTitle: bucket.title,
          type: notification.type,
          refType: notification.refType,
          refId: notification.refId,
          latestNotification: notification,
          notifications: [notification],
          actors: [],
          totalCount: 1,
          isRead: notification.isRead,
        });
      }
    }

    const items: FeedItem[] = [];
    sectionOrder.forEach((sectionKey) => {
      const section = sectionMeta.get(sectionKey);
      if (!section) return;

      const groups = Array.from(section.groups.values())
        .map((group) => ({
          ...group,
          actors: buildGroupActors(group.notifications),
        }))
        .sort((a: NotificationGroup, b: NotificationGroup) => normalizeTime(b.latestNotification.createdAt) - normalizeTime(a.latestNotification.createdAt));

      if (groups.length === 0) return;
      items.push({ kind: 'header', key: `header-${sectionKey}`, title: section.title });
      groups.forEach((group) => items.push({ kind: 'group', key: group.key, group }));
    });

    return items;
  }, [filteredNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  return {
    activeFilter,
    setActiveFilter,
    groupedFeedItems,
    unreadCount,
  };
}
