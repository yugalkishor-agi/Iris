import { useCallback, useRef } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppNotification, NotificationGroup } from './notificationTypes';
import { notificationService } from '../../services/notification.service';
import { glimpseService } from '../../services/glimpse.service';
import { postService } from '../../services/post.service';
import { cacheIntegration } from '../../services/cacheIntegration.service';

interface UseNotificationActionsProps {
  currentUserId: string | null;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  autoReadIdsRef: React.MutableRefObject<Set<string>>;
  deliveredIdsRef: React.MutableRefObject<Set<string>>;
}

export function useNotificationActions({
  currentUserId,
  notifications,
  setNotifications,
  autoReadIdsRef,
  deliveredIdsRef,
}: UseNotificationActionsProps) {
  const prefetchedCommentThreadsRef = useRef<Set<string>>(new Set());

  const prefetchCommentThread = useCallback(async (notification: AppNotification) => {
    if (!notification.refId) return;
    if (notification.refType !== 'post' && notification.refType !== 'glimpse') return;
    const collectionType = notification.refType === 'glimpse' ? 'glimpses' : 'posts';
    const prefetchKey = collectionType + ':' + notification.refId;
    if (prefetchedCommentThreadsRef.current.has(prefetchKey)) return;
    prefetchedCommentThreadsRef.current.add(prefetchKey);
    const commentsCacheKey = 'comments_v3:' + collectionType + ':' + notification.refId;
    try {
      const cached = await cacheIntegration.getCachedData(commentsCacheKey);
      if (Array.isArray(cached) && cached.length > 0) {
        return;
      }
      const commentsColRef = collection(db, collectionType, notification.refId, 'comments');
      const commentsQuery = query(commentsColRef, orderBy('createdAt', 'desc'), limit(60));
      const snapshot = await getDocs(commentsQuery);
      const comments = snapshot.docs.map((docSnap) => ({
        commentId: docSnap.id,
        ...docSnap.data(),
        isLiked: false,
        isVerified: false,
      }));
      void cacheIntegration.cacheData(commentsCacheKey, comments, 5 * 60 * 1000);
    } catch (error) {
      prefetchedCommentThreadsRef.current.delete(prefetchKey);
      console.error('Failed to prefetch comment thread:', error);
    }
  }, []);

  const markGroupAsRead = useCallback(async (group: NotificationGroup) => {
    const unreadIds = group.notifications
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
      console.error('Failed to mark group as read:', error);
    }
  }, [autoReadIdsRef, setNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.notificationId);
      if (unreadIds.length === 0) return;
      unreadIds.forEach((notificationId) => autoReadIdsRef.current.add(notificationId));
      await notificationService.markManyAsRead(unreadIds);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [currentUserId, notifications, autoReadIdsRef, setNotifications]);

  const handleDeleteGroup = useCallback(async (group: NotificationGroup) => {
    try {
      const ids = group.notifications.map((notification) => notification.notificationId);
      await Promise.all(ids.map((notificationId) => notificationService.deleteNotification(notificationId)));
      ids.forEach((notificationId) => {
        deliveredIdsRef.current.delete(notificationId);
        autoReadIdsRef.current.delete(notificationId);
      });
      setNotifications((prev) => prev.filter((notification) => !ids.includes(notification.notificationId)));
    } catch (error) {
      console.error('Failed to delete notification group:', error);
    }
  }, [deliveredIdsRef, autoReadIdsRef, setNotifications]);

  const handleAcceptCollaboration = useCallback(async (notification: AppNotification) => {
    if (!currentUserId) return;
    try {
      if (notification.requestId && notification.glimpseId) {
        await glimpseService.acceptCollaboration(notification.requestId, notification.glimpseId, currentUserId);
      } else if (notification.requestId && notification.postId) {
        await postService.acceptCollaboration(notification.postId, notification.requestId, currentUserId);
      }
      setNotifications((prev) => prev.filter((item) => item.notificationId !== notification.notificationId));
    } catch (error) {
      console.error('Failed to accept collaboration request:', error);
    }
  }, [currentUserId, setNotifications]);

  const handleDeclineCollaboration = useCallback(async (notification: AppNotification) => {
    if (!currentUserId) return;
    try {
      if (notification.requestId && notification.glimpseId) {
        await glimpseService.rejectCollaboration(notification.requestId, notification.glimpseId, currentUserId);
      } else if (notification.requestId && notification.postId) {
        await postService.rejectCollaboration(notification.postId, notification.requestId);
      }
      await notificationService.deleteNotification(notification.notificationId);
      setNotifications((prev) => prev.filter((item) => item.notificationId !== notification.notificationId));
    } catch (error) {
      console.error('Failed to decline collaboration request:', error);
    }
  }, [currentUserId, setNotifications]);

  return {
    prefetchCommentThread,
    markGroupAsRead,
    handleMarkAllAsRead,
    handleDeleteGroup,
    handleAcceptCollaboration,
    handleDeclineCollaboration,
  };
}
