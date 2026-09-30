import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../../services/notification.service';
// @ts-ignore
import { ActivityItem, ActivityFilter } from './types';

export function useActivityData(user: any) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const loadActivities = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const notifs = await notificationService.getUserNotifications(user.userId, 50);
      const mapped: ActivityItem[] = (notifs || []).map((n: any) => ({
        id: n.notificationId || n.id,
        type: (n.type === 'story_like' ? 'like' : n.type) as ActivityItem['type'],
        user: {
          userId: n.actorId,
          username: n.actorUsername,
          displayName: n.actorUsername,
          avatarURL: n.actorAvatarURL,
        },
        content: n.refId
          ? {
              id: n.refId,
              type: (n.refType === 'glimpse' ? 'glimpse' : n.refType === 'story' ? 'story' : 'post') as 'post' | 'glimpse' | 'story',
              mediaURL: n.refMediaURL,
              caption: n.refPreview,
            }
          : undefined,
        timestamp: n.createdAt?.toDate ? n.createdAt.toDate() : (n.createdAt || new Date()),
        isRead: !!n.isRead,
      }));

      const filtered = filter === 'unread' ? mapped.filter(a => !a.isRead) : mapped;
      setActivities(filtered);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const markAsReadLocally = useCallback((activityId: string) => {
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, isRead: true } : a));
  }, []);

  return {
    activities,
    loading,
    refreshing,
    filter,
    setFilter,
    handleRefresh,
    markAsReadLocally,
  };
}
