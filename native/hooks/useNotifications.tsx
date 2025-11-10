import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Real-time listener for notifications (exclude DM messages)
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.userId),
      where('type', '!=', 'dm'),
      orderBy('type'),
      orderBy('createdAt', 'desc')
    );
    
    // NOTE: Due to Firestore limitation, when using '!=' we must orderBy that field first
    // Then we sort in-memory by createdAt to get newest first

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allNotifications = snapshot.docs
          .map((doc) => doc.data() as Notification)
          .filter(n => n.actorUsername && n.actorUsername.trim() !== '') // Filter out invalid notifications
          .sort((a, b) => {
            // Sort by createdAt descending (newest first)
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });
        
        setNotifications(allNotifications);
        
        // Calculate unread count (excluding DM notifications)
        const count = allNotifications.filter(n => !n.isRead).length;
        setUnreadCount(count);
        
        setLoading(false);
      },
      (err) => {
        console.error('Notifications listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.userId);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.notificationId !== notificationId)
      );
    } catch (error) {
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
