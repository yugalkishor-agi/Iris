import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Animated } from 'react-native';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../config/firebase';
import { cacheIntegration } from '../../services/cacheIntegration.service';
import { AppNotification, AppNotificationType } from './notificationTypes';
import { normalizeTime, sanitizePreviewImageURL } from '../../utils/notifications/notificationUtils';
import { notificationService } from '../../services/notification.service';

const NOTIFICATIONS_CACHE_TTL = 5 * 60 * 1000;

export function useNotificationsList(currentUserId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimatedInRef = useRef(false);
  const deliveredIdsRef = useRef<Set<string>>(new Set());
  const autoReadIdsRef = useRef<Set<string>>(new Set());
  const notificationsRef = useRef<AppNotification[]>([]);

  const notificationsCacheKey = currentUserId ? `notifications_enhanced_v2:${currentUserId}` : '';

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const mapNotification = useCallback((n: any): AppNotification => {
    const type: AppNotificationType = n.type;
    const fallbackMessage = (() => {
      switch (type) {
        case 'like':
          if (n.commentId || n.parentCommentId || n.targetCommentId || n.refType === 'comment') return 'liked your comment';
          if (n.refType === 'glimpse') return 'liked your glimpse';
          if (n.refType === 'story') return 'liked your story';
          return 'liked your post';
        case 'comment':
          if (n.parentCommentId || n.targetCommentId) return n.refPreview ? `replied to your comment: ${n.refPreview}` : 'replied to your comment';
          return n.refPreview ? `commented: ${n.refPreview}` : 'commented on your post';
        case 'follow':
          return 'started following you';
        case 'follow_request':
          return 'requested to follow you';
        case 'mention':
          return 'mentioned you';
        case 'story_like':
          return 'liked your story';
        case 'story_view':
          return 'viewed your story';
        case 'story_reply':
          return n.refPreview ? `replied: ${n.refPreview}` : 'replied to your story';
        case 'collaboration_request':
          return n.refType === 'glimpse' || n.glimpseId ? 'wants to collaborate on your glimpse' : 'wants to collaborate on your post';
        default:
          return '';
      }
    })();

    return {
      notificationId: n.notificationId || n.id,
      type,
      actorId: n.actorId,
      actorUsername: n.actorUsername,
      actorAvatarURL: n.actorAvatarURL,
      actorVerified: n.actorVerified,
      message: n.message || fallbackMessage,
      previewText: typeof n.refPreview === 'string' ? n.refPreview : undefined,
      createdAt: n.createdAt,
      isRead: n.isRead ?? n.read ?? false,
      postId: n.postId || (n.refType === 'post' ? n.refId : undefined),
      requestId: n.requestId,
      glimpseId: n.glimpseId || (n.refType === 'glimpse' ? n.refId : undefined),
      postImageURL: sanitizePreviewImageURL(n.refMediaURL || n.previewImageURL || n.glimpseCoverURL || n.postImageURL || n.coverImageURL || n.thumbnailURL) || undefined,
      refType: n.refType,
      refId: n.refId,
      commentId: n.commentId,
      parentCommentId: n.parentCommentId,
      targetCommentId: n.targetCommentId,
    };
  }, []);

  const markVisibleAsDelivered = useCallback(async (items: AppNotification[]) => {
    const deliverIds = items
      .map((notification) => notification.notificationId)
      .filter((notificationId) => notificationId && !deliveredIdsRef.current.has(notificationId));

    if (deliverIds.length === 0) return;

    deliverIds.forEach((notificationId) => deliveredIdsRef.current.add(notificationId));

    try {
      await notificationService.markNotificationsAsDeliveredByIds(deliverIds);
    } catch (error) {
      console.error('Failed to mark notifications as delivered:', error);
    }
  }, []);

  const markVisibleAsRead = useCallback(async (items: AppNotification[]) => {
    const unreadIds = items
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.notificationId)
      .filter((notificationId) => notificationId && !autoReadIdsRef.current.has(notificationId));

    if (unreadIds.length === 0) return;

    unreadIds.forEach((notificationId) => autoReadIdsRef.current.add(notificationId));
    setNotifications((prev) => prev.map((notification) => (
      unreadIds.includes(notification.notificationId) ? { ...notification, isRead: true } : notification
    )));

    try {
      await notificationService.markManyAsRead(unreadIds);
    } catch (error) {
      console.error('Failed to auto mark notifications as read:', error);
    }
  }, []);

  const applyNotificationSnapshot = useCallback((snapshot: any) => {
    const mapped: AppNotification[] = snapshot.docs
      .map((docSnap: any) => mapNotification({ ...docSnap.data(), notificationId: docSnap.id }))
      .filter((notification: AppNotification) => notification.type !== 'dm')
      .sort((a: AppNotification, b: AppNotification) => normalizeTime(b.createdAt) - normalizeTime(a.createdAt));

    setNotifications(mapped);
    setLoading(false);
    if (notificationsCacheKey) {
      void cacheIntegration.cacheData(notificationsCacheKey, mapped, NOTIFICATIONS_CACHE_TTL);
    }

    if (!hasAnimatedInRef.current) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        hasAnimatedInRef.current = true;
      });
    } else {
      fadeAnim.setValue(1);
    }

    void markVisibleAsDelivered(mapped);
    void markVisibleAsRead(mapped);
  }, [fadeAnim, mapNotification, markVisibleAsDelivered, markVisibleAsRead, notificationsCacheKey]);

  useLayoutEffect(() => {
    if (!notificationsCacheKey) return;
    const cached = cacheIntegration.peekCachedData(notificationsCacheKey) as AppNotification[] | null;
    if (!Array.isArray(cached) || cached.length === 0) return;
    setNotifications(cached);
    notificationsRef.current = cached;
    setLoading(false);
    fadeAnim.setValue(1);
    hasAnimatedInRef.current = true;
  }, [fadeAnim, notificationsCacheKey]);

  useEffect(() => {
    deliveredIdsRef.current.clear();
    autoReadIdsRef.current.clear();
    hasAnimatedInRef.current = false;
    fadeAnim.setValue(0);
    if (notificationsRef.current.length === 0) {
      setLoading(true);
    }
    if (!notificationsCacheKey) {
      return;
    }
    let active = true;
    cacheIntegration.getCachedData(notificationsCacheKey)
      .then((cached) => {
        if (!active || !Array.isArray(cached) || cached.length === 0) return;
        const seeded = cached as AppNotification[];
        setNotifications(seeded);
        setLoading(false);
        fadeAnim.setValue(1);
        hasAnimatedInRef.current = true;
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [fadeAnim, notificationsCacheKey]);

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return;

      let isActive = true;
      if (notificationsRef.current.length === 0) {
        setLoading(true);
      }

      const notificationsColRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsColRef,
        where('userId', '==', currentUserId),
        orderBy('createdAt', 'desc'),
        limit(90)
      );

      const unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          if (!isActive) return;
          void applyNotificationSnapshot(snapshot);
        },
        (error) => {
          if (!isActive) return;
          console.error('Failed to subscribe notifications:', error);
          setLoading(false);
        }
      );

      return () => {
        isActive = false;
        try {
          unsubscribe();
        } catch {}
      };
    }, [applyNotificationSnapshot, currentUserId])
  );

  return {
    notifications,
    setNotifications,
    loading,
    fadeAnim,
    autoReadIdsRef,
    deliveredIdsRef
  };
}
